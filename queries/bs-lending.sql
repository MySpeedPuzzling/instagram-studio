-- Brainstorm 2026-10: lending journeys (aggregate). A journey = one owner's copy of one puzzle; holders = distinct
-- borrowers it reached (pass = handed from borrower to borrower), countries = distinct borrower countries.
-- Private profiles excluded (player.is_private, 2026-10-13): a transfer counts only when its owner, giver and receiver
-- are each either public or a name-only guest, so private owners' journeys and hand-overs to/from private players drop out.
WITH lt AS (
  SELECT x.owner_player_id, x.owner_name, x.puzzle_id, x.transfer_type, x.to_player_id, x.to_player_name, x.transferred_at,
         pt.country AS to_country
  FROM lent_puzzle_transfer x
  LEFT JOIN player po ON po.id = x.owner_player_id
  LEFT JOIN player pf ON pf.id = x.from_player_id
  LEFT JOIN player pt ON pt.id = x.to_player_id
  WHERE NOT coalesce(po.is_private, false) AND NOT coalesce(pf.is_private, false) AND NOT coalesce(pt.is_private, false)),
tr AS (
  SELECT coalesce(lt.owner_player_id::text, lt.owner_name) AS owner_key, lt.puzzle_id,
         count(*) AS transfers, count(*) FILTER (WHERE lt.transfer_type = 'pass') AS passes,
         count(DISTINCT coalesce(lt.to_player_id::text, lt.to_player_name)) AS holders,
         count(DISTINCT nullif(lt.to_country, '')) AS countries,
         min(lt.transferred_at) AS first_at, max(lt.transferred_at) AS last_at
  FROM lt
  GROUP BY 1, 2)
SELECT count(*) AS journeys, (SELECT count(DISTINCT coalesce(owner_player_id::text, owner_name)) FROM lt) AS owners_ever,
       max(transfers) AS max_transfers, max(passes) AS max_passes, max(holders) AS max_holders, max(countries) AS max_countries,
       count(*) FILTER (WHERE passes >= 3) AS journeys_3plus_passes, count(*) FILTER (WHERE holders >= 5) AS journeys_5plus_holders,
       count(*) FILTER (WHERE countries >= 2) AS cross_border, round(avg(holders), 2) AS avg_holders,
       max(extract(day FROM last_at - first_at))::int AS longest_days,
       min(first_at)::date AS first_lend
FROM tr;
