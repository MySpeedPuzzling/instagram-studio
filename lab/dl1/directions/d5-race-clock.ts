// D5 · Race Clock (sports timing board).
// Navy ground, the only dark direction. Times are set like a timing board: Rubik Bold, tabular, slashed
// zeros, colons lifted to the figure centre. The device is a stopwatch ring top left whose coral segment
// shows progress through a carousel (a full lap on single posts). Coral marks #1 and the record line only;
// sky carries secondary labels. No glow, no gradients, no italics.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, barGeometry, flagUrl } from '../../../src/design/svg.ts';
import { generateJigsaw, sampleOutline, type Point } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Direction, Post, Slide } from '../types.ts';

const W = 1080, X0 = 88, CW = 904;
const NAVY = '#2b3445', BAND = '#373f50';
const f1 = (v: number) => v.toFixed(1);

// ---------------------------------------------------------------- geometry helpers
const polar = (cx: number, cy: number, r: number, a: number): Point => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
/** Arc from angle a0 to a1 (radians, clockwise in screen space, 0 = 3 o'clock). Full circles are split in two. */
function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) return `${arc(cx, cy, r, a0, a0 + Math.PI)} ${arc(cx, cy, r, a0 + Math.PI, a0 + Math.PI * 2).replace(/^M [^A]+/, '')}`;
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M ${f1(x0)} ${f1(y0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}
const TOP = -Math.PI / 2;
/** Minutes on a 60-minute dial → angle. */
const minAngle = (m: number) => TOP + (m / 60) * Math.PI * 2;

/** The device: a stopwatch ring with a crown; the coral segment runs clockwise from 12 o'clock. */
function device(frac: number): string {
  const r = 24;
  return `<svg class="dev" width="60" height="68" viewBox="-30 -40 60 68">
    <rect x="-7" y="-39" width="14" height="8" rx="2" fill="var(--paper)"/>
    <rect x="-2.5" y="-32" width="5" height="6" fill="var(--paper)"/>
    <circle r="${r}" fill="none" stroke="var(--ink-soft)" stroke-width="7"/>
    <path d="${arc(0, 0, r, TOP, TOP + Math.PI * 2 * frac)}" fill="none" stroke="var(--coral-500)" stroke-width="7"/>
  </svg>`;
}

/**
 * A round puzzle: n interlocking pieces from one generated strip, wrapped into a ring. The strip has n+1
 * columns; pieces 1..n are kept and the last piece's right edge is replaced by the first piece's left cut,
 * so the ring closes on a real knob. Outlines are sampled densely and mapped x→angle, y→radius.
 */
function pieceRing(n: number, cx: number, cy: number, rIn: number, rOut: number, seed = 4) {
  const pw = 100, width = rOut - rIn;
  const ph = (pw * width) / ((Math.PI * (rIn + rOut)) / n);
  const jig = generateJigsaw({ cols: n + 1, rows: 1, width: (n + 1) * pw, height: ph, seed, tabSize: 0.24, jitter: 0.04 });
  const ps = [...jig.pieces].sort((a, b) => a.col - b.col);
  // outline = start + 9 points per edge: top 1..9, right 10..18, bottom 19..27, left 28..36 (left runs bottom→top).
  const wrapRight = ps[1].outline.slice(27, 37).reverse().map(([x, y]) => [x + n * pw, y] as Point);
  const rot0 = -Math.PI / n; // centre the first piece under the crown
  const map = ([x, y]: Point): Point => polar(cx, cy, rOut - (y / ph) * width, rot0 + TOP + ((x - pw) / (n * pw)) * Math.PI * 2);
  return ps.slice(1).map(p => {
    const outline = p.col === n ? [...p.outline.slice(0, 10), ...wrapRight.slice(1), ...p.outline.slice(19)] : p.outline;
    const pts = sampleOutline(outline, 24).map(map);
    return `M ${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ')} Z`;
  });
}

// ---------------------------------------------------------------- type helpers
/** Big time / number markup: colons lifted to the figure centre, true minus. */
const clock = (v: string) => h(v).replace(/^-/, '−').replace(/:/g, '<span class="c">:</span>');
const pct1 = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}%`;
const toMin = (t: string) => t.split(':').map(Number).reduce((s, v) => s * 60 + v, 0) / 60; // "22:30" → 22.5
const gap = (m: number) => `+${fmtDuration(m)}`;
/** Left side bearing (em) of Rubik 700 figures, measured from rendered ink: big numbers are pulled left so their ink starts on x = 88. */
const LSB: Record<string, number> = { '0': 0.042, '1': 0.06, '2': 0.048, '3': 0.034, '4': 0.019, '5': 0.041, '6': 0.039, '7': 0.072, '8': 0.038, '9': 0.04 };
const inkLeft = (v: string, size: number) => (X0 - (LSB[v[0]] ?? 0.04) * size).toFixed(1);

const css = `
body { background: var(--ink); font-variant-numeric: tabular-nums lining-nums slashed-zero; }
.frame { position: relative; width: ${W}px; height: 1350px; overflow: hidden; background: var(--ink); color: var(--paper); }
.top { position: absolute; left: ${X0}px; width: ${CW}px; top: 64px; height: 72px; display: flex; align-items: center; gap: 22px; }
.dev { display: block; flex: none; }
.kick { font-size: 30px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sky-500); }
.idx { margin-left: auto; font-size: 30px; font-weight: 700; letter-spacing: 0.04em; color: var(--paper); }
.idx i { font-style: normal; color: var(--sky-500); font-weight: 500; }
.rule { position: absolute; left: ${X0}px; width: ${CW}px; height: 2px; background: var(--ink-soft); }
.title { position: absolute; left: ${X0}px; width: ${CW}px; top: 176px; font-size: 62px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; text-wrap: balance; }
.dek { font-size: 38px; line-height: 1.3; color: var(--context); text-wrap: pretty; }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1214px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
.src { font-size: 30px; color: var(--context); }
.bug { width: 68px; height: 68px; border-radius: 16px; background: var(--paper); display: grid; place-items: center; }
.bug img { width: 54px; height: auto; display: block; }
.big { font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; }
.big .c { display: inline-block; transform: translateY(-0.1em); }
.lab { font-family: Rubik; font-size: 30px; fill: var(--context); font-variant-numeric: tabular-nums slashed-zero; }
.lab-sky { font-family: Rubik; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; fill: var(--sky-500); font-variant-numeric: tabular-nums slashed-zero; }
.lab-b { font-family: Rubik; font-size: 34px; font-weight: 700; fill: var(--paper); font-variant-numeric: tabular-nums slashed-zero; }
.lab-hot { font-family: Rubik; font-size: 56px; font-weight: 700; fill: var(--coral-500); font-variant-numeric: tabular-nums slashed-zero; }
.board { position: absolute; left: ${X0}px; width: ${CW}px; }
.bh { display: flex; align-items: flex-end; height: 48px; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sky-500); border-bottom: 2px solid var(--ink-soft); padding-bottom: 10px; }
.br { position: relative; display: flex; align-items: center; border-bottom: 2px solid ${BAND}; }
.br.hot::before { content: ''; position: absolute; left: -${X0}px; top: 0; bottom: 0; width: 14px; background: var(--coral-500); }
.br .rk { width: 76px; font-size: 34px; font-weight: 700; color: var(--sky-500); }
.br.hot .rk { color: var(--paper); }
.br img { width: 44px; height: 44px; margin-right: 20px; }
.br .nm { flex: 1; font-size: 38px; font-weight: 500; }
.br .tm { width: 150px; text-align: right; font-size: 40px; font-weight: 700; }
.br .gp { width: 150px; text-align: right; font-size: 32px; color: var(--context); }
.ref { display: flex; gap: 36px; white-space: nowrap; font-size: 30px; color: var(--context); }
.ref b { color: var(--paper); font-weight: 700; }
.legend { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; font-size: 34px; color: var(--context); }
.legend b { color: var(--paper); font-weight: 700; }
.sw { display: inline-block; width: 12px; height: 34px; border-radius: 3px; vertical-align: -6px; margin-right: 16px; }
.ask { font-size: 54px; font-weight: 700; line-height: 1.12; color: var(--paper); text-wrap: balance; }
.br .who { flex: 1; min-width: 0; padding: 18px 0; }
.br .who .nm span { min-width: 0; overflow-wrap: anywhere; }
.br .who .nm { display: flex; align-items: center; line-height: 1.15; }
.br .who .nm img { width: 40px; height: 40px; margin-right: 16px; }
.br .sub { font-size: 30px; line-height: 1.25; color: var(--context); margin-top: 6px; }
.br .ig { font-size: 30px; font-weight: 500; line-height: 1.2; color: var(--sky-500); margin-top: 6px; overflow-wrap: anywhere; }
.strip { display: flex; }
.strip > div { flex: 1; border-left: 2px solid var(--ink-soft); padding-left: 26px; }
.strip > div:first-child { border-left: 0; padding-left: 0; }
.strip .k { font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sky-500); }
.strip .v { font-size: 64px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; margin-top: 8px; }
`;

// ---------------------------------------------------------------- frame
interface FrameOpts { kicker: string; idx?: [number, number]; title?: string; body: string; src: string }
function frame(o: FrameOpts): string {
  const frac = o.idx ? o.idx[0] / o.idx[1] : 1;
  return `<div class="frame">
  <header class="top">${device(frac)}<span class="kick">${h(o.kicker)}</span>
    ${o.idx ? `<span class="idx">${o.idx[0]}<i> / ${o.idx[1]}</i></span>` : ''}</header>
  <div class="rule" style="top:148px"></div>
  ${o.title ? `<h1 class="title">${h(o.title)}</h1>` : ''}
  ${o.body}
  <div class="rule" style="top:1196px"></div>
  <footer class="foot"><span class="src">${h(o.src)}</span><span class="bug"><img src="${LOGO_URL}" alt=""></span></footer>
</div>`;
}

// ---------------------------------------------------------------- posts
function wall(c: Content): Post {
  const w = c.wall;
  const wallMin = Number(w.title.match(/\d+/)![0]); // "The 59-minute wall" → 59
  const hour = wallMin + 1;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;
  const step = (m: number) => ((at(m) - at(m - 1)) / at(m - 1)) * 100;

  // 1 · Cover: a 60-minute dial; the coral race runs to the wall minute, the hour is a white bar.
  const cx = W / 2, cy = 806, R = 286;
  const ticks = Array.from({ length: 60 }, (_, m) => {
    const major = m % 5 === 0;
    const [x0, y0] = polar(cx, cy, R - 42 - (major ? 26 : 0), minAngle(m)), [x1, y1] = polar(cx, cy, R - 42, minAngle(m));
    return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="${major ? 'var(--paper)' : 'var(--ink-muted)'}" stroke-width="${major ? 6 : 3}" stroke-linecap="round"/>`;
  }).join('');
  const [wx0, wy0] = polar(cx, cy, R - 30, minAngle(0)), [wx1, wy1] = polar(cx, cy, R + 34, minAngle(0));
  const dial = `<svg width="${W}" height="1350" style="position:absolute; left:0; top:0">
    <rect x="${cx - 9}" y="${cy - R - 66}" width="18" height="16" rx="3" fill="var(--paper)"/>
    <rect x="${cx - 36}" y="${cy - R - 82}" width="72" height="20" rx="5" fill="var(--paper)"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${BAND}" stroke-width="30"/>
    <path d="${arc(cx, cy, R, minAngle(0), minAngle(wallMin))}" fill="none" stroke="var(--coral-500)" stroke-width="30"/>
    <line x1="${f1(wx0)}" y1="${f1(wy0)}" x2="${f1(wx1)}" y2="${f1(wy1)}" stroke="var(--paper)" stroke-width="10"/>
    ${ticks}
  </svg>`;

  // 2 · Histogram.
  const CH = 520, top2 = 540;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: CW, height: CH, padding: 0.22 });
  const hot = (m: number) => m > wallMin - 5 && m <= wallMin;
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${hot(b.datum.minute) ? 'var(--coral-500)' : 'var(--ink-muted)'}"/>`).join('');
  const line60 = g.xScale(String(hour))! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const mid = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const first = w.histogram[0].minute, last = w.histogram[w.histogram.length - 1].minute;

  // 3 · Splits board.
  const splits = [...w.noStepAt, hour].map(m => ({ m, finishes: at(m), change: step(m) }));

  // 4 · Two sides of the wall.
  const under = w.subHour.under60, over = w.subHour.puzzlers - under;
  const split = (under / w.subHour.puzzlers) * CW;

  const slides: Slide[] = [
    { id: 'wall-1', body: frame({ kicker: w.kicker, idx: [1, 4], src: c.source, body: `
      <h1 class="title" style="font-size:84px; letter-spacing:-0.02em">${h(w.title)}</h1>
      <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:290px">${h(w.dek)}</p>
      ${dial}
      <p class="big" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy - 0.8425 * 200 + 70}px; font-size:200px">${wallMin}</p>
      <p class="kick" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 96}px; color:var(--sky-500)">Minutes</p>` }) },
    { id: 'wall-2', body: frame({ kicker: w.kicker, idx: [2, 4], src: c.source,
      title: `${w.mode.minute} minutes is the most common finish. Then the counts drop.`, body: `
      <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top2}px">
        ${bars}
        <line x1="${f1(line60)}" x2="${f1(line60)}" y1="-78" y2="${CH}" stroke="var(--paper)" stroke-width="4"/>
        <text class="lab-b" x="${f1(line60 - 18)}" y="${f1(modeBar.y - 56)}" text-anchor="end">${w.mode.minute} min</text>
        <text class="lab" x="${f1(line60 - 18)}" y="${f1(modeBar.y - 18)}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
        <text class="lab-hot" x="${f1(line60 + 20)}" y="${f1(modeBar.y - 42)}">${pct1(w.dropPct)}</text>
        <text class="lab" x="${f1(line60 + 20)}" y="${f1(modeBar.y - 4)}">at the hour</text>
        <text class="lab" x="${f1(mid(first))}" y="${CH + 46}" text-anchor="middle">${first}</text>
        <text class="lab" x="${f1(mid(50))}" y="${CH + 46}" text-anchor="middle">50</text>
        <text class="lab-b" x="${f1(line60)}" y="${CH + 48}" text-anchor="middle">${fmtDuration(hour)}</text>
        <text class="lab" x="${f1(mid(70))}" y="${CH + 46}" text-anchor="middle">70</text>
        <text class="lab" x="${CW}" y="${CH + 46}" text-anchor="end">${last} min</text>
      </svg>` }) },
    { id: 'wall-3', body: frame({ kicker: w.kicker, idx: [3, 4], src: c.source, title: w.context, body: `
      <div class="board" style="top:470px">
        <div class="bh"><span style="flex:1">Into minute</span><span style="width:260px; text-align:right">Finishes</span><span style="width:240px; text-align:right">Change</span></div>
        ${splits.map(s => `<div class="br ${s.m === hour ? 'hot' : ''}" style="height:150px">
          <span class="big" style="flex:1; font-size:84px">${clock(fmtDuration(s.m))}</span>
          <span style="width:260px; text-align:right; font-size:44px; font-weight:500">${fmtInt(s.finishes)}</span>
          <span class="big" style="width:240px; text-align:right; font-size:64px; ${s.m === hour ? 'color:var(--coral-500)' : ''}">${pct1(s.change)}</span>
        </div>`).join('')}
        <p class="dek" style="margin-top:34px; font-size:32px">Change in finishes from the minute before.</p>
      </div>` }) },
    { id: 'wall-4', body: frame({ kicker: w.kicker, idx: [4, 4], src: c.source, body: `
      <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(String(w.subHour.pct), 290)}px; top:${206 - 0.8425 * 290 + 230}px; font-size:290px">${w.subHour.pct}<span style="font-size:0.55em; margin-left:0.04em">%</span></p>
      <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:500px; font-size:44px; color:var(--paper); font-weight:500">of 500-piece puzzlers have a personal best under one hour</p>
      <svg width="${CW}" height="250" style="position:absolute; left:${X0}px; top:690px">
        <text class="lab-sky" x="0" y="34">UNDER ${fmtDuration(hour)}</text>
        <text class="lab-sky" x="${CW}" y="34" text-anchor="end">OVER</text>
        <rect x="0" y="62" width="${f1(split - 6)}" height="76" fill="var(--coral-500)"/>
        <rect x="${f1(split + 6)}" y="62" width="${f1(CW - split - 6)}" height="76" fill="var(--ink-muted)"/>
        <line x1="${f1(split)}" x2="${f1(split)}" y1="44" y2="156" stroke="var(--paper)" stroke-width="6"/>
        <text class="lab-b" x="0" y="196">${fmtInt(under)}</text>
        <text class="lab-b" x="${CW}" y="196" text-anchor="end">${fmtInt(over)}</text>
        <text class="lab" x="0" y="238">puzzlers</text>
        <text class="lab" x="${CW}" y="238" text-anchor="end">puzzlers</text>
      </svg>
      <p class="ask" style="position:absolute; left:${X0}px; width:${CW}px; top:1010px">${h(w.question)}</p>` }) },
  ];
  return { key: 'wall', slides };
}

function record(c: Content): Post {
  const r = c.record;
  const firstTry = toMin(r.value);
  const overall = toMin(r.context.match(/\d+:\d{2}(?::\d{2})?/)![0]); // the overall record, from the context line
  const scale = (m: number) => (m / 60) * CW;
  const lanes = [
    { label: 'First try', m: firstTry, hot: true },
    { label: 'Overall record', m: overall, hot: false },
  ];
  return { key: 'record', slides: [{ id: 'record-1', body: frame({ kicker: `${r.kicker} · solo 500 pieces`, src: c.source, title: r.title, body: `
    <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(r.value, 300)}px; top:${640 - 0.8425 * 300}px; font-size:300px">${clock(r.value)}</p>
    <svg width="${CW}" height="330" style="position:absolute; left:${X0}px; top:700px">
      ${[0, 15, 30, 45, 60].map(m => `<line x1="${f1(scale(m))}" x2="${f1(scale(m))}" y1="0" y2="270" stroke="${BAND}" stroke-width="2"/>`).join('')}
      ${lanes.map((l, i) => `
        <text class="lab-sky" x="0" y="${i * 135 + 32}">${h(l.label.toUpperCase())}</text>
        <rect x="0" y="${i * 135 + 54}" width="${CW}" height="44" fill="${BAND}"/>
        <rect x="0" y="${i * 135 + 54}" width="${f1(scale(l.m))}" height="44" fill="${l.hot ? 'var(--coral-500)' : 'var(--brand-gray600)'}"/>
        <text class="lab-b" x="${f1(scale(l.m) + 18)}" y="${i * 135 + 88}">${fmtDuration(l.m)}</text>`).join('')}
      ${[0, 15, 30, 45, 60].map(m => `<text class="lab" x="${f1(scale(m))}" y="314" text-anchor="${m === 0 ? 'start' : m === 60 ? 'end' : 'middle'}">${fmtDuration(m)}</text>`).join('')}
    </svg>
    <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:1062px">${h(r.context)}</p>` }) }] };
}

function countries(c: Content): Post {
  const k = c.countries;
  const lead = k.top[0].medianPb;
  const rowH = 70;
  return { key: 'countries', slides: [{ id: 'countries-1', body: frame({ kicker: 'Solo 500 pieces · median PB', src: c.source, title: k.title, body: `
    <div class="board" style="top:346px">
      <div class="bh"><span style="width:76px">#</span><span style="flex:1">Country</span><span style="width:150px; text-align:right">Time</span><span style="width:150px; text-align:right">Gap</span></div>
      ${k.top.map((d, i) => `<div class="br ${i === 0 ? 'hot' : ''}" style="height:${rowH}px">
        <span class="rk">${String(i + 1).padStart(2, '0')}</span><img src="${flagUrl(d.code)}" alt="">
        <span class="nm" ${i === 0 ? 'style="font-weight:700"' : ''}>${h(d.name)}</span>
        <span class="tm">${fmtDuration(d.medianPb)}</span>
        <span class="gp">${i === 0 ? '' : gap(d.medianPb - lead)}</span></div>`).join('')}
      <div class="ref" style="margin-top:28px">${[...k.reference].reverse().filter(r => r.value !== null).map(r => `<span>${h(r.label)} <b>${fmtDuration(r.value!)}</b></span>`).join('')}<span style="margin-left:auto">Min. ${k.dek.match(/(\d+)\+ puzzlers/)?.[1] ?? ''} puzzlers</span></div>
    </div>` }) }] };
}

function share(c: Content): Post {
  const s = c.share;
  const colour: Record<string, string> = { '500': 'var(--coral-500)', 'under 500': 'var(--context)', '1000': 'var(--brand-gray600)', other: 'var(--ink-soft)' };
  // 100 ticks round a stopwatch bezel, one per 1% of results, clockwise from 12 o'clock.
  const cx = W / 2, cy = 640, r0 = 214, r1 = 290;
  const keys = s.units.flatMap(u => Array.from({ length: u.units }, () => u.key));
  const ticks = keys.map((key, i) => {
    const a = TOP + ((i + 0.5) / 100) * Math.PI * 2;
    const [x0, y0] = polar(cx, cy, r0, a), [x1, y1] = polar(cx, cy, r1, a);
    return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="${colour[key]}" stroke-width="10" stroke-linecap="butt"/>`;
  }).join('');
  const lead = s.parts[0];
  return { key: 'share', slides: [{ id: 'share-1', body: frame({ kicker: 'Puzzle sizes · all results', src: `1 tick = 1% of ${fmtInt(c.totals.results)} results · ${c.asOf}`, title: s.title, body: `
    <svg width="${W}" height="1350" style="position:absolute; left:0; top:0">${ticks}</svg>
    <p class="big" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 50 - 0.8425 * 150}px; font-size:150px">${lead.pct}<span style="font-size:0.55em">%</span></p>
    <p class="kick" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 78}px">${h(s.labels[lead.key])}</p>
    <div class="legend" style="position:absolute; left:${X0}px; width:${CW}px; top:990px">
      ${s.parts.map(p => `<span><i class="sw" style="background:${colour[p.key]}"></i><b>${p.pct}%</b> ${h(s.labels[p.key])}</span>`).join('')}
    </div>` }) }] };
}

function xp(c: Content): Post {
  const x = c.xp;
  const club = x.distribution.find(d => d.level === x.level)?.players ?? 0;
  const cx = W / 2, cy = 548, rOut = 310, rIn = 172;
  const ring = pieceRing(Math.max(club, 3), cx, cy, rIn, rOut, 4);
  return { key: 'xp', slides: [{ id: 'xp-1', body: frame({ kicker: x.kicker, src: c.source, body: `
    <svg width="${W}" height="1350" style="position:absolute; left:0; top:0">
      <rect x="${cx - 10}" y="${cy - rOut - 26}" width="20" height="22" fill="var(--paper)"/>
      <rect x="${cx - 44}" y="${cy - rOut - 48}" width="88" height="26" rx="6" fill="var(--paper)"/>
      ${ring.map(d => `<path d="${d}" fill="var(--coral-500)" stroke="var(--ink)" stroke-width="6" stroke-linejoin="round"/>`).join('')}
    </svg>
    <p class="kick" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy - 118}px; letter-spacing:0.3em">Level</p>
    <p class="big" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 78 - 0.8425 * 200}px; font-size:200px; font-variant-numeric:tabular-nums lining-nums">${x.level}</p>
    <p class="kick" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + rOut + 26}px">1 piece = 1 puzzler at level ${x.level}</p>
    <h1 class="title" style="top:960px; font-size:64px">${h(x.title)}</h1>
    <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:1046px">${h(x.dek)}. ${h(x.context)}</p>` }) }] };
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
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Shortens text to at most `max` characters at a word boundary, with an ellipsis. */
const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return `${(/\s/.test(s[max - 1]) ? head : head.replace(/\s+\S*$/, '') || head).replace(/[\s,.:;·–-]+$/, '')}…`;
};
const strip = (items: Array<[string, string]>) => `<div class="strip">${items.map(([k, v]) => `<div><p class="k">${h(k)}</p><p class="v">${clock(v)}</p></div>`).join('')}</div>`;

function weekly(c: Content): Post {
  const w = c.weekly;
  const kick = `${w.series} · Ep. ${w.episode}`;

  // 1 · Cover: a one-week dial (a full coral lap, day initials round the bezel) carrying the episode number.
  const cx = W / 2, cy = 640, R = 226;
  const dayTicks = Array.from({ length: 7 }, (_, d) => {
    const a = TOP + (d / 7) * Math.PI * 2;
    const [x0, y0] = polar(cx, cy, R - 30, a), [x1, y1] = polar(cx, cy, R - 50, a);
    return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="var(--paper)" stroke-width="6" stroke-linecap="round"/>`;
  }).join('');
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, d) => {
    const [x, y] = polar(cx, cy, R + 58, TOP + ((d + 0.5) / 7) * Math.PI * 2);
    return `<text class="lab-sky" x="${f1(x)}" y="${f1(y + 11)}" text-anchor="middle" style="letter-spacing:0">${l}</text>`;
  }).join('');
  const dial = `<svg width="${W}" height="1350" style="position:absolute; left:0; top:0">
    <rect x="${cx - 9}" y="${cy - R - 66}" width="18" height="16" rx="3" fill="var(--paper)"/>
    <rect x="${cx - 36}" y="${cy - R - 82}" width="72" height="20" rx="5" fill="var(--paper)"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--coral-500)" stroke-width="30"/>
    ${dayTicks}${dayNames}
  </svg>`;

  // 3–4 · Fastest boards, one slide per size, one row per puzzler (repeat finishes fold into "Also").
  const g500 = byPlayer(w.fastest500), g1000 = byPlayer(w.fastest1000);
  const n = 3 + (g500.length ? 1 : 0) + (g1000.length ? 1 : 0);
  // The detail line wraps to at most two lines of the 608 px column; long puzzle names are cut at a word.
  const detail = (g: FastGroup) => {
    const brand = cut(g.brand, 24);
    return `${h(cut(g.puzzle, 66 - brand.length - 3 - (g.firstAttempt ? 16 : 0)))}&nbsp;· ${h(brand)}${g.firstAttempt ? '&nbsp;· first&nbsp;attempt' : ''}`;
  };
  const fastRow = (g: FastGroup, i: number) => `<div class="br ${i === 0 ? 'hot' : ''}">
    <span class="rk">${pad2(i + 1)}</span>
    <div class="who" style="padding:30px 0"><p class="nm" style="font-size:42px">${g.country ? `<img src="${flagUrl(g.country)}" alt="">` : ''}<span>${h(cut(g.player, 48))}</span></p>
      ${g.handle ? `<p class="ig">@${h(g.handle)}</p>` : ''}
      <p class="sub">${detail(g)}</p>
      ${g.also.length ? `<p class="sub">Also ${andList(g.also)}${g.samePuzzle ? ' on the same puzzle' : ''}</p>` : ''}</div>
    <span class="big" style="width:220px; text-align:right; font-size:52px">${clock(g.time)}</span></div>`;
  // The leader is named in the title when it still fits two lines; the board always names everyone.
  const title = (size: string, leader: string) => (`The week's fastest solo ${size}: ${leader}`.length <= 48 ? `The week's fastest solo ${size}: ${leader}` : `The week's fastest solo ${size}`);
  const fastest = (gs: FastGroup[], size: string): Array<(i: number) => Slide> => gs.length ? [i => ({ id: `weekly-${i}`, body: frame({ kicker: kick, idx: [i, n], src: c.source, title: title(size, gs[0].player), body: `
      <div class="board" style="top:380px">
        <div class="bh"><span style="width:76px">#</span><span style="flex:1">Solo ${size} pieces</span><span style="width:220px; text-align:right">Time</span></div>
        ${gs.map(fastRow).join('')}</div>` }) })] : [];

  const tp = w.topPuzzles;
  const slides: Slide[] = [
    { id: 'weekly-1', body: frame({ kicker: `Season ${w.season} · ${w.range}`, idx: [1, n], src: c.source, body: `
      <h1 class="title" style="font-size:84px; letter-spacing:-0.02em">${h(w.series)}</h1>
      ${dial}
      <p class="kick" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy - 128}px; letter-spacing:0.3em">Episode</p>
      <p class="big" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 86 - 0.8425 * 196}px; font-size:196px">${clock(pad2(w.episode))}</p>
      <div style="position:absolute; left:${X0}px; width:${CW}px; top:990px">${strip([['Results', fmtInt(w.results)], ['Week on week', fmtSignedPct(w.resultsChangePct)], ['Puzzlers', fmtInt(w.puzzlers)]])}</div>` }) },
    { id: 'weekly-2', body: frame({ kicker: kick, idx: [2, n], src: c.source, title: `${tp[0].puzzle} was the most-solved puzzle of the week`, body: `
      <div class="board" style="top:360px">
        <div class="bh"><span style="width:76px">#</span><span style="flex:1">Puzzle</span><span style="width:180px; text-align:right">Solvers</span></div>
        ${tp.map((p, i) => `<div class="br ${i === 0 ? 'hot' : ''}" style="height:132px">
          <span class="rk">${pad2(i + 1)}</span>
          <div class="who"><p class="nm" ${i === 0 ? 'style="font-weight:700"' : ''}>${h(p.puzzle)}</p><p class="sub">${h(p.brand)} · ${fmtInt(p.pieces)} pieces</p></div>
          <span class="tm" style="width:180px">${fmtInt(p.solvers)}</span></div>`).join('')}
      </div>` }) },
    ...[...fastest(g500, '500'), ...fastest(g1000, '1,000')].map((slide, k) => slide(3 + k)),
    { id: `weekly-${n}`, body: frame({ kicker: kick, idx: [n, n], src: c.source, body: `
      <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(String(w.personalBests), 290)}px; top:${206 - 0.8425 * 290 + 230}px; font-size:290px">${clock(fmtInt(w.personalBests))}</p>
      <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:500px; font-size:44px; color:var(--paper); font-weight:500">personal bests were set last week</p>
      <div class="board" style="top:620px">
        ${([['New puzzlers', w.newPuzzlers], ['Puzzlers', w.puzzlers], ['Pieces', w.pieces]] as const).map(([k, v]) => `<div class="br" style="height:100px">
          <span class="kick" style="flex:1">${k}</span><span class="big" style="font-size:60px">${fmtInt(v)}</span></div>`).join('')}
      </div>
      <p class="ask" style="position:absolute; left:${X0}px; width:${CW}px; top:1010px">${h(w.question)}</p>` }) },
  ];
  return { key: 'weekly', slides };
}

function event(c: Content): Post {
  const e = c.event;
  const facts: Array<[string, string]> = [['Date', e.date], ['Venue', e.location], ['On MSP', `${fmtInt(e.onMsp)} of ${fmtInt(e.registered)} registered`]];
  const slides: Slide[] = [
    { id: 'event-1', body: frame({ kicker: 'Event preview', idx: e.usMedianPb ? [1, 2] : undefined, src: c.source, title: e.name, body: `
      <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(String(e.registered), 290)}px; top:${640 - 0.8425 * 290}px; font-size:290px">${clock(fmtInt(e.registered))}</p>
      <p class="kick" style="position:absolute; left:${X0}px; top:672px">Registered puzzlers</p>
      <div class="board" style="top:760px">
        ${facts.map(([k, v]) => `<div class="br" style="height:100px"><span class="kick" style="width:230px">${k}</span><span class="nm" style="font-weight:700; font-size:40px">${clock(v)}</span></div>`).join('')}
      </div>` }) },
  ];
  if (e.usMedianPb) {
    const pb = toMin(e.usMedianPb);
    const max = Math.ceil(pb / 30) * 30 + (Math.ceil(pb / 30) * 30 - pb < 10 ? 30 : 0); // the next half hour past the benchmark
    const scale = (m: number) => (m / max) * CW;
    const ticks = Array.from({ length: max / 30 + 1 }, (_, i) => i * 30);
    slides.push({ id: 'event-2', body: frame({ kicker: 'Event preview · solo 500 pieces', idx: [2, 2], src: c.source, title: 'The benchmark: the median US personal best', body: `
      <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(e.usMedianPb, 230)}px; top:${560 - 0.8425 * 230}px; font-size:230px">${clock(e.usMedianPb)}</p>
      <svg width="${CW}" height="330" style="position:absolute; left:${X0}px; top:620px">
        ${ticks.map(m => `<line x1="${f1(scale(m))}" x2="${f1(scale(m))}" y1="0" y2="270" stroke="${BAND}" stroke-width="2"/>`).join('')}
        <text class="lab-sky" x="0" y="32">US MEDIAN PB${e.usPuzzlers ? ` · ${fmtInt(e.usPuzzlers)} PUZZLERS` : ''}</text>
        <rect x="0" y="54" width="${CW}" height="44" fill="${BAND}"/>
        <rect x="0" y="54" width="${f1(scale(pb))}" height="44" fill="var(--brand-gray600)"/>
        <text class="lab-b" x="${f1(scale(pb) + 18)}" y="88">${e.usMedianPb}</text>
        <text class="lab-sky" x="0" y="167">YOUR GOAL TIME</text>
        <rect x="2" y="191" width="${CW - 4}" height="40" fill="none" stroke="var(--sky-500)" stroke-width="3" stroke-dasharray="12 10"/>
        ${ticks.map(m => `<text class="lab" x="${f1(scale(m))}" y="314" text-anchor="${m === 0 ? 'start' : m === max ? 'end' : 'middle'}">${fmtDuration(m)}</text>`).join('')}
      </svg>
      <p class="ask" style="position:absolute; left:${X0}px; width:${CW}px; top:1010px">${h(e.question)}</p>` }) });
  }
  return { key: 'event', slides };
}

function feature(c: Content): Post {
  const f = c.feature;
  // Complete days only: the as-of day is still running.
  const days = f.days.filter(d => !c.asOf.startsWith(dayLabel(d.day) + ' '));
  const isLaunch = (d: { day: string }) => f.launchDate.startsWith(dayLabel(d.day) + ' ');
  const CH = 580, top1 = 440;
  const g = barGeometry(days, { x: d => d.day, y: d => d.results, width: CW, height: CH, padding: 0.22 });
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${isLaunch(b.datum) ? 'var(--coral-500)' : 'var(--ink-muted)'}"/>`).join('');
  const launch = g.bars.find(b => isLaunch(b.datum))!;
  const ty = g.yScale(f.typicalDay);
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
  const wk = g.bars[7];

  const same = f.results - f.backfilled;
  const split = (f.backfilled / f.results) * CW;
  return { key: 'feature', slides: [
    { id: 'feature-1', body: frame({ kicker: f.kicker, idx: [1, 2], src: c.source, title: f.title, body: `
      <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:326px">Results logged per day, ${h(dayLabel(days[0].day))} – ${h(dayLabel(days.at(-1)!.day))}</p>
      <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top1}px">
        ${bars}
        <line x1="0" x2="${CW}" y1="${f1(ty)}" y2="${f1(ty)}" stroke="var(--paper)" stroke-width="3"/>
        <text class="lab-sky" x="0" y="${f1(ty - 56)}">TYPICAL DAY</text>
        <text class="lab-b" x="0" y="${f1(ty - 14)}">${fmtInt(f.typicalDay)}</text>
        <text class="lab-hot" x="${f1(launch.x - 20)}" y="${f1(launch.y + 46)}" text-anchor="end">${fmtInt(f.results)}</text>
        <text class="lab" x="${f1(launch.x - 20)}" y="${f1(launch.y + 86)}" text-anchor="end">launch day, ${f.multiple}× typical</text>
        <text class="lab" x="0" y="${CH + 46}">${h(dayLabel(days[0].day))}</text>
        ${wk && wk !== launch ? `<text class="lab" x="${f1(mid(wk))}" y="${CH + 46}" text-anchor="middle">${h(dayLabel(wk.datum.day))}</text>` : ''}
        <text class="lab-b" x="${f1(launch.x + launch.width)}" y="${CH + 48}" text-anchor="end">${h(dayLabel(launch.datum.day))}</text>
      </svg>` }) },
    { id: 'feature-2', body: frame({ kicker: f.kicker, idx: [2, 2], src: c.source, body: `
      <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(String(f.backfilledPct), 290)}px; top:${206 - 0.8425 * 290 + 230}px; font-size:290px">${f.backfilledPct}<span style="font-size:0.55em; margin-left:0.04em">%</span></p>
      <p class="dek" style="position:absolute; left:${X0}px; width:${CW}px; top:500px; font-size:44px; color:var(--paper); font-weight:500">of launch-day results were puzzles solved before that day</p>
      <svg width="${CW}" height="250" style="position:absolute; left:${X0}px; top:690px">
        <text class="lab-sky" x="0" y="34">SOLVED EARLIER</text>
        <text class="lab-sky" x="${CW}" y="34" text-anchor="end">SOLVED THAT DAY</text>
        <rect x="0" y="62" width="${f1(split - 6)}" height="76" fill="var(--coral-500)"/>
        <rect x="${f1(split + 6)}" y="62" width="${f1(CW - split - 6)}" height="76" fill="var(--ink-muted)"/>
        <line x1="${f1(split)}" x2="${f1(split)}" y1="44" y2="156" stroke="var(--paper)" stroke-width="6"/>
        <text class="lab-b" x="0" y="196">${fmtInt(f.backfilled)}</text>
        <text class="lab-b" x="${CW}" y="196" text-anchor="end">${fmtInt(same)}</text>
        <text class="lab" x="0" y="238">results</text>
        <text class="lab" x="${CW}" y="238" text-anchor="end">results</text>
      </svg>
      <p class="ask" style="position:absolute; left:${X0}px; width:${CW}px; top:1010px">${h(f.question)}</p>` }) },
  ] };
}

function month(c: Content): Post {
  const m = c.month;
  const cur = m.series.at(-1)!;
  const prevKey = `${Number(cur.month.slice(0, 4)) - 1}${cur.month.slice(4)}`;
  const prev = m.series.find(x => x.month === prevKey)!;
  const long = (ym: string) => `${monthLabel(ym, 'long')} ${ym.slice(0, 4)}`;
  const short = (ym: string) => `${monthLabel(ym)} ${ym.slice(0, 4)}`;

  const CH = 500, top2 = 540;
  const g = barGeometry(m.series, { x: d => d.month, y: d => d.results, width: CW, height: CH, padding: 0.2, yMax: Math.max(...m.series.map(d => d.results)) * 1.14 });
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${b.datum === cur ? 'var(--coral-500)' : b.datum === prev ? 'var(--context)' : 'var(--ink-muted)'}"/>`).join('');
  const bCur = g.bars.at(-1)!, iPrev = g.bars.findIndex(b => b.datum === prev), bPrev = g.bars[iPrev];
  const prevTop = Math.min(...g.bars.slice(Math.max(0, iPrev - 1), iPrev + 2).map(b => b.y));
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
  const jan = g.bars.filter(b => b.datum.month.endsWith('-01'));

  const rowsT: Array<[string, number, number]> = [
    ['Results', prev.results, cur.results], ['Active puzzlers', prev.active, cur.active],
    ['Pieces', prev.pieces, cur.pieces], ['New puzzlers', prev.newPlayers, cur.newPlayers],
  ];
  const allUp = rowsT.every(([, a, b]) => b > a);
  return { key: 'month', slides: [
    { id: 'month-1', body: frame({ kicker: `Monthly report · ${m.label}`, idx: [1, 3], src: c.source, body: `
      <h1 class="title" style="font-size:80px; letter-spacing:-0.02em">${h(m.title)}</h1>
      <p class="big" data-qa-bleed style="position:absolute; left:${inkLeft(String(m.results), 250)}px; top:${640 - 0.8425 * 250}px; font-size:250px">${clock(fmtInt(m.results))}</p>
      <p class="kick" style="position:absolute; left:${X0}px; top:704px">Results logged</p>
      <p style="position:absolute; left:${X0}px; width:${CW}px; top:770px; display:flex; align-items:baseline; gap:22px">
        <span class="big" style="font-size:72px; color:var(--coral-500)">${fmtSignedPct(m.vsLastYearPct, 0)}</span><span class="dek">vs ${h(long(prev.month))}</span></p>
      <div style="position:absolute; left:${X0}px; width:${CW}px; top:970px">${strip([['Active puzzlers', fmtInt(m.active)], ['New puzzlers', fmtInt(m.newPlayers)]])}</div>` }) },
    { id: 'month-2', body: frame({ kicker: `Monthly report · ${m.label}`, idx: [2, 3], src: c.source, title: `${monthLabel(cur.month, 'long')} results were up ${m.vsLastYearPct}% on a year earlier`, body: `
      <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top2}px">
        ${bars}
        <text class="lab-hot" x="${f1(bCur.x + bCur.width)}" y="${f1(bCur.y - 18)}" text-anchor="end">${fmtInt(cur.results)}</text>
        <text class="lab-b" x="${f1(mid(bPrev))}" y="${f1(prevTop - 18)}" text-anchor="middle">${fmtInt(prev.results)}</text>
        ${jan.map((b, i) => `<text class="lab" x="${f1(i === 0 ? b.x : mid(b))}" y="${CH + 46}" text-anchor="${i === 0 ? 'start' : 'middle'}">${h(short(b.datum.month))}</text>`).join('')}
        <text class="lab-b" x="${f1(mid(bPrev))}" y="${CH + 48}" text-anchor="middle">${h(monthLabel(prev.month))}</text>
        <text class="lab-b" x="${f1(bCur.x + bCur.width)}" y="${CH + 48}" text-anchor="end">${h(monthLabel(cur.month))}</text>
      </svg>` }) },
    { id: 'month-3', body: frame({ kicker: `Monthly report · ${m.label}`, idx: [3, 3], src: c.source, title: allUp ? `Every number is up on ${long(prev.month)}` : `${m.label} against a year earlier`, body: `
      <div class="board" style="top:360px">
        <div class="bh"><span style="flex:1"></span><span style="width:196px; text-align:right">${h(short(prev.month))}</span><span style="width:250px; text-align:right">${h(short(cur.month))}</span><span style="width:170px; text-align:right">Change</span></div>
        ${rowsT.map(([l, a, b]) => `<div class="br" style="height:120px">
          <span class="nm" style="font-size:36px">${l}</span>
          <span style="width:196px; text-align:right; font-size:36px; color:var(--context)">${fmtInt(a)}</span>
          <span class="big" style="width:250px; text-align:right; font-size:42px">${fmtInt(b)}</span>
          <span class="big" style="width:170px; text-align:right; font-size:42px">${fmtSignedPct(((b - a) / a) * 100, 0)}</span></div>`).join('')}
      </div>
      <p class="ask" style="position:absolute; left:${X0}px; width:${CW}px; top:1010px">${h(m.question)}</p>` }) },
  ] };
}

const direction: Direction = {
  id: 'D5',
  name: 'Race Clock',
  idea: 'A sports timing board on navy: slashed-zero tabular times with centred colons, a stopwatch-ring device that tracks the carousel, coral only for #1 and the record line, sky for labels.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
