# Learnings (current beliefs)

Aggregate evidence only; no member names. Newest first. Each belief states the evidence and how sure we are.

## First 12 days of the pipeline (pulled 2026-10-29)
Baseline: median reach of the 12 posts before 17 Oct = ~1220. Since then 4 carousels + 4 Reels (+ the 29 Oct Reel, too
young). Posts are 2–12 days old, so the youngest will still grow. n = 4 per format: **hunches, not findings.**
- **Every pipeline post reached about the baseline or more (0.8–1.9×); no breakout (≥ 3×) yet.** Best: postcard quiz and
  clocks Reel 1.9×, 1000-vs-500 Reel 1.7×, Start here 1.7×; lowest: Weekly Numbers ep. 1 1.0×, ep. 2 0.8× at 3 days.
- **Reels vs carousels: similar reach (median ~1860 vs ~1640).** Over 30 days Reels brought the most account reach
  (4291 accounts vs 3578 carousels, 1064 Stories, 152 single images). 74 % of the account's reach is non-followers.
- **Carousels get more likes and shares per reach** (likes ~7.1 % vs ~5.5 %; shares ~0.55 % vs ~0.36 %). Weekly
  Numbers has the highest shares per reach of any format (0.6–0.7 %) but the lowest reach and follows: it is shared by
  the community, not discovered by new people. Matches the 2025 baseline (recaps were the most-shared posts).
- **Reel retention separates the Reels:** 1000-vs-500 (a myth with a number) kept viewers 51 % of its length, skip rate
  49 % (share of views that leave in the first 3 s), 18 shares; the feature promo (partner finder) 29 % and 63 % skip,
  the worst of the four; clocks 38 % / 46 % but 0 shares; grind 40 % / 54 %. Reading: the hook that states a surprising
  claim holds people and gets sent; a feature demo loses them in the first seconds.
- **Follows:** the API gives follows only for feed posts, not Reels. Start here (pinned) converts best: 60 follows,
  23 bio-link taps. Quiz 27 follows. Account: +179 followers 13→29 Oct (~1/day before 17 Oct, ~15/day since).
- **Audience (follower demographics, Oct):** US 23 %, DE 11 %, CA 6 %, AU 5 %, GB 5 %, CZ 5 %; ages 35–44 40 %,
  25–34 31 %, 45–54 18 %; 60 % women, 9 % men, 31 % unknown. Engaged audience is a bit more German (16 %).
- Saves stay ~0–9 per post on every format: don't judge anything on saves yet.

## Weekly Numbers ep. 2 (2026-10-26)
- Published 26 Oct ~11:00: https://www.instagram.com/p/De8_0AzCuDa/ (week 43, 13 photo tags incl. two brands).
- **"Invalid user id" on a photo tag doesn't mean the handle is wrong:** the owner confirmed two rejected handles are
  real accounts; the publishing API refuses private or tag-restricted accounts. Fallback: the owner tags them in the app
  after publishing, or the caption @mentions them (done once, by hand, as a one-off). Happened in ep. 1 and ep. 2.
- Captions can't be edited through the API; post-publish caption fixes are manual in the app.

## Clocks-go-back Reel (2026-10-24)
- "Your extra hour" (27.7 s, concept C: the 2–3 o'clock slice becomes a piece that completes Evening in Pisa), posted by
  hand Sat 15:32 Prague with music: https://www.instagram.com/reel/De4Px5uN9cO/ . At +43 h: reach 2204 (the most of
  any post since 17 Oct at any age), views 3202, likes 76, comments 4, **shares 0**, saves 1, average watch 10.5 s
  (~38 % of the Reel). Read: the timely hook travelled (reach), but it gave nobody a reason to send it; the 1000-vs-500
  Reel (a myth with a number) got 16 shares. One Reel each: a hunch, not a rule. Recheck at +7 d.
- Caption was edited when posting (the API copy differs from the draft); compare at the next insights pull.

## Partner finder launch Reel (2026-10-22)
- "Find your missing piece" (26 s, real UI from a demo server with invented people, "Tap" pointers), published by hand
  21:59 Prague with music (Mr. Sun · Happy Humming on the Story): https://www.instagram.com/reel/DezyT4gt_qx/ . Link
  Story to /en/partner-finder. Insights at +24 h / +48 h: non-follower reach, sends, average watch time, Story link taps.
- Owner caption edit: dropped the secondary number ("at events in 13 countries") before the URL, so the CTA line ends on
  the link. One edit: a hunch, not a rule yet.
- Context: at launch only 4 open listings on 2 events in production; watch whether listings grow after the Reel.
- A still Story with music is served as video: slightly softer text than the JPEG, still readable.

## First Reel (2026-10-21)
- "Twice the pieces, so twice the time?" (30.4 s, published by hand 15:55 Prague, music added in the app):
  https://www.instagram.com/reel/DewjphkIOPy/ . Insights at +24 h and +48 h (retention curve, skip rate, sends).
- **Instagram serves it far below our upload:** the API's media_url copy is 720×1280 at 0.6 Mbit/s (we upload
  1080×1920 at 6.9 Mbit/s); the owner saw it as slightly blurry in the app too. Re-check the served copy after a few
  hours (HD can arrive later) and test the app's "Upload at highest quality" setting. Design for it: text in Reels
  ≥ 34 px and bold where possible, few hairlines, less full-frame motion noise at reading moments.
- Layout: the middle band for content, Instagram's top and bottom zones left free, worked well (rule in
  standing-feedback.md).
- **Sharing a Reel to Story leaves no room for a sticker:** the share plays full screen (current app; tapping only
  resizes), and the free bottom strip is where the trash can sits. Shared as is (with no poll). For a poll or link,
  make a separate Story frame with a reserved sticker zone.

## Animated Stories (2026-10-19)
- Owner (21 Oct): viewers paused and replayed the Week 42 animated Story to read the data; dense, data-rich motion is
  consumed by re-watching, not skimmed.
- Week 42's animated Weekly Numbers Story (15 s, HyperFrames): the owner and followers liked the animation; keep
  animated Stories for recurring Stories (one Story: owner's read, insights still to come before it expires).
- Its preview was the first frame, an almost empty navy ground: frame 0 must be a finished title card (now built in).

## First pipeline post (2026-10-17)
- "Which is faster? The postcard trio" (Sat 17 Oct ~12:15 Prague, carousel, weekend interactive slot, brand tagged,
  poll Story follow-up). Pull insights after 48 h and 7 days; judge it on comments and sends per reach against the
  account's carousel median (2026: reach ~1,250).
- Community activity by weekday (8 weeks to 12 Oct, `activity-weekday`): Sat 17.7 %, Sun 18.9 %, weekdays 12–14 %.

## Baseline (2026-10-13, before the pipeline)
- A regular post reaches a median ~880 accounts (2025 carousels; images ~800); 2026 posts so far ~1,200.
  Engagement (interactions / reach) ~8–10%. Shares ~1–7 and saves ~1–7 per post: too sparse to judge single posts.
- Giveaways reached ~4.4k (the account's best, 4.8× median); weekly recaps were the most-shared regular posts.
- Followers are most online 19:00–22:00 Prague time.

## Quizzes and Story polls
- First "Which is faster?" poll Story (17 Oct 2026, postcard trio): the crowd picked the right answer
  (48 / 30 / 22 % for the actual 1st / 2nd / 3rd), even though only seconds separate 1st and 2nd. One poll: a hunch,
  not a finding. Poll votes can't be read by the API: read them off the Stories archive in the app within days.
