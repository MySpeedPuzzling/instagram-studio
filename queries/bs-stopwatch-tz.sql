-- Brainstorm 2026-10: sanity check of the stopwatch lap time zone - hours between a session's last lap end and the
-- tracked_at of the stopwatch-created result for the same player and puzzle (0 = both UTC). Aggregate only.
WITH sw AS (
  SELECT s.player_id, s.puzzle_id, (s.laps -> (json_array_length(s.laps) - 1) ->> 'end')::timestamp AS last_end
  FROM stopwatch s WHERE s.status = 'finished' AND json_array_length(s.laps) > 0 LIMIT 5000)
SELECT round(extract(epoch FROM (t.tracked_at - sw.last_end)) / 3600.0) AS hours_diff, count(*) AS n
FROM sw JOIN puzzle_solving_time t ON t.player_id = sw.player_id AND t.puzzle_id = sw.puzzle_id AND t.created_via = 'stopwatch'
  AND t.tracked_at BETWEEN sw.last_end - interval '3 hours' AND sw.last_end + interval '3 hours'
GROUP BY 1 ORDER BY 2 DESC LIMIT 6;
