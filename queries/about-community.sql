-- "Start here" explainer (about post): the size of the community and of the puzzle database, for the slides.
-- Players = registered players without a private profile (the bio number, owner decision 2026-10-18), and their
-- countries; private profiles excluded from every column (player.is_private, 2026-10-13).
-- Puzzles = approved puzzles not under embargo (hide_until); brands = approved brands with at least one of them;
-- events = approved, non-draft competitions on the events calendar (public ones only).
WITH pz AS (
  SELECT id, manufacturer_id, image FROM puzzle
  WHERE approved AND (hide_until IS NULL OR hide_until <= now()))
SELECT (SELECT count(*) FROM player WHERE NOT is_private) AS players,
       (SELECT count(DISTINCT NULLIF(country, '')) FROM player WHERE NOT is_private) AS countries,
       (SELECT count(*) FROM pz) AS puzzles,
       (SELECT count(*) FROM pz WHERE image IS NOT NULL AND image <> '') AS puzzles_with_image,
       (SELECT count(DISTINCT m.id) FROM manufacturer m JOIN pz ON pz.manufacturer_id = m.id WHERE m.approved) AS brands,
       (SELECT count(*) FROM competition c
         WHERE c.approved_at IS NOT NULL AND c.rejected_at IS NULL AND NOT coalesce(c.is_draft, false)) AS events;
