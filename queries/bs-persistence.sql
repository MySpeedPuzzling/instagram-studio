-- Brainstorm 2026-10: persistence and scale per puzzler (anonymous): lifetime pieces clubs, most results on one solve
-- date, most distinct brands, longest gap between two solves of the same puzzle. Aggregate only, no identities.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH pp AS (
  SELECT t.player_id, sum(p.pieces_count) AS pieces, count(DISTINCT p.manufacturer_id) AS brands, count(DISTINCT t.puzzle_id) AS puzzles
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1),
day AS (
  SELECT t.player_id, coalesce(t.finished_at, t.tracked_at)::date AS d, count(*) AS n, sum(p.pieces_count) AS pcs
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.seconds_to_solve > 0 GROUP BY 1, 2),
rep AS (
  SELECT t.player_id, t.puzzle_id, min(coalesce(t.finished_at, t.tracked_at)) AS a, max(coalesce(t.finished_at, t.tracked_at)) AS b, count(*) AS n
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1, 2 HAVING count(*) >= 2)
SELECT (SELECT count(*) FROM pp WHERE pieces >= 100000) AS club_100k, (SELECT count(*) FROM pp WHERE pieces >= 250000) AS club_250k,
       (SELECT count(*) FROM pp WHERE pieces >= 500000) AS club_500k, (SELECT count(*) FROM pp WHERE pieces >= 1000000) AS club_1m,
       (SELECT max(pieces) FROM pp) AS max_pieces, (SELECT max(brands) FROM pp) AS max_brands, (SELECT count(*) FROM pp WHERE brands >= 50) AS brands_50plus,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY brands))::numeric) FROM pp WHERE puzzles >= 20) AS median_brands_20plus,
       (SELECT max(n) FROM day) AS max_timed_results_one_day, (SELECT max(pcs) FROM day) AS max_pieces_one_day,
       (SELECT round(max(extract(epoch FROM b - a)) / 86400 / 365.25, 1) FROM rep) AS longest_repeat_gap_years,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM b - a) / 86400))::numeric) FROM rep WHERE n = 2) AS median_days_between_two_solves;
