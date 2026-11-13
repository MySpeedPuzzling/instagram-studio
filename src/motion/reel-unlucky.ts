// Reel "Unlucky 13" (was "The cruellest 13 seconds") (Friday the 13th, 2026-11-13; owner pick after the pile-of-shame hit: shared pain +
// humour, ends on a comment question). Drawn in code only. Followers' Reel; the lesson from two Trial Reels (≈80 %
// gone in 3 s) is applied anyway: frame 0 is a finished title card AND it moves from the first frame on (the
// stopwatch is already ticking, the last piece already rising).
//   0.0–4.6   splash: logo, myspeedpuzzling.com, "Unlucky 13" (owner 2026-11-13), a big stopwatch at 59:47 that ticks
//             (fast, then slow), a board of Black Cat and Raven with one empty slot; the last piece rises, arrives the wrong way round,
//             won't go in, is turned, and lands as the clock shows 1:00:02 → coral flash
//   4.7–8.4   the splash lines leave (logo exit): "Last piece in." / "2 seconds over the hour."
//   8.6–13.4  coral poster: N solo 500s finished between 1:00:00 and 1:00:13 · by M puzzlers
//   13.8–18.6 Friday the 13th works both ways: Lucky 59:47–59:59 vs Unlucky 1:00:00–1:00:13 (two big numbers)
//   18.8–24.0 the hour is a magic line: results per minute 50–69, the 59 bar coral, 59:xx vs 1:00:xx
//   24.2–28.8 the ask: "Whatever your line is, what's your closest near miss?"
//   28.8–29.8 loop: the clock rewinds to 59:47, the piece drops out again, the splash returns (= frame 0)
// Text only in the Reel safe area (x 60–960, y 220–1250); the board may run to ~1460.
import { GROUNDS, W, X0, f1, frame, groundVars, hero, heroFit, outlinedLogo, pieceMark, posterTopPath, siteLine, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import { CLOCK, type ReelUnluckySpec } from '../posts/reel-unlucky.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
const T = { tickSlow: 1.2, hour: 3.4, snap: 4.3, splashOut: 4.7, done: 5.0, poster: 8.6, posterOut: 13.4, luck: 13.8, wall: 18.8, ask: 24.2, loop: 28.8 } as const;
const DURATION = 29.8;
const SEAM = 1262;
/** The board: 8×5 generator pieces of 80 px under the stopwatch; the slot at column 4, row 2. */
const B = { cols: 8, rows: 5, pc: 80, x: 0, y: 1104 };
const BW = B.cols * B.pc, BH = B.rows * B.pc;
B.x = Math.round(540 - BW / 2);
const HOLE = { col: 4, row: 2 };
/** Where the last piece waits on frame 0 (board-local offset from its slot) before it rises. */
const START = { dx: 190, dy: 330, rot: 38 };
/** The minute chart. */
const CH = { x: X0 + 20, base: 1110, h: 330, bw: 36, gap: 8 };

function board(img: string) {
  const jig = generateJigsaw({ cols: B.cols, rows: B.rows, width: BW, height: BH, seed: 13, tabSize: 0.24, jitter: 0.04 });
  const hole = jig.pieces.find(p => p.col === HOLE.col && p.row === HOLE.row)!;
  const pat = (id: string) => `<pattern id="${id}" patternUnits="userSpaceOnUse" x="0" y="0" width="${BW}" height="${BH}"><image href="${img}" width="${BW}" height="${BH}" preserveAspectRatio="xMidYMid slice"/></pattern>`;
  const svg = `<svg class="mo-board" id="board" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="left:${B.x}px; top:${B.y}px" aria-hidden="true">
    <defs>${pat('bimg')}</defs>
    ${jig.pieces.filter(p => p !== hole).map(p => `<path class="mo-pc" d="${p.d}" fill="url(#bimg)"/>`).join('')}
    <path class="mo-hole" id="hole" d="${hole.d}"/>
  </svg>`;
  const cx = hole.bbox.x + hole.bbox.width / 2, cy = hole.bbox.y + hole.bbox.height / 2;
  const last = `<svg class="mo-board" id="last" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="left:${B.x}px; top:${B.y}px" aria-hidden="true">
    <defs>${pat('limg')}</defs><path class="mo-pc mo-last" d="${hole.d}" fill="url(#limg)"/>
  </svg>`;
  return { svg, last, origin: `${f1(cx)}px ${f1(cy)}px` };
}

function wallChart(s: ReelUnluckySpec) {
  const max = Math.max(...s.wall.map(w => w.results));
  const bars = s.wall.map((w, i) => {
    const hh = (w.results / max) * CH.h, x = i * (CH.bw + CH.gap);
    const cls = w.minute === 59 ? 'hot' : w.minute === 60 ? 'next' : '';
    return `<rect class="mo-bar ${cls}" x="${f1(x)}" y="${f1(CH.h - hh)}" width="${CH.bw}" height="${f1(hh)}" rx="4"/>`;
  }).join('');
  const lab = (minute: number, text: string) => {
    const i = s.wall.findIndex(w => w.minute === minute);
    return i < 0 ? '' : `<p class="mo-tick" style="left:${f1(CH.x + i * (CH.bw + CH.gap) + CH.bw / 2 - 80)}px; top:${CH.base + 14}px">${text}</p>`;
  };
  const cw = s.wall.length * (CH.bw + CH.gap) - CH.gap;
  return `<svg id="bars" width="${cw}" height="${CH.h}" viewBox="0 0 ${cw} ${CH.h}" style="position:absolute; left:${CH.x}px; top:${CH.base - CH.h}px" aria-hidden="true">${bars}</svg>
    <div class="mo-axis" style="left:${CH.x}px; top:${CH.base}px; width:${cw}px"></div>
    ${lab(50, '50')}${lab(55, '55')}${lab(60, '1 hour')}${lab(65, '65')}`;
}

export function reelUnluckyMotion(v: Variant, s: ReelUnluckySpec): Motion {
  const key = 'reel-unlucky';
  const coral = GROUNDS.coral;
  const b = board(s.box.img);
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  const date = s.queriedAt.slice(0, 10);
  const m59 = s.wall.find(w => w.minute === 59)?.results ?? 0, m60 = s.wall.find(w => w.minute === 60)?.results ?? 0;
  const stopAt = Math.floor(CLOCK.to), over = stopAt - 3600;

  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mo-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="mo-c mo-hook xl" style="top:620px">Unlucky <span class="h13">13</span></p>
    <p class="mo-c mo-wink" style="top:806px">Yes, it's Friday the 13th.</p>
  </div>`;
  const clockEl = hero('59:48', { size: 170, baseline: 1020, center: true }).replace('<p class="h-big"', '<p class="h-big" id="clock"');
  const credit = `<p class="h-abs h-credit mo-cc" id="bcredit" style="top:1058px; width:${RW}px">Solo 500 pieces · ${h(s.box.puzzle)} · ${h(s.box.brand)}</p>`;

  const done = `<div id="done">
    <p class="mo-line" style="top:540px">Last piece in.</p>
    <p class="mo-line hot s" style="top:648px">${over} seconds over the hour.</p>
    <p class="mo-sub2" style="top:770px">Blame the black cat.</p>
  </div>`;

  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <header class="h-head" style="top:296px">${pieceMark('var(--g-device)')}<span class="h-kick">Friday the 13th · solo times</span><span style="margin-left:auto">${outlinedLogo(96).replace('.svg"', '.svg?poster"')}</span></header>
      <p class="h-src h-abs" style="top:388px">${siteLine(`Solo results · data ${date}`)}</p>
      ${hero(fmtInt(s.missed), { size: heroFit(fmtInt(s.missed), 360, RW - 40), baseline: 860 })}
      <p class="h-abs h-lead" style="top:930px; width:${RW}px; font-size:52px">solo 500-piece puzzles finished between <b>1:00:00</b> and <b>1:00:13</b>.</p>
      <p class="h-abs h-lead" style="top:1120px; width:${RW}px; font-size:40px">By ${fmtInt(s.missedPuzzlers)} puzzlers. You're not alone.</p>
    </div>
  </div>`;

  const row = (id: string, k: string, range: string, n: number, y: number, hot: boolean) => `
    <div class="mo-luck${hot ? ' hot' : ''}" style="top:${y}px"><div class="l"><p class="k">${k}</p><p class="r">${range}</p></div><p class="n" id="${id}">${fmtInt(n)}</p></div>`;
  const luck = `<div id="luck">
    <p class="mo-line" style="top:470px">Friday the 13th</p>
    <p class="mo-sub2" style="top:572px">works both ways</p>
    ${row('n-lucky', 'Lucky', '59:47 to 59:59', s.made, 690, false)}
    ${row('n-unlucky', 'Unlucky', '1:00:00 to 1:00:13', s.missed, 900, true)}
    <p class="h-abs h-credit mo-cc" style="top:1130px; width:${RW}px">Solo 500-piece results · data ${date}</p>
  </div>`;

  const wall = `<div id="wall">
    <p class="mo-line s" style="top:470px">The hour is a magic line</p>
    <div class="mo-pair2" style="top:570px">
      <p><span class="t">59:xx</span><span class="n hot">${fmtInt(m59)}</span></p>
      <p><span class="t">1:00:xx</span><span class="n">${fmtInt(m60)}</span></p>
    </div>
    ${wallChart(s)}
    <p class="h-abs h-credit mo-cc" style="top:1190px; width:${RW}px">Solo 500 results per minute · data ${date}</p>
  </div>`;

  const ask = `<div id="ask">
    <p class="mo-line s" style="top:500px">Whatever your line is,</p>
    <p class="mo-line" style="top:620px">what's your closest</p>
    <p class="mo-line hot" style="top:720px">near miss?</p>
    <p class="mo-sub2" style="top:880px">Tell us in the comments.</p>
    <p class="mo-sub2" style="top:950px">Bonus points if a cat was involved.</p>
  </div>`;

  const body = `${splash}${clockEl}${credit}${b.last}${b.svg}${done}${luck}${wall}${ask}${poster}`;

  const css = LOGO_CSS + `
#done, #luck, #wall, #ask, #poster, #ptext { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; z-index: 4; }
#clock { transform-origin: 50% 70%; }
#clock.over { color: var(--g-hot); }
.mo-board { position: absolute; overflow: visible; }
#board { z-index: 2; }
#last { z-index: 3; }
.mo-pc { stroke: rgba(18, 24, 36, 0.55); stroke-width: 1.4; stroke-linejoin: round; }
.mo-last { stroke: #ec726f; stroke-width: 5; }
.mo-hole { fill: #1a202c; stroke: var(--g-hot); stroke-width: 4; stroke-linejoin: round; }
.mo-cc { text-align: center; }
.mo-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.mo-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.mo-hook { font-size: 96px; }
.mo-hook.hot { color: var(--g-hot); }
.mo-hook.xl { font-size: 140px; }
.h13 { color: var(--g-hot); }
.mo-wink { font-size: 46px; font-weight: 500; font-style: italic; letter-spacing: 0.01em; color: var(--g-accent); }
.mo-sub { font-size: 44px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.mo-line { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 80px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; color: var(--g-ink); white-space: nowrap; }
.mo-line.s { font-size: 64px; }
.mo-line.hot { color: var(--g-hot); }
.mo-sub2 { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 46px; font-weight: 500; color: var(--g-soft); }
.mo-luck { position: absolute; left: ${X0 + 40}px; width: ${RW - 80}px; display: flex; align-items: center; gap: 30px; }
.mo-luck .l { flex: 1; }
.mo-luck .k { font-size: 64px; font-weight: 700; line-height: 1.05; color: var(--g-ink); }
.mo-luck .r { margin-top: 8px; font-size: 38px; font-weight: 500; color: var(--g-accent); }
.mo-luck .n { font-size: 150px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; color: var(--g-ink); }
.mo-luck.hot .k, .mo-luck.hot .n { color: var(--g-hot); }
.mo-pair2 { position: absolute; left: ${X0}px; width: ${RW}px; display: flex; justify-content: center; gap: 90px; }
.mo-pair2 p { display: flex; align-items: baseline; gap: 18px; }
.mo-pair2 .t { font-size: 40px; font-weight: 600; color: var(--g-soft); }
.mo-pair2 .n { font-size: 84px; font-weight: 700; color: var(--g-ink); }
.mo-pair2 .n.hot { color: var(--g-hot); }
.mo-bar { fill: var(--g-chart-base, #626c80); }
.mo-bar.hot { fill: #ec726f; }
.mo-bar.next { fill: #97a5f9; }
.mo-axis { position: absolute; height: 3px; background: #7d879c; }
.mo-tick { position: absolute; width: 160px; text-align: center; font-size: 32px; font-weight: 600; color: var(--g-soft); white-space: nowrap; }
#poster { position: absolute; inset: 0; z-index: 7; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Friday the 13th · solo times', device: v.device, src: '', rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T, $ = id => document.getElementById(id);
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head';

// ---- the stopwatch: whole seconds only; coral from 1:00:00 on
const clk = { v: D.from };
const showClk = () => {
  const sec = Math.floor(clk.v + 1e-6), el = $('clock');
  el.innerHTML = fmtT(sec).replace(/:/g, '<span class="c">:</span>');
  el.classList.toggle('over', sec >= 3600);
};
showClk();
tl.fromTo(clk, { v: D.from }, { v: D.from + 7, duration: T.tickSlow, ease: 'none', onUpdate: showClk }, 0);
tl.fromTo(clk, { v: D.from + 7 }, { v: 3600, duration: T.hour - T.tickSlow, ease: 'none', onUpdate: showClk, immediateRender: false }, T.tickSlow);
tl.fromTo(clk, { v: 3600 }, { v: D.stop + 0.99, duration: T.snap - T.hour, ease: 'none', onUpdate: showClk, immediateRender: false }, T.hour);

// ---- the empty slot pulses; the last piece rises from below and lands as the clock passes the hour
tl.fromTo('#hole', { strokeOpacity: 1 }, { strokeOpacity: 0.35, duration: 0.45, repeat: 3, yoyo: true, ease: 'sine.inOut' }, 0.1);
tl.set('#last', { x: D.start.dx, y: D.start.dy, rotation: D.start.rot, transformOrigin: D.origin }, 0);
// the gag (owner 2026-11-13: "funnier"): it arrives the wrong way round at 59:58, won't go in, jiggles, gets turned
// and only lands at 1:00:02
tl.to('#last', { x: 0, y: -70, rotation: 90, scale: 1.4, duration: 1.6, ease: 'power2.inOut' }, 0.9);
tl.to('#last', { y: 0, scale: 1.15, duration: 0.15, ease: 'power2.in' }, 2.55);
tl.to('#last', { y: -80, scale: 1.4, duration: 0.18, ease: 'back.out(3)' }, 2.72);
tl.to('#last', { x: 14, duration: 0.05, repeat: 5, yoyo: true, ease: 'none' }, 2.92);
tl.to('#last', { rotation: 0, x: 0, duration: 0.55, ease: 'back.inOut(1.5)' }, 3.3);
tl.to('#last', { y: 0, scale: 1, duration: 0.25, ease: 'power3.in' }, T.snap - 0.25);
tl.to('#last .mo-last', { stroke: 'rgba(18, 24, 36, 0.75)', strokeWidth: 2, duration: 0.1 }, T.snap);
tl.set('#last .mo-last', { stroke: '#ec726f', strokeWidth: 5 }, T.loop + 0.2);
tl.to('#hole', { strokeOpacity: 0, duration: 0.05 }, T.snap - 0.02);
flash('#clock', T.snap);
tl.fromTo('#board, #last', { scale: 1 }, { scale: 1.03, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: '50% 50%', immediateRender: false }, T.snap);

// ---- the splash lines leave (logo exit); the verdict
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
show(MAST, T.splashOut + 0.68);
show('#done', T.done, 0.01);
riseIn('#done > *', T.done, { stagger: 0.5, dur: 0.35 });
hide(['#done', '#clock', '#bcredit', '#board', '#last'], T.poster - 0.2, 0.15);

// ---- poster: the unlucky number
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.poster);
tl.set(MAST, { autoAlpha: 0 }, T.poster + 0.28);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.3);
countUp('#ptext .h-big', D.missed, T.poster + 0.32, 1.2);
riseIn('#ptext .h-lead', T.poster + 0.9, { stagger: 0.6, dur: 0.35 });
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.set(MAST, { autoAlpha: 1 }, T.posterOut + 0.15);
tl.to('#poster', { y: -${SEAM + 140}, duration: 0.38, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.49);

// ---- both ways: lucky vs unlucky
show('#luck', T.luck, 0.01);
riseIn('#luck .mo-line, #luck .mo-sub2', T.luck, { stagger: 0.2, dur: 0.35 });
riseIn('#luck .mo-luck', T.luck + 0.7, { stagger: 0.6, dur: 0.4 });
countUp('#n-lucky', D.made, T.luck + 0.8, 1.0);
countUp('#n-unlucky', D.missed, T.luck + 1.4, 1.0);
riseIn('#luck .h-credit', T.luck + 1.6, { dur: 0.3 });
hide('#luck', T.wall - 0.3);

// ---- the magic line: bars grow, 59 lights up
show('#wall', T.wall, 0.01);
riseIn('#wall .mo-line', T.wall, { dur: 0.35 });
tl.fromTo('#bars .mo-bar', { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.5, ease: 'power3.out', stagger: 0.04, immediateRender: false }, T.wall + 0.3);
tl.set('#bars .mo-bar', { scaleY: 0, transformOrigin: '50% 100%' }, 0);
riseIn('#wall .mo-axis, #wall .mo-tick', T.wall + 0.3, { dur: 0.3 });
riseIn('#wall .mo-pair2', T.wall + 1.5, { dur: 0.4 });
riseIn('#wall .h-credit', T.wall + 1.8, { dur: 0.3 });
flash('#bars .mo-bar.hot', T.wall + 1.6);
hide('#wall', T.ask - 0.3);

// ---- ask
show('#ask', T.ask, 0.01);
riseIn('#ask > *', T.ask, { stagger: 0.45, dur: 0.35 });

// ---- loop: the clock rewinds to the start, the piece drops back down, the splash returns (= frame 0)
hide(['#ask', MAST], T.loop, 0.25);
tl.set(['#clock', '#bcredit', '#board'], { autoAlpha: 1 }, T.loop + 0.2);
tl.fromTo(['#clock', '#bcredit', '#board'], { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, T.loop + 0.2);
tl.fromTo(clk, { v: D.stop + 0.99 }, { v: D.from, duration: 0.6, ease: 'power2.inOut', onUpdate: showClk, immediateRender: false }, T.loop + 0.2);
tl.set('#last', { autoAlpha: 1, x: D.start.dx, y: D.start.dy, rotation: D.start.rot }, T.loop + 0.2);
tl.to('#hole', { strokeOpacity: 1, duration: 0.1 }, T.loop + 0.2);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.4)}
tl.set({}, {}, ${DURATION});
`;
  const data = { T, from: CLOCK.from, stop: stopAt, missed: s.missed, made: s.made, start: START, origin: b.origin };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 2.0, 2.7, 3.0, 3.6, 3.9, T.snap + 0.2, T.done + 1.8, T.poster + 2.6, T.luck + 3.0, T.wall + 3.0, T.ask + 2.5, DURATION - 0.05],
    html: composition({ key, title: 'Reel Unlucky 13', duration: DURATION, frameHtml, css, data, script }),
  };
}
