-- Finished-puzzle photos uploaded with results (all time / last 30 days / last week), from players who may be featured.
SELECT count(*) FILTER (WHERE t.finished_puzzle_photo IS NOT NULL) AS photos_all,
       count(*) FILTER (WHERE t.finished_puzzle_photo IS NOT NULL AND t.tracked_at >= now() - interval '30 days') AS photos_30d,
       count(*) FILTER (WHERE t.finished_puzzle_photo IS NOT NULL AND t.tracked_at >= date_trunc('week', now()) - interval '7 days' AND t.tracked_at < date_trunc('week', now())) AS photos_last_week,
       count(DISTINCT t.player_id) FILTER (WHERE t.finished_puzzle_photo IS NOT NULL AND t.tracked_at >= now() - interval '30 days') AS photographers_30d,
       (SELECT count(*) FROM puzzle WHERE image IS NOT NULL) AS puzzles_with_box_image
FROM puzzle_solving_time t JOIN player p ON p.id = t.player_id
WHERE NOT t.suspicious AND NOT p.is_private AND NOT p.ranking_opted_out;
