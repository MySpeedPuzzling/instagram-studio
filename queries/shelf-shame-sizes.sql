-- "Pile of shame" (2026-11-12, plot twist 3: "the big ones are just there to be admired"): share of collected
-- puzzles their owner has never logged a solve for, by piece-count band, plus the most-collected puzzles of 4000+
-- pieces. All collections, private ones included (nobody named, owner 2026-11-12); private profiles excluded;
-- embargoed puzzles excluded. Aggregate only.
WITH ci AS (SELECT DISTINCT c.player_id, c.puzzle_id FROM collection_item c JOIN player pl ON pl.id = c.player_id WHERE NOT pl.is_private),
solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN ci USING (player_id, puzzle_id) WHERE NOT t.suspicious),
x AS (SELECT ci.puzzle_id, p.pieces_count AS pc, (s.player_id IS NULL) AS unsolved
      FROM ci JOIN puzzle p ON p.id = ci.puzzle_id LEFT JOIN solved s USING (player_id, puzzle_id)
      WHERE p.hide_until IS NULL OR p.hide_until <= now()),
bands AS (SELECT CASE WHEN pc < 500 THEN 1 WHEN pc <= 500 THEN 2 WHEN pc < 1000 THEN 3 WHEN pc <= 1000 THEN 4 WHEN pc <= 2000 THEN 5 WHEN pc < 4000 THEN 6 ELSE 7 END AS band, unsolved FROM x)
SELECT 'band' AS kind, band::text AS k, NULL AS puzzle, NULL AS brand, NULL::int AS pieces, count(*) AS owners, count(*) FILTER (WHERE unsolved) AS unsolved,
       round(100.0 * count(*) FILTER (WHERE unsolved) / count(*)) AS pct_unsolved, NULL AS image, NULL::numeric AS image_ratio
FROM bands GROUP BY band
UNION ALL
(SELECT 'big', p.id::text, p.name, m.name, p.pieces_count, count(*), count(*) FILTER (WHERE x.unsolved), round(100.0 * count(*) FILTER (WHERE x.unsolved) / count(*)), p.image, p.image_ratio
 FROM x JOIN puzzle p ON p.id = x.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
 WHERE x.pc >= 4000 AND p.image IS NOT NULL AND (p.hide_image_until IS NULL OR p.hide_image_until <= now())
 GROUP BY p.id, p.name, m.name, p.pieces_count, p.image, p.image_ratio ORDER BY count(*) DESC LIMIT 6)
ORDER BY kind DESC, k;
