# Learnings (current beliefs)

Aggregate evidence only; no member names. Newest first. Each belief states the evidence and how sure we are.

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
