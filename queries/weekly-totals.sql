-- The Weekly Numbers: solves finished in the last full ISO week (Mon–Sun) vs the week before (older solves logged
-- that week don't count: about 1 in 6 logged results is a backfill).
-- Private profiles excluded from every column: results, new puzzlers and personal-best moments (player.is_private; 2026-10-13).
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
t AS (
  SELECT CASE WHEN coalesce(t.finished_at, t.tracked_at) >= w.start THEN 'last' ELSE 'previous' END AS wk, t.player_id, p.pieces_count
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id, w
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= w.start - interval '7 days' AND coalesce(t.finished_at, t.tracked_at) >= w.start - interval '7 days' AND coalesce(t.finished_at, t.tracked_at) < w.stop)
SELECT (SELECT to_char(start, 'YYYY-MM-DD') FROM w) AS week_start,
  count(*) FILTER (WHERE wk = 'last') AS results, count(*) FILTER (WHERE wk = 'previous') AS results_prev,
  count(DISTINCT player_id) FILTER (WHERE wk = 'last') AS puzzlers, count(DISTINCT player_id) FILTER (WHERE wk = 'previous') AS puzzlers_prev,
  sum(pieces_count) FILTER (WHERE wk = 'last') AS pieces,
  (SELECT count(*) FROM player, w WHERE registered_at >= w.start AND registered_at < w.stop AND NOT is_private) AS new_puzzlers,
  (SELECT count(*) FROM player_moment m JOIN player pl ON pl.id = m.player_id, w
     WHERE m.type = 'personal_best' AND m.occurred_at >= w.start AND m.occurred_at < w.stop AND NOT pl.is_private) AS personal_bests
FROM t;
