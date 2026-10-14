# Status and handoff

**Start here in every new Claude Code session.** Then read `docs/decisions.md` (owner decisions; they override
everything else) and `docs/backlog.md` (what to do next). Updated 2026-10-14.

## Where we are

Phase: **research and prototypes, waiting for the owner's visual feedback.** Nothing has been published yet.
The infrastructure (data, rendering, QA, review app, publisher, insights, AI batch) is built and tested; the house
look and the first series are not chosen yet.

| Area | State |
|---|---|
| Research | Two reports in `reports/`, 16 research notes in `research_notes/`, idea bank `docs/ideas/brainstorm-2026-10.md` (48 ideas; owner approved atlas, cats vs dogs, tier list, museum, timely stories as ideas) |
| Data | Read-only production queries in `queries/*.sql` (54), cached in `content/cache/`; every query excludes private profiles |
| Rendering | HTML/CSS/SVG → Playwright → 1440×1800 JPEG (q93 4:4:4 sRGB) + Instagram-simulated preview; in-page QA lint |
| Puzzle pieces | `src/pieces/jigsaw.ts` generator (interlocking by construction, tested) — the only allowed source of pieces |
| Labs (local galleries) | DL1 styles (9 looks × 9 post types, 184 slides), DL2 creative formats (box walls, mosaic, puzzle of the week, quizzes, cartoons, Reels), DL3 idea prototypes (atlas, cats vs dogs, tier list, museum/AI scenes, timely stories), AI1 overnight images (94) |
| Review app | `node tools/review.ts` → http://127.0.0.1:4173/review — drafts with feed/grid mock, caption lint, data freshness, approve/schedule/request changes/reject; lab galleries with Works/Unsure/No-go per slide |
| Publishing | `src/publish/publish.ts`: single images and carousels via Instagram Login API + Cloudflare R2 (tested end to end with a test image; no real post yet). Reels/Stories publishing not implemented |
| Insights | `node tools/insights.ts` → `content/state.sqlite` (71 historical posts backfilled) |
| Motion | HyperFrames 0.8.152 (pinned devDependency), deterministic Reels in `lab/dl2/reels/` |
| AI images | Overnight batch runner `tools/ai-batch.ts` (calm-gated, watchdog, resource log); AI1 done 2026-10-14: Z-Image 36, klein 4B 34, klein 9B 24 images, 0 failures; Qwen relight skipped (needs > 32 GB free) |
| Token | Instagram token valid until **2026-12-12** (`node tools/ig-token.ts status`; refresh with `refresh`) |
| Repo | Local git only — **no GitHub remote yet** (see backlog) |

## Waiting for the owner

1. Visual feedback in the labs (per slide: Works / Unsure / No-go, or codes in chat like "D4-3 love it, D8 no-go"):
   - DL1 styles http://127.0.0.1:4173/content/labs/DL1/
   - DL2 creative formats http://127.0.0.1:4173/content/labs/DL2/
   - DL3 idea prototypes (visuals) http://127.0.0.1:4173/content/labs/DL3/
   - AI1 images http://127.0.0.1:4173/content/labs/AI1/ (summary: `content/labs/AI1/SUMMARY.md`)
   Feedback lands in `content/labs/<LAB>/feedback.jsonl` (local). Read it before proposing anything visual.
2. Small open questions are listed at the end of `docs/backlog.md`.

## Next steps (in order)

1. **Read the owner's lab feedback** → build 2–3 refined combinations (main look + formats for milestones, events,
   Stories, quizzes; AI only where it won) as a mock profile grid of the next 3–4 weeks → owner picks the house system.
2. **Productise the chosen series** (see backlog "Build"): parametric post builders in `src/posts/` that take fresh
   query results and produce a draft folder; promote the chosen lab code into them.
3. **First real posts** with fresh data on the day (see `content/ideas/backlog.md` locally and the slate in
   `docs/ideas/brainstorm-2026-10.md`): Weekly Numbers ep. 1 (Mon), Wisconsin championship preview (Wed 21 Oct),
   clocks go back (Sat 24 Oct), Halloween (shelf of fear / cartoon, 31 Oct), 75 years (~3 Nov).
4. **Learning loop**: insights pulls on a schedule, weekly review with the `ig-insights` skill.

## How the pieces fit

```
queries/*.sql ──src/data/db.ts (ssh, read-only, cached)──► content/cache/*.json
                                         │                  src/data/boxes.ts → content/cache/boxes/ (box images)
lab/<lab>/content.ts + directions/*.ts ──lab/dl1/run.ts (LAB=dl1|dl2|dl3)──► content/labs/<LAB>/ + gallery
src/design (tokens, page, svg) + src/pieces/jigsaw.ts + src/render (render, qa, meter, server)
content/drafts/<id>/ (draft.yaml, slides/, facts.json, feedback.jsonl) ──src/review/app.ts──► owner decides
src/publish/publish.ts (preflight, R2, containers, publish log) ──► Instagram ──tools/insights.ts──► content/state.sqlite
tools/ai-batch.ts + lab/ai1/ (ComfyUI headless, calm check) ──► content/labs/AI1/
```

Commands are in `README.md` and `docs/runbook.md`. Claude Code workflows are project skills in `.claude/skills/`
(`ig-plan`, `ig-draft`, `ig-insights`, `msp-captions`).

## Local-only material (gitignored, not in the repo)

- `content/ideas/backlog.md` — idea backlog incl. anything player-specific.
- `content/labs/*` — all lab renders, feedback, AI images, run logs.
- `content/drafts/*`, `content/state.sqlite`, `content/cache/*`, `content/do-not-feature.json`, `content/.review-token`.
- `.env` (secrets + local paths), `CLAUDE.local.md` (production access), `.secret-patterns` (hook literals).
