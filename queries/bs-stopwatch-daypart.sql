-- Brainstorm 2026-10: early birds vs night owls. Finished stopwatch sessions on 500-piece puzzles by players in
-- Central European countries; local start daypart vs median active time (sum of laps) and pauses. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH s AS (
  SELECT sw.id, ((sw.laps -> 0 ->> 'start')::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') AS local_start,
         json_array_length(sw.laps) - 1 AS pauses,
         (SELECT sum(extract(epoch FROM (l ->> 'end')::timestamp - (l ->> 'start')::timestamp)) FROM json_array_elements(sw.laps) l WHERE l ->> 'end' IS NOT NULL) AS active_s,
         extract(epoch FROM (sw.laps -> (json_array_length(sw.laps) - 1) ->> 'end')::timestamp - (sw.laps -> 0 ->> 'start')::timestamp) AS wall_s
  FROM stopwatch sw JOIN player pl ON pl.id = sw.player_id JOIN puzzle p ON p.id = sw.puzzle_id
  WHERE sw.status = 'finished' AND json_array_length(sw.laps) > 0 AND p.pieces_count = 500 AND NOT pl.is_private
    AND upper(pl.country) IN ('DE','CZ','AT','CH','NL','BE','DK','SE','NO','PL','FR','ES','IT','HU','SK','SI','HR','LU'))
SELECT CASE WHEN extract(hour FROM local_start) BETWEEN 5 AND 10 THEN '1 morning 05-11'
            WHEN extract(hour FROM local_start) BETWEEN 11 AND 16 THEN '2 day 11-17'
            WHEN extract(hour FROM local_start) BETWEEN 17 AND 21 THEN '3 evening 17-22'
            ELSE '4 night 22-05' END AS daypart,
       count(*) AS sessions,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY active_s))::numeric / 60, 1) AS median_active_min,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY wall_s))::numeric / 60, 1) AS median_wall_min,
       round(avg(pauses), 2) AS avg_pauses,
       round(100.0 * count(*) FILTER (WHERE pauses = 0) / count(*), 1) AS pct_no_pause
FROM s WHERE active_s > 600 AND active_s < 6 * 3600
GROUP BY 1 ORDER BY 1;
