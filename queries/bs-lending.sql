-- Brainstorm 2026-10: lending journeys (aggregate). A journey = one owner's copy of one puzzle; holders = distinct
-- borrowers it reached (pass = handed from borrower to borrower), countries = distinct borrower countries.
WITH tr AS (
  SELECT coalesce(lt.owner_player_id::text, lt.owner_name) AS owner_key, lt.puzzle_id,
         count(*) AS transfers, count(*) FILTER (WHERE lt.transfer_type = 'pass') AS passes,
         count(DISTINCT coalesce(lt.to_player_id::text, lt.to_player_name)) AS holders,
         count(DISTINCT nullif(pl.country, '')) AS countries,
         min(lt.transferred_at) AS first_at, max(lt.transferred_at) AS last_at
  FROM lent_puzzle_transfer lt LEFT JOIN player pl ON pl.id = lt.to_player_id
  GROUP BY 1, 2)
SELECT count(*) AS journeys, (SELECT count(DISTINCT coalesce(owner_player_id::text, owner_name)) FROM lent_puzzle_transfer) AS owners_ever,
       max(transfers) AS max_transfers, max(passes) AS max_passes, max(holders) AS max_holders, max(countries) AS max_countries,
       count(*) FILTER (WHERE passes >= 3) AS journeys_3plus_passes, count(*) FILTER (WHERE holders >= 5) AS journeys_5plus_holders,
       count(*) FILTER (WHERE countries >= 2) AS cross_border, round(avg(holders), 2) AS avg_holders,
       max(extract(day FROM last_at - first_at))::int AS longest_days,
       min(first_at)::date AS first_lend
FROM tr;
