# Standing feedback: the owner's rules for every post

The owner's feedback that applies beyond one post, distilled into rules. **Every new draft and every revision reads
this file first and applies all of it** (the `ig-draft` and `msp-captions` skills do so). After every review round,
rules that should hold for future posts are added here. One-off fixes stay in the draft's `feedback.jsonl`.

How to maintain it:
- Add a rule when the owner says something general ("always", "never", "in general", "for all posts") or gives the
  same note on two drafts; when unsure whether a note is general, ask the owner once and record the answer.
- Each rule: the rule in one line, then `(source, date)`. Newest rules at the top of their section. When a rule changes,
  edit it and note the change; don't keep contradicting rules.
- Detailed decisions live in `docs/decisions.md`; this file is the short, practical checklist. No member names here.

## Design

- **Numbers without US commas, on slides and in captions:** plain digits up to 9999 ("8103 hours", "1000 pieces"), a
  narrow space between groups of three from 10 000 up ("12 450", "3 654 448"; SI style). Always format with `fmtInt`
  (`src/design/page.ts`); the caption lint rejects "8,103". (owner, 2026-10-18)

- **A recurring report's cover says what it is at first sight:** the period as the big text ("Week 42", "October")
  with the word "report" in the title and the dates under it; the headline numbers go in the stat strip, never as the
  cover's big number. The caption opens the same way ("Weekly report, week 42 (12–18 Oct): …"). (owner, 2026-10-18,
  Weekly Numbers ep. 1, "very important")

- **House style = H4** (`HOUSE` = `VARIANTS.H4` in `src/design/house.ts`, DL4): the first (title) slide of a post is an H2
  two-piece puzzle poster; every other slide is the H1 navy board. (owner, 2026-10-17)
- **Data + visualisation together** is what works best: posts carry charts, boards, box images or illustrations so
  they're never just text; pair every key number with a visual. (owner, 2026-10-17)
- **Few colours:** white titles, one grey for text, purple (indigo-300 on navy, indigo-800 on coral/sky) for kickers,
  board headers and labels as in H1, coral only for highlights; nothing beyond that. (owner, 2026-10-17; first said
  "no blue/purple text", then reverted: "put the purple back, I said never use too many colours")
- **One navy: deep navy #222a38** on every slide (poster bottoms and navy Story chapters too), never two navies side
  by side. (owner, 2026-10-17, K1 option B)
- **Poster seam: the original cut** (grid4: 4 generator pieces, knobs as they fall). (owner, 2026-10-17, K1-9)
- **No green** in the house style. (owner, 2026-10-17)
- **Poster colour by type of post:** data desk and atlas sky, the week indigo, milestones, events, funny facts and
  timely stories coral, puzzles ocean; intro / Start here posts coral. (owner, 2026-10-17; intro coral 2026-10-18)
- **Branding notable:** myspeedpuzzling.com in bold in every footer source line; outlined logo 112 px. (owner, 2026-10-16)
- **No AI-looking illustration** (no cute outlined clip art, pastel washes, blush, glints); build art from real
  generator pieces and box images, flat poster shapes or type. (owner, 2026-10-14)
- **No cream, beige, pastel or yellow grounds; white only with depth; purple never the main colour.** (owner, 2026-10-14)
- **Puzzle pieces only from the generator** (crisp, geometrically correct). (owner, 2026-10-12)
- **Consistency across the grid matters**; the owner's own photo posts are mixed in. (owner, 2026-10-14)

## Data

- **Always double-check numbers against fresh data, replies to comments included**, and say exactly what is counted:
  "most solved" (results) and "most puzzlers" (distinct players) can disagree (London 5,802 solves vs New York 1,923
  puzzlers); a fastest time depends on excluding suspicious results. Re-query before replying, and match what the
  site shows publicly where the reader can check it. (owner, 2026-10-18, after wrong numbers in comment replies)

- **Weekly numbers count solves finished in the week** (`coalesce(finished_at, tracked_at)`), never just logged: ~17 % of a
  week's logged results are older solves typed in later, which faked "most active" and "biggest puzzle". Pairs and teams
  are named only when every member is a featurable registered player (guests typed in by name never). (data, 2026-10-18)

- **Exclude suspicious results everywhere**, including stopwatch sessions whose result is suspicious; enforced by
  `src/data/queries.test.ts`. (owner, 2026-10-17)
- **Exclude private profiles from everything, aggregates included.** Ranking opt-outs out of anything that names or
  ranks players; respect `content/do-not-feature.json`. (owner, 2026-10-13)
- **Fresh data for every post:** query `--fresh` on the day it's finalised; nothing older than 24 h is published.
  (owner, 2026-10-13)
- **No traffic numbers** (signed-in counts, website traffic); solve-based numbers only. (owner, 2026-10-13)
- **Only claim what the data really measures.** Title matching can't tell what's in a picture (cats vs dogs is on hold
  until box images are classified); MSP tags are events, not subjects. (owner, 2026-10-17)
- **Thin data stays out:** show a breakdown only when every group has enough results (e.g. pairs ≥ 100 per puzzle);
  teams with ~20 results were left out. Near-ties are called a photo finish, never a winner by "X seconds" alone.
  (2026-10-17, first post)

## Captions and voice

- **Home of the world's fastest, welcoming to every pace.** Both are who we are: MSP is where the world's fastest
  speed puzzlers log and compete (celebrate them, records and competitions proudly), and a community that encourages
  everyone else, slow times included. Speed is something to admire and aim for, never a yardstick that makes a
  normal time look bad: no "fastest 10%" ladders aimed at the reader; pair a record with the typical time; frame
  progress as your own ("watch your times drop"). Don't swing to the other side either: a post that hides speed
  misses what MSP is. (owner, 2026-10-18, two notes on the Start here post)

- **Tone: a friendly speed-puzzling community, heavily data-driven.** A fellow puzzler who loves the numbers: the
  number first, then what it means for a normal puzzler, then one honest question. Warm, a little nerdy, gently funny,
  never hype. Full playbook: §9 of `research_notes/MSP Instagram design and growth toolkit/captions_voice_hashtags.md`.
  (owner, 2026-10-17)
- **Claude proposes the caption and alt text with every draft; the owner fine-tunes them in the review app.** Owner
  edits are saved as `author: human` and never overwritten; patterns in those edits become rules here. (owner, 2026-10-17)
- **Hashtags = 3–5 specific topic labels on the last line** (e.g. #speedpuzzling #jigsawpuzzle + brand/size/event),
  never generic, none in the hook or Stories. They help search/categorisation, not reach, so searchable words also go
  in the caption text. (owner, 2026-10-17, after the hashtag research; replaced a short-lived "no hashtags" rule)
- **0–3 functional emoji per caption.** (owner, 2026-10-13)
- **Credit and tag the brand** whose boxes a post shows: @mention in the caption and a photo tag on the slide with the
  boxes (e.g. @ravensburgerglobal). (owner, 2026-10-17)
- **No AI disclosure statement.** (owner, 2026-10-13)

## Giveaways and campaigns

- **A campaign runs alongside the normal posts and fits the long-term rhythm**: real value from MSP data, never slop;
  quizzes are built from MSP data or box images and are answerable and checkable from them. (owner, 2026-10-17)
- **Claude collects and draws; the owner approves everything that gets published**; replies, hides, deletes, DMs and
  publishing need explicit approval. (owner, 2026-10-17)
- **Entry is never conditional on following, liking, sharing or tagging** (Instagram can't verify them; Meta forbids
  prizes for engagement and inaccurate tagging). Following is "appreciated, not required". (research 2026-10-17, owner
  to confirm)
- **Story answers come by reply (DM), never by sticker:** no API can read poll, quiz or question votes; a door carries
  a big "Reply to this Story" cue instead of a sticker, and public Story comments are turned off on contest Stories.
  (research 2026-10-17, owner to confirm)
- **Winners are announced publicly and claim by messaging us; we never DM a winner first**, and every winner post
  carries the anti-scam line. Draws are reproducible (seed fingerprint published before, revealed after) and the public
  audit names only the winner. (research 2026-10-17, owner to confirm)
- **At most one campaign feed post a week**, written as a data story; daily contest content lives in Stories.
  (research 2026-10-17, growth note; owner to confirm)

## Formats and slots

- **Interactive quizzes must be a real guess:** pick contenders whose numbers are close ("Which is faster?" with a
  23-minute gap was "way too easy"; the postcard trio's 4 seconds worked). Add a twist slide (fastest single solve,
  pairs) so the post gives more than the answer. (owner, 2026-10-17)
- **Weekend = interactive:** the community solves most on Sat/Sun (~37 % of all results); Saturday posts invite
  participation (quiz, debate, challenge) and Monday's recap can close the loop. Rhythm proposal in
  `growth_strategy_2026.md`, to be confirmed. (owner + data, 2026-10-17)
- **A quiz post gets a Story follow-up:** the question with a **poll** sticker the same day (a quiz sticker would reveal
  the answer), the answer Story the next day with a link sticker to the post. Post the feed post first.
  (owner, 2026-10-17)
- **Instructions to the owner for anything manual are step by step:** which sticker exactly, the exact text to type,
  where to place it (with a guide image), and when. (owner, 2026-10-17)

- **Story frames use the full usable height:** key text and stickers in y 200–1720 × x 65–1015 (research
  `story_dimensions_2026.md`; device check pending). Frames that get an Instagram sticker leave real room for it:
  a 3-option poll is ~600 px tall at default size and should be shown big (~130 %); use the masthead (no footer) and
  check with a life-size guide image.
  Use a poll, not a quiz sticker, when the answer comes later (a quiz reveals it on tap). (owner, 2026-10-17)

- **Reels:** no logo intro; by default no outro (it breaks the loop); optionally the 0.6 s loop-back sting.
  Decision on logo motion is open (LM1). (research 2026-10-16, owner to confirm)
- **Box images:** credit the brand on every slide that shows one; quiz clues say "Mystery puzzle · Brand". No player
  photos. (owner, 2026-10-13)
