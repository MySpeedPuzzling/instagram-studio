---
name: msp-captions
description: Write or revise Instagram captions and alt text for @myspeedpuzzling in the MSP puzzle-community voice, then lint them. Use whenever drafting, editing or reviewing a caption, hook, CTA, hashtags, @mentions or alt text for an MSP post or Story.
---

# MSP captions

**Tone in one line (owner, 2026-10-17): a friendly speed-puzzling community, heavily data-driven.** Read the
"Captions and voice" section of `editorial/standing-feedback.md` first: it holds the owner's rules from past caption
edits and overrides the playbook. When the owner edits a caption (`author: human`), compare it with your proposal and
add any reusable pattern there.

The full rules are the **MSP voice & caption playbook**, §9 of
`research_notes/MSP Instagram design and growth toolkit/captions_voice_hashtags.md` (voice principles, do/don't,
hashtag, emoji and tagging policies, CTA library, glossary, ten caption skeletons, checklist). Read §9 before the
first caption of a session. Owner decisions in `docs/decisions.md` override it.

## Every caption

1. **Hook first (≤ 125 characters):** the key number or surprise plus one phrase a puzzler would search
   ("solo 500", "500-piece puzzle time", "speed puzzling record").
2. **Then the human meaning** in one or two sentences: scope and date of the data, what it means for a normal
   puzzler. Pair any record with the median. Say "our guess" for explanations the data can't prove.
3. **One open question or one utility CTA** that matches the post's goal (sends, saves or comments). Never a
   fixed-token ask ("comment 🧩", "type YES", "tag 3 friends").
4. **Credits block** for featured players (only celebratory, only eligible handles: see the Featuring players
   rules in CLAUDE.md). **Never add hashtags** (owner rule 2026-10-17; the lint and the publisher reject them).
   Searchable words belong in the caption text itself (keywords are what Instagram search reads).
5. **Length:** carousel 300–800, single image 150–500, Reel 125–500 characters; never over 1,000.
6. **0–3 functional emoji** (⏱️ 🏆 🧩 flags), none at line starts. Zero dashes as punctuation. At most one "!".
7. **Alt text per slide** from the facts snapshot (the takeaway plus the key numbers), never from the image.

## Lint before showing a caption

```sh
node src/captions/lint.ts caption.txt --pillar carousel   # or single | reel | report | story
```

Fix every error. Treat warnings as questions: fix them unless there's a reason, and say the reason.
The lint doesn't check facts, tag eligibility or the human touch: verify numbers against the post's facts
snapshot, and leave room for the owner's edit (saved as `author: human`, never overwritten).
