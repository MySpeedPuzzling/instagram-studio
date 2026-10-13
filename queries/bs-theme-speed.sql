-- Brainstorm 2026-10: which subjects are slowest? Solo 500-piece results grouped by theme words in the puzzle name
-- (raw solo medians, the public kind; each result counts once). Themes with >= 1,000 solo results. Aggregate only.
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M'), ('birds', '\m(birds?|owls?|parrots?|peacocks?)\M'),
  ('flowers', '\m(flowers?|floral|roses?|blooms?|bouquet)\M'), ('garden', '\mgarden\M'), ('cities', '\m(london|paris|new york|rome|venice|amsterdam|pisa)\M'),
  ('postcards', '\mpostcards?\M'), ('ocean', '\m(ocean|sea|underwater|coral|reef|fish)\M'), ('disney/pixar', '\m(disney|pixar)\M'),
  ('food/sweets', '\m(food|candy|sweets|cake|donuts?|ice cream|chocolate|fruit|macarons?)\M'), ('circle of colors', 'circle of colou?rs'),
  ('gradient/rainbow', '\m(gradient|rainbow|spectrum)\M'), ('library/books', '\m(books?|library)\M'), ('butterflies', '\mbutterfl(y|ies)\M'),
  ('sunset', '\msunset\M'), ('christmas', '\m(christmas|xmas|santa)\M'), ('lighthouse', '\mlighthouses?\M'), ('night/moon', '\m(night|moon|moonlight)\M'),
  ('mushrooms', '\mmushrooms?\M'), ('balloons', '\mballoons?\M'), ('national parks', '\mnational parks?\M'), ('mandala/pattern', '\m(mandalas?|patterns?|kaleidoscope)\M'),
  ('kawaii/cute', '\m(kawaii|cute)\M'), ('van haasteren', 'haasteren'), ('wysocki', 'wysocki'), ('forest', '\m(forest|woods|woodland)\M'),
  ('snow/winter', '\m(snow|winter)\M'), ('sky', '\msky\M'), ('red', '\mred\M'), ('blue', '\mblue\M'), ('black', '\mblack\M'), ('gold', '\mgold(en)?\M'))
SELECT th.theme, count(*) AS solo_results, count(DISTINCT p.id) AS puzzles,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS median_min
FROM themes th JOIN puzzle p ON p.name ~* th.rx AND p.pieces_count = 500 AND (p.hide_until IS NULL OR p.hide_until <= now())
JOIN puzzle_solving_time t ON t.puzzle_id = p.id AND NOT t.suspicious AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0
GROUP BY 1 HAVING count(*) >= 1000 ORDER BY 4 DESC;
