-- Reel "The cruellest 13 seconds" (Friday the 13th, 2026-11-13): candidates for the board's picture, 500-piece puzzles
-- with a luck theme in the title (black cats, luck, clovers, horseshoes, Friday), by distinct puzzlers. Aggregate only;
-- public puzzles with a public image. Private profiles and suspicious results excluded.
SELECT pz.name AS puzzle, m.name AS brand, pz.image, count(DISTINCT t.player_id) AS puzzlers
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE NOT t.suspicious AND NOT pl.is_private AND pz.pieces_count = 500
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  AND pz.name ~* '(black cats?|\mluck|lucky|clover|horseshoe|friday|superstiti|\m13\M)'
GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 15;
