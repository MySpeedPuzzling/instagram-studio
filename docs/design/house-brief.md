# House design brief (round 2, "DL4")

Written 2026-10-14 from the owner's feedback on DL1/DL2 (`docs/decisions.md`, section "visual direction from the
first lab round"; per-slide notes in `content/labs/{DL1,DL2}/feedback.jsonl`). Goal: **one recognisable MSP house
system** that every post type uses, so the profile grid looks consistent while content varies.

## Base

- **D5 Race Clock** is the backbone: navy ground, white type, crisp charts and timing boards, slashed-zero tabular
  times. Remove the small clock icon in the header. Add the brand purple as an accent.
- **D2 Poster Numbers** energy for covers, milestones and single big facts: bold colour grounds with one hero number
  (drop the D2-8 puzzle header).
- **D9 Chapter Recap** for Stories (D9-1, D9-5 = the reference), aligned to the same palette and type.

## Colour

- Grounds rotate through the brand palette, never cream/beige/pastel yellow and never plain white as the main look:
  navy `#2b3445` (default), coral `#ec726f`, indigo `#4e54c8`, sky `#69b3fe`, plus deep shades from the generated
  ramps (`assets/design/tokens.css`). If a light ground is needed (e.g. dense tables), give it depth: a same-hue
  gradient or a soft shadowed card, not flat white.
- Purple/indigo is an accent and a series colour, not the default for everything.
- Contrast stays WCAG AA (QA enforces it); coral carries large text only on navy.

## Brand device and logo

- One fixed brand device in a fixed position on every post (decide in the lab, e.g. a coral piece mark or a
  series tab); the header stays quiet (no icon clutter).
- Logo bigger than in DL1 (≈ 1.5×). On dark grounds use the **outlined logo**: the SVG mark with a white outline
  (code: SVG filter feMorphology dilate + white flood behind `assets/brand/speedpuzzling-logo.svg`; reference look:
  `assets/brand/email-logo.png`), never a white circle.

## Series and formats to show in the house style

All content is approved; only the design changes. Render each in the house system:
- Data: 59-minute wall carousel, record, countries, share, Level 50 / XP card, Weekly Numbers, event preview, XP
  launch day, monthly report (DL1 content).
- Image-led: September box wall, 1,000-puzzle mosaic (F1-6/7/8 are the favourites), weekly puzzle wall, event
  collage (owner photos later), puzzle of the week, guess the puzzle, which is faster (DL2 content).
- Ideas: puzzle atlas, cats vs dogs, subject tier list, museum of most-solved (AI gallery plates), timely stories
  (DL3 content).
- Funny facts (F3): keep the jokes; restyle the drawings so they don't read as AI clip art. Directions to try:
  compositions made of real generator pieces and box images (like F3-4/5/6, which work), bold flat graphic poster
  shapes with thick strokes and no pastel washes or blush cheeks, or type-led jokes.
- Reels: re-skin the three HyperFrames Reels into the house style and fill the whole 9:16 frame (no empty band);
  add a feature-reveal Reel (e.g. "XP and levels"); silent for now, music later.
- Stories: D9 chapters in the house palette.

## Review

Show the result as a mock profile grid of 3–4 weeks (mixed series + a placeholder for an owner photo post) plus
per-slide feedback in the gallery, then ask the owner to pick or adjust.
