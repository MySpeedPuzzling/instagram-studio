-- Community totals (non-suspicious results). Columns: results, players, countries, pieces, hours.
-- Private profiles excluded from every column, countries included (player.is_private; owner decision 2026-10-13).
SELECT count(*) AS results,
       count(DISTINCT t.player_id) AS players,
       (SELECT count(DISTINCT NULLIF(country, '')) FROM player WHERE NOT is_private) AS countries,
       sum(p.pieces_count)::bigint AS pieces,
       round(sum(t.seconds_to_solve) / 3600.0) AS hours
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private;
