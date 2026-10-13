# Lessons from the MySpeedPuzzling AI badge/icon project + local generative tooling inventory (state 2026-10-13)

Scope: a local, read-only investigation (filesystem, git history, local services). Nothing was installed, downloaded, deleted, started or stopped. Path abbreviations used in citations:
- `SP/…` = `/Users/janmikes/www/speedpuzzling.cz` (the main app repo, PUBLIC on GitHub).
- `LAB/…` = `/Users/janmikes/www/speedpuzzling.cz/.claude/worktrees/badge-lab` (the "badge lab": a local-only, never-committed working folder; its own docs say "Local only, never committed — the MySpeedPuzzling repo is PUBLIC").
- `check: …` = a command run on this machine on 2026-10-13 (output summarised).
- Commit hashes refer to the `SP` repo.

Naming note: the user's brief calls it "a unified icon set". In the repo it is the **achievement badge art** (17 badge types × 5 tiers, each badge = a frame + a centred illustrated icon). The work ran in two rounds: a July 2026 ComfyUI pipeline, then an October 2026 multi-agent "badge lab" that produced what shipped.

## 1. What was the goal, the timeline and the pipeline architecture?

### Takeaway
The goal was a scalable, reproducible set of tiered badge images (17 types × 5 tiers, scaling to ~40 types "without a designer") in the MSP house illustration style. Two AI-first attempts (July: FLUX.2 Klein 9B over code-drawn frames; October: a ~24 h multi-agent lab testing 4 diffusion models, Blender, LoRAs and hybrids) ended with a **fully deterministic, CPU-only Python→SVG→raster pipeline with no AI in production**. AI was used for research, exploration and as a Claude-written-code engine (LLM-written SVG), not to make the final pixels.

### Cited Findings
- **Brief:** "17 badge types, 5 tiers each" (Bronze…Diamond); "More types will come — the art system must scale to ~40 types without a designer"; renders at 48 px, 72 px and ~160–240 px; light UI only — `LAB/BRIEF.md` §1–2.
- **Hard requirements:** a system, not one-offs (one tier treatment shared by all types + a swappable emblem); tiers read instantly at 48–72 px; a "reproducible recipe … no manual editing steps. Randomness is pinned"; free assets/models with licences fit for a commercial site; transparent 1024×1024 PNG; must survive greyscale at 45 % opacity (the "locked" state) — `LAB/BRIEF.md` §6.
- **Round 1 (July 2026), ComfyUI on this Mac:** research commit `a46f5ba4` (2026-07-16, "model stacks, MPS rules, bake-off plan"), environment commit `d34fde83` (2026-07-17, "models downloaded, nodes verified"), pipeline commit `b72c5e99` (2026-07-17, "validated ComfyUI generation pipeline — Klein 9B + deterministic frames + flood-fill cutout") — `git show --stat` of those commits.
- **July architecture:** "1. render frames — deterministic PIL renderer … 2. generate icon — FLUX.2 Klein 9B Q8 GGUF … 3. cut out icon — border-connected FLOOD FILL, not neural matting … 4. compose … 5. polish (optional) — Klein 9B edit pass per badge, PER-TIER fill prompt … 6. cut out result" — `SP/docs/design-system/badge-pipeline/README.md`.
- **July outcome:** the owner had to choose between "Row B (pure flat)" and "Row C (hand-illustrated)"; open items included a scale test to more icons and a colour-snap post-pass — `SP/docs/design-system/badge-pipeline/README.md` §Open items. The October lab says of that design: "**Jan (owner) is not satisfied.**" — `LAB/BRIEF.md` §4.
- **Round 2 (October 2026), the badge lab:** phase 1 ran "2026-10-09 21:30 → 00:40" and built 20 directions D01–D20; phase 2 (model × style matrix, from 00:45) and a final reviewer verdict at 06:10 on 2026-10-10; a production phase "from ~19:00" — `LAB/review/STATE.md`.
- **Lab architecture:** an orchestrator Claude session plus many subagents, each writing into a folder contract (`README.md`, `STATUS.json`, `recipe/`, `out/`, `sheet.png`), a shared kit (`kit/comfy.py` ComfyUI client with graph builders `klein_t2i, klein_edit, zimage_t2i, qwen_edit, sdxl_t2i`; `kit/gpu_lock.py` GPU lease; `kit/memwatch.py` memory watchdog; `kit/sheet.py` review sheets) — `LAB/PROTOCOL.md`.
- **Agent classes:** "VEC (SVG/code, CPU) · B3D (Blender headless) · AI (ComfyUI, GPU lease) · HYB (mix)" — `LAB/directions/ASSIGNMENTS.md`.
- **Production pipeline that shipped:** "There is no AI, no GPU and no network: Python + shapely draw SVG, and `rsvg-convert` rasterises it"; `registry.py` → `icons/draw.py` → icon SVGs → composed with frozen `bases/*-under.svg` / `*-over.svg` → `lib/svgopt.py` → `rsvg-convert` → WebP/PNG + `manifest.json` — `SP/tools/badge-art/README.md` (Quick start; How it works).
- Production commit `b8355f24` (2026-10-10 22:02, "Badge art: F1 seal ladder generator, frozen tier bases, 17 illustrated icons and the generated SVG/WebP/PNG"); it reached `main` in the squash-merge `9e651224` (2026-10-12, "XP, levels, achievements, karma and the weekly activity digest (#128)", 1,526 files changed); `b8355f24` itself is not an ancestor of `main` — check: `git merge-base --is-ancestor`, `git log -- tools/badge-art`.

### Inferences
- The project's arc (AI-first → deterministic code with AI only at the edges) is the single most important lesson for the Instagram pipeline: wherever there is a hard rule (layout, counts, geometry, brand colours, text), code met it and diffusion models did not.
- Wall-clock: the October lab went from brief to committed production in roughly 24.5 h (2026-10-09 21:30 → 2026-10-10 22:02), most of it autonomous agent time.

### Gaps
- No record of how many hours the owner spent reviewing. The only timestamps are of his messages (`LAB/review/STATE.md`).
- The July Row B/Row C decision is not recorded. The October brief implies the owner rejected the July result.

## 2. Which tools, models, workflows, prompts and style specifications were used?

### Takeaway
Models tested locally in ComfyUI 0.28: FLUX.2 Klein 4B and 9B, Z-Image Turbo (+ Base), Qwen-Image-Edit-2511, SDXL (+ ControlNet-Union, + 8 LoRAs); also Blender 5.2 (Cycles CPU, toon shading, Freestyle lines), Python SVG toolkits (shapely, svgpathtools, cairosvg, skia), rsvg-convert, cwebp and Playwright/Chrome. The style source of truth is a "Semi-flat Outlined" style prefix, plus a measured style spec (S1) that turns it into numbers.

### Cited Findings
- **July model stacks:** Stack 1 FLUX.2 Klein 9B ("brand-precision"), Stack 2 Qwen-Image-Edit-2511 ("consistency editor"), Stack 3 Z-Image Turbo/Base + Icons.Redmond LoRA ("fast iteration"), Stack 4 SDXL + LoRAs + LayerDiffuse ("control group"). Ruled out: FLUX.2-dev (too big for 36 GB), FLUX.1, SD3.5/HiDream/Lumina — `SP/docs/design-system/badge-generation-comfyui.md`.
- **July download:** "All 20 files downloaded (~92 GB)"; custom nodes "ComfyUI-GGUF (city96), ComfyUI-layerdiffuse, Inspyrenet-Rembg" — same file §Setup status.
- **July icon verdict:** Klein 9B Q8 = "Winner"; Klein 4B Q8 "Same language, simpler, 2× faster"; Qwen-Edit "Strong, bolder stroke"; Z-Image Turbo "bold filled app-icon style"; SDXL + Vector Illustration XL "Out — subject drift (drew a wall clock), no coral" — `SP/docs/design-system/badge-pipeline/README.md` §Model verdict.
- **Licence correction in October:** "FLUX.2 klein 9B is not OK for shipped badges; klein 4B is" (9B = FLUX Non-Commercial License v2.1; 4B = Apache-2.0); "The July pipeline (Klein 9B icons + polish) is affected in the same way" — `LAB/research/R3-tooling.md` §0.
- **Commercial-safe vs blocked models (as of 2026-10-09):** OK: klein 4B, Z-Image Turbo/Base, Qwen-Image-Edit-2511 / Qwen-Image-2512 / Layered, SDXL, LongCat-Image(-Edit), ERNIE-Image, HiDream-O1, Ming-Image, Boogu, JoyAI. Not OK: Qwen-Image-2.1 (research licence), Ideogram 4 (non-commercial), HunyuanImage (licence excludes the EU), Krea 2 (only under USD 1M revenue), NVIDIA PixelDiT (non-commercial) — `LAB/research/R3-tooling.md` §0 and §1 (licence clauses quoted there).
- **Newer local candidates noted but not downloaded:** LongCat-Image-Edit-Turbo ("Apache, 6B, 8 steps, Q8 GGUF 6.7 GB, reuses the installed Qwen2.5-VL-7B encoder"); ERNIE-Image ("design / poster / text-heavy layouts", GGUF Q8 8.7 GB); ComfyUI current was v0.39.1 (2026-10-07) vs installed 0.28.0; "Upgrading is not needed for anything commercial-safe that fits" — `LAB/research/R3-tooling.md` §0, §2.
- **MLX alternative:** mflux 0.22.0 is ~25–30 % faster than PyTorch-MPS on klein 4B and at parity on Z-Image Turbo (an M4 Max benchmark); "Verdict: no reason to leave ComfyUI" — `LAB/research/R3-tooling.md` §2.
- **LoRAs tried (all "sell generated images ✓, no credit"):** Z-Image Turbo: Game UI icon, 3D glassmorphism, Vector Icons game assets, Icons.Redmond. SDXL: Enamel Pin Maker, Hex Badge CE, Embroidered Patch, Vector Illustration XL — `LAB/research/R3-tooling.md` §3.
- **House style prefix (verbatim, used for all ChatGPT illustrations):** "Semi-flat line illustration with soft color fills … consistent dark navy blue outline (~2px stroke, color #2b3445) with rounded line caps and joins … soft, pastel-toned colors … very subtle internal gradients … like a gentle watercolor wash contained within crisp outlines … Small horizontal dash marks are used as speed/motion lines". Palette: coral `#EC726F` (30–40 % of fills), sky `#69b3fe`, lavender `#4e54c8`, a touch of teal, navy `#2b3445` for all lines; plus a "Puzzle piece geometry (CRITICAL)" paragraph — `SP/docs/design-system/prompts/style-prefix.md`. The puzzle paragraph was added to the committed prefix in `9e651224`.
- **Illustration skill:** `SP/.claude/skills/illustration/SKILL.md` generates a ChatGPT prompt = style prefix + an expanded subject + aspect ratio, and saves it to `SP/docs/design-system/prompts/subjects/<name>.md`. It does not generate images itself.
- **ChatGPT prompting tips for puzzle art:** anchor on the 🧩 emoji, "few, large pieces", the "missing-piece trick", "boxes instead of pieces", "contained spot illustrations, not backgrounds", "iterate in the same chat … Two to three rounds usually lands it" — `SP/docs/design-system/prompts/subjects/_generation-tips.md` (commit `3115f45d`, 2026-07-11).
- **Measured style spec (S1):** outline "26–30 px = 2.5–2.9 %" of badge width in one ink; washes ΔL\* 6–10, lighter at the top-left, hue fixed; grain SD ≤ 1.5; the existing art ink measures `#08214b` vs the guide token `#2b3445` ("pick one per pipeline, never mix") — `LAB/research/S1-msp-style.md` §5 and §0. S1 also catalogued off-style legacy art (2023 DALL·E isometric neon pieces, glossy 3D stopwatch) — same file §1.
- **Shipped style rules:** canvas 1024², one navy `#2b3445` outline at 27 px (2.64 %), round caps/joins; icon slot = bbox 0.53 × canvas centred, optically fitted; "same-hue washes, 8 L\* lighter at the top-left … There is no gloss"; tier tone table (Bronze `#E28F60` … Diamond = logo prism) — `SP/tools/badge-art/README.md` §Style rules.
- **Icon construction contract:** three tagged SVG layers `face` / `accent` (tier-tinted) / `outline`; "Draw OBJECTS. People appear only as faceless figures … Never draw faces or eyes" (a test owl "read as spectacles"); "No motion dashes"; "Jigsaw pieces only through `jigsaw_piece()`" — `SP/tools/badge-art/README.md` §Icons; `LAB/resources/icons-illustrated/README.md`.

### Inferences
- The shipped style rules (one ink, fixed stroke % of canvas, same-hue washes, top-left light, no gloss, no faces, centred objects) are effectively an existing **MSP brand style bible**. The Instagram pipeline can inherit them for any illustrated element instead of writing a new one.
- The verbatim style prefix is tuned for ChatGPT scene illustrations. For local models it needs per-use variants (see §4).

### Gaps
- No ComfyUI workflow JSON files are committed. Graphs are built in Python (`docs/design-system/badge-pipeline/bakeoff_icons.py`, `LAB/kit/comfy.py`), and I did not extract node-level graphs.
- I did not open the evidence images (`results-*.jpg`, review sheets); visual quality claims here come from the written reviews.

## 3. How were consistency, style and quality enforced and judged?

### Takeaway
Consistency came **by construction**: frozen base files, code-drawn geometry, tagged icon layers, byte-identical rebuilds and composite-back for any AI layer. Quality was judged in three layers: (1) agents self-reviewing their own contact sheets (max 3 rounds); (2) a dedicated reviewer agent scoring every cell with measured metrics plus "eyes", under a weighted rubric with hard caps; (3) the owner picking in an in-product bake-off page. Production has an automated QA gate and a golden check.

### Cited Findings
- **Agent self-review loop:** "Run kit/sheet.py, then LOOK at sheet.png yourself (Read tool) and critique it … Do at most 3 self-review rounds — then ship what you have and list remaining issues" — `LAB/PROTOCOL.md` §Working loop.
- **Context hygiene:** "agents review images (reviewer agent), orchestrator reads text + only final top images" — `LAB/review/STATE.md` §Phase 2 plan; "Your files ARE your report; your final chat message is a short pointer to them" — `LAB/PROTOCOL.md`.
- **Reviewer rubric:** criteria C (centred), G (MSP guide), T (tier at 48 px, colour + locked), R (icon + tier at first sight), J (jigsaw geometry), P (replicability), Q ("quality / charm … it would make Jan smile"). Each was measured (mirror IoU, outline width via distance transform, Lab ΔE vs the ink token, ΔE between tiers, locked ΔL, silhouette IoU) and checked by eye on sheets at 160 px, 48 px on white, 48 px on `#f6f9fc`, and locked. Overall = a weighted mean, "then capped, because a broken rule cannot be bought back" (e.g. cap 2.0 if C, G or J ≤ 1) — `LAB/review/phase2-review.md` §1.
- **Verdict classes:** CANDIDATE / PROMISING / REFERENCE / REJECT; about 100 phase-2 cells were scored, plus 20 phase-1 directions — `LAB/review/phase2-review.md` §5–6.
- **Owner decision UX:** "Jan decides in poc/BK2-bakeoff (keys 1–6)" — a page that switches frame grammars across real product contexts (profile strip, digest row, catalogue locked, cabinet, reveal, modal), so "he picks by using it rather than from a grid" — `LAB/review/STATE.md`; `LAB/review/phase2-review.md` §4 C.
- **Production QA gate:** "icon gate (centring, symmetry, outline weight, no detached marks, 48 px legibility, plate fit >= 49 %, visible tier accent >= 0.25) + golden check against the committed artifacts; 0 failures, 0 warnings" — commit `b8355f24` message.
- **Icon QA thresholds:** bbox centred within ±0.5 units; mirror IoU silhouette ≥ 0.98, ink ≥ 0.93; outline median 4.2–4.8 units; a dash detector (0 detached components); a sliver detector (no hairline gaps); legibility at 24 px (ink coverage 0.15–0.50, edge density ≥ 0.18, accent visibility ≥ 0.10, thin-fill share ≤ 0.15); tint integrity; 6 negative controls the gate must catch — `LAB/resources/icons-illustrated/README.md` §QA gate.
- **Determinism:** "Build is deterministic (byte-identical re-run) and STRICT: missing icon/base = error, never a silent fallback"; frozen bases are hash-checked — `LAB/review/PRODUCTION-CONTRACT.md`; `SP/tools/badge-art/README.md` (`bases.json` sha256).
- **AI consistency techniques measured (B1):** "Use composite-back to keep the base identical" (generate anywhere, paste the frozen base back outside a feathered mask); without it "Klein 4B changes 30–43 % of the rim pixels"; a latent noise mask cuts that to 3–4 %; "To drive the emblem from a vector icon, use Klein 4B multi-reference on an EMPTY base" — `LAB/research/B1-consistency-bakeoff.md` §0.
- **Cold-start replication test:** "A fresh session added `night-owl` (tiered) and `spring-jam` (one-off) … using only the IK1 + BK1 READMEs/code, in ~22 min … Both passed the QA gate on the FIRST draft"; "rebuilding the copy reproduced 102/102 existing SVGs and PNGs byte-identically"; it also found doc gaps and path bugs — `LAB/explore/CS-A/REPORT.md`.
- **No vision-language-model critic was used.** Critique was Claude subagents reading PNG sheets (Read tool) plus numeric image metrics in Python (numpy/scikit-image/OpenCV) — `LAB/PROTOCOL.md`; `LAB/review/phase2-review.md` §1.

### Inferences
- The rubric is directly portable to Instagram visuals: hard caps for rule breaks (wrong puzzle anatomy, off-brand ink, illegible text, wrong facts), measured checks where measurable, a "charm" score from Claude reading the image, and the owner choosing in a faithful preview of the real context (the feed or a phone mock-up) rather than in a grid.
- The cold-start test (a fresh session reproduces the recipe from the docs alone) is a cheap way to verify a skill or pipeline README before relying on it.

### Gaps
- How well the reviewer agent's "Q/charm" scores agreed with the owner's taste is not quantified. The owner picked F1, which was also the reviewer's default (`LAB/review/PRODUCTION-CONTRACT.md`), but phase 1 had 20 directions and the owner judged "nothing is a candidate".

## 4. What failed or looked bad, and why?

### Takeaway
Pure text-to-image failed as a system with every model: it cannot count, keep 5 siblings, keep an icon symmetric, or keep a consistent line weight; it adds unwanted motifs that the style prefix itself suggests; and it draws wrong jigsaw pieces. LoRAs and SDXL made things worse. AI "finishes" over clean vector art were safe but nearly invisible at small sizes. The owner's taste objections (off-centre logo-like emblem, gloss, sparkles, dark plates, stock emoji, faces) killed most of phase 1.

### Cited Findings
- **Owner feedback on phase 1 (first real message after the brief):** "Emblem was wrong: E0 stopwatch is NOT centred (speed dashes on the left, logo-like) … 'use icons, not the logo'"; "So far nothing is a candidate for the direction maybe."; "Follow the EXISTING DESIGN GUIDE" — `LAB/review/STATE.md`; `LAB/BRIEF-PHASE2.md`.
- **t2i strips:** "Counts are never followed: stars, tails, layers and numerals were wrong in every strip"; "Strips have 4 badges instead of 5 (7 of 12 klein strips)"; "The stopwatch 'real object' prior adds one side pusher at 2 o'clock"; "The verbatim prefix leaks speed dashes (9 of 12 klein strips …), and its puzzle paragraph makes the model invent 2-knob or lumpy pieces"; "Tier colour drifts into the icon, and outlines turn red, blue or brown"; line weight too thin: "klein 1.4–1.95 %, Z-Image 1.5–2.5 %, SDXL 0.4–0.6 % of W" (target 2.5–3.3 %) — `LAB/review/phase2-review.md` §3.
- **Prompt order:** "With the ~270-word prefix and a detailed frame, the icon is what gets dropped … Putting the icon first ('HERO ICON …', then 'FRAME = tier N') fixed it" — `LAB/explore/X2-zimage/README.md` §Findings.
- **SDXL:** "ControlNet holds the geometry, but SDXL paints 0.5 % pale lines, faded fills and tinted stationery-paper backgrounds. G = 1 in every cell" — `LAB/review/phase2-review.md` §3.
- **LoRAs:** "Icons.Redmond gives no gain and recolours the outlines. Vector game assets give a fat sticker contour (off-guide). Game-UI gives glossy clay with a pixel-staircase halo. Glass barely shows. A LoRA also adds 9–19 GB of ComfyUI memory" — same file §3; "Switching LoRAs without unloading went critical" — `LAB/explore/X2-zimage/README.md`.
- **AI icon kit (IK2):** "no AI route beats IK1 … klein 4B … the prompt cannot set the line weight: 1.3–1.9 % of the canvas instead of 4.5 %, and the weight varies per icon (CV 22 %)"; "Z-Image t2i ignores the lock and breaks rule 5 (dumbbell knobs)"; "img2img on clean SVG is a no-op" at 0.40; "Consistency needs one image, which costs control … icon 41 would re-roll the other 40" — `LAB/explore/IK2-ai-icons/README.md`.
- **img2img as a finish:** 0.30 = no change, 0.40 best, 0.50 "blotchy"; "invisible at 48–72 px and only shows in the 160–240 px modals" — `LAB/explore/X2-zimage/README.md`. A seeded CPU paper grain with no AI was "the bar every AI finish has to beat" and was hard to tell apart from the AI texture — `LAB/review/phase2-review.md` §6 (`X6:d_p1-x5seal`).
- **klein edit behaviour:** "Text beats reference in Klein edit mode — whatever fill the prompt describes overrides the input image's fill … each tier's polish prompt must state that tier's fill exactly" — `SP/docs/design-system/badge-pipeline/README.md`; klein "is not a layout engine … Use it as a renderer over deterministic geometry" — `LAB/explore/X1-klein4b/README.md`.
- **Style references:** with klein a style ref "adds the site's grain, but klein copies the reference's stopwatch … and breaks the count" — `LAB/explore/X1-klein4b/README.md`.
- **Matting:** "Neural matting destroys flat art — Inspyrenet removed the icon's interior white fills … Border-connected flood fill is exact on flat art with closed outlines" — `SP/docs/design-system/badge-pipeline/README.md`.
- **Off-brand looks rejected by the reviewer (phase 1):** navy enamel and 3D metal (D02/D03/D05/D15, "G = 1"), "Glossy 3D stock emoji (not MSP)" (D18), logo-based medallion (D12), dark esports plates (D14), embroidered patch (D17) — `LAB/review/phase2-review.md` §5.
- **Blender pitfalls:** isometric badges fail at this line weight; a toon wash "leaves white blotches … that read as paint chips"; "No outlines: shapes melt; proves the navy line IS the style"; six Freestyle/bevel pitfalls documented — `LAB/explore/X7-blender-npr/README.md`; `LAB/review/phase2-review.md` §6.
- **Puzzle pieces:** "Wrong pieces are worse than no piece: reject them" — `LAB/BRIEF-PHASE2.md` rule 5; at 48 px "the correct all-tabs-out piece reads as a plus or cross" — `LAB/review/phase2-review.md` §3.
- **Owner design vetoes in production:** no sparkle stars on T5, "No white gloss arcs", "Unboxed" redrawn as a crossed-out eye, plus approval of tuned icons — `LAB/review/PRODUCTION-CONTRACT.md`; `SP/tools/badge-art/README.md` §Decisions.
- **Social share card (AI background + text overlay) rejected:** "Rework the art of the launch share card … Jan 2026-10-12: 'I do not like it'. 'Share my level' is hidden on the reveal page meanwhile" — `SP/docs/TODO.md`; `SP/docs/features/xp-levels/ux-polish/design-spec.md` ("A share that sends a picture Jan does not like is worse than none"). The card is an 800×800 pre-made background (`public/img/xp/share-card-background-800.png`) with Rubik text drawn on by Intervention Image — `SP/src/Services/GetXpShareCard.php`.

### Inferences
- For Instagram, any text, numbers, counts (e.g. leaderboard ranks, times), logos and puzzle-piece shapes should be rendered by code (HTML/SVG) and never asked of a diffusion model.
- The closest precedent for an Instagram post, the share card, is exactly the "AI background + programmatic text" pattern, and the owner rejected its art. The fixed background art and its composition are the likely weak points, not the text rendering. A visual-quality bar for Instagram must be validated with the owner early.
- The verbatim prefix's "speed/motion lines" sentence and puzzle paragraph should be split into optional modules (X2's `style_prefix("badge")` variant) when prompting local models.

### Gaps
- I found no record of why the owner disliked the share card art (composition, style or execution). This is worth asking before building Instagram templates.
- How the share-card/XP-hero backgrounds were generated is not documented. Prompt files exist in `SP/docs/design-system/prompts/subjects/level-share-card-background.md` and `xp-launch-reveal-hero.md` (ChatGPT format), which suggests ChatGPT, but I could not confirm it.

## 5. Time and compute per asset, and lessons for agent-driven generation on this Mac

### Takeaway
On the M3 Max (36 GB), the commercial-safe models ran at about 1–2 min per 768–1024 px image (klein 4B Q8 median 60 s, Z-Image Turbo Q8 median 80 s). 2-reference edits took about 3 min, and Qwen-Image-Edit took about 6 min while hitting memory limits. Unified memory, not disk, was the binding constraint: one model family at a time, a GPU lease, a memory watchdog, and at most about 6 concurrent agents (an account usage limit killed every running agent once). The deterministic production build takes about 1.4 s per badge type.

### Cited Findings
- **Run log totals:** 301 ComfyUI runs between 2026-10-09 21:53 and 2026-10-10 05:15. Medians: klein 4B Q8 GGUF 60 s (n = 178, ≈190 GPU-min); SDXL 52 s (n = 33); Z-Image Turbo Q8 80 s (n = 27); Z-Image Turbo bf16 128 s (n = 21); klein 9B Q8 179 s (n = 13); Qwen-Image-Edit Q6_K + Lightning 345–380 s (n = 2, 1 ok). Summing all models gives ≈ 408 GPU-minutes (~6.8 h) — check: summary of `LAB/gpu/runs.jsonl`.
- **ComfyUI flag A/B on this machine:** baseline (bf16 weights, sub-quadratic attention, text encoders on CPU) klein 4B Q8 t2i 1024² 8 steps = 86 s cold / 80 s warm, edit 768 = 99 s, Z-Image t2i 1024² = 173 s. `--gpu-only --fp16-unet --fp16-vae` gave a "BLACK image (fp16 overflow)" on Z-Image (rejected); `--use-pytorch-cross-attention` made an edit hit "27 GB → critical" (rejected) — `LAB/gpu/AB-NOTES.md`.
- **Conflict with the July doc:** the July research recommended `--fp16-vae --fp16-unet` and `--use-pytorch-cross-attention` ("30–50 % faster") — `SP/docs/design-system/badge-generation-comfyui.md` §MPS rules. The October A/B on the same machine rejected both — `LAB/gpu/AB-NOTES.md`. July also found bf16 Z-Image faster than Q8 GGUF (98 s vs 152 s); in October Q8 was used for memory safety at 768 px.
- **Memory per family:** "klein 4B 17–21 GB, Z-Image 23–25, Qwen-Edit 28 (1 img) / 2 imgs = critical. Blender ~2–8 GB" — `LAB/review/STATE.md`. The earlier estimate in `LAB/PROTOCOL.md` was lower (klein 4B ≈ 13 GB, Z-Image ≈ 19 GB), so measured peaks exceeded the planning numbers. "Prefer 768 px for edits/multi-reference (2-reference edits are the memory peak: 17–21 GB)"; "klein is distilled: 4 steps ≈ 86 s vs 8 steps 160–180 s" — `LAB/gpu/AB-NOTES.md`.
- **Memory incidents:** the watchdog interrupted ComfyUI 4 times (01:23–01:36) — `LAB/gpu/memwatch-actions.log`; peaks since start: swap 22.79 GB, min free 13 %, max pressure level 4 — `LAB/gpu/mem_status.json`. Fixes: Q8 GGUF, ≤ 768 px, `comfy.free()` before each LoRA, a 22 GB memgate — `LAB/explore/X2-zimage/README.md`.
- **GPU scheduling:** a FIFO lease was needed because "X1/X3 had 0 cells after 1 h because X2 kept re-acquiring"; rule: "One GPU turn ≤ ~15 min while others wait" — `LAB/review/STATE.md`; `LAB/PROTOCOL.md`.
- **Usage limit:** "04:30–05:20 USAGE LIMIT hit (too many parallel agents) → all running agents died mid-task … (restartable design held). Lesson: keep ≤ ~6 concurrent agents" — `LAB/review/STATE.md`.
- **July per-asset times:** "icons ~70–150 s each, polish passes ~4–6.5 min each"; polishing every composed badge = "80 runs ≈ 6–9 h unattended" — `SP/docs/design-system/badge-pipeline/README.md`.
- **B1 times (768 px, 8 steps, warm):** one-reference edits 80–125 s, two-reference 161–181 s — `LAB/research/B1-consistency-bakeoff.md` §0.
- **Deterministic engines:** SVG ≈ 0.5–1 s CPU for 5 tiers; Blender NPR ≈ 10–20 s CPU per achievement (Cycles CPU 1.0–3.1 s per tier); the X6 AI texture atlas means "the AI runs 5 times in total" and each new badge is ≈ 2 s CPU — `LAB/review/phase2-review.md` §2; `LAB/explore/X7-blender-npr/README.md`.
- **Production build:** "CPU only, ~1.4 s and ~120 MB per badge type, full build 46 s on an M3 Max"; QA ≈ 115 s — commit `b8355f24`; `SP/tools/badge-art/README.md`.
- **Lab environment rules:** never pip-install into ComfyUI's venv; downloads > 2 GB need orchestrator approval; Blender takes its own lease; scripts must be restartable because the watchdog can SIGTERM the largest process — `LAB/PROTOCOL.md`.

### Inferences
- For Instagram (a handful of visuals per week), GPU time is affordable: about 1–2 min per candidate image with klein 4B or Z-Image Turbo Q8 at ≤ 1024 px. Generating 4–8 candidates per post fits in ~5–15 min. The real constraint is not running ComfyUI next to other heavy jobs (Docker, Blender, a local LLM) within 36 GB.
- `kit/gpu_lock.py`, `kit/memgate.py` and `kit/memwatch.py` are directly reusable if the Instagram pipeline ever runs parallel agents. For a single sequential pipeline, a simple "free memory ≥ N GB before enqueue" check is probably enough.

### Gaps
- No per-image timings for Qwen-Image-Edit beyond 2 runs, and none for Z-Image Base (installed but absent from the run log).
- No measurement at Instagram-typical aspect ratios. All runs were square or strips.

## 6. What was the final verdict, and what shipped?

### Takeaway
Verdict: "The model is not where the gap is … The gap is design." The shipped system is the deterministic SVG engine + 17 LLM-written illustrated icons + the "F1 seal ladder" frame, with motion (a last-piece reveal) done in the front end. 81 badge images ship as SVG + WebP + PNG. No AI-generated pixels shipped in the badges. The AI's role reduced to research, ideas and moodboards, and Claude writing the drawing code.

### Cited Findings
- **Recommended stack:** "Engine: Deterministic SVG … It is the only engine that meets every hard rule … About 1 s CPU for 5 tiers with byte-identical re-runs, no GPU, no model-licence question. Every AI route failed as a system, or at best preserved the SVG without improving it." "AI finish (optional): None at 48–96 px." — `LAB/review/phase2-review.md` §FINAL VERDICT.
- "An AI finish is safe but almost invisible … The model is not where the gap is. The gap is design" (the icon, the colour ladder, the silhouette steps) — `LAB/review/phase2-review.md` §0.
- **Breakthrough:** "IK1 DONE — illustrated icons are the breakthrough for 'icon = hero'" — `LAB/review/STATE.md`. IK1 = "LLM-written clean SVG (R5 route) with tagged layers … and an automatic QA gate" — `LAB/resources/icons-illustrated/README.md`. R5: "LLM-written SVG + auto-QA best … NOT worth: AI→SVG vectorising" — `LAB/review/STATE.md`.
- **Owner decisions:** F1 seal ladder v2 (T1 circle → T2 6 scallops → T3 12 scallops → T4 + pleats/tails → T5 18-ray sunburst + crown, logo prism); the 17 IK1 icons approved; ship SVG + WebP (`cwebp -sharp_yuv -q 90`) + PNG for e-mail; locked state stays CSS — `LAB/review/PRODUCTION-CONTRACT.md`; `SP/tools/badge-art/README.md` §Decisions.
- **Shipped files:** `SP/public/img/badges/{svg,webp/<px>,png/<px>,holo}/` + `manifest.json`; 81 SVGs present — check: `ls public/img/badges/svg | wc -l` = 81. In `main` via `9e651224` (2026-10-12).
- **WebP lesson:** plain lossy WebP (4:2:0) turned the gold crown grey-beige and the coral gem mauve at small sizes; `cwebp -sharp_yuv` fixed it; the catalogue page went from ~0.74 MB to 0.39 MB — `SP/tools/badge-art/README.md` §WebP encoding.
- **AI-generated assets that did ship elsewhere:** six ChatGPT-made homepage illustrations (hero, four sections, community band) "integrated (AVIF/WebP/PNG at 2x display size, 30-75KB each)" — commit `7a631d35` (2026-07-11), prompts in commit `3115f45d`.

### Inferences
- For Instagram: AI-generated illustration has shipped for MSP only via ChatGPT scene illustrations with heavy prompt engineering and iteration, never from the local models. The local models were judged good at the house *look* (klein 4B "closest to house art style"), but only as a renderer over code-made structure.
- The badge assets themselves (81 SVGs, the 17 icons, the frozen frames) are reusable brand elements for Instagram graphics (e.g. achievement spotlights), with no generation needed.

### Gaps
- Local models were never tested on full scenes or posters (the Instagram use case). All evidence is badge/icon-scale. Their usefulness for backgrounds and scene illustrations is untested here.

## 7. Which scripts, skills and patterns transfer to Instagram visuals?

### Takeaway
Reusable now: the style prefix and its measured spec (S1), the icon toolkit + QA gate (`tools/badge-art`), the ComfyUI Python client with graph builders (`LAB/kit/comfy.py`), composite-back and flood-fill cutout helpers, the review-sheet tooling, and the reviewer rubric. The patterns that matter most: code owns layout, text and geometry; AI is a constrained renderer or a "paint once, reuse" texture; measured QA gates; and an owner decision in context.

### Cited Findings
- **Committed, reusable code:** `SP/tools/badge-art/` (registry, `icons/illus.py` toolkit with path builder, palettes, `jigsaw_piece()`, house `light()`; `icons/gate.py` QA; `lib/compose.py` optical fit; `lib/raster.py` rsvg/cwebp/PNG; `lib/holo.py`) — `SP/tools/badge-art/README.md`. July scripts: `SP/docs/design-system/badge-pipeline/{badge_pipeline.py, badge_pipeline2.py (floodfill_cutout), badge_pipeline3.py, bakeoff_icons.py}`.
- **Uncommitted lab code (local only):** `LAB/kit/comfy.py` (ComfyUI client + graph builders for klein t2i/edit, Z-Image t2i, Qwen-Edit, SDXL), `kit/gpu_lock.py`, `kit/memgate.py`, `kit/memwatch.py`, `kit/sheet.py`, `kit/gallery.py`; `LAB/research/R3-recipes/klein_inpaint.py` (freeze base → masked klein-4B inpaint → composite back; "Statically validated … not executed"); `LAB/explore/X2-zimage/recipe/x2_prompts.py` (`style_prefix("badge")`); `LAB/explore/X6-hybrid/` (texture atlas + composite-back); `LAB/review/phase2/recipe/` (measure.py, scores.py, sheets.py — the rubric); `LAB/explore/X7-blender-npr/recipe/` (Blender toon + Freestyle in the house look) — `LAB/PROTOCOL.md`; the respective READMEs.
- **Skills:** the only image-related skill in the repo is `SP/.claude/skills/illustration/SKILL.md` (it writes ChatGPT prompts; no local generation). The other `SP/.claude/skills/*` are unrelated (implement-todo, internal-api, puzzle-change-proposal, missing-translations, feature-request, feature-request-complete) — check: `ls SP/.claude/skills`.
- **"Paint once, reuse" pattern:** "X6's frozen textures make the AI finish free per achievement. The AI runs 5 times in total, and every new badge is a deterministic composite" — `LAB/review/phase2-review.md` §2.
- **Prompting patterns that worked:** subject-first ordering; an explicit symmetric description ("crown exactly at the top centre, two short pushers at ten and two o'clock"); the per-tier fill stated explicitly in edits; one-image sheets for sibling consistency (b-sheet line CV 2.3 %) at the cost of control; fixed seeds — `LAB/explore/X2-zimage/README.md`; `LAB/explore/IK2-ai-icons/README.md`; `SP/docs/design-system/badge-pipeline/README.md`.
- **Pipelines worth reusing when AI is needed:** "deterministic SVG (X5) or Blender NPR (X7) geometry → optional AI finish (Z-Image i2i 0.4 / klein edit) → composite-back where exactness matters"; klein 4B "silhouette scaffold" (grey shapes in, house look out) — `LAB/review/STATE.md` 02:30; `LAB/explore/X1-klein4b/README.md`.
- **Style-LoRA option, deliberately deferred:** the corpus is 9 on-guide ChatGPT illustrations; "OpenAI's terms bar using output 'to develop models that compete' — Jan should check this before training on it"; training on this Mac is possible at 512², rank 8–16, 3–8 h; recommendation "LATER", after curating 30–60 approved images — `LAB/research/S1-msp-style.md` §9; `LAB/research/R3-tooling.md` §4.5.
- **Fonts for programmatic text:** Rubik (OFL) static weights in `SP/assets/fonts/Rubik/` (Light … Black, incl. ExtraBold) and a variable `SP/tools/badge-art/reveal/fonts/Rubik[wght].ttf`; the share card already renders Rubik ExtraBold/Bold in navy `#2b3445` and indigo `#4e54c8` — check: `find`; `SP/src/Services/GetXpShareCard.php`.

### Inferences
- A concrete transfer for the Instagram pipeline: **(1)** an HTML/SVG template engine (Playwright/Chrome or rsvg) owns the grid, typography (Rubik), data, logo and badge art; **(2)** optional AI imagery goes only into bounded slots (a background texture, a spot illustration on white), generated with klein 4B or Z-Image Turbo, cut out with flood fill or BiRefNet, then composited; **(3)** an automated gate (brand-palette ΔE, text contrast and safe zones, no AI-made text or pieces) plus a Claude critique against a written rubric with hard caps; **(4)** the owner approves in a faithful feed preview.
- "Paint once, reuse" maps well to Instagram: generate a small library of approved on-brand textures and spot illustrations once, curate them with the owner, and reuse them across posts deterministically. This avoids per-post AI variance and "AI slop".
- The badge-lab protocol (`PROTOCOL.md`: folder contracts, files as reports, self-review ≤ 3 rounds, STATE.md that survives summarisation, ≤ 6 concurrent agents) is a ready template for any multi-agent exploration of Instagram visual directions. It lives only in the local worktree, so it would need copying.

### Gaps
- `LAB/` is not in git. If that worktree is deleted, the lab code, research reports (R1–R5, S1, B1) and review tooling are lost. I did not check for backups.
- I did not verify that `LAB/kit/comfy.py` still works against the current ComfyUI (server not running; read-only constraint).

## 8. Local inventory: Comfy Desktop / ComfyUI

### Takeaway
One ComfyUI install, shared by Comfy Desktop and a headless launch: core 0.28.0 (July 2026; upstream was at v0.39.1 on 2026-10-07), models in `~/Documents/ComfyUI/models` (106 GiB, 26 files). It covers four model families plus ControlNets, LoRAs and BiRefNet. The server was **not running** during the check. Custom nodes: ComfyUI-GGUF, layerdiffuse, Inspyrenet-Rembg and comfyui-agent-panel. Upscalers: none.

### Cited Findings
- **Apps and versions:** `/Applications/Comfy Desktop.app` (bundle version 1.0.29); ComfyUI core at `~/ComfyUI-Installs/ComfyUI/ComfyUI` `__version__ = "0.28.0"`, git `v0.28.0-7-g71b73e3b` (2026-07-16); venv `~/Documents/ComfyUI/.venv` (1.7 GB) with torch 2.10.0, torchvision 0.25.0, comfyui-frontend-package 1.45.21, comfyui_manager 4.2.2, gguf 0.19.0, transformers 5.0.0, diffusers 0.39.0 — check: Info.plist, `comfyui_version.py`, `git describe`, venv metadata.
- **Config:** `~/Library/Application Support/ComfyUI/config.json` → `basePath: /Users/janmikes/Documents/ComfyUI`, `selectedDevice: mps`. `extra_models_config.yaml` → `base_path: /Users/janmikes/Documents/ComfyUI`, models in `models`, custom_nodes `custom_nodes/`, plus a `desktop_extensions` custom-nodes path `/Applications/ComfyUI.app/Contents/Resources/ComfyUI/custom_nodes` that does not exist (the app is now named `Comfy Desktop.app`) — check: file reads; `mcp__comfyui__list_local_models action:list_paths`.
- **Headless launch used by the lab:** `cd ~/ComfyUI-Installs/ComfyUI/ComfyUI && ~/Documents/ComfyUI/.venv/bin/python3 main.py --port 8000 --enable-manager --base-directory ~/Documents/ComfyUI` — `SP/docs/design-system/badge-generation-comfyui.md` §Setup status.
- **Running?** No. `curl http://127.0.0.1:8000/system_stats` and `:8188` both gave no response; the ComfyUI MCP `get_system_stats` returned "ECONNREFUSED … http://127.0.0.1:8000" (its configured target is port 8000) — check, 2026-10-13. Last outputs in `~/Documents/ComfyUI/output` are dated 2026-10-10 05:15 (IK2 runs).
- **Custom nodes** (`~/Documents/ComfyUI/custom_nodes`): `ComfyUI-GGUF`, `ComfyUI-layerdiffuse`, `ComfyUI-Inspyrenet-Rembg`, `comfyui-agent-panel` (a sidebar agent panel from the comfyui-mcp project that drives the canvas via a Claude or ChatGPT subscription) — check: `ls`; the node's README.
- **Model files** (decimal GB; check: `find … -size +1M`):

| Folder | File | GB | Family / use | Licence (per R3) |
|---|---|---|---|---|
| unet | `flux-2-klein-4b-Q8_0.gguf` | 4.30 | FLUX.2 klein 4B (the lab workhorse) | Apache-2.0 ✅ |
| diffusion_models | `flux-2-klein-4b.safetensors` | 7.75 | klein 4B full precision (slower at baseline flags) | Apache-2.0 ✅ |
| unet | `flux-2-klein-9b-Q8_0.gguf` | 9.98 | klein 9B | **Non-commercial ❌** |
| text_encoders | `Qwen3-8B-Q8_0.gguf` | 8.71 | text encoder for klein 9B | — |
| text_encoders | `qwen_3_4b.safetensors` | 8.04 | text encoder for klein 4B and Z-Image | — |
| vae | `flux2-vae.safetensors` | 0.34 | FLUX.2 VAE | — |
| diffusion_models | `z_image_turbo_bf16.safetensors` | 12.31 | Z-Image Turbo bf16 | Apache-2.0 ✅ |
| unet | `z_image_turbo-Q8_0.gguf` | 7.22 | Z-Image Turbo Q8 (memory-safe) | Apache-2.0 ✅ |
| diffusion_models | `z_image_bf16.safetensors` | 12.31 | Z-Image Base (LoRA-training base; not in the run log) | Apache-2.0 ✅ |
| vae | `z_image_ae.safetensors` | 0.34 | Z-Image VAE | — |
| loras | `z_image_turbo_distill_patch_lora_bf16.safetensors` | 0.16 | Z-Image distill patch | — |
| model_patches | `Z-Image-Turbo-Fun-Controlnet-Union-2.1-lite-2602-8steps.safetensors` | 2.02 | Z-Image ControlNet (Canny/Depth/HED/Scribble/Gray) | Apache-2.0 ✅ |
| unet | `qwen-image-edit-2511-Q6_K.gguf` | 16.85 | Qwen-Image-Edit-2511 | Apache-2.0 ✅ |
| text_encoders | `Qwen2.5-VL-7B-Instruct-Q8_0.gguf` + `…-mmproj-F16.gguf` | 8.10 + 1.35 | Qwen-Edit text encoder (also a VLM) | — |
| vae | `qwen_image_vae.safetensors` | 0.25 | Qwen VAE | — |
| loras | `Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16` / `2509-Lightning-4steps` / `2509-Lightning-8steps` | 0.85 each | Qwen-Edit speed LoRAs (2509 ones superseded) | Apache ✅ |
| checkpoints | `sd_xl_base_1.0.safetensors` | 6.94 | SDXL base | OpenRAIL++ ✅ |
| controlnet | `controlnet-union-sdxl-promax.safetensors` | 2.51 | SDXL ControlNet Union | Apache ✅ |
| loras | `Vector_illustration_XL`, `sdxl_enamel_pin_maker`, `sdxl_hex_badge_ce`, `sdxl_embroidered_patch_ral` | 0.23 / 0.24 / 0.36 / 0.23 | SDXL style LoRAs | Civitai "sell images" ✅ |
| loras | `Icons_Redmond_ZImageTurbo`, `zit_game_ui_icon`, `zit_3d_glassmorphism`, `zit_vector_icons_game_assets` | 0.09 / 0.17 / 0.17 / 0.17 | Z-Image style LoRAs | Civitai "sell images" ✅ |
| background_removal | `birefnet.safetensors` | 0.44 | BiRefNet cut-outs (native `RemoveBackground` node) | MIT ✅ |

- **Folder totals:** unet 36 GiB, diffusion_models 30, text_encoders 24, checkpoints 6.5, loras 4.1, controlnet 2.3, model_patches 1.9, vae 0.9, background_removal 0.4; whole `models/` 106 GiB — check: `du -sh`.
- **Upscalers / embeddings / IP-Adapter:** none present (no `upscale_models` files) — check: `find`.
- **Licence column source:** `LAB/research/R3-tooling.md` §1, §3.
- **Lab-measured footprints and speeds:** see §5 (klein 4B 17–21 GB peak; Z-Image 23–25 GB; Qwen-Edit 28 GB with one image).

### Inferences
- **Already usable for Instagram without downloads:** klein 4B (t2i, edit, multi-reference; Apache), Z-Image Turbo (t2i, img2img, ControlNet; Apache), Qwen-Image-Edit-2511 (precise edits, but memory-critical), BiRefNet and layerdiffuse for cut-outs, flood-fill in Python. That covers "spot illustration", "texture", "edit/restyle a photo" and "cut out" needs.
- **Not usable for MSP commercial output:** klein 9B (+ its Qwen3-8B encoder). Instagram marketing for a site with paid memberships is plausibly commercial use under the same reasoning R3 applied to badges.
- Upgrading ComfyUI from 0.28.0 is optional. R3 judged it unnecessary for any commercial-safe model that fits, though an upgrade brings an MPS int8 fix (v0.35).

### Gaps
- I could not query the live `/object_info` or the ComfyUI version from the server, because the server is not running and starting it was out of scope.
- The comfyui-agent-panel version and its use in the lab are not documented in the lab files.

## 9. Local inventory: Draw Things, LM Studio and other model runtimes

### Takeaway
Draw Things is installed (App Store build 26.1008.0, installed 2026-10-10) but has never stored anything: no models and no HTTP API running. LM Studio 0.3.5 holds one small MLX text model (Llama-3.2-3B-Instruct-4bit, 1.69 GB), and its server is off. Homebrew llama.cpp 0.6.0 is installed. A Qwen2.5-VL-7B GGUF + mmproj already sits in ComfyUI's text_encoders folder, which could plausibly serve as a local vision critic, but this is untested.

### Cited Findings
- **Draw Things:** `/Applications/Draw Things.app`, `CFBundleShortVersionString 26.1008.0`, app bundle dated 2026-10-10 19:42; its sandbox `~/Library/Containers/com.liuliu.draw-things` totals 36 KB, with no `Data/Documents/Models` — check: `du`, `find`. No response on 127.0.0.1 ports 7859/7860/7861 — check: `curl`.
- **LM Studio:** `/Applications/LM Studio.app` version 0.3.5; models under `~/.cache/lm-studio/models/` = `mlx-community/Llama-3.2-3B-Instruct-4bit` (1.69 GB); `~/.cache/lm-studio` total 1.8 GB; no `~/.lmstudio`; `lms` CLI at `~/.cache/lm-studio/bin/lms`; nothing answering on 127.0.0.1:1234 — check.
- **llama.cpp:** `/opt/homebrew/bin/llama-server` and `llama-cli`, brew `llama.cpp 0.6.0_1` (build 11429) — check.
- **Not installed:** ollama, mflux (`mflux-generate`), comfy-cli (`comfy`) — check: `which`.
- **Other caches:** `~/.cache/huggingface/hub` 464 MB (only `Systran/faster-whisper-small`); `LAB/tools/models/SVGThinker-7B.Q4_K_M.gguf` 4.4 GB ("SVGThinker-7B installed, unrun") — check; `LAB/review/STATE.md` 01:55.
- **Vision encoder on disk:** `~/Documents/ComfyUI/models/text_encoders/Qwen2.5-VL-7B-Instruct-Q8_0.gguf` (8.10 GB) + `…-mmproj-F16.gguf` (1.35 GB) — check (§8).

### Inferences
- Draw Things adds nothing today: it would need its own model downloads (duplicating what ComfyUI has, in its own format), and the lab never used it. Skip it for the pipeline unless the owner prefers its UI for manual tweaking.
- The Qwen2.5-VL-7B GGUF + mmproj pair is the standard input format for llama.cpp's multimodal server, so a local "vision critic" may be possible with zero downloads. This needs verification (llama.cpp 0.6.0 support for Qwen2.5-VL with this mmproj is not confirmed here). Claude Code itself reading PNGs (as the lab did) remains the proven critic.
- LM Studio 0.3.5 with a 3B text model is not useful for image work. Any VLM use there would need new downloads.

### Gaps
- I did not check whether Draw Things' HTTP API toggle is set (no preferences file exists yet because the app was never configured).
- I did not test llama.cpp with the Qwen2.5-VL files (that would mean running a model; out of scope).

## 10. Local inventory: Blender, runtimes, browsers, media tools, fonts

### Takeaway
Everything needed for a code-first render pipeline is present: Blender 5.2.2 LTS (headless-capable, no third-party add-ons), Python 3.14.6 and 3.13, Node 25.1.0, Bun 1.3.14, Playwright browser builds, Google Chrome 155, ffmpeg 8.0.1, ImageMagick 7.1.2-8, rsvg-convert 2.62.3, cwebp 1.6.0, avifenc, potrace, pngquant and oxipng. Missing: Inkscape, resvg, svgo, vtracer and exiftool. Brand typography is available as Rubik files in the app repo; only stock macOS display fonts are installed system-wide.

### Cited Findings
- **Blender:** `/opt/homebrew/bin/blender` → "Blender 5.2.2 LTS, build date 2026-09-15"; the user config `~/Library/Application Support/Blender/5.2/extensions` is empty (no user extensions/add-ons); bundled `addons_core`: bl_pkg, cycles, hydra_storm, io_curve_svg, io_scene_gltf2, io_scene_fbx, node_wrangler, rigify, etc. — check. The lab ran it headless as `blender -b -P script.py` — `LAB/PROTOCOL.md`.
- **Relevant Blender capabilities proven in the lab:** "Cycles CPU analytic toon + Freestyle" reproduces the house outlined look deterministically (md5-identical re-renders), 1.0–3.1 s per tier at 1024 px; Workbench + Line Art 0.36 s gives a flat-vector look; a toon turntable MP4 (105 kB) and a GLB (144 kB) were made for a spinning medal PoC — `LAB/explore/X7-blender-npr/README.md`; `LAB/review/STATE.md`. A Blender medal 1024 px took "7 s Metal / 24 s CPU, byte-identical re-runs" — `LAB/research/R3-tooling.md` §0.
- **Runtimes:** `python3` = 3.14.6 (Homebrew; also 3.13), Node v25.1.0, Bun 1.3.14 — check.
- **Playwright:** `~/Library/Caches/ms-playwright` 2.7 GB holding chromium 1208/1223/1243/1248 (330–366 MB each), chromium_headless_shell ×4 (~190–200 MB each), firefox-1543, webkit-2359, ffmpeg 1011/1013; the lab venv has Python `playwright 1.63.0`; Google Chrome 155.0.8059.40 is installed (the lab used Playwright `channel="chrome"` for SVG/CSS rendering) — check; `LAB/PROTOCOL.md`.
- **Lab Python venv** (`LAB/.venv`, Python 3.14.6): pillow 12.3.0, numpy 2.5.3, opencv-python-headless 5.0.0.93, scikit-image 0.26.0, scipy 1.18.1, shapely 2.2.0, cairosvg 2.9.1, skia-python 144.0.post2, svgpathtools 1.8.0, fonttools 4.66.1, torch 2.14.1, playwright 1.63.0 — check. Production pins are in `SP/tools/badge-art/requirements.txt` and `toolchain.json`.
- **Media CLIs** (Homebrew): ffmpeg 8.0.1, ImageMagick 7.1.2-8 Q16-HDRI, librsvg/rsvg-convert 2.62.3 (cairo 1.18.4, pango 1.58.0, harfbuzz 14.2.1), webp/cwebp 1.6.0 (libsharpyuv 0.4.2), avifenc, potrace 1.16, pngquant, oxipng — present. Inkscape, resvg, svgo, vtracer, exiftool: not found — check: `which`, `brew list --versions`.
- **Fonts:** user fonts are only MesloLGS NF, Source Code Pro Powerline, Gogh, unicons; `/Library/Fonts` holds Arial Unicode. Stock macOS display families present include Avenir/Avenir Next (Heavy/Black/Condensed), Futura, DIN Alternate/Condensed, Helvetica Neue, Arial Black — check: `fc-list`. Not installed system-wide: Rubik, Inter, Montserrat, Poppins, Bebas, Anton, Archivo, Space Grotesk.
- **Brand font:** Rubik static TTFs (Light, Medium, Bold, ExtraBold, Black, italics) in `SP/assets/fonts/Rubik/`, a web copy in `SP/public/fonts/rubik`, a variable `Rubik[wght].ttf` with `OFL.txt` in `SP/tools/badge-art/reveal/fonts/` — check: `find`. Brand font = "Rubik" — `LAB/BRIEF.md` §3.

### Inferences
- For HTML/CSS-templated Instagram graphics, the pipeline can load Rubik straight from the repo files (OFL allows bundling) and render with Playwright's Chromium or the installed Chrome. No font install is needed.
- Multiple Chromium revisions in the Playwright cache suggest several projects pin different Playwright versions. The msp-instagram repo should pin one already present (e.g. whichever maps to chromium-1248) to avoid another ~570 MB download.

### Gaps
- I did not map Playwright browser revisions to npm Playwright versions.
- Docker images relevant to rendering were not inspected (Docker is running, but listing images was out of scope).

## 11. Disk: free space and biggest consumers

### Takeaway
82 GiB free on a 926 GiB volume (91 % used). The largest single consumers are the Docker VM disk (~152 GiB allocated), `~/www` projects (186 GiB, including 24 GiB of speedpuzzling worktrees), and ComfyUI models (106 GiB). Within ComfyUI, about 19 GB is a licence-unusable model (klein 9B + its encoder), about 10.5 GB is the SDXL stack (failed every lab test), and several duplicates exist.

### Cited Findings
- **Free space:** `/System/Volumes/Data` 926 Gi size, 816 Gi used, 82 Gi available (91 %) — check: `df -h`.
- **Docker:** `~/Library/Containers/com.docker.docker/Data/vms/0/data/Docker.raw` apparent 208 GB, allocated ≈ 152 GiB (`du` of the container 152 G) — check: `ls -lsh`, `du`.
- **Projects:** `~/www` 186 GiB; `SP/.claude/worktrees` 24 GiB (many agent worktrees with their own node_modules/vendor); `LAB/` 9.1 GiB (including the 4.4 GB SVGThinker-7B GGUF, 1.2 GB `.venv`, 1.2 GB explore, 1.1 GB directions) — check.
- **ComfyUI:** `~/Documents/ComfyUI/models` 106 GiB (breakdown in §8), `.venv` 1.7 GB, output 172 MB — check.
- **Other:** `~/Library/Application Support` 29 GiB (Claude 12, JetBrains 7.8, Spark 2.6, Battle.net 1.7, Figma 1.1); `~/.npm` 24 GiB; `~/Library/Caches` 23 GiB (JetBrains 9.9, ms-playwright 2.7, Google 2.4, pip 1.0); `~/Pictures` 13 GiB; `~/.cache` 6.4 GiB (uv 2.4, lm-studio 1.8, huggingface 0.46); `~/Downloads` 1.9 GiB — check: `du -sh`.
- **ComfyUI prune candidates** (sizes from §8; usage from `LAB/gpu/runs.jsonl`; licences from R3):
  - klein 9B Q8 (9.98) + Qwen3-8B Q8 encoder (8.71) = **18.7 GB**: non-commercial licence, "exploration only, never in finals" — `LAB/PROTOCOL.md`.
  - SDXL base (6.94) + ControlNet-Union SDXL (2.51) + 4 SDXL LoRAs (1.06) = **10.5 GB**: "SDXL in any form … G = 1 in every cell" — `LAB/review/phase2-review.md` §3. LayerDiffuse native alpha depends on SDXL.
  - Z-Image Base bf16 (12.31): absent from the run log; only needed for future LoRA training — `LAB/research/R3-tooling.md` §4.5.
  - Duplicates: Z-Image Turbo bf16 (12.31) vs Q8 (7.22); klein 4B bf16 (7.75) vs Q8 (4.30) — the bf16 klein file was slower than Q8 at baseline flags (97 s vs 80 s warm) — `LAB/gpu/AB-NOTES.md`.
  - Qwen-Edit 2509 Lightning LoRAs (2 × 0.85 = 1.7 GB), superseded by the installed 2511 Lightning LoRA — `LAB/research/R3-tooling.md` §2.
  - Qwen-Image-Edit stack (16.85 + 8.10 + 1.35 + 0.25 + LoRAs) ≈ 27–29 GB: memory-critical (28 GB with one image), 2 runs in the lab. Note the Qwen2.5-VL files double as a possible VLM (§9).

### Inferences
- Without touching models the pipeline needs, ~30 GB could be reclaimed from ComfyUI alone (klein 9B stack 18.7 + SDXL stack 10.5 + 2509 LoRAs 1.7), and ~20 GB more if one Z-Image Turbo and one klein 4B variant are dropped. That is the owner's call; nothing was deleted.
- Bigger non-model wins exist outside the model directories: the npm cache (24 GiB), Docker's VM disk (152 GiB allocated; reclaimable only via Docker's own prune/resize), old agent worktrees (24 GiB) and the lab's SVGThinker GGUF (4.4 GB, never run).

### Gaps
- `docker system df` was not run, so I don't know how much of Docker's 152 GiB is reclaimable.
- I did not check APFS snapshots or purgeable space, which can make "free" differ from `df`.

## 12. Conclusion: what's ready today, what would need installing, and a disk budget

### Takeaway
**Ready today, zero downloads:** ComfyUI 0.28 with klein 4B, Z-Image Turbo (+ControlNet) and Qwen-Image-Edit (all Apache-2.0), plus BiRefNet and layerdiffuse cut-outs. Also Blender 5.2.2, Playwright + Chrome, ffmpeg, ImageMagick, rsvg-convert, cwebp/avifenc, Rubik fonts, the badge art and its toolkit, and the lab's ComfyUI client and QA tooling (local, uncommitted). **Needs installing only if wanted:** nothing is strictly required. Optional: Inkscape/resvg/svgo for SVG work, a VLM runtime path (llama.cpp is present; a model only if the Qwen2.5-VL route fails), extra display fonts, and possibly newer permissive models (LongCat-Image-Edit-Turbo ~6.7 GB, ERNIE-Image ~8.7 GB + encoder). **Disk budget:** keep new generative downloads ≤ ~15–20 GB, and prune the non-commercial/unused ~30 GB first if more is needed.

### Cited Findings
- Server start command and model locations: see §8 (`SP/docs/design-system/badge-generation-comfyui.md`).
- Commercial-safe vs blocked models: `LAB/research/R3-tooling.md` §1.
- New candidate sizes: LongCat-Image-Edit-Turbo "GGUF Q8 6.73 GB … TE = Qwen2.5-VL-7B (already installed Q8)"; ERNIE-Image "GGUF Q8 8.7 GB (unsloth) + Ministral-3-3B TE", "design / poster / text-heavy layouts" — `LAB/research/R3-tooling.md` §2.
- The lab's own download rule was "do not … download files > 2 GB — ask the orchestrator" — `LAB/PROTOCOL.md`.
- Free disk 82 GiB — check (§11). The July setup assumed "disk is not [the constraint] — 300+ GB free" — `SP/docs/design-system/badge-generation-comfyui.md` §Context. That is no longer true.

### Inferences
- **Suggested disk budget (82 GiB free):** keep at least ~30–40 GiB free for macOS swap (the lab saw 22.8 GB of swap at peak), Docker growth and render outputs. That leaves ~15–20 GB for any new generative assets. A newer editor (LongCat ~6.7 GB, reusing the installed encoder) fits; a second large family does not unless the ~30 GB of unusable or unused ComfyUI files (§11) are pruned first.
- **Do not re-download** anything for: FLUX.2 klein 4B, Z-Image Turbo/Base, Qwen-Image-Edit-2511, SDXL, ControlNets, BiRefNet, Playwright Chromium, or Rubik. All are on disk.
- **The best default for Instagram visuals, given the lessons:** HTML/SVG templates (Rubik, brand tokens, badge art, real data) rendered by Playwright are the backbone. Generative images are optional, bounded slots: klein 4B (the lab's "closest to house art style") or Z-Image Turbo at ≤ 1024 px, 1–2 min per candidate, composited by code, gated by measured checks plus a Claude critique against a written rubric, and approved by the owner in a real feed preview. Puzzle pieces, text, numbers and logos are never generated.
- Before relying on local diffusion for scenes or backgrounds, run a small bake-off at Instagram aspect ratios. The badge lab tested only icon/badge scale, and the owner rejected the one prior social-card art.

### Gaps
- Instagram-specific quality of local models (full scenes, 4:5 or 9:16 compositions, photo edits) is untested on this machine.
- Whether the owner is willing to prune klein 9B, SDXL or Docker data is unknown.
- Whether the comfyui MCP server (configured for 127.0.0.1:8000) can start and stop ComfyUI on demand for the pipeline was not tested (read-only constraint).
