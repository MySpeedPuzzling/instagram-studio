-- "The grind" Reel: the puzzler who solved the same puzzle solo the most times, with every attempt in order
-- (finished_at, else tracked_at) so the Reel can draw the learning curve. Only players who may be featured (public
-- profile, not ranking-opted-out; content/do-not-feature.json is applied in code), embargoed puzzles excluded.
-- Unboxed solves (no box picture) excluded: a different skill, owner 2026-10-27. Suspicious results excluded; private profiles excluded (player.is_private, 2026-10-13). Personal data: results stay
-- in the gitignored cache.
WITH g AS (
  SELECT t.player_id, t.puzzle_id, count(*) AS n
  FROM puzzle_solving_time t JOIN player p ON p.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id
  WHERE NOT t.suspicious AND t.seconds_to_solve > 0 AND t.puzzling_type = 'solo' AND NOT t.unboxed
    AND NOT p.is_private AND NOT p.ranking_opted_out AND (pz.hide_until IS NULL OR pz.hide_until <= now())
  GROUP BY 1, 2 ORDER BY n DESC LIMIT 5),
r AS (SELECT g.*, row_number() OVER (ORDER BY g.n DESC) AS grind_rank FROM g)
SELECT r.grind_rank, p.id AS player_id, p.name AS player, upper(p.country) AS country,
       CASE WHEN norm.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN norm.handle END AS ig_handle,
       pz.name AS puzzle, m.name AS brand, pz.pieces_count AS pieces,
       CASE WHEN pz.hide_image_until IS NULL OR pz.hide_image_until <= now() THEN pz.image END AS image,
       row_number() OVER (PARTITION BY r.player_id, r.puzzle_id ORDER BY coalesce(t.finished_at, t.tracked_at), t.id) AS attempt,
       t.seconds_to_solve AS seconds, coalesce(t.finished_at, t.tracked_at) AS solved_at
FROM r JOIN puzzle_solving_time t ON t.player_id = r.player_id AND t.puzzle_id = r.puzzle_id
JOIN player p ON p.id = r.player_id JOIN puzzle pz ON pz.id = r.puzzle_id JOIN manufacturer m ON m.id = pz.manufacturer_id
CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(coalesce(p.instagram, ''))),
    '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) norm
WHERE NOT t.suspicious AND t.seconds_to_solve > 0 AND t.puzzling_type = 'solo' AND NOT t.unboxed
ORDER BY r.grind_rank, attempt;
