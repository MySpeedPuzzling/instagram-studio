-- Brainstorm 2026-10: the piece-count landscape - every distinct piece count with results (catalogue size, results,
-- solvers), to find odd sizes and the long tail. Aggregate only.
SELECT p.pieces_count AS pieces, count(DISTINCT p.id) AS puzzles, count(t.id) AS results, count(DISTINCT t.player_id) AS solvers
FROM puzzle p LEFT JOIN puzzle_solving_time t ON t.puzzle_id = p.id AND NOT t.suspicious
WHERE (p.hide_until IS NULL OR p.hide_until <= now())
GROUP BY 1 ORDER BY 3 DESC;
