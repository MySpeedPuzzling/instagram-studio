-- "Pile of shame" (2026-11-12): puzzles with the highest share of owners who never logged a solve, among puzzles in at
-- least 40 collections (so a handful of owners can't top it). All collections, private ones included (nobody named,
-- owner 2026-11-12); private profiles excluded; embargoed puzzles and images excluded. Aggregate only.
WITH ci AS (SELECT DISTINCT c.player_id, c.puzzle_id FROM collection_item c JOIN player pl ON pl.id = c.player_id WHERE NOT pl.is_private),
solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN ci USING (player_id, puzzle_id) WHERE NOT t.suspicious),
x AS (SELECT ci.puzzle_id, count(*) AS owners, count(*) FILTER (WHERE s.player_id IS NULL) AS unsolved
      FROM ci LEFT JOIN solved s USING (player_id, puzzle_id) GROUP BY 1 HAVING count(*) >= 40)
SELECT p.id AS puzzle_id, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, x.owners, x.unsolved,
       round(100.0 * x.unsolved / x.owners) AS pct_unsolved, st.median_time_solo AS median_solo_s, st.solved_times_solo_count AS solo_solves, p.image, p.image_ratio
FROM x JOIN puzzle p ON p.id = x.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
LEFT JOIN puzzle_statistics st ON st.puzzle_id = p.id
WHERE (p.hide_until IS NULL OR p.hide_until <= now()) AND p.image IS NOT NULL
  AND (p.hide_image_until IS NULL OR p.hide_image_until <= now())
ORDER BY 100.0 * x.unsolved / x.owners DESC, x.owners DESC LIMIT 8;
