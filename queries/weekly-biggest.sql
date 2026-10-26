-- The Weekly Numbers: who finished the week's biggest puzzle (the same puzzle as weekly-facts' biggest_*: most pieces,
-- then most results), for a shoutout on the week slide. One row per member of each result (solo = one), with the
-- member's avatar path and Instagram handle; a result is shown only when every member may be featured (public
-- profile, not ranking-opted-out; do-not-feature applied in code), as for pairs and teams elsewhere.
-- Suspicious results, embargoed puzzles and private profiles excluded (player.is_private; owner decision 2026-10-13).
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
t AS (
  SELECT t.id, t.puzzle_id, t.seconds_to_solve, t.puzzling_type, t.finished_at, t.team, t.player_id, pz.pieces_count
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id, w
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
big AS (SELECT puzzle_id FROM t GROUP BY puzzle_id, pieces_count ORDER BY pieces_count DESC, count(*) DESC LIMIT 1),
part AS (
  SELECT t.id AS time_id, t.seconds_to_solve, t.puzzling_type, t.finished_at, t.puzzle_id, nullif(e.p->>'player_id', '')::uuid AS pid
  FROM t JOIN big USING (puzzle_id),
  LATERAL jsonb_array_elements(CASE WHEN t.team IS NULL THEN jsonb_build_array(jsonb_build_object('player_id', t.player_id))
    ELSE t.team::jsonb->'puzzlers' END) AS e(p)),
ok AS (
  SELECT part.time_id FROM part LEFT JOIN player p ON p.id = part.pid
  GROUP BY part.time_id HAVING bool_and(p.id IS NOT NULL AND NOT p.is_private AND NOT p.ranking_opted_out))
SELECT part.time_id, part.puzzling_type AS type, part.seconds_to_solve AS seconds, part.pid AS player_id, p.name AS player, upper(p.country) AS country,
  CASE WHEN n.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN n.handle END AS ig_handle, p.avatar,
  pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces,
  CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS image
FROM part JOIN ok USING (time_id) JOIN player p ON p.id = part.pid JOIN puzzle pz ON pz.id = part.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
  '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) n
ORDER BY part.finished_at, part.time_id, p.name
LIMIT 20;
