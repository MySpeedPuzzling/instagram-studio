# AD1 · Advent of Puzzle lab

Visual prototypes for the Advent of Puzzle campaign (4 weeks × 6 doors + a Sunday draw, Dec 2026), in the H4 house
style. Design: `docs/ideas/advent-of-puzzle.md`. Gallery with per-slide Works / Unsure / No-go:
`node tools/review.ts` → http://127.0.0.1:4173/content/labs/AD1/ (feedback → `content/labs/AD1/feedback.jsonl`).

```sh
node lab/advent/run.ts                 # everything (≈ 56 slides) + gallery
node lab/advent/run.ts --only doors-V2 # posts whose key starts with this
node lab/advent/run.ts --gallery       # gallery only
node tools/contact-sheet.ts out.jpg --cols 6 content/labs/AD1/doors-V*/*.ig.jpg
```

| File | What |
|---|---|
| `content.ts` | Six sample doors (week 2, days 7–12) from cached queries: which-is-faster (`boxes-alltime-top`), guess-the-puzzle crop, higher-or-lower (`boxes-subject-speed`), guess-the-number (`bs-yearly-speed`), the missing piece (generator cut over a box), match-the-country (`boxes-country-signatures`); the V3 mystery box |
| `parts.ts` | Letter pieces (A/B/C on generator pieces), the reply cue, fine print, the 6×4 Advent jigsaw (calendar / picture reveal), quiz stages (large / compact), sticker zones |
| `doors.ts` | The four door variants and the answer reveal |
| `campaign.ts` | Announcement (carousel + countdown Story + guide), Sunday draw (winner Story + link guide + recap carousel), device sheets, the 300M guess, the Close Friends test Story |
| `run.ts`, `gallery.ts` | Renderer (metered: `content/labs/AD1/runs.jsonl`) and gallery (doors compared, profile grid of one Advent week, Story tray, every slide coded AD1-n) |

## Door variants

- **V1 Door poster:** the H4 poster on every door; coral top piece with the door number ("7 of 24") and the date, the quiz
  on the navy bottom piece. Loudest in the Story tray.
- **V2 Calendar board (Claude's pick):** H1 navy board with the 24-piece Advent jigsaw (rows = weeks, columns = Mon–Sat),
  tonight's piece coral; question and compact options below. Reads as a calendar, shows progress, leaves enough room.
- **V3 Picture reveal:** the same jigsaw over a mystery box; each opened door reveals one piece; day 24 asks which puzzle
  it is. Strongest come-back hook; least room for the quiz.
- **V4 Box-led:** the clue at full width, the day only in the header index ("7 / 24"). Closest to the published quiz post.

Every door: no sticker; "Reply to this Story: A, B or C" cue + "Text only. Your first answer counts."; footer
"Day N of 24 · Free · 18+ · answers until 19:00 CET tomorrow"; "Rules: link in bio" and, on Monday doors only, the
week's draw-seed fingerprint (placeholder hex in the lab).

**Placeholders:** seed fingerprints and hashes, `@winner_handle`, `@handle_placeholder`, ticket counts, every "share
right" %, the prize line, the 300M crossing date. Real doors re-query `--fresh` on the day; answer keys live in the
gitignored campaign store, never here (public repo).

## Proposals for `src/design/house.ts`

1. An `advent` (campaign) series in `SERIES_OF`/`POSTER_GROUND` (coral) instead of registering keys at run time.
2. `frame()` masthead: apply `headGround` to the masthead's source line too (it sits on the poster top piece).
3. Promote `letterPiece()` (answer letters on generator pieces) and `adventGrid()` (an n×m progress jigsaw with done /
   now / later states and an optional picture) as house devices.
4. A `replyCue()` component for every Story that asks for a DM reply (doors, the 300M guess).
5. `cover()` hero with a unit: `heroFit` ignores the unit's width ("1,284 tickets" needed `max: 220`).
