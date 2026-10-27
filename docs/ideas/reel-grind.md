# Reel idea: "The grind" (MSP facts)

Owner idea 2026-10-27: the same puzzler solving the same puzzle again and again; show the improvement between
consecutive attempts, the record grinder's curve, and the total gain in % and per hour practised. Real names allowed
(public profile, not ranking-opted-out, not on `content/do-not-feature.json`). Player-specific notes live in the
gitignored `content/ideas/backlog.md`.

Queries: `queries/reel-grind-top.sql` (top 5 grinds, every attempt in order) and `queries/reel-grind-curve.sql`
(community curve by size). Both solo only, suspicious and **unboxed** solves excluded (owner 2026-10-27: unboxed is a
different skill; an unboxed repeat is a separate example). Numbers below were explored 2026-10-27 and are not for posting:
re-query on the day.

## What the data says (2026-10-27)

- The record grind: one puzzler solved one 500-piece puzzle 211 times in about four months (~75 hours), first solve
  about 3.7× the best; 31 personal bests on the way; the steepest part is the first ~8 solves (~5 hours).
- Community, fixed cohorts (puzzler + puzzle with ≥ 10 solves; 738 grinds at 500, 179 at ≤ 200): the 2nd solve is a
  median ~12 % faster than the 1st, the 5th ~26 %, the 10th ~37 %. Steps shrink: ~12 % → ~7 % → ~5 % → ~3 %.
- Across all second solves (~71 000 at 500): ~9 in 10 are faster, by a median ~11 %.
- **Piece count barely changes the shape in %**: ≤ 200 and 500 curves overlap within ~1 point. 1000 has only 3 grinds
  with ≥ 10 solves (thin data, stays out); its median gap between the 1st and 2nd solve is ~4 months vs ~4 days for
  ≤ 200 (fact worth one beat: "nobody grinds a 1000").
- Unboxed repeat: one puzzler solved a 500-piece Christmas puzzle 47 times without the box picture, ~70 % faster
  from first to best (a December angle).

## Caveats

- A first solve with a round time (e.g. exactly 65:00) may be typed in, not stopwatched: check before using it as
  the curve's start, else start from the 2nd solve.
- The cohort is puzzlers who chose to repeat a puzzle ≥ 10 times (self-selected keen repeaters): say "puzzlers who
  repeated a puzzle", not "you will be 37 % faster".
