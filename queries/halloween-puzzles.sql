-- Halloween-themed puzzles (whole-word name match), aggregate only: solvers and results per puzzle, and how many
-- of those results were finished in October. No player data leaves the database. Embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH hp AS (
  SELECT pz.id, pz.name, m.name AS brand, pz.pieces_count
  FROM puzzle pz JOIN manufacturer m ON m.id = pz.manufacturer_id
  WHERE pz.name ~* '\m(halloween|pumpkins?|spooky|haunted|witch(es)?|ghosts?|skeletons?|trick or treat)\M'
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())
)
SELECT hp.name AS puzzle, hp.brand, hp.pieces_count AS pieces,
  count(DISTINCT t.player_id) AS solvers, count(*) AS results,
  count(*) FILTER (WHERE extract(month FROM coalesce(t.finished_at, t.tracked_at)) = 10) AS results_october
FROM hp JOIN puzzle_solving_time t ON t.puzzle_id = hp.id
JOIN player pl ON pl.id = t.player_id
WHERE NOT t.suspicious AND NOT pl.is_private
GROUP BY hp.id, hp.name, hp.brand, hp.pieces_count
ORDER BY solvers DESC, results DESC
LIMIT 300;
