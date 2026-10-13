-- Brainstorm 2026-10: the XP economy since launch - XP by reason, and player moments by type. Aggregate only.
-- Private profiles excluded: XP entries, moments and badges of players with player.is_private never count (2026-10-13).
SELECT 'xp' AS kind, x.reason AS label, count(*) AS entries, sum(x.amount) AS total
FROM xp_entry x JOIN player pl ON pl.id = x.player_id WHERE NOT pl.is_private GROUP BY x.reason
UNION ALL SELECT 'moment', mo.type, count(*), count(DISTINCT mo.player_id)
  FROM player_moment mo JOIN player pl ON pl.id = mo.player_id WHERE NOT pl.is_private GROUP BY mo.type
UNION ALL SELECT 'badge_tier', b.type || ' t' || coalesce(b.tier::text, '-'), count(*), count(DISTINCT b.player_id)
  FROM badge b JOIN player pl ON pl.id = b.player_id WHERE NOT pl.is_private GROUP BY b.type, b.tier
ORDER BY 1, 4 DESC;
