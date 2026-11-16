"""A calm closing motif for a fitted bed (owner 16 Nov: "a few tones going lower" at the end).

Soft electric-piano-like plucks (additive sines, fast attack, exponential decay), stepping down on the beat and
ringing out on the last note. Made in code, so it carries no licence or credit.

    uvx --with numpy --with soundfile python lab/music/ending.py OUT.wav --total 18.1 \
        --notes A4@15.84,F#4@16.35,D4@16.86,D3@17.37
"""
import argparse

import numpy as np
import soundfile as sf

SR = 48000
NAMES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
         "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def freq(note: str) -> float:
    name, octave = note[:-1], int(note[-1])
    midi = 12 * (octave + 1) + NAMES[name]
    return 440.0 * 2 ** ((midi - 69) / 12)


def pluck(f: float, length: float, tau: float) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    env = np.minimum(t / 0.006, 1.0) * np.exp(-t / tau)
    # Warm tone: fundamental, a soft octave and a faint twelfth; higher partials die faster (a felt-piano feel).
    tone = (np.sin(2 * np.pi * f * t)
            + 0.28 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / (tau * 0.5))
            + 0.08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / (tau * 0.3)))
    return tone * env


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--total", type=float, required=True)
    ap.add_argument("--notes", required=True, help="NOTE@seconds,... e.g. A4@15.84,F#4@16.35")
    a = ap.parse_args()
    buf = np.zeros(int(a.total * SR))
    notes = [n.split("@") for n in a.notes.split(",")]
    for i, (note, at) in enumerate(notes):
        start = int(float(at) * SR)
        last = i == len(notes) - 1
        x = pluck(freq(note), a.total - float(at), tau=1.1 if last else 0.55) * (1.0 if last else 0.85)
        buf[start:start + len(x)] += x[: len(buf) - start]
    # A tiny fade on the very last samples so nothing clicks if the video cuts mid-ring.
    buf[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
    buf = 0.5 * buf / np.max(np.abs(buf))
    sf.write(a.out, np.stack([buf, buf], axis=1), SR)


if __name__ == "__main__":
    main()
