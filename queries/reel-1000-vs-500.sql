-- Reel "A 1000 isn't twice a 500": solo times for 500 vs 1000 pieces, for every pace and for the fastest, plus the
-- same-puzzler check (players who logged both sizes) so the ratio isn't just "different people solve 1000s", and the
-- most-solved 500 and 1000 with box images for the visual. Aggregates only, no player named.
-- Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13); embargoed puzzles and
-- images skipped. kind/a/b/c/d rows like bs-unboxed.
WITH t AS (
  SELECT t.player_id, p.pieces_count AS pieces, t.seconds_to_solve AS s
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0
    AND p.pieces_count IN (500, 1000) AND (p.hide_until IS NULL OR p.hide_until <= now())
), per_player AS (
  SELECT player_id,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY s) FILTER (WHERE pieces = 500) AS m500,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY s) FILTER (WHERE pieces = 1000) AS m1000,
         min(s) FILTER (WHERE pieces = 500) AS b500, min(s) FILTER (WHERE pieces = 1000) AS b1000
  FROM t GROUP BY player_id
), top AS (
  SELECT pz.pieces_count AS pieces, pz.name AS puzzle, m.name AS brand, pz.image, count(DISTINCT t.player_id) AS solvers,
         row_number() OVER (PARTITION BY pz.pieces_count ORDER BY count(DISTINCT t.player_id) DESC) AS rk
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND pz.pieces_count IN (500, 1000)
    AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  GROUP BY 1, 2, 3, 4
)
SELECT 'size' AS kind, pieces::text AS a, count(*)::text AS b,
       round(percentile_cont(0.25) WITHIN GROUP (ORDER BY s))::text || '/' || round(percentile_cont(0.5) WITHIN GROUP (ORDER BY s))::text
         || '/' || round(percentile_cont(0.75) WITHIN GROUP (ORDER BY s))::text AS c,
       min(s)::text AS d
FROM t GROUP BY pieces
UNION ALL
SELECT 'same_puzzlers', count(*)::text,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY m1000 / m500))::numeric, 2)::text,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b1000 / b500))::numeric, 2)::text,
       round(percentile_cont(0.5) WITHIN GROUP (ORDER BY m500))::text || '/' || round(percentile_cont(0.5) WITHIN GROUP (ORDER BY m1000))::text
FROM per_player WHERE m500 IS NOT NULL AND m1000 IS NOT NULL
UNION ALL
SELECT 'top_' || pieces, puzzle || ' · ' || brand, solvers::text, image, NULL FROM top WHERE rk <= 10;
