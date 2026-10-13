-- Brainstorm 2026-10: when are seasonal puzzles solved? Results per solve month for Christmas, Halloween, winter,
-- summer/beach and autumn themed puzzles (solve date = coalesce(finished_at, tracked_at)), all years. Aggregate only.
WITH themes(theme, rx) AS (VALUES
  ('christmas', '\m(christmas|xmas|santa|advent|nativity|snowman|weihnacht\w*|noel)\M'),
  ('halloween', '\m(halloween|pumpkins?|spooky|haunted|witch(es)?|ghosts?|skeletons?)\M'),
  ('winter', '\m(winter|snow|snowy|ice skating|skating)\M'),
  ('summer', '\m(summer|beach|seaside)\M'),
  ('autumn', '\m(autumn|fall)\M'),
  ('easter_spring', '\m(easter|spring|bunny|bunnies)\M'))
SELECT th.theme, extract(month FROM coalesce(t.finished_at, t.tracked_at))::int AS month, count(*) AS results
FROM themes th JOIN puzzle p ON p.name ~* th.rx JOIN puzzle_solving_time t ON t.puzzle_id = p.id
WHERE NOT t.suspicious AND (p.hide_until IS NULL OR p.hide_until <= now())
GROUP BY 1, 2 ORDER BY 1, 2;
