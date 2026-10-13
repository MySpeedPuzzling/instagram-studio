-- Brainstorm 2026-10: "the pile of shame" - share of collected puzzles their owner has never logged a result for,
-- plus wishlist items the wisher has since solved. Aggregate only.
-- Private profiles excluded: collection items and results of players with player.is_private never count (2026-10-13).
WITH solved AS (SELECT DISTINCT t.player_id, t.puzzle_id FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
                WHERE NOT t.suspicious AND NOT pl.is_private),
ci AS (SELECT DISTINCT ci.player_id, ci.puzzle_id FROM collection_item ci JOIN player pl ON pl.id = ci.player_id WHERE NOT pl.is_private)
SELECT count(*) AS collected_pairs, count(s.player_id) AS collected_and_solved,
       round(100.0 * (count(*) - count(s.player_id)) / count(*), 1) AS pct_unsolved,
       count(DISTINCT ci.player_id) AS collectors,
       (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY n))::numeric) FROM (
          SELECT ci2.player_id, count(*) FILTER (WHERE s2.player_id IS NULL) AS n FROM ci ci2 LEFT JOIN solved s2 USING (player_id, puzzle_id) GROUP BY 1) x) AS median_unsolved_per_collector,
       (SELECT max(n) FROM (SELECT ci2.player_id, count(*) FILTER (WHERE s2.player_id IS NULL) AS n FROM ci ci2 LEFT JOIN solved s2 USING (player_id, puzzle_id) GROUP BY 1) x) AS max_unsolved_one_collector
FROM ci LEFT JOIN solved s USING (player_id, puzzle_id);
