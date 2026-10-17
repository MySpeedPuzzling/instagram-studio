# Advent of Puzzle 2026: detailed design

The owner's campaign idea (2026-10-17), designed for December 2026. **Four Advent weeks; Monday to Saturday a puzzle
quiz behind a numbered "door"; on Sunday one winner is drawn from everyone who answered that week's doors correctly,
for a voucher.** 4 × (6 doors + 1 draw) = 24 doors. It runs alongside the normal posts and has to fit the long-term
strategy: a weekly rhythm, real value from MSP data, never slop.

Status: **design + prototypes, nothing decided beyond the owner's frame.** Open choices are on the morning list
(`docs/advent-morning.md`) with a recommendation each. Evidence: `research_notes/MSP Instagram design and growth
toolkit/giveaways_and_advent_2026.md`. Visual prototypes: lab **AD1** (`lab/advent/`). Automation: `src/campaign/` +
`tools/campaign.ts`. This file holds no member data and **no answers**: every door's numbers are queried fresh on its
day (owner rule) and its answer key lives only in the gitignored `content/campaign/advent-2026/keys/`.

## 1. How it works in one paragraph (the player's view)

Every evening at 19:00 (Prague) a new door opens in our Story: one question from MySpeedPuzzling's data or a box
image, with options A, B, C (sometimes a number or a name). You **reply to the Story** with your answer. It's private,
so nobody can copy it. You have until the next door opens (24 h). Each Sunday we draw one winner from that week's
correct answers, in a draw anyone can check, and announce the answers and the winner in our Story; the winner then
messages us to claim (we never DM winners first). No purchase, no following, liking, tagging or sharing required
(Instagram can't verify those, and Meta's rules forbid prizes for engagement and inaccurate tagging). Free, 18+.

## 2. Calendar

Times are Prague (CET, UTC+1 in December). The Advent Story set goes up at **19:00** every day (start of the
followers' 19–22 h peak) and runs 24 h.

| Week | Doors (Story, 19:00) | Draw + recap (Sunday) | Normal feed posts that week (rhythm from `growth_strategy_2026.md`) |
|---|---|---|---|
| Launch | — | — | **Thu 26 Nov 19:00** announcement carousel (before the European championship weekend, 27–29 Nov); countdown Story Thu–Sun; reminder Story Sun 29 Nov (1st Advent) |
| 1 | D1 Mon 30 Nov · D2 Tue 1 Dec · D3 Wed 2 · D4 Thu 3 · D5 Fri 4 · D6 Sat 5 | Sun 6 Dec | Mon 30 Nov Weekly Numbers; Wed/Thu data story; Fri rotating |
| 2 | D7 Mon 7 · D8 Tue 8 · D9 Wed 9 · D10 Thu 10 · D11 Fri 11 · D12 Sat 12 | Sun 13 Dec | Weekly Numbers; **MSP Wrapped 2026** as the midweek data story (moved from week 1 so launch week isn't crowded); Fri rotating |
| 3 | D13 Mon 14 · D14 Tue 15 · D15 Wed 16 · D16 Thu 17 · D17 Fri 18 · D18 Sat 19 | Sun 20 Dec | Weekly Numbers; data story; Fri rotating |
| 4 | D19 Mon 21 · D20 Tue 22 · D21 Wed 23 · D22 Thu 24 · D23 Fri 25 · D24 Sat 26 | **Sun 27 Dec** (final) | Weekly Numbers Mon 21; one data story Wed 23; no Fri post (Christmas) |
| After | — | — | Mon 28 Dec Weekly Numbers closes the loop ("24 doors in numbers": participation, hardest door) |

**What goes where:**
- **Doors are Stories, not feed posts.** 24 daily feed posts would double the feed rate for a month; the research caps
  same-day feed posts and warns about fatigue; Stories carry their own content and many Stories a day no longer hurt
  reach (growth note §1.3). The 24 h life of a Story *is* the door's deadline.
- **One Story set per evening:** frame 1 = yesterday's answer (from D2), frame 2 = today's door. Sunday: Saturday's
  answer, then the winner and the revealed draw seed, then a pointer to the recap post.
- **One Advent feed post per week:** the **Sunday recap carousel** at ~19:30 (after the draw): the six answers with
  their numbers and box images, the share of correct answers per door, the winner, how the draw works. It replaces
  the Saturday community slot for those four weeks; the weekly feed count stays at 4.
- **Never two carousels on one day.** Monday has Weekly Numbers (feed) + the door (Story): different surfaces, fine.
- **Christmas:** last December, results on 24 Dec were ~30 % below the December daily average and 25 Dec ~17 % below;
  26–28 Dec were above it (`advent-december-days`, 2024 and 2025, aggregate). So D22 (24 Dec) and D23 (25 Dec) are the
  easiest doors, and the finale D24 lands on the busier 26 Dec.
- **Highlight:** every door is added to an "Advent" Story highlight after it closes (with its answer frame), so late
  followers can catch up on the answers.
- **Publishing the doors:** the owner approves the week's six doors on Sunday. A door needs no sticker (answers come
  by DM reply), so it can be posted by hand or, once verified, published by a scheduled job through the API
  (decision on the morning list).

## 3. The 24 doors

Rules for every door: **one clear question, answerable from the image and the text alone** (no outside lookup needed,
though the site can help); MSP data or a credited box image; the answer defined before the door opens; aggregate
numbers only (suspicious results, private profiles, embargoed puzzles and hidden images excluded, as in every query).
Box images on the door are credited "Mystery puzzle · Brand" (standing feedback) and named on the answer frame. The
difficulty rises through each week (Monday easy → Saturday harder) and a little across weeks; Christmas days are easy.

Answer formats: **choice** (reply A, B or C; about a third of random guesses are right, so choice doors are the
friendliest), **number / time** (correct within a stated tolerance), **order** (three letters), **text** (a name, typos
forgiven). Difficulty: ● easy, ●● medium, ●●● hard.

| Door | Date | Type | The question (contenders picked on the day from the query) | Answer | Query | ● |
|---|---|---|---|---|---|---|
| D1 | Mon 30 Nov | Which is faster? | Three of the most-solved 500-piece Christmas puzzles (box images): which one do puzzlers finish fastest (median solo time)? Contenders chosen close together (standing feedback: a real guess) | choice A/B/C | `advent-christmas-puzzles` | ● |
| D2 | Tue 1 Dec | Higher or lower | Are Christmas puzzles solved more in December, or in the other eleven months put together? | choice A/B | `bs-seasonal-themes` | ● |
| D3 | Wed 2 Dec | Guess the puzzle | A tight crop of one of MSP's ten most-solved puzzles: which is it? | choice A/B/C | `boxes-alltime-top` (+ box image) | ● |
| D4 | Thu 3 Dec | Guess the number | How many puzzlers have logged MSP's most-solved puzzle (box shown)? | number, ±10 % | `boxes-alltime-top` | ●● |
| D5 | Fri 4 Dec | Missing piece | A box image cut into generator pieces with one gap: which of three pieces fits? (only one has the right knobs) | choice A/B/C | box image + `src/pieces/jigsaw.ts` (answer by construction) | ●● |
| D6 | Sat 5 Dec | Match the country | This puzzle is solved far more in one country than anywhere else. Which country? | choice A/B/C | `boxes-country-signatures` | ●●● |
| D7 | Mon 7 Dec | Higher or lower | Which theme takes longer at 500 pieces: A or B (two credited boxes)? | choice A/B | `bs-theme-speed` / `boxes-subject-speed` | ● |
| D8 | Tue 8 Dec | Which brand? | One brand makes about one puzzle in eight on this subject. Which one? | choice A/B/C | `bs-brand-signatures` | ●● |
| D9 | Wed 9 Dec | Guess the time | The median solo time for a 500-piece puzzle on MSP this year? | time, ±1 min | `bs-yearly-speed` | ●● |
| D10 | Thu 10 Dec | Rank three | Put these three puzzles in order, most solvers first | order (e.g. "BCA") | `boxes-alltime-top` | ●● |
| D11 | Fri 11 Dec | Odd one out | Four boxes: three are in MSP's all-time top 20, one isn't. Which? | choice A–D | `boxes-alltime-top` + one from a wider list | ●● |
| D12 | Sat 12 Dec | Missing piece, harder | As D5, with four candidate pieces, two of them rotated | choice A–D | box image + generator | ●●● |
| D13 | Mon 14 Dec | Guess the puzzle, harder | A tighter crop from the top 60 most-solved puzzles | choice A–D | `boxes-alltime-top` | ●● |
| D14 | Tue 15 Dec | Solved blind | Which of these three is solved "unboxed" (without looking at the picture) most often? | choice A/B/C | `bs-unboxed` | ●● |
| D15 | Wed 16 Dec | Guess the number | How many pieces does the community log on an average December day? | number, ±10 % | `bs-milestone-pace` / `monthly` | ●●● |
| D16 | Thu 17 Dec | Which is faster? 1000 pieces | Three 1000-piece puzzles: which has the fastest median solo time? | choice A/B/C | `advent-christmas-puzzles` (1000s) or a 1000-piece variant of `quiz-postcards` | ●● |
| D17 | Fri 18 Dec | Rank three | Order these piece counts by how many results they have on MSP: 300, 1000, 99 | order | `bs-piece-counts` | ●●● |
| D18 | Sat 19 Dec | Name the puzzle | A crop of a famous box: type its name (typos forgiven) | text, fuzzy | `boxes-alltime-top` | ●●● |
| D19 | Mon 21 Dec | Higher or lower | Did puzzlers log more results on Christmas Day last year, or on an average December Saturday? | choice A/B | `advent-december-days` | ● |
| D20 | Tue 22 Dec | Which is faster? Winter | Three winter puzzles (snow, owls, villages): which is fastest? | choice A/B/C | `advent-christmas-puzzles` (winter) | ●● |
| D21 | Wed 23 Dec | Guess the number | How many different puzzles on MSP are called "London" something? | number, ±10 % | `bs-name-twins` | ●● |
| D22 | Thu 24 Dec | Christmas Eve, easy | Which of these three Christmas puzzles has the most solvers on MSP? | choice A/B/C | `advent-christmas-puzzles` | ● |
| D23 | Fri 25 Dec | Missing piece, festive | A Christmas box with one gap, three pieces, no rotation | choice A/B/C | box image + generator | ● |
| D24 | Sat 26 Dec | The finale: picture reveal | Behind the 24 doors a puzzle has been revealed piece by piece (the "day N of 24" device). Which puzzle is it? | choice A/B/C (the name also accepted) | the reveal puzzle's box (chosen in advance, credited at the end) | ● |

Notes:
- **Tolerances are printed on the door** ("within 10 % counts", "within one minute counts"). Numbers are taken at the
  moment the door is queried on its day and stated as "as of 30 Nov"; MSP's public pages may show a slightly different
  count (they include private profiles), which the tolerance absorbs.
- **Number doors use ranges, not "closest wins"**, so many people can be right and nobody's entry depends on others.
- **Thin data stays out** (standing feedback): a contender needs ≥ 100 solo results for a median; near-ties are not
  used for "which is faster?" (a door must have one right answer: gap ≥ 30 s and the medians' order stable when
  re-queried at 19:00).
- **Lab samples are burned:** the AD1 prototypes (week-2 sample doors) show their answers in a public repo, so real
  doors never reuse those exact contenders and questions.
- **Swap rule:** if a door's query on the day gives a tie, an ambiguous answer or thin data, it is swapped for a reserve
  door of the same type (4 reserves: one per type; listed in `content/campaign/advent-2026/reserves.md`).
- **The reveal device** (D24): a 6 × 4 jigsaw from the generator, one row per week, one piece per door; each evening
  one more piece of a hidden box image shows. By D24 most of it is visible, so the finale is a festive gift, not a
  puzzle. The hidden puzzle is credited on the D24 answer frame and in the final recap.

## 4. The answer channel, deadline and daily collection

**Route: Story replies (DMs).** Verified on our own inbox on 2026-10-17: a reply to one of our Stories arrives through
the messaging API as a message with `story.reply_to.id` (the Story's media id), the sender, the text and the time, and
stays in the DM history after the Story expires. Story sticker votes (poll, quiz, question) can't be read by any API, so
**doors carry no sticker**; the cue is "Reply to this Story: A, B or C". Still to verify on a Close Friends test Story
(morning step, `content/labs/STORY-TEST/instructions.md`): that `reply_to.id` equals the id `me/stories` returned
while it was live, that replies from non-followers (message requests) are readable, and how a reply to a Close Friends
Story looks. Fallback if any of that fails: comments on a pinned "Advent answers" feed post, collected the same way
(public, so copying is possible; weaker).

What the API documentation adds (research note §1): no App Review is needed for our own account; webhooks would need
Advanced Access, Business Verification and a public server, so the Mac **polls** (well inside the limits: the
conversations API allows 2 calls a second). Meta documents that only the **20 newest messages** of a conversation can
be read in detail (we read far more today, but that is undocumented), and inactive message-request threads drop out
after 30 days, so answers are **collected every day**, not at the end of the week. People can **edit or unsend** a DM;
the collector keeps the first version it saw, so editing can't be used to answer twice. The Story `replies` insight is
always 0 for European accounts, so participation is counted from the DMs. A Story **can be published by the API**
(no stickers, no Close Friends), which is why a sticker-free door can go out on a schedule after approval.

**Deadline:** the door's 24 h: a reply counts if it was sent after the door went up and before the next door opened
(Story timestamp + 24 h). The rules state it as "until 19:00 CET the next day".

**Daily collection** (`node tools/campaign.ts tick`, a launchd job at 09:00, 13:00, 17:00, 19:30 and 23:30):
1. **Snapshot our live Story ids** (only possible while a Story is live; that's why the job runs during the day).
2. **Provisional collect** of the open door (17:00, two hours before it closes): reads the replies, checks them
   against the answer key, writes the running list.
3. **Final collect** after the door closes (19:30): the same, marked final. Writes `content/campaign/advent-2026/
   day-NN/` (raw replies kept as minimal fields, one entry per reply with its verdict, the sorted list of correct
   players, a readable `audit.md`, a run log). Running it twice gives the same files.
4. **Failures:** three retries (2, 5, 10 min); then an `alerts.log` line, a macOS notification and a "needs
   attention" flag in `status`. Because replies stay in the DM history, the next run catches up; the one thing that
   can't be recovered later is the Story id, so the 19:30 and 23:30 runs re-snapshot the new door while it's live, and
   a door published through the API records its id at publishing.
5. **Sunday 19:30:** after D6's final collect, `week` builds the pool and `draw` drafts the result for approval.

What is stored and for how long: see §8 (GDPR).

## 5. What counts as a valid answer

- **Matching** (`src/campaign/match.ts`, published in the rules in plain words): capitals, accents, emoji and
  punctuation don't matter. Choice doors accept a lone letter ("B", "b)", "(B)", "answer B") or the option's text
  ("London", typos forgiven); a reply naming two different options is not valid. Number/time doors accept the
  usual ways of writing it ("65", "65 min", "1:05", "1h 5m", "3,275") within the printed tolerance. Name doors forgive
  small typos (about one wrong letter in five). Order doors take the three letters in sequence ("BCA", "B, C, A").
- **One answer per person per door; the first answer counts.** Messages that aren't an answer ("good luck!") are
  ignored and listed for review; later answers don't replace the first; an edited or unsent reply still counts as the
  first answer as we first received it. Replies after the deadline are late.
- **Following is not required** (and liking, sharing and tagging aren't either). The API can tell whether someone who
  DMed us follows us, but not for commenters, and requiring it adds friction for a "nice to have"; the rules say
  following is appreciated, not required.
- **One person, one account:** de-duplicated by the Instagram user id (survives a username change). Excluded: our own
  account and the MSP team (`content/campaign/advent-2026/excluded.json`); accounts that are obviously fake (created
  for the contest, no profile picture or posts, several near-identical accounts answering seconds apart) can be
  excluded by the owner before the draw, with the reason logged. Instagram's API can't show account age, so this
  is a manual check of the winner and back-ups only.
- **Weekly eligibility (owner's choice; morning list):**

| Option | Who's in the Sunday draw | Effect | Claude's view |
|---|---|---|---|
| **A. One ticket per correct answer** (recommended) | everyone with ≥ 1 correct; 6 correct = 6 tickets | rewards coming back daily, but a late joiner still has a chance; guessing alone rarely builds many tickets | best balance of fairness and participation |
| B. All 6 correct | only perfect weeks | strongest skill signal; small pool (random guessing: 1 in 729 for choice doors); one missed evening ends your week by Monday night | risk of tiny pools and early drop-off |
| C. At least one correct, one ticket each | everyone with ≥ 1 correct, equal odds | simplest; daily effort isn't rewarded | weakest pull to return |

  Plus: **one prize per person across the campaign** (previous winners leave later draws), recommended, so four
  different people win.

## 6. The Sunday draw

- **Commit–reveal seed:** before the week's first door, `tools/campaign.ts seed <week>` makes a secret random seed
  and publishes only its fingerprint (SHA-256) in the week's first door frame and the announcement caption. After the
  deadline `draw <week>` reveals the seed. Anyone can check that the seed matches the fingerprint published days
  earlier, so we couldn't have picked a seed after seeing the entries.
- **The draw:** every ticket's score = SHA-256 of (seed | campaign | week | ticket); the lowest score wins, the next
  three are back-ups. Same inputs, same winner, every time.
- **Public audit** (`week-N/draw-public.md`, posted as a link from the recap or on request): the seed, its fingerprint,
  the rule, the number of tickets, the winner's handle and score, and every ticket as (score, a short hash of the
  handle), so each player can find their own ticket by hashing their handle, without us publishing anyone else's name.
- **Announcement:** Sunday ~20:00 Story (winner handle, revealed seed, number of tickets and of correct answers,
  draw time) + the Sunday recap carousel. Named under the rules; a winner on the do-not-feature list or who asks is
  shown masked (@a***e).
- **Winner contact: the winner messages us, not the other way round** (research §4: scammers copy giveaways with
  look-alike accounts and fake "you won" DMs; if we never DM first, any such DM is fake by definition). The winner
  Story says "@winner, reply to this Story or DM us within 7 days". The owner answers by hand in the app and sends
  the voucher code; the automation never writes. If the winner hasn't written within **7 days**, back-up 1 is
  announced the same way (at most two redraws, logged in the audit), then the prize rolls over.
- **Anti-scam line** in the rules, every winner Story and the highlight: "We announce winners only here on
  @myspeedpuzzling. We never ask for payment, card details, logins or links to claim a prize, and we never message
  from another account. If anyone else contacts you, it's a scam: please report it."
- **Before announcing:** the owner checks the winner and back-ups by hand (an obviously fresh or duplicate account,
  the do-not-feature list); the User Profile API can show follower count and whether they follow us, since they've
  messaged us.
- **Few or no entries:** any pool with ≥ 1 ticket is drawn. If nobody answered correctly, the week's voucher rolls over
  to the next Sunday; if the final week has no correct answers, the draw takes everyone who answered anything in the
  campaign. After week 1, if fewer than ~20 people answer a door, simplify (more choice doors), add a feed reminder,
  and reconsider the eligibility rule.

## 7. Prize, rules, partner

- **Prize: a voucher, owner's choice (morning list):** (a) an MSP membership voucher (no cost, digital, works
  worldwide, no shipping or customs), (b) a puzzle-shop voucher bought by MSP, or (c) a partner brand's voucher or
  puzzles (collab post + brand tag; reach upward; the brand ships). Value per week stated in the rules.
- **Value:** keep each prize well under CZK 50,000 (tax-free for the winner in CZ since 2024; research §3), e.g.
  CZK 500–2,000. A partner-supplied prize needs Instagram's paid-partnership label and a short partner agreement.
- **Official rules:** a page on myspeedpuzzling.com in English and Czech, linked in the bio, the announcement caption
  and the first Story of every week; versioned; changes announced in Stories. Draft below (adapted from the research
  note §3; **not legal advice**: the items in research §3.5 go to a lawyer and an accountant first).

> **Advent of Puzzle 2026 by MySpeedPuzzling: Official Rules** (version [1.0], [DATE])
>
> **1. Organiser.** [LEGAL NAME], [ADDRESS], Czech Republic, IČO [IČO] ("MySpeedPuzzling", "we"). Contact: [E-MAIL].
> [If a partner supplies prizes: "Prizes provided by [PARTNER]."]
>
> **2. Free to enter.** No purchase or payment is needed to enter or win. You don't need to follow, like, share or tag
> anyone. Following us is appreciated, not required.
>
> **3. Period.** Four weeks. A quiz ("door") goes up in our Instagram Story at about 19:00 CET Monday to Saturday and
> closes 24 hours later, when the next door opens. Week 1: doors 1–6, Mon 30 Nov to Sat 5 Dec 2026, draw Sun 6 Dec.
> Week 2: doors 7–12, 7–12 Dec, draw 13 Dec. Week 3: doors 13–18, 14–19 Dec, draw 20 Dec. Week 4: doors 19–24,
> 21–26 Dec, draw Sun 27 Dec. Times are Central European Time (CET, UTC+1).
>
> **4. Who can enter.** Individuals aged [18] or older with an Instagram account, living anywhere except Italy, Brazil
> and countries under comprehensive EU sanctions. Not eligible: the MSP team, anyone involved in preparing the doors,
> [partner staff], and their households. Void where prohibited or restricted by law.
>
> **5. How to enter.** Reply to the day's door Story with your answer, in text, before the door closes. If you can't
> reply to the Story, send us a direct message starting with the door number ("Door 7: B") before the same deadline.
> One answer per person per door: **your first answer, as we receive it, counts**; edits, unsent messages and later
> messages don't change it. GIFs, stickers and reactions are not answers. One Instagram account per person; entries
> through several accounts, bots or automated tools are disqualified.
>
> **6. Judging.** We judge answers with the published matching rules: capitals, accents, spaces, emoji and punctuation
> don't matter; a door with options A–D accepts the letter or the option's name; number doors accept answers within the
> range printed on the door; name doors forgive small typos (about one letter in five). If a door has a mistake or more
> than one fair answer, we accept every reasonable answer for it. MySpeedPuzzling judges; obvious errors are corrected
> openly.
>
> **7. Weekly draw entries.** [A: Each correct answer is one ticket, up to 6 a week.] [B: Entrants with all 6 answers of
> the week correct get one entry.] [C: Entrants with at least one correct answer get one entry.] Each week is drawn
> separately. [Each person can win once in the whole campaign.]
>
> **8. The draw.** Before each week's first door we publish a fingerprint (SHA-256 hash) of a secret random seed. After
> the week's last door closes we reveal the seed. Each ticket's score is the SHA-256 hash of the seed, the campaign, the
> week and the ticket (your Instagram username and ticket number); the lowest score wins and the next three are
> back-ups. We publish the seed, the method, the number of tickets, the list of all scores and the winner, so anyone can
> check that the seed matches its fingerprint and recompute their own score. The draw is on Sunday at about 19:30 CET.
>
> **9. Prize.** Each week: [PRIZE], approximate value [VALUE in CZK and EUR], delivered as a digital code, valid until
> [DATE], usable [online worldwide / where]. No cash alternative; if the prize becomes unavailable we substitute one of
> equal or greater value. Claiming costs nothing. Any tax on the prize in your own country is your responsibility.
>
> **10. Winners.** We announce the winner's username in our Story on the draw day. The winner claims the prize by
> replying to that Story or messaging @myspeedpuzzling within 7 days; otherwise the next back-up is announced (at most
> twice), then the prize moves to the next week. We never message winners first, and we never ask for passwords,
> payment or card details; report accounts pretending to be us.
>
> **11. Disqualification.** We may disqualify entries or winners that break these rules or that we reasonably believe
> cheated (several accounts, bots, bought engagement, answers leaked in bulk).
>
> **12. Your data.** [LEGAL NAME] is the controller. To run the contest we process your Instagram username and account
> id, your answers and their times (GDPR Art. 6(1)(b)). To show the draw is fair we publish the winner's username and the
> list of ticket scores (Art. 6(1)(f); a score can be recomputed only by someone who knows a username; you may object).
> Entries are deleted 60 days after the last draw; winners' prize records are kept as long as accounting law requires.
> We don't use entries for marketing. Data is stored in the EU. Instagram (Meta) processes messages under its own
> privacy policy. Your rights (access, correction, deletion, restriction, objection, portability): [E-MAIL]; complaints:
> ÚOOÚ (www.uoou.gov.cz).
>
> **13. Instagram.** This promotion is in no way sponsored, endorsed or administered by, or associated with, Instagram or
> Meta. By entering, each entrant gives a complete release of Instagram and Meta from any liability connected with it.
>
> **14. Changes.** We change or cancel these rules only for serious reasons (technical failure, fraud, platform changes),
> announce it in Stories and on this page, and never to the detriment of entries already made. We aren't responsible
> for messages Instagram doesn't deliver.
>
> **15. Law.** Czech law, without depriving consumers of the mandatory protection of their country's law. Also available
> in Czech; [which version prevails]. Questions: [E-MAIL].

Caption summary line: "Free · 18+ · not in IT/BR · not affiliated with Instagram · rules: link in bio".

## 8. GDPR note (what we store, how long)

Stored locally on the owner's Mac (gitignored `content/campaign/advent-2026/`, never in the repo): Instagram user id,
username, answer text, time, verdict, rule version. Legal basis: the rules (Art. 6(1)(b)); the winner's handle and the
score list are published on legitimate interest (6(1)(f)). Non-winners' entries are deleted **60 days after the final
draw** (by 25 Feb 2027; `tools/campaign.ts purge`); winners' prize records are kept as long as accounting requires. The
public audit shows the winner and anonymous ticket scores only. No DM is ever sent by the automation; the owner replies
by hand. Details in research §3.3.

## 8a. Targets and measurement

- **Expectation** (research §4, an estimate, no benchmark exists): ~70–250 Story viewers per door; 10–60 answers a day in
  week 1; Saturday at 50–70 % of Monday if the doors stay easy (Advent of Code's worst case is ~33 % by day 7); a
  stable core from week 2 plus a Monday bump after each public winner. The 300M-pieces guess in November (giveaways
  note, idea 2) gives our own reply rate first.
- **Measured per door** (from the collector and Story insights, which must be saved before a Story expires): answers,
  share correct, new vs returning players, Story reach/views/exits. **Per week:** net follows vs Oct–Nov, unfollows,
  recap-post sends and comments. December is an event month: excluded from format tests (growth note §5).
- **Counts as one giveaway** of the year's ≤ 3 (owner to confirm).

## 9. Automation in short

`node tools/campaign.ts status | stories | probe | collect <day> | week <n> | seed <n> | draw <n> | tick | schedule`.
Read-only towards Instagram (GET only, enforced in code). The launchd job is written but **not installed**; the
commands to install it are in `docs/runbook.md` and the morning summary. See `src/campaign/` and its tests.

## 10. What's needed before 29 Nov

In `docs/backlog.md` under "Advent of Puzzle": the owner's decisions, the test Story, the rules page on MSP, the prize,
the token refresh (it expires 12 Dec, mid-campaign), installing the launchd job, a full dry run on a Close Friends test
door, the 24 keys + reserves, and the AD1 visual choice.
