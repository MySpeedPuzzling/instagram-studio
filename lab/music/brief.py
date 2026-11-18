"""The timing half of a music brief, computed from a video's cues (report: Music tailored to each video.md).

The tempo finder: with the `key` cue on a downbeat (the drop), find the BPMs at which the other anchor cues
(punchline / reveal / outro / section changes) also land on bar starts (or on beats, if allowed), and propose the
generation length. ACE-Step only roughly keeps the BPM, so fit.py later measures the real tempo and stretches.

    python3 lab/music/brief.py CUES.json [--anchors reveal,outro] [--min 80 --max 140] [--beats]
"""
import argparse, json


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("--anchors", default="reveal,outro,punch-main", help="cue kinds that should land on the grid")
    ap.add_argument("--min", type=float, default=80); ap.add_argument("--max", type=float, default=140)
    ap.add_argument("--beats", action="store_true", help="a beat is enough (default: bar starts, 4/4)")
    ap.add_argument("--hold", type=float, default=0.0)
    a = ap.parse_args()
    c = json.load(open(a.cues))
    key = next((x["t"] for x in c["cues"] if x["kind"] == "key"), None)
    if key is None:
        raise SystemExit("no `key` cue: add cue('key', t) to the builder")
    kinds = a.anchors.split(",")
    anchors = [(x["kind"], x["t"]) for x in c["cues"] if x["kind"] in kinds and x["t"] > key]
    res = []
    bpm = a.min
    while bpm <= a.max + 1e-9:
        unit = 60 / bpm * (1 if a.beats else 4)
        errs = []
        for k, t in anchors:
            n = round((t - key) / unit)
            errs.append((k, t, n, round(abs(t - key - n * unit) * 1000)))
        worst = max((e[3] for e in errs), default=0)
        res.append((worst, round(bpm, 1), errs))
        bpm += 0.1
    res.sort()
    total = c["duration"] + a.hold
    out = {"video_s": round(total, 2), "key": key, "anchors": anchors,
           "generate_s": round(max(20, total * 1.25), 1),
           "best": [{"bpm": b, "worst_ms": w, "anchors": [{"kind": k, "t": t, "bars" if not a.beats else "beats": n, "off_ms": e} for k, t, n, e in errs]}
                    for w, b, errs in res[:5]]}
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
