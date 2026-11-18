-- "300 million pieces" Reel (2026-11-18): results and pieces logged per calendar month from November 2023 (the first
-- full month after MSP's first commit) up to the last full month: the growth chart under the flashback.
-- Not suspicious, private profiles excluded. Aggregate only.
SELECT date_trunc('month', t.tracked_at)::date AS month, count(*) AS results, sum(p.pieces_count) AS pieces
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= '2023-11-01' AND t.tracked_at < date_trunc('month', now())
GROUP BY 1 ORDER BY 1;
