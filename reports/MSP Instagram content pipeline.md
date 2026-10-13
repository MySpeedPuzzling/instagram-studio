# Code-render MSP's puzzle data into Instagram growth

MySpeedPuzzling should build a **code-first, file-based pipeline**. Claude Code proposes and drafts posts from a privacy-filtered aggregate layer of the production database. Every slide is rendered from HTML/CSS/SVG templates by Playwright as a 1080×1350 JPEG. The owner reviews each draft in a small local app that mocks the Instagram feed, grid and Story frames. A deterministic, non-LLM script then publishes approved posts through the existing Instagram Login API, using a short-lived public bucket URL. The case rests on three findings. First, the account's only sustained cadence, a data-driven weekly recap, died in August 2025, most likely because it was made by hand. Without posts, reach collapses to about 50 accounts a month. Second, MSP's 545k-result dataset is original content by construction, at a time when Instagram is demoting reposts and the jigsaw hobby is openly hostile to AI art. Third, MSP's own badge project already found that "the model is not where the gap is … the gap is design". The owner also rejected the one AI-background social card in October 2026. Generative imagery therefore belongs only in small, bounded slots, after an owner-validated bake-off. Text, numbers, logos and puzzle pieces are never generated. The content plan is three to four feed posts a week with carousels as the backbone, Stories posted by hand for interaction, and Reels tested as Trial Reels. Posts go out in the European evening, with short, keyword-rich English captions and at most five hashtags. The baseline costs **€0 a month** in software and model fees: every tool is free or already on the Mac, and the bucket holds only a few files a week. An optional €10–50 a month buys hosted image generation, if a bake-off shows it is needed. One fix comes before anything runs unattended: narrowing the production read-only role, which can currently read the account table that holds emails.

*How to read the citations: external facts link to public pages. Internal facts cite the production read-only queries run on 2026-10-13 as "prod DB Qnn" (the SQL is kept with the research notes), the read-only Instagram API audit of 2026-10-13, files in the public MSP repository, or the local, uncommitted badge-lab worktree. Prices, model names and API limits are as of 2026-10-13 and change often.*

## Consistency is the missing ingredient, and data can supply it weekly

### The baseline: 2,405 followers and reach that collapses when posting stops

@myspeedpuzzling is a small Business account with **2,405 followers and 87 retrievable feed posts**. Over three years it has posted in bursts with long gaps, the longest a 174-day silence before WJPC 2026 ([IG API audit, 2026-10-13](https://graph.instagram.com/v25.0/me/media)). Across the 58 posts since January 2025, a regular post reaches a **median of ~900 accounts with an 8.5% engagement rate** (interactions divided by reach), 61 likes and 2 comments ([IG API audit](https://graph.instagram.com/v25.0/me/insights)). Posting itself is the lever. In the dormant months of June–September 2026, account reach fell to **47–67 accounts per 30 days**. Active months reached 741–2,835, and the WJPC 2026 month reached 5,003 with +179 net followers ([IG API audit](https://graph.instagram.com/v25.0/me/insights)).

Three formats have worked for this account:

- **Giveaways and contests** are the discovery engine. The WJPC 2026 giveaway reached 4,357 accounts, 70% of them non-followers, drew 359 comments and brought 60 follows. Three contest posts produced **43% of all follows attributed to 2025+ posts**.
- **Big feature launches** in a single bold image come next, with a median reach of 1,033 and 10.6% engagement.
- **Weekly stats recaps** reached a steady ~900 with the lowest engagement but the **most shares of any non-giveaway format** ([IG API audit](https://graph.instagram.com/v25.0/me/media)).

The recap ran for about 29 consecutive weeks and then stopped in August 2025. It was the only sustained rhythm the account ever had, and it was produced by hand. That is the gap an automated pipeline closes.

The audience is international and English-speaking: **US 23.7%, Germany 11.2%**, then Canada, Australia, Czechia and the UK at about 5% each. It is 59% female and 71% aged 25–44 ([IG API audit](https://graph.instagram.com/v25.0/me/insights)). English is the default language. German is the only second audience large enough to justify occasional touches, and Czech is not a default.

### Five pillars built on what already works

The 2025–2026 platform evidence suits a data account. Instagram's head names **watch time, likes per reach and sends per reach** as the top ranking signals. Sends matter most for reaching people who don't follow you ([Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)). Since **30 April 2026**, accounts that mainly repost other people's photos or carousels lose recommendation eligibility. Screenshots with credit no longer count as original ([TechCrunch](https://techcrunch.com/2026/04/30/instagram-restricts-reach-of-content-aggregators-in-new-crackdown/)). Charts built from MSP's own dataset are original by construction. Member photos and screenshots reposted as-is are not.

Wrapped-style recaps from Spotify and Strava show which mechanics make data shareable: identity ("this says something about me"), comparison ("you vs everyone"), collective milestones, and a fixed annual ritual. Spotify reported **more than 500M shares on Wrapped 2025's first day** ([Music Week](https://www.musicweek.com/digital/read/spotify-wrapped-2025-was-biggest-ever-with-200-million-engaged-users/093178); [BikeRadar](https://www.bikeradar.com/news/strava-year-in-sport-2025)).

That points to five pillars:

| Pillar | What it is | Share of feed |
|---|---|---|
| **The Weekly Numbers** | A revived weekly recap: last week's most-solved puzzles, community totals, anonymous fastest times, one question. 5–8 visual slides, short caption | ~1 post/week |
| **Did you know?** | Funny facts and myth-busters ("the 59-minute wall", "1,000 pieces is 3× a 500, not 2×"), built to be sent to a puzzle friend | ~1 post/week |
| **Reports and records** | "<Month> in numbers", records, country and brand aggregates, collective milestones, a December "MSP Wrapped" | 2–4 posts/month |
| **Events** | WJPC, the February–March national championships, the monthly event calendar | event-driven |
| **Community and product** | "You asked, we listened" feature drops, polls and quizzes, occasional event-tied giveaways, opt-in spotlights as Collab posts | ~2 posts/month |

Events are an open lane. The organisers stream mainly on Facebook, YouTube and Twitch ([WJPF](https://worldjigsawpuzzle.org/wjpc/2025/guinnessworldrecord)), and the sport is growing fast: USA Nationals registrations more than quadrupled between 2022 and 2026 ([The Independent via AOL](https://www.aol.com/articles/piece-piece-inside-rapid-rise-140501949.html)). MSP can own "the Instagram recap with the numbers".

Giveaways need care. They are the account's proven follow engine, but Instagram's Recommendation Guidelines avoid recommending **contest or giveaway promotion and engagement bait** ([Instagram Help Center](https://help.instagram.com/313829416281232)). Their reach therefore comes from participants' networks, not the algorithm. Two or three event-tied giveaways a year is the right dose.

### Carousels as the backbone, Stories by hand, Reels as tests

**Carousels.** In Socialinsider's 2025 data for 1–5k-follower accounts, carousels average **993 views per post vs 580 for Reels and 417 for single images**. Engagement for single images keeps sliding: 0.33% in Q2 2026 vs 0.50% for carousels ([Socialinsider](https://www.socialinsider.io/social-media-benchmarks/instagram)). Metricool measured single-image reach falling **21.96% year over year** ([Metricool](https://metricool.com/press-release-instagram-study-2026/)). The account's own history adds a nuance: single bold images worked for feature drops (median reach 976). Keep single images for announcements and one-number facts, and make data carousels the default.

**Stories** carried **10,000–18,500 views per 30 days** in active periods, often more than all feed formats combined ([IG API audit](https://graph.instagram.com/v25.0/me/insights)). They are the retention channel. One constraint shapes the design: the API cannot add **link, poll or location stickers** to Stories ([IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)). The pipeline should export 9:16 Story assets with suggested sticker text, and the owner posts interactive Stories from the phone.

**Reels** are under-tested here: only two since 2025, both reaching about what images did. Trial Reels go to non-followers first and can be published via the API ([Engadget](https://www.engadget.com/social-media/instagram-will-let-video-creators-make-trial-reels-for-non-followers-160016725.html); [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)). That makes them a cheap test bed once motion templates exist.

### Three to four posts a week, in the European evening

Buffer's fixed-effects study of ~2.1M posts compares each account with its own baseline. It found **3–5 posts per week** lifting weekly follower growth by 0.26%, versus 0.12% at 1–2 posts, with diminishing returns above that. Weeks with zero posts sat measurably below baseline ([Buffer](https://buffer.com/resources/how-often-to-post-on-instagram/)).

Start at three feed posts a week and move to four once approval takes under 30 minutes a week:

- **Monday:** The Weekly Numbers. This keeps the 2025 ritual and covers the weekend, when **37.8% of all solves** happen (prod DB Q21).
- **Thursday:** a Did-you-know fact.
- **Weekend:** a rotating record, report or event post.
- **Stories:** 3–5 per week, reusing the same facts.

Batch-approve the whole week in one sitting so that no week drops to zero.

For timing, use the account's own data instead of global studies. Buffer itself recommends this ([Buffer](https://buffer.com/resources/when-is-the-best-time-to-post-on-instagram)). Online followers peaked at **689 (≈29% of followers) at 21:00 Prague / 19:00 UTC**, with 646–689 online across 18:00–22:00 Prague during the summer-time window measured. The trough was 03:00–05:00 Prague ([IG API audit](https://graph.instagram.com/v25.0/me/insights)). The `online_followers` metric still returned data on v25 even though Meta's metric table no longer lists it.

Schedule slots in **Europe/Prague local time, 19:00–21:00**. Prague switches to UTC+1 on 2026-10-25 and US Pacific on 2026-11-01, so re-sample `online_followers` in a normal month after the clock change. An occasional Monday-morning Prague slot (07:00–09:00 UTC) reaches Australian and New Zealand evenings, about 6% of followers.

### Captions are search metadata now

Public posts from professional accounts have been eligible for Google and Bing results since **10 July 2025** ([Storyboard18](https://www.storyboard18.com/digital/instagram-to-make-public-posts-searchable-on-googlebing-74611.htm)). Instagram has capped hashtags at **five per post** since December 2025 and says hashtags classify a post rather than extend its reach ([Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/)). Posts with a question got **36.7% more comments**, and comment-focused CTAs **202.8% more**. This is correlational, but it is a large effect ([Metricool](https://metricool.com/press-release-instagram-study-2026/)). Instagram says an earnest, specific ask is not engagement bait; trying to game recommendations is ([Social Media Today](https://www.socialmediatoday.com/news/instagram-clarifies-advice-on-single-word-ctas-and-longer-reels/718151/)).

The caption template:

1. A hook that lands inside the first ~125 characters, before "… more" ([FAU](https://www.fau.edu/public-affairs/marketing-services/social-media/best-practices/instagram-best-practices/index.php)).
2. One or two lines of context with the data scope and date.
3. One CTA chosen for the post's goal. For sends: "send this to the friend who always hoards the edge pieces". For comments: "drop your 500-piece PB". For saves: "save before your next competition".
4. Natural search phrases such as "speed puzzling", "500 piece puzzle time" and "jigsaw puzzle record".
5. At most five hashtags, for example #speedpuzzling #jigsawpuzzle #jigsawpuzzles #myspeedpuzzling plus an event tag.

Captions should end up well below the historical median of **1,069 characters**. The weekly recaps averaged 1,745 characters while their reach declined. That is a coincidence worth A/B-testing, not proof. Every image also gets API alt text generated from the underlying stats.

## Twelve first posts the database already supports

Production holds **545,521 results logged by 7,839 players from 84 countries**, on 42,374 puzzles from 2,104 brands (prod DB Q00–Q05). That adds up to **275.2 million pieces and 632,494 hours, about 72 years**, of logged solving (prod DB Q06). Growth is strong: from 1 January to 12 October, results rose **77%** and distinct active loggers **46%** year over year (prod DB Q09).

The strongest first ideas meet four tests:

- They use only aggregate SQL, so there is no privacy risk.
- They are timely or evergreen.
- They carry an identity or comparison hook that drives sends and comments.
- They reuse a template that later becomes a series.

| # | Post (hook) | Proof point (prod DB, queried 2026-10-13) | Format | Why now |
|---|---|---|---|---|
| 1 | "Launch-day archaeology: you dug up your old puzzles" | 2,890 results logged on 12 Oct 2026, the busiest day ever; 1,305 were solves more than 7 days old (Q25, Q26) | Image or 3-slide carousel | XP launch week; funny and flattering |
| 2 | "The Level 50 club" | 10 players at level 50, 94 at level 40+, 2,124 at level 2 (Q48) | Image with shipped badge art | Timely; reuses existing badge SVGs |
| 3 | "September 2026: our biggest month ever" | 33,198 results, 2,687 active loggers, 16.8M pieces, 596 new puzzlers, 2,259 puzzles added (Q10, Q11, Q52) | Carousel | Prototype of the monthly template |
| 4 | "+77% this year: thank you" | 156,484 → 277,577 results; active +46%; new players +37% (Q09) | Carousel | Community milestone |
| 5 | "The 59-minute wall" | Solo-500 times peak at 58 min (7,449 results), then drop 7.5% at 60 min (6,832); no such step at 45 or 50 (Q16) | Histogram carousel, later a Reel | Funny, identity-driven, made to be sent |
| 6 | "1,000 pieces isn't 2× a 500. It's 3×" | Solo medians: 64.8 min (500) vs 195.9 min (1,000) (Q12) | Myth-buster carousel | Evergreen, save-worthy |
| 7 | "Where do you rank?" | Solo 500: p25 52, median 64.8, p75 83, p90 106 min; 45% of puzzlers have a personal best under 60 min (Q12, Q18) | Reference carousel | Comparison drives "drop your PB" comments |
| 8 | "The fairest record: 22:30 on a first try" | Fastest solo-500 personal best 16:30, but all top-10 bests were repeat attempts; fastest first try 22:30; 5th attempt is a median 27% faster than the 1st (Q19, Q19b, Q45) | Carousel | Anonymous records; practice story |
| 9 | "Sunday is puzzle day (Tuesday is the saddest)" | Sun 104,275 vs Tue 65,210 solves (Q21) | Single bar chart | Light, relatable |
| 10 | "Half of all puzzles here have exactly one fan" | 19,097 of 38,313 solved puzzles (49.8%) have one solver (Q36) | Single image | Funny long-tail fact |
| 11 | "The Nordic-Alpine speed belt" | Median personal best on a solo 500: DK 50.2, CH 50.8, FI 50.9 vs US 64.0 min; Denmark logs 45,953 pieces per active puzzler in 2026 (Q38, Q39) | Map carousel | National pride drives sends; DACH relevance |
| 12 | "Countdown to 300 million pieces" | 275.2M pieces logged, at ~16.5M a month, puts 300M around late November 2026 and 600k results around early December (Q06, Q10) | Story countdown, then a celebration post | Collective milestone; re-check before announcing |

Two seasonal anchors follow. **"WJPC 2026 in numbers"** has 837 participants, 63 countries and 1,010 results logged on MSP (prod DB Q42). **"MSP Wrapped 2026"** goes out in December. The site has no Wrapped or year-in-review feature, so this slot is open, and production data already supports it.

Holiday facts make good late-December filler. Against matching weekdays, Christmas Eve was 24% quieter and New Year's Day 65% busier (prod DB Q24). Re-run them for the 2026 season.

Four kinds of idea should wait for an owner decision:

- **Skill-adjusted "hardest and easiest 500s".** The site keeps difficulty insights members-only ([CLAUDE.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/CLAUDE.md)).
- **A brand speed league.** It carries manufacturer-relationship risk, and raw brand medians mix difficulty with who buys which brand.
- **Most-solved puzzles shown with box art.** The art is manufacturer copyright, and Ravensburger is the natural first partner to ask ([ravensburger-puzzle-month.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/ravensburger-puzzle-month.md)).
- **Anything that names, tags or shows a player.** The privacy policy has no clause covering MSP's own social media ([messages.en.yml](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/translations/messages.en.yml)).

Every post needs the same data hygiene:

- Re-run its query just before posting.
- Copy the app's rules: exclude suspicious results, use `COALESCE(finished_at, tracked_at)`, respect privacy and ranking opt-outs, and skip embargoed puzzles.
- Treat solve-date monthly figures with care: the XP launch back-filled 1,305 old solves on one day.
- Choose which "monthly active" definition to publish. The precomputed community table reported 2,956 for September while the logging-based count was 2,687 (prod DB Q10, Q51).

## Code owns every pixel that carries meaning

### MSP's own evidence points away from AI-first visuals

Three findings decide the visual strategy, and the first two come from MSP itself.

**The badge project.** Between July and October 2026, MSP spent two AI-first rounds on badge art:

- ComfyUI tests of FLUX.2 klein, Z-Image, Qwen-Image-Edit and SDXL, plus LoRAs and Blender.
- About 408 GPU-minutes in a ~24-hour multi-agent "badge lab".

The reviewer's verdict was: **"The model is not where the gap is … The gap is design."** No AI route met the hard rules as a system (badge-lab `review/phase2-review.md`, local). Models could not count, keep a consistent line weight or draw correct jigsaw pieces. The lab put it bluntly: "Wrong pieces are worse than no piece."

What shipped has "no AI, no GPU and no network": Python and shapely draw SVG, `rsvg-convert` rasterises it, and Claude wrote the illustrated icons as clean SVG behind an automated QA gate ([tools/badge-art/README.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md)). The owner's first reaction to the lab's first 20 directions (AI, Blender, vector and hybrid) was **"nothing is a candidate"**, along with an instruction to follow the existing design guide (badge-lab `review/STATE.md`, local).

**The share card.** On **2026-10-12** the owner rejected the XP launch share card with "I do not like it", and the share button was hidden until it is reworked ([docs/TODO.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/TODO.md)). That card is a pre-made 800×800 background image with Rubik text drawn on top ([GetXpShareCard.php](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/src/Services/GetXpShareCard.php)). In other words, it is exactly the "AI background plus programmatic text" pattern an Instagram pipeline might reach for first. The design spec states the principle that should govern this pipeline: a share that sends a picture the owner does not like "is worse than none" ([design-spec.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/features/xp-levels/ux-polish/design-spec.md)). Why the owner disliked it (composition, style or execution) is not recorded. It is the first open question.

**The community.** Vox's March 2026 piece is titled "The hobby that AI is ruining for its fans". Hobbyists keep lists of suspected AI puzzles, and premium brands market human-made art ([Vox](https://www.vox.com/the-highlight/480106/ai-jigsaw-puzzles-artificial-intelligence-genai)). When it acted as licensor, Ravensburger told a partner that "Generative AI cannot be used in any part of the art process" ([BoardGameWire](https://boardgamewire.com/index.php/2024/03/02/awaken-realms-pulls-ai-art-from-deluxe-puerto-rico-kickstarter-after-ravensburger-steps-in/)). Instagram's head calls flattering imagery "cheap to produce and boring to consume" and sets the bar at "something that only you could create" ([Tom's Guide](https://www.tomsguide.com/ai/instagram-says-ai-killed-the-curated-feed-now-its-scrambling-to-prove-whats-real)).

Taken together: the highest risk is any AI image that looks like puzzle art, finished puzzles, hands or real people. The lowest risk is code-drawn data design.

The case for AI deserves a fair hearing. Six ChatGPT-made homepage illustrations did ship on MSP in July 2026, after heavy prompt iteration ([commit 7a631d35](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/commit/7a631d35)). Local klein 4B was judged "closest to house art style" when used as a renderer over code-made structure (badge-lab `explore/X1-klein4b/README.md`, local). AI is not banned. It is a bounded tool that has to beat a code baseline in front of the owner.

### The production stack, from default to optional

The stack runs in five tiers. The default comes first; every later tier is used less often or is optional.

| Tier | Role | Tools (all local unless noted) | Marginal cost |
|---|---|---|---|
| 1. Templates (every post) | Typography, numbers, charts, logo, badge art, layout | HTML/CSS/SVG rendered by **Playwright Chromium** to JPEG; **Observable Plot** or hand-written D3 as inline SVG; **Rubik** (OFL, already in the MSP repo) with `tabular-nums lining-nums`; existing brand tokens and the 81 badge SVGs | €0; seconds per slide |
| 2. Signature puzzle visuals (weekly) | Correct interlocking pieces, assemble and explode shots | **Blender 5.2.2 headless**: Python-generated tab-and-blank piece geometry, top-down UV texture, EEVEE for animation, Cycles for hero stills | €0 |
| 3. Motion (Reels and Stories) | Count-ups, histogram builds, bar-chart races, slideshows | **Remotion** (shares the same HTML/CSS); ffmpeg slideshow with VideoToolbox as the zero-dependency fallback; Revideo (MIT) if Remotion's licence stops fitting | €0 for teams of 3 or fewer; otherwise $25/seat/month |
| 4. Bounded local AI (optional) | Text-free backgrounds, textures and spot illustrations from a curated library made once and reused | **Z-Image Turbo** and **FLUX.2 klein 4B** (Apache-2.0, already on disk) in ComfyUI; flood-fill or BiRefNet cut-outs; composited by code | €0 |
| 5. Hosted AI (optional, paid) | Only if a bake-off shows local quality is insufficient | **Nano Banana 2.1** as workhorse, **Recraft** (paid plan) for style-locked or SVG illustration, **GPT Image 2.5** for rare hero edits | €10–50/month |

Each tier rests on specific evidence:

- **Playwright over Satori or Takumi.** Playwright supports full CSS and screenshots straight to JPEG at exact pixel sizes ([Playwright types](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/types/types.d.ts)). Satori is "not a complete CSS implementation", with no `z-index` and no `calc`, so an LLM-authored template would break silently ([Satori](https://github.com/vercel/satori)). Playwright's Chromium builds are already cached on the Mac.
- **Chart design.** The rules that make data look premium on a phone are editorial ([Datawrapper](https://www.datawrapper.de/blog/text-in-data-visualizations); [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)):
  - one idea per slide
  - a title that states the takeaway
  - direct labels instead of legends
  - a 200–400 px hero number
  - body text of at least 36 px on a 1080-wide canvas
  - a source-and-date footer
  - contrast of at least 4.5:1
- **Blender.** Diffusion models draw jigsaw pieces wrong. Blender draws them correctly, deterministically and seedably. The badge lab showed that Blender toon shading with Freestyle lines reproduces the house outlined look with md5-identical re-renders (badge-lab `explore/X7-blender-npr/README.md`, local). Headless runs use `blender --background --python` ([Blender API](https://docs.blender.org/api/current/info_tips_and_tricks.html)). The puzzle image on the pieces must be MSP-owned or permissioned.
- **Remotion licence.** Remotion is free for individuals and companies with **up to three employees**. A pending 5.0 licence would also count contractors ([Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md); [PR #3750](https://github.com/remotion-dev/remotion/pull/3750)).
- **Local AI video.** Not practical. Wan 2.2 took **1 h 22 min for a 2-second clip** on Apple Silicon, and LTX-2 produced broken output on MPS ([lilting.ch](https://lilting.ch/en/articles/ltx2-wan22-mac-local-video-gen)).

The house style already exists and should be inherited, not reinvented. The MSP design system defines coral `#EC726F` as the marketing colour, with indigo `#4e54c8`, sky `#69b3fe`, navy `#2b3445` and Rubik ([design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md)). A "semi-flat outlined" illustration prefix ([style-prefix.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/prompts/style-prefix.md)) is backed by measured rules: one navy ink, a fixed stroke as a percentage of canvas, same-hue washes lit from the top-left, no gloss, and no faces ([tools/badge-art/README.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md)). The badge toolkit's `jigsaw_piece()` helper and its QA gate let Claude write new on-brand SVG spot illustrations. In the lab's cold-start test, a fresh session added two badges that both passed the gate on the first draft.

Template fatigue is the main slop risk for a code-first feed. Rotate four to six layouts per pillar and vary the hooks. Make every slide carry one human-readable "so what".

### Which models to use, avoid or delete

Licences decide here, not leaderboards. The top open-weight models of October 2026 are all off-limits for a commercial account in the EU, and some are already on the disk.

| Model | Verdict | Reason (as of 2026-10-13) |
|---|---|---|
| Z-Image Turbo | **Use** (bounded slots) | Apache-2.0, on disk; Q8 median 80 s per image in the lab ([HF](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo)) |
| FLUX.2 klein 4B | **Use** (edits and reference style) | Apache-2.0, on disk; median 60 s over 178 lab runs; shares Z-Image's text encoder ([HF](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B)) |
| Qwen-Image-Edit-2511 | Use sparingly | Apache-2.0, but needs ~28 GB of memory with one image and ~6 min per edit in the lab ([HF](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)) |
| HiDream-O1-Image | Trial only | MIT and highest-ranked of the permissive models (AA ~982), but the official repo targets CUDA; MPS support unverified ([GitHub](https://github.com/HiDream-ai/HiDream-O1-Image)) |
| FLUX.2 klein 9B | **Avoid; delete** | FLUX Non-Commercial License; 18.7 GB on disk with its encoder ([HF](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B)) |
| FLUX.2 [dev] | Avoid | Non-commercial model use; 64 GB single file ([BFL license](https://bfl.ai/legal/non-commercial-license-terms)) |
| Qwen-Image-2.1, Ideogram 4.0 weights | Avoid | Research and non-commercial licences, despite top ranks ([HF](https://huggingface.co/Qwen/Qwen-Image-2.1); [Ideogram](https://ideogram.ai/blog/ideogram-4.0/)) |
| HunyuanImage 2.1/3.0 | Avoid | Licence territory excludes the EU, UK and South Korea ([license](https://huggingface.co/tencent/HunyuanImage-3.0/blob/main/LICENSE)) |
| Krea 2 | Avoid | Free only under USD 1M revenue; 35+ GB ([Krea](https://krea.ai/krea-2-licensing)) |
| SDXL stack | **Delete** | Failed every lab test ("G = 1 in every cell"); ~10.5 GB |
| Midjourney | Avoid | No API, and automation is forbidden ([Midjourney](https://docs.midjourney.com/community-guidelines)) |
| gpt-image-1 / 1-mini / 1.5 | Avoid | Shut down 2026-10-23 and 2026-12-01 ([OpenAI](https://developers.openai.com/api/docs/deprecations)) |
| Recraft free plan | Avoid | Outputs are owned by Recraft, public and non-commercial ([Recraft](https://www.recraft.ai/pricing?tab=api)) |

With **82 GiB free**, deleting the klein 9B and SDXL files reclaims ~29 GB. That should happen before any new download. The only addition worth trialling is HiDream-O1 at 16.4 GB.

Hosted options, if needed:

- **Nano Banana 2.1** (released 2026-10-06) ranks **#4 on both** the Artificial Analysis text-to-image and editing boards. It costs **$0.0336 per 1K image, or $0.0168 in batch**, supports 4:5 natively and takes 14 reference images ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing); [AA](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)).
- **GPT Image 2.5** leads both boards at about **$0.21 per image at max quality** ([AA](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)).
- **Cloudflare Workers AI** offers 10,000 free "neurons" a day, which covers hosted klein 4B ([Cloudflare](https://developers.cloudflare.com/workers-ai/platform/pricing/)). It adds little, because the same model is free locally.

OpenAI and Google outputs carry **C2PA metadata and SynthID** ([Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation); [OpenAI Help](https://help.openai.com/en/articles/8912793)). An external test found Instagram reading IPTC provenance fields ([IPTC](https://iptc.org/news/ai-disclosure-on-social-media-a-work-in-progress/)). Hosted AI imagery will probably get an "AI info" label whether or not MSP adds one, so disclose it deliberately with the API's `is_ai_generated` flag. Code-rendered charts need no label.

### Cost at three budget levels

| Budget | What it buys |
|---|---|
| **€0/month** (recommended start) | Every tier above using local tools already installed, plus a public bucket for a few short-lived JPEGs a week (cost not priced in the research, expected to be negligible). Music from original or SFX audio, or Pixabay/Mixkit tracks without Content-ID marks ([Pixabay FAQ](https://pixabay.com/service/faq/); [Mixkit](https://mixkit.co/license/)) |
| **~€10/month** | Adds 400–600 Nano Banana 2.1 batch generations for backgrounds or spot art, if the bake-off favours them |
| **~€50/month** | Nano Banana 2.1 at 2K as workhorse, Recraft custom-style or SVG illustration, and 20–40 premium GPT Image 2.5 edits ([OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)) |

Not worth paying for:

- **Template SaaS.** Bannerbear, Placid, Templated and Creatomate cost about $19–54 a month and add nothing over HTML. Canva Autofill needs Pro ([Canva](https://www.canva.dev/docs/connect/autofill-guide/)).
- **Mixpost Pro**, a $299 one-time licence ([Mixpost](https://mixpost.app/pricing)).

If AI is used at all, the art direction is fixed in a file:

- a hex palette
- one named illustration idiom
- a banned-traits list: no text, glow, gloss, lens flare, floating puzzle pieces, faces or hands
- one to five fixed reference images
- one metaphor per image
- an empty zone reserved for code-rendered type

These are the practices that separate art-directed output from slop ([Wildsite](https://wildsite.substack.com/p/what-looks-like-ai-slop); [Gemini docs](https://ai.google.dev/gemini-api/docs/image-generation)).

## Instagram's API forces 4:5 JPEGs, public URLs and app-side scheduling

The existing **Instagram API with Instagram Login** (graph.instagram.com) is the right foundation. Standard Access covers accounts MSP owns, so no App Review is needed ([Overview](https://developers.facebook.com/docs/instagram-platform/overview)). The live token reads profile, media, insights, comments and the publishing quota. **`quota_total` was 100 posts per 24 h** on 2026-10-13, settling a contradiction in Meta's docs (100 vs 50) for this account ([IG API audit](https://graph.instagram.com/v25.0/me/content_publishing_limit)). Graph API **v25.0 remains available until 2028-07-29** ([Graph API changelog](https://developers.facebook.com/docs/graph-api/changelog)).

| Constraint (as of 2026-10-13) | What it forces in the design | Source |
|---|---|---|
| Images: **JPEG only**, ≤8 MB, sRGB, width 320–1440 px, aspect **4:5 to 1.91:1** | Export JPEG q90–95 sRGB; a preflight validator before creating any container | [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media) |
| Carousels: **2–10 items** via the API (the app allows 20); every slide cropped to slide 1's ratio | Cap at 10 slides; render every slide at 4:5 | [Content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/) |
| **No image upload endpoint**: Meta fetches a public HTTPS URL; resumable upload is video-only and documented only for Facebook Login | A public bucket with random ASCII keys and correct `Content-Type`; let Meta's crawler past bot protection | [Content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/); [Ayrshare](https://www.ayrshare.com/docs/help-center/technical-support/meta_media_crawler_blocked) |
| **No scheduling parameter**; containers expire after 24 h; poll status at most once a minute for 5 min | The app schedules itself; create the container near publish time | [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media) |
| Caption: 2,200 characters, 20 mentions; API says 30 hashtags, but the app has capped at **5** since Dec 2025 | Generator enforces ≤5 hashtags and counts characters, not bytes | [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media) |
| **Captions can't be edited after publishing**; media DELETE is documented as Facebook Login only | Proofreading happens in the approval step | [IG Media](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media) |
| `alt_text` (≤1,000 characters, images only), `collaborators` (≤3), `user_tags`, `is_ai_generated` (since 2026-06-22), Trial Reels via `trial_params` (since 2025-12-03) | Generate alt text from stats; Collab posts for borrowed reach; AI flag on the carousel parent | [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog) |
| Stories: no link, poll or location stickers | Interactive Stories are posted by hand | [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media) |
| Insights: `views` replaced `impressions`; data can lag 48 h; kept 2 years; **no insights webhooks under Instagram Login**; Story metrics only within 24 h; no per-slide carousel insights | Polling at +48 h, +7 d and +30 d; Story pull at +20 h; local SQLite becomes the long-term record | [Media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights) |
| Long-lived tokens last 60 days; refresh only when ≥24 h old and still valid | Automated refresh plus a 7-day expiry alert; an expired token needs a manual re-issue | [Business Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login) |

The token needs attention now. The `.env` holding it was last modified on 2026-09-17. If the token was minted or refreshed that day, it expires around **mid-November 2026** ([IG API audit](https://graph.instagram.com/v25.0/me)). The refresh step therefore belongs in week one.

### Publish 4:5, design for the 3:4 grid

The profile grid has shown **3:4 center-cropped thumbnails since January 2025**, and size guides now suggest 1080×1440 ([Kapwing](https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/)). The API, however, rejects anything taller than 4:5 with error **36003/2207009** ([Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)). The 3:4 ratio (0.75) is narrower than the API's 4:5 minimum (0.80).

The resolution: **publish every feed image and carousel slide at 1080×1350 (4:5)** and keep the headline, hero number and logo inside the **central 3:4-safe area**. Cropping 4:5 to 3:4 trims the sides, keeping about 1012×1350 px, so about 34 px goes from each edge. In practice, keep critical content within the central ~1000 px of width ([Oktopost](https://www.oktopost.com/blog/instagram-grid-size-guide/)). One guide says portrait uploads lose their tops and bottoms. That holds for 9:16 covers, not for 4:5.

Slide 1 sets the ratio for the whole carousel, so it must be 4:5. One test container at 3:4 should confirm the rejection, but nothing should depend on 3:4 working.

Reels and Stories are 1080×1920. Keep critical content inside the central ~950×980 px, clear of the top 14%, the bottom 35% and the right-hand action rail ([Hopper HQ](https://www.hopperhq.com/blog/instagram-reel-size/)). A 9:16 Reel cover loses 240 px at the top and the bottom in the 3:4 grid.

### Licensed music would mean switching to Facebook Login

Meta's **Instagram Audio API** launched on **1 June 2026**. It lets API-published Reels attach "music authorized for third party use", but it is **available only with Facebook Login**, not Instagram Login ([Audio API](https://developers.facebook.com/documentation/instagram-platform/content-publishing/audio-api)). Under the current setup, a Reel publishes only the audio embedded in its MP4.

The trade-off is concrete. **Staying on Instagram Login** keeps the working token and needs no Facebook Page. Reels then use original sound, SFX, or licensed royalty-free tracks:

- Pixabay or Mixkit tracks without Content-ID marks.
- Free Music Archive tracks under CC BY with credit, never CC BY-NC ([FMA](https://freemusicarchive.org/License_Guide)).
- Not YouTube Audio Library tracks, which YouTube vouches for only on YouTube ([YouTube Help](https://support.google.com/youtube/answer/3376882?hl=en)).

Keep a licence ledger per track so that wrongful claims can be disputed.

**Switching to Facebook Login** means linking a Facebook Page and handling Page roles. In return it unlocks:

- the Audio API
- resumable local video upload
- API media deletion
- product tags and partnership labels
- shares and saves counts on media objects

Meta notes that the music selection may differ from the in-app library ([Audio API](https://developers.facebook.com/documentation/instagram-platform/content-publishing/audio-api)). Images would still need a public URL.

The recommendation is to stay on Instagram Login through the first three phases. Data Reels work with the sound off because their text is burned in. For the occasional trend-audio Reel, the owner can add music by hand in the app. Revisit the decision only if Reels become a main pillar and music measurably matters.

## A file-based pipeline where Claude drafts and a script publishes

### Components and data flow

The off-the-shelf schedulers don't fit:

- **Postiz** is the only maintained open-source scheduler that self-hosts Instagram Login publishing. Its docs state "there is no 'approved' flag that blocks publishing", and it needs Postgres, Redis and Temporal on a laptop ([Postiz approvals](https://docs.postiz.com/general/approvals.md); [Postiz requirements](https://docs.postiz.com/self-host/installation/system-requirements.md)).
- **Mixpost Lite** has no Instagram support at all ([Mixpost](https://mixpost.app/pricing)).

For one account with an approval-centred flow, a small custom app over plain files is lighter. Claude Code can also read and diff plain files directly.

```
production Postgres ──(read-only role, instagram.* views only)──► queries/*.sql ──► facts snapshot + provenance
                                                                                        │   (content/, gitignored)
Claude Code skills: /ig-plan-week → /ig-draft → /ig-revise ──► draft.yaml (caption, alt text, slides, consent)
                                                                                        │
templates/ (HTML/CSS/SVG, Rubik, tokens, badge SVGs) ──Playwright──► render/vN/slide-NN.jpg ──► QA gate
                                                                                        │
review app (127.0.0.1, FastAPI + htmx, IG mockups) ◄──► feedback.jsonl + status transitions
                                                                                        │ approved
publish_due.py (no LLM) ──► public bucket URL ──► IG container ──► media_publish ──► state.sqlite
                                                                                        │
pull_insights.py (+20 h Stories, +48 h, +7 d, +30 d) ──► state.sqlite ──► /ig-insights ──► editorial/learnings.md
```

**Data layer.** Committed, parameterised `queries/*.sql` files run against about ten aggregate views:

- totals
- monthly figures
- distributions by piece count and group size
- weekday and hour
- brands
- countries
- top puzzles
- difficulty
- competitions
- badges and XP

The views port the app's existing query semantics, so Instagram numbers match the site. Examples are `GetStatistics`, `GetFastestPlayers` and `IsCompetitionPubliclyVisible` ([GetFastestPlayers.php](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/src/Query/GetFastestPlayers.php); [IsCompetitionPubliclyVisible.php](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/src/Query/IsCompetitionPubliclyVisible.php)). Development runs against the local snapshot, which ends 2026-09-25. Each draft stores a facts snapshot with its query file, parameters, SHA-256 and snapshot time, so every published number can be traced.

**Rendering.** One persistent Chromium renders `feed-4x5` (1080×1350) and `story-9x16` (1080×1920) templates from a JSON payload. It waits for `document.fonts.ready`, disables animations and writes the exact JPEG that will be uploaded. What the owner approves is byte-identical to what gets published.

A QA gate runs before every screenshot. It checks:

- every number in the rendered DOM against the facts snapshot
- WCAG contrast
- that bounding boxes stay inside the 3:4 grid-safe and Reel safe zones

A visual critic then reads the JPEG against a rubric with hard caps, ported from the badge lab: wrong data, off-palette ink, illegible text and bad puzzle anatomy cap the score no matter how charming the rest is.

**Review app.** Python FastAPI with Jinja2 and htmx, about 300–500 lines, bound to `127.0.0.1` with no auth. It renders three views:

- **Feed:** a phone-width frame with avatar and username, media locked at 4:5, scroll-snap carousel with a "1/N" badge and dots, and the caption cut at ~125 characters with "… more". Hashtags and mentions are styled, and live counters show characters against 2,200 and hashtags against 5.
- **Grid:** the draft as the top-left tile beside the last real posts (fetched once and cached), all center-cropped to 3:4, with a toggleable safe-area overlay.
- **Story/Reel:** a 9:16 frame with toggleable UI safe-zone overlays.

The app also shows light and dark modes, alt text per slide, and warnings for non-JPEG files, wrong ratios or more than 10 slides.

The owner's actions are:

- **Approve**, with a schedule time.
- **Reject**, with a reason from a short taxonomy: off-brand, factually wrong, weak hook, privacy, duplicate.
- **Request changes**, aimed at the caption, a slide, alt text or hashtags.
- **Pick** between 2–4 visual candidates.
- **Edit the caption inline.** The edit is saved as `author: human`, and Claude must never overwrite it.

Streamlit and Gradio fight this kind of pixel-faithful custom HTML. A pure CLI cannot show truncation or the grid, so it stays only as a scripting fallback.

**Draft storage.** Each draft is a folder `content/drafts/<id>/` containing:

- `draft.yaml` (validated against a JSON Schema)
- an append-only `feedback.jsonl`
- `data/snapshot.json`
- versioned renders and candidates

Each draft moves through these states:

- idea → drafted → in_review
- in_review ⇄ changes_requested, until the owner is satisfied
- approved → scheduled → publishing → published
- side exits: rejected, failed, needs_reschedule

One `content/state.sqlite` holds the publish log (the idempotency source of truth), insights snapshots and account snapshots. All of `content/` is gitignored, because drafts mix in database-derived personal data and unpublished ideas. If drafts should be versioned, use a private nested repository.

Short, sanitised editorial memory files are committed and read by every drafting skill:

- `brand-voice.md`
- `pillars.md`
- `posting-calendar.md`
- `learnings.md`
- `rejected-ideas.md`

### Claude Code skills and guardrails

Project skills live in `.claude/skills/<name>/SKILL.md`. They can inject live state with `` !`command` `` and declare `disable-model-invocation: true` for side-effecting actions ([Claude Code skills](https://code.claude.com/docs/en/skills)).

| Skill | What it does | Guard |
|---|---|---|
| `/ig-plan-week` | Reads the editorial memory, an insights summary and fresh facts; proposes N ideas with pillar, hook, query and format; writes `status: idea` drafts | Checks `rejected-ideas.md` first |
| `/ig-draft` | Runs the queries, snapshots the facts, writes caption and alt text, renders slides and candidates; sets `in_review` | `context: fork` keeps heavy data work out of the main session |
| `/ig-revise` | Applies unresolved `feedback.jsonl` items as version N+1 and marks them resolved | Never overwrites `author: human` edits |
| `/ig-review` | Starts the local app and prints its URL | Read-only |
| `/ig-insights` | Pulls metrics, aggregates by pillar, format, slot and caption length using medians, and updates the "current beliefs" in `learnings.md` | Aggregates only, no member names |
| `/ig-publish-due` | A thin human-triggered wrapper around `publish_due.py` | `disable-model-invocation: true`; allowed tool limited to that one script |

Optional subagents split the work: a read-only data analyst that returns facts with provenance, a copy editor for voice, a privacy checker that blocks names or photos without consent, and a visual critic.

Claude never holds the ability to publish. There is no Instagram publishing MCP; if one is wanted for analysis, it must be read-only. The scheduler calls the publish script directly.

Unattended drafting is optional. Example: a Monday 07:00 launchd job running `claude -p "/ig-plan-week" --permission-mode dontAsk --allowedTools … --max-budget-usd 3` ([Claude Code headless](https://code.claude.com/docs/en/headless)). With a subscription login it must run without `--bare`, because `--bare` requires an API key. Whether the keychain prompt blocks under launchd has not been tested.

### Publishing from a laptop that sleeps

`publish_due.py` is deterministic and idempotent. On each run it:

1. Takes a lock.
2. Loads approved drafts that are due.
3. Skips anything already in the publish log.
4. Refuses posts more than N hours late (for example 6 h; less for time-sensitive event posts) and marks them `needs_reschedule` with a macOS notification.
5. Uploads to the public bucket and creates the container, recording its ID immediately.
6. Polls the container status, then calls `media_publish`.
7. Records the media ID and permalink.
8. Deletes the public copy; a 7-day lifecycle rule catches stragglers.

Before any retry it checks the quota and the latest media, so a crash cannot double-post.

Hosting choices:

- A dedicated **Cloudflare R2 bucket** with a public custom domain fits well. Disable bot protection for Meta's `facebookexternalhit` fetcher, or Meta will see 403s ([Ayrshare](https://www.ayrshare.com/docs/help-center/technical-support/meta_media_crawler_blocked)).
- MSP's own upload bucket is private behind credentialed imgproxy, so it is the wrong place for this.
- Tunnels to the Mac are fragile.

Start in the simplest reliable mode: **approve means publish now**, while the owner is at the Mac. Add scheduling later with a launchd LaunchAgent running every 15 minutes through `caffeinate`. launchd starts jobs missed during sleep at the next wake, while cron skips them ([Apple forums](https://developer.apple.com/forums/thread/52369)). With the lid closed, nothing runs until it opens ([Apple forums](https://developer.apple.com/forums/thread/815034)). Claude Desktop scheduled tasks skip runs while the machine sleeps, so they are unsuitable ([Claude Code docs](https://code.claude.com/docs/en/desktop-scheduled-tasks)). A cloud cron would break the local-only rule and put the token in the cloud.

### The insights feedback loop

`pull_insights.py` fills `state.sqlite`:

- **Feed posts** at +48 h, +7 d and +30 d: views, reach, likes, comments, shares, saved, follows and profile visits.
- **Reels:** watch time and skip rate.
- **Stories:** within 24 h.
- **Account level, weekly:** follows and unfollows, reach split by followers vs non-followers, and online followers.

Under Instagram Login there are no webhooks, so polling is the only option ([Media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)). Pre-business media return error subcode 2108006 and should be treated as "no data".

The KPIs follow Instagram's stated signals: **sends per reach** for growth, **likes per reach** for followers, saves per reach for reference posts, and follows per post. Compare them by medians against the baseline:

- ~900 reach and 8.5% engagement per regular post
- 1 follow per post
- +30 to +90 net followers in an active month

Comment replies in the first hours matter too, because sends and DMs are where sharing now happens.

### Secrets and personal data never reach git or the model

**The database role is the must-fix.** The production role created on 2026-10-13 with `pg_read_all_data` is read-only by default and cannot INSERT or UPDATE. But it can **SELECT every table, including `user_account` with emails** (prod DB Q53). It must be narrowed before anything runs unattended.

The fix:

1. Revoke the broad grant.
2. Create a dedicated `instagram` schema of views and grant the role only `USAGE` on it and `SELECT` on the views.
3. Bake the app's rules into the views: no suspicious results; no private or ranking-opted-out players in any named list; no `hide_until` or `hide_image_until` embargoes; public events only; no emails, avatars or comments.
4. Set `statement_timeout`, `idle_in_transaction_session_timeout` and a connection limit on the role.

The alternative with the smallest attack surface is an MSP-side scheduled aggregate JSON export, so the pipeline never holds database credentials at all. The internal admin API token has write power and must not be reused.

Until the fix lands, run only interactive, aggregate-only queries with timeouts, the same discipline the research itself followed.

**The repository already has a good first layer.** The `.gitignore` excludes `.env*` (except `.env.example`), keys, tokens and generated folders. A committed pre-commit hook in `.githooks/` blocks:

- staged env files
- any staged line that contains a value from the local `.env`
- literals from a gitignored `.secret-patterns` list, such as hostnames
- credential shapes such as `IGAA…` tokens and credentialed Postgres URLs

The remaining layers:

- **Ignore the pipeline's local data:** add `content/`, `*.sqlite*` and `logs/` to `.gitignore`.
- **Claude Code deny rules** for `Read(.env*)`, `Bash(env)` and `Bash(printenv *)`, **with the sandbox enabled**. Deny rules do not stop a Python or Node subprocess from reading files ([Claude Code permissions](https://code.claude.com/docs/en/permissions)).
- **A `PreToolUse` hook** that exits 2 on any `.env` or `secrets/` access ([hooks guide](https://code.claude.com/docs/en/hooks-guide)).
- **gitleaks** as a second scanner, plus a full-history scan before the first push. The repository had no commits as of 2026-10-13, so this is the cheapest moment ([gitleaks](https://github.com/gitleaks/gitleaks/blob/master/README.md)).
- **GitHub push protection**, free for public repositories ([GitHub](https://github.blog/news-insights/product-news/push-protection-is-generally-available-and-free-for-all-public-repositories/)).
- **Secrets resolved only inside scripts**, through the macOS Keychain or `op run` ([1Password](https://developer.1password.com/docs/cli/reference/commands/run)).
- **Redaction of `access_token=` and `Bearer` strings** from every log line. Graph API tokens travel in query strings, and Claude Code transcripts persist any tool output that echoes them.

Personal data is handled like a secret:

- **Defaults:** anonymous records, and coarse superlatives that never combine country, puzzle and a small population.
- **Fixtures:** synthetic names only.
- **Prompt injection:** puzzle names and bios are user-generated text that could carry instructions. The sandbox and a non-LLM publisher limit what such an injection could do.

## Ship one carousel in week one, automate later

The roadmap delivers value before it delivers automation. The first slice is one real post the owner is proud of, made by code.

| Phase | When | Deliverables | Done when |
|---|---|---|---|
| **0. Make it safe** | Days 1–2 | Token refresh script with Keychain storage and expiry alert; `.gitignore` additions, deny rules, sandbox, hook, gitleaks and push protection; owner narrows the DB role to `instagram` views (or decides on export); one test container each at 4:5 and 3:4 | Token valid past mid-November; full-history scan clean; role cannot read the account table |
| **1. Smallest valuable slice** | Week 1 | One template family (big-number plus chart carousel), three views, `/ig-draft` producing slides, caption and alt text; a static HTML preview with feed and grid crop; **owner posts by hand**. First posts: launch-day archaeology, September record month, the 59-minute wall. In parallel, a **visual-direction bake-off**: the same post in 3–4 directions (pure typographic, LLM-SVG illustrated, Blender puzzle, AI-assisted background) shown in the mockup, plus the share-card rejection reason recorded | Owner approves 2+ posts with no manual design work and picks a direction |
| **2. Review app and API publishing** | Weeks 2–3 | FastAPI/htmx app with the state machine, `feedback.jsonl` and `/ig-revise`; public bucket; preflight validator; `publish_due.py` in approve-means-publish-now mode; insights pulls at +48 h and +7 d | A post goes from idea to published without leaving the app; double-publish test passes |
| **3. Cadence and learning loop** | Weeks 4–8 | Three-to-four-post weekly rhythm; `/ig-plan-week`; editorial memory; launchd scheduling with a lateness window; Story asset exports; 300M-pieces countdown (late Nov) and 600k-results milestone (early Dec), both re-checked; MSP Wrapped 2026 in December; first Collab posts with brands or associations | Six weeks with no zero-post week; first `learnings.md` beliefs backed by data |
| **4. Motion, discovery and optional AI** | Dec 2026 – Q1 2027 | Reels via Remotion or ffmpeg plus Blender assemble shots, tested as Trial Reels; February–March championship coverage; if the bake-off supports it, a curated library of AI textures and spot art made once and reused; optional hosted-image budget; revisit Facebook Login if music matters; optional unattended Monday drafting | Reel watch time and non-follower reach measured against carousels |

## Decisions only the owner can make

| # | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| 1 | **Why was the XP share card rejected on 2026-10-12**: composition, art style, execution or the idea? | It is the only direct evidence of the owner's taste in social graphics | Treat AI-background cards as rejected; start code-only |
| 2 | Which visual direction wins the bake-off, and should MSP state publicly that it doesn't use AI-generated puzzle art? | Sets the look and the trust posture in an AI-wary hobby | Typographic data design plus LLM-written SVG; no AI puzzle imagery |
| 3 | DB access: an `instagram` views schema or an MSP-side aggregate export, and when? | A must-fix before unattended runs; least privilege | Views schema; interactive use only until then |
| 4 | Consent: will MSP add an opt-in "feature me on Instagram" flag and a social-media clause to the privacy policy? | Named recaps, tags and Collab spotlights plausibly drove the old recaps' shares (the most-shared non-giveaway posts, though only 8–12 shares each; Instagram doesn't attribute shares), but they are not covered today | Anonymous aggregates only |
| 5 | Box art and members-only insights: ask Ravensburger for permission, and publish difficulty data as a membership teaser? | Unlocks puzzle spotlights and "hardest 500" posts | Illustrations or text cards; no difficulty data |
| 6 | Which "monthly active" definition does the site use publicly? | The two counts differ (2,956 vs 2,687 for September) | Logging-based counts, with the definition in the footer |
| 7 | Weekly review time and cadence commitment: is 3 posts a week realistic, and is "approve means publish now" acceptable at first? | Consistency is the main growth lever | 3 per week, batch approval on Sunday |
| 8 | Media host: a new R2 bucket or other public storage? | Required for every API publish | Dedicated R2 bucket, objects deleted after publish |
| 9 | Stay on Instagram Login, or link a Facebook Page for the Audio API, deletion and local video upload? | Decides how Reels get music | Instagram Login; royalty-free or original audio |
| 10 | Headcount including contractors | Remotion's free-licence eligibility | Remotion if 3 or fewer; ffmpeg or Revideo otherwise |
| 11 | Budget for hosted imagery and music: €0, €10 or €50 a month? | Gates tier 5 and paid music | €0 |
| 12 | Giveaway policy: how many a year, and tied to which events? | The account's best follow engine, but not recommended to non-followers | 2–3 a year, tied to WJPC and national championships |
| 13 | Disk: delete klein 9B and the SDXL stack (~29 GB)? | 82 GiB free; a licence-unusable model sits on disk | Delete before any new download |
| 14 | What drove the April 2026 solve surge and September's national-park favourites? | Possible campaigns to credit or avoid misreading | Leave out until explained |

## Conclusion

The research changes what "automation" means here. The bottleneck was never ideas or data. MSP holds 72 years of logged solving and already computes most needed aggregates. The bottleneck was making a branded weekly post by hand, and that killed the one series that worked. The pipeline's job is to make consistency nearly free while keeping the owner's taste as the only gate. That points to code, files and a faithful preview, not to a better image model. The badge lab reached the same conclusion from the other direction, and the hobby's open hostility to AI art makes it the safer bet as well as the cheaper one.

Two less obvious levers determine how far the account grows. The first is consent, not design. The old recaps were the most-shared regular posts, plausibly because they featured real puzzlers (Instagram doesn't say who shared), and no data graphic can replace a member sharing a post that celebrates them. A simple opt-in flag plus Collab posts turns the privacy constraint into a growth mechanic. It is the natural precursor to personalised "MSP Wrapped" share cards on the site itself. The second is least privilege. A pipeline in a public repository, fed by a role that can read every email address, is a bigger risk to MSP than any off-brand post. Narrowing that role is the one task that cannot wait for phase 3.
