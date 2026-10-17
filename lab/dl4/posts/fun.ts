// DL4 · funny facts (F3) and timely stories (G3) in the house system. The jokes, stories and numbers are approved;
// the art is redrawn so it stops reading as AI clip art (owner feedback 2026-10-14: the D7/F3 "house illustration
// kit" of one navy ink, pastel two-stop washes, rim light, glints and cute rounded objects looks generated).
//
// Drawing rules here (they replace the D7 kit for Instagram):
//   - built from real things: generator pieces (src/pieces/jigsaw.ts, never drawn by hand), real box images with
//     their credit, real data marks; or bold flat poster geometry; or type doing the joke;
//   - flat brand colours only, picked per ground (PAL below), so the same art works on navy, paper and the H2
//     poster grounds; no washes, rim lights, glints, blush, outlines-around-everything; at most one flat shadow;
//   - no faces (the ghost's "eyes" are two missing pieces; the cat is seen from behind, as a piece silhouette).
//
// Layout (panel): header, an art zone (y 190–760), the punchline + wink bottom-aligned above the footer. In H2,
// cover/fact slides become two-piece posters: the art sits on the bold top piece, the text on the navy bottom,
// joined by the house jigsaw seam. Story data slides use the house slide()/cover() layouts.
//
// Every number comes from a cached query, computed exactly as in lab/dl2/directions/f3-cartoons.ts and
// lab/dl3/directions/g3-timely-stories.ts (re-query with --fresh before any of this is posted).
import { CW, FEED, GROUNDS, W, X0, X1, cover, f1, posterAt, frame, groundVars, hero, linesOf, posterTopPath, seamReach, slide, slotOf, type Ground, type GroundKey, type Role, type SlideCtx, type Variant } from '../../../src/design/house.ts';
import { barGeometry } from '../../../src/design/svg.ts';
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw, type Jigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import { boxPaths } from '../../../src/data/boxes.ts';
import { query } from '../../../src/data/db.ts';
import type { Content } from '../content.ts';
import type { Family, Post } from '../types.ts';

// ═════════════════════════════════════════════════════════════════════════════════════ facts (verbatim maths)
const rows = (name: string) => query(name).rows;
const dayOf = (iso: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
const source = (name: string) => `Data: myspeedpuzzling.com · ${dayOf(query(name).queried_at)}`;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const oneDec = (v: number) => v.toFixed(1);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (k: number) => WORDS[k] ?? String(k);
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
export const times = (k: number) => ({ 1: 'Once', 2: 'Twice', 3: 'Three times', 4: 'Four times', 5: 'Five times' } as Record<number, string>)[k] ?? `${k} times`;

/** F3 facts (lab/dl2/directions/f3-cartoons.ts). */
export function funFacts() {
  const wall = rows('wall-500').map(r => ({ minute: Number(r.minute), results: Number(r.results) }));
  const at = (m: number) => wall.find(w => w.minute === m)!.results;
  const mode = wall.filter(w => w.minute >= 45 && w.minute <= 75).reduce((a, b) => (b.results > a.results ? b : a));
  const dist = Object.fromEntries(rows('solo-distribution').map(r => [r.pieces_count, r]));
  const [small, big] = Object.keys(dist).map(Number).sort((a, b) => a - b);
  const med = (k: number) => Number(dist[String(k)].p50);
  const hq = query('halloween-puzzles');
  const hw = hq.rows.filter(r => /halloween/i.test(r.puzzle)).map(r => ({ puzzle: r.puzzle, brand: r.brand, solvers: Number(r.solvers), results: Number(r.results), oct: Number(r.results_october) }));
  const hwResults = hw.reduce((s, r) => s + r.results, 0), hwOct = hw.reduce((s, r) => s + r.oct, 0);
  const top = [...hw].sort((a, b) => b.solvers - a.solvers)[0];
  return {
    source: `Data: myspeedpuzzling.com · ${dayOf(query('wall-500').queried_at)}`,
    minute: { mode: mode.minute, results: mode.results, drop: Math.round(((at(60) - at(59)) / at(59)) * 1000) / 10 },
    sizes: {
      small, big, pieceRatio: big / small,
      medSmall: fmtDuration(med(small)), medBig: fmtDuration(med(big)),
      timeRatio: Math.round(med(big) / med(small)),
    },
    halloween: {
      source: `Data: myspeedpuzzling.com · ${dayOf(hq.queried_at)}`,
      puzzles: hw.length, results: hwResults, octPct: Math.round((hwOct / hwResults) * 100),
      top: top ? { puzzle: top.puzzle, brand: top.brand, solvers: top.solvers } : null,
    },
  };
}
export type FunFacts = ReturnType<typeof funFacts>;

/** G3 D1: what one extra hour buys at the median solo pace. */
function clockFacts() {
  const q = query('bs-solo-medians');
  const med: Record<number, number> = Object.fromEntries(q.rows.map(r => [Number(r.pieces_count), Number(r.p50)]));
  const HOUR = 60;
  const m500 = med[500], m100 = med[100], m1000 = med[1000];
  const n100 = Math.floor(HOUR / m100);
  const t = (m: number) => Math.round(m * 10);
  let best = { total: 0, sizes: [] as number[] };
  for (let c3 = 0; c3 * t(med[300]) <= 600; c3++) for (let c2 = 0; c3 * t(med[300]) + c2 * t(med[200]) <= 600; c2++) for (let c1 = 0; ; c1++) {
    const total = c3 * t(med[300]) + c2 * t(med[200]) + c1 * t(m100);
    if (total > 600) break;
    const sizes = [...Array(c3).fill(300), ...Array(c2).fill(200), ...Array(c1).fill(100)];
    if (new Set(sizes).size < 2) continue;
    if (total > best.total || (total === best.total && sizes.length < best.sizes.length)) best = { total, sizes };
  }
  const year = new Date(q.queried_at).getUTCFullYear();
  const eu = new Date(Date.UTC(year, 10, 0)); eu.setUTCDate(eu.getUTCDate() - eu.getUTCDay());
  const us = new Date(Date.UTC(year, 10, 1)); us.setUTCDate(us.getUTCDate() + ((7 - us.getUTCDay()) % 7));
  return {
    source: source('bs-solo-medians'),
    med, m500, m100, m1000,
    pct500: Math.round((HOUR / m500) * 100),
    short500: m500 - HOUR,
    n100, tea: HOUR - n100 * m100,
    mix: { sizes: best.sizes, total: best.total / 10 },
    pct1000: Math.round((HOUR / m1000) * 100),
    eu: dayOf(ymd(eu), { day: 'numeric', month: 'short' }), us: dayOf(ymd(us), { day: 'numeric', month: 'short' }),
    eve: dayOf(ymd(new Date(eu.getTime() - 864e5)), { weekday: 'short', day: 'numeric', month: 'short' }),
  };
}

/** G3 C1: stopwatch sessions on 500s by local start hour (Central Europe). */
function owlFacts() {
  const q = query('bs-stopwatch-hour-speed');
  const MIN_N = 30;
  const hours = q.rows.filter(r => r.kind === 'hour').map(r => ({ h: Number(r.k), n: Number(r.n), med: Number(r.median_min), noPause: Number(r.pct_no_pause) }));
  const part = (k: string) => {
    const r = q.rows.find(x => x.kind === 'daypart' && x.k.includes(k))!;
    const [a, b] = r.k.split(' ')[2].split('-');
    return { n: Number(r.n), med: Number(r.median_min), noPause: Number(r.pct_no_pause), from: a, to: b };
  };
  const all = q.rows.find(r => r.kind === 'all')!;
  const share = q.rows.find(r => r.kind === 'share')!;
  const parts = { morning: part('morning'), day: part('day'), evening: part('evening'), night: part('night') };
  const isNight = (hr: number) => hr >= 22 || hr < 5;
  const shown = hours.filter(x => x.n >= MIN_N);
  const peak = hours.reduce((a, b) => (b.n > a.n ? b : a));
  const others = [parts.morning, parts.day, parts.evening];
  return {
    source: source('bs-stopwatch-hour-speed'),
    MIN_N, hours, shown, parts, isNight, peak,
    hidden: hours.filter(x => x.n < MIN_N),
    all: { n: Number(all.n), med: Number(all.median_min) },
    nightVsEvening: parts.evening.med - parts.night.med,
    noPauseOthers: [Math.min(...others.map(o => o.noPause)), Math.max(...others.map(o => o.noPause))],
    sessions: Number(share.n), results: Number(share.total), sharePct: Math.round((Number(share.n) / Number(share.total)) * 100),
    nightHours: shown.filter(x => isNight(x.h)),
  };
}

/** G3 G2: what result notes mention (counts only). */
function noteFacts() {
  const c = query('bs-comment-words').rows[0];
  const listing = query('bs-marketplace').rows.find(r => r.kind === 'listings_condition' && r.label === 'missing_pieces');
  const label: Record<string, string> = {
    missing_piece: 'a missing piece', edges: 'edges', positive: 'fun, love', hard: 'hard, tough', sky: 'the sky',
    interrupted: 'interruptions', tired: 'tired, sick', travel: 'holiday, travel', pb: 'a new PB', cat: 'a cat',
    kids: 'kids', family: 'family', drinks: 'coffee, tea, wine', dog: 'a dog',
  };
  const topics = Object.keys(label).map(k => ({ key: k, label: label[k], n: Number(c[k]) })).sort((a, b) => b.n - a.n);
  const missing = Number(c.missing_piece), notes = Number(c.comments), edges = Number(c.edges);
  return {
    source: source('bs-comment-words'),
    notes, missing, pct: (missing / notes) * 100, edges, ratio: missing / edges,
    topics, cat: Number(c.cat), dog: Number(c.dog),
    listings: listing ? Number(listing.value) : null,
  };
}

/** G3 D2: logged solving time against 75 years, projected at the recent daily pace. */
function lifeFacts() {
  const q = query('bs-milestone-pace');
  const r = q.rows[0];
  const YEAR_H = 365.25 * 24, target = 75 * YEAR_H;
  const hours = Number(r.hours), perDay = Number(r.hours_per_day);
  const toGo = Math.max(0, target - hours);
  const since = new Date(Date.parse(q.queried_at) - hours * 3600e3);
  return {
    source: source('bs-milestone-pace'),
    hours, years: hours / YEAR_H, perDay, toGo, daysToGo: toGo / perDay,
    reached: hours >= target,
    eta: dayOf(r.eta_75_years, { day: 'numeric', month: 'short' }),
    etaLong: dayOf(r.eta_75_years, { weekday: 'short', day: 'numeric', month: 'short' }),
    daysPerDay: perDay / 24,
    since: dayOf(ymd(since), { month: 'long', year: 'numeric' }),
    sinceYear: since.getUTCFullYear() + (since.getUTCMonth() + since.getUTCDate() / 31) / 12,
    nowYear: new Date(q.queried_at).getUTCFullYear() + (new Date(q.queried_at).getUTCMonth() + new Date(q.queried_at).getUTCDate() / 31) / 12,
  };
}

// ═════════════════════════════════════════════════════════════════════════════════════ box images
export interface BoxImg { url: string; ratio: number; credit: string; pieces: number }
/** A cached box image by puzzle name from a cached query (credit `Puzzle · Brand`); falls back to the first row. */
function boxFrom(queryName: string, name: string, preset: 'puzzle_large' | 'puzzle_medium' = 'puzzle_large'): BoxImg {
  const all = rows(queryName);
  const r = all.find(x => x.puzzle === name) ?? all[0];
  return { url: boxPaths(r.image, preset).url, ratio: Number(r.image_ratio ?? 1.36) || 1.36, credit: `${r.puzzle} · ${r.brand}`, pieces: Number(r.pieces) };
}
export const BOXES = {
  cats: () => boxFrom('boxes-cats-dogs', 'Cats on the Shelf'),
  edges: () => boxFrom('boxes-alltime-top', 'Boathouses in Smogen, Sweden'),
  lost: () => boxFrom('boxes-alltime-top', 'Lighthouse at Sunset'),
  five: () => boxFrom('boxes-alltime-top', 'New York Postcard'),
  thousand: () => boxFrom('boxes-month-top', 'Speed Puzzling', 'puzzle_medium'),
};

// ═════════════════════════════════════════════════════════════════════════════════════ art palette per ground
// The art never hard-codes a colour against the ground: every slide sets --a-* from its ground. fig = the main
// silhouette, hot = the joke's mark (coral; white on the coral ground), cool = the second colour, mute = a quiet
// step off the ground, shade = the one flat shadow, onHot/onCool = small type on those fills.
interface Pal { fig: string; hot: string; cool: string; mute: string; shade: string; onHot: string; onCool: string; ghost?: string; ghostLine?: string }
const PAL: Record<GroundKey, Pal> = {
  navy: { fig: '#ffffff', hot: '#ec726f', cool: '#69b3fe', mute: '#4b566b', shade: '#1d2433', onHot: '#1d2433', onCool: '#1d2433' },
  navyDeep: { fig: '#ffffff', hot: '#ec726f', cool: '#69b3fe', mute: '#3d475b', shade: '#161c27', onHot: '#1d2433', onCool: '#1d2433' },
  paper: { fig: '#2b3445', hot: '#ec726f', cool: '#4e54c8', mute: '#c3cad8', shade: '#d5dce6', onHot: '#1d2433', onCool: '#ffffff', ghost: '#2b3445', ghostLine: '#4b566b' },
  coral: { fig: '#1d2433', hot: '#ffffff', cool: '#211281', mute: '#ff8f8a', shade: '#ca5453', onHot: '#1d2433', onCool: '#ffffff' },
  sky: { fig: '#1d2433', hot: '#ec726f', cool: '#ffffff', mute: '#a8d9ff', shade: '#4892da', onHot: '#1d2433', onCool: '#1d2433' },
  indigo: { fig: '#ffffff', hot: '#ec726f', cool: '#69b3fe', mute: '#6f7ce6', shade: '#3d3eb0', onHot: '#1d2433', onCool: '#1d2433' },
  ocean: { fig: '#ffffff', hot: '#ec726f', cool: '#69b3fe', mute: '#2a74b9', shade: '#003b76', onHot: '#1d2433', onCool: '#1d2433' },
  green: { fig: '#1d2433', hot: '#ffffff', cool: '#211281', mute: '#8de8c1', shade: '#2fb57c', onHot: '#1d2433', onCool: '#ffffff' },
};
const artVars = (g: Ground) => {
  const p = PAL[g.key];
  return `--a-fig:${p.fig};--a-hot:${p.hot};--a-cool:${p.cool};--a-mute:${p.mute};--a-shade:${p.shade};--a-on-hot:${p.onHot};--a-on-cool:${p.onCool};--a-ghost:${p.ghost ?? '#ffffff'};--a-ghost-line:${p.ghostLine ?? p.shade}`;
};
const FIG = 'var(--a-fig)', HOT = 'var(--a-hot)', COOL = 'var(--a-cool)', MUTE = 'var(--a-mute)', SHADE = 'var(--a-shade)', BG = 'var(--g-bg)';
/** Sky-blue pieces for the "sorting the sky" joke: three near-identical brand sky tints (box art, fixed). */
const SKY_TINTS = ['#69b3fe', '#84c6ff', '#a8d9ff'];

// ═════════════════════════════════════════════════════════════════════════════════════ geometry helpers
const n = (v: number) => +v.toFixed(2);
const rad = (deg: number) => (deg * Math.PI) / 180;
const P = (cx: number, cy: number, r: number, deg: number): [number, number] => [n(cx + r * Math.cos(rad(deg))), n(cy + r * Math.sin(rad(deg)))];
const circ = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}Z`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${x0} ${y0}A${n(r)} ${n(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
};
const wedge = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 >= 359.99) return circ(cx, cy, r);
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
};
const sector = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const [x0, y0] = P(cx, cy, r1, a0), [x1, y1] = P(cx, cy, r1, a1), [x2, y2] = P(cx, cy, r0, a1), [x3, y3] = P(cx, cy, r0, a0);
  if (a1 - a0 >= 359.99) return circ(cx, cy, r1) + circ(cx, cy, r0);
  const L = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${n(r1)} ${n(r1)} 0 ${L} 1 ${x1} ${y1}L${x2} ${y2}A${n(r0)} ${n(r0)} 0 ${L} 0 ${x3} ${y3}Z`;
};
/** Crescent moon: the disc minus a disc offset up-right (flat, no sparkles). */
function crescent(cx: number, cy: number, r: number) {
  const o = r * 0.58, k = Math.acos(o / (2 * r)), ax = -45;
  const a1 = ax + (k * 180) / Math.PI, a2 = ax - (k * 180) / Math.PI;
  const [x1, y1] = P(cx, cy, r, a1), [x2, y2] = P(cx, cy, r, a2);
  return `M${x1} ${y1}A${r} ${r} 0 1 1 ${x2} ${y2}A${r} ${r} 0 0 0 ${x1} ${y1}Z`;
}
const svgArt = (inner: string) => `<svg width="${W}" height="1350" viewBox="0 0 ${W} 1350" aria-hidden="true">${inner}</svg>`;
const rect = (x: number, y: number, w: number, hh: number, fill: string, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(hh)}" fill="${fill}"${extra}/>`;

// ---- pieces (only from the generator)
const cellCentre = (j: Jigsaw, p: Piece): [number, number] => {
  const o = j.options, pw = o.width / o.cols, ph = o.height / o.rows;
  return [o.x + (p.col + 0.5) * pw, o.y + (p.row + 0.5) * ph];
};
/** Transform that rotates a piece about its cell centre and moves that centre to `to`. */
const moveTo = (j: Jigsaw, p: Piece, to: [number, number], rot = 0) => {
  const [cx, cy] = cellCentre(j, p);
  return `translate(${n(to[0] - cx)} ${n(to[1] - cy)}) rotate(${n(rot)} ${n(cx)} ${n(cy)})`;
};
function extent(j: Jigsaw, p: Piece, rot: number): [number, number] {
  const [cx, cy] = cellCentre(j, p), b = p.bbox;
  const r = ((rot % 360) + 360) % 360;
  if (r === 0) return [cx - b.x, b.x + b.width - cx];
  if (r === 180) return [b.x + b.width - cx, cx - b.x];
  if (r === 90) return [b.y + b.height - cy, cy - b.y];
  return [cy - b.y, b.y + b.height - cy];
}
const piecePath = (d: string, fill: string, o: { tf?: string; stroke?: string; sw?: number; extra?: string } = {}) =>
  `<path d="${d}"${o.tf ? ` transform="${o.tf}"` : ''} fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 3}" stroke-linejoin="round"` : ''}${o.extra ?? ''}/>`;
/** One interior generator piece centred on (cx, cy). */
function onePiece(cx: number, cy: number, size: number, seed: number, fill: string, o: { rot?: number; stroke?: string; sw?: number; extra?: string } = {}) {
  const j = generateJigsaw({ cols: 3, rows: 3, width: size * 3, height: size * 3, seed, tabSize: 0.22, jitter: 0.02 });
  const p = j.pieces.find(q => q.col === 1 && q.row === 1)!;
  return piecePath(p.d, fill, { tf: moveTo(j, p, [cx, cy], o.rot ?? 0), stroke: o.stroke, sw: o.sw, extra: o.extra });
}
/**
 * A silhouette built from whole interlocking pieces: a jigsaw over the box, keeping every piece whose cell centre
 * lies inside `inside` (local coords around `origin`). The outline keeps the pieces' real knobs and blanks.
 */
function silhouette(origin: [number, number], box: { x0: number; y0: number; x1: number; y1: number }, s: number, seed: number, inside: (x: number, y: number) => boolean) {
  const c0 = Math.floor(box.x0 / s), c1 = Math.ceil(box.x1 / s), r0 = Math.floor(box.y0 / s), r1 = Math.ceil(box.y1 / s);
  const j = generateJigsaw({ cols: c1 - c0, rows: r1 - r0, width: (c1 - c0) * s, height: (r1 - r0) * s, x: origin[0] + c0 * s, y: origin[1] + r0 * s, seed, tabSize: 0.24, jitter: 0.03 });
  const keep = j.pieces.filter(p => { const [x, y] = cellCentre(j, p); return inside(x - origin[0], y - origin[1]); });
  return { j, keep };
}
/** A box image in a white mount (fixed white = a mount) with one flat offset shadow. Image is cropped to fill. */
function mountedBox(b: BoxImg, x: number, y: number, w: number, hh: number, id: string, o: { border?: number; shadow?: number } = {}) {
  const bd = o.border ?? 8, sh = o.shadow ?? 14;
  return [
    sh ? rect(x + sh, y + sh, w, hh, SHADE) : '',
    rect(x, y, w, hh, '#ffffff'),
    `<clipPath id="${id}"><rect x="${n(x + bd)}" y="${n(y + bd)}" width="${n(w - 2 * bd)}" height="${n(hh - 2 * bd)}"/></clipPath>`,
    `<image href="${b.url}" x="${n(x + bd)}" y="${n(y + bd)}" width="${n(w - 2 * bd)}" height="${n(hh - 2 * bd)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`,
  ].join('');
}

// ═════════════════════════════════════════════════════════════════════════════════════ panel layout
/** Art zone: y 190–790 (clear of the H2 seam knobs); the text block sits bottom-aligned above the footer. */
export const ART = { top: 190, bottom: 790, cx: 540, cy: 490 } as const;
const SEAM = 850;

export const FUN_CSS = `
.fa { position: absolute; left: 0; top: 0; width: ${W}px; height: 1350px; }
.fa > svg { position: absolute; left: 0; top: 0; }
.fj { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; flex-direction: column; justify-content: flex-end; gap: 16px; }
.fj-punch { font-size: 58px; line-height: 1.06; font-weight: 700; letter-spacing: -0.015em; color: var(--g-ink); text-wrap: balance; }
.fj-punch .hot { color: var(--g-hot); }
.fj-wink { font-size: 34px; line-height: 1.3; color: var(--g-soft); text-wrap: pretty; }
.fj-wink b { color: var(--g-ink); font-weight: 700; }
.fa-lab { position: absolute; font-size: 40px; font-weight: 700; line-height: 1; color: var(--g-ink); white-space: nowrap; }
.fa-cap { position: absolute; font-size: 30px; line-height: 1.2; color: var(--g-soft); }
.fa-cap b { color: var(--g-ink); font-weight: 700; display: block; font-size: 34px; }
.fa-type { position: absolute; margin: 0; font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; color: var(--g-ink); }
.fa-type.hot { color: var(--g-hot); }
.fa-type.soft { color: var(--g-soft); font-weight: 500; }
.fa-type .hot { color: var(--g-hot); }
.fa-type .c { display: inline-block; transform: translateY(-0.1em); }
.fa-k { position: absolute; font-size: 30px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--g-accent); white-space: nowrap; }
.fs-rows > div { display: flex; align-items: baseline; gap: 24px; padding: 14px 0; border-top: 2px solid var(--g-rule); }
.fs-rows b { font-size: 52px; font-weight: 700; letter-spacing: -0.01em; color: var(--g-ink); white-space: nowrap; }
.fs-rows span { font-size: 32px; line-height: 1.25; color: var(--g-soft); }
.fd-row { position: absolute; left: ${X0}px; width: ${CW}px; height: 250px; }
.fd-row .t { position: absolute; left: 280px; top: 52px; width: 624px; font-size: 52px; line-height: 1.05; font-weight: 700; letter-spacing: -0.01em; color: var(--g-ink); }
.fd-row .d { position: absolute; left: 280px; top: 124px; width: 624px; font-size: 34px; line-height: 1.3; color: var(--g-soft); }
.fd-row .d b { color: var(--g-ink); font-weight: 700; }
.fd-over { position: absolute; font-size: 34px; font-weight: 700; color: var(--g-hot-text); white-space: nowrap; }
.lost { position: absolute; background: #ffffff; border-radius: 6px; box-shadow: 0 18px 40px -12px rgba(16, 22, 34, 0.45); }
.lost .w { position: absolute; left: 0; width: 100%; text-align: center; font-size: 104px; font-weight: 800; letter-spacing: 0.08em; line-height: 1; color: var(--g-ink); }
`;
const STYLE = `<style>${FUN_CSS}</style>`;

export interface PanelSpec {
  kicker: string; src: string; art: string;
  /** Punchline HTML (wrap the turn in <span class="hot">) and the small wink line under it (or above: winkFirst). */
  punch: string; wink?: string; winkFirst?: boolean;
}
/** Punchline size: 70 px where the text zone has room (no poster seam) and it stays within two lines, else 58 px. */
function textFit(s: PanelSpec, room: number): { px: number; h: number } {
  const plain = (t: string) => t.replace(/<[^>]+>/g, '');
  const winkH = s.wink ? 16 + linesOf(plain(s.wink), 34) * 34 * 1.3 : 0;
  const hOf = (px: number) => linesOf(plain(s.punch), px, CW, true) * px * 1.06 + winkH;
  for (const px of [70, 64, 58]) if (linesOf(plain(s.punch), px, CW, true) <= 2 && hOf(px) <= room) return { px, h: hOf(px) };
  return { px: 54, h: hOf(54) };
}
/**
 * A funny-fact / story panel: art on the slide's ground, text bottom-aligned. In poster variants (H2) a cover or
 * fact slide becomes a two-piece poster: the art on the bold top piece, the text on the navy bottom piece.
 */
export function panel(x: SlideCtx, role: Role, s: PanelSpec): string {
  const v = x.v;
  const idx: [number, number] | undefined = x.of > 1 ? [x.slide, x.of] : undefined;
  const g = GROUNDS[v.ground(slotOf(x, role))];
  const layer = (shift = 0) => `<div class="fa" style="${groundVars(g)};${artVars(g)}${shift ? `; transform:translateY(${shift}px)` : ''}" data-qa-bg="${g.bg}">${s.art}</div>`;
  const textOf = (room: number) => {
    const p = `<p class="fj-punch" style="font-size:${textFit(s, room).px}px">${s.punch}</p>`, w = s.wink ? `<p class="fj-wink">${s.wink}</p>` : '';
    return s.winkFirst ? w + p : p + w;
  };
  if (posterAt(x) && (role === 'cover' || role === 'fact')) {
    const base = GROUNDS[v.posterBase ?? 'navyDeep'];
    const top = SEAM + Math.max(96, Math.round(seamReach().down) + 20);
    const under = `<svg class="h-poster-top" width="${W}" height="1350" viewBox="0 0 ${W} 1350" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${g.bg}"/></svg>${layer()}`;
    const body = `<div class="fj" style="top:${top}px; height:${FEED.contentBottom - top}px">${textOf(FEED.contentBottom - top)}</div>`;
    return frame({ ground: base.key, kicker: s.kicker, idx, device: v.device, body, src: s.src, under, noRule: true, headGround: g.key });
  }
  // No seam: the art moves down to sit centred between the header rule and the text block.
  const top = SEAM + 40, fit = textFit(s, FEED.contentBottom - top);
  const shift = Math.max(0, Math.min(90, Math.round((FEED.contentBottom - fit.h - 50 - ART.bottom) / 2)));
  const body = `${layer(shift)}<div class="fj" style="top:${top}px; height:${FEED.contentBottom - top}px">${textOf(FEED.contentBottom - top)}</div>`;
  return frame({ ground: g.key, kicker: s.kicker, idx, device: v.device, body, src: s.src });
}

/** A post builder: `make(ctx)` per slide with the slide's position known up front. */
function post(v: Variant, key: string, makers: Array<(c: SlideCtx) => string>, caption?: string): Post {
  return { key, caption, slides: makers.map((m, i) => ({ id: `${key}-${i + 1}`, body: STYLE + m({ v, post: key, slide: i + 1, of: makers.length }) })) };
}

// ═════════════════════════════════════════════════════════════════════════════════════ the jokes' art
// Each joke has three code-native approaches (J1 shows them side by side): a = built from real pieces / box images,
// b = bold flat poster geometry, c = type-led. fun.ts picks one per joke.
export type Approach = 'a' | 'b' | 'c';

// ---------------------------------------------------------------- minute 58
export function artMinute58(F: FunFacts, k: Approach): string {
  const m = F.minute.mode;
  const { cx } = ART, cy = 480;
  if (k === 'a') {
    // A stopwatch dial made of 60 interlocking pieces, one per minute: 1–57 laid, minute 58 being pressed in
    // (coral), 59 and 60 still empty slots. The crown is one more generator piece.
    const N = 60, R = 250, s = (2 * Math.PI * R) / N, hgt = 64;
    const j = generateJigsaw({ cols: N, rows: 3, width: N * s, height: 3 * hgt, seed: 58, tabSize: 0.2, jitter: 0.02 });
    const row = j.pieces.filter(p => p.row === 1).sort((a, b) => a.col - b.col);
    const out: string[] = [];
    row.forEach((p, i) => {
      const a = -90 + ((i + 0.5) * 360) / N;
      const minute = i + 1;
      if (minute > m) {
        out.push(piecePath(p.d, 'none', { tf: moveTo(j, p, P(cx, cy, R, a), a + 90), stroke: MUTE, sw: 3, extra: ' stroke-dasharray="6 7"' }));
      } else if (minute === m) {
        out.push(piecePath(p.d, HOT, { tf: moveTo(j, p, P(cx, cy, R + 40, a), a + 90 - 10), stroke: BG, sw: 2.5 }));
      } else {
        out.push(piecePath(p.d, minute % 5 === 0 ? FIG : COOL, { tf: moveTo(j, p, P(cx, cy, R, a), a + 90), stroke: BG, sw: 2.5 }));
      }
    });
    const [hx, hy] = P(cx, cy, R - 70, -90 + (m / 60) * 360 + 3);
    return svgArt(`${onePiece(cx + 70, cy - R - 58, 34, 4, FIG, { rot: 0 })}
      ${out.join('')}
      <path d="M${cx} ${cy}L${hx} ${hy}" stroke="${FIG}" stroke-width="16" stroke-linecap="butt"/>
      ${rect(cx - 22, cy - 22, 44, 44, FIG)}`);
  }
  if (k === 'b') {
    // Constructivist stopwatch, tilted: a flat disc, the 58-minute wedge in coral, a 2-minute sliver left; the hand is
    // negative space; three hard speed bars; one flat shadow.
    const R = 250, X = 590, tilt = -12;
    const a58 = -90 + (m / 60) * 360;
    const watch = `<g transform="rotate(${tilt} ${X} ${cy})">
      <path d="${circ(X + 22, cy + 22, R)}" fill="${SHADE}"/>
      <path d="${circ(X, cy, R)}" fill="${FIG}"/>
      <path d="${wedge(X, cy, R - 30, -90, a58)}" fill="${HOT}"/>
      ${rect(X - 46, cy - R - 64, 92, 46, FIG)}${rect(X - 16, cy - R - 22, 32, 26, FIG)}
      <g transform="rotate(45 ${X} ${cy})">${rect(X - 22, cy - R - 40, 44, 34, FIG)}</g>
      <path d="M${X} ${cy}L${P(X, cy, R - 30, a58)[0]} ${P(X, cy, R - 30, a58)[1]}" stroke="${BG}" stroke-width="22"/>
      <path d="${circ(X, cy, 30)}" fill="${BG}"/>
    </g>`;
    const bars = [[cy - 120, 210], [cy - 30, 150], [cy + 60, 250], [cy + 150, 120]].map(([y, w]) => rect(X0, y, w, 26, FIG)).join('');
    return svgArt(bars + watch);
  }
  // c: type. The finish you race for, and the one you don't want to see.
  const big = 290, base1 = 520;
  return `<p class="fa-k" style="left:${X0}px; top:${ART.top + 6}px">On the timer</p>
    <p class="fa-type" style="left:${X0}px; top:${n(base1 - 0.8425 * big)}px; font-size:${big}px"><span class="hot">${m}</span><span class="c">:</span>59</p>
    <p class="fa-type soft" style="left:${X0}px; top:${n(base1 + 70)}px; font-size:150px">1<span class="c">:</span>00<span class="c">:</span>00</p>
    ${svgArt(rect(X0 - 12, base1 + 70 + 150 * 0.47, 720, 18, 'var(--g-hot)'))}`;
}

// ---------------------------------------------------------------- unboxed (the cat on the box lid)
/**
 * A cat sitting, seen from behind (no face): capsule body, round head, two triangle ears, a tail that runs out along
 * the ground and curls up. (X, B) = middle of its base. Returns fill paths (union = the silhouette).
 */
function catShapes(X: number, B: number): string[] {
  return [
    `M${X - 128} ${B}V${B - 170}A128 128 0 0 1 ${X + 128} ${B - 170}V${B}Z`,
    circ(X, B - 332, 86),
    `M${X - 84} ${B - 352}L${X - 72} ${B - 456}L${X - 14} ${B - 408}Z`,
    `M${X + 84} ${B - 352}L${X + 72} ${B - 456}L${X + 14} ${B - 408}Z`,
    `M${X + 96} ${B - 36}H${X + 162}V${B}H${X + 96}Z`,
    sector(X + 162, B - 62, 26, 62, -150, 90),
  ];
}
export function artUnboxed(F: FunFacts, k: Approach, box = BOXES.cats()): string {
  const { cx } = ART;
  if (k === 'a') {
    // The real box lid (a cat puzzle) and, sitting right on it, a cat-shaped jigsaw: the generator's real cut lines
    // inside a smooth cat silhouette, like a wooden shaped puzzle. One flat shadow.
    const bw = 720, bh = Math.round(bw / Math.max(1.2, box.ratio)), bx = cx - bw / 2, by = 200;
    const X = cx - 30, B = by + bh - 8;
    const shapes = catShapes(X, B);
    const j = generateJigsaw({ cols: 8, rows: 9, width: 8 * 52, height: 9 * 52, x: X - 150, y: B - 468, seed: 7, tabSize: 0.24, jitter: 0.04 });
    const cat = `<clipPath id="cat"><path d="${shapes.join(' ')}"/></clipPath>
      <g transform="translate(12 12)">${shapes.map(d => `<path d="${d}" fill="${SHADE}"/>`).join('')}</g>
      ${shapes.map(d => `<path d="${d}" fill="#2b3445"/>`).join('')}
      <g clip-path="url(#cat)"><path d="${j.cuts}" fill="none" stroke="#69b3fe" stroke-opacity="0.55" stroke-width="2.5"/></g>`;
    return svgArt(mountedBox(box, bx, by, bw, bh, 'lid') + cat) +
      `<p class="fa-cap" data-qa-small style="left:${X0}px; top:${by + bh + 30}px">${h(box.credit)}</p>`;
  }
  if (k === 'b') {
    // Flat poster: a box lid (the picture as three flat shapes), a geometric cat in front: capsule body, round head,
    // two triangle ears, a thick quarter-circle tail. One flat shadow under the lid.
    const lx = 150, ly = 250, lw = 780, lh = 440;
    const pic = [
      rect(lx + 18, ly + 18, lw, lh, SHADE),
      rect(lx, ly, lw, lh, COOL),
      `<path d="${circ(lx + lw * 0.78, ly + lh * 0.3, 70)}" fill="${HOT}"/>`,
      `<path d="M${lx} ${ly + lh}L${lx + lw * 0.32} ${ly + lh * 0.42}L${lx + lw * 0.6} ${ly + lh}Z" fill="${MUTE}"/>`,
      `<path d="M${lx + lw * 0.42} ${ly + lh}L${lx + lw * 0.74} ${ly + lh * 0.56}L${lx + lw} ${ly + lh * 0.9}V${ly + lh}Z" fill="${MUTE}"/>`,
    ].join('');
    const X = cx - 30, B = ly + lh + 40;
    const cat = catShapes(X, B).map(d => `<path d="${d}" fill="${FIG}"/>`).join('');
    return svgArt(pic + cat);
  }
  // c: type. The box's contents list, corrected.
  const rowsT: Array<[string, string]> = [[`${F.sizes.small}`, 'pieces'], ['1', 'picture'], ['1', 'cat']];
  const top = ART.top + 70, rh = 160;
  const line = (i: number) => rect(X0, top + i * rh, CW, 4, FIG);
  return `<p class="fa-k" style="left:${X0}px; top:${ART.top + 6}px">Contents</p>
    ${svgArt([0, 1, 2, 3].map(line).join('') + rect(X0 - 6, top + rh + 76, 600, 16, 'var(--g-hot)'))}
    ${rowsT.map(([q, w], i) => `<p class="fa-type${i === 1 ? ' soft' : ''}${i === 2 ? ' hot' : ''}" style="left:${X0}px; top:${top + i * rh + 30}px; font-size:110px; letter-spacing:-0.02em">${q} ${w}</p>`).join('')}`;
}

// ---------------------------------------------------------------- twice the pieces (the balance)
export function art1000(F: FunFacts, k: Approach, big = BOXES.thousand(), small = BOXES.five()): string {
  const s = F.sizes, { cx } = ART;
  if (k === 'a') {
    // A balance built from real things: the beam is a strip of interlocking pieces, a real 1000 on the left, the same
    // real 500 three times on the right, level.
    const beamY = 640, arm = 300, N = 15, ps = 46;
    const j = generateJigsaw({ cols: N, rows: 3, width: N * ps, height: 3 * ps, x: cx - (N * ps) / 2, y: beamY - 1.5 * ps, seed: 31, tabSize: 0.22, jitter: 0.02 });
    const beam = j.pieces.filter(p => p.row === 1).map(p => piecePath(p.d, FIG, { stroke: BG, sw: 3 })).join('');
    const fulcrum = `<path d="M${cx} ${beamY + 18}L${cx + 70} ${ART.bottom}H${cx - 70}Z" fill="${FIG}"/>`;
    const bw = 330, bh = 236, lx = cx - arm - bw / 2;
    const sw = 250, sh = 136, rx = cx + arm - sw / 2;
    const stack = [0, 1, 2].map(i => mountedBox(small, rx + (i === 1 ? 10 : 0), beamY - 26 - (i + 1) * (sh + 6), sw, sh, `s${i}`, { border: 6, shadow: 0 })).join('');
    const tag = (x: number, y: number, t: string) => `<rect x="${x}" y="${y}" width="${t.length * 24 + 26}" height="50" fill="${HOT}"/><text x="${x + 13}" y="${y + 37}" style="font-size:36px; font-weight:700" fill="var(--a-on-hot)">${t}</text>`;
    return svgArt(fulcrum + beam + mountedBox(big, lx, beamY - 26 - bh, bw, bh, 'big', { shadow: 0 }) + stack +
      tag(lx + 12, beamY - 26 - bh + 12, String(s.big)) + [0, 1, 2].map(i => tag(rx + 12 + (i === 1 ? 10 : 0), beamY - 26 - (i + 1) * (sh + 6) + 10, String(s.small))).join('')) +
      `<p class="fa-cap" style="left:${X0}px; top:${beamY + 44}px; width:340px">${h(big.credit)}</p>
       <p class="fa-cap" style="right:${W - X1}px; top:${beamY + 44}px; width:340px; text-align:right">${h(small.credit)}</p>`;
  }
  if (k === 'b') {
    // Flat balance: triangle, thick beam, one big coral square against three stacked sky bars, level.
    const beamY = 630, arm = 290;
    const sq = 280, bw = 240, bh = 92;
    const blocks = [
      rect(cx - arm - sq / 2, beamY - sq, sq, sq, HOT),
      `<text x="${cx - arm}" y="${beamY - sq / 2 + 26}" text-anchor="middle" style="font-size:76px; font-weight:700" fill="var(--a-on-hot)">${s.big}</text>`,
      ...[0, 1, 2].map(i => rect(cx + arm - bw / 2, beamY - (i + 1) * (bh + 8) + 8, bw, bh, COOL) +
        `<text x="${cx + arm}" y="${beamY - (i + 1) * (bh + 8) + 8 + bh / 2 + 18}" text-anchor="middle" style="font-size:50px; font-weight:700" fill="var(--a-on-cool)">${s.small}</text>`),
    ].join('');
    return svgArt(`${rect(cx - arm - 170, beamY, 2 * arm + 340, 26, FIG)}
      <path d="M${cx} ${beamY + 26}L${cx + 110} ${ART.bottom - 20}H${cx - 110}Z" fill="${FIG}"/>
      ${rect(cx - 210, ART.bottom - 20, 420, 20, FIG)}${blocks}`);
  }
  // c: type. Two multipliers; the second one is the joke.
  const rowsT = [
    { x: `×${s.pieceRatio}`, k: 'Pieces', d: `${s.small} → ${s.big}`, hot: false },
    { x: `×${s.timeRatio}`, k: 'The evening', d: `${s.medSmall} → ${s.medBig}`, hot: true },
  ];
  const size = 250, rh = 280, top = ART.top + 10;
  return svgArt(rect(X0, top + rh - 4, CW, 4, 'var(--g-rule)')) + rowsT.map((r, i) => `
    <p class="fa-type${r.hot ? ' hot' : ''}" style="left:${X0}px; top:${top + i * rh + 12}px; font-size:${size}px">${h(r.x)}</p>
    <p class="fa-k" style="left:${X0 + 420}px; top:${top + i * rh + 70}px">${h(r.k)}</p>
    <p class="fa-type" style="left:${X0 + 420}px; top:${top + i * rh + 124}px; font-size:52px; letter-spacing:-0.01em">${r.d.replace(/:/g, '<span class="c">:</span>')}</p>`).join('');
}

// ---------------------------------------------------------------- Halloween
const GHOST_R = 150;
/** Sheet ghost in local coords (origin = hem centre, y up negative): dome, straight sides, three scallops. */
function ghostInside(x: number, y: number) {
  const R = GHOST_R, domeY = -440 + R;
  if (y <= domeY) return x * x + (y - domeY) ** 2 <= R * R;
  if (Math.abs(x) > R) return false;
  const hem = -24 - 36 * Math.abs(Math.sin((Math.PI * (x + R)) / ((2 * R) / 3)));
  return y <= hem + 30;
}
function shelf(y: number, spines: Array<[number, number, number, string]>) {
  return rect(X0 - 20, y, CW + 40, 18, FIG) + spines.map(([x, w, hh, c]) => rect(x, y - hh, w, hh, c)).join('');
}
const SPINES: Array<[number, number, number, string]> = [
  [96, 52, 196, MUTE], [154, 40, 232, COOL], [200, 60, 170, MUTE], [266, 44, 214, MUTE], [316, 56, 186, MUTE],
  [744, 48, 222, MUTE], [798, 62, 176, MUTE], [866, 40, 240, COOL], [912, 58, 198, MUTE],
];
export function artHalloween(F: FunFacts, k: Approach): string {
  const { cx } = ART, shelfY = 764;
  if (k === 'a') {
    // A ghost made of interlocking pieces rising off the shelf; its eyes are two missing pieces.
    const s = 30;
    const g = silhouette([cx, shelfY - 4], { x0: -GHOST_R - s, y0: -460, x1: GHOST_R + s, y1: 0 }, s, 13, ghostInside);
    const centres = g.keep.map(p => cellCentre(g.j, p));
    const eye = (ex: number) => { let bi = 0, bd = Infinity; centres.forEach(([x, y], i) => { const d = Math.hypot(x - (cx + ex), y - (shelfY - 4 - 300)); if (d < bd) { bd = d; bi = i; } }); return bi; };
    const holes = new Set([eye(-52), eye(52)]);
    const kept = g.keep.filter((_, i) => !holes.has(i));
    const shadow = kept.map(p => piecePath(p.d, SHADE, { tf: 'translate(14 12)' })).join('');
    const ghost = kept.map(p => piecePath(p.d, 'var(--a-ghost)', { stroke: 'var(--a-ghost-line)', sw: 1.5 })).join('');
    return svgArt(`<path d="${circ(866, 320, 64)}" fill="${HOT}"/>${shelf(shelfY, SPINES)}${shadow}${ghost}`);
  }
  if (k === 'b') {
    // Flat poster: a coral moon with the ghost cut out of it as negative space; the shelf below.
    const R = 246, my = 470;
    const gx = cx, gTop = my - 180, gR = 96, hemY = my + 150;
    const zig = Array.from({ length: 6 }, (_, i) => `L${n(gx + gR - (i + 0.5) * (2 * gR / 6))} ${i % 2 ? hemY : hemY - 34}`).join('');
    const ghost = `M${gx - gR} ${gTop + gR}A${gR} ${gR} 0 0 1 ${gx + gR} ${gTop + gR}V${hemY}${zig}L${gx - gR} ${hemY}Z`;
    return svgArt(`<path d="${circ(cx, my, R)}" fill="${HOT}"/>
      <path d="${ghost}" fill="${BG}"/>
      ${rect(gx - 46, gTop + 96, 26, 40, HOT)}${rect(gx + 20, gTop + 96, 26, 40, HOT)}
      ${shelf(shelfY, SPINES)}`);
  }
  // c: type. The year in months; October is the only one that's solid.
  const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const cw = CW / 4, rh = 170, top = ART.top + 50;
  return svgArt(M.map((mo, i) => {
    const x = X0 + (i % 4 + 0.5) * cw, y = top + Math.floor(i / 4) * rh + 120;
    return mo === 'OCT'
      ? `<text x="${n(x)}" y="${y}" text-anchor="middle" style="font-size:92px; font-weight:800" fill="var(--g-hot)">${mo}</text>`
      : `<text x="${n(x)}" y="${y}" text-anchor="middle" style="font-size:92px; font-weight:800" fill="none" stroke="var(--g-soft)" stroke-width="2">${mo}</text>`;
  }).join(''));
}

// ═════════════════════════════════════════════════════════════════════════════════════ the six funny facts
const SERIES_KICKER = 'Meanwhile, at the puzzle table';

function funMinute58(F: FunFacts, v: Variant): Post {
  const m = F.minute;
  return post(v, 'fun-minute-58', [
    x => panel(x, 'cover', {
      kicker: SERIES_KICKER, src: F.source, art: artMinute58(F, 'b'),
      punch: `Nothing focuses the mind like <span class="hot">minute ${m.mode}.</span>`, wink: `More solo 500s on MSP finish in minute ${m.mode} than in any other: <b>${fmtInt(m.results)}</b> of them.`,
    }),
  ], `More solo 500s on MSP finish in minute ${m.mode} than in any other minute: ${fmtInt(m.results)} of them. From minute 59 to minute 60, the count drops ${Math.abs(m.drop)}%.\n\nOur guess: nobody wants to see 1:00:xx on the timer, so minute ${m.mode} is when the sorting gets very, very efficient.\n\nKnow someone who stops the clock at 59:59? This one's for them.\n\n#speedpuzzling #jigsawpuzzle`);
}

function funUnboxed(F: FunFacts, v: Variant): Post {
  const box = BOXES.cats();
  return post(v, 'fun-unboxed', [
    x => panel(x, 'cover', {
      kicker: SERIES_KICKER, src: 'myspeedpuzzling.com', art: artUnboxed(F, 'a', box),
      punch: `Unboxed. <span class="hot">Not by choice.</span>`, wink: 'Still claiming the unboxed XP bonus.',
    }),
  ], `Unboxed: solved without looking at the picture on the box. Some of you do it for the challenge and the unboxed XP bonus. Some of you have a cat.\n\nDoes it still count if the cat chose for you? Asking for a friend.\n\nSend this to the puzzler whose cat has a favourite box lid.\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`);
}

function fun1000(F: FunFacts, v: Variant): Post {
  const s = F.sizes;
  return post(v, 'fun-1000', [
    x => panel(x, 'cover', {
      kicker: SERIES_KICKER, src: F.source, art: art1000(F, 'b'),
      punch: `${times(s.pieceRatio)} the pieces. <span class="hot">${times(s.timeRatio)} the evening.</span>`, wink: `Median solo time on MSP: <b>${s.medSmall}</b> for a ${s.small}, <b>${s.medBig}</b> for a ${s.big}.`,
    }),
  ], `A ${s.big} has ${s.pieceRatio === 2 ? 'twice' : `${s.pieceRatio}×`} the pieces of a ${s.small}. On MSP, the median solo ${s.big} takes ${s.medBig}, about ${times(s.timeRatio).toLowerCase()} the median solo ${s.small} (${s.medSmall}).\n\nOur guess: every extra piece is one more piece to search through for every placement, and that adds up fast.\n\nHow long did your last ${s.big} take?\n\n#speedpuzzling #jigsawpuzzle`);
}

/** Edges first / edges last: the same real box image cut into a 7×5 jigsaw, two ways of building it. */
function funEdges(_F: FunFacts, v: Variant): Post {
  const box = BOXES.edges();
  const C = 7, R = 5, S = 64, PW = C * S, PH = R * S, ox = (W - PW) / 2, oy = 206;
  const jig = generateJigsaw({ cols: C, rows: R, width: PW, height: PH, x: ox, y: oy, seed: 15, tabSize: 0.22, jitter: 0.03 });
  const isEdge = (p: Piece) => p.col === 0 || p.row === 0 || p.col === C - 1 || p.row === R - 1;
  const defs = `<defs><image id="pic" href="${box.url}" x="${ox}" y="${oy}" width="${PW}" height="${PH}" preserveAspectRatio="xMidYMid slice"/>${jig.pieces.map((p, i) => `<clipPath id="pc${i}"><path d="${p.d}"/></clipPath>`).join('')}</defs>`;
  const draw = (p: Piece, tf = '') => {
    const i = jig.pieces.indexOf(p);
    return `<g${tf ? ` transform="${tf}"` : ''}><g clip-path="url(#pc${i})"><use href="#pic"/></g><path d="${p.d}" fill="none" stroke="${BG}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  };
  const footprint = rect(ox - 10, oy - 10, PW + 20, PH + 20, 'none', ` stroke="${MUTE}" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"`);
  // edges last: the border pieces wait in three sorted rows, flat side down
  const rotOf = (p: Piece) => p.row === 0 && p.col === 0 ? -90 : p.row === 0 && p.col === C - 1 ? 90 : p.row === 0 ? 180 : p.row === R - 1 ? 0 : p.col === 0 ? -90 : 90;
  const queueRows = [jig.pieces.filter(p => p.row === 0), jig.pieces.filter(p => p.row === R - 1),
    [...jig.pieces.filter(p => p.col === 0 && p.row > 0 && p.row < R - 1), ...jig.pieces.filter(p => p.col === C - 1 && p.row > 0 && p.row < R - 1)]];
  const queue: string[] = [];
  queueRows.forEach((row, ri) => {
    const ex = row.map(p => extent(jig, p, rotOf(p)));
    const gap = 18, total = ex.reduce((s, e) => s + e[0] + e[1], 0) + gap * (row.length - 1);
    let x = (W - total) / 2;
    const baseY = oy + PH + 84 + ri * 80;
    row.forEach((p, i) => { x += ex[i][0]; queue.push(draw(p, moveTo(jig, p, [x, baseY - S / 2], rotOf(p)))); x += ex[i][1] + gap; });
  });
  // edges first: the middle pieces lie about in a loose spread
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const mid = jig.pieces.filter(p => !isEdge(p));
  const order = mid.map(p => ({ p, k: rnd() })).sort((a, b) => a.k - b.k).map(o => o.p);
  const spread = order.map((p, i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const x = 150 + col * 112 + (row % 2 ? 56 : 0) + (rnd() - 0.5) * 20;
    const y = oy + PH + 100 + row * 116 + (rnd() - 0.5) * 16;
    return draw(p, moveTo(jig, p, [x, y], Math.round((rnd() - 0.5) * 140)));
  });
  const credit = `Puzzle: ${box.credit}`;
  return post(v, 'fun-edges', [
    x => panel(x, 'cover', {
      kicker: SERIES_KICKER, src: credit, art: svgArt(defs + footprint + jig.pieces.filter(isEdge).map(p => draw(p)).join('') + spread.join('')),
      punch: `Edges first: <span class="hot">the correct way.</span>`, wink: 'The middle pieces have been waiting since 0:00.',
    }),
    x => panel(x, 'cover', {
      kicker: SERIES_KICKER, src: credit, art: svgArt(defs + footprint + mid.map(p => draw(p)).join('') + queue.join('')),
      punch: `Edges last: <span class="hot">also the correct way.</span>`, wink: 'The edge pieces have been waiting since 0:00.',
    }),
  ], `Edges first or edges last? Both camps finish puzzles. Neither camp is switching.\n\nEdges first gives you a frame to build into. Edges last lets the picture tell you where every border piece goes.\n\nWhich camp are you in, and why?\n\n#speedpuzzling #jigsawpuzzle`);
}

/** Sorting the sky: four flat trays; the pieces are three sky tints that are, honestly, the same blue. */
function funSky(_F: FunFacts, v: Variant): Post {
  const S = 60;
  const jig = generateJigsaw({ cols: 8, rows: 6, width: 8 * S, height: 6 * S, seed: 23, tabSize: 0.22, jitter: 0.03 });
  const inner = jig.pieces.filter(p => p.col > 0 && p.row > 0 && p.col < 7 && p.row < 5);
  const tw = 436, th = 230, xs = [X0, X1 - tw], ys = [ART.top + 60, ART.top + 60 + th + 76];
  const labels = ['sky', 'also sky', 'sky?', 'not sky'];
  let seed = 3;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const art: string[] = [], tags: string[] = [];
  let k = 0;
  labels.forEach((label, t) => {
    const x = xs[t % 2], y = ys[Math.floor(t / 2)];
    art.push(rect(x, y, tw, th, MUTE));
    if (t < 3) {
      for (let i = 0; i < 6; i++) {
        const p = inner[k++ % inner.length];
        const cx = x + tw / 2 + ((i % 3) - 1) * 124 + (rnd() - 0.5) * 12, cy = y + th / 2 + (Math.floor(i / 3) - 0.5) * 96 + (rnd() - 0.5) * 8;
        art.push(piecePath(p.d, SKY_TINTS[Math.floor(rnd() * 3)], { tf: moveTo(jig, p, [cx, cy], Math.floor(rnd() * 4) * 90 + (rnd() - 0.5) * 16), stroke: MUTE, sw: 3 }));
      }
    } else {
      const p = inner[k++ % inner.length];
      art.push(piecePath(p.d, HOT, { tf: moveTo(jig, p, [x + tw / 2, y + th / 2], -8), stroke: MUTE, sw: 3 }));
    }
    tags.push(`<p class="fa-lab" style="left:${x}px; top:${y - 54}px">${h(label)}</p>`);
  });
  return post(v, 'fun-sky', [
    x => panel(x, 'cover', {
      kicker: SERIES_KICKER, src: 'myspeedpuzzling.com', art: svgArt(art.join('')) + tags.join(''),
      punch: `Sorting the <span class="hot">sky section.</span>`, wink: 'Tip: sort the sky by shape. The colour stopped helping a while ago.',
    }),
  ], `Every sky section, every time.\n\nThe usual advice: once the colour stops helping, sort by shape. Count the knobs, look at the corners and stop staring at the blue.\n\nWhat's your most dreaded section: sky, fur or grass?\n\n#speedpuzzling #jigsawpuzzle`);
}

function funHalloween(F: FunFacts, v: Variant): Post {
  const hw = F.halloween, top = hw.top;
  return post(v, 'fun-halloween', [
    x => panel(x, 'cover', {
      kicker: 'Halloween special', src: hw.source, art: artHalloween(F, 'a'),
      punch: `The other eleven months, <span class="hot">they haunt the shelf.</span>`, wink: `<b>${hw.octPct}%</b> of all solves of puzzles with “Halloween” in the name happen in October.`, winkFirst: true,
    }),
  ], `Halloween puzzles know their season: ${hw.octPct}% of all results on puzzles with "Halloween" in the name were solved in October.${top ? `\n\nThe most-solved one on MSP: ${top.puzzle} by ${top.brand}, logged by ${fmtInt(top.solvers)} puzzlers.` : ''}\n\nWhich spooky puzzle comes off your shelf this month?\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`);
}

// ═════════════════════════════════════════════════════════════════════════════════════ timely stories
// ---------------------------------------------------------------- clocks go back
/** A real 500-piece jigsaw (50 × 10) laid column by column up to `placed` pieces; the rest are empty slots. */
function puzzleBar(placed: number, width = CW) {
  const cols = 50, rws = 10, s = width / cols;
  const j = generateJigsaw({ cols, rows: rws, width, height: rws * s, seed: 500, tabSize: 0.22, jitter: 0.03 });
  const order = [...j.pieces].sort((a, b) => a.col - b.col || a.row - b.row);
  const done = order.slice(0, placed).map(p => p.d).join(' '), todo = order.slice(placed).map(p => p.d).join(' ');
  return `<svg width="${width}" height="${f1(rws * s + 8)}" viewBox="-2 -4 ${width + 4} ${f1(rws * s + 8)}" style="display:block" aria-hidden="true">
    <path d="${done}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="${todo}" fill="none" stroke="var(--c-base)" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

function clocksBack(v: Variant): Post {
  const F = clockFacts();
  const mix = F.mix.sizes;
  const mixLabel = mix.length === 2 ? `A ${mix[0]} and a ${mix[1]}` : mix.join(' + ');
  const mixSum = mix.map(k => fmtDuration(F.med[k])).join(' + ');
  const mixLeft = 60 - F.mix.total;
  const teaMin = Math.round(F.tea);
  const placed = Math.round((500 * F.pct500) / 100);
  const barH = Math.round((CW / 50) * 10) + 8;

  // An hour as a flat ring: segments per puzzle in the highlight, separated by the ground; tea in the cool colour.
  const R = 104, T = 40;
  const dial = (segs: Array<{ min: number; cool?: boolean }>, over = 0) => {
    const c = R + 46;
    let m = 0;
    const parts = segs.map(g => {
      const a0 = -90 + m * 6, a1 = -90 + Math.min(60, m + g.min) * 6;
      m += g.min;
      return `<path d="${sector(c, c, R - T / 2, R + T / 2, a0, a1)}" fill="${g.cool ? 'var(--c-cool)' : 'var(--c-hot)'}" fill-rule="evenodd" stroke="var(--g-bg)" stroke-width="6" stroke-linejoin="round"/>`;
    }).join('');
    const ov = over ? `<path d="${arc(c, c, R + T / 2 + 16, -90, -90 + over * 6)}" fill="none" stroke="var(--g-ink)" stroke-width="6" stroke-dasharray="2 12" stroke-linecap="round"/>` : '';
    return `<svg width="${2 * c}" height="${2 * c}" style="position:absolute; left:${110 - c}px; top:${125 - c}px" aria-hidden="true">
      <path d="${sector(c, c, R - T / 2, R + T / 2, -90, 270)}" fill="var(--g-band)" fill-rule="evenodd"/>${parts}${ov}</svg>`;
  };
  const row = (top: number, d: string, t: string, desc: string, extra = '') =>
    `<div class="fd-row" style="top:${top}px">${d}<p class="t">${t}</p><p class="d">${desc}</p>${extra}</div>`;
  const overAt = P(R + 46, R + 46, R + T / 2 + 16, -90 + F.short500 * 6);
  const k = 'Clocks go back tonight';

  return post(v, 'clocks-back', [
    x => cover(x, 'cover', {
      kicker: k, title: 'One free hour', src: F.source,
      dek: `Tonight the clocks go back. At the median solo pace, the extra hour gets you ${F.pct500}% of a 500: you'd stop ${fmtDuration(F.short500)} short.`,
      hero: { value: `${F.pct500}%`, hot: true, max: 300 },
      extra: `${puzzleBar(placed)}<p class="h-lab" style="margin-top:14px">A 500, laid at the median pace for one hour</p>`, extraHeight: barH + 56,
    }),
    x => slide(x, 'data', {
      kicker: k, src: F.source, title: 'What your free hour buys', body: `
      <p class="h-dek h-abs" style="top:258px; font-size:34px">At the median solo time on MSP, each ring is one hour</p>
      ${row(372, dial([{ min: 60 }], F.short500), 'Almost one 500', `Median solo 500: <b>${fmtDuration(F.m500)}</b>. The hour runs out ${fmtDuration(F.short500)} before the last piece.`,
        `<span class="fd-over" style="left:${n(110 - R - 46 + overAt[0] + 14)}px; top:${n(125 - R - 46 + overAt[1] - 44)}px">+${fmtDuration(F.short500)}</span>`)}
      ${row(640, dial([...[...Array(F.n100)].map(() => ({ min: F.m100, cool: false })), { min: F.tea, cool: true }]), `${cap(word(F.n100))} 100s, then tea`, `Median solo 100: <b>${fmtDuration(F.m100)}</b>. That leaves ${teaMin} minutes for the kettle.`)}
      ${row(908, dial(mix.map(k2 => ({ min: F.med[k2] }))), mixLabel, `<b>${mixSum}</b>${mixLeft < 0.05 ? '. Exactly one hour.' : `, with ${fmtDuration(mixLeft)} to spare.`}`)}` }).html,
  ], `Clocks go back tonight in most of Europe, so you get one free hour. The median solo 500 on MSP takes ${fmtDuration(F.m500)}: your extra hour covers ${F.pct500}% of it, ${fmtDuration(F.short500)} short.\n\nOther ways to spend it, at median solo pace: ${word(F.n100)} 100-piece puzzles (${fmtDuration(F.m100)} each) with ${teaMin} minutes left for tea, or ${mix.length === 2 ? `a ${mix[0]} and a ${mix[1]}` : mix.join(' + ')} (${mixSum}). A 1000? That hour gets you ${F.pct1000}% of the way.\n\nHow are you spending yours? (US and Canada: your turn comes on ${F.us}.)\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`);
}

// ---------------------------------------------------------------- night owls
function nightOwls(v: Variant): Post {
  const F = owlFacts();
  const p = F.parts;
  const k = 'Stopwatch data · Central Europe';
  // 24-hour dial on the art ground: flat hour band, bars in/out of the dashed all-day median ring, a flat crescent.
  const cx = ART.cx, cy = 478, Rf = 284, Rb = 236, Rref = 150, K = 10;
  const ang = (hr: number) => -90 + hr * 15;
  const s: string[] = [];
  s.push(`<path d="${sector(cx, cy, Rb, Rf, -90, 270)}" fill="${MUTE}" fill-rule="evenodd"/>`);
  for (const x of F.shown) {
    const r1 = Rref + K * (x.med - F.all.med);
    s.push(`<path d="${sector(cx, cy, Math.min(Rref, r1), Math.max(Rref, r1), ang(x.h) - 6, ang(x.h) + 6)}" fill="${F.isNight(x.h) ? HOT : COOL}"/>`);
  }
  for (const x of F.hidden) { const [hx, hy] = P(cx, cy, Rref, ang(x.h)); s.push(`<circle cx="${hx}" cy="${hy}" r="6" fill="${FIG}" fill-opacity="0.5"/>`); }
  s.push(`<circle cx="${cx}" cy="${cy}" r="${Rref}" fill="none" stroke="${FIG}" stroke-width="4" stroke-dasharray="10 9"/>`);
  const hid = F.hidden.map(x => x.h);
  const hiddenNote = hid.length ? `<path id="few" d="${arc(cx, cy, Rref + 24, ang(Math.min(...hid)) - 12, ang(Math.max(...hid)) + 12)}" fill="none"/><text style="font-size:30px" fill="var(--g-soft)"><textPath href="#few" startOffset="50%" text-anchor="middle">too few sessions</textPath></text>` : '';
  for (let hr = 0; hr < 24; hr++) {
    if (hr % 6 === 0) continue;
    const [x1, y1] = P(cx, cy, Rb + 10, ang(hr)), [x2, y2] = P(cx, cy, Rb + (hr % 3 === 0 ? 26 : 18), ang(hr));
    s.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${FIG}" stroke-width="${hr % 3 === 0 ? 5 : 3}"/>`);
  }
  const labels = [0, 6, 12, 18].map(hr => { const [x, y] = P(cx, cy, (Rf + Rb) / 2, ang(hr)); return `<text x="${x}" y="${n(y + 12)}" text-anchor="middle" style="font-size:34px; font-weight:700" fill="${FIG}">${String(hr).padStart(2, '0')}</text>`; }).join('');
  s.push(`<path d="${crescent(cx - 4, cy + 4, 52)}" fill="${FIG}"/>`);
  const fast = F.nightHours.map(x => x.med);
  const dialArt = svgArt(s.join('') + labels + hiddenNote) +
    `<p class="fa-cap" style="left:${X0}px; top:${ART.bottom - 84}px"><b>${oneDec(F.all.med)} min</b>all-day median (dashed)</p>
     <p class="fa-cap" style="right:${W - X1}px; top:${ART.bottom - 84}px; text-align:right"><b>${oneDec(Math.min(...fast))}–${oneDec(Math.max(...fast))} min</b>starts 22:00–01:00</p>`;

  const parts = [
    { key: 'morning', name: 'Morning', ...p.morning }, { key: 'day', name: 'Daytime', ...p.day },
    { key: 'evening', name: 'Evening', ...p.evening }, { key: 'night', name: 'Night', ...p.night },
  ];
  const dom = 80, BWID = 560;
  const GW = CW, GH = 330;
  const g = barGeometry(F.hours, { x: d => d.h, y: d => d.n, width: GW, height: GH, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${F.isNight(b.datum.h) ? 'var(--c-hot)' : 'var(--c-base)'}"/>`).join('');
  const pk = g.bars.find(b => b.datum.h === F.peak.h)!;
  const band = (hr: number) => g.xScale(String(hr))! + g.xScale.bandwidth() / 2;
  const ticks = [0, 6, 12, 18, 23].map(hr => `<text class="c-lab" x="${f1(band(hr))}" y="${GH + 46}" text-anchor="middle">${String(hr).padStart(2, '0')}:00</text>`).join('');
  const nightN = F.hours.filter(x => F.isNight(x.h)).reduce((a, b) => a + b.n, 0);

  return post(v, 'night-owls', [
    x => panel(x, 'cover', {
      kicker: k, src: F.source, art: dialArt,
      punch: 'Night owls finish fastest', wink: 'Median minutes on a 500 by the hour the stopwatch started. Bars inside the dashed ring beat the all-day median.',
    }),
    x => slide(x, 'data', {
      kicker: k, src: F.source, title: `Started after 22:00, a 500 takes ${oneDec(F.nightVsEvening)} minutes less`, body: `
      <p class="h-dek h-abs" style="top:330px; font-size:34px">Median active time (pauses don't count), by start time</p>
      <div class="h-board" style="top:410px">
        ${parts.map(x2 => `<div class="h-br ${x2.key === 'night' ? 'hot' : ''}" style="height:136px">
          <div style="flex:1">
            <p class="nm">${x2.name} <span class="sub">${x2.from}:00–${x2.to}:00 · ${fmtInt(x2.n)} sessions</span></p>
            <svg width="${BWID}" height="22" style="margin-top:14px" aria-hidden="true"><rect width="${BWID}" height="22" fill="var(--g-band)"/><rect width="${f1((x2.med / dom) * BWID)}" height="22" fill="${x2.key === 'night' ? 'var(--c-hot)' : 'var(--c-base)'}"/></svg>
          </div>
          <span class="h-big ${x2.key === 'night' ? 'hot' : ''}" style="font-size:60px">${oneDec(x2.med)}<span style="font-size:32px; letter-spacing:0; color:var(--g-ink)"> min</span></span>
        </div>`).join('')}
      </div>
      <p class="h-dek h-abs" style="top:1010px; font-size:34px"><b style="color:var(--g-ink)">${Math.round(p.night.noPause)}%</b> of night sessions run without a single pause. Other times: ${Math.round(F.noPauseOthers[0])}–${Math.round(F.noPauseOthers[1])}%.</p>` }).html,
    x => slide(x, 'data', {
      kicker: k, src: F.source, title: `Most of you press start at ${String(F.peak.h).padStart(2, '0')}:00. Owls are rare.`, body: `
      <p class="h-dek h-abs" style="top:330px; font-size:34px">Stopwatch sessions on 500s by start hour, local time</p>
      <svg width="${GW}" height="${GH + 70}" style="position:absolute; left:${X0}px; top:450px" aria-hidden="true">
        ${bars}
        <text class="c-lab-b" x="${f1(pk.x + pk.width / 2)}" y="${f1(pk.y - 18)}" text-anchor="middle">${fmtInt(F.peak.n)}</text>
        ${ticks}
        <path d="${crescent(band(2), 170, 46)}" fill="var(--g-accent)"/>
      </svg>
      <p class="h-lab h-abs" style="top:880px; line-height:1.3">${fmtInt(F.all.n)} sessions, ${fmtInt(nightN)} of them started 22:00–05:00. Players in Central Europe only, the one region we can put on a single clock. The in-app stopwatch times about ${F.sharePct}% of all MSP results (${fmtInt(F.sessions)} sessions). Hours with fewer than ${F.MIN_N} sessions are left off the dial.</p>
      <p class="h-ask h-abs" style="top:1060px; font-size:48px">Owl or lark: when do you start yours?</p>` }).html,
  ], `Night owls finish fastest. Stopwatch sessions on 500-piece puzzles started between 22:00 and 05:00 take a median ${oneDec(p.night.med)} minutes of active time. Evening starts (${p.evening.from}:00 to ${p.evening.to}:00) take ${oneDec(p.evening.med)}.\n\nMost of you press start at ${String(F.peak.h).padStart(2, '0')}:00. After 22:00 it gets quiet and quick, with fewer pauses too: ${Math.round(p.night.noPause)}% of night sessions run without one.\n\nThe fine print: in-app stopwatch only (about ${F.sharePct}% of all results), players in Central Europe, local time. Late sessions are rare and probably keen solvers.\n\nOwl or lark: when do you start yours?\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`);
}

// ---------------------------------------------------------------- the missing piece
function missingPiece(v: Variant): Post {
  const F = noteFacts();
  const box = BOXES.lost();
  const k = 'From your result notes';
  // A real box picture cut into a 6×4 jigsaw with one piece gone; the same piece is the photo on the LOST poster.
  const C = 6, Rw = 4, S = 104, pw = C * S, ph = Rw * S;
  const jig = generateJigsaw({ cols: C, rows: Rw, width: pw, height: ph, x: 6, y: 6, seed: 12, tabSize: 0.22, jitter: 0.03 });
  const hole = jig.pieces.find(q => q.col === 2 && q.row === 1)!;
  const rest = jig.pieces.filter(q => q !== hole);
  const pic = `<image href="${box.url}" x="6" y="6" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice"/>`;
  const board = `<svg width="${pw + 12}" height="${ph + 12}" style="display:block" aria-hidden="true">
    <defs><clipPath id="mp-rest"><path d="${rest.map(q => q.d).join(' ')}"/></clipPath></defs>
    <g clip-path="url(#mp-rest)">${pic}</g>
    <path d="${rest.map(q => q.d).join(' ')}" fill="none" stroke="#2b3445" stroke-opacity="0.35" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${hole.d}" fill="none" stroke="var(--g-rule)" stroke-width="3" stroke-dasharray="4 8" stroke-linecap="round"/></svg>`;
  const boardH = ph + 12;
  // the lost piece, scaled up for the poster photo
  const [hcx, hcy] = cellCentre(jig, hole), zoom = 2.3;
  const lostPiece = `<svg width="300" height="300" style="position:absolute; left:60px; top:150px" aria-hidden="true">
    <defs><clipPath id="mp-hole"><path d="${hole.d}"/></clipPath></defs>
    <g transform="translate(150 150) rotate(-8) scale(${zoom}) translate(${n(-hcx)} ${n(-hcy)})"><g clip-path="url(#mp-hole)">${pic}</g></g></svg>`;
  const top = F.topics.slice(0, 7);
  const maxN = top[0].n;

  return post(v, 'missing-piece', [
    x => cover(x, 'fact', {
      kicker: k, title: 'result notes on MSP mention a missing piece', src: F.source,
      hero: { value: fmtInt(F.missing), max: 300 },
      extra: `${board}<p class="h-credit" style="margin-top:10px">${h(box.credit)}</p>`, extraHeight: boardH + 50,
    }),
    x => slide(x, 'data', {
      kicker: k, src: F.source, title: 'Missing pieces beat every other topic we counted', body: `
      <p class="h-dek h-abs" style="top:330px; font-size:34px">Result notes that mention each topic, of ${fmtInt(F.notes)} with text</p>
      <div class="h-board" style="top:410px">
        ${top.map((t, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:80px">
          <span class="nm" style="width:330px; flex:none; font-size:34px">${h(t.label)}</span>
          <svg width="400" height="30" aria-hidden="true"><rect width="${f1((t.n / maxN) * 400)}" height="30" fill="${i === 0 ? 'var(--c-hot)' : 'var(--c-base)'}"/></svg>
          <span class="tm" style="flex:1">${fmtInt(t.n)}</span></div>`).join('')}
      </div>
      <p class="h-dek h-abs" style="top:1020px; font-size:34px">And <b style="color:var(--g-ink)">${F.cat}</b> notes mention a cat. We're not saying anything.</p>` }).html,
    x => slide(x, 'image', {
      kicker: k, src: F.source, body: `
      <p class="h-title xl" style="top:${FEED.contentTop}px">Tell us your worst one</p>
      <p class="h-dek h-abs" style="top:290px">Under the sofa, in the vacuum, in the box all along, or never seen again?</p>
      <div class="lost" style="left:${X0 + 10}px; top:440px; width:420px; height:640px; transform:rotate(-3deg); ${groundVars(GROUNDS.paper)}" data-qa-bg="#ffffff">
        <p class="w" style="top:40px">LOST</p>
        ${lostPiece}
        <svg width="420" height="200" style="position:absolute; left:0; top:460px" aria-hidden="true">
          ${rect(70, 0, 280, 10, 'var(--g-rule)')}${rect(110, 32, 200, 10, 'var(--g-rule)')}
          ${rect(0, 78, 420, 3, 'var(--g-rule)')}
          ${Array.from({ length: 6 }, (_, i) => rect(i * 70 + 69, 78, 3, 102, 'var(--g-rule)') + rect(i * 70 + 30, 96, 10, 66, 'var(--g-soft)')).join('')}
        </svg>
      </div>
      ${F.listings != null ? `<p class="h-lead h-abs" style="left:590px; width:402px; top:760px; font-size:38px"><b>${fmtInt(F.listings)}</b> puzzles in the MSP marketplace are listed with missing pieces right now.</p>` : ''}` }).html,
  ], `${fmtInt(F.missing)} of your result notes on MSP mention a missing piece. That's more than any other topic we counted, ${F.ratio >= 1.75 && F.ratio < 2 ? 'almost twice as often' : F.ratio >= 2 ? `${Math.floor(F.ratio)} times as often` : `${oneDec(F.ratio)}× as often`} as edges (${fmtInt(F.edges)}).\n\nWe only counted words; nobody read your notes. Still, we suspect there are stories in there: the sofa, the vacuum cleaner, the cat. ${F.cat} notes mention a cat, by the way.\n\nTell us your worst one. Did the piece ever turn up?\n\n#speedpuzzling #jigsawpuzzle`);
}

// ---------------------------------------------------------------- 75 years
function seventyFive(v: Variant): Post {
  const F = lifeFacts();
  const k = 'MSP milestone';
  const full = Math.min(75, Math.floor(F.years));
  // 75 one-year pieces: rows of ten from one 10×8 jigsaw (the last row stops at 75); the years still to come wait
  // beside their slots.
  const CELL = 66, cols = 10, rowsN = 8, gw = cols * CELL, gh = rowsN * CELL, gx = 170, gy = ART.top + 20;
  const jig = generateJigsaw({ cols, rows: rowsN, width: gw, height: gh, x: gx, y: gy, seed: 75, tabSize: 0.22, jitter: 0.03 });
  const ordered = [...jig.pieces].sort((a, b) => a.row - b.row || a.col - b.col).slice(0, 75);
  const grid = ordered.map((q, i) => i < full
    ? piecePath(q.d, HOT, { stroke: BG, sw: 2.5 })
    : piecePath(q.d, 'none', { stroke: MUTE, sw: 3, extra: ' stroke-dasharray="3 8" stroke-linecap="round"' })).join('');
  const waiting = ordered.slice(full).map((q, i) => piecePath(q.d, FIG, { tf: moveTo(jig, q, [gx + (6.4 + i * 1.25) * CELL, gy + (rowsN - 0.5) * CELL + (i % 2 ? 4 : 14)], [-16, 10, -6][i % 3]), stroke: BG, sw: 2.5 })).join('');
  const rowLabel = Array.from({ length: rowsN }, (_, r) => `<text x="${gx + gw + 30}" y="${n(gy + (r + 0.5) * CELL + 11)}" style="font-size:30px" fill="var(--g-soft)">${Math.min(75, (r + 1) * 10)}</text>`).join('');
  const tl0 = 1950, tl1 = 2030, TW = CW, xs = (y: number) => ((y - tl0) / (tl1 - tl0)) * TW;
  const decades = Array.from({ length: 7 }, (_, i) => tl0 + 10 + i * 10);
  const head75 = F.reached ? '75 years of non-stop puzzling' : 'Almost 75 years of non-stop puzzling';
  // a flat hourglass: two triangles, the sand nearly through
  const hgX = 800, hgY = 690, hgW = 180, hgH = 420;
  const hourglass = `<svg width="${hgW}" height="${hgH}" style="position:absolute; left:${hgX}px; top:${hgY}px" aria-hidden="true">
    ${rect(0, 0, hgW, 22, 'var(--g-ink)')}${rect(0, hgH - 22, hgW, 22, 'var(--g-ink)')}
    <path d="M14 22H${hgW - 14}L${hgW / 2 + 8} ${hgH / 2}H${hgW / 2 - 8}Z" fill="var(--g-band)"/>
    <path d="M${hgW / 2 - 8} ${hgH / 2}H${hgW / 2 + 8}L${hgW - 14} ${hgH - 22}H14Z" fill="var(--g-band)"/>
    <path d="M${hgW / 2 - 30} ${hgH / 2 - 52}H${hgW / 2 + 30}L${hgW / 2 + 6} ${hgH / 2}H${hgW / 2 - 6}Z" fill="var(--c-hot)"/>
    ${rect(hgW / 2 - 3, hgH / 2, 6, 120, 'var(--c-hot)')}
    <path d="M${hgW / 2} ${hgH - 22 - 120}L${hgW - 26} ${hgH - 22}H26Z" fill="var(--c-hot)"/></svg>`;

  return post(v, '75-years', [
    x => panel(x, 'cover', {
      kicker: k, src: F.source, art: svgArt(grid + waiting + rowLabel),
      punch: h(head75), wink: `Solving time logged on MSP, one piece per year: <b>${F.years.toFixed(2)} years</b> so far.${F.reached ? ' We made it.' : ` 75 around <b>${F.eta}</b>.`}`,
    }),
    x => cover(x, 'fact', {
      kicker: k, title: `is about when we cross 75 years, at the pace of the last 4 weeks`, src: F.source,
      hero: { value: F.eta, max: 260 },
      extra: `<div class="fs-rows">
        <div><b>${fmtInt(F.hours)} h</b><span>logged so far (${F.years.toFixed(2)} years)</span></div>
        <div><b>+${fmtInt(F.perDay)} h</b><span>a day, the last 4 weeks' average</span></div>
        <div><b>${fmtInt(F.toGo)} h</b><span>to go: ${Math.round(F.daysToGo)} days at that pace</span></div>
      </div><p class="h-lab" style="margin-top:18px">Timed results only. The date moves with the pace, so we check it every day.</p>`, extraHeight: 330,
    }),
    x => slide(x, 'data', {
      kicker: k, src: F.source, title: `One puzzler, non-stop since ${F.since}`, body: `
      <p class="h-dek h-abs" style="top:330px">Put every logged hour end to end and that's where the first piece went down.</p>
      <svg width="${TW}" height="150" style="position:absolute; left:${X0}px; top:450px" aria-hidden="true">
        ${rect(0, 62, TW, 16, 'var(--g-band)')}
        ${rect(xs(F.sinceYear), 44, xs(F.nowYear) - xs(F.sinceYear), 52, 'var(--c-hot)')}
        ${decades.map(y => `<text class="c-lab" x="${f1(xs(y))}" y="140" text-anchor="middle">${y}</text>`).join('')}
        <text class="c-lab-b" x="${f1(xs(F.sinceYear))}" y="28">${F.since.split(' ')[1]}</text>
        <text class="c-lab-b" x="${f1(xs(F.nowYear))}" y="28" text-anchor="end">today</text>
      </svg>
      ${hero(String(Math.floor(F.daysPerDay)), { size: 220, baseline: 830 })}
      <p class="h-dek h-abs" style="top:862px; width:620px"><b style="color:var(--g-ink)">days</b> of puzzling logged every single day (${fmtInt(F.perDay)} hours)</p>
      <p class="h-ask h-abs" style="top:1010px; width:640px; font-size:48px">How many of those hours are yours?</p>
      ${hourglass}` }).html,
  ], `${F.years.toFixed(2)} years. That's how much solving time you've logged on MSP so far: ${fmtInt(F.hours)} hours. At the pace of the last 4 weeks (${fmtInt(F.perDay)} hours a day), we cross 75 years around ${F.eta}.\n\nHow we got the date: ${fmtInt(F.toGo)} hours to go, divided by ${fmtInt(F.perDay)} a day, is about ${Math.round(F.daysToGo)} days. Every single day you log ${Math.floor(F.daysPerDay)} days of puzzling.\n\nPut end to end, that's one puzzler at the table non-stop since ${F.since}.\n\nHow many of those hours are yours?\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`);
}

// ═════════════════════════════════════════════════════════════════════════════════════ family
const family: Family = {
  id: 'fun',
  name: 'Funny facts (F3) and timely stories (G3)',
  posts: (_c: Content, v: Variant) => {
    const F = funFacts();
    return [
      clocksBack(v), nightOwls(v), missingPiece(v), seventyFive(v),
      funMinute58(F, v), funUnboxed(F, v), fun1000(F, v), funEdges(F, v), funSky(F, v), funHalloween(F, v),
    ];
  },
};
export default family;
