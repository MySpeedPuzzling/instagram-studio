// Reel "A 1000 isn't twice a 500", prototype v2, round 3 (owner 2026-10-21 after v1: "text flows too fast", "better animation
// for the puzzle, definitive", "better splash", "our logo animated", "pieces really flowing in"). ~36 s, every text
// beat holds ~3–4 s so it can be read without pausing.
//   0.0–2.4   splash, complete from frame 0: the MSP logo (settled), myspeedpuzzling.com, the hook "Twice the pieces,
//             so twice the time?" / "500 vs 1000 piece puzzles" over two giant interlocking pieces (500 and 1000 pictures)
//   2.4–3.2   it all leaves: the logo plays "Tick out", the lines lift away, the giant pieces tear apart
//   3.2–9.6   the race at the typical (median) solo pace, 5.5 s: boards of generator pieces carrying the box pictures
//             assemble, edges first; a different 500 each lap. After two 500s: "the 1000 was only 66 % done" (the main
//             point: not 2× as you'd expect, but 3×)
//   9.6–12.4  coral poster: "You'd expect 2×" → 3×
//   12.8–16.2 why: each piece takes longer (seconds per piece), 2 × 1.5 = 3
//   16.5–20.7 every pace    21.0–24.4 the fastest    24.7–29.3 the send: "Starting a 1000? Plan for three 500s."
//   29.3–30.4 loop: the shelf empties, the giant pieces rebuild, the lines return, the logo plays its exit in reverse
// One drawn piece stands for about ten real ones (48 vs 96 drawn pieces: the same size, so the 1000 board has twice
// the area). Text only in the Reel safe area (x 60–960, y 220–1250); below it only the shelf.
import { GROUNDS, W, X0, clock, f1, frame, groundVars, hero, heroFit, outlinedLogo, pieceMark, posterTopPath, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import type { Reel1000Spec } from './reel-1000.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
// Race 5.5 s and tighter holds (owner 2026-10-21, round 3: "way too much waiting"; v2 had a 9 s race, round 2 7.5 s).
// Round 5: frame 0 is the complete splash with the logo already in place; it animates out (owner: "the splash screen
// with the logo already there with all the info", then out instead of in-out, to make it faster).
// Round 6 (viral cut): the question is the splash headline, so the race starts right after it; the same-puzzlers
// check moved to the caption; the end asks for a send.
const T = { splashOut: 2.4, race: 3.2, raceDur: 5.5, poster: 9.6, posterOut: 12.4, why: 12.8, pace: 16.5, fast: 21.0, ask: 24.7, loop: 29.3 } as const;
const DURATION = 30.4;  // end card 4.6 s: the send ask is read in one pass (RC review)
const SEAM = 1262;
/** Drawn piece size and the boards (local coordinates start at 0,0; placed at x/y). */
const PC = 40;
const B5 = { cols: 8, rows: 6, x: 96, y: 830 }, B10 = { cols: 12, rows: 8, x: 480, y: 830 };
const bw = (b: typeof B5) => b.cols * PC, bh = (b: typeof B5) => b.rows * PC;
B5.y = B10.y + bh(B10) - bh(B5); // bottoms aligned
/** Shelf slots (below the text area): the three 500s as a pyramid on the left (two side by side, the third on top;
 *  owner 2026-10-21), the 1000 on the right, bottoms aligned. */
const S5 = (i: number) => ({ x: [99, 319, 209][i], y: i < 2 ? 1700 : 1532, w: 208, h: 156 });
const S10 = { x: 579, y: 1587, w: 403, h: 269 };
const t = (s: number) => fmtDuration(s / 60);
const x = (r: number) => `${r.toFixed(1)}×`;

/** Deterministic PRNG (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let q = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q;
    return ((q ^ (q >>> 14)) >>> 0) / 4294967296;
  };
}

/** One board: an absolutely placed SVG of generator pieces filled with the box picture (a pattern in the board's
 *  user space, so each piece carries its part of the picture wherever it flies). Ghost slots optional. */
function board(id: string, b: typeof B5, img: string, seed: number, o: { ghost?: boolean; place?: { x: number; y: number; w: number; h: number } } = {}) {
  const w = bw(b), hh = bh(b);
  const jig = generateJigsaw({ cols: b.cols, rows: b.rows, width: w, height: hh, seed, tabSize: 0.24, jitter: 0.04 });
  const r = rng(seed * 7 + 3);
  const edge = jig.pieces.filter(p => p.row === 0 || p.col === 0 || p.row === b.rows - 1 || p.col === b.cols - 1);
  const inner = jig.pieces.filter(p => !edge.includes(p));
  const shuffle = <T,>(a: T[]) => a.map(v => [r(), v] as const).sort((p, q) => p[0] - q[0]).map(([, v]) => v);
  const order = [...shuffle(edge), ...shuffle(inner)];
  const at = o.place ?? { x: b.x, y: b.y, w, h: hh };
  const scale = at.w / w;
  const pieces = order.map((p, i) => {
    // start below the frame, spread sideways, spun
    const absY = at.y + p.bbox.y * scale;
    return { i, d: p.d, dx: f1((r() - 0.5) * 900), dy: f1((1980 - absY + r() * 260) / scale), rot: f1((r() - 0.5) * 300) };
  });
  const svg = `<svg class="mo-board" id="${id}" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" style="left:${b.x}px; top:${b.y}px" aria-hidden="true">
    <defs><pattern id="${id}-img" patternUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${hh}"><image href="${img}" x="0" y="0" width="${w}" height="${hh}" preserveAspectRatio="xMidYMid slice"/></pattern></defs>
    ${o.ghost ? jig.pieces.map(p => `<path class="mo-ghost" d="${p.d}"/>`).join('') : ''}
    ${pieces.map(p => `<path class="mo-pc" id="${id}-${p.i}" d="${p.d}" fill="url(#${id}-img)"/>`).join('')}
  </svg>`;
  return { svg, pieces: pieces.map(({ i, dx, dy, rot }) => ({ i, dx, dy, rot })), rect: { x: b.x, y: b.y, w, h: hh } };
}

/**
 * The splash artwork: two giant interlocking generator pieces (the middle row of a 4×3 jigsaw, so both have knobs on
 * every side), the left carrying the 500's picture, the right the 1000's. Each giant piece is itself cut into small
 * generator pieces (clipped to the giant outline, the clip moving with each small piece) so it can tear apart.
 */
function giants(img5: string, img10: string) {
  const S = 370, jig = generateJigsaw({ cols: 4, rows: 3, width: S * 4, height: S * 3, seed: 7, tabSize: 0.26, jitter: 0.03 });
  const pair = [1, 2].map(c => jig.pieces.find(p => p.row === 1 && p.col === c)!);
  const dx = 540 - S * 2, dy = 1440 - S * 1.5;
  let n = 0;
  const parts = pair.map((g, k) => {
    const b = g.bbox, img = k ? img10 : img5, id = `gi${k}`;
    const cols = 6, rows = 6;
    const small = generateJigsaw({ cols, rows, width: b.width, height: b.height, x: b.x, y: b.y, seed: 31 + k, tabSize: 0.24, jitter: 0.04 });
    const cx = S * 2, cy = S * 1.5;
    const bits = small.pieces.map(p => {
      const px = p.bbox.x + p.bbox.width / 2 - cx, py = p.bbox.y + p.bbox.height / 2 - cy, len = Math.hypot(px, py) || 1;
      const r = 520 + ((n * 97) % 380);
      return { id: `gp${n++}`, d: p.d, dx: f1(px / len * r), dy: f1(py / len * r - 260), rot: f1(((n * 53) % 300) - 150), dist: len };
    });
    const svg = `<defs><clipPath id="${id}-clip"><path d="${g.d}"/></clipPath>
      <pattern id="${id}-img" patternUnits="userSpaceOnUse" x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}"><image href="${img}" width="${f1(b.width)}" height="${f1(b.height)}" preserveAspectRatio="xMidYMid slice"/></pattern></defs>
      ${bits.map(t => `<path class="mo-gp" id="${t.id}" d="${t.d}" fill="url(#${id}-img)" clip-path="url(#${id}-clip)"/>`).join('')}
      <path class="mo-gout" d="${g.d}"/>`;
    return { svg, bits };
  });
  const bits = parts.flatMap(p => p.bits).sort((a, b) => a.dist - b.dist).map(({ id, dx, dy, rot }) => ({ id, dx, dy, rot }));
  return {
    html: `<svg id="giants" width="${S * 4}" height="${S * 3}" viewBox="0 0 ${S * 4} ${S * 3}" style="position:absolute; left:${dx}px; top:${dy}px; overflow:visible" aria-hidden="true">${parts.map(p => p.svg).join('')}</svg>`,
    bits,
  };
}

export function reel1000V2Motion(v: Variant, s: Reel1000Spec): Motion {
  const key = 'reel-1000-v2';
  const coral = GROUNDS.coral;
  const r50 = s.s1000.p50 / s.s500.p50;
  const lapDur = T.raceDur * (s.s500.p50 / s.s1000.p50);
  const per5 = s.s500.p50 / 500, per10 = s.s1000.p50 / 1000;

  // ---------------------------------------------------------------- boards
  // one different 500 per lap (owner: not the same picture three times)
  const pics500 = [s.box500, ...(s.more500 ?? [])];
  const laps = [0, 1, 2].map(i => board(`l5-${i}`, B5, pics500[i % pics500.length].img, 11 + i));
  const b1000 = board('l10', B10, s.box1000.img, 21);
  const ghosts = `<div id="ghosts">${board('g5', B5, s.box500.img, 11, { ghost: true }).svg.replace(/<path class="mo-pc"[^>]*>/g, '')}${board('g10', B10, s.box1000.img, 21, { ghost: true }).svg.replace(/<path class="mo-pc"[^>]*>/g, '')}</div>`;
  const gi = giants(s.box500.img, s.box1000.img);

  // ---------------------------------------------------------------- splash
  // "piece puzzles" puts the word puzzle on the first frame (owner: it must read as puzzles at first sight); the
  // giant pieces below carry the two pictures, 500 left and 1000 right, in the order of the line above them.
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  const brands = s.box500.brand === s.box1000.brand ? s.box500.brand : `${s.box500.brand}, ${s.box1000.brand}`;
  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mo-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="mo-c mo-hook" style="top:596px">Twice the pieces,</p>
    <p class="mo-c mo-hook hot" style="top:700px">so twice the time?</p>
    <p class="mo-c mo-sub" style="top:832px">500 vs 1000 piece puzzles</p>
    <p class="h-abs h-credit mo-cc" style="top:930px; width:${RW}px">${h(brands)} puzzles</p>
  </div>`;

  // ---------------------------------------------------------------- question
  // ---------------------------------------------------------------- race
  const clockSize = heroFit(t(s.s1000.p50), 150, RW);
  const race = `<div id="race">
    <p class="h-abs h-cap" style="top:470px">Typical solo time</p>
    ${hero('0:00', { size: clockSize, baseline: 516 + clockSize * 0.82, extra: 'width:880px' }).replace('<p class="h-big"', '<p class="h-big" id="clock"')}
    <p class="mo-lab" style="left:${B5.x}px; top:1160px"><b>500 pieces</b> <span id="n5"></span></p>
    <p class="mo-lab" style="left:${B10.x}px; top:1160px"><b>1000 pieces</b> <span id="n10"></span></p>
    <p class="h-abs mo-exp" id="exp" style="top:690px; width:${RW}px"></p>
  </div>`;
  const credit = `<p class="h-abs h-credit" id="credit" style="top:1210px; width:${RW}px">Pictures: ${h(s.box500.brand === s.box1000.brand ? `${s.box500.brand} puzzles` : `${s.box500.brand}, ${s.box1000.brand}`)} · 1 drawn piece ≈ 10 real</p>`;

  // ---------------------------------------------------------------- poster
  const big = x(r50).replace('.0×', '×');
  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <header class="h-head" style="top:296px">${pieceMark('var(--g-device)')}<span class="h-kick">Did you know · solo times</span><span style="margin-left:auto">${outlinedLogo(96).replace('.svg"', '.svg?poster"')}</span></header>
      <p class="h-abs h-cap" style="top:470px">You'd expect 2×</p>
      ${hero(big, { size: 420, baseline: 900 })}
      <p class="h-abs h-lead" style="top:960px; width:${RW}px">A 1000 takes as long as three 500s: <b>${t(s.s1000.p50)}</b> vs <b>${t(s.s500.p50)}</b>.</p>
    </div>
  </div>`;

  // ---------------------------------------------------------------- why: seconds per piece
  const why = `<div id="why">
    <p class="h-abs h-cap" style="top:470px">Why 3×? Every piece takes longer</p>
    <div class="h-abs mo-pair" style="top:530px; width:${RW}px">
      <div><p class="h-lab">On a 500, a piece every</p><p class="h-big" style="font-size:120px">${per5.toFixed(1)}<span class="mo-u"> s</span></p></div>
      <div><p class="h-lab">On a 1000, a piece every</p><p class="h-big hot" style="font-size:120px">${per10.toFixed(1)}<span class="mo-u"> s</span></p></div>
    </div>
    <p class="h-abs h-lead" style="top:760px; width:${RW}px">Twice the pieces, and each one takes ${x(per10 / per5)} as long to find.</p>
    <p class="h-abs mo-eq" style="top:900px; width:${RW}px">2 × ${(per10 / per5).toFixed(1)} = <b>${(2 * per10 / per5).toFixed(1)}×</b></p>
  </div>`;

  // ---------------------------------------------------------------- every pace / fastest / same / ask
  const rows = [
    { k: 'Quicker quarter', a: s.s500.p25, b: s.s1000.p25 },
    { k: 'Typical', a: s.s500.p50, b: s.s1000.p50, hot: true },
    { k: 'Relaxed quarter', a: s.s500.p75, b: s.s1000.p75 },
  ];
  const pace = `<div id="pace">
    <p class="h-abs h-cap" style="top:470px">At every pace</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">It's about 3× for everyone</p>
    <div class="h-board mo-tab" style="top:640px; width:${RW}px">
      <div class="h-bh"><span class="k"></span><span class="a">500</span><span class="b">1000</span><span class="r"></span></div>
      ${rows.map(r => `<div class="h-br mo-row${r.hot ? ' hot' : ''}" style="height:104px"><span class="k">${r.k}</span><span class="a">${clock(t(r.a))}</span><span class="b">${clock(t(r.b))}</span><span class="r">${x(r.b / r.a)}</span></div>`).join('')}
    </div>
    <p class="h-abs h-lab" style="top:1030px; width:${RW}px">Quarters of all solo results: ${fmtInt(s.s500.results)} on 500s, ${fmtInt(s.s1000.results)} on 1000s.</p>
  </div>`;
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
  const ask = `<div id="ask">
    <p class="h-abs h-ask" style="top:520px; width:${RW}px">Starting a 1000? Plan for three 500s.</p>
    <p class="h-abs h-lead" style="top:780px; width:${RW}px">Send this to someone who's about to start one.</p>
    <p class="h-abs h-lead" style="top:940px; width:${RW}px; color:var(--g-soft)">Your own ratio: log both sizes on myspeedpuzzling.com</p>
  </div>`;

  const body = `${splash}${gi.html}${race}${ghosts}${laps.map(l => l.svg).join('')}${b1000.svg}${credit}${why}${pace}${fast}${ask}${poster}`;

  const css = LOGO_CSS + `
#race, #ghosts, #why, #pace, #fast, #ask, #poster, #ptext { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
.mo-board { position: absolute; overflow: visible; }
.mo-ghost { fill: var(--g-band); stroke: var(--g-bg); stroke-width: 2; }
.mo-pc { stroke: rgba(18, 24, 36, 0.55); stroke-width: 1.2; stroke-linejoin: round; }
#l5-0 .mo-pc, #l5-1 .mo-pc, #l5-2 .mo-pc, #l10 .mo-pc { opacity: 0; }
.mo-gp { stroke: rgba(18, 24, 36, 0.45); stroke-width: 1.2; stroke-linejoin: round; }
.mo-gout { fill: none; stroke: #ffffff; stroke-width: 5; stroke-linejoin: round; }
.mo-cc { text-align: center; }
#credit { visibility: hidden; opacity: 0; }
.mo-exp { font-size: 40px; font-weight: 700; color: var(--g-hot-text); }
.mo-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.mo-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.mo-hook { font-size: 92px; }
.mo-hook.hot { color: var(--g-hot); }
.mo-sub { font-size: 56px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.mo-lab { position: absolute; font-size: 34px; color: var(--g-soft); white-space: nowrap; }
.mo-lab b { color: var(--g-ink); }
.mo-lab span { font-weight: 700; color: var(--g-accent); }
.mo-pair { display: flex; gap: 40px; }
.mo-pair > div { flex: 1; }
.mo-pair .h-big { margin-top: 6px; }
.mo-u { font-size: 0.45em; letter-spacing: 0; }
.mo-eq { font-size: 72px; font-weight: 700; color: var(--g-soft); }
.mo-eq b { color: var(--g-hot); }
.mo-tab .h-bh > span, .mo-row > span { display: block; }
.mo-tab .k { flex: 1; }
.mo-tab .a, .mo-tab .b { width: 190px; text-align: right; }
.mo-tab .r { width: 140px; text-align: right; }
.mo-row .k { font-size: 36px; font-weight: 500; color: var(--g-ink); }
.mo-row .a, .mo-row .b { font-size: 38px; font-weight: 700; color: var(--g-ink); }
.mo-row .r { font-size: 38px; font-weight: 700; color: var(--g-accent); }
.mo-row.hot .r { color: var(--g-hot); }
#poster { position: absolute; inset: 0; z-index: 5; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Did you know · solo times', device: v.device, src: `Solo results · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T, $ = id => document.getElementById(id);
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';

// ---- the splash leaves: the logo plays its exit, the lines lift away (the giant pieces tear apart below)
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
show(MAST, T.splashOut + 0.68);  // after the logo's exit has cleared the masthead row

// ---- the giant pieces tear apart along their cuts, from the seam outwards, and the bits fly off and vanish
tl.to('.mo-gout', { opacity: 0, duration: 0.2 }, T.splashOut + 0.1);
D.gi.forEach((b, i) => tl.to('#' + b.id, { x: b.dx, y: b.dy, rotation: b.rot, opacity: 0, duration: 0.5, ease: 'power2.in' }, T.splashOut + 0.15 + i * 0.004));
show('#credit', T.splashOut + 0.2);

// ---- race
show(['#race', '#ghosts'], T.race - 0.15);  // the logo's exit has cleared the top by then
const clk = { v: 0 };
const showClk = () => {
  $('clock').innerHTML = fmtT(clk.v).replace(/:/g, '<span class="c">:</span>');
  const laps = Math.min(3, Math.floor(clk.v / D.m500 + 1e-9)), done = clk.v >= D.m1000 - 0.5;
  $('n5').textContent = laps ? laps + '× done' : '';
  const pct = Math.min(100, Math.floor(clk.v / D.m1000 * 100));
  $('n10').textContent = done ? 'done' : clk.v > 0 ? pct + ' %' : '';
  // the expectation (2×) against what happens: after two 500s the 1000 is only two-thirds done
  $('exp').textContent = done ? '3 × 500 ≈ one 1000' : laps >= 2 ? 'After two 500s, the 1000 was only ' + Math.floor(2 * D.m500 / D.m1000 * 100) + ' % done.' : '';
};
showClk();
tl.fromTo(clk, { v: 0 }, { v: D.m1000, duration: T.raceDur, ease: 'none', onUpdate: showClk, onComplete: showClk, onReverseComplete: showClk }, T.race);
const fly = (id, list, start, dur) => {
  const step = dur / list.length;
  list.forEach(p => tl.fromTo('#' + id + '-' + p.i, { x: p.dx, y: p.dy, rotation: p.rot, opacity: 1, transformOrigin: '50% 50%' },
    { x: 0, y: 0, rotation: 0, duration: 0.75, ease: 'power3.out', immediateRender: false }, start + (p.i + 1) * step - 0.75));
};
D.laps.forEach((l, i) => {
  const start = T.race + i * D.lapDur, end = start + D.lapDur;
  fly('l5-' + i, l, start, D.lapDur);
  // the finished 500 drops onto the shelf right away: the next one starts on the same spot
  moveTo('#l5-' + i, D.r5, D.s5[i], end + 0.1, 0.4);
});
fly('l10', D.l10, T.race, T.raceDur);
const fin = T.race + T.raceDur;
flash('#l10', fin + 0.05);
flash('#clock', fin);
hide('#ghosts', fin + 0.5);
moveTo('#l10', D.r10, D.s10, fin + 0.45, 0.5);
hide('#race', T.poster - 0.3);

// ---- poster: 3×
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.poster);
tl.set([MAST, '#credit'], { autoAlpha: 0 }, T.poster + 0.28);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.3);
popIn('#ptext .h-big', T.poster + 0.32, { from: '0% 80%', scale: 0.6 });
riseIn('#ptext .h-lead', T.poster + 0.55, { dur: 0.3 });
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.set([MAST, '#credit'], { autoAlpha: 1 }, T.posterOut + 0.15);
tl.to('#poster', { y: -${SEAM + 140}, duration: 0.38, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.49);

// ---- text beats, each held ~4 s
const beat = (id, at, out, extra) => { show('#' + id, at, 0.01); riseIn('#' + id + ' > *', at, { stagger: 0.15, dur: 0.35 }); if (extra) extra(at); hide('#' + id, out - 0.3); };
beat('why', T.why, T.pace);
beat('pace', T.pace, T.fast, at => riseIn('#pace .mo-row', at + 0.4, { stagger: 0.3, dur: 0.4 }));
beat('fast', T.fast, T.ask, at => { countUp('#f5', D.b500, at + 0.1, 1.2, fmtT); countUp('#f10', D.b1000, at + 0.3, 1.4, fmtT); popIn('#fr', at + 1.8, { from: '0% 80%' }); });
show('#ask', T.ask, 0.01);
riseIn('#ask > *', T.ask, { stagger: 0.3, dur: 0.35 });

// ---- loop: back to the splash (frame 0): the shelf empties, the bits fly back into the giant pieces, the lines
// drop back in and the logo plays its exit in reverse, ending settled
hide(['#ask', MAST, '#credit'], T.loop, 0.3);
tl.to(['#l5-0', '#l5-1', '#l5-2', '#l10'], { y: '+=900', rotation: 10, duration: 0.5, ease: 'power2.in', stagger: 0.05 }, T.loop);
tl.set(['#l5-0', '#l5-1', '#l5-2', '#l10'], { autoAlpha: 0 }, T.loop + 0.7);
D.gi.slice().reverse().forEach((b, i) => tl.fromTo('#' + b.id, { x: b.dx, y: b.dy, rotation: b.rot, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, T.loop + 0.2 + i * 0.004));
tl.to('.mo-gout', { opacity: 1, duration: 0.15 }, ${DURATION} - 0.2);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.4)}
tl.set({}, {}, ${DURATION});
`;
  const data = {
    T, lapDur, m500: s.s500.p50, m1000: s.s1000.p50, b500: s.s500.best, b1000: s.s1000.best, same: s.same.puzzlers,
    laps: laps.map(l => l.pieces), l10: b1000.pieces, n5: laps[0].pieces.length, n10: b1000.pieces.length,
    r5: laps[0].rect, r10: b1000.rect, s5: [0, 1, 2].map(S5), s10: S10, gi: gi.bits,
  };
  return {
    // Cover = frame 0, the complete splash (logo, texts, giant pieces).
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.5, 3.4, 5.5, 7.5, 9.0, 11.0, 14.5, 18.5, 22.5, 26.5, 29.2, DURATION - 0.05],
    html: composition({ key, title: 'Reel 1000 vs 500 (v2)', duration: DURATION, frameHtml, css, data, script }),
  };
}
