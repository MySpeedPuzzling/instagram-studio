---
name: ig-draft
description: Turn an approved idea into a reviewable @myspeedpuzzling draft (fresh facts, rendered slides, caption, alt text) or revise a draft from the owner's feedback. Use when asked to draft, build, render, revise or fix a post.
---

# Draft or revise a post

A draft is a folder `content/drafts/<id>/` (see `src/drafts/model.ts`): `draft.yaml`, `slides/`, `facts.json`,
`feedback.jsonl`. Drafts are local only (member data).

## Always first
Read `editorial/standing-feedback.md` (the owner's standing rules from every past review) and apply all of it to the
draft: design, data, captions. It overrides your defaults; `docs/decisions.md` has the detail behind each rule.

## New draft
1. **Facts:** re-run every query the post uses with `--fresh`; save the query results the post relies on into
   `facts.json` (name → result with `queried_at`; `{"no_data": true}` for posts without numbers). Every number on a
   slide or in the caption must come from it. Draft at most a day before the post goes out: the publisher refuses
   data older than 24 h (`MAX_FACTS_AGE_HOURS`), and the review app shows a red "Data is not fresh" panel.
   **Refresh** = re-run the queries, re-render the slides, re-check the caption numbers, bump the version.
2. **Visuals:** build slides in the house style (H4 in `src/design/house.ts`: poster first slide, H1 navy board for
   the rest; family builders in `lab/dl4/posts/` until promoted to `src/posts/`). Pair every key number with a visual
   (chart, board, box image, illustration). Render through `src/render/render.ts`
   (1080-wide CSS canvas → 1440×1800 JPEG + `.ig.jpg` preview). Fix every QA error; look at the previews
   yourself (contact sheet + full size) before showing anything. Puzzle pieces only from the generator.
3. **Caption and alt text, always:** every draft ships with a proposed caption and alt text per slide (the owner
   fine-tunes them in the review app). Follow the `msp-captions` skill; lint must be clean. Alt text from the facts.
4. **Featuring players:** only rows that pass the SQL visibility rules and `src/data/featuring.ts`
   (do-not-feature). Tags only for good news.
5. **Save** with status `in_review`, `caption_author: claude`, tags for learning (pillar, series, season, episode,
   mechanic, template, test arm). Tell the owner the review URL: `node tools/review.ts` →
   `http://127.0.0.1:4173/review/d/<id>`.

## Revise from feedback
1. Read unresolved entries in `feedback.jsonl` (after the last `resolved`).
2. Apply them as version N+1 (keep old slides in `slides/v<N>/` if visuals change). Never overwrite a caption whose
   `caption_author` is `human` unless the feedback asks for that exact change.
3. Append a `resolved` entry per item (author `claude`, what changed), set status `in_review`, bump `version`.
4. **Learn:** for each item decide whether it is a one-off fix or a rule for future posts (general wording like
   "always", "never", "in general", or the same note on an earlier draft). Add rules to `editorial/standing-feedback.md`
   (one line + source and date; edit a rule instead of contradicting it). When unsure, ask the owner once. Do the same
   for the owner's caption edits: compare their version with yours and record the pattern (word choice, length, tone).

## Never
- Publish. Only the owner's approval in the review app (or `src/publish/publish.ts <id>` run on their request)
  publishes.
- Run heavy jobs (ComfyUI, big Blender/video renders) without the owner's go-ahead and a passing
  `node tools/calm.ts`. Log resources for every lab or prototype run.
