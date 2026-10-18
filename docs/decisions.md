# Owner decisions

Answers to the open questions of [the first research report](../reports/MSP%20Instagram%20content%20pipeline.md).
Newest at the bottom. Where a decision overrides the report, the decision wins.

## 2026-10-13: after the first research round

**Database access.** Query production directly as the read-only role (commands in the gitignored
`CLAUDE.local.md`). The role being able to read every table is accepted: the rule is simply that personal
data (e-mails, sessions, …) never ends up in a committed file or a post. No views schema or export needed.
For design iteration, cache query results locally (gitignored) instead of re-querying production.

**Instagram token.** Refreshing it by hand when it expires is fine. If auto-refresh is easy, it's a task
for Claude (the refresh logic already exists in the ig-giveaway prototype).

**AI and models.** AI is welcome for marketing material; the community's dislike of AI is about puzzle
motifs, which we don't generate. The real challenge is design: posts must look good, consistent and not
like AI slop. "Image generation" means the whole visual process, not only diffusion models. All locally
installed models are in scope for labs and for published posts: the posts grow the puzzle community and
never sell directly, so the owner considers non-commercial licences such as FLUX.2 klein 9B's acceptable.
Still record which model (and its licence) produced each asset.
Heavy local jobs (ComfyUI, big Blender/video renders) run only in quiet hours when the owner frees RAM:
ask first.

**Tools.** Claude Code drives everything and may use any tool that helps: programs, binaries, libraries,
open APIs, containers. Prefer open source or low budget, and research the best tool for each job instead
of fighting a tool. ComfyUI can be combined with or replaced by better tools.

**XP share card (rejected 2026-10-12).** The concept was great; the image was low quality and the puzzle
pieces were awful and blurry. Hard requirements: crisp rendering, geometrically correct puzzle pieces.

**Featuring players.** No opt-in consent; we feature players the way MSP already shows them publicly.
Respect the app's visibility rules (private profiles, ranking opt-outs) and keep a do-not-feature list
for anyone who asks to be left out. Players can be tagged via the Instagram handle on their MSP profile
(979 players have one, 881 of them with results, as of 2026-10-13).

**Cadence.** Claude drives the account at 3 posts a week, proposed post by post or in batches. The owner
also posts manually (feature announcements, competition photos, reports) and may ask for design help or a
brainstorm; the pipeline treats those posts as part of the same grid and insights.

**Ideas.** Every post starts with a brainstorm: data-backed ideas with a recommendation. Avoid repetitive
posts that bore people; keep measuring what works; aim for shareable, possibly viral content.

**Local gallery and labs.** Drafts, lab outputs and published posts live in a local gallery (gitignored).
The public repo holds tooling, docs and research only. Expect many Claude-driven design labs.

**More data sources on request.** Loki, Grafana, Prometheus, Traefik logs and Google Analytics are
available if useful; the community mostly cares about puzzle data.

**Motion.** Videos, animations and collages are not a must, but an unused opportunity for Stories and
Reels worth exploring.

**No traffic posts.** No posts based on website traffic (Grafana/Prometheus/Tempo). A WJPC recap uses
puzzle and competition data only.

**Feature explainer videos.** HyperFrames-style motion is also a fit for explaining new MSP features in
short videos: another automatable content type next to the data posts (a hint, not a must).

## 2026-10-13: owner hands over driving; answers to the round-2 questions

The owner delegates execution: Claude drives the next steps and builds, asking only for decisions
(interactively, with a recommendation).

- **Traffic rule:** daily signed-in-player counts count as traffic, so they are not used; use
  solve-based numbers instead.
- **Emoji:** 0–3 functional emoji per caption.
- **Heavy jobs:** Claude pings the owner per batch while a lab type is being measured; once measured,
  that lab type may run overnight automatically when the calm-machine check passes.
- **Image host for API publishing:** a Cloudflare R2 bucket; objects are deleted after publishing.
- **Disk:** keep whatever models are needed and download what labs need. Notify the owner when free
  disk drops below 30 GB.
- **Disclosure:** none. No bio statement and no proactive AI flag; Instagram's own detection may
  still label hosted-model images.
- **Juniors:** treated like everyone else under the app's visibility rules.
- **Recompression test:** no private or test account and no test posts on the main account. Measure
  Instagram's recompression from posts already published (served copies vs the originals on disk).

## 2026-10-13: creative formats

- **The feed is not only data posts.** Data is roughly a third; the rest is visual, community and fun
  (collages, puzzle spotlights, quizzes, cartoons, seasonal art, Reels).
- **No player photos.** Players' finished-puzzle photos are not used in posts (collages, mosaics or otherwise).
- **Box images: yes, credit the brand.** Puzzle box images from the MSP catalogue may be used for spotlights,
  quizzes, collages and mosaics, naming/tagging the manufacturer; remove if a brand objects.
- **Prototype all four creative families:** box-image collages and mosaics, puzzle of the week + quiz,
  cartoons and seasonal art, Reels/motion.

## 2026-10-13: private profiles, member features, quizzes, first AI batch

- **Private profiles are excluded from everything**, including anonymous aggregates: every query that feeds a
  post filters out players with a private profile (`player.is_private`). Hidden profiles are never disclosed.
- **All other data may be used**, including collections, wishlists and members-only features (predictions,
  difficulty, tiers, badges, streaks): MSP owns the data, and posts can advertise member features.
- **Quiz credits:** clue slides credit the brand ("Mystery puzzle · Ravensburger"); the answer slide names the puzzle.
- **First AI image batch approved for tonight** (series backdrops, material textures, spirit animals,
  layout-to-scene), on a calm machine, one model family at a time, resources logged.

## 2026-10-14: visual direction from the first lab round

Owner feedback on DL1 (styles) and DL2 (formats); details in `content/labs/{DL1,DL2}/feedback.jsonl` (local).

- **Favourite look: D5 Race Clock** (navy ground, white text, charts). Close second: **D2 Poster Numbers** (bold
  colour grounds, catching). **D9 Chapter Recap** works for Stories (D9-1 and D9-5 best). The house system builds on
  these.
- **No plain white grounds as the main look** (D1, D3 feel boring; if white is used, add depth: subtle shadow or a
  same-hue gradient). **No pastel, cream, beige or yellow grounds** (D6, F1, F2, D9 yellow are off brand).
- **Use more of the brand palette**: navy/grey, coral/pink, sky blue and indigo/purple, rotating; purple is an
  accent, never the primary colour for everything (D8).
- **No-go:** D4 box lid, D6 puzzle mat, D7 house-illustrated icons (read as AI-generated), D8 zine; the D2-8 puzzle
  header; the small clock icon top left (D5).
- **Illustrations:** cute outlined objects and characters read as AI art (D7, most of F3). Keep the funny-facts
  concept; illustrations built from puzzle pieces and real arrangements (F3-4/5 edges first/last, F3-6 sorting the
  sky) work. The cartoons themselves are loved ("funny and makes sense") and can stay, but must lose the
  "aha, AI-generated" feeling: restyle them so they don't look like generic AI clip art.
- **The illustration style itself is open for reconsideration**, possibly for the whole MSP website too (the current
  "semi-flat outlined" house style from the website, originally generated with ChatGPT, is what reads as AI).
  **AI illustrations are allowed**; the goal is a refined, distinctive style. Explore it in a dedicated
  illustration lab later (IL1); a winner may be proposed for the site. IL1 uses **local models only** (no hosted
  comparison for now).
- **White grounds are "okayish"** when they get depth (gradient and/or shadows); pastel/cream stays out. Once the
  house design is set, the content from all labs gets combined into it.
- **Content and concepts are approved across the board**: the data posts, box walls and the 1,000-puzzle mosaic
  (F1-6/7/8 awesome), puzzle of the week and quizzes, funny facts, Reels.
- **Reels: confirmed.** Use HyperFrames more, incl. feature reveals; fill the whole 9:16 frame; music later.
- **Logo:** slightly bigger everywhere; on dark grounds use the outlined logo (white outline around the mark, like
  `assets/brand/email-logo.png`) instead of a white circle.
- **Consistency:** one recognisable brand design across the feed matters (the owner's own photo posts will be
  mixed in occasionally).

**Compute budget.** This Mac's CPU, GPU and RAM are the limit for now (a bigger machine may come
later). Every prototype and lab records the resources it used. Heavy runs happen on a calm machine, with
Docker and other unneeded apps turned off.

## 2026-10-16: branding in the footer

- **Branding more notable** (owner): every post promotes MSP. The house footer sets **myspeedpuzzling.com** in bold
  ink (32 px) in the source line, leading the line when a slide's source doesn't name the site, and the outlined logo
  grows to 112 px (≈ 1.8× DL1). Reels carry the same lockup in their header (logo 100 px).

## 2026-10-16: priorities and keeping the labs

- **Next goal, most important: decide the house style** (DL4: H1/H2/H3, per-slide feedback, what we use), in a fresh
  session dedicated to it. Decisions on Reels (intro/outro, LM1) and illustrations (IL1, J1) come later.
- **Keep everything in the labs** as a reference: never delete lab renders, variants, AI images or feedback, and
  don't remove losing variants from the code; the chosen style becomes the default, the others stay renderable.
  Keeping them on this Mac only is fine (no backup needed): they are a reference and inspiration, not an archive.

## 2026-10-17: house style direction (DL4 round 1)

- **H1 and H2 liked; H3's design rejected** (its content and post ideas stay; its idea of colour by post type moves
  into the posters).
- **Combine H1 + H2 → H4** (`VARIANTS.H4`): H1's navy timing board for data and image slides, H2's two-piece puzzle
  poster only on covers and single big facts ("not every slide, but some of them; the profile grid reads unified").
- **Text colours:** no third text colour (the lavender-blue kickers/labels in H1 mixed with white and grey). Two text
  colours: white + one grey on navy (ink + one secondary on colour grounds); coral only for highlights. Purple stays
  in the poster tops and chart second series, not in text.
- **One navy, not two** (H1 mixed #2b3445 and #222a38). Owner: "think about brand but contrast is important too";
  compare in DL4 K1 (navy A brand vs B deep) before deciding.
- **Poster top colour by type of post** (H3's idea), several colours allowed: data desk and atlas sky, the week
  indigo, milestones and events coral, puzzles ocean, funny facts green as a trial (K1 compares green / coral / sky).
- **Poster seam shape** to be improved: five cuts to compare in K1 (grid4 as today, bold3, classic4, drip4, tilt4).
- **Refined the same day:** "nearly everything in H1 is really great, just fine-tune what I mentioned; H2 as the
  facing first slide for titles, H1 for the other slides." H4 therefore makes only a post's first slide a poster
  (`posterSlides: 'first'`); later big-fact slides use H1's navy layout.
- **Data + visualisation together** is what the owner loves: posts with charts, boards, images, never just text.
- **Fine-tuning happens in real drafts.** The system remembers feedback and applies it to all future posts:
  `editorial/standing-feedback.md` (read first by every draft and revision; general review notes are added there).
  Every draft proposes the caption and alt text; tone: **a friendly speed-puzzling community, heavily data-driven**.
- **No green** (owner, same day): funny facts and timely stories take coral posters (the brand accent, shared with
  milestones and events). Brand vs deep navy and the seam shape remain open in K1.
- **Purple headings back** (owner reverted the same day): kickers, board headers and labels keep H1's purple
  (indigo-300 on navy, indigo-800 on coral/sky posters); the concern was "never too many colours", not the purple.
  Text palette in H4: white titles, grey body, purple kickers/labels, coral highlights, nothing more.
- **Seam shape: the original cut** (grid4, K1-9; owner same day). H4 keeps `seam: 'grid4'`. Only brand vs deep navy remains open.
- **Navy: B, deep navy #222a38** (owner same day, after the A/B comparison). **H4 is the MSP house style**
  (`HOUSE` in `src/design/house.ts`); all DL4 choices are settled.

## 2026-10-17: no hashtags

- **Never add hashtags** to captions (owner: "they seem obsolete and have no impact"). Enforced in
  `src/captions/lint.ts` (error) and therefore in the publisher's preflight; `msp-captions` writes searchable words
  into the caption text instead. Supersedes the 2–4 hashtag policy of the voice playbook (§9).
- **Confirmed by research** (owner asked to decide from it): Mosseri repeatedly says hashtags don't raise reach;
  2026 measurements show about ±2 %; keyword-rich caption text helps search as much or more. Decision: no hashtags,
  searchable words in the caption; no A/B test (best case is noise). Note: `research_notes/…/hashtags_2026.md`.
- **Revised the same day after a closer look at the research:** hashtags don't drive reach, but they still label the
  topic for search and categorisation at no cost. Decision: **3–5 specific topic labels on the last line** (never
  generic, none in the hook or Stories), plus the searchable words in the caption text. The lint errors above 5 and
  warns below 3.

## 2026-10-17: first post, rhythm proposal, Stories

- **First pipeline post published** (Sat 17 Oct, approved by the owner): "Which is faster? The postcard trio",
  https://www.instagram.com/p/Del3tI6jfM0/ (4 slides H4, @ravensburgerglobal photo tag + mention, 4 topic hashtags).
  Follow-up Stories: poll today, answer tomorrow.
- **Strategy direction (owner):** Monday weekly recap, weekends interactive (strongest community activity), the rest
  flexible; start at 3–5 posts a week, more when the data supports it; long-term building with added value, never
  slop. The research proposal (`research_notes/…/growth_strategy_2026.md`: 4/week incl. the owner's posts, Mon 19:00
  Weekly Numbers, Wed/Thu data story, rotating 4th slot, Sat ~10:00 community post, decision rules for more) is to be
  confirmed next session.
- **Cats vs dogs on hold** until puzzle subjects come from the box images (title matching misses pictures).
- **Story bands** from research (key text and stickers in y 200–1720); the owner will verify with the ruler test frame.
- **Keep everything learnt for future posts, Reels and Stories:** `editorial/standing-feedback.md` is the rulebook every
  draft reads first.

## 2026-10-17: giveaways and the Advent of Puzzle campaign (owner's brief for the overnight session)

- **Advent of Puzzle is the owner's chosen campaign** for December 2026: four Advent weeks, a quiz Monday to Saturday
  (days 1–6), a Sunday draw of one winner among everyone who answered that week's quizzes correctly, for a voucher;
  4 × (6 quizzes + 1 draw). It runs alongside the normal posts and must fit the long-term strategy (weekly rhythm, real
  value, never slop); quizzes in the house style, built from MSP data and box images.
- **Answers via the day's Story** (preferred; the Story's 24 h life is fine, even better). Answers don't need to be
  hidden; comments on a feed post are an acceptable fallback.
- **Claude Code collects every day before the Story expires** and saves the list of correct answerers (local store,
  audit trail per day), **draws on Sunday** from the week's saved lists, and drives the whole flow with scheduled jobs on
  this Mac. **The owner only approves what gets published.** Replying, hiding, deleting, messaging and publishing need
  the owner's explicit approval; the automation is read-only until then.
- **Eligibility rule, prize, answer route details, quiz types and the visual variant are open** (morning list in
  `docs/advent-morning.md`; design in `docs/ideas/advent-of-puzzle.md`).
- **Heavy local jobs were allowed for the night of 17 Oct** (calm check passing, resources logged, one at a time).

## 2026-10-18: profile (after the one-off profile check)

- **Name field stays "MySpeedPuzzling".** We're more than puzzle times: a puzzle community with times, stats and
  competitions. Search words go into the bio instead.
- **Bio (B1):** "Every solve counts ⏱️ The speed puzzling community: times, stats and competitions from 11,000+
  puzzlers in 86 countries. Join us, it's free 🧩". Tone: friendly community, not selling; the goal is reaching more
  puzzlers. Numbers are registered players without a private profile (11,780 on 2026-10-18) and their countries (86),
  rounded down; re-count before any later bio change. No "biggest" claims unless they can be shown.
- Nothing pinned and no highlights yet: proposals in `research_notes/MSP Instagram content pipeline/profile_audit_2026-10-18.md`.
- **Pinned posts are evergreen** (owner, "my big concern is the rapidly growing and outdated numbers"): Instagram can't
  replace a published post's images, so a pinned post uses rounded-down floors that stay true as numbers grow
  ("11,000+", "80+ countries"), no time windows in headlines, a footer "Oct 2026, growing daily", and a caption line
  "Numbers as of October 2026 and growing every day; we'll refresh this post now and then." Refresh by re-posting
  (about yearly, or when a floor is far behind), re-pin the new one, archive the old. Current numbers go in a
  "Start here" Story highlight that is updated monthly.
