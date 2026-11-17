"""FX1: puzzle foley generated with MOSS-SoundEffect v2 (Apache-2.0: no credit). Heavy local job (owner's go-ahead).

    ~/ai/MOSS-TTS/moss_soundeffect_v2/.venv/bin/python lab/sfx/moss_gen.py [--steps 50] [--seeds 1,2]

Writes content/labs/FX1/out/FX1-moss-<name>-s<seed>.wav (raw) + content/labs/FX1/moss.json (prompt, seed, steps,
timings, peak memory: provenance + run record).
"""
import argparse, json, os, platform, resource, subprocess, time

import torch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUT = os.path.join(ROOT, "content/labs/FX1/out")

PROMPTS = {
    "piece-snap": ("A single cardboard jigsaw puzzle piece pressed firmly into place on a wooden table, one short crisp click, close up, dry room.", 2),
    "pieces-clicks": ("Several cardboard jigsaw puzzle pieces clicking into place one after another, quick small snaps on a wooden table, close up.", 3),
    "pieces-pour": ("Pouring hundreds of small cardboard jigsaw puzzle pieces out of a box onto a wooden table, a cascading dry rustle that settles.", 3),
    "box-shake": ("Shaking a closed cardboard box full of jigsaw puzzle pieces, a dry rattling, close up.", 2),
    "box-drop": ("A cardboard puzzle box dropped flat onto a pile of other boxes, one soft hollow thud.", 2),
    "box-lid": ("Lifting the lid off a snug cardboard puzzle box, a soft airy pop and a cardboard scrape.", 2),
    "pile-collapse": ("A tall stack of cardboard boxes topples over and slides onto a wooden floor, a clumsy comic crash.", 3),
    "slide-whistle": ("A cartoon slide whistle going down, comic.", 2),
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", type=int, default=50)
    ap.add_argument("--seeds", default="1,2")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    from moss_soundeffect_v2 import MossSoundEffectPipeline

    os.makedirs(OUT, exist_ok=True)
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    swap0 = subprocess.run(["sysctl", "-n", "vm.swapusage"], capture_output=True, text=True).stdout.strip()
    t0 = time.time()
    pipe = MossSoundEffectPipeline.from_pretrained("OpenMOSS-Team/MOSS-SoundEffect-v2.0", torch_dtype=torch.bfloat16, device=dev)
    run = {"lab": "FX1", "engine": f"MOSS-SoundEffect v2.0 ({dev}, bf16, eager)", "machine": platform.machine(), "steps": a.steps,
           "load_s": round(time.time() - t0, 1), "swap_before": swap0, "items": []}
    for name, (prompt, secs) in PROMPTS.items():
        if a.only and name not in a.only.split(","):
            continue
        for seed in [int(x) for x in a.seeds.split(",")]:
            t = time.time()
            audio = pipe(prompt=prompt, seconds=secs, num_inference_steps=a.steps, cfg_scale=4.0, seed=seed)
            path = os.path.join(OUT, f"FX1-moss-{name}-s{seed}.wav")
            pipe.save_audio(audio, path)
            dt = round(time.time() - t, 1)
            run["items"].append({"id": os.path.basename(path)[:-4], "prompt": prompt, "seconds": secs, "seed": seed, "gen_s": dt})
            print(f"{name} s{seed}: {dt}s", flush=True)
    run["wall_s"] = round(time.time() - t0, 1)
    run["peak_rss_gb"] = round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e9, 2)
    run["swap_after"] = subprocess.run(["sysctl", "-n", "vm.swapusage"], capture_output=True, text=True).stdout.strip()
    with open(os.path.join(ROOT, "content/labs/FX1/runs.jsonl"), "a") as f:
        f.write(json.dumps(run) + "\n")
    json.dump(run, open(os.path.join(ROOT, "content/labs/FX1/moss.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in run.items() if k != "items"}))


if __name__ == "__main__":
    main()
