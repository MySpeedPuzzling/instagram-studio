-- Wisconsin State Jigsaw Puzzle Championship: every edition on MSP with participant counts.
SELECT c.name, c.date_from::date AS date_from, c.location AS location,
  (SELECT count(*) FROM competition_participant cp WHERE cp.competition_id = c.id AND cp.deleted_at IS NULL) AS participants,
  (SELECT count(*) FROM competition_participant cp WHERE cp.competition_id = c.id AND cp.deleted_at IS NULL AND cp.player_id IS NOT NULL) AS linked_players,
  (SELECT count(DISTINCT cp.country) FROM competition_participant cp WHERE cp.competition_id = c.id AND cp.deleted_at IS NULL) AS countries
FROM competition c
WHERE c.name ILIKE '%Wisconsin%' AND c.approved_at IS NOT NULL AND NOT coalesce(c.is_draft, false)
ORDER BY c.date_from;
