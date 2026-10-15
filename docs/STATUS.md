# Status and handoff

**Start here in every new Claude Code session.** Then read `docs/decisions.md` (owner decisions; they override
everything else) and `docs/backlog.md` (what to do next). Updated 2026-10-14.

## Where we are

Phase: **research and prototypes; first design feedback received (2026-10-14), house system round 2 (DL4) is next.**
Nothing has been published yet. The infrastructure (data, rendering, QA, review app, publisher, insights, AI batch)
is built and tested. The owner's verdict: D5 (navy, white type) is the favourite, D2 and D9 next; no white/pastel
grounds; content and concepts approved everywhere; Reels confirmed. Brief: `docs/design/house-brief.md`.

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

1. Feedback still open on DL3 visuals and AI1 images (ideas in DL3 are approved; DL1/DL2 feedback received).
   Feedback lands in `content/labs/<LAB>/feedback.jsonl` (local). Read it before proposing anything visual.
2. Small open questions are listed at the end of `docs/backlog.md`.

## Next steps (in order)

1. **DL4 house system** per `docs/design/house-brief.md`: first a shared house module (`src/design/house.ts`:
   grounds rotation, type scale, header/brand device, outlined logo, chart theme), then re-render the approved
   content (DL1 data posts, DL2 formats, DL3 ideas, restyled funny facts, Reels in full 9:16 + a feature-reveal Reel,
   D9-style Stories) in it, and show a mock profile grid of 3–4 weeks. Owner picks/adjusts.
2. **Productise the chosen series** (see backlog "Build"): parametric post builders in `src/posts/` that take fresh
   query results and produce a draft folder.
3. **First real posts** with fresh data on the day: Weekly Numbers ep. 1, Wisconsin championship preview
   (Wed 21 Oct), clocks go back (Sat 24 Oct), Halloween (31 Oct), 75 years (~3 Nov).
4. **Learning loop**: insights pulls on a schedule, weekly review with the `ig-insights` skill.

## Plan for the next working day

- **Daytime, any time (light, Docker can stay on):** build DL4 (house system + all approved content combined in it
  + mock profile grid). HTML/SVG renders and short Reels need no quiet hours.
- **Daytime prep for the night:** IL1 illustration lab: write the style directions and prompts, the scaffolds and
  the batch file (`lab/ai2/batch.ts`), generalise `tools/ai-batch.ts` to take it, validate workflows without
  generating (`--validate`, `--dry-run`).
- **Quiet hours (owner's go-ahead, Docker off, restart first):** run the IL1 batch overnight; review in the morning.

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

Engineer-facing overview of the image and Reel technologies (shareable page): https://claude.ai/code/artifact/b8f714e8-204e-42b4-9018-ba3beee7a52a

Commands are in `README.md` and `docs/runbook.md`. Claude Code workflows are project skills in `.claude/skills/`
(`ig-plan`, `ig-draft`, `ig-insights`, `msp-captions`).

## Local-only material (gitignored, not in the repo)

- `content/ideas/backlog.md` — idea backlog incl. anything player-specific.
- `content/labs/*` — all lab renders, feedback, AI images, run logs.
- `content/drafts/*`, `content/state.sqlite`, `content/cache/*`, `content/do-not-feature.json`, `content/.review-token`.
- `.env` (secrets + local paths), `CLAUDE.local.md` (production access), `.secret-patterns` (hook literals).
