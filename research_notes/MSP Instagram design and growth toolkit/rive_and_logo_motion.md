# Rive and logo motion: is Rive useful for an MSP logo intro/outro? (2026-10-16)

The owner asked whether [Rive](https://rive.app) is useful or usable for a logo intro/outro animation. This note
covers what Rive is today, who could author in it, whether it fits the HyperFrames Reel pipeline, and what to use
instead or alongside it. It updates the one-paragraph Rive verdict in `motion_video_collage_audio.md` §1, which
called Rive "GUI-only" and "paid to export". **That is outdated:** since September 2026 Rive has a CLI and a text
format that a coding agent can write.

**Short answer.** For the Reel intro/outro, use plain SVG + GSAP in HyperFrames, built from our own logo's layers.
It is free, Claude can do all of it, and it is already deterministic. Rive is usable (a local test passed) but adds
little for a 2–3 s video sting. Rive's real strength is the **MSP website and app**: small interactive animations
driven by state machines and data, like XP level-ups, badges and loaders. Trial it there later.

## 1. What Rive is today

| Part | Facts (checked 2026-10-16) |
|---|---|
| **Editor** | Browser and desktop design + animation tool. Animate mode has timelines; **state machines** wire animations to inputs, events and data-bound **view models**; layouts; text; audio. **Rive Scripting** in Luau (node, layout, path-effect scripts). A built-in **Rive Agent** (AI): "with limits" on Free/Cadet, advanced models and credits on Voyager. Since Sep 2026 the Voyager Agent can also draw illustrations with QuiverAI's Arrow 2. — [pricing](https://rive.app/pricing), [Releasebot: Rive](https://releasebot.io/updates/rive) |
| **Formats** | `.rev` is the editor file. `.riv` is the compact binary that runtimes play. **RML** (Rive Markup Language) is a new XML text form of a scene (artboards, shapes, fills, keyed animations, state machines, view models, layouts, text, script assets). The CLI compiles RML to `.riv` or `.rev`. — [RML docs](https://rive.app/docs/runtimes/advanced-topic/rml) |
| **Rive CLI** | Technical preview, announced about 10 Sep 2026. **v1.6.0** in the Homebrew tap today. Closed-source binary for macOS arm64 (Ventura+), Linux x64 and Windows. `rive create` writes `scene.rml`, `rive.yaml`, **`AGENTS.md` and `CLAUDE.md`**. Commands: `rive <dir>` (live preview), `--verify`, `--once` (unsigned `.riv`), `--publish` (signed `.riv`; login; "may add a watermark"), `--screenshot=out.png --advance=1s --viewport=WxH`, `--data=…`, `--pointer=…`, `inspect --json`, `schema`, `docs`, `push`/`pull` to sync with the editor. **No login needed** for create, preview, `--once`, `--verify` and `--screenshot`. Analytics can be turned off (`rive analytics off` or `RIVE_ANALYTICS`). The docs list **no video or frame-sequence export** in the CLI. — [CLI commands](https://rive.app/docs/cli/reference/commands), [getting started](https://rive.app/docs/cli/getting-started), [agents](https://rive.app/docs/cli/agents), [Homebrew cask](https://github.com/rive-app/homebrew-tap), [announcement](https://community.rive.app/c/announcements/introducing-the-rive-cli-and-rml) |
| **Runtimes** | Web (WASM: `@rive-app/webgl2` uses the Rive Renderer and supports every feature; `@rive-app/canvas` uses Canvas2D and has **no vector feathering**; `canvas-lite` is smallest; `*-advanced` gives the low-level API), React, React Native, iOS, Android, Flutter, C++, Unity, Unreal, Defold. — [choose a renderer](https://rive.app/docs/runtimes/choose-a-renderer/overview), [canvas vs WebGL2](https://rive.app/docs/runtimes/web/canvas-vs-webgl) |
| **Runtime licence** | **MIT**: `rive-runtime`, `rive-wasm`, `rive-react` and every `@rive-app/*` npm package (2.44.2 latest, 2026-10-10). Rive says runtime and file format are open source, with "no royalties either way, ever". — [GitHub rive-runtime](https://github.com/rive-app/rive-runtime), [Guido Rosso on X](https://x.com/guidorosso/status/2095174568189239611) |
| **Plans** | Free $0: editor + CLI, "Export .riv files **with a splash screen**", 3 collaborative files, Agent with limits. **Cadet $9/seat/mo** (max 3 seats): exports without the splash screen, unlimited files. Voyager $32/seat/mo: Libraries, embed hosting, advanced Agent. Enterprise $120/seat/mo. — [pricing](https://rive.app/pricing) |
| **Splash rule** | "Files published on the Free plan play a short Rive splash screen before your content; upgrade to remove it." The editor is moving to the same model. Free editor export was paywalled from Oct 2025 until this change, and the editor docs still say "Exporting for runtime is available on paid plans". It is **unclear** whether an unsigned CLI `--once` `.riv` carries the splash. The docs tie the watermark to `--publish` only, and say unsigned files *with scripts* are rejected by the web runtimes. — [Rive on X](https://x.com/rive_app/status/2098199130778857914), [export docs](https://rive.app/docs/editor/exporting/exporting-for-runtime) |
| **Video / GIF export** | Editor only, through Rive's **Cloud Renderer** (H.264, GIF, PNG/SVG sequence, WebM). The docs say "Exporting video and images is available on paid plans". Since Sep 2026, render presets can render a state machine with its own fps and duration. — [video export docs](https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design) |

## 2. Authoring: who would make the logo animation?

- **Before Sep 2026, only a person in the editor could author Rive files.** Now Claude can author in principle: it
  writes RML, compiles with `rive <dir> --once`, checks with `--verify` and `inspect --json`, and looks at frames
  with `--screenshot --advance=…`. That is the same build → screenshot → look loop we use for the stills. The
  owner can open the result in the editor (`--rev` needs login) and `pull` changes back.
- **Caveats.**
  - The CLI is a closed-source technical preview, a month old, and changes weekly (1.1 → 1.6 in about four weeks).
  - RML is a keyframe and property format (`KeyedProperty propertyKey="15"`). It is verbose, and the docs warn
    that "a clean build proves that the file compiles, but not that it behaves or looks as intended".
  - **The CLI has no documented SVG import.** Our logo's 69 CorelDRAW paths would need converting into RML path
    vertices by a script. That's doable, but it's custom work.
  - Not tested here: installing the CLI means running a proprietary binary, which needs the owner's OK.
- **SVG import in the editor** converts SVG into native shapes. Paste/drop import landed on 11 Oct 2026. Known
  losses: `mask` becomes hard clipping, `filter` and skew are unsupported, gradient transforms are ignored, and
  `inherit` turns white. Rive recommends presentation attributes over CSS. — [SVG import docs](https://rive.app/docs/editor/assets/svg)
- **Our logo specifically** (`assets/brand/speedpuzzling-logo.svg`, checked locally):
  - It styles fills through CSS classes in a `<style>` block, so it would need converting to attributes first.
  - Its **10 gradient opacity masks** (the fading ghost trails behind the clock hands) would import as hard clips,
    so the fade is lost and must be rebuilt.
  - It has 26 linear gradients, one inherited via `xlink:href`. There are no gradient transforms and no filters.
  - It is 69 paths in two unnamed groups, so any tool needs a one-time "rig" step that names the parts (hands,
    trails, dial ticks, crown, side buttons, piece body, knobs, speed lines). `src/design/build-logo.ts` already
    processes this SVG in code, so a rig script is a small extension.
- **In practice:** for Rive, the owner (or a designer) in the editor gives the best quality, and Claude via
  RML/CLI is possible but early. For SVG + GSAP, Claude does all of it in the existing code path.

## 3. Fit with our pipeline: local feasibility test (done today)

**Setup.**
- Scratch dir outside the repo, no package.json changes. Installed with `--ignore-scripts`:
  `@rive-app/canvas-advanced@2.44.0` and `@rive-app/webgl2-advanced@2.44.0` (MIT, released 2026-09-30).
- Public sample files from the MIT `rive-wasm` repo: `truck.riv` (a linear animation) and `birb.riv` (a state
  machine with feathered shading).
- The repo's Playwright 1.64.0 drove the headless shell **Chromium 156.0.8078.4** with the software GPU
  (`--use-angle=swiftshader`). WebGL reports "ANGLE (Vulkan, SwiftShader)".
- Canvas 1080×1920. Each frame drawn with the low-level API: `advance(dt)` / `apply` / `artboard.draw` / `flush`,
  with **no requestAnimationFrame**.
- Every request went through `page.route`: local files were served and **anything else aborted and logged**.
- Ran 2026-10-16 14:21–14:23 UTC on the M3 Max, 36 GB. 87 % memory free, swap 1.66 GB, other apps not checked.

**Results.**

| Check | canvas (Canvas2D) | webgl2 (Rive Renderer on SwiftShader) |
|---|---|---|
| Loads and renders offline | yes, 0 page errors | yes, 0 page errors |
| Requests outside the local files | **0** (the WASM URL must be set via `locateFile`; by default it comes from the unpkg CDN) | 0 |
| Same 90 frames after a browser restart | **byte-identical** (both files) | **byte-identical** (both files) |
| One-shot seek `advance(t)` vs stepping 1/30 s, linear animation | identical (PSNR 120 dB) for all sampled frames in the first cycle; 77/90 frames identical overall | 82/90 overall |
| One-shot seek vs stepping, **state machine** | **differs** (22–26 dB): a state machine must be replayed from 0 | same |
| HyperFrames-style seek: paused GSAP timeline, `onUpdate` replays from 0 with fixed 1/30 s steps, frames in shuffled order | **matches stepping 89–90/90** | 89/90 |
| Time per frame (advance + draw + PNG readback) | 30–48 ms | 40–58 ms |
| Composites over HTML | yes, transparent canvas over the navy page, captured by `page.screenshot` | yes |
| canvas vs webgl2 output | PSNR 61–62 dB (visually the same for these files) | |

The whole 8-session run took 95 s, and its largest process peaked at 0.5 GB RSS.

**Meaning.**
- A `.riv` can be rendered deterministically inside our pipeline. Put a `<canvas>` in the composition and drive
  Rive from a paused GSAP timeline's `onUpdate`, replaying from t = 0 with fixed 1/30 s steps. That is safe for
  state machines too, and cheap for a 2–3 s sting.
- Vendor the WASM next to `gsap.min.js` and pin the npm version.
- Not tested: an actual `hyperframes render`, because video renders need the owner's go-ahead. HyperFrames has a
  built-in Lottie adapter (`window.__hfLottie`) but **none for Rive**, so the GSAP `onUpdate` bridge above is how
  it would plug in.
- No headless issues showed up with either package under SwiftShader. Prefer `webgl2` if the file uses
  feathering, `canvas` otherwise.

## 4. Where Rive is strong for MSP, and the alternatives for a logo sting

**Rive's sweet spot is interactive UI on the website and in the app**, not video:
- One small `.riv` with a state machine reacts to inputs and data in real time, with the same file and look on
  web, iOS, Android and Flutter.
- MSP candidates: the XP level-up / level ring (bind level and XP from the API to a view model), badge unlocks,
  streak flames, a puzzle-piece loader, empty states, a "PB beaten!" celebration, and a logo that reacts on hover.
- The web runtime costs about 640–730 KB of WASM (brotli) plus about 22 KB JS. `canvas-lite` is smaller.
- Lottie can't do interactive state + data binding as well, and GSAP/SVG does it only with hand-written app code.

| Option | Licence / cost | Fits the HyperFrames Reels | Can Claude author it end to end? | Notes |
|---|---|---|---|---|
| **SVG + GSAP in HyperFrames** (current) | GSAP free incl. MorphSVG/DrawSVG ([Webflow](https://webflow.com/blog/gsap-becomes-free)); HyperFrames Apache-2.0 | native, already byte-deterministic (DL2/DL4) | **yes**: rig script + timeline, QA with `qaInPage`, covers | Animates our own layers directly: hand sweep with fading trail, piece knobs snapping in, speed lines drawing on, logo + wordmark lockup. Same Rubik/tokens as the stills. Not reusable on the site without its own JS. |
| **Rive** | runtimes MIT; editor/CLI free with splash, $9/seat/mo Cadet to remove it; editor video export paid | works via the GSAP `onUpdate` bridge (tested above) | **partly**: RML via a CLI technical preview; no SVG import in the CLI; best quality needs a person in the editor | Strong for interactive web/app assets; overkill for a fixed video sting. |
| **Lottie** (lottie-web 5.13.0 MIT; dotLottie-web 0.81.0 MIT) | free runtimes; authoring via After Effects + Bodymovin, Figma plugins, LottieFiles Creator or Jitter (paid tiers) | **native HyperFrames adapter** | weakly: Lottie JSON is a verbose keyframe schema; python-lottie is AGPL | Good for embedding **pre-made** animations; on the web it is non-interactive (no data-bound state machines). |
| **Remotion** (+ `@remotion/rive`, `@remotion/lottie`) | free ≤ 3 people; company licence ≥ $100/mo total ([remotion.pro](https://www.remotion.pro/license)) | a second engine (React) | yes | No gain over HyperFrames for us. `@remotion/rive` is the officially suggested way to render `.riv` to video ([Rive docs](https://rive.app/docs/runtimes/react/rendering-to-a-bitmap)). |
| **Motion Canvas** | MIT | separate engine | yes (TypeScript) | Last stable release v3.17.2 (Dec 2024), only an alpha since; stalled. |
| **Jitter** | Free: 720p/30 fps with watermark; Pro and up: 1080p, no watermark ([pricing](https://jitter.video/pricing/)) | export MP4/Lottie, then embed | no (GUI only, no API) | Fast for a person; Figma import; not reproducible from code. |

## 5. Recommendation

**(a) Instagram Reel intro/outro now: SVG + GSAP in HyperFrames. Don't use Rive for this.**
- It reuses the pipeline that already passes QA and renders byte-identically.
- It costs nothing, and Claude can do the whole thing.
- It animates the real logo (no re-import losses, trail fades kept).
- It drops into every Reel as a shared module, like the house masthead.
- Rive would add a closed-source preview CLI or editor work, a splash/plan question and a WASM bridge, all to make a
  2–3 s fixed video that GSAP already does well.

**(b) MSP website later: Rive is the strongest candidate** for interactive, data-driven animation: XP level-up,
badges, loaders, a hover-reactive logo.
- Runtime licence MIT. The $9/seat/mo Cadet plan is needed to ship `.riv` files without the splash screen (one
  seat is enough).
- The same `.riv` can also appear in Reels through the tested bridge, so a website animation can be reused in
  video.

**Concrete next step (light, no heavy job).** Build a "logo sting" prototype in HyperFrames from the SVG layers:
1. **Rig** (`src/design/build-logo.ts` extension): split the logo into named groups by bounding box:
   - `hand-min`, `hand-hr`, `trails`, `dial`, `crown`, `buttons`, `piece-body`, `knobs`, `speed-lines`.
   - Turn the CSS classes into attributes and keep the gradient masks.
   - Output `assets/brand/speedpuzzling-logo-rig.svg`.
2. **Sting** (`lab/<next lab>/sting.ts`), as a 2.5 s intro and a 2 s outro at 1080×1920:
   - Piece body scales in with an overshoot, knobs pop in one by one, speed lines draw on from the left.
   - The minute hand sweeps 360° with its trail fading in, settles with a small "click", and the outlined logo plus
     "myspeedpuzzling.com" lock up in the house masthead position.
   - Variants for navy, coral and ocean grounds; the outro ends on the CTA.
   - Render 2–3 variants as a gallery for per-slide feedback (each render is about 5 s of HyperFrames work, so
     light; still ask before the video batch per the heavy-jobs rule).
3. **Optional Rive trial (later, website track):**
   - With the owner's OK, install the CLI and have Claude write the same sting in RML from the rig output.
   - Check `--screenshot` frames and whether an unsigned `--once` file plays without a splash in
     `@rive-app/webgl2`.
   - If the website wants interactive animations, the owner tries the editor on the Free plan (splash) before
     buying Cadet.

## Gaps

- An actual `hyperframes render` with a Rive canvas was not run (video render). Only the same seek path in
  Playwright was tested.
- It is unconfirmed whether unsigned CLI `.riv` files show the splash screen, how long the splash lasts, and
  whether the editor already exports with a splash on Free (the docs still say exports are paid).
- The Rive CLI was not installed. Its RML coverage of arbitrary bezier paths and gradients was read in docs only.
- LottieFiles Creator and Jitter Pro prices were not checked (the Jitter page showed no amounts).
- The Rive CLI's licence/EULA is not stated in its docs.

Test artefacts (local, outside the repo): scratch `rive/bench/run.mjs`, `page.html`, `out/results.json`.
Versions: `@rive-app/*-advanced` 2.44.0, Playwright 1.64.0, Chromium headless shell 156.0.8078.4, GSAP 3.15.0.
