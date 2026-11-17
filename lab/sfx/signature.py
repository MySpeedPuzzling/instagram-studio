"""MSP sound-signature candidates (research: house_sound_and_ace_prompting.md): a wooden click (a piece clicking into
place) + a short motif of 2–5 notes in the bed's key, ~1–1.8 s, the melody fixed across moods. Falling = the
default sign-off; rising = records / reveals. Marimba-like modal synthesis (partials 1 : 3.93 : 9.24, the
bar-percussion ratios) + a soft felt-piano layer, all made here (no credit).

    uvx --with librosa --with soundfile python lab/sfx/signature.py OUT_DIR --key D [--bpm 117.5]
"""
import argparse, json, os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
        "A": 9, "A#": 10, "Bb": 10, "B": 11}
MAJOR = [0, 2, 4, 5, 7, 9, 11]
# motifs as (scale degree 1–7, octave offset, beats); degree 1 = tonic
MOTIFS = {
    "S1-fall-5321": [(5, 0, 0.5), (3, 0, 0.5), (2, 0, 0.5), (1, 0, 1.5)],
    "S2-fall-6531": [(6, 0, 0.5), (5, 0, 0.5), (3, 0, 0.5), (1, 0, 1.5)],
    "S3-two-31": [(3, 0, 0.75), (1, 0, 1.5)],
    "S4-low-153": [(1, 1, 0.5), (5, 0, 0.5), (3, 0, 0.5), (1, 0, 1.5)],
    "S5-rise-1358": [(1, 0, 0.5), (3, 0, 0.5), (5, 0, 0.5), (1, 1, 1.5)],
}


def freq(key: str, degree: int, octave: int, base_oct: int = 5) -> float:
    semis = NOTE[key] + MAJOR[degree - 1] + 12 * (octave + base_oct)
    return 440 * 2 ** ((semis - 57) / 12)        # 57 = A4 in this numbering (C0 = 0)


def marimba(f: float, d: float, vel: float = 1.0) -> np.ndarray:
    t = np.arange(int(d * SR)) / SR
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55)
         + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.09)
         + 0.12 * np.sin(2 * np.pi * f * 9.24 * t) * np.exp(-t / 0.025))
    mallet = sosfilt(butter(2, [800, 5000], btype="band", fs=SR, output="sos"), np.random.default_rng(int(f)).standard_normal(len(t))) * np.exp(-t / 0.004) * 0.15
    a = np.minimum(t / 0.002, 1)
    return (x + mallet) * a * vel


def felt(f: float, d: float, vel: float = 1.0) -> np.ndarray:
    t = np.arange(int(d * SR)) / SR
    x = sum(np.sin(2 * np.pi * f * h * t * (1 + 0.0004 * h * h)) * np.exp(-t / (0.9 / h)) / h ** 1.3 for h in range(1, 7))
    x = sosfilt(butter(1, 2500, fs=SR, output="sos"), x)
    return x * np.minimum(t / 0.008, 1) * vel


def click() -> np.ndarray:
    t = np.arange(int(0.08 * SR)) / SR
    rng = np.random.default_rng(3)
    tr = sosfilt(butter(2, 2500, btype="high", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t / 0.002)
    knock = np.sin(2 * np.pi * 1100 * t) * np.exp(-t / 0.01) + 0.5 * np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.005)
    return tr * 0.6 + knock


def build(motif, key: str, bpm: float, with_click: bool = True) -> np.ndarray:
    beat = 60 / bpm
    total = sum(b for *_, b in motif) * beat + 1.4
    out = np.zeros(int(total * SR))
    t = 0.0
    if with_click:
        c = click() * 0.9
        out[: len(c)] += c
        t = 0.5 * beat                              # the click, then the motif half a beat later
    for k, (deg, octv, beats) in enumerate(motif):
        f = freq(key, deg, octv)
        last = k == len(motif) - 1
        d = beats * beat + (1.2 if last else 0.6)
        n = marimba(f, d, 0.9 if not last else 1.0) + 0.35 * felt(f / 2 if last else f, d, 0.8)
        s0 = int(t * SR)
        out[s0: s0 + len(n)] += n[: len(out) - s0]
        t += beats * beat
    out = out / (np.max(np.abs(out)) + 1e-9) * 10 ** (-3 / 20)
    k = int(0.05 * SR)
    out[-k:] *= np.linspace(1, 0, k)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out"); ap.add_argument("--key", default="D"); ap.add_argument("--bpm", type=float, default=117.5)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    made = {}
    for name, motif in MOTIFS.items():
        x = build(motif, a.key, a.bpm)
        p = os.path.join(a.out, f"{name}-{a.key}.wav")
        sf.write(p, np.stack([x, x], 1), SR, subtype="FLOAT")
        made[name] = {"file": p, "seconds": round(len(x) / SR, 2)}
    json.dump({"key": a.key, "bpm": a.bpm, "signatures": made}, open(os.path.join(a.out, f"signatures-{a.key}.json"), "w"), indent=1)
    print({k: v["seconds"] for k, v in made.items()})


if __name__ == "__main__":
    main()
