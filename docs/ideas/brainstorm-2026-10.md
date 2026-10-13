# Brainstorm, October 2026: new data veins, 48 post ideas and where AI imagery helps

Second brainstorm round for @myspeedpuzzling. It goes past the 46 ideas in
`research_notes/MSP Instagram content pipeline/msp_data_and_content_ideas.md` and the ~100 in the design-and-growth
notes, and it adds to the two design labs instead of repeating them: `lab/dl1` (nine data-post styles) and `lab/dl2`
(box walls and mosaics, puzzle of the week and quizzes, cartoons and seasonal, Reels).

Ground rules, all from `docs/decisions.md`: no player photos; box images are fine with a brand credit; no
traffic-based numbers; AI is welcome for marketing visuals as long as it never makes puzzle motifs and the design
doesn't look like slop; about 3 feed posts a week; heavy local jobs only in quiet hours with the owner's go-ahead.

**Numbers.** Every number below is an aggregate queried read-only from production on **2026-10-13**. Each comes from
a `queries/bs-*.sql` file run with `node src/data/db.ts <name>`, or from an earlier cached query named in place. No
player is named. Re-query before anything is posted.

**Private profiles are excluded from every number** (`player.is_private`, owner decision 2026-10-13): all queries
were re-run with that rule on 2026-10-13 and the figures below updated. Figures cited as "earlier Q.." come from the
first research round, before the rule; re-query them with private profiles excluded before they go into a post.

**Effort.** S = under half a day with existing templates. M = 1–2 days (a new template or box layout). L = needs the
AI lab or the motion kit first.

---

## 1. What the data can tell

The core tables (results, puzzles, brands) still hold most of the value. The new veins come from three places:
puzzle **titles** (the only theme data there is), **stopwatch laps** (the only real clock time of a solve), and
**shelves** (collections, wishlists, hand-overs).

| Vein | What it gives | Real numbers (2026-10-13) | Query |
|---|---|---|---|
| Titles as themes | Subjects, rivalries, champions per subject | Cat-titled puzzles: 17,123 results on 1,235 puzzles. Dog-titled: 6,032 results on 506 puzzles | `bs-themes` |
| Subject speed | Which subjects are slow (raw solo-500 medians, the public kind) | Butterflies **95.1 min**, mushrooms 80.0 … postcards 53.7, Disney/Pixar **49.8** | `bs-theme-speed` |
| Theme champions | The most-solved puzzle per subject | Lighthouse at Sunset (Ravensburger) 877 solvers; Cubby Cats and Succulents 876 | `bs-theme-champions` |
| Title twins | How many different puzzles share one title | **49 puzzles called "London"** from 24 brands; Disney Princess 50; Paris 40 | `bs-name-twins` |
| Country signatures | The puzzle each country solves far more than the world does | Switzerland: Curious Swiss Cows, 22% of Swiss puzzlers (31× the world rate). Finland: Day in the Moominvalley, 11% (26×) | `bs-country-puzzles` |
| Country habits | Home brands, repeats, group puzzling | Trefl is 21.5% of Polish results; first tries are 65.7% of US results vs **40.4% in Norway**; Spain does 20.3% of its puzzling in pairs/teams | `bs-country-quirks` |
| Real solve clock | When people actually start (stopwatch laps are UTC; Central-European players converted to local time) | Peak start hour **20:00** (1,649 of 17,457 sessions). 500s started 22:00–05:00: median **62.1 min** vs 69.7 for evening starts | `bs-stopwatch-hours`, `bs-stopwatch-daypart` |
| Shelves | What sits unsolved | **36.4%** of 93,267 collected puzzles were never solved by their owner. Ravensburger's "Speed Puzzling" (1000): **65%** of 114 owners | `bs-shelf`, `bs-shelf-queens` |
| Seasons | When seasonal puzzles get solved | Only **28%** of Christmas-puzzle solves happen in December; 7% happen in July. Halloween: 27% in October | `bs-seasonal-themes` |
| Life of a puzzle | Time from first solve to the 100th solver | Median **370 days** (585 puzzles have 100+). Fastest: Windy Wonderland (speedpuzzle.eu), **1.1 days** | `bs-puzzle-life` |
| Milestone pace | Dates for the next collective milestones | 274.40M pieces, +593k a day → **300M ≈ 25 Nov**; 543,950 results → **600k ≈ 1 Dec** (just after the EJPC weekend); 72.0 years of solving time → **75 years ≈ 3 Nov** | `bs-milestone-pace` |
| Speed trend | Is the community getting faster? | Share of solo 500s under an hour: 35.0% (2024) → 40.1% (2025) → **43.3%** (2026) | `bs-yearly-speed` |
| Result notes | Counts of words in comments (no text leaves the DB) | **640** of 11,267 notes mention a missing piece; cats 39, dogs 11 | `bs-comment-words` |
| Solved blind | Results logged as "unboxed" | 6,884 results by 1,402 puzzlers; fastest solo 500 **25:54**; most-unboxed puzzle: Curious Capers of the Capybaras (Anatolian), 266 | `bs-unboxed` |
| Badge tiers | Rarity ladders | 5 players hold the 365-day streak badge; exactly **1** holds the 2M-pieces badge; 1 holds the top Marathoner tier (100 solves of 2000+ pieces) | `bs-xp-economy` |
| Piece counts | The size landscape | 431 sizes in the catalogue, 401 with results; the 99-piece size is 4th by results (15,664) | `bs-piece-counts` |
| Reach of one puzzle | Countries per puzzle | New York Postcard solved in **63 countries**; 768 puzzles in 20+ | `bs-international` |
| Hand-overs | Second-hand flows | 51% of hand-overs with both countries known cross a border (191 of 374) | `bs-marketplace` |
| Brand signatures | Each brand's over-represented subject | Eurographics: 11.7% of its catalogue is Christmas (5.4× average). Corner Piece: 10.6% cottages and villages (5.1×) | `bs-brand-signatures` |
| Predictions | How good MSP's live time forecast is | Personal model since 30 Sep: 75.0% of results land inside the predicted range; median miss 5.8% (3,759 results) | `bs-predictions` |

**Dead ends and caveats**
- There is no theme, colour or artist field anywhere. Title regexes are approximate: whole-word matches, English
  titles mostly.
- `manufacturer` has no country column, so "Turkish brand" etc. needs checking by hand.
- The stopwatch covers about 5% of results and only Central Europe has a single time zone to convert into, so time-of-day
  posts must say "stopwatch sessions in Central Europe".
- Collections, wishlists and lending lists are private by default. Aggregate counts over them are anonymous, but the
  owner should confirm he's comfortable with posts built on mostly-private lists (marked in the Risks column).
- Lending history before 2026-03-31 was lost (old cascade delete), so lending journeys are short. Competition results
  on MSP don't record unfinished attempts, so "how many finished in time" can't be told.
- Predictions, difficulty tiers and achievements are members-only in the app. Raw medians and solver counts are public.

---

## 2. Idea bank (48 ideas)

Mechanic → the metric the post is judged on. The metric is the one it should move most (sends/reach for non-follower
growth, saves for utility, comments for debate).

### A. Puzzle culture and themes

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| A1 | Cats outsolve dogs nearly 3 to 1 on MySpeedPuzzling. Cat people, explain yourselves. | `bs-themes`: cats 17,123 results / 1,235 puzzles, dogs 6,032 / 506. `bs-theme-champions`: Cubby Cats and Succulents 876 solvers vs Cute Dogs in the Garden 707. `bs-comment-words`: cats in 39 notes, dogs in 11 | **Box images + code.** A boxing-poster versus layout: the two champion boxes (credited) as the fighters, a 100-unit piece bar (D3 Piece Units) split 74/26. Optional AI spot art: one house-style cat and dog (from lab E3) | Debate, identity → comments, sends | S (M with AI spots) | Title regex is approximate; keep it affectionate to dog people |
| A2 | Butterflies take 95 minutes. Disney takes 50. We ranked every puzzle subject by how long it really takes. | `bs-theme-speed` (solo 500, raw medians): butterflies 95.1, mushrooms 80.0, gold 76.3, sweets 74.9, birds 74.1 … cities 60.2, postcards 53.7, Disney/Pixar 49.8 | **Code tier list** (S to D rows) with 2–3 credited box thumbnails per tier. Cover shows the board half-filled and asks "where would you put butterflies?" | Debate, utility → comments, saves | M | A few puzzles drive some themes (World of Butterflies alone has a 140.4 min median); print n puzzles and n results per row |
| A3 | The most-solved lighthouse in the world hangs in our museum. 877 of you have built it. | `bs-theme-champions`: Lighthouse at Sunset 877 solvers (62.9 min median), Ludicrous Library 498 (98.9 min), Circle of Colors: Mushrooms 422, Snowy Owl 281, To the Moon (Clementoni) 236, Amber Fox (speedpuzzle.eu) 151 | **AI plate + box images + code.** Series "Museum of Most-Solved": an AI-generated empty gallery wall (soft skylight, plaster, oak floor); code hangs the real box as a framed print with a matching shadow and sets a Rubik museum label (title, brand, pieces, solvers, median). One room per subject; 8–12 episodes; also works as a Weekly Numbers rotating slide | Surprise, utility → saves, sends | M (needs lab E1/E4) | Frame and shadow must look physically right or it reads fake; the box is the brand's art, so credit it on the label |
| A4 | 49 different puzzles are called simply "London", from 24 brands. Have you done the right one? | `bs-name-twins`: Disney Princess 50 (14 brands), London 49 (24), New York 47 (23), Paris 40 (27), Harry Potter 33, Amsterdam 27, Santorini 20 (20 brands) | **Box wall** (reuses the DL2 wall engine): all 49 "London" boxes in a 7×7 grid, brand list on the last slide. The cover shows only "49" | Surprise, send-a-friend → sends | S | 24 brand credits on one post (one credit slide); skip embargoed images |
| A5 | London Postcard or New York Postcard? The two most-solved puzzles on MSP are neck and neck. Pick a side. | Re-queried 2026-10-13: New York 1,901 solvers / 5,716 results, London 1,856 / **5,756 (most results)**. `bs-international`: 63 vs 62 countries. `bs-shelf-queens`: on 448 vs 422 shelves | **Box images + code.** Split screen, the two credited boxes, a "tale of the tape" stat duel; the last slide hands over to a Story poll | Debate → comments, poll taps | S | Both Ravensburger, so tag once; it's a coin flip by design |
| A6 | New York Postcard has been solved in 63 countries: the most international puzzle on MSP. | `bs-international`: New York Postcard 63 countries, London Postcard 62, Circle of Colors: Ocean 57; 768 puzzles solved in 20+ countries, 286 in 30+ | **Code dot map** (Natural Earth, public domain) lighting 63 countries in coral; the credited box as an inset | Awe, collective → reach | S–M | Only players who set a country count; say so |
| A7 | There are 401 different piece counts on MySpeedPuzzling, from 10 to 42,000. The 4th most popular is 99. | `bs-piece-counts`: 431 sizes in the catalogue, 401 with results; 500 (410,591 results), 1000 (41,282), 300 (34,889), **99 (15,664)**, 200 (13,178); odd sizes 54, 504, 631, 636 | **Code "piece-count spectrum"**: a log-scale number line with dots sized by results, callouts for the oddities. Story twin: "which size is 4th?" | Surprise, quiz → saves, comments | S | Check what the 99-piece range is before naming it |
| A8 | 365 Jan van Haasteren puzzles in our catalogue. The busiest pictures in puzzling are… faster than average? | `bs-name-words`: 365 JvH titles, 4,004 results. `bs-theme-speed`: JvH solo-500 median 57.0 min vs 64.9 for all 500s | **Box mosaic** of JvH covers (Jumbo credit) with one code annotation: "median 57:00" | Surprise, fandom → sends | S | Only 61 of the 500s carry the median; mention Jumbo only |

### B. Puzzle atlas (countries)

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| B1 | Finland has the Moomins. Switzerland has cows. We found every country's signature puzzle. | `bs-country-puzzles` (≥ 15 local solvers; lift vs world): FI Day in the Moominvalley (Peliko) 11.3%, 26×; CH Curious Swiss Cows 22.4%, 31×; AT Selfies Dogs' Delight **31%** of Austrian puzzlers; NZ "New Zealand" (Cavallini & Co.) 20.6%, 61×; SE Öland (PusselParet); NO The Tourist, Oslo; ES Sofá y perros (Educa); PL Ice Cream Shop (Trefl); NL Jan van Haasteren: The Winery; CZ Mickey Retro (Dino) | **Box images on a code tile map.** Cover: Europe as square tiles, each tile holding its country's box thumbnail. Slides by region, each box credited. Last slide: "missing your country? tell us its puzzle" | National identity, send-a-friend → sends, comments | M | Small local samples; some picks are event or online-contest puzzles (say "signature", not "favourite"); the US and DE picks are weak, so lead with the strong ones |
| B2 | Poland's other favourite brand is Trefl. Portugal's is Educa. The Netherlands' is Jumbo. What's your home brand? | `bs-country-quirks`, top brand after Ravensburger: PL Trefl 21.5%, PT Educa 19.3%, NL Jumbo 16.6%, HU Trefl 15.4%, CZ Trefl 15.0%, ES Educa 15.0%, NZ EeBoo 10.8%, US Buffalo Games 7.6%. Ravensburger's share runs from 38.9% (US) to 79.1% (AT) | **Code map** with brand names typeset in Rubik (no logos); Ravensburger's share drawn as a "tide line" per country | Identity, debate → comments | S | Wordmarks as type only; never rank brands negatively |
| B3 | Puzzle passport, Norway: you re-solve more than anyone, you love 1000s, and your signature puzzle is Oslo. | `bs-country-quirks`: NO first-try share 40.4% (lowest; US 65.7%), 1000+ share 11.3%. `country-pb-500`: NO median PB 59.8 min. `bs-country-puzzles`: The Tourist, Oslo. Other passports: ES 20.3% group puzzling (highest; HU 7.1%), US 27.7% of results under 500 pieces | **Code passport page**: four stamps whose outlines come from the piece generator (speed, size habit, solo/group, signature puzzle as a credited thumbnail). One country per episode; a ready rotating slide for the Weekly Numbers (it makes the earlier "country spotlight" segment concrete) | Identity, send-a-friend → sends | M first, then S | Countries with ≥ 60 puzzlers only; no "slowest" framing |

### C. Data stories

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| C1 | Night owls are the fastest puzzlers. 500s started after 10 pm finish about 7 minutes quicker. | `bs-stopwatch-daypart` (stopwatch, Central Europe, 500 pc): started 22–05 median 62.1 min (n = 763), 11–17 66.9, 05–11 69.3, 17–22 69.7; no-pause share 56% vs 48–50%. `bs-stopwatch-hours`: starts peak at 20:00 (1,649 of 17,457) | **Code 24-hour dial**: a clock face with session starts as a coral density ring, the 22–05 arc highlighted. Optional owl and lark spot art (lab E3) | Identity (early bird vs owl), tag-a-friend → sends, comments | M | Stopwatch users only (~5% of results), one time zone, self-selection (late sessions are keen solvers): state it in the pinned comment |
| C2 | In 2024, 35% of solo 500s finished under an hour. In 2026 it's 43%. You're getting faster. | `bs-yearly-speed`: sub-hour share 35.0% → 40.1% → 43.3%; median 68.5 → 65.3 → 63.5 min (2024 → 2026) | **Code slope chart** (D1 Scorecard), one coral line, the 60-minute line as context | Collective pride → likes, reach | S | Partly composition (more competitive puzzlers joined); frame it as "the community" |
| C3 | Most puzzles need a year to reach 100 solvers. Windy Wonderland did it in 26 hours. | `bs-puzzle-life`: median 370 days (585 puzzles with 100+ solvers). Fastest: Windy Wonderland (speedpuzzle.eu) 1.1 days, Colour Spectrum (speedpuzzle.eu) 2.0, Farmer's Table (Ravensburger) 2.3, Curious Capers of the Capybaras (Anatolian) 2.4 | **Code race chart**: cumulative solvers on a log-time axis, the fast risers in coral against a grey median band, credited box thumbnails at the line ends | Surprise → saves; promotes online events | M | The fast risers are contest puzzles; that is the story, so say it |
| C4 | 771 puzzlers have placed 100,000 pieces. 43 passed half a million. 2 passed a million. | `bs-persistence` (own results): 100k club 771, 250k 211, 500k 43, 1M 2; maximum 2,379,849 pieces. The 2M-pieces badge (team solves count): 1 holder | **Code ladder** of piece units (D3), each rung a club with its count; Story twin "which club are you in?" | Aspiration, milestone → likes, Story replies | S | Anonymous unless the holders are public and tagging rules pass |
| C5 | MSP now predicts your time. 3 in 4 personal forecasts land in range, with a median miss of 5.8%. | `bs-predictions` (live, since 30 Sep): personal model 3,759 results, 75.0% in range, median error 5.8%, 48.6% beat it; 7 results matched the forecast to the second | **Code forecast card**: a predicted-range bar with the actual results as a dot strip; last slide "beat your forecast this week" | Utility, challenge → saves, comments | S | Predictions are members-only (owner decided 2026-10-13: promoting member features is welcome); small live sample; don't mix model versions |
| C6 | No box, no picture: 25:54 for 500 pieces. 1,402 of you have solved a puzzle without looking at the box. | `bs-unboxed`: 6,884 unboxed results by 1,402 puzzlers; fastest unboxed solo 500 25:54, 1000 1:19:51; most-unboxed puzzle: Curious Capers of the Capybaras (Anatolian), 266 results | **Code + one box.** Cover: a blank grey "box back" with only the time on it; slide 2 reveals the Capybaras box (credited) as "the puzzle you solve blind most" | Awe, challenge → sends | S | Record stays anonymous; the unboxed flag is self-reported |
| C7 | 36% of the puzzles on your MSP shelves have never been solved. One collector has 849 waiting. We see you. | `bs-shelf`: 93,267 collected (owner, puzzle) pairs, 33,930 never solved by the owner (36.4%); median per collector 1; maximum 849 | **Code bookshelf** of 100 box spines: 64 in colour, 36 grey and shrink-wrapped | Humour, identity → comments ("how big is your pile?") | S | Built on collections (allowed by the owner 2026-10-13; private profiles excluded) |

### D. Milestones and calendar

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| D1 | Clocks go back tonight. Your free hour is 92% of a median 500, or six 100-piece puzzles and a cup of tea. | solo medians re-queried 2026-10-13: 100 pc 8.8 min, 200 pc 21.6, 300 pc 38.4, 500 pc 64.9 (`solo-distribution`) | **Code clock face** split into puzzle-size wedges; single image. Repost as a Story for the US change on 1 Nov | Humour, utility → shares | S | None beyond getting the date right per region (EU 25 Oct, US 1 Nov) |
| D2 | You've now logged 75 years of non-stop puzzling on MySpeedPuzzling. A whole human lifetime. | `bs-milestone-pace`: 631,257 hours = 72.01 years; +1,261 hours a day → **75 years ≈ 3 Nov 2026** | **Code "life calendar"**: 75 rows of 52 week cells filling with coral; hero number on the cover | Collective milestone → likes, reach | S | Timed results only; date drifts, so re-query daily from 27 Oct |
| D3 | 300 million pieces, laid edge to edge, would stretch from London to New York. We just got there. | `bs-milestone-pace`: 274.40M pieces, +593k a day → **≈ 25 Nov**. A 500-piece Ravensburger is 49 × 36 cm, so one piece edge is ≈ 1.87 cm; 300M × 1.87 cm ≈ 5,600 km ≈ London–New York (≈ 5,570 km). The two most-solved puzzles are London Postcard and New York Postcard | **AI texture + code map + box images.** Code draws accurate coastlines (Natural Earth) over an AI night-ocean texture plate (lab E1); a chain of generator pieces arcs from London to New York; the two credited postcards are pinned at the ends; hero number. Countdown Stories: "the chain grows 11 km a day" | Awe, collective milestone → reach, sends | L | The piece-size assumption needs an "about"; geography must come from code, never AI |
| D4 | Guess the day we pass 300 million pieces. The closest guess gets a shout-out on the milestone post. | `bs-milestone-pace`: ≈ 25 Nov at 593k pieces a day | **Code countdown** plus a Story question sticker | Participation → replies, comments | S | Shout-out only if the winner's profile is public with a valid handle; no prize (giveaways are capped) |
| D5 | Our 600,000th result could land right after the European Championship in Istanbul. Will it be yours? | `bs-milestone-pace`: 543,950 results, +1,155 a day → **≈ 1 Dec**; EJPC 27–29 Nov (`upcoming-events`) | **Code odometer** Story countdown in the event week | Participation, event tie → Story replies | S | Forecast only (it moved from 29 Nov to ≈ 1 Dec once private profiles were excluded, so the EJPC tie needs a fresh check); celebrate the result count, not a person, unless public |
| D6 | Heading to Istanbul? The puzzle you solve blind most often comes from a Turkish brand: Anatolian's capybaras. | `bs-unboxed`: Curious Capers of the Capybaras 266 unboxed results (241 puzzlers); `bs-puzzle-life`: 339 solvers, 100 in 2.4 days | **Box image on a code boarding pass** (Anatolian credit): "IST · 500 pcs · 266 solved blind" | Event tie, surprise → non-follower reach; possible brand Collab | S | Confirm by hand that Anatolian is the Turkish brand (no country column) |
| D7 | Only 28% of Christmas puzzles are solved in December. 7% are solved in July. No judgement. | `bs-seasonal-themes`: Christmas 4,978 solves: Dec 28%, Jan 10%, Nov 9%, Jul 7%; Halloween 27% in Oct, 16% in Sep; spring/Easter peaks Mar–Apr (12–13%) | **Code radial "wreath"** of 12 months, the December wedge in coral. Post on 1 Dec (or 25 Jul) | Humour, identity → comments | S | Title regex; solve date = finished_at, falling back to tracked_at |
| D8 | 24 days, 24 champions: one surprising puzzle fact behind every door until Christmas. | Reuses `bs-theme-champions`, `bs-name-twins`, `bs-country-puzzles`, `bs-piece-counts` | **AI plate + code + boxes.** A recurring AI winter-window Story background (lab E1); code numbers each door; a credited box behind each door | Ritual → Story retention, replies | L (templated) | Story fatigue; schedule all 24 ahead |
| D9 | MSP Wrapped 2026: 140 million pieces, one community. Your year in puzzling, chapter by chapter. | `monthly`: 2026 to 13 Oct ≈ 140.2M pieces logged; the Wrapped queries are still to write | **AI abstract plates + code.** One palette-locked AI plate per chapter (night sky for "hours", fibre macro for "pieces", map paper for "places") behind code type and charts, 4:5 and 9:16 | Collective identity → shares | L | December is crowded with Wrapped copies: use MSP-only metrics; keep the plates abstract |
| D10 | 257 spooky puzzles, only 1,333 solves. The scariest thing about Halloween puzzles is how few of you do them. | `halloween-puzzles` / `bs-themes`: 257 puzzles, 1,333 results; top Fantasy Mystic Witch (Ravensburger) 208 solvers; `bs-seasonal-themes`: 27% of their solves in October | **Story quiz** then reveal with credited box images | Quiz → Story replies | S | Overlaps DL2 seasonal: keep it Story-only |

### E. Quizzes and games (mostly Stories)

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| E1 | Moomins, cows, capybaras and "Sofá y perros". Can you match each puzzle to its country? | `bs-country-puzzles` (as B1) | **Box images + code** matching game; answer slide or Story quiz stickers | Quiz, national pride → comments, sends | S | Needs B1 first |
| E2 | Guess the brand from its favourite subject. Hint: one of them makes a Christmas puzzle out of every 9. | `bs-brand-signatures`: Eurographics 11.7% Christmas (5.4×), Corner Piece 10.6% cottages/villages (5.1×), Trefl 12.1% Disney/film (3.8×), Gibsons 6.1% cottages (3.0×), Educa 7.2% cities (2.4×), Cobble Hill birds (2.6×) | **Code subject tile** → reveal slide with 3 credited boxes from that brand | Quiz → comments; brand Collab potential | S | Catalogue share, not sales; mention brands only on their own slide |
| E3 | Puzzle title bingo: Circle, Colors, Postcard, Garden, Cats, Sunset. Screenshot it and cross off what you've solved. | `bs-name-words`, title words by results: moment 26,875, colors 21,085, circle 19,854, postcard 16,405, paris 13,786, garden 10,064, world 9,963, cats 8,819, rainbow 7,185, sunset 6,229 | **Code 5×5 bingo card**, MSP square in the centre; a Story template with an "Add Yours" sticker | Participation, identity → Story shares, Add Yours | S | None |
| E4 | Higher or lower: which takes longer, 500 pieces of mushrooms or 500 pieces of postcards? | `bs-theme-speed`: mushrooms 80.0 vs postcards 53.7 min; a chain of 5 pairs | **Story quiz chain** with credited box crops | Quiz → taps, replies | S | Raw medians only |
| E5 | Would you rather solve one World of Butterflies (140 min median) or three Disney & Pixar Color Palettes (40 min each)? | `bs-theme-champions`: World of Butterflies solo median 140.4 min; earlier Q34: Disney & Pixar Color Palette 40 min, 781 solvers | **Story poll** with the two credited boxes | Debate → poll taps | S | None |

### F. Community moments

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| F1 | 5 puzzlers have solved a puzzle every single day for a year. 365 days, no breaks. | `bs-xp-economy`: streak badge Diamond (365 consecutive days) 5 holders, Platinum (180) 7, Gold (90) 14, Bronze (7) 1,254 | **Code calendar heatmap** of 365 filled cells (abstract, not a real player's calendar) and the count | Awe → likes, comments ("what's your streak?") | S | Achievements are members-only (owner decided 2026-10-13: allowed); name holders only under the tagging rules |
| F2 | Some badges have exactly one holder. Meet the rarest things on MySpeedPuzzling. | `bs-xp-economy`: 2M-pieces Diamond 1; Marathoner Diamond (100 solves of 2000+ pieces) 1; Marathoner Platinum 1; First Try Diamond (1,000 first tries) 3; Unboxed Diamond (100 blind solves) 3 | **Existing MSP badge art** on a white vitrine layout, holder count large | Awe, aspiration → saves | S | Extends the earlier "rarest achievements" idea to tiers; allowed as F1 |
| F3 | Half of all puzzle hand-overs on MSP cross a border. Your old puzzles are better travelled than you. | `bs-marketplace`: 191 of 374 hand-overs with both countries known cross a border (51%); 1,857 hand-overs, 1,831 of them in 2026 | **Code flow map**: arcs between country centroids, only pairs with ≥ 3 hand-overs | Warmth, identity → sends | M | Small n; aggregate pairs only so no single trade is identifiable |

### G. Humour

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| G1 | The puzzle called "Speed Puzzling" is the one you're most scared of: 65% of owners haven't solved it. | `bs-shelf-queens`: Speed Puzzling (Ravensburger 1000) 74 of 114 owners unsolved (65%); Karen: Colors on Colors 52%; Valladolid 47%; Ludicrous Library 36% | **AI plate + box images + code** (Halloween, "Shelf of fear"): an AI moonlit empty bookshelf (lab E4, shelves from a code scaffold so the slots are exact); code stands the real credited boxes on the shelves with small "% unsolved" ghost tags | Humour, identity → comments, sends | M | Keep the Ravensburger joke affectionate; mostly-private lists (aggregate only) |
| G2 | 640 of your result notes mention a missing piece. Tell us your worst one. | `bs-comment-words`: 640 of 11,267 notes (5.7%); edges 346; cats 39, dogs 11. `bs-marketplace`: 36 open listings sold as "missing pieces" | **Code** 10×10 generator puzzle with one piece missing; the hole holds "640". Doubles as a 6 s Reel sting (I5) | Humour, story prompt → comments | S | Counts only, never quote a note |
| G3 | 387 Dogs & One Cat. 299 Cats and a Dog. Ludicrous Library. Puzzle names that are basically a dare. | `bs-theme-champions`: 387 dogs & One Cat (Ravensburger, 300 pc) 38 solvers, 57.6 min median; 299 Cats and a Dog (Laurence King) 22 solvers, 82.5 min; Ludicrous Library 498 solvers, 98.9 min | **Box images in code "WANTED" posters**, the median time as the bounty | Humour, send-a-friend → sends | S | Brand credits; affectionate framing |
| G4 | This weekend's puzzle forecast: 100% chance of edges, scattered sky pieces, Sunday peak around 8 pm. | Earlier Q21: Sun 104,275 solves, Sat 101,375, Tue 65,210 (lowest). `bs-stopwatch-hours`: 20:00 start peak | **AI sky plates + code** TV-weather layout: four AI weather backgrounds (sunny, cloudy, rain, snow) from lab E1; code sets the "temperature" (expected solves) and the map | Ritual, humour → Story replies | M | It's a joke, not a forecast model; at most once a fortnight |

### H. AI-led and generative

Several ideas above already lean on AI plates: A3, D3, D8, D9, G1, G4. These two are the ones where the image *is* the post.

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| H1 | Which puzzler are you? Night owl, early lark, sprint hare, zen tortoise, hoarding magpie, re-solving parrot or blind bat. | Owl: `bs-stopwatch-daypart` (62.1 min after 22:00). Hare: earlier Q21 (37.8% of solves at weekends). Parrot: earlier Q45 (5th attempt 27% faster). Magpie: `bs-shelf` (36.4% unsolved). Bat: `bs-unboxed` (1,402 blind solvers). Swallow: `bs-persistence` (121 puzzlers with 50+ brands). Tortoise: earlier Q02 (15,501 untimed "relax" results) | **AI spot illustrations + code.** Eight animals in the MSP semi-flat house style (navy outline, coral 30–40% of fills; lab E3), cut out onto white cards; code sets the stat and a piece-shaped badge. Cover = 2×4 grid | Identity, tag-a-friend → sends, comments | L | Style drift reads as slop: only ship if E3 passes; animals only, never people; no AI-drawn pieces |
| H2 | We averaged the boxes of September's 1,000 most-solved puzzles. This is the colour of September. | `boxes-month-top` (1,000 cached box images); colours computed locally with sharp (seconds, no diffusion) | **Generative, not AI**: a stripe "barcode" (one stripe per box, sorted by hue) and a hex chip. Monthly series "Puzzle palette" | Novelty, aesthetic → saves, shares | S–M | Boxes used as data only, no art shown; credit line "computed from box images in the MSP catalogue" |

### I. Motion (Reels and Story video)

| # | Hook | Data (2026-10-13) | Visual treatment and art direction | Mechanic → metric | Effort | Risks |
|---|---|---|---|---|---|---|
| I1 | When do you start your puzzles? Watch 17,457 stopwatch sessions fill one day. | `bs-stopwatch-hours`, `bs-stopwatch-daypart` | **Motion, code**: 10–12 s; the 24-hour dial fills hour by hour, an owl appears at 22:00, the end card shows 62.1 vs 69.7 min | Identity → watch time, sends | M | As C1 |
| I2 | It took Windy Wonderland 26 hours to reach 100 solvers. The average puzzle needs a year. | `bs-puzzle-life` | **Motion, code**: 12 s line race, box thumbnails riding the line tips | Surprise → watch time | M | As C3 |
| I3 | We sorted puzzle subjects by how long they really take. Do you agree? | `bs-theme-speed` | **Motion, code + boxes**: 12–15 s, credited box thumbnails drop into S–D tiers on a timer tick; publish as a Trial Reel first | Debate → comments, non-follower reach | M | As A2 |
| I4 | 2026 in colours: every month's most-solved puzzles, averaged into one stripe. | `boxes-month-top` per month (needs 10 monthly runs of the query) | **Motion, generative**: the months' barcodes scroll past like a film strip | Aesthetic → saves | M | As H2 |
| I5 | 640 notes mention a missing piece. This is that feeling. | `bs-comment-words` | **Motion, code**: 6 s loop, a 10×10 puzzle assembles and the last piece never arrives; counter 640 | Humour → shares, rewatches | S | As G2 |
| I6 | Every piece you've logged, laid edge to edge. Watch it cross the Atlantic. | `bs-milestone-pace` | **Motion, AI texture + code**: the D3 chain grows from London across an AI night ocean while an odometer counts to 300,000,000 | Awe, milestone → reach | L | As D3 |

---

## 3. Where AI imagery genuinely helps, and where it would be slop

### The verdict

1. **AI earns its place as the stage, never the actor.** It is good at what code renders badly: light, air, water,
   rooms, materials and friendly animals in the house style. Code keeps everything that carries meaning: text,
   numbers, maps, logos, box images and every puzzle piece (from the generator). This composite-back rule is in the
   research notes, and the rejected XP card shows why it matters.
2. **It must never resemble puzzle art.** The hobby is openly hostile to AI puzzle images: AI box art, finished
   puzzles and "puzzle-like" painterly scenes. A painterly lighthouse at sunset *is* a puzzle box (Lighthouse at
   Sunset has 877 solvers). So AI paints only empty rooms, skies, oceans, textures and stylised animals. Real puzzles
   only ever appear as real, credited box images.
3. **Local models are enough.** Z-Image Turbo for scenes and textures, FLUX.2 klein for house-style spot art and
   scaffold edits. Hosted models only as a fallback for one hero image if a local run fails its pass criteria.

### Recommended uses

All plates are made at ≤ 1088×1360 (4:5), Lanczos-upscaled to the 1440×1800 render size, colour-snapped to the brand
ramp (navy `#2b3445`, indigo `#4e54c8`, coral `#EC726F`, sky `#69b3fe`) and given the seeded code grain. Then code layers
are drawn on top at native resolution and the protected-pixel diff must be 0.

Z-Image Turbo runs at guidance 0 and klein at guidance 1, so negative prompts do nothing. Prompts describe emptiness
positively instead ("bare", "empty", "nothing written anywhere").

**AI-1. Recurring series plates.** For the Museum (A3), Advent (D8), Weather (G4) and Wrapped (D9).
- Art direction: calm, matte, low contrast, one light source, a large empty zone where code puts the type. It should
  feel like editorial architecture photography or a quiet illustration, never glossy.
- Model: Z-Image Turbo (Apache-2.0), Q8, 8 steps.
- Composition: code adds the frames, boxes, labels and type. The plate is reused across a series, so one approved
  plate serves 8–12 episodes.
- Draft prompt (museum wall): *"Interior of a quiet, empty modern museum gallery, one long warm off-white plaster wall
  seen straight on at eye level, soft daylight falling from a skylight above and fading down the wall, a pale oak
  floor along the bottom fifth of the image, the wall completely bare, no furniture, nobody in the room, calm editorial
  architecture photograph, matte, low contrast, 50 mm lens."*
- Draft prompt (winter window, Advent/Wrapped): *"A tall old wooden window seen from inside a dim cosy room at dusk,
  soft snow falling outside over a blurred deep-blue evening, the window sill bare and wide, warm faint lamplight from
  the lower right, large plain dark wall area on the left half, quiet and minimal, painterly matte finish, fine grain."*

**AI-2. The 300M hero texture (D3, I6).**
- Art direction: high-altitude night ocean, moonlight sheen, deep navy to indigo, a thin band of dawn along the top edge.
  No land: code draws exact coastlines from Natural Earth on top, and the piece chain, postcards and number.
- Model: Z-Image Turbo. Fallback if local fails E1: Nano Banana 2.1 batch at 2K (≈ $0.05 an image, ≤ 20 images).
- Draft prompt: *"Seen from very high above the open North Atlantic at night, endless calm deep-navy water with a
  soft silver moonlight sheen across the middle, faint long swells, a thin warm band of dawn light along the very top
  edge, nothing but water and sky, no land, no ships, nothing written anywhere, matte, subtle film grain, quiet and
  vast."*

**AI-3. House-style spot illustrations.** For the spirit animals (H1) and the optional cat/dog (A1) and owl/lark (C1).
- Art direction: the MSP "semi-flat outlined" prefix from the app's design system, minus the speed-dash sentence and
  minus the puzzle paragraph (both cause failures on local models). One animal, centred, front-facing, generous white
  space, no props.
- Model: FLUX.2 klein 9B (it won the badge lab; FLUX Non-Commercial v2.1, allowed by the owner, record it), with klein
  4B (Apache-2.0) as the cheaper control. Then BiRefNet or flood-fill cutout.
- Composition: code sets the stats, the name and a generator piece as a badge. The AI never draws a piece.
- Draft prompt: *"Semi-flat line illustration with soft colour fills, the style of a modern app onboarding
  illustration. Every shape has the same dark navy outline (#2b3445, about 2 px, rounded caps). Soft pastel fills with
  a very gentle watercolour-like gradient inside the outlines. Coral (#EC726F) on about a third of the shapes, sky blue
  (#69b3fe) secondary, lavender (#4e54c8) on shadow sides. Rounded, friendly geometry. Subject: a round, friendly owl
  sitting upright and facing the viewer, wings folded, big calm eyes, coral belly, sky-blue wings, centred, full body,
  plenty of empty white space around it. Pure white background, no ground, no frame."* Swap the subject line for the
  lark, hare, tortoise, magpie, parrot, bat and swallow.

**AI-4. Scaffold-to-scene edits.** For the "Shelf of fear" (G1) and museum rooms where box slots must land exactly.
- Art direction: code renders a flat grey scaffold (shelf boards and slot rectangles at their final pixel positions).
  klein turns it into a lit scene ("silhouette scaffold", proven in the badge lab). Code then places the real boxes into
  the known slots, so nothing is re-measured.
- Model: FLUX.2 klein 4B edit, 1 reference (the scaffold).
- Draft prompt (shelf): *"Turn this layout into a tall, dark wooden bookshelf in a cosy room at night. Keep every shelf
  board and every empty grey slot exactly where it is. Cold moonlight from a window on the left, one warm candle glow at
  the bottom right, a few cobwebs in the top corners, deep navy and indigo shadows, the slots stay as plain dark empty
  spaces, painterly but simple, matte, fine grain."*

**AI-5. Material plates.** For D6 "Puzzle Mat" backgrounds and Stories.
- Felt mat, kraft cardboard, cork board, vellum map paper (also the base for the Atlas series B1–B3).
- Model: Z-Image Turbo, 1024², top-down. Code makes them tileable (offset and blend).
- Draft prompt: *"Top-down macro photograph of a deep navy-blue felt puzzle mat filling the entire frame, even soft
  light, fine visible fibres, completely bare surface, no edges or seams visible."*
- Ship only if they beat the seeded CPU paper grain in a blind phone A/B. The research says that grain is the bar.

**AI-6 (optional). Relight a hero.** Qwen-Image-Edit-2511 (Apache-2.0, Lightning 4-step) to relight the best AI-4
shelf, only if AI-4 lacks atmosphere. It's slow (≈ 6 min a run, ≈ 28 GB), so it's a hero-only tool.

### Where AI would be slop or risky (don't)

- **Any puzzle motif**: AI box art, AI "finished puzzles", AI pieces (they come out lumpy, and wrong pieces are worse
  than none), and painterly scenes of classic puzzle subjects (lighthouses, cottages, city postcards, flower markets)
  that could be mistaken for a puzzle.
- **Editing real box images** in any way (relighting, extending, restyling). It's the brand's art, and it would be fake
  puzzle art.
- **People, hands and faces** (Instagram limits reach for undisclosed AI people), and real venues, trophies or event
  logos (Wisconsin, EJPC).
- **Data posts**: the Weekly Numbers, charts and record cards stay code-only. Texture under data only hurts
  legibility.
- **Text, numbers, maps, clocks and stopwatches**: AI gets counts and geography wrong. The badge lab saw an extra
  stopwatch pusher appear.
- **The slop look**: glow gradients, glossy 3D, lens flare, bokeh, sparkle, purple-violet gradients, cream-orange
  sameness.
- **Duplicating DL2**: cartoons and mascots are already being prototyped there, so AI here stays on plates, textures
  and spot animals.

### Hobby guardrails and provenance

- Every AI asset is logged: model, licence, seed, prompt, workflow hash and approval date (decision of 2026-10-13).
- Prefer local models. Hosted outputs carry C2PA/SynthID and may get Instagram's "AI info" label. The owner chose no
  proactive disclosure, so a label would be Instagram's call, not ours.
- **Test before publishing.** Each AI-led post must pass the owner's "could anyone mistake this for a puzzle?" check.

---

## 4. Top 10 to prototype next, and a two-week slate

### Top 10 (ranked)

| Rank | Idea | Why it's high | Needs first |
|---|---|---|---|
| 1 | **B1 Every country's signature puzzle** | The strongest identity and send-a-friend hook found (national pride, Moomins and Swiss cows); new data; uses allowed box images; seeds a series (B2, B3, E1) | Box layout on a tile map; brand-credit block; check event puzzles |
| 2 | **A2 Subject tier list** | Tier lists are native debate bait; the result surprises (butterflies 95 min vs Disney 50); feeds a Trial Reel (I3) | Theme regex review; tier template |
| 3 | **G1 Shelf of fear: "Speed Puzzling"** | Best humour hook (the irony writes itself), dated for Halloween, and the cleanest first test of AI-4 with real boxes | Lab E4; code-only fallback shelf |
| 4 | **D3 300M = London to New York** | The milestone post most likely to travel (awe plus a geography image); ties the two most-solved puzzles to the number; gives Stories a daily "11 km a day" countdown | Lab E1 ocean plate; Natural Earth map; piece-chain path in code |
| 5 | **C1 Night owls are the fastest** | First post from a new data vein (real clock times); identity plus tag-a-friend | 24-hour dial component; caveat text |
| 6 | **A1 Cats vs dogs** | Cheapest debate post with broad appeal (non-puzzlers get it too) | Versus template; optional E3 spot art |
| 7 | **H1 Puzzler spirit animals** | The AI-led identity carousel; high sends potential, and a reusable asset set (the animals reappear in C1, Stories and Wrapped) | Lab E3 passing |
| 8 | **A3 Museum of Most-Solved** | A recurring image-led series that turns box images into a calm, premium grid look; a ready Weekly Numbers slide | Lab E1/E4 gallery plate; frame-and-shadow compositor |
| 9 | **G2 Missing-piece drama** | Pure comment magnet, zero data risk, a code-only Reel sting comes free | None (S) |
| 10 | **D2 75 years of non-stop puzzling** | A collective milestone that lands just after this slate (≈ 3 Nov) | Daily re-query from 27 Oct |

Quick wins that don't need prototyping: D1 (clock change), A4 (49 Londons), A5 (postcard war), E3 (title bingo).

### Two-week slate: Mon 19 Oct – Sun 1 Nov

Already in flight this week from the existing backlog: the 59-minute wall (Thu 15) and Launch-day archaeology (Sat 17).
The archaeology post can add one fact from `bs-backfill-years`: since launch day, solves dated as far back as 2013 were
logged. The rest of the earlier shortlist (1,000 ≠ 2 × 500, events this month, fastest first try, October on pace)
moves to Stories or November. All dates need a fresh query on the day.

| Day | Feed (3 a week) | Kind | Stories |
|---|---|---|---|
| Mon 19 Oct | **Weekly Numbers S1E1** (planned) | Data, ritual | Poll: "When do you start puzzling? Morning / afternoon / evening / after 10 pm" (seeds C1) |
| Tue 20 Oct | | | Quiz: "How many puzzles on MSP are called just 'London'? 9 / 23 / 49" (A4) |
| Wed 21 Oct | **Wisconsin State Championship preview** (planned; US-evening slot) | Data, event | Countdown sticker for Friday |
| Thu 22 Oct | | | Slider: "How fast is a winning 500?" |
| Fri 23 Oct | | | Event day (US evening): start, organiser reposts, results link |
| Sat 24 Oct | **D1 Clocks go back tonight: what your free hour buys** | Fun, utility | "Events this weekend" (Danish Puzzle Marathon, Spooktacular Showdown) |
| Sun 25 Oct | | | Poll: "Cats or dogs?" (seeds A1, posted in November with the data) |
| Mon 26 Oct | **Weekly Numbers S1E2** with one rotating slide: Museum of Most-Solved, "Room 1: Lighthouses" (A3; a plain box frame if E1 isn't approved yet) | Data plus an image-led test | Quiz: "Which subject is slowest? Butterflies / mushrooms / birds / sweets" (seeds A2) |
| Tue 27 Oct | | | 75-years countdown starts (D2), if the pace holds |
| Wed 28 Oct | **B1 Every country's signature puzzle** | Image-led (box images), identity | Thu 29: "Guess the country" quiz (E1) |
| Fri 30 Oct | | | D10: Halloween puzzles quiz (Fantasy Mystic Witch, 208 solvers) |
| Sat 31 Oct | **G1 Shelf of fear: the puzzle called "Speed Puzzling"** | AI-led (E4 shelf plus real boxes), humour | US clocks change tomorrow: repost D1 |
| Sun 1 Nov | | | 75-years countdown (D2): the forecast is now ≈ 3 Nov, so the milestone post waits for the day a fresh query confirms it |

**Mix over the two weeks:** 3 data (two Weekly Numbers, Wisconsin), 1 image-led (B1), 1 fun (D1), 1 AI-led (G1),
plus image-led and AI-tested Weekly Numbers slides. Stories carry the quizzes and seed the November posts.

**November lookahead**
- Mon 2: October report. ≈ Tue 3: 75 years (D2), on the day a fresh query confirms it.
- Week of 2 Nov: A2 subject tier list (plus I3 as a Trial Reel), A1 cats vs dogs.
- Week of 9 Nov: C1 night owls with H1 spirit animals, if E3 passed.
- From ~13 Nov: 300M countdown Stories ("the chain grows 11 km a day") and D4 "guess the day".
- ≈ 25 Nov: D3 300M London → New York (same day as D6; re-plan once the date firms up).
- 25 Nov: D6 EJPC preview (capybaras).
- 27–29 Nov: EJPC Stories. ≈ 1 Dec: D5 600k.
- 1 Dec: D7 Christmas in July and the start of D8 Advent.
- Early Dec: D9 Wrapped with AI chapter plates.

---

## 5. AI image lab plan: batch AI1 (for one quiet night, awaiting the owner's go-ahead)

Nothing here has been run. Times and memory come from the measurements in
`research_notes/MSP Instagram content pipeline/local_pipeline_learnings_and_inventory.md` and
`research_notes/MSP Instagram design and growth toolkit/ai_design_augmentation.md`. Those measurements were at
badge/icon scale; full scenes on this Mac are unmeasured, which is part of what this batch finds out.

**Before the batch**
- The owner quits Docker, browsers, the IDE, Slack and local LLMs.
- Swap must be under 2 GB; it was 3.4 GB during DL1, so a restart may be needed.
- `tools/calm.ts` adds its own 4 GB margin to `--need-gb`. So run `--need-gb 24` before the Z-Image and klein 9B
  phases (28 GB free) and `--need-gb 20` before klein 4B (24 GB free).
- `--cache-none`, and `POST /free` with `unload_models` between model families.
- One model family at a time, in this order: Z-Image → klein 4B → klein 9B → (Qwen, optional).
- ComfyUI's memory isn't visible to `meter.ts`: sample the ComfyUI PID's footprint alongside it.

| Exp. | Purpose (ideas) | Model, licence | Settings | Candidates | Est. time / peak memory | Pass criteria |
|---|---|---|---|---|---|---|
| **E1 Series plates** | Museum wall (A3), night ocean (D3/I6), winter window (D8/D9), soft spring sky (G4) | Z-Image Turbo Q8 GGUF, Apache-2.0 | 1088×1360, 8 steps, guidance 0 (CFG 1.0), template sampler (record it), seeds 101–105 | 4 prompts × 5 seeds = **20** | 1088×1360 is about 1.4× the measured 1024² (80 s Q8 median), so ≈ 2–4 min each → **40–80 min**; peak ≈ 23–25 GB | (1) No glyphs or letters: owner eyeball now, Qwen2.5-VL OCR in a later daytime critic phase. (2) Reserved type zone flat: luma std-dev ≤ 10 (8-bit) after a 9 px blur. (3) After the brand-LUT snap, mean ΔE2000 to the nearest brand ramp colour ≤ 10. (4) Nothing that reads as a puzzle, person or landmark. (5) Survives Lanczos 1.32× plus a q80 JPEG with no banding. **≥ 2 of 5 per prompt** the owner would post |
| **E2 Material plates** | Felt mat, kraft cardboard, cork, vellum map paper (D6 direction, Atlas B1–B3, Stories) | Z-Image Turbo Q8, Apache-2.0 | 1024×1024, 8 steps, guidance 0, seeds 201–204 | 4 × 4 = **16** | 80–175 s each → **20–45 min**; ≈ 23–25 GB | Seamless after the code offset-tile test; no objects or edges; **wins a blind phone A/B against the seeded CPU grain** for at least 2 materials (otherwise drop AI textures for good) |
| **E3 Spirit animals** | H1, plus A1 and C1 spot art | FLUX.2 klein 9B Q8 (FLUX Non-Commercial v2.1, allowed and recorded); control: klein 4B Q8 (Apache-2.0) | 1024×1024, 4 steps, guidance 1.0; 9B seeds 301–303, 4B seeds 301–302; house-style prompt (section 3, AI-3) | 9B: 8 animals × 3 = **24**; 4B: 8 × 2 = **16** | 9B ≈ 3 min each (179 s median) → **≈ 72 min**; 4B ≈ 1 min → **≈ 16 min**; 4B peak 17–21 GB; 9B unmeasured, plan for ≈ 24 GB | Navy outline on every shape, line weight 2.5–3.3% of image width (measured in code); coral on 30–40% of the filled area; no speed dashes, pieces, text or props; closed outline (clean flood-fill cutout); **≥ 6 of 8 animals from one model look like one set** (owner) |
| **E4 Scaffold → scene** | G1 shelf of fear, A3 museum room with exact slots | FLUX.2 klein 4B Q8 edit, 1 reference (the code scaffold), Apache-2.0 | 1024×1280, 8 steps, guidance 1.0; 3 prompt variants (moonlight / candle / dusk), seeds 401–403 | 2 scaffolds × 3 variants × 3 seeds = **18** | 1-reference edits measured 80–125 s at 768 px, so ≈ 2–3 min at 1024×1280 → **≈ 40–55 min**; 17–21 GB | Slot rectangles stay within ±4 px of the scaffold (IoU ≥ 0.98 vs the code mask); protected-pixel diff 0 after composite-back; reads as a lit room, not glossy AI; **≥ 1 shelf and 1 room** the owner would post |
| **E5 (optional) Relight** | Hero polish for the best E4 shelf | Qwen-Image-Edit-2511 Q6_K + Lightning 4-step LoRA, Apache-2.0 | 1024×1280, 4 steps, 1 image; 3 lighting prompts | **3** | ≈ 6 min each → **≈ 20 min**; ≈ 28 GB (critical with 2 images) | Run only if calm passes at `--need-gb 28`; slot IoU ≥ 0.98 kept; clearly better light than E4 in an owner A/B, otherwise Qwen stays out of the toolkit |

**Total**
- ≈ 3–4.5 hours of GPU time plus model loads (≈ 5 with E5).
- 94 candidates (97 with E5).
- It fits one night, for example 22:00–03:00.
- If time runs short, E2 and E5 are the first to drop.

**Recording**
- `content/labs/AI1/runs.jsonl`, one line per image with these fields: model file, licence, resolution, steps,
  guidance, seed, prompt SHA, workflow SHA, wall seconds, the ComfyUI process's peak memory, memory pressure and swap at
  start/end, and calm-check output.
- The review app gets an "AI1" gallery with each candidate composited into its real layout, because a plate is judged
  in context, not alone.

**What the owner approves.** One batch, the four core experiments (E1–E4) on the next calm night, and E5 only if memory
allows. After this first measured run, the decisions say this lab type may run overnight automatically when the calm
check passes.

**Fallbacks if a pass criterion fails**
- E1 ocean fails → a hosted Nano Banana 2.1 test (≤ 20 images, ≈ $1).
- E3 fails → the animals become code-drawn SVG spots (D7 House Illustrated).
- E4 fails → G1 ships with a code-drawn shelf on a flat navy ground. The data and box images carry the joke anyway.
