// LM1 · the logo intro/outro variants. Each builder returns one HyperFrames composition (see shared.ts for the rules:
// the default DOM is the settled end state, parts appear by motion, whole-logo moves animate the HTML wrapper).
//
// Intros (≈ 2–2.4 s, end on the settled outlined logo, centred):
//   snap   interlocking generator pieces fly in and lock into the logo's coloured piece; the stopwatch drops onto it,
//          the ink outline clicks on at impact; the hand sweeps 6 → 12 leaving its trail; speed lines shoot out.
//   race   the whole logo races in from the left, leaning forward, brakes with one short overshoot while the speed
//          lines draw out behind it; the minute hand does a full lap (the hour hand moves one hour) leaving its trail.
//   tick   minimal: the dial ring draws itself, face and ticks pop in clockwise, the hand ticks four times from 6 to 12
//          leaving a ghost at every stop, then the piece pops out from behind with crown and buttons.
//   reveal two halves of a frame-filling jigsaw (one real cut line, house posterTopPath) pull apart and uncover the
//          logo; the hand ticks twice into 12, speed lines shoot out.
//   start  a plain stopwatch; its crown is pressed, the hand runs one lap, and the piece snaps out from behind:
//          the stopwatch becomes the logo (reads as "go", made for an app launch).
// Outros (≈ 2–2.2 s, end on the outlined logo + myspeedpuzzling.com + @myspeedpuzzling):
//   lockup the settled logo rises into the lockup while its hand and trail run a lap; the domain wipes in, the
//          handle follows.
//   lap    the logo sits in the lockup; the hand and its trail run a last lap, the piece clicks (out and back in) as
//          the hand hits 12, and the domain types itself in.
//   arrive the logo races into the lockup and brakes (as race), the domain slides in behind it with a wipe.
import { GROUNDS, posterTopPath, type Ground, type GroundKey } from '../../src/design/house.ts';
import { generateJigsaw } from '../../src/pieces/jigsaw.ts';
import {
  composition, DIAL_ORIGIN, f1, H, hideAt, INK, LOGO_CSS, lapWithTail, lockupText, logoSvg, outlineJoin, outlineSplit, PLACE,
  RIG, rng, scaleIn, showAt, speedLinesIn, sweep, W, type Clip,
} from './shared.ts';

const j = JSON.stringify;
const PIECE_FILL = 'url(#lg21)';       // the piece's gradient in the rig (userSpaceOnUse, so any shape continues it)
const { cx: DCX, cy: DCY } = RIG.dial;
/** Band centre radius and width of the silhouette's round top, and of the dial ring (logo units). */
const CASE_R = DCY - RIG.parts.silhouette.box.y0;   // outer radius of the case outline (its round top)
const RING = { r: ((RIG.parts['dial-ring'].box.x1 - RIG.parts['dial-ring'].box.x0) / 2) - 100.25, w: 200.5 };

interface Opts { ground: GroundKey; dir: Clip['dir']; key: string; label: string }
type Builder = (o: Opts) => Clip;

/**
 * Wraps a clip's markup and timeline into a composition. Two fix-ups on the script:
 *   - position-0 sets become gsap.set calls (HyperFrames: a zero-duration set at 0 inside the paused timeline does
 *     not render while the playhead sits at 0, so frame 0 would flash the settled logo);
 *   - at settleAt every rig part's GSAP transform is cleared: an identity matrix with float residue (svgOrigin maths,
 *     1e-5 units) makes Chromium rasterise the mark and its halo differently (up to Δ 72 on edges), so the settled
 *     frames would not be the exact brand mark.
 */
function clip(o: Opts, c: { duration: number; settleAt: number; qaAt: number[]; css?: string; body: string; script: string }): Clip {
  const ground: Ground = GROUNDS[o.ground];
  const script = c.script.replace(/tl\.set\(([^;]*?), 0\);/g, 'gsap.set($1);')
    + `\ntl.set('#logo g, #logo path', { clearProps: 'transform' }, ${c.settleAt});`;
  c = { ...c, script };
  return {
    key: o.key, dir: o.dir, label: o.label, duration: c.duration, settleAt: c.settleAt, qaAt: c.qaAt, ground,
    html: composition({ id: o.key, title: `LM1 ${o.key}`, duration: c.duration, ground, css: LOGO_CSS + (c.css ?? ''), body: c.body, script: c.script }),
  };
}

// ------------------------------------------------------------------ intros

/** A · Snap: generator pieces lock into the logo's piece, the stopwatch drops onto it. */
export const snap: Builder = o => {
  const pf = RIG.parts['piece-fill'].box;
  const jig = generateJigsaw({ cols: 3, rows: 3, width: pf.x1 - pf.x0, height: pf.y1 - pf.y0, x: pf.x0, y: pf.y0, seed: 4, tabSize: 0.22, jitter: 0.04 });
  const rand = rng(11);
  const centre = jig.pieces.find(p => p.col === 1 && p.row === 1)!;
  const order = [...jig.pieces.filter(p => p !== centre).map(p => ({ p, k: rand() })).sort((a, b) => a.k - b.k).map(x => x.p), centre];
  const mz = order.map((p, i) => {
    const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
    const ang = p === centre ? -Math.PI / 2 + 0.3 : Math.atan2(pcy - DCY, pcx - DCX) + (rand() - 0.5) * 0.6;
    const dist = 8800 + rand() * 2200;
    return { id: `mz${i}`, d: p.d, dx: Math.round(Math.cos(ang) * dist), dy: Math.round(Math.sin(ang) * dist), rot: Math.round((rand() - 0.5) * 80) };
  });
  const mosaic = `<g id="mosaic" visibility="hidden">${mz.map(m => `<g id="${m.id}"><path d="${m.d}" fill="${PIECE_FILL}" stroke="${INK}" stroke-width="70" stroke-linejoin="round" clip-path="url(#mz-clip)"/></g>`).join('')}</g>`;
  const body = logoSvg({ ...PLACE.center, defs: `<clipPath id="mz-clip"><path d="${RIG.contours.silhouetteOuter}"/></clipPath>`, insert: { beforeWatch: mosaic } });

  const IMPACT = 1.18;
  const s: string[] = [
    hideAt(['piece', 'piece-tint', 'piece-shine', 'outline', '.watch']),
    showAt(['mosaic'], 0),
  ];
  mz.forEach((m, i) => {
    const at = f1(0.06 + i * 0.05);
    const dur = i === mz.length - 1 ? 0.4 : 0.36;
    s.push(`tl.set('#${m.id}', { autoAlpha: 0, x: ${m.dx}, y: ${m.dy}, rotation: ${m.rot}, transformOrigin: '50% 50%' }, 0);`);
    s.push(`tl.set('#${m.id}', { autoAlpha: 1 }, ${at});`);
    s.push(`tl.fromTo('#${m.id}', { x: ${m.dx}, y: ${m.dy}, rotation: ${m.rot} }, { x: 0, y: 0, rotation: 0, transformOrigin: '50% 50%', duration: ${dur}, ease: 'power3.out', immediateRender: false }, ${at});`);
  });
  // ≈ 0.88 s: the last piece is in; the stopwatch drops onto the mosaic (scale from 1.4, accelerating) and lands at IMPACT.
  s.push(outlineSplit(0), hideAt(['silhouette'], 0));
  s.push(`tl.set('.watch', { autoAlpha: 1, scale: 1.4, svgOrigin: ${j(DIAL_ORIGIN)} }, ${IMPACT - 0.26});`);
  s.push(`tl.fromTo('.watch', { scale: 1.4 }, { scale: 1, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.26, ease: 'power2.in', immediateRender: false }, ${IMPACT - 0.26});`);
  // Impact: the seams close (mosaic → the real piece), the ink outline clicks on, the logo settles by 2.5 %.
  s.push(hideAt(['mosaic'], IMPACT), showAt(['piece', 'piece-tint', 'piece-shine'], IMPACT), outlineJoin(IMPACT));
  s.push(`tl.fromTo('#mark', { scale: 0.975 }, { scale: 1, duration: 0.16, ease: 'power2.out', immediateRender: false }, ${IMPACT});`);
  s.push(sweep({ at: IMPACT + 0.04, dur: 0.44, from: 180, power: 2 }));
  s.push(speedLinesIn(1.42));
  const settleAt = 1.84;
  return clip(o, { duration: 2.4, settleAt, qaAt: [0, 0.3, 0.6, 0.95, 1.1, 1.2, 1.4, 1.6, settleAt, 2.38], body, script: s.join('\n') });
};

/** B · Race: the logo races in from the left, brakes, the hand runs a lap. */
export const race: Builder = o => {
  const body = logoSvg({ ...PLACE.center });
  const s = [
    `tl.set('#mark', { x: -1000, skewX: -14 }, 0);`,
    `tl.fromTo('#mark', { x: -1000, skewX: -14 }, { x: 24, skewX: 5, duration: 0.5, ease: 'power3.out', immediateRender: false }, 0.04);`,
    `tl.to('#mark', { x: 0, skewX: 0, duration: 0.22, ease: 'power2.inOut' }, 0.54);`,
    speedLinesIn(0.3, 0.3, 0.03),
    sweep({ at: 0.72, dur: 0.74, from: 0, power: 3, hourFrom: 30 }),
  ];
  const settleAt = 1.46;
  return clip(o, { duration: 2.2, settleAt, qaAt: [0, 0.2, 0.4, 0.55, 0.75, 1.0, 1.2, settleAt, 2.18], body, script: s.join('\n') });
};

/** C · Tick: the dial draws itself, the hand ticks to 12 leaving ghosts, the piece pops out behind. */
export const tick: Builder = o => {
  const ring = `<circle id="ring-draw" cx="${DCX}" cy="${DCY}" r="${RING.r}" fill="none" stroke="${INK}" stroke-width="${RING.w}" pathLength="1" stroke-dasharray="1 1" transform="rotate(-90 ${DCX} ${DCY})" visibility="hidden"/>`;
  const body = logoSvg({ ...PLACE.center, insert: { end: ring } });
  const crown = RIG.parts.crown.box, bl = RIG.parts['button-left'].box, br = RIG.parts['button-right'].box;
  const s: string[] = [
    hideAt(['piece', 'piece-tint', 'piece-shine', 'outline', 'case', 'crown', 'buttons', 'dial-face', 'ticks', 'hub', 'hand-minute', 'hand-hour']),
    // 0.08–0.45 s: the dial ring draws itself clockwise from 12.
    `tl.set('#ring-draw', { autoAlpha: 1, attr: { 'stroke-dashoffset': 1 } }, 0.08);`,
    `tl.fromTo('#ring-draw', { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.37, ease: 'power2.inOut', immediateRender: false }, 0.08);`,
    // 0.36 s: the face fills from the centre; 0.45 s on: ticks pop in clockwise.
    scaleIn(['case', 'dial-face'], { at: 0.36, dur: 0.24, from: 0.5 }),
    showAt(['ticks'], 0.45),
  ];
  RIG.ticks.map(t => t.hour % 12).sort((a, b) => a - b).forEach((h, n) => {
    const id = `tick-${h || 12}`;
    s.push(`tl.set('#${id}', { scale: 0, transformOrigin: '50% 50%' }, 0);`);
    s.push(`tl.fromTo('#${id}', { scale: 0 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.16, ease: 'power3.out', immediateRender: false }, ${f1(0.45 + n * 0.022)});`);
  });
  // 0.70 s: hub and hands appear, the minute hand at 6; it ticks four times into 12, leaving a ghost at each stop.
  s.push(showAt(['hub', 'hand-minute', 'hand-hour'], 0.7), hideAt(['trails'], 0), showAt(['trails'], 0.7));
  s.push(`tl.set('#hand-minute', { rotation: 180, svgOrigin: ${j(DIAL_ORIGIN)} }, 0);`);
  const stops = [180, 225, 270, 315, 360];
  for (const t of RIG.trails) s.push(hideAt([t.id], 0));
  for (let k = 1; k < stops.length; k++) {
    const at = +(0.82 + (k - 1) * 0.12).toFixed(2);
    s.push(`tl.fromTo('#hand-minute', { rotation: ${stops[k - 1]} }, { rotation: ${stops[k]}, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.08, ease: 'power4.out', immediateRender: false }, ${at});`);
    s.push(showAt([RIG.trails.find(t => t.deg === stops[k - 1])!.id], at));
  }
  s.push(`tl.set('#hand-minute', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, 1.3);`);
  // 1.30 s: the piece pops out from behind the watch; crown and buttons grow out of the case.
  s.push(scaleIn(['piece', 'piece-tint'], { at: 1.3, dur: 0.28, from: 0.55 }));
  s.push(scaleIn(['crown'], { at: 1.38, dur: 0.22, from: 0.2, origin: `${DCX} ${crown.y1.toFixed(1)}` }));
  s.push(scaleIn(['button-left'], { at: 1.42, dur: 0.2, from: 0.2, origin: `${bl.x1.toFixed(1)} ${bl.y1.toFixed(1)}` }));
  s.push(scaleIn(['button-right'], { at: 1.42, dur: 0.2, from: 0.2, origin: `${br.x0.toFixed(1)} ${br.y1.toFixed(1)}` }));
  s.push(showAt(['buttons'], 1.42));
  s.push(outlineJoin(1.62), hideAt(['ring-draw'], 1.62), showAt(['piece-shine'], 1.62));
  s.push(speedLinesIn(1.5));
  const settleAt = 1.92;
  return clip(o, { duration: 2.4, settleAt, qaAt: [0, 0.25, 0.5, 0.75, 0.9, 1.1, 1.4, 1.6, settleAt, 2.38], body, script: s.join('\n') });
};

/** D · Reveal: a frame-filling two-piece jigsaw (one real cut) pulls apart and uncovers the logo. */
export const reveal: Builder = o => {
  const g = GROUNDS[o.ground];
  const seam = 960;
  const top = posterTopPath(seam);
  const bottom = top.replace(/^M -4 -4 H (\S+) V/, `M -4 ${H + 4} H $1 V`);
  const halves = `<svg id="halves" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true" visibility="hidden" style="z-index:3">
  <path id="half-top" d="${top}" fill="${g.device}"/><path id="half-bottom" d="${bottom}" fill="${g.device}"/></svg>`;
  const body = logoSvg({ ...PLACE.center }) + halves;
  const s = [
    showAt(['halves'], 0),
    `tl.set('#half-top', { y: -5 }, 0); tl.set('#half-bottom', { y: 5 }, 0);`,
    hideAt(['mark'], 0), showAt(['mark'], 0.26),
    `tl.fromTo('#half-top', { y: -5 }, { y: -1120, duration: 0.52, ease: 'power4.inOut', immediateRender: false }, 0.26);`,
    `tl.fromTo('#half-bottom', { y: 5 }, { y: 1120, duration: 0.52, ease: 'power4.inOut', immediateRender: false }, 0.26);`,
    hideAt(['halves'], 0.8),
    `tl.set('#mark', { scale: 1.1 }, 0);`,
    `tl.fromTo('#mark', { scale: 1.1 }, { scale: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }, 0.26);`,
    speedLinesIn(0.6),
    // The hand ticks twice into 12 (from 9), leaving its two newest ghosts.
    `tl.set('#hand-minute', { rotation: 270, svgOrigin: ${j(DIAL_ORIGIN)} }, 0);`,
    hideAt(['trail-1', 'trail-2'], 0),
    `tl.fromTo('#hand-minute', { rotation: 270 }, { rotation: 315, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.08, ease: 'power4.out', immediateRender: false }, 0.9);`,
    showAt(['trail-2'], 0.9),
    `tl.fromTo('#hand-minute', { rotation: 315 }, { rotation: 360, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.08, ease: 'power4.out', immediateRender: false }, 1.04);`,
    showAt(['trail-1'], 1.04),
    `tl.set('#hand-minute', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, 1.12);`,
  ];
  const settleAt = 1.12;
  return clip(o, { duration: 2.0, settleAt, qaAt: [0, 0.3, 0.45, 0.6, 0.8, 0.95, settleAt, 1.98], body, script: s.join('\n') });
};

/** E · Start: a plain stopwatch, the crown is pressed, the hand runs a lap, the piece snaps out: the logo. */
export const start: Builder = o => {
  const caseRing = `<circle id="case-ring" cx="${DCX}" cy="${DCY}" r="${(CASE_R - 100).toFixed(2)}" fill="${PIECE_FILL}" stroke="${INK}" stroke-width="200" visibility="hidden"/>`;
  const body = logoSvg({ ...PLACE.center, insert: { beforeWatch: caseRing } });
  const s = [
    hideAt(['piece', 'piece-tint', 'piece-shine', 'outline']),
    showAt(['case-ring', 'dial-ring'], 0),
    `tl.set('.watch, #case-ring', { scale: 0.86, svgOrigin: ${j(DIAL_ORIGIN)} }, 0);`,
    `tl.fromTo('.watch, #case-ring', { scale: 0.86 }, { scale: 1, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.24, ease: 'power3.out', immediateRender: false }, 0);`,
    // 0.32 s: the crown is pressed (start).
    `tl.fromTo('#crown', { y: 0 }, { y: 120, duration: 0.05, ease: 'power2.in', immediateRender: false }, 0.32);`,
    `tl.fromTo('#crown', { y: 120 }, { y: 0, duration: 0.12, ease: 'power2.out', immediateRender: false }, 0.37);`,
    sweep({ at: 0.4, dur: 0.72, from: 0, power: 3, hourFrom: 30 }),
    // 1.04 s: the piece snaps out from behind the watch.
    scaleIn(['piece', 'piece-tint'], { at: 1.04, dur: 0.28, from: 0.6 }),
    outlineJoin(1.32), hideAt(['case-ring'], 1.32), showAt(['piece-shine'], 1.32),
    speedLinesIn(1.2),
  ];
  const settleAt = 1.6;
  return clip(o, { duration: 2.2, settleAt, qaAt: [0, 0.1, 0.34, 0.6, 0.9, 1.1, 1.3, settleAt, 2.18], body, script: s.join('\n') });
};

// ------------------------------------------------------------------ outros (lockup: logo above the domain line)

const LOCK = { domainTop: 990, handleTop: 1102 };
/** The CSS offset that puts the lockup logo where the intros leave it (centre, 640 px). */
const FROM_CENTRE = { y: PLACE.center.cy - PLACE.lockup.cy, scale: +(PLACE.center.width / PLACE.lockup.width).toFixed(4) };

/** O1 · Lockup: the settled logo rises into the lockup, hand + trail run a lap, the domain wipes in. */
export const lockup: Builder = o => {
  const body = logoSvg({ ...PLACE.lockup }) + lockupText({ ...LOCK });
  const s = [
    `tl.set('#mark', { y: ${FROM_CENTRE.y}, scale: ${FROM_CENTRE.scale} }, 0);`,
    `tl.fromTo('#mark', { y: ${FROM_CENTRE.y}, scale: ${FROM_CENTRE.scale} }, { y: 0, scale: 1, duration: 0.55, ease: 'power3.inOut', immediateRender: false }, 0.22);`,
    lapWithTail(0.18, 0.8, 2),
    `tl.set('#domain', { clipPath: 'inset(0% 100% 0% 0%)' }, 0);`,
    `tl.fromTo('#domain', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, ease: 'power3.out', immediateRender: false }, 0.6);`,
    `tl.set('#domain', { clipPath: 'none' }, 1.02);`,
    `tl.set('#handle', { autoAlpha: 0, y: 16 }, 0);`,
    `tl.fromTo('#handle', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.26, ease: 'power2.out', immediateRender: false }, 0.92);`,
  ];
  const settleAt = 1.18;
  return clip(o, { duration: 2.0, settleAt, qaAt: [0, 0.3, 0.55, 0.8, 1.0, settleAt, 1.98], body, script: s.join('\n') });
};

/** O2 · Lap: a last lap of hand + trail, the piece clicks out and back in at 12, the domain types itself in. */
export const lap: Builder = o => {
  const body = logoSvg({ ...PLACE.lockup }) + lockupText({ ...LOCK, typed: true });
  const CLICK = 0.92;
  const s = [
    lapWithTail(0.1, 0.82, 3),
    outlineSplit(CLICK),
    `tl.fromTo('.piece, #silhouette', { scale: 1 }, { scale: 1.05, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.07, ease: 'power2.out', immediateRender: false }, ${CLICK});`,
    `tl.to('.piece, #silhouette', { scale: 1, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.16, ease: 'power3.out' }, ${f1(CLICK + 0.07)});`,
    outlineJoin(f1(CLICK + 0.24)),
  ];
  const chars = [...'myspeedpuzzling.com'];
  chars.forEach((_, i) => { s.push(hideAt([`ch${i}`], 0), showAt([`ch${i}`], +(CLICK + 0.04 + i / 30).toFixed(3))); });
  const typedAt = +(CLICK + 0.04 + (chars.length - 1) / 30).toFixed(3);
  s.push(`tl.set('#handle', { autoAlpha: 0, y: 16 }, 0);`);
  s.push(`tl.fromTo('#handle', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out', immediateRender: false }, ${f1(typedAt + 0.06)});`);
  const settleAt = +(typedAt + 0.3).toFixed(2);
  return clip(o, { duration: 2.2, settleAt, qaAt: [0, 0.4, 0.8, 0.95, 1.1, 1.3, 1.5, settleAt, 2.18], body, script: s.join('\n') });
};

/** O3 · Arrive: the logo races into the lockup and brakes; the domain slides in behind it with a wipe. */
export const arrive: Builder = o => {
  const body = logoSvg({ ...PLACE.lockup }) + lockupText({ ...LOCK });
  const s = [
    `tl.set('#mark', { x: -900, skewX: -14 }, 0);`,
    `tl.fromTo('#mark', { x: -900, skewX: -14 }, { x: 20, skewX: 5, duration: 0.44, ease: 'power3.out', immediateRender: false }, 0.02);`,
    `tl.to('#mark', { x: 0, skewX: 0, duration: 0.2, ease: 'power2.inOut' }, 0.46);`,
    speedLinesIn(0.24, 0.28, 0.03),
    `tl.set('#domain', { x: -36, clipPath: 'inset(0% 100% 0% 0%)' }, 0);`,
    `tl.fromTo('#domain', { x: -36, clipPath: 'inset(0% 100% 0% 0%)' }, { x: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power4.out', immediateRender: false }, 0.46);`,
    `tl.set('#domain', { clipPath: 'none' }, 0.86);`,
    `tl.set('#handle', { autoAlpha: 0, y: 16 }, 0);`,
    `tl.fromTo('#handle', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out', immediateRender: false }, 0.74);`,
    sweep({ at: 0.56, dur: 0.46, from: 180, power: 2 }),
  ];
  const settleAt = 1.02;
  return clip(o, { duration: 2.0, settleAt, qaAt: [0, 0.2, 0.4, 0.6, 0.8, settleAt, 1.98], body, script: s.join('\n') });
};

// ------------------------------------------------------------------ the catalogue

export const INTROS = { snap, race, tick, reveal, start } as const;
export const OUTROS = { lockup, lap, arrive } as const;
/** The two intros cut as app splash screens on coral and paper (picked after the navy renders; see README). */
export const SPLASH_PICKS: Array<keyof typeof INTROS> = ['start', 'tick'];

const NAME: Record<string, string> = {
  snap: 'A · Snap', race: 'B · Race', tick: 'C · Tick', reveal: 'D · Reveal', start: 'E · Start',
  lockup: 'O1 · Lockup', lap: 'O2 · Last lap', arrive: 'O3 · Arrive',
};

export function allClips(): Clip[] {
  const out: Clip[] = [];
  for (const [k, b] of Object.entries(INTROS)) out.push(b({ ground: 'navy', dir: 'L1', key: `intro-${k}`, label: `Intro ${NAME[k]} (navy)` }));
  for (const [k, b] of Object.entries(OUTROS)) out.push(b({ ground: 'navy', dir: 'L2', key: `outro-${k}`, label: `Outro ${NAME[k]} (navy)` }));
  for (const k of SPLASH_PICKS) for (const g of ['coral', 'paper'] as const) {
    out.push(INTROS[k]({ ground: g, dir: 'L3', key: `splash-${k}-${g}`, label: `App splash ${NAME[k]} (${g === 'paper' ? 'white with depth' : g})` }));
  }
  return out;
}

