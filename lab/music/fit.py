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
    # outro: the last downbeat (in the second half, after the drop when there is one) with a sustained fall:
    # the next 2 s at least 3 dB below the previous 2 s
    lo = max(dur * 0.4, drop + 2 if drop_rise >= 4 else 0)
    falls = [(mean_db(d - 2, d) - mean_db(d, d + 2), d) for d in downbeats if lo <= d <= end_t - 1.5]
    good = [d for f, d in falls if f >= 3]
    outro = float(good[0]) if good else None
    # key (Krumhansl profiles on the whole bed): the signature is built in it
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr).mean(1)
    sc = [(np.corrcoef(np.roll(maj, i), chroma)[0, 1], names[i], "major") for i in range(12)] + \
         [(np.corrcoef(np.roll(mnr, i), chroma)[0, 1], names[(i + 3) % 12], "minor→relative major") for i in range(12)]
    _, tonic, mode = max(sc)
    return {"path": path, "key": tonic, "key_mode": mode, "duration": dur, "tempo": tempo, "beat": beat, "bar": 4 * beat, "downbeats": downbeats.tolist(),
            "drop": float(drop), "drop_rise_db": round(drop_rise, 1), "outro": outro, "end": end_t}


def plan(a: dict, cues: dict, hold: float) -> dict:
    """Pick how the bed meets the video. Three strategies, best first:
    drop  — a strong drop (≥ 4 dB rise) lands on the key cue; the song's own outro is joined on a downbeat near the end;
    end   — the bed's natural ending lands on the last frame, shifted (< 1 bar) so a downbeat sits on the key cue;
    fade  — the bed is too short or has neither: start at its beginning, a downbeat on the key, fade over the last 2 bars."""
    key = next((c["t"] for c in cues["cues"] if c["kind"] == "key"), 0.0)
    outro_cue = next((c["t"] for c in cues["cues"] if c["kind"] == "outro"), cues["duration"] - 2.5)
    total = cues["duration"] + hold
    bar, db = a["bar"], np.array(a["downbeats"])
    p = {"key": key, "outro_cue": outro_cue, "total": round(total, 3)}

    def splice_plan(offset):
        tail = a["end"] - a["outro"]
        ks = [key + k * bar for k in range(0, 64) if key + k * bar <= total - min(tail, total - key) + 0.6 * bar]
        ok = [s for s in ks if s >= outro_cue - bar] or ks[-1:]
        splice = ok[-1] if ok else total - tail
        return {"mode": "drop", "offset": round(offset, 3), "splice": round(splice, 3), "outro_from": round(a["outro"], 3),
                "tail": round(tail, 3), "ends_at": round(min(total, splice + tail), 3)}

    off = a["drop"] - key
    if a["drop_rise_db"] >= 4 and off >= 0:
        if a["outro"] and a["outro"] > a["drop"]:
            p.update(splice_plan(off)); return p
        if off + total <= a["end"] + 0.25:
            p.update({"mode": "drop-fade", "offset": round(off, 3), "fade_from": round(total - 2 * bar, 3)}); return p
    natural = a["end"] - total
    if natural >= 0:
        cand = db[(db - key >= 0)]
        if len(cand):
            off = float(cand[np.argmin(np.abs((cand - key) - natural))] - key)
            if abs(off - natural) <= 0.6 * bar:
                p.update({"mode": "end", "offset": round(off, 3), "ends_at": round(a["end"] - off, 3)}); return p
    off = float(db[db - key >= 0][0] - key) if (db - key >= 0).any() else 0.0
    p.update({"mode": "fade", "offset": round(max(off, 0.0), 3), "fade_from": round(total - 2 * bar, 3)})
    return p


def render_audio(bed: str, a: dict, p: dict, sfx_plan: str | None) -> np.ndarray:
    y, _ = librosa.load(bed, sr=SR, mono=False)
    if y.ndim == 1:
        y = np.stack([y, y])
    n = int(p["total"] * SR)
    out = np.zeros((2, n))
    off = int(p["offset"] * SR)
    if p["mode"] == "drop":
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
        if p["mode"] in ("fade", "drop-fade"):
            f0 = int(p["fade_from"] * SR)
            out[:, f0:] *= np.linspace(1, 0, n - f0) ** 1.5
        else:                                       # end: the bed's own ending; just guard the last 60 ms
            k = int(0.06 * SR)
            out[:, -k:] *= np.linspace(1, 0, k)
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


def qa(out: str, m: dict, total: float) -> list[str]:
    """Problems a listener would notice (empty = pass). Thresholds are our proposals (research: no standard)."""
    with tempfile.TemporaryDirectory() as tmp:          # librosa can't read MP4: decode the final audio first
        w = os.path.join(tmp, "qa.wav")
        ffmpeg("-i", out, "-vn", "-ac", "1", "-ar", "16000", w)
        y, sr = librosa.load(w, sr=16000, mono=True)
    hop = int(0.05 * sr)
    db = 20 * np.log10(librosa.feature.rms(y=y, frame_length=hop, hop_length=hop)[0] + 1e-9)
    t = np.arange(len(db)) * 0.05
    issues = []
    if db[t < 0.15].max() < -40:
        issues.append("silent start: no sound in the first 0.15 s (research: sound from frame 1)")
    mid = (t > 0.3) & (t < total - 1.5)
    quiet = db[mid] < -45
    run = longest = 0
    for q in quiet:
        run = run + 1 if q else 0
        longest = max(longest, run)
    if longest * 0.05 >= 0.3:
        issues.append(f"dropout: {longest * 0.05:.2f} s of near-silence inside the music")
    tail = db[t > total - 0.3]
    if len(tail) and tail.max() > -18 and db[(t > total - 1.2) & (t < total - 0.6)].mean() - tail.mean() < 2:
        issues.append("abrupt end: still loud in the last 0.3 s (no ending)")
    if m["true_peak_db"] > -0.3:
        issues.append(f"true peak {m['true_peak_db']} dB (aim ≤ −1)")
    if abs(m["lufs"] + 14) > 1:
        issues.append(f"loudness {m['lufs']} LUFS (aim −14 ± 1)")
    return issues


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("bed"); ap.add_argument("video"); ap.add_argument("out")
    ap.add_argument("--cues", help="default: <video without .mp4>.cues.json")
    ap.add_argument("--hold", type=float, default=2.0)
    ap.add_argument("--sfx", help="SFX plan JSON (lab/sfx/plan.py)")
    ap.add_argument("--signature", help="signature id (lab/sfx/signature.py MOTIFS), built in the bed's key, at the outro cue")
    a = ap.parse_args()
    cues = json.load(open(a.cues or a.video[:-4] + ".cues.json"))
    an = analyse(a.bed)
    p = plan(an, cues, a.hold)
    audio = render_audio(a.bed, an, p, a.sfx)
    if a.signature:
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../sfx"))
        from signature import MOTIFS, build
        sig = build(MOTIFS[a.signature], an["key"], an["tempo"])
        at = next((c["t"] for c in cues["cues"] if c["kind"] == "outro"), p["total"] - 2.5)
        if p["mode"] == "drop":
            at = p["splice"]                         # where the song's own outro starts (a downbeat)
        s0 = int(at * SR)
        seg = sig[: audio.shape[1] - s0] * 10 ** (-5 / 20)
        audio[:, s0: s0 + len(seg)] += seg
        p["signature"] = {"id": a.signature, "key": an["key"], "at": round(at, 3)}
    m = master_and_mux(audio, a.video, a.out, a.hold, p["total"])
    issues = qa(a.out, m, p["total"])
    rep = {"qa": issues or "ok", "bed": os.path.basename(a.bed), "tempo": round(an["tempo"], 1), "drop": round(an["drop"], 3),
           "drop_rise_db": an["drop_rise_db"], "bed_outro": an["outro"], "bed_key": f'{an["key"]} ({an["key_mode"]})', **p, **m, "sfx": a.sfx}
    json.dump(rep, open(a.out[:-4] + ".fit.json", "w"), indent=1)
    print(json.dumps(rep))


if __name__ == "__main__":
    main()
