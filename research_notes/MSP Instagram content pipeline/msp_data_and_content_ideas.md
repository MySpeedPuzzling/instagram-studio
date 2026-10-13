# MSP data model, read-only data access, brand assets and data-grounded Instagram content ideas

Scope note: this was a LOCAL investigation of the MySpeedPuzzling (MSP) codebase (Symfony/PHP, Docker Compose) plus
read-only SQL. Citations are repo-relative file paths in the MSP repo (`speedpuzzling.cz/...`). Database facts carry one
of two source tags:
- **`prod-db 2026-10-13 · Qnn`**: a read-only `SELECT` against the **production** PostgreSQL 16 database on
  **2026-10-13** (~11:15–11:35 UTC), through a read-only role and an SSH tunnel that the coordinator provided. Each query
  started with `SET statement_timeout = '60s'` and ran sequentially. The exact SQL for every `Qnn` is in section 3,
  "SQL used".
- `local-db`: the local development snapshot (used for schema discovery only; its numbers were superseded by production).

All numbers are aggregates. No player is named. No credentials, connection strings, hostnames or env var values appear
here. Brand names, puzzle titles and public competition names are public products and events.

---

## 1. Data model: what MSP holds and how deep it is

### Takeaway
MSP is a CQRS/DDD Symfony app on PostgreSQL with ~100 entities. The core is `player` → `puzzle_solving_time` → `puzzle` →
`manufacturer`. On top of that sit competitions and series, pairs/teams, collections, wishlists, a marketplace, lending,
stopwatch sessions, badges/XP, and precomputed "puzzle intelligence" and community tables. Each result stores
solo/duo/team type, team size, first-try and "unboxed" flags, an optional photo, an optional event link and a
prediction snapshot. That is enough data for statistics, records, trends and quizzes. Production holds 545k results
from 11.7k players on 42k puzzles.

### Cited Findings
- Core entities by design: Player, Puzzle, PuzzleSolvingTime ("records of puzzle completion times with verification"), Competition, Stopwatch; CQRS with commands in `src/Message/`, queries in `src/Query/`, DTOs in `src/Results/` — [CLAUDE.md §Core Entities / CQRS](speedpuzzling.cz/CLAUDE.md)
- ~100 Doctrine entities exist in `src/Entity/`, including `Badge`, `Collection`/`CollectionItem`, `CommunityScopeStats`, `Competition*` (Participant, Round, RoundPuzzle, Series, Team, Referee), `LentPuzzle`, `Manufacturer`, `PlayerElo`, `PlayerSkill`, `PlayerMoment`, `PuzzleDifficulty`, `PuzzleStatistics`, `PuzzlingTeam`, `SellSwapListItem`, `SoldSwappedItem`, `Stopwatch`, `Tag`, `WishListItem`, `XpEntry`, `WjpcParticipant`, `FeatureRequest` — [src/Entity/](speedpuzzling.cz/src/Entity)
- Production schema head: migration `Version20261012053303` (240 applied), the same as the newest file in the repo — `prod-db 2026-10-13 · Q00`
- Production row counts (2026-10-13): `xp_entry` 1,042,214 · `puzzle_solving_time` 545,521 · `collection_item` 96,610 · `badge` 67,518 · `puzzle` 42,374 · `puzzle_difficulty` 37,121 · `stopwatch` 29,645 · `puzzling_team` 12,274 · `player` 11,680 · `wish_list_item` 9,278 · `competition_participant` 4,367 · `player_skill` 2,797 · `player_moment` 2,299 · `manufacturer` 2,104 · `sold_swapped_item` 1,857 · `sell_swap_list_item` 1,478 · `lent_puzzle` 1,164 · `player_elo` 1,149 · `competition` 466 · `competition_round` 388 · `collection` 385 · `community_scope_stats` 85 · `competition_series` 21 — `prod-db 2026-10-13 · Q00`
- `puzzle_solving_time` columns (key ones): `player_id`, `puzzle_id`, `seconds_to_solve` (NULL = no time logged), `tracked_at` (when it was logged), `finished_at` (the solve date), `puzzling_type` (`solo`/`duo`/`team`), `puzzlers_count`, `team` (json), `puzzling_team_id`, `first_attempt`, `unboxed`, `finished_puzzle_photo`, `comment`, `competition_id`, `competition_round_id`, `competition_series_id`, `series_edition_match`, `suspicious`, `verified`, `qualified`, `pieces_placed`, `finished_later_seconds`, prediction fields (`predicted_seconds`, `predicted_range_low/high_seconds`, `prediction_method`, `prediction_source`, `prediction_model_version`), `created_via`, `pieces_count_snapshot` — `local-db:information_schema.columns`
- `unboxed` means "Solved without looking at the box image". `first_attempt` means "Your first assembling of this puzzle ever". For a group it is only true "if no-one assembled this puzzle before, not even solo" — [translations/messages.en.yml](speedpuzzling.cz/translations/messages.en.yml) (keys `unboxed`, `first_attempt_help`)
- `player` columns include `name` (public name, may be a nickname), `country`, `city`, `avatar`, `bio`, `instagram`, `facebook`, `twitch`, `locale`, `registered_at`, `is_private`, the opt-outs `ranking_opted_out`, `streak_opted_out`, `karma_opted_out`, `experience_system_opted_out` and `time_predictions_opted_out`, plus `xp_total`, `level`, `achievement_points` and `karma`. Emails live in a separate account table, not in `player` — `local-db:information_schema.columns`
- `puzzle` columns: `name`, `alternative_names` (jsonb, multilingual), `pieces_count`, `manufacturer_id`, `ean`, `identification_number` (brand code), `image`, `approved`, `added_at`, and the embargo columns `hide_until` / `hide_image_until` — `local-db:information_schema.columns`; semantics in [docs/features/unreleased-puzzle/README.md](speedpuzzling.cz/docs/features/unreleased-puzzle/README.md), [docs/ravensburger-puzzle-month.md](speedpuzzling.cz/docs/ravensburger-puzzle-month.md)
- `puzzle_statistics` is a precomputed per-puzzle table: count, fastest, average, slowest and median, each split into all/solo/duo/team, plus first-attempt averages and fastest times — `local-db:information_schema.columns`
- `puzzle_difficulty` holds `difficulty_score`, `difficulty_tier`, `confidence`, `sample_size`, `memorability_score`, `skill_sensitivity_score`, `predictability_score`, `box_dependence_score` and `improvement_ceiling_score`. `player_skill` holds `skill_score`, `skill_tier`, `skill_percentile` and `confidence` per piece count. `player_elo` holds the MSP Rating. All are batch-computed every 15 minutes (`myspeedpuzzling:recalculate-puzzle-intelligence`) — [CLAUDE.md §Puzzle Insights System](speedpuzzling.cz/CLAUDE.md)
- `community_scope_stats` (one row for World plus one per country; 85 rows in production, recomputed minutes before the query): `registered_players`, `active30d`, `solves30d`, `solves_prev30d`, `active_this_month`, `pieces_this_month`, `active_last_month`, `pieces_last_month`, `median_best500_seconds`, `puzzlers_with500`, `monthly_solves` (jsonb) and `new_faces14d`. It is filled by `RecalculateCommunityStatsConsoleCommand` — [src/ConsoleCommands/RecalculateCommunityStatsConsoleCommand.php](speedpuzzling.cz/src/ConsoleCommands/RecalculateCommunityStatsConsoleCommand.php); `prod-db 2026-10-13 · Q51`
- `player_moment` types: `personal_best`, `puzzles_milestone`, `pieces_milestone`, `first_result` — [src/Value/PlayerMomentType.php](speedpuzzling.cz/src/Value/PlayerMomentType.php)
- Competitions: `competition` has name, location, `location_country_code`, dates, `is_online`, `series_id`, `organization_id`, approval and `is_draft`. `competition_round` has `minutes_limit`, `category`, `team_size` and results-published timestamps. `competition_participant` has name, country, an optional `player_id` link and registration status — `local-db:information_schema.columns`
- Suspicious times are "neither counted nor timed anywhere". People-facing text never says "suspicious" — [CLAUDE.md §Suspicious times](speedpuzzling.cz/CLAUDE.md). Production has only 3 flagged rows — `prod-db 2026-10-13 · Q02`
- XP / levels / achievements launched as an all-in launch in October 2026, announced in the ~11–12 Oct newsletter — [docs/features/xp-levels/launch-2026-10.md](speedpuzzling.cz/docs/features/xp-levels/launch-2026-10.md)

### Inferences
- The data is deep enough for an evergreen statistics series, without new collection features. Skill-adjusted per-puzzle difficulty also lets "hard vs easy" posts go beyond raw medians.
- Pipeline queries should copy the app's semantics. Exclude `suspicious = true`. Use `COALESCE(finished_at, tracked_at)` as the solve date. Solo = `puzzling_type = 'solo'` (equals `puzzlers_count = 1`). Require `seconds_to_solve > 0` for time stats. Take the piece count from `puzzle.pieces_count`.
- `community_scope_stats` is populated and fresh in production. It is a cheap, already privacy-reviewed source for "this month / last 30 days" posts.

### Gaps
- I did not read all ~100 entities in detail (for example karma, referral, organizations and round tables/seating). The tables listed are the content-relevant ones.

---

## 2. Data access: engine, connection, environments, and safe read-only access for the pipeline

### Takeaway
Production runs PostgreSQL 16.14. The app connects through Doctrine using `DATABASE_URL`. Two read paths exist today:
- the local Compose `postgres` service holds a dev snapshot ending 2026-09-25;
- a production read-only role, reached through an SSH tunnel, was provisioned for this project (2026-10-13).

The production role cannot write: its default transactions are read-only and it has no INSERT/UPDATE. But it can SELECT
**every table, including the account table with emails**. Before the pipeline runs unattended, narrow it to a schema of
privacy-filtered aggregate views, or use an aggregate-only export. The internal API is not a suitable channel, and the
public API has no aggregate endpoints.

### Cited Findings
- Compose services: `web`, `messenger-consumer`, `postgres` (`postgres:16.0`), `js-watch`, `redis`, `redis-state`, `mercure`, `adminer`, `imgproxy`, `images-cache`, `minio` (S3-compatible storage), `mailer`, `chrome`, `web-test`, `listmonk` (+ init/seed) — [compose.yml](speedpuzzling.cz/compose.yml)
- The local snapshot (database `speedpuzzling`, PG 16.0) has realistic data whose last real activity is 2026-09-25. Several leftover test databases (`speedpuzzling_test_*` etc.) exist beside it, so a pipeline must target the right DB explicitly — `local-db:version()`, `pg_database`, max(`tracked_at`)
- Production: PostgreSQL 16.14 (Debian, x86_64), schema at migration `Version20261012053303` — `prod-db 2026-10-13 · Q00`
- Production role posture (booleans checked 2026-10-13): `default_transaction_read_only = on`, `transaction_read_only = on`; INSERT and UPDATE on `player` = false; superuser = false; SELECT on `player` = true; **SELECT on `user_account` = true** — `prod-db 2026-10-13 · Q53`
- The pipeline's connection string is the env var `DATABASE_URL_TUNNEL` in the git-ignored `.env` of the msp-instagram repo (name only; the value is never printed) — coordinator instructions, 2026-10-13
- App connection env var: `DATABASE_URL`. Other data-relevant env var names: `REDIS_CACHE_DSN`, `REDIS_STATE_DSN`, `UPLOADS_BASE_URL`, `UPLOAD_SPOOL_DIR`, `INTERNAL_API_TOKEN`, `INTERNAL_API_REVIEWER_PLAYER_ID`, `MESSENGER_TRANSPORT_DSN`, `LISTMONK_*` — [.env (names only)](speedpuzzling.cz/.env); [config/](speedpuzzling.cz/config)
- The repo defines no read-only role, `GRANT` or replica (`grep` for `GRANT SELECT|CREATE ROLE|readonly` in `migrations/` and `config/` finds nothing). The production read-only role was set up outside the repo — [migrations/](speedpuzzling.cz/migrations), [config/](speedpuzzling.cz/config)
- Internal Admin API: `/internal-api/*`, "single static bearer token via `INTERNAL_API_TOKEN`". It is mostly write/moderation endpoints (feature requests, merges, change requests, manufacturers, competitions/rounds/series/organizations, time verification). Reads are limited to competitions, series, organizations, puzzles and the merge queue. There are no statistics endpoints — [CLAUDE.md §Internal Admin API](speedpuzzling.cz/CLAUDE.md); [docs/features/internal-api.md](speedpuzzling.cz/docs/features/internal-api.md)
- Public API v1: PAT and OAuth2 (`client_credentials` is read-only). Endpoints are per player (`/api/v1/players/{id}/results|statistics|…`), `/api/v1/me/*`, `/api/v1/puzzles`, `/api/v1/competitions` and `/api/v1/series`. **There is no global/aggregate endpoint** — [CLAUDE.md §API & Authentication](speedpuzzling.cz/CLAUDE.md); [templates/for-developers.html.twig](speedpuzzling.cz/templates/for-developers.html.twig)
- Hosting: servers, database and image storage at Hetzner (EU), images via Cloudflare. "Only the people who run the platform have access to the database" — [translations/messages.en.yml → privacy_policy.content §7, §13](speedpuzzling.cz/translations/messages.en.yml)
- File storage: `oneup_flysystem` with `FailoverS3Adapter` (AsyncAws S3). Uploads go to a private bucket and "reads go through credentialed imgproxy" — [config/packages/oneup_flysystem.php](speedpuzzling.cz/config/packages/oneup_flysystem.php)
- The DB stores UTC. Site periods (digests) use Europe/Prague — [docs/features/content-digest/README.md](speedpuzzling.cz/docs/features/content-digest/README.md)

### Inferences
- **Today:** use the production role through the tunnel for aggregates only, with `statement_timeout`, sequential queries and LIMITs. Use the local snapshot for development and testing queries without touching production.
- **Hardening before unattended runs:**
  1. Revoke table-level SELECT from the pipeline role. Instead grant `USAGE` on a dedicated schema (for example `instagram`) and `SELECT` on **views** there, so the role cannot read `user_account`, auth logs, messages or raw personal fields.
  2. Bake the app's rules into those views: `suspicious = false`; exclude `is_private` and `ranking_opted_out` players from any named list; exclude `hide_until > now()` puzzles and `hide_image_until > now()` images; show only public events (reuse [IsCompetitionPubliclyVisible](speedpuzzling.cz/src/Query/IsCompetitionPubliclyVisible.php)); no emails, avatars or comments.
  3. Set `statement_timeout`, `idle_in_transaction_session_timeout` and `CONNECTION LIMIT` on the role.
- **Alternative with the smallest attack surface for a public-repo tool:** an MSP-side scheduled aggregate export (JSON/CSV). The pipeline then never holds DB credentials.
- **Don't** reuse `INTERNAL_API_TOKEN` (admin write power). If an API is preferred, add separate read-only insight endpoints with their own token.
- Committing SQL text to the public repo is fine. Keep query outputs that contain names or IDs out of git.

### Gaps
- Whether the production role is read-only at the database level beyond these defaults was not checked further. I did not inspect connection limits, `pg_hba` or replica status. `user_account` readability was confirmed by `has_table_privilege` only; no rows were read.

---

## 3. The dataset in numbers (PRODUCTION, queried 2026-10-13)

### Takeaway
As of 2026-10-13: 11,680 players (7,839 with results, 84 countries) have logged 545,521 results. That is **275 million
pieces** and **632k hours (≈ 72 years)** of timed puzzling on 42,374 puzzles from 2,104 brands. Results are up 77%
year over year, and active loggers up 46%. 500 pieces is the standard size: the median solo time is 64.8 min and the
record 16:30. Ravensburger holds 61% of results. Weekends (37.8% of solves), Sundays and evenings are the peaks. The
XP/levels launch day (12 Oct 2026) became the busiest logging day ever: 2,890 results, 45% of them back-filled old
solves.

### Cited Findings
Every bullet in this section: **production, queried 2026-10-13**. The `Qnn` tags refer to the SQL below.

**Totals and growth**
- Players: 11,680 (11,671 registered). 7,839 have at least one result. 84 countries. 4,742 (40.6%) have no country set — `Q03`
- Results: 545,521 total. Only 3 are flagged suspicious. Solo 471,431 · duo 59,498 · team 14,589 (3 = 3,276; 4 = 10,798; 5 = 318; 6 = 133; up to 13 people, once) — `Q01, Q02`
- Flags: first try 291,372 (53%) · unboxed 6,932 · no time logged 15,501 · finished-puzzle photo 64,651 (11.9%) · linked to an event 19,361 · comment 11,292 · 2 results dated in the future (latest 2029-09-30, a typo) — `Q02, Q00`
- Totals: **275,193,420 pieces**; **632,494 hours ≈ 72.2 years** of logged solving time — `Q06`
- Results logged per year: 2024 = 67,166 · 2025 = 199,699 · 2026 to 13 Oct = 278,146 — `Q07`
- New players per year: 2023 = 62 (launch; first registration Nov 2023) · 2024 = 3,270 · 2025 = 3,910 · 2026 to 13 Oct = 4,438 — `Q08`
- Year over year, 1 Jan to 12 Oct: results 156,484 → 277,577 (**+77%**) · distinct active loggers 3,727 → 5,427 (**+46%**) · new players 3,229 → 4,433 (**+37%**) — `Q09`
- Monthly results / active loggers / pieces: Jan 2025 13,679 / 1,312 / 6.8M · Aug 2025 20,401 / 1,625 / 10.2M · Jan 2026 22,072 / 1,843 / 11.4M · Apr 2026 33,179 / 2,397 / 16.3M · Aug 2026 33,115 / 2,484 / 16.5M · **Sep 2026 33,198 / 2,687 / 16.8M (record month)** · Oct 2026 (1–13) 16,395 / 2,156 / 9.1M — `Q10`
- New players per month: record **596 in Sep 2026** (Aug 2026 568, Apr 2026 562); low 224 (Dec 2025) — `Q11`
- Community stats table (World, computed 2026-10-13 11:14 UTC): 3,071 puzzlers active in the last 30 days; 34,053 solves in the last 30 days (prev 30 days 35,828); 156 "new faces" in 14 days; median personal best on 500 pieces 63.9 min across 6,776 puzzlers. Its `active_last_month` (2,956) and `pieces_last_month` (18.3M) differ from the `tracked_at`-based figures in Q10 (definitions differ) — `Q51`
- Busiest logging days ever: **2026-10-12 = 2,890** (XP launch) · 2026-03-31 = 1,675 · 2026-04-06 = 1,630 · 2026-09-26 = 1,582 · 2026-08-30 = 1,551 — `Q25`
- On 2026-10-12, 1,305 of the 2,890 results had a solve date more than 7 days earlier (45%; ordinary days have 44–232 such rows) — `Q26`
- Busiest solve dates: 2026-04-19 = 1,519 · 2026-05-02 = 1,502 · 2026-04-25 = 1,468 · 2026-04-18 = 1,466 — `Q25`
- Back-logging: results with a solve date more than 30 days before logging were 15.9% in 2024, 7.3% in 2025 and 8.3% in 2026 — `Q27`
- Per player: median 12 results; 1,381 players have 100+, 35 have 1,000+; the maximum is 2,391 (anonymous). 466 players have solved one puzzle 10+ times; the record is **196 solves of the same puzzle by one player** — `Q46`

**Solve times, solo (minutes)** — `Q12`

| Pieces | n | p10 | p25 | median | p75 | p90 | p99 | fastest |
|---|---|---|---|---|---|---|---|---|
| 100 | 7,128 | 5.8 | 7.0 | 8.8 | 11.4 | 14.9 | 32.9 | 3.6 |
| 200 | 12,528 | 14.3 | 17.2 | 21.6 | 28.1 | 36.5 | 75.1 | 6.9 |
| 300 | 31,893 | 24.4 | 29.8 | 38.4 | 50.3 | 64.0 | 107.9 | 1.6 (outlier) |
| 500 | 355,152 | 43.0 | 52.1 | **64.8** | 82.9 | 106.0 | 175.3 | **16.5** |
| 1000 | 19,363 | 115.6 | 146.2 | **195.9** | 270.3 | 370.4 | 744.9 | 56.9 |
| 1500 | 524 | 244.4 | 320.4 | 425.0 | 575.0 | 759.4 | 1221.6 | 67.0 |
| 2000 | 372 | 391.3 | 485.2 | 646.3 | 876.3 | 1244.3 | 2308.4 | 213.8 |
| 3000 | 137 | 856.6 | 1039.0 | 1246.6 | 1560.0 | 2097.0 | 3857.3 | 556.2 |

- Catalogue by size: 500 = 14,975 puzzles · 1000 = 12,667 · 300 = 3,773 · 100 = 1,753 — `Q05`
- **Records (anonymous):** the 10 fastest solo-500 personal bests are 16:30, 17:17, 17:27, 17:44, 17:44, 17:56, 18:17, 19:02, 19:04 and 19:16. All ten were repeat attempts on a known puzzle. The **fastest first-try** solo 500 is 22:30 — `Q19, Q19b`
- Group size vs time (median / fastest). 500: solo 64.8 / 16:30 · duo 44.6 / 10:55 (n=48,246) · trio 39.0 / 9:49 · team of 4 **30.6 / 6:36** (n=2,506). 1000: solo 195.9 / 56:52 · duo 106.3 / 38:08 · trio 87.6 / 34:42 · team of 4 **61.8 / 22:36** (n=7,681) — `Q13`
- First try vs repeat, solo median. 500: 70.1 (n=190,668) vs 59.3 (n=164,484), **−15%**. 1000: 202.1 vs 177.7, −12% — `Q14`
- Repeat attempts on the **same** puzzle (solo 500; median ratio to that player's 1st attempt): 2nd 0.89 (69,226 pairs) · 3rd 0.82 · 4th 0.77 · **5th 0.73 (−27%)** — `Q45`
- Long-run improvement: across 2,584 puzzlers with 20+ solo-500 results, the median of the first-5 average is 86.3 min and of the last-5 average 69.5 min. The median ratio is **0.81 (≈ 19–20% faster)** — `Q44`
- Unboxed vs with box, solo median. 500: 62.0 (n=4,468) vs 64.8. 1000: 242.0 (n=306) vs 195.0 — `Q15`
- **59-minute wall** (solo 500, results per whole minute): 55 = 7,318 · 56 = 7,188 · 57 = 7,403 · **58 = 7,449 (mode)** · 59 = 7,383 · **60 = 6,832 (−7.5%)** · 61 = 6,741 · 62 = 6,670. There is no similar step at 45 or 50 minutes (44→45 rises; 49→50 = −0.6%). For 1000 pieces there is no visible step at 120 or 180 minutes (≈ 80–110 results per minute, noisy) — `Q16, Q16b`
- Only 4.6% of timed results are a whole number of minutes — `Q17`
- Personal bests on solo 500 (6,776 puzzlers): under 25 min = 64 · under 30 = 346 · under 45 = 1,510 · **under 60 = 3,058 (45%)** · median personal best 63.9 min — `Q18`
- Longest logged solo times: 500 pieces 88.0 h (almost certainly mislogged) · 1000 pieces 52.8 h — `Q20`
- Largest puzzles with a logged result: Around the World (Educa, 42,000 pcs, 2 results) · Memorable Disney Moments (Ravensburger, 40,000, 3) · Keith Haring – Double Retrospect (Ravensburger, 32,000, 1) · Life (Educa, 24,000, 5) · Historische Weltkarten (Weltbild, 20,000, 1). 237 results are on 5,000+ piece puzzles — `Q50`

**When people puzzle**
- Solve weekday (`finished_at`): Mon 69,145 · **Tue 65,210 (lowest)** · Wed 66,237 · Thu 66,539 · Fri 70,707 · Sat 101,375 · **Sun 104,275 (highest)**. Weekend = **37.8%** of solves vs 28.6% if spread evenly — `Q21`
- Logging hour (UTC, 2025+): peak **19:00 (34,854)**, trough 05:00 (8,980), a 3.9× ratio. `finished_at` is effectively date-only, so the solve hour is unknown — `Q22`
- 2025 solves by month: Jan 14,283 · Feb 14,446 · Mar 17,605 · Apr 16,006 · May 16,030 · Jun 16,535 · Jul 16,861 · **Aug 20,716 (peak)** · Sep 19,404 · Oct 17,599 · Nov 17,333 · Dec 14,766 — `Q23`
- Holidays vs the same weekday (baseline 24 Nov 2025 – 11 Jan 2026, holidays excluded): **Dec 24 (Wed) 329 vs 432 = −24%** · Dec 25 (Thu) 388 vs 422 = −8% · Dec 26 (Fri) 489 vs 493 ≈ 0 · Dec 31 (Wed) 528 vs 432 = +22% · **Jan 1 (Thu) 696 vs 422 = +65%** — `Q24`

**Puzzles and brands**
- Puzzles: 42,374 (41,864 approved; 42,368 with an image; 7 currently embargoed). Added per year: 2024 = 9,108 · 2025 = 14,414 · 2026 to 13 Oct = 18,658. 2,259 were added in Sep 2026 alone — `Q05, Q52`
- Long tail: 38,313 puzzles have at least one result. 19,097 (**49.8%**) were solved by exactly one player; 589 by 100+ players — `Q36`
- Brands: 2,104 (2,000 approved). Results: **Ravensburger 332,650 (61%; 5,666 puzzles; 6,634 players)** · Trefl 18,655 · Clementoni 13,325 · Buffalo Games 9,493 · Galison 7,886 · Cobble Hill 7,819 · Schmidt 7,516 · Educa 7,372 · Gibsons 7,236 · Cherry Pazzi 6,135 · **speedpuzzle.eu 6,037 (only 36 puzzles; 766 players)** · Masterpieces 5,964 · Jumbo 5,696 · Ceaco 4,716 · Eurographics 4,457 — `Q28`
- Ravensburger share of results: 63.9% (2024) → 61.4% (2025) → 60.0% (2026) — `Q29`
- Catalogue size: Ravensburger 6,095 · Buffalo Games 1,527 · Trefl 1,487 · Ceaco 1,329 · Clementoni 1,147 · Jumbo 1,075 · Masterpieces 1,062 · Schmidt 800 — `Q30`
- Most solved, all-time (distinct players): **New York Postcard 1,903** (5,728 results) · **London Postcard 1,858 (5,766 results, the most results of any puzzle)** · Air Balloon Valley 1,441 · Postcard from Paris 1,404 · Evening in Pisa 1,257 · Boathouses in Smogen, Sweden 1,231 · Circle of Colors: Ocean 1,173 · Cute Kawaii Chaos 1,128 · Ocean Whimsy 1,117 · Circle of Colors: Animals 1,063. All are Ravensburger 500s — `Q31`
- Most solved 1000s: **Valladolid** (Ravensburger) 315 players · Karen: Colors on Colors 251 · Speed Puzzling 207 · Beautiful Mushrooms 192 · Garden Allotment 186 — `Q31b`
- Most solved in Sep 2026: Glacier National Park 255 players · Yellowstone National Park 200 · Toy Story 5 – Saddle Up! 187 · Camp Sight 183 · London Postcard 179 (all Ravensburger) — `Q32`
- Raw brand medians, solo 500 (brands with ≥ 2,000 results): **speedpuzzle.eu 54.7** · Mudpuppy 58.1 · Jumbo 60.0 · Pieces & Peace 61.1 · Schmidt 63.1 · Ravensburger 63.3 · Nathan 63.6 · Trefl 64.4 · Cherry Pazzi 66.1 · Cobble Hill 67.0 · Gibsons 67.1 · Galison 67.2 · EeBoo 69.7 · Bluebird 70.0 · Boardwalk 72.1 · Clementoni 72.7 · Buffalo Games 73.1 · Castorland 74.2 · **Educa 76.6** — `Q33`
- Skill-adjusted difficulty (500 pc, ≥ 100 solvers; 1.0 = average). **Hardest:** Peacock (Ravensburger) 2.31, solo median 132 min · A Sea of Red (Ravensburger) 2.23, 131 min · World Of Butterflies (Ravensburger) 2.21, 138 min · The Eye of the Glacier (Ravensburger) 1.89 · Splish Splash Octopus (Cherry Pazzi) 1.82 · Hello Kitty and Friends (Ravensburger) 1.80. **Easiest:** Disney & Pixar Color Palette (Ravensburger) 0.69, 40 min, 781 solvers · Spot of Tea (Galison) 0.70 · What a Colorful World (speedpuzzle.eu) 0.71 · Cascade (Cloudberries) 0.71 · Puzzling Emotions – Inside Out 2 (Ravensburger) 0.72, 882 solvers · Mood Board (speedpuzzle.eu) 0.72. Confidence across all puzzles: high 2,093 · medium 1,512 · low 2,881 · insufficient 30,635 — `Q34, Q35`

**Countries**
- Players by country: US 1,447 · DE 881 · CA 519 · GB 416 · AU 399 · FR 301 · SE 245 · CZ 237 · NL 219 · DK 183 · FI 172 · PL 151 · ES 142 · AT 129 · NO 128 — `Q37`
- Median personal best, solo 500 (countries with ≥ 40 such puzzlers): **DK 50.2 · CH 50.8 · FI 50.9** · AT 53.7 · NL 55.0 · PL 55.9 · HU 56.0 · PT 56.4 · SE 57.5 · DE 57.7 · NZ 58.1 · LV 58.1 · ES 58.3 · AU 59.0 · CA 59.6 · CZ 59.6 · NO 59.8 · BE 62.8 · GB 62.9 · FR 62.9 · US 64.0 · IT 67.9 · RO 70.0 — `Q38`
- Pieces per active puzzler, 2026 to 13 Oct (countries with ≥ 30 active): **DK 45,953 (121 active)** · RO 43,223 · ES 42,951 · CH 39,530 · AT 39,308 · FI 38,776 · GB 37,151 · SE 36,174 · NL 35,105 · BE 33,743 … CA 32,358 · DE 30,693 (US below DE, not in the top 15) — `Q39`
- Player locale: en 8,965 (77%) · unset 1,374 · de 726 · fr 248 · es 182 · cs 144 · ja 41 — `Q04`

**Competitions**
- Public (approved, non-draft) events: 144 (17 online; 37 host countries). Per year: 2024 = 15 · 2025 = 37 · **2026 = 64** · 2027 = 2 (17 undated). 21 public series — `Q40`
- Results linked to events: 2024 = 460 · 2025 = 3,710 · **2026 = 15,186** — `Q43`
- Largest participant lists: WJPC 2024 = 1,181 · WJPC 2025 = 1,070 · WJPC 2026 = 837 · European JPC 2025 = 381 · 2026 Wisconsin State Jigsaw Puzzle Championship (23 Oct 2026, upcoming) = 236 · Bucharest JPC 2026 = 74 · Speed Puzzle World Series 2026 = 64 · Dutch Jigsaw Nationals 2026 = 46 — `Q41`
- WJPC per edition (participants / countries / linked to MSP profiles / results linked on MSP): 2024 = 1,181 / 75 / 369 / 205 · 2025 = 1,070 / 61 / 434 / 1,214 · **2026 = 837 / 63 / 134 / 1,010** — `Q42`
- WJPC 2026 format (13 rounds): Individual A–D 90 min, semifinals 75, final 75; Pairs A/B 90, final 120; Teams A/B/final 180 — `local-db:competition_round` (structure; same event)

**Community, gamification, collections, marketplace**
- Badges: 67,518 held by 6,837 players. Most common: speed_500_pieces 16,097 · first_try 6,852 · steady_hands 6,320 · brand_explorer 5,511 · puzzles_solved 5,489 · weekend_puzzler 5,237. **Rarest: marathoner 97** · librarian 168 · supporter 332 · unboxed 528 · zen_puzzler 946 — `Q47`
- XP levels (players with XP, not opted out): 8,132 total. Level 2 is the largest group (2,124). 94 players are at level 40+, and **10 at level 50** — `Q48`
- Stopwatch: 29,645 sessions (27,071 finished, 2,399 paused, 175 running). Finished sessions average **2.28 pauses**; the maximum is 117 — `Q49`
- Collections: 96,610 items across 2,157 collectors (median 7, max 1,742). Most collected: New York Postcard (446), London Postcard (421), Evening in Pisa (338) — `Q00, Q49`
- Wishlists: 9,278 items by 369 players. Most wished: **Disney & Pixar Color Palette (50)** · Time for Tea (32) · Life is a Garden (31) — `Q00, Q49`
- Marketplace: 1,478 open listings (sell-or-swap 807 · sell 552 · swap 95 · free 24). **1,857 completed** hand-overs (sell-or-swap 790 · sell 517 · swap 513 · free 37). 1,164 lent puzzles — `Q00, Q49`
- Public profile extras: 1,027 players have an avatar and 979 list an Instagram handle. 9 private players (0.38% of results). 44 have opted out of rankings — `Q03`

#### SQL used (production, 2026-10-13; every batch started with `SET statement_timeout = '60s';`)
```sql
-- Q00 version, migration head, row counts, date range
SELECT version(), now();
SELECT max(version), count(*) FROM doctrine_migration_versions;
SELECT 'player', count(*) FROM player UNION ALL SELECT 'puzzle', count(*) FROM puzzle UNION ALL SELECT 'manufacturer', count(*) FROM manufacturer
 UNION ALL SELECT 'puzzle_solving_time', count(*) FROM puzzle_solving_time /* … same pattern for every table listed in section 1 … */;
SELECT min(tracked_at)::date, max(tracked_at), min(finished_at)::date, max(finished_at)::date FROM puzzle_solving_time;
-- Q01 types
SELECT puzzling_type, puzzlers_count, count(*) FROM puzzle_solving_time WHERE NOT suspicious GROUP BY 1,2 ORDER BY 2;
-- Q02 flags
SELECT count(*) total, count(*) FILTER (WHERE suspicious) susp,
  count(*) FILTER (WHERE NOT suspicious AND first_attempt) first_att, count(*) FILTER (WHERE NOT suspicious AND unboxed) unboxed,
  count(*) FILTER (WHERE NOT suspicious AND seconds_to_solve IS NULL) no_time, count(*) FILTER (WHERE NOT suspicious AND finished_puzzle_photo IS NOT NULL) photo,
  count(*) FILTER (WHERE NOT suspicious AND (competition_id IS NOT NULL OR competition_round_id IS NOT NULL OR competition_series_id IS NOT NULL)) at_event,
  count(*) FILTER (WHERE NOT suspicious AND comment IS NOT NULL AND comment<>'') commented, count(*) FILTER (WHERE finished_at > now()) future_dated
FROM puzzle_solving_time;
-- Q03 players
SELECT count(*), count(*) FILTER (WHERE user_id IS NOT NULL), count(*) FILTER (WHERE is_private), count(*) FILTER (WHERE ranking_opted_out),
  count(*) FILTER (WHERE country IS NULL OR country=''), count(DISTINCT NULLIF(country,'')), count(*) FILTER (WHERE avatar IS NOT NULL),
  count(*) FILTER (WHERE instagram IS NOT NULL AND instagram<>'') FROM player;
SELECT count(DISTINCT player_id) FROM puzzle_solving_time WHERE NOT suspicious;
SELECT round(100.0*count(*) FILTER (WHERE pl.is_private)/count(*),2) FROM puzzle_solving_time t JOIN player pl ON pl.id=t.player_id WHERE NOT t.suspicious;
-- Q04 locale
SELECT COALESCE(locale,'(none)'), count(*) FROM player GROUP BY 1 ORDER BY 2 DESC;
-- Q05 puzzles / brands / sizes / added per year
SELECT count(*), count(*) FILTER (WHERE approved), count(*) FILTER (WHERE image IS NOT NULL), count(*) FILTER (WHERE hide_until > now() OR hide_image_until > now()) FROM puzzle;
SELECT count(*), count(*) FILTER (WHERE approved) FROM manufacturer;
SELECT pieces_count, count(*) FROM puzzle GROUP BY 1 ORDER BY 2 DESC LIMIT 8;
SELECT extract(year FROM added_at)::int, count(*) FROM puzzle GROUP BY 1 ORDER BY 1;
-- Q06 totals
SELECT sum(p.pieces_count)::bigint, round(sum(t.seconds_to_solve)/3600.0), round(sum(t.seconds_to_solve)/3600.0/24/365,1)
FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id WHERE NOT t.suspicious;
-- Q07 logged per year / Q08 new players per year
SELECT extract(year FROM tracked_at)::int, count(*) FROM puzzle_solving_time WHERE NOT suspicious GROUP BY 1 ORDER BY 1;
SELECT extract(year FROM registered_at)::int, count(*) FROM player GROUP BY 1 ORDER BY 1;
-- Q09 YoY, 1 Jan – 12 Oct
SELECT '2025', count(*), count(DISTINCT player_id) FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at >= '2025-01-01' AND tracked_at < '2025-10-13'
UNION ALL SELECT '2026', count(*), count(DISTINCT player_id) FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at >= '2026-01-01' AND tracked_at < '2026-10-13';
SELECT '2025', count(*) FROM player WHERE registered_at >= '2025-01-01' AND registered_at < '2025-10-13'
UNION ALL SELECT '2026', count(*) FROM player WHERE registered_at >= '2026-01-01' AND registered_at < '2026-10-13';
-- Q10 monthly results / active / pieces ; Q11 monthly new players
SELECT to_char(date_trunc('month',t.tracked_at),'YYYY-MM'), count(*), count(DISTINCT t.player_id), sum(p.pieces_count)
FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id WHERE NOT t.suspicious AND t.tracked_at >= '2025-01-01' GROUP BY 1 ORDER BY 1;
SELECT to_char(date_trunc('month',registered_at),'YYYY-MM'), count(*) FROM player WHERE registered_at >= '2025-01-01' GROUP BY 1 ORDER BY 1;
-- Q12 solo distribution by piece count (minutes)
SELECT p.pieces_count, count(*),
  round((percentile_cont(0.10) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1), round((percentile_cont(0.25) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1),
  round((percentile_cont(0.50) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1), round((percentile_cont(0.75) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1),
  round((percentile_cont(0.90) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1), round((percentile_cont(0.99) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1),
  round(min(t.seconds_to_solve)/60.0,1)
FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
WHERE NOT t.suspicious AND t.puzzling_type='solo' AND t.seconds_to_solve>0 AND p.pieces_count IN (100,200,300,500,1000,1500,2000,3000) GROUP BY 1 ORDER BY 1;
-- Q13 group size, 500/1000
SELECT p.pieces_count, t.puzzlers_count, count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1),
  to_char(make_interval(secs=>min(t.seconds_to_solve)),'HH24:MI:SS')
FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id WHERE NOT t.suspicious AND t.seconds_to_solve>0 AND p.pieces_count IN (500,1000)
GROUP BY 1,2 HAVING count(*)>50 ORDER BY 1,2;
-- Q14 first try vs repeat (Q15 = same with t.unboxed instead of t.first_attempt)
SELECT p.pieces_count, t.first_attempt, count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1)
FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id WHERE NOT t.suspicious AND t.puzzling_type='solo' AND t.seconds_to_solve>0 AND p.pieces_count IN (500,1000)
GROUP BY 1,2 ORDER BY 1,2;
-- Q16 minute histogram, solo 500 (Q16b: pieces_count=1000, minutes 112–128 and 172–188)
SELECT t.seconds_to_solve/60 AS m, count(*) FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve/60 BETWEEN 40 AND 66 GROUP BY 1 ORDER BY 1;
-- Q17 whole-minute share
SELECT round(100.0*count(*) FILTER (WHERE seconds_to_solve%60=0)/count(*),1) FROM puzzle_solving_time WHERE NOT suspicious AND seconds_to_solve>0;
-- Q18 personal-best thresholds, solo 500
WITH best AS (SELECT t.player_id, min(t.seconds_to_solve) b FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
  WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0 GROUP BY 1)
SELECT count(*), count(*) FILTER (WHERE b<1500), count(*) FILTER (WHERE b<1800), count(*) FILTER (WHERE b<2700), count(*) FILTER (WHERE b<3600),
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b))::numeric/60,1) FROM best;
-- Q19 top-10 personal bests, solo 500 (anonymous: only time + first-try flag are selected)
SELECT to_char(make_interval(secs=>b),'MI:SS'), ft FROM (SELECT DISTINCT ON (t.player_id) t.player_id, t.seconds_to_solve b, t.first_attempt ft
  FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0
  ORDER BY t.player_id, t.seconds_to_solve) x ORDER BY b LIMIT 10;
-- Q19b fastest first-try solo 500
SELECT to_char(make_interval(secs=>min(t.seconds_to_solve)),'MI:SS') FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0 AND t.first_attempt;
-- Q20 longest solo
SELECT p.pieces_count, round(max(t.seconds_to_solve)/3600.0,1) FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count IN (500,1000) GROUP BY 1;
-- Q21 weekday ; Q22 logging hour (UTC) ; Q23 months of 2025
SELECT extract(isodow FROM finished_at)::int, count(*) FROM puzzle_solving_time WHERE NOT suspicious AND finished_at IS NOT NULL GROUP BY 1 ORDER BY 1;
SELECT extract(hour FROM tracked_at)::int, count(*) FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at >= '2025-01-01' GROUP BY 1 ORDER BY 1;
SELECT extract(month FROM finished_at)::int, count(*) FROM puzzle_solving_time WHERE NOT suspicious AND finished_at >= '2025-01-01' AND finished_at < '2026-01-01' GROUP BY 1 ORDER BY 1;
-- Q24 holidays + weekday-matched baseline
SELECT finished_at::date, to_char(finished_at,'Dy'), count(*) FROM puzzle_solving_time
WHERE NOT suspicious AND finished_at::date IN ('2025-12-24','2025-12-25','2025-12-26','2025-12-31','2026-01-01') GROUP BY 1,2 ORDER BY 1;
SELECT to_char(d,'Dy'), round(avg(c)) FROM (SELECT finished_at::date d, count(*) c FROM puzzle_solving_time WHERE NOT suspicious
  AND finished_at >= '2025-11-24' AND finished_at < '2026-01-12' AND finished_at::date NOT IN ('2025-12-24','2025-12-25','2025-12-26','2025-12-31','2026-01-01')
  GROUP BY 1) x GROUP BY 1, extract(isodow FROM d) ORDER BY extract(isodow FROM d);
-- Q25 record days (logged; solved = same with finished_at::date)
SELECT tracked_at::date, count(*) FROM puzzle_solving_time WHERE NOT suspicious GROUP BY 1 ORDER BY 2 DESC LIMIT 5;
-- Q26 daily logging around the XP launch, with back-filled share
SELECT tracked_at::date, count(*), count(*) FILTER (WHERE COALESCE(finished_at,tracked_at)::date < tracked_at::date - 7)
FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at >= '2026-09-28' GROUP BY 1 ORDER BY 1;
-- Q27 back-dated (>30 days) share per year
SELECT extract(year FROM tracked_at)::int, round(100.0*count(*) FILTER (WHERE finished_at < tracked_at - interval '30 days')/count(*),1)
FROM puzzle_solving_time WHERE NOT suspicious AND tracked_at>='2024-01-01' GROUP BY 1 ORDER BY 1;
-- Q28 brands
SELECT m.name, count(*), count(DISTINCT t.puzzle_id), count(DISTINCT t.player_id) FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
JOIN manufacturer m ON m.id=p.manufacturer_id WHERE NOT t.suspicious GROUP BY 1 ORDER BY 2 DESC LIMIT 15;
-- Q29 Ravensburger share per year
SELECT extract(year FROM t.tracked_at)::int, round(100.0*count(*) FILTER (WHERE m.name='Ravensburger')/count(*),1) FROM puzzle_solving_time t
JOIN puzzle p ON p.id=t.puzzle_id JOIN manufacturer m ON m.id=p.manufacturer_id WHERE NOT t.suspicious AND t.tracked_at>='2024-01-01' GROUP BY 1 ORDER BY 1;
-- Q30 catalogue per brand
SELECT m.name, count(*) FROM puzzle p JOIN manufacturer m ON m.id=p.manufacturer_id GROUP BY 1 ORDER BY 2 DESC LIMIT 8;
-- Q31 most solved (Q31b: + AND p.pieces_count=1000; Q32: + AND t.tracked_at in Sep 2026)
SELECT p.name, m.name, p.pieces_count, count(*), count(DISTINCT t.player_id) FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
JOIN manufacturer m ON m.id=p.manufacturer_id WHERE NOT t.suspicious GROUP BY 1,2,3 ORDER BY 5 DESC LIMIT 10;
-- Q33 brand medians, solo 500
SELECT m.name, count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.seconds_to_solve))::numeric/60,1) FROM puzzle_solving_time t
JOIN puzzle p ON p.id=t.puzzle_id JOIN manufacturer m ON m.id=p.manufacturer_id
WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0 GROUP BY 1 HAVING count(*)>=2000 ORDER BY 3;
-- Q34 hardest (DESC) / easiest (ASC) 500s ; Q35 confidence
SELECT p.name, m.name, round(d.difficulty_score::numeric,2), d.sample_size, round(s.median_time_solo/60.0,1) FROM puzzle_difficulty d
JOIN puzzle p ON p.id=d.puzzle_id JOIN manufacturer m ON m.id=p.manufacturer_id LEFT JOIN puzzle_statistics s ON s.puzzle_id=p.id
WHERE p.pieces_count=500 AND d.sample_size>=100 ORDER BY d.difficulty_score DESC LIMIT 6;
SELECT confidence, count(*) FROM puzzle_difficulty GROUP BY 1 ORDER BY 2 DESC;
-- Q36 long tail
SELECT count(*) FILTER (WHERE n=1), count(*) FILTER (WHERE n>=100), count(*) FROM (SELECT puzzle_id, count(DISTINCT player_id) n
FROM puzzle_solving_time WHERE NOT suspicious GROUP BY 1) x;
-- Q37 players per country
SELECT country, count(*) FROM player WHERE country IS NOT NULL AND country<>'' GROUP BY 1 ORDER BY 2 DESC LIMIT 15;
-- Q38 median personal best by country
WITH best AS (SELECT t.player_id, min(t.seconds_to_solve) b FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
  WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0 GROUP BY 1)
SELECT pl.country, count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b))::numeric/60,1) FROM best JOIN player pl ON pl.id=best.player_id
WHERE pl.country IS NOT NULL AND pl.country<>'' GROUP BY 1 HAVING count(*)>=40 ORDER BY 3;
-- Q39 pieces per active puzzler by country, 2026
SELECT pl.country, sum(p.pieces_count), count(DISTINCT t.player_id), round(sum(p.pieces_count)::numeric/count(DISTINCT t.player_id))
FROM puzzle_solving_time t JOIN player pl ON pl.id=t.player_id JOIN puzzle p ON p.id=t.puzzle_id
WHERE NOT t.suspicious AND t.tracked_at>='2026-01-01' AND pl.country IS NOT NULL AND pl.country<>'' GROUP BY 1 HAVING count(DISTINCT t.player_id)>=30 ORDER BY 4 DESC LIMIT 15;
-- Q40 public events
SELECT count(*), count(*) FILTER (WHERE is_online), count(DISTINCT location_country_code) FROM competition WHERE approved_at IS NOT NULL AND NOT COALESCE(is_draft,false);
SELECT extract(year FROM date_from)::int, count(*) FROM competition WHERE approved_at IS NOT NULL AND NOT COALESCE(is_draft,false) GROUP BY 1 ORDER BY 1;
SELECT count(*) FROM competition_series WHERE approved_at IS NOT NULL AND NOT COALESCE(is_draft,false);
-- Q41 largest participant lists
SELECT c.name, c.location_country_code, c.date_from::date, count(cp.id) FROM competition c JOIN competition_participant cp ON cp.competition_id=c.id AND cp.deleted_at IS NULL
WHERE c.approved_at IS NOT NULL AND NOT COALESCE(c.is_draft,false) GROUP BY 1,2,3 ORDER BY 4 DESC LIMIT 8;
-- Q42 WJPC editions
SELECT c.name,
  (SELECT count(*) FROM competition_participant cp WHERE cp.competition_id=c.id AND cp.deleted_at IS NULL),
  (SELECT count(DISTINCT cp.country) FROM competition_participant cp WHERE cp.competition_id=c.id AND cp.deleted_at IS NULL),
  (SELECT count(*) FROM competition_participant cp WHERE cp.competition_id=c.id AND cp.deleted_at IS NULL AND cp.player_id IS NOT NULL),
  (SELECT count(*) FROM puzzle_solving_time t WHERE t.competition_id=c.id AND NOT t.suspicious)
FROM competition c WHERE c.name ILIKE 'World Jigsaw Puzzle Championship 20%' ORDER BY 1;
-- Q43 event-linked results per year
SELECT extract(year FROM tracked_at)::int, count(*) FROM puzzle_solving_time WHERE NOT suspicious
AND (competition_id IS NOT NULL OR competition_round_id IS NOT NULL OR competition_series_id IS NOT NULL) GROUP BY 1 ORDER BY 1;
-- Q44 long-run improvement (players with >=20 solo 500)
WITH s AS (SELECT t.player_id, t.seconds_to_solve s, row_number() OVER (PARTITION BY t.player_id ORDER BY COALESCE(t.finished_at,t.tracked_at), t.tracked_at) rn,
  count(*) OVER (PARTITION BY t.player_id) n FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
  WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0),
f AS (SELECT player_id, avg(s) FILTER (WHERE rn<=5) a, avg(s) FILTER (WHERE rn>n-5) b FROM s WHERE n>=20 GROUP BY 1)
SELECT count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY a))::numeric/60,1), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b))::numeric/60,1),
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b/a))::numeric,2) FROM f;
-- Q45 k-th attempt on the same puzzle vs 1st attempt (solo 500)
WITH s AS (SELECT t.player_id, t.puzzle_id, t.seconds_to_solve s, row_number() OVER (PARTITION BY t.player_id, t.puzzle_id
  ORDER BY COALESCE(t.finished_at,t.tracked_at), t.tracked_at) k FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id
  WHERE NOT t.suspicious AND t.puzzling_type='solo' AND p.pieces_count=500 AND t.seconds_to_solve>0),
w AS (SELECT a.k, a.s::numeric / b.s AS r FROM s a JOIN s b ON b.player_id=a.player_id AND b.puzzle_id=a.puzzle_id AND b.k=1 WHERE a.k BETWEEN 2 AND 5)
SELECT k, count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY r))::numeric,2) FROM w GROUP BY 1 ORDER BY 1;
-- Q46 activity per player; repeats of one puzzle
WITH c AS (SELECT player_id, count(*) n FROM puzzle_solving_time WHERE NOT suspicious GROUP BY 1)
SELECT count(*), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY n))::numeric), max(n), count(*) FILTER (WHERE n>=100), count(*) FILTER (WHERE n>=1000) FROM c;
SELECT max(n), count(DISTINCT player_id) FILTER (WHERE n>=10) FROM (SELECT player_id, puzzle_id, count(*) n FROM puzzle_solving_time WHERE NOT suspicious GROUP BY 1,2) x;
-- Q47 badges ; Q48 XP levels
SELECT type, count(*) FROM badge GROUP BY 1 ORDER BY 2 DESC;  SELECT count(DISTINCT player_id) FROM badge;
SELECT level, count(*) FROM player WHERE xp_total > 0 AND NOT experience_system_opted_out GROUP BY 1 ORDER BY 1;
-- Q49 collections, wishlist, marketplace, stopwatch
SELECT count(*), max(n), round((percentile_cont(0.5) WITHIN GROUP (ORDER BY n))::numeric) FROM (SELECT player_id, count(*) n FROM collection_item GROUP BY 1) x;
SELECT p.name, m.name, count(DISTINCT ci.player_id) FROM collection_item ci JOIN puzzle p ON p.id=ci.puzzle_id JOIN manufacturer m ON m.id=p.manufacturer_id GROUP BY 1,2 ORDER BY 3 DESC LIMIT 3;
SELECT p.name, m.name, count(*) FROM wish_list_item w JOIN puzzle p ON p.id=w.puzzle_id JOIN manufacturer m ON m.id=p.manufacturer_id GROUP BY 1,2 ORDER BY 3 DESC LIMIT 3;
SELECT count(DISTINCT player_id) FROM wish_list_item;
SELECT listing_type, count(*) FROM sell_swap_list_item GROUP BY 1 ORDER BY 2 DESC;  SELECT listing_type, count(*) FROM sold_swapped_item GROUP BY 1 ORDER BY 2 DESC;
SELECT status, count(*) FROM stopwatch GROUP BY 1 ORDER BY 2 DESC;
SELECT round(avg(json_array_length(laps))::numeric,2), max(json_array_length(laps)) FROM stopwatch WHERE status='finished';
-- Q50 largest puzzles logged
SELECT p.name, m.name, p.pieces_count, count(*) FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id JOIN manufacturer m ON m.id=p.manufacturer_id
WHERE NOT t.suspicious AND p.pieces_count>=18000 GROUP BY 1,2,3 ORDER BY 3 DESC LIMIT 5;
SELECT count(*) FROM puzzle_solving_time t JOIN puzzle p ON p.id=t.puzzle_id WHERE NOT t.suspicious AND p.pieces_count>=5000;
-- Q51 precomputed community stats
SELECT scope, registered_players, active30d, solves30d, solves_prev30d, active_this_month, pieces_this_month, active_last_month, pieces_last_month,
  round(median_best500_seconds/60.0,1), puzzlers_with500, new_faces14d, computed_at FROM community_scope_stats ORDER BY registered_players DESC LIMIT 4;
-- Q52 puzzles added in Sep 2026
SELECT count(*) FROM puzzle WHERE added_at >= '2026-09-01' AND added_at < '2026-10-01';
-- Q53 role posture (booleans only)
SELECT current_setting('default_transaction_read_only'), current_setting('transaction_read_only'), has_table_privilege('player','INSERT'),
  has_table_privilege('player','UPDATE'), has_table_privilege('player','SELECT'), (SELECT rolsuper FROM pg_roles WHERE rolname=current_user),
  has_table_privilege('user_account','SELECT');
```

### Inferences
- Median 500-piece solo is ~65 min. **1,000 pieces takes 3× as long as 500, not 2×** (196 vs 65 min). 2,000 takes ~10×.
- All ten fastest solo-500 bests were repeat attempts, and attempt 5 on the same puzzle is a median 27% faster than attempt 1. Speed records are largely memory plus practice. "Fastest first-try" (22:30) is a fairer headline record.
- Group results are self-selected (serious competitors form pairs and teams), so "a team of 4 is 2.1× faster than solo" mixes skill and headcount. The same applies to brand medians (who buys which brand). Use `puzzle_difficulty` for difficulty claims.
- The "59-minute wall" is real but modest: a −7.5% step at 60 min, against ±2% neighbouring steps and no step at 45 or 50. It is a credible, shareable behavioural fact.
- The XP launch (12 Oct) produced a back-fill wave: 1,305 old solves logged in one day. That is a content hook ("you dug up your old puzzles!") and a data-quality note: solve-date-based monthly stats for older months will drift upward after the launch.
- Countdown math (from Q06/Q07/Q10): at ~33k results and ~16.5M pieces a month, **300M pieces arrives around late November 2026** and **600k results around early December 2026**. Re-check before announcing.
- Reusable SQL rules are visible in the queries above. They could seed the pipeline's `queries/` folder almost verbatim.

### Gaps
- `community_scope_stats` uses different definitions from `tracked_at`-based monthly counts (e.g. Sep active 2,956 vs 2,687). Which definition the site shows publicly should be decided before posting "monthly active" numbers.
- Solve time-of-day is unavailable (`finished_at` is date-only). Logging hour is UTC and mixes time zones.
- The April 2026 surge (busiest solve dates) is unexplained, as are the September 2026 favourites Glacier/Yellowstone National Park (possibly a campaign or event). Check with the owner.
- No marketplace currency was identified, so prices are not reported.
- Membership and revenue figures exist (`membership`) but were deliberately not reported (business-sensitive, not content).

---

## 4. Existing features and query classes whose SQL can be reused

### Takeaway
MSP already computes most of the aggregates a content pipeline needs: global totals, monthly totals, most-solved puzzles
(all-time and per month), fastest players/pairs/groups, solve-time distributions and percentiles, a Country Cup, community
stats per country, a spotlight and "on a roll" list, difficulty rankings by pieces and brand, the MSP Rating ladder, badge
rarity and an XP leaderboard. They come with privacy filters built in. There is **no yearly "Wrapped"/year-in-review**
feature. Share images exist per result and for XP levels.

### Cited Findings
- `GetStatistics::globally()` / `globallyInMonth()` / `countPlayers()`: SUM(seconds), COUNT(results), SUM(pieces) with `suspicious = false`. Registered = `user_id IS NOT NULL` — [src/Query/GetStatistics.php](speedpuzzling.cz/src/Query/GetStatistics.php); used by [src/Component/GlobalStatistics.php](speedpuzzling.cz/src/Component/GlobalStatistics.php), [src/Services/HomepageStatistics.php](speedpuzzling.cz/src/Services/HomepageStatistics.php)
- `GetMostSolvedPuzzles::top()` / `topInMonth()` — [src/Query/GetMostSolvedPuzzles.php](speedpuzzling.cz/src/Query/GetMostSolvedPuzzles.php)
- `GetMostActivePlayers::mostActiveSoloPlayersInMonth()` (privacy-aware) — [src/Query/GetMostActivePlayers.php](speedpuzzling.cz/src/Query/GetMostActivePlayers.php)
- `GetFastestPlayers::perPiecesCount()` / `window()` (filters private and `ranking_opted_out`), plus [GetFastestPairs](speedpuzzling.cz/src/Query/GetFastestPairs.php) and [GetFastestGroups](speedpuzzling.cz/src/Query/GetFastestGroups.php) — [src/Query/GetFastestPlayers.php](speedpuzzling.cz/src/Query/GetFastestPlayers.php)
- `GetSolveTimeDistribution::byPiecesCounts()` / `byPiecesCountsForGroupSize()`; `GetPuzzleSpeedPercentiles::forPuzzle(s)()` — [src/Query/GetSolveTimeDistribution.php](speedpuzzling.cz/src/Query/GetSolveTimeDistribution.php), [src/Query/GetPuzzleSpeedPercentiles.php](speedpuzzling.cz/src/Query/GetPuzzleSpeedPercentiles.php)
- Country and community: `GetPlayersPerCountry`, the Country Cup ("per active puzzler by default, 10+ active puzzlers"), `CountryRankings`, `GetCommunityScopeStats`, `GetSpotlightPeople`, `GetPlayersOnARoll` — [src/Services/Community/CountryRankings.php](speedpuzzling.cz/src/Services/Community/CountryRankings.php), [src/Component/Players/CountryCup.php](speedpuzzling.cz/src/Component/Players/CountryCup.php), [src/Query/GetCommunityScopeStats.php](speedpuzzling.cz/src/Query/GetCommunityScopeStats.php), [docs/features/players-page/README.md](speedpuzzling.cz/docs/features/players-page/README.md)
- Difficulty and skill: `GetDifficultyRankings::byPieces()` / `byBrand()`; `GetPlayerRatingRanking` (excludes `ranking_opted_out`); `GetPuzzleDifficulty`; `GetPlayerSkill` — [src/Query/GetDifficultyRankings.php](speedpuzzling.cz/src/Query/GetDifficultyRankings.php), [src/Query/GetPlayerRatingRanking.php](speedpuzzling.cz/src/Query/GetPlayerRatingRanking.php), [docs/features/puzzle-intelligence/README.md](speedpuzzling.cz/docs/features/puzzle-intelligence/README.md)
- Gamification: `GetAchievementRarity::counts()`, `GetBadgeCatalog`, `GetAchievementHolders`, `GetXpLeaderboard` — [src/Query/](speedpuzzling.cz/src/Query)
- Hubs and puzzle pages: `GetPiecesHub`, `GetBrandHub`, `GetBrandDirectory`, `GetPuzzleStatistics`, `GetPuzzleOverview`, `GetPuzzleRecord`, `GetFirstTryTimes`, `GetRecentActivity` — [src/Query/](speedpuzzling.cz/src/Query)
- Competitions: `GetCompetitionEvents`, `GetEventOccurrences`, `GetRoundResults`, `GetPublishedRoundResults`, `GetWjpcEvents`, `GetUpcomingEventsCount`; visibility in `IsCompetitionPubliclyVisible::SQL_CONDITION` — [src/Query/](speedpuzzling.cz/src/Query); [CLAUDE.md §Organizations + drafts](speedpuzzling.cz/CLAUDE.md)
- Weekly "Your week" activity digest (from Mon 19 Oct 2026) — [docs/features/content-digest/README.md](speedpuzzling.cz/docs/features/content-digest/README.md)
- Share images (Intervention Image): `GetResultImage::forSolvingTime()` renders a per-result PNG with "Rank X of Y" and a nameless `-hidden` variant for private profiles. `GetXpShareCard::forPlayer()` renders a level card in Rubik, `#2b3445`/`#4e54c8`. `GeneratePuzzleQrCode` draws a branded QR with the logo — [src/Services/GetResultImage.php](speedpuzzling.cz/src/Services/GetResultImage.php), [src/Services/GetXpShareCard.php](speedpuzzling.cz/src/Services/GetXpShareCard.php), [src/Services/GeneratePuzzleQrCode.php](speedpuzzling.cz/src/Services/GeneratePuzzleQrCode.php)
- "Recap" in the code means the post-add recap (`AddedTimeRecapController`, `RecapProgress`, `XpRecapCelebration`). `grep` for "wrapped" / "year in review" finds nothing — [src/Controller/AddedTimeRecapController.php](speedpuzzling.cz/src/Controller/AddedTimeRecapController.php)
- "All insights data is members-only except raw median, MSP Rating ladder, and methodology page" — [CLAUDE.md §Puzzle Insights System](speedpuzzling.cz/CLAUDE.md)

### Inferences
- Port SQL from these classes so Instagram numbers match the site. Lift especially the privacy and suspicious filters ([GetFastestPlayers](speedpuzzling.cz/src/Query/GetFastestPlayers.php), [GetMostActivePlayers](speedpuzzling.cz/src/Query/GetMostActivePlayers.php), [GetPlayerRatingRanking](speedpuzzling.cz/src/Query/GetPlayerRatingRanking.php)).
- A community-level "MSP Wrapped 2026" in December is an open slot. Production data already supports it (Q06–Q11, Q21–Q25, Q28–Q32).
- Publishing skill-adjusted difficulty or skill tiers exposes members-only insight data. That is an owner product decision, possibly framed as a membership teaser.

### Gaps
- I only skimmed each class's SQL (method names, privacy/suspicious references), not every query in full.

---

## 5. Brand assets

### Takeaway
The brand is coral `#fe696a` (marketing/social coral `#EC726F`) with indigo `#4e54c8`, sky blue `#69b3fe` and navy
`#2b3445`, set in **Rubik**. Illustrations follow a documented "semi-flat outlined" style: navy 2 px outlines, pastel
fills, coral on 30–40% of shapes. Logos exist as SVG and PNG. Badges come from an AI-assisted pipeline (ComfyUI FLUX.2
Klein). The site supports 6 languages, but 77% of players use English.

### Cited Findings
- Logos: `public/img/speedpuzzling-logo.svg`, `speedpuzzling-logo.png` (512×453), `speedpuzzling-logo-square.png` (512×512), `speedpuzzling-logo-mini.png` (180×159), `email-logo.png` (96×86). The SVG logo uses navy/indigo/purple/cyan fills (for example `#2C3679`, `#5823B4`, `#8947E6`, `#52C3CD`, `#82BCFF`) — [public/img/](speedpuzzling.cz/public/img)
- SCSS tokens: `$primary #fe696a`, `$accent #4e54c8`, `$info #69b3fe`, `$success #42d697`, `$warning #fea569`, `$danger #f34770`, grays `#f6f9fc` … `#2b3445`, `$font-family-sans-serif: 'Rubik'` — [assets/styles/](speedpuzzling.cz/assets/styles)
- Design-system doc: "The user-facing brand color used in marketing and social is `#EC726F`". Personality "warm and approachable … competitive but friendly community". Rubik 300/400/500/700; headings weight 500 in `#373f50`; cards ~5 px radius, soft shadows; coral table headers and pill badges — [docs/design-system/README.md](speedpuzzling.cz/docs/design-system/README.md)
- Fonts in repo: `assets/fonts/Rubik` (TTF Regular/Bold/ExtraBold, used by share cards), `CourierPrime`, `LazyDog`, and the Cartzilla icon font (Cartzilla/Bootstrap 5 theme) — [assets/fonts/](speedpuzzling.cz/assets/fonts)
- Illustration style, "Semi-flat Outlined": navy `#2b3445` ~2 px outlines with rounded caps; pastel fills with subtle gradients; coral `#EC726F` on 30–40% of shapes; sky blue secondary; `#4e54c8` for depth; teal accents; navy speed-line dashes; white/transparent background; strict jigsaw-piece geometry rules — [docs/design-system/prompts/style-prefix.md](speedpuzzling.cz/docs/design-system/prompts/style-prefix.md); prompt skill [.claude/skills/illustration/SKILL.md](speedpuzzling.cz/.claude/skills/illustration/SKILL.md)
- Badge pipeline (validated 2026-07-17): a deterministic PIL frame renderer, then a FLUX.2 Klein 9B icon, a flood-fill cutout, compositing onto 5 tier frames, and an optional Klein polish pass. Two looks: "pure flat" and "hand-illustrated". Outputs in `public/img/badges/{svg,png,webp,holo}` — [docs/design-system/badge-pipeline/README.md](speedpuzzling.cz/docs/design-system/badge-pipeline/README.md), [docs/design-system/prompts/badges.md](speedpuzzling.cz/docs/design-system/prompts/badges.md)
- Stat icons: Ø = average, Õ = median (24×24, `currentColor`, stroke 1.8) — [docs/design-system/STAT-ICONS-DESIGN-SYSTEM.md](speedpuzzling.cz/docs/design-system/STAT-ICONS-DESIGN-SYSTEM.md)
- Other assets: `public/img/homepage/`, `public/img/xp/`, `puzzlie-1.png`, `stopwatch.png`, `art.png`, `for-organizers-hero.*`, `wjpc.jpg` — [public/img/](speedpuzzling.cz/public/img)
- Languages: en, cs, de, es, fr, ja — [translations/](speedpuzzling.cz/translations). Player locale: en 77%, de 6%, fr 2%, es 2%, cs 1%, ja < 1%, unset 12% — `prod-db 2026-10-13 · Q04`

### Inferences
- Instagram templates: Rubik, coral `#EC726F` hero, navy text, indigo/sky-blue secondary, Ø/Õ glyphs for stats, and badge art for achievement posts. That gives on-brand cards without manufacturer box art.
- Captions should be English-first. German is the clear second audience (DE is #2 by players: 881).

### Gaps
- No Instagram-specific templates or past post archive were found in the repo. The @myspeedpuzzling feed was not examined.
- Where CourierPrime and LazyDog are used, and whether a "unified AI icon set" exists beyond badges, stat icons and `public/img/xp`, was not confirmed.

---

## 6. Images, privacy, copyright and GDPR limits

### Takeaway
Three image classes exist: puzzle box photos uploaded by users (manufacturers' copyrighted artwork), player avatars, and
finished-puzzle photos uploaded by users. Neither the privacy policy nor the Terms of Service grant MSP any licence to
reuse user content on social media. The ToS covers only paid membership. Profiles can be private, and several opt-outs
exist. Naming players or using their photos or avatars on Instagram therefore needs opt-in consent, or at least a
policy update. Aggregate, anonymous statistics are the safe default.

### Cited Findings
- A new puzzle "always comes with a photo of its box" (`AddPuzzle::$puzzlePhoto` is non-nullable) — [CLAUDE.md §Puzzle approvals](speedpuzzling.cz/CLAUDE.md)
- Embargoes: `hide_image_until` protects embargoed images; `hide_until` hides secret competition and Ravensburger Puzzle Month placeholders. 7 puzzles are embargoed in production now — [docs/features/unreleased-puzzle/README.md](speedpuzzling.cz/docs/features/unreleased-puzzle/README.md), [docs/ravensburger-puzzle-month.md](speedpuzzling.cz/docs/ravensburger-puzzle-month.md); `prod-db 2026-10-13 · Q05`
- Existing manufacturer relationship: "Ravensburger prints a MySpeedPuzzling link on the box of every 'Puzzle Month' edition", with a branded QR code — [docs/ravensburger-puzzle-month.md](speedpuzzling.cz/docs/ravensburger-puzzle-month.md)
- No copyright or licence policy for box images or user photos was found in docs, templates or translations — `grep` over [docs/](speedpuzzling.cz/docs), [templates/](speedpuzzling.cz/templates), [translations/messages.en.yml](speedpuzzling.cz/translations/messages.en.yml)
- Privacy policy (updated 30 Sep 2026): the public name "can be a nickname, abbreviation, or initials". Optional public info (city, country, social links, description, avatar) "is visible to all visitors … The same applies to your solving times, collections and other content you publish". A private profile is visible only to "you and the players you choose". It lists processors (Hetzner, Seznam, Stripe, Sentry, Google Analytics, Cloudflare) and says "We do not sell personal data". **It has no clause on using user content or names in MSP's own social media or marketing** — [translations/messages.en.yml → privacy_policy.content §2, §5, §13](speedpuzzling.cz/translations/messages.en.yml)
- Newsletter copy promises "No marketing, no promotions" — [translations/messages.en.yml](speedpuzzling.cz/translations/messages.en.yml)
- Terms of Service (Jan 2025) govern only "the provision of subscription (membership)". There is no user-content licence — [translations/messages.en.yml → terms_of_service.content](speedpuzzling.cz/translations/messages.en.yml)
- `PrivateProfileAccess` "is the only code that may unmask a private player". "Global rankings stay closed to private players for everybody" — [docs/features/private-profile-allow-list.md](speedpuzzling.cz/docs/features/private-profile-allow-list.md)
- Opt-outs: `ranking_opted_out` (query-level exclusion from the MSP Rating ladder), `streak_opted_out` (UI-only), `karma_opted_out`, `experience_system_opted_out`, `time_predictions_opted_out` — [docs/features/opt-out.md](speedpuzzling.cz/docs/features/opt-out.md)
- Production scale: 9 private players (0.38% of results); 44 ranking opt-outs; 1,027 avatars; 979 public Instagram handles; 64,651 results with a finished-puzzle photo — `prod-db 2026-10-13 · Q02, Q03`
- Storage: uploads (box photos, avatars, finished photos, generated share images) sit in an S3-compatible private bucket behind credentialed imgproxy (`UPLOADS_BASE_URL`, `UPLOAD_SPOOL_DIR`) — [config/packages/oneup_flysystem.php](speedpuzzling.cz/config/packages/oneup_flysystem.php), [src/Services/GetResultImage.php](speedpuzzling.cz/src/Services/GetResultImage.php)
- Account deletion removes personal data "immediately"; backups are overwritten within 7 days — [privacy_policy.content §16](speedpuzzling.cz/translations/messages.en.yml)
- The production read-only role can SELECT `user_account` (the table with emails) — `prod-db 2026-10-13 · Q53`

### Inferences
- **Safe by default:** anonymous aggregates (counts, medians, distributions, country and brand aggregates, anonymous record times like "16:30"). Puzzle titles, brand names and public event names are catalogue facts.
- **Needs consent (opt-in):** naming or tagging players, avatars, finished-puzzle photos, "player of the week" and milestone shout-outs. Purpose limitation means data published on a profile is not automatically licensed for a new marketing purpose on Meta's platform. Photos are also the uploader's copyright. Route: an opt-in flag, a privacy-policy section on social media, and per-post confirmation. Always exclude private, ranking-opted-out (for leaderboards) and deleted accounts, re-checked at publish time.
- **Records:** keep record posts anonymous ("someone solved 500 pieces in 16:30") unless the holder agrees. Official competition results are public, but tag only with consent, or link to MSP results pages.
- **Box images:** treat them as manufacturer copyright. Use MSP-style illustrations or text cards. Ask permission for box-art spotlights; Ravensburger is the natural first partner. Never show `hide_*`-embargoed images.
- **De-anonymization:** keep anonymous superlatives coarse ("one puzzler solved the same puzzle 196 times"). Never combine them with country plus puzzle in small populations.
- **Least privilege:** the pipeline role can read `user_account`. Narrowing it to aggregate views (section 2) is a privacy measure, not just hygiene.
- Not legal advice. A short owner or counsel review of the privacy-policy wording before featuring individuals is advisable.

### Gaps
- No manufacturer licence terms were found (the Ravensburger arrangement is operational, its legal terms unknown). No existing consent flag for social features was found.

---

## 7. Concrete, data-grounded Instagram content ideas (46)

### Takeaway
Production data supports 46 specific ideas across 8 pillar groups. Most need only aggregate SQL against the core tables
and carry no privacy risk. Ideas that name people, show photos or expose members-only insights are flagged. Every
number below is **production, queried 2026-10-13** (Q-tags → SQL in section 3). Refresh before posting.

### Cited Findings
- The numbers in the idea tables are the cited production aggregates in section 3 (`prod-db 2026-10-13 · Qnn`) and the query classes in section 4. Privacy constraints are from section 6.

### Inferences
Legend. Feasibility: **H** = direct SQL or an existing query class; **M** = needs caveats or derived logic; **C** = consent- or owner-decision-gated. Format: SI = single image, CA = carousel, RE = reel, ST = story (poll/quiz/slider).

#### Funny facts and "did you know"
| # | Hook | Data (prod 2026-10-13) | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 1 | "Together we've placed 275 million pieces: that's 72 years of non-stop puzzling" | 275.2M pieces, 632k h (Q06; `GetStatistics::globally`) | H | aggregate | SI / RE counter |
| 2 | "The 59-minute wall: you all sprint to beat the hour" | solo-500 per minute: 58 = 7,449 (mode), 59 = 7,383, 60 = 6,832 (−7.5%); no step at 45/50 (Q16) | H | aggregate | CA histogram / RE |
| 3 | "Sunday is puzzle day (and Tuesday is the saddest)" | Sun 104,275 · Sat 101,375 · Tue 65,210; weekend 37.8% (Q21) | H | aggregate | SI bar chart |
| 4 | "Puzzle prime time: 9 pm in Europe, 3 pm on the US East Coast" | logging peak 19:00 UTC (34,854) vs 05:00 (8,980) (Q22). Logging time, not solve time | M | aggregate | ST / SI clock |
| 5 | "Half of all puzzles here have exactly one fan" | 19,097 of 38,313 solved puzzles have 1 solver; 589 have 100+ (Q36) | H | aggregate | SI |
| 6 | "One of you solved the same puzzle 196 times" | max repeats; 466 puzzlers did one puzzle 10+ times (Q46) | H | anonymous, no country/puzzle combo | SI + question sticker |
| 7 | "Average stopwatch session: 2.3 pauses. Record: 117 snack breaks" | `stopwatch.laps` (Q49) | H | aggregate | SI / ST |
| 8 | "42,000 pieces: the biggest puzzles ever logged here" | Educa Around the World 42k (2 results), Ravensburger Memorable Disney Moments 40k (3), Keith Haring 32k; 237 results on 5,000+ pcs (Q50) | H | catalogue; illustrate, no box art | CA |
| 9 | "Launch-day archaeology: on 12 Oct you logged 2,890 results, and 1,305 of them were old solves" | Q25, Q26 (XP launch) | H | aggregate | SI / RE (timely: this week) |

#### Records and milestones
| # | Hook | Data | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 10 | "16:30 for 500 pieces: that's a piece every 2 seconds" | fastest solo-500 personal best 16:30; top 10 = 16:30–19:16; all repeat attempts (Q19) | H | anonymous unless the holder opts in | RE speed visual |
| 11 | "The fairest record: fastest FIRST TRY of a 500 is 22:30" | Q19b | H | anonymous | SI |
| 12 | "Team records: 6:36 for 500 pieces with 4 people; 22:36 for 1,000" | fastest by group size (Q13) | H | anonymous | CA |
| 13 | "Countdown to 300 million pieces (~late Nov) and 600k results (~early Dec)" | 275.2M pieces / 545.5k results at ~16.5M / ~33k per month (Q06, Q10) | H | aggregate | ST countdown → SI celebration |
| 14 | "The sub-hour club: 45% of 500-piece puzzlers have broken 60 minutes" | PBs: 3,058/6,776 < 60; 1,510 < 45; 346 < 30; 64 < 25 (Q18) | H | aggregate | CA ladder |
| 15 | "Rarest achievements: only 97 Marathoners" | marathoner 97 · librarian 168 · unboxed 528 vs speed_500 16,097 (Q47; `GetAchievementRarity`) | H | aggregate | CA with badge art |
| 16 | "Level 50 club: 10 puzzlers maxed out on launch week" | XP levels: 10 at level 50, 94 at 40+, 2,124 at level 2 (Q48) | H | aggregate (no names) | SI (timely: XP launch) |
| 17 | "Hall of fame: the most-solved puzzles on MySpeedPuzzling" | New York Postcard 1,903 puzzlers; London Postcard 1,858 (but most results: 5,766); Air Balloon Valley 1,441 (Q31) | H | box art needs Ravensburger OK | CA top-10 |
| 18 | Milestone shout-outs ("X just logged puzzle #1,000") | `player_moment`; 35 players have 1,000+ results (Q46) | C | opt-in only | SI / ST |

#### Trends and reports
| # | Hook | Data | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 19 | "+77% this year: thank you!" | Jan 1–Oct 12 YoY: 156k → 278k results; active 3,727 → 5,427 (+46%); new players 3,229 → 4,433 (+37%) (Q09) | H | aggregate | CA report |
| 20 | "September 2026: our biggest month ever" | 33,198 results, 2,687 active, 16.8M pieces, 596 new puzzlers, 2,259 new puzzles (Q10, Q11, Q52) | H | aggregate | CA |
| 21 | "What's a good time for a 500-piece puzzle?" | p10 43 · p25 52 · median 65 · p75 83 · p90 106 min (Q12; `GetSolveTimeDistribution`) | H | aggregate | CA (evergreen, save-worthy) |
| 22 | "1,000 pieces ≠ 2× 500. It's 3×" | medians 64.8 / 195.9 / 646 / 1,247 min for 500/1000/2000/3000 (Q12) | H | aggregate | CA myth-buster |
| 23 | "The Ravensburger effect: 6 in 10 logged puzzles" | 61% of results; share 63.9 → 61.4 → 60.0% (Q28, Q29) | H | brand-friendly framing | SI donut |
| 24 | "Brand speed league" | raw solo-500 medians: speedpuzzle.eu 54.7 … Ravensburger 63.3 … Educa 76.6 (Q33). Prefer skill-adjusted `GetDifficultyRankings::byBrand` | M / C | brand-relationship risk | CA |
| 25 | "Country Cup: Denmark puzzles the most per person" | 2026 pieces per active puzzler: DK 45,953 · RO 43,223 · ES 42,951 · CH 39,530 · AT 39,308 (Q39; `CountryRankings`) | H | aggregate (≥ 30 active) | CA map |
| 26 | "The Nordic-Alpine speed belt" | median PB solo 500: DK 50.2 · CH 50.8 · FI 50.9 · AT 53.7 … US 64.0 (Q38) | H | aggregate (≥ 40 puzzlers) | CA map |
| 27 | "You built a 42,000-puzzle database: 18,658 added this year" | Q05 | H | aggregate | SI thank-you |

#### Monthly and seasonal recaps
| # | Hook | Data | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 28 | "<Month> in numbers" (recurring template) | `GetStatistics::globallyInMonth`, `GetMostSolvedPuzzles::topInMonth`; e.g. Sep 2026 top: Glacier National Park (255 puzzlers) (Q10, Q32) | H | aggregate | CA fixed template |
| 29 | "MSP Wrapped 2026" (community year-in-review) | year totals, busiest days, top puzzles, brands and countries, records (Q06–Q11, Q21–Q39). No Wrapped feature exists | H | aggregate | CA + RE (December) |
| 30 | "Christmas Eve is our quietest day; New Year's Day our busiest" | vs the same weekday: Dec 24 −24%, Dec 31 +22%, Jan 1 +65% (Q24) | H | aggregate | SI (late Dec) |
| 31 | "Summer is puzzle season" | 2025: Aug peak 20,716 solves; Jan 14,283 low (Q23), with a growth caveat | M | aggregate | SI |
| 32 | Weekly "on a roll" / "new faces" (156 in the last 14 days) | `GetPlayersOnARoll`, `community_scope_stats.new_faces14d` (Q51) | C | opt-in names only (count is fine) | ST |

#### Puzzle and brand spotlights
| # | Hook | Data | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 33 | "The hardest 500 you can buy (according to 221 solvers)" | Peacock 2.31× (median 132 min) · A Sea of Red 2.23× · World Of Butterflies 2.21× (Q34) | M / C | members-only insights; box-art permission | CA |
| 34 | "…and the friendliest 500s" | Disney & Pixar Color Palette 0.69× (40 min, 781 solvers) · Inside Out 2 0.72× · Spot of Tea 0.70× (Q34) | M / C | same as 33 | CA |
| 35 | "Most wanted = easiest?" | most-wishlisted Disney & Pixar Color Palette (50) is also the easiest 500 (0.69×) (Q49, Q34) | H / C | aggregate; difficulty is members-only | SI |
| 36 | "Puzzle of the week" stat card | `puzzle_statistics` (counts, solo/duo/team medians, fastest, first-try avg), `GetPuzzleSpeedPercentiles` | H / C | illustration or licensed art; respect `hide_*` | SI |
| 37 | "Valladolid: the 1,000-piece puzzle 315 of you solved" | most-solved 1000 (Q31b), tied to WJPC host city | H / C | Ravensburger art permission | SI |
| 38 | "Built for speed: 36 puzzles, 6,037 results" | speedpuzzle.eu: 36 puzzles, 766 puzzlers, fastest raw brand median (Q28, Q33; `GetBrandHub`) | H | aggregate | SI |
| 39 | Ravensburger Puzzle Month edition stats | `RavensburgerPuzzleMonthEditions` + per-puzzle stats | H / C | co-marketing | CA / RE |

#### Quizzes, polls and "you vs the community"
| # | Hook | Data | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 40 | "Guess the median 1,000-piece time" (answer: 3 h 16 min) | 195.9 min (Q12) | H | aggregate | ST quiz → reveal |
| 41 | "Do 4 people solve a 500 four times faster?" (No: 2.1×) | medians 64.8 / 44.6 / 39.0 / 30.6 (Q13), with a self-selection caveat | H | aggregate | RE / ST poll |
| 42 | "The 5th time you solve a puzzle, you're 27% faster" | same-puzzle attempts: 0.89 / 0.82 / 0.77 / 0.73 (Q45); first try vs repeat 70.1 vs 59.3 (Q14) | H | aggregate | CA / ST slider |
| 43 | "Does skipping the box slow you down?" | unboxed 500 62.0 vs 64.8 (not slower); 1000 242 vs 195 (slower) (Q15), with a selection caveat | M | aggregate | CA |
| 44 | "Where do you rank?" + "practice makes you ~20% faster" | p25 52 / median 65 / p75 83 (Q12); 2,584 puzzlers: first-5 average 86.3 → last-5 69.5 min (Q44) | H | aggregate | CA / ST slider |

#### Competition coverage, community and marketplace
| # | Hook | Data | Feas. | Privacy | Format |
|---|---|---|---|---|---|
| 45 | "WJPC 2026 in numbers" | 837 participants · 63 countries · 13 rounds · 1,010 results logged on MSP (Q42) | H | aggregate; podium names only via official results and consent | CA |
| 46 | "Competitions are booming: 15 → 37 → 64 events a year" + "this month's events" | public events per year; 37 host countries; 17 online; event-linked results 460 → 3,710 → 15,186 (Q40, Q43); upcoming: Wisconsin State JPC 23 Oct (236 entrants) (Q41) | H | public events only | SI / CA |
| (bonus) | "1,857 puzzles found a new home" (swap, don't shop) / "New York Postcard is on 446 shelves" | marketplace and collections (Q49) | H | aggregate | SI |

- **Quick wins (H, zero privacy risk, timely):** 9 and 16 (XP launch week), 20 (record September), 1, 2, 3, 13, 14, 19, 21, 22, 25, 26, 40, 41, 42, 44, 45.
- **Owner decisions needed:** members-only difficulty data (24, 33–35); box-art usage (17, 36, 37, 39; Ravensburger first); consent mechanism for people and photos (10/11/12 if named, 18, 32, the photo UGC campaign).
- **Pipeline design hint:** the 53 queries in section 3 collapse into ~10 reusable aggregate views (totals, monthly, distribution by size and group, weekday/hour, brand, country, puzzle top lists, difficulty, competitions, badges/XP). A curated `instagram` schema for the read-only role would serve nearly every idea and remove the role's access to `user_account`.

### Gaps
- Engagement potential per idea is a judgement, not measured. Past @myspeedpuzzling post performance was not available.
- Ideas 4, 24, 31, 41 and 43 need careful caveats (time zones, growth confounding, self-selection). Holiday numbers (30) must be re-run for the 2026 season.
