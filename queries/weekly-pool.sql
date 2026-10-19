-- The Weekly Numbers shoutout: everyone who logged at least one result last full ISO week (solo, or as a member of a
-- pair or team) and may be featured (public profile, not ranking-opted-out; do-not-feature applied in code). The
-- builder draws 1–3 of them with a seed made from the week, so the draw is reproducible, and shows each with one
-- solve (puzzle and time). Suspicious results excluded.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Results stay in the gitignored cache.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
part AS (
  SELECT nullif(e.p->>'player_id', '')::uuid AS pid, t.id AS time_id, t.finished_at, t.seconds_to_solve
  FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id, w,
  LATERAL jsonb_array_elements(CASE WHEN t.team IS NULL THEN jsonb_build_array(jsonb_build_object('player_id', t.player_id))
    ELSE t.team::jsonb->'puzzlers' END) AS e(p)
  WHERE NOT t.suspicious AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND t.tracked_at < w.stop -- logged by Sunday night, so re-running the draw on Monday picks the same puzzlers
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
agg AS (
  -- The solve they're shown with: their latest timed solve of the week (an untimed one only if they have none).
  SELECT pid, count(*) AS results, (array_agg(time_id ORDER BY (seconds_to_solve IS NULL), finished_at DESC, time_id))[1] AS shown_time_id
  FROM part WHERE pid IS NOT NULL GROUP BY pid)
SELECT p.id AS player_id, p.name AS player, upper(p.country) AS country,
  CASE WHEN n.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN n.handle END AS ig_handle,
  a.results, st.seconds_to_solve AS shown_seconds, st.puzzling_type AS shown_type, pz.name AS last_puzzle, m.name AS last_brand, pz.pieces_count AS last_pieces,
  CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS last_image
FROM agg a JOIN player p ON p.id = a.pid JOIN puzzle_solving_time st ON st.id = a.shown_time_id AND NOT st.suspicious JOIN puzzle pz ON pz.id = st.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
  '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) n
WHERE NOT p.is_private AND NOT p.ranking_opted_out
ORDER BY p.id;
