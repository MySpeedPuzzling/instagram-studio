# Automatic music bed for short programmatic videos (select → fit → align → mix → master → QA)

Scope: 8–30 s Reels/Stories rendered from HTML/GSAP (HyperFrames) on an M3 Max, Node/TypeScript + ffmpeg, the
timeline (scene starts, reveals, count-ups) known as JSON. Basics already covered elsewhere (two-pass loudnorm to
−14 LUFS / −1 dBTP, AAC 128 k 48 kHz, beat_this for beats, sidechaincompress ducking) are not repeated.
Researched 2026-11-16. Nothing installed.

## 1. Selecting a track that fits the mood (text-to-audio embeddings, taggers, BPM/key) and their licences

### Takeaway
For commercial use the cleanest stack is **Microsoft CLAP (MIT code) or LAION-CLAP (CC0 code) for text-brief → track
ranking, plus librosa (ISC) / beat_this for tempo**. The strongest music-specific models (MuQ-MuLan, Essentia's
Discogs-EffNet / MTG-Jamendo mood heads) have **non-commercial weights**, and Essentia itself is AGPL-3.0, so they are
only usable for offline experiments unless a commercial licence is bought. With a small curated library (tens to a few
hundred tracks) the embedding only has to rank, not generate, so a cheap model plus human-curated tags is enough.

### Cited Findings
- **LAION-CLAP**: repo licence CC0-1.0; no separate licence stated for checkpoints. Music checkpoints:
  `music_audioset_epoch_15_esc_90.14.pt` (music + AudioSet + LAION-Audio-630k; GTZAN zero-shot 71 %),
  `music_speech_audioset_epoch_15_esc_89.98.pt` (GTZAN 51 %), `music_speech_epoch_15_esc_89.25.pt` (GTZAN 69 %),
  described as a "temporary release … use at your own risk". The authors say they cannot release the exact training
  set because of copyright. API: `model.get_text_embedding([...])`, `model.get_audio_embedding_from_filelist(x=[...])`;
  audio input expected at 48 kHz. — [LAION-AI/CLAP](https://github.com/LAION-AI/CLAP)
- **Microsoft CLAP** (`msclap`): code MIT; weights on Zenodo/HuggingFace with no licence stated on the README;
  `CLAP(version='2023', use_cuda=False)`, `get_text_embeddings`, `get_audio_embeddings`, `compute_similarity`;
  2023 version 93.9 % ESC-50 zero-shot. — [microsoft/CLAP](https://github.com/microsoft/CLAP)
- **MuQ / MuQ-MuLan** (Tencent): code MIT, **weights CC-BY-NC 4.0** (LICENSE_weights). MuQ-MuLan ≈700 M params,
  requires 24 kHz input, use fp32 to avoid NaNs; examples are CUDA-only, no MPS mention. Usage:
  `mulan(wavs=...)`, `mulan(texts=[...])`, `mulan.calc_similarity(a, t)`; accepts English or Chinese text. —
  [tencent-ailab/MuQ](https://github.com/tencent-ailab/MuQ)
- **Essentia library**: Affero GPLv3 "for non-commercial applications"; commercial use → contact UPF MTG. **All
  MTG pre-trained models are CC BY-NC-SA 4.0**, proprietary licence on request. —
  [Essentia licensing](https://essentia.upf.edu/licensing_information.html); [Essentia models](https://essentia.upf.edu/models.html)
- Essentia mood/character heads available: `mtg_jamendo_moodtheme` (56 multi-label mood/theme classes, e.g. calm,
  happy, party, relaxing, uplifting; on Discogs-EffNet embeddings), binary `mood_happy/relaxed/sad/aggressive/party`,
  `moods_mirex` (5 clusters), `danceability`, `approachability` and `engagement` (classes or continuous),
  arousal/valence regressors (DEAM, emoMusic, MuSe; 1–9 scale). — [Essentia models](https://essentia.upf.edu/models.html)
- **PANNs** (audioset_tagging_cnn): code MIT, no separate weight licence stated; 32 kHz (Cnn14) or 16 kHz variant;
  527 AudioSet classes; `pip install panns_inference` for inference only. —
  [qiuqiangkong/audioset_tagging_cnn](https://github.com/qiuqiangkong/audioset_tagging_cnn)
- **librosa**: ISC licence. — [librosa/librosa](https://github.com/librosa/librosa)
- **Industry pattern**: Epidemic Sound's documented "soundtracking with an LLM" flow is: an LLM analyses the video and
  writes a natural-language search `term` covering mood, energy, tempo, genre, instruments, vocals; filters such as
  `vocalType=NONE` (instrumental); the LLM may call `search_music` several times, refine the query and return
  `selected_track_ids`. — [Epidemic Sound developers: Build your own soundtracking](https://developers.epidemicsound.com/docs/soundtracking-with-llm/)

### Inferences
- Recommended selection recipe: (1) keep a local, licence-cleared library with a `library.json` (path, licence/source,
  BPM, key, instrumental flag, hand tags, "ending type"); (2) precompute one CLAP audio embedding per track (and per
  10 s window, since short videos use only a slice); (3) the draft step writes a 1-line text brief ("cozy, playful,
  ticking clock, light piano, 100–120 BPM"); (4) rank by cosine similarity, filter hard constraints (instrumental,
  BPM window, length ≥ video, not used in the last N posts), and (5) show the top 3 to the owner as audible options
  rather than auto-picking one. CLAP zero-shot on music genre is only ~51–71 % (GTZAN numbers above), so it is a
  ranker, not an oracle.
- Using non-commercial weights only to *choose* among tracks the company already licenses arguably doesn't put the
  model's output into the published video, but the CC-BY-NC/BY-NC-SA terms restrict use of the model itself for
  commercial purposes; treat MuQ-MuLan and Essentia models as off-limits for the production pipeline unless licensed
  (not legal advice).
- Python-side models (CLAP, librosa) would run as an offline "index the library" job, not on every render; the Node
  pipeline only reads the resulting JSON.

### Gaps
- Microsoft CLAP and LAION-CLAP weight licences are not stated in their READMEs; LAION-CLAP's training-data copyright
  caveat is a residual risk. Not verified whether either runs on Apple MPS (CPU is fine for a small library).
- No benchmark found comparing CLAP vs MuQ-MuLan on mood-brief retrieval for production-music libraries.
- Key-detection licence options beyond Essentia (AGPL) not researched in depth; librosa has chroma but no packaged key
  estimator (key is rarely needed for a single-track bed).

## 2. Fitting length with a clean ending (structure, loops, bar cuts, crossfades, stretch)

### Takeaway
The proven recipe is **cut/loop only whole bars between acoustically similar bars, crossfade a few tens of ms just
before the downbeat, keep the track's own final hit when it fits, otherwise fade over a beat-aligned bar**; a tiny
rubberband stretch (R3 `--fine`, `-D <seconds>`) can absorb the leftover sub-beat error. An MIT Node.js tool,
**musicfit**, implements almost exactly this with only ffmpeg as a dependency, and is the best starting point
(immature: 1 star, untested on macOS).

### Cited Findings
- **musicfit** (MIT, plain JavaScript, Node ≥ 22, ffmpeg ≥ 4.4, no npm deps): onset detection in 10 ms frames over 40
  bands → tempo with half/double disambiguation (prefers ~115 BPM) → Ellis-style DP beat tracking → bar lines from
  kicks, chord and loudness changes (3 or 4 beats) → per-bar descriptors (harmony, timbre, loudness, rhythm) to find
  sections, the drop and the ending → fills one-bar slots by dynamic programming where a seam costs more if the bars
  don't sound consecutive, if it breaks a 4-bar phrase, or if it skips a build before the drop. Seams: 30 ms crossfade
  ending just before the downbeat. Non-rhythmic tracks: 1 s crossfades between similar sections. Ending: `--end auto`
  keeps the track's own final hit if there's room, else a fade starting and ending on beats (`--fade` in beats,
  default one bar); `--hit 450f` places the drop at a chosen frame; `--voice` ducks 10 dB from 0.15 s before to 0.5 s
  after voice phrases; one gain to −14 LUFS plus a −1 dBTP limiter only if needed. **No time stretch.** Outputs
  `fitted.wav`, `cues.json` (fps, frames, bpm, beats/bars as frames, hits, seams with likeness, drop, fade),
  `seams.png`, `FIT.md`. Limits: half/double tempo errors (`--bpm` override), bar lines can be a beat off, vocals can
  be cut mid-line (instrumentals best), tested only on Ubuntu. Example: `npx musicfit@latest track.mp3 --length 900f
  --hit 450f --fps 30`. — [EminBudak/musicfit](https://github.com/EminBudak/musicfit)
- **all-in-one (allin1)** (MIT): outputs BPM, beats, downbeats, beat positions, and labelled segments (intro, verse,
  chorus, bridge, inst, solo, break, outro, start, end); needs PyTorch, NATTEN (auto-installed on macOS), madmom from
  GitHub, Demucs; CPU fallback when no CUDA; author advises converting MP3 to WAV because decoders add 20–40 ms
  offsets; 10 songs / 33 min in 73 s on an RTX 4090 (no CPU timing). — [mir-aidj/all-in-one](https://github.com/mir-aidj/all-in-one)
- **PyMusicLooper** (MIT, Python ≥ 3.10): finds and ranks loop points on detected beats (`--brute-force` for the whole
  track); `export-points` prints `loop_start loop_end note_difference loudness_difference score`; `extend
  --extended-length <s>` builds a longer version; default minimum loop is 35 % of the track. —
  [arkrow/PyMusicLooper](https://github.com/arkrow/PyMusicLooper)
- **Rubber Band** CLI: `-D/--duration X` stretches to exactly X seconds, `-t` ratio, `-T` tempo multiple; `-3/--fine`
  selects the R3 engine which "almost always produces better results than the R2 engine" at higher CPU; `-c` crispness
  only affects R2; `--centre-focus` preserves centre material. — [Rubber Band usage](https://breakfastquay.com/rubberband/usage.txt)
- Rubber Band licence: GPL; proprietary distribution needs a commercial licence. —
  [breakfastquay.com/rubberband](https://breakfastquay.com/rubberband/)
- ffmpeg `acrossfade` takes `d` (duration) and curve `c1`/`c2`; `afade` has `t` in/out and `curve` (tri default,
  exp, log, …). — [ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html)
- **Commercial products**: Epidemic Sound **Adapt** (launched Sept 2025, trained only on its own/licensed catalogue)
  edits length with 15/30/60 s presets or any duration up to 5 min, can loop, length edits cost no credits. API
  `POST /v0/tracks/versions` with `durationMs` (1 s–5 min) returns a version that keeps the structure (extends the
  arrangement if longer); `GET /v0/tracks/{id}/highlights?duration=15` returns the best-performing `from`/`to` window
  for short clips, and the docs advise a 0.5–1 s fade at that cut because it may not align with phrases. —
  [Epidemic Sound Adapt](https://www.epidemicsound.com/tools/adapt/); [Create versions (Beta)](https://developers.epidemicsound.com/docs/create-versions/); [Soundtracking with LLM](https://developers.epidemicsound.com/docs/soundtracking-with-llm/); [MBW](https://www.musicbusinessworldwide.com/epidemic-sound-launches-ai-tool-that-lets-creators-modify-licensed-tracks-expands-artist-compensation-model/)
- **Soundstripe AI Song Editor** (with DAACI, Sept 2024) splits a song into self-contained snippets the user can loop,
  delete or rearrange to a length. — [No Film School](https://nofilmschool.com/soundstripe-ai-song-editor); [DAACI](https://daaci.com/welcomes-soundstripe/)
- **Artlist Music Match** times a soundtrack to an uploaded short clip, but has no length-edit tool; trimming/fades
  are done in your editor. — [Artlist Music Match](https://artlist.io/ai/presets/music-match)
- **editly** (MIT): `audioTracks` with `cutFrom/cutTo/start/mixVolume`, `loopAudio`, automatic audio crossfades on
  transitions, `audioNorm` via dynaudnorm; no musical (bar-aware) fitting. — [mifi/editly](https://github.com/mifi/editly)

### Inferences
- For 8–30 s videos the problem is mostly **"pick the best window and end it well"**, not extending: choose a window of
  whole bars (CLAP/energy or a "highlight" heuristic picks the start; allin1's segment labels let you start on a
  section boundary such as a chorus), then end on (a) the track's own ending spliced in on a bar line (best), or
  (b) a bar-long fade ending on a beat. Epidemic's own API resorts to a plain fade for short highlights, so a fade
  is industry-acceptable.
- Duration rounding: at 120 BPM a bar is 2.0 s, so the closest whole-bar length is within ±1 s of the video. Close the
  gap by (1) adjusting video length (the pipeline controls the HTML timeline, cheapest), (2) a rubberband
  `--fine -D` stretch only if the ratio stays within a few percent (rule of thumb, not sourced), or (3) a fade tail.
- Practical integration: shell out from Node to `npx musicfit --length <frames>f --fps 30 --hit <revealFrame>f
  --json` and read `cues.json`; validate on macOS first. Fallback in-house: beat_this downbeats + a ~100-line DP over
  bars using chroma/MFCC similarity (librosa) mirrors musicfit.
- Rubber Band and pedalboard being GPL matters only if the company *distributes* software; running GPL tools in a
  private pipeline and publishing the audio output is generally not restricted by GPL (output is not a derivative of
  the program), but this is an inference, not legal advice.

### Gaps
- MSAF not researched (allin1 covers structure for this use case). No CPU/MPS speed figure for allin1 on Apple Silicon.
- Epidemic Adapt's internal cut-point algorithm is not documented publicly.
- Beatoven.ai length tools: nothing found.
- No published threshold for audible rubberband stretch on music; "a few percent" is a practitioner rule of thumb.

## 3. Aligning visual events to beats

### Takeaway
Because the video is rendered from code, **move the animation, not the music**: fit the music first, get beat/downbeat
times in the *fitted* file, then snap each reveal/scene start in the GSAP timeline to the nearest downbeat (or beat)
within a tolerance, using GSAP's absolute numeric positions or labels.

### Cited Findings
- GSAP position parameter: a number is an absolute time (`tl.to(".class", {x:100}, 3)` inserts "exactly 3 seconds
  from the start"); labels via `tl.add("scene1", 2)` and offsets like `"scene1+=3"`, `"<"`, `">"`. —
  [GSAP position parameter](https://gsap.com/resources/position-parameter/)
- musicfit's `--hit` places the track's drop on a chosen frame and `cues.json` exports beats and bars as **frame
  numbers** at the given fps — directly usable as animation targets. — [musicfit](https://github.com/EminBudak/musicfit)
- Remotion has no beat-detection API; `@remotion/media-utils` gives per-frame spectrum (`visualizeAudio`, values 0–1)
  and waveform; if the audio is shifted/trimmed, the frame passed in must be offset accordingly. —
  [Remotion audio visualization](https://www.remotion.dev/docs/audio/visualization); [visualizeAudio()](https://www.remotion.dev/docs/visualize-audio)
- Open-source "Remotion + music" engines expose helpers like `beatsToFrames` / `barsToFrames` to lock transitions to
  tempo. — [floomhq/opencut](https://github.com/floomhq/opencut) (via search snippet)
- Beatcut quantises clip lengths to whole bars so cuts land on beats (assumes 4/4, heuristic downbeats). —
  [HoangThongTom/Beatcut](https://github.com/HoangThongTom/Beatcut)

### Inferences
- Recipe: `timeline.json` (intended times) + `cues.json` (beats/downbeats in seconds of the fitted bed) →
  `snap(t) = nearest downbeat if |Δ| ≤ ~0.25 s, else nearest beat if |Δ| ≤ ~0.12 s, else leave`; the main reveal can
  instead be pinned *as the music's hit* (`--hit`). Inject as GSAP labels (`tl.add("reveal", 6.48)`) so tweens use
  `"reveal"` / `"reveal-=0.2"` — the timeline stays readable and re-snappable. Count-ups can be given a duration of
  whole beats so their final tick lands on a beat; per-beat "tick" SFX can be generated from the beat list.
- Order of operations: total length (from content) → fit music → analyse fitted file (re-run beat tracking on the
  output, since seams shift beat times) → snap animation → render → mux. Snapping visuals by up to ±0.25 s is
  invisible to viewers but makes the cut feel intentional; moving the music would need re-fitting.

### Gaps
- No user-study source found on how much snap tolerance is perceptible; tolerances above are design guesses.

## 4. Mixing: SFX layering, ducking, EQ/compression, phone speakers, mono

### Takeaway
Everything needed exists in ffmpeg (`adelay`+`amix` for SFX at timeline times, `sidechaincompress` or volume
automation for ducking, `highpass`/`equalizer`, `acompressor`, `alimiter`); pedalboard (GPL-3.0, Apple Silicon wheels)
is a nicer Python API for the same chain. For a music-only bed with code-known SFX times, **deterministic volume
automation** (dip the bed 3–6 dB around known SFX/reveal times) is simpler and more predictable than a sidechain.

### Cited Findings
- **pedalboard** (Spotify): GPL-3.0 (core from JUCE 6, dual-licensed; Rubber Band dual-licensed); plugins include
  Compressor, Gain, Limiter, HighpassFilter, LowpassFilter, LadderFilter, Reverb, Delay, Convolution, PitchShift,
  Bitcrush, MP3Compressor, Resample; `time_stretch` uses Rubber Band; wheels for Intel and Apple Silicon; reads/writes
  WAV/FLAC/MP3/OGG/AIFF natively. No shelf-EQ plugin listed. — [spotify/pedalboard](https://github.com/spotify/pedalboard)
- ffmpeg `acompressor` defaults: ratio 2, attack 20 ms, release 250 ms, threshold 0.125, RMS detection. —
  [ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html)
- musicfit ducking model: −10 dB from 0.15 s before each voice phrase to 0.5 s after (default `--duck 10`). —
  [musicfit](https://github.com/EminBudak/musicfit)
- editly's approach to ducking is `audioNorm` via ffmpeg `dynaudnorm`. — [editly](https://github.com/mifi/editly)

### Inferences
- SFX layering recipe: SFX events come from the timeline JSON (tick per count-up step, click on card flip, whoosh
  starting ~0.2–0.3 s *before* a scene transition so its peak lands on the cut). Build one ffmpeg graph:
  `[sfx_i]adelay=<ms>|<ms>,volume=<g>` → `amix=inputs=N:normalize=0` (normalize=0 so levels don't shift with
  count) → mix with bed → master. Keep SFX peaks ~3–6 dB above the bed locally; pre-normalise each SFX file once.
- Bed EQ for phone speakers: highpass ~80–120 Hz on the bed (phone speakers don't reproduce deep bass, and the energy
  only eats headroom), slight presence lift 2–4 kHz if it's dull; check the mono fold-down (`pan=mono|c0=0.5*c0+0.5*c1`)
  for phasey/vanishing elements. These are standard mixing practices; no primary source was fetched for them.
- pydub (MIT, simple overlay/gain/fades) is fine for prototyping but adds a Python dependency for little gain over
  ffmpeg in a Node pipeline.
- Licence summary for the mix stage: ffmpeg filters (LGPL/GPL build) ✓, pedalboard GPL ✓ for internal use, Rubber Band
  GPL ✓ internal use; all "fine to use outputs commercially" by inference, but don't ship them inside a distributed
  closed product.

### Gaps
- No authoritative source fetched on loudness targets specific to phone speakers or on Instagram's own normalisation
  in 2026 (covered by prior research on −14 LUFS).
- Full parameter text for `sidechaincompress`, `alimiter`, `equalizer`, `stereotools` not retrieved this round (page
  truncated); names are from the ffmpeg filter documentation.

## 5. QA automation

### Takeaway
Automate a pass/fail report per render from ffmpeg measurements (integrated LUFS, true peak, LRA via `ebur128` /
`loudnorm print_format=json`; clipped samples and peak via `astats`; gaps via `silencedetect`; tail energy in the last
200–500 ms for abrupt endings; seam list from `cues.json`), then give the owner a short listening checklist.

### Cited Findings
- musicfit produces a `seams.png` visual map, a human/agent-readable `FIT.md`, and `seams[]` with a `likeness` score
  per seam — usable as QA signals (low-likeness seams → listen there first). — [musicfit](https://github.com/EminBudak/musicfit)
- musicfit measures with ffmpeg's EBU R128 meter and applies a true-peak limiter only when gain would exceed −1 dBTP.
  — [musicfit](https://github.com/EminBudak/musicfit)
- PyMusicLooper exports per-candidate `note_difference` and `loudness_difference` — usable as seam-quality metrics. —
  [PyMusicLooper](https://github.com/arkrow/PyMusicLooper)
- ffmpeg provides `astats`, `silencedetect`, `ebur128` filters (documented in the filter reference). —
  [ffmpeg filters](https://ffmpeg.org/ffmpeg-filters.html)

### Inferences
- Suggested checks (thresholds are proposals): integrated −14 ±1 LUFS; true peak ≤ −1.0 dBTP; zero clipped samples
  (`astats` peak count at 0 dBFS); no `silencedetect` span > 0.3 s except an intentional tail; **abrupt-ending check**:
  RMS of the last 100 ms must be ≥ X dB below the bed's median, or the last musical event must be a detected final
  hit/fade end within ±1 frame of video end; audio duration = video duration to the frame (`ffprobe`); stereo
  correlation/mono fold-down loss < ~3 dB; every SFX onset within ±1 frame of its timeline event.
- Owner listening check (in the review app next to the draft): play on the phone speaker at normal volume; mark
  "music too loud / too quiet vs SFX", "ending sounds cut", "seam audible at mm:ss", "mood wrong". Record verdicts per
  track in `library.json` so bad tracks/seams are excluded next time.

### Gaps
- No open-source tool found that scores "abrupt ending" or seam audibility directly; the heuristics above are
  untested.

## 6. Real-world open-source pipelines that auto-score/auto-fit, and what worked

### Takeaway
The open-source landscape is mostly **beat-synced video cutters** (music fixed, video cut to it) built on
librosa+ffmpeg; the one tool aimed at the reverse problem (fit music to a fixed video length, bar-aware, with endings
and drop placement) is **musicfit**, which matches this pipeline's needs and stack (Node + ffmpeg) closely.
Commercial libraries (Epidemic, Soundstripe) confirm the same design: semantic text search + structure-aware length
editing + fade fallback.

### Cited Findings
- musicfit: Node, MIT, an Agent Skill for Claude Code (`npx skills add MakersMCP/musicfit`); 127 commits, 1 star, no
  releases; known issues listed above. — [EminBudak/musicfit](https://github.com/EminBudak/musicfit)
- Beatcut (Python, ffmpeg, librosa): picks highlight moments and cuts to downbeats, clips quantised to whole bars,
  `--target-duration`; limitations: assumes 4/4, heuristic (not trained) downbeats, pads short music with silence. —
  [Beatcut](https://github.com/HoangThongTom/Beatcut)
- music-video-cli: BPM/key detection, bar-aligned shot lists, finds the most energetic 15 s / 30 s windows; CLI + MCP
  server. — [aimusicvideogen-com/music-video-cli](https://github.com/aimusicvideogen-com/music-video-cli)
- BeatSync-Engine (librosa): auto mode cuts more in chorus, fewer in intro/outro. —
  [Merserk/BeatSync-Engine](https://github.com/Merserk/BeatSync-Engine/blob/main/auto_mode.py)
- Others: StemSyncVideoEditor (stem-energy-driven cuts), av-sync (ffmpeg filter graph), CtrlBeat (AGPL, Windows). —
  [StemSyncVideoEditor](https://github.com/vrgamegirl19/StemSyncVideoEditor); [av-sync](https://github.com/devbret/av-sync); [CtrlBeat](https://github.com/ActArtech/CtrlBeat)
- Epidemic API flow (LLM brief → semantic search → preview → `versions`/`highlights` + fade). —
  [Epidemic Sound developers](https://developers.epidemicsound.com/docs/soundtracking-with-llm/)

### Inferences
- Proposed pipeline step `music-bed` for this repo:
  1. **select**: brief from the draft → CLAP ranking over the pre-indexed local library (+ hard filters, recency) →
     top 3 offered to the owner with previews; owner pick stored in the draft.
  2. **fit**: `musicfit --length <frames>f --fps <fps> --hit <mainRevealFrame>f --json` (or in-house DP over
     beat_this bars), end = natural if possible else 1-bar fade.
  3. **align**: re-analyse the fitted file → snap GSAP labels to downbeats → render.
  4. **mix**: SFX at timeline times + bed automation dips → bed highpass.
  5. **master**: existing two-pass loudnorm −14 LUFS / −1 dBTP → AAC 128 k 48 kHz.
  6. **QA**: automated report (Section 5) + owner listening check before approval.
- Hardware: all of this is light (seconds per 30 s clip on CPU); none of it needs the "heavy job" go-ahead except a
  first-time indexing of a large library with a big model.

### Gaps
- No public write-ups found of production teams measuring engagement effects of auto-fitted vs hand-edited music.
- musicfit's quality on macOS and on typical stock-library instrumentals is unverified; needs a lab test on 5–10
  library tracks before adoption.
