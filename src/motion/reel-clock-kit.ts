// Shared parts of the Reel "Your extra hour" (clocks go back in Europe, night of 24–25 Oct 2026). Three concepts
// (owner 2026-10-22: "joyful, funny fact, WOW I have an extra hour for a puzzle", "draft all three"):
//   A  reel-clock-a.ts  Stopwatch double-take: the MSP stopwatch is the character, snaps back 03:00 → 02:00, WOW
//   B  reel-clock-b.ts  Extra-hour slot machine: what fits into 60 minutes, rolled with real box pictures
//   C  reel-clock-c.ts  The hour becomes a piece: the dial's 2–3 o'clock wedge flies into a puzzle and completes it
// All three share the splash (frame 0 complete, logo exits), the snap-back, the confetti, the board of generator
// pieces, the funny fact and the end question ("How will YOU spend your extra hour?", comment A–D).
//
// The logo is the rig (one per composition: its part ids are fixed). Its hands are turned with handsTo(): the minute
// hand's rest angle is 0° (12 o'clock), the hour hand's rest is RIG.handHourDeg, so 2:59 = minute 354°, hour
// 89.5° − handHourDeg. Whole-logo moves animate the HTML wrapper #mark, never the SVG.
// Text only in the Reel safe area (x 60–960, y 220–1250); the confetti pile below it is decoration.
import { GROUNDS, X0, f1 } from '../design/house.ts';
import { escapeHtml as h } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { FRAMES } from '../render/render.ts';
import { DIAL_ORIGIN, RIG } from '../../lab/logo/shared.ts';

export interface Box { puzzle: string; brand: string; img: string }
export interface ClockSpec {
  /** Solo times in seconds (median, fastest) and the number of solo 500 results. */
  s500: { p50: number; best: number; results: number };
  s1000: { p50: number; best: number };
  /** Popular 500s (the first is the main one) and a popular 1000, box pictures as data URIs. */
  boxes500: Box[];
  box1000: Box;
  /** Puzzlers whose stopwatch was running through last year's repeated hour (2025-10-26, 02:00–03:00 twice). */
  lastYear: { puzzlers: number };
  queriedAt: string;
}

export const SAFE = FRAMES.reel.safe;
export const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
export const HOUR = 3600;
/** Confetti colours: brand only, never white (owner 2026-10-22). On coral grounds drop coral itself. */
export const CONFETTI = [GROUNDS.coral.bg, '#ffb0ab', GROUNDS.sky.bg, GROUNDS.indigo.bg];
export const CONFETTI_ON_CORAL = ['#ffb0ab', GROUNDS.sky.bg, GROUNDS.indigo.bg, GROUNDS.navyDeep.bg];

/** "1:04:55" / "16:30" from seconds. */
export const tm = (sec: number) => {
  const s = Math.round(sec), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60, p = (v: number) => String(v).padStart(2, '0');
  return hh ? `${hh}:${p(mm)}:${p(ss)}` : `${mm}:${p(ss)}`;
};
/** Whole minutes, rounded down ("10 minutes to spare" must never overstate). */
export const minDown = (sec: number) => Math.floor(sec / 60);

/** The numbers every concept says, from the spec, so the three tell the same story. */
export function clockFacts(s: ClockSpec) {
  const share500 = HOUR / s.s500.p50;                 // 0.92: an hour is 92 % of a typical solo 500
  const fastFit = Math.floor(HOUR / s.s500.best);     // 3 whole 500s at the fastest pace
  return {
    share500, pct500: Math.floor(share500 * 100), shortBy: s.s500.p50 - HOUR,
    fastFit, spare: HOUR - fastFit * s.s500.best,
    share1000: HOUR / s.s1000.p50,                    // ~0.31 of a typical 1000
  };
}

// ------------------------------------------------------------------ the stopwatch (logo rig) hands

/** Hand rotations (deg) for a clock time; `laps` adds full minute-hand turns so it can keep going forwards. */
export function handAngles(hh: number, mm: number, laps = 0) {
  return { min: mm * 6 + 360 * laps, hour: (hh % 12) * 30 + mm * 0.5 - RIG.handHourDeg };
}
/** GSAP: turns both hands to the given rotations (from wherever they are). */
export function handsTo(a: { min: number; hour: number }, at: number, dur: number, ease = 'power2.inOut'): string {
  const o = JSON.stringify(DIAL_ORIGIN);
  return `tl.to('#hand-minute', { rotation: ${a.min}, svgOrigin: ${o}, duration: ${dur}, ease: '${ease}' }, ${at});
tl.to('#hand-hour', { rotation: ${a.hour}, svgOrigin: ${o}, duration: ${dur}, ease: '${ease}' }, ${at});`;
}
/** GSAP: puts both hands at the given rotations instantly. */
export function handsSet(a: { min: number; hour: number }, at: number): string {
  const o = JSON.stringify(DIAL_ORIGIN);
  return `tl.set('#hand-minute', { rotation: ${a.min}, svgOrigin: ${o} }, ${at});
tl.set('#hand-hour', { rotation: ${a.hour}, svgOrigin: ${o} }, ${at});`;
}

// ------------------------------------------------------------------ digital readout 02:59:57 → 03:00:00 → 02:00:00

/** A big tabular readout (id) at `top`; text set by the script's digital helpers. */
export const digital = (id: string, top: number, size = 190) =>
  `<p class="rc-dig" id="${id}" style="top:${top}px; font-size:${size}px">02:59:57</p>`;

/** JS added to every concept's script: readout formatting, ticking, snap-back, shake, confetti burst. */
export const CLOCK_JS = `
const hms = s => { s = ((Math.round(s) % 86400) + 86400) % 86400; const p = v => String(v).padStart(2, '0'); return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60); };
const digSet = (id, s) => { document.getElementById(id).innerHTML = hms(s).replace(/:/g, '<span class="c">:</span>'); };
// the readout counts from one clock time to another (seconds of the day); pass the hands' ease so both agree
function digRun(id, from, to, at, dur, ease) {
  const o = { v: from }, show = () => digSet(id, o.v);
  tl.fromTo(o, { v: from }, { v: to, duration: dur, ease: ease || 'none', onUpdate: show, onComplete: show, onReverseComplete: show, immediateRender: false }, at);
}
// an instant jump of the readout (the snap-back)
function digJump(id, s, at) { const o = { v: 0 }; tl.to(o, { v: 1, duration: 0.01, onStart: () => digSet(id, s), onUpdate: () => digSet(id, s), onReverseComplete: () => {} }, at); }
// a short screen shake of an element (x/y jitter, back to rest)
function shake(sel, at, amp, dur) {
  amp = amp || 18; dur = dur || 0.36;
  const n = 8, step = dur / n;
  for (let i = 0; i < n; i++) tl.to(sel, { x: (i % 2 ? -1 : 1) * amp * (1 - i / n), y: ((i * 7) % 3 - 1) * amp * 0.4 * (1 - i / n), duration: step, ease: 'none' }, at + i * step);
  tl.to(sel, { x: 0, y: 0, duration: step, ease: 'power2.out' }, at + dur);
}
// confetti: pieces resting in the pile (their markup position) burst up and out to the sides, spinning, then fall out
// of the frame (y 2100 below their resting place is off-canvas for every piece)
function burst(list, at, o) {
  o = o || {};
  list.forEach((p, i) => {
    const t = at + (i % 7) * 0.012;
    tl.to('#' + p.id, { x: p.bx, y: p.by, rotation: p.br, duration: o.up ?? 0.55, ease: 'power2.out' }, t);
    tl.to('#' + p.id, { y: 2100, rotation: p.br * 1.6, duration: o.fall ?? 1.1, ease: 'power2.in' }, t + (o.up ?? 0.55));
  });
}
// the pile drops back in from above for the loop (ends at the resting markup position)
function pileBack(list, at) {
  list.forEach((p, i) => tl.fromTo('#' + p.id, { x: 0, y: -1700, rotation: p.br }, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, at + (i % 9) * 0.02));
}
`;

// ------------------------------------------------------------------ confetti pile (generator pieces)

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let q = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q;
    return ((q ^ (q >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A pile of loose generator pieces lying in the bottom band (y ≈ 1330–1880, under Instagram's caption zone: pure
 * decoration, the "puzzle" on frame 0) plus each piece's burst target (bx, by, br: offsets from its resting place).
 */
export function confettiPile(o: { seed: number; colors?: string[]; n?: number; top?: number; id?: string }) {
  const r = rng(o.seed), cols = 6, rows = 4, size = 92;
  const jig = generateJigsaw({ cols, rows, width: cols * size, height: rows * size, seed: o.seed, tabSize: 0.26, jitter: 0.05 });
  const colors = o.colors ?? CONFETTI, top = o.top ?? 1330, id = o.id ?? 'cf';
  const n = Math.min(o.n ?? 22, jig.pieces.length);
  const pieces = jig.pieces.slice(0, n).map((p, i) => {
    const x = 40 + r() * 920, y = top + r() * 470, rot = (r() - 0.5) * 140;
    const cx = p.bbox.x + p.bbox.width / 2, cy = p.bbox.y + p.bbox.height / 2;
    return {
      id: `${id}${i}`, d: p.d, fill: colors[i % colors.length], x: f1(x - cx), y: f1(y - cy), rot: f1(rot), cx: f1(cx), cy: f1(cy),
      // up into the side gutters (x < 150 or > 930: never across text in the middle), spinning
      bx: f1((x < 540 ? 20 + r() * 130 : 930 + r() * 130) - x), by: f1(-(450 + r() * 650)), br: f1((r() - 0.5) * 720),
    };
  });
  const html = `<svg class="rc-pile" id="${id}" width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true">
    ${pieces.map(p => `<g id="${p.id}"><path d="${p.d}" fill="${p.fill}" stroke="${GROUNDS.navyDeep.bg}" stroke-width="3" stroke-linejoin="round" transform="translate(${p.x} ${p.y}) rotate(${p.rot} ${p.cx} ${p.cy})"/></g>`).join('')}
  </svg>`;
  return { html, list: pieces.map(({ id, bx, by, br }) => ({ id, bx: Number(bx), by: Number(by), br: Number(br) })) };
}

// ------------------------------------------------------------------ a board of generator pieces carrying a box picture

export interface Board { cols: number; rows: number; x: number; y: number; pc: number }

/**
 * An absolutely placed SVG board: generator pieces filled with the box picture (a pattern in the board's user space),
 * shuffled edges first; `pieces` carry their fly-in offsets (from below the frame) for the script's flyPieces().
 */
export function board(id: string, b: Board, img: string, seed: number, o: { ghost?: boolean } = {}) {
  const w = b.cols * b.pc, hh = b.rows * b.pc;
  const jig = generateJigsaw({ cols: b.cols, rows: b.rows, width: w, height: hh, seed, tabSize: 0.24, jitter: 0.04 });
  const r = rng(seed * 7 + 3);
  const isEdge = (p: { row: number; col: number }) => p.row === 0 || p.col === 0 || p.row === b.rows - 1 || p.col === b.cols - 1;
  const shuffle = <T,>(a: T[]) => a.map(v => [r(), v] as const).sort((p, q) => p[0] - q[0]).map(([, v]) => v);
  const order = [...shuffle(jig.pieces.filter(isEdge)), ...shuffle(jig.pieces.filter(p => !isEdge(p)))];
  const pieces = order.map((p, i) => ({ i, d: p.d, dx: f1((r() - 0.5) * 900), dy: f1(1980 - b.y - p.bbox.y + r() * 260), rot: f1((r() - 0.5) * 300) }));
  const svg = `<svg class="rc-board" id="${id}" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" style="left:${b.x}px; top:${b.y}px" aria-hidden="true">
    <defs><pattern id="${id}-img" patternUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${hh}"><image href="${img}" x="0" y="0" width="${w}" height="${hh}" preserveAspectRatio="xMidYMid slice"/></pattern></defs>
    ${o.ghost ? jig.pieces.map(p => `<path class="rc-ghost" d="${p.d}"/>`).join('') : ''}
    ${pieces.map(p => `<path class="rc-pc" id="${id}-${p.i}" d="${p.d}" fill="url(#${id}-img)"/>`).join('')}
  </svg>`;
  return { svg, pieces: pieces.map(({ i, dx, dy, rot }) => ({ i, dx: Number(dx), dy: Number(dy), rot: Number(rot) })), w, h: hh };
}

/** JS: fly the first `count` pieces of a board in, evenly over `dur` (pieces start hidden via .rc-pc opacity 0). */
export const BOARD_JS = `
function flyPieces(id, list, start, dur, count) {
  const n = count ?? list.length, step = dur / n;
  list.slice(0, n).forEach((p, k) => tl.fromTo('#' + id + '-' + p.i, { x: p.dx, y: p.dy, rotation: p.rot, opacity: 1, transformOrigin: '50% 50%' },
    { x: 0, y: 0, rotation: 0, duration: 0.6, ease: 'power3.out', immediateRender: false }, start + (k + 1) * step - 0.6));
}
`;

// ------------------------------------------------------------------ shared text blocks

/** The splash lines under the logo (frame 0): site, hook, sub. `top` = the site line's top. */
export function splashText(top: number): string {
  return `<p class="rc-site" style="top:${top}px">myspeedpuzzling.com</p>
    <p class="rc-c rc-hook" style="top:${top + 70}px">Tonight at 3:00</p>
    <p class="rc-c rc-hook hot" style="top:${top + 174}px">the clock goes back</p>
    <p class="rc-c rc-sub" style="top:${top + 306}px">Puzzlers, this is big.</p>`;
}

/** The funny fact: MSP's stopwatch counts real seconds (Lap::durationMilliseconds uses Unix time, checked 2026-10-22). */
export function funnyFact(s: ClockSpec, id = 'fact'): string {
  const last = s.lastYear.puzzlers === 1
    ? 'Last year one puzzler’s stopwatch was running as 03:00 turned back into 02:00. Their time came out right, to the second.'
    : s.lastYear.puzzlers > 1
      ? `Last year ${s.lastYear.puzzlers} puzzlers’ stopwatches were running as 03:00 turned back into 02:00. Every time came out right, to the second.`
      : '';
  return `<div id="${id}" class="rc-beat">
    <p class="h-abs h-cap" style="top:470px">Funny fact</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">The clock goes back.<br><span class="hot">Your time doesn’t.</span></p>
    <p class="h-abs h-lead" style="top:760px; width:${RW}px">The MSP stopwatch counts real seconds, so the hour that happens twice never counts twice.</p>
    ${last ? `<p class="h-abs h-lead" style="top:960px; width:${RW}px; color:var(--g-soft)">${h(last)}</p>` : ''}
  </div>`;
}

/** The end question: an open, personal ask; the four options are inspiration, not a vote token (playbook §9: no "comment A/B/C"). */
export function endAsk(id = 'ask'): string {
  const opts = [['A', 'One more 500'], ['B', 'Finally start that 1000'], ['C', 'Sort all the edges first'], ['D', 'Sleep. Just sleep.']];
  return `<div id="${id}" class="rc-beat">
    <p class="h-abs h-ask" style="top:430px; width:${RW}px">How will <span class="hot">you</span> spend your extra hour?</p>
    <div class="h-abs rc-opts" style="top:640px; width:${RW}px">
      ${opts.map(([k, v]) => `<div class="rc-opt"><b>${k}</b><span>${h(v)}</span></div>`).join('')}
    </div>
    <p class="h-abs h-lead" style="top:1124px; width:${RW}px">Or something else? Tell us in the comments.</p>
  </div>`;
}

export const CLOCK_CSS = `
.rc-beat { visibility: hidden; opacity: 0; }
.rc-pile { position: absolute; left: 0; top: 0; overflow: visible; z-index: 6; pointer-events: none; }
.rc-board { position: absolute; overflow: visible; }
.rc-ghost { fill: var(--g-band); stroke: var(--g-bg); stroke-width: 2; }
.rc-pc { stroke: rgba(18, 24, 36, 0.55); stroke-width: 1.2; stroke-linejoin: round; opacity: 0; }
.rc-dig { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums slashed-zero; color: var(--g-ink); white-space: nowrap; }
.rc-dig .c { opacity: 0.55; }
.rc-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.rc-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.rc-hook { font-size: 92px; }
.rc-hook.hot, .hot { color: var(--g-hot); }
.rc-sub { font-size: 56px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.rc-wow { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 800; line-height: 0.9; letter-spacing: -0.03em; color: var(--g-hot); white-space: nowrap; }
.rc-opts { display: flex; flex-direction: column; gap: 16px; }
.rc-opt { display: flex; align-items: center; gap: 28px; height: 92px; padding: 0 28px; border-radius: 22px; background: var(--g-band); }
.rc-opt b { width: 64px; height: 64px; border-radius: 50%; background: var(--g-hot); color: var(--g-bg); font-size: 38px; display: flex; align-items: center; justify-content: center; flex: none; }
.rc-opt span { font-size: 44px; font-weight: 600; color: var(--g-ink); white-space: nowrap; }
`;
