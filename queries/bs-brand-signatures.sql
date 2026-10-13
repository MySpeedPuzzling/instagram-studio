-- Brainstorm 2026-10: each big brand's signature subject - the theme most over-represented in its catalogue vs the
-- whole catalogue (lift), for brands with >= 300 catalogue puzzles. Aggregate only.
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M'), ('birds', '\m(birds?|owls?|parrots?)\M'),
  ('christmas', '\m(christmas|xmas|santa|snowman)\M'), ('flowers/garden', '\m(flowers?|floral|roses?|garden)\M'),
  ('cities', '\m(london|paris|new york|rome|venice|amsterdam|prague|barcelona)\M'), ('maps/world', '\m(maps?|atlas|world)\M'),
  ('ocean', '\m(ocean|sea|underwater|coral|reef|fish)\M'), ('disney/film', '\m(disney|pixar|marvel|star wars|harry potter)\M'),
  ('food/sweets', '\m(food|candy|sweets|cake|donuts?|ice cream|chocolate|fruit)\M'), ('vintage/nostalgia', '\m(vintage|retro|nostalgic|antique)\M'),
  ('art/painting', '\m(van gogh|monet|klimt|painting|art)\M'), ('mountains/lakes', '\m(mountains?|lake|alps|glacier)\M'), ('cars/trains', '\m(cars?|trains?|railway|truck)\M'),
  ('books/library', '\m(books?|library|bookshop)\M'), ('wildlife', '\m(tiger|lion|elephant|wolf|wolves|bear|fox|deer|horse)s?\M'),
  ('kids/cartoon', '\m(paw patrol|peppa|bluey|frozen|princess|unicorn)s?\M'), ('gradient/colour', '\m(gradient|colou?rs?|rainbow)\M'),
  ('cottage/village', '\m(cottage|village|town|street)s?\M')),
big AS (SELECT manufacturer_id, count(*) AS n FROM puzzle WHERE (hide_until IS NULL OR hide_until <= now()) GROUP BY 1 HAVING count(*) >= 300),
tot AS (SELECT count(*) AS n FROM puzzle WHERE (hide_until IS NULL OR hide_until <= now())),
overall AS (SELECT th.theme, count(*)::numeric / (SELECT n FROM tot) AS share FROM themes th JOIN puzzle p ON p.name ~* th.rx GROUP BY 1),
bt AS (
  SELECT b.manufacturer_id, th.theme, count(*) AS k, b.n
  FROM big b JOIN puzzle p ON p.manufacturer_id = b.manufacturer_id JOIN themes th ON p.name ~* th.rx
  WHERE (p.hide_until IS NULL OR p.hide_until <= now()) GROUP BY 1, 2, 4),
ranked AS (
  SELECT bt.*, round((bt.k::numeric / bt.n) / o.share, 1) AS lift, row_number() OVER (PARTITION BY bt.manufacturer_id ORDER BY (bt.k::numeric / bt.n) / o.share DESC) AS rk
  FROM bt JOIN overall o USING (theme) WHERE bt.k >= 15)
SELECT m.name AS brand, r.n AS catalogue, r.theme, r.k AS puzzles_on_theme, round(100.0 * r.k / r.n, 1) AS pct_of_catalogue, r.lift
FROM ranked r JOIN manufacturer m ON m.id = r.manufacturer_id WHERE r.rk <= 2 ORDER BY r.n DESC, r.rk;
