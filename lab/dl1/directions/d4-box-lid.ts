// D4 · Box Lid & Shelf.
// Every post is a puzzle-box lid: a muted brand-tint lid with a printed hairline frame, a piece-count
// corner badge, and a full-height spine strip on the left with the series name, issue number and the MSP
// logo, so the profile grid reads like a shelf of boxes. The "box art" is the chart or number itself.
// No manufacturer art, no imitation of real brands.
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
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
};

const css = `
:root { --d4-sand: #ecdcca; --d4-mint: #bfe8d4; --d4-mint-lid: #ecf9f2; }
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
`;

function lid(key: string, opts: { badge: [string, string]; kicker: string; page?: string; src?: string }, inner: string) {
  const s = SERIES[key];
  const issue = `No. ${s.issue}${opts.page ? ` · ${opts.page}` : ''}`;
  return `<div class="lid" style="background:${s.lid}">
  <div class="spine" style="background:${s.spine}">
    <span class="spine-name">${h(s.name)}</span>
    <span class="spine-no">${h(issue)}</span>
    <img class="spine-logo" src="${LOGO_URL}" alt="">
  </div>
  <div class="frame"></div>
  <p class="kick">${h(opts.kicker)}</p>
  <div class="badge"><b>${h(opts.badge[0])}</b><span data-qa-small>${h(opts.badge[1])}</span></div>
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

const direction: Direction = {
  id: 'D4',
  name: 'Box Lid & Shelf',
  idea: 'Every post is a puzzle-box lid: muted brand-tint lid, printed hairline frame, piece-count corner badge and a spine strip with series, issue and logo, so the profile grid reads as a shelf of boxes.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c)],
};
export default direction;
