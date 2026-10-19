-- Fastest solo 500 and 1000 results logged last full week: each puzzler's best per size, top 3 per size,
-- by players who may be featured (public profile, not ranking-opted-out; the local do-not-feature list is
-- applied in code), with the box image of the puzzle (embargoed images excluded). Personal data: results stay in the gitignored cache.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13), as are ranking opt-outs.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
best AS (
  SELECT DISTINCT ON (t.player_id, pz.pieces_count)
    p.id AS player_id, p.name AS player, upper(p.country) AS country, pz.pieces_count AS pieces, t.seconds_to_solve AS seconds,
    t.first_attempt, pz.name AS puzzle, m.name AS brand,
    CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS image,
    CASE WHEN norm.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN norm.handle END AS ig_handle
  FROM puzzle_solving_time t JOIN puzzle pz ON pz.id = t.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
  JOIN player p ON p.id = t.player_id
  CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
      '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) norm, w
  WHERE NOT t.suspicious AND t.seconds_to_solve > 0 AND t.puzzling_type = 'solo' AND pz.pieces_count IN (500, 1000)
    AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop AND NOT p.is_private AND NOT p.ranking_opted_out
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  ORDER BY t.player_id, pz.pieces_count, t.seconds_to_solve),
r AS (SELECT *, row_number() OVER (PARTITION BY pieces ORDER BY seconds) AS rk FROM best)
SELECT player_id, player, country, pieces, seconds, first_attempt, puzzle, brand, image, ig_handle FROM r WHERE rk <= 3 ORDER BY pieces, seconds;
