# Standing feedback: the owner's rules for every post

The owner's feedback that applies beyond one post, distilled into rules. **Every new draft and every revision reads
this file first and applies all of it** (the `ig-draft` and `msp-captions` skills do so). After every review round,
rules that should hold for future posts are added here. One-off fixes stay in the draft's `feedback.jsonl`.

How to maintain it:
- Add a rule when the owner says something general ("always", "never", "in general", "for all posts") or gives the
  same note on two drafts; when unsure whether a note is general, ask the owner once and record the answer.
- Each rule: the rule in one line, then `(source, date)`. Newest rules at the top of their section. When a rule changes,
  edit it and note the change; don't keep contradicting rules.
- Detailed decisions live in `docs/decisions.md`; this file is the short, practical checklist. No member names here.

## Design

- **House style = H4** (`HOUSE` = `VARIANTS.H4` in `src/design/house.ts`, DL4): the first (title) slide of a post is an H2
  two-piece puzzle poster; every other slide is the H1 navy board. (owner, 2026-10-17)
- **Data + visualisation together** is what works best: posts carry charts, boards, box images or illustrations so
  they're never just text; pair every key number with a visual. (owner, 2026-10-17)
- **Few colours:** white titles, one grey for text, purple (indigo-300 on navy, indigo-800 on coral/sky) for kickers,
  board headers and labels as in H1, coral only for highlights; nothing beyond that. (owner, 2026-10-17; first said
  "no blue/purple text", then reverted: "put the purple back, I said never use too many colours")
- **One navy: deep navy #222a38** on every slide (poster bottoms and navy Story chapters too), never two navies side
  by side. (owner, 2026-10-17, K1 option B)
- **Poster seam: the original cut** (grid4: 4 generator pieces, knobs as they fall). (owner, 2026-10-17, K1-9)
- **No green** in the house style. (owner, 2026-10-17)
- **Poster colour by type of post:** data desk and atlas sky, the week indigo, milestones, events, funny facts and
  timely stories coral, puzzles ocean. (owner, 2026-10-17)
- **Branding notable:** myspeedpuzzling.com in bold in every footer source line; outlined logo 112 px. (owner, 2026-10-16)
- **No AI-looking illustration** (no cute outlined clip art, pastel washes, blush, glints); build art from real
  generator pieces and box images, flat poster shapes or type. (owner, 2026-10-14)
- **No cream, beige, pastel or yellow grounds; white only with depth; purple never the main colour.** (owner, 2026-10-14)
- **Puzzle pieces only from the generator** (crisp, geometrically correct). (owner, 2026-10-12)
- **Consistency across the grid matters**; the owner's own photo posts are mixed in. (owner, 2026-10-14)

## Data

- **Exclude suspicious results everywhere**, including stopwatch sessions whose result is suspicious; enforced by
  `src/data/queries.test.ts`. (owner, 2026-10-17)
- **Exclude private profiles from everything, aggregates included.** Ranking opt-outs out of anything that names or
  ranks players; respect `content/do-not-feature.json`. (owner, 2026-10-13)
- **Fresh data for every post:** query `--fresh` on the day it's finalised; nothing older than 24 h is published.
  (owner, 2026-10-13)
- **No traffic numbers** (signed-in counts, website traffic); solve-based numbers only. (owner, 2026-10-13)

## Captions and voice

- **Tone: a friendly speed-puzzling community, heavily data-driven.** A fellow puzzler who loves the numbers: the
  number first, then what it means for a normal puzzler, then one honest question. Warm, a little nerdy, gently funny,
  never hype. Full playbook: §9 of `research_notes/MSP Instagram design and growth toolkit/captions_voice_hashtags.md`.
  (owner, 2026-10-17)
- **Claude proposes the caption and alt text with every draft; the owner fine-tunes them in the review app.** Owner
  edits are saved as `author: human` and never overwritten; patterns in those edits become rules here. (owner, 2026-10-17)
- **0–3 functional emoji per caption.** (owner, 2026-10-13)
- **No AI disclosure statement.** (owner, 2026-10-13)

## Formats

- **Reels:** no logo intro; by default no outro (it breaks the loop); optionally the 0.6 s loop-back sting.
  Decision on logo motion is open (LM1). (research 2026-10-16, owner to confirm)
- **Box images:** credit the brand on every slide that shows one; quiz clues say "Mystery puzzle · Brand". No player
  photos. (owner, 2026-10-13)
