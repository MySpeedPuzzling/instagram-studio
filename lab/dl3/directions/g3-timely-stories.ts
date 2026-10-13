// G3 · Timely stories (DL3): four brainstorm ideas that hang on a date or a moment.
//   clocks-back (D1)  Sat 24 Oct: what the free hour buys, from median solo times
//   night-owls  (C1)  a 24-hour dial of median 500 time by start hour (stopwatch, Central Europe)
//   missing-piece (G2) 640 result notes mention a missing piece (counts only, never a quote)
//   75-years    (D2)  logged solving time crosses 75 years, projected from the recent pace
// Drawn in the house illustration kit (D7/F3): ONE navy ink at one fixed stroke, details at 0.6×, same-hue two-stop
// washes lit top-left, white rim light + glint, deep-tone bevel shade, no faces, no numbers in the art. Every jigsaw
// piece comes from the generator. Every number comes from a cached query (re-query with --fresh before posting).
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import { LOGO_URL, barGeometry } from '../../../src/design/svg.ts';
import { query } from '../../../src/data/db.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../../dl1/types.ts';

// ── Facts ─────────────────────────────────────────────────────────────────────────────────────────────
const dayOf = (iso: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
const source = (name: string) => `Data: myspeedpuzzling.com · ${dayOf(query(name).queried_at)}`;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const oneDec = (v: number) => v.toFixed(1);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (k: number) => WORDS[k] ?? String(k);
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);

/** D1: what one extra hour buys at the median solo pace. */
function clockFacts() {
  const q = query('bs-solo-medians');
  const med: Record<number, number> = Object.fromEntries(q.rows.map(r => [Number(r.pieces_count), Number(r.p50)]));
  const HOUR = 60;
  const m500 = med[500], m100 = med[100], m1000 = med[1000];
  const n100 = Math.floor(HOUR / m100);
  // The fullest mix of at least two sizes (100/200/300) that fits the hour; tenths of a minute avoid float drift.
  const t = (m: number) => Math.round(m * 10);
  let best = { total: 0, sizes: [] as number[] };
  for (let c3 = 0; c3 * t(med[300]) <= 600; c3++) for (let c2 = 0; c3 * t(med[300]) + c2 * t(med[200]) <= 600; c2++) for (let c1 = 0; ; c1++) {
    const total = c3 * t(med[300]) + c2 * t(med[200]) + c1 * t(m100);
    if (total > 600) break;
    const sizes = [...Array(c3).fill(300), ...Array(c2).fill(200), ...Array(c1).fill(100)];
    if (new Set(sizes).size < 2) continue;
    if (total > best.total || (total === best.total && sizes.length < best.sizes.length)) best = { total, sizes };
  }
  // EU clocks go back on the last Sunday of October, the US on the first Sunday of November.
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

/** C1: stopwatch sessions on 500s by local start hour (Central Europe). */
function owlFacts() {
  const q = query('bs-stopwatch-hour-speed');
  const MIN_N = 30; // hours with fewer sessions are not drawn
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

/** G2: what result notes mention (counts only). */
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

/** D2: logged solving time against 75 years, projected at the recent daily pace. */
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

// ── House illustration kit (D7/F3) ────────────────────────────────────────────────────────────────────
const INK = '#2b3445';
const SW = 11;                 // the one outline weight, px on the 1080 canvas
const DET = 7;                 // interior details and small pieces (≥ 0.6 × SW)
const RIM = 0.4 * SW;
const IN = 0.95 * SW;
const CORAL = '#fb8180';

type Wash = 'coral' | 'pale' | 'sky' | 'lav' | 'face' | 'skyp' | 'lavp' | 'mat' | 'pic' | 'night' | 'well';
const WASH: Record<Wash, [string, string]> = {
  coral: ['#ffa6a3', '#f77b7c'],
  pale: ['#fff0ee', '#fdd3cf'],
  sky: ['#a8cefe', '#6aaef6'],
  lav: ['#b9b1fd', '#928bf1'],
  face: ['#ffffff', '#e3eaf6'],
  skyp: ['#f1f8ff', '#d6eaff'],
  lavp: ['#f4f2ff', '#e0dcff'],
  mat: ['#f6f4ff', '#e4e0fd'],
  pic: ['#d4e9ff', '#9fcbfb'],
  night: ['#a9a1f6', '#7e76e2'],
  well: ['#f3f6fa', '#dfe6f0'],
};
const DEEP: Record<Wash, string> = {
  coral: '#e15b5f', pale: '#efa59f', sky: '#3f88d6', lav: '#6b63d4', face: '#b9c6dc', skyp: '#9fc6ef', lavp: '#aaa3ec',
  mat: '#b4acef', pic: '#5f9fe6', night: '#5d55c9', well: '#b7c3d6',
};
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${(Object.keys(WASH) as Wash[]).map(k =>
  `<linearGradient id="w-${k}" x1="0.12" y1="0.04" x2="0.88" y2="0.96"><stop offset="0" stop-color="${WASH[k][0]}"/><stop offset="1" stop-color="${WASH[k][1]}"/></linearGradient>`).join('')}</defs></svg>`;

const n = (v: number) => +v.toFixed(2);
const rad = (deg: number) => (deg * Math.PI) / 180;
const P = (cx: number, cy: number, r: number, deg: number): [number, number] => [n(cx + r * Math.cos(rad(deg))), n(cy + r * Math.sin(rad(deg)))];
const circ = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}Z`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${x0} ${y0}A${n(r)} ${n(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
};
const rr = (x: number, y: number, w: number, hh: number, r: number) =>
  `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + hh - r)}A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + hh)}H${n(x + r)}A${r} ${r} 0 0 1 ${n(x)} ${n(y + hh - r)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z`;
/** Pie wedge from the centre, clockwise from a0 to a1 (SVG degrees). */
const wedge = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 >= 359.99) return circ(cx, cy, r);
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
};
/** Annular sector between radii r0 < r1, clockwise from a0 to a1. */
const sector = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const [x0, y0] = P(cx, cy, r1, a0), [x1, y1] = P(cx, cy, r1, a1), [x2, y2] = P(cx, cy, r0, a1), [x3, y3] = P(cx, cy, r0, a0);
  const L = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${n(r1)} ${n(r1)} 0 ${L} 1 ${x1} ${y1}L${x2} ${y2}A${n(r0)} ${n(r0)} 0 ${L} 0 ${x3} ${y3}Z`;
};

const fill = (d: string, w: Wash, extra = '') => `<path d="${d}" fill="url(#w-${w})"${extra}/>`;
const ink = (d: string, width = SW, extra = '') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const solid = (d: string) => `<path d="${d}" fill="${INK}"/>`;
const rim = (d: string) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="${RIM}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shade = (d: string, w: Wash) => `<path d="${d}" fill="none" stroke="${DEEP[w]}" stroke-opacity="0.45" stroke-width="${RIM}" stroke-linecap="round" stroke-linejoin="round"/>`;
const glint = (x: number, y: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.3 * SW)}" fill="#fff" fill-opacity="0.9"/>`;
const shape = (d: string, w: Wash, width = SW) => fill(d, w) + ink(d, width);

const rrLight = (x: number, y: number, w: number, hh: number, r: number, wash: Wash, o: { rim?: boolean; shade?: boolean; glint?: boolean } = {}) => {
  const i = IN, ri = Math.max(r - i, 1);
  const out: string[] = [];
  if (o.rim !== false) {
    const sy = y + Math.max(r, Math.min(hh * 0.62, hh - r - 2));
    out.push(rim(`M${n(x + i)} ${n(sy)}V${n(y + r)}A${n(ri)} ${n(ri)} 0 0 1 ${n(x + r)} ${n(y + i)}H${n(x + Math.max(r + 4, w * 0.42))}`));
    if (o.glint !== false) out.push(glint(x + Math.max(r + 4, w * 0.42) + 2.2 * SW, y + i));
  }
  if (o.shade !== false) {
    const sy = y + hh - Math.max(r, Math.min(hh * 0.62, hh - r - 2));
    out.push(shade(`M${n(x + w - i)} ${n(sy)}V${n(y + hh - r)}A${n(ri)} ${n(ri)} 0 0 1 ${n(x + w - r)} ${n(y + hh - i)}H${n(x + w - Math.max(r + 4, w * 0.42))}`, wash));
  }
  return out.join('');
};
const box = (x: number, y: number, w: number, hh: number, r: number, wash: Wash, o: { rim?: boolean; shade?: boolean; glint?: boolean; width?: number } = {}) =>
  fill(rr(x, y, w, hh, r), wash) + rrLight(x, y, w, hh, r, wash, o) + ink(rr(x, y, w, hh, r), o.width ?? SW);
const circLight = (cx: number, cy: number, r: number, wash: Wash, inset = IN) =>
  rim(arc(cx, cy, r - inset, 196, 246)) + glint(...P(cx, cy, r - inset, 258)) + shade(arc(cx, cy, r - inset, 18, 104), wash);

/** A generator piece (centre piece of a 3×3 jigsaw), centred on (cx, cy) and rotated. */
function piece(cx: number, cy: number, size: number, seed: number, wash: Wash | 'white', o: { rot?: number; stroke?: number; opacity?: number; dash?: string } = {}) {
  const jig = generateJigsaw({ cols: 3, rows: 3, width: size * 3, height: size * 3, seed, tabSize: 0.22, jitter: 0.02 });
  const p = jig.pieces.find(q => q.col === 1 && q.row === 1)!;
  const c = size * 1.5;
  const tf = `translate(${n(cx - c)} ${n(cy - c)}) rotate(${o.rot ?? 0} ${c} ${c})`;
  const paint = wash === 'white' ? `fill="#fff" fill-opacity="${o.opacity ?? 0.95}"` : `fill="url(#w-${wash})"`;
  const stroke = o.stroke === 0 ? '' : ` stroke="${INK}" stroke-width="${o.stroke ?? SW}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}" stroke-linecap="round"` : ''}`;
  return `<path d="${p.d}" transform="${tf}" ${paint}${stroke}/>`;
}

interface Art { w: number; h: number; base: number; svg: string }
const art = (w: number, hh: number, base: number, body: string): Art => ({ w, h: hh, base, svg: body });
const GROUND = 1150, X0 = 88, CW = 904;
const place = (a: Art, x: number, groundY = GROUND, rot = 0, k = 1) =>
  `<svg class="art" width="${n(a.w * k)}" height="${n(a.h * k)}" viewBox="0 0 ${a.w} ${a.h}" style="left:${n(x)}px; top:${n(groundY - a.base * k)}px${rot ? `; transform:rotate(${rot}deg)` : ''}" aria-hidden="true">${a.svg}</svg>`;

// ── Objects ───────────────────────────────────────────────────────────────────────────────────────────

/** Twin-bell alarm clock showing 2:00, the hour from 2 to 3 washed pale, a backwards arrow round its shoulder. */
function alarmClock(): Art {
  const R = 146, r = 112, cx = 290, cy = 222, base = cy + R + 38;
  const s: string[] = [];
  // a generator piece waiting on the ground beside it
  s.push(piece(cx - 236, base - 40, 56, 4, 'sky', { rot: -14 }));
  // legs, splayed, standing on the ground line
  for (const sx of [-1, 1]) {
    const leg = `M${cx + sx * 64} ${cy + 104}L${cx + sx * 86} ${cy + 116}L${cx + sx * 112} ${base}L${cx + sx * 76} ${base}Z`;
    s.push(shape(leg, 'lav'));
  }
  // bells (behind the body): domes pointing outwards, a knob on each, the striker between them
  for (const a of [-128, -52]) {
    const [bx, by] = P(cx, cy, R + 4, a);
    const dome = `M-58 0A58 58 0 0 1 58 0Z`;
    s.push(`<g transform="translate(${bx} ${by}) rotate(${a + 90})">
      ${shape(circ(0, -64, 11), 'sky', DET)}
      ${fill(dome, 'sky')}${rim(`M-40 -12A${58 - IN} ${58 - IN} 0 0 1 -8 ${-58 + IN}`)}${ink(dome)}
      ${box(-68, -6, 136, 20, 10, 'sky', { rim: false, glint: false })}</g>`);
  }
  s.push(ink(`M${cx} ${cy - R + 4}V${cy - R - 40}`) + shape(circ(cx, cy - R - 52, 15), 'coral', DET));
  // the backwards arrow: a coral ribbon round the right shoulder, running anticlockwise
  const Ra = R + 52, a0 = 50, a1 = -8, T = 40;
  const band = arc(cx, cy, Ra, a1, a0);
  s.push(`<path d="${band}" fill="none" stroke="${INK}" stroke-width="${T + SW}" stroke-linecap="round"/>`);
  s.push(`<path d="${band}" fill="none" stroke="url(#w-coral)" stroke-width="${T - SW}" stroke-linecap="round"/>`);
  const [t0x, t0y] = P(cx, cy, Ra - 40, a1), [t1x, t1y] = P(cx, cy, Ra + 40, a1), [tx, ty] = P(cx, cy, Ra + 2, a1 - 22);
  s.push(shape(`M${t0x} ${t0y}L${t1x} ${t1y}L${tx} ${ty}Z`, 'coral'));
  // body: coral bezel ring, white face
  s.push(fill(circ(cx, cy, r), 'face'));
  s.push(fill(circ(cx, cy, R) + circ(cx, cy, r), 'coral', ' fill-rule="evenodd"'));
  s.push(circLight(cx, cy, R, 'coral'));
  // the hour you get back: 2 to 3 on the dial
  s.push(`<path d="${wedge(cx, cy, r - 10, -30, 0)}" fill="url(#w-pale)"/>`);
  s.push(ink(circ(cx, cy, R)) + ink(circ(cx, cy, r)));
  for (let k = 0; k < 12; k++) {
    const a = -90 + k * 30, major = k % 3 === 0;
    const [x1, y1] = P(cx, cy, r - (major ? 30 : 22), a), [x2, y2] = P(cx, cy, r - 12, a);
    s.push(ink(`M${x1} ${y1}L${x2} ${y2}`, major ? SW : DET));
  }
  const [hx, hy] = P(cx, cy, r - 50, -30), [mx, my] = P(cx, cy, r - 26, -90);
  s.push(ink(`M${cx} ${cy}L${hx} ${hy}`, SW + 3) + ink(`M${cx} ${cy}L${mx} ${my}`));
  s.push(solid(circ(cx, cy, 14)));
  return art(cx + Ra + T / 2 + 30, base + SW, base, s.join(''));
}

/** An hour dial: lavender bezel, white face, segments of the hour washed from 12 o'clock; white pieces mark puzzles. */
function hourDial(R: number, segs: Array<{ min: number; wash: Wash; piece?: number; cup?: boolean }>, over = 0) {
  const pad = over ? 40 : 14, cx = R + pad, cy = R + pad, rf = R - 24, rw = rf - 6;
  const s: string[] = [];
  s.push(fill(circ(cx, cy, rf), 'face'));
  let m = 0;
  for (const g of segs) {
    const a0 = -90 + m * 6, a1 = -90 + Math.min(60, m + g.min) * 6;
    s.push(`<path d="${wedge(cx, cy, rw, a0, a1)}" fill="url(#w-${g.wash})" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>`);
    const mid = (a0 + a1) / 2, span = a1 - a0;
    const [px, py] = span >= 359 ? P(cx, cy, rw * 0.5, -130) : P(cx, cy, rw * (span > 120 ? 0.52 : 0.64), mid);
    if (g.piece) {
      const size = Math.min(46, Math.max(22, rw * 0.64 * rad(span) * 0.42));
      s.push(piece(px, py, size, g.piece, 'white', { stroke: 0, rot: mid + 90 }));
    }
    if (g.cup) {
      const cw = 30, ch = 24;
      s.push(`<g transform="translate(${n(px)} ${n(py)})"><path d="M${-cw / 2} ${-ch / 2}H${cw / 2}V${ch / 2 - 8}A8 8 0 0 1 ${cw / 2 - 8} ${ch / 2}H${-cw / 2 + 8}A8 8 0 0 1 ${-cw / 2} ${ch / 2 - 8}Z" fill="#fff"/><path d="M${cw / 2 - 2} ${-ch / 2 + 5}a8 8 0 0 1 0 14" fill="none" stroke="#fff" stroke-width="5"/></g>`);
    }
    m += g.min;
  }
  s.push(fill(circ(cx, cy, R) + circ(cx, cy, rf), 'lav', ' fill-rule="evenodd"'));
  s.push(circLight(cx, cy, R, 'lav'));
  for (let k = 0; k < 12; k++) {
    const a = -90 + k * 30, major = k % 3 === 0;
    const [x1, y1] = P(cx, cy, rf - (major ? 22 : 14), a), [x2, y2] = P(cx, cy, rf - 3, a);
    s.push(ink(`M${x1} ${y1}L${x2} ${y2}`, major ? DET + 1 : 5));
  }
  s.push(ink(circ(cx, cy, R)) + ink(circ(cx, cy, rf), DET));
  s.push(solid(circ(cx, cy, 11)));
  if (over > 0) {
    const ro = R + 20;
    s.push(ink(arc(cx, cy, ro, -90, -90 + over * 6), 7, ' stroke-dasharray="2 14"'));
    s.push(solid(circ(...P(cx, cy, ro, -90 + over * 6), 9)));
  }
  return { w: 2 * (R + pad), h: 2 * (R + pad), cx, cy, R, svg: s.join('') };
}

/** Crescent moon (night wash) with two small ink sparkles; no face. */
function moon(cx: number, cy: number, r: number) {
  const o = r * 0.58; // offset of the cutting circle
  // Crescent: outer arc of the moon circle, inner arc of the cutting circle (centred up-right).
  const k = Math.acos((o) / (2 * r)); // half-angle where the two circles meet, measured from the offset axis
  const ax = -45; // offset direction (up-right)
  const a1 = ax + (k * 180) / Math.PI, a2 = ax - (k * 180) / Math.PI;
  const [x1, y1] = P(cx, cy, r, a1), [x2, y2] = P(cx, cy, r, a2);
  const d = `M${x1} ${y1}A${r} ${r} 0 1 1 ${x2} ${y2}A${r} ${r} 0 0 0 ${x1} ${y1}Z`;
  const spark = (x: number, y: number, s: number) => ink(`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`, DET);
  return fill(d, 'night') + rim(arc(cx, cy, r - IN, 120, 190)) + glint(...P(cx, cy, r - IN, 200)) + ink(d) +
    spark(cx + r * 0.5, cy - r * 0.42, 13) + spark(cx + r * 1.05, cy + r * 0.15, 9);
}

/** Desk lamp: lavender foot, two sky arm segments, a coral shade aimed down-right, a pale beam onto a piece. */
function deskLamp(): Art {
  const W = 360, base = 470;
  const s: string[] = [];
  const foot = [40, base - 40, 170, 40, 18] as const;
  const b = [125, base - 40], e = [215, base - 250], jn = [95, base - 385];
  // beam first (behind everything), from the shade mouth to the ground
  const dir = 52, ux = Math.cos(rad(dir)), uy = Math.sin(rad(dir)), px = -uy, py = ux;
  const mouth = [jn[0] + 128 * ux, jn[1] + 128 * uy];
  const wHalf = 74, nHalf = 24;
  const m0 = [mouth[0] + px * wHalf, mouth[1] + py * wHalf], m1 = [mouth[0] - px * wHalf, mouth[1] - py * wHalf];
  s.push(`<path d="M${n(m0[0])} ${n(m0[1])}L${n(m1[0])} ${n(m1[1])}L${W - 4} ${base}L${150} ${base}Z" fill="url(#w-pale)" opacity="0.8"/>`);
  s.push(piece(262, base - 34, 50, 33, 'coral', { rot: 8, stroke: DET }));
  // arms (rounded bars) with coral joints
  const bar = (a: number[], c: number[], wd: number) => {
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]), ang = (Math.atan2(c[1] - a[1], c[0] - a[0]) * 180) / Math.PI;
    return `<g transform="translate(${n(a[0])} ${n(a[1])}) rotate(${n(ang)})">${fill(rr(-wd / 2, -wd / 2, L + wd, wd, wd / 2), 'sky')}${ink(rr(-wd / 2, -wd / 2, L + wd, wd, wd / 2))}</g>`;
  };
  s.push(box(...foot, 'lav'));
  s.push(bar(b, e, 26) + bar(e, jn, 26));
  for (const j of [b, e]) s.push(shape(circ(j[0], j[1], 17), 'coral', DET));
  // shade: a cone from the joint along `dir`, with a dome cap
  const q0 = [jn[0] + 14 * ux + px * nHalf, jn[1] + 14 * uy + py * nHalf], q1 = [jn[0] + 14 * ux - px * nHalf, jn[1] + 14 * uy - py * nHalf];
  const cone = `M${n(q0[0])} ${n(q0[1])}L${n(m0[0])} ${n(m0[1])}L${n(m1[0])} ${n(m1[1])}L${n(q1[0])} ${n(q1[1])}Z`;
  s.push(fill(cone, 'coral'));
  s.push(rim(`M${n(q0[0] + (m0[0] - q0[0]) * 0.15 - px * IN)} ${n(q0[1] + (m0[1] - q0[1]) * 0.15 - py * IN)}L${n(q0[0] + (m0[0] - q0[0]) * 0.7 - px * IN)} ${n(q0[1] + (m0[1] - q0[1]) * 0.7 - py * IN)}`));
  s.push(ink(cone));
  s.push(shape(circ(jn[0], jn[1], 30), 'coral'));
  s.push(solid(circ(jn[0], jn[1], 8)));
  // bulb peeking out of the mouth
  s.push(`<path d="${arc(mouth[0], mouth[1], 30, dir - 90, dir + 90)}Z" transform="" fill="#fff"/>` + ink(arc(mouth[0], mouth[1], 30, dir - 90, dir + 90), DET));
  return art(W, base + SW, base, s.join(''));
}

/** Sofa (sky), a coral generator piece just visible in the gap underneath. */
function sofa(): Art {
  const W = 420, base = 270, gap = 42;
  const s: string[] = [];
  const seatY = base - gap - 92;
  s.push(`<defs><clipPath id="under"><rect x="0" y="${base - gap - 2}" width="${W}" height="${gap + 2 - DET / 2}"/></clipPath></defs>`);
  s.push(`<g clip-path="url(#under)">${piece(262, base - 30, 60, 7, 'coral', { rot: 24, stroke: DET })}</g>`);
  for (const x of [44, W - 44 - 30]) s.push(box(x, base - gap - 6, 30, gap + 6, 8, 'lav', { rim: false, glint: false, width: DET }));
  s.push(box(54, seatY - 120, W - 108, 150, 30, 'sky', { glint: true }));
  s.push(box(22, seatY, W - 44, 92, 24, 'sky', { glint: false }));
  for (const [x, w] of [[86, 124], [210, 124]]) s.push(box(x, seatY - 32, w, 46, 18, 'skyp', { glint: false, width: DET }));
  s.push(box(4, seatY - 54, 82, 146, 30, 'sky', { glint: false }));
  s.push(box(W - 86, seatY - 54, 82, 146, 30, 'sky', { glint: false }));
  return art(W, base + SW, base, s.join(''));
}

/** A LOST poster pinned to the wall: tear-off strips, a coral generator piece as the photo. */
function lostPoster(): Art {
  const W = 400, H = 560, x = 30, y = 40, w = 340, hh = 470;
  const s: string[] = [];
  s.push(box(x, y, w, hh, 10, 'face', { glint: false }));
  s.push(`<text class="poster" x="${x + w / 2}" y="${y + 116}" text-anchor="middle">LOST</text>`);
  s.push(fill(rr(x + 70, y + 150, w - 140, 170, 14), 'skyp') + ink(rr(x + 70, y + 150, w - 140, 170, 14), DET));
  s.push(piece(x + w / 2, y + 236, 84, 21, 'coral', { rot: -8, stroke: DET }));
  s.push(ink(`M${x + 64} ${y + 352}H${x + w - 64}M${x + 96} ${y + 384}H${x + w - 96}`, DET));
  const ty = y + hh - 64, k = 7, tw = w / k;
  s.push(ink(`M${x} ${ty}H${x + w}`, 5, ' stroke-dasharray="2 10"'));
  for (let i = 1; i < k; i++) s.push(ink(`M${n(x + i * tw)} ${ty}V${y + hh - 4}`, 5));
  for (let i = 0; i < k; i++) s.push(ink(`M${n(x + i * tw + tw / 2)} ${ty + 14}V${y + hh - 16}`, 4));
  s.push(shape(circ(x + w / 2, y + 8, 20), 'coral', DET) + glint(x + w / 2 - 6, y + 2));
  return art(W, H, H, s.join(''));
}

/** Desk calendar (D7) with one day circled. No numbers. */
function calendar(mark: number): Art {
  const W = 372, x = 22, w = W - 44, top = 36, bandH = 66, r = 20;
  const cols = 7, rows = 5, cell = 30, gap = 8;
  const gridW = cols * cell + (cols - 1) * gap;
  const gx = x + (w - gridW) / 2, gy = top + bandH + 30;
  const pageH = bandH + 30 + rows * cell + (rows - 1) * gap + 34;
  const footH = 36, footY = top + pageH - 12, base = footY + footH;
  const s: string[] = [];
  s.push(fill(rr(x, top, w, pageH, r), 'face'));
  s.push(`<path d="M${x + r} ${top}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${top + r}V${top + bandH}H${x}V${top + r}A${r} ${r} 0 0 1 ${x + r} ${top}Z" fill="url(#w-lav)"/>`);
  s.push(rim(`M${x + IN} ${top + bandH - 10}V${top + r}A${n(r - IN)} ${n(r - IN)} 0 0 1 ${x + r} ${top + IN}H${n(x + w * 0.36)}`));
  for (let i = 0; i < rows * cols; i++) {
    const c = i % cols, ri = Math.floor(i / cols);
    const on = i === mark;
    s.push(`<path d="${rr(gx + c * (cell + gap), gy + ri * (cell + gap), cell, cell, 8)}" fill="${on ? 'url(#w-coral)' : i < mark ? 'url(#w-skyp)' : 'url(#w-skyp)'}"/>`);
  }
  const mc = mark % cols, mr = Math.floor(mark / cols);
  s.push(ink(circ(gx + mc * (cell + gap) + cell / 2, gy + mr * (cell + gap) + cell / 2, 27), DET));
  s.push(rrLight(x, top, w, pageH, r, 'face', { rim: false }));
  s.push(ink(rr(x, top, w, pageH, r)) + ink(`M${x} ${top + bandH}H${x + w}`));
  for (const f of [0.22, 0.5, 0.78]) {
    const rx = x + w * f;
    s.push(fill(rr(rx - 12, top - 26, 24, 54, 12), 'sky') + ink(rr(rx - 12, top - 26, 24, 54, 12)));
  }
  s.push(box(4, footY, W - 8, footH, 14, 'lav', { glint: false }));
  return art(W, base + SW, base, s.join(''));
}

/** Hourglass (D7): coral sand nearly run through, sky end caps. */
function hourglass(): Art {
  const W = 230, cx = 115, capW = 206, capH = 40, top = 8, gTop = top + capH, gBot = gTop + 250, bot = gBot + capH;
  const L = cx - 70, Rr = cx + 70, neck = 13, mid = (gTop + gBot) / 2;
  const glass = `M${L} ${gTop}C${L} ${gTop + 82} ${cx - neck} ${mid - 36} ${cx - neck} ${mid}C${cx - neck} ${mid + 36} ${L} ${gBot - 82} ${L} ${gBot}H${Rr}C${Rr} ${gBot - 82} ${cx + neck} ${mid + 36} ${cx + neck} ${mid}C${cx + neck} ${mid - 36} ${Rr} ${gTop + 82} ${Rr} ${gTop}Z`;
  const sandTop = `M0 ${mid - 62}Q${cx} ${mid - 46} ${W} ${mid - 62}V${mid}H0Z`;
  const sandBot = `M0 ${gBot}V${gBot - 26}C${cx - 60} ${gBot - 34} ${cx - 34} ${gBot - 84} ${cx} ${gBot - 88}C${cx + 34} ${gBot - 84} ${cx + 60} ${gBot - 34} ${W} ${gBot - 26}V${gBot}Z`;
  const s = [
    `<defs><clipPath id="hg-clip"><path d="${glass}"/></clipPath></defs>`,
    fill(glass, 'face'),
    `<g clip-path="url(#hg-clip)">${fill(sandTop, 'coral')}${fill(sandBot, 'coral')}<path d="M${cx} ${mid}V${gBot - 88}" stroke="#f77b7c" stroke-width="${DET}" stroke-linecap="round"/></g>`,
    rim(`M${L + IN} ${gTop + 14}C${L + IN} ${gTop + 60} ${cx - neck - 30} ${mid - 60} ${cx - neck - 8} ${mid - 26}`),
    ink(glass),
  ];
  for (const y of [top, gBot]) s.push(box(cx - capW / 2, y, capW, capH, 16, 'sky'));
  return art(W, bot + SW, bot, s.join(''));
}

/** The puzzle picture (F3): sky, a coral sun and two rows of hills. */
function picture(x: number, y: number, w: number, hh: number, sunX = 0.72) {
  const hills1 = `M${x - 20} ${n(y + hh * 0.64)}C${n(x + w * 0.2)} ${n(y + hh * 0.46)} ${n(x + w * 0.42)} ${n(y + hh * 0.5)} ${n(x + w * 0.6)} ${n(y + hh * 0.62)}C${n(x + w * 0.75)} ${n(y + hh * 0.54)} ${n(x + w * 0.9)} ${n(y + hh * 0.52)} ${x + w + 20} ${n(y + hh * 0.6)}V${y + hh + 20}H${x - 20}Z`;
  const hills2 = `M${x - 20} ${n(y + hh * 0.82)}C${n(x + w * 0.3)} ${n(y + hh * 0.7)} ${n(x + w * 0.62)} ${n(y + hh * 0.76)} ${x + w + 20} ${n(y + hh * 0.86)}V${y + hh + 20}H${x - 20}Z`;
  return [
    `<rect x="${x - 20}" y="${y - 20}" width="${w + 40}" height="${hh + 40}" fill="url(#w-pic)"/>`,
    fill(circ(x + w * sunX, y + hh * 0.3, hh * 0.13), 'coral'),
    fill(hills1, 'lav'),
    fill(hills2, 'pale'),
  ].join('');
}

// ── Page chrome ───────────────────────────────────────────────────────────────────────────────────────
const css = `
.frame { position: relative; width: 1080px; height: 1350px; background: var(--paper); overflow: hidden; }
.art { position: absolute; display: block; }
.hd { position: absolute; left: ${X0}px; width: ${CW}px; top: 64px; display: flex; align-items: center; justify-content: space-between; }
.kick { font-size: 32px; font-weight: 500; color: var(--ink-soft); }
.no { font-size: 30px; font-weight: 500; color: var(--ink-muted); }
.h1 { position: absolute; left: ${X0}px; width: ${CW}px; top: 140px; font-size: 112px; line-height: 0.98; font-weight: 700; letter-spacing: -3px; }
.h2 { position: absolute; left: ${X0}px; width: ${CW}px; top: 146px; font-size: 64px; line-height: 1.1; font-weight: 700; letter-spacing: -1.2px; text-wrap: balance; }
.dek { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 40px; line-height: 1.3; color: var(--ink-soft); text-wrap: pretty; }
.dek b { color: var(--ink); font-weight: 700; }
.note { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 30px; line-height: 1.3; color: var(--ink-muted); text-wrap: pretty; }
.ground { position: absolute; left: ${X0 - 4}px; width: ${CW + 8}px; top: ${GROUND - 3}px; height: 6px; border-radius: 3px; background: var(--ink); }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1214px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.src { font-size: 30px; color: var(--ink-muted); }
.logo { width: 66px; height: 58px; }
.big { position: absolute; left: ${X0}px; font-size: 280px; font-weight: 700; line-height: 1; letter-spacing: -9px; }
.q { position: absolute; left: ${X0}px; font-size: 48px; line-height: 1.15; font-weight: 700; color: var(--indigo-500); text-wrap: balance; }
.mark { position: relative; isolation: isolate; white-space: nowrap; }
.mark::after { content: ''; position: absolute; left: -4px; right: -6px; bottom: 0.12em; height: 0.3em; z-index: -1; background: ${CORAL}; border-radius: 6px; }
.lab { font-size: 32px; fill: var(--ink-soft); font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-strong { font-size: 34px; font-weight: 700; fill: var(--ink); font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-muted { font-size: 30px; fill: var(--ink-muted); font-family: Rubik; font-variant-numeric: tabular-nums; }
.poster { font-family: Rubik; font-size: 86px; font-weight: 700; fill: var(--ink); letter-spacing: 6px; }
.halo { paint-order: stroke; stroke: #fff; stroke-width: 10px; stroke-linejoin: round; }
.dial-row { position: absolute; left: ${X0}px; width: ${CW}px; height: 280px; }
.dial-row .t { position: absolute; left: 330px; top: 70px; width: 574px; font-size: 52px; line-height: 1.05; font-weight: 700; letter-spacing: -1px; }
.dial-row .d { position: absolute; left: 330px; top: 142px; width: 574px; font-size: 34px; line-height: 1.3; color: var(--ink-soft); }
.dial-row .d b { color: var(--ink); font-weight: 700; }
.over { position: absolute; font-size: 32px; font-weight: 700; color: var(--ink); white-space: nowrap; }
.rows { position: absolute; left: ${X0}px; width: 620px; }
.rows .r { position: absolute; left: 0; width: 620px; height: 120px; }
.rows .nm { position: absolute; left: 0; top: 0; font-size: 36px; font-weight: 700; white-space: nowrap; }
.rows .nm span { font-weight: 400; color: var(--ink-soft); margin-left: 12px; font-size: 32px; }
.rows .bar { position: absolute; left: 0; top: 56px; height: 34px; border-radius: 0 7px 7px 0; background: var(--context); }
.rows .r.hi .bar { background: ${CORAL}; outline: 4px solid var(--ink); outline-offset: -2px; border-radius: 0 9px 9px 0; }
.rows .v { position: absolute; top: 50px; font-size: 38px; font-weight: 700; white-space: nowrap; }
.rows .v span { font-weight: 400; font-size: 30px; color: var(--ink-soft); margin-left: 10px; }
.tl { position: absolute; left: ${X0}px; width: 640px; }
.tl .r { position: absolute; left: 0; width: 640px; height: 64px; display: flex; align-items: center; }
.tl .nm { width: 270px; flex: none; font-size: 32px; font-weight: 500; white-space: nowrap; }
.tl .bar { height: 30px; border-radius: 0 6px 6px 0; background: var(--context); }
.tl .r.hi .nm { font-weight: 700; }
.tl .r.hi .bar { background: ${CORAL}; outline: 4px solid var(--ink); outline-offset: -2px; border-radius: 0 8px 8px 0; }
.tl .v { margin-left: 16px; font-size: 32px; font-weight: 700; }
.stat { position: absolute; left: ${X0}px; width: 600px; display: flex; flex-direction: column; }
.stat > div { display: flex; flex-direction: column; gap: 4px; padding: 20px 0; border-top: 3px solid var(--line); }
.stat b { font-size: 64px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; }
.stat span { font-size: 34px; line-height: 1.25; color: var(--ink-soft); }
.key { position: absolute; display: flex; align-items: center; gap: 14px; font-size: 30px; color: var(--ink-soft); line-height: 1.2; }
.key b { color: var(--ink); font-weight: 700; display: block; }
.key i { flex: none; display: block; }
`;

const head = (kicker: string, no: string) => `${DEFS}<header class="hd"><span class="kick">${h(kicker)}</span><span class="no">${h(no)}</span></header>`;
const foot = (src: string, ground = true) => `${ground ? '<div class="ground"></div>' : ''}<footer class="foot"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const frame = (inner: string) => `<div class="frame">${inner}</div>`;

// ── 1. Clocks go back (D1) ────────────────────────────────────────────────────────────────────────────
function clocksBack(): Post {
  const F = clockFacts();
  const clock = alarmClock();
  const sizeName = (k: number) => `${k}`;
  const mix = F.mix.sizes;
  const mixLabel = mix.length === 2 ? `A ${sizeName(mix[0])} and a ${sizeName(mix[1])}` : mix.map(sizeName).join(' + ');
  const mixSum = mix.map(k => fmtDuration(F.med[k])).join(' + ');
  const mixLeft = 60 - F.mix.total;
  const teaMin = Math.round(F.tea);

  const R = 120;
  const d500 = hourDial(R, [{ min: 60, wash: 'coral', piece: 33 }], F.short500);
  type Seg = { min: number; wash: Wash; piece?: number; cup?: boolean };
  const segs100: Seg[] = [...Array(F.n100)].map((_, i) => ({ min: F.m100, wash: 'coral', piece: [4, 7, 33, 1, 12, 21][i % 6] }));
  const d100 = hourDial(R, [...segs100, { min: F.tea, wash: 'sky', cup: true }]);
  const dMix = hourDial(R, mix.map((k, i) => ({ min: F.med[k], wash: 'coral' as Wash, piece: [33, 4, 7][i % 3] })));
  const rowTop = [326, 616, 906];
  const dialRow = (top: number, d: ReturnType<typeof hourDial>, t: string, desc: string, extra = '') =>
    `<div class="dial-row" style="top:${top}px">
      <svg class="art" width="${d.w}" height="${d.h}" style="left:${n(150 - d.cx)}px; top:${n(140 - d.cy)}px" aria-hidden="true">${d.svg}</svg>
      <p class="t">${t}</p><p class="d">${desc}</p>${extra}</div>`;
  const overAt = P(d500.cx, d500.cy, d500.R + 20, -90 + F.short500 * 6);

  return {
    key: 'clocks-back',
    label: `D1 · Clocks go back: your free hour is ${F.pct500}% of a median 500 (posts ${F.eve})`,
    caption: `Clocks go back tonight in most of Europe, so you get one free hour. The median solo 500 on MSP takes ${fmtDuration(F.m500)}: your extra hour covers ${F.pct500}% of it, ${fmtDuration(F.short500)} short.\n\nOther ways to spend it, at median solo pace: ${word(F.n100)} 100-piece puzzles (${fmtDuration(F.m100)} each) with ${teaMin} minutes left for tea, or ${mix.length === 2 ? `a ${mix[0]} and a ${mix[1]}` : mix.join(' + ')} (${mixSum}). A 1000? That hour gets you ${F.pct1000}% of the way.\n\nHow are you spending yours? (US and Canada: your turn comes on ${F.us}.)\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [
      { id: 'clocks-1', body: frame(`${head('Clocks go back tonight', 'MSP DATA')}
        <h1 class="h1">One free hour</h1>
        <p class="dek" style="top:272px; width:860px">Tonight the clocks go back and you get an hour for nothing. What does it buy on the puzzle table?</p>
        <p class="big" style="top:470px">${F.pct500}%</p>
        <p class="dek" style="top:770px; width:440px">of a median solo 500. You'd stop <b>${fmtDuration(F.short500)}</b> short.</p>
        ${place(clock, 992 - clock.w + 26)}
        ${foot(F.source)}`) },
      { id: 'clocks-2', body: frame(`${head('Clocks go back tonight', '2 / 2')}
        <h2 class="h2">What your free hour buys</h2>
        <p class="dek" style="top:232px; font-size:34px">At the median solo time on MSP, each dial is one hour</p>
        ${dialRow(rowTop[0], d500, `Almost one 500`, `Median solo 500: <b>${fmtDuration(F.m500)}</b>. The hour runs out ${fmtDuration(F.short500)} before the last piece.`,
          `<span class="over" style="left:${n(150 - d500.cx + overAt[0] + 18)}px; top:${n(140 - d500.cy + overAt[1] - 46)}px">+${fmtDuration(F.short500)}</span>`)}
        ${dialRow(rowTop[1], d100, `${cap(word(F.n100))} 100s, then tea`, `Median solo 100: <b>${fmtDuration(F.m100)}</b>. That leaves ${teaMin} minutes for the kettle.`)}
        ${dialRow(rowTop[2], dMix, mixLabel, `<b>${mixSum}</b>${mixLeft < 0.05 ? '. Exactly one hour.' : `, with ${fmtDuration(mixLeft)} to spare.`}`)}
        ${foot(F.source, false)}`) },
    ],
  };
}

// ── 2. Night owls (C1) ────────────────────────────────────────────────────────────────────────────────
function nightOwls(): Post {
  const F = owlFacts();
  const p = F.parts;
  const cx = 540, cy = 826, Rf = 330, Rb = 272, Rref = 172, K = 12; // K: px per minute away from the all-hours median
  const ang = (hr: number) => -90 + hr * 15;
  const s: string[] = [];
  // a 24-hour wall clock: lavender bezel carrying the hours, white face
  s.push(fill(circ(cx, cy, Rb), 'face'));
  // bars: inwards = faster than the all-hours median, outwards = slower
  for (const x of F.shown) {
    const r1 = Rref + K * (x.med - F.all.med);
    const a0 = ang(x.h) - 6, a1 = ang(x.h) + 6;
    const d = sector(cx, cy, Math.min(Rref, r1), Math.max(Rref, r1), a0, a1);
    s.push(F.isNight(x.h) ? `<path d="${d}" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` : `<path d="${d}" fill="#c5ccd8"/>`);
  }
  for (const x of F.hidden) s.push(`<circle cx="${P(cx, cy, Rref, ang(x.h))[0]}" cy="${P(cx, cy, Rref, ang(x.h))[1]}" r="6" fill="${INK}" fill-opacity="0.4"/>`);
  s.push(`<circle cx="${cx}" cy="${cy}" r="${Rref}" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>`);
  const hid = F.hidden.map(x => x.h);
  const hiddenNote = hid.length ? `<path id="few" d="${arc(cx, cy, Rref + 22, ang(Math.min(...hid)) - 12, ang(Math.max(...hid)) + 12)}" fill="none"/><text class="lab-muted"><textPath href="#few" startOffset="50%" text-anchor="middle">too few sessions</textPath></text>` : '';
  s.push(fill(circ(cx, cy, Rf) + circ(cx, cy, Rb), 'lav', ' fill-rule="evenodd"'));
  s.push(circLight(cx, cy, Rf, 'lav'));
  for (let hr = 0; hr < 24; hr++) {
    if (hr % 6 === 0) continue;
    const [x1, y1] = P(cx, cy, Rb + 12, ang(hr)), [x2, y2] = P(cx, cy, Rb + (hr % 3 === 0 ? 34 : 24), ang(hr));
    s.push(ink(`M${x1} ${y1}L${x2} ${y2}`, hr % 3 === 0 ? DET : 5));
  }
  const labels = [0, 6, 12, 18].map(hr => {
    const [x, y] = P(cx, cy, (Rf + Rb) / 2, ang(hr));
    return `<text class="lab-strong" x="${x}" y="${n(y + 12)}" text-anchor="middle">${String(hr).padStart(2, '0')}</text>`;
  }).join('');
  s.push(ink(circ(cx, cy, Rf)) + ink(circ(cx, cy, Rb), DET));
  s.push(moon(cx - 4, cy + 4, 54));
  const dial = `<svg class="art" width="1080" height="1350" viewBox="0 0 1080 1350" style="left:0; top:0" aria-hidden="true">${s.join('')}${labels}${hiddenNote}</svg>`;
  const fast = F.nightHours.map(x => x.med);

  // slide 2: dayparts
  const parts = [
    { key: 'morning', name: 'Morning', ...p.morning },
    { key: 'day', name: 'Daytime', ...p.day },
    { key: 'evening', name: 'Evening', ...p.evening },
    { key: 'night', name: 'Night', ...p.night },
  ];
  const BW = 400, dom = 80;
  const lamp = deskLamp();

  // slide 3: when sessions start
  const GW = CW, GH = 330;
  const g = barGeometry(F.hours, { x: d => d.h, y: d => d.n, width: GW, height: GH, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height + 3)}" rx="3" ${F.isNight(b.datum.h) ? `fill="${CORAL}" stroke="${INK}" stroke-width="3"` : 'fill="var(--context)"'}/>`).join('');
  const pk = g.bars.find(b => b.datum.h === F.peak.h)!;
  const band = (hr: number) => g.xScale(String(hr))! + g.xScale.bandwidth() / 2;
  const ticks = [0, 6, 12, 18, 23].map(hr => `<text class="lab" x="${n(band(hr))}" y="${GH + 46}" text-anchor="middle">${String(hr).padStart(2, '0')}:00</text>`).join('');
  const nightN = F.hours.filter(x => F.isNight(x.h)).reduce((a, b) => a + b.n, 0);

  return {
    key: 'night-owls',
    label: `C1 · Night owls finish fastest: 500s started after 22:00, median ${oneDec(p.night.med)} vs ${oneDec(p.evening.med)} min (stopwatch, Central Europe)`,
    caption: `Night owls finish fastest. Stopwatch sessions on 500-piece puzzles started between 22:00 and 05:00 take a median ${oneDec(p.night.med)} minutes of active time. Evening starts (${p.evening.from}:00 to ${p.evening.to}:00) take ${oneDec(p.evening.med)}.\n\nMost of you press start at ${String(F.peak.h).padStart(2, '0')}:00. After 22:00 it gets quiet and quick, with fewer pauses too: ${Math.round(p.night.noPause)}% of night sessions run without one.\n\nThe fine print: in-app stopwatch only (about ${F.sharePct}% of all results), players in Central Europe, local time. Late sessions are rare and probably keen solvers.\n\nOwl or lark: when do you start yours?\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [
      { id: 'owls-1', body: frame(`${head('Stopwatch data · Central Europe', 'MSP DATA')}
        <h1 class="h1" style="font-size:96px">Night owls<br>finish fastest</h1>
        <p class="dek" style="top:338px; font-size:34px; width:880px">Median minutes on a 500 by the hour the stopwatch started. Bars inside the dashed ring beat the all-day median.</p>
        ${dial}
        <div class="key" style="left:${X0}px; top:1104px"><i><svg width="46" height="12"><path d="M3 6H43" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="butt"/></svg></i><span><b>${oneDec(F.all.med)} min</b>all-day median</span></div>
        <div class="key" style="right:${1080 - 992}px; top:1104px; text-align:right"><span><b>${oneDec(Math.min(...fast))}–${oneDec(Math.max(...fast))} min</b>starts 22:00–01:00</span><i><svg width="34" height="34"><rect x="2" y="2" width="30" height="30" rx="6" fill="${CORAL}" stroke="${INK}" stroke-width="4"/></svg></i></div>
        ${foot(F.source, false)}`) },
      { id: 'owls-2', body: frame(`${head('Stopwatch data · Central Europe', '2 / 3')}
        <h2 class="h2" style="width:880px">Started after 22:00, a 500 takes ${oneDec(F.nightVsEvening)} minutes less</h2>
        <p class="dek" style="top:300px; font-size:34px">Median active time (pauses don't count), by start time</p>
        <div class="rows" style="top:400px">${parts.map((x, i) => `<div class="r ${x.key === 'night' ? 'hi' : ''}" style="top:${i * 140}px">
          <span class="nm">${x.name}<span>${x.from}:00–${x.to}:00 · ${fmtInt(x.n)} sessions</span></span>
          <span class="bar" style="width:${n((x.med / dom) * BW)}px"></span>
          <span class="v" style="left:${n((x.med / dom) * BW + 18)}px">${oneDec(x.med)} min</span></div>`).join('')}</div>
        <p class="dek" style="top:972px; width:560px; font-size:34px"><b>${Math.round(p.night.noPause)}%</b> of night sessions run without a single pause. Other times: ${Math.round(F.noPauseOthers[0])}–${Math.round(F.noPauseOthers[1])}%.</p>
        ${place(lamp, 992 - lamp.w + 20)}
        ${foot(F.source)}`) },
      { id: 'owls-3', body: frame(`${head('Stopwatch data · Central Europe', '3 / 3')}
        <h2 class="h2" style="width:880px">Most of you press start at ${String(F.peak.h).padStart(2, '0')}:00. Owls are rare.</h2>
        <p class="dek" style="top:300px; font-size:34px">Stopwatch sessions on 500s by start hour, local time</p>
        <svg class="art" width="${GW}" height="${GH + 70}" style="left:${X0}px; top:${430}px">
          ${bars}
          <text class="lab-strong" x="${n(pk.x + pk.width / 2)}" y="${n(pk.y - 18)}" text-anchor="middle">${fmtInt(F.peak.n)}</text>
          ${ticks}
          ${moon(n(band(2)), 150, 50)}
        </svg>
        <p class="note" style="top:880px; width:${CW}px">${fmtInt(F.all.n)} sessions, ${fmtInt(nightN)} of them started 22:00–05:00. Players in Central Europe only, the one region we can put on a single clock. The in-app stopwatch times about ${F.sharePct}% of all MSP results (${fmtInt(F.sessions)} sessions). Hours with fewer than ${F.MIN_N} sessions are left off the dial.</p>
        <p class="q" style="top:1086px; width:${CW}px">Owl or lark: when do you start yours?</p>
        ${foot(F.source, false)}`) },
    ],
  };
}

// ── 3. Missing piece (G2) ─────────────────────────────────────────────────────────────────────────────
function missingPiece(): Post {
  const F = noteFacts();
  // the board: a 6×4 puzzle of the house picture on a mat, one piece gone
  const BW = CW, BH = 690, C = 6, Rw = 4, S = 128;
  const pw = C * S, ph = Rw * S, ox = (BW - pw) / 2, oy = (BH - ph) / 2;
  const jig = generateJigsaw({ cols: C, rows: Rw, width: pw, height: ph, x: ox, y: oy, seed: 12, tabSize: 0.22, jitter: 0.03 });
  const hole = jig.pieces.find(q => q.col === 2 && q.row === 1)!;
  const rest = jig.pieces.filter(q => q !== hole);
  const hc = [ox + (hole.col + 0.5) * S, oy + (hole.row + 0.5) * S];
  const board = [
    `<defs><clipPath id="mp-pieces"><path d="${rest.map(q => q.d).join(' ')}"/></clipPath><clipPath id="mp-hole"><path d="${hole.d}"/></clipPath></defs>`,
    fill(rr(SW / 2, SW / 2, BW - SW, BH - SW, 34), 'mat'),
    rim(`M${SW / 2 + IN} ${BH * 0.5}V${34 + SW / 2}A${34 - IN} ${34 - IN} 0 0 1 ${34 + SW / 2} ${SW / 2 + IN}H${BW * 0.4}`),
    `<g clip-path="url(#mp-pieces)">${picture(ox, oy, pw, ph, 0.8)}</g>`,
    // the hole: mat showing through, a soft inner shadow and a chalk outline of the piece that should be there
    `<g clip-path="url(#mp-hole)"><path d="${hole.d}" fill="none" stroke="${DEEP.mat}" stroke-opacity="0.55" stroke-width="22"/></g>`,
    `<path d="${hole.d}" transform="translate(${hc[0]} ${hc[1]}) scale(0.74) translate(${-hc[0]} ${-hc[1]})" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="12 11" stroke-linecap="round"/>`,
    ...rest.map(q => `<path d="${q.d}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`),
    ink(hole.d, DET),
    `<path d="${jig.border}" fill="none" stroke="${INK}" stroke-width="${DET}" stroke-linejoin="round"/>`,
    ink(rr(SW / 2, SW / 2, BW - SW, BH - SW, 34)),
  ].join('');

  // slide 2: topics
  const top = F.topics.slice(0, 7);
  const so = sofa();
  const maxN = top[0].n;
  const poster = lostPoster();
  const ratioWord = F.ratio >= 1.75 && F.ratio < 2 ? 'almost twice as often' : F.ratio >= 2 ? `${Math.floor(F.ratio)} times as often` : `${oneDec(F.ratio)}× as often`;

  return {
    key: 'missing-piece',
    label: `G2 · ${fmtInt(F.missing)} result notes mention a missing piece: tell us your worst one`,
    caption: `${fmtInt(F.missing)} of your result notes on MSP mention a missing piece. That's more than any other topic we counted, ${ratioWord} as edges (${fmtInt(F.edges)}).\n\nWe only counted words; nobody read your notes. Still, we suspect there are stories in there: the sofa, the vacuum cleaner, the cat. ${F.cat} notes mention a cat, by the way.\n\nTell us your worst one. Did the piece ever turn up?\n\n#speedpuzzling #jigsawpuzzle`,
    slides: [
      { id: 'missing-1', body: frame(`${head('From your result notes', 'MSP DATA')}
        <p class="big" style="top:128px; font-size:250px">${fmtInt(F.missing)}</p>
        <p class="dek" style="top:170px; left:590px; width:402px">result notes on MSP mention a <b>missing piece</b></p>
        <svg class="art" width="${BW}" height="${BH}" style="left:${X0}px; top:${430}px" aria-hidden="true">${board}</svg>
        ${foot(F.source, false)}`) },
      { id: 'missing-2', body: frame(`${head('From your result notes', '2 / 3')}
        <h2 class="h2" style="width:880px">Missing pieces beat every other topic we counted</h2>
        <p class="dek" style="top:300px; font-size:34px">Result notes that mention each topic, of ${fmtInt(F.notes)} with text</p>
        <div class="tl" style="top:400px">${top.map((t, i) => `<div class="r ${i === 0 ? 'hi' : ''}" style="top:${i * 76}px">
          <span class="nm">${h(t.label)}</span><span class="bar" style="width:${n((t.n / maxN) * 300)}px"></span><span class="v">${fmtInt(t.n)}</span></div>`).join('')}</div>
        <p class="dek" style="top:960px; width:520px; font-size:34px">And <b>${F.cat}</b> notes mention a cat. We're not saying anything.</p>
        ${place(so, 992 - so.w + 12)}
        ${foot(F.source)}`) },
      { id: 'missing-3', body: frame(`${head('From your result notes', '3 / 3')}
        <p class="q" style="top:150px; width:${CW}px; font-size:84px; line-height:1.02; letter-spacing:-2px">Tell us your worst one</p>
        <p class="dek" style="top:270px; width:${CW}px">Under the sofa, in the vacuum, in the box all along, or never seen again?</p>
        ${place(poster, X0 - 6, 1150, -3, 1.22)}
        ${F.listings != null ? `<p class="dek" style="top:760px; left:620px; width:372px; font-size:36px"><b>${fmtInt(F.listings)}</b> puzzles in the MSP marketplace are listed with missing pieces right now.</p>` : ''}
        ${foot(F.source, false)}`) },
    ],
  };
}

// ── 4. 75 years (D2) ──────────────────────────────────────────────────────────────────────────────────
function seventyFive(): Post {
  const F = lifeFacts();
  const full = Math.min(75, Math.floor(F.years));
  // 75 one-year pieces: rows of ten from one 10×8 jigsaw (the last row stops at 75)
  const CELL = 78, cols = 10, rowsN = 8;
  const gw = cols * CELL, gh = rowsN * CELL, gx = 24, gy = 24;
  const jig = generateJigsaw({ cols, rows: rowsN, width: gw, height: gh, x: gx, y: gy, seed: 75, tabSize: 0.22, jitter: 0.03 });
  const ordered = jig.pieces.sort((a, b) => a.row - b.row || a.col - b.col).slice(0, 75);
  const grid = ordered.map((q: Piece, i) => i < full
    ? `<path d="${q.d}" fill="url(#w-coral)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    : `<path d="${q.d}" fill="#fff" stroke="${INK}" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  // the years still to come wait beside their slots, loose pieces about to go in
  const waiting = ordered.slice(full).map((q, k) => {
    const c = [gx + (q.col + 0.5) * CELL, gy + (q.row + 0.5) * CELL];
    const to = [gx + (6.5 + k * 1.2) * CELL, gy + (rowsN - 0.5) * CELL + (k % 2 ? 4 : 12)];
    return `<path d="${q.d}" transform="translate(${n(to[0] - c[0])} ${n(to[1] - c[1])}) rotate(${[-16, 10, -6][k % 3]} ${n(c[0])} ${n(c[1])})" fill="url(#w-pale)" stroke="${INK}" stroke-width="${DET}" stroke-linejoin="round"/>`;
  }).join('');
  const rowLabel = Array.from({ length: rowsN }, (_, r) => `<text class="lab-muted" x="${gx + gw + 34}" y="${n(gy + (r + 0.5) * CELL + 10)}">${Math.min(75, (r + 1) * 10)}</text>`).join('');
  const cal = calendar(9);
  const hg = hourglass();
  const tl0 = 1950, tl1 = 2030, TW = CW, xs = (y: number) => ((y - tl0) / (tl1 - tl0)) * TW;
  const decades = Array.from({ length: 7 }, (_, i) => tl0 + 10 + i * 10);
  const head75 = F.reached ? '75 years of non-stop puzzling' : 'Almost 75 years of non-stop puzzling';

  return {
    key: '75-years',
    label: `D2 · ${F.years.toFixed(2)} years of logged solving time; 75 years around ${F.eta} at the last 4 weeks' pace`,
    caption: `${F.years.toFixed(2)} years. That's how much solving time you've logged on MSP so far: ${fmtInt(F.hours)} hours. At the pace of the last 4 weeks (${fmtInt(F.perDay)} hours a day), we cross 75 years around ${F.eta}.\n\nHow we got the date: ${fmtInt(F.toGo)} hours to go, divided by ${fmtInt(F.perDay)} a day, is about ${Math.round(F.daysToGo)} days. Every single day you log ${Math.floor(F.daysPerDay)} days of puzzling.\n\nPut end to end, that's one puzzler at the table non-stop since ${F.since}.\n\nHow many of those hours are yours?\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [
      { id: '75-1', body: frame(`${head('MSP milestone', 'MSP DATA')}
        <h2 class="h2" style="width:900px; font-size:72px">${head75}</h2>
        <p class="dek" style="top:324px; font-size:34px">Solving time logged on MSP. Each piece is one year, ten to a row.</p>
        <svg class="art" width="${gw + 120}" height="${gh + 48}" style="left:${X0 - 24}px; top:${408}px" aria-hidden="true">${grid}${waiting}${rowLabel}</svg>
        <p class="dek" style="top:1100px; font-size:40px"><b>${F.years.toFixed(2)} years</b> so far. ${F.reached ? 'We made it.' : `75 around <b>${F.eta}</b>.`}</p>
        ${foot(F.source, false)}`) },
      { id: '75-2', body: frame(`${head('MSP milestone', '2 / 3')}
        <p class="dek" style="top:146px">We cross 75 years around</p>
        <p class="big" style="top:206px; font-size:230px">${F.eta}</p>
        <div class="stat" style="top:470px; width:600px">
          <div><b>${fmtInt(F.hours)} h</b><span>logged so far (${F.years.toFixed(2)} years)</span></div>
          <div><b>+${fmtInt(F.perDay)} h</b><span>a day, the last 4 weeks' average</span></div>
          <div><b>${fmtInt(F.toGo)} h</b><span>to go: ${Math.round(F.daysToGo)} days at that pace</span></div>
        </div>
        <p class="note" style="top:1000px; width:520px">Timed results only. The date moves with the pace, so we check it again every day.</p>
        ${place(cal, 992 - cal.w + 12)}
        ${foot(F.source)}`) },
      { id: '75-3', body: frame(`${head('MSP milestone', '3 / 3')}
        <h2 class="h2" style="width:880px">One puzzler, non-stop since ${F.since}</h2>
        <p class="dek" style="top:300px; font-size:36px; width:880px">Put every logged hour end to end and that's where the first piece went down.</p>
        <svg class="art" width="${TW}" height="150" style="left:${X0}px; top:470px" aria-hidden="true">
          <rect x="0" y="62" width="${TW}" height="16" rx="8" fill="var(--context)"/>
          <rect x="${n(xs(F.sinceYear))}" y="44" width="${n(xs(F.nowYear) - xs(F.sinceYear))}" height="52" rx="12" fill="${CORAL}" stroke="${INK}" stroke-width="5"/>
          ${decades.map(y => `<text class="lab-muted" x="${n(xs(y))}" y="140" text-anchor="middle">${y}</text>`).join('')}
          <text class="lab-strong" x="${n(xs(F.sinceYear))}" y="28">${F.since.split(' ')[1]}</text>
          <text class="lab-strong" x="${n(xs(F.nowYear))}" y="28" text-anchor="end">today</text>
        </svg>
        <p class="big" style="top:650px; font-size:220px">${Math.floor(F.daysPerDay)}</p>
        <p class="dek" style="top:880px; width:560px"><b>days</b> of puzzling logged every single day (${fmtInt(F.perDay)} hours)</p>
        <p class="q" style="top:1012px; width:560px">How many of those hours are yours?</p>
        ${place(hg, 992 - hg.w + 8)}
        ${foot(F.source)}`) },
    ],
  };
}

const direction: Direction = {
  id: 'G3',
  name: 'Timely stories',
  idea: 'Posts that hang on a date or a moment (clocks going back, night-time solving, the missing piece, a 75-year milestone), drawn in the house illustration kit with generator pieces; every number from a cached query, projections say "around" and show their arithmetic.',
  css,
  posts: (_c: Content) => [clocksBack(), nightOwls(), missingPiece(), seventyFive()],
};
export default direction;
