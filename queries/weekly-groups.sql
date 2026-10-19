-- The Weekly Numbers: fastest pair (duo) and team results of the last full ISO week, 500 and 1000 pieces, top 3 per
-- type and size, one row per group of puzzlers (their best). A group is shown only when every member is a registered
-- player who may be featured: public profile, not ranking-opted-out (guests typed in by name are never named; the
-- local do-not-feature list is applied in code). Suspicious results and embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Results stay in the gitignored cache.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
r AS (
  SELECT t.id, t.puzzling_type AS type, pz.pieces_count AS pieces, t.seconds_to_solve AS seconds, t.first_attempt,
    pz.name AS puzzle, m.name AS brand, tm.name AS team_name, t.team::jsonb AS team,
    CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS image
  FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
  LEFT JOIN puzzling_team tm ON tm.id = t.puzzling_team_id, w
  WHERE NOT t.suspicious AND t.seconds_to_solve > 0 AND t.puzzling_type IN ('duo', 'team') AND t.team IS NOT NULL
    AND pz.pieces_count IN (500, 1000) AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
mem AS (
  SELECT r.id, e.ord, nullif(e.p->>'player_id', '')::uuid AS pid
  FROM r CROSS JOIN LATERAL jsonb_array_elements(r.team->'puzzlers') WITH ORDINALITY AS e(p, ord)),
ok AS (
  SELECT mem.id FROM mem LEFT JOIN player p ON p.id = mem.pid
  GROUP BY mem.id HAVING count(*) >= 2 AND bool_and(p.id IS NOT NULL AND NOT p.is_private AND NOT p.ranking_opted_out)),
named AS (
  SELECT r.type, r.pieces, r.seconds, r.first_attempt, r.puzzle, r.brand, r.image, r.team_name, g.members, g.key
  FROM r JOIN ok USING (id)
  CROSS JOIN LATERAL (
    SELECT json_agg(json_build_object('player_id', p.id, 'name', p.name, 'country', upper(p.country),
        'ig_handle', CASE WHEN n.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN n.handle END) ORDER BY mem.ord) AS members,
      string_agg(p.id::text, ',' ORDER BY p.id) AS key
    FROM mem JOIN player p ON p.id = mem.pid
    CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
      '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) n
    WHERE mem.id = r.id) g),
best AS (SELECT DISTINCT ON (type, pieces, key) * FROM named ORDER BY type, pieces, key, seconds),
rk AS (SELECT *, row_number() OVER (PARTITION BY type, pieces ORDER BY seconds) AS n FROM best)
SELECT type, pieces, seconds, first_attempt, puzzle, brand, image, team_name, members FROM rk WHERE n <= 3 ORDER BY type, pieces, seconds;
