-- The monthly recap's chart: solves finished per calendar month from January 2025 up to the last full month, counted
-- like monthly-totals (finished in the month, so a backfill counts in the month it was solved). Older months had
-- longer to collect late-logged solves, so "biggest month ever" from this is conservative.
-- Private profiles excluded (player.is_private; 2026-10-13); suspicious results and embargoed puzzles excluded.
WITH m AS (SELECT date_trunc('month', now()) AS stop)
SELECT to_char(date_trunc('month', t.finished_at), 'YYYY-MM') AS month, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id, m
WHERE NOT t.suspicious AND NOT pl.is_private AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  AND t.tracked_at >= '2025-01-01' AND t.finished_at >= '2025-01-01' AND t.finished_at < m.stop
  -- as in monthly-totals: logged no earlier than the month it was finished in (keeps this month equal to the cover)
  AND t.tracked_at >= date_trunc('month', t.finished_at)
GROUP BY 1 ORDER BY 1;
