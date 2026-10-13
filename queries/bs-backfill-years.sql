-- Brainstorm 2026-10: XP launch archaeology - results logged since 2026-10-12 by solve year (how far back people dug).
SELECT extract(year FROM finished_at)::int AS solve_year, count(*) AS results
FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at >= '2026-10-12' AND finished_at IS NOT NULL
GROUP BY 1 ORDER BY 1;
