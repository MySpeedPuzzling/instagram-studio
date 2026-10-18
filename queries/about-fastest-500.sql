-- "Start here" explainer: the fastest solo 500-piece time logged on MySpeedPuzzling (no player named), shown next to
-- the typical first 500 so the record and the normal pace sit together (owner 2026-10-18). Suspicious results
-- excluded; private profiles excluded (player.is_private, 2026-10-13); embargoed puzzles skipped.
SELECT min(t.seconds_to_solve) AS fastest_s, count(*) AS results
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0
  AND p.pieces_count = 500 AND (p.hide_until IS NULL OR p.hide_until <= now());
