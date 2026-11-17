"""Fit every bed of a lab (clips.json) into its target video, so the owner judges music where it will play.

    python3 lab/music/fit_batch.py MU2            # house beds → week-46 Story (music only)
    python3 lab/music/fit_batch.py MU3            # trend recipes → their video (comic ones with comic SFX)

Writes content/labs/<LAB>/out/<clip>-<target>.mp4 (+ .fit.json) and skips files that already exist.
"""
import json, os, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
STORY = ("story46", "content/drafts/2026-11-16-weekly-rc1/stories/story-1-video.mp4", None, 2.0)
SHELF = ("shelf", "content/drafts/2026-11-12-reel-shelf/reels/reel-shelf.mp4", "content/labs/FX1/src/shelf.cues.json", 0.0)
UNLUCKY = ("unlucky", "content/drafts/2026-11-13-reel-unlucky/reels/reel-unlucky.mp4", "content/labs/FX1/src/unlucky.cues.json", 0.0)
# recipe → targets (and whether the comic SFX plan goes on)
TARGETS = {"R4-caught": [SHELF], "R5-bouncy": [UNLUCKY, SHELF], "R7-epic": [UNLUCKY], "R8-fine": [UNLUCKY]}


def run(lab: str) -> None:
    d = os.path.join(ROOT, "content/labs", lab)
    os.makedirs(os.path.join(d, "out"), exist_ok=True)
    clips = json.load(open(os.path.join(d, "clips.json")))
    for c in clips:
        bed = os.path.join(ROOT, c["file"].lstrip("/"))
        recipe = next((k for k in TARGETS if c["brief"].startswith(k)), None)
        for name, video, cues, hold in (TARGETS[recipe] if recipe else [STORY]):
            out = os.path.join(d, "out", f"{c['id']}-{name}.mp4")
            if os.path.exists(out) and "--redo" not in sys.argv:
                continue
            cmd = ["uvx", "-q", "--with", "librosa", "--with", "soundfile", "python", os.path.join(ROOT, "lab/music/fit.py"),
                   bed, os.path.join(ROOT, video), out, "--hold", str(hold)]
            if cues:
                cmd += ["--cues", os.path.join(ROOT, cues)]
                plan = os.path.join(ROOT, f"content/labs/FX1/plan-{name}-comic.json")
                if os.path.exists(plan):
                    cmd += ["--sfx", plan]
            r = subprocess.run(["nice", *cmd], capture_output=True, text=True, cwd=ROOT)
            if r.returncode:
                print(f"{c['id']} → {name}: FAILED {r.stderr[-300:]}")
                continue
            rep = json.loads(r.stdout.strip().splitlines()[-1])
            print(f"{c['id']} → {name}: drop {rep['drop']}s (+{rep['drop_rise_db']} dB) on {rep['key']}s, {rep['mode']}, {rep['lufs']} LUFS, TP {rep['true_peak_db']}, QA {rep['qa']}")


if __name__ == "__main__":
    run(sys.argv[1])
