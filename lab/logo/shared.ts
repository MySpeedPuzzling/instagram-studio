// LM1 · logo motion: shared pieces of every composition. The logo is the rig (src/design/logo-rig.ts) inlined with
// its white outline halo, so GSAP can move its parts and the halo follows them. Compositions are HyperFrames
// projects like the DL4 Reels (lab/dl4/reels/shared.ts: composition() is reused unchanged): HTML + a paused GSAP
// timeline on window.__timelines, Rubik with slashed-zero tabular figures, the house ground tokens.
//
// Rules every clip follows:
//   - The default DOM is the settled end state: helpers (mosaic, reveal halves, draw-on ring, case ring) are hidden in
//     the markup and only shown by the timeline. So the page without its timeline is the reference the last frame
//     must match pixel for pixel (render.ts checks it).
//   - Parts appear by motion (scale, position, draw-on, instant cuts), never by opacity fades: the halo is a
//     thresholded dilation, so a half-transparent part would sit on a full white silhouette.
//   - Whole-logo moves animate the HTML wrapper (#mark), never an SVG ancestor of the parts, so svgOrigin stays in
//     logo units.
import { join } from 'node:path';
import { buildRig, OUTLINE_PAD, rigInfo, VIEWBOX, type RigInfo } from '../../src/design/logo-rig.ts';
import { type Ground } from '../../src/design/house.ts';
import { FRAMES } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';

export { composition, f1, rng } from '../dl4/reels/shared.ts';

export const W = 1080, H = 1920, FPS = 30;
/** Reel safe area (text must stay inside): x 60–960, y 220–1250. */
export const SAFE = FRAMES.reel.safe;
export const RIG: RigInfo = rigInfo();
/** Dial centre as a GSAP svgOrigin (logo units). */
export const DIAL_ORIGIN = `${RIG.dial.cx} ${RIG.dial.cy}`;
/** Centre of the whole mark's bbox (logo units): what the layout centres. */
export const MARK_C = { x: VIEWBOX.w / 2, y: VIEWBOX.h / 2 };
/** The logo's navy (outline, hands, ticks). */
export const INK = '#2C3679';

/** Files every composition loads. */
export const ASSETS: Record<string, string> = {
  'assets/rubik.ttf': join(ROOT, 'assets/fonts/rubik/Rubik[wght].ttf'),
  'assets/gsap.min.js': join(ROOT, 'node_modules/gsap/dist/gsap.min.js'),
};

export type Layout = 'reel' | 'splash';
/** Logo placement: centre of the mark's bbox (px) and its width (px, without the outline). */
export const PLACE = {
  /** Intros (Reel and app splash): centred in the frame, 640 px wide (x 220–860, y 677–1243). */
  center: { cx: 540, cy: 960, width: 640 },
  /** Outro lockup: the logo above the domain line, 520 px wide (y ≈ 440–900). */
  lockup: { cx: 540, cy: 670, width: 520 },
} as const;

export interface Clip {
  /** Unique key, e.g. "intro-snap" or "splash-snap-coral". */
  key: string;
  /** Gallery direction: L1 intros (navy), L2 outros (navy), L3 app splash cuts. */
  dir: 'L1' | 'L2' | 'L3';
  label: string;
  duration: number;
  /** Second at which the logo (and text) are fully settled; the rest is the hold. */
  settleAt: number;
  /** Timeline seconds for QA and for the key-beat frame checks. */
  qaAt: number[];
  ground: Ground;
  html: string;
}

/** px per logo unit for a placement width. */
export const scaleOf = (width: number) => width / VIEWBOX.w;

/**
 * The inline rig with its halo, absolutely positioned so the mark's bbox centre sits at (cx, cy) and the mark is
 * `width` px wide. `insert` adds helper markup inside #logo (so the halo outlines it too): at the start (under
 * everything), before the watch (over the piece) or at the end (over everything). `defs` adds clip paths etc.
 */
export function logoSvg(o: { cx: number; cy: number; width: number; id?: string; defs?: string; insert?: { start?: string; beforeWatch?: string; end?: string } }): string {
  const s = scaleOf(o.width);
  const pad = OUTLINE_PAD;
  const left = o.cx - (MARK_C.x + pad) * s, top = o.cy - (MARK_C.y + pad) * s;
  const w = (VIEWBOX.w + 2 * pad) * s, h = (VIEWBOX.h + 2 * pad) * s;
  let svg = buildRig({ inline: true, outline: true, rootAttrs: `class="logo-svg" width="${w.toFixed(2)}" height="${h.toFixed(2)}" aria-hidden="true"` });
  svg = svg.replace(/<!--[\s\S]*?-->\n?/, '');
  if (o.defs) svg = svg.replace('</defs>', `${o.defs}</defs>`);
  if (o.insert?.start) svg = svg.replace('<g id="logo">', `<g id="logo">${o.insert.start}`);
  if (o.insert?.beforeWatch) svg = svg.replace('<g id="watch-back"', `${o.insert.beforeWatch}<g id="watch-back"`);
  if (o.insert?.end) svg = svg.replace(/<\/g>\s*<\/svg>\s*$/, `${o.insert.end}</g>\n</svg>`);
  return `<div id="${o.id ?? 'mark'}" class="mark" style="left:${left.toFixed(2)}px; top:${top.toFixed(2)}px; width:${w.toFixed(2)}px; height:${h.toFixed(2)}px">${svg}</div>`;
}

/** CSS every clip uses. */
export const LOGO_CSS = `
.mark { position: absolute; transform-origin: 50% 50%; }
.mark svg { display: block; overflow: visible; }
.lock-text { position: absolute; left: 60px; width: 900px; text-align: center; white-space: nowrap; }
.domain { font-size: 72px; font-weight: 700; line-height: 1; letter-spacing: -0.01em; color: var(--g-ink); }
.handle { font-size: 44px; font-weight: 600; line-height: 1; letter-spacing: 0.005em; color: var(--g-accent); }
`;

// ------------------------------------------------------------------ timeline snippets (strings of GSAP calls on `tl`)

const j = JSON.stringify;
const sel = (ids: string[]) => j(ids.map(i => (i.startsWith('#') || i.startsWith('.') ? i : `#${i}`)).join(', '));

/** Hides parts at t = 0 (autoAlpha: CSS visibility beats the helpers' visibility attribute). */
export const hideAt = (ids: string[], at = 0) => `tl.set(${sel(ids)}, { autoAlpha: 0 }, ${at});`;
export const showAt = (ids: string[], at: number) => `tl.set(${sel(ids)}, { autoAlpha: 1 }, ${at});`;

/** Swaps the settled compound outline for its motion helpers (band + dial ring) or back. */
export const outlineSplit = (at: number) => `${hideAt(['outline'], at)} ${showAt(['silhouette', 'dial-ring'], at)}`;
export const outlineJoin = (at: number) => `${showAt(['outline'], at)} ${hideAt(['silhouette', 'dial-ring'], at)}`;

/** Inverse of GSAP's inOut eases (power n), so trail cuts land exactly when the hand passes. */
function inverseInOut(f: number, power: number): number {
  const k = 2 ** (power - 1);
  return f < 0.5 ? (f / k) ** (1 / power) : 1 - ((1 - f) / k) ** (1 / power);
}

/**
 * The minute hand sweeps clockwise from `from`° to 360° (12 o'clock) with a power-n inOut ease; every trail ghost
 * appears (instant cut, at its own faintness) at the moment the hand passes its angle, so the hand leaves its trail
 * behind. With `hourFrom` the hour hand moves to its rest angle over the same time (a full lap = one hour = 30°).
 */
export function sweep(o: { at: number; dur: number; from: number; power?: number; hourFrom?: number }): string {
  const power = o.power ?? 2;
  const ease = `power${power}.inOut`;
  const out = [hideAt(['trails'], 0), `tl.set('#trails', { autoAlpha: 1 }, ${o.at});`];
  for (const t of RIG.trails) out.push(hideAt([t.id], 0));
  out.push(`tl.fromTo('#hand-minute', { rotation: ${o.from} }, { rotation: 360, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${o.dur}, ease: '${ease}', immediateRender: false }, ${o.at});`);
  out.push(`tl.set('#hand-minute', { rotation: ${o.from}, svgOrigin: ${j(DIAL_ORIGIN)} }, 0);`);
  for (const t of RIG.trails) {
    if (t.deg <= o.from) { out.push(showAt([t.id], o.at)); continue; }
    const f = (t.deg - o.from) / (360 - o.from);
    out.push(showAt([t.id], +(o.at + inverseInOut(f, power) * o.dur).toFixed(3)));
  }
  out.push(`tl.set('#hand-minute', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, ${+(o.at + o.dur).toFixed(3)});`);
  if (o.hourFrom !== undefined) {
    out.push(`tl.set('#hand-hour', { rotation: ${o.hourFrom - RIG.handHourDeg}, svgOrigin: ${j(DIAL_ORIGIN)} }, 0);`);
    out.push(`tl.fromTo('#hand-hour', { rotation: ${o.hourFrom - RIG.handHourDeg} }, { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${o.dur}, ease: '${ease}', immediateRender: false }, ${o.at});`);
  }
  return out.join('\n');
}

/** Rotates the hand and its trails together by a full lap (the tail follows the hand); ends where it started. */
export function lapWithTail(at: number, dur: number, power = 2): string {
  return `tl.fromTo('#hand-minute, #trails', { rotation: 0 }, { rotation: 360, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${dur}, ease: 'power${power}.inOut', immediateRender: false }, ${at});
tl.set('#hand-minute, #trails', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, ${+(at + dur).toFixed(3)});`;
}

/** Speed lines shoot out leftwards from the piece (scaleX from each line's right end), top to bottom with a stagger. */
export function speedLinesIn(at: number, dur = 0.26, each = 0.035, order: number[] = [2, 1, 3, 0, 4]): string {
  const out: string[] = [];
  order.forEach((k, n) => {
    const l = RIG.speedLines[k];
    const origin = `${l.box.x1.toFixed(1)} ${((l.box.y0 + l.box.y1) / 2).toFixed(1)}`;
    out.push(`tl.set('#${l.id}', { scaleX: 0, svgOrigin: '${origin}' }, 0);`);
    out.push(`tl.fromTo('#${l.id}', { scaleX: 0 }, { scaleX: 1, svgOrigin: '${origin}', duration: ${dur}, ease: 'power3.out', immediateRender: false }, ${+(at + n * each).toFixed(3)});`);
  });
  return out.join('\n');
}

/** Generic scale-in of rig parts about the dial centre (or another svgOrigin), with an instant show at the start. */
export function scaleIn(ids: string[], o: { at: number; dur: number; from: number; ease?: string; origin?: string }): string {
  const origin = j(o.origin ?? DIAL_ORIGIN);
  return `${hideAt(ids, 0)}
tl.set(${sel(ids)}, { autoAlpha: 1, scale: ${o.from}, svgOrigin: ${origin} }, ${o.at});
tl.fromTo(${sel(ids)}, { scale: ${o.from} }, { scale: 1, svgOrigin: ${origin}, duration: ${o.dur}, ease: '${o.ease ?? 'power3.out'}', immediateRender: false }, ${o.at});`;
}

/** The domain line and handle of the outro lockup, centred under the logo (default: settled, visible). */
export function lockupText(o: { domainTop: number; handleTop?: number; typed?: boolean }): string {
  const domain = o.typed
    ? [...'myspeedpuzzling.com'].map((ch, i) => `<span class="ch" id="ch${i}">${ch}</span>`).join('')
    : 'myspeedpuzzling.com';
  return `<p class="lock-text domain" id="domain" style="top:${o.domainTop}px">${domain}</p>
${o.handleTop !== undefined ? `<p class="lock-text handle" id="handle" style="top:${o.handleTop}px">@myspeedpuzzling</p>` : ''}`;
}
