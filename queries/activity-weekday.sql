-- Strategy 2026-10-17: when the community is active. Results logged (tracked_at, Europe/Prague) per weekday and
-- evening hour band over the last 8 full weeks. Aggregate only.
-- Suspicious results and private profiles excluded (CLAUDE.md data rules).
WITH r AS (
  SELECT (t.tracked_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Prague') AS local_at
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE NOT t.suspicious AND NOT pl.is_private
    AND t.tracked_at >= date_trunc('week', now()) - interval '8 weeks' AND t.tracked_at < date_trunc('week', now()))
SELECT extract(isodow FROM local_at)::int AS dow, to_char(local_at, 'Dy') AS day, count(*) AS results,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct,
       count(*) FILTER (WHERE extract(hour FROM local_at) BETWEEN 18 AND 22) AS evening_18_23
FROM r GROUP BY 1, 2 ORDER BY 1;
