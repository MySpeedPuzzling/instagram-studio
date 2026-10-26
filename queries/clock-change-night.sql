-- Reel "Your extra hour" (2026-10-24): puzzlers whose MSP stopwatch was running during the hour that happens twice
-- when Europe's clocks go back (02:00-03:00 Central European time twice = 00:00-02:00 UTC on 2025-10-26 and
-- 2024-10-27). A session counts when one of its laps (the stopwatch running, not paused) overlaps that window. Lap
-- timestamps are stored in UTC. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
-- Suspicious results excluded (same conservative player + puzzle match as bs-stopwatch-hours).
WITH nights(night, w_from, w_to) AS (VALUES
  (date '2025-10-26', timestamp '2025-10-26 00:00', timestamp '2025-10-26 02:00'),
  (date '2024-10-27', timestamp '2024-10-27 00:00', timestamp '2024-10-27 02:00')),
laps AS (
  SELECT sw.id, sw.player_id, (l ->> 'start')::timestamp AS l_start, (l ->> 'end')::timestamp AS l_end
  FROM stopwatch sw JOIN player pl ON pl.id = sw.player_id, json_array_elements(sw.laps) l
  WHERE sw.status = 'finished' AND NOT pl.is_private AND l ->> 'end' IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM puzzle_solving_time st WHERE st.player_id = sw.player_id AND st.puzzle_id = sw.puzzle_id AND st.suspicious))
SELECT n.night, count(DISTINCT laps.id) AS sessions, count(DISTINCT laps.player_id) AS puzzlers
FROM nights n JOIN laps ON laps.l_start < n.w_to AND laps.l_end > n.w_from
GROUP BY n.night ORDER BY n.night;
