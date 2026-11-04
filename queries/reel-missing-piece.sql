-- Reel "The missing piece" (2026-11-04): how many result notes say a piece was missing. Counts only, no note text
-- leaves the database. Private profiles and suspicious results excluded. "No missing pieces!" style notes are
-- subtracted (negated); found_later = notes that also say the piece was found.
WITH c AS (SELECT lower(t.comment) AS c FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
           WHERE NOT t.suspicious AND NOT pl.is_private AND t.comment IS NOT NULL AND t.comment <> ''),
m AS (SELECT c, c ~ '\m(no|not|none|without|zero|0|nothing|never)\M[^.!?]{0,20}(missing|lost)' AS negated
      FROM c WHERE c ~ '\m(missing|lost) (a |one |1 |two |2 )?pieces?\M|\mpiece (is |was )?missing\M')
SELECT (SELECT count(*) FROM c) AS notes,
       count(*) AS mentions,
       count(*) FILTER (WHERE negated) AS negated,
       count(*) FILTER (WHERE NOT negated) AS missing,
       count(*) FILTER (WHERE NOT negated AND c ~ '\mfound\M') AS found_later
FROM m;
