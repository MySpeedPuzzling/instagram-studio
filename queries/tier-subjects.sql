-- Subject tier list (2026-11-07, after the owner found the site's medians differ): MSP's own rule, as on every
-- puzzle page: each puzzler's best solo time on a puzzle counts once (puzzle_statistics.median_time_solo).
-- Per subject: (a) pooled median of every puzzler-puzzle best over the subject's 500-piece puzzles, (b) its
-- most-solved puzzle (most puzzlers) with that puzzle's own median. Title regexes as bs-theme-speed.
-- Shown numbers are rounded once, from puzzle_median_s (rounding the 0.1-min value again made 55.45 → 56).
-- Aggregate only. Private profiles excluded (player.is_private; owner decision 2026-10-13); suspicious results
-- excluded; embargoed puzzles and images excluded.
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M'), ('birds', '\m(birds?|owls?|parrots?|peacocks?)\M'),
  ('flowers', '\m(flowers?|floral|roses?|blooms?|bouquet)\M'), ('postcards', '\mpostcards?\M'), ('ocean', '\m(ocean|sea|underwater|coral|reef|fish)\M'),
  ('disney/pixar', '\m(disney|pixar)\M'), ('food/sweets', '\m(food|candy|sweets|cake|donuts?|ice cream|chocolate|fruit|macarons?)\M'),
  ('gradient/rainbow', '\m(gradient|rainbow|spectrum)\M'), ('library/books', '\m(books?|library)\M'), ('butterflies', '\mbutterfl(y|ies)\M'),
  ('christmas', '\m(christmas|xmas|santa)\M'), ('lighthouse', '\mlighthouses?\M'), ('mushrooms', '\mmushrooms?\M'), ('balloons', '\mballoons?\M'),
  ('national parks', '\mnational parks?\M'), ('kawaii/cute', '\m(kawaii|cute)\M'), ('snow/winter', '\m(snow|winter)\M')),
best AS (
  SELECT t.puzzle_id, t.player_id, min(t.seconds_to_solve) AS s
  FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id AND p.pieces_count = 500 AND (p.hide_until IS NULL OR p.hide_until <= now())
  JOIN player pl ON pl.id = t.player_id AND NOT pl.is_private
  WHERE NOT t.suspicious AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0 GROUP BY 1, 2),
tb AS (SELECT th.theme, b.* FROM themes th JOIN puzzle p ON p.name ~* th.rx JOIN best b ON b.puzzle_id = p.id),
subj AS (
  SELECT theme, count(*) AS puzzler_results, count(DISTINCT puzzle_id) AS puzzles, count(DISTINCT player_id) AS puzzlers,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY s))::numeric / 60, 1) AS median_min FROM tb GROUP BY 1),
perp AS (
  SELECT theme, puzzle_id, count(*) AS puzzlers, round((percentile_cont(0.5) WITHIN GROUP (ORDER BY s))::numeric / 60, 1) AS median_min,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY s))::numeric) AS median_s,
         row_number() OVER (PARTITION BY theme ORDER BY count(*) DESC, puzzle_id) AS rk FROM tb GROUP BY 1, 2)
SELECT s.theme, s.median_min AS subject_median_min, s.puzzles, s.puzzlers, s.puzzler_results,
       pp.puzzle_id, p.name AS puzzle, m.name AS brand, pp.puzzlers AS puzzle_puzzlers, pp.median_min AS puzzle_median_min, pp.median_s AS puzzle_median_s, p.image, p.image_ratio
FROM subj s JOIN perp pp ON pp.theme = s.theme AND pp.rk <= 3 JOIN puzzle p ON p.id = pp.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE p.image IS NOT NULL AND (p.hide_image_until IS NULL OR p.hide_image_until <= now())
ORDER BY s.median_min, s.theme, pp.rk;
