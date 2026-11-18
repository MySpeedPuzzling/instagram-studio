-- The day the community passed 300 million logged pieces: pieces logged per day (by tracked_at) over the last 14
-- days and the running total at the end of each day. Same rules as bs-milestone-pace (not suspicious, private
-- profiles excluded). Aggregate only.
WITH tot AS (
  SELECT sum(p.pieces_count) AS pieces
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private),
daily AS (
  SELECT t.tracked_at::date AS day, sum(p.pieces_count) AS pieces, count(*) AS results
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= now()::date - 14
  GROUP BY 1)
SELECT d.day, d.results, d.pieces,
       tot.pieces - coalesce(sum(d.pieces) OVER (ORDER BY d.day DESC ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS total_at_day_end
FROM daily d, tot
ORDER BY d.day;
