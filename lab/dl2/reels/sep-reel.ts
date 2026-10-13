// F4 · sep-reel (12 s): September's five most-solved puzzles as a countdown on an implied 120 BPM grid
// (beat = 0.5 s). Box lids flip in and land exactly on a beat, the rank badge rolls like an odometer and pulses
// on the off-beats, a five-piece progress strip assembles, and #1 lands last (6.5 s) with a coral ring and a
// solver count-up. Every box carries its credit (puzzle · brand) for exactly as long as it is on screen.
import { escapeHtml as h, fmtInt } from '../../../src/design/page.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import { X0, composition, kicker, sourceLine, type Reel, type ReelContext } from './shared.ts';

const TOP_N = 5;
const CARD = { x: X0, y: 424, w: 800, h: 588 };   // 1200×882 box lids, same 1.36 ratio
const BADGE = { x: X0, y: 1040, d: 128 };
const LAND = [0.5, 2.0, 3.5, 5.0, 6.5];             // beat-aligned landings for #5..#1
const IN = 0.26, OUT = 0.22, SUSPENSE = 0.38;      // flip in/out durations, empty beat before #1
const END_OUT = 11.25;                             // #1 leaves, the opening frame returns by 11.8 s

export function sepReel({ dl2: c, largeBoxes }: ReelContext): Reel {
  const top = c.september.boxes.slice(0, TOP_N);   // already ordered by September solvers
  const ranked = [...top].reverse().map((b, i) => ({ ...b, rank: TOP_N - i }));   // #5 first
  const assets: Record<string, string> = {};
  for (const b of ranked) {
    const file = largeBoxes.get(b.puzzleId);
    if (!file) throw new Error(`no puzzle_large image for ${b.credit}`);
    assets[`assets/box-${b.rank}.jpg`] = file;
  }

  // Progress strip: five interlocking pieces from one generated row (they tessellate by construction).
  const PW = 52;   // progress piece size
  const jig = generateJigsaw({ cols: TOP_N, rows: 1, width: TOP_N * PW, height: PW, seed: 11, tabSize: 0.24 });
  const strip = jig.pieces.sort((a, b) => a.col - b.col)
    .map(p => `<path id="p${p.col}" d="${p.d}" fill="#dfe3ea" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>`).join('');

  const css = `
.hl { position: absolute; left: ${X0}px; top: 312px; font-size: 72px; line-height: 80px; font-weight: 700; letter-spacing: -1.5px; }
#strip { position: absolute; left: ${960 - TOP_N * PW}px; top: ${260 - PW / 2}px; width: ${TOP_N * PW}px; height: ${PW}px; }
.stage { position: absolute; left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; height: ${CARD.h}px; perspective: 2200px; }
.slot { position: absolute; inset: 0; border-radius: 22px; border: 3px dashed var(--context); }
.card { position: absolute; inset: 0; border-radius: 22px; overflow: hidden; background: var(--paper); border: 2px solid var(--line);
  box-shadow: 0 22px 48px rgba(43, 52, 69, 0.14); backface-visibility: hidden; transform-origin: 50% 50%; opacity: 0; }
.card img { display: block; width: 100%; height: 100%; object-fit: cover; transform-origin: 50% 50%; }
.ring { position: absolute; inset: -14px; border-radius: 32px; border: 8px solid var(--coral-500); opacity: 0; }
.badge { position: absolute; left: ${BADGE.x}px; top: ${BADGE.y}px; width: ${BADGE.d}px; height: ${BADGE.d}px; border-radius: 50%;
  background: #2b3445; overflow: hidden; }
.digit { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 84px; font-weight: 700;
  color: #ffffff; opacity: 0; padding-top: 2px; }
.digit.one { color: #2b3445; }
.credit { position: absolute; left: ${BADGE.x + BADGE.d + 24}px; top: 1034px; width: ${960 - (BADGE.x + BADGE.d + 24)}px; opacity: 0; }
.credit .name { font-size: 44px; line-height: 52px; font-weight: 700; white-space: nowrap; }
.credit .brand { font-size: 36px; line-height: 44px; color: var(--ink-soft); }
.credit .stat { font-size: 32px; line-height: 42px; color: var(--ink-soft); margin-top: 2px; }
.credit .stat b { color: var(--ink); font-weight: 700; }
#d5 { opacity: 1; }
`;

  const body = `
${kicker(c.september.label)}
<svg id="strip" viewBox="0 0 ${TOP_N * PW} ${PW}" aria-hidden="true">${strip}</svg>
<h1 class="hl">${h('Most-solved puzzles')}</h1>
<div class="stage">
  <div class="slot"></div>
  <div class="ring" id="ring"></div>
  ${ranked.map(b => `<div class="card" id="c${b.rank}"><img src="assets/box-${b.rank}.jpg" alt="${h(b.credit)}"></div>`).join('\n  ')}
</div>
<div class="badge" id="badge">${ranked.map(b => `<span class="digit${b.rank === 1 ? ' one' : ''}" id="d${b.rank}">${b.rank}</span>`).join('')}</div>
${ranked.map(b => `<div class="credit" id="k${b.rank}"><p class="name">${h(b.puzzle)}</p><p class="brand">${h(b.brand)}</p><p class="stat"><b id="s${b.rank}">${b.rank === 1 ? 0 : fmtInt(b.solvers)}</b> puzzlers solved it</p></div>`).join('\n')}
${sourceLine(c.source)}
`;

  const script = `
const LAND = DATA.land, IN = ${IN}, OUT = ${OUT}, SUSPENSE = ${SUSPENSE}, END_OUT = ${END_OUT};
const INK = '#2b3445', CORAL = '#ec726f', CONTEXT = '#dfe3ea';
const ranks = [5, 4, 3, 2, 1];

// Cards: flip in to land on the beat, flip out edge-on before the next one. Credits live exactly as long.
ranks.forEach((r, i) => {
  const land = LAND[i];
  const inAt = land - IN;
  const outEnd = i < 4 ? LAND[i + 1] - IN - (r === 2 ? SUSPENSE : 0) : END_OUT + OUT;
  const outAt = outEnd - OUT;
  tl.fromTo('#c' + r, { rotationY: -90, opacity: 0, scale: r === 1 ? 0.9 : 0.97 },
    { rotationY: 0, opacity: 1, scale: 1, duration: IN, ease: r === 1 ? 'back.out(1.7)' : 'power2.out', immediateRender: true }, inAt);
  tl.fromTo('#c' + r + ' img', { scale: 1 }, { scale: r === 1 ? 1.06 : 1.035, duration: outEnd - land, ease: 'none', immediateRender: true }, land);
  tl.fromTo('#c' + r, { rotationY: 0, opacity: 1 }, { rotationY: 90, opacity: 0, duration: OUT, ease: 'power2.in', immediateRender: false }, outAt);
  tl.fromTo('#k' + r, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', immediateRender: true }, inAt);
  tl.set('#k' + r, { opacity: 0 }, outEnd);
  // Progress strip: one more piece snaps in per rank (#1 in coral).
  tl.fromTo('#p' + i, { fill: CONTEXT }, { fill: r === 1 ? CORAL : INK, duration: 0.18, ease: 'power1.out', immediateRender: true }, land - 0.06);
});

// Badge odometer: the digit rolls up as each card arrives (#1 rolls on the suspense beat).
const roll = (from, to, at) => {
  tl.fromTo('#d' + from, { y: 0, opacity: 1 }, { y: -96, opacity: 0, duration: 0.24, ease: 'power2.in', immediateRender: false }, at);
  tl.fromTo('#d' + to, { y: 96, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out', immediateRender: false }, at + 0.06);
};
roll(5, 4, LAND[1] - IN); roll(4, 3, LAND[2] - IN); roll(3, 2, LAND[3] - IN); roll(2, 1, 6.0);
tl.fromTo('#badge', { backgroundColor: INK }, { backgroundColor: CORAL, duration: 0.2, ease: 'power1.out', immediateRender: false }, 6.4);

// Beat pulses on the badge keep the implied rhythm going between landings and through the #1 hold.
for (let t = 0.5; t < 11.2; t += 0.5) {
  const landing = LAND.some(l => Math.abs(l - t) < 0.01);
  const strength = landing ? 1.1 : (t > 6.5 ? 1.035 : 1.05);
  tl.fromTo('#badge', { scale: strength }, { scale: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, t);
}

// #1: coral ring and the solver count-up.
tl.fromTo('#ring', { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, 6.5);
const n = { v: 0 }, s1 = document.getElementById('s1');
tl.fromTo(n, { v: 0 }, { v: DATA.top, duration: 1.0, ease: 'power2.out', immediateRender: false,
  onUpdate: () => { s1.textContent = Math.round(n.v).toLocaleString('en-US'); } }, LAND[4] - IN);

// Back to the opening frame: #1 leaves, the ring fades, the badge rolls back to 5, the strip resets.
tl.fromTo('#ring', { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, END_OUT);
roll(1, 5, END_OUT + OUT + 0.05);
tl.fromTo('#badge', { backgroundColor: CORAL }, { backgroundColor: INK, duration: 0.25, immediateRender: false }, END_OUT + OUT + 0.05);
tl.fromTo(['#p0', '#p1', '#p2', '#p3', '#p4'], { fill: (i) => (i === 4 ? CORAL : INK) }, { fill: CONTEXT, duration: 0.3, stagger: 0.04, immediateRender: false }, END_OUT + OUT + 0.05);
`;

  const duration = 12;
  const lines = top.map((b, i) => `${i + 1}. ${b.puzzle} (${b.brand}), ${fmtInt(b.solvers)} puzzlers`).join('\n');
  return {
    key: 'sep-reel',
    label: 'Reel: September\'s most-solved puzzles (12 s countdown)',
    caption: `${fmtInt(top[0].solvers)} of you solved ${top[0].puzzle} in September, more than any other puzzle on MySpeedPuzzling. The top 5:\n\n${lines}\n\nWhich one is on your table right now?\n\n#speedpuzzling #jigsawpuzzle #ravensburger`,
    duration,
    coverAt: 8.0,
    qaAt: [0, 1.2, 2.6, 4.2, 5.5, 8.0, 11.0, 11.95],
    html: composition({ id: 'sep-reel', title: 'sep-reel', duration, css, body, data: { land: LAND, top: top[0].solvers }, script }),
    assets,
  };
}
