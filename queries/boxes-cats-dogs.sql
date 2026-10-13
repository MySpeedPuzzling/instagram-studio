-- DL3 G1 (brainstorm A1): the most-solved cat- and dog-titled puzzles with box images (same title regexes as
-- bs-themes / bs-theme-champions; distinct solvers). Top 8 per side. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Embargoed puzzles and images excluded.
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?|kitty|kitties)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M')),
ps AS (SELECT t.puzzle_id, count(DISTINCT t.player_id) AS solvers, count(*) AS results,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0))::numeric / 60, 1) AS median_solo_min
       FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1),
ranked AS (
  SELECT th.theme, p.id AS puzzle_id, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, p.image, p.image_ratio,
         ps.solvers, ps.results, ps.median_solo_min, row_number() OVER (PARTITION BY th.theme ORDER BY ps.solvers DESC, p.id) AS rk
  FROM themes th JOIN puzzle p ON p.name ~* th.rx JOIN ps ON ps.puzzle_id = p.id JOIN manufacturer m ON m.id = p.manufacturer_id
  WHERE p.image IS NOT NULL AND (p.hide_until IS NULL OR p.hide_until <= now()) AND (p.hide_image_until IS NULL OR p.hide_image_until <= now()))
SELECT theme, rk, puzzle_id, puzzle, brand, pieces, solvers, results, median_solo_min, image, image_ratio FROM ranked WHERE rk <= 8 ORDER BY theme, rk;
