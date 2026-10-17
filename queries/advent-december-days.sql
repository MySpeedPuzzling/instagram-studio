-- Advent of Puzzle calendar check (2026-10-17): results finished per day from 20 Nov to 3 Jan of the last two seasons,
-- by local solve date (finished_at, falling back to tracked_at), so the campaign can see whether 24–26 Dec are quiet
-- or busy puzzling days. Aggregate only. Suspicious results and private profiles excluded (CLAUDE.md data rules).
SELECT coalesce(t.finished_at, t.tracked_at)::date AS day,
       to_char(coalesce(t.finished_at, t.tracked_at), 'Dy') AS dow,
       count(*) AS results, count(DISTINCT t.player_id) AS puzzlers
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
WHERE NOT t.suspicious AND NOT pl.is_private
  AND (coalesce(t.finished_at, t.tracked_at) >= '2024-11-20' AND coalesce(t.finished_at, t.tracked_at) < '2025-01-04'
    OR coalesce(t.finished_at, t.tracked_at) >= '2025-11-20' AND coalesce(t.finished_at, t.tracked_at) < '2026-01-04')
GROUP BY 1, 2 ORDER BY 1;
