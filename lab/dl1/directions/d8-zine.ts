// D8 · Two-Ink Zine (risograph).
// Off-white paper, exactly two inks: indigo (all type, rules and line work) and coral (fills only, never type).
// Tints are real halftone screens (SVG patterns), never opacity; where the inks cross they multiply into a
// third colour (plum), as on a riso drum. Misregistration is one fixed plate offset (OFF) applied to indigo
// keylines over coral shapes only (the device, the XP pieces, the medallion, the leader's dot): fills and
// screens stay in register, and type, axes and data edges never move.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
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

// ---------------------------------------------------------------------------------------------------------
// Series, event, feature and monthly posts in the same two inks. Rules divide, screens tint, coral marks the one
// thing that matters on each slide (overprinted where it is data, drifting keyline only where it is ornament).
const regionName = new Intl.DisplayNames(['en'], { type: 'region' });
const countryName = (code: string) => (code ? regionName.of(code) ?? code : '');
const pad2 = (n: number) => String(n).padStart(2, '0');
const utc = (iso: string) => new Date(iso.length === 7 ? `${iso}-15T12:00:00Z` : `${iso}T12:00:00Z`);
const monthOf = (iso: string, month: 'long' | 'short' | 'narrow' = 'long') => utc(iso).toLocaleDateString('en-US', { month, timeZone: 'UTC' });
/** The coral overprint slab (as on the record post). */
const slab = (x: number, y: number, w: number, hgt = 40) =>
  `<svg class="abs" width="${w}" height="${hgt}" style="left:${x}px; top:${y}px">${overprint(e => `<rect x="0" y="0" width="${w}" height="${hgt}" ${e}/>`)}</svg>`;
/** n interior pieces cut from one jigsaw, in reading order, so neighbours interlock. */
function cluster(n: number, cols: number, s: number, x: number, y: number, seed: number) {
  const c = Math.min(n, cols), rows = Math.ceil(n / cols);
  const grid = pieceGrid({ cols: c + 2, rows: rows + 2, x: x - s, y: y - s, width: (c + 2) * s, height: (rows + 2) * s, seed });
  return grid.filter(p => p.col >= 1 && p.col <= c && p.row >= 1 && p.row <= rows).slice(0, n);
}
/** A unit grid of circles in reading order; the first `hl` are solid coral, the rest indigo rings. */
function units(n: number, cols: number, pitch: number, r: number, hl: number) {
  const at = (i: number) => ({ cx: (i % cols) * pitch + pitch / 2, cy: Math.floor(i / cols) * pitch + pitch / 2 });
  const coral = Array.from({ length: Math.min(hl, n) }, (_, i) => at(i));
  const rings = Array.from({ length: Math.max(0, n - hl) }, (_, i) => at(i + hl));
  return coral.map(p => `<circle cx="${p.cx}" cy="${p.cy}" r="${r + 1}" fill="${RED}"/>`).join('')
    + rings.map(p => `<circle cx="${p.cx}" cy="${p.cy}" r="${r - 1}" fill="none" stroke="${INK}" stroke-width="2.5"/>`).join('');
}
const legendDot = `<svg width="30" height="30" style="display:inline-block; vertical-align:-4px; margin-right:10px; overflow:visible"><circle cx="15" cy="15" r="13" fill="${RED}"/></svg>`;

function weekly(c: Content): Post {
  const wk = c.weekly;
  const N = 5, kick = `${wk.series} · Ep ${wk.episode}`;
  const pg = (i: number) => `${i} / ${N}`;

  // 1 · Cover: an issue number, set big, with the record-post slab under it.
  const colW = 470, rx = X0 + colW + 44;
  const s1 = frame(`${mast(`Season ${wk.season}`, 'MSP DATA')}
    <h1 class="h1 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(wk.series)}</h1>
    <p class="dek abs" style="left:${X0}px; top:478px">${h(wk.range)}</p>
    <div class="abs" style="left:${X0}px; top:572px; width:${CW}px; height:3px; background:${INK}"></div>
    <p class="kick abs" style="left:${X0}px; top:612px">Episode</p>
    <p class="big abs" style="left:${X0}px; top:676px; font-size:350px; letter-spacing:-16px">${pad2(wk.episode)}</p>
    ${slab(X0, 1030, colW - 30)}
    <div class="abs" style="left:${rx - 26}px; top:600px; width:3px; height:470px; background:${INK}"></div>
    <div class="abs" style="left:${rx}px; top:612px; width:${X0 + CW - rx}px">
      <p style="font-size:112px; font-weight:800; letter-spacing:-4px; line-height:0.9">${fmtInt(wk.results)}</p>
      <p class="note" style="margin-top:20px">results logged</p>
      <p style="font-size:92px; font-weight:800; letter-spacing:-2.5px; line-height:1; margin-top:96px">${fmtSignedPct(wk.resultsChangePct)}</p>
      <p class="note" style="margin-top:16px; font-style:italic">vs ${fmtInt(wk.resultsPrev)} the week before</p>
    </div>
    ${foot(c.source)}`);

  // 2 · Top puzzles: ruled rows, a screened bar each, the leader overprinted.
  const tp = wk.topPuzzles, maxS = Math.max(...tp.map(p => p.solvers));
  const rowH = 136, r0 = 446, barX = 64, barW = CW - barX - 150;
  const rows2 = tp.map((p, i) => {
    const bw = Math.max(12, (p.solvers / maxS) * barW);
    const rect = (e: string) => `<rect x="0" y="0" width="${bw.toFixed(1)}" height="30" ${e}/>`;
    return `<div class="abs" style="left:${X0}px; top:${r0 + i * rowH}px; width:${CW}px; height:${rowH}px; border-top:3px solid ${INK}">
      <p class="abs" style="left:0; top:22px; font-size:34px; font-weight:800">${i + 1}</p>
      <p class="abs" style="left:${barX}px; top:20px; width:${barW + 20}px; white-space:nowrap"><span style="font-size:38px; font-weight:800">${h(p.puzzle)}</span><span style="font-size:30px; font-style:italic">&nbsp; ${h(p.brand)}</span></p>
      <svg class="abs" width="${barW}" height="30" style="left:${barX}px; top:84px">${i === 0 ? overprint(rect) : rect('fill="url(#scrI2)"')}</svg>
      <p class="abs" style="right:0; top:32px; font-size:66px; font-weight:800; letter-spacing:-2px">${p.solvers}</p>
    </div>`;
  }).join('');
  const s2 = frame(`${mast(kick, pg(2))}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(tp[0].puzzle)} was the most-solved puzzle of the week</h2>
    <p class="note abs" style="left:${X0}px; top:372px; font-style:italic">Puzzlers who logged each one</p>
    ${rows2}
    <div class="abs" style="left:${X0}px; top:${r0 + tp.length * rowH}px; width:${CW}px; height:3px; background:${INK}"></div>
    ${foot(c.source)}`);

  // 3 · Fastest of the week: an honour roll. Repeat finishes by one puzzler fold into "also".
  type Fast = (typeof wk.fastest500)[number];
  const group = (list: Fast[]) => list.reduce<Array<Fast & { more: string[] }>>((out, f) => {
    const g = out.find(o => o.player === f.player);
    if (g) g.more.push(f.time); else out.push({ ...f, more: [] });
    return out;
  }, []);
  const fastRow = (f: Fast & { more: string[] }, i: number) => {
    const meta = [
      f.firstAttempt ? `<span style="font-size:30px; font-weight:700">${legendDot}first try</span>` : '',
      f.handle ? `<span style="font-size:30px; font-weight:700">@${h(f.handle)}</span>` : '',
      f.more.length ? `<span style="font-size:30px; font-style:italic">also ${f.more.join(' and ')}</span>` : '',
    ].filter(Boolean);
    return `<div style="display:flex; gap:26px; padding:22px 0 24px; border-top:3px solid ${INK}">
      <div style="flex:none; width:262px"><div style="display:inline-block; position:relative">
        <p style="font-size:62px; font-weight:800; letter-spacing:-2px; line-height:1">${f.time}</p>
        ${i === 0 ? `<svg height="16" style="position:absolute; left:0; bottom:-26px; width:100%">${overprint(e => `<rect x="0" y="0" width="100%" height="16" ${e}/>`)}</svg>` : ''}
      </div></div>
      <div style="flex:1; min-width:0">
        <p><span style="font-size:40px; font-weight:800">${h(f.player)}</span>${f.country ? `<span style="font-size:30px; font-style:italic">&nbsp; ${h(countryName(f.country))}</span>` : ''}</p>
        <p style="font-size:30px; line-height:1.3; margin-top:4px">${h(f.puzzle)} · ${h(f.brand)}</p>
        ${meta.length ? `<p style="display:flex; flex-wrap:wrap; align-items:center; gap:8px 24px; margin-top:10px">${meta.join('')}</p>` : ''}
      </div>
    </div>`;
  };
  const section = (label: string, list: Fast[]) => list.length
    ? `<p class="kick" style="padding-bottom:14px">${label}</p>${group(list).map(fastRow).join('')}` : '';
  const s3 = frame(`${mast(kick, pg(3))}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">Fastest of the week</h2>
    <div class="abs" style="left:${X0}px; top:330px; width:${CW}px">
      ${section('Solo 500 pieces', wk.fastest500)}<div style="height:34px"></div>${section('Solo 1,000 pieces', wk.fastest1000)}
    </div>
    ${foot(c.source)}`);

  // 4 · The week in numbers: personal bests on the slab, new puzzlers as a unit grid, the totals ruled off.
  const perRow = 24, pitch = 36;
  const nRows = Math.ceil(wk.newPuzzlers / perRow);
  const s4 = frame(`${mast(kick, pg(4))}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">The week in numbers</h2>
    <p class="big abs" style="left:${X0}px; top:330px; font-size:210px">${fmtInt(wk.personalBests)}</p>
    <div class="abs" style="left:${X0 + 440}px; top:350px; width:${CW - 440}px"><p class="h2">personal bests</p><p class="dek" style="margin-top:8px">set this week</p></div>
    ${slab(X0, 540, CW, 34)}
    <div class="abs" style="left:${X0}px; top:612px; width:${CW}px; border-top:3px solid ${INK}; padding-top:24px">
      <p style="display:flex; justify-content:space-between; align-items:baseline"><span style="font-size:40px; font-weight:800">${fmtInt(wk.newPuzzlers)} new puzzlers joined</span><span class="note" style="font-size:30px; font-style:italic">1 dot = 1 puzzler</span></p>
      <svg width="${perRow * pitch}" height="${nRows * pitch}" style="margin:22px 0 0 ${(CW - perRow * pitch) / 2}px">${units(wk.newPuzzlers, perRow, pitch, 12, wk.newPuzzlers)}</svg>
    </div>
    <div class="abs" style="left:${X0}px; top:${612 + 110 + nRows * pitch + 40}px; width:${CW}px; display:grid; grid-template-columns:1fr 1fr; column-gap:44px; border-top:3px solid ${INK}; padding-top:26px">
      <div><p style="font-size:80px; font-weight:800; letter-spacing:-2.5px; line-height:1">${fmtInt(wk.puzzlers)}</p><p class="note" style="margin-top:12px">puzzlers logged a time</p></div>
      <div><p style="font-size:80px; font-weight:800; letter-spacing:-2.5px; line-height:1">${fmtInt(wk.pieces)}</p><p class="note" style="margin-top:12px">pieces in their puzzles</p></div>
    </div>
    ${foot(c.source)}`);

  // 5 · The question: one piece lifted out of the sheet, printed in coral, off register like the masthead.
  const ps = 110, holeAt = 4, artW = CW, artH = 380;
  const art = cluster(12, 6, ps, 40, (artH - 2 * ps) / 2, 52);
  const hole = art[holeAt];
  const hx = hole.bbox.x + hole.bbox.width / 2, hy = hole.bbox.y + hole.bbox.height / 2;
  const lift = `translate(${(artW - 120 - hx).toFixed(1)} ${(artH / 2 - 20 - hy).toFixed(1)}) rotate(-16 ${hx} ${hy})`;
  const s5 = frame(`${mast(kick, pg(5))}
    <p class="abs" style="left:${X0}px; top:222px; width:${CW}px; font-size:112px; line-height:0.98; font-weight:800; letter-spacing:-3.5px">${h(wk.question)}</p>
    <svg class="abs" width="${artW}" height="${artH}" style="left:${X0}px; top:600px">
      ${art.map((p, i) => i === holeAt ? '' : `<path d="${p.d}" fill="url(#scrI)"/>`).join('')}
      <g transform="${lift}"><path d="${hole.d}" fill="${RED}"/></g>
      <g class="mult" transform="translate(${-OFF.x} ${-OFF.y})" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
        ${art.map((p, i) => `<path d="${p.d}" ${i === holeAt ? 'stroke-dasharray="10 8"' : ''}/>`).join('')}
        <g transform="${lift}"><path d="${hole.d}"/></g>
      </g>
    </svg>
    <p class="dek abs" style="left:${X0}px; top:1028px">Answer in the comments.</p>
    <p class="note abs" style="left:${X0}px; top:1084px">Episode ${wk.episode + 1} next week.</p>
    ${foot(`${wk.series} · ${wk.range}`)}`);

  return { key: 'weekly', slides: [s1, s2, s3, s4, s5].map((body, i) => ({ id: `weekly-${i + 1}`, body })) };
}

function event(c: Content): Post {
  const e = c.event;
  const [weekday, day, ...monthName] = e.date.split(' ');
  const cols = 30, pitch = 29.6, rows = Math.ceil(e.registered / cols);
  const gy = 900;
  const s1 = frame(`${mast('Event preview', 'MSP DATA')}
    <h1 class="h1 abs" style="left:${X0}px; top:222px; width:${CW}px; font-size:100px; letter-spacing:-3px">${h(e.name)}</h1>
    <div class="abs" style="left:${X0}px; top:548px; width:${CW}px; height:3px; background:${INK}"></div>
    <p class="big abs" style="left:${X0}px; top:584px; font-size:220px">${h(day)}</p>
    <div class="abs" style="left:${X0 + 300}px; top:592px; width:${CW - 300}px">
      <p class="h2">${h(monthName.join(' '))}</p>
      <p class="dek" style="margin-top:6px">${h(weekday)}</p>
      <p class="note" style="margin-top:14px; font-weight:700">${h(e.location)}</p>
    </div>
    <div class="abs" style="left:${X0}px; top:${gy - 106}px; width:${CW}px; border-top:3px solid ${INK}; padding-top:22px; display:flex; justify-content:space-between; align-items:baseline">
      <span style="font-size:48px; font-weight:800; letter-spacing:-1px">${fmtInt(e.registered)} registered</span>
      <span style="font-size:32px; font-weight:700">${legendDot}${fmtInt(e.onMsp)} already on MSP</span>
    </div>
    <svg class="abs" width="${cols * pitch}" height="${rows * pitch}" style="left:${X0 + (CW - cols * pitch) / 2}px; top:${gy}px">${units(e.registered, cols, pitch, 11, e.onMsp)}</svg>
    ${foot(`1 circle = 1 registered puzzler · ${c.asOf}`)}`);

  // 2 · The question, the one benchmark we can give, and a blank to fill in.
  const blanks = ['h', 'min', 's'].map((u, i) => {
    const bw = 220, gap = 62, x = (CW - 3 * bw - 2 * gap) / 2 + i * (bw + gap);
    return `<div class="abs" style="left:${X0 + x}px; top:1116px; width:${bw}px; height:3px; background:${INK}"></div>
      <p class="note abs" style="left:${X0 + x}px; top:1126px; width:${bw}px; text-align:center; font-style:italic">${u}</p>
      ${i ? `<p class="abs" style="left:${X0 + x - gap / 2 - 12}px; top:1040px; font-size:64px; font-weight:800">:</p>` : ''}`;
  }).join('');
  const s2 = frame(`${mast('Event preview', '2 / 2')}
    <p class="abs" style="left:${X0}px; top:222px; width:${CW}px; text-wrap:balance; font-size:86px; line-height:1.0; font-weight:800; letter-spacing:-2.5px">${h(e.question)}</p>
    ${e.usMedianPb ? `<p class="kick abs" style="left:${X0}px; top:536px">For scale</p>
    <p class="big abs" style="left:${X0}px; top:584px; font-size:200px">${e.usMedianPb}</p>
    ${slab(X0, 786, CW, 34)}
    <p class="note abs" style="left:${X0}px; top:838px; width:${CW}px">median personal best on a solo 500 in the United States, ${fmtInt(e.usPuzzlers ?? 0)} puzzlers</p>` : ''}
    <div class="abs" style="left:${X0}px; top:952px; width:${CW}px; height:3px; background:${INK}"></div>
    <p class="kick abs" style="left:${X0}px; top:980px">Your goal</p>
    ${blanks}
    ${foot(c.source)}`);
  return { key: 'event', slides: [{ id: 'event-1', body: s1 }, { id: 'event-2', body: s2 }] };
}

function feature(c: Content): Post {
  const f = c.feature;
  const busiest = f.days.reduce((a, b) => (b.results > a.results ? b : a));
  const days = f.days.filter(d => d.day <= busiest.day); // later days are still being logged
  const yMax = Math.ceil(Math.max(...days.map(d => d.results)) / 500) * 500;
  const gutL = 196, cTop = 150, cH = 430, SY = 456;
  const step = (CW - gutL) / days.length, bw = step * 0.74;
  const yv = (v: number) => cTop + cH - (v / yMax) * cH;
  const xOf = (i: number) => gutL + i * step + (step - bw) / 2;
  const iB = days.indexOf(busiest);
  const bars = days.map((d, i) => {
    const rect = (e: string) => `<rect x="${xOf(i).toFixed(1)}" y="${yv(d.results).toFixed(1)}" width="${bw.toFixed(1)}" height="${(cTop + cH - yv(d.results)).toFixed(1)}" ${e}/>`;
    return i === iB ? overprint(rect) : rect('fill="url(#scrI2)"');
  }).join('');
  const labelled = days.map((d, i) => ({ d, i })).filter(({ i }) => i % 2 === iB % 2);
  const dayNums = labelled.map(({ d, i }) => `<text class="t ${i === iB ? 'lab-b' : 'lab'}" x="${(xOf(i) + bw / 2).toFixed(1)}" y="${cTop + cH + 48}" text-anchor="middle">${utc(d.day).getUTCDate()}</text>`).join('');
  const months = labelled.filter(({ d }, k) => k === 0 || d.day.slice(5, 7) !== labelled[k - 1].d.day.slice(5, 7))
    .map(({ d, i }) => `<text class="t lab" x="${(xOf(i) + bw / 2).toFixed(1)}" y="${cTop + cH + 92}" text-anchor="middle" style="font-style:italic">${monthOf(d.day, 'short')}</text>`).join('');
  const ty = yv(f.typicalDay), bR = xOf(iB) + bw;
  const s1 = frame(`${mast(f.kicker, 'MSP DATA')}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(f.title)}</h2>
    <p class="note abs" style="left:${X0}px; top:372px; font-style:italic">Results logged per day</p>
    <svg class="abs" width="${CW}" height="${cTop + cH + 110}" style="left:${X0}px; top:${SY}px">
      ${bars}
      <line x1="${gutL}" x2="${xOf(iB) - 8}" y1="${ty}" y2="${ty}" stroke="${INK}" stroke-width="3" stroke-dasharray="9 7"/>
      <text class="t lab" x="${gutL - 18}" y="${ty - 8}" text-anchor="end" style="font-style:italic">typical day</text>
      <text class="t lab-b" x="${gutL - 18}" y="${ty + 34}" text-anchor="end">${fmtInt(f.typicalDay)}</text>
      <line x1="${gutL - 4}" x2="${CW}" y1="${cTop + cH + 1.5}" y2="${cTop + cH + 1.5}" stroke="${INK}" stroke-width="3"/>
      <text class="t" x="0" y="${cTop - 40}"><tspan style="font-size:120px; font-weight:800; letter-spacing:-5px">${f.multiple}×</tspan><tspan class="lab" dx="18" style="font-style:italic">a typical day</tspan></text>
      <text class="t lab-b" x="${bR}" y="${yv(busiest.results) - 20}" text-anchor="end">${fmtInt(busiest.results)} on ${utc(busiest.day).getUTCDate()} ${monthOf(busiest.day, 'short')}</text>
      ${dayNums}${months}
    </svg>
    ${foot(c.source)}`);

  // 2 · What launch day was made of: one bar, split.
  const rest = f.results - f.backfilled, bY = 700, bH = 170, gapW = 14;
  const leftW = Math.round((CW - gapW) * (f.backfilled / f.results));
  const s2 = frame(`${mast(f.kicker, '2 / 2')}
    <p class="big abs" style="left:${X0}px; top:214px; font-size:260px">${f.backfilledPct}%</p>
    <h2 class="h2 abs" style="left:${X0}px; top:470px; width:${CW}px">of launch-day results were solved over a week earlier</h2>
    <svg class="abs" width="${CW}" height="${bH}" style="left:${X0}px; top:${bY}px">
      ${overprint(e => `<rect x="0" y="0" width="${leftW}" height="${bH}" ${e}/>`)}
      <rect x="${leftW + gapW}" y="0" width="${CW - leftW - gapW}" height="${bH}" fill="url(#scrI2)"/>
    </svg>
    <p class="note abs" style="left:${X0}px; top:${bY + bH + 22}px"><b style="font-weight:800">${fmtInt(f.backfilled)}</b> back-filled</p>
    <p class="note abs" style="right:${W - X0 - CW}px; top:${bY + bH + 22}px; text-align:right"><b style="font-weight:800">${fmtInt(rest)}</b> solved that week</p>
    <p class="abs" style="left:${X0}px; top:1030px; width:760px; text-wrap:balance; font-size:60px; line-height:1.08; font-weight:800; letter-spacing:-1.5px">${h(f.question)}</p>
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
  const s1 = frame(`${mast(kick, 'MSP DATA')}
    <h1 class="h1 abs" style="left:${X0}px; top:222px; width:${CW}px; font-size:104px; letter-spacing:-3.5px">${h(m.title)}</h1>
    <p class="big abs" style="left:${X0}px; top:600px; font-size:230px">${fmtInt(m.results)}</p>
    ${slab(X0, 816, CW)}
    <p class="note abs" style="left:${X0}px; top:876px">results logged in ${h(m.label)}</p>
    ${lastYear ? `<div class="abs" style="left:${X0}px; top:990px; width:${CW}px; border-top:3px solid ${INK}; padding-top:30px; display:flex; align-items:center; gap:36px">
      <p style="font-size:110px; font-weight:800; letter-spacing:-4px; line-height:0.9">${fmtSignedPct(m.vsLastYearPct, 0)}</p>
      <p class="note" style="font-style:italic">on ${h(M)} ${yr - 1},<br>when you logged ${fmtInt(lastYear.results)}</p></div>` : ''}
    ${foot(c.source)}`);

  // 2 · Every month since the series starts; the record month overprinted, the runner-up keylined.
  const series = m.series, cH = 500, SY = 486;
  const yMax = Math.ceil(Math.max(...series.map(s => s.results)) / 5000) * 5000;
  const step = CW / series.length, bw = step * 0.74;
  const xOf = (i: number) => i * step + (step - bw) / 2;
  const yv = (v: number) => cH - (v / yMax) * cH;
  const iC = series.indexOf(cur), iR = series.indexOf(runner);
  const bars = series.map((s, i) => {
    const rect = (e: string) => `<rect x="${xOf(i).toFixed(1)}" y="${yv(s.results).toFixed(1)}" width="${bw.toFixed(1)}" height="${(cH - yv(s.results)).toFixed(1)}" ${e}/>`;
    return i === iC ? overprint(rect) : rect('fill="url(#scrI2)"') + (i === iR ? rect(`fill="none" stroke="${INK}" stroke-width="3"`) : '');
  }).join('');
  const initials = series.map((s, i) => `<text class="t ${i === iC ? 'lab-b' : 'lab'}" x="${(xOf(i) + bw / 2).toFixed(1)}" y="${cH + 48}" text-anchor="middle">${monthOf(s.month, 'narrow')}</text>`).join('');
  const years = series.map((s, i) => ({ s, i })).filter(({ s }) => s.month.endsWith('-01'))
    .map(({ s, i }) => `<text class="t lab" x="${xOf(i).toFixed(1)}" y="${cH + 92}" style="font-style:italic">${s.month.slice(0, 4)}</text>`).join('');
  const close = diff / runner.results < 0.01;
  const s2 = frame(`${mast(kick, '2 / 3')}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${h(M)} edged past ${h(Rn)} by ${close ? 'just ' : ''}${fmtInt(diff)} results</h2>
    <p class="note abs" style="left:${X0}px; top:372px; font-style:italic">Results logged per month</p>
    <svg class="abs" width="${CW}" height="${cH + 110}" style="left:${X0}px; top:${SY}px">
      ${bars}
      <line x1="0" x2="${CW}" y1="${cH + 1.5}" y2="${cH + 1.5}" stroke="${INK}" stroke-width="3"/>
      <text class="t lab-xl" x="${xOf(iC) + bw}" y="${yv(cur.results) - 22}" text-anchor="end">${fmtInt(cur.results)}</text>
      <text class="t lab" x="${xOf(iR) + bw / 2}" y="${yv(runner.results) - 22}" text-anchor="middle">${fmtInt(runner.results)}</text>
      ${initials}${years}
    </svg>
    ${foot(c.source)}`);

  // 3 · The other counts, ruled like the record post's footer grid, then the question.
  const isMax = (k: 'active' | 'newPlayers' | 'pieces') => cur[k] >= Math.max(...others.map(o => o[k]));
  const all = isMax('active') && isMax('newPlayers') && isMax('pieces');
  const stat = (value: string, label: string, rec: boolean) => `<div><p style="font-size:100px; font-weight:800; letter-spacing:-3px; line-height:1">${value}</p>
    <p class="note" style="margin-top:14px">${label}${rec && !all ? ' · <b style="font-weight:800">record</b>' : ''}</p></div>`;
  const s3 = frame(`${mast(kick, '3 / 3')}
    <h2 class="h2 abs" style="left:${X0}px; top:222px; width:${CW}px">${all ? 'A record on every count' : `${h(M)} in numbers`}</h2>
    ${all ? slab(X0, 300, CW, 26) : ''}
    <div class="abs" style="left:${X0}px; top:370px; width:${CW}px; display:grid; grid-template-columns:1fr 1fr; column-gap:44px; border-top:3px solid ${INK}; padding-top:30px">
      ${stat(fmtInt(m.active), 'puzzlers logged a time', isMax('active'))}${stat(fmtInt(m.newPlayers), 'new puzzlers joined', isMax('newPlayers'))}
    </div>
    <div class="abs" style="left:${X0}px; top:630px; width:${CW}px; border-top:3px solid ${INK}; padding-top:30px">
      ${stat(fmtInt(m.pieces), 'pieces in the puzzles you finished', isMax('pieces'))}
    </div>
    <p class="abs" style="left:${X0}px; top:930px; width:${CW}px; text-wrap:balance; font-size:66px; line-height:1.06; font-weight:800; letter-spacing:-1.5px">${h(m.question)}</p>
    ${foot(c.source)}`);
  return { key: 'month', slides: [{ id: 'month-1', body: s1 }, { id: 'month-2', body: s2 }, { id: 'month-3', body: s3 }] };
}

const direction: Direction = {
  id: 'D8',
  name: 'Two-Ink Zine',
  idea: 'Risograph data zine: off-white paper, indigo for every word and rule, coral only as fill, tints as halftone screens, inks overprint into plum; one fixed plate drift on decorative passes only.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
