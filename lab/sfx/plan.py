"""Turn a video's sound cues (<video>.cues.json, logged by the motion kit) into an SFX plan for lab/music/fit.py.

Craft rules (research: reactive_sfx_and_comedic_timing.md): the sound's transient sits on the contact frame (hits may
lead by up to one frame, never lag); every repeated sound rotates through takes with small pitch/level variation;
density is capped; bigger events get bigger sounds, small bounces get small ones; a recap stays restrained, a
humour clip may exaggerate (style "comic").

    python3 lab/sfx/plan.py CUES.json KIT_DIR OUT.json [--style recap|comic] [--seed 1]
"""
import argparse, json, os, random

FRAME = 1 / 30


def ease_power3_out_times(t0: float, dur: float, n: int) -> list[float]:
    """Times at which a power3.out count-up passes k/n of its value: ticks that slow down as the number settles."""
    return [t0 + dur * (1 - (1 - k / n) ** (1 / 3)) for k in range(1, n + 1)]


STYLES = {
    # gains in dB relative to a −3 dBFS sample; the mix is mastered afterwards
    "recap": {"music_gain_db": -1, "duck_db": 3, "land": -13, "land_rise": 0.7, "impact": -7, "impact_soft": -15, "whoosh": -15,
              "count": -19, "count_n": 9, "stopwatch": -17, "slot": -10, "pop": -12, "settle": -14, "fall": -18, "accent": -11,
              "flash": -18},
    "comic": {"music_gain_db": -2, "duck_db": 5, "land": -9, "land_rise": 1.2, "impact": -3, "impact_soft": -9, "whoosh": -10,
              "count": -15, "count_n": 12, "stopwatch": -13, "slot": -6, "pop": -8, "settle": -10, "fall": -12, "accent": -7,
              "flash": -12},
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cues"); ap.add_argument("kit"); ap.add_argument("out")
    ap.add_argument("--style", default="recap", choices=STYLES)
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    S = STYLES[a.style]
    rnd = random.Random(a.seed)
    cues = json.load(open(a.cues))["cues"]
    kit = json.load(open(os.path.join(a.kit, "kit.json")))["sounds"]
    last_take: dict[str, int] = {}

    def take(name: str) -> str:
        """Round-robin with a random start; never the same take twice in a row."""
        pool = kit[name]
        i = (last_take.get(name, rnd.randrange(len(pool))) + 1 + rnd.randrange(max(1, len(pool) - 1))) % len(pool)
        last_take[name] = i
        return os.path.join(a.kit, pool[i])

    hits = []
    gaps = []  # windows where the music steps back (silence before / under a punchline)

    def hit(t, name, gain, pitch=0.0, lead=0.0):
        hits.append({"t": round(t, 3), "file": take(name), "gain_db": round(gain + rnd.uniform(-1.5, 1.5), 1),
                     "pitch": round(pitch + rnd.uniform(-0.4, 0.4), 2), "lead": lead, "kind": name})

    lands = [c for c in cues if c["kind"] == "land"]
    for k, c in enumerate(lands):                       # a run of landings climbs in pitch (anticipation of the reveal)
        hit(c["t"], "click", S["land"], pitch=k * S["land_rise"], lead=FRAME * 0.5)
    for c in cues:
        kd = c["kind"]
        if kd == "impact":
            s = c.get("strength", 1)
            if s >= 0.9:
                hit(c["t"], "thud", S["impact"], lead=FRAME * 0.5)
            elif s >= 0.4:
                hit(c["t"], "thud", S["impact_soft"], pitch=2.5)
            # the smallest bounces stay silent: three sounds per box is too busy
        elif kd == "whoosh":
            hit(c["t"], "whoosh-up" if c.get("dir", "up") == "up" else "whoosh-down", S["whoosh"])
        elif kd == "fall":
            hit(c["t"], "whoosh-down", S["fall"])
        elif kd == "settle":
            hit(c["t"], "click", S["settle"], pitch=-3)
        elif kd == "accent":
            hit(c["t"], "pop", S["accent"], pitch=3)
        elif kd == "pop" or kd == "pop-out":
            hit(c["t"], "pop", S["pop"], pitch=-4 if kd == "pop-out" else 0)
        elif kd == "slot-stop":
            hit(c["t"], "slot", S["slot"], pitch=c.get("i", 0) * 2)   # three columns: rising thirds-ish
        elif kd == "key" and a.style == "comic":
            hit(c["t"], "thud", S["impact"])
        elif kd == "stopwatch":
            for t in ease_power3_out_times(c["t"], c.get("dur", 1.75), 14):
                hit(t, "stopwatch", S["stopwatch"])
        elif kd == "flash":
            hit(c["t"], "ding", S["flash"])
        # comic cues (builders log them for humour clips)
        elif kd == "timelapse":
            hit(c["t"], "fastforward", S["whoosh"] + 2, pitch=c.get("i", 0) * 1.5)   # each jump a bit higher: time speeds up
        elif kd == "punch":
            hit(c["t"], "boop", S["accent"] - 2, pitch=-c.get("i", 0) * 1.0)           # each excuse a step lower: deadpan
        elif kd == "wobble":
            hit(c["t"], "click", S["settle"], pitch=5); hit(c["t"] + 0.25, "click", S["settle"], pitch=3)
        elif kd == "peel":
            hit(c["t"], "slide-down", S["fall"] + 6)
        elif kd == "spider":
            hit(c["t"], "zip", S["whoosh"])
        elif kd == "flicker":
            hit(c["t"], "buzz", S["whoosh"])
            rv = next((x["t"] for x in cues if x["kind"] == "reveal" and x["t"] > c["t"]), c["t"] + 0.6)
            gaps.append({"t": c["t"] - 0.5, "dur": rv - c["t"] + 1.1, "db": 30})   # the punchline lands in real silence
        elif kd == "reveal":
            hit(c["t"], "boom", S["impact"])
        elif kd == "rewind":
            d = c.get("dur", 0.6)
            if d <= 1.0:
                hit(c["t"], "rewind", S["whoosh"])
            else:                                                          # a long tape rewind: chirps back to back,
                n = max(2, round(d / 0.55))                                # each a bit higher, the music steps back under it
                for k in range(n):
                    hit(c["t"] + k * d / n, "rewind", S["whoosh"] + 3, pitch=k * 1.2)
                gaps.append({"t": c["t"], "dur": d, "db": 14})
        elif kd == "clock-tick":                                           # tick-tock: alternate two pitches
            hit(c["t"], "tick", S["count"] + 6, pitch=0 if c.get("v", 0) % 2 else -5)
        elif kd == "bonk":
            hit(c["t"], "bonk", S["impact"])
        elif kd == "jiggle":
            hit(c["t"], "rattle", S["land"])
        elif kd == "turn":
            hit(c["t"], "squeak", S["land"])
        elif kd == "hour":                                                 # the music drops out until after the fail line
            fl = next((x["t"] for x in cues if x["kind"] == "fail"), c["t"] + 0.95)
            gaps.append({"t": c["t"], "dur": fl - c["t"] + 0.6, "db": 30})
        elif kd == "snap":
            hit(c["t"], "click", S["impact"] + 2, pitch=-2); hit(c["t"], "thud", S["impact_soft"])
        elif kd == "fail":
            hit(c["t"], "sad-trombone", S["impact"]); gaps.append({"t": c["t"] + 0.6, "dur": 1.6, "db": 10})
    counts = [c for c in cues if c["kind"] == "count" and not str(c.get("sel", "")).startswith("#fast")]
    if counts:                                          # several count-ups at once: one tick track, from the first
        c = counts[0]
        for k, t in enumerate(ease_power3_out_times(c["t"], c.get("dur", 1.5), S["count_n"])):
            hit(t, "tick", S["count"], pitch=k * 0.5)
    # density cap: no two hits closer than 45 ms (keep the louder one)
    hits.sort(key=lambda h: h["t"])
    kept = []
    for h in hits:
        if kept and h["t"] - kept[-1]["t"] < 0.045:
            if h["gain_db"] > kept[-1]["gain_db"]:
                kept[-1] = h
            continue
        kept.append(h)
    plan = {"style": a.style, "music_gain_db": S["music_gain_db"], "duck_db": S["duck_db"], "hits": kept, "gaps": gaps}
    json.dump(plan, open(a.out, "w"), indent=1)
    from collections import Counter
    print(a.style, len(kept), dict(Counter(h["kind"] for h in kept)))


if __name__ == "__main__":
    main()
