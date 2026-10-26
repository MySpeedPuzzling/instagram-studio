# Reach and cadence: how often, which format, how far apart (2026-10-22)

Owner's question (22 Oct 2026): "What posting cadence and practices maximise reach? Every day, every second day, or
something else?"

**Builds on, does not repeat:** [growth_strategy_2026.md](growth_strategy_2026.md) (Buffer 2.1M-post study, Hootsuite
3–5/week, Photoslurp 2018, Dash Social, 4/week start, decision rules §5.3, 8-week plan) and
[ig_growth_strategy.md](../MSP%20Instagram%20content%20pipeline/ig_growth_strategy.md) (signals, formats, timing basics).
This note goes deeper on **reach, especially non-follower reach**: small accounts, Reels vs carousels, spacing, Trial
Reels, timing. `docs/decisions.md` wins where it disagrees (it currently says 3 pipeline posts a week plus the owner's
own posts; the owner's 17 Oct direction is "3–5, more when the data supports it").

Labels: **[E]** external evidence (source + date) · **[M]** MSP's own data · **[O]** our reasoning.
Vendor studies are flagged **(vendor)**; anything older than 2024 is flagged **(old)**.

## 0. Answer on one page

| Question | Answer | Basis |
|---|---|---|
| Every day or every second day? | **Neither as a rule. Use about 5 feed posts a week, at most 1 per day, back-to-back days allowed.** Daily (7/week) is not ruled out by evidence, but the evidence that daily adds *reach per post* is weak for small accounts, and approval capacity and idea quality are the real limit | [E] Buffer within-account, Mosseri AMA Mar 2025, Instapect spacing; [M] 17–19 Oct run; [O] |
| Format split | **3 carousels + 1–2 feed Reels a week** (Reels 25–40 % of feed posts). Carousels keep followers engaged; Reels are the main non-follower lever | [E] Socialinsider Jun 2026, Metricool Jun 2026, PostFast Sep 2026; [O] |
| Trial Reels | **2–3 a week, on top of the feed count**, starting now (by hand until the publisher supports Reels). Each is a visibly different video (not a re-cut of the same file) | [E] Mosseri 2025 videos and AMA, Help Center (quoted Aug–Sep 2026); [O] |
| Stories | **1–3 frames on 5–7 days a week**; more on event days. They keep followers but bring almost no new reach | [E] Mosseri Nov 2024 & Sep 2025; [M] audit |
| Spacing | **≥ 20 h between feed posts by default.** Two the same day only when one is a Reel (≥ 4–6 h apart) or on an event day. Never two carousels the same day | [E] Instagram feed diversity rule (2023), Metricool day-1 share, Instapect; [O] |
| Gaps | A 2–3 day pause is harmless. **No zero-post weeks**; months-long breaks hurt | [E] Mosseri Mar 2025, Buffer Aug 2025, Instapect; [M] dormant months ~50 reach |
| Timing | **Second-order.** Keep 19:00–21:00 Prague (CET from 25 Oct) as the default. Shift by hours when it helps, but never hold a ready post for a day to hit a slot | [E] PostFast normalised data, Buffer; [M] flat follower-online curve |

## 1. Frequency vs reach: small accounts, Reels and carousels separately

### 1.1 What's new since the 17 Oct note

| Source (sample, date) | Finding relevant to reach | Caveats |
|---|---|---|
| **Socialinsider reach study** (brand pages 1k–1M, Jan 2025–Aug 2026; published 3 Sep 2026, updated 21 Oct 2026) | Reach rate (reach ÷ followers) falls with size: **1–5k 6.65 %**, 5–10k 5.75 %, 10–50k 5.50 %, 100k–1M 3.50 %. Carousels 4.50 % > Reels 4.10 % > images 4.00 % (all sizes pooled). Reach down 14 % YoY. **No frequency data** | (vendor) Dataset size given as both 872k and 72.5M posts, and the summary gives both 3.20 % and 4.90 % as the "average": internally inconsistent |
| **Socialinsider Reels study** (organic Reels, Jan–Jun 2026; published 24 Jun 2026, updated 21 Oct 2026) | Reach rate by format **at 1–5k: Reels 9.78 %, carousels 8.80 %, images 7.00 %**; at 5–10k 7.55 / 7.40 / 6.35. Reels lead only below 50k. Small accounts post **8 Reels/month** on average. Skip rate (first 3 s) **65.5 % at 1–5k**. 30–60 s Reels reach most (5.6 %). **No finding links Reels frequency to reach per Reel** | (vendor) Methodology says >100k accounts excluded yet tables show a 100k–1M tier |
| **Metricool Instagram study** (24.4M posts, 375k accounts, Jan–Feb 2026 vs 2025; 16 Jun 2026) | Reels ~29 % more reach than carousels; carousels ~20 % more total views. **Decay:** day 1 = ~30 % of a Reel's lifetime views and ~44 % of a static post's; days 1–3 = 65 % (Reels) and 76 % (posts/carousels) | (vendor) Reach comparison pooled across sizes |
| **Metricool Social Media Study 2026** (39.8M posts, 1.06M accounts, 2025; 10 Dec 2025) | Instagram Reels reach −35 %, post reach −31 % YoY while (per secondary reports) panel posting volume rose. Platform-wide saturation, not a within-account test | (vendor) The "volume doubled" detail is only in secondary write-ups (Sotrender Aug 2026) |
| **PostFast timing data** (23,552 IG posts, 289 workspaces, 90 days to 4 Sep 2026) | On the same account, **a Reel gets a median 2.38× the impressions of a feed post** (42 accounts; middle half 1.26–6.71×) | (vendor) Impressions, not reach; small n for the format comparison |
| **SocialTools AI** (2,400 public accounts, 5 cadence buckets × 4 size cohorts; ~May 2026) | Per-post engagement rate 2.10 % (< 1/wk) → 0.53 % (7–14/wk); total weekly engagement 1.71 % → 9.15 %. **1k–10k accounts posting daily: ~12× the weekly engagement of weekly posters** | (vendor) **Partly verified:** the page exists and is dated May 2026 on the vendor's research index, but it returned HTTP 502 on 22 Oct, so the numbers come from search-index excerpts. Engagement by followers, not reach; cross-sectional (accounts that post more differ in other ways); not peer-reviewed |
| **Instapect audit** (141 self-selected public profiles, 28 Aug–11 Oct 2026; updated 13 Oct 2026) | < 10k followers: per-post ER 5.87 % (< 1/wk) → 3.38 % (3–7/wk) → 0.96 % (7+/wk, **n = 6**); weekly interactions per 100 followers 1.2 → 13.7 → 16.6. Gains flatten above ~3–7/wk | (vendor) Tiny cells, public likes/comments only, no reach |
| **Dash Social** (700k Reels, 3,000+ brands, Jul 2025–Jun 2026) | Highest *engagement rate* on video at **1–3 Reels/week** | (vendor) Large brands, ER not reach |
| Hootsuite Reels experiment (one brand account, 2021) | ~1 Reel/week for a month: reach unchanged | (old), n = 1 |
| CreatorHouse test (one 4.2k account, 10 trial + 10 normal Reels, Apr 2026) | See §4 | (vendor), n = 1 |

**No study found** splits *reach per post* by **both** posting frequency and account size, or measures Reels-only
frequency against reach per Reel. One blog cites "Buffer, April 2026: 5+ Reels/week up to 2.1× reach"; no such Buffer
page could be found → **unverified, don't use**.

### 1.2 Reading [O]

- **More posts → more total reach; reach per post roughly holds.** Buffer's within-account model (each account against
  itself) is still the only good test of this, and it pools formats. The engagement-*rate* studies (SocialTools AI,
  Instapect, Dash) all show per-post rates falling as frequency rises, but they compare *different* accounts. For a
  small account the totals keep climbing to about daily, then flatten.
- **A Reel every day:** no evidence that it lowers reach per Reel within an account, and Mosseri says it doesn't
  (§2). There's also no evidence it scales reach for a 2–3k data account: at 1–5k, two in three plays skip in the first
  3 s, so each Reel's reach depends on its hook. Reels mainly earn
  non-follower reach (Socialinsider: Reels lead only below 50k; PostFast: 2.38× impressions), which makes them the format
  to add when we want *reach*. The hard limit is how many good Reel ideas and builds we have, not the algorithm.
- **Carousels** reach more of our own followers per post (carousel slide-2 "second chance", §3) and carry the data. MSP
  posts already reach far more of its followers than the benchmark ([M] 1,155–2,019 reach on 2,482 followers in
  17–19 Oct ≈ 47–81 %, vs Socialinsider's 6.65–8.80 % at 1–5k). Adding more carousels mostly re-reaches the same
  followers, so the next increase should be a Reel, not a carousel.

## 2. What Instagram itself says (2025–2026)

| Statement | Source, date | Strength |
|---|---|---|
| "If you posted a reel and it's taking off … it should not affect that reach to post another thing, particularly if it's not right immediately afterwards … a ton of reach comes from people who don't follow you yet … **people are too precious about how often they share.** If you are worried … post another reel as a trial" | Mosseri AMA, 7 Mar 2025 (transcribed by Luan Wise, 30 Mar 2025) | Secondary transcript of a primary answer |
| "Your posting frequency can affect your reach, but it isn't the most important thing." Too much may frustrate followers; **"if you don't post for a couple months, that can also hurt your reach"** (less recent data for ranking) | Mosseri AMA, 15 Mar 2025 (same transcript) | Same |
| "There's no perfect number … The more you post, the more chances you have to have your content reach more people." He posts feed/Reels "at least a couple of times a week" and Stories daily | Mosseri AMA, 22 & 29 Mar 2025 (same transcript) | Same |
| Scheduling "will not affect your reach one way or the other" | Mosseri AMA, 29 Mar 2025 (same transcript) | Same; our publisher's scheduling is fine |
| Trial Reels "bypass the entire connected ranking system and just go straight to the unconnected recommendations, so you don't risk **bothering people who followed you with too much content**" | Mosseri video on posting frequency, quoted by Buffer (24 Feb 2025) | Primary video, quoted |
| Trial Reels get "less reach, almost always … compare trial reels to other trials. Look at sends, look at likes, look at watch time" | Mosseri video, quoted by Buffer (24 Feb 2025) | Same |
| Feed ranking tries "to avoid showing **too many posts from the same person in a row**" | Instagram Ranking Explained, Mosseri, 31 May 2023 | Primary, (old) but still the published explainer |
| Carousel not swiped → "we'll often give that carousel a **second chance** and automatically move to that second piece of media" | Mosseri Reel, Oct 2024 (via Mashable/Yahoo Tech) | Primary video, quoted |
| "Creators who post to Stories often see **fewer unfollows**" | Mosseri / @instagramcreators, ~Nov 2024 | Primary |
| Many Stories a day hurting reach was "not at all the intended behavior", now fixed | Mosseri via Engadget, 12 Sep 2025 | Secondary; supersedes his 29 Mar 2025 "post a lot of stories, you can get less reach" and Hootsuite's Stories test (1–2/day beat 5–10/day), which both predate the fix |
| Sends per reach matter more for non-followers, likes per reach for followers; watch time top for Reels | Mosseri via Social Media Today, 22 Jan 2025 and 26 May 2026 | Secondary, consistent over time. "Sends weigh 3–5× likes" is a blog claim with no Instagram source |
| Ranking principles: originality, **recency matters a lot**, small creators' public posts are tested on non-followers, focus on engagement *rates*; Trial Reels recommended for experimenting | Mosseri ranking series via Social Media Today, 24 Sep 2026 | Secondary. "Post as much as you can" is SMT's summary, not a verified quote |
| "Two identical reels can get very different reach depending on timing, competition, and context" | Mosseri, Threads, 28 May 2026 | Primary |
| Carousel + Reel the same day: suggested it won't hurt, though one may beat the other | Mosseri AMA ~mid-Jul 2026 via The Social Tea newsletter (21 Jul 2026) | Weak: paraphrase, no link |
| "Many small businesses find success at three to five posts a week" | @instagramforbusiness, Aug 2026, **only via a vendor blog (Virallized)** | Unverified |

**Reading [O]:** Instagram's line is consistent: frequency is secondary to quality; more posts are more chances;
breaks of months hurt; there is no penalty for posting again while a post is still being distributed (unless it goes up
right after the first one); Trial Reels are the safety valve when you worry about over-posting to followers. Nothing official
supports a fixed number, and nothing says a second post *takes away* reach from the first.

## 3. Spacing and cannibalisation

| Evidence | Finding | Label |
|---|---|---|
| Metricool, 16 Jun 2026 | Day 1 ≈ 44 % of a static post's views and ≈ 30 % of a Reel's; 72 h ≈ 76 % / 65 %. So a post published 24 h after the previous one lands while that one still has over half its views ahead | [E] (vendor) |
| Instagram feed explainer, 31 May 2023 | Feed avoids many posts from one account in a row → two posts within hours compete for the same follower session; a day apart they mostly don't | [E] (old) |
| Mosseri AMA, 7 Mar 2025 | A new post "should not affect" one that's taking off, "particularly if it's not right immediately afterwards" | [E] |
| **Instapect spacing table** (1,501 posts, Oct 2026) | Engagement vs the account's own median by gap since the previous post: < 1 day **1.00×**, 1–2 d 0.94×, 2–4 d 0.95×, 4–7 d 0.96×, 7+ d 1.02×. **No spacing effect** in either direction | [E] (vendor), likes/comments only, small self-selected sample |
| Mosseri, ~mid-Jul 2026 (paraphrase) | Carousel + Reel the same day: no harm, one may outperform | [E] weak |
| Creator anecdote (one 412k account) | Reels on days with Stories −22 % | [E] anecdote, unverified, ignore |
| **MSP 17–19 Oct 2026** | Three carousels on consecutive days. Reach (at the age shown) 2,019 (91 h), 1,362 (62 h), 1,155 (40 h); account daily reach 1,673 / 1,216 / 1,191, then 791 on the first day without a feed post. New followers 25 / 19 / 16 a day vs ~0–3 a day in early October. Posts 2 and 3 were younger when measured; scaled by Metricool's curve, they still land at very roughly 70–75 % of post 1 and at or above the 2026 median (~1,200). Post 1 was a quiz with a brand tag, post 2 the pinned explainer, post 3 Weekly Numbers, so format and topic also differ | [M] n = 3, confounded |
| MSP same-day pairs 2025 (17 Oct note) | Combined reach 1.6–2.1× a median post; the weaker post 54–88 % of its sibling | [M] n = 3 |

**Reading [O]:** there's no evidence of real cannibalisation between posts a day or more apart, and Instagram says
there isn't any. Posts within a few hours of each other do share followers' attention, because the feed spreads one account's posts out. Back-to-back days are fine; same day only for a different surface (Reel), ≥ 4–6 h apart, or an
event. "Every second day" has no evidence behind it: it is simply a lower frequency.

## 4. Trial Reels as a reach lever at higher frequency

| Fact | Source, date | Strength |
|---|---|---|
| Shown to non-followers first; not on the grid or in followers' feeds (followers can still meet it via DMs or audio/location pages) | SMT 8 Jun 2025; Publer 5 Feb 2026 citing creators.instagram.com | Primary-derived |
| Eligibility now: public account, **≥ 200 followers (professional)**, account must be eligible for recommendations | Help Center as quoted by third parties, Aug–Sep 2026 | Secondary (Help Center not fetchable) |
| Trials "are evaluated independently" and "don't impact the performance or ranking of your standard reels" | Help Center as quoted (exemplary.ai, flowgent.ai), 2026 | Secondary |
| "Your trial reel may get limited reach if Instagram detects that you've previously shared the same content." Mosseri (Q&A, ~Sep 2026) confirmed repeated identical trials are detected | Help Center as quoted, Aug 2026; The Reel Stars, 25 Sep 2026 | Secondary |
| Auto-share to followers "if we determine it's performing well based on the views it receives within the first 72 hours"; insights after ~24 h | Meta launch wording via SocialBee/Buffer | Secondary |
| API: `trial_params.graduation_strategy` = MANUAL or SS_PERFORMANCE | Meta developer docs (in the 13 Oct note) | Primary |
| Scheduling of trials since Apr 2026 | SMT, Apr 2026 (17 Oct note) | Secondary |
| Daily cap: Help Center states none; reports range from **~5/day** (2025–26 creator reports) to 20/day (2025); exceeding it can block trials temporarily | SMT 8 Jun 2025; Publer Feb 2026; Social Media Examiner 2026 | Unverified; irrelevant at 2–3/week |
| **Correction to the 17 Oct note:** Instagram's figure is "40 % of creators started posting reels more often and **of those, 80 % saw an increase** in reels reach from non-followers", not "+80 % non-follower reach" | SMT, 8 Jun 2025 | Primary figure, quoted. Company-reported, self-selected |
| CreatorHouse (one 4.2k account, 10 trial vs 10 normal Reels, Apr 2026): trial median reach 14,800 vs 6,400 (2.3×), 96 % vs 62 % non-followers, like-to-view 1.4 % vs 4.1 %, **net follows per Reel 12.4 vs 8.8** | creatorhouse.app, May 2026 | (vendor), n = 1, internal inconsistency in its engagement ratio |
| Kapwing (two Reels each posted as trial and regular, Oct 2025): trend Reel 2,258 vs 949 views; product Reel 802 vs 836, regular better on engagement | kapwing.com, 7 Oct 2025 | (vendor), n = 2 |
| Buffer author's own account (early 2025): regular Reels 1.5–5k views, trials ≤ ~180 | Buffer, 24 Feb 2025 | n = 1 |

**Reading [O]:** results are mixed. Trials help when the idea makes sense to strangers and hurt when it needs
context from followers. They don't touch the follower feed, so they are the one way to post more without over-posting
to our followers. Used as a "bench": 2–3 a week, each a genuinely different video (new first 3 s, different
structure or data point, not the same file with a new caption), judged only against other trials (72-h views, sends,
watch time). Graduation: **MANUAL** at first, so the owner decides what reaches followers and the grid (approval rule).
Insider topics (MSP features, our own events) are poor trial material; myth-busters and "guess the time" are good.

## 5. Timing vs cadence

| Evidence | Finding | Label |
|---|---|---|
| PostFast (23,552 posts, 289 workspaces, to 4 Sep 2026) | Naive cross-account comparison: 5.5× swing across hours; **normalised per account: 1.43× total swing**, best local hour 3 PM = 1.20×, every weekday within ±4 %. Hour rankings barely replicate across random halves (rank r ≈ 0.45–0.6). **Format matters far more than hour** | [E] (vendor), impressions |
| Buffer best-time (9.6M posts, Jan 2024–Dec 2025; updated 23 Sep 2026) | Top slots Thu 9 am, Wed 12 pm, Wed 6 pm local; evenings strong; gives **no effect sizes**; says timing "can't save a weak post" | [E] (vendor), ER by followers |
| Later (6M+ posts, Jan–Oct 2024; updated 21 Apr 2026) | Best 3–6 am local (engagement rate) — contradicts Buffer | [E] (vendor), methodology-dependent |
| Mosseri (Threads 28 May 2026) | Timing and competition change reach of the same Reel | [E] |
| Mosseri (older Stories Q&A, undated) | No single optimal time; check Insights, post before followers' peak | [E] unverified date |
| **MSP follower-online curve** (14 Sep–12 Oct 2026, summer time) | 09–12 Prague ~450–515 online; 13–17 h 573–635; **18–22 h 646–689 (peak 29 % at 21:00)**; trough 03–05 h ~13 %. Peak vs afternoon ≈ 1.1–1.2×, peak vs morning ≈ 1.4× | [M] |
| MSP reach geography | Followers US 24 %, DE 11 %, CA 6 %, AU 5 %, CZ 5 %, GB 5 % … | [M] audit |

**Reading [O]:** MSP's international audience makes the online curve flat from early afternoon to late evening,
Prague time. Picking the best hour inside 13:00–22:00 gains at most ~10–20 %, about the size of Buffer's whole
frequency effect on *reach per post* (+12–24 %). Frequency, though, also adds whole extra posts, and a Reel instead of
a carousel can be worth ~1.3–2.4×. So: format > frequency > slot. Keep 19:00–21:00 Prague as the default (catches
Europe's evening and US East afternoon), use ~15:00 Prague for US-centric posts, avoid 01:00–08:00. Re-sample
`online_followers` after the clock changes (25 Oct Europe, 1 Nov US) and in a normal (non-WJPC) month.

## 6. Recommendation for MSP

### 6.1 The weekly plan

| Item | Now (from wk of 26 Oct) | When rule R2 passes | Never / not yet |
|---|---|---|---|
| **Feed posts/week** (incl. the owner's own) | **5** (top of the owner's 3–5 band; 17–22 Oct already ran at 5 in 6 days, and the 3 carousels of 17–19 Oct show no clear drop; the 2 Reels have no insights yet) | 6, then 7 | > 1 feed post/day as a habit |
| of which **carousels** | 3: Mon Weekly Numbers, midweek data story, Sat community | 3–4 | 2 carousels the same day |
| of which **feed Reels** | 1–2 (Reels ≈ 25–40 % of feed posts) | 2–3 | a Reel just to fill a slot |
| **Trial Reels/week** | 2–3, by hand, MANUAL graduation | 3–5 | identical re-uploads; MSP-insider topics |
| **Stories** | 1–3 frames on 5–7 days; event days 5–10 | same | Stories as the reach plan |
| **Spacing** | ≥ 20 h between feed posts; Reel + carousel same day only ≥ 4–6 h apart or event day | same | posts minutes/hours apart |
| **Gaps** | max 2 days without a feed post; never a zero week; keep 2 evergreen drafts | same | |
| **Slot** | 19:00–21:00 Prague default; ±3 h is fine | re-check after DST | holding a ready post for a day to hit a slot |

### 6.2 Decision rules (judged on 4-week blocks, event weeks and giveaways excluded; extends §5.3 of the 17 Oct note)

| Rule | Measure | Act |
|---|---|---|
| **R1 Per-post reach holds** | Median 7-day reach per carousel ≥ 85 % of the previous block | If < 75 %: step back one feed post/week (the extra posts are re-reaching the same followers) |
| **R2 Add a feed post** | R1 holds, weekly net follows ≥ previous block, owner approval fits one sitting, ideas bank ≥ 3 weeks | Add **a Reel** (not a carousel) as the extra post |
| **R3 Reels earn their share** | Over the last 4 feed Reels: median reach ≥ 1.3× the carousel median *or* account non-follower share of reach up ≥ 5 pp in Reel weeks | If neither after 6 Reels: hold Reels at 1/week, fix hooks (skip rate) before adding more |
| **R4 Trials keep going** | After 8 trials: median 72-h views, sends, follows in the trial week | If median < ~300 views and zero worth graduating: pause trials 2 weeks and change the type of idea, not just the hook |
| **R5 Spacing check** | After ≥ 12 carousels each: 72-h reach of posts with another feed post < 24 h before vs ≥ 24 h before | If the "< 24 h" group is < 85 %: enforce ≥ 24 h (or ≥ 36 h for carousels) |
| **R6 Unfollows** | Unfollows/week (Account Center or follower delta) | Up ≥ 50 % with no event: step back one post |

Metrics to add to `tools/insights.ts` [O]: the weekly **account reach split follower / non-follower** (`breakdown=follow_type`
worked in the 13 Oct audit; per-post splits aren't stored in `state.sqlite` yet), 72-h snapshots for every post
(the 17–19 Oct comparison above is weak only because the three posts were measured at different ages), and a
`prev_gap_hours` field per post for R5.

### 6.3 Why 5 and not 7 [O]

- The evidence gives no reason to *avoid* daily posting, but the gain from 5 to 7 is small (Buffer: +6 pp reach per
  post 3–5 → 6–9; Instapect: weekly interactions flatten above 3–7) and the costs are real: two more approved,
  gate-passing posts every week, more same-follower overlap for an account that already reaches about half its
  followers per post, and ideas used up faster than they come in.
- The extra reach we're after is **non-follower** reach. Trial Reels add it without loading the follower feed, so
  "5 feed + 2–3 trials" gives most of daily's reach for less risk and less approval work.

## 7. Open uncertainties

- **No study** measures reach per post by frequency *and* account size, or Reels-only frequency against reach per
  Reel. The verdict on daily Reels rests on Mosseri's statements plus format-level data.
- Cannibalisation evidence is engagement-based (Instapect) or anecdotal (MSP n = 3). R5 will give MSP its own answer in ~3 months.
- Trial Reels: Help Center text only via third parties; daily caps unconfirmed; results vary by idea type (n = 1–2
  studies). Whether trials lift follows for a niche data account is untested.
- SocialTools AI couldn't be fetched (502 on 22 Oct); its numbers come from search excerpts.
- MSP's follower-online curve is from one WJPC-heavy month in summer time.
- Vendor studies dominate; all are correlational except Buffer's within-account models (pooled formats, Aug 2025, no
  2026 re-run).

## Sources (accessed 2026-10-22)

- Socialinsider, Social media reach statistics 2026 (3 Sep 2026, upd. 21 Oct 2026): https://www.socialinsider.io/blog/social-media-reach/
- Socialinsider, Instagram Reels statistics 2026 (24 Jun 2026, upd. 21 Oct 2026): https://www.socialinsider.io/blog/instagram-reels-statistics/
- Metricool, 2026 Instagram study (16 Jun 2026): https://metricool.com/press-release-instagram-study-2026/ ; stats page: https://metricool.com/important-instagram-statistics/
- Metricool, 2026 Social Media Study (10 Dec 2025): https://metricool.com/press-release-2026-social-media-study/ ; secondary on volume: https://www.sotrender.com/blog/2026/08/instagram-reach-is-down-what-the-data-actually-says/
- PostFast, best time to post on Instagram, 23,552 posts (data to 4 Sep 2026): https://postfa.st/blog/best-time-to-post-on-instagram
- SocialTools AI, posting frequency study (~May 2026; 502 on fetch): https://www.socialtoolsai.com/instagram-posting-frequency-study
- Instapect, how often to post, 141 audited accounts (upd. 13 Oct 2026): https://instapect.com/blog/how-often-to-post-on-instagram
- Dash Social, how often to post on Instagram 2026: https://www.dashsocial.com/blog/how-often-should-you-post-on-instagram
- Buffer, how often to post (13 Aug 2025): https://buffer.com/resources/how-often-to-post-on-instagram/
- Buffer, best time to post (upd. 23 Sep 2026): https://buffer.com/resources/when-is-the-best-time-to-post-on-instagram/
- Buffer, Trial Reels with Mosseri quotes (24 Feb 2025): https://buffer.com/resources/instagram-trial-reels/
- Later, best time to post (upd. 21 Apr 2026): https://later.com/blog/best-time-to-post-on-instagram/
- Luan Wise, Mosseri AMA log March 2025 (30 Mar 2025): https://www.luanwise.co.uk/mosseri-ask-me-anything-instagram-updates-march2025
- Instagram, Instagram Ranking Explained (31 May 2023): https://about.instagram.com/blog/announcements/instagram-ranking-explained
- Mashable via Yahoo Tech, carousel second chance (Oct 2024): https://tech.yahoo.com/social-media/articles/why-instagram-carousels-sometimes-start-200811893.html
- @instagramcreators, Stories and fewer unfollows (~Nov 2024): https://www.tiktok.com/@instagramcreators/video/7439109609387838762
- Engadget, multiple Stories reach fix (12 Sep 2025): https://www.engadget.com/social-media/instagram-fixed-an-issue-that-caused-posting-multiple-stories-to-tank-your-reach-184714482.html
- Social Media Today, Mosseri on signals (22 Jan 2025): https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/
- Social Media Today, likes vs sends (26 May 2026): https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/
- Social Media Today, Mosseri ranking series (24 Sep 2026): https://www.socialmediatoday.com/news/instagram-chief-shares-algorithm-insights-and-posting-tips/831326/
- Mosseri, Threads (28 May 2026): https://www.threads.com/@mosseri/post/DY40Kb8iQt-/
- The Social Tea, posting twice a day (21 Jul 2026): https://thesocialtea.beehiiv.com/p/does-posting-twice-on-instagram-in-a-day-reduce-reach
- Social Media Today, Trial Reels results (8 Jun 2025): https://www.socialmediatoday.com/news/instagram-trial-reels-increase-reach-tests/750121/
- Social Media Today, Trial Reels expanded (13 Jul 2025): https://www.socialmediatoday.com/news/instagram-expands-access-trial-reels/752895/
- Publer, Trial Reels guide (5 Feb 2026): https://publer.com/blog/instagram-trial-reels-guide/
- Help Center wording as quoted: https://exemplary.ai/blog/instagram-trial-reels ; https://flowgent.ai/blog/instagram-trial-reels ; https://socialbee.com/blog/how-to-post-trial-reels-on-instagram/
- The Reel Stars, Mosseri on repeated trials (25 Sep 2026): https://www.thereelstars.com/tech/adam-mosseri-reveals-instagram-trial-reels-rule-that-could-limit-your-reach/
- CreatorHouse, 14-day Trial Reels test (May 2026): https://creatorhouse.app/blog/trial-reels-14-day-test-2026
- Kapwing, Trial Reels study (7 Oct 2025): https://www.kapwing.com/resources/instagram-trial-reels-study-what-we-learned-after-a-trial-reel-hit-1-million-views/
- Hootsuite, Stories experiment (pre-Sep 2025): https://blog.hootsuite.com/experiment-number-ig-stories/ ; Reels experiment (2021): https://blog.hootsuite.com/instagram-reels-experiment/
- Virallized (vendor; only source for the Aug 2026 @instagramforbusiness claim): https://www.virallized.com/how-often-to-post-on-instagram
- MSP data: `content/state.sqlite` (media_insights, account_daily, pulled 21 Oct 2026); follower-online curve and countries from `research_notes/MSP Instagram content pipeline/current_ig_account_audit.md`.
