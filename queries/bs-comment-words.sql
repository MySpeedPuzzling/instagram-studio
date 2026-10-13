-- Brainstorm 2026-10: what result comments mention (counts only, no text leaves the database).
WITH c AS (SELECT lower(comment) AS c FROM puzzle_solving_time WHERE NOT suspicious AND comment IS NOT NULL AND comment <> '')
SELECT (SELECT count(*) FROM c) AS comments,
  count(*) FILTER (WHERE c ~ '\m(missing|lost) (a |one |1 |two |2 )?pieces?\M|\mpiece (is |was )?missing\M') AS missing_piece,
  count(*) FILTER (WHERE c ~ '\m(cats?|kitten|kitty)\M') AS cat,
  count(*) FILTER (WHERE c ~ '\m(dogs?|puppy)\M') AS dog,
  count(*) FILTER (WHERE c ~ '\m(kids?|children|daughter|son|grandkids?|granddaughter|grandson)\M') AS kids,
  count(*) FILTER (WHERE c ~ '\m(husband|wife|partner|mum|mom|dad|mother|father)\M') AS family,
  count(*) FILTER (WHERE c ~ '\m(wine|beer|coffee|tea)\M') AS drinks,
  count(*) FILTER (WHERE c ~ '\m(pb|personal best|new record)\M') AS pb,
  count(*) FILTER (WHERE c ~ '\m(sky|skies)\M') AS sky,
  count(*) FILTER (WHERE c ~ '\m(edges?|border)\M') AS edges,
  count(*) FILTER (WHERE c ~ '\m(hard|difficult|tough|brutal|nightmare)\M') AS hard,
  count(*) FILTER (WHERE c ~ '\m(fun|lovely|beautiful|enjoyed|love)\M') AS positive,
  count(*) FILTER (WHERE c ~ '\m(interrupt\w*|distract\w*|phone|doorbell)\M') AS interrupted,
  count(*) FILTER (WHERE c ~ '\m(flight|plane|train|holiday|vacation|hotel|camping)\M') AS travel,
  count(*) FILTER (WHERE c ~ '\m(sick|tired|hangover|hungover|migraine)\M') AS tired
FROM c;
