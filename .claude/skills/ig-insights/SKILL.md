---
name: ig-insights
description: Pull and interpret @myspeedpuzzling Instagram insights - what worked, what bores people, which tests concluded - and update the learnings. Use when asked how posts performed, for a weekly or monthly review, or before planning new posts.
---

# Read the insights

1. `node tools/insights.ts` pulls every post's latest metrics and 30 days of account metrics into
   `content/state.sqlite`; `--summary` prints medians by format and year. Data can lag 48 h; judge posts at +7 d.
2. Compare **medians against the account's own baseline**, never single posts and never industry benchmarks:
   reach per post (~900 in 2025), likes/reach, sends (shares)/reach, saves/reach, follows per post.
   A breakout is ≥ 3× the rolling 12-post median reach; viral at this size is ≥ 10×.
3. **Fatigue check per series:** if the rolling 4-episode median of likes or sends per reach falls below 75% of the
   first 4 episodes while non-series posts held steady, propose a retool (new skin, segment or hook).
4. **Tests:** only conclude a test at its pre-registered n; never peek-and-stop. Report the result with the counts.
5. Write findings as short "current beliefs" with evidence into `editorial/learnings.md` (aggregate numbers only,
   no member names), and tell the owner the 2–3 things that should change the next plan.
