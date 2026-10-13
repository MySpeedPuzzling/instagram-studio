// D4 · Box Lid & Shelf.
// Every post is a puzzle-box lid: a muted brand-tint lid with a printed hairline frame, a piece-count
// corner badge, and a full-height spine strip on the left with the series name, issue number and the MSP
// logo, so the profile grid reads like a shelf of boxes. The "box art" is the chart or number itself.
// No manufacturer art, no imitation of real brands.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, barGeometry, flagUrl, rankGeometry } from '../../../src/design/svg.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../types.ts';

const W = 1080, H = 1350;
const SPINE = 168;          // spine band, bleeding off the left edge
const L = 232, R = 992;     // lid content box
const CW = R - L;           // 760
const HOUR = 60;            // minutes; the wall (a unit of time, not data)

interface Series { name: string; issue: string; lid: string; spine: string; mark: string }
// Lid tints rotate per series; `mark` is the context colour for charts on that lid.
const SERIES: Record<string, Series> = {
  wall: { name: 'The Wall', issue: '01', lid: 'var(--sky-100)', spine: 'var(--sky-300)', mark: 'var(--sky-300)' },
  record: { name: 'Records', issue: '01', lid: 'var(--coral-50)', spine: 'var(--coral-200)', mark: 'var(--coral-200)' },
  countries: { name: 'Country Cup', issue: '01', lid: 'var(--indigo-50)', spine: 'var(--indigo-200)', mark: 'var(--indigo-200)' },
  share: { name: 'Puzzle Sizes', issue: '01', lid: 'var(--paper-warm)', spine: 'var(--d4-sand)', mark: 'var(--d4-sand)' },
  xp: { name: 'Levels', issue: '01', lid: 'var(--d4-mint-lid)', spine: 'var(--d4-mint)', mark: 'var(--d4-mint)' },
  // Series boxes: the weekly's issue number is its episode (passed per post), the others start at No. 01.
  weekly: { name: 'The Weekly Numbers', issue: '', lid: 'var(--d4-peach-lid)', spine: 'var(--d4-peach)', mark: 'var(--d4-peach)' },
  event: { name: 'Events', issue: '01', lid: 'var(--indigo-50)', spine: 'var(--indigo-300)', mark: 'var(--indigo-300)' },
  feature: { name: 'New on MSP', issue: '01', lid: 'var(--d4-leaf-lid)', spine: 'var(--d4-leaf)', mark: 'var(--d4-leaf)' },
  month: { name: 'Monthly Report', issue: '01', lid: 'var(--d4-ledger-lid)', spine: 'var(--d4-ledger)', mark: 'var(--d4-ledger)' },
};

const css = `
:root { --d4-sand: #ecdcca; --d4-mint: #bfe8d4; --d4-mint-lid: #ecf9f2; }
:root { --d4-peach: #fdd0a7; --d4-peach-lid: #fff3e8; --d4-leaf: #9fe3c2; --d4-leaf-lid: #dff6ea; --d4-ledger: #cbd2de; --d4-ledger-lid: #f3f5f9; }
.lid { position: relative; width: ${W}px; height: ${H}px; }
.spine { position: absolute; left: 0; top: 0; bottom: 0; width: ${SPINE}px; display: flex; flex-direction: column; align-items: flex-start; padding: 88px 0 64px 86px; }
.spine-name { writing-mode: vertical-rl; font-size: 36px; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; line-height: 50px; color: var(--ink); font-feature-settings: 'case'; }
.spine-no { margin-top: auto; writing-mode: vertical-rl; font-size: 30px; font-weight: 500; letter-spacing: 3px; line-height: 50px; color: var(--ink); }
.spine-logo { width: 56px; height: 50px; margin: 26px 0 0 -3px; }
.spine::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 3px; background: var(--ink); }
.frame { position: absolute; left: ${SPINE + 28}px; right: 44px; top: 36px; bottom: 36px; border: 2px solid var(--ink); border-radius: 6px; }
.badge { position: absolute; right: ${W - R}px; top: 76px; width: 170px; padding: 14px 0 12px; border: 4px solid var(--ink); border-radius: 18px; background: var(--paper); text-align: center; }
.badge b { display: block; font-size: 62px; line-height: 1; font-weight: 700; letter-spacing: -1px; }
.badge span { display: block; margin-top: 6px; font-size: 26px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: var(--ink-soft); }
.kick { position: absolute; left: ${L}px; top: 92px; width: 520px; font-size: 30px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--ink-soft); line-height: 1.25; }
.abs { position: absolute; }
.title { font-size: 108px; line-height: 0.98; font-weight: 300; letter-spacing: -3px; }
.title b { font-weight: 700; }
.h2 { font-size: 62px; line-height: 1.08; font-weight: 500; letter-spacing: -1.2px; text-wrap: balance; }
.dek { font-size: 40px; line-height: 1.25; color: var(--ink-soft); text-wrap: pretty; }
.lab { font-size: 32px; color: var(--ink-soft); line-height: 1.25; }
.lab b { color: var(--ink); font-weight: 700; }
.src { position: absolute; left: ${L}px; bottom: 70px; font-size: 30px; color: var(--ink-muted); }
.hero { font-size: 250px; line-height: 0.86; font-weight: 700; letter-spacing: -10px; }
.cta { text-wrap: balance; font-size: 50px; font-weight: 700; line-height: 1.15; color: var(--indigo-500); }
svg .t { font-family: Rubik; font-variant-numeric: tabular-nums; font-size: 32px; fill: var(--ink-soft); }
svg .tb { font-family: Rubik; font-variant-numeric: tabular-nums; font-size: 36px; font-weight: 700; fill: var(--ink); }
.wall { stroke: var(--ink); stroke-width: 4; stroke-dasharray: 10 8; }
.crow { display: flex; align-items: center; }
.crow img { width: 42px; height: 42px; }
.crow .cn { width: 250px; margin-left: 16px; font-size: 33px; font-weight: 500; }
.crow .ct { width: 104px; text-align: right; font-size: 33px; font-weight: 700; }
.crow .cb { height: 28px; margin-left: 24px; border-radius: 0 6px 6px 0; }
.lbl { font-size: 30px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--ink-soft); line-height: 1.25; }
.brow { display: flex; align-items: center; height: 54px; }
.brow .bn { width: 230px; flex: none; font-size: 32px; font-weight: 500; }
.brow .bb { height: 34px; flex: none; border-radius: 0 6px 6px 0; }
.brow .bv { margin-left: 16px; font-size: 34px; font-weight: 700; white-space: nowrap; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.who { display: flex; align-items: center; gap: 14px; min-width: 0; }
.who img { width: 44px; height: 44px; flex: none; }
.rk { width: 30px; flex: none; font-size: 32px; font-weight: 700; color: var(--ink-soft); }
.pn { font-size: 46px; font-weight: 600; letter-spacing: -0.5px; white-space: nowrap; }
.tm { font-size: 58px; font-weight: 700; letter-spacing: -1.5px; }
.tag { display: inline-block; padding: 0 12px; border-radius: 8px; background: var(--coral-100); color: var(--ink); font-weight: 600; }
.sec { border-bottom: 3px solid var(--ink); padding-bottom: 10px; }
.spec { display: flex; align-items: baseline; justify-content: space-between; padding: 34px 0 26px; border-bottom: 2px solid var(--ink); }
.spec .sv { font-size: 60px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; }
.hi { color: var(--indigo-500); }
`;

function lid(key: string, opts: { badge: [string, string]; kicker: string; page?: string; src?: string; issue?: string; badgeW?: number }, inner: string) {
  const s = SERIES[key];
  const issue = `No. ${opts.issue ?? s.issue}${opts.page ? ` · ${opts.page}` : ''}`;
  return `<div class="lid" style="background:${s.lid}">
  <div class="spine" style="background:${s.spine}">
    <span class="spine-name">${h(s.name)}</span>
    <span class="spine-no">${h(issue)}</span>
    <img class="spine-logo" src="${LOGO_URL}" alt="">
  </div>
  <div class="frame"></div>
  <p class="kick">${h(opts.kicker)}</p>
  <div class="badge"${opts.badgeW ? ` style="width:${opts.badgeW}px"` : ''}><b>${h(opts.badge[0])}</b><span data-qa-small>${h(opts.badge[1])}</span></div>
  ${inner}
  ${opts.src ? `<p class="src">${h(opts.src)}</p>` : ''}
</div>`;
}

const svgAt = (x: number, y: number, w: number, hgt: number, inner: string) =>
  `<svg class="abs" style="left:${x}px; top:${y}px" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">${inner}</svg>`;
const minus = (v: number) => (v < 0 ? '−' : '+') + fmtInt(Math.abs(v));

// ---------------------------------------------------------------- wall carousel

function wall(c: Content): Post {
  const w = c.wall, s = SERIES.wall;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;
  const isWall = (m: number) => m >= HOUR - 5 && m < HOUR;
  const badge: [string, string] = ['500', 'pieces'];

  // Cover art: 48–68 minutes, bars growing from the lid's base line.
  const teaser = w.histogram.filter(d => d.minute >= HOUR - 12 && d.minute <= HOUR + 8);
  const TH = 430;
  const tg = barGeometry(teaser, { x: d => d.minute, y: d => d.results, width: CW, height: TH, padding: 0.2 });
  const tBars = tg.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="5" fill="${isWall(b.datum.minute) ? 'var(--coral-500)' : s.mark}"/>`).join('');
  const t60 = tg.xScale(String(HOUR))! - (tg.xScale.step() - tg.xScale.bandwidth()) / 2;

  // Full histogram 40–80.
  const GH = 560;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: CW, height: GH, padding: 0.2 });
  const bars = g.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="3" fill="${isWall(b.datum.minute) ? 'var(--coral-500)' : s.mark}"/>`).join('');
  const band = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const line60 = g.xScale(String(HOUR))! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const lo = w.histogram[0].minute, hi = w.histogram[w.histogram.length - 1].minute;
  const ticks = [lo, (lo + HOUR) / 2, HOUR, (HOUR + hi) / 2, hi].map(m => `<text class="t" x="${band(m)}" y="${GH + 50}" text-anchor="${m === hi ? 'end' : 'middle'}">${m === hi ? `${m} min` : m}</text>`).join('');

  // Context: change against the minute before, at 45, 50 and 60 minutes.
  const steps = [...w.noStepAt, HOUR].map(m => ({ m, d: at(m) - at(m - 1) }));
  const maxAbs = Math.max(...steps.map(x => Math.abs(x.d)));
  const zeroY = 210, scale = 300 / maxAbs, colW = 150, colStep = CW / steps.length;
  const stepSvg = steps.map((x, i) => {
    const cx = colStep * i + colStep / 2, hgt = Math.max(4, Math.abs(x.d) * scale);
    const y = x.d >= 0 ? zeroY - hgt : zeroY;
    const fill = x.m === HOUR ? 'var(--coral-500)' : s.mark;
    const ly = x.d >= 0 ? y - 22 : y + hgt + 50;
    return `<rect x="${cx - colW / 2}" y="${y}" width="${colW}" height="${hgt}" rx="5" fill="${fill}"/>
      <text class="tb" x="${cx}" y="${ly}" text-anchor="middle">${minus(x.d)}</text>
      <text class="t" x="${cx}" y="${-40}" text-anchor="middle">${x.m - 1} → ${x.m} min</text>`;
  }).join('');

  const sub = w.subHour;
  return {
    key: 'wall',
    slides: [
      { id: 'wall-1', body: lid('wall', { badge, kicker: w.kicker, src: c.source }, `
        <h1 class="abs title" style="left:${L}px; top:250px; width:${CW}px">${h(w.title).replace(/^(.*?)(\d+-minute)(.*)$/, '$1<b>$2</b>$3')}</h1>
        <p class="abs dek" style="left:${L}px; top:486px; width:${CW}px">${h(w.dek)}</p>
        ${svgAt(L, 730, CW, TH, `${tBars}
          <line class="wall" x1="${t60}" x2="${t60}" y1="-36" y2="${TH}"/>
          <text class="tb" x="${t60 + 16}" y="-6">${HOUR}:00</text>`)}`) },
      { id: 'wall-2', body: lid('wall', { badge, kicker: w.kicker, page: '2/4', src: c.source }, `
        <h2 class="abs h2" style="left:${L}px; top:250px; width:${CW}px">${w.mode.minute} minutes is the most common finish. Then the counts drop.</h2>
        ${svgAt(L, 560, CW, GH + 60, `${bars}
          <line class="wall" x1="${line60}" x2="${line60}" y1="-40" y2="${GH}"/>
          <text class="tb" x="${modeBar.x + modeBar.width}" y="${modeBar.y - 54}" text-anchor="end">${w.mode.minute} min</text>
          <text class="t" x="${modeBar.x + modeBar.width}" y="${modeBar.y - 16}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
          <text class="tb" x="${line60 + 16}" y="${modeBar.y - 54}" style="fill:var(--indigo-500)">${String(w.dropPct).replace('-', '−')}%</text>
          <text class="t" x="${line60 + 16}" y="${modeBar.y - 16}">at the hour</text>
          ${ticks}`)}`) },
      { id: 'wall-3', body: lid('wall', { badge, kicker: w.kicker, page: '3/4', src: c.source }, `
        <h2 class="abs h2" style="left:${L}px; top:250px; width:${CW}px">No step at ${w.noStepAt.join(' or ')} minutes. The hour is the line people race for.</h2>
        <p class="abs lab" style="left:${L}px; top:470px; width:${CW}px">Change in results against the minute before</p>
        ${svgAt(L, 620, CW, 640, `<line x1="0" x2="${CW}" y1="${zeroY}" y2="${zeroY}" stroke="var(--ink)" stroke-width="3"/>${stepSvg}`)}`) },
      { id: 'wall-4', body: lid('wall', { badge, kicker: w.kicker, page: '4/4', src: c.source }, `
        <p class="abs hero" style="left:${L - 8}px; top:250px">${sub.pct}%</p>
        <h2 class="abs h2" style="left:${L}px; top:540px; width:${CW}px">of solo 500-piece puzzlers have a personal best under one hour</h2>
        <p class="abs dek" style="left:${L}px; top:770px; width:${CW}px">${fmtInt(sub.under60)} of ${fmtInt(sub.puzzlers)} puzzlers with a solo 500 time</p>
        <p class="abs cta" style="left:${L}px; top:1010px; width:${CW}px">${h(w.question)}</p>`) },
    ],
  };
}

// ---------------------------------------------------------------- record

function record(c: Content): Post {
  const r = c.record;
  return { key: 'record', slides: [{ id: 'record-1', body: lid('record', { badge: ['500', 'pieces'], kicker: r.kicker, src: c.source }, `
    <p class="abs hero" style="left:${L - 8}px; top:320px">${h(r.value)}</p>
    <div class="abs" style="left:${L}px; top:560px; width:${CW}px; height:14px; background:var(--coral-500); border-radius:7px"></div>
    <h2 class="abs h2" style="left:${L}px; top:640px; width:${CW}px">${h(r.title)}</h2>
    <p class="abs dek" style="left:${L}px; top:880px; width:${CW}px">${h(r.context)}</p>
    <p class="abs lab" style="left:${L}px; top:1090px; width:${CW}px; border-top:3px solid var(--coral-200); padding-top:22px">${h(r.footnote)}</p>`) }] };
}

// ---------------------------------------------------------------- countries

function countries(c: Content): Post {
  const k = c.countries, s = SERIES.countries;
  const barW = CW - (42 + 16 + 250 + 104 + 24);
  const domain: [number, number] = [0, Math.max(HOUR + 10, ...k.reference.map(r => r.value ?? 0))];
  const rowH = 54, top = 500;
  const rows = rankGeometry(k.top, { value: d => d.medianPb, width: barW, rowHeight: rowH, gap: 0, domain });
  const refs = k.reference.filter(r => r.value != null).map(r => ({ name: r.label, value: r.value! }));
  const refRows = rankGeometry(refs, { value: d => d.value, width: barW, rowHeight: rowH, gap: 0, domain });
  const refTop = top + rows.length * rowH + 26;
  const barX = L + 42 + 16 + 250 + 104 + 24;
  const x60 = barX + (HOUR / domain[1]) * barW;
  return { key: 'countries', slides: [{ id: 'countries-1', body: lid('countries', { badge: ['500', 'pieces'], kicker: 'Solo 500 pieces', src: c.source }, `
    <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">${h(k.title)}</h2>
    <p class="abs lab" style="left:${L}px; top:376px; width:${CW}px">${h(k.dek)}</p>
    <div class="abs" style="left:${x60 - 2}px; top:${top - 40}px; width:0; height:${refTop + refRows.length * rowH - top + 44}px; border-left:4px dashed var(--ink)"></div>
    <p class="abs lab" style="right:${W - x60 + 14}px; top:${top - 48}px"><b>${HOUR}:00</b></p>
    ${rows.map((r, i) => `<div class="abs crow" style="left:${L}px; top:${top + r.y}px; height:${rowH}px">
      <img src="${flagUrl(r.datum.code)}" alt=""><span class="cn">${h(r.datum.name)}</span><span class="ct">${fmtDuration(r.datum.medianPb)}</span>
      <span class="cb" style="width:${r.width}px; background:${i === 0 ? 'var(--coral-500)' : s.mark}"></span></div>`).join('')}
    ${refRows.map(r => `<div class="abs crow" style="left:${L}px; top:${refTop + r.y}px; height:${rowH}px">
      <span style="width:42px"></span><span class="cn" style="color:var(--ink-soft)">${h(r.datum.name)}</span><span class="ct" style="color:var(--ink-soft)">${fmtDuration(r.datum.value)}</span>
      <span class="cb" style="width:${r.width}px; background:var(--paper); box-shadow: inset 0 0 0 3px var(--indigo-300)"></span></div>`).join('')}`) }] };
}

// ---------------------------------------------------------------- share

function share(c: Content): Post {
  const sh = c.share;
  // Box-tray mosaic: one compartment per size, areas proportional to the share of results.
  const TW = CW, TH = 620, gap = 12, top = 470;
  const [main, ...rest] = [...sh.parts].sort((a, b) => b.pct - a.pct);
  const total = sh.parts.reduce((t, p) => t + p.pct, 0);
  const mainH = Math.round((TH - gap) * (main.pct / total));
  const restH = TH - gap - mainH;
  const restTotal = rest.reduce((t, p) => t + p.pct, 0);
  const rowW = TW - gap * (rest.length - 1);
  let x = 0;
  const cells = rest.map((p, i) => {
    const w = i === rest.length - 1 ? TW - x : Math.round(rowW * (p.pct / restTotal));
    const cell = { p, x, y: mainH + gap, w, h: restH };
    x += w + gap;
    return cell;
  });
  const label = (p: typeof main) => sh.labels[p.key];
  const fits = (cell: typeof cells[number]) => cell.w >= 200;
  return { key: 'share', slides: [{ id: 'share-1', body: lid('share', { badge: ['All', 'sizes'], kicker: 'Puzzle sizes', src: c.source }, `
    <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">${h(sh.title)}</h2>
    <p class="abs lab" style="left:${L}px; top:376px; width:${CW}px">${h(sh.dek)}</p>
    <div class="abs" style="left:${L}px; top:${top}px; width:${TW}px; height:${mainH}px; background:var(--coral-500); border:3px solid var(--ink); border-radius:14px; padding:30px 34px">
      <p style="font-size:130px; font-weight:700; letter-spacing:-4px; line-height:1">${main.pct}%</p>
      <p style="font-size:44px; font-weight:700; margin-top:14px">${h(label(main))}</p>
      <p style="font-size:40px; font-weight:700; margin-top:4px">${fmtInt(main.results)} results</p>
    </div>
    ${cells.map(cell => `<div class="abs" style="left:${L + cell.x}px; top:${top + cell.y}px; width:${cell.w}px; height:${cell.h}px; background:var(--paper); border:3px solid var(--ink); border-radius:${cell.w < 60 ? 8 : 14}px; padding:${fits(cell) ? '18px 16px' : 0}">
      ${fits(cell) ? `<p style="font-size:44px; font-weight:700; line-height:1">${cell.p.pct}%</p><p class="lab" style="margin-top:8px; font-size:30px; white-space:nowrap">${h(label(cell.p))}</p>` : ''}
    </div>`).join('')}
    ${cells.filter(cell => !fits(cell)).map(cell => `<p class="abs lab" style="right:${W - (L + cell.x + cell.w)}px; top:${top + TH + 14}px; text-align:right"><b>${cell.p.pct}%</b> ${h(label(cell.p))}</p>`).join('')}`) }] };
}

// ---------------------------------------------------------------- xp

function xp(c: Content): Post {
  const x = c.xp;
  // A club wreath: one generator piece per Level 50 member, lifted from one jigsaw and set radially.
  const members = x.distribution.find(d => d.level === x.level)?.players ?? 0;
  const size = 96;
  // Interior pieces only (tabs or blanks on all four sides), enough that no member repeats a shape.
  const inner = Math.max(2, Math.ceil(Math.sqrt(members)));
  const jcols = inner + 2, jrows = Math.ceil(members / inner) + 2;
  const jig = generateJigsaw({ cols: jcols, rows: jrows, width: jcols * size, height: jrows * size, seed: 50, tabSize: 0.22 });
  const pool = jig.pieces.filter(p => p.col > 0 && p.col < jcols - 1 && p.row > 0 && p.row < jrows - 1);
  const cx = (L + R) / 2, cy = 590, ring = 268, Rm = 172;
  const wreath = Array.from({ length: members }, (_, i) => {
    const p = pool[i % pool.length];
    const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
    const a = (i / members) * 360 - 90;
    const px = cx + ring * Math.cos((a * Math.PI) / 180), py = cy + ring * Math.sin((a * Math.PI) / 180);
    return `<path d="${p.d}" transform="translate(${(px - pcx).toFixed(1)} ${(py - pcy).toFixed(1)}) rotate(${(a + 90).toFixed(1)} ${pcx.toFixed(1)} ${pcy.toFixed(1)})" fill="${i % 2 ? 'var(--coral-300)' : 'var(--coral-500)'}" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>`;
  }).join('');
  return { key: 'xp', slides: [{ id: 'xp-1', body: lid('xp', { badge: [String(x.level), 'levels'], kicker: x.kicker, src: c.source }, `
    ${svgAt(0, 0, W, H, `${wreath}
      <circle cx="${cx}" cy="${cy}" r="${Rm}" fill="var(--paper)" stroke="var(--ink)" stroke-width="5"/>
      <circle cx="${cx}" cy="${cy}" r="${Rm - 16}" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <text x="${cx}" y="${cy - 62}" text-anchor="middle" style="font: 700 36px Rubik; letter-spacing: 8px; fill: var(--ink-soft)">LEVEL</text>
      <text x="${cx}" y="${cy + 92}" text-anchor="middle" style="font: 800 184px Rubik; font-variant-numeric: tabular-nums; letter-spacing: -6px; fill: var(--ink)">${x.level}</text>`)}
    <div class="abs" style="left:${L}px; top:940px; width:${CW}px; text-align:center">
      <p class="h2">${h(x.title)}</p>
      <p class="dek" style="margin-top:14px; text-wrap:balance">${h(x.dek)}</p>
      <p class="lab" style="margin-top:12px; font-size:30px; text-wrap:balance">${h(x.context)}</p>
    </div>`) }] };
}

// ---------------------------------------------------------------- helpers for the series boxes

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MON[Number(iso.slice(5, 7)) - 1]}`;
const monthLabel = (ym: string, long = false) => `${(long ? MONTH : MON)[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
/** Piece counts on the badge, box style: 4.1M, 16.8M, 950K. */
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : fmtInt(n));
/** "h:mm:ss" or "m:ss" → minutes. */
const toMinutes = (t: string) => t.split(':').map(Number).reduce((a, v) => a * 60 + v, 0) / 60;
const flagImg = (cc: string) => (cc ? `<img src="${flagUrl(cc)}" alt="">` : '<span style="width:44px; flex:none"></span>');
const signedInt = (v: number) => `${v < 0 ? '−' : '+'}${fmtInt(Math.abs(v))}`;

/** Same player listed several times (one person can own the whole podium): one entry, best time first. */
function byPlayer<T extends { player: string }>(list: T[]) {
  const out: Array<{ rank: number; first: T; more: T[] }> = [];
  list.forEach((f, i) => {
    const g = out.find(o => o.first.player === f.player);
    if (g) g.more.push(f); else out.push({ rank: i + 1, first: f, more: [] });
  });
  return out;
}

/** Horizontal bar row: label, bar from zero, value at the bar end. */
const barRow = (x: number, y: number, label: string, width: number, fill: string, value: string, labelW = 230) =>
  `<div class="abs brow" style="left:${x}px; top:${y}px"><span class="bn" style="width:${labelW}px">${label}</span><span class="bb" style="width:${Math.max(4, width)}px; background:${fill}"></span><span class="bv">${value}</span></div>`;

// ---------------------------------------------------------------- weekly (The Weekly Numbers, recurring)

type Fastest = Content['weekly']['fastest500'][number];

function weekly(c: Content): Post {
  const wk = c.weekly, s = SERIES.weekly;
  const N = 5;
  const no = String(wk.episode).padStart(2, '0');
  const box = (page?: string, src = true) => ({ badge: [compact(wk.pieces), 'pieces'] as [string, string], kicker: wk.range, issue: no, page, src: src ? c.source : undefined });

  // Cover bars: the week before against last week.
  const maxR = Math.max(wk.results, wk.resultsPrev);
  const coverBar = 300;
  const diff = wk.results - wk.resultsPrev;

  // Top puzzles.
  const tp = wk.topPuzzles;
  const tpMax = CW - 130;
  const tpY = 530, tpStep = 120;

  // Fastest, grouped by player.
  const sections = [
    { label: 'Solo 500 pieces', list: wk.fastest500 },
    { label: 'Solo 1,000 pieces', list: wk.fastest1000 },
  ].filter(x => x.list.length);
  const entry = (gp: { rank: number; first: Fastest; more: Fastest[] }) => {
    const f = gp.first;
    const notes = [...(f.handle ? [`<span class="hi">@${h(f.handle)}</span>`] : []), `${h(f.puzzle)} · ${h(f.brand)}`];
    if (gp.more.length) notes.push(`also ${gp.more.map(m => `<b>${m.time}</b>`).join(' and ')}`);
    return `<div style="margin-top:22px">
      <div class="row"><span class="who"><span class="rk">${gp.rank}</span>${flagImg(f.country)}<span class="pn">${h(f.player)}</span></span><span class="tm">${f.time}</span></div>
      <p class="lab" style="margin:4px 0 0 88px">${notes.join(' · ')}${f.firstAttempt ? ` <span class="tag">first attempt</span>` : ''}</p></div>`;
  };

  const pbPer100 = Math.round((wk.personalBests / wk.results) * 100);

  return {
    key: 'weekly',
    slides: [
      { id: 'weekly-1', body: lid('weekly', box(), `
        <h1 class="abs title" style="left:${L}px; top:236px; width:${CW}px">${h(wk.series).replace(/ (\S+)$/, ' <b>$1</b>')}</h1>
        <p class="abs lbl" style="left:${L}px; top:500px">Episode</p>
        <p class="abs hero" style="left:${L - 8}px; top:548px">${no}</p>
        <div class="abs" style="left:${L + 340}px; top:560px; width:${CW - 340}px">
          <p style="font-size:96px; font-weight:700; letter-spacing:-3px; line-height:1">${fmtInt(wk.results)}</p>
          <p class="dek" style="margin-top:14px">results logged, <b class="hi">${fmtSignedPct(wk.resultsChangePct)}</b> on the week before</p>
        </div>
        ${barRow(L, 920, 'Week before', (wk.resultsPrev / maxR) * coverBar, s.mark, fmtInt(wk.resultsPrev))}
        ${barRow(L, 992, 'Last week', (wk.results / maxR) * coverBar, 'var(--coral-500)', `${fmtInt(wk.results)} <span class="hi">${signedInt(diff)}</span>`)}`) },
      { id: 'weekly-2', body: lid('weekly', box(`2/${N}`), `
        <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">${h(tp[0].puzzle)} was the most-solved puzzle of the week</h2>
        <p class="abs lab" style="left:${L}px; top:${tpY - 76}px; width:${CW}px">Puzzlers who solved it</p>
        ${tp.map((p, i) => `<p class="abs lab" style="left:${L}px; top:${tpY + i * tpStep}px; width:${CW}px; white-space:nowrap"><b>${i + 1}&nbsp;&nbsp;${h(p.puzzle)}</b> · ${h(p.brand)}</p>
          ${barRow(L, tpY + i * tpStep + 46, '', (p.solvers / tp[0].solvers) * tpMax, i === 0 ? 'var(--coral-500)' : s.mark, fmtInt(p.solvers), 0)}`).join('')}`) },
      { id: 'weekly-3', body: lid('weekly', box(`3/${N}`), `
        <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">Fastest of the week</h2>
        <div class="abs" style="left:${L}px; top:316px; width:${CW}px">
          ${sections.map((x, i) => `<div style="margin-top:${i ? 46 : 0}px"><p class="lbl sec">${h(x.label)}</p>${byPlayer(x.list).map(entry).join('')}</div>`).join('')}
        </div>`) },
      { id: 'weekly-4', body: lid('weekly', box(`4/${N}`), `
        <p class="abs hero" style="left:${L - 8}px; top:250px">${fmtInt(wk.personalBests)}</p>
        <h2 class="abs h2" style="left:${L}px; top:520px; width:${CW}px">personal bests set last week</h2>
        <p class="abs dek" style="left:${L}px; top:680px; width:${CW}px">${pbPer100} in every 100 of the week’s ${fmtInt(wk.results)} results</p>
        <div class="abs" style="left:${L}px; top:806px; width:${CW}px; height:14px; background:var(--coral-500); border-radius:7px"></div>
        <p class="abs" style="left:${L - 4}px; top:880px; font-size:150px; font-weight:700; letter-spacing:-5px; line-height:0.86">${fmtInt(wk.newPuzzlers)}</p>
        <p class="abs h2" style="left:${L}px; top:1040px; width:${CW}px">new puzzlers joined us</p>`) },
      { id: 'weekly-5', body: lid('weekly', box(`5/${N}`), `
        <p class="abs lbl" style="left:${L}px; top:300px">Inside last week’s box</p>
        <p class="abs" style="left:${L - 4}px; top:352px; font-size:132px; font-weight:700; letter-spacing:-4px; line-height:0.9">${fmtInt(wk.pieces)}</p>
        <h2 class="abs h2" style="left:${L}px; top:510px; width:${CW}px">pieces placed by ${fmtInt(wk.puzzlers)} puzzlers</h2>
        <p class="abs dek" style="left:${L}px; top:680px; width:${CW}px">across ${fmtInt(wk.results)} logged results</p>
        <div class="abs" style="left:${L}px; top:860px; width:${CW}px; height:14px; background:var(--coral-500); border-radius:7px"></div>
        <p class="abs cta" style="left:${L}px; top:930px; width:${CW}px">${h(wk.question)}</p>`) },
    ],
  };
}

// ---------------------------------------------------------------- event preview

function event(c: Content): Post {
  const e = c.event, s = SERIES.event;
  const day = e.date.match(/\d+/)?.[0] ?? '';
  const mon = (e.date.match(/[A-Z][a-z]+$/)?.[0] ?? '').slice(0, 3);
  const box = (page: string, src = false) => ({ badge: [day, mon] as [string, string], kicker: 'Event preview', page, src: src ? c.source : undefined });
  const onW = Math.max(6, (e.onMsp / e.registered) * CW);
  const slides = [{ id: 'event-1', body: lid('event', box(e.usMedianPb ? '1/2' : ''), `
    <h1 class="abs title" style="left:${L}px; top:236px; width:${CW}px; font-size:94px">${h(e.name).replace(/ (\S+)$/, ' <b>$1</b>')}</h1>
    <p class="abs dek" style="left:${L}px; top:560px; width:${CW}px">${h(e.date)} · ${h(e.location)}</p>
    <p class="abs hero" style="left:${L - 8}px; top:650px">${fmtInt(e.registered)}</p>
    <p class="abs h2" style="left:${L}px; top:880px; width:${CW}px">puzzlers registered</p>
    <div class="abs" style="left:${L}px; top:1010px; width:${CW}px; height:40px; display:flex; border-radius:0 6px 6px 0; overflow:hidden">
      <span style="width:${onW}px; background:var(--coral-500)"></span><span style="flex:1; background:${s.mark}"></span></div>
    <p class="abs lab" style="left:${L}px; top:1068px; width:${CW}px"><b>${fmtInt(e.onMsp)}</b> of them already log their times on MySpeedPuzzling</p>`) }];
  if (e.usMedianPb) {
    const pb = toMinutes(e.usMedianPb);
    const max = Math.max(HOUR + 10, Math.ceil(pb / 10) * 10);
    const sc = (m: number) => (m / max) * CW;
    slides.push({ id: 'event-2', body: lid('event', box('2/2', true), `
      <p class="abs lbl" style="left:${L}px; top:236px">Solo 500 pieces · United States</p>
      <p class="abs hero" style="left:${L - 8}px; top:300px; font-size:196px; letter-spacing:-8px">${h(e.usMedianPb)}</p>
      <h2 class="abs h2" style="left:${L}px; top:510px; width:${CW}px">is the median personal best of ${fmtInt(e.usPuzzlers ?? 0)} US puzzlers</h2>
      <div class="abs" style="left:${L}px; top:800px; width:${sc(Math.min(pb, HOUR))}px; height:40px; background:${s.mark}"></div>
      ${pb > HOUR ? `<div class="abs" style="left:${L + sc(HOUR)}px; top:800px; width:${sc(pb - HOUR)}px; height:40px; background:var(--coral-500); border-radius:0 6px 6px 0"></div>` : ''}
      <div class="abs" style="left:${L + sc(HOUR) - 2}px; top:756px; width:0; height:110px; border-left:4px dashed var(--ink)"></div>
      <p class="abs lab" style="right:${W - (L + sc(HOUR)) + 14}px; top:740px"><b>${HOUR}:00</b></p>
      ${pb > HOUR ? `<p class="abs lab" style="right:${W - R}px; top:876px; text-align:right"><b>${fmtInt(Math.round(pb - HOUR))} min</b> over the hour</p>` : ''}
      <p class="abs cta" style="left:${L}px; top:1000px; width:${CW}px">${h(e.question)}</p>`) });
  }
  return { key: 'event', slides };
}

// ---------------------------------------------------------------- feature news: XP launch day

function feature(c: Content): Post {
  const f = c.feature, s = SERIES.feature;
  const launch = f.days.find(d => d.results === f.results && d.backfilled === f.backfilled)!;
  // The two weeks the "typical day" is averaged over, then launch day (later, partial days are left out).
  const days = f.days.filter(d => d.day <= launch.day);
  const [ld, lm] = dayLabel(launch.day).split(' ');
  const box = (page: string) => ({ badge: [ld, lm] as [string, string], kicker: f.kicker, page, src: c.source });
  const GH = 520, gY = 600;
  const g = barGeometry(days, { x: d => d.day, y: d => d.results, width: CW, height: GH, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="4" fill="${b.datum === launch ? 'var(--coral-500)' : s.mark}"/>`).join('');
  const typY = g.yScale(f.typicalDay);
  const lb = g.bars.find(b => b.datum === launch)!;
  const ticks = days.map((d, i) => ({ d, i })).filter(({ i }) => i % 7 === 0 || i === days.length - 1).map(({ d, i }) => {
    const b = g.bars[i];
    const last = i === days.length - 1;
    return `<text class="t" x="${last ? b.x + b.width : b.x + b.width / 2}" y="${GH + 48}" text-anchor="${last ? 'end' : 'middle'}">${dayLabel(d.day)}</text>`;
  }).join('');
  const bfW = (f.backfilled / f.results) * CW;
  return {
    key: 'feature',
    slides: [
      { id: 'feature-1', body: lid('feature', box('1/2'), `
        <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">${h(f.title)}</h2>
        <p class="abs lab" style="left:${L}px; top:376px; width:${CW}px">Results logged per day</p>
        <p class="abs lab" style="right:${W - R}px; top:${gY + lb.y - 100}px; text-align:right"><b>${fmtInt(f.results)}</b> on launch day<br><b class="hi">${f.multiple}×</b> a typical day</p>
        ${svgAt(L, gY, CW, GH + 60, `${bars}
          <line class="wall" x1="0" x2="${lb.x - 10}" y1="${typY}" y2="${typY}"/>
          <text class="tb" x="0" y="${typY - 58}">${fmtInt(f.typicalDay)}</text>
          <text class="t" x="0" y="${typY - 18}">typical day</text>
          ${ticks}`)}`) },
      { id: 'feature-2', body: lid('feature', box('2/2'), `
        <p class="abs hero" style="left:${L - 8}px; top:250px">${f.backfilledPct}%</p>
        <h2 class="abs h2" style="left:${L}px; top:520px; width:${CW}px">of launch-day results were puzzles solved more than a week earlier</h2>
        <div class="abs" style="left:${L}px; top:790px; width:${CW}px; height:40px; display:flex">
          <span style="width:${bfW}px; background:var(--coral-500)"></span><span style="flex:1; background:${s.mark}; border-radius:0 6px 6px 0"></span></div>
        <p class="abs lab" style="left:${L}px; top:846px"><b>${fmtInt(f.backfilled)}</b> solved earlier</p>
        <p class="abs lab" style="right:${W - R}px; top:846px; text-align:right"><b>${fmtInt(f.results - f.backfilled)}</b> solved that week</p>
        <p class="abs dek" style="left:${L}px; top:930px; width:${CW}px">${h(f.dek)}</p>
        <p class="abs cta" style="left:${L}px; top:1090px; width:${CW}px">${h(f.question)}</p>`) },
    ],
  };
}

// ---------------------------------------------------------------- monthly report

function month(c: Content): Post {
  const m = c.month, s = SERIES.month;
  const cur = m.series.find(x => x.results === m.results)!;
  const lastYear = m.series.find(x => x.month === `${Number(cur.month.slice(0, 4)) - 1}${cur.month.slice(4)}`);
  const mName = MONTH[Number(cur.month.slice(5, 7)) - 1];
  const box = (page?: string, src = true) => ({ badge: [compact(m.pieces), 'pieces'] as [string, string], badgeW: 210, kicker: m.label, page, src: src ? c.source : undefined });

  const sr = m.series;
  const GH = 500, gY = 600;
  const g = barGeometry(sr, { x: d => d.month, y: d => d.results, width: CW, height: GH, padding: 0.2 });
  const bars = g.bars.map(b => b.datum === lastYear
    ? `<rect x="${b.x + 1.5}" y="${b.y + 1.5}" width="${b.width - 3}" height="${b.height - 3}" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>`
    : `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="3" fill="${b.datum === cur ? 'var(--coral-500)' : s.mark}"/>`).join('');
  const bar = (d: typeof cur) => g.bars.find(b => b.datum === d)!;
  const cb = bar(cur);
  const runner = [...sr].filter(x => x !== cur).sort((a, b) => b.results - a.results)[0];
  const margin = m.results - runner.results;
  const verdict = margin > 0 && margin < m.results * 0.01
    ? `A photo finish: ${mName} beat ${monthLabel(runner.month, true)} by ${fmtInt(margin)} results`
    : `${mName} topped every month since ${monthLabel(sr[0].month, true)}`;
  const tick = (d: typeof cur, anchor: 'start' | 'middle' | 'end') => {
    const b = bar(d);
    return `<text class="t" x="${anchor === 'start' ? b.x : anchor === 'end' ? b.x + b.width : b.x + b.width / 2}" y="${GH + 48}" text-anchor="${anchor}">${monthLabel(d.month)}</text>`;
  };
  const isRecord = (k: 'results' | 'active' | 'newPlayers' | 'pieces') => cur[k] === Math.max(...sr.map(x => x[k]));
  const specs = [
    { label: 'Results logged', v: m.results, k: 'results' as const },
    { label: 'Puzzlers who logged', v: m.active, k: 'active' as const },
    { label: 'New puzzlers', v: m.newPlayers, k: 'newPlayers' as const },
    { label: 'Pieces placed', v: m.pieces, k: 'pieces' as const },
  ];
  const maxY = lastYear ? Math.max(cur.results, lastYear.results) : cur.results;

  return {
    key: 'month',
    slides: [
      { id: 'month-1', body: lid('month', box(), `
        <h1 class="abs title" style="left:${L}px; top:236px; width:${CW}px">${h(m.title).replace(/(biggest month)/, '<b>$1</b>')}</h1>
        <p class="abs" style="left:${L - 4}px; top:600px; font-size:170px; font-weight:700; letter-spacing:-6px; line-height:0.86">${fmtInt(m.results)}</p>
        <p class="abs dek" style="left:${L}px; top:780px; width:${CW}px">results logged${lastYear ? `, <b class="hi">${fmtSignedPct(m.vsLastYearPct, 0)}</b> on ${monthLabel(lastYear.month, true)}` : ''}</p>
        ${lastYear ? barRow(L, 920, monthLabel(lastYear.month), (lastYear.results / maxY) * 380, s.mark, fmtInt(lastYear.results)) : ''}
        ${barRow(L, lastYear ? 992 : 920, monthLabel(cur.month), (cur.results / maxY) * 380, 'var(--coral-500)', fmtInt(cur.results))}`) },
      { id: 'month-2', body: lid('month', box('2/3'), `
        <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">${h(verdict)}</h2>
        <p class="abs lab" style="left:${L}px; top:446px; width:${CW}px">Results logged per month</p>
        ${svgAt(L, gY, CW, GH + 60, `${bars}
          <text class="tb" x="${cb.x + cb.width}" y="${cb.y - 18}" text-anchor="end">${fmtInt(cur.results)}</text>
          ${lastYear ? `<text class="tb" x="${bar(lastYear).x + bar(lastYear).width / 2}" y="${bar(lastYear).y - 18}" text-anchor="middle">${fmtInt(lastYear.results)}</text>` : ''}
          ${tick(sr[0], 'start')}${lastYear ? tick(lastYear, 'middle') : ''}${tick(cur, 'end')}`)}`) },
      { id: 'month-3', body: lid('month', box('3/3'), `
        <h2 class="abs h2" style="left:${L}px; top:220px; width:${CW}px">${mName} in numbers</h2>
        <div class="abs" style="left:${L}px; top:330px; width:${CW}px; border-top:2px solid var(--ink)">
          ${specs.map(x => `<div class="spec"><span class="lab">${h(x.label)}${isRecord(x.k) ? ' <span class="tag">most ever</span>' : ''}</span><span class="sv">${fmtInt(x.v)}</span></div>`).join('')}
        </div>
        <p class="abs cta" style="left:${L}px; top:930px; width:${CW}px">${h(m.question)}</p>`) },
    ],
  };
}

const direction: Direction = {
  id: 'D4',
  name: 'Box Lid & Shelf',
  idea: 'Every post is a puzzle-box lid: muted brand-tint lid, printed hairline frame, piece-count corner badge and a spine strip with series, issue and logo, so the profile grid reads as a shelf of boxes.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
