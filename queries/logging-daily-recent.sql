-- Results logged per day since 28 Sep 2026, and how many were back-filled (solved more than 7 days before logging).
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT t.tracked_at::date AS day, count(*) AS results,
       count(*) FILTER (WHERE coalesce(t.finished_at, t.tracked_at)::date < t.tracked_at::date - 7) AS backfilled
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= '2026-09-28'
GROUP BY 1 ORDER BY 1;
