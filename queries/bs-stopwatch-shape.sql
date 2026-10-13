-- Brainstorm 2026-10: format of stopwatch lap timestamps (digits masked), to see whether local solve hour is recoverable.
SELECT regexp_replace(laps -> 0 ->> 'start', '[0-9]', 'd', 'g') AS start_format, count(*) AS n
FROM (SELECT laps FROM stopwatch WHERE status = 'finished' AND json_array_length(laps) > 0 LIMIT 3000) x
GROUP BY 1 ORDER BY 2 DESC LIMIT 5;
