# LM1 · logo motion: intro/outro animations of the MSP logo

The owner approved this on 2026-10-16: "let's try the logo animation for intro/outro (it can be used as a splash screen for the
mobile app); try a few variants". The approach follows `research_notes/MSP Instagram design and growth toolkit/rive_and_logo_motion.md`:
the real logo is rigged as SVG, animated with GSAP and rendered with HyperFrames. Rive is left for the app and website.

## The rig

`src/design/logo-rig.ts` (`node src/design/logo-rig.ts`) writes two files:

- `assets/brand/speedpuzzling-logo-rig.svg`: the brand mark with its 70 CorelDRAW elements grouped into named parts.
- `assets/brand/speedpuzzling-logo-rig-outline.svg`: the same rig with the white outline. The outline is a filtered `<use>` of
  the rig drawn under it, so it follows the parts while they move. It is a drop-in replacement for
  `speedpuzzling-logo-outline.svg`.

Changes from the source file:

- CSS classes became presentation attributes.
- The inherited gradient was resolved.
- All ten gradient opacity masks are kept.

| Part id | What |
|---|---|
| `piece` › `piece-fill`, `piece-knobs` | the coloured piece, plus the case silhouette and the knob shading |
| `speed-lines` › `speed-line-1…5` | top to bottom |
| `piece-tint` | the bottom knob's second shading layer (the lowest speed line ends between the two layers) |
| `watch-back` › `case`, `crown`, `buttons` › `button-left`, `button-right` | the white case disc with its shading, the crown, and the side buttons |
| `watch-face` › `dial` › `dial-face`, `dial-ring`*; `ticks` › `tick-1…12`; `hub`; `hand-minute`; `trails` › `trail-1…4`; `hand-hour` | the trails run newest to oldest (10:30, 9:00, 7:30, 6:00) |
| `outline`, `silhouette`* | the source's navy compound path: the band around the silhouette plus the dial ring |
| `piece-shine` | the two corner highlights |

\* `dial-ring` and `silhouette` are hidden helpers. Together they are the two halves of `outline`, used while the dial moves
without the piece.

`outline` stays one compound path. When it was split into two paths, Chromium anti-aliased its edges differently (560 px
changed at 1024 px). Parts that span the paint order share a class (`.piece`, `.watch`).

The rig exports `rigInfo()` for compositions. It holds the part boxes, the dial pivot (4278.44, 3461.66 in logo units), the
tick and trail angles, and the contours.

**Pixel check** (`node lab/logo/rig-check.ts`; exits 1 if the mark or the halo differs):

- **Rig vs source** at 1024 px: **0 differing pixels** in Chromium as `<img>`, 0 inline, and 0 in librsvg.
- **Outline variant, halo** (≥ 2 px from the mark): 0 px differ from the outline file. 51 px differ right at the mark's edge,
  because the old file runs the mark itself through the filter.
- **Outline variant, mark**: 0 px differ from the bare mark.

## The clips

All clips are 1080×1920 and silent. Each has a silent AAC track, like the Reels. Every clip ends on the settled outlined logo.
The times below are timeline seconds.

| Code | Clip | Length | Beats |
|---|---|---|---|
| L1-1 | **A · Snap** | 2.4 s | 0.06–0.86: nine generator pieces (3×3, clipped to the logo's silhouette, in the logo's gradient with ink seams) fly in and lock into the piece shape. 0.92–1.18: the stopwatch drops onto them (scale 1.4 → 1, accelerating). 1.18: impact; the seams close, the ink outline clicks on and the logo settles 2.5 %. 1.22–1.66: the hand sweeps 6 → 12, leaving its trail. 1.42–1.84: the speed lines shoot out. |
| L1-2 | **B · Race** | 2.2 s | 0.04–0.54: the logo races in from off-frame left, leaning (skew −14°), and brakes with one short overshoot (+24 px, skew +5°). 0.54–0.76: it settles. 0.30–0.72: the speed lines draw out behind it. 0.72–1.46: the minute hand runs a full lap and the hour hand moves one hour (1 → 2 o'clock); the trail ghosts appear as the hand passes. |
| L1-3 | **C · Tick** | 2.4 s | 0.08–0.45: the dial ring draws itself clockwise from 12. 0.36–0.60: the face fills from the centre. 0.45–0.86: the ticks pop in clockwise. 0.70: the hands appear (minute at 6). 0.82/0.94/1.06/1.18: the hand ticks 45° at a time to 12 and leaves a ghost at each stop. 1.30–1.58: the piece pops out from behind. 1.38–1.62: the crown and buttons grow out of the case. 1.50–1.92: the speed lines. |
| L1-4 | **D · Reveal** | 2.0 s | 0–0.26: the frame is two coral pieces with one real jigsaw cut (house `posterTopPath`). 0.26–0.78: they pull apart and uncover the logo (scale 1.1 → 1). 0.60–1.0: the speed lines. 0.90 and 1.04: the hand ticks 9 → 10:30 → 12 and leaves its two newest ghosts. |
| L1-5 | **E · Start** | 2.2 s | 0–0.24: a plain stopwatch (case ring helper) appears. 0.32–0.49: the crown is pressed (start). 0.40–1.12: the hand runs a lap and the hour hand moves one hour; the ghosts appear as it passes. 1.04–1.32: the piece snaps out from behind, and the stopwatch becomes the logo. 1.20–1.60: the speed lines. |
| L2-1 | **O1 · Lockup** | 2.0 s | It starts on the settled intro logo (centre, 640 px). 0.22–0.77: the logo rises and scales into the lockup (520 px, centre y 670). 0.18–0.98: the hand and its trail run a lap together. 0.60–1.02: myspeedpuzzling.com wipes in. 0.92–1.18: @myspeedpuzzling. |
| L2-2 | **O2 · Last lap** | 2.2 s | The logo sits in the lockup. 0.10–0.92: the hand and its trail run a last lap. 0.92–1.15: the piece clicks out (1.05) and back. 0.96–1.56: the domain types itself in, one letter per frame. 1.62–1.86: the handle appears. |
| L2-3 | **O3 · Arrive** | 2.0 s | 0.02–0.66: the logo races into the lockup and brakes (as in B). 0.24–0.64: the speed lines. 0.46–0.86: the domain slides in 36 px with a wipe. 0.56–1.02: the hand sweeps 6 → 12, leaving its trail. 0.74–0.98: the handle appears. |
| L3-1…8 | **Splash cuts**: E · Start and C · Tick on coral and on white-with-depth | 2.2 / 2.4 s | Each comes as the clip plus its final still (`<key>-final.png`, lossless 1080×1920). |

Typography: the outro text is Rubik with slashed-zero tabular figures. The domain is set in 72 px bold ink and the handle in
44 px semibold accent, all inside the Reel safe area (y 990–1144).

**App splash hold.** The splash should hold its last frame from the settle time onwards:

| Splash | Settles at | Frame | Then holds |
|---|---|---|---|
| Start | 1.60 s | 48 | the final PNG |
| Tick | 1.92 s | 58 | the final PNG |

**Port to app.** For the app, the chosen splash would be rebuilt in Rive (a state machine with an "app ready" input, so it
can hold or loop until loading finishes) or in Lottie (a fixed animation). Both can take the timings above and the rig's part
ids. LM1 delivers the MP4 and the final PNG only. The research note covers Rive plans and the splash-screen question.

## Round 2: modules that chain together

Owner, 16 Oct 2026: "try the background to be assembled from puzzle pieces before the logo arrives, or maybe some other
creative ideas too", then "I'd like the new creative ideas that we can then connect together". Durations follow
`research_notes/MSP Instagram design and growth toolkit/logo_motion_durations.md`.

**Everything meets on one hand-off frame**: the settled outlined logo, centred (540, 960), 640 px wide, on the ground (navy by
default). Every round-2 intro ends on it, and every outro and loop starts on it. So any intro, any content and any outro cut
together without a jump. `render.ts` checks that every hand-off moment in a clip equals that frame rendered alone, pixel for
pixel (all 0 px).

Code: `lab/logo/chain.ts`. Each module goes from one state to another (`table`, `ground`, `handoff`, `lockup`, `out`), and
`chain()` refuses a chain whose states don't line up. Every duration is a parameter: `name:seconds` retimes the whole module
proportionally.

| Module (alias) | States | Default | What happens |
|---|---|---|---|
| `rain` (F1) | table → ground | 1.30 s | the 9:16 ground rains in from the top as a real 6×11 generator jigsaw (diagonal wave) onto a darker table; seams fade |
| `converge` (F2) | table → ground | 1.05 s | the ground's pieces fly in, outer ring first; the pieces under the logo's spot lock last |
| `drop` (F2-arrival) | ground → handoff | 0.62 s | the whole logo drops into the spot (scale 1.5 → 1); the hand ticks twice into 12 |
| `start` (E-arrival) | ground → handoff | 1.38 s | the E · Start beat: stopwatch, crown press, a lap, the piece snaps out |
| `jigsaw` (H) | ground → handoff | 2.20 s | the outlined logo cut into a 5×4 jigsaw flies in and locks, the seams close, it resolves into the mark; hand + trail lap |
| `relay` (J) | ground → handoff | 1.74 s | coral, sky and indigo sweep across with a real jigsaw leading edge; the last runner, navy, carries the logo in; a lap |
| `sweep` (G) | table → handoff | 1.64 s | clock wipe: the dial sits on the table; its hand runs a lap and a radial edge wipes the ground in behind it |
| `idle` (loop) | handoff → handoff | 1.20 s | loading loop: hand + trail run one linear lap, the logo breathes 1.5 %; seamless |
| `idle-reduced` | handoff → handoff | 2.40 s | reduced motion: no rotation, no scale; the static logo breathes in opacity (1 → 0.55 → 1) |
| `sting` (reel-sting) | handoff → handoff | 0.60 s | loop-friendly Reel sting: a quick lap, the piece clicks at 12, back exactly to the start frame |
| `hold` | any | 0.50 s | nothing moves |
| `lockup` (O1-exit) | handoff → lockup | 1.20 s | the logo rises into the lockup, hand + trail lap, myspeedpuzzling.com wipes in, @myspeedpuzzling |
| `breakup` (P) | handoff → lockup | 1.96 s | lockup, then the ground cracks along its jigsaw seams and falls away, revealing ocean (`--reveal`) |
| `exit` (app-exit) | handoff → out | 0.30 s | splash exit: the logo snaps away and the ground falls away to the app's white (`--reveal`) |

Item syntax: `name[:seconds][@offset]`. A negative offset overlaps the previous module; for example, `drop@-0.24` lands the logo
as the last ground piece locks. An `exit` or `breakup` swaps the ground underneath the pieces at the crack, so the clip ends
on the reveal ground.

```sh
node lab/logo/render.ts --chain "converge drop@-0.24 hold:0.6 breakup"            # ad-hoc chain → gallery section L4
node lab/logo/render.ts --chain "F1 E-arrival hold:0.5 P" --key=my-chain --qa-only
node lab/logo/render.ts --chain "sting:0.5" --place=mast                           # on the Reel masthead logo
node lab/logo/render.ts --chain "converge:0.6 drop:0.36@-0.14" --ground=paper
```

### Round-2 clips (new codes; the round-1 codes are unchanged)

| Code | Clip | Chain | Length (to hand-off) |
|---|---|---|---|
| L1-6 | F1 · Rain | rain → start | 3.2 s (2.68) |
| L1-7 | F2 · Converge | converge → drop@-0.24 | 2.0 s (1.43) |
| L1-8 | G · Sweep | sweep | 2.2 s (1.64) |
| L1-9 | H · Jigsaw | jigsaw | 2.7 s (2.20) |
| L1-10 | J · Relay | relay | 2.3 s (1.74) |
| L2-4 | P · Break-up (starts on the hand-off frame) | breakup | 2.5 s (settled 1.96) |
| L3-9…12 | App overlay F2 · Converge, coral / white, clip + final still | converge → drop | 2.0 s (1.43) |
| L3-13…20 | **System-splash cuts ≈ 0.8 s**: F2 · Converge and E · Start, coral / white, clip + final still | converge:0.6 → drop:0.36@-0.14; start:0.8 | 1.4 / 1.3 s (0.82 / 0.80, then hold) |
| L4-1 | Loading loop | idle | 1.2 s, seamless |
| L4-2 | Loading loop, reduced motion | idle-reduced | 2.4 s, seamless |
| L4-3 | (c) Reel-end sting on the masthead logo, loops back to frame 0 | sting (place: mast) | 0.6 s, seamless |
| L4-4 | (a) App: ground ≤ 1 s → logo → loop × 2 → exit | converge:0.7 → drop:0.4@-0.16 → idle → idle → exit | 4.0 s (logo at 0.94, exit 3.34–3.64) |
| L4-5 | (b) Event / stream opener | relay → hold:0.6 → lockup | 4.1 s (lockup at 3.54) |
| L4-6 | Pinned brand Reel / long-form: ground in, logo, ground out (F → P mirror) | converge → drop → hold:0.6 → breakup | 4.5 s |

**How the durations follow the research:**

- **Android system splash ≤ 1,000 ms** (target 600–900 ms): the 0.8 s cuts (L3-13…20) settle at 0.80–0.82 s and then hold the
  final frame. The 1.4–2 s versions stay as the in-app overlay option.
- **Splash exit 200–300 ms**: `exit` defaults to 0.3 s.
- **Loading loop 1.0–1.5 s per lap**, constant speed: `idle` is 1.2 s, linear. The app shows it only after 500 ms, keeps it at
  least 500 ms, and switches to a message after 5–10 s. Those are app rules, not part of the clip.
- **Reduced motion**: `idle-reduced` (L4-2). The splash then shows the static final frame (the `-final.png` stills).
- **Reels**:
  - No logo intro.
  - By default no outro either.
  - The 0.6 s `sting` sits on the Reel's own last beat (masthead logo) and resolves back into frame 0.
  - The full lockup outros (O1–O3, P, L4-5/6) are for long Reels, the pinned brand Reel and event screens.

**Checks added in round 2:**

- **Hand-off frames**: every module boundary at the hand-off state, rendered in the chain, must equal the hand-off frame
  rendered alone. 0 px for all 18 clips.
- **Seamless loops**: the frame at a loop's end must equal the frame at its start. 0 px for every loop. The idle loop's wrap
  step (last frame → first) is 17,327 px against 17,422 px for an ordinary step, so there is no jump. The sting holds its
  last frame. The reduced loop changes less than one level per frame.

**Port to the Android system splash (AVD, not built yet):**

- **E · Start** (its 0.8 s cut, L3-15/19) is the easiest to port:
  - It needs only group transforms: scale about the dial pivot, the crown's translate, and the hands' rotation.
  - The trail ghosts appear as instant alpha changes, which an AVD can animate.
  - Its stopwatch-case helper is a gradient-filled circle.
- **C · Tick** is next. Its ring draw-on maps to `trimPathEnd`.
- The ground modules (F, G, J) and the jigsaw (H) can't be in the system splash. The AVD is only the icon, on a single opaque
  colour.
- **Whichever variant is ported**, a few things change:
  - The 10 gradient opacity masks (knob shading, corner shine, dial glass) must be baked into gradient fills with alpha stops.
    Note: the masks are not on the trails, which are plain alpha fills.
  - The white outline is a filter, so it can't be used. Pick a splash colour where the navy mark reads without it (white or
    coral), or draw the outline once as an offset path.
  - The depth gradient goes too: the background must be one flat colour (paper `#f3f6fa`, coral `#ec726f`).
- **Size**: the logo must sit inside the 192 dp circle on the 432 dp canvas. That makes the mark about 144 dp wide (its
  diagonal is 192 dp).

## Render

```sh
node src/design/logo-rig.ts                       # rebuild the rig files
node lab/logo/rig-check.ts [--out=DIR]            # rig vs source, pixel by pixel
node lab/logo/render.ts --qa-only [--snap=DIR]    # lint + QA + settled check + stills, no video (~0.3 s per clip)
node lab/logo/render.ts [keys…]                   # render (one at a time, 1 worker), then the manifests + gallery
node lab/logo/render.ts --gallery                 # manifests + gallery only
node lab/logo/render.ts --chain "<items>" [--key=…] [--ground=…] [--reveal=…] [--place=mast] [--qa-only]
```

**Code:**

- `lab/logo/shared.ts`: the inline rig with its halo, placements, and GSAP snippets (sweep, lap, speed lines, scale-in,
  outline split/join).
- `lab/logo/clips.ts`: the round-1 variants, the splash picks (`SPLASH_PICKS`), and the catalogue (`allClips()`, round 2
  appended).
- `lab/logo/chain.ts`: the round-2 modules, `chain()`, `plan()`, the hand-off frame, and the round-2 catalogue (`round2()`).
- `lab/logo/render.ts`: the renderer, adapted from `lab/dl4/reels/render.ts`. It has the same safety rules: telemetry off,
  Playwright's headless shell, and it never runs `hyperframes usage|publish|cloud|skills|open`.

**Rules the compositions follow** (see `shared.ts`):

- The default DOM is the settled end state. So the page without its timeline is the reference, and the last frame must match
  it exactly. This is the **settled check** in `render.ts`.
- Parts appear through motion, not opacity fades: the halo is a thresholded dilation, so a half-transparent part would sit on a
  full white silhouette.
- Whole-logo moves animate the HTML wrapper.
- Position-0 sets become `gsap.set`. HyperFrames lint flagged that a set at 0 doesn't render at frame 0, which would flash the
  logo.
- Rig transforms are cleared at the settle time. Identity matrices with 1e-5 residue made Chromium rasterise the mark
  differently, by up to Δ 72 on 65k px.

**Outputs:**

- Clips: `content/labs/LM1/<L#>/<key>/` (`.mp4`, cover `.jpg`/`.ig.jpg`, `-final.png`, `post.json`).
- Per-direction `manifest.json` files.
- The gallery: `content/labs/LM1/index.html`. It's linked as "Logo motion (LM1)" in the review app.

## Measured (16 Oct 2026, `content/labs/LM1/runs.jsonl`)

Machine and conditions:

- M3 Max, 36 GB.
- Docker off; the ComfyUI MCP bridge (node) idle.
- Memory pressure 1 (normal), 79–84 % free, swap steady at 1.40 GB.

Each run was one clip at a time, with 1 HyperFrames worker and the software GPU.

| | per clip |
|---|---|
| HyperFrames render | 4.8–6.7 s (capture 71–94 ms per frame; Snap is the slowest, nine clipped pieces under the halo filter) |
| HyperFrames peak RSS | 0.94–1.18 GB |
| Normalise (ffmpeg, 1 thread) | 2.0–3.4 s |
| Whole metered run (render + normalise + probe) | 7.0–10.2 s, process-tree peak 1.41–1.64 GB |
| Lint + QA + settled check + stills | 0.3–0.7 s |
| Final MP4 | 0.71–1.79 MB, 2.8–6.0 Mbps |

All 12 clips took 1 min 41 s end to end.

**Results:**

- **QA**: `qaInPage` found 0 errors and 0 warnings at 7–10 sample times per clip, and `hyperframes lint` is clean.
- **Settled check**: 0 differing pixels for all 12 clips.
- **Spec** (ffprobe): passes for all 12. H.264 High, yuv420p, 1080×1920, 30/1 fps, exact frame counts, AAC 48 kHz, moov before
  mdat. Each clip has one warning by design: a sting is shorter than the 3 s minimum for a standalone Reel, because it is
  joined to a Reel.
- **By eye**: I checked every 6th frame extracted from each MP4, plus the QA-time frames. Frame 0 never flashes the logo,
  nothing is clipped, and the halo follows the moving parts.

### Round 2 (16 Oct 2026, final renders)

The conditions were the same: Docker off, memory pressure 1, 83–85 % free, swap steady at 1.31 GB. There were 18 clips, one
at a time.

| | per clip |
|---|---|
| HyperFrames render | 2.5 s (the 0.6 s sting) to 8.7 s (the 4.5 s chain); 61–137 ms per frame |
| HyperFrames peak RSS | 0.61–1.64 GB |
| Normalise | 0.7–9.4 s |
| Whole metered run | 3.2–18.3 s, process-tree peak 1.15–2.19 GB |
| Final MP4 | 0.29–6.26 MB |

**Results:**

- **QA**: 0 errors and 0 warnings for all 18 clips (`hyperframes lint` included).
- **Settled check**: 0 px.
- **Hand-off and loop checks**: 0 px.
- **Spec**: passes for all 18. Chain lengths are rounded up to whole 0.1 s, so frame counts are exact.
- **By eye**: I checked every 5th frame of each MP4 and the QA frames.

