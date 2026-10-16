// DL4 Reels: the HyperFrames shell in the house style. Every Reel is one self-contained composition (HTML + a paused
// GSAP timeline on window.__timelines) on the variant's ground, with the house tokens (groundVars on :root),
// HOUSE_CSS, Rubik with tabular slashed-zero figures, the house device and the outlined logo. Assets use relative
// paths, so one index.html renders in HyperFrames (project root = the reel folder) and in the repo's Playwright QA
// server (/var/render/reels-dl4/<H#>/<reel>/index.html).
//
// Layout (1080×1920): text only inside the Reel safe area (x 60–960, y 220–1250, FRAMES.reel); everything below is
// graphics (bars from the bottom edge, piece floors, the ring), so the frame reads full in the 9:16 player, the 4:5
// feed crop (y 285–1635) and the 3:4 profile grid crop (y 240–1680).
import { join } from 'node:path';
import {
  GROUNDS, HOUSE_CSS, groundVars, pieceMark, pieceStrip, posterTopPath, seriesOf, type Ground, type Variant,
} from '../../../src/design/house.ts';
import { escapeHtml as h } from '../../../src/design/page.ts';
import { FRAMES } from '../../../src/render/render.ts';
import { ROOT } from '../../../src/render/server.ts';
import type { Content } from '../content.ts';

export const W = 1080, H = 1920, FPS = 30;
/** Reel safe area (text must stay inside): x 60–960, y 220–1250. */
export const SAFE = FRAMES.reel.safe;
/** Text column: the house left margin, the Reel safe right edge (Instagram's buttons sit right of 960). */
export const X0 = 88, X1 = SAFE.x1, CW = X1 - X0;
/**
 * Masthead rows: device + kicker + logo (296–368), source line (376–412), rule (428); content starts at 460. The
 * whole masthead sits below y 285, so the 4:5 feed crop (y 285–1635) never cuts it.
 */
export const HEAD = { top: 296, src: 376, rule: 428, content: 460 } as const;

export const f1 = (v: number) => Math.round(v * 10) / 10;

export interface ReelContext {
  c: Content;
  v: Variant;
  /** Local 1200 px box images (puzzle_large) by puzzle id, for the boxes a Reel shows. */
  largeBoxes: Map<string, string>;
}

export interface Reel {
  key: string;
  label: string;
  caption: string;
  /** Seconds; becomes the root data-duration. */
  duration: number;
  /** Timeline second whose frame becomes the cover JPEG. */
  coverAt: number;
  /** Timeline seconds at which the QA lint runs. */
  qaAt: number[];
  html: string;
  /** Extra files copied into the project: published path (relative to the reel folder) → absolute source. */
  assets: Record<string, string>;
}

/** Files every composition loads. */
export const BASE_ASSETS: Record<string, string> = {
  'assets/rubik.ttf': join(ROOT, 'assets/fonts/rubik/Rubik[wght].ttf'),
  'assets/logo.svg': join(ROOT, 'assets/brand/speedpuzzling-logo-outline.svg'),
  // The H2 poster's masthead copy loads its own file (HyperFrames lints two identical <img> entries as a media risk).
  'assets/logo-poster.svg': join(ROOT, 'assets/brand/speedpuzzling-logo-outline.svg'),
  'assets/gsap.min.js': join(ROOT, 'node_modules/gsap/dist/gsap.min.js'),
};

/** The grounds a Reel uses in a variant: its own ground, and H2's bold poster ground for the hero beat. */
export function looks(v: Variant, key: string): { base: Ground; bold: Ground | null } {
  const series = seriesOf(key);
  const base = GROUNDS[v.ground({ role: 'reel', series, post: key, slide: 1, of: 1 })];
  const bold = v.cover === 'poster' ? GROUNDS[v.ground({ role: 'fact', series, post: key, slide: 1, of: 1 })] : null;
  return { base, bold };
}

// ------------------------------------------------------------------ masthead and device

/**
 * The house device for a Reel. H1/H2: one generator piece. H3: a strip of `beats` interlocking pieces that fills in
 * beat by beat (like the carousel strip); the paths get ids `${prefix}${i}` so the timeline can set their state.
 */
export function device(v: Variant, beats: number, prefix: string): string {
  if (v.device !== 'strip') return pieceMark('var(--g-device)', 48);
  let i = 0;
  return pieceStrip(beats, beats, 40).replace(/<path /g, () => `<path id="${prefix}${i++}" `);
}

/** GSAP calls that put the H3 strip into beat `k` (1-based; 0 = all outlined) at time `at`. */
export function stripState(v: Variant, beats: number, prefix: string, k: number, at: number): string {
  if (v.device !== 'strip') return '';
  const out: string[] = [];
  for (let i = 0; i < beats; i++) {
    const now = i === k - 1, done = i < k - 1;
    const fill = now ? 'var(--g-device)' : done ? 'var(--g-ink)' : 'none';
    const stroke = now || done ? 'var(--g-bg)' : 'var(--g-ink)';
    out.push(`tl.set(${JSON.stringify(`[id="${prefix}${i}"]`)}, { attr: { fill: '${fill}', stroke: '${stroke}', 'stroke-width': ${now || done ? 2.5 : 3} } }, ${at});`);
  }
  return out.join('\n');
}

/** Masthead: device + kicker on the left, the outlined logo on the right, the source line under it, then a rule. */
export function masthead(o: { id: string; kicker: string; src: string; device: string }): string {
  return `<div class="r-mast" id="${o.id}">
  <header class="r-head">${o.device}<span class="h-kick">${h(o.kicker)}</span><img class="h-logo" src="assets/${o.id === 'mast' ? 'logo' : 'logo-poster'}.svg" alt="MySpeedPuzzling" style="height:84px; margin-left:auto"></header>
  <p class="h-src r-src">${h(o.src)}</p>
  <div class="h-rule" style="top:${HEAD.rule}px"></div>
</div>`;
}

// ------------------------------------------------------------------ H2 poster layer

/**
 * H2's bold moment: a top piece of the bold ground, cut by one real jigsaw seam (posterTopPath), that drops over the
 * frame and carries its own copy of the masthead plus the beat's text (on the bold ground's tokens, declared to QA
 * with data-qa-bg). Hidden (autoAlpha 0) whenever it is off screen, so QA never sees its text outside the frame.
 */
export function posterLayer(o: { bold: Ground; seam: number; mast: string; body: string }): string {
  return `<div class="r-poster" id="poster">
  <svg class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${posterTopPath(o.seam)}" fill="${o.bold.bg}"/></svg>
  <div class="r-full" id="poster-in" style="${groundVars(o.bold)}" data-qa-bg="${o.bold.bg}">${o.mast}${o.body}</div>
</div>`;
}

/**
 * Timeline calls: the poster drops in at `at` and lifts away at `out`. Its text fades in once the piece has landed
 * and fades out before it lifts, so no text ever slides outside the frame; the base text it covers (`baseSel`) is
 * hidden exactly while the poster's copy is visible (no double text for QA).
 */
export function posterMotion(seam: number, at: number, out: number, baseSel = '#mast'): string {
  const off = -(seam + 140);
  return `
tl.set('#poster', { autoAlpha: 1 }, ${at});
tl.fromTo('#poster', { y: ${off} }, { y: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, ${at});
tl.fromTo('#poster-in', { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out', immediateRender: false }, ${f1(at + 0.4)});
tl.set('${baseSel}', { autoAlpha: 0 }, ${f1(at + 0.4)});
tl.fromTo('#poster-in', { opacity: 1 }, { opacity: 0, duration: 0.15, ease: 'power1.in', immediateRender: false }, ${out});
tl.set('${baseSel}', { autoAlpha: 1 }, ${f1(out + 0.15)});
tl.fromTo('#poster', { y: 0 }, { y: ${off}, duration: 0.5, ease: 'power2.in', immediateRender: false }, ${f1(out + 0.1)});
tl.set('#poster', { autoAlpha: 0 }, ${f1(out + 0.61)});
`;
}

// ------------------------------------------------------------------ composition

const BASE_CSS = `
@font-face { font-family: 'Rubik'; src: url('assets/rubik.ttf') format('truetype'); font-weight: 300 900; font-style: normal; font-display: block; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: 'Rubik', sans-serif; color: var(--g-ink); -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; font-kerning: normal; }
#root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--g-bg); isolation: isolate; }
#root > .r-depth { position: absolute; inset: 0; background: var(--g-depth); }
h1, h2, h3, p, figure, ol, ul { margin: 0; padding: 0; }
svg { display: block; overflow: visible; }
.r-full { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
.r-head { position: absolute; left: ${X0}px; top: ${HEAD.top}px; width: ${CW}px; height: 72px; display: flex; align-items: center; gap: 20px; }
.r-src { position: absolute; left: ${X0}px; top: ${HEAD.src}px; width: ${CW}px; white-space: nowrap; }
.r-poster { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 5; visibility: hidden; opacity: 0; }
#poster-in { opacity: 0; }
.r-abs { position: absolute; left: ${X0}px; width: ${CW}px; }
`;

/**
 * A complete HyperFrames composition on `ground`. `script` adds tweens to `tl` (a paused GSAP timeline) and may read
 * `DATA`; the timeline is registered under the composition id after the build, as HyperFrames requires.
 */
export function composition(o: { id: string; title: string; duration: number; ground: Ground; css: string; body: string; data?: unknown; script: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${h(o.title)}</title>
<style>
:root { ${groundVars(o.ground)}; }
${BASE_CSS}
${HOUSE_CSS}
.h-title, .h-abs { width: ${CW}px; }
${o.css}
</style>
<script src="assets/gsap.min.js"></script>
</head>
<body>
<div id="root" data-composition-id="${o.id}" data-start="0" data-duration="${o.duration}" data-fps="${FPS}" data-width="${W}" data-height="${H}">
<div class="r-depth"></div>
${o.body}
</div>
<script>
const DATA = ${JSON.stringify(o.data ?? {})};
const tl = gsap.timeline({ paused: true });
${o.script}
window.__timelines = window.__timelines || {};
window.__timelines["${o.id}"] = tl;
</script>
</body>
</html>
`;
}

/** Deterministic PRNG (mulberry32) so scatters are identical on every render. */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
