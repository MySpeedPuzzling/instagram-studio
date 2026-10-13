// D6 · Puzzle Mat (warm craft).
// A warm off-white "mat" with a coarse, mean-preserving grain (fixed seed, about ±4% luminance) that shows only
// on the open mat: every text block and chart sits on a clean surface (a tray cell or a mat-coloured block).
// Sorting-tray cells (rounded, navy outline, warm-white well) are the container device: a histogram is a
// row of minute compartments, a proportion is pieces sorted into compartments, a ranking is a tray of slots.
// Coral always carries a navy outline (the warm ground lowers its contrast).
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
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

// ---------------------------------------------------------------------------------------------------------
// Series, event, feature and monthly posts: the same mat and trays. A ranking is a tray of slots, people are
// pieces, a split is one tray with a divider, and every slide still keeps its type on a clean surface.
const regionName = new Intl.DisplayNames(['en'], { type: 'region' });
const countryName = (code: string) => (code ? regionName.of(code) ?? code : '');
const pad2 = (n: number) => String(n).padStart(2, '0');
const utc = (iso: string) => new Date(iso.length === 7 ? `${iso}-15T12:00:00Z` : `${iso}T12:00:00Z`);
const monthOf = (iso: string, month: 'long' | 'short' | 'narrow' = 'long') => utc(iso).toLocaleDateString('en-US', { month, timeZone: 'UTC' });
/** A small tray tag: rounded, navy-outlined, on the well. */
const tag = (text: string) => `<span style="display:inline-block; font-size:30px; font-weight:700; color:var(--ink); border:2.5px solid var(--ink); border-radius:999px; padding:0 16px; line-height:42px; background:var(--well)">${h(text)}</span>`;
/** Pieces as a drawing in a cell: sand, or coral for the first `hl`. */
const piecesSvg = (ps: Piece[], w: number, hgt: number, x: number, y: number, hl = 0, sw = 2) =>
  `<svg class="abs" width="${w}" height="${hgt}" style="left:${x}px; top:${y}px">${ps.map((p, i) => piecePath(p, i < hl ? 'var(--coral-500)' : 'var(--sand)', sw)).join('')}</svg>`;

function weekly(c: Content): Post {
  const wk = c.weekly;
  const N = 5, kick = `${wk.series} · Ep ${wk.episode}`;
  const pg = (i: number) => `${i} / ${N}`;

  // 1 · Cover. The coral episode cell is what the profile grid is read by.
  const cy = 556, ch = 610, L = 420, Rw = CW - L - GUT;
  const cover = frame(`${top(`Season ${wk.season}`, 'MSP DATA')}
    ${block(X0, 196, CW, `<h1 class="h1">${h(wk.series)}</h1><p class="dek" style="margin-top:24px">${h(wk.range)}</p>`)}
    ${cell(X0, cy, L, ch, `<p class="abs" style="left:36px; top:40px; font-size:40px; font-weight:700; letter-spacing:6px; color:var(--ink)">EPISODE</p>
      <p class="abs big" style="left:0; width:${L - 6}px; top:200px; text-align:center; font-size:290px; letter-spacing:-12px; padding-right:4px">${pad2(wk.episode)}</p>`, 'coral')}
    ${cell(X0 + L + GUT, cy, Rw, ch, `<p class="abs big" style="left:36px; top:60px; font-size:128px; letter-spacing:-5px">${fmtInt(wk.results)}</p>
      <p class="abs" style="left:36px; top:202px; font-size:40px; font-weight:700; color:var(--ink)">results logged</p>
      <div class="abs" style="left:36px; right:36px; top:300px; height:3px; background:var(--sand)"></div>
      <p class="abs" style="left:36px; top:344px; font-size:84px; font-weight:700; letter-spacing:-2px; color:var(--indigo-500)">${fmtSignedPct(wk.resultsChangePct)}</p>
      <p class="abs note" style="left:36px; top:456px; width:${Rw - 72}px">vs ${fmtInt(wk.resultsPrev)} the week before</p>`)}
    ${foot(c.source)}`);

  // 2 · Top puzzles: a tray of five slots, each with a compartment filled to its solver count.
  const tp = wk.topPuzzles, maxS = Math.max(...tp.map(p => p.solvers));
  const rowH = 134, nameX = 92, barW = CW - 6 - nameX - 150;
  const rows2 = tp.map((p, i) => {
    const hl = i === 0, bw = Math.max(12, (p.solvers / maxS) * barW);
    return `<div class="abs" style="left:0; top:${i * rowH}px; width:${CW - 6}px; height:${rowH}px; ${i ? 'border-top:2px solid var(--sand);' : ''}">
      <p class="abs" style="left:20px; top:22px; width:44px; text-align:right; font-size:32px; font-weight:500; color:var(--ink-soft)">${i + 1}</p>
      <p class="abs" style="left:${nameX}px; top:18px; width:${barW + 20}px; white-space:nowrap"><span style="font-size:36px; font-weight:700; color:var(--ink)">${h(p.puzzle)}</span><span style="font-size:30px; color:var(--ink-soft)">&nbsp; ${h(p.brand)}</span></p>
      <svg class="abs" width="${barW}" height="36" style="left:${nameX}px; top:78px"><rect x="1.5" y="1.5" width="${(bw - 3).toFixed(1)}" height="32" rx="9" fill="${hl ? 'var(--coral-500)' : 'var(--sand)'}" ${hl ? 'stroke="var(--ink)" stroke-width="3"' : ''}/></svg>
      <p class="abs" style="right:30px; top:32px; font-size:58px; font-weight:700; letter-spacing:-1.5px; color:var(--ink)">${p.solvers}</p>
    </div>`;
  }).join('');
  const s2 = frame(`${top(kick, pg(2))}
    ${block(X0, 196, CW, `<h2 class="h2">${h(tp[0].puzzle)} was the most-solved puzzle of the week</h2>
      <p class="note" style="margin-top:18px">Puzzlers who logged each one</p>`)}
    ${cell(X0, 440, CW, tp.length * rowH + 6, rows2)}
    ${foot(c.source)}`);

  // 3 · Fastest of the week: one tray per size, one slot per puzzler (repeat finishes fold into "also").
  type Fast = (typeof wk.fastest500)[number];
  const group = (list: Fast[]) => list.reduce<Array<Fast & { more: string[] }>>((out, f) => {
    const g = out.find(o => o.player === f.player);
    if (g) g.more.push(f.time); else out.push({ ...f, more: [] });
    return out;
  }, []);
  const fastRow = (f: Fast & { more: string[] }, i: number) => {
    const meta = [
      f.firstAttempt ? tag('first try') : '',
      f.handle ? `<span style="font-size:30px; font-weight:700; color:var(--indigo-500)">@${h(f.handle)}</span>` : '',
      f.more.length ? `<span style="font-size:30px; color:var(--ink-soft)">also ${f.more.join(' and ')}</span>` : '',
    ].filter(Boolean);
    return `<div style="display:flex; align-items:center; gap:24px; padding:22px 28px; ${i ? 'border-top:2px solid var(--sand);' : ''}">
      <div style="flex:none; width:252px"><span style="display:inline-block; font-size:58px; font-weight:700; letter-spacing:-1.5px; line-height:1.15; color:var(--ink); border-radius:16px; ${i === 0 ? 'background:var(--coral-500); border:3px solid var(--ink); padding:2px 16px;' : 'padding:2px 19px;'}">${f.time}</span></div>
      <div style="flex:1; min-width:0">
        <p style="display:flex; align-items:center; gap:14px">${f.country ? `<img src="${flagUrl(f.country)}" alt="" style="width:38px; height:38px">` : ''}<span style="font-size:40px; font-weight:700; color:var(--ink)">${h(f.player)}</span>${f.country ? `<span style="font-size:30px; color:var(--ink-soft)">${h(countryName(f.country))}</span>` : ''}</p>
        <p style="font-size:30px; line-height:1.3; color:var(--ink-soft); margin-top:4px">${h(f.puzzle)} · ${h(f.brand)}</p>
        ${meta.length ? `<p style="display:flex; align-items:center; flex-wrap:wrap; gap:8px 18px; margin-top:10px">${meta.join('')}</p>` : ''}
      </div>
    </div>`;
  };
  const section = (label: string, list: Fast[]) => list.length ? `<p style="font-size:34px; font-weight:700; color:var(--ink); padding:0 0 12px 4px">${label}</p>
    <div class="cell" style="position:relative; left:0; top:0">${group(list).map(fastRow).join('')}</div>` : '';
  const s3 = frame(`${top(kick, pg(3))}
    ${block(X0, 196, CW, `<h2 class="h2">Fastest of the week</h2>`)}
    ${block(X0, 304, CW, `${section('Solo 500 pieces', wk.fastest500)}<div style="height:30px"></div>${section('Solo 1,000 pieces', wk.fastest1000)}`)}
    ${foot(c.source)}`);

  // 4 · Personal bests and new puzzlers: the slide itself is a sorting tray of unequal compartments.
  const perRow = 21, ps = 34;
  const newbies = cluster(wk.newPuzzlers, perRow, ps, 0, 0, 41);
  const nRows = Math.ceil(wk.newPuzzlers / perRow);
  const c4y = 316, pbH = 236, nbY = c4y + pbH + GUT, nbH = 112 + nRows * ps + 40, smY = nbY + nbH + GUT, half = (CW - GUT) / 2;
  const s4 = frame(`${top(kick, pg(4))}
    ${block(X0, 196, CW, `<h2 class="h2">The week in numbers</h2>`)}
    ${cell(X0, c4y, CW, pbH, `<p class="abs big" style="left:34px; top:40px; font-size:180px">${fmtInt(wk.personalBests)}</p>
      <p class="abs" style="left:400px; top:58px; font-size:48px; font-weight:700; line-height:1.15; color:var(--ink)">personal bests<br>set this week</p>`, 'coral')}
    ${cell(X0, nbY, CW, nbH, `<p class="abs" style="left:34px; top:30px; font-size:40px; font-weight:700; color:var(--ink)">${fmtInt(wk.newPuzzlers)} new puzzlers joined</p>
      <p class="abs" style="right:34px; top:36px; font-size:30px; color:var(--ink-soft)">1 piece = 1 puzzler</p>
      ${piecesSvg(newbies, perRow * ps + 20, nRows * ps + 20, 40, 106)}`)}
    ${cell(X0, smY, half, 1166 - smY, `<p class="abs" style="left:34px; top:26px; font-size:64px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${fmtInt(wk.puzzlers)}</p>
      <p class="abs note" style="left:34px; top:110px">puzzlers logged a time</p>`)}
    ${cell(X0 + half + GUT, smY, half, 1166 - smY, `<p class="abs" style="left:34px; top:26px; font-size:64px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${fmtInt(wk.pieces)}</p>
      <p class="abs note" style="left:34px; top:110px">pieces in their puzzles</p>`)}
    ${foot(c.source)}`);

  // 5 · The question: one piece is missing from the tray, and it is yours.
  const s5p = 104, cols5 = 6, holeAt = 4, artY = 596, artH = 404;
  const art = cluster(12, cols5, s5p, 64, (artH - 2 * s5p) / 2, 52);
  const hole = art[holeAt];
  const hx = hole.bbox.x + hole.bbox.width / 2, hy = hole.bbox.y + hole.bbox.height / 2;
  const s5 = frame(`${top(kick, pg(5))}
    ${block(X0, 196, CW, `<p class="cta" style="font-size:116px; line-height:1.0; letter-spacing:-3px">${h(wk.question)}</p>`)}
    ${cell(X0, artY, CW, artH, `<svg class="abs" width="${CW}" height="${artH}" style="left:-3px; top:-3px">
      ${art.map((p, i) => i === holeAt ? `<path d="${p.d}" fill="var(--mat)" stroke="var(--ink)" stroke-width="3" stroke-dasharray="10 8" stroke-linejoin="round"/>` : piecePath(p, 'var(--sand)', 2.5)).join('')}
      <g transform="translate(${(CW - 140 - hx).toFixed(1)} ${(artH / 2 - 26 - hy).toFixed(1)}) rotate(-16 ${hx} ${hy})">${piecePath(hole, 'var(--coral-500)', 3.5)}</g>
    </svg>`)}
    ${block(X0, artY + artH + 30, CW, `<p class="dek">Answer in the comments.</p><p class="note" style="margin-top:8px">Episode ${wk.episode + 1} next week.</p>`)}
    ${foot(`${wk.series} · ${wk.range}`)}`);

  return { key: 'weekly', slides: [cover, s2, s3, s4, s5].map((body, i) => ({ id: `weekly-${i + 1}`, body })) };
}

function event(c: Content): Post {
  const e = c.event;
  const [weekday, ...dayMonth] = e.date.split(' ');
  const perRow = 24, ps = 32;
  const crowd = cluster(e.registered, perRow, ps, 0, 0, 61);
  const rows = Math.ceil(e.registered / perRow);
  const dW = 500, cy = 508, cH = 180, py = cy + cH + GUT, pH = 104 + rows * ps + 30;
  const s1 = frame(`${top('Event preview', 'MSP DATA')}
    ${block(X0, 196, CW, `<h1 class="h1" style="font-size:98px; letter-spacing:-2.5px">${h(e.name)}</h1>`)}
    ${cell(X0, cy, dW, cH, `<p class="abs" style="left:34px; top:24px; font-size:40px; font-weight:700; color:var(--ink)">${h(weekday)}</p>
      <p class="abs" style="left:34px; top:74px; font-size:76px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${h(dayMonth.join(' '))}</p>`, 'coral')}
    ${cell(X0 + dW + GUT, cy, CW - dW - GUT, cH, `<p class="abs" style="left:34px; top:24px; font-size:30px; color:var(--ink-soft)">Location</p>
      <p class="abs" style="left:34px; top:72px; width:${CW - dW - GUT - 60}px; font-size:44px; line-height:1.1; font-weight:700; color:var(--ink)">${h(e.location)}</p>`)}
    ${cell(X0, py, CW, pH, `<p class="abs" style="left:34px; top:28px; font-size:48px; font-weight:700; letter-spacing:-1px; color:var(--ink)">${fmtInt(e.registered)} registered</p>
      <p class="abs" style="right:34px; top:40px; font-size:32px; color:var(--ink-soft)"><b style="color:var(--ink)">${fmtInt(e.onMsp)}</b> already on MSP</p>
      ${piecesSvg(crowd, perRow * ps + 20, rows * ps + 20, (CW - 6 - perRow * ps) / 2, 100, e.onMsp, 1.75)}`)}
    ${foot(`1 piece = 1 registered puzzler · ${c.asOf}`)}`);

  // 2 · The question, with the one benchmark we have for it and three empty slots to fill.
  const slotW = 220, slotGap = 64, slotX = (CW - 3 * slotW - 2 * slotGap) / 2;
  const slots = ['h', 'min', 's'].map((u, i) => {
    const x = X0 + slotX + i * (slotW + slotGap);
    return `${cell(x, 930, slotW, 150, '', '', 'background:var(--well); border-style:dashed')}
      ${block(x, 1092, slotW, `<p style="font-size:30px; color:var(--ink-soft); text-align:center">${u}</p>`)}
      ${i ? `<div class="abs" style="left:${x - slotGap / 2 - 7}px; top:982px; width:14px; height:14px; border-radius:50%; background:var(--ink)"></div><div class="abs" style="left:${x - slotGap / 2 - 7}px; top:1016px; width:14px; height:14px; border-radius:50%; background:var(--ink)"></div>` : ''}`;
  }).join('');
  const s2 = frame(`${top('Event preview', '2 / 2')}
    ${block(X0, 196, CW, `<p class="cta" style="font-size:76px; line-height:1.08; letter-spacing:-1.5px">${h(e.question)}</p>`)}
    ${e.usMedianPb ? cell(X0, 480, CW, 360, `<p class="abs note" style="left:36px; top:30px">For scale: the median US personal best</p>
      <p class="abs big" style="left:30px; top:96px; font-size:170px">${e.usMedianPb}</p>
      <p class="abs note" style="left:36px; top:282px">solo 500 pieces, ${fmtInt(e.usPuzzlers ?? 0)} puzzlers in the United States</p>`) : ''}
    ${block(X0, 868, CW, `<p style="font-size:34px; font-weight:700; color:var(--ink); text-align:center">Your goal time</p>`)}
    ${slots}
    ${foot(c.source)}`);
  return { key: 'event', slides: [{ id: 'event-1', body: s1 }, { id: 'event-2', body: s2 }] };
}

function feature(c: Content): Post {
  const f = c.feature;
  const busiest = f.days.reduce((a, b) => (b.results > a.results ? b : a));
  const days = f.days.filter(d => d.day <= busiest.day); // later days are still being logged
  const yMax = Math.ceil(Math.max(...days.map(d => d.results)) / 500) * 500;
  const T = { y: 424, h: 700 }, gutL = 196, padR = 40, cTop = 160, cH = 440;
  const step = (CW - 6 - gutL - padR) / days.length, bw = step * 0.72;
  const yv = (v: number) => cTop + cH - (v / yMax) * cH;
  const xOf = (i: number) => gutL + i * step + (step - bw) / 2;
  const iB = days.indexOf(busiest);
  const bars = days.map((d, i) => {
    const hl = i === iB;
    return `<rect x="${xOf(i).toFixed(1)}" y="${yv(d.results).toFixed(1)}" width="${bw.toFixed(1)}" height="${(cTop + cH - yv(d.results)).toFixed(1)}" rx="3" fill="${hl ? 'var(--coral-500)' : 'var(--sand)'}" ${hl ? 'stroke="var(--ink)" stroke-width="2.5"' : ''}/>`;
  }).join('');
  // Every other day is labelled, phased so the launch day always carries its number.
  const labelled = days.map((d, i) => ({ d, i })).filter(({ i }) => i % 2 === iB % 2);
  const dayNums = labelled.map(({ d, i }) => `<text class="t ${i === iB ? 'lab-b' : 'lab'}" x="${(xOf(i) + bw / 2).toFixed(1)}" y="${cTop + cH + 46}" text-anchor="middle">${utc(d.day).getUTCDate()}</text>`).join('');
  const months = labelled.filter(({ d }, k) => k === 0 || d.day.slice(5, 7) !== labelled[k - 1].d.day.slice(5, 7))
    .map(({ d, i }) => `<text class="t lab" x="${(xOf(i) + bw / 2).toFixed(1)}" y="${cTop + cH + 90}" text-anchor="middle">${monthOf(d.day, 'short')}</text>`).join('');
  const ty = yv(f.typicalDay), bR = xOf(iB) + bw;
  const s1 = frame(`${top(f.kicker, 'MSP DATA')}
    ${block(X0, 196, CW, `<h2 class="h2">${h(f.title)}</h2><p class="note" style="margin-top:18px">Results logged per day</p>`)}
    ${cell(X0, T.y, CW, T.h, `<svg width="${CW}" height="${T.h}" style="position:absolute; left:-3px; top:-3px">
      ${bars}
      <line x1="${gutL}" x2="${xOf(iB) - 8}" y1="${ty}" y2="${ty}" stroke="var(--ink)" stroke-width="3" stroke-dasharray="9 7"/>
      <text class="t lab" x="${gutL - 18}" y="${ty - 8}" text-anchor="end">typical day</text>
      <text class="t lab-b" x="${gutL - 18}" y="${ty + 34}" text-anchor="end">${fmtInt(f.typicalDay)}</text>
      <line x1="${gutL - 4}" x2="${CW - 6 - padR + 4}" y1="${cTop + cH}" y2="${cTop + cH}" stroke="var(--ink)" stroke-width="3"/>
      <text class="t" x="34" y="${cTop - 40}"><tspan style="font-size:112px; font-weight:700; letter-spacing:-4px; fill:var(--indigo-500)">${f.multiple}×</tspan><tspan class="lab" dx="18">a typical day</tspan></text>
      <text class="t lab-b" x="${bR}" y="${cTop - 26}" text-anchor="end">${fmtInt(busiest.results)} on ${utc(busiest.day).getUTCDate()} ${monthOf(busiest.day, 'short')}</text>
      ${dayNums}${months}
    </svg>`)}
    ${foot(c.source)}`);

  // 2 · What launch day was made of: one tray, one divider, sized by share.
  const rest = f.results - f.backfilled, wallW = 14, TY = 690, TH = 210;
  const leftW = Math.round((CW - wallW) * (f.backfilled / f.results)), rightW = CW - wallW - leftW;
  const s2 = frame(`${top(f.kicker, '2 / 2')}
    ${block(X0, 176, CW, `<p class="big" style="font-size:250px">${f.backfilledPct}%</p>
      <h2 class="h2" style="margin-top:34px">of launch-day results were solved over a week earlier</h2>`)}
    ${cell(X0, TY, leftW + 3, TH, `<p class="abs" style="left:30px; top:44px; font-size:72px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${fmtInt(f.backfilled)}</p>`, 'coral', `border-radius:${R}px 0 0 ${R}px; border-right:0`)}
    <div class="abs" style="left:${X0 + leftW}px; top:${TY - 34}px; width:${wallW}px; height:${TH + 68}px; background:var(--ink); border-radius:4px"></div>
    ${cell(X0 + leftW + wallW - 3, TY, rightW + 3, TH, `<p class="abs" style="right:30px; top:44px; font-size:72px; font-weight:700; letter-spacing:-2px; color:var(--ink)">${fmtInt(rest)}</p>`, '', `border-radius:0 ${R}px ${R}px 0; border-left:0`)}
    ${block(X0, TY + TH + 26, leftW - 10, `<p class="note">back-filled</p>`)}
    ${block(X0 + leftW + wallW + 10, TY + TH + 26, rightW - 10, `<p class="note" style="text-align:right">solved that week</p>`)}
    ${block(X0, 1056, CW, `<p class="cta">${h(f.question)}</p>`)}
    ${foot(c.source)}`);
  return { key: 'feature', slides: [{ id: 'feature-1', body: s1 }, { id: 'feature-2', body: s2 }] };
}

function month(c: Content): Post {
  const m = c.month;
  const cur = m.series.find(x => x.results === m.results && x.pieces === m.pieces)!;
  const ym = cur.month, yr = Number(ym.slice(0, 4));
  const lastYear = m.series.find(x => x.month === `${yr - 1}${ym.slice(4)}`);
  const others = m.series.filter(x => x !== cur);
  const runner = others.reduce((a, b) => (b.results > a.results ? b : a));
  const diff = m.results - runner.results;
  const M = monthOf(ym), Rn = monthOf(runner.month) + (runner.month.slice(0, 4) === ym.slice(0, 4) ? '' : ` ${runner.month.slice(0, 4)}`);
  const kick = 'Monthly report';

  // 1 · Cover.
  const s1 = frame(`${top(kick, 'MSP DATA')}
    ${block(X0, 196, CW, `<h1 class="h1">${h(m.title)}</h1>`)}
    ${cell(X0, 580, CW, 330, `<p class="abs big" style="left:34px; top:46px; font-size:190px">${fmtInt(m.results)}</p>
      <p class="abs" style="left:40px; top:250px; font-size:42px; font-weight:700; color:var(--ink)">results logged in ${h(m.label)}</p>`, 'coral')}
    ${lastYear ? cell(X0, 930, CW, 236, `<p class="abs" style="left:34px; top:40px; font-size:110px; font-weight:700; letter-spacing:-4px; line-height:1; color:var(--indigo-500)">${fmtSignedPct(m.vsLastYearPct, 0)}</p>
      <p class="abs note" style="left:380px; top:52px; width:${CW - 420}px">on ${h(M)} ${yr - 1}, when you logged ${fmtInt(lastYear.results)}</p>`) : ''}
    ${foot(c.source)}`);

  // 2 · The series in one tray; the record month is the coral slot.
  const series = m.series, Ty = 424, Th = 700, pad = 40, cTop = 150, cH = 400;
  const yMax = Math.ceil(Math.max(...series.map(s => s.results)) / 5000) * 5000;
  const step = (CW - 6 - 2 * pad) / series.length, bw = step * 0.72;
  const xOf = (i: number) => pad + i * step + (step - bw) / 2;
  const yv = (v: number) => cTop + cH - (v / yMax) * cH;
  const iC = series.indexOf(cur), iR = series.indexOf(runner);
  const bars = series.map((s, i) => {
    const hl = i === iC;
    return `<rect x="${xOf(i).toFixed(1)}" y="${yv(s.results).toFixed(1)}" width="${bw.toFixed(1)}" height="${(cTop + cH - yv(s.results)).toFixed(1)}" rx="3" fill="${hl ? 'var(--coral-500)' : 'var(--sand)'}" ${hl ? 'stroke="var(--ink)" stroke-width="2.5"' : i === iR ? 'stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 5"' : ''}/>`;
  }).join('');
  const initials = series.map((s, i) => `<text class="t ${i === iC ? 'lab-b' : 'lab'}" x="${(xOf(i) + bw / 2).toFixed(1)}" y="${cTop + cH + 46}" text-anchor="middle">${monthOf(s.month, 'narrow')}</text>`).join('');
  const years = series.map((s, i) => ({ s, i })).filter(({ s }) => s.month.endsWith('-01'))
    .map(({ s, i }) => `<text class="t lab" x="${xOf(i).toFixed(1)}" y="${cTop + cH + 90}">${s.month.slice(0, 4)}</text>`).join('');
  const close = diff / runner.results < 0.01;
  const s2 = frame(`${top(kick, '2 / 3')}
    ${block(X0, 196, CW, `<h2 class="h2">${h(M)} edged past ${h(Rn)} by ${close ? 'just ' : ''}${fmtInt(diff)} results</h2><p class="note" style="margin-top:18px">Results logged per month</p>`)}
    ${cell(X0, Ty, CW, Th, `<svg width="${CW}" height="${Th}" style="position:absolute; left:-3px; top:-3px">
      ${bars}
      <line x1="${pad - 4}" x2="${CW - 6 - pad + 4}" y1="${cTop + cH}" y2="${cTop + cH}" stroke="var(--ink)" stroke-width="3"/>
      <text class="t lab-b" x="${xOf(iC) + bw + 4}" y="${yv(cur.results) - 22}" text-anchor="end">${fmtInt(cur.results)}</text>
      <text class="t lab" x="${xOf(iR) + bw / 2}" y="${yv(runner.results) - 22}" text-anchor="middle">${fmtInt(runner.results)}</text>
      ${initials}${years}
    </svg>`)}
    ${foot(c.source)}`);

  // 3 · The other counts, each in its own compartment, tagged when it is also a record.
  const isMax = (k: 'active' | 'newPlayers' | 'pieces') => cur[k] >= Math.max(...others.map(o => o[k]));
  const all = isMax('active') && isMax('newPlayers') && isMax('pieces');
  const half = (CW - GUT) / 2;
  const stat = (x: number, y: number, w: number, value: string, label: string, rec: boolean) => cell(x, y, w, 236, `
    <p class="abs" style="left:34px; top:30px; font-size:80px; font-weight:700; letter-spacing:-2.5px; color:var(--ink)">${value}</p>
    <p class="abs note" style="left:34px; top:142px">${label}</p>
    ${rec && !all ? `<div class="abs" style="left:34px; bottom:26px">${tag('record')}</div>` : ''}`);
  const s3 = frame(`${top(kick, '3 / 3')}
    ${block(X0, 196, CW, `<h2 class="h2">${all ? 'A record on every count' : `${h(M)} in numbers`}</h2>`)}
    ${stat(X0, 316, half, fmtInt(m.active), 'puzzlers logged a time', isMax('active'))}
    ${stat(X0 + half + GUT, 316, half, fmtInt(m.newPlayers), 'new puzzlers joined', isMax('newPlayers'))}
    ${stat(X0, 572, CW, fmtInt(m.pieces), 'pieces in the puzzles you finished', isMax('pieces'))}
    ${block(X0, 880, CW, `<p class="cta" style="font-size:72px; line-height:1.1; letter-spacing:-1.5px">${h(m.question)}</p>`)}
    ${foot(c.source)}`);
  return { key: 'month', slides: [{ id: 'month-1', body: s1 }, { id: 'month-2', body: s2 }, { id: 'month-3', body: s3 }] };
}

const direction: Direction = {
  id: 'D6',
  name: 'Puzzle Mat',
  idea: 'Warm off-white mat with a coarse, quiet grain on the open ground only; sorting-tray cells (rounded, navy-outlined wells) hold every number and chart, coral always outlined in navy.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
