# DL4 · Reels in the house style

The DL2 HyperFrames Reels re-skinned into the house system (`src/design/house.ts`), plus a new feature-reveal Reel,
each rendered once per house variant (H1, H2, H3). Silent: every word is burned in, and there's a silent AAC track
because the API spec expects one. Music comes later.

Owner feedback (DL2 F4): fill the **whole** 9:16 frame. The DL2 wall and sep Reels left about 385 px empty under
the content. Here text stays in the Reel safe area (x 60–960, y 220–1250, `FRAMES.reel`), and the area below is
filled with graphics: bars standing on the bottom edge, a full-bleed jigsaw, the level ring and a piece floor. The
frame reads full in the 9:16 player, the 4:5 feed crop (y 285–1635) and the 3:4 profile grid crop (y 240–1680),
from the first frame to the last. Bars that haven't grown yet and grid slots that are still empty are drawn as
"ghosts" in the ground's band colour.

## The Reels

| Reel | Length | Beats |
|---|---|---|
| `reel-wall` | 12 s | 0–3.6 s: hook "When do most 500s finish?". The histogram builds left to right from the bottom edge, full bleed, over its ghost silhouette. 3.9 s: 55–59 min turn hot and "58 minutes" replaces the hook. 5.6 s: the wall drops at 60:00, the bars behind it flinch, and "−7.3% at the hour" lands. 8.9 s: "Which side of the wall is your PB?". 10.9 s: it unwinds to the opening frame for the loop. |
| `reel-sep` | 12 s | A countdown on an implied 120 BPM grid. Box lids (white mounts) flip in and land on beats 0.5 / 2.0 / 3.5 / 5.0 s, with the credit "Puzzle · Brand" plus solvers on screen exactly while each box is. The rank badge rolls like an odometer. Five solver bars stand on the bottom edge over ghost tracks and rise one per rank into a staircase; the current bar is cool. #1 lands at 6.5 s in the hot colour with a ring and a solver count-up. 11.25 s: back to the opening frame. |
| `reel-counter` | 8 s | Every piece logged counts up to the exact total while a 9×10 full-bleed jigsaw (y 800 to the bottom edge) assembles into its empty slots. The hot centre piece snaps in last at 4.6 s as the counter settles. 7.0 s: the puzzle lifts apart and the counter rewinds. |
| `reel-xp` (new) | 12 s | Feature reveal for XP and levels. 0–3.4 s: hook "XP and levels are here". A ring of 50 generator pieces (one per level) fills clockwise while the centre counts Level 1 → 50, then turns hot. The ring is the middle row of a 50×3 jigsaw mapped onto a circle, so every piece interlocks; the start/finish joint at 12 o'clock is the one straight cut. 3.95 s: "The Level 50 club", with how many puzzlers reached it. 5.9 s: the ring flies apart and 16 days of results grow from the bottom edge; the launch-day spike counts up, against a dashed typical-day line ("12 Oct 2026 · 2.6× a typical day"). 9.4 s: the ring returns empty with a "?" and the call to action "What level are you? Check your profile on myspeedpuzzling.com". 11.2 s: back to the hook. |

Every number comes from `lab/dl4/content.ts` (`c.dl1.wall`, `c.dl2.september`, `c.dl1.totals`, `c.dl1.xp`,
`c.dl1.feature`) and none is typed in. A real post re-queries with `--fresh` on the day.

## House style per variant

All variants use the masthead: the device and kicker on the left, the outlined logo on the right, the source line
under them, then a rule. They also share Rubik with tabular slashed-zero figures, colours only through the ground
tokens (`groundVars()` on `:root`, `HOUSE_CSS` inlined) and pieces only from `src/pieces/jigsaw.ts`.

- **H1 Race Clock refined:** navy. Bars and pieces in chart base/cool (indigo-300), and coral only for the hot marks:
  55–59 min, #1, the centre piece, Level 50 and the launch day. Device: one coral generator piece.
- **H2 Race Clock + Poster:** navy, plus one bold moment per Reel. A top piece of the bold ground, cut by the real
  jigsaw seam (`posterTopPath()`), drops over the frame. It carries its own copy of the masthead and the beat's text:
  wall's answer on coral (3.75–10.85 s), sep's #1 on sky (5.7–11.25 s), counter's settled total on indigo
  (4.35–6.95 s) and the Level 50 club on ocean (3.55–5.8 s). The poster's text fades in after the piece lands and
  out before it lifts, so no text ever slides out of the frame.
- **H3 Series colours:** the series ground (`SERIES_GROUND`): wall on navy (data), sep on ocean (puzzles), counter
  and xp on coral (milestones). The device is a `pieceStrip` that fills one piece per beat (4 / 5 / 2 / 4 pieces)
  and resets for the loop.

## Render

```sh
node lab/dl4/reels/render.ts                                    # all 4 Reels × H1–H3, one at a time
node lab/dl4/reels/render.ts reel-xp --variants H2              # one
node lab/dl4/reels/render.ts --qa-only                          # lint + QA + covers + post.json, no video (~0.5 s each)
node lab/dl4/reels/render.ts reel-sep --qa-only --snap=/tmp/f   # also save a JPEG at every QA sample time
node lab/dl4/run.ts --gallery                                   # then rebuild the DL4 manifests + gallery
```

The pipeline is the DL2 one (`lab/dl2/reels/README.md`, including its safety notes: telemetry off, Playwright's
headless shell, never run `hyperframes usage|publish|cloud|skills|open`):

1. Build the project in `var/render/reels-dl4/<H#>/<reel>/`.
2. Run `hyperframes lint`.
3. Run Playwright QA (`qaInPage`) at 7–10 sample times per Reel, then take the cover.
4. Run `hyperframes render` (1 worker, software GPU, CRF 8).
5. Normalise with ffmpeg: H.264 High, yuv420p, 30 fps, 10 Mbps VBR, closed 2 s GOP, silent AAC 48 kHz, faststart.
6. Check the result with ffprobe.

A Reel with QA errors gets no video. Render and normalise are metered (`metered()`) into
`content/labs/DL4/runs.jsonl`.

Outputs go to `content/labs/DL4/<H#>/<reel>/`: `<reel>.mp4`, the cover `<reel>.jpg` (sRGB, q93, 4:4:4),
`<reel>.ig.jpg` and `post.json` (family `reels`, one slide with `frame: 'reel'` and `video`).

## Measured (16 Oct 2026, `content/labs/DL4/runs.jsonl`, final renders)

Machine: M3 Max, 36 GB. Memory pressure 1 (normal) throughout, 83–84 % free, swap steady at 1.08 GB, Docker off,
other DL4 agents active. Renders ran one at a time with 1 HyperFrames worker and the software GPU.

| Reel | Length | HyperFrames render (H1 / H2 / H3) | HF peak RSS | Normalise | Whole run (render + normalise + probe) | Run peak RSS | Final MP4 |
|---|---|---|---|---|---|---|---|
| reel-wall | 12 s, 360 frames | 15.1 / 15.5 / 15.3 s | 1.50–1.53 GB | 8–9 s | 24 s | 1.95 GB | 3.6–3.7 MB, ~2.4 Mbps |
| reel-sep | 12 s, 360 frames | 20.2 / 20.0 / 20.2 s | 1.55–1.57 GB | 21 s | 42 s | 2.0 GB | 15.2–15.3 MB, ~10.2 Mbps |
| reel-counter | 8 s, 240 frames | 13.0 / 13.1 / 13.1 s | 1.51–1.54 GB | 11–12 s | 24–25 s | 2.0 GB | 8.2–8.7 MB, ~8.5 Mbps |
| reel-xp | 12 s, 360 frames | 16.4 / 16.4 / 16.5 s | 1.55–1.57 GB | 13.5 s | 30 s | 2.0 GB | 9.2–10.2 MB, ~6.4 Mbps |

- Capture is screenshot-based at 39–53 ms per frame. Lint + QA + cover take 0.2–0.6 s per Reel.
- All 12 renders took about 6 minutes in total.
- **QA:** `qaInPage` reports 0 errors and 0 warnings for every Reel in every variant, at 7–10 sample times each,
  covering every beat and the loop points. `hyperframes lint` is clean.
- **Spec:** the ffprobe check passes for all 12: H.264 High, yuv420p, 1080×1920, 30/1 fps, exact durations, AAC
  48 kHz, moov before mdat.
- **By eye:** I checked the covers, the QA-time frames and frames extracted from the MP4s at every beat, plus the
  4:5 and 3:4 crops of the covers. The frame is full at every beat, nothing is cut, and the masthead sits below
  y 285, so the feed crop keeps it whole.
- An earlier render pass (masthead at y 228, which the 4:5 crop cut through) is also logged in `runs.jsonl`. Its
  numbers are the same within about 1 s.

## Notes and open points

- The H2 poster carries a second copy of the logo as `assets/logo-poster.svg`, because HyperFrames lints two
  identical `<img>` entries as a media risk.
- The XP ring's 50 pieces are one per level. Level 50 is `c.dl1.xp.level`, the top level.
- The typical-day line in the XP spike beat has no label, because text can't sit at its height (y ≈ 1480, below
  the safe area). The text above it says "2.6× a typical day".
- Reels publishing isn't implemented yet (`src/publish/` handles images and carousels only).
