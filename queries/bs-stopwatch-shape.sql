-- Brainstorm 2026-10: format of stopwatch lap timestamps (digits masked), to see whether local solve hour is recoverable.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
-- Suspicious results excluded: a session counts only if its player has no suspicious result on that puzzle (sessions
-- have no direct link to their result, so player + puzzle is the match; conservative).
SELECT regexp_replace(laps -> 0 ->> 'start', '[0-9]', 'd', 'g') AS start_format, count(*) AS n
FROM (SELECT sw.laps FROM stopwatch sw JOIN player pl ON pl.id = sw.player_id
      WHERE sw.status = 'finished' AND json_array_length(sw.laps) > 0 AND NOT pl.is_private
    AND NOT EXISTS (SELECT 1 FROM puzzle_solving_time st WHERE st.player_id = sw.player_id AND st.puzzle_id = sw.puzzle_id AND st.suspicious) LIMIT 3000) x
GROUP BY 1 ORDER BY 2 DESC LIMIT 5;
