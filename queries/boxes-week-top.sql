-- Most-solved puzzles last full week with box image paths and all-time stats (embargoed images excluded).
-- Private profiles excluded everywhere, all-time stats included (player.is_private; owner decision 2026-10-13).
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
wk AS (
  SELECT t.puzzle_id, count(DISTINCT t.player_id) AS solvers_week, count(*) AS results_week
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id, w
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
  GROUP BY 1 ORDER BY 2 DESC LIMIT 12)
SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image, wk.solvers_week, wk.results_week,
  (SELECT count(DISTINCT t.player_id) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
     WHERE t.puzzle_id = pz.id AND NOT t.suspicious AND NOT pl.is_private) AS solvers_all,
  (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
     WHERE t.puzzle_id = pz.id AND NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS median_solo_s,
  (SELECT min(t.seconds_to_solve) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
     WHERE t.puzzle_id = pz.id AND NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS fastest_solo_s,
  (SELECT round(100.0 * count(*) FILTER (WHERE t.first_attempt) / nullif(count(*), 0)) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
     WHERE t.puzzle_id = pz.id AND NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo') AS first_attempt_pct
FROM wk JOIN puzzle pz ON pz.id = wk.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
ORDER BY wk.solvers_week DESC;
