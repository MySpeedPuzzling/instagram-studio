-- Brainstorm 2026-10: marketplace hand-overs (aggregate) - the most re-homed puzzles, ratings, cross-border share.
WITH s AS (
  SELECT ss.puzzle_id, count(*) AS handovers FROM sold_swapped_item ss GROUP BY 1),
top AS (
  SELECT p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, s.handovers
  FROM s JOIN puzzle p ON p.id = s.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
  WHERE (p.hide_until IS NULL OR p.hide_until <= now()) ORDER BY s.handovers DESC LIMIT 8)
SELECT 'top' AS kind, puzzle || ' (' || brand || ', ' || pieces || ')' AS label, handovers::text AS value FROM top
UNION ALL SELECT 'ratings', 'count / avg stars / 5-star pct', count(*) || ' / ' || round(avg(stars), 2) || ' / ' || round(100.0 * count(*) FILTER (WHERE stars = 5) / nullif(count(*), 0), 1) FROM transaction_rating
UNION ALL SELECT 'handovers_by_year', extract(year FROM sold_at)::text, count(*)::text FROM sold_swapped_item GROUP BY extract(year FROM sold_at)
UNION ALL SELECT 'cross_border', 'buyer and seller country differ / both known',
  count(*) FILTER (WHERE ps.country <> pb.country) || ' / ' || count(*) FROM sold_swapped_item ss JOIN player ps ON ps.id = ss.seller_id JOIN player pb ON pb.id = ss.buyer_player_id
  WHERE nullif(ps.country, '') IS NOT NULL AND nullif(pb.country, '') IS NOT NULL
UNION ALL SELECT 'listings_condition', condition, count(*)::text FROM sell_swap_list_item GROUP BY condition;
