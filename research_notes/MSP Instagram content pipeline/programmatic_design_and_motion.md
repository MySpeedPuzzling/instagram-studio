# Programmatic design, data visualization, motion rendering and free assets for Instagram (state as of 2026-10-13)

Scope: a local-only (MacBook Pro M3 Max), Claude-Code-orchestrated pipeline for @myspeedpuzzling that produces 1080x1350 feed images/carousels and 1080x1920 Reels/Stories from data. Numbers and text are always rendered by code, never by an image model. Free tooling preferred. Prices and license terms below were checked on or around 2026-10-13 unless stated otherwise. They can change, so re-check before relying on them.

## 1. Static rendering: which approach is most robust for an LLM-authored template system (HTML/CSS to PNG with Playwright/Puppeteer, Satori/@vercel/og, Takumi, resvg, Pillow/Skia, Typst), and how should images be exported for Instagram?

### Takeaway
Headless Chromium via Playwright, rendering plain HTML/CSS/SVG templates, is the most robust choice for LLM-authored templates. It supports the full CSS an LLM already knows (grid, `calc`, z-index, variable fonts, OpenType numerals, inline SVG charts), it can screenshot straight to JPEG at an exact pixel size, and on a local Mac its speed is not a constraint. Satori and Takumi are faster and browserless, but each implements only a subset of CSS, which an LLM will break silently. Typst is a capable niche option. Instagram's publishing API takes JPEG only, at up to 1440 px wide, in sRGB.

### Cited Findings
**Playwright (headless Chromium/WebKit/Firefox)**
- `page.screenshot()` takes `type: "png" | "jpeg" | "webp"`, `quality` (0–100, for lossy types), `scale: "css" | "device"`, `animations: "disabled" | "allow"`, `omitBackground`, `clip`, and `style` (CSS injected only for the screenshot). — [Playwright types.d.ts](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/types/types.d.ts)
- `scale` defaults to `"device"`, which gives one image pixel per device pixel, so a `deviceScaleFactor: 2` context doubles output size. `"css"` gives one pixel per CSS pixel. — [Playwright params docs](https://github.com/microsoft/playwright/blob/main/docs/src/api/params.md)
- A context's viewport and `deviceScaleFactor` are set with `browser.newContext({ viewport, deviceScaleFactor })`. — [Playwright emulation docs](https://github.com/microsoft/playwright/blob/main/docs/src/emulation.md)

**Satori / @vercel/og (JSX to SVG, no browser)**
- Satori is "not a complete CSS implementation". It has no 3D transforms, no `z-index` (later elements paint on top), and no `calc`. `currentColor` works only for `color`. CSS variables are supported. — [Satori README via Context7](https://github.com/vercel/satori/blob/main/README.md)
- A `<div>` with more than one child must declare `display: flex`, `contents` or `none`, otherwise Satori throws. — [Satori layout docs via Context7](https://github.com/vercel/satori/blob/main/_autodocs/api-reference/layout.md)
- Font data must be passed explicitly as ArrayBuffer or Buffer. Custom emoji go through `graphemeImages` or `loadAdditionalAsset`, for example Twemoji SVGs. — [Satori README](https://github.com/vercel/satori)
- **Conflicting sources on typography and WOFF2.** The Context7 snapshot of the README says "WOFF2 is not supported at the moment". The live README fetched on 2026-10-13 says Satori "supports four font formats: TTF, OTF, WOFF and WOFF2", does HarfBuzz shaping, and supports kerning and ligatures via `font-feature-settings`. It also says `unicodeBidi` is unsupported, `fontVariantEmoji` has no effect, and small caps are not synthesized. Variable fonts are not mentioned. The live README is the newer source. — [Satori README (live)](https://github.com/vercel/satori); contradicted by the [Context7 snapshot](https://github.com/vercel/satori/blob/main/README.md)
- Satori returns SVG. The README recommends Sharp (librsvg) to rasterize it to PNG. — [Satori README](https://github.com/vercel/satori)

**Takumi (Rust, Satori-inspired)**
- Takumi renders JSX, HTML or node trees to images "without a headless browser". It supports Flexbox, Grid and block layout (a bare `<div>` defaults to block, unlike Satori), gradients, and variable fonts via `font-variation-settings`. It outputs PNG, JPEG, WebP and SVG, has a keyframe-animation guide, and offers a `next/og`-compatible `ImageResponse`. It never reads system fonts and ships Geist (Latin only) as its built-in font. Packages: `takumi-js` bundles `@takumi-rs/core` (native) and `@takumi-rs/wasm`. — [Takumi docs](https://takumi.kane.tw/docs)
- Coverage claims conflict. Nuxt SEO's renderer page lists "limited CSS support compared to Satori" and "no gradient backgrounds" as cons, while the official docs show gradients working. The Nuxt page may predate current releases. Claims of 2–10x speed over Satori come from Takumi's own benchmarks and have not been verified independently. — [Nuxt SEO Takumi renderer](https://nuxtseo.com/docs/og-image/renderers/takumi); [Vercel Community post](https://community.vercel.com/t/takumi-rust-based-jsx-to-image-rendering-engine-inspired-by-satori/34499)

**Typst**
- `typst compile` exports PNG with `--ppi` (default 144). Pixel size equals page size times PPI, so a 7.5 in page at 144 PPI gives 1080 px. Multi-page output uses a `{p}` filename template, which suits carousels. The background is opaque white unless `#set page(fill: none)`. A Python binding (`typst-py`) exists. — [Typst PNG reference](https://typst.app/docs/reference/png/); [typst-compile man page](https://man.archlinux.org/man/typst-compile.1.en); [typst-py](https://typst-py.readthedocs.io/en/latest/)

**Instagram export targets**
- Image publishing via the Instagram API: **JPEG only**, at most 8 MB, aspect ratio 4:5 to 1.91:1, width 320–1440 px (larger images are scaled down), and **sRGB** (other color spaces are converted). A carousel holds at most 10 images or videos, and a Reel cannot be a carousel item. — [Instagram Graph API, IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Since January 2025 the profile grid crops thumbnails to 3:4. A 9:16 cover therefore loses 240 px at the top and 240 px at the bottom. — [Hopper HQ, 2026-09-18](https://www.hopperhq.com/blog/instagram-reel-size/)

### Inferences
- **Why Playwright wins for an LLM author.** Claude writes standard HTML/CSS/SVG fluently. The only Playwright-specific knowledge it needs is a few lines of screenshot code. Satori and Takumi each need a mental model of "which CSS is supported here", and their failures are often silent (a layout drifts, a gradient or an absolutely positioned overlay doesn't render). For a template system that grows over time, full CSS fidelity matters more than about 100 ms of speed per image.
- **Recommended Playwright recipe.** Keep one persistent Chromium browser. Use a 1080x1350 viewport, or 1080x1920 for Stories. Wait for `document.fonts.ready` and for any chart SVG to finish rendering. Disable animations, then take a `page.screenshot({ type: 'jpeg', quality: 90–95 })`. Alternatively, render PNG and encode once with mozjpeg or Sharp at quality 90–95 in sRGB, which gives more control over chroma subsampling. Self-host fonts as local `@font-face` files, never from a CDN, so renders are deterministic and offline.
- **Optional supersampling.** Because the API accepts widths up to 1440, rendering 4:5 at `deviceScaleFactor: 4/3` (1440x1800) may survive Instagram's recompression with crisper small text. This has not been verified. A/B test it on a phone.
- **Design for both crops.** 1080x1350 (4:5) cropped to 3:4 for the grid keeps the full height but only about 1012 px of width, losing roughly 34 px per side. Keep carousel cover text inside about 1000 px of central width.
- **Emoji.** Headless Chromium on macOS will draw Apple Color Emoji. Whether Apple's glyphs may be used in commercial graphics was not checked here. The safer path is an open emoji set (Twemoji or Noto Color Emoji) loaded as a web font or as SVG images. Verify their licenses.
- **Pillow/Skia** are best kept as post-processing tools (resize, overlay, contact sheets), not as the layout engine. Hand-computing text layout in Python is exactly where an LLM makes mistakes.
- **Typst** is a good fit if templates should be declarative and typeset-quality (excellent kerning, deterministic multi-page carousels), but Claude knows it less well than HTML and its chart ecosystem is weaker.
- **Satori or Takumi** become worth it only if rendering moves to a server or edge function, or if volume grows to thousands of images.

### Gaps
- No authoritative Meta guidance on the optimal JPEG quality or chroma subsampling to survive Instagram's recompression. Third-party lore (e.g., "upload at 1080 wide, q~90+, sRGB") was not verified.
- No published 2026 benchmark comparing Playwright, Satori and Takumi on Apple Silicon for 1080x1350 renders.
- Whether Satori supports variable-font axes in 2026 is not stated in its README.
- resvg was not researched directly. Satori's README now points to Sharp/librsvg instead.

## 2. Data visualization for social media: which libraries produce beautiful static charts for headless rendering, and which design principles make mobile data stories look premium?

### Takeaway
For a Playwright-based pipeline, render charts as inline SVG inside the HTML template. Observable Plot (concise, good defaults, SSR via JSDOM) or hand-written D3/SVG for bespoke "hero number" graphics are the best fits. ECharts SSR (`renderToSVGString`) and Vega-Lite via `vl-convert` (browserless SVG/PNG) are solid alternatives. The quality comes mostly from editorial design: one idea per slide, a title that states the takeaway, direct labels instead of legends, big numbers, annotations next to the data, two text sizes at most, and WCAG contrast.

### Cited Findings
**Libraries**
- Observable Plot supports Node server-side rendering by passing `document: new JSDOM("").window.document` and serializing `plot.outerHTML`, with the `xmlns` attributes set. — [Observable Plot getting-started](https://github.com/observablehq/plot/blob/main/docs/getting-started.md)
- `vl-convert-python` is a "dependency-free" package that converts Vega-Lite specs to SVG or PNG without a browser (`vegalite_to_svg`, `vegalite_to_png(scale=2)`), and it works with Altair. — [PyPI vl-convert-python](https://pypi.org/project/vl-convert-python)
- ECharts does zero-dependency server-side SVG rendering (since 5.3.0): `init(null, null, {renderer: 'svg', ssr: true, width, height})`, then `renderToSVGString()` and `dispose()`. 5.5.0 added a lightweight client runtime for hydration. — [ECharts SSR handbook](https://echarts.apache.org/handbook/en/how-to/cross-platform/server); [ECharts 5.5.0 notes](https://echarts.apache.org/handbook/en/basics/release-note/5-5-0)
- One developer reported that scatter points collapsed into one corner under ECharts SVG SSR until animation was disabled. — [DEV Community](https://dev.to/manufac/using-apache-echarts-with-reactjs-and-typescript-server-side-rendering-ssr-28m7)

**Design principles and references**
- The FT Visual Vocabulary groups chart choice by the relationship being shown: deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial and flow. It is © Financial Times and not openly licensed, so use it as a reference, not as copied artwork. — [FT chart-doctor / Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary)
- Datawrapper (Lisa Charlotte Muth, 2022-09-28):
  - Lead the title with the main takeaway in plain words.
  - Place annotations as close as possible to the elements they describe.
  - Replace legends with direct labels.
  - Repeat units and use compact numbers (12.8k).
  - Signal hierarchy with size, weight and contrast.
  - Limit labels to two clearly different text levels (e.g., 12 px gray and 14 px black).
  - Avoid rotated axis labels, left-align text, and outline text that sits over gridlines.

  — [Datawrapper: text in data visualizations](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Most news graphics skip explicit axis labels and explain them in the title or description instead. — [Datawrapper Academy](https://www.datawrapper.de/academy/why-datawrapper-does-not-include-axis-labels-for-many-charts)
- On phones, Datawrapper switches line charts from direct labels to a legend, and uses footnote-style labels for pie slices because small screens lack room. — [Datawrapper mobile-first](https://www.datawrapper.de/blog/datawrapper-becomes-mobile-first-charting-tool); [Datawrapper column/pie on mobile](https://www.datawrapper.de/blog/making-column-and-pie-charts-great-on-mobile-and-desktop)
- Tableau: a chart built for a desktop screen should not be pasted unchanged into a social post. Simplify it for social. — [Tableau blog](https://www.tableau.com/blog/6-tips-to-design-charts-for-social-media)
- WCAG 2.2 SC 1.4.3 contrast minimum: 4.5:1 for normal text, 3:1 for large text, where large means at least 18 pt, or 14 pt bold. — [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Carousel practice from marketing sources, which are lower authority: one main point per slide, "one data point per slide with brief context" as a format, a 4:5 frame at 1080x1350, short text (sources range from 10–15 to 30–40 words per slide), and don't rely on color alone. — [TrueFuture Media 2026](https://www.truefuturemedia.com/articles/instagram-carousel-strategy-2026); [PostNitro](https://postnitro.ai/blog/post/viral-instagram-carousels-strategies-2025)

### Inferences
- **Premium look for MSP.** One message per slide, structured as a hook or cover, then a big number with a unit and a comparison, then one simple chart, then context, then a call to action.
  - Make the "big number" 200–400 px tall in a heavy weight with tabular lining figures (see section 7).
  - Keep body text at 36 px or more on a 1080-wide canvas, since the 12–14 px web sizes above scale up roughly 2.5–3x for a phone-filling image.
  - Use a fixed brand palette with one highlight color, and gray for everything that is not the story.
  - Put a source/footnote line on every data slide, which builds trust in community statistics.
- **Chart forms that read at thumb size.** Horizontal bars for rankings (leaderboards), a single line with an end-point label for trends, dot or lollipop plots, and progress or waffle visuals for part-to-whole. Avoid dual axes, pies with more than 3 slices, and dense scatters.
- **Library choice for Claude.** Observable Plot gives the best ratio of a short spec to a good-looking default, and it emits SVG Claude can post-style with CSS. Hand-written D3/SVG is best for bespoke hero graphics such as a puzzle-piece progress bar. Vega-Lite is the best choice if specs should be pure JSON data, which is easy to validate. matplotlib with a custom style sheet works but is harder to make look "premium" and on-brand. Chart.js needs a canvas and is less suited to typographic polish.
- The user's Claude Code environment already has `dataviz` and `frontend-design` skills installed. These could be referenced from the pipeline's CLAUDE.md so chart and design rules stay consistent.

### Gaps
- The Economist's "Mistakes, we've drawn a few" piece could not be fetched (medium.economist.com blocked), so the Economist's mobile chart guidance is not cited here.
- No primary Pudding or Visual Capitalist style guide was retrieved.
- Chart.js headless (chartjs-node-canvas) and matplotlib styling were not researched in depth.

## 3. Motion for Reels/Stories: Remotion (2026 license), Motion Canvas, Revideo and other code-to-video tools, ffmpeg slideshows, Lottie, bar-chart races, Apple Silicon render times, burned-in captions, and 9:16 safe zones

### Takeaway
Remotion is the most mature code-to-video tool (React/HTML, so it reuses the same templates). It is **free for individuals and for-profit companies with up to 3 employees**. Larger teams pay $25/seat/month (Creators) or $0.01/render with a $100/month minimum (Automators). A Remotion 5.0 license change that counts contractors toward team size is pending. Remotion renders locally on macOS with optional VideoToolbox hardware encoding and has first-class whisper.cpp captions. Revideo (MIT, Motion Canvas-based) is the open-source fallback if licensing becomes a problem. Keep critical content inside about the central 950x980 px of a 1080x1920 Reel.

### Cited Findings
**Remotion license and pricing**
- The free license covers "an individual", "a for-profit organization with up to 3 employees", "a non-profit or not-for-profit organization", and anyone "evaluating whether Remotion is a good fit, and are not yet using it in a commercial way". Everyone else needs a Company License. — [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
- Pricing on 2026-10-13:
  - Remotion for Creators: $25/month per seat.
  - Remotion for Automators: $0.01 per render, with a $100/month minimum.
  - Enterprise: from $500/month.
  - "Remotion is free to use for individuals and companies up to three people."

  — [remotion.pro/license](https://www.remotion.pro/license)
- **Pending change (flag).** A draft PR says a new LICENSE "will ship with Remotion 5.0". Under it, "Contractors also count towards team size", and the company license is bound to new T&Cs. As of its last activity (August 2026) the PR was still a draft, and 5.0 did not appear to be released. — [remotion-dev/remotion PR #3750](https://github.com/remotion-dev/remotion/pull/3750)

**Remotion performance on a Mac**
- Default concurrency is half the CPU threads. `npx remotion benchmark` compares concurrency values. — [Remotion performance docs](https://www.remotion.dev/docs/performance); [Remotion benchmark CLI](https://remotion.dev/docs/cli/benchmark)
- Hardware-accelerated encoding (`hardwareAcceleration: 'if-possible' | 'required'`) is macOS VideoToolbox only. ProRes came in v4.0.228, H.264/H.265 in v4.0.236. It is off by default and produces larger files, so set `--video-bitrate`. — [Remotion hardware acceleration](https://remotion.dev/docs/hardware-acceleration)
- Indirect data point: FFmpeg's VideoToolbox encoder ran at about 8.5x speed on an M1 Max versus software encoding. — [CodeTV: FFmpeg on Apple Silicon](https://codetv.dev/blog/hardware-acceleration-ffmpeg-apple-silicon)

**Remotion captions**
- `@remotion/install-whisper-cpp` installs whisper.cpp, downloads a model (e.g., `medium.en`), transcribes with `tokenLevelTimestamps`, and converts the output with `toCaptions()`. Input audio must be a 16 kHz WAV, which ffmpeg can produce. — [Remotion transcribe-captions](https://github.com/remotion-dev/remotion/blob/main/packages/codex-plugin/skills/remotion-best-practices/remotion-captions/transcribe-captions.md); [toCaptions()](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/install-whisper-cpp/to-captions.mdx)
- `@remotion/captions` `createTikTokStyleCaptions()` groups tokens into pages for word-by-word highlighted, burned-in captions. — [createTikTokStyleCaptions](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/captions/create-tiktok-style-captions.mdx)
- The official TikTok template defines a 1080x1920, 30 fps composition. — [template-tiktok Root.tsx](https://github.com/remotion-dev/remotion/blob/main/packages/template-tiktok/src/Root.tsx)

**Alternatives**
- Revideo is MIT-licensed and built by extending Motion Canvas. It adds audio (`<Audio/>`, `<Video/>`), headless `renderVideo()`, parallel rendering, and a React `<Player/>`. GitHub shows active development (1,143 commits, 2026 copyright, no deprecation notice). — [Revideo GitHub](https://github.com/redotvideo/revideo); [YC launch](https://www.ycombinator.com/launches/Kq1-revideo-create-videos-with-code)
- Motion Canvas is MIT-licensed, with 955 commits, 151 open issues and 24 open PRs. It is generator-based and editor-focused, and its headless render and audio-export story is unclear. One undated community comment asks whether it is "abandoned". — [Motion Canvas GitHub](https://github.com/motion-canvas/motion-canvas); [LibHunt](https://www.libhunt.com/r/motion-canvas)
- Weekly npm downloads in 2026: Remotion about 60K, Motion Canvas core about 8K, @revideo/core about 3K. These come from a single third-party source and may be stale. — [PkgPulse 2026](https://www.pkgpulse.com/guides/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026)
- Takumi documents keyframe animation as part of its renderer. — [Takumi docs](https://takumi.kane.tw/docs)

**Reels specs and safe zones**
- API Reels spec:
  - Container: MOV or MP4 with the moov atom at the front and no edit lists.
  - Video: H.264 or HEVC, progressive, closed GOP, 4:2:0, 23–60 fps, at most 1920 px wide, 9:16 recommended, VBR at most 25 Mbps.
  - Audio: AAC at most 48 kHz, mono or stereo, 128 kbps.
  - Duration 3 s to 15 min. File size at most 300 MB.

  — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Hopper HQ (2026-09-18) gives these 9:16 safe zones and attributes them to Meta's percentage guidance:

  | Edge | Share of frame | Pixels | What sits there |
  |---|---|---|---|
  | Top | 14% | ~270 px | Username and audio label |
  | Bottom | 35% | ~670 px | Caption and audio track |
  | Right | 21% (bottom 40% of height) | ~230 px | Action rail |
  | Each side | 6% | ~65 px | Screen edge |

  That leaves a central safe area of about 950x980 px. Ads with disclaimers should keep the bottom 40% clear. — [Hopper HQ](https://www.hopperhq.com/blog/instagram-reel-size/)
- Looser third-party rules: about 1080x1420 centered, or keep clear of the top and bottom 250 px. ContentStudio uses about 880x1420. — [ContentStudio](https://contentstudio.io/blog/instagram-reel-size); [Argil 2026](https://argil.ai/blog/instagram-reel-size-e350f)

### Inferences
- **MSP eligibility for free Remotion.** If MySpeedPuzzling is run by 3 or fewer people, counting contractors once 5.0 lands, it qualifies for the free license. Otherwise the Creators seat at $25/month is the cheapest compliant route for local rendering, since Automators is aimed at products that render for others. Record the team-size assumption in the repo, and re-check after Remotion 5.0 ships.
- **Shared templates.** Remotion components are React and HTML/CSS, so the static and motion templates can share design tokens and even components. Each frame is a Chromium screenshot, so the same CSS fidelity argument from section 1 applies.
- **Render time on an M3 Max.** A 15–30 s, 1080x1920, 30 fps Reel with simple typographic and chart animation is likely to render in tens of seconds to a few minutes with raised concurrency and VideoToolbox. This is an estimate. Benchmark with `npx remotion benchmark`.
- **Cheap no-framework route.** ffmpeg slideshows (still JPEGs from the carousel pipeline, crossfades, `zoompan` Ken Burns, `h264_videotoolbox`) are sufficient for "carousel-as-Reel" posts and have no licensing questions.
- **Bar-chart races** are straightforward in Remotion or D3, by interpolating ranks per frame. No dedicated tool was researched.
- **Lottie.** Remotion has a Lottie integration, but Lottie animations need to be authored in After Effects or a similar tool. Not recommended unless pre-made, properly licensed Lottie files are used.
- **Captions** matter mainly if a Reel has voice-over. For music-only or silent data Reels, burned-in headline text inside the safe zone does the same job.

### Gaps
- No published Remotion, Revideo or ffmpeg benchmarks on an M3 Max specifically.
- Remotion 5.0's final free-license wording and release date are unknown.
- Revideo's and Motion Canvas's latest release versions and dates could not be read from GitHub. Their maintenance cadence is unverified.
- Meta's own safe-zone documentation was not fetched directly. The figures above come from Hopper HQ's citation of Meta.

## 4. Audio for Reels published via API: royalty-free music sources and licenses, Content ID / Rights Manager risk, and whether silent or SFX-only Reels are viable

### Takeaway
The premise that API-published Reels cannot use Instagram music is **outdated or incomplete**. Meta's **Instagram Audio API** lets a Business or Creator account (via Instagram API with Facebook Login only) search "audio that has been authorized for third party use" and attach it with `audio_configuration.audio_id` when creating a Reel container. Meta's catalog for business accounts is restricted, though, so for a brand account the safest options are the Meta Sound Collection (where available), or embedded tracks under licenses that clearly allow commercial social use: Pixabay Music, Mixkit, CC BY tracks from FMA (not CC BY-NC), or paid Epidemic Sound or Uppbeat. Even licensed tracks can be auto-claimed or muted, so keep license proof per track. Silent or original-SFX Reels are legally the cleanest.

### Cited Findings
**Instagram Audio API (official)**
- Audio API endpoints return `original_sound` and `music`. The docs describe `music` as "audio that has been authorized for third party use", and say "the available selection may vary from what appears in the native app".
- It is "only available on the Instagram API with Facebook Login", and requires a Business or Creator account with a linked Facebook Page plus the `instagram_basic` and `instagram_content_publish` permissions.
- To attach audio, call `POST /{ig-user-id}/media` with `media_type=REELS`, `video_url` and `audio_configuration { audio_id, audio_volume 0–100, video_volume 0–100 }`, then `media_publish`.
- Previews of Reels with attached audio are not supported. Preview URLs expire after about 1.5 days.
- The examples use Graph API v22.0. No launch date is given.

— [Instagram Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/)

**Meta's own music library and muting**
- Meta's help center (quoted in search results; the page itself could not be fetched) says the licensed music library is for personal, non-commercial use, and that some business accounts and post types cannot use it. Those accounts may use the **Sound Collection** (over 14,000 royalty-free songs and sounds). — [Instagram Help Center (as quoted in search results)](https://help.instagram.com/ipad-app/402084904469945)
- Third-party guides add that the catalog narrows silently, that availability varies by post type and region, and that Sound Collection tracks are licensed only within Meta products. These are secondary sources. — [FoxiMusic 2026 guide](https://www.foximusic.com/blog/instagram-reels-music-copyright-legal-guide/)
- Muting: the `media_url` field is omitted when media contains copyrighted material or has been flagged. Instagram may mute audio when rights-holder agreements change. — [IG Media reference](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media.md); [Instagram help](https://help.instagram.com/iphone-app/329208821595430)

**YouTube Audio Library**
- Its tracks are "copyright-safe" on YouTube only: "Only music and sound effects from the Audio Library are known to YouTube to be copyright-safe". YouTube "can't give legal guidance, including guidance on issues with music that can occur off the platform." CC tracks require crediting the artist in the video description. — [YouTube Help 3376882](https://support.google.com/youtube/answer/3376882?hl=en)
- Secondary sources conflict on Instagram use. Music Gateway says CC tracks can be used elsewhere. Lickd says some tracks are licensed for YouTube only and you must contact the artist for use outside YouTube. — [Music Gateway](https://www.musicgateway.com/blog/music-industry/youtube-audio-library); [Lickd](https://lickd.co/youtube-audio-library/)

**Pixabay Music**
- Free, no attribution required, and modification allowed. Standalone distribution is not allowed, including "as an image, audio, video, NFT or other digital file". Commercial use "it is likely that you will need consent or a license" for third-party rights. "Bulk, large-scale or systematic copying" and robots are prohibited. Terms last updated 2024-11-18. — [Pixabay Terms](https://pixabay.com/service/terms/); [Pixabay License summary](https://pixabay.com/service/license-summary/)
- Pixabay's FAQ says:
  - "You may use Pixabay music in commercial video projects", as part of a larger work.
  - Some contributors "may choose to register their tracks with Content ID". Tracks with a shield icon may trigger claims.
  - Instagram, Facebook and Pinterest "also use automated detection systems that may mute or block content". The fix is a dispute that cites the track URL and the license.

  — [Pixabay FAQ](https://pixabay.com/service/faq/)

**Other free sources**
- **Mixkit.** Its own info page says the free license covers commercial projects including social media marketing and online ads, with no attribution required. Reselling items in their original form is barred. The page also contained embedded instructions addressed to AI assistants, which were ignored. The license text itself did not render. — [Mixkit LLM info page](https://mixkit.co/llm-info/); [Mixkit license](https://mixkit.co/license/)
- **Free Music Archive.** Each track has its own CC license. CC BY allows commercial use with attribution. Under CC BY-NC "you may NOT use this for fundraising, advertising, or promoting a product or service without further permission." — [FMA License Guide](https://freemusicarchive.org/License_Guide); [FMA FAQ](https://freemusicarchive.org/faq/)

**Paid sources**
- **Uppbeat** (pricing page returned HTTP 429; figures from search results, flag): the free plan gives 3 downloads, renewed monthly, with 25% catalog access. Older sources say 10/month. Free users must credit Uppbeat; this is documented for YouTube descriptions, but no Instagram-specific rule was found. Paid tiers are about $5.59/month (Essentials) and $7.99/month (Creator). — [Uppbeat pricing](https://uppbeat.io/pricing); [TechCrunch 2022](https://techcrunch.com/2022/03/01/uk-music-platform-for-creators-uppbeat-raises-6-15-million-series-a/)
- **Epidemic Sound.** The official page did not render prices. It confirms Creator, Pro, Business and Enterprise plans, "unlimited downloads and usage", and ad-campaign use only on Pro or Enterprise. Third-party trackers in July–September 2026 list Pro at $39.99/month or $16.99/month billed annually, with Pro covering commercial and client work. The Business tier is quoted inconsistently ($74.99/month, or $29.99/month annual). — [Epidemic Sound pricing](https://www.epidemicsound.com/pricing/); [Recurdash (verified 2026-07-31)](https://recurdash.com/subscription-pricing/epidemic-sound); [FrontDeskReview (Sep 2026)](https://frontdeskreview.com/software/music-licensing/epidemic-sound/)

**Claims on licensed music**
- Automated detection can claim even properly licensed music. — [Soundstripe](https://www.soundstripe.com/knowledge/content-id-claims/what-are-copyright-claims)
- Pixabay and Storyblocks tracks have triggered YouTube Content ID claims, which are cleared by disputing with the license file. — [HeyGen help](https://help.heygen.com/en/articles/8986144-how-to-remove-your-content-id-claim-in-youtube)

### Inferences
- **Recommended audio policy for MSP**, in order of safety:
  1. Original, generated or SFX-only audio: UI ticks, puzzle-piece "click" foley recorded in-house, CC0 SFX.
  2. Tracks attached through the Instagram Audio API, if the catalog available to the MSP account is usable. Check `audio_type=music` results with the real account.
  3. Embedded Pixabay or Mixkit tracks, avoiding Pixabay tracks with the Content-ID shield.
  4. FMA CC BY tracks, with credit in the caption.
  5. A paid Epidemic Sound Pro plan only if volume and quality justify it.

  Avoid YouTube Audio Library tracks for Instagram and all CC BY-NC tracks.
- **Licensing ledger.** Store a per-track record in the repo (source URL, license snapshot or `.txt`, download date). Pixabay's own dispute process asks for exactly this.
- **Silent Reels.** They are legally clean. Instagram's in-app picker is not available to API-published posts unless the Audio API is used, but a creator could also add trending audio manually in the app after an API draft. That manual step is outside this research. Data-story Reels often work as "watch with sound off" because the text is burned in.

### Gaps
- No official statement on whether Business accounts receive a reduced catalog through the Audio API specifically, or when the Audio API launched.
- Uppbeat's current license terms for Instagram (credit placement, whether the free tier covers Instagram) were not verified, because the pricing page returned 429.
- Mixkit's music license text did not render. Only Mixkit's info page was available.
- Epidemic Sound's official 2026 prices and the per-channel rules for brand accounts were not verified on the vendor's page.
- No reliable data on how often Rights Manager mutes royalty-free tracks on Instagram.

## 5. Template SaaS alternatives (Canva Connect Autofill, Bannerbear, Placid, Templated.io, Creatomate, Figma API, Pencil/pen.dev): are they worth it versus self-built HTML templates?

### Takeaway
For a local, LLM-driven pipeline that needs exact numbers and full design control, self-built HTML/CSS templates rendered by Playwright (and Remotion for video) beat SaaS on cost, flexibility and auditability. Canva Connect Autofill is the only SaaS with a real "designers edit templates, code fills them" story, and it now works on Canva **Pro**, Teams and Enterprise, not only Enterprise. It is worth considering only if non-developers need to design templates in Canva. Bannerbear, Placid, Templated and Creatomate cost about $19–$54/month and add little over HTML. Figma's REST API can export images, but it cannot fill templates without the Enterprise-only Variables API or a plugin.

### Cited Findings
**Canva Connect**
- Autofill requires a "Canva plan that includes Autofill, such as Canva Pro, Canva Teams, or Canva Enterprise". It is also available to Canva Education and Canva for Nonprofits, the account needs MFA, and "Usage limits will be introduced in the future".
- Brand templates expose tagged text and image fields (`GET /brand-templates/{id}/dataset`, `POST /autofills`). Jobs are asynchronous. Images must first be uploaded as assets; video is not supported for fields.

— [Canva Connect Autofill guide](https://www.canva.dev/docs/connect/autofill-guide/)
- The Export API supports JPG (`quality` 1–100), PNG, GIF, PDF and MP4 (480p, 720p, 1080p or 4k, keeping the design's aspect ratio). Width and height can be set from 40 to 25,000 px. Transparent and lossy PNG need premium plans. Rate limits: 20 req/min per user; per app, 750 exports per 5 minutes and 5,000 per day; per user, 500 per day. Download URLs expire after 24 hours. — [Canva create design export job](https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/)

**Image/video template APIs** (pricing mostly from competitor-authored comparisons; verify on vendor sites)

| Service | Entry plan | Other details |
|---|---|---|
| Templated.io | ~$29/month for 1,000 credits | Template caps per tier |
| Bannerbear | ~$49/month for 1,000 credits | No permanent free plan |
| Placid | ~$19/month for 500 credits | Pro ~$39/month for 2,500 |
| Creatomate | $41 or $54/month (sources conflict) | Strongest for video |

— [Templated: Bannerbear alternatives](https://templated.io/blog/best-bannerbear-alternatives/); [Orshot comparison](https://orshot.com/blog/template-based-image-generation-tools); [Abyssale comparison](https://www.abyssale.com/creative-automation-platforms-with-api-compared)

**Figma**
- The Variables REST API requires "a Full seat in an Enterprise org". The Plugin API is not restricted the same way. — [Figma Variables REST API](https://developers.figma.com/docs/rest-api/variables); [Figma forum](https://forum.figma.com/t/whys-the-variables-api-only-available-on-enterprise-plans/51451)
- `GET /v1/images/{file_key}` renders nodes to PNG, JPG, SVG or PDF with `scale` 0.01–4 (per a third-party reference). A September 2025 forum report says output was capped (max 1905x2751) at scales 2 and 4. — [Figma REST reference (third-party mirror)](https://cdn.jsdelivr.net/npm/figma-code-agent@1.0.2/knowledge/figma-api-rest.md); [Figma forum report](https://forum.figma.com/report-a-problem-6/figma-rest-api-images-endpoint-returns-image-in-wrong-size-45366)

**Pencil (pen.dev)**
- The CLI (`@pen.dev/cli`) generates `.pen` designs with its own AI designer agent from a prompt and exports `--export-type png|jpeg|webp|pdf` with `--export-scale`.
- It requires an authenticated pen.dev user.
- Generation "is not instant", and the skill advises passing the user's request through unexpanded because the CLI's agent makes the layout decisions.

— [pen.dev CLI SKILL.md (published in the npm package)](https://unpkg.com/@pen.dev/cli@latest/SKILL.md)

### Inferences
- **Pencil is a poor fit for the data path.** An AI designer that makes its own layout choices conflicts with "numbers rendered exactly, on-brand, deterministic". It also depends on an account and online service. It could still be useful for exploring visual directions (moodboards, cover-style ideas) that are then hand-ported into HTML templates. The Pencil MCP server's own instructions say `.pen` files are encrypted and accessible only via its tools, which reduces portability.
- **Canva Autofill is a valid alternative only if** a human designer wants to own the look in Canva and MSP already has Canva Pro. Costs are the Pro subscription, asynchronous jobs, upload-before-fill for images, future usage limits, and no programmatic charts (charts would need to be pre-rendered images). For an LLM-run pipeline it is more moving parts than HTML.
- **Paid template APIs** make sense for cloud or no-code teams. For a local Mac pipeline with Claude writing HTML, they add cost per render and lock-in without adding capability.

### Gaps
- Official 2026 pricing pages for Bannerbear, Placid, Templated.io and Creatomate were not fetched. The figures above come from competitor blogs.
- pen.dev pricing and plan limits were not found.
- Canva's future Autofill usage limits are not yet published.

## 6. Free asset libraries for commercial social use, with API access (Unsplash, Pexels, Pixabay, Openverse, Wikimedia Commons) and illustration/icon sets (Phosphor, Lucide, Tabler, unDraw, Open Peeps, Humaaans): licensing and the "generic look" risk

### Takeaway
Unsplash, Pexels and Pixabay all allow free commercial use without attribution, including posting edited images on Instagram. The constraints are no reselling, no implied endorsement by people or brands, no trademark use, and no building a competing library. Their **APIs** add stricter rules (attribution and links, rate limits, download tracking or caching, and anti-bulk clauses), so for an occasional "one photo per post" use the API is fine, but bulk harvesting is not. Openverse and Wikimedia Commons are per-item CC licenses, so filter to CC0 or CC BY and store the attribution. Icon sets (Lucide ISC, Phosphor MIT, Tabler MIT) are safe. unDraw is free but forbids AI training and redistribution. Open Peeps is CC0. Humaaans' license status is inconsistently reported. All of these read as generic SaaS illustration, so for a premium MSP look, prefer MSP's own puzzle photography and data-driven typography.

### Cited Findings
**Unsplash**
- License: free for "Commercial and non-commercial purposes", with no permission or attribution needed (a credit is appreciated). Prohibited: selling images "without significant modification", and "Compiling images from Unsplash to replicate a similar or competing service". — [Unsplash License](https://unsplash.com/license)
- API guidelines:
  - API uses must hotlink the `photo.urls` image URLs.
  - Apps must attribute Unsplash and the photographer and link to the photographer's profile with UTM parameters.
  - Apps must call `download_location` when a photo is "downloaded" or used, for example as a blog header.
  - The API must not be used to replicate Unsplash, and it is meant for "non-automated, high-quality, and authentic experiences".

  — [Unsplash API guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)
- Rate limits: 50 requests/hour in demo mode, 1,000/hour after production approval. Image requests to `images.unsplash.com` don't count. Downloads are triggered via `GET /photos/:id/download`. — [Unsplash API documentation](https://unsplash.com/documentation)

**Pexels**
- License: "All photos and videos on Pexels are free to use", attribution is not required, and editing is allowed. Don'ts:
  - Selling unaltered copies.
  - Implying endorsement by people or brands.
  - Redistributing on stock or wallpaper platforms.
  - Using images as a trademark.
  - Showing identifiable people "in a bad light or in a way that is offensive".

  The page explicitly encourages posting on Instagram. — [Pexels License](https://www.pexels.com/license/)
- API: show "a prominent link to Pexels" and credit photographers where possible. Limits are 200 requests/hour and 20,000/month, and can be lifted for free on request. Don't replicate Pexels' core functionality. — [Pexels API docs](https://www.pexels.com/api/documentation/)

**Pixabay**
- License: free, no attribution, modification allowed. No standalone resale. No commercial use of recognizable trademarks "in relation to goods and services". No immoral use, especially of recognizable people. — [Pixabay license summary](https://pixabay.com/service/license-summary/)
- API: 100 requests per 60 seconds, and results must be cached for 24 hours. "Permanent hotlinking of images ... is not allowed", so download images to your own server. Show the source wherever search results are displayed. "Systematic mass downloads are not allowed." — [Pixabay API docs](https://pixabay.com/api/docs/)

**Openverse and Wikimedia Commons**
- Licenses vary per item (CC0, CC BY, CC BY-SA, CC BY-NC…). Commercial projects should filter to CC0 or CC BY and read each file's license. CC BY-NC is not commercial-safe. Apps using the Openverse API must show item-level license info. These are secondary sources; the official Openverse API docs were not fetched. — [OpenReplay (de)](https://blog.openreplay.com/de/kostenlose-stockfoto-ressourcen/); [CreativePro](https://creativepro.com/using-creative-commons-images-in-professional-work/); [PolyU library guide](https://libguides.lb.polyu.edu.hk/online-tools-for-assignment/ccsearch)

**Illustrations and icons**
- **unDraw**: free for commercial and noncommercial use, no credit needed, modification allowed. It forbids compiling assets to "replicate a similar or competing service", redistributing "in packs or otherwise", and AI or ML training ("explicitly prohibits ... for training"). Brand logos in the assets may only represent that brand. Dated "Copyright 2026". — [unDraw license](https://undraw.co/license)
- **Open Peeps** is consistently described as CC0. **Humaaans** is described as CC0 by most sources, but one 2026 roundup says it is free for commercial use while "not formally CC0". Check the official pages. — [Muzli 2026](https://muz.li/blog/best-free-illustration-libraries-for-designers-2026/); [AllSVGIcons CC0 list](https://allsvgicons.com/cc0-illustrations/)
- **Icons**: Lucide is ISC; Phosphor and Tabler are MIT. All are permissive, and MIT or ISC require keeping the copyright notice in source. These come from secondary sources, not the projects' LICENSE files. — [AllSVGIcons 2026 comparison](https://allsvgicons.com/blog/best-free-svg-icon-libraries-2026/); [DEV: Lucide vs Tabler vs Phosphor](https://dev.to/svgicons/lucide-vs-tabler-vs-phosphor-which-free-icon-set-fits-your-ui-4ocl)

### Inferences
- **Can API-sourced photos be downloaded and posted on Instagram?** Yes, under each site's license. The hotlinking rules (Unsplash) govern how an *app* displays images, while the Unsplash and Pexels licenses permit downloading and reuse.
  - For Unsplash, call the download-tracking endpoint when a photo is chosen. Store the photographer credit and add "Photo: Name / Unsplash" in the caption or alt text. This is not required by the license, but it is good practice and matches the API guidelines.
  - For Pixabay, download the image (permanent hotlinking is banned).
  - Keep a per-asset license ledger in the repo: source, URL, license, download date, credit.
- **Low volume is fine.** Fetching a few images per week, with human or agent selection, stays well within the "non-automated / no systematic mass download" spirit of the API terms. Don't build a local mirror or cache of these libraries.
- **People and brands in photos.** Avoid stock photos with recognizable people or puzzle-brand logos (e.g., Ravensburger boxes). Implied endorsement is barred by Pexels and Unsplash, and the trademark clause applies on Pixabay. MSP's own community photos, with permission, are more authentic anyway.
- **Generic-look risk.** unDraw, Humaaans and Open Peeps illustrations are ubiquitous in SaaS landing pages, and stock "puzzle" photos are cliché. For a premium look, use bold typographic layouts, one custom visual motif (puzzle-piece shapes drawn as SVG, piece-count grids, timers), and Lucide or Phosphor icons sparingly at a consistent stroke weight.

### Gaps
- The official Openverse API terms and Wikimedia reuse guidelines were not fetched directly.
- Official LICENSE files for Lucide, Phosphor and Tabler, and the Humaaans and Open Peeps license pages, were not fetched. Secondary sources only.
- The Unsplash API Terms (separate from the guidelines) were not fully read. The documentation page was truncated at 100k characters.

## 7. Open-licensed fonts for bold social typography (Google Fonts / SIL OFL) and variable-font tricks for punchy numbers

### Takeaway
SIL OFL fonts, which make up most of Google Fonts, can be used freely to make commercial images. The resulting graphics are not OFL-licensed and need no attribution, and fonts can be embedded. Only selling the font files themselves, or misusing Reserved Font Names on modified fonts, is restricted. For "punchy numbers", pick a variable family with a heavy weight and real tabular and lining figures (`font-variant-numeric: tabular-nums lining-nums`), so counters and leaderboards don't jitter or misalign. This works in Chromium/Playwright and Takumi; Satori's variable-font support is unclear.

### Cited Findings
- OFL FAQ 1.1: designing with OFL fonts is allowed ("Yes. You are very welcome to do so."). 1.1.1: your artwork does not become OFL, and you remain its copyright holder. 1.1.2: attribution is optional. — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- OFL FAQ 1.12: fonts may be embedded in documents "either in full or a subset". 1.13: embedding "does not change the license of the document itself". 1.4: bundling with sold software is allowed. 1.6: selling the fonts alone is not allowed. — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- OFL FAQ section 5: Reserved Font Names may not identify modified versions of a font. — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- `font-variant-numeric` keywords map to OpenType features: `tabular-nums` (`tnum`) gives equal-width digits for alignment, `lining-nums` (`lnum`) gives cap-height digits on the baseline, and `slashed-zero` (`zero`) and `ordinal` (`ordn`) are also available. This only works if the font contains those features. — [MDN font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)
- Takumi loads variable fonts (weight range or `axes`) and honors `font-variation-settings` per element. It never reads system fonts, and ships a `googleFonts` helper. — [Takumi docs](https://takumi.kane.tw/docs)
- Satori needs explicit font buffers. Its live README lists TTF, OTF, WOFF and WOFF2 support and OpenType features via `font-feature-settings`, but does not mention variable fonts. — [Satori README](https://github.com/vercel/satori)

### Inferences
- **Font-loading practice.** Self-host the chosen OFL fonts in the repo, which OFL allows. Commit the `OFL.txt` alongside them, since the FAQ recommends including it, and load them via `@font-face` in templates. This keeps renders offline and reproducible, and avoids version drift from Google's CDN.
- **Candidate families**, to be checked for `tnum`/`lnum` support and Latin Extended (Czech diacritics: MSP has a Czech audience) before adopting:
  - Display or numerals: Inter Tight or Inter Display, Archivo, Bricolage Grotesque, Space Grotesk, Big Shoulders Display, Anton or Bebas Neue (condensed, caps-only).
  - Body: Inter, Manrope, Plus Jakarta Sans.
- **Variable-font tricks.**
  - Animate `font-weight` or `wght` from 400 to 900 as a counter lands in Remotion.
  - Use the `wdth` axis to fit long numbers (e.g., 12,345 pieces) without shrinking the size.
  - Pair a tight negative `letter-spacing` on huge numerals with tabular figures in tables.
  - Use `font-feature-settings: "ss01"` for alternate digits where the font offers them.

  All of these work in Chromium and Remotion. In Satori they are unverified.

### Gaps
- The Google Fonts FAQ page did not render, so Google's own wording on commercial use and image use is not quoted. The OFL FAQ covers the substance.
- Which specific Google Fonts families include `tnum`, `lnum` and full Czech coverage was not verified per font.

## 8. Recommended stack (synthesis for MSP's local Claude Code pipeline)

### Takeaway
Use one HTML/CSS/SVG design system, rendered by Playwright for stills and by Remotion (free tier, while MSP has 3 or fewer people) for Reels/Stories. Draw charts with Observable Plot or D3 as inline SVG, set type in self-hosted OFL variable fonts, and keep a license ledger for every external asset or track. Audio comes, in order of safety, from original/SFX, then the Instagram Audio API, then Pixabay or Mixkit, then FMA CC BY. Skip template SaaS.

### Cited Findings
- Playwright screenshots support JPEG with quality, device-scale control and disabled animations. — [Playwright types](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/types/types.d.ts)
- The Instagram API accepts JPEG only, sRGB, width up to 1440, and carousels of up to 10 items. — [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Remotion is free for organizations with up to 3 employees. A 5.0 change that counts contractors is pending. — [Remotion LICENSE](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md); [PR #3750](https://github.com/remotion-dev/remotion/pull/3750)
- Remotion offers VideoToolbox hardware encoding on macOS, and whisper.cpp captions with TikTok-style pages. — [Remotion HW accel](https://remotion.dev/docs/hardware-acceleration); [createTikTokStyleCaptions](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/captions/create-tiktok-style-captions.mdx)
- Observable Plot can render SVG server-side with JSDOM, or simply in-page under Playwright. — [Observable Plot docs](https://github.com/observablehq/plot/blob/main/docs/getting-started.md)
- The Instagram Audio API can attach authorized music to API-published Reels. — [Instagram Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/)

### Inferences
**Proposed stack (all local and free, assuming Remotion free-tier eligibility)**
1. **Templates.** A `templates/` folder of HTML + CSS (design tokens as CSS variables) + JS that read a JSON data payload. Two canvases: `feed-4x5` at 1080x1350 and `story-9x16` at 1080x1920. A safe-zone overlay toggle for QA marks the 14% top, 35% bottom and 21% right rail, plus the 3:4 grid crop.
2. **Static renderer.** A Node script using Playwright and Chromium. It keeps one persistent browser, waits for `document.fonts.ready`, takes a JPEG at quality 90–95 (or PNG, then mozjpeg), and writes `post-XX/slide-01.jpg…`. Optionally render at 1440 wide after an A/B test.
3. **Charts.** Observable Plot for standard charts (bars, lines, dots) rendered in-page. Hand-written SVG/D3 for hero graphics. Vega-Lite + `vl-convert` if a JSON-only, validated chart spec is preferred.
4. **Motion.** Remotion compositions that import the same tokens and components. Use `hardwareAcceleration: 'if-possible'` with an explicit bitrate and H.264, AAC 48 kHz, 30 fps and the moov atom at the front, matching the IG spec. Use whisper.cpp captions only for voice-over Reels. ffmpeg slideshow (`zoompan`, `h264_videotoolbox`) is the zero-dependency fallback. Revideo (MIT) is the fallback if the Remotion license stops fitting.
5. **Typography.** Self-hosted OFL variable fonts, with `tabular-nums lining-nums` for all statistics and a weight-animation counter in Reels.
6. **Assets.** MSP's own photos first. Unsplash, Pexels or Pixabay via API for occasional backgrounds, with download tracking and credits stored in the ledger. Lucide or Phosphor icons. Avoid unDraw, Humaaans and Open Peeps for brand content (generic look; unDraw also forbids redistribution and AI training).
7. **Audio.** Original/SFX first. Then the Instagram Audio API, if the account's catalog allows (Facebook Login path). Then Pixabay or Mixkit (avoid Pixabay's Content-ID shield tracks) or FMA CC BY with a caption credit. Every track goes in an `audio_licenses.json` ledger with a license snapshot.
8. **QA gate.** A Claude Code check that compares every number in the rendered slide's DOM text against the source data before screenshotting. It also verifies WCAG contrast (4.5:1 body, 3:1 for large text) and safe-zone bounding boxes, using Playwright's `getBoundingClientRect` checks.

**Why not the alternatives**
- Satori or Takumi: CSS-subset risk with an LLM author, and speed is not needed locally.
- Canva Autofill: needs Pro, asynchronous jobs and future usage limits, and has no native data charts.
- Bannerbear, Placid, Templated, Creatomate: recurring cost with no capability gain.
- Figma API: template filling needs Enterprise.
- pen.dev: a non-deterministic AI layout agent that needs an account.

### Gaps
- MSP's headcount, including contractors, determines Remotion license eligibility. This is not known to this research and must be confirmed by the team.
- Actual render times on the M3 Max, and Instagram's recompression behavior at 1080 versus 1440 width, should be benchmarked empirically during pipeline setup.
