// DL4 · reel-sep (12 s): September's five most-solved puzzles as a countdown on an implied 120 BPM grid (beat 0.5 s),
// in the house style and full 9:16. Box lids (white mounts) flip in and land on the beat; the rank badge rolls like an
// odometer and pulses on the off-beats; under the credits, five solver bars stand on the bottom edge of the frame and
// rise one per rank (a staircase up to #1). #1 lands last (6.5 s) in the hot colour with a solver count-up; in H2 a
// bold poster piece drops behind it. Every box carries its credit (Puzzle · Brand) exactly while it is on screen.
import { fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import {
  H, HEAD, W, X0, X1, composition, device, f1, looks, masthead, posterLayer, posterMotion, stripState, type Reel, type ReelContext,
} from './shared.ts';

const KEY = 'reel-sep';
const TOP_N = 5;
const CARD = { x: 180, y: 548, w: 720, h: 529 };     // 1200×882 box lids, same 1.36 ratio
const BADGE = { x: X0, y: 1100, d: 128 };
const CREDIT_X = BADGE.x + BADGE.d + 28;
const BAR_MAX = 630;                                 // #1's bar (px), from the bottom edge: top at 1290
const BAR_GAP = 14;
const SEAM = 1300;                                   // H2: the bold piece covers everything above the bars
const LAND = [0.5, 2.0, 3.5, 5.0, 6.5];              // beat-aligned landings for #5..#1
const IN = 0.26, OUT = 0.22, SUSPENSE = 0.38;       // flip in/out durations, empty beat before #1
const END_OUT = 11.25;                               // #1 leaves, the opening frame returns by 11.8 s

export function sepReel({ c, v, largeBoxes }: ReelContext): Reel {
  const sep = c.dl2.september;
  const { base, bold } = looks(v, KEY);
  const top = sep.boxes.slice(0, TOP_N);             // already ordered by September solvers
  const ranked = [...top].reverse().map((b, i) => ({ ...b, rank: TOP_N - i }));   // #5 first
  const assets: Record<string, string> = {};
  for (const b of ranked) {
    const file = largeBoxes.get(b.puzzleId);
    if (!file) throw new Error(`no puzzle_large image for ${b.credit}`);
    assets[`assets/box-${b.rank}.jpg`] = file;
  }

  // Solver bars: one per rank, left (#5) to right (#1), full bleed, standing on the bottom edge; their empty tracks
  // (true heights, band colour) are there from the first frame, so the frame is full before any box lands.
  const bw = (W - (TOP_N - 1) * BAR_GAP) / TOP_N;
  const bars = ranked.map((b, i) => {
    const hgt = f1((b.solvers / top[0].solvers) * BAR_MAX);
    const pos = `left:${f1(i * (bw + BAR_GAP))}px; top:${f1(H - hgt)}px; width:${f1(bw)}px; height:${hgt}px`;
    return `<div class="sghost" style="${pos}"></div><div class="sbar" id="sb${b.rank}" style="${pos}"></div>`;
  }).join('');

  const credit = (b: typeof ranked[number]) => `<div class="credit" id="k${b.rank}"><p class="cr">${h(b.puzzle)} <span>· ${h(b.brand)}</span></p><p class="stat"><b id="s${b.rank}" class="sv">${b.rank === 1 ? 0 : fmtInt(b.solvers)}</b> puzzlers solved it</p></div>`;
  const BEATS = TOP_N;
  const dev = device(v, BEATS, 'sp');
  const title = (id: string) => `<h1 class="h-title" id="${id}" style="top:${HEAD.content}px">${h('Most-solved puzzles')}</h1>`;
  const mast = masthead({ id: 'mast', kicker: sep.label, src: c.dl2.source, device: dev });
  const first = ranked.filter(b => b.rank !== 1 || !bold).map(credit).join('\n');

  const hex = (k: 'base' | 'cool' | 'hot') => base.chart[k];
  const css = `
.stage { position: absolute; left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; height: ${CARD.h}px; perspective: 2200px; z-index: 6; }
.slot { position: absolute; inset: 0; border-radius: 12px; border: 3px dashed var(--g-rule); }
.stage .h-mount { inset: 0; border-radius: 10px; backface-visibility: hidden; transform-origin: 50% 50%; opacity: 0; }
.stage .h-mount img { transform-origin: 50% 50%; }
.ring { position: absolute; inset: -16px; border-radius: 22px; border: 8px solid var(--c-hot); opacity: 0; }
.badge { position: absolute; left: ${BADGE.x}px; top: ${BADGE.y}px; width: ${BADGE.d}px; height: ${BADGE.d}px; border-radius: 50%;
  background: ${base.ink}; overflow: hidden; z-index: 6; }
.digit { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 84px; font-weight: 700;
  color: var(--g-bg); opacity: 0; padding-top: 2px; }
.credit { position: absolute; left: ${CREDIT_X}px; top: ${BADGE.y - 6}px; width: ${X1 - CREDIT_X}px; opacity: 0; }
.cr { font-size: 40px; line-height: 48px; font-weight: 700; color: var(--g-ink); text-wrap: balance; }
.cr span { font-weight: 400; color: var(--g-soft); }
.stat { font-size: 34px; line-height: 42px; color: var(--g-soft); margin-top: 6px; }
.stat b { color: var(--g-ink); font-weight: 700; }
.sbar, .sghost { position: absolute; border-radius: 6px 6px 0 0; z-index: 6; }
.sghost { background: var(--g-band); }
.sbar { background: var(--c-base); transform-origin: 50% 100%; }
#d5 { opacity: 1; }
`;

  const body = `
${mast}
${title('ttl')}
<div class="stage">
  <div class="slot"></div>
  <div class="ring" id="ring"></div>
  ${ranked.map(b => `<div class="h-mount" id="c${b.rank}"><img src="assets/box-${b.rank}.jpg" alt="${h(b.credit)}"></div>`).join('\n  ')}
</div>
<div class="badge" id="badge" data-qa-bg="${base.ink}">${ranked.map(b => `<span class="digit" id="d${b.rank}">${b.rank}</span>`).join('')}</div>
${first}
${bars}
${bold ? posterLayer({ bold, seam: SEAM, mast: masthead({ id: 'mast2', kicker: sep.label, src: c.dl2.source, device: dev }) + title('ttl2'), body: credit(ranked[TOP_N - 1]) }) : ''}
`;

  const script = `
const LAND = DATA.land, IN = ${IN}, OUT = ${OUT}, SUSPENSE = ${SUSPENSE}, END_OUT = ${END_OUT};
const C = DATA.colors;
const ranks = [5, 4, 3, 2, 1];
${stripState(v, BEATS, 'sp', 0, 0)}

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
  // Its solver bar rises from the bottom edge as the card lands (current = cool, #1 = hot); the previous one settles.
  tl.fromTo('#sb' + r, { scaleY: 0, backgroundColor: r === 1 ? C.hot : C.cool }, { scaleY: 1, duration: 0.45, ease: 'back.out(1.4)', immediateRender: true }, land - 0.12);
  if (i > 0) tl.to('#sb' + ranks[i - 1], { backgroundColor: C.base, duration: 0.25, ease: 'power1.out' }, land - 0.12);
});
${[1, 2, 3, 4, 5].map(k => stripState(v, BEATS, 'sp', k, LAND[k - 1] - 0.06)).join('\n')}

// Badge odometer: the digit rolls up as each card arrives (#1 rolls on the suspense beat).
const roll = (from, to, at) => {
  tl.fromTo('#d' + from, { y: 0, opacity: 1 }, { y: -96, opacity: 0, duration: 0.24, ease: 'power2.in', immediateRender: false }, at);
  tl.fromTo('#d' + to, { y: 96, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out', immediateRender: false }, at + 0.06);
};
roll(5, 4, LAND[1] - IN); roll(4, 3, LAND[2] - IN); roll(3, 2, LAND[3] - IN); roll(2, 1, 6.0);
tl.fromTo('#badge', { backgroundColor: C.ink }, { backgroundColor: C.hot, duration: 0.2, ease: 'power1.out', immediateRender: false }, 6.4);
tl.set('#badge', { attr: { 'data-qa-bg': C.hot } }, 6.4);

// Beat pulses on the badge keep the implied rhythm going between landings and through the #1 hold.
for (let t = 0.5; t < 11.2; t += 0.5) {
  const landing = LAND.some(l => Math.abs(l - t) < 0.01);
  const strength = landing ? 1.1 : (t > 6.5 ? 1.035 : 1.05);
  tl.fromTo('#badge', { scale: strength }, { scale: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, t);
}

// #1: hot ring and the solver count-up.
${bold ? posterMotion(SEAM, 5.7, END_OUT, '#mast, #ttl') : ''}
tl.fromTo('#ring', { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, 6.5);
const n = { v: 0 }, s1 = document.getElementById('s1');
tl.fromTo(n, { v: 0 }, { v: DATA.top, duration: 1.0, ease: 'power2.out', immediateRender: false,
  onUpdate: () => { s1.textContent = Math.round(n.v).toLocaleString('en-US'); } }, LAND[4] - IN);

// Back to the opening frame: #1 leaves, the ring fades, the bars sink, the badge rolls back to 5.
tl.fromTo('#ring', { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, END_OUT);
tl.to(ranks.map(r => '#sb' + r).reverse(), { scaleY: 0, duration: 0.35, ease: 'power2.in', stagger: 0.04 }, END_OUT);
roll(1, 5, END_OUT + OUT + 0.05);
tl.fromTo('#badge', { backgroundColor: C.hot }, { backgroundColor: C.ink, duration: 0.25, immediateRender: false }, END_OUT + OUT + 0.05);
tl.set('#badge', { attr: { 'data-qa-bg': C.ink } }, END_OUT + OUT + 0.05);
${stripState(v, BEATS, 'sp', 0, END_OUT + OUT + 0.05)}
`;

  const duration = 12;
  const lines = top.map((b, i) => `${i + 1}. ${b.puzzle} (${b.brand}), ${fmtInt(b.solvers)} puzzlers`).join('\n');
  return {
    key: KEY,
    label: 'Reel: September\'s most-solved puzzles (12 s countdown)',
    caption: `${fmtInt(top[0].solvers)} of you solved ${top[0].puzzle} in September, more than any other puzzle on MySpeedPuzzling. The top 5:\n\n${lines}\n\nWhich one is on your table right now?\n\n#speedpuzzling #jigsawpuzzle #ravensburger`,
    duration,
    coverAt: 8.0,
    qaAt: [0, 0.6, 2.6, 4.2, 5.5, 6.3, 8.0, 11.0, 11.4, 11.95],
    html: composition({
      id: `${KEY}-${v.id.toLowerCase()}`, title: `${v.id} ${KEY}`, duration, ground: base, css, body,
      data: { land: LAND, top: top[0].solvers, colors: { base: hex('base'), cool: hex('cool'), hot: hex('hot'), ink: base.ink } }, script,
    }),
    assets,
  };
}
