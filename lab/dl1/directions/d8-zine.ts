// D8 · Two-Ink Zine (risograph).
// Off-white paper, exactly two inks: indigo (all type, rules and line work) and coral (fills only, never type).
// Tints are real halftone screens (SVG patterns), never opacity; where the inks cross they multiply into a
// third colour (plum), as on a riso drum. Misregistration is one fixed plate offset (OFF) applied to indigo
// keylines over coral shapes only (the device, the XP pieces, the medallion, the leader's dot): fills and
// screens stay in register, and type, axes and data edges never move.
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, pieceGrid, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw, type Piece } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../types.ts';

const W = 1080, H = 1350, X0 = 88, CW = 904;
const PAPER = '#f6f2e9';
const INK = '#4e54c8';      // indigo
const RED = '#ec726f';      // coral
const OFF = { x: 5, y: 4 }; // plate misregistration, the same everywhere

const css = `
.frame { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${PAPER}; color: ${INK}; }
.abs { position: absolute; }
.mast { position: absolute; left: ${X0}px; top: 88px; width: ${CW}px; height: 64px; display: flex; align-items: center; gap: 20px; }
.mast svg { width: 64px; height: 64px; flex: none; overflow: visible; }
.kick { font-size: 30px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
.pg { margin-left: auto; font-size: 30px; font-weight: 700; letter-spacing: 2px; }
.rule { position: absolute; left: ${X0}px; width: ${CW}px; height: 6px; background: ${INK}; }
.h1 { font-size: 124px; line-height: 0.94; font-weight: 800; letter-spacing: -4px; }
.h2 { font-size: 62px; line-height: 1.06; font-weight: 800; letter-spacing: -1.6px; }
.dek { font-size: 38px; line-height: 1.28; font-style: italic; font-weight: 400; }
.note { font-size: 32px; line-height: 1.3; font-weight: 400; }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1206px; height: 80px; display: flex; align-items: center; justify-content: space-between; border-top: 3px solid ${INK}; }
.src { font-size: 30px; font-weight: 500; }
.logo { width: 62px; height: 55px; filter: url(#duo); }
.t { font-family: Rubik; font-variant-numeric: tabular-nums; fill: ${INK}; }
.lab { font-size: 30px; }
.lab-b { font-size: 34px; font-weight: 700; }
.lab-xl { font-size: 40px; font-weight: 800; }
.mult { mix-blend-mode: multiply; }
.big { font-weight: 800; line-height: 0.88; letter-spacing: -8px; }
`;

// Screens: pitch and dot radius chosen to stay crisp at 1440 px output and through a 4:2:0 re-encode.
const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <pattern id="scrI" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="2.5" fill="${INK}"/></pattern>
  <pattern id="scrI2" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="3.4" fill="${INK}"/></pattern>
  <pattern id="scrO" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="2" fill="${INK}"/></pattern>
  <filter id="duo" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/>
    <feComponentTransfer><feFuncR type="table" tableValues="${(0x4e / 255).toFixed(3)} ${(0xf6 / 255).toFixed(3)}"/><feFuncG type="table" tableValues="${(0x54 / 255).toFixed(3)} ${(0xf2 / 255).toFixed(3)}"/><feFuncB type="table" tableValues="${(0xc8 / 255).toFixed(3)} ${(0xe9 / 255).toFixed(3)}"/></feComponentTransfer>
  </filter>
</defs></svg>`;

/** A coral solid shape overprinted, in register, by a light indigo screen (coral × indigo = plum dots). */
const overprint = (shape: (extra: string) => string) =>
  `${shape(`fill="${RED}"`)}<g class="mult">${shape('fill="url(#scrO)"')}</g>`;
/** Coral fill with an indigo keyline that drifts by the plate offset: the one visible misregistration. */
const drift = (shape: (extra: string) => string, sw = 4) =>
  `${shape(`fill="${RED}"`)}<g class="mult" transform="translate(${-OFF.x} ${-OFF.y})">${shape(`fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`)}</g>`;

// Device: one piece printed in two plates, coral solid and an indigo keyline, slightly off register.
const dp = singlePiece(52, 5);
const device = `<svg viewBox="${dp.viewBox}">
  <path d="${dp.d}" fill="${RED}"/>
  <path class="mult" d="${dp.d}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round" transform="translate(${-OFF.x * 0.8} ${-OFF.y * 0.8})"/>
</svg>`;

const mast = (kicker: string, pg: string) => `${defs}<header class="mast">${device}<span class="kick">${h(kicker)}</span><span class="pg">${h(pg)}</span></header><div class="rule" style="top:174px"></div>`;
const foot = (src: string) => `<footer class="foot"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const frame = (inner: string) => `<div class="frame">${inner}</div>`;
const signed = (v: number, digits = 1) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(digits);

// ---------------------------------------------------------------------------------------------------------
function wall(c: Content): Post {
  const w = c.wall;
  const HOUR = 60;
  const runUp = (m: number) => m >= HOUR - 5 && m < HOUR;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;
  const yMax = Math.ceil(Math.max(...w.histogram.map(d => d.results)) / 1000) * 1000;

  /** Bars in two inks: context bars are a screen tint, run-up bars coral with the drifting screen on top. */
  const inkBars = (data: Array<{ minute: number; results: number }>, width: number, height: number, padding: number) => {
    const step = width / data.length, bw = step * (1 - padding);
    const y = (v: number) => height - (v / yMax) * height;
    const marks = data.map((d, i) => {
      const x = (i * step + (step - bw) / 2).toFixed(1), top = y(d.results).toFixed(1), hh = (height - y(d.results)).toFixed(1);
      const rect = (extra: string) => `<rect x="${x}" y="${top}" width="${bw.toFixed(1)}" height="${hh}" ${extra}/>`;
      return runUp(d.minute) ? overprint(rect) : rect('fill="url(#scrI2)"');
    }).join('');
    const xAt = (m: number) => (m - data[0].minute) * step;
    return { marks, step, xAt, y };
  };

  // Cover teaser: 48–68 minutes.
  const teaser = w.histogram.filter(d => d.minute >= HOUR - 12 && d.minute <= HOUR + 8);
  const tH = 440;
  const tb = inkBars(teaser, CW, tH, 0.2);

  // Slide 2: the full histogram.
  const cH = 560;
  const hb = inkBars(w.histogram, CW, cH, 0.22);
  const x60 = hb.xAt(HOUR);
  const modeX = hb.xAt(w.mode.minute) + hb.step / 2;
  const ticks = [40, 50, 60, 70, 80].map((m, i, a) => `<text class="t lab" x="${hb.xAt(m) + hb.step / 2 + (i === a.length - 1 ? 6 : 0)}" y="${cH + 50}" text-anchor="${i === a.length - 1 ? 'end' : 'middle'}">${i === a.length - 1 ? `${m} min` : m}</text>`).join('');

  // Slide 3: three rows, one per round number.
  const checks = [...w.noStepAt, HOUR];
  const change = (m: number) => ((at(m) - at(m - 1)) / at(m - 1)) * 100;
  const rowH = 232, r0 = 470;
  const rows3 = checks.map((m, i) => {
    const ms = [m - 3, m - 2, m - 1, m, m + 1, m + 2];
    const mw = 300, mh = 150, st = mw / ms.length, bw = st * 0.72;
    const my = (v: number) => mh - (v / yMax) * mh;
    const hl = m === HOUR;
    const marks = ms.map((mm, j) => {
      const rect = (extra: string) => `<rect x="${(j * st + (st - bw) / 2).toFixed(1)}" y="${my(at(mm)).toFixed(1)}" width="${bw.toFixed(1)}" height="${(mh - my(at(mm))).toFixed(1)}" ${extra}/>`;
      return hl && runUp(mm) ? overprint(rect) : rect('fill="url(#scrI2)"');
    }).join('');
    const ch = change(m);
    const word = ch > 1 ? 'still rising' : ch < -1 ? 'the drop' : 'flat';
    const y = r0 + i * rowH;
    return `<div class="abs" style="left:${X0}px; top:${y}px; width:${CW}px; height:${rowH}px; border-top:3px solid ${INK}">
      <p class="abs" style="left:0; top:34px; font-size:60px; font-weight:800; letter-spacing:-1.5px">${m}:00</p>
      <p class="abs note" style="left:0; top:118px; font-style:italic">${word}</p>
      <svg class="abs" width="${mw}" height="${mh + 6}" style="left:290px; top:42px">
        ${marks}
        <line x1="${3 * st}" x2="${3 * st}" y1="-16" y2="${mh}" stroke="${INK}" stroke-width="${hl ? 6 : 3}" ${hl ? '' : 'stroke-dasharray="7 6"'}/>
        <line x1="0" x2="${mw}" y1="${mh + 1.5}" y2="${mh + 1.5}" stroke="${INK}" stroke-width="3"/>
      </svg>
      <p class="abs" style="right:0; top:${hl ? 30 : 44}px; font-size:${hl ? 96 : 64}px; font-weight:800; letter-spacing:-2px; text-align:right">${signed(ch)}%</p>
    </div>`;
  }).join('');

  // Slide 4: one bar split by the wall.
  const s = w.subHour, over = s.puzzlers - s.under60;
  const bY = 700, bH = 170, gapW = 14;
  const leftW = Math.round((CW - gapW) * (s.under60 / s.puzzlers));
  const split = `<svg class="abs" width="${CW}" height="${bH + 90}" style="left:${X0}px; top:${bY - 46}px">
    <g transform="translate(0 46)">
      ${overprint(extra => `<rect x="0" y="0" width="${leftW}" height="${bH}" ${extra}/>`)}
      <rect x="${leftW + gapW}" y="0" width="${CW - leftW - gapW}" height="${bH}" fill="url(#scrI2)"/>
      <rect x="${leftW + 2}" y="-46" width="${gapW - 4}" height="${bH + 82}" fill="${INK}"/>
    </g>
    <text class="t lab-b" x="${leftW + gapW + 8}" y="30">60:00</text>
  </svg>`;

  return {
    key: 'wall',
    slides: [
      { id: 'wall-1', body: frame(`${mast(w.kicker, 'MSP DATA')}
        <h1 class="h1 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(w.title).replace(/(\S+-\S+)/, '<span style="white-space:nowrap">$1</span>')}</h1>
        <p class="dek abs" style="left:${X0}px; top:478px; width:820px">${h(w.dek)}</p>
        <svg class="abs" width="${CW}" height="${tH + 60}" style="left:${X0}px; top:690px">
          <g transform="translate(0 0)">${tb.marks}</g>
          <rect x="${tb.xAt(HOUR) - 5}" y="-48" width="10" height="${tH + 48}" fill="${INK}"/>
          <line x1="0" x2="${CW}" y1="${tH + 1.5}" y2="${tH + 1.5}" stroke="${INK}" stroke-width="3"/>
          <text class="t lab-b" x="${tb.xAt(HOUR) + 16}" y="-18">60:00</text>
        </svg>
        ${foot(c.source)}`) },
      { id: 'wall-2', body: frame(`${mast(w.kicker, '2 / 4')}
        <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${w.mode.minute} minutes is the most common finish. Then the counts drop.</h2>
        <svg class="abs" width="${CW}" height="${cH + 70}" style="left:${X0}px; top:520px">
          ${hb.marks}
          <line x1="0" x2="${CW}" y1="${cH + 1.5}" y2="${cH + 1.5}" stroke="${INK}" stroke-width="3"/>
          <rect x="${x60 - 3}" y="-50" width="6" height="${cH + 50}" fill="${INK}"/>
          <text class="t lab-b" x="${modeX + 8}" y="${hb.y(w.mode.results) - 64}" text-anchor="end">${w.mode.minute} min</text>
          <text class="t lab" x="${modeX + 8}" y="${hb.y(w.mode.results) - 24}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
          <text class="t lab-xl" x="${x60 + 18}" y="-14">${signed(w.dropPct)}% at the hour</text>
          ${ticks}
        </svg>
        ${foot(c.source)}`) },
      { id: 'wall-3', body: frame(`${mast(w.kicker, '3 / 4')}
        <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">No step at ${w.noStepAt.join(' or ')} minutes. The hour is the line people race for.</h2>
        <p class="note abs" style="left:${X0 + 290}px; top:${r0 - 50}px; font-style:italic">finishes per minute</p>
        <p class="note abs" style="right:${W - X0 - CW}px; top:${r0 - 50}px; font-style:italic">vs minute before</p>
        ${rows3}
        ${foot(c.source)}`) },
      { id: 'wall-4', body: frame(`${mast(w.kicker, '4 / 4')}
        <p class="big abs" style="left:${X0}px; top:214px; font-size:260px">${s.pct}%</p>
        <h2 class="h2 abs" style="left:${X0}px; top:470px; width:${CW}px">of 500-piece puzzlers have a personal best under one hour</h2>
        ${split}
        <p class="note abs" style="left:${X0}px; top:${bY + bH + 22}px"><b style="font-weight:800">${fmtInt(s.under60)}</b> under the hour</p>
        <p class="note abs" style="right:${W - X0 - CW}px; top:${bY + bH + 22}px; text-align:right"><b style="font-weight:800">${fmtInt(over)}</b> over</p>
        <p class="abs" style="left:${X0}px; top:1030px; width:720px; font-size:60px; line-height:1.08; font-weight:800; letter-spacing:-1.5px">${h(w.question)}</p>
        ${foot(`${fmtInt(s.puzzlers)} puzzlers with a solo 500 time · ${c.asOf}`)}`) },
    ],
  };
}

function record(c: Content): Post {
  const r = c.record;
  const overall = r.context.match(/\d+:\d{2}(?::\d{2})?/)?.[0] ?? '';
  const overallText = r.context.replace(/^The overall record is [\d:]+, /, '').replace(/\.$/, '');
  const slab = `<svg class="abs" width="${CW}" height="60" style="left:${X0}px; top:524px">${overprint(e => `<rect x="0" y="0" width="${CW}" height="40" ${e}/>`)}</svg>`;
  return { key: 'record', slides: [{ id: 'record-1', body: frame(`${mast(r.kicker, 'MSP DATA')}
    <p class="big abs" style="left:${X0}px; top:228px; font-size:310px">${r.value}</p>
    ${slab}
    <h2 class="h2 abs" style="left:${X0}px; top:640px; width:${CW}px">${h(r.title)}</h2>
    <div class="abs" style="left:${X0}px; top:880px; width:${CW}px; display:grid; grid-template-columns:1fr 1fr; column-gap:44px; border-top:3px solid ${INK}; padding-top:32px">
      <div><p style="font-size:92px; font-weight:800; letter-spacing:-2.5px; line-height:1">${overall}</p><p class="note" style="margin-top:16px">overall record, ${h(overallText)}</p></div>
      <div><p style="font-size:92px; font-weight:800; letter-spacing:-2.5px; line-height:1">${fmtInt(r.firstTries)}</p><p class="note" style="margin-top:16px">first attempts logged on 500 pieces</p></div>
    </div>
    ${foot(c.source)}`) }] };
}

function countries(c: Content): Post {
  const k = c.countries;
  const [us, all] = k.reference;
  const lo = 45, hi = 70;
  const tx0 = 300, tw = CW - tx0 - 150; // track
  const sx = (v: number) => tx0 + ((v - lo) / (hi - lo)) * tw;
  const rh = 58, y0 = 64;
  const rows = k.top.map((d, i) => {
    const y = y0 + i * rh + rh / 2, hl = i === 0;
    return `<line x1="${tx0}" x2="${tx0 + tw}" y1="${y}" y2="${y}" stroke="url(#scrI2)" stroke-width="8"/>
      ${hl ? drift(e => `<circle cx="${sx(d.medianPb)}" cy="${y}" r="21" ${e}/>`) : `<circle cx="${sx(d.medianPb)}" cy="${y}" r="14" fill="${INK}"/>`}
      <text class="t lab-b" x="${CW}" y="${y + 12}" text-anchor="end" style="font-weight:${hl ? 800 : 600}">${fmtDuration(d.medianPb)}</text>`;
  }).join('');
  const names = k.top.map((d, i) => `<p class="abs" style="left:0; top:${y0 + i * rh + (rh - 40) / 2}px; font-size:34px; line-height:40px; font-weight:${i === 0 ? 800 : 500}">${h(d.name)}</p>`).join('');
  const bottom = y0 + k.top.length * rh;
  const ref = (v: number, label: string, solid: boolean, anchor: string) => `<line x1="${sx(v)}" x2="${sx(v)}" y1="${y0 - 40}" y2="${bottom}" stroke="${INK}" stroke-width="${solid ? 6 : 3}" ${solid ? '' : 'stroke-dasharray="8 7"'}/>
      <text class="t lab" x="${sx(v) + (anchor === 'start' ? 12 : -12)}" y="${y0 - 16}" text-anchor="${anchor}" style="font-weight:${solid ? 700 : 400}">${label}</text>`;
  return { key: 'countries', slides: [{ id: 'countries-1', body: frame(`${mast('Solo 500 pieces', 'MSP DATA')}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(k.title)}</h2>
    <p class="note abs" style="left:${X0}px; top:368px; width:${CW}px; font-style:italic">${h(k.dek)}</p>
    <div class="abs" style="left:${X0}px; top:456px; width:${CW}px; height:${bottom}px">
      ${names}
      <svg class="abs" width="${CW}" height="${bottom}" style="left:0; top:0">
        ${ref(60, '60:00', true, 'end')}
        ${ref(all.value!, all.label, false, 'start')}
        ${rows}
      </svg>
    </div>
    <p class="note abs" style="left:${X0}px; top:${456 + bottom + 18}px">${h(all.label)}: <b style="font-weight:800">${fmtDuration(all.value!)}</b> · ${h(us.label)}: <b style="font-weight:800">${fmtDuration(us.value!)}</b></p>
    ${foot(c.source)}`) }] };
}

function share(c: Content): Post {
  const sh = c.share;
  const main = sh.parts[0];
  const quarters = Math.round(main.pct / 25);
  const size = 520;
  const pieces = pieceGrid({ cols: 2, rows: 2, x: 0, y: 0, width: size, height: size, seed: 19, tabSize: 0.26 });
  const art = pieces.map((p, i) => {
    const path = (e: string) => `<path d="${p.d}" ${e}/>`;
    return i < quarters ? overprint(path) : path('fill="url(#scrI)"');
  }).join('') + `<g class="mult" transform="translate(${-OFF.x} ${-OFF.y})">${pieces.map(p => `<path d="${p.d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`).join('')}</g>`;
  const rest = sh.parts.slice(1);
  const lx = X0 + size + 48, lw = CW - size - 48;
  return { key: 'share', slides: [{ id: 'share-1', body: frame(`${mast('Puzzle sizes', 'MSP DATA')}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(sh.title)}</h2>
    <svg class="abs" width="${size}" height="${size}" style="left:${X0}px; top:470px">${art}</svg>
    <div class="abs" style="left:${lx}px; top:470px; width:${lw}px">
      <p style="font-size:96px; font-weight:800; letter-spacing:-3px; line-height:0.95">${main.pct}%</p>
      <p style="font-size:36px; font-weight:700; margin-top:10px">${h(sh.labels[main.key])}</p>
      <div style="margin-top:40px; border-top:3px solid ${INK}; padding-top:22px">
        ${rest.map(p => `<p class="note" style="display:flex; justify-content:space-between; margin-top:8px"><span>${h(sh.labels[p.key])}</span><b style="font-weight:800">${p.pct}%</b></p>`).join('')}
      </div>
    </div>
    <p class="note abs" style="left:${X0}px; top:1036px; width:${CW}px; font-style:italic">Of all ${fmtInt(c.totals.results)} results on MySpeedPuzzling, by puzzle size. Each piece is a quarter.</p>
    ${foot(c.source)}`) }] };
}

function xp(c: Content): Post {
  const x = c.xp;
  const members = x.distribution.find(d => d.level === x.level)?.players ?? 0;
  const n = Math.min(members, 16);
  // One interior piece per member, cut from one jigsaw, set in a ring around the medallion.
  const ps = 122;
  const jig = generateJigsaw({ cols: 6, rows: 5, width: 6 * ps, height: 5 * ps, seed: 31, tabSize: 0.24 });
  const pool = jig.pieces.filter(p => p.col > 0 && p.col < 5 && p.row > 0 && p.row < 4);
  const cx = W / 2, cy = 596, ringR = 306, D = 380;
  const ring = Array.from({ length: n }, (_, i) => {
    const p: Piece = pool[i % pool.length];
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const px = cx + ringR * Math.cos(a), py = cy + ringR * Math.sin(a);
    const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
    const t = `translate(${(px - pcx).toFixed(1)} ${(py - pcy).toFixed(1)}) rotate(${((a * 180) / Math.PI + 90).toFixed(1)} ${pcx} ${pcy})`;
    // Fill in register; the keyline plate drifts by the same sheet-wide offset, outside the piece's rotation.
    return `<path d="${p.d}" transform="${t}" fill="${RED}"/>
      <g class="mult" transform="translate(${-OFF.x} ${-OFF.y})"><path d="${p.d}" transform="${t}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></g>`;
  }).join('');
  return { key: 'xp', slides: [{ id: 'xp-1', body: frame(`${defs}
    <p class="kick abs" style="left:${X0}px; top:96px; width:${CW}px; text-align:center">${h(x.kicker)}</p>
    <svg class="abs" width="${W}" height="${H}" style="left:0; top:0">
      ${ring}
      <circle cx="${cx}" cy="${cy}" r="${D / 2}" fill="url(#scrI2)"/>
      <circle cx="${cx}" cy="${cy}" r="${D / 2 - 24}" fill="${RED}"/>
      <circle cx="${cx}" cy="${cy}" r="${D / 2 - 52}" fill="${PAPER}"/>
      <g class="mult" transform="translate(${-OFF.x} ${-OFF.y})" fill="none" stroke="${INK}" stroke-width="4">
        <circle cx="${cx}" cy="${cy}" r="${D / 2 - 24}"/><circle cx="${cx}" cy="${cy}" r="${D / 2 - 52}"/></g>
    </svg>
    <div class="abs" style="left:${cx - 140}px; top:${cy - 112}px; width:280px; text-align:center">
      <p style="font-size:34px; font-weight:800; letter-spacing:8px; padding-left:8px">LEVEL</p>
      <p class="big" style="font-size:190px; letter-spacing:-8px; margin-top:4px">${x.level}</p>
    </div>
    <h2 class="h2 abs" style="left:${X0}px; top:1030px; width:${CW}px; text-align:center; font-size:68px">${h(x.title)}</h2>
    <p class="dek abs" style="left:${X0}px; top:1108px; width:${CW}px; text-align:center">${h(x.dek)}</p>
    <p class="note abs" style="left:${X0}px; top:1168px; width:${CW}px; text-align:center">1 piece = 1 puzzler</p>
    <img class="logo abs" src="${LOGO_URL}" alt="" style="left:${X0 + CW - 62}px; top:96px">
  `) }] };
}

const direction: Direction = {
  id: 'D8',
  name: 'Two-Ink Zine',
  idea: 'Risograph data zine: off-white paper, indigo for every word and rule, coral only as fill, tints as halftone screens, inks overprint into plum; one fixed plate drift on decorative passes only.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c)],
};
export default direction;
