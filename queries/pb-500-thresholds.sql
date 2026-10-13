-- Solo 500 personal bests: how many puzzlers are under each threshold.
WITH best AS (
  SELECT t.player_id, min(t.seconds_to_solve) AS b
  FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND t.puzzling_type = 'solo' AND p.pieces_count = 500 AND t.seconds_to_solve > 0
  GROUP BY 1)
SELECT count(*) AS puzzlers,
  count(*) FILTER (WHERE b < 1800) AS under_30,
  count(*) FILTER (WHERE b < 2700) AS under_45,
  count(*) FILTER (WHERE b < 3600) AS under_60,
  count(*) FILTER (WHERE b < 5400) AS under_90,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b))::numeric / 60, 1) AS median_pb
FROM best;
