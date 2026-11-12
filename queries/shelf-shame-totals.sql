-- "Pile of shame" (Did you know, 2026-11-12): share of collected puzzles their owner has never logged a result for.
-- All collections, private ones included (owner 2026-11-12: aggregates that name nobody may use private collections);
-- profiles marked private (player.is_private) never count. Suspicious results don't count as solved. Aggregate only.
-- A "pile" = one puzzler's unsolved collected puzzles (puzzlers with at least one).
-- Hours of a pile = the sum of each puzzle's median solo time (puzzle_statistics.median_time_solo, as on the puzzle
-- pages); a puzzle nobody has timed yet gets the typical median of its piece count (median over puzzles with that
-- piece count and a median, at least 5 of them) (owner 2026-11-12, pile ladder). hours_q1/median/q3/p90 across piles.
-- big_*: the pile with the most unsolved puzzles (anonymous), its puzzles and hours.
WITH ci AS (
  SELECT DISTINCT c.player_id, c.puzzle_id FROM collection_item c JOIN player pl ON pl.id = c.player_id
  WHERE NOT pl.is_private),
solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN ci USING (player_id, puzzle_id) WHERE NOT t.suspicious),
u AS (SELECT ci.* FROM ci LEFT JOIN solved s USING (player_id, puzzle_id) WHERE s.player_id IS NULL),
pcm AS (SELECT p.pieces_count AS pc, percentile_cont(0.5) WITHIN GROUP (ORDER BY st.median_time_solo) AS m
        FROM puzzle p JOIN puzzle_statistics st ON st.puzzle_id = p.id WHERE st.median_time_solo IS NOT NULL GROUP BY 1 HAVING count(*) >= 5),
uu AS (SELECT u.player_id, p.pieces_count, st.median_time_solo AS own, coalesce(st.median_time_solo, pcm.m) AS m
       FROM u JOIN puzzle p ON p.id = u.puzzle_id LEFT JOIN puzzle_statistics st USING (puzzle_id) LEFT JOIN pcm ON pcm.pc = p.pieces_count),
per AS (SELECT player_id, count(*) AS n, coalesce(sum(m), 0) AS s FROM uu GROUP BY 1),
big AS (SELECT player_id FROM per ORDER BY n DESC LIMIT 1)
SELECT (SELECT count(*) FROM ci) AS collected,
       (SELECT count(*) FROM u) AS unsolved,
       round(100.0 * (SELECT count(*) FROM u) / (SELECT count(*) FROM ci), 1) AS pct_unsolved,
       (SELECT count(DISTINCT player_id) FROM ci) AS collections,
       (SELECT count(*) FROM per) AS piles,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY n))::numeric) FROM per) AS median_pile,
       (SELECT sum(pieces_count) FROM uu) AS unsolved_pieces,
       (SELECT count(*) FILTER (WHERE own IS NULL) FROM uu) AS untimed,
       (SELECT count(*) FILTER (WHERE m IS NULL) FROM uu) AS without_estimate,
       (SELECT n FROM per JOIN big USING (player_id)) AS big_unsolved,
       (SELECT round(s / 3600.0) FROM per JOIN big USING (player_id)) AS big_hours,
       (SELECT round((percentile_cont(0.25) WITHIN GROUP (ORDER BY s) / 3600)::numeric, 1) FROM per) AS hours_q1,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY s) / 3600)::numeric, 1) FROM per) AS hours_median,
       (SELECT round((percentile_cont(0.75) WITHIN GROUP (ORDER BY s) / 3600)::numeric, 1) FROM per) AS hours_q3,
       (SELECT round((percentile_cont(0.9) WITHIN GROUP (ORDER BY s) / 3600)::numeric, 1) FROM per) AS hours_p90,
       (SELECT round(sum(s) / 3600.0) FROM per) AS hours_all;
