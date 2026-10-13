-- The 1,000 most-solved puzzles in September 2026 (distinct solvers) with box image paths, for walls and mosaics.
SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image,
       count(DISTINCT t.player_id) AS solvers, count(*) AS results
FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE NOT t.suspicious AND t.tracked_at >= '2026-09-01' AND t.tracked_at < '2026-10-01'
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3, 4, 5 ORDER BY 6 DESC, 7 DESC LIMIT 1000;
