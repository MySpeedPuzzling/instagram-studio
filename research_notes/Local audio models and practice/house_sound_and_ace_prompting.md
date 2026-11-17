# House sound for MSP and how to prompt ACE-Step 1.5 for it (research, 2026-11-18)

Scope: sonic identity for @myspeedpuzzling short videos, plus ACE-Step 1.5 (XL) prompting for instrumental beds.
Inputs: `docs/ideas/music-style-system.md` (MU1 results, MU2 plan). Research only; nothing installed or generated.
Dates: sources from 2026 are marked; anything older is marked "(older)". Practical guides from third parties are
weaker than the official repo docs and are labelled as such.

## 1. ACE-Step 1.5 prompting for instrumentals (caption, structure tags, endings, duration, bpm/key, sampling, cover/remix)

### Takeaway
The official docs back the MU2 plan. For an instrumental, put only section tags with short descriptors in the
lyrics field (`[Intro - ambient]` … `[Outro - fade out]`) and no plain words. Put the full style in the caption.
Treat BPM and key as anchors, not commands. Endings come from a final `[Outro - …]` / `[Fade Out]` tag plus enough
duration for the planned sections. Repaint is the tool for fixing an ending, but it currently has a confirmed
loudness-jump bug.

### Cited Findings
**Caption**
- The official tutorial says the model accepts "simple style words, comma-separated tags, complex natural language descriptions", because it was trained to work with all of these. Specific wording works better than vague wording, and the caption should combine style, emotion, instruments, timbre, era, production and tempo/structure hints. Fewer details leave the model more freedom. — [ACE-Step 1.5 Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Tutorial: keep BPM, key and time signature out of the caption and use the dedicated parameters. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md); **contradicted by** a third-party guide (deAPI, 12 Jun 2026), which says to put `88 bpm` in the tags *and* set the bpm parameter, because matching values "tightens the rhythmic output". — [deAPI guide](https://deapi.ai/blog/ace-step-1-5-prompting-guide-how-to-write-tags-structure-lyrics-and-generate-better-music)
- deAPI also says "the model expects keywords": use 5–12 keywords, since more than 15 "start diluting each other". It recommends one primary genre plus at most one modifier, and named instruments ("grand piano", not "piano"). Contradictory tags (e.g. `lo-fi, hi-fi`) make the model "oscillate". This conflicts with the official claim that sentences work equally well. — [deAPI guide](https://deapi.ai/blog/ace-step-1-5-prompting-guide-how-to-write-tags-structure-lyrics-and-generate-better-music)
- Musicians' guide: write the caption like a brief to session musicians: genre, instruments, mood and production. Its example is "rock song with crunchy rhythm guitar, punchy snare, and gravelly male vocals". — [Musicians' guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)
- Tutorial pitfalls: "Models are not good at resolving conflicts". If the caption names violin and a lyric tag names electric guitar, output degrades. The same goes for metadata that conflicts with the caption (a caption of "slow ballad" with bpm=160). Clashing styles "easily lead to degraded output". — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Tutorial: "Especially when `thinking` mode is enabled, LM has weaker caption generalization than DiT." `thinking` (default True) lets the LM plan metadata and codes. CoT can rewrite the caption (`use_cot_caption`) even when thinking is off, unless disabled. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)

**Instrumental mode and structure tags**
- Tutorial: for a pure instrumental, use `[Instrumental]` in the lyrics. Alternatively, "use section tags to shape instrumental development", e.g. `[Intro - ambient]`, `[Main Theme - piano]`, `[Outro - fade out]`. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- The official tag set is: basic `[Intro] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Outro]`; dynamic `[Build] [Drop] [Breakdown]`; special `[Fade Out] [Silence]`. Descriptors attach with a dash: `[Chorus - anthemic]`. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Tutorial warning: don't stack descriptors (`[Chorus - anthemic - stacked harmonies - high energy - powerful - epic]`). The model may sing tag text as lyrics. "Keep structure tags concise; put complex style descriptions in Caption." — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- deAPI: "A marker with no text below it becomes an instrumental passage". `[build-up]` → `[drop]` → `[breakdown]` is "essential for electronic music". Writing "no vocals" in tags while also putting lyric text in the lyrics creates confusion, and the model may produce eerie wordless vocalisations, so "pick one approach and commit". A **`[chorus]` marker with no text can generate silence**: relabel it `[inst]`. — [deAPI guide](https://deapi.ai/blog/ace-step-1-5-prompting-guide-how-to-write-tags-structure-lyrics-and-generate-better-music)
- A model host also says to put only tags in the lyrics field, because plain words there can end up sung. — [cnaps.ai model page](https://cnaps.ai/models/Txt2Music-ACEStep15)
- Musicians' guide: `[Outro]` "winds the song down, often fades". A full roadmap tells the model how energy should change over the track. — [Musicians' guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)
- The model follows explicit ending tags. The official 1.5 demo song's lyrics end `[Outro - Guitar Riff] [abrupt silence]`, i.e. an abrupt stop was requested on purpose. — [ComfyUI issue #12269](https://github.com/Comfy-Org/ComfyUI/issues/12269)

**Duration**
- `duration` is a target, and "actual generation may vary slightly". Lengths of 30–60 s and 2–4 min are stable. The tutorial gives no rule for section count per duration. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- One host says requests under 10 s are generated at 10 s and cut. It also has an option to keep the model's natural ending (an outro, then a silent tail) instead of trimming to the exact length. — [cnaps.ai](https://cnaps.ai/models/Txt2Music-ACEStep15)

**BPM, key and time signature**
- BPM (30–300) is "an anchor, not a command": ask for 120 and you may get 118 or 122. Extreme values may be unstable. Common keys are stable, but "rare keys may be ignored or shifted". 4/4 is the most reliable time signature. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- MU1 locally: asked for G major, got D major (week 46). — `docs/ideas/music-style-system.md` (own result)

**Sampling and guidance**
- Defaults: `lm_temperature` 0.85 (lower is more conservative), `lm_cfg_scale` 2.0, `lm_top_p` 0.9, `guidance_scale` 7.0 (higher follows the prompt more but "may overfit"). The tutorial contradicts itself on whether guidance works only on Base or also on SFT; Turbo has no CFG. Fix the seed while tuning. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- deAPI (Base, CFG 3–20): 5–7 is "loose and musical", 10–12 "tracks your tags closely", and above 15 the output becomes rigid with artifacts. Base sweet spot is about 27 steps. Turbo is fixed at 8 steps and CFG 1. — [deAPI guide](https://deapi.ai/blog/ace-step-1-5-prompting-guide-how-to-write-tags-structure-lyrics-and-generate-better-music)
- Musicians' guide: "you should almost never generate just one version". Make batches of 2–4. Only one LoRA can be active at a time. Thinking mode is silently bypassed for Cover, Repaint and Extract. — [Musicians' guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)

**Reference audio, cover/remix and repaint**
- `reference_audio` controls global acoustics (timbre, mixing, performance style), not the melody. Audio under 30 s is repeated, and 10 s segments are sampled from the front, middle and back. `src_audio` with `audio_cover_strength` (0–1) carries structure: melody, rhythm, chords and orchestration. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Musicians' guide cover strengths: 0.3–0.5 for dramatic genre changes, 0.5–0.7 moderate, 0.7–0.9 subtle. Remix recipe: strength about 0.4, new caption, batch of 2–4. — [Musicians' guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md)
- A maintainer on issue #972 says cover "does not preserve the exact melody note-for-note". This is somewhat at odds with the tutorial's "melody, rhythm, chords". — [Issue #972](https://github.com/ace-step/ACE-Step-1.5/issues/972)
- deAPI: reference clips should be 5–60 s. Vocal-heavy or dense mixes backfire. — [deAPI guide](https://deapi.ai/blog/ace-step-1-5-prompting-guide-how-to-write-tags-structure-lyrics-and-generate-better-music)
- Repaint works on regions of 3–90 s at the start, middle or end, and can smooth joins between clips. — [Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- **Open bug, about Nov 2026:** repaint re-normalises the whole song, so the untouched audio gets quieter and there is a loudness jump at the edit. A user posted a patch. — [Issue #1374](https://github.com/ace-step/ACE-Step-1.5/issues/1374)
- Copyright: the model card claims training on licensed, royalty-free/public-domain and synthetic MIDI-rendered data, and says outputs may be used commercially. Code and weights are MIT. — [HF model card](https://huggingface.co/ACE-Step/Ace-Step1.5). Outside observers note the dataset is not published or verified. — [VI-Control thread](https://vi-control.net/community/threads/ace-step-1-5-do-we-now-have-an-ethically-trained-suno-at-home.170009/), [Aihola](https://aihola.com/article/ace-step-1-5-open-source-music). The repo itself lists "unintentional copyright infringement due to stylistic similarity" as an accepted risk. — [GitHub README](https://github.com/ace-step/ACE-Step-1.5)

### Inferences
- **Lyrics-field template for instrumentals (MU2):** tags only, one short descriptor each, no plain words, no `[Instrumental]` alongside sections. Example for the weekly Story arc:
  `[Intro - soft plucks]` `[Build]` `[Drop]` `[Breakdown - light]` `[Outro - calm, descending]` `[Fade Out]`.
  Keep descriptors to 1–3 words so they aren't sung or ignored. "melody descends" is a guess at a phrase the model knows; test "descending" vs "winding down" vs "fade out" as variants.
- **Caption style:** given the conflicting guidance, use a compact comma list of 8–12 items: genre + one modifier, 3 named instruments, 2–3 mood words, 1–2 production words. Don't use sentences. Test BPM in the caption both ways, since the official doc and deAPI disagree.
- **Endings:** ask for 20–30 % more duration than the video needs, so the model can finish its outro, then cut or fit on a downbeat in post. Never generate at under 10 s. Don't trim to exact length inside the generator.
- **Key:** don't rely on the key parameter. Detect each bed's actual key after generation, and transpose or choose the signature variant to match (see section 2).
- **Repaint:** usable for ending fixes, but re-level the seam manually or apply the #1374 patch locally (the patch is an untrusted zip, so it needs the owner's OK).
- **Thinking mode:** for tightly specified beds, try `thinking=False` or `use_cot_caption=False` so the LM doesn't rewrite the caption.
- **Cover/remix from commercial tracks:** avoid it for MSP. Use it only with our own approved beds as `src_audio`/`reference_audio`, which also gives house-sound consistency without a LoRA. This is low-risk, and it's the cheap precursor to the LoRA idea.

### Gaps
- No official or community evidence on whether `[Outro - calm, descending]` reliably produces falling melodies. Needs an MU2 A/B test.
- No measured BPM or key adherence rates for XL. No documented rule linking section count to seconds (how many seconds one tag gets at 30 s duration).
- I found no Reddit or Discord summaries with tested instrumental-ending recipes.
- Whether `guidance_scale` affects XL SFT vs XL Turbo: the docs contradict each other, so check our local config.

## 2. Sonic branding: how sonic logos are designed, and how to derive MSP's signature

### Takeaway
The evidence converges on a short melodic motif of about 3–6 notes lasting about 1–3 s, where the pitch pattern
matters most. The signature's melody stays fixed, while its instrument, register and key can change per context.
For MSP: a "click" transient plus a 3–5 note motif played on a house instrument, transposed to each bed's key.

### Cited Findings
- Keller & Spence (Oxford, 2023): the most iconic sonic logos are melodic, "typically five to six notes in length, and around three seconds long". NBC's chimes shrank from 7 notes to 3 (G-E-C). — [Keller & Spence 2023, Expert J. Marketing](https://marketing.expertjournals.com/ark:/16759/EJM_1108spence91-117.pdf)
- Same paper: because recognition is tied to the melody, brands can change "the pitches, timbres, and tonality of instrumentation" to fit the emotional context and keep the association. Intel's 5 notes were modelled on the intonation of "Intel Inside". T-Mobile's c-c-c-E-c was derived from the visual logo's squares and T. Instrument timbre affects perceived brand personality "just as influential as a brand's visual logo" (citing Puligadda & VanBergen 2023). — [Keller & Spence 2023](https://marketing.expertjournals.com/ark:/16759/EJM_1108spence91-117.pdf)
- Mas et al. (2021, J. Product & Brand Mgmt; older): sonic logos usually last 2–6 s. Their stimuli were 3 s, 5 notes, within 1 octave. Descending-pitch logos were rated more exciting than ascending ones (3.34 vs 3.03, p<.05). Constant pitch was calmer. The pleasantness difference was not significant (p=.106). Fast pace changed heart rate (an orienting response). No effects on brand personality. — [Mas et al. 2021](https://www.emerald.com/insight/content/doi/10.1108/JPBM-05-2019-2370/full/html). **Conflict:** Keller & Spence summarise the same study as "descending-pitch logos were rated as more pleasant". The primary paper's own numbers don't support that firmly.
- Silas et al. (2026, Goldsmiths/Max Planck consortium; 1,860 participants, 90 commercial logos), as reported by TADADAM (3 Jun 2026): structural complexity improves recognition but impairs sung recall. Recommended hybrid: a simple 5–6 note core plus a distinctive timbre/arrangement layer. Krishnan et al. (2012) put the optimum at around 5–6 notes. — [TADADAM blog](https://tadadam.com/en/blog/simple-or-distinctive-sonic-logo) (an agency blog summarising papers; originals not checked); related preprint: [Cambridge repository paper](https://api.repository.cam.ac.uk/server/api/core/bitstreams/eb68da1f-6ea7-4829-be41-d7da46f26aff/content)
- Netflix "ta-dum" (2015, older): the brief was a sound that "tells a story in three seconds or less" with tension and release. It is made of wedding-ring knocks on a cabinet, a slowed anvil and muted hits underneath, and a reversed 1990s guitar swell as the "blossom". The process took about a year and 20–30 candidates. — [MusicRadar](https://www.musicradar.com/news/the-netflix-ta-dum-sound-features-a-reversed-electric-guitar-sample-that-was-created-using-90s-effect-pedals), [Boing Boing](https://boingboing.net/2020/08/07/ta-dum-how-the-netflix-sound.html)
- Nintendo Switch: the logo's "click" is synced to the right Joy-Con snapping into line, imitating the real attach sound. It was pitched higher from 2017. Source is fan wikis, not Nintendo. — [AVID wiki](https://www.avid.wiki/Nintendo_Switch)
- Duolingo: the correct-answer sound is described as two sixteenth notes from F# to A# (a rising major third, "dong ding"). — [Los Doggies blog (older, about 2021)](https://www.losdoggies.com/archives/8816). Composer Ambrose Yu built Duolingo's sound from OP-1 and marimba, "a blend of video game and cartoon theme music". The full in-lesson suite was finished in 2024–25. The sonic logo is Duo's voice mimicking the correct-answer sound. — [Ambrose Yu portfolio](https://ambroseyu.com/work/duolingo-sonic-identity)
- Headspace: I found no sourced design write-up.

### Inferences
- **MSP signature, proposed spec:** 1.0–1.8 s total = a **wood/click transient** (the "piece clicks into place", à la Switch) + a **3–5 note motif** in the house pluck or marimba timbre + a short tail. Range within one octave, diatonic, in major.
- **Direction:** the owner explicitly liked "a few tones going lower" at endings, and descending pitch tested at least as well as ascending (Mas et al.). So use a **falling** motif as the end-of-video sign-off. Keep a rising sister variant (same intervals, inverted) for "record/reveal" moments. Avoid G-E-C (NBC) and plain triad arpeggios that sound generic. Candidate motifs in scale degrees, all to be auditioned: **5-3-2-1**, **6-5-3-1**, **1-5-3 + low 1** (falls an octave at the end), and a click + **3-1** two-note "dong" as the ultra-short Story variant.
- **Blend with every bed:** build the signature outside ACE-Step (short synth or sample render, easy to make in-repo as it isn't a heavy job), as stems: click, motif and tail separately. Transpose the motif to each bed's *detected* key (key adherence is unreliable) and put it on the bed's last downbeat or let it replace the bed's final chord. Same melody and same click everywhere; only the timbre changes by mood (pluck in "data", felt piano in "cozy", marimba in "playful"). This is the "fixed motif, flexible arrangement" principle.
- Hold the click sample constant across all variants: it's the cheapest distinctive element and maps to puzzling.

### Gaps
- No peer-reviewed data on major vs minor for sonic logos, or on optimal length for social video specifically.
- Headspace and Kurzgesagt-style sign-offs: no reliable design sources found.
- Primary Silas et al. 2026 paper not read; findings are via an agency blog.

## 3. Reference aesthetics and three house-sound directions for a cozy-competitive puzzle brand

### Takeaway
Puzzle and cozy games and explainer channels use a small set of moves. They use tonal, soft-attack "plink" timbres
locked to tempo, so events land on the beat (Mini Metro). They use rich, tactile foley for each placement
(Unpacking). Playful, bright but calm scores aim at "calm and empowered focus" (A Little to the Left). Explainer
channels score to narrative pacing with hits on key words (Kurzgesagt). This maps directly onto three MSP
directions.

### Cited Findings
- Mini Metro (Disasterpeace; postmortem and GDC 2018, older): sound design and music are nearly the same thing. Most sounds are "subtle variations on the sine waveform". The system is "100% tempo based", with events (e.g. passenger cascades) timed to rhythms set by the audio system. Harmony is defined per city as pitch lists like `["C3","E3","G3","B3"]` (a major-7 colour). Slow clock uses longer attacks; fast speeds need "tighter attacks to prevent muddiness". The guiding idea is "Inner Complexity, Outer Simplicity". The music speeds up when the simulation does, and grows more complex as the network grows. — [Disasterpeace postmortem](https://disasterpeace.com/blog/mini-metro.postmortem.html), [GDC talk notes](https://disasterpeace.com/blog/vid-serialism-sonification), [Designing Sound interview 2016](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace/)
- Unpacking (Witch Beam, 2021, older): over 14,000 foley effects, with unique pick-up and placement sounds per item. It won the GDC Awards Best Audio. The music is "an honest nod to chiptune". — [Wikipedia](https://en.wikipedia.org/wiki/Unpacking_(video_game)), [A Sound Effect](https://www.asoundeffect.com/unpacking-game-audio/), [Kitty on Fire interview 2022](https://www.kittyonfirerecords.com/blogs/cybercenter/unpacking-ost-interview-with-jeff-van-dyck)
- A Little to the Left (Max Inferno, 2022; composer Justin Karas): the soundtrack is described as "playful, bright, and sometimes even mischievous" music for "calm and empowered focus", inspired by a cozy snow-day feeling. A fan site describes quiet piano notes, soft clicks and a satisfying chime on solving. — [iam8bit](https://www.iam8bit.com/products/a-little-to-the-left-vinyl-soundtrack), [MobyGames credits](https://www.mobygames.com/game/194818/a-little-to-the-left/), [Arcadino](https://arcadino.com/game/a-little-to-the-left/) (fan site)
- Kurzgesagt (Epic Mountain, Munich): the music matches the pacing of the visual story and highlights key parts. The sound design adds "soft background tones, deep booms on key words, and futuristic effects". — [10 Studio](https://10.studio/the-incredible-amount-of-work-behind-kurzgesagts-beautiful-animated-videos/), [Epic Mountain](https://www.epic-mountain.com/)
- Duolingo's in-app suite came from OP-1 synth + marimba: game/cartoon music as a "learning app with personality" sound. — [Ambrose Yu](https://ambroseyu.com/work/duolingo-sonic-identity)

### Inferences: three MU2 directions (all share house instruments: **soft pluck synth, felt/soft piano, light wood percussion (woodblock/clave/rim), a wooden "click" accent**)
Caption drafts follow deAPI's keyword style (8–12 items). Put BPM/key in parameters; test BPM-in-caption as a variant. Endings via tags.

**A. "Clean data" (refined MU1 winner): weekly recap, data Reels, rankings**
- Instruments: plucked sine/FM synth arpeggio, soft sub bass, tight kick + rim/woodblock, felt piano chords, subtle glassy bell on drops.
- 116–120 BPM, 4/4, major (with major-7 colour, à la Mini Metro). Mood: optimistic, precise, curious, light.
- Caption: `minimal electronic, clean modern, plucked synth arpeggio, felt piano chords, woodblock percussion, soft sub bass, steady beat, optimistic, precise, bright, crisp production, instrumental`
- Lyrics: `[Intro - soft plucks]` `[Build]` `[Drop]` `[Breakdown - light]` `[Outro - calm, descending]` `[Fade Out]`

**B. "Cozy table" (felt piano + soft beat): weekly Story, confession/humour, calm recaps**
- Instruments: felt piano lead, warm soft pluck, brushed snare / soft lo-fi beat, upright or warm synth bass, light vinyl/room texture, woodblock accents.
- 80–90 BPM, 4/4, major (or Lydian-tinged major; avoid minor so it stays warm, not sad). Mood: cozy, warm, relaxed, homey.
- Caption: `lo-fi chillhop, felt piano, warm soft plucks, brushed drums, mellow upright bass, woodblock, cozy, warm, relaxed, intimate, soft tape texture, instrumental`
- Lyrics: `[Intro - felt piano]` `[Verse]` `[Chorus - warm]` `[Outro - slowing, descending]` `[Fade Out]`

**C. "Playful pieces" (marimba/pizzicato): humour Reels, feature launches, light competition**
- Instruments: marimba, pizzicato strings, soft pluck, glockenspiel accents, woodblock/claps, light bass.
- 100–112 BPM, 4/4, major. Mood: playful, cheeky, bouncy, mischievous (à la A Little to the Left).
- Caption: `playful orchestral pop, marimba, pizzicato strings, glockenspiel, woodblock, soft plucks, light bass, bouncy, cheeky, cheerful, quirky, clean mix, instrumental`
- Lyrics: `[Intro - marimba]` `[Verse - pizzicato]` `[Build]` `[Drop]` `[Outro - calm, descending]` `[Fade Out]`

How the shared house sound shows up: the woodblock/click and soft pluck appear in all three; the felt piano in A and B.
"Satisfying click into place" = short wooden transients + a tonal resolve on the downbeat. "Speed/competition" =
tighter attacks, higher BPM, ticking hi-hats (Mini Metro: faster means tighter attacks). "Cozy hobby" = felt piano,
soft attacks, warm low end. Keep the ticking/stopwatch layer for countdowns only (MU1).

### Gaps
- Tetris Effect, Islanders and Puzzle & Dragons: not researched (time budget); no sourced detail here.
- Vox and The Pudding music style: no sources found. The Kurzgesagt detail is general (pacing, hits), not instrument-level.
- No source confirms that "woodblock", "felt piano" or "pizzicato" are tokens ACE-Step renders well. Verify by ear in MU2.

## 4. Mood mapping per post type

### Takeaway
Map moods to the three directions plus a tension variant. The constants are the click, the motif and the falling
ending. What varies is BPM, attack and density. This is inference built on sections 2–3 and MU1 owner feedback; no
external source prescribes it.

### Cited Findings
- Pace (fast vs slow) is the logo feature that measurably changed the orienting response. Slow pace is recommended for calm. — [Mas et al. 2021](https://www.emerald.com/insight/content/doi/10.1108/JPBM-05-2019-2370/full/html)
- Music and sound should follow visual pacing and hit key moments. — [10 Studio on Kurzgesagt](https://10.studio/the-incredible-amount-of-work-behind-kurzgesagts-beautiful-animated-videos/)
- Owner MU1: liked data electronic, cozy lo-fi and playful pizzicato/marimba; disliked celebratory pop; ticking fits countdowns only; wants drops on key moments and a calm, descending ending. — `docs/ideas/music-style-system.md`

### Inferences
| Post type | Direction | BPM | Arc (lyrics tags) | Signature use |
|---|---|---|---|---|
| Weekly data recap Story (~15 s) | B Cozy or A Data (owner picks) | 85–118 | `[Intro - soft]` `[Drop]` (on poster landing 3.6 s) `[Outro - calm, descending]` | falling motif on end card |
| Data Reel (rankings / count-ups) | A Data | 116–122 | `[Intro]` `[Build]` (count-up) `[Drop]` (reveal of #1) `[Outro - calm, descending]` | click on each rank reveal (SFX layer), motif at end |
| Humour confession Reel (pile of shame) | C Playful (or B) | 95–108 | `[Intro - marimba]` `[Verse - pizzicato]` `[Breakdown - light]` `[Outro - descending]` | two-note "3-1" sign-off, slightly comic |
| Feature launch Reel | C Playful brightened, or A | 110–120 | `[Intro]` `[Build]` `[Drop]` (feature on screen) `[Outro - calm]` | rising variant at the reveal, falling at the end |
| Countdown / event | A + ticking layer | 120–128 | `[Intro - ticking]` `[Build]` `[Drop]` `[Outro - fade out]` | click as the "start" sound |
| Record celebration | A or C, **not pop**: bells/glockenspiel lift | 112–120 | `[Build]` `[Drop - bright bells]` `[Outro - calm, descending]` | rising motif on the record number, falling at the end |

- Pool per post type: 3–4 approved beds from the matching direction, rotating, all ending into the same signature.
- MU2 test grid suggestion: 3 directions × 2 ending phrasings (`[Outro - calm, descending]` vs `[Outro - fade out]` + `[Fade Out]`) × 2 seeds, auto-fitted to the week-46 Story. Then audition 3–4 signature motifs over the winning beds.

### Gaps
- No engagement data links music style to Instagram retention for niche hobby accounts. Our own insights pipeline would have to measure it (log `music_direction` per post).
