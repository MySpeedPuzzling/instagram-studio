# MSP Instagram: rules for Claude

Pipeline that drafts Instagram posts for @myspeedpuzzling from MySpeedPuzzling data, with a human
approving every post. The plan and its evidence are in `reports/`; the owner's decisions in
`docs/decisions.md` override the reports. Read both before proposing architecture or content changes.

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
  (`player.is_private`). Ranking opt-outs are excluded from anything that names or ranks players. Re-run the query right
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
  media must be at a public URL, no edit of captions after publishing, ≤ 5 hashtags.
