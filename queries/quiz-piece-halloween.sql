-- "Which puzzle is this piece from?" quiz, Halloween edition (2026-10-30): Halloween-themed puzzles with box images,
-- their puzzlers, median and fastest solo time, and October results, so the quiz can pick the answer and look-alike
-- options. Aggregate only. Suspicious results, private profiles, embargoed puzzles and hidden images excluded
-- (CLAUDE.md data rules).
WITH hp AS (
  SELECT pz.id, pz.name, m.name AS brand, pz.pieces_count, pz.image
  FROM puzzle pz JOIN manufacturer m ON m.id = pz.manufacturer_id
  WHERE pz.name ~* '\m(halloween|pumpkins?|spooky|haunted|witch(es)?|ghosts?|skeletons?|trick or treat)\M'
    AND pz.image IS NOT NULL AND (pz.hide_image_until IS NULL OR pz.hide_image_until <= now())
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())
)
SELECT hp.id AS puzzle_id, hp.name AS puzzle, hp.brand, hp.pieces_count AS pieces, hp.image,
  count(DISTINCT t.player_id) AS solvers, count(*) AS results,
  count(*) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS solo_times,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0))::numeric) AS median_solo_s,
  min(t.seconds_to_solve) FILTER (WHERE t.puzzling_type = 'solo' AND t.seconds_to_solve > 0) AS fastest_solo_s,
  count(*) FILTER (WHERE coalesce(t.finished_at, t.tracked_at) >= date_trunc('month', now())) AS results_this_month
FROM hp JOIN puzzle_solving_time t ON t.puzzle_id = hp.id
JOIN player pl ON pl.id = t.player_id
WHERE NOT t.suspicious AND NOT pl.is_private
GROUP BY hp.id, hp.name, hp.brand, hp.pieces_count, hp.image
ORDER BY solvers DESC
LIMIT 15;
