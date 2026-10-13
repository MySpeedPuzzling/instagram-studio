-- Brainstorm 2026-10: pace towards the next collective milestones - pieces, results and solving hours logged per
-- day over the last 28 days (excluding the XP launch day 2026-10-12), and current totals.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH recent AS (
  SELECT count(*) AS results, sum(p.pieces_count) AS pieces, sum(t.seconds_to_solve) / 3600.0 AS hours
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= now() - interval '28 days' AND t.tracked_at::date <> '2026-10-12'),
tot AS (
  SELECT count(*) AS results, sum(p.pieces_count) AS pieces, sum(t.seconds_to_solve) / 3600.0 AS hours
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private)
SELECT tot.results, tot.pieces, round(tot.hours) AS hours, round(tot.hours / 24 / 365.25, 2) AS years,
       round(recent.results / 27.0) AS results_per_day, round(recent.pieces / 27.0) AS pieces_per_day, round(recent.hours / 27.0) AS hours_per_day,
       (now()::date + ((300000000 - tot.pieces) / (recent.pieces / 27.0))::int) AS eta_300m_pieces,
       (now()::date + ((600000 - tot.results) / (recent.results / 27.0))::int) AS eta_600k_results,
       (now()::date + ((75 * 365.25 * 24 - tot.hours) / (recent.hours / 27.0))::int) AS eta_75_years
FROM tot, recent;
