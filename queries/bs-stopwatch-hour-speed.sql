-- Brainstorm 2026-10 (C1 night owls): median active time (sum of laps) of finished stopwatch sessions on 500-piece
-- puzzles by LOCAL START HOUR and by daypart, players in Central European countries (laps are UTC, converted to
-- Europe/Prague). Same scope and filters as bs-stopwatch-daypart, from one snapshot so hours and dayparts agree.
-- 'share' row: finished stopwatch sessions (every country and size) against all results, for the scope statement
-- (results.created_via only exists for recent results, so it can't measure this). Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
-- Suspicious results excluded: a session counts only if its player has no suspicious result on that puzzle (sessions
-- have no direct link to their result, so player + puzzle is the match; conservative).
WITH s AS (
  SELECT ((sw.laps -> 0 ->> 'start')::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') AS local_start,
         json_array_length(sw.laps) - 1 AS pauses,
         (SELECT sum(extract(epoch FROM (l ->> 'end')::timestamp - (l ->> 'start')::timestamp)) FROM json_array_elements(sw.laps) l WHERE l ->> 'end' IS NOT NULL) AS active_s
  FROM stopwatch sw JOIN player pl ON pl.id = sw.player_id JOIN puzzle p ON p.id = sw.puzzle_id
  WHERE sw.status = 'finished' AND json_array_length(sw.laps) > 0 AND p.pieces_count = 500 AND NOT pl.is_private
    AND NOT EXISTS (SELECT 1 FROM puzzle_solving_time st WHERE st.player_id = sw.player_id AND st.puzzle_id = sw.puzzle_id AND st.suspicious)
    AND upper(pl.country) IN ('DE','CZ','AT','CH','NL','BE','DK','SE','NO','PL','FR','ES','IT','HU','SK','SI','HR','LU')),
f AS (
  SELECT extract(hour FROM local_start)::int AS hr, pauses, active_s,
         CASE WHEN extract(hour FROM local_start) BETWEEN 5 AND 10 THEN '1 morning 05-11'
              WHEN extract(hour FROM local_start) BETWEEN 11 AND 16 THEN '2 day 11-17'
              WHEN extract(hour FROM local_start) BETWEEN 17 AND 21 THEN '3 evening 17-22'
              ELSE '4 night 22-05' END AS daypart
  FROM s WHERE active_s > 600 AND active_s < 6 * 3600)
SELECT 'hour' AS kind, lpad(hr::text, 2, '0') AS k, count(*) AS n,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY active_s))::numeric / 60, 1) AS median_min,
       round(100.0 * count(*) FILTER (WHERE pauses = 0) / count(*), 1) AS pct_no_pause, NULL::bigint AS total
FROM f GROUP BY hr
UNION ALL
SELECT 'daypart', daypart, count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY active_s))::numeric / 60, 1),
       round(100.0 * count(*) FILTER (WHERE pauses = 0) / count(*), 1), NULL
FROM f GROUP BY daypart
UNION ALL
SELECT 'all', 'all', count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY active_s))::numeric / 60, 1),
       round(100.0 * count(*) FILTER (WHERE pauses = 0) / count(*), 1), NULL
FROM f
UNION ALL
SELECT 'share', 'finished sessions / results',
       (SELECT count(*) FROM stopwatch sw JOIN player pl ON pl.id = sw.player_id WHERE sw.status = 'finished' AND NOT pl.is_private
    AND NOT EXISTS (SELECT 1 FROM puzzle_solving_time st WHERE st.player_id = sw.player_id AND st.puzzle_id = sw.puzzle_id AND st.suspicious)),
       NULL, NULL,
       (SELECT count(*) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id WHERE NOT t.suspicious AND NOT pl.is_private)
ORDER BY 1, 2;
