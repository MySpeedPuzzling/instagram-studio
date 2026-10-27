// Reel "Same puzzle. N times." (the grind; owner picked concept A on 2026-10-27 and look L1 "Staircase" from lab GR1).
// ~31 s, the chart frames hold ≥ 4 s each (standing feedback: text-heavy beats ≥ 4 s, count-ups tick visibly).
//   0.0–2.4   splash, complete from frame 0: logo, myspeedpuzzling.com, "Same puzzle. / N times.", the puzzle and the
//             puzzler, the box mounted below with two brand-colour generator pieces
//   2.4–3.2   it all leaves: the logo plays its exit, the lines lift away, the box drops out
//   3.0–9.6   the first 10 tries: each solve drops onto the chart (one every 0.5 s), the % vs the try before pops over
//             each step, the best-so-far in the title ticks down with every new personal best
//   9.6–16.0  the zoom-out: the x axis stretches from 10 to every try, the dots and coral personal-best pieces glide
//             into place, the personal-best count ticks up; "Best" and the first time are marked
//   16.0–21.0 first try to best: −N % counts up, two bars grow: the first ~5 hours against everything after
//   21.0–25.8 everyone who repeats a puzzle: the 500 and ≤ 200 curves draw over each other (any size, same curve)
//   25.8–29.4 the question; a small staircase of the whole grind draws under it
//   29.4–30.6 loop: everything leaves, the splash lines drop back in, the box returns, the logo plays its exit in reverse
// One SVG chart is redrawn from a state object (shown, xMax, …) on every tween update, so seeking any frame is exact.
// Text only in the Reel safe area (x 60–960, y 220–1250); below it only the box and the small staircase.
import { X0, clock, f1, frame, hero, heroFit, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';
import { flagUrl, singlePiece } from '../design/svg.ts';
import type { GrindSpec } from '../posts/reel-grind.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
const T = { splashOut: 2.4, cliff: 3.0, drops: 3.6, dropDur: 5.0, zoom: 9.6, zoomDur: 3.2, k4: 16.0, k5: 21.0, k6: 25.8, loop: 29.4 } as const;
const DURATION = 30.6;
// Brand piece colours only, never a white piece (owner 2026-10-22).
const CORAL = '#ec726f', INDIGO = '#97a5f9';
/** Plot area (absolute frame coordinates), shared by the first-10 and the zoomed-out view. */
const P = { x0: X0 + 128, x1: RX - 12, y0: 640, y1: 1060 };
const PIECE = 26;
const MINUS = '−';
const t = (sec: number) => fmtDuration(sec / 60);
const pct = (v: number) => `${v < 0 ? MINUS : '+'}${Math.round(Math.abs(v) * 100)}%`;
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** A generator piece of core size `s` centred on (cx, cy). */
function pieceAt(cx: number, cy: number, s: number, fill: string, seed = 3, rot = 0) {
  const p = singlePiece(s, seed);
  return `<path d="${p.d}" fill="${fill}" transform="translate(${f1(cx - 1.5 * s)} ${f1(cy - 1.5 * s)}) rotate(${rot} ${f1(1.5 * s)} ${f1(1.5 * s)})"/>`;
}

export function reelGrindMotion(v: Variant, s: GrindSpec): Motion {
  const key = 'reel-grind';
  const N = s.s.length;
  const yMax = Math.ceil(s.s[0] / 600) * 600;
  const pbs = new Set(s.pbs);
  const runBest = s.s.map((_, i) => Math.min(...s.s.slice(0, i + 1)));
  const who = `<span class="gr-who">${s.country ? `<img src="${flagUrl(s.country)}" alt="">` : ''}${h(s.player)}</span>`;
  const credit = `<p class="h-abs h-credit" id="credit" style="top:1180px; width:${RW}px">${who} · ${h(s.puzzle)}, ${h(s.brand)} ${s.pieces}</p>`;
  const bigTicks = [50, 100, 150, 200, 250, 300, 350, 400].filter(n => n < N - 15);

  // ---------------------------------------------------------------- splash (frame 0)
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  const boxW = RW - 80, boxH = boxW / s.aspect;
  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="gr-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="gr-c gr-hook" style="top:600px">Same puzzle.</p>
    <p class="gr-c gr-hook hot" style="top:704px">${fmtInt(N)} times.</p>
    <p class="gr-c gr-sub" style="top:836px">${h(s.puzzle)} · ${s.pieces} pieces</p>
    <p class="h-abs h-credit gr-cc" style="top:930px; width:${RW}px">${who} · ${h(s.brand)} puzzle</p>
  </div>
  <div id="sbox" class="h-mount" style="left:${X0 + 40}px; top:1110px; width:${f1(boxW)}px; height:${f1(boxH)}px; transform:rotate(-2deg)"><img src="${s.img}" alt=""></div>
  <svg id="spieces" class="gr-svg" width="1080" height="1920" aria-hidden="true">${pieceAt(900, 1130, 46, CORAL, 4, 14)}${pieceAt(150, 1680, 38, INDIGO, 6, -18)}</svg>`;

  // ---------------------------------------------------------------- the chart (first 10 → every try)
  const Y = (sec: number) => P.y1 - (sec / yMax) * (P.y1 - P.y0);
  const grid: string[] = [];
  for (let v = 0; v <= yMax; v += 1200) {
    grid.push(`<line x1="${P.x0}" x2="${P.x1}" y1="${f1(Y(v))}" y2="${f1(Y(v))}" stroke="var(--g-${v ? 'band' : 'rule'})" stroke-width="2"/>`);
    grid.push(`<text class="c-lab" x="${P.x0 - 18}" y="${f1(Y(v) + 10)}" text-anchor="end">${v / 60} min</text>`);
  }
  const piece = singlePiece(PIECE, 3).d;
  const marks = s.s.map((_, i) => pbs.has(i + 1)
    ? `<path id="m${i + 1}" class="gr-m" d="${piece}" fill="${CORAL}"/>`
    : `<circle id="m${i + 1}" class="gr-m" r="9" fill="var(--c-context)"/>`).join('');
  const steps = s.s.slice(1, 10).map((v, i) => `<text id="st${i + 2}" class="gr-step${v < s.s[i] ? ' down' : ''}" text-anchor="middle">${pct(v / s.s[i] - 1)}</text>`).join('');
  const xl = [...Array.from({ length: 10 }, (_, i) => i + 1), ...bigTicks, N].map(n => `<text id="xl${n}" class="c-lab gr-xl${n <= 10 ? ' sm' : ' lg'}" y="${P.y1 + 44}" text-anchor="middle">${n}</text>`).join('');
  const chart = `<svg id="chart" class="gr-svg" width="1080" height="1920" aria-hidden="true">
    <g id="grid">${grid.join('')}</g>${xl}
    <path id="stair" fill="none" stroke="${CORAL}" stroke-width="5" stroke-linejoin="round"/>
    ${marks}${steps}
    <text id="nFirst" class="c-lab-b" x="${P.x0 + 22}" y="${f1(Y(s.s[0]) + 10)}">${h(t(s.s[0]))}</text>
    <text id="nBest" class="c-hot-s" x="${f1(P.x0 + ((s.bestAt - 1) / (N - 1)) * (P.x1 - P.x0))}" y="${f1(Y(s.best) + 64)}" text-anchor="end">Best ${h(t(s.best))}</text>
  </svg>`;
  const heads = `<div id="k2">
    <p class="h-abs h-cap" style="top:470px">The first 10 tries</p>
    <p class="h-abs gr-big" style="top:520px">${clock(t(s.s[0]))} <span class="gr-arrow">→</span> <span class="hot" id="bestNow">${clock(t(s.s[0]))}</span></p>
    <p class="h-abs h-lab" style="top:1132px; width:${RW}px">Each dot is one solve · % vs the try before</p>
  </div>
  <div id="k3">
    <p class="h-abs h-cap" style="top:470px">All ${fmtInt(N)} tries · ${day(s.at[0])} – ${day(s.at[N - 1])}</p>
    <p class="h-abs gr-big" style="top:520px"><span class="hot" id="pbNow">${s.pbs.filter(n => n <= 10).length}</span> personal bests</p>
    <p class="h-abs h-lab" style="top:1132px; width:${RW}px">Coral piece: a new personal best</p>
  </div>`;

  // ---------------------------------------------------------------- first try to best
  const total = 1 - s.best / s.s[0];
  const big = pct(-total);
  const m1 = Math.round(s.knee.gain1 / 60), m2 = Math.round(s.knee.gain2 / 60);
  const BW = RW - 250, bw = (m: number) => Math.max(12, BW * m / m1);
  const bar = (k: number, top: number, label: string, m: number, hot: boolean) => `<p class="h-abs h-lab" style="top:${top}px">${h(label)}</p>
    <div class="gr-bar" id="bar${k}" style="top:${top + 50}px; width:${f1(bw(m))}px; background:${hot ? CORAL : 'var(--c-context)'}"></div>
    <p class="gr-bv${hot ? ' hot' : ''}" id="bv${k}" style="top:${top + 44}px; left:${f1(X0 + bw(m) + 24)}px">${MINUS}${m} min</p>`;
  const k4 = `<div id="k4">
    <p class="h-abs h-cap" style="top:470px">From first try to best</p>
    ${hero(big, { size: heroFit(big, 300, RW - 280), baseline: 780, hot: true }).replace('<p class="h-big hot"', '<p class="h-big hot" id="bigPct"')}
    <p class="h-abs h-lead" style="top:820px; width:${RW}px">${h(t(s.s[0]))} → <b>${h(t(s.best))}</b> · ${Math.round(s.hours)} hours on one puzzle</p>
    ${bar(1, 940, `First ${Math.round(s.knee.h1)} hours (${s.knee.tries} tries)`, m1, true)}
    ${bar(2, 1090, `Next ${Math.round(s.knee.h2)} hours (${N - s.knee.tries} tries)`, m2, false)}
  </div>`;

  // ---------------------------------------------------------------- everyone: the community curve
  const ct = 690, cH = 430, cy0 = 24, cy1 = cH - 56;
  const CXn = (n: number) => P.x0 + ((n - 1) / 9) * (P.x1 - P.x0);
  const CY = (r: number) => ct + cy1 - ((r - 0.5) / 0.5) * (cy1 - cy0);
  const cc: string[] = [];
  for (const r of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) {
    cc.push(`<line x1="${P.x0}" x2="${P.x1}" y1="${f1(CY(r))}" y2="${f1(CY(r))}" stroke="var(--g-${r === 0.5 ? 'rule' : 'band'})" stroke-width="2"/>`);
    cc.push(`<text class="c-lab" x="${P.x0 - 18}" y="${f1(CY(r) + 10)}" text-anchor="end">${Math.round(r * 100)}%</text>`);
  }
  for (let n = 1; n <= 10; n++) cc.push(`<text class="c-lab" x="${f1(CXn(n))}" y="${ct + cy1 + 44}" text-anchor="middle">${n}</text>`);
  const line = (id: string, c: Array<{ n: number; r: number }>, col: string, w: number) => `<path id="${id}" pathLength="1" d="${c.map((q, i) => `${i ? 'L' : 'M'}${f1(CXn(q.n))} ${f1(CY(q.r))}`).join('')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="1 1"/>`;
  cc.push(line('cSmall', s.curve['≤200'], INDIGO, 6), line('c500', s.curve['500'], CORAL, 7));
  for (const n of [2, 5, 10]) {
    const q = s.curve['500'].find(r => r.n === n)!;
    cc.push(`<g class="gr-cl"><circle cx="${f1(CXn(n))}" cy="${f1(CY(q.r))}" r="10" fill="${CORAL}"/><text class="c-hot-s" x="${f1(CXn(n) + (n === 10 ? -6 : n === 2 ? 24 : 0))}" y="${f1(CY(q.r) + (n === 2 ? 12 : -28))}" text-anchor="${n === 10 ? 'end' : n === 2 ? 'start' : 'middle'}">${ord(n)} ${pct(q.r - 1)}</text></g>`);
  }
  const k5 = `<div id="k5">
    <p class="h-abs h-cap" style="top:470px">Everyone who repeats a puzzle</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">You don't need ${fmtInt(N)} tries</p>
    <p class="h-abs h-lab" style="top:634px; width:${RW}px">Typical time vs the 1st solve, by try</p>
    <svg class="gr-svg" width="1080" height="1920" aria-hidden="true">${cc.join('')}</svg>
    <p class="h-abs gr-legend" style="top:1150px; width:${RW}px"><i style="background:${CORAL}"></i>500 pieces <i style="background:${INDIGO}"></i>200 or fewer · <b>any size, same curve</b></p>
    <p class="h-abs h-lab" style="top:1206px; width:${RW}px">1000s? The 2nd try comes ${Math.round(s.gapDays['1000'] / 30)} months later, not ${s.gapDays['≤200']} days.</p>
  </div>`;

  // ---------------------------------------------------------------- the question + a small staircase
  const my0 = 1110, my1 = 1560, mx0 = X0 + 20, mx1 = RX - 20;
  const MX = (n: number) => mx0 + ((n - 1) / (N - 1)) * (mx1 - mx0), MY = (sec: number) => my1 - (sec / (s.s[0] * 1.05)) * (my1 - my0);
  const miniStair = runBest.map((b, i) => (i ? `H${f1(MX(i + 1))}V${f1(MY(b))}` : `M${f1(MX(1))} ${f1(MY(b))}`)).join('') + `H${f1(MX(N))}`;
  const k6 = `<div id="k6">
    <p class="h-abs h-ask" style="top:500px; width:${RW}px">Which puzzle have you solved the most times?</p>
    <p class="h-abs h-lead" style="top:800px; width:${RW}px">Log every repeat and watch your own curve drop: myspeedpuzzling.com</p>
    <svg class="gr-svg" width="1080" height="1920" aria-hidden="true">
      <g id="miniDots">${s.s.map((v, i) => `<circle cx="${f1(MX(i + 1))}" cy="${f1(MY(v))}" r="${pbs.has(i + 1) ? 7 : 5}" fill="${pbs.has(i + 1) ? CORAL : 'var(--c-context)'}"/>`).join('')}</g>
      <path id="miniStair" pathLength="1" d="${miniStair}" fill="none" stroke="${CORAL}" stroke-width="5" stroke-linejoin="round" stroke-dasharray="1 1"/>
    </svg>
  </div>`;

  const body = `${splash}${chart}${heads}${credit}${k4}${k5}${k6}`;
  const css = LOGO_CSS + `
#chart, #k2, #k3, #credit, #k4, #k5, #k6 { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
.gr-svg { position: absolute; left: 0; top: 0; overflow: visible; }
#c500, #cSmall, #miniStair { stroke-dashoffset: 1; }
#nFirst, #nBest { opacity: 0; }
.gr-step { font-size: 30px; font-weight: 700; fill: var(--g-accent); }
.gr-step.down { fill: var(--g-hot-text); }
.gr-big { margin: 0; font-size: 96px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.gr-big .hot { color: var(--g-hot); }
.gr-arrow { color: var(--g-soft); font-weight: 500; }
.gr-who img { width: 30px; height: 30px; vertical-align: -5px; margin-right: 10px; }
.gr-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.gr-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.gr-hook { font-size: 96px; }
.gr-hook.hot { color: var(--g-hot); }
.gr-sub { font-size: 50px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.gr-cc { text-align: center; }
.gr-bar { position: absolute; left: ${X0}px; height: 56px; border-radius: 4px; transform-origin: 0 50%; }
.gr-bv { position: absolute; margin: 0; font-size: 56px; font-weight: 700; line-height: 1; white-space: nowrap; color: var(--g-ink); }
.gr-bv.hot { color: var(--g-hot); }
.gr-legend { font-size: 32px; color: var(--g-soft); }
.gr-legend i { display: inline-block; width: 36px; height: 10px; border-radius: 5px; vertical-align: 8px; margin: 0 12px 0 0; }
.gr-legend i:nth-of-type(2) { margin-left: 18px; }
.gr-legend b { color: var(--g-ink); }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Did you know · the grind', device: v.device, src: `Solo results · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T, $ = id => document.getElementById(id);
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';
const clamp = v => Math.max(0, Math.min(1, v));
const easeOut = f => 1 - Math.pow(1 - f, 3);
const stopwatch = sec => fmtT(sec).replace(/:/g, '<span class="c">:</span>');

// ---- the chart, redrawn from its state on every update (seek-safe)
const st = { shown: 0, xMax: 10, steps: 1, small: 1, big: 0 };
const G = D.P, N = D.s.length;
const X = n => G.x0 + (n - 1) / (st.xMax - 1) * (G.x1 - G.x0);
const Y = s => G.y1 - s / D.yMax * (G.y1 - G.y0);
function draw() {
  const z = clamp((st.xMax - 10) / (N - 10));
  const r = 9 - 3.5 * z, k = 1 - 0.5 * z;
  let path = '', landed = 0;
  for (let i = 1; i <= N; i++) {
    const el = $('m' + i), f = clamp(st.shown - (i - 1));
    if (f <= 0 || i > Math.ceil(st.xMax) + 0.5) { el.style.visibility = 'hidden'; continue; }
    el.style.visibility = 'visible';
    el.style.opacity = f;
    const x = X(i), y = Y(D.s[i - 1]) - (1 - easeOut(f)) * 160;
    if (D.pb[i - 1]) el.setAttribute('transform', 'translate(' + (x - 1.5 * D.piece * k) + ' ' + (y - 1.5 * D.piece * k) + ') scale(' + k + ')');
    else { el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', r); }
    if (f >= 1) { landed = i; const yb = Y(D.rb[i - 1]); path += i === 1 ? 'M' + x + ' ' + yb : 'H' + x + 'V' + yb; }
  }
  $('stair').setAttribute('d', path || 'M0 0');
  for (let i = 2; i <= 10; i++) {
    const el = $('st' + i);
    el.setAttribute('x', (X(i - 1) + X(i)) / 2);
    el.setAttribute('y', Math.min(Y(D.s[i - 2]), Y(D.s[i - 1])) - 30);
    el.style.opacity = clamp(st.shown - (i - 1)) * st.steps;
  }
  D.xl.forEach(n => { const el = $('xl' + n); el.setAttribute('x', X(n)); el.style.opacity = n <= 10 ? (n === 1 ? 1 : st.small) : st.big; });
  $('bestNow').innerHTML = stopwatch(landed ? D.rb[landed - 1] : D.s[0]);
  $('pbNow').textContent = D.pbs.filter(n => n <= Math.max(landed, 1)).length;
}
draw();
const drive = (vars, at, dur, ease) => tl.to(st, { ...vars, duration: dur, ease: ease || 'none', onUpdate: draw, onComplete: draw }, at);

// ---- the splash leaves: the logo plays its exit, the lines lift away, the box drops out
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
tl.to(['#sbox', '#spieces'], { y: 900, rotation: 8, duration: 0.5, ease: 'power2.in' }, T.splashOut + 0.1);
tl.set(['#sbox', '#spieces'], { autoAlpha: 0 }, T.splashOut + 0.65);
show(MAST, T.splashOut + 0.68);

// ---- the first 10 tries: one solve lands every 0.5 s
show(['#chart', '#credit'], T.cliff, 0.3);
show('#k2', T.cliff, 0.01);
riseIn('#k2 > *', T.cliff, { stagger: 0.12, dur: 0.35 });
drive({ shown: 10 }, T.drops, T.dropDur);

// ---- the zoom-out to every try
hide('#k2', T.zoom, 0.2);
show('#k3', T.zoom + 0.2, 0.01);
riseIn('#k3 > *', T.zoom + 0.2, { stagger: 0.1, dur: 0.3 });
drive({ steps: 0, small: 0 }, T.zoom, 0.4);
drive({ xMax: N, shown: N }, T.zoom + 0.3, T.zoomDur, 'power2.inOut');
drive({ big: 1 }, T.zoom + 0.3 + T.zoomDur * 0.5, 0.6);
flash('#pbNow', T.zoom + 0.35 + T.zoomDur);
tl.fromTo('#nFirst', { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, T.zoom + T.zoomDur + 0.5);
popIn('#nBest', T.zoom + T.zoomDur + 0.7, { from: '100% 50%' });
hide(['#chart', '#k3', '#credit'], T.k4 - 0.3);

// ---- first try to best
show('#k4', T.k4, 0.01);
riseIn('#k4 > .h-cap', T.k4, { dur: 0.3 });
const pc = { v: 0 };
const showPct = () => { $('bigPct').innerHTML = '\\u2212' + Math.round(pc.v) + '<span class="pct">%</span>'; };
showPct();
tl.fromTo(pc, { v: 0 }, { v: D.total, duration: 1.6, ease: 'power2.out', onUpdate: showPct, onComplete: showPct, immediateRender: false }, T.k4 + 0.2);
riseIn('#k4 > .h-lead', T.k4 + 1.0, { dur: 0.35 });
riseIn('#k4 > .h-lab', T.k4 + 1.6, { stagger: 0.9, dur: 0.3 });
tl.fromTo(['#bar1', '#bar2'], { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out', stagger: 0.9, immediateRender: true }, T.k4 + 1.8);
countUp('#bv1', D.m1, T.k4 + 1.8, 0.8, v => '\\u2212' + Math.round(v) + ' min');
countUp('#bv2', D.m2, T.k4 + 2.7, 0.8, v => '\\u2212' + Math.round(v) + ' min');
riseIn(['#bv1', '#bv2'], T.k4 + 1.8, { stagger: 0.9, dur: 0.3, y: 0 });
hide('#k4', T.k5 - 0.3);

// ---- everyone who repeats a puzzle
show('#k5', T.k5, 0.01);
riseIn('#k5 > p', T.k5, { stagger: 0.12, dur: 0.35 });
tl.fromTo(['#cSmall', '#c500'], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut', immediateRender: false }, T.k5 + 0.5);
popIn('.gr-cl', T.k5 + 0.9, { stagger: 0.45 });
hide('#k5', T.k6 - 0.3);

// ---- the question, the whole grind as a small staircase
show('#k6', T.k6, 0.01);
riseIn('#k6 > p', T.k6, { stagger: 0.3, dur: 0.35 });
tl.fromTo('#miniDots', { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, T.k6 + 0.5);
tl.fromTo('#miniStair', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', immediateRender: false }, T.k6 + 0.6);

// ---- loop: back to the splash (frame 0)
hide(['#k6', MAST], T.loop, 0.3);
tl.set(['#sbox', '#spieces'], { autoAlpha: 1 }, T.loop + 0.1);
tl.fromTo(['#sbox', '#spieces'], { y: 900, rotation: 8 }, { y: 0, rotation: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, T.loop + 0.1);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.4)}
tl.set({}, {}, ${DURATION});
`;
  const data = {
    T, P, yMax, piece: PIECE, s: s.s, rb: runBest, pb: s.s.map((_, i) => pbs.has(i + 1)), pbs: s.pbs,
    xl: [...Array.from({ length: 10 }, (_, i) => i + 1), ...bigTicks, N], total: Math.round(total * 100), m1, m2,
  };
  return {
    // Cover = frame 0, the complete splash.
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.5, 3.3, 6.0, 9.2, 11.0, 13.5, 15.6, 18.0, 20.6, 23.0, 25.5, 27.5, 29.2, DURATION - 0.05],
    html: composition({ key, title: 'Reel the grind', duration: DURATION, frameHtml, css, data, script }),
  };
}
