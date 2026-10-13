-- Brainstorm 2026-10: each country's signature puzzle - the puzzle most over-represented among that country's solvers
-- vs the world (lift; >= 15 local solvers), for countries with >= 80 puzzlers. Embargoed puzzles excluded. Aggregate only.
WITH s AS (
  SELECT DISTINCT upper(pl.country) AS cc, t.player_id, t.puzzle_id
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE NOT t.suspicious AND nullif(pl.country, '') IS NOT NULL),
cn AS (SELECT cc, count(DISTINCT player_id) AS n FROM s GROUP BY 1 HAVING count(DISTINCT player_id) >= 80),
wn AS (SELECT count(DISTINCT player_id) AS n FROM s),
pw AS (SELECT puzzle_id, count(*) AS w FROM s GROUP BY 1),
pc AS (SELECT s.cc, s.puzzle_id, count(*) AS k FROM s JOIN cn USING (cc) GROUP BY 1, 2 HAVING count(*) >= 15),
ranked AS (
  SELECT pc.cc, pc.puzzle_id, pc.k, cn.n, round(100.0 * pc.k / cn.n, 1) AS pct_local,
         round((pc.k::numeric / cn.n) / (pw.w::numeric / (SELECT n FROM wn)), 1) AS lift,
         row_number() OVER (PARTITION BY pc.cc ORDER BY (pc.k::numeric / cn.n) / (pw.w::numeric / (SELECT n FROM wn)) DESC) AS rk
  FROM pc JOIN cn USING (cc) JOIN pw USING (puzzle_id))
SELECT r.cc, r.n AS puzzlers, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, r.k AS local_solvers, r.pct_local, r.lift
FROM ranked r JOIN puzzle p ON p.id = r.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE r.rk = 1 AND (p.hide_until IS NULL OR p.hide_until <= now()) ORDER BY r.n DESC;
