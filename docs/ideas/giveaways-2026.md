# Giveaways and campaigns: 11 ideas and a recommendation (2026-10-17)

Brainstorm for the owner's giveaway question, next to his Advent of Puzzle idea (designed in
[`advent-of-puzzle.md`](advent-of-puzzle.md)). Evidence: `research_notes/MSP Instagram design and growth toolkit/
giveaways_and_advent_2026.md`. Numbers are aggregates from cached read-only queries (dates in place); re-query
before anything is posted. No member data.

What we know going in: the September 2026 giveaway was the account's best post ever (4.4k reach, ~70 % non-followers,
359 comments, 60 follows); contests brought 43 % of all follows in 2025–26; but giveaway followers churn (61 % gone
within two weeks in the one measured case), Instagram's recommendation rules have excluded contest posts (today's text
no longer names them; sources conflict, research §3.2), Meta's spam policy forbids prizes in exchange for likes or
follows, and our growth note caps giveaways at about three a year, tied to events. Verifiability rules everything: the API can read comments and DM replies
(including Story replies) but not likes, follows of commenters, shares or sticker votes; MSP's own database can verify
real puzzling.

## Recommendation

1. **Run Advent of Puzzle in December** as the year's flagship (owner's idea; designed and prototyped).
2. **Before it, in early November: "Guess the day: 300 million pieces"** (idea 2): one public Story, answered by Story
   reply, no or tiny prize. It is timely (the pace projects ~20 Nov, queried 17 Oct), it's MSP-only data, and above
   all it is a **public dry run of the exact Advent pipeline** (reply route, collector, matching, audit) with real
   followers *and* non-followers, three weeks before the stakes are real. The Close Friends test can't cover
   non-followers or message requests; this can. Prototyped: AD1 section "Recommended: 300M guess", a `date` key type
   in `src/campaign/`.
3. **In 2027: the Weekend Challenge** (idea 3) as the evergreen, prize-free weekly ritual with an occasional prize
   weekend; it's the most verifiable format (logged on MSP) and grows the product, not just the account.

## The ideas

Effort: S = under a day with what exists, M = 1–3 days, L = needs an MSP web/app feature. Verifiability: how sure we
can be that an entry is real and correct.

| # | Idea | Mechanic | Needs | Verifiable? | Effort | Expected effect |
|---|---|---|---|---|---|---|
| 1 | **Advent of Puzzle** (owner) | 24 Story doors Mon–Sat, reply A/B/C by DM; Sunday seeded draw among correct answers, voucher | 4 vouchers, rules page, collector (built), test Story | High: DMs carry sender, time, Story id; private (no copying) | M (built) | Daily Story habit through December; replies are a ranked Story action; feed stays at 4/week; follows spike like Sep but smaller per week |
| 2 | **Guess the day: 300 million pieces** (recommended next) | One Story: "on which day do we pass 300,000,000 pieces?" reply with a date; the closest guess gets a shout-out (or a small prize) on the milestone post | Pace query (exists), `date` key (built) | High (DM); the answer comes from our counter | S | Collective milestone + a stake in it; dry run of the Advent route with non-followers; feeds the milestone post (sends) |
| 3 | **Weekend Challenge** (backlog) | Saturday 10:00 names one puzzle (e.g. the one sitting unsolved on the most MSP shelves: 75 copies, `challenge-shelf-candidates`); everyone who logs it Sat–Sun on a public profile is in; Monday's Weekly Numbers shows the board and, on prize weekends, a draw | Two queries (written), MSP account | **Highest**: a logged, non-suspicious result on MSP; fake Instagram accounts don't help | M | Drives logging and collections (the product); weekend = 37 % of results; last weekend's most-logged puzzle had 44 puzzlers unprompted |
| 4 | **Event prediction** (EJPC, WJPC, nationals) | "Guess the winning time of the final" by Story reply before the event; the closest wins | Event dates, past winning times | High (DM, official result) | S | Event-tied (fits the ≤ 3/yr cap); recency peak; collab ask to organisers |
| 5 | **Partner brand co-hosted giveaway** | A Collab post with a brand (their puzzle as prize); entry = answer a data question about their puzzles in a reply or comment | A brand partner (Ravensburger, speedpuzzle.eu, Anatolian …) | High (DM/comments) | M (partner talks) | Reach "upward" through the brand's followers (collabs favour the smaller partner); brand tagged and credited |
| 6 | **Share your MSP card** (PB card / Wrapped) | Share your MSP share card to your Story tagging @myspeedpuzzling; every tag = one entry | Share cards on MSP (backlog: XP card concept, Wrapped) | High: tags arrive as `story_mention` DMs (worked in Sep); private accounts may not arrive | L (MSP feature) | Best non-follower spread: friends of players see MSP; identity mechanic (Strava/Wrapped-style). Good for January ("your 2026 in puzzling") |
| 7 | **Milestone ticket: the 600,000th result** | Everyone who logs a result on milestone day (≈ 27 Nov, `bs-milestone-pace`) is in a draw (not the exact 600k-th result: that invites spam logging) | Milestone query; MSP | High (DB) | S | Collective moment + product use; but lands on the EJPC weekend (crowded) |
| 8 | **Community goal unlock** | "If the community logs 10,000 results this week, we give away 3 vouchers"; one draw among that week's public loggers | Weekly totals (exists) | High (DB, aggregate) | S | Collective identity; Monday recap closes the loop; risk: a missed goal reads as failure, so set it from the pace |
| 9 | **Mystery puzzle week** (a short Advent for the summer) | A box image revealed piece by piece over 6 days (the AD1 reveal device); name it by Story reply | Box image, generator, collector | High (DM) | S (reuses Advent) | Summer engagement dip filler; tests the reveal device again |
| 10 | **Streak challenge in January** | Log a result on 7 different days in the first two weeks of January; finishers are in a draw | Streak query on results | High (DB) | S–M | New-year habit; product retention; prize optional |
| 11 | **Caption / funny-fact contest (no prize)** | Story question sticker "your puzzle superstition?"; best ones become a funny-facts post, credited | Question sticker (manual reading in the app) | Low (app only) | S | Community content source; not a giveaway, so outside the cap |

## Why the 300M guess beats the others as the next step

- **It de-risks Advent.** It exercises the reply route, message requests from non-followers, the collector, matching,
  the audit and the public announcement on one real Story, with nothing at stake if something breaks.
- **It costs nothing extra** to build (the Advent collector + a date key) and fits the milestone post we'd make anyway
  (`docs/ideas/brainstorm-2026-10.md` D3/D4).
- **It's honest data:** the answer is our own counter on the day; no outside facts.
- Its risk: the date drifts as the pace changes (13 Oct → 25 Nov, 17 Oct → 20 Nov), which is the fun of it; the rules
  say "the day the counter passes 300,000,000 in Prague time, as shown on the milestone post".

## Design of the 300M guess (prototype)

- **When:** Story up Mon 2 Nov 19:00, replies open until Sun 8 Nov 19:00 (a week, so the Story is re-shared on
  Thu 5 Nov as a reminder frame; replies to either frame count). The milestone post goes out on the crossing day
  (~20 Nov, re-checked daily from 13 Nov with `bs-milestone-pace --fresh`).
- **Answer:** a date by Story reply ("25 Nov", "25.11.", "Nov 25" all work). First reply counts. The closest date wins;
  ties go to the earliest reply.
- **Prize:** a shout-out on the milestone post and Story (handle tagged with consent under the rules), optionally a
  1-month MSP membership. If it carries a prize, it's one of the year's giveaways.
- **What it tests for Advent:** DM replies from non-followers (requests), Story id matching, the 20-message limit on
  busy threads, date parsing, the public audit, and how many people answer a Story at all (sets the Advent
  expectations).
