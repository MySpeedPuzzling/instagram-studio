-- Public events in the next 45 days and the previous edition's size (participants on MSP).
-- Private profiles excluded (player.is_private, 2026-10-13): participants linked to a private player are not counted;
-- unlinked participants (name only, no MSP profile) are.
WITH cp AS (
  SELECT cp.competition_id, cp.player_id
  FROM competition_participant cp LEFT JOIN player pl ON pl.id = cp.player_id
  WHERE cp.deleted_at IS NULL AND NOT coalesce(pl.is_private, false))
SELECT c.name, c.location_country_code AS country, c.date_from::date AS date_from, c.is_online,
       (SELECT count(*) FROM cp WHERE cp.competition_id = c.id) AS participants,
       (SELECT count(*) FROM cp WHERE cp.competition_id = c.id AND cp.player_id IS NOT NULL) AS linked_players
FROM competition c
WHERE c.approved_at IS NOT NULL AND NOT coalesce(c.is_draft, false)
  AND c.date_from >= now() - interval '2 days' AND c.date_from < now() + interval '45 days'
ORDER BY c.date_from;
