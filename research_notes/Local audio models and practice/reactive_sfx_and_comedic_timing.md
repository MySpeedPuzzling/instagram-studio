# Reactive SFX layer and comedic timing for MSP Reels/Stories (researched 18 Nov 2026)

Scope: a sound layer that reacts to animation events the code already knows (snaps, falls, count-ups, stopwatch, slot draw, spider, cobwebs), plus the comedic craft. Owner rules: no credit anywhere, public use, free or open preferred. Already settled in earlier notes and not repeated here: Freesound CC0 and Sonniss GDC are OK, MOSS-SoundEffect v2 is the only acceptable text-to-SFX model, video-to-audio models are out, master to −14 LUFS.

Research budget: about 18 web calls. Items marked "(practitioner knowledge, uncited)" come from general sound-design practice, not from a source fetched in this session. The report writer should present them as rules of thumb, not as cited facts.

## Craft: comedic sound design and timing for animation

### Takeaway
Line up the sound's **transient** (its sharp start), not the start of the file, with the contact frame. For hard impacts, putting it 0–1 frame early (≤ about 40 ms) reads tighter. The Warner/Treg Brown tradition is to pick a recognisable sound for each gag and reuse it, timed to the frame from exposure sheets. Most of the comedy comes from contrast: a hit, then silence or a deadpan beat, then the payoff sound.

### Cited Findings
- For sharp impacts, a sound placed one frame early often reads as tighter. If the action peaks a frame or two after contact, nudge the sound 1–2 frames earlier. — [Morphic: how to sync sound effects](https://morphic.com/resources/how-to/how-to-sync-sound-effects-to-video)
- Align the **transient** with the action frame, not the start of the audio file. Most files open with a few frames of near-silence, and that is why an effect that "looks aligned" still reads as late. — [Morphic](https://morphic.com/resources/how-to/how-to-sync-sound-effects-to-video)
- Even a few frames too early or too late breaks the illusion. — [SFX Engine blog](https://sfxengine.com/blog/animated-sound-effects) (vendor blog, low authority)
- Teaching exercise: animate a bouncing ball at 24 fps, then move the hit a frame earlier or later and compare how satisfying it feels. — [BINUS DKV, Nov 2025](https://binus.ac.id/bandung/dkv/2025/11/04/sound-and-motion-how-music-and-effects-shape-animated-stories/)
- With sound effects, an animation can drop frames per second without looking less smooth, and footstep sounds raise how smooth a walk looks. Sound makes motion read as smoother. — [ResearchGate: influence of sound effects on perceived smoothness](https://www.researchgate.net/publication/221282993_The_influence_of_sound_effects_on_the_perceived_smoothness_of_rendered_animations)
- How causally linked a sound looks to its visual event changes how tolerant viewers are of sync errors. A clearly causal hit, such as a box landing, is judged more strictly. — [Frontiers / PMC 7930005](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7930005/)
- Treg Brown was Warner's cartoon sound editor from 1936 to 1963 (Ben Burtt says 1933–66). He conceived, recorded and selected the Looney Tunes effects library, and was a musician first. — [Wikipedia: Treg Brown](https://en.wikipedia.org/wiki/Treg_Brown); [Designing Sound: Treg Brown and the Sound of Looney Tunes](https://designingsound.org/2009/12/08/treg-brown-and-the-sound-of-looney-tunes/)
- Brown worked from the director's exposure and bar sheets, where the timing of each scene was set frame by frame. — [Cinephile vol. 6 no. 1 (UBC, 2010)](https://ojs.library.ubc.ca/index.php/cinephile/article/download/197955/192368/247296) (the PDF text is garbled; this is the gist)
- His effects were noted for "perceptually imprinting fast visual events" on the viewer. Early cartoons made their effects with musical instruments, while Brown drew on live-action studio recordings. — [AUB: A General Aesthetics of American Animation Sound Design](https://research.aub.ac.uk/id/eprint/92/1/A%20General%20Aesthetics%20of%20American%20Animation%20Sound%20Design.pdf)
- Once sound no longer had to be performed live in one pass with the orchestra, effects could be swapped for unrelated sources: a finger popped out of a Coke bottle became the Road Runner's tongue flip. Brown saved effects to reuse in later cartoons. — [Twenty Thousand Hertz: Cartoon Sound Effects](https://www.20k.org/episodes/cartoon)
- Further sources not read this session: the documentary *Crash! Bang! Boom! The Wild Sounds of Treg Brown* (2004), and the Warner SFX CD, catalogued at [Internet Archive](https://archive.org/details/crash-bang-boom-the-best-of-warner-bros.-sound-fx). That CD is copyrighted, so it is listening reference only and never a source.

### Inferences
- At MSP's frame rates, one frame is 33 ms at 30 fps and 16.7 ms at 60 fps. Rule for the cue builder: `cueTime = eventTime − transientOffset(sample) − lead`. Set `lead` to 0 ms by default and to 1 frame for hard impacts (box lands, pile collapses). Store `transientOffset` per sample in the kit manifest, measured once by onset detection (e.g. a librosa onset or an ffmpeg `silencedetect` threshold). Sounds should never come late.
- The comedic grammar below is practitioner knowledge (uncited). These are the forms that suit MSP's proven humour, the "pile of shame" confession and "Unlucky 13":
  - **Anticipation, impact, settle.** A small whoosh or rising tick before the event, the hit on contact, then a tail (a wobble, a rattle of pieces settling). The settle is where it gets funny: one late piece trickling off the pile after everything has stopped.
  - **Mickey-mousing:** sound mirrors motion one to one (each step, each piece). It works for short gags but tires quickly. Use it in bursts, such as a slot reel's ticks, not over a whole clip.
  - **Silence before the punchline.** Cut the bed and all SFX for about 300–700 ms before the reveal (the 13th piece missing, the pile number). Silence is the strongest contrast available. On a muted-autoplay platform it matters only for people listening, so the visual joke must work without it.
  - **Record scratch plus freeze-frame:** "yep, that's me" for confessions. The scratch stops the bed instantly, and the freeze holds 0.5–1 s.
  - **Deadpan:** a tiny, polite sound against a big event (one quiet "tick" as the giant pile falls) or the reverse (a huge cinematic boom for one piece snapping). Mismatched scale is the joke.
  - **Pitch tricks:** a descending pitch for failure (sad slide, slide whistle down), a rising pitch for a count-up, with each tick slightly higher and a ding at the end. Pitch up for small or cute (spider legs), pitch down for doom.
  - **Round-robin and variation:** never fire the same sample twice in a row. Pick from a pool of 3–8 takes, randomise pitch ±1–2 semitones and gain ±2 dB, and jitter timing a few ms (never later than the contact). This avoids the "machine-gun effect" on repeated snaps.
  - **Layering:** one effect = a transient layer (click), a body layer (cardboard or wood thump) and an optional sweetener (a sparkle or a tiny ding). Keep at most 2–3 layers so phone speakers don't smear them.
  - **Rule of three:** two normal events, then the third breaks the pattern with a different sound or silence. "Unlucky 13" fits this.

### Gaps
- No primary source fetched this session (book or GDC talk) gives a numeric "N frames early" rule. The 1-frame-early advice is practitioner guidance only. ITU-R BT.1359 detectability limits (often quoted as about +45 ms audio-early and −125 ms audio-late) were not verified here. If they are correct, viewers tolerate early audio *less* than late audio, so a lead larger than about 1 frame is risky.
- Ben Burtt's own writing on cartoon sound, the classic books (David Sonnenschein, *Sound Design*; Ric Viers, *The Sound Effects Bible*), and GDC talks on game "juice" (e.g. Jan Willem Nijman, "The art of screenshake", 2013) were not fetched. Cite them by name only.
- No data found on which comedic SFX forms perform best in short-form social video. The owner's own insights (the pile-of-shame and Unlucky 13 results) are the best evidence available.

## Meme sounds: copyrighted vs safe; Instagram library; CC0 or own-made equivalents

### Takeaway
Most famous meme sounds are commercial stock files or clips from TV, film or games, not public domain. "Free download" sites claiming CC0 for them cannot be trusted. **Vine boom** is the exception: its maker grants a free, commercial, credit-optional licence. Copyrighted meme clips are risky for the owner's rules. The safe route is CC0 Freesound look-alikes, sounds the owner records himself, or code-synthesised versions.

### Cited Findings
- The **Vine boom** comes from Bluezone Corporation's paid pack "Cinematic Session – Industrial Samples & Impacts" (file Bluezone-Cimpact-sound-001.wav, 2012). — [X: SurrealMediaFacts](https://x.com/SurreMediaFacts/status/2045409109378212177) (secondhand); confirmed by the maker: [Bluezone blog](https://www.bluezone-corporation.com/blog/original-vine-boom-sound-effect)
- Bluezone's terms for that file: "a free, worldwide license, which includes commercial projects", including short videos, "monetized or not". "Credit isn't required, but it is appreciated." Modifying it is allowed ("freely transform it"). Not allowed: reselling it, redistributing it as a downloadable sound effect, or putting it in a sound library or plugin. — [Bluezone blog](https://www.bluezone-corporation.com/blog/original-vine-boom-sound-effect)
- Many circulating "vine boom.mp3" files are altered versions. Third-party sites label copies CC0 (e.g. Chosic), which contradicts the commercial origin. — [Bluezone blog](https://www.bluezone-corporation.com/blog/original-vine-boom-sound-effect); [Chosic](https://www.chosic.com/download-audio/54471/)
- Sources disagree on when the sound was popularised: King Bach in 2013 vs 2014, and a claimed 2009 upload. — [meme.com](https://meme.com/memes/vine-thud-boom-sound-effect); [TwoShot](https://twoshot.app/sound-effects/vine-boom/)
- **Instagram:** a business account cannot use the main licensed music library, which is for personal, non-commercial use. It can use the **Meta Sound Collection**, about 14 000+ royalty-free tracks and SFX cleared for commercial use, found under Audio in the Reels camera. Boosted Reels can't use licensed music. — [Third Chair](https://usethirdchair.com/blog/instagram-reels-audio-library-what-brands-need-to-know); [Lilach Bullock](https://www.lilachbullock.com/instagram-music-library-business-accounts/); [Foxi Music 2026 guide](https://www.foximusic.com/blog/instagram-reels-music-copyright-legal-guide/) (all third-party blogs citing Instagram Help; Meta's own page was not fetched)
- CC0 Freesound look-alikes (CC0 filter applied in the search; listed titles and IDs, licence shown on each page; only 557755 was opened and verified individually):
  - Sad trombone / fail: "wah wah sad trombone.wav" **175409** (kirbydx); "Trumpet sad chromatic wah wah.wav" **369873** (SpliceSound); "Fail Jingle (layer 1)" **181354** (unfa); "horn_fail_wahwah_1.wav" **362206** (TaranP) — [Freesound search, CC0](https://freesound.org/search/?q=sad+trombone&f=license%3A%22Creative+Commons+0%22)
  - Record scratch: "record scratch skip sounds.wav" **577308** (TRP); "Gramophone record scratch skip screech" **573940** (TRP); "vinyl-scratch.wav" **452711** (plus-one); "Record Scratch #5" **431780** (musicvision31); "Scratch.wav" **274129** (jameswrowles); "record_scratch.wav" **71853** (ludvique) — [Freesound search, CC0](https://freesound.org/search/?q=record+scratch&f=license%3A%22Creative+Commons+0%22)

### Inferences
- Treat these as **off-limits** unless the original licence is confirmed: "bruh", "oh no" (Kreepa song), "Curb Your Enthusiasm" theme, Windows XP error, the Metal Gear "!" alert, the Mario/Zelda jingles, the Price Is Right fail horn, laugh tracks ripped from sitcoms, and the "emotional damage" clip. They are TV, music, game or voice clips with copyright holders, and most cannot be traced to a licence (practitioner knowledge; no per-sound licence was checked this session).
- Vine boom is legally usable under Bluezone's terms (no credit needed, commercial OK). Use only the original file from Bluezone, never a re-encoded meme copy. Do not ship it in any downloadable kit or a public repo: commit only a manifest, keep the file in gitignored `content/`.
- Meta Sound Collection SFX can only be added inside the Instagram app, not through the Graph API. The code pipeline can't place them on exact frames, so they don't fit a frame-accurate pipeline (inference; no API docs checked).
- Own-made equivalents are best and fully owned. Examples: the owner's own voice saying "oh no" deadpan; a "boing" from a ruler twanged on a table edge; a laugh made by layering 2–3 people's real laughs (record friends at a puzzle meetup); a sad trombone played on a kazoo, or synthesised as a descending-pitch sawtooth with vibrato.

### Gaps
- Meta's own help page for the Sound Collection licence terms (especially use *outside* Instagram) was not fetched.
- Per-sound licences for "bruh", the laugh track and "boing" were not looked up.

## Puzzle foley: CC0 recordings and an iPhone recording recipe

### Takeaway
Freesound has a small set of real jigsaw recordings under CC0: about 10 hits for "jigsaw puzzle", most from one user, *esperar*. Take snaps and pours from them only to start with. Owner-recorded foley with an iPhone is better: fully owned, authentic to MSP's actual brands (Ravensburger vs Pomaranch board feel), and easy to make round-robin pools from.

### Cited Findings
- Freesound CC0 results for "jigsaw puzzle" (10 total; 7 visible) — [Freesound search](https://freesound.org/search/?q=jigsaw+puzzle&f=license%3A%22Creative+Commons+0%22):
  - **557755** "Jigsaw Puzzle – Tip out pieces and play" (mattjamie). **Verified CC0**, WAV 44.1 kHz/16-bit, 2:16. It records a box being opened on a table, the pieces tipped out, then sorting and assembling. Ideal raw material for the pour, the spread and single clicks. — [sound page](https://freesound.org/people/mattjamie/sounds/557755/)
  - **170775** "puzzle pieces.wav", **170771** "puzzle pieces 2.wav", **170772** "puzzle box with pieces 2.wav", **170774** "Puzzle box with pieces.wav", **170773** "puzzle box lid.wav" (all esperar)
  - **560701** "Puzzle piece rotation (counterclockwise)" (el_boss)
- Freesound CC0 results for "cardboard box shake" — [Freesound search](https://freesound.org/search/?q=cardboard+box+shake&f=license%3A%22Creative+Commons+0%22): **802611** "Cracker Box Shaking" (JelloApocalypse); **880096** "Shake_Cardboard Box 1_Raw" (CAT-FOX_ALEX); **685968** "hollow-box-shaking.wav" (sprokitt66); **658608** "Handling and opening a box from Amazon" (RavenWolfProds); **271318** "Scratch in cardboard or wood" (kd_jack); **691377** "playing_yahtzee_hand_sfx" (MutilatorBCB; dice in a hand, a possible "rattle" substitute).
- Note: the numbers shown next to titles on Freesound's search page are *not* durations. Search showed "7" for 557755, whose real length is 2:16. Check lengths on each sound page.

### Inferences
- More Freesound search terms worth trying (not run this session): `puzzle piece`, `jigsaw`, `cardboard tap`, `cardboard click`, `board game pieces`, `pouring plastic pieces`, `table knock wood`, `finger tap table`, `box lid off`, `shuffle cards` (as a spread substitute), `stopwatch tick`, `stopwatch click`, `slot machine reel`, `ding bell`, `whoosh`, `creaky door` (cobweb or spider mood), `wind chime`. Always set the filter `license:"Creative Commons 0"`, and re-check the licence on the sound page before download, because a licence can differ between versions.
- **iPhone foley recipe** (practitioner knowledge, uncited):
  - *App:* Voice Memos with Settings, Voice Memos, Audio Quality "Lossless", and Enhanced Recording off; or a free recorder app that saves WAV 48 kHz/24-bit with auto-gain off. Turn on Airplane mode so there are no buzzes or notifications.
  - *Room:* the deadest room available (bedroom with a bed, curtains and a rug; or under a duvet tent). Not the kitchen or bathroom. Fridge, heating and fans off. Record late evening when the street is quiet.
  - *Surface:* a towel or felt under a wooden board for clean piece clicks without table boom. Then a second pass on the bare table, for the "real table" body layer.
  - *Mic distance:* the bottom mic (at the Lightning/USB-C end) points at the source from 10–20 cm for small clicks and snaps, 30–50 cm for pours and box shakes. Keep the phone on a folded towel or stand, never in the hand (handling noise). Peaks should land around −12 to −6 dBFS. If a pour clips, move back.
  - *Takes:* record 10–20 takes of each action, with a second of silence between them. Vary force and position. Record a 10-second "room tone" with nothing happening, for noise reduction and gap filling.
  - *Shot list for MSP:* single piece snap or press-in (several brands: Ravensburger, Pomaranch, Trefl, Educa); piece slid across a board; finger tap on a piece; handful dropped onto a pile; full box pour (500/1000 pieces) from 10, 30 and 50 cm; box shake (closed, slow and fast); lid off (suction pop) and lid on; spreading pieces with a flat hand; sorting into trays; a pile collapsing; stopwatch start and stop button clicks (a real speed-puzzling timer); a pen tick; a pencil drop; the owner's deadpan voice lines ("oh no", "thirteen…", "again").
  - *Editing:* in Audacity (GPL tool; outputs are his own) or ffmpeg: high-pass at 60–80 Hz, light noise reduction using the room-tone profile, cut each take tightly with a 5–10 ms pre-roll before the transient, a short fade-out, and peak normalise to −1 dBFS. Name files `snap_ravensburger_03.wav`. Record each file's transient offset in a manifest.
  - Owner-recorded files belong to him: no licence question, no credit. This is the best fit for the no-attribution rule.

### Gaps
- The 3 hidden "jigsaw puzzle" CC0 results and the per-page licence of each esperar file were not individually verified (only 557755 was opened).
- No measured data found on iPhone mic quality for close foley. The recipe is practice-based.

## Freesound API: programmatic search and download of CC0 originals

### Takeaway
Search and **previews** work with a simple API token. **Original files need OAuth2** (authorization code with PKCE, tokens last 24 h, refresh tokens rotate). Downloads are rate-limited to 30/min and 500/day. But the API terms say commercial use is "negotiated case by case", and they ban building a mirror library. The safest path: use the API (token) only to *search and shortlist*, and have the owner download chosen CC0 originals by hand on the website. The licence that matters for the sounds is CC0 itself.

### Cited Findings
- Token auth: an API key sent as a `token` parameter or an `Authorization: Token …` header. It works for anything not marked "OAuth2 required", and it cannot write. — [Freesound API: authentication](https://freesound.org/docs/api/authentication.html)
- OAuth2: authorization code flow with PKCE. S256 is recommended, and required for applications registered from November 2026. HTTPS only. The access token lasts 24 h (`expires_in` 86399). The authorization code is valid 10 min and works once. Each refresh issues a new refresh token. — [Freesound API: authentication](https://freesound.org/docs/api/authentication.html)
- Resources needing OAuth2: **downloading original sound files**, uploading, describing, pending uploads. Previews do not need OAuth2. — [Freesound API: overview](https://freesound.org/docs/api/overview.html)
- Rate limits: standard 60 requests/min and 2000/day. Original downloads, uploads and rating: 30/min and 500/day. Higher limits on request via the contact form. — [Freesound API: overview](https://freesound.org/docs/api/overview.html)
- Previews exist as .ogg and .mp3 in several qualities. The overview gives no bitrates. — [Freesound API: overview](https://freesound.org/docs/api/overview.html)
- API terms of use:
  - Commercial terms are "negotiated on a case by case basis with UPF", and fees may come in the future.
  - Intermediate copies only as needed, deleted after; "Do not make full copies of the database."
  - No robots, spiders or scraping; no building "similar databases"; usage must not exceed reasonable volume.
  - API use is "for interaction with your application only".
  — [Freesound API Terms of Use](https://freesound.org/help/tos_api/)

### Inferences
- MSP is a promotional account for a project with a commercial side, so automated pulling through the API sits in a grey zone of the API terms, even though the sounds themselves are CC0 (inference). Low-risk workflow:
  1. A small script uses the token search (`/apiv2/search/?query=…&filter=license:"Creative Commons 0"&fields=id,name,license,duration,previews,username`) to build a shortlist page with preview players.
  2. The owner listens and picks.
  3. The owner downloads the originals by hand while logged in, or a one-off OAuth2 download of a handful of IDs is used.
  4. Files go to gitignored `content/sfx/`, and a committed manifest holds only IDs, licence, a checksum and the transient offset. Never mass-download.
- Don't ship previews in final videos: they are lossy, and the overview gives no quality figure. Use originals (WAV/FLAC).
- The PKCE S256 requirement for new apps (Nov 2026) matters if a new API app is registered now.

### Gaps
- Preview bitrates were not confirmed in the docs fetched. Commonly cited as about 128 kbps "hq" mp3 and about 64 kbps "lq"; not verified.
- No answer found on whether a non-profit community account counts as "commercial" under the API terms. The owner could ask Freesound if automating downloads matters.

## Code-generated SFX: sfxr/jsfxr/bfxr, ZzFX, Tone.js offline, Python synthesis

### Takeaway
ZzFX is MIT and jsfxr is Unlicense (public domain dedication). Neither README claims any rights over the sounds they generate. Sounds you synthesise from your own parameters are your own output, so there is nothing to credit. They are excellent for UI-style ticks, pops, dings, blips, risers and slot-reel clicks. They sound "gamey/8-bit" unless filtered and layered with real foley.

### Cited Findings
- ZzFX: "Open Source: MIT licensed, use it anywhere!" Under 1 KB compressed, 20 parameters, sounds made in code without asset files. npm `zzfx` (1.4.0 listed). — [KilledByAPixel/ZzFX](https://github.com/KilledByAPixel/ZzFX); [npm zzfx](https://www.npmjs.com/package/zzfx)
- jsfxr: Unlicense; `npm i jsfxr`, `import { sfxr } from "jsfxr"`. `sfxr.generate(preset)` builds a sound, `sfxr.toWave(sound)` returns a WAV data URI (riffwave), and `sfxr.toBuffer(sound)` returns raw samples at 44.1 kHz. The README says nothing about who owns generated sounds. — [chr15m/jsfxr](https://github.com/chr15m/jsfxr)
- A 2026 developer comparison for "$0 sound sources" chose ZzFX for most effects, after comparing raw Web Audio, ZzFX, jsfxr/sfxr and Tone.js. — [GitHub issue: $0 sound sources](https://github.com/jmcada2503/webTypingGame/issues/150)

### Inferences
- Output licence: the code licences (MIT, Unlicense) cover the code. Synthesised audio you generate from your own parameters is your output. An MIT or Unlicense tool does not claim it, so nothing needs crediting (inference, standard reading; no source fetched states it for these tools).
- Bfxr (Flash-era, Apache-2.0 as far as known) and the original sfxr are older (around 2007–2011). jsfxr covers the same synth in Node.
- **Tone.js `Tone.Offline`** renders a synth graph to an AudioBuffer faster than real time. In Node it needs an OfflineAudioContext polyfill (`node-web-audio-api`), or it runs in the headless Chrome that HyperFrames already uses (not verified this session).
- **numpy/scipy** synthesis, practitioner knowledge, uncited:
  - *Click:* 1–3 ms of a band-passed noise burst at 2–5 kHz.
  - *Tick:* a sine at 2–4 kHz with a 5–15 ms exponential decay.
  - *Pop:* a sine sweeping down from 600 to 150 Hz over 40 ms.
  - *Ding:* a sum of inharmonic partials (1, 2.76, 5.4 × f0) with a 0.5–1.5 s decay.
  - *Whoosh:* noise through a swept band-pass, with an amplitude envelope tied to the object's motion speed.
  - *Count-up:* ticks whose pitch rises a semitone every N steps, ending in a ding.
  - Fully deterministic and seedable, so render each variation from a seed. Ideal for count-ups and the stopwatch.
- Quality: synthetic ticks and dings fit MSP's clean UI/data look (Weekly Numbers). Physical events (pieces, boxes) should be real foley; synthetic versions sound cheap there.

### Gaps
- Bfxr's current licence and the pyo licence (pyo is LGPL-3.0 as far as known; using it as a tool doesn't affect outputs) were not verified this session.
- Tone.js offline rendering in pure Node was not checked against current docs.

## Pipeline: attaching SFX to animation events, ducking, variation, levels

### Takeaway
HyperFrames, which MSP already uses, supports everything a reactive layer needs natively. `<audio data-start>` clips can sit anywhere on the timeline; `<hf-audio-group>` buses have their own compressor and EQ; `data-automation` volume lanes do the ducking; `data-fx-carve` does spectral ducking of the bed; `pitchshift` changes pitch; and a master `truepeak` ceiling sits on the root. So the design is: the GSAP timeline emits cue events, a cue builder (TS) maps each event to a sample from a pool, and it writes `<audio>` elements plus duck points into the composition. No separate ffmpeg mixdown is needed. ffmpeg `adelay`/`amix` stays as a fallback.

### Cited Findings
- HyperFrames audio clip markup: `<audio data-start="0" data-duration="6" data-track-index="2" data-volume="0.5" src="…">`. `data-start` can be relative to another clip ("intro + 2"). Trimming uses `data-media-start`. Muted video plus a separate `<audio>` is recommended. — [HyperFrames HTML schema](https://hyperframes.heygen.com/reference/html-schema); [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- `data-start` is local to its composition. A recent fix makes volume envelopes use the clip's absolute start: a clip at 1 s inside a host starting at 2 s plays at 3 s. `hyperframes info --media --json` lists every mixed clip on the film clock (start, end, mediaStart, playbackRate, volume). — [commit 5973273](https://github.com/heygen-com/hyperframes/commit/5973273f8d1c76c0c7e743faee32a658ef65a328); [CLI docs](https://hyperframes.heygen.com/packages/cli)
- Audio features, all from [HyperFrames audio effects reference](https://hyperframes.heygen.com/reference/audio-effects):
  - **Effect chains:** `data-fx-chain` (JSON) on clips, groups and the root (the master bus). Nodes: highpass, lowpass, peaking, low/high shelf, gain, compressor, limiter, truepeak, gate, pitchshift (−12 to +12 semitones, whole steps, not automatable; presets chipmunk, giant, monster).
  - **Volume lanes:** `data-automation` volume lanes with points `{t, v, curve}` (clip-relative time; group lanes use composition time; max 512 points). Don't combine them with GSAP volume tweens.
  - **Group buses:** `<hf-audio-group>` sums its members through one bus with its own chain and automation; groups do not nest.
  - **Carve:** `data-fx-carve` sits on the bed and dips it in the bands where the sources are: strength 0.25 is about 6 dB in three bands, 0.5 about 10 dB. It is designed for voiceover, but `sources` takes any group id.
  - **Peak ceiling:** put `truepeak` at least 2 dB below the target limit.
  - **Automating dynamics:** compressor, limiter, truepeak and gate parameters can't be automated; automate a `gain` node before them instead.

### Inferences
- **Proposed design** (inference):
  1. Each animation module exposes `cues: {t, type, intensity, x?}[]`. They come from the same GSAP timeline, e.g. via `tl.add(() => {}, label)` positions, or by computing the times directly from the layout data. Don't record them at runtime, because HyperFrames renders deterministically by seeking.
  2. The kit manifest `sfx/kit.json` maps `type` → pool `[{file, transientMs, gainDb, licence, source}]`.
  3. The cue builder runs a seeded RNG (seed = post id, so re-renders are identical). It picks without repeating the last item and adds pitch ±1 semitone (HyperFrames pitchshift is whole semitones only; for finer pitch variation, pre-render variants with ffmpeg `rubberband` or `asetrate`). It adds gain ±2 dB, and maps intensity to gain (a bigger pile means a bigger thump).
  4. It writes `<audio data-audio-group="sfx" data-start="{t − transient − lead}">` elements.
  5. It **thins** dense cues: no more than about 12–15 hits per second. Above that, swap in a "cluster" sample (a pour or a rattle) instead of 200 single clicks.
  6. It writes duck points on the bed's volume lane: −4 to −6 dB, 20 ms attack, 150–250 ms release, around important hits only. Or put `data-fx-carve` on the bed with `sources:["sfx"]` at 0.25 and keep explicit full drops (silence) for punchlines.
  7. Buses: an `sfx` group with a high-pass at 120–150 Hz and a gentle compressor. The master root chain: limiter, then truepeak at −1 dBTP, and loudness finished at −14 LUFS as already decided.
- **Phone-speaker rules** (practitioner knowledge, uncited):
  - Phone speakers roll off below about 200–300 Hz, so a thump needs a 1–4 kHz click or transient layer, or it vanishes. Use a 2–5 kHz presence boost on the SFX bus rather than more bass.
  - Keep the bed's 2–4 kHz region carved when SFX play.
  - SFX peaks about 3–6 dB above the bed's short-term level for key hits; background mickey-mousing 6–10 dB below the key hits.
  - Check the mix in mono and on the iPhone speaker itself before approval.
- **Other tools:**
  - **Remotion** (older, not used here): `<Sequence from={frame}><Audio src volume={f => …} playbackRate/></Sequence>`, with a volume callback per frame for ducking. Not verified this session.
  - **editly:** JSON spec with `audioTracks` that take `start` and `mixVolume`. Not verified.
  - **ffmpeg fallback:** for each cue, `[i:a]adelay=T|T,volume=G[a_i]`, then `amix=inputs=N:normalize=0`, and `sidechaincompress` of the bed keyed by the SFX bus. `normalize=0` matters, otherwise amix lowers every input.
- Keep a short **sonic signature** at the end (already in the earlier report) separate from the reactive layer.

### Gaps
- HyperFrames docs fetched don't cover fades or `playbackRate` on audio. Whether pitch variation through `playbackRate` on `<audio>` is supported is not confirmed.
- How HyperFrames performs with many (100+) short `<audio>` elements in one composition was not documented or measured. A lab should test pre-mixing clusters to one stem.
- Remotion, editly and ffmpeg syntax above was not re-checked against current docs this session.
