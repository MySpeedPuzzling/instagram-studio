# Status and handoff

**Start here in every new Claude Code session.** Then read `docs/decisions.md` (owner decisions; they override
everything else) and `docs/backlog.md` (what to do next). Updated 2026-10-16.

## Where we are

Phase: **research and prototypes; house system DL4 built (2026-10-16), waiting for the owner to pick a variant.**
Nothing has been published yet. The infrastructure (data, rendering, QA, review app, publisher, insights, AI batch)
is built and tested. DL4 renders all approved content in one house module with three variants (H1 Race Clock refined,
H2 Race Clock + Poster, H3 Series colours); IL1 (illustration lab, local AI) ran on 2026-10-16
(daytime, owner's go-ahead): 199/199 images, 0 failures, waiting for the owner's review. Brief: `docs/design/house-brief.md`.

| Area | State |
|---|---|
| Research | Two reports in `reports/`, 16 research notes in `research_notes/`, idea bank `docs/ideas/brainstorm-2026-10.md` (48 ideas; owner approved atlas, cats vs dogs, tier list, museum, timely stories as ideas) |
| Data | Read-only production queries in `queries/*.sql` (54), cached in `content/cache/`; every query excludes private profiles |
| Rendering | HTML/CSS/SVG → Playwright → 1440×1800 JPEG (q93 4:4:4 sRGB) + Instagram-simulated preview; in-page QA lint |
| Puzzle pieces | `src/pieces/jigsaw.ts` generator (interlocking by construction, tested) — the only allowed source of pieces |
| House system | `src/design/house.ts`: 7 contrast-checked grounds (navy, deep navy, coral, indigo, sky, ocean, white-with-depth), type scale, quiet header with one device, outlined logo (`assets/brand/speedpuzzling-logo-outline.svg`, built by `src/design/build-logo.ts`), chart tokens, hero numbers, `frame()`/`slide()`/`cover()`, variants H1–H3 |
| Labs (local galleries) | DL1 styles (9 looks × 9 post types, 184 slides), DL2 creative formats, DL3 idea prototypes, AI1 overnight images (94), **DL4 house system**: 36 posts × 3 variants (87 stills + 4 Reels each) + J1 funny-fact drawing approaches (12), all 0 QA errors (`lab/dl4/README.md`) |
| Review app | `node tools/review.ts` → http://127.0.0.1:4173/review — drafts with feed/grid mock, caption lint, data freshness, approve/schedule/request changes/reject; lab galleries with Works/Unsure/No-go per slide |
| Publishing | `src/publish/publish.ts`: single images and carousels via Instagram Login API + Cloudflare R2 (tested end to end with a test image; no real post yet). Reels/Stories publishing not implemented |
| Insights | `node tools/insights.ts` → `content/state.sqlite` (71 historical posts backfilled) |
| Motion | HyperFrames 0.8.152 (pinned devDependency), deterministic Reels in `lab/dl2/reels/` |
| AI images | Overnight runner `tools/ai-batch.ts --batch <file>` (calm-gated, watchdog, resource log; shared core `lab/ai/core.ts`); AI1 done 2026-10-14 (94 images); **IL1** (`lab/ai2/`, 6 illustration directions × 7 subjects) ran 2026-10-16 10:58–15:05: 199/199 images, 0 failures, all auto-checks pass, peak 20 GB (klein 9B) |
| Token | Instagram token valid until **2026-12-12** (`node tools/ig-token.ts status`; refresh with `refresh`) |
| Repo | Local git only — **no GitHub remote yet** (see backlog) |

## Waiting for the owner

1. **House style chosen in principle (2026-10-17): H4** = H2 poster as the first (title) slide + H1 navy board for
   the rest, two text colours, one navy, poster colour by post type. Still open, compared in DL4 **K1**: brand vs
   deep navy. Seam: the original cut (K1-9). Funny-facts posters: coral (no green).
2. Later (not now): Reels intro/outro and logo motion (LM1), illustration style (IL1, J1 funny-fact approaches).
3. Small questions at the end of `docs/backlog.md`.

## Next steps (in order)

1. **Owner settles the K1 choices** → make H4 the default in `src/design/house.ts` and fold the agents' house proposals (shared art palette per ground, `cover()` with art in every layout, family CSS
   hook, shared geometry/board helpers, `heroFitUnit`) into `src/design/house.ts`. Keep the other variants renderable
   (owner: keep every lab as a reference).
2. **IL1 review** (done generating), then a written illustration style guide + reference set (Instagram, possibly
   the MSP website).
3. **Productise the chosen series** (see backlog "Build"): parametric post builders in `src/posts/` on the house
   module that take fresh query results and produce a draft folder.
4. **First real posts** with fresh data on the day: Weekly Numbers ep. 1, Wisconsin championship preview (Fri 23 Oct),
   clocks go back (Sat 24 Oct), Halloween (31 Oct), 75 years (~3 Nov).
5. **Learning loop**: insights pulls on a schedule, weekly review with the `ig-insights` skill.

## Plan for the next working day

- Settle K1, then build the first real draft in H4 with fresh data and a proposed caption; fine-tune it in the
  review app (rules that should last go to `editorial/standing-feedback.md`).
- Review `content/labs/IL1/` with the owner (gallery + `SUMMARY.md`), pick candidates, draft the style guide.
- Apply the owner's DL4 verdict to the house module; start `src/posts/` builders for the first real posts.

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
