# Backlog

Build and ops work for the pipeline. Content ideas live in `docs/ideas/` (public, aggregates) and
`content/ideas/backlog.md` (local). Tick items off here when done; add new ones at the right priority.
Updated 2026-10-16.

## Now

- [x] Owner feedback on DL1 styles and DL2 formats (2026-10-14) → `docs/decisions.md`, `docs/design/house-brief.md`.
- [x] DL4 house system built (2026-10-16): `src/design/house.ts`, variants H1–H3, all approved content (data, image
      formats, ideas, funny facts, timely stories, Stories, Reels) in each, profile grids, 0 QA errors.
- [ ] **Owner verdict on DL4** (variant + per-slide) → `docs/decisions.md`; then fold in the house proposals:
      per-ground art palette (`--a-*`), `cover()` with art in poster/chapter layouts, family CSS hook in `run.ts`,
      shared geometry/board/ring helpers (copied across families now), `heroFitUnit`, an "ink on device" token, a
      lighter second chart colour on sky (hot and cool are both near-black), story layouts in `cover()`.
- [x] Funny facts restyled (real pieces/box images, flat poster, type-led; J1 compares them); timely stories restyled.
- [ ] Owner pick for the funny-facts approach (J1: A pieces/boxes recommended as default, C type-led for one-offs).
- [x] Reels in the house style, full 9:16, plus the XP feature-reveal Reel (`lab/dl4/reels/`, 12 renders).
- [x] Outlined logo (`assets/brand/speedpuzzling-logo-outline.svg`), ≈ 1.5× in every footer.
- [x] IL1 run (2026-10-16 10:58–15:05, 199/199 images, 0 failures).
- [ ] IL1 owner review → style guide + reference set (may lead to a task in the MSP repo for the website).
- [x] DL4 Reel videos re-rendered with the bigger branding (2026-10-16, 12/12 spec ok).
- [x] Logo intro/outro research (Rive vs SVG+GSAP vs Lottie: GSAP in HyperFrames for Reels, Rive for the website later).
- [x] LM1 logo motion lab (2026-10-16): rigged logo (`assets/brand/speedpuzzling-logo-rig.svg`, 0 px diff), 5 intros,
      3 outros, 4 app-splash cuts (`lab/logo/`).
- [x] LM1 round 2: connectable modules on one hand-off frame (`lab/logo/chain.ts`, `--chain "converge drop hold:0.6 breakup"`),
      new intros (rain, converge, sweep, jigsaw, relay), break-up outro, ≤ 1 s Android splash cuts, 1.2 s loading loop +
      reduced-motion loop, 0.6 s loop-back Reel sting, example chains (app, event opener, brand Reel).
- [ ] Owner picks in LM1 (Claude's picks: F2 Converge for intro/splash, no Reel outro but the 0.6 s sting, P Break-up for
      long formats) → hand the app team the splash/loader spec (Android AVD ≤ 1 s inside a 192 dp circle, no masks or
      outline, so a coral/white ground; iOS static launch screen; reduced motion) and ask for cold-start times.
- [ ] Trial Reels test: the same Reel with no outro / 0.6 s sting / full outro (skip rate, avg watch time, sends, follows).
- [ ] Decide the series of `75-years` (milestone = coral in H3, or fun with the timely stories).
- [ ] Feedback still to collect: DL3 visuals, AI1 images.
- [ ] Port the XP share card concept (generator pieces) back to the MSP site once the owner picks a version.

- [ ] **GIPHY sticker pack** (owner: "awesome idea", 2026-10-16) so players can put MSP in their own Stories:
      animated stickers from the logo rig (e.g. stopwatch sweep, piece snap, "New PB!", "Puzzle done", "MSP"), transparent
      GIF/WebP per GIPHY specs; needs a GIPHY brand channel (verified to be searchable in Instagram). Research specs +
      verification steps, then prototype in LM1. Durations/notes: `research_notes/…/logo_motion_durations.md`.

## Build: from labs to production

- [ ] `src/posts/<series>.ts` builders: one per chosen series (Weekly Numbers, Puzzle of the week, Atlas, Museum,
      tier list, timely/milestone, event preview/recap, monthly report, quiz). Each: run its queries `--fresh`, write
      `facts.json`, render slides with the chosen look, propose caption + alt text, save a draft (`in_review`).
- [ ] `tools/draft.ts <series> [--date]` CLI wrapping the builders (used by the `ig-draft` skill).
- [ ] Move shared lab helpers into `src/design/` (piece placement with rotation, cut-line helper, round-puzzle ring,
      Rubik metrics for hero numbers, month formatting, flag guard for empty country codes, box crops).
- [ ] Reels publishing in `src/publish` (`media_type=REELS`, `video_url` on R2, `cover_url`, `share_to_feed`,
      optional `trial_params`); preflight for video specs (ffprobe). Stories stay manual (stickers).
- [ ] Reels audio decision and pipeline (silent / SFX from Freesound CC0 / royalty-free bed; licence ledger).
- [ ] Scheduled publishing: launchd LaunchAgent running `node src/publish/publish.ts --due` every 15 min
      (approve-now already works); max 6 h lateness → `needs_reschedule`.
- [ ] Insights schedule: launchd job for `tools/insights.ts` (+48 h, +7 d, +30 d per post; account metrics weekly);
      six weekly panels in the review app; `editorial/learnings.md` updated by the `ig-insights` skill.
- [ ] Read-only comment digest for the owner (new comments since last check, suggested replies; Claude never posts).
- [ ] AI in production (only where the owner approves): plate library with picks + model/licence per asset,
      composite-back in the post builders, an "AI1 in context" gallery (candidates placed in their real layouts).
- [ ] Token: weekly `node tools/ig-token.ts status` check with a reminder 7 days before expiry (2026-12-12).

## Repo, security, ops

- [ ] Back up `content/labs/` (1.3 GB, gitignored, the only copy of AI images and the owner's feedback; no Time Machine
      destination configured on 2026-10-16). Owner to choose where (external disk / Time Machine / private cloud).

- [ ] Create the public GitHub repo, enable push protection; run a full-history secret scan (gitleaks) before the
      first push; then push. (The local pre-commit hook already blocks `.env` values, hostnames and credential shapes.)
- [ ] Optional: install gitleaks as a second pre-commit scanner.
- [ ] Keep `docs/STATUS.md` current at the end of each work session.

## Known issues

- Lab galleries: iOS video playback needs the review server running (Range support added 2026-10-13).
- Box images from MSP's image proxy are max ~1200 px; heroes upscaled > 1.5× look soft.
- `lab/ai1` E5 (Qwen relight) can't pass the calm gate on a 36 GB Mac (needs ≥ 32 GB free); drop or run at 768 px.
- AI1 E2 material textures: no clear win over code textures; one has a rounded-corner artifact.
- Some DL3 G2 spirit-animal stats use substitute queries (see the G2 file header).
- DL4: kickers now cut with an ellipsis instead of failing QA when too long (check long kickers by eye); in H3 the
  museum's beige AI plates sit oddly against sky panels; H2 posters shrink image-led covers by ~150–200 px.
- DL4 tier-list detail slides credit "box art: Ravensburger unless noted" rather than Puzzle · Brand per row (as DL3).

## Small open questions for the owner

- Ghost with eye holes (F3 Halloween) OK under the no-faces rule? Does the cat cartoon read clearly?
- Puzzle Atlas: OK with the 10× threshold for a country's "signature" puzzle? Tier list cut-offs 60/65/70 min OK?
- Reels: silent with burned-in text, or add sound (SFX / royalty-free music)?
- Spirit animals: is the cute pastel style right for MSP?
- Monthly "active puzzlers" definition to publish (logging-based vs the app's community stats).
- Giveaways per year (default: 2–3, tied to events).
- GA4 access for measuring Instagram → website (service account) and a `/ig` landing page with per-post links?
