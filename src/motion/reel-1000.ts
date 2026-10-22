// Reel "A 1000 isn't twice a 500" (first Reel, 2026-10-21), ~20 s, HyperFrames. Three looks of the same beats, for the
// owner to pick from:
//   A  race clock: two progress tracks + bars standing on the bottom edge (three 500 blocks vs one 1000 bar)
//   B  boxes: lap counters + the real boxes as the bars (three 500 boxes stack, the 1000 box grows beside them)
//   C  combined: A's tracks + B's boxes
// Beats:
//   0.0–1.0   title card (frame 0 = the preview): the question, the empty tracks / ghost columns (B: both boxes)
//   1.2–6.6   the race at the typical (median) solo pace: the clock runs 0 → 1000's median; the 500 laps three times
//             (each lap drops a 500 block/box onto the stack) while the 1000 fills once
//   6.9–9.1   coral poster: "3×", not 2×
//   9.4–12.3  every pace: quicker quarter / typical / relaxed quarter, 500 vs 1000 and the ratio
//   12.6–15.2 even the fastest: the fastest solo 500 and 1000, ratio
//   15.4–17.7 same puzzlers who logged both: their best 1000 vs their best 500
//   17.9–19.3 the question for the comments; then everything returns to the title card for the loop
// Text only in the Reel safe area (x 60–960, y 220–1250); below it only graphics (bars/boxes), so the frame reads full.
// Bar heights are proportional to time (the 1000 bar = its median, each 500 block = the 500 median), so the stack of
// three 500s ends just under the 1000's top: the honest 3.0×.
import { CW, GROUNDS, W, X0, clock, f1, frame, groundVars, hero, heroFit, outlinedLogo, pieceMark, posterTopPath, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import type { Motion } from './render.ts';

export type Look = 'A' | 'B' | 'C';

export interface Reel1000Spec {
  /** Seconds: p25 / median / p75 per size, the fastest per size. */
  s500: { p25: number; p50: number; p75: number; best: number; results: number };
  s1000: { p25: number; p50: number; p75: number; best: number; results: number };
  same: { puzzlers: number; ratioMedian: number; ratioBest: number };
  box500: { puzzle: string; brand: string; img: string };
  box1000: { puzzle: string; brand: string; img: string };
  /** More 500s (v2: one different 500 per lap; the first lap uses box500). */
  more500?: { puzzle: string; brand: string; img: string }[];
  queriedAt: string;
}

const SAFE = FRAMES.reel.safe;
/** Right edge of text (Instagram's buttons sit right of 960). */
const RX = SAFE.x1, RW = RX - X0;
const DURATION = 20;
const T = { race: 1.2, raceDur: 5.4, poster: 6.9, posterOut: 9.1, pace: 9.4, fast: 12.6, same: 15.4, ask: 17.9, loop: 19.3 } as const;
/** Columns on the bottom edge: top of a full 1000 column, the bottom edge, column width and x. */
const COL = { top: 1290, bottom: 1880, w: 300, x500: W / 2 - 340, x1000: W / 2 + 40 } as const;
const SEAM = 1262;
const t = (s: number) => fmtDuration(s / 60);
const x = (r: number) => `${r.toFixed(1)}×`;

export function reel1000Motion(v: Variant, s: Reel1000Spec, look: Look): Motion {
  const key = `reel-1000-${look}`;
  const navy = GROUNDS.navy, coral = GROUNDS.coral;
  const tracks = look !== 'B', boxes = look !== 'A';
  const fullH = COL.bottom - COL.top;
  const segH = fullH * (s.s500.p50 / s.s1000.p50);
  const lapDur = T.raceDur * (s.s500.p50 / s.s1000.p50);
  const r50 = s.s1000.p50 / s.s500.p50;

  // ---------------------------------------------------------------- title card (also the loop's end state)
  const title = `<div id="title">
    <p class="h-abs h-cap" style="top:470px">A puzzle question</p>
    <h1 class="h-title xl" style="top:520px; width:${RW}px">Does a 1000-piece puzzle take twice as long as a 500?</h1>
  </div>`;

  // ---------------------------------------------------------------- race (middle zone)
  const TR = { y5: 800, y10: 960, h: 52 };
  const trackRow = (id: string, y: number, label: string) => `
    <p class="h-abs mo-tl" style="top:${y - 52}px; width:${RW}px"><b>${label}</b><span id="${id}-n"></span></p>
    <div class="mo-track" style="top:${y}px"><i id="${id}-bar"></i></div>`;
  const raceMid = tracks
    ? `${trackRow('t5', TR.y5, '500 pieces')}${trackRow('t10', TR.y10, '1000 pieces')}
       <p class="h-abs mo-laps" id="laps" style="top:${TR.y10 + 84}px; width:${RW}px">${[1, 2, 3].map(i => `<span id="lap${i}">${i === 1 ? '1st' : i === 2 ? '2nd' : '3rd'} 500 · ${t(s.s500.p50 * i)}</span>`).join('')}</p>`
    : `<div class="h-abs mo-count" style="top:760px; width:${RW}px">
         <div><p class="h-cap">500s finished</p><p class="h-big" id="c5" style="font-size:150px">0</p></div>
         <div><p class="h-cap">1000s finished</p><p class="h-big" id="c10" style="font-size:150px">0</p></div>
       </div>
       <p class="h-abs mo-laps" id="laps" style="top:1010px; width:${RW}px">${[1, 2, 3].map(i => `<span id="lap${i}">${t(s.s500.p50 * i)}</span>`).join('')}</p>`;
  const clockSize = heroFit(t(s.s1000.p50), 170, RW);
  const race = `<div id="race">
    <p class="h-abs h-cap" style="top:470px">Typical solo time · race clock</p>
    ${hero('0:00', { size: clockSize, baseline: 520 + clockSize * 0.82, extra: 'width:880px' }).replace('<p class="h-big"', '<p class="h-big" id="clock"')}
    ${raceMid}
  </div>`;

  // Column headers + box credit, just above the bottom zone (still inside the safe area).
  const credit = boxes ? `<p class="h-abs h-credit" id="credit" style="top:1118px; width:${RW}px">Boxes: ${h(s.box500.puzzle)} (500) and ${h(s.box1000.puzzle)} (1000) · ${h(s.box500.brand === s.box1000.brand ? s.box500.brand : `${s.box500.brand}, ${s.box1000.brand}`)}</p>` : '';
  const heads = `<div id="heads">
    <p class="mo-colh" style="left:${COL.x500}px; top:1196px">500 <span id="h5n">×1</span></p>
    <p class="mo-colh" style="left:${COL.x1000}px; top:1196px">1000</p>
  </div>`;

  // ---------------------------------------------------------------- bottom zone: bars (A) or boxes (B, C)
  const segTop = (i: number) => COL.bottom - segH * (i + 1);
  const ghost = `<div class="mo-ghost" style="left:${COL.x500}px; top:${f1(segTop(2))}px; width:${COL.w}px; height:${f1(segH * 3)}px"></div>
    <div class="mo-ghost" style="left:${COL.x1000}px; top:${COL.top}px; width:${COL.w}px; height:${fullH}px"></div>`;
  const bottom = boxes
    ? `${ghost}
      ${[0, 1, 2].map(i => `<span class="mo-box" id="b5-${i}" style="left:${COL.x500}px; top:${f1(segTop(i))}px; width:${COL.w}px; height:${f1(segH - 6)}px"><img src="${s.box500.img}" alt=""></span>`).join('')}
      <span class="mo-box" id="b10" style="left:${COL.x1000}px; top:${COL.top}px; width:${COL.w}px; height:${fullH}px"><img src="${s.box1000.img}" alt=""></span>`
    : `${ghost}
      ${[0, 1, 2].map(i => `<div class="mo-seg" id="b5-${i}" style="left:${COL.x500}px; top:${f1(segTop(i))}px; width:${COL.w}px; height:${f1(segH - 6)}px"></div>`).join('')}
      <div class="mo-bar10" id="b10" style="left:${COL.x1000}px; top:${COL.top}px; width:${COL.w}px; height:${fullH}px"></div>`;

  // ---------------------------------------------------------------- poster: 3×
  const big = x(r50).replace('.0×', '×');
  const posterMast = `<header class="h-head" style="top:296px">${pieceMark('var(--g-device)')}<span class="h-kick">Did you know · solo times</span><span style="margin-left:auto">${outlinedLogo(96).replace('.svg"', '.svg?poster"')}</span></header>`;
  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      ${posterMast}
      <p class="h-abs h-cap" style="top:470px">Not twice as long</p>
      ${hero(big, { size: 420, baseline: 900 })}
      <p class="h-abs h-lead" style="top:960px; width:${RW}px">A typical 1000 takes <b>${t(s.s1000.p50)}</b>. A typical 500: <b>${t(s.s500.p50)}</b>.</p>
    </div>
  </div>`;

  // ---------------------------------------------------------------- every pace
  const rows = [
    { k: 'Quicker quarter', a: s.s500.p25, b: s.s1000.p25 },
    { k: 'Typical', a: s.s500.p50, b: s.s1000.p50, hot: true },
    { k: 'Relaxed quarter', a: s.s500.p75, b: s.s1000.p75 },
  ];
  const pace = `<div id="pace">
    <p class="h-abs h-cap" style="top:470px">At every pace</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">It's about 3× for everyone</p>
    <div class="h-board mo-board" style="top:640px; width:${RW}px">
      <div class="h-bh"><span class="k"></span><span class="a">500</span><span class="b">1000</span><span class="r"></span></div>
      ${rows.map(r => `<div class="h-br mo-row${r.hot ? ' hot' : ''}" style="height:104px"><span class="k">${r.k}</span><span class="a">${clock(t(r.a))}</span><span class="b">${clock(t(r.b))}</span><span class="r">${x(r.b / r.a)}</span></div>`).join('')}
    </div>
    <p class="h-abs h-lab" style="top:1030px; width:${RW}px">Quarters of all solo results: ${fmtInt(s.s500.results)} on 500s, ${fmtInt(s.s1000.results)} on 1000s.</p>
  </div>`;

  // ---------------------------------------------------------------- the fastest
  const rFast = s.s1000.best / s.s500.best;
  const fast = `<div id="fast">
    <p class="h-abs h-cap" style="top:470px">Even the fastest</p>
    <div class="h-abs mo-pair" style="top:530px; width:${RW}px">
      <div><p class="h-lab">Fastest solo 500</p><p class="h-big" id="f5" style="font-size:120px">${clock(t(s.s500.best))}</p></div>
      <div><p class="h-lab">Fastest solo 1000</p><p class="h-big" id="f10" style="font-size:120px">${clock(t(s.s1000.best))}</p></div>
    </div>
    ${hero(x(rFast), { size: 230, baseline: 930, hot: true }).replace('<p class="h-big hot"', '<p class="h-big hot" id="fr"')}
    <p class="h-abs h-lead" id="fl" style="top:975px; width:${RW}px">The world's fastest log their times here too.</p>
  </div>`;

  // ---------------------------------------------------------------- same puzzlers
  const same = `<div id="same">
    <p class="h-abs h-cap" style="top:470px">Same puzzlers, both sizes</p>
    ${hero(x(s.same.ratioBest), { size: 300, baseline: 800, hot: true }).replace('<p class="h-big hot"', '<p class="h-big hot" id="sr"')}
    <p class="h-abs h-lead" style="top:860px; width:${RW}px"><b id="sn">${fmtInt(s.same.puzzlers)}</b> puzzlers logged both. Their best 1000 took ${x(s.same.ratioBest)} their best 500.</p>
  </div>`;

  // ---------------------------------------------------------------- the question
  const ask = `<div id="ask">
    <p class="h-abs h-ask" style="top:520px; width:${RW}px">Twice the pieces, three times the time. Why do you think that is?</p>
    <p class="h-abs h-lead" style="top:900px; width:${RW}px; color:var(--g-soft)">Log both sizes on myspeedpuzzling.com and see your own ratio.</p>
  </div>`;

  const body = `${title}${race}${credit}${heads}${bottom}${pace}${fast}${same}${ask}${poster}`;

  const css = `
#race, #heads, #pace, #fast, #same, #ask, #poster, #ptext { visibility: hidden; opacity: 0; }
#heads { position: absolute; inset: 0; }
.mo-tl { display: flex; justify-content: space-between; font-size: 34px; color: var(--g-soft); }
.mo-tl b { color: var(--g-ink); font-weight: 700; }
.mo-tl span { font-weight: 700; color: var(--g-accent); }
.mo-track { position: absolute; left: ${X0}px; width: ${RW}px; height: ${TR.h}px; border-radius: ${TR.h / 2}px; background: var(--g-band); overflow: hidden; }
.mo-track i { position: absolute; inset: 0; border-radius: ${TR.h / 2}px; transform-origin: 0 50%; transform: scaleX(0); }
#t5-bar { background: ${navy.chart.cool}; }
#t10-bar { background: ${navy.chart.context}; }
.mo-laps { display: flex; gap: 28px; font-size: 30px; font-weight: 600; color: var(--g-soft); }
.mo-laps span { opacity: 0; }
.mo-count { display: flex; gap: 40px; }
.mo-count > div { flex: 1; }
.mo-colh { position: absolute; width: ${COL.w}px; text-align: center; font-size: 36px; font-weight: 700; color: var(--g-ink); }
.mo-colh span { color: var(--g-accent); }
.mo-ghost { position: absolute; background: var(--g-band); border-radius: 8px 8px 0 0; }
.mo-seg { position: absolute; background: ${navy.chart.cool}; border-radius: 8px; transform-origin: 50% 100%; }
.mo-bar10 { position: absolute; background: ${navy.chart.context}; border-radius: 8px 8px 0 0; transform-origin: 50% 100%; }
.mo-box { position: absolute; display: block; background: #ffffff; padding: 8px; border-radius: 8px; box-shadow: 0 18px 36px -14px rgba(10, 14, 24, 0.7); overflow: hidden; }
.mo-box img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }
#b10.mo-box { transform-origin: 50% 100%; }
.mo-board .h-bh > span, .mo-row > span { display: block; }
.mo-board .k { flex: 1; }
.mo-board .a, .mo-board .b { width: 190px; text-align: right; }
.mo-board .r { width: 140px; text-align: right; }
.mo-row .k { font-size: 36px; font-weight: 500; color: var(--g-ink); }
.mo-row .a, .mo-row .b { font-size: 38px; font-weight: 700; color: var(--g-ink); }
.mo-row .r { font-size: 38px; font-weight: 700; color: var(--g-accent); }
.mo-row.hot .r { color: var(--g-hot); }
.mo-pair { display: flex; gap: 40px; }
.mo-pair > div { flex: 1; }
.mo-pair .h-big { margin-top: 6px; }
#poster { position: absolute; inset: 0; z-index: 5; }
${boxes ? '#b5-1, #b5-2 { opacity: 0; }' : '#b5-0, #b5-1, #b5-2 { opacity: 0; }\n#b10 { transform: scaleY(0); }'}
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Did you know · solo times', device: v.device, src: `Solo results · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';

// ---- title → race
hide('#title', T.race - 0.3);
show(['#race', '#heads'], T.race - 0.1);
${boxes ? `// boxes: frame 0 shows one 500 box and the full 1000 box; the race resets the 1000 to empty
tl.to('#b10', { scaleY: 0, duration: 0.3, ease: 'power2.in' }, T.race - 0.3);` : ''}

// the race clock: linear, the 1000's median in T.raceDur seconds. Every counter is derived from the clock value, so
// any frame (seeking forwards or back) shows the right state.
const clk = { v: 0 }, $ = id => document.getElementById(id);
const showClk = () => {
  $('clock').innerHTML = fmtT(clk.v).replace(/:/g, '<span class="c">:</span>');
  const laps = Math.min(3, Math.floor(clk.v / D.m500 + 1e-9)), done = clk.v >= D.m1000 - 0.5;
  $('h5n').textContent = laps ? '×' + laps : '';
  for (let i = 1; i <= 3; i++) $('lap' + i).style.opacity = laps >= i ? 1 : 0;
  if (D.tracks) { $('t5-n').textContent = laps ? laps + '× done' : ''; $('t10-n').textContent = done ? 'done' : ''; }
  else { $('c5').textContent = String(laps); $('c10').textContent = done ? '1' : '0'; }
};
showClk();
tl.fromTo(clk, { v: 0 }, { v: D.m1000, duration: T.raceDur, ease: 'none', onUpdate: showClk, onComplete: showClk, onReverseComplete: showClk }, T.race);

// the 1000 fills once
if (D.tracks) tl.fromTo('#t10-bar', { scaleX: 0 }, { scaleX: 1, duration: T.raceDur, ease: 'none' }, T.race);
tl.fromTo('#b10', { scaleY: 0 }, { scaleY: 1, duration: T.raceDur, ease: 'none', immediateRender: false }, T.race);

// the 500 laps three times; each lap drops a block/box onto the stack (boxes: the first box is already there)
for (let i = 0; i < 3; i++) {
  const at = T.race + i * D.lapDur, end = at + D.lapDur;
  if (D.tracks) {
    tl.fromTo('#t5-bar', { scaleX: 0 }, { scaleX: 1, duration: D.lapDur, ease: 'none', immediateRender: false }, at);
    if (i < 2) tl.set('#t5-bar', { scaleX: 0 }, end);
  } else flash('#c5', end);
  if (D.boxes && i === 0) flash('#b5-0', end);
  else tl.fromTo('#b5-' + i, { y: -700, opacity: 1, rotation: (i % 2 ? 6 : -6) }, { y: 0, rotation: 0, duration: 0.45, ease: 'bounce.out', immediateRender: false }, end - 0.45);
}
const fin = T.race + T.raceDur;
if (D.tracks) tl.to('#t10-bar', { backgroundColor: D.hot, duration: 0.2 }, fin);
else flash('#c10', fin);
flash('#clock', fin);

// ---- poster: 3×
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, T.poster);
tl.set(['#race', '#heads', MAST].concat(D.boxes ? ['#credit'] : []), { autoAlpha: 0 }, T.poster + 0.35);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.4);
popIn('#ptext .h-big', T.poster + 0.45, { from: '0% 80%', scale: 0.6 });
riseIn('#ptext .h-lead', T.poster + 0.7, { dur: 0.35 });
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.set([MAST, '#heads'].concat(D.boxes ? ['#credit'] : []), { autoAlpha: 1 }, T.posterOut + 0.15);
tl.to('#poster', { y: -${SEAM + 140}, duration: 0.5, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.61);

// ---- every pace
show('#pace', T.pace, 0.01);
riseIn('#pace .h-cap, #pace .h-title', T.pace, { stagger: 0.08, dur: 0.35 });
riseIn('#pace .mo-row', T.pace + 0.3, { stagger: 0.18, dur: 0.35 });
riseIn('#pace .h-lab', T.pace + 0.9, { dur: 0.3 });
hide('#pace', T.fast - 0.3);

// ---- the fastest
show('#fast', T.fast, 0.01);
riseIn('#fast .h-cap', T.fast, { dur: 0.3 });
countUp('#f5', D.b500, T.fast + 0.1, 1.0, fmtT);
countUp('#f10', D.b1000, T.fast + 0.25, 1.2, fmtT);
popIn('#fr', T.fast + 1.5, { from: '0% 80%' });
riseIn('#fl', T.fast + 1.8, { dur: 0.35 });
hide('#fast', T.same - 0.3);

// ---- same puzzlers
show('#same', T.same, 0.01);
riseIn('#same .h-cap', T.same, { dur: 0.3 });
popIn('#sr', T.same + 0.2, { from: '0% 80%' });
riseIn('#same .h-lead', T.same + 0.5, { dur: 0.35 });
countUp('#sn', D.same, T.same + 0.5, 1.0);
hide('#same', T.ask - 0.3);

// ---- the question
show('#ask', T.ask, 0.01);
riseIn('#ask > *', T.ask, { stagger: 0.25, dur: 0.4 });

// ---- loop: back to the title card (frame 0)
hide(['#ask', '#heads'], T.loop);
${boxes ? `tl.to(['#b5-1', '#b5-2'], { y: 900, rotation: 12, duration: 0.45, ease: 'power2.in' }, T.loop);
tl.set(['#b5-1', '#b5-2'], { opacity: 0 }, T.loop + 0.46);
tl.set(['#b5-1', '#b5-2'], { y: 0, rotation: 0 }, T.loop + 0.47);` : `tl.to(['#b5-0', '#b5-1', '#b5-2'], { scaleY: 0, transformOrigin: '50% 100%', duration: 0.45, ease: 'power2.in' }, T.loop);
tl.to('#b10', { scaleY: 0, duration: 0.45, ease: 'power2.in' }, T.loop);`}
show('#title', T.loop + 0.25, 0.35);
tl.set({}, {}, ${DURATION});
`;
  const data = { T, lapDur, m500: s.s500.p50, m1000: s.s1000.p50, b500: s.s500.best, b1000: s.s1000.best, same: s.same.puzzlers, tracks, boxes, hot: navy.chart.hot };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 2.5, 4.5, 6.75, 8.3, 11.0, 14.6, 17.2, 18.8, DURATION - 0.05],
    html: composition({ key, title: `Reel 1000 vs 500 (${look})`, duration: DURATION, frameHtml, css, data, script }),
  };
}
