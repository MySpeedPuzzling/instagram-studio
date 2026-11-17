"""Fit a music bed (and optional SFX) to a rendered motion video, automatically (owner 16 Nov: the music has to hit
the video). What was done by hand for the week-46 Story (MU1 fit2), as a script:

  1. analyse the bed: beats (librosa), downbeats (the beat phase with the strongest onsets), the drop (biggest
     sustained energy rise, on a downbeat) and the song's own outro (last sustained energy fall, on a downbeat);
  2. read the video's cues (<video>.cues.json from the motion kit): `key` = where the drop lands, `outro` = from where
     the music may resolve;
  3. drop on the key cue; the main part runs to a downbeat, then the song's own outro is joined on that downbeat
     (short crossfade) so the ending lands on the last frame (the last frame is held --hold s for the sticker);
  4. optional SFX layer from a cue → sample map (lab/sfx), with the music dipped a little under each hit;
  5. two-pass loudnorm to −14 LUFS, true-peak limiter, AAC 128k; report JSON next to the output.

    uvx --with librosa --with soundfile python lab/music/fit.py BED.flac VIDEO.mp4 OUT.mp4 [--hold 2] [--sfx PLAN.json]
"""
import argparse, json, os, subprocess, sys, tempfile

import librosa
import numpy as np
import soundfile as sf

SR = 48000


def analyse(path: str) -> dict:
    y, sr = librosa.load(path, sr=22050, mono=True)
    dur = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
    tempo = float(np.atleast_1d(tempo)[0])
    beats = np.asarray(beats)
    if len(beats) < 8:
        raise SystemExit(f"{path}: too few beats found")
    beat = float(np.median(np.diff(beats)))
    # downbeat phase: of the 4 phases, the one whose beats carry the most onset energy
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    ot = librosa.times_like(onset, sr=sr)
    strength = np.interp(beats, ot, onset)
    phase = int(np.argmax([strength[p::4].sum() for p in range(4)]))
    downbeats = beats[phase::4]
    # energy curve in 0.25 s steps (dB), smoothed over 1 s
    hop = int(0.25 * sr)
    rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-9)
    t = np.arange(len(db)) * 0.25
    sm = np.convolve(db, np.ones(4) / 4, mode="same")
    loud = sm > sm.max() - 30
    end_t = float(t[np.where(loud)[0][-1]] + 0.25) if loud.any() else dur
    # drop: the downbeat with the biggest rise (mean of the next 2 s minus mean of the previous 2 s), after 1.5 s
    def mean_db(a, b):
        m = (t >= a) & (t < b)
        return float(sm[m].mean()) if m.any() else -120.0
    cands = [d for d in downbeats if 1.5 <= d <= end_t - 6]
    rises = [(mean_db(d, d + 2) - mean_db(d - 2, d), d) for d in cands]
    drop_rise, drop = max(rises) if rises else (0.0, float(downbeats[0]))
    # outro: the last downbeat after the drop with a sustained fall (next 2 s at least 3 dB below the previous 2 s)
    falls = [(mean_db(d - 2, d) - mean_db(d, d + 2), d) for d in downbeats if drop + 4 <= d <= end_t - 1.5]
    good = [d for f, d in falls if f >= 3]
    outro = float(good[-1]) if good else None
    return {"path": path, "duration": dur, "tempo": tempo, "beat": beat, "bar": 4 * beat, "downbeats": downbeats.tolist(),
            "drop": float(drop), "drop_rise_db": round(drop_rise, 1), "outro": outro, "end": end_t}


def plan(a: dict, cues: dict, hold: float) -> dict:
    key = next((c["t"] for c in cues["cues"] if c["kind"] == "key"), 0.0)
    outro_cue = next((c["t"] for c in cues["cues"] if c["kind"] == "outro"), cues["duration"] - 2.5)
    total = cues["duration"] + hold
    offset = a["drop"] - key                      # bed time = video time + offset
    if offset < 0:                                # drop earlier than the key: start on a later downbeat drop
        later = [d for d in a["downbeats"] if d - key >= 0]
        offset = (later[0] - key) if later else 0.0
    bar = a["bar"]
    p = {"key": key, "outro_cue": outro_cue, "total": round(total, 3), "offset": round(offset, 3)}
    if a["outro"]:
        tail = a["end"] - a["outro"]
        # splice points: video times where the bed is on a downbeat (key + k bars); the latest one that still leaves
        # room for the song's outro tail, but not before the outro cue minus one bar
        # (the tail may run past the end by up to 60 % of a bar: its last part is quiet and gets a short soft fade)
        ks = [key + k * bar for k in range(0, 64) if key + k * bar <= total - min(tail, total - key) + 0.6 * bar]
        ok = [s for s in ks if s >= outro_cue - bar] or ks[-1:]
        splice = ok[-1] if ok else total - tail
        p.update({"mode": "own-outro", "splice": round(splice, 3), "outro_from": round(a["outro"], 3),
                  "tail": round(tail, 3), "ends_at": round(min(total, splice + tail), 3)})
    else:
        p.update({"mode": "fade", "fade_from": round(total - 2 * bar, 3)})
    return p


def render_audio(bed: str, a: dict, p: dict, sfx_plan: str | None) -> np.ndarray:
    y, _ = librosa.load(bed, sr=SR, mono=False)
    if y.ndim == 1:
        y = np.stack([y, y])
    n = int(p["total"] * SR)
    out = np.zeros((2, n))
    off = int(p["offset"] * SR)
    if p["mode"] == "own-outro":
        sv = int(p["splice"] * SR)
        xf = int(0.08 * SR)
        main = y[:, off: off + sv + xf]
        out[:, : main.shape[1]] += main[:, : n]
        o0 = int(p["outro_from"] * SR)
        tail = y[:, o0: o0 + (n - sv)]
        ramp = np.linspace(0, 1, xf)
        out[:, sv: sv + xf] *= 1 - ramp            # crossfade: main fades out over 80 ms around the downbeat …
        tail = tail.copy()
        tail[:, :xf] *= ramp                        # … while the outro fades in
        out[:, sv: sv + tail.shape[1]] += tail[:, : n - sv]
        if p["ends_at"] >= p["total"] - 0.05:       # outro longer than the room left: soften the last 0.4 s
            k = int(0.4 * SR)
            out[:, -k:] *= np.linspace(1, 0, k) ** 2
    else:
        seg = y[:, off: off + n]
        out[:, : seg.shape[1]] += seg
        f0 = int(p["fade_from"] * SR)
        out[:, f0:] *= np.linspace(1, 0, n - f0) ** 1.5
    out[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    if sfx_plan:
        out = mix_sfx(out, json.load(open(sfx_plan)))
    return out


def mix_sfx(music: np.ndarray, plan: dict) -> np.ndarray:
    """plan = {"music_gain_db": -2, "duck_db": 4, "hits": [{"t": 3.6, "file": "...wav", "gain_db": -6, "pitch": 0}]}"""
    n = music.shape[1]
    sfx = np.zeros_like(music)
    duck = np.ones(n)
    for h in plan["hits"]:
        x, _ = librosa.load(h["file"], sr=SR, mono=False)
        if x.ndim == 1:
            x = np.stack([x, x])
        if h.get("pitch"):
            x = np.stack([librosa.effects.pitch_shift(c, sr=SR, n_steps=h["pitch"]) for c in x])
        x = x * 10 ** (h.get("gain_db", 0) / 20)
        s = int(h["t"] * SR) - int(h.get("lead", 0.0) * SR)
        if s >= n:
            continue
        s0 = max(s, 0)
        seg = x[:, s0 - s: s0 - s + (n - s0)]
        sfx[:, s0: s0 + seg.shape[1]] += seg
        d = int(min(0.35, x.shape[1] / SR) * SR)       # dip the music under the hit, recover over 350 ms
        e = min(n, s0 + d)
        duck[s0:e] = np.minimum(duck[s0:e], 1 - (1 - 10 ** (-plan.get("duck_db", 4) / 20)) * np.linspace(1, 0, e - s0))
    for g in plan.get("gaps", []):                     # the music steps back (fast 60 ms dip, 250 ms recovery)
        a0, a1 = int(g["t"] * SR), int((g["t"] + g["dur"]) * SR)
        lo = 10 ** (-g["db"] / 20)
        r_in, r_out = int(0.06 * SR), int(0.25 * SR)
        for i0, i1, v0, v1 in [(a0 - r_in, a0, 1, lo), (a0, a1, lo, lo), (a1, a1 + r_out, lo, 1)]:
            i0c, i1c = max(0, i0), min(n, i1)
            if i1c > i0c:
                seg = np.linspace(v0, v1, i1 - i0)[i0c - i0: i1c - i0]
                duck[i0c:i1c] = np.minimum(duck[i0c:i1c], seg)
    return music * 10 ** (plan.get("music_gain_db", 0) / 20) * duck + sfx


def ffmpeg(*args: str) -> str:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-1500:])
    return r.stderr


def master_and_mux(audio: np.ndarray, video: str, out: str, hold: float, total: float) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "a.wav")
        sf.write(wav, audio.T, SR, subtype="FLOAT")  # float: no clipping before the limiter
        pre = "highpass=f=60"
        err = ffmpeg("-i", wav, "-af", f"{pre},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-")
        j = json.loads(err[err.rindex("{"): err.rindex("}") + 1])
        ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
              f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
        vid = os.path.join(tmp, "v.mp4")
        ffmpeg("-i", video, "-vf", f"tpad=stop_mode=clone:stop_duration={hold}", "-an", "-c:v", "libx264", "-preset", "slow",
               "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", "30", "-crf", "8", vid)
        ffmpeg("-i", vid, "-i", wav, "-filter_complex",
               f"[1:a]{pre},{ln},aresample=192000,alimiter=limit=0.75:attack=1:release=50:level=false,aresample=48000[a]",
               "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
               "-movflags", "+faststart", "-t", f"{total:.3f}", out)
    m = ffmpeg("-i", out, "-af", "ebur128=peak=true", "-f", "null", "-")
    tail = m[m.rindex("Summary:"):]
    get = lambda key: float(tail.split(key)[1].split()[0])
    return {"lufs": get("I:"), "true_peak_db": get("Peak:")}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("bed"); ap.add_argument("video"); ap.add_argument("out")
    ap.add_argument("--cues", help="default: <video without .mp4>.cues.json")
    ap.add_argument("--hold", type=float, default=2.0)
    ap.add_argument("--sfx", help="SFX plan JSON (lab/sfx/plan.py)")
    a = ap.parse_args()
    cues = json.load(open(a.cues or a.video[:-4] + ".cues.json"))
    an = analyse(a.bed)
    p = plan(an, cues, a.hold)
    audio = render_audio(a.bed, an, p, a.sfx)
    m = master_and_mux(audio, a.video, a.out, a.hold, p["total"])
    rep = {"bed": os.path.basename(a.bed), "tempo": round(an["tempo"], 1), "drop": round(an["drop"], 3),
           "drop_rise_db": an["drop_rise_db"], "bed_outro": an["outro"], **p, **m, "sfx": a.sfx}
    json.dump(rep, open(a.out[:-4] + ".fit.json", "w"), indent=1)
    print(json.dumps(rep))


if __name__ == "__main__":
    main()
