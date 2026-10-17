-- Weekend "Shelf Challenge" prototype (2026-10-17): the 500-piece puzzles that sit unsolved on the most MSP shelves
-- (in a player's collection, never logged by that player), with box images, so a Saturday post can name one puzzle
-- many people already own. Aggregate only. Suspicious results, private profiles, embargoed puzzles and hidden images
-- excluded (CLAUDE.md data rules).
WITH solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
                WHERE NOT t.suspicious AND NOT pl.is_private),
ci AS (SELECT DISTINCT ci.player_id, ci.puzzle_id FROM collection_item ci JOIN player pl ON pl.id = ci.player_id WHERE NOT pl.is_private)
SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image,
       count(*) AS on_shelves, count(*) FILTER (WHERE s.player_id IS NULL) AS unsolved_on_shelves,
       round(100.0 * count(*) FILTER (WHERE s.player_id IS NULL) / count(*), 1) AS pct_unsolved
FROM ci JOIN puzzle pz ON pz.id = ci.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
LEFT JOIN solved s ON s.player_id = ci.player_id AND s.puzzle_id = ci.puzzle_id
WHERE pz.pieces_count = 500 AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3, 4, 5 HAVING count(*) FILTER (WHERE s.player_id IS NULL) >= 15
ORDER BY unsolved_on_shelves DESC LIMIT 20;
