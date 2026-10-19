-- The Weekly Numbers: who logged the most last full ISO week, per kind (solo, pair, team): every member of a pair or
-- team result counts it. Top 5 per kind among players who may be featured (public profile, not ranking-opted-out;
-- the local do-not-feature list is applied in code). Suspicious results and embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Results stay in the gitignored cache.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
part AS (
  SELECT t.puzzling_type AS type, nullif(e.p->>'player_id', '')::uuid AS pid, pz.pieces_count AS pieces
  FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id, w,
  LATERAL jsonb_array_elements(CASE WHEN t.team IS NULL THEN jsonb_build_array(jsonb_build_object('player_id', t.player_id))
    ELSE t.team::jsonb->'puzzlers' END) AS e(p)
  WHERE NOT t.suspicious AND t.tracked_at >= w.start AND coalesce(t.finished_at, t.tracked_at) >= w.start AND coalesce(t.finished_at, t.tracked_at) < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
agg AS (
  SELECT type, pid, count(*) AS results, sum(pieces) AS pieces FROM part WHERE pid IS NOT NULL GROUP BY 1, 2),
rk AS (
  SELECT a.*, p.name AS player, upper(p.country) AS country,
    CASE WHEN n.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN n.handle END AS ig_handle,
    row_number() OVER (PARTITION BY a.type ORDER BY a.results DESC, a.pieces DESC) AS n
  FROM agg a JOIN player p ON p.id = a.pid
  CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
    '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) n
  WHERE NOT p.is_private AND NOT p.ranking_opted_out)
SELECT type, pid AS player_id, player, country, ig_handle, results, pieces FROM rk WHERE n <= 5 ORDER BY type, results DESC, pieces DESC;
