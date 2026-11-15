-- Import launch (2026-11-15): results typed in by hand long after the solve, the work the spreadsheet import saves.
-- "Back-dated" = added in the last 12 months through the add form (created_via form, or empty before that column
-- existed) with a finish date more than 30 days before the day it was added (the app's own definition, data-import
-- README "Why"). Stopwatch and event-import results are left out. Suspicious results and private profiles excluded.
-- Aggregate only: no player is named or identifiable.
WITH b AS (
  SELECT t.player_id, t.tracked_at
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE t.tracked_at >= now() - interval '12 months'
    AND coalesce(t.created_via, 'form') = 'form'
    AND NOT t.suspicious AND NOT pl.is_private
    AND t.finished_at < t.tracked_at - interval '30 days'),
per AS (SELECT player_id, count(*) AS n FROM b GROUP BY 1),
added AS (
  SELECT count(*) AS n FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE t.tracked_at >= now() - interval '12 months' AND NOT t.suspicious AND NOT pl.is_private)
SELECT (SELECT count(*) FROM b) AS backdated,
       (SELECT count(*) FROM per) AS puzzlers,
       (SELECT count(*) FROM per WHERE n >= 50) AS puzzlers_50plus,
       (SELECT count(*) FROM per WHERE n >= 100) AS puzzlers_100plus,
       (SELECT n FROM added) AS added_all,
       round(100.0 * (SELECT count(*) FROM b) / (SELECT n FROM added), 1) AS pct_of_added,
       (now() - interval '12 months')::date AS since;
