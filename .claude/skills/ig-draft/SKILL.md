---
name: ig-draft
description: Turn an approved idea into a reviewable @myspeedpuzzling draft (fresh facts, rendered slides, caption, alt text) or revise a draft from the owner's feedback. Use when asked to draft, build, render, revise or fix a post.
---

# Draft or revise a post

A draft is a folder `content/drafts/<id>/` (see `src/drafts/model.ts`): `draft.yaml`, `slides/`, `facts.json`,
`feedback.jsonl`. Drafts are local only (member data).

## New draft
1. **Facts:** re-run every query the post uses with `--fresh`; save the rows the post relies on into `facts.json`.
   Every number on a slide or in the caption must come from it.
2. **Visuals:** build slides with the chosen house direction's components (design lab decision in
   `docs/decisions.md`; templates in `lab/` until promoted to `templates/`). Render through `src/render/render.ts`
   (1080-wide CSS canvas → 1440×1800 JPEG + `.ig.jpg` preview). Fix every QA error; look at the previews
   yourself (contact sheet + full size) before showing anything. Puzzle pieces only from the generator.
3. **Caption and alt text:** follow the `msp-captions` skill; lint must be clean. Alt text per slide from the facts.
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

## Never
- Publish. Only the owner's approval in the review app (or `src/publish/publish.ts <id>` run on their request)
  publishes.
- Run heavy jobs (ComfyUI, big Blender/video renders) without the owner's go-ahead and a passing
  `node tools/calm.ts`. Log resources for every lab or prototype run.
