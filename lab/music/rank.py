"""Rank a lab's fitted candidates before the owner listens (report: Music tailored to each video.md): hard fails
first, then "it hits" (cue hits on the bar grid, energy rising into `key` and falling under `outro`), sound quality
last (Audiobox Aesthetics tie-breaker: optional, owner OK 18 Nov, repo notice only; not wired in yet).

    uvx --with librosa --with soundfile python lab/music/rank.py LAB
Writes content/labs/<LAB>/rank.json: per target video, candidates best first, with the reasons.
"""
import json, os, subprocess, sys, tempfile

import librosa
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))


def energy(mp4: str) -> tuple[np.ndarray, float]:
    with tempfile.TemporaryDirectory() as tmp:
        w = os.path.join(tmp, "a.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vn", "-ac", "1", "-ar", "16000", w], check=True)
        y, sr = librosa.load(w, sr=16000)
    hop = int(0.1 * sr)
    return 20 * np.log10(librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0] + 1e-9), 0.1


def main() -> None:
    lab = sys.argv[1]
    d = os.path.join(ROOT, "content/labs", lab)
    vocals = json.load(open(os.path.join(d, "vocals.json"))) if os.path.exists(os.path.join(d, "vocals.json")) else {}
    groups: dict[str, list] = {}
    for f in sorted(os.listdir(os.path.join(d, "out"))):
        if not f.endswith(".fit.json"):
            continue
        fit = json.load(open(os.path.join(d, "out", f)))
        mp4 = os.path.join(d, "out", f.replace(".fit.json", ".mp4"))
        cid = f.replace(".fit.json", "")
        target = cid.rsplit("-", 1)[-1]
        fails = []
        if isinstance(fit.get("qa"), list):
            fails += fit["qa"]
        bed = next((k for k in vocals if cid.startswith(k)), None)
        if bed and vocals[bed].get("flag"):
            fails.append(f"vocals {vocals[bed]['vocal_db']} dB")
        hits = fit.get("hits_ms") or {}
        for k, ms in hits.items():
            if ms > 60:
                fails.append(f"{k} {ms} ms off the bar")
        e, step = energy(mp4)
        t = lambda s: int(s / step)
        key, outro = fit["key"], fit.get("outro_cue")
        rise = float(e[t(key): t(key + 1.5)].mean() - e[max(0, t(key - 1.5)): t(key)].mean())
        fall = float(e[max(0, t(outro - 1.5)): t(outro)].mean() - e[t(outro): t(outro + 2)].mean()) if outro else 0.0
        hit_score = -np.mean(list(hits.values())) / 20 if hits else 0
        score = round(hit_score + min(rise, 6) * 0.6 + min(fall, 6) * 0.4 - 5 * len(fails), 2)
        groups.setdefault(target, []).append({"id": cid, "score": score, "fails": fails, "hits_ms": hits,
                                              "rise_into_key_db": round(rise, 1), "fall_under_outro_db": round(fall, 1),
                                              "mode": fit.get("mode"), "stretch": fit.get("stretch")})
    for g in groups.values():
        g.sort(key=lambda r: -r["score"])
    json.dump(groups, open(os.path.join(d, "rank.json"), "w"), indent=1)
    for target, g in groups.items():
        print(f"== {target}")
        for i, r in enumerate(g, 1):
            print(f"{i}. {r['id']}  score {r['score']}  hits {r['hits_ms']}  rise {r['rise_into_key_db']} dB  fall {r['fall_under_outro_db']} dB"
                  + (f"  FAILS: {'; '.join(r['fails'])}" if r["fails"] else ""))


if __name__ == "__main__":
    main()
