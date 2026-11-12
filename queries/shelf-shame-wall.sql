-- Pile-of-shame Reel (2026-11-12): the wall of shelves shows one box per unsolved puzzle of the biggest pile, and no
-- picture twice (owner). The pictures are the puzzles most often sitting unsolved in collections, community-wide: an
-- aggregate, never one collector's actual shelf. Same rules as shelf-shame-puzzles.sql (private profiles excluded,
-- embargoed puzzles and images excluded). Aggregate only.
WITH ci AS (
  SELECT DISTINCT c.player_id, c.puzzle_id FROM collection_item c JOIN player pl ON pl.id = c.player_id
  WHERE NOT pl.is_private),
solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN ci USING (player_id, puzzle_id) WHERE NOT t.suspicious),
x AS (SELECT ci.puzzle_id, count(*) AS owners, count(*) FILTER (WHERE s.player_id IS NULL) AS unsolved
      FROM ci LEFT JOIN solved s USING (player_id, puzzle_id) GROUP BY 1 HAVING count(*) FILTER (WHERE s.player_id IS NULL) >= 1)
SELECT p.name AS puzzle, m.name AS brand, x.unsolved, p.image, p.image_ratio
FROM x JOIN puzzle p ON p.id = x.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE (p.hide_until IS NULL OR p.hide_until <= now()) AND p.image IS NOT NULL
  AND (p.hide_image_until IS NULL OR p.hide_image_until <= now())
ORDER BY x.unsolved DESC, x.owners DESC, p.id LIMIT 1200;
