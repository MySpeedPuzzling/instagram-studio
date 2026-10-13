// D3 · Piece Units (Isotype meets jigsaw).
// Every chart is a partly assembled puzzle: units are pieces cut from one tessellating generator grid,
// each piece has a fixed value stated in a key, placed pieces are filled (navy outline), open slots are
// pale outlines, and the total is always printed as a number. White ground, one coral highlight.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
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
.row { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; }
.sec { font-size: 32px; font-weight: 500; color: var(--ink-soft); border-bottom: 3px solid var(--line); padding-bottom: 12px; }
.who { display: flex; align-items: center; gap: 16px; min-width: 0; }
.who img { width: 46px; height: 46px; flex: none; }
.rk { width: 34px; flex: none; font-size: 34px; font-weight: 700; color: var(--ink-muted); }
.pn { font-size: 50px; font-weight: 700; letter-spacing: -0.5px; white-space: nowrap; }
.ig { font-size: 32px; color: var(--ink-soft); white-space: nowrap; }
.tm { font-size: 64px; font-weight: 700; letter-spacing: -1px; }
.stat { display: flex; align-items: baseline; gap: 22px; padding: 18px 0; border-bottom: 3px solid var(--line); }
.stat .num { width: 190px; flex: none; }
.flag { color: var(--indigo-500); font-weight: 700; }
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

// ---------------------------------------------------------------- helpers for the series posts

const NICE = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1e3, 2e3, 2500, 5e3, 1e4, 2e4, 25e3, 5e4, 1e5, 2e5, 25e4, 5e5, 1e6, 2e6, 5e6];
/** Smallest round unit so the largest value needs at most `limit` pieces. */
const unitFor = (max: number, limit: number) => NICE.find(u => Math.round(max / u) <= limit) ?? NICE[NICE.length - 1];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MON[Number(iso.slice(5, 7)) - 1]}`;
const monthLabel = (ym: string, long = false) => `${(long ? MONTH : MON)[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const flagImg = (cc: string) => (cc ? `<img src="${flagUrl(cc)}" alt="">` : '<span style="width:46px; flex:none"></span>');
/** "h:mm:ss" or "m:ss" → minutes. */
const toMinutes = (t: string) => t.split(':').map(Number).reduce((a, v) => a * 60 + v, 0) / 60;

/** A compact formation for n units: the column count with the fewest open slots, widest first. */
function formation(n: number, minCols: number, maxCols: number) {
  let best = { cols: maxCols, rows: Math.ceil(n / maxCols) };
  for (let cols = maxCols; cols >= minCols; cols--) {
    const rows = Math.ceil(n / cols);
    if (cols * rows - n < best.cols * best.rows - n) best = { cols, rows };
  }
  return best;
}

/** Shortens text to at most `max` characters at a word boundary, with an ellipsis. */
const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return `${(/\s/.test(s[max - 1]) ? head : head.replace(/\s+\S*$/, '') || head).replace(/[\s,.:;·–-]+$/, '')}…`;
};

/** Same player listed several times (one person can own the whole podium): one entry, best time first. */
function byPlayer<T extends { player: string }>(list: T[]) {
  const out: Array<{ rank: number; first: T; more: T[] }> = [];
  list.forEach((f, i) => {
    const g = out.find(o => o.first.player === f.player);
    if (g) g.more.push(f); else out.push({ rank: i + 1, first: f, more: [] });
  });
  return out;
}

/** Rows lifted out of one grid (so they keep column alignment), one per value, `gap` px apart. */
function strips(values: number[], opts: { cols: number; size: number; gap: number; seed: number; mark: (i: number) => Mark }) {
  const grid = puzzle(opts.cols, values.length + 2, opts.size, opts.seed);
  return values.map((v, i) => {
    const items = Array.from({ length: opts.cols }, (_, col) => ({ piece: grid.at(col, i + 1), mark: (col < v ? opts.mark(i) : 'empty') as Mark }));
    return `<g transform="translate(0 ${i * opts.gap - (i + 1) * opts.size})">${drawPieces(items)}</g>`;
  }).join('');
}

const at = (x: number, y: number, inner: string, style = '') => `<div class="abs" style="left:${x}px; top:${y}px; ${style}">${inner}</div>`;
const keyAt = (x: number, y: number, unit: string, cls: Mark = 'unit') => at(x, y, key(unit, cls).replace('class="key"', 'class="key" style="margin:0"'));
const legendRow = (cls: Mark, value: string, label: string) => `<p class="key" style="margin:0">${keySwatch(cls)}<span class="num">${value}</span></p><p class="lab" style="margin:4px 0 0 60px">${label}</p>`;

// ---------------------------------------------------------------- weekly (The Weekly Numbers, recurring)

type Fastest = Content['weekly']['fastest500'][number];

function weekly(c: Content): Post {
  const wk = c.weekly;
  const kick = wk.series;

  // Cover marker, same place every week: this episode as a placed navy piece carrying its number, next
  // week's piece still an open slot beside it, so the profile grid reads as a numbered sequence.
  const ep = wk.episode;
  const eSize = 128;
  const eGrid = puzzle(2, 3, eSize, 5, 0.22);
  const eW = 2 * eSize, eX = X0 + CW - eW, eY = 196;
  const eSvg = `<g transform="translate(0 ${-eSize})">${drawPieces([{ piece: eGrid.at(0, 1), mark: 'dark' }])}<path class="p-open" d="${eGrid.at(1, 1).d}"/></g>
    <text x="${eSize / 2}" y="${eSize / 2 + 26}" text-anchor="middle" style="font: 700 ${ep > 9 ? 64 : 80}px Rubik; font-variant-numeric: tabular-nums; letter-spacing: -2px; fill: var(--paper)">${ep}</text>`;

  // The week in results: last week's total as pieces, the change on top in coral (or left open if it fell).
  const per = unitFor(Math.max(wk.results, wk.resultsPrev), 90);
  const now = Math.round(wk.results / per), prev = Math.round(wk.resultsPrev / per);
  const rows = 5, cols = Math.ceil(Math.max(now, prev) / rows);
  const size = Math.min(56, Math.floor(CW / cols));
  const g = puzzle(cols, rows, size, 17);
  const order = (p: Piece) => p.col * rows + p.row; // column by column: the change is one block at the end
  const items = g.pieces.map(p => {
    const i = order(p);
    return { piece: p, mark: (i < Math.min(now, prev) ? 'unit' : i < now ? 'hl' : 'empty') as Mark };
  });
  const lost = g.pieces.filter(p => order(p) >= now && order(p) < prev);
  const diff = wk.results - wk.resultsPrev;
  const cY = 820;

  // Top puzzles.
  const tp = wk.topPuzzles;
  const tpUnit = unitFor(tp[0].solvers, 26);
  const tpUnits = tp.map(p => Math.round(p.solvers / tpUnit));
  const tpCols = Math.max(...tpUnits);
  const tpSize = Math.min(56, CW / tpCols);
  const tpGap = 146, tpY = 530;

  // Fastest: one slide per size, grouped by player (repeat finishes fold into "also").
  const sections = [
    { label: 'Solo 500 pieces', list: wk.fastest500 },
    { label: 'Solo 1,000 pieces', list: wk.fastest1000 },
  ].filter(s => s.list.length);
  const N = 4 + sections.length;
  const entry = (gp: { rank: number; first: Fastest; more: Fastest[] }) => {
    const f = gp.first;
    // The note wraps to at most two lines of the 854 px column; long puzzle names are cut at a word.
    const brand = cut(f.brand, 24);
    const notes = [`${h(cut(f.puzzle, 88 - brand.length - 3 - (f.firstAttempt ? 16 : 0)))}&nbsp;· ${h(brand)}`];
    if (f.firstAttempt) notes.push('<span class="flag">first&nbsp;attempt</span>');
    if (gp.more.length) notes.push(`also ${gp.more.map(m => `<b>${m.time}</b>`).join(' and ')}`);
    return `<div style="margin-top:60px">
      <div class="row" style="align-items:center"><span class="who"><span class="rk">${gp.rank}</span>${flagImg(f.country)}<span class="pn" style="white-space:normal; overflow-wrap:anywhere; line-height:1.1; min-width:0">${h(cut(f.player, 48))}</span></span><span class="tm" style="flex:none">${f.time}</span></div>
      ${f.handle ? `<p class="ig" style="margin:6px 0 0 50px; white-space:normal; overflow-wrap:anywhere">@${h(f.handle)}</p>` : ''}
      <p class="lab" style="margin:8px 0 0 50px">${notes.join('&nbsp;· ')}</p></div>`;
  };

  // Personal bests as a share of the week's results.
  const pbPct = Math.round((wk.personalBests / wk.results) * 100);
  const waffle = puzzle(10, 10, 56, 21);
  const pbItems = waffle.pieces.map(p => ({ piece: p, mark: (p.col * 10 + p.row < pbPct ? 'hl' : 'unit') as Mark }));
  const wY = 450;

  // Pieces placed, as pieces.
  const ppUnit = unitFor(wk.pieces, 48);
  const pp = Math.round(wk.pieces / ppUnit);
  const pf = formation(pp, 6, 8);
  const ppSize = Math.min(92, Math.floor(620 / pf.cols));
  const ppGrid = puzzle(pf.cols, pf.rows, ppSize, 41);
  const ppItems = ppGrid.pieces.map(p => ({ piece: p, mark: (p.row * pf.cols + p.col < pp ? 'unit' : 'empty') as Mark }));
  const ppY = 450;

  return {
    key: 'weekly',
    slides: [
      { id: 'weekly-1', body: frame(`${top(kick, wk.range)}
        <h1 class="h1">${h(wk.series).replace(/ (\S+)$/, '<br>$1')}</h1>
        ${svgAt(eX, eY, eW, eSize, eSvg)}
        <p class="abs lab" style="left:${eX}px; top:${eY + eSize + 44}px; width:${eW + 40}px"><b>Episode ${ep}</b></p>
        <p class="abs big" style="left:${X0}px; top:470px; font-size:210px; letter-spacing:-7px">${fmtInt(wk.results)}</p>
        <p class="abs dek" style="left:${X0}px; top:672px; margin:0">results logged, <b class="hl-text">${fmtSignedPct(wk.resultsChangePct)}</b> on the week before</p>
        ${at(X0, cY - 58, `<p class="lab"><b>${fmtInt(wk.resultsPrev)}</b> the week before</p>`)}
        ${at(X0, cY - 58, `<p class="lab"><b class="hl-text">${diff < 0 ? '−' : '+'}${fmtInt(Math.abs(diff))}</b> ${diff < 0 ? 'fewer' : 'more'}</p>`, `width:${g.width}px; text-align:right`)}
        ${svgAt(X0, cY, g.width, g.height, drawPieces(items) + lost.map(p => `<path class="p-open" d="${p.d}"/>`).join(''))}
        ${keyAt(X0, cY + g.height + 22, `${fmtInt(per)} results`)}
        ${foot(c.source)}`) },
      { id: 'weekly-2', body: frame(`${top(kick, `2 / ${N}`)}
        <h2 class="h2">${h(tp[0].puzzle)} was the most-solved puzzle of the week</h2>
        ${key(`${tpUnit} solvers`, 'unit')}
        ${svgAt(X0, tpY, CW, tpGap * tp.length, strips(tpUnits, { cols: tpCols, size: tpSize, gap: tpGap, seed: 29, mark: i => (i === 0 ? 'hl' : 'unit') }))}
        ${tp.map((p, i) => `<p class="abs lab row" style="left:${X0}px; top:${tpY + i * tpGap - 56}px; width:${CW}px"><span><b>${h(p.puzzle)}</b> · ${h(p.brand)}</span><span><b>${fmtInt(p.solvers)}</b> solvers</span></p>`).join('')}
        ${foot(c.source)}`) },
      ...sections.map((s, i) => ({ id: `weekly-${3 + i}`, body: frame(`${top(kick, `${3 + i} / ${N}`)}
        <h2 class="h2">Fastest of the week</h2>
        <div style="margin-top:60px"><p class="sec">${h(s.label)} · best time per puzzler</p>${byPlayer(s.list).map(entry).join('')}</div>
        ${foot(c.source)}`) })),
      { id: `weekly-${N - 1}`, body: frame(`${top(kick, `${N - 1} / ${N}`)}
        <h2 class="h2">${pbPct} in 100 results last week were personal bests</h2>
        ${key(`1% of ${fmtInt(wk.results)} results`)}
        ${svgAt(X0, wY, waffle.width, waffle.height, drawPieces(pbItems))}
        ${at(X0 + waffle.width + 48, wY, `${legendRow('hl', fmtInt(wk.personalBests), 'personal bests')}<div style="margin-top:44px">${legendRow('unit', fmtInt(wk.results - wk.personalBests), 'other results')}</div>`)}
        <p class="abs lab" style="left:${X0}px; top:${wY + waffle.height + 40}px; width:${CW}px">And welcome to the <b>${fmtInt(wk.newPuzzlers)}</b> puzzlers who joined MySpeedPuzzling last week.</p>
        ${foot(c.source)}`) },
      { id: `weekly-${N}`, body: frame(`${top(kick, `${N} / ${N}`)}
        <h2 class="h2">Together you placed ${fmtInt(wk.pieces)} pieces</h2>
        ${key(`${fmtInt(ppUnit)} pieces placed`, 'unit')}
        ${svgAt(X0, ppY, ppGrid.width, ppGrid.height, drawPieces(ppItems))}
        ${at(X0 + ppGrid.width + 48, ppY, `<p class="num">${fmtInt(wk.puzzlers)}</p><p class="lab">puzzlers</p><p class="num" style="margin-top:36px">${fmtInt(wk.results)}</p><p class="lab">results</p>`)}
        <p class="abs cta" style="left:${X0}px; top:${ppY + ppGrid.height + 60}px; width:${CW}px">${h(wk.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

// ---------------------------------------------------------------- event preview

function event(c: Content): Post {
  const e = c.event;
  // Everyone registered, 1 piece = 1 puzzler; the ones already on MSP placed first, in coral.
  const f = formation(e.registered, 18, 20);
  const size = Math.min(46, Math.floor(CW / f.cols));
  const g = puzzle(f.cols, f.rows, size, 23);
  const items = g.pieces.map(p => {
    const i = p.row * f.cols + p.col;
    return { piece: p, mark: (i < e.onMsp ? 'hl' : i < e.registered ? 'unit' : 'empty') as Mark };
  });
  const gY = 520;

  // The US median PB against the hour: 1 piece = 1 minute, the hour as 6 rows of 10.
  const pb = e.usMedianPb ? toMinutes(e.usMedianPb) : null;
  const slides = [{ id: 'event-1', body: frame(`${top('Event preview', pb != null ? '1 / 2' : 'MSP DATA')}
    <h2 class="h2">${h(e.name)}</h2>
    <p class="dek" style="margin-top:18px">${h(e.date)} · ${h(e.location)}</p>
    ${keyAt(X0, gY - 82, '1 registered puzzler')}
    ${svgAt(X0, gY, g.width, g.height, drawPieces(items))}
    ${at(X0, gY + g.height + 34, legendRow('hl', fmtInt(e.onMsp), 'already on MySpeedPuzzling'))}
    ${at(X0 + 470, gY + g.height + 34, legendRow('unit', fmtInt(e.registered), 'registered in total'))}
    ${foot(c.source)}`) }];
  if (pb != null) {
    const mins = Math.round(pb);
    const hg = puzzle(10, Math.ceil(Math.max(mins, HOUR + 1) / 10), 64, 31);
    const hItems = hg.pieces.map(p => {
      const m = p.row * 10 + p.col + 1;
      return { piece: p, mark: (m > mins ? 'empty' : m > HOUR ? 'hl' : 'unit') as Mark };
    });
    const hY = 470, lineY = (HOUR / 10) * hg.size;
    slides.push({ id: 'event-2', body: frame(`${top('Event preview', '2 / 2')}
      <h2 class="h2">The median US puzzler’s solo 500 best is ${h(e.usMedianPb!)}</h2>
      ${key('1 minute', 'unit')}
      ${svgAt(X0, hY, hg.width, hg.height, `${drawPieces(hItems)}<line class="wall" x1="-12" x2="${hg.width + 12}" y1="${lineY}" y2="${lineY}"/>`)}
      ${at(X0 + hg.width + 40, hY + lineY - 66, `<p class="lab"><b>${HOUR_LABEL}</b></p>`)}
      ${at(X0 + hg.width + 40, hY + lineY + 10, `<p class="lab"><b class="hl-text">${h(e.usMedianPb!)}</b></p>`)}
      <p class="abs lab" style="left:${X0}px; top:${hY + hg.height + 30}px; width:${CW}px">Median personal best of ${fmtInt(e.usPuzzlers ?? 0)} US puzzlers on MySpeedPuzzling.</p>
      <p class="abs cta" style="left:${X0}px; top:${hY + hg.height + 130}px; width:${CW}px">${h(e.question)}</p>
      ${foot(c.source)}`) });
  }
  return { key: 'event', slides };
}

// ---------------------------------------------------------------- feature news: XP launch day

function feature(c: Content): Post {
  const f = c.feature;
  const launch = f.days.find(d => d.results === f.results && d.backfilled === f.backfilled)!;
  // The two weeks the "typical day" is averaged over, then launch day (later, partial days are left out).
  const days = f.days.filter(d => d.day <= launch.day);
  const per = unitFor(f.results, 15);
  const heights = days.map(d => Math.round(d.results / per));
  const rows = Math.max(...heights);
  const size = Math.min(46, Math.floor(620 / rows));
  const g = puzzle(days.length, rows, size, 12);
  const items = g.pieces.map(p => ({ piece: p, mark: (rows - p.row > heights[p.col] ? 'empty' : days[p.col] === launch ? 'hl' : 'unit') as Mark }));
  const gX = X0 + CW - g.width, gY = 520;
  const typY = g.height - (f.typicalDay / per) * size;
  const ticks = days.map((d, i) => ({ d, i })).filter(({ i }) => i % 7 === 0 || i === days.length - 1).map(({ d, i }) =>
    `<text class="t" x="${i * size + size / 2}" y="${g.height + 46}" text-anchor="${i === days.length - 1 ? 'end' : 'middle'}" dx="${i === days.length - 1 ? size / 2 : 0}">${dayLabel(d.day)}</text>`).join('');

  const pct = f.backfilledPct;
  const waffle = puzzle(10, 10, 52, 21);
  const wItems = waffle.pieces.map(p => ({ piece: p, mark: (p.col * 10 + p.row < pct ? 'hl' : 'unit') as Mark }));
  const wY = 520;
  return {
    key: 'feature',
    slides: [
      { id: 'feature-1', body: frame(`${top(f.kicker, '1 / 2')}
        <h2 class="h2">${h(f.title)}</h2>
        ${key(`${fmtInt(per)} results logged`, 'unit')}
        <p class="abs lab" style="right:${X0}px; top:${gY - 100}px; text-align:right"><b>${fmtInt(f.results)}</b> on ${dayLabel(launch.day)}<br><b class="hl-text">${f.multiple}×</b> a typical day</p>
        ${svgAt(gX, gY, g.width, g.height + 60, `${drawPieces(items)}<line class="wall" x1="-16" x2="${g.width - size - 6}" y1="${typY}" y2="${typY}"/>${ticks}`)}
        <p class="abs lab" style="left:${X0}px; top:${gY + typY - 74}px; width:${gX - X0 - 30}px">Typical day<br><b>${fmtInt(f.typicalDay)}</b></p>
        ${foot(c.source)}`) },
      { id: 'feature-2', body: frame(`${top(f.kicker, '2 / 2')}
        <h2 class="h2">${pct} in 100 launch-day results were puzzles solved more than a week earlier</h2>
        ${key(`1% of ${fmtInt(f.results)} results`)}
        ${svgAt(X0, wY, waffle.width, waffle.height, drawPieces(wItems))}
        ${at(X0 + waffle.width + 48, wY, `${legendRow('hl', fmtInt(f.backfilled), 'solved earlier')}<div style="margin-top:44px">${legendRow('unit', fmtInt(f.results - f.backfilled), 'solved that week')}</div>`)}
        <p class="abs cta" style="left:${X0}px; top:${wY + waffle.height + 44}px; width:${CW}px">${h(f.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

// ---------------------------------------------------------------- monthly report

function month(c: Content): Post {
  const m = c.month;
  const cur = m.series.find(x => x.results === m.results)!;
  const lastYear = m.series.find(x => x.month === `${Number(cur.month.slice(0, 4)) - 1}${cur.month.slice(4)}`);
  const kick = 'Monthly report';

  // Cover: the same month a year earlier against this one, two rows lifted from one grid.
  const pair = lastYear ? [lastYear, cur] : [cur];
  const pPer = unitFor(cur.results, 18);
  const pUnits = pair.map(x => Math.round(x.results / pPer));
  const pCols = Math.max(...pUnits) + 1;
  const pSize = Math.min(56, Math.floor(CW / pCols));
  const pGap = 150, pY = 910;

  // Every month since the series starts: columns of pieces.
  const s = m.series;
  const per = unitFor(Math.max(...s.map(x => x.results)), 13);
  const heights = s.map(x => Math.round(x.results / per));
  const rows = Math.max(...heights);
  const size = Math.min(48, Math.floor(CW / s.length));
  const g = puzzle(s.length, rows, size, 9);
  const markOf = (x: typeof cur): Mark => (x === cur ? 'hl' : x === lastYear ? 'mid' : 'unit');
  const items = g.pieces.map(p => ({ piece: p, mark: (rows - p.row > heights[p.col] ? 'empty' : markOf(s[p.col])) as Mark }));
  const gX = X0 + (CW - g.width) / 2, gY = 540;
  const runner = [...s].filter(x => x !== cur).sort((a, b) => b.results - a.results)[0];
  const margin = m.results - runner.results;
  const verdict = margin > 0 && margin < m.results * 0.01
    ? `A photo finish: ${MONTH[Number(cur.month.slice(5, 7)) - 1]} beat ${monthLabel(runner.month, true)} by ${fmtInt(margin)} results`
    : `${MONTH[Number(cur.month.slice(5, 7)) - 1]} topped every month since ${monthLabel(s[0].month, true)}`;
  const colX = (x: typeof cur) => s.indexOf(x) * size + size / 2;
  const tick = (x: typeof cur, anchor: string) => `<text class="t" x="${colX(x) + (anchor === 'end' ? size / 2 : anchor === 'start' ? -size / 2 : 0)}" y="${g.height + 46}" text-anchor="${anchor}">${monthLabel(x.month)}</text>`;

  // Pieces placed, 1 piece = a round number of them.
  const ppUnit = unitFor(m.pieces, 24);
  const pp = Math.round(m.pieces / ppUnit);
  const pf = formation(pp, 5, 6);
  const ppSize = Math.min(112, Math.floor(CW / pf.cols));
  const ppGrid = puzzle(pf.cols, pf.rows, ppSize, 77);
  const ppItems = ppGrid.pieces.map(p => ({ piece: p, mark: (p.row * pf.cols + p.col < pp ? 'unit' : 'empty') as Mark }));
  const ppY = 420;
  const isRecord = (k: 'active' | 'newPlayers') => cur[k] === Math.max(...s.map(x => x[k]));
  const stats = [
    { v: m.active, label: 'puzzlers logged a result', rec: isRecord('active') },
    { v: m.newPlayers, label: 'new puzzlers joined', rec: isRecord('newPlayers') },
  ];

  return {
    key: 'month',
    slides: [
      { id: 'month-1', body: frame(`${top(kick, m.label)}
        <h2 class="h2">${h(m.title)}</h2>
        <p class="abs big" style="left:${X0}px; top:390px; font-size:210px; letter-spacing:-7px">${fmtInt(m.results)}</p>
        <p class="abs dek" style="left:${X0}px; top:592px; margin:0">results logged${lastYear ? `, <b class="hl-text">${fmtSignedPct(m.vsLastYearPct, 0)}</b> on ${monthLabel(lastYear.month, true)}` : ''}</p>
        ${keyAt(X0, 700, `${fmtInt(pPer)} results`)}
        ${svgAt(X0, pY, CW, pGap * pair.length, strips(pUnits, { cols: pCols, size: pSize, gap: pGap, seed: 44, mark: i => (pair[i] === cur ? 'hl' : 'mid') }))}
        ${pair.map((x, i) => `<p class="abs lab row" style="left:${X0}px; top:${pY + i * pGap - 58}px; width:${CW}px"><b>${monthLabel(x.month, true)}</b><span><b>${fmtInt(x.results)}</b></span></p>`).join('')}
        ${foot(c.source)}`) },
      { id: 'month-2', body: frame(`${top(kick, '2 / 3')}
        <h2 class="h2">${h(verdict)}</h2>
        ${key(`${fmtInt(per)} results`, 'unit')}
        ${svgAt(gX, gY, g.width, g.height + 60, `${drawPieces(items)}${tick(s[0], 'start')}${lastYear ? tick(lastYear, 'middle') : ''}${tick(cur, 'end')}`)}
        <p class="abs lab" style="right:${W - (gX + colX(cur) + size / 2)}px; top:${gY - 62}px; text-align:right"><b>${fmtInt(cur.results)}</b></p>
        ${lastYear ? `<p class="abs lab" style="left:${gX + colX(lastYear) - 60}px; top:${gY + g.height - heights[s.indexOf(lastYear)] * size - 62}px"><b>${fmtInt(lastYear.results)}</b></p>` : ''}
        ${foot(c.source)}`) },
      { id: 'month-3', body: frame(`${top(kick, '3 / 3')}
        <h2 class="h2">You placed ${fmtInt(m.pieces)} pieces in ${MONTH[Number(cur.month.slice(5, 7)) - 1]}</h2>
        ${key(`${fmtInt(ppUnit)} pieces placed`, 'unit')}
        ${svgAt(X0, ppY, ppGrid.width, ppGrid.height, drawPieces(ppItems))}
        ${at(X0, ppY + ppGrid.height + 36, stats.map(st => `<div class="stat"><span class="num">${fmtInt(st.v)}</span><span class="lab">${h(st.label)}${st.rec ? ' · <b>most ever</b>' : ''}</span></div>`).join(''), `width:${CW}px`)}
        <p class="abs cta" style="left:${X0}px; top:${ppY + ppGrid.height + 292}px; width:${CW}px">${h(m.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

const direction: Direction = {
  id: 'D3',
  name: 'Piece Units',
  idea: 'Isotype meets jigsaw: every chart is a partly assembled puzzle cut from one tessellating generator grid, 1 piece = a stated unit, totals printed as numbers, one coral highlight on white.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
