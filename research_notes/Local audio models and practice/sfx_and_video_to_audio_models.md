# Local SFX and video-to-audio (foley) models for MSP Reels (as of 16 Nov 2026)

Scope: open-weight sound-effect (text-to-SFX) and video-to-audio (V2A / foley) models that could run locally on an
Apple M3 Max (36 GB unified memory), filtered by the owner's rule: outputs usable commercially with NO credit or
attribution, so non-commercial weights and Stability Community Licence models are out. Researched by web only;
nothing installed or tested. The owner is in the Czech Republic (EU), which matters for Tencent's licence.

## Video-to-audio (foley) models: licence, Mac feasibility, quality, fit for motion graphics

### Takeaway
No video-to-audio model found passes the licence filter for an EU-based commercial user. MMAudio, ThinkSound/PrismAudio,
AudioX, ControlFoley and Sony Woosh-VFlow have non-commercial weights. HunyuanVideo-Foley allows commercial use but its
licence explicitly excludes the EU, UK and South Korea. Kling-Foley, MultiFoley and V-AURA have no verified public
weights. Option (b), "watch the MP4 and score it", is therefore closed for now. That is not a big loss: MSP already knows
every event timestamp, and these models are trained on real-world video, not abstract motion graphics.

### Cited Findings
**MMAudio (hkchengrex, Dec 2024; "MMAudio V2" in 2026 roundups)**
- Code MIT. Checkpoints CC BY-NC 4.0, "can be used for non-commercial purposes only". **Excluded.** — [HF model card](https://huggingface.co/hkchengrex/MMAudio); [GitHub](https://github.com/hkchengrex/MMAudio)
- About 6 GB GPU memory in 16-bit. Default length 8 s; much longer clips may lose quality. Trained on AudioSet, Freesound, VGGSound, AudioCaps and WavCaps. Demos include AI-generated videos (Sora, Veo 2, MovieGen), all realistic scenes. — [GitHub](https://github.com/hkchengrex/MMAudio)
- Mac: "only tested this on Ubuntu". The maintainer has no Mac and suggested swapping `cuda` for `mps` (issue closed Dec 2024). An MPS-support PR #97 (CPU-side noise, `mps-conv3d` for Synchformer's 3D convolutions, which MPS lacks) was closed unmerged on 6 Feb 2026. — [issue #17](https://github.com/hkchengrex/MMAudio/issues/17); [PR #97](https://github.com/hkchengrex/MMAudio/pull/97); [issue list](https://github.com/hkchengrex/MMAudio/issues?q=mps)
- Independent licence audit (PR merged 31 Oct 2026) also rejects MMAudio for non-commercial weights. — [kajisho5/sound-design-skill PR #5](https://github.com/kajisho5/sound-design-skill/pull/5)

**HunyuanVideo-Foley (Tencent, 28 Aug 2025; XL variant 29 Sep 2025)**
- Licence: Tencent Hunyuan Community License. It "DOES NOT APPLY IN THE EUROPEAN UNION, UNITED KINGDOM AND SOUTH KOREA". Article 5(c) restricts using Outputs outside the Territory. Redistribution requires a NOTICE file. Over 100M MAU needs a separate licence. **Excluded for an EU user**, and it carries a notice requirement. — [HF LICENSE](https://huggingface.co/spaces/tencent/HunyuanVideo-Foley/blob/main/LICENSE); [GitHub issue #50 (EU user asking for written authorisation, no reply seen)](https://github.com/Tencent-Hunyuan/HunyuanVideo-Foley/issues/50); [HF card licence tag](https://huggingface.co/tencent/HunyuanVideo-Foley)
- Memory: XXL 20 GB (12 GB with offload), XL 16 GB (8 GB with offload). CUDA/Linux only, 48 kHz output. Community ComfyUI nodes: if-ai/ComfyUI_HunyuanVideoFoley (FP8, CPU offload) and phazei/ComfyUI-HunyuanVideo-Foley. — [GitHub](https://github.com/Tencent-Hunyuan/HunyuanVideo-Foley)
- Self-reported benchmarks beat MMAudio on most metrics. MovieGen-Audio-Bench: DeSync 0.74 vs 0.80, IB 0.35 vs 0.27, MOS-Q 4.14 vs 3.58. Kling-Audio-Eval: FD_PANNs 6.07 vs 9.01. MMAudio still wins IS (9.59 vs 8.30) and CLAP. — [GitHub](https://github.com/Tencent-Hunyuan/HunyuanVideo-Foley)

**ThinkSound / PrismAudio (Alibaba FunAudioLLM)**
- Code Apache 2.0, but the README says code, models and dataset are "for research and educational purposes only. Commercial use is NOT permitted". It also bundles a Stable Audio Open VAE (Stability Community Licence). PrismAudio (ICLR 2026) was released on the `prismaudio` branch on 24 Mar 2026. **Excluded.** — [GitHub](https://github.com/FunAudioLLM/ThinkSound)

**AudioX (HKUST, ICLR 2026)**
- Weights CC BY-NC, "watermarked and strictly for non-commercial use". (audiox.app is an unrelated commercial product.) **Excluded.** — [search summary of GitHub ZeyueT/AudioX](https://github.com/ZeyueT/AudioX); [PR #5 audit](https://github.com/kajisho5/sound-design-skill/pull/5)

**ControlFoley (Xiaomi, Apr 2026; ACM MM 2026)**
- Code Apache 2.0, weights CC BY-NC 4.0. **Excluded.** Official ComfyUI nodes came in Jul 2026. audio.cpp v0.7 (26 Aug 2026) added a GGUF F32/Q8 C++ port. Default length 8 s. Claims the best CLAP/DeSync/IS on VGGSound, Kling-Audio-Eval and MovieGen-Audio-Bench (IS 22.08 vs 17.36 on VGGSound). — [GitHub](https://github.com/xiaomi-research/controlfoley); [audio.cpp](https://github.com/0xShug0/audio.cpp)

**Sony AI Woosh (2026, arXiv 2604.01929)**
- Includes text-to-audio (Woosh-Flow/DFlow) and V2A (Woosh-VFlow/DVFlow). Code MIT/Apache, weights CC BY-NC 4.0. CPU or CUDA install only. **Excluded.** — [GitHub](https://github.com/SonyResearch/Woosh)

**FoleyCrafter (open-mmlab, IJCV 2026)**
- Repo Apache-2.0, model released Jul 2024. ComfyUI node: smthemex/ComfyUI_FoleyCrafter. It adapts a frozen text-to-audio base model; the base's own licence still applies. — [GitHub](https://github.com/open-mmlab/FoleyCrafter); [ComfyUI node](https://github.com/smthemex/ComfyUI_FoleyCrafter)

**Kling-Foley, MultiFoley, V-AURA**
- Kling-Foley (arXiv 2506.19774, Jun 2025) released the Kling-Audio-Eval benchmark. No public model weights were verified. — [arXiv](https://arxiv.org/html/2506.19774); [PR #5 audit ("no public model found")](https://github.com/kajisho5/sound-design-skill/pull/5)
- MultiFoley: no weight release found. V-AURA: nothing found.

**Other**
- LTX-2 (Lightricks, Jan 2026) generates video and audio jointly. It does not add audio to an existing video. — [Wikipedia](https://en.wikipedia.org/wiki/LTX-2)

### Inferences
- FoleyCrafter is very likely excluded because of its base model. If its frozen base is Auffusion (not confirmed by the sources), that base is CC BY-NC-SA per [PR #5](https://github.com/kajisho5/sound-design-skill/pull/5).
- The training data behind every V2A model (VGGSound, AudioSet) is real-world footage. Flat shapes snapping, counters ticking and boxes dropping have no "real" sound source, so these models would likely guess or produce ambient mush. Their headline strength is sync on visible physical impacts. MSP gets better sync for free by placing sounds at known GSAP timestamps (frame-exact).
- Even setting licence aside, Mac feasibility is weak. No V2A repo officially supports MPS. MMAudio's MPS port was rejected. HunyuanVideo-Foley is CUDA-only. audio.cpp's Metal path is described as "portability/testing" with lower coverage.

### Gaps
- No source tests any V2A model on synthetic motion graphics or UI animation. The fit claim above is inference only.
- The HunyuanVideo-Foley "max duration" is not stated. No M-series timing exists for any V2A model.
- I could not confirm whether ControlFoley runs on the audio.cpp Metal backend.
- I found no 2026 V2A release with Apache/MIT weights. MiDashengLM-Gen and MOSS v2 are text-only.

## Text-to-SFX models: licence, Mac feasibility, quality for UI-style sounds

### Takeaway
Two text-to-SFX models pass the licence filter. **MOSS-SoundEffect v2.0** (Apache 2.0, 1.3B, 48 kHz, up to 30 s, May 2026)
is the strongest, with ComfyUI nodes. **EzAudio** (MIT code and weights, 24 kHz) is the older fallback. Everything else
classic is non-commercial: AudioLDM 1/2, Tango/Tango 2, TangoFlux, AudioGen, Make-An-Audio, Auffusion and Stable Audio.
No source shows quality on UI clicks, ticks or pops for any of them; that needs a local listening test.

### Cited Findings
**MOSS-SoundEffect v2.0 (OpenMOSS / Fudan, released 26 May 2026)**
- HF licence tag apache-2.0. 1.3B DiT with flow matching (safetensors metadata says about 1B). 48 kHz. Up to 30 s per call, default 10 s. English and Chinese prompts. Supports full DiT fine-tuning on your own data. No benchmarks published on the card. — [HF card](https://huggingface.co/OpenMOSS-Team/MOSS-SoundEffect-v2.0); [README](https://github.com/OpenMOSS/MOSS-TTS/blob/main/moss_soundeffect_v2/README.md)
- Qwen3-1.7B text encoder and DAC VAE. Apache 2.0 "without revenue thresholds". Covers environments, human-action and percussive clips. No VRAM, speed or Mac data. — [aifilms.ai write-up (secondary)](https://studio.aifilms.ai/blog/moss-soundeffect-v2-open-source-sound-design)
- The reference code targets CUDA (cu128, `torch.compile` and Triton CUDA Graph, a first compile taking "a few minutes"). Example settings: 100 steps, cfg 4.0, bf16. One of its example prompts is a mechanical-keyboard "click-clack". — [README](https://github.com/OpenMOSS/MOSS-TTS/blob/main/moss_soundeffect_v2/README.md)
- ComfyUI: envy-ai/ComfyUI-MOSS-SoundEffect-v2 (native nodes; int8 only on CUDA). TTS-Audio-Suite v5.5.0 has a v2 engine (model about 11 GB download, chunks over 30 s). — [envy-ai nodes](https://github.com/envy-ai/ComfyUI-MOSS-SoundEffect-v2); [TTS-Audio-Suite releases](https://github.com/diodiogod/TTS-Audio-Suite/releases)
- Prompt adherence was reported as poor for the SoundEffect model (ROCm user, issue #97). It is unclear whether v1 or v2 was used. — [issue #97](https://github.com/OpenMOSS/MOSS-TTS/issues/97)

**MOSS-SoundEffect v1 (8B autoregressive "MossTTSDelay")**
- Apache 2.0 (per derivative cards), about 16 GB in bf16. MLX ports exist: appautomaton/openmoss-sound-effect-mlx (4-bit, 4.7 GB, run via the mlx-speech scripts) and dpetrusevich/MOSS-SoundEffect-MLX-4bit (5.8 GB, mlx-audio-swift fork). Neither reports Mac speed. — [appautomaton MLX](https://huggingface.co/appautomaton/openmoss-sound-effect-mlx); [dpetrusevich MLX](https://huggingface.co/dpetrusevich/MOSS-SoundEffect-MLX-4bit); [OpenMOSS v1 card](https://huggingface.co/OpenMOSS-Team/MOSS-SoundEffect)
- Described as "~18 GB, slow on a single GPU" in a ComfyUI node README. — [richservo/comfyui-moss-tts](https://github.com/richservo/comfyui-moss-tts)

**EzAudio (OpenSound, Interspeech 2025)**
- HF licence MIT. Repo MIT. — [HF card](https://huggingface.co/OpenSound/EzAudio); [GitHub](https://github.com/haidog-yaqub/EzAudio)
- An independent audit (31 Oct 2026) chose EzAudio as the only clean SFX engine: code MIT, weights MIT, text encoder flan-T5-XL Apache-2.0. It flags YouTube-sourced training data. Settings: 100 DDIM steps, 1–10 s, 24 kHz output. Speed and VRAM were not verified. — [PR #5](https://github.com/kajisho5/sound-design-skill/pull/5)
- The example code picks `cuda`, otherwise `cpu`. No MPS path. — [GitHub](https://github.com/haidog-yaqub/EzAudio)

**MiDashengLM-Gen (Xiaomi, 12 Aug 2026)**
- Code Apache 2.0 (weights Apache per a secondary source only). 3B parameters. Mixed speech, music and SFX "audio scenes" at **16 kHz**. — [GitHub](https://github.com/xiaomi-research/midashenglm-gen); [arXiv 2608.11804](https://arxiv.org/abs/2608.11804); [aifilms.ai (secondary)](https://studio.aifilms.ai/blog/midashenglm-gen-unified-audio-generation-open-source)

**Excluded on licence (weights non-commercial, or Stability)**
- AudioLDM 1 and 2: CC BY-NC-SA 4.0. AudioGen: MIT code, CC BY-NC 4.0 weights. Tango and Tango 2: CC BY-NC-SA. Auffusion: CC BY-NC-SA. SoundCTM: needs AudioLDM's NC VAE. Stable Audio Open: Community Licence. GenAU, AudioLCM and Make-An-Audio 2: no public model found. — [PR #5 audit](https://github.com/kajisho5/sound-design-skill/pull/5)
- TangoFlux: "non-commercial, research-only", under the Stability Community Licence and WavCaps academic terms. It is otherwise strong: 515M params, 44.1 kHz stereo, up to 30 s, about 3.7 s per 30 s clip on an A40, and the best FD/CLAP/IS against AudioLDM 2, Tango 2 and SAO. ComfyUI node: LucipherDev/ComfyUI-TangoFlux. — [GitHub](https://github.com/declare-lab/TangoFlux)

### Inferences
- MOSS v2 at 1.3B (about 11 GB download) should fit easily in 36 GB. MPS support is unproven: the reference path uses CUDA-only `torch.compile`/Triton, so it would need eager mode on `mps` or CPU. Expect it to be slower than CUDA but workable for a one-off kit of about 30 sounds.
- For very short UI one-shots (50–300 ms clicks and ticks), these diffusion models are trained on clips of several seconds and a duration tag. Expect to generate 1–2 s and trim/gate in post. Sharp transients are plausible with the DAC codec, but nothing confirms it.
- MiDashengLM-Gen's 16 kHz output is too dull for crisp UI sounds on phone speakers. EzAudio's 24 kHz is marginal.

### Gaps
- No published listening tests or benchmarks for UI-style sounds (clicks, ticks, pops, chimes, whooshes) for any model.
- No measured M-series speed or memory for MOSS v2 or EzAudio. The v1 MLX ports also give no speed.
- The MOSS v2 training-data provenance is not documented (only "over 10 000 hours").

## ComfyUI nodes and MLX/Metal ports

### Takeaway
ComfyUI has nodes for almost everything, but most are CUDA-oriented. For licence-clean models: MOSS-SoundEffect v2 has
ComfyUI nodes (envy-ai, TTS-Audio-Suite), and MOSS v1 has MLX 4-bit ports. EzAudio has no node or MLX port found.

### Cited Findings
- MOSS v2: envy-ai/ComfyUI-MOSS-SoundEffect-v2; TTS-Audio-Suite "Sound Effects" node. MOSS v1: richservo/comfyui-moss-tts, kana112233/ComfyUI-kaola-moss-tts (in ComfyUI Manager). — [envy-ai](https://github.com/envy-ai/ComfyUI-MOSS-SoundEffect-v2); [TTS-Audio-Suite](https://github.com/diodiogod/TTS-Audio-Suite/releases); [richservo](https://github.com/richservo/comfyui-moss-tts); [kana112233](https://github.com/kana112233/ComfyUI-kaola-moss-tts)
- MLX: MOSS v1 4-bit ports (appautomaton via mlx-speech; dpetrusevich via mlx-audio-swift fork). — [appautomaton](https://huggingface.co/appautomaton/openmoss-sound-effect-mlx); [dpetrusevich](https://huggingface.co/dpetrusevich/MOSS-SoundEffect-MLX-4bit)
- audio.cpp (ggml, C++): 62 models as of v0.7 (26 Aug 2026), including ControlFoley (NC). Metal is on by default on Apple, but "CUDA is the optimized path". — [audio.cpp](https://github.com/0xShug0/audio.cpp)
- Nodes for excluded models: HunyuanVideo-Foley (if-ai, phazei), ControlFoley (official), TangoFlux (LucipherDev), FoleyCrafter (smthemex). — sources above.

### Inferences
- The project already runs ComfyUI locally (repo rules mention ComfyUI jobs), so the MOSS v2 ComfyUI node is the lowest-friction test path. Expect to run with fp32/bf16 on MPS without the int8 or compile speed-ups.

### Gaps
- I did not find whether mlx-audio (Python) supports MOSS v2 or any SFX model. I also found no MLX port of MOSS v2 itself.

## Practical recommendation: generated SFX vs curated CC0 library for a small brand kit

### Takeaway
Make a curated CC0 library (Freesound CC0, Sonniss GDC bundles per prior notes) plus a few hand-tuned sounds the
primary kit, placed at the known GSAP timestamps. Use MOSS-SoundEffect v2 only as an optional, licence-clean generator
to fill gaps (e.g. "cardboard puzzle piece snap"), after a local A/B listening test. Skip video-to-audio entirely for now.

### Cited Findings
- Every V2A option is non-commercial or excludes the EU (see section 1). Only MOSS v2 (Apache 2.0) and EzAudio (MIT) are licence-clean text-to-SFX options. — [MOSS v2 card](https://huggingface.co/OpenMOSS-Team/MOSS-SoundEffect-v2.0); [PR #5](https://github.com/kajisho5/sound-design-skill/pull/5)
- The prompt-adherence complaint on MOSS SoundEffect suggests variable output that needs curation anyway. — [issue #97](https://github.com/OpenMOSS/MOSS-TTS/issues/97)

### Inferences
- A brand kit needs about 10–20 consistent one-shots (snap, tick, count-up roll, drop/thud, whoosh, chime, pop). Consistency and transient crispness matter more than variety. Picking from human-recorded CC0 sounds, then trimming and EQ'ing them once, is faster and more predictable than prompting a diffusion model and curating its output.
- Generated SFX make sense for puzzle-specific textures a library lacks (cardboard pieces clicking, a box lid, pieces pouring). MOSS v2 with 1–2 s generations, trimmed, is the candidate. Optional later step: fine-tune MOSS v2 on the curated kit to get on-brand variations (fine-tuning is supported).
- Record provenance (model, version, prompt, seed, licence) per sound in the kit manifest, so the no-attribution rule stays auditable.
- Under the project's heavy-jobs rule, a MOSS v2 test counts as a local generation job: it needs the owner's go-ahead and run metrics (wall time, peak memory, swap).

### Gaps
- No head-to-head quality data for generated vs library UI sounds. This needs the owner's own listening test (a lab gallery with Works / Unsure / No-go per sound).
- Whether outputs of Apache-2.0 models need any notice: Apache's NOTICE/attribution duties apply to redistributing the model or code, not to generated audio. The licence texts were not read in full to confirm this for MOSS v2.
