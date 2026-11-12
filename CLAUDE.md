# MSP Instagram: rules for Claude

Pipeline that drafts Instagram posts for @myspeedpuzzling from MySpeedPuzzling data, with a human
approving every post.

**Before drafting or revising any post, read `editorial/standing-feedback.md`** and **`editorial/audience.md`** (who
uses MSP and why; add the owner's new context about users there). Standing feedback = the owner's standing rules from
every review, applied to all future posts; add new general feedback there.

**Start every session with `docs/STATUS.md`** (where we are, what exists, next steps), then
`docs/decisions.md` (owner decisions; they override everything) and `docs/backlog.md` (todos and open
questions). How-tos are in `docs/runbook.md`; evidence in `reports/` and `research_notes/`; ideas in
`docs/ideas/`. At the end of a work session, update `docs/STATUS.md` and `docs/backlog.md`.

## Working with the owner

- Drive the work yourself; ask only for real decisions, interactively (AskUserQuestion) with a recommended
  option first. Explain jargon in plain words.
- Visual choices: show options in the lab galleries and collect per-slide feedback (Works / Unsure / No-go or
  codes like "D4-3"); read `content/labs/<LAB>/feedback.jsonl` before proposing visuals.
- Report findings and numbers honestly; never publish anything without the owner's approval.

## This repository is public

- Secrets live only in `.env` (gitignored). Never print, echo, log or write their values: load them
  inside the same shell command (`set -a && source .env && set +a && ...`) and redact
  `postgres://…`, `access_token=…` and `Bearer …` from any output that could contain them.
- Never commit drafts, rendered posts, DB extracts, raw API dumps or anything with member data.
  `content/`, `var/` and sqlite files are gitignored for that reason.
- Never put server hostnames, IPs, emails, user IDs or names of individual members in committed files.
- Keep `.githooks/pre-commit` enabled (`git config core.hooksPath .githooks`); never bypass it with `--no-verify`.
- **Always commit when a piece of work is done** (owner, 2026-10-26): code, queries, docs, research notes and rules, in
  small commits with clear messages, without being asked; never end a session with uncommitted work. Push only when
  the owner asks. Gitignored material (drafts, renders, caches) stays out as above.

## Database

How to query production (server, container, roles, exact commands) is in `CLAUDE.local.md`, which
is gitignored and loaded automatically. Keep those details out of every committed file.

- Query only as the read-only role, never as the app's superuser role. Every write is rejected; never
  work around that. Data changes go through the app (migrations / console commands), not ad-hoc SQL.
- The role reads every table (`pg_read_all_data`). Queries are cancelled after 5 min, and there are at
  most 10 connections.
- This is the live production database under real traffic: run `EXPLAIN` first on anything that might
  scan big tables (e.g. `puzzle_solving_time`, `notification`), add `LIMIT`, avoid long-running queries.
- Personal data (players' e-mails, sessions) is in there: don't copy it into files in the repo.
- Numbers that go into posts follow the app's rules: exclude suspicious results, skip embargoed puzzles
  and non-public events, and **exclude private profiles from every query, aggregates included**
  (`player.is_private`). Ranking opt-outs are excluded from anything that names or ranks players.
- **Fresh data for every post (owner rule):** plans hold ideas and query names, never final numbers. A post's
  numbers are queried with `--fresh` on the day it's finalised; the publisher refuses drafts whose facts.json is
  older than 24 h. Re-query and re-render before showing a draft for approval if its data is older than that. Re-run the query right
  before posting and record the date it was queried.

## Featuring players

- Feature players only the way MSP already shows them publicly: respect private profiles and ranking
  opt-outs, and check `content/do-not-feature.json` (gitignored: it holds player IDs) before naming or tagging anyone.
- Tag players only with the Instagram handle from their MSP profile.

## Heavy local jobs

- ComfyUI generation, large Blender renders and video renders need the owner's go-ahead (they run in
  quiet hours when RAM is free). Rendering HTML/SVG templates is fine anytime.
- The Mac is the limit (M3 Max, 36 GB, 30-core GPU; a bigger machine may come later). Before a heavy
  run, ask the owner to calm the machine: Docker and other unneeded apps off.
- Every prototype and lab records what it used, so runs are comparable: wall time, peak memory and swap,
  GPU busy time, per-item time, and what else was running.

## Background jobs (they run without an open Claude session)

macOS launchd user agents, installed and listed with `tools/scheduled/schedule.sh` (`list`, `pull`, `check …`,
`remove …`); logs and check prompts live in `var/scheduled/` (gitignored). Owner, 2026-11-12: insights are gathered
automatically, never on request.

- **`com.msp-instagram.insights-pull`**: every day at 08:10 and 20:10, `tools/scheduled/pull.sh` runs
  `node tools/insights.ts` (read-only API calls into `content/state.sqlite`: every post, Reel and live Story gets
  a snapshot). No Claude involved. Log: `var/scheduled/pull.log`.
- **`com.msp-instagram.weekly-review`** (Mondays 07:20) and **`monthly-review`** (the 1st, 07:40): unattended Claude
  reviews from `tools/scheduled/prompts/{weekly,monthly}.txt`; reports `content/reports/weekly-review-<date>.md` and
  `monthly-review-<date>.md`, findings into `editorial/learnings.md`. Installed with `schedule.sh reviews`.
- **Where to read it all:** the review app's Insights page (`/review/insights`, `src/review/insights.ts`): every post
  against its format's median, medians by format, series and mechanic, and the reports.
- **`com.msp-instagram.check-<name>`**: one-off unattended reviews. `tools/scheduled/run-check.sh` starts Claude Code
  headless (`claude -p`) on `var/scheduled/prompt-<name>.txt` with a narrow allowlist: read files, pull insights,
  list comments (`tools/comments.ts`), edit docs, `git add/commit`. It cannot publish, reply, push or run other
  commands. It writes a report to `content/reports/`, shows a macOS notification and removes its own job.
- **After every post, Reel or Story goes out, schedule its checks without being asked** (owner, 2026-11-12): one at
  about +24 h (for a Story: at least an hour before it expires, its numbers are gone afterwards) and one at +48 h
  with the pin verdict. Write the prompt file, then
  `tools/scheduled/schedule.sh check <name> <month> <day> <hour> <minute>` (local time), and note the job in
  `docs/backlog.md`. Read finished reports in `content/reports/` at the start of a session and tell the owner.
- The Mac must be on (a job missed during sleep runs on wake). Never widen the allowlist to publishing or replying:
  those stay with the owner's approval in a live session.

## Instagram

- Publishing is never done by the model on its own initiative: only a human-approved draft is
  published, through the publish script.
- API constraints that matter: JPEG only, 4:5 (1080×1350) max height ratio, carousels ≤ 10 items,
  media must be at a public URL, no edit of captions after publishing, hashtags: 3–5 specific topic labels (max 5).
