-- Brainstorm 2026-10: XP launch archaeology - results logged since 2026-10-12 by solve year (how far back people dug).
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT extract(year FROM t.finished_at)::int AS solve_year, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= '2026-10-12' AND t.finished_at IS NOT NULL
GROUP BY 1 ORDER BY 1;
