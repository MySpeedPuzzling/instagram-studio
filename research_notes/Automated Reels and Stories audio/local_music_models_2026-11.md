# Local (open-weight) music generation for Reels/Stories beds on an M3 Max 36 GB (as of 16 Nov 2026)

Scope: 8–30 s instrumental beds (upbeat/playful, cozy, ticking-clock tension, lo-fi, celebratory) generated locally and
baked into Reels. Research only; nothing installed or run. Licence tags were read from the Hugging Face API on
2026-11-16. "Older" means published before Jun 2026.

## 1. ACE-Step 1.5 / XL: licence, training data, Mac speed, short-instrumental quality, LoRA on a Mac

### Takeaway
The ACE-Step 1.5 weights, including the XL (4B) checkpoints, carry an **MIT** licence tag on Hugging Face, so commercial
use is fine with no revenue cap. The model card says it was trained on licensed, royalty-free/public-domain and
synthetic (MIDI-rendered) music. It runs on Apple Silicon through an official MLX path. One measured Mac number exists,
on an M5 32 GB: about 16 s for a 30 s clip with xl-turbo, at about 9.5 GB peak. In Stability's own benchmark it trails
Stable Audio 3 medium on instrumental quality and speed. It still has the most controls of any open model: BPM, key,
duration, repaint, cover, stems.

### Cited Findings
- HF licence tags: `ACE-Step/Ace-Step1.5` = mit (created 2026-01-23), `ACE-Step/acestep-v15-xl-turbo` = mit,
  `acestep-v15-xl-base` = mit (both created 2026-04-02) — [HF API: Ace-Step1.5](https://huggingface.co/api/models/ACE-Step/Ace-Step1.5), [HF API: xl-turbo](https://huggingface.co/api/models/ACE-Step/acestep-v15-xl-turbo)
- The ComfyUI repack `Comfy-Org/ACE-Step-1.5` is tagged **apache-2.0**, unlike the MIT upstream. Both are permissive,
  but the tags don't match — [HF API: Comfy-Org/ACE-Step-1.5](https://huggingface.co/api/models/Comfy-Org/ACE-Step-1.5)
- Training-data statement on the model card: "a massive, legally compliant dataset": "Licensed Data: Professionally licensed music tracks", "Royalty-Free / No-Copyright Data: A vast collection of public domain and royalty-free music", "Synthetic Data: High-quality audio generated via advanced MIDI-to-Audio conversion". No list of licensors is given — [HF model card](https://huggingface.co/ACE-Step/Ace-Step1.5)
- The GitHub README has a disclaimer about copyright and stylistic similarity that asks users to check originality themselves — [GitHub ace-step/ACE-Step-1.5](https://github.com/ace-step/ACE-Step-1.5)
- Hardware: "CUDA GPU recommended (also supports MPS / ROCm / Intel XPU / CPU)". The macOS launch script `start_gradio_ui_macos.sh` uses the MLX backend, and there is a macOS portable package. 2B: "<4GB VRAM". XL: ≥12 GB with offload and quantisation, ≥20 GB without. Weights are ~9 GB bf16 (XL) and ~4.7 GB (2B) — [GitHub README](https://github.com/ace-step/ACE-Step-1.5)
- Official speed is NVIDIA only: "under 2 seconds per full song on an A100 and under 10 seconds on an RTX 3090" — [GitHub README](https://github.com/ace-step/ACE-Step-1.5)
- **Measured Mac timings** (third-party MLX runner `as15`, M5 32 GB). xl-turbo (8 steps): 30 s clip in ~10 s generation + ~6 s decode; 200 s song in 24 s + 35 s. xl-sft (50 steps, best quality): 30 s clip in ~158 s + ~8 s. Peak memory 9.1–9.7 GB. The optional 4B "planner" LM takes 2 min 36 s for a 200 s song. The runner supports `--bpm`, `--key`, `--time-signature`. Repaint/retake code was removed — [GitHub jameshiew/as15](https://github.com/jameshiew/as15)
- An 8-bit MLX build of XL-turbo claims "a 30-second song in about 4 seconds on an M-series Mac". The chip is not named — [HF ddalcu/ACE-Step-1.5-XL-Turbo-MLX-Serve-8bit](https://huggingface.co/ddalcu/ACE-Step-1.5-XL-Turbo-MLX-Serve-8bit)
- A community MPS/MLX fork says to expect Apple Silicon "roughly 10-20x slower than an A100" — [GitHub clockworksquirrel/ace-step-apple-silicon](https://github.com/clockworksquirrel/ace-step-apple-silicon)
- A third-party review notes that the official MLX port covers the DiT and VAE but not the language model, so the LM path is the slow or missing part on macOS — [GitHub unxmaal/localharness #236](https://github.com/unxmaal/localharness/issues/236) (via search snippet, not opened)
- Open MLX/MPS work in the official repo (Nov 2026): PR #1362 "cap MLX buffer cache during native VAE decode to avoid swap on Apple Silicon", PR #1344 "train API LoRA on MPS in bfloat16" (open, so LoRA on MPS isn't solid yet), PR #1348 / issue #1346 (MLX ignores `cover_noise_strength` in Cover/Remix) — [GitHub issues search](https://github.com/ace-step/ACE-Step-1.5/issues?q=mac+OR+mps+OR+mlx)
- LoRA: "One-click annotation & training in Gradio. 8 songs, 1 hour on 3090 (12GB VRAM)". No Mac figure is given — [GitHub README](https://github.com/ace-step/ACE-Step-1.5)
- Community LoRAs exist on HF, for example `ryanontheinside/metal-acestep1.5-v1` and `phonk-acestep1.5-v1` (May 2026) — [HF trending text-to-audio](https://huggingface.co/models?pipeline_tag=text-to-audio&sort=trending)
- Quality, from a third party with a stake (the Stable Audio 3 paper, SDD instrumental set, 120 s): ACE-Step 1.5 xl-turbo scores FAD 0.193, CLAP 0.321, OVL 3.35, MUS 3.15 in 6.23 s on H200, against SA3 medium's FAD 0.107, CLAP 0.390, OVL 4.20, MUS 4.15 in 0.78 s — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)

### Inferences
- On a 30-core M3 Max (300 GB/s, slower than an M5), expect xl-turbo at roughly 15–30 s per 30 s clip and xl-sft at
  several minutes. The 2B turbo should be faster still. This is an estimate; nobody has published an M3 Max number.
- For 8–30 s beds, skip the LM "thinking"/planner (it is the slow part on Mac) and drive the DiT with caption + BPM + key
  + duration.
- LoRA training on a 36 GB Mac looks possible but immature (the MPS bf16 fix is still an open PR). Plan it as an
  experiment, not a pipeline step.

### Gaps
- No measured M3 Max timings, and no independent listening tests of ACE-Step at 8–30 s lengths. The minimum duration is 10 s per the README, so 8 s beds need trimming.
- The model card doesn't name the licensors or the share of each data type.

## 2. Stable Audio Open 1.0 / Small, and the successor Stable Audio 3 (open weights, May 2026), on Mac

### Takeaway
Stable Audio Open 1.0 (2024) and Open Small (2025) are now **superseded** by **Stable Audio 3**, released 20 May 2026.
Its small-music (459M DiT) and medium (1.4B) weights are open under the Stability AI Community License: free commercial
use under $1M revenue, but you must register and display "Powered by Stability AI". It was trained only on licensed
(AudioSparx) and Creative Commons (Freesound) audio. It has inpainting and continuation, ComfyUI support since release
day, and an MLX conversion. It is fast enough on a Mac to generate in seconds. In its own paper it beats ACE-Step 1.5 on
instrumental quality.

### Cited Findings
- Release: 20 May 2026, a four-model family. small-music, small-sfx and medium have open weights; large (2.7B) is API/fal.ai/enterprise only — [The Decoder](https://the-decoder.com/stability-ai-launches-stable-audio-3-0-with-up-to-six-minute-tracks-and-open-weights/), [MarkTechPost](https://www.marktechpost.com/2026/05/26/stability-ai-releases-stable-audio-3-a-family-of-fast-latent-diffusion-models-for-audio-generation-and-editing/)
- Sizes: small 459M DiT + SAME-S 108M autoencoder (max 2 min, small-music is instrumental only); medium 1.4B + SAME-L 852M (max 6:20, music and SFX). Media reports also cite 1.6B for medium; the paper says 1.4B — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)
- Training data: AudioSparx licensed (806 284 files) plus Freesound CC-0 / CC-BY / CC-Sampling+. Music was screened by a content-detection company and copyrighted material removed — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)
- Peak VRAM: small 1.89 GB (30 s); medium 5.49 GB (30 s), 6.52 GB (380 s) — [arXiv 2605.17991, Table 13](https://arxiv.org/html/2605.17991v1)
- Mac timing (paper, 8 ping-pong steps, small): MacBook Pro M4 CPU-only 1.72 s for 30 s of audio; CoreML 0.63 s for 30 s. No medium-on-Mac figure — [arXiv 2605.17991, Table 14](https://arxiv.org/html/2605.17991v1)
- Paper limitations: short clips (20 s) score worse because "most short training samples are loops"; long-duration conditioning biases towards ambient/classical; small gives less smooth edit transitions than medium; continuation is worse than inpainting — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)
- MLX: `mlx-community/stable-audio-3-medium` (uploaded 2026-11-11) generates 44.1 kHz stereo, up to 380 s, in 8 steps. The example prompt includes "85 BPM" in the text, with `--duration 30`. It says "Stable Audio 3 support in mlx-audio is in review and ships in its next release", so it isn't in a released mlx-audio yet. The T5Gemma text encoder adds the Gemma Terms of Use — [HF mlx-community/stable-audio-3-medium](https://huggingface.co/mlx-community/stable-audio-3-medium)
- Stability ships its own optimised exports (including MLX) in `stabilityai/stable-audio-3-optimized` — [HF mlx-community card, Source section](https://huggingface.co/mlx-community/stable-audio-3-medium)
- HF repos are gated with click-through access (`gated: auto`) and licence `stable-audio-community` — [HF API: stable-audio-3-medium](https://huggingface.co/api/models/stabilityai/stable-audio-3-medium)
- Community License terms: it terminates above "USD $1,000,000 in annual revenue"; for commercial use "You must register with Stability AI"; you own outputs "to the extent permitted by applicable law"; distribution of the models or products using them requires displaying "Powered by Stability AI"; you may not use outputs "to create or improve any foundational generative AI model" — [Stability AI Community License](https://stability.ai/community-license-agreement)
- Stability says LoRA training docs ship with the small and medium weights — [The Decoder](https://the-decoder.com/stability-ai-launches-stable-audio-3-0-with-up-to-six-minute-tracks-and-open-weights/) (secondary)
- Older: Stable Audio Open 1.0 (HF, 2024-05; licence `stable-audio-community`) maxed out at 47 s; Open Small (2025-05; `stability-ai-community`) at 11 s — [HF API](https://huggingface.co/api/models/stabilityai/stable-audio-open-small), [The Decoder](https://the-decoder.com/stability-ai-launches-stable-audio-3-0-with-up-to-six-minute-tracks-and-open-weights/)
- No Stable Audio 2.5 open weights: the SA3 paper mentions 2.5 only as an API model that "does not generalize well to efficient variable-length inference" — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)

### Inferences
- For MSP, SA3 medium is probably the best quality-per-second choice. Expect a few seconds per 30 s bed on an M3 Max via
  MLX or ComfyUI MPS, at ~6 GB. This is an estimate: there is only an M4 number, and only for small.
- Licence: fine while MSP is under $1M, but it needs a registration step and a "Powered by Stability AI" mention. Whether
  that attribution applies to outputs posted on Instagram (as opposed to distributing the model or a product) is
  ambiguous; a line on a website or about page is a cheap way to be safe.
- The "short clips are loops" note suggests 8–20 s generations may come out loop-like. That is good for beds, but quality
  at 20 s measured lower. Generating 30 s and trimming may sound better.

### Gaps
- No public M3/M4 Max timings for SA3 medium via MLX/MPS. I didn't find user reports of MPS problems in ComfyUI.
- I didn't verify the exact clause for revenue counting with affiliates, or whether the registration form is still the
  same page in Nov 2026.

## 3. New open models, Jun–Nov 2026: names, licences, Mac support

### Takeaway
Besides Stable Audio 3 (May), the notable 2026 releases are: **MiniMax Music 3** (open weights Aug 2026, custom
community licence, commercial OK under $20M, but CUDA-only, song/vocal-focused, and with an acceptable-use clause
requiring disclosure of machine-generated content); **YuE2-3B** (Sep 2026, CC-BY-NC, so not usable); and **Magenta
RealTime 2** (Google, 4 Jun 2026, CC-BY-4.0 weights, native on Apple Silicon, trained on ~71k h of mostly instrumental
stock music). HeartMuLa 3B (Apache-2.0) got a weights update on 15 Nov 2026. DiffRhythm 2 (Apache-2.0) is from Oct 2025.

### Cited Findings
- HF text-to-audio trending (16 Nov 2026), top entries: MiniMaxAI/MiniMax-Music3 (2026-08-07), m-a-p/YuE2-3B (2026-09-09), ACE-Step 1.5, stabilityai/stable-audio-3-medium / small-sfx / small-music (2026-05-17), google/magenta-realtime-2 (2026-05-28), audio-cpp GGUF ports of MiniMax-Music3 and YuE2 (Aug/Sep 2026) — [HF API trending](https://huggingface.co/api/models?pipeline_tag=text-to-audio&sort=trendingScore&limit=40)
- **MiniMax Music 3**: 8B global LLM (from Qwen3-8B) + 0.6B local LLM + flow-matching synthesis; songs up to 5 min, 32 kHz stereo; structured caption with BPM/key/scale; `[Instrumental]` section tag. Limitations: "Inference requires CUDA", and tempo/key "may not always match". Fits under 24 GB; ~22 GB with CPU offload; 8 GB with layer streaming — [HF model card](https://huggingface.co/MiniMaxAI/MiniMax-Music3)
- MiniMax-Music3 COMMUNITY LICENSE: permissive grant; commercial products must "prominently display 'MiniMax-Music3' on the user interface"; written authorisation needed above US$20M yearly revenue. The AUP, item 11, bans using it "to generate or disseminate information … in or to any public environment … without clearly and prominently disclosing that such information and/or content is machine-generated" — [LICENSE](https://huggingface.co/MiniMaxAI/MiniMax-Music3/blob/main/LICENSE)
- MiniMax Music 3 has ComfyUI tutorials — [HF model card](https://huggingface.co/MiniMaxAI/MiniMax-Music3) linking [docs.comfy.org](https://docs.comfy.org/tutorials/audio/minimax/minimax-music-3)
- audio.cpp GGUF of MiniMax Music 3: Q4/Q8/BF16; measured only on an RTX 5090 (Q4 mix 1.35× realtime at 9.8 GiB). Its CLI example uses `--backend cuda`. Metal support is not stated — [HF audio-cpp/MiniMax-Music3-GGUF](https://huggingface.co/audio-cpp/MiniMax-Music3-GGUF)
- **YuE2-3B**: licence `cc-by-nc-4.0` (non-commercial) — [HF API](https://huggingface.co/api/models/m-a-p/YuE2-3B)
- **Magenta RealTime 2**: code Apache 2.0, weights CC-BY-4.0; "Google claims no rights in outputs you generate" — [HF model card](https://huggingface.co/google/magenta-realtime-2). Released 4 Jun 2026. 2.4B base needs M3 Pro+/M2 Max+ for real time; 230M small runs in real time on any Apple Silicon; offline rendering on any Apple Silicon Mac. Controls are text, audio and MIDI, with ~200 ms control latency. Trained on ~71k h of "mostly instrumental stock music" — [Magenta blog](https://magenta.withgoogle.com/magenta-realtime-2)
- **HeartMuLa-oss-3B**: apache-2.0, last modified 2026-11-15 — [HF API](https://huggingface.co/api/models/HeartMuLa/HeartMuLa-oss-3B)
- **DiffRhythm 2**: apache-2.0 (2025-10, older); DiffRhythm-1_2 has no licence tag — [HF API DiffRhythm2](https://huggingface.co/api/models/ASLP-lab/DiffRhythm2)
- `micknoisemachine/mimetic-a0` (Oct 2026): MIT, stable-audio-tools-based, tagged `cc0`. A one-person release with ~470 downloads — [HF API](https://huggingface.co/api/models/micknoisemachine/mimetic-a0)

### Inferences
- MiniMax Music 3 is out for this Mac (CUDA-only, 8B LLM, vocal-song focus). Its AUP disclosure clause would also force
  an AI label on every post.
- Magenta RT 2 is the most Mac-native option, and its CC-BY-4.0 weights are commercial-OK. It is a streaming/jam model,
  though, steered by text/audio/MIDI rather than a "30 s bed, ending cleanly" generator. Its MIDI and audio prompting
  make it interesting for "variation of our signature motif".

### Gaps
- I didn't check HeartMuLa's Nov 2026 changes or Mac status, or DiffRhythm 2 MPS reports.
- I didn't verify whether Magenta RT 2 offline rendering is exposed as a CLI/Python API for fixed-length files.
- I found no other Jun–Nov 2026 instrumental-focused open model with commercial weights.

## 4. Controllability: duration, BPM, key, loops, clean endings, stems, audio-to-audio, inpainting/extension

### Takeaway
ACE-Step 1.5 has the widest controls: duration (10 s–10 min), BPM, key/scale, time signature, repaint (inpaint), cover
(audio-to-audio), reference audio, track separation and multi-track "lego" (base models only). SA3 offers exact duration
conditioning, inpainting and continuation, with BPM only as text in the prompt. No model offers a guaranteed seamless
loop or a guaranteed clean ending; plan on post-processing (fades, trimming at a bar boundary).

### Cited Findings
- ACE-Step 1.5: "Metadata Control: duration, BPM, key/scale, time signature"; duration 10 s to 600 s; Repaint "Selective local audio editing" (all DiT variants); Cover Generation and Reference Audio Input; Track Separation ("Separate audio into individual stems") and Multi-Track Generation; "Lego" and "Complete" only on base / xl-base — [GitHub README](https://github.com/ace-step/ACE-Step-1.5)
- MLX cover path bug (cover_noise_strength ignored) — [GitHub issues](https://github.com/ace-step/ACE-Step-1.5/issues?q=mac+OR+mps+OR+mlx)
- SA3: duration is a conditioning input (variable length), plus single/multi-segment inpainting and continuation. BPM appears only as a prompt metadata field in training; there is no inference BPM control and no loop or audio-to-audio feature described — [arXiv 2605.17991](https://arxiv.org/html/2605.17991v1)
- MiniMax Music 3: BPM/key in a structured caption, but "may not always match every requested detail exactly" — [HF card](https://huggingface.co/MiniMaxAI/MiniMax-Music3)
- Magenta RT 2: steering by text, audio examples and MIDI — [HF card](https://huggingface.co/google/magenta-realtime-2)

### Inferences
- For a "ticking-clock tension" bed timed to a Reel, ACE-Step's BPM lock helps align cuts. SA3 needs "120 BPM" in the
  prompt and a beat-tracking check afterwards.
- Clean ending: generate a few seconds longer than needed, then fade, or use inpainting/repaint on the last 2–3 s with an
  "ending" prompt (both models support region editing).

### Gaps
- No benchmark of BPM/key adherence or loopability for any of these models was found.

## 5. Integration: ComfyUI, CLI/Python, memory

### Takeaway
ComfyUI natively supports both ACE-Step 1.5 (Comfy-Org repack) and Stable Audio 3 (since release day, 20–21 May 2026).
For scripting, the options are ACE-Step's Gradio/CLI/API (with a macOS MLX launcher), third-party MLX runners, and
mlx-audio for SA3 (support pending a release). Memory is modest: SA3 medium ~5.5–6.5 GB, ACE-Step XL ~9.5 GB on MLX.
Both fit easily in 36 GB.

### Cited Findings
- ComfyUI Stable Audio 3 support "Day-0" (21 May 2026), template in the Audio category, weights at `Comfy-Org/stable-audio-3` — [ComfyUI blog](https://blog.comfy.org/p/stable-audio-3-day-0-support), [ComfyUI on X](https://x.com/ComfyUI/status/2057288575344111792)
- A community workflow (16 Nov 2026) uses EmptyLatentAudio → CLIPLoader (t5gemma_b_b_ul2, type stable_audio) → SaveAudioMP3 — [DEV Community](https://dev.to/ai-ksk/sound-assets-in-comfyui-stable-audio-3-for-bgm-then-ltx-23-for-audio-reactive-animation-5flf) (via search snippet)
- The ComfyUI docs changelog lists "Stable Audio 3.0" support and a native audio recording node. The date shown (10 Nov 2026) may not be accurate — [ComfyUI changelog](https://docs.comfy.org/changelog) (via search snippet)
- ACE-Step ComfyUI repack: `Comfy-Org/ACE-Step-1.5` (~887k downloads) — [HF API trending](https://huggingface.co/api/models?pipeline_tag=text-to-audio&sort=trendingScore&limit=40)
- mlx-audio CLI for SA3: `python -m mlx_audio.music.generate --model mlx-community/stable-audio-3-medium --caption … --duration 30 --seed 11` — [HF card](https://huggingface.co/mlx-community/stable-audio-3-medium)
- MiniMax Music 3: diffusers modular pipeline (pending PR), SGLang-Omni server, ComfyUI tutorial; CUDA required — [HF card](https://huggingface.co/MiniMaxAI/MiniMax-Music3)

### Inferences
- The lowest-friction path is the ComfyUI already installed locally (via the comfyui MCP), using the SA3 and ACE-Step
  templates. Both are light enough to count as "small" jobs, though the project rule still requires the owner's
  go-ahead for ComfyUI generation.

### Gaps
- I didn't confirm that the ComfyUI SA3 / ACE-Step nodes run cleanly on MPS (no issue reports found either way).

## 6. Policy: Instagram AI disclosure, Rights Manager claims, community sentiment

### Takeaway
Meta requires a label for "photorealistic video or realistic-sounding audio" that is digitally generated. Its rules
don't specifically cover AI instrumental music, so this is a grey zone. MiniMax's licence would require disclosure
regardless. I found no credible reports of locally generated AI beds triggering Rights Manager claims; the risk is
outputs that resemble existing works. Anti-AI sentiment is rising, and Instagram's own head expects it to grow,
especially among creative communities.

### Cited Findings
- Meta's rule (as quoted by third parties): "Meta requires you to label content you share that has photorealistic video or realistic-sounding audio that has been digitally generated or altered, including with AI", with possible penalties for not labelling. The example given is a realistic AI voiceover — [Postora 2026](https://www.postora.org/blog/ai-generated-content-labels-social-media-2026), [Virallized](https://www.virallized.com/instagram-ai-label) (secondary; Meta's help page fetched without body text)
- Postora's table lists "AI-generated music" as "Not listed" for Meta, meaning there is no explicit rule — [Postora](https://www.postora.org/blog/ai-generated-content-labels-social-media-2026)
- Instagram auto-labels "AI info" from C2PA/IPTC metadata. The label was renamed from "Made with AI" in July 2024 — [Postora](https://www.postora.org/blog/ai-generated-content-labels-social-media-2026) (secondary)
- Meta help page "Labeling AI content on Instagram": the label toggle is only in the mobile apps, not on desktop — [Instagram Help](https://www.facebook.com/help/instagram/761121959519495)
- Claims: muting comes from automated fingerprinting or manual rights-holder claims; disputes go through "Copyright information" on the Reel. "Royalty-free doesn't mean claim-proof", and AI output too similar to an existing work can be flagged. The idea that Instagram upgraded fingerprinting in 2026 to scan AI audio comes only from distributor blogs — [Audiodrome](https://audiodrome.net/for-creators/instagram-music-copyright/), [LastPlayDistro](https://lastplaydistro.com/blog/instagram-reels-music-copyright-update-2026-new-rules-ai-music-account-safety-explained) (low-quality/vendor sources)
- Sentiment: Adam Mosseri (29 Oct 2026) warned that the AI backlash "is only going to get worse", strongest among creative people — [Fast Company](https://www.fastcompany.com/91632443/instagram-head-adam-mosseri-warns-creators-that-ai-backlash-is-only-going-to-get-worse). Brand backlash in 2026 targeted AI visuals (Gucci, Valentino, McDonald's NL); Nile Rodgers drew backlash over AI in a music video; NPR called 2026 "the fakest year in music"; ARIA (Aug 2026) banned largely-AI songs from Australian charts — [NPR](https://www.npr.org/2026/10/27/nx-s1-5993862/2026-timeline-fake-music-geese-stella-lefty-ai), [Rolling Stone AU](https://au.rollingstone.com/music/music-news/nile-rodgers-defends-ai-use-new-music-video-christmas-song-103090/), [Grey Journal](https://greyjournal.net/hustle/grow/ai-slop-backlash-2026/)
- 87% of US/UK consumers assume brand content is at least partly AI-made (Emplifi) — [Grey Journal](https://greyjournal.net/hustle/grow/ai-slop-backlash-2026/) (secondary)

### Inferences
- A background instrumental bed is not "realistic" content that could deceive anyone the way a fake voice or face can,
  so labelling is probably not mandatory. Labelling voluntarily, or saying "music made with an open model trained on
  licensed music" in a caption, costs little. Strip C2PA metadata only if that is a deliberate choice; Meta may
  auto-label either way.
- The puzzling community is a hobby, not a creative-music scene, so the backlash risk is lower than for art/music
  accounts. It is not zero: the "AI slop" framing is spreading. Keep the beds unobtrusive, and consider a few
  human-made or CC-licensed tracks for flagship posts.
- A practical claim-risk control: avoid style prompts naming artists, keep generations short and generic, and archive
  prompt, seed, model and version per bed as evidence in a dispute.

### Gaps
- I couldn't load the body of Meta's own help page to quote it directly. I found no news-grade reports of AI-generated
  or royalty-free beds being muted on Instagram in 2026, and no puzzling-community-specific sentiment data.

## 7. Hosted alternatives (brief)

### Takeaway
ElevenLabs Music is the only one with an official API and documented commercial terms (paid plans, $0.15/min via API,
v2.5 since Sep 2026, trained on licensed music). Suno and Udio have no official public API; Suno grants commercial rights
only on Pro+. Stable Audio 3 large is API-only (Stability API / fal.ai).

### Cited Findings
- ElevenLabs: commercial use on paid plans (film/TV/radio/studio games need Enterprise); Music Terms dated 9 Oct 2026; Free plan requires credit; API $0.15/min; Music v2.5 on 11 Sep 2026; one-way indemnity from user to ElevenLabs — [ElevenLabs Music API](https://elevenlabs.io/eleven-music-api), [gradually.ai](https://www.gradually.ai/en/elevenlabs-music/), [licenseorg](https://www.licenseorg.com/blog/ai-music-licensing-suno-elevenlabs) (mostly secondary)
- Suno: no public API (MCP connector beta since 28 Oct 2026); commercial rights from Pro; no retroactive licence for free-plan songs; terms changed 3 Sep 2026. Udio: no official API — [teamday.ai](https://www.teamday.ai/blog/best-ai-music-models-2026), [apiframe](https://apiframe.ai/blog/ai-music-api-pricing-2026) (secondary)
- SA3 large: API, fal.ai, or enterprise self-hosting only — [The Decoder](https://the-decoder.com/stability-ai-launches-stable-audio-3-0-with-up-to-six-minute-tracks-and-open-weights/)

### Inferences
- For 5–10 beds a month at 30 s, ElevenLabs API costs well under $1/month in generation (plus the plan), and is the
  clean hosted fallback if local quality disappoints.

### Gaps
- I didn't read the ElevenLabs and Suno terms first-hand; the figures above come from secondary sources.

## Shortlist summary (for the report writer)

| Model | Weights licence | Outputs | Mac path (M3 Max 36 GB) | Speed on Mac | Short-instrumental quality | Controls |
|---|---|---|---|---|---|---|
| **Stable Audio 3 medium** (May 2026) | Stability Community (<$1M free, register, "Powered by Stability AI") + Gemma terms for T5Gemma | yours | ComfyUI native; MLX (mlx-community, mlx-audio release pending) | est. seconds (M4 small: 0.63 s/30 s CoreML) | best in its own paper (OVL 4.20) | duration, inpaint, continuation; BPM via prompt |
| **Stable Audio 3 small-music** | same | yours | ComfyUI; CPU/CoreML | <2 s/30 s on M4 | good, instrumental-only | same; rougher edits |
| **ACE-Step 1.5 XL-turbo / 2B** | MIT | yours (originality disclaimer) | official MLX + MPS, ComfyUI | ~16 s per 30 s on M5 (xl-turbo) | good; below SA3 in SA3's benchmark | BPM, key, time sig, duration ≥10 s, repaint, cover, stems, LoRA |
| Magenta RT 2 | CC-BY-4.0 | "Google claims no rights" | native Apple Silicon | real time | stock-music trained | text/audio/MIDI steering |
| MiniMax Music 3 | custom community (<$20M) + AI-disclosure AUP | – | CUDA only | n/a | song-focused | caption BPM/key |
| YuE2, MusicGen | CC-BY-NC | – | – | – | – | excluded |
