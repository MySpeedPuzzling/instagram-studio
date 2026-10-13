-- Median solo-500 personal best by country (countries with at least 40 such puzzlers).
WITH best AS (
  SELECT t.player_id, min(t.seconds_to_solve) AS b
  FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND t.puzzling_type = 'solo' AND p.pieces_count = 500 AND t.seconds_to_solve > 0
  GROUP BY 1)
SELECT upper(pl.country) AS country, count(*) AS puzzlers,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b))::numeric / 60, 1) AS median_pb
FROM best JOIN player pl ON pl.id = best.player_id
WHERE pl.country IS NOT NULL AND pl.country <> ''
GROUP BY 1 HAVING count(*) >= 40 ORDER BY 3;
