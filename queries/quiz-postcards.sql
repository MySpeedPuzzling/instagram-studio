-- "Which is faster?" quiz, postcard family (2026-10-17): every 500-piece puzzle on MSP with "Postcard" in its name and
-- at least 100 solvers: solvers, solo results, median and fastest solo time, and pair (duo) results with their median.
-- Teams are left out (too few results per puzzle). Aggregate only.
-- Suspicious results and private profiles excluded; embargoed puzzles and hidden images skipped (CLAUDE.md data rules).
SELECT pz.id AS puzzle_id, pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces, pz.image,
       count(DISTINCT t.player_id) AS solvers,
       count(*) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS solo_results,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0))::numeric) AS median_solo_s,
       min(t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS fastest_solo_s,
       count(*) FILTER (WHERE t.puzzling_type = 'duo' AND t.seconds_to_solve > 0) AS duo_results,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'duo' AND t.seconds_to_solve > 0))::numeric) AS median_duo_s
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
WHERE NOT t.suspicious AND NOT pl.is_private AND pz.pieces_count = 500 AND pz.name ILIKE '%postcard%'
  AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
  AND (pz.hide_until IS NULL OR pz.hide_until <= now())
GROUP BY 1, 2, 3, 4, 5 HAVING count(DISTINCT t.player_id) >= 100
ORDER BY median_solo_s;
