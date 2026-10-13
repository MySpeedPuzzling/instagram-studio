// Shared shell for the F4 Reels: every Reel is one self-contained HyperFrames composition (HTML + a paused GSAP
// timeline registered on window.__timelines). Assets are referenced by relative paths, so the same index.html
// renders in HyperFrames (project root = the reel folder) and in the repo's Playwright QA server
// (/var/render/reels/<post>/index.html).
import { join } from 'node:path';
import { escapeHtml as h } from '../../../src/design/page.ts';
import { FRAMES } from '../../../src/render/render.ts';
import { ROOT } from '../../../src/render/server.ts';
import { singlePiece } from '../../../src/design/svg.ts';
import type { Content as Dl1 } from '../../dl1/content.ts';
import type { Content as Dl2 } from '../content.ts';

export const W = 1080, H = 1920, FPS = 30;
/** Reel safe area (text must stay inside): x 60–960, y 220–1250. */
export const SAFE = FRAMES.reel.safe;
export const X0 = SAFE.x0, X1 = SAFE.x1, CW = X1 - X0;

export interface ReelContext {
  dl1: Dl1;
  dl2: Dl2;
  /** Local 1200 px box images (puzzle_large) by puzzle id, fetched for the boxes a Reel shows. */
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
  'assets/tokens.css': join(ROOT, 'assets/design/tokens.css'),
  'assets/gsap.min.js': join(ROOT, 'node_modules/gsap/dist/gsap.min.js'),
};

const BASE_CSS = `
@font-face { font-family: 'Rubik'; src: url('assets/rubik.ttf') format('truetype'); font-weight: 300 900; font-style: normal; font-display: block; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--paper); }
body { font-family: 'Rubik', sans-serif; font-variant-numeric: tabular-nums lining-nums; color: var(--ink);
  -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; font-kerning: normal; }
#root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--paper); isolation: isolate; }
h1, h2, h3, p, figure, ol, ul { margin: 0; padding: 0; }
svg { display: block; overflow: visible; }
.abs { position: absolute; }
.kick { position: absolute; left: ${X0}px; top: 228px; height: 64px; display: flex; align-items: center; gap: 20px; }
.kick svg { width: 54px; height: 54px; }
.kick span { font-size: 36px; font-weight: 500; color: var(--ink-soft); letter-spacing: 0.2px; }
.src { position: absolute; left: ${X0}px; top: 1206px; font-size: 30px; line-height: 36px; color: var(--ink-muted); }
`;

/** The house device: one correct interior jigsaw piece in coral (same generator as the stills). */
export function devicePiece(fill = 'var(--coral-500)', seed = 5): string {
  const p = singlePiece(60, seed);
  return `<svg viewBox="${p.viewBox}" aria-hidden="true"><path d="${p.d}" fill="${fill}"/></svg>`;
}

export function kicker(text: string): string {
  return `<div class="kick" id="kick">${devicePiece()}<span>${h(text)}</span></div>`;
}

export const sourceLine = (text: string) => `<p class="src" id="src">${h(text)}</p>`;

/**
 * A complete HyperFrames composition. `script` adds tweens to `tl` (a paused GSAP timeline) and may read
 * `DATA`; the timeline is registered under the composition id only after the build, as HyperFrames requires.
 */
export function composition(o: { id: string; title: string; duration: number; css: string; body: string; data?: unknown; script: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${h(o.title)}</title>
<link rel="stylesheet" href="assets/tokens.css">
<style>${BASE_CSS}
${o.css}
</style>
<script src="assets/gsap.min.js"></script>
</head>
<body>
<div id="root" data-composition-id="${o.id}" data-start="0" data-duration="${o.duration}" data-fps="${FPS}" data-width="${W}" data-height="${H}">
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

export const f1 = (v: number) => Math.round(v * 10) / 10;
