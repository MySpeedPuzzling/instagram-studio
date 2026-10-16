# Prompt for the next session (DL4 house-system prototypes)

Copy everything below the line into a fresh Claude Code session started in this repo.

---

Read `docs/STATUS.md`, `docs/decisions.md` (especially "visual direction from the first lab round"),
`docs/design/house-brief.md`, `docs/backlog.md`, and my per-slide feedback in
`content/labs/DL1/feedback.jsonl`, `content/labs/DL2/feedback.jsonl` and `content/labs/DL3/feedback.jsonl`.
Then build design lab **DL4: the MSP house system**, as prototypes for me to compare and comment on.

What I want to see:

1. **A shared house module first** (`src/design/house.ts` + tokens): grounds, type scale, quiet header with one fixed
   brand device (no clock icon), the outlined logo for dark grounds (vector mark with a white outline, like
   `assets/brand/email-logo.png`, about 1.5× bigger than in DL1), chart theme, slashed-zero tabular times.
2. **2–3 house variants built on it**, so I can compare, for example:
   - D5 Race Clock refined: navy-led, white type, our purple added as an accent;
   - D5 + D2: navy for data slides, bold brand-colour grounds (navy, coral, sky blue, indigo rotating) for covers,
     milestones and single big facts;
   - a series-colour system in the spirit of D9-1/D9-5, where each series owns one brand colour.
   No cream, beige, pastel or yellow grounds. Plain white only if it gets depth (gradient and/or shadows), and
   purple never as the primary colour for everything.
3. **All approved content combined into each variant** (content is approved, only the design changes): the DL1 data
   posts (59-minute wall, record, countries, share, Level 50 card, Weekly Numbers, Wisconsin preview, XP launch day,
   record September), the DL2 formats (September box wall, the 1,000-puzzle mosaic — F1-6/7/8 are my favourites —,
   weekly puzzle wall, event collage, puzzle of the week, guess the puzzle, which is faster) and the DL3 ideas
   (puzzle atlas, cats vs dogs, subject tier list, museum of most-solved with the AI gallery plates, timely stories).
4. **Funny facts (F3) restyled** so they don't give the "aha, AI-generated" feeling. Keep the jokes. F3-4/5/6
   (built from real puzzle pieces) already work; try other drawing approaches for the rest.
5. **Reels in the house style**: re-skin the three HyperFrames Reels so they fill the whole 9:16 frame (F4-1 and
   F4-2 looked square), and add a feature-reveal Reel (e.g. XP and levels). Silent for now.
6. **Stories** in the D9 chapter style, aligned to the same palette.
7. **A mock profile grid of 3–4 weeks** per variant (mixed series plus one placeholder for my own photo post), so I
   can judge the feed as a whole.

How to work:

- Drive it yourself; use parallel subagents where it helps (e.g. one per variant after the house module exists), and
  ask me only for real decisions, interactively, with a recommendation first.
- These are HTML/SVG renders and short Reels: they don't need quiet hours, Docker can stay on. Keep renders one at
  a time per agent and log resources as usual.
- Every slide passes QA with 0 errors; check contact sheets yourself before showing me anything.
- Gallery with per-slide codes and Works / Unsure / No-go buttons, linked from the review app
  (`node tools/review.ts`), plus a short summary of what each variant does differently.
- Lab content can use the cached data; anything that becomes a real post gets fresh data on the day.

Also prepare tonight's **illustration lab IL1** (`docs/design/house-brief.md`, last section): local models only,
AI allowed, goal is one refined illustration style and a short style guide (maybe for the MSP website too).
Generalise `tools/ai-batch.ts` to take a batch file (e.g. `lab/ai2/batch.ts`), write the style directions, prompts
and scaffolds, validate with `--validate` and `--dry-run` without generating anything, then ask me for the go-ahead
and tell me exactly what to do before bed.

At the end, update `docs/STATUS.md` and `docs/backlog.md`, and commit.
