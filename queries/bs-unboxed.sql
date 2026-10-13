-- Brainstorm 2026-10: solving without the box image ("unboxed") - volume, puzzlers, fastest solo 500 and 1000, and the
-- most-unboxed puzzles. Aggregate only, anonymous.
WITH u AS (SELECT t.*, p.pieces_count, p.name, m.name AS brand FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
           WHERE NOT t.suspicious AND t.unboxed AND (p.hide_until IS NULL OR p.hide_until <= now()))
SELECT 'summary' AS kind, count(*)::text AS a, count(DISTINCT player_id)::text AS b,
       to_char(make_interval(secs => min(seconds_to_solve) FILTER (WHERE puzzling_type = 'solo' AND pieces_count = 500 AND seconds_to_solve > 0)), 'MI:SS') AS c,
       to_char(make_interval(secs => min(seconds_to_solve) FILTER (WHERE puzzling_type = 'solo' AND pieces_count = 1000 AND seconds_to_solve > 0)), 'HH24:MI:SS') AS d
FROM u
UNION ALL (SELECT 'top_puzzle', name || ' (' || brand || ', ' || pieces_count || ')', count(*)::text, count(DISTINCT player_id)::text, NULL FROM u GROUP BY name, brand, pieces_count ORDER BY count(*) DESC LIMIT 5);
