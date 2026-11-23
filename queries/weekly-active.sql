-- The Weekly Numbers: who logged the most last full ISO week, per kind (solo, pair, team): every member of a pair or
-- team result counts it. Top 5 per kind among players who may be featured (public profile, not ranking-opted-out;
-- the local do-not-feature list is applied in code), with the box of each puzzler's latest puzzle of the week. Suspicious results and embargoed puzzles excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Results stay in the gitignored cache.
-- Impossible days excluded: when a puzzler's solves on one finish date (each under 24 h, so a single multi-day solve
-- doesn't count) add up to more than 24 h, that day is backfilled history typed in with today's date, not last week's
-- puzzling (week 47: a new account logged 50 old 500s dated its sign-up day, 93 h). Board only; totals unchanged.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
part AS (
  SELECT t.puzzling_type AS type, nullif(e.p->>'player_id', '')::uuid AS pid, pz.pieces_count AS pieces,
    t.seconds_to_solve AS secs, t.finished_at AS done_at, CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS image
  FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id, w,
  LATERAL jsonb_array_elements(CASE WHEN t.team IS NULL THEN jsonb_build_array(jsonb_build_object('player_id', t.player_id))
    ELSE t.team::jsonb->'puzzlers' END) AS e(p)
  WHERE NOT t.suspicious AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
day AS (
  SELECT part.*, sum(secs) FILTER (WHERE secs < 86400) OVER (PARTITION BY pid, done_at::date) AS day_secs FROM part),
agg AS (
  SELECT type, pid, count(*) AS results, sum(pieces) AS pieces,
    (array_agg(image ORDER BY done_at DESC) FILTER (WHERE image IS NOT NULL))[1] AS last_image
  FROM day WHERE pid IS NOT NULL AND coalesce(day_secs, 0) <= 86400 GROUP BY 1, 2),
rk AS (
  SELECT a.*, p.name AS player, upper(p.country) AS country,
    CASE WHEN n.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN n.handle END AS ig_handle,
    row_number() OVER (PARTITION BY a.type ORDER BY a.results DESC, a.pieces DESC) AS n
  FROM agg a JOIN player p ON p.id = a.pid
  CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
    '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) n
  WHERE NOT p.is_private AND NOT p.ranking_opted_out)
SELECT type, pid AS player_id, player, country, ig_handle, results, pieces, last_image FROM rk WHERE n <= 5 ORDER BY type, results DESC, pieces DESC;
