-- The monthly recap's mosaic: the 1000 most-solved puzzles of the last full month (distinct solvers, then results),
-- solves finished in the month, with box image paths. Embargoed puzzles and hidden box images excluded.
-- Private profiles excluded (results by players with player.is_private never count; owner decision 2026-10-13).
WITH m AS (SELECT date_trunc('month', now()) - interval '1 month' AS start, date_trunc('month', now()) AS stop)
SELECT pz.id AS puzzle_id, pz.name AS puzzle, mf.name AS brand, pz.pieces_count AS pieces, pz.image,
       count(DISTINCT t.player_id) AS solvers, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer mf ON mf.id = pz.manufacturer_id, m
WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= m.start AND t.finished_at >= m.start AND t.finished_at < m.stop
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3, 4, 5 ORDER BY 6 DESC, 7 DESC, 1 LIMIT 1000;
