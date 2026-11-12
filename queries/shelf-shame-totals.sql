-- "Pile of shame" (Did you know, 2026-11-12): share of collected puzzles their owner has never logged a result for.
-- PUBLIC COLLECTIONS ONLY: the default collection counts when player.puzzle_collection_visibility = 'public', a custom
-- collection when collection.visibility = 'public' (most collections are private; private ones never count).
-- Private profiles excluded (player.is_private). Suspicious results don't count as solved. Aggregate only.
-- big_*: the single largest unsolved pile (anonymous), its pieces and the sum of each puzzle's median solo time
-- (puzzle_statistics.median_time_solo, as on the puzzle pages) for the puzzles that have one.
-- hours_*: per collection, the sum of the median solo times of its unsolved puzzles (puzzles without a median count 0);
-- median / 90th percentile across collections, all collections together, and how many pass 100 hours.
WITH ci AS (
  SELECT DISTINCT c.player_id, c.puzzle_id FROM collection_item c JOIN player pl ON pl.id = c.player_id
  LEFT JOIN collection col ON col.id = c.collection_id
  WHERE NOT pl.is_private AND ((c.collection_id IS NULL AND pl.puzzle_collection_visibility = 'public') OR col.visibility = 'public')),
solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN ci USING (player_id, puzzle_id) WHERE NOT t.suspicious),
u AS (SELECT ci.* FROM ci LEFT JOIN solved s USING (player_id, puzzle_id) WHERE s.player_id IS NULL),
pp AS (SELECT player_id, count(*) AS n FROM u GROUP BY 1),
big AS (SELECT player_id FROM pp ORDER BY n DESC LIMIT 1),
hrs AS (SELECT a.player_id, coalesce(sum(st.median_time_solo), 0) AS s, count(st.median_time_solo) AS nm
        FROM (SELECT DISTINCT player_id FROM ci) a LEFT JOIN u USING (player_id) LEFT JOIN puzzle_statistics st USING (puzzle_id) GROUP BY 1)
SELECT (SELECT count(*) FROM ci) AS collected,
       (SELECT count(*) FROM u) AS unsolved,
       round(100.0 * (SELECT count(*) FROM u) / (SELECT count(*) FROM ci), 1) AS pct_unsolved,
       (SELECT count(DISTINCT player_id) FROM ci) AS collections,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY coalesce(pp.n, 0)))::numeric)
          FROM (SELECT DISTINCT player_id FROM ci) a LEFT JOIN pp USING (player_id)) AS median_unsolved_per_collection,
       (SELECT sum(p.pieces_count) FROM u JOIN puzzle p ON p.id = u.puzzle_id) AS unsolved_pieces,
       (SELECT n FROM pp ORDER BY n DESC LIMIT 1) AS big_unsolved,
       (SELECT sum(p.pieces_count) FROM u JOIN big USING (player_id) JOIN puzzle p ON p.id = u.puzzle_id) AS big_pieces,
       (SELECT count(st.median_time_solo) FROM u JOIN big USING (player_id) LEFT JOIN puzzle_statistics st USING (puzzle_id)) AS big_with_median,
       (SELECT sum(st.median_time_solo) FROM u JOIN big USING (player_id) LEFT JOIN puzzle_statistics st USING (puzzle_id)) AS big_median_s,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY s) / 3600)::numeric, 1) FROM hrs) AS hours_median,
       (SELECT round((percentile_cont(0.9) WITHIN GROUP (ORDER BY s) / 3600)::numeric, 1) FROM hrs) AS hours_p90,
       (SELECT round(sum(s) / 3600.0) FROM hrs) AS hours_all,
       (SELECT sum(nm) FROM hrs) AS unsolved_with_median,
       (SELECT count(*) FILTER (WHERE s >= 100 * 3600) FROM hrs) AS collections_100h;
