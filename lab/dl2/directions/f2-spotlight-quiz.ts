// F2 · Puzzle of the week & quizzes ("The Puzzle Table").
// Warm table ground, box art shown as a real assembled puzzle: the generator's cut pattern is laid over every
// box image, pieces lift out with a hard offset shadow (no blur), and quizzes reveal a puzzle the way people
// solve one: a few loose pieces first, then the edges, then the finished picture. A coral generator piece is
// the family badge (week number, "?" or "vs"); coral is only ever a fill. Every box image carries its credit;
// on quiz slides the credit reads "Mystery puzzle · Brand" until the answer slide names it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw, type Jigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import { ROOT } from '../../../src/render/server.ts';
import type { Content } from '../content.ts';
import type { Direction, Post, Slide } from '../../dl1/types.ts';

const W = 1080, X0 = 88, CW = 904;
const TABLE = '#fbf7f3';      // --paper-warm, the table
const MAT = '#efe6db';        // empty puzzle mat / holes
const MAT_LINE = '#e0d3c4';   // guide cuts on the empty mat
const GAP = 'rgba(24,28,38,.30)';
const SHADOW = 'rgba(43,52,69,.16)';
const LIFT = 'rgba(43,52,69,.24)';
const CORAL = '#ec726f';
const f1 = (v: number) => v.toFixed(1);

// ---------------------------------------------------------------- data helpers
type Box = { img: string; puzzle: string; brand: string; pieces: number; credit: string };
const toSec = (t: string | null) => (t ?? '0').split(':').map(Number).reduce((s, v) => s * 60 + v, 0);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "5 Oct – 11 Oct 2026" → ISO week number and a compact "5–11 Oct 2026". */
function weekOf(range: string) {
  const m = range.match(/(\d+) (\w{3}) – (\d+) (\w{3}) (\d{4})/)!;
  const d = new Date(Date.UTC(Number(m[5]), MONTHS.indexOf(m[2]), Number(m[1])));
  const t = new Date(d); t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - jan4.getTime()) / 864e5 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return { week, short: m[2] === m[4] ? `${m[1]}–${m[3]} ${m[2]} ${m[5]}` : range };
}

/** Pixel size of a cached JPEG (SOF marker), so boards keep the box art's real aspect ratio. */
const sizes = new Map<string, { w: number; h: number }>();
function imgSize(url: string) {
  if (sizes.has(url)) return sizes.get(url)!;
  const b = readFileSync(join(ROOT, url));
  let i = 2, out = { w: 1, h: 1 };
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

// ---------------------------------------------------------------- the puzzle board
interface Board { img: string; x: number; y: number; w: number; h: number; jig: Jigsaw; uid: string; at: (c: number, r: number) => Piece }
function makeBoard(img: string, o: { x: number; y: number; w: number; cols: number; seed: number; uid: string; tab?: number }): Board {
  const s = imgSize(img);
  const hh = Math.round((o.w * s.h) / s.w);
  const rows = Math.max(2, Math.round((o.cols * hh) / o.w));
  const jig = generateJigsaw({ cols: o.cols, rows, width: o.w, height: hh, x: o.x, y: o.y, seed: o.seed, tabSize: o.tab ?? 0.2 });
  return { img, x: o.x, y: o.y, w: o.w, h: hh, jig, uid: o.uid, at: (c, r) => jig.pieces.find(p => p.col === c && p.row === r)! };
}
const image = (b: Board, extra = '') => `<image href="${b.img}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid slice" ${extra}/>`;
const centre = (p: Piece) => [p.bbox.x + p.bbox.width / 2, p.bbox.y + p.bbox.height / 2];
/** Body centre of a piece (grid cell centre, ignoring tabs). */
const cellCentre = (b: Board, p: Piece) => {
  const pw = b.w / b.jig.options.cols, ph = b.h / b.jig.options.rows;
  return [b.x + pw * (p.col + 0.5), b.y + ph * (p.row + 0.5)];
};

/** The finished puzzle lying on the table: art + cut pattern, optional holes (pieces taken out). */
function boardFull(b: Board, o: { holes?: Piece[]; holeFill?: string } = {}) {
  return `<rect x="${b.x + 10}" y="${b.y + 12}" width="${b.w}" height="${b.h}" fill="${SHADOW}"/>
    ${image(b)}
    ${(o.holes ?? []).map(p => `<path d="${p.d}" fill="${o.holeFill ?? MAT}"/>`).join('')}
    <path d="${b.jig.cuts}" fill="none" stroke="${GAP}" stroke-width="1.6"/>`;
}

/** A puzzle in progress: an empty mat with faint guide cuts, only the given pieces placed. */
function boardPartial(b: Board, shown: Piece[]) {
  const id = `${b.uid}-shown`;
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${MAT}"/>
    <path d="${b.jig.cuts}" fill="none" stroke="${MAT_LINE}" stroke-width="2"/>
    <clipPath id="${id}">${shown.map(p => `<path d="${p.d}"/>`).join('')}</clipPath>
    ${shown.map(p => `<path d="${p.d}" transform="translate(5 7)" fill="${SHADOW}"/>`).join('')}
    ${image(b, `clip-path="url(#${id})"`)}
    ${shown.map(p => `<path d="${p.d}" fill="none" stroke="${GAP}" stroke-width="1.6"/>`).join('')}`;
}

/** One piece lifted off the board: moved to (cx, cy), rotated, scaled, with a hard offset shadow. */
function loose(b: Board, p: Piece, cx: number, cy: number, rot: number, s: number, lift = 1) {
  const [pcx, pcy] = centre(p);
  const t = (dx: number, dy: number) => `translate(${f1(cx + dx)} ${f1(cy + dy)}) rotate(${rot}) scale(${s}) translate(${f1(-pcx)} ${f1(-pcy)})`;
  const id = `${b.uid}-p${p.col}-${p.row}`;
  return `<clipPath id="${id}"><path d="${p.d}"/></clipPath>
    <path d="${p.d}" transform="${t(9 * lift, 13 * lift)}" fill="${LIFT}"/>
    <g transform="${t(0, 0)}">${image(b, `clip-path="url(#${id})"`)}
      <path d="${p.d}" fill="none" stroke="rgba(24,28,38,.28)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g>`;
}
const edgePieces = (b: Board) => b.jig.pieces.filter(p => p.col === 0 || p.row === 0 || p.col === b.jig.options.cols - 1 || p.row === b.jig.options.rows - 1);

// ---------------------------------------------------------------- frame + badge
const BADGE = 112;
const badgePiece = (() => {
  const size = 60, sp = singlePiece(size, 23); // seed 23: tabs out on all four sides, so the body stays whole for the glyph
  const [vx, vy, vw, vh] = sp.viewBox.split(' ').map(Number);
  const k = BADGE / Math.max(vw, vh);
  // body centre (1.5 × size in the generator's 3 × 3 grid) mapped into the badge box
  const ox = (BADGE - vw * k) / 2, oy = (BADGE - vh * k) / 2;
  return { d: sp.d, viewBox: sp.viewBox, cx: ox + (1.5 * size - vx) * k, cy: oy + (1.5 * size - vy) * k };
})();
const badge = (glyph: string) => `<div class="badge"><svg width="${BADGE}" height="${BADGE}" viewBox="${badgePiece.viewBox}"><path d="${badgePiece.d}" fill="${CORAL}"/></svg>
  <span data-qa-bg="${CORAL}" style="left:${f1(badgePiece.cx)}px;top:${f1(badgePiece.cy)}px">${h(glyph)}</span></div>`;

const css = `
body { background: ${TABLE}; }
.frame { position: relative; width: ${W}px; height: 1350px; overflow: hidden; background: ${TABLE}; color: var(--ink); }
.frame.story { height: 1920px; }
.art { position: absolute; left: 0; top: 0; }
.mark { position: absolute; left: ${X0}px; width: ${CW}px; height: ${BADGE}px; display: flex; align-items: center; gap: 20px; }
.badge { position: relative; width: ${BADGE}px; height: ${BADGE}px; flex: none; margin-left: -10px; }
.badge svg { position: absolute; left: 0; top: 0; }
.badge span { position: absolute; transform: translate(-50%, -50%); font-size: 40px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; color: var(--ink); white-space: nowrap; }
.mk-k { font-size: 30px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; line-height: 1.2; }
.mk-s { font-size: 30px; color: var(--ink-soft); line-height: 1.25; margin-top: 4px; }
.idx { margin-left: auto; font-size: 30px; font-weight: 700; color: var(--ink); }
.idx i { font-style: normal; font-weight: 400; color: var(--ink-muted); }
.t { position: absolute; left: ${X0}px; width: ${CW}px; }
.title { font-size: 64px; font-weight: 700; line-height: 1.08; letter-spacing: -0.015em; text-wrap: balance; }
.huge { font-size: 112px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; }
.name { font-size: 96px; font-weight: 700; line-height: 1.02; letter-spacing: -0.025em; text-wrap: balance; }
.sub { font-size: 40px; line-height: 1.25; color: var(--ink-soft); text-wrap: pretty; }
.sub b { color: var(--ink); font-weight: 700; }
.credit { font-size: 30px; line-height: 1.25; color: var(--ink-muted); }
.credit b { font-weight: 600; color: var(--ink-soft); }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1214px; height: 72px; display: flex; align-items: center; justify-content: space-between; border-top: 2px solid ${MAT_LINE}; padding-top: 14px; }
.story .foot { top: 1466px; }
.src { font-size: 30px; color: var(--ink-muted); }
.swipe { font-size: 30px; font-weight: 700; color: var(--ink); }
.logo { width: 64px; height: 57px; }
.stat { position: absolute; }
.stat .v { font-size: 104px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; }
.stat .k { font-size: 32px; line-height: 1.2; color: var(--ink); margin-top: 12px; max-width: 300px; }
.stat.r { text-align: right; }
.stat.r .k { margin-left: auto; }
.row { position: absolute; left: 430px; width: 562px; }
.row .rk { font-size: 30px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-soft); }
.row .nm { font-size: 48px; font-weight: 700; line-height: 1.08; margin-top: 6px; text-wrap: balance; }
.row .br { font-size: 30px; color: var(--ink-muted); margin-top: 6px; }
.row .n { font-size: 34px; margin-top: 14px; color: var(--ink-soft); }
.row .n b { color: var(--ink); font-weight: 700; }
.you { position: absolute; transform: translate(-50%, -50%); font-size: 40px; font-weight: 800; color: var(--ink); }
.lab { position: absolute; }
.lab .s { font-size: 30px; color: var(--ink-muted); line-height: 1.25; }
.lab .n { font-size: 48px; font-weight: 700; line-height: 1.1; }
.kv { display: flex; gap: 56px; }
.kv .v { font-size: 64px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; white-space: nowrap; }
.kv .k { font-size: 30px; color: var(--ink-soft); line-height: 1.25; margin-top: 6px; }
.race { position: absolute; left: 368px; width: 624px; }
.race .hd { display: flex; align-items: baseline; justify-content: space-between; }
.race .nm { font-size: 44px; font-weight: 700; }
.race .tm { font-size: 72px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
.race.meta { font-size: 30px; color: var(--ink-muted); }
.fam { position: absolute; width: 270px; }
.fam .nm { font-size: 34px; font-weight: 700; line-height: 1.15; }
.fam .nm i { font-style: normal; color: var(--ink-muted); font-weight: 500; margin-right: 10px; }
.fam .tm { font-size: 44px; font-weight: 700; margin-top: 4px; display: inline-block; padding: 2px 0; }
.fam .tm.hot { background: linear-gradient(transparent 62%, var(--coral-200) 62%); }
`;

interface FrameOpts { badge: string; kicker: string; sub: string; idx?: [number, number]; art?: string; body: string; foot?: string; story?: boolean }
function frame(o: FrameOpts): string {
  const H = o.story ? 1920 : 1350;
  const top = o.story ? 280 : 64;
  return `<div class="frame${o.story ? ' story' : ''}">
  ${o.art ? `<svg class="art" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${o.art}</svg>` : ''}
  <header class="mark" style="top:${top}px">${badge(o.badge)}<div><div class="mk-k">${h(o.kicker)}</div><div class="mk-s">${h(o.sub)}</div></div>
    ${o.idx ? `<span class="idx">${o.idx[0]}<i> / ${o.idx[1]}</i></span>` : ''}</header>
  ${o.body}
  ${o.foot === '' ? '' : `<footer class="foot">${o.foot ?? ''}<img class="logo" src="${LOGO_URL}" alt=""></footer>`}
</div>`;
}
const src = (c: Content) => `<span class="src">${h(c.source)}</span>`;
const swipe = (t: string) => `<span class="swipe">${h(t)} →</span>`;
const credit = (b: Box, top: number, extra = '') => `<p class="t credit" style="top:${top}px${extra}">${h(b.credit)}</p>`;
const byline = (b: Box, top: number) => `<p class="t credit" style="top:${top}px"><b>${h(b.brand)}</b> · ${b.pieces} pieces</p>`;
const mystery = (b: Box, top: number) => `<p class="t credit" style="top:${top}px">Mystery puzzle · ${h(b.brand)}</p>`;

// ---------------------------------------------------------------- 1 · Puzzle of the week
function potw(c: Content): Post {
  const p = c.puzzleOfTheWeek;
  const wk = weekOf(c.weekRange);
  const head = (i: number) => ({ badge: String(wk.week), kicker: 'Puzzle of the week', sub: `Week ${wk.week} · ${wk.short}`, idx: [i, 4] as [number, number] });

  // 1 · cover: the finished puzzle with the "piece of the week" lifted out
  const b1 = makeBoard(p.img, { x: X0, y: 212, w: CW, cols: 8, seed: 12, uid: 'potw1' });
  const pick = b1.at(2, 1);
  const [pcx, pcy] = cellCentre(b1, pick);
  const cover: Slide = { id: 'cover', body: frame({
    ...head(1),
    art: `${boardFull(b1, { holes: [pick] })}${loose(b1, pick, pcx + 70, pcy - 92, 11, 1.18, 1.6)}`,
    body: `<h1 class="t name" style="top:${b1.y + b1.h + 44}px">${h(p.puzzle)}</h1>
      <p class="t credit" style="top:${b1.y + b1.h + 160}px"><b>${h(p.brand)}</b> · ${p.pieces} pieces</p>
      <p class="t sub" style="top:${b1.y + b1.h + 222}px">The most-solved puzzle on MSP last week: <b>${fmtInt(p.solversWeek)} puzzlers</b> in seven days.</p>`,
    foot: swipe('The numbers'),
  }) };

  // 2 · numbers: four interlocking pieces, the first one cut from the box art
  const gy = 410, gh = 720;
  const g = generateJigsaw({ cols: 2, rows: 2, width: CW, height: gh, x: X0, y: gy, seed: 21, tabSize: 0.15 });
  const [art, ...tiles] = [...g.pieces].sort((a, b) => a.row - b.row || a.col - b.col);
  const fills = ['#ffffff', 'var(--coral-200)', 'var(--coral-100)'];
  const qa = ['#ffffff', '#ffcdc9', '#ffe6e3'];
  const stats = [
    { v: p.medianSolo ?? '–', k: 'median solo time' },
    { v: p.fastestSolo ?? '–', k: 'fastest solo time' },
    { v: p.firstAttemptPct == null ? '–' : `${p.firstAttemptPct}%`, k: 'first-attempt solves' },
  ];
  const pad = 46;
  const statHtml = stats.map((st, j) => {
    const i = j + 1, col = i % 2, row = Math.floor(i / 2);
    const pos = [
      col === 0 ? `left:${X0 + pad}px` : `right:${W - (X0 + CW) + pad}px`,
      row === 0 ? `top:${gy + pad}px` : `bottom:${1350 - (gy + gh) + pad}px`,
    ].join(';');
    return `<div class="stat${col ? ' r' : ''}" style="${pos}" data-qa-bg="${qa[j]}"><div class="v">${h(st.v)}</div><div class="k">${h(st.k)}</div></div>`;
  }).join('');
  const numbers: Slide = { id: 'numbers', body: frame({
    ...head(2),
    art: `<rect x="${X0 + 10}" y="${gy + 12}" width="${CW}" height="${gh}" fill="${SHADOW}"/>
      ${tiles.map((q, i) => `<path d="${q.d}" fill="${fills[i]}"/>`).join('')}
      <clipPath id="nb-art"><path d="${art.d}"/></clipPath>
      <image href="${p.img}" x="${X0}" y="${gy}" width="${CW}" height="${gh}" preserveAspectRatio="xMidYMid slice" clip-path="url(#nb-art)"/>
      ${g.pieces.map(q => `<path d="${q.d}" fill="none" stroke="${TABLE}" stroke-width="8"/>`).join('')}`,
    body: `<h2 class="t title" style="top:216px">${fmtInt(p.solversWeek)} of its ${fmtInt(p.solversAll)} solvers on MSP did it last week.</h2>${statHtml}
      ${credit(p, gy + gh + 22)}`,
    foot: src(c),
  }) };

  // 3 · runners-up
  const ups = c.weekTop.slice(1, 4);
  const rowY = [372, 640, 908];
  const upArt: string[] = [];
  const upHtml = ups.map((u, i) => {
    const s = imgSize(u.img);
    const bw = Math.round(Math.min(300, (210 * s.w) / s.h)), bh = (bw * s.h) / s.w;
    const top = Math.round(rowY[i] + (210 - bh) / 2);
    upArt.push(boardFull(makeBoard(u.img, { x: X0 + Math.round((300 - bw) / 2), y: top, w: bw, cols: bw < 250 ? 3 : 5, seed: 30 + i, uid: `up${i}` })));
    return `<div class="row" style="top:${rowY[i] - 4}px"><div class="rk">No. ${i + 2}</div><div class="nm">${h(u.puzzle)}</div>
      <div class="br">${h(u.brand)} · ${u.pieces} pieces</div><div class="n"><b>${fmtInt(u.solversWeek)}</b> puzzlers last week</div></div>`;
  }).join('');
  const runners: Slide = { id: 'runners-up', body: frame({
    ...head(3), art: upArt.join(''),
    body: `<h2 class="t title" style="top:216px">Also busy on the tables</h2>${upHtml}`,
    foot: src(c),
  }) };

  // 4 · your turn: the same puzzle with one coral slot
  const b4 = makeBoard(p.img, { x: X0, y: 372, w: CW, cols: 8, seed: 12, uid: 'potw4' });
  const slot = b4.at(5, 1);
  const [sx, sy] = cellCentre(b4, slot);
  const turn: Slide = { id: 'your-turn', body: frame({
    ...head(4),
    art: boardFull(b4, { holes: [slot], holeFill: CORAL }),
    body: `<h2 class="t huge" style="top:226px">Your turn.</h2>
      <span class="you" data-qa-bg="${CORAL}" style="left:${f1(sx)}px;top:${f1(sy)}px">you</span>
      ${credit(p, b4.y + b4.h + 22)}
      <p class="t sub" style="top:${b4.y + b4.h + 84}px">The median solo time is <b>${h(p.medianSolo ?? '–')}</b>. Where does yours land?</p>`,
    foot: `<span class="src">Log it on myspeedpuzzling.com</span>`,
  }) };

  return {
    key: 'potw',
    label: `Puzzle of the week: ${p.puzzle} (4-slide carousel)`,
    caption: `${fmtInt(p.solversWeek)} puzzlers solved ${p.puzzle} last week, more than any other puzzle on MSP. That makes it our Puzzle of the Week.

It's a ${p.pieces} from ${p.brand}, and ${fmtInt(p.solversWeek)} of its ${fmtInt(p.solversAll)} solvers on MSP did it in the last seven days. Median solo time ${p.medianSolo}, fastest solo ${p.fastestSolo}, and ${p.firstAttemptPct}% of the solves were first attempts.

What's your time on it, and was it a first attempt?

Box art: ${p.puzzle} by ${p.brand}

#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [cover, numbers, runners, turn],
  };
}

// ---------------------------------------------------------------- 2 · Guess the puzzle (feed)
const GUESS_PIECES: Array<[number, number]> = [[0, 3], [1, 2], [5, 5], [7, 4]];
function guess(c: Content): Post {
  const a = c.allTime[0];
  const most = c.allTime.every(o => o.solvers <= a.solvers);
  const head = (sub: string, i: number) => ({ badge: '?', kicker: 'Guess the puzzle', sub, idx: [i, 3] as [number, number] });

  // 1 · four loose pieces
  const b = makeBoard(a.img, { x: X0, y: 380, w: CW, cols: 8, seed: 8, uid: 'g1' });
  const spots: Array<[number, number, number]> = [[300, 560, -13], [760, 600, 9], [330, 905, 6], [745, 930, -10]];
  const pieces = GUESS_PIECES.map(([cc, r], i) => loose(b, b.at(cc, r), spots[i][0], spots[i][1], spots[i][2], 1.75)).join('');
  const s1: Slide = { id: 'clue-1', body: frame({
    ...head('Clue 1 of 2', 1), art: pieces,
    body: `<h2 class="t title" style="top:216px">Four pieces, one famous 500. Can you name the puzzle?</h2>${mystery(a, 1124)}`,
    foot: swipe('Clue 2'),
  }) };

  // 2 · edges done
  const b2 = makeBoard(a.img, { x: X0, y: 372, w: CW, cols: 8, seed: 8, uid: 'g2' });
  const s2: Slide = { id: 'clue-2', body: frame({
    ...head('Clue 2 of 2', 2), art: boardPartial(b2, edgePieces(b2)),
    body: `<h2 class="t title" style="top:216px">Edges first, obviously. Got it now?</h2>
      ${mystery(a, b2.y + b2.h + 22)}
      <p class="t sub" style="top:${b2.y + b2.h + 82}px">Clue: <b>${fmtInt(a.solvers)} puzzlers</b> have solved it on MSP.</p>`,
    foot: swipe('The answer'),
  }) };

  // 3 · the answer
  const b3 = makeBoard(a.img, { x: X0, y: 212, w: CW, cols: 8, seed: 8, uid: 'g3' });
  const s3: Slide = { id: 'answer', body: frame({
    ...head('The answer', 3), art: boardFull(b3),
    body: `<h2 class="t name" style="top:${b3.y + b3.h + 40}px">${h(a.puzzle)}</h2>
      ${byline(a, b3.y + b3.h + 152)}
      <div class="t kv" style="top:${b3.y + b3.h + 222}px">
        <div><div class="v">${fmtInt(a.solvers)}</div><div class="k">solvers${most ? ', the most on MSP' : ' on MSP'}</div></div>
        <div><div class="v">${h(a.medianSolo ?? '–')}</div><div class="k">median solo time</div></div></div>`,
    foot: src(c),
  }) };

  return {
    key: 'guess',
    label: 'Guess the puzzle: loose pieces → edges → answer (3-slide carousel)',
    caption: `Four pieces from one of the most-solved puzzles on MSP. Can you name it before the last slide?

Clue 2 is the edges, because that's how most of us start. The answer has ${fmtInt(a.solvers)} solvers on MSP behind it.

How many slides did you need? And if you've done this one, what's your time on it?

Box art: ${a.brand} (the puzzle's name is on the last slide)

#speedpuzzling #jigsawpuzzle`,
    slides: [s1, s2, s3],
  };
}

// ---------------------------------------------------------------- 3 · Which one is faster?
function faster(c: Content): Post {
  const fam = c.allTime.filter(o => /^Circle of Colors/.test(o.puzzle) && o.medianSolo).sort((x, y) => toSec(x.medianSolo) - toSec(y.medianSolo));
  const fast = fam[0], slow = fam[fam.length - 1];
  const series = fast.puzzle.split(':')[0];
  const short = (o: Box) => o.puzzle.replace(/^[^:]+:\s*/, '');
  const diff = toSec(slow.medianSolo) - toSec(fast.medianSolo);
  const head = (i: number, n = 3) => ({ badge: 'vs', kicker: 'Which is faster?', sub: 'Median solo time on MSP', idx: [i, n] as [number, number] });
  const circle = (o: Box, cx: number, cy: number, r: number, id: string) => `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <circle cx="${cx + 8}" cy="${cy + 11}" r="${r}" fill="${SHADOW}"/>
    <image href="${o.img}" x="${cx - r * 1.02}" y="${cy - r * 1.02}" width="${r * 2.04}" height="${r * 2.04}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;

  // 1 · the question (slow one on the left, so position gives nothing away)
  const pair = [slow, fast];
  const r1 = 220, cy1 = 400 + r1;
  const s1: Slide = { id: 'question', body: frame({
    ...head(1),
    art: pair.map((o, i) => circle(o, X0 + r1 + i * (CW - 2 * r1), cy1, r1, `q${i}`)).join(''),
    body: `<h2 class="t title" style="top:216px">Two round ${fast.pieces}s. Which one do puzzlers finish faster?</h2>
      ${pair.map((o, i) => `<div class="lab" style="top:${cy1 + r1 + 40}px;${i ? `right:${X0}px;text-align:right` : `left:${X0}px`};width:420px">
        <div class="s">${h(series)}:</div><div class="n">${h(short(o))}</div><div class="s">${h(o.brand)} · ${o.pieces} pieces</div></div>`).join('')}`,
    foot: swipe('Swipe for the answer'),
  }) };

  // 2 · the answer
  const r2 = 130, rowY = [400, 720];
  const order = [fast, slow];
  const barMax = 624;
  const s2: Slide = { id: 'answer', body: frame({
    ...head(2),
    art: order.map((o, i) => {
      const cy = rowY[i] + r2;
      const w = (toSec(o.medianSolo) / toSec(slow.medianSolo)) * barMax;
      return `${circle(o, X0 + r2, cy, r2, `a${i}`)}
        <rect x="368" y="${cy + 42}" width="${barMax}" height="44" fill="${MAT}"/>
        <rect x="368" y="${cy + 42}" width="${f1(w)}" height="44" fill="${i === 0 ? CORAL : '#b9c0cc'}"/>`;
    }).join(''),
    body: `<h2 class="t title" style="top:216px">${h(short(fast))}, by ${Math.round(diff / 60)} minutes.</h2>
      <p class="t sub" style="top:300px">Median solo time on MSP, ${fast.pieces} pieces each.</p>
      ${order.map((o, i) => `<div class="race" style="top:${rowY[i] + r2 - 92}px"><div class="hd"><span class="nm">${h(short(o))}</span><span class="tm">${h(o.medianSolo!)}</span></div></div>
        <p class="race meta" style="top:${rowY[i] + r2 + 96}px">${fmtInt(o.solvers)} solvers</p>`).join('')}
      <p class="t credit" style="top:1010px">${h(series)}: ${h(short(fast))} and ${h(short(slow))} · ${h(fast.brand)}</p>
      <p class="t sub" style="top:1068px">The fastest and the slowest of the ${fam.length} ${h(series)} in MSP's ${c.allTime.length} most-solved puzzles.</p>`,
    foot: src(c),
  }) };

  // 3 · every puzzle of the series in the all-time top list, fastest to slowest
  const r3 = 120, colX = [X0, X0 + 317, X0 + 634], rowY3 = [430, 820];
  const s3: Slide = { id: 'family', body: frame({
    ...head(3),
    art: fam.slice(0, 6).map((o, i) => circle(o, colX[i % 3] + r3, rowY3[Math.floor(i / 3)] + r3, r3, `f${i}`)).join(''),
    body: `<h2 class="t title" style="top:216px">All ${fam.length} ${h(series)} in MSP's top ${c.allTime.length}, fastest to slowest</h2>
      <p class="t credit" style="top:362px">${h(series)} · ${h(fast.brand)} · ${fast.pieces} pieces each</p>
      ${fam.slice(0, 6).map((o, i) => `<div class="fam" style="left:${colX[i % 3]}px;top:${rowY3[Math.floor(i / 3)] + 2 * r3 + 22}px">
        <div class="nm"><i>${i + 1}</i>${h(short(o))}</div><div class="tm${i === 0 ? ' hot' : ''}"${i === 0 ? ' data-qa-bg="#fbf7f3"' : ''}>${h(o.medianSolo!)}</div></div>`).join('')}`,
    foot: src(c),
  }) };

  return {
    key: 'faster',
    label: `Which is faster? ${short(slow)} vs ${short(fast)} (3-slide carousel)`,
    caption: `Two round ${fast.pieces}s from the same ${fast.brand} series, and one of them takes puzzlers ${Math.round(diff / 60)} minutes longer.

Swipe for the median solo times on MSP, then all ${fam.length} ${series} puzzles from MSP's ${c.allTime.length} most-solved, ranked from fastest to slowest.

Have you done either of them? Which one felt slower to you?

Box art: ${series} by ${fast.brand}

#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
    slides: [s1, s2, s3],
  };
}

// ---------------------------------------------------------------- 4 · Story quiz (9:16)
const STORY_PIECES: Array<[number, number]> = [[0, 2], [7, 1], [0, 5]];
const STICKER = { y0: 1080, y1: 1500 };
function storyQuiz(c: Content): Post {
  const a = c.allTime[1];
  const alts = c.allTime.filter(o => /Postcard/.test(o.puzzle) && o.puzzle !== a.puzzle).slice(0, 2);
  const safe = { x0: 65, y0: 270, x1: 1015, y1: 1540 };
  const b = makeBoard(a.img, { x: X0, y: 600, w: CW, cols: 8, seed: 14, uid: 's1' });
  const spots: Array<[number, number, number]> = [[225, 800, -9], [540, 770, 7], [856, 805, -6]];
  const q: Slide = { id: 'question', frame: 'story', safe, body: frame({
    story: true, badge: '?', kicker: 'Guess the puzzle', sub: 'Story quiz',
    // the plate marks where Instagram's quiz sticker goes; it stays empty in the export
    art: `<rect x="${X0}" y="${STICKER.y0}" width="${CW}" height="${STICKER.y1 - STICKER.y0}" rx="28" fill="${MAT}"/>
      ${STORY_PIECES.map(([cc, r], i) => loose(b, b.at(cc, r), spots[i][0], spots[i][1], spots[i][2], 1.9)).join('')}`,
    body: `<h2 class="t title" style="top:420px;font-size:72px">Three pieces. Which postcard are they from?</h2>
      ${mystery(a, 1000)}`,
    foot: '',
  }) };

  const b2 = makeBoard(a.img, { x: X0, y: 430, w: CW, cols: 8, seed: 14, uid: 's2' });
  const ans: Slide = { id: 'answer', frame: 'story', safe, body: frame({
    story: true, badge: '?', kicker: 'Guess the puzzle', sub: 'The answer',
    art: boardFull(b2),
    body: `<h2 class="t name" style="top:${b2.y + b2.h + 44}px">${h(a.puzzle)}</h2>
      ${byline(a, b2.y + b2.h + 156)}
      <div class="t kv" style="top:${b2.y + b2.h + 226}px">
        <div><div class="v">${fmtInt(a.solvers)}</div><div class="k">solvers on MSP</div></div>
        <div><div class="v">${h(a.medianSolo ?? '–')}</div><div class="k">median solo time</div></div></div>
      <p class="t sub" style="top:${b2.y + b2.h + 372}px"><b>Did you get it from three pieces?</b></p>`,
    foot: '',
  }) };

  return {
    key: 'story-quiz',
    label: `Story quiz: three pieces → ${a.puzzle} (2 Story frames, quiz sticker zone y ${STICKER.y0}–${STICKER.y1} on frame 1)`,
    caption: `Story frames, no caption or hashtags. Frame 1: add Instagram's quiz sticker in the blank zone under the pieces with the options ${a.puzzle} (correct), ${alts.map(o => o.puzzle).join(', ')}. Frame 2 reveals it.`,
    slides: [q, ans],
  };
}

const direction: Direction = {
  id: 'F2',
  name: 'Puzzle of the week & quizzes',
  idea: 'The Puzzle Table: box art as a real assembled puzzle (generator cuts), pieces lifted out with hard shadows, quizzes revealed the way people solve: loose pieces, then edges, then the picture. A coral piece badge marks the series.',
  css,
  posts: (c: Content) => [potw(c), guess(c), faster(c), storyQuiz(c)],
};
export default direction;
