# DL2 · F4 Reels (HyperFrames)

Three short vertical videos rendered from code with [HyperFrames](https://github.com/heygen-com/hyperframes)
(HTML + GSAP → MP4) to test it as MSP's motion engine on this Mac (M3 Max, 36 GB). Silent for now: no music and
no SFX, with every word burned in.

| Post | Length | What happens |
|---|---|---|
| `wall-reel` | 12 s, 360 frames | Hook "When do most 500s finish?" on an empty axis. Bars build (0.25–3.6 s). 55–59 min turn coral and "58 minutes" replaces the question (4.3 s). The wall drops at 60:00, the bars behind it flinch, and "−7.3% at the hour" lands (6.1 s). Then "Which side of the wall is your PB?", and it unwinds to the opening frame for a seamless loop. |
| `sep-reel` | 12 s, 360 frames | September's 5 most-solved puzzles as a countdown on an implied 120 BPM grid. Box lids flip in and land on the beat (0.5 / 2.0 / 3.5 / 5.0 s). The rank badge rolls like an odometer and pulses on the off-beats, and a 5-piece strip assembles. #1 lands last (6.5 s) with a coral ring and a solver count-up. Each box shows its credit (puzzle · brand) exactly while it is on screen. Uses the 1200 px `puzzle_large` box images. |
| `counter-reel` | 8 s, 240 frames | 274,399,467 pieces counting up while a 9×10 full-bleed jigsaw from `src/pieces/jigsaw.ts` assembles under the number. The coral centre piece snaps in last as the counter settles (4.6 s). Then the puzzle lifts apart and the counter rewinds for the loop. |

All text stays inside the Reel safe area (x 60–960, y 220–1250, `FRAMES.reel`). Only `counter-reel` puts graphics
in the band below it.

## Render

```sh
node lab/dl2/reels/render.ts                     # all three, one at a time
node lab/dl2/reels/render.ts sep-reel            # one Reel
node lab/dl2/reels/render.ts wall-reel --twice   # render twice and compare hashes → content/labs/DL2/F4/determinism.json
node lab/dl2/reels/render.ts --qa-only           # build + lint + QA + covers, no video (≈1 s per Reel)
```

Per Reel, `render.ts`:

1. Writes a self-contained HyperFrames project to `var/render/reels/<post>/`: `index.html` plus a local Rubik font,
   `tokens.css`, the pinned `gsap.min.js` and any box images.
2. Runs `hyperframes lint`.
3. Runs a QA pass in Playwright. It seeks the GSAP timeline to sample times, runs the repo's `qaInPage` (safe area,
   ≥ 30 px type, contrast, overlaps, tabular figures) and captures the cover frame losslessly.
4. Runs `hyperframes render` with 1 worker, software GPU and CRF 8.
5. Normalises with ffmpeg: H.264 High, yuv420p, 30 fps, 10 Mbps VBR target capped at 12 Mbps, closed 2 s GOP,
   silent AAC 48 kHz stereo, `+faststart`, metadata stripped.
6. Checks the result with ffprobe (codec, size, fps, duration, ≤ 300 MB, ≤ 25 Mbps, AAC present, moov before mdat).

Steps 4–6 are wrapped in `metered()` → `content/labs/DL2/runs.jsonl`. Outputs go to
`content/labs/DL2/F4/<post>/<post>.mp4`, plus the cover `<post>.jpg` (sRGB, q93 4:4:4) and `<post>.ig.jpg`. The
script then writes `content/labs/DL2/F4/manifest.json` and rebuilds the DL2 gallery.

The compositions are TS builders (`wall-reel.ts`, `sep-reel.ts`, `counter-reel.ts`) that inject live data into one
HTML composition each (`shared.ts` holds the shell). The generated `index.html` is the HyperFrames composition.

**Setup and safety.**
- `hyperframes@0.8.152` (npm `gitHead` = the reviewed commit `e8eb358`) and `gsap@3.15.0` are exact devDependencies,
  installed with `--ignore-scripts`. Only esbuild has an install script, and its platform binary comes through
  optionalDependencies.
- HyperFrames' docs load GSAP from jsDelivr. Here it is vendored, so renders make no network requests.
- `render.ts` always sets `HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`, `HYPERFRAMES_NO_UPDATE_CHECK=1` and
  `HYPERFRAMES_SKIP_SKILLS=1`.
- `HYPERFRAMES_BROWSER_PATH` points at Playwright's cached `chrome-headless-shell` (Chrome for Testing 156, the
  build the stills use). The script refuses to run if that binary is missing, so HyperFrames never downloads a browser.
- Never run `hyperframes usage | publish | cloud | skills | open`.

## Measured (13 Oct 2026, runs.jsonl)

Machine state during the runs: memory pressure 1–2 (normal/warn), 44–49 % free, swap steady at 3.36 GB, Docker
running, other DL2 agents active.

| Post | HyperFrames render | Capture per frame | HF peak RSS (Chrome + node) | Whole-run peak | Normalise | Final MP4 |
|---|---|---|---|---|---|---|
| wall-reel | 15.6 s / 16.2 s | 39 ms | 1.38 / 1.30 GB | 1.60 GB | 5.5 s | 1.9 MB, 1.2 Mbps |
| sep-reel | 24.2 s / 25.5 s | 63 ms | 1.34 / 1.30 GB | 1.46 GB | 28.9 s | 14.8 MB, 9.9 Mbps |
| counter-reel | 14.6 s / 15.2 s | 55 ms | 1.41 / 1.41 GB | 1.61 GB | 12.6 s | 8.1 MB, 8.1 Mbps |

The two numbers per cell are the first render and the `--twice` repeat. The whole-run peak is the `metered()`
process tree, including ffmpeg. QA plus the cover take 0.4–0.9 s per Reel. The first HyperFrames compile on a cold
cache took 5.1 s; later compiles take 0.1–0.2 s.

## Determinism (render twice, compare hashes)

- **HyperFrames output: byte-identical** for all three Reels. Two independent renders gave the same `raw.mp4` SHA-256,
  and the same `framemd5` for every decoded frame (360/360, 360/360, 240/240). That holds with Chrome pinned to the
  Playwright headless shell, the software GPU (`--no-browser-gpu`, SwiftShader) and 1 worker. HyperFrames' own docs
  only promise cross-machine reproducibility under `--docker`; that wasn't tested.
- **Final upload file: byte-identical too, but only with `-threads 1` in x264.** x264 VBV rate control
  (`-maxrate`/`-bufsize`) with frame threads gave different bytes on every run (measured: two runs, two hashes).
  ABR without VBV, or VBV on one thread, was repeatable. Single-threaded costs 5–29 s per Reel instead of 2–10 s;
  drop `-threads 1` if speed matters more than byte-reproducible uploads.
- **Cover vs video:** the Playwright cover matches the video's frame at `coverAt` at 44.0 dB PSNR. That is the same
  PSNR as the CRF 8 intermediate, so the Instagram encode adds no measurable loss. The remainder is 4:2:0 chroma on
  coral edges.

## What worked and what didn't on Apple Silicon

**Worked**
- The CLI, `doctor`, `lint` and `render` all ran first time, with no Docker, cloud or account.
- The env browser override is respected by `render`.
- Plain HTML/CSS/SVG plus a paused GSAP timeline is all a composition needs:
  - 3D card flips (`perspective`, `rotationY`), SVG piece transforms and `onUpdate` count-ups all render correctly
    under HyperFrames' seek-driven capture.
  - The HyperFrames GSAP adapter seeks with `totalTime(t)` and then does a silent re-render.
  - The same `index.html` also seeks correctly in plain Playwright, which is what the QA and cover pass uses.
- `lint` is useful:
  - It found `fromTo` calls without a stable baseline. This was a false alarm caused by an `...off` spread it can't
    resolve; writing `immediateRender: false` explicitly cleared it.
  - It found tweens touching at one timestamp.
- Static-frame dedup reuses unchanged frames. About 20 % were reused in the smoke test.

**Limits and gotchas**
- **Capture is screenshot-based on macOS.** `HeadlessExperimental.beginFrame` is Linux-only, so capture runs at
  40–63 ms per 1080×1920 frame. The `--experimental-fast-capture` path (drawElementImage) needs the hardware GPU
  and wasn't tried, because the software GPU is what gave byte-identical output.
- **GSAP isn't bundled.** The docs and templates use jsDelivr; here GSAP is vendored as a pinned devDependency.
- **Undershoot on flat graphics.** x264 ABR hits its quantiser floor long before 10 Mbps, so `wall-reel` comes out
  at 1.2 Mbps. Quality is at maximum (see PSNR above); the photographic `sep-reel` uses 9.9 Mbps.
- **Output extras.** Renders carry `hyperframes_renderer`/`hyperframes_version` MP4 tags (normalise strips them).
  The CLI prints a promo line for the HyperFrames desktop app.
- **Not an encode bug.** ffmpeg's default PNG decode of limited-range video shows white as 253. Browsers decode it
  to 255.

**Verdict:** HyperFrames is usable as the motion engine here. It is fast enough for 2D Reels (15–25 s per 12 s Reel,
about 1.4 GB peak), deterministic with the settings above, and it shares tokens, Rubik and the piece generator with
the stills without a port. The fallback was not needed.

## Fallback (if HyperFrames ever becomes unusable)

The compositions don't depend on the HyperFrames runtime: every visibility change is a GSAP opacity tween, and there
are no `class="clip"` timing attributes. So plain Playwright frame capture plus ffmpeg renders the same frames:

```js
for (let f = 0; f < duration * 30; f++) {
  await page.evaluate(t => { const tl = window.__timelines[id]; tl.pause(); tl.totalTime(t, false); }, f / 30);
  await page.screenshot({ path: `frames/${String(f).padStart(5, '0')}.png` });
}
// ffmpeg -framerate 30 -i frames/%05d.png -c:v libx264 -crf 8 -pix_fmt yuv420p raw.mp4, then the same normalise()
```

`render.ts` already does exactly this seek for QA and covers. Rendering about 360 PNGs would take a similar time
(the capture is the same screenshot path).

## Known issues and decisions for the owner

- **Gallery videos on iPhone.** The review server (`src/render/server.ts`) answers without HTTP Range support. Desktop
  Chrome plays the gallery videos; iOS Safari needs 206 range responses, so expect them not to play over
  `tools/review.ts --lan` until the server handles `Range`.
- **Empty band in the feed crop.** The Reel safe area is top-biased (text ends at y 1250 of 1920). In the 4:5 feed crop
  (y 285–1635), `wall-reel` and `sep-reel` show about 385 px of empty white under the content. `counter-reel` fills
  that band with full-bleed pieces (graphics only); the other two could do the same.
- **Audio.** The silent AAC track is there only because the API spec and the research lint expect an audio stream.
  Music or SFX would be a separate decision.
