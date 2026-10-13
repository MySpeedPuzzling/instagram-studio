-- Brainstorm 2026-10: the XP economy since launch - XP by reason, and player moments by type. Aggregate only.
SELECT 'xp' AS kind, reason AS label, count(*) AS entries, sum(amount) AS total
FROM xp_entry GROUP BY reason
UNION ALL SELECT 'moment', type, count(*), count(DISTINCT player_id) FROM player_moment GROUP BY type
UNION ALL SELECT 'badge_tier', type || ' t' || coalesce(tier::text, '-'), count(*), count(DISTINCT player_id) FROM badge GROUP BY type, tier
ORDER BY 1, 4 DESC;
