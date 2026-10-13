-- Community totals (non-suspicious results). Columns: results, players, countries, pieces, hours.
SELECT count(*) AS results,
       count(DISTINCT t.player_id) AS players,
       (SELECT count(DISTINCT NULLIF(country, '')) FROM player) AS countries,
       sum(p.pieces_count)::bigint AS pieces,
       round(sum(t.seconds_to_solve) / 3600.0) AS hours
FROM puzzle_solving_time t JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious;
