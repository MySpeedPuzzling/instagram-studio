# Sound pipeline: music + reactive sound effects for every Reel and Story (plan, 2026-11-18)

Goal (owner, 16–18 Nov): Reels and Stories that go out with their sound already in the file, tailored to the video,
with as little hand work as possible: a bed in the house sound that **hits** the video's moments, sound effects that
**react precisely** to what happens on screen (comic timing for humour clips), and a fixed MSP signature. The owner
judges by ear; Claude proposes styles and writes the prompts. No credit anywhere (decisions 2026-11-16).

Research behind it: `reports/Automated Reels and Stories audio.md`, `reports/Local audio models and practice.md`, and
the notes in `research_notes/Local audio models and practice/` (house sound + ACE prompting, reactive SFX + comic
timing, trending Reels music styles).

## How it fits together

```
motion builder (src/motion/*)          kit helpers + builder cue() calls
        │  render / --qa-only          → <video>.cues.json  (lands, impacts with strength, counts, slot stops,
        ▼                                 whooshes, the `key` moment, `outro`, comic beats: bonk, peel, fail …)
cues ──► lab/sfx/plan.py  (style recap | comic)  → SFX plan: which sound, when, how loud, pitch, take; music gaps
                                     ▲ kit: content/labs/FX1/kit (code-made UI + comic sounds; later owner foley,
                                       Freesound CC0, MOSS puzzle sounds)
bed library (ACE-Step XL, overnight) ──► lab/music/fit.py  ── drop on `key`, the song's own outro joined on a downbeat,
                                        last frame held for the sticker, SFX mixed, music dipped under hits and
                                        stepped back before punchlines, two-pass −14 LUFS + true-peak limiter
                                     ──► final MP4 + .fit.json (what was used: provenance for any claim)
```

Built in the 18 Nov lab night: the cue recorder (`src/motion/kit.ts`, `render.ts`), comic cues in the pile-of-shame
and Unlucky 13 Reels, `lab/sfx/{synth,plan,signature,moss_gen,cues-for,gallery}`, `lab/music/fit.py`, the MU2/MU3
grids. Labs: **FX1** (sound effects, signatures, comic), **MU2** (house sound), **MU3** (trend flavours).

## What's still needed for autonomous deliveries

1. **Owner picks** (labs): one house direction per post type (MU2), which trend flavours to keep (MU3), the
   signature (FX1 S1–S5), recap vs comic SFX levels. Then they become fixed templates in
   `editorial/standing-feedback.md` → "Music beds".
2. **Bed library:** overnight XL batches per post type (8–12 approved beds each, rotating 3–4 per series), each
   approved by ear once; stored with prompt/seed/model (provenance) and its analysis (tempo, drop, outro, key).
   Picking a bed per post = rotation + the fitter's quality (drop strength, outro found, no clipping).
3. **Real puzzle foley** (biggest quality jump for humour clips): a 20-minute owner recording session (recipe
   below) or the MOSS candidates if they pass. Code-made sounds are fine for UI events, cheap for physical ones.
4. **Every builder logs its moments** (`cue('key')`, `cue('outro')`, comic beats): a short checklist item for new
   motion builders, plus `node tools/motion.ts … --qa-only` writing cues next to the video (done).
5. **`tools/motion.ts` gets `--sound <bed|auto> --sfx recap|comic`** so a draft's video comes out finished; the
   review app shows it with a "sound" row; QA checks loudness, true peak, silence at the start, ending on the frame.
6. **Reels by API** (`src/publish`: `media_type=REELS`, cover, share_to_feed, trial_params): then an approved Reel
   needs no phone at all. **Stories stay manual** (stickers can't be added by any API), but the phone step shrinks
   to "post the file, add the sticker" (no music step).
7. Insights: log `audio_recipe` + `sfx_style` per post, so the weekly review can compare house vs flavour beds.

## Owner foley session (optional, ~20 min, best value for humour clips)

iPhone, Voice Memos (Lossless, Enhanced Recording off) or a WAV recorder app with auto-gain off, Airplane mode on;
the quietest soft room; phone on a towel 10–20 cm from small sounds, 30–50 cm from pours; 10–20 takes of each with a
second of silence between; 10 s of room silence at the start. Shot list: a single piece pressed into place (2–3
brands), a piece slid across the board, a handful dropped on a pile, a full box poured (500 and 1000), a closed box
shaken, the lid off and on, the speed-puzzling timer's start/stop button, a pile of boxes toppling (gently!). Send
the files; Claude trims, levels and catalogues them. They belong to the owner: no licence question, no credit.

CC0 starting points on Freesound (download originals by hand; the API terms don't allow bulk use): 557755 (box
tipped out, sorting, assembling; verified CC0), 170771–170775 (pieces, box, lid; check each page's licence),
802611 / 880096 / 685968 (cardboard box shakes). Vine boom: only the original from its maker (free, no credit),
never committed to the repo.
