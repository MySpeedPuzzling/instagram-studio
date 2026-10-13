// D9 · Chapter Recap (Stories narrative; Strava Year in Sport / Wrapped lineage, restrained).
// Six 9:16 frames, one chapter each. The ground colour changes per chapter (all brand tones, flat), the chapter
// marker is identical on every frame: a strip of six interlocking generator pieces that fills in as the story
// advances. A tonal jigsaw floor sits under the reply bar. All text stays inside the Story safe area.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
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

// ══ Round 2: the weekly Story pack, event Stories and a 4:5 month carousel, same chapter devices. ══

const STRIP2 = strip(2, 50, 9);
const STRIP3 = strip(3, 50, 9);
const LINE: Record<string, string> = { dark: 'rgba(255,255,255,0.18)', light: 'rgba(43,52,69,0.16)' };

/** A Story chapter of any length (the original `frame` stays fixed at six chapters). */
function chapter(o: { id: string; ch: number; total: number; strip: ReturnType<typeof strip>; name: string; theme: string; inner: string; src?: string; seed: number }): Slide {
  const t = THEMES[o.theme];
  return {
    id: o.id,
    frame: 'story',
    body: `<div class="st ${t.dark ? 'dark' : ''}" aria-label="Chapter ${o.ch}: ${h(o.name)}" style="background:${t.bg}; color:${t.ink}; --ink-c:${t.ink}; --soft-c:${t.soft}; --line-c:${t.dark ? LINE.dark : LINE.light}">
      ${floor(t, o.seed)}
      ${marker(o.ch, t, o.strip, o.total)}
      ${o.inner}
      ${foot(t, o.src)}
    </div>`,
  };
}

/** A 4:5 chapter of any length (the original `feedFrame` stays fixed at four). */
function feedChapter(o: { id: string; ch: number; total: number; strip: ReturnType<typeof strip>; theme: string; inner: string; src?: string }): Slide {
  const t = THEMES[o.theme];
  return {
    id: o.id,
    body: `<div class="fd" style="background:${t.bg}; color:${t.ink}; --ink-c:${t.ink}; --soft-c:${t.soft}; --line-c:${t.dark ? LINE.dark : LINE.light}">
      <div class="fmark">${marker(o.ch, t, o.strip, o.total)}</div>
      ${o.inner}
      <footer class="foot" style="top:1196px; left:${FX}px">
        <span class="disc"><img src="${LOGO_URL}" alt=""></span>${o.src ? `<span class="src" style="color:${t.soft}">${h(o.src)}</span>` : ''}
      </footer>
    </div>`,
  };
}

/** Font size that keeps a one-line string inside a width (Rubik bold digits/letters ≈ 0.58 em). */
const fit = (text: string, max: number, width = CW, em = 0.58) => Math.min(max, Math.floor(width / (text.length * em)));
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const flagImg = (code: string, size: number) => (code ? `<img src="${flagUrl(code)}" alt="" style="width:${size}px; height:${size}px">` : '');
const monthName = (ym: string, o: Intl.DateTimeFormatOptions) => new Date(ym + '-01T00:00:00Z').toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });

/** Consecutive results by one player on one puzzle collapse into one entry ("also 17:59 and 18:10"). */
function groupRuns<T extends { player: string; puzzle: string; time: string }>(list: T[]) {
  const out: Array<T & { more: string[] }> = [];
  for (const r of list) {
    const last = out.at(-1);
    if (last && last.player === r.player && last.puzzle === r.puzzle) last.more.push(r.time);
    else out.push({ ...r, more: [] });
  }
  return out;
}

const css2 = `
.kk { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 40px; font-weight: 700; color: var(--soft-c); }
.who { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; align-items: center; gap: 24px; font-size: 64px; font-weight: 700; line-height: 1.05; }
.who img { flex: none; }
.hdl { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 42px; font-weight: 500; }
.hero.hl { isolation: isolate; }
.hero.hl::after { content: ''; position: absolute; left: -4px; right: 2px; bottom: 0.05em; height: 0.15em; border-radius: 12px; background: ${CORAL}; z-index: -1; }
.pill { display: inline-block; font-size: 38px; font-weight: 700; padding: 4px 22px; border-radius: 999px; background: #ffe6e3; color: ${INK}; border: 4px solid ${INK}; }
.tags { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; gap: 22px; align-items: center; font-size: 42px; color: var(--soft-c); }
.ru { position: absolute; left: ${X0}px; width: ${CW}px; }
.ru > div { display: flex; align-items: center; gap: 22px; min-height: 92px; border-top: 3px solid var(--line-c); font-size: 44px; }
.ru .n { width: 34px; font-weight: 700; color: var(--soft-c); }
.ru .nm { flex: 1 1 0; min-width: 0; font-weight: 500; line-height: 1.12; }
.ru .nm em { display: block; font-style: normal; font-size: 36px; color: var(--soft-c); }
.ru .tm { flex: none; font-weight: 700; }
.tl { position: absolute; left: ${X0}px; width: ${CW}px; }
.tl .r { position: absolute; left: 0; width: ${CW}px; height: 92px; }
.tl .k { position: absolute; left: 0; top: 0; font-size: 40px; font-weight: 700; color: var(--soft-c); }
.tl .nm { position: absolute; left: 56px; top: 0; font-size: 40px; font-weight: 700; white-space: nowrap; }
.tl .nm span { font-size: 34px; font-weight: 400; color: var(--soft-c); margin-left: 14px; }
.tl .bar { position: absolute; left: 56px; top: 56px; height: 30px; border-radius: 0 8px 8px 0; background: #fff; }
.tl .v { position: absolute; top: 48px; font-size: 40px; font-weight: 700; }
.row2 { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; align-items: baseline; gap: 26px; }
.recs { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; flex-direction: column; }
.recs > div { display: flex; align-items: baseline; gap: 22px; padding: 22px 0; border-top: 4px solid ${INK}; }
.recs b { font-size: 84px; font-weight: 700; letter-spacing: -2px; line-height: 1; }
.recs span { font-size: 42px; font-weight: 700; }
.recs .pill { align-self: center; margin-left: auto; font-size: 34px; background: #fff; }
`;

// ── The weekly Story pack: "This week in speed puzzling", six chapters ─────────────────────────────────
function weeklyStory(c: Content): Post {
  const w = c.weekly, total = 6;
  const ch = (n: number, name: string, theme: string, inner: string, src?: string) =>
    chapter({ id: `wstory-${n}`, ch: n, total, strip: STRIP, name, theme, inner, src, seed: 50 + n });

  const [first] = w.topPuzzles;
  const BW = 520;
  const rest = rankGeometry(w.topPuzzles.slice(1), { value: d => d.solvers, width: BW, rowHeight: 92, gap: 0, domain: [0, first.solvers] });

  const fastest = (n: number, label: string, theme: string, list: typeof w.fastest500) => {
    const t = THEMES[theme];
    const [win, ...more] = groupRuns(list);
    if (!win) return ch(n, label, theme, `<p class="t" style="top:410px; font-size:76px">${h(label)}</p><p class="d" style="top:600px">No results this week.</p>`, c.source);
    const tSize = fit(win.time, 260, CW, 0.6);
    const dy = more.length ? 0 : 80; // no runner-up rows: centre the winner block a little lower
    const tags = [win.firstAttempt ? '<span class="pill">First try</span>' : '', win.more.length ? `<span>also ${andList(win.more)}</span>` : ''].filter(Boolean).join('');
    return ch(n, label, theme, `
      <p class="kk" style="top:410px">Fastest of the week</p>
      <p class="t" style="top:466px; font-size:84px; letter-spacing:-2.5px">${h(label)}</p>
      <div class="who" style="top:${620 + dy}px">${flagImg(win.country, 84)}<span>${h(win.player)}</span></div>
      ${win.handle ? `<p class="hdl" style="top:${712 + dy}px; color:${t.soft}">@${h(win.handle)}</p>` : ''}
      <p class="hero hl" style="top:${(win.handle ? 770 : 740) + dy}px; left:${X0}px; font-size:${tSize}px; letter-spacing:-8px">${win.time}</p>
      <p class="t" style="top:${(win.handle ? 1036 : 1006) + dy}px; font-size:52px; letter-spacing:-1px">${h(win.puzzle)}</p>
      <p class="d" style="top:${(win.handle ? 1100 : 1070) + dy}px; font-size:40px">${h(win.brand)}</p>
      ${tags ? `<div class="tags" style="top:${(win.handle ? 1170 : 1140) + dy}px">${tags}</div>` : ''}
      ${more.length ? `<div class="ru" style="top:${(win.handle ? 1250 : 1240) + dy}px">${more.slice(0, 2).map((r, i) => `<div><span class="n">${i + 2}</span>${flagImg(r.country, 56)}<span class="nm">${h(r.player)}${r.handle ? `<em>@${h(r.handle)}</em>` : ''}</span><span class="tm">${r.time}</span></div>`).join('')}</div>` : ''}`, c.source);
  };

  const nameSize = fit(first.puzzle, 120, CW, 0.56);
  return {
    key: 'weekly-story',
    slides: [
      ch(1, 'This week', 'navy', `
        <p class="kk" style="top:410px">${h(w.series)} · Episode ${w.episode}</p>
        <p class="t" style="top:470px; font-size:80px; letter-spacing:-2.5px">This week in speed puzzling</p>
        <p class="d" style="top:654px">${h(w.range)}</p>
        <p class="hero" style="top:750px; font-size:250px; letter-spacing:-12px; color:${CORAL}">${fmtInt(w.results)}</p>
        <p class="d" style="top:1004px; font-size:50px; color:#fff; font-weight:500">results logged</p>
        <div class="stats" style="top:1090px">
          <div><b>${fmtSignedPct(w.resultsChangePct)}</b><span>on the week before</span></div>
          <div><b>${fmtInt(w.puzzlers)}</b><span>puzzlers</span></div>
          <div><b>${fmtInt(w.pieces)}</b><span>pieces</span></div>
        </div>`, c.source),
      ch(2, 'The top puzzle', 'sky', `
        <p class="kk" style="top:410px; color:#4b566b">Most-solved puzzle of the week</p>
        <p class="t" style="top:470px; font-size:${nameSize}px; letter-spacing:-3px; white-space:nowrap">${h(first.puzzle)}</p>
        <p class="d" style="top:612px; font-size:44px">${h(first.brand)}</p>
        <div class="row2" style="top:716px"><span style="font-size:180px; font-weight:700; line-height:0.9; letter-spacing:-7px">${fmtInt(first.solvers)}</span><span style="font-size:50px; font-weight:500">puzzlers logged it</span></div>
        <svg width="${BW + 10}" height="56" style="position:absolute; left:${X0 + 50}px; top:900px" aria-hidden="true"><rect x="2" y="2" width="${BW}" height="44" rx="8" fill="${CORAL}" stroke="${INK}" stroke-width="4"/></svg>
        <p class="kk" style="top:990px; color:#4b566b">Then</p>
        <div class="tl" style="top:1060px">${rest.map((r, i) => `<div class="r" style="top:${r.y}px">
          <span class="k">${i + 2}</span><span class="nm">${h(r.datum.puzzle)}<span>${h(r.datum.brand)}</span></span>
          <span class="bar" style="width:${n(r.width)}px"></span><span class="v" style="left:${n(56 + r.width + 18)}px">${fmtInt(r.datum.solvers)}</span></div>`).join('')}</div>`, c.source),
      fastest(3, 'Solo 500', 'indigo', w.fastest500),
      fastest(4, 'Solo 1,000', 'lilac', w.fastest1000),
      ch(5, 'Bests and firsts', 'coral', `
        <p class="t" style="top:410px; font-size:64px">You set</p>
        <p class="hero" style="top:500px; font-size:360px; letter-spacing:-16px">${fmtInt(w.personalBests)}</p>
        <p class="t" style="top:850px; font-size:76px; letter-spacing:-2px">personal bests</p>
        <div class="recs" style="top:1010px">
          <div><b>${fmtInt(w.newPuzzlers)}</b><span>new puzzlers joined in</span></div>
          <div><b>${fmtInt(w.puzzlers)}</b><span>of you logged a result</span></div>
        </div>`),
      ch(6, 'Your week', 'paper', `
        <p class="kk" style="top:410px; color:#4b566b">Your turn</p>
        <p class="t" style="top:470px; font-size:96px; letter-spacing:-3px; color:#4e54c8">${h(w.question)}</p>
        <div class="sticker" style="top:760px; height:420px" data-qa-ignore></div>
        <p class="d" style="top:1250px; font-size:44px">${h(w.series)}, Episode ${w.episode + 1}: next week.</p>`),
    ],
  };
}

// ── Event Stories: preview + "results on …" ────────────────────────────────────────────────────────────
function eventStory(c: Content): Post {
  const e = c.event;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const wd = days.indexOf(e.date.split(' ')[0]);
  const nextDay = wd >= 0 ? days[(wd + 1) % 7] : 'the day after';
  const ch = (n: number, name: string, theme: string, inner: string, src?: string) =>
    chapter({ id: `estory-${n}`, ch: n, total: 2, strip: STRIP2, name, theme, inner, src, seed: 70 + n });
  return {
    key: 'event-story',
    slides: [
      ch(1, 'The preview', 'navy', `
        <p class="kk" style="top:410px">Event preview</p>
        <p class="t" style="top:470px; font-size:84px; letter-spacing:-2.5px">${h(e.name)}</p>
        <p class="d" style="top:760px; font-size:46px; color:#fff"><b>${h(e.date)}</b> · ${h(e.location)}</p>
        <p class="hero" style="top:880px; font-size:300px; letter-spacing:-14px; color:${CORAL}">${fmtInt(e.registered)}</p>
        <p class="d" style="top:1160px; font-size:50px; color:#fff; font-weight:500">puzzlers registered</p>
        <div class="stats" style="top:1250px">
          <div><b>${fmtInt(e.onMsp)}</b><span>of them log their times on MSP</span></div>
        </div>`, c.source),
      ch(2, 'Results', 'sky', `
        <p class="t" style="top:410px; font-size:104px; letter-spacing:-3.5px">Results on ${h(nextDay)}</p>
        <p class="d" style="top:650px">Times from ${h(e.location)}, posted here the day after.</p>
        ${e.usMedianPb ? `<p class="kk" style="top:790px; color:#4b566b">A typical US personal best, solo 500</p>
        <p class="hero" style="top:850px; font-size:190px; letter-spacing:-8px">${e.usMedianPb}</p>
        <p class="d" style="top:1030px; font-size:36px">Median of ${fmtInt(e.usPuzzlers ?? 0)} US puzzlers on MySpeedPuzzling</p>` : ''}
        <p class="q" style="top:1130px; color:#4e54c8">${h(e.question)}</p>
        <div class="sticker" style="top:1290px; height:150px" data-qa-ignore></div>`, c.source),
    ],
  };
}

// ── The record month as a 4:5 carousel in the chapter style ───────────────────────────────────────────
function monthFeed(c: Content): Post {
  const m = c.month, total = 3;
  const cur = m.series.at(-1)!;
  const [yy, mm] = cur.month.split('-');
  const prevKey = `${Number(yy) - 1}-${mm}`;
  const prev = m.series.find(x => x.month === prevKey);
  const name = monthName(cur.month, { month: 'long' });
  const H = 560;
  const g = barGeometry(m.series, { x: d => d.month, y: d => d.results, width: FW, height: H, padding: 0.24 });
  const bars = g.bars.map(b => {
    const isCur = b.datum.month === cur.month, isPrev = b.datum.month === prevKey;
    return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height)}" rx="4" ${isCur ? `fill="${CORAL}" stroke="${INK}" stroke-width="4"` : isPrev ? `fill="#4e54c8"` : 'fill="#fff"'}/>`;
  }).join('');
  const bc = g.bars.at(-1)!, bp = g.bars.find(b => b.datum.month === prevKey);
  const metrics = [
    { key: 'active' as const, label: 'active puzzlers', value: m.active },
    { key: 'newPlayers' as const, label: 'new puzzlers', value: m.newPlayers },
    { key: 'pieces' as const, label: 'pieces', value: m.pieces },
  ];
  const isRecord = (k: 'active' | 'newPlayers' | 'pieces') => m.series.every(x => x[k] <= cur[k]);
  const ch = (i: number, theme: string, inner: string, src?: string) => feedChapter({ id: `month-${i}`, ch: i, total, strip: STRIP3, theme, inner, src });
  return {
    key: 'month',
    slides: [
      ch(1, 'navy', `
        <p class="kk" style="top:186px">${h(m.label)}</p>
        <p class="t" style="top:246px; font-size:100px; letter-spacing:-3px; line-height:1">${h(m.title)}</p>
        <p class="hero" style="top:640px; left:${FX}px; font-size:250px; letter-spacing:-12px; color:${CORAL}">${fmtInt(m.results)}</p>
        <p class="d" style="top:880px; font-size:50px; color:#fff; font-weight:500">results logged in ${h(name)}</p>
        <div class="stats" style="top:980px"><div><b>${fmtSignedPct(m.vsLastYearPct, 0)}</b><span>on ${h(monthName(prevKey, { month: 'long', year: 'numeric' }))}</span></div></div>`, c.source),
      ch(2, 'sky', `
        <p class="t" style="top:190px; font-size:72px; letter-spacing:-2px">${fmtSignedPct(m.vsLastYearPct, 0)} on ${h(name)} last year</p>
        <p class="d" style="top:364px; font-size:38px">Results logged per month since ${h(monthName(m.series[0].month, { month: 'long', year: 'numeric' }))}</p>
        <svg width="${FW}" height="${H + 70}" style="position:absolute; left:${FX}px; top:${1110 - H}px">
          ${bars}
          <line x1="0" x2="${FW}" y1="${H}" y2="${H}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
          <text class="lab-b" fill="${INK}" x="${n(bc.x + bc.width)}" y="${n(bc.y - 20)}" text-anchor="end">${fmtInt(cur.results)}</text>
          ${bp && prev ? `<text class="lab-b" fill="#4e54c8" x="${n(bp.x + bp.width / 2)}" y="${n(bp.y - 20)}" text-anchor="middle">${fmtInt(prev.results)}</text>
          <text class="lab" fill="${INK}" x="${n(bp.x + bp.width / 2)}" y="${H + 50}" text-anchor="middle">${h(monthName(prevKey, { month: 'short', year: 'numeric' }))}</text>` : ''}
          <text class="lab" fill="${INK}" x="${n(bc.x + bc.width)}" y="${H + 50}" text-anchor="end">${h(monthName(cur.month, { month: 'short', year: 'numeric' }))}</text>
        </svg>`, c.source),
      ch(3, 'coral', `
        <p class="t" style="top:190px; font-size:84px; letter-spacing:-2.5px">${metrics.every(x => isRecord(x.key)) ? 'Records across the board' : `More of you than ever in ${h(name)}`}</p>
        <div class="recs" style="top:410px">${metrics.map(x => `<div><b>${fmtInt(x.value)}</b><span>${h(x.label)}</span>${isRecord(x.key) ? '<em class="pill" style="font-style:normal">Record</em>' : ''}</div>`).join('')}</div>
        <p class="q" style="top:910px; color:${INK}; font-size:60px">${h(m.question)}</p>`),
    ],
  };
}


const direction: Direction = {
  id: 'D9',
  name: 'Chapter Recap',
  idea: 'Six Story chapters, one ground colour each; a strip of six interlocking pieces fills in as the marker, a tonal jigsaw floor sits under the reply bar, and one frame leaves room for a poll sticker.',
  css: css + css2,
  posts: c => [wallFeed(c), story(c), weeklyStory(c), eventStory(c), monthFeed(c)],
};
export default direction;
