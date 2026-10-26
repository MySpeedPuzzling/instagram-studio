-- Upcoming public in-person events that have a partner finder (aggregate only; no players). Mirrors the app's rule
-- exactly (PartnerFinderEligibility::SQL_QUALIFIES + the gate page's slug filter, GetPartnerFinderEvents), so the count
-- matches what myspeedpuzzling.com/en/partner-finder shows ("N coming in-person events with pair or team rounds"):
-- in person, dated, not over, publicly visible (a one-time event approved; a series edition through its approved
-- series), never a draft or rejected, with a slug, and offering a pair or a team (a duo/team round, or no rounds yet).
-- 2026-10-22: the first version required the event's own approval and missed series editions (27 vs the site's 44).
SELECT
  count(*) AS with_finder,
  count(*) FILTER (WHERE has_pair_team) AS with_pair_team_rounds,
  count(*) FILTER (WHERE NOT has_rounds) AS without_rounds_yet,
  count(DISTINCT country) AS countries,
  sum(open_listings) AS open_listings,
  count(*) FILTER (WHERE open_listings > 0) AS events_with_listings
FROM (
  SELECT COALESCE(c.location_country_code, cs.location_country_code) AS country,
         EXISTS (SELECT 1 FROM competition_round r WHERE r.competition_id = c.id) AS has_rounds,
         EXISTS (SELECT 1 FROM competition_round r WHERE r.competition_id = c.id AND r.category IN ('duo', 'team')) AS has_pair_team,
         (SELECT count(*) FROM partner_listing pl WHERE pl.competition_id = c.id AND pl.closed_at IS NULL) AS open_listings
  FROM competition c
  LEFT JOIN competition_series cs ON cs.id = c.series_id
  WHERE c.is_online = false
    AND c.date_from IS NOT NULL
    AND COALESCE(c.date_to, c.date_from)::date >= (now() AT TIME ZONE 'Europe/Prague')::date
    AND c.rejected_at IS NULL AND c.is_draft = false
    AND ((c.series_id IS NULL AND c.approved_at IS NOT NULL)
      OR (c.series_id IS NOT NULL AND cs.approved_at IS NOT NULL AND cs.rejected_at IS NULL AND cs.is_draft = false))
    AND c.slug IS NOT NULL
    AND (c.series_id IS NULL OR cs.slug IS NOT NULL)
    AND (EXISTS (SELECT 1 FROM competition_round r WHERE r.competition_id = c.id AND r.category IN ('duo', 'team'))
      OR NOT EXISTS (SELECT 1 FROM competition_round r WHERE r.competition_id = c.id))
) e;
