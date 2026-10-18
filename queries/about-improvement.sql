-- "Start here" explainer: do puzzlers get faster as they keep logging? Each puzzler's 500-piece solo times on puzzles
-- they solved for the first time (first_attempt: a repeat of the same puzzle is faster from memory), in the order
-- they were solved (finished_at, else tracked_at). One cohort for every point: puzzlers with at least 20 such times.
-- Per point: the median time of the cohort's 1st, 5th, 10th and 20th, plus the median of each puzzler's own
-- 20th-vs-1st change. Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13).
WITH t AS (
  SELECT t.player_id, t.seconds_to_solve AS s,
         row_number() OVER (PARTITION BY t.player_id ORDER BY coalesce(t.finished_at, t.tracked_at), t.id) AS n,
         count(*) OVER (PARTITION BY t.player_id) AS total
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.first_attempt
    AND t.seconds_to_solve > 0 AND p.pieces_count = 500),
c AS (SELECT * FROM t WHERE total >= 20 AND n IN (1, 5, 10, 20)),
pp AS (SELECT player_id, max(s) FILTER (WHERE n = 1) AS s1, max(s) FILTER (WHERE n = 20) AS s20 FROM c GROUP BY 1)
SELECT n AS attempt, count(*) AS puzzlers,
       round((percentile_cont(0.5) WITHIN GROUP (ORDER BY s))::numeric / 60, 1) AS median_min,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY 1 - s20::numeric / s1))::numeric * 100) FROM pp) AS median_pct_faster_by_20,
       (SELECT round(100.0 * count(*) FILTER (WHERE s20 < s1) / count(*)) FROM pp) AS pct_faster_by_20
FROM c GROUP BY n ORDER BY n;
