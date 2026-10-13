-- Brainstorm 2026-10: how good is MSP's time prediction? Solo results with a prediction snapshot, by prediction source:
-- share inside the predicted range, share faster than predicted, median absolute error. Aggregate only.
SELECT coalesce(t.prediction_source, '-') AS source, coalesce(t.prediction_method, '-') AS method, count(*) AS predicted_results, min(t.tracked_at)::date AS since,
  round(100.0 * count(*) FILTER (WHERE t.seconds_to_solve BETWEEN t.predicted_range_low_seconds AND t.predicted_range_high_seconds) / count(*), 1) AS pct_in_range,
  round(100.0 * count(*) FILTER (WHERE t.seconds_to_solve < t.predicted_seconds) / count(*), 1) AS pct_beat_prediction,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY abs(t.seconds_to_solve - t.predicted_seconds)::numeric / t.predicted_seconds))::numeric * 100, 1) AS median_abs_error_pct,
  count(*) FILTER (WHERE t.seconds_to_solve = t.predicted_seconds) AS exact_to_second
FROM puzzle_solving_time t
WHERE NOT t.suspicious AND t.puzzling_type = 'solo' AND t.seconds_to_solve > 0 AND t.predicted_seconds > 0
GROUP BY 1, 2 ORDER BY 3 DESC;
