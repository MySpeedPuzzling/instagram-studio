# Reel idea: five new achievements (feature launch)

Owner idea 2026-10-29: a Reel launching the 5 new MSP achievements: each badge with one short line on how to earn
it. Copy direction from the owner: "To the badges you already earn for your milestones we're adding 5 new ones;
here is what gets rewarded." Aim: non-followers think "they have achievements for solving puzzles?".

Facts from the app repo (speedpuzzling.cz, `docs/features/badges.md`, section "The five added 2026-10-28"), relayed
by the app session on 2026-10-29. **Not released yet**: re-check rules and texts in the app on the day of drafting.

## The five (each 5 tiers: Bronze, Silver, Gold, Platinum, Diamond)

| Key | EN name | Tiers | Rule (short) |
|---|---|---|---|
| `muscle_memory` | Muscle Memory | 3/8/15/30/50 | solves of your most-solved 500-piece puzzle, solo, suspicious excluded |
| `muscle_memory_unboxed` | Muscle Memory (unboxed) | 2/4/8/15/25 | same, only solves without the box picture |
| `night_owl` | Night Owl | 10/30/75/150/250 | results logged 22:00–04:00 in your time zone (needs a time zone in the profile) |
| `competitor` | Competitor | 1/3/6/12/25 | public in-person competitions you took part in (not swaps, workshops, meetups) |
| `online_competitor` | Online Competitor | 2/6/12/25/50 | results in public online competitions |

User-facing texts: app `translations/messages.en.yml`, keys `badges.badge.<key>`, `badges.description.<key>`,
`badges.requirement.<key>_1.._5` (all 6 locales). Use those words, not ours.

- Existing: 16 tiered achievements (+ Early Adopter, admin-granted). Safe line: "5 new achievements join the existing
  16: 21 to earn".
- **Retroactive:** after deploy everyone who already qualifies gets the badges, dated from history ("you may already
  have these"). Night Owl only for players with a time zone set (a CTA: set your time zone).
- Link sticker: myspeedpuzzling.com/en/achievements.
- Data for a later holder-count beat: table `badge` (player_id, type, tier, earned_at); exclude private profiles;
  the site's rarity denominator is players with xp_total > 0.

## Blockers

- **Art for the 5 new badges is being reworked** (owner review 2026-10-28/29). Don't copy or animate it until the app
  session reports it approved; then copy `public/img/badges/svg/` and `png/` into gitignored `content/assets/achievements/`.
- **No release date:** ships after the art is approved. The Reel goes out on release day (or the day after, once badges
  have been recalculated).

## Plan

- Format: Reel (reach to non-followers; owner decision 2026-10-14: HyperFrames for feature reveals) + Story share with
  a link sticker; optional carousel later as a "save this" reference.
- Build in HyperFrames from the SVG masters (sharp, house style). Optional: one screen-recorded beat of the real
  detail sheet / holo medal from the local dev stack with fixture players (never real members).
- Tie-in: Muscle Memory echoes "The grind" Reel (27 Oct).
- Lab first (key frames in 2–3 looks for Works / Unsure / No-go), then the builder. Owner 2026-10-29: start the lab only once the final art is in (no stand-ins).
