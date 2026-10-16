# Prompt for the next session (after the DL4 verdict and the IL1 night)

Copy everything below the line into a fresh Claude Code session started in this repo.

---

Read `docs/STATUS.md`, `docs/decisions.md`, `docs/backlog.md`, `lab/dl4/README.md` and `lab/ai2/README.md`, then my
feedback in `content/labs/DL4/feedback.jsonl` (and `content/labs/IL1/feedback.jsonl` if IL1 has run).

1. Record my DL4 verdict in `docs/decisions.md`, apply it to `src/design/house.ts` (keep the chosen variant, fold in
   the house proposals listed in the backlog, drop what I rejected) and re-render DL4 so I can confirm.
2. If IL1 ran overnight: check `node tools/ai-batch.ts --batch lab/ai2/batch.ts --status`, unschedule it, review the
   gallery with me, and draft a short illustration style guide from my picks.
3. Then start the production post builders (`src/posts/`) on the house module for the first real posts, with fresh
   data on the day.

Ask me only for real decisions, interactively, with a recommendation first. Update `docs/STATUS.md` and
`docs/backlog.md` at the end and commit.
