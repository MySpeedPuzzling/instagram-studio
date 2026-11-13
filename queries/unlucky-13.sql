-- Friday the 13th: solo 500-piece results that missed (or just made) the hour by 13 seconds or less,
-- plus how many logged results finished in exactly 13:13 / 1:13:13. Aggregates only.
-- Private profiles excluded (player.is_private); suspicious results excluded.
SELECT
  count(*) FILTER (WHERE t.seconds_to_solve BETWEEN 3600 AND 3613) AS missed_hour_by_0_13s,
  count(*) FILTER (WHERE t.seconds_to_solve BETWEEN 3587 AND 3599) AS made_hour_by_1_13s,
  count(*) FILTER (WHERE t.seconds_to_solve = 3600) AS exactly_1h,
  count(*) FILTER (WHERE t.seconds_to_solve = 3599) AS exactly_59_59,
  count(*) FILTER (WHERE t.seconds_to_solve = 4393) AS exactly_1_13_13,
  count(DISTINCT t.player_id) FILTER (WHERE t.seconds_to_solve BETWEEN 3600 AND 3613) AS puzzlers_missed,
  count(*) AS all_solo_500
FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND p.pieces_count = 500
  AND t.seconds_to_solve IS NOT NULL AND (p.hide_until IS NULL OR p.hide_until <= now());
