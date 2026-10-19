-- The Weekly Numbers: candidate "fact of the week" numbers for the last full ISO week (the builder picks one).
-- Hours of solving, countries, distinct puzzles, puzzles that got their first-ever time on MSP, puzzles added to the
-- database, the biggest puzzle finished, first-attempt share of solo results, the busiest local hour.
-- Private profiles excluded everywhere (player.is_private; owner decision 2026-10-13); suspicious results and
-- embargoed puzzles excluded.
WITH w AS (SELECT date_trunc('week', now()) - interval '7 days' AS start, date_trunc('week', now()) AS stop),
t AS (
  SELECT t.puzzle_id, t.seconds_to_solve, t.first_attempt, t.puzzling_type, t.tracked_at, pl.country, pl.timezone, pz.pieces_count, pz.name, m.name AS brand
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle pz ON pz.id = t.puzzle_id
  JOIN manufacturer m ON m.id = pz.manufacturer_id, w
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.tracked_at >= w.start AND t.finished_at >= w.start AND t.finished_at < w.stop
    AND (pz.hide_until IS NULL OR pz.hide_until <= now())),
big AS (SELECT name, brand, pieces_count, count(*) AS results FROM t GROUP BY 1, 2, 3 ORDER BY pieces_count DESC, results DESC LIMIT 1)
SELECT
  round(sum(seconds_to_solve) / 3600.0) AS hours,
  count(DISTINCT lower(country)) FILTER (WHERE country IS NOT NULL AND country <> '') AS countries,
  count(DISTINCT puzzle_id) AS puzzles,
  (SELECT count(DISTINCT t.puzzle_id) FROM t WHERE NOT EXISTS (
     SELECT 1 FROM puzzle_solving_time o, w WHERE o.puzzle_id = t.puzzle_id AND o.tracked_at < w.start AND NOT o.suspicious)) AS first_ever_puzzles,
  (SELECT count(*) FROM puzzle p, w WHERE p.added_at >= w.start AND p.added_at < w.stop AND p.approved
     AND (p.hide_until IS NULL OR p.hide_until <= now())) AS puzzles_added,
  (SELECT name FROM big) AS biggest_puzzle, (SELECT brand FROM big) AS biggest_brand,
  (SELECT pieces_count FROM big) AS biggest_pieces, (SELECT results FROM big) AS biggest_results,
  count(*) FILTER (WHERE pieces_count >= 2000) AS results_2000_plus,
  round(100.0 * count(*) FILTER (WHERE puzzling_type = 'solo' AND first_attempt) / nullif(count(*) FILTER (WHERE puzzling_type = 'solo'), 0)) AS solo_first_attempt_pct
FROM t;
