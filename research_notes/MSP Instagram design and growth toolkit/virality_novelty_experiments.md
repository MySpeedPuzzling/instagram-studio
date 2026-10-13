# Virality, novelty and experimentation for @myspeedpuzzling (as of 2026-10-13)

*Scope: (1) shareability/virality mechanics for data and puzzle content, (2) fatigue and novelty management, (3) an experimentation and measurement framework for a ~2.4k-follower account, (4) a puzzle-year calendar, ending with recommendations. Round-1 findings (baseline, pillars, cadence, caption template, API publishing) are assumed and not repeated except where needed as inputs. Internal MSP numbers come from the round-1 notes (IG API audit and production DB queries of 2026-10-13), linked by relative path. Research note: the session's web-search budget ran out after ~40 calls, so some leads (Chartr, The Economist, Statista, The Pudding, GeoGuessr, Czech/UK championship dates, Grafana GA4 plugin) could not be followed and are listed as gaps.*

## 1. What makes data and puzzle-niche content spread (case studies and mechanics)

### Takeaway
The best-evidenced sharing drivers are high-arousal positive emotion (awe, surprise, amusement), interest and practical utility (Berger & Milkman), plus identity and comparison (Wrapped-style personal data) and collective goals (Duolingo, Strava). For charts specifically, "one clear chart + one takeaway headline" is what travels (Our World in Data). Distinctive, colourful charts with recognisable objects and strong titles are also remembered better than generic bar charts (Borkin et al.). In the puzzle niche, discovery has been driven by timelapse/speed videos from creators and by championship coverage, not by static charts. No evidence was found of a static puzzle-data post going viral.

### Cited Findings
**Academic evidence on sharing and memorability**
- In an analysis of all New York Times articles over three months plus experiments, content evoking **high-arousal positive (awe) or negative (anger, anxiety) emotions was more viral**, while low-arousal content (sadness) was less viral. Positive content was generally more viral than negative. The arousal effect held even after controlling for how **surprising, interesting or practically useful** content was, and each of those was also positively linked to virality. — [Berger & Milkman, JMR 2012 (postprint)](https://www.blueclaw.co.uk/aboutama/documents/jmr_forthcoming/online_content_viral.pdf)
- A Norwegian replication found high-arousal emotions, **social currency and practical usefulness** present to a high degree in shared news content, though its results were not identical to the original. — [University of Oslo (DUO)](https://www.duo.uio.no/handle/10852/49755)
- Across 2,070 single-panel visualizations, memorability was consistent across viewers. **Colour and human-recognisable objects** increased memorability, and **common chart types were less memorable than unique ones**. — [Borkin et al., IEEE InfoVis 2013](https://vcg.seas.harvard.edu/publications/20130101-what-makes-a-visualization-memorable)
- A follow-up ("Beyond Memorability") found that visualizations with **effective titles and text annotations** were recalled more accurately and their main point was grasped more easily. Pictograms did not distract viewers. — [Storybench interview on the follow-up](https://www.storybench.org/?p=3569)

**Data publishers**
- Our World in Data launched "Data Insights" (March 2024), a format of one chart, a takeaway title and a short explanation, because "from our experience of communicating our work on social media, including X/Twitter and Instagram, we know that **a clear chart and takeaway** is one of the most successful ways our work is shared." — [OWID: We're launching Data Insights](https://ourworldindata.org/launching-data-insights)
- Visual Capitalist launched Voronoi, a mobile "facts not opinions" platform, at the end of 2023. It publishes monthly roundups of the most popular, most discussed and most liked visualizations of the month, which recycles proven winners as new content. — [Visual Capitalist: Voronoi launch](https://www.visualcapitalist.com/visual-capitalist-new-app-voronoi/); [Visual Capitalist: best visualizations of June](https://visualcapitalist.com/best-visualizations-of-june-voronoi-app/)

**Wrapped-style recaps (identity, comparison, collective milestones)**
- Spotify Wrapped 2025 (released 3 Dec 2025) reached **200M+ engaged users in the first 24 hours**, 19% more than the previous launch, which had taken 62 hours to reach 200M. Spotify counted **500M+ shares, up 41%**, and that figure includes screenshots and downloads as well as native shares. These are company figures. — [TechCrunch, 4 Dec 2025](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day); [Music Week](https://www.musicweek.com/digital/read/spotify-wrapped-2025-was-biggest-ever-with-200-million-engaged-users/093178)
- Strava's 12th Year in Sport report (early Dec 2025) paired platform-wide collective numbers (**14 billion kudos, +20%**; 7.6M segment/course records; 54% of users cross-training) with a survey of 30,000+ people. Its headline thesis, "doomscrolling is out, movement is in", was a press-ready cultural framing that cycling and regional outlets picked up. — [Strava press release via Webull](https://www.webull.com/news/13961203642123264); [BikeRadar](https://www.bikeradar.com/news/strava-year-in-sport-2025)

**Brand case studies (mechanics, mostly weakly quantified)**
- Duolingo's "Death of Duo" (Feb 2025) combined a narrative stunt with an **in-app collective goal**: users could "revive" the mascot by earning XP, with a 50-billion-XP target. Tracksuit brand-funnel data showed consideration up 6 points, but over a window ending January 2025, so it may not capture the campaign. A marketing podcast claims 1.7B impressions in two weeks; this is unaudited. No official Duolingo result was found. — [MediaPost](https://www.mediapost.com/publications/article/403787/duolingos-mascot-killing-stunt-generated-engageme.html); [NPR, 26 Feb 2025](https://npr.org/2025/02/26/nx-s1-5309785/duolingo-owl-mascot-lives); [Jawbreaker podcast (weak)](https://jawbreaker.transistor.fm/episodes/when-marketing-goes-dark-the-wild-resurrection-of-duolingos-beloved-owl-duo)
- Chess.com's social approach, inferred from job postings rather than performance data: a Nov 2025 "Social Growth Specialist" role exists to create "timely, witty content connecting chess culture to trending social and cultural moments", using memes and video replies. A 2023 report says the company let college students run irreverent, meme-heavy social accounts and, from 2020, hosted tournaments with influencers who had large young followings. — [Chess.com job posting (Rippling)](https://ats.rippling.com/chess/jobs/bbcea94e-d18b-489b-a232-f185c4161bf6); [AFR, 2023](https://www.afr.com.au/life-and-luxury/arts-and-culture/how-chess-became-the-latest-teenage-fad-20230501-p5d4nq)

**Puzzle niche**
- USA Jigsaw Nationals grew from 33 teams, 93 pairs and 99 individuals in 2022 to about **200 teams, 400 pairs and 800 individuals in 2026** (Atlanta, 27–29 Mar 2026). The journalist discovered speed puzzling through **Instagram timelapse videos**. One 2026 competitor found the hobby through a **TikTok of a creator's appearance at WJPC 2024**. The leading creator, Karen Puzzles, has 550k+ followers across YouTube and Instagram and posts since 2018. — [The Independent via AOL, 30 Mar 2026](https://www.aol.com/articles/piece-piece-inside-rapid-rise-140501949.html)
- The same creator's YouTube channel has some videos above 1M views, and she credits a **24,000-piece puzzle video** (an extreme-scale "how long does it take" format) with growing the channel. — [Scripps national news](https://www.news5cleveland.com/news/national/meet-the-woman-who-turned-finishing-puzzles-into-her-whole-career)
- A video of participants speed puzzling reached about **22M views** (year unclear), and USAJPA livestreams drew "tens of thousands of viewers". — [MIT Alumni Association](https://alum.mit.edu/slice/mit-alum-holds-guinness-record-speed-jigsaw-puzzling) (via round-1 notes)
- Euronews covered WJPC 2026 (about 1,700 people from 70 countries). Its hooks were **secrecy and spectacle**: the final puzzle is kept secret and goes on sale the day it is used. — [Euronews, 21 Sep 2026](https://www.euronews.com/2026/09/21/who-can-solve-it-fastest-speed-puzzlers-race-against-the-clock-at-world-championships)
- MSP's own evidence: the weekly recap carousels were the **most-shared non-giveaway format** (161 shares across 29 recaps; the top five non-giveaway posts by shares were all recaps at 8–12 each). This is plausibly because featured puzzlers shared them. Participatory posts (comment-to-enter, guess-the-feature) reached 2.5–5× the median. — [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)

### Inferences
- **Mechanic map for MSP data posts.** Each idea should carry at least one strong mechanic, and the brainstorm step should label it:
  - **Surprise/awe:** scale facts such as "275M pieces = …" or a counter-intuitive myth-buster.
  - **Identity/social currency:** "this is so me" facts like the Sunday puzzler or the edge-first type.
  - **Personal comparison:** "where does your 500-piece time rank?" with percentile bands.
  - **Utility:** benchmarks, "what's a good time", event calendars.
  - **Debate:** two camps, comment your side.
  - **Tag/send-a-friend:** a fact about a recognisable puzzler archetype.
  - **Collective milestone:** "we're about to pass 300M pieces".
  - **Humour:** puzzle-life truths.
- Generic "top 10 bar chart" weekly content is the least memorable type by Borkin's evidence. Puzzle-piece pictograms, colour, a takeaway headline and annotation on the chart are cheap memorability upgrades.
- The puzzle niche spreads through **video of humans doing remarkable things** (timelapses, races, scale), not through numbers. MSP's data can supply the narration ("this solve was faster than 99% of 545k logged results"), but the viral vector in this hobby has historically been motion.
- Wrapped and Strava show that **identity sharing happens when users post their own personal card**. MSP's own account post is the collective version. The personal version needs a share card generated on myspeedpuzzling.com (round 1 already proposed this).
- The Duolingo/Strava pattern of a **collective goal tracked publicly** maps directly onto MSP's running totals (pieces, solves, countries).

### Gaps
- No primary evidence (talks, blogs, retrospectives) was retrieved for **Chartr/Sherwood, The Economist, Statista, The Pudding or GeoGuessr** Instagram mechanics. The search for Chartr returned nothing relevant, and the search budget ran out before the others could be tried.
- No view counts were found for specific speed-puzzling Instagram Reels, and no evidence was found that "edges first?"-type debate posts outperform in this niche. Debate is supported only by the general arousal/social-currency literature.
- Strava's and Spotify's share figures are company-reported and unaudited.

## 2. Static vs video in 2026: odds of reaching non-followers, how carousels spread, Trial Reels, what "viral" means at 2.4k

### Takeaway
For accounts under 10k followers, 2026 data shows Reels reaching about three times as many non-followers as carousels, while images and carousels hold their own with existing followers and on interaction rate. Static carousels can spread through sends, reposts and tagged people resharing, but their odds of a large breakout are structurally lower. Trial Reels are the cheapest way to buy non-follower tests. For MSP, a realistic "viral" bar is about 10× median reach (~9,000 accounts); the account has never exceeded about 4.8× (the WJPC giveaway at 4,357).

### Cited Findings
- **Fanpage Karma (3M+ posts, Jan–Apr 2026).** Median reach per follower for accounts **under 10k followers: Reels 4.9%, image posts 3.5%, carousels 2.6%**. Reels reach "nearly three times as many non-followers" as carousels in this band. Within the existing community, images narrowly lead (2.1% vs 2.0% for Reels). Interaction rate under 10k: **images 0.51% vs Reels 0.34%**. The vendor notes these are correlational. — [Fanpage Karma](https://www.fanpagekarma.com/insights/instagram-format-reach/)
- **Buffer (Jan 2022–Oct 2024).** Reels got 36% more reach than carousels, and carousels earned about 12% more engagement than Reels (per search summary of Buffer's analysis). — [Buffer](https://buffer.com/resources/instagram-reach-engagement-analysis/)
- **Mosseri's ranking signals.** In January 2025 Mosseri named watch time, likes per reach and **sends per reach** as the top signals. Sends matter more for non-follower reach and likes more for followers. A widely repeated "sends weigh 3–5× likes" figure has **no primary source** found. — [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/); [Socialync (paraphrase, explicitly no verified quote)](https://www.socialync.io/blog/adam-mosseri-shares-instagram-algorithm-2026)
- **Carousel "second chance".** Several practitioner guides say Instagram may re-serve an unswiped carousel later, starting on slide 2, so slide 2 must work as a standalone entry point. They attribute this to a Search Engine Journal write-up, not an Instagram primary source; treat it as weakly sourced. — [Stack Influence guide](https://stackinfluence.com/what-are-instagram-carousels-2026-guide/)
- **Reposts.** Instagram launched reposts of public feed posts and Reels to followers' feeds in August 2025, with an optional note. Reposts link back to the original creator, and their likes, comments and views count toward the original post. A reposted post can reach the reposter's followers who don't follow the original account. — [PhoneArena](https://www.phonearena.com/news/instagram-brings-reposts-to-main-feed-in-bid-to-boost-sharing_id172969); [University of Kentucky CCD](https://ccd.uky.edu/news/instagram-adds-reposts-map-and-new-friends-tab-their-social-media-platform)
- The media insights API exposes `reposts` for FEED, REELS and STORY. — [Meta: Media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- **Trial Reels (how they work).**
  - Rolled out globally to professional accounts in December 2024.
  - Shown only to non-followers.
  - Option to "share to everyone automatically" if the reel performs well **within the first 72 hours** (threshold undisclosed), or to share manually later.
  - Insights (views, likes, comments, shares) within about 24 hours.
  
  — [Sprout Social, 28 Mar 2025](https://sproutsocial.com/insights/instagram-trial-reels/)
- Kapwing says up to 20 Trial Reels can be posted per day and that Trial Reels cannot be boosted. — [Kapwing, 7 Oct 2025](https://www.kapwing.com/resources/instagram-trial-reels-study-what-we-learned-after-a-trial-reel-hit-1-million-views/)
- **Kapwing's tiny test** (two Reels, each posted as Trial and as regular):
  - The trend Reel got **2,258 trial vs 949 regular views**, with equal likes, so the like rate was about 0.7% on the trial vs about 1.6% on the regular post.
  - The product Reel did better as a regular post on every metric.
  - A separate Trial Reel of theirs reached about 1.3–1.4M views, 130 follows and 290 link taps; the article gives inconsistent figures.
  
  — [Kapwing](https://www.kapwing.com/resources/instagram-trial-reels-study-what-we-learned-after-a-trial-reel-hit-1-million-views/)
- Meta reportedly analysed **400k+ creators** before and after their first Trial Reel: 40% then posted Reels more often, and 80% of those increased non-follower reach. This was found only in secondary creator guides; it could not be verified, and the claimed confound controls are unclear. — [Publer guide](https://publer.com/blog/instagram-trial-reels-guide/); [creator blog](https://reshmashaji.com/blog-instagram-trial-reels-complete-guide/)
- Eligibility claims of "1,000+ followers" for Trial Reels come only from secondary blogs. — [PostEverywhere](https://posteverywhere.ai/blog/what-are-instagram-trial-reels)
- **Native variant testing.** Meta's native A/B tool for testing up to **four captions or thumbnails** on a reel is documented for **Facebook**, not Instagram. No source confirmed a native Instagram feed-post A/B tool. — [PYMNTS](https://pymnts.com/?p=1628882); [Sprout Social](https://sproutsocial.com/insights/instagram-trial-reels/)
- **MSP baseline for scaling "viral".**
  - Median reach per regular post: 901.
  - Best post: the WJPC 2026 giveaway (reach 4,357, ~70% non-followers, 62 shares, 60 follows).
  - Recap carousels by month: Jan–Mar 2025 ~900–1,350, Apr–Jun 2025 ~550–1,100.
  - Median shares 2, saves 1, follows 1 per post.
  - Views/reach ≈ 2.8, because carousels count multiple slide views.
  
  — [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)

### Inferences
- MSP's median reach (901 on 2,405 followers ≈ 37% of followers) is roughly 14× Fanpage Karma's median carousel reach-per-follower for small accounts (2.6%). The community is unusually engaged with the account, so the baseline is a high bar for "lift", and most posts are already reaching mainly followers.
- **Proposed "virality" tiers** (relative to a rolling 12-post median reach):
  - **Breakout:** ≥3× (~2,700).
  - **Viral (MSP scale):** ≥10× (~9,000) with ≥50% non-follower reach.
  - **Hit:** ≥30× (~27,000).
  
  On current evidence, a static data carousel reaching "viral" is plausible only with a giveaway, a collab with a larger account, or heavy sends/reposts by tagged players. A Trial Reel is the most likely path to the "hit" tier, but expect most Reels to land below the carousel median.
- **Use reach, not views, as the denominator.** Carousel views are inflated by slide swipes (~2.8 views per reached account at MSP).
- **Design every carousel for sends:** a slide 1 hook, a slide 2 that stands alone (re-serve), a "send this to…" final slide, and the data source on the last slide.
- **Reposts and tagged players are MSP's best static distribution.** The recap's share record suggests that featuring identifiable people is what made static data travel.

### Gaps
- No independent data was found on the share of carousel reach that comes from non-followers specifically for data/infographic accounts.
- Instagram's threshold for Trial Reel auto-share is not published.
- Whether the API `shares` metric counts DM sends only, or also Story reshares, is not documented on the page retrieved.
- Current Trial Reel eligibility rules (any follower minimum) are unverified. MSP should simply check the toggle in the app.

## 3. Fatigue and novelty management

### Takeaway
Attention to novel items decays predictably (Wu & Huberman), and MSP's own weekly recap shows the pattern. It was strong in its first ~12 weeks (Jan–Mar 2025), then reach and engagement sagged (Apr–Jun) while the template, length and topic stayed fixed. Evidence for specific rotation rules is mostly practitioner heuristics, so MSP should treat rotation as a designed system with explicit caps, a novelty budget and measured fatigue triggers, not as intuition.

### Cited Findings
- On Digg (~1M users), collective attention to a news item rises quickly and then decays, modelled with a single **novelty factor** following a stretched-exponential decay with a natural time scale. The front-page half-life was about 69 minutes. A follow-up argues the best ranking strategy depends on the novelty-decay rate. — [Wu & Huberman, PNAS 2007 (arXiv)](https://arxiv.org/pdf/0704.1158); [Wu & Huberman 2008](https://arxiv.org/pdf/0802.0483)
- **MSP recap decline.**
  - The first recap (Jan 2025) reached 1,355.
  - Recaps fell from ~900–1,350 in Jan–Mar 2025 to ~550–1,100 in Apr–Jun 2025.
  - Eight Mar–Jun 2025 recaps were among the account's lowest-ER posts (5.6–6.5%), and three Apr–May recaps were among the lowest-reach posts (556–601).
  - Recap captions had a median of 1,745 characters.
  - The series stopped in Aug 2025.
  
  — [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)
- In paid social, creative fatigue is diagnosed as rising frequency paired with declining engagement, and practitioners plan refreshes ahead of predicted fatigue dates. This is ad-world heuristics, not organic evidence. — [Dotidot](https://www.dotidot.io/post/creative-fatigue-facebook-ads-how-to-fix-it-fast)
- A creator-marketing analysis of about 1,000 posts recommends series-style storytelling while swapping in new voices and remixing the angle on the same subject. Its methodology is not visible. — [JoinBrands newsletter](https://newsletter.joinbrands.com/p/we-analyzed-1-000-posts-here-s-what-you-should-stop-doing-0cb9eb39856cd805)
- Visual Capitalist keeps one recurring container (the monthly "best of" roundup) whose contents are always new and selected by audience response. — [Visual Capitalist](https://visualcapitalist.com/best-visualizations-of-june-voronoi-app/)
- Spotify Wrapped and Strava's Year in Sport are **annual** rituals. Scarcity (once a year) is part of their design, and Strava frames each edition around a new cultural thesis. — [TechCrunch](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day); [Webull/Strava PR](https://www.webull.com/news/13961203642123264)
- The account-level API exposes `follows_and_unfollows`, and Story `navigation` breaks down into TAP_FORWARD, TAP_EXIT, TAP_BACK and SWIPE_FORWARD. Both are usable as fatigue signals. — [Meta: User insights](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights); [Meta: Media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)

### Inferences
- **Proposed rotation system** (heuristics, to be validated by MSP's own data):
  - **Series run in "seasons" of 8–12 episodes**, then get a visible retool: a new visual skin, a new segment or a new hook format. The 12-week mark is where the 2025 recap started declining.
  - **One fixed container, rotating segments.** Example: the Weekly Numbers keeps 3 fixed slides plus 2 slides drawn from a pool (a guess-the-number slide, a puzzle-of-the-week, a country spotlight, a brand duel, a "this week in 2025") so no two consecutive weeks look identical.
  - **Per-pillar caps:**
    - The Weekly Numbers: at most 1 per week.
    - Same template/chart type: not in two consecutive posts, and at most 2 in any 7-day window.
    - Giveaways: at most 3 per year, event-tied.
    - Same featured player: no more than once per ~6 weeks unless they set a record.
    - Product posts: at most 2 per month.
  - **Novelty budget: about one in three feed posts tests something new** (a new template, mechanic or topic), plus unlimited Trial Reels, which don't touch followers' feeds. Track "novelty spent" per month in the editorial plan.
- **Fatigue triggers for a series** (computed per episode at +7 d):
  - Rolling 4-episode median of likes/reach **or** sends/reach falls below 75% of the series' first-4-episode median **while non-series posts in the same weeks did not fall comparably**. This difference-in-differences check guards against blaming the series for seasonality or account-wide algorithm shifts.
  - Story TAP_FORWARD+TAP_EXIT share rising on series Stories.
  - An unfollow uptick on series days.
  - Any two of these trigger a retool. One trigger means watch.
- **Freshness levers that cost the pipeline nothing:**
  - Vary the protagonist (a country, brand, puzzle, piece count, or a featured player with consent).
  - Vary the question format (guess / rank / spot the outlier / this-or-that).
  - Vary the chart grammar (map, dot plot, waffle of pieces, timeline, small multiples).
  - Vary the time frame (week, month, all-time, "one year ago").
- **Keep annual rituals scarce:** MSP Wrapped once a year, "Puzzle Day by the numbers" once a year. Scarcity is part of why they work.

### Gaps
- No peer-reviewed or large-sample study of organic Instagram series fatigue (episode-over-episode decay) was found.
- The 2025 recap decline is confounded: spring/summer seasonality, very long captions, account-wide reach changes and a static template all coincide, and per-post non-follower share is not available for 2025.
- No evidence was found on an optimal season length or novelty ratio. The 8–12 episode and one-in-three figures are reasoned heuristics, not findings.

## 4. Experimentation for a small account

### Takeaway
At ~900 reach and a median of 2 shares, 1 save and 1 follow per post, count metrics are too sparse to detect anything but very large effects within weeks. Ratios with more events (likes/reach) and reach itself can show about 2× differences within 4–6 posts per arm, while 20–30% effects need 20–40+ posts per arm. A practical framework is:

- A pre-registered hypothesis log.
- Alternating designs (ABAB across matched weeks) with fixed stopping rules.
- Post-level medians with simple sign tests or Bayesian intervals.
- Trial Reels as the only near-randomised test bed.
- Treating early "wins" as provisional.

### Cited Findings
- Repeatedly checking significance and stopping when p<0.05 inflates false positives. In Evan Miller's example, a do-nothing change gave a "significant" result **26.1% of the time**. To keep a true 5% level with 10 interim looks you need a nominal 1.0% threshold. Remedies: **fix the sample size in advance**, use a sequential design with pre-set checkpoints, or use a Bayesian design. Rule of thumb: n ≈ 16σ²/δ². — [Evan Miller, "How Not To Run an A/B Test"](https://www.evanmiller.org/how-not-to-run-an-ab-test.html)
- Kapwing's Trial-vs-regular test shows that **ratios depend on audience mix**: the same Reel had a ~0.7% like rate shown to non-followers vs ~1.6% to followers. — [Kapwing](https://www.kapwing.com/resources/instagram-trial-reels-study-what-we-learned-after-a-trial-reel-hit-1-million-views/)
- Fanpage Karma notes that a leading format "does not mean every individual post will outperform" and that its results do not prove causation. — [Fanpage Karma](https://www.fanpagekarma.com/insights/instagram-format-reach/)
- Buffer's fixed-effects approach compares each account with its own baseline, the same logic MSP should use. — [Buffer](https://buffer.com/resources/how-often-to-post-on-instagram/) (via round-1 report)
- MSP baselines, which set the noise floor:
  - Median reach 901 and ER 8.5%.
  - 61 likes and 2 comments per post.
  - **2 shares, 1 save, 1 follow** per post (median across 71 posts).
  - Recap reach ranged 550–1,355.
  
  — [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)
- Media insights data can be **delayed up to 48 hours**, are stored up to 2 years, and Story metrics exist only for 24 hours. — [Meta: Media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)

### Inferences
**Sample-size arithmetic** (my calculations, 80% power and two-sided α=0.05; assumptions stated):
- **Reach** is roughly log-normal. Assuming a per-post log-SD of ~0.3 (consistent with the recap range of 550–1,355; MSP should compute its own):
  - A **2× difference** in median reach needs about **4 posts per arm**.
  - A **+30%** difference needs about **20 per arm**.
  - A **+15%** difference needs about **70 per arm**, which is not realistic.
- **Shares/sends** at ~2 per post (Poisson, best case):
  - Detecting a doubling needs about **12 posts per arm**.
  - Detecting +50% needs about **40 per arm**.
  - Real data are overdispersed: one tagged player resharing can add 10 shares. Treat these as lower bounds.
- **Saves and follows** at ~1 per post are effectively untestable post-by-post. Aggregate them by month or pillar only.
- **Likes/reach** (~6.8%) has small within-post noise (binomial SE ≈ 0.8 points at 900 reach). Between-post variation dominates, so expect to need about 6–10 posts per arm for ~25% differences.

**Design**
- **ABAB alternation across matched slots.** For example, "short caption vs long caption" alternates on the same weekday slot for 8 weeks, which balances seasonality and account-wide drift.
- **Analyse with a paired sign test:** B beats A in **≥7 of 8 pairs** gives one-sided p≈0.035, and 6 of 6 gives one-sided p≈0.016. 5 of 6 (one-sided p≈0.11) is "promising, keep testing", not a conclusion.
- **Bayesian alternative:** treat each post's ratio as one observation. Report the probability that B's median exceeds A's (bootstrap over posts), and act at ≥90% only after the pre-set number of posts.

**Pre-registration (hypothesis log)**
- Each test gets one line before it starts:
  - Hypothesis and mechanism.
  - Primary metric (one only).
  - Arms.
  - Fixed n per arm.
  - Stop date.
  - What we'll do if A wins, B wins, or no difference.
- No peeking-based stopping.
- Run at most **one feed-level test at a time** (with 3 posts/week, two concurrent tests confound each other). Trial Reel tests can run in parallel.

**Primary metric by goal**
- **Discovery:** sends/reach and non-follower reach (account-level daily `reach` by `follow_type`).
- **Resonance with followers:** likes/reach.
- **Reference value:** saves/reach (pillar-level only).
- **Growth:** follows per week, not per post.
- **Website:** UTM sessions and sign-ups per week.

**Avoiding false learnings**
- **Regression to the mean:** the post after a hit will usually look worse. Don't "fix" it.
- **Novelty bump:** the first 1–2 episodes of any new format get a curiosity lift, so judge a new format on episodes 3–6.
- **Event confounding:** exclude event weeks (WJPC, Nationals, giveaways) from format tests, or tag them and stratify.
- **Audience-mix confounding:** a post that broke out to non-followers will show lower likes/reach. Don't call it a loser on that ratio.
- **Topic vs format:** test a format by holding the topic constant (the same data story in carousel vs single image vs Reel), not by comparing different stories.
- **Base-rate honesty:** label any conclusion drawn from fewer than the pre-set n as "anecdote", and re-test learnings every ~6 months, since the algorithm moves.

**Trial Reels as the A/B bench.** Post 2–3 hook/cover/length variants of the same data story as Trial Reels. Compare 72-hour views and shares (all arms see a similar non-follower audience), then promote the winner to everyone. This is the closest thing to randomisation available.

### Gaps
- No small-creator-specific experimentation literature with real Instagram variance data was found. The variance assumptions above should be replaced with MSP's own 58-post history once the pipeline's `state.sqlite` holds it.
- Native Instagram A/B testing for feed posts or Reels captions/thumbnails was not confirmed; only the Facebook tool was documented.

## 5. Measurement stack (local store, Grafana, UTM/GA4) and the weekly one-person dashboard

### Takeaway
Keep per-post insights in a local SQLite file (round 1's `state.sqlite`) as the system of record, and read it in Grafana through the SQLite datasource. Prometheus suits only a few account-level gauges; per-post data is sparse and high-cardinality. The API gives per-post reach, shares, saves, follows, profile visits and reposts, but **no per-post follower/non-follower split**: that exists only at account level per day. Instagram → website traffic needs lowercase UTM tags on every link, because in-app browsers often land as "direct".

### Cited Findings
**Instagram API**
- Media insights available:
  - FEED: `reach`, `views`, `likes`, `comments`, `saved`, `shares`, `reposts`, `follows`, `profile_visits`, `profile_activity`, `total_interactions`.
  - REELS: also `ig_reels_avg_watch_time`, `reels_skip_rate` (estimated, in development) and `crossposted_views`.
  - STORY: `navigation`, `replies` and `link_clicks`.
  - Breakdowns exist only for `profile_activity` (`action_type`, incl. BIO_LINK_CLICKED) and Story `navigation`. **No `follow_type` breakdown** is listed for media.
  - Album children have no insights, `impressions` is deprecated for media after 2 July 2024, data can lag 48 hours, and Story metrics expire after 24 hours.
  
  — [Meta: Media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- Account-level metrics (daily, `total_value`):
  - `reach`, with breakdowns `follow_type` (FOLLOWER / NON_FOLLOWER / UNKNOWN) and `media_product_type`.
  - `views` (follower-type breakdown; the doc's naming is inconsistent).
  - `follows_and_unfollows`.
  - `profile_links_taps` (`contact_button_type`).
  - `shares`, `saves`, `reposts`, `accounts_engaged`, `total_interactions`.
  - `online_followers` for the last 30 days.
  - Breakdowns apply only with `metric_type=total_value`. — [Meta: User insights](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)

**Grafana**
- The SQLite datasource (`frser-sqlite-datasource`) is at v4.0.6 (updated 13 May 2026).
  - The DB file must be on the **filesystem of the Grafana host**; remote databases don't work directly.
  - Time is stored as strings/numbers, and the plugin can infer timestamps for time series.
  - ATTACH is disabled by default.
  - Permission errors under systemd are a known pitfall.
  
  — [Grafana plugin page](https://grafana.com/grafana/plugins/frser-sqlite-datasource/); [Grafana community](https://community.grafana.com/t/grafana-cant-open-sqlite-datasource-citing-permissions-but-will-work-when-db-is-opened-in-a-separate-command-line-session/114868)
- The Infinity datasource (v4.1.1, updated 5 Oct 2026, maintained by Grafana Labs) visualises **JSON, CSV, XML, GraphQL and HTML** endpoints. Alerting, recorded queries and public dashboards require the **backend parser**. — [Grafana plugin page](https://grafana.com/grafana/plugins/yesoreyeram-infinity-datasource/)

**GA4 and UTM**
- Instagram's in-app browser often drops the referrer, so visits land as (direct)/(none); sources disagree on the exact mechanism. UTM-tag every link; use `utm_content` (e.g. `bio-link`) to tell placements apart.
- GA4 treats "Instagram" and "instagram" as different sources, so keep values lowercase.
- Sources disagree on `utm_medium` ("social" vs "organic"). Pick `social` so traffic groups under Organic Social, and stay consistent.
- Instagram's own bio-link metric is only aggregate taps.
- GA4's default attribution lookback (30 days acquisition / 90 days other key events) can lose late conversions.

  — [link.boo guide](https://link.boo/guides/instagram-link-click-tracking); [Ruler Analytics](https://ruleranalytics.com/blog/social-media/track-instagram-traffic); [Make Influence](https://www.makeinfluence.com/en/academy/why-influencer-sales-dont-show-up-in-google-analytics); [Socialkit](https://socialk.it/en/blog/how-to-track-social-traffic-google-analytics)

### Inferences
**Architecture**
- `pull_insights.py` writes `posts`, `post_insights_snapshots` (at +48 h, +7 d, +30 d) and `account_daily` (reach by follow_type, follows/unfollows, profile_links_taps, online_followers).
- It also writes `experiments` (the hypothesis log) and `post_tags` (pillar, series, season, episode, mechanic, template, chart type, featured-player flag, event flag, test arm).
- Grafana reads the SQLite file via frser. If the DB lives on the laptop and Grafana elsewhere, sync a read-only copy or serve a small JSON endpoint for Infinity.
- Push only 3–5 account-level gauges to Prometheus (followers, 7-day reach, 7-day non-follower reach) if alerting is wanted.
- Log pipeline events (published, failed, insights pulled) to Loki and show them as **Grafana annotations** on account time series, so every spike lines up with the post that caused it.

**Per-post non-follower share**
- Not in the API, so use one of two proxies:
  - Account-level NON_FOLLOWER reach on days with exactly one new post.
  - A manual read from the in-app post insights for the few posts that break out.

**UTM scheme**
- Use `utm_source=instagram`, `utm_medium=social`, `utm_campaign=<pillar>`, and `utm_content=<post-id | bio-link | story-link>`, all lowercase.
- Point the bio link to an MSP landing page (e.g. `/ig`) that lists links for current posts, each tagged with its own `utm_content`. This gives per-post attribution despite the single bio link.
- Pull GA4 sessions and sign-ups by `utm_content` weekly via the GA4 Data API into the same SQLite file, so one Grafana dashboard joins posts to website outcomes.

**Weekly one-person dashboard** (one screen, reviewed in ~10 minutes):
1. Plan adherence: posts shipped vs planned, and weeks with zero posts.
2. Median reach of the last 4 posts vs the rolling 12-post baseline, with a breakout flag at ≥3×.
3. Sends/reach and likes/reach per pillar (12-week medians), plus a per-series fatigue panel (rolling 4-episode median indexed to the first 4 episodes).
4. Account non-follower reach share (7-day) and net follows (follows − unfollows) per week.
5. Bio/Story link taps → UTM sessions → sign-ups (weekly).
6. The open experiment: arm, n so far vs pre-set n, and result shown only after completion.

### Gaps
- Whether a maintained Grafana GA4 datasource plugin exists in Oct 2026 was not checked; the search budget ran out. The GA4 Data API → SQLite route avoids depending on one.
- Whether API `shares` includes Story reshares is undocumented.
- Exact `views` breakdown naming (`follower_type` vs `follow_type`) is inconsistent in Meta's doc and must be tested against the live API.

## 6. Interactive and participatory formats

### Takeaway
Participation is MSP's proven reach multiplier: contests and guess posts reached 2.5–5× the median and got 40–180× the comments. Collab posts reliably lift reach for the smaller partner, and Emplifi's H1 2026 data shows collabs generating more shares across every vertical. The risk is engagement bait: Meta has demoted "tag/vote/comment/share baiting" since 2017, and Instagram's recommendation guidelines exclude giveaways and engagement bait from recommendations. Genuine, specific questions ("drop your 500-piece PB") are not bait. No rigorous benchmarks for Story stickers were found.

### Cited Findings
- **Collab posts.**
  - **Emplifi** (520,198 posts and accepted collaborations across 3,791 Instagram profiles, 1 Jan–30 Jun 2026): collab posts outperform standard brand posts on organic engagement, Reels gain most, and collabs generate more shares and reposts in every vertical. — [Emplifi](https://emplifi.io/resources/instagram-collaborations-boost-organic-engagement/)
  - **Academic study** (100 collab posts): collab reach is **not additive**. It tracks a weighted average of the partners' individual reach, so mainly the **smaller account benefits**. — [Schöttl, HSTalks journal article](https://hstalks.com/article/11245/download/)
- **Engagement bait.**
  - Facebook (Dec 2017) began demoting **vote, react, share, tag ("Tag a friend who…") and comment baiting**, with stricter demotions for Pages that do it repeatedly. Posts asking for help, advice or recommendations were exempt. — [CNN, 18 Dec 2017](https://money.cnn.com/2017/12/18/technology/facebook-spam-posts/index.html)
  - Instagram's Recommendation Guidelines exclude contest/giveaway promotion and engagement bait from recommendations. — [Instagram Help Center](https://help.instagram.com/313829416281232) (as cited in round 1; the page did not render on re-fetch)
  - Instagram says an earnest, specific ask is not engagement bait. — [Social Media Today](https://www.socialmediatoday.com/news/instagram-clarifies-advice-on-single-word-ctas-and-longer-reels/718151/) (round 1)
- **Questions.** Posts with a question got **36.7% more comments**, and comment-focused CTAs got 202.8% more (correlational). — [Metricool 2026 study](https://metricool.com/press-release-instagram-study-2026/) (round 1)
- **Story stickers.** No measured benchmark for poll or quiz participation rates was found. Practitioner guides rank polls and quizzes as low-friction and question stickers as higher-friction. The API cannot add poll, link or location stickers. — [view-ig-story guide](https://www.view-ig-story.com/blog/instagram-story-poll-quiz-question-stickers); [round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md)
- **MSP evidence.**
  - Participatory posts (comment-to-enter, guess-the-feature) reached 2.5–5× the median and got 40–180× the median comments.
  - Three contest posts produced 43% of all follows attributed to 2025+ posts.
  - The WJPC giveaway reached ~70% non-followers.
  
  — [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)
- **Collective goals.** Duolingo's revival campaign tied social attention to an in-app collective XP goal. — [MediaPost](https://www.mediapost.com/publications/article/403787/duolingos-mascot-killing-stunt-generated-engageme.html)

### Inferences
**Ranked participatory formats for MSP** (lowest effort and risk first):
1. **Guess-the-number carousels.** "Guess the median 1,000-piece time" with the answer on the last slide. This rewards swipe-through and drives comments with guesses, and it isn't bait because the question is real.
2. **Comment-your-PB prompts** tied to a data post: "here's the community distribution, where are you?"
3. **This-or-that debates** with data ("edges first: 62% of our top-100 say yes", only if MSP has such data; otherwise a Story poll and then a results post). The results post is a second piece of content from the same idea.
4. **Monthly community challenge**, e.g. "log a 500-piece puzzle from a brand you've never tried". The results post shows the collective total, which links IG to logged solves (UTM).
5. **Collective milestone countdowns**, e.g. "we're 2.1M pieces from 300M". Collective, low-risk, repeatable a few times a year.
6. **Collab posts** with event organisers, brands and creators. MSP benefits most when partnering with larger accounts (organisers during events, brands on release days).
7. **Featured-player tagging**, consent-first. Tags notify people, and the recap share record suggests tagged players reshare. Never tag in bulk or for unrelated posts.
8. **Giveaways**: event-tied, 2–3 per year, accepting that their reach comes from participant networks, not recommendations.

**Avoid**
- "Tag 3 friends" or "comment YES" mechanics.
- Like-gated entries.
- Repeated giveaways.
- Polls with no real question.

Phrase sends CTAs as utility ("send this to your puzzle partner before Nationals") rather than generic "share this".

### Gaps
- No rigorous data on Story poll/quiz sticker participation rates, or on whether quiz-style carousels raise sends/reach.
- Instagram's current Recommendation Guidelines text could not be re-fetched to quote verbatim.
- Whether tagging users in carousel images increases recommendation reach, beyond notifications and reshares, is undocumented.

## 7. Puzzle-year content calendar (verified dates and MSP seasonality)

### Takeaway
The anchors are:
- National Puzzle Day (29 Jan; 2027 falls on a Friday).
- The spring national-championship season (USA Nationals were 27–29 Mar 2026; the 2027 dates are not yet published).
- Spain's national championship (June in 2025).
- WJPC in Valladolid in mid-September (2025: 15–21 Sep; 2026: 16–20 Sep).
- The European championship (2026: Istanbul, 27–29 Nov, per Wikipedia only).
- The holiday period, when MSP's own data shows Christmas Eve as the quietest day and New Year's Day as the busiest (+65% vs the same weekday).

September 2026 was MSP's biggest month ever. No reliable "international jigsaw puzzle day" was found.

### Cited Findings
**Fixed days**
- National Puzzle Day: 29 January each year, founded by Jodi Jill (Wikipedia says 1994; other sources say 2002). It covers all puzzle types, jigsaws included. 2026 was a Thursday, and **2027 is Friday 29 Jan**. — [Wikipedia](https://en.wikipedia.org/wiki/National_Puzzle_Day); [timeanddate](https://www.timeanddate.com/holidays/fun/puzzle-day); [trvst](https://www.trvst.world/mind-body/national-puzzle-day/)
- No separate jigsaw-specific international day was found in searches. — [timeanddate](https://www.timeanddate.com/holidays/fun/puzzle-day)

**Championships**
- **USA Jigsaw Nationals 2026:** 27–29 March, Atlanta, with individuals, pairs and teams of four (500 and 1,000 pieces). The pairs division filled in one day. A Chicago Puzzle Club sanctioned event offers early entry to **2027 Nationals**, confirming it is planned, but no 2027 dates were found. — [Discover Atlanta](https://discoveratlanta.com/stories/things-to-do/atlanta-hosts-the-countrys-fastest-puzzle-competition-usa-jigsaw-nationals/); [Chicago Puzzle Club on Ticket Tailor](https://www.tickettailor.com/events/chicagopuzzleclub/2405332); [The Independent via AOL](https://www.aol.com/articles/piece-piece-inside-rapid-rise-140501949.html)
- **WJPC:**
  - 2025: 15–21 Sep, Valladolid, the fifth edition.
  - 2026: 16–20 Sep, Valladolid.
  - All editions have been in Valladolid. The 2022 edition was in June; the others were in September.
  - 2027 dates are unconfirmed; check worldjigsawpuzzle.org.
  
  — [Wikipedia: WJPC](https://en.wikipedia.org/wiki/World_Jigsaw_Puzzle_Championships); [Wikipedia: WJPC 2025](https://en.wikipedia.org/wiki/2025_World_Jigsaw_Puzzle_Championship); [MSP WJPC page](https://myspeedpuzzling.com/en/world-jigsaw-puzzle-championship)
- **European Jigsaw Puzzle Championship** (European Committee for Jigsaw Puzzling): first edition 2025 in Budapest (692 participants, 29 nations); **2026 in Istanbul, 27–29 Nov 2026**. Wikipedia is the only source; it is not confirmed against an official site. 2027 is unknown. — [Wikipedia: EJPC](https://en.wikipedia.org/wiki/European_Jigsaw_Puzzle_Championships)
- **Spain (AEPUZZ):** annual national championship; 2024 and 2025 (21–22 June 2025) in Alcalá de Henares. The Ávila tournament, described as Spain's second-largest by participants, ran 8–9 Aug 2026. 2027 dates are unpublished. — [Xataka](https://www.xataka.com/literatura-comics-y-juegos/hacer-puzzles-tambien-puede-ser-competitivo-existe-campeonato-espana-puzzles-te-puedes-apuntar); [Ávilared](https://avilared.com/art/74387/avila-celebra-el-segundo-campeonato-de-puzzles-mas-importante-de-espana-por-numero-de-participantes)
- **Other events in MSP's database:**
  - 2026 Wisconsin State Jigsaw Puzzle Championship, **23 Oct 2026**, 236 participants listed.
  - WJPC participant lists: 1,181 (2024), 1,070 (2025), 837 (2026).
  - European JPC 2025: 381.
  - The account's best numbers came in the Feb–Mar national-championship season and in September.
  
  — [round-1 MSP data notes](../MSP%20Instagram%20content%20pipeline/msp_data_and_content_ideas.md); [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)

**MSP seasonality**
- Dec 24 is −24% vs the same weekday, Dec 31 +22%, and **Jan 1 +65%**.
- The weekend accounts for 37.8% of solves; Sunday is the top day and Tuesday the lowest.
- **September 2026 was the biggest month ever** (33,198 results, 2,687 active players, 596 new puzzlers).
- The busiest solve dates cluster in mid-April to early May 2026 (unexplained).
- 12 Oct 2026, the XP launch, was the busiest logging day ever (2,890 results, 45% backfilled).

— [round-1 MSP data notes](../MSP%20Instagram%20content%20pipeline/msp_data_and_content_ideas.md)

**Search and buying seasonality (weak evidence)**
- AI-generated market reports citing Google Trends show search interest for wooden/3D/branded jigsaw puzzles peaking in **December** (gift buying) and dropping sharply in January. — [Accio (weak)](https://www.accio.com/business/wood-puzzle-trends)

**"Wrapped season" timing**
- Spotify Wrapped 2025 launched 3 Dec 2025, and Strava's Year in Sport came out in early December 2025. — [TechCrunch](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day); [BikeRadar](https://www.bikeradar.com/news/strava-year-in-sport-2025)

### Inferences
**Draft calendar, Oct 2026 – Sep 2027** (confirm "TBC" items with organisers):

| When | Hook | Content idea (data angle) |
|---|---|---|
| Mid–late Oct 2026 | XP/levels launch aftermath; Wisconsin State Championship (23 Oct) | "Biggest logging day ever"; a US-evening Wisconsin preview/recap with MSP participant stats |
| 25 Oct / 1 Nov | Clock changes | Re-sample `online_followers` (round 1) |
| Nov 2026 | Pre-holiday gift season; **EJPC Istanbul 27–29 Nov (TBC)** | "Most-solved brands/puzzles of 2026" as a gift guide (utility, saves); EJPC preview and results |
| Early Dec 2026 | Wrapped season (Spotify/Strava precedent, first week of Dec) | **MSP Wrapped 2026** community carousel plus personal share cards on the site (UTM) |
| 24–31 Dec | Holiday puzzling | "Christmas Eve is our quietest day, New Year's Day our busiest" (posted ~27–30 Dec); a holiday challenge |
| 1–2 Jan 2027 | Biggest solving day of the year | Live-ish "New Year's Day by the numbers" (posted 2 Jan); "2027 PB goals" comment prompt |
| **Fri 29 Jan 2027** | National Puzzle Day | "Puzzle Day by the numbers": the all-time totals milestone and a collective-goal reveal |
| Feb–Mar 2027 | National championship season; **USA Nationals (spring, TBC)** | Preview stats ("what it takes to win"), results recaps, collabs with organisers |
| Apr–May 2027 | Spring peak (2026's busiest solve dates) | "Spring surge" report; monthly challenge |
| Jun 2027 | Spain national championship (June pattern, TBC) | Country spotlight; a light Spanish-language line |
| Jul–Aug 2027 | Summer; Spanish tournaments (Ávila, Aug) | Lighter cadence, evergreen myth-busters, Trial Reel experiments |
| Mid-Sep 2027 | **WJPC Valladolid (TBC)**; historically MSP's biggest month | Pre-event "numbers to know", a daily Stories recap, a giveaway (1 of 2–3 per year), and a post-event "by the numbers" collab |

- Plan event content **2–3 weeks ahead** and pre-render templates. Events are where MSP can be the Instagram source of numbers while organisers stream elsewhere (round 1).
- Treat December as **buying season** (gift-guide utility) and January as **solving season** (identity and goals). The two peaks call for different mechanics.

### Gaps
- **Czech, UK, German, Canadian and Australian national championship dates** could not be checked (search budget exhausted). MSP's own competition table is the best source and should feed the calendar automatically.
- **2027 dates** for USA Nationals, WJPC, EJPC and AEPUZZ were not published or not found.
- No evidence was found for back-to-school or summer effects on puzzling. Use MSP's month-by-month solve counts instead.
- The jigsaw search-seasonality evidence comes from AI-generated vendor pages. A direct Google Trends pull for "jigsaw puzzle" over 5 years is needed.

## 8. Concrete recommendations for MSP

### Takeaway
Make carousels the reliable base and Trial Reels the lottery tickets. Rotate series in seasons under a one-in-three novelty budget, run one pre-registered feed test at a time with fixed n, and judge everything against MSP's own medians in a single Grafana dashboard fed by SQLite and UTM-tagged GA4 data. Aim for "breakout" (≥3× median) monthly and "viral" (≥10×) a few times a year through events, collabs and Reels.

### Cited Findings
- Reels reach about 3× more non-followers than carousels for accounts under 10k, while images and carousels hold up with followers. — [Fanpage Karma](https://www.fanpagekarma.com/insights/instagram-format-reach/)
- Sends per reach is a top signal for non-follower reach. — [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)
- A clear chart plus takeaway is what travels. — [OWID](https://ourworldindata.org/launching-data-insights)
- Distinctive, annotated, colourful charts are more memorable. — [Borkin et al.](https://vcg.seas.harvard.edu/publications/20130101-what-makes-a-visualization-memorable)
- Awe, surprise, interest and practical utility predict sharing. — [Berger & Milkman](https://www.blueclaw.co.uk/aboutama/documents/jmr_forthcoming/online_content_viral.pdf)
- Peeking inflates false positives; fix n in advance. — [Evan Miller](https://www.evanmiller.org/how-not-to-run-an-ab-test.html)
- Collab reach benefits the smaller partner. — [Schöttl](https://hstalks.com/article/11245/download/); [Emplifi](https://emplifi.io/resources/instagram-collaborations-boost-organic-engagement/)
- MSP's recap decayed after about one quarter, and participatory posts multiplied reach. — [round-1 IG audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)

### Inferences
1. **Mechanic-first ideation.** Every brainstormed idea must name its primary mechanic (surprise, identity, comparison, utility, debate, send-a-friend, collective milestone or humour) and its primary metric (sends/reach or likes/reach). Reject ideas that only "report numbers".
2. **Chart craft for memorability:**
   - A takeaway headline on slide 1.
   - Annotation on the chart.
   - Puzzle-piece pictograms and colour.
   - Varied chart grammar; no two consecutive posts with the same chart type.
   - Slide 2 that stands alone.
   - A final slide with a specific send/comment CTA plus the data scope and date.
3. **Weekly rhythm with a novelty budget (3 feed posts):**
   - One anchor series: the Weekly Numbers, with 3 fixed slides and 2 rotating segments, run in seasons of 8–12 episodes and retooled between seasons.
   - One rotating pillar: facts, records or reports.
   - One novelty slot: a new template, mechanic or format, or a participatory post.
   - Plus 1–3 Trial Reels per week once motion templates exist (data-narrated timelapses, "how fast is fast?" percentile reveals, record countdowns), promoting winners after 72 hours.
4. **Fatigue guardrails:**
   - The per-pillar caps from section 3.
   - A fatigue panel in Grafana that fires when a series' rolling 4-episode median likes/reach or sends/reach drops below 75% of its first-4 median while non-series posts hold steady.
   - Any two signals trigger a retool.
5. **Experiment protocol:**
   - A hypothesis log in SQLite.
   - One feed test at a time.
   - ABAB alternation on matched slots with a pre-set n: 6–8 pairs for likes/reach or reach; ≥12 per arm for sends.
   - Sign-test or bootstrap decision rule.
   - Exclude event weeks.
   - Judge new formats on episodes 3–6.
   - Re-test "learnings" every ~6 months.
   - **First four tests:**
     1. Short (≤400 characters) vs long captions on the Weekly Numbers.
     2. Guess-the-number vs a plain fact carousel (same topic class).
     3. Featured-player tag (consented) vs no tag, on sends/reach.
     4. Trial Reel hook variants of one data story.
6. **Measurement:**
   - `pull_insights.py` → SQLite, with snapshots at +48 h, +7 d and +30 d, using +7 d as the decision point because of the 48 h lag.
   - Account-daily follow_type reach.
   - Story navigation within 24 h.
   - GA4 Data API sessions and sign-ups by `utm_content`.
   - Grafana SQLite datasource, Loki publish events as annotations, and Prometheus only for a few account gauges.
   - The six-panel weekly dashboard from section 5.
   - A `/ig` landing page with per-post UTM links.
7. **Viral plays, in order of odds:**
   - Event-week collabs with organisers (WJPC, Nationals, EJPC).
   - An event-tied giveaway (2–3 per year).
   - **MSP Wrapped** with personal share cards in early December.
   - A collective-milestone countdown (e.g. 300M pieces) culminating on a hook date such as National Puzzle Day (29 Jan 2027).
   - Trial Reels of remarkable solves (with player consent) narrated by MSP data.
8. **Near-term calendar:**
   - Wisconsin State Championship (23 Oct).
   - The EJPC Istanbul preview and results (27–29 Nov, confirm the dates).
   - A gift-guide utility carousel in November.
   - MSP Wrapped in early December.
   - "Quietest/busiest day" between Christmas and New Year.
   - New Year's Day numbers on 2 Jan.
   - National Puzzle Day on Fri 29 Jan 2027.
   - Spring Nationals season.
   - WJPC in mid-September.
9. **Expectations to set with the owner:**
   - Most posts will land at 0.7–1.5× the median.
   - Count metrics (saves, follows) are too sparse to judge single posts.
   - Real learnings arrive monthly, not weekly.
   - Static carousels can break out (3×) but rarely go viral (10×) without a participation, collab or event lever.

### Gaps
- None of these recommendations has been tested on MSP yet. The variance assumptions, season length (8–12 episodes) and novelty ratio (one in three) are reasoned heuristics to be replaced by MSP's own data after the first ~3 months.
- Consent and privacy rules for tagging the ~880 players with public Instagram handles, and for featuring individual solves in Reels, need an owner decision; the evidence above doesn't settle it.
