-- Public events in the next 45 days and the previous edition's size (participants on MSP).
SELECT c.name, c.location_country_code AS country, c.date_from::date AS date_from, c.is_online,
       (SELECT count(*) FROM competition_participant cp WHERE cp.competition_id = c.id AND cp.deleted_at IS NULL) AS participants,
       (SELECT count(*) FROM competition_participant cp WHERE cp.competition_id = c.id AND cp.deleted_at IS NULL AND cp.player_id IS NOT NULL) AS linked_players
FROM competition c
WHERE c.approved_at IS NOT NULL AND NOT coalesce(c.is_draft, false)
  AND c.date_from >= now() - interval '2 days' AND c.date_from < now() + interval '45 days'
ORDER BY c.date_from;
