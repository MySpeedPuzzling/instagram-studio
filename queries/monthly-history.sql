-- The monthly recap's chart: results logged per calendar month from January 2025 up to the last full month, counted
-- like monthly-totals and MSP's statistics page (owner 2026-11-01: match the website).
-- Private profiles excluded (player.is_private; 2026-10-13); suspicious results and embargoed puzzles excluded.
WITH m AS (SELECT date_trunc('month', now()) AS stop)
SELECT to_char(date_trunc('month', t.tracked_at), 'YYYY-MM') AS month, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id, m
WHERE NOT t.suspicious AND NOT pl.is_private AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  AND t.tracked_at >= '2025-01-01' AND t.tracked_at < m.stop
GROUP BY 1 ORDER BY 1;
