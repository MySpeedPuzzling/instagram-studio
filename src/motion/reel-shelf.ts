// Reel "I'll solve it this weekend" (the pile of shame as a time-lapse; idea in docs/ideas/reel-pile-of-shame.md).
// Same data as the carousel of 12 Nov 2026, a different experience: one shelf, one excuse after another, years of dust.
//   0.0–2.6   splash, complete from frame 0: logo, myspeedpuzzling.com, the hook "I'll solve it this weekend." over a
//             brand-new shelf of puzzle boxes, a NEW sticker on one of them
//   2.6–3.1   the splash leaves (logo exit), the band lifts, the shelf moves up
//   3.1–T.poster  the time-lapse: DAY 1 → 8 → 60 → 365 → 1460, one excuse per stop; days and nights flicker by, dust
//             settles, the NEW sticker peels off, cobwebs grow, a spider moves in
//   poster    coral: N% of the puzzles in collections on MySpeedPuzzling have never been solved
//   wall      the biggest pile: the camera pulls back from one shelf to a wall of them, one box per unsolved puzzle,
//             the counter ticks to N; then "N days of puzzling. Non-stop. Snacks not included."
//   museum    the most avoided puzzle of them all: an old museum wall in the dark, the picture light flickers on:
//             it's called Speed Puzzling
//   send      back at the dusty shelf: "Send this to someone who said 'this weekend'."
//   loop      time rewinds: the dust lifts, DAY 1, the splash returns (= frame 0)
// Text only in the Reel safe area (x 60–960, y 220–1250); art may run to ~y 1560.
import { GROUNDS, W, X0, f1, frame, groundVars, outlinedLogo, pieceMark, posterTopPath, siteLine, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import { CUBBIES, PLATE, WALL, type ReelShelfSpec } from '../posts/reel-shelf.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
/** Seams of the navy band: tall under the splash, the reading band, short over the museum (its lamp must show). */
const SEAM = { splash: 930, band: 700, museum: 590, poster: 1262 };
/** The shelf plate on the canvas: full width, its bottom on the canvas bottom. */
const K = W / PLATE.w, PT = 1920 - PLATE.h * K;
const SPLASH_DY = 150;
const X = (x: number) => x * K, Y = (y: number) => PT + y * K;
/** The stops of the time-lapse: the day, the excuse, how old the shelf looks (0 = new, 1 = oldest). */
const STOPS = [
  { day: 8, line: '“Next weekend.”', age: 0.2 },
  { day: 60, line: '“After the holidays.”', age: 0.48 },
  { day: 365, line: '“When I have time.”', age: 0.78 },
  { day: 1460, line: '“One day.”', age: 1 },
];
const STAGE = 2.55, TICK = 0.9;
export function times() {
  const tl0 = 3.1, tlEnd = tl0 + STOPS.length * STAGE + 0.9;
  const poster = tlEnd, posterOut = poster + 4.8, wall = posterOut + 0.3, wallB = wall + 6.1, mus = wallB + 4.1, light = mus + 2.8, send = light + 5.3, loop = send + 4.1;
  return { splashOut: 2.6, tl0, tlEnd, poster, posterOut, wall, wallB, mus, light, send, loop, end: loop + 1.0 };
}
/** The museum plate (lab SH1 m1-museum-212): scale and position; `canvas` = the grey canvas inside the gilt frame. */
const MUS = { k: 1.4, left: -90, top: 400, canvas: { x0: 248, x1: 652, y0: 318, y1: 675 }, frameBottom: 735 };
const C = { coral: '#ec726f', dark: '#1a202c', web: 'rgba(232,232,226,0.36)' };

const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/** A corner cobweb: thin threads fanning out of a corner, joined by sagging arcs. (cx, cy) = the corner; sx, sy = ±1. */
function web(cx: number, cy: number, sx: number, sy: number, size: number, seed: number) {
  const r = rng(seed), n = 5;
  const rad = [...Array(n)].map((_, i) => ({ a: (i / (n - 1)) * (Math.PI / 2) * (0.9 + r() * 0.1) + 0.04, len: size * (0.62 + r() * 0.38) }));
  const pt = (i: number, t: number) => [cx + sx * Math.cos(rad[i].a) * rad[i].len * t, cy + sy * Math.sin(rad[i].a) * rad[i].len * t];
  const lines = rad.map((_, i) => { const [x, y] = pt(i, 1); return `<path d="M ${f1(cx)} ${f1(cy)} L ${f1(x)} ${f1(y)}" pathLength="1"/>`; });
  const arcs: string[] = [];
  for (const t of [0.34, 0.58, 0.82]) for (let i = 0; i < n - 1; i++) {
    if (r() < 0.3) continue; // torn in places
    const [x0, y0] = pt(i, t * (0.94 + r() * 0.1)), [x1, y1] = pt(i + 1, t * (0.94 + r() * 0.1));
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, pull = 0.16 + r() * 0.1;
    arcs.push(`<path d="M ${f1(x0)} ${f1(y0)} Q ${f1(mx + (cx - mx) * pull)} ${f1(my + (cy - my) * pull)} ${f1(x1)} ${f1(y1)}" pathLength="1"/>`);
  }
  return `<g class="mo-web">${lines.join('')}${arcs.join('')}</g>`;
}

/** A small spider seen from the front, hanging head down: 34 px. Drawn around (0, 0) = where the thread ends. */
function spider() {
  const leg = (s: number, a: number, b: number) => `<path d="M ${4 * s} ${8 + a} q ${9 * s} ${-9 + b} ${15 * s} ${4 + b * 1.6}"/>`;
  return `<g fill="none" stroke="#17120e" stroke-width="1.5" stroke-linecap="round">${[-1, 1].map(s => [leg(s, 0, -6), leg(s, 3, -1), leg(s, 6, 4), leg(s, 9, 9)].join('')).join('')}</g>
    <ellipse cx="0" cy="9" rx="7.5" ry="9.5" fill="#17120e"/><circle cx="0" cy="21" r="4.6" fill="#17120e"/>`;
}

export function reelShelfMotion(v: Variant, spec: ReelShelfSpec): Motion {
  const key = 'reel-shelf';
  const s = spec.s, T = times(), DURATION = T.end;
  const navy = GROUNDS.navy, coral = GROUNDS.coral;
  const logo = logoExit({ cx: CX, cy: 398, width: 200 });
  const hero = spec.boxes[0];
  const useFrames = spec.frames.length > 8;

  // ---- the shelf scene
  const plateImg = (id: string, src: string) => `<img class="mo-plate" id="${id}" src="${src}" alt="">`;
  const plates = useFrames
    ? spec.frames.map((f, i) => `<img class="mo-plate mo-fr" data-i="${i}" src="${f}" alt=""${i ? ' style="visibility:hidden"' : ''}>`).join('')
    : plateImg('p-clean', spec.plates.clean) + plateImg('p-dusty', spec.plates.dusty) + (spec.plates.old ? plateImg('p-old', spec.plates.old) : '');
  const boxes = spec.boxes.map((b, i) => `<div class="mo-bx" style="left:${f1(X(b.slot.x))}px; top:${f1(Y(b.slot.y))}px; width:${f1(b.slot.w * K)}px; height:${f1(b.slot.h * K)}px">
      <img src="${b.p.img}" alt=""><i class="mo-dust"></i></div>`).join('');
  // cobwebs in front of the boxes, in the upper corners of four cubbies of rows 2 and 3
  const cub = (i: number) => ({ x0: X(CUBBIES[i].x), x1: X(CUBBIES[i].x + CUBBIES[i].w), y0: Y(CUBBIES[i].y) });
  const webs = [
    web(cub(3).x0, cub(3).y0 + 4, 1, 1, 150, 11), web(cub(4).x1, cub(4).y0 + 4, -1, 1, 120, 23), web(cub(5).x1 - 6, cub(5).y0 + 4, -1, 1, 165, 37),
    web(cub(6).x1, cub(6).y0 + 4, -1, 1, 130, 41), web(cub(7).x0, cub(7).y0 + 4, 1, 1, 105, 53), web(cub(8).x0, cub(8).y0 + 4, 1, 1, 140, 67),
  ].join('');
  // the spider lowers itself in front of the hero box (from the top of its cubby)
  const sp = { x: X(hero.slot.x + hero.slot.w * 0.74), top: cub(4).y0, drop: (hero.slot.y - CUBBIES[4].y) * K + hero.slot.h * K * 0.42 };
  const spiderSvg = `<svg id="spwrap" width="80" height="${f1(sp.drop + 60)}" viewBox="-40 0 80 ${f1(sp.drop + 60)}" style="position:absolute; left:${f1(sp.x - 40)}px; top:${f1(sp.top)}px; overflow:hidden" aria-hidden="true">
      <g id="spider"><line x1="0" y1="${-sp.drop - 60}" x2="0" y2="0" stroke="rgba(236,236,230,0.7)" stroke-width="1.2"/>${spider()}</g></svg>`;
  const sticker = `<div id="sticker" data-qa-ignore style="left:${f1(X(hero.slot.x + hero.slot.w) - 62)}px; top:${f1(Y(hero.slot.y) - 52)}px"><span>NEW</span></div>`;
  const r = rng(7);
  const motes = [...Array(26)].map((_, i) => { const d = 3 + r() * 5; return `<i class="mo-mote" style="left:${f1(60 + r() * 700)}px; top:${f1(Y(40) + r() * 760)}px; width:${f1(d)}px; height:${f1(d)}px; opacity:${f1(0.35 + r() * 0.5)}" data-dx="${f1(30 + r() * 70)}" data-dy="${f1(-20 + r() * 70)}"></i>`; }).join('');
  const shelf = `<div class="mo-scene" id="shelf"><div id="cam">${plates}<div id="boxes">${boxes}</div>
      <svg id="webs" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true">${webs}</svg>${spiderSvg}${sticker}<div id="motes">${motes}</div><div id="night"></div></div></div>`;

  // ---- the wall of shelves
  const wall = `<div class="mo-scene" id="wall"><img id="wallimg" src="${spec.wall.img}" alt="" width="${spec.wall.w}" height="${spec.wall.h}"><img id="tile0" src="${spec.wall.tile0}" alt="" width="${spec.wall.tileW}" height="${spec.wall.tileH}"><div id="wfloor"></div></div>`;

  // ---- the museum
  const cv = MUS.canvas, mx = (x: number) => MUS.left + x * MUS.k, my = (y: number) => MUS.top + y * MUS.k;
  const cw = (cv.x1 - cv.x0) * MUS.k, ch = (cv.y1 - cv.y0) * MUS.k;
  const artW = cw - 44, artH = Math.min(ch - 44, artW / hero.p.ar);
  const plaqueTop = my(MUS.frameBottom) + 14;
  const museum = `<div class="mo-scene" id="museum"><div id="mcam">
      <img src="${spec.plates.museum}" alt="" style="position:absolute; left:${MUS.left}px; top:${MUS.top}px; width:${f1(PLATE.w * MUS.k)}px; height:${f1(PLATE.h * MUS.k)}px">
      <div class="mo-mat" style="left:${f1(mx(cv.x0))}px; top:${f1(my(cv.y0))}px; width:${f1(cw)}px; height:${f1(ch)}px">
        <img src="${hero.p.img}" alt="" style="width:${f1(artW)}px; height:${f1(artH)}px"><i></i></div>
      <div class="mo-plaque" data-qa-ignore style="left:${f1(CX - 290)}px; top:${f1(plaqueTop)}px; width:580px">
        <p><b>${h(hero.p.puzzle)}</b></p><p>${h(hero.p.brand)}, ${fmtInt(hero.p.pieces)} pieces</p><p><i>Please do not touch. Nobody does.</i></p></div>
    </div><div id="mglow"></div><div id="mdark"></div></div>`;

  // ---- the band and its texts
  const band = `<svg id="band" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM.splash)}" fill="${navy.bg}"/></svg>`;
  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mo-site" style="top:506px">myspeedpuzzling.com</p>
    <p class="mo-c mo-hook" style="top:574px">“I'll solve it</p>
    <p class="mo-c mo-hook" style="top:682px">this weekend.”</p>
    <p class="mo-c mo-sub" style="top:806px">Every puzzle collector, ever</p>
  </div>`;
  const lapse = `<div id="lapse">
    <p class="mo-day" style="top:438px">Day <span id="dayn">1</span></p>
    ${STOPS.map((st, i) => `<p class="mo-line mo-ex" id="ex${i}" style="top:566px">${h(st.line)}</p>`).join('')}
  </div>`;
  const wallText = `<div id="walltext">
    <div id="wa"><p class="mo-line" style="top:420px">The biggest pile?</p>
      <p class="mo-num" style="top:508px"><span id="wn">${fmtInt(s.big.unsolved)}</span> puzzles</p></div>
    <div id="wb"><p class="mo-line" style="top:436px">${fmtInt(s.big.days)} days of puzzling.</p>
      <p class="mo-line hot" style="top:548px; font-size:54px">Non-stop. Snacks not included.</p></div>
  </div>`;
  const musText = `<div id="mustext">
    <div id="mq"><p class="mo-line" style="top:404px; font-size:66px">The most avoided puzzle</p><p class="mo-line" style="top:482px; font-size:66px">of them all?</p></div>
    <div id="mr"><p class="mo-line hot" id="mname" style="top:398px; font-size:98px">${h(hero.p.puzzle)}</p>
      <p class="mo-sub2" id="msub" style="top:514px">${fmtInt(hero.p.unsolved)} of its ${fmtInt(hero.p.owners)} owners haven't solved it.</p></div>
  </div>`;
  const send = `<div id="send">
    <p class="mo-line" style="top:436px">Send this to someone</p>
    <p class="mo-line hot" style="top:540px; font-size:66px">who said “this weekend”.</p>
  </div>`;
  const pctN = Math.round(s.pct);
  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM.poster)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <header class="h-head" style="top:296px">${pieceMark('var(--g-device)')}<span class="h-kick">Did you know · collections</span><span style="margin-left:auto">${outlinedLogo(96).replace('.svg"', '.svg?poster"')}</span></header>
      <p class="h-src h-abs" style="top:388px">${siteLine(`Collections · data ${spec.queriedAt.slice(0, 10)}`)}</p>
      <p class="h-big" data-qa-bleed style="position:absolute; left:${X0 - 14}px; top:470px; font-size:400px"><span id="pn">${pctN}</span><span style="font-size:0.56em">%</span></p>
      <p class="h-abs h-lead" style="top:930px; width:${RW}px; font-size:52px">of the puzzles in collections on MySpeedPuzzling have never been solved.</p>
    </div>
  </div>`;

  const body = `${shelf}${wall}${museum}${band}${splash}${lapse}${wallText}${musText}${send}${poster}`;

  const css = LOGO_CSS + `
#wall, #museum, #lapse, #walltext, #wb, #mustext, #mr, #send, #poster, #ptext { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; z-index: 4; }
.mo-scene { position: absolute; inset: 0; overflow: hidden; background: #141922; z-index: 1; }
#band { position: absolute; left: 0; top: 0; z-index: 3; }
#slogo, #splash, #lapse, #walltext, #mustext, #send { position: absolute; inset: 0; z-index: 4; }
#slogo { z-index: 5; }
#cam, #mcam { position: absolute; inset: 0; transform-origin: 50% 70%; }
.mo-plate { position: absolute; left: 0; top: ${f1(PT)}px; width: ${W}px; height: ${f1(PLATE.h * K)}px; }
#p-dusty, #p-old { opacity: 0; }
.mo-bx { position: absolute; border-radius: 3px; box-shadow: 0 12px 22px rgba(10, 14, 22, 0.55); overflow: hidden; }
.mo-bx img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.mo-dust { position: absolute; inset: 0; opacity: 0; background: linear-gradient(180deg, rgba(200, 194, 182, 0.66) 0, rgba(200, 194, 182, 0.24) 20%, rgba(120, 110, 95, 0.16) 60%, rgba(40, 32, 24, 0.34) 100%); }
#webs { position: absolute; left: 0; top: 0; }
.mo-web { opacity: 0; fill: none; stroke: ${C.web}; stroke-width: 1; stroke-linecap: round; }
.mo-web path { stroke-dasharray: 1 1; stroke-dashoffset: 1; }
#sticker { position: absolute; width: 112px; height: 112px; border-radius: 50%; background: ${C.coral}; box-shadow: 0 6px 14px rgba(10, 14, 22, 0.5); transform: rotate(12deg); display: flex; align-items: center; justify-content: center; }
#sticker::before { content: ''; position: absolute; inset: 7px; border-radius: 50%; border: 2px dashed rgba(34, 42, 56, 0.55); }
#sticker span { font-size: 34px; font-weight: 800; letter-spacing: 0.04em; color: #222a38; line-height: 1; }
#motes { position: absolute; inset: 0; opacity: 0; }
.mo-mote { position: absolute; border-radius: 50%; background: rgba(255, 244, 226, 0.6); }
#night { position: absolute; inset: 0; background: #070b16; opacity: 0; }
#wfloor { position: absolute; left: 0; right: 0; top: 1920px; height: 400px; background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0, rgba(0, 0, 0, 0) 60px), repeating-linear-gradient(90deg, #4b3524 0 214px, #35251a 214px 217px); }
#wallimg, #tile0 { position: absolute; left: 0; top: 0; transform-origin: 0 0; max-width: none; }
.mo-mat { position: absolute; background: #cfc5ab; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 34px rgba(40, 30, 14, 0.75); }
.mo-mat img { filter: sepia(0.28) saturate(0.86) brightness(0.93); box-shadow: 0 2px 10px rgba(30, 20, 8, 0.6); }
.mo-mat i { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(190, 184, 170, 0.34) 0, rgba(190, 184, 170, 0.05) 30%, rgba(30, 22, 12, 0.22) 100%); }
.mo-plaque { position: absolute; padding: 12px 18px 14px; background: linear-gradient(180deg, #e9dfc3, #d8cba6); border: 3px solid #8a6f2c; border-radius: 4px; box-shadow: 0 8px 18px rgba(0, 0, 0, 0.55); text-align: center; color: #2a2318; }
.mo-plaque p { font-size: 30px; line-height: 1.22; font-weight: 500; white-space: nowrap; }
.mo-plaque b { font-size: 36px; font-weight: 800; }
#mdark { position: absolute; inset: 0; background: #05070c; opacity: 0.8; }
#mglow { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse 520px 760px at 50% ${f1(my(150))}px, rgba(255, 214, 140, 0.34), rgba(255, 214, 140, 0) 70%); mix-blend-mode: screen; }
.mo-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.mo-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.mo-hook { font-size: 104px; color: var(--g-hot); }
.mo-sub { font-size: 50px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.mo-line { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 76px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; color: var(--g-ink); white-space: nowrap; }
.mo-line.hot { color: var(--g-hot); }
.mo-ex { visibility: hidden; opacity: 0; }
.mo-day { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 104px; font-weight: 800; line-height: 1; letter-spacing: 0.02em; text-transform: uppercase; color: var(--g-hot); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mo-num { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 112px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; color: var(--g-hot); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mo-num span { display: inline-block; min-width: 1.86em; text-align: right; }
.mo-sub2 { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 41px; font-weight: 500; color: var(--g-soft); white-space: nowrap; }
#poster { position: absolute; inset: 0; z-index: 7; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Did you know · the pile of shame', device: v.device, src: '', rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';
const clamp = v => Math.max(0, Math.min(1, v));

// ---- the age of the shelf: one number drives the plates (or the generated frames), the dust on the boxes, the webs
const frames = [...document.querySelectorAll('.mo-fr')];
const webPaths = [...document.querySelectorAll('.mo-web')].map(g => [...g.querySelectorAll('path')]);
const age = { a: 0 };
let shownFrame = 0;
function applyAge() {
  const a = age.a;
  if (frames.length) {
    const i = Math.round(a * (frames.length - 1));
    if (i !== shownFrame) { frames[shownFrame].style.visibility = 'hidden'; frames[i].style.visibility = 'visible'; shownFrame = i; }
  } else if (D.old) {
    gsap.set('#p-dusty', { opacity: clamp(a / 0.6) });
    gsap.set('#p-old', { opacity: clamp((a - 0.5) / 0.5) });
  } else gsap.set('#p-dusty', { opacity: clamp(a) });
  gsap.set('.mo-dust', { opacity: clamp(a * 1.05) });
  gsap.set('.mo-bx img', { filter: 'saturate(' + (1 - 0.34 * a).toFixed(3) + ') brightness(' + (1 - 0.16 * a).toFixed(3) + ')' });
  gsap.set('#motes', { opacity: clamp((a - 0.1) * 1.4) });
  webPaths.forEach((ps, w) => {
    const g = clamp((a - 0.4 - w * 0.035) / 0.42);
    gsap.set(ps[0].parentNode, { opacity: g > 0 ? 1 : 0 });
    ps.forEach((p, i) => p.style.strokeDashoffset = String(1 - clamp(g * 1.8 - (i / ps.length) * 0.8)));
  });
}
applyAge();
const ageTo = (to, at, dur, ease) => tl.to(age, { a: to, duration: dur, ease: ease || 'power1.inOut', onUpdate: applyAge }, at);
const dayEl = document.getElementById('dayn');
const day = { v: 1 };
const showDay = () => { dayEl.textContent = fmtN(day.v); };
const dayTo = (to, at, dur) => tl.to(day, { v: to, duration: dur, ease: 'power2.in', onUpdate: showDay, onComplete: showDay }, at);
// days and nights flicker by while the counter runs
const flicker = (at, dur, n) => tl.fromTo('#night', { opacity: 0 }, { opacity: 0.5, duration: dur / (2 * n), repeat: 2 * n - 1, yoyo: true, ease: 'sine.inOut', immediateRender: false }, at);

// ---- frame 0: the splash over the new shelf (shelf lower, band tall)
gsap.set('#cam', { y: D.splashDy });
gsap.set('#spider', { y: -50 });
tl.fromTo('#sticker', { scale: 1 }, { scale: 1.12, duration: 0.45, repeat: 3, yoyo: true, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.3);

// ---- the splash leaves: logo exit, lines lift, the band lifts, the shelf moves up
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
tl.to('#band', { y: D.bandY, duration: 0.45, ease: 'power3.inOut' }, T.splashOut + 0.1);
tl.to('#cam', { y: 0, duration: 0.45, ease: 'power3.inOut' }, T.splashOut + 0.1);
show(MAST, T.splashOut + 0.55);
show('#lapse', T.splashOut + 0.5, 0.01);
riseIn('.mo-day', T.splashOut + 0.5, { dur: 0.3 });

// ---- the time-lapse: a slow push-in over all of it; per stop: the counter runs, days flicker, the shelf ages, then the excuse
tl.fromTo('#cam', { scale: 1 }, { scale: 1.07, duration: T.tlEnd - T.tl0, ease: 'none', immediateRender: false }, T.tl0);
document.querySelectorAll('.mo-mote').forEach(m => tl.to(m, { x: Number(m.dataset.dx), y: Number(m.dataset.dy), duration: T.tlEnd - T.tl0 + 6, ease: 'none' }, T.tl0));
D.stops.forEach((st, i) => {
  const at = T.tl0 + i * D.stage;
  if (i) hide('#ex' + (i - 1), at, 0.15);
  dayTo(st.day, at + 0.05, D.tick);
  flicker(at + 0.05, D.tick, i < 2 ? 2 : 3);
  ageTo(st.age, at + 0.05, D.tick + 0.25);
  tl.set('#ex' + i, { visibility: 'visible' }, at + D.tick - 0.1);
  riseIn('#ex' + i, at + D.tick - 0.1, { dur: 0.3 });
});
// DAY 60: the NEW sticker lets go
const stickAt = T.tl0 + D.stage + 0.25;
tl.to('#sticker', { rotation: -6, duration: 0.25, ease: 'sine.inOut' }, stickAt);
tl.to('#sticker', { rotation: 24, duration: 0.25, ease: 'sine.inOut' }, stickAt + 0.25);
tl.to('#sticker', { y: 560, x: -40, rotation: 130, duration: 0.8, ease: 'power2.in' }, stickAt + 0.5);
tl.to('#sticker', { autoAlpha: 0, duration: 0.2 }, stickAt + 1.15);
// DAY 1460: the spider moves in, and bobs on its thread
const spAt = T.tl0 + 3 * D.stage + 0.5;
tl.to('#spider', { y: D.drop, duration: 1.5, ease: 'power1.out' }, spAt);
const bobs = 2 * Math.floor((T.loop - spAt - 1.5) / 2.2);
tl.to('#spider', { y: D.drop - 16, duration: 1.1, repeat: bobs - 1, yoyo: true, ease: 'sine.inOut' }, spAt + 1.5);

// ---- poster: the number (the dusty shelf stays under its seam)
hide('#lapse', T.poster - 0.15, 0.15);
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM.poster + 140} }, { y: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.poster);
tl.set(MAST, { autoAlpha: 0 }, T.poster + 0.28);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.3);
countUp('#pn', D.pct, T.poster + 0.32, 1.3);
riseIn('#ptext .h-lead', T.poster + 0.9, { dur: 0.35 });
// under the poster: swap the shelf for the wall, zoomed in on its centre shelf
tl.set('#shelf', { autoAlpha: 0 }, T.posterOut - 0.3);
tl.set('#wall', { autoAlpha: 1 }, T.posterOut - 0.3);
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.set(MAST, { autoAlpha: 1 }, T.posterOut + 0.15);
tl.to('#poster', { y: -${SEAM.poster + 140}, duration: 0.38, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.49);

// ---- the wall: pull back from one shelf to all of them; the counter ticks with it
const zoom = { p: 0, q: 0 };
const wallEl = document.getElementById('wallimg'), tileEl = document.getElementById('tile0'), floorEl = document.getElementById('wfloor');
function applyZoom() {
  const g = D.wall, p = zoom.p;
  const w = g.w0 * Math.pow(g.w1 / g.w0, p);                 // on-screen width of one shelf
  const th = g.th * (w / g.tile);                             // and its height
  const ax = g.ax0 + (g.ax1 - g.ax0) * p;                     // centre x of the shelf the camera starts on
  const top = g.top0 + (g.top1 - g.top0) * p - zoom.q * g.pan;
  const left = ax - (g.start + 0.5) * w;
  wallEl.style.transform = 'translate(' + left.toFixed(2) + 'px,' + top.toFixed(2) + 'px) scale(' + (w / g.tile).toFixed(5) + ')';
  tileEl.style.transform = 'translate(' + (ax - w / 2).toFixed(2) + 'px,' + top.toFixed(2) + 'px) scale(' + (w / g.tileW).toFixed(5) + ')';
  tileEl.style.opacity = String(clamp((w - 420) / 300));
  floorEl.style.transform = 'translateY(' + (top + g.rows * th - 1920).toFixed(2) + 'px)';
}
applyZoom();
show('#walltext', T.wall, 0.01);
riseIn('#wa .mo-line', T.wall, { dur: 0.35 });
tl.fromTo('#wa .mo-num', { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, T.wall + 0.6);
tl.to(zoom, { p: 1, duration: 1.5, ease: 'power2.inOut', onUpdate: applyZoom }, T.wall + 0.6);
tl.to(zoom, { q: 1, duration: 3.0, ease: 'sine.inOut', onUpdate: applyZoom }, T.wall + 1.9);
const wn = { v: 12 }, wnEl = document.getElementById('wn');
const showWn = () => { wnEl.textContent = fmtN(wn.v); };
showWn();
tl.to(wn, { v: 150, duration: 1.3, ease: 'power2.in', onUpdate: showWn }, T.wall + 0.6);
tl.to(wn, { v: D.big, duration: 3.0, ease: 'sine.inOut', onUpdate: showWn, onComplete: showWn }, T.wall + 1.9);
flash('#wa .mo-num', T.wall + 4.95);
hide('#wa', T.wallB - 0.2, 0.2);
tl.fromTo('#wall', { scale: 1 }, { scale: 1.14, transformOrigin: '80% 78%', duration: T.mus - T.wallB + 0.3, ease: 'sine.inOut', immediateRender: false }, T.wallB - 0.3);
tl.set('#wb', { autoAlpha: 1 }, T.wallB);
riseIn('#wb > *', T.wallB, { stagger: 0.9, dur: 0.35 });

// ---- the museum: dark, the question; the picture light flickers on; the name
hide('#walltext', T.mus - 0.2, 0.2);
tl.set('#wall', { autoAlpha: 0 }, T.mus);
tl.set('#museum', { autoAlpha: 1 }, T.mus);
tl.to('#band', { y: D.bandMus, duration: 0.3, ease: 'power2.inOut' }, T.mus - 0.1);
show('#mustext', T.mus, 0.01);
hide('.hf > .h-src', T.mus - 0.1, 0.1);
riseIn('#mq > *', T.mus + 0.1, { stagger: 0.12, dur: 0.35 });
tl.fromTo('#mcam', { scale: 1 }, { scale: 1.06, duration: T.send - T.mus, ease: 'none', immediateRender: false }, T.mus);
tl.to('#mdark', { opacity: 0.25, duration: 0.06 }, T.light);
tl.to('#mdark', { opacity: 0.8, duration: 0.06 }, T.light + 0.1);
tl.to('#mdark', { opacity: 0.2, duration: 0.06 }, T.light + 0.26);
tl.to('#mdark', { opacity: 0.7, duration: 0.05 }, T.light + 0.36);
tl.to('#mdark', { opacity: 0, duration: 0.25 }, T.light + 0.5);
tl.to('#mglow', { opacity: 1, duration: 0.25 }, T.light + 0.5);
hide('#mq', T.light + 0.35, 0.2);
tl.set('#mr', { autoAlpha: 1 }, T.light + 0.6);
tl.fromTo('#mname', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: true }, T.light + 0.6);
tl.fromTo('#msub', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', immediateRender: true }, T.light + 1.9);

// ---- send: back at the old shelf
hide('#mustext', T.send - 0.2, 0.2);
tl.set('#museum', { autoAlpha: 0 }, T.send);
tl.set('#shelf', { autoAlpha: 1 }, T.send);
tl.set('#cam', { scale: 1.07 }, T.send);
tl.to('#band', { y: D.bandY, duration: 0.3, ease: 'power2.inOut' }, T.send - 0.1);
show('#send', T.send, 0.01);
show('.hf > .h-src', T.send, 0.2);
riseIn('#send > *', T.send + 0.05, { stagger: 0.5, dur: 0.35 });

// ---- loop: time rewinds, the splash returns (= frame 0)
hide(['#send', MAST], T.loop, 0.2);
ageTo(0, T.loop + 0.05, 0.6, 'power2.inOut');
flicker(T.loop + 0.05, 0.6, 2);
tl.to('#spider', { y: -50, duration: 0.35, ease: 'power2.in' }, T.loop + 0.05);
tl.set('#sticker', { x: 0, y: 0, rotation: 12 }, T.loop + 0.4);
tl.fromTo('#sticker', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, T.loop + 0.45);
tl.to('#band', { y: 0, duration: 0.4, ease: 'power3.inOut' }, T.loop + 0.2);
tl.to('#cam', { y: D.splashDy, scale: 1, duration: 0.4, ease: 'power3.inOut' }, T.loop + 0.2);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.35)}
tl.set({}, {}, ${DURATION});
`;
  const th240 = spec.wall.h / spec.wall.rows, w1 = W / WALL.cols, wallTop1 = 610, wallBottom = 1650;
  const data = {
    T, stops: STOPS, stage: STAGE, tick: TICK, old: !!spec.plates.old, splashDy: SPLASH_DY, drop: sp.drop,
    bandY: SEAM.band - SEAM.splash, bandMus: SEAM.museum - SEAM.splash, pct: pctN, big: s.big.unsolved,
    wall: { tile: WALL.tile, start: WALL.start, rows: spec.wall.rows, th: th240, tileW: spec.wall.tileW, w0: W, w1, ax0: W / 2, ax1: (WALL.start + 0.5) * w1, top0: 560, top1: wallTop1,
      pan: spec.wall.rows * th240 * (w1 / WALL.tile) - (wallBottom - wallTop1) },
  };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.5, ...STOPS.map((_, i) => T.tl0 + i * STAGE + 1.9), T.tlEnd - 0.2, T.poster + 2.4, T.wall + 0.5, T.wall + 1.6, T.wall + 3.4, T.wall + 5.6, T.wallB + 2.5, T.mus + 1.5, T.light + 1.2, T.light + 3.5, T.send + 2.5, DURATION - 0.05],
    html: composition({ key, title: 'Reel This weekend (pile of shame)', duration: DURATION, frameHtml, css, data, script }),
  };
}
