-- Share of all results by puzzle size.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT CASE WHEN p.pieces_count = 500 THEN '500' WHEN p.pieces_count = 1000 THEN '1000'
            WHEN p.pieces_count < 500 THEN 'under 500' ELSE 'other' END AS size,
       count(*) AS results,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private
GROUP BY 1 ORDER BY 2 DESC;
