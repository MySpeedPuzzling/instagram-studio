# Audio utility models for an automated music-bed pipeline (M3 Max, 36 GB), as of 16 Nov 2026

Scope: separation, automatic quality judging, mastering/reference matching, key/tempo analysis, loudness/true-peak
metering. Not repeated here (covered elsewhere): CLAP/LAION-CLAP, PANNs, librosa, beat_this, allin1, musicfit, ffmpeg
loudnorm, rubberband, pedalboard licences, Essentia/MuQ weight licences.

Method note: GitHub licence fields, last-push dates and star counts were read from the GitHub API on 2026-11-16
(`gh api repos/<owner>/<repo>`); Hugging Face licence tags were read from `huggingface.co/api/models/<id>` the same day.
"Last push" is shown so stale projects are visible. Nothing was installed or run; no speed figure below was measured
on the owner's M3 Max.

Owner constraints applied: no attribution anywhere, outputs used publicly, the repo is open source. Licence reading
used throughout (inference, not legal advice): permissive licences (MIT, Apache-2.0, BSD) only require keeping the
licence notice when *redistributing the code/weights*, not crediting in published audio. CC BY 4.0 requires credit
when *sharing the licensed material itself* (e.g. vendoring the weights into the repo); running it locally to score
clips publishes nothing of it. Any NC (non-commercial) licence is treated as excluded, because @myspeedpuzzling
promotes a product.

## 1. Stem separation on Mac (Demucs / RoFormer / MLX ports)

### Takeaway
Demucs (htdemucs, MIT code and weights, maintained fork `adefossez/demucs`) is the clean, licence-safe choice, and
the MIT MLX port `ssmall256/demucs-mlx` makes it very fast on Apple Silicon (114x realtime warm on an M4 Max, 2.7x
stock PyTorch-MPS). RoFormer models separate better but most community checkpoints have no clear licence; the
`python-audio-separator` wrapper runs everything on MPS but its README asks for credit to UVR, which clashes with
the no-attribution rule.

### Cited Findings
- `facebookresearch/demucs`: MIT, **archived** (last push 2024-04-24, older info); active fork `adefossez/demucs`: MIT,
  last push 2026-10-26, 3552 stars — [GitHub API: facebookresearch/demucs](https://github.com/facebookresearch/demucs); [adefossez/demucs](https://github.com/adefossez/demucs)
- htdemucs is a 4-stem model (bass/drums/vocals/other; multisong avg SDR 9.16, drums 10.88), a 6-stem variant
  adds piano and guitar; its weights are hosted by Meta at dl.fbaipublicfiles.com — [ZFTurbo pretrained models list](https://github.com/ZFTurbo/Music-Source-Separation-Training/blob/main/docs/pretrained_models.md)
- `ssmall256/demucs-mlx` (MIT, last push 2026-10-05): native MLX port, "No PyTorch required"; "114x realtime once warm
  on a 40-core M4 Max ... 2.7x faster than stock Demucs on PyTorch MPS ... 18x faster than PyTorch on CPU". Table for
  120 s stereo: demucs 4.1.0 PyTorch CPU 19.4 s (6x), MPS 2.82 s (42x). Requires MLX 0.32.3+. Notes MLX "keeps
  roughly 16–31 GB" cached in some runs — [ssmall256/demucs-mlx README](https://github.com/ssmall256/demucs-mlx)
- Other MIT Demucs MLX ports exist (`andrade0/demucs-mlx`, Swift ports `kylehowells/demucs-mlx-swift`,
  `xocialize/mlx-demucs-swift`) and an `mlx-community/demucs-mlx` HF repo tagged MIT (updated 2026-03-16) — [GitHub search "demucs mlx"](https://github.com/search?q=demucs+mlx&type=repositories); [HF mlx-community/demucs-mlx](https://huggingface.co/mlx-community/demucs-mlx)
- `lucidrains/BS-RoFormer` (BS-RoFormer and Mel-RoFormer architecture code): MIT, last push 2026-11-04. It is an
  implementation, not a trained checkpoint — [lucidrains/BS-RoFormer](https://github.com/lucidrains/BS-RoFormer)
- `ZFTurbo/Music-Source-Separation-Training`: MIT code, last push 2026-11-12; lists many checkpoints (HTDemucs,
  MDX23C, SCNet, DTTNet, RoFormers, DrumSep models by community authors); the list carries no per-checkpoint licence
  column — [ZFTurbo pretrained models](https://github.com/ZFTurbo/Music-Source-Separation-Training/blob/main/docs/pretrained_models.md)
- Mel-RoFormer checkpoints on HF: `KimberleyJSN/melbandroformer` tagged MIT; `GaboxR67/MelBandRoformers` and
  `pcunwa/Mel-Band-Roformer-big` have **no licence tag**; MLX conversions `mlx-community/mel-roformer-kim-vocal-2-mlx`
  and `mel-roformer-zfturbo-vocals-v1-mlx` tagged MIT (updated 2026-05-01) — [HF API, model pages e.g.](https://huggingface.co/KimberleyJSN/melbandroformer)
- `nomadkaraoke/python-audio-separator`: MIT, last push 2026-10-29; on Apple Silicon runs Demucs and MDXC/RoFormer on
  PyTorch MPS, MDX ONNX on CoreML; needs PyTorch 2.13+ on Apple Silicon; native fp16 verified for Mel/BS-RoFormer on
  MPS. Its README asks: "If you ... integrate this project ... using the default model or any other model trained as
  part of the UVR project, please honor the MIT license by providing credit to UVR" — [python-audio-separator README](https://github.com/nomadkaraoke/python-audio-separator)
- `deezer/spleeter` (MIT, 2/4/5 stems, TensorFlow) and `sigsep/open-unmix-pytorch` (MIT, last push 2024-06, older)
  are permissive but older/weaker baselines — [deezer/spleeter](https://github.com/deezer/spleeter); [open-unmix](https://github.com/sigsep/open-unmix-pytorch)
- `mlx-audio` (MIT, last push 2026-11-16) includes SAM-Audio (text-guided source separation,
  `mlx-community/sam-audio-large`) — [mlx-audio README](https://github.com/Blaizzy/mlx-audio). Meta's
  `facebook/sam-audio-large` is gated and tagged `license:other` — [HF facebook/sam-audio-large](https://huggingface.co/facebook/sam-audio-large)

### Inferences
- Use case "remove drums/lead for a softer bed": htdemucs 4-stem, keep `other`+`bass`, or remix drums at -10 to
  -15 dB rather than muting (separation residue is less audible when the stem is ducked than removed). htdemucs_6s
  could pull piano/guitar as the lead, but its piano/guitar quality is unpublished in the table above.
- For ACE-Step output (instrumental only), vocal-removal RoFormers are mostly unneeded; their value is as a
  "vocals present?" check (energy in the vocal stem), see section 2.
- Recommended: `demucs-mlx` (MIT) for speed; fall back to `adefossez/demucs` on MPS. Avoid uncredited UVR/community
  RoFormer checkpoints unless a specific checkpoint has an explicit MIT/Apache tag (e.g. KimberleyJSN MIT).
- An 8–30 s bed at ~40–100x realtime is well under a second of separation work; the main cost is model load.

### Gaps
- No M3 Max (30-core GPU) benchmark for demucs-mlx found; only M4 Max figures.
- The licence of the Meta-hosted htdemucs weights is inferred from the repo's MIT licence; no separate weights licence
  file was checked.
- SAM-Audio licence terms (gated "other") were not readable without login.

## 2. Automatic quality assessment of generated music

### Takeaway
The only open, commercially-usable, purpose-built scorer is Meta's Audiobox Aesthetics (code+weights CC BY 4.0; four
axes: production quality, production complexity, content enjoyment, content usefulness). SongEval and MusicEval-based
tools are non-commercial or song/vocal-oriented. Among audio-language models, Qwen3-Omni (Apache-2.0) is the only one
that is both permissive and shown (Oct 2026) to actually respond to audio when judging musical quality; Audio
Flamingo 3 / Music Flamingo are NVIDIA non-commercial. Use LLM judges for categorical checks (vocals? glitch? mood?),
not as a precise score.

### Cited Findings
- `facebookresearch/audiobox-aesthetics`: GitHub licence CC-BY-4.0, last push 2025-06-05 (older); README: "The
  majority of audiobox-aesthetics is licensed under CC-BY 4.0 ... portions ... (microsoft/unilm) MIT"; HF
  `facebook/audiobox-aesthetics` tagged cc-by-4.0, ~355k downloads — [audiobox-aesthetics README](https://github.com/facebookresearch/audiobox-aesthetics); [HF card](https://huggingface.co/facebook/audiobox-aesthetics)
- SongEval: GitHub API reports Apache-2.0, but the README says "released under the CC BY-NC-SA 4.0 license ... for
  non-commercial purposes"; it scores full songs "vocals + accompaniment" on five axes incl. "Naturalness of Vocal
  Breathing" — [ASLP-lab/SongEval README](https://github.com/ASLP-lab/SongEval) (licence conflict: GitHub metadata vs README)
- MusicEval dataset (2,748 clips from 31 TTM systems, 13,740 expert ratings) is CC BY-NC 4.0; the paper's CLAP-based
  scorer code licence was not confirmed — [HF BAAI/MusicEval](https://huggingface.co/datasets/BAAI/MusicEval); [arXiv 2501.10811](https://arxiv.org/pdf/2501.10811)
- MuQ-Eval (per-clip quality metric trained on MusicEval) has MIT code but builds on MuQ (weights non-commercial per
  prior notes) — [dgtql/MuQ-Eval](https://github.com/dgtql/MuQ-Eval)
- FAD tooling (set-level, needs a reference set, not a per-clip gate): `microsoft/fadtk` MIT (last push 2025-08),
  `gudgud96/frechet-audio-distance` MIT, `Stability-AI/stable-audio-metrics` MIT (last push 2026-11-02) — [fadtk](https://github.com/microsoft/fadtk); [frechet-audio-distance](https://github.com/gudgud96/frechet-audio-distance); [stable-audio-metrics](https://github.com/Stability-AI/stable-audio-metrics)
- Audio-language model licences:
  - Qwen3-Omni-30B-A3B-Instruct and -Captioner: HF `license: other`, `license_name: apache-2.0`; GitHub repo Apache-2.0 — [HF Qwen3-Omni Instruct](https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct); [QwenLM/Qwen3-Omni](https://github.com/QwenLM/Qwen3-Omni)
  - Qwen2.5-Omni-7B/3B: `license_name: apache-2.0`, LICENSE file is Apache 2.0 — [HF Qwen2.5-Omni-7B](https://huggingface.co/Qwen/Qwen2.5-Omni-7B)
  - Qwen2-Audio-7B-Instruct: Apache-2.0; MLX 4-bit build `mlx-community/Qwen2-Audio-7B-Instruct-4bit` runs in mlx-audio — [mlx-audio README](https://github.com/Blaizzy/mlx-audio)
  - Kimi-Audio-7B-Instruct: HF tagged MIT; README: Qwen2.5-derived code Apache 2.0, other code MIT — [MoonshotAI/Kimi-Audio](https://github.com/MoonshotAI/Kimi-Audio) (last push 2025-06, older)
  - Audio Flamingo 3 and Music Flamingo: "for non-commercial research purposes only", NVIDIA OneWay Noncommercial
    License — [HF nvidia/audio-flamingo-3-hf](https://huggingface.co/nvidia/audio-flamingo-3-hf); [HF nvidia/music-flamingo-hf](https://huggingface.co/nvidia/music-flamingo-hf)
  - MiMo-Audio-7B-Instruct: MIT (updated 2026-10-28); Ming-3.0-audio-tiny MLX: MIT; Step-Audio-2-mini: Apache-2.0;
    mlx-audio also lists MOSS-Music ("music understanding") — [mlx-audio README](https://github.com/Blaizzy/mlx-audio); HF API tags
- Evidence on LLM judges (arXiv 2610.13247, 9 Oct 2026): five open judges on all 2,748 MusicEval clips; without audio
  no judge beat a prompt-only baseline; "only two" judges followed the audio for musical quality; pairwise judging by
  smaller judges followed the clip's slot, not quality; rewording the instruction moved correlations about as much as
  switching judges — [arXiv abs](https://arxiv.org/abs/2610.13247). Per the search summary of the paper, the two
  audio-responsive quality judges were Audio Flamingo 3 and Qwen3-Omni (others: Qwen2-Audio, Qwen2.5-Omni, Music
  Flamingo) — [alphaxiv 2610.13247](https://www.alphaxiv.org/abs/2610.13247) (judge names not shown on the arXiv abstract page)
- Mac/MLX: `mlx-community/Qwen3-Omni-30B-A3B-Instruct-4bit` exists (updated 2025-12-24, tagged apache-2.0) — [HF](https://huggingface.co/mlx-community/Qwen3-Omni-30B-A3B-Instruct-4bit);
  `vllm-omni-mlx` lists Qwen3-Omni 30B-A3B "chat works via mlx-vlm" — [EJqy/vllm-omni-mlx](https://github.com/EJqy/vllm-omni-mlx);
  an sglang-omni PR adds native MLX Qwen3-Omni with median audio→text latency 0.226 s at a 16-token output limit
  (chip not stated) — [sglang-omni PR #2130](https://github.com/sgl-project/sglang-omni/pull/2130)
- Qwen3-Omni-30B encodes audio at 13 tokens/s of input (so a 30 s bed ≈ 390 audio tokens) — [Qwen3-Omni report via search](https://arxiv.org/pdf/2509.17765)

### Inferences
- A practical gate, all licence-safe: (1) Audiobox Aesthetics PQ/CE scores as a numeric filter and ranking signal
  across N ACE-Step candidates (used locally, weights not vendored into the repo, so no credit is triggered);
  (2) Qwen3-Omni-30B-A3B-Instruct 4-bit via mlx-vlm for yes/no questions ("vocals or singing present?", "any clicks,
  dropouts, sudden cuts?", "does the ending stop abruptly?", "describe the mood in 3 words") with fixed wording and
  the clip only (no pairwise, per the probe paper); (3) cheap DSP checks (clipping, silence gaps, DC, spectral
  flatness spikes) for glitches, because no open dedicated artifact detector for music was found.
- 4-bit 30B-A3B is roughly 17–18 GB of weights (estimate from parameter count, not verified); fits in 36 GB only with
  ComfyUI/ACE-Step unloaded, so run it as a separate batch step. Qwen2-Audio-7B 4-bit (Apache, mlx-audio) is the
  lighter fallback but was not shown to respond to audio for quality.
- Vocal check can also be done deterministically: Demucs vocal-stem RMS relative to mix.
- Calibrate any score against the owner's lab feedback (Works/Unsure/No-go) before trusting thresholds.

### Gaps
- No measured Audiobox Aesthetics speed or MPS support on Mac found (README does not mention devices).
- No Qwen3-Omni tokens/s on an M3 Max found.
- No open, commercially licensed model dedicated to detecting generation artifacts in music found.
- Per-judge correlation numbers from arXiv 2610.13247 not retrieved (only in the full text).

## 3. Automatic mastering / reference matching

### Takeaway
No 2026 open neural mastering model was found that is permissive and production-ready. Matchering (GPL-3.0) is still
the reference-matching standard and is usable as a separate CLI/process (GPL does not cover its output audio); the
neural research options are either NC (Diff-MST) or research-grade (ST-ITO Apache-2.0, automix-toolkit Apache-2.0).
For 8–30 s beds on phone speakers a deterministic chain is better: high-pass, gentle low-mid cleanup, light
compression, ffmpeg loudnorm two-pass to about -14 LUFS / -1 dBTP.

### Cited Findings
- `sergree/matchering`: GPL-3.0, last push 2026-10-07, 2716 stars; matches target to reference "RMS, FR, peak
  amplitude and stereo width"; plain DSP, not a trained model — [sergree/matchering](https://github.com/sergree/matchering); [search summary](https://github.com/topics/mastering)
- Matchering forks/wrappers: `tabasko81/matchering_2025` (multi-reference up to 10), `KEYHAN-A/AudioMaster` (Rust,
  GPL-3.0, uses Matchering for reference mode) — [matchering_2025](https://github.com/tabasko81/matchering_2025); [AudioMaster](https://github.com/KEYHAN-A/AudioMaster)
- `sai-soum/Diff-MST` (mixing style transfer): LICENSE is CC BY-NC-SA 4.0 — excluded — [Diff-MST](https://github.com/sai-soum/Diff-MST)
- `csteinmetz1/st-ito` (audio production style transfer with inference-time optimisation): Apache-2.0, last push
  2026-07-17, 62 stars — [st-ito](https://github.com/csteinmetz1/st-ito)
- `csteinmetz1/automix-toolkit`: Apache-2.0, last push 2024-08 (older) — [automix-toolkit](https://github.com/csteinmetz1/automix-toolkit)
- `adobe-research/DeepAFx-ST`: licence NOASSERTION, last push 2023-05 (older) — [DeepAFx-ST](https://github.com/adobe-research/DeepAFx-ST)
- Platform loudness: Instagram publishes no official LUFS figure; guides converge on -14 LUFS integrated and ≤ -1 dBTP;
  one guide says Reels normalisation only turns loud audio down; Instagram re-encodes to ~128 kbps AAC, which
  overshoots inter-sample peaks — [cutscore](https://cutscore.io/blog/loudness-for-instagram-reels); [audobox](https://audobox.com/blog/reels-loudness-why-14-lufs-is-a-gate-not-a-creative-choice.php); [mastering.to](https://mastering.to/instagram) (third-party blogs, not Instagram)
- Phone playback: guides advise midrange clarity over deep bass and checking in mono — [onloopin](https://onloopin.com/blog/mastering-for-instagram-and-reels)

### Inferences
- Recommended chain (pedalboard/ffmpeg, already licence-checked elsewhere): mono-compatibility check → high-pass
  ~60–80 Hz → small cut in 200–400 Hz mud and gentle 2–5 kHz presence if the bed sounds dull → light bus compression →
  sidechain/ducking under SFX → ffmpeg loudnorm two-pass to -14 LUFS (or lower for beds under voice/SFX) with TP -1.5
  → re-measure after the final AAC encode.
- Matchering is worth a lab trial only if beds vary a lot in tone between ACE-Step runs; call it as a subprocess and
  do not vendor its code into the repo, which keeps the project's own licence free of GPL obligations (inference).

### Gaps
- No measured smartphone speaker roll-off figures found in this pass.
- No published evaluation of Matchering or ST-ITO on short (<30 s) AI-generated beds.

## 4. Key / tempo / structure analysis with permissive licences

### Takeaway
madmom code is BSD but its model files are CC BY-NC-SA (excluded for its neural trackers); BeatNet is CC BY 4.0
(credit needed if redistributed); tempo-cnn is AGPL. For key, Deezer's S-KEY (MIT, active, CPU/MPS) is the best
permissive option; libKeyFinder is GPL.

### Cited Findings
- `CPJKU/madmom` LICENSE: source code BSD-style; "All model and data files are distributed under ... Creative Commons
  Attribution-NonCommercial-ShareAlike 4.0"; commercial use requires contacting JKU — [madmom LICENSE](https://github.com/CPJKU/madmom/blob/main/LICENSE)
- `deezer/skey`: MIT, last push 2026-10-27, "Self-supervised key estimation model that matches performance with
  supervised state-of-the-art"; CLI supports `--device cpu|cuda|mps` — [deezer/skey](https://github.com/deezer/skey)
- `mjhydri/BeatNet` (beat, downbeat, tempo, meter): CC-BY-4.0 — [BeatNet](https://github.com/mjhydri/BeatNet)
- `hendriks73/tempo-cnn`: AGPL-3.0, last push 2024-10 — [tempo-cnn](https://github.com/hendriks73/tempo-cnn)
- `mixxxdj/libkeyfinder`: GPL-3.0, last push 2024-11 — [libkeyfinder](https://github.com/mixxxdj/libkeyfinder)

### Inferences
- Tempo/beat is already covered by beat_this; for key, add S-KEY (MIT). Key is only needed if beds are crossfaded or
  joined to SFX with pitch; for 8–30 s single beds it is optional.
- Avoid madmom's pretrained processors (NC models); its DSP-only parts (BSD) are fine but redundant with librosa.

### Gaps
- Whether S-KEY's checkpoint carries the same MIT licence as the code was not separately verified.

## 5. Loudness / true-peak measurement tools

### Takeaway
All mainstream meters are permissive: libebur128 (MIT, active, has true-peak), pyloudnorm (MIT, integrated loudness
per BS.1770-4), pyebur128 bindings (MIT). ffmpeg's own `ebur128` filter (with true-peak) is enough for the pipeline's
final measurement.

### Cited Findings
- `jiixyj/libebur128`: MIT, last push 2026-11-15, "implementing the EBU R128 loudness standard" — [libebur128](https://github.com/jiixyj/libebur128)
- `csteinmetz1/pyloudnorm`: MIT, last push 2026-01-04, "implementation of ITU-R BS.1770-4" — [pyloudnorm](https://github.com/csteinmetz1/pyloudnorm)
- `jodhus/pyebur128` (Python bindings for libebur128): MIT, last push 2024-09 (older) — [pyebur128](https://github.com/jodhus/pyebur128)

### Inferences
- pyloudnorm measures integrated loudness but (from prior knowledge, not re-verified here) not true-peak; use ffmpeg
  `ebur128=peak=true` or pyebur128 for dBTP. Measure the final encoded AAC, not just the WAV, given encoder overshoot
  (section 3).

### Gaps
- ffmpeg ebur128 filter docs were not re-fetched in this pass.
