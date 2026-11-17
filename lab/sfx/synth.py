"""Code-made UI sounds for the SFX layer (no licence, no credit: made here). Research (reactive_sfx_and_comedic_timing.md):
synthesis suits ticks, clicks, pops, whooshes, dings and stopwatches; physical puzzle sounds (pieces, cardboard,
boxes) should be real recordings (owner foley, Freesound CC0) or MOSS-SoundEffect v2. Every sound comes in several
takes (round-robin) so repeated hits never sound like a machine gun.

    uvx --with librosa --with soundfile python lab/sfx/synth.py content/labs/FX1/kit
"""
import json, os, sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.001, decay=0.05, curve=1.0):
    t = t_(d)
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / decay) ** curve


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def norm(x, peak_db=-3):
    return x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)


def tick(v):
    """Dry wooden tick (a woodblock-ish resonance + a short noise transient)."""
    d = 0.06
    f = 1750 * (1 + 0.06 * v)
    t = t_(d)
    body = np.sin(2 * np.pi * f * t) * env(d, 0.0005, 0.012) + 0.5 * np.sin(2 * np.pi * f * 2.72 * t) * env(d, 0.0005, 0.006)
    noise = bp(rng.standard_normal(len(t)), 2500, 9000) * env(d, 0.0002, 0.003)
    return norm(body + 0.6 * noise, -6)


def click(v):
    """A snap: the click of a piece seating (bright transient, a tiny low knock under it)."""
    d = 0.09
    t = t_(d)
    tr = hp(rng.standard_normal(len(t)), 3000) * env(d, 0.0001, 0.0025)
    knock = np.sin(2 * np.pi * (380 + 40 * v) * t) * env(d, 0.0005, 0.018)
    res = bp(rng.standard_normal(len(t)), 900 + 120 * v, 2200 + 150 * v) * env(d, 0.0003, 0.01)
    return norm(tr + 0.5 * knock + 0.7 * res, -4)


def pop(v):
    """Bubble pop: a fast upward pitch blip."""
    d = 0.12
    t = t_(d)
    f0, f1 = 300 + 30 * v, 1200 + 80 * v
    ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * (1 - np.exp(-t / 0.012))) / SR
    return norm(np.sin(ph) * env(d, 0.001, 0.03), -5)


def whoosh(v, up=True):
    """Air movement: band-passed noise with a sweeping centre and a swell."""
    d = 0.55
    t = t_(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 24
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        x = k / steps if up else 1 - k / steps
        fc = 400 * (2 ** (3.2 * x)) * (1 + 0.05 * v)
        out[a:b] = bp(n, fc * 0.6, fc * 1.6)[a:b]
    sw = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    return norm(out * sw, -8)


def thud(v):
    """Soft landing of a box on a pile: low pitch-dropping thump + cardboard rustle."""
    d = 0.35
    t = t_(d)
    f = 95 * (1 + 0.05 * v) * np.exp(-t / 0.08) + 55
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 0.07)
    card = bp(rng.standard_normal(len(t)), 300, 2500) * env(d, 0.001, 0.025)
    slap = bp(rng.standard_normal(len(t)), 1200, 5000) * env(d, 0.0003, 0.006)
    return norm(body + 0.45 * card + 0.35 * slap, -3)


def ding(v, f=1318.5):
    """A small bell (inharmonic partials), e.g. on a record or a flash."""
    d = 1.4
    t = t_(d)
    parts = [(1, 1, 0.9), (2.0, 0.45, 0.6), (2.76, 0.3, 0.35), (5.4, 0.12, 0.15)]
    x = sum(a * np.sin(2 * np.pi * f * (1 + 0.003 * v) * m * t) * env(d, 0.001, dec) for m, a, dec in parts)
    return norm(x, -6)


def slot(v):
    """Slot-machine column locking: a mechanical clack + a tiny bell."""
    c = click(v) * 0.9
    k = np.concatenate([c, np.zeros(int(0.02 * SR))])
    b = ding(v, 1760 + 30 * v)[: int(0.5 * SR)] * 0.35
    out = np.zeros(max(len(k), len(b) + int(0.015 * SR)))
    out[: len(k)] += k
    out[int(0.015 * SR): int(0.015 * SR) + len(b)] += b
    return norm(out, -4)


def stopwatch(v):
    """One stopwatch tick (lighter, metallic)."""
    d = 0.05
    t = t_(d)
    x = np.sin(2 * np.pi * 3400 * t) * env(d, 0.0002, 0.004) + 0.4 * hp(rng.standard_normal(len(t)), 5000) * env(d, 0.0001, 0.002)
    return norm(x, -9)


# ---- comic sounds (style "comic"): classic cartoon gestures, all synthesised here

def slide_down(v):
    """Slide whistle falling (a sticker / hope dropping): a breathy sine gliding down with vibrato."""
    d = 0.9
    t = t_(d)
    f = 1500 * (1 + 0.04 * v) * np.exp(-t * 1.6) + 260
    vib = 1 + 0.012 * np.sin(2 * np.pi * 7 * t)
    tone = np.sin(2 * np.pi * np.cumsum(f * vib) / SR)
    breath = bp(rng.standard_normal(len(t)), 800, 4000) * 0.08
    return norm((tone + breath) * env(d, 0.02, 0.6) * np.minimum(1, (d - t) / 0.08), -6)


def fastforward(v):
    """Time-lapse whirr: a tape/reel spinning up (rising buzzy chirps)."""
    d = 0.85
    t = t_(d)
    rate = 18 + 40 * (t / d) ** 1.5
    chirps = (np.sin(2 * np.pi * np.cumsum(rate) / SR) > 0.6).astype(float)
    f = 300 + 900 * (t / d)
    tone = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25
    x = lp(chirps * bp(rng.standard_normal(len(t)), 1500, 6000) + tone, 7000)
    return norm(x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7, -9)


def zip_(v):
    """A spider zipping down its thread: a quick falling squeak."""
    d = 0.5
    t = t_(d)
    f = 2400 * np.exp(-t * 4) + 500 + 30 * v
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.005, 0.18), -9)


def buzz(v):
    """Electric flicker of an old picture light: 100 Hz buzz bursts."""
    d = 0.6
    t = t_(d)
    x = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.6 + bp(rng.standard_normal(len(t)), 2000, 6000) * 0.3
    gate = np.zeros_like(t)
    for a, b in [(0, 0.06), (0.1, 0.16), (0.26, 0.32), (0.36, 0.41), (0.5, 0.6)]:
        gate[int(a * SR): int(b * SR)] = 1
    return norm(lp(x, 4000) * gate, -10)


def boom(v):
    """The deadpan punchline hit: a deep, round sub boom with a soft attack and a long tail (no meme sample)."""
    d = 1.6
    t = t_(d)
    f = 70 * np.exp(-t * 2.2) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.004, 0.55)
    knock = lp(rng.standard_normal(len(t)), 900) * env(d, 0.001, 0.02)
    sat = np.tanh(2.2 * (body + 0.3 * knock))
    return norm(sat, -2)


def rewind(v):
    """Tape rewind: a fast warbling chirp sweep, high and squeaky."""
    d = 0.65
    t = t_(d)
    f = 900 + 2600 * (t / d) + 300 * np.sin(2 * np.pi * 23 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.7 + bp(rng.standard_normal(len(t)), 3000, 9000) * 0.25
    return norm(x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.5, -10)


def boop(v):
    """A short soft bass 'boop' under a deadpan line."""
    d = 0.35
    t = t_(d)
    f = 180 * (1 + 0.05 * v) * np.exp(-t * 1.5)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.003, 0.12), -6)


def bonk(v):
    """A cartoon wooden bonk (something that won't fit): a knock whose pitch drops."""
    d = 0.4
    t = t_(d)
    f = 520 * (1 + 0.04 * v) * np.exp(-t * 9) + 160
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.001, 0.09)
    knock = bp(rng.standard_normal(len(t)), 600, 3000) * env(d, 0.0005, 0.01)
    return norm(np.tanh(1.8 * (body + 0.5 * knock)), -3)


def rattle(v):
    """A piece jiggling against the board: 6 quick small clicks."""
    out = np.zeros(int(0.32 * SR))
    for k in range(6):
        c = click(v + k) * (0.8 if k % 2 else 1.0)
        s0 = int(k * 0.05 * SR)
        out[s0: s0 + len(c)] += c[: len(out) - s0]
    return norm(out, -6)


def squeak(v):
    """Cardboard turning: a short rubbery squeak up then down."""
    d = 0.5
    t = t_(d)
    f = 900 + 500 * np.sin(np.pi * t / d) + 40 * v
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    return norm(lp(x, 5000) * np.sin(np.pi * t / d) ** 2, -10)


def sad_trombone(v):
    """Wah, wah, wah, waaah: four falling notes (the generic idiom; synthesised brassy tone, vibrato on the last)."""
    notes = [(0, 0.38), (-1, 0.38), (-2, 0.38), (-3, 1.3)]
    base = 233.08  # B-flat 3
    out = []
    for k, (semi, d) in enumerate(notes):
        t = t_(d)
        f = base * 2 ** (semi / 12) * (1 + (0.025 * np.sin(2 * np.pi * 6 * t) * np.minimum(t / 0.3, 1) if k == 3 else 0))
        f = f * (1 - 0.03 * np.exp(-t / 0.05))          # each note slides into place (a "wah")
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = sum(np.sin(h * ph) / h ** 0.8 for h in range(1, 9))
        a = np.minimum(t / 0.04, 1) * np.minimum(1, (d - t) / 0.06)
        wah = 0.55 + 0.45 * np.minimum(t / 0.18, 1)        # mute opening: darker at the start of each note
        out.append(lp(tone, 900 + 2200 * np.mean(wah)) * a)
    return norm(np.concatenate(out), -4)


KIT = {"tick": (tick, 6), "click": (click, 8), "pop": (pop, 4), "whoosh-up": (lambda v: whoosh(v, True), 3),
       "whoosh-down": (lambda v: whoosh(v, False), 3), "thud": (thud, 6), "ding": (ding, 2), "slot": (slot, 4),
       "stopwatch": (stopwatch, 4),
       "slide-down": (slide_down, 2), "fastforward": (fastforward, 3), "zip": (zip_, 2), "buzz": (buzz, 1), "boom": (boom, 2),
       "rewind": (rewind, 2), "boop": (boop, 4),
       "bonk": (bonk, 2), "rattle": (rattle, 2), "squeak": (squeak, 2), "sad-trombone": (sad_trombone, 1)}


def main() -> None:
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    index = {}
    for name, (fn, takes) in KIT.items():
        index[name] = []
        for v in range(takes):
            x = fn(v - takes // 2)
            x = np.concatenate([x, np.zeros(int(0.01 * SR))])
            path = os.path.join(out, f"{name}-{v + 1}.wav")
            sf.write(path, np.stack([x, x], 1), SR, subtype="FLOAT")
            index[name].append(os.path.relpath(path, out))
    json.dump({"source": "lab/sfx/synth.py (code-made)", "sounds": index}, open(os.path.join(out, "kit.json"), "w"), indent=1)
    print({k: len(v) for k, v in index.items()})


if __name__ == "__main__":
    main()
