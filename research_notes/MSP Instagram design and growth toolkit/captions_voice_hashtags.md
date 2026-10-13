# Captions, hashtags, tagging and community voice for @myspeedpuzzling (as of 2026-10-13)

Method note: round 2 research, run on 2026-10-13. It builds on round 1 ([report](../../reports/MSP%20Instagram%20content%20pipeline.md); [ig_growth_strategy notes](../MSP%20Instagram%20content%20pipeline/ig_growth_strategy.md); [account audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)) and does not repeat it except where a number is needed. Limits that shaped this round:
- Reddit (r/Jigsawpuzzles, r/speedpuzzling) could not be fetched or searched: both WebFetch and domain-filtered search are blocked for reddit.com. Puzzle-language evidence therefore comes from organisers' sites, news features, creator blogs and Wikipedia.
- The session's web-search budget ran out partway through. Later evidence comes from direct fetches of known primary URLs.
- Instagram Help Center and Meta Transparency Center pages render empty to the fetcher, so official wording is quoted from reputable coverage (mainly Social Media Today).

Owner decisions that override round 1 apply here ([docs/decisions.md](../../docs/decisions.md)): players are featured the way MSP already shows them publicly, with no opt-in. Private profiles, ranking opt-outs and a local do-not-feature list are respected. Players are tagged only with the Instagram handle on their MSP profile. No individual players are named in this file.

## 1. Hashtags in 2026: what Instagram says, the 5-hashtag cap, studies, keywords and Google

### Takeaway
Instagram's own line since 2025 is that hashtags **classify** a post but do **not** increase reach. Since December 2025 the app has been rolling out a cap of **5 per post**, which reportedly includes hashtags in the first comment. Meta's API docs still say 30. The best 2025–2026 data shows the hashtag effect on reach is **tiny either way**. The largest study (Metricool, 24M posts) found a negative correlation; Fanpage Karma (1.6M posts) found 5 tags worth about +2% reach versus none. For MSP the answer is neither "obsolete" nor "growth lever": use **2–4 precise niche/event hashtags at the end of the caption**, and put the real discovery effort into keyword-rich captions. Instagram search and, since July 2025, Google both read captions.

### Cited Findings
**What Instagram officially says**
- 18 Dec 2025: Instagram's @creators account announced on Threads that it "will gradually update the number of hashtags that you can include in a caption" to five, for posts and Reels. Its stated reasoning: "We find that using fewer (up to 5) more targeted hashtags, rather than many generic ones" performs better and limits misuse. An earlier test had held many users to three — [Social Media Today, 18 Dec 2025](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/)
- Mosseri said in February 2025 that hashtags "don't work" to increase reach. In May 2025 he said they don't improve visibility but are "a great way to let people know what a post is about and connect posts" — [Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/)
- A Mosseri advice-channel post explained the cap: "a few specific tags actually perform better than a long list of generic ones" — [Digital Trends](https://www.digitaltrends.com/social-media/instagram-now-limits-you-to-five-hashtags-per-post/)
- Instagram's Creators blog (2022, updated April 2023) says: "Search results are matched by text, so make sure you're including relevant keywords." It also says: "Use relevant keywords and hashtags in captions" and "put these keywords and hashtags in the caption, not the comments." It recommends keywords in the handle, profile name and bio — [Instagram Creators blog](https://creators.instagram.com/blog/instagram-recommendations-eligibility-tips-creators)
- Mosseri's top three ranking signals are "watch time, likes and sends" ("likes per reach, and sends per reach"). Hashtags are not among them — [Social Media Today, 22 Jan 2025](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)
- Instagram reportedly removed the ability to follow hashtags in late 2024. Secondary source, not verified — [HowSociable](https://howsociable.com/instagram-hashtags)

**The cap: status and enforcement**
- Several 2026 guides say the cap of 5 is shared between the caption and comments, so first-comment hashtags add no slots. One cites Help Center wording that a comment pushing the post over five tags "will not post". Instagram's Help Center could not be fetched to confirm — [SocialBee](https://socialbee.com/?p=79026); [Inro](https://www.inro.social/tools/instagram-hashtag-generator); [RecurPost](https://recurpost.com/instagram-scheduler/instagram-hashtag-limits-and-placement-rules/)
- Conflict: Meta's Graph API error-code reference still lists caption limits of "2,200 characters, 30 hashtags, and 20 @ tags". Some 2026 blogs still say 30 per post and attribute lower caps to account-level tests. How the API treats a caption with 6–30 hashtags is undocumented: rejected, truncated or silently ignored — [Meta error codes](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/error-codes); [Lilach Bullock](https://www.lilachbullock.com/why-instagram-only-lets-you-use-5-hashtags-some-posts/); [Sendcove](https://www.sendcove.app/integrations/instagram/character-limits)
- Detail: a hashtag ends at the first character Instagram doesn't accept, so "#motion-design" registers as "#motion" without any error (search-result summary; source page not fetched) — [Lilach Bullock](https://www.lilachbullock.com/why-instagram-only-lets-you-use-5-hashtags-some-posts/)

**Studies on hashtag count vs reach (2025–2026)**
- **Metricool 2026** (24,364,803 posts, 375,118 accounts, Jan–Feb 2026 vs Jan–Feb 2025): posts with at least one hashtag got **31.70% fewer views and 33.89% fewer interactions** than the platform average. This is correlational. Hashtag-heavy accounts may differ in quality, so treat it as "no evidence of benefit", not proof of harm — [Metricool press release](https://metricool.com/press-release-instagram-study-2026/)
- **Fanpage Karma** (1.6M posts; period and account sizes not stated; page undated but in the 2026 context): **5 hashtags gave the highest reach, about +2% vs none**, with 4 close behind. **1–3 hashtags performed slightly worse than none.** More than 5 lost reach. On engagement, 5 tags was best, 2–3 tags were worse than 0–1, and more than 5 was worst. The authors call the effect small — [Fanpage Karma](https://www.fanpagekarma.com/insights/do-instagram-hashtags-work/)
- **Socialinsider** (75M posts, March 2021–March 2022): hashtag count "does not significantly influence post distribution". This is secondhand and pre-cap — [Search Logistics summary](https://www.searchlogistics.com/learn/statistics/hashtags-statistics/); [Social Media Today on the report](https://www.socialmediatoday.com/news/new-report-highlights-that-instagram-hashtags-dont-significantly-increase/)
- **OUTDATED: Later** (18.1M feed posts, page dated 4 June 2025): 20 hashtags gave the best reach and 30 the best engagement, and it recommends 20–30. This predates the cap and should not be used — [Later](https://later.com/blog/how-many-hashtags-on-instagram/)
- **OUTDATED: Buffer**'s hashtag guide (3 Dec 2024) has no original data. It still says "up to 30 hashtags" and calls caption vs first comment "unclear… test it" — [Buffer](https://buffer.com/resources/instagram-hashtags/)
- **WEAKLY SOURCED:** aggregator figures such as "12.6% engagement lift" and "up to 79.5% more reach" don't trace to an identifiable primary study — [Cropink](https://cropink.com/instagram-hashtag-statistics); [Search Logistics](https://www.searchlogistics.com/learn/statistics/hashtags-statistics/)
- **WEAKLY SOURCED:** Hootsuite reports "SEO-optimized posts can earn 30% more engagement" from an internal test with no sample size or method on the page. It also says "only captions are searchable" while elsewhere listing bios and usernames as search-matched (an internal inconsistency) — [Hootsuite](https://blog.hootsuite.com/instagram-seo/)

**Keyword captions, Instagram search and Google**
- Per Hootsuite's summary of Instagram guidance, search matches text in usernames, bios, captions, hashtags and locations — [Hootsuite](https://blog.hootsuite.com/instagram-seo/)
- A Kontentino article (20 July 2026) reports a July 2026 Mosseri Q&A ("We try to use all the information we can"). It says search reads captions and comments as text, processes images and video with embedding models, and that hashtags classify without expanding distribution. Secondary; the original Q&A was not verified — [Kontentino](https://www.kontentino.com/q-and-a/instagram-search-seo/)
- Public posts from professional (Business/Creator) accounts became eligible for Google and Bing results from **10 July 2025**. Secondary reports say this covers photos, Reels and carousels from 1 January 2020 onward, from account holders over 18, on by default and switchable off. Stories, highlights and DMs are excluded. Whether comments are indexed is disputed, and some sources say indexing already existed in many regions — [Storyboard18](https://www.storyboard18.com/digital/instagram-to-make-public-posts-searchable-on-googlebing-74611.htm); [Social Samosa](https://www.socialsamosa.com/news-2/instagram-public-posts-searchable-google-and-bing-9480780); [Zimmer Communications](https://info.zimmercommunications.com/blog/instagram-meets-seo-why-your-public-posts-can-now-rank-on-google)

**MSP's own history**
- Hashtags per post averaged 10 in 2023, 9.6 in 2024, 3.2 in 2025 and 0.6 in 2026; 34 of the 58 posts since 2025 had none. The most used overall: #speedpuzzling (45), #puzzle (39), #jigsawpuzzle (25), #speedpuzzling500 (25), #jigsawpuzzles (23), #myspeedpuzzling (22) — [IG API audit, 2026-10-13](https://graph.instagram.com/v25.0/me/media)

### Inferences
- **Hashtags are not obsolete, but they are cheap metadata, not a growth tactic.** No credible 2025–26 source shows a meaningful reach gain. The best-designed positive result is +2% at exactly 5 tags (Fanpage Karma); the largest dataset correlates hashtags with *less* reach (Metricool). Whether MSP uses 0 or 4 tags will barely move reach. Spend the effort on the first 125 characters and the visuals.
- **Recommendation: 2–4 hashtags per feed post, in the caption, on the last line.**
  - Why not 0: in a niche, a precise hashtag still helps classification, groups the post with the hobby's tag pages, and costs nothing. Instagram itself recommends "up to 5 targeted".
  - Why not exactly 5: the 5th tag tends to be generic filler, and the cap leaves no room for error if a tag is mis-parsed.
  - Never put hashtags in the first comment: Instagram says caption, not comments, and the cap is reportedly shared anyway.
- **Which kinds:**
  1. **Niche/sport tag, always:** `#speedpuzzling`.
  2. **Hobby tag, always:** `#jigsawpuzzle` (or `#jigsawpuzzles`; pick one and keep it).
  3. **Event tag, when relevant:** for example `#WJPC2026`, or the national championship tag the organisers actually use (verify in-app before use; volumes from third-party trackers were >10× apart in round 1).
  4. **Branded tag, optional:** `#myspeedpuzzling`, worth keeping as an archive for UGC.
- **Avoid:** `#puzzle`/`#puzzles` (ambiguous with logic puzzles and games), engagement tags (#instagood, #explore, #fyp), and rotating "hashtag sets".
- **Pipeline rule:** count hashtags across caption plus any comment the pipeline writes, hard-fail above 5 and warn above 4. Since API behaviour above 5 is undocumented, never send more than 5.
- **Keyword captions do the real search work.** The first sentence should say plainly what the post is about in words people type: "speed puzzling", "jigsaw puzzle", "500-piece puzzle time", "world jigsaw puzzle championship", "puzzle record". Because public professional posts are Google-eligible, the opening line plausibly doubles as the search-result snippet (unverified assumption).
- **Test it:** alternate 0 vs 3 hashtags within the same pillar for about 8 weeks, then compare median non-follower reach. MSP's sample is small, so treat the result as directional.

### Gaps
- Instagram's Help Center text on the cap (does the comment-plus-caption total apply; what happens over 5) could not be fetched.
- How the Graph API handles more than 5 hashtags in October 2026 is undocumented. A test container with 6 tags would settle it.
- No 2026 study isolates hashtag type (niche vs generic vs branded) or caption vs first-comment placement under the cap.
- Whether per-post insights still report reach "from hashtags" is not documented for API v25. The 2024 Buffer guide mentions a "From Hashtags" row in the app.

## 2. Caption length, structure, hooks, emoji, CTAs without engagement-bait demotion, pinned comments, alt text

### Takeaway
The freshest data (PostPlanify, 6,126 posts, July–October 2026) finds **51–125 character captions the weakest band** and **301–800 characters the best for engagement on feed posts**. 800+ characters drops back. That puts MSP's historical median of 1,069 characters, and 1,745 for recaps, in the worst-reach band of that sample. Target **300–800 characters** for carousels, with the hook in the first ~125. Questions and comment-focused asks correlate with large comment lifts (+36.7% and +202.8%, Metricool). Instagram draws the line at prompts that game the system: "comment with a specific word, number, or emoji", "like if…", tag-baiting. Open, specific questions are fine. Emoji evidence is old (2018–2019) and only says "some is better than none".

### Cited Findings
**Length**
- **PostPlanify, Oct 2026** (6,126 feed posts and Reels from 168 accounts, 6 July–4 Oct 2026; medians; caption length includes hashtags; vendor data, correlational). Median engagement and median reach by caption length:

  | Caption length | Engagement | Reach |
  |---|---|---|
  | 1–50 chars | 2.96% | 932 |
  | 51–125 | **1.38%** | 228 |
  | 126–300 | 3.6% | 190 |
  | 301–800 | **4.57%** | 434 |
  | 800+ | 3.49% | 101 |

  - **Feed posts:** ≤125 chars 0.9% engagement; 126–500 chars 4.22%; 500+ chars 4.66%.
  - **Reels:** ≤125 chars 1.69% engagement (711 reach); 126–500 chars 3.95% (552 reach); 500+ chars 4.32% (241 reach). Reels results changed between quarters.
  - **Prior quarter** (4,408 posts, April–July 2026): 51–125 chars was again weakest, at 2.04%.
  - **Caveats:** the author sells scheduling tools, and carousels are not reported separately.

  — [PostPlanify](https://postplanify.com/blog/instagram-caption-length)
- **OLDER:** Socialinsider (9.1M posts, 82,952 business accounts, H1 2023) found captions under 30 words generally earned more engagement. This comes from a search-result summary; which page it came from is not confirmed — [SocialPilot (one of the result pages)](https://www.socialpilot.co/blog/ideal-social-media-caption-length)
- **WEAKLY SOURCED:** claims like "150–220 words is optimal for comments in 2026" cite no primary study — [search-result guides, e.g. Aibrify](https://aibrify.com/blog/how-to-write-instagram-captions-engagement-2026)
- **MSP's own history:**
  - Caption length: median 1,069 characters (mean 1,078, max 2,167). Weekly recaps had a median of 1,745 characters, and their reach declined from about 900–1,350 (Jan–Mar 2025) to about 550–1,100 (Apr–Jun 2025).
  - Emoji, mentions and links: 82 of 87 captions contain emoji, 46 contain @mentions, and 29 point to the site or "link in bio".
  - Voice: first-person founder ("I/we"), warm and emoji-heavy.

  — [IG API audit, 2026-10-13](https://graph.instagram.com/v25.0/me/media); [audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)
- The feed truncates captions at about 125 characters, behind "… more" — [FAU social media best practices](https://www.fau.edu/public-affairs/marketing-services/social-media/best-practices/instagram-best-practices/index.php)

**Questions, CTAs and engagement bait**
- Metricool 2026: posts with a question got **36.70% more comments**, and posts with comment-focused CTAs **202.78% more comments**. The baseline is not stated — [Metricool](https://metricool.com/press-release-instagram-study-2026/)
- Instagram (@Creators video, late May 2024) warned against content that "explicitly asks for engagement through shares, comments, tags, or other actions". Its example of a problem prompt: "asking people to comment with a specific word, number, or emoji" — [Social Media Today, 5 Jun 2024](https://www.socialmediatoday.com/news/instagram-clarifies-advice-on-single-word-ctas-and-longer-reels/718151/)
- Instagram's clarification to Social Media Today:
  - "Open-ended questions and calls-to-action are a great way to engage with your audience."
  - "Earnestly engaging with your audience in the comments and DMs to connect personally… is not considered to be engagement bait."
  - The problem is content that "attempts to game the system by eliciting specific interactions", where "the end goal is to simply maximize the quantity of engagements".

  — [Social Media Today](https://www.socialmediatoday.com/news/instagram-clarifies-advice-on-single-word-ctas-and-longer-reels/718151/)
- Meta's original engagement-bait definition (Facebook, Dec 2017): a tactic that "seeks to take advantage of our News Feed algorithm by boosting engagement". Its example is "LIKE this if you're an Aries!" Posts asking for help, advice or recommendations are not affected — [Meta Newsroom](https://about.fb.com/news/2017/12/news-feed-fyi-fighting-engagement-bait-on-facebook/)
- Instagram's Recommendation Guidelines avoid recommending engagement bait and contest/giveaway promotion. The full text could not be fetched; from round 1 — [Instagram Help Center](https://help.instagram.com/313829416281232)
- Mosseri: sends matter most for reaching non-followers, likes for followers. Comments are not among his top three signals — [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)
- Carousels generate 9× more saves than single images — [Metricool](https://metricool.com/press-release-instagram-study-2026/)

**Emoji**
- **OLD:** Quintly (5.4M posts, 34k business profiles, H1 2019): more emoji correlated with more interactions; posts without emoji had the lowest interaction rate — [Social Media Today on Quintly](https://www.socialmediatoday.com/news/new-study-looks-at-how-emojis-videos-and-caption-lengths-impact-instagram/562567/); [Digital Information World](https://www.digitalinformationworld.com/2019/09/instagram-study-what-marketers-can-learn-from-analysis-of-5-million-posts.html)
- **OLD, unclear method:** Mention reported 6.05% engagement with no emoji, 6.75% with one, and 7.26% with 6–10 (North America) — [Mention](https://mention.com/en/reports/instagram/captions/)
- No 2025–2026 primary study on emoji in Instagram captions was found. "3–5 emoji is optimal" claims in 2026 blogs cite nothing — [River Editor](https://rivereditor.com/blogs/instagram-caption-templates-triple-engagement-2026)
- Emoji used as formatting (before headings or bullets) is a listed sign of chatbot-written text — [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)

**Alt text and other caption mechanics**
- API `alt_text` is supported for image posts (not Reels or Stories) since 24 March 2025. The caption limit is 2,200 characters, and captions can't be edited after publishing via the API — [Meta content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/); [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media) (both via round 1)
- Alt text is described as one more clean text signal for Instagram's understanding of an image. This is the authors' assertion, not Instagram's — [Kontentino](https://www.kontentino.com/q-and-a/instagram-search-seo/); [Hootsuite](https://blog.hootsuite.com/instagram-seo/)
- Most Instagram views arrive in the first three days after posting — [Metricool](https://metricool.com/press-release-instagram-study-2026/)

### Inferences
- **Length targets for MSP:**
  - Carousels and data posts: 300–800 characters, roughly 50–130 words.
  - Single-image announcements: 150–500.
  - Monthly report, player spotlight and event recap: up to about 1,000, never more.
  - Reels: 125–500.

  The data belongs on the slides; the caption gives context, a voice and a question. A 1,745-character recap that repeats the slides adds length without information.
- **Hook rules (first ~125 characters):**
  - Lead with the surprising number or the tension ("More solo 500s finish at 58 minutes than any other minute.").
  - Include one search phrase.
  - No greeting ("Hey puzzlers!"), no "We're excited to share", no hashtag. No @mention either, except in spotlights and records, where the person is the subject.
  - Write it so it makes sense in Google's snippet with no image.
- **Structure:** a 1–2 sentence hook, a blank line, then 2–4 short lines of context (scope, date range, "what this means"), a blank line, one CTA, a blank line, credits (@mentions), and hashtags on the last line. Use plain line breaks; no bullet emoji.
- **CTA ethics, as an operational test:** the CTA must ask for a *real answer that varies by person* ("what's your 500 PB, first attempt or repeat?") or offer a *real utility* (save, send to the person it's about). Never ask for a fixed token ("comment 🧩", "type YES", "drop a 1 if…"), a like or a tag count.
  - A "guess A/B/C in the comments" quiz is borderline (a fixed token). Prefer "make your guess, then swipe", or run the vote as a Story quiz sticker, which isn't feed bait.
  - Send-asks are explicitly in Instagram's list, so use them in at most one in three posts, and only when the content is genuinely about a type of person ("the friend who does the edges first").
- **Emoji:**
  - Budget of 0–3 per caption.
  - Use them functionally: flags for country data 🇩🇰🇨🇭, ⏱️ beside a time, 🧩 as the sign-off motif, 🏆 for a record.
  - No sparkle, rocket, checkmark or pointing-hand emoji, no emoji at line starts as bullets, never more than one in the hook.
  - This deliberately departs from MSP's emoji-heavy past. A test of the old style on one pillar would show whether the audience misses it.
- **Pinned comment:** pin a comment with the method note ("Data: all solo 500 results logged on MSP, 1 Jan–12 Oct 2026, suspicious times excluded"), or with the owner's own answer to the post's question. That seeds the thread and keeps the caption short. Instagram allows pinning comments on your own posts, but the per-post limit was not verified this round.
- **Alt text per slide:** state the chart type, the takeaway and the key numbers in one or two sentences ("Bar chart: solo 500-piece finish times by minute. The tallest bar is 58 minutes; the count drops 7.5% at 60 minutes."). Generate it from the facts snapshot, never from the rendered image.

### Gaps
- No 2025–26 study splits caption length for carousels specifically, or for small (<5k) accounts.
- No measured data on line breaks or bullet lists in captions.
- No current primary data on emoji effects. The available numbers are from 2018–2019.
- Instagram's exact rule on pinned comments (count per post, effect on ranking) and whether `alt_text` is applied per carousel child via the API were not verified this round.

## 3. Puzzle community language: jargon, humour, values and phrases that feel off

### Takeaway
The competitive-jigsaw world talks in a small, precise vocabulary:
- **Competition:** solo or individual, pairs, teams, qualifying, semifinal, final, Nationals, WJPC.
- **Speed:** PPM, first attempt vs repeat, reps.
- **Technique:** flipping, sorting, edges first, sorting trays.
- **Piece anatomy:** tabs and blanks, "fur or grass" as the dreaded sections.

Its values are **warm, welcoming, self-aware ("silly and niche") and competitive but kind**, with outspoken hostility to AI puzzle art. MSP should sound like a fellow puzzler who loves the numbers. Corporate hype, gatekeeping ("real puzzlers…"), slow-shaming and generic AI phrasing all clash with that.

### Cited Findings
**Formats and events (organisers)**
- WJPC terminology:
  - Categories: Individual (with Debutant, Junior18, Senior45-60 and Senior60 classes), Pairs, Teams, and an "Organizations" event.
  - Rounds: Qualifying, Semifinals (individual only), Final.
  - WJPC 2026 ran 16–20 Sep 2026 in Valladolid. The WJPF calls the activity a "sport".

  — [WJPF](https://worldjigsawpuzzle.org/)
- USAJPA vocabulary and dates:
  - Event names: "Nationals" (USA Jigsaw National Championship & Convention), monthly "Puzzle Club" events with free, casual speed contests, a "Speed Run Puzzle", and online speed competitions.
  - Tone: "We love jigsaw puzzles and are excited to promote the joys of this popular pastime", under the heading "Organized fun".
  - The next Nationals are in **Atlanta, 19–21 March 2027**.

  — [USAJPA](https://www.usajigsaw.org/)
- USA Nationals grew from 33 teams, 93 pairs and 99 individuals (2022) to about 200 teams, 400 pairs and 800 individuals (2026) — [The Independent via AOL, 30 Mar 2026](https://www.aol.com/articles/piece-piece-inside-rapid-rise-140501949.html)

**Technique and speed vocabulary**
- From a speed-puzzling shop's starter guide:
  - Metrics and practice: "piece per minute (PPM)"; "Get in Your Reps"; "Don't get stuck on one thing too long".
  - Technique: assembling "edges first, then doing them last" as a choice; "more sorting up front"; flipping ("having them all face up is essential").
  - Dreaded sections: "fur or grass".
  - Competition setup: the puzzle "hidden in an opaque bag"; "box top holder and sorting tray(s)" as the only permitted aids; teams ranked by "remaining unplaced pieces".
  - Community: "unknown phenoms emerge regularly"; "You don't have to be an experienced puzzler to join a competition!"

  — [Completing the Puzzle](https://www.completingthepuzzle.com/blog/how-to-get-started-with-speed-puzzling)
- From Rocky Mountain PBS coverage of the Colorado scene:
  - Technique: flipping all pieces face up, then sorting out the edges and building the border first; the box picture as the "reference photo", which some skip.
  - Formats: relays, where teammates rotate between puzzles; synchronized "mini-tournaments" across venues.
  - Training: "tapering" (fewer puzzles before a big event) and "interval training".
  - Community: "puzzle swaps" as a way to find partners; a "clubhouse" practice space.

  — [Rocky Mountain PBS, 13 Mar 2026](https://www.rmpbs.org/news/outdoors/speed-puzzling-growing-colorado)
- A puzzle-content creator uses "PPM", "average time (per piece count)", "pair and team speed puzzling times" and "solo, duo, and team… leaderboards". She describes MSP as having "more community side to it" and as "a community platform for especially speed puzzlers" — [Puzzle with Emilia](https://www.puzzlewithemilia.com/en/post/track-your-speed-puzzling)
- A puzzle newsletter's year-in-review uses "first attempt", "repeats", "fastest time", "podium placements" (solo, pairs, teams), "puzzle marathons" and "Puzzle Talk Wrapped". Its tone is warm and playful ("who doesn't love a bit of statistics!"; "may it be full of puzzling!") — [Puzzle Talk](https://puzzletalk.substack.com/p/yearprew-2025)
- SpeedPuzzling.com rates puzzles by "P4" ("Puzzle Piece Placement Proficiency (per minute)") into Super Fast, Fast, Average, Slow and Super Slow tiers. For example, a Super Fast 500 has a solo median under 1h 8m. This is a competitor's metric; MSP should not adopt the term — [SpeedPuzzling.com](https://www.speedpuzzling.com/puzzle-ratings.html)
- Piece anatomy and conventions:
  - "Tabs" and "blanks", "whimsies" (shaped pieces), "fully interlocking", "Japanese style" (uniform shapes, harder to solve).
  - A "1,000-piece" puzzle is usually 38×27 = 1,026 pieces; a "500" is usually 27×19 = 513.

  — [Wikipedia: Jigsaw puzzle](https://en.wikipedia.org/wiki/Jigsaw_puzzle)
- A team's dedicated "edger" appears in news coverage, per a search summary (exact source page not confirmed) — [search results incl. Not Just a Hobby](https://notjustahobby.com/hobbies/speed-puzzling)

**Values, humour and mood**
- Puzzlers on their own community:
  - "It's a really warm, loving group of people"; "found family".
  - Teams in matching shirts and costumes.
  - Self-aware humour: the competition is "silly and niche… It's puzzles, it is what it is". Speed-puzzling videos are "pure kryptonite for my ADHD".

  — [The Independent via AOL](https://www.aol.com/articles/piece-piece-inside-rapid-rise-140501949.html)
- Newcomers on the community: "Everyone has been super welcoming and nice and fun to talk to"; "The community is amazing". Players congratulate faster finishers and encourage those who run out of time. Ages range from 20s to 70s, and the hobby is valued as "not geared toward video games or screens" — [Rocky Mountain PBS](https://www.rmpbs.org/news/outdoors/speed-puzzling-growing-colorado)
- AI hostility: Vox's March 2026 piece "The hobby that AI is ruining for its fans" covers lists of suspected AI puzzles. r/Jigsawpuzzles threads include "OMG enough with the AI". Both are from round 1; Vox and Reddit could not be re-fetched this round — [Vox](https://www.vox.com/the-highlight/480106/ai-jigsaw-puzzles-artificial-intelligence-genai); [round-1 notes](../MSP%20Instagram%20content%20pipeline/ig_growth_strategy.md)

### Inferences
- **Words MSP should use naturally:**
  - People and formats: "puzzlers" (never "users"), "solo / pairs / teams" (also "duo" on MSP).
  - Times: "PB", "first attempt" vs "repeat", "logged a time", "PPM".
  - Puzzles: "a 500" / "a 1000" for piece counts.
  - Technique: "edges first", "sorting", "flipping".
  - Events: "Nationals", "WJPC" / "Worlds", "qualifying", "the final".
- **Words to explain when used:** "PPM" (pieces per minute) once per post; "P4" (don't use; competitor term); "Japanese-style cut".
- **Humour the community enjoys (inferred from the tone above):**
  - Self-aware jokes about the hobby's niche-ness.
  - Relatable pain: fur, grass, sky, the last piece, the 59:59 finish.
  - Relatable habits: edges-first vs edges-last debates, the tyranny of the timer, the "one more puzzle" evening.
  - Light national rivalry in country stats.

  Keep it warm. The joke is on the shared experience, never on a person.
- **"Puzzle buddy" and missing-piece jokes:** "puzzle buddy" and jokes about a missing piece found under the sofa or blamed on the cat are commonly assumed to be community staples. They could not be verified this round because the Reddit sources were blocked. Use them sparingly until the owner confirms they ring true.
- **Phrases that would feel off:**
  - Corporate: "we're thrilled to announce", "exciting news", "game-changer", "unlock your potential", "join our community today".
  - Gatekeeping: "real puzzlers", "if you can't do a 500 in an hour…".
  - Slow-shaming: "slowest puzzler of the week".
  - Pseudo-sport hype: "beast mode", "crushing it".
  - Anything implying AI art or AI-made puzzles.
- **Be careful with "fastest" framing.** The community values personal goals and newcomers ("Newbies Welcome"). Pair every speed stat with an inclusive frame where natural ("the median is 64.8 minutes, so if you're around an hour, you're right in the pack").

### Gaps
- Direct evidence from r/Jigsawpuzzles and r/speedpuzzling could not be collected (reddit.com blocked). Pun preferences, "puzzle buddy", "no-box", "missing piece" humour and current slang remain unverified.
- No sample of top puzzle-creator Instagram or TikTok captions was collected this round.
- Which national-championship hashtags the organisers actually use in 2026–27 was not verified.

## 4. Tone references: Duolingo, Strava, Letterboxd, chess sites, parkrun, GeoGuessr and puzzle brands

### Takeaway
What transfers to a 2,400-follower data account:
- **Strava and Letterboxd's ritualised collective numbers** (Year in Sport / Year in Review).
- **Letterboxd's repeatable identity formats** (Four Favorites).
- **Lichess's earnest, small-team honesty.**
- **Chess.com x Duolingo-style cross-community collabs.**

What doesn't transfer is **Duolingo's mascot-driven "unhinged" chaos**, which needs a character, video and staff. Duolingo's May 2025 AI-first backlash, when it deleted all its Instagram and TikTok videos, is a warning for an AI-drafted account in an AI-wary hobby.

### Cited Findings
- **Duolingo:**
  - Duo the owl drives memes and stunts: April Fools' videos (2019, 2022, 2024) and the February 2025 "death of Duo" stunt, in which users were asked to earn 50 billion XP to resurrect him.
  - After the April 2025 "AI-first" memo, comments angry about AI replacing workers flooded its Instagram and TikTok. In May 2025 Duolingo took down all videos from both channels.

  — [Wikipedia: Duolingo](https://en.wikipedia.org/wiki/Duolingo)
- **Strava:** Year in Sport 2025 framed collective numbers (14 billion kudos, up 20%; 7.6M KOM/QOM course records) and trend labels (multi-sport "cross-training": 54% record 2+ sports). Club growth was framed as community — [BikeRadar, 4 Dec 2025](https://www.bikeradar.com/news/strava-year-in-sport-2025)
- **Letterboxd:**
  - Year in Review 2025: 898.5M films logged (+28%), 143.6M reviews (+49%), 12.9M lists (+88%).
  - The "Four Favorites" profile format became a fixture of film promotion; The Guardian called it "our era's cinematic confession booth".
  - Reputation: "the safest space for film discussion we've got". An industry executive said its engagement must be organic: "You cannot manufacture that."
  - Criticism: it gamifies watching and favours sardonic one-liners.

  — [Wikipedia: Letterboxd](https://en.wikipedia.org/wiki/Letterboxd)
- **Lichess:** "a free/libre, open-source chess server powered by volunteers and donations"; "Lichess would not exist without the thousands of hours of time from volunteers". The tone is earnest, warm and mission-driven — [Lichess about](https://lichess.org/about)
- **Chess.com x Duolingo (2023):** Duolingo characters became playable bots, a cross-community collab (round 1) — [Business Wire](https://www.businesswire.com/news/home/20231101043629/en)
- **Spotify Wrapped and Strava:** recap mechanics of identity, comparison, collective milestones and a fixed annual ritual drive sharing (round 1) — [Music Week](https://www.musicweek.com/digital/read/spotify-wrapped-2025-was-biggest-ever-with-200-million-engaged-users/093178)

### Inferences
- **Borrow:**
  1. **Collective numbers as celebration** (Strava, Letterboxd): "you, together, logged 275 million pieces" frames the audience as the hero.
  2. **Repeatable identity formats** (Letterboxd Four Favorites): for example "Your puzzle shelf in 4", "your PB card" or "edges first or last?". These are formats people can answer about themselves.
  3. **Small-team honesty** (Lichess): MSP is a small, founder-run project. "We built this because you asked in feature voting" is more credible than brand polish.
  4. **Fixed rituals** (Wrapped): Monday numbers, the monthly report, December Wrapped.
  5. **Cross-community collabs** (Chess.com x Duolingo) with brands, associations and creators.
- **Don't borrow:**
  - Duolingo-style unhinged personas, threats or shock humour.
  - Trend-jacking memes that need video skills and daily presence.
  - Sardonic one-liners that punch at people (Letterboxd's criticised side).
- **The Duolingo lesson is about trust, not tone.** An audience that feels a brand is replacing humans with AI turns its comment section against it. MSP's captions will be AI-drafted (no label required for AI-written captions per round 1's TechCrunch finding of 31 Aug 2026). So they must read as human, owner-approved and specific.
- A short "how we make these posts" Story or highlight could pre-empt suspicion: "our numbers come straight from the MSP database, charts are coded by us, no AI art". This is an owner decision.

### Gaps
- parkrun (fetch returned 403) and GeoGuessr were not researched this round, so their community-voice patterns ("not a race", milestone clubs) are unverified here.
- No primary source on Duolingo's, Strava's or Letterboxd's Instagram caption style specifically (length, emoji, CTA) was collected.
- Puzzle brands' (Ravensburger, Pomaranch, etc.) Instagram voice was not sampled this round.

## 5. AI-sounding copy: tells in LLM-written social captions and editing rules

### Takeaway
The best-documented catalogue of LLM tells is Wikipedia's "Signs of AI writing" (maintained to 2026). It lists:
- Overused vocabulary that shifts by model generation: "delve/tapestry/testament" in 2023, "enhance/fostering/showcasing" in 2024–25, "leverage/multifaceted/prioritize" from mid-2026.
- Negative parallelisms ("not X, but Y"; "Y rather than X"), the rule of three, "-ing" significance clauses and promotional language.
- Emoji used as bullets or headings, title case, mechanical bold.
- Chatbot phrases, and (title only retrieved) em-dash overuse.

Labelled AI content measurably loses engagement in experiments, so MSP's captions need a lint pass plus the owner's edit.

### Cited Findings
- **AI vocabulary** that appears much more often after 2022: "additionally," "align with," "boasts," "bolstered," "crucial," "deep dive," "delve," "emphasizing," "enduring," "enhance," "fostering," "garner," "highlight," "interplay," "intricate," "key," "landscape," "meticulous," "pivotal," "robust," "showcase," "tapestry," "testament," "underscore," "valuable," "vibrant." One or two may be coincidence; clusters are a strong signal — [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- **Vocabulary by model generation:**
  - 2023 to mid-2024 (GPT-4): "delve, intricate, tapestry, testament, pivotal".
  - Mid-2024 to mid-2025 (GPT-4o): "align with, enhance, fostering, highlighting, showcasing".
  - Mid-2025 to mid-2026 (GPT-5): "emphasizing, enhance, highlighting, showcasing".
  - Mid-2026 onward (GPT-6): adds "leverage, multifaceted, prioritize", with "much more period and comma usage" and shorter sentences of about 8–20 words. That makes choppy, punchy fragments a newer tell (the page cites an outside review site for this).
  - "Delve" fell off sharply in 2025.

  — [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- **Structural tells:**
  - Negative parallelisms: "Not just X, but also Y", "It's not…, it's…", and "Y rather than X", which is "particularly common in recent LLM output".
  - "LLMs overuse the rule of three", often to make "superficial analyses appear more comprehensive".
  - Superficial "-ing" clauses ("reflecting its continued relevance"), inflated significance ("a pivotal moment", "is a testament"), promotional wording ("nestled", "breathtaking").
  - Vague attributions, and formulaic conclusions ("Despite these challenges…", "In summary").

  — [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- **Formatting tells:**
  - Emoji before headings or bullet points.
  - Title Case Headings, mechanical boldface, inline-header lists ("**Label:** text").
  - Chatbot phrases ("I hope this helps," "Certainly!," "Would you like…").
  - The page has a section titled "Overuse of em dashes (2022–September 2026)". Its body text could not be retrieved, so the specifics are a gap.

  — [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- **AI disclosure and engagement:**
  - USC research (2025; TikTok data plus six preregistered experiments) links AI disclosure to lower engagement through weaker parasocial connection. Signalling more human effort reduces the penalty.
  - A Journal of Consumer Research study reports about 7–8% fewer likes on TikTok posts with an AI disclosure.
  - A CHI 2025 study (n=911) found no significant overall engagement change.
  - These are secondary summaries; the original papers were not verified.

  — [Insider Gaming](https://insider-gaming.com/ai-labels-can-reduce-social-media-engagement-study-finds/); [SSIR](https://ssir.org/articles/entry/ai-disclosures-social-media-disengagement); [Sherlock Comms](https://sherlockcomms.com/?p=78985)
- **Public attitudes:** 79% across 30 countries agree companies using AI should disclose it (Ipsos AI Monitor 2025). 76% of US adults say telling AI from human content is very important, but only 12% feel confident they can (Pew 2025). Both are secondary summaries — [Sherlock Comms](https://sherlockcomms.com/?p=78985)
- **Labelling rules:** since 31 Aug 2026 Instagram requires an "AI-generated profile" label only for undisclosed AI-generated *people*, not for AI-assisted captions or graphics (round 1) — [TechCrunch](https://techcrunch.com/2026/08/31/instagram-puts-new-limits-on-undisclosed-ai-profiles/)

### Inferences
- **Editing rules for every MSP caption (lint plus human pass):**
  1. **Zero em dashes** in captions. Use a period, comma, colon or parentheses. This is the simplest rule that kills the most-noticed tell, even though the source detail is a gap.
  2. **Banned-word lint:** every word on the Wikipedia list above, plus social clichés widely read as AI or corporate (practitioner judgement, not sourced): "dive in / let's dive", "buckle up", "game-changer", "unlock", "elevate", "journey", "in the world of", "whether you're a … or a …", "ever wondered", "here's the thing", "the secret to", "ultimate", "exciting news", "thrilled/proud to announce".
     - "Level up" is allowed only literally, for MSP's XP levels.
     - "Piece by piece", "falling into place" and "piece of mind" are allowed at most once a month. They are the worn puzzle puns.
  3. **No "not X, but Y" / "it's not about X, it's about Y" / "X rather than Y"** in captions.
  4. **No reflexive triads.** If a list of three appears, check that each item is a real, distinct fact; otherwise cut to the strongest one or two.
  5. **Every sentence carries a concrete noun or number** (a piece count, a minute, a country, a brand). No abstract "significance" sentences ("This shows how passionate our community is").
  6. **No emoji at line starts, no bold or Unicode "bold" text, no Title Case lines.**
  7. **Vary the rhythm.** Mix one longer sentence with short ones; don't write strings of 5-word fragments, which is the 2026-era tell.
  8. **One exclamation mark per caption, max.** No "!!" or "?!".
  9. **No sign-off formulas** ("Happy puzzling! 🧩✨" on every post). Rotate or drop.
  10. **Speak from the inside:** "we" means the MSP team. Use real puzzler terms correctly (PB, first attempt, solo or pairs, a 500). Say what's surprising and why, in plain words, as a puzzler would to a friend at a competition.
- **Owner's edit as a feature:** every approved caption gets one human touch: an aside, an opinion, or a "we didn't expect this" line. Edited captions become few-shot examples for future drafts (the pipeline already stores `author: human` edits).

### Gaps
- The body of Wikipedia's em-dash section, and why it is dated "2022–September 2026", was not retrieved.
- No study specifically measures how Instagram audiences react to *unlabelled* AI-written captions, as opposed to labelled AI content.
- No list of social-media-specific (as opposed to encyclopedic) LLM tells from a primary source was found. The social-cliché list above is practitioner judgement.

## 6. Tagging featured users and Collab posts: reach, shares, etiquette, counts, image vs caption

### Takeaway
The evidence is thin and vendor-made but points one way. **Mentioning people** correlates with more interactions (+37%) and reach (+17%), while **mentioning brands** correlates with less (−12% interactions, −19% reach) (Fanpage Karma, Reels). **Collab posts** lift shares and reposts across verticals in Emplifi's H1 2026 data (520k posts). The biggest lift comes when the *other* party publishes and invites the brand ("accepted"); brand-owned carousel collabs lift least. An academic study finds collab reach behaves like a weighted average that favours the smaller partner. For MSP that means:
- tag featured players generously but only for good news;
- invite top featured players or partners as collaborators;
- for big moments, ask creators, associations or brands to publish and invite MSP.

### Cited Findings
- **Fanpage Karma** (Reels mentions, 2023; sample and period not stated):
  - Mentioning **people**: +37% interactions and +17% reach on average.
  - Mentioning **brands**: −12% interactions and up to −19% reach.
  - Verified accounts: +28% engagement and +8% reach. Large (1M+) accounts: +28% interactions but −3% reach.

  — [Fanpage Karma blog](https://blog.fanpagekarma.com/2023/06/01/data-driven-study-who-you-should-and-shouldnt-mention-analysis-of-mentions-in-instagram-reels/)
- **OLD:** Mention (2018) found 72% of posts tag no users and that tagging users correlates with higher engagement. Hashtags showed no link — [Mention](https://mention.com/en/reports/instagram/tagging-users/)
- **Emplifi** (520,198 posts and accepted collabs across 3,791 profiles, 1 Jan–30 Jun 2026):
  - Adoption: over 73% of brands used collabs.
  - XS brands (<10k followers): accepted collabs earned "5x more interactions than their standard non-collab posts".
  - Shares: accepted collabs reached "more than 5x the amplification of non-collab posts in ecommerce and retail". Both owned and accepted collabs generate significantly more shares and reposts than standard posts in every vertical.
  - Format: Reels gain most; owned carousel collabs show the smallest lift.

  — [Emplifi](https://emplifi.io/resources/instagram-collaborations-boost-organic-engagement/); [Social Media Today, 16 Sep 2026](https://www.socialmediatoday.com/news/report-highlights-the-value-of-creator-led-collabs-on-instagram/830619/)
- **Journal of Digital & Social Media Marketing 13(4), March 2026** (100 collab posts): collab reach is closer to a weighted average of the partners' solo reach than to a sum. The smaller account gains while the larger may lose, and timing matters. Abstract via search summary; the full text returned 403 — [ResearchGate](https://www.researchgate.net/publication/402526684_The_impact_of_collaborative_posts_on_digital_reach_A_win-win_situation)
- **SECONDHAND:** Later's 2025 benchmark reportedly found collab posts got about 34% higher engagement, and Reels collabs about 48% higher — [DEV Community summary](https://dev.to/synergistdigitalmedia/instagram-collabs-20-what-changed-and-why-you-should-actually-care-1e9h)
- **WEAKLY SOURCED:** "Collabs get 47% more impressions in 24 h" cites unnamed data — [trymypost](https://www.trymypost.com/blog/instagram-collab-posts-strategy-guide-2026)
- **Instagram's guidance:** "use our Collabs feature to create a single post that is shared to both of your followers". Enhanced Tags are an option for crediting others — [Instagram Creators blog](https://creators.instagram.com/blog/instagram-recommendations-eligibility-tips-creators)
- **API constraints** (round 1): up to 3 `collaborators` per API post; `user_tags` on images; caption limit of 20 @mentions — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog); [Meta error codes](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/error-codes)
- **MSP context:**
  - 46 of 87 past captions had @mentions.
  - The weekly recaps, which named puzzlers, were the most-shared non-giveaway format (8–12 shares each; Instagram doesn't attribute who shared).
  - 979 players have an Instagram handle on their MSP profile, 881 of them with results.

  — [IG API audit](https://graph.instagram.com/v25.0/me/media); [docs/decisions.md](../../docs/decisions.md)
- **MSP policy:** feature players as MSP shows them publicly; respect private profiles, ranking opt-outs and the do-not-feature list; tag only the handle from the MSP profile — [docs/decisions.md](../../docs/decisions.md); [CLAUDE.md](../../CLAUDE.md)

### Inferences
- **Tag for good news only:** records, top-3 or top-10 placements, milestones (1,000th solve, level 50), event podiums and spotlights. Never tag people in "slowest", "most abandoned", habit or anomaly posts, or anywhere a reader could laugh *at* them.
- **How many:**
  - Player spotlight: 1 (plus the person as collaborator).
  - Record post: the record holder(s).
  - Weekly numbers: up to 9 (top 3 for solo, pairs and teams), placed in a credits block.
  - Event recap: organisers plus podiums, ≤12.
  - Hard cap: 15 caption mentions, well under the API's 20.
- **Image vs caption tags:**
  - Use **caption @mentions** for everyone featured. They are clickable, readable in the caption and notify the person.
  - Add **image (user) tags** on the slide where the person's data appears, for spotlights and records. This puts the post in their Tagged tab, a durable showcase they are likely to share.
  - Put tags below the hook, never in the first 125 characters, except in spotlights and individual records, where the person is the subject.
- **Collab policy:**
  - Invite the featured player as a **collaborator** on spotlights and individual-record posts, at most 1–3.
  - For events, invite the organiser account (WJPF, a national association) or the brand of the featured puzzle as collaborator.
  - Per the weighted-average finding, collabs with *larger* partners grow MSP. Collabs with small player accounts mostly grow the player's reach, which is still good for community goodwill and shares.
  - For the biggest moments, the Emplifi data favours "accepted" collabs: ask the partner to publish and invite @myspeedpuzzling. MSP can supply the finished carousel.
- **Brand mentions:** mention a puzzle brand only when the post is about that brand's puzzle (most-solved, fastest brand). Don't tag brands as a reach tactic; brand mentions correlate with lower reach.
- **Etiquette checklist before tagging:**
  1. The handle comes from the MSP profile and was re-read at draft time.
  2. The player is not on do-not-feature, not private and not ranking-opted-out.
  3. The stat matches what MSP shows publicly.
  4. The tag is celebratory.
  5. No extra personal data is added (age, city, real full name beyond what MSP shows).
  6. Junior-category players: feature only results the organiser has already published, and prefer no image tags (cautious inference; minors).
- **Fixing mistakes:** captions can't be edited through the API, so a wrong tag needs a manual edit in the app. Tags deserve the strictest pre-publish check.

### Gaps
- No 2025–26 primary study on caption @mentions for *small* accounts, or on image tags vs caption mentions.
- The Instagram app's collaborator limit (vs the API's 3) and what happens to reach if an invitation is declined were not verified this round.
- No evidence was found on how leaderboard-tag posts affect unfollows or tag fatigue in niche communities.

## 7. Multilingual captions: is a German (or other) line worth it?

### Takeaway
No study measures bilingual vs monolingual captions on Instagram. The academic work is qualitative (code-mixing motives), and Instagram has announced no ranking bonus for a second language. Captions should stay **English-first**, with an optional **one-line German note only on DACH-relevant posts**. Treat that as a test, not a rule.

### Cited Findings
- The audience is US 23.7% and Germany 11.2%, then Canada, Australia, Czechia and the UK at about 5% each. Germany is 13–16% of engaged and reached accounts, Austria a further 2.4%. Since February 2024 captions have been in English, sometimes with Czech puzzle titles — [IG API audit](https://graph.instagram.com/v25.0/me/insights); [audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)
- Published research on multilingual captions is qualitative. It looks at code-mixing motives (prestige, affective expression) with no engagement metrics — [ResearchGate (2025)](https://www.researchgate.net/publication/392509583_Exploring_Content_Creators'_Language_Learning_Experiences_and_Multilingual_Practices_to_Engage_Audience_in_Instagram); [Acuity journal](https://jurnal.unai.edu/acuity/article/view/4249)
- An industry note says clear bilingual captions can help comprehension, but Instagram has announced "no ranking bonus" for two languages. This is secondary — [GrowthViral](https://growthviral.co/instagram-news/instagram-edits-bilingual-captions/)
- Round 1 found no data on multilingual vs English-only captions for international niche accounts — [ig_growth_strategy notes](../MSP%20Instagram%20content%20pipeline/ig_growth_strategy.md)

### Inferences
- **Default: English only.** It is the hobby's lingua franca (WJPF, USAJPA and creators all use it) and the language of Google indexing for the largest audience segment. A second language doubles caption length, which section 2 suggests hurts, and halves how much of the hook fits before "… more".
- **Add one German line (after the English, before the hashtags)** only when the post is *about* Germany, Austria or Switzerland: a DACH country stat (the "Nordic-Alpine speed belt" post with CH), a German or Austrian championship, or a German puzzle brand. Example: "🇩🇪 Kurz auf Deutsch: Die Schweiz hat den zweitschnellsten Median bei 500 Teilen." The owner or a native speaker checks every German line. A bad translation is worse than none.
- **Put local language on the image when the post is local** (e.g., a German event recap slide title), and keep the caption English.
- **Measure:** compare the German share of reach on posts with and without the German line, using the API's audience breakdown or the in-app post insights where available. Stop if there's no difference after about 6 such posts.
- **Czech:** no default Czech lines (about 5% of the audience). Czech puzzle titles may stay in original form.

### Gaps
- No evidence on whether Instagram's automatic caption translation ("See translation") affects reach or engagement; not verified this round.
- No data on German-language puzzle hashtags or communities on Instagram.

## 8. Community management: replies in the first hours and conversation starters for niche communities

### Takeaway
Instagram says genuine replies in comments and DMs are encouraged and never engagement bait. Most views arrive within three days. Story replies grew 88% year over year (Metricool). Mosseri's ranking signals emphasise sends and likes, not comments. So replies matter mainly for relationships and the *next* post's reach, not as a ranking hack. No primary 2025–26 study quantifies a "golden hour" reply effect.

### Cited Findings
- "Earnestly engaging with your audience in the comments and DMs to connect personally… is not considered to be engagement bait." Also: "So long as [creators are] actually engaging with their audience, it's not engagement bait" — [Social Media Today](https://www.socialmediatoday.com/news/instagram-clarifies-advice-on-single-word-ctas-and-longer-reels/718151/)
- Most Instagram views happen in the first three days after posting. Story replies rose 88% YoY (Jan–Feb 2026 vs 2025) — [Metricool](https://metricool.com/press-release-instagram-study-2026/)
- Top ranking signals are watch time, likes per reach and sends per reach. The overview does not mention comments — [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)
- MSP's median regular post gets 2 comments and 61 likes. The WJPC 2026 giveaway drew 359 comments. Stories carried 10,000–18,500 views per 30 days in active periods — [round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md); [IG API audit](https://graph.instagram.com/v25.0/me/insights)
- Speed puzzlers are a social, welcoming scene: partner-finding, puzzle swaps, clubhouses, congratulating finishers — [Rocky Mountain PBS](https://www.rmpbs.org/news/outdoors/speed-puzzling-growing-colorado)
- The API token can read comments and conversations, and has `instagram_business_manage_comments` (round 1) — [audit notes](../MSP%20Instagram%20content%20pipeline/current_ig_account_audit.md)

### Inferences
- **The first two hours after posting:** the owner (not the pipeline) replies to every comment.
  - Reply with a follow-up question or a fact ("22:30 on a first attempt? What brand was it?").
  - Like each comment.
  - Pin the best answer or the method note.
  - Since posts go out at 19:00–21:00 Prague, schedule only when the owner can be on the phone for the next hour.
- **Days 1–3:** check twice a day. Answer data questions with numbers ("Median for a solo 1000 is 3h 16m"). Turn good questions into a future post, and say so ("Great question, we'll run that query for next Thursday"). That kind of reply builds loyalty.
- **Reply voice:** short, warm, first person plural, no templates. Never paste the same reply twice; repeated identical replies read as bot behaviour.
- **Conversation starters that suit this niche:**
  - Opinion splits with no wrong answer: edges first or last; sort by colour or by shape; box image visible or hidden.
  - Personal data: your 500 PB and attempt number; your "puzzle that broke you".
  - Predictions: when will we hit 300M pieces; who wins Nationals pairs.
  - Requests: "What should we count next?"
  - Story stickers (polls, quizzes, question boxes) for votes. Stories must be posted by hand because the API can't add stickers (round 1).
- **The pipeline can help:** a read-only `/ig-comments` digest that lists new comments since the last check and suggests replies for the owner to send. Claude never posts replies on its own initiative. This is consistent with the publishing rules in CLAUDE.md.
- **Comments are not the main ranking lever.** Sends are. The caption question exists to build community and give people a reason to come back. Judge it by replies and repeat commenters, not by algorithm hopes.

### Gaps
- No primary or rigorous 2025–26 data on how reply speed affects a post's reach.
- No public Instagram statement on whether a creator's own replies count toward comment signals.

## 9. Deliverable: draft "MSP voice & caption playbook" (v0.1, for owner review)

### Takeaway
The playbook below turns sections 1–8 into rules Claude Code can follow and lint against. Its core:
- **Sound like a fellow puzzler who loves the numbers.**
- **Hook with the surprising number in the first 125 characters.**
- **300–800 characters**, one honest question or utility CTA, a credits block, then **2–4 precise hashtags in the caption**.
- **No em dashes, banned AI vocabulary or emoji bullets.**
- **Tag people only to celebrate them.**

It is a draft. The owner's edits to the first 10–15 captions should become its examples and tune its rules.

### Cited Findings
- The evidence behind each rule is in sections 1–8. Key anchors:
  - Hashtag classification vs reach — [Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/); [Fanpage Karma](https://www.fanpagekarma.com/insights/do-instagram-hashtags-work/); [Metricool](https://metricool.com/press-release-instagram-study-2026/)
  - Caption length bands — [PostPlanify](https://postplanify.com/blog/instagram-caption-length)
  - CTA and engagement-bait line — [Social Media Today](https://www.socialmediatoday.com/news/instagram-clarifies-advice-on-single-word-ctas-and-longer-reels/718151/)
  - AI tells — [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
  - Mentions and collabs — [Fanpage Karma blog](https://blog.fanpagekarma.com/2023/06/01/data-driven-study-who-you-should-and-shouldnt-mention-analysis-of-mentions-in-instagram-reels/); [Emplifi](https://emplifi.io/resources/instagram-collaborations-boost-organic-engagement/)
  - Community vocabulary and values — [Completing the Puzzle](https://www.completingthepuzzle.com/blog/how-to-get-started-with-speed-puzzling); [Rocky Mountain PBS](https://www.rmpbs.org/news/outdoors/speed-puzzling-growing-colorado); [The Independent via AOL](https://www.aol.com/articles/piece-piece-inside-rapid-rise-140501949.html)
- Example numbers come from round 1's production queries of 2026-10-13 (prod DB Q06, Q10–Q12, Q16, Q19, Q21, Q36, Q42) and must be re-queried before use — [round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md)

### Inferences

#### 9.1 Voice principles
1. **A puzzler talking to puzzlers.** "We" are the small MSP team who also puzzle. Readers are "puzzlers", never users, customers or "fam".
2. **Numbers first, then the human meaning.** Every caption answers "so what?" in plain words ("so if you're around an hour, you're right in the pack").
3. **Warm, a little nerdy, gently funny.** Humour comes from shared experience (the timer, fur, the last piece, edges-first debates), never from a person.
4. **Competitive but kind.** Celebrate the fastest, include everyone else. Always give the median next to the record.
5. **Honest and specific.** Name the data scope and date. Say "our guess" when explaining a pattern. Admit surprises and mistakes.
6. **Short and calm.** No hype, no shouting, no countdown pressure, no "don't miss out".
7. **Human-made.** Readers should never wonder whether a bot wrote it. The owner adds one human touch per caption.

#### 9.2 Do / Don't

| Do | Don't |
|---|---|
| Open with the number or the surprise | Open with "Hey puzzlers!", "Exciting news" or "We're thrilled" |
| Name scope and date ("solo 500s logged on MSP, Jan–Oct 2026") | Present a stat with no scope |
| Use real terms: PB, first attempt, repeat, solo/pairs/teams, a 500, Nationals, WJPC | Invent terms or use competitor jargon (P4) |
| Pair a record with the median or a "you're in good company" line | Shame slow times or rank people at the bottom |
| Ask one open question people can answer about themselves | Ask for a fixed token ("comment 🧩", "type YES", "like if…", "tag 3 friends") |
| Tag people to celebrate them, in a credits block | Tag people in jokes or anomalies, or tag brands for reach |
| Keep 300–800 characters on carousels | Repeat the slides in the caption |
| 2–4 precise hashtags on the last line | Hashtags in comments, #puzzle, #explore or rotating hashtag sets |
| Vary sentence length; one exclamation mark max | Strings of 5-word fragments, "!!", ALL CAPS |
| Write puns rarely and freshly | "Piece of mind", "falling into place" or "piece by piece" every week |
| Say "our guess" for explanations | Claim causes the data can't show |
| Plain punctuation: periods, commas, colons | Em dashes, Title Case lines, bold Unicode text |

#### 9.3 Hashtag policy
- **Count:** 2–4 per feed post, never more than 5 including any comment the pipeline writes. The pipeline hard-fails above 5 and warns above 4.
- **Place:** the last line of the caption, after the credits. Never in the first comment.
- **Core set:** `#speedpuzzling #jigsawpuzzle`. Add **one** of: the event tag (verify in-app, e.g. `#WJPC2026`), a format tag only if verified active, or the branded `#myspeedpuzzling`.
- **Never:** `#puzzle`, `#puzzles`, `#instagood`, `#explore`, `#fyp`, `#reels`, hashtag sets copied between posts, misspelled or hyphenated tags.
- **Stories:** no hashtags.
- **Review:** after 8 weeks of 0-vs-3 alternation, keep whichever has the higher median non-follower reach. Default to 3 if it's a tie.

#### 9.4 Emoji policy
- **Budget:** 0–3 per caption, at most 1 in the hook.
- **Allowed, functional:** 🧩 as a sign-off motif (not every post), ⏱️ beside a time, 🏆 for records, 📊 for report posts (rarely), country flags in country posts, and 🇩🇪 to mark the optional German line.
- **Banned:** ✨ 🚀 💡 ✅ 👉 🔥 💯 🙌 🎯, emoji as bullet points or line starters, emoji chains.
- **Deliberate change:** past captions were emoji-heavy (82 of 87). If owner feedback or the data shows the audience misses it, relax the budget to 5.

#### 9.5 Tagging & Collab policy
- **Eligibility:** the handle comes from the MSP profile at draft time. The player is not private, not ranking-opted-out and not on do-not-feature. The stat equals what MSP shows publicly. The context is celebratory.
- **Where:**
  - Caption @mentions in a credits block (for example "Fastest this week: solo @a, pairs @b & @c, teams @d @e @f @g").
  - Image tags on the slide where the person appears, for records and spotlights.
- **How many:** 1 for spotlights; record holders for records; ≤9 for weekly numbers (top 3 per category); ≤12 for event recaps; 15 absolute max.
- **Collabs:** invite the subject as collaborator on spotlights and individual records (≤3 via API). Invite organisers or brands on event and brand posts. For the biggest moments, ask the bigger partner to publish and invite MSP.
- **Brands:** mention only when the post is about their puzzle.
- **Juniors:** results already published by organisers only, and no image tags.
- **Wrong tag:** fix by hand in the app immediately; the API can't edit captions.

#### 9.6 CTA library by goal
Use one CTA per caption, matched to the post's goal. Rotate wording, and never repeat the same CTA on consecutive posts.

**Sends (reach to non-followers).** Use in at most one in three posts, and only when the post is about a type of person.
- "Know someone who stops the timer at 59:59? This one's for them."
- "Send this to your pairs partner before your next session."
- "For the friend who still does the edges last."
- "If your puzzle group chat argues about edges, drop this in there."

**Saves (reference value)**
- "Save this before your next 500. It's a good benchmark."
- "Worth saving if Nationals is on your calendar."
- "Save it and check where you land after your next solve."

**Comments (open questions with varied answers)**
- "What's your solo 500 PB, and was it a first attempt?"
- "Edges first or edges last? Tell us why."
- "Which puzzle broke you this year?"
- "Which brand is your speed brand?"
- "Did this surprise you, or did you already know?"
- "What should we count next?"

**Follows (state the ritual, don't beg)**
- "New numbers every Monday."
- "We post a fact like this every Thursday."
- "Next up: October in numbers."

**Site and app**
- "Log your times at myspeedpuzzling.com (link in bio) and see where you land."
- "All the charts live on your MSP profile."

**Banned CTAs:** "Comment 🧩/YES/a number if…", "Like if…", "Double tap", "Tag 3 friends", "Share to win" (outside a sanctioned giveaway), "Don't forget to like and follow", "Drop a comment below!" (generic).

#### 9.7 Glossary of community terms (for drafting; check new terms with the owner)

| Term | Meaning / usage note | Status |
|---|---|---|
| puzzler | Community self-name. Use instead of "user" | verified |
| speed puzzling / competitive puzzling | The sport; puzzling against the clock | verified |
| solo / individual | One person. MSP uses "solo"; WJPF uses "Individual" | verified |
| pairs / duo | Two people. MSP leaderboards say "duo"; WJPF says "Pairs" | verified |
| teams | 3–4 people at competitions | verified |
| a 500 / a 1000 | Piece-count shorthand. A "500" is usually 513 pieces, a "1000" 1,026 | verified (counts) |
| PB | Personal best | widely used; not in fetched sources |
| first attempt / repeat | Unseen puzzle vs a puzzle solved before. Records differ a lot | verified |
| PPM | Pieces per minute = pieces ÷ minutes. Spell out on first use | verified |
| edges first / edges last, border | The classic strategy split | verified |
| edger | Team member who builds the border | seen in coverage; unconfirmed |
| flipping | Turning all pieces face up at the start | verified |
| sorting, sorting trays | Grouping pieces; trays are allowed aids | verified |
| box top holder / reference photo | The box image as reference; some puzzle without it | verified |
| opaque bag | How competition puzzles stay hidden until "go" | verified |
| unplaced pieces | How unfinished teams are ranked | verified |
| qualifying / semifinal / final | WJPC round structure | verified |
| Debutant, Junior, Senior | WJPC categories | verified |
| Nationals | National championships, e.g. USAJPA Nationals (Atlanta, 19–21 Mar 2027) | verified |
| WJPC / Worlds, WJPF | World Jigsaw Puzzle Championship and its federation | verified |
| Puzzle Club, mini-tournament, relay | USAJPA and club formats | verified |
| reps, tapering, interval training | Practice vocabulary | verified |
| fur, grass (and sky) | Dreaded low-contrast sections. "Sky" is unverified | partly verified |
| phenom | An unknown newcomer who turns out to be fast | verified |
| puzzle swap | Trading puzzles; also how partners meet | verified |
| tabs / blanks, whimsies, Japanese-style cut | Piece anatomy and cut styles | verified |
| puzzle marathon | Long multi-puzzle session or event | verified |
| puzzle buddy, missing-piece jokes, no-box | Probably common; confirm with the owner | unverified |
| logged a time / results / XP / level / badges | MSP product terms | MSP |
| P4 | Competitor site's metric. Don't use | avoid |

#### 9.8 Caption skeletons and examples (10 pillars)
Conventions:
- `{…}` marks a placeholder filled from the facts snapshot.
- Numbers shown are round-1 production figures queried on 2026-10-13. Re-query before use.
- Each example ends with its hashtags.
- Target length is noted per skeleton.

**1. Weekly Numbers (Monday; goal: shares and follows; 300–600 chars)**
```
Hook: {surprising weekly fact with a number}.
Context: Week {n} on MSP: {results} times logged by {puzzlers} puzzlers, {pieces} pieces in total.
Line: Most-solved puzzle: {title} by {brand}.
CTA (comment or follow)
Credits: Fastest this week: solo @{h1}, pairs @{h2} & @{h3}, teams @{h4} @{h5} @{h6} @{h7}
Hashtags
```
Example:
> Week 41: one puzzle got solved {n} times, more than any puzzle in a single week since {month}.
>
> Last week you logged {results} times on MSP, {pieces} pieces in total. Busiest day: Sunday, as always.
>
> Did you solve it? First attempt or repeat?
>
> Fastest this week ⏱️ solo @{h1} · pairs @{h2} & @{h3} · teams @{h4} @{h5} @{h6} @{h7}
>
> #speedpuzzling #jigsawpuzzle #myspeedpuzzling

**2. Did-you-know fact (Thursday; goal: sends; 250–500 chars)**
```
Hook: the fact in one sentence, with the number.
Explain: 1–2 lines of data scope and the human meaning.
Our guess: why (optional, labelled as a guess).
CTA (send)
Hashtags
```
Example ("the 59-minute wall"):
> More solo 500s finish at 58 minutes than at any other minute. At 60 minutes the count drops 7.5%.
>
> That's every solo 500-piece time logged on MSP. There's no such dip at 45 or 50 minutes. Our guess: nobody wants to see 1:00:xx on the timer.
>
> Know someone who stops the clock at 59:59? This one's for them. 🧩
>
> #speedpuzzling #jigsawpuzzle

**3. Record (goal: shares via the record holder, saves; 300–600 chars)**
```
Hook: the record number + what it is.
Context: how it compares (median, previous record, attempt number).
Credit: the holder (tag + image tag + collaborator invite).
Inclusive line.
CTA (comment)
Hashtags
```
Example ("fastest first try"):
> 22:30. The fastest *first attempt* on a solo 500 ever logged on MSP, by @{handle}. 🏆
>
> Every time in the all-time top 10 was a repeat. On a first look at a new puzzle, nobody has gone faster. For context, the median solo 500 on MSP is 64.8 minutes.
>
> What's your best first-attempt 500?
>
> #speedpuzzling #jigsawpuzzle #myspeedpuzzling

(Uses the asterisk only if the renderer shows it as text. Otherwise drop it; Instagram has no italics.)

**4. Monthly report (first week of the month; goal: saves and shares; 500–900 chars)**
```
Hook: "{Month} in numbers:" + the headline number and comparison.
3–4 short lines of collective stats (one per line, no emoji bullets).
One "we didn't expect this" line.
Thanks line (collective, not corporate).
CTA (save or follow)
Hashtags
```
Example:
> September 2026 in numbers: our biggest month ever, with 33,198 times logged by 2,687 puzzlers.
>
> 16.8 million pieces placed.
> 596 new puzzlers joined.
> 2,259 new puzzles added to the database.
>
> The surprise: {fact the owner can explain}.
>
> Thank you for logging every single one. October report lands in early November.
>
> #speedpuzzling #jigsawpuzzle #myspeedpuzzling

**5. Quiz / guess (goal: watch time and comments; 150–400 chars)**
```
Hook: the question.
Options on slide 1, answer on the last slide ("swipe for the answer").
After the reveal, a personal question (not "comment A/B/C").
Hashtags
```
Example:
> How long does the median solo 1000-piece puzzle take on MSP? Make your guess, then swipe.
>
> (Hint: it's not twice the 500.)
>
> Once you've seen it: how far off was your own last 1000?
>
> #speedpuzzling #jigsawpuzzle

**6. Event recap (within 48 h of results; goal: shares via organisers and podiums; 500–1,000 chars)**
```
Hook: "{Event} in numbers" + the biggest number.
2–4 lines of stats (participants, countries, results logged on MSP).
Podium credits by category (tags).
Thanks to organisers (tag; invite as collaborator).
CTA (comment: "Were you there?")
Hashtags incl. event tag
```
Example:
> WJPC 2026 in numbers: 837 puzzlers from 63 countries in Valladolid, and 1,010 results from the championship already logged on MSP.
>
> {one striking stat, e.g. closest finish or most-represented country}
>
> Congratulations to the podiums: individual @{…}, pairs @{…}, teams @{…}. Thank you @{organiser} for another great Worlds.
>
> Were you there? What was the hardest puzzle of the week?
>
> #WJPC2026 #speedpuzzling #jigsawpuzzle

**7. Player spotlight (Collab with the player; goal: shares via the player; 400–800 chars)**
```
Hook: "@{handle}" + one standout stat.
3 lines of public MSP stats (pieces logged, PB, favourite brand or most-solved).
One fun, data-based detail (e.g. busiest weekday).
CTA: invite questions for the player, who answers in the comments.
Hashtags
```
Example:
> Meet @{handle}: {n} puzzles logged on MSP and a solo 500 PB of {time}. ⏱️
>
> Favourite brand by far: {brand} ({k} of their puzzles). Busiest puzzling day: Sunday, like most of you.
>
> Got a question for {handle}? Ask below, they'll answer.
>
> #speedpuzzling #jigsawpuzzle

**8. Feature announcement (single image or short carousel; goal: site actions and likes; 200–500 chars)**
```
Hook: "New on MSP: {feature}" + the one benefit, in puzzler terms.
Where it came from (feature voting, community request).
How to try it, in one line.
CTA (comment: what's missing?)
Hashtags
```
Example:
> New on MSP: XP levels. {one plain line on how XP is earned, checked against the feature spec}.
>
> On launch day you logged 2,890 results, our busiest day ever, and 1,305 of them were solves from more than a week back. We see you, puzzle archaeologists.
>
> Check your level on your profile (link in bio). What should earn XP next?
>
> #speedpuzzling #jigsawpuzzle #myspeedpuzzling

**9. Milestone countdown (Story series plus one feed post; goal: comments and follows; 200–400 chars)**
```
Hook: the current total + the milestone + the ETA.
What the number means at human scale.
CTA: a prediction question.
Hashtags
```
Example:
> 275 million pieces logged on MSP. At this pace we pass 300 million in late November.
>
> That's 632,000 hours of puzzling, about 72 years, all logged by you.
>
> Which puzzle do you think will hold piece number 300,000,000?
>
> #speedpuzzling #jigsawpuzzle #myspeedpuzzling

**10. Myth-buster (goal: saves and sends; 300–600 chars)**
```
Hook: "Myth:" + the belief. "Reality on MSP:" + the number.
Data line (scope).
Our guess why (labelled).
CTA (save)
Hashtags
```
Example:
> Myth: a 1000-piece takes twice as long as a 500. Reality on MSP: about three times as long.
>
> The median solo 500 is 64.8 minutes. The median solo 1000 is 195.9 minutes, about 3 h 16 min.
>
> Our guess: every piece in a 1000 has twice as many candidates to check, so each placement gets slower, not just the total.
>
> Save this before you plan your next 1000.
>
> #speedpuzzling #jigsawpuzzle

#### 9.9 Pre-approval caption checklist (automatable lint plus owner check)
1. The hook (first 125 characters) contains the key number or surprise and a search phrase. No hashtag inside it. No @mention either, except in spotlights and records, where the person is the subject.
2. Length matches the pillar target; never over 1,000 characters.
3. Zero em dashes. No banned words or phrases (section 5 list). No "not X but Y" / "rather than".
4. ≤3 emoji, none at line starts, none from the banned set. ≤1 exclamation mark.
5. Exactly one CTA, from the right goal group, not used in the previous post. No banned CTA.
6. 2–4 hashtags (hard max 5) on the last line. None in the comments.
7. Every number matches the facts snapshot. Scope and date are stated or pinned.
8. Every @handle passes the tagging eligibility check. Tags are celebratory. ≤ the pillar cap.
9. Alt text exists per slide and states the takeaway and key numbers.
10. An optional German line is used only on DACH-relevant posts and checked by a native speaker.
11. The owner adds or approves one human touch. Edits are saved as `author: human` and reused as examples.

### Gaps
- The playbook's examples are untested: none of these captions has run yet. The first 8–12 weeks of insights (sends, saves and comments per reach, by pillar and CTA type) should revise it.
- Several glossary items and humour patterns are marked unverified because Reddit sources were blocked. The owner, an active puzzler, should confirm or strike them.
- Which event and championship hashtags are actually in use for 2026–27 should be checked in-app before first use.
