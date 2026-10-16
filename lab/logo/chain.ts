// LM1 round 2 · logo motion modules that chain together (owner 2026-10-16: "try the background to be assembled from
// puzzle pieces before the logo arrives" and "I'd like the new creative ideas that we can then connect together").
//
// Every module goes from one state to another, and every state is a shared frame, so any chain of modules whose
// states line up cuts together seamlessly:
//   table    the dark "table" the ground assembles on (a darker shade of the ground), no logo
//   ground   the flat brand ground (navy by default), no logo
//   handoff  THE hand-off frame: the settled outlined logo, centred (540, 960), 640 px wide, on the ground; every
//            intro ends here, every outro and the idle loop start here (verified pixel-exact by render.ts)
//   lockup   the logo in the outro lockup (CSS-scaled from the hand-off logo) + myspeedpuzzling.com + @myspeedpuzzling
//   out      the logo gone, the ground broken away to the "reveal" ground (the app behind the splash)
//
// Modules (name, aliases, states, default duration; every duration is a parameter: `name:seconds` retimes the whole
// module proportionally):
//   rain      F1          table → ground    1.30 s  the ground rains in from the top as a 6×11 jigsaw, seams fade
//   converge  F2          table → ground    1.05 s  the ground flies in, outer ring first, the logo's spot last
//   drop      F2-arrival  ground → handoff  0.62 s  the whole logo drops into the spot; the hand ticks twice into 12
//   start     E-arrival   ground → handoff  1.38 s  stopwatch, crown press, a lap, the piece snaps out (E · Start)
//   jigsaw    H           ground → handoff  2.20 s  the logo cut into a 5×4 jigsaw flies in, locks, resolves; a lap
//   relay     J           ground → handoff  1.74 s  coral, sky, indigo sweep across with a jigsaw edge; navy carries the logo in
//   sweep     G           table → handoff   1.64 s  clock wipe: the dial's hand runs a lap and wipes the ground in
//   idle      loop        handoff → handoff 1.20 s  loading loop: the hand + trail run a lap, the logo breathes 1.5 %; seamless
//   hold                  any → same        0.50 s  nothing moves
//   lockup    O1-exit     handoff → lockup  1.20 s  the logo rises into the lockup, hand + trail lap, the domain wipes in
//   breakup   P           handoff → lockup  1.96 s  lockup, then the ground cracks along its seams and falls away (reveal: ocean)
//   exit      app-exit    handoff → out     1.00 s  the logo snaps away and the ground falls away to the app (reveal: paper)
//
//   chain({ key, dir, label, items: ['converge', 'drop@-0.24', 'hold:0.6', 'breakup'], ground: 'navy', reveal: 'ocean' })
//   item syntax: name[:seconds][@offset]  (offset < 0 overlaps the previous module, e.g. the drop lands as the last
//   ground piece locks)
//
//   node lab/logo/render.ts --chain "converge drop@-0.24 hold:0.6 breakup" [--ground=navy] [--reveal=ocean] [--place=mast]
//                           [--key=chain-x] [--qa-only]     (renders an ad-hoc chain into the L4 gallery section)
import { GROUNDS, groundVars, type Ground, type GroundKey } from '../../src/design/house.ts';
import { OUTLINE_PAD, RIG_OUTLINE_FILE, VIEWBOX } from '../../src/design/logo-rig.ts';
import { generateJigsaw, type Piece } from '../../src/pieces/jigsaw.ts';
import { clip } from './clips.ts';
import {
  composition, DIAL_ORIGIN, f1, H, hideAt, LOGO_CSS, lapWithTail, lockupText, logoSvg, MARK_C, outlineJoin, outlineSplit, PLACE, RIG,
  rng, scaleIn, scaleOf, showAt, speedLinesIn, sweep, W, type Clip,
} from './shared.ts';

const j = JSON.stringify;
const r1 = (v: number) => Math.round(v * 10) / 10;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

export type State = 'table' | 'ground' | 'handoff' | 'lockup' | 'out';
type Layer = 'gp' | 'wipe' | 'relay' | 'lj' | 'caseRing' | 'text';

/** The table the ground assembles on: a darker (on light grounds: rule-coloured) shade of the ground. */
const TABLE: Partial<Record<GroundKey, string>> = { navy: '#151a24', coral: '#b9504d', paper: '#c3cad8', ocean: '#033f6f', sky: '#4d97e2', indigo: '#3d42a8' };

interface Ctx {
  t0: number;
  /** Module time (at the default duration) → chain time, scaled to the requested duration. */
  at: (v: number) => number;
  /** Scale factor (requested / default duration) for tween durations. */
  k: number;
  g: Ground; gk: GroundKey; reveal: Ground;
}
interface ModuleDef {
  /** dur: the default duration (s); unit: the length the beats below are designed at (default = dur). */
  from: State | 'any'; to: State | 'same'; dur: number; unit?: number; uses?: Layer[];
  /** Builds the module's GSAP calls in chain time. */
  build: (c: Ctx) => string;
}

// ------------------------------------------------------------------ shared layers

/** The ground's CSS depth gradient as an SVG userSpaceOnUse gradient over the 1080×1920 frame. */
export function depthGradient(id: string, g: Ground): string {
  const m = g.depth.match(/linear-gradient\(\s*([\d.]+)deg\s*,(.*)\)$/);
  if (!m) throw new Error(`unexpected depth gradient: ${g.depth}`);
  const a = Number(m[1]) * Math.PI / 180;
  const dx = Math.sin(a), dy = -Math.cos(a);
  const L = Math.abs(W * Math.sin(a)) + Math.abs(H * Math.cos(a));
  const [x1, y1, x2, y2] = [W / 2 - dx * L / 2, H / 2 - dy * L / 2, W / 2 + dx * L / 2, H / 2 + dy * L / 2].map(r1);
  const stops = [...m[2].matchAll(/(#[0-9a-f]{6})\s+([\d.]+)%/gi)].map(s => `<stop offset="${Number(s[2]) / 100}" stop-color="${s[1]}"/>`).join('');
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
}

/** One real full-bleed 6×11 jigsaw over the frame, shared by every ground module (assembly and break-up). */
const GP = generateJigsaw({ cols: 6, rows: 11, width: W, height: H, seed: 37, tabSize: 0.22, jitter: 0.035 }).pieces;
const centreOf = (p: Piece) => ({ x: p.bbox.x + p.bbox.width / 2, y: p.bbox.y + p.bbox.height / 2 });

function gpLayer(g: Ground, gk: GroundKey): string {
  return `<svg id="gp" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true" visibility="hidden">
<defs>${depthGradient('gp-g', g)}</defs>
<rect id="gp-t" x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="${TABLE[gk] ?? '#151a24'}"/>
<g id="gp-p" fill="url(#gp-g)" stroke="${g.rule}" stroke-width="3" stroke-linejoin="round" stroke-opacity="0">${GP.map((p, i) => `<path id="gp${i}" d="${p.d}"/>`).join('')}</g>
</svg>`;
}

type Fly = [number, number, number, number, number];   // [piece index, start, dx, dy, rotation]
/** Pieces `#<prefix><i>` fly in from (dx, dy, rot) and lock; one data line + a loop (keeps the composition short). */
const flyIn = (prefix: string, items: Fly[], dur: number, ease: string, t0: number) =>
  `${j(items)}.forEach(([i, at, dx, dy, rot]) => { const el = '#${prefix}' + i;
  tl.set(el, { autoAlpha: 0, x: dx, y: dy, rotation: rot, transformOrigin: '50% 50%' }, ${t0});
  tl.set(el, { autoAlpha: 1 }, at);
  tl.fromTo(el, { x: dx, y: dy, rotation: rot }, { x: 0, y: 0, rotation: 0, transformOrigin: '50% 50%', duration: ${dur}, ease: '${ease}', immediateRender: false }, at); });`;
const flyOut = (prefix: string, items: Fly[], dur: number, ease: string) =>
  `${j(items)}.forEach(([i, at, dx, dy, rot]) => { tl.fromTo('#${prefix}' + i, { x: 0, y: 0, rotation: 0 }, { x: dx, y: dy, rotation: rot, transformOrigin: '50% 50%', duration: ${dur}, ease: '${ease}', immediateRender: false }, at); });`;

/** The ground's CSS variables as GSAP vars (the chain swaps #root's ground under the pieces at a crack). */
const groundSet = (g: Ground) => `{ ${groundVars(g).split(';').map(kv => { const [k, v] = kv.split(/:(.*)/s); return `${j(k)}: ${j(v)}`; }).join(', ')} }`;

/**
 * Lockup: the hand-off logo (native 640 px) is CSS-scaled into the lockup through two CSS variables on #lock-pos
 * (`transform: translate(0, var(--ly)) scale(var(--ls))`). A chain that ends in the lockup has the lockup values inline
 * (the default DOM is the end state); the chain starts them at 0 px / 1, an exact identity, so the hand-off frame is
 * unchanged (a matrix and its inverse on nested wrappers was not exact: 4384 px off). GSAP tweens the variables only.
 */
const LOCK = { y: PLACE.lockup.cy - PLACE.center.cy, scale: PLACE.lockup.width / PLACE.center.width, domainTop: 990, handleTop: 1102 };
const LOCK_VARS = `{ '--ly': '${LOCK.y}px', '--ls': ${LOCK.scale} }`;

// ------------------------------------------------------------------ modules

const MODULES: Record<string, ModuleDef> = {
  rain: {
    from: 'table', to: 'ground', dur: 1.3, uses: ['gp'],
    build: c => {
      const rand = rng(5);
      const fly: Fly[] = GP.map((p, i) => [i, c.at(0.04 + p.row * 0.058 + p.col * 0.02 + rand() * 0.03),
        Math.round((rand() - 0.5) * 60), -Math.round(p.bbox.y + p.bbox.height + 40 + rand() * 120), Math.round((rand() - 0.5) * 36)]);
      const done = c.at(1.12);
      return [
        showAt(['gp', 'gp-t'], c.t0), `tl.set('#gp-p', { attr: { stroke: '${c.g.rule}', 'stroke-opacity': 1 } }, ${c.t0});`,
        flyIn('gp', fly, r3(0.36 * c.k), 'power2.in', c.t0),
        `tl.fromTo('#gp-p', { attr: { 'stroke-opacity': 1 } }, { attr: { 'stroke-opacity': 0 }, duration: ${r3(0.16 * c.k)}, ease: 'power1.out', immediateRender: false }, ${done});`,
        hideAt(['gp', 'gp-t'], c.at(1.3)),
      ].join('\n');
    },
  },
  converge: {
    from: 'table', to: 'ground', dur: 1.05, uses: ['gp'],
    build: c => {
      const rand = rng(9);
      const C = { x: PLACE.center.cx, y: PLACE.center.cy };
      const order = GP.map((p, i) => ({ p, i, d: Math.hypot(centreOf(p).x - C.x, (centreOf(p).y - C.y) * 0.62) + rand() * 40 })).sort((a, b) => b.d - a.d);
      const fly: Fly[] = order.map(({ p, i }, n) => {
        const cc = centreOf(p);
        const ang = Math.atan2(cc.y - C.y, cc.x - C.x) + (rand() - 0.5) * 0.5;
        const dist = 700 + rand() * 300;
        return [i, c.at(0.03 + (n / (order.length - 1)) * 0.62), Math.round(Math.cos(ang) * dist), Math.round(Math.sin(ang) * dist), Math.round((rand() - 0.5) * 120)];
      });
      const locked = c.at(1.05);
      return [
        showAt(['gp', 'gp-t'], c.t0), `tl.set('#gp-p', { attr: { stroke: '${c.g.rule}', 'stroke-opacity': 1 } }, ${c.t0});`,
        flyIn('gp', fly, r3(0.4 * c.k), 'power3.out', c.t0),
        `tl.fromTo('#gp-p', { attr: { 'stroke-opacity': 1 } }, { attr: { 'stroke-opacity': 0 }, duration: ${r3(0.16 * c.k)}, ease: 'power1.out', immediateRender: false }, ${locked});`,
        hideAt(['gp', 'gp-t'], r3(locked + 0.18 * c.k)),
      ].join('\n');
    },
  },
  drop: {
    from: 'ground', to: 'handoff', dur: 0.62,
    build: c => {
      const t1 = c.at(0.4), t2 = c.at(0.54);
      return [
        showAt(['mark'], c.t0), `tl.set('#mark', { scale: 1.5 }, ${c.t0});`,
        // One keyframed tween (two back-to-back tweens trip HyperFrames' overlap lint on float rounding).
        `tl.to('#mark', { keyframes: [{ scale: 0.975, duration: ${r3(0.24 * c.k)}, ease: 'power2.in' }, { scale: 1, duration: ${r3(0.16 * c.k)}, ease: 'power2.out' }] }, ${c.t0});`,
        `tl.set('#hand-minute', { rotation: 270, svgOrigin: ${j(DIAL_ORIGIN)} }, ${c.t0});`, hideAt(['trail-1', 'trail-2'], c.t0),
        `tl.fromTo('#hand-minute', { rotation: 270 }, { rotation: 315, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${r3(0.08 * c.k)}, ease: 'power4.out', immediateRender: false }, ${t1});`, showAt(['trail-2'], t1),
        `tl.fromTo('#hand-minute', { rotation: 315 }, { rotation: 360, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${r3(0.08 * c.k)}, ease: 'power4.out', immediateRender: false }, ${t2});`, showAt(['trail-1'], t2),
        `tl.set('#hand-minute', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, ${c.at(0.62)});`,
      ].join('\n');
    },
  },
  start: {
    from: 'ground', to: 'handoff', dur: 1.38, uses: ['caseRing'],
    build: c => [
      showAt(['mark'], c.t0),
      hideAt(['piece', 'piece-tint', 'piece-shine', 'outline'], c.t0), showAt(['case-ring', 'dial-ring'], c.t0),
      `tl.set('.watch, #case-ring', { scale: 0.86, svgOrigin: ${j(DIAL_ORIGIN)} }, ${c.t0});`,
      `tl.fromTo('.watch, #case-ring', { scale: 0.86 }, { scale: 1, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${r3(0.2 * c.k)}, ease: 'power3.out', immediateRender: false }, ${c.t0});`,
      `tl.fromTo('#crown', { y: 0 }, { y: 120, duration: ${r3(0.05 * c.k)}, ease: 'power2.in', immediateRender: false }, ${c.at(0.24)});`,
      `tl.fromTo('#crown', { y: 120 }, { y: 0, duration: ${r3(0.12 * c.k)}, ease: 'power2.out', immediateRender: false }, ${c.at(0.29)});`,
      sweep({ at: c.at(0.32), dur: r3(0.6 * c.k), from: 0, power: 3, hourFrom: 30, t0: c.t0 }),
      scaleIn(['piece', 'piece-tint'], { at: c.at(0.84), dur: r3(0.26 * c.k), from: 0.6, t0: c.t0 }),
      outlineJoin(c.at(1.1)), hideAt(['case-ring'], c.at(1.1)), showAt(['piece-shine'], c.at(1.1)),
      speedLinesIn(c.at(0.98), r3(0.26 * c.k), r3(0.035 * c.k), undefined, c.t0),
    ].join('\n'),
  },
  jigsaw: {
    from: 'ground', to: 'handoff', dur: 2.2, uses: ['lj'],
    build: c => {
      const rand = rng(23);
      const order = LJ.pieces.map((p, i) => ({ p, i, n: rand() })).sort((a, b) => a.n - b.n);
      const fly: Fly[] = order.map(({ p, i }, n) => {
        const cc = centreOf(p);
        const ang = Math.atan2(cc.y - RIG.dial.cy, cc.x - RIG.dial.cx) + (rand() - 0.5) * 0.7;
        const dist = 7000 + rand() * 3000;
        return [i, c.at(0.04 + n * 0.04), Math.round(Math.cos(ang) * dist), Math.round(Math.sin(ang) * dist), Math.round((rand() - 0.5) * 140)];
      });
      const lock = c.at(1.24), swap = c.at(1.54);
      return [
        showAt(['lj'], c.t0), flyIn('lj', fly, r3(0.4 * c.k), 'power3.out', c.t0),
        `tl.fromTo('#lj', { scale: 1 }, { scale: 0.98, duration: ${r3(0.06 * c.k)}, ease: 'power2.out', immediateRender: false }, ${lock});`,
        `tl.to('#lj', { scale: 1, duration: ${r3(0.14 * c.k)}, ease: 'power2.out' }, ${c.at(1.3)});`,
        `tl.set('.lj-seam', { opacity: 1 }, ${c.t0});`,
        `tl.fromTo('.lj-seam', { opacity: 1 }, { opacity: 0, duration: ${r3(0.18 * c.k)}, ease: 'power1.out', immediateRender: false }, ${c.at(1.34)});`,
        hideAt(['lj'], swap), showAt(['mark'], swap),
        lapWithTail(c.at(1.58), r3(0.6 * c.k), 3),
      ].join('\n');
    },
  },
  relay: {
    from: 'ground', to: 'handoff', dur: 1.74, uses: ['relay'],
    build: c => {
      const SHIFT = W + 130, D = r3(0.42 * c.k);
      const starts = [0.04, 0.24, 0.44, 0.64].map(c.at);
      const out = [showAt(['relay', 'mark'], c.t0)];
      starts.forEach((s, i) => {
        out.push(`tl.set('#rl${i}', { x: -130 }, ${c.t0});`);
        out.push(`tl.fromTo('#rl${i}', { x: -130 }, { x: ${SHIFT}, duration: ${D}, ease: 'power3.inOut', immediateRender: false }, ${s});`);
      });
      out.push(`tl.set('#mark', { x: ${-SHIFT - 130} }, ${c.t0});`);
      out.push(`tl.fromTo('#mark', { x: ${-SHIFT - 130} }, { x: 0, duration: ${D}, ease: 'power3.inOut', immediateRender: false }, ${starts[3]});`);
      out.push(hideAt(['relay'], c.at(1.06)));
      out.push(speedLinesIn(c.at(0.86), r3(0.3 * c.k), r3(0.03 * c.k), undefined, c.t0));
      out.push(sweep({ at: c.at(1.1), dur: r3(0.62 * c.k), from: 0, power: 3, hourFrom: 30, t0: c.t0 }));
      return out.join('\n');
    },
  },
  sweep: {
    from: 'table', to: 'handoff', dur: 1.64, uses: ['wipe'],
    build: c => {
      const crown = RIG.parts.crown.box, bl = RIG.parts['button-left'].box, br = RIG.parts['button-right'].box;
      const AT = c.at(0.3), DUR = r3(0.8 * c.k);
      return [
        showAt(['wipe', 'mark'], c.t0),
        hideAt(['piece', 'piece-tint', 'piece-shine', 'outline', 'crown', 'buttons'], c.t0), showAt(['dial-ring'], c.t0),
        `tl.set('.watch', { scale: 0.7, svgOrigin: ${j(DIAL_ORIGIN)} }, ${c.t0});`,
        `tl.fromTo('.watch', { scale: 0.7 }, { scale: 1, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${r3(0.22 * c.k)}, ease: 'power3.out', immediateRender: false }, ${c.at(0.02)});`,
        sweep({ at: AT, dur: DUR, from: 0, power: 2, hourFrom: 30, t0: c.t0 }),
        `tl.set('#wipe-t', { attr: { 'stroke-dashoffset': 0 } }, ${c.t0}); tl.set('#wipe-edge', { rotation: 0, svgOrigin: '${WIPE_C.x} ${WIPE_C.y}' }, ${c.t0});`,
        `tl.fromTo('#wipe-t', { attr: { 'stroke-dashoffset': 0 } }, { attr: { 'stroke-dashoffset': -1 }, duration: ${DUR}, ease: 'power2.inOut', immediateRender: false }, ${AT});`,
        `tl.fromTo('#wipe-edge', { rotation: 0 }, { rotation: 360, svgOrigin: '${WIPE_C.x} ${WIPE_C.y}', duration: ${DUR}, ease: 'power2.inOut', immediateRender: false }, ${AT});`,
        hideAt(['wipe'], r3(AT + DUR)),
        scaleIn(['piece', 'piece-tint'], { at: c.at(1.06), dur: r3(0.26 * c.k), from: 0.6, t0: c.t0 }),
        scaleIn(['crown'], { at: c.at(1.1), dur: r3(0.22 * c.k), from: 0.2, origin: `${RIG.dial.cx} ${crown.y1.toFixed(1)}`, t0: c.t0 }),
        scaleIn(['button-left'], { at: c.at(1.14), dur: r3(0.2 * c.k), from: 0.2, origin: `${bl.x1.toFixed(1)} ${bl.y1.toFixed(1)}`, t0: c.t0 }),
        scaleIn(['button-right'], { at: c.at(1.14), dur: r3(0.2 * c.k), from: 0.2, origin: `${br.x0.toFixed(1)} ${br.y1.toFixed(1)}`, t0: c.t0 }),
        showAt(['buttons'], c.at(1.14)),
        outlineJoin(c.at(1.34)), showAt(['piece-shine'], c.at(1.34)),
        speedLinesIn(c.at(1.24), r3(0.26 * c.k), r3(0.035 * c.k), undefined, c.t0),
      ].join('\n');
    },
  },
  idle: {
    // Loading loop (research 2026-10-16: 1.0–1.5 s per lap, constant speed, seamless). The hand and its trail run one
    // linear lap (constant angular speed, so the wrap is just another frame step) while the logo breathes 1.5 %
    // (sine, zero velocity at the ends). Everything is back on the hand-off frame exactly at the end.
    from: 'handoff', to: 'handoff', dur: 1.2,
    build: c => {
      const d = r3(1.2 * c.k), end = r3(c.t0 + d);
      return [
        `tl.fromTo('#hand-minute, #trails', { rotation: 0 }, { rotation: 360, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${d}, ease: 'none', immediateRender: false }, ${c.t0});`,
        `tl.set('#hand-minute, #trails', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, ${end});`,
        `tl.fromTo('#mark', { scale: 1 }, { scale: 1.015, duration: ${r3(d / 2)}, ease: 'sine.inOut', immediateRender: false }, ${c.t0});`,
        `tl.fromTo('#mark', { scale: 1.015 }, { scale: 1, duration: ${r3(d / 2)}, ease: 'sine.inOut', immediateRender: false }, ${r3(c.t0 + d / 2)});`,
      ].join('\n');
    },
  },
  'idle-reduced': {
    // Reduced motion (iOS Reduce Motion / prefers-reduced-motion): no rotation, no scale; the static logo breathes in
    // opacity on a slow 2.4 s cycle (≥ 2 s), seamless.
    from: 'handoff', to: 'handoff', dur: 2.4,
    build: c => {
      const d = r3(2.4 * c.k);
      return [
        `tl.fromTo('#mark', { opacity: 1 }, { opacity: 0.55, duration: ${r3(d / 2)}, ease: 'sine.inOut', immediateRender: false }, ${c.t0});`,
        `tl.fromTo('#mark', { opacity: 0.55 }, { opacity: 1, duration: ${r3(d / 2)}, ease: 'sine.inOut', immediateRender: false }, ${r3(c.t0 + d / 2)});`,
      ].join('\n');
    },
  },
  sting: {
    // Reel-end sting, loop-friendly (research: 0.4–0.8 s, merged into the last beat, resolving into frame 0): the hand
    // and trail run a quick lap and the piece clicks as the hand hits 12; it ends exactly where it started, so the Reel
    // loops back to frame 0 without a visible ending.
    from: 'handoff', to: 'handoff', dur: 0.6,
    build: c => [
      lapWithTail(c.t0, r3(0.42 * c.k), 3),
      outlineSplit(c.at(0.42)),
      `tl.fromTo('.piece, #silhouette', { scale: 1 }, { scale: 1.05, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${r3(0.05 * c.k)}, ease: 'power2.out', immediateRender: false }, ${c.at(0.42)});`,
      `tl.to('.piece, #silhouette', { scale: 1, svgOrigin: ${j(DIAL_ORIGIN)}, duration: ${r3(0.08 * c.k)}, ease: 'power3.out' }, ${r3(c.t0 + r3(0.47 * c.k))});`,
      outlineJoin(c.at(0.56)),
    ].join('\n'),
  },
  hold: { from: 'any', to: 'same', dur: 0.5, build: () => '' },
  lockup: {
    from: 'handoff', to: 'lockup', dur: 1.2, uses: ['text'],
    build: c => [
      `tl.fromTo('#lock-pos', { '--ly': '0px', '--ls': 1 }, { ...${LOCK_VARS}, duration: ${r3(0.55 * c.k)}, ease: 'power3.inOut', immediateRender: false }, ${c.at(0.22)});`,
      lapWithTail(c.at(0.18), r3(0.8 * c.k), 2),
      `tl.fromTo('#domain', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: ${r3(0.42 * c.k)}, ease: 'power3.out', immediateRender: false }, ${c.at(0.6)});`,
      `tl.set('#domain', { clipPath: 'none' }, ${c.at(1.02)});`,
      `tl.fromTo('#handle', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: ${r3(0.26 * c.k)}, ease: 'power2.out', immediateRender: false }, ${c.at(0.92)});`,
    ].join('\n'),
  },
  breakup: {
    from: 'handoff', to: 'lockup', dur: 1.96, uses: ['text', 'gp'],
    build: c => {
      const rand = rng(17);
      const crack = c.at(0.85);
      const fly: Fly[] = GP.map((p, i) => [i, c.at(0.95 + (10 - p.row) * 0.042 + rand() * 0.07),
        Math.round((rand() - 0.5) * 160), Math.round(H - p.bbox.y + 80 + rand() * 200), Math.round((rand() - 0.5) * 100)]);
      return [
        `tl.fromTo('#lock-pos', { '--ly': '0px', '--ls': 1 }, { ...${LOCK_VARS}, duration: ${r3(0.45 * c.k)}, ease: 'power3.inOut', immediateRender: false }, ${c.t0});`,
        `tl.fromTo('#domain', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: ${r3(0.36 * c.k)}, ease: 'power3.out', immediateRender: false }, ${c.at(0.3)});`,
        `tl.set('#domain', { clipPath: 'none' }, ${c.at(0.66)});`,
        `tl.fromTo('#handle', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: ${r3(0.22 * c.k)}, ease: 'power2.out', immediateRender: false }, ${c.at(0.52)});`,
        // The crack: the ground becomes pieces (same look), the new ground is swapped in under them, the seams open.
        showAt(['gp'], crack), hideAt(['gp-t'], crack), `tl.set('#root', ${groundSet(c.reveal)}, ${crack});`,
        `tl.set('#gp-p', { attr: { stroke: '${c.reveal.bg}', 'stroke-opacity': 0 } }, ${crack});`,
        `tl.to('#gp-p', { attr: { 'stroke-opacity': 1 }, duration: ${r3(0.1 * c.k)}, ease: 'power1.out' }, ${crack});`,
        flyOut('gp', fly, r3(0.5 * c.k), 'power2.in'),
        hideAt(['gp'], c.at(1.96)),
      ].join('\n');
    },
  },
  exit: {
    // Splash exit (research: 200–300 ms). Designed at 1.0 s, played at 0.3 s by default.
    from: 'handoff', to: 'out', dur: 0.3, unit: 1.0, uses: ['gp'],
    build: c => {
      const rand = rng(29);
      const crack = r3(c.t0 + 1 / 30);   // one frame in: the module's first frame is still exactly the hand-off frame
      const fall = (v: number) => r3(crack + v * c.k);
      const C = { x: PLACE.center.cx, y: PLACE.center.cy };
      // Pieces fall away from the logo's spot outwards; the logo snaps down to nothing first.
      const fly: Fly[] = GP.map((p, i) => {
        const d = Math.hypot(centreOf(p).x - C.x, centreOf(p).y - C.y);
        return [i, fall(0.1 + (d / 1100) * 0.35 + rand() * 0.04), Math.round((rand() - 0.5) * 200), Math.round(H - p.bbox.y + 80 + rand() * 200), Math.round((rand() - 0.5) * 100)];
      });
      return [
        `tl.fromTo('#mark', { scale: 1 }, { scale: 0, duration: ${r3(0.22 * c.k)}, ease: 'back.in(1.6)', immediateRender: false }, ${c.at(0.02)});`,
        hideAt(['mark'], c.at(0.24)),
        showAt(['gp'], crack), hideAt(['gp-t'], crack), `tl.set('#root', ${groundSet(c.reveal)}, ${crack});`,
        `tl.set('#gp-p', { attr: { stroke: '${c.reveal.bg}', 'stroke-opacity': 0 } }, ${crack});`,
        `tl.to('#gp-p', { attr: { 'stroke-opacity': 1 }, duration: ${r3(0.08 * c.k)}, ease: 'power1.out' }, ${crack});`,
        flyOut('gp', fly, r3(0.45 * c.k), 'power2.in'),
        hideAt(['gp'], r3(crack + c.k)),
      ].join('\n');
    },
  },
};

export const ALIASES: Record<string, string> = {
  F1: 'rain', F2: 'converge', 'F2-arrival': 'drop', 'E-arrival': 'start', E: 'start', H: 'jigsaw', J: 'relay', G: 'sweep',
  loop: 'idle', 'loop-reduced': 'idle-reduced', 'reel-sting': 'sting', 'O1-exit': 'lockup', P: 'breakup', 'app-exit': 'exit',
};

// ------------------------------------------------------------------ layers used by some modules

const WIPE_C = (() => {
  const s0 = scaleOf(PLACE.center.width);
  return { x: r1(PLACE.center.cx + (RIG.dial.cx - MARK_C.x) * s0), y: r1(PLACE.center.cy + (RIG.dial.cy - MARK_C.y) * s0) };
})();
function wipeLayer(g: Ground, gk: GroundKey): string {
  const R = 700;      // a circle of radius R with a 2R stroke covers the whole frame (corners ≤ 1130 px from the dial)
  return `<svg id="wipe" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true" visibility="hidden">
<circle id="wipe-t" cx="${WIPE_C.x}" cy="${WIPE_C.y}" r="${R}" fill="none" stroke="${TABLE[gk] ?? '#151a24'}" stroke-width="${2 * R}" pathLength="1" stroke-dasharray="1 1" transform="rotate(-90 ${WIPE_C.x} ${WIPE_C.y})"/>
<line id="wipe-edge" x1="${WIPE_C.x}" y1="${WIPE_C.y}" x2="${WIPE_C.x}" y2="${WIPE_C.y - 2 * R}" stroke="${g.ink}" stroke-width="6" stroke-linecap="round"/>
</svg>`;
}

/** A full-frame layer whose right edge is one real vertical jigsaw cut at x = 0 (knobs ±≈ 110 px). */
function relayPath(seed: number): string {
  const pw = 320;
  const jig = generateJigsaw({ cols: 2, rows: 6, width: 2 * pw, height: H, x: -pw, seed, tabSize: 0.22, jitter: 0.04 });
  let d = `M ${-W - 100} -4 H 0`;
  for (const p of jig.pieces.filter(q => q.col === 0).sort((a, b) => a.row - b.row)) {
    const e = p.outline.slice(9, 19);
    for (let k = 1; k + 2 < e.length; k += 3) d += ` C ${f1(e[k][0])} ${f1(e[k][1])} ${f1(e[k + 1][0])} ${f1(e[k + 1][1])} ${f1(e[k + 2][0])} ${f1(e[k + 2][1])}`;
  }
  return `${d} V ${H + 4} H ${-W - 100} Z`;
}
function relayLayer(g: Ground, gk: GroundKey): string {
  const runners = (['coral', 'sky', 'indigo', 'ocean'] as GroundKey[]).filter(k => k !== gk).slice(0, 3);
  const fills = [...runners.map(k => GROUNDS[k].bg), 'url(#rl-g)'];
  return `<svg id="relay" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true" visibility="hidden">
<defs>${depthGradient('rl-g', g)}</defs>
${fills.map((fill, i) => `<path id="rl${i}" d="${relayPath(51 + i * 7)}" fill="${fill}"/>`).join('\n')}
</svg>`;
}

/** The outlined logo cut into a 5×4 jigsaw (logo units, padded like the outline file). */
const LJ = (() => {
  const pad = OUTLINE_PAD;
  const box = { x: -pad, y: -pad, w: VIEWBOX.w + 2 * pad, h: VIEWBOX.h + 2 * pad };
  return { box, pieces: generateJigsaw({ cols: 5, rows: 4, width: box.w, height: box.h, x: box.x, y: box.y, seed: 12, tabSize: 0.22, jitter: 0.04 }).pieces };
})();
function ljLayer(g: Ground): string {
  const { box, pieces } = LJ;
  const s0 = scaleOf(PLACE.center.width);
  const left = PLACE.center.cx - (MARK_C.x + OUTLINE_PAD) * s0, top = PLACE.center.cy - (MARK_C.y + OUTLINE_PAD) * s0;
  const img = `<image href="assets/logo-outline.svg" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" preserveAspectRatio="none"/>`;
  return `<svg id="lj" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" aria-hidden="true" visibility="hidden" style="position:absolute; left:${left.toFixed(2)}px; top:${top.toFixed(2)}px; width:${(box.w * s0).toFixed(2)}px; height:${(box.h * s0).toFixed(2)}px; overflow:visible">
<defs>${pieces.map((p, i) => `<clipPath id="ljc${i}"><path d="${p.d}"/></clipPath>`).join('')}</defs>
${pieces.map((p, i) => `<g id="lj${i}"><g clip-path="url(#ljc${i})">${img}</g><path class="lj-seam" d="${p.d}" fill="none" stroke="${g.bg}" stroke-width="44" stroke-linejoin="round"/></g>`).join('')}
</svg>`;
}

// ------------------------------------------------------------------ chain

export interface ChainSpec {
  key: string; dir: Clip['dir']; label: string;
  /** Module items: name[:seconds][@offset]. */
  items: string[];
  /** The brand ground (default navy) and the ground an exit reveals (breakup: ocean, exit: paper). */
  ground?: GroundKey; reveal?: GroundKey;
  /** Where the hand-off logo sits: centred (default, every module) or the Reel masthead (loop modules only). */
  place?: 'center' | 'mast';
}

interface Placed { name: string; def: ModuleDef; t0: number; dur: number; from: State; to: State }

/** Parses and times the items, checking that every module starts in the state the previous one ended in. */
export function plan(items: string[]): Placed[] {
  const out: Placed[] = [];
  let t = 0;
  let state: State | null = null;
  for (const raw of items) {
    const m = raw.match(/^([\w-]+)(?::([\d.]+))?(?:@(-?[\d.]+))?$/);
    if (!m) throw new Error(`bad chain item "${raw}" (name[:seconds][@offset])`);
    const name = ALIASES[m[1]] ?? m[1];
    const def = MODULES[name];
    if (!def) throw new Error(`unknown module "${m[1]}" (have: ${Object.keys(MODULES).join(', ')}; aliases: ${Object.keys(ALIASES).join(', ')})`);
    const dur = m[2] ? Number(m[2]) : def.dur;
    const t0 = r3(Math.max(0, t + (m[3] ? Number(m[3]) : 0)));
    const from: State = def.from === 'any' ? (state ?? 'handoff') : def.from;
    if (state && from !== state) throw new Error(`"${raw}" starts at ${from}, but the chain is at ${state} here`);
    const to: State = def.to === 'same' ? from : def.to;
    out.push({ name, def, t0, dur, from, to });
    state = to;
    t = t0 + dur;
  }
  return out;
}

/** The hand-off frame as a page (brand ground + the centred settled logo): the reference every hand-off must match. */
export function handoffHtml(g: Ground, place: Place = PLACE.center): string {
  return composition({ id: 'handoff', title: 'LM1 hand-off frame', duration: 1, ground: g, css: LOGO_CSS + CHAIN_CSS, body: `<div id="lock-pos"><div id="mark-pos">${logoSvg({ ...place })}</div></div>`, script: '' });
}

type Place = { cx: number; cy: number; width: number };
/**
 * The Reel masthead logo (DL4 house masthead: outlined logo 100 px tall, right edge at x 960, row centre y 332), for
 * modules that play on a Reel's own last frame (the sting). Only the hand-off-to-hand-off modules can use it.
 */
export const MAST: Place = (() => {
  const s = 100 / (VIEWBOX.h + 2 * OUTLINE_PAD);
  return { cx: r1(960 - (VIEWBOX.w + 2 * OUTLINE_PAD) * s + (OUTLINE_PAD + MARK_C.x) * s), cy: 332, width: r1(VIEWBOX.w * s) };
})();
const MAST_OK = new Set(['idle', 'idle-reduced', 'sting', 'hold']);

const CHAIN_CSS = `#lock-pos, #mark-pos { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: ${PLACE.center.cx}px ${PLACE.center.cy}px; }
#lock-pos { transform: translate(0px, var(--ly, 0px)) scale(var(--ls, 1)); }
.handle { color: #dfe3ea; }`;

export function chain(spec: ChainSpec): Clip {
  const gk = spec.ground ?? 'navy';
  const g = GROUNDS[gk];
  const steps = plan(spec.items);
  const end = steps.at(-1)!;
  const place = spec.place === 'mast' ? MAST : PLACE.center;
  if (spec.place === 'mast') for (const st of steps) if (!MAST_OK.has(st.name)) throw new Error(`module "${st.name}" needs the centred logo (place: 'mast' allows ${[...MAST_OK].join(', ')})`);
  const revealKey: GroundKey = spec.reveal ?? (steps.some(s => s.name === 'exit') ? (gk === 'paper' ? 'navy' : 'paper') : 'ocean');
  const reveal = GROUNDS[revealKey];
  const swaps = steps.some(s => s.name === 'breakup' || s.name === 'exit');
  const uses = new Set(steps.flatMap(s => s.def.uses ?? []));

  // The default DOM is the chain's end state (the settled check compares the last frame with it).
  const lockupEnd = end.to === 'lockup', outEnd = end.to === 'out';
  const caseRing = `<circle id="case-ring" cx="${RIG.dial.cx}" cy="${RIG.dial.cy}" r="${(RIG.dial.cy - RIG.parts.silhouette.box.y0 - 100).toFixed(2)}" fill="url(#lg21)" stroke="#2C3679" stroke-width="200" visibility="hidden"/>`;
  const body = [
    uses.has('gp') ? gpLayer(g, gk) : '',
    uses.has('wipe') ? wipeLayer(g, gk) : '',
    uses.has('relay') ? relayLayer(g, gk) : '',
    uses.has('lj') ? ljLayer(g) : '',
    `<div id="lock-pos"${lockupEnd ? ` style="--ly: ${LOCK.y}px; --ls: ${LOCK.scale}"` : ''}><div id="mark-pos">${logoSvg({ ...place, insert: uses.has('caseRing') ? { beforeWatch: caseRing } : undefined })}</div></div>`,
    uses.has('text') ? `<div id="lock"${lockupEnd ? '' : ' style="visibility:hidden"'}>${lockupText({ domainTop: LOCK.domainTop, handleTop: LOCK.handleTop })}</div>` : '',
  ].join('\n').replace('<div id="mark" class="mark"', `<div id="mark" class="mark"${outEnd ? ' data-out' : ''}`);

  const s: string[] = [];
  // Chain-level start state.
  if (outEnd) s.push(`gsap.set('#mark', { autoAlpha: 1 });`);     // hidden in the default DOM (the end state)
  if (steps[0].from !== 'handoff') s.push(hideAt(['mark'], 0));
  s.push(`gsap.config({ force3D: false });`);   // 2D transforms only: a 3D (composited) layer rasterises the mark differently
  if (lockupEnd) s.push(`gsap.set('#lock-pos', { '--ly': '0px', '--ls': 1 });`);
  if (uses.has('text')) {
    s.push(`gsap.set('#lock', { autoAlpha: 1 }); gsap.set('#domain', { clipPath: 'inset(0% 100% 0% 0%)' }); gsap.set('#handle', { autoAlpha: 0, y: 16 });`);
  }
  if (swaps) s.push(`gsap.set('#root', ${groundSet(g)});`);
  const handoffAt: number[] = [];
  for (const st of steps) {
    const k = st.dur / (st.def.unit ?? st.def.dur);
    const ctx: Ctx = { t0: st.t0, k, at: v => r3(st.t0 + v * k), g, gk, reveal };
    s.push(`// ${st.name} ${st.from} → ${st.to}, ${st.t0}–${r3(st.t0 + st.dur)} s`, st.def.build(ctx));
    // Settled moments: the rig's GSAP transforms are cleared (float residue changes Chromium's raster, see clips.ts).
    if (st.to === 'handoff' && st.name !== 'hold') {
      s.push(`tl.set('#logo g, #logo path', { clearProps: 'transform' }, ${r3(st.t0 + st.dur)});`);
      handoffAt.push(r3(st.t0 + st.dur));
    }
    if (st.from === 'handoff' && st.name !== 'hold' && st.t0 > 0) handoffAt.push(st.t0);
  }
  // Out-of-chain extras: a module that starts the chain at the hand-off frame is checked at 0.
  if (steps[0].from === 'handoff') handoffAt.push(0);
  // Loop modules end the clip exactly at their end (so the clip itself loops); others hold the end frame 0.5 s.
  const LOOPS = new Set(['idle', 'idle-reduced', 'sting']);
  // Whole 0.1 s (3 frames at 30 fps), rounded up into the hold, so the encode has exactly duration × 30 frames.
  const duration = Math.ceil(r3(end.t0 + end.dur + (LOOPS.has(end.name) ? 0 : end.to === 'out' ? 0.3 : 0.5)) * 10 - 1e-6) / 10;
  const settleAt = r3(end.t0 + end.dur);
  const qaAt = [...new Set([0, ...steps.flatMap(st => [st.t0, r3(st.t0 + st.dur / 3), r3(st.t0 + (2 * st.dur) / 3)]), settleAt, r3(duration - 0.02)])].filter(t => t < duration).sort((a, b) => a - b);
  const idle = steps.filter(st => LOOPS.has(st.name)).map(st => [st.t0, r3(st.t0 + st.dur)] as [number, number]);
  const c = clip({ ground: swaps ? revealKey : gk, dir: spec.dir, key: spec.key, label: spec.label }, {
    duration, settleAt, qaAt, css: CHAIN_CSS + (outEnd ? '#mark[data-out] { visibility: hidden; }' : ''), body, script: s.join('\n'),
    assets: uses.has('lj') ? { 'assets/logo-outline.svg': RIG_OUTLINE_FILE } : undefined,
  });
  return { ...c, handoffAt: [...new Set(handoffAt)].sort((a, b) => a - b), handoffRef: handoffHtml(g, place), loops: idle, chain: spec.items };
}

// ------------------------------------------------------------------ the catalogue (round 2)

const NAME: Record<string, string> = {
  rain: 'F1 · Rain', converge: 'F2 · Converge', sweep: 'G · Sweep', jigsaw: 'H · Jigsaw', relay: 'J · Relay', breakup: 'P · Break-up',
};

/**
 * Round 2 clips, appended after round 1 in every direction (keeps the round-1 gallery codes stable). Durations follow
 * research_notes/…/logo_motion_durations.md: Android splash ≤ 1 s (target 600–900 ms) then hold; exit 200–300 ms;
 * loop 1.0–1.5 s per lap; no Reel intro; a 0.4–0.8 s loop-friendly Reel sting; full lockups for long formats.
 */
export function round2(): { L1: Clip[]; L2: Clip[]; L3: Clip[]; L4: Clip[] } {
  const intro = (k: string, items: string[]) => chain({ key: `intro-${k}`, dir: 'L1', label: `Intro ${NAME[k]} (navy) [${items.join(' → ')}]`, items });
  const gname = (g: GroundKey) => (g === 'paper' ? 'white with depth' : g);
  return {
    L1: [
      intro('rain', ['rain', 'start']),
      intro('converge', ['converge', 'drop@-0.24']),
      intro('sweep', ['sweep']),
      intro('jigsaw', ['jigsaw']),
      intro('relay', ['relay']),
    ],
    L2: [chain({ key: 'outro-breakup', dir: 'L2', label: `Outro ${NAME.breakup} (navy → ocean) [breakup]`, items: ['breakup'] })],
    L3: [
      // In-app overlay versions (1.4 s to the hand-off frame, then hold).
      ...(['coral', 'paper'] as const).map(g => chain({ key: `splash-converge-${g}`, dir: 'L3', label: `App overlay F2 · Converge (${gname(g)}) [converge → drop]`, items: ['converge', 'drop@-0.24'], ground: g })),
      // System-splash length (≈ 0.8 s, under Android's 1,000 ms cap), then hold the final frame.
      ...(['coral', 'paper'] as const).flatMap(g => [
        chain({ key: `splash-converge-short-${g}`, dir: 'L3', label: `Splash 0.8 s F2 · Converge (${gname(g)}) [converge:0.6 → drop:0.36@-0.14]`, items: ['converge:0.6', 'drop:0.36@-0.14'], ground: g }),
        chain({ key: `splash-start-short-${g}`, dir: 'L3', label: `Splash 0.8 s E · Start (${gname(g)}) [start:0.8]`, items: ['start:0.8'], ground: g }),
      ]),
    ],
    L4: [
      chain({ key: 'loop-idle', dir: 'L4', label: 'Loading loop, 1.2 s per lap (linear, seamless) [idle]', items: ['idle'] }),
      chain({ key: 'loop-reduced', dir: 'L4', label: 'Loading loop, reduced motion: static logo, 2.4 s opacity breath [idle-reduced]', items: ['idle-reduced'] }),
      chain({ key: 'sting-reel', dir: 'L4', label: '(c) Reel-end sting 0.6 s on the masthead logo, loops back to frame 0 [sting]', items: ['sting'], place: 'mast' }),
      chain({ key: 'chain-app', dir: 'L4', label: '(a) App: ground ≤ 1 s → logo → loop × 2 → exit 0.3 s [converge:0.7 → drop:0.4@-0.16 → idle → idle → exit]', items: ['converge:0.7', 'drop:0.4@-0.16', 'idle', 'idle', 'exit'] }),
      chain({ key: 'chain-event', dir: 'L4', label: '(b) Event / stream opener ≈ 3.5 s [relay → hold 0.6 → lockup]', items: ['relay', 'hold:0.6', 'lockup'] }),
      chain({ key: 'chain-brand', dir: 'L4', label: 'Pinned brand Reel / long-form: ground in, logo, ground out [converge → drop → hold 0.6 → breakup]', items: ['converge', 'drop@-0.24', 'hold:0.6', 'breakup'] }),
    ],
  };
}
