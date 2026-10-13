// D1 · Scorecard Editorial (Economist / Our World in Data lineage).
// White ground, one coral highlight against light-grey context, takeaway headlines, direct labels,
// a small coral piece as the fixed brand device top left, source line and logo bottom.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, assignUnits, barGeometry, flagUrl, pieceGrid, rankGeometry, scatterPieces, singlePiece } from '../../../src/design/svg.ts';
import { toUnits, type Content } from '../content.ts';
import type { Direction, Post } from '../types.ts';

const W = 1080, X0 = 88, CW = 904;
const device = singlePiece(60, 5);

const css = `
.frame { position: relative; width: 1080px; height: 1350px; padding: 96px ${X0}px 0; background: var(--paper); }
.top { display: flex; align-items: center; gap: 22px; height: 64px; }
.top svg { width: 58px; height: 58px; }
.kicker { font-size: 34px; font-weight: 500; color: var(--ink-soft); letter-spacing: 0.2px; }
.series { margin-left: auto; font-size: 30px; font-weight: 500; color: var(--ink-muted); }
.h1 { font-size: 112px; line-height: 1.0; font-weight: 700; letter-spacing: -2.5px; margin-top: 64px; }
.h2 { font-size: 64px; line-height: 1.08; font-weight: 700; letter-spacing: -1px; margin-top: 44px; }
.dek { font-size: 44px; line-height: 1.25; color: var(--ink-soft); margin-top: 32px; max-width: 860px; }
.foot { position: absolute; left: ${X0}px; right: ${X0}px; bottom: 72px; display: flex; align-items: center; justify-content: space-between; border-top: 3px solid var(--line); padding-top: 26px; }
.src { font-size: 30px; color: var(--ink-muted); }
.logo { width: 64px; height: 57px; }
.lab { font-size: 34px; fill: var(--ink-soft); font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-strong { font-size: 40px; font-weight: 700; fill: var(--ink); font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-hl { font-size: 40px; font-weight: 700; fill: var(--indigo-500); font-family: Rubik; font-variant-numeric: tabular-nums; }
.big { font-size: 300px; font-weight: 700; line-height: 0.9; letter-spacing: -8px; }
.big.hl { color: var(--ink); }
.underline { display: inline-block; border-bottom: 18px solid var(--coral-500); line-height: 0.8; }
.cta { position: absolute; left: ${X0}px; right: ${X0}px; bottom: 210px; font-size: 52px; font-weight: 700; line-height: 1.15; color: var(--indigo-500); }
.rank { position: absolute; left: ${X0}px; top: 450px; width: ${CW}px; }
.row { position: absolute; left: 0; display: flex; align-items: center; height: 58px; width: ${CW}px; }
.row img { width: 46px; height: 46px; }
.row .name { width: 300px; margin-left: 18px; font-size: 36px; font-weight: 500; }
.row .val { width: 120px; text-align: right; font-size: 36px; font-weight: 700; }
.row .bar { height: 30px; margin-left: 22px; border-radius: 0 4px 4px 0; background: var(--context); }
.row.first .bar { background: var(--coral-500); }
.ref { position: absolute; left: ${X0}px; right: ${X0}px; font-size: 32px; color: var(--ink-soft); }
.legend { display: flex; gap: 34px; flex-wrap: wrap; margin-top: 40px; font-size: 34px; color: var(--ink-soft); }
.legend b { color: var(--ink); }
.sw { display: inline-block; width: 30px; height: 30px; border-radius: 6px; vertical-align: -5px; margin-right: 10px; border: 3px solid var(--ink); }
.hlt { color: var(--indigo-500); font-weight: 700; }
.ep-l { position: absolute; font-size: 44px; font-weight: 700; color: var(--indigo-500); letter-spacing: 6px; text-align: center; }
.plist { position: absolute; left: ${X0}px; width: ${CW}px; }
.prow { position: absolute; left: 0; width: ${CW}px; display: flex; align-items: center; }
.prow .who { width: 500px; flex: none; }
.prow .pn { font-size: 38px; font-weight: 600; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prow .pb { font-size: 30px; line-height: 1.2; color: var(--ink-soft); margin-top: 6px; }
.prow .bar { height: 30px; border-radius: 0 4px 4px 0; background: var(--context); flex: none; }
.prow.first .bar { background: var(--coral-500); }
.prow .val { font-size: 38px; font-weight: 700; margin-left: 16px; }
.fastlist { position: absolute; left: ${X0}px; width: ${CW}px; }
.sect { font-size: 34px; font-weight: 500; color: var(--ink-soft); padding-bottom: 12px; border-bottom: 3px solid var(--line); }
.sect + .sect, .fast + .sect { margin-top: 40px; }
.fast { display: grid; grid-template-columns: 236px 1fr; column-gap: 20px; padding: 22px 0 20px; border-bottom: 3px solid var(--line); }
.fast .t { font-size: 50px; font-weight: 700; line-height: 1; letter-spacing: -0.5px; padding-top: 2px; }
.fast .t span { display: inline-block; line-height: 0.82; }
.fast.first .t span { border-bottom: 8px solid var(--coral-500); }
.fast .nm { display: flex; align-items: center; gap: 14px; font-size: 38px; font-weight: 600; line-height: 1.15; }
.fast .nm img { width: 40px; height: 40px; }
.fast .ig { font-size: 32px; font-weight: 500; color: var(--indigo-500); }
.fast .sub { font-size: 30px; line-height: 1.25; color: var(--ink-soft); margin-top: 6px; }
.stat2 { display: flex; align-items: baseline; gap: 28px; margin-top: 52px; }
.stat2 .n { font-size: 112px; font-weight: 700; line-height: 1; letter-spacing: -2.5px; }
.stat2 .l { font-size: 44px; line-height: 1.2; color: var(--ink-soft); }
.tbl { position: absolute; left: ${X0}px; width: ${CW}px; border-collapse: collapse; }
.tbl th { font-size: 30px; font-weight: 500; color: var(--ink-muted); text-align: right; padding: 0 0 14px; border-bottom: 3px solid var(--line); }
.tbl th:first-child, .tbl td:first-child { text-align: left; }
.tbl td { font-size: 38px; text-align: right; height: 108px; border-bottom: 3px solid var(--line); }
.tbl td:first-child { font-size: 36px; font-weight: 500; }
.tbl td.now { font-weight: 700; }
.tbl td.chg { font-weight: 700; color: var(--indigo-500); }
`;

const top = (kicker: string, n: string) => `
<header class="top">
  <svg viewBox="${device.viewBox}"><path d="${device.d}" fill="var(--coral-500)" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/></svg>
  <span class="kicker">${h(kicker)}</span><span class="series">${h(n)}</span>
</header>`;
const foot = (src: string) => `<footer class="foot"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const frame = (inner: string) => `<div class="frame">${inner}</div>`;

function wall(c: Content): Post {
  const w = c.wall;
  // Teaser chart on the cover: 50–66 min.
  const teaser = w.histogram.filter(d => d.minute >= 48 && d.minute <= 68);
  const tg = barGeometry(teaser, { x: d => d.minute, y: d => d.results, width: CW, height: 420, padding: 0.22 });
  const tBars = tg.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="4" fill="${b.datum.minute >= 55 && b.datum.minute <= 59 ? 'var(--coral-500)' : 'var(--context)'}"/>`).join('');
  const x60 = tg.xScale('60')! - (tg.xScale.step() - tg.xScale.bandwidth()) / 2;

  // Full histogram: 40–80 min.
  const H = 600;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: CW, height: H, padding: 0.2 });
  const bars = g.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="3" fill="${b.datum.minute >= 55 && b.datum.minute <= 59 ? 'var(--coral-500)' : 'var(--context)'}"/>`).join('');
  const band = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const bar60 = g.bars.find(b => b.datum.minute === 60)!;
  const line60 = g.xScale('60')! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const ticks = [40, 50, 60, 70, 80].map(m => `<text class="lab" x="${band(m)}" y="${H + 52}" text-anchor="${m === 80 ? 'end' : 'middle'}">${m === 80 ? '80 min' : m}</text>`).join('');

  // Quartile strip for the context slide.
  const qs = (m: number) => ((m - 30) / (100 - 30)) * CW;
  const q = w.quartiles;

  return {
    key: 'wall',
    slides: [
      { id: 'wall-1', body: frame(`${top(w.kicker, 'MSP DATA')}
        <h1 class="h1">The 59-minute<br>wall</h1>
        <p class="dek">${h(w.dek)}</p>
        <svg width="${CW}" height="470" style="position:absolute; left:${X0}px; top:690px">
          ${tBars}
          <line x1="${x60}" x2="${x60}" y1="-20" y2="430" stroke="var(--ink)" stroke-width="4" stroke-dasharray="10 8"/>
          <text class="lab-strong" x="${x60 + 16}" y="10">60:00</text>
        </svg>
        ${foot(c.source)}`) },
      { id: 'wall-2', body: frame(`${top(w.kicker, '2 / 4')}
        <h2 class="h2">${w.mode.minute} minutes is the most common finish. Then the counts drop.</h2>
        <svg width="${CW}" height="${H + 70}" style="position:absolute; left:${X0}px; top:500px">
          ${bars}
          <line x1="${line60}" x2="${line60}" y1="-30" y2="${H}" stroke="var(--ink)" stroke-width="4" stroke-dasharray="10 8"/>
          <text class="lab-strong" x="${modeBar.x + modeBar.width + 18}" y="${modeBar.y - 40}" text-anchor="end">${w.mode.minute} min</text>
          <text class="lab" x="${modeBar.x + modeBar.width + 18}" y="${modeBar.y - 2}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
          <text class="lab-hl" x="${bar60.x + 34}" y="${bar60.y + 70}">${w.dropPct}% at the hour</text>
          ${ticks}
        </svg>
        ${foot(c.source)}`) },
      { id: 'wall-3', body: frame(`${top(w.kicker, '3 / 4')}
        <h2 class="h2">No step at 45 or 50 minutes. The hour is the line people race for.</h2>
        <svg width="${CW}" height="360" style="position:absolute; left:${X0}px; top:640px">
          <rect x="0" y="150" width="${CW}" height="16" rx="8" fill="var(--context)"/>
          <rect x="${qs(q.p25)}" y="128" width="${qs(q.p75) - qs(q.p25)}" height="60" rx="10" fill="var(--indigo-100)" stroke="var(--indigo-500)" stroke-width="4"/>
          <line x1="${qs(q.median)}" x2="${qs(q.median)}" y1="112" y2="204" stroke="var(--indigo-500)" stroke-width="8" stroke-linecap="round"/>
          <line x1="${qs(60)}" x2="${qs(60)}" y1="40" y2="250" stroke="var(--ink)" stroke-width="4" stroke-dasharray="10 8"/>
          <text class="lab-strong" x="${qs(60)}" y="20" text-anchor="middle">1 hour</text>
          <text class="lab" x="${qs(q.p25)}" y="250" text-anchor="middle">${fmtDuration(q.p25)}</text>
          <text class="lab-hl" x="${qs(q.median)}" y="300" text-anchor="middle">median ${fmtDuration(q.median)}</text>
          <text class="lab" x="${qs(q.p75)}" y="250" text-anchor="middle">${fmtDuration(q.p75)}</text>
        </svg>
        <p class="ref" style="top:1040px">The middle half of all solo 500s finish between ${fmtDuration(q.p25)} and ${fmtDuration(q.p75)}.</p>
        ${foot(c.source)}`) },
      { id: 'wall-4', body: frame(`${top(w.kicker, '4 / 4')}
        <p class="big" style="margin-top:110px"><span class="underline">${w.subHour.pct}%</span></p>
        <h2 class="h2" style="margin-top:56px">of 500-piece puzzlers have a personal best under one hour</h2>
        <p class="dek">${fmtInt(w.subHour.under60)} of ${fmtInt(w.subHour.puzzlers)} puzzlers with a solo 500 time</p>
        <p class="cta">${h(w.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

function record(c: Content): Post {
  const r = c.record;
  return { key: 'record', slides: [{ id: 'record-1', body: frame(`${top(r.kicker, 'MSP DATA')}
    <p class="big" style="margin-top:130px; font-size:290px"><span class="underline">${r.value}</span></p>
    <h2 class="h2" style="margin-top:70px">${h(r.title)}</h2>
    <p class="dek">${h(r.context)}</p>
    ${foot(r.footnote + ' · ' + c.asOf)}`) }] };
}

function countries(c: Content): Post {
  const k = c.countries;
  const rows = rankGeometry(k.top, { value: d => d.medianPb, width: 380, rowHeight: 58, gap: 8, domain: [0, 70] });
  return { key: 'countries', slides: [{ id: 'countries-1', body: frame(`${top('Solo 500 pieces', 'MSP DATA')}
    <h2 class="h2">${h(k.title)}</h2>
    <p class="dek" style="font-size:36px; margin-top:20px">${h(k.dek)}</p>
    <div class="rank">${rows.map((r, i) => `<div class="row ${i === 0 ? 'first' : ''}" style="top:${r.y}px">
      <img src="${flagUrl(r.datum.code)}" alt=""><span class="name">${h(r.datum.name)}</span><span class="val">${fmtDuration(r.datum.medianPb)}</span><span class="bar" style="width:${r.width}px"></span></div>`).join('')}</div>
    <p class="ref" style="top:1132px">Everyone: ${fmtDuration(k.reference[1].value!)} · United States: ${fmtDuration(k.reference[0].value!)}</p>
    ${foot(c.source)}`) }] };
}

function share(c: Content): Post {
  const s = c.share;
  const size = 640;
  const grid = pieceGrid({ cols: 10, rows: 10, x: 0, y: 0, width: size, height: size, seed: 21 });
  const colour: Record<string, string> = { '500': 'var(--coral-500)', 'under 500': 'var(--indigo-200)', '1000': 'var(--sky-300)', other: 'var(--ink)' };
  const units = assignUnits(grid, s.units.map(u => ({ key: u.key, units: u.units })));
  return { key: 'share', slides: [{ id: 'share-1', body: frame(`${top('Puzzle sizes', 'MSP DATA')}
    <h2 class="h2">${h(s.title)}</h2>
    <svg width="${size}" height="${size}" viewBox="-6 -6 ${size + 12} ${size + 12}" style="position:absolute; left:${(W - size) / 2}px; top:390px">
      ${units.map(u => `<path d="${u.piece.d}" fill="${colour[u.key]}" stroke="var(--paper)" stroke-width="4" stroke-linejoin="round"/>`).join('')}
    </svg>
    <div class="legend" style="position:absolute; left:${X0}px; top:1066px; width:${CW}px; margin:0">
      ${s.units.map(u => `<span><i class="sw" style="background:${colour[u.key]}"></i><b>${u.pct}%</b> ${h(s.labels[u.key])}</span>`).join('')}
    </div>
    ${foot(`Each piece = 1% of ${fmtInt(c.totals.results)} results · ${c.asOf}`)}`) }] };
}

function xp(c: Content): Post {
  const x = c.xp;
  const keep = { x: 170, y: 330, width: 740, height: 620 };
  const pieces = scatterPieces({ count: 16, width: 1080, height: 1350, pieceSize: 150, keepOut: keep, seed: 17 });
  const fills = ['var(--coral-400)', 'var(--indigo-300)', 'var(--sky-300)', 'var(--coral-200)', 'var(--indigo-200)', 'var(--sky-200)'];
  return { key: 'xp', slides: [{ id: 'xp-1', body: `<div class="frame" style="padding:0">
    <svg width="1080" height="1350" style="position:absolute; inset:0">
      ${pieces.map((p, i) => `<path d="${p.piece.d}" transform="${p.transform}" fill="${fills[i % fills.length]}" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>`).join('')}
    </svg>
    <div style="position:absolute; left:${keep.x}px; top:${keep.y}px; width:${keep.width}px; text-align:center">
      <p style="font-size:44px; font-weight:700; color:var(--indigo-500); letter-spacing:6px">LEVEL</p>
      <p style="font-size:300px; font-weight:800; line-height:0.95">${x.level}</p>
      <p class="h2" style="margin-top:20px">${h(x.title)}</p>
      <p class="dek" style="margin:24px auto 0; max-width:640px">${h(x.dek)}</p>
    </div>
  </div>`, safe: { x0: 88, y0: 64, x1: 992, y1: 1286 } }] };
}

// ---------------------------------------------------------------- recurring and news posts
type Fast = Content['weekly']['fastest500'][number];
type FastGroup = Fast & { also: string[]; samePuzzle: boolean };
/** One row per puzzler: the best time leads, any further top times by the same puzzler are listed under it. */
function byPlayer(rows: Fast[]): FastGroup[] {
  const out: FastGroup[] = [];
  for (const r of rows) {
    const g = out.find(o => o.player === r.player);
    if (g) { g.also.push(r.time); g.samePuzzle &&= g.puzzle === r.puzzle; } else out.push({ ...r, also: [], samePuzzle: true });
  }
  return out;
}
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}`; // "28 Sep"
const monthLabel = (ym: string, month: 'short' | 'long' = 'short') => new Date(ym + '-01T12:00:00Z').toLocaleDateString('en-US', { month, timeZone: 'UTC' });
const badge = singlePiece(60, 13); // an interior piece with four tabs: the weekly series' episode badge

function weekly(c: Content): Post {
  const w = c.weekly;
  const total = 4;
  const kick = `${w.series} · Ep. ${w.episode}`;

  // 1 · Cover: series name, a coral episode piece (the series mark in the grid), the week's headline number.
  const ep = String(w.episode);
  const bs = 286, bx = X0 + CW - bs, by = 278;
  const [vx, vy, vw, vh] = badge.viewBox.split(' ').map(Number);
  const k = bs / Math.max(vw, vh);
  const epFont = ep.length > 2 ? 104 : 168;
  const coreX = bx + (90 - vx) * k + (bs - vw * k) / 2, coreY = by + (90 - vy) * k + (bs - vh * k) / 2;
  const words = w.series.split(' '), half = Math.ceil(words.length / 2);
  const [l1, l2] = [words.slice(0, half).join(' '), words.slice(half).join(' ')];

  // 2 · Top puzzles.
  const tp = w.topPuzzles;
  const prows = rankGeometry(tp, { value: d => d.solvers, width: 300, rowHeight: 100, gap: 26 });

  // 3 · Fastest of the week, one row per puzzler.
  const g500 = byPlayer(w.fastest500), g1000 = byPlayer(w.fastest1000);
  const leaders = [...new Set([g500[0]?.player, g1000[0]?.player].filter(Boolean))] as string[];
  const fastRow = (g: FastGroup, i: number) => `<div class="fast ${i === 0 ? 'first' : ''}">
    <p class="t"><span>${g.time}</span></p>
    <div><p class="nm">${g.country ? `<img src="${flagUrl(g.country)}" alt="">` : ''}<span>${h(g.player)}</span>${g.handle ? `<span class="ig">@${h(g.handle)}</span>` : ''}</p>
      <p class="sub">${h(g.puzzle)} · ${h(g.brand)}${g.firstAttempt ? ' · first attempt' : ''}</p>
      ${g.also.length ? `<p class="sub">Also ${andList(g.also)}${g.samePuzzle ? ' on the same puzzle' : ''}</p>` : ''}</div></div>`;
  const section = (label: string, gs: FastGroup[]) => gs.length ? `<p class="sect">${label}</p>${gs.map(fastRow).join('')}` : '';

  return {
    key: 'weekly',
    slides: [
      { id: 'weekly-1', body: frame(`${top(`Season ${w.season}`, 'MSP DATA')}
        <h1 class="h1">${h(l1)}<br>${h(l2)}</h1>
        <p class="dek" style="max-width:560px">${h(w.range)}</p>
        <p class="ep-l" style="left:${bx}px; width:${bs}px; top:${by - 66}px">EPISODE</p>
        <svg width="${bs}" height="${bs}" viewBox="${badge.viewBox}" style="position:absolute; left:${bx}px; top:${by}px">
          <path d="${badge.d}" fill="var(--coral-500)" stroke="var(--ink)" stroke-width="${(5 / k).toFixed(2)}" stroke-linejoin="round"/>
        </svg>
        <p class="big" data-qa-bg="#ec726f" style="position:absolute; left:${coreX - 150}px; width:300px; text-align:center; top:${coreY - 0.5 * epFont}px; font-size:${epFont}px; letter-spacing:-4px; line-height:1">${ep}</p>
        <div style="position:absolute; left:${X0}px; top:612px; width:${CW}px; border-top:3px solid var(--ink)"></div>
        <p class="big" style="position:absolute; left:${X0}px; top:664px; font-size:230px">${fmtInt(w.results)}</p>
        <p class="h2" style="position:absolute; left:${X0}px; top:${664 + 230 * 0.9 + 34}px; margin:0">results logged last week</p>
        <p class="dek" style="position:absolute; left:${X0}px; top:${664 + 230 * 0.9 + 130}px; margin:0"><span class="hlt">${fmtSignedPct(w.resultsChangePct)}</span> on the week before<br>${fmtInt(w.puzzlers)} puzzlers · ${fmtInt(w.pieces)} pieces</p>
        ${foot(c.source)}`) },
      { id: 'weekly-2', body: frame(`${top(kick, `2 / ${total}`)}
        <h2 class="h2">${h(tp[0].puzzle)} was the most-solved puzzle of the week</h2>
        <p class="dek" style="font-size:36px; margin-top:20px">Puzzlers who logged each puzzle last week</p>
        <div class="plist" style="top:500px">${prows.map((r, i) => `<div class="prow ${i === 0 ? 'first' : ''}" style="top:${r.y}px; height:${r.height}px">
          <div class="who"><p class="pn">${h(r.datum.puzzle)}</p><p class="pb">${h(r.datum.brand)} · ${fmtInt(r.datum.pieces)} pieces</p></div>
          <span class="bar" style="width:${r.width.toFixed(1)}px"></span><span class="val">${fmtInt(r.datum.solvers)}</span></div>`).join('')}</div>
        ${foot(c.source)}`) },
      { id: 'weekly-3', body: frame(`${top(kick, `3 / ${total}`)}
        <h2 class="h2">The week's fastest: ${h(andList(leaders))}</h2>
        <div class="fastlist" style="top:${leaders.join('').length > 22 ? 470 : 400}px">
          ${section('Solo 500 pieces', g500)}${section('Solo 1,000 pieces', g1000)}
        </div>
        ${foot(c.source)}`) },
      { id: 'weekly-4', body: frame(`${top(kick, `4 / ${total}`)}
        <p class="big" style="margin-top:110px"><span class="underline">${fmtInt(w.personalBests)}</span></p>
        <h2 class="h2" style="margin-top:56px; text-wrap:balance">personal bests were set last week</h2>
        <div class="stat2"><span class="n">${fmtInt(w.newPuzzlers)}</span><span class="l">new puzzlers logged their first time on MSP</span></div>
        <p class="cta">${h(w.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

function event(c: Content): Post {
  const e = c.event;
  // The share device: a 10×10 piece grid, each piece 1% of registered puzzlers, the share already on MSP in coral.
  const gw = 460, gh = 460;
  const units = toUnits([{ key: 'msp', pct: (e.onMsp / e.registered) * 100 }, { key: 'rest', pct: 100 - (e.onMsp / e.registered) * 100 }]);
  const grid = assignUnits(pieceGrid({ cols: 10, rows: 10, x: 0, y: 0, width: gw, height: gh, seed: 21 }), units);
  return {
    key: 'event',
    slides: [
      { id: 'event-1', body: frame(`${top('Event preview', '1 / 2')}
        <h1 class="h1" style="font-size:96px; letter-spacing:-2px">${h(e.name)}</h1>
        <p class="dek">${h(e.date)} · ${h(e.location)}</p>
        <p class="big" style="margin-top:96px"><span class="underline">${fmtInt(e.registered)}</span></p>
        <h2 class="h2" style="margin-top:56px">puzzlers are registered</h2>
        ${foot(c.source)}`) },
      { id: 'event-2', body: frame(`${top('Event preview', '2 / 2')}
        <h2 class="h2">${fmtInt(e.onMsp)} of the ${fmtInt(e.registered)} registered puzzlers are on MSP</h2>
        <svg width="${gw}" height="${gh}" viewBox="-4 -4 ${gw + 8} ${gh + 8}" style="position:absolute; left:${(W - gw) / 2}px; top:410px">
          ${grid.map(u => `<path d="${u.piece.d}" fill="${u.key === 'msp' ? 'var(--coral-500)' : 'var(--context)'}" stroke="var(--paper)" stroke-width="4" stroke-linejoin="round"/>`).join('')}
        </svg>
        <div class="legend" style="position:absolute; left:${X0}px; top:${410 + gh + 4}px; width:${CW}px; margin:0">
          <span><i class="sw" style="background:var(--coral-500)"></i><b>${fmtInt(e.onMsp)}</b> on MSP</span>
          <span><i class="sw" style="background:var(--context)"></i><b>${fmtInt(e.registered - e.onMsp)}</b> not on MSP yet</span>
        </div>
        ${e.usMedianPb ? `<p class="ref" style="top:${410 + gh + 76}px">Median US personal best, solo 500: <b style="color:var(--ink)">${e.usMedianPb}</b></p>` : ''}
        <p class="cta">${h(e.question)}</p>
        ${foot(`Each piece = 1% of ${fmtInt(e.registered)} registered · ${c.asOf}`)}`) },
    ],
  };
}

function feature(c: Content): Post {
  const f = c.feature;
  // Complete days only: the as-of day is still running.
  const days = f.days.filter(d => !c.asOf.startsWith(dayLabel(d.day) + ' '));
  const isLaunch = (d: { day: string }) => f.launchDate.startsWith(dayLabel(d.day) + ' ');
  const H = 560;
  const g = barGeometry(days, { x: d => d.day, y: d => d.results, width: CW, height: H, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="4" fill="${isLaunch(b.datum) ? 'var(--coral-500)' : 'var(--context)'}"/>`).join('');
  const launch = g.bars.find(b => isLaunch(b.datum))!;
  const ty = g.yScale(f.typicalDay);
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
  const firstBar = g.bars[0];
  const weekBar = g.bars[7];
  return {
    key: 'feature',
    slides: [
      { id: 'feature-1', body: frame(`${top(f.kicker, '1 / 2')}
        <h2 class="h2">${h(f.title)}</h2>
        <p class="dek" style="font-size:36px; margin-top:20px">${fmtInt(f.results)} results on ${h(dayLabel(days.find(isLaunch)!.day))}, ${f.multiple}× a typical day</p>
        <svg width="${CW}" height="${H + 70}" style="position:absolute; left:${X0}px; top:520px">
          ${bars}
          <line x1="0" x2="${CW}" y1="${ty}" y2="${ty}" stroke="var(--ink)" stroke-width="4" stroke-dasharray="10 8"/>
          <text class="lab" x="0" y="${ty - 16}">Typical day: ${fmtInt(f.typicalDay)}</text>
          <text class="lab-strong" x="${launch.x - 16}" y="${launch.y + 34}" text-anchor="end">${fmtInt(f.results)}</text>
          <text class="lab" x="${launch.x - 16}" y="${launch.y + 74}" text-anchor="end">launch day</text>
          <text class="lab" x="${mid(firstBar)}" y="${H + 52}" text-anchor="start" dx="${-firstBar.width / 2}">${h(dayLabel(firstBar.datum.day))}</text>
          ${weekBar && weekBar !== launch ? `<text class="lab" x="${mid(weekBar)}" y="${H + 52}" text-anchor="middle">${h(dayLabel(weekBar.datum.day))}</text>` : ''}
          <text class="lab-strong" x="${launch.x + launch.width}" y="${H + 54}" text-anchor="end">${h(dayLabel(launch.datum.day))}</text>
        </svg>
        ${foot(c.source)}`) },
      { id: 'feature-2', body: frame(`${top(f.kicker, '2 / 2')}
        <p class="big" style="margin-top:110px"><span class="underline">${f.backfilledPct}%</span></p>
        <h2 class="h2" style="margin-top:56px; text-wrap:balance">of launch-day results were puzzles solved before that day</h2>
        <p class="dek">${fmtInt(f.backfilled)} of ${fmtInt(f.results)}. ${h(f.dek)}</p>
        <p class="cta">${h(f.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

function month(c: Content): Post {
  const m = c.month;
  const cur = m.series.at(-1)!;
  const prevKey = `${Number(cur.month.slice(0, 4)) - 1}${cur.month.slice(4)}`;
  const prev = m.series.find(x => x.month === prevKey)!;
  const name = monthLabel(cur.month, 'long');
  const short = (ym: string) => `${monthLabel(ym)} ${ym.slice(0, 4)}`;

  const H = 540;
  const g = barGeometry(m.series, { x: d => d.month, y: d => d.results, width: CW, height: H, padding: 0.2, yMax: Math.max(...m.series.map(d => d.results)) * 1.12 });
  const bars = g.bars.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="3" fill="${b.datum === cur ? 'var(--coral-500)' : 'var(--context)'}"/>`).join('');
  const bCur = g.bars.at(-1)!, bPrev = g.bars.find(b => b.datum === prev)!;
  const jan = g.bars.filter(b => b.datum.month.endsWith('-01'));
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;

  const rowsT: Array<[string, number, number]> = [
    ['Results', prev.results, cur.results],
    ['Active puzzlers', prev.active, cur.active],
    ['Pieces', prev.pieces, cur.pieces],
    ['New puzzlers', prev.newPlayers, cur.newPlayers],
  ];
  const chg = (a: number, b: number) => fmtSignedPct(((b - a) / a) * 100, 0);
  const allUp = rowsT.every(([, a, b]) => b > a);

  return {
    key: 'month',
    slides: [
      { id: 'month-1', body: frame(`${top('Monthly report', '1 / 3')}
        <h1 class="h1">${h(m.title)}</h1>
        <p class="big" style="margin-top:72px; font-size:240px"><span class="underline">${fmtInt(m.results)}</span></p>
        <p class="dek" style="margin-top:52px">results in ${h(m.label)}<br><span class="hlt">${fmtSignedPct(m.vsLastYearPct, 0)}</span> on ${h(monthLabel(prev.month, 'long'))} ${prev.month.slice(0, 4)}</p>
        ${foot(c.source)}`) },
      { id: 'month-2', body: frame(`${top('Monthly report', '2 / 3')}
        <h2 class="h2">${h(name)} results were up ${m.vsLastYearPct}% on a year earlier</h2>
        <p class="dek" style="font-size:36px; margin-top:20px">Results logged per month, ${h(short(m.series[0].month))} – ${h(short(cur.month))}</p>
        <svg width="${CW}" height="${H + 70}" style="position:absolute; left:${X0}px; top:500px">
          ${bars}
          <text class="lab-strong" x="${bCur.x + bCur.width}" y="${bCur.y - 18}" text-anchor="end">${fmtInt(cur.results)}</text>
          <text class="lab" x="${mid(bPrev)}" y="${Math.min(...g.bars.filter((_, i) => Math.abs(i - g.bars.indexOf(bPrev)) <= 1).map(b => b.y)) - 18}" text-anchor="middle">${fmtInt(prev.results)}</text>
          ${jan.map((b, i) => `<text class="lab" x="${i === 0 ? b.x : mid(b)}" y="${H + 52}" text-anchor="${i === 0 ? 'start' : 'middle'}">${h(short(b.datum.month))}</text>`).join('')}
          <text class="lab" x="${mid(bPrev)}" y="${H + 52}" text-anchor="middle">${h(monthLabel(prev.month))}</text>
          <text class="lab-strong" x="${bCur.x + bCur.width}" y="${H + 54}" text-anchor="end">${h(monthLabel(cur.month))}</text>
        </svg>
        ${foot(c.source)}`) },
      { id: 'month-3', body: frame(`${top('Monthly report', '3 / 3')}
        <h2 class="h2" style="text-wrap:balance">${allUp ? `Every number is up on ${h(monthLabel(prev.month, 'long'))} ${prev.month.slice(0, 4)}` : `${h(m.label)} against a year earlier`}</h2>
        <table class="tbl" style="top:${allUp ? 400 : 470}px">
          <tr><th></th><th style="width:210px">${h(short(prev.month))}</th><th style="width:250px">${h(short(cur.month))}</th><th style="width:150px">Change</th></tr>
          ${rowsT.map(([l, a, b]) => `<tr><td>${l}</td><td>${fmtInt(a)}</td><td class="now">${fmtInt(b)}</td><td class="chg">${chg(a, b)}</td></tr>`).join('')}
        </table>
        <p class="cta">${h(m.question)}</p>
        ${foot(c.source)}`) },
    ],
  };
}

const direction: Direction = {
  id: 'D1',
  name: 'Scorecard Editorial',
  idea: 'Newspaper-grade data pages: takeaway headlines, one coral highlight against light grey, direct labels, a small coral piece as the fixed device top left, source and logo bottom.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
