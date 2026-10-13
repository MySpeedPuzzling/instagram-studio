-- DL3 G1 (brainstorm A2): representative boxes per subject for the speed tier list: the 500-piece puzzles with the
-- most solo results per subject (same title regexes as bs-theme-speed), top 3 each, with their own solo medians.
-- Aggregate only. Private profiles excluded (player.is_private; owner decision 2026-10-13). Embargoed puzzles/images excluded.
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M'), ('birds', '\m(birds?|owls?|parrots?|peacocks?)\M'),
  ('flowers', '\m(flowers?|floral|roses?|blooms?|bouquet)\M'), ('garden', '\mgarden\M'), ('cities', '\m(london|paris|new york|rome|venice|amsterdam|pisa)\M'),
  ('postcards', '\mpostcards?\M'), ('ocean', '\m(ocean|sea|underwater|coral|reef|fish)\M'), ('disney/pixar', '\m(disney|pixar)\M'),
  ('food/sweets', '\m(food|candy|sweets|cake|donuts?|ice cream|chocolate|fruit|macarons?)\M'), ('circle of colors', 'circle of colou?rs'),
  ('gradient/rainbow', '\m(gradient|rainbow|spectrum)\M'), ('library/books', '\m(books?|library)\M'), ('butterflies', '\mbutterfl(y|ies)\M'),
  ('sunset', '\msunset\M'), ('christmas', '\m(christmas|xmas|santa)\M'), ('lighthouse', '\mlighthouses?\M'), ('night/moon', '\m(night|moon|moonlight)\M'),
  ('mushrooms', '\mmushrooms?\M'), ('balloons', '\mballoons?\M'), ('national parks', '\mnational parks?\M'), ('mandala/pattern', '\m(mandalas?|patterns?|kaleidoscope)\M'),
  ('kawaii/cute', '\m(kawaii|cute)\M'), ('forest', '\m(forest|woods|woodland)\M'), ('snow/winter', '\m(snow|winter)\M')),
solo AS (
  SELECT t.puzzle_id, count(*) AS solo_results, count(DISTINCT t.player_id) AS solvers,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS median_min
  FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id AND p.pieces_count = 500 JOIN player pl ON pl.id = t.player_id AND NOT pl.is_private
  WHERE NOT t.suspicious AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0 GROUP BY 1),
ranked AS (
  SELECT th.theme, p.id AS puzzle_id, p.name AS puzzle, m.name AS brand, p.image, p.image_ratio, solo.solo_results, solo.solvers, solo.median_min,
         row_number() OVER (PARTITION BY th.theme ORDER BY solo.solo_results DESC, p.id) AS rk
  FROM themes th JOIN puzzle p ON p.name ~* th.rx AND p.pieces_count = 500 JOIN solo ON solo.puzzle_id = p.id JOIN manufacturer m ON m.id = p.manufacturer_id
  WHERE p.image IS NOT NULL AND (p.hide_until IS NULL OR p.hide_until <= now()) AND (p.hide_image_until IS NULL OR p.hide_image_until <= now()))
SELECT theme, rk, puzzle_id, puzzle, brand, solo_results, solvers, median_min, image, image_ratio FROM ranked WHERE rk <= 3 ORDER BY theme, rk;
