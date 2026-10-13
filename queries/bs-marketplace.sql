-- Brainstorm 2026-10: marketplace hand-overs (aggregate) - the most re-homed puzzles, ratings, cross-border share.
-- Private profiles excluded (player.is_private, 2026-10-13): hand-overs whose seller or buyer is private, ratings whose
-- reviewer or reviewed player is private, and listings by private players are left out.
WITH ss AS (
  SELECT x.puzzle_id, x.sold_at, ps.country AS seller_country, pb.country AS buyer_country
  FROM sold_swapped_item x LEFT JOIN player ps ON ps.id = x.seller_id LEFT JOIN player pb ON pb.id = x.buyer_player_id
  WHERE NOT coalesce(ps.is_private, false) AND NOT coalesce(pb.is_private, false)),
s AS (
  SELECT ss.puzzle_id, count(*) AS handovers FROM ss GROUP BY 1),
top AS (
  SELECT p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, s.handovers
  FROM s JOIN puzzle p ON p.id = s.puzzle_id JOIN manufacturer m ON m.id = p.manufacturer_id
  WHERE (p.hide_until IS NULL OR p.hide_until <= now()) ORDER BY s.handovers DESC LIMIT 8)
SELECT 'top' AS kind, puzzle || ' (' || brand || ', ' || pieces || ')' AS label, handovers::text AS value FROM top
UNION ALL SELECT 'ratings', 'count / avg stars / 5-star pct', count(*) || ' / ' || round(avg(tr.stars), 2) || ' / ' || round(100.0 * count(*) FILTER (WHERE tr.stars = 5) / nullif(count(*), 0), 1)
  FROM transaction_rating tr LEFT JOIN player rv ON rv.id = tr.reviewer_id LEFT JOIN player rd ON rd.id = tr.reviewed_player_id
  WHERE NOT coalesce(rv.is_private, false) AND NOT coalesce(rd.is_private, false)
UNION ALL SELECT 'handovers_by_year', extract(year FROM sold_at)::text, count(*)::text FROM ss GROUP BY extract(year FROM sold_at)
UNION ALL SELECT 'cross_border', 'buyer and seller country differ / both known',
  count(*) FILTER (WHERE seller_country <> buyer_country) || ' / ' || count(*) FROM ss
  WHERE nullif(seller_country, '') IS NOT NULL AND nullif(buyer_country, '') IS NOT NULL
UNION ALL SELECT 'listings_condition', li.condition, count(*)::text
  FROM sell_swap_list_item li JOIN player pl ON pl.id = li.player_id WHERE NOT pl.is_private GROUP BY li.condition;
