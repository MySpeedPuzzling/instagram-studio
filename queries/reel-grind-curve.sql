-- "The grind" Reel, community curve: how much faster each repeat of the same puzzle is, by piece count.
-- One fixed cohort per size (puzzler + puzzle with at least 10 solo solves, so every point has the same grinds):
-- median % faster than the 1st solve, median step vs the previous solve, and the share that beat the previous one.
-- Thin groups (1000 pieces: a handful of grinds) are shown by their count and stay out of the Reel.
-- Unboxed solves (no box picture) excluded: a different skill, owner 2026-10-27. Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13).
WITH x AS (
  SELECT t.player_id, t.puzzle_id, t.seconds_to_solve AS s,
         CASE WHEN pz.pieces_count <= 200 THEN '≤200' WHEN pz.pieces_count = 500 THEN '500' WHEN pz.pieces_count = 1000 THEN '1000' END AS size,
         row_number() OVER (PARTITION BY t.player_id, t.puzzle_id ORDER BY coalesce(t.finished_at, t.tracked_at), t.id) AS n,
         count(*) OVER (PARTITION BY t.player_id, t.puzzle_id) AS total
  FROM puzzle_solving_time t JOIN player p ON p.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id
  WHERE NOT t.suspicious AND t.seconds_to_solve > 0 AND t.puzzling_type = 'solo' AND NOT t.unboxed AND NOT p.is_private),
f AS (SELECT x.*, first_value(s) OVER w AS s1, lag(s) OVER w AS sp FROM x WHERE size IS NOT NULL
      WINDOW w AS (PARTITION BY player_id, puzzle_id ORDER BY n))
SELECT size, n AS attempt, count(*) AS grinds,
       round(100 * (1 - percentile_cont(0.5) WITHIN GROUP (ORDER BY s::numeric / s1))::numeric, 1) AS pct_faster_than_first,
       round(100 * (1 - percentile_cont(0.5) WITHIN GROUP (ORDER BY s::numeric / sp))::numeric, 1) AS step_pct,
       round(100.0 * count(*) FILTER (WHERE s < sp) / count(*)) AS pct_beat_previous
FROM f WHERE total >= 10 AND n BETWEEN 2 AND 10 GROUP BY 1, 2 ORDER BY 1, 2;
