-- XP level distribution (players with XP who did not opt out of the experience system).
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT level, count(*) AS players FROM player
WHERE xp_total > 0 AND NOT experience_system_opted_out AND NOT is_private
GROUP BY 1 ORDER BY 1;
