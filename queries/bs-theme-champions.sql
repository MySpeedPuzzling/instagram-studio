-- Brainstorm 2026-10: the most-solved puzzle per theme (distinct solvers), with brand, pieces and solo median.
-- Embargoed puzzles/images excluded. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?|kitty|kitties)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M'), ('birds', '\m(birds?|parrots?|peacocks?|flamingos?|hummingbirds?)\M'),
  ('lighthouses', '\mlighthouses?\M'), ('christmas', '\m(christmas|xmas|santa|advent|nativity|snowman|winter wonderland)\M'),
  ('halloween', '\m(halloween|pumpkins?|spooky|haunted|witch(es)?|ghosts?|skeletons?)\M'), ('flowers', '\m(flowers?|floral|roses?|tulips?|sunflowers?|blooms?|bouquet|garden)\M'),
  ('mushrooms', '\mmushrooms?\M'), ('books', '\m(books?|library|libraries|bookshop|bookstore|reading)\M'), ('tea_coffee', '\m(tea|coffee|cafe|café)\M'),
  ('maps', '\m(maps?|atlas)\M'), ('space', '\m(space|planets?|galaxy|moon|astronaut|universe)\M'), ('ocean', '\m(ocean|underwater|coral|reef|fish|whales?|octopus)\M'),
  ('food', '\m(food|candy|sweets|cake|donuts?|pizza|ice cream|chocolate|macarons?|fruit)\M'), ('butterflies', '\mbutterfl(y|ies)\M'), ('horses', '\mhorses?\M'),
  ('dinosaurs', '\m(dinosaurs?|t-rex)\M'), ('owls', '\mowls?\M'), ('foxes', '\mfox(es)?\M'), ('unicorns_dragons', '\m(unicorns?|dragons?)\M'),
  ('trains', '\m(trains?|railway)\M'), ('harry_potter', '\m(harry potter|hogwarts)\M'), ('star_wars', '\mstar wars\M'), ('art_masters', '\m(van gogh|monet|klimt|vermeer|hokusai|starry night)\M'),
  ('wine_beer', '\m(wine|beer|cocktails?)\M'), ('autumn', '\mautumn\M'), ('dogs_and_cats', '\m(dogs?).*(cats?)\M|\m(cats?).*(dogs?)\M')
),
ps AS (SELECT t.puzzle_id, count(DISTINCT t.player_id) AS solvers, count(*) AS results,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type='solo' AND t.seconds_to_solve > 0))::numeric/60,1) AS median_solo_min
       FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1),
ranked AS (
  SELECT th.theme, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, ps.solvers, ps.results, ps.median_solo_min,
         row_number() OVER (PARTITION BY th.theme ORDER BY ps.solvers DESC) AS rk
  FROM themes th JOIN puzzle p ON p.name ~* th.rx JOIN ps ON ps.puzzle_id = p.id JOIN manufacturer m ON m.id = p.manufacturer_id
  WHERE (p.hide_until IS NULL OR p.hide_until <= now()) AND (p.hide_image_until IS NULL OR p.hide_image_until <= now()))
SELECT theme, rk, puzzle, brand, pieces, solvers, results, median_solo_min FROM ranked WHERE rk <= 2 ORDER BY theme, rk;
