-- The 60 most-solved puzzles of all time (distinct solvers) with box images, for quizzes ("guess the puzzle").
-- Private profiles excluded (results by players with player.is_private never count; owner decision 2026-10-13).
SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image,
       count(DISTINCT t.player_id) AS solvers,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0))::numeric) AS median_solo_s
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE NOT t.suspicious AND NOT pl.is_private
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3, 4, 5 ORDER BY 6 DESC LIMIT 60;
