-- "The 59-minute wall": solo 500-piece results per whole minute, 30–90 min.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT t.seconds_to_solve / 60 AS minute, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND p.pieces_count = 500
  AND t.seconds_to_solve / 60 BETWEEN 30 AND 90
GROUP BY 1 ORDER BY 1;
