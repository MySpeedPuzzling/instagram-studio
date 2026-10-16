# IL1: the illustration lab (one night, local models)

**Goal (owner, 2026-10-14):** find ONE refined, distinctive illustration style, with a short written style guide, for
Instagram and possibly the whole MSP website. It replaces the current website style (semi-flat outlined objects,
pastel two-stop washes, rounded strokes, originally made with ChatGPT), which reads as AI-generated. AI images are
allowed; **local models only**. Background: `docs/decisions.md` (2026-10-14), `docs/design/house-brief.md`
("Illustration lab").

The spec is data in `lab/ai2/batch.ts` (style specs, subjects, prompts, seeds, models); the I6 inputs are drawn by
`lab/ai2/scaffolds.ts`. The overnight runner is the same one AI1 used: `tools/ai-batch.ts --batch lab/ai2/batch.ts`.

## The six directions

Every direction gets the same seven subjects, so styles can be compared subject by subject. Each runs on the model
that should suit it (core, 3 seeds) and, if there is time, on a second model as a control (optional, 2 seeds).

| Dir. | Style | Why this one | Core model | Control | Images | Est. time |
|---|---|---|---|---|---|---|
| I1 | **Swiss poster**: flat geometric shapes, no outlines, coral ground | the furthest from the outlined look; poster energy like D2 Poster Numbers | Z-Image Turbo | klein 9B | 21 + 14 | 39 + 21 min |
| I2 | **Paper-cut collage**: hand-cut matte card, real layer shadows, indigo ground | hand-made, real depth; a craft that suits a puzzle hobby | Z-Image Turbo | klein 4B | 21 + 14 | 39 + 9 min |
| I3 | **Linocut, three inks**: carved lines, white/coral/sky on navy paper | human texture on the navy ground the owner likes (D5); forces simple shapes | klein 4B | klein 9B | 21 + 14 | 14 + 21 min |
| I4 | **Clay studio**: matte plasticine miniatures on a sky-blue paper sweep | 3D without gloss; sits naturally next to real puzzle photos | Z-Image Turbo | klein 4B | 21 + 14 | 39 + 9 min |
| I5 | **Risograph, two inks**: coral + indigo with overprint, grain, halftone | indie-print character with a tiny palette; the one white-paper direction (depth from grain) | klein 9B | klein 4B | 21 + 14 | 31 + 9 min |
| I6 | **Style lock over code scaffolds**: klein 4B edit turns a flat code layout into a screen print / cut paper | the only route for jokes made of pieces: every piece comes from the generator | klein 4B edit | – | 24 | 40 min |

Full style specs (palette, line, shading, texture, composition, what to avoid) are `STYLES` in `lab/ai2/batch.ts`; the
gallery shows them under each section.

**Subjects.** Four F3 jokes that need no pieces: minute 58 (the sprinting stopwatch), unboxed (the cat asleep on the
box lid), the balance (one big box = three small ones), Halloween (a sheet ghost rising from a box, uncarved pumpkins).
Three site-like spots: an achievement badge, an empty state ("no puzzles logged yet"), a feature hero ("XP and levels").
I6 instead gets the piece jokes (edges first, edges last, sorting the sky) and the three spots, drawn by code with
generator pieces (first slide of each I6 row).

**Rules for every direction** (owner feedback and the badge lab): no model-made text (code sets all type), no
puzzle-box art, no AI-drawn pieces, no people or hands, no faces on objects, animals without cute blush, no pastel
washes, gloss or sparkles, and not the "cute outlined icon" look. Z-Image runs at guidance 0 and klein at guidance 1,
so negative prompts do nothing: the prompts describe what *is* there ("one flat solid coral background", "nothing
written anywhere") instead of listing what to avoid.

**Licence.** Z-Image Turbo and klein 4B are Apache-2.0 (fine for posts and the website). klein 9B is FLUX
Non-Commercial: the owner allowed it for posts (2026-10-13), but it is **not cleared for the website**. That is why
every 9B direction has a 4B control and vice versa: a style meant for the site must hold on an Apache model.

## Budget

Window 22:30–06:00 (7 h 30 min). Planning times per 1024² image come from the AI1 night with this runner: Z-Image
100 s (planned 110), klein 4B 36 s (40), klein 9B 80 s (88); the 1-reference edit was only measured at 1024×1280 with
8 steps (184 s), so the 4-step 1024² edit is planned at 100 s until measured. Total **≈ 4 h 34 min for 199 images
(61 % of the window, 39 % margin)**: core 129 images ≈ 3 h 20 min, controls 70 images ≈ 1 h 10 min. The margin is
deliberately larger than 20 %: a calm gate that only passes at 23:30 still finishes, and the edit time is an estimate.

Order: klein 4B first (cheapest; I3, I6, then its controls), then Z-Image (I1, I2, I4), then klein 9B (I5, then its
controls). Core jobs go first; when time runs short the runner drops controls before any core image. Memory: one family
at a time, 17–20 GB footprint measured in AI1; the calm check wants 24–28 GB free.

## What the owner reviews in the morning

1. `node tools/ai-batch.ts --batch lab/ai2/batch.ts --status` and `content/labs/IL1/SUMMARY.md` (what ran, times,
   memory, auto-checks).
2. The gallery: `node tools/review.ts` → http://127.0.0.1:4173/content/labs/IL1/. Sections I1–I6, one row per subject
   and model. Before showing it, Claude pre-screens: contact sheets per direction (`tools/contact-sheet.ts`), flags
   glyphs, faces, wrong pieces and off-palette images, and proposes the best seed per subject.
3. **First a verdict per direction** (the box under each section: Works / Unsure / No-go + a line why), then
   Works / Unsure / No-go on single images only in the directions that survive. Codes like "I3-7" work in chat too.
4. The code-native counterparts are prototyped in DL4 **J1 "funny-fact drawing approaches"** (`lab/dl4/extra/`,
   `node lab/dl4/run.ts --extra J1`). Judge IL1 next to J1: the winner may be AI, code, or AI over a code layout (I6).

## How the output is judged

- **One style, many subjects:** in the best seed set, at least 5 of the 7 subjects look like one hand made them
  (same line, palette, texture, light). Consistency matters more than one great image.
- **Not generic AI clip art:** it reads as an art-directed, hand-made illustration; nothing of the outlined pastel look.
- **Brand:** the brand colours carry it (auto-check: mean ΔE2000 ≤ 10 after the brand-LUT snap), grounds from the
  palette, no pastel/cream.
- **Clean:** no glyphs, no faces on people or objects, no blush, no gloss; I6 keeps every generator piece outline.
- **Works small and big:** the joke reads on a phone at feed size, a spot still reads at ~160 px (site icon size).
- **Reproducible and licensed:** the style holds on more than one seed and, for the website, on an Apache model.
- The owner's "would post it" decides; the auto-checks only sort.

## From the result to a style guide and reference set

1. The owner picks one direction (or two finalists). If two, a short IL2 round (same runner, new batch file) refines
   them: more subjects, fixed seeds, prompt tuning, the losing model dropped.
2. Claude writes the **illustration style guide** (`docs/design/illustration-style.md`): palette and grounds, line,
   shading, texture, composition, what to avoid, the prompt template (lead + subject + body), model and settings, and
   how code adds type and generator pieces. It applies to Instagram and, if the owner wants, the MSP website.
3. Approved images become the **reference set**; at 20–30 approved images a style LoRA on an Apache base model
   (Z-Image or klein 4B) becomes possible (out of scope tonight).
4. The winner is shown in context: funny-fact posts in the DL4 house system and a mock website section.

## Commands

```sh
node lab/ai2/batch.ts                                   # job list per model family
node lab/ai2/scaffolds.ts                               # (re)draw the I6 scaffolds (light, HTML render)
node tools/ai-batch.ts --batch lab/ai2/batch.ts --dry-run      # plan, time budget, files, calm check
node tools/ai-batch.ts --batch lab/ai2/batch.ts --validate     # ComfyUI headless, no jobs: every graph vs /object_info
node tools/ai-batch.ts --batch lab/ai2/batch.ts --schedule --at 22:30   # one-night launchd agent (owner's go-ahead)
node tools/ai-batch.ts --batch lab/ai2/batch.ts --status
node tools/ai-batch.ts --batch lab/ai2/batch.ts --only I1,I6 --now   # a subset, now (still waits for calm)
node tools/ai-batch.ts --batch lab/ai2/batch.ts --gallery     # rebuild gallery + SUMMARY.md from what exists
node tools/ai-batch.ts --batch lab/ai2/batch.ts --unschedule
```

Output (local, gitignored): `content/labs/IL1/` (PNG + JSON sidecar per image, `runs.jsonl`, `batch.log`,
`comfyui.log`, `SUMMARY.md`, gallery `index.html`, `scaffolds/`).
