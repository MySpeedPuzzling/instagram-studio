-- DL3 G1 (brainstorm B1): each country's signature puzzle with its box image and the world rate behind the lift.
-- Same rule as bs-country-puzzles (>= 80 puzzlers per country, >= 15 local solvers, highest lift vs the world);
-- ranks 1-3 per country so a hidden image never forces a different pick silently. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Embargoed puzzles excluded; image null if embargoed.
WITH s AS (
  SELECT DISTINCT upper(pl.country) AS cc, t.player_id, t.puzzle_id
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND nullif(pl.country, '') IS NOT NULL),
cn AS (SELECT cc, count(DISTINCT player_id) AS n FROM s GROUP BY 1 HAVING count(DISTINCT player_id) >= 80),
wn AS (SELECT count(DISTINCT player_id) AS n FROM s),
pw AS (SELECT puzzle_id, count(*) AS w FROM s GROUP BY 1),
pc AS (SELECT s.cc, s.puzzle_id, count(*) AS k FROM s JOIN cn USING (cc) GROUP BY 1, 2 HAVING count(*) >= 15),
ranked AS (
  SELECT pc.cc, pc.puzzle_id, pc.k, cn.n, pw.w,
         row_number() OVER (PARTITION BY pc.cc ORDER BY (pc.k::numeric / cn.n) / (pw.w::numeric / (SELECT n FROM wn)) DESC) AS rk
  FROM pc JOIN cn USING (cc) JOIN pw USING (puzzle_id))
SELECT r.cc, r.rk, r.n AS puzzlers, p.id AS puzzle_id, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces,
       r.k AS local_solvers, round(100.0 * r.k / r.n, 1) AS pct_local,
       r.w AS world_solvers, (SELECT n FROM wn) AS world_puzzlers, round(100.0 * r.w / (SELECT n FROM wn), 2) AS pct_world,
       round((r.k::numeric / r.n) / (r.w::numeric / (SELECT n FROM wn)), 1) AS lift,
       CASE WHEN p.hide_image_until IS NULL OR p.hide_image_until <= now() THEN p.image END AS image, p.image_ratio
FROM ranked r JOIN puzzle p ON p.id = r.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE r.rk <= 3 AND (p.hide_until IS NULL OR p.hide_until <= now()) ORDER BY r.n DESC, r.cc, r.rk;
