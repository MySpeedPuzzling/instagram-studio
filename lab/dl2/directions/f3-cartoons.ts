// F3 · Cartoons & seasonal art.
// Single-panel cartoons in the MSP house illustration style (the D7 kit: ONE navy ink at one fixed stroke, details
// at 0.6×, same-hue two-stop washes lit top-left, a white rim light + glint, a deep-tone bevel shade, no gloss).
// The joke lives in the drawing and one Rubik punchline under the panel; a small data line winks at a real MSP
// number where it fits. No faces on people (there are no people), objects and the cat carry the personality
// through pose, sweat and speed dashes. Every jigsaw piece comes from the generator, never drawn by hand.
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw, type Jigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import { LOGO_URL } from '../../../src/design/svg.ts';
import { query } from '../../../src/data/db.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../../dl1/types.ts';

// ── Facts (cached production queries; numbers are never typed into the copy) ───────────────────────────
const rows = (name: string) => query(name).rows;
const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function facts() {
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

const times = (k: number) => ({ 1: 'Once', 2: 'Twice', 3: 'Three times', 4: 'Four times', 5: 'Five times' } as Record<number, string>)[k] ?? `${k} times`;

// ── House illustration kit (D7, extended) ─────────────────────────────────────────────────────────────
const INK = '#2b3445';
const SW = 11;                 // the one outline weight, px on the 1080 canvas
const DET = 7;                 // interior details and small pieces (≥ 0.6 × SW)
const RIM = 0.4 * SW;          // rim light / bevel shade width
const IN = 0.95 * SW;          // rim light distance inside the outline centre line

type Wash = 'coral' | 'pale' | 'sky' | 'lav' | 'face' | 'skyp' | 'lavp' | 'orange' | 'wall' | 'mat' | 'dusk' | 'well' | 'pic' | 'night';
const WASH: Record<Wash, [string, string]> = {
  coral: ['#ffa6a3', '#f77b7c'],
  pale: ['#fff0ee', '#fdd3cf'],
  sky: ['#a8cefe', '#6aaef6'],
  lav: ['#b9b1fd', '#928bf1'],
  face: ['#ffffff', '#e3eaf6'],
  skyp: ['#f1f8ff', '#d6eaff'],
  lavp: ['#f4f2ff', '#e0dcff'],
  orange: ['#ffc99e', '#fb9e62'],
  wall: ['#fdfeff', '#eef2f8'],
  mat: ['#f6f4ff', '#e4e0fd'],
  dusk: ['#ece9ff', '#d6d0fa'],
  well: ['#f3f6fa', '#dfe6f0'],
  pic: ['#d4e9ff', '#9fcbfb'],
  night: ['#a9a1f6', '#7e76e2'],
};
const DEEP: Record<Wash, string> = {
  coral: '#e15b5f', pale: '#efa59f', sky: '#3f88d6', lav: '#6b63d4', face: '#b9c6dc', skyp: '#9fc6ef', lavp: '#aaa3ec',
  orange: '#e07a36', wall: '#c9d3e3', mat: '#b4acef', dusk: '#a39af0', well: '#b7c3d6', pic: '#5f9fe6', night: '#5d55c9',
};

const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${(Object.keys(WASH) as Wash[]).map(k =>
  `<linearGradient id="w-${k}" x1="0.12" y1="0.04" x2="0.88" y2="0.96"><stop offset="0" stop-color="${WASH[k][0]}"/><stop offset="1" stop-color="${WASH[k][1]}"/></linearGradient>`).join('')}</defs></svg>`;

const n = (v: number) => +v.toFixed(2);
const rad = (deg: number) => (deg * Math.PI) / 180;
const P = (cx: number, cy: number, r: number, deg: number): [number, number] => [n(cx + r * Math.cos(rad(deg))), n(cy + r * Math.sin(rad(deg)))];
const circ = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) => `M${n(cx - rx)} ${n(cy)}A${rx} ${ry} 0 1 1 ${n(cx + rx)} ${n(cy)}A${rx} ${ry} 0 1 1 ${n(cx - rx)} ${n(cy)}Z`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${x0} ${y0}A${n(r)} ${n(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
};
const ellArc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) => {
  const pt = (a: number) => `${n(cx + rx * Math.cos(rad(a)))} ${n(cy + ry * Math.sin(rad(a)))}`;
  return `M${pt(a0)}A${rx} ${ry} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${pt(a1)}`;
};
const rr = (x: number, y: number, w: number, hh: number, r: number) =>
  `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + hh - r)}A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + hh)}H${n(x + r)}A${r} ${r} 0 0 1 ${n(x)} ${n(y + hh - r)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z`;

const fill = (d: string, w: Wash, extra = '') => `<path d="${d}" fill="url(#w-${w})"${extra}/>`;
const ink = (d: string, width = SW, extra = '') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const solid = (d: string) => `<path d="${d}" fill="${INK}"/>`;
const rim = (d: string) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="${RIM}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shade = (d: string, w: Wash) => `<path d="${d}" fill="none" stroke="${DEEP[w]}" stroke-opacity="0.45" stroke-width="${RIM}" stroke-linecap="round" stroke-linejoin="round"/>`;
const glint = (x: number, y: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.3 * SW)}" fill="#fff" fill-opacity="0.9"/>`;
/** One shape in the house manner: wash, then outline. */
const shape = (d: string, w: Wash, width = SW) => fill(d, w) + ink(d, width);

/** Rim light along the top-left of a rounded rect, and the bevel shade along its bottom-right. */
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
/** A rounded rect in the house manner: wash, light, outline. */
const box = (x: number, y: number, w: number, hh: number, r: number, wash: Wash, o: { rim?: boolean; shade?: boolean; glint?: boolean; width?: number } = {}) =>
  fill(rr(x, y, w, hh, r), wash) + rrLight(x, y, w, hh, r, wash, o) + ink(rr(x, y, w, hh, r), o.width ?? SW);
/** Rim light + glint on the top-left of a circle and the shade on its bottom-right. */
const circLight = (cx: number, cy: number, r: number, wash: Wash, inset = IN) =>
  rim(arc(cx, cy, r - inset, 196, 246)) + glint(...P(cx, cy, r - inset, 258)) + shade(arc(cx, cy, r - inset, 18, 104), wash);

/** Short horizontal speed dashes (the house motion mark), right-aligned on x. */
const dashes = (x: number, ys: number[], lens: number[], width = SW) =>
  ys.map((y, i) => ink(`M${n(x - lens[i % lens.length])} ${n(y)}H${n(x)}`, width)).join('');

/** A sweat drop: round end at (cx, cy), tip pointing towards `deg` (SVG degrees). */
function drop(cx: number, cy: number, r: number, deg: number) {
  const d = 2.2 * r, a = (Math.acos(r / d) * 180) / Math.PI;
  const tip = P(cx, cy, d, deg), t1 = P(cx, cy, r, deg + a), t2 = P(cx, cy, r, deg - a);
  const path = `M${tip[0]} ${tip[1]}L${t1[0]} ${t1[1]}A${r} ${r} 0 1 1 ${t2[0]} ${t2[1]}Z`;
  return fill(path, 'sky') + glint(...P(cx, cy, r * 0.45, 225)) + ink(path, DET);
}

// ── Pieces: only from the generator ───────────────────────────────────────────────────────────────────
const cellCentre = (j: Jigsaw, p: Piece): [number, number] => {
  const o = j.options, pw = o.width / o.cols, ph = o.height / o.rows;
  return [o.x + (p.col + 0.5) * pw, o.y + (p.row + 0.5) * ph];
};
/** Transform that rotates a piece about its cell centre and moves that centre to `to`. */
const moveTo = (j: Jigsaw, p: Piece, to: [number, number], rot = 0) => {
  const [cx, cy] = cellCentre(j, p);
  return `translate(${n(to[0] - cx)} ${n(to[1] - cy)}) rotate(${n(rot)} ${n(cx)} ${n(cy)})`;
};
/** Horizontal extent of a piece's bbox about its cell centre after a rotation by a multiple of 90°. */
function extent(j: Jigsaw, p: Piece, rot: number): [number, number] {
  const [cx, cy] = cellCentre(j, p), b = p.bbox;
  const r = ((rot % 360) + 360) % 360;
  if (r === 0) return [cx - b.x, b.x + b.width - cx];
  if (r === 180) return [b.x + b.width - cx, cx - b.x];
  if (r === 90) return [b.y + b.height - cy, cy - b.y];
  return [cy - b.y, b.y + b.height - cy];
}
const pieceShape = (j: Jigsaw, p: Piece, to: [number, number], rot: number, wash: Wash, width = DET) =>
  `<path d="${p.d}" transform="${moveTo(j, p, to, rot)}" fill="url(#w-${wash})" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round"/>`;

/** The puzzle picture every box and puzzle in this format shows: sky, a coral sun and two rows of hills. */
function picture(x: number, y: number, w: number, hh: number, inked = true, sunX = 0.72) {
  const hills1 = `M${x - 20} ${n(y + hh * 0.64)}C${n(x + w * 0.2)} ${n(y + hh * 0.46)} ${n(x + w * 0.42)} ${n(y + hh * 0.5)} ${n(x + w * 0.6)} ${n(y + hh * 0.62)}C${n(x + w * 0.75)} ${n(y + hh * 0.54)} ${n(x + w * 0.9)} ${n(y + hh * 0.52)} ${x + w + 20} ${n(y + hh * 0.6)}V${y + hh + 20}H${x - 20}Z`;
  const hills2 = `M${x - 20} ${n(y + hh * 0.82)}C${n(x + w * 0.3)} ${n(y + hh * 0.7)} ${n(x + w * 0.62)} ${n(y + hh * 0.76)} ${x + w + 20} ${n(y + hh * 0.86)}V${y + hh + 20}H${x - 20}Z`;
  return [
    `<rect x="${x - 20}" y="${y - 20}" width="${w + 40}" height="${hh + 40}" fill="url(#w-pic)"/>`,
    inked ? shape(circ(x + w * sunX, y + hh * 0.3, hh * 0.13), 'coral', DET) : fill(circ(x + w * sunX, y + hh * 0.3, hh * 0.13), 'coral'),
    inked ? shape(hills1, 'lav', DET) : fill(hills1, 'lav'),
    inked ? shape(hills2, 'pale', DET) : fill(hills2, 'pale'),
  ].join('');
}

// ── Objects ───────────────────────────────────────────────────────────────────────────────────────────
interface Art { w: number; h: number; base: number; svg: string }

/** Stopwatch (D7) with the hand at a given minute of a 60-minute dial. */
function stopwatch(minute: number, R = 194): Art & { cx: number; cy: number; R: number } {
  const W = 2 * R + 82, cx = W / 2, r = Math.round(R * 0.65), cy = 10 + 52 + 18 + R;
  const base = cy + R;
  const s: string[] = [];
  for (const a of [-135, -45]) {
    const [px, py] = P(cx, cy, R + 24, a);
    const t = `transform="rotate(${a + 90} ${px} ${py})"`;
    const [n1, n2] = [P(cx, cy, R - 2, a - 4.2), P(cx, cy, R + 12, a - 4.2)];
    const [m1, m2] = [P(cx, cy, R - 2, a + 4.2), P(cx, cy, R + 12, a + 4.2)];
    s.push(ink(`M${n1[0]} ${n1[1]}L${n2[0]} ${n2[1]}M${m1[0]} ${m1[1]}L${m2[0]} ${m2[1]}`));
    s.push(`<g ${t}>${fill(rr(px - 34, py - 16, 68, 32, 14), 'coral')}${rim(`M${px - 22} ${py - 16 + IN}H${px + 2}`)}${ink(rr(px - 34, py - 16, 68, 32, 14))}</g>`);
  }
  const capY = 10, capH = 52, neckY = capY + capH;
  s.push(ink(`M${cx - 20} ${neckY}V${cy - R + 2}M${cx + 20} ${neckY}V${cy - R + 2}`));
  s.push(box(cx - 62, capY, 124, capH, 20, 'coral', { glint: false }));
  s.push(fill(circ(cx, cy, r), 'face'));
  s.push(fill(circ(cx, cy, R) + circ(cx, cy, r), 'coral', ' fill-rule="evenodd"'));
  s.push(circLight(cx, cy, R, 'coral'));
  const handA = -90 + (minute / 60) * 360;
  const [hx, hy] = P(cx, cy, r - 30, handA);
  const [wx0, wy0] = P(cx, cy, r - 10, -90), [wx1, wy1] = P(cx, cy, r - 10, handA);
  s.push(`<path d="M${cx} ${cy}L${wx0} ${wy0}A${r - 10} ${r - 10} 0 ${minute > 30 ? 1 : 0} 1 ${wx1} ${wy1}Z" fill="url(#w-pale)"/>`);
  s.push(ink(circ(cx, cy, R)) + ink(circ(cx, cy, r)));
  for (let k = 0; k < 12; k++) {
    const a = -90 + k * 30, major = k % 3 === 0;
    const [x1, y1] = P(cx, cy, r - (major ? 30 : 22), a), [x2, y2] = P(cx, cy, r - 14, a);
    s.push(ink(`M${x1} ${y1}L${x2} ${y2}`, major ? SW : DET));
  }
  s.push(ink(`M${cx} ${cy}L${hx} ${hy}`));
  s.push(solid(circ(cx, cy, 14)));
  return { w: W, h: base + SW, base, svg: s.join(''), cx, cy, R };
}

/** A puzzle box seen from the front: white body, a lid band in a wash, an optional piece count on the body. */
function puzzleBox(x: number, y: number, w: number, hh: number, lid: Wash, label?: string, fontPx = 40) {
  const r = 14, lidH = Math.round(Math.min(hh * 0.36, 44)), ri = r - IN;
  return [
    fill(rr(x, y, w, hh, r), 'face'),
    `<path d="M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + lidH}H${x}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z" fill="url(#w-${lid})"/>`,
    rim(`M${x + IN} ${y + lidH - 4}V${y + r}A${n(ri)} ${n(ri)} 0 0 1 ${x + r} ${y + IN}H${n(x + w * 0.4)}`),
    shade(`M${x + w - IN} ${y + hh - r - 10}V${y + hh - r}A${n(ri)} ${n(ri)} 0 0 1 ${x + w - r} ${y + hh - IN}H${n(x + w * 0.6)}`, 'face'),
    label ? `<text class="lbl" x="${n(x + w / 2)}" y="${n(y + lidH + (hh - lidH) / 2 + fontPx * 0.36)}" text-anchor="middle" style="font-size:${fontPx}px">${h(label)}</text>` : '',
    ink(`M${x} ${y + lidH}H${x + w}`),
    ink(rr(x, y, w, hh, r)),
  ].join('');
}

/** A puzzle box seen from the front: the picture on the lid face, a coral rim on top, a white piece-count tag. */
function boxFront(x: number, y: number, w: number, hh: number, label: string, fontPx: number, id: string, o: { tag?: 'tl' | 'bl'; sunX?: number } = {}) {
  const rimH = 26, r = 14, ri = r - IN;
  const tw = label.length * fontPx * 0.62 + 32, th = fontPx + 18, tx = x + 18, ty = o.tag === 'tl' ? y + rimH + 18 : y + hh - th - 16;
  return [
    `<defs><clipPath id="${id}"><path d="${rr(x, y, w, hh, r)}"/></clipPath></defs>`,
    `<g clip-path="url(#${id})">${picture(x, y + rimH, w, hh - rimH, true, o.sunX)}</g>`,
    `<path d="M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + rimH}H${x}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z" fill="url(#w-coral)"/>`,
    rim(`M${x + IN} ${y + rimH - 4}V${y + r}A${n(ri)} ${n(ri)} 0 0 1 ${x + r} ${y + IN}H${n(x + w * 0.4)}`),
    ink(`M${x} ${y + rimH}H${x + w}`),
    fill(rr(tx, ty, tw, th, 10), 'face') + ink(rr(tx, ty, tw, th, 10), DET),
    `<text class="lbl" x="${n(tx + tw / 2)}" y="${n(ty + th / 2 + fontPx * 0.36)}" text-anchor="middle" style="font-size:${fontPx}px">${h(label)}</text>`,
    ink(rr(x, y, w, hh, r)),
  ].join('');
}

// ── Panel and page chrome ─────────────────────────────────────────────────────────────────────────────
const PX = 88, PY = 136, PW = 904, PH = 760, PR = 30;

/** The cartoon panel: a rounded frame with a wall and (for side views) a table; scene coordinates are panel px. */
function panel(scene: string, o: { wall?: Wash; table?: Wash; tableY?: number; defs?: string } = {}) {
  const t = o.tableY;
  return `<svg class="panel" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}" style="left:${PX}px; top:${PY}px" aria-hidden="true">
    <defs><clipPath id="pclip"><path d="${rr(0, 0, PW, PH, PR)}"/></clipPath>${o.defs ?? ''}</defs>
    <g clip-path="url(#pclip)">
      <rect x="0" y="0" width="${PW}" height="${PH}" fill="url(#w-${o.wall ?? 'wall'})"/>
      ${t ? `<rect x="0" y="${t}" width="${PW}" height="${PH - t}" fill="url(#w-${o.table ?? 'lavp'})"/>` : ''}
      ${scene}
      ${t ? `<path d="M0 ${t}H${PW}" stroke="${INK}" stroke-width="6"/>` : ''}
    </g>
    <path d="${rr(3, 3, PW - 6, PH - 6, PR - 3)}" fill="none" stroke="${INK}" stroke-width="6"/>
  </svg>`;
}

const css = `
.frame { position: relative; width: 1080px; height: 1350px; background: var(--paper); overflow: hidden; }
.panel { position: absolute; display: block; }
.hd { position: absolute; left: ${PX}px; width: ${PW}px; top: 64px; display: flex; align-items: center; justify-content: space-between; }
.series { font-size: 32px; font-weight: 700; color: var(--ink); }
.no { font-size: 30px; font-weight: 500; color: var(--ink-muted); }
.below { position: absolute; left: ${PX}px; top: ${PY + PH + 30}px; width: ${PW}px; height: 270px; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.punch { font-size: 58px; line-height: 1.08; font-weight: 700; letter-spacing: -1.2px; text-wrap: balance; }
.wink { font-size: 34px; line-height: 1.3; color: var(--ink-soft); text-wrap: pretty; }
.wink b { color: var(--ink); font-weight: 700; }
.mark { position: relative; isolation: isolate; white-space: nowrap; }
.mark::after { content: ''; position: absolute; left: -4px; right: -6px; bottom: 6px; height: 20px; z-index: -1; background: #fb8180; border-radius: 6px; }
.foot { position: absolute; left: ${PX}px; width: ${PW}px; top: 1214px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.src { font-size: 30px; color: var(--ink-muted); }
.logo { width: 66px; height: 58px; }
.lbl { font-family: Rubik, sans-serif; font-weight: 700; fill: var(--ink); font-variant-numeric: tabular-nums; }
.tag { position: absolute; font-size: 32px; font-weight: 700; color: var(--ink); white-space: nowrap; }
`;

const SERIES = 'Meanwhile, at the puzzle table';
const page = (o: { no: string; series?: string; panel: string; below: string; foot: string; extra?: string }) =>
  `${DEFS}<div class="frame">
    <header class="hd"><span class="series">${h(o.series ?? SERIES)}</span><span class="no">${h(o.no)}</span></header>
    ${o.panel}
    ${o.extra ?? ''}
    <div class="below">${o.below}</div>
    <footer class="foot"><span class="src">${h(o.foot)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>
  </div>`;

// ── 1. Minute 58: the sprinting, sweating stopwatch ──────────────────────────────────────────────────
function minute58(F: ReturnType<typeof facts>): Post {
  const m = F.minute;
  const TY = 650;
  const sw = stopwatch(m.mode + 59 / 60, 214);
  // It runs to the left (leaning into it, so the hand reads clearly before the top); speed dashes trail right
  // and the sweat flies off behind it.
  const gx = 360, x = gx - sw.w / 2, lean = -8;
  const toward = (dx: number, dy: number) => (Math.atan2(sw.cy - dy, sw.cx - dx) * 180) / Math.PI;
  const drops = ([[sw.cx + sw.R + 46, sw.cy - sw.R + 6, 18], [sw.cx + sw.R - 14, sw.cy - sw.R - 50, 15], [sw.cx + sw.R + 70, sw.cy - sw.R + 92, 13]] as const)
    .map(([dx, dy, r]) => drop(dx, dy, r, toward(dx, dy))).join('');
  const scene = [
    dashes(850, [262, 338, 414, 490], [130, 180, 100, 150]),
    `<g transform="rotate(${lean} ${gx} ${TY})"><g transform="translate(${n(x)} ${TY - sw.base})">${sw.svg}${drops}</g></g>`,
  ].join('');
  return {
    key: 'cartoon-minute-58',
    label: 'Cartoon · Minute 58 (the sweating stopwatch)',
    caption: `More solo 500s on MSP finish in minute ${m.mode} than in any other minute: ${fmtInt(m.results)} of them. From minute 59 to minute 60, the count drops ${Math.abs(m.drop)}%.\n\nOur guess: nobody wants to see 1:00:xx on the timer, so minute ${m.mode} is when the sorting gets very, very efficient.\n\nKnow someone who stops the clock at 59:59? This one's for them.\n\n#speedpuzzling #jigsawpuzzle`,
    slides: [{ id: 'minute-58', body: page({
      no: 'No. 1',
      panel: panel(scene, { tableY: TY }),
      below: `<p class="punch">Nothing focuses the mind like <span class="mark">minute ${m.mode}.</span></p>
        <p class="wink">More solo 500s on MSP finish in minute ${m.mode} than in any other: <b>${fmtInt(m.results)}</b> of them.</p>`,
      foot: F.source,
    }) }],
  };
}

// ── 2. Unboxed: the cat on the box lid ────────────────────────────────────────────────────────────────
/** A tabby cat seen from behind (no face), sitting. `k` scales the drawing; strokes keep the house weights. */
function cat(cx0: number, base0: number, k = 1) {
  const X = (v: number) => n(cx0 + k * v), Y = (v: number) => n(base0 - k * v);
  const body = `M${X(-150)} ${Y(0)}C${X(-172)} ${Y(96)} ${X(-124)} ${Y(196)} ${X(-64)} ${Y(222)}Q${X(0)} ${Y(244)} ${X(64)} ${Y(222)}C${X(124)} ${Y(196)} ${X(172)} ${Y(96)} ${X(150)} ${Y(0)}Z`;
  const hy = Y(292), hrx = 94 * k, hry = 80 * k;
  const head = ell(X(0), hy, hrx, hry);
  const ear = (s: 1 | -1) => `M${X(s * 88)} ${n(hy - k * 6)}L${X(s * 74)} ${n(hy - k * 104)}L${X(s * 20)} ${n(hy - k * 72)}Z`;
  const tail = `M${X(104)} ${Y(16)}C${X(190)} ${Y(6)} ${X(236)} ${Y(40)} ${X(238)} ${Y(92)}C${X(240)} ${Y(138)} ${X(208)} ${Y(158)} ${X(186)} ${Y(138)}`;
  const T = 40 * k;
  const stripes = [
    // back: from both flanks inward
    ...[0, 1, 2].map(i => {
      const y = 176 - i * 50;
      return `M${X(-190)} ${Y(y + 6)}Q${X(-140)} ${Y(y - 6)} ${X(-96)} ${Y(y - 2)}M${X(190)} ${Y(y + 6)}Q${X(140)} ${Y(y - 6)} ${X(96)} ${Y(y - 2)}`;
    }),
    // spine marking
    `M${X(0)} ${Y(214)}V${Y(150)}`,
  ].join('');
  const headStripes = `M${X(-26)} ${n(hy - k * 82)}Q${X(-24)} ${n(hy - k * 58)} ${X(-30)} ${n(hy - k * 44)}M${X(0)} ${n(hy - k * 84)}V${n(hy - k * 40)}M${X(26)} ${n(hy - k * 82)}Q${X(24)} ${n(hy - k * 58)} ${X(30)} ${n(hy - k * 44)}`;
  return [
    `<defs><clipPath id="cat-body"><path d="${body}"/></clipPath><clipPath id="cat-head"><path d="${head}"/></clipPath></defs>`,
    // tail (behind the body): navy band, then the wash inside it
    `<path d="${tail}" fill="none" stroke="${INK}" stroke-width="${T + SW}" stroke-linecap="round"/>`,
    `<path d="${tail}" fill="none" stroke="url(#w-coral)" stroke-width="${T - SW}" stroke-linecap="round"/>`,
    fill(body, 'coral'),
    `<g clip-path="url(#cat-body)"><path d="${stripes}" fill="none" stroke="${DEEP.coral}" stroke-opacity="0.55" stroke-width="12" stroke-linecap="round"/></g>`,
    rim(`M${X(-150) + IN} ${Y(40)}C${X(-160) + IN} ${Y(104)} ${X(-120) + IN} ${Y(190)} ${X(-66)} ${Y(210)}`),
    shade(`M${X(150) - IN} ${Y(30)}C${X(160) - IN} ${Y(100)} ${X(136) - IN} ${Y(160)} ${X(110)} ${Y(192)}`, 'coral'),
    ink(body),
    shape(ear(-1), 'coral'), shape(ear(1), 'coral'),
    fill(head, 'coral'),
    `<g clip-path="url(#cat-head)"><path d="${headStripes}" fill="none" stroke="${DEEP.coral}" stroke-opacity="0.55" stroke-width="12" stroke-linecap="round"/></g>`,
    rim(ellArc(X(0), hy, hrx - IN, hry - IN, 196, 244)), glint(X(-22), hy - hry + IN + 1),
    shade(ellArc(X(0), hy, hrx - IN, hry - IN, 20, 90), 'coral'),
    ink(head),
  ].join('');
}

/** An open box bottom seen from the side, with generator pieces poking out of it. */
function openBox(x: number, base: number, w: number, hh: number, jig: Jigsaw, picks: Piece[], washes: Wash[], id: string) {
  const y = base - hh;
  return [
    `<defs><clipPath id="${id}"><rect x="${x - 200}" y="${y - 400}" width="${w + 400}" height="${400 + DET}"/></clipPath></defs>`,
    `<g clip-path="url(#${id})">${picks.map((p, i) => pieceShape(jig, p, [x + w * (0.22 + (0.56 * i) / Math.max(1, picks.length - 1)), y + 4 - (i % 2 ? 22 : 8)], (i - 1) * 22, washes[i % washes.length])).join('')}</g>`,
    puzzleBox(x, y, w, hh, 'coral'),
  ].join('');
}

function unboxed(F: ReturnType<typeof facts>): Post {
  const TY = 660, cx = 470;
  // The box lid stands against the wall, picture side to us (the same box front as the balance cartoon: coral rim,
  // picture, piece-count tag). The cat sits right in front of it; the open box with the pieces stands beside it.
  const lx = 172, lw = 600, ly = 190, lh = TY - 190;
  const jig = generateJigsaw({ cols: 5, rows: 5, width: 5 * 64, height: 5 * 64, seed: 9, tabSize: 0.22, jitter: 0.03 });
  const inner = jig.pieces.filter(p => p.col > 0 && p.row > 0 && p.col < 4 && p.row < 4);
  const scene = [
    boxFront(lx, ly, lw, lh, String(F.sizes.small), 40, 'lid', { tag: 'tl', sunX: 0.86 }),
    cat(cx, TY, 1.14),
    openBox(30, TY, 196, 96, jig, inner.slice(0, 3), ['sky', 'lav', 'coral'], 'tray-clip'),
  ].join('');
  return {
    key: 'cartoon-unboxed',
    label: 'Cartoon · Unboxed, not by choice (the cat on the box lid)',
    caption: `Unboxed: solved without looking at the picture on the box. Some of you do it for the challenge and the unboxed XP bonus. Some of you have a cat.\n\nDoes it still count if the cat chose for you? Asking for a friend.\n\nSend this to the puzzler whose cat has a favourite box lid.\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [{ id: 'unboxed', body: page({
      no: 'No. 2',
      panel: panel(scene, { tableY: TY }),
      below: `<p class="punch">Unboxed. <span class="mark">Not by choice.</span></p>
        <p class="wink">Still claiming the unboxed XP bonus.</p>`,
      foot: 'myspeedpuzzling.com',
    }) }],
  };
}

// ── 3. Twice the pieces, three times the evening: the balance ────────────────────────────────────────
function balance(F: ReturnType<typeof facts>): Post {
  const s = F.sizes, TY = 650, cx = PW / 2;
  const beamY = 420, arm = 250, plateY = 330;
  const scene: string[] = [];
  // gauge behind the pillar: needle straight up = balanced
  const gR = 92;
  scene.push(fill(`M${cx - gR} ${beamY}A${gR} ${gR} 0 0 1 ${cx + gR} ${beamY}Z`, 'face'));
  for (const a of [-150, -120, -90, -60, -30]) {
    const [x1, y1] = P(cx, beamY, gR - (a === -90 ? 30 : 22), a), [x2, y2] = P(cx, beamY, gR - 12, a);
    scene.push(ink(`M${x1} ${y1}L${x2} ${y2}`, a === -90 ? SW : DET));
  }
  scene.push(ink(`M${cx - gR} ${beamY}A${gR} ${gR} 0 0 1 ${cx + gR} ${beamY}`));
  scene.push(box(cx - 20, beamY, 40, TY - 40 - beamY + 6, 14, 'sky', { glint: false }));
  scene.push(box(cx - 130, TY - 40, 260, 40, 14, 'lav', { glint: false }));
  // stems and plates
  for (const sx of [-1, 1]) {
    const x = cx + sx * arm;
    scene.push(box(x - 13, plateY + 10, 26, beamY - plateY, 10, 'sky', { rim: false, glint: false }));
  }
  scene.push(box(cx - arm - 40, beamY - 4, 2 * arm + 80, 30, 15, 'coral', { glint: false }));
  scene.push(ink(`M${cx} ${beamY + 11}L${cx} ${beamY - gR + 34}`) + solid(circ(cx, beamY + 11, 15)));
  for (const sx of [-1, 1]) {
    const x = cx + sx * arm;
    scene.push(box(x - 135, plateY - 4, 270, 24, 12, 'face', { glint: false }));
  }
  // left: one big box; right: as many small boxes as the time ratio says
  const bw = 236, bh = 196;
  scene.push(boxFront(cx - arm - bw / 2, plateY - 4 - bh, bw, bh, String(s.big), 44, 'big-box'));
  const k = s.timeRatio, sw = 200, sh = 70;
  for (let i = 0; i < k; i++) {
    const y = plateY - 4 - (i + 1) * sh;
    scene.push(puzzleBox(cx + arm - sw / 2 + (i % 2 ? 8 : -6), y, sw, sh, i % 2 ? 'sky' : 'coral', String(s.small), 34));
  }
  return {
    key: 'cartoon-1000',
    label: 'Cartoon · Twice the pieces, three times the evening (the balance)',
    caption: `A ${s.big} has ${s.pieceRatio === 2 ? 'twice' : `${s.pieceRatio}×`} the pieces of a ${s.small}. On MSP, the median solo ${s.big} takes ${s.medBig}, about ${times(s.timeRatio).toLowerCase()} the median solo ${s.small} (${s.medSmall}).\n\nOur guess: every extra piece is one more piece to search through for every placement, and that adds up fast.\n\nHow long did your last ${s.big} take?\n\n#speedpuzzling #jigsawpuzzle`,
    slides: [{ id: 'balance', body: page({
      no: 'No. 3',
      panel: panel(scene.join(''), { tableY: TY }),
      below: `<p class="punch">${times(s.pieceRatio)} the pieces. <span class="mark">${times(s.timeRatio)} the evening.</span></p>
        <p class="wink">Median solo time on MSP: <b>${s.medSmall}</b> for a ${s.small}, <b>${s.medBig}</b> for a ${s.big}.</p>`,
      foot: F.source,
    }) }],
  };
}

// ── 4. Edges first / edges last (2-slide carousel) ───────────────────────────────────────────────────
function edges(F: ReturnType<typeof facts>): Post {
  const C = 7, R = 5, S = 72, W = C * S, H = R * S;
  const ox = (PW - W) / 2, oy = 40;
  const jig = generateJigsaw({ cols: C, rows: R, width: W, height: H, x: ox, y: oy, seed: 15, tabSize: 0.22, jitter: 0.03 });
  const isEdge = (p: Piece) => p.col === 0 || p.row === 0 || p.col === C - 1 || p.row === R - 1;
  const defs = `<g id="pic">${picture(ox, oy, W, H, false)}</g>` + jig.pieces.map((p, i) => `<clipPath id="pc${i}"><path d="${p.d}"/></clipPath>`).join('');
  const draw = (p: Piece, tf = '') => {
    const i = jig.pieces.indexOf(p);
    return `<g${tf ? ` transform="${tf}"` : ''}><g clip-path="url(#pc${i})"><use href="#pic"/></g><path d="${p.d}" fill="none" stroke="${INK}" stroke-width="${DET}" stroke-linejoin="round"/></g>`;
  };
  // The puzzle's footprint on the mat.
  const outline = `<path d="${rr(ox - 8, oy - 8, W + 16, H + 16, 10)}" fill="none" stroke="${DEEP.mat}" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>`;

  // Edges last: the border pieces wait in sorted rows, flat side down, corners at the ends.
  const top = jig.pieces.filter(p => p.row === 0), bot = jig.pieces.filter(p => p.row === R - 1);
  const left = jig.pieces.filter(p => p.col === 0 && p.row > 0 && p.row < R - 1), right = jig.pieces.filter(p => p.col === C - 1 && p.row > 0 && p.row < R - 1);
  const rotOf = (p: Piece) => {
    if (p.row === 0 && p.col === 0) return -90;
    if (p.row === 0 && p.col === C - 1) return 90;
    if (p.row === 0) return 180;
    if (p.row === R - 1) return 0;
    return p.col === 0 ? -90 : 90;
  };
  const queueRows = [top, bot, [...left, ...right]];
  const queue: string[] = [];
  queueRows.forEach((row, ri) => {
    const ex = row.map(p => extent(jig, p, rotOf(p)));
    const gap = 16, total = ex.reduce((s, e) => s + e[0] + e[1], 0) + gap * (row.length - 1);
    let x = (PW - total) / 2;
    const baseY = oy + H + 120 + ri * 100;
    row.forEach((p, i) => {
      x += ex[i][0];
      queue.push(draw(p, moveTo(jig, p, [x, baseY - S / 2], rotOf(p))));
      x += ex[i][1] + gap;
    });
  });

  // Edges first: the middle pieces lie about in a loose spread.
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const mid = jig.pieces.filter(p => !isEdge(p));
  const order = mid.map(p => ({ p, k: rnd() })).sort((a, b) => a.k - b.k).map(o => o.p);
  const spread = order.map((p, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = 130 + col * 148 + (row % 2 ? 50 : 0) + (rnd() - 0.5) * 24;
    const y = oy + H + 82 + row * 98 + (rnd() - 0.5) * 12;
    return draw(p, moveTo(jig, p, [x, y], Math.round((rnd() - 0.5) * 120)));
  });

  const slide = (id: string, no: string, scene: string, punch: string, wink: string) => ({ id, body: page({
    no, panel: panel(scene, { wall: 'mat', defs }), below: `<p class="punch">${punch}</p><p class="wink">${wink}</p>`, foot: 'myspeedpuzzling.com',
  }) });
  return {
    key: 'cartoon-edges',
    label: 'Cartoon · Edges first: the correct way / Edges last: also the correct way (2 slides)',
    caption: `Edges first or edges last? Both camps finish puzzles. Neither camp is switching.\n\nEdges first gives you a frame to build into. Edges last lets the picture tell you where every border piece goes.\n\nWhich camp are you in, and why?\n\n#speedpuzzling #jigsawpuzzle`,
    slides: [
      slide('edges-first', '1 / 2', outline + jig.pieces.filter(isEdge).map(p => draw(p)).join('') + spread.join(''),
        `Edges first: <span class="mark">the correct way.</span>`, 'The middle pieces have been waiting since 0:00.'),
      slide('edges-last', '2 / 2', outline + mid.map(p => draw(p)).join('') + queue.join(''),
        `Edges last: <span class="mark">also the correct way.</span>`, 'The edge pieces have been waiting since 0:00.'),
    ],
  };
}

// ── 5. Sorting the sky ───────────────────────────────────────────────────────────────────────────────
function sky(F: ReturnType<typeof facts>): Post {
  const S = 66;
  const jig = generateJigsaw({ cols: 8, rows: 6, width: 8 * S, height: 6 * S, seed: 23, tabSize: 0.22, jitter: 0.03 });
  const inner = jig.pieces.filter(p => p.col > 0 && p.row > 0 && p.col < 7 && p.row < 5);
  const tw = 400, th = 318, gx = 36, gy = 44, xs = [gx, PW - gx - tw], ys = [gy, PH - gy - th];
  const labels = ['sky', 'also sky', 'sky?', 'not sky'];
  let seed = 3;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const scene: string[] = [];
  const tags: string[] = [];
  let k = 0;
  labels.forEach((label, t) => {
    const x = xs[t % 2], y = ys[Math.floor(t / 2)];
    scene.push(box(x, y, tw, th, 26, 'face', { glint: false }));
    scene.push(fill(rr(x + 22, y + 22, tw - 44, th - 44, 16), 'well') + ink(rr(x + 22, y + 22, tw - 44, th - 44, 16), DET));
    if (t < 3) {
      for (let i = 0; i < 6; i++) {
        const p = inner[k++ % inner.length];
        const cx = x + tw / 2 + ((i % 3) - 1) * 112 + (rnd() - 0.5) * 10;
        const cy = y + 30 + th / 2 + (Math.floor(i / 3) - 0.5) * 112 + (rnd() - 0.5) * 8;
        scene.push(pieceShape(jig, p, [cx, cy], Math.floor(rnd() * 4) * 90 + (rnd() - 0.5) * 16, 'sky'));
      }
    } else {
      scene.push(pieceShape(jig, inner[k++ % inner.length], [x + tw / 2, y + 30 + th / 2], -8, 'coral'));
    }
    // masking-tape label across the top rim
    const lw = 40 + label.length * 19, lx = x + tw / 2 - lw / 2, ly = y - 18;
    scene.push(`<g transform="rotate(${t % 2 ? 3 : -3} ${x + tw / 2} ${ly + 25})">${fill(rr(lx, ly, lw, 50, 6), 'pale')}${ink(rr(lx, ly, lw, 50, 6), DET)}</g>`);
    tags.push(`<span class="tag" style="left:${PX + x + tw / 2}px; top:${PY + ly + 4}px; transform:translateX(-50%) rotate(${t % 2 ? 3 : -3}deg)">${h(label)}</span>`);
  });
  return {
    key: 'cartoon-sky',
    label: 'Cartoon · Sorting the sky section (four trays: sky, also sky, sky?, not sky)',
    caption: `Every sky section, every time.\n\nThe usual advice: once the colour stops helping, sort by shape. Count the knobs, look at the corners and stop staring at the blue.\n\nWhat's your most dreaded section: sky, fur or grass?\n\n#speedpuzzling #jigsawpuzzle`,
    slides: [{ id: 'sky', body: page({
      no: 'No. 4',
      panel: panel(scene.join(''), { wall: 'mat' }),
      extra: tags.join(''),
      below: `<p class="punch">Sorting the <span class="mark">sky section.</span></p>
        <p class="wink">Tip: sort the sky by shape. The colour stopped helping a while ago.</p>`,
      foot: 'myspeedpuzzling.com',
    }) }],
  };
}

// ── 6. Halloween: the haunted puzzle box and the pumpkin sorting trays ──────────────────────────────
function pumpkin(cx: number, base: number, rx: number, ry: number, jig: Jigsaw, picks: Piece[], washes: Wash[], id: string) {
  const cy = base - ry;
  const lobe = (dx: number, k: number) => ell(cx + dx, cy, rx * 0.56 * k, ry);
  const oy = cy - ry + 20, orx = rx * 0.42, ory = 15;
  const s: string[] = [];
  // pieces in the opening: visible above the rim line and inside the opening ellipse
  s.push(`<defs><clipPath id="${id}"><rect x="${cx - rx * 2}" y="${oy - 400}" width="${rx * 4}" height="400"/><path d="${ell(cx, oy, orx, ory)}"/></clipPath></defs>`);
  for (const dx of [-1, 1]) s.push(shape(lobe(dx * rx * 0.44, 0.98), 'orange'));
  s.push(fill(lobe(0, 1), 'orange'));
  s.push(rim(ellArc(cx, cy, rx * 0.56 - IN, ry - IN, 200, 236)) + shade(ellArc(cx, cy, rx * 0.56 - IN, ry - IN, 30, 80), 'orange'));
  s.push(ink(lobe(0, 1)));
  s.push(`<path d="${ell(cx, oy, orx, ory)}" fill="${DEEP.orange}"/>`);
  s.push(`<g clip-path="url(#${id})">${picks.map((p, i) => pieceShape(jig, p, [cx + (i - (picks.length - 1) / 2) * orx * 0.62, oy - 18 - (i % 2) * 14], (i - 1) * 16, washes[i % washes.length])).join('')}</g>`);
  s.push(ink(ellArc(cx, oy, orx, ory, 0, 180), DET));
  return s.join('');
}

function halloween(F: ReturnType<typeof facts>): Post {
  const hw = F.halloween, TY = 640;
  const jig = generateJigsaw({ cols: 5, rows: 5, width: 5 * 62, height: 5 * 62, seed: 4, tabSize: 0.22, jitter: 0.03 });
  const inner = jig.pieces.filter(p => p.col > 0 && p.row > 0 && p.col < 4 && p.row < 4);
  const s: string[] = [];
  // cobweb in the top-left corner
  const web: string[] = [];
  const spokes = [4, 24, 46, 68, 86];
  for (const a of spokes) web.push(`M0 0L${P(0, 0, 230, a).join(' ')}`);
  for (const r of [80, 150, 220]) {
    for (let i = 0; i < spokes.length - 1; i++) {
      const [x0, y0] = P(0, 0, r, spokes[i]), [x1, y1] = P(0, 0, r, spokes[i + 1]);
      const [mx, my] = P(0, 0, r * 0.84, (spokes[i] + spokes[i + 1]) / 2);
      web.push(`M${x0} ${y0}Q${mx} ${my} ${x1} ${y1}`);
    }
  }
  s.push(ink(web.join(''), DET));
  // window with a full moon
  const wx = 600, wy = 80, ww = 220, wh = 270;
  const win = `M${wx} ${wy + wh}V${wy + ww / 2}A${ww / 2} ${ww / 2} 0 0 1 ${wx + ww} ${wy + ww / 2}V${wy + wh}Z`;
  s.push(fill(win, 'night'));
  const mx = wx + ww * 0.68, my = wy + 92, mr = 40;
  s.push(fill(circ(mx, my, mr), 'face') + rim(arc(mx, my, mr - IN * 0.8, 200, 250)) + ink(circ(mx, my, mr), DET));
  s.push(ink(`M${wx + ww / 2} ${wy + 6}V${wy + wh}M${wx} ${wy + 170}H${wx + ww}`, DET));
  s.push(ink(win));
  s.push(box(wx - 22, wy + wh - 2, ww + 44, 26, 10, 'face', { glint: false }));
  // the haunted box: a ghost rising out of it, the lid knocked aside
  const bx = 150, bw = 280, bh = 160, by = TY - bh, gcx = bx + bw / 2 + 4;
  const gTop = 196, gR = 96;
  const ghost = `M${gcx - gR} ${by + 30}C${gcx - gR - 6} ${by - 60} ${gcx - gR - 14} ${gTop + gR + 40} ${gcx - gR} ${gTop + gR}A${gR} ${gR} 0 0 1 ${gcx + gR} ${gTop + gR}C${gcx + gR + 14} ${gTop + gR + 40} ${gcx + gR + 6} ${by - 60} ${gcx + gR} ${by + 30}Z`;
  const armL = `M${gcx - gR + 4} ${gTop + 170}C${gcx - gR - 44} ${gTop + 150} ${gcx - gR - 58} ${gTop + 110} ${gcx - gR - 36} ${gTop + 96}C${gcx - gR - 20} ${gTop + 88} ${gcx - gR - 10} ${gTop + 110} ${gcx - gR + 4} ${gTop + 128}`;
  const armR = `M${gcx + gR - 4} ${gTop + 170}C${gcx + gR + 44} ${gTop + 150} ${gcx + gR + 58} ${gTop + 110} ${gcx + gR + 36} ${gTop + 96}C${gcx + gR + 20} ${gTop + 88} ${gcx + gR + 10} ${gTop + 110} ${gcx + gR - 4} ${gTop + 128}`;
  // the open top of the box, seen a little from above: the ghost rises out of it
  const mouth = `M${bx + 4} ${by + 8}L${bx + 26} ${by - 30}H${bx + bw - 26}L${bx + bw - 4} ${by + 8}Z`;
  s.push(fill(mouth, 'coral') + `<path d="M${bx + 30} ${by - 18}H${bx + bw - 30}L${bx + bw - 18} ${by + 4}H${bx + 18}Z" fill="${DEEP.coral}"/>` + ink(mouth));
  s.push(shape(armL, 'face') + shape(armR, 'face'));
  s.push(fill(ghost, 'face'));
  s.push(rim(`M${gcx - gR + IN} ${gTop + gR + 60}V${gTop + gR}A${gR - IN} ${gR - IN} 0 0 1 ${gcx - 30} ${gTop + IN + 4}`) + glint(gcx - 6, gTop + IN + 1));
  s.push(shade(`M${gcx + gR - IN} ${gTop + gR + 10}C${gcx + gR - IN + 8} ${gTop + gR + 60} ${gcx + gR - IN + 4} ${by - 40} ${gcx + gR - IN} ${by}`, 'face'));
  s.push(ink(ghost));
  s.push(solid(ell(gcx - 32, gTop + 92, 13, 20)) + solid(ell(gcx + 32, gTop + 92, 13, 20)));
  s.push(box(bx, by, bw, bh, 18, 'coral'));
  s.push(`<rect x="${bx + 60}" y="${by + 34}" width="${bw - 120}" height="${bh - 68}" rx="12" fill="#fff"/>`);
  s.push(pieceShape(jig, inner[4], [bx + bw / 2, by + bh / 2], 0, 'lav'));
  s.push(ink(rr(bx + 60, by + 34, bw - 120, bh - 68, 12), DET));
  // pumpkins as sorting trays
  s.push(pumpkin(598, TY, 108, 80, jig, inner.slice(0, 3), ['sky', 'lav', 'coral'], 'pk1'));
  s.push(pumpkin(802, TY, 84, 64, jig, inner.slice(5, 7), ['coral', 'sky'], 'pk2'));
  const top = hw.top;
  return {
    key: 'halloween',
    label: 'Seasonal · Halloween: the other eleven months, they haunt the shelf',
    caption: `Halloween puzzles know their season: ${hw.octPct}% of all results on puzzles with "Halloween" in the name were solved in October.${top ? `\n\nThe most-solved one on MSP: ${top.puzzle} by ${top.brand}, logged by ${fmtInt(top.solvers)} puzzlers.` : ''}\n\nWhich spooky puzzle comes off your shelf this month?\n\n#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [{ id: 'halloween', body: page({
      no: 'MSP DATA',
      series: 'Halloween special',
      panel: panel(s.join(''), { wall: 'dusk', table: 'lavp', tableY: TY }),
      below: `<p class="wink"><b>${hw.octPct}%</b> of all solves of puzzles with “Halloween” in the name happen in October.</p>
        <p class="punch">The other eleven months, <span class="mark">they haunt the shelf.</span></p>`,
      foot: hw.source,
    }) }],
  };
}

const direction: Direction = {
  id: 'F3',
  name: 'Cartoons & seasonal art',
  idea: 'Single-panel cartoons in the house illustration kit (one navy ink at one stroke, same-hue washes, generator pieces): a relatable speed-puzzling moment, one Rubik punchline, a small real MSP number as the wink; seasonal scenes in the same hand. '
    + 'AI-assisted later (not run): ComfyUI "composite-back": code renders the final frame plus masks; img2img/inpaint at low denoise adds paper grain and soft light ONLY inside the wash masks (wall, table, object fills); the code\'s ink, pieces and type are composited back on top, so outlines, piece geometry and every number stay exact.',
  css,
  posts: (_c: Content) => {
    const F = facts();
    return [minute58(F), unboxed(F), balance(F), edges(F), sky(F), halloween(F)];
  },
};
export default direction;
