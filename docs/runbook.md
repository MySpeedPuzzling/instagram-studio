# Runbook

How to do each recurring task. Rules (secrets, data, publishing) are in `CLAUDE.md`; decisions in `docs/decisions.md`.

## Setup on a fresh clone

```sh
npm install
git config core.hooksPath .githooks        # secret guard
cp .env.example .env                       # fill in locally (see comments in the file)
node src/design/build-tokens.ts            # brand tokens + contrast gate
npm test && npm run typecheck
```

Production DB access is described in the gitignored `CLAUDE.local.md` (ssh + docker exec as the read-only role).
`.env` holds `MSP_DB_*`, `IG_*`, `R2_*` and `COMFYUI_*` keys; never print their values.

## Data

```sh
node src/data/db.ts <query>            # cached result (content/cache/<query>.json)
node src/data/db.ts <query> --fresh    # re-query production (always before a post)
node src/data/boxes.ts <query> [puzzle_large|puzzle_medium]   # cache the box images a query returns
```

New query: add `queries/<name>.sql` (aggregate only; exclude `player.is_private`; suspicious results, embargoed
puzzles and non-public events out; EXPLAIN first if it scans `puzzle_solving_time`). Results with player names stay
in `content/` (gitignored).

## Labs

```sh
node lab/dl1/run.ts [D1 D4 …]          # DL1 styles
LAB=dl2 node lab/dl1/run.ts [F1 …]     # DL2 creative formats
LAB=dl3 node lab/dl1/run.ts [G1 …]     # DL3 idea prototypes
node lab/dl2/reels/render.ts [post …]  # Reels (HyperFrames; light)
node tools/review.ts [--lan]           # galleries + drafts at http://127.0.0.1:4173/review
```

A lab "direction" is `lab/<lab>/directions/<id>-*.ts` exporting `{ id, name, idea, css, posts(c) }`; every slide
passes the QA lint (`src/render/qa.ts`) with 0 errors. Run logs: `content/labs/<LAB>/runs.jsonl`. Phone access:
`--lan` prints a URL with a persistent token.

## Heavy jobs (AI images)

Only with the owner's go-ahead on a calm machine (Docker and other apps off; a restart clears swap).

```sh
node tools/calm.ts --need-gb 24        # is the machine calm enough?
node tools/ai-batch.ts --dry-run       # plan + calm check per model family
node tools/ai-batch.ts --schedule --at 22:30   # one-night launchd agent (or run directly with --start HH:MM)
node tools/ai-batch.ts --status        # progress, per-family time and peak memory
kill -TERM <runner pid>                # stop cleanly after the current image
node tools/ai-batch.ts --unschedule
```

Measured on the M3 Max 36 GB (AI1, 2026-10-14): Z-Image Turbo Q8 ~140 s/image at 1088×1360, 16 GB; klein 4B Q8
~110–180 s, 17 GB; klein 9B Q8 ~80 s at 1024², 20 GB. Batch spec: `lab/ai1/batch.ts`; workflows `lab/ai1/workflows/`.

**Batch files.** The runner takes the spec from a batch file; AI1 is the default. Every command above works with
`--batch`, e.g. the illustration lab IL1 (`lab/ai2/README.md`):

```sh
node tools/ai-batch.ts --batch lab/ai2/batch.ts --dry-run      # plan, time budget vs the window, files, calm check
node tools/ai-batch.ts --batch lab/ai2/batch.ts --validate     # ComfyUI headless, no jobs: every job graph vs /object_info
node tools/ai-batch.ts --batch lab/ai2/batch.ts --schedule --at 22:30   # launchd label cz.myspeedpuzzling.instagram.il1
node tools/ai-batch.ts --batch lab/ai2/batch.ts --status | --gallery | --unschedule
```

A new batch is a file `lab/<lab>/batch.ts` built on `lab/ai/core.ts` (model families, workflows, `buildJobs`,
`fillWorkflow`): it exports `LAB_ID` (output in `content/labs/<LAB_ID>/`), `OUT_DIR`, `FAMILIES`, `FAMILY_ORDER`,
`WORKFLOWS`, `EXPERIMENTS` (ids like `E1`, `I3`), `jobs()`, `fillWorkflow`, `familyFiles`, `sha256`, and optionally
`TITLE`, `LABEL`, `LAST_FAMILIES` and `hooks` (inputs such as scaffolds, reference files, extra gallery slides).
Add it to the compile-time check `BatchFilesConform` in `tools/ai-batch.ts`. Run one batch per night (they share the
ComfyUI port). Dry test without ComfyUI: `AI1_TEST_MODE=1 AI_LAB_ID=IL1TEST COMFYUI_PORT=<mock port> node
tools/ai-batch.ts --batch lab/ai2/batch.ts --now` against a mock API (test lab ids only; delete `content/labs/*TEST`
afterwards).

## Drafts, review, publishing

Read `editorial/standing-feedback.md` first: the owner's standing rules apply to every draft.

1. **Draft:** `node tools/draft.ts <builder>` (e.g. `faster-postcards`): re-runs the post's queries `--fresh`, writes
   `facts.json`, renders the slides in `HOUSE` and refuses to save on any QA error, writes the proposed caption
   (`msp-captions` rules, linted) and alt text, renders Story follow-up frames into `stories/`, saves the draft
   `in_review`. Re-running updates the draft (version +1, feedback kept, an owner-edited caption kept); a scheduled or
   published draft is never rewritten (only its Story frames). New post types: a builder in `src/posts/` + an entry
   in `tools/draft.ts`. Older route: `node tools/draft-from-lab.ts <LAB> <direction> <post>`.
2. **Review:** http://127.0.0.1:4173/review (on the phone: `node tools/review.ts --lan`, URL with `?t=<token>`).
   Approve now / schedule / notes per slide / request changes / reject. "Approve and publish now" shows progress and
   keeps any error on screen.
3. **Publish:** only through `src/publish/publish.ts` (the approve button, or `node src/publish/publish.ts <id>` at the
   owner's request). Preflight refuses: non-JPEG, aspect outside 4:5–1.91:1, > 10 slides, missing alt text, invalid
   photo tags, caption lint errors, **data older than 24 h**. `media_publish` is retried on Instagram's transient
   "Media ID is not available", after checking the post didn't go out. Verify afterwards: one new post on the account,
   carousel slide count, caption; photo tags can only be checked in the app.
4. **Photo tags:** `slides[i].user_tags = [{ username, x, y }]` (0–1 from the left/top), e.g. the brand on slide 1.
5. **Stories** are posted by hand (stickers can't be added via the API). The draft tool renders the frames; give the
   owner the image links (LAN URL + token), a guide image with a life-size sticker, and step-by-step instructions
   (which sticker, exact text, where to place it). Use a **poll** (not a quiz) when the answer comes later. Post the
   feed post first, then the Story. Bands: key text and stickers in y 200–1720.
6. `node tools/r2-check.ts` tests the media host end to end.

## Captions

`node src/captions/lint.ts caption.txt --pillar carousel|single|reel|report|story` — playbook in
`research_notes/MSP Instagram design and growth toolkit/captions_voice_hashtags.md` §9; skill `msp-captions`.

## Insights and token

```sh
node tools/insights.ts            # pull all posts + 30 days of account metrics into content/state.sqlite
node tools/insights.ts --summary  # medians by year and format
node tools/ig-token.ts status     # token validity and expiry (refresh with: refresh)
```

## Campaigns (Advent of Puzzle, reply-to-Story quizzes)

Design: `docs/ideas/advent-of-puzzle.md`. Everything here is **read-only towards Instagram** (GET requests only,
enforced in `src/campaign/ig.ts`); the owner posts, replies and DMs. Data lands in the gitignored
`content/campaign/<campaign>/` (answer keys, entries, audits): never commit it.

```sh
node tools/campaign.ts status                         # days, windows, what's collected, alerts
node tools/campaign.ts stories                        # snapshot our live Story ids + insights (only works while live)
node tools/campaign.ts probe --since <ISO time>       # what the API returns for Story replies/mentions (masked handles)
node tools/campaign.ts collect <day>                  # read replies for door <day>, match against keys/day-NN.json
node tools/campaign.ts collect <day> --source comments --media <id>   # fallback: comments on a feed post
node tools/campaign.ts week <n> --rule tickets|all6|any                # the week's pool
node tools/campaign.ts seed <n>                       # before the week's first door: secret seed → fingerprint to publish
node tools/campaign.ts draw <n> [--dry-run]           # after door 6 closes: reveal, draw, audit, winner draft
node tools/campaign.ts tick                           # what the scheduled job runs (snapshot, collect, Sunday draw)
node tools/campaign.ts schedule --print               # writes the launchd plist, prints install commands (no install)
node tools/campaign.ts purge --before <date> [--yes]  # GDPR: delete non-winner entries (dry run without --yes)
```

Install the scheduled job only with the owner's go-ahead (commands printed by `schedule --print`; label
`cz.myspeedpuzzling.instagram.advent`): `launchctl bootstrap gui/$(id -u) <plist>` to install,
`launchctl kickstart -k gui/$(id -u)/cz.myspeedpuzzling.instagram.advent` to run now,
`launchctl bootout gui/$(id -u)/cz.myspeedpuzzling.instagram.advent` to remove. Failures go to
`content/campaign/<campaign>/alerts.log` and a macOS notification.

Before a campaign: token valid past its end (`node tools/ig-token.ts status`), "Allow access to messages" on in the
Instagram app, Story replies open to everyone, public Story comments off on contest Stories, don't delete or decline
chats until the week's draw is done.
