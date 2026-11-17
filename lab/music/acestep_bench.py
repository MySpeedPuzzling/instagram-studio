"""MU1 lab: ACE-Step 1.5 music beds for Reels and Stories (owner 2026-11-16: baked-in audio by default,
no credit anywhere; ACE-Step is MIT, so it needs none). Heavy local job: run only after the owner's go-ahead,
with Docker and other unneeded apps closed.

    uv run --project ~/ai/ACE-Step-1.5 python lab/music/acestep_bench.py [--models turbo,xl-turbo] [--seeds 11,42]

Writes content/labs/MU1/<clip>.flac, clips.json (prompt, seed, model, timings: the provenance kept for every
generated bed in case of a claim) and runs.jsonl (wall time, peak memory, swap, per-clip time, what else ran).
"""
import argparse, gc, json, os, platform, resource, shutil, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "content/labs/MU1"
ACE = Path(os.environ.get("ACESTEP_DIR", Path.home() / "ai/ACE-Step-1.5"))
MODELS = {"turbo": "acestep-v15-turbo", "xl-turbo": "acestep-v15-xl-turbo"}
LM = "acestep-5Hz-lm-1.7B"

# MSP moods (one per bed type we use). All instrumental, 30 s (ACE-Step's minimum is 10 s; the fitter trims).
BRIEFS = [
    ("cozy", "cozy lo-fi hip hop, warm Rhodes piano, soft vinyl crackle, brushed drums, relaxed, instrumental", 80, "F major"),
    ("playful", "playful upbeat pizzicato strings and marimba, light hand claps, cheerful, quirky, instrumental", 112, "C major"),
    ("ticking", "tense ticking clock, minimal electronic, pulsing synth bass, staccato strings, countdown suspense, instrumental", 120, "A minor"),
    ("celebrate", "bright celebratory pop, synth brass stabs, punchy drums, triumphant finale, instrumental", 124, "D major"),
    ("data", "clean modern electronic, light plucked synths, steady four-on-the-floor beat, optimistic, instrumental", 118, "G major"),
    # Owner 16 Nov: data beds best but generic and flat. Need an MSP identity and a build-up with a payoff.
    ("data-arc", "clean modern electronic, light plucked synths, starts sparse and quiet, builds steadily layer by layer, "
     "rising energy, ends on one bright final hit, optimistic, instrumental", 118, "G major"),
    ("data-stopwatch", "modern electronic with a ticking stopwatch as the rhythm, dry wooden clicks like puzzle pieces "
     "snapping in, light plucked synths, starts sparse, builds steadily, ends on one bright final hit, instrumental", 120, "G major"),
]


def swap_mb() -> float:
    out = subprocess.run(["sysctl", "-n", "vm.swapusage"], capture_output=True, text=True).stdout
    return float(out.split("used =")[1].split("M")[0].replace(",", ".")) if "used =" in out else -1.0  # cs locale: 1504,81M


def other_apps() -> list[str]:
    names = ["Docker", "Google Chrome", "Safari", "Slack", "ComfyUI", "PhpStorm", "Figma", "Spotify"]
    ps = subprocess.run(["ps", "-axo", "comm"], capture_output=True, text=True).stdout
    return [n for n in names if n in ps]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default="turbo,xl-turbo")
    ap.add_argument("--seeds", default="11,42")
    ap.add_argument("--duration", type=float, default=30.0)
    ap.add_argument("--only", default="", help="comma list of brief keys")
    ap.add_argument("--grid", help="JSON grid (lab/music/mu2_briefs.json): directions x endings x seeds, lyrics = section tags")
    ap.add_argument("--lab", default="MU1")
    a = ap.parse_args()
    sys.path.insert(0, str(ACE))
    os.chdir(ACE)
    import torch
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import GenerationConfig, GenerationParams, generate_music

    global OUT
    OUT = ROOT / "content/labs" / a.lab
    OUT.mkdir(parents=True, exist_ok=True)
    clips_path = OUT / "clips.json"
    clips = json.loads(clips_path.read_text()) if clips_path.exists() else []
    # rows: (key, caption, bpm, key/scale, lyrics)
    briefs = [(k, c, b, sc, "[Instrumental]", None, None) for k, c, b, sc in BRIEFS if not a.only or k in a.only.split(",")]
    seeds = [int(s) for s in a.seeds.split(",")]
    if a.grid:
        g = json.loads(Path(a.grid).read_text())
        one = len(g["endings"]) == 1
        briefs = [(dk if one else f"{dk}-{ek}", d["caption"], d["bpm"], d["key"], "\n\n".join(d["tags"] + e), d.get("duration"), d.get("seeds"))
                  for dk, d in g["directions"].items() for ek, e in g["endings"].items()]
        briefs = [b for b in briefs if not a.only or b[0] in a.only.split(",")]
        seeds, a.duration = g["seeds"], float(g["duration"])
    run = {"lab": a.lab, "run_id": f"{a.lab}-{int(time.time())}", "engine": "ACE-Step 1.5 (MLX/MPS)",
           "machine": platform.machine(), "other_apps": other_apps(), "swap_mb_before": swap_mb(), "items": []}
    t_run = time.time()

    llm = LLMHandler()
    t0 = time.time()
    llm.initialize(checkpoint_dir=str(ACE / "checkpoints"), lm_model_path=LM, backend="mlx", device="auto")
    run["lm_load_s"] = round(time.time() - t0, 1)

    for mkey in a.models.split(","):
        dit = AceStepHandler()
        t0 = time.time()
        status, ok = dit.initialize_service(project_root=str(ACE), config_path=MODELS[mkey], device="auto")
        if not ok:
            print(f"init failed for {mkey}: {status}")
            continue
        run[f"{mkey}_load_s"] = round(time.time() - t0, 1)
        for key, caption, bpm, scale, lyrics, bdur, bseeds in briefs:
            for seed in (bseeds or seeds):
                clip_id = f"{a.lab}-{key}-{mkey}-s{seed}"
                params = GenerationParams(caption=caption, instrumental=True, lyrics=lyrics, bpm=bpm,
                                          keyscale=scale, duration=bdur or a.duration, seed=seed,
                                          thinking=True, use_cot_caption=False, use_cot_metas=False,
                                          shift=3.0 if "turbo" in mkey else 1.0, infer_method="ode")  # official turbo setting
                cfg = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format="flac")
                tmp = OUT / "_tmp"
                tmp.mkdir(exist_ok=True)
                t0 = time.time()
                res = generate_music(dit, llm, params, cfg, save_dir=str(tmp))
                secs = round(time.time() - t0, 1)
                if not res.success or not res.audios:
                    print(f"{clip_id}: FAILED {res.error}")
                    run["items"].append({"id": clip_id, "ok": False, "error": str(res.error)[:300], "s": secs})
                    continue
                dst = OUT / f"{clip_id}.flac"
                shutil.move(res.audios[0]["path"], dst)
                item = {"id": clip_id, "brief": key, "model": MODELS[mkey], "lm": LM, "caption": caption, "bpm": bpm, "shift": params.shift,
                        "key": scale, "duration_s": bdur or a.duration, "seed": seed, "gen_s": secs,
                        "file": f"/content/labs/{a.lab}/{dst.name}", "lyrics": lyrics, "created": time.strftime("%Y-%m-%d %H:%M")}
                clips = [c for c in clips if c["id"] != clip_id] + [item]
                clips_path.write_text(json.dumps(clips, indent=1))
                run["items"].append({"id": clip_id, "ok": True, "s": secs})
                print(f"{clip_id}: {secs}s")
        del dit
        gc.collect()
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()

    shutil.rmtree(OUT / "_tmp", ignore_errors=True)
    ok = [i["s"] for i in run["items"] if i.get("ok")]
    run.update({"wall_s": round(time.time() - t_run, 1), "clips": len(ok),
                "per_clip_s_median": sorted(ok)[len(ok) // 2] if ok else None,
                # ru_maxrss is bytes on macOS; MLX/MPS memory is unified, so this is the process's peak footprint.
                "peak_rss_gb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e9, 2),
                "swap_mb_after": swap_mb(), "gpu_busy": "not measured (powermetrics needs sudo)"})
    with open(OUT / "runs.jsonl", "a") as f:
        f.write(json.dumps(run) + "\n")
    print(json.dumps({k: v for k, v in run.items() if k != "items"}, indent=1))


if __name__ == "__main__":
    main()
