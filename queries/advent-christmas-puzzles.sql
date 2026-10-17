-- Advent of Puzzle (2026-10-17): the most-solved Christmas and winter puzzles (title match, as bs-seasonal-themes),
-- with box images for quiz doors: solvers, solo median and fastest solo time, and the share of their results solved in
-- December. Puzzles with at least 30 solvers. Aggregate only; title matching can't see the picture (standing feedback).
-- Suspicious results and private profiles excluded; embargoed puzzles and hidden images skipped (CLAUDE.md data rules).
SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image,
       CASE WHEN pz.name ~* '\m(christmas|xmas|santa|advent|nativity|snowman|weihnacht\w*|noel)\M' THEN 'christmas' ELSE 'winter' END AS theme,
       count(DISTINCT t.player_id) AS solvers, count(*) AS results,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0))::numeric) AS median_solo_s,
       min(t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS fastest_solo_s,
       round(100.0 * count(*) FILTER (WHERE extract(month FROM coalesce(t.finished_at, t.tracked_at)) = 12) / count(*), 1) AS pct_december
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE NOT t.suspicious AND NOT pl.is_private
  AND pz.name ~* '\m(christmas|xmas|santa|advent|nativity|snowman|weihnacht\w*|noel|winter|snow|snowy)\M'
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3, 4, 5, 6 HAVING count(DISTINCT t.player_id) >= 30
ORDER BY solvers DESC LIMIT 40;
