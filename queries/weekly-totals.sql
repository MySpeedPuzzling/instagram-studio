-- The Weekly Numbers: last full ISO week (Mon–Sun) vs the week before.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
t AS (
  SELECT CASE WHEN t.tracked_at >= w.start THEN 'last' ELSE 'previous' END AS wk, t.player_id, p.pieces_count
  FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id, w
  WHERE NOT t.suspicious AND t.tracked_at >= w.start - interval '7 days' AND t.tracked_at < w.stop)
SELECT (SELECT to_char(start, 'YYYY-MM-DD') FROM w) AS week_start,
  count(*) FILTER (WHERE wk = 'last') AS results, count(*) FILTER (WHERE wk = 'previous') AS results_prev,
  count(DISTINCT player_id) FILTER (WHERE wk = 'last') AS puzzlers, count(DISTINCT player_id) FILTER (WHERE wk = 'previous') AS puzzlers_prev,
  sum(pieces_count) FILTER (WHERE wk = 'last') AS pieces,
  (SELECT count(*) FROM player, w WHERE registered_at >= w.start AND registered_at < w.stop) AS new_puzzlers,
  (SELECT count(*) FROM player_moment m, w WHERE m.type = 'personal_best' AND m.occurred_at >= w.start AND m.occurred_at < w.stop) AS personal_bests
FROM t;
