-- Weekend Challenge dry run (2026-10-17): how big would a one-puzzle weekend challenge be? The puzzles the most distinct
-- puzzlers logged last weekend (Sat 00:00 to Sun 24:00, solve time), with how many of them have an Instagram handle on
-- their MSP profile. Counts only. Aggregate only; suspicious results and private profiles excluded (CLAUDE.md data rules).
WITH wk AS (SELECT (date_trunc('week', now() AT TIME ZONE 'Europe/Prague') - interval '2 days') AS sat)
SELECT pz.name AS puzzle, m.name AS brand,
       count(DISTINCT t.player_id) AS weekend_puzzlers, count(*) AS weekend_results,
       count(DISTINCT t.player_id) FILTER (WHERE pl.instagram IS NOT NULL AND pl.instagram <> '') AS with_instagram_handle
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id, wk
WHERE NOT t.suspicious AND NOT pl.is_private
  AND coalesce(t.finished_at, t.tracked_at) >= wk.sat AND coalesce(t.finished_at, t.tracked_at) < wk.sat + interval '2 days'
GROUP BY 1, 2 ORDER BY weekend_puzzlers DESC LIMIT 15;
