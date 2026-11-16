# MSP music style system (plan, 2026-11-16)

Owner, after lab MU1: the sound quality of ACE-Step XL is good; what's missing is the **style and the "hit"**: the
right energy per post type and music that lands on the video's moments. The owner is not a sound person: **Claude
proposes the styles and writes the prompts; the owner only judges by ear** (Works / Unsure / No-go, short notes).

## What we learned in MU1 (34 clips)

- XL ≫ turbo. Seeds are just random variations (s202 isn't a model): keep the seeds that work, they reproduce.
- The ask on almost every clip: the drop and the ending must hit the video. Done by hand for week 46 (fit2).
- Liked: clean "data" electronic, cozy lo-fi, playful pizzicato/marimba. Out: celebratory pop. Ticking/stopwatch:
  good, but for countdown/tension posts, not recaps.
- The beds came out in other keys than asked (week 46: D major instead of G major): don't rely on the key setting.
- My added "descending notes" ending (fit3) missed what the owner meant: endings should come from the model.

## Levers we haven't used yet

1. **Structure tags in the lyrics field** (ACE-Step's strongest control, per its tutorial): for instrumentals we sent
   only `[Instrumental]`. Instead describe the arc, e.g.
   `[Intro - sparse, soft plucks]` → `[Build]` → `[Drop]` → `[Outro - calm, slowing, melody descends]`.
   This is how to ask for "a calmer ending with a few tones going lower".
2. **Section lengths from the video's timeline:** the motion code knows the key moments (weekly Story: poster lands
   3.6 s, cue 13.4 s, end). Generate a bed whose sections roughly match, then fit precisely (drop on the key moment,
   outro on a downbeat), as with fit2.
3. **Repaint the ending** (regenerate only the last 3–4 s with an `[Outro - calm ...]` brief); watch the known
   loudness-jump bug and re-level the seam.
4. **A house sound:** 2–3 fixed signature instruments (e.g. soft plucks + felt piano + light wood percussion) that
   appear in every bed, so MSP sounds like MSP across moods; later a short 1–2 s sound signature at the end.
5. **LoRA on our own approved beds** (later): once ~20 beds are approved, train a small MSP style LoRA so new beds
   stay in the house sound (LoRA training on Mac is still immature).

## Next lab: MU2 "find the house sound" (needs the owner's go-ahead: heavy job, Docker off)

- 3 style directions × the weekly-Story arc (structure tags) × XL × 3 seeds ≈ 9–12 clips, each auto-fitted to the
  week-46 Story so they're judged in context. Directions to propose: (A) "data" electronic refined (the winner),
  (B) cozy felt-piano + soft beat, (C) playful marimba/pizzicato, all with the same signature instruments.
- Then the owner picks one house sound per post type: weekly recap, data Reel, launch/feature Reel, countdown.
- Write the result into `editorial/standing-feedback.md` ("Music beds") as prompt templates per post type.
