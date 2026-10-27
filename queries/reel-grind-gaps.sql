-- "The grind" Reel: how soon puzzlers solve the same puzzle again, by piece count: every 2nd solo solve of a puzzle,
-- the median days since the 1st, the median % faster than the 1st and the share that was faster.
-- Unboxed solves excluded (owner 2026-10-27). Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13).
WITH x AS (
  SELECT t.seconds_to_solve AS s, pz.pieces_count AS pc, coalesce(t.finished_at, t.tracked_at) AS at,
         row_number() OVER w AS n, lag(t.seconds_to_solve) OVER w AS sp, lag(coalesce(t.finished_at, t.tracked_at)) OVER w AS prev_at
  FROM puzzle_solving_time t JOIN player p ON p.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id
  WHERE NOT t.suspicious AND t.seconds_to_solve > 0 AND t.puzzling_type = 'solo' AND NOT t.unboxed AND NOT p.is_private
  WINDOW w AS (PARTITION BY t.player_id, t.puzzle_id ORDER BY coalesce(t.finished_at, t.tracked_at), t.id))
SELECT CASE WHEN pc <= 200 THEN '≤200' WHEN pc = 500 THEN '500' WHEN pc = 1000 THEN '1000' END AS size,
       count(*) AS second_solves,
       round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM at - prev_at) / 86400)::numeric) AS median_days_between,
       round(100 * (1 - percentile_cont(0.5) WITHIN GROUP (ORDER BY s::numeric / sp))::numeric, 1) AS median_pct_faster,
       round(100.0 * count(*) FILTER (WHERE s < sp) / count(*)) AS pct_faster
FROM x WHERE n = 2 AND (pc <= 200 OR pc IN (500, 1000)) GROUP BY 1 ORDER BY 1;
