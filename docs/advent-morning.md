# Morning summary: giveaways and Advent of Puzzle (overnight session, 17 Oct 2026)

Everything from the overnight brief (`docs/next-session-prompt-advent.md`) is done, except that no heavy job ran (see
"What ran overnight"). Nothing was published, sent, hidden or deleted; Instagram was only read.

## 1. Look at this first

1. **The AD1 gallery** (review app → Labs → Advent (AD1); the phone link with the token is in the final chat message
   and in the gitignored `content/advent-morning-links.md`). Start with **"Doors compared"**: the same six quizzes in
   four door designs. Then the announcement carousel, the Sunday winner Story + recap carousel, the "day N of 24"
   device sheets, the 300M guess, and the profile grid / Story tray mock. Mark slides Works / Unsure / No-go
   (codes AD1-n).
2. **The decision list below** (I'll ask them interactively when you're back, recommendation first).
3. **The test Story** (section 4): about 15 minutes with one or two friends, then tell me "run the probe".

Reading, if you want the why (full research tracks in `research_notes/…/advent_2026_tracks/`, build spec in
`docs/ideas/advent-build-spec.md`): `docs/ideas/advent-of-puzzle.md` (the design), `docs/ideas/giveaways-2026.md` (11 ideas),
`research_notes/MSP Instagram design and growth toolkit/giveaways_and_advent_2026.md` (evidence).

## 2. What came out of the research (short)

- **Answers by replying to the Story work; sticker votes don't.** A reply to our Story arrives in the DM inbox with the
  sender, the time, the text and the Story's id, and we can read it through the API (checked on our own inbox: 42
  past Story replies). Nobody can read who voted in a poll, quiz or question sticker, so doors carry **no sticker**,
  just "Reply to this Story: A, B or C".
- **No Meta review needed; the Mac polls.** Webhooks would need a public server and business verification. Meta says
  only the newest 20 messages per chat are guaranteed readable, so answers are collected every day.
- **A sticker-free Story can be published by the API**, so doors could go out on a schedule after you approve the week.
- **Law:** a free quiz with a draw is not gambling in CZ (no stake); it's a consumer contest: publish rules, give the
  prize exactly as described, say "random draw among correct answers". 18+, worldwide except Italy, Brazil and
  sanctioned countries. Prizes are tax-free in CZ up to CZK 50,000 each. Not legal advice: a short lawyer/accountant
  checklist is in the research note §3.5.
- **Expect a steep first week** (Advent of Code keeps ~75 % of day 1 on day 2 and ~33 % on day 7; a light quiz should
  do better). Our scale: ~70–250 Story viewers per door, maybe 10–60 answers a day at first: a guess, nobody publishes
  this, so the November dry run measures it.
- **Trust:** we announce winners publicly and the **winner messages us**; we never DM first, so any "you won" DM from
  another account is fake. The draw is checkable: a seed fingerprint posted Monday, the seed revealed Sunday.

## 3. Decisions (my recommendation first)

| # | Decision | Recommended | Alternatives |
|---|---|---|---|
| 1 | How people answer | **Reply to the door Story (DM)**, text only, first answer counts | comments on a weekly post (public, copyable); an answer form on myspeedpuzzling.com (strongest, most friction, needs an MSP feature) |
| 2 | Who's in the Sunday draw | **One ticket per correct answer** (6/6 = 6 tickets; late joiners still have a chance) | only people with all 6 correct (tiny pools); anyone with ≥ 1 correct, one ticket each |
| 3 | One prize per person across the campaign | **Yes** (4 different winners) | no |
| 4 | The prize | **An MSP membership voucher** (digital, works worldwide, no shipping, giftable); you set the length | a puzzle-shop voucher bought by MSP (~CZK 500–2,000); a partner brand's prize (needs the paid-partnership label + a short agreement) |
| 5 | Age | **18+** | 15+ with a parent confirming before a minor gets the prize |
| 6 | Calendar | **Yours: doors 30 Nov–26 Dec, draws 6/13/20/27 Dec; easiest doors on 24–25 Dec** (last year 24 Dec was 30 % quieter, 26–28 Dec busier) | four weeks ending on the Advent Sundays (23 Nov–19 Dec; starts before Advent, on the European championship week); week 4 shortened to 21–23 Dec |
| 7 | Door time | **19:00 Prague**, every evening, 24 h to answer | 09:00 |
| 8 | Who posts the doors | **A scheduled job through the API, after you approve the week's six doors on Sunday** (needs Story publishing added to the publisher; the test Story confirms the ids match) | you post each door by hand in the app |
| 9 | Door design | **V2 Calendar board** (a 24-piece jigsaw calendar, tonight's piece coral; reads as Advent, shows progress, room for every quiz type), **with or without the festive layer V5** (your idea, added later on 17 Oct: fairy lights made of puzzle-piece bulbs on the header rule, a little snow, snow on the calendar, a drift at the bottom; I'd take V5 for December) | V1 coral door poster (loudest, but the same poster every day); V3 picture reveal (best "come back tomorrow" pull, cramped); V4 box-led (biggest clue, the day is easy to miss) |
| 10 | Campaign colour | **Coral** (events and timely posts) | ocean (puzzles) |
| 11 | How we draw | **Our seed fingerprint → reveal** (free, anyone can recompute it) | RANDOM.ORG third-party draw ($4.95 a draw, a record that can't be edited) |
| 12 | Launch | **Announcement carousel Thu 26 Nov 19:00** + a countdown Story until Monday | Sun 29 Nov (1st Advent; clashes with the European championship results) |
| 13 | Dry run | **Yes: "Guess the day we pass 300 million pieces"**, one public reply-to-Story in early November (pace now projects ~20 Nov); a shout-out for the closest guess | add a 1-month membership as the prize; skip it |
| 14 | Advent counts as one of the year's ≤ 3 giveaways | **Yes, one campaign** | four giveaways |
| 15 | Quiz mix | **As designed**: mostly A/B/C doors (friendly), some number and name doors (no guessing), easy Mondays and Christmas days | all A/B/C; more free-text names |
| 16 | Replies to the "yesterday's answer" frame | **Count them for the same evening's door** (both frames go up together at 19:00) | only replies to the door frame |
| 17 | The scheduled collector (launchd) | **Install it in the week before the launch**, after the dry run | install now |

Also for you, not decisions: who's on the MSP team list to exclude; the legal name, address and IČO for the rules; who
writes the rules page on myspeedpuzzling.com (EN + CZ).

## 4. The test Story (Close Friends, this morning or whenever two friends have 15 minutes)

Frames and life-size guide images: `content/labs/STORY-TEST/story-test-T1.jpg`, `T2`, `T3` (+ `*-guide.jpg`); also in
the AD1 gallery, section "Test Story". Full steps: `content/labs/STORY-TEST/instructions.md`. In short:

1. Close Friends = you + 1–2 friends who agreed to help.
2. Post three Stories to **Close Friends**, write down the time of the first:
   - **T1 poll:** sticker **Poll**, question `Edges first?`, options `Yes, always` / `No, colours first`, default size,
     centred in the dashed box.
   - **T2 quiz:** sticker **Quiz**, question `Most-solved size on MySpeedPuzzling?`, options `300 pieces`,
     `500 pieces` (mark correct), `1000 pieces`, centred in the dashed box.
   - **T3:** no sticker.
   - On each: ⋯ → **turn off commenting**.
3. Each helper (you too): vote T1; answer T2; reply `PUZZLE` to T3; then an emoji-only reply, one quick reaction, one
   GIF; unsend one reply; edit one within 15 min.
4. **Don't open those chats in the app** until I've run the first probe (we're checking that reading via the API doesn't
   mark them "Seen").
5. Tell me **"run the probe"**. I run `node tools/campaign.ts probe --since <time>` (read-only) at +5 min, +1 h, +23 h
   and +26 h, and you send two screenshots: the poll and quiz voter lists in the app.

What it settles: Close Friends Stories listed with ids, `reply_to.id` = the Story id, what emoji/reaction/GIF/unsend/
edit look like, no "Seen" side effect, nothing readable for stickers. Non-follower replies can't be tested on Close
Friends: that's what the public 300M guess is for.

## 5. What was built

- **Research note** (4 parallel agents + read-only probes of our account): API, Story channel, rules and law, what works.
- **Design** `docs/ideas/advent-of-puzzle.md`: calendar with the normal posts, 24 doors (question type, query, answer
  format, difficulty; no answers in the repo), matching rules, eligibility options, the draw, winner flow, prize, a
  ~900-word rules draft, GDPR, targets.
- **Ideas** `docs/ideas/giveaways-2026.md`: 11 formats; recommended next: the 300M guess (then the Weekend Challenge
  in 2027, the most verifiable format: entries are logged solves on MSP).
- **Lab AD1** (`lab/advent/`): 62 slides (incl. V5, the festive V2), 0 QA errors: 4 door designs × 6 quiz types, 6 answer reveals, the
  announcement (5-slide carousel + countdown Story + guide), the Sunday winner Story (+ link-sticker guide) and recap
  carousel, 4 "day N of 24" device sheets, the 300M guess (3), the Close Friends test (6), a profile grid of an Advent
  week and a 7-day Story tray. Sample numbers are labelled; the week-2 sample doors are "burned" (their answers are in
  the public repo), so real doors use other contenders.
- **Automation** (`src/campaign/`, `tools/campaign.ts`, 29 tests): collects Story replies (and plain "Door 7: B" DMs,
  comments as fallback), tolerant matching (letters, names with typos, numbers/times within a range, orders, dates),
  first answer counts, edits/unsends can't be used to answer twice, byte-identical reruns; weekly pools for all three
  rules; commit–reveal seed and draw with a public audit that names only the winner; winner caption draft; `purge` for
  the 60-day deletion; the scheduled job (5 runs a day) written to `content/campaign/launchd/`, **not installed**.
  Read-only by construction (anything but a GET throws).
- Queries (aggregate, private profiles and suspicious results excluded): `advent-december-days`,
  `advent-christmas-puzzles`, `challenge-shelf-candidates`, `challenge-weekend-dryrun`.

## 6. What ran overnight (resources)

- **No heavy job.** `node tools/calm.ts` said "not calm" (Docker running), so the optional HyperFrames Reel of the
  filling calendar was skipped; no ComfyUI.
- AD1 render: 56 slides in 14.5 s (≈ 0.26 s each), peak 0.92 GB, swap unchanged (`content/labs/AD1/runs.jsonl`).
- Production DB (read-only role, EXPLAIN first): 4 new aggregate queries + `bs-milestone-pace --fresh`, each a few
  seconds.
- Instagram API, read-only: probes, a comment collection on the September giveaway post (359 comments, 8 calls) and on
  the 17 Oct post, Story snapshots. **One hiccup:** an early probe paged one long chat ~95 times and Instagram answered
  "application request limit reached" for message paging (other calls kept working). The collector now reads the
  newest 50 messages per chat, has a call budget per run and stops at the first rate-limit error; later runs used
  4–26 calls. Worth remembering for December: collect often, page little.
- Checks: `npx tsc --noEmit` clean, `npm test` 40/40, token valid until 12 Dec (**refresh before 30 Nov**).
