-- Brainstorm 2026-10: when do people actually START puzzling? Local start hour of finished stopwatch sessions for
-- players in Central European countries (lap timestamps stored in UTC, converted to Europe/Prague). Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH s AS (
  SELECT ((sw.laps -> 0 ->> 'start')::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') AS local_start,
         json_array_length(sw.laps) - 1 AS pauses
  FROM stopwatch sw JOIN player pl ON pl.id = sw.player_id
  WHERE sw.status = 'finished' AND json_array_length(sw.laps) > 0 AND NOT pl.is_private
    AND upper(pl.country) IN ('DE','CZ','AT','CH','NL','BE','DK','SE','NO','PL','FR','ES','IT','HU','SK','SI','HR','LU'))
SELECT extract(hour FROM local_start)::int AS local_hour, count(*) AS sessions,
       count(*) FILTER (WHERE extract(isodow FROM local_start) >= 6) AS weekend_sessions,
       round(avg(pauses), 2) AS avg_pauses
FROM s GROUP BY 1 ORDER BY 1;
