-- Most-solved puzzles last full week (distinct solvers), embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop)
SELECT pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, count(DISTINCT t.player_id) AS solvers, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id, w
WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3 ORDER BY 4 DESC, 5 DESC LIMIT 5;
