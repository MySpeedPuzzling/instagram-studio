-- "Start here" explainer: the owner's pick for the cover and Ravensburger's box on the wall (2026-10-18: not the
-- postcard from the recent quiz). Skipped if it ever becomes embargoed or its image is hidden.
SELECT p.id AS puzzle_id, p.name AS puzzle, m.name AS brand, p.pieces_count AS pieces, p.image
FROM puzzle p JOIN manufacturer m ON m.id = p.manufacturer_id
WHERE p.id = '01907de0-be32-737f-902c-23a899bf474f' AND p.approved AND p.image IS NOT NULL
  AND (p.hide_until IS NULL OR p.hide_until <= now()) AND (p.hide_image_until IS NULL OR p.hide_image_until <= now());
