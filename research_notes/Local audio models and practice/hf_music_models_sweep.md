# Hugging Face sweep: local text-to-music and music-editing models for an M3 Max 36 GB (as of 16 Nov 2026)

Scope: models beyond those in `research_notes/Automated Reels and Stories audio/local_music_models_2026-11.md` (ACE-Step
1.5/XL, Stable Audio 3, Magenta RT 2, MiniMax Music 3, YuE2, MusicGen, HeartMuLa, DiffRhythm). Some of those come up
again here only where there is new evidence (Mac ports, licences, rankings). Owner filter: no credit or attribution on
outputs, no "Powered by" notices, no non-commercial weights. Research only; nothing downloaded or installed. HF listings
came from the HF API on 2026-11-16, using queries `pipeline_tag=text-to-audio` sorted by downloads, trending and newest;
`search=music`; `author=mlx-community` with music/audio; `search=mlx` within text-to-audio; and `search=ace-step` /
`acestep` / `lora ace`. "Older" means before Jun 2026.

## 1. HF sweep: every model plausibly useful for instrumental beds (beyond the already-covered list)

### Takeaway
The sweep found **no new open text-to-music generator that passes the owner's licence filter and beats ACE-Step 1.5.**
The HF text-to-audio and "music" lists from 2025 to Nov 2026 are dominated by models already covered and their
repacks: ACE-Step, Stable Audio 3, MiniMax Music 3, YuE2, Magenta RT 2 and HeartMuLa. The rest are speech, sound
effects, video-to-audio, or music *understanding* models. Two findings change the picture:
1. **MiniMax Music 3 now runs on Apple Silicon**: mlx-community has MLX ports and mlx-audio merged support. Its licence
   still requires displaying "MiniMax-Music3" and disclosing machine-generated content, so it stays excluded.
2. **Tencent SongGeneration v2** has an MLX port, but its licence is "unknown/other" and it is song-focused. SongBloom
   (Apache-2.0 tag, 2025) and InspireMusic (Apache-2.0, early 2025) are older and have no Mac evidence.

The one useful newcomer is not a generator: **MOSS-Music-8B** (Apache-2.0, MLX 4/6/8-bit) is a music *understanding*
model. It could auto-check our beds for key, tempo, structure and captions.

### Cited Findings
**Candidates found, with licence verdicts:**
- **MiniMax Music 3, MLX ports (new since the previous note)**: `mlx-community/MiniMax-Music3-{bf16,8bit,6bit,4bit,mxfp8,mxfp4,nvfp4}`, all created 2026-08-16. "MiniMax Music 3 support was merged upstream in Blaizzy/mlx-audio#888. Until a PyPI release includes it, install the upstream merge commit". Output is stereo 44.1 kHz. "Use `[instrumental]` explicitly for instrumental generation. Duration is a requested upper bound: the autoregressive stage may emit its end token early. Style, tempo, instrument, and vocal controls are probabilistic". The licence stays `minimax-music3-community-license` — [HF mlx-community/MiniMax-Music3-8bit](https://huggingface.co/mlx-community/MiniMax-Music3-8bit). Also `ddalcu/MiniMax-Music3-MLX-Serve-8bit` (2026-08-13) — [HF API search](https://huggingface.co/api/models?search=mlx&pipeline_tag=text-to-audio&sort=downloads)
  - This **contradicts the earlier "CUDA only" finding**, which came from the official card: a Mac path exists through community MLX. The licence problems (display "MiniMax-Music3" in the UI; AUP item 11 requires AI disclosure) are unchanged — [LICENSE](https://huggingface.co/MiniMaxAI/MiniMax-Music3/blob/main/LICENSE)
  - `Comfy-Org/MiniMax-Music-3` (1.18 M downloads) is tagged **apache-2.0**, but it is only a repack: "Repackaged model files for ComfyUI. Original model repository: MiniMaxAI/MiniMax-Music3". The upstream licence governs the weights — [HF Comfy-Org/MiniMax-Music-3](https://huggingface.co/Comfy-Org/MiniMax-Music-3)
- **SongGeneration v2 (Tencent "LeVo" line)**: `lglg666/SongGeneration-v2-large` (2026-02-15, licence tag `unknown`), `-v2-medium` (2026-03-17, no tag), `mlx-community/SongGeneration-v2-medium` (2026-05-31, `other`). The MLX card says "License follows the upstream SongGeneration release. Check the official model card" — [HF API](https://huggingface.co/api/models/lglg666/SongGeneration-v2-large), [HF mlx-community/SongGeneration-v2-medium](https://huggingface.co/mlx-community/SongGeneration-v2-medium). A GGUF repack `smthem/SongGeneration-v2-large-gguf` is tagged MIT, but that is a third-party tag — [HF API search](https://huggingface.co/api/models?search=SongGeneration&sort=downloads)
- **SongBloom** (older, 2025): `rsxdalv/SongBloom` is apache-2.0 (2025-09-20). `ComfyAudio/SongBloom-Source` is tagged cc-by-nc-sa-4.0 and `CypressYang/SongBloom_long` is "other". The tags conflict between mirrors — [HF API search](https://huggingface.co/api/models?search=SongBloom&sort=downloads)
- **InspireMusic** (Alibaba FunAudioLLM, older: GGUFs from 2025-02): only Apache-2.0 GGUF mirrors (`mradermacher/InspireMusic-1.5B-*-GGUF`) and a 2026-08 re-upload (`rtikw/InspireMusic-1.5B-Long`) are indexed. The official `FunAudioLLM/InspireMusic-1.5B-Long` API call returned nothing — [HF API search](https://huggingface.co/api/models?search=InspireMusic&sort=downloads)
- **Riffusion v1** (2022, creativeml-openrail-m) and **Mustango** (2023, apache-2.0) are still listed. Both are old and low quality next to 2026 models — [HF API trending](https://huggingface.co/api/models?pipeline_tag=text-to-audio&sort=trendingScore)
- **`micknoisemachine/mimetic-a0`** (2026-10-18, MIT, 471 downloads; noted earlier) and **`cmp-nct/demodokos-foundry-music-v4`** (2026-07-06, `demodokos-foundry-proprietary-model` licence, so excluded) — [HF API search=music](https://huggingface.co/api/models?search=music&sort=downloads)
- **`goldhub/Ruach_Studio_Models_v2`** (licence `other`) and YuE2 finetunes/merges (`goldhub/YuE2-RS-Finetunes` cc-by-nc-sa; `YuE2-3B-Ruach_Studio-IRA-Merge` cc-by-nc): all non-commercial or unclear, so excluded — [HF API text-to-audio by downloads](https://huggingface.co/api/models?pipeline_tag=text-to-audio&sort=downloads)
- **HeartMuLa on MLX (new)**: `mlx-community/HeartMuLa-oss-3B-{bf16,8bit}` and `HeartCodec-oss-{fp16,fp32}` (2026-11-02, Apache-2.0), a Swift-MLX port. Measured on an **M5 Max**: 8-bit LM + fp16 codec renders at 3.0× real time with 8.5 + 5.5 GB memory. "Style tags steer it weakly". The output is songs with vocals ("Most voices come out female whatever the tags ask"), and it "runs to the length cap" often. Reference audio and edits are refused — [HF mlx-community/HeartMuLa-oss-3B-bf16](https://huggingface.co/mlx-community/HeartMuLa-oss-3B-bf16)
- **YuE2 on MLX**: `vanch007/mlx-Yue2-3B`, `mlx-community/YuE2-3B-bf16`, `ddalcu/YuE2-3B-MLX-Serve-8bit` (Sep–Oct 2026). Still CC-BY-NC, so excluded — [HF API search mlx](https://huggingface.co/api/models?search=mlx&pipeline_tag=text-to-audio&sort=downloads)
- **Magenta RT 2 on audio.cpp**: `audio-cpp/Magenta-RealTime-2-GGUF` (2026-10-28, CC-BY-4.0). Small 230M is 1.24–1.42 GiB and Base 2.4B is 3.41–5.48 GiB. The runtime is a single binary with `--backend cuda|vulkan|cpu` (Metal is not listed). Offline generation takes `duration_sec`, plus `drums=0/1` and a `pianoroll_file` note control. "`--audio style.wav` … transfers musical style; it does not continue the input recording". RTF on an RTX 5090: Small 0.08, Base 0.18–0.24 — [HF audio-cpp/Magenta-RealTime-2-GGUF](https://huggingface.co/audio-cpp/Magenta-RealTime-2-GGUF)
- **Excluded categories found in the sweep:** sound effects (`OpenMOSS-Team/MOSS-SoundEffect-v2.0`, apache-2.0, 2026-05), video-to-audio (`FunAudioLLM/PrismAudio`: its MIT tag is overridden by a card note that "Commercial use is not permitted without explicit authorization"), speech/TTS (LongCat-AudioDiT, fish-audio, ChatTTS, Audio8-TTS), `HKUSTAudio/AudioX-MAF` (cc-by-nc-4.0), `mlx-community/audiogen-medium-mlx` (cc-by-nc-4.0), `declare-lab/tango2` (cc-by-nc-sa) — [PrismAudio card](https://huggingface.co/FunAudioLLM/PrismAudio), [HF API listings](https://huggingface.co/api/models?pipeline_tag=text-to-audio&sort=downloads)
- **Music understanding (useful for QA, not generation)**: `OpenMOSS-Team/MOSS-Music-8B-Instruct` / `-Thinking` (2026-04/05, Apache-2.0, ~9.1B on a Qwen3-8B backbone). It does "Musical captioning … Key / tempo / chord reasoning … Structural analysis". MLX builds: `mlx-community/MOSS-Music-8B-Thinking-{4,6,8}bit` (2026-06) — [HF MOSS-Music-8B-Instruct](https://huggingface.co/OpenMOSS-Team/MOSS-Music-8B-Instruct), [HF API mlx-community](https://huggingface.co/api/models?author=mlx-community&search=music). Also `laion/clap2-*-audioxl-s1B` (Apache-2.0, 2026-10-26), CLAP models for scoring how well audio matches text — [HF API search AudioX](https://huggingface.co/api/models?search=AudioX&sort=downloads)
- **Papers without public weights found:** StepAudio 3 Music (arXiv 2609.16034, 11 Sep 2026: MoE AR planner with ABC-notation "ABC-CoT" + flow-matching DiT, 48 kHz). An HF search for StepAudio 3 Music / Step-Audio-3 found no matching weights — [arXiv 2609.16034](https://arxiv.org/abs/2609.16034). Shao (arXiv 2605.01790) and FullDiT (arXiv 2608.08787) are research models; I found no weights — [arXiv API](https://export.arxiv.org/api/query?id_list=2605.01790,2608.08787)

### Inferences
- With the no-attribution, commercial-weights filter, the realistic local generator set is still **ACE-Step 1.5 (MIT)**
  plus, if the owner accepts CC-BY-4.0 weights (attribution attaches to redistributing the weights; Google "claims no
  rights in outputs"), **Magenta RT 2**. Apache-2.0 song models (HeartMuLa, SongBloom) are vocal-song generators and a
  poor fit for 8–30 s instrumental beds. HeartMuLa's own MLX card says its tags steer it weakly.
- Repack licence tags on HF (Comfy-Org apache-2.0, GGUF MIT) don't override the upstream licence. Always check the
  original repo.
- MOSS-Music-8B (MLX 4-bit, roughly 5–6 GB) could serve as a local "critic": caption the bed, detect key/BPM and flag
  vocals before human review. This hasn't been tested.

### Gaps
- No published FAD/CLAP numbers on MusicCaps or Song Describer for SongGeneration v2, SongBloom or InspireMusic were
  gathered in this pass. Their licence text wasn't read first-hand (only HF tags).
- Magenta RT 2's audio.cpp port lists no Metal backend. The Mac route remains the official Magenta code (earlier note).

## 2. ACE-Step specifics: LoRAs/finetunes, MLX ports and Mac speeds, sampler settings, known quality issues

### Takeaway
There are many community LoRAs, but **few are cleanly usable**. The licence is often missing, and most were trained on
other people's music or on undisclosed "synthetic" tracks. The most interesting add-on is **not a LoRA but a VAE**:
ScragVAE (MIT, now in ACE-Step's official alternative-VAE registry) restores high frequencies. A known "Oobleck hum"
artifact exists, but the fix for it (Regrind) is CC-BY-NC-SA, so it is out. On Mac, a full **Swift-MLX port** (official
weights converted to mlx-community, bit-parity tested) measured on an M5 Max: the 2B turbo DiT does 8 steps for 30 s in
**0.8 s, VAE decode about 1 s**. The LM "planner" is about 80% of wall time, and source-only edits (repaint, extend,
cover) run in **3–5 s per 30 s**. For instrumentals the official advice is turbo with 8 steps, `shift=3.0`, ODE, and
lyrics `[Instrumental]` / `instrumental=True`.

### Cited Findings
**Community LoRAs and finetunes (licence = HF tag or card text):**
- `ryanontheinside/*-acestep1.5-xl-v1`: about 30 genre LoRAs (ambient, house, deep_house, synthwave, jazz, folk, acoustic, EDM, techno, etc., 2026-05-20) on XL Turbo. **No licence tag.** The Ambient card says "Dataset: 15 synthetic tracks, 3760s total"; the source of the synthetic tracks is not stated. Trigger `roti-4mbnt`; recommended 8 steps, guidance 7.0, shift 3.0 — [HF ryanontheinside/ambient-acestep1.5-xl-v1](https://huggingface.co/ryanontheinside/ambient-acestep1.5-xl-v1)
- `LouisAmas/acestep-1.5-xl-sft-lora-ambient-downtempo` and `-90s-trance` (2026-11-09, MIT): "45 instrumental ambient / downtempo tracks (3.7 h) … max 2 per artist". The training tracks aren't distributed, and the card asks users to check every output before commercial release. Settings: LoRA 1.0, 100 Euler steps, CFG 5 stopped at 95%, ADG on, "BPM / key: always set them explicitly" — [HF LouisAmas ambient-downtempo](https://huggingface.co/LouisAmas/acestep-1.5-xl-sft-lora-ambient-downtempo)
- `DisturbingTheField/ACE-Step-v1.5-ambient_dream1-LoRA` (2026-02-09). "License: mit" is in the card's front matter, but there is no standard tag. "Trained on 10 short instrumental songs made and recorded by myself", about 12 min of audio, on turbo + LM 4B; trigger `ambient_dream1` — [HF card](https://huggingface.co/DisturbingTheField/ACE-Step-v1.5-ambient_dream1-LoRA). The same author has `…acoustic-guitar-and-a-merge-LoRA` and `…raspy-vocal-and-instrumental-5-LoRAs` (MIT) — [HF API search](https://huggingface.co/api/models?search=lora%20ace&sort=downloads)
- Others: `tarn59/super_eurobeats_ACE_STEP-1.5-lora` (apache-2.0, card is a template), `David-A-Amoo/…Naija-Legacy-Rhythms-LoRA-v1` (cc-by-nc, excluded), `ACE-Step/ACE-Step-v1.5-chinese-new-year-LoRA` (official, creativeml-openrail-m), `6san/symphonic_metal_lora…` (no licence), `bdsqlsz/Acestep1.5-qinglong-lokr` (no licence), `pradipbasnet68/nepali-folk-acestep-1.5-lora` (MIT) — [HF API search](https://huggingface.co/api/models?search=lora%20ace&sort=downloads)
- **No "lo-fi" or "cinematic" LoRA** turned up by name. The closest are ryanontheinside's ambient LoRA ("cinematic ambient score" among its example prompts) and the ambient/downtempo LoRAs above — [HF API search ace-step](https://huggingface.co/api/models?search=ace-step&sort=downloads)

**Quality fixes (VAE/DiT):**
- **ScragVAE** (`scragnog/Ace-Step-1.5-ScragVAE`, MIT): a decoder-only finetune; "The original VAE decoder attenuates high-frequency content … above 6kHz". The card claims HF energy >12 kHz +83% and air band +2.3 dB. These are self-reported spectral metrics, not listening tests — [HF ScragVAE](https://huggingface.co/scragnog/Ace-Step-1.5-ScragVAE). It is **officially supported**: the ACE-Step docs list `scragvae` in the built-in VAE registry, selectable through `ACESTEP_VAE_CHECKPOINT=scragvae` or the Gradio dropdown — [GitHub docs/en/ALT_VAE.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ALT_VAE.md)
- **Hum artifact**: "ACEStep XL Turbo and the Oobleck VAE produce a characteristic harmonic artifact present in all generations". The primary hum is at 654–669 Hz (−12 to −15 dB), with sub resonances at 74/94 Hz and harmonics at 211/1090 Hz, plus a DiT resonance "perceptible after ~60 seconds". The fix (Regrind VAE/DiT/LoRA) is **CC-BY-NC-SA 4.0, so excluded** — [HF mdmachine/ACEStep-XL-Regrind-V1](https://huggingface.co/mdmachine/ACEStep-XL-Regrind-V1)
- Sampler-side add-on: ACE-Step supports opt-in **DCW** (Differential Correction in Wavelet domain, CVPR 2026, arXiv 2604.16044), "training-free, adds negligible compute" — [GitHub docs/en/DCW.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/DCW.md)
- Open issues that matter for beds: #1374 "Repaint re-normalizes the entire song, reducing the untouched audio level and causing a loudness jump at the edit" (2026-11-09, open); #1375 "Lego not producing usable audio" (2026-11-10); #400 "Cover generates (almost) same song every time" — [GitHub issues search](https://github.com/ace-step/ACE-Step-1.5/issues?q=instrumental+OR+ending+OR+fade+OR+hum+OR+artifact)

**Official settings for instrumentals:**
- Turbo: `inference_steps` 8 (range 1–20); the base model is recommended at 32–64. "set **`shift=3.0`** for turbo". `infer_method="ode"` (Euler) is "faster and deterministic", while "sde" adds variance. `use_adg` is for the base model only. Lyrics `"[Instrumental]"` or `instrumental=True`. "Instrumental: 30-180 seconds works well" — [GitHub docs/en/INFERENCE.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INFERENCE.md)
- Turbo variants: `turbo` (joint distillation on shift 1/2/3, "recommended first choice"), `turbo-shift1` ("richer details, but semantics weaker"), `turbo-shift3` ("clearer, richer timbre, but may sound 'dry,' minimal orchestration"), `turbo-continuous` (experimental) — [GitHub docs/en/Tutorial.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- Apple Silicon profiling is officially documented: `python profile_inference.py --device mps --lm-backend mlx` — [GitHub docs/en/BENCHMARK.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/BENCHMARK.md)

**MLX ports and measured Mac speeds:**
- `mlx-community/ACE-Step-1.5-turbo-bf16`, `-vae-fp32`, `-text-encoder-bf16`, `-planner-{0.6B,1.7B}-{bf16,8bit,4bit}` (2026-10-25/28), MIT. They were converted by `xocialize/mlx-ace-step-swift`, "a full port … to Swift-MLX". It supports caption + lyrics, reference-audio timbre, and "cover / repaint / extend of a source clip". The conversion is "gated bit-equal against upstream" — [HF mlx-community/ACE-Step-1.5-turbo-bf16](https://huggingface.co/mlx-community/ACE-Step-1.5-turbo-bf16)
- Measurements from that port on an **M5 Max (Mac Studio)**:
  - "8-step solve of 750 frames 0.8 s; VAE full 0.9 s / chunked 1.0 s for 30 s"
  - folk-30s render: 15.8 s wall, of which 13.3 s was planner
  - "The planner is ~80 % of a song"
  - "A source-only request (cover / repaint / extend) runs no planner and lands in 3–5 s for 30 s of audio"
  - bf16 tier peak 17.98 GB, int8 16.55 GB, lite (0.6B planner) 15.47 GB

  — [GitHub xocialize/mlx-ace-step-swift MEASUREMENTS.md](https://github.com/xocialize/mlx-ace-step-swift/blob/main/MEASUREMENTS.md)
- `roman220220/ACE-Step1.5-sft-MLX-{bf16,8bit,gptq-4bit}` (2026-09-26, MIT), measured on an **M5** (base): sft 8-bit "~49 s for 30 s of music (50 steps, CFG)", 8.6 GB peak; bf16 36 s, 10.6 GB. Turbo 4-bit + LM 1.7B took ~22 s per 30 s. "Turbo's mix sounds fuller …; on electronic music sft sounded best." The card warns that the "stock mlx-audio settings sing gibberish": run sft with `use_lm=False` and patch the CFG null-condition. Its recipe is `num_steps=50, guidance_scale=7.0, shift=1.0, cfg_type="apg"` — [HF roman220220/ACE-Step1.5-sft-MLX-8bit](https://huggingface.co/roman220220/ACE-Step1.5-sft-MLX-8bit)
- Other ports: `ddalcu/ACE-Step-1.5-XL-Turbo-MLX-Serve-{8bit,4bit}` (covered earlier); GGUF via audio.cpp (`CaptainArni/audio.cpp-gguf`: XL turbo bf16 14.2 GiB; "q8dit" 9.97 GiB with waveform correlation 0.989 vs bf16; full q8_0 "returns a different song from the same seed") — [HF CaptainArni/audio.cpp-gguf](https://huggingface.co/CaptainArni/audio.cpp-gguf); `Serveurperso/ACE-Step-1.5-GGUF` (MIT, 2.78 M downloads) for acestep.cpp — [HF API search](https://huggingface.co/api/models?search=ace-step&sort=downloads)

### Inferences
- For 8–30 s instrumental beds on an M3 Max, skipping the planner LM (`use_lm=False` / thinking off) removes about 80% of
  wall time. The M5 Max numbers suggest the DiT + VAE alone take a few seconds per 30 s. Expect the M3 Max to be slower
  (lower bandwidth and older GPU), but still well under a minute. This is an estimate, not measured.
- Low-risk quality upgrades to A/B in the existing install: (a) ScragVAE through the official registry; (b) the
  `turbo-shift3` and `turbo-shift1` variants against default `turbo`; (c) DCW on vs off; (d) XL-sft at 50 steps for
  "hero" beds. Watch for the ~655 Hz hum. A post-hoc EQ notch is a free substitute for the non-commercial Regrind fix.
- LoRAs: only those trained on the author's own recordings (e.g. ambient_dream1, MIT) are defensible under the owner's
  rules. Those trained on third-party tracks or with no licence should be skipped. Training our own LoRA on our own
  motif remains the clean option (PR #1344, LoRA on MPS, was still open per the earlier note).
- Avoid repaint for "fixing endings" until #1374 (loudness jump) is fixed, or loudness-match the edited region afterwards.

### Gaps
- No published M3 Max timings for any ACE-Step port. No independent listening test of ScragVAE vs official. No LoRA
  specifically for lo-fi, "playful" or "cinematic tension".
- I didn't find a documented "best sampler for short instrumentals" study; the settings above are the official
  defaults and per-LoRA recommendations.

## 3. Music editing, extension and loop models usable on a Mac

### Takeaway
No open model offers a guaranteed seamless loop. The research method **LoopGen** (2025, training-free circular
generation on MAGNeT) shows it is possible, but MAGNeT weights are Meta CC-BY-NC, so it is out. On a Mac, the
practical editing tools come from ACE-Step itself: repaint, extend and cover run on MLX in seconds per the Swift port.
Magenta RT 2 can do style transfer from audio, but it doesn't continue a recording.

### Cited Findings
- LoopGen (arXiv 2504.04466, Apr 2025, older): it modifies non-autoregressive MAGNeT "to generate tokens in a circular pattern, letting the model attend to the beginning of the audio when creating its ending", training-free, with a "55% improvement" in seam perplexity — [arXiv 2504.04466](https://arxiv.org/abs/2504.04466)
- Video, not music: Loopy (arXiv 2608.23090, Aug 2026) makes seamless loops by shifting RoPE in a DiT, and cites Mobius (latent shift). These are methods that could in principle carry over to audio DiTs, but I found no audio implementation — [arXiv 2608.23090](https://arxiv.org/pdf/2608.23090)
- ACE-Step Swift-MLX: "cover / repaint / extend of a source clip" in 3–5 s per 30 s on an M5 Max — [MEASUREMENTS.md](https://github.com/xocialize/mlx-ace-step-swift/blob/main/MEASUREMENTS.md)
- Magenta RT 2 (audio.cpp): `--audio style.wav` "transfers musical style; it does not continue the input recording"; "Each request starts fresh music" — [HF audio-cpp/Magenta-RealTime-2-GGUF](https://huggingface.co/audio-cpp/Magenta-RealTime-2-GGUF)
- HeartMuLa MLX: "Reference audio, edits … are refused" — [HF mlx-community/HeartMuLa-oss-3B-bf16](https://huggingface.co/mlx-community/HeartMuLa-oss-3B-bf16)
- MusicWeaver (arXiv 2509.21714) and Melodia (AAAI 2026, training-free editing) were found in search as research methods. I didn't check whether either has weights — [search results](https://arxiv.org/pdf/2509.21714)

### Inferences
- A loopable bed is best built in post: generate at a fixed BPM with ACE-Step, cut on bar boundaries computed from
  BPM, crossfade a few beats, and optionally repaint the seam region with ACE-Step (loudness-matched, see #1374). A
  LoopGen-style circular-padding trick on ACE-Step's DiT is a possible experiment, but no implementation exists.

### Gaps
- I found no Mac-runnable open model with a dedicated "seamless loop" mode, and no benchmark of loopability for ACE-Step.

## 4. Text-to-music benchmarks and leaderboards in 2026: where open models rank

### Takeaway
The main human-preference board in late 2026 is **Artificial Analysis AA-Music-Instrumental v1.1** (launched 7 Oct 2026,
recruited evaluator panel, 1,000 prompts in 17 genres). Closed models lead it: Suno v6 1148, Suno v6-mini 1114,
Mureka/Lyria ~1080. The best open-weights entries are **MiniMax Music 3.0** (1000, the anchor, rank 8–15) and **Stable
Audio 3 Medium** (996, rank 9–16). **ACE-Step and Magenta RT are not listed.** CMU's academic Music Arena last
published in 2025.

### Cited Findings
- AA-Music-Instrumental v1.1, full list: Suno v6 1148; Suno v6-mini 1114; Mureka V9.5 1084; Mureka V9 1083; Lyria 3 Pro 1080; Lyria 3.5 1078; Eleven Music 1021; Stable Audio 3 Large 1014; Eleven Music v2 1011; MiniMax Music 2.5+ 1007; Eleven Music v2.5 1001; MiniMax Music 2.6 1001; MiniMax Music 3.0 1000 (anchor); **Stable Audio 3 Medium 996**; Melodia v3 986; Stable Audio 2.5 984; **Stable Audio 3 Small 946**; Lyria 2 926; **MusicGen 868**. ACE-Step, Magenta and StepAudio are not on the board — [Artificial Analysis instrumental leaderboard](https://artificialanalysis.ai/music/leaderboard/instrumental)
- Launch post: "MiniMax Music 3.0 is the leading open weights music model, at #11 on Vocal and #13 on Instrumental" — [Artificial Analysis on X](https://x.com/ArtificialAnlys/status/2107942662481612982) (via search snippet)
- CMU Music Arena (academic; first leaderboard on 19 Sep 2025, older): instrumental included magenta-rt-large 1113.6, musicgen-small 928.5, Stable Audio Open 924.7 and sao-small 782.4. ACE-Step (v1) was on the vocal board at 660.1. I found no 2026 update — [CMU Music Arena blog](https://gclef-cmu.org/blog/posts/250919_MusicArena/), [arXiv 2507.20900](https://arxiv.org/abs/2507.20900)
- In the Shao paper's 8-system arena (10 prompts, its own scale), ACE-Step 1.5 ranked 6th at Elo 1470.9 against MiniMax 2.5+ at 1509.2 — [arXiv 2605.01790](https://arxiv.org/pdf/2605.01790) (via search snippet; not opened)
- Pixazo (automated judges, its own hosted models only, not human preference) ranks ACE-Step XL #1 for text-to-song at 1029 — [Pixazo leaderboard](https://www.pixazo.ai/models/leaderboard/ai-audio-generation) (vendor source, low weight)
- The previous note has the objective-metric comparison (SA3 paper, SDD instrumental): ACE-Step 1.5 xl-turbo FAD 0.193 / CLAP 0.321 vs SA3 medium FAD 0.107 / CLAP 0.390 — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)
- HeartMuLa's MLX card reports CLAP style retrieval: HeartMuLa ranks its songs "about 4.5 of 12 for their own tags, against about 2 for the other open music models measured". That is the porter's own small test — [HF mlx-community/HeartMuLa-oss-3B-bf16](https://huggingface.co/mlx-community/HeartMuLa-oss-3B-bf16)

### Inferences
- Open weights sit roughly 150 Elo below the best closed model on instrumentals. Among open models, the human-preference
  evidence favours MiniMax Music 3 and SA3 Medium, both of which the owner's licence rule excludes. ACE-Step has no
  rank on the main human board, so its quality relative to them comes only from SA3's own paper and small
  third-party arenas. For MSP this means ACE-Step is the best *allowed* open option, not the best open option, and an
  in-house listening test (the MU1 lab) is the real evidence.

### Gaps
- I couldn't confirm why ACE-Step is absent from the Artificial Analysis board. The vocal-board ranks for open models
  and the board's exact data date were not retrieved.
