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

- **No kicker headers on posts, Stories or Reels:** no piece mark + uppercase kicker + rule at the top of the frame
  (and no carousel index there). `frame()` drops them (`NO_HEADER` in `src/design/house.ts`) and HOUSE_CSS hides the
  piece mark and kicker in Reel mastheads; logos, source lines and footers stay. Say what the post is in the title or
  the art instead. (owner, 2026-11-13, spreadsheets Story: "remove these kind of headers above each post/story/reel")
- **A label on a puzzle piece is centred in the piece's visible body, not its grid cell:** when a neighbour's knob
  bites into the piece, move the label down by about a third of that knob's depth (the cell centre looks too high, half the
  depth too low). (owner, 2026-11-15, import-launch steps column: "1 is good but 2-5 … need to be moved down")
- **Hero numbers keep a margin on both sides:** size them with `heroFit()` to the safe width minus ~40 px, never a fixed
  size that runs to the frame's edge. (owner, 2026-11-13, Unlucky 13 Reel: "more space from the right side" on 1722)
- **"Old and dusty" never means washed-out pictures:** age the scene (dust, webs, light), keep box art and brand
  colours rich; desaturating or sepia-toning the pictures reads as low video quality. (owner, 2026-11-12,
  pile-of-shame Reel: "the overall video seems faded")
- **Reels: no site line under the masthead** (kicker + logo only); myspeedpuzzling.com is on the splash, and a data
  line belongs only on the beat that holds the number. (owner, 2026-11-12, pile-of-shame Reel; same note on the
  missing-piece Reel, 2026-11-04)
- **Text keeps clear of the jigsaw seam's knobs:** leave ~60 px between the last text line and the seam, so no knob or
  picture edge touches a word. (owner, 2026-11-12, pile-of-shame Reel: "way too near the image") Broken again on the import-launch cover (owner, 2026-11-15: dek touching a knob): place the seam from the text, `seam = textBottom + 60 + seamReach().up`, never a fixed y.
- **A scene swap is never a hard cut in view:** cross-fade (or cover it fully) when one picture replaces another; a
  blip reads as a glitch. A crowd of boxes shows every puzzle once, no repeating pattern. (owner, 2026-11-12)
- **No AI model credits on slides** ("Shelf: AI (FLUX.2 …)"): the source line names the data and box art only; the model
  stays in the lab's runs.jsonl. (owner, 2026-11-12, pile of shame)
- **Two or three small numbers are big text, not a chart** ("Cats 41×, Dogs 11×"): bars for tiny counts look empty and
  over-serious. The data source line goes on the slide or beat that holds the number, not on every frame. (owner,
  2026-11-05, missing-piece Reel)
- **Scenes and objects in Reels: AI paper-cut collage, not flat code shapes.** Code-drawn props (table, box, bowl) looked
  like "just vector or CSS objects"; the IL1 **I2 paper-cut** look (matte card in the brand colours, real layer shadows) is the
  house style for illustrated scenes, generated as stills (Z-Image Turbo) and moved by code (push-in), framed under a navy
  band with the poster seam so text sits on a solid backing. Data, boards, box pictures and pieces stay code. Never write
  "puzzle" or "jigsaw" into an AI prompt, not even as "no puzzle": with no negative prompt it *adds* puzzle cuts (rugs, a
  floating piece); reject any output with a puzzle shape. (owner, 2026-11-04, missing-piece Reel)
- **Pairs and teams always show every member, never "+2":** names separated by their flags only (no commas or
  "&"); a member without a flag gets a comma in front. Long groups wrap onto a second line. Captions name everyone too.
  (owner, 2026-10-26, Weekly Numbers ep. 2)
- **Board section labels always sit on the left** (Solo, Pairs, Teams); only the column header ("Time", "Solves")
  is on the right. (owner, 2026-10-26)
- **A shown time always comes with its piece count** when the board mixes sizes (shoutout: "19:33 / 200 pieces").
  (owner, 2026-10-26)
- **Exception to "no avatars": the biggest-puzzle shoutout** (week slide) shows the finisher's MSP avatar on the box
  image when they have one, and gets a caption line and a photo tag. (owner, 2026-10-26)

- **Puzzle-piece art uses brand colours only, never a white piece** (coral, light coral #ffb0ab, sky, indigo on navy).
  (owner, 2026-10-22, partner finder Reel: "I don't like the white piece")
- **A hook never narrows what it promotes:** name every case the feature covers ("a pair or a team?", not "pair
  partner?", which read as pairs only), and give every case the same emphasis (all in the highlight colour, never
  just one of them). (owner, 2026-10-22, partner finder Reel splash and Story)

- **Boards: no accent bar at the leader's row** (H4 house style hides it; the coral number marks the leader). (owner,
  2026-10-19, "it is disturbing me")
- **No Instagram handles written on slides:** tag each puzzler with a photo tag on their own row (handle from their MSP
  profile); without a handle, no tag. Captions credit by MSP name, no @mentions of players. (owner, 2026-10-19)
- **People boards show the puzzle, not ranks or avatars:** each row carries the box image of the puzzle behind the time
  (or the puzzler's latest puzzle); no avatars, even when a profile has one (only ~9 % do; the one exception is the biggest-puzzle shoutout, 2026-10-26). A shoutout shows the solve the
  puzzler is featured with: puzzle, brand, kind and time. (owner, 2026-10-19)

- **Numbers without US commas, on slides and in captions:** plain digits up to 9999 ("8103 hours", "1000 pieces"), a
  narrow space between groups of three from 10 000 up ("12 450", "3 654 448"; SI style). Always format with `fmtInt`
  (`src/design/page.ts`); the caption lint rejects "8,103". (owner, 2026-10-18)

- **Report covers lead with the post's most striking visual, not a block of numbers** (changed 2026-11-01): the period
  stays the big text with the dates, and the eye-catcher (e.g. the colour mosaic) fills the rest; the stat strip moves
  to later slides when it would make the cover a wall of text. (owner, 2026-11-01, monthly report: the stat-strip cover
  was "kind of boring though many info there"; "the collage is great")
- **Image mosaics and pieces have smooth edges:** tiles fill every cell the piece outline touches and the outline trims
  them; no stair-step notches, no outline stroke halo. (owner, 2026-11-01, "I don't like the sharp edges")
- **Weekly report cover: the week's three most-solved boxes lead**, with their puzzler counts and brands; solves,
  puzzlers and week on week in one small line under them (no stat strip). (owner, 2026-11-09, ep. 4: picked B over
  the stat strip)
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

- **Anonymous aggregates may include private collections** (never names, never anything that identifies one person's
  private collection); private profiles stay out of everything. (owner, 2026-11-12, pile of shame)
- **Medians follow MSP's own rule: each puzzler's best time on a puzzle counts once** (as `puzzle_statistics.median_time_solo`
  on every puzzle page), never every logged solve: repeat solvers skew an all-solves median by minutes (Winter Bunny 84.6
  vs the site's 81.4). A number shown next to a puzzle is that puzzle's number; an aggregate over many puzzles never
  sits next to one box as if it were its time. Check a sample against the puzzle pages before showing a draft (private
  profiles excluded, so a few seconds off is expected). (owner, 2026-11-07, tier list: "on website is median 66 mins
  and you display 69")
- **Say "median" wherever a typical time is shown:** in the headline or title of the slide that carries it, on the label
  next to the number, and in the caption's first line; explain it once ("half of all solo times are faster"). The
  fastest puzzlers are far quicker than the median, so an unlabelled "95 minutes" reads as a claim about everyone or a
  record. (owner, 2026-11-07, subject tier list)
- **Always double-check numbers against fresh data, replies to comments included**, and say exactly what is counted:
  "most solved" (results) and "most puzzlers" (distinct players) can disagree (London 5,802 solves vs New York 1,923
  puzzlers); a fastest time depends on excluding suspicious results. Re-query before replying, and match what the
  site shows publicly where the reader can check it. (owner, 2026-10-18, after wrong numbers in comment replies)
- **Facts for comment replies:** MSP membership costs $6 a month; correct a wrong price politely when someone states
  one. Importing a collection from a spreadsheet is a real offer: when someone tracks their puzzles elsewhere, invite
  them to message us and we help import it. (owner, 2026-11-13, pile-of-shame comments)

- **"Puzzlers" counts everyone who took part, registered teammates included** (the person who logged a pair or team
  result plus its registered members; guests without an account can't be counted). Counting only who logged a result
  undercounts (week 44: 1798 vs 1914) and clashed with the draw slide. A count of who logged results is labelled as such
  ("Puzzlers added times"). Two numbers on one post that describe the same people must match or say why they differ.
  (owner, 2026-11-02, Weekly Numbers ep. 3: cover 1798 vs draw 1874)
- **Pairs and teams are counted by line-up** (the exact same members together), never by merging members whose
  per-person counts happen to match: two puzzlers who each joined 12 team solves with rotating teammates showed as
  one "team" (week 43). Per-person counts are fine only when labelled as per puzzler. (owner question, 2026-10-26)
- **Board section gaps:** a clear gap above each new category (28 px), shrunk only when a board would not fit.
  (owner, 2026-10-26)

- **Week-on-week changes compare like for like:** the earlier week counts only results logged by the same point in
  time (`tracked_at < now() - 7 days`), or it has an extra week of late-logged solves and a flat week reads as a drop
  (week 43 showed −3.3 % instead of +1.0 %). Same for any period-on-period comparison. (data, 2026-10-26)

- **Weekly numbers count solves whose finish date is in the week** (`finished_at`), never the day they were logged:
  ~17 % of a week's logged results are older solves typed in later, and results without a finish date (always without a
  time too) are puzzles marked solved in batches (one puzzler "solved" 310 in week 42). Both faked "most solves" and
  "biggest puzzle". Pairs and teams are named only when every member is a featurable registered player (guests typed in
  by name never). (data, 2026-10-18/19)

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

- **Paths in the app are named exactly where people click:** "Your profile → Import a spreadsheet" (the avatar
  dropdown), never "Menu → …": MSP also has a hamburger menu, so "menu" misleads. Check the label in the app's EN
  translations. (owner, 2026-11-15, import launch)
- **A keyword comment is fine when it triggers a real service** ("Comment SANDBOX and we'll DM you" access): the
  playbook's "no fixed-token asks" is about engagement bait, not this. We DM only people who asked by commenting.
  (owner, 2026-11-15, import launch)
- **Funny facts need a funny tone on every slide and in the caption**, not just a surprising number: playful headlines
  and one-line asides next to the data ("we did the math nobody asked for", "snacks not included"), facts still exact.
  An open question to the community ("Who is this puzzle collector? Is it you?") works without naming anyone.
  (owner, 2026-11-12, pile of shame)
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

- **Stories never hold information that isn't in a post or Reel:** a Story only points to a post or Reel and adds an
  action (poll, link sticker, "find yours"). Stories disappear after 24 h, so facts that would live only there (e.g.
  holder counts) go into the post, the Reel or the caption. A one-tap share of the post is a fine Story.
  (owner, 2026-11-01) **Exception: countdown teasers** ("guess the day we pass 300 million") may carry the running
  count, because the milestone post on the day carries the full numbers. (owner, 2026-11-13)
  **Exception: calls to action that ask the community for something** ("DM us your spreadsheet"): the ask is the
  action, there is no post to point to. (owner, 2026-11-13, spreadsheets Story)
- **Followers must not miss a post's content:** no Trial Reels for content the followers should see, unless they get the same piece as a Story kept in a highlight (owner, 2026-11-01 evening: October Reel as Trial, its Story to everyone); a Reel on the same
  topic as a carousel is a different experience (the visual), not the slides animated. (owner, 2026-11-01)

- **Reel pacing: the joke gets time, text gets time.** A reveal the whole Reel hangs on (a snap-back, a twist) builds
  up over ≥ 1.5 s and lands with a hold, never a 0.5 s blink ("way too fast, I did not even notice"); count-ups that
  matter tick visibly (one step every ~0.6 s). Text-heavy beats (2+ lines or a chart) hold ≥ 4 s, short title beats
  ~3 s. Longer is fine (~25–30 s). (owner, 2026-10-23, clock Reel)
- **Nothing flashes its end state before it animates:** bars, counters and pieces that fill or fly in are set to their
  start state (empty, 0, off-canvas) before their beat shows, never shown full and then refilled. (owner, 2026-10-23,
  clock Reel: "the bars come already filled and then fill again")
- **No jokes that need explaining:** a gag must read in a second without text ("Whoa, too far!" on an overshooting
  clock wasn't clear, so it went). When unsure, keep the motion and drop the punchline. (owner, 2026-10-23)
- **Rotate example puzzles:** boxes used as examples, placeholders or decoration come from `pickUnused()`
  (`src/data/used-puzzles.ts`) and get recorded in `editorial/used-puzzles.json` when the draft is made; vary the
  Ravensburger boxes too, and prefer one whose picture fits the topic (a night scene for a 02:00 Reel). Data-driven
  boxes (most solved, quiz contenders) are exempt. (owner, 2026-10-23)

- **Reels in a row are fine; repetition means the same template, look or topic, never the format.** We aim for
  maximum reach and Reels are our non-follower lever (≈ 2.4× a feed post's impressions per account, research
  `reach_cadence_2026-10.md`); vary the concept and visuals between consecutive Reels. (owner, 2026-10-22)

- **Feature promos stay event-neutral:** don't hang a feature launch on a specific organiser's event or on the problem
  their community is having right now (it can read as mocking their trouble); show the feature for every event and
  link to its overview page (partner finder: myspeedpuzzling.com/en/partner-finder), never to one event. (owner,
  2026-10-22, partner finder Reel)

- **Shapes stay cropped while they move:** a tile or piece cut by an outline keeps its cut shape in flight (no square
  corners popping at take-off or landing); bake such crops into images rather than live clip-paths (10× render cost).
  (owner, 2026-11-01, monthly Reel)
- **Reel layout uses the full height for the art:** the hero visual may run below the text band (to ~y 1500), with
  generous space between the text block and the art; no big empty bottom. (owner, 2026-11-01, monthly Reel)
- **Moving text never reflows a sentence:** keep the sentence static and put the changing part (a tier, a count, a
  time) on its own short line, with tabular digits, so only that line changes. (owner, 2026-10-29, achievements Reel:
  "Bronze Solve … 3 times" jumping to "Diamond … 50 times" was bad to read)

- **Launches talk about what's new only:** don't mention or count what already existed ("joined the 16", "21 in
  total"); say it like news: "5 new achievements!", "Now there are 5 more!". (owner, 2026-10-29, achievements Reel)

- **After every publish, suggest the pins:** keep or swap each of the three pinned posts, with the reason and step-by-step
  app instructions (pinning is manual: the API can't pin). Pinned posts stay evergreen (see decisions 2026-10-18).
  (owner, 2026-10-19)
- **Interactive quizzes must be a real guess:** pick contenders whose numbers are close ("Which is faster?" with a
  23-minute gap was "way too easy"; the postcard trio's 4 seconds worked). Add a twist slide (fastest single solve,
  pairs) so the post gives more than the answer. (owner, 2026-10-17)
- **Weekend = interactive:** the community solves most on Sat/Sun (~37 % of all results); Saturday posts invite
  participation (quiz, debate, challenge) and Monday's recap can close the loop. Rhythm proposal in
  `growth_strategy_2026.md`, to be confirmed. (owner + data, 2026-10-17)
- **A quiz post gets a Story follow-up:** the question with a **poll** sticker the same day (a quiz sticker would reveal
  the answer), the answer Story the next day with a link sticker to the post. Post the feed post first.
  (owner, 2026-10-17)
- **Text handed to the owner to paste (caption fixes in the app) is copied from the published draft file**, never
  rebuilt from an earlier copy in the conversation: a re-render can change numbers by a late-logged solve (ep. 2: a
  pasted caption said 7732 while the live slides said 7733). (2026-10-26)
- **Instructions to the owner for anything manual are step by step:** which sticker exactly, the exact text to type,
  where to place it (with a guide image), and when. (owner, 2026-10-17)

- **Animated Stories open on a finished title card:** Instagram shows a video Story's first frame as its preview
  (archive, highlights, shares), so frame 0 says what it is with a visual (for Weekly Numbers: the poster with the
  week and dates over the most-solved boxes), holds ~0.75 s, then slides or moves away into the animation. Never
  start on an empty ground that fills in later. Check `story-1-video-preview.jpg` before posting. Animated Stories
  stay the default for recurring Stories. (owner, 2026-10-19, after Week 42's preview was an almost blank frame)

- **Story frames use the full usable height:** key text and stickers in y 200–1720 × x 65–1015 (research
  `story_dimensions_2026.md`; device check pending). Frames that get an Instagram sticker leave real room for it:
  a 3-option poll is ~600 px tall at default size and should be shown big (~130 %); use the masthead (no footer) and
  check with a life-size guide image.
  Use a poll, not a quiz sticker, when the answer comes later (a quiz reveals it on tap). (owner, 2026-10-17)

- **Reel / video layout: important content in the middle band, Instagram's zones left free.** Keep a gap at the top
  (Reels header ≈ y 0–230 of 1920; our masthead starts at 296) and keep text, numbers and key visuals in y ≈ 290–1250
  and x ≤ 960 (right-hand buttons). The bottom (handle, caption, audio, buttons from ≈ y 1560) and the 4:5 feed crop
  may cover or cut decoration such as box pictures and finished puzzles: that's fine, they're not the message. The
  first Reel (2026-10-21, reel-1000-v2) is the reference layout. (owner, 2026-10-21, "it worked really well")

- **Reels open on the complete splash:** frame 0 already shows the logo, myspeedpuzzling.com and all the intro
  text over a puzzle visual (the word "puzzle" on screen), then it animates **out** (logo exit `logoExit` in
  `src/motion/logo.ts`), never a build-in first. Pure transitions (tear-aparts, drops, entrances) stay quick
  (~0.2–0.5 s); the time goes to reading holds. (owner, 2026-10-21, first Reel)

- **Reels run slower than feels natural while building them** (owner, 2026-11-05, missing-piece Reel: "the reels are
  great but they must be slightly slower", asked again on this one): picture/joke beats hold ~3.5–4 s, a hero number
  beat ~5 s, the end card ~4.5 s. When unsure, add a second rather than cut one.
- **Reels: visuals first, less text, slower reading** (changed 2026-11-01; was "data-dense is fine"): viewers love the
  visuals but can't keep up reading. One short line on screen at a time, held long enough to read twice (rule of thumb
  ≥ 0.4 s per word, never under 2 s); at most one number per beat; cut secondary labels, footnotes and boards; the
  detail goes into the caption or a carousel. Still land the first payoff early and cut to a seamless loop.
  (owner relaying viewers' feedback, 2026-11-01; earlier rule from 2026-10-21 replaced)

- **Reels:** no logo intro; by default no outro (it breaks the loop); optionally the 0.6 s loop-back sting.
  Decision on logo motion is open (LM1). (research 2026-10-16, owner to confirm)
- **Box images:** credit the brand on every slide that shows one; quiz clues say "Mystery puzzle · Brand". No player
  photos. (owner, 2026-10-13)

## Music beds (owner, MU1 lab, 16 Nov 2026)

- **Baked-in audio by default**, no credit anywhere (decisions 2026-11-16). Generated beds: ACE-Step **XL** (clearly
  better than the 2B turbo; turbo only for quick drafts).
- **The music has to hit the video:** the bed's drop lands on the video's key moment (e.g. the poster drop in the
  weekly Story) and the song's own ending lands on the last frame, no plain fade-out. This was the note on almost
  every clip, more than the sound itself.
- **Style per post type:** weekly recap / data → clean "data" electronic, cozy lo-fi or playful (pizzicato/marimba)
  are candidates; **celebratory pop: no-go**; ticking/stopwatch beds are good but don't fit a recap (keep them for
  countdown/tension posts). Watch the first seconds for bad drums/claps (XL celebrate s202, playful s202 ~1.5 s).
- Mastering: two-pass loudnorm −14 LUFS + a true-peak limiter (AAC pushes peaks above 0 dBFS without one).
