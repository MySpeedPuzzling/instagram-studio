# MSP Instagram: rules for Claude

Pipeline that drafts Instagram posts for @myspeedpuzzling from MySpeedPuzzling data, with a human
approving every post. The plan and its evidence are in `reports/MSP Instagram content pipeline.md`;
read it before proposing architecture or content changes.

## This repository is public

- Secrets live only in `.env` (gitignored). Never print, echo, log or write their values: load them
  inside the same shell command (`set -a && source .env && set +a && ...`) and redact
  `postgres://…`, `access_token=…` and `Bearer …` from any output that could contain them.
- Never commit drafts, rendered posts, DB extracts, raw API dumps or anything with member data.
  `content/`, `var/` and sqlite files are gitignored for that reason.
- Never put server hostnames, IPs, emails, user IDs or names of individual members in committed files.
- Keep `.githooks/pre-commit` enabled (`git config core.hooksPath .githooks`); never bypass it with `--no-verify`.

## MySpeedPuzzling database

- Production Postgres, reached through an SSH tunnel (instructions are in the comments of `.env`).
  The role is read-only but currently broader than needed: it can read tables with personal data.
- Run only aggregate `SELECT`s, start each batch with `SET statement_timeout = '60s';`, run one query
  at a time, and close the tunnel when finished.
- Never select from `user_account` or other personal-data columns (emails, avatars, comments).
- Follow the app's rules when counting: exclude suspicious results, respect private profiles and
  ranking opt-outs, skip embargoed puzzles and non-public events.
- Re-run a query right before a number goes into a post; record the date it was queried.

## Instagram

- Publishing is never done by the model on its own initiative: only a human-approved draft is
  published, through the publish script.
- API constraints that matter: JPEG only, 4:5 (1080×1350) max height ratio, carousels ≤ 10 items,
  media must be at a public URL, no edit of captions after publishing, ≤ 5 hashtags.
