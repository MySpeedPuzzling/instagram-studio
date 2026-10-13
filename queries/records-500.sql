-- Solo 500 records, anonymous: fastest personal best overall and fastest first attempt (seconds).
-- Private profiles excluded (player.is_private; owner decision 2026-10-13).
SELECT
  (SELECT min(t.seconds_to_solve) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
   WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND p.pieces_count = 500 AND t.seconds_to_solve > 0) AS fastest_any,
  (SELECT min(t.seconds_to_solve) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
   WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND p.pieces_count = 500 AND t.seconds_to_solve > 0 AND t.first_attempt) AS fastest_first_try,
  (SELECT count(*) FROM puzzle_solving_time t JOIN player pl ON pl.id = t.player_id JOIN puzzle p ON p.id = t.puzzle_id
   WHERE NOT t.suspicious AND NOT pl.is_private AND t.puzzling_type = 'solo' AND p.pieces_count = 500 AND t.seconds_to_solve > 0 AND t.first_attempt) AS first_tries;
