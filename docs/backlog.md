# Backlog

Build and ops work for the pipeline. Content ideas live in `docs/ideas/` (public, aggregates) and
`content/ideas/backlog.md` (local). Tick items off here when done; add new ones at the right priority.
Updated 2026-10-14.

## Now

- [x] Owner feedback on DL1 styles and DL2 formats (2026-10-14) → `docs/decisions.md`, `docs/design/house-brief.md`.
- [ ] DL4 house system: `src/design/house.ts` + all approved content re-rendered in it + mock profile grid
      (3–4 weeks, incl. an owner-photo placeholder); owner picks → record in `docs/decisions.md`.
- [ ] Restyle the funny-facts cartoons so they don't read as AI art (piece/box compositions, bold flat poster shapes
      or type-led jokes); keep the jokes.
- [ ] Reels: re-skin into the house style, fill the full 9:16 frame, add a feature-reveal Reel (HyperFrames).
- [ ] Outlined logo for dark grounds (SVG + white outline filter; ref `assets/brand/email-logo.png`), logo ≈ 1.5×.
- [ ] Feedback still to collect: DL3 visuals, AI1 images.
- [ ] Port the XP share card concept (generator pieces) back to the MSP site once the owner picks a version.

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

## Small open questions for the owner

- Ghost with eye holes (F3 Halloween) OK under the no-faces rule? Does the cat cartoon read clearly?
- Puzzle Atlas: OK with the 10× threshold for a country's "signature" puzzle? Tier list cut-offs 60/65/70 min OK?
- Reels: silent with burned-in text, or add sound (SFX / royalty-free music)?
- Spirit animals: is the cute pastel style right for MSP?
- Monthly "active puzzlers" definition to publish (logging-based vs the app's community stats).
- Giveaways per year (default: 2–3, tied to events).
- GA4 access for measuring Instagram → website (service account) and a `/ig` landing page with per-post links?
