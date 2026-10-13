# AI design augmentation for MSP: "code renders the layout, AI adds the craft" on an M3 Max (36 GB), state 2026-10-13

Scope note. This builds on `research_notes/MSP Instagram content pipeline/local_image_generation.md` (runtimes, model licences, speed estimates) and `local_pipeline_learnings_and_inventory.md` (badge-lab results, inventory). It does not repeat them. It goes deeper on hybrid workflows, tools, scheduling, resource measurement and critics.

Method caveats:
- The session's web-search budget ran out partway through. Later facts come from opening known primary pages directly (GitHub, Hugging Face, arXiv, Apple, ComfyUI docs) and from Context7 library docs.
- Several facts come from **read-only checks of the installed ComfyUI source** (core 0.28.0, git `v0.28.0-7-g71b73e3b`, 2026-07-16) under `~/ComfyUI-Installs/ComfyUI/ComfyUI`, and of macOS system state. These are marked "local check".
- No generation, model download or install was done.

Licence stance:
- The owner treats this use as personal/non-commercial and allows every local model for labs.
- The licence column is still recorded for each asset. Non-commercial (NC) items are flagged so they can be swapped out later if the use changes.

## 1. Which hybrid workflows exist in ComfyUI (Oct 2026), do they preserve exact geometry/text, and how do they fit Apple Silicon?

### Takeaway
None of the diffusion workflows below preserves exact text or geometry on its own: ControlNet, img2img, edit models, relighting and upscalers all re-synthesise every pixel they touch. They become reliable only with these rules:
1. Code renders the protected layers: text, numbers, logo and Blender piece edges.
2. AI works on a separate layer or inside a mask.
3. Code composites the protected pixels back afterwards ("composite-back").
4. A pixel-diff check proves that nothing protected changed.

With that rule, the workflows that fit this Mac today with installed files are:
- **FLUX.2 klein 4B** for edit, multi-reference and low-denoise "material passes".
- **Z-Image Turbo + Fun ControlNet Union** for structure driven by Blender or SVG.
- **BiRefNet** cut-outs.
- **Masked inpainting** with native nodes.

The installed core already has native nodes for SeedVR2, Depth Anything 3, SAM3, BiRefNet and Qwen-Image-Layered; only the model files are missing. Not worth a lab:
- **layerdiffuse** (SDXL/SD1.5 only) and **IC-Light** (SD1.5).
- **Qwen-Image-Layered**, a 20B bf16 model that will not fit in 36 GB.

### Cited Findings

**What the installed ComfyUI already provides (local check)**
- Native node IDs found in `comfy_extras/`, all local checks of the source:
  - **SeedVR2:** `SeedVR2Preprocess`, `SeedVR2Conditioning`, `SeedVR2PostProcessing`, plus temporal chunk and merge nodes.
  - **Depth Anything 3:** `LoadDA3Model`, `DA3Inference`, `DA3Render`, `DA3GeometryToMesh`, `DA3GeometryToPointCloud`. Models are read from `models/geometry_estimation/`.
  - **MoGe:** `MoGeInference` and related nodes (geometry and depth).
  - **Qwen:** `EmptyQwenImageLayeredLatentImage`, `TextEncodeQwenImageEditPlus`.
  - **Z-Image:** `TextEncodeZImageOmni`, with up to three reference-image inputs.
  - **FLUX.2:** `EmptyFlux2LatentImage`, `Flux2Scheduler`, `FluxKVCache`, `FluxKontextMultiReferenceLatentMethod`, plus `ReferenceLatent`.
  - **Background removal:** `LoadBackgroundRemovalModel` and `RemoveBackground`.
  - **SAM3:** `SAM3_Detect`.
  - **Inpaint/composite building blocks:** `DifferentialDiffusion`, plus mask nodes `ImageCompositeMasked`, `FeatherMask`, `GrowMask` and `ThresholdMask`.
  - **Other:** `Canny`, `TrainLoraNode`, `GLSLShader`, `TextOverlay`, and the upscalers `UpscaleModelLoader`/`ImageUpscaleWithModel`.
- **Model folders (local check):**
  - Empty: `geometry_estimation/`, `upscale_models/`, `latent_upscale_models/`, `detection/`.
  - `background_removal/` holds `birefnet.safetensors`.
  - `model_patches/` holds `Z-Image-Turbo-Fun-Controlnet-Union-2.1-lite-2602-8steps.safetensors`.

**ControlNet driven by code or Blender structure**
- The Z-Image Turbo Fun Union ControlNet supports "Canny, HED, Depth, Pose, and MLSD". It is a `model_patches` file that sits on the Turbo model. — [ComfyUI docs: Z-Image Turbo](https://docs.comfy.org/tutorials/image/z-image/z-image-turbo)
- The ComfyUI FLUX.2 klein page lists text-to-image and edit templates only. It mentions **no ControlNet or structure conditioning** for klein. — [ComfyUI docs: FLUX.2 klein](https://docs.comfy.org/tutorials/flux/flux-2-klein)
- mflux ships ControlNet "Canny for FLUX.1, Union for Z-Image and Qwen-Image-2.1", plus depth conditioning and depth-map extraction. — [mflux README](https://github.com/mflux-community/mflux)
- Krita AI Diffusion v1.48.0 (21 Feb) added ControlNet for the Qwen image model. v1.49.0 (22 Mar) "Enables Scribble control for Z-Image". — [Krita AI Diffusion releases](https://github.com/Acly/krita-ai-diffusion/releases)
- MSP's own measurement (badge lab, background note §3):
  - Without composite-back, "Klein 4B changes 30–43 % of the rim pixels".
  - A latent noise mask cuts that to 3–4 %.
  - Composite-back keeps the base identical by construction.
  — `research_notes/MSP Instagram content pipeline/local_pipeline_learnings_and_inventory.md` §3

**Low-denoise img2img "material passes"**
- FLUX.2 klein 4B is one model for text-to-image and image-to-image editing (Apache-2.0). It runs about 4 steps at guidance 1.0 in the card's example, needs about 13 GB VRAM on NVIDIA, and "rendered text may be inaccurate or distorted". — [HF: FLUX.2-klein-4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B)
- Krita v1.49.1 (11 Apr) "Fixes Flux 2 Klein 'refine' below 100% strength", so partial-strength klein img2img is a supported path in a mainstream front-end. — [Krita releases](https://github.com/Acly/krita-ai-diffusion/releases)
- mflux exposes img2img on its models as `--image path strength` (Krea 2 example: `--image photo.jpg 0.65`). — [mflux docs via Context7](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/krea2/README.md)
- MSP lab timings on this Mac (768 px, 8 steps, warm):
  - one-reference edits: 80–125 s
  - two-reference edits: 161–181 s
  - klein 4B Q8 text-to-image: median 60 s
  - "klein is distilled: 4 steps ≈ 86 s vs 8 steps 160–180 s"
  — background note §5

**Relighting**
- IC-Light v1 checkpoints are `iclight_sd15_fc`, `_fcon` and `_fbc`, i.e. SD1.5. The repo page has no V2 weights, only a "Some news about flux" discussion link. Its licence is Apache-2.0. The page recommends BiRefNet over BRIA RMBG 1.4 (non-commercial) for commercial use. — [IC-Light GitHub](https://github.com/lllyasviel/IC-Light)
- Qwen-Image-Edit-2511 card (Apache-2.0):
  - "integrates selected popular LoRAs directly into the base model"
  - "Realistic lighting control is now achievable out-of-the-box"
  - "stronger geometric reasoning", "material replacement for industrial components"
  - quick-start uses 40 steps, true CFG 4.0
  — [HF: Qwen-Image-Edit-2511](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)
- On this Mac, Qwen-Image-Edit Q6_K + Lightning took 345–380 s per run (n = 2, 1 ok). Memory was about 28 GB with one input image, and two images were "critical". — background note §5

**Bounded inpainting (masked regions only)**
- Native building blocks are present: `DifferentialDiffusion` (soft masks), `ImageCompositeMasked`, `FeatherMask`, `GrowMask` and `ThresholdMask` — local check, `comfy_extras/nodes_mask.py` and `nodes_differential_diffusion.py`.
- Krita v1.48.0 brought "Flux 2 4B Fill and Expand improvements" and "Color Match … strongest on edit models". It also notes "External ComfyUI installs need an outpaint LoRA for Fill/Expand". — [Krita releases](https://github.com/Acly/krita-ai-diffusion/releases)
- RichHF-18K (CVPR 2024) shows that predicted implausibility heatmaps "can generate masks for inpainting problematic regions". This is a route to automatic "fix the artifact" passes. — [arXiv 2312.10240](https://arxiv.org/abs/2312.10240)

**Multi-reference editing (brand style or texture from references)**
- ComfyUI klein edit templates load **two** input images. The docs state no maximum. — [ComfyUI docs: FLUX.2 klein](https://docs.comfy.org/tutorials/flux/flux-2-klein)
- In BFL's reference code, `encode_image_refs` caps total reference pixels at **2024² for one image and 1024² for several**. More references therefore means lower resolution per reference. — [black-forest-labs/flux2 via Context7](https://github.com/black-forest-labs/flux2/blob/main/_autodocs/api-reference/sampling-prep.md)
- Badge-lab lessons:
  - "To drive the emblem from a vector icon, use Klein 4B multi-reference on an EMPTY base."
  - "2-reference edits are the memory peak: 17–21 GB"; prefer 768 px for edits.
  — background note §3 and §5
- Z-Image "Omni" reference conditioning exists in core (`TextEncodeZImageOmni`, image1–image3) — local check. Whether usable Z-Image Omni/Edit weights are published was **not verified**: the ComfyUI page still describes Z-Image-Edit without a workflow. — [ComfyUI docs: Z-Image](https://docs.comfy.org/tutorials/image/z-image/z-image-turbo)

**Layer decomposition and transparent generation**
- ComfyUI-layerdiffuse: "Currently only SDXL/SD15 are supported". RGBA decoding fails unless dimensions are multiples of 64. — [layerdiffuse GitHub](https://github.com/huchenlei/ComfyUI-layerdiffuse)
- Qwen-Image-Layered:
  - Decomposes an image into a variable number of RGBA layers (3, 4, 8 shown), recursively.
  - 20B parameters in BF16, Apache-2.0, paper dated 2025-12-17.
  - Recommends 640 px, 50 steps, true CFG 4.0.
  — [HF: Qwen-Image-Layered](https://huggingface.co/Qwen/Qwen-Image-Layered)
- ComfyUI Qwen-Image-Layered files: `qwen_image_layered_bf16.safetensors` ("requires high VRAM") or `…_fp8mixed`, the text encoder `qwen_2.5_vl_7b_fp8_scaled`, and a dedicated VAE. The docs say the model "is slow". — [ComfyUI docs: Qwen-Image-Layered](https://docs.comfy.org/tutorials/image/qwen/qwen-image-layered)
- A third-party wiki reports about 45 GB peak and about 120 s at 1024 px on a 96 GB RTX Pro 6000. — [comfyui-wiki](https://comfyui-wiki.com/en/tutorial/advanced/image/qwen/qwen-image-layered) (third-party, approximate)
- mflux lists Ming-Image ("Outputs RGBA") and Qwen Image 2.1 ("RGBA") as MLX-native options. — [mflux README](https://github.com/mflux-community/mflux)

**Depth estimation for 2.5D parallax**
- Depth Anything 3 (released 2025-11-14). Licences per variant:

  | Variant | Params | Licence |
  |---|---|---|
  | DA3-SMALL | 0.08B | Apache-2.0 |
  | DA3-BASE | 0.12B | Apache-2.0 |
  | DA3METRIC-LARGE | 0.35B | Apache-2.0 |
  | DA3MONO-LARGE | 0.35B | Apache-2.0 |
  | DA3-LARGE | 0.35B | CC BY-NC 4.0 |
  | DA3-GIANT | 1.15B | CC BY-NC 4.0 |
  | DA3NESTED-GIANT-LARGE | 1.40B | CC BY-NC 4.0 |

  The repo states "DA3 significantly outperforms DA2 for monocular depth estimation". It has no MPS notes. — [Depth-Anything-3 GitHub](https://github.com/ByteDance-Seed/Depth-Anything-3)
- DepthFlow turns a still plus depth into parallax video using a ray-marching GLSL shader piped to FFmpeg. Licence AGPL-3.0; platform support is not stated. — [DepthFlow GitHub](https://github.com/BrokenSource/DepthFlow)
- mflux includes "Depth Pro" depth estimation. — [mflux README](https://github.com/mflux-community/mflux)

**Upscalers**
- SeedVR2:
  - "one-step, diffusion-based video restoration", Apache-2.0.
  - Stated limitation: it "may over-generate detail on lightly degraded inputs, such as 720p AIGC videos, sometimes producing oversharpened results".
  — [HF: SeedVR2-3B](https://huggingface.co/ByteDance-Seed/SeedVR2-3B)
- numz ComfyUI-SeedVR2 wrapper:
  - 3B and 7B in FP16, FP8 and GGUF Q4_K_M/Q8_0, plus "Sharp" 7B.
  - Guidance: "24GB+: FP16 … no memory optimizations".
  - Tiled VAE: default 1024 tiles, overlap 128.
  - "Full MPS … support"; "BlockSwap is not available on macOS"; v2.5.24 (2025-12-24) "Restored MPS cache clearing after VAE encode/decode".
  — [numz/ComfyUI-SeedVR2_VideoUpscaler](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler)
- mflux's SeedVR2 upscaler has tiling enabled by default "to support high-resolution upscaling on standard memory configurations". — [mflux release notes, via search summary](https://newreleases.io/project/github/filipstrand/mflux/release/v.0.14.0)
- 4x-UltraSharp is ESRGAN (Kim2091, 2021-10-27) under **CC-BY-NC-SA-4.0**. It "generates lots and lots of detail" and was trained mostly on JPEG artifacts. — [OpenModelDB](https://openmodeldb.info/models/4x-UltraSharp)

**Background removal**
- BiRefNet is installed (`background_removal/birefnet.safetensors`) and used by the native `RemoveBackground` node — local check. Its licence is MIT (background note §8). SAM3 detection nodes are also native (local check) for text-prompted masks.

### Inferences

**Per-technique fit for MSP on this Mac.** Memory and time come from lab measurements where they exist; the rest are estimates. Nothing here was run in this research.

| Workflow | Preserves exact text/geometry? | Memory / time on this M3 Max | MPS maturity | Verdict |
|---|---|---|---|---|
| Composite-back + masked inpaint (klein 4B or Z-Image) | Yes, by construction (protected pixels pasted back) | klein 17–21 GB; 80–125 s per candidate at 768 px | High: native nodes, used in the lab | **Test first** |
| Low-denoise "material pass" (klein 4B img2img/edit at ~0.2–0.45 strength over a code render) | No for text and thin strokes; layout roughly kept. Needs composite-back of text and ink | as above | High | **Test first** |
| klein 4B multi-reference "apply house style/texture" | No, semantic restyle. Use on illustration and background layers only | 2 refs: 161–181 s, 17–21 GB at 768 px | High (lab: 178 runs) | **Test first** |
| Z-Image Turbo + Fun ControlNet (depth/canny from Blender Z pass or SVG edges) | Edges approximately kept, not pixel-exact; piece outlines must be composited from the Blender mask | 23–25 GB; ~80–130 s (Z-Image Q8 median 80 s without ControlNet) | Medium: installed, not in the lab run log with ControlNet | **Test second** (needs ~30 GB free) |
| Qwen-Image-Edit-2511 relight or material swap | Better geometric reasoning claimed, still not pixel-exact | ~28 GB, ~6 min; 2 images critical | Low–medium on 36 GB | Quiet-hours only, after cheaper options fail |
| IC-Light | — | SD1.5 only | — | Skip; relight in Blender instead |
| layerdiffuse | — | SDXL/SD1.5 only; SDXL failed every lab test | — | Skip |
| Qwen-Image-Layered | Decomposes a flattened image, so it suits found or AI images, not MSP's own layered renders | 20B × 2 bytes ≈ 40 GB of bf16 weights (arithmetic); fp8 does not run on MPS (prior note) | Not feasible at 36 GB unless a GGUF appears (not verified) | Skip |
| Depth for parallax | n/a (motion only) | DA3-Small/Base (0.08–0.12B) should be small; Blender's Z pass is exact and free | DA3 nodes native; MPS untested | Use the Blender Z pass for 3D; DA3-Small/Base (Apache) for AI illustrations |
| SeedVR2 3B/7B | No: re-synthesises detail, oversharpens AIGC inputs | 3B GGUF/FP16 plausibly fits; 7B FP16 wants "24GB+" (CUDA guidance) | Medium (wrapper claims full MPS; no Mac timings found) | Upscale AI layers only, never text layers |
| Real-ESRGAN / 4x-UltraSharp | Same caveat, milder | Tens of MB; fast (no Mac numbers found) | High (ESRGAN is simple) | Optional; UltraSharp is NC |
| BiRefNet / SAM3 cut-outs | n/a (masks) | small | High (native) | Use |

**Design rules that follow:**
- **Never upscale or diffuse a layer that carries meaning.** Render code layers at 2× in Playwright or vector instead of upscaling them. Restrict AI to backgrounds, materials, spot illustrations and lighting layers.
- **The protected-region diff is the cheapest critic.** Compare the protected mask (text, data, logo, piece outlines) before and after with an exact or ΔE threshold. This mechanically enforces "AI may not break correctness".
- **For puzzle pieces, Blender already gives everything ControlNet needs:**
  - a Z/depth pass (for the depth ControlNet)
  - a Freestyle/line pass (for canny/lineart)
  - an object-ID mask (for composite-back)
  - an exact depth map for parallax

  The AI pass only adds surface craft: cardboard fibre, print grain, a soft studio look.

## 2. Asset library vs per-post generation, and consistency via LoRA training on Mac vs reference images

### Takeaway
Build a **curated, reusable asset library once**, in quiet hours, and composite from it per post. Candidate assets:
- paper and cardboard textures
- felt puzzle-mat backgrounds
- lighting and shadow plates
- a few house-style illustrated scenes

The badge lab already proved the economics: an AI texture atlas where "the AI runs 5 times in total", after which each new asset costs about 2 s CPU.

Get consistency from **2–5 fixed reference images with klein 4B multi-reference** before training anything. Mac LoRA training is possible:
- **mflux-train** for Z-Image and FLUX.2, MLX-native and the most credible option.
- **SimpleTuner**, which claims "M3 Max+ with 24GB+".
- **ai-toolkit**, whose Mac support is "experimental".

No M3 Max timings exist for any of them, so training is a phase-2 lab. Train only once 20–30 owner-approved library images exist.

### Cited Findings
- **Asset-atlas economics (badge lab):** "the AI runs 5 times in total" and each new badge ≈ 2 s CPU — background note §5 (`LAB/review/phase2-review.md` §2).
- **mflux:**
  - Its model table marks training "Yes" for Z-Image (6B, Distilled & Base) and FLUX.2 (4B & 9B). It lists LoRA, LyCORIS LoKr (FLUX.1/FLUX.2), in-context and multi-image editing, ControlNet, depth, fill/inpaint, Redux and SeedVR2 upscaling.
  - The repo moved to the mflux-community org in August 2026; the newest model entries are dated Sep 2026.
  — [mflux README](https://github.com/mflux-community/mflux)
- **mflux Z-Image training config example:**
  - `quantize: 8`, batch 1
  - LoRA rank 8 on attention q/k/v in blocks 15–30, AdamW at 1e-4
  - the Turbo training adapter is added automatically
  - run with `mflux-train --config …`
  — [mflux Z-Image README via Context7](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/z_image/README.md)
- **mflux memory reporting:** mflux can free text encoders/transformers between phases and reports `Peak MLX memory` via `mx.get_peak_memory()`. — [mflux memory_saver.py via Context7](https://github.com/mflux-community/mflux/blob/main/src/mflux/callbacks/instances/memory_saver.py)
- **SimpleTuner:** "Apple: M3 Max+ with 24GB+ unified memory for LoRA training"; install with `pip install 'simpletuner[apple]'`. It covers Z-Image Base/Turbo LoRA ("assistant adapter and TREAD acceleration"), FLUX.2 (klein 4B Apache; dev/klein 9B non-commercial) and Qwen Image. It makes no Mac speed claims. — [SimpleTuner GitHub](https://github.com/bghira/SimpleTuner)
- **ai-toolkit (ostris):** "MacOS (Apple Silicon, experimental)" via `run_mac.zsh`; the manager is "still **experimental**". Its model list includes FLUX.2-klein-base-4B/9B, Z-Image, Z-Image Turbo and De-Turbo, and Qwen-Image-Edit-2511. — [ai-toolkit GitHub](https://github.com/ostris/ai-toolkit)
- **ComfyUI native training:** core contains `TrainLoraNode`, `LoraModelLoader`, `SaveLoRA` and `LossGraphNode`. The training code calls `torch.cuda.empty_cache()` explicitly, so MPS behaviour is untested — local check, `comfy_extras/nodes_train.py`.
- **ComfyUI MCP training tool:** `train_start` with target "local" "launches the GPU trainer container (docker run --gpus all)" or drives RunPod. Its first flow is "character LoRA on FLUX.1-dev". It is **not usable for local Mac training**. — [comfyui-mcp docs via Context7](https://github.com/artokun/comfyui-mcp/blob/main/docs/tools/training.mdx)
- **Draw Things:** `draw-things-cli` is "a local inference and LoRA training CLI" (GPL-3.0). — [draw-things-community](https://github.com/drawthingsai/draw-things-community)
- **Which klein to train on:** the undistilled klein Base is the one for "maximum flexibility and fine-tuning". Only the distilled klein 4B is installed. — [ComfyUI docs: FLUX.2 klein](https://docs.comfy.org/tutorials/flux/flux-2-klein); local inventory (background note §8)
- **Earlier evidence:** PyTorch-MPS LoRA training had a poor record (OOM, NaN in fp16), and LoRAs do not transfer across klein 4B, 9B and Base — `local_image_generation.md` §Consistency.

### Inferences

**Library contents, in priority order:**
1. **Material plates:** paper, kraft, cardboard edge, puzzle-box print grain, felt or cork mat. Generate them tileable (see Gaps) at 2048 px; one family per session.
2. **Light plates:** soft top-left key-light gradients and contact shadows, multiplied over code layouts. These are also easy to produce procedurally; AI only if it wins.
3. **Scene plates:** table-top scenes with an empty "safe zone" where code places pieces and type.
4. **Mascot or spot illustrations:** only after the owner approves a style sheet. The lab showed Claude-written SVG beats diffusion for icons.

**Per-post AI** should be limited to a masked material or lighting pass on that post's own render (workflow 1). Everything else is library reuse, which keeps GPU time per post near zero and the look consistent.

**Library metadata.** Record for each asset:
- model and licence
- seed and workflow JSON hash
- references used
- owner approval date
- critic scores

The ComfyUI MCP's `save_workflow` and `get_history` can capture the workflow and outputs.

**Training ladder** (cheapest first):
1. klein 4B with 2 fixed references (no training).
2. Z-Image Turbo + one of the installed style LoRAs.
3. mflux-train Z-Image LoRA on 20–30 approved library images, rank 8, `quantize: 8`, overnight.
4. Only then SimpleTuner or ai-toolkit.

mflux needs its own HF-format weights (about 16 GB for klein 4B per the prior note), so a training lab also costs disk.

### Gaps
- No measured LoRA-training time or peak memory on any M3 Max for mflux, SimpleTuner or ai-toolkit. Search budget ran out before Mac training reports could be looked for.
- No verified recipe for **seamless or tileable** texture generation with klein or Z-Image in ComfyUI. Classic "seamless tiling" nodes target SD-style UNets; this was not checked. The offset-and-inpaint-the-seam trick is the generic fallback (unverified for these models).

## 3. Tools beyond and alongside ComfyUI: which is best for unattended agent batches vs human touch-ups, and how they interoperate

### Takeaway
**For unattended Claude-driven batches:**
- **ComfyUI stays the hub.** It has the MCP server, the API, native nodes for every hybrid step above, and a shared model folder.
- **mflux** is the best second engine for simple, scripted text-to-image/edit/upscale/LoRA-train jobs in pure Python/MLX, at the cost of duplicate weights.
- **Draw Things** is the fastest Metal engine. It is reachable headless (`gRPCServerCLI`, `draw-things-cli`) and even from ComfyUI (`draw-things-comfyui`), but it needs its own model store.

**For the owner's own touch-ups:** **Krita AI Diffusion connected to the existing ComfyUI** is the best fit. It is layer-based painting with Fill/Expand/Refine on klein 4B and Z-Image. It does require four extra custom nodes.

**Drop:** DiffusionKit (archived). **Not worth adding:** InvokeAI and SwarmUI, which would duplicate model stores and add little over the ComfyUI MCP.

### Cited Findings
- **ComfyUI installed vs upstream:** core 0.28.0 (2026-07-16) is installed; upstream was v0.39.1 on 2026-10-07 — background note §8. The installed core already includes the native nodes listed in §1 — local check.
- **ComfyUI API (local check, `server.py`):**
  - `POST /prompt`, `GET /queue`, `POST /interrupt`, `GET /history/{id}` and `GET /system_stats`.
  - `POST /free` with `{"unload_models": true, "free_memory": true}`.
  - The MCP exposes the same as `enqueue_workflow`, `queue`, `get_history`, `clear_vram` and `get_system_stats` — [comfyui-mcp docs via Context7](https://github.com/artokun/comfyui-mcp/blob/main/docs/tools/workflow-execution.mdx).
  - The newer "Comfy API v2" is in beta for open-source ComfyUI via an API proxy — [ComfyUI docs via Context7](https://github.com/comfy-org/docs/blob/main/development/comfy-api/overview.mdx).
- **mflux:**
  - Python API (`ZImageTurbo(...).generate_image()`); no batch or server mode is described.
  - Float16 compute is available for FLUX.2, Z-Image and Qwen-Image 2.1 "on M1-family GPUs".
  - No M-series benchmarks on the page.
  — [mflux README](https://github.com/mflux-community/mflux)
  - The prior note measured klein 4B at 21.4 s per 1024² image on an M1 Max with mflux — `local_image_generation.md`.
- **Draw Things:**
  - `gRPCServerCLI-macOS /path-to-models` hosts the gRPC server "without installing the Draw Things app". The Docker example maps port 7859.
  - `draw-things-cli generate` takes `--models-dir` or `DRAWTHINGS_MODELS_DIR`.
  - Licence GPL-3.0; a separate client may use another licence.
  — [draw-things-community](https://github.com/drawthingsai/draw-things-community)
- **draw-things-comfyui:** "connects ComfyUI to Draw Things over gRPC … brings the Draw Things sampler into ComfyUI workflows". It needs the Draw Things API server set to gRPC (TLS recommended) and "Enable Model Browser" for local models, or `gRPCServerCLI` with `--model-browser`. — [drawthingsai/draw-things-comfyui](https://github.com/drawthingsai/draw-things-comfyui)
- **Krita AI Diffusion:**
  - **Connection and hardware:** "The Plugin can connect to an existing ComfyUI server, either local or remote"; hardware "Apple Silicon only (M1-M5)" on macOS. — [Krita AI docs: installation](https://docs.interstice.cloud/installation/)
  - **Custom-server requirements:** `comfyui_controlnet_aux`, `ComfyUI_IPAdapter_plus`, `comfyui-inpaint-nodes`, `comfyui-tooling-nodes`; GGUF optional and auto-used. Model lists exist for SDXL, Flux 2 (4B) and Z-Image. `extra_model_paths.yml` paths work. — [Krita AI docs: ComfyUI setup](https://docs.interstice.cloud/comfyui-setup/)
  - **Releases:**
    - v1.48.0 (21 Feb): Flux 2 4B Fill/Expand, Color Match.
    - v1.49.0 (22 Mar): live edit-mode toggle, Flux 2 edit styles.
    - v1.51.1 (5 Jun): "Fixes managed installation on macOS".
    - v1.53.0 (22 Aug): int8/int4 in custom setups; Nunchaku removed.
    - v1.54.0-pre (3 Oct): Krita 6 only; adds Qwen Image 2.1, which "is known to perform poorly on macOS".
    — [Krita AI releases](https://github.com/Acly/krita-ai-diffusion/releases)
- **InvokeAI:**
  - 6.14.2 is "Latest" (27 Sep). 7.0.0 alpha 2 (11 Oct) adds `reserve_vram_gb` and GGUF for krea2, ideogram4 and ernie-image.
  - Alpha 1 introduced a rewritten canvas and FP8 storage ("FLUX.2 Klein 4B 7.4 GB → 3.9 GB").
  - 6.14.2 added custom canvas fonts.
  - macOS is not mentioned in the notes.
  — [InvokeAI releases](https://github.com/invoke-ai/InvokeAI/releases)
- **SwarmUI:**
  - v0.9.8 Beta; "You can only run SwarmUI on Mac computers with M-Series Apple silicon"; auto-installs ComfyUI. — [SwarmUI GitHub](https://github.com/mcmonkeyprojects/SwarmUI)
  - JSON API at `POST /API/GenerateText2Image` with `session_id`, plus a `/ComfyBackendDirect/` pass-through. — [SwarmUI API.md](https://github.com/mcmonkeyprojects/SwarmUI/blob/master/docs/API.md)
- **DiffusionKit:** "archived by the owner on Mar 21, 2026. It is now read-only"; it covered SD3 and FLUX.1 only. — [DiffusionKit GitHub](https://github.com/argmaxinc/DiffusionKit)
- **Ollama** added experimental image generation on macOS (FLUX.2 klein, Z-Image-Turbo) on 2026-01-20. — [GIGAZINE](https://gigazine.net/gsc_news/en/20260123-ollama-ai-image-generation/) (search-result summary, page not opened)

### Inferences

| Need | Best tool | Why | Interop cost |
|---|---|---|---|
| Unattended multi-step hybrid graphs (mask, edit, composite, upscale) | ComfyUI via MCP or API | Every node needed is native; the MCP is installed | None. Optionally upgrade core 0.28 → 0.39 in a separate install first |
| Simple scripted t2i/edit/upscale, LoRA training | mflux | Pure Python/MLX, deterministic, no server | Duplicate HF-format weights (+8–16 GB per model) |
| Fastest raw generation | Draw Things (`draw-things-cli`/gRPC) | Fastest Metal implementation (prior note) | Own model store; GPL-3.0 server |
| Owner touch-ups (paint a mask, Fill/Refine one region, Color Match) | Krita AI Diffusion → existing ComfyUI | Layer-based, brush-level control; klein 4B and Z-Image supported | 4 custom nodes. The lab rule is "never pip-install into ComfyUI's venv", so use a **second ComfyUI install** (or Krita's managed server) pointed at the same `models/` via `extra_model_paths.yaml` |
| Human canvas with text tool | InvokeAI | Strong canvas | Separate model store and DB; v7 still alpha. Skip unless Krita fails |

- **Keep one model store.** `~/Documents/ComfyUI/models` should be the single source. Krita and a second ComfyUI can share it; mflux and Draw Things cannot (different formats), so pick them only for models they uniquely accelerate.
- **Do not run two engines at once.** Each loads its own copy of the weights into unified memory.

### Gaps
- No same-model speed comparison of ComfyUI (MPS) vs mflux vs Draw Things on an M3 Max **30-core** was found. The prior note's numbers come from M1 Max and M3 Max 40-core machines. A 10-minute benchmark remains the right first step.
- Krita "live" painting latency on Apple Silicon with klein 4B: no data found.
- The `draw-things-comfyui` feature coverage (ControlNet, LoRA, img2img) is not stated on its README.

## 4. Running heavy jobs politely on macOS, measuring what each run costs, and deciding when the machine is "calm"

### Takeaway
On a 36 GB Mac the binding constraint is unified memory, not GPU speed. ComfyUI's `--lowvram`/`--novram` flags effectively do nothing on MPS: the code forces a "SHARED" VRAM state, and DynamicVRAM is NVIDIA-only. The real levers are:
- quantized GGUF weights and ≤768–1024 px
- one model family per session
- `POST /free` between families
- caching flags (`--cache-none` or `--cache-ram`)
- a pre-flight "calm machine" gate plus a per-run resource record

Turning off Docker Desktop alone frees up to its configured **12 GiB VM**. That is the difference between "klein 4B only" (~20 GB free) and "Z-Image + ControlNet or Qwen-Edit with one image" (~30 GB free).

Schedule with a **launchd `StartCalendarInterval`** agent: it runs on wake if the Mac slept through the slot. It then calls a script that checks calm conditions and drains a file-based job queue.

### Cited Findings

**ComfyUI memory behaviour on MPS** (local check of installed source)
- **VRAM state:** after parsing `--lowvram`/`--novram`, `model_management.py` sets `if cpu_state == CPUState.MPS: vram_state = VRAMState.SHARED`. The memory-mode flags are therefore overridden on Apple Silicon (code reading, not a runtime test).
- **DynamicVRAM:** enabled only when `comfy.model_management.is_nvidia()` (`main.py`). The `--lowvram` help itself says it "Doesn't do anything if dynamic vram is enabled"; otherwise it moves text encoders to the CPU. `--vram-headroom` applies to DynamicVRAM only.
- **Cache modes** (mutually exclusive):
  - `--cache-ram` is "the default caching mode". It keeps an active-cache headroom of 10 % of RAM (2–10 GB) and an inactive headroom of 100 % (max 96 GB).
  - `--cache-classic` (aggressive), `--cache-lru N` and `--cache-none` ("Reduced RAM/VRAM usage at the expense of executing every node for each run").
- **Other memory flags:** `--disable-smart-memory` ("aggressively offload to regular ram") and `--reserve-vram GB`. `--fp16-vae` "might cause black images".
- **Memory reporting:** on MPS, `/system_stats` "vram_total/vram_free" come from `psutil.virtual_memory().total/.available`. They describe system RAM, not a GPU pool.
- **Unloading:** `POST /free` sets queue flags `unload_models` and `free_memory`, which are acted on between prompts.

**Lab A/B on this machine** (background note §5)
- `--gpu-only --fp16-unet --fp16-vae` gave a "BLACK image (fp16 overflow)" on Z-Image.
- `--use-pytorch-cross-attention` made an edit hit "27 GB → critical".
- The watchdog interrupted ComfyUI 4 times. Peak swap was 22.79 GB and memory pressure peaked at level 4.
- The fixes were Q8 GGUF, ≤768 px, `comfy.free()` between LoRAs and a 22 GB memgate.

**Memory per family on this Mac** (background note §5): klein 4B 17–21 GB; Z-Image 23–25 GB; Qwen-Edit 28 GB with one image, two images "critical"; Blender 2–8 GB.

**macOS scheduling**
- "If you schedule a `launchd` job by setting the `StartCalendarInterval` key and the computer is asleep when the job should have run, your job will run when the computer wakes up. However, if the machine is off … the job does not execute until the next designated time." `cron` is "deprecated in favor of `launchd`". — [Apple: Scheduling Timed Jobs](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html)

**Memory-pressure signals**
- Pressure levels are defined as `DISPATCH_MEMORYPRESSURE_NORMAL 0x01`, `WARN 0x02` and `CRITICAL 0x04` — local check, SDK `dispatch/source.h`.
- The live value is readable with `sysctl kern.memorystatus_vm_pressure_level`. It read **2 (warn)** during this research while many agents and apps were open.
- `sysctl kern.memorystatus_level` gives % memory free (44 at the time). `memory_pressure -Q` prints "System-wide memory free percentage". `sysctl vm.swapusage` showed 2.85 of 4.10 GB of swap used — local checks, 2026-10-13.
- `sysctl iogpu.wired_limit_mb` = 0, i.e. the OS default GPU wired limit — local check.

**Idle, power and thermal signals** (local checks)
- **Idle time:** `ioreg -c IOHIDSystem` exposes `HIDIdleTime` (nanoseconds since the last keyboard or mouse input).
- **Power and thermal:** `pmset -g batt` reports "AC Power". `pmset -g therm` reports thermal or performance warnings ("No thermal warning level has been recorded").
- **Sleep blockers:** `pmset -g` shows which processes block sleep (`caffeinate` etc.).

**GPU activity without sudo**
- `ioreg -r -c IOAccelerator` exposes `PerformanceStatistics` with `"Device Utilization %"`, `"Renderer Utilization %"` and `"In use system memory"` (GPU-resident bytes; about 2.4 GB at the time) — local check.
- **macmon** is a "sudoless performance monitor":
  - Metrics: GPU frequency and active ratio; CPU/GPU/ANE/RAM power; RAM and swap; temperatures; a per-process list.
  - Scripting: `macmon pipe -s N -i ms` emits JSON; `macmon serve` offers `/json` and Prometheus `/metrics`. Install with `brew install macmon`; MIT.
  - It warns that CPU/ANE power counters "may stop updating on macOS 27"; this Mac runs Darwin 27.
  - asitop "requires sudo"; Apple's `powermetrics` keeps counter access through a private entitlement and needs sudo.
  — [macmon GitHub](https://github.com/vladkens/macmon)

**Per-process memory** (local checks)
- `/usr/bin/time -l <cmd>` prints "maximum resident set size" and "peak memory footprint" for a command's lifetime.
- `/usr/bin/footprint <pid>` and `vmmap` are present for sampling a long-lived server process.
- mflux prints `Peak MLX memory` via `mx.get_peak_memory()` — [mflux via Context7](https://github.com/mflux-community/mflux/blob/main/src/mflux/callbacks/instances/memory_saver.py).

**Docker Desktop on this Mac** (local check of its settings file)
- `MemoryMiB: 12288`, `SwapMiB: 3584`, `Cpus: 8`, `UseResourceSaver: true`, `AutoPauseTimeoutSeconds: 300`.
- The Docker VM (`com.apple.Virtualization.VirtualMachine`, `com.docker.backend`) was running during the check.

### Inferences

**(a) ComfyUI launch profile for this Mac** (an untested recommendation):
- Use the lab's validated baseline: bf16 weights, sub-quadratic attention, text encoders on CPU, GGUF Q8.
- Add `--cache-none` for unattended batches (lower RAM, re-runs every node) or keep the default `--cache-ram` for interactive work.
- Add `--disable-smart-memory` if models linger between families.
- Call `POST /free {"unload_models":true,"free_memory":true}` (MCP `clear_vram`) after each family and at the end of the queue.
- Do not rely on `--lowvram`. Do not use `--use-pytorch-cross-attention` or the fp16 flags.

**(b) Per-run resource measurement** (all sudo-free):
- **Wall time:** timestamps around each enqueue and its `get_history` completion. ComfyUI history also records execution status.
- **Peak process memory:** sample the ComfyUI python PID every 1 s and keep the max of `ps -o rss= -p PID` and `footprint -p PID` (phys_footprint).
  - On unified memory, Metal buffers may not fully show in RSS. Record phys_footprint plus the IOAccelerator "In use system memory" alongside it; whether phys_footprint includes all MPS allocations was not verified.
  - For one-shot scripts (mflux, Blender), wrap with `/usr/bin/time -l` and log "peak memory footprint".
- **System memory:** before/peak/after values of
  - `kern.memorystatus_vm_pressure_level` (max over the run)
  - `kern.memorystatus_level` (min % free)
  - `vm.swapusage` used (start, peak, end; swap growth during a run is the clearest "too big" signal)
  - optionally `vm_stat` pageouts delta
- **GPU:** sample `ioreg` IOAccelerator "Device Utilization %" each second (mean and p95). Add `macmon pipe` for GPU power (W) and temperature if installed (needs `brew install`; not done here). GPU-busy-seconds ≈ Σ(util%/100 × 1 s).

**Compact resource record**, one JSON line per lab item, appended to `labs/<lab>/runs.jsonl`:

```json
{"run_id":"L1-0007","lab":"L1-material-pass","ts_start":"2026-10-20T01:12:03+02:00","wall_s":104.2,
 "engine":"comfyui-0.28.0","workflow_sha":"…","model":"flux-2-klein-4b-Q8_0.gguf","model_licence":"Apache-2.0",
 "res":"768x960","steps":4,"refs":1,"seed":12345,
 "proc_peak_footprint_gb":19.6,"gpu_inuse_peak_gb":15.1,"gpu_util_mean":0.82,"gpu_power_mean_w":null,
 "sys_free_pct_min":18,"pressure_max":2,"swap_used_gb_start":0.4,"swap_used_gb_peak":1.1,
 "calm_check":{"docker":false,"idle_s":5400,"ac":true,"free_gb_start":29.8},
 "status":"ok","outputs":["…png"],"critic":{"protected_diff_px":0,"claude":7.5}}
```

**Summary per lab:** n, median and p90 wall time, max peak footprint, max pressure, swap growth, total GPU-busy minutes. This matches what the badge lab tracked in `runs.jsonl` (background note §5).

**(c) What freeing RAM buys**, combining the lab's measured peaks with 36 GB total, about 4–6 GB for macOS, and Docker's 12 GiB VM:

| Free memory before start | Typical state | What fits (one at a time) | What does not |
|---|---|---|---|
| ~12–16 GB | Docker running, browsers and IDE open | Blender CPU/EEVEE renders, BiRefNet/SAM3 masks, DA3-Small/Base depth, ESRGAN upscales, a small local VLM critic (Qwen2.5-VL-7B Q4/Q8 is about 5–9 GB of weights) | Any 4B+ diffusion run without swap |
| ~20 GB | Docker quit, browsers closed | klein 4B Q8 at ≤768 px: text-to-image, 1-reference edit, material pass (17–21 GB peak; 2-reference is borderline); SeedVR2 3B GGUF tiled (estimate) | Z-Image Turbo (23–25 GB), Qwen-Edit |
| ~30 GB | "Calm" profile: Docker, browsers, IDE, Slack, local LLMs all quit | Z-Image Turbo + Fun ControlNet; klein 2-reference at 768–1024 px; Qwen-Image-Edit-2511 Q6_K + Lightning with **one** image (~28 GB, near the edge); SeedVR2 7B GGUF/FP8-equivalent (estimate) | Qwen-Edit with 2 images; Qwen-Image-Layered bf16 (~40 GB of weights); any two families resident together |
| bigger machine (64–128 GB) | — | Qwen-Image-Layered, Qwen-Edit multi-image, SeedVR2 7B FP16, Qwen-Image 2.1, parallel jobs | — |

**(d) Pre-flight "calm machine" check.** All of these are readable without sudo. Run it from the queue runner before every heavy job and again between items; abort or postpone if it fails.

| Check | Command | Pass condition |
|---|---|---|
| 1. Pressure | `sysctl -n kern.memorystatus_vm_pressure_level` | == 1 (normal) |
| 2. Free memory | `memory_pressure -Q` or `sysctl -n kern.memorystatus_level` | % free × 36 GB ≥ the job's need + 4 GB (e.g. klein ≥ 24 GB free; Z-Image/Qwen-Edit ≥ 30 GB) |
| 3. Swap | `sysctl vm.swapusage` | used < 2 GB, and not growing over the last 60 s |
| 4. Heavy co-tenants | `pgrep -f com.docker.backend`, `com.apple.Virtualization.VirtualMachine`, `Blender`, `llama-server`, `LM Studio`, `ollama`, another `main.py` | none present (or only the one this job needs) |
| 5. User idle | `ioreg -c IOHIDSystem` HIDIdleTime | ≥ 20–30 min (or inside the quiet-hours window) |
| 6. Power and thermal | `pmset -g batt` and `pmset -g therm` | on AC; no thermal or performance warning |
| 7. GPU idle | ioreg IOAccelerator "Device Utilization %" | < 10 % over 10 s |
| 8. Disk | `df -g ~` | free ≥ 10 GB (outputs plus swap headroom) |
| 9. Engine health | ComfyUI `GET /system_stats` (MCP `get_system_stats` action "health") | responds; queue empty |

**Runtime watchdog:** if pressure reaches 4 (critical) or swap grows more than 4 GB during a run, `POST /interrupt`, then `/free`, then mark the item "deferred". This mirrors the lab's memwatch.

**Queue design:** a `jobs/pending/*.json` folder, with one job per file naming the model family. The runner groups jobs by family to avoid reloads, runs one at a time with a 15-minute GPU-turn cap (lab rule), and writes the resource record.

**launchd setup:**
- A LaunchAgent with `StartCalendarInterval` at, say, 01:30 runs the runner. If the Mac was asleep, it runs on wake, and the calm check then decides.
- Wrap the runner in `caffeinate -i` so the machine stays awake while jobs drain.
- `Nice`/`LowPriorityIO` keys exist in `launchd.plist` (see `man launchd.plist`); Apple's page above does not cover them.

### Gaps
- Whether macOS `phys_footprint` (via `footprint`) captures all MPS/Metal allocations of the ComfyUI process was not verified. Logging the IOAccelerator "In use system memory" alongside it is the hedge.
- No official Apple documentation was found for `kern.memorystatus_level` semantics; it was read empirically. The pressure-level constants come from the SDK header.
- macmon was not installed or run. Its macOS 27 CPU/ANE power caveat comes from its own README.
- The ComfyUI MPS flag analysis is from reading 0.28.0 source. Upstream 0.39.x may differ.

## 5. Automated critics: how well can Claude, aesthetic/preference predictors and local VLMs judge quality, slop, geometry and brand fit?

### Takeaway
No single automated critic reliably detects "AI slop", wrong puzzle geometry or off-brand style:
- **Learned preference scorers** (HPSv3, ImageReward, PickScore, LAION/v2.5 aesthetic) predict generic crowd preference at 57–85 % pairwise accuracy. They have no notion of MSP's brand. Their training signal can reward exactly the glossy "AI look" (HPSv2 reward hacking produced "meaningless accessories and decorative light effects").
- **IQA reasoners** (Q-Align, Q-Insight, VisualQuality-R1) detect blur, noise and compression, not design quality.
- **MLLM judges** (GPT-4o class) correlate "reasonably" with human design ratings but "cannot distinguish small details".

The recommended stack:
1. **Deterministic checks first:** protected-pixel diff, palette ΔE, piece-mask IoU, sharpness, contrast.
2. **A cheap learned scorer** only to rank AI-layer candidates.
3. **Claude vision with a written rubric, reference images and side-by-side comparison** for the final shortlist.
4. **Owner pairwise picks** to calibrate. Track agreement and only automate once Claude matches the owner on ≥ 80 % of pairs.

### Cited Findings

**MSP's own critic practice** (background note §3)
- The badge lab used Claude subagents reading contact sheets plus numeric metrics (mirror IoU, outline width, Lab ΔE, legibility at 24/48 px), with a weighted rubric and hard caps. "No vision-language-model critic was used."
- The owner's phase-1 verdict on 20 directions was "nothing is a candidate". Agreement between the reviewer agent's "charm" score and the owner was not quantified.

**MLLMs as graphic-design judges**
- Haraguchi et al. (SIGGRAPH Asia 2024): GPT-based evaluation "correlates reasonably well" with annotations from 60 human subjects and with heuristic design-principle metrics, but GPTs "cannot distinguish small details". — [arXiv 2410.08885](https://arxiv.org/abs/2410.08885)
- IEEE TMM, April 2026: 19 MLLMs on an 8-task, 1,600-example design-understanding benchmark. The best is GPT-4.1 at **65.5 %**; open-weight InternVL-2.5-78B is a "small gap" behind; "design understanding remains a challenging task". — [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1169843)
- AesthetiQ (CVPR 2025) reportedly found a VILA-7B judge agreed with human layout preferences 78.8 % of the time vs 88.6 % for GPT-4o. — [CVPR supplement](https://openaccess.thecvf.com/content/CVPR2025/supplemental/Patnaik_AesthetiQ_Enhancing_Graphic_CVPR_2025_supplemental.pdf) (**unverified**: figures are from a search summary; the PDF returned 403)
- Agentic Design Review System (v2, 2026-03-12): a meta-agent orchestrates several design-aware agents, with graph-matching-based in-context exemplar selection and prompt expansion. It is evaluated on DRS-BENCH; the abstract has no numbers. — [arXiv 2508.10745](https://arxiv.org/abs/2508.10745)

**Preference and aesthetic predictors**
- HPSv3 (ICCV 2025):
  - Qwen2-VL-7B backbone with an uncertainty-aware head, trained on about 1.5M pairs (HPDv3 plus Pick-a-Pic, ImageReward, HPDv2 and Midjourney choices) at 448×448.
  - Preference accuracy (ImageReward / PickScore / HPDv2 / HPDv3 test sets):

    | Model | ImageReward set | PickScore set | HPDv2 | HPDv3 |
    |---|---|---|---|---|
    | HPSv3 | 66.8 | 72.8 | 85.4 | 76.9 |
    | HPSv2 | 65.7 | 63.8 | 83.3 | 65.3 |
    | PickScore | 61.6 | 70.5 | 79.8 | 65.6 |
    | ImageReward | 65.1 | 61.1 | 74.0 | 58.6 |
    | Aesthetic Score Predictor (LAION) | 57.4 | 56.8 | 76.8 | 59.9 |
    | CLIP | 57.1 | 60.8 | 65.1 | 48.6 |

  - Spearman with human rankings: 0.94, vs 0.87 for HPSv2 and 0.81 for PickScore.
  - Stated limitations: a single score "does not capture fine-grained attributes such as color fidelity, sharpness, or artistic style"; prompt categories follow JourneyDB.
  - Reward hacking with **HPSv2** in DanceGRPO produced "meaningless accessories and decorative light effects"; HPSv3 is claimed to show less.
  - The dataset is CC BY-NC-SA.
  — [arXiv 2508.03789](https://arxiv.org/html/2508.03789v2)
- Aesthetic Predictor V2.5: SigLIP-based, scores 1–10, "5.5 or higher is considered a great aesthetic score". It was improved for "illustrations". Licence AGPL-3.0; the example uses CUDA and `trust_remote_code`. It publishes no evaluation. — [aesthetic-predictor-v2-5](https://github.com/discus0434/aesthetic-predictor-v2-5)

**IQA reasoners**
- Q-Align / OneAlign (ICML 2024) scores quality, aesthetics and video by mapping five text levels (excellent…bad) to 5–1. It is available via `pyiqa`; the examples use CUDA. — [Q-Align GitHub](https://github.com/Q-Future/Q-Align)
- Q-Insight (NeurIPS 2025 spotlight, Apache-2.0) does score regression, degradation perception and zero-shot comparison reasoning. Its successor RALI (ICLR 2026 oral) is CLIP-based at about 4 % of Q-Insight's parameters and inference time. — [Q-Insight GitHub](https://github.com/bytedance/Q-Insight)
- VisualQuality-R1-7B (NeurIPS 2025 spotlight, Apache-2.0) is built on Qwen2.5-VL-7B. It outputs a 1–5 score with optional `<think>` reasoning and was trained on KADID-10K, TID2013 and KonIQ-10k, i.e. classic distortion datasets. — [VisualQuality-R1 GitHub](https://github.com/TianheWu/VisualQuality-R1)

**Artifact and implausibility detection**
- RichHF-18K (CVPR 2024) annotates implausible or misaligned regions (heatmaps) and misrepresented prompt words. The trained predictor's heatmaps can drive inpainting masks. Weight release is not stated. — [arXiv 2312.10240](https://arxiv.org/abs/2312.10240)
- SynArtifact built an artifact taxonomy and the SynArtifact-1K dataset. Its fine-tuned VLM "outperforms the baseline by 25.66%" at artifact classification. — [arXiv 2402.18068](https://arxiv.org/abs/2402.18068)
- FakeBench evaluates LMMs on detecting and explaining generative forgery. Models show "merits and demerits in different aspects"; the abstract gives no per-model numbers. — [arXiv 2404.13306](https://arxiv.org/abs/2404.13306)

**Local VLM critics**
- Already on disk: `Qwen2.5-VL-7B-Instruct-Q8_0.gguf` (8.10 GB) + `mmproj-F16` (1.35 GB). llama.cpp (Homebrew build installed) is also present — background note §9.
- llama.cpp multimodal:
  - `llama-server -m model.gguf --mmproj mmproj.gguf` serves images through the OpenAI-compatible `/chat/completions`.
  - Pre-quantized Qwen2.5-VL 3B/7B/32B/72B and Gemma 4 vision GGUFs are listed.
  - Qwen3.5 multimodal architectures map to the `qwen3vl` projector.
  — [llama.cpp multimodal docs via Context7](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md)
- mlx-vlm runs VLMs natively on Mac (`mlx_vlm.generate --model Qwen/Qwen3.5-4B --image …`, `mlx_vlm.server`) and calls `mx.clear_cache()` after each generation. — [mlx-vlm via Context7](https://github.com/blaizzy/mlx-vlm/blob/main/README.md)
- Qwen3-VL-8B-Instruct (Apache-2.0) claims stronger 2D/3D grounding, OCR in 32 languages and HTML/CSS generation from images. No aesthetic benchmarks are published. — [HF: Qwen3-VL-8B-Instruct](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct)

### Inferences

**What each critic is good for**, matched to MSP failure modes:

| Failure mode | Best detector | Learned scorers? |
|---|---|---|
| Text, number or logo changed by AI | Protected-pixel diff (exact) | Useless |
| Wrong puzzle geometry | Compare against the Blender object mask or the `jigsaw_piece()` SVG (IoU, contour match); Claude second | Useless; they reward pretty, not correct |
| Off-brand colour | Palette ΔE histogram vs brand tokens (coral `#EC726F`, indigo, sky, navy) | No |
| Blur, mush, over-sharpening from upscalers | Laplacian variance / Q-Align / VisualQuality-R1 on the AI layer | Yes |
| "AI slop" look (gloss, glow, bokeh, lens flare, plastic texture) | Claude with an explicit banned-traits list plus 2–3 approved MSP references side by side | Weak or inverse: HPS-style scores may *rise* with gloss and decorative light |
| Composition and hierarchy at phone size | Claude reading a phone-size mock (1080×1350 scaled to about 390 px wide), as the badge lab did at 48 px | Weak |

**Calibration approach:**
1. Collect 30–50 owner pairwise choices: A/B of the same post with and without an AI pass, and between AI variants.
2. Run Claude (rubric + references), HPSv3/ImageReward and the local Qwen VLM on the same pairs.
3. Report pairwise agreement with the owner and Kendall τ on any rankings.
4. Keep a critic as a *gate* only if it agrees ≥ 80 % and never passes a protected-diff failure. Otherwise use it as a tie-breaker.
5. Re-check monthly on 10 new pairs.

Present pairs in context (a phone-feed mock), as the badge lab did, because the owner "picks by using it rather than from a grid".

**Local VLM role:** a zero-download first critic is Qwen2.5-VL-7B Q8 via `llama-server` (about 10 GB with mmproj). It is good for OCR-style checks ("is any text visible in this AI layer?") and banned-trait detection, not taste. It cannot run alongside a 20 GB diffusion job on 36 GB, so run critics in a separate phase after generation.

**HPSv3 itself** is a Qwen2-VL-7B model (about 16 GB in bf16). Its dataset is NC. It is a candidate only for ranking AI-layer candidates, with low expected value for brand fit.

### Gaps
- No study was found that measures any critic on *brand-specific* or *editorial social graphics* with "AI slop" as the label. All the evidence is generic preference, IQA or design-principle benchmarks.
- No published agreement numbers for Claude models specifically as design judges were found (search budget exhausted). The MLLM evidence is for GPT-4o/4.1-class models.
- Mac/MPS feasibility of HPSv3, Q-Align and VisualQuality-R1 is untested. Their examples assume CUDA; VisualQuality-R1 is Qwen2.5-VL-based, so a GGUF/MLX conversion should be possible in principle (not verified).

## 6. Recommended lab plan: which workflows to test first, with expected memory and time

### Takeaway
Run eight small labs in this order:
1. Instrumentation, so every run is measured.
2. Composite-back material pass on a real code-rendered carousel slide (klein 4B).
3. Blender-structure → Z-Image Fun ControlNet for puzzle-piece hero shots.
4. A quiet-hours asset-library batch.
5. Critic calibration against owner picks.

Upscaling, depth parallax, Qwen-Edit relighting and LoRA training follow only if the earlier labs show a gap. Each lab must beat the code-only baseline in front of the owner. Every item is logged with the resource record from §4.

### Cited Findings
- Measured on this Mac:
  - klein 4B Q8 median 60 s (n = 178)
  - Z-Image Turbo Q8 median 80 s (n = 27)
  - klein 9B Q8 median 179 s (n = 13)
  - Qwen-Edit 345–380 s
  - 1-reference/2-reference edits 80–125 s / 161–181 s at 768 px
  - peaks: klein 4B 17–21 GB, Z-Image 23–25 GB, Qwen-Edit ~28 GB
  — background note §5
- Owner rules and prior verdicts:
  - "Wrong pieces are worse than no piece".
  - A share "the owner does not like is worse than none".
  - AI must beat a code baseline in front of the owner.
  — `reports/MSP Instagram content pipeline.md`
- Installed and ready (no download):
  - klein 4B Q8 and bf16
  - Z-Image Turbo bf16 and Q8, plus Fun ControlNet Union 2.1-lite
  - Qwen-Image-Edit-2511 Q6_K + Lightning
  - BiRefNet
  - Qwen2.5-VL-7B GGUF
  — background note §8; local check
- Not installed:
  - upscalers (`upscale_models/` empty) and DA3 (`geometry_estimation/` empty) — local check
  - mflux and macmon — background note §9; local check

### Inferences

| # | Lab (quiet hours unless noted) | Workflow | Needs | Expected memory / time (estimates from lab medians) | Pass criterion |
|---|---|---|---|---|---|
| L0 | Instrumentation (any time, no GPU) | Calm-check script, resource sampler, `runs.jsonl` writer, protected-pixel diff tool | Nothing new | — | Records every field in §4 on a dry run |
| L1 | Material pass with composite-back | Playwright renders slide plus a protected mask (text, numbers, logo) → klein 4B Q8 img2img/edit on the background and illustration layer at 768×960, strength sweep 0.2/0.35/0.5, 1 reference (MSP paper texture or brand plate) → composite code layers back → upscale code layers natively at 2× | ≥ 22 GB free (Docker off) | 17–21 GB; ~80–125 s per variant. 4 slides × 3 strengths × 2 seeds = 24 runs ≈ 40–50 min | Protected diff = 0 px; owner prefers ≥ 1 of 4 over the code-only baseline |
| L2 | Blender → Z-Image ControlNet hero | Blender renders correct pieces + depth/Z pass + Freestyle lines + object-ID mask → Z-Image Turbo Q8 + Fun ControlNet (depth, then canny) for material and lighting → composite piece silhouettes and edges back from the mask | ≥ 30 GB free | 23–25 GB; ~90–150 s per run. 2 scenes × 2 control types × 3 strengths × 2 seeds = 24 runs ≈ 45–60 min | Piece-mask IoU ≥ 0.99 after composite; no visible seam; owner prefers it over plain Cycles |
| L3 | Asset-library batch | Z-Image Turbo t2i (+ the existing `zit_*` style LoRAs where fitting) and klein 4B 2-reference restyle → paper, cardboard and felt plates, light plates, scene plates; BiRefNet cut-outs | ≥ 22–30 GB free | 60–180 s per asset; 40 assets ≈ 1–2 h overnight | Owner approves ≥ 10 reusable assets; metadata recorded |
| L4 | Critic calibration (daytime OK; no diffusion) | Claude rubric (banned traits, brand palette, hierarchy at phone size, reference comparison) vs Qwen2.5-VL-7B via `llama-server` vs owner on 30–50 pairs from L1–L3 | ~10–12 GB for the local VLM | Seconds per image | Claude ≥ 80 % agreement with the owner → becomes the pre-filter |
| L5 | Finishing upscale (optional) | SeedVR2 3B GGUF (native nodes or numz) vs Real-ESRGAN x4plus on AI layers only | Model downloads (needs approval; sizes not verified) | SeedVR2 3B: under 20 GB expected (unverified on MPS); ESRGAN: small, seconds | No over-sharpening seen by Claude or owner; never touches text layers |
| L6 | Depth parallax for Reels (optional) | Blender Z pass (exact) for 3D shots; DA3-Small/Base (Apache) on AI illustration plates → parallax in Remotion or Blender displacement (DepthFlow is AGPL) | DA3-Small/Base download (tiny) | < 4 GB expected; seconds per frame | 3–5 s loop without tearing at piece edges |
| L7 | Qwen-Edit relight or material swap (only if L1/L2 lack lighting quality) | Qwen-Image-Edit-2511 Q6_K + Lightning, 1 image, 768 px | ≥ 30 GB free, everything else closed | ~28 GB; ~6 min per run; ≤ 8 runs per night | Beats L2 on owner pick with protected diff = 0 |
| L8 | Style LoRA (phase 2, after L3) | `mflux-train` Z-Image Turbo LoRA, rank 8, `quantize: 8`, on 20–30 approved library images | Install mflux + HF weights (~10–16 GB disk); calm night | Unknown; measure (first run capped at 2 h) | LoRA output beats 2-reference klein on the owner pick |

**Do not lab:**
- layerdiffuse (SDXL-only) and IC-Light (SD1.5)
- Qwen-Image-Layered (does not fit in 36 GB)
- DiffusionKit (archived)
- SwarmUI and InvokeAI (duplicate stores, no new capability)
- the ComfyUI MCP `train_start` (Docker/CUDA)

**Krita AI Diffusion** is worth a short owner-facing trial outside the lab queue: a second ComfyUI install sharing `models/`, used for hand touch-ups of L1–L3 outputs.

**Disk:** L1–L4 need no downloads. L5, L6 and L8 add downloads, so delete the SDXL stack first (~10.5 GB; it failed every lab test per the report). The klein 9B files can stay for labs under the owner's non-commercial stance, with its licence recorded (FLUX Non-Commercial).

**Bigger machine later:** re-run L2 and L7 at 1024 px and add Qwen-Image-Layered and Qwen-Edit multi-image. Keep the same resource-record format so results compare directly.

### Gaps
- Every time and memory figure for L2 (with ControlNet), L5, L6 and L8 is an estimate. No Mac measurements of Z-Image + Fun ControlNet, SeedVR2, DA3 or mflux training were found.
- No public evidence was found that the klein img2img "material pass" at low strength keeps thin brand strokes intact. L1's protected diff and owner pick are the test.
- The web-search budget was exhausted mid-research. Mac-specific community reports (r/comfyui, r/StableDiffusion) for SeedVR2, DA3, Krita live mode and Z-Image ControlNet timings were not gathered.
