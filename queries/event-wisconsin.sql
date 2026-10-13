-- Wisconsin State Jigsaw Puzzle Championship: every edition on MSP with participant counts.
-- Private profiles excluded (player.is_private, 2026-10-13): participants linked to a private player are not counted;
-- unlinked participants (name only, no MSP profile) are.
WITH cp AS (
  SELECT cp.competition_id, cp.player_id, cp.country
  FROM competition_participant cp LEFT JOIN player pl ON pl.id = cp.player_id
  WHERE cp.deleted_at IS NULL AND NOT coalesce(pl.is_private, false))
SELECT c.name, c.date_from::date AS date_from, c.location AS location,
  (SELECT count(*) FROM cp WHERE cp.competition_id = c.id) AS participants,
  (SELECT count(*) FROM cp WHERE cp.competition_id = c.id AND cp.player_id IS NOT NULL) AS linked_players,
  (SELECT count(DISTINCT cp.country) FROM cp WHERE cp.competition_id = c.id) AS countries
FROM competition c
WHERE c.name ILIKE '%Wisconsin%' AND c.approved_at IS NOT NULL AND NOT coalesce(c.is_draft, false)
ORDER BY c.date_from;
