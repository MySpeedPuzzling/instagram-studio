-- Reel "Your extra hour" (2026-10-24): how many MSP puzzlers live where the clocks go back on 25 Oct (EU rule +
-- Israel, Lebanon; tzdata 2026d) vs on 1 Nov (US, Canada, …), by active puzzlers (a result in the last 90 days, by
-- finish date) and their results. Country = the profile's country. Aggregate only.
-- Private profiles excluded (player.is_private; owner decision 2026-10-13). Suspicious results excluded.
WITH grp(cc, g) AS (
  SELECT unnest(string_to_array('AD AL AT AX BA BE BG CH CY CZ DE DK EE ES FI FO FR GB GG GI GL GR HR HU IE IL IM IT JE LB LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SJ SK SM UA VA XK', ' ')), '25 Oct'
  UNION ALL SELECT unnest(string_to_array('BM BS CA CU HT MX PM TC US', ' ')), '1 Nov'),
recent AS (
  SELECT t.player_id, upper(pl.country) AS cc
  FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id
  WHERE NOT t.suspicious AND NOT pl.is_private AND t.finished_at >= now() - interval '90 days')
SELECT coalesce(grp.g, CASE WHEN r.cc IS NULL OR r.cc = '' THEN 'no country' ELSE 'other' END) AS clocks_change,
       count(DISTINCT r.player_id) AS puzzlers, count(*) AS results, count(DISTINCT r.cc) AS countries
FROM recent r LEFT JOIN grp ON grp.cc = r.cc
GROUP BY 1 ORDER BY 2 DESC;
