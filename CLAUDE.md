# MSP Instagram: rules for Claude

Pipeline that drafts Instagram posts for @myspeedpuzzling from MySpeedPuzzling data, with a human
approving every post.

**Before drafting or revising any post, read `editorial/standing-feedback.md`** (the owner's standing rules from
every review, applied to all future posts; add new general feedback there).

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

## Instagram

- Publishing is never done by the model on its own initiative: only a human-approved draft is
  published, through the publish script.
- API constraints that matter: JPEG only, 4:5 (1080×1350) max height ratio, carousels ≤ 10 items,
  media must be at a public URL, no edit of captions after publishing, hashtags: 3–5 specific topic labels (max 5).
