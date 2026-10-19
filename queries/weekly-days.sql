-- The Weekly Numbers: solves finished per day of the last full ISO week (Mon–Sun, server time; results without a finish date or logged later for older solves don't count), with the week's typical
-- (median) solo 500-piece time and how many solo 500 results it rests on. Embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13); suspicious results excluded.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
t AS (
  SELECT t.finished_at AS done_at, t.puzzling_type, t.seconds_to_solve, pz.pieces_count
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id, w
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now()))
SELECT to_char(d.day, 'YYYY-MM-DD') AS day, to_char(d.day, 'Dy') AS weekday,
  (SELECT count(*) FROM t WHERE t.done_at >= d.day AND t.done_at < d.day + interval '1 day') AS results,
  (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds_to_solve))::numeric) FROM t
     WHERE puzzling_type = 'solo' AND pieces_count = 500 AND seconds_to_solve > 0) AS week_median_solo500_s,
  (SELECT count(*) FROM t WHERE puzzling_type = 'solo' AND pieces_count = 500 AND seconds_to_solve > 0) AS week_solo500_results
FROM w, generate_series(w.start, w.stop - interval '1 day', interval '1 day') AS d(day)
ORDER BY d.day;
