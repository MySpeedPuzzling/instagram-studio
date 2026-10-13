# Local image generation and 3D rendering on an M3 Max (36 GB) for MSP Instagram visuals

Research date: 2026-10-13. Scope: open-weight image models, Mac runtimes, control and consistency, local video, Blender procedural puzzle renders, and a lean disk plan. The target machine was checked locally (read-only) on 2026-10-13. It has an Apple M3 Max with a **30-core GPU** and 36 GiB unified memory (`hw.memsize` = 38,654,705,664 bytes). `iogpu.wired_limit_mb` is 0, so the macOS default GPU limit applies. The disk has 82 GiB free. Installed apps: Blender 5.2.2, Draw Things build 26.1008.0, Comfy Desktop 1.0.29, LM Studio 0.3.5. The ComfyUI models folder already holds about 106 GiB of models (listed under the last question). Leaderboard Elo numbers come from different Artificial Analysis snapshots, so compare them only within one snapshot.

## Which open-weight text-to-image models are state of the art (Oct 2026), and which are usable commercially on this Mac?

### Takeaway
The highest-ranked open-weight models in October 2026 are Qwen-Image-2.1 (Sep 2026), Ideogram 4.0 (Jun 2026), FLUX.2 [dev] and HunyuanImage 3.0. **None of them is usable here.** Their licenses are non-commercial or research-only, or (for Tencent) exclude the EU, and FLUX.2 [dev] is also too big for 36 GB. These models are commercially safe, permissively licensed and fit on this Mac:
- **HiDream-O1-Image** (MIT, 8B, Elo about 982)
- **Z-Image Turbo** (Apache-2.0, 6B, Elo about 941)
- **ERNIE-Image Turbo** (Apache-2.0, 8B, Elo about 924)
- **FLUX.2 [klein] 4B** (Apache-2.0, Elo about 863, but strong at multi-reference editing)
- **Qwen-Image-Edit-2511** (Apache-2.0, 20B, editing)

### Cited Findings

**Leaderboards (Artificial Analysis Text-to-Image arena)**
- AA-Image-T2I v2.0, open-weights view, top entries:

  | Model | Released | Elo |
  |---|---|---|
  | Qwen-Image-2.1 | Sep 2026 | 1037 |
  | Ideogram 4.0 (Quality) | Jun 2026 | 1012 |
  | FLUX.2 [dev] | Nov 2025 | 1000 |
  | Ming-Image-0.1-Design | Sep 2026 | 998 |
  | HunyuanImage 3.0 Instruct | Jan 2026 | 995 |
  | Cosmos3-Super-Text2Image | May 2026 | 987 |
  | HiDream-O1-Image | May 2026 | 982 |
  | HunyuanImage 3.0 | Sep 2025 | 943 |
  | FLUX.2 [klein] 9B | Jan 2026 | 941 |
  | Z-Image Turbo | Dec 2025 | 941 |
  | ERNIE Image Turbo | Apr 2026 | 925 |

  The top proprietary model, GPT Image 2.5 Sunburst (max), scores 1199. The leading open model is about 160 Elo behind. — [Artificial Analysis, open-weights filter](https://artificialanalysis.ai/image/leaderboard/text-to-image?open-weights=true)
- A mirror of the AA arena, updated **Oct 11, 2026**, adds lower-ranked models: Qwen Image 2.0 964, FLUX.2 [klein] Base 9B 903, GLM-Image 891, Qwen Image 889, HunyuanImage 2.1 887, HiDream-O1-Image-Dev 875, HiDream-I1-Dev 874, FLUX.2 [klein] 4B 863, FLUX.1 Krea [dev] 847. It lists "FLUX 3 Image" at 1116 but does not mark open-weights status. — [The Open Weights leaderboard](https://theopenweights.com/leaderboards/text-to-image)
- An older AA open-weights arena snapshot used a different Elo scale: Ideogram 4.0 (Quality) 1211, HiDream-O1-Image-Dev-2604 1198, FLUX.2 [dev] 1196. The snapshots conflict, so compare scores only within one snapshot. — [Artificial Analysis (search snapshot)](https://artificialanalysis.ai/image/leaderboard/text-to-image?open-weights=true); [AA-Image-T2I v2.0](https://artificialanalysis.ai/image/leaderboard/text-to-image)
- No LMArena text-to-image open-weights data was retrieved directly. Only a third-party summary turned up. — [WaveSpeed blog on LMArena 2026](https://wavespeed.ai/blog/posts/lm-arena-text-to-image-rankings-2026/)

**Models whose licenses rule them out for MSP's commercial Instagram use**
- **Qwen-Image-2.1**
  - Release and size: released Sep 20, 2026. A 7B DiT (32 single-stream layers) plus a separate Qwen3-VL-8B text encoder. The repo is 33.1 GB. — [datanorth](https://datanorth.ai/news/qwen-releases-qwen-image-2-1); [HF model card](https://huggingface.co/Qwen/Qwen-Image-2.1) (repo size from the HF API)
  - Capabilities: unified generation and editing with up to 10 reference images, plus local edits via circles, masks or annotations. — [HF model card](https://huggingface.co/Qwen/Qwen-Image-2.1)
  - License: **Qwen Research License (HF tag `qwen-research`)**, which allows non-commercial use only. Earlier Qwen-Image releases (1.0, Edit, Layered, 2512) were Apache-2.0. — [HF model card](https://huggingface.co/Qwen/Qwen-Image-2.1); [cellcog analysis](https://cellcog.ai/blog/qwen-image-2-1/)
- **Ideogram 4.0**
  - Release and size: released Jun 3, 2026. 9.3B parameters, Qwen3-VL-8B-Instruct text encoder, frozen Flux VAE. Ships nf4 and fp8 checkpoints only. The nf4 variant fits a 24 GB GPU.
  - Text rendering: self-reported X-Omni English OCR score of 0.97, with typed text elements placed in bounding boxes. This is the best text rendering among open models. — [Ideogram blog](https://ideogram.ai/blog/ideogram-4.0/)
  - License: the weights fall under the **Ideogram Non-Commercial Model Agreement (NCMA)**. Revenue-generating use needs a paid self-serve or enterprise license. The inference code is Apache-2.0. — [vidcella review](https://vidcella.ai/posts/ideogram-4-0-review); [therundown](https://www.therundown.ai/tools/ideogram-4-0)
  - Ideogram 4.5 is reportedly closed-weights (single third-party source). — [OrcaRouter](https://www.orcarouter.ai/blog/ideogram-4-5)
- **FLUX.2 [dev]**
  - Size: the single bf16 file is 64.45 GB (about 32B parameters by size). The full repo is 177.6 GB. Impractical on 36 GB. — [HF repo](https://huggingface.co/black-forest-labs/FLUX.2-dev) (sizes from the HF API)
  - License: FLUX [dev] Non-Commercial License v2.0. The license says outputs may be used for any purpose, including commercial ones, but the model itself may only be used for "Non-Commercial Purposes." Commercial use of the model needs a BFL license, and outputs may not be used to train competing models. — [BFL license](https://bfl.ai/legal/non-commercial-license-terms)
  - A community thread argues that the "data produced" wording muddies whether outputs are commercially usable. — [HF discussion](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B/discussions/24)
- **FLUX.2 [klein] 9B / 9B Base**
  - Release and size: released Jan 15, 2026. 18.16 GB bf16, Qwen3-8B text encoder.
  - License: FLUX Non-Commercial License (v2.1 per DeepWiki). The HF repo is gated. — [VentureBeat](https://venturebeat.com/technology/black-forest-labs-launches-open-source-flux-2-klein-to-generate-ai-images-in); [DeepWiki licensing](https://deepwiki.com/black-forest-labs/flux2/7.4-licensing-and-terms); [HF repo](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B)
- **HunyuanImage 3.0 / 2.1 (Tencent Hunyuan Community License)**: the "Territory" is worldwide **excluding the European Union, United Kingdom and South Korea**, so a Czech company cannot rely on it. The license also forbids using outputs to improve other AI models. — [HunyuanImage-3.0 LICENSE](https://huggingface.co/tencent/HunyuanImage-3.0/blob/main/LICENSE)
  - HunyuanImage 2.1 uses the same license family. Its DiT checkpoints alone are 34.9 GB bf16 or 17.9 GB fp8. — [HF repo](https://huggingface.co/tencent/HunyuanImage-2.1)

**Models usable commercially (permissive or small-business licenses)**
- **HiDream-O1-Image**
  - License: **MIT** for code and weights.
  - Architecture: 8B pixel-level unified transformer with no separate text encoder or VAE.
  - Variants: full (50 steps, CFG 5.0) and Dev (28 steps, CFG 0). Dev-2604 was added May 14, 2026.
  - Capabilities: up to 2048 px, long-text rendering (LongText-Bench EN 0.979), instruction editing, multi-reference personalization, and layout/skeleton conditioning (added May 13, 2026).
  - Hardware: the official README requires CUDA and recommends flash-attn. — [GitHub](https://github.com/HiDream-ai/HiDream-O1-Image)
  - Released May 8, 2026. — [GitHub](https://github.com/HiDream-ai/HiDream-O1-Image)
  - ComfyUI packaging: Comfy-Org ships single-file checkpoints of `hidream_o1_image_bf16` and `_dev_bf16` (16.37 GB each) plus fp8/mxfp8 versions (8.07–8.92 GB). — [Comfy-Org/HiDream-O1-Image](https://huggingface.co/Comfy-Org/HiDream-O1-Image) (sizes from the HF API)
- **Z-Image Turbo** (Tongyi-MAI)
  - License and size: **Apache-2.0**. 6B S3-DiT, 8 NFEs, guidance 0.
  - Capabilities: bilingual English/Chinese text rendering. Fits in 16 GB VRAM. — [HF model card](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo)
  - Release dates: HF repo created Nov 25, 2025. Z-Image (base, 50 steps, for fine-tuning) followed Jan 27, 2026. — [HF API](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo); [Z-Image repo mirror news](https://github.com/ZZfive/Z-Image)
  - ComfyUI files: `z_image_turbo_bf16` 12.31 GB, `qwen_3_4b` text encoder 8.04 GB, `ae` VAE 0.34 GB, so about 20.7 GB total. Comfy-Org also ships int8_convrot (6.20 GB) and nvfp4 (4.51 GB) variants. — [Comfy-Org/z_image_turbo](https://huggingface.co/Comfy-Org/z_image_turbo)
  - GGUF sizes: Q8_0 7.22 GB, Q6_K 5.91 GB, Q4_K_M 5.02 GB. — [unsloth GGUF](https://huggingface.co/unsloth/Z-Image-Turbo-GGUF)
  - Z-Image-Edit and Z-Image-Omni-Base are still listed as "To be released." — [HF model card](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo)
- **ERNIE-Image / ERNIE-Image-Turbo** (Baidu)
  - License and release: **Apache-2.0**. HF repos created Apr 2 and Apr 7, 2026.
  - ComfyUI files: diffusion model 16.07 GB, Ministral-3-3B text encoder 7.72 GB, optional prompt enhancer 6.88 GB. — [Comfy-Org/ERNIE-Image](https://huggingface.co/Comfy-Org/ERNIE-Image); [baidu/ERNIE-Image-Turbo](https://huggingface.co/baidu/ERNIE-Image-Turbo)
  - Size and steps: about an 8B DiT. Turbo runs 8 steps at CFG 1.0; base runs 50 steps at CFG 4.0. Positioned for accurate in-image text. — [comfyui-wiki](https://comfyui-wiki.com/en/models/ernie); [letsdatascience](https://letsdatascience.com/news/ernie-image-delivers-accurate-text-inclusive-image-generatio-d45de927)
- **FLUX.2 [klein] 4B**
  - License and release: **Apache-2.0**, released Jan 15, 2026.
  - Files: distilled 4-step and base variants, 7.75 GB bf16 each. The text encoder is Qwen3-4B, the same `qwen_3_4b.safetensors` that Z-Image uses in ComfyUI.
  - Capabilities: single- and multi-reference editing, including style transforms, object replacement and multi-reference composition. — [HF repo](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B); [ComfyUI docs](https://docs.comfy.org/tutorials/flux/flux-2-klein); [Comfy-Org klein-4B files](https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b)
- **Qwen-Image-Edit-2511**
  - License and release: **Apache-2.0**. 20B parameters, HF repo created Dec 17, 2025.
  - Capabilities: multi-image input, reduced drift, better character consistency, and built-in community LoRAs (lighting, new viewpoint). Recommended settings are 40 steps at true-CFG 4.0. — [HF model card](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)
  - File sizes: bf16 40.86 GB, fp8mixed 20.53 GB. — [Comfy-Org repo](https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI)
  - GGUF sizes: Q8_0 21.76 GB, Q6_K 16.85 GB, Q4_K_M 13.24 GB. — [unsloth GGUF](https://huggingface.co/unsloth/Qwen-Image-Edit-2511-GGUF)
  - A 4-step Lightning LoRA exists from lightx2v. — [ComfyUI docs](https://docs.comfy.org/tutorials/image/qwen/qwen-image-edit-2511)
- **Qwen-Image-2512**: text-to-image, 20B, Apache-2.0. The repo is 57.7 GB, about 41 GB of it the transformer. — [HF repo](https://huggingface.co/Qwen/Qwen-Image-2512)
- **Krea 2**
  - Release and variants: released about Jun 22, 2026. 12B parameters. "Raw" is the undistilled base; "Turbo" is 8-step distilled.
  - License: Krea 2 Community License. Free commercial use applies only under **USD 1M company revenue**, and some sources add a 50-seat cap. Deployers must implement content filtering. — [Krea license page](https://krea.ai/krea-2-licensing); [localaimaster guide](https://localaimaster.com/blog/krea-2-local-guide); [dev.to](https://dev.to/damogallagher/krea-releases-krea-2-as-open-weights-for-image-generation-13pe)
  - Size: the Turbo repo is 62 GB, including a 26.28 GB turbo file and an 8.88 GB text encoder. — [HF repo](https://huggingface.co/krea/Krea-2-Turbo)
  - Speed on Mac: about 3.5 min per image in ComfyUI bf16 on an M1 Max 64 GB. fp8 is rejected on MPS. — [lilting.ch MPS tag](https://lilting.ch/en/tags/MPS)
- **Chroma1-HD**: Apache-2.0, 8.9B, based on FLUX.1-schnell, positioned as a fine-tuning base. The single file is 17.8 GB. — [HF](https://huggingface.co/lodestones/Chroma1-HD)
- **Stable Diffusion 3.5 (Stability Community License)**: free for organizations under USD 1M total annual revenue; an Enterprise license is needed above that. — [Stability license page](https://stability.ai/license); [license update](https://stability.ai/news/license-update)
- **HiDream-I1**: a 17B open model from 2025. Elo 870–874 (Fast/Dev) on the Oct 2026 mirror. — [comfyui-wiki](https://comfyui-wiki.com/en/models/hidream); [The Open Weights](https://theopenweights.com/leaderboards/text-to-image)

**Rough fit on a 32–36 GB Mac**

| Model / format | Weights | Fit (32 GB Mac) |
|---|---|---|
| FLUX.2 klein 4B | 7.75 GB | Fits comfortably |
| Qwen-Image Q4 | 12.1 GB | Fits comfortably |
| SD 3.5 Large | 16.5 GB | Fits comfortably |
| FLUX.2 klein 9B | 18.2 GB | Borderline |
| Qwen-Image Q8 | 21.8 GB | Borderline |

The guide assumes about 5 GB of macOS headroom. — [ModelFit guide, 2026-06-12](https://modelfit.io/guides/local-image-generation-mac/)

### Inferences
- MSP's best license-safe options, ranked by AA quality:
  1. HiDream-O1-Image full (MIT, about 982).
  2. Z-Image Turbo (Apache, about 941). It ties FLUX.2 klein 9B but has none of klein 9B's license problem.
  3. ERNIE-Image Turbo (Apache, about 924).
  4. FLUX.2 klein 4B (Apache, about 863), for editing and reference-guided work rather than raw text-to-image quality.
  5. Krea 2 is also usable while MSP stays under USD 1M revenue, but its 35+ GB footprint is a poor fit for an 82 GB disk.
- FLUX.2 [dev] and klein 9B: their outputs clause is commercially permissive, but running them to make marketing for a business is a model use that is hard to call "non-commercial." Treat them as off-limits for a public, brand-owned Instagram account. This is not legal advice.
- For a Czech/EU operator, Tencent Hunyuan models (image 2.1/3.0) are excluded by the territory clause regardless of output terms.
- Text rendering: Ideogram 4.0 and Qwen-Image-2.1 are the best typographers, but both are non-commercial. Among the commercial-safe models, HiDream-O1, ERNIE-Image and Z-Image render text reasonably. The pipeline should still never let a model render stats, numbers or names; composite them in code instead (see the control question).
- "Non-generic" look comes mostly from art direction rather than model rank: a fixed brand palette, a style LoRA or reference images, real MSP photos or puzzle box art as inputs to editing models, and code-rendered typography.

### Gaps
- No LMArena (text-to-image) open-weights table was retrieved directly. Only AA data and a third-party summary.
- Licenses were not verified for Ming-Image-0.1-Design (InclusionAI, Sep 2026, Elo 998), NVIDIA Cosmos3-Super-Text2Image (May 2026), GLM-Image, or Qwen Image 2.0 (964; open-weights status unknown).
- It is unclear whether AA's "Qwen Image Max 2512" (999) is the Apache-licensed Qwen-Image-2512 or an API-only variant.
- HunyuanImage 3.0's parameter count and memory needs were not verified this session. It is excluded on license grounds anyway.
- The full text of the Krea 2 license (seat cap) could not be loaded. Check krea.ai/krea-2-licensing before use.
- Whether HiDream-O1-Image runs correctly on MPS in ComfyUI is unverified. The official repo targets CUDA only, and no Mac benchmark was found.

## Mac runtimes compared: ComfyUI (MPS), MLX tools (mflux, iris.c), Draw Things — speed and reliability for unattended agent-driven generation

### Takeaway
On Apple Silicon:
- **Draw Things** is the fastest engine.
- **mflux (MLX)** is the cleanest scriptable engine: it has a Python API and a CLI, and supports LoRA training.
- **ComfyUI** is the most flexible graph runtime and already has an MCP server here, but on MPS it **cannot run fp8 checkpoints**, so use bf16 or GGUF.

For an unattended agent, use ComfyUI via its MCP/API for complex graphs (ControlNet, edit, compositing nodes). Use mflux or the Draw Things HTTP/gRPC/CLI for simple, fast text-to-image. Avoid keeping duplicate model copies across runtimes.

### Cited Findings

**This machine's chip**
- The M3 Max with 36 GB is the binned variant: 14-core CPU, 30-core GPU, **300 GB/s** memory bandwidth. The 16-core/40-core variant has 400 GB/s. — [AppleInsider](https://appleinsider.com/inside/apple-silicon/vs/m3-vs-m3-pro-vs-m3-max----specs-features-compared)
- The 30-core GPU delivers about 10.5 TFLOPS FP32, versus 14.1 TFLOPS for the 40-core. — [Lowendmac](https://lowendmac.com/1234/apple-silicon-m3-max-chip-specs/)
- Local check, 2026-10-13: the machine reports "Apple M3 Max", 30 GPU cores.

**ComfyUI on MPS**
- fp8 failures:
  - FP8 checkpoints fail on Metal with `RuntimeError: Undefined type Float8_e4m3fn` (LTX-2 test, M1 Max). — [lilting.ch LTX-2/Wan test](https://lilting.ch/en/articles/ltx2-wan22-mac-local-video-gen)
  - Krea 2's fp8 build is likewise rejected on MPS, so bf16 is mandatory. — [lilting.ch MPS tag](https://lilting.ch/en/tags/MPS)
- Community workarounds:
  - The patch "ComfyUI-AppleSilicon-FP8" claims to make FP8/INT8 diffusion models (FLUX, SD3.5, Ideogram 4, Krea2) run on MPS, with a 1.2–2.1× fp8 matmul speedup. These are the author's claims and are unverified. — [GitHub](https://github.com/pawel-mazurkiewicz/ComfyUI-AppleSilicon-FP8)
  - A March 2026 community custom node claims 22% faster Apple Silicon inference (Flux.1-dev 10.6 → 8.3 s/it, chip unspecified). — [Reddit snapshot](https://reddit.sentinel-team.org/posts/1rxr165/snapshots/2026-03-20T17%3A36%3A49.07391Z)
- Comfy-Org's official klein files are fp8. The ComfyUI tutorial lists fp8 diffusion files for klein 4B and 9B, and quotes RTX 5090 timings (about 1.2 s distilled, 8.4 GB VRAM). — [ComfyUI docs](https://docs.comfy.org/tutorials/flux/flux-2-klein)
- ComfyUI issue #11916 (Jan–Apr 2026): FLUX.2 klein / Z-Image times swing 2–3× with small resolution changes. This was on NVIDIA GTX 1660 Ti, not Mac, and was closed without a fix. — [GitHub issue](https://github.com/Comfy-Org/ComfyUI/issues/11916)

**MLX tools**
- **mflux** (MIT, mflux-community):
  - Supported models: Z-Image 6B, Krea 2 12B, FLUX.2 4B/9B, Ideogram 4 9B, ERNIE-Image 8B, Lens, Ming-Image, Boogu, FIBO, SeedVR2 upscaler, Qwen Image 20B, Qwen Image 2.1, FLUX.1.
  - Features: on-the-fly quantization (e.g. `-q 8`, `-q 4`), and a Python API (e.g. `ZImageTurbo(quantize=8).generate_image(...)`).
  - Training: marked available for Z-Image and FLUX.2. — [GitHub README](https://github.com/mflux-community/mflux)
  - Quantization mechanics: 4-bit quantization at load time via `mlx.nn.quantize`, group size 64. — [mflux source via Context7](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/common/weights/loading/weight_applier.py)
  - v0.22.0 added a ControlNet-union command for Qwen-Image-2.1. — [release notes](https://newreleases.io/project/github/mflux-community/mflux/release/v.0.22.0)
- **Measured: FLUX.2 klein 4B on M1 Max 64 GB** (mflux 0.17.5, 4 steps, Apr 2026)

  | Task | mflux | iris.c |
  |---|---|---|
  | 1024² text-to-image | 21.4 s inference / 31.7 s wall | 41.5 s |
  | Image-to-image edit | 52.4 s | 86.3 s |

  The mflux HF cache for klein 4B is about 16 GB. — [lilting.ch](https://lilting.ch/en/articles/flux2-klein-4b-mflux-iris-m1-max)
- **iris.c** (antirez, pure C FLUX.2 klein), M3 Max 128 GB (40-core), 4 steps, 1024²: 19 s, versus 25 s for PyTorch MPS. The README says Draw Things is the fastest Metal implementation: 14.23 s at 1024² on the same machine, but with 6-bit weights. — [iris.c README](https://github.com/antirez/iris.c)
- A survey estimate of about 105 s at 1024² for klein on M3 Max is pre-measurement and pessimistic. Measured numbers above supersede it. — [lilting.ch klein 9B article](https://lilting.ch/en/articles/flux2-klein-apple-silicon)

**Draw Things**
- Z-Image Turbo results:
  - Up to 54% faster than "other available implementations" on Apple devices.
  - Per step versus Z-Image Turbo, FLUX.1 [dev] is 1.01–1.23× slower and Qwen Image 1.31–1.41× slower.
  - Z-Image Turbo at 6-bit needs about 4 GiB RAM, versus about 11 GiB for Qwen Image. — [Draw Things blog, Dec 9, 2025](https://releases.drawthings.ai/p/quantify-z-image-turbo-efficiency)
- Draw Things claims about 1 s interactive latency for klein 4B/9B and Z-Image Turbo with "Lightning Draft", but only on M5 Max. — [Draw Things blog](https://releases.drawthings.ai/p/introducing-lightning-draft-interactive)
- FLUX.2 klein 9B takes about 15 s at 1024² on an M5 Max 128 GB in Draw Things. — [note.com test](https://note.com/tamilab/n/n89032ac3645d?hl=en)
- Automation interfaces:
  - **HTTP API** (off by default): Automatic1111-compatible `POST /sdapi/v1/txt2img` on localhost:7860, using the currently loaded model. — [playbooks skill doc](https://playbooks.com/skills/openclaw/skills/drawthings)
  - **MCP bridge**: `mcp-drawthings` adds Claude Code tools `generate_image` and `transform_image`. The API processes one request at a time. — [heyuan110 tutorial, Feb 16, 2026](https://www.heyuan110.com/posts/ai/2026-02-16-claude-code-draw-things-workflow/); [npm package](https://socket.dev/npm/package/mcp-drawthings)
  - **gRPC server**: Draw Things also publishes `gRPCServerCLI` (headless, port 7859, GPL-3.0) and a `draw-things-cli generate --model ...` command. — [draw-things-community](https://github.com/drawthingsai/draw-things-community)
  - Community clients document a `generateImage` gRPC method. — [LM Studio plugin source](https://lmstudio.ai/ceveyne/generate-image/files/src/services/drawThingsGrpcService.ts)
- Approximate Draw Things speed table (FLUX.1 schnell, 4 steps, 1024²): about 9 s on M3 Pro/Max and about 7 s on M4 Pro/Max. The numbers are not tied to a specific setup. — [heyuan110](https://www.heyuan110.com/posts/ai/2026-02-16-claude-code-draw-things-workflow/)

**Memory limits on macOS**
- The GPU wired-memory limit can be raised with `sudo sysctl iogpu.wired_limit_mb=<MB>`, which resets at reboot. A cited default is about two-thirds of RAM on 32 GB Macs. — [mehmetbaykar.com](https://mehmetbaykar.com/posts/increase-vram-apple-silicon-local-llm/); [runaihome MPS OOM guide](https://runaihome.com/blog/mps-backend-out-of-memory-fix-mac-2026/)

### Inferences
- Expected speed on this exact chip (30-core, 300 GB/s) is about 25–35% slower than the M3 Max 40-core figures above. For 1024² (or 1080×1350) at 4–8 steps:
  - Z-Image Turbo or klein 4B: roughly **15–35 s per image**.
  - Qwen-Image-Edit-2511 with the 4-step Lightning LoRA (GGUF): roughly 1–2 min.
  - Full 40-step Qwen edit or 50-step HiDream-O1: several minutes.

  These are estimates scaled from the benchmarks above, not measurements.
- Reliability for unattended runs:
  - ComfyUI has the richest control and an MCP server already installed. Its weak spots on Mac are fp8 files (avoid them; pick bf16 or GGUF) and occasional MPS NaN/black-image failures with new models.
  - mflux is deterministic and scriptable from Python/CLI with no GUI dependency, and suits batch jobs launched by Claude Code.
  - Draw Things is fastest but needs the GUI app running for the HTTP API (single request queue). The gRPC CLI path is headless but less documented.
- Disk hygiene matters more than speed with 82 GB free. mflux downloads its own HF-format copies (about 16 GB for klein 4B), and Draw Things keeps its own converted models. Running the same model in all three runtimes can triple disk use. Pick one primary runtime per model.
- With 36 GB, keep only one large diffusion model resident at a time. A 20B Qwen edit model at Q6 (16.9 GB) plus a 7.5 GB text encoder is near the default GPU working-set limit. ComfyUI's model unloading or `--lowvram`-style offload helps. Raising `iogpu.wired_limit_mb` is an option, but leave 4–8 GB for macOS.

### Gaps
- No first-hand benchmark exists for Z-Image Turbo, ERNIE-Image or HiDream-O1 on any M3 Max (30- or 40-core) in seconds per image. A 10-minute local benchmark is the recommended next step.
- The MPS fp8 status in the latest PyTorch release (Oct 2026) was not confirmed from an official PyTorch or ComfyUI statement. The evidence is community reports from Mar–Jul 2026.
- The exact default `iogpu` working-set limit for a 36 GB machine was not confirmed from Apple docs.
- The Draw Things gRPC proto, and whether `draw-things-cli` can target a running server, were not verified.

## Consistency and control: style LoRAs on Apple Silicon, reference/edit adapters, ControlNet/layout, and keeping text/data out of AI rendering

### Takeaway
Brand consistency is achievable locally without training:
- **FLUX.2 klein 4B multi-reference editing** for style references.
- **Qwen-Image-Edit-2511** for consistent subjects, relighting and new viewpoints.
- **Z-Image Turbo + Fun ControlNet Union** for layout and pose.

Style-LoRA training is possible on the Mac via `mflux-train` for Z-Image, ERNIE-Image and FLUX.2. No reliable training-time numbers exist for an M3 Max, and PyTorch-MPS trainers have a poor track record. All text, numbers and logos should be composited deterministically after generation.

### Cited Findings

**LoRA training**
- mflux ships `mflux-train --config <json>`:
  - The Z-Image example targets attention q/k/v in blocks 15–30, rank 8, AdamW at 1e-4, 8-bit quantized base. It auto-adds a Turbo training adapter when training on Turbo.
  - An ERNIE-Image-Turbo config uses rank 16, max_resolution 1024 and a `low_ram` flag. — [mflux Z-Image README](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/z_image/README.md); [mflux ERNIE README](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/ernie_image/README.md)
- The mflux model table marks training "Yes" only for Z-Image and FLUX.2. Its docs also contain an ERNIE-Image-Turbo training config. — [mflux README](https://github.com/mflux-community/mflux)
- PyTorch-MPS training reports are poor:
  - SD1.5 LoRA took about 15 min on an M4 24 GB, and FLUX LoRA training ran out of memory. fp16 silently produces NaN on MPS; fp32 is required. — [llmbase LoRA skill notes, Mar 2026](https://llmbase.ai/openclaw/lora-finetune/)
  - An Illustrious-XL LoRA failed 13 times on an M1 Max 64 GB before succeeding on a rented RTX 4090. — [lilting.ch FLUX tag](https://lilting.ch/en/tags/FLUX)
- ostris ai-toolkit ships a `run_mac.zsh` launcher, but its docs state an NVIDIA GPU (8 GB+) requirement. Mac quality and speed are unverified. — [earngenix tutorial](https://www.earngenix.com/tutorials/install-ai-toolkit-lora-training)
- LoRAs are not cross-compatible across FLUX.2 klein 4B, 9B and Base. — [lilting.ch FLUX tag](https://lilting.ch/en/tags/FLUX)

**Reference, editing and structural control**
- **FLUX.2 klein 4B (Apache)**: distilled variants support single- and multi-reference editing (style transforms, semantic edits, object replacement, multi-reference composition). The ComfyUI edit workflows take two image inputs. — [ComfyUI docs](https://docs.comfy.org/tutorials/flux/flux-2-klein)
- **Qwen-Image-Edit-2511 (Apache)**:
  - Capabilities: multi-image fusion, improved character and multi-person consistency, built-in lighting and new-viewpoint LoRAs, and geometric reasoning (construction lines). — [HF card](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)
  - In mflux: available as `mflux-generate-qwen-edit --image-paths a.png b.png`, with LoRA support and a Python `QwenImageEdit` class. — [mflux Qwen README](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/qwen/README.md)
- **Z-Image Turbo Fun ControlNet Union**: Canny, HED, Depth, Pose and MLSD in ComfyUI, as a `model_patches` file. — [ComfyUI docs](https://docs.comfy.org/tutorials/image/z-image/z-image-turbo)
- mflux supports ControlNet union for Z-Image and Qwen-Image-2.1, plus fill/inpainting and Redux. — [mflux README](https://github.com/mflux-community/mflux)
- **HiDream-O1-Image (MIT)**: instruction editing (1 reference), multi-reference personalization, and layout/skeleton conditioning. — [GitHub](https://github.com/HiDream-ai/HiDream-O1-Image)
- **Ideogram 4.0** places typed text via bounding boxes, but it is non-commercial (see question 1). — [Ideogram blog](https://ideogram.ai/blog/ideogram-4.0/)
- **Z-Image-Edit** remains unreleased (listed "To be released"). — [HF Z-Image-Turbo card](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo)

**Already on disk** (local check, 2026-10-13)
- Z-Image-Turbo Fun ControlNet Union 2.1-lite (1.9 GiB)
- Qwen-Image-Edit-2511 Lightning 4-step LoRA
- Several style LoRAs (Z-Image: glassmorphism, game icons, vector icons; SDXL: vector illustration, enamel pin, embroidered patch)
- SDXL ControlNet-Union ProMax

### Inferences
- **Recommended consistency stack**:
  1. Hand-curate 10–30 MSP reference images (brand palette, puzzle close-ups, community photos with consent).
  2. Use FLUX.2 klein 4B multi-reference editing or Qwen-Image-Edit-2511 to restyle new compositions toward that reference set.
  3. Fix composition with Z-Image ControlNet (depth/canny) from Blender renders or simple layout sketches.

  Training a Z-Image style LoRA with mflux is a phase-2 option once a reference set exists. Budget a trial run, since no M3 Max timings exist.
- **Never let a model render data.** Generate text-free backgrounds or illustrations (prompt "no text"), then composite typography, numbers, charts and logos with a deterministic renderer (HTML/CSS→PNG via a headless browser, SVG, or Pillow/Skia). This guarantees correct stats and brand fonts, and avoids the "AI slop" tell of warped letters.
- **Blender renders as conditioning.** A Blender puzzle render can feed Z-Image ControlNet (depth/canny) or klein/Qwen edit as a structure reference. This gives geometric accuracy for puzzle pieces, which diffusion models typically get wrong, plus AI-generated surface style.

### Gaps
- No measured LoRA training duration or peak memory for mflux on an M3 Max with 36 GB (Z-Image, FLUX.2 klein 4B or ERNIE).
- No evidence found on IP-Adapter/Redux-style adapters for Z-Image or klein in ComfyUI. klein's native multi-reference editing appears to replace them.
- Kohya/SimpleTuner on Apple Silicon in 2026 was not researched in depth. Only the generic MPS caveats above were found.

## Local video generation on an M3 Max with 36 GB: practical for Reels?

### Takeaway
Mostly no. Wan 2.2 14B in ComfyUI on Apple Silicon runs at about 80 minutes per 2-second clip. LTX-2 in ComfyUI on MPS produced broken or static output. The one plausible path is a **community MLX port of LTX-2.3 at 4-bit**. It needs about 30 GB peak, which is at the edge of 36 GB, and takes roughly 2.5 min of denoising for 5 s at 576×1024 on an M4 Max 128 GB, so expect longer on this M3 Max. Motion for Reels should come from programmatic rendering (Blender, code-driven animation), with AI video at most for occasional b-roll.

### Cited Findings
- **Wan 2.2 14B T2V in ComfyUI** (GGUF Q4_K_S, M1 Max 64 GB): 832×480, 33 frames (about 2 s) took **1 h 22 min**. The author estimates over 3 h for 5 s.
  - FP8 errors on MPS; `wan2.2_vae` caused a decode error after 80 min, fixed by switching to `wan_2.1_vae`.
  - The models total about 24 GB. — [lilting.ch, Mar–May 2026](https://lilting.ch/en/articles/ltx2-wan22-mac-local-video-gen)
- **LTX-2 19B in ComfyUI on MPS** (same article):
  - The FP8 checkpoint failed (Float8 unsupported).
  - The GGUF text-to-video run at 512×288 took about 7 min with an unrecognizable subject. Image-to-video at 768×512 took about 14 min with broken or static motion.
  - The official 2-stage pipeline produced NaN at VAE decode.
  - Conclusion: proper LTX-2 video on Mac was "not feasible." — [lilting.ch](https://lilting.ch/en/articles/ltx2-wan22-mac-local-video-gen)
- **LTX-2 needs float64 RoPE**, which MPS lacks. A community patch forces float32 and recommends 64 GB+ RAM. — [ltx2-mps README](https://git.ddq.nl/Pocket-science/ltx2-mps/raw/commit/c75e87b9be95e953ee734548b23259710c520ac0/README.md)
- **LTX-2.3 MLX port** (22B distilled), M4 Max 128 GB, 576×1024, 121 frames (about 5 s):

  | Backend | Denoise time | Peak memory | Disk |
  |---|---|---|---|
  | PyTorch MPS | 264 s | >60 GB | 46 GB |
  | MLX FP16 | 152.5 s | 34.2 GB | 39 GB |
  | MLX Q4 | 154.3 s | 29.9 GB | 11 GB transformer, about 35–40 GB total repo |

  The author says Q4 suits 32 GB Macs. — [gajesh/ltx-2.3-mlx-q4](https://huggingface.co/gajesh/ltx-2.3-mlx-q4)
- Other MLX ports claim 16 GB minimum with `--low-ram`, 24 GB+ recommended, and include text-to-video, image-to-video and audio. — [PocketAI LTX-2.3 MLX](https://huggingface.co/PocketAiHub/PocketAI-Video-MLX-LTX-2.3); [ltx-2-mlx](https://github.com/dgrauet/ltx-2-mlx)
- **Phosphene** (Apple Silicon app) reports about 7 min for a standard 1280×704 clip and about 12 min for its high-quality tier, on a 64 GB machine. — [Pinokio post](https://pinokio.co/posts/01kqg1pwa346gn8p44tp7698nc)
- **LTX-2.3 official weights**: HF repo created Mar 4, 2026, 46.15 GB per 22B checkpoint. LTX-2 Community License: entities with at least USD 10M annual revenue need a paid license. — [Lightricks/LTX-2.3](https://huggingface.co/Lightricks/LTX-2.3); [PocketAI notes](https://huggingface.co/PocketAiHub/PocketAI-Video-MLX-LTX-2.3)
- **Wan2.2-TI2V-5B**: Apache-2.0, repo 34.2 GB (including an 11.4 GB UMT5 encoder). — [HF](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)
- A 16 GB M4 user reports Wan 2.2 and LTXV 2.3 run "slooow" at 576×432 via GGUF. — [Reddit snapshot, May 2026](https://reddit.sentinel-team.org/posts/1thu5jc/snapshots/2026-05-22T22%3A42%3A24.48386Z)

### Inferences
- **Estimated LTX-2.3 Q4 on this machine** (30-core GPU, 36 GB): 5 s at 576×1024 likely takes about 4–7 min of denoise, plus loading. That is roughly 1.5–2.5× the M4 Max figure, scaled by GPU cores and bandwidth (inference, not measured). It may need a raised GPU wired limit, and nothing else can be loaded at the same time.
- Disk cost of about 35–40 GB for one video model would eat half the free space. That is not justified for occasional clips.
- Reels motion is better produced deterministically:
  - Blender animations (pieces assembling or exploding, camera moves).
  - Code-driven motion graphics: HTML/Canvas or SVG frames rendered by a headless browser and encoded with ffmpeg.
  - Ken-Burns/parallax over AI stills.

  These are reproducible, on-brand and free of the morphing artifacts typical of local video models.

### Gaps
- No M3 Max (any configuration) measurement was found for LTX-2.3 MLX, Wan 2.2 5B or HunyuanVideo 1.5. HunyuanVideo 1.5 on Mac was not found at all.
- Output quality of the LTX-2.3 Q4 MLX ports was not independently assessed. All results are community ports, not Lightricks releases.

## Blender headless (bpy) for procedural 3D jigsaw visuals

### Takeaway
Very practical, and likely the most distinctive, least "AI-slop" visual source for a speed-puzzling brand. Blender 5.2.2 is installed and runs headless with `blender --background --python script.py`. The path that works:
1. Generate jigsaw cut paths as SVG (free CC0 generators exist), or compute them in Python.
2. Import with `bpy.ops.import_curve.svg`, extrude or bevel, and convert to mesh.
3. UV-project a puzzle image onto the pieces.
4. Render stills and assembly/explosion animations on Metal.

No polished free bpy jigsaw add-on was found. Small paid Geometry Nodes assets exist ($1–$15). Render-time numbers for this exact 30-core M3 Max on Blender 5.x were not found.

### Cited Findings
- Headless Blender: `blender --background --python myscript.py`, or `blender scene.blend --background --python myscript.py`. — [Blender API tips (via Context7)](https://docs.blender.org/api/current/info_tips_and_tricks.html)
- SVG import operator `bpy.ops.import_curve.svg(filepath=...)` loads SVG as curve data. — [bpy.ops.import_curve](https://docs.blender.org/api/current/bpy.ops.import_curve.html)
- Curves have `bevel_depth` and extrusion. `bpy.ops.object.convert(target='MESH')` converts curves to meshes. — [bpy.types.Curve](https://docs.blender.org/api/current/bpy.types.Curve.html); [bpy.ops.object](https://docs.blender.org/api/current/bpy.ops.object.html)
- The GPU backend can be queried via `gpu.platform.backend_type_get()` (returns 'METAL' on Mac). — [Blender API (gpu.platform)](https://docs.blender.org/api/current/gpu.platform.html)
- **Free jigsaw path generators**:
  - **Draradech/jigsaw**: client-side HTML/JS generator with square and hex variants. CC0, except the save function, which is "probably cc-by-sa." — [GitHub](https://github.com/Draradech/jigsaw); [Glowforge thread](https://community.glowforge.com/t/jigsaw-puzzle-generator/9284)
  - **piecemaker** (Python): cuts an image into jigsaw pieces, outputs SVG/PNG/JPG plus JSON adjacency data. — [PyPI](https://pypi.org/project/piecemaker/0.4.4/)
  - **samchristywork/jigsaw-puzzle-generator**: SVG output, GPL-3.0. — [GitHub](https://github.com/samchristywork/jigsaw-puzzle-generator)
  - **Inkscape Lasercut Jigsaw** extension (Neon22). — [search reference](https://github.com/Neon22/inkscape-jigsaw)
- **Paid Blender assets**:
  - "Puzzle Generator (Procedural)": Geometry Nodes, square grid, seed and shape controls, separate piece objects, UVs for mapping any image. $15, built for Blender 3.2/3.3. — [Superhive](https://superhivemarket.com/products/puzzle-generator-procedural)
  - "Jigsaw Puzzle": Geometry Nodes, $1, Blender 3.3+, includes a pieces-falling-into-place animation scene. — [Gumroad](https://rbgfilms.gumroad.com/l/fqral)
- **Render performance**:
  - M3 Max **40-core** GPU: Blender 3.3 Classroom (Metal) median about 30.8 s. — [Notebookcheck M3 Max 40-core](https://www.notebookcheck.net/Apple-M3-Max-40-Core-GPU-Benchmarks-and-Specs.782452.0.html)
  - M4 Max: about 5,208 Blender Open Data score, near a laptop RTX 4080. — [9to5Mac](https://9to5mac.com/2024/11/17/m4-max-blender-benchmark/)
  - Blender 4.0+ uses MetalRT hardware ray tracing on M3 (not M1/M2), so older M3 Open Data entries (3.6) understate it. — [Blender devtalk](https://devtalk.blender.org/t/blender-benchmark-and-open-data-website-feedback/1759?page=7)
- Blender 5.0 (Nov 2025) changes:
  - EEVEE changes, including light-probe-volume handling and view-layer overrides. — [Blender 5.0 EEVEE notes](https://developer.blender.org/docs/release_notes/5.0/eevee/)
  - Subsurface scattering gained a local radiance cache on Metal. — [devtalk Nov 3, 2025](https://devtalk.blender.org/t/3-november-2025/43068)
  - Intel Mac support was dropped. — [AlternativeTo](https://alternativeto.net/news/2025/11/blender-5-0-launches-with-aces-color-enhanced-rendering-and-tighter-vfx-integration/)
- Installed version on the target machine is Blender 5.2.2 (local check, 2026-10-13).

### Inferences
- **Recommended approach (agent-friendly, fully free)**:
  1. Have Claude write the piece outlines directly in Python: a grid with Bezier "tab and blank" edges and a seeded jitter, the same maths as Draradech's generator. Writing it directly avoids the SVG import step and its context quirks.
  2. Build each piece as a mesh: fill, then Solidify about 2 mm, plus a small bevel for a cardboard edge.
  3. Apply a planar UV projection from the top and an image texture of the puzzle art (MSP-owned art, a community puzzle photo with permission, or an AI background).
  4. Use a simple studio light rig and a camera framed for 1080×1350.
  5. Animate with keyframes: pieces fly in along staggered curves, a scatter-then-snap-into-grid sequence, or an "explode" made by offsetting pieces along normals plus random rotation.

  Everything is deterministic and seedable. The same script can render a "puzzle of the month" or an "X pieces in Y minutes" visual with the real puzzle image.
- **Render-time estimates** (not measured; extrapolated from the Classroom figure and the 30-core GPU, which has about 25% less compute than the 40-core):
  - Cycles still at 1080×1350, 128–256 samples with the OpenImageDenoise/Metal denoiser: roughly 20–90 s.
  - EEVEE frame: about 1–5 s.
  - 6–10 s EEVEE animation at 30 fps (180–300 frames): roughly 5–20 min.
  - Same animation in Cycles: roughly 1–4 h.

  Use EEVEE for Reels animation and Cycles for hero stills.
- **Quality versus effort**: moderate upfront scripting (one robust generator script plus one or two scene templates), then near-zero marginal cost per post. It also avoids diffusion models' inability to draw correct interlocking jigsaw pieces.
- **LLM scripting reliability is good** if the scripts:
  - avoid `bpy.ops` calls that depend on UI context, preferring `bpy.data` / `bmesh` APIs;
  - pin the Blender version (5.2.x);
  - run headless with `--factory-startup`;
  - save the .blend for debugging;
  - render a low-sample preview first.
- **Hybrid option**: a Blender depth or canny pass can drive a Z-Image ControlNet to restyle a correct puzzle composition (see the control question).

### Gaps
- No Blender 4.x/5.x Open Data median was retrieved for the Apple M3 Max **30-core** GPU. The opendata.blender.org pages did not render for fetching. A local `blender-benchmark` run would close this gap.
- Whether `import_curve.svg` remains a built-in operator in Blender 5.2, rather than a separate extension, was not explicitly confirmed. The "current" API docs still list it.
- No free, maintained Blender add-on specifically for jigsaw generation was found. The paid Geometry Nodes assets target Blender 3.x, and 5.x compatibility is unverified.

## Lean model set for about 82 GB free disk (2–3 models) and what each is for

### Takeaway
The best lean set is mostly **already on disk**:
1. **Z-Image Turbo** (Apache): main text-to-image engine for backgrounds and illustrations, with ControlNet.
2. **FLUX.2 klein 4B** (Apache): reference and style-consistent editing. It shares the same Qwen3-4B text encoder as Z-Image.
3. **Qwen-Image-Edit-2511 at Q6_K + Lightning LoRA** (Apache): heavier edits such as relighting, new viewpoints and multi-image fusion.

Together they take about **50 GiB**, or about **27 GiB without Qwen-Edit**. Deleting the non-commercial klein 9B and duplicate or legacy files would free roughly **35–50 GiB**. **HiDream-O1-Image (MIT, 16.4 GB)** is the only addition worth trialling for top quality. Video models are not worth the disk.

### Cited Findings
- **Current model inventory** (local check of the ComfyUI models folder, 2026-10-13). Total about 106 GiB.

  Diffusion models:
  - `z_image_turbo_bf16` 11 GiB
  - `z_image_turbo-Q8_0.gguf` 6.7 GiB
  - `z_image_bf16` (base) 11 GiB
  - `flux-2-klein-4b` 7.2 GiB
  - `flux-2-klein-4b-Q8_0.gguf` 4.0 GiB
  - `flux-2-klein-9b-Q8_0.gguf` 9.3 GiB
  - `qwen-image-edit-2511-Q6_K.gguf` 16 GiB
  - `sd_xl_base_1.0` 6.5 GiB

  Text encoders:
  - `qwen_3_4b` 7.5 GiB
  - `Qwen3-8B-Q8_0.gguf` 8.1 GiB
  - `Qwen2.5-VL-7B-Instruct-Q8_0.gguf` 7.5 GiB, plus mmproj 1.3 GiB

  VAEs (about 0.9 GiB in total):
  - `flux2-vae` 321 MB
  - `qwen_image_vae` 242 MB
  - `z_image_ae` 320 MB

  Patches, ControlNets and LoRAs:
  - Z-Image ControlNet Union 2.1-lite 1.9 GiB
  - SDXL ControlNet-Union ProMax 2.3 GiB
  - Qwen-Edit Lightning LoRAs: two for 2509 plus one for 2511, 0.8 GiB each
  - About 1.5 GiB of style LoRAs
- Z-Image Turbo's ComfyUI files: bf16 12.31 GB, text encoder `qwen_3_4b` 8.04 GB, VAE 0.34 GB. — [Comfy-Org/z_image_turbo](https://huggingface.co/Comfy-Org/z_image_turbo)
- FLUX.2 klein 4B uses the same `qwen_3_4b` text encoder (4B models use Qwen3 4B; 9B models use Qwen3 8B). — [ComfyUI docs](https://docs.comfy.org/tutorials/flux/flux-2-klein); [Comfy-Org klein-4B files](https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b)
- klein 9B is under the FLUX Non-Commercial License; klein 4B is Apache-2.0. — [HF klein-9B](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B); [HF klein-4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B)
- Qwen-Image-Edit-2511 GGUF sizes: Q6_K 16.85 GB, Q4_K_M 13.24 GB. — [unsloth GGUF](https://huggingface.co/unsloth/Qwen-Image-Edit-2511-GGUF)
- HiDream-O1-Image bf16 single-file checkpoint is 16.37 GB (no separate text encoder or VAE needed). MIT. — [Comfy-Org/HiDream-O1-Image](https://huggingface.co/Comfy-Org/HiDream-O1-Image)
- ERNIE-Image-Turbo in ComfyUI: 16.07 GB diffusion model plus 7.72 GB text encoder, plus an optional 6.88 GB prompt enhancer. — [Comfy-Org/ERNIE-Image](https://huggingface.co/Comfy-Org/ERNIE-Image)
- mflux keeps its own HF-format cache: about 16 GB for klein 4B. — [lilting.ch](https://lilting.ch/en/articles/flux2-klein-4b-mflux-iris-m1-max)

### Inferences
- **Recommended lean set** (ComfyUI as the single model store; sizes in GiB as on disk):

  | Model | Files and size | Use | License |
  |---|---|---|---|
  | **Z-Image Turbo** | `z_image_turbo_bf16` 11 GiB, or Q8 GGUF 6.7 GiB; `qwen_3_4b` 7.5 GiB; `z_image_ae` 0.3 GiB; ControlNet Union 1.9 GiB. About 20.7 GiB (bf16) or about 16.4 GiB (Q8). | Text-free backgrounds, illustrated scenes, puzzle-themed art; ControlNet from Blender depth/canny | Apache-2.0 |
  | **FLUX.2 klein 4B** | 7.2 GiB plus `flux2-vae` 0.3 GiB; the text encoder is shared with Z-Image. About 7.5 GiB extra. | Style-locked edits from brand reference images, multi-reference composition, quick variations | Apache-2.0 |
  | **Qwen-Image-Edit-2511 Q6_K** | 16 GiB, plus Qwen2.5-VL-7B Q8 text encoder 7.5 GiB, plus mmproj 1.3 GiB, plus VAE 0.24 GiB, plus 2511 Lightning LoRA 0.8 GiB. About 25.8 GiB. | Precise edits: relight, change viewpoint, swap objects, fuse a real photo with a generated scene | Apache-2.0 |

  Optional: drop to Q4_K_M (13.24 GB) to save about 3 GB of disk and RAM.

  Total is about 50–54 GiB. Without Qwen-Edit it is about 24–28 GiB.
- **Candidates to delete or move off-disk** (frees roughly 35–50 GiB):
  - `flux-2-klein-9b-Q8_0.gguf` (9.3 GiB) plus `Qwen3-8B-Q8_0.gguf` (8.1 GiB): non-commercial license, and the 8B encoder is only needed for klein 9B.
  - One of the duplicate Z-Image Turbo copies: keep bf16 or Q8, not both (6.7–11 GiB).
  - `flux-2-klein-4b-Q8_0.gguf` (4.0 GiB): duplicate of the bf16.
  - The two Qwen-Edit-2509 Lightning LoRAs (1.6 GiB): superseded by 2511.
  - `z_image_bf16` base (11 GiB): needed only for LoRA training. Re-download when training.
  - SDXL base, the SDXL ControlNet and SDXL LoRAs (about 10 GiB): legacy quality, not needed.
- **Optional quality trial**: HiDream-O1-Image (MIT, 16.4 GiB bf16; AA about 982, versus about 941 for Z-Image Turbo). Only keep it if a local test confirms it runs on MPS in ComfyUI and finishes 50 steps at 1080×1350 in acceptable time. Its fp8 files (8.07 GB) are not expected to work on MPS without the community patch. ERNIE-Image-Turbo (Apache, about 24 GiB with its text encoder) is a lateral move versus Z-Image Turbo, so skip it.
- **Avoid on this machine**:
  - FLUX.2 [dev] (177 GB repo, non-commercial)
  - Qwen-Image-2.1 and Ideogram 4.0 (non-commercial)
  - HunyuanImage (EU excluded)
  - Krea 2 (about 35 GB or more; revenue-capped license)
  - Video models (35–46 GB each)
- **Runtime plan**:
  - Keep ComfyUI as the single model store, driven by the installed ComfyUI MCP server and the API's enqueue/poll.
  - Use Blender headless for puzzle 3D and Reels motion.
  - Use a deterministic compositor for all text and data.
  - Add mflux or Draw Things only if a speed test shows a large win, accepting their separate model copies on disk.

### Gaps
- The local `qwen_3_4b.safetensors` is 7.5 GiB, which matches the Comfy-Org 8.04 GB file in decimal GB. Whether the local klein 4B file is the distilled or base variant was not checked.
- No local speed or quality benchmark was run. Research-only constraint: nothing was downloaded or executed against models.
