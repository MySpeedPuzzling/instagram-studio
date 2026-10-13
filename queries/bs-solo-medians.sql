-- Brainstorm 2026-10 (D1 clocks go back): median solo solve time (minutes) per common piece count, to say what one
-- extra hour buys. Embargoed puzzles skipped. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT p.pieces_count, count(*) AS results,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p50
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0
  AND p.pieces_count IN (100, 200, 300, 500, 1000) AND (p.hide_until IS NULL OR p.hide_until <= now())
GROUP BY 1 ORDER BY 1;
