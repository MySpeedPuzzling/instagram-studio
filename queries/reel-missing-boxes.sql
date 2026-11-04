-- Reel "WHERE IS IT?" (2026-11-04): the board's picture is a cat puzzle (the cat is the prime suspect). Most-solved
-- 500-piece puzzles with a cat in the title, by distinct solo/any puzzlers. Aggregate only; public puzzles with a public
-- image. Private profiles excluded (player.is_private; owner decision 2026-10-13). Suspicious results excluded.
SELECT pz.name AS puzzle, m.name AS brand, pz.image, count(DISTINCT t.player_id) AS puzzlers
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE NOT t.suspicious AND NOT pl.is_private AND pz.pieces_count = 500
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  AND pz.name ~* '\m(cats?|kittens?|kitty)\M'
GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 15;
