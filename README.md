# MSP Instagram

Turning [MySpeedPuzzling](https://myspeedpuzzling.com)'s community data into Instagram posts for
[@myspeedpuzzling](https://instagram.com/myspeedpuzzling). Claude Code proposes and drafts each post (facts,
caption, visuals); the owner approves, refines or rejects it in a faithful Instagram preview; only then does a
plain, deterministic script publish it.

Runs locally on one Mac. Built in public, so **no secret and no member data ever enters this repository**:
drafts, renders, caches and the state database live in gitignored folders.

## How it fits together

```
production DB (read-only role, over ssh) ──► queries/*.sql ──► content/cache (dated results)
                                                                   │
Claude Code: brainstorm → draft (facts, caption, alt text) ──► HTML/CSS/SVG templates
                                                                   │  Playwright → PNG → sharp JPEG
                                                                   ▼  (1440×1800, q93 4:4:4 + Instagram-simulated preview)
                                       content/drafts/<id>/ ──► review app (feed, grid, caption lint, decide)
                                                                   │ approved by the owner
                                         src/publish (no LLM) ──► R2 public URL ──► Instagram API
                                                                   │
                                   tools/insights.ts ──► content/state.sqlite ──► what works, what bores
```

- **Code owns every pixel that carries meaning.** Numbers, text, charts and puzzle pieces are rendered from code;
  pieces come from a jigsaw generator, so they interlock by construction.
- **QA before every capture:** type floors, safe areas (incl. the profile grid's 3:4 crop), WCAG contrast,
  tabular numbers, text overlaps, no emoji or blur.
- **Every run records the resources it used** (`content/runs.jsonl`, lab `runs.jsonl`); heavy jobs wait for a
  calm machine (`node tools/calm.ts`).

## Commands

| What | Command |
|---|---|
| Review app (drafts, design labs) | `node tools/review.ts` → http://127.0.0.1:4173/review (`--lan` for your phone) |
| Run a production query (cached) | `node src/data/db.ts <query-name> [--fresh]` |
| Design lab 1 renders + gallery | `node lab/dl1/run.ts [D1 D2 …]` |
| Lint a caption | `node src/captions/lint.ts caption.txt --pillar carousel` |
| Publish an approved draft | `node src/publish/publish.ts <draft-id>` (or "Approve and publish now" in the app) |
| Pull insights | `node tools/insights.ts` (`--summary` for medians by format) |
| Instagram token | `node tools/ig-token.ts status` / `refresh` |
| Calm-machine check | `node tools/calm.ts --need-gb 24` |
| Tests | `npm test` |

## Docs

- [`reports/`](reports/): the research behind the approach (strategy, visuals, API constraints, tooling)
- [`docs/decisions.md`](docs/decisions.md): the owner's decisions (they override the reports)
- [`docs/claude-code-skills.md`](docs/claude-code-skills.md): vetted Claude Code skills, plugins and MCP servers
- [`research_notes/`](research_notes/): the underlying research notes

## Setup

```sh
npm install
git config core.hooksPath .githooks   # secret guard (once per clone)
cp .env.example .env                  # fill in locally; .env is gitignored
node src/design/build-tokens.ts       # brand tokens + contrast gate
```

The pre-commit hook refuses staged `.env` files, any line containing a value from your local `.env`, literals
listed in the gitignored `.secret-patterns` file, and credential-shaped strings.

Third-party code and assets: Rubik (SIL OFL 1.1, `assets/fonts/rubik/OFL.txt`); jigsaw edge maths ported from
[Draradech/jigsaw](https://github.com/Draradech/jigsaw) (CC0); circle-flags (MIT).
