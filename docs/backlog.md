# Backlog

Build and ops work for the pipeline. Content ideas live in `docs/ideas/` (public, aggregates) and
`content/ideas/backlog.md` (local). Tick items off here when done; add new ones at the right priority.
Updated 2026-10-17.

## Now

- [x] **Import launch carousel PUBLISHED Sun 15 Nov 19:50 Prague** (https://www.instagram.com/p/DfxduLajYkP/, draft
      `2026-11-15-import-launch`, 7 slides, "Import? Break it. (Gently.)", 31 542 backfilled results queried fresh 19:48).
      Checks scheduled: `check-import24` Mon 16 Nov 20:00, `check-import48` Tue 17 Nov 20:00 (pin verdict) →
      `content/reports/import-launch-check-*.md`, each with the list of "sandbox" commenters.
- [x] `check-import24` done Mon 16 Nov ~20:05 (+24.2 h): reach 667 (0.63× carousel median), 47 sends (7.0 %, all in
      the first 11.5 h, none since), 60 likes, 2 saves, 0 follows, 5 profile visits; 2 testing requests, both already
      answered with a DM by the owner, none new; 1 comment ("🙌😍") unanswered, reply proposed in the report.
- [x] `check-import48` done Tue 17 Nov ~20:05 (+48.2 h): reach 756 (0.70× median 1074), 47 sends (none since +11.5 h),
      67 likes, 1 follow, no new comments or sandbox requests; **pin verdict: keep all three** (no app steps).
- [ ] Owner: reply to "🙌😍" on the import post (text in `content/reports/import-launch-check-48h.md`); report the
      sandbox DM / file / e-mail counts to the next session.
- [ ] Live session: count imports made on MSP since Sun 15 Nov 19:50 (read-only query) to judge the launch on its
      purpose, not on reach; and decide whether the sends-without-reach pattern changes the send-line suggestion.
- [ ] Owner: one-tap share of the carousel to Story; for every "sandbox" comment copy the tester's MSP login to the
      sandbox and DM them, then reply "Check your DMs 📬" under the comment (DMs to non-followers land in requests).
      The 13 Nov spreadsheets Story named Numbers, which the import does **not** read (only .xlsx, .csv, .tsv, Google Sheets).
- [ ] QA: flag text closer than ~60 px to a poster seam's knobs (the rule was broken twice: pile-of-shame Reel 12 Nov, import cover 15 Nov); today it's only a manual check.
- [ ] Optional follow-up: a Trial Reel of the real import flow (screen recording on the sandbox with a made-up account)
      once the screens settle.
- [x] **Friday-13th Reel `2026-11-13-reel-unlucky` published 13 Nov 17:31 Prague** (https://www.instagram.com/reel/DfsDnm4NwIy/, linked, caption poll on near misses). Checks scheduled: `check-unlucky24` Sat 14 Nov 18:00 (done, see below), `check-unlucky48` Sun 15 Nov 17:45 (pin verdict). Judge on comments and sends per reach vs the pile-of-shame carousel and the other Reels.
- [x] **Story "We want your spreadsheets" published 13 Nov ~19:44 Prague** (draft `2026-11-13-story-spreadsheets`, lab SW1,
      animated B + A's siren, music + Story caption). Check `check-sheets24` Sat 14 Nov 18:20 →
      `content/reports/spreadsheets-story-check-24h.md`.
- [x] Spreadsheets Story check done 14 Nov 18:20 (+22.6 h, last API read before it expires): reach 489 (teaser 401 at
      +23 h), views 694, 1 reply, 4 shares, 5 profile visits, 0 follows, 117 exits (24 % of reach vs the teaser's 32 %).
      The API can't show DM contents, files or e-mails.
- [ ] Owner: **count the spreadsheet samples received by hand** (Instagram DMs since 13 Nov 19:44 + e-mail, incl. the
      pile-of-shame puzzler's promised to-do sheet) and tell the next session the totals; hand them to the import work
      in the app repo; keep the files out of this repo (member data).
- [ ] If the count is too low for the import: second ask with a question sticker (one-tap first step) or as a Reel
      (`caption.txt` in the draft is ready). Decide only after the hand count.
- [ ] Headers removed house-wide (13 Nov): on the next feed post, tighten the empty ~170 px top band left by the kicker.
- [x] +24 h check done 14 Nov 18:00 → `content/reports/unlucky13-check-24h.md`. Reel at +24.5 h: reach 576 (Reel
      median 766), views 957, avg watch 10.3 s of 29.8 s, skip 48.6 %, 33 likes, 1 comment, 2 sends, 0 saves. Pile
      carousel at the same age: ~40 comments, ~9 sends. Caption-poll votes are not in the API.
- [ ] Owner: read the Unlucky 13 **caption-poll vote count** in the app (ends ~Mon 16 Nov 17:30) and tell the next
      session (many votes with 1 comment would mean the poll soaked up the answers); approve the proposed reply to the
      one comment (`content/reports/unlucky13-check-24h.md`).
- [ ] Future polls with a "tell us" question: add a catch-all option (the only Unlucky 13 comment, a near miss of
      under a minute, fit no option); try the poll alone or the question alone to see which draws people in.
- [ ] Hunch to watch (n = 3): the last three follower Reels (achievements, missing piece, Unlucky 13) sit at ~750
      reach vs 1661–2392 for the first four. Check at the weekly review whether non-follower reach dropped.
- [x] +48 h check done 15 Nov 17:45 → `content/reports/unlucky13-check-48h.md`. Reel at +48.2 h: reach 631 (0.82× the
      Reel median 772, finished), 1 comment, 2 sends, 0 saves, skip 47.9 %. Comment question didn't work. **Pins kept**
      (Start here, quiz, WJPC); no app steps.
- [ ] Owner: answer or skip the 5 open comments (1 on Unlucky 13, 4 on the pile-of-shame carousel); replies proposed in
      `content/reports/unlucky13-check-48h.md` §4.
- [x] **300M poll Story** (`stories/story-300m.jpg`): **never posted** (no Story in the API from 14 Nov 18:00 to 15 Nov Superseded 18 Nov by the 300M Reel.
      17:45). Recommendation (15 Nov check): drop the guessing poll (too late for the Mon 16 option); optional Monday
      countdown Story instead. Owner to confirm.
- [x] **300M Reel `2026-11-18-reel-300m` PUBLISHED Wed 18 Nov ~18:45 Prague** through the API (https://www.instagram.com/reel/Df5EbHYih3E/; first Reel published by `src/publish/publish.ts`). 57 s origin story, bed BR3-A-origin-xl-turbo-s202 (fit mode "rewind"). Checks: `check-reel300m-24` Thu 19 Nov 18:50, `check-reel300m-48` Fri 20 Nov 18:50 (pin verdict) → `content/reports/reel300m-check-*.md`.
- [ ] **Story `2026-11-18-story-300m`** ("LET'S CELEBRATE 300 000 000 PIECES PLACED TOGETHER!", 12 s with music): owner posts by hand with a sticker to the Reel in the free space at the bottom; then schedule its check (≥ 1 h before it expires). Story publishing by API is not built (it can't place stickers).
- [ ] BR3 into `src/review/nav.ts` LABS; Reel watch-time at 57 s vs earlier 30–40 s Reels → learnings after the checks.
- [ ] Ideas kept from the 13 Nov brainstorm: pile-of-shame Black Friday sequel (27 Nov), night owls, re-run the pile Trial Reel with the 929-box wall in frame 1, edges-first poll Story.
- [x] Weekly Numbers ep. 3 published 2 Nov 19:59 (https://www.instagram.com/p/DfQAZ3yCMhw/). Story posted 2 Nov evening. Next: Story insights before Tue 3 Nov evening; post insights Wed 4 Nov ~20:00 (`node tools/insights.ts`).
- [ ] Monthly report: "puzzlers" counts only who logged a result (`monthly-totals`); switch to everyone who took part, like the weekly (2 Nov).
- [ ] Weekly: week total (weekly-totals) and the day chart differ by ~3 solves (results logged before the week began but finished in it count in one, not the other); align the two filters.
- [x] Weekly ep. 4 published 9 Nov ~20:25 (https://www.instagram.com/p/DfiE1_1ERhA/), owner picked the boxes cover (B).
- [x] Boxes cover is the weekly default (`weekly-rc1`, 9 Nov).
- [x] Weekly ep. 5 (week 46) PUBLISHED Mon 16 Nov 15:11 Prague (https://www.instagram.com/p/Dfzio69jjl8/, `2026-11-16-weekly-rc1`, 8 slides, all 11 photo tags ok). Checks: `check-weekly5-24` Tue 17 Nov 14:30 (also reads the Story), `check-weekly5-48` Wed 18 Nov 15:15 (pin verdict). Owner: post the animated Story with the "Full report" link sticker bottom right, add it to Recaps and remove the oldest week (5th week).
  - [x] +24 h check done Tue 17 Nov 14:30 (`content/reports/weekly5-check-24h.md`): reach 763 (0.71× median), **9 sends
    (series record)**, 2 follows; Story 305 reach at +15.5 h, 0 replies. Earlier slot: no visible harm, n = 1.
  - [x] +48 h check done Wed 18 Nov 15:15 (`content/reports/weekly5-check-48h.md`): reach 840 (0.77× median, 5 of 5
    episodes below it), 10 sends (1.19 %, best in the series), 2 follows; **pins kept**. No more checks for ep. 5.
  - [ ] Owner: reply to the 2 ep. 5 comments (proposals in the 48 h report; still unanswered at +48 h); note the Story's
    link taps from the app/archive.
  - [ ] Series reach ceiling (0.7–1.0× the carousel median every week): if ep. 6–8 stay there, try a cover or topic
    that travels beyond followers rather than a new slot; the fatigue rule needs 8 episodes.
  - [ ] From ep. 6: compare each episode at +24 h (snapshots now exist from publish on); try 15:00 for a few more Mondays
    if the owner wants to test the time (one post can't separate time from content).
- [ ] Ep. 4 insights at +48 h (Wed 11 Nov ~20:30); Story insights before it expires (Tue 10 Nov evening). Compare reach with eps. 1–3 (first boxes cover).
- [x] Tag pre-check: `tools/check-tags.ts` (2 Nov).

- [x] **Monthly report, October (first monthly recap) PUBLISHED Sun 1 Nov ~13:30 Prague** (owner: "publish now";
      https://www.instagram.com/p/DfMuk0dCNqu/, draft `2026-11-01-monthly`) (`node tools/draft.ts monthly`, fresh 1 Nov: 43 748 results logged = biggest month ever,
      +143 % year on year; counted like the website's statistics page). 5 slides: cover = the colour mosaic under "October" (owner: the stat cover was boring), record chart,
      zoom-in, by brand, month in numbers + "is your last puzzle in there?". After publishing: one-tap share to Story (no extra info, standing rule) → Recaps highlight
      (replace any older monthly); pins advice; insights at +48 h (Tue 3 Nov ~19:00): shares and comments per reach vs
      Weekly Numbers.
- [ ] **Story to the monthly report** (owner 2026-11-01): the Reel's animation as a Story with a link sticker to
      https://www.instagram.com/p/DfMuk0dCNqu/ (`node tools/motion.ts month 2026-11-01-monthly --story` →
      `content/drafts/2026-11-01-monthly/stories/story-month.mp4` + `story-month-sticker-guide.jpg`); owner posts it
      tonight after the Reel. Read link taps before it expires (Mon evening).
- [ ] **Weekly Numbers ep. 3 moves to Mon 2 Nov 19:00** (24 h after the monthly). No overlap: the monthly has no names
      or boards.
- [ ] **"October in 1000 puzzles" Reel APPROVED 1 Nov, owner posts by hand Sun 1 Nov evening with music** (draft
      `2026-11-04-reel-october`, status approved, caption linted clean; after posting: `node tools/link-post.ts
      2026-11-04-reel-october`, insights at +24/+48 h vs the other Reels; not pinned).
      Earlier: first full render 1 Nov (`node tools/motion.ts month 2026-11-04-reel-october`,
      25.7 s, 2 min render, 1.9 GB peak; MR1 concept A + owner's script, `docs/ideas/reel-month-colour.md`): owner to
      watch `content/drafts/2026-11-04-reel-october/reels/reel-month.mp4` (540p copy alongside) and give timing notes;
      then caption, `--fresh` re-render on the day, post by hand with music, tag @ravensburgerglobal (+ speedpuzzle.eu).
- [ ] (was) **"October, sorted by colour" Reel, Wed 4 / Thu 5 Nov** (went out 1 Nov evening as a **Trial Reel**; followers get it as the Story with the link sticker, see decisions 2026-11-01): the
      1000 boxes drop in shuffled and sort themselves by colour into the piece; **frame 0 / splash = the finished collage
      piece** (owner 2026-11-01: "I want the reel to have the collage on the intro to catch attention"); one short line at a time, long holds
      (new Reel rule 2026-11-01: less text, slower). Reuse `src/posts/mosaic.ts` + `monthly-boxes`. Key frames: lab **MR1** (`node lab/monthly-reel/run.ts`,
      19 frames, 4 concepts A Shuffle / B Powers of Ten / C 1000-piece puzzle / D Rainbow rain + shared splash S1 and end
      E1) waiting for the owner's per-frame rating; then a low-res motion preview of the top 1–2 and the MP4 (go-ahead).
- [ ] Monthly recap as a routine: run `node tools/draft.ts monthly` on the 1st of each month (November → 1 Dec, same
      day as Advent door 2: decide the order then).

- [x] **Halloween piece quiz PUBLISHED Sat 31 Oct ~11:20 Prague** (https://www.instagram.com/p/DfJ7Cx6CPBJ/, draft
      `2026-10-31-piece-quiz-halloween`, `node tools/draft.ts piece-quiz-halloween`; fresh data 31 Oct 11:14: 212 puzzlers,
      337 solves, 13 this October). Teaser Story with countdown posted Fri evening. Went out ~1 h 20 min after the countdown ended.
- [ ] Piece quiz follow-ups: share the post to Story today (poll sticker on the cover, "A / B / C?"), answer Story Sun 1 Nov;
      read comments (guess + slide number), sends and saves per reach at +48 h (Mon 2 Nov ~11:20); then decide the
      weekend rotation (piece quiz → weekend challenge → guess the number) and whether it replaces the postcard quiz pin.

- [x] **Achievements launch Reel PUBLISHED 29 Oct 16:03 Prague** (https://www.instagram.com/reel/DfFSLQLNCQK/, draft
      `2026-10-29-reel-achievements`, linked) + holder-numbers Story with a link sticker (posted ~16:10 Prague):
      **read its Story insights (link taps, replies, exits) before it expires, Fri 30 Oct ~16:00.**
- [ ] Achievements Reel insights at +24 h (Fri 30 Oct ~16:00) and +48 h (Sat 31 Oct ~16:00) vs the grind and partner Reels;
      pin verdict at +48 h (candidate to replace the postcard quiz pin: evergreen).

- **"The grind" Reel PUBLISHED Tue 27 Oct 21:22 Prague** (https://www.instagram.com/reel/DfAs85vN3QT/, draft
  `2026-10-27-reel-grind`, linked; caption as drafted). Insights at +24 h (Wed 28 Oct ~21:20) and +48 h (Thu 29 Oct ~21:20):
  retention, avg watch time, sends, non-follower reach vs the first three Reels. Not pinned (the count goes stale). Answer the
  "which puzzle have you solved the most times?" comments. Later: December Reel on the unboxed Christmas repeat. Later: December Reel on the unboxed Christmas repeat.

- [ ] Reel "Your extra hour" (`2026-10-24-reel-clock`): owner picked C → `--look C --fresh` re-render Sat morning → approve →
      post by hand ~18:00 with music; Sun Story "It's 02:00 again"; insights at +24/48 h.
- [ ] Owner decision on cadence from `reach_cadence_2026-10.md` (5/week incl. owner's posts, Trial Reels 2–3/week);
      then add the three tracking fields it proposes (follower vs non-follower reach weekly, 72 h reach snapshot,
      hours since previous post) to `tools/insights.ts`.

- [x] Partner finder Reel published 22 Oct 21:59 (https://www.instagram.com/reel/DezyT4gt_qx/) + link Story.
- [ ] Partner finder Reel insights at +24 h (Fri 23 Oct ~22:00) and +48 h; add its Story to a "New features" highlight.
- [ ] Reels builder: a generic "UI screenshot beat" (card fit + Tap pointer + tap ring) lives in `src/motion/reel-partners.ts`;
      move it into the motion kit when a second feature Reel needs it.

- [x] Owner feedback on DL1 styles and DL2 formats (2026-10-14) → `docs/decisions.md`, `docs/design/house-brief.md`.
- [x] DL4 house system built (2026-10-16): `src/design/house.ts`, variants H1–H3, all approved content (data, image
      formats, ideas, funny facts, timely stories, Stories, Reels) in each, profile grids, 0 QA errors.
- [x] DL4 verdict (2026-10-17): H4 = H2 poster first slide + H1 board; H3 design out (content kept).
- [x] K1 settled (2026-10-17): deep navy B, original seam, funny facts coral → H4 is `HOUSE`.
- [ ] Fold the agents' house proposals into H4:
      per-ground art palette (`--a-*`), `cover()` with art in poster/chapter layouts, family CSS hook in `run.ts`,
      shared geometry/board/ring helpers (copied across families now), `heroFitUnit`, an "ink on device" token, a
      lighter second chart colour on sky (hot and cool are both near-black), story layouts in `cover()`.
- [x] Funny facts restyled (real pieces/box images, flat poster, type-led; J1 compares them); timely stories restyled.
- [ ] Owner pick for the funny-facts approach (J1: A pieces/boxes recommended as default, C type-led for one-offs).
- [x] Reels in the house style, full 9:16, plus the XP feature-reveal Reel (`lab/dl4/reels/`, 12 renders).
- [x] Outlined logo (`assets/brand/speedpuzzling-logo-outline.svg`), ≈ 1.5× in every footer.
- [x] IL1 run (2026-10-16 10:58–15:05, 199/199 images, 0 failures).
- [ ] IL1 owner review → style guide + reference set (may lead to a task in the MSP repo for the website).
- [x] DL4 Reel videos re-rendered with the bigger branding (2026-10-16, 12/12 spec ok).
- [x] Logo intro/outro research (Rive vs SVG+GSAP vs Lottie: GSAP in HyperFrames for Reels, Rive for the website later).
- [x] LM1 logo motion lab (2026-10-16): rigged logo (`assets/brand/speedpuzzling-logo-rig.svg`, 0 px diff), 5 intros,
      3 outros, 4 app-splash cuts (`lab/logo/`).
- [x] LM1 round 2: connectable modules on one hand-off frame (`lab/logo/chain.ts`, `--chain "converge drop hold:0.6 breakup"`),
      new intros (rain, converge, sweep, jigsaw, relay), break-up outro, ≤ 1 s Android splash cuts, 1.2 s loading loop +
      reduced-motion loop, 0.6 s loop-back Reel sting, example chains (app, event opener, brand Reel).
- [ ] Owner picks in LM1 (Claude's picks: F2 Converge for intro/splash, no Reel outro but the 0.6 s sting, P Break-up for
      long formats) → hand the app team the splash/loader spec (Android AVD ≤ 1 s inside a 192 dp circle, no masks or
      outline, so a coral/white ground; iOS static launch screen; reduced motion) and ask for cold-start times.
- [ ] Trial Reels test: the same Reel with no outro / 0.6 s sting / full outro (skip rate, avg watch time, sends, follows).
- [ ] Decide the series of `75-years` (milestone = coral in H3, or fun with the timely stories).
- [ ] Feedback still to collect: DL3 visuals, AI1 images.
- [ ] Port the XP share card concept (generator pieces) back to the MSP site once the owner picks a version.

- [x] Caption lint from the instagram-agent-skill review (2026-10-18): search phrases (`searchPhrases` per builder →
      `search_phrases` in draft.yaml), invisible characters (error), stock phrases and generated sentence shapes;
      `ig-insights` diagnosis rules (reach vs profile problem, sample size, time last).
- [ ] Rest of the instagram-agent-skill review (`research_notes/MSP Instagram content pipeline/external_instagram_agent_skill_review.md`;
      verdict: don't install, borrow): beat-timing check and safe zone when Reels publishing is built.
- [x] One-off profile check (2026-10-18): 47/100; bio B1 decided, name stays (`docs/decisions.md`); owner steps in
      `research_notes/MSP Instagram content pipeline/profile_audit_2026-10-18.md`.
- [x] Owner (18 Oct): new bio, pins (Start here, quiz, WJPC), category + e-mail, "Quizzes" highlight. Profile 47 → 75/100.
- [x] "Start here" explainer (`node tools/draft.ts about`, evergreen): published and pinned 18 Oct 17:29,
      https://www.instagram.com/p/DepAfaWDaud/
- [ ] Render QA misses text that runs into the next block (about slide 4: a 3-line dek over the board header passed
      with 0 errors): check the dek bottom against the next element's top in `src/render/qa.ts`.
- [ ] **Medians differ from the site's:** our quiz medians were 30–50 s lower than the puzzle page shows
      (`puzzle_statistics.median_time_solo`, e.g. London 52:47 vs 53:31; ranking the same). Find how the site computes
      it (`~/www/speedpuzzling.cz`, the stats recalculation) and match it, or read `puzzle_statistics` directly, so
      every per-puzzle number in a post is what puzzlers see on the site.
- [ ] Refresh the pinned "Start here" post about yearly (or when a floor is far behind, e.g. 15,000+ puzzlers): re-run,
      re-post, re-pin, archive the old one.
- [ ] **Highlights, once there are more posts/Stories to fill them** (owner 2026-10-18; profile check: highlights 3/8):
      "Start here" (this month's numbers, refreshed monthly; Story builder needed), "Events", later "New features".
      Covers with `node tools/highlight-covers.ts '<name>:<glyph>'` so the row reads as one set.
- [x] Replied to the 3 postcard-quiz comments (18 Oct; numbers checked against the site first). Ongoing habit: reply in the
      first hours of every post; Claude drafts and posts only after the owner's go-ahead.

- [ ] **GIPHY sticker pack** (owner: "awesome idea", 2026-10-16) so players can put MSP in their own Stories:
      animated stickers from the logo rig (e.g. stopwatch sweep, piece snap, "New PB!", "Puzzle done", "MSP"), transparent
      GIF/WebP per GIPHY specs; needs a GIPHY brand channel (verified to be searchable in Instagram). Research specs +
      verification steps, then prototype in LM1. Durations/notes: `research_notes/…/logo_motion_durations.md`.

- [ ] **Reel quality:** Instagram served the first Reel at 720×1280 / 0.6 Mbit/s. Re-download the served copy after
      ~6 h and 24 h (does a 1080 copy appear?); owner tests "Upload at highest quality" in the app; then decide on a
      Reel type floor (≥ 34 px) and an encode tuned for recompression (e.g. slightly sharper, less grain, CRF test).
- [ ] **Reels publishing by API** (first Reel went out by hand, 2026-10-21): container with `media_type=REELS`,
      cover_url, share_to_feed; music still added by hand, so keep the manual path as default.

## Advent of Puzzle (launch Thu 26 Nov, door 1 Mon 30 Nov 2026)

Design `docs/ideas/advent-of-puzzle.md`, evidence `research_notes/…/giveaways_and_advent_2026.md`, morning list
`docs/advent-morning.md`, lab AD1 (`lab/advent/`), automation `src/campaign/` + `tools/campaign.ts`.

- [x] Research (API, Story channel, rules and law, what works), design, 24 doors, AD1 prototypes, read-only automation
      with tests (2026-10-17).
- [ ] **Owner decisions** (morning list): route, eligibility rule, prize and value, age, calendar, door visual, colour,
      publishing doors by API, the 300M dry run, Advent = one of the year's ≤ 3 giveaways.
- [ ] **Close Friends test Story** (T1 poll, T2 quiz, T3 reply) + `node tools/campaign.ts probe` at +5 min, +1 h, +23 h,
      +26 h → confirm `reply_to.id` = Story id, edit/unsend/emoji/GIF shapes, no "Seen" side effect; record in the
      research note §2.3.
- [ ] **Public dry run**: the "Guess the day: 300 million pieces" Story (early Nov; non-followers, message requests,
      Hidden Requests, real reply rate) → milestone post on the crossing day (~20 Nov, re-query daily from 13 Nov).
- [ ] **Rules page** on myspeedpuzzling.com (EN + CZ; MSP web repo task), the matching rules, the Art. 13 notice;
      legal name/address/IČO; lawyer + accountant checks (research §3.5).
- [ ] **Prize**: buy or issue 4 voucher codes (or agree with a partner: paid-partnership label + agreement); check that
      they work abroad and cost nothing to redeem.
- [ ] **Token refresh before 30 Nov** (it expires 12 Dec, mid-campaign): `node tools/ig-token.ts refresh`; then weekly.
- [ ] **Story publishing in `src/publish`** (`media_type=STORIES`, R2 URL, record the media id per door) if the owner
      chooses scheduled doors; otherwise the owner posts doors by hand and runs `tools/campaign.ts stories` after.
- [ ] **24 answer keys + 4 reserves** in `content/campaign/advent-2026/keys/` (gitignored), contenders queried fresh on
      each door's day; door builder in `src/posts/advent.ts` from the chosen AD1 variant (QA gate, alt text).
- [ ] **Install the launchd job** (owner go-ahead; commands in `docs/runbook.md`); a full dry run on a Close Friends test
      door the week before (collect → week → seed → draw on fake keys, then purge).
- [ ] Settings on the account: Story replies open to everyone; public Story comments off on door Stories; "Allow access
      to messages" on (Connected tools); don't delete or decline chats until each week's draw is done.
- [ ] Advent highlight cover; announcement carousel + countdown Story; Sunday recap carousel builder.
- [ ] After the campaign: purge non-winner entries by 25 Feb 2027 (`tools/campaign.ts purge`); write the read-out into
      `editorial/learnings.md`.

## Build: from labs to production

- [x] First production builder + draft tool (2026-10-17): `src/posts/faster.ts`, `node tools/draft.ts faster-postcards`
      (fresh facts → HOUSE render with QA gate → caption + alt text → draft in review). Weekly Numbers builder done 2026-10-18 (`weekly-rc1`, `weekly-rc2`); next: Wisconsin preview.
- [ ] Puzzle subjects from the box images (owner 2026-10-17: title matching misses cats/dogs that are only in the
      picture; MSP tags are events only). Classify box images with a local vision model (CLIP-style, light) into
      subjects, store per puzzle in a local cache, then redo cats vs dogs, the tier list and the atlas themes.
- [ ] "Weekend puzzle challenge" format (Saturday post names a widely owned puzzle; Monday's recap shows the
      community's times). Needs a collection-ownership query.
- [ ] Growth strategy (frequency incl. multiple per day, mix, quality bar, measurement): research running
      2026-10-17 → `research_notes/MSP Instagram design and growth toolkit/growth_strategy_2026.md`; then decide.

- [x] Standing feedback memory: `editorial/standing-feedback.md`, read by `ig-draft`/`msp-captions` and CLAUDE.md;
      general review notes and patterns in the owner's caption edits become rules there.

- [ ] `src/posts/<series>.ts` builders: one per chosen series (Weekly Numbers, Puzzle of the week, Atlas, Museum,
      tier list, timely/milestone, event preview/recap, monthly report, quiz). Each: run its queries `--fresh`, write
      `facts.json`, render slides with the chosen look, propose caption + alt text, save a draft (`in_review`).
- [x] `node tools/draft.ts <builder> [--id <draft-id>]` CLI wrapping the builders (used by the `ig-draft` skill); builders
      so far: `faster-postcards`, `about`.
- [ ] Move shared lab helpers into `src/design/` (piece placement with rotation, cut-line helper, round-puzzle ring,
      Rubik metrics for hero numbers, month formatting, flag guard for empty country codes, box crops).
- [ ] Reels publishing in `src/publish` (`media_type=REELS`, `video_url` on R2, `cover_url`, `share_to_feed`,
      optional `trial_params`); preflight for video specs (ffprobe). Stories stay manual (stickers).
- [x] **Week-46 Story with baked-in music POSTED 16 Nov 22:59** (`MU1-data-xl-turbo-s202-fit2`, 18.1 s); checked
      17 Nov 21:30 (`content/reports/story46-check.md`): reach 371, exits 21.6 %, taps forward 55 %: no warning sign
      vs app-music Stories; lower reach likely the late hour. n = 1.
- [ ] Owner: note the week-46 Story's link taps ("Full report" sticker) from the archive (not in the API).
- [ ] Week-47 Story (Mon 23 Nov): own music again, at the usual evening time, to separate "late hour" from "own
      music"; compare at +24 h with the table in `story46-check.md`.
- [ ] Served-quality re-check of a Story/Reel (ffprobe of `media_url`): do it in a live session while it's live, or
      make `tools/insights.ts` keep `media_url` for live Stories so unattended checks can download it to /tmp.
- [ ] **Owner: rate the sound labs** (18 Nov night): MU2 house sound (direction per post type, `desc` vs `fade`
      ending), FX1 (recap vs comic SFX levels, signature S1–S5, comic Reels), MU3 (2 R4 beds on the pile-of-shame Reel).
      Then fix templates per series in `content/sound/library.json` + standing feedback "Music beds".
- [ ] **Owner go needed:** restart the GPU queue that was stopped for low memory: the rest of MU3 (11 beds:
      `--grid lab/music/mu3_briefs.json --only R7-epic,R8-fine,R5-bouncy,R1-disco,R2-house,R3-phonk,R9-lofi,R10-liftoff,R11-afro,R12-chiptune`)
      and the MOSS puzzle-foley test (`lab/sfx/moss_gen.py`); one at a time, Docker off, nothing else heavy.
- [ ] **Owner: rate BR1** (18 Nov, music written per post from the three report briefs; ranked; top: shelf s404,
      unlucky s303, weekly cozy s303 / data s303). Then wire brief → generate → rank into the draft flow.
- [ ] **Per-post music brief** (owner 18 Nov): add `sound.brief` to drafts (caption + section tags + BPM from the
      storyboard), a `tools/sound.ts --generate` path (3–4 XL candidates → fit → QA → review page), always after the
      owner's go. Brief-writing checklist in the ig-draft skill.
- [ ] **Themed music** (owner 18 Nov): first the **Advent** pool (doors from 30 Nov): `lab/music/themes.json` T-advent,
      3–4 beds, approve by ear before 26 Nov; Halloween etc. two weeks ahead of each theme (needs GPU go, Docker off).
- [ ] fit.py **loop mode for Reels** (Reels loop: the music should flow back into its start; MU3-R4-s303 flagged
      "abrupt end" on the looping pile-of-shame Reel).
- [ ] Optional owner foley session (20 min, iPhone; recipe in `docs/ideas/sound-pipeline.md`) or hand-download the CC0
      puzzle recordings listed there.
- [ ] Wire `tools/sound.ts` into the draft flow (`tools/motion.ts … --sound`), restart the review server for Insights
      "By sound"; then Reels publishing by API.
- [ ] **Automate the bed fit** (owner 16 Nov: the music must hit the video): find a bed's drop and downbeats
      (beat_this / librosa onset), land the drop on the video's key moment from the motion timeline, join the song's
      own outro on a downbeat, two-pass loudnorm −14 + true-peak limiter; hold the last frame for the sticker.
      Done by hand for week 46 (lab/music, `fit2`). Then: overnight XL batches into an approved bed library.
- [ ] Owner to describe the "calmer ending, a few tones going lower" (fit3 with added plucks missed it); next try:
      have ACE-Step generate the ending itself (repaint/extend; watch the loudness-jump bug).
- [ ] Story/Reel quality on Instagram: "Upload at highest quality" is already ON on the owner's phone (16 Nov), so
      the 720p / 0.37 Mbit/s copy happens anyway. Next: compare encodes tuned for recompression; see if HD appears later.
- [ ] Reels audio decision and pipeline (silent / SFX from Freesound CC0 / royalty-free bed; licence ledger).
      **Researched 16 Nov:** `reports/Automated Reels and Stories audio.md` (no-credit rule in decisions 2026-11-16).
      Path: API Reels with baked-in, fitted and mastered audio; music library of Meta Sound Collection tracks; ACE-Step
      1.5 test night (needs the owner's go-ahead); Story stickers stay manual; Unified Login app only if our own
      baked-vs-app-music comparison says so. Owner decisions listed at the end of the report.
- [ ] Scheduled publishing: launchd LaunchAgent running `node src/publish/publish.ts --due` every 15 min
      (approve-now already works); max 6 h lateness → `needs_reschedule`.
- [ ] Insights schedule: launchd job for `tools/insights.ts` (+48 h, +7 d, +30 d per post; account metrics weekly);
      six weekly panels in the review app; `editorial/learnings.md` updated by the `ig-insights` skill.
- [ ] Comment digest for the owner (new comments since last check, suggested replies checked against fresh data; Claude
      posts a reply only after the owner's go-ahead).
- [ ] AI in production (only where the owner approves): plate library with picks + model/licence per asset,
      composite-back in the post builders, an "AI1 in context" gallery (candidates placed in their real layouts).
- [ ] Token: weekly `node tools/ig-token.ts status` check with a reminder 7 days before expiry (2026-12-12).

## Repo, security, ops

- [ ] Verify the Story bands on device: post `content/labs/STORY-TEST/story-test-v1.jpg` to Close Friends, screenshot
      it in the viewer on an iPhone (and an Android if available), add a default-size 3-option poll and screenshot;
      adjust `STORY` / `FRAMES.story.safe` if anything differs by more than 20 px.


- [x] Public GitHub repo **MySpeedPuzzling/instagram-studio** created by the owner; gitleaks clean; MIT LICENSE (brand
      logos and the Rubik font excepted); first push 2026-10-17. Enable push protection / secret scanning in the repo settings. (The local pre-commit hook already blocks `.env` values, hostnames and credential shapes.)
- [x] gitleaks installed (8.30.1) and run on the full history (2026-10-17): 98 commits, 0 leaks (one reviewed false
      positive in `.gitleaksignore`). Re-run `gitleaks git . --redact` right before the first push.
- [ ] Optional: add gitleaks as a second pre-commit scanner.
- [ ] Keep `docs/STATUS.md` current at the end of each work session.

## Known issues

- Lab galleries: iOS video playback needs the review server running (Range support added 2026-10-13).
- Box images from MSP's image proxy are max ~1200 px; heroes upscaled > 1.5× look soft.
- `lab/ai1` E5 (Qwen relight) can't pass the calm gate on a 36 GB Mac (needs ≥ 32 GB free); drop or run at 768 px.
- AI1 E2 material textures: no clear win over code textures; one has a rounded-corner artifact.
- Some DL3 G2 spirit-animal stats use substitute queries (see the G2 file header).
- DL4: kickers now cut with an ellipsis instead of failing QA when too long (check long kickers by eye); in H3 the
  museum's beige AI plates sit oddly against sky panels; H2 posters shrink image-led covers by ~150–200 px.
- DL4 tier-list detail slides credit "box art: Ravensburger unless noted" rather than Puzzle · Brand per row (as DL3).

## Small open questions for the owner

- Ghost with eye holes (F3 Halloween) OK under the no-faces rule? Does the cat cartoon read clearly?
- Puzzle Atlas: OK with the 10× threshold for a country's "signature" puzzle? Tier list cut-offs 60/65/70 min OK?
- Reels: silent with burned-in text, or add sound (SFX / royalty-free music)?
- Spirit animals: is the cute pastel style right for MSP?
- Monthly "active puzzlers" definition to publish (logging-based vs the app's community stats).
- Giveaways per year (default: 2–3, tied to events). Does Advent count as one? (morning list)
- GA4 access for measuring Instagram → website (service account) and a `/ig` landing page with per-post links?

## Weekly Numbers (added 2026-10-18)

- [ ] Mon 19 Oct: owner picks RC1 or RC2 (per-slide feedback welcome), `node tools/draft.ts weekly-rc<N>` with fresh data, approve for 19:00, reject the other.
- [ ] Owner question: should the shoutout draw only pick puzzlers with an Instagram handle (taggable, more reshares) or everyone (fairer, current default)?
- [ ] Brand photo tags on the most-solved slide (standing rule: tag brands whose boxes are shown) need brand → Instagram handle mapping.
- [ ] Rotating segments for later episodes (research: 3 fixed + 2 rotating): puzzle of the week spotlight, country spotlight, "this week in 2025", guess the number,
      **events of the week** (week 43 had ~10 competitions on MSP: state championships, marathons, online events; needs a query with the public-event rules).
- [ ] Ep. 2 published 26 Oct: insights at +48 h (Wed 28 Oct); Story posted by the owner.
- [ ] Brand handles map (`speedpuzzle.eu` verified, `ravensburgerglobal`; Speedmaster unknown) so the builder tags slide 2 itself (added by hand in ep. 2).
- [ ] Story follow-up for the episode (e.g. the shoutout slide as a Story with the three tagged).
- [ ] **(failed twice now, ep. 1 and ep. 2)** Publisher: check photo tags before creating the real containers (one unpublished test container per new handle, cache the
      result in `content/ig-invalid-handles.json`) and drop rejected ones with a note, so a stale handle on an MSP profile
      never blocks a publish (ep. 1 failed once on 2 of 13 handles, 2026-10-19).
- [x] Animated weekly Story (2026-10-19): `src/motion/` kit + `tools/motion.ts weekly <id>`; Recaps highlight cover
      `content/highlights/highlight-recaps-loop.jpg` (↻); 15 s with off-canvas box rain and the L1-3 logo stopwatch (`src/motion/logo.ts`, still imports `lab/logo/shared.ts`: promote it). Next: reuse the kit for Reels and
      fold `lab/dl4/reels/render.ts` onto `src/motion/render.ts`.
- [ ] Story insights for the Week 42 Story before it expires (Tue 20 Oct ~16:00): views, taps forward/back, exits, link taps.
- [ ] Recaps highlight cover: owner disliked ↻; pick from `tools/highlight-covers.ts recaps:@bars|@days|@line|@calendar` (Claude: @bars).
- [ ] Sound effects baked into the weekly Story (CC0: clicks on piece snaps, whoosh on poster, ticks on count-up, box thuds,
      stopwatch tick + ding, slot whirr), mastered to ~−14 LUFS; owner may still add a Music sticker on top.
- [ ] Weekly Story template: consider moving the cue/sticker zone up ~150 px (bottom centre is Instagram's delete zone).

## Missing-piece Reel (published 2026-11-05 00:24)
- [ ] Insights at +24 h (Fri 6 Nov ~00:30) and +48 h (Sat 7 Nov ~00:30): sends, saves, retention, skip rate, non-follower reach vs the
      1000-vs-500, clock, grind and October Reels; first humour Reel and first AI paper-cut art: record in editorial/learnings.md.
- [ ] Answer comments ("where did your missing piece turn up?"): good candidates for a follow-up post.
- [ ] Paper-cut style as a reusable kit: move the MP1 runner (content/labs/MP1/run.ts, gitignored) into lab/ or tools/ with the
      I2 prompt recipe (no puzzle words), so future Reels can order plates in one command.
- [ ] Owner question: posting time. This one went out at 00:24 (outside the 19:00–22:00 window); compare its first-hour reach.

## Median audit (2026-11-07)
- The site's median = each puzzler's best time on a puzzle counts once (`puzzle_statistics.median_time_solo`); the tier
  list now follows it (`tier-subjects`, `tier-hell`, rule in `editorial/standing-feedback.md`). Older queries take a
  median over every logged solve: check each `percentile_cont` query before its next use (weekly median: done 9 Nov,
  `quiz-postcards`, `reel-1000-vs-500`, `about-*`, `solo-distribution`) and switch per-puzzle numbers to the site's rule.

## After the tier list (2026-11-07)
- Insights at +48 h (Mon 9 Nov ~10:40): comments (HELL nominations: reply with each nominee's median from its puzzle
  page, fresh), saves, shares vs the carousel median. If nominations come in, a follow-up "Your HELL nominations" post.
- Unused today, kept: "we're all getting faster" (`bs-yearly-speed`, re-check with the per-puzzler rule), country PB
  atlas (not on a championship day of a low-ranked country), night owls (thin), 300M pieces ~16 Nov (E1 night-ocean plate).
- `bs-theme-speed` / `boxes-subject-speed` count every solve: don't reuse their medians.

## 2026-11-12: pile of shame
- [x] Published 12 Nov ~02:20 Prague: https://www.instagram.com/p/Dfn2uDhCG9G/
- [x] Pin verdict (+48 h check, 14 Nov): **keep all three pins** (Start here, postcard quiz, WJPC). The carousel beats the
      median (reach 1725 vs 1280, sends 18 vs 7) but carries exact, drifting numbers (evergreen rule) and converts
      poorly (4 follows vs 32–69 on the pins). No app steps needed.
- [ ] Optional: a "between" shelf with denser natural cobwebs if the subtle webs read too quietly on phones (SH1, ~8 min ComfyUI).
- [ ] Optional Story follow-up: the mystery box ("??% unsolved") as a teaser pointing to the post.
- [ ] Insights at +24/+48 h: sends and comments ("What's been waiting on your shelf the longest?").
- [x] Reel "I will solve it this weekend" published as a Trial Reel 12 Nov 12:22 Prague: https://www.instagram.com/reel/Dfo77FvN163/ (draft `2026-11-12-reel-shelf`, linked).
- [x] Teaser Story for followers posted by the owner 12 Nov ~12:34 Prague (link sticker "SEE THE NUMBERS" to the carousel, the Reel's music).
- [x] Story insights read at +23 h by the unattended check (13 Nov): reach 401, views 506, 2 replies, 0 shares, 284 taps
      forward, 129 exits (25 % of views), 11 back, 28 swipes to the next account.
- [ ] Owner: read the Story's **link taps** in the app (archive → Insights; the API has no link-tap metric) and check
      it is in the "Did you know" highlight; Claude adds both to `editorial/learnings.md`.
- [x] +24 h check done 13 Nov 11:41 → `content/reports/pile-of-shame-check-24h.md`. Trial Reel at +23 h: reach 84,
      avg watch 3.1 s of 42.7 s, skip rate 78 %, no likes/comments/sends/saves (API returns Trial stats; October Trial
      lifetime: 167 reach, 81.5 % skip). Carousel at +33 h: reach 1282 (median 1280), 44 comments, 11 sends, 3 saves,
      3 follows. No +24 h snapshots exist for older Reels (pulls were irregular before 12 Nov), so no same-age comparison.
- [ ] **Trial Reels open too slowly for strangers** (2 of 2 lose ~80 % in the first 3 s vs 42–63 % on follower Reels; a
      hunch at n = 2): next Trial opens on motion with the payoff in frame 1, no splash card; then run the outro test.
- [x] Carousel comments from the +24 h report: answered by the owner 13 Nov ~13:00 (incl. the $6/month price note).
- [ ] 4 newer comments (13 Nov evening) with proposed replies in `content/reports/pile-of-shame-check-48h.md`: owner
      approves and posts. One puzzler promised to send their to-do spreadsheet by DM (count it for the spreadsheets
      Story; never confirm or compare whose pile is biggest).
- [x] +48 h check done 14 Nov 12:33 → `content/reports/pile-of-shame-check-48h.md`. Carousel at +58 h: reach 1725
      (1.35× median, +35 % on day 3 after the batch of replies), 60 comments, 18 sends (1.04 % of reach), 4 saves,
      4 follows. Trial Reel at +48 h: reach 89, skip 78.4 %, avg 3.0 s, no interactions: finished.
- [x] Learnings entry for the pile-of-shame set written (14 Nov).
- [x] **Automatic checks ran (both reports in `content/reports/`; tell the owner at the next session):** `check-shelf24` Fri 13 Nov 11:41 (Story before it expires, Reel +24 h, carousel) → `content/reports/pile-of-shame-check-24h.md`; `check-shelf48` Sat 14 Nov 12:33 (Reel +48 h, carousel, pin verdict) → `content/reports/pile-of-shame-check-48h.md`. Read both at the next session and tell the owner.
- [x] Regular evaluation (owner 12 Nov): twice-daily pull, weekly review (Mon 07:20), monthly review (1st 07:40) and the Insights page in the review app are installed. First weekly review Mon 16 Nov, first monthly Tue 1 Dec: read them with the owner.
- [ ] Insights page follow-ups: tidy the tags on old drafts (series/mechanic spelt consistently) so the group tables are cleaner; a small growth chart per post once a few weeks of twice-daily snapshots exist.
