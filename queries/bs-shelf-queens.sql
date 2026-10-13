-- Brainstorm 2026-10: "shelf queens" - puzzles most often sitting in collections unsolved by their owner (>= 40 owners),
-- with the unsolved share. Embargoed puzzles excluded. Aggregate only.
WITH solved AS (SELECT DISTINCT player_id, puzzle_id FROM puzzle_solving_time WHERE NOT suspicious),
ci AS (SELECT DISTINCT player_id, puzzle_id FROM collection_item),
x AS (SELECT ci.puzzle_id, count(*) AS owners, count(*) FILTER (WHERE s.player_id IS NULL) AS unsolved
      FROM ci LEFT JOIN solved s USING (player_id, puzzle_id) GROUP BY 1 HAVING count(*) >= 40)
SELECT p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, x.owners, x.unsolved, round(100.0 * x.unsolved / x.owners) AS pct_unsolved
FROM x JOIN puzzle p ON p.id = x.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE (p.hide_until IS NULL OR p.hide_until <= now())
ORDER BY x.unsolved DESC LIMIT 12;
