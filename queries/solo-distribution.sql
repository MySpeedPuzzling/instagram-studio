-- Solo solve-time percentiles (minutes) for the common piece counts.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT p.pieces_count, count(*) AS results,
  round((percentile_cont(0.10) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p10,
  round((percentile_cont(0.25) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p25,
  round((percentile_cont(0.50) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p50,
  round((percentile_cont(0.75) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p75,
  round((percentile_cont(0.90) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p90
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0 AND p.pieces_count IN (500, 1000)
GROUP BY 1 ORDER BY 1;
