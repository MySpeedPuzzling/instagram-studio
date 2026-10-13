-- Brainstorm 2026-10: the most international puzzles - distinct solver countries per puzzle (top 12), and how many
-- puzzles have been solved in 20+ countries. Embargoed puzzles excluded. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH pc AS (
  SELECT t.puzzle_id, count(DISTINCT upper(nullif(pl.country, ''))) AS countries, count(DISTINCT t.player_id) AS solvers
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1)
SELECT p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, pc.countries, pc.solvers,
       (SELECT count(*) FROM pc WHERE countries >= 20) AS puzzles_20plus_countries,
       (SELECT count(*) FROM pc WHERE countries >= 30) AS puzzles_30plus_countries
FROM pc JOIN puzzle p ON p.id = pc.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE (p.hide_until IS NULL OR p.hide_until <= now())
ORDER BY pc.countries DESC, pc.solvers DESC LIMIT 12;
