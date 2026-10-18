-- "Start here" explainer (about post): the most-solved puzzle of each of the 12 most-solved brands, with its box
-- image, for a wall that shows the range of the database (the all-time top 60 is almost all one brand).
-- Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13); embargoed puzzles and
-- hidden box images skipped.
WITH s AS (
  SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image,
         count(DISTINCT t.player_id) AS solvers
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND pz.approved
    AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  GROUP BY 1, 2, 3, 4, 5),
b AS (SELECT brand, sum(solvers) AS brand_solves FROM s GROUP BY 1 ORDER BY 2 DESC LIMIT 12)
SELECT DISTINCT ON (b.brand_solves, s.brand) s.puzzle_id, s.puzzle, s.brand, s.pieces, s.image, s.solvers, b.brand_solves
FROM s JOIN b ON b.brand = s.brand
ORDER BY b.brand_solves DESC, s.brand, s.solvers DESC;
