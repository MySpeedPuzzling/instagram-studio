// D6 · Puzzle Mat (warm craft).
// A warm off-white "mat" with a coarse, mean-preserving grain (fixed seed, about ±4% luminance) that shows only
// on the open mat: every text block and chart sits on a clean surface (a tray cell or a mat-coloured block).
// Sorting-tray cells (rounded, navy outline, warm-white well) are the container device: a histogram is a
// row of minute compartments, a proportion is pieces sorted into compartments, a ranking is a tray of slots.
// Coral always carries a navy outline (the warm ground lowers its contrast).
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, flagUrl, pieceGrid, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../types.ts';

const W = 1080, H = 1350, X0 = 88, CW = 904, X1 = X0 + CW;
const MAT = '#f5efe4';
const GUT = 20;              // gutter between tray cells
const R = 24;                // tray cell radius

const css = `
.frame { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${MAT};
  --mat: ${MAT}; --well: #fffbf4; --sand: #e4d5bd; --sand-ink: #b9a17c; --wash: #fde5dc; }
.grain { position: absolute; left: 0; top: 0; }
.clean { background: var(--mat); }
.abs { position: absolute; }
.top { position: absolute; left: ${X0}px; top: 88px; width: ${CW}px; height: 64px; display: flex; align-items: center; gap: 22px; }
.top svg { width: 64px; height: 64px; flex: none; }
.kicker { font-size: 34px; font-weight: 500; color: var(--ink-soft); }
.series { margin-left: auto; font-size: 30px; font-weight: 500; color: var(--ink-muted); letter-spacing: 0.5px; }
.h1 { font-size: 116px; line-height: 0.98; font-weight: 700; letter-spacing: -3px; color: var(--ink); }
.h2 { font-size: 62px; line-height: 1.1; font-weight: 700; letter-spacing: -1.2px; color: var(--ink); }
.dek { font-size: 40px; line-height: 1.28; color: var(--ink-soft); }
.note { font-size: 32px; line-height: 1.3; color: var(--ink-soft); }
.foot { position: absolute; left: ${X0 - 24}px; width: ${CW + 48}px; top: 1196px; height: 90px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
.src { font-size: 30px; color: var(--ink-muted); }
.logo { width: 66px; height: 58px; }
.cell { position: absolute; border: 3px solid var(--ink); border-radius: ${R}px; background: var(--well); }
.cell.hl { background: var(--wash); }
.cell.coral { background: var(--coral-500); }
.t { font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab { font-size: 30px; fill: var(--ink-soft); }
.lab-b { font-size: 34px; font-weight: 700; fill: var(--ink); }
.lab-hl { font-size: 38px; font-weight: 700; fill: var(--indigo-500); }
.big { font-weight: 700; color: var(--ink); letter-spacing: -6px; line-height: 0.9; }
.cta { font-size: 54px; line-height: 1.15; font-weight: 700; color: var(--indigo-500); letter-spacing: -0.5px; }
`;

// ---------------------------------------------------------------------------------------------------------
// Ground: an opaque noise layer whose mean is exactly the mat colour, so clean blocks painted in --mat on top
// of it never show as lighter or darker patches. Luminance only (one noise channel drives R, G and B).
const AMP = 0.16; // slope on the noise channel; measured ≈ ±4% luminance on the ground
function grain(seed = 6) { // one seed for the whole series
  const [r, g, b] = [0xf5, 0xef, 0xe4].map(v => v / 255);
  const f = (base: number) => `type="linear" slope="${AMP}" intercept="${(base - AMP * 0.5).toFixed(4)}"`;
  return `<svg class="grain" width="${W}" height="${H}" aria-hidden="true">
  <filter id="mat-grain" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"/>
    <feComponentTransfer><feFuncR ${f(r)}/><feFuncG ${f(g)}/><feFuncB ${f(b)}/></feComponentTransfer>
  </filter>
  <rect width="${W}" height="${H}" filter="url(#mat-grain)"/>
</svg>`;
}

// Brand device: one coral piece resting in its own tray cell.
const devicePiece = singlePiece(40, 5);
const device = `<svg viewBox="0 0 64 64">
  <rect x="1.5" y="1.5" width="61" height="61" rx="16" fill="var(--well)" stroke="var(--ink)" stroke-width="3"/>
  <svg x="12" y="12" width="40" height="40" viewBox="${devicePiece.viewBox}"><path d="${devicePiece.d}" fill="var(--coral-500)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/></svg>
</svg>`;

const top = (kicker: string, n: string) => `<header class="top clean">${device}<span class="kicker">${h(kicker)}</span><span class="series">${h(n)}</span></header>`;
const foot = (src: string) => `<footer class="foot clean"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const frame = (inner: string) => `<div class="frame">${grain()}${inner}</div>`;
/** A clean (grain-free) block of text on the mat. */
const block = (x: number, y: number, w: number, inner: string, extra = '') => `<div class="abs clean" style="left:${x}px; top:${y}px; width:${w}px; ${extra}">${inner}</div>`;
/** A sorting-tray cell. Coordinates are the outer box (border included). */
const cell = (x: number, y: number, w: number, hgt: number, inner = '', cls = '', extra = '') =>
  `<div class="cell ${cls}" style="left:${x}px; top:${y}px; width:${w}px; height:${hgt}px; ${extra}">${inner}</div>`;

const minus = (v: number, digits = 1) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(digits);
const piecePath = (p: Piece, fill: string, sw = 2.5, extra = '') => `<path d="${p.d}" fill="${fill}" stroke="var(--ink)" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;

/**
 * A block of n assembled pieces taken from the inside of a larger jigsaw, so every piece is an interior piece
 * (tabs on all sides) and neighbours interlock. Filled in reading order: full rows of `cols`, then the rest.
 */
function cluster(n: number, cols: number, s: number, x: number, y: number, seed: number) {
  const c = Math.min(n, cols), rows = Math.ceil(n / cols);
  const grid = pieceGrid({ cols: c + 2, rows: rows + 2, x: x - s, y: y - s, width: (c + 2) * s, height: (rows + 2) * s, seed });
  return grid.filter(p => p.col >= 1 && p.col <= c && p.row >= 1 && p.row <= rows).slice(0, n);
}

// ---------------------------------------------------------------------------------------------------------
function wall(c: Content): Post {
  const w = c.wall;
  const HOUR = 60;
  const isRunUp = (m: number) => m >= HOUR - 5 && m < HOUR;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;
  const yMax = Math.ceil(Math.max(...w.histogram.map(d => d.results)) / 1000) * 1000;

  // Cover: one tray compartment per minute around the hour, filled to the count.
  const mins = w.histogram.filter(d => d.minute >= HOUR - 8 && d.minute <= HOUR + 3);
  const n = mins.length, gap = 14, cw = (CW - (n - 1) * gap) / n, ch = 380, cy = 54;
  const fillH = (v: number) => (v / yMax) * (ch - 6);
  const compartments = mins.map((d, i) => {
    const x = i * (cw + gap);
    const fh = fillH(d.results);
    const hl = isRunUp(d.minute);
    return `<clipPath id="cc${i}"><rect x="${x}" y="${cy}" width="${cw}" height="${ch}" rx="14"/></clipPath>
      <rect x="${x}" y="${cy}" width="${cw}" height="${ch}" rx="14" fill="var(--well)"/>
      <g clip-path="url(#cc${i})"><rect x="${x}" y="${cy + ch - fh}" width="${cw}" height="${fh}" fill="${hl ? 'var(--coral-500)' : 'var(--sand)'}"/>
      <line x1="${x}" x2="${x + cw}" y1="${cy + ch - fh}" y2="${cy + ch - fh}" stroke="var(--ink)" stroke-width="3"/></g>
      <rect x="${x}" y="${cy}" width="${cw}" height="${ch}" rx="14" fill="none" stroke="var(--ink)" stroke-width="3"/>
      <text class="t ${d.minute === HOUR - 1 || d.minute === HOUR ? 'lab-b' : 'lab'}" x="${x + cw / 2}" y="${cy + ch + 46}" text-anchor="middle">${d.minute}</text>`;
  }).join('');
  const iHour = mins.findIndex(d => d.minute === HOUR);
  const wallX = iHour * (cw + gap) - gap / 2;

  // Slide 2: the full distribution in one tray.
  const T2 = { x: X0, y: 410, w: CW, h: 760 };
  const pad = 40, chartW = T2.w - 2 * pad, chartH = 520, top2 = 150;
  const hist = w.histogram;
  const step = chartW / hist.length, bw = step * 0.74;
  const hy = (v: number) => top2 + chartH - (v / yMax) * chartH;
  const bars = hist.map((d, i) => {
    const x = pad + i * step + (step - bw) / 2;
    const hl = isRunUp(d.minute);
    return `<rect x="${x.toFixed(1)}" y="${hy(d.results).toFixed(1)}" width="${bw.toFixed(1)}" height="${(top2 + chartH - hy(d.results)).toFixed(1)}" rx="3" fill="${hl ? 'var(--coral-500)' : 'var(--sand)'}" ${hl ? 'stroke="var(--ink)" stroke-width="2.5"' : ''}/>`;
  }).join('');
  const bx = (m: number) => pad + (m - hist[0].minute) * step + step / 2;
  const wall2 = pad + (HOUR - hist[0].minute) * step;
  const ticks = [40, 50, 60, 70, 80].filter(m => m >= hist[0].minute && m <= hist[hist.length - 1].minute)
    .map((m, i, a) => `<text class="t lab" x="${bx(m) + (i === a.length - 1 ? 8 : 0)}" y="${top2 + chartH + 48}" text-anchor="${i === a.length - 1 ? 'end' : 'middle'}">${i === a.length - 1 ? m + ' min' : m}</text>`).join('');

  // Slide 3: small multiples, one tray cell per round number.
  const checks = [...w.noStepAt, HOUR];
  const c3w = (CW - 2 * GUT) / 3, c3y = 500, c3h = 610;
  const mini = (m: number) => {
    const ms = [m - 3, m - 2, m - 1, m, m + 1, m + 2];
    const mw = c3w - 64, mh = 250, st = mw / ms.length, mbw = st * 0.7;
    const my = (v: number) => mh - (v / yMax) * mh;
    const hl = m === HOUR;
    const marks = ms.map((mm, i) => {
      const x = i * st + (st - mbw) / 2, v = at(mm), on = hl && isRunUp(mm);
      return `<rect x="${x.toFixed(1)}" y="${my(v).toFixed(1)}" width="${mbw.toFixed(1)}" height="${(mh - my(v)).toFixed(1)}" rx="3" fill="${on ? 'var(--coral-500)' : 'var(--sand)'}" ${on ? 'stroke="var(--ink)" stroke-width="2.5"' : ''}/>`;
    }).join('');
    const lx = 3 * st;
    return `<svg width="${mw}" height="${mh + 10}" style="position:absolute; left:29px; top:130px">
      ${marks}
      <line x1="${lx}" x2="${lx}" y1="-14" y2="${mh}" stroke="var(--ink)" stroke-width="${hl ? 5 : 3}" ${hl ? '' : 'stroke-dasharray="8 7"'}/>
      <line x1="0" x2="${mw}" y1="${mh}" y2="${mh}" stroke="var(--ink)" stroke-width="3"/>
    </svg>`;
  };
  const change = (m: number) => ((at(m) - at(m - 1)) / at(m - 1)) * 100;
  const cells3 = checks.map((m, i) => {
    const hl = m === HOUR;
    return cell(X0 + i * (c3w + GUT), c3y, c3w, c3h, `
      <p class="abs" style="left:29px; top:30px; font-size:44px; font-weight:700; color:var(--ink)">${m}:00</p>
      ${mini(m)}
      <p class="abs" style="left:29px; top:420px; font-size:${hl ? 72 : 60}px; font-weight:700; letter-spacing:-2px; color:${hl ? 'var(--ink)' : 'var(--ink-soft)'}">${minus(change(m))}%</p>
      <p class="abs" style="left:29px; top:512px; font-size:30px; color:var(--ink-soft)">${change(m) > 1 ? 'still rising' : change(m) < -1 ? 'the drop' : 'flat'}</p>`, hl ? 'hl' : '');
  }).join('');

  // Slide 4: the wall as a tray divider; compartments sized by share of puzzlers.
  const s = w.subHour, over = s.puzzlers - s.under60;
  const T4 = { y: 690, h: 210 };
  const wallW = 14;
  const leftW = Math.round((CW - wallW) * (s.under60 / s.puzzlers));
  const rightW = CW - wallW - leftW;

  return {
    key: 'wall',
    slides: [
      { id: 'wall-1', body: frame(`${top(w.kicker, 'MSP DATA')}
        ${block(X0, 196, CW, `<h1 class="h1">${h(w.title).replace(/(\S+-\S+)/, '<span style="white-space:nowrap">$1</span>')}</h1><p class="dek" style="margin-top:30px; max-width:840px">${h(w.dek)}</p>`, 'padding-bottom:6px')}
        <svg width="${CW}" height="${ch + 112}" style="position:absolute; left:${X0}px; top:${650}px; background:var(--mat)">
          ${compartments}
          <rect x="${wallX - 5}" y="${cy - 40}" width="10" height="${ch + 40}" rx="3" fill="var(--ink)"/>
          <text class="t lab-b" x="${wallX + 16}" y="${cy - 14}">60:00</text>
        </svg>
        ${foot(c.source)}`) },
      { id: 'wall-2', body: frame(`${top(w.kicker, '2 / 4')}
        ${block(X0, 196, CW, `<h2 class="h2">${w.mode.minute} minutes is the most common finish. Then the counts drop.</h2>`)}
        ${cell(T2.x, T2.y, T2.w, T2.h, `<svg width="${T2.w}" height="${T2.h}" style="position:absolute; left:-3px; top:-3px">
          ${bars}
          <line x1="${pad}" x2="${T2.w - pad}" y1="${top2 + chartH}" y2="${top2 + chartH}" stroke="var(--ink)" stroke-width="3"/>
          <line x1="${wall2}" x2="${wall2}" y1="${top2 - 70}" y2="${top2 + chartH}" stroke="var(--ink)" stroke-width="5"/>
          <text class="t lab-b" x="${bx(w.mode.minute) + 6}" y="${hy(w.mode.results) - 62}" text-anchor="end">${w.mode.minute} min</text>
          <text class="t lab" x="${bx(w.mode.minute) + 6}" y="${hy(w.mode.results) - 22}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
          <text class="t lab-hl" x="${wall2 + 18}" y="${top2 - 34}">${minus(w.dropPct)}% at the hour</text>
          ${ticks}
        </svg>`)}
        ${foot(c.source)}`) },
      { id: 'wall-3', body: frame(`${top(w.kicker, '3 / 4')}
        ${block(X0, 196, CW, `<h2 class="h2">No step at ${w.noStepAt.join(' or ')} minutes. The hour is the line people race for.</h2>
          <p class="note" style="margin-top:22px">Change in finishes from the minute before</p>`)}
        ${cells3}
        ${foot(c.source)}`) },
      { id: 'wall-4', body: frame(`${top(w.kicker, '4 / 4')}
        ${block(X0, 176, CW, `<p class="big" style="font-size:250px">${s.pct}%</p>
          <h2 class="h2" style="margin-top:34px">of 500-piece puzzlers have a personal best under one hour</h2>`)}
        ${cell(X0, T4.y, leftW + 3, T4.h, `<p class="abs" style="left:30px; top:44px; font-size:72px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${fmtInt(s.under60)}</p>`, 'coral', `border-radius:${R}px 0 0 ${R}px; border-right:0`)}
        <div class="abs" style="left:${X0 + leftW}px; top:${T4.y - 34}px; width:${wallW}px; height:${T4.h + 68}px; background:var(--ink); border-radius:4px"></div>
        ${cell(X0 + leftW + wallW - 3, T4.y, rightW + 3, T4.h, `<p class="abs" style="right:30px; top:44px; font-size:72px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${fmtInt(over)}</p>`, '', `border-radius:0 ${R}px ${R}px 0; border-left:0`)}
        ${block(X0, T4.y + T4.h + 26, leftW - 10, `<p class="note">under the hour</p>`)}
        ${block(X0 + leftW + wallW + 10, T4.y + T4.h + 26, rightW - 10, `<p class="note" style="text-align:right">over the hour</p>`)}
        ${block(X0, 1056, CW, `<p class="cta">${h(w.question)}</p>`)}
        ${foot(`${fmtInt(s.puzzlers)} puzzlers with a solo 500 time · ${c.asOf}`)}`) },
    ],
  };
}

function record(c: Content): Post {
  const r = c.record;
  const overall = r.context.match(/\d+:\d{2}(?::\d{2})?/)?.[0] ?? '';
  const overallText = r.context.replace(/^The overall record is [\d:]+, /, '').replace(/\.$/, '');
  const half = (CW - GUT) / 2;
  return { key: 'record', slides: [{ id: 'record-1', body: frame(`${top(r.kicker, 'MSP DATA')}
    ${block(X0, 196, CW, `<h2 class="h2">${h(r.title)}</h2>`)}
    ${cell(X0, 400, CW, 410, `<p class="abs big" style="left:46px; top:58px; font-size:272px">${r.value}</p>
      <p class="abs" style="left:52px; top:316px; font-size:40px; font-weight:700; color:var(--ink)">first try, solo 500 pieces</p>`, 'coral')}
    ${cell(X0, 830, half, 336, `<p class="abs" style="left:34px; top:36px; font-size:88px; font-weight:700; letter-spacing:-3px; color:var(--ink)">${overall}</p>
      <p class="abs note" style="left:34px; top:156px; width:${half - 68}px">overall record, ${h(overallText)}</p>`)}
    ${cell(X0 + half + GUT, 830, half, 336, `<p class="abs" style="left:34px; top:36px; font-size:88px; font-weight:700; letter-spacing:-3px; color:var(--ink)">${fmtInt(r.firstTries)}</p>
      <p class="abs note" style="left:34px; top:156px; width:${half - 68}px">first attempts logged on 500 pieces</p>`)}
    ${foot(c.source)}`) }] };
}

function countries(c: Content): Post {
  const k = c.countries;
  const rh = 64, y0 = 462;
  const trayH = k.top.length * rh + 6;
  const rows = k.top.map((d, i) => `<div class="abs" style="left:0; top:${i * rh}px; width:${CW - 6}px; height:${rh}px; display:flex; align-items:center; padding:0 30px 0 18px;
      ${i ? 'border-top:2px solid var(--sand);' : ''} ${i === 0 ? `background:var(--wash); border-radius:${R - 3}px ${R - 3}px 0 0;` : ''}">
      <span style="width:40px; font-size:32px; font-weight:500; color:var(--ink-soft); text-align:right">${i + 1}</span>
      <img src="${flagUrl(d.code)}" alt="" style="width:42px; height:42px; margin-left:22px">
      <span style="margin-left:18px; font-size:35px; font-weight:${i === 0 ? 700 : 500}; color:var(--ink)">${h(d.name)}</span>
      <span style="margin-left:auto; font-size:38px; font-weight:700; color:var(--ink)">${fmtDuration(d.medianPb)}</span></div>`).join('');
  const [us, all] = k.reference;
  return { key: 'countries', slides: [{ id: 'countries-1', body: frame(`${top('Solo 500 pieces', 'MSP DATA')}
    ${block(X0, 196, CW, `<h2 class="h2">${h(k.title)}</h2><p class="note" style="margin-top:18px">${h(k.dek)}</p>`)}
    ${cell(X0, y0, CW, trayH, rows)}
    ${block(X0, y0 + trayH + 14, CW, `<p class="note" style="padding-left:18px">${h(all.label)}: <b style="color:var(--ink)">${fmtDuration(all.value!)}</b> · ${h(us.label)}: <b style="color:var(--ink)">${fmtDuration(us.value!)}</b></p>`, 'padding:4px 0')}
    ${foot(c.source)}`) }] };
}

function share(c: Content): Post {
  const sh = c.share;
  const s = 40, perRow = 10, padX = 38, padY = 30, lx = padX + perRow * s + 56;
  let y = 392;
  const out: string[] = [];
  sh.units.forEach((u, i) => {
    const rows = Math.max(1, Math.ceil(u.units / perRow));
    const hgt = rows * s + 2 * padY + 6;
    const part = sh.parts.find(p => p.key === u.key)!;
    const hl = i === 0;
    const pieces = cluster(u.units, perRow, s, padX + 4, padY + 4, 30 + i);
    const label = hl
      ? `<div class="abs" style="left:${lx}px; top:40px"><p style="font-size:96px; font-weight:700; letter-spacing:-3px; line-height:1; color:var(--ink)">${part.pct}%</p>
           <p style="font-size:38px; font-weight:500; margin-top:14px; color:var(--ink)">${h(sh.labels[u.key])}</p>
           <p class="note" style="margin-top:6px">${fmtInt(part.results)} results</p></div>`
      : `<div class="abs" style="left:${lx}px; top:0; height:${hgt - 6}px; display:flex; align-items:center; gap:20px">
           <span style="font-size:52px; font-weight:700; letter-spacing:-1.5px; color:var(--ink)">${part.pct}%</span>
           <span class="note">${h(sh.labels[u.key])}</span></div>`;
    out.push(cell(X0, y, CW, hgt, `
      <svg width="${CW}" height="${hgt}" style="position:absolute; left:-3px; top:-3px">${pieces.map(p => piecePath(p, hl ? 'var(--coral-500)' : 'var(--sand)', 2)).join('')}</svg>
      ${label}`));
    y += hgt + 16;
  });
  return { key: 'share', slides: [{ id: 'share-1', body: frame(`${top('Puzzle sizes', 'MSP DATA')}
    ${block(X0, 196, CW, `<h2 class="h2">${h(sh.title)}</h2>`)}
    ${out.join('')}
    ${foot(`1 piece = 1% of ${fmtInt(c.totals.results)} results · ${c.asOf}`)}`) }] };
}

function xp(c: Content): Post {
  const x = c.xp;
  // Edge-first: the finished border of a 5×6 puzzle frames the card; the inside is the empty mat. The four
  // corners (the pieces every puzzler hunts first) are kraft, the rest warm white.
  const cols = 5, rows = 6;
  const jig = generateJigsaw({ cols, rows, width: W, height: H, seed: 23, tabSize: 0.22 });
  const edge = jig.pieces.filter(p => p.col === 0 || p.row === 0 || p.col === cols - 1 || p.row === rows - 1);
  const corner = (p: Piece) => (p.col === 0 || p.col === cols - 1) && (p.row === 0 || p.row === rows - 1);
  const pw = W / cols, ph = H / rows;
  const inner = { x: pw, y: ph, w: W - 2 * pw, h: H - 2 * ph };
  const D = 360, cx = W / 2, cy = inner.y + 108 + D / 2;
  return { key: 'xp', slides: [{ id: 'xp-1', body: `<div class="frame">${grain()}
    ${block(inner.x + 10, inner.y + 30, inner.w - 20, `<p class="kicker" style="text-align:center">${h(x.kicker)}</p>`)}
    ${block(cx - 260, cy + D / 2 + 36, 520, `<p class="h2" style="text-align:center; font-size:58px">${h(x.title)}</p>
      <p class="dek" style="text-align:center; margin-top:14px; font-size:36px">${h(x.dek)}</p>`)}
    <svg width="${W}" height="${H}" style="position:absolute; inset:0">
      ${edge.map(p => piecePath(p, corner(p) ? 'var(--sand)' : 'var(--well)', 3.5)).join('')}
      <circle cx="${cx}" cy="${cy}" r="${D / 2}" fill="var(--coral-500)" stroke="var(--ink)" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${D / 2 - 30}" fill="var(--well)" stroke="var(--ink)" stroke-width="4"/>
    </svg>
    <div class="abs" style="left:${cx - 140}px; top:${cy - 118}px; width:280px; text-align:center">
      <p style="font-size:36px; font-weight:700; color:var(--indigo-500); letter-spacing:8px; padding-left:8px">LEVEL</p>
      <p class="big" style="font-size:200px; letter-spacing:-8px; margin-top:2px">${x.level}</p>
    </div>
    <img class="logo abs" src="${LOGO_URL}" alt="" style="left:${cx - 33}px; top:${inner.y + inner.h - 92}px">
  </div>` }] };
}

const direction: Direction = {
  id: 'D6',
  name: 'Puzzle Mat',
  idea: 'Warm off-white mat with a coarse, quiet grain on the open ground only; sorting-tray cells (rounded, navy-outlined wells) hold every number and chart, coral always outlined in navy.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c)],
};
export default direction;
