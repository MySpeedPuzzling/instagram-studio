# Backlog

Build and ops work for the pipeline. Content ideas live in `docs/ideas/` (public, aggregates) and
`content/ideas/backlog.md` (local). Tick items off here when done; add new ones at the right priority.
Updated 2026-10-17.

## Now

- [ ] **Achievements launch Reel** (`docs/ideas/reel-achievements.md`): 5 new badges, Reel + link Story. Blocked on the
      final art for the 5 new badges and the release date (app session reports both). Then: lab of key frames → owner
      picks a look → builder → render on release day.

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
- [ ] Reels audio decision and pipeline (silent / SFX from Freesound CC0 / royalty-free bed; licence ledger).
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
