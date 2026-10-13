-- Brainstorm 2026-10: puzzle titles shared by the most different puzzles (catalogue), plus brand count.
-- Catalogue only (no player rows), so the private-profile rule (player.is_private, 2026-10-13) has nothing to filter.
SELECT lower(trim(p.name)) AS title, count(*) AS puzzles, count(DISTINCT p.manufacturer_id) AS brands,
       count(DISTINCT p.pieces_count) AS sizes
FROM puzzle p WHERE (p.hide_until IS NULL OR p.hide_until <= now())
GROUP BY 1 HAVING count(*) >= 8 ORDER BY 2 DESC LIMIT 30;
