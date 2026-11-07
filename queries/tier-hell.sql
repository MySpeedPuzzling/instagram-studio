-- Subject tier list, HELL tier (owner 2026-11-07: "a category on its own for puzzles like Krypt"): Ravensburger's
-- Krypt series (one colour, no picture), each puzzle's solo median with its piece count. Puzzles with >= 10 public
-- solo results. Aggregate only. Private profiles excluded (player.is_private; owner decision 2026-10-13).
-- Embargoed puzzles/images excluded; suspicious results excluded.
SELECT p.id AS puzzle_id, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, p.image, p.image_ratio,
       count(*) AS solo_results, count(DISTINCT t.player_id) AS solvers,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric) AS median_s,
       min(t.seconds_to_solve) AS fastest_s
FROM puzzle p
JOIN manufacturer m ON m.id = p.manufacturer_id
JOIN puzzle_solving_time t ON t.puzzle_id = p.id AND NOT t.suspicious AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0
JOIN player pl ON pl.id = t.player_id AND NOT pl.is_private
WHERE p.name ~* '^krypt\M' AND m.name = 'Ravensburger'
  AND (p.hide_until IS NULL OR p.hide_until <= now()) AND (p.hide_image_until IS NULL OR p.hide_image_until <= now())
GROUP BY p.id, m.name
HAVING count(*) >= 10
ORDER BY median_s DESC;
