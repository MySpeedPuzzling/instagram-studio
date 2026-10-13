-- Brainstorm 2026-10: the life of a puzzle - days from a puzzle's first logged solve to its 100th distinct solver
-- (by logging date), fastest risers and the median. Embargoed puzzles excluded. Aggregate only.
WITH firsts AS (
  SELECT t.puzzle_id, t.player_id, min(t.tracked_at) AS first_at
  FROM puzzle_solving_time t WHERE NOT t.suspicious GROUP BY 1, 2),
ranked AS (
  SELECT puzzle_id, first_at, row_number() OVER (PARTITION BY puzzle_id ORDER BY first_at) AS n FROM firsts),
life AS (
  SELECT r1.puzzle_id, min(r1.first_at) FILTER (WHERE r1.n = 1) AS born,
         min(r1.first_at) FILTER (WHERE r1.n = 100) AS at100, max(r1.n) AS solvers
  FROM ranked r1 GROUP BY 1 HAVING max(r1.n) >= 100)
SELECT p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, life.solvers,
       life.born::date AS first_solve, round(extract(epoch FROM life.at100 - life.born) / 86400.0, 1) AS days_to_100,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM at100 - born) / 86400.0))::numeric, 0) FROM life) AS median_days_all,
       (SELECT count(*) FROM life) AS puzzles_100plus
FROM life JOIN puzzle p ON p.id = life.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE (p.hide_until IS NULL OR p.hide_until <= now())
ORDER BY days_to_100 ASC LIMIT 15;
