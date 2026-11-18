-- "300 million pieces" Reel (2026-11-18): the MSP story in numbers. When logging started (first tracked result),
-- pieces logged in the first 12 months, and how many puzzlers and countries have logged a result. Same rules as
-- bs-milestone-pace (not suspicious, private profiles excluded). Aggregate only.
WITH r AS (
  SELECT t.tracked_at, t.player_id, p.pieces_count, pl.country
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private),
s AS (SELECT min(tracked_at) AS first_at FROM r)
SELECT s.first_at::date AS first_day,
       (SELECT sum(pieces_count) FROM r WHERE tracked_at < s.first_at + interval '1 year') AS pieces_year_one,
       (SELECT count(*) FROM r WHERE tracked_at < s.first_at + interval '1 year') AS results_year_one,
       (SELECT count(DISTINCT player_id) FROM r) AS puzzlers,
       (SELECT count(DISTINCT country) FROM r WHERE country IS NOT NULL) AS countries
FROM s;
