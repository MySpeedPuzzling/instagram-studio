# DL4 · the MSP house system

Brief: `docs/design/house-brief.md`. Owner feedback that shaped it: `docs/decisions.md` (2026-10-14) and
`content/labs/{DL1,DL2,DL3}/feedback.jsonl` (local). Content is approved; only the design changes.

## Pieces

| File | What |
|---|---|
| `src/design/house.ts` | The house module: grounds + tokens, type scale, header/footer, outlined logo, brand devices, hero numbers, chart tokens, the three variants, `frame()`, `slide()`, `cover()` |
| `src/design/build-logo.ts` | Builds `assets/brand/speedpuzzling-logo-outline.svg` (vector mark + rounded white outline) |
| `lab/dl4/content.ts` | All DL1–DL3 content in one object (`c.dl1`, `c.dl2`, DL3 formats load their own queries) |
| `lab/dl4/posts/<family>.ts` | One content family each (data, formats, ideas, fun); `posts(c, variant)` returns posts for one variant |
| `lab/dl4/extra/*.ts` | Directions outside the variants (J1: funny-fact drawing approaches) |
| `lab/dl4/reels/` | HyperFrames Reels in the house style, per variant |
| `lab/dl4/run.ts` | Renders families × variants, one post.json per post, assembles manifests, rebuilds the gallery |
| `lab/dl4/gallery.ts` | Gallery: variant summaries, profile grids, side-by-side compares, per-slide Works / Unsure / No-go |

```sh
node lab/dl4/run.ts --family data                          # one family in H1, H2, H3
node lab/dl4/run.ts --family data --posts wall --variants H2
node lab/dl4/run.ts --extra J1
node lab/dl4/run.ts --gallery                              # manifests + gallery only
node tools/contact-sheet.ts out.jpg --cols 6 content/labs/DL4/H1/wall/*.ig.jpg
```

## The variants

All three use the same layouts; they differ in how a slide's ground is chosen, the header device and the cover
layout. A slide declares its **role** (cover, fact, data, image, quiz, story, reel) and its post's **series**
(`SERIES_OF` in house.ts); the variant picks the ground.

- **H1 Race Clock refined**: navy everywhere (covers deep navy), coral for #1/record marks, indigo-300 (our purple)
  as the accent; device = one coral generator piece; covers keep the D5 board layout (title + art).
- **H2 Race Clock + Poster**: data and image slides on navy; covers and single big facts are D2 two-piece posters,
  the top piece rotating coral → sky → indigo → ocean through the feed, joined by one real jigsaw cut to a deep-navy
  bottom.
- **H3 Series colours**: every slide of a series on its colour (data navy, the week indigo, milestones coral,
  puzzles ocean, atlas sky, fun white-with-depth); device = a strip of interlocking pieces that fills in through the
  carousel; covers hero-first (D9-1).

## Rules for every slide

- **Colours only through the ground tokens**: `var(--g-ink)`, `--g-soft`, `--g-accent`, `--g-hot` (large text only),
  `--g-hot-text` (small highlight), `--g-rule`, `--g-band`, `--c-base`, `--c-context`, `--c-hot`, `--c-cool`,
  `--g-device`. Never hard-code a text colour; box art, photos and white mounts are the only fixed colours.
- No cream, beige, pastel or yellow grounds. White only with depth (`paper` ground, or white `h-mount` cards with
  their one soft shadow on a dark ground). Purple is an accent, never the main colour.
- Every jigsaw piece comes from `src/pieces/jigsaw.ts` (or helpers built on it). Every box image carries its credit
  (`Puzzle · Brand`), quiz clues "Mystery puzzle · Brand". No player photos.
- Type ≥ 30 px (≥ 24 px only inside `data-qa-small`), digits tabular with slashed zeros (inherited), text inside the
  safe area, text over images/gradients sits on a solid panel with `data-qa-bg`.
- QA must report **0 errors** for every slide in all three variants; then check the contact sheet by eye.
- Numbers come from cached queries (`query(name)`); never typed into copy. Real posts re-query `--fresh` on the day.
