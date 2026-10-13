-- XP level distribution (players with XP who did not opt out of the experience system).
SELECT level, count(*) AS players FROM player
WHERE xp_total > 0 AND NOT experience_system_opted_out
GROUP BY 1 ORDER BY 1;
