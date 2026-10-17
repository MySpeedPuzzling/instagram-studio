# Status and handoff

**Start here in every new Claude Code session.** Then read `docs/decisions.md` (owner decisions; they override
everything else), `editorial/standing-feedback.md` (the owner's standing rules for every post, Reel and Story) and
`docs/backlog.md` (what to do next). Updated 2026-10-17.

## Where we are

Phase: **live.** The first pipeline post went out on **Sat 17 Oct 2026**: "Which is faster? The postcard trio"
(https://www.instagram.com/p/Del3tI6jfM0/), a 4-slide carousel in the house style with fresh data, a Ravensburger photo
tag and a poll Story follow-up. House style **H4** is decided (`HOUSE` in `src/design/house.ts`). Labs DL1–DL4, LM1
(logo motion), IL1 (illustrations) stay local as reference. Growth strategy researched, rhythm to be confirmed.

| Area | State |
|---|---|
| Research | Two reports in `reports/`, 16 research notes in `research_notes/`, idea bank `docs/ideas/brainstorm-2026-10.md` (48 ideas; owner approved atlas, cats vs dogs, tier list, museum, timely stories as ideas) |
| Data | Read-only production queries in `queries/*.sql` (54), cached in `content/cache/`; every query excludes private profiles |
| Rendering | HTML/CSS/SVG → Playwright → 1440×1800 JPEG (q93 4:4:4 sRGB) + Instagram-simulated preview; in-page QA lint |
| Puzzle pieces | `src/pieces/jigsaw.ts` generator (interlocking by construction, tested) — the only allowed source of pieces |
| House system | `src/design/house.ts`: 7 contrast-checked grounds (navy, deep navy, coral, indigo, sky, ocean, white-with-depth), type scale, quiet header with one device, outlined logo (`assets/brand/speedpuzzling-logo-outline.svg`, built by `src/design/build-logo.ts`), chart tokens, hero numbers, `frame()`/`slide()`/`cover()`, variants H1–H3 |
| Labs (local galleries) | DL1 styles (9 looks × 9 post types, 184 slides), DL2 creative formats, DL3 idea prototypes, AI1 overnight images (94), **DL4 house system**: 36 posts × 3 variants (87 stills + 4 Reels each) + J1 funny-fact drawing approaches (12), all 0 QA errors (`lab/dl4/README.md`) |
| Review app | `node tools/review.ts` → http://127.0.0.1:4173/review — drafts with feed/grid mock, caption lint, data freshness, approve/schedule/request changes/reject; lab galleries with Works/Unsure/No-go per slide |
| Drafting | `node tools/draft.ts <builder>`: fresh queries → `facts.json` → slides in HOUSE (QA gate) → caption + alt text → draft `in_review`; Story follow-up frames in `stories/`. Builders in `src/posts/` (first: `faster.ts`, "Which is faster?") |
| Publishing | `src/publish/publish.ts`: single images and carousels via Instagram Login API + Cloudflare R2, photo tags (`user_tags`), retry on Instagram's transient "Media ID is not available"; **first real post 2026-10-17**. Stories are posted by hand (stickers); Reels publishing not implemented |
| Insights | `node tools/insights.ts` → `content/state.sqlite` (71 historical posts backfilled) |
| Motion | HyperFrames 0.8.152 (pinned devDependency): Reels in the house style (`lab/dl4/reels/`), logo motion modules and chains (`lab/logo/`, LM1) |
| AI images | Overnight runner `tools/ai-batch.ts --batch <file>` (calm-gated, watchdog, resource log; shared core `lab/ai/core.ts`); AI1 done 2026-10-14 (94 images); **IL1** (`lab/ai2/`, 6 illustration directions × 7 subjects) ran 2026-10-16 10:58–15:05: 199/199 images, 0 failures, all auto-checks pass, peak 20 GB (klein 9B) |
| Token | Instagram token valid until **2026-12-12** (`node tools/ig-token.ts status`; refresh with `refresh`) |
| Repo | Local git only — **no GitHub remote yet** (see backlog) |

## Waiting for the owner

1. **Story test (next session):** post `content/labs/STORY-TEST/story-test-v1.jpg` to Close Friends, screenshot it in
   the viewer (iPhone, Android if possible) and with a default-size 3-option poll; Claude reads the ruler and fixes the
   Story bands (`research_notes/…/story_dimensions_2026.md`).
2. **Confirm the weekly rhythm** (research `growth_strategy_2026.md`): Mon 19:00 Weekly Numbers, Wed/Thu 19:00 data
   story, a rotating 4th slot, Sat ~10:00 community post (+ weekend Stories); 4 posts/week incl. the owner's, 5 after
   a clean 4-week block.
3. Sunday 18 Oct: post the answer Story for the postcard quiz (`content/drafts/2026-10-17-faster-postcards/stories/story-2.jpg`
   + link sticker to the post).
4. Later: Reels intro/outro (LM1), illustration style (IL1, J1). Small questions at the end of `docs/backlog.md`.

## Next steps (in order)

1. **Story device test** → final Story bands.
2. **Weekly Numbers builder** (`src/posts/weekly.ts`) for Monday 19 Oct, then the Wisconsin preview (event Fri 23 Oct)
   and clocks go back (Sat 24 Oct). Each new post type becomes a builder in `src/posts/` + an entry in `tools/draft.ts`.
3. **Insights on the first post** after 48 h (`node tools/insights.ts`), first entry in `editorial/learnings.md`.
4. **Fold the agents' house proposals into H4** (shared art palette per ground, family CSS hook, shared geometry/board
   helpers, `heroFitUnit`); keep H1–H3 renderable (owner: keep every lab as reference).
5. Puzzle subjects from box images (cats vs dogs), weekend challenge format, IL1 style guide, Reels publishing.

## Plan for the next working day

- Story test with the owner; apply the measured bands.
- Confirm the rhythm; draft Weekly Numbers ep. 1 with fresh data for Monday 19:00.

## How the pieces fit

```
queries/*.sql ──src/data/db.ts (ssh, read-only, cached)──► content/cache/*.json
                                         │                  src/data/boxes.ts → content/cache/boxes/ (box images)
lab/<lab>/content.ts + directions/*.ts ──lab/dl1/run.ts (LAB=dl1|dl2|dl3)──► content/labs/<LAB>/ + gallery
src/design/house.ts (variants) + lab/dl4/posts/*.ts ──lab/dl4/run.ts──► content/labs/DL4/<H#>/<post>/ + gallery; lab/dl4/reels/ (HyperFrames)
src/design (tokens, page, svg, house) + src/pieces/jigsaw.ts + src/render (render, qa, meter, server)
content/drafts/<id>/ (draft.yaml, slides/, facts.json, feedback.jsonl) ──src/review/app.ts──► owner decides
src/publish/publish.ts (preflight, R2, containers, publish log) ──► Instagram ──tools/insights.ts──► content/state.sqlite
tools/ai-batch.ts --batch lab/ai{1,2}/batch.ts + lab/ai/core.ts (ComfyUI headless, calm check) ──► content/labs/{AI1,IL1}/
```

Engineer-facing overview of the image and Reel technologies (shareable page): https://claude.ai/code/artifact/b8f714e8-204e-42b4-9018-ba3beee7a52a

Commands are in `README.md` and `docs/runbook.md`. Claude Code workflows are project skills in `.claude/skills/`
(`ig-plan`, `ig-draft`, `ig-insights`, `msp-captions`).

## Local-only material (gitignored, not in the repo)

- `content/ideas/backlog.md` — idea backlog incl. anything player-specific.
- `content/labs/*` — all lab renders, feedback, AI images, run logs.
- `content/drafts/*`, `content/state.sqlite`, `content/cache/*`, `content/do-not-feature.json`, `content/.review-token`.
- `.env` (secrets + local paths), `CLAUDE.local.md` (production access), `.secret-patterns` (hook literals).
