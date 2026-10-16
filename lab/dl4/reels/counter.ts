// DL4 · reel-counter (8 s): every piece ever logged on MySpeedPuzzling, counted up while a 9×10 full-bleed jigsaw from
// the piece generator assembles under the number and fills the frame down to the bottom edge. Pieces converge from
// outside the frame in a seeded order into the empty grid (its slots drawn in the ground's band colour, so the frame
// is full from the first frame), tinted with the ground's chart tokens; the hot centre piece snaps in last as
// the counter settles (4.6 s). In H2 a bold poster piece drops over the counter at the settle. Then the puzzle lifts
// apart and the counter rewinds for the loop.
import { formatHex, interpolate } from 'culori';
import { fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import { heroEm } from '../../../src/design/house.ts';
import {
  CW, H, HEAD, W, composition, device, f1, looks, masthead, posterLayer, posterMotion, rng, stripState, type Reel, type ReelContext,
} from './shared.ts';

const KEY = 'reel-counter';
const COLS = 9, ROWS = 10;
const GRID = { x: 0, y: 800, w: W, h: H - 800 };     // full bleed from under the text to the bottom edge
const SEAM = 776;                                     // H2 poster seam (knobs ±54 px), just over the grid's top edge
const SNAP_AT = 4.6;
const BEATS = 2;

export function counterReel({ c, v }: ReelContext): Reel {
  const t = c.dl1.totals;
  const total = t.pieces;
  const { base, bold } = looks(v, KEY);
  const jig = generateJigsaw({ cols: COLS, rows: ROWS, width: GRID.w, height: GRID.h, x: GRID.x, y: GRID.y, seed: 23, tabSize: 0.22, jitter: 0.035 });
  // Tints from the ground's chart tokens: dark grounds run base → cool over band-coloured slots; light grounds run
  // base → context (pale) over darker rule-coloured slots, so the pieces always read against the empty grid. The last piece is hot.
  const [t0, t1] = base.dark ? [base.chart.base, base.chart.cool] : [base.chart.base, base.chart.context];
  const slot = base.dark ? base.band : base.rule;
  const tint = interpolate([t0, t1], 'oklch');
  const last = jig.pieces.find(p => p.col === Math.floor(COLS / 2) && p.row === 2)!;   // centre column, inside every crop
  const rand = rng(7);
  const cx = GRID.x + GRID.w / 2, cy = GRID.y + 400;

  // Arrival order: seeded shuffle, the hot centre piece last.
  const others = jig.pieces.filter(p => p !== last).map(p => ({ p, k: rand() })).sort((a, b) => a.k - b.k).map(o => o.p);
  const order = [...others, last];
  const pieces = order.map((p, i) => {
    const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
    const ang = Math.atan2(pcy - cy, pcx - cx) + (rand() - 0.5) * 0.9;
    const dist = 1250 + rand() * 500;
    const fill = p === last ? base.chart.hot : formatHex(tint((p.col / (COLS - 1)) * 0.55 + (p.row / (ROWS - 1)) * 0.45));
    return { id: `q${i}`, d: p.d, fill, dx: f1(Math.cos(ang) * dist), dy: f1(Math.sin(ang) * dist), rot: f1((rand() - 0.5) * 160) };
  });

  const numPx = Math.min(130, Math.floor(CW / heroEm(fmtInt(total))));
  const text = (num: string) => `
<p class="h-big num r-abs" id="${num}" style="top:${HEAD.content}px; font-size:${numPx}px">0</p>
<p class="r-abs lab1" style="top:${HEAD.content + numPx + 14}px">${h('puzzle pieces placed')}</p>
<p class="r-abs h-dek" style="top:${HEAD.content + numPx + 80}px">${h(`in ${fmtInt(t.results)} logged solves`)}</p>`;
  const dev = device(v, BEATS, 'sp');
  const kicker = 'All time on MySpeedPuzzling';

  const css = `
.num { line-height: 1; transform-origin: 0% 50%; }
.lab1 { font-size: 52px; line-height: 60px; font-weight: 600; color: var(--g-ink); }
#puzzle path, #slots path { stroke: var(--g-bg); stroke-width: 3; stroke-linejoin: round; }
#slots path { fill: ${slot}; }
`;

  const body = `
<svg id="slots" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true">${jig.pieces.map(p => `<path d="${p.d}"/>`).join('')}</svg>
<svg id="puzzle" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true">${pieces.map(p => `<path id="${p.id}" d="${p.d}" fill="${p.fill}"/>`).join('')}</svg>
<div id="base-text">
${masthead({ id: 'mast', kicker, src: c.dl1.source, device: dev })}
${text('num')}
</div>
${bold ? posterLayer({ bold, seam: SEAM, mast: masthead({ id: 'mast2', kicker, src: c.dl1.source, device: dev }), body: text('num2') }) : ''}
`;

  const script = `
const P = DATA.pieces, N = P.length, SNAP = ${SNAP_AT};
const nums = [...document.querySelectorAll('.num')];
const count = { v: 0 };
const show = () => { const s = Math.round(count.v).toLocaleString('en-US'); for (const el of nums) el.textContent = s; };
${stripState(v, BEATS, 'sp', 1, 0)}

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
tl.fromTo('.num', { scale: 1 }, { scale: 1.05, duration: 0.08, ease: 'power1.out', immediateRender: false }, SNAP - 0.02);
tl.to('.num', { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, SNAP + 0.08);
${stripState(v, BEATS, 'sp', 2, SNAP_AT)}
${bold ? posterMotion(SEAM, SNAP_AT - 0.25, 6.95, '#mast, #base-text') : ''}

// 7.0–7.7 s: the puzzle lifts apart and the counter rewinds to the opening frame.
const out = P.map(p => '#' + p.id);
tl.to(out, { x: (i) => P[i].dx * 0.6, y: (i) => P[i].dy * 0.6, rotation: (i) => P[i].rot, opacity: 0, duration: 0.45, ease: 'power2.in',
  stagger: { each: 0.006, from: 'end' } }, 7.0);
tl.to(count, { v: 0, duration: 0.6, ease: 'power2.in', onUpdate: show }, 7.05);
${stripState(v, BEATS, 'sp', 1, 7.05)}
`;

  const duration = 8;
  return {
    key: KEY,
    label: `Reel: ${Math.round(total / 1e6)} million pieces (${duration} s counter)`,
    caption: `${fmtInt(total)} puzzle pieces. That is every piece placed in the ${fmtInt(t.results)} solves logged on MySpeedPuzzling so far, by ${fmtInt(t.players)} puzzlers in ${t.countries} countries. How many of them are yours?\n\n#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    duration,
    coverAt: 6.0,
    qaAt: [0, 1.5, 3.0, 4.5, 6.0, 7.2, 7.95],
    html: composition({
      id: `${KEY}-${v.id.toLowerCase()}`, title: `${v.id} ${KEY}`, duration, ground: base, css, body,
      data: { total, pieces: pieces.map(({ id, dx, dy, rot }) => ({ id, dx, dy, rot })) }, script,
    }),
    assets: {},
  };
}
