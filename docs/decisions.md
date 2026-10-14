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
