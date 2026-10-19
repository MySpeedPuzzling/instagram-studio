# Status and handoff

**Start here in every new Claude Code session.** Then read `docs/decisions.md` (owner decisions; they override
everything else), `editorial/standing-feedback.md` (the owner's standing rules for every post, Reel and Story) and
`docs/backlog.md` (what to do next). Updated 2026-10-19 (Story title card; profile check 47 → 75, Start here post published and pinned, caption lint upgrades, audience notes).

## Where we are

Phase: **live.** The first pipeline post went out on **Sat 17 Oct 2026**: "Which is faster? The postcard trio"
(https://www.instagram.com/p/Del3tI6jfM0/), a 4-slide carousel in the house style with fresh data, a Ravensburger photo
tag and a poll Story follow-up. House style **H4** is decided (`HOUSE` in `src/design/house.ts`). Labs DL1–DL4, LM1
(logo motion), IL1 (illustrations) stay local as reference. Growth strategy researched, rhythm to be confirmed.
**Advent of Puzzle** (December campaign) researched, designed and prototyped overnight 17 Oct: decisions waiting in
`docs/advent-morning.md`.

| Area | State |
|---|---|
| Research | Two reports in `reports/`, 16 research notes in `research_notes/`, idea bank `docs/ideas/brainstorm-2026-10.md` (48 ideas; owner approved atlas, cats vs dogs, tier list, museum, timely stories as ideas) |
| Data | Read-only production queries in `queries/*.sql` (54), cached in `content/cache/`; every query excludes private profiles |
| Rendering | HTML/CSS/SVG → Playwright → 1440×1800 JPEG (q93 4:4:4 sRGB) + Instagram-simulated preview; in-page QA lint |
| Puzzle pieces | `src/pieces/jigsaw.ts` generator (interlocking by construction, tested) — the only allowed source of pieces |
| House system | `src/design/house.ts`: 7 contrast-checked grounds (navy, deep navy, coral, indigo, sky, ocean, white-with-depth), type scale, quiet header with one device, outlined logo (`assets/brand/speedpuzzling-logo-outline.svg`, built by `src/design/build-logo.ts`), chart tokens, hero numbers, `frame()`/`slide()`/`cover()`, variants H1–H3 |
| Labs (local galleries) | DL1 styles (9 looks × 9 post types, 184 slides), DL2 creative formats, DL3 idea prototypes, AI1 overnight images (94), **DL4 house system**: 36 posts × 3 variants (87 stills + 4 Reels each) + J1 funny-fact drawing approaches (12), all 0 QA errors (`lab/dl4/README.md`) |
| Review app | `node tools/review.ts` → http://127.0.0.1:4173/review — drafts with feed/grid mock, caption lint, data freshness, approve/schedule/request changes/reject; lab galleries with Works/Unsure/No-go per slide |
| Drafting | `node tools/draft.ts <builder>`: fresh queries → `facts.json` → slides in HOUSE (QA gate) → caption + alt text → draft `in_review`; Story follow-up frames in `stories/`. Builders in `src/posts/` (first: `faster.ts`, "Which is faster?"); builders: `faster-postcards`, `about` (each declares `searchPhrases`) |
| Publishing | `src/publish/publish.ts`: single images and carousels via Instagram Login API + Cloudflare R2, photo tags (`user_tags`), retry on Instagram's transient "Media ID is not available"; **first real post 2026-10-17**. Stories are posted by hand (stickers); Reels publishing not implemented; posts published by hand are linked with `node tools/link-post.ts <draft-id>` |
| Insights | `node tools/insights.ts` → `content/state.sqlite` (71 historical posts backfilled) |
| Motion | HyperFrames 0.8.152 (pinned devDependency): Reels in the house style (`lab/dl4/reels/`), logo motion modules and chains (`lab/logo/`, LM1) |
| AI images | Overnight runner `tools/ai-batch.ts --batch <file>` (calm-gated, watchdog, resource log; shared core `lab/ai/core.ts`); AI1 done 2026-10-14 (94 images); **IL1** (`lab/ai2/`, 6 illustration directions × 7 subjects) ran 2026-10-16 10:58–15:05: 199/199 images, 0 failures, all auto-checks pass, peak 20 GB (klein 9B) |
| Token | Instagram token valid until **2026-12-12** (`node tools/ig-token.ts status`; refresh with `refresh`) |
| Campaigns | Advent of Puzzle: design `docs/ideas/advent-of-puzzle.md` (calendar, 24 doors, matching, seeded draw, rules draft, GDPR), evidence `research_notes/…/giveaways_and_advent_2026.md`, ideas `docs/ideas/giveaways-2026.md`; lab **AD1** (`lab/advent/`, 62 slides, 5 door variants incl. V5 festive); read-only automation `src/campaign/` + `tools/campaign.ts` (collect Story replies by DM, tolerant matching, commit–reveal draw, launchd job written but not installed) |
| Repo | Public: https://github.com/MySpeedPuzzling/instagram-studio (MIT; logos and font excepted), pushed 2026-10-17 |
| Profile (18 Oct) | Profile check 47/100 → fixed: bio B1 (community tone, 11,000+ puzzlers, 86 countries), category community + contact e-mail, "Quizzes" highlight with a house-style cover (`tools/highlight-covers.ts`), quiz comments answered (data checked against the site). Name stays MySpeedPuzzling; UTM bio link reverted (it showed). Notes: `research_notes/…/profile_audit_2026-10-18.md` |
| Start here (18 Oct) | Pinned evergreen explainer `node tools/draft.ts about` (draft 2026-10-18-about, C1 "missing piece" cover from lab **AB1**, coral intro poster): published by hand 18 Oct 17:29 (https://www.instagram.com/p/DepAfaWDaud/), pinned with the WJPC post and the quiz; insights at +48 h (Tue 20 Oct ~17:30). Refresh ~yearly. Audience notes in `editorial/audience.md` (read before every post) |
| Weekly Numbers (18 Oct) | Builder from the owner's list: cover, most-solved (boxes), fastest solo/pairs/teams 500 & 1000 with the typical time, most solves, seeded shoutout draw (3 of everyone who solved; not already named), the week in hours (day chart), personal bests. Counts solves **finished** in the week: ~1 in 6 logged results are older solves typed in later (they topped "most active" with 189). Pairs/teams named only when every member is a featurable registered player. Lint skips declared proper nouns (`proper_nouns`, e.g. "Vibrant Vases") |
| Lint (18 Oct) | From the instagram-agent-skill review (not installed, ideas borrowed): search phrases per builder, invisible characters, stock phrases; review in `research_notes/…/external_instagram_agent_skill_review.md` |

## Waiting for the owner

0. **Advent of Puzzle morning list** (`docs/advent-morning.md`): decisions with recommendations, the AD1 gallery,
   and the Close Friends API test Story (`content/labs/STORY-TEST/instructions.md`).

1. **Story test (next session):** post `content/labs/STORY-TEST/story-test-v1.jpg` to Close Friends, screenshot it in
   the viewer (iPhone, Android if possible) and with a default-size 3-option poll; Claude reads the ruler and fixes the
   Story bands (`research_notes/…/story_dimensions_2026.md`).
2. **Confirm the weekly rhythm** (research `growth_strategy_2026.md`): Mon 19:00 Weekly Numbers, Wed/Thu 19:00 data
   story, a rotating 4th slot, Sat ~10:00 community post (+ weekend Stories); 4 posts/week incl. the owner's, 5 after
   a clean 4-week block.
3. ~~Sunday 18 Oct: answer Story~~ posted 18 Oct (new layout: poll vote beside the medians, navy, link sticker zone;
   poll 48/30/22 % in `editorial/learnings.md`). Read its reach/replies within 24 h.
4. Later: Reels intro/outro (LM1), illustration style (IL1, J1). Small questions at the end of `docs/backlog.md`.

## Next steps (in order)

1. **Story device test** → final Story bands.
2. **Insights on Start here** at +48 h (Tue 20 Oct ~17:30): follows and profile visits per reach matter most for a
   pinned intro. **Align per-puzzle medians with the site** (`puzzle_statistics`) before the next quiz.
3. **Weekly Numbers ep. 1 published** Mon 19 Oct ~14:55 (https://www.instagram.com/p/DerS1FsiJCH/, draft
   `2026-10-19-weekly-rc1`, 8 slides, 11 photo tags; first attempt failed on 2 handles that don't exist on Instagram).
   Insights at +48 h. **Animated Story** (`node tools/motion.ts weekly <id>`, 15 s, L1-3 logo stopwatch) posted ~16:10
   with music and a link sticker (bottom right); **read its Story insights before it expires (Tue 20 Oct ~16:00)**.
   **Lesson (19 Oct):** the video's first frame is its preview and ep. 1's was almost blank; the animation now opens on a title card (poster + most-solved boxes) that slides away (16 s, `story-1-video-preview.jpg`). Recaps highlight: pick a cover (owner didn't like ↻; options @bars/@days/@line/@calendar in content/highlights/).
   Ep. 2 on Mon 26 Oct: `node tools/draft.ts weekly-rc1`, then `node tools/motion.ts weekly <id>`. Then the Wisconsin preview (event Fri 23 Oct)
   and clocks go back (Sat 24 Oct). Each new post type becomes a builder in `src/posts/` + an entry in `tools/draft.ts`.
4. **Insights on the first post** after 48 h (`node tools/insights.ts`), first entry in `editorial/learnings.md`.
5. **Fold the agents' house proposals into H4** (shared art palette per ground, family CSS hook, shared geometry/board
   helpers, `heroFitUnit`); keep H1–H3 renderable (owner: keep every lab as reference).
6. Highlights (Start here, Events) once there are more Stories; puzzle subjects from box images (cats vs dogs), weekend challenge format, IL1 style guide, Reels publishing.

## Plan for the next working day

- Story test with the owner; apply the measured bands.
- Tue 20 Oct: Week 42 Story insights before ~16:00 (it expires), Start here insights ~17:30; Recaps cover pick.
- Weekly Numbers ep. 1 is live (19 Oct); read its insights Wed 21 Oct, then plan ep. 2 (26 Oct).

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
