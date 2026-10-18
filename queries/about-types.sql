-- "Start here" explainer (about post): logged times by kind (solo, pair, team) and the hours behind them.
-- Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13).
SELECT t.puzzling_type AS kind, count(*) AS results, round(sum(t.seconds_to_solve) / 3600.0) AS hours
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
WHERE NOT t.suspicious AND NOT pl.is_private
GROUP BY 1 ORDER BY 2 DESC;
