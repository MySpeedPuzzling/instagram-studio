# Prompt for the next session

Copy everything below the line into a fresh Claude Code session started in this repo.

---

Read `docs/STATUS.md`, `docs/decisions.md` (the 2026-10-17 sections), `editorial/standing-feedback.md` (apply all of it),
`docs/backlog.md`, and `docs/advent-morning.md` (the overnight Advent of Puzzle results).

1. **Advent decisions:** ask me the decision list in `docs/advent-morning.md` §3 interactively (AskUserQuestion, up to
   4 at a time, your recommendation first), read my AD1 gallery feedback (`content/labs/AD1/feedback.jsonl`), and
   record the answers in `docs/decisions.md` and `editorial/standing-feedback.md`; set the chosen rule in
   `content/campaign/advent-2026/config.json`.
2. **Test Story:** when I say "run the probe", run `node tools/campaign.ts probe --since <time I posted>` (read-only) at
   +5 min, +1 h, +23 h, +26 h; read my screenshots; write the results into the research note §2.3 and adjust the
   collector if anything differs.
3. **Still open from before:** the Story ruler test (`story-test-v1.jpg`), insights on the first post, confirm the
   weekly rhythm, the Weekly Numbers builder for Monday 19:00.
4. Then plan the November steps from the backlog's Advent section (300M guess dry run, rules page, prize, token
   refresh, Story publishing if chosen, door builder from the chosen AD1 variant).

Ask me only for real decisions, interactively, with a recommendation first; step-by-step instructions for anything I
do by hand. Update `docs/STATUS.md` and `docs/backlog.md` at the end and commit.
