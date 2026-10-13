# Current @myspeedpuzzling Instagram account audit (baseline as of 2026-10-13)

Method note: this is a local, read-only audit run on 2026-10-13 against the Instagram API with Instagram Login (host `https://graph.instagram.com/v25.0`) with the existing long-lived token from the ig-giveaway prototype. Only GET requests were made, and the token was never printed or stored. "Sources" below are API endpoints (links point to the endpoint without any token) or Meta's official docs. Raw JSON dumps live in the gitignored folder `var/ig-audit/` (`account.json`, `media.json`, `media_insights.json`, `media_analysis_rows.json`, `probe_media_metrics.json`, `content_publishing_limit.json`, `account_insights_probe.json`, `account_insights_90d.json`, `account_insights_12m_before.json`, `account_insights_by_product_type_15m.json`). Everything here is account-level aggregates or anonymized post descriptions. It contains no follower or commenter usernames, IDs or tokens. Engagement rate (ER) in these notes = `total_interactions / reach` per post. Theme labels were assigned manually after reading every caption.

## Account size and profile

### Takeaway
@myspeedpuzzling is a small BUSINESS account with 2,405 followers, 340 following and 90 media (87 retrievable). Its follower base has grown by roughly 680 net in the last ~13 months, and 179 of those came in the last 30 days (WJPC 2026 + giveaway).

### Cited Findings
- `account_type` = BUSINESS, `followers_count` = 2,405, `follows_count` = 340, `media_count` = 90; name "MySpeedPuzzling", website https://myspeedpuzzling.com. Bio: "Every solve counts 🧩 Your pieceful corner for tracking times, sharing progress & loving the puzzle. MySpeedPuzzling.com ⏱️" — [API: GET me?fields=user_id,username,account_type,followers_count,follows_count,media_count,name,biography,website](https://graph.instagram.com/v25.0/me)
- Paging through `me/media` (limit=50, cursor pagination until no `next`) returned only 87 items although `media_count` says 90 — [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- Oldest retrievable post: 2023-11-25. Newest: 2026-09-17 — [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- No story was active at audit time (`me/stories` returned 0 items) — [API: GET me/stories](https://graph.instagram.com/v25.0/me/stories)
- Follows / unfollows per 30-day window (`follows_and_unfollows`, breakdown `follow_type`; FOLLOWER bucket read as follows, NON_FOLLOWER as unfollows):
  - 2025-09-18→10-18: 17 / 7
  - 10-18→11-17: 40 / 10
  - 11-17→12-17: 92 / 11
  - 12-17→2026-01-16: 51 / 2
  - 01-16→02-15: 39 / 5
  - 02-15→03-17: 47 / 7
  - 03-17→04-16: 101 / 11
  - 04-16→05-16: 77 / 9
  - 05-16→06-15: 50 / 6
  - 06-15→07-15: 23 / 8
  - 07-15→08-14: 32 / 6
  - 08-14→09-13: 27 / 9
  - 09-13→10-13: 189 / 10

  Windows before 2025-09-18 returned no follows data — [API: GET me/insights?metric=follows_and_unfollows&breakdown=follow_type&metric_type=total_value&period=day&since&until](https://graph.instagram.com/v25.0/me/insights)
- Daily `follower_count` over 2026-09-13→10-13 sums to 189, which equals the FOLLOWER bucket above. 159 of those follows came in the first 12 days (WJPC week, peak 39 on the day ending 2026-09-15). After 2026-09-25 it ran at 0–5 per day — [API: GET me/insights?metric=follower_count&period=day](https://graph.instagram.com/v25.0/me/insights)

### Inferences
- Net growth: about +179 in the last 30 days, +18 to +26 per month while the account was dormant (Jun–Sep 2026), and +34 to +90 per month while it posted regularly (Nov 2025–May 2026). Summing the windows from 2025-10-18 gives about +674 net, so the account had roughly 1,730 followers a year ago. This is approximate and assumes `follows_and_unfollows` captures every change.
- Reading FOLLOWER = follows and NON_FOLLOWER = unfollows is an inference. It rests on the exact match between the FOLLOWER totals and `follower_count` sums in three separate windows (32 = 32, 27 = 27, 189 = 189).
- The best single growth months were tied to events or campaigns. Nov–Dec 2025 had the "guess the feature" contest and big releases (+81 net). Mar–Apr 2026 had a heavy Stories period and only one feed post (+90 net). Sep–Oct 2026 had WJPC 2026 and the giveaway (+179 net).

### Gaps
- Why 3 of the 90 media are missing from `me/media` is unknown. Possibly collab or restricted media; this could not be verified via the API.
- No absolute historical follower counts are available (the API only returns daily follows), so the follower count one year ago is reconstructed, not measured.

## Media history: cadence, formats, captions, topics

### Takeaway
87 feed posts over ~3 years, in bursts with long gaps:
- 3 posts in 2023, 26 in 2024, 50 in 2025, 8 in 2026.
- Formats are 48 carousels, 26 images and 13 reels (only 2 reels since 2024).
- Content is dominated by weekly stats recaps (30), feature/product updates (19) and early personal "solve log/timelapse" posts (18).
- Captions are long (median ~1,070 characters), English since Feb 2024, and use few or no hashtags since 2025.
- Stories exist (confirmed in account-level insights) but cannot be listed historically through the API.

### Cited Findings
- Formats (media_type/media_product_type): CAROUSEL_ALBUM/FEED 48, IMAGE/FEED 26, VIDEO/REELS 13. No STORY items appear in `me/media` — [API: GET me/media?fields=id,media_type,media_product_type,timestamp,like_count,comments_count,caption,permalink,children{id,media_type}](https://graph.instagram.com/v25.0/me/media)
- Formats by year:
  - 2023: 2 images, 1 carousel.
  - 2024: 11 reels, 13 carousels, 2 images.
  - 2025: 32 carousels, 16 images, 2 reels.
  - 2026: 6 images, 2 carousels.

  The last reel was posted 2025-12-14 — [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- Posts per month: Jan–Mar 2024 had 6–9 per month. Jan–Jun 2025 averaged ~6.3 per month (7, 10, 7, 4, 4, 6), with a weekly Monday recap rhythm. From mid-2025 the cadence was ≤4 per month — [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- Median gap between posts is 5 days. Gaps over 60 days: 2024-04-10→2024-08-12 (124 d), 2024-08-23→2024-12-24 (123 d), 2025-09-16→2025-11-17 (62 d), 2026-03-24→2026-09-14 (174 d, the longest, just before WJPC 2026) — [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- Weekday: 37 of 87 posts on Monday (32 of the 58 posts since 2025, driven by the Monday recap). Posting time in Prague local time: 00–05 h: 7, 06–11 h: 10, 12–17 h: 27, 18–20 h: 16, 21–23 h: 27. Recent posts often went out late evening or after midnight Prague time — [API: GET me/media (timestamp)](https://graph.instagram.com/v25.0/me/media)
- Carousels are mostly 7 slides (27 of 30 recaps have 7 slides). Overall carousel slide counts range from 2 to 9 — [API: GET me/media (children)](https://graph.instagram.com/v25.0/me/media)
- Captions:
  - Length: median 1,069 characters (mean 1,078, min 80, max 2,167). Median by year: 2023 257, 2024 419, 2025 1,529, 2026 1,003. Weekly recaps have a median of 1,745 characters.
  - 82 of 87 contain emoji. 46 contain @mentions (brands, competitions, featured puzzlers). 29 point to the site or "link in bio".

  — [API: GET me/media (caption)](https://graph.instagram.com/v25.0/me/media)
- Language: 13 captions are Czech-only, all from 2023-11 to 2024-02-11. From the public launch post (2024-02-17) onward captions are in English, sometimes with Czech puzzle titles in parentheses — [API: GET me/media (caption)](https://graph.instagram.com/v25.0/me/media)
- Hashtags: mean per post was 10 in 2023, 9.6 in 2024, 3.2 in 2025 and 0.6 in 2026. 34 of the 58 posts since 2025 have none. Most used overall: #speedpuzzling (45), #puzzle (39), #jigsawpuzzle (25), #speedpuzzling500 (25), #jigsawpuzzles (23), #myspeedpuzzling (22) — [API: GET me/media (caption)](https://graph.instagram.com/v25.0/me/media)
- Topic classification (manual, all 87 captions):
  - **Weekly/monthly stats recap (30):** most-solved puzzles, fastest solo/duo/team times, number of times added that week. Mostly 7-slide carousels, Jan–Aug 2025, plus one monthly recap in Apr 2024.
  - **Feature/product update (19):** e.g. graphs, statistics section, barcode/EAN scan, data export, filters, library/collections release, "suggest a change", marketplace and chat, developer API, stopwatch redesign, feature-request voting, language launch, competition tagging.
  - **Personal solve log/timelapse (18):** "Title/Brand/Pieces/Time" posts, many on WJPC 2023 qualification puzzles, Jan–Mar 2024.
  - **Behind-the-scenes/milestone/event (7):** a puzzle-swap trip, WJPC 2024 news, the new logo, the 2024 Christmas year-in-review, the Jigsaw Puzzle Culture Awards 2024 win, competing at the Swedish nationals, a community meetup weekend.
  - **Ops/status/correction (5):** downtime, outage, small fixes.
  - **Giveaway/contest (3):** a "guess the upcoming feature" contest (Nov 2025), the WJPC 2026 giveaway carousel (Sep 2026), the WJPC 2026 giveaway winner announcement (Sep 2026).
  - **Membership/pricing (2).**
  - **Pre-launch Czech shop promo (2).**
  - **Platform launch announcement (1, Feb 2024).**

  — [API: GET me/media (caption)](https://graph.instagram.com/v25.0/me/media)
- Stories: account-level views by `media_product_type` show STORY views of 10,905 (2026-09-13→10-13), 18,516 (2026-03-17→04-16), 13,268 (2026-01-16→02-15), 10,475 (2026-04-16→05-16) and ~12,200 in each of the two windows from 2025-08-19 to 2025-10-18. Story views were ~1 per window from 2026-06-15 to 2026-09-13 — [API: GET me/insights?metric=views&breakdown=media_product_type&metric_type=total_value](https://graph.instagram.com/v25.0/me/insights)

### Inferences
- The account has gone through three content eras:
  1. Early 2024: a founder's personal solve logs, timelapse reels and launch posts.
  2. 2025: a systematic, data-driven weekly recap series (Jan–Aug), plus feature announcements.
  3. Late 2025–2026: occasional feature drops in a single image, community and event posts, and giveaways.

  The voice is first-person founder ("I/we"), warm and emoji-heavy.
- The weekly recap was the only sustained cadence the account has had (~29 consecutive-ish weeks). It stopped in Aug 2025, which suggests manual effort was the bottleneck. This is directly relevant to an automated, data-driven pipeline.
- Stories carry a large share of views in many months (often more than all feed formats combined) and were used heavily in Jan–May 2026 while feed posting was sparse. The pipeline should treat Stories as a first-class channel.

### Gaps
- Historical story content (count, topics, timing) cannot be retrieved: `me/stories` only returns currently active stories, and stories do not appear in `me/media`. Only account-level aggregates exist.
- Caption-language classification used a simple heuristic (Czech diacritics and absence of common English words). Mixed-language captions were counted as English.

## Media performance: top/bottom posts and patterns

### Takeaway
- Giveaways and contests are by far the strongest posts for reach, comments and new follows. The WJPC 2026 giveaway carousel reached 4,357 accounts, got 359 comments and brought 60 follows.
- Next come major feature launches in a single bold image. Weekly recaps are steady mid-performers (reach ~900) with the lowest ER but the most shares.
- Ops/correction posts and mid-2025 recaps are the bottom.
- Pre-2025 per-post insights are unreliable (partially expired), so the comparisons below use the 58 posts since 2025.

### Cited Findings
- Insights permission works. 71 of 87 media return insights. The 16 media posted 2023-11-25 to 2024-02-18 fail with `(#100)` subcode `2108006`. The message comes back localized in Czech; in English it means "media was posted before the account was converted from personal to business" — so the business switch happened between 2024-02-18 and 2024-02-21 — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Working media metrics under v25 Instagram Login:
  - FEED (image/carousel): `reach, views, saved, shares, total_interactions, likes, comments, follows, profile_visits, profile_activity`.
  - REELS: `reach, views, saved, shares, total_interactions, likes, comments, ig_reels_avg_watch_time, ig_reels_video_view_total_time`.

  — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Failing media metrics, with the error each returns:
  - `impressions` → "(#100) The Media Insights API does not support the impressions metric for this media product type" (all types).
  - `plays`, `video_views`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count`, `engagement` → "(#100) metric[0] must be one of the following values: …"
  - `reposts` → "endpoint does not support the metrics: reposts".
  - `navigation` and `replies` are not supported on feed or reels. They appear in the API's own list of valid metric names, but no story could be tested because none was active.
  - `follows`, `profile_visits` and `profile_activity` are not supported on REELS.
  - `facebook_views` and `crossposted_views` (on reels) → code -1, subcode 2207086 "Fatal".

  — [API: GET MEDIA_ID/insights (probe of 23 metrics on 6 sample posts)](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Meta documents that media metrics are "stored for up to 2 years". `likes`, `comments`, `views` and `total_interactions` are organic-only — [Meta docs: Instagram Media Insights – Limitations](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights)
- Pre-2025 data anomaly: the 13 posts from 2024 with insights show reach of only 106–226 while having 56–119 likes. One carousel (2024-02-21) has likes above reach (ER 105%). Six 2024 carousels return `views` = 0 — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Baseline per post (58 posts, 2025-01 to 2026-09): median reach 901 (excluding giveaways), median ER 8.5% (excluding giveaways), median likes 61, median comments 2. Across all 71 posts with insights: median views 2,464, views/reach ~2.8, shares 2, saves 1, follows 1 per post — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights) + [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- By format (2025+):

  | Format | n | Median reach | Median ER | Median likes | Median comments | Shares (sum) | Follows (sum) |
  |---|---|---|---|---|---|---|---|
  | Image | 22 | 976 | 9.5% | 94 | 6 | 45 | 91 |
  | Carousel | 34 | 906 | 8.2% | 61 | 2 | 235 | 145 |
  | Reel | 2 | 823 | 10.1% | 78 | — | 1 | 0 (metric unsupported) |

  The two reels: barcode-search feature (Feb 2025) reached 608, EAN-scan feature (Dec 2025) reached 1,038. Average watch time was 10.9–11.8 s — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- By theme (2025+, median reach / median ER):
  - Giveaway/contest (n=3): 2,252 / 13.4%. Median comments 79, 102 follows in total, which is 43% of all 236 follows attributed to 2025+ posts.
  - Feature/product update (n=16): 1,033 / 10.6%.
  - Weekly stats recap (n=29): 901 / 7.9%. Median 1 comment, but 161 shares in total.
  - Membership/pricing (n=2): 864 / 8.0%.
  - Behind-the-scenes/milestone (n=3): 857 / 18.0%.
  - Ops/status/correction (n=5): 662 / 7.9%.

  — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Top posts by reach (2025+):
  1. WJPC 2026 giveaway carousel ("have you seen the tech guy at WJPC", comment to enter), Mon 2026-09-14 22h Prague: reach 4,357, views 11,079, 564 likes, 359 comments, 62 shares, 25 saves, 60 follows, ER 23.5%.
  2. "Guess the upcoming feature, win a membership" contest image, Nov 2025: reach 2,252, 79 comments, 31 follows.
  3. Giveaway winner announcement image, Sep 2026: reach 2,170, 11 follows.
  4. Library/Collections mega-release image, Dec 2025: reach 1,875, 213 likes, 19 follows.
  5. Stopwatch redesign image, Feb 2026: reach 1,531.
  6. First weekly recap carousel, Jan 2025: reach 1,355.
  7. Developer API announcement carousel, Feb 2026: reach 1,256.

  — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Bottom posts by reach (2025+): small-update/status image, Feb 2025 (527); weekly recap carousels from Apr–May 2025 (556, 579, 601); a graphs-feature carousel, Jan 2025 (572); a recap-correction image, Feb 2025 (585); the barcode-search reel, Feb 2025 (608); a "1st Try" filter image, Jan 2025 (609) — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Top posts by ER (2025+): the WJPC 2026 giveaway (23.5%); "wish me luck" personal photo before competing at the Swedish nationals, Mar 2025 (22.2%, 180 likes); the award-win and anniversary post, Feb 2025 (18.0%); the Statistics-section launch carousel, Mar 2025 (15.3%, 18 comments); the developer API carousel, Feb 2026 (14.1%); "suggest a change / report duplicate" feature image, Jan 2026 (13.6%, 17 comments) — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Bottom posts by ER (2025+): a correction image, Jun 2025 (4.2%); a feature for linking accounts to an external competition-results site, Jul 2025 (4.3%); then eight weekly recap carousels from Mar–Jun 2025 (5.6–6.5%) — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Shares and saves: outside the WJPC giveaway (62 shares), the five most-shared posts are all weekly recaps (8–12 shares each). The most-saved posts after the giveaways are feature launches (4–7 saves each) — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Trend: median per-post reach was 818 in 2025 H1 (n=38), 997 in 2025 H2 (n=12), 1,198 in 2026 H1 (n=6) and 3,264 in 2026 H2 (n=2). Median likes over the same periods: 57, 79, 126, 373 — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Timing (2025+, median reach by Prague posting hour): 00–05 h 1,209 (n=7), 06–11 h 824 (n=4), 12–17 h 901 (n=12), 18–20 h 1,013 (n=10), 21–23 h 883 (n=25). By weekday, Monday (n=32) had a median reach of 892, and the other weekdays had too few posts each (n=3–8) to compare — [API: GET me/media + MEDIA_ID/insights](https://graph.instagram.com/v25.0/me/media)

### Inferences
- The 2024 per-post reach and views are almost certainly undercounted. Likes above reach is impossible if reach were complete, and all 2024 posts are older than the documented 2-year retention. Treat 2024 reach and ER as unusable and compare 2024 only on like counts (2024 median 57 likes vs 2025+ median 61). Even like counts are confounded by the account having far fewer followers then.
- What has worked:
  - Participatory mechanics (comment-to-enter, guess-the-feature) multiply reach (2.5–5× the median), comments (40–180× the median) and follows. They are the main lever for non-follower discovery.
  - Big, long-awaited feature drops announced with a single punchy image and a community angle (e.g. "you asked, we listened") outperform both recaps and incremental feature posts.
  - Personal, human moments (competing, awards) get high ER but only average reach.
- Weekly recaps reach a consistent ~900 accounts and are the most shared non-giveaway format. This is plausibly because featured puzzlers share them, but per-share attribution is not available. Their reach declined from Jan–Mar 2025 (~900–1,350) to Apr–Jun 2025 (~550–1,100), and they get very few comments. A data-driven pipeline could revive them in a more visual, less text-heavy and more interactive form (e.g. ask a question, tag featured solvers).
- Rising per-post reach from 2025 H1 to 2026 partly reflects follower growth and partly the shift to fewer, bigger posts. The two effects cannot be separated with the available data.
- Posting-hour effects are confounded with era and topic: the 00–05 h bucket is mostly the Dec 2025–Feb 2026 big feature launches. No reliable timing effect can be read from post history alone, so use the online-follower data instead (see the audience section).
- Reels are under-tested (only 2 since 2025). On those two they reached about the same as images. No conclusion about reels' discovery potential is possible.

### Gaps
- Per-post reach split into followers and non-followers is not available on media insights (it only exists at account level), so which posts drove discovery cannot be determined beyond the `follows` metric.
- `follows`/`profile_visits` are unsupported for reels, so reels cannot be compared with feed posts on follower conversion.
- Comment text and sentiment were not analyzed (to avoid handling commenters' personal data).
- With only 3 giveaways, 2 reels and few non-Monday posts, the format, weekday and theme comparisons have small sample sizes.

## Audience demographics, online times and account-level reach

### Takeaway
- The audience is international and English-speaking, led by the US (24%) and Germany (11%), with Canada, Australia, Czechia and the UK at ~5% each. Followers are 59% female (31% undisclosed) and mostly aged 25–44 (71%).
- Followers are most online in the European afternoon and evening, peaking at 19:00–22:00 Prague time (17:00–20:00 UTC in summer time).
- Account-level reach collapses to ~50–70 accounts per month when nothing is posted, versus 1–3k in active months and 5k during WJPC 2026.

### Cited Findings
- Follower countries (top 45 only; 2,294 followers with country data): US 543 (23.7%), DE 256 (11.2%), CA 136 (5.9%), AU 116 (5.1%), CZ 116 (5.1%), GB 112 (4.9%), ES 79 (3.4%), FR 78 (3.4%), SE 66 (2.9%), PL 64 (2.8%), AT 56 (2.4%), PT 55 (2.4%), FI 53 (2.3%), NL 51 (2.2%), NO 48 (2.1%) — [API: GET me/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=country](https://graph.instagram.com/v25.0/me/insights)
- Follower age (2,350 with data): 13–17 0.3%, 18–24 4.0%, 25–34 31.4%, 35–44 39.4%, 45–54 17.2%, 55–64 6.2%, 65+ 1.6%. Gender: F 59.3%, U 31.2%, M 9.4% — [API: GET me/insights?metric=follower_demographics&breakdown=age|gender](https://graph.instagram.com/v25.0/me/insights)
- Top follower cities (top-45 list covers only 463 followers): Prague 29, Melbourne 28, Vienna 24, Sydney 22, Toronto 22, Budapest 13, London 12, Oslo 12, Helsinki 12, Portland 12, Bogotá 11, Brisbane 11 — [API: GET me/insights?metric=follower_demographics&breakdown=city](https://graph.instagram.com/v25.0/me/insights)
- Engaged-audience countries (requested with timeframe=this_month; 645 accounts): US 18.4%, DE 13.0%, CA 5.9%, AU 5.9%, CZ 5.1%, GB 5.0%, PT 3.3%, ES 3.3%, AT 3.1%, NL 3.1%. Engaged audience is 62.6% female and 42.0% aged 35–44 — [API: GET me/insights?metric=engaged_audience_demographics&timeframe=this_month](https://graph.instagram.com/v25.0/me/insights)
- Reached-audience countries (755 accounts): DE 16.3%, US 16.0%, GB 5.8%, CZ 4.8%, CA 4.5%, AU 3.7%, ES/PL 3.3%, NL 3.2%, IN 2.9%, BE 2.8% — [API: GET me/insights?metric=reached_audience_demographics&timeframe=this_month](https://graph.instagram.com/v25.0/me/insights)
- The `timeframe` parameter had no visible effect on `follower_demographics`: identical results with no timeframe, `this_month` and `last_90_days`, and no timeframe dimension in the response. Meta's docs list `timeframe` as required for demographics and show a timeframe dimension key — [API: GET me/insights](https://graph.instagram.com/v25.0/me/insights); [Meta docs: IG User Insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights)
- Meta says demographic metrics return only the top 45 values, and data may be delayed up to 48 hours. `online_followers` is only available for the last 30 days — [Meta docs: IG User Insights – Limitations](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights)
- `online_followers` with `period=lifetime` and no since/until returned empty `{}` values. With since/until covering the last 29 days it returned hourly data for 28 of 29 days. Day `end_time` values fall at 07:00 UTC, i.e. midnight US Pacific Daylight Time — [API: GET me/insights?metric=online_followers&period=lifetime&since&until](https://graph.instagram.com/v25.0/me/insights)
- Average online followers by hour (2026-09-14→10-12). Hour keys are interpreted as US Pacific time; Prague = key + 9 h, UTC = key + 7 h in this DST period:

  | Prague time | UTC | Average online followers |
  |---|---|---|
  | 09–12 | 07–10 | ~450–515 (19–21% of followers) |
  | 13–17 | 11–15 | 573–635 |
  | 18–22 | 16–20 | 646–689 (peak 689 ≈ 29% at 21:00 Prague / 19:00 UTC) |
  | 23 | 21 | 581 |
  | 00 | 22 | 470 |
  | 03–05 (trough) | 01–03 | ~300–320 (13%) |

  The maximum single-hour value was 764 — [API: GET me/insights?metric=online_followers](https://graph.instagram.com/v25.0/me/insights)
- Account totals per 30-day window (`metric_type=total_value`):

  | Window | Reach | Views | Interactions | Profile views | Website clicks | Accounts engaged |
  |---|---|---|---|---|---|---|
  | 2026-09-13→10-13 | 5,003 | 28,026 | 1,501 (953 likes, 358 comments, 69 shares, 29 saves, 8 replies) | 633 | 48 | 669 |
  | 2026-08-14→09-13 | 57 | 381 | 2 | 81 | 6 | — |
  | 2026-07-15→08-14 | 67 | 502 | 0 | 116 | 15 | — |
  | 2026-06-15→07-15 | 47 | 503 | 0 | 71 | — | — |
  | 2026-03-17→04-16 | 1,787 | 23,835 | 574 | 412 | — | — |
  | 2025-11-17→12-17 | 2,835 | 23,973 | 1,040 | 410 | — | — |

  Over the last 12 months, active months mostly ranged from 741 to 2,835 reach and 6.8k to 24k views — [API: GET me/insights?metric=reach,views,total_interactions,profile_views,website_clicks,accounts_engaged](https://graph.instagram.com/v25.0/me/insights)
- Last 30 days split:
  - Reach by follow_type: NON_FOLLOWER 3,482 vs FOLLOWER 1,595.
  - Views by follow_type: FOLLOWER 20,123 vs NON_FOLLOWER 7,903.
  - Reach by product type: CAROUSEL 4,408, POST (image) 2,210, STORY 1,115, REEL 40.
  - Interactions by product type: POST 1,282, STORY 217, REEL 2.

  — [API: GET me/insights?breakdown=follow_type|media_product_type](https://graph.instagram.com/v25.0/me/insights)
- Daily reach 2026-09-13→10-13: 1,410 and 1,961 on the first two WJPC days, falling to 7–50 per day by early October, then 480 on the last day of the window — [API: GET me/insights?metric=reach&period=day (time series)](https://graph.instagram.com/v25.0/me/insights)
- Account-level `impressions` is gone: "(#100) metric[0] must be one of the following values: reach, follower_count, website_clicks, profile_views, online_followers, accounts_engaged, total_interactions, likes, comments, shares, saves, replies, engaged_audience_demog…". Meta deprecated `impressions` in favor of `views` (v22+, all versions from 2025-04-21) — [API: GET me/insights?metric=impressions](https://graph.instagram.com/v25.0/me/insights); [Meta docs: IG User Insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights)

### Inferences
- **Language:** English should be the primary language. Czechia is only ~5% of followers. The audience is US + Western/Northern Europe + Commonwealth (US, DE, CA, AU, GB together are about 50%). German is the largest non-English-native market (11% of followers, 13–16% of engaged and reached accounts), so occasional German touches or DACH-relevant content (Austria +2.4%) may pay off. Czech should not be a default language.
- **Persona:** mainly women aged 25–54, consistent with the competitive and hobby jigsaw community.
- **Posting windows:**
  - Main window: 17:00–20:00 UTC, which is 19:00–22:00 Prague in summer time and 18:00–21:00 Prague in winter if follower habits follow local time. This catches the European evening peak and US East-coast afternoon (13:00–16:00 ET).
  - Secondary window: 13:00–17:00 Prague (11:00–15:00 UTC summer), which is 573–635 online, the European afternoon plus US morning on the East Coast.
  - Avoid 01:00–07:00 Prague, the trough at ~13% online. Several past "after midnight" posts fall into the early part of this.
  - Australia and NZ (~6%) are effectively asleep in the main window, so occasional Monday-morning-Prague posts (07:00–09:00 UTC = AU evening) could serve them.
- **Hour-key time zone:** reading the hour keys as Pacific time is an inference. The 07:00 UTC day boundaries support it, and so does the shape: a trough at 03–05 Prague time is plausible for a Europe-majority audience, while reading the keys as UTC would put the trough at 20–22 Prague, which is implausible. The official docs consulted do not state the zone explicitly.
- **Time-zone changes:** Prague moves from UTC+2 to UTC+1 on 2026-10-25 and US Pacific from UTC−7 to UTC−8 on 2026-11-01. A scheduler should store windows in UTC or Prague local time explicitly and re-check `online_followers` after the DST changes.
- **Dormancy:** without posting, organic reach essentially disappears (about 2 accounts per day). The account depends on consistent posting for any visibility.
- **Discovery:** the WJPC giveaway reached mostly non-followers (70% of reach), whereas Stories mostly reach existing followers (views dominated by followers). Feed contests are the discovery engine; Stories are the retention channel.

### Gaps
- Meta's docs do not state the time zone of the `online_followers` hour keys; the interpretation above is inferred.
- The online-follower curve covers only one 29-day window that included WJPC 2026 (atypically active). It should be re-sampled in a "normal" month.
- `accounts_engaged` returned 0 for every window before ~2026-03 even when `total_interactions` was above 0. Product-type breakdowns of reach were empty or near-zero before ~2025-10 although total reach was not. Older account-level breakdowns are therefore unreliable.
- `profile_links_taps` returned 0 in every window and its `contact_button_type` breakdown returned no results. Link taps cannot be measured reliably.
- Demographics reflect only accounts with available data (2,294–2,350 of 2,405 followers) and only the top 45 countries and cities.

## Token permissions and content publishing readiness

### Takeaway
The token is valid and works for profile and media reads, media and account insights, comments, tagged media, conversations, and `content_publishing_limit`. Together these are consistent with `instagram_business_basic`, `instagram_business_manage_insights`, `instagram_business_manage_comments`, `instagram_business_manage_messages` and `instagram_business_content_publish`. The publishing quota is 100 posts per 24 h, with 0 used.

### Cited Findings
- `GET me` and `GET me/media` (full pagination) succeeded — [API: GET me](https://graph.instagram.com/v25.0/me); [API: GET me/media](https://graph.instagram.com/v25.0/me/media)
- `GET MEDIA_ID/insights` and `GET me/insights` (reach, views, demographics, online_followers, follower_count, follows_and_unfollows) succeeded. Errors were limited to unsupported or deprecated metrics and pre-business media — [API: GET me/insights](https://graph.instagram.com/v25.0/me/insights)
- Meta's docs say account insights under Instagram Login require `instagram_business_basic` and `instagram_business_manage_insights` — [Meta docs: IG User Insights – Requirements](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights)
- `GET me/content_publishing_limit?fields=config,quota_usage` returned `quota_total` 100, `quota_duration` 86400 s, `quota_usage` 0 — [API: GET me/content_publishing_limit](https://graph.instagram.com/v25.0/me/content_publishing_limit)
- Meta's docs list the requirements for `content_publishing_limit` under Instagram Login as `instagram_business_basic` + `instagram_business_content_publish`, with a limit of 100 API-published posts per moving 24 h — [Meta docs: IG User Content Publishing Limit](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit); [Meta docs: Content Publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
- `GET MEDIA_ID/comments` (fields=id,timestamp, limit=1) succeeded. `GET me/conversations` (fields=id, limit=1) succeeded and returned a row. `GET me/tags` returned 3 tagged media. `GET me/stories` succeeded (0 active) — [API: GET MEDIA_ID/comments](https://graph.instagram.com/v25.0/MEDIA_ID/comments); [API: GET me/conversations](https://graph.instagram.com/v25.0/me/conversations); [API: GET me/tags](https://graph.instagram.com/v25.0/me/tags)
- The valid Instagram Login scopes are `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_messages` and `instagram_business_manage_comments`. The older `business_*` scope values were deprecated on 2025-01-27 — [Meta docs: Instagram API with Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login)
- The `.env` was last modified 2026-09-17. The prototype notes say tokens last 60 days and are extended with `refresh_access_token` (not called in this audit) — local file metadata; `/Users/janmikes/www/ig-giveaway/draw.py` (docstring and `cmd_refresh`)

### Inferences
- Content publishing permission is very likely present, because `content_publishing_limit` succeeded and the docs require `instagram_business_content_publish` for it. This was not proven by an actual publish attempt (deliberately not made). The token's granted-scopes list was not re-read (that only comes back at code exchange).
- Comment and messaging permissions are inferred from successful reads of comments and conversations. The exact permission required per endpoint was not re-verified in the docs during this audit.
- If the token was minted or refreshed around 2026-09-17, it likely expires around mid-November 2026. The pipeline needs a token-refresh step, which was out of scope here.
- Insight-API quirks the pipeline must handle:
  - Request metrics per product type (FEED vs REELS vs STORY).
  - Treat subcode 2108006 as "no insights" rather than a failure.
  - Use `views`, not `impressions`/`plays`.
  - Always pass since/until (≤30 days) for `online_followers` and time-series metrics.
  - Snapshot story insights within 24 h of posting, since stories cannot be listed later.

### Gaps
- No introspection endpoint was used to list the token's exact granted scopes or its expiry date. Both are inferred.
- Story-level insights (`navigation`, `replies` on a story) could not be tested because no story was live.

## Implications for content strategy, posting times and the growth baseline

### Takeaway
- Build the pipeline around a data-driven recurring series (a modernized weekly recap or leaderboard) for consistency, plus regular "feature drop" posts. Add periodic participatory hooks (guess, comment, tag, giveaway) for discovery.
- Write in English, post in the 17:00–20:00 UTC window, and use Stories as the follower-retention channel.
- Measure against these baselines: ~2,405 followers, ~900 median reach and ~8.5% median ER per regular post, ~1–3k monthly account reach in active months, and +35–90 net followers per month in active non-event months.

### Cited Findings
- Giveaway and contest posts: median reach 2,252, median 79 comments, 102 follows from 3 posts. Feature updates: median reach 1,033, ER 10.6%. Weekly recaps: median reach 901, ER 7.9%, most shares among non-giveaway posts. Ops/correction posts: lowest reach (median 662) — [API: GET MEDIA_ID/insights](https://graph.instagram.com/v25.0/MEDIA_ID/insights)
- Followers are 23.7% US, 11.2% DE, ~5% each CA/AU/CZ/GB. Online-follower peak is 19:00–22:00 Prague (17:00–20:00 UTC, summer time) — [API: GET me/insights?metric=follower_demographics / online_followers](https://graph.instagram.com/v25.0/me/insights)
- Dormant months (Jun–Sep 2026) had 47–67 accounts reached and 18–26 net new followers per 30 days. Active months had 741–2,835 reached and +30 to +90 net. The WJPC month had 5,003 reached and +179 net — [API: GET me/insights](https://graph.instagram.com/v25.0/me/insights)
- Stories produced 10–18.5k views per 30-day window in active periods, often more than all feed formats combined — [API: GET me/insights?metric=views&breakdown=media_product_type](https://graph.instagram.com/v25.0/me/insights)

### Inferences
- **Content mix suggestion** (inference for the strategy writer):
  1. A weekly data post generated from MSP platform data (records, most-solved puzzles, fastest times, milestones), designed as a visual carousel with a short caption, a question CTA and tags or mentions of featured puzzlers and brands to drive shares.
  2. Feature and product drops as single bold images or short reels with a "you asked, we listened" framing.
  3. Monthly or event-driven participatory posts: guess-the-feature, predict-the-time, comment-to-enter giveaways around competitions (WJPC, national championships, EJJ).
  4. Founder and behind-the-scenes posts for warmth (high ER).
  5. Daily or near-daily Stories reusing the data, e.g. polls on "which puzzle will be most solved".
  6. Avoid ops/correction posts on the feed; move them to Stories.
- **Reels:** worth testing systematically (e.g. timelapse or "record of the week"). Current evidence is too thin to rank them.
- **Captions:** the 1,500+ character recap captions coincided with declining recap performance. Shorter captions with the data on the slides are worth A/B testing. Hashtags have been nearly abandoned. With pre-2025 reach unreliable there is no evidence either way, so a light, consistent hashtag set (#speedpuzzling, #jigsawpuzzle, #puzzle, #myspeedpuzzling) is a cheap test.
- **Event calendar:** competition seasons (Feb–Mar national championships, Sep WJPC) produced the account's best numbers. The pipeline should pre-plan event-tied content.
- **Baseline KPIs** for tracking future growth (as of 2026-10-13):
  - Followers: 2,405.
  - Net follower growth: +18 to +26 per month dormant, +30 to +90 per month regular posting, +179 in an event month.
  - Median reach per non-giveaway post: ~900.
  - Median ER (interactions/reach): ~8.5%.
  - Median likes / comments per post: 61 / 2.
  - Median follows per feed post: 1.
  - Monthly account reach: 1–3k active, ~50 dormant.
  - Monthly views: 7–24k active.
  - Monthly profile views: 128–412 active.
  - Website clicks: 48 in the last 30 days.

### Gaps
- No data links Instagram activity to MSP sign-ups or time submissions (website clicks are the only proxy). UTM-tagged bio links or app-side referral tracking would be needed.
- No competitor or benchmark data was collected in this local audit, so whether ~8.5% ER or ~900 reach is good for an account of this size is not established here.
- Story-level performance history is unavailable. Future story insights must be captured within 24 h of posting.
