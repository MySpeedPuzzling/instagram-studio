-- Results logged per day since 28 Sep 2026, and how many were back-filled (solved more than 7 days before logging).
SELECT tracked_at::date AS day, count(*) AS results,
       count(*) FILTER (WHERE coalesce(finished_at, tracked_at)::date < tracked_at::date - 7) AS backfilled
FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at >= '2026-09-28'
GROUP BY 1 ORDER BY 1;
