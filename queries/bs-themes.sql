-- Brainstorm 2026-10: puzzle themes by whole-word match in puzzle names (aggregate: puzzles, solvers, results).
-- A puzzle can belong to several themes. Embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH themes(theme, rx) AS (VALUES
  ('cats', '\m(cats?|kittens?|kitty|kitties)\M'), ('dogs', '\m(dogs?|puppy|puppies)\M'),
  ('birds', '\m(birds?|owls?|parrots?|peacocks?|flamingos?|hummingbirds?)\M'),
  ('lighthouses', '\mlighthouses?\M'), ('christmas', '\m(christmas|xmas|santa|advent|nativity|snowman|winter wonderland)\M'),
  ('halloween', '\m(halloween|pumpkins?|spooky|haunted|witch(es)?|ghosts?|skeletons?)\M'),
  ('flowers', '\m(flowers?|floral|roses?|tulips?|sunflowers?|blooms?|bouquet|garden)\M'),
  ('mushrooms', '\mmushrooms?\M'), ('books', '\m(books?|library|libraries|bookshop|bookstore|reading)\M'),
  ('tea_coffee', '\m(tea|coffee|cafe|café)\M'), ('cities', '\m(london|paris|new york|rome|venice|tokyo|amsterdam|prague|barcelona|pisa)\M'),
  ('postcards', '\mpostcards?\M'), ('maps', '\m(maps?|atlas|world)\M'), ('space', '\m(space|planets?|galaxy|moon|stars|astronaut|universe)\M'),
  ('ocean', '\m(ocean|sea|underwater|coral|reef|fish|whales?|octopus)\M'), ('disney', '\m(disney|pixar|mickey|frozen|toy story)\M'),
  ('harry_potter', '\m(harry potter|hogwarts)\M'), ('star_wars', '\mstar wars\M'), ('food', '\m(food|candy|sweets|cake|donuts?|pizza|ice cream|chocolate|macarons?|fruit)\M'),
  ('gradient_color', '\m(gradient|colou?rs?|rainbow|spectrum|palette)\M'), ('national_parks', '\mnational parks?\M'),
  ('trains_cars', '\m(trains?|railway|cars?|bus|vespa|bicycles?)\M'), ('butterflies', '\mbutterfl(y|ies)\M'),
  ('horses', '\mhorses?\M'), ('dinosaurs', '\m(dinosaurs?|t-rex)\M'), ('mountains', '\m(mountains?|alps|glacier)\M'),
  ('beach_summer', '\m(beach|summer|seaside)\M'), ('autumn', '\m(autumn|fall)\M'), ('kawaii_cute', '\m(kawaii|cute)\M'),
  ('art_masters', '\m(van gogh|monet|klimt|vermeer|hokusai|da vinci|starry night)\M'), ('wine_beer', '\m(wine|beer|cocktails?|pub|bar)\M'),
  ('balloons', '\m(balloons?)\M'), ('owls', '\mowls?\M'), ('foxes', '\mfox(es)?\M'), ('unicorns_dragons', '\m(unicorns?|dragons?)\M')
),
ps AS (
  SELECT t.puzzle_id, count(*) AS results, count(DISTINCT t.player_id) AS solvers
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1)
SELECT th.theme, count(DISTINCT p.id) AS puzzles_in_catalogue, count(DISTINCT ps.puzzle_id) AS puzzles_solved,
  coalesce(sum(ps.results), 0) AS results, coalesce(sum(ps.solvers), 0) AS solver_puzzle_pairs
FROM themes th JOIN puzzle p ON p.name ~* th.rx AND (p.hide_until IS NULL OR p.hide_until <= now())
LEFT JOIN ps ON ps.puzzle_id = p.id
GROUP BY 1 ORDER BY 4 DESC;
