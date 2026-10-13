# Motion, data video, collage and audio toolkit for MSP Reels and Stories (October 2026)

Scope note: research only. Nothing was installed or rendered. This round goes deeper than the round-1 report (`reports/MSP Instagram content pipeline.md`), which already chose Remotion with an ffmpeg fallback, Blender for puzzle pieces, Pixabay, Mixkit and FMA for music, and 1080×1920 safe zones. Round-1 points are repeated here only where they changed or were checked again. The session's shared web-search budget ran out partway through, so some items were checked only by fetching primary pages directly, and some are listed under Gaps. "Inference" means my own reasoning, not a sourced fact. Dates are as of 2026-10-13 unless stated otherwise.

## 1. Code-to-video and animation frameworks: quality, determinism, LLM-authorability, Apple Silicon speed, licence, maturity, and which pairs best with an HTML/SVG template system

### Takeaway
There are now two credible engines for a deterministic "HTML in, MP4 out" pipeline. The first is **Remotion**: React-based, the most mature, and free for teams of 3 or fewer, but a company licence now has a **$100/month total minimum**. The second is **HyperFrames**: HeyGen's Apache-2.0 framework, open-sourced in April 2026. It renders plain HTML/CSS/GSAP/Lottie/Three.js with no React or bundler, ships an official Claude Code plugin and has about 62k GitHub stars. Because round 1's static templates are plain HTML/CSS/SVG rendered by Playwright, HyperFrames is the closest fit. Remotion is the mature fallback (or the reverse, if a bake-off says so). Use Blender for puzzle-piece 3D and ffmpeg for encoding, slideshows, LUTs and audio. Manim is active but does not share HTML design tokens. Motion Canvas looks stalled, and Revideo, Theatre.js, Natron and Friction are poor fits for an agent.

### Cited Findings

**HyperFrames (HeyGen), new since round 1**
- Licence Apache-2.0. Repo shows about 62.2k stars, 5.6k forks, 5,531 commits, 70 open issues and 176 PRs. Renders by seeking each frame in headless Chrome (Puppeteer) and encoding with FFmpeg. The README says "same input, same frames, same output" (deterministic, built for CI and regression tests). — [heygen-com/hyperframes GitHub](https://github.com/heygen-com/hyperframes)
- Supported animation runtimes are "GSAP, CSS, Lottie, Three.js, Anime.js, WAAPI, or your own frame adapter", all seekable. GSAP timelines are created paused (`gsap.timeline({ paused: true })`), registered on `window.__timelines`, and seeked per frame. — [HyperFrames README (raw)](https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md)
- Compositions are plain HTML with data attributes (`data-start`, `data-duration`, `data-track-index`, `data-composition-id`, `clip` class), with no build step or React. Requires Node.js 22+ and FFmpeg. Audio clips are elements with timing and volume attributes. A `/hyperframes-audio` skill covers EQ, compression and volume automation, and an `/embedded-captions` skill adds captions. — [HyperFrames GitHub](https://github.com/heygen-com/hyperframes)
- Agent integration: 21 published skills with `/hyperframes` as the router. Install with `claude plugin install hyperframes@hyperframes` or `npx skills add heygen-com/hyperframes`. Listed agents are Claude Code, Codex, Cursor, Gemini CLI and IBM Bob. CLI commands are `init`, `preview`, `render`, `lint`, `check`, `snapshot`, `doctor`, plus cloud and Lambda rendering. The catalogue includes transitions, overlays, captions, charts (`data-chart`), maps and effects. — [HyperFrames README (raw)](https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md)
- The README says HyperFrames is "inspired by Remotion". It contrasts its HTML authoring and lack of a bundler, and its Apache 2.0 licence, with Remotion's "source-available Remotion License". It concedes that Remotion Lambda is the more mature cloud renderer. It makes **no render-speed claims** and gives **no Apple Silicon notes**. The only output format named is MP4, and the example composition is 1920×1080. — [HyperFrames GitHub](https://github.com/heygen-com/hyperframes)
- Open-sourced around 2026-04-17 and described as the engine behind HeyGen's own launch videos. Star counts in secondary coverage range from about 4k to 23k depending on the capture date. — [The Menon Lab](https://themenonlab.blog/blog/heygen-hyperframes-video-as-code); [noqta.tn](https://noqta.tn/en/blog/heygen-hyperframes-html-to-mp4-ai-agent-video-2026)

**Remotion (re-checked)**
- Pricing page (October 2026): Free Licence for "individuals and companies up to three people". Company Licence for 4+ people: Creators **$25/month per seat** and Automators **$0.01/render with a $100/month minimum**, with a **"Total minimum: $100/month"**. Enterprise starts at $500/month. Footer © Remotion AG 2026, with no effective date. — [remotion.pro/license](https://www.remotion.pro/license). *Possible change vs round 1*, which treated one $25 Creators seat as the cheapest compliant route. The page now states a $100/month total minimum.
- Remotion 5.0 is still **"not yet released"**. Planned licence changes: contractors count toward team size; licences are tied to new T&Cs; company licence holders must enable telemetry or report render counts and pass a licence key (`"free-license"` if eligible) to rendering APIs. Planned technical changes: WebGL/WebGPU on by default with `angle` (fallback `swangle`); `colorSpace` defaults to `bt709`; `@remotion/media-parser` and `@remotion/webcodecs` retired in favour of Mediabunny. — [Remotion 5.0 migration](https://www.remotion.dev/docs/5-0-migration)
- `@remotion/three`: `<ThreeCanvas>` (React Three Fiber) and `<ThreeWebGPUCanvas>`. Animations must use `useCurrentFrame()` rather than `useFrame()` for deterministic frames. In 4.x, render Three.js with `--gl=angle`, otherwise headless Chrome may produce an empty canvas. In 5.0 ANGLE becomes the default. — [Remotion docs: ThreeCanvas / ThreeWebGPUCanvas / @remotion/three](https://www.remotion.dev/docs/three-webgpu-canvas)
- `@remotion/lottie` (`<Lottie animationData>` via lottie-web, svg/canvas/html renderers) and `@remotion/rive` (`<RemotionRiveCanvas src=".riv">`) exist. `@remotion/web-renderer` (`renderMediaOnWeb()`) renders client-side with WebCodecs via Mediabunny, supports only a subset of CSS, and is not needed for local rendering. — [Remotion Lottie](https://www.remotion.dev/docs/lottie/lottie); [Remotion Rive](https://www.remotion.dev/docs/rive/remotionrivecanvas); [Remotion web renderer](https://www.remotion.dev/docs/web-renderer)
- Official Remotion agent skills exist for Claude Code, Codex and Cursor. An August 2026 guide says agents are strongest on templated, high-volume output and weaker on pacing and music sync. — [Remotion docs: AI skills](https://www.remotion.dev/docs/ai/skills); [Motionbox, 2026-08-02](https://motionbox.io/blog/remotion-for-coding-agents)
- Round 1 already documented VideoToolbox hardware encoding, whisper.cpp captions and `createTikTokStyleCaptions()`. — [Remotion hardware acceleration](https://remotion.dev/docs/hardware-acceleration)

**Motion Canvas and Revideo**
- Motion Canvas: last stable release v3.17.2 on 14 Dec 2024. The latest pre-release is v3.18.0-alpha.0 (16 Feb 2025). There is no maintenance statement. — [Motion Canvas releases](https://github.com/motion-canvas/motion-canvas/releases)
- Revideo: the repo now sits under `midrender/revideo` as "the engine behind Midrender". MIT, 1,143 commits, 4.1k stars. Has `<Audio/>` and `<Video/>`, headless `renderVideo()` and parallel rendering. No release or last-commit date was visible. — [Revideo GitHub](https://github.com/redotvideo/revideo)

**Manim Community Edition**
- Active. v0.22.0 on 8 Oct (year not shown; inferred 2026 from sequence), v0.21.0 on 10 Aug, v0.20.0 on 20 Feb. v0.21 brought a 2.2× Cairo speed-up on animation-heavy scenes, parallel partial-movie encoding and optional Typst text without TeX. v0.20 added a `--seed` option for reproducible randomness. v0.19.2 added Python 3.14 support. v0.22 adds a configurable `[video_encoder]`. — [Manim releases](https://github.com/ManimCommunity/manim/releases)
- Count-ups via a custom `Animation` that sets a `DecimalNumber` value per alpha, and `ValueTracker` updaters for chart elements. For a portrait 1080×1920 video, set `pixel_width`/`pixel_height`; `frame_width` then computes to 4.5 units instead of 14.22. — [Manim docs via Context7: building_blocks.rst, _config/utils.py](https://github.com/manimcommunity/manim/blob/main/docs/source/tutorials/building_blocks.rst)

**GSAP plus headless capture**
- GSAP has been 100% free, including the former Club plugins (SplitText, MorphSVG and others), for commercial use since Webflow's change (licence effective 30 April 2025). The licence has a "Prohibited Use" clause aimed at tools competing with Webflow's animation builder. — [Webflow: GSAP becomes free](https://webflow.com/blog/gsap-becomes-free); [GSAP standard licence](https://gsap.com/community/standard-license/)
- HyperFrames is in effect a maintained "GSAP + deterministic headless frame capture" implementation (see above).

**Lottie and Rive**
- Lottie JSON can be generated programmatically. Python `lottie` (python-lottie) is listed as **AGPLv3+**. The `glaxnimate` Python bindings are **GPLv3+** and can build animations from code and render Lottie to GIF. — [depscope: lottie](https://depscope.dev/pkg/pypi/lottie); [PyPI glaxnimate](https://pypi.org/project/glaxnimate/0.5.0.3/)
- `puppeteer-lottie` renders Lottie JSON to MP4 (needs FFmpeg) via headless Chrome. No maintained Python Skottie-to-video exporter was found (the diffusionstudio Skottie project is a player). — [puppeteer-lottie](https://github.com/TheJizel/puppeteer-lottie/blob/master/readme.md)
- Rive: runtimes are open source, but exporting `.riv` files and video/image exports require a **paid plan**, and video export runs on Rive's Cloud Renderer. Rive's React runtime cannot render to bitmap and points to Remotion/Revideo for offline rendering. — [Rive: exporting for runtime](https://rive.app/docs/editor/exporting/exporting-for-runtime); [Rive: rendering to a bitmap](https://rive.app/docs/runtimes/react/rendering-to-a-bitmap.md)

**Declarative or timeline editors**
- editly: MIT, about 5.5k stars, "maintained by me alone". JSON5 declarative spec, gl-transitions, Ken Burns, multiple audio tracks with ducking and normalisation, custom canvas/fabric/GLSL layers, and a `--fast` preview mode. Depends on headless-gl, which has known build issues. — [mifi/editly](https://github.com/mifi/editly)
- MLT (melt, the engine behind Kdenlive/Shotcut): LGPL-2.1, 6,801 commits, 1.9k stars. The README does not cover macOS or XML usage. — [mltframework/mlt](https://github.com/mltframework/mlt)
- Friction (enve fork): a GPL-3.0 GUI motion-graphics app with about 1.8k stars, a macOS build guide and **no documented CLI rendering or scripting**. — [friction2d/friction](https://github.com/friction2d/friction)
- Natron: the README says the project is "looking for developers and maintainers". — [Natron README mirror](https://cdn.jsdelivr.net/gh/natrongithub/natron@RB-2.6/README.md)
- Theatre.js: the last public push reported is 14 Aug 2024, and development was reportedly moved to a private repo. — [gittrend: theatre-js/theatre](https://gittrend.io/repo/theatre-js/theatre)

**Blender**
- Blender 5.0 shipped on 18 Nov 2025. EEVEE material compilation got up to 4× faster depending on backend (the speed-up is reported for NVIDIA/Vulkan). Grease Pencil gained motion blur. — [It's FOSS: Blender 5.0](https://itsfoss.com/news/blender-5-0-release.md); [Blender 5.0 EEVEE release notes](https://developer.blender.org/docs/release_notes/5.0/eevee/); [CGWORLD](https://cgworld.jp/flashnews/01-202511-Blender50.html)
- Metal-backend data is older and for other chips. Example: the Amy scene on M1 Max took 14 s on OpenGL vs 10 s on Metal (cached). No EEVEE render time for the M3 Max was found. — [Blender Metal viewport](https://code.blender.org/?p=10640)

**New agent-oriented tools**
- **video-use** (browser-use): MIT, about 28.8k stars. Coding agents edit *footage* via transcripts: cutting filler, auto colour grading, 30 ms audio fades and burned subtitles. Animation overlays via HyperFrames, Remotion, Manim or PIL. Requires ffmpeg plus an **ElevenLabs** (cloud) Scribe key for transcription. — [browser-use/video-use](https://github.com/browser-use/video-use)

### Inferences
- **Best pairing with the round-1 HTML/SVG system: HyperFrames first, Remotion second.** HyperFrames can import the *same* CSS token file, fonts and SVG chart markup as the Playwright still templates, with no React port. Animation becomes a GSAP timeline added on top of existing markup. That is the lowest-friction way to share components between stills and motion, and it removes the headcount-based licence question. Remotion shares tokens just as well *if* the templates are JSX components. It also has a deeper ecosystem (Three.js, captions, transitions, Lottie, Rive and Player) and five-plus years of production use.
- Main risks with HyperFrames: it is about 6 months old and changing fast. There is no Apple Silicon or speed documentation, and the documented output is MP4 only (no confirmed alpha/ProRes). A one-day bake-off rendering the same 12 s Reel in both engines is the cheapest way to settle the choice.
- **Remotion licence cost changed materially** if MSP ever exceeds 3 people (counting contractors once 5.0 ships). The cost then becomes ≥$100/month, not $25/month. That makes an Apache-2.0 engine more attractive as the default.
- **Determinism ranking** (inference from the architectures): Blender (seeded, md5-identical re-renders were seen in the round-1 badge lab), Manim with `--seed`, then frame-seeking Chromium engines (HyperFrames, Remotion), then real-time screen recording (not deterministic; avoid).
- **LLM-authorability ranking** (inference): plain HTML/CSS + GSAP (HyperFrames) ≈ React (Remotion) > Manim Python > Blender bpy (verbose, but Claude can write it; round 1 shows it worked for badges) > Lottie JSON (verbose keyframe schema, no advantage over SVG + GSAP) > GUI-only tools (Friction, Natron, Rive editor), which are unusable by an agent.
- **Quality ceiling** (inference): Blender (3D, lighting, physically plausible puzzle pieces) > Chromium engines (anything CSS, SVG, WebGL or Three.js can draw, which covers all 2D data motion) > Manim (precise vector maths, but a "3Blue1Brown" house look that is harder to bend to MSP branding) > ffmpeg filtergraphs (slideshows, Ken Burns, overlays).
- **Manim's niche at MSP is small.** HTML/SVG + D3 or Observable Plot inside HyperFrames or Remotion already covers histogram builds and count-ups, with brand fonts and tokens shared with the stills. Reach for Manim only for an explicitly mathematical explainer, such as a distribution curve morph.
- **Lottie and Rive:** use only to drop in *pre-made, licensed* micro-animations (icons, confetti) inside HyperFrames or Remotion, both of which support Lottie. Do not make generated Lottie JSON a primary authoring format. Rive needs a paid editor for exports, so skip it.
- **editly** suits the "photo collage → Reel slideshow" job (JSON5 spec, Ken Burns, transitions, audio ducking). Plain ffmpeg or the main engine can do the same, so it is optional. MLT, Natron, Friction and Theatre.js are not worth adopting.
- **video-use** matters only if MSP ever edits real footage (competition clips, talking head). Its ElevenLabs dependency adds a paid cloud call; whisper.cpp is the local alternative already documented for Remotion.

### Gaps
- No published render benchmarks on Apple Silicon for HyperFrames, Remotion, Revideo or Manim, and no EEVEE timing for the M3 Max. All render times below are estimates.
- HyperFrames' latest version number and date, alpha/ProRes output, and any macOS-specific problems (Chrome headless GPU on Metal) were not verified.
- Revideo's and editly's last-commit dates were not visible. Theatre.js status after 2024 is unknown.
- timecut/timesnap (older Puppeteer frame-capture tools) could not be checked before the search budget ran out. HyperFrames appears to make them unnecessary.
- No maintained Skottie- or rlottie-based Python exporter was confirmed.
- The exact "Prohibited Use" text of the GSAP licence was not read. It appears aimed only at Webflow competitors.

## 2. Data-video patterns that work on Reels and Stories: evidence, lengths, hooks, loops, captions and covers

### Takeaway
Hard evidence on *data* Reels specifically is thin. The best signals are platform-level. Instagram ranks on watch time (both percentage and seconds), likes per reach and sends per reach. Average watch time per Reel was only **8.5 s** in early 2026. Newsroom data shorts average about 84 s and nearly always animate their charts. In practice: put the payoff inside the first ~3–8 s, keep MSP data Reels to **7–20 s**, make them loop, burn in all text for sound-off viewing, and choose "identity, rivalry, guess-then-reveal" framings that people *send*. Bar-chart-race and quiz claims come mostly from vendors and are untested.

### Cited Findings
- In January 2025 Mosseri named watch time, likes per reach and sends per reach as the top signals. Sends count somewhat more for non-follower reach. Watch time is measured as both percentage and absolute seconds: "We don't want to penalize longer videos…". Third-party claims of a 3–5× send weighting are *not confirmed* by Meta. — [Kompozy summary of Mosseri](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance); [Dataslayer (cites instagram.com/p/DFFyRp-pINJ)](https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers)
- Metricool's 2026 study (24.36M posts, 375k accounts, Jan–Feb 2025 vs 2026) found Reels were the only format with a rising engagement rate (+24.76% YoY). Average watch time per Reel rose to **8.5 s** (from 4 s), and shares grew 67%. Reels averaged 1,035 interactions vs 238 for single images. — [NetInfluencer on Metricool study](https://www.netinfluencer.com/instagram-views-up-27-percent-in-early-2026-as-publishing-increases-report-finds/); [t3n](https://t3n.de/news/instagram-formate-beste-performance-metricool-studie-1751388/)
- Instagram's 2026 creator guide (reported 28 Sep 2026) gives three length bands: 3–15 s for "quick visual transitions, fast-paced trends"; 15–60 s as the "primary sweet spot" for tutorials; 60 s–3 min for "detailed storytelling". It recommends timed on-screen text and the auto-caption sticker, and mentions the Edits app for keyframe animation. — [iPhone in Canada, 2026-09-28](https://www.iphoneincanada.ca/2026/09/28/instagram-shares-ultimate-blueprint-for-viral-reels-in-2026/)
- An Online Journalism Blog study of 50 UK newsroom TikTok data shorts (BBC, ITV, Guardian, Times, FT; 10 Aug 2026) found an average runtime just under **84 s**, with the BBC at about 58 s and the FT at 105 s. 33 of 50 used data visualisations, and **29 of 33 were animated**. Line charts (15) and bar charts (11) dominated, with choropleths in 4. Its advice: "keep your data shorts under 90 seconds", "show, don't tell", "animate your graphs". All 50 had a presenter or voice-over. **No view data** was reported. — [OJB, James Hickman, 2026-08-10](https://onlinejournalismblog.com/2026/08/10/how-data-journalism-is-done-on-tiktok-six-key-takeaways-from-watching-50-videos/)
- NPR Training: Reels shown in the feed get top and bottom cropped, so keep key visuals and text centred. — [NPR Training, 2025-05-28](https://www.npr.org/sections/npr-training/2025/05/28/g-s1-64540/a-beginners-guide-to-hooking-audiences-with-instagram-reels)
- A small-newsroom test of a screen-recorded chart Reel with a click SFX got modest engagement (10 likes), mostly from non-followers. — [RJI Online](https://rjionline.org/news/quick-experiments-to-find-what-resonates-with-your-audience/)
- Bar-chart races: vendor blogs argue that each reorder creates an "open loop" and that rivalries and familiar categories (countries, athletes) drive shares. They also claim horizontal exports get half the reach on Reels. **None of this is sourced or measured.** — [Data Reel Maker blog](https://data-reel-maker.lovable.app/blog/why-bar-chart-races-go-viral)
- Hook timing (first 1–3 s) comes from third-party guides; Instagram publishes no drop-off cutoff. Creator guides consistently say a large share of Reels are watched with sound off and recommend burned-in text. — [Kompozy](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance); [Castmagic](https://www.castmagic.io/blog/how-long-can-an-instagram-reel-be)
- Trial Reels go to non-followers first. Engagement shows after about 24 h, and the Reel can auto-share to followers if it performs within 72 h. Scheduling arrived in 2026. — [Kompozy](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance); [Dataslayer](https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers)
- Unverified secondary claims to treat with caution: a December 2025 Mosseri memo saying "the polished, perfect aesthetic is dead"; Reels up to 20 min; watermark filtering; a "two-way conversation" signal in March 2026. Dataslayer cites no primary source for these. — [Dataslayer](https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers)

### Inferences
- **The 8.5 s average watch time is the design constraint.** A 30 s data Reel whose reveal comes at 20 s will be lost on most viewers. For MSP, the number or punchline should be visible by ~3 s (as a question or teaser) and resolved by ~8 s. Anything after that is bonus detail, and the end should cut back to the opening frame for a seamless loop, since replays add watch seconds.
- **Lengths by format** (inference from the bands above plus the watch-time data): quiz and reveal 7–12 s; count-up or milestone 6–10 s; histogram build 10–15 s; map light-up 12–18 s; bar-chart race 15–30 s (the exception, because its suspense *is* the content); photo recap slideshow 15–30 s; Story frames 5–7 s each, 3–6 frames.
- **Sendability beats likes for reach to new people.** The strongest MSP framings are identity ("where do *you* fall on the 500-piece curve?"), rivalry (country vs country, first vs fifth attempt) and in-jokes ("the 59-minute wall"). These are the formats people DM to puzzle friends.
- **Sound-off first:** every Reel must make sense muted, with all numbers, labels and the question as burned-in text inside the safe zone. Audio (SFX ticks, whooshes, a light music bed) adds energy but never carries meaning. A voice-over is optional and would need whisper.cpp captions.
- **Covers:** render a dedicated `cover_url` JPEG from the static pipeline rather than relying on `thumb_offset`. The cover should be the *question* or the headline number, with text inside the central 1080×1440 (3:4 grid crop), not the first animation frame.
- **Animated vs static charts:** the newsroom pattern (29 of 33 animated) supports animating even simple bar and line charts. Line and bar charts are the most common forms; choropleths are rarer but suit MSP's 84-country story.
- **Use Trial Reels as the A/B harness:** publish 2 hook variants of the same data Reel as trials (`SS_PERFORMANCE`) and keep the learnings in the insights loop.

### Gaps
- I found no controlled study of data-video *formats* (bar race vs histogram vs quiz) on Instagram, and no first-party Instagram number for sound-off viewing share.
- I found no evidence specific to jigsaw or speed-puzzling Reels (timelapse performance, puzzle "satisfying" loops); the search budget ran out before this could be checked.
- I could not find Instagram's 2026 creator guide primary page (about.instagram.com) or Mosseri's original posts, so they are cited via secondary reporting.

## 3. Collages and photo-based posts: layout, smart cropping, background removal, upscaling, LUT grading and on-brand photos

### Takeaway
Treat collages as **HTML/CSS templates in the same Playwright pipeline**. Combine a justified-row or grid layout (Flickr's MIT `justified-layout` algorithm, or CSS grid with `object-position`) with focal points from smartcrop (MIT) or MediaPipe face detection, so no face is ever cropped. Cut-outs come from macOS's built-in Vision subject-lift API (free, on-device) or BiRefNet (MIT); avoid RMBG-2.0, which is non-commercial. Apply one brand LUT through ffmpeg `lut3d` or a CSS filter for consistency. Use Real-ESRGAN (BSD-3) only for modest upscales of small phone photos. Never use generative "face enhancement" on members' faces.

### Cited Findings
- Flickr's `justified-layout` (MIT, JS) takes an array of aspect ratios and returns box geometry. It has no rendering component. The algorithm fills rows until the row aspect ratio passes a target, keeps or drops the last photo, then seals the row. A Rust/WASM port (`@immich/justified-layout-wasm`) is AGPL-3.0. — [justified-layout README](https://cdn.jsdelivr.net/npm/justified-layout@4.1.0/README.md); [Flickr code blog](https://code.flickr.net/?p=3370); [jsDelivr: @immich/justified-layout-wasm](https://www.jsdelivr.com/package/npm/%40immich/justified-layout-wasm)
- smartcrop.js (MIT): Laplace edge detection, skin-tone and saturation maps, and "boost" regions for detected faces, ranked by a sliding window with a centre-weighted importance function. Ports include smartcrop.py (Python), smartcrop-sharp (libvips) and smartcrop-cli. — [jwagner/smartcrop.js](https://github.com/jwagner/smartcrop.js)
- MediaPipe Face Detector: bounding boxes plus 6 keypoints. Python is supported. Models are BlazeFace short-range (selfies) and full-range variants (back-camera photos, a better fit for competition crowd shots). Code samples are Apache 2.0; model licences are given on model cards. Image and interactive segmentation tasks also exist. — [MediaPipe Face Detector](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector)
- Apple Vision `VNGenerateForegroundInstanceMaskRequest` (macOS 14+) produces subject instance masks on-device. `bgbgone` (MIT) wraps it as a CLI (`bgbgone photo.jpg > out.png`, with feather, crop, padding, shadow and mask-only options) but requires macOS 26 and Apple Silicon. — [Apple developer docs](https://developer.apple.com/tutorials/data/documentation/vision/vngenerateforegroundinstancemaskrequest.md); [bgbgone](https://bgbgone.franzai.com/); [Create with Swift tutorial](https://createwithswift.com/removing-image-background-using-the-vision-framework)
- BiRefNet: MIT. Variants include general, `BiRefNet_HR` (2048²), `BiRefNet_dynamic` (256–2304 px), `lite-2K` and matting models. About 5.5 GB memory at 1024² (4.8 GB FP32 / 3.5 GB FP16). Hardware notes cover only NVIDIA. Latest dated news is September 2025. **RMBG-2.0 (BRIA) is built on BiRefNet but its weights are non-commercial.** — [ZhengPeng7/BiRefNet](https://github.com/ZhengPeng7/BiRefNet)
- An April 2026 practitioner moved from rembg (u2net) to BiRefNet for quality. rembg's default u2net is fast (~0.4 s) but cut off a hand in one test; the gap depends mainly on which model rembg loads. — [ice-ice-bear blog (KR), 2026-04-15](https://ice-ice-bear.github.io/ko/posts/2026-04-15-birefnet/); [aireiter (ES)](https://aireiter.com/es/blog/best-background-removal-api)
- Real-ESRGAN: BSD-3-Clause. A portable macOS `realesrgan-ncnn-vulkan` build (dated 2022-04-24) needs no CUDA or PyTorch. Models include x4plus, x2plus and general-x4v3. A `--face_enhance` option uses GFPGAN. — [xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)
- SeedVR/SeedVR2 (ByteDance): repo says "licensed under the Apache 2.0" (weights not separately stated); 3B and 7B. It targets *video* restoration and needs H100-class GPUs for 720p+. A community ComfyUI node lists MPS support and Apple Silicon memory fixes. A third-party distilled `SeedVR2-1.4B` (Apache-2.0) was benchmarked on an M2 Ultra via MLX (July 2026). — [ByteDance-Seed/SeedVR](https://github.com/ByteDance-Seed/SeedVR); [numz/ComfyUI-SeedVR2_VideoUpscaler](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler); [ComfyUI Wiki, 2026-07-29](https://comfyui-wiki.com/en/news/2026-07-29-seedvr2-1-4b-distilled-upscaler)
- ffmpeg `lut3d` applies 3D LUTs in `.3dl`, `.cube`, `.dat`, `.m3d` and `.csp` formats, with `nearest`, `trilinear`, `tetrahedral`, `pyramid` and `prism` interpolation. — [FFmpeg docs (via Context7)](https://ffmpeg.org/ffmpeg-all.html)

### Inferences
- **Recommended collage pipeline** (inference):
  1. Ingest photos, strip EXIF/GPS (public repo and privacy), and record consent or credit in the draft folder.
  2. Run focal-point detection: MediaPipe full-range faces, then smartcrop as fallback. Store the focal point and an "all faces" bounding box per photo.
  3. Choose a layout. Options: `justified-layout` rows (honours aspect ratios, so it looks good with mixed portrait and landscape shots); fixed brand grids (hero + 4, 2×3, mosaic) in CSS grid; or a carousel where slide 1 is the collage and slides 2–N show single photos with result overlays.
  4. Render in Playwright using `object-fit: cover` with `object-position` set from the focal point. Validate that no face box is clipped and that text overlays avoid faces.
  5. Apply one brand grade, either a `.cube` LUT through ffmpeg `lut3d` before layout or a light CSS filter, so mixed phone cameras look consistent.
- **Cut-outs** for "podium" or "winner" graphics: Apple Vision first (zero install on macOS 14+, on-device, free), then BiRefNet_HR for hair and edge quality. Run BiRefNet on MPS or CPU, which is slower. Avoid RMBG-2.0 because of its non-commercial weights.
- **Upscaling:** use Real-ESRGAN x2 only to bring small images up to 1080 px. Do not use `--face_enhance` (GFPGAN) or SeedVR2 on identifiable members. Generative restoration can alter faces, which is a consent and trust problem in a community that is openly hostile to AI art (round 1). SeedVR2 is overkill for stills on this Mac.
- **Cheap motion variant:** the same collage becomes a 15–25 s Reel by animating the layout (photos pop in, Ken Burns toward each focal point, result chips slide in), either in HyperFrames/Remotion or with editly/ffmpeg `zoompan`.
- **Keeping photos on-brand** comes mostly from frames, type and colour chips around the photos, plus one gentle LUT. Heavy grading of other people's photos risks looking "filtered".

### Gaps
- rembg's licence, smartcrop.py's maintenance and Pillow LUT support (ImageFilter.Color3DLUT) were not verified before the search budget ran out.
- No quantitative BiRefNet vs Apple Vision comparison was found. Apple Vision quality on group shots is unverified.
- MediaPipe model licences (model cards) were not read.
- The licence of the official SeedVR2 *weights* is not stated separately from the repo.

## 4. Audio: safe sources, local music generation (licences and Apple Silicon feasibility), loudness targets and beat detection

### Takeaway
For MSP's Instagram-Login Reels, the safest audio is **SFX plus simple music beds**. SFX come from Freesound **CC0** and the **Sonniss GDC bundles** (royalty-free, no attribution, unlimited projects, but no AI training). Music comes from round-1 sources or is made locally. For local generation, **ACE-Step 1.5** (MIT code, native macOS MLX/MPS path, up to 10-minute songs, XL released April 2026) is the most practical. **Stable Audio Open** has the cleanest training-data provenance (CC-licensed Freesound and FMA) and is free under $1M revenue, but is better at loops and SFX than songs. **HeartMuLa** (Apache-2.0) is CUDA-oriented, and **YuE2** and **MusicGen** weights are non-commercial. Master to about **−14 LUFS integrated, −1 dBTP** with two-pass ffmpeg `loudnorm`; its defaults are −24/−2, so set them explicitly. Use **beat_this** (MIT) for beat grids.

### Cited Findings

**SFX and libraries**
- Freesound licences: CC0 ("you can do pretty much what you want with the sound"); CC BY (always credit the creators); CC BY-NC (no earning money); Sampling+ (retired, roughly BY-NC). Credit should name the sound, author, link and licence. A "Free Cultural Works" filter returns CC0 + CC BY only. — [Freesound FAQ](https://freesound.org/help/faq/)
- Sonniss GDC bundles: no attribution, unlimited projects for life. The GDC 2026 bundle is 7.47 GB+. The 2024 coverage says the licence forbids training AI models with the sounds. — [Rekkerd: Sonniss GDC 2026](https://rekkerd.org/sonniss-releases-gdc-2026-game-audio-bundle/); [GameFromScratch: GDC 2024](https://gamefromscratch.com/sonniss-27-5gb-sound-effect-giveaway-at-gdc-2024/)

**Local music generation**
- **ACE-Step 1.5**: code is MIT (no separate weights licence stated in the README). Variants: 2B DiT (base/SFT/turbo; turbo uses 8 steps) and an XL 4B DiT released 2026-04-02 (about 9 GB bf16), plus 0.6B/1.7B/4B LMs. Songs run 10 s to 10 min. LoRA can be trained from "just a few songs". The README claims quality "between Suno v4.5 and Suno v5" (self-reported, no benchmark). It supports MPS, has a macOS MLX launch script and a macOS portable package. Speed is under 2 s per song on an A100 and under 10 s on an RTX 3090. **There is no training-data statement.** The disclaimer asks users to verify originality and disclose AI use. — [ace-step/ACE-Step-1.5](https://github.com/ace-step/ACE-Step-1.5)
- ACE-Step on Apple Silicon (user report): two 100 s vocal songs in about 58 s on an M1 Max, with the LM on MLX and the DiT on PyTorch MPS. An MLX 8-bit XL-Turbo build claims about 4 s for a 30 s song on an M-series Mac (uploader's claim). — [DEV Community](https://dev.to/bigkijimon/100-free-fully-local-ai-music-generation-on-an-m1-mac-ace-step-15-two-100-second-vocal-songs-3h1b); [HF: ACE-Step-1.5-XL-Turbo-MLX-8bit](https://huggingface.co/ddalcu/ACE-Step-1.5-XL-Turbo-MLX-Serve-8bit)
- **Stable Audio Open 1.0**: about 1B parameters, up to 47 s of 44.1 kHz stereo. Trained on about 486k recordings (472,618 from Freesound and 13,874 from FMA), all CC0, CC BY or CC Sampling+. It cannot do realistic vocals and is "better at sound effects and field recordings than music". — [HF model card](https://huggingface.co/stabilityai/stable-audio-open-1.0)
- Stability AI Community License: free (commercial included) for organisations with **<$1M annual revenue** "regardless of the source of that revenue". "You own outputs". Enterprise licence above $1M. — [stability.ai/license](https://stability.ai/license)
- **Stable Audio Open Small** (May 2025): 341M parameters, up to 11 s of audio in under 8 s on an Arm phone CPU, same Community License, English prompts only, no realistic vocals or high-quality songs. — [TechCrunch](https://techcrunch.com/?p=3007115); [The Decoder](https://the-decoder.com/stability-ai-releases-a-compact-open-text-to-audio-model-that-runs-on-mobile-devices/)
- **HeartMuLa**: the licence for code and *all related weights* changed to **Apache 2.0** on 20 Jan 2026. The 3B open model was released 14 Jan 2026, followed by RL and "happy-new-year" updates. An internal 7B is claimed "comparable with Suno". Max length defaults to 4 min, and RTF is about 1.0. All examples use CUDA, with no MPS or MLX mention. — [HeartMuLa/heartlib](https://github.com/HeartMuLa/heartlib)
- **YuE2** (late September 2026): code is Apache 2.0. **Weights are "CC BY-NC 4.0 with additional creator permission"**: individual creators may monetise outputs, but **companies must contact the authors for a commercial licence**. Requires Linux, an NVIDIA BF16 GPU and **24 GB VRAM**. Instrumental mode is available via an agent skill (25 Sep 2026). — [multimodal-art-projection/YuE](https://github.com/multimodal-art-projection/YuE)
- **MusicGen (AudioCraft)**: code is MIT, **weights are CC-BY-NC 4.0** (non-commercial), per mirrors of the README. — [HF Space README mirror](https://huggingface.co/spaces/jonluca/MusicGen/blob/5591dfc298e59c661fe2762718c83642461d6100/README.md?code=true); [discussion](https://huggingface.co/spaces/facebook/MusicGen/discussions/8)
- Other 2026 open models, from secondary sources only: DiffRhythm (reportedly Apache 2.0, songs up to about 4 min); MiniMax Music 3 (open-weight, commercial with attribution, separate agreement above $20M revenue). — [songcreator.pro comparison](https://songcreator.pro/blog/best-open-source-ai-music-models); [MindStudio on MiniMax Music 3](https://www.mindstudio.ai/blog/minimax-music-3-open-weight)

**Loudness and beat detection**
- Instagram publishes **no official loudness spec**. Most sources cite about −14 LUFS integrated with a −1 to −1.5 dBTP ceiling; one vendor says −10 to −12 LUFS (outlier). Louder uploads get turned down. — [OpenClip: LUFS targets](https://openclip.app/learn/audio-normalization); [Opus: loudness normalizers](https://opus.pro/blog/best-loudness-normalizers)
- ffmpeg `loudnorm` implements EBU R128 with I (−70 to −5, **default −24**), LRA (default 7), TP (−9 to 0, **default −2**), `measured_*` inputs for a second pass, `linear` (default true) and `print_format=json`. Dynamic mode upsamples to 192 kHz for true-peak detection. — [FFmpeg docs (via Context7)](https://ffmpeg.org/ffmpeg-all.html)
- **beat_this** (CPJKU, ISMIR 2024 "Accurate Beat Tracking Without DBN Postprocessing"): code and weights are **MIT**. Does beat and downbeat tracking. CLI: `pip install beat-this`, then `beat_this file -o out.beats`. Optional madmom DBN. CPU fallback, with no MPS mention. — [CPJKU/beat_this](https://github.com/CPJKU/beat_this)
- A secondary source says madmom's DBN is patented and licensed for non-commercial use only (not verified at the primary source). — [PyPI livechord-beat-refiner](https://pypi.org/project/livechord-beat-refiner/)
- Instagram audio specs for API uploads: AAC, ≤48 kHz, mono or stereo, 128 kbps (see section 5). — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)

### Inferences
- **Recommended audio order for MSP Reels:**
  1. SFX-only sound design (ticks on count-ups, whooshes on transitions, a "click" when the puzzle piece lands) from Freesound CC0 and Sonniss. This is the lowest risk and fits data Reels.
  2. Short royalty-free beds from round-1 sources (Pixabay or Mixkit without Content-ID marks).
  3. Locally generated beds: Stable Audio Open for 10–45 s instrumental loops (clean training data, licence fits MSP's <$1M revenue), or ACE-Step 1.5 for full-structure instrumentals. ACE-Step's training data is undisclosed; it is legally usable under MIT, but provenance is opaque.
  4. Hand-added trending audio in the app for occasional Reels.
- **AI-music caution:** the jigsaw community's hostility to AI art (round 1) may extend to AI music. If generated music is used, set `is_ai_generated` per the round-1 policy and keep it in the background. Do not use MusicGen or YuE2 weights (non-commercial for companies), and do not use Sonniss sounds as AI training data.
- **Mastering recipe** (inference from the docs): two-pass `loudnorm=I=-14:TP=-1:LRA=11:print_format=json`, then a second pass with the `measured_*` values and `linear=true`. Encode AAC 128 kbps at 48 kHz stereo. Duck music by about 8–12 dB under SFX hits (editly has ducking; otherwise use ffmpeg `sidechaincompress` or volume automation).
- **Beat-synced cuts:** run beat_this on the chosen track to get beats and downbeats. Map the data animation's key moments (bar reorders, reveal frame) to the nearest downbeat at 30 fps (frame = round(t × 30)). Pass the beat list as JSON into the HyperFrames or Remotion composition so timing stays deterministic.
- **Mac feasibility ranking:** Stable Audio Open (small, MPS or CPU plausible) ≈ ACE-Step 1.5 (official macOS path), then HeartMuLa (CUDA-first, unverified on Mac), then YuE2 (24 GB NVIDIA, not feasible).

### Gaps
- ACE-Step 1.5 *weights* licence and training-data provenance were not stated in the README; the Hugging Face model card was not read.
- Stable Audio Open on MPS speed was not measured. Stable Audio Open Small's official licence text was not read (reported as the same Community License).
- I found no first-party Instagram loudness target and no evidence on whether AI-generated music triggers Instagram muting or Content ID.
- The licence status of librosa and aubio was not verified before the search budget ran out. For pure onset or tempo use, librosa is commonly used; beat_this is the verified MIT option.
- The full Sonniss licence text was not read; terms come from 2024 and 2026 news coverage.

## 5. Instagram video specs for Reels and Stories in 2026, cover handling, safe zones and Trial Reels

### Takeaway
The API spec is unchanged from round 1 and was re-verified from Meta's IG User Media reference. Both Reels and Stories take MP4/MOV with the moov atom at the front, H.264 or HEVC, closed GOP, 4:2:0, 23–60 fps, ≤1920 px wide, VBR ≤25 Mbps, and AAC 48 kHz 128 kbps. **Reels run 3 s–15 min, ≤300 MB; Stories run 3–60 s, ≤100 MB.** `cover_url` (JPEG ≤8 MB, sRGB) overrides `thumb_offset`. Trial Reels can be published with `trial_params` (MANUAL or SS_PERFORMANCE), but graduating a trial is not exposed in the API. Alt text and collaborators are unavailable for Stories, and alt text is unavailable for video.

### Cited Findings
- Reels and Stories share the container, codec, fps, width and bitrate limits above. Aspect ratio: Reels 0.01:1–10:1 and Stories 0.1:1–10:1, with 9:16 recommended for both. Durations: Reels 3 s–15 min (300 MB), Stories 3–60 s (100 MB). — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- `cover_url` is a public JPEG, ≤8 MB, sRGB, 9:16 recommended, and wins over `thumb_offset`. `thumb_offset` is in ms, default 0, and must be less than the duration (error subcode 2207057). `share_to_feed` allows both Feed and Reels tabs, but placement is not guaranteed. `audio_name` can be renamed only once. — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media); [AdaptlyPost](https://adaptlypost.com/blog/instagram-reels-api-max-length-file-size)
- `trial_params` requires `media_type=REELS` and `graduation_strategy` set to `MANUAL` or `SS_PERFORMANCE`. — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Graduating a MANUAL trial Reel to followers is **not exposed by Meta's API** and must be done in the app. Trial Reels reject carousels and Stories. — [Ayrshare Instagram docs](https://www.ayrshare.com/docs/apis/post/social-networks/instagram.md)
- `collaborators` (≤3) is supported for feed images, Reels and carousels, **not Stories**. `alt_text` is for images only, **not Reels or Stories**. — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Third-party claims of a 90 s API cap for Reels conflict with Meta's own 15-minute figure; the 90 s and 3-minute figures look outdated. — [AdaptlyPost](https://adaptlypost.com/blog/instagram-reels-api-max-length-file-size); [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Story safe zones are community-derived, not official from Meta. Keep the top ~250 px clear, and the bottom 250–340 px (reply bar). The safe content block is about 1080×1330–1420. — [Inro](https://www.inro.social/blog/instagram-story-size); [socialsizes.io](https://socialsizes.io/instagram-stories-size/)
- Round 1 established the Reel safe zone (central ~950×980, clear of the top 14%, bottom 35% and right rail) and the 3:4 grid crop that loses 240 px top and bottom. — [Hopper HQ (round-1 source)](https://www.hopperhq.com/blog/instagram-reel-size/)

### Inferences
- **Render target:** 1080×1920, 30 fps (60 fps only for very fast motion; it doubles render time), H.264 High profile, closed GOP (for example `-g 60 -keyint_min 60 -sc_threshold 0` or the VideoToolbox equivalent), yuv420p, `-movflags +faststart`, VBR about 8–12 Mbps (well under the 25 Mbps cap), AAC 128 kbps at 48 kHz stereo. These are reasonable values within Meta's limits; they were not tested against Instagram's re-encoding.
- **Story video** via the API must be ≤60 s. Interactive stickers still require posting by hand (round 1). Exporting 5–15 s Story MP4s with a "sticker zone" left empty fits that workflow.
- Add **lint checks** to the render pipeline, run with ffprobe after each render: duration ≥3 s, fps 23–60, moov atom at front, size limits per type, audio stream present (even if near-silent) for Reels, and the cover JPEG ≤8 MB in sRGB.

### Gaps
- Instagram's server-side re-encode quality (1080 vs 1440 width, H.264 vs HEVC) is not documented. Test empirically.
- There is no official Meta safe-zone spec for organic Stories or Reels.
- Requirements to use Trial Reels via the API (a reported 1,000+ follower minimum from a scheduler's docs) were not verified with Meta.

## 6. Effort and render time per format, the recommended motion stack, and 6–10 MSP Reel/Story formats

### Takeaway
Most MSP motion formats are **fully templatable**: build once, then each new post is a JSON payload from the data layer. Expected render times on the M3 Max are seconds to a couple of minutes for 2D HTML-engine Reels, and minutes to tens of minutes for Blender 3D shots. These are estimates; no benchmarks exist. The recommended stack:
- HTML/CSS/SVG design system shared with the stills.
- HyperFrames (Apache-2.0) as the default motion engine, with Remotion as the mature alternative, decided by a one-day bake-off.
- ffmpeg as the finishing layer (VideoToolbox encode, loudnorm, lut3d, slideshows).
- Blender 5.x headless for puzzle-piece shots.
- Audio from SFX (Freesound CC0, Sonniss) plus royalty-free or locally generated beds (Stable Audio Open, ACE-Step 1.5).
- beat_this for sync.
- A collage toolchain of justified-layout, smartcrop/MediaPipe, Apple Vision/BiRefNet and a LUT.

### Cited Findings
- The engine facts (determinism, licences, agent skills) are in section 1. — [HyperFrames](https://github.com/heygen-com/hyperframes); [Remotion pricing](https://www.remotion.pro/license)
- Round 1 noted that Remotion's default concurrency is half the CPU threads, that `npx remotion benchmark` exists, and that VideoToolbox encoding ran about 8.5× faster than software encoding on an M1 Max. — [Remotion performance docs](https://www.remotion.dev/docs/performance); [CodeTV](https://codetv.dev/blog/hardware-acceleration-ffmpeg-apple-silicon)
- Manim v0.21's Cairo renderer is 2.2× faster on animation-heavy scenes, and parallel encoding cut one benchmark by 56% (8–11% on larger renders). — [Manim releases](https://github.com/ManimCommunity/manim/releases)
- ACE-Step: two 100 s songs in about 58 s on an M1 Max (single user report). — [DEV Community](https://dev.to/bigkijimon/100-free-fully-local-ai-music-generation-on-an-m1-mac-ace-step-15-two-100-second-vocal-songs-3h1b)
- MSP data hooks available from round 1: the "59-minute wall" (solo-500 times peak at 58 min with 7,449 results, then drop 7.5% at 60 min); the fastest first-try solo-500 personal best is 22:30, and the 5th attempt is a median 27% faster than the 1st; 275.2M pieces at about 16.5M a month put 300M around late November 2026; 545k results across 84 countries. — [Round-1 report, local: reports/MSP Instagram content pipeline.md](../../reports/MSP%20Instagram%20content%20pipeline.md)
- Data-short practice: animated line and bar charts dominate, with choropleths for geography. — [OJB, 2026-08-10](https://onlinejournalismblog.com/2026/08/10/how-data-journalism-is-done-on-tiktok-six-key-takeaways-from-watching-50-videos/)

### Inferences

**Recommended motion stack (inference, October 2026)**

| Job | Default tool | Alternative | Licence (date checked) | Why |
|---|---|---|---|---|
| 2D data motion (count-ups, histograms, races, maps, quizzes, kinetic type) | **HyperFrames** with GSAP timelines over the same HTML/CSS/SVG components as the stills | **Remotion** (React, `@remotion/three`, captions, transitions) | Apache-2.0 / Remotion free ≤3 people, else ≥$100/month (2026-10-13) | Shares tokens and markup with the Playwright stills; deterministic; official Claude Code skills for both |
| Charts inside motion | D3 or Observable Plot SVG, animated per frame | Manim (maths explainers only) | ISC/BSD-style (D3, not re-verified) / MIT (Manim) | Same chart code as the carousels |
| 3D puzzle pieces (assemble, explode, fly-in) | **Blender 5.x** `--background --python`, EEVEE, PNG or alpha sequences composited in the HTML engine | Three.js inside HyperFrames or Remotion for simple pieces | GPL (tool only; renders are yours) | Correct tab-and-blank geometry; seedable; proven in the badge lab |
| Slideshows, Ken Burns, photo recaps | ffmpeg (`zoompan`, `xfade`, `h264_videotoolbox`) or the main engine | editly (JSON5) | LGPL/GPL builds / MIT | Zero dependencies, fast |
| Finishing | ffmpeg: `loudnorm` 2-pass, `lut3d`, mux, faststart, ffprobe lint | – | – | One deterministic encode step for every engine |
| Captions (only if voice-over) | whisper.cpp → word-timed JSON → burned in by the engine | HyperFrames `/embedded-captions` skill | MIT | Fully local |
| Music beds | Royalty-free library (round 1), or **Stable Audio Open** loops / **ACE-Step 1.5** instrumentals | Hand-added trending audio in the app | Community (<$1M) / MIT code | Instagram Login means audio must be embedded |
| SFX | Freesound CC0, Sonniss GDC bundles | – | CC0 / Sonniss royalty-free (no AI training) | Ticks, whooshes, piece clicks |
| Beat sync | beat_this → beats JSON → frame numbers | librosa onset/tempo | MIT | Deterministic sync |
| Collages | HTML/CSS grid + justified-layout + smartcrop/MediaPipe focal points + Apple Vision/BiRefNet cut-outs + ffmpeg `lut3d` | Real-ESRGAN ×2 for small images | MIT / Apache / BSD-3 | Same renderer as the stills, faces never clipped |
| Not recommended | Motion Canvas (stalled since Dec 2024), Revideo (uncertain maintenance), Theatre.js, Natron, Friction (GUI-only), Rive (paid export), generated Lottie, MusicGen and YuE2 weights (non-commercial), RMBG-2.0 (non-commercial), local AI video generation (round 1) | | | |

**Rough render and effort estimates (inference; benchmark during setup)**
- A 2D HTML-engine Reel at 1080×1920, 30 fps and 10–20 s is 300–600 frames. Each frame is a Chromium screenshot, so with parallel tabs on a high-core M3 Max I would expect **roughly 15 s to 2 min per render**, plus about 5–20 s for a VideoToolbox or x264 encode. Heavy SVG filters, blur or WebGL push this higher.
- A Blender EEVEE shot at 1080×1920 with a simple stylised piece scene takes an estimated **0.3–2 s per frame**, so a 6–8 s shot (180–240 frames) is about **1–8 min**. Cycles hero stills take minutes each.
- Manim at 1080×1920, 30 fps: an estimated 1–5 min for a 15 s scene (Cairo).
- An ffmpeg slideshow of 15–30 s takes seconds.
- ACE-Step 1.5 takes an estimated well under a minute per 30–60 s instrumental bed on an M3 Max (extrapolated from the M1 Max report). Stable Audio Open's speed on Mac is unknown.
- Build effort by Claude Code (estimate): a shared motion "kit" (tokens, safe-zone guides, type styles, enter/exit eases, SFX map, encoder and lint script) takes about 1–2 days. After that, each new format template takes 0.5–1 day. Blender assemble shots take 1–3 days the first time because of piece geometry and look development, then minutes per variant. After templating, each new post is a data query plus a JSON payload plus about 1–3 minutes of renders. The owner's review time dominates.

**Concrete MSP Reel and Story formats (inference; numbers must be re-queried before publishing)**

1. **"Guess the time" quiz Reel**
   - Frames: 0–2 s, a big question card ("Median time for a 500-piece solo?") with 3 options. 2–5 s, a ticking countdown (SFX ticks). 5–9 s, the histogram slams in with the median marker and the answer. 9–11 s, a "Where are you on the curve?" call to action that loops back to the question.
   - 9–12 s total. The cover is the question.
   - HTML engine, fully templatable (any puzzle size, brand or country). Very sendable ("guess before you look").

2. **"The 59-minute wall" histogram build**
   - Bars rise left to right on a beat grid. The camera pushes into the 58-minute spike, and a kinetic-type label "THE WALL" lands with an impact SFX. A 60-minute drop annotation follows: "−7.5% at the hour".
   - 10–15 s. Loop back to the empty axis.
   - The same template generalises to any distribution (by piece count or by country).

3. **Milestone count-up and countdown ("300 million pieces")**
   - Stories: daily countdown frames (5 s each) in the run-up to late November.
   - Reel: an odometer from 0 to 300,000,000 with a piece-click SFX, then the live per-day rate ("+550k pieces a day") and a thank-you.
   - 6–9 s. Re-use for 600k results (early December).
   - HTML engine, optionally with a Blender piece burst at the end.

4. **"From 1 to 84 countries" map light-up**
   - A choropleth or dot map: countries light up in the order of their first logged result, with a running date and counter at the top. It ends on the full map with "84 countries".
   - 12–18 s. The cover is the full lit map plus the number.
   - Needs one TopoJSON world map (check the licence, e.g., Natural Earth, public domain).
   - Sendable to international members ("find your country").

5. **Country (or brand) bar-chart race**
   - Cumulative pieces or results per country by month since launch. Use rivalry framing: top 8, with a running month label and "lead changes" flashes.
   - 15–25 s, the one longer format. Its suspense *is* the content.
   - Template driven by any time-series table. Verify the data supports real lead changes, or the format falls flat.

6. **Puzzle-assembly reveal (signature shot)**
   - Blender: 20–40 stylised MSP pieces fly in and snap together (snap SFX per piece, on beats). The assembled surface becomes the stat card ("545,000 results logged").
   - 6–8 s, seamless loop (it explodes back out).
   - Best reused as an intro or outro sting across formats, and as a Story background.
   - Render once per stat, or render the motion with a blank surface and composite the number in the HTML engine, so no re-render is needed.

7. **Split-screen "1st try vs 5th try" race**
   - Two progress bars or two puzzle grids fill side by side. The left bar is the 1st attempt and the right bar is the 5th attempt (median 27% faster). The faster side finishes first with a "−27%" stamp.
   - 8–10 s. Identity hook: "practice really works".
   - The template also fits solo vs pairs and 500 vs 1000 pieces per minute.

8. **Weekly "This week in speed puzzling" Story pack**
   - 4–6 Story frames (5–7 s each, ≤60 s total): records this week, most-solved puzzle, new countries, a member milestone (only with consent or public data), and a "next week" teaser. A blank sticker zone is left for the owner's manual poll.
   - This revives the dead weekly recap as low-effort Stories. 100% templatable from the data layer.

9. **Competition recap: collage carousel plus 20 s photo Reel**
   - From the owner's competition photos: a justified or grid collage cover, single photos with result chips (place, time) on later slides, and the same assets animated as a Ken Burns Reel with an SFX and music bed and a podium cut-out (Apple Vision or BiRefNet).
   - 15–25 s.
   - Needs consent for identifiable people and no generative face retouching. Semi-templated, because photo selection is manual.

10. **(Optional) Timelapse with data overlay**
    - A member's or the owner's solve timelapse (with permission), sped to 15–20 s, with a live overlay: elapsed time, pieces per minute, and a percentile bar versus all solves of that puzzle.
    - Highest "satisfying" potential, but it depends on footage supply. The HTML engine composites the overlay on the video.

**Rollout suggestion (inference):** start with formats 1, 2 and 8 (pure 2D, no new dependencies, maximum reuse of the carousel charts). Add format 6 once the Blender piece rig exists. Test every Reel as a Trial Reel with two hook variants, then promote the winning formats.

### Gaps
- There are no measured render times for any engine on the M3 Max. Run `npx remotion benchmark`, time a HyperFrames render, and time an EEVEE test frame during setup.
- Whether HyperFrames can output alpha video or image sequences (needed to composite Blender or HTML layers in both directions) is unverified. A fallback is Blender PNG sequences imported as image sequences.
- The per-format performance assumptions (quiz and race sendability, loop benefit) are untested for MSP's audience and need Trial Reel data.
- The map-data licence and the country-level data sufficiency for format 4, and real lead changes for format 5, must be checked against the database.
