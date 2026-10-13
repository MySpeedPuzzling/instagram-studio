# MSP Instagram

Turning [MySpeedPuzzling](https://myspeedpuzzling.com)'s community data into Instagram posts for
[@myspeedpuzzling](https://instagram.com/myspeedpuzzling): Claude Code proposes and drafts each post
(facts, caption, visuals), a human approves, refines or rejects it in a faithful Instagram preview,
and only then does a plain script publish it.

Runs locally on one Mac. Built in public, so **no secret ever enters this repository**.

## Status

Research phase. Start with the report:

- [`reports/MSP Instagram content pipeline.md`](reports/MSP%20Instagram%20content%20pipeline.md):
  strategy, visual approach, API constraints, architecture, roadmap and open decisions
- [`research_notes/MSP Instagram content pipeline/`](research_notes/MSP%20Instagram%20content%20pipeline/):
  the nine underlying research notes (Instagram API, growth strategy, account audit, MSP data and
  content ideas, local and hosted image generation, programmatic design and motion, review UI and
  orchestration, lessons from the MSP badge lab)

## Setup

```sh
git config core.hooksPath .githooks   # enable the secret guard (once per clone)
cp .env.example .env                  # fill in locally; .env is gitignored
```

The pre-commit hook refuses staged `.env` files, any line containing a value from your local `.env`,
literals listed in the gitignored `.secret-patterns` file, and credential-shaped strings
(DB URLs with passwords, Meta tokens, API keys, private keys).
