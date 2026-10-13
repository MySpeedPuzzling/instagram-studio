-- Brainstorm 2026-10: is the community getting faster? Solo 500 by solve year: results, median, p10, first-try share,
-- and share of results under 60 minutes. Aggregate only.
SELECT extract(year FROM coalesce(t.finished_at, t.tracked_at))::int AS year, count(*) AS solo_500,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS median_min,
       round((percentile_cont(0.1) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric / 60, 1) AS p10_min,
       round(100.0 * count(*) FILTER (WHERE t.first_attempt) / count(*), 1) AS pct_first_try,
       round(100.0 * count(*) FILTER (WHERE t.seconds_to_solve < 3600) / count(*), 1) AS pct_sub_hour
FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND t.puzzling_type = 'solo' AND p.pieces_count = 500 AND t.seconds_to_solve > 0
  AND coalesce(t.finished_at, t.tracked_at) >= '2021-01-01' AND coalesce(t.finished_at, t.tracked_at) < now()
GROUP BY 1 ORDER BY 1;
