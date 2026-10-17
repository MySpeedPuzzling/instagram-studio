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
and box images. **Everything must be verifiable and automatable by Claude Code and the Instagram API**: collecting
entries (comments, messages or anything else that works), checking answers, the draw, and an audit trail.

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
2. **Answer channel design: fair, verifiable, automatable.** Compare:
   - **Comments:** visible, so people can copy answers. Can they be hidden automatically on arrival?
   - **DMs:** keyword answers, private, need the messaging permission.
   - **A Story quiz/poll sticker:** can results be read via the API?
   - **An answer form on myspeedpuzzling.com:** checkable in our own database (read-only), brings traffic, needs an
     MSP account; would need a small feature in the MSP app, which is a different repo.
   - A hybrid.

   For each: fairness (copying, multiple accounts), friction, reach effect (comments help ranking), what can be fully
   automated, and the build effort.
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
- **The answer channel and deadline per quiz,** and what counts as one valid entry: a per-week correct-answer
  threshold (e.g. at least 4 of 6, or every quiz an extra ticket); de-duplication; exclusions (MSP team, private or
  fake accounts).
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

## 6. Automation prototype (read-only)

Build `tools/campaign.ts` (or `src/campaign/`). For a given post or week it should:
- collect entries from the API (paginated, with timestamps);
- normalise and check answers against the quiz's answer key, applying the deadline and exclusions, and de-duplicate;
- produce the list of eligible entrants;
- run the seeded draw and write an audit log (JSON + a human-readable summary) into a local, gitignored folder;
- have tests for the matching and the draw.

**Test it read-only on our existing posts' comments.** In this session do **not** reply, hide, delete, send messages
or publish anything. Those actions need my explicit approval later. If a permission is missing, document what to
request and how; don't work around it.

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
    page, MSP feature if chosen, a test run).
  - Write a short next-session prompt and commit.
- Give me a short summary with the gallery link (LAN URL with the review token) and the decisions you still need from
  me.
