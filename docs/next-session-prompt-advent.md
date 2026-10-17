# Prompt: giveaways and the "Advent of Puzzle" campaign

Copy everything below the line into a fresh Claude Code session started in this repo.

---

Read `docs/STATUS.md`, `docs/decisions.md`, `editorial/standing-feedback.md` (apply all of it), `docs/backlog.md`,
`editorial/learnings.md`, and the research notes in `research_notes/MSP Instagram design and growth toolkit/`
(especially `growth_strategy_2026.md`, `virality_novelty_experiments.md`, `story_dimensions_2026.md`) and
`research_notes/MSP Instagram content pipeline/` (giveaway and account-audit notes). Our September 2026 giveaway was the
account's best post (4.4k reach, 359 comments). House style H4 is decided (`HOUSE` in `src/design/house.ts`); the
"Which is faster?" quiz builder (`src/posts/faster.ts`, `tools/draft.ts`) is the pattern for new post types.

Goal of this session: **brainstorm giveaways and design the "Advent of Puzzle" campaign**, so it can run in December
and be checked and automated end to end by Claude Code and the Instagram API.

## The campaign idea (mine)

- Four Advent weeks (Advent 2026 starts Sunday 29 Nov; the weeks run up to Christmas). Each week: a quiz on
  **Monday to Saturday (days 1–6)**, and on **Sunday** we draw one winner among everyone who answered that week's
  quizzes correctly, for a voucher. Four rounds: 4 × (6 quizzes + 1 draw).
- It runs alongside our normal posts and has to fit the long-term strategy (weekly rhythm, value, not slop).
- Quizzes in the house style, built from MSP data and box images (guess the puzzle from pieces, which is faster, guess
  the time, zoom crops, odd one out, …). I want a few visual variants in H4 to compare.

## What I need from you

1. **Research first (parallel agents are fine), with sources:**
   - What the Instagram API (Instagram Login, our token) can do for this: read comments with timestamps and
     usernames, hide or reply to comments, private replies, DMs and their permissions
     (`instagram_business_manage_comments`, `instagram_business_manage_messages`), webhooks, rate limits, app review.
     Check which scopes our current token actually has (`node tools/ig-token.ts status`; never print the token).
   - How to collect answers fairly and verifiably: comments (answers are visible, so others can copy them; hiding
     comments via the API?), DMs (keyword answers), or answers on myspeedpuzzling.com (verifiable in our own DB, and it
     brings people to the site). Compare effort, fairness, reach and what can be fully automated.
   - The rules: Meta's promotion guidelines, EU/Czech giveaway law (official rules, eligibility, age, no purchase
     necessary, prize tax/vouchers), what we can and can't require (following can't be verified by the API).
   - What works for giveaways and advent-style campaigns in niche communities (participation, reach, follower growth,
     fatigue), and whether daily quizzes for 4 weeks fit next to the normal posts (posts per day, Stories vs feed).
2. **Brainstorm** 8–12 giveaway and campaign ideas (Advent of Puzzle and others, e.g. tied to events, milestones,
   the weekend challenge), each with mechanic, effort, verifiability and expected effect; recommendation first.
3. **Design Advent of Puzzle in detail:** daily quiz types (24 quizzes, all answerable and checkable from MSP data),
   difficulty curve, answer channel, deadline per quiz, how a correct entry is defined, the Sunday draw (a seeded,
   reproducible random draw with an audit log we can publish), winner announcement and contact, exclusions (MSP team,
   duplicates, private or fake accounts), prize handling, and how it sits in the weekly rhythm with the normal posts.
4. **Prototype the visuals** in a new lab gallery (house style H4, real cached data, per-slide Works / Unsure / No-go):
   a few variants of the daily quiz post, the answer reveal, the Sunday draw/winner post, the campaign announcement,
   and the Story frames (with room for stickers, per `story_dimensions_2026.md`). QA 0 errors; check contact sheets.
5. **Prototype the automation, read-only:** a tool (e.g. `tools/campaign.ts`) that collects entries for a post from the
   API, normalises and checks answers, applies the deadline and exclusions, de-duplicates, draws a winner with a
   published seed, and writes an audit log; test it read-only on our existing posts' comments. Don't send messages,
   reply, hide comments or publish anything; that needs my approval.
6. Ask me only for real decisions, interactively, with your recommendation first (prize, answer channel, rules,
   schedule). Record decisions in `docs/decisions.md`, put the campaign plan in `docs/ideas/advent-of-puzzle.md`,
   update `docs/STATUS.md` and `docs/backlog.md`, and commit. No member data in committed files.
