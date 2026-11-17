"""Vocal check for generated beds (unattended QA): ACE-Step can sing the tag text. Demucs (MIT) splits out a vocal
stem; we report how loud it is against the rest. Calibration (18 Nov, n=1): the clean MU1 s202 bed is −44 dB overall;
its loudest second is −9.5 dB too (lead synths bleed into the vocal stem), so only the overall level is used: above
−25 dB = listen before use. A first guess, to tighten with more owner-checked beds.

    uvx --from demucs --with soundfile --with librosa python lab/music/vocal_check.py LAB   (CPU, ~1 min per bed)
Writes content/labs/<LAB>/vocals.json.
"""
import json, os, subprocess, sys, tempfile

import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))


def ratio(v: np.ndarray, r: np.ndarray, sr: int) -> tuple[float, float]:
    db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    overall = db(v) - db(r)
    w = sr
    worst = max(db(v[i:i + w]) - db(r[i:i + w]) for i in range(0, max(1, len(v) - w), w // 2))
    return round(overall, 1), round(worst, 1)


def main() -> None:
    lab = sys.argv[1]
    d = os.path.join(ROOT, "content/labs", lab)
    out_path = os.path.join(d, "vocals.json")
    res = json.load(open(out_path)) if os.path.exists(out_path) else {}
    for c in json.load(open(os.path.join(d, "clips.json"))):
        if c["id"] in res:
            continue
        bed = os.path.join(ROOT, c["file"].lstrip("/"))
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(["demucs", "-n", "htdemucs", "--two-stems=vocals", "-d", "cpu", "-o", tmp, bed], capture_output=True, check=True)
            stem = os.path.join(tmp, "htdemucs", os.path.splitext(os.path.basename(bed))[0])
            v, sr = sf.read(os.path.join(stem, "vocals.wav")); r, _ = sf.read(os.path.join(stem, "no_vocals.wav"))
        o, w = ratio(v.mean(1) if v.ndim > 1 else v, r.mean(1) if r.ndim > 1 else r, sr)
        res[c["id"]] = {"vocal_db": o, "worst_second_db": w, "flag": o > -25}
        json.dump(res, open(out_path, "w"), indent=1)
        print(f"{c['id']}: vocals {o} dB overall, {w} dB in the loudest second{'  ← LISTEN' if o > -25 else ''}", flush=True)


if __name__ == "__main__":
    main()
