// D3 · Piece Units (Isotype meets jigsaw).
// Every chart is a partly assembled puzzle: units are pieces cut from one tessellating generator grid,
// each piece has a fixed value stated in a key, placed pieces are filled (navy outline), open slots are
// pale outlines, and the total is always printed as a number. White ground, one coral highlight.
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, flagUrl, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../types.ts';

const W = 1080, H = 1350, X0 = 88, CW = 904;
const HOUR = 60; // minutes: the wall every chart refers to (a unit of time, not data)
const HOUR_LABEL = `${HOUR}:00`;
const signed = (v: number) => (v < 0 ? '\u2212' : '+') + Math.abs(v);

// ---------------------------------------------------------------- pieces

/** One jigsaw as a lookup by (col, row); all pieces interlock by construction. */
function puzzle(cols: number, rows: number, size: number, seed: number, tabSize = 0.2) {
  const jig = generateJigsaw({ cols, rows, width: cols * size, height: rows * size, seed, tabSize });
  const map = new Map(jig.pieces.map(p => [`${p.col},${p.row}`, p]));
  return { cols, rows, size, width: cols * size, height: rows * size, at: (c: number, r: number) => map.get(`${c},${r}`)!, pieces: jig.pieces };
}

type Mark = 'empty' | 'unit' | 'hl' | 'dark' | 'mid';
/** Draws pieces with a state each; open slots first so placed outlines always sit on top. */
function drawPieces(items: Array<{ piece: Piece; mark: Mark }>) {
  const order: Mark[] = ['empty', 'unit', 'mid', 'dark', 'hl'];
  return order.flatMap(m => items.filter(i => i.mark === m).map(i => `<path class="p-${m}" d="${i.piece.d}"/>`)).join('');
}

const keyPiece = singlePiece(44, 4);
const keySwatch = (cls: Mark = 'hl') => `<svg class="sw" viewBox="${keyPiece.viewBox}"><path class="p-${cls}" d="${keyPiece.d}"/></svg>`;

// ---------------------------------------------------------------- theme

const css = `
.frame { position: relative; width: ${W}px; height: ${H}px; padding: 88px ${X0}px 0; background: var(--paper); }
.top { display: flex; align-items: baseline; justify-content: space-between; height: 44px; }
.kicker { font-size: 32px; font-weight: 500; color: var(--ink-soft); }
.page { font-size: 30px; font-weight: 500; color: var(--ink-muted); }
.h1 { font-size: 110px; line-height: 0.98; font-weight: 700; letter-spacing: -3px; margin-top: 56px; }
.h2 { font-size: 60px; line-height: 1.08; font-weight: 700; letter-spacing: -1px; margin-top: 52px; }
.dek { font-size: 42px; line-height: 1.24; color: var(--ink-soft); margin-top: 26px; max-width: 880px; }
.key { display: flex; align-items: center; gap: 14px; font-size: 32px; color: var(--ink-soft); margin-top: 26px; }
.key b { color: var(--ink); font-weight: 700; }
.sw { width: 46px; height: 46px; flex: none; }
.abs { position: absolute; }
.foot { position: absolute; left: ${X0}px; right: ${X0}px; bottom: 64px; display: flex; align-items: center; justify-content: space-between; border-top: 3px solid var(--line); padding-top: 20px; }
.src { font-size: 30px; color: var(--ink-muted); }
.logo { width: 54px; height: 48px; }
.lab { font-size: 32px; color: var(--ink-soft); text-wrap: pretty; }
.lab b { color: var(--ink); font-weight: 700; }
.val { font-size: 34px; font-weight: 700; color: var(--ink); }
.num { font-size: 56px; font-weight: 700; color: var(--ink); letter-spacing: -1px; }
.hl-text { color: var(--indigo-500); }
.big { font-size: 280px; font-weight: 700; line-height: 0.86; letter-spacing: -9px; }
.cta { font-size: 50px; font-weight: 700; line-height: 1.15; color: var(--indigo-500); }
svg .t { font-family: Rubik; font-variant-numeric: tabular-nums; font-size: 32px; fill: var(--ink-soft); }
svg .tb { font-family: Rubik; font-variant-numeric: tabular-nums; font-size: 34px; font-weight: 700; fill: var(--ink); }
.p-empty { fill: var(--paper); stroke: #d3d9e2; stroke-width: 2; stroke-linejoin: round; }
.p-unit { fill: var(--indigo-100); stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
.p-mid { fill: var(--indigo-300); stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
.p-dark { fill: var(--ink); stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
.p-ring { fill: var(--indigo-50); stroke: var(--ink); stroke-width: 3; stroke-linejoin: round; }
.p-open { fill: none; stroke: var(--ink); stroke-width: 3; stroke-dasharray: 9 7; stroke-linejoin: round; }
.p-hl { fill: var(--coral-500); stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
.wall { stroke: var(--ink); stroke-width: 4; stroke-dasharray: 10 8; }
`;

const top = (kicker: string, page: string) => `<header class="top"><span class="kicker">${h(kicker)}</span><span class="page">${h(page)}</span></header>`;
const key = (unit: string, cls: Mark = 'hl') => `<p class="key">${keySwatch(cls)}<span><b>1 piece</b> = ${h(unit)}</span></p>`;
const foot = (src: string) => `<footer class="foot"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const frame = (inner: string) => `<div class="frame">${inner}</div>`;
const svgAt = (x: number, y: number, w: number, hgt: number, inner: string) =>
  `<svg class="abs" style="left:${x}px; top:${y}px" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">${inner}</svg>`;

// ---------------------------------------------------------------- wall carousel

function wall(c: Content): Post {
  const w = c.wall;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;

  // Cover: the hour as a 60-piece puzzle (1 piece = 1 minute). 59 placed, the last one still open.
  const hour = puzzle(10, HOUR / 10, 86, 31);
  const coverItems = hour.pieces.map(p => {
    const minute = p.row * 10 + p.col + 1;
    return { piece: p, mark: (minute === HOUR ? 'empty' : minute > HOUR - 6 ? 'hl' : 'unit') as Mark };
  });
  const coverY = 578;

  // Histogram: minutes around the hour as columns of pieces from one 20-column grid.
  const per = 500;
  const win = w.histogram.filter(d => d.minute >= HOUR - 10 && d.minute < HOUR + 10);
  const heights = win.map(d => Math.round(d.results / per));
  const rows = Math.max(...heights);
  const g = puzzle(win.length, rows, 45, 12);
  const histItems = g.pieces.map(p => {
    const d = win[p.col];
    const filled = rows - p.row <= heights[p.col];
    const hl = d.minute >= HOUR - 5 && d.minute < HOUR;
    return { piece: p, mark: (!filled ? 'empty' : hl ? 'hl' : 'unit') as Mark };
  });
  const gx = (CW - g.width) / 2;
  const wallX = gx + win.findIndex(d => d.minute === HOUR) * g.size;
  const histY = 478;
  const ticks = win.filter(d => d.minute % 5 === 0).map(d => {
    const i = win.indexOf(d);
    return `<text class="t" x="${gx + i * g.size + g.size / 2}" y="${g.height + 44}" text-anchor="middle">${d.minute}${i + 5 >= win.length ? ' min' : ''}</text>`;
  }).join('');

  // Context: results lost against the minute before, at 45, 50 and 60 minutes (1 piece = 50 results).
  const lossUnit = 50;
  const marks = [...w.noStepAt, HOUR].map(m => ({ m, lost: at(m - 1) - at(m) }));
  const lossPieces = marks.map(k => Math.max(0, Math.round(k.lost / lossUnit)));
  const lossCols = Math.max(12, Math.max(...lossPieces) + 1);
  const strip = puzzle(lossCols, marks.length + 2, 900 / lossCols, 44);
  const stripGap = 190;
  const lossSvg = marks.map((k, i) => {
    const items = Array.from({ length: lossCols }, (_, col) => ({
      piece: strip.at(col, i + 1),
      mark: (col < lossPieces[i] ? (k.m === HOUR ? 'hl' : 'unit') : 'empty') as Mark,
    }));
    // Each row is lifted out of the same grid, so its pieces keep their column alignment.
    return `<g transform="translate(0 ${i * stripGap - (i + 1) * strip.size})">${drawPieces(items)}</g>`;
  }).join('');
  const lossLabels = marks.map((k, i) => {
    const y = 660 + i * stripGap;
    const value = k.lost > 0
      ? `<b>${fmtInt(k.lost)} fewer</b> than at ${k.m - 1}`
      : `${fmtInt(-k.lost)} more than at ${k.m - 1}, still rising`;
    return `<p class="abs lab" style="left:${X0}px; top:${y - 58}px; width:${CW}px; display:flex; justify-content:space-between"><b${k.m === HOUR ? ' class="hl-text"' : ''}>${k.m} min</b><span>${value}</span></p>`;
  }).join('');

  // Takeaway: 100 puzzlers, filled column by column so the coral side is literally one side of a wall.
  const sub = w.subHour;
  const waffle = puzzle(10, 10, 58, 21);
  const waffleItems = waffle.pieces.map(p => ({ piece: p, mark: (p.col * 10 + p.row < sub.pct ? 'hl' : 'unit') as Mark }));
  const wx = 0, wy = 470;

  return {
    key: 'wall',
    slides: [
      { id: 'wall-1', body: frame(`${top(w.kicker, 'MSP DATA')}
        <h1 class="h1">${h(w.title).replace(/ (\S+)$/, '<br>$1')}</h1>
        <p class="dek">${h(w.dek)}</p>
        ${svgAt(X0, coverY, hour.width, hour.height, drawPieces(coverItems) + `<path class="p-open" d="${hour.at(9, HOUR / 10 - 1).d}"/>`)}
        <div class="abs" style="left:${X0}px; top:${coverY + hour.height + 20}px; width:${hour.width}px; display:flex; justify-content:space-between; align-items:center">
          ${key('1 minute of the hour', 'unit').replace('class="key"', 'class="key" style="margin:0"')}
          <span class="lab"><b>${HOUR_LABEL}</b></span>
        </div>
        ${foot(c.source)}`) },
      { id: 'wall-2', body: frame(`${top(w.kicker, '2 / 4')}
        <h2 class="h2">Finishes peak at ${w.mode.minute} minutes, then drop at the hour</h2>
        ${key(`${fmtInt(per)} results`, 'unit')}
        <p class="abs lab" style="right:${W - X0 - wallX + 18}px; top:${histY - 70}px; text-align:right"><b>${fmtInt(w.mode.results)}</b> at ${w.mode.minute} min</p>
        <p class="abs lab" style="left:${X0 + wallX + 18}px; top:${histY - 70}px"><b class="hl-text">${signed(w.dropPct)}%</b> at ${HOUR} min</p>
        ${svgAt(X0, histY, CW, g.height + 60, `<g transform="translate(${gx} 0)">${drawPieces(histItems)}</g>
          <line class="wall" x1="${wallX}" x2="${wallX}" y1="-24" y2="${g.height + 8}"/>${ticks}`)}
        ${foot(c.source)}`) },
      { id: 'wall-3', body: frame(`${top(w.kicker, '3 / 4')}
        <h2 class="h2">${h(w.context)}</h2>
        ${key(`${lossUnit} results lost against the minute before`, 'unit')}
        ${svgAt(X0 + 2, 670, 900, stripGap * marks.length, lossSvg)}
        ${lossLabels}
        ${foot(c.source)}`) },
      { id: 'wall-4', body: frame(`${top(w.kicker, '4 / 4')}
        <h2 class="h2">${sub.pct} in 100 have a 500-piece personal best under the hour</h2>
        ${key(`1% of ${fmtInt(sub.puzzlers)} puzzlers`)}
        <div class="abs" style="left:${X0 + waffle.width + 48}px; top:${wy}px">
          <p class="key" style="margin:0">${keySwatch('hl')}<span class="num">${fmtInt(sub.under60)}</span></p>
          <p class="lab" style="margin:4px 0 0 60px">under ${HOUR_LABEL}</p>
          <p class="key" style="margin:44px 0 0">${keySwatch('unit')}<span class="num">${fmtInt(sub.puzzlers - sub.under60)}</span></p>
          <p class="lab" style="margin:4px 0 0 60px">over ${HOUR_LABEL}</p>
        </div>
        ${svgAt(X0 + wx, wy, waffle.width, waffle.height, drawPieces(waffleItems))}
        <p class="abs cta" style="left:${X0}px; top:${wy + waffle.height + 36}px; width:${CW}px">${h(w.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

// ---------------------------------------------------------------- record

function record(c: Content): Post {
  const r = c.record;
  const [mm, ss] = r.value.split(':').map(Number);
  const seconds = mm * 60 + ss;
  const per = 30; // 1 piece = 30 seconds, so the hour is a 20 × 6 puzzle (one row = 10 minutes)
  const strip = puzzle(20, (HOUR * 60) / per / 20, 45, 8);
  const placed = Math.round(seconds / per);
  const items = strip.pieces.map(p => ({ piece: p, mark: (p.row * 20 + p.col < placed ? 'hl' : 'empty') as Mark }));
  const y = 700;
  return { key: 'record', slides: [{ id: 'record-1', body: frame(`${top(r.kicker, 'MSP DATA')}
    <p class="big" style="margin-top:72px">${h(r.value)}</p>
    <h2 class="h2" style="margin-top:44px">${h(r.title)}</h2>
    <p class="abs lab" style="left:${X0}px; top:${y - 58}px"><b>${placed} of ${strip.cols * strip.rows} pieces</b> of the hour</p>
    ${svgAt(X0 + 2, y, strip.width, strip.height, drawPieces(items))}
    <div class="abs" style="left:${X0}px; top:${y + strip.height + 22}px">${key(`${per} seconds`).replace('class="key"', 'class="key" style="margin:0"')}</div>
    <p class="abs lab" style="left:${X0}px; top:${y + strip.height + 104}px; width:${CW}px">${h(r.context)}<br>${h(r.footnote)}.</p>
    ${foot(c.source)}`) }] };
}

// ---------------------------------------------------------------- countries

function countries(c: Content): Post {
  const k = c.countries;
  const ahead = k.top.map(d => ({ ...d, ahead: HOUR - d.medianPb, units: Math.max(0, Math.round(HOUR - d.medianPb)) }));
  const cols = Math.max(10, ...ahead.map(a => a.units));
  const size = 50;
  const grid = puzzle(cols, ahead.length, size, 63);
  const items = grid.pieces.map(p => ({ piece: p, mark: (p.col < ahead[p.row].units ? (p.row === 0 ? 'hl' : 'unit') : 'empty') as Mark }));
  const gx = X0 + CW - grid.width, gy = 560;
  const everyone = k.reference.find(r => r.label === 'Everyone')!.value!;
  const us = k.reference.find(r => r.label === 'United States')?.value;
  const rowsHtml = ahead.map((d, i) => `<div class="abs crow" style="left:${X0}px; top:${gy + i * size}px; width:${gx - X0 - 24}px; height:${size}px">
    <img src="${flagUrl(d.code)}" alt=""><span class="cname">${h(d.name)}</span><span class="ctime">${fmtDuration(d.medianPb)}</span></div>`).join('');
  return { key: 'countries', slides: [{ id: 'countries-1', body: frame(`${top('Solo 500 pieces', 'MSP DATA')}
    <style>.crow { display:flex; align-items:center; } .crow img { width:40px; height:40px; } .cname { margin-left:14px; font-size:32px; font-weight:500; flex:1; } .ctime { font-size:32px; font-weight:700; }</style>
    <h2 class="h2">${h(k.title)}</h2>
    <p class="dek" style="font-size:32px; margin-top:18px">${h(k.dek)}</p>
    ${key(`1 minute faster than the hour`, 'unit')}
    ${svgAt(gx, gy, grid.width, grid.height, drawPieces(items))}
    ${rowsHtml}
    <p class="abs lab" style="left:${X0}px; top:${gy + grid.height + 30}px; width:${CW}px">Over the hour, so no pieces:<br>Everyone <b>${fmtDuration(everyone)}</b>${us != null ? ` · United States <b>${fmtDuration(us)}</b>` : ''}</p>
    ${foot(c.source)}`) }] };
}

// ---------------------------------------------------------------- share

function share(c: Content): Post {
  const s = c.share;
  const size = 56;
  const grid = puzzle(10, 10, size, 21);
  const marks: Mark[] = ['hl', 'unit', 'mid', 'dark'];
  const byKey = new Map(s.units.map((u, i) => [u.key, marks[i] ?? 'unit']));
  const seq = s.units.flatMap(u => Array(u.units).fill(u.key) as string[]);
  // Column by column, so each size is one contiguous block.
  const items = grid.pieces.map(p => ({ piece: p, mark: (byKey.get(seq[p.col * 10 + p.row]) ?? 'empty') as Mark }));
  const gy = 500;
  const lx = X0 + grid.width + 48;
  const legend = s.units.map((u, i) => {
    const part = s.parts.find(p => p.key === u.key)!;
    return `<div class="abs" style="left:${lx}px; top:${gy + i * 150}px; width:${X0 + CW - lx}px">
      <p class="key" style="margin:0">${keySwatch(byKey.get(u.key))}<span class="val">${h(s.labels[u.key])}</span></p>
      <p class="lab" style="margin-top:6px"><b>${u.units}</b> ${u.units === 1 ? 'piece' : 'pieces'} · ${part.pct}%</p>
      <p class="lab" style="margin-top:2px">${fmtInt(part.results)} results</p></div>`;
  }).join('');
  return { key: 'share', slides: [{ id: 'share-1', body: frame(`${top('Puzzle sizes', 'MSP DATA')}
    <h2 class="h2">${h(s.title)}</h2>
    ${key(`1% of ${fmtInt(c.totals.results)} results`, 'unit')}
    ${svgAt(X0, gy, grid.width, grid.height, drawPieces(items))}
    ${legend}
    ${foot(c.source)}`) }] };
}

// ---------------------------------------------------------------- xp

function xp(c: Content): Post {
  const x = c.xp;
  // The edge of a 12 × 15 puzzle at 90 px is exactly 50 pieces and exactly the frame: one piece per level.
  const grid = puzzle(12, 15, 90, 50);
  // Clockwise from (2,0), closing at (1,0): the last piece lands top left, inside the 3:4 grid crop.
  const perimeter: Piece[] = [];
  for (let col = 0; col < grid.cols; col++) perimeter.push(grid.at(col, 0));
  for (let row = 1; row < grid.rows; row++) perimeter.push(grid.at(grid.cols - 1, row));
  for (let col = grid.cols - 2; col >= 0; col--) perimeter.push(grid.at(col, grid.rows - 1));
  for (let row = grid.rows - 2; row >= 1; row--) perimeter.push(grid.at(0, row));
  const ring = [...perimeter.slice(2), ...perimeter.slice(0, 2)];
  const levels = ring.slice(0, x.level);
  // Line-drawn edge, one coral piece: the last level closes the border next to where level 1 starts.
  const ringSvg = levels.map((p, i) => `<path class="${i === levels.length - 1 ? 'p-hl' : 'p-ring'}" d="${p.d}"/>`).join('');
  const cx = W / 2, cy = 560, R = 230;
  return { key: 'xp', slides: [{ id: 'xp-1', body: `<div class="frame" style="padding:0">
    ${svgAt(0, 0, W, H, `${ringSvg}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--coral-500)" stroke="var(--ink)" stroke-width="5"/>
      <circle cx="${cx}" cy="${cy}" r="${R - 20}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
      <text x="${cx}" y="${cy - 92}" text-anchor="middle" style="font: 700 44px Rubik; letter-spacing: 8px; fill: var(--ink)">LEVEL</text>
      <text x="${cx}" y="${cy + 112}" text-anchor="middle" style="font: 800 250px Rubik; font-variant-numeric: tabular-nums; letter-spacing: -6px; fill: var(--ink)">${x.level}</text>`)}
    <p class="abs kicker" style="left:0; width:${W}px; top:150px; text-align:center">${h(x.kicker)}</p>
    <div class="abs" style="left:150px; width:${W - 300}px; top:${cy + R + 50}px; text-align:center">
      <p class="h2" style="margin:0">${h(x.title)}</p>
      <p class="dek" style="margin:22px auto 0; font-size:40px">${h(x.dek)}</p>
      <p class="lab" style="margin-top:22px; text-wrap:balance">${h(x.context)}</p>
    </div>
    <div class="abs" style="left:150px; width:${W - 300}px; top:1170px; display:flex; justify-content:space-between; align-items:center">
      ${key(`1 level · ${x.level} make the edge`, 'unit').replace('class="key"', 'class="key" style="margin:0"')}
      <img class="logo" src="${LOGO_URL}" alt="">
    </div>
  </div>` }] };
}

const direction: Direction = {
  id: 'D3',
  name: 'Piece Units',
  idea: 'Isotype meets jigsaw: every chart is a partly assembled puzzle cut from one tessellating generator grid, 1 piece = a stated unit, totals printed as numbers, one coral highlight on white.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c)],
};
export default direction;
