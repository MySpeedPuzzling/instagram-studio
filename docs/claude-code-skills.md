# Claude Code skills, plugins and MCP servers: vetted shortlist

*Researched 2026-10-13. Nothing has been installed. Every version, commit and star count below is as of that date.*

For each candidate we read the SKILL.md and every bundled script and reference (long data files were grepped),
plus plugin manifests, hooks and MCP configs. We searched them for remote fetches, telemetry, credential access,
publishing and prompt-injection wording. Clones went into a scratch directory and nothing from them was executed.

**Ignore the registry's popularity numbers.** skills.sh install counts come from an unauthenticated GET that the
`skills` CLI sends on every install (`src/telemetry.ts` in `skills` 1.7.2), so anyone can inflate them. Some star
counts also look inflated: 278k stars in 9 months for an individual's mega-bundle, and 100k stars in 8 months for
a new org. We judged on content, owner and maintenance instead.

## Summary

- **Now:** install nothing. Harden the ComfyUI MCP that is already configured (see [Security notes](#security-notes)).
- **Write our own small project skills first.** The project's research already beats any generic skill on voice
  and house style. Plan: `msp-captions` (voice playbook plus a deterministic lint), `msp-carousel-style`
  (1080×1350 type scale, tokens, chart rules) and later `msp-piece-render` (headless Blender recipe). Borrow from the
  MIT/Apache sources marked "borrow" below, with attribution.
- **When a phase starts:**
  - motion: HyperFrames
  - Blender: the official Blender Lab MCP
  - captions: humanizer
  - tokens: better-colors
  - ComfyUI: evaluate Comfy-Org's official MCP
  - insights dashboard: Grafana skills and MCP, only if Grafana is chosen

## Shortlist (priority order)

Licences come from each repo's LICENSE file. "Pin" is the commit or version that was reviewed.

| # | Skill / plugin / MCP | Source, pin | Licence | What it gives us | Phase | Verdict | Install (project-scoped) |
|---|---|---|---|---|---|---|---|
| 1 | **HyperFrames** plugin (21 skills) | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), official HeyGen, 62k★; reviewed `e8eb358` (v0.8.152). Anthropic's marketplace pins `8d2b6e7` (v0.8.61) | Apache-2.0 | HTML+GSAP → MP4 with lint/check rules. Skills: `motion-graphics` (stat hits, kinetic type), `dataviz-countup` blueprint, `general-video` (recaps), `product-launch-video` / `faceless-explainer` (feature explainers) | Motion, feature videos | **INSTALL WHEN PHASE STARTS**, with the env and rules in [Security notes](#security-notes) | `claude plugin install hyperframes@claude-plugins-official --scope project`, or a self-pinned marketplace ([Install mechanism](#install-mechanism)) |
| 2 | **Blender Lab MCP** (official) | [projects.blender.org/lab/blender_mcp](https://projects.blender.org/lab/blender_mcp), Blender Foundation lab; `dbbf836`, v1.0.3 | GPL-3.0-or-later | bpy API docs matched to Blender 5.x, code execution in a background Blender, thumbnail renders. Localhost only, no telemetry | Blender (look-dev; production renders stay committed `blender -b -P` scripts) | **INSTALL WHEN PHASE STARTS** | Add-on from the `lab.blender.org` extensions repo, then `claude mcp add --scope project blender -- uvx --from "git+https://projects.blender.org/lab/blender_mcp.git@dbbf836ad4b1025f14a2b3b504c43903f39e0b04#subdirectory=mcp" blender-mcp` (needs `uv`) |
| 3 | **humanizer** skill | [blader/humanizer](https://github.com/blader/humanizer), 56k★, `225a6f3` (v3.1.0) | MIT | 26 AI-writing tells, strongest first, each with a before/after. Tracks Wikipedia's "Signs of AI writing". Has a no-invention rule (no new facts or numbers) and treats input text as data, not instructions | Captions, on-slide copy | **INSTALL WHEN PHASE STARTS**. Our zero-dash rule overrides its §8, which keeps dashes when a writing sample uses them | `npx -y skills@1.7.2 add blader/humanizer#225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8 --skill humanizer -a claude-code --copy -y` |
| 4 | **ComfyUI MCP** (already configured globally) | [artokun/comfyui-mcp](https://github.com/artokun/comfyui-mcp), one author, 817★; npm `comfyui-mcp` 0.52.205 (`6ad6fc0`). In "limited maintenance" | MIT | Workflow build, validate, enqueue, history, `clear_vram`, system stats | ComfyUI | **KEEP, HARDEN NOW**; replace with #5 if that passes the lab | Pinned command in [Security notes](#security-notes), `--scope local` (needs a local path) |
| 5 | **comfy-mcp** + comfy-cli (official Comfy-Org) | [Comfy-Org/comfy-mcp](https://github.com/Comfy-Org/comfy-mcp), 275★, PyPI 0.10.0; comfy-cli 1.22.0 | AGPL-3.0-or-later or commercial (comfy-cli: GPL-3.0); fine for local use | About 40 tools. Installs, restarts and credit spend need an MCP confirmation that no env setting can pre-approve. No telemetry of its own | ComfyUI | **INSTALL WHEN PHASE STARTS** (evaluate as #4's replacement) | Dedicated venv: `pip install comfy-mcp==0.10.0 comfy-cli==1.22.0`, then `claude mcp add --scope local comfy -e DO_NOT_TRACK=1 -- <venv>/bin/comfy-mcp` |
| 6 | **better-colors** (+ optional **better-typography**) | [jakubkrehel/skills](https://github.com/jakubkrehel/skills), 7.9k★, `4c66b1f` | MIT | OKLCH ramps with measurable rules, primitive vs semantic tokens, "measure the rendered pair" contrast checks, tabular numbers and size floors. Fits our DTCG tokens | Design system / tokens | **INSTALL WHEN PHASE STARTS** | `npx -y skills@1.7.2 add jakubkrehel/skills#4c66b1fa86e9ab70187b43d7da9b6fdb29f2ef63 --skill better-colors --skill better-typography -a claude-code --copy -y` |
| 7 | **frontend-design** | [anthropics/skills](https://github.com/anthropics/skills), official, `dbd4588` | Apache-2.0 (per-skill LICENSE.txt) | Plans the token system before building and lists five "AI default" looks to avoid. Web-framed, but the method carries over to templates. The owner's user-scope copy is an older text without that list | Design lab | **ALREADY AVAILABLE**; optionally take the newer text | `claude plugin install frontend-design@claude-plugins-official --scope project` |
| 8 | **dashboarding** + **datasources-provisioning** | [grafana/skills](https://github.com/grafana/skills), official Grafana Labs, `1ccacf2` | Apache-2.0 | Current dashboard JSON (schemaVersion 41, timeseries/stat panels) and provisioning YAML; the worked example is the Infinity datasource | Insights dashboard | **INSTALL WHEN PHASE STARTS, only if Grafana is chosen** | `npx -y skills@1.7.2 add grafana/skills#1ccacf29049fde66637fe01ab93a83a772da323b --skill dashboarding --skill datasources-provisioning -a claude-code --copy -y` |
| 9 | **mcp-grafana** (official) | [grafana/mcp-grafana](https://github.com/grafana/mcp-grafana), 3.6k★, v2.0.2 | Apache-2.0 | Dashboard search/get/patch, datasources, panel rendering. Read-only mode via `--disable-write`. No SQLite tool | Insights dashboard | **OPTIONAL, only with Grafana** (skill + HTTP API may be enough) | `claude mcp add --scope project grafana -e GRAFANA_URL=http://localhost:3000 -e 'GRAFANA_SERVICE_ACCOUNT_TOKEN=${GRAFANA_SERVICE_ACCOUNT_TOKEN}' -- uvx mcp-grafana@2.0.2 --disable-write --usage-stats=disabled` |
| 10 | **build-web-data-visualization** (OpenAI plugin) | [openai/plugins](https://github.com/openai/plugins), 7.4k★, `0722921` | MIT (declared in `plugin.json`; no top-level LICENSE) | The best chart-design references found: claim titles, direct labels, an annotation taxonomy, SVG crispness (`shape-rendering`, `vector-effect`), and a QA pass against "generic AI atmosphere". Tuned for 600–900 px web charts, so scale up for 1080 px | Carousel charts | **OPTIONAL, borrow**: it is Codex-format and its skills link files outside their folders, so copy 3–4 reference files into `msp-carousel-style` with attribution | n/a (borrow with attribution) |
| 11 | **playwright-cli** skill | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli), 14k★, `b85c7a7` (v0.1.22) | Apache-2.0 | Drives a browser from the shell. `show --annotate` lets the owner draw boxes and comments on a render | Design lab reviews | **OPTIONAL**. Its frontmatter pre-approves `Bash(playwright-cli:*) Bash(npx playwright:*)`, and it suggests `gh --attach` of screenshots, which our rules must forbid | `npx -y skills@1.7.2 add microsoft/playwright-cli#b85c7a736bb473bf55b584e54a09ffa698d6d871 --skill playwright-cli -a claude-code --copy -y` |
| 12 | **slop-guard** | [eric-tramel/slop-guard](https://github.com/eric-tramel/slop-guard), 166★, PyPI 0.5.0 | MIT | Deterministic AI-prose scorer (24 rules, no LLM, no network found), as a CLI or MCP. Noisy on texts under 1,000 characters | Caption lint (second opinion) | **OPTIONAL** | `uvx --from slop-guard==0.5.0 sg caption.txt` (run on demand, not installed) |
| 13 | **gsap-skills** (official GreenSock) | [greensock/gsap-skills](https://github.com/greensock/gsap-skills), 16k★, `aed9cfd` | MIT | Accurate GSAP timeline and plugin API. Overlaps HyperFrames' own GSAP adapters, and `autoAlpha` advice trips a HyperFrames lint rule | Motion | **OPTIONAL**, only if HyperFrames' GSAP notes prove thin | `npx -y skills@1.7.2 add greensock/gsap-skills#aed9cfd3277740755f6bfc1155c7aa645403b760 --skill gsap-timeline --skill gsap-plugins -a claude-code --copy -y` |
| 14 | **copywriting `references/ai-tells.md`** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills), 54k★, `28e4a81` | MIT | The best ban/cap word and pattern list for short copy; covers social posts. The skills themselves are SaaS landing-page oriented | Captions | **BORROW** into `msp-captions` with attribution; don't install | n/a |
| 15 | **remotion-best-practices** | [remotion-dev/skills](https://github.com/remotion-dev/skills), official, 5.1k★, `7ba4dcf` | No LICENSE in the skills repo; Remotion itself is source-available | High-quality Remotion guidance | Motion fallback only | **SKIP unless Remotion becomes the fallback**; never vendor | `npx -y skills@1.7.2 add remotion-dev/skills#7ba4dcf8ebe1626b00baa41e1f2478113719b60b --skill remotion-best-practices -a claude-code --copy -y` |

The `dataviz` skill already available in the owner's Claude Code setup covers chart form, colour validation and
mark specs. Several dataviz candidates below are skipped because they duplicate it. Context7 covers current
Observable Plot and D3 API docs.

## Skipped and why

**Design and social cards**
- **ui-ux-pro-max**, installed user-scope (v2.5.0, upstream 2.15.0). Disable it for this repo.
  - v2.5.0 hardcodes "React Native (this project's only tech stack)".
  - Its "Casual Puzzle Game" palette is pink/purple claymorphism, exactly the look the owner rejects.
  - Upstream 2.15 adds skills that send prompts to Gemini/MuAPI and load keys from `~/.claude/.env`.
- **impeccable** (pbakaus): good content, but heavy machinery.
  - The plugin registers SessionStart, PostToolUse(Edit|Write) and Stop hooks.
  - The skill alone tells the agent to run `scripts/impeccable context` every session. That launcher downloads a prebuilt binary from GitHub releases and the agent then follows the binary's output.
  - Telemetry is opt-out.
  - Read it for ideas only.
- **taste-skill** (design-taste-frontend, brandkit): aimed at landing pages. It says "Use organic, messy data (47.2%)", which would fabricate numbers in a data pipeline.
- **canvas-design, brand-guidelines, webapp-testing** (anthropics/skills):
  - canvas-design makes art posters and downloads fonts.
  - brand-guidelines is Anthropic's own brand.
  - webapp-testing is Python and tells the agent "DO NOT read the source" before running scripts.
- **baoyu-skills** (infographic, xhs-images, cover-image): render text and numbers with cloud image models and forbid SVG/HTML fixes. Sibling skills in the bundle auto-post to X, Weibo and WeChat.
- **guizang-social-card-skill**: AGPL-3.0, Xiaohongshu 3:4 format, CDN fonts at render time. Its image sourcing ("grab first, disclose after") is a copyright risk. Its overflow and density validator rules are worth re-implementing ourselves; don't copy its code.
- **Playwright MCP** and **Chrome DevTools MCP**:
  - Our render path is plain Playwright scripts, and Claude can read the PNGs.
  - The official plugin runs unpinned `@playwright/mcp@latest`.
  - Chrome DevTools MCP sends usage statistics by default.

**Data and insights**
- **knowledge-work-plugins `data-visualization`**: Python only, and duplicates `dataviz`. The `data` plugin form also registers 8 remote MCP connectors.
- **wshobson data-storytelling**: boilerplate for executive decks ("The data reveals…"), which is AI-sounding copy.
- **wshobson grafana-dashboards**: legacy `graph` panels and `yaxes`.
- **grafana promql and loki**: the owner decided on no traffic posts.
- **nexu-io d3-visualization**: a stub that tells the agent to `git clone` an unpinned 7-star repo.
- **markdown-viewer vega**: built for a Markdown viewer, not our output, and uses unpinned `npx`.
- **ggplot2, typst**: off-stack.
- **maragudk observable-plot**: no frontmatter, so it never triggers.

**Captions and copy**
- **proseify anti-prose-slop**: a novel-writing workflow that requires a paid remote MCP with a bearer key.
- **stop-slop**: written for essays; rules like "kill all adverbs" are too blunt.
- **vale-ai-tells**: built for technical docs (its own README says so) and needs Vale.
- **sergebulaev/instagram-skills**:
  - `lib/_env.py` uses `find_dotenv(usecwd=True)`, which would load this repo's `.env`.
  - Its caption skill publishes through a third-party SaaS.
  - It runs a custom poster via `subprocess`.
- **knowledge-work `marketing` and `brand-voice`**: generic, and add 13 and 6 remote MCP servers.
- **Other marketingskills** (social, content-strategy, marketing-psychology, image): SaaS-oriented. `social` recommends 1–2 feed posts a day and links publishing tools. `image` needs cloud API keys.
- **postiz** (in Anthropic's marketplace): social scheduling and publishing. That conflicts with "only the publish script publishes".

**Motion**
- **claude-code-video-toolkit ffmpeg**: a generic cookbook that Claude already knows; HyperFrames encodes.
- **ecc video-editing**: generic and cloud-tool based, with an outdated 1:1 Instagram spec. The `ecc` plugin would add 27 hooks and an MCP server.

**Blender, 3D and ComfyUI**
- **ahujasid/blender-mcp**:
  - Telemetry is on by default (Supabase).
  - Tool results tell the model to advertise "MCP for Blender Premium" (`premium_hint.py`).
  - A shared Hyper3D key is hardcoded (`RODIN_FREE_TRIAL_KEY`).
  - The published wheel contains a gitignored config file.
  - Its setup writes user-scope MCP config.
  - The official Blender Lab MCP (#2) covers the same need.
  - Note that the PyPI name `blender-mcp` belongs to this project, so never run `uvx blender-mcp`.
- **vladmdgolam blender-mcp skill**: outdated tool names; it is about glTF-for-web.
- **claudedesignskills blender-web-pipeline**: generated content whose script decimates every mesh.
- **threejs-skills**: no LICENSE file; generic cheat-sheets.
- **comfyui-expert**: archived, Windows paths, wrong node class names.
- **Comfy-Org/comfy-skills**: built for the paid Comfy Cloud.
- **Hosted creative services** (runway-api, superdesign, canva, adobe-for-creativity): cloud services, and off our local, deterministic path.

## Security notes

**General**
- **A skill is an instruction with the user's authority.** In a permissive permission mode, any command a skill tells the agent to run will run.
- **Skills can also run shell while loading:** `` !`cmd` `` in SKILL.md runs a command, and `allowed-tools` pre-approves tools. Plugins can add hooks and MCP servers.
  - None of the recommended skills use `` !`cmd` ``.
  - Set `"disableSkillShellExecution": true` in the project's `.claude/settings.json` anyway.
- **`DO_NOT_TRACK=1` turns telemetry off in several of these tools at once:** the skills CLI, HyperFrames, mcp-grafana and comfy-cli. Put it in the project `env` block of `.claude/settings.json`.
- **The skills CLI** (vercel-labs/skills 1.7.2, MIT):
  - Telemetry is on by default. It sends source, skill names and agents, plus search queries. Turn it off with `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1`.
  - For the `heygen-com`, `remotion-dev`, `vercel` and `vercel-labs` owners, it installs from a skills.sh cached snapshot instead of GitHub, unless a ref is given. Pinning `#<sha>` forces a git fetch of that exact commit.
- **Nothing may publish.** Forbid every route to publishing:
  - `hyperframes publish` and `hyperframes cloud`
  - playwright-cli's `gh --attach`
  - any skill that suggests Buffer, Typefully or Publora
  - "Never" means drafts also contain member data.

**HyperFrames** (checked in the CLI source)
- **Telemetry is on by default** and goes to PostHog. It covers commands, render and lint reports, the workflow name and an agent fingerprint.
  - The `hyperframes-cli` skill tells the agent to send `feedback --rating --comment` after every render, unless telemetry is off.
  - Set `HYPERFRAMES_NO_TELEMETRY=1` and `DO_NOT_TRACK=1`, using the value `1` exactly.
- **`hyperframes usage` reads the Claude Code login.** It reads the OAuth credential from the macOS keychain (`Claude Code-credentials`) or `~/.claude/.credentials.json` and sends it to Anthropic's usage endpoint (`utils/harnessUsage.ts`).
  - The router skill tells the agent to run it at the start of every video.
  - The token goes only to Anthropic, but a project rule should still forbid the command.
- **Standalone installs refresh skills globally.** They run an unpinned `npx skills add … --global --yes`.
  - `HYPERFRAMES_SKIP_SKILLS=1` stops that, but not `hyperframes skills update`, which the workflow skills tell the agent to run.
  - The plugin route avoids this: its wrapper pins the CLI to the plugin version, sets the skip/no-update flags and refuses the `skills` subcommand. Also set `HYPERFRAMES_NO_UPDATE_CHECK=1`.
- **Registry items are fetched from the `main` branch.** Pin the `registry` URL in `hyperframes.json` to a commit.
- **`media-use` can send search intents to HeyGen** when the `heygen` CLI is signed in. Prefer `--local-only`, with local TTS and transcription.
- **Project rules to adopt:**
  - never run `hyperframes usage`, `skills`, `cloud`, `publish` or `open`
  - always state 1080×1350 or 1080×1920 (the skills default social video to 1080×1080)
  - decide whether motion reuses the Plot SVG or rebuilds it: `data-in-motion.md` says "not D3"

**ComfyUI MCP (`comfyui-mcp`)**
- **The current global entry runs unpinned `npx -y comfyui-mcp`.** On top of that, the server upgrades itself (`npm i -g comfyui-mcp@latest`) unless `COMFYUI_MCP_AUTO_UPDATE_DISABLE=1` is set.
- **On load it installs a nightly custom node** (`comfyui-agent-panel`) into ComfyUI's `custom_nodes`. Set `COMFYUI_MCP_PANEL_AUTOINSTALL=0`, and check whether the panel is already there.
- **Its panel code can read and write `~/.claude.json`** and reads the Claude credential file.
- **`report_issue` is disabled in 0.52.205,** but the code that files public GitHub issues is still there.
- **Claude Code `permissions.deny` is not enough on its own.** The `call_tool` facade dispatches any tool by name and bypasses it. Restrict the server itself:

```sh
claude mcp add --scope local comfyui \
  -e COMFYUI_PATH=<local ComfyUI path> -e COMFYUI_MCP_AUTO_UPDATE_DISABLE=1 -e COMFYUI_MCP_PANEL_AUTOINSTALL=0 \
  -e COMFYUI_MCP_TOOL_DENY='runpod,runpod_watch,train_*,install_comfyui,install_custom_node,comfy_cli,node_pack,apply_manifest,apps,bisect,report_issue,list_api_nodes,workspace,panel_*' \
  -- npx -y comfyui-mcp@0.52.205
```

- **Mirror the deny list** as `mcp__comfyui__<name>` in the project `permissions.deny`.
- **Put heavy or mutating tools under `ask`,** since they need the owner's go-ahead anyway: `generate_image`, `enqueue_workflow`, `batch`, `download_model`, `list_packs`, `list_local_models`, `kitchen`, `restart_comfyui`, `call_tool`.
- **The preset `COMFYUI_MCP_TOOL_PRESET=safe` would also hide `clear_vram`,** which the quiet-hours runbook needs. Use the explicit deny list instead.

**mcp-grafana**
- Usage statistics have been on by default since v2.0.0 (2026-09-29). Pass `--usage-stats=disabled`.
- Use `--disable-write`, which also unregisters the raw SQL tool, and a Viewer-role service account.
- Keep the token as a `${VAR}` placeholder in the committed `.mcp.json`.

## Install mechanism

**Skills: the `skills` CLI, pinned twice**

- **What a project install does:** `npx skills add` without `-g` writes into the project, not your home directory.
  - `-a claude-code` targets `.claude/skills/<name>/`.
  - Without `--copy`, the canonical copy goes to `.agents/skills/<name>/` with a symlink from `.claude/skills/`. Use `--copy` to keep a single directory.
- **Always pass `-a claude-code`.** Without it, the CLI auto-detects every installed agent and writes into all of their folders.
- **Never use `-g`, `--all` or `--skill '*'`.**
- **Pin twice:**
  - the CLI version: `npx -y skills@1.7.2`
  - the source commit: `owner/repo#<40-char sha>`. A full SHA is fetched directly, bypassing the skills.sh snapshot path.
- **The lockfile.** The CLI writes `skills-lock.json` at the repo root, which is meant to be committed. Per skill it records `source`, `ref` (the SHA), `skillPath` and `computedHash` (SHA-256 over the skill's files).
- **Updating.** `skills update -p` keeps each entry's `ref`, so pinned skills don't move. To update:
  1. Read the upstream diff of the skill folder (`git diff <old>..<new> -- <skillPath>`).
  2. Re-grep it for the risk patterns above.
  3. Re-run `add` with the new SHA.
  4. Commit the lockfile change and update the table in this doc.
- **Restoring on a fresh clone.** `skills experimental_install`, which restores from the lockfile, installs only into `.agents/skills/`, which Claude Code does not read. Restore with a short script instead:
  1. Re-run `add` for each lock entry.
  2. Check that `computedHash` matches.

**Plugins (HyperFrames)**

- **Use the plugin route,** for the reasons in the HyperFrames security notes.
- **What project scope does:** `claude plugin install <plugin>@<marketplace> --scope project` records `enabledPlugins` in `.claude/settings.json` (committed). The files land in Claude Code's plugin cache, not in the repo.
- **Two ways to pin:**
  - **(a) `hyperframes@claude-plugins-official`.** Anthropic's marketplace pins a commit (`8d2b6e7`, v0.8.61). That marketplace auto-updates by default, so the pin moves when Anthropic bumps it.
  - **(b) A small marketplace committed in this repo.** One entry, `{"source": "github", "repo": "heygen-com/hyperframes", "sha": "<40-char sha>"}`, declared in `extraKnownMarketplaces`. Third-party marketplaces don't auto-update by default, so the version only changes when we edit the SHA. Check it with `claude plugin validate`.
- **HyperFrames ships several releases a day,** so bump deliberately.

**MCP servers**

- **Commit only portable servers:** `claude mcp add --scope project` writes the committed `.mcp.json`. Use it only for servers without local paths or secrets, and keep secrets as `${VAR}` placeholders.
- **Use `--scope local`** for servers that need a local path, such as ComfyUI.
- **Always pin:** `pkg@x.y.z`, `==x.y.z` or `git+…@<sha>`.

**Commit or gitignore third-party skills?** Don't vendor them into this public repo.

- **Commit:**
  - `skills-lock.json` (the manifest: source, SHA, path, content hash)
  - the restore script
  - this doc
  - our own `msp-*` skills
- **Gitignore** the third-party skill folders under `.claude/skills/` (and `.agents/`).
- **Why not vendor:**
  - Licences vary: Remotion is source-available, threejs-skills has no licence, guizang is AGPL, and some Anthropic document skills are proprietary.
  - Redistributing creates attribution duties (Apache-2.0 NOTICE, MIT copyright lines).
  - A vendored copy would look like an endorsement.
  - The SHA pin plus the content hash give the same reproducibility.
- **Exception:** short MIT/Apache excerpts we adapt into our own skills, for example from `ai-tells.md`, humanizer or the OpenAI chart references. Keep the copyright line, licence text, source URL and commit in a `NOTICE` file next to them.
