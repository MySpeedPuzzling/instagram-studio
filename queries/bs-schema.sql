-- Brainstorm 2026-10: column discovery for content-relevant tables (schema only, no rows).
SELECT table_name, string_agg(column_name || ':' || data_type, ', ' ORDER BY ordinal_position) AS cols
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN (
  'puzzle','manufacturer','tag','puzzle_tag','lent_puzzle','lent_puzzle_transfer','sell_swap_list_item','sold_swapped_item',
  'collection','collection_item','wish_list_item','badge','xp_entry','player_moment','puzzling_team','stopwatch',
  'competition','competition_round','competition_round_puzzle','puzzle_statistics','puzzle_difficulty','player_elo',
  'feature_request','puzzle_change_request','transaction_rating','marketplace_rating','puzzle_review','puzzle_rating')
GROUP BY 1 ORDER BY 1;
