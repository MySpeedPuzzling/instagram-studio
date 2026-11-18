# Automating a tailored music brief from a video (or its storyboard/code), and planning music structure from the timeline (state as of Nov 2026)

Scope: video → music brief → structure plan → ACE-Step 1.5 XL generation → automatic pre-ranking before the owner listens.
Evidence labels used below: **[primary]** = paper / official repo / official docs; **[community]** = forum, GitHub
discussion, blog; **[inference]** = my reasoning, not from a source.

## 1. Research systems that condition music on video (or on text derived from video): what they extract, how they map it, licences

### Takeaway
Research has two branches: (a) end-to-end video-conditioned generators (VidMuse, MuVi, Video2Music, GVMGen, Diff-V2M,
EMSYNC, NarraScore), which need training and mostly lack commercially usable weights; and (b) "text bridge" pipelines,
where a VLM/LLM turns the video into a music description that feeds an off-the-shelf text-to-music model (SONIQUE,
Mozart's Touch, VMB, CoT-VTM, FilmComposer). Branch (b) is exactly the MSP setup (Claude = the bridge, ACE-Step = the
generator), and nothing in branch (a) is worth installing for a code-rendered Reel whose timeline is already known.

### Cited findings
- Two surveys map the field: "Vision-to-Music Generation: A Survey" (ISMIR 2025, arXiv 2503.21254) with a curated list at
  wzk1015/Awesome-Vision-to-Music-Generation, and "A Comprehensive Survey on Generative AI for Video-to-Music
  Generation" (arXiv 2502.12489, also ACM, doi 10.1145/3816020) [primary] — [ISMIR survey](https://arxiv.org/pdf/2503.21254); [Awesome list](https://github.com/wzk1015/awesome-vision-to-music-generation); [ACM survey](https://arxiv.org/pdf/2502.12489)
- Comparison per the Awesome list: Video2Music (2023/11, symbolic, CLIP features, autoregressive, ~5 min); VidMuse
  (2024/06, audio, ~20 s, CLIP + adapter, autoregressive on MusicGen); MuVi (2024/10, audio, ~20 s, VideoMAE V2 +
  adapter, diffusion/flow matching); GVMGen (2025/01); AudioX (2025/03) [primary] — [Awesome list](https://github.com/wzk1015/Awesome-Vision-to-Music-Generation/blob/main/README.md)
- VidMuse (CVPR 2025) is trained end-to-end on V2M, ~360K video–music pairs (trailers, ads, documentaries); the ACM
  survey lists it at 7.87G params trained on 64 H800 GPUs [primary] — [VidMuse CVPR paper](https://openaccess.thecvf.com/content/CVPR2025/papers/Tian_VidMuse_A_Simple_Video-to-Music_Generation_Framework_with_Long-Short-Term_Modeling_CVPR_2025_paper.pdf); [ACM survey](https://arxiv.org/pdf/2502.12489)
- MuVi uses a visual adaptor and contrastive training with mismatched (asynchronous) video–music pairs as negatives, to
  penalise out-of-sync music [primary] — [MuVi arXiv](https://arxiv.org/pdf/2410.12957v1)
- What gets extracted and how it maps (survey synthesis) [primary]:
  - Motion/rhythm: optical flow or RGB frame differences; CMT maps video timing → beat, motion speed → note density,
    motion saliency → note strength; V-MusProd uses RGB differences to set tempo.
  - Scene cuts: Video2Music uses PySceneDetect scene offsets; EMSYNC uses ffmpeg boundaries as temporal conditioning;
    VeM intersects visual transitions with music beats.
  - XMusic maps scene transitions → tempo, optical-flow intensity → note density, visual beat saliency → beat strength.
  - Emotion: CLIP emotion probabilities over six classes (Video2Music); valence–arousal (EMSYNC); colour-histogram
    emotion (Diff-V2M); FilmComposer uses an LLM to label colour hue and brightness.
  - Semantics (CLIP/I3D/VideoMAE) drive overall mood/genre, not specific parameters.
  — [ACM survey HTML](https://arxiv.org/html/2502.12489)
- Text-bridge pipelines (survey) [primary]: SONIQUE: Video-LLaMA describes the video → LLM turns it into musical tags →
  CLAP-conditioned diffusion; Mozart's Touch: BLIP captions aggregated by an LLM into a MusicGen prompt; VMB: an
  InternVL2-based "multimodal music description model" writes genre/mood/instrument descriptions; CoT-VTM:
  chain-of-thought prompt maps visual captions → music description → MusicGen; M2UGen/MuMu-LLaMA: LLM embeddings
  condition MusicGen or AudioLDM 2 (embeddings, not text) — [ACM survey HTML](https://arxiv.org/html/2502.12489); [CoT-VTM, ACL Findings 2025](https://aclanthology.org/2025.findings-acl.647.pdf); [M2UGen](https://arxiv.org/pdf/2311.11255)
- The survey's stated reason for text bridges: without paired video–music data, methods "translate visual content into
  text prompts (via LLM reasoning or learned prediction) and then generate music using off-the-shelf text-to-music
  models" [primary] — [ACM survey](https://arxiv.org/pdf/2502.12489)
- FilmComposer (CVPR 2025): visual processing → rhythm-controllable MusicGen (a chromagram "rhythm conditioner",
  fine-tuned on their MusicPro-7k set of ~7,418 clips with visual description, music description, melody and "rhythm
  spots") → multi-agent assessment, arrangement and mix; it mimics a human film composer's workflow [primary] — [FilmComposer paper](https://openaccess.thecvf.com/content/CVPR2025/papers/Xie_FilmComposer_LLM-Driven_Music_Production_for_Silent_Film_Clips_CVPR_2025_paper.pdf); [project page](https://apple-jun.github.io/FilmComposer.github.io/)
- EMSYNC ("Video Soundtrack Generation by Aligning Emotions and Temporal Boundaries", arXiv 2502.10154): video emotion
  classifier → categorical emotions mapped to valence–arousal; "boundary offsets" let the generator anticipate the next
  scene cut and place chord changes on it; output is symbolic MIDI; demo only, paper CC BY-NC-ND [primary] — [arXiv 2502.10154](https://arxiv.org/abs/2502.10154)
- NarraScore (arXiv 2602.09070, 2026): frozen VLMs used as "continuous affective sensors" produce narrative-aware
  valence–arousal trajectories; a global semantic anchor keeps style stable while a token-level adapter modulates local
  tension; no code link found [primary] — [arXiv 2602.09070](https://arxiv.org/abs/2602.09070)
- Other 2025–2026 entries found but not read in depth: Diff-V2M (explicit rhythmic modelling, arXiv 2511.09090) and
  JenBridge (long-form soundtracking across scene transitions, arXiv 2606.01703) [primary, titles only] — [Diff-V2M](https://arxiv.org/pdf/2511.09090); [JenBridge](https://arxiv.org/pdf/2606.01703)
- Licences of reusable parts:
  - FilmComposer: no code repo or licence found [primary, absence] — [project page](https://apple-jun.github.io/FilmComposer.github.io/)
  - VMB repo README says MIT but "We will release our code soon" (code status not confirmed) [primary] — [wbs2788/VMB](https://github.com/wbs2788/VMB)
  - InternVL (the VLM under VMB) is MIT with parts under other licences [primary] — [OpenGVLab/InternVL](https://github.com/opengvlab/internvl)
  - MusicGen/AudioCraft: code MIT, weights CC-BY-NC 4.0 → anything fine-tuned on MusicGen (VidMuse, FilmComposer,
    CoT-VTM's generator, M2UGen's MusicGen path) inherits non-commercial weights [primary for MusicGen; inference for
    derivatives] — [search summary citing AudioCraft licence; MusiConGen repo](https://github.com/Cyan0731/MusiConGen)

### Inferences
- [inference] The MSP builders already know, exactly, what the research systems try to estimate from pixels: scene
  cuts (storyboard timings), impacts and "rhythm spots" (cues.json), the key moment and outro. Pixel-based extractors
  (optical flow, PySceneDetect, emotion classifiers) add nothing except as a cross-check on the rendered MP4.
- [inference] The useful ideas to copy are mappings, not models: (1) scene transitions/impact density → tempo and note
  density (CMT, XMusic); (2) emotion as a valence–arousal *curve* over time, not one mood word (EMSYNC, NarraScore) →
  becomes per-section energy descriptors; (3) chord/section changes anticipated at boundaries (EMSYNC) → section tags
  aligned to scene changes; (4) FilmComposer's split into "describe → compose with rhythm control → assess/mix", which is
  the MSP brief → ACE-Step → fit.py pipeline.
- [inference] CoT-VTM's finding that a chain-of-thought mapping beats a plain caption→prompt is a cheap thing to copy:
  have Claude reason visual facts → musical attributes explicitly before writing the ACE-Step caption.

### Gaps
- Exact licences of Video2Music, MuVi, VidMuse, V2Meow and M2UGen code/weights were not verified one by one (V2Meow is a
  Google paper; I found no released weights). None is needed for MSP.
- Quantitative results of CoT-VTM vs plain prompting were not extracted.

## 2. Practical "VLM → music prompt" workflows in products and creator practice (2025–2026)

### Takeaway
Shipping products expose a small, consistent attribute set: vibe/mood, style/genre, purpose, energy, tempo, and length
= video length (Adobe Firefly). The most structurally useful product design is ElevenLabs' "composition plan" with
per-section duration and local styles, a good template for the MSP brief format even though MSP generates locally.

### Cited findings
- Adobe Firefly "Generate Soundtrack" (beta 2025, now "Generate music", GA): upload a video and receive "a tailored
  prompt based on its content, such as vibe, style, purpose, energy, and tempo", editable before generation; "Vibe"
  options include chill, happy, sad, romantic, dark; duration defaults to the uploaded video's length; four variations;
  Adobe says the model is trained on licensed music [primary] — [Adobe help: generate music for videos](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/generate-soundtrack-for-an-uploaded-video.html); [Adobe help (IN mirror)](https://helpx.adobe.com/in/firefly/web/work-with-audio-and-video/work-with-audio/generate-soundtrack-for-an-uploaded-video.html)
- ElevenLabs Music API composition plans [primary]:
  - v1 plan: global styles + `sections[]`, each with `section_name`, `positive_local_styles`, `negative_local_styles`,
    `duration_ms` (3 000–120 000 ms) and `lines`; `respect_sections_durations` (default true) "precisely respects each
    section's duration_ms".
  - music_v2 / v2_5 (API added June 2026): ordered `chunks`, each with text (section label, lyrics, inline cues),
    `duration_ms`, positive/negative styles and `context_adherence`; audio-reference chunks (song_id + start/end ms) for
    inpainting/extending/looping; `respect_sections_durations` is ignored for v2.
  — [ElevenLabs composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans); [compose-detailed API](https://elevenlabs.io/docs/api-reference/music/compose-detailed); [elevenlabs/skills music reference](https://github.com/elevenlabs/skills/blob/main/music/references/api_reference.md)
- No ElevenLabs feature that takes a video upload and writes the music prompt was found [primary, absence] — [search results, Adobe/ElevenLabs](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/generate-soundtrack-for-an-uploaded-video.html)
- SunoPrompt (third-party) claims "drop in a video and get a scored soundtrack", using Gemini 2.5 Flash / Gemini 2.0 /
  GPT-4o Mini for prompt generation [community/vendor claim] — [sunoprompt.com](https://sunoprompt.com/)
- A 2026 review notes that with Suno, duration matching is manual and mood calibration happens through prompting, not
  analysis of the footage; Suno's standard interface doesn't take BPM/key parameters, so creators write "slow 70 BPM
  lo-fi beat" into the text [community] — [Sonilo blog](https://sonilo.com/blog/ai-music-video-creators-2026); [aivideobootcamp guide](https://aivideobootcamp.com/blog/suno-ai-complete-guide-2026/)
- Typical soundtrack-bed prompts from creators: instrumental, ~100 BPM, "sparse midrange" to leave room for voice, no
  vocals [community] — [thegenaimagazine](https://thegenaimagazine.com/suno-ai-tutorial-prompts-examples-monetize-music)
- ACE-Step's own guidance for the caption (the field that matters most): combine style, emotion, instruments, timbre,
  era, production, vocals, rhythm and structure hints; "specific beats vague"; avoid conflicting style words (or turn
  them into a sequence over time); put BPM/key in the metadata parameters, not the caption [primary] — [ACE-Step 1.5 Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- The ACE-Step repo ships its own Claude skill for songwriting (`.claude/skills/acestep-songwriting/SKILL.md`) including a
  "Duration Calculation" section tying BPM to duration [primary] — [acestep-songwriting SKILL.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/.claude/skills/acestep-songwriting/SKILL.md)

### Inferences
- [inference] Proposed MSP brief schema (JSON written by Claude, rendered into ACE-Step inputs by code), merging the
  Firefly attribute set with the ElevenLabs section model:
  `{ arc, vibe, purpose, energy_curve: [{t, level}], instruments, avoid, bpm, key, timesig,
  sections: [{tag, bars, start_s, end_s, energy, local_style, anchor_cue}], duration_s, signature_key }`.
  Inputs Claude reads: the builder's storyboard comment block, cues.json, 3–6 keyframes (Claude vision) and the post
  type's house template from standing feedback. Output becomes: ACE-Step `caption` (global style, no BPM), `lyrics` =
  `[Intro - sparse] [inst] … [Build - rising] [Drop - full] [Outro - calm]`, `bpm`, `keyscale`, `timesignature`,
  `duration`.
- [inference] Reading the ACE-Step repo's bundled songwriting skill before writing MSP's own brief prompt is cheap and
  aligns with how the model authors expect captions to be written.
- [inference] Because the timeline is in code, the brief can be generated deterministically for the structural half
  (BPM, bars, section times: script) and by Claude for the expressive half (vibe, instruments, local styles). This
  keeps the numbers exact and the taste human-reviewable.

### Gaps
- CapCut/Descript auto-music features were not researched in detail (no primary docs found within the call budget).
- Firefly's internal attribute extraction (what model, which signals) is not documented beyond the five attributes.

## 3. Structure planning: scene timings → bars at a chosen BPM; does ACE-Step respect section proportions; alternatives

### Takeaway
ACE-Step 1.5 has no per-section duration control: structure comes from tags in the lyrics plus one global duration,
and BPM is "guidance" (120 may come out 118–122). So plan in bars, pick a BPM that puts the key cue on a downbeat, write
proportionate tags, generate longer than needed, then *measure* the result (beats/downbeats/drop) and let fit.py align
it; use Repaint or Cover-from-scaffold only when proportions keep missing.

### Cited findings
- ACE-Step 1.5: duration is one global parameter (10–600 s in the inference API; ≤0/None lets the model choose from
  lyric length); structure tags ([Intro], [Verse], [Chorus], [Bridge], [Build], [Drop], [Instrumental], [Outro],
  [Fade Out], descriptors like "[Chorus - anthemic]") are "the most powerful tool in Lyrics"; lyrics are the "temporal
  script" but no mapping from tags to seconds is documented [primary] — [ACE-Step Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md); [Musician's Guide](https://ace-step.github.io/ACE-Step-1.5/en/ace_step_musicians_guide)
- BPM 30–300, key and time signature are "guidance, not exact commands"; the model samples near the value (120 →
  118 or 122) [primary] — [ACE-Step Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Stability: 30–60 s and 2–4 min generations are stable; very long ones can repeat or lose structure; known failure =
  blurred section boundaries; keep tags concise and put complex style in the caption [primary] — [ACE-Step Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- The optional 5 Hz LM planner does chain-of-thought "Structure Planning", caption optimisation and metadata inference
  (BPM/key/timesig) from caption + lyrics [primary] — [ACE-Step Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Users report structure not being followed: extra duration can produce a "1+ minute long intro"; the model drops
  lines/sections when syllable density doesn't fit; maintainers-side comment that the model can't follow too much
  structured description, "partly due to limited capacity" [community, issue thread] — [ACE-Step issue #391](https://github.com/ace-step/ACE-Step-1.5/issues/391)
- Third-party integrations observe: takes end 2–5.5 s early with silence (fix: request extra seconds, trim + fade); a
  forced 8 s clip spends ~4 s as quiet intro [community] — [rock3r/cav #99](https://github.com/rock3r/cav/issues/99); [ProsperoAI #36](https://github.com/quatrixone/ProsperoAI/issues/36)
- A Hacker News user found clear section labels push the model toward song form rather than a continuous loop
  [community] — [HN thread](https://news.ycombinator.com/item?id=46948483)
- Repaint: `repainting_start/end` regenerate a 3–90 s interval using surrounding audio as context ("change Verse to
  Chorus" in an interval; complete beginning/middle/end); chained repaints can extend audio; Lego/Complete (add tracks)
  are Base-model only [primary] — [ACE-Step Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Reference audio vs source audio: `reference_audio` controls timbre/mix globally (time-averaged; sampled as 10 s
  segments from front/middle/back); `src_audio` + `audio_cover_strength` (0–1) in Cover mode controls melodic
  structure; the LM is skipped in Cover mode [primary + community] — [ACE-Step Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md); [Discussion #398](https://github.com/ace-step/ACE-Step-1.5/discussions/398)
- Community cover guide claims "Structure preserved: melody shape, song sections, energy arc, timing"; suggests
  strength ~0.3–0.5 for a dramatic genre change, start at 0.5–0.6; but one user got "something entirely different" and
  another got noise above 0.07: unresolved, not official [community, conflicting] — [Discussion #398](https://github.com/ace-step/ACE-Step-1.5/discussions/398)
- Hit-point tempo finding is a standard film-scoring tool: you enter hit timecodes and get the best-fitting BPMs with
  per-hit error in ms/frames (Frans Absil calculator, ilovemedia Tempo Finder with 0.1–1 BPM steps returning the 4 best,
  FilmScoringTips Beat-Sync Calculator, Hotpoint) [primary tool pages] — [Frans Absil](https://www.fransabsil.nl/htm/eventhit.htm); [ilovemedia Tempo Finder](https://ilovemedia.es/tempo-finder-for-film-scoring/); [FilmScoringTips](https://filmscoringtips.com/beat-sync-calculator/)
- ElevenLabs is the only generator found that honours per-section `duration_ms` (v1 with `respect_sections_durations`)
  — a cloud reference for what "section timing" control looks like [primary] — [ElevenLabs composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans)

### Inferences (proposed algorithm; not tested)
- [inference] **BPM choice.** In 4/4 one bar = 240/BPM s. For the drop to land on a downbeat at `t_key` with the music
  starting at `t0`, need `t_key − t0 = n·240/BPM` → `BPM = 240·n/(t_key − t0)` for integer bars `n`. Enumerate n and the
  house BPM window (e.g. 100–128), score each candidate by: secondary cues (scene changes, `outro`) landing within
  ±40 ms of a beat (±1 frame at 25–30 fps) and preferably a bar/half-bar; penalty for distance from the post type's house
  BPM. This is the film-scoring tempo-finder, automated. Worked example: key at 9.6 s, t0 = 0 → n = 5 → 125 BPM; n = 4 →
  100 BPM. Allowing a short pickup (t0 < 0, music starts before frame 0 via fit.py offset) widens choices.
- [inference] **Because ACE-Step drifts ±2 BPM and doesn't honour proportions**, the BPM chosen above is a *target*,
  not a guarantee; fit.py must re-detect beats/downbeats on each candidate and either (a) offset so its measured drop
  sits on `key`, or (b) time-stretch by a few % (≤3 % is generally inaudible for beds — not sourced) so its tempo
  matches the plan.
- [inference] **Bar budgets for 15/30/45 s at ~120 BPM (2 s/bar):**
  - 15 s Story/Reel (≈7.5 bars): intro 2 bars (hook) · build 2 · drop/key 2–4 · outro 1–2 under the CTA/sticker.
    Generate 20–24 s (video + 30–50 %: ACE-Step's intros run long on short clips) and cut.
  - 30 s (15 bars): intro 2–4 · build 4 · drop 4–6 · outro 2–4.
  - 45 s (22.5 bars): intro 4 · section A 4–8 · build 4 · drop 4–8 · outro 2–4.
  Write the tags in these proportions; even if seconds don't match, the *order* and energy contour usually survive, and
  measured analysis decides where the drop really is.
- [inference] **Ask for a longer song than the video** (the existing plan's +20–30 %, maybe more for 15 s), so the
  fitter has a real drop and a real ending to pick from; ACE-Step is reported stable at 30–60 s, so 15 s requests
  should be avoided.
- [inference] **Fallback ladder when proportions miss:** (1) regenerate with different seed (cheapest); (2) Repaint the
  interval around the planned drop with "[Drop - full]" to force an energy change exactly there (3–90 s window fits);
  (3) Cover-from-scaffold: render a click + kick/snare guide (or the house bed's stems) with the exact bar plan and
  energy steps, pass as `src_audio` with low–mid `audio_cover_strength` so timing comes from the scaffold and timbre from
  the caption / `reference_audio`. (3) is promising but **unverified**: community reports conflict and a pure drum
  scaffold has no melody to "cover"; it needs a lab test (one evening, light GPU) before relying on it.
- [inference] The 5 Hz LM planner should probably be off (or its metadata overridden) when Claude/script have already
  chosen BPM/key, so the LM doesn't re-infer a different tempo.

### Gaps
- No primary report found measuring whether ACE-Step 1.5/XL section lengths follow tag proportions; MSP would have to
  measure it (generate N beds with a fixed bar plan, detect section boundaries, compare).
- No report found of anyone using a click/drum guide track as Cover source to impose timing on ACE-Step.
- No source found for safe time-stretch percentages on generated beds.

## 4. Evaluation: automatic checks that a bed matches the brief, and ranking 3–4 candidates before the owner listens

### Takeaway
A licence-clean local ranker is feasible: beat_this (MIT code and weights) for tempo/beats/downbeats, librosa-style
RMS/onset curves for the energy-vs-cue check, LAION CLAP (CC0 / Apache-2.0 checkpoints) for text–audio similarity to the
brief, and optionally Meta Audiobox Aesthetics (CC-BY-4.0, attribution required) for production quality. Avoid madmom's
models/DBN and SongEval (non-commercial).

### Cited findings
- Video-to-music papers evaluate with: CLAP score (text/audio embedding cosine), ImageBind / LanguageBind video–music
  scores, KL over PANNs labels, FAD (VGGish/PANNs); temporal sync via Beats Coverage/Hit scores, BeatAlign, scene-cut
  alignment (recall of scene changes landing on beats within 0.1 s, SceneDetect), AV-Align (audio onset peaks vs
  optical-flow peaks within 3 frames), Beats IoU [primary] — [ACM survey HTML](https://arxiv.org/html/2502.12489)
- LAION CLAP: repo CC0-1.0 (commercial use allowed), has a music checkpoint (`music_audioset_epoch_15_esc_90.14`,
  HTSAT-base); HF Transformers version `laion/larger_clap_music_and_speech` is Apache-2.0; PyPI licence field is
  inconsistent; no statement on whether training data restricts commercial use [primary] — [LAION-AI/CLAP](https://github.com/LAION-AI/CLAP); [CLAP LICENSE](https://github.com/LAION-AI/CLAP/blob/main/LICENSE); [larger_clap_music_and_speech card](https://huggingface.co/laion/larger_clap_music_and_speech/blob/195c3a3e68faebb3e2088b9a79e79b43ddbda76b/README.md?code=true)
- Microsoft CLAP: code MIT, but weights are CC-BY-3.0-US (Zenodo) / MS-PL (HF): commercial use OK with notice
  conditions [primary] — [microsoft/CLAP](https://github.com/microsoft/CLAP); [Zenodo weights](https://zenodo.org/records/8378278); [HF msclap](https://huggingface.co/microsoft/msclap)
- beat_this (CPJKU, ISMIR 2024): code and published weights MIT; maintainer (issue #21, Oct 2026): weights free for
  commercial use and redistribution; does not use madmom's DBN, which is patented and non-commercial; small model
  ~10 MB, standard ~83 MB [primary] — [CPJKU/beat_this](https://github.com/CPJKU/beat_this); [issue #21](https://github.com/CPJKU/beat_this/issues/21); [beat-this-GGUF card](https://huggingface.co/cstr/beat-this-GGUF)
- Meta Audiobox Aesthetics: CC-BY-4.0 (weights and most code; parts MIT); scores production quality, production
  complexity, content enjoyment, content usefulness; used as a filter in Kandinsky 6.0 Video's pipeline [primary] — [facebookresearch/audiobox-aesthetics](https://github.com/facebookresearch/audiobox-aesthetics); [HF card](https://huggingface.co/facebook/audiobox-aesthetics/blame/main/README.md); [Kandinsky 6.0 paper](https://arxiv.org/html/2610.05608v1)
- SongEval toolkit: README says CC BY-NC-SA 4.0 while the LICENSE file says Apache-2.0; dataset CC BY-NC-SA 4.0
  [primary, conflicting] — [ASLP-lab/SongEval](https://github.com/ASLP-lab/SongEval); [SongEval dataset](https://huggingface.co/datasets/ASLP-lab/SongEval)
- FilmComposer adds a multi-agent assessment stage before arrangement/mix (LLM agents judge candidates) [primary] — [FilmComposer paper](https://openaccess.thecvf.com/content/CVPR2025/papers/Xie_FilmComposer_LLM-Driven_Music_Production_for_Silent_Film_Clips_CVPR_2025_paper.pdf)
- ACE-Step's community guidance: generate batches of 2–4 and pick the best [community] — [Discussion #398](https://github.com/ace-step/ACE-Step-1.5/discussions/398)

### Inferences (proposed ranker; not built)
- [inference] Per candidate, after fit.py has aligned it, compute and store in `.fit.json`:
  1. **Tempo match**: beat_this tempo vs planned BPM (hard fail beyond ±4 %, unless half/double time).
  2. **Cue hit**: distance from `key` to nearest detected downbeat after fitting (pass ≤ 40 ms), and for each
     impact/comic cue, distance to nearest beat (an AV-Align-style hit rate, using MSP's exact cues instead of optical flow).
  3. **Energy contour**: RMS/onset-density curve (per bar) correlated with the brief's `energy_curve`; check a clear
     rise into `key` (drop strength = loudness/onset jump across the key bar) and a drop in energy under the CTA/outro.
  4. **Brief similarity**: LAION CLAP music checkpoint cosine between the audio and the brief's caption, plus negative
     prompts ("vocals", "singing", "lo-fi hiss") as penalty terms; treat as relative ranking only, not absolute truth.
  5. **Quality gate**: Audiobox Aesthetics PQ/CE as a tie-breaker (note: CC-BY-4.0 asks for attribution, which conflicts
     with the owner's "no credit anywhere" rule only if output must credit tools; attribution for an internal
     evaluation tool lives in repo notices, not posts — owner should confirm).
  6. Existing checks: vocal check, loudness/true peak, silence at the start/end.
  Rank by hard-fails first, then a weighted sum (cue hit and energy contour weighted highest: these are what the owner
  hears as "it hits"). Show the owner the top 2–3 with the scores beside each player, and log the owner's pick to tune
  weights over time.
- [inference] Claude itself can be a second-stage judge à la FilmComposer's assessment agents, but it cannot listen;
  give it the numeric analysis (tempo, drop time, energy curve plot as image) rather than asking for a taste verdict.
- [inference] Everything above runs on the M3 Max on CPU/MPS in seconds per candidate (beat_this small model ~10 MB,
  CLAP HTSAT-base); it is not a "heavy local job" under the project rules, unlike ACE-Step generation.

### Gaps
- No study found validating CLAP score against human preference for short instrumental beds specifically; its value as
  a ranker is assumed, not evidenced.
- Whether LAION music-CLAP's training data limits commercial use is unstated by LAION.
- madmom (a common alternative) was not re-checked in this session beyond the beat_this card's note that its DBN is
  patented/non-commercial.
