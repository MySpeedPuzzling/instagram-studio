// G1 · Themes Atlas (DL3): three of the brainstorm's top ideas (docs/ideas/brainstorm-2026-10.md) as one family.
//   signature-puzzles (B1): Europe, the Americas and Oceania as a tile map cut from one generated jigsaw; each
//     country's piece carries its signature puzzle's box art and the over-index vs the world; region slides show
//     every box whole and credited, with a locator map.
//   cats-vs-dogs (A1): a versus poster with the two champion boxes, a 100-piece unit bar, five "rounds" drawn as
//     split bars whose split is a generated jigsaw cut, two box shelves and a two-piece tie on the clock.
//   subject-tier-list (A2): subjects as interlocking box-art pieces on an S/A/B/C board by median solo-500 time.
// Shared look: warm map paper with a faint grid, navy ink, coral as the accent fill, generator pieces only.
// Every visible box carries "Puzzle · Brand"; boards and the map carry a collective credit pointing to the slides
// that name each box.
//
// Data (cached; re-query with --fresh before any of this becomes a real post): boxes-country-signatures (same rule
// as bs-country-puzzles, plus images and the world rate), bs-themes, bs-theme-speed, bs-comment-words,
// boxes-cats-dogs, boxes-subject-speed. Private profiles are excluded in every query.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchBoxes } from '../../../src/data/boxes.ts';
import { query } from '../../../src/data/db.ts';
import { escapeHtml as h, fmtInt } from '../../../src/design/page.ts';
import { LOGO_URL, flagUrl, pieceGrid, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw, type Piece, type Point } from '../../../src/pieces/jigsaw.ts';
import { ROOT } from '../../../src/render/server.ts';
import type { Content } from '../content.ts';
import type { Direction, Post, Slide } from '../../dl1/types.ts';

const W = 1080, H = 1350, X0 = 88, X1 = 992, CW = X1 - X0;
const PAPER = '#fbf7f3';      // --paper-warm: the map paper
const GRID = '#f0e8de';       // faint map grid
const MAT = '#efe6db';        // empty slots, "?" countries
const MAT_LINE = '#e0d3c4';
const TAN = '#ddd2c4';        // other countries on the locator map
const BOARD = '#f5eee5';      // the empty puzzle board under the map
const OPEN = '#ffe6e3';       // --coral-100: "?" pieces (no clear signature yet)
const SHADOW = 'rgba(43,52,69,.16)';
const LIFT = 'rgba(43,52,69,.24)';
const OUTLINE = 'rgba(24,28,38,.28)';
const CORAL = '#ec726f', INDIGO = '#4e54c8', NAVY = '#2b3445';
const f1 = (v: number) => v.toFixed(1);
const pt = (p: Point) => `${f1(p[0])} ${f1(p[1])}`;

// ---------------------------------------------------------------- data
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

const IMG = await fetchBoxes([
  ...COUNTRY_ROWS.map(r => r.image), ...catTop.slice(0, 4).map(r => r.image), ...dogTop.slice(0, 4).map(r => r.image),
  ...subjectRows.map(s => s.rep.image),
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
const nextId = (p: string) => `${p}${++uid}`;
/** Box art filling a generator piece (cover crop), as SVG. */
function pieceArt(p: Piece, b: Box) {
  const id = nextId('pa');
  return `<clipPath id="${id}"><path d="${p.d}"/></clipPath>
    <image href="${b.img}" x="${f1(p.bbox.x)}" y="${f1(p.bbox.y)}" width="${f1(p.bbox.width)}" height="${f1(p.bbox.height)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}
/** A whole box lying on the paper: hard offset shadow, art, hairline edge; optional tilt. */
function boxArt(b: Box, x: number, y: number, w: number, hh: number, rot = 0) {
  const t = rot ? ` transform="rotate(${rot} ${f1(x + w / 2)} ${f1(y + hh / 2)})"` : '';
  return `<g${t}><rect x="${f1(x + 8)}" y="${f1(y + 10)}" width="${f1(w)}" height="${f1(hh)}" fill="${SHADOW}"/>
    <image href="${b.img}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(hh)}" preserveAspectRatio="xMidYMid slice"/>
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(hh)}" fill="none" stroke="${OUTLINE}" stroke-width="1.5"/></g>`;
}
/** Piece k's edge (0 top, 1 right, 2 bottom, 3 left) as 10 control points, clockwise. */
const pieceEdge = (p: Piece, k: number) => p.outline.slice(9 * k, 9 * k + 10);
/**
 * A 100% bar split into two interlocking pieces: the split is one cut line taken from the generator and moved to
 * the split point, so both halves share it exactly.
 */
function splitBar(x: number, y: number, w: number, hh: number, share: number, seed: number) {
  const g = generateJigsaw({ cols: 2, rows: 1, width: 2 * hh, height: hh, seed, tabSize: 0.26, jitter: 0.02 });
  const e = pieceEdge(g.pieces.find(p => p.col === 0)!, 1);
  const sx = Math.min(x + w - hh, Math.max(x + hh, x + w * share));
  const q = e.map(([px, py]) => [px - hh + sx, py + y] as Point);
  const curve = `C ${pt(q[1])} ${pt(q[2])} ${pt(q[3])} C ${pt(q[4])} ${pt(q[5])} ${pt(q[6])} C ${pt(q[7])} ${pt(q[8])} ${pt(q[9])}`;
  return {
    left: `M ${x} ${y} L ${pt(q[0])} ${curve} L ${x} ${y + hh} Z`,
    right: `M ${x + w} ${y} L ${pt(q[0])} ${curve} L ${x + w} ${y + hh} Z`,
    split: sx,
  };
}
/** A generator piece lifted off the board: moved to (cx, cy), rotated, scaled, hard shadow. */
function lifted(p: Piece, b: Box, cx: number, cy: number, rot: number, s: number) {
  const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
  const t = (dx: number, dy: number) => `translate(${f1(cx + dx)} ${f1(cy + dy)}) rotate(${rot}) scale(${s}) translate(${f1(-pcx)} ${f1(-pcy)})`;
  return `<path d="${p.d}" transform="${t(12, 16)}" fill="${LIFT}"/>
    <g transform="${t(0, 0)}">${pieceArt(p, b)}<path d="${p.d}" fill="none" stroke="${OUTLINE}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g>`;
}

const MARK = (() => {
  const sp = singlePiece(60, 23);
  return `<svg width="46" height="46" viewBox="${sp.viewBox}"><path d="${sp.d}" fill="${CORAL}"/></svg>`;
})();
const PAPER_GRID = (() => {
  const d: string[] = [];
  for (let x = 24; x <= W; x += 64) d.push(`M${x} 0V${H}`);
  for (let y = 8; y <= H; y += 64) d.push(`M0 ${y}H${W}`);
  return `<path d="${d.join('')}" stroke="${GRID}" stroke-width="1.5" fill="none"/>`;
})();

// ---------------------------------------------------------------- theme
const css = `
body { background: ${PAPER}; }
.frame { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${PAPER}; color: var(--ink); }
.art { position: absolute; left: 0; top: 0; }
.hd { position: absolute; left: ${X0}px; width: ${CW}px; top: 60px; height: 52px; display: flex; align-items: center; gap: 14px; }
.hd svg { flex: none; margin-left: -4px; }
.kick { font-size: 30px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; line-height: 1; }
.idx { margin-left: auto; font-size: 30px; font-weight: 700; line-height: 1; }
.idx i { font-style: normal; font-weight: 400; color: var(--ink-muted); }
.abs { position: absolute; }
.t { position: absolute; left: ${X0}px; width: ${CW}px; }
.title { font-size: 72px; font-weight: 700; line-height: 1.04; letter-spacing: -0.022em; text-wrap: balance; }
.h2 { font-size: 64px; font-weight: 700; line-height: 1.06; letter-spacing: -0.018em; text-wrap: balance; }
.dek { font-size: 34px; line-height: 1.28; color: var(--ink-soft); text-wrap: pretty; }
.dek b { color: var(--ink); font-weight: 700; }
.small { font-size: 24px; line-height: 1.25; color: var(--ink-muted); }
.small b { color: var(--ink-soft); font-weight: 600; }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1214px; height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-top: 2px solid ${MAT_LINE}; padding-top: 14px; }
.src { font-size: 30px; color: var(--ink-muted); line-height: 1.2; }
.src.s { font-size: 24px; }
.logo { width: 64px; height: 57px; flex: none; }
.flag { position: absolute; border-radius: 50%; box-shadow: 0 0 0 3px ${PAPER}; }
.chip { position: absolute; background: ${NAVY}; color: #fff; font-size: 26px; font-weight: 700; line-height: 36px; height: 36px; padding: 0 10px; border-radius: 18px; white-space: nowrap; letter-spacing: -0.01em; }
.q { position: absolute; transform: translate(-50%, -50%); font-size: 64px; font-weight: 800; color: var(--coral-700); line-height: 1; }
.lbl { position: absolute; font-size: 24px; font-weight: 600; color: var(--ink-muted); letter-spacing: 0.06em; text-transform: uppercase; }
/* country rows */
.crow { position: absolute; left: 400px; width: ${X1 - 400}px; }
.crow .nm { display: flex; align-items: center; gap: 14px; font-size: 44px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
.crow .nm img { width: 46px; height: 46px; flex: none; }
.crow .x { position: absolute; right: 0; top: -8px; font-size: 72px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
.crow .pz { font-size: 30px; line-height: 1.2; color: var(--ink); margin-top: 12px; font-weight: 500; }
.crow .pz span { color: var(--ink-muted); font-weight: 400; }
.crow .st { font-size: 30px; line-height: 1.2; color: var(--ink-soft); margin-top: 6px; }
.crow .st b { color: var(--ink); }
.rule { position: absolute; left: ${X0}px; width: ${CW}px; height: 2px; background: ${MAT_LINE}; }
/* versus */
.team { position: absolute; width: 420px; }
.team .k { font-size: 30px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.team .v { font-size: 104px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; margin-top: 6px; }
.team .s { font-size: 30px; color: var(--ink-soft); line-height: 1.2; margin-top: 8px; }
.team.r { text-align: right; }
.vs { position: absolute; transform: translate(-50%, -50%); font-size: 48px; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; }
.round { position: absolute; left: ${X0}px; width: ${CW}px; }
.round .hd2 { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.round .lb { font-size: 34px; font-weight: 700; line-height: 1.1; }
.round .win { font-size: 30px; font-weight: 700; white-space: nowrap; line-height: 40px; height: 40px; padding: 0 14px; border-radius: 20px; }
.round .lb i { font-style: normal; font-weight: 400; color: var(--ink-soft); font-size: 30px; }
.bv { position: absolute; font-size: 38px; font-weight: 700; line-height: 1; white-space: nowrap; transform: translateY(-50%); }
.shelf .nm { font-size: 24px; font-weight: 600; line-height: 1.2; color: var(--ink); }
.shelf .br { font-size: 24px; line-height: 1.2; color: var(--ink-muted); }
.shelf .n { font-size: 30px; font-weight: 700; line-height: 1.1; margin-top: 8px; }
.shelf .n span { font-size: 24px; font-weight: 400; color: var(--ink-soft); }
.big { position: absolute; transform: translate(-50%, -50%); text-align: center; }
.big .k { font-size: 38px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.big .v { font-size: 136px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-top: 6px; }
.big .u { font-size: 38px; font-weight: 700; }
/* tier board */
.tl { position: absolute; transform: translate(-50%, -50%); font-size: 64px; font-weight: 800; line-height: 1; color: var(--ink); }
.sub { position: absolute; text-align: center; transform: translateX(-50%); }
.sub .nm { font-size: 24px; font-weight: 700; line-height: 1.1; color: var(--ink); text-wrap: balance; }
.sub .m { font-size: 30px; font-weight: 700; line-height: 1.1; margin-top: 2px; }
.sub .m span { font-size: 24px; font-weight: 400; color: var(--ink-soft); }
.band { position: absolute; font-size: 24px; font-weight: 600; line-height: 1.1; color: var(--ink); text-align: center; transform: translateX(-50%); white-space: nowrap; }
.drow { position: absolute; left: 290px; width: ${X1 - 290}px; }
.drow .nm { font-size: 34px; font-weight: 700; line-height: 1.1; }
.drow .cr { font-size: 24px; line-height: 1.2; color: var(--ink-muted); margin-top: 4px; white-space: nowrap; }
.dval { position: absolute; font-size: 34px; font-weight: 700; line-height: 1; white-space: nowrap; }
.dval span { font-size: 24px; font-weight: 400; color: var(--ink-soft); }
.dmeta { position: absolute; font-size: 24px; line-height: 1.2; color: var(--ink-muted); white-space: nowrap; }
`;

interface FrameOpts { kicker: string; idx: [number, number]; art?: string; body: string; foot: string }
function frame(o: FrameOpts): string {
  return `<div class="frame">
  <svg class="art" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${PAPER_GRID}${o.art ?? ''}</svg>
  <header class="hd">${MARK}<span class="kick">${h(o.kicker)}</span><span class="idx">${o.idx[0]}<i> / ${o.idx[1]}</i></span></header>
  ${o.body}
  <footer class="foot">${o.foot}<img class="logo" src="${LOGO_URL}" alt=""></footer>
</div>`;
}
const src = (c: Content) => `<span class="src">${h(c.source)}</span>`;
const swipe = (t: string) => `<span class="src" style="color:var(--ink);font-weight:700">${h(t)} →</span>`;

// ---------------------------------------------------------------- 1 · Every country's signature puzzle (B1)
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
for (const c of countries) if (!MAP[c.cc] || !COUNTRY[c.cc]) console.warn(`G1: no tile/region for ${c.cc}; add it to MAP, COUNTRY and REGIONS`);
const liftTxt = (v: number) => `${Math.round(v)}×`;
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const withThe = (n: string) => (/^United /.test(n) ? `the ${n}` : n);
/** Lower-case a subject name for running text, keeping proper nouns. */
const lc = (n: string) => (/^(Disney|Christmas)/.test(n) ? n : n.toLowerCase());
const pctW = (v: number) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)}%`;

function mapJig(x: number, y: number, p: number) {
  return generateJigsaw({ cols: 6, rows: 6, width: 6 * p, height: 6 * p, x, y, seed: 5, tabSize: 0.2 });
}

function signatures(c: Content): Post {
  const strong = countries.filter(k => k.strong);
  const weak = countries.filter(k => !k.strong);
  const groups = REGIONS.map(g => ({ name: g.name, members: g.cc.map(cc => strong.find(k => k.cc === cc)).filter((k): k is Country => !!k).sort((a, b) => b.lift - a.lift) }))
    .filter(g => g.members.length);
  const total = groups.length + 2;
  const kicker = 'Puzzle atlas · Countries';

  // --- 1 · cover: the tile map
  // The whole 6 × 6 puzzle is the board (faint guide cuts); countries are the pieces already placed, the empty
  // slots are the countries still missing, and the "?" pieces are countries without a clear signature yet.
  const P = 138, MX = X0 + (CW - 6 * P) / 2, MY = 368;
  const jig = mapJig(MX, MY, P);
  const at = (cc: string) => jig.pieces.find(p => p.col === MAP[cc][0] && p.row === MAP[cc][1])!;
  const onMap = countries.filter(k => MAP[k.cc]);
  const art = [
    `<rect x="${f1(MX)}" y="${f1(MY)}" width="${6 * P}" height="${6 * P}" fill="${BOARD}"/>`,
    `<path d="${jig.cuts}" fill="none" stroke="${MAT_LINE}" stroke-width="2"/><path d="${jig.border}" fill="none" stroke="${MAT_LINE}" stroke-width="2"/>`,
    ...onMap.map(k => `<path d="${at(k.cc).d}" transform="translate(6 8)" fill="${SHADOW}"/>`),
    ...onMap.map(k => (k.strong ? pieceArt(at(k.cc), k.box!) : `<path d="${at(k.cc).d}" fill="${OPEN}"/>`)),
    ...onMap.map(k => `<path d="${at(k.cc).d}" fill="none" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>`),
  ].join('');
  const cellX = (cc: string) => MX + MAP[cc][0] * P, cellY = (cc: string) => MY + MAP[cc][1] * P;
  const over = onMap.map(k => {
    const x = cellX(k.cc), y = cellY(k.cc);
    const flag = `<img class="flag" src="${flagUrl(k.cc)}" alt="" style="left:${f1(x + 12)}px;top:${f1(y + 12)}px;width:40px;height:40px">`;
    return k.strong
      ? `${flag}<span class="chip" data-qa-small style="right:${f1(W - (x + P - 10))}px;top:${f1(y + P - 46)}px">${liftTxt(k.lift)}</span>`
      : `${flag}<span class="q" data-qa-bg="${OPEN}" style="left:${f1(x + P / 2 + 6)}px;top:${f1(y + P / 2 + 8)}px">?</span>`;
  }).join('');
  const cover: Slide = { id: 'cover', body: frame({
    kicker, idx: [1, total], art,
    body: `<h1 class="t title" style="top:128px">Every country's signature puzzle</h1>
      <p class="t dek" style="top:290px;font-size:30px">The puzzle each country solves far more often than the rest of the world, and how many times the world rate that is.</p>
      ${over}`,
    foot: `<span class="src s" data-qa-small>Box art by the brands named on slides 2–${total - 1}</span>`,
  }) };

  // --- 2..n-1 · regions
  const LOC = 30, LX = X1 - 6 * LOC, LY = 132;
  const loc = mapJig(LX, LY, LOC);
  const locAt = (cc: string) => loc.pieces.find(p => p.col === MAP[cc][0] && p.row === MAP[cc][1])!;
  const regionSlides: Slide[] = groups.map((g, gi) => {
    const set = new Set(g.members.map(k => k.cc));
    const locator = `<rect x="${LX}" y="${LY}" width="${6 * LOC}" height="${6 * LOC}" fill="${BOARD}"/><path d="${loc.cuts}" fill="none" stroke="${MAT_LINE}" stroke-width="1"/>`
      + onMap.map(k => `<path d="${locAt(k.cc).d}" fill="${set.has(k.cc) ? CORAL : k.strong ? TAN : OPEN}" stroke="${PAPER}" stroke-width="1.5"/>`).join('');
    const top = 322, bottom = 1196, n = g.members.length;
    const rowH = Math.min(236, (bottom - top) / n);
    const boxes: string[] = [], rows: string[] = [];
    g.members.forEach((k, i) => {
      const y = top + i * rowH;
      const slotH = rowH - 30, b = k.box!;
      const s = fit(b, 290, slotH);
      boxes.push(boxArt(b, X0 + (290 - s.w) / 2, y + (slotH - s.h) / 2, s.w, s.h));
      if (i) rows.push(`<div class="rule" style="top:${f1(y - 15)}px"></div>`);
      rows.push(`<div class="crow" style="top:${f1(y + Math.max(0, (slotH - 150) / 2))}px">
        <div class="nm"><img src="${flagUrl(k.cc)}" alt="">${h(k.name)}</div>
        <div class="x">${liftTxt(k.lift)}</div>
        <p class="pz">${h(b.puzzle)} <span>· ${h(b.brand)}</span></p>
        <p class="st"><b>${k.pctLocal.toFixed(1)}%</b> of ${fmtInt(k.puzzlers)} puzzlers · world ${pctW(k.pctWorld)}</p></div>`);
    });
    return { id: `region-${gi + 1}`, body: frame({
      kicker, idx: [gi + 2, total], art: locator + boxes.join(''),
      body: `<h2 class="t h2" style="top:136px;width:640px">${h(g.name)}</h2>
        <p class="t dek" style="top:224px;width:640px;font-size:30px">Who solved it, and <b>×</b> the world rate</p>
        ${rows.join('')}`,
      foot: src(c),
    }) };
  });

  // --- last · no clear signature + how it works + your country
  // Open "?" pieces, one column each: an interior piece of a 3 × 3 jigsaw (body QS), flag and "?" on it.
  const QS = 132;
  const qPiece = generateJigsaw({ cols: 3, rows: 3, width: 3 * QS, height: 3 * QS, seed: 23, tabSize: 0.22 }).pieces.find(p => p.col === 1 && p.row === 1)!;
  const colW = CW / Math.max(3, weak.length), qy = 420;
  const qArt: string[] = [], qHtml: string[] = [];
  weak.forEach((k, i) => {
    const cx = X0 + colW * (i + 0.5);
    const dx = cx - QS / 2 - QS, dy = qy - QS; // body (QS..2QS) → centred in the column, top at qy
    qArt.push(`<path d="${qPiece.d}" transform="translate(${f1(dx + 8)} ${dy + 10})" fill="${SHADOW}"/><path d="${qPiece.d}" transform="translate(${f1(dx)} ${dy})" fill="${OPEN}"/>`);
    qHtml.push(`<img class="flag" src="${flagUrl(k.cc)}" alt="" style="left:${f1(cx - 24)}px;top:${qy + 14}px;width:48px;height:48px">
      <span class="q" data-qa-bg="${OPEN}" style="left:${f1(cx)}px;top:${qy + 96}px;font-size:60px">?</span>
      <div class="abs" style="left:${f1(cx - colW / 2 + 8)}px;width:${f1(colW - 16)}px;top:${qy + QS + 46}px;text-align:center">
        <p style="font-size:38px;font-weight:700;line-height:1.1">${h(k.name)}</p>
        <p class="dek" style="font-size:30px;margin-top:8px"><b>${liftTxt(k.lift)}</b> the world rate</p>
        <p class="small" data-qa-small style="margin-top:8px">Closest: ${h(k.row.puzzle)} · ${h(k.row.brand)}</p></div>`);
  });
  const closing: Slide = { id: 'your-country', body: frame({
    kicker, idx: [total, total], art: qArt.join(''),
    body: `<h2 class="t h2" style="top:136px">Missing your country? Tell us its puzzle.</h2>
      <p class="t dek" style="top:${qy - 84}px;font-size:30px"><b>No clear signature yet</b>, under ${SIGNATURE_MIN_LIFT}× the world rate:</p>
      ${qHtml.join('')}
      <div class="rule" style="top:880px"></div>
      <p class="t dek" style="top:910px;font-size:30px"><b>How we picked them.</b> For every country with at least 80 puzzlers on MSP, we took each puzzle at least 15 of them have solved and compared that share with the share among all puzzlers worldwide. The biggest ratio is the signature puzzle. Fewer than 80 puzzlers? Then your country isn't on the map yet.</p>`,
    foot: src(c),
  }) };

  // The brainstorm's hook, used only while those picks still hold (fresh data can change them).
  const flavour = [['FI', 'Day in the Moominvalley', 'Finland has the Moomins.'], ['CH', 'Curious Swiss Cows', 'Switzerland has cows.']]
    .filter(([cc, pz]) => strong.some(k => k.cc === cc && k.box!.puzzle === pz)).map(f => f[2]);
  const hook = flavour.length === 2 ? `${flavour.join(' ')} ` : '';
  const top = [...strong].sort((a, b) => b.lift - a.lift)[0];
  const share = [...strong].sort((a, b) => b.pctLocal - a.pctLocal)[0];
  return {
    key: 'signature-puzzles',
    label: `Every country's signature puzzle: ${strong.length} countries on a jigsaw tile map (${total}-slide carousel)`,
    caption: `${hook}${strong.length} countries, ${strong.length} signature puzzles: the one each country solves far more often than the rest of the world.

The strongest is ${top.name}: ${top.pctLocal.toFixed(1)}% of puzzlers there have solved ${top.box!.puzzle === top.name ? `a puzzle called ${top.name}` : top.box!.puzzle} (${top.box!.brand}), ${Math.round(top.lift)} times the world rate. In ${share.name}, ${Math.round(share.pctLocal)}% have done ${share.box!.puzzle}.

${cap(andList(weak.map(k => withThe(k.name))))} ${weak.length === 1 ? 'has' : 'have'} no clear winner yet. Missing your country? Tell us its puzzle in the comments.

Box art by the brands named on each slide.

#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    slides: [cover, ...regionSlides, closing],
  };
}

// ---------------------------------------------------------------- 2 · Cats vs dogs (A1)
function catsDogs(c: Content): Post {
  const tc = THEMES.get('cats')!, td = THEMES.get('dogs')!;
  const sc = SPEED.get('cats')!, sd = SPEED.get('dogs')!;
  const cats = { results: num(tc.results), puzzles: num(tc.puzzles_in_catalogue), solved: num(tc.puzzles_solved), notes: num(NOTES.cat), median: num(sc.median_min), soloN: num(sc.solo_results) };
  const dogs = { results: num(td.results), puzzles: num(td.puzzles_in_catalogue), solved: num(td.puzzles_solved), notes: num(NOTES.dog), median: num(sd.median_min), soloN: num(sd.solo_results) };
  const champC = toBox(catTop[0])!, champD = toBox(dogTop[0])!;
  const ratio = cats.results / dogs.results;
  const ratioTxt = ratio < Math.round(ratio) ? `nearly ${Math.round(ratio)} to 1` : `${Math.round(ratio)} to 1`;
  const kicker = 'Puzzle atlas · Subjects';
  const N = 4;

  // --- 1 · versus poster
  const bw = 400, by = 330;
  const sC = fit(champC, bw, 300), sD = fit(champD, bw, 300);
  const vsP = (() => {
    // singlePiece paths live in the generator's 3 × 3 space: the body centre is (1.5, 1.5) × size.
    const sp = singlePiece(60, 23);
    const [, , vw, vh] = sp.viewBox.split(' ').map(Number);
    const k = 150 / Math.max(vw, vh);
    return `<g transform="translate(${f1(540 - 90 * k)} ${f1(by + 150 - 90 * k)}) scale(${f1(k)})"><path d="${sp.d}" transform="translate(${f1(7 / k)} ${f1(9 / k)})" fill="${SHADOW}"/><path d="${sp.d}" fill="${CORAL}"/></g>`;
  })();
  const ux = X0, uy = 948, cols = 20, rows = 5, uw = CW, uh = 175;
  const units = pieceGrid({ cols, rows, x: ux, y: uy, width: uw, height: uh, seed: 7, tabSize: 0.22 }).sort((a, b) => a.col - b.col || a.row - b.row);
  const catUnits = Math.round((cats.results / (cats.results + dogs.results)) * 100);
  const unitArt = units.map((p, i) => `<path d="${p.d}" fill="${i < catUnits ? CORAL : INDIGO}" stroke="${PAPER}" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
  const s1: Slide = { id: 'versus', body: frame({
    kicker, idx: [1, N],
    art: `${boxArt(champC, X0 + (bw - sC.w) / 2, by + (300 - sC.h) / 2, sC.w, sC.h, -3)}${boxArt(champD, X1 - bw + (bw - sD.w) / 2, by + (300 - sD.h) / 2, sD.w, sD.h, 3)}${vsP}${unitArt}`,
    body: `<h1 class="t title" style="top:128px">Cats outsolve dogs ${ratioTxt}</h1>
      <span class="vs" data-qa-bg="${CORAL}" style="left:540px;top:${by + 150}px">vs</span>
      <p class="abs small" data-qa-small style="left:${X0}px;top:${by + 324}px;width:${bw}px">${h(creditOf(champC))}</p>
      <p class="abs small" data-qa-small style="right:${W - X1}px;top:${by + 324}px;width:${bw}px;text-align:right">${h(creditOf(champD))}</p>
      <div class="team" style="left:${X0}px;top:${by + 404}px"><div class="k">Team cat</div><div class="v">${fmtInt(cats.results)}</div><div class="s">results logged</div></div>
      <div class="team r" style="right:${W - X1}px;top:${by + 404}px"><div class="k">Team dog</div><div class="v">${fmtInt(dogs.results)}</div><div class="s">results logged</div></div>
      <p class="t small" data-qa-small style="top:${uy + uh + 14}px">1 piece = 1% of the ${fmtInt(cats.results + dogs.results)} results on puzzles with a cat or a dog in the title</p>`,
    foot: swipe('Five rounds'),
  }) };

  // --- 2 · five rounds
  const rounds = [
    { lb: 'Results logged', c: cats.results, d: dogs.results, fmt: fmtInt, lower: false },
    { lb: 'Puzzles in the catalogue', c: cats.puzzles, d: dogs.puzzles, fmt: fmtInt, lower: false },
    { lb: 'Solvers of the most-solved one', c: num(catTop[0].solvers), d: num(dogTop[0].solvers), fmt: fmtInt, lower: false },
    { lb: 'Result notes that mention them', c: cats.notes, d: dogs.notes, fmt: fmtInt, lower: false },
    { lb: 'Median solo time, 500s', c: cats.median, d: dogs.median, fmt: (v: number) => `${v.toFixed(1)} min`, lower: true },
  ];
  const catWins = rounds.filter(r => (r.lower ? r.c < r.d : r.c > r.d)).length;
  const ry = 316, rp = 170, bh = 60;
  const rArt: string[] = [], rHtml: string[] = [];
  rounds.forEach((r, i) => {
    const y = ry + i * rp;
    const sb = splitBar(X0, y + 56, CW, bh, r.c / (r.c + r.d), 31 + i);
    rArt.push(`<path d="${sb.left}" fill="${CORAL}"/><path d="${sb.right}" fill="${INDIGO}"/><path d="${sb.left}" fill="none" stroke="${PAPER}" stroke-width="3"/>`);
    const catWon = r.lower ? r.c < r.d : r.c > r.d;
    const close = Math.abs(r.c - r.d) / Math.max(r.c, r.d) < 0.01;
    const win = `${catWon ? 'Cats' : 'Dogs'}${close ? `, by ${Math.abs(r.c - r.d).toFixed(1)} min` : ''}`;
    rHtml.push(`<div class="round" style="top:${y}px"><div class="hd2"><span class="lb">${h(r.lb)}${r.lower ? ' <i>(lower wins)</i>' : ''}</span>
        <span class="win" style="background:${catWon ? 'var(--coral-200)' : 'var(--indigo-100)'}">${h(win)}</span></div></div>
      <span class="bv" data-qa-bg="${CORAL}" style="left:${X0 + 18}px;top:${y + 56 + bh / 2}px">${h(r.fmt(r.c))}</span>
      <span class="bv" data-qa-bg="${INDIGO}" style="right:${W - X1 + 18}px;top:${y + 56 + bh / 2}px;color:#fff">${h(r.fmt(r.d))}</span>`);
  });
  const s2: Slide = { id: 'rounds', body: frame({
    kicker, idx: [2, N], art: rArt.join(''),
    body: `<h2 class="t h2" style="top:136px">Five rounds. Cats take ${catWins === 4 ? 'four' : catWins}.</h2>
      <div class="t" style="top:232px;display:flex;justify-content:space-between"><span class="dek" style="font-size:30px"><b style="color:${'var(--coral-700)'}">Cats</b> from the left</span><span class="dek" style="font-size:30px"><b style="color:var(--indigo-500)">Dogs</b> from the right</span></div>
      ${rHtml.join('')}`,
    foot: `<span class="src s" data-qa-small>Puzzles matched by title words (cat, kitten, dog, puppy…). ${h(c.source)}</span>`,
  }) };

  // --- 3 · the two shelves
  const shelf = (rowsIn: Row[], y: number, team: string, color: string) => {
    const items = rowsIn.slice(0, 4).map(r => ({ r, b: toBox(r)! })).filter(o => o.b);
    const slot = (CW - 3 * 28) / 4, artH = 150;
    const art: string[] = [], html: string[] = [];
    const ledge = y + 56 + artH;
    art.push(`<rect x="${X0 - 10}" y="${ledge}" width="${CW + 20}" height="10" fill="${NAVY}"/><rect x="${X0 - 10}" y="${ledge + 10}" width="${CW + 20}" height="8" fill="${MAT_LINE}"/>`);
    items.forEach(({ r, b }, i) => {
      const x = X0 + i * (slot + 28);
      const s = fit(b, slot, artH);
      art.push(boxArt(b, x + (slot - s.w) / 2, ledge - s.h, s.w, s.h));
      html.push(`<div class="abs shelf" data-qa-small style="left:${f1(x)}px;top:${ledge + 30}px;width:${f1(slot)}px">
        <p class="nm">${h(b.puzzle)}</p><p class="br">${h(b.brand)}</p><p class="n">${fmtInt(num(r.solvers))} <span>solvers</span></p></div>`);
    });
    html.push(`<p class="abs" style="left:${X0}px;top:${y}px;font-size:34px;font-weight:700;display:flex;align-items:center;gap:12px"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${color}"></span>${h(team)}</p>`);
    return { art: art.join(''), html: html.join('') };
  };
  const shC = shelf(catTop, 346, 'The most-solved cat puzzles', CORAL), shD = shelf(dogTop, 772, 'The most-solved dog puzzles', INDIGO);
  const perC = cats.results / cats.solved, perD = dogs.results / dogs.solved;
  const shelfBoxes = [...catTop.slice(0, 4), ...dogTop.slice(0, 4)].map(r => toBox(r)!).filter(Boolean);
  const s3: Slide = { id: 'shelves', body: frame({
    kicker, idx: [3, N], art: shC.art + shD.art,
    body: `<h2 class="t h2" style="top:136px;font-size:56px">More cat puzzles, and each one is solved more</h2>
      <p class="t dek" style="top:266px;font-size:30px">On average <b>${perC.toFixed(1)}</b> results per cat puzzle, <b>${perD.toFixed(1)}</b> per dog puzzle</p>
      ${shC.html}${shD.html}`,
    foot: src(c),
  }) };

  // --- 4 · on the clock: a tie
  const gy = 330, gh = 430;
  const two = generateJigsaw({ cols: 2, rows: 1, width: CW, height: gh, x: X0, y: gy, seed: 12, tabSize: 0.2 });
  const [pc, pd] = [...two.pieces].sort((a, b) => a.col - b.col);
  // Centre each number in the part of its piece that the other piece's tab doesn't reach.
  const catFree = Math.min(...pd.outline.map(q => q[0])), dogFree = Math.max(...pc.outline.map(q => q[0]));
  const catX = (X0 + catFree) / 2, dogX = (dogFree + X1) / 2;
  const s4: Slide = { id: 'clock', body: frame({
    kicker, idx: [4, N],
    art: `<path d="${pc.d}" transform="translate(8 10)" fill="${SHADOW}"/><path d="${pd.d}" transform="translate(8 10)" fill="${SHADOW}"/>
      <path d="${pc.d}" fill="${CORAL}"/><path d="${pd.d}" fill="${INDIGO}"/><path d="${pc.d}" fill="none" stroke="${PAPER}" stroke-width="6"/>`,
    body: `<h2 class="t h2" style="top:136px">On the clock, it's a tie.</h2>
      <div class="big" data-qa-bg="${CORAL}" style="left:${f1(catX)}px;top:${gy + gh / 2}px"><div class="k">Cats</div><div class="v">${cats.median.toFixed(1)}</div><div class="u">minutes</div></div>
      <div class="big" data-qa-bg="${INDIGO}" style="left:${f1(dogX)}px;top:${gy + gh / 2}px;color:#fff"><div class="k">Dogs</div><div class="v">${dogs.median.toFixed(1)}</div><div class="u">minutes</div></div>
      <p class="t dek" style="top:${gy + gh + 44}px">Median solo time on 500-piece puzzles, from <b>${fmtInt(cats.soloN)}</b> cat and <b>${fmtInt(dogs.soloN)}</b> dog results. ${(Math.abs(cats.median - dogs.median)).toFixed(1)} minutes apart.</p>
      <div class="rule" style="top:${gy + gh + 190}px"></div>
      <p class="t" style="top:${gy + gh + 236}px;font-size:64px;font-weight:700;line-height:1.1;letter-spacing:-0.018em">Team cat or team dog?</p>
      <p class="t dek" style="top:${gy + gh + 320}px">Tell us in the comments.</p>`,
    foot: src(c),
  }) };

  return {
    key: 'cats-vs-dogs',
    label: `Cats vs dogs: ${ratioTxt} on results, a tie on the clock (4-slide carousel)`,
    caption: `Cats outsolve dogs ${ratioTxt} on MySpeedPuzzling: ${fmtInt(cats.results)} results on puzzles with a cat in the title, ${fmtInt(dogs.results)} with a dog.

Part of it is supply (${fmtInt(cats.puzzles)} cat puzzles in the catalogue, ${fmtInt(dogs.puzzles)} dog puzzles), but each cat puzzle is also solved more: ${perC.toFixed(1)} results on average vs ${perD.toFixed(1)}. Cats even win the notes, mentioned in ${cats.notes} of them vs ${dogs.notes}.

On the clock it's a tie: the median solo 500 takes ${cats.median.toFixed(1)} minutes for cats and ${dogs.median.toFixed(1)} for dogs.

So which team are you on, cat or dog? Tell us in the comments.

Box art by ${brandList(shelfBoxes)}, from the most-solved cat and dog puzzles.

#speedpuzzling #jigsawpuzzle #catsvsdogs`,
    slides: [s1, s2, s3, s4],
  };
}

// ---------------------------------------------------------------- 3 · Subject tier list (A2)
const TIERS = [
  { key: 'S', band: '< 60 min', max: 60, fill: '#ff8f8a', qa: '#ff8f8a' },   // --coral-400 (navy 24 px passes)
  { key: 'A', band: '60–65 min', max: 65, fill: '#fea569', qa: '#fea569' },      // --brand-orange
  { key: 'B', band: '65–70 min', max: 70, fill: '#a8d9ff', qa: '#a8d9ff' },      // --sky-300
  { key: 'C', band: '70+ min', max: Infinity, fill: '#bcc8ff', qa: '#bcc8ff' },  // --indigo-200
];
type Subject = (typeof subjectRows)[number] & { box: Box };

function tierList(c: Content): Post {
  const subs: Subject[] = subjectRows.map(s => ({ ...s, box: toBox(s.rep)! })).filter(s => s.box);
  const tiers = TIERS.map((t, i) => ({ ...t, subs: subs.filter(s => s.median < t.max && (i === 0 || s.median >= TIERS[i - 1].max)) }));
  const slowest = subs[subs.length - 1], fastest = subs[0];
  const kicker = 'Puzzle atlas · Subjects';
  const N = 4;
  const cols = 6, PW = CW / cols, PH = 118;

  /** The board: one 1 × 6 jigsaw per tier, first piece the tier label, then one box-art piece per subject. */
  function board(o: { hide?: string; times: boolean; highlight?: string; top: number; gap?: number }) {
    const BY = o.top;
    const art: string[] = [], html: string[] = [];
    let held: { p: Piece; s: Subject } | null = null;
    let y = BY;
    tiers.forEach((t, ti) => {
      const twoLines = t.subs.some(s => s.name.length > 11);
      const jig = generateJigsaw({ cols, rows: 1, width: CW, height: PH, x: X0, y, seed: 41 + ti, tabSize: 0.22 });
      const ps = [...jig.pieces].sort((a, b) => a.col - b.col);
      ps.forEach((p, k) => {
        const s = k ? t.subs[k - 1] : undefined;
        const shown = k === 0 || (s && s.theme !== o.hide);
        if (s && s.theme === o.hide) held = { p, s };
        if (shown) art.push(`<path d="${p.d}" transform="translate(5 7)" fill="${SHADOW}"/>`);
        art.push(k === 0 ? `<path d="${p.d}" fill="${t.fill}"/>` : shown ? pieceArt(p, s!.box) : `<path d="${p.d}" fill="${MAT}"/>`);
      });
      ps.forEach(p => art.push(`<path d="${p.d}" fill="none" stroke="${PAPER}" stroke-width="5" stroke-linejoin="round"/>`));
      if (o.highlight) {
        const k = t.subs.findIndex(s => s.theme === o.highlight);
        if (k >= 0) art.push(`<path d="${ps[k + 1].d}" fill="none" stroke="${NAVY}" stroke-width="6" stroke-linejoin="round"/>`);
      }
      const cx = (k: number) => X0 + PW * (k + 0.5);
      html.push(`<span class="tl" data-qa-bg="${t.qa}" style="left:${f1(cx(0))}px;top:${y + PH / 2 - 12}px">${t.key}</span>
        <span class="band" data-qa-small data-qa-bg="${t.qa}" style="left:${f1(cx(0))}px;top:${y + PH - 36}px">${h(t.band)}</span>`);
      t.subs.forEach((s, k) => {
        if (s.theme === o.hide) return;
        html.push(`<div class="sub" data-qa-small style="left:${f1(cx(k + 1))}px;top:${y + PH + 10}px;width:${f1(PW - 8)}px">
          ${o.times ? `<p class="m">${Math.round(s.median)} <span>min</span></p>` : ''}<p class="nm">${h(s.name)}</p></div>`);
      });
      y += PH + 10 + (o.times ? 34 : 0) + (twoLines ? 54 : 27) + (o.gap ?? 30);
    });
    return { art: art.join(''), html: html.join(''), held: held as { p: Piece; s: Subject } | null };
  }

  const allBoxes = subs.map(s => s.box);
  const mainBrand = [...allBoxes.reduce((m, b) => m.set(b.brand, (m.get(b.brand) ?? 0) + 1), new Map<string, number>())].sort((x, y) => y[1] - x[1])[0][0];
  const boardCredit = `Box art: ${brandList(allBoxes)}; every box is named on slides 3 and 4`;

  // --- 1 · the question: the board with butterflies lifted off
  const q = board({ hide: slowest.theme, times: false, top: 360, gap: 52 });
  const s1: Slide = { id: 'question', body: frame({
    kicker, idx: [1, N],
    art: q.art + (q.held ? lifted(q.held.p, q.held.s.box, 840, 214, 11, 1.25) : ''),
    body: `<h1 class="t title" style="top:128px;width:640px">Where would you put ${h(slowest.name.toLowerCase())}?</h1>
      <p class="t dek" style="top:290px;width:660px;font-size:30px">${subs.length} subjects, ranked by solo time on 500s</p>
      ${q.html}`,
    foot: `<span class="src s" data-qa-small>${h(boardCredit)}</span>`,
  }) };

  // --- 2 · the answer: full board with times
  const a = board({ times: true, highlight: slowest.theme, top: 318 });
  const s2: Slide = { id: 'board', body: frame({
    kicker, idx: [2, N], art: a.art,
    body: `<h2 class="t h2" style="top:136px;font-size:56px">${h(slowest.name)} take ${Math.round(slowest.median)} minutes. ${h(fastest.name)} takes ${Math.round(fastest.median)}.</h2>
      ${a.html}`,
    foot: `<span class="src s" data-qa-small>${h(boardCredit)}</span>`,
  }) };

  // --- 3, 4 · details: every subject with its box, median bar from zero, sample sizes
  const detail = (tierKeys: string[], idx: number, title: string): Slide => {
    const ts = tiers.filter(t => tierKeys.includes(t.key));
    const list = ts.flatMap(t => t.subs.map(s => ({ s, t })));
    const top = 300, bottom = 1186, rh = Math.min(118, (bottom - top - 24 * (ts.length - 1)) / list.length);
    const BX = 160, BW = 112, barX = 660, barW = 220, maxMin = 100;
    const main = mainBrand;
    const art: string[] = [], html: string[] = [];
    let y = top, prev = '';
    const badge = singlePiece(60, 23);
    const [vx, vy, vw, vh] = badge.viewBox.split(' ').map(Number);
    list.forEach(({ s, t }) => {
      if (prev && prev !== t.key) y += 24;
      if (prev !== t.key) {
        const k = 64 / Math.max(vw, vh);
        const ox = X0 - 6, oy = y + (rh - 64) / 2;
        art.push(`<g transform="translate(${f1(ox - vx * k)} ${f1(oy - vy * k)}) scale(${f1(k)})"><path d="${badge.d}" fill="${t.fill}"/></g>`);
        html.push(`<span class="tl" data-qa-bg="${t.qa}" style="left:${f1(ox + 32)}px;top:${f1(oy + 32)}px;font-size:40px">${t.key}</span>`);
      }
      prev = t.key;
      const sz = fit(s.box, BW, rh - 22);
      art.push(boxArt(s.box, BX + (BW - sz.w) / 2, y + (rh - sz.h) / 2 - 4, sz.w, sz.h));
      const bw = (s.median / maxMin) * barW;
      art.push(`<rect x="${barX}" y="${f1(y + rh / 2 - 26)}" width="${f1(bw)}" height="26" fill="${t.fill}"/>
        <rect x="${barX}" y="${f1(y + rh / 2 - 26)}" width="${f1(barW)}" height="26" fill="none" stroke="${MAT_LINE}" stroke-width="2"/>`);
      html.push(`<div class="drow" style="top:${f1(y + rh / 2 - 34)}px">
          <p class="nm">${h(s.name)}</p><p class="cr" data-qa-small>${h(s.box.brand === main ? s.box.puzzle : `${s.box.puzzle} (${s.box.brand})`)}</p></div>
        <span class="dval" style="left:${f1(barX + barW + 14)}px;top:${f1(y + rh / 2 - 31)}px">${s.median.toFixed(1)}</span>
        <span class="dmeta" data-qa-small style="left:${barX}px;top:${f1(y + rh / 2 + 6)}px">${fmtInt(s.puzzles)} puzzles · ${fmtInt(s.results)} results</span>`);
      y += rh;
    });
    return { id: `tiers-${tierKeys.join('').toLowerCase()}`, body: frame({
      kicker, idx: [idx, N], art: art.join(''),
      body: `<h2 class="t h2" style="top:136px;font-size:56px">${h(title)}</h2>
        <p class="t small" data-qa-small style="top:226px">Median solo minutes on 500-piece puzzles, bars from 0 to ${maxMin}. Each subject's most-solved box; box art: ${h(main)} unless noted.</p>
        ${html.join('')}`,
      foot: src(c),
    }) };
  };
  const s3 = detail(['S', 'A'], 3, 'S and A: the quick ones');
  const s4 = detail(['B', 'C'], 4, 'B and C: settle in');

  return {
    key: 'subject-tier-list',
    label: `Subject tier list: ${subs.length} subjects by median solo-500 time (4-slide carousel)`,
    caption: `${slowest.name} take ${Math.round(slowest.median)} minutes. ${fastest.name} takes ${Math.round(fastest.median)}. We ranked ${subs.length} puzzle subjects by their median solo time on 500-piece puzzles.

S tier, under an hour: ${andList(tiers[0].subs.map(s => lc(s.name)))}. C tier, 70 minutes and up: ${andList(tiers[3].subs.map(s => lc(s.name)))}. Cats and dogs share B tier.

Subjects come from words in puzzle titles, so one big puzzle can pull a subject up or down. Slides 3 and 4 show how many puzzles and results sit behind each one.

Where would you move ${lc(slowest.name)}, and which subject slows you down the most?

Box art by ${brandList(allBoxes)}, one most-solved box per subject.

#speedpuzzling #jigsawpuzzle #puzzletime`,
    slides: [s1, s2, s3, s4],
  };
}

const direction: Direction = {
  id: 'G1',
  name: 'Themes Atlas',
  idea: 'Places and subjects charted like an atlas on warm map paper: countries as a jigsaw tile map carrying their signature boxes, cats vs dogs as a versus poster with split bars cut by a real jigsaw edge, subjects as box-art pieces on an S/A/B/C board.',
  css,
  posts: (c: Content) => [signatures(c), catsDogs(c), tierList(c)],
};
export default direction;
