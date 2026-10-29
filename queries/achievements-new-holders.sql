-- Holders of the 5 achievements added 2026-10-29, per tier (aggregate only; no players). The `badge` table holds one row
-- per earned tier (type, tier 1 Bronze .. 5 Diamond); the app awarded everyone who already qualified on release day,
-- dated from their history. Private profiles are excluded (owner rule, aggregates included). `active_players` is the
-- site's rarity denominator (players with xp_total > 0), also without private profiles.
SELECT
  b.type,
  b.tier,
  count(DISTINCT b.player_id) AS holders,
  (SELECT count(*) FROM player p2 WHERE p2.xp_total > 0 AND NOT p2.is_private) AS active_players
FROM badge b
JOIN player p ON p.id = b.player_id
WHERE NOT p.is_private
  AND b.type IN ('muscle_memory', 'muscle_memory_unboxed', 'night_owl', 'competitor', 'online_competitor')
GROUP BY b.type, b.tier
ORDER BY b.type, b.tier;
