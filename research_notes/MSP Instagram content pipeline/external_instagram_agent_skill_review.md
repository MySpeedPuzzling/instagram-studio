# Review: Jakeschincariol/instagram-agent-skill (checked 2026-10-18)

Repo: https://github.com/Jakeschincariol/instagram-agent-skill (MIT, v1.0, 2 commits, 13 Sep 2026).
13 Claude skills (Markdown prompts) plus 5 small Python scripts (standard library only, no network, no shell calls;
read in full before running). It never posts: every skill ends in a copy-paste block.

## Verdict: don't install it; borrow a few ideas into our own skills and lint

Why not as is:
- **Built for a different account.** It assumes a solo creator who talks on camera and sells something (offers, leads,
  keyword-DM funnels, "proof/opinion/offer" weekly mix, face in the first Story frame). We are a data-driven community
  brand with rendered carousels, a house style and no on-camera person.
- **Clashes with what we have.** Its `ig-plan` has the same name as ours; its `ig-caption` and `ig-carousel` rules
  conflict with our owner decisions (it wants 6–10 slides with a recap/CTA slide and a slide counter; it says "no link
  in the caption"; it writes state to `~/.claude/instagram/*.md` instead of our repo). Its humanizer rewrites curly
  quotes and the middle dot, which our renders use on purpose.
- **Weaker than our pipeline where they overlap.** Our `src/captions/lint.ts` already checks hook length, numbers in
  the hook, zero dashes, an emoji budget, banned words and CTAs, hashtag rules and length per format; the review app already
  shows the 125-character "… more" cut. Their checker missed the ask on our first post ("Which postcard have you
  done…?") because it only recognises marketing phrasings ("comment X", "save this").
- **Its own numbers say the hook scorer doesn't pick winners** (AUC 0.56 between a creator's hits and misses; useful
  only to catch obviously bad hooks).

Run on the first post's caption (2026-10-17 postcards): their caption lint REVIEW (no ask found = false negative;
"speed puzzling" not in the text = real finding), their AI-text score 74/100 PASS, our lint 0 errors / 0 warnings.

## Ideas worth taking (each small, in our own code and rules)

Done 2026-10-18: 1–3 in `src/captions/lint.ts` (+ tests), 4 in the `ig-insights` skill, 6 the profile check
(`profile_audit_2026-10-18.md`: 47 → 75/100). Open: 5 (with Reels publishing), 7 (reference only).

1. **Search-phrase check in `lint.ts`:** a post declares 1–3 phrases a puzzler would type ("speed puzzling",
   "500 piece puzzle"); the lint warns if they aren't in the caption text as words (hashtags and "MySpeedPuzzling"
   don't count). Their tool caught exactly this gap on post 1. Our playbook already asks for it; nothing enforces it.
2. **Invisible-character check in `lint.ts`:** fail on zero-width / format characters (U+200B–200F, 2060, FEFF, 00AD,
   E0000–E007F) that sneak in via copy-paste; cheap and unambiguous. Keep curly quotes (allowed in our house).
3. **Structural "AI tell" warnings:** "not just X, it's Y", "The result?" lines, rule-of-three triads. Add a few
   patterns from their `slop.json` `structures` block to our BANNED lists as warnings, not errors.
4. **`ig-insights` metrics:** rank posts by the *multiple over our own median* and by **sends per reach** and
   **follows per reach**, not raw views; separate "no reach" (hook problem) from "reach but no follows" (profile
   problem); state the sample size before claiming a pattern (we have 1 pipeline post + 71 historical).
5. **Reels, when we build them:** a beat-timing check (hook ≤ 3 s, no beat > 4 s without a frame change, loop back to
   the first frame) and their 9:16 safe zone (nothing above y 230 / below y 1440, right 230 px clear) to compare with
   our own Story/Reel band research. The 26 hook formulas are spoken-word templates; at most a reference.
6. **Profile check once:** their 12-part rubric (name field with searched words, bio line one, pinned three,
   highlights named by question, grid legibility) as a one-off audit of @myspeedpuzzling, not a skill.
7. **Comment-reply triage** (question worth a Reel reply / substance / support / noise) as a reference if we ever
   draft replies; replies stay owner-approved.

Not worth taking: keyword-DM funnels, cold outreach, engagement rounds on other accounts, the "humanizer" rewrite pass
(our voice rules + owner edits do that job better), scraping-style "viral" research.
