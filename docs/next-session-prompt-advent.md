# Prompt: giveaways and the "Advent of Puzzle" campaign (full research + design + prototypes)

Copy everything below the line into a fresh Claude Code session started in this repo.

---

You drive this whole job yourself and orchestrate it: **use parallel subagents (or a multi-agent workflow) for the
research and the prototypes**, and come back to me only for real decisions, asked interactively with your
recommendation first. Explain anything technical in plain words.

## 0. Context to load first

Read, in this order: `CLAUDE.md`, `docs/STATUS.md`, `docs/decisions.md`, `editorial/standing-feedback.md` (my standing
rules: apply all of them), `docs/backlog.md`, `editorial/learnings.md`, `docs/runbook.md`, and these research notes:
`research_notes/MSP Instagram design and growth toolkit/` (`growth_strategy_2026.md`, `virality_novelty_experiments.md`,
`story_dimensions_2026.md`, `captions_voice_hashtags.md` §9, `hashtags_2026.md`) and
`research_notes/MSP Instagram content pipeline/` (growth strategy, account audit, anything on giveaways). Then look at
the code you'll build on: `src/design/house.ts` (house style **H4** = `HOUSE`: the first slide is a two-piece puzzle
poster, the rest the navy board; deep navy, white/grey text, purple kickers, coral highlights, poster colour by post
type), `src/posts/faster.ts` + `tools/draft.ts` (the "Which is faster?" quiz builder: fresh facts → slides with a QA
gate → caption + alt text → draft; Story follow-up frames), `src/publish/publish.ts` (publisher, photo tags),
`src/ig/api.ts` (Instagram client), `src/data/db.ts` + `queries/` (read-only production data, cached), `lab/dl4/` and
`lab/dl1/gallery.ts` (lab galleries with per-slide feedback).

Facts to keep in mind: our September 2026 giveaway was the account's best post (4.4k reach, 359 comments); the
community solves most on weekends (Sat + Sun ≈ 37 % of results); followers are most online 19:00–22:00 Prague; the
first pipeline post (a "Which is faster?" quiz) went out on 17 Oct 2026.

## 1. The campaign idea (mine)

**Advent of Puzzle**: four Advent weeks in December 2026 (Advent starts Sunday 29 Nov). Each week a quiz on
**Monday to Saturday (days 1–6)**; on **Sunday** we draw one winner among everyone who answered that week's quizzes
correctly, for a **voucher**. Four rounds: 4 × (6 quizzes + 1 draw). It runs alongside our normal posts and must fit
the long-term strategy (weekly rhythm, real value, never slop). Quizzes are in the house style and built from MSP data
and box images.

How answering should work (my preference):
- **People answer via the day's Story.** Each quiz day has a Story (it disappears after 24 h, which is fine and
  even better). Answers don't need to be hidden; comments on a feed post are an acceptable fallback.
- **Every day, before the Story expires, Claude Code collects the answers and saves the list of users who answered
  correctly** (a local store, an audit trail per day).
- **On Sunday, Claude Code draws the winner from the week's saved lists.** Eligibility is my decision; propose the
  options with a recommendation, e.g. only people with all 6 correct, everyone with at least one correct, or one
  ticket per correct answer.
- **The whole flow must be automatable and driven by Claude Code:** scheduled jobs on this Mac collect every day and
  prepare the Sunday draw; I only approve what gets published.

## 2. Research (parallel agents, sources with URLs and dates, evidence vs opinion labelled)

Run these as separate research agents at the same time:

1. **Instagram API capabilities for a giveaway**, with the API we use (Instagram API with Instagram Login,
   graph.instagram.com):
   - reading comments and replies on our media (fields: text, timestamp, username/user id, pagination, limits);
   - hiding/unhiding, deleting and replying to comments; private replies to commenters;
   - messaging (DMs): receiving messages, keyword answers, replying, the 24-hour window, ice breakers;
   - webhooks (comments, mentions, messages) vs polling; rate limits; which permissions each needs
     (`instagram_business_manage_comments`, `instagram_business_manage_messages`, …) and whether Meta app review
     is needed;
   - what our current token has. Check it without ever printing the token (`node tools/ig-token.ts status`, or a
     debug call whose output is redacted).
   - Whether "follows us", "liked" or "shared to Story" can be verified at all; if not, the rules must not require
     them.
2. **The Story answer channel: what is actually automatable.** This decides the design, so verify it first.
   - **Sticker answers:** can the API read *who* answered a Story **quiz, poll or question sticker**, and what
     they answered? As far as we know, Story insights give only aggregate numbers and the voter list is visible
     only in the app; confirm or correct this with sources.
   - **Story replies:** replies to a Story arrive as Instagram direct messages. Through the messaging API, with the
     `instagram_business_manage_messages` permission, can we read them, with the sender, the time and which Story
     they replied to? With webhooks or by polling? For how long are they available?
   - **Other routes:** a "reply with your answer" Story; a link sticker to a feed post where people comment;
     a link to an answer form on myspeedpuzzling.com (checkable in our own database, read-only, needs a small MSP
     feature in another repo).
   - **For each route:** fairness (multiple accounts, guessing), friction for players, reach effect, what can be
     fully automated, what has to be collected within 24 h, and the build effort.
   - **Verify on the real account before designing.** Ask me to post a **test Story to Close Friends only**, with a
     poll sticker, a quiz sticker and the text "reply with a word". Give me exact step-by-step instructions (which
     sticker, what text, where to place it). After a friend and I answer, read via the API what we can actually get.
     Read-only: don't reply, don't send messages.
3. **Rules and law:**
   - Meta's promotion guidelines: official rules, the release statement that Meta isn't involved, no tagging
     requirements.
   - EU and Czech law for consumer contests: rules document, eligibility, age, no purchase necessary, data protection
     (GDPR: what we store, how long).
   - Prize and voucher handling (who supplies the vouchers, tax), winner contact and deadlines, international
     participants.
   - A draft of the official rules text.
4. **What works:** giveaways and advent or daily-challenge campaigns in niche hobby communities (puzzles, board
   games, chess, speedcubing, running clubs):
   - participation and drop-off over 24 days;
   - reach and follower effects, and churn after giveaways;
   - fatigue, and how often daily posting is fine;
   - feed posts vs Stories for daily quizzes;
   - how winners are announced and trust is built (a published seed, a live draw).

   Also brainstorm other giveaway formats: tied to events, milestones (e.g. 300 million pieces), the weekend
   challenge, partner brands.

Write the findings to `research_notes/MSP Instagram design and growth toolkit/giveaways_and_advent_2026.md` (concise,
tables, sources).

## 3. Brainstorm and recommendation

8–12 giveaway and campaign ideas, Advent of Puzzle included. For each: the mechanic, what we need (prize, partner,
feature), how verifiable it is, the effort, and the expected effect on reach, participation and followers. Give a
clear recommendation first and ask me to choose (interactively).

## 4. Detailed design of Advent of Puzzle

Write `docs/ideas/advent-of-puzzle.md` (no member data):
- **Calendar:** the real dates for all 4 weeks: which days carry a feed post vs a Story, at what time, and how it fits
  with the normal posts. Make the Monday Weekly Numbers and the advent quiz coexist; follow the frequency research
  (e.g. two carousels on one day is a no).
- **24 quiz ideas,** each answerable and checkable from MSP data or box images, with a difficulty curve, the query
  each needs (aggregate only, suspicious results and private profiles excluded) and how the correct answer is defined
  (exact or tolerant matching, e.g. a time within ±1 minute or a puzzle name with typos).
- **The answer channel per quiz** (the Story route the verification proved), the deadline (the Story's 24 h, or
  earlier), and the daily collection: what is saved, when the scheduled job runs, and what happens if a run fails
  before the Story expires (retry, alert).
- **What counts as a valid answer:** exact or tolerant matching, one answer per person per quiz, the first answer
  counts. Weekly eligibility options for me to choose from: all 6 correct / at least one correct / one ticket per
  correct answer. De-duplication and exclusions (MSP team, obviously fake accounts).
- **The Sunday draw:** a reproducible random draw (e.g. a seed published before the deadline, or derived from
  something public), an audit log we can publish, the winner announcement post/Story, winner contact and the deadline
  to claim.
- **Prize handling, the official rules text, the GDPR note,** and what happens if nobody or few enter.

## 5. Visual prototypes (new lab gallery, house style H4)

Build a lab (e.g. `lab/advent/`, gallery `content/labs/AD1/`, linked in the lab navbar `src/review/nav.ts`) with real
cached data, per-slide Works / Unsure / No-go, QA 0 errors, and contact sheets you've checked yourself:
- 3–4 visual variants of the daily quiz post (several quiz types), the answer reveal, the campaign announcement, the
  Sunday draw/winner post, and a "day N of 24" device that runs through the campaign;
- the Story frames, with real room for stickers (bands and sticker sizes in `story_dimensions_2026.md`; a 3-option
  poll is ~600 px tall), plus guide images with life-size stickers;
- a mock profile grid of one advent week mixed with the normal posts, so I can judge the feed.

Follow every rule in `editorial/standing-feedback.md`:
- H4, data plus visuals together;
- only generator puzzle pieces, and box images credited;
- tag and credit brands;
- 3–5 topic hashtags on the last line;
- the friendly, data-driven voice.

## 6. Automation prototype (Claude-Code-driven, read-only for now)

Build `src/campaign/` + `tools/campaign.ts` (with tests) for the full loop:
- **`collect <day>`:** reads the day's answers through the verified channel (Story replies via the messaging API,
  or comments as the fallback); normalises and checks them against the day's answer key (tolerant matching);
  stores every entry and the list of correct users in a local, gitignored store (e.g. `content/campaign/advent-2026/`
  or SQLite); writes a daily audit file. Idempotent: running it twice gives the same result.
- **`week <n>`:** combines the six days, applies the eligibility rule I choose, and shows the pool.
- **`draw <n>`:** a reproducible seeded draw; the seed is fixed and published before the draw. It writes the audit
  log (JSON + a readable summary) and drafts the winner post for my approval.
- **Scheduling:** a launchd job that runs `collect` every day well before the Story's 24 h run out (with retries and a
  clear failure note), and prepares the Sunday draw. Install it only with my go-ahead, and give me the exact commands.

Test everything read-only: on our existing posts' comments, and on the test Story from research track 2 if I've
posted it. In this session do **not** reply, hide, delete, send messages or publish anything; those actions need my
explicit approval. If a permission is missing, document exactly what to request and how; don't work around it.

## 7. Rules for this session

- Production database: read-only role only, `EXPLAIN` first on big tables, aggregate queries, suspicious results and
  private profiles excluded everywhere (the `src/data/queries.test.ts` guard must pass).
- Public repository:
  - Secrets stay in `.env`; never print a token.
  - No usernames, member data, entries or audit logs in committed files: they go to gitignored `content/`.
- Heavy local jobs (ComfyUI, big video renders) only with my go-ahead. HTML/SVG renders are fine; log resources as
  usual.
- `npx tsc --noEmit` clean, `npm test` passing.
- At the end:
  - Record my decisions in `docs/decisions.md`, add lasting rules to `editorial/standing-feedback.md`.
  - Update `docs/STATUS.md` and `docs/backlog.md` (with what's needed before 29 Nov: permissions, prize, rules
    page, MSP feature if chosen, the launchd job, and a full dry run on a test Story).
  - Write a short next-session prompt and commit.
- Give me a short summary with the gallery link (LAN URL with the review token) and the decisions you still need from
  me.
