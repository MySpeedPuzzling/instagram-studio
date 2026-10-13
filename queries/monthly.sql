-- Per month since Jan 2025: results, active loggers, pieces, new players.
WITH r AS (
  SELECT to_char(date_trunc('month', t.tracked_at), 'YYYY-MM') AS month, count(*) AS results,
         count(DISTINCT t.player_id) AS active, sum(p.pieces_count) AS pieces
  FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id
  WHERE NOT t.suspicious AND t.tracked_at >= '2025-01-01' GROUP BY 1),
n AS (SELECT to_char(date_trunc('month', registered_at), 'YYYY-MM') AS month, count(*) AS new_players
      FROM player WHERE registered_at >= '2025-01-01' GROUP BY 1)
SELECT r.month, r.results, r.active, r.pieces, coalesce(n.new_players, 0) AS new_players
FROM r LEFT JOIN n USING (month) ORDER BY 1;
