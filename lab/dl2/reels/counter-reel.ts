// F4 · counter-reel (8 s): every piece ever logged on MySpeedPuzzling, counted up while a 9×10 full-bleed jigsaw from
// the piece generator assembles under the number. Pieces converge from outside the frame in a seeded order, the
// coral centre piece snaps in last as the counter settles (4.6 s), then the puzzle lifts apart and the counter
// rewinds so the loop restarts cleanly.
import { formatHex, interpolate } from 'culori';
import { escapeHtml as h, fmtInt } from '../../../src/design/page.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import { X0, CW, composition, f1, kicker, sourceLine, type Reel, type ReelContext } from './shared.ts';

const COLS = 9, ROWS = 10;
// Full-bleed below the text: graphics may use the band under the Reel safe area (text never does).
const GRID = { x: 0, y: 680, w: 1080, h: 1240 };
const SNAP_AT = 4.6;

/** Deterministic PRNG (mulberry32) so the scatter is identical on every render. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function counterReel({ dl1: c }: ReelContext): Reel {
  const total = c.totals.pieces;     // 274,399,467
  const jig = generateJigsaw({ cols: COLS, rows: ROWS, width: GRID.w, height: GRID.h, x: GRID.x, y: GRID.y, seed: 23, tabSize: 0.22, jitter: 0.035 });
  const tint = interpolate(['#c7e8ff', '#97a5f9'], 'oklch');   // sky-200 → indigo-300
  const last = jig.pieces.find(p => p.col === Math.floor(COLS / 2) && p.row === 2)!;   // centre column, inside every crop
  const rand = rng(7);
  const cx = GRID.x + GRID.w / 2, cy = GRID.y + 400;

  // Arrival order: seeded shuffle, the coral centre piece last.
  const others = jig.pieces.filter(p => p !== last).map(p => ({ p, k: rand() })).sort((a, b) => a.k - b.k).map(o => o.p);
  const order = [...others, last];
  const pieces = order.map((p, i) => {
    const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
    // Fly in from outside the frame along the ray from the grid centre (plus jitter), turning as it comes.
    const ang = Math.atan2(pcy - cy, pcx - cx) + (rand() - 0.5) * 0.9;
    const dist = 1250 + rand() * 500;
    const fill = p === last ? '#ec726f' : formatHex(tint((p.col / (COLS - 1)) * 0.55 + (p.row / (ROWS - 1)) * 0.45));
    return { id: `q${i}`, d: p.d, fill, dx: f1(Math.cos(ang) * dist), dy: f1(Math.sin(ang) * dist), rot: f1((rand() - 0.5) * 160) };
  });

  const css = `
#num { position: absolute; left: ${X0}px; top: 318px; font-size: 132px; line-height: 140px; font-weight: 700; letter-spacing: -3px;
  transform-origin: 0% 50%; white-space: nowrap; }
#lab1 { position: absolute; left: ${X0}px; top: 476px; font-size: 52px; line-height: 60px; font-weight: 600; }
#lab2 { position: absolute; left: ${X0}px; top: 548px; font-size: 36px; line-height: 44px; color: var(--ink-soft); }
#root .src { top: 612px; }
#puzzle { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
#puzzle path { stroke: #ffffff; stroke-width: 3; stroke-linejoin: round; }
`;

  const body = `
<svg id="puzzle" viewBox="0 0 1080 1920" aria-hidden="true">${pieces.map(p => `<path id="${p.id}" d="${p.d}" fill="${p.fill}"/>`).join('')}</svg>
${kicker('All time on MySpeedPuzzling')}
<p id="num">0</p>
<p id="lab1">${h('puzzle pieces placed')}</p>
<p id="lab2">${h(`in ${fmtInt(c.totals.results)} logged solves`)}</p>
${sourceLine(c.source)}
`;

  const script = `
const P = DATA.pieces, N = P.length, SNAP = ${SNAP_AT};
const num = document.getElementById('num');
const count = { v: 0 };
const show = () => { num.textContent = Math.round(count.v).toLocaleString('en-US'); };

// 0.2–4.3 s: pieces converge and snap into place (seeded order); the centre piece lands last at SNAP.
const stagger = (SNAP - 0.2 - 0.62) / (N - 2);
P.forEach((p, i) => {
  const lastOne = i === N - 1;
  const at = lastOne ? SNAP - 0.5 : 0.2 + i * stagger;
  tl.fromTo('#' + p.id, { x: p.dx, y: p.dy, rotation: p.rot, opacity: 0, transformOrigin: '50% 50%' },
    { x: 0, y: 0, rotation: 0, opacity: 1, duration: lastOne ? 0.5 : 0.62, ease: lastOne ? 'back.out(1.4)' : 'expo.out' }, at);
});
tl.fromTo('#' + P[N - 1].id, { scale: 1 }, { scale: 1.12, duration: 0.08, ease: 'power1.out', immediateRender: false }, SNAP - 0.04);
tl.to('#' + P[N - 1].id, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, SNAP + 0.06);

// The counter runs with the assembly and settles on the exact total as the last piece clicks in.
tl.fromTo(count, { v: 0 }, { v: DATA.total, duration: SNAP - 0.15, ease: 'power3.out', onUpdate: show }, 0.15);
tl.fromTo('#num', { scale: 1 }, { scale: 1.05, duration: 0.08, ease: 'power1.out', immediateRender: false }, SNAP - 0.02);
tl.to('#num', { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, SNAP + 0.08);

// 7.0–7.7 s: the puzzle lifts apart and the counter rewinds to the opening frame.
const out = P.map(p => '#' + p.id);
tl.to(out, { x: (i) => P[i].dx * 0.6, y: (i) => P[i].dy * 0.6, rotation: (i) => P[i].rot, opacity: 0, duration: 0.45, ease: 'power2.in',
  stagger: { each: 0.006, from: 'end' } }, 7.0);
tl.to(count, { v: 0, duration: 0.6, ease: 'power2.in', onUpdate: show }, 7.05);
`;

  const duration = 8;
  return {
    key: 'counter-reel',
    label: 'Reel: 275 million pieces (8 s counter)',
    caption: `${fmtInt(total)} puzzle pieces. That is every piece placed in the ${fmtInt(c.totals.results)} solves logged on MySpeedPuzzling so far, by ${fmtInt(c.totals.players)} puzzlers in ${c.totals.countries} countries. How many of them are yours?\n\n#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    duration,
    coverAt: 6.0,
    qaAt: [0, 1.5, 3.0, 6.0, 7.95],
    html: composition({ id: 'counter-reel', title: 'counter-reel', duration, css, body, data: { total, pieces: pieces.map(({ id, dx, dy, rot }) => ({ id, dx, dy, rot })) }, script }),
    assets: {},
  };
}
