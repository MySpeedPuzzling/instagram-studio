// MR1 runner: key frames of the "October, sorted by colour" Reel (owner 2026-11-01: visual first, animation is the
// point, text only where it can be read slowly), four concepts side by side so the owner can rate each frame before
// the HyperFrames builder is written. Every concept opens on the finished collage piece (owner: "the collage on the
// intro to catch attention"; house rule: frame 0 is the complete splash) and ends on it, so the Reel loops:
//   A The Shuffle       the piece bursts into 1000 tiles over the whole screen, colour waves sort them back;
//   B Powers of Ten     full screen on No. 1's box, the camera pulls back through 9, 81 … to the whole piece;
//   C 1000-piece puzzle the collage is cut into a jigsaw (generator pieces, one per puzzle), tipped out, solved
//                       edges first, the colours fill in, the last piece drops;
//   D Rainbow rain      the tiles fall column by column in colour order and build the piece from the bottom.
// Data: the October monthly report's cached queries (monthly-boxes, monthly-totals; no new production queries).
// Writes content/labs/MR1/ with a gallery (Works / Unsure / No-go + note per frame).
//
//   node lab/monthly-reel/run.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchBoxes } from '../../src/data/boxes.ts';
import { query } from '../../src/data/db.ts';
import { HOUSE, HOUSE_CSS, X0, activateVariant, f1, frame } from '../../src/design/house.ts';
import { escapeHtml as h, fmtInt, page } from '../../src/design/page.ts';
import { LOGO_CSS, logoExit } from '../../src/motion/logo.ts';
import { generateJigsaw } from '../../src/pieces/jigsaw.ts';
import { colourField, pieceCells, prepareTones, tileUrl, type Cell } from '../../src/posts/mosaic.ts';
import { metered } from '../../src/render/meter.ts';
import { FRAMES, createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'MR1';
const DIR = join(ROOT, 'content/labs', LAB);
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);
const RX = FRAMES.reel.safe.x1, RW = RX - X0, CX = X0 + RW / 2;
const FW = 1080, FH = 1920;

// ------------------------------------------------------------------ data (the published report's snapshot)

const boxesQ = query('monthly-boxes'), totalsQ = query('monthly-totals');
const results = Number(totalsQ.rows[0].results);
const month = new Date(totalsQ.rows[0].month_start + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
const imgs = await fetchBoxes(boxesQ.rows.map(r => r.image), 'puzzle_medium');
const boxes = boxesQ.rows.filter(r => imgs.has(r.image)).map(r => ({ puzzleId: r.puzzle_id, puzzle: r.puzzle, brand: r.brand, img: imgs.get(r.image)!, solvers: Number(r.solvers) }));
const tones = await prepareTones(boxes);
const top1 = boxes[0];
const top1Large = (await fetchBoxes([boxesQ.rows[0].image], 'puzzle_large')).get(boxesQ.rows[0].image)!;

const PITCH = 20;
const pc = pieceCells(boxes.length, PITCH, 4, 0.2);
const assign = colourField(pc.cells, boxes, tones);
const cols = Math.max(...pc.cells.map(c => c.col)) + 1, rows = Math.max(...pc.cells.map(c => c.row)) + 1;
const at = new Map(pc.cells.map(c => [`${c.col},${c.row}`, c]));
const home1 = [...assign.entries()].find(([, b]) => b.puzzleId === top1.puzzleId)![0];

// The piece on screen: inside the Reel's safe band, under the hook.
const PIECE = { top: 616, size: 560 };
const SC = PIECE.size / Math.max(pc.w, pc.h);
const PX = CX - (pc.w * SC) / 2, PY = PIECE.top;
const home = (c: Cell) => ({ x: PX + c.x * SC, y: PY + c.y * SC, s: PITCH * SC });
const colN = (c: Cell) => c.col / (cols - 1); // 0 = reds (left) … 1 = purples (right): the colour order

/** Deterministic 32-bit generator (mulberry32), so every frame of a concept scatters the same way. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = rng(20261101);
const scatter = new Map(pc.cells.map(c => [c, { x: rnd() * (FW - 40) + 4, y: 130 + rnd() * (FH - 300), r: (rnd() - 0.5) * 70, k: 1.6 + rnd() * 0.9 }]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - (1 - t) ** 3;

// ------------------------------------------------------------------ drawing

/** Tiles at home inside the piece's outline (only `keep` cells; the rest of the piece shows the ground). */
const pieceAtHome = (keep: (c: Cell) => boolean = () => true, ghost = false) => `
  ${ghost ? `<svg style="position:absolute; left:${f1(PX)}px; top:${f1(PY)}px; overflow:visible" width="${f1(pc.w * SC)}" height="${f1(pc.h * SC)}" aria-hidden="true">
    <path d="${pc.d}" transform="scale(${SC})" fill="rgba(255,255,255,0.04)" stroke="rgba(151,165,249,0.55)" stroke-width="${f1(3 / SC)}" stroke-dasharray="${f1(10 / SC)} ${f1(8 / SC)}"/></svg>` : ''}
  <div style="position:absolute; left:${f1(PX)}px; top:${f1(PY)}px; width:${f1(pc.w)}px; height:${f1(pc.h)}px; transform-origin:0 0; transform:scale(${SC}); clip-path:path('${pc.d}')">
    ${pc.cells.filter(keep).map(c => `<img class="mr-t" src="${tileUrl(assign.get(c)!)}" alt="" style="left:${c.x + 0.5}px; top:${c.y + 0.5}px; width:${PITCH - 1}px; height:${PITCH - 1}px">`).join('')}
  </div>`;
/** A free tile (outside the piece's clip): position, size, rotation. */
const freeTile = (c: Cell, x: number, y: number, s: number, r = 0, shadow = false) =>
  `<img class="mr-t${shadow ? ' sh' : ''}" src="${tileUrl(assign.get(c)!)}" alt="" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(s)}px; height:${f1(s)}px${r ? `; transform:rotate(${f1(r)}deg)` : ''}">`;
/** A tile `t` of the way from home (0) to its scattered spot (1). */
const flying = (c: Cell, t: number) => {
  const a = home(c), b = scatter.get(c)!;
  return freeTile(c, lerp(a.x, b.x, t), lerp(a.y, b.y, t), a.s * lerp(1, b.k, t), b.r * t, t > 0.05);
};

// The jigsaw for concept C: one generator piece per grid cell (the only allowed source of pieces).
const jig = generateJigsaw({ cols, rows, width: cols * PITCH, height: rows * PITCH, seed: 11, tabSize: 0.22, jitter: 0.04 });
const jp = new Map(jig.pieces.map(p => [`${p.col},${p.row}`, p]));
let clipN = 0;
/** A jigsaw piece carrying its tile, drawn in grid units and placed with a transform (home or scattered). */
const jigPiece = (c: Cell, transform: string, lifted = false) => {
  const p = jp.get(`${c.col},${c.row}`)!, id = `j${clipN++}`, pad = PITCH * 0.32;
  return `<g transform="${transform}"${lifted ? ' filter="url(#lift)"' : ''}><clipPath id="${id}"><path d="${p.d}"/></clipPath>
    <image href="${tileUrl(assign.get(c)!)}" x="${c.x - pad}" y="${c.y - pad}" width="${PITCH + 2 * pad}" height="${PITCH + 2 * pad}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <path d="${p.d}" fill="none" stroke="rgba(18,24,36,0.7)" stroke-width="0.9"/></g>`;
};
const jigHome = () => `translate(${f1(PX)} ${f1(PY)}) scale(${f1(SC)})`;
const jigScatter = (c: Cell, k = 2.6) => {
  const s = scatter.get(c)!, cx = c.x + PITCH / 2, cy = c.y + PITCH / 2;
  return `translate(${f1(s.x)} ${f1(s.y)}) rotate(${f1(s.r * 1.6)}) scale(${f1(SC * k)}) translate(${f1(-cx)} ${f1(-cy)})`;
};
const jigSvg = (inner: string) => `<svg style="position:absolute; left:0; top:0" width="${FW}" height="${FH}" aria-hidden="true">
  <defs><filter id="lift" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#06080e" flood-opacity="0.7"/></filter></defs>
  ${inner}</svg>`;
const edgeCell = (c: Cell) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !at.has(`${c.col + dx},${c.row + dy}`));

// ------------------------------------------------------------------ text (one short line at a time, held long)

const logo = logoExit({ cx: CX, cy: 310, width: 180 });
const credit = `<p class="h-abs mr-credit" style="top:1200px; width:${RW}px">${fmtInt(boxes.length)} most-solved of ${month} · box art: publishers</p>`;
const hook = `<p class="mr-c mr-site" style="top:396px">myspeedpuzzling.com</p>
  <p class="mr-c mr-hook" style="top:446px">${month} in<br><span class="hot">${fmtInt(boxes.length)}</span> puzzles</p>`;
const beat = (text: string, y = 330) => `<p class="mr-c mr-beat" style="top:${y}px"><span>${text}</span></p>`;
const resultsBeat = beat(`<span class="hot">${fmtInt(results)}</span> puzzles logged<br>in ${month}`, 300);

// ------------------------------------------------------------------ frames

type Concept = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
const F: Array<{ c: Concept; k: string; label: string; body: () => string }> = [
  { c: 'S', k: 'S1', label: 'Splash, frame 0 (every concept): logo, site, hook over the finished piece; the logo then flies out', body: () => `${logo.html}${hook}${pieceAtHome()}${credit}` },

  // A · The Shuffle
  { c: 'A', k: 'A2', label: 'Burst: the piece explodes outward (0.4 s)', body: () => pc.cells.map(c => flying(c, ease(0.38))).join('') },
  { c: 'A', k: 'A3', label: 'Chaos: 1000 tiles all over the screen; the one slow fact (held ~3 s)', body: () => `${pieceAtHome(() => false, true)}${pc.cells.map(c => flying(c, 1)).join('')}${resultsBeat}` },
  { c: 'A', k: 'A4', label: 'Colour wave: reds and oranges fly home first', body: () => {
    const w = 0.45, band = 0.12;
    return pieceAtHome(c => colN(c) < w - band, true) + pc.cells.filter(c => colN(c) >= w - band).map(c => flying(c, colN(c) < w ? ease((colN(c) - (w - band)) / band) : 1)).join('');
  } },
  { c: 'A', k: 'A5', label: 'The wave reaches the blues and purples', body: () => {
    const w = 0.9, band = 0.12;
    return pieceAtHome(c => colN(c) < w - band, true) + pc.cells.filter(c => colN(c) >= w - band).map(c => flying(c, colN(c) < w ? ease((colN(c) - (w - band)) / band) : 1)).join('');
  } },

  // B · Powers of Ten
  { c: 'B', k: 'B2', label: 'Full screen on No. 1 (after a fast punch-in from the splash)', body: () => {
    const t = tones.get(top1.img)!, w = Math.min(RW, 600 * (t.w / t.h_px)), hgt = w * (t.h_px / t.w);
    return `<div class="mr-mount" style="left:${f1(CX - w / 2)}px; top:${f1(560 + (600 - hgt) / 2)}px; width:${w}px; height:${f1(hgt)}px"><img src="${top1Large}" alt=""></div>
      ${beat(`No. 1 of ${month}`, 330)}
      <p class="h-abs mr-credit" style="top:1200px; width:${RW}px">${h(top1.puzzle)} · ${h(top1.brand)} · ${fmtInt(top1.solvers)} puzzlers</p>`;
  } },
  ...[{ k: 'B3', n: 3, label: 'Pull back: its 8 neighbours (sorted by colour)' }, { k: 'B4', n: 9, label: 'Further: 81 puzzles' }].map(({ k, n, label }) => ({ c: 'B' as Concept, k, label, body: () => {
    const size = Math.floor((RW - (n - 1) * 6) / n), gap = 6, half = Math.floor(n / 2), y0 = 560 + (680 - (n * size + (n - 1) * gap)) / 2;
    let out = '';
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const c = at.get(`${home1.col - half + i},${home1.row - half + j}`);
      if (!c) continue;
      const b = assign.get(c)!, t = tones.get(b.img)!, cr = t.crop!, z = size / cr.s;
      out += `<div style="position:absolute; left:${f1(X0 + i * (size + gap))}px; top:${f1(y0 + j * (size + gap))}px; width:${size}px; height:${size}px; overflow:hidden; border-radius:${n > 5 ? 2 : 4}px${c === home1 ? '; outline:5px solid var(--c-hot); outline-offset:3px; z-index:1' : ''}">
        <img src="${b.img}" alt="" style="position:absolute; left:${f1(-cr.x * z)}px; top:${f1(-cr.y * z)}px; width:${f1(t.w * z)}px; height:${f1(t.h_px * z)}px; max-width:none"></div>`;
    }
    return out;
  } })),
  { c: 'B', k: 'B5', label: 'Further still: the piece\'s shape appears; the one slow fact', body: () => {
    const z = 2.3, cx = home(home1).x + home(home1).s / 2, cy = home(home1).y + home(home1).s / 2;
    return `<div style="position:absolute; inset:0; transform-origin:${f1(cx)}px ${f1(cy)}px; transform:translate(${f1(CX - cx)}px, ${f1(1060 - cy)}px) scale(${z})">${pieceAtHome()}</div>${resultsBeat}`;
  } },

  // C · 1000-piece puzzle
  { c: 'C', k: 'C2', label: 'The collage turns into a 1000-piece jigsaw: the cut appears, a few pieces lift', body: () => {
    const lift = new Set([at.get(`${home1.col},${home1.row}`), at.get(`${home1.col + 6},${home1.row - 9}`), at.get(`${home1.col - 8},${home1.row + 7}`)].filter(Boolean));
    return jigSvg(pc.cells.filter(c => !lift.has(c)).map(c => jigPiece(c, jigHome())).join('') + [...lift].map(c => jigPiece(c!, `translate(${f1(PX - 6)} ${f1(PY - 16)}) scale(${f1(SC)}) rotate(-8 ${c!.x + 10} ${c!.y + 10})`, true)).join(''))
      + beat('A 1000-piece puzzle,<br>one piece per puzzle', 330);
  } },
  { c: 'C', k: 'C3', label: 'Tipped out of the box: pieces everywhere', body: () => `${pieceAtHome(() => false, true)}${jigSvg(pc.cells.map(c => jigPiece(c, jigScatter(c), true)).join(''))}` },
  { c: 'C', k: 'C4', label: 'Edges first (every puzzler\'s ritual)', body: () => `${pieceAtHome(() => false, true)}${jigSvg(pc.cells.filter(edgeCell).map(c => jigPiece(c, jigHome())).join('') + pc.cells.filter(c => !edgeCell(c)).map(c => jigPiece(c, jigScatter(c), true)).join(''))}` },
  { c: 'C', k: 'C5', label: 'The colours fill in, reds first; the one slow fact', body: () => `${pieceAtHome(() => false, true)}${jigSvg(pc.cells.filter(c => edgeCell(c) || colN(c) < 0.55).map(c => jigPiece(c, jigHome())).join('') + pc.cells.filter(c => !edgeCell(c) && colN(c) >= 0.55).map(c => jigPiece(c, jigScatter(c), true)).join(''))}${resultsBeat}` },
  { c: 'C', k: 'C6', label: 'The last piece: No. 1 hovers over its hole, then clicks in', body: () => {
    const z = 3.2, cx = home1.x + PITCH / 2, cy = home1.y + PITCH / 2, hx = PX + cx * SC, hy = PY + cy * SC;
    return jigSvg(pc.cells.filter(c => c !== home1).map(c => jigPiece(c, jigHome())).join('')
      + jigPiece(home1, `translate(${f1(hx + 30)} ${f1(hy - 120)}) rotate(-10) scale(${f1(SC * z)}) translate(${f1(-cx)} ${f1(-cy)})`, true))
      + beat(`The last piece: No. 1`, 330);
  } },

  // D · Rainbow rain
  ...[{ k: 'D2', p: 0.18, label: 'Tiles rain down column by column, reds first' }, { k: 'D3', p: 0.5, label: 'Halfway: the warm half stands; the one slow fact' },
    { k: 'D4', p: 0.85, label: 'Greens and blues land' }, { k: 'D5', p: 0.985, label: 'The last purple column lands with a bounce' }]
    .map(({ k, p, label }) => ({ c: 'D' as Concept, k, label, body: () => {
      const band = 0.1, landed = (c: Cell) => colN(c) < p - band;
      let falling = '';
      for (const c of pc.cells.filter(c => !landed(c) && colN(c) < p)) {
        const q = (p - colN(c)) / band; // 0 = column just started … 1 = column done
        const colCells = pc.cells.filter(o => o.col === c.col).sort((a, b) => b.row - a.row);
        const k2 = colCells.indexOf(c) / colCells.length; // 0 = bottom tile, lands first
        const a = home(c), drop = Math.max(0, (k2 - q) * 1500);
        if (a.y - drop > -30) falling += freeTile(c, a.x, a.y - drop, a.s, 0, drop > 0);
      }
      return `${pieceAtHome(landed, true)}${falling}${k === 'D3' ? resultsBeat : ''}`;
    } })),

  { c: 'E', k: 'E1', label: 'End (every concept): the finished piece and the question; loops to the splash', body: () => `${beat('Is the last puzzle<br>you solved in there?', 360)}${pieceAtHome()}${credit}` },
];

const CONCEPTS: Array<{ id: Concept; name: string; note: string }> = [
  { id: 'S', name: 'Shared: the splash', note: 'Frame 0 of every concept: the complete splash (logo, site, hook over the finished piece). Owner: the collage on the intro.' },
  { id: 'A', name: 'A · The Shuffle', note: 'The piece bursts into 1000 tiles across the whole screen; colour waves sort them back, reds first. ~18 s.' },
  { id: 'B', name: 'B · Powers of Ten', note: 'Punch in to No. 1 full screen, then one continuous pull-back: 9, 81, the piece. Calm and readable. ~16 s.' },
  { id: 'C', name: 'C · 1000-piece puzzle (Claude\'s pick)', note: 'The collage becomes a real jigsaw (generator pieces, one per puzzle): tipped out, edges first, colours fill in, the last piece drops. ~20 s.' },
  { id: 'D', name: 'D · Rainbow rain', note: 'Tiles fall column by column in colour order and build the piece from the bottom; each column lands on the beat. ~15 s.' },
  { id: 'E', name: 'Shared: the end', note: 'Last frame of every concept: the question over the finished piece; the next frame is the splash again (seamless loop).' },
];

const CSS = HOUSE_CSS + LOGO_CSS + `
.mr-t { position: absolute; display: block; }
.mr-t.sh { box-shadow: 0 6px 10px rgba(6, 8, 14, 0.55); border-radius: 2px; }
.mr-c { position: absolute; left: ${X0}px; width: ${RW}px; margin: 0; text-align: center; font-weight: 700; letter-spacing: -0.02em; color: var(--g-ink); }
.mr-site { font-size: 34px; letter-spacing: 0; }
.mr-hook { font-size: 72px; line-height: 1.05; }
.mr-beat { font-size: 64px; line-height: 1.12; z-index: 3; }
.mr-beat span { display: inline-block; padding: 18px 34px; border-radius: 18px; background: rgba(34, 42, 56, 0.94); box-shadow: 0 10px 40px rgba(6, 8, 14, 0.6); }
.mr-c .hot { color: var(--g-hot); }
.mr-credit { text-align: center; font-size: 30px; color: var(--g-soft); }
.mr-mount { position: absolute; box-sizing: border-box; padding: 12px; background: #ffffff; border-radius: 6px; box-shadow: 0 24px 40px -16px rgba(6, 8, 14, 0.8); }
.mr-mount img { display: block; width: 100%; height: 100%; object-fit: cover; }
.bare .hf > .h-head, .bare .hf > .h-src { display: none; }
`;

// ------------------------------------------------------------------ render + gallery

activateVariant(HOUSE);
const jobs = F.map(f => ({
  ...f, key: f.k,
  html: page(`<div class="bare">${frame({ ground: 'navy', kind: 'story', kicker: `${month} in ${fmtInt(boxes.length)} puzzles`, device: HOUSE.device, src: 'myspeedpuzzling.com', rows: { headTop: 296 }, masthead: true, body: f.body() })}</div>`, { frame: 'reel', css: CSS, title: `${LAB} ${f.k}` }),
}));
activateVariant(undefined);

const renderer = await createRenderer(DIR);
const out: Array<{ key: string; c: Concept; label: string; jpg: string; preview: string; errors: string[] }> = [];
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-keyframes`, posts: 1, slides: jobs.length, engine: 'playwright/chromium' }, async () => {
    for (const j of jobs) {
      const r = await renderer.render({ id: j.key, html: j.html, frame: 'reel' });
      out.push({ key: j.key, c: j.c, label: j.label, jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors });
      for (const e of r.qa.errors) console.log(`  ERROR ${j.key}: ${e}`);
    }
  });
} finally { await renderer.close(); }

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} ${month} sorted by colour Reel</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}h2{margin:34px 0 4px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}.tile{background:#fff;border-radius:10px;padding:10px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px;font-size:14px}.rate button{margin-right:5px;padding:3px 9px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · "${month}, sorted by colour" Reel: key frames, four concepts</h1></header>
<main><p>Owner 2026-11-01: visual first, animation is the point; at most one short text line on screen at a time, held long
enough to read twice. Key frames only: the motion between them comes in the builder (and a short low-res motion preview of
your top one or two, with your go-ahead). Rate each frame (codes like "C4" work in the chat). Every concept starts on S1 and
ends on E1. Data: the published October report's snapshot (${fmtInt(boxes.length)} most-solved puzzles, ${fmtInt(results)} results). Frames are
1080×1920; text stays in the Reel safe area (y 220–1250).</p>
<p>Claude's pick: <b>C · 1000-piece puzzle</b>: it says "puzzle" in every frame, the edges-first moment is something every puzzler knows, and the last piece is a natural payoff.</p>
${CONCEPTS.map(C => `<h2>${h(C.name)}</h2><p>${h(C.note)}</p><div class="grid">${out.filter(o => o.c === C.id).map(o => `<div class="tile"><a href="${o.jpg}" target="_blank"><img src="${o.preview}" alt="${o.key}"></a>
<p class="code"><b>${o.key}</b> ${h(o.label)}${o.errors.length ? ` <span style="color:#c33">${o.errors.length} QA errors</span>` : ''}</p>
<div class="rate" data-target="${o.key}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`).join('')}</div>`).join('')}
</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'keyframe',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${out.length} frames, ${out.reduce((s, o) => s + o.errors.length, 0)} QA errors → node tools/review.ts → /content/labs/${LAB}/`);
