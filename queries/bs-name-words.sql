-- Brainstorm 2026-10: most frequent words in puzzle names (catalogue count and results), stop words removed.
-- Private profiles excluded from the result counts (player.is_private; owner decision 2026-10-13).
WITH w AS (
  SELECT p.id, lower(word) AS word
  FROM puzzle p, regexp_split_to_table(regexp_replace(p.name, '[^[:alpha:] ]', ' ', 'g'), '\s+') AS word
  WHERE (p.hide_until IS NULL OR p.hide_until <= now()) AND length(word) >= 3),
r AS (SELECT t.puzzle_id, count(*) AS results FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
      WHERE NOT t.suspicious AND NOT pl.is_private GROUP BY 1)
SELECT w.word, count(DISTINCT w.id) AS puzzles, coalesce(sum(r.results), 0) AS results
FROM w LEFT JOIN r ON r.puzzle_id = w.id
WHERE w.word NOT IN ('the','and','der','die','das','von','with','for','les','des','und','pieces','piece','puzzle','puzzles','teile','jigsaw','pcs','vol','part','edition','collection','series','from','mit','dem','den','its','une','del','con','por','pour')
GROUP BY 1 ORDER BY 3 DESC LIMIT 60;
