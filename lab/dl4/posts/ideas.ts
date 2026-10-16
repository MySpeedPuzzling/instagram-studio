// DL4 · ideas: the approved DL3 idea prototypes in the house system. Content and concepts as approved in DL3
// (lab/dl3/directions/g1-themes-atlas.ts, g2-ai-scenes.ts); only the design changes.
//   atlas      every country's signature puzzle: a tile map cut from one generated jigsaw, region slides, your country
//   cats-dogs  versus poster, five rounds as split bars cut by a jigsaw edge, two shelves, a tie on the clock
//   tier-list  subjects as box-art pieces on an S/A/B/C board by median solo-500 time
//   museum     Museum of Most-Solved: AI-painted gallery wall plates (content/labs/AI1), real credited boxes hung
//              in code-drawn frames, plaques and signs on solid panels
// House rules: the warm map paper of DL3 is gone; every slide sits on the variant's ground (atlas series: H3 sky,
// H1 navy, H2 navy data + bold posters for cover/fact). Colours only through the ground tokens (--g-*, --c-*); box
// art sits on white mounts (one soft shadow) or as piece-shaped clips; the AI plates and white mounts are the only
// fixed colours. Text over box art or plates sits on solid panels with data-qa-bg.
//
// Data (cached; re-query with --fresh before any of this becomes a real post): boxes-country-signatures, bs-themes,
// bs-theme-speed, bs-comment-words, boxes-cats-dogs, boxes-subject-speed, bs-theme-champions and the box-image
// queries boxes-alltime-top/-month-top/-week-top. Private profiles are excluded in every query.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { fetchBoxes } from '../../../src/data/boxes.ts';
import { query } from '../../../src/data/db.ts';
import {
  CW, FEED, FEED_H, GROUNDS, TYPE, W, X0, X1, f1, frame, groundVars, linesOf, posterTopPath, slide, slotOf,
  type Ground, type SlideCtx, type Variant,
} from '../../../src/design/house.ts';
import { escapeHtml as h, fmtInt } from '../../../src/design/page.ts';
import { flagUrl, pieceGrid, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw, type Piece, type Point } from '../../../src/pieces/jigsaw.ts';
import { ROOT } from '../../../src/render/server.ts';
import type { Content } from '../content.ts';
import type { Family, Post } from '../types.ts';
import { post } from './data.ts';

const pt = (p: Point) => `${f1(p[0])} ${f1(p[1])}`;
/** The one soft shadow's colour (as .h-mount), used as a hard offset under SVG pieces. */
const SHADOW = 'rgba(16,22,34,.32)';

// ---------------------------------------------------------------- colour helpers (token choice, QA grounds)
const rgbOf = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
const hexOf = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = (x: string) => {
  const [r, g, b] = rgbOf(x).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const blend = (fg: string, bg: string, a: number) => hexOf(rgbOf(fg).map((v, i) => v * a + rgbOf(bg)[i] * (1 - a)));
const dist = (a: string, b: string) => Math.hypot(...rgbOf(a).map((v, i) => v - rgbOf(b)[i]));

/** A fill or text colour as its CSS token plus the hex it resolves to on this ground (for data-qa-bg). */
interface Tone { css: string; hex: string; op?: number }
/** The ground's text token that reads best on a fill: ink, or the ground colour itself (knocked out). */
const textOn = (g: Ground, fill: string): Tone =>
  contrast(g.ink, fill) >= contrast(g.bg, fill) ? { css: 'var(--g-ink)', hex: g.ink } : { css: 'var(--g-bg)', hex: g.bg };
/** Team colours: cats take the highlight; dogs the cool series unless it's too close to the highlight (sky). */
function teams(g: Ground): { cat: Tone; dog: Tone } {
  const cat = { css: 'var(--c-hot)', hex: g.chart.hot };
  const dog = dist(g.chart.hot, g.chart.cool) > 120 ? { css: 'var(--c-cool)', hex: g.chart.cool } : { css: 'var(--c-base)', hex: g.chart.base };
  return { cat, dog };
}
/** Tier fills, fast → slow: S the highlight (ink where the highlight is ink-dark), then ink fading into the ground. */
function tierTones(g: Ground): Tone[] {
  const s: Tone = dist(g.chart.hot, g.ink) > 120 ? { css: 'var(--c-hot)', hex: g.chart.hot } : { css: 'var(--g-ink)', hex: g.ink };
  // Nudge each opacity away from the mid-tone until its letter (ink or knocked out) clears 3.4:1 (large text).
  const tone = (op: number): Tone => {
    const best = (o: number) => { const hx = blend(g.ink, g.bg, o); return Math.max(contrast(g.ink, hx), contrast(g.bg, hx)); };
    for (let k = 0; k < 12 && best(op) < 3.4; k++) op = op >= 0.5 ? Math.min(1, op + 0.03) : Math.max(0, op - 0.03);
    return { css: 'var(--g-ink)', op: Number(op.toFixed(2)), hex: blend(g.ink, g.bg, op) };
  };
  return [s, ...[0.76, 0.54, 0.28].map(tone)];
}
const fillAttr = (t: Tone) => `fill="${t.css}"${t.op ? ` fill-opacity="${t.op}"` : ''}`;

// ---------------------------------------------------------------- local CSS (house tokens only)
const STYLE = `<style>
.ix-svg { position: absolute; left: 0; top: 0; }
.ix-flag { position: absolute; border-radius: 50%; box-shadow: 0 0 0 3px #ffffff; }
.ix-chip { position: absolute; background: var(--g-ink); color: var(--g-bg); font-size: 26px; font-weight: 700; line-height: 36px; height: 36px; padding: 0 10px; border-radius: 18px; white-space: nowrap; }
.ix-mid { position: absolute; transform: translate(-50%, -50%); font-weight: 800; line-height: 1; white-space: nowrap; }
.ix-crow { position: absolute; }
.ix-crow .nm { display: flex; align-items: center; gap: 14px; font-size: 40px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.ix-crow .nm img { width: 44px; height: 44px; flex: none; }
.ix-crow .x { position: absolute; right: 0; top: -6px; font-size: 68px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; color: var(--g-ink); }
.ix-crow .pz { font-size: 30px; line-height: 1.2; color: var(--g-ink); margin-top: 10px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ix-crow .pz span { color: var(--g-soft); font-weight: 400; }
.ix-crow .st { font-size: 30px; line-height: 1.2; color: var(--g-soft); margin-top: 4px; }
.ix-crow .st b { color: var(--g-ink); }
.ix-small { font-size: 24px; line-height: 1.25; color: var(--g-soft); }
.ix-small b { color: var(--g-ink); }
.ix-team { position: absolute; width: 420px; }
.ix-team .k { display: flex; align-items: center; gap: 12px; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); }
.ix-team.r .k { justify-content: flex-end; }
.ix-team .v { font-size: 96px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; margin-top: 8px; color: var(--g-ink); }
.ix-team .s { font-size: 30px; color: var(--g-soft); line-height: 1.2; margin-top: 8px; }
.ix-team.r { text-align: right; }
.ix-sw { display: inline-block; width: 24px; height: 24px; border-radius: 5px; flex: none; }
.ix-round { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.ix-round .lb { font-size: 34px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.ix-round .lb i { font-style: normal; font-weight: 400; color: var(--g-soft); font-size: 30px; }
.ix-round .win { display: flex; align-items: center; gap: 10px; font-size: 30px; font-weight: 700; white-space: nowrap; color: var(--g-ink); }
.ix-bv { position: absolute; font-size: 38px; font-weight: 700; line-height: 1; white-space: nowrap; transform: translateY(-50%); }
.ix-shelf .nm { font-size: 24px; font-weight: 600; line-height: 1.2; color: var(--g-ink); }
.ix-shelf .br { font-size: 24px; line-height: 1.2; color: var(--g-soft); }
.ix-shelf .n { font-size: 30px; font-weight: 700; line-height: 1.1; margin-top: 8px; color: var(--g-ink); }
.ix-shelf .n span { font-size: 24px; font-weight: 400; color: var(--g-soft); }
.ix-big { position: absolute; transform: translate(-50%, -50%); text-align: center; }
.ix-big .k { font-size: 38px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.ix-big .v { font-size: 136px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-top: 6px; }
.ix-big .u { font-size: 38px; font-weight: 700; }
.ix-sub { position: absolute; text-align: center; transform: translateX(-50%); }
.ix-sub .nm { font-size: 24px; font-weight: 700; line-height: 1.1; color: var(--g-ink); text-wrap: balance; }
.ix-sub .m { font-size: 30px; font-weight: 700; line-height: 1.1; margin-top: 2px; color: var(--g-ink); }
.ix-sub .m span { font-size: 24px; font-weight: 400; color: var(--g-soft); }
.ix-sub .bd { font-size: 24px; font-weight: 600; line-height: 1.1; color: var(--g-soft); white-space: nowrap; }
.ix-drow { position: absolute; }
.ix-drow .nm { font-size: 34px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.ix-drow .cr { font-size: 24px; line-height: 1.2; color: var(--g-soft); margin-top: 4px; white-space: nowrap; }
.ix-dval { position: absolute; font-size: 34px; font-weight: 700; line-height: 1; white-space: nowrap; color: var(--g-ink); }
.ix-dmeta { position: absolute; font-size: 24px; line-height: 1.2; color: var(--g-soft); white-space: nowrap; }
/* museum */
.ix-plate { position: absolute; left: 0; top: 0; width: ${W}px; height: ${FEED_H}px; display: block; object-fit: cover; }
.ix-band { position: absolute; left: 0; width: ${W}px; background: var(--g-bg); }
.ix-sign { position: absolute; left: ${X0}px; max-width: ${CW}px; background: var(--g-bg); padding: 24px 34px 30px; box-shadow: 0 18px 40px -12px rgba(16, 22, 34, 0.45); }
.ix-sign .t { font-size: 64px; font-weight: 700; line-height: 1.04; letter-spacing: -0.015em; color: var(--g-ink); }
.ix-sign .t i { font-style: normal; font-weight: 300; }
.ix-sign .d { font-size: 34px; line-height: 1.3; color: var(--g-soft); margin-top: 14px; max-width: 760px; text-wrap: pretty; }
.ix-sign .d b { color: var(--g-ink); }
.ix-frm { position: absolute; background: var(--g-bg); box-shadow: 0 30px 34px -16px rgba(16, 22, 34, 0.55); }
.ix-frm .mat { position: absolute; background: #ffffff; box-shadow: inset 0 7px 9px -5px rgba(16, 22, 34, 0.35); }
.ix-frm .art { position: absolute; display: block; object-fit: cover; }
.ix-plq { position: absolute; padding: 22px 24px; background: var(--g-bg); box-shadow: 0 10px 14px -6px rgba(16, 22, 34, 0.45); }
.ix-plq .t { font-size: 32px; font-weight: 700; line-height: 1.12; color: var(--g-ink); text-wrap: balance; }
.ix-plq .s { font-size: 24px; line-height: 1.35; color: var(--g-soft); margin-top: 8px; }
.ix-plq .s i { font-style: italic; }
.ix-plq hr { border: 0; border-top: 3px solid var(--g-device); margin: 16px 0 14px; width: 48px; }
.ix-plq .n { font-size: 30px; line-height: 1.25; color: var(--g-ink); }
.ix-plq .n b { font-weight: 700; }
</style>`;

// ---------------------------------------------------------------- data (G1)
type Row = Record<string, string>;
const num = (s: string | undefined) => Number(s ?? NaN);

/** A country needs at least this over-index to call a puzzle its signature (below it: "no clear signature yet"). */
const SIGNATURE_MIN_LIFT = 10;
const COUNTRY_ROWS = query('boxes-country-signatures').rows.filter(r => r.rk === '1');
const THEMES = new Map(query('bs-themes').rows.map(r => [r.theme, r]));
const SPEED = new Map(query('bs-theme-speed').rows.map(r => [r.theme, r]));
const NOTES = query('bs-comment-words').rows[0];
const CATDOG = query('boxes-cats-dogs').rows;
const SUBJ = query('boxes-subject-speed').rows;

/** Subjects on the tier board: bs-theme-speed themes minus colour words, series, artists and near-duplicates
 *  (cities ≈ postcards, garden ≈ flowers, sunset ≈ lighthouses, night/moon shares its top box with mushrooms). */
const SUBJECTS: Array<[string, string]> = [
  ['disney/pixar', 'Disney & Pixar'], ['postcards', 'Postcards'], ['kawaii/cute', 'Kawaii'], ['national parks', 'National parks'],
  ['balloons', 'Balloons'], ['lighthouse', 'Lighthouses'], ['gradient/rainbow', 'Rainbows'], ['library/books', 'Books'],
  ['dogs', 'Dogs'], ['cats', 'Cats'], ['ocean', 'Ocean'], ['christmas', 'Christmas'], ['flowers', 'Flowers'],
  ['birds', 'Birds'], ['snow/winter', 'Winter'], ['food/sweets', 'Sweets'], ['mushrooms', 'Mushrooms'], ['butterflies', 'Butterflies'],
];
const usedRep = new Set<string>();
const subjectRows = SUBJECTS.flatMap(([theme, name]) => {
  const s = SPEED.get(theme);
  const rep = SUBJ.filter(r => r.theme === theme).sort((a, b) => num(a.rk) - num(b.rk)).find(r => !usedRep.has(r.puzzle_id));
  if (!s || !rep) return [];
  usedRep.add(rep.puzzle_id);
  return [{ theme, name, median: num(s.median_min), results: num(s.solo_results), puzzles: num(s.puzzles), rep }];
}).sort((a, b) => a.median - b.median);

const catTop = CATDOG.filter(r => r.theme === 'cats').sort((a, b) => num(a.rk) - num(b.rk));
const dogTop = CATDOG.filter(r => r.theme === 'dogs').sort((a, b) => num(a.rk) - num(b.rk));

// ---------------------------------------------------------------- data (G2 museum)
const BOX_ROWS = ['boxes-alltime-top', 'boxes-month-top', 'boxes-week-top'].flatMap(n => query(n).rows).filter(r => r.image);
const imageOf = (puzzle: string, brand: string) => BOX_ROWS.find(r => r.puzzle === puzzle && r.brand === brand)?.image;
/** A3 museum rooms: the most-solved puzzle per subject (bs-theme-champions, rank 1). */
const champs = query('bs-theme-champions').rows.filter(r => r.rk === '1');
const ROOM_THEMES: Array<[string, string]> = [['lighthouses', 'Lighthouses'], ['books', 'Books'], ['mushrooms', 'Mushrooms'], ['owls', 'Owls'], ['space', 'Space']];
const NEXT_THEMES: Array<[string, string]> = [['cats', 'Cats'], ['flowers', 'Flowers'], ['ocean', 'The ocean']];
const roomRows = ROOM_THEMES.map(([t]) => champs.find(r => r.theme === t)!);

const IMG = await fetchBoxes([
  ...COUNTRY_ROWS.map(r => r.image), ...catTop.slice(0, 4).map(r => r.image), ...dogTop.slice(0, 4).map(r => r.image),
  ...subjectRows.map(s => s.rep.image), ...roomRows.map(r => imageOf(r.puzzle, r.brand) ?? ''),
].filter(Boolean), 'puzzle_large');

/** Pixel size of a cached JPEG (SOF marker), so boxes keep their real aspect ratio. */
const sizes = new Map<string, { w: number; h: number }>();
function imgSize(url: string) {
  if (sizes.has(url)) return sizes.get(url)!;
  const b = readFileSync(join(ROOT, url));
  let i = 2, out = { w: 4, h: 3 };
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { out = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; break; }
    i += 2 + b.readUInt16BE(i + 2);
  }
  sizes.set(url, out);
  return out;
}

interface Box { puzzle: string; brand: string; img: string; ar: number }
function toBox(r: Row): Box | null {
  const img = r.image ? IMG.get(r.image) : undefined;
  if (!img) return null;
  const s = imgSize(img);
  return { puzzle: r.puzzle, brand: r.brand, img, ar: s.w / s.h };
}
const creditOf = (b: Box) => `${b.puzzle} · ${b.brand}`;
/** Largest box that fits a slot, keeping the box art's aspect ratio. */
const fit = (b: Box, maxW: number, maxH: number) => (maxW / b.ar <= maxH ? { w: maxW, h: maxW / b.ar } : { w: maxH * b.ar, h: maxH });
const brandList = (boxes: Box[]) => {
  const n = new Map<string, number>();
  for (const b of boxes) n.set(b.brand, (n.get(b.brand) ?? 0) + 1);
  const names = [...n.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

// ---------------------------------------------------------------- drawing helpers
let uid = 0;
const nextId = (p: string) => `ix${p}${++uid}`;
/** Box art filling a generator piece (cover crop), as SVG. */
function pieceArt(p: Piece, b: Box) {
  const id = nextId('pa');
  return `<clipPath id="${id}"><path d="${p.d}"/></clipPath>
    <image href="${b.img}" x="${f1(p.bbox.x)}" y="${f1(p.bbox.y)}" width="${f1(p.bbox.width)}" height="${f1(p.bbox.height)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}
/** A whole box on a white mount (one soft shadow); (x, y, w, hh) is the art itself, the mount adds `pad`. */
function mount(b: Box, x: number, y: number, w: number, hh: number, o: { rot?: number; pad?: number } = {}) {
  const p = o.pad ?? 6;
  return `<div class="h-mount" style="left:${f1(x - p)}px; top:${f1(y - p)}px; width:${f1(w + 2 * p)}px; height:${f1(hh + 2 * p)}px; padding:${p}px; border-radius:6px${o.rot ? `; transform:rotate(${o.rot}deg)` : ''}"><img src="${b.img}" alt=""></div>`;
}
const svg = (inner: string) => `<svg class="ix-svg" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true">${inner}</svg>`;
/** Piece k's edge (0 top, 1 right, 2 bottom, 3 left) as 10 control points, clockwise. */
const pieceEdge = (p: Piece, k: number) => p.outline.slice(9 * k, 9 * k + 10);
/** A 100% bar split into two interlocking pieces: one generator cut line moved to the split point. */
function splitBar(x: number, y: number, w: number, hh: number, share: number, seed: number) {
  const g = generateJigsaw({ cols: 2, rows: 1, width: 2 * hh, height: hh, seed, tabSize: 0.26, jitter: 0.02 });
  const e = pieceEdge(g.pieces.find(p => p.col === 0)!, 1);
  const sx = Math.min(x + w - hh, Math.max(x + hh, x + w * share));
  const q = e.map(([px, py]) => [px - hh + sx, py + y] as Point);
  const curve = `C ${pt(q[1])} ${pt(q[2])} ${pt(q[3])} C ${pt(q[4])} ${pt(q[5])} ${pt(q[6])} C ${pt(q[7])} ${pt(q[8])} ${pt(q[9])}`;
  return { left: `M ${x} ${y} L ${pt(q[0])} ${curve} L ${x} ${y + hh} Z`, right: `M ${x + w} ${y} L ${pt(q[0])} ${curve} L ${x + w} ${y + hh} Z`, split: sx };
}
/** A generator piece lifted off the board: moved to (cx, cy), rotated, scaled, with the hard shadow. */
function lifted(p: Piece, b: Box, cx: number, cy: number, rot: number, s: number) {
  const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
  const t = (dx: number, dy: number) => `translate(${f1(cx + dx)} ${f1(cy + dy)}) rotate(${rot}) scale(${s}) translate(${f1(-pcx)} ${f1(-pcy)})`;
  return `<path d="${p.d}" transform="${t(12, 16)}" fill="${SHADOW}"/>
    <g transform="${t(0, 0)}">${pieceArt(p, b)}<path d="${p.d}" fill="none" stroke="#ffffff" stroke-width="3" vector-effect="non-scaling-stroke"/></g>`;
}
/** A single generator piece as a badge, `px` wide, top-left at (x, y); returns markup and its body centre. */
function badgePiece(x: number, y: number, px: number, fill: Tone, seed = 23) {
  const sp = singlePiece(60, seed);
  const [vx, vy, vw, vh] = sp.viewBox.split(' ').map(Number);
  const k = px / Math.max(vw, vh);
  return {
    svg: `<g transform="translate(${f1(x - vx * k)} ${f1(y - vy * k)}) scale(${f1(k)})"><path d="${sp.d}" ${fillAttr(fill)}/></g>`,
    cx: x + (90 - vx) * k, cy: y + (90 - vy) * k,
  };
}

// ---------------------------------------------------------------- slide builders on top of the house
const groundFor = (x: SlideCtx, role: 'cover' | 'fact' | 'data' | 'image') => GROUNDS[x.v.ground(slotOf(x, role))];

interface ArtArea { top: number; bottom: number; g: Ground; seam?: number }
interface ArtSpec { kicker: string; title: string; dek?: string; dekPx?: number; src: string; titlePx?: number; titleW?: number; art: (a: ArtArea) => string }

/**
 * Cover or fact slide whose hero is a picture (the tile map, the versus poster, the tier board, the two-piece tie)
 * rather than a number, which house cover() only supports in the H1 board layout:
 *   board (H1) / chapter (H3): title and dek on the variant's ground, the art below;
 *   poster (H2): title and dek on the bold top piece, one real jigsaw seam, the art on the navy bottom piece.
 */
function artSlide(x: SlideCtx, role: 'cover' | 'fact', s: ArtSpec): string {
  const v = x.v;
  const idx: [number, number] | undefined = x.of > 1 ? [x.slide, x.of] : undefined;
  const poster = v.cover === 'poster';
  // Posters give the art less room (the seam and its knobs), so their titles run a size smaller.
  const px = Math.min(s.titlePx ?? (role === 'cover' && s.title.length <= 40 ? 76 : TYPE.title), poster ? 68 : 99);
  const tw = s.titleW ?? CW;
  const titleH = linesOf(s.title, px, tw, true) * px * 1.06;
  const dekPx = s.dekPx ?? 34;
  const dekH = s.dek ? 18 + linesOf(s.dek, dekPx, tw) * dekPx * 1.3 : 0;
  const head = (top: number) => `<h1 class="h-title" style="top:${top}px; width:${tw}px; font-size:${px}px; line-height:1.06">${h(s.title)}</h1>
    ${s.dek ? `<p class="h-dek h-abs" style="top:${f1(top + titleH + 18)}px; width:${tw}px; font-size:${dekPx}px">${h(s.dek)}</p>` : ''}`;
  if (poster) {
    const topG = GROUNDS[v.ground(slotOf(x, role))], base = GROUNDS[v.posterBase ?? 'navyDeep'];
    const T = 174;
    const seam = Math.round(T + titleH + dekH + 66);
    const under = `<svg class="h-poster-top" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true"><path d="${posterTopPath(seam)}" fill="${topG.bg}"/></svg>
      <div style="${groundVars(topG)}" data-qa-bg="${topG.bg}">${head(T)}</div>`;
    return frame({ ground: base.key, kicker: s.kicker, idx, device: v.device, body: STYLE + s.art({ top: seam + 82, bottom: FEED.contentBottom, g: base, seam }), src: s.src, under, noRule: true, headGround: topG.key });
  }
  const g = GROUNDS[v.ground(slotOf(x, role))];
  const top = Math.round(FEED.contentTop + titleH + dekH + 36);
  return frame({ ground: g.key, kicker: s.kicker, idx, device: v.device, body: STYLE + head(FEED.contentTop) + s.art({ top, bottom: FEED.contentBottom, g }), src: s.src });
}

/** Title (+ optional dek) for content slides, with a width (the house slide() title is always full width). */
const titleBlock = (title: string, o: { px?: number; w?: number; dek?: string; dekTop?: number; dekPx?: number } = {}) => {
  const px = o.px ?? TYPE.title, w = o.w ?? CW;
  const top = o.dekTop ?? Math.round(FEED.contentTop + linesOf(title, px, w, true) * px * 1.1 + 18);
  return `<h1 class="h-title" style="top:${FEED.contentTop}px; width:${w}px; font-size:${px}px">${h(title)}</h1>
    ${o.dek ? `<p class="h-dek h-abs" style="top:${top}px; width:${w}px; font-size:${o.dekPx ?? 32}px">${o.dek}</p>` : ''}`;
};

// ---------------------------------------------------------------- 1 · atlas: every country's signature puzzle
const COUNTRY: Record<string, string> = {
  FI: 'Finland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', CH: 'Switzerland', AT: 'Austria', CZ: 'Czechia', PL: 'Poland',
  DE: 'Germany', GB: 'United Kingdom', NL: 'Netherlands', BE: 'Belgium', FR: 'France', ES: 'Spain', PT: 'Portugal',
  US: 'United States', CA: 'Canada', AU: 'Australia', NZ: 'New Zealand',
};
/** Tile map: one 6 × 6 jigsaw; Europe by rough latitude/longitude, the Americas and Oceania as corner insets. */
const MAP: Record<string, [number, number]> = {
  NO: [3, 0], SE: [4, 0], FI: [5, 0], GB: [1, 1], DK: [3, 1], CA: [0, 2], NL: [2, 2], DE: [3, 2], PL: [4, 2],
  US: [0, 3], BE: [2, 3], CZ: [3, 3], FR: [1, 4], CH: [2, 4], AT: [3, 4], PT: [0, 5], ES: [1, 5], AU: [4, 5], NZ: [5, 5],
};
const REGIONS = [
  { name: 'The North', cc: ['FI', 'SE', 'NO', 'DK'] },
  { name: 'Central Europe', cc: ['CH', 'AT', 'CZ', 'PL', 'DE'] },
  { name: 'Western Europe', cc: ['GB', 'NL', 'BE', 'FR', 'ES', 'PT'] },
  { name: 'Beyond Europe', cc: ['US', 'CA', 'AU', 'NZ'] },
];

interface Country { cc: string; name: string; puzzlers: number; pctLocal: number; pctWorld: number; lift: number; box: Box | null; strong: boolean; row: Row }
const countries: Country[] = COUNTRY_ROWS.map(r => {
  const lift = num(r.lift);
  const box = toBox(r);
  return { cc: r.cc, name: COUNTRY[r.cc] ?? r.cc, puzzlers: num(r.puzzlers), pctLocal: num(r.pct_local), pctWorld: num(r.pct_world), lift, box, strong: lift >= SIGNATURE_MIN_LIFT && !!box, row: r };
});
for (const k of countries) if (!MAP[k.cc] || !COUNTRY[k.cc]) console.warn(`ideas/atlas: no tile/region for ${k.cc}; add it to MAP, COUNTRY and REGIONS`);
const liftTxt = (v: number) => `${Math.round(v)}×`;
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const withThe = (n: string) => (/^United /.test(n) ? `the ${n}` : n);
/** Lower-case a subject name for running text, keeping proper nouns. */
const lc = (n: string) => (/^(Disney|Christmas)/.test(n) ? n : n.toLowerCase());
const pctW = (v: number) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)}%`;
const mapJig = (x: number, y: number, p: number) => generateJigsaw({ cols: 6, rows: 6, width: 6 * p, height: 6 * p, x, y, seed: 5, tabSize: 0.2 });

function atlas(c: Content, v: Variant): Post {
  const strong = countries.filter(k => k.strong);
  const weak = countries.filter(k => !k.strong);
  const onMap = countries.filter(k => MAP[k.cc]);
  const groups = REGIONS.map(g => ({ name: g.name, members: g.cc.map(cc => strong.find(k => k.cc === cc)).filter((k): k is Country => !!k).sort((a, b) => b.lift - a.lift) }))
    .filter(g => g.members.length);
  const total = groups.length + 2;
  const kicker = 'Puzzle atlas · Countries';

  // --- cover: the whole 6 × 6 puzzle is the board (guide cuts on the ground's band); countries are the pieces
  // already placed (box art clipped to the piece), "?" pieces have no clear signature yet, empty slots are missing.
  const mapArt = (a: ArtArea) => {
    const avail = a.bottom - a.top;
    const P = Math.floor(Math.min(138, (avail - 8) / 6, CW / 6));
    const MX = X0 + (CW - 6 * P) / 2, MY = a.top + Math.max(0, (avail - 6 * P) / 2);
    const jig = mapJig(MX, MY, P);
    const at = (cc: string) => jig.pieces.find(p => p.col === MAP[cc][0] && p.row === MAP[cc][1])!;
    const open: Tone = { css: 'var(--c-context)', hex: a.g.chart.context };
    const qTone = textOn(a.g, open.hex);
    const art = svg([
      `<rect x="${f1(MX)}" y="${f1(MY)}" width="${6 * P}" height="${6 * P}" fill="var(--g-band)"/>`,
      `<path d="${jig.cuts}" fill="none" stroke="var(--g-rule)" stroke-width="2"/><path d="${jig.border}" fill="none" stroke="var(--g-rule)" stroke-width="2"/>`,
      ...onMap.map(k => `<path d="${at(k.cc).d}" transform="translate(5 7)" fill="${SHADOW}"/>`),
      ...onMap.map(k => (k.strong ? pieceArt(at(k.cc), k.box!) : `<path d="${at(k.cc).d}" fill="${open.css}"/>`)),
      ...onMap.map(k => `<path d="${at(k.cc).d}" fill="none" stroke="var(--g-bg)" stroke-width="4" stroke-linejoin="round"/>`),
    ].join(''));
    const fs = Math.round(Math.max(30, 40 * P / 138));
    const over = onMap.map(k => {
      const x = MX + MAP[k.cc][0] * P, y = MY + MAP[k.cc][1] * P;
      const flag = `<img class="ix-flag" src="${flagUrl(k.cc)}" alt="" style="left:${f1(x + 10)}px; top:${f1(y + 10)}px; width:${fs}px; height:${fs}px">`;
      return k.strong
        ? `${flag}<span class="ix-chip" data-qa-small data-qa-bg="${a.g.ink}" style="right:${f1(W - (x + P - 8))}px; top:${f1(y + P - 44)}px">${liftTxt(k.lift)}</span>`
        : `${flag}<span class="ix-mid" data-qa-bg="${open.hex}" style="left:${f1(x + P / 2 + 6)}px; top:${f1(y + P / 2 + 8)}px; font-size:${Math.round(P * 0.46)}px; color:${qTone.css}">?</span>`;
    }).join('');
    return art + over;
  };

  // --- region slides: every signature box whole on a white mount, the locator map, the over-index.
  const LOC = 28, LX = X1 - 6 * LOC, LY = FEED.contentTop + 2;
  const loc = mapJig(LX, LY, LOC);
  const locAt = (cc: string) => loc.pieces.find(p => p.col === MAP[cc][0] && p.row === MAP[cc][1])!;
  const region = (x: SlideCtx, gi: number) => {
    const g = groups[gi];
    const set = new Set(g.members.map(k => k.cc));
    const locator = `<rect x="${LX}" y="${LY}" width="${6 * LOC}" height="${6 * LOC}" fill="var(--g-band)"/><path d="${loc.cuts}" fill="none" stroke="var(--g-rule)" stroke-width="1"/>`
      + onMap.map(k => `<path d="${locAt(k.cc).d}" fill="${set.has(k.cc) ? 'var(--c-hot)' : k.strong ? 'var(--c-base)' : 'var(--c-context)'}" stroke="var(--g-bg)" stroke-width="1.5"/>`).join('');
    const top = 352, bottom = 1186, n = g.members.length;
    const rowH = Math.min(236, (bottom - top) / n);
    const BW = 270, TX = X0 + BW + 40;
    const mounts: string[] = [], rows: string[] = [];
    g.members.forEach((k, i) => {
      const y = top + i * rowH;
      const slotH = rowH - 34, b = k.box!;
      const s = fit(b, BW - 12, slotH - 12);
      mounts.push(mount(b, X0 + (BW - s.w) / 2, y + (slotH - s.h) / 2, s.w, s.h));
      if (i) rows.push(`<div class="h-rule" style="top:${f1(y - 17)}px; background:var(--g-band)"></div>`);
      rows.push(`<div class="ix-crow" style="left:${TX}px; width:${X1 - TX}px; top:${f1(y + Math.max(0, (slotH - 140) / 2))}px">
        <div class="nm"><img src="${flagUrl(k.cc)}" alt="">${h(k.name)}</div>
        <div class="x">${liftTxt(k.lift)}</div>
        <p class="pz">${h(b.puzzle)} <span>· ${h(b.brand)}</span></p>
        <p class="st"><b>${k.pctLocal.toFixed(1)}%</b> of ${fmtInt(k.puzzlers)} puzzlers · world ${pctW(k.pctWorld)}</p></div>`);
    });
    return slide(x, 'image', {
      kicker, src: c.source,
      body: STYLE + svg(locator) + titleBlock(g.name, { w: 640, dek: 'Who solved it, and <b style="color:var(--g-ink)">×</b> the world rate', dekPx: 32 }) + mounts.join('') + rows.join(''),
    }).html;
  };

  // --- your country: open "?" pieces (interior piece of a 3 × 3 jigsaw), how we picked them.
  const closing = (x: SlideCtx) => {
    const g = groundFor(x, 'data');
    const QS = 150;
    const qPiece = generateJigsaw({ cols: 3, rows: 3, width: 3 * QS, height: 3 * QS, seed: 23, tabSize: 0.22 }).pieces.find(p => p.col === 1 && p.row === 1)!;
    const colW = CW / Math.max(3, weak.length), qy = 446;
    const open: Tone = { css: 'var(--c-context)', hex: g.chart.context };
    const qTone = textOn(g, open.hex);
    const qArt: string[] = [], qHtml: string[] = [];
    weak.forEach((k, i) => {
      const cx = X0 + colW * (i + 0.5);
      const dx = cx - QS / 2 - QS, dy = qy - QS;
      qArt.push(`<path d="${qPiece.d}" transform="translate(${f1(dx + 8)} ${dy + 10})" fill="${SHADOW}"/><path d="${qPiece.d}" transform="translate(${f1(dx)} ${dy})" fill="${open.css}"/>`);
      qHtml.push(`<img class="ix-flag" src="${flagUrl(k.cc)}" alt="" style="left:${f1(cx - 26)}px; top:${qy + 16}px; width:52px; height:52px">
        <span class="ix-mid" data-qa-bg="${open.hex}" style="left:${f1(cx)}px; top:${qy + 104}px; font-size:66px; color:${qTone.css}">?</span>
        <div class="h-abs" style="left:${f1(cx - colW / 2 + 8)}px; width:${f1(colW - 16)}px; top:${qy + QS + 46}px; text-align:center">
          <p style="font-size:38px; font-weight:700; line-height:1.1; color:var(--g-ink)">${h(k.name)}</p>
          <p class="h-dek" style="font-size:30px; margin-top:8px"><b style="color:var(--g-ink)">${liftTxt(k.lift)}</b> the world rate</p>
          <p class="ix-small" data-qa-small style="margin-top:8px">Closest: ${h(k.row.puzzle)} · ${h(k.row.brand)}</p></div>`);
    });
    return slide(x, 'data', {
      kicker, src: c.source,
      body: STYLE + svg(qArt.join('')) + titleBlock('Missing your country? Tell us its puzzle.')
        + `<p class="h-dek h-abs" style="top:${qy - 86}px; font-size:30px"><b style="color:var(--g-ink)">No clear signature yet</b>, under ${SIGNATURE_MIN_LIFT}× the world rate:</p>
        ${qHtml.join('')}
        <div class="h-rule" style="top:892px"></div>
        <p class="h-dek h-abs" style="top:918px; font-size:30px"><b style="color:var(--g-ink)">How we picked them.</b> For every country with at least 80 puzzlers on MSP, we took each puzzle at least 15 of them have solved and compared that share with the share among all puzzlers worldwide. The biggest ratio is the signature puzzle. Fewer than 80 puzzlers? Then your country isn't on the map yet.</p>`,
    }).html;
  };

  const flavour = [['FI', 'Day in the Moominvalley', 'Finland has the Moomins.'], ['CH', 'Curious Swiss Cows', 'Switzerland has cows.']]
    .filter(([cc, pz]) => strong.some(k => k.cc === cc && k.box!.puzzle === pz)).map(f => f[2]);
  const hook = flavour.length === 2 ? `${flavour.join(' ')} ` : '';
  const topK = [...strong].sort((a, b) => b.lift - a.lift)[0];
  const share = [...strong].sort((a, b) => b.pctLocal - a.pctLocal)[0];
  return {
    ...post(v, 'atlas', [
      x => artSlide(x, 'cover', {
        kicker, title: "Every country's signature puzzle", src: `Box art by the brands named on slides 2–${total - 1} · ${c.source}`,
        dek: 'The puzzle each country solves far more often than the rest of the world, and how many times the world rate that is.',
        dekPx: 30, art: mapArt,
      }),
      ...groups.map((_, gi) => (x: SlideCtx) => region(x, gi)),
      closing,
    ]),
    label: `Every country's signature puzzle: ${strong.length} countries on a jigsaw tile map (${total}-slide carousel)`,
    caption: `${hook}${strong.length} countries, ${strong.length} signature puzzles: the one each country solves far more often than the rest of the world.

The strongest is ${topK.name}: ${topK.pctLocal.toFixed(1)}% of puzzlers there have solved ${topK.box!.puzzle === topK.name ? `a puzzle called ${topK.name}` : topK.box!.puzzle} (${topK.box!.brand}), ${Math.round(topK.lift)} times the world rate. In ${share.name}, ${Math.round(share.pctLocal)}% have done ${share.box!.puzzle}.

${cap(andList(weak.map(k => withThe(k.name))))} ${weak.length === 1 ? 'has' : 'have'} no clear winner yet. Missing your country? Tell us its puzzle in the comments.

Box art by the brands named on each slide.

#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
  };
}

// ---------------------------------------------------------------- 2 · cats vs dogs
function catsDogs(c: Content, v: Variant): Post {
  const tc = THEMES.get('cats')!, td = THEMES.get('dogs')!;
  const sc = SPEED.get('cats')!, sd = SPEED.get('dogs')!;
  const cats = { results: num(tc.results), puzzles: num(tc.puzzles_in_catalogue), solved: num(tc.puzzles_solved), notes: num(NOTES.cat), median: num(sc.median_min), soloN: num(sc.solo_results) };
  const dogs = { results: num(td.results), puzzles: num(td.puzzles_in_catalogue), solved: num(td.puzzles_solved), notes: num(NOTES.dog), median: num(sd.median_min), soloN: num(sd.solo_results) };
  const champC = toBox(catTop[0])!, champD = toBox(dogTop[0])!;
  const ratio = cats.results / dogs.results;
  const ratioTxt = ratio < Math.round(ratio) ? `nearly ${Math.round(ratio)} to 1` : `${Math.round(ratio)} to 1`;
  const kicker = 'Puzzle atlas · Subjects';
  const sw = (t: Tone) => `<i class="ix-sw" style="background:${t.css}"></i>`;

  // --- 1 · versus poster: the two champion boxes, the vs piece, the score, a 100-piece unit bar.
  const versusArt = (a: ArtArea) => {
    const T = teams(a.g);
    const avail = a.bottom - a.top;
    const uh = Math.round(Math.max(104, Math.min(170, avail * 0.19)));
    // The score sets smaller when room is short (H2 posters), so the boxes keep their size.
    const vPx = avail < 760 ? 76 : 96, teamH = vPx + 90, creditH = 66, noteH = 40;
    const bh = Math.min(300, avail - uh - teamH - creditH - noteH - 3 * 22);
    const bw = 400, by = a.top;
    const sC = fit(champC, bw - 12, bh - 12), sD = fit(champD, bw - 12, bh - 12);
    const vs = badgePiece(540 - bh * 0.25, by + bh / 2 - bh * 0.25, bh * 0.5, T.cat);
    const vsTone = textOn(a.g, T.cat.hex);
    const ty = by + bh + 18 + creditH, uy = ty + teamH + 22;
    const units = pieceGrid({ cols: 20, rows: 5, x: X0, y: uy, width: CW, height: uh, seed: 7, tabSize: 0.22 }).sort((p, q) => p.col - q.col || p.row - q.row);
    const catUnits = Math.round((cats.results / (cats.results + dogs.results)) * 100);
    const unitArt = units.map((p, i) => `<path d="${p.d}" fill="${i < catUnits ? T.cat.css : T.dog.css}" stroke="var(--g-bg)" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
    return svg(unitArt)
      + mount(champC, X0 + (bw - sC.w) / 2, by + (bh - sC.h) / 2, sC.w, sC.h, { rot: -3 })
      + mount(champD, X1 - bw + (bw - sD.w) / 2, by + (bh - sD.h) / 2, sD.w, sD.h, { rot: 3 })
      + svg(`<g transform="translate(6 8)">${vs.svg.replace(/fill="[^"]+"/, `fill="${SHADOW}"`)}</g>${vs.svg}`)
      + `<span class="ix-mid" data-qa-bg="${T.cat.hex}" style="left:${f1(vs.cx)}px; top:${f1(vs.cy)}px; font-size:${Math.round(Math.max(40, bh * 0.16))}px; color:${vsTone.css}">vs</span>
      <p class="h-abs ix-small" data-qa-small style="top:${f1(by + bh + 18)}px; width:${bw}px">${h(creditOf(champC))}</p>
      <p class="h-abs ix-small" data-qa-small style="left:${X1 - bw}px; top:${f1(by + bh + 18)}px; width:${bw}px; text-align:right">${h(creditOf(champD))}</p>
      <div class="ix-team" style="left:${X0}px; top:${f1(ty)}px"><div class="k">${sw(T.cat)}Team cat</div><div class="v" style="font-size:${vPx}px">${fmtInt(cats.results)}</div><div class="s">results logged</div></div>
      <div class="ix-team r" style="left:${X1 - 420}px; top:${f1(ty)}px"><div class="k">Team dog${sw(T.dog)}</div><div class="v" style="font-size:${vPx}px">${fmtInt(dogs.results)}</div><div class="s">results logged</div></div>
      <p class="h-abs ix-small" data-qa-small style="top:${f1(uy + uh + 12)}px">1 piece = 1% of the ${fmtInt(cats.results + dogs.results)} results on puzzles with a cat or a dog in the title</p>`;
  };

  // --- 2 · five rounds as split bars, the split a generator cut.
  const rounds = [
    { lb: 'Results logged', c: cats.results, d: dogs.results, fmt: fmtInt, lower: false },
    { lb: 'Puzzles in the catalogue', c: cats.puzzles, d: dogs.puzzles, fmt: fmtInt, lower: false },
    { lb: 'Solvers of the most-solved one', c: num(catTop[0].solvers), d: num(dogTop[0].solvers), fmt: fmtInt, lower: false },
    { lb: 'Result notes that mention them', c: cats.notes, d: dogs.notes, fmt: fmtInt, lower: false },
    { lb: 'Median solo time, 500s', c: cats.median, d: dogs.median, fmt: (n: number) => `${n.toFixed(1)} min`, lower: true },
  ];
  const catWins = rounds.filter(r => (r.lower ? r.c < r.d : r.c > r.d)).length;
  const roundsSlide = (x: SlideCtx) => {
    const g = groundFor(x, 'data'), T = teams(g);
    const ry = 352, rp = 164, bh = 62;
    const art: string[] = [], html: string[] = [];
    rounds.forEach((r, i) => {
      const y = ry + i * rp;
      const sb = splitBar(X0, y + 56, CW, bh, r.c / (r.c + r.d), 31 + i);
      art.push(`<path d="${sb.left}" fill="${T.cat.css}"/><path d="${sb.right}" fill="${T.dog.css}"/><path d="${sb.left}" fill="none" stroke="var(--g-bg)" stroke-width="3"/>`);
      const catWon = r.lower ? r.c < r.d : r.c > r.d;
      const close = Math.abs(r.c - r.d) / Math.max(r.c, r.d) < 0.01;
      const win = `${catWon ? 'Cats' : 'Dogs'}${close ? `, by ${Math.abs(r.c - r.d).toFixed(1)} min` : ''}`;
      const tc2 = textOn(g, T.cat.hex), td2 = textOn(g, T.dog.hex);
      html.push(`<div class="ix-round" style="top:${y}px"><span class="lb">${h(r.lb)}${r.lower ? ' <i>(lower wins)</i>' : ''}</span>
          <span class="win">${sw(catWon ? T.cat : T.dog)}${h(win)}</span></div>
        <span class="ix-bv" data-qa-bg="${T.cat.hex}" style="left:${X0 + 18}px; top:${y + 56 + bh / 2}px; color:${tc2.css}">${h(r.fmt(r.c))}</span>
        <span class="ix-bv" data-qa-bg="${T.dog.hex}" style="right:${W - X1 + 18}px; top:${y + 56 + bh / 2}px; color:${td2.css}">${h(r.fmt(r.d))}</span>`);
    });
    return slide(x, 'data', {
      kicker, src: `Matched by title words (cat, dog…) · ${c.source}`,
      body: STYLE + svg(art.join('')) + titleBlock(`Five rounds. Cats take ${catWins === 4 ? 'four' : catWins}.`)
        + `<div class="h-abs" style="top:268px; display:flex; justify-content:space-between">
            <span class="h-dek" style="font-size:30px; display:flex; align-items:center; gap:12px">${sw(T.cat)}<b style="color:var(--g-ink)">Cats</b> from the left</span>
            <span class="h-dek" style="font-size:30px; display:flex; align-items:center; gap:12px"><b style="color:var(--g-ink)">Dogs</b> from the right${sw(T.dog)}</span></div>
          ${html.join('')}`,
    }).html;
  };

  // --- 3 · the two shelves: the four most-solved boxes per team on white mounts, standing on a ledge.
  const shelfBoxes = [...catTop.slice(0, 4), ...dogTop.slice(0, 4)].map(r => toBox(r)!).filter(Boolean);
  const perC = cats.results / cats.solved, perD = dogs.results / dogs.solved;
  const shelvesSlide = (x: SlideCtx) => {
    const g = groundFor(x, 'image'), T = teams(g);
    const shelf = (rowsIn: Row[], y: number, team: string, t: Tone) => {
      const items = rowsIn.slice(0, 4).map(r => ({ r, b: toBox(r)! })).filter(o => o.b);
      const slot = (CW - 3 * 28) / 4, artH = 150;
      const ledge = y + 60 + artH;
      const html: string[] = [`<div class="h-abs" style="top:${ledge}px; left:${X0 - 10}px; width:${CW + 20}px; height:8px; background:var(--g-ink); border-radius:2px"></div>`];
      items.forEach(({ r, b }, i) => {
        const x0 = X0 + i * (slot + 28);
        const s = fit(b, slot - 12, artH - 10);
        html.push(mount(b, x0 + (slot - s.w) / 2, ledge - 6 - s.h, s.w, s.h));
        html.push(`<div class="h-abs ix-shelf" data-qa-small style="left:${f1(x0)}px; top:${ledge + 26}px; width:${f1(slot)}px">
          <p class="nm">${h(b.puzzle)}</p><p class="br">${h(b.brand)}</p><p class="n">${fmtInt(num(r.solvers))} <span>solvers</span></p></div>`);
      });
      html.push(`<p class="h-abs" style="top:${y}px; font-size:34px; font-weight:700; color:var(--g-ink); display:flex; align-items:center; gap:14px">${sw(t)}${h(team)}</p>`);
      return html.join('');
    };
    return slide(x, 'image', {
      kicker, src: c.source,
      body: STYLE + titleBlock('More cat puzzles, and each one is solved more', { px: 56, dek: `On average <b style="color:var(--g-ink)">${perC.toFixed(1)}</b> results per cat puzzle, <b style="color:var(--g-ink)">${perD.toFixed(1)}</b> per dog puzzle`, dekPx: 30 })
        + shelf(catTop, 384, 'The most-solved cat puzzles', T.cat) + shelf(dogTop, 790, 'The most-solved dog puzzles', T.dog),
    }).html;
  };

  // --- 4 · on the clock: a tie, as two interlocking pieces.
  const clockArt = (a: ArtArea) => {
    const T = teams(a.g);
    const gy = a.top, gh = Math.round(Math.min(400, a.bottom - a.top - 420));
    const two = generateJigsaw({ cols: 2, rows: 1, width: CW, height: gh, x: X0, y: gy, seed: 12, tabSize: 0.2 });
    const [pc, pd] = [...two.pieces].sort((p, q) => p.col - q.col);
    const catFree = Math.min(...pd.outline.map(q => q[0])), dogFree = Math.max(...pc.outline.map(q => q[0]));
    const catX = (X0 + catFree) / 2, dogX = (dogFree + X1) / 2;
    const tc2 = textOn(a.g, T.cat.hex), td2 = textOn(a.g, T.dog.hex);
    const vPx = Math.round(Math.min(136, gh * 0.36));
    const big = (t: Tone, tt: Tone, cx: number, k: string, val: number) =>
      `<div class="ix-big" data-qa-bg="${t.hex}" style="left:${f1(cx)}px; top:${gy + gh / 2}px; color:${tt.css}"><div class="k">${k}</div><div class="v" style="font-size:${vPx}px">${val.toFixed(1)}</div><div class="u">minutes</div></div>`;
    const after = gy + gh + 40;
    return svg(`<path d="${pc.d}" transform="translate(8 10)" fill="${SHADOW}"/><path d="${pd.d}" transform="translate(8 10)" fill="${SHADOW}"/>
        <path d="${pc.d}" fill="${T.cat.css}"/><path d="${pd.d}" fill="${T.dog.css}"/><path d="${pc.d}" fill="none" stroke="var(--g-bg)" stroke-width="6"/>`)
      + big(T.cat, tc2, catX, 'Cats', cats.median) + big(T.dog, td2, dogX, 'Dogs', dogs.median)
      + `<p class="h-dek h-abs" style="top:${after}px; font-size:34px">Median solo time on 500-piece puzzles, from <b style="color:var(--g-ink)">${fmtInt(cats.soloN)}</b> cat and <b style="color:var(--g-ink)">${fmtInt(dogs.soloN)}</b> dog results. ${Math.abs(cats.median - dogs.median).toFixed(1)} minutes apart.</p>
        <div class="h-abs" style="top:${after + 150}px"><p class="h-ask">Team cat or team dog?</p><p class="h-dek" style="margin-top:12px">Tell us in the comments.</p></div>`;
  };

  return {
    ...post(v, 'cats-dogs', [
      x => artSlide(x, 'cover', { kicker, title: `Cats outsolve dogs ${ratioTxt}`, src: c.source, art: versusArt }),
      roundsSlide,
      shelvesSlide,
      x => artSlide(x, 'fact', { kicker, title: "On the clock, it's a tie.", src: c.source, art: clockArt }),
    ]),
    label: `Cats vs dogs: ${ratioTxt} on results, a tie on the clock (4-slide carousel)`,
    caption: `Cats outsolve dogs ${ratioTxt} on MySpeedPuzzling: ${fmtInt(cats.results)} results on puzzles with a cat in the title, ${fmtInt(dogs.results)} with a dog.

Part of it is supply (${fmtInt(cats.puzzles)} cat puzzles in the catalogue, ${fmtInt(dogs.puzzles)} dog puzzles), but each cat puzzle is also solved more: ${perC.toFixed(1)} results on average vs ${perD.toFixed(1)}. Cats even win the notes, mentioned in ${cats.notes} of them vs ${dogs.notes}.

On the clock it's a tie: the median solo 500 takes ${cats.median.toFixed(1)} minutes for cats and ${dogs.median.toFixed(1)} for dogs.

So which team are you on, cat or dog? Tell us in the comments.

Box art by ${brandList(shelfBoxes)}, from the most-solved cat and dog puzzles.

#speedpuzzling #jigsawpuzzle #catsvsdogs`,
  };
}

// ---------------------------------------------------------------- 3 · subject tier list
const TIERS = [
  { key: 'S', band: '< 60 min', max: 60 },
  { key: 'A', band: '60–65 min', max: 65 },
  { key: 'B', band: '65–70 min', max: 70 },
  { key: 'C', band: '70+ min', max: Infinity },
];
type Subject = (typeof subjectRows)[number] & { box: Box };

function tierList(c: Content, v: Variant): Post {
  const subs: Subject[] = subjectRows.map(s => ({ ...s, box: toBox(s.rep)! })).filter(s => s.box);
  const tiers = TIERS.map((t, i) => ({ ...t, subs: subs.filter(s => s.median < t.max && (i === 0 || s.median >= TIERS[i - 1].max)) }));
  const slowest = subs[subs.length - 1], fastest = subs[0];
  const kicker = 'Puzzle atlas · Subjects';
  const cols = 6, PW = CW / cols;
  const twoLines = (t: (typeof tiers)[number]) => t.subs.some(s => s.name.length > 11);

  /** The board: one 1 × 6 jigsaw per tier; first piece the tier label, then one box-art piece per subject. */
  function board(o: { g: Ground; top: number; bottom: number; hide?: string; times: boolean; highlight?: string; maxGap?: number }) {
    const tones = tierTones(o.g);
    const labH = (t: (typeof tiers)[number]) => 10 + (o.times ? 34 : 0) + (twoLines(t) ? 54 : 28);
    const fixed = tiers.reduce((s, t) => s + labH(t), 0);
    const avail = o.bottom - o.top;
    const PH = Math.floor(Math.min(118, (avail - fixed - 3 * 18) / 4));
    const gap = Math.min(o.maxGap ?? 40, (avail - fixed - 4 * PH) / 3);
    const art: string[] = [], html: string[] = [];
    let held: { p: Piece; s: Subject } | null = null;
    let y = o.top;
    tiers.forEach((t, ti) => {
      const tone = tones[ti];
      const jig = generateJigsaw({ cols, rows: 1, width: CW, height: PH, x: X0, y, seed: 41 + ti, tabSize: 0.22 });
      const ps = [...jig.pieces].sort((a, b) => a.col - b.col);
      ps.forEach((p, k) => {
        const s = k ? t.subs[k - 1] : undefined;
        const shown = k === 0 || (s && s.theme !== o.hide);
        if (s && s.theme === o.hide) held = { p, s };
        if (shown) art.push(`<path d="${p.d}" transform="translate(5 7)" fill="${SHADOW}"/>`);
        art.push(k === 0 ? `<path d="${p.d}" ${fillAttr(tone)}/>` : shown ? pieceArt(p, s!.box) : `<path d="${p.d}" fill="var(--g-band)"/>`);
      });
      ps.forEach(p => art.push(`<path d="${p.d}" fill="none" stroke="var(--g-bg)" stroke-width="5" stroke-linejoin="round"/>`));
      if (o.highlight) {
        const k = t.subs.findIndex(s => s.theme === o.highlight);
        if (k >= 0) art.push(`<path d="${ps[k + 1].d}" fill="none" stroke="var(--g-ink)" stroke-width="6" stroke-linejoin="round"/>`);
      }
      const cx = (k: number) => X0 + PW * (k + 0.5);
      const lt = textOn(o.g, tone.hex);
      html.push(`<span class="ix-mid" data-qa-bg="${tone.hex}" style="left:${f1(cx(0))}px; top:${f1(y + PH / 2)}px; font-size:${Math.round(Math.min(64, PH * 0.56))}px; color:${lt.css}">${t.key}</span>
        <div class="ix-sub" data-qa-small style="left:${f1(cx(0))}px; top:${y + PH + 10}px; width:${f1(PW - 8)}px"><p class="bd">${h(t.band)}</p></div>`);
      t.subs.forEach((s, k) => {
        if (s.theme === o.hide) return;
        html.push(`<div class="ix-sub" data-qa-small style="left:${f1(cx(k + 1))}px; top:${y + PH + 10}px; width:${f1(PW - 8)}px">
          ${o.times ? `<p class="m">${Math.round(s.median)} <span>min</span></p>` : ''}<p class="nm">${h(s.name)}</p></div>`);
      });
      y += PH + labH(t) + gap;
    });
    return { art: art.join(''), html: html.join(''), held: held as { p: Piece; s: Subject } | null, PH };
  }

  const allBoxes = subs.map(s => s.box);
  const mainBrand = [...allBoxes.reduce((m, b) => m.set(b.brand, (m.get(b.brand) ?? 0) + 1), new Map<string, number>())].sort((x, y) => y[1] - x[1])[0][0];
  const boardCredit = `Box art: ${brandList(allBoxes)}; every box is named on slides 3 and 4`;

  // --- 1 · the question: the board with the slowest subject lifted off.
  const questionArt = (a: ArtArea) => {
    const q = board({ g: a.g, top: a.top, bottom: a.bottom, hide: slowest.theme, times: false, maxGap: 52 });
    const cy = a.seam ?? FEED.contentTop + 120;
    return svg(q.art + (q.held ? lifted(q.held.p, q.held.s.box, 862, cy, 11, 1.3 * Math.min(1, 118 / q.PH)) : '')) + q.html;
  };

  // --- 3, 4 · details: every subject with its box, median bar from zero, sample sizes.
  const detail = (x: SlideCtx, tierKeys: string[], title: string) => {
    const g = groundFor(x, 'data'), tones = tierTones(g);
    const ts = tiers.map((t, i) => ({ ...t, tone: tones[i] })).filter(t => tierKeys.includes(t.key));
    const list = ts.flatMap(t => t.subs.map(s => ({ s, t })));
    const top = 330, bottom = 1186, rh = Math.min(118, (bottom - top - 24 * (ts.length - 1)) / list.length);
    const BX = 178, BW = 108, NX = 306, barX = 652, barW = 220, maxMin = 100;
    const art: string[] = [], html: string[] = [];
    let y = top, prev = '';
    list.forEach(({ s, t }) => {
      if (prev && prev !== t.key) y += 24;
      if (prev !== t.key) {
        const b = badgePiece(X0 - 12, y + (rh - 84) / 2, 84, t.tone);
        art.push(b.svg);
        html.push(`<span class="ix-mid" data-qa-bg="${t.tone.hex}" style="left:${f1(b.cx)}px; top:${f1(b.cy)}px; font-size:44px; color:${textOn(g, t.tone.hex).css}">${t.key}</span>`);
      }
      prev = t.key;
      const sz = fit(s.box, BW - 8, rh - 22);
      html.push(mount(s.box, BX + (BW - sz.w) / 2, y + (rh - sz.h) / 2 - 2, sz.w, sz.h, { pad: 4 }));
      const bw = (s.median / maxMin) * barW;
      art.push(`<rect x="${barX}" y="${f1(y + rh / 2 - 26)}" width="${barW}" height="26" fill="var(--g-band)"/>
        <rect x="${barX}" y="${f1(y + rh / 2 - 26)}" width="${f1(bw)}" height="26" ${fillAttr(t.tone)}/>`);
      html.push(`<div class="ix-drow" style="left:${NX}px; width:${barX - NX - 16}px; top:${f1(y + rh / 2 - 34)}px">
          <p class="nm">${h(s.name)}</p><p class="cr" data-qa-small>${h(s.box.brand === mainBrand ? s.box.puzzle : `${s.box.puzzle} (${s.box.brand})`)}</p></div>
        <span class="ix-dval" style="left:${f1(barX + barW + 14)}px; top:${f1(y + rh / 2 - 31)}px">${s.median.toFixed(1)}</span>
        <span class="ix-dmeta" data-qa-small style="left:${barX}px; top:${f1(y + rh / 2 + 6)}px">${fmtInt(s.puzzles)} puzzles · ${fmtInt(s.results)} results</span>`);
      y += rh;
    });
    return slide(x, 'data', {
      kicker, src: c.source,
      body: STYLE + svg(art.join('')) + titleBlock(title, { px: 56 })
        + `<p class="h-abs ix-small" data-qa-small style="top:252px">Median solo minutes on 500-piece puzzles, bars from 0 to ${maxMin}. Each subject's most-solved box; box art: ${h(mainBrand)} unless noted.</p>`
        + html.join(''),
    }).html;
  };

  return {
    ...post(v, 'tier-list', [
      x => artSlide(x, 'cover', {
        kicker, title: `Where would you put ${slowest.name.toLowerCase()}?`, titleW: 640, titlePx: 68,
        dek: `${subs.length} subjects, ranked by solo time on 500s`, dekPx: 30, src: boardCredit, art: questionArt,
      }),
      x => {
        const g = groundFor(x, 'data');
        const title = `${slowest.name} take ${Math.round(slowest.median)} minutes. ${fastest.name} takes ${Math.round(fastest.median)}.`;
        const a = board({ g, top: 344, bottom: FEED.contentBottom, times: true, highlight: slowest.theme });
        return slide(x, 'data', { kicker, src: boardCredit, body: STYLE + svg(a.art) + titleBlock(title, { px: 56 }) + a.html }).html;
      },
      x => detail(x, ['S', 'A'], 'S and A: the quick ones'),
      x => detail(x, ['B', 'C'], 'B and C: settle in'),
    ]),
    label: `Subject tier list: ${subs.length} subjects by median solo-500 time (4-slide carousel)`,
    caption: `${slowest.name} take ${Math.round(slowest.median)} minutes. ${fastest.name} takes ${Math.round(fastest.median)}. We ranked ${subs.length} puzzle subjects by their median solo time on 500-piece puzzles.

S tier, under an hour: ${andList(tiers[0].subs.map(s => lc(s.name)))}. C tier, 70 minutes and up: ${andList(tiers[3].subs.map(s => lc(s.name)))}. Cats and dogs share B tier.

Subjects come from words in puzzle titles, so one big puzzle can pull a subject up or down. Slides 3 and 4 show how many puzzles and results sit behind each one.

Where would you move ${lc(slowest.name)}, and which subject slows you down the most?

Box art by ${brandList(allBoxes)}, one most-solved box per subject.

#speedpuzzling #jigsawpuzzle #puzzletime`,
  };
}

// ---------------------------------------------------------------- 4 · museum of most-solved (G2 A3)
// Plate selection as in G2: each room asks for one AI1 plate; if that file isn't there, it takes the best plate of
// the same kind by its check score (the sidecar's own checks, else lab/ai1/checks.ts here on the CPU), else the
// slide shows the ground with an "AI plate pending" note. The source line names the plate's model and licence.
const AI_DIR = join(ROOT, 'content/labs/AI1');
const MUSEUM_PLATES = ['E1/museum-wall-s101.png', 'E1/museum-wall-s102.png', 'E1/museum-wall-s103.png', 'E1/museum-wall-s104.png', 'E1/museum-wall-s105.png', 'E1/museum-wall-s101.png'];
const MODEL: Record<string, string> = { zimage: 'Z-Image Turbo', klein4b: 'FLUX.2 klein 4B', klein9b: 'FLUX.2 klein 9B', qwen: 'Qwen-Image-Edit-2511' };
const shortLicence = (l: string) => l.replace('FLUX Non-Commercial License', 'FLUX Non-Commercial');

interface Plate { want: string; status: 'chosen' | 'best' | 'pending'; label: string; url?: string; model?: string; licence?: string; floor: number }
interface Side { status?: string; family?: string; licence?: string; prompt_id?: string; checks?: { pass: boolean | null; metrics: Record<string, unknown> } }
const readSide = (f: string): Side | null => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };

/** Wall → floor line: the strongest rise in colourfulness (plaster is grey, oak is not) in the lower half (G2). */
async function floorLine(file: string): Promise<number> {
  const gw = 68, gh = 85;
  const { data } = await sharp(file).removeAlpha().resize(gw, gh, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const rows: number[] = [];
  for (let y = 0; y < gh; y++) {
    let s = 0;
    for (let x = 8; x < gw - 8; x++) { const p = (y * gw + x) * 3; s += Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]); }
    rows.push(s / (gw - 16));
  }
  let best = 0.75, bd = -1;
  for (let y = Math.round(gh * 0.5); y < gh - 3; y++) { const d = rows[y + 2] - rows[y - 1]; if (d > bd) { bd = d; best = (y + 0.5) / gh; } }
  return best;
}

/** E1 check score (G2): passing all auto-checks dominates, then zone flatness and palette distance. */
async function e1Score(file: string, side: Side): Promise<number> {
  let ch = side.checks ?? null;
  if (!ch) {
    try {
      const { EXPERIMENTS } = await import('../../ai1/batch.ts');
      const { runChecks } = await import('../../ai1/checks.ts');
      const zone = EXPERIMENTS.find(e => e.id === 'E1')!.prompts.find(p => p.id === side.prompt_id)?.zone;
      ch = await runChecks({ checks: ['zone', 'palette'], zone }, file);
    } catch { ch = null; }
  }
  if (!ch) return -1e6;
  const m = ch.metrics as Record<string, number>;
  return (ch.pass ? 100 : 0) - (m.zone_sigma ?? 30) - 0.5 * (m.palette_de2000_snapped ?? 20);
}

async function resolvePlate(want: string, avoid: Set<string>): Promise<Plate> {
  const [exp, file] = want.split('/');
  const job = file.replace(/\.png$/, ''), stem = job.replace(/-s\d+$/, '');
  const dir = join(AI_DIR, exp);
  const pending: Plate = { want, status: 'pending', label: `${exp} ${stem.replace(/-/g, ' ')}`, floor: 0.745 };
  const ok = (j: string) => {
    const png = join(dir, `${j}.png`), side = readSide(join(dir, `${j}.json`));
    return existsSync(png) && side?.status === 'ok' ? { png, side } : null;
  };
  let pick: { job: string; png: string; side: Side; status: Plate['status'] } | null = null;
  const w0 = ok(job);
  if (w0) pick = { job, ...w0, status: 'chosen' };
  else if (existsSync(dir)) {
    const re = new RegExp(`^${stem}-s\\d+$`);
    const cands: Array<{ job: string; png: string; side: Side; score: number }> = [];
    for (const f of readdirSync(dir)) {
      const j = f.replace(/\.png$/, '');
      const cnd = f.endsWith('.png') && re.test(j) ? ok(j) : null;
      if (cnd) cands.push({ job: j, ...cnd, score: await e1Score(cnd.png, cnd.side) });
    }
    cands.sort((a, b) => b.score - a.score);
    const best = cands.find(cd => !avoid.has(cd.job)) ?? cands[0];
    if (best) pick = { ...best, status: 'best' };
  }
  if (!pick) return pending;
  avoid.add(pick.job);
  return {
    ...pending, status: pick.status, url: '/' + pick.png.slice(ROOT.length + 1),
    model: MODEL[pick.side.family ?? ''] ?? pick.side.family, licence: shortLicence(pick.side.licence ?? 'licence unknown'),
    floor: await floorLine(pick.png),
  };
}
const avoidMuseum = new Set<string>();
const PLATES: Plate[] = [];
for (const [i, want] of MUSEUM_PLATES.entries()) PLATES.push(await resolvePlate(want, i < 5 ? avoidMuseum : new Set()));
const aiCredit = (p: Plate) => (p.status === 'pending' ? 'Backdrop: AI plate pending' : `Backdrop: AI (${p.model}, ${p.licence})`);

/** Frame + plaque on the wall: hung so the frame's bottom sits well above the floor, plaque to its right (G2). */
function hang(aspect: number, floorY: number) {
  const FR = 12, MAT = 46, PW = 318, GAP = 40;
  const maxOuter = CW - PW - GAP;
  let aw = maxOuter - 2 * (FR + MAT), ah = aw / aspect;
  if (ah > 372) { ah = 372; aw = ah * aspect; }
  const ow = aw + 2 * (FR + MAT), oh = ah + 2 * (FR + MAT);
  const x = Math.round((W - (ow + GAP + PW)) / 2);
  const bottom = floorY - 0.115 * FEED_H;
  return { frame: { x, y: Math.round(bottom - oh), w: ow, h: oh, aw, ah, FR, MAT }, plaque: { x: x + ow + GAP, w: PW } };
}

function museum(c: Content, v: Variant): Post {
  const kicker = 'Museum of Most-Solved';
  const rooms = ROOM_THEMES.map(([theme, title], i) => {
    const r = champs.find(x => x.theme === theme)!;
    const image = imageOf(r.puzzle, r.brand);
    const box = image ? toBox({ ...r, image }) : null;
    return { n: i + 1, theme, title, r, box };
  });
  const paper = GROUNDS.paper;
  const plaqueOf = (r: Row) => `
    <p class="t">${h(r.puzzle)}</p>
    <p class="s" data-qa-small>${h(r.brand)}<br><i>Jigsaw puzzle, ${fmtInt(num(r.pieces))}&nbsp;pieces</i></p>
    <hr>
    <p class="n">Solved by <b>${fmtInt(num(r.solvers))}</b> puzzlers</p>
    <p class="s" data-qa-small>Median solo time <b style="white-space:nowrap; color:var(--g-ink)">${Math.round(num(r.median_solo_min))} min</b></p>`;

  /** One room: the AI plate is the ground; the house header and footer sit on solid bands of the variant's ground. */
  const room = (x: SlideCtx, p: Plate, sign: string, plaque: string, b: Box | null, extraSrc = '') => {
    const g = groundFor(x, 'image');
    const floorY = p.floor * FEED_H;
    const hg = hang(b?.ar ?? 1.36, floorY);
    const f = hg.frame;
    const art = b
      ? `<img class="art" src="${b.img}" alt="" style="left:${f.FR + f.MAT}px; top:${f.FR + f.MAT}px; width:${f1(f.aw)}px; height:${f1(f.ah)}px">`
      : `<div class="art" style="left:${f.FR + f.MAT}px; top:${f.FR + f.MAT}px; width:${f1(f.aw)}px; height:${f1(f.ah)}px; ${groundVars(paper)}; outline:3px dashed var(--g-rule); outline-offset:-14px; display:grid; place-items:center" data-qa-bg="#ffffff">
          <p style="font-size:120px; font-weight:300; line-height:1; color:var(--g-soft)">?</p></div>`;
    const under = `${p.url ? `<img class="ix-plate" src="${p.url}" alt="">` : ''}
      <div class="ix-band" style="top:0; height:162px"></div><div class="ix-band" style="top:1184px; height:${FEED_H - 1184}px"></div>`;
    const pendingNote = p.status === 'pending'
      ? `<p class="h-abs ix-small" data-qa-small data-qa-bg="${paper.bg}" style="top:${Math.round(floorY) + 30}px; width:auto; padding:8px 18px; ${groundVars(paper)}; background:var(--g-bg); color:var(--g-soft)">AI plate pending · ${h(p.label)}</p>` : '';
    const body = STYLE + `
      <div class="ix-sign" data-qa-bg="${g.bg}" style="top:196px">${sign}</div>
      <div class="ix-frm" style="left:${f.x}px; top:${f.y}px; width:${f1(f.w)}px; height:${f1(f.h)}px">
        <div class="mat" style="left:${f.FR}px; top:${f.FR}px; right:${f.FR}px; bottom:${f.FR}px"></div>${art}</div>
      <div class="ix-plq" data-qa-bg="${paper.bg}" style="${groundVars(paper)}; left:${hg.plaque.x}px; width:${hg.plaque.w}px; bottom:${f1(FEED_H - f.y - f.h)}px">${plaque}</div>
      ${pendingNote}`;
    return frame({ ground: g.key, kicker, idx: [x.slide, x.of], device: v.device, body, src: `${c.source} · ${extraSrc}${aiCredit(p)}`, under });
  };

  const next = NEXT_THEMES.map(([t, name]) => ({ name, r: champs.find(x => x.theme === t)! }));
  const r1 = rooms[0].r;
  const brands = [...new Set(rooms.map(r => r.r.brand))];
  return {
    ...post(v, 'museum', [
      ...rooms.map((rm, i) => (x: SlideCtx) => room(x, PLATES[i],
        `<p class="t">Room ${rm.n} <i>·</i> ${h(rm.title)}</p>
         ${i === 0 ? `<p class="d"><b>${fmtInt(num(rm.r.solvers))}</b> of you have built the most-solved lighthouse on MySpeedPuzzling.</p>` : ''}`,
        plaqueOf(rm.r), rm.box)),
      x => room(x, PLATES[5], `<p class="t">Room 6 <i>·</i> your pick</p><p class="d">Which subject gets the next room?</p>`,
        `<p class="t">Coming soon</p>
         ${next.map(n => `<p class="n" style="margin-top:12px"><b>${h(n.name)}</b></p><p class="s" data-qa-small style="margin-top:2px">${h(n.r.puzzle)}, ${fmtInt(num(n.r.solvers))} solvers</p>`).join('')}`,
        null),
    ]),
    label: 'Museum of Most-Solved (AI gallery wall + framed boxes)',
    caption: `Room 1 of the Museum of Most-Solved: lighthouses. ${r1.puzzle} by ${r1.brand} has been solved by ${fmtInt(num(r1.solvers))} puzzlers on MySpeedPuzzling, with a median solo time of ${Math.round(num(r1.median_solo_min))} minutes.

Swipe through four more rooms: ${rooms.slice(1).map(r => r.title.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' and $1')}. Each one holds the most-solved puzzle of its subject.

Which room should we open next: ${next.map(n => n.name.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' or $1')}?

Box art: ${brands.join(', ')}.
#speedpuzzling #jigsawpuzzle #ravensburger`,
  };
}

const family: Family = {
  id: 'ideas',
  name: 'Ideas (DL3 idea prototypes)',
  posts: (c, v) => [atlas(c, v), catsDogs(c, v), tierList(c, v), museum(c, v)],
};
export default family;
