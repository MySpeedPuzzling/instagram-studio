-- Brainstorm 2026-10: country personalities (countries with >= 60 puzzlers with results): share of 1000+ piece results,
-- share of duo/team results, Ravensburger share, top brand other than Ravensburger, first-try share. Aggregate only.
-- Private profiles excluded (player.is_private; a group result counts when its owning player is public; 2026-10-13).
WITH r AS (
  SELECT upper(pl.country) AS cc, t.player_id, t.puzzling_type, t.first_attempt, p.pieces_count, m.name AS brand
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND nullif(pl.country, '') IS NOT NULL),
agg AS (
  SELECT cc, count(DISTINCT player_id) AS puzzlers, count(*) AS results,
         round(100.0 * count(*) FILTER (WHERE pieces_count >= 1000) / count(*), 1) AS pct_1000plus,
         round(100.0 * count(*) FILTER (WHERE pieces_count < 500) / count(*), 1) AS pct_under500,
         round(100.0 * count(*) FILTER (WHERE puzzling_type <> 'solo') / count(*), 1) AS pct_group,
         round(100.0 * count(*) FILTER (WHERE brand = 'Ravensburger') / count(*), 1) AS pct_ravensburger,
         round(100.0 * count(*) FILTER (WHERE first_attempt) / count(*), 1) AS pct_first_try
  FROM r GROUP BY 1 HAVING count(DISTINCT player_id) >= 60),
b AS (
  SELECT cc, brand, count(*) AS n, row_number() OVER (PARTITION BY cc ORDER BY count(*) DESC) AS rk
  FROM r WHERE brand <> 'Ravensburger' GROUP BY 1, 2)
SELECT agg.*, b.brand AS top_other_brand, round(100.0 * b.n / agg.results, 1) AS pct_top_other
FROM agg JOIN b ON b.cc = agg.cc AND b.rk = 1 ORDER BY agg.puzzlers DESC;
