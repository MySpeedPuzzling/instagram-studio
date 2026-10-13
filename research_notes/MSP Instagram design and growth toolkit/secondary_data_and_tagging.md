# Secondary data sources, observability/analytics access, and safe player tagging for the MSP Instagram pipeline

Scope note: this was a LOCAL investigation of the MySpeedPuzzling (MSP) codebase plus read-only SQL against production. It
does not repeat round 1 (`research_notes/MSP Instagram content pipeline/msp_data_and_content_ideas.md`), which already
covers solve results, puzzles, brands, competitions, badges/XP and the headline counts of collections, wishlists, the
marketplace and the stopwatch.

Source tags:
- File citations are repo-relative paths in the MSP repo, written as `speedpuzzling.cz/...`.
- **`prod-db 2026-10-13 · Qnn`** is a read-only `SELECT` against the production PostgreSQL database on 2026-10-13, run
  through the read-only role over SSH. Each session set `statement_timeout = '60s'`, queries ran one at a time, and
  `EXPLAIN` was run first for the queries that touch `puzzle_solving_time` (Q03, Q04, Q13). The SQL for each `Qnn` is in
  §4, "Query log".
- `context7 · <library>` is official API documentation fetched through Context7 (the original doc URL is given).

All numbers are aggregates. This file contains no player names, handles, IDs, e-mails, hostnames, container or role
names, credentials, or env var values. Brand names, puzzle titles and public event names are public products and events.
Grafana, Loki, Tempo, Prometheus and GA were **not** accessed live. Everything about them comes from code, config and
MSP's own docs.

---

## 1. Puzzle-relevant behavioural data beyond solve results (database and code)

### Takeaway
Beyond results, the database holds several underused behavioural sources. In order of usefulness for posts:
- **Daily presence** (`activity_daily_summary`, `player_activity_day`, since 2026-07-31). Gives DAU/MAU, a weekend
  effect and event spikes.
- **Player moments** (personal bests and milestones).
- **The follow graph** (21k follow edges).
- **Puzzle lending** ("puzzles that travel").
- **Marketplace hand-overs and ratings**.
- **Community catalogue curation** (~3.1k change proposals).
- **Feature requests and votes**.
- **How results are saved** (form vs stopwatch).

Two things the app does **not** store: search terms and barcode scans. There is also no page-view counter. Search and
scan behaviour exists only in request traces and logs (see §2).

### Cited Findings
**What is NOT in the database**
- **No search logging.** There is no search/scan/page-view/click table or column. A `grep` of `src/Entity` and `migrations/`
  for `search_log|view_count|page_view|click_count|affiliate_click|scan_log` finds only `player_modal_impression`, which
  records announcement-modal impressions — [src/Entity/PlayerModalImpression.php](speedpuzzling.cz/src/Entity/PlayerModalImpression.php); [migrations/Version20260920233340.php](speedpuzzling.cz/migrations/Version20260920233340.php)
- **Search terms never reach URL logs from the header search box.** The global search is a Live Component (`#[AsLiveComponent]`
  with the default `method = 'post'`), so the typed term travels in the request body
  ([src/Component/GlobalSearch.php](speedpuzzling.cz/src/Component/GlobalSearch.php); [vendor/symfony/ux-live-component/src/Attribute/AsLiveComponent.php](speedpuzzling.cz/vendor/symfony/ux-live-component/src/Attribute/AsLiveComponent.php)).
  The puzzle-list search is different: `GET /en/puzzle-search-items` builds its criteria from the request, so its terms
  appear in request URLs — [src/Controller/PuzzleSearchItemsController.php](speedpuzzling.cz/src/Controller/PuzzleSearchItemsController.php)
- **Barcode lookups are not stored, but the EAN is in the URL** (`/{_locale}/puzzle-by-ean-search/{ean}`). A code that is
  not in the catalogue still returns 200, with `puzzles: []` and brand guesses from the EAN prefix —
  [src/Controller/SearchPuzzleByEanController.php](speedpuzzling.cz/src/Controller/SearchPuzzleByEanController.php).
  MSP's own scan statistics come from traces (§2), not from the DB. The doc says so directly: "a scan that fails leaves
  no trace on the server" — [docs/features/barcode-scanner/README.md](speedpuzzling.cz/docs/features/barcode-scanner/README.md)
- **Activity analytics are deliberately coarse.** The design is "presence per UTC day, no IP, no user agent, no page
  paths — the detail level was a conscious privacy decision". Event-level product analytics (funnels, campaign
  attribution per click) are "consciously out of scope" — [docs/features/activity-analytics.md](speedpuzzling.cz/docs/features/activity-analytics.md)

**Daily presence**
- `player_activity_day` has one row per signed-in player per UTC day and is pruned after 24 months.
  `activity_daily_summary` has one row per day × locale (`active_players`, `active_members`, `new_registrations`,
  `active_trials`), is kept forever and holds no personal data. Both are filled by a `kernel.terminate` subscriber plus a
  daily cron — [docs/features/activity-analytics.md](speedpuzzling.cz/docs/features/activity-analytics.md); [src/Entity/ActivityDailySummary.php](speedpuzzling.cz/src/Entity/ActivityDailySummary.php)
- Coverage: summary days run 2026-07-31 → 2026-10-12 (74 days, 7 locale values) — `prod-db 2026-10-13 · Q10`
- Daily actives (signed-in players, summed over locales):
  - average over the last 30 days: **1,081**;
  - average 1–14 Sep 2026: **982**;
  - average during WJPC 2026 (16–20 Sep): **1,136** (+16 %);
  - all-time peak: **1,548 on Mon 2026-10-12**.
  — `prod-db 2026-10-13 · Q10`
- The 12 Oct peak coincides with the XP/levels/achievements launch announced in the ~11–12 Oct newsletter — [docs/features/xp-levels/launch-2026-10.md](speedpuzzling.cz/docs/features/xp-levels/launch-2026-10.md)
- New registrations average **21.7 a day** (last 30 days). The peak is **43 on 2026-09-20**, the last day of WJPC 2026
  (the event runs 2026-09-16 → 2026-09-20) — `prod-db 2026-10-13 · Q10, Q14`
- Weekday averages of daily actives (all summary days except the launch day): Mon 970 · Tue 940 · Wed 932 · Thu 943 ·
  Fri 939 · **Sat 1,046 · Sun 1,090** — `prod-db 2026-10-13 · Q11`
- **3,747** distinct signed-in players in the last 30 days. **4,671** since tracking began on 2026-07-31 — `prod-db 2026-10-13 · Q11`
- Locale share of active players, last 30 days: en 86.2 % · de 8.9 % · fr 1.9 % · cs 1.6 % · es 1.0 % · ja 0.4 % — `prod-db 2026-10-13 · Q10`

**Player moments**
- `player_moment` types are `personal_best`, `puzzles_milestone`, `pieces_milestone` and `first_result` — [src/Value/PlayerMomentType.php](speedpuzzling.cz/src/Value/PlayerMomentType.php)
- The earliest `occurred_at` is 2026-09-20 and the earliest `detected_at` is 2026-10-03, so roughly the last 3–4 weeks are
  available — `prod-db 2026-10-13 · Q13`
- Last 30 days: **1,774 personal bests from 935 players** · 258 first results · 202 puzzle-count milestones · 68
  piece-count milestones — `prod-db 2026-10-13 · Q13, Q16`

**Follow graph** (`player.favorite_players` JSON; each follow drives a notification)
- **21,418 follow edges**: 3,228 players follow someone, and 3,562 players are followed. The most-followed public player
  has **711** followers — `prod-db 2026-10-13 · Q15`. The query shape comes from [src/Query/GetFavoritePlayers.php](speedpuzzling.cz/src/Query/GetFavoritePlayers.php)
- `notification` has ~4.32 M rows. About **99.8 %** are `SubscribedPlayerAddedTime` ("someone you follow added a
  time"). Both figures are planner statistics, not exact counts — `prod-db 2026-10-13 · Q08, Q14`

**Lending**
- `lent_puzzle_transfer` holds **5,950 transfers** (2025-12-05 → 2026-10-13): 3,320 initial lends · 2,156 returns · 474
  passes to a third player — `prod-db 2026-10-13 · Q12`
- Per physical copy, the maximum is 5 transfers and the average 1.1 — `prod-db 2026-10-13 · Q12`
- Most-travelled titles, all copies combined:
  - **Bottled Biomes** (speedpuzzle.eu): 33 transfers, 30 different holders;
  - **London Postcard** (Ravensburger): 32 transfers, 24 holders;
  - **Camp Sight** (Ravensburger): 31 transfers, 27 holders.
  — `prod-db 2026-10-13 · Q12`

**Marketplace**
- `sold_swapped_item` runs from 2025-12-05. Hand-overs per month in 2026:
  - Jan 175 · Feb 123 · Mar 237 · Apr 136 · May 182;
  - Jun 222 · Jul 233 · Aug 172 · Sep 197;
  - Oct 1–12: 154.
  — `prod-db 2026-10-13 · Q12`
- Most handed-over brands: Ravensburger 763 (41 % of all 1,857) · Trefl 64 · Buffalo Games 62 · Masterpieces 57 · Galison 51 — `prod-db 2026-10-13 · Q12`
- Transaction ratings: **267, all 5 stars** (average 5.00), since 2026-02-20 — `prod-db 2026-10-13 · Q12`
- "Marketplace at events": 187 listings brought to 4 events since 2026-10-06 — `prod-db 2026-10-13 · Q14`

**Community curation**
- `puzzle_change_request` (catalogue corrections proposed by players): **2,941 approved** (since 2026-01-04) · 157 pending
  · 59 rejected, from **392 distinct reporters** — `prod-db 2026-10-13 · Q13`
- Feature requests: 111 open (556 votes) and 31 completed (612 votes). `feature_request_vote` ≈ 1,262 rows and only ~6
  comments — `prod-db 2026-10-13 · Q08, Q13`

**How results are saved** (`puzzle_solving_time.created_via`)
- The column was added on 2026-10-01 ([migrations/Version20261001235050.php](speedpuzzling.cz/migrations/Version20261001235050.php)).
  Its values are `form`, `stopwatch` and `api` — [src/Value/SolvingTimeSource.php](speedpuzzling.cz/src/Value/SolvingTimeSource.php)
- Since 2026-10-02: form 14,411 (92.9 %) · stopwatch 835 (5.4 %) · not set 272 (1.8 %) · API 0 — `prod-db 2026-10-13 · Q13`
- Stopwatch: 28,010 sessions linked to a puzzle, from 1,844 distinct players — `prod-db 2026-10-13 · Q13`

**Barcode scanning** (from traces, as documented by MSP)
- The add-time form scanner is open to every signed-in player. It sees "about 290 successful scans a day from about 750
  players a week". By platform: 53 % Android (47 % Chrome, 6 % Samsung Internet), 44 % iOS (38 % Safari, 7 % Chrome) and
  2 % desktop. Multiscan, which is members only, sees ~115 scans a day from 41 players a week — [docs/features/barcode-scanner/README.md](speedpuzzling.cz/docs/features/barcode-scanner/README.md) §1

**XP, comments, other tables**
- `xp_entry` has ~1.04 M rows with 4 reasons. The three most common: solve_base 58.8 % · solve_difficulty_bonus 40.5 % ·
  solve_unboxed_bonus 0.7 % (planner statistics) — `prod-db 2026-10-13 · Q08, Q14`
- Result comments: ~2.1 % of results carry a free-text comment (`comment` null fraction 0.979, sampled). The most common
  comments are "2x" and "4x", i.e. repeat solves — `prod-db 2026-10-13 · Q14`
- Custom collections: ~32 % public, ~68 % private (sampled) — `prod-db 2026-10-13 · Q14`
- Small or unrelated tables:
  - **events and tags:** `followed_competition` 40 rows (since 2026-10-08, the new events-page favourites) · `tag` 2 ·
    `tag_puzzle` 80;
  - **monetisation:** `referral` 8 · `voucher_claim` 3;
  - **API:** `api_usage_day` 47 rows. The API itself saw 25–446 `/api/v1` requests a day (measured 2026-10-06);
  - **private, never usable:** `conversation` 641 · `chat_message` 4,200.
  — `prod-db 2026-10-13 · Q08`; [docs/features/api/usage-statistics.md](speedpuzzling.cz/docs/features/api/usage-statistics.md)
- **There are no puzzle reviews or puzzle ratings.** The only star ratings are marketplace transaction ratings
  (`TransactionRating`: stars, review text, reviewer role) — [src/Entity/TransactionRating.php](speedpuzzling.cz/src/Entity/TransactionRating.php)
- **Affiliate clicks are not tracked.** The referral program stores only attributed `Referral` rows (`?ref=` link →
  30-day cookie → attribution at checkout) — [docs/features/referral-program.md](speedpuzzling.cz/docs/features/referral-program.md)

### Inferences
- **Ready-made post hooks from these sources:**
  - "Puzzlers are weekend people: +16 % more of you log in on Sundays than on Wednesdays" (Q11).
  - "WJPC week lifted daily puzzlers 16 %, and sign-ups peaked on finals day" (Q10).
  - "1,774 personal bests in 30 days" (Q13).
  - "Bottled Biomes has been passed between 30 puzzlers" (Q12).
  - "267 swaps rated, every single one 5 stars" (Q12). This is a strong trust and community message for the marketplace.
  - "392 of you fixed 2,941 catalogue entries this year" (Q13), for a community-thanks post.
  - "Ravensburger is 41 % of all second-hand hand-overs" (Q12).
- **`player_moment` is the natural feed for weekly shout-outs** (PBs, milestones). It is already de-duplicated and
  typed, so the pipeline only needs to add the visibility filter from §3.
- **The follow graph supports "most-followed puzzlers" or "community hubs" posts**, but only as aggregates or
  safe-filtered lists. The app keeps the "players who follow you" list private to the followed player
  ([src/Query/GetFavoritePlayers.php](speedpuzzling.cz/src/Query/GetFavoritePlayers.php)). A follower ranking is closer
  to the app's public "most-favourited board", which already leaves private players out
  ([docs/features/private-profile-allow-list.md](speedpuzzling.cz/docs/features/private-profile-allow-list.md)).
- **The wishlist→solved conversion is not a usable "wishes come true" metric.** Only 256 of 9,279 wishlist items (2.8 %)
  were later solved by the same player (Q11). Wishlist items can be removed automatically when the puzzle enters the
  collection (`WishListItem::$removeOnCollectionAdd`), so fulfilled wishes vanish from the table.
- **Many feature tables start on 2025-12-05.** Wishlist, lending and marketplace timestamps all begin that day, which
  suggests a launch or backfill date, not organic first use. Year-over-year comparisons for these are not possible yet.

### Gaps
- No source in the DB can say which puzzles or brands people search for or look at. Only traces/logs (§2) or Google
  Search Console can.
- I did not compute per-brand or per-puzzle lending/marketplace time series, or a follow-graph centrality beyond the
  maximum.
- `notification`, `xp_entry` and comment shares are planner-statistics estimates (`pg_stats`), not exact counts, to
  avoid scanning large tables.

---

## 2. What the observability and analytics stack could add, and how to query it

### Takeaway
**GA4 is live** (gtag.js, loaded only after a real user interaction, with bot filtering). It has a handful of custom
events on the events page. It is the right tool to measure Instagram's impact through UTM-tagged links, queried with the
GA4 Data API `runReport`.

On the server side, the valuable source is **Tempo, which holds 100 % of Traefik spans** (path, platform/browser,
country). MSP itself already uses it for page-view baselines, per-platform barcode lookups and the live-feed analysis.
That makes "most-viewed puzzles/brands/events", "most-scanned boxes", "app vs web" and Instagram in-app-browser traffic
all derivable. But retention is short: **Tempo 14 days, Loki and Prometheus 30 days**. The pipeline must snapshot
aggregates on a schedule.

The application logs in Loki carry almost nothing puzzle-related. Prometheus gives only coarse traffic rates. None of
the Grafana/Loki/Tempo/Prometheus configuration lives in the MSP repo.

### Cited Findings
**Google Analytics**
- `GA_TRACKING` becomes the Twig global `ga_tracking` ([config/packages/twig.php](speedpuzzling.cz/config/packages/twig.php)).
  `base.html.twig` attaches the `analytics` Stimulus controller with the ID only when `ga_tracking` is not empty — [templates/base.html.twig](speedpuzzling.cz/templates/base.html.twig) L481–482
- The committed `.env` leaves `GA_TRACKING` empty, so the production value is supplied outside the repo — [.env](speedpuzzling.cz/.env) (name only)
- `analytics_controller.js` behaviour:
  - It injects `https://www.googletagmanager.com/gtag/js?id=…` and calls `gtag('config', id)`.
  - It loads **only after real user interaction** (scroll, mousemove, touchstart, keydown, click).
  - It **skips likely bots**: `navigator.webdriver`, bot/crawler user agents, no cookies, no localStorage.
  - It deliberately has no idle fallback. The 2026-07/08 bot wave made "thousands of proxy-bot page loads a day" count as
    GA "active users", and losing zero-interaction bounces was accepted in exchange.
  — [assets/controllers/analytics_controller.js](speedpuzzling.cz/assets/controllers/analytics_controller.js)
- Conflict: [docs/performance-optimizations.md](speedpuzzling.cz/docs/performance-optimizations.md) still describes a
  `requestIdleCallback` / 5 s fallback. The controller's own comment says that fallback was removed. The code is the
  current truth.
- Custom GA events exist only on the events page:
  - `events_scope`, `events_view`, `events_search` — [assets/controllers/events_page_controller.js](speedpuzzling.cz/assets/controllers/events_page_controller.js);
  - `events_calendar_day`, `events_calendar_month` — [assets/controllers/events_calendar_controller.js](speedpuzzling.cz/assets/controllers/events_calendar_controller.js).
  - The plan is to measure them against a pre-launch baseline around 2026-11-05 — [docs/TODO.md](speedpuzzling.cz/docs/TODO.md); [docs/features/events-page/implementation-plan.md](speedpuzzling.cz/docs/features/events-page/implementation-plan.md)
- A `grep` for consent-management code (`cookieconsent|cookie_consent`) in templates, assets, src and config finds nothing — repo `grep`, 2026-10-13
- There are no server-side GA events (no Measurement Protocol). `grep` for gtag/analytics in `src/` finds only the
  presence-analytics classes from §1.

**UTM conventions already in use**
- `/p/{puzzleId}`, the box/QR short link, redirects to the puzzle detail with `utm_source=qr_code` — [src/Controller/PuzzleQrRedirectController.php](speedpuzzling.cz/src/Controller/PuzzleQrRedirectController.php)
- `/ravensburger-puzzle-month/{edition}` adds `utm_source=puzzle_box` and `utm_campaign=ravensburger-puzzle-month-{n}`
  ("tagged for analytics"). It is a temporary redirect on purpose — [src/Controller/RavensburgerPuzzleMonthRedirectController.php](speedpuzzling.cz/src/Controller/RavensburgerPuzzleMonthRedirectController.php)
- Outbound event links carry `utm_source=myspeedpuzzling` — [src/Results/CompetitionEvent.php](speedpuzzling.cz/src/Results/CompetitionEvent.php); [src/Query/GetEventOccurrences.php](speedpuzzling.cz/src/Query/GetEventOccurrences.php)
- No acquisition source or UTM is stored with registrations. A `grep` for `registration_source|signup_source|acquisition|first_touch` in entities and migrations finds nothing.

**Identifying traffic sources server-side**
- MSP recognises Instagram's (and Facebook, Messenger, Threads, TikTok, LINE) **in-app browser by User-Agent** — [src/Value/InAppBrowser.php](speedpuzzling.cz/src/Value/InAppBrowser.php)
- The native apps (Hotwire Native web views) send distinct User-Agents:
  - iOS: `MySpeedPuzzling iOS/1.0` — [ios/MySpeedPuzzling/App/MySpeedPuzzlingApp.swift](speedpuzzling.cz/ios/MySpeedPuzzling/App/MySpeedPuzzlingApp.swift);
  - Android: prefix `MySpeedPuzzling Android/1.0;` — [android/app/src/main/java/com/myspeedpuzzling/app/MySpeedPuzzlingApplication.kt](speedpuzzling.cz/android/app/src/main/java/com/myspeedpuzzling/app/MySpeedPuzzlingApplication.kt).
  - The server tells them apart with `PlatformDetector` — [src/Services/PlatformDetector.php](speedpuzzling.cz/src/Services/PlatformDetector.php)

**Tempo (Traefik spans)**
- Tempo holds "**100 % of Traefik spans**" — [docs/features/live-activity-feed.md](speedpuzzling.cz/docs/features/live-activity-feed.md) §1.2
- Retention is **14 days**, with "no PHP spans, no identity" — [docs/features/api/usage-statistics.md](speedpuzzling.cz/docs/features/api/usage-statistics.md)
- Analyses MSP has already run on it:
  - **Events page, 7 days to 2026-10-08, bots excluded by UA:** 1,004 page views from 404 IPs. By locale: en 692, de 234,
    cs 38, fr 22, ja 10, es 8 — [docs/features/events-page/README.md](speedpuzzling.cz/docs/features/events-page/README.md)
  - **Barcode lookups per platform per day:** Android 169 → 92 after a scanner change; iOS 128 → 140 — [docs/features/barcode-scanner/README.md](speedpuzzling.cz/docs/features/barcode-scanner/README.md) §1
  - **Live-feed polls:** 7,281 polls from 289 clients in 12 h; 5.6 % from phones; client geography and browser visible
    ("Windows Chrome in Australia"). A feed poll is 2–4.5 % of all MSP requests, i.e. ~2.0k–3.9k requests per 10 minutes
    — [docs/features/live-activity-feed.md](speedpuzzling.cz/docs/features/live-activity-feed.md) §1.2
  - **Players page:** a "53 visitors per day" baseline — [docs/TODO.md](speedpuzzling.cz/docs/TODO.md)

**Loki**
- The app logs JSON to stderr, which goes to Loki — [docs/features/internal-api.md](speedpuzzling.cz/docs/features/internal-api.md)
- Retention is **30 days** — [docs/features/account-deletion.md](speedpuzzling.cz/docs/features/account-deletion.md); [docs/features/api/usage-statistics.md](speedpuzzling.cz/docs/features/api/usage-statistics.md)
- The production Monolog `main` handler is `fingers_crossed` at `warning`, so a normal request leaves no app log line.
  Info records are streamed only for the `internal_api_audit` and `service_worker` channels — [config/packages/prod/monolog.php](speedpuzzling.cz/config/packages/prod/monolog.php)
- Loki "stays the place for request *forensics* – see the request-logging proposal". That proposal is not in the repo — [docs/features/api/usage-statistics.md](speedpuzzling.cz/docs/features/api/usage-statistics.md)
- Traefik access logs exist: Googlebot sitemap fetches were checked in them — [docs/features/seo/TODO.md](speedpuzzling.cz/docs/features/seo/TODO.md); [docs/features/auth-hardening/setup-apple.md](speedpuzzling.cz/docs/features/auth-hardening/setup-apple.md)
- Traefik runs with CrowdSec plus a bot-blocker in front of the pages — [docs/features/auth-hardening/setup-apple.md](speedpuzzling.cz/docs/features/auth-hardening/setup-apple.md)

**Prometheus**
- Traefik and Prometheus count the unauthenticated requests, mostly scanners — [docs/features/api/usage-statistics.md](speedpuzzling.cz/docs/features/api/usage-statistics.md)
- Prometheus was rejected for per-token API stats because of "unbounded label cardinality, 30-day retention" — same doc
- Scrape targets are discovered from container labels (`metrics.scrape` labels on a `monitoring` network) — [docs/features/online-competitions/implementation-plan.md](speedpuzzling.cz/docs/features/online-competitions/implementation-plan.md)

**Grafana**
- The MSP repo has no Grafana, Loki, Tempo or Prometheus config or dashboards. `grep` hits are only docs and the Monolog
  comments above — repo `grep`, 2026-10-13

**Google Search Console** (not on the owner's list, but already used)
- In the 3 months to 2026-07: 14.5k clicks / 101k impressions; 67 % of clicks are brand queries.
- Event pages earn 69.8k impressions, more than all 811 puzzle-detail rows (64.6k).
- The WJPC 2025 event page alone: 26.5k impressions.
- Puzzle-name long-tail queries rank at positions 4–9.
— [docs/features/seo/README.md](speedpuzzling.cz/docs/features/seo/README.md)

**Programmatic access** (from official docs)
- **GA4 Data API:** `POST https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY_ID}:runReport` with
  `dateRanges`, `dimensions` and `metrics`. It authenticates as a user or a service account. Client libraries exist,
  e.g. Python `BetaAnalyticsDataClient` — `context7 · Google Analytics Data API` ([basics](https://developers.google.com/analytics/devguides/reporting/data/v1/basics), [quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart))
- **Grafana HTTP API:** two ways in.
  - `POST /api/ds/query` with `from`, `to` and `queries[]`, each naming a `datasource.uid`. It requires the data-source
    query permission.
  - `GET /api/datasources/proxy/uid/:uid/*`, which proxies the native API of Loki, Tempo or Prometheus.
  — `context7 · grafana/grafana` ([data source API](https://github.com/grafana/grafana/blob/main/docs/sources/developer-resources/api-reference/http-api/api-legacy/data_source.md))
- **Loki:** `GET /loki/api/v1/query_range` with `query` (LogQL), `start`, `end`, `step` and `limit`. Metric queries
  such as `sum(rate(...)) by (...)` or `count_over_time` return a matrix — `context7 · grafana/loki` ([HTTP API](https://github.com/grafana/loki/blob/main/docs/sources/reference/loki-http-api.md))
- **Tempo:**
  - `GET /api/search?q=<TraceQL>&start=&end=&limit=` finds traces.
  - `GET /api/metrics/query_range` and `/api/metrics/query` run TraceQL metrics such as
    `{ span:name = "GET /:endpoint" } | count_over_time() by (span.http.status_code)`.
  — `context7 · grafana/tempo` ([API docs](https://github.com/grafana/tempo/blob/main/docs/sources/tempo/api_docs/_index.md))
- **Prometheus:** `GET|POST /api/v1/query_range` with `query` (PromQL), `start`, `end` and `step` — `context7 · prometheus.io` ([querying API](https://prometheus.io/docs/prometheus/latest/querying/api))
- **Env var names that exist today:**
  - MSP app: `GA_TRACKING` (the measurement ID).
  - Pipeline repo: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, `DATABASE_URL_TUNNEL`,
    `IG_ACCESS_TOKEN`, `IG_APP_ID`, `IG_APP_SECRET`.
  — [.env](speedpuzzling.cz/.env); `msp-instagram/.env.example` (names only)

**Puzzle-relevant URL patterns to aggregate in traces/logs**
- `/{locale}/puzzle/{puzzleId}` (puzzle detail) and `/en/puzzle/brand/{slug}` (brand page) — [src/Controller/PuzzleDetailController.php](speedpuzzling.cz/src/Controller/PuzzleDetailController.php); [src/Controller/BrandPuzzlesController.php](speedpuzzling.cz/src/Controller/BrandPuzzlesController.php)
- `/en/puzzle/{pieces}-pieces` — [src/Controller/PiecesPuzzlesController.php](speedpuzzling.cz/src/Controller/PiecesPuzzlesController.php)
- `/en/events/{slug}` and `/en/events/{slug}/results/{roundSlug}`
- `/{locale}/puzzle-by-ean-search/{ean}` (barcode lookups)
- `/p/{puzzleId}` (box QR codes)
- `/{locale}/puzzle-search-items?…` (list search terms)

### Inferences
- **GA4 is the measurement backbone for Instagram.** Two assumptions here:
  - The `gtag('config', id)` pattern plus GA "active users" wording implies a GA4 measurement ID. UA properties stopped
    processing in 2023.
  - Instagram feed captions have no clickable links, so traffic arrives through the bio link and Story link stickers.
- **Tag every link with a fixed convention**, e.g. `utm_source=instagram&utm_medium=social&utm_campaign=<post-slug>`,
  then report sessions by `sessionSource / sessionMedium / sessionCampaignName` and landing page with `runReport`. A
  short redirect route like the existing `/p/{puzzleId}` could add the UTMs server-side. That is an app change, so it is
  the owner's call.
- **GA will undercount Instagram traffic.** It loads only after an interaction, ad blockers apply, and sessions in
  Instagram's in-app browser may not interact. A server-side cross-check is to count Tempo spans whose User-Agent
  matches the patterns in `InAppBrowser` (Instagram) or whose URL carries `utm_source=instagram`. Neither needs consent
  or any app change.
- **Tempo can produce the "what puzzles people look at" content the DB cannot:**
  - most-viewed puzzle pages and brands per week (join the puzzle UUID in the path back to the DB for names);
  - **most-scanned boxes** (EANs in lookup paths);
  - "**wanted but missing**" puzzles: EANs scanned but not in the catalogue, found by joining the EANs offline against
    `puzzle.ean`;
  - QR box scans (`/p/` paths);
  - app vs web share (User-Agent);
  - country and device mix.
- **WJPC traffic peaks are probably already gone from Tempo** (14-day window; WJPC 2026 ran 16–20 Sep). They may still
  sit in Prometheus or Loki, if Traefik access logs are shipped there, but only until roughly 2026-10-16 → 10-20, when
  the event passes 30 days. If a "WJPC traffic peak" post is wanted, those numbers have to be pulled this week.
- **Prometheus is coarse.** Traefik metrics are normally labelled by router/service/method/code, not by path (general
  Traefik knowledge, not verified against this setup). That is fine for "traffic ×N on finals day", but not for
  per-puzzle content.
- **Loki is low-value for content** unless Traefik access logs are shipped there. Application logs are mostly warnings
  and audit lines.
- **One Grafana service-account token** (read/query permission on the Tempo, Loki and Prometheus data sources) would
  give the pipeline all three through `/api/ds/query` or the proxy. That is simpler than exposing each backend.
  Proposed env var names, none of which exist yet: `GRAFANA_URL`, `GRAFANA_SA_TOKEN`, `GRAFANA_TEMPO_UID`,
  `GRAFANA_LOKI_UID`, `GRAFANA_PROM_UID`. For GA: `GA4_PROPERTY_ID` plus a service-account key file pointed to by
  `GOOGLE_APPLICATION_CREDENTIALS`, the standard Google client-library variable.
- **Google Search Console** shows what people search for on Google: puzzle-name and event-name demand. It complements
  the missing on-site search log.

### Gaps
- The production GA property type, ID, data retention, key events and custom-dimension registrations were not
  inspected. No access was granted, and no values were to be printed. To report the event-page custom parameters through
  the Data API, they would need to be registered as custom dimensions. Whether they are is unknown.
- The Grafana, Tempo, Loki and Prometheus setup (hostnames, data-source UIDs, auth, exact span attributes and labels,
  whether Traefik access logs reach Loki) lives on the server outside the repo. The referenced "request-logging
  proposal" was not found.
- Whether GA loads inside the native apps' web views was not tested. The base template has no `is_native_app` guard on
  the analytics controller, so it probably does.
- Exact retention settings were taken from MSP docs (Tempo 14 d, Loki/Prometheus 30 d), not from the server config.

---

## 3. How to tag and feature players safely according to the app's own visibility rules

### Takeaway
`player.instagram` is a **free-text field with no validation**. It is normalised only at display time and shown publicly
on public profiles. The Players directory even has a public **"On Instagram" filter**, so the app already surfaces who
is on Instagram.

The app's visibility model has three parts:
- **`is_private`** is the hard rule. A private player is masked or left out everywhere, social links included, and
  "every mistake must fail towards hiding".
- **Per-feature opt-outs** (ranking, XP, achievements, karma, streak, predictions) filter specific boards.
- **Public-event visibility** governs competitions.

Counts: of 977 public players with a handle, 974 also haven't opted out of rankings, and **943 have a well-formed
handle**. Taggable segments:
- **676** players active in 2026;
- **53** of the top-100 solo-500 personal bests;
- **66** of 837 WJPC 2026 participants (only 134 participants are linked to an MSP profile);
- **58–60** of the 94 players at level ≥ 40;
- **150** of 935 players who set a PB in the last 30 days.

### Cited Findings
**The field and how it is shown**
- `player.instagram` is a nullable string. The edit-profile form adds it as a plain `TextType`, `required => false`, with
  no constraints — [src/Entity/Player.php](speedpuzzling.cz/src/Entity/Player.php); [src/FormType/EditProfileFormType.php](speedpuzzling.cz/src/FormType/EditProfileFormType.php)
- Display normalisation happens only in `GenerateInstagramLink::fromUserInput()` (Twig filter `instagram`):
  - trim `@` and whitespace;
  - if the input starts with `http`, use it as the link;
  - otherwise build `https://www.instagram.com/{input}/`;
  - the label is `@` + the path without domain, query or slashes.
  — [src/Services/GenerateInstagramLink.php](speedpuzzling.cz/src/Services/GenerateInstagramLink.php); [src/Twig/LinksTwigExtension.php](speedpuzzling.cz/src/Twig/LinksTwigExtension.php)
- The public profile prints "Instagram: @…" in the details block, which renders for public profiles (and the owner or
  allowed friends). For anyone else, a private profile renders the "Secret puzzler" notice instead (`is_masked_profile`
  branch) — [templates/player_profile.html.twig](speedpuzzling.cz/templates/player_profile.html.twig) L4, L64–77, L235–241
- The API's public profile endpoint nulls `name, avatar, country, city, bio, facebook and instagram` for a private
  profile — [src/Api/V1/PlayerProfileResponse.php](speedpuzzling.cz/src/Api/V1/PlayerProfileResponse.php)
- The Players directory's "On Instagram" filter (`?instagram=1`, defined as `COALESCE(TRIM(p.instagram), '') <> ''`) and
  an Instagram chip on cards appear on a public-profiles-only directory. The player card uses the same definition —
  [src/Value/PlayersDirectoryCriteria.php](speedpuzzling.cz/src/Value/PlayersDirectoryCriteria.php); [src/Query/GetPlayersDirectory.php](speedpuzzling.cz/src/Query/GetPlayersDirectory.php); [src/Query/GetPlayerCard.php](speedpuzzling.cz/src/Query/GetPlayerCard.php); [templates/components/Players/Directory.html.twig](speedpuzzling.cz/templates/components/Players/Directory.html.twig)
- Format quality of the 977 public handles:
  - 334 start with `@`, 160 are URLs, 167 contain `instagram.com` (1 URL points elsewhere), 62 carry a `?query`;
  - after display-style normalisation, **943 match a valid handle shape** (`^[A-Za-z0-9._]{1,30}$`) and 34 do not
    (17 contain spaces, 7 are longer than 30 characters);
  - 968 distinct handles, so a few players share one.
  — `prod-db 2026-10-13 · Q02`

**Visibility rules and where they live**
- **Private profile (`is_private`):**
  - `PrivateProfileAccess` "is the only code that can unmask anybody". Queries use `sqlIsPrivate()` / `sqlIsPublic()`.
  - Guests, cron and `client_credentials` tokens are "nobody revealed".
  - Rankings that leave private players out (solo ladders, MSP rating, fastest players, most-favourited, per-country,
    sitemap) leave them out for everybody. Pair/group boards and most-active show them as "Hidden Puzzler".
  - The share image follows the player's own setting.
  — [docs/features/private-profile-allow-list.md](speedpuzzling.cz/docs/features/private-profile-allow-list.md)
- **Ranking opt-out (`ranking_opted_out`):**
  - It removes the player from the **MSP Rating ladder** (`GetPlayerRatingRanking`) and hides skill tier and rank
    everywhere.
  - Fastest-players, pairs, groups, puzzle-solvers and recent-activity queries only "carry the flag for template display".
  — [docs/features/opt-out.md](speedpuzzling.cz/docs/features/opt-out.md)
  - Confirmed in code: `GetFastestPlayers::window()` filters `pl.is_private = false`, viewer blocks, `suspicious = false`,
    solo, `seconds_to_solve > 0`, but not `ranking_opted_out` — [src/Query/GetFastestPlayers.php](speedpuzzling.cz/src/Query/GetFastestPlayers.php)
- **XP opt-out:** public XP boards require `p.is_private = false AND p.experience_system_opted_out = false` — [src/Query/GetXpLeaderboard.php](speedpuzzling.cz/src/Query/GetXpLeaderboard.php)
- **Karma opt-out:** the karma board adds `karma_opted_out = false` — same file
- **Achievements opt-out:** the Achievement Points board adds `achievements_opted_out = false`. `GetAchievementHolders`
  excludes private, XP and achievements opt-outs — [src/Query/GetXpLeaderboard.php](speedpuzzling.cz/src/Query/GetXpLeaderboard.php); [src/Query/GetAchievementHolders.php](speedpuzzling.cz/src/Query/GetAchievementHolders.php); [docs/features/opt-out.md](speedpuzzling.cz/docs/features/opt-out.md)
- **Streak opt-out:** UI-only; the card is hidden for everyone — [docs/features/opt-out.md](speedpuzzling.cz/docs/features/opt-out.md)
- **Time-predictions opt-out:** controller-level gating — [docs/features/opt-out.md](speedpuzzling.cz/docs/features/opt-out.md)
- **Competition results:**
  - A linked private player "stays the organiser's name only": no profile link, no avatar.
  - Group members are masked the same way.
  — [src/Query/GetPublishedRoundResults.php](speedpuzzling.cz/src/Query/GetPublishedRoundResults.php) (`entrant()`)
  - An event is public only if it is not rejected and not a draft, and either a standalone event is approved or the
    parent series of an edition is approved — [src/Query/IsCompetitionPubliclyVisible.php](speedpuzzling.cz/src/Query/IsCompetitionPubliclyVisible.php) (`SQL_CONDITION`)
  - Participant rows carry `deleted_at` — [src/Query/GetCompetitionParticipants.php](speedpuzzling.cz/src/Query/GetCompetitionParticipants.php)
- **Viewer-specific blocks (`HiddenPlayers::sqlExclude`):** these apply per signed-in viewer, so they do not apply to a
  broadcast post.
- **Moderation flags on `player`:** `marketplace_banned` and `messaging_muted` / `messaging_muted_until` — [src/Entity/Player.php](speedpuzzling.cz/src/Entity/Player.php)
- **Query classes that define "publicly visible" lists** (from a `grep` of visibility fragments in `src/Query`):
  - `GetFastestPlayers`, `GetFastestPairs`, `GetFastestGroups`, `GetPuzzleSolvers` (puzzle leaderboard);
  - `GetRecentActivity`, `GetMostActivePlayers`, `GetPlayerRatingRanking`, `GetXpLeaderboard`, `GetAchievementHolders`;
  - `GetPlayersDirectory`, `GetPlayersPerCountry`, `GetPlayersOnARoll`, `GetSpotlightPeople`;
  - `GetPublishedRoundResults`, `GetRoundResults`, `GetCompetitionParticipants`;
  - `GetStopwatchMilestones`, `GetPlayerIdsForSitemap`, `SearchPlayers`.
  — [src/Query/](speedpuzzling.cz/src/Query)

**Aggregate counts**
- Players and flags:
  - **all players:** 11,680, of which 9 private;
  - **opt-outs:** ranking 44 · XP 6 · achievements 4 · karma 6 · streak 56;
  - **moderation:** 0 marketplace-banned · 0 messaging-muted.
  — `prod-db 2026-10-13 · Q01`
- Handles:
  - **979** players have one; 977 of them public (2 private).
  - **974** are public and not ranking-opted-out.
  — `prod-db 2026-10-13 · Q01`
- Handles among active players:
  - **with results ever:** 7,839 players, 881 of them with a handle (matches the owner's figure);
  - **active in 2026** (own non-suspicious result dated 2026): 5,421 players (5,412 public); **679** public with a
    handle, **676** also not ranking-opted-out;
  - **last 90 days:** 3,746 public active players, **553** taggable.
  — `prod-db 2026-10-13 · Q03`
- **Top-100 solo-500 personal bests**, using the app's `GetFastestPlayers` rules (6,767 public ranked players; ties give
  102 rows):
  - **53 have a handle**;
  - 0 of the top 100 are ranking-opted-out, so the strict filter also gives **53**;
  - top 10: **7**; top 1,000: **324**.
  — `prod-db 2026-10-13 · Q04`
- **WJPC 2026** (16–20 Sep 2026, 837 non-deleted participants from 63 countries):
  - **134** are linked to an MSP profile, 133 of them public;
  - **67** public with a handle, **66** also not ranking-opted-out.
  — `prod-db 2026-10-13 · Q05, Q06`
- **XP level ≥ 40** (the current maximum level is 50):
  - **94** players, all eligible (public, XP not opted out);
  - **60** have a handle, **58** also not ranking-opted-out;
  - level 50 with a handle: 7.
  — `prod-db 2026-10-13 · Q07`
- **Badges and achievements:** 6,837 badge holders. **860** are eligible under the achievements-board rules (public,
  XP and achievements not opted out) and have a handle — `prod-db 2026-10-13 · Q07`
- **Moments, last 30 days** (taggable = public, not ranking-opted-out, has a handle):
  - personal bests: 935 players, **150** taggable;
  - puzzle milestones: 202, **42** taggable;
  - piece milestones: 68, **22** taggable;
  - first results: 258, **9** taggable.
  — `prod-db 2026-10-13 · Q16`
- **Follow graph:** 132 public players with a handle have at least 20 followers — `prod-db 2026-10-13 · Q15`

### Inferences
- **Normalise handles in the pipeline, never trust the raw field.** Apply the display normalisation, also strip a
  scheme-less `instagram.com/` prefix, and tag only if the result matches `^[A-Za-z0-9._]{1,30}$`. Otherwise feature
  the player by MSP name without a tag, or skip.
  - Q02 shows 167 values containing `instagram.com` but only 160 starting with `http`. So about 7 values are scheme-less
    domains, which `GenerateInstagramLink` turns into a broken `instagram.com/instagram.com/...` link on the site. This
    is a small app bug worth reporting.
  - Handle existence on Instagram is not checked anywhere. Tagging a non-existent or renamed account fails silently or,
    worse, tags a stranger. A pre-publish check (e.g. a Business Discovery lookup with the existing IG token) would
    catch that. Whether that API fits this account type was not verified.
- **Be stricter than the app on ranking opt-outs.** The app still lists ranking-opted-out players on time boards, but the
  owner's rule is "respect ranking opt-outs". Treat `ranking_opted_out = true` as "never feature in any ranked or
  comparative post". In today's data this changes almost nothing (3 handles overall, 0 in the top 100), so the cost is
  negligible.
- **Groups:** a pair/team result may be featured only if every linked member passes the filter. Unlinked or private
  members appear as the organiser's name or not at all, and are never tagged.
- **Competition posts:** at WJPC-scale events most participants have no MSP profile, so tagging covers about 8 % of the
  field (66 of 837). The participant names on official result pages are the organiser's data, so tags should come only
  from linked, safe MSP profiles.
- **The do-not-feature list holds player IDs, which are personal data**, so it must live in a gitignored local file or a
  local DB table, never in the public repo. A committed file can only hold a pointer to it.

### Gaps
- "Active" counts only results a player tracked themselves (`player_id`). Group results where a player appears only in
  the team JSON are not counted, so active-player numbers are slight undercounts.
- I did not check which of the 977 handles still exist on Instagram, or whether handle owners match the MSP player.
- Whether results awaiting verification (as opposed to `suspicious`) should be excluded was not examined in depth. The
  public boards examined filter only `suspicious = false`.

---

## 4. Recommendations: what to integrate first, and the reusable "safe to feature" filter

### Takeaway
Integrate in this order:
1. **The DB secondary tables already readable today**: presence summary, player moments, follow graph, lending,
   marketplace, curation, feature requests. They need zero new access and give most of the new puzzle-community content.
2. **GA4 Data API plus a strict UTM convention**, to measure Instagram's impact.
3. **Tempo through a Grafana service-account token**, for "what people view and scan" content, with weekly aggregate
   snapshots because of the 14-day retention.
4. **Prometheus** only for one-off event traffic peaks, and urgently if a WJPC 2026 traffic post is wanted.
5. **Loki last.**

Use one `safe_player` filter everywhere (below), extended per post type.

### Cited Findings
- Sources by access already available:
  - **DB:** queryable now with the read-only role — owner decisions in `msp-instagram/docs/decisions.md`.
  - **Grafana, Loki, Prometheus, Traefik logs, GA:** "available if useful; the community mostly cares about puzzle
    data" — same file.
- Retention: Tempo 14 days, Loki and Prometheus 30 days — [docs/features/api/usage-statistics.md](speedpuzzling.cz/docs/features/api/usage-statistics.md); [docs/features/account-deletion.md](speedpuzzling.cz/docs/features/account-deletion.md)
- Existing UTM conventions (`qr_code`, `puzzle_box` + campaign) and the GA loading rules — §2 citations
- Visibility rules and counts — §3 citations

#### Query log (SQL used, 2026-10-13)
```sql
-- Q01 player visibility flags + handle coverage
SELECT count(*), count(*) FILTER (WHERE is_private), count(*) FILTER (WHERE ranking_opted_out),
 count(*) FILTER (WHERE experience_system_opted_out), count(*) FILTER (WHERE achievements_opted_out),
 count(*) FILTER (WHERE karma_opted_out), count(*) FILTER (WHERE streak_opted_out), count(*) FILTER (WHERE marketplace_banned),
 count(*) FILTER (WHERE messaging_muted), count(*) FILTER (WHERE COALESCE(TRIM(instagram),'')<>''),
 count(*) FILTER (WHERE COALESCE(TRIM(instagram),'')<>'' AND NOT is_private),
 count(*) FILTER (WHERE COALESCE(TRIM(instagram),'')<>'' AND is_private),
 count(*) FILTER (WHERE COALESCE(TRIM(instagram),'')<>'' AND NOT is_private AND NOT ranking_opted_out),
 count(*) FILTER (WHERE user_id IS NULL) FROM player;
-- Q02 handle format quality (public handles): normalise like GenerateInstagramLink, then test ^[A-Za-z0-9._]{1,30}$
WITH ig AS (SELECT TRIM(instagram) raw, regexp_replace(regexp_replace(regexp_replace(TRIM(BOTH '@ ' FROM TRIM(instagram)),
  '^https?://(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') handle
  FROM player WHERE COALESCE(TRIM(instagram),'')<>'' AND NOT is_private)
SELECT count(*), count(*) FILTER (WHERE raw LIKE '@%'), count(*) FILTER (WHERE raw ~* '^https?://'),
 count(*) FILTER (WHERE raw ~* 'instagram\.com'), count(*) FILTER (WHERE raw ~* '^https?://' AND raw !~* 'instagram\.com'),
 count(*) FILTER (WHERE raw ~ '\?'), count(*) FILTER (WHERE handle ~ '^[A-Za-z0-9._]{1,30}$'),
 count(*) FILTER (WHERE handle !~ '^[A-Za-z0-9._]{1,30}$'), count(*) FILTER (WHERE handle ~ '\s'),
 count(*) FILTER (WHERE length(handle) > 30), count(DISTINCT lower(handle)) FROM ig;
-- Q03 (EXPLAIN first: nested-loop semi join on the player_id index) results ever / in 2026 / last 90 days x flags
WITH f AS (SELECT p.id, p.is_private, p.ranking_opted_out, (COALESCE(TRIM(p.instagram),'')<>'') ig,
  EXISTS (SELECT 1 FROM puzzle_solving_time t WHERE t.player_id=p.id AND NOT t.suspicious) any_res,
  EXISTS (SELECT 1 FROM puzzle_solving_time t WHERE t.player_id=p.id AND NOT t.suspicious
          AND COALESCE(t.finished_at,t.tracked_at) >= '2026-01-01') res_2026,
  EXISTS (SELECT 1 FROM puzzle_solving_time t WHERE t.player_id=p.id AND NOT t.suspicious
          AND t.tracked_at >= now() - interval '90 days') res_90d FROM player p)
SELECT count(*) FILTER (WHERE any_res), count(*) FILTER (WHERE any_res AND ig), count(*) FILTER (WHERE res_2026),
 count(*) FILTER (WHERE res_2026 AND NOT is_private), count(*) FILTER (WHERE res_2026 AND ig),
 count(*) FILTER (WHERE res_2026 AND ig AND NOT is_private),
 count(*) FILTER (WHERE res_2026 AND ig AND NOT is_private AND NOT ranking_opted_out),
 count(*) FILTER (WHERE res_90d AND NOT is_private),
 count(*) FILTER (WHERE res_90d AND ig AND NOT is_private AND NOT ranking_opted_out) FROM f;
-- Q04 (EXPLAIN first: index-only scan custom_pst_solo_board + hash aggregate) top-100 solo-500 PBs, GetFastestPlayers rules
WITH best AS (SELECT pst.player_id, MIN(pst.seconds_to_solve) best FROM puzzle_solving_time pst JOIN puzzle p ON p.id=pst.puzzle_id
  WHERE pst.puzzling_type='solo' AND p.pieces_count=500 AND pst.seconds_to_solve>0 AND pst.suspicious=false GROUP BY 1),
board AS (SELECT b.player_id, b.best, pl.ranking_opted_out, (COALESCE(TRIM(pl.instagram),'')<>'') ig,
  RANK() OVER (ORDER BY b.best) rnk FROM best b JOIN player pl ON pl.id=b.player_id WHERE pl.is_private=false),
board_strict AS (SELECT player_id, ig, RANK() OVER (ORDER BY best) rnk FROM board WHERE NOT ranking_opted_out)
SELECT (SELECT count(*) FROM board), (SELECT count(*) FROM board WHERE rnk<=100),
 (SELECT count(*) FROM board WHERE rnk<=100 AND ig), (SELECT count(*) FROM board WHERE rnk<=100 AND ranking_opted_out),
 (SELECT count(*) FROM board_strict WHERE rnk<=100 AND ig), (SELECT count(*) FROM board WHERE rnk<=10 AND ig),
 (SELECT count(*) FROM board WHERE rnk<=1000 AND ig);
-- Q05 locate the event: competition WHERE name ILIKE '%world jigsaw%' OR shortcut ILIKE 'WJPC%', date_from >= 2026-01-01
--     (+ non-deleted participant count); information_schema columns of wjpc_participant
-- Q06 WJPC 2026 participants linked / public / with handle
SELECT count(*), count(DISTINCT cp.player_id), count(DISTINCT cp.player_id) FILTER (WHERE NOT pl.is_private),
 count(DISTINCT cp.player_id) FILTER (WHERE NOT pl.is_private AND COALESCE(TRIM(pl.instagram),'')<>''),
 count(DISTINCT cp.player_id) FILTER (WHERE NOT pl.is_private AND NOT pl.ranking_opted_out AND COALESCE(TRIM(pl.instagram),'')<>''),
 count(DISTINCT cp.country)
FROM competition_participant cp JOIN competition c ON c.id=cp.competition_id AND c.shortcut='WJPC 2026'
LEFT JOIN player pl ON pl.id=cp.player_id WHERE cp.deleted_at IS NULL;
-- Q07 level >= 40 / achievements with GetXpLeaderboard eligibility; badge holders
SELECT max(level), count(*) FILTER (WHERE level>=40),
 count(*) FILTER (WHERE level>=40 AND NOT is_private AND NOT experience_system_opted_out), ... /* + handle, + ranking, level>=50 */,
 count(*) FILTER (WHERE achievement_points>0 AND NOT is_private AND NOT achievements_opted_out AND NOT experience_system_opted_out
                   AND COALESCE(TRIM(instagram),'')<>'') FROM player;
SELECT count(DISTINCT b.player_id), count(DISTINCT b.player_id) FILTER (WHERE NOT pl.is_private AND NOT pl.achievements_opted_out
  AND NOT pl.experience_system_opted_out AND COALESCE(TRIM(pl.instagram),'')<>'') FROM badge b JOIN player pl ON pl.id=b.player_id;
-- Q08 approximate row counts: SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE relname IN (...behavioural tables...)
-- Q10 activity_daily_summary: min/max day; daily sums -> avg last 30 d, avg 2026-09-16..20, avg 2026-09-01..14, peak;
--     registrations avg/peak; locale share last 30 d
-- Q11 weekday avg of daily sums (excluding 2026-10-12, extract(isodow)); player_activity_day range + distinct players
--     last 30 d; wish_list_item range + items with a same-player non-suspicious result (EXISTS on player_id, puzzle_id)
-- Q12 lent_puzzle_transfer range, by transfer_type, transfers per copy, top titles by transfers/holders;
--     sold_swapped_item range, per month 2026, top brands; transaction_rating count/avg/5-star share
-- Q13 (EXPLAIN first: parallel seq scan, ~0.1 s) created_via since 2026-10-02; stopwatch with puzzle / distinct players;
--     puzzle_change_request by status + distinct reporters; player_moment last 30 d by type + min dates; feature_request by status
-- Q14 pg_stats (sampled) for notification.type, xp_entry.reason, puzzle_solving_time.comment, collection.visibility;
--     WJPC 2026 dates; followed_competition; sell_swap_list_item_event
-- Q15 follow graph from json_array_elements_text(player.favorite_players): edges, followers, followed,
--     max followers of a public player, public players with a handle and >= 20 followers
-- Q16 player_moment last 30 d by type: distinct players, and those public + not ranking-opted-out + with a handle
```
(Q09 was a schema lookup in `information_schema.columns`. A first weekday query, Q10c, used a wrong date format and its
output was discarded. Q11 replaces it.)

### Inferences
**Integration priority**

1. **DB secondary tables: now, no new access.**
   - Add aggregate views or queries for `activity_daily_summary`, `player_moment`, follow-graph aggregates,
     `lent_puzzle_transfer`, `sold_swapped_item` + `transaction_rating`, `puzzle_change_request`, `feature_request` and
     `created_via`.
   - They give recurring formats: "This week on MSP" (PBs, milestones, new faces), "Puzzles that travel", "Swap
     stories", "Community heroes" (curation and feature votes, as aggregates), and "Weekend puzzlers" or event-spike
     posts.
2. **GA4 Data API: next, for measuring Instagram.** Needs:
   - a service account with Viewer on the GA4 property;
   - `GA4_PROPERTY_ID` and `GOOGLE_APPLICATION_CREDENTIALS` in the gitignored `.env`;
   - a fixed UTM scheme on every bio, Story or link-sticker URL: `utm_source=instagram`, `utm_medium=social` (bio link:
     `utm_medium=bio`), `utm_campaign=<yyyy-mm-dd>-<post-slug>`;
   - a weekly `runReport`: sessions, engagedSessions, newUsers and key events by `sessionCampaignName` and landing page.
   - Join this with Instagram Insights per post to learn which formats drive site visits. To link Instagram to
     *registrations*, MSP would need to store first-touch UTMs at sign-up (it doesn't today; that is an app change and
     the owner's decision). Until then, `activity_daily_summary.new_registrations` on post days is a rough proxy.
3. **Tempo through Grafana: when "trending" content is wanted.**
   - Needs one read-only Grafana service-account token.
   - A weekly job stores only aggregates locally (gitignored): views per puzzle UUID, brand slug and event slug; EAN
     lookups per EAN; `/p/` QR scans per puzzle; Instagram in-app-browser visits; app vs web share; country mix.
   - Raw spans contain IPs and user agents and stay on the server.
   - Content unlocked: "Most-viewed puzzles this week", "Most-scanned boxes", "Wanted: puzzles you scanned that we don't
     have yet", "Which countries puzzle at 3 am".
4. **Prometheus: one-off.** Use it only for event traffic peaks. If a WJPC 2026 traffic post is wanted, pull it
   **before ~2026-10-16** (30-day retention).
5. **Loki: skip** unless Traefik access logs turn out to be shipped there. App logs are warning and audit lines only.
6. **Optional: Search Console** (Search Analytics export or API) for "what puzzles and events people google". It is
   already used for SEO baselines.

**Reusable "safe to feature" filter** (port into a view or CTE; extend per post type)

```sql
-- safe_player: may be named and tagged in a broadcast post
SELECT p.id, p.name, p.country,
  CASE WHEN norm.handle ~ '^[A-Za-z0-9._]{1,30}$' THEN norm.handle END AS ig_handle   -- NULL => name only, no tag
FROM player p
CROSS JOIN LATERAL (SELECT regexp_replace(regexp_replace(regexp_replace(
    TRIM(BOTH '@ ' FROM TRIM(COALESCE(p.instagram,''))),
    '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '\?.*$', ''), '/+$', '') AS handle) norm
WHERE p.is_private = false                 -- app rule: hidden everywhere, fail towards hiding
  AND p.ranking_opted_out = false          -- owner rule (stricter than the app's time boards)
  AND p.id NOT IN (SELECT player_id FROM local_do_not_feature)   -- gitignored local list
-- per post type, add:
--   XP / level posts:         AND p.experience_system_opted_out = false
--   achievement / badge:      AND p.experience_system_opted_out = false AND p.achievements_opted_out = false
--   karma:                    AND p.karma_opted_out = false
--   streaks:                  AND p.streak_opted_out = false
--   predictions:              AND p.time_predictions_opted_out = false
--   marketplace content:      AND p.marketplace_banned = false
```

**Result-level and event-level conditions to combine with `safe_player`**
- **Results:**
  - `pst.suspicious = false AND pst.seconds_to_solve > 0`.
  - The puzzle is not embargoed: `(pz.hide_until IS NULL OR pz.hide_until <= now())`. No box image while
    `pz.hide_image_until > now()`.
- **Groups:** every linked member of a pair or team must be in `safe_player`.
- **Events:** `IsCompetitionPubliclyVisible::SQL_CONDITION` on `competition c LEFT JOIN competition_series cs`.
  Participants need `cp.deleted_at IS NULL`. Only rounds whose results are published may be used. Tag only participants
  linked to a `safe_player`.
- **Never** use conversations, chat messages, private collections or individual notification rows in content.

### Gaps
- GA4 access (property, service account), Grafana access (URL, token, data-source UIDs) and the exact span attributes in
  Tempo are prerequisites the owner has to provide. Their availability and shape are unverified.
- I did not verify whether Instagram's API lets the pipeline confirm that a handle exists before tagging.
- Whether to also exclude players with `messaging_muted = true` or unverified results is a policy choice. Today both
  counts are 0 or negligible.
