-- "300 million pieces" Reel (2026-11-18): results and pieces logged per month before 2025 (when logging took off).
-- Not suspicious, private profiles excluded. Aggregate only.
SELECT date_trunc('month', t.tracked_at)::date AS month, count(*) AS results, sum(p.pieces_count) AS pieces
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at < '2025-01-01'
GROUP BY 1 ORDER BY 1 LIMIT 40;
