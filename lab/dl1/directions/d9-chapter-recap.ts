// D9 · Chapter Recap (Stories narrative; Strava Year in Sport / Wrapped lineage, restrained).
// Six 9:16 frames, one chapter each. The ground colour changes per chapter (all brand tones, flat), the chapter
// marker is identical on every frame: a strip of six interlocking generator pieces that fills in as the story
// advances. A tonal jigsaw floor sits under the reply bar. All text stays inside the Story safe area.
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import { LOGO_URL, assignUnits, barGeometry, flagUrl, pieceGrid, rankGeometry } from '../../../src/design/svg.ts';
import { FRAMES } from '../../../src/render/render.ts';
import type { Content } from '../content.ts';
import type { Direction, Post, Slide } from '../types.ts';

const SAFE = FRAMES.story.safe;          // x 65–1015, y 270–1540
const X0 = 88, CW = 904;                 // content column, inside the safe area
const MARK_Y = SAFE.y0 + 24;             // chapter marker row
const FOOT_Y = SAFE.y1 - 74;             // footer row (logo disc + source)
const CHAPTERS = 6;
const INK = '#2b3445';
const CORAL = '#fb8180';

interface Theme { bg: string; ink: string; soft: string; accent: string; tone: string; dark: boolean }
const THEMES: Record<string, Theme> = {
  navy: { bg: '#2b3445', ink: '#ffffff', soft: '#c3cad8', accent: CORAL, tone: '#323c50', dark: true },
  sky: { bg: '#e2f4ff', ink: INK, soft: '#4b566b', accent: CORAL, tone: '#d2ebfd', dark: false },
  coral: { bg: '#ec726f', ink: INK, soft: INK, accent: '#ffffff', tone: '#e5655f', dark: false },
  lilac: { bg: '#dde3ff', ink: INK, soft: '#4b566b', accent: CORAL, tone: '#d0d7fd', dark: false },
  paper: { bg: '#ffffff', ink: INK, soft: '#4b566b', accent: CORAL, tone: '#f2f5f9', dark: false },
  indigo: { bg: '#4e54c8', ink: '#ffffff', soft: '#dde3ff', accent: CORAL, tone: '#565cce', dark: true },
};

const n = (v: number) => +v.toFixed(2);

// ── Chapter marker: the middle row of a 6×3 jigsaw, so every piece has real knobs and still interlocks ─
function strip(count: number, s: number, seed: number) {
  const jig = generateJigsaw({ cols: count, rows: 3, width: s * count, height: s * 3, seed, tabSize: 0.24, jitter: 0.02 });
  const row = jig.pieces.filter(p => p.row === 1).sort((a, b) => a.col - b.col);
  const y0 = Math.min(...row.map(p => p.bbox.y)), y1 = Math.max(...row.map(p => p.bbox.y + p.bbox.height));
  return { s, w: s * count, y0, y1, pieces: row };
}
const STRIP = strip(CHAPTERS, 50, 9);

function marker(ch: number, t: Theme, st = STRIP, total = CHAPTERS) {
  const pad = 6, hh = st.y1 - st.y0;
  const paths = st.pieces.map((p, i) => {
    const done = i < ch - 1, now = i === ch - 1;
    const fill = now ? t.accent : done ? t.ink : 'none';
    const stroke = done ? t.bg : now && !t.dark ? INK : t.ink;
    return `<path d="${p.d}" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`;
  }).join('');
  return `<header class="mark">
    <svg width="${st.w + pad * 2}" height="${n(hh + pad * 2)}" viewBox="${-pad} ${n(st.y0 - pad)} ${st.w + pad * 2} ${n(hh + pad * 2)}" aria-hidden="true">${paths}</svg>
    <span class="ch">Chapter ${ch} of ${total}</span>
  </header>`;
}

/** Tonal jigsaw floor under the reply bar: pieces in a same-hue tone, separated by the ground colour. */
function floor(t: Theme, seed: number) {
  const S = 300, cols = 5, rows = 2;
  const jig = generateJigsaw({ cols, rows, width: S * cols, height: S * rows, seed, tabSize: 0.22, jitter: 0.04, x: -210, y: 0 });
  return `<svg class="floor" width="1080" height="${1920 - 1630}" viewBox="0 0 1080 ${1920 - 1630}" aria-hidden="true">
    ${jig.pieces.map(p => `<path d="${p.d}" fill="${t.tone}" stroke="${t.bg}" stroke-width="12" stroke-linejoin="round"/>`).join('')}
  </svg>`;
}

const foot = (t: Theme, src?: string) => `<footer class="foot">
  <span class="disc"><img src="${LOGO_URL}" alt=""></span>${src ? `<span class="src" style="color:${t.soft}">${h(src)}</span>` : ''}
</footer>`;

function frame(ch: number, name: string, themeKey: string, inner: string, src?: string): Slide {
  const t = THEMES[themeKey];
  return {
    id: `story-${ch}`,
    frame: 'story',
    body: `<div class="st ${t.dark ? 'dark' : ''}" aria-label="Chapter ${ch}: ${h(name)}" style="background:${t.bg}; color:${t.ink}; --ink-c:${t.ink}; --soft-c:${t.soft}">
      ${floor(t, 30 + ch)}
      ${marker(ch, t)}
      ${inner}
      ${foot(t, src)}
    </div>`,
  };
}

const css = `
.st { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
.fd { position: relative; width: 1080px; height: 1350px; overflow: hidden; }
.fd .mark { top: 72px; }
.floor { position: absolute; left: 0; top: 1630px; }
.mark { position: absolute; left: ${X0}px; top: ${MARK_Y}px; width: ${CW}px; height: 74px; display: flex; align-items: center; gap: 24px; }
.mark svg { flex: none; margin-left: -6px; }
.mark .ch { font-size: 38px; font-weight: 700; }
.t { position: absolute; left: ${X0}px; width: ${CW}px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.06; text-wrap: balance; }
.d { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 42px; line-height: 1.28; color: var(--soft-c); text-wrap: pretty; }
.hero { position: absolute; left: ${X0 - 8}px; font-weight: 700; line-height: 0.9; letter-spacing: -10px; white-space: nowrap; }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: ${FOOT_Y}px; height: 72px; display: flex; align-items: center; gap: 22px; }
.disc { flex: none; width: 72px; height: 72px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; }
.disc img { width: 52px; height: 46px; }
.src { font-size: 30px; }
.lab { font-size: 36px; font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-b { font-size: 40px; font-weight: 700; font-family: Rubik; font-variant-numeric: tabular-nums; }
.stats { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; flex-direction: column; }
.stats div { display: flex; align-items: baseline; gap: 22px; padding: 22px 0; border-top: 3px solid rgba(255,255,255,0.18); }
.stats b { font-size: 76px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; }
.stats span { font-size: 40px; color: var(--soft-c); }
.rk { position: absolute; left: ${X0}px; width: ${CW}px; }
.rk .row { position: absolute; left: 0; width: ${CW}px; display: flex; align-items: center; }
.rk img { flex: none; width: 56px; height: 56px; }
.rk .name { width: 330px; margin-left: 22px; font-size: 40px; font-weight: 500; }
.rk .val { width: 140px; text-align: right; font-size: 40px; font-weight: 700; }
.rk .bar { height: 34px; margin-left: 26px; border-radius: 0 8px 8px 0; background: #fff; }
.rk .row.first img { width: 84px; height: 84px; }
.rk .row.first .name { font-size: 54px; font-weight: 700; width: 302px; }
.rk .row.first .val { font-size: 54px; }
.rk .row.first .bar { height: 48px; background: ${CORAL}; outline: 4px solid ${INK}; outline-offset: -2px; }
.legend { position: absolute; left: ${X0}px; width: ${CW}px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; font-size: 38px; color: var(--soft-c); }
.legend b { color: var(--ink-c); }
.sw { display: inline-block; width: 36px; height: 36px; border-radius: 9px; vertical-align: -6px; margin-right: 14px; }
.q { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 54px; font-weight: 700; line-height: 1.12; text-wrap: balance; }
.sticker { position: absolute; left: ${X0 + 92}px; width: ${CW - 184}px; border: 4px dashed rgba(43,52,69,0.28); border-radius: 36px; }
`;

// ── Chapters ───────────────────────────────────────────────────────────────────────────────────────────

function ch1(c: Content): Slide {
  const t = c.totals;
  return frame(1, 'The count', 'navy', `
    <p class="t" style="top:420px; font-size:64px">Speed puzzlers have logged</p>
    <p class="hero" style="top:520px; font-size:242px; letter-spacing:-14px; color:${CORAL}">${fmtInt(t.results)}</p>
    <p class="d" style="top:780px; font-size:50px; color:#fff; font-weight:500">results on MySpeedPuzzling</p>
    <div class="stats" style="top:930px">
      <div><b>${fmtInt(t.players)}</b><span>puzzlers</span></div>
      <div><b>${fmtInt(t.countries)}</b><span>countries</span></div>
      <div><b>${fmtInt(t.hours)}</b><span>hours on the clock</span></div>
      <div><b>${fmtInt(t.pieces)}</b><span>pieces</span></div>
    </div>`, c.source);
}

function ch2(c: Content): Slide {
  const w = c.wall;
  const isWall = (m: number) => m >= w.mode.minute - 3 && m <= 59;
  const H = 380;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: CW, height: H, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height)}" rx="3" ${isWall(b.datum.minute) ? `fill="${CORAL}" stroke="${INK}" stroke-width="3.5"` : 'fill="#fff"'}/>`).join('');
  const band = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const wallStart = g.bars.find(b => isWall(b.datum.minute))!;
  const bar60 = g.bars.find(b => b.datum.minute === 60)!;
  const line60 = g.xScale('60')! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const ticks = [40, 50, 60, 70, 80].map(m => `<text class="lab" fill="${INK}" x="${n(band(m))}" y="${H + 50}" text-anchor="${m === 40 ? 'start' : m === 80 ? 'end' : 'middle'}">${m === 80 ? '80 min' : m}</text>`).join('');
  const top = 700;
  return frame(2, 'The wall', 'sky', `
    <p class="t" style="top:410px; font-size:84px; letter-spacing:-2.5px">${h(w.title)}</p>
    <p class="d" style="top:520px">${h(w.dek)}</p>
    <svg width="${CW}" height="${H + 70}" style="position:absolute; left:${X0}px; top:${top}px">
      ${bars}
      <line x1="0" x2="${CW}" y1="${H}" y2="${H}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <line x1="${n(line60)}" x2="${n(line60)}" y1="-56" y2="${H}" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
      <text class="lab-b" fill="${INK}" x="${n(wallStart.x - 14)}" y="${n(modeBar.y - 54)}" text-anchor="end">${w.mode.minute} min</text>
      <text class="lab" fill="#4b566b" x="${n(wallStart.x - 14)}" y="${n(modeBar.y - 14)}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
      <text class="lab-b" fill="#4e54c8" x="${n(line60 + 18)}" y="${n(bar60.y - 26)}">${String(w.dropPct).replace('-', '\u2212')}% at the hour</text>
      ${ticks}
    </svg>
    <p class="q" style="top:1196px; color:#4e54c8">${h(w.question)}</p>
    <div class="sticker" style="top:1286px; height:150px" data-qa-ignore></div>`, c.source);
}

function ch3(c: Content): Slide {
  const r = c.record;
  return frame(3, 'The record', 'coral', `
    <p class="t" style="top:420px; font-size:64px">Fastest first try on a 500</p>
    <p class="hero" style="top:540px; font-size:340px; letter-spacing:-14px">${r.value}</p>
    <p class="t" style="top:900px; font-size:58px; letter-spacing:-1px">${h(r.title)}</p>
    <p class="d" style="top:1130px; font-size:48px; color:${INK}">${h(r.context)}</p>
    <p class="d" style="top:1330px; font-size:38px; font-weight:700; color:${INK}">${h(r.footnote)}</p>`);
}

function ch4(c: Content): Slide {
  const k = c.countries;
  const rest = k.top.slice(1);
  const rows = rankGeometry(rest, { value: d => d.medianPb, width: 300, rowHeight: 56, gap: 6, domain: [0, 70] });
  const first = k.top[0];
  const firstW = rankGeometry([first], { value: d => d.medianPb, width: 300, rowHeight: 60, domain: [0, 70] })[0].width;
  return frame(4, 'The fastest countries', 'lilac', `
    <p class="t" style="top:410px; font-size:72px; letter-spacing:-2px">${h(k.title)}</p>
    <p class="d" style="top:572px; font-size:36px">${h(k.dek)}</p>
    <div class="rk" style="top:690px">
      <div class="row first" style="top:0; height:96px"><img src="${flagUrl(first.code)}" alt=""><span class="name">${h(first.name)}</span><span class="val">${fmtDuration(first.medianPb)}</span><span class="bar" style="width:${n(firstW)}px"></span></div>
      ${rows.map(r => `<div class="row" style="top:${r.y + 120}px; height:56px"><img src="${flagUrl(r.datum.code)}" alt=""><span class="name">${h(r.datum.name)}</span><span class="val">${fmtDuration(r.datum.medianPb)}</span><span class="bar" style="width:${n(r.width)}px"></span></div>`).join('')}
    </div>
    <p class="d" style="top:1388px; font-size:32px">Everyone: ${fmtDuration(k.reference[1].value!)} · United States: ${fmtDuration(k.reference[0].value!)}</p>`, c.source);
}

function ch5(c: Content): Slide {
  const s = c.share;
  const size = 700;
  const grid = pieceGrid({ cols: 10, rows: 10, x: 0, y: 0, width: size, height: size, seed: 21 });
  const colour: Record<string, string> = { '500': '#ec726f', 'under 500': '#bcc8ff', '1000': '#a8d9ff', other: INK };
  const units = assignUnits(grid, s.units.map(u => ({ key: u.key, units: u.units })));
  return frame(5, 'The favourite size', 'paper', `
    <p class="t" style="top:410px; font-size:80px; letter-spacing:-2.5px">${h(s.title)}</p>
    <svg width="${size}" height="${size}" viewBox="-6 -6 ${size + 12} ${size + 12}" style="position:absolute; left:${(1080 - size) / 2}px; top:620px">
      ${units.map(u => `<path d="${u.piece.d}" fill="${colour[u.key]}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`).join('')}
    </svg>
    <div class="legend" style="top:1346px">
      ${s.units.map(u => `<span><i class="sw" style="background:${colour[u.key]}"></i><b>${u.pct}%</b> ${h(s.labels[u.key])}</span>`).join('')}
    </div>`, `Each piece = 1% of ${fmtInt(c.totals.results)} results · ${c.asOf}`);
}

/** 12-scallop seal, flat coral, white plate. */
function seal(cx: number, cy: number, R: number) {
  const k = 12, rIn = R * 0.88;
  let d = '';
  for (let i = 0; i < k; i++) {
    const a0 = ((-90 + (360 / k) * i) * Math.PI) / 180, a1 = ((-90 + (360 / k) * (i + 1)) * Math.PI) / 180;
    const [x0, y0] = [cx + rIn * Math.cos(a0), cy + rIn * Math.sin(a0)], [x1, y1] = [cx + rIn * Math.cos(a1), cy + rIn * Math.sin(a1)];
    const chord = Math.hypot(x1 - x0, y1 - y0), sag = R - rIn * Math.cos(Math.PI / k);
    const rr = (chord * chord / 4 + sag * sag) / (2 * sag);
    d += `${i === 0 ? `M${n(x0)} ${n(y0)}` : ''}A${n(rr)} ${n(rr)} 0 0 1 ${n(x1)} ${n(y1)}`;
  }
  return `<path d="${d}Z" fill="${CORAL}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${n(R * 0.7)}" fill="#fff" stroke="${INK}" stroke-width="6"/>`;
}

function ch6(c: Content): Slide {
  const x = c.xp;
  const R = 232, cx = 540, cy = 822;
  return frame(6, 'The Level 50 club', 'indigo', `
    <p class="t" style="top:410px; font-size:64px">${h(x.kicker)}</p>
    <svg width="1080" height="${R * 2 + 40}" style="position:absolute; left:0; top:${cy - R - 20}px" aria-hidden="true">${seal(cx, R + 20, R)}</svg>
    <div style="position:absolute; left:${cx - R * 0.7}px; top:${cy - R * 0.7}px; width:${R * 1.4}px; height:${R * 1.4}px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:${INK}" data-qa-bg="#ffffff">
      <p style="font-size:40px; font-weight:700; letter-spacing:8px; margin-left:8px; color:#4b566b">LEVEL</p>
      <p style="font-size:244px; font-weight:700; line-height:0.86; letter-spacing:-8px">${x.level}</p>
    </div>
    <p class="t" style="top:1094px; font-size:60px; text-align:center">${h(x.dek)}</p>
    <p class="d" style="top:1250px; font-size:36px; text-align:center">${h(x.context)}</p>
    <p class="t" style="top:1372px; font-size:52px; text-align:center; letter-spacing:-1px">What level are you?</p>`, c.source);
}

// ── Optional 4:5 carousel in the chapter style: the wall as four chapters ─────────────────────────────
const STRIP4 = strip(4, 50, 9);
const FX = 88, FW = 904;

function feedFrame(i: number, themeKey: string, inner: string, src?: string): Slide {
  const t = THEMES[themeKey];
  return {
    id: `wall-${i}`,
    body: `<div class="fd" style="background:${t.bg}; color:${t.ink}; --ink-c:${t.ink}; --soft-c:${t.soft}">
      <div class="fmark">${marker(i, t, STRIP4, 4)}</div>
      ${inner}
      <footer class="foot" style="top:1196px; left:${FX}px">
        <span class="disc"><img src="${LOGO_URL}" alt=""></span>${src ? `<span class="src" style="color:${t.soft}">${h(src)}</span>` : ''}
      </footer>
    </div>`,
  };
}

function wallFeed(c: Content): Post {
  const w = c.wall;
  const isWall = (m: number) => m >= w.mode.minute - 3 && m <= 59;
  const minus = String(w.dropPct).replace('-', '\u2212');

  const teaser = w.histogram.filter(d => d.minute >= 48 && d.minute <= 68);
  const TH = 380;
  const tg = barGeometry(teaser, { x: d => d.minute, y: d => d.results, width: FW, height: TH, padding: 0.24 });
  const tBars = tg.bars.map(b => `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height)}" rx="4" fill="${isWall(b.datum.minute) ? CORAL : '#3f4a60'}"/>`).join('');
  const tx60 = tg.xScale('60')! - (tg.xScale.step() - tg.xScale.bandwidth()) / 2;

  const H = 520;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: FW, height: H, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height)}" rx="3" ${isWall(b.datum.minute) ? `fill="${CORAL}" stroke="${INK}" stroke-width="3.5"` : 'fill="#fff"'}/>`).join('');
  const band = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const wallStart = g.bars.find(b => isWall(b.datum.minute))!;
  const bar60 = g.bars.find(b => b.datum.minute === 60)!;
  const line60 = g.xScale('60')! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const ticks = [40, 50, 60, 70, 80].map(m => `<text class="lab" fill="${INK}" x="${n(band(m))}" y="${H + 50}" text-anchor="${m === 40 ? 'start' : m === 80 ? 'end' : 'middle'}">${m === 80 ? '80 min' : m}</text>`).join('');

  const q = w.quartiles, lo = 30, hi = 100, qs = (m: number) => ((m - lo) / (hi - lo)) * FW;

  return {
    key: 'wall',
    slides: [
      feedFrame(1, 'navy', `
        <p class="t" style="top:190px; font-size:120px; letter-spacing:-3.5px; line-height:0.98">${h(w.title).replace(/(\S+-\S+)/, '<span style="white-space:nowrap">$1</span>')}</p>
        <p class="d" style="top:450px; width:840px">${h(w.dek)}</p>
        <svg width="${FW}" height="${TH + 10}" style="position:absolute; left:${FX}px; top:${1150 - TH}px">
          ${tBars}
          <line x1="${n(tx60)}" x2="${n(tx60)}" y1="-60" y2="${TH}" stroke="#fff" stroke-width="4" stroke-dasharray="10 9"/>
          <text class="lab-b" fill="#fff" x="${n(tx60 + 16)}" y="-24">60:00</text>
        </svg>`, c.source),
      feedFrame(2, 'sky', `
        <p class="t" style="top:190px; font-size:66px">${w.mode.minute} minutes is the most common finish. Then the counts drop.</p>
        <svg width="${FW}" height="${H + 70}" style="position:absolute; left:${FX}px; top:${1100 - H - 50}px">
          ${bars}
          <line x1="0" x2="${FW}" y1="${H}" y2="${H}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
          <line x1="${n(line60)}" x2="${n(line60)}" y1="-50" y2="${H}" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
          <text class="lab-b" fill="${INK}" x="${n(wallStart.x - 14)}" y="${n(modeBar.y - 54)}" text-anchor="end">${w.mode.minute} min</text>
          <text class="lab" fill="#4b566b" x="${n(wallStart.x - 14)}" y="${n(modeBar.y - 14)}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
          <text class="lab-b" fill="#4e54c8" x="${n(line60 + 18)}" y="${n(bar60.y - 26)}">${minus}% at the hour</text>
          ${ticks}
        </svg>`, c.source),
      feedFrame(3, 'lilac', `
        <p class="t" style="top:190px; font-size:66px">No step at ${w.noStepAt.join(' or ')} minutes. The hour is the line people race for.</p>
        <svg width="${FW}" height="320" style="position:absolute; left:${FX}px; top:560px">
          <rect x="0" y="130" width="${FW}" height="22" rx="11" fill="#fff"/>
          <rect x="${n(qs(q.p25))}" y="102" width="${n(qs(q.p75) - qs(q.p25))}" height="78" rx="16" fill="${CORAL}" stroke="${INK}" stroke-width="4"/>
          <line x1="${n(qs(q.median))}" x2="${n(qs(q.median))}" y1="88" y2="194" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
          <line x1="${n(qs(60))}" x2="${n(qs(60))}" y1="44" y2="236" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
          <text class="lab-b" fill="${INK}" x="${n(qs(60))}" y="24" text-anchor="middle">1 hour</text>
          <text class="lab" fill="${INK}" x="${n(qs(q.p25))}" y="242" text-anchor="middle">${fmtDuration(q.p25)}</text>
          <text class="lab-b" fill="#4e54c8" x="${n(qs(q.median))}" y="296" text-anchor="middle">median ${fmtDuration(q.median)}</text>
          <text class="lab" fill="${INK}" x="${n(qs(q.p75))}" y="242" text-anchor="middle">${fmtDuration(q.p75)}</text>
        </svg>
        <p class="d" style="top:960px">The middle half of all solo 500s finish between ${fmtDuration(q.p25)} and ${fmtDuration(q.p75)}.</p>`, c.source),
      feedFrame(4, 'coral', `
        <p class="hero" style="top:180px; left:${FX}px; font-size:300px; letter-spacing:-12px">${w.subHour.pct}%</p>
        <p class="t" style="top:480px; font-size:66px">of 500-piece puzzlers have a personal best under one hour</p>
        <p class="d" style="top:720px; font-size:48px; color:${INK}">${fmtInt(w.subHour.under60)} of ${fmtInt(w.subHour.puzzlers)} puzzlers with a solo 500 time</p>
        <p class="q" style="top:960px; color:${INK}; font-size:60px">${h(w.question)}</p>`),
    ],
  };
}

function story(c: Content): Post {
  return { key: 'story', slides: [ch1(c), ch2(c), ch3(c), ch4(c), ch5(c), ch6(c)] };
}

const direction: Direction = {
  id: 'D9',
  name: 'Chapter Recap',
  idea: 'Six Story chapters, one ground colour each; a strip of six interlocking pieces fills in as the marker, a tonal jigsaw floor sits under the reply bar, and one frame leaves room for a poll sticker.',
  css,
  posts: c => [wallFeed(c), story(c)],
};
export default direction;
