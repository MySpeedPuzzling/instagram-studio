-- The Weekly Numbers, "Most solves" for pairs and teams: the line-ups (the exact same members together) with the most
-- puzzles finished in the last full ISO week, top 3 per type. Counting per line-up, not per member: a member who
-- rotates through several teams is not one team (owner question 2026-10-26: two "team" names were two puzzlers who
-- each joined 12 team solves with changing teammates). A line-up is shown only when every member is a registered
-- player who may be featured: public profile, not ranking-opted-out (guests never named; do-not-feature in code).
-- Suspicious results and embargoed puzzles excluded. Private profiles excluded (player.is_private; 2026-10-13).
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
r AS (
  SELECT t.id, t.puzzling_type AS type, pz.pieces_count AS pieces, t.finished_at, tm.name AS team_name, t.team::jsonb AS team,
    CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS image
  FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id
  LEFT JOIN puzzling_team tm ON tm.id = t.puzzling_team_id, w
  WHERE NOT t.suspicious AND t.puzzling_type IN ('duo', 'team') AND t.team IS NOT NULL
    AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
mem AS (
  SELECT r.id, e.ord, nullif(e.p->>'player_id', '')::uuid AS pid
  FROM r CROSS JOIN LATERAL jsonb_array_elements(r.team->'puzzlers') WITH ORDINALITY AS e(p, ord)),
ok AS (
  SELECT mem.id, string_agg(mem.pid::text, ',' ORDER BY mem.pid) AS key FROM mem LEFT JOIN player p ON p.id = mem.pid
  GROUP BY mem.id HAVING count(*) >= 2 AND bool_and(p.id IS NOT NULL AND NOT p.is_private AND NOT p.ranking_opted_out)),
lineup AS (
  SELECT r.type, ok.key, count(*) AS results, sum(r.pieces) AS pieces,
    (array_agg(r.id ORDER BY r.finished_at DESC, r.id))[1] AS last_id,
    (array_agg(r.image ORDER BY r.finished_at DESC) FILTER (WHERE r.image IS NOT NULL))[1] AS last_image,
    (array_agg(r.team_name ORDER BY r.finished_at DESC) FILTER (WHERE r.team_name IS NOT NULL))[1] AS team_name
  FROM r JOIN ok USING (id) GROUP BY r.type, ok.key),
rk AS (SELECT *, row_number() OVER (PARTITION BY type ORDER BY results DESC, pieces DESC, key) AS n FROM lineup)
SELECT rk.type, rk.results, rk.pieces, rk.last_image, rk.team_name,
  (SELECT json_agg(json_build_object('player_id', p.id, 'name', p.name, 'country', upper(p.country),
      'ig_handle', CASE WHEN n.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN n.handle END) ORDER BY mem.ord)
   FROM mem JOIN player p ON p.id = mem.pid
   CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
     '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) n
   WHERE mem.id = rk.last_id AND NOT p.is_private) AS members
FROM rk WHERE n <= 3 ORDER BY type, results DESC, pieces DESC;
