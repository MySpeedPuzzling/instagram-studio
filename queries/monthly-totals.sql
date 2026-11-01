-- The monthly recap: solves finished in the last full calendar month (as in the Weekly Numbers: older solves logged
-- that month don't count, results without a finish date never count), with the same month a year earlier.
-- Hours, distinct puzzles, countries, pieces, new puzzlers and personal-best moments of the month.
-- Private profiles excluded from every column (player.is_private; owner decision 2026-10-13); suspicious results and
-- embargoed puzzles excluded.
WITH m AS (SELECT date_trunc('month', now()) - interval '1 month' AS start, date_trunc('month', now()) AS stop),
t AS (
  SELECT CASE WHEN t.finished_at >= m.start THEN 'this' ELSE 'year_ago' END AS mo, t.player_id, t.puzzle_id,
         t.seconds_to_solve, pl.country, pz.pieces_count
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id, m
  WHERE NOT t.suspicious AND NOT pl.is_private AND (pz.hide_until IS NULL OR pz.hide_until <= now())
    AND ((t.tracked_at >= m.start AND t.finished_at >= m.start AND t.finished_at < m.stop)
      OR (t.tracked_at >= m.start - interval '1 year' AND t.finished_at >= m.start - interval '1 year' AND t.finished_at < m.stop - interval '1 year')))
SELECT (SELECT to_char(start, 'YYYY-MM-DD') FROM m) AS month_start,
  count(*) FILTER (WHERE mo = 'this') AS results,
  count(DISTINCT player_id) FILTER (WHERE mo = 'this') AS puzzlers,
  count(DISTINCT puzzle_id) FILTER (WHERE mo = 'this') AS puzzles,
  sum(pieces_count) FILTER (WHERE mo = 'this') AS pieces,
  round(sum(seconds_to_solve) FILTER (WHERE mo = 'this') / 3600.0) AS hours,
  count(DISTINCT lower(country)) FILTER (WHERE mo = 'this' AND country IS NOT NULL AND country <> '') AS countries,
  count(*) FILTER (WHERE mo = 'year_ago') AS results_year_ago,
  count(DISTINCT player_id) FILTER (WHERE mo = 'year_ago') AS puzzlers_year_ago,
  (SELECT count(*) FROM player, m WHERE registered_at >= m.start AND registered_at < m.stop AND NOT is_private) AS new_puzzlers,
  (SELECT count(*) FROM player_moment pm JOIN player pl ON pl.id = pm.player_id, m
     WHERE pm.type = 'personal_best' AND pm.occurred_at >= m.start AND pm.occurred_at < m.stop AND NOT pl.is_private) AS personal_bests
FROM t;
