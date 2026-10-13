# Approval UI, Draft Storage and Claude Code Orchestration for a Local Instagram Pipeline (state as of 2026-10-13)

Scope: a local-only (MacBook, no hosting) semi-automated Instagram pipeline for @myspeedpuzzling. Claude Code pulls data from a read-only database, proposes ideas, drafts captions, renders visuals, shows a faithful Instagram preview, and the owner approves, refines or rejects each draft. Approved posts go out through the Instagram API with Instagram Login tokens. The repository is PUBLIC.

Research method: official docs (code.claude.com, developers.facebook.com, docs.postiz.com, mixpost.app), GitHub repos and release pages, Context7 for gitleaks/trufflehog, plus a few secondary blogs where no primary source exists (marked as such). Nothing was installed or run.

---

## 1. Reuse an existing open-source scheduler (Postiz, Mixpost, others) vs. build a tiny custom review app

### Takeaway
Postiz is the only actively developed open-source (AGPL-3.0) option that self-hosts Instagram publishing, including Instagram Login ("instagram-standalone"). It has a draft/schedule API, an MCP server and, since v2.25.0 (Oct 2026), a preview page with inline comments. It still has **no approve/reject gate**, it needs a five-service Docker stack (Postgres, Redis, Temporal and more), and its previews are generic, not pixel-faithful Instagram mockups. Mixpost Lite (MIT) does not support Instagram at all. Instagram, approvals, API and MCP need Mixpost Pro ($299 one-time, source-available). For one account with an approval-centric flow driven by Claude Code, a tiny custom app over a folder of drafts is simpler, lighter and fits better. Postiz is a reasonable plan B if multi-platform cross-posting becomes a goal.

### Cited Findings

**Postiz (gitroomhq/postiz-app)**
- License AGPL-3.0. About 37.1k stars and 7.2k forks. Stack: pnpm monorepo, Next.js, NestJS, Prisma (PostgreSQL by default), Temporal, Resend for email. Instagram is among the supported platforms. The repo lists a public API with webhooks, a NodeJS SDK, n8n and Make integrations, an MCP server and an "AI Agents CLI" — [GitHub: gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)
- Self-hosters must create their own developer apps on each platform and pass the platform's review (the repo says Meta, YouTube and TikTok "can take weeks"). They also handle updates, migrations, uptime, backups and security patches themselves — [GitHub: gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)
- Self-host requirements: PostgreSQL 14+, Redis 6+, Temporal (required since v2.12.0, bundled in the official compose), optional object storage (`STORAGE_PROVIDER=local` works). Minimum 2 vCPU / 2 GB RAM / 20 GB disk for light single-user use; 4 vCPU / 8 GB / 50 GB recommended. Ports: 5000 (container, mapped to host 4007 in the compose), 7233 (Temporal gRPC), 8080 (Temporal UI) — [Postiz docs: System requirements](https://docs.postiz.com/self-host/installation/system-requirements.md)
- Instagram connection options in self-hosted Postiz:
  - "Standalone" uses Instagram Login and needs a professional IG account, configured with `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`. The redirect path is `/integrations/social/instagram-standalone`, and the docs give localhost examples.
  - The Facebook Business path is the only one that supports the Audio API for Reels.
  - Until advanced permissions are approved, "only roles you've added can publish" (a tester or developer role on the Meta app). For a single own account this may make App Review unnecessary.
  - Known limits: no story link stickers, no automatic comment replies.
  — [Postiz docs: Instagram self-host provider](https://docs.postiz.com/self-host/providers/instagram.md)
- Public API: `POST /public/v1/posts` with `type` `"schedule"` (with `date`) or `"now"`. Media go through `POST /public/v1/upload` and are referenced by id. Instagram `__type` is `instagram` or `instagram-standalone`, with settings `post_type` and `collaborators`. The create-post rate limit is 90/hour on self-hosted (100 on cloud), adjustable with `API_LIMIT`. Request bodies are capped at 50 MB — [Postiz docs: Public API](https://docs.postiz.com/public-api)
- The API index also has a "Change Post Status (draft/schedule)" endpoint — [Postiz docs index (llms.txt)](https://docs.postiz.com/llms.txt)
- Standalone Instagram settings match the Facebook-linked ones (post type, trial reels, collaborators, image arrays). Standalone cannot attach Reel audio — [Postiz docs: instagram-standalone provider](https://docs.postiz.com/public-api/providers/instagram-standalone)
- Postiz MCP tools: `integrationList`, `groupList`, `integrationSchema`, `triggerTool`, `schedulePostTool` (type `draft` | `schedule` | `now`), `postsListTool`, `postSettingsTool`, `mediaListTool`, `generateImageTool`, video and clipping tools — [Postiz docs: MCP tools](https://docs.postiz.com/mcp/tools.md)
- The hosted MCP endpoint is `https://mcp.postiz.com/mcp-oauth-dynamic` (Streamable HTTP, OAuth). It can be added to Claude Code with `claude mcp add --transport http postiz https://mcp.postiz.com/mcp-oauth-dynamic`. Postiz's own guidance is to have the agent schedule rather than publish immediately, then review the queue in Postiz — [Postiz MCP page](https://postiz.com/mcp)
- Approvals: you open **Preview** on a post and share the link; the recipient sees the post "as it will appear" and can comment without an account. The docs state **"there is no 'approved' flag that blocks publishing."** Approval means moving a draft to scheduled by hand. Preview links are not password-protected — [Postiz docs: Approvals](https://docs.postiz.com/general/approvals.md)
- Recent releases:
  - v2.25.1, 11 Oct (latest), fixes security advisory PSA-2026-4QX1WG and says to upgrade immediately.
  - v2.25.0, 2 Oct, added inline comments on the preview page (anchored text, threaded replies, resolving, anonymous commenting). The MCP schedule tool now returns a `previewUrl`, and a "Use self-hosted" option on the MCP consent screen relays Postiz Cloud MCP calls to a self-hosted instance. It also added Instagram Reel custom covers and curated container errors.
  - v2.24.0, 22 Sep, sends collaborators on the carousel container.
  — [GitHub: postiz-app releases](https://github.com/gitroomhq/postiz-app/releases)
- Known self-host friction with Instagram standalone: issue #1155 reports an OAuth URL with a malformed `client_id` and then "Could not add provider". Cloudron forum users reported the same "App ID invalid" problem in April 2025 — [GitHub issue #1155](https://github.com/gitroomhq/postiz-app/issues/1155); [Cloudron forum](https://forum.cloudron.io/topic/13668/impossible-to-log-in-any-sm-account-on-postiz/14)

**Mixpost (inovector/mixpost)**
- Official pricing:
  - Lite: free; Facebook Pages, X and Mastodon only (**no Instagram**); no REST API, no MCP, no AI assistant.
  - Pro: $299 one-time; adds Instagram and all other platforms, approval flow, REST API, MCP and AI assistant; 1 year of updates plus a perpetual fallback license.
  - Enterprise: $1,199 one-time.
  - Paid licenses are source-available, not open source. The code cannot be redistributed, and building a SaaS requires Enterprise.
  — [Mixpost pricing](https://mixpost.app/pricing)
- The Lite repo is MIT-licensed, has about 3.8k stars and is built on Laravel/PHP — [GitHub: inovector/mixpost](https://github.com/inovector/mixpost)
- Install options are Docker, manual PHP, or into an existing Laravel app. The docs say a public domain or subdomain is "strongly recommended" because Mixpost must talk to social platform servers — [Mixpost Lite docs](https://docs.mixpost.app/lite/)
- One third-party review describes Pro as one-time $299 and confirms that approval flows, API and MCP are Pro features — [Blotato: Mixpost vs Postiz](https://www.blotato.com/blog/mixpost-vs-postiz) (secondary, from a competitor)

**Others**
- Socioboard: a secondary comparison site says the open-source repo has shipped no tagged release since November 2019, which suggests it is effectively unmaintained — [socialk.it Socioboard alternatives](https://socialk.it/en/alternatives/socioboard) (secondary; not verified on GitHub)
- An aggregator reports poor Reddit sentiment for Mixpost's setup and maintenance — [openalternative.co Mixpost alternatives](https://openalternative.co/alternatives/mixpost) (single secondary source; low weight)

### Inferences
- **Recommendation: build a tiny custom review app; do not adopt Postiz or Mixpost as the core.** Reasons:
  1. Neither Postiz nor Mixpost Lite offers a real approve/reject gate for free. Postiz explicitly lacks an "approved" flag, and Mixpost's approval flow is Pro-only and paid.
  2. Postiz needs Postgres + Redis + Temporal (+ Temporal UI) on a laptop for one account, which is heavy for "local-only, no hosting".
  3. The owner wants a pixel-faithful IG preview (grid crop, caption truncation, carousel dots). Neither tool documents an Instagram-faithful mockup; Postiz only says "as it will appear".
  4. Claude Code works best on plain files (YAML/Markdown/images) it can read and diff, rather than on another app's database through an API with a 90/h rate limit.
  5. AGPL is no problem for internal use, but running Postiz still means another app to upgrade, as the October 2026 security advisory shows.
- When Postiz becomes worth it: if MSP later wants cross-posting to Threads, Facebook, Bluesky and others, or a shareable preview link for a second reviewer. Its MCP `schedulePostTool` with `type: draft` plus the new `previewUrl` would then make a decent "Claude drafts → human reviews in Postiz" loop.
- Hybrid option: keep the custom file-based drafts and review UI, and use Postiz only as a publisher behind its public API. For a single IG account this adds a dependency without real benefit, since direct Graph API publishing already works.
- The Instagram-standalone integration in Postiz still needs the owner's own Meta app (the same kind already verified). Because the owner already holds working Instagram Login credentials, Postiz would bring no "free" Instagram access.

### Gaps
- Could not verify whether Postiz's preview page renders a platform-specific Instagram frame (avatar, 4:5 crop, "… more") or a generic card.
- Could not confirm whether Postiz's preview/comment feature and the MCP "Use self-hosted" relay work fully offline (local-only) without Postiz Cloud.
- Shoutify: no reliable 2026 information was found; status unknown.
- Mixpost Pro's approval UX (per-post comments, preview fidelity) was not examined in detail.

---

## 2. What a faithful Instagram preview needs (and reusable mockup components)

### Takeaway
A useful preview should show four views: (a) the feed post frame (avatar, username, media at its real aspect ratio, carousel dots and swipe, like/comment/share row, caption cut at about 125 characters with "… more"); (b) the profile grid tile with the 3:4 center crop introduced in early 2025; (c) Reels and Stories at 9:16 with UI safe-zone overlays; (d) the full caption with hashtag and mention styling and alt text. No well-maintained open-source "Instagram post mockup" component turned up; plan on about 150 lines of HTML/CSS of your own.

### Cited Findings
- **Feed aspect ratios:** feed posts accept 1.91:1 to 4:5; Stories and Reels are 9:16 — [Kapwing: Instagram's new grid layout](https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/). API publishing rejects images outside the range, error 36003 / subcode 2207009 — [ContentStudio: Instagram errors](https://docs.contentstudio.io/article/1239-instagram-errors) (secondary)
- **Profile grid 3:4:** the grid moved from 1:1 to 3:4 thumbnails in early 2025, and thumbnails are center-cropped to 3:4 whatever the upload ratio. Users can change a post's grid thumbnail via "⋯ → Adjust Preview" (drag, or add a background border) — [Kapwing](https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/)
- Other guides say a 4:5 upload loses a thin strip on each side in the grid, put the grid preview at about 1012–1013 × 1350 px, and mention native 3:4 uploads at 1080 × 1440. Most recommend posting 4:5 (1080 × 1350) with key content inside a centered 3:4 safe area — [Oktopost grid guide](https://www.oktopost.com/blog/instagram-grid-size-guide/); [Planoly vertical grid guide](https://planoly.com/blog/guide-to-instagrams-new-vertical-grid). Kapwing's general wording ("vertical and square images lose their tops and bottoms") conflicts with this for 4:5. Geometrically, 4:5 (0.80) is wider than 3:4 (0.75), so cropping it to 3:4 trims the sides.
- **Caption truncation:** feed captions cut off after about 125 characters with a "more" link, so the key message belongs at the start — [FAU Instagram best practices](https://www.fau.edu/public-affairs/marketing-services/social-media/best-practices/instagram-best-practices/index.php). Reels captions visually truncate after about 3 lines — [TryMyPost Reels safe zones 2026](https://www.trymypost.com/blog/instagram-reels-safe-zones-text-placement-2026) (secondary)
- **Carousels:**
  - Since August 2024 the Instagram app allows up to 20 photos/videos per carousel — [Social Media Today](https://www.socialmediatoday.com/news/instagram-expands-carousels-to-20-frames/723792/)
  - The Content Publishing API documents **10 items** maximum, and carousel images are cropped to the first image's aspect ratio (default 1:1) — [Meta: Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
  - JPEG is the only supported image format for API publishing — [Meta: Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- **Alt text:** custom `alt_text` is supported for image posts via the API since 24 March 2025, but not for Reels or Stories — [Meta: Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- **Reels safe zones (1080 × 1920):** sources disagree.
  - Hopper HQ converts Meta's percentage guidance to about 270 px top, about 670 px bottom and about 770 px bottom-right — [Hopper HQ](https://www.hopperhq.com/blog/instagram-reel-size/)
  - ClipSpeed says the bottom UI grew in late 2025 and recommends keeping text at least 450–480 px above the bottom — [ClipSpeed](https://www.clipspeed.ai/blog/instagram-reels-captions.html)
  - An older First Pier figure is 108 px top / 320 px bottom — [First Pier](https://www.firstpier.com/resources/instagram-ad-safe-zones)
  - TryMyPost cites a roughly 90 px right-hand icon strip and calls the top 150 px risky — [TryMyPost](https://www.trymypost.com/blog/instagram-reels-safe-zones-text-placement-2026)
- **Mockup components:** no clearly maintained open-source GitHub component turned up. The candidates are:
  - a Creative Tim Tailwind "Instagram Post Component" (single-post UI replica, needs FontAwesome) — [Creative Tim](https://www.creative-tim.com/twcomponents/component/instagram-post-component)
  - a v0 "Instagram Feed Preview" grid template (Next.js + shadcn) — [RapidDevelopers v0 template](https://rapidevelopers.com/v0-template/instagram-feed-preview)
  - a Magic Patterns feed component — [Magic Patterns](https://www.magicpatterns.com/catalog/i/6vhevZCL9or7dPyZgmm7rb)

### Inferences
- **Preview checklist for the custom UI:**
  1. Phone-width frame (about 390–430 CSS px) with avatar, `myspeedpuzzling`, optional "Collab" / location line and ⋯ menu.
  2. Media box locked to the post's ratio: 4:5 default, 1:1 or 1.91:1 when chosen, with every carousel slide forced to slide 1's ratio, matching API behavior.
  3. Carousel with CSS scroll-snap, a "1/N" counter badge top-right and dots below the media.
  4. Action row (♡ 💬 ✈ / bookmark) and an "N likes" placeholder.
  5. Caption: bold username, then text clamped at about 125 characters or 2 lines with "… more" that expands on click. Render `#hashtags` and `@mentions` in IG link blue, keep line breaks, and show a live character count against the 2,200 limit (verify) and a hashtag count against 30 (verify).
  6. Timestamp line.
  7. Profile grid tab: render the new draft as the top-left tile followed by the last N real posts (fetched once via API into a local cache), each center-cropped with `object-fit: cover` at `aspect-ratio: 3/4`. This shows how the post sits next to recent ones.
  8. Reels/Story tab: 9:16 frame with translucent overlays for the top and bottom UI bands and the right-hand icon strip. Use the more conservative 2025–2026 values (about 270 px top, about 480–670 px bottom, about 120 px right, scaled) and make them toggleable.
  9. A light/dark mode toggle, because IG users see both.
  10. Alt-text display per slide, plus a warning badge when a carousel has more than 10 items (API limit) or an image is not JPEG or falls outside 4:5–1.91:1.
- Render the post visuals themselves from HTML/CSS templates, for example screenshotted with a headless browser at 1080 × 1350. The review UI can then show the exact JPEG that will be uploaded rather than a re-creation, so "what you approve is byte-identical to what gets published".
- Keep a "grid-safe" guide overlay (centered 3:4 box) on 4:5 slides so designers keep text out of the side strips that the grid trims.

### Gaps
- No official Meta documentation for the 3:4 grid crop or for the current Reels safe-zone pixels was found; the numbers come from secondary blogs and conflict.
- The API's maximum caption length (2,200 characters) and hashtag limit (30) were not re-verified in this research round; check the Content Publishing reference.
- Unknown whether the Content Publishing API accepts native 3:4 (0.75) images. The documented 4:5 lower bound suggests it does not, so keep 4:5 as the safe upload ratio.

---

## 3. Minimal custom app options and recommendation (feedback model)

### Takeaway
The best fit is a single-process local web app (Python FastAPI or Flask + Jinja2 + htmx, or equally Bun + Hono + htmx) that reads and writes the draft folders directly, plus deterministic CLI scripts for rendering, publishing and insights. Streamlit and Gradio are fast to start but poor at pixel-faithful custom HTML/CSS mockups. A static HTML page regenerated by Claude works for read-only previews but still needs a tiny server for actions. The feedback model should be file-based so the next Claude Code session can act on it.

### Cited Findings
- Claude Code skills can inject live shell output into the prompt with the `` !`command` `` syntax (for example `` !`cat content/drafts/*/feedback.jsonl` ``), and skills can bundle scripts referenced through `${CLAUDE_SKILL_DIR}` — [Claude Code docs: Skills](https://code.claude.com/docs/en/skills). The UI therefore only needs to write files; Claude picks them up.
- `claude -p` supports `--output-format json` and `--json-schema` for schema-conforming structured output (`structured_output` field). A UI button could trigger a revision run and parse the result deterministically — [Claude Code docs: Headless / programmatic](https://code.claude.com/docs/en/headless)
- Postiz's preview has no approve/reject state, only comments ([Postiz docs: Approvals](https://docs.postiz.com/general/approvals.md)). The off-the-shelf alternative therefore lacks the state machine this pipeline needs.

### Inferences
- **Option comparison (judgment, not sourced benchmarks):**
  - *Python FastAPI/Flask + Jinja2 + htmx*: about 300–500 lines total, no build step, easy for Claude Code to maintain. It works well if rendering uses Python (Pillow) or Playwright for Python, and Python is usually the language of the DB access and Graph API scripts too. **Recommended default.** Run it with `uv run` and inline script dependencies to avoid a virtualenv dance (verify current uv syntax).
  - *Bun + Hono + htmx*: equally small; choose it if the renderer is JS (e.g. Satori/resvg or Playwright for Node) so there is one runtime.
  - *Streamlit/Gradio*: quick forms, but faithful IG CSS mockups, carousel swipe and inline caption editing fight the component model (the whole script reruns on every interaction). Not recommended.
  - *Static HTML regenerated by Claude + tiny action server*: fine as a v0. Claude writes `review/index.html` and a 50-line server handles POSTs. It drifts quickly once inline editing is added.
  - *Pure CLI* (e.g. `msp review`, opening JPEGs in Preview.app and taking y/n/e input): fastest to build, but it cannot show the caption truncation, grid or carousel context the owner wants. Keep it as a fallback (`msp approve <id>`) for scripting.
- **Feedback model per draft** (written by the UI, read by Claude):
  - `status` transitions: `idea → drafted → in_review → (changes_requested ↔ drafted) → approved → scheduled → publishing → published` plus `rejected` and `failed`.
  - Actions:
    - **Approve**, with a required schedule time (default: next free slot in the posting calendar).
    - **Reject**, with a reason picked from a short taxonomy (off-brand, factually wrong, weak hook, privacy concern, duplicate, other) plus free text. The reason is appended to `editorial/rejected-ideas.md` so Claude learns from it.
    - **Request changes**, with comments that target `caption`, `slide:N`, `alt_text:N`, `hashtags` or `whole post`.
    - **Pick candidate**: when Claude renders 2–4 variants of a slide or cover, the UI shows them side by side and the choice is recorded.
    - **Inline caption edit**: a contenteditable textarea that saves as a new caption version with `author: human`. Claude must not overwrite human edits; the revise skill treats them as fixed unless told otherwise.
  - Store feedback append-only (`feedback.jsonl` lines: `{ts, target, kind, text, version}`) so history is never lost and Claude can see what has been addressed. The revise skill marks items `resolved_in: vN`.
- The UI should bind to `127.0.0.1` only and needs no auth for local-only use. It should never display token values; show only "token valid until <date>" from a debug call.
- The **publish button must call a deterministic script**, not an LLM (see section 6). An LLM should never hold the publish capability in an unattended loop.

### Gaps
- No benchmark or primary source compares these frameworks for this specific use; the comparison is engineering judgment.
- The current `uv` inline-metadata syntax and FastAPI/htmx versions were not verified in this round.

---

## 4. Draft storage that is git-friendly and Claude-readable

### Takeaway
Use one folder per draft (`draft.yaml` + `feedback.jsonl` + rendered JPEGs + a data snapshot) and one SQLite file for operational state (publish log, IG media ids, insights snapshots). Because the repo is public and drafts can contain community members' names, results and photos, **put the whole `content/` tree (drafts, renders, data snapshots, SQLite) in `.gitignore`**, or keep it in a separate private repo. Commit only code, templates, skills, SQL query files (no data) and a sanitized editorial memory.

### Cited Findings
- Claude Code's `.claude/settings.local.json` is personal and kept out of git (Claude Code adds `**/.claude/settings.local.json` to the global git excludes when it creates the file), while `.claude/settings.json` is meant to be committed and shared — [Claude Code docs: Settings](https://code.claude.com/docs/en/settings)
- Read deny rules use gitignore-style paths (`Read(./.env)`, `Read(./secrets/**)`; bare names such as `Read(.env)` match at any depth). A `.claudeignore` file has **no effect** — [Claude Code docs: Permissions](https://code.claude.com/docs/en/permissions)
- Meta media insights are stored for up to 2 years and can be delayed up to 48 hours ([Meta: Media Insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/)), so local snapshots are the durable record for longer-term learning.

### Inferences
- **Proposed layout:**
  ```
  msp-instagram/                 (PUBLIC repo)
    CLAUDE.md                    # pipeline overview, rules, where things live
    .claude/
      settings.json              # deny Read(.env*), allowlisted scripts, hooks
      skills/ig-*/SKILL.md       # see section 5
      agents/*.md                # optional subagents (data-analyst, copy-editor)
      hooks/*.sh                 # protect-files, secret-scan
    editorial/                   # committed, sanitized, no personal data
      brand-voice.md  pillars.md  posting-calendar.md
      learnings.md    rejected-ideas.md
    queries/*.sql                # parameterized SQL, no results
    templates/                   # HTML/CSS visual templates + fonts/brand assets
    app/                         # review UI
    scripts/                     # render, publish_due, pull_insights, fetch_grid
    .env.example                 # names only, no values
    content/                     # GITIGNORED (or a private repo / symlink)
      drafts/2026-10-20_weekly-records/
        draft.yaml
        feedback.jsonl
        data/snapshot.json       # query results used (may contain names → never commit)
        render/v1/slide-01.jpg … render/v2/…
        candidates/cover-a.jpg cover-b.jpg
      grid-cache/                # last N published thumbnails for grid preview
      state.sqlite               # publish_log, insights_snapshots, token_meta
      logs/
  ```
- **`draft.yaml` fields:**
  - identity and format: `id`, `created_at`, `status`, `pillar` (e.g. records, community spotlight, puzzle-of-the-week, tips, events), `format` (`feed_image` | `carousel` | `reel` | `story`), `aspect` (`4:5`)
  - content: `slides[]` (`file`, `alt_text`, `chosen_candidate`), `caption` (current text) and `caption_history[]` (`version`, `author: claude|human`, `text`), `hashtags[]`, `mentions[]`, `collaborators[]`
  - scheduling: `schedule_at` (ISO 8601 with offset, e.g. `2026-10-20T18:30:00+02:00`)
  - provenance: `provenance` (`query_file`, `params`, `snapshot_sha256`, `db_snapshot_time`)
  - consent: `consent` (e.g. `public_profile_data_only: true`, `named_people: [...]`, `photo_permission: yes|no|n/a`)
  - publishing: `publish` (`ig_container_id`, `ig_media_id`, `permalink`, `published_at`, `attempts`, `last_error`)
- YAML suits human review; JSON is easier for scripts. Either works with Claude. Pick YAML with a JSON Schema and validate it in a hook or a pre-publish check.
- **SQLite** (`state.sqlite`) holds what is append-heavy or queried: `publish_log`, `insights_snapshots(media_id, captured_at, age_bucket, metric, value)` and `account_snapshots`. It is the single source of truth for "was this already published?" (idempotency).
- **What to commit vs. gitignore:**
  - Commit: code, templates, skills, `editorial/*.md` (written without member names, or with public handles only when they are already public on IG), SQL files, `.env.example`, JSON schema.
  - Gitignore: `content/**`, `*.sqlite*`, `.env*` (except `.env.example`), `logs/`, `**/render/`, `**/data/`, and any screenshots.
  - Rationale: drafts mix in DB-derived personal data (names, times, photos) and unpublished content. Rejected ideas should not become public history.
- If versioning drafts matters, `content/` can be its own **private** git repo (nested repo, also gitignored in the public one) or be backed up via Time Machine/iCloud. This keeps git-friendliness without public exposure.

### Gaps
- No source was found on GDPR-specific obligations for publishing community members' competition results on social media. MSP's own terms and privacy policy should define what is publishable (e.g. only public profiles, opt-in for photos); not researched here.

---

## 5. Claude Code as orchestrator (skills, commands, subagents, hooks, headless, MCP, Agent SDK)

### Takeaway
Structure the repo around a short `CLAUDE.md` plus a handful of project skills in `.claude/skills/` (custom slash commands are now merged into skills). Mark side-effecting skills such as publish with `disable-model-invocation: true`. Use hooks for deterministic guardrails (block `.env` access, validate `draft.yaml`). Use the DB MCP or a read-only DB user for data and the ComfyUI MCP for image generation. Do **not** give Claude an Instagram-publishing MCP tool. Interactive sessions fit idea generation and revision, because a human is in the loop anyway. `claude -p` (headless) suits optional unattended draft generation; deterministic scripts suit publishing and insights.

### Cited Findings
- **Skills:**
  - Location and merger: project skills live in `.claude/skills/<name>/SKILL.md` and are committed and shared. `.claude/commands/x.md` and `.claude/skills/x/SKILL.md` both create `/x`; commands were merged into skills.
  - Frontmatter (all optional; `description` recommended): `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths`, `shell`.
  - Arguments and context injection: `$ARGUMENTS`, `$0`/`$N` and `${CLAUDE_SKILL_DIR}` substitution, plus `` !`cmd` `` dynamic context injection (a failing command aborts the skill).
  - Best practices: keep SKILL.md under 500 lines, use `disable-model-invocation: true` for side effects, use `context: fork` only for explicit tasks.
  — [Claude Code docs: Skills](https://code.claude.com/docs/en/skills)
- **Headless (`claude -p`):**
  - In `-p` mode, user-invoked skills and custom commands work when `/skill-name` is included in the prompt string.
  - `--output-format json` returns `result`, `session_id` and `total_cost_usd`; `--json-schema` fills `structured_output`.
  - `--continue` / `--resume <session_id>` continue a conversation.
  — [Claude Code docs: Headless](https://code.claude.com/docs/en/headless)
- **`--bare`:**
  - Skips auto-discovery of hooks, skills, commands, subagents, plugins, MCP servers, auto memory and CLAUDE.md.
  - **Requires `ANTHROPIC_API_KEY` or an `apiKeyHelper`**, because it never reads OAuth or keychain (subscription) credentials.
  - Context must be passed explicitly (`--append-system-prompt-file`, `--settings`, `--mcp-config`, `--agents`).
  - It is "recommended for scripted and SDK calls" and "will become the default for `-p` in a future release".
  - Without `--bare`, a `-p` session runs project hooks and connects `.mcp.json` servers **with no workspace-trust dialog**.
  — [Claude Code docs: Headless](https://code.claude.com/docs/en/headless)
- **Unattended permission control:**
  - `--allowedTools` uses permission-rule syntax (e.g. `Bash(git diff *)`).
  - `--permission-mode dontAsk` denies anything not pre-allowed.
  - `--permission-prompts none` (v2.1.259+) denies anything that would prompt and tells Claude not to retry.
  - `--max-budget-usd` caps spend.
  - SIGTERM exits with code 143 and leaves the turn unfinished.
  — [Claude Code docs: Headless](https://code.claude.com/docs/en/headless)
- **Hooks:**
  - Events include `SessionStart`, `UserPromptSubmit`, `PreToolUse` (can block), `PostToolUse`, `Stop`, `SubagentStart/Stop`, `FileChanged`, `PreCompact` and `SessionEnd`.
  - Hooks are configured in `.claude/settings.json`.
  - The documented pattern is a `PreToolUse` script that exits with code 2 to block edits to protected files such as `.env`, with the message passed back to Claude.
  - A `SessionStart` hook with a `compact` matcher can re-inject critical context after compaction.
  — [Claude Code docs: Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- **In-session scheduling:**
  - `/loop` and cron tools are session-scoped, recurring tasks expire after 7 days, and recurring fires are jittered up to 30 minutes late.
  - Scheduled fires do **not** run skills marked `disable-model-invocation: true`.
  - Missed fires get no catch-up.
  — [Claude Code docs: Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)
- **Agent SDK:** the CLI `-p` mode is the Agent SDK's CLI form. The Python and TypeScript packages add structured outputs, tool-approval callbacks (`canUseTool`) and native message objects — [Claude Code docs: Headless](https://code.claude.com/docs/en/headless)
- **Instagram MCP servers (community, unverified):**
  - William-Gao/instagram-mcp: Instagram Login, no Facebook Page, 27 tools including publishing and insights — [GitHub](https://github.com/William-Gao/instagram-mcp)
  - alexfisenkov/meta-instagram-mcp: **local, read-only**; insights, media and comments for your own account — [GitHub](https://github.com/alexfisenkov/meta-instagram-mcp)
  - mikusnuz/meta-mcp: Instagram Graph + Threads, 57 tools; its title says Graph API v25.0 while the search snippet said v26.0 — [GitHub](https://github.com/mikusnuz/meta-mcp)
  - AleemHaider/instagram-mcp: 24 tools — [GitHub](https://github.com/AleemHaider/instagram-mcp)
  - mcpware/instagram-mcp: 23 tools — [GitHub](https://github.com/mcpware/instagram-mcp)
  - These READMEs cite conflicting publish limits (25 vs 100 per 24 h).
- **Postiz MCP** is an alternative way to give Claude scheduling and draft tools — [Postiz docs: MCP tools](https://docs.postiz.com/mcp/tools.md)

### Inferences
- **Suggested skills** (each a folder with SKILL.md plus scripts):
  - `/ig-plan-week` (model-invocable)
    - Reads `editorial/*.md`, the posting calendar, last 30 days of insights (via `` !`python scripts/insights_summary.py` ``) and fresh DB stats via `queries/*.sql`.
    - Proposes N ideas with pillar, hook, data source and format.
    - Writes `content/drafts/<id>/draft.yaml` with `status: idea`.
  - `/ig-draft <id|all-ideas>`
    - Runs the queries, saves `data/snapshot.json`, writes caption and alt text, renders slides via `scripts/render.py`, and creates candidates.
    - Sets `status: in_review`.
    - Use `context: fork` with a subagent so heavy data exploration does not pollute the main context.
  - `/ig-revise`
    - Reads all drafts with `status: changes_requested` and their unresolved `feedback.jsonl` items.
    - Produces vN+1 (never overwriting `author: human` caption edits) and sets `in_review`.
  - `/ig-publish-due` (`disable-model-invocation: true`, `allowed-tools: Bash(python scripts/publish_due.py *)`)
    - A thin wrapper so a human can trigger publishing from a session.
    - The actual scheduler calls the script directly, not Claude.
  - `/ig-insights` (pull and summarize metrics, update `editorial/learnings.md`)
  - `/ig-review`: starts the local UI server and prints the URL.
- **Optional subagents** in `.claude/agents/`:
  - `data-analyst`: read-only DB tools and SQL files; returns facts with provenance.
  - `copy-editor`: brand voice, Czech/English choice, hashtag hygiene; reads `editorial/brand-voice.md`.
  - `privacy-checker`: flags names or photos lacking consent before `in_review`.
- **`CLAUDE.md` should hold:**
  - the pipeline state machine
  - "never read `.env`; credentials only via scripts"
  - "never publish without `status: approved`"
  - pointers to editorial memory
  - the rule that personal data stays in `content/` (gitignored)
  - the exact commands for each step
  - This lets a fresh session run "generate this week's drafts" reliably via `/ig-plan-week` then `/ig-draft all-ideas`.
- **Unattended runs.** Example: a Monday 07:00 launchd job runs `claude -p "/ig-plan-week" --permission-mode dontAsk --allowedTools "Read,Write,Edit,Bash(python scripts/*)" --max-budget-usd 3 --output-format json`, so drafts are ready for review. Two options:
  - A Pro/Max subscription user should run without `--bare` (bare needs an API key) and rely on project settings. In that case the project's hooks and `.mcp.json` run without a trust prompt, which is acceptable for one's own repo.
  - Alternatively, use `--bare` with an `ANTHROPIC_API_KEY` supplied by `apiKeyHelper` or `op run` (never in a committed file) and pass `--settings` and `--mcp-config` explicitly. This is more reproducible but means API billing.
- **MCP choices:**
  - For the DB, a read-only DB user plus a SQL MCP server, or simply scripts that run committed `.sql` files.
  - For images, ComfyUI MCP: this local Claude Code environment already has a `comfyui` MCP server configured (observed in this session's tool list), so render backgrounds or illustrations can come from it while text and data overlays come from HTML templates.
  - For Instagram, prefer your own small Python module over a community MCP. If an MCP is wanted for analysis, choose a **read-only** one (e.g. alexfisenkov/meta-instagram-mcp) so the model can never publish.
- **Agent SDK vs. CLI:** the CLI with skills is enough for this scale. Consider the Python Agent SDK only if the review UI should itself call Claude with a `canUseTool` callback, e.g. a "Revise now" button that streams progress into the page.

### Gaps
- The exact behavior of `-p` runs with subscription OAuth credentials under launchd (keychain access from a LaunchAgent context) was not verified. Test once interactively and check whether the keychain prompt blocks.
- No first-party Anthropic or Meta Instagram MCP server was found; all are community projects of unknown maintenance quality.
- The newest Claude Code version number as of 2026-10-13 was not checked; docs reference features up to about v2.1.295.

---

## 6. Running scheduled publishing reliably from a Mac

### Takeaway
Use a **launchd LaunchAgent** that runs a deterministic `publish_due.py` every 10–15 minutes (or at slot times). The script must be idempotent (check SQLite before creating or publishing containers) and enforce a lateness window. launchd runs `StartCalendarInterval` jobs missed during sleep at the next wake; cron skips them. Wake timing is not guaranteed (lid closed → no run until the lid opens), and `pmset` scheduled wakes are unreliable on laptops. Design for "publish at the next opportunity within X hours, else ask". The simplest reliable alternative is to publish at approval time when the owner is at the Mac. Claude Desktop local scheduled tasks skip runs while asleep, give only one catch-up run, and should not be used for exact-time publishing.

### Cited Findings
- **launchd vs cron:** the launchd.plist man page (quoted on Apple's forum) says: "Unlike cron which skips job invocations when the computer is asleep, launchd will start the job the next time the computer wakes up". The same thread notes a job did not run after a full shutdown — [Apple Developer Forums thread 52369](https://developer.apple.com/forums/thread/52369)
- **Lid state (Feb 2026 thread):** with the lid **open** while asleep, launchd may start the job during a DarkWake and the job can be suspended until full wake. With the lid **closed**, the job does not run until the lid opens. This applies on macOS 26, 15, 12 and earlier. Apple DTS says launchd "makes no guarantees" about the power state when it starts a `StartCalendarInterval` job — [Apple Developer Forums thread 815034](https://developer.apple.com/forums/thread/815034)
- Older launchd-dev reports say `StartInterval` jobs could be missed after sleep, while `StartCalendarInterval` did not have this problem — [launchd-dev mailing list](https://lists.macosforge.org/pipermail/launchd-dev/2012-October/001029.html)
- **pmset:**
  - Syntax: `sudo pmset repeat wakeorpoweron MTWRFSU 7:00:00`; check with `pmset -g sched`; cancel with `sudo pmset repeat cancel`. New repeat events overwrite earlier ones — [Wikipedia: pmset](https://en.wikipedia.org/wiki/Pmset)
  - User reports of scheduled wakes failing from deeper sleep exist, e.g. Sequoia 15.6 on an Intel MacBook Pro — [Apple Discussions JP](https://discussionsjapan.apple.com/thread/256125968)
  - A blog recommends `pmset` wake a few minutes before the job and wrapping the job in `caffeinate` — [josephspurrier.com](https://www.josephspurrier.com/macos-sleep-cron)
- **Claude Desktop local scheduled tasks:**
  - They run only while the app is open and the computer is awake; "If your computer sleeps through a scheduled time, the run is skipped".
  - On wake, exactly one catch-up run for the most recent missed time within 7 days.
  - "Keep computer awake" prevents idle sleep, but closing the lid still sleeps.
  - Task prompts are stored in `~/.claude/scheduled-tasks/<name>/SKILL.md`.
  — [Claude Code docs: Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)
- **Cloud routines** run without the machine but use a fresh clone with no local files — [Claude Code docs: Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks). That conflicts with "local-only" and would need secrets in the cloud.
- **Instagram API constraints for scheduling:**
  - No scheduling parameter is documented; the app must schedule by itself.
  - Containers not published within **24 hours expire** (`EXPIRED`); poll `status_code` about once per minute for at most 5 minutes.
  - With Instagram Login, media must be at a **publicly accessible URL** (`image_url`/`video_url`) when the container is created. Resumable upload of local files is only for Facebook Login apps.
  - Limit: 100 API-published posts per moving 24 h (carousel = 1), checkable via `GET /<IG_ID>/content_publishing_limit`. The same page also says 50 in its carousel section, a conflict.
  — [Meta: Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
  - A third-party error guide cites a 25/day limit (code 9, subcode 2207042) — [ContentStudio](https://docs.contentstudio.io/article/1239-instagram-errors) (older/secondary)

### Inferences
- **Recommended publisher design:**
  1. A `~/Library/LaunchAgents/cz.myspeedpuzzling.ig-publisher.plist` (user agent, not a root daemon) with `StartCalendarInterval` entries every 15 minutes, or at the fixed slot times plus a few catch-up times. Point `ProgramArguments` at `/usr/bin/caffeinate -i <repo>/scripts/publish_due.sh`. The plist lives outside the repo or is committed as a template with no secrets. Logs go to `content/logs/` (gitignored).
  2. `publish_due.py` steps:
     - Take a lock file.
     - Load approved drafts with `schedule_at <= now`.
     - Skip any already in SQLite `publish_log` as published.
     - If more than **N hours late** (e.g. 6 h; configurable per pillar, since time-sensitive results posts go stale), set `status: needs_reschedule` and send a macOS notification instead of publishing.
     - Upload media to the public temporary host.
     - Create the container and record its id immediately, poll status, then `media_publish`.
     - Record `ig_media_id` and permalink, then delete the temporary public copy.
     - On a retry, reuse an existing unexpired container rather than creating a duplicate.
  3. Also run `publish_due.py` from the review UI on startup and on "Approve" when `schedule_at` is in the past or now. If the Mac is closed at slot time, the post goes out when the lid next opens, within the lateness window.
  4. Optionally add `pmset repeat wakeorpoweron` about 2 minutes before the main daily slot, needing sudo once. Treat it as best-effort: it does not help with the lid closed on battery.
- **Simplest reliable mode** (recommended to start): "approve = publish now" or "approve + pick time while I'm at the Mac". Most MSP posts are not minute-sensitive. Add launchd scheduling later.
- **Public media URL** is the real blocker for "local-only". With Instagram Login the Mac must expose each JPEG at a public HTTPS URL for a few minutes. Options:
  - upload to existing MSP web storage or an object bucket and use a short-lived signed URL (bucket credentials go in `.env`)
  - a temporary tunnel to a local static server (e.g. Cloudflare Tunnel)
  - The owner's verified flow presumably already solves this; document it in `CLAUDE.md` without credentials.
- **Manual fallback:** if the Mac is unavailable for days, schedule the approved JPEGs and caption by hand in Meta's own tools (Meta Business Suite or the IG app's scheduling). The local pipeline should then record the post as published once it shows up in the media list.

### Gaps
- Behavior of Apple Silicon MacBooks with `pmset` scheduled wake while the lid is closed on battery was not confirmed by any official source.
- Whether Meta Business Suite / Instagram in-app scheduling is still available and its current limits (October 2026) were not verified in this research.
- The exact behavior of launchd catch-up after multiple missed `StartCalendarInterval` slots (coalesced into one run or several) was not verified; reports suggest coalescing.

---

## 7. Learning loop: insights, pillar comparison, editorial memory

### Takeaway
Pull per-media insights at about 48 h and about 7 days (and optionally 30 days) after publishing via `graph.instagram.com` with `instagram_business_manage_insights`, store snapshots in SQLite, and aggregate by pillar, format and slot. Keep a small set of Markdown memory files that every drafting skill reads first. Use `views`, `reach`, `saved`, `shares`, `likes`, `comments`, `follows` and `profile_visits`; `impressions` is deprecated for new media.

### Cited Findings
- **Media insights metrics** (Instagram Login, v25.0 reference):
  - `comments`, `likes`, `reach` (estimated), `saved`, `shares`, `views` (in development), `total_interactions` (in development), `reposts`, `follows`, `profile_visits`, `profile_activity`
  - Reels: `ig_reels_avg_watch_time`, `reels_skip_rate`
  - Stories: `navigation`, `replies`, `link_clicks`
  - `impressions` is deprecated for media created after 2 July 2024.
  - Insights are not available for individual media inside an album (carousel children).
  — [Meta: Media Insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/)
- **Data timing and retention:**
  - Data can be delayed up to **48 hours** and is stored up to **2 years**.
  - Story metrics are available for only **24 hours**, and story metrics under 5 return error code 10.
  - Unavailable data returns an empty set, not 0.
  - With Instagram Login, host `graph.instagram.com`, permissions `instagram_business_basic` + `instagram_business_manage_insights`, and **insights webhooks are not supported**, so polling is required.
  — [Meta: Media Insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/)
- Graph API v22.0 (Jan 2025) introduced `views` and deprecated `impressions`, `plays`, `clips_replays_count` and `ig_reels_aggregated_all_plays_count` for all versions as of 21 April 2025 — [Meta: Graph API v22.0 changelog](https://developers.facebook.com/docs/graph-api/changelog/version22.0)
- Account-level insights list `saves` and `shares` that can be broken down by media product type — [Meta: Account Insights](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)

### Inferences
- **Schedule:** the same launchd agent (or a daily one) runs `pull_insights.py`, fetching for each published media whose age has crossed 48 h, 7 d or 30 d and that has no snapshot for that bucket. Stories, if used, must be pulled within 24 h (e.g. at +20 h).
- **Comparable KPIs** for a small account:
  - `views` and `reach` (distribution)
  - saves/reach and shares/reach (value/virality)
  - (likes+comments)/reach (engagement)
  - follows (growth)
  - Compare by pillar, format (carousel vs single vs reel), posting weekday and hour, and caption length bucket.
  - Use medians, because a single viral post skews means.
- **Editorial memory files** (committed, sanitized):
  - `editorial/brand-voice.md`: tone, language rules, emoji and hashtag policy, banned phrasing.
  - `editorial/pillars.md`: pillar definitions, target mix, example posts.
  - `editorial/learnings.md`: auto-appended by `/ig-insights` with dated bullet points ("2026-10: carousels with leaderboard data get 2× saves of single images; n=6"). Claude rewrites the top "current beliefs" summary monthly.
  - `editorial/rejected-ideas.md`: appended by the UI on reject (idea gist, reason category, owner's note). Claude must check it to avoid re-proposing.
  - `editorial/posting-calendar.md`: cadence, fixed slots, recurring series.
  - Keep the files short, and have skills inject only summaries (`` !`python scripts/insights_summary.py --last 60d` ``) to save context.
- **Privacy in learnings:** write aggregated insights without member names. A post's permalink is public, so referencing it is fine. Raw data snapshots stay in `content/`.

### Gaps
- Whether `views` and `total_interactions` (still "in development") return reliable values for all feed media under Instagram Login as of October 2026 needs a live test.
- Carousel per-slide performance is not available via the API (album children have no insights), so slide-level learning is limited to the whole post.

---

## 8. Secrets hygiene (and personal-data hygiene) for a public repo

### Takeaway
Use layered defenses:
1. `.gitignore` plus a committed `.env.example`.
2. Claude Code `deny` rules for `.env*`, with the **sandbox enabled** because deny rules do not stop arbitrary subprocesses from reading files.
3. A `PreToolUse` hook that blocks `.env` access.
4. A pre-commit secret scanner (gitleaks and/or trufflehog).
5. GitHub push protection, free for public repos.
6. Optionally keep real secrets out of `.env` entirely with 1Password `op://` references and `op run`.
7. Redact tokens from logs.

Treat community personal data like secrets: never in tracked paths.

### Cited Findings
- **Claude Code deny rules:**
  - Settings example: `"deny": ["Read(./.env)", "Read(./.env.*)"]` — [Claude Code docs: Settings](https://code.claude.com/docs/en/settings)
  - Read/Edit deny rules apply to Claude's file tools, to recognized Bash file commands (`cat`, `head`, `tail`, `sed`, `tee`) and to redirection targets. They **do not apply** to commands that read files without naming them (`grep -r pattern .`) or to "arbitrary subprocesses that read or write files indirectly, like a Python or Node script". For OS-level enforcement, enable the sandbox.
  - `.claudeignore` has no effect.
  - `deny` and `ask` rules apply immediately, even before folder trust.
  — [Claude Code docs: Permissions](https://code.claude.com/docs/en/permissions); [Settings](https://code.claude.com/docs/en/settings)
- **Sandbox and hooks:**
  - Sandboxing gives OS-level filesystem and network restrictions for Bash, PowerShell and Monitor commands and their child processes. Use it together with permissions for defense-in-depth against prompt injection — [Claude Code docs: Permissions](https://code.claude.com/docs/en/permissions)
  - The documented `PreToolUse` hook pattern blocks edits to `.env` with exit code 2 — [Claude Code docs: Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- **`.claude/settings.local.json`** is auto-added to global git excludes when Claude Code creates it; if created by hand, add it to `.gitignore` yourself — [Claude Code docs: Settings](https://code.claude.com/docs/en/settings)
- **gitleaks:**
  - pre-commit framework config: `repo: https://github.com/gitleaks/gitleaks`, `rev: v8.24.2`, hook id `gitleaks` (README example; newer versions likely exist).
  - `gitleaks git --pre-commit --staged` scans staged changes (`protect` is deprecated).
  - `.gitleaks.toml` can `[extend] useDefault = true` and add custom rules and `[[rules.allowlists]]`.
  — [gitleaks README via Context7](https://github.com/gitleaks/gitleaks/blob/master/README.md)
- **trufflehog:** pre-commit entry `trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail --trust-local-git-config` on stages `pre-commit` and `pre-push`. Docs advise separate `git add` and `git commit` and avoiding `git commit -am` — [trufflehog PreCommit.md via Context7](https://github.com/trufflesecurity/trufflehog/blob/main/PreCommit.md)
- **GitHub push protection:**
  - Free and generally available for all public repositories since 2023 — [GitHub blog](https://github.blog/news-insights/product-news/push-protection-is-generally-available-and-free-for-all-public-repositories/)
  - Reported as on by default for new public repos — [Microsoft Learn](https://learn.microsoft.com/en-us/training/modules/resolve-github-secret-scanning-alerts-github-copilot-agent/4-examine-github-push-protection)
  - Limits: it only works at push time and detects a limited set of token types, so a local pre-commit scanner is complementary — [GitGuardian blog](https://blog.gitguardian.com/github-push-protection-enhancing-open-source-security-with-limitations-to-consider) (vendor source)
- **1Password CLI:**
  - `op run --env-file=.env -- <cmd>` resolves `op://vault/item/field` references and passes the secrets only to the child process as env vars. It does not write them to disk and masks secrets in stdout/stderr by default.
  - Recommended practice: a dedicated vault plus a service account scoped to it.
  — [1Password: op run](https://developer.1password.com/docs/cli/reference/commands/run); [1Password: secret references](https://developer.1password.com/docs/cli/secret-references)
- **Headless runs and the API key:** `--bare` headless runs need `ANTHROPIC_API_KEY` or an `apiKeyHelper`, which is another secret to protect — [Claude Code docs: Headless](https://code.claude.com/docs/en/headless)

### Inferences
- **`.gitignore` baseline:**
  ```
  .env
  .env.*
  !.env.example
  *.pem
  *.key
  *.p12
  secrets/
  content/
  *.sqlite
  *.sqlite-*
  *.db
  logs/
  *.log
  .claude/settings.local.json
  **/render/
  **/data/
  screenshots/
  .DS_Store
  ```
  Commit `.env.example` with variable **names only** (e.g. `IG_USER_ID=`, `IG_ACCESS_TOKEN=`, `DB_DSN_READONLY=`, `MEDIA_BUCKET_*=`). The IG user id is not secret but need not be public either.
- **`.claude/settings.json` (committed):**
  - `permissions.deny`: `Read(.env)`, `Read(.env.*)`, `Read(./secrets/**)`, `Edit(.env*)`, `Bash(env)`, `Bash(printenv *)`, `Bash(op *)`, `Bash(security find-generic-password *)`
  - Enable the sandbox with `.env*` in its filesystem deny list. Verify the exact sandbox keys in the sandboxing docs, which were not fetched here.
  - Add the `PreToolUse` protect-files hook for `Read|Edit|Write|Bash` that matches `.env` or `secrets/`.
  - Scripts load secrets themselves (python-dotenv / `op run`), so Claude never needs to see values.
- **Token handling in code:**
  - Graph API calls commonly put `access_token=` in the query string. Redact `access_token=[^&\s]+` and `Bearer \S+` in every log line, exception message and saved HTTP response.
  - Never write tokens into `draft.yaml`, `state.sqlite` or Claude-visible output.
  - Store only token expiry metadata. Claude Code transcripts under `~/.claude/projects/` persist tool output locally, so any echoed token would persist there.
- **Long-lived Instagram token refresh:** run it as a script that writes the new token to the 1Password item or Keychain (e.g. `security add-generic-password -U`), never to a tracked file.
- **macOS Keychain** (`security find-generic-password -w -s <service>`) is a zero-dependency alternative to 1Password for a single Mac. This research did not verify it against Apple docs.
- **Screenshots:** the review UI never renders secrets, and preview screenshots shared in issues or PRs should come from the mockup only. The repo should have no `screenshots/` folder tracked, or have CI checks for EXIF/location data.
- **Personal data of community members:**
  - Keep DB extracts, names, results and photos in `content/` (gitignored).
  - The committed SQL files may reference column names but no values.
  - Example and test fixtures must use synthetic names.
  - Add a gitleaks custom rule or a simple pre-commit grep for known PII patterns (e.g. email regex) over tracked files.
  - Run `gitleaks git` over full history once before making the repo public, and periodically after that.
- **Defense against prompt injection from DB content:** user-generated text such as puzzle names or bios could contain instructions. The sandbox, deny rules, and keeping publish rights in a non-LLM script limit the blast radius.

### Gaps
- The Claude Code sandboxing settings schema (exact keys for filesystem read denylists) was not fetched in this round.
- Whether GitHub push protection detects Meta/Instagram access tokens (`IGAA…`-style Instagram Login tokens) out of the box was not verified. Add a custom gitleaks rule for that token prefix after checking the actual token format locally (never paste a real token anywhere).
- Apple's official documentation for the `security` CLI and Keychain best practices was not reviewed.
