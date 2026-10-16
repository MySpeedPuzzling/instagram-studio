// DL4 · reel-xp (12 s): feature reveal for XP and levels (launched 12 Oct 2026), house style, full 9:16.
//   0–3.4 s   hook "XP and levels are here"; a level ring of generator pieces (one per level, the middle row of an
//             n×3 jigsaw bent into a ring, so every piece interlocks) fills clockwise while the centre counts 1 → 50;
//             the ring turns hot when the top level is reached
//   3.9 s     "The Level 50 club" + how many puzzlers are there (H2: on a bold poster piece that drops in)
//   5.9 s     the ring flies apart; daily results grow from the bottom edge: the launch-day spike, counted up, against
//             a dashed typical-day line
//   9.4 s     the ring comes back empty with a "?" and the call to action "What level are you? Check your profile"
//   11.2 s    back to the opening frame (seamless loop)
// The piece floor at the bottom edge (ground band colour) keeps the frame full under the ring.
import { fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw, type Point } from '../../../src/pieces/jigsaw.ts';
import { heroEm } from '../../../src/design/house.ts';
import {
  CW, H, HEAD, W, composition, device, f1, looks, masthead, posterLayer, posterMotion, rng, stripState, type Reel, type ReelContext,
} from './shared.ts';

const KEY = 'reel-xp';
const RING = { cx: W / 2, cy: 1120, r: 370, ph: 64 };   // centre, mid radius, radial piece depth
const SEAM = 652;                                        // H2 poster seam, above the ring's top knobs
const BAR_TOP = 760;                                     // the launch-day bar's top (bars stand on the bottom edge)
const FLOOR_Y = 1630;
const BEATS = 4;
const STEP = 0.058;                                      // seconds per level while the ring fills
const FILL_AT = 0.35;
/** Level number: its line box (baseline + 0.25 em) stays above y 1250 even at the 1.08 pulse. */
const LV_PX = 230, LV_BASE = 1176;

/** The middle row of an n×3 jigsaw, mapped onto a ring (x → angle clockwise from 12 o'clock, y → radius). */
function ringPieces(n: number, seed = 31) {
  const pw = (2 * Math.PI * RING.r) / n, total = n * pw;
  const jig = generateJigsaw({ cols: n, rows: 3, width: total, height: 3 * RING.ph, seed, tabSize: 0.24, jitter: 0.02 });
  const map = ([x, y]: Point): Point => {
    const a = -Math.PI / 2 + (x / total) * Math.PI * 2;
    const r = RING.r + (1.5 * RING.ph - y);
    return [RING.cx + r * Math.cos(a), RING.cy + r * Math.sin(a)];
  };
  const pt = (p: Point) => `${f1(p[0])} ${f1(p[1])}`;
  return jig.pieces.filter(p => p.row === 1).sort((a, b) => a.col - b.col).map(p => {
    const o = p.outline.map(map);
    let d = `M ${pt(o[0])}`;
    for (let k = 1; k + 2 < o.length; k += 3) d += ` C ${pt(o[k])} ${pt(o[k + 1])} ${pt(o[k + 2])}`;
    const mid = map([(p.col + 0.5) * pw, 1.5 * RING.ph]);
    return { d: d + ' Z', mid };
  });
}

export function xpReel({ c, v }: ReelContext): Reel {
  const xp = c.dl1.xp, f = c.dl1.feature;
  const { base, bold } = looks(v, KEY);
  const n = xp.level;                                     // the top level (50): one ring piece per level
  const topLevel = xp.distribution.find(d => d.level === n)?.players ?? 0;
  const rand = rng(17);

  const ring = ringPieces(n).map((p, i) => {
    const ang = Math.atan2(p.mid[1] - RING.cy, p.mid[0] - RING.cx) + (rand() - 0.5) * 0.5;
    const dist = 320 + rand() * 260;
    return { id: `r${i}`, d: p.d, dx: f1(Math.cos(ang) * dist), dy: f1(Math.sin(ang) * dist), rot: f1((rand() - 0.5) * 140) };
  });
  // Piece floor: rows 1–2 of a 5×3 jigsaw, so its top edge has knobs; it runs off the bottom edge.
  const floorJig = generateJigsaw({ cols: 5, rows: 3, width: W, height: 3 * 216, y: FLOOR_Y - 216, seed: 41, tabSize: 0.22, jitter: 0.03 });
  const floor = floorJig.pieces.filter(p => p.row >= 1).map(p => `<path d="${p.d}"/>`).join('');

  // Daily results, 28 Sep – 13 Oct, from the bottom edge; the launch day is hot; a dashed line marks a typical day.
  const days = f.days;
  const launch = days.find(d => d.results === f.results)!;
  const scale = (H - BAR_TOP) / f.results;
  const band = W / days.length, bw = band * 0.8;
  const bars = days.map((d, i) => {
    const hgt = f1(d.results * scale);
    return `<div class="dbar${d === launch ? ' launch' : ''}" id="db${i}" style="left:${f1(i * band + (band - bw) / 2)}px; top:${f1(H - hgt)}px; width:${f1(bw)}px; height:${hgt}px"></div>`;
  }).join('');
  const typicalY = f1(H - f.typicalDay * scale);

  const heroPx = Math.min(200, Math.floor(CW / heroEm(fmtInt(f.results))));
  const dev = device(v, BEATS, 'sp');
  const mast = (id: string) => masthead({ id, kicker: xp.kicker, src: c.dl1.source, device: dev });
  const top = HEAD.content;
  const clubBeat = `<div class="r-abs beat" id="h2" style="top:${top}px"><h2 class="big" style="font-size:76px">${h(xp.title)}</h2><p class="h-dek" style="margin-top:6px">${h(xp.dek)}</p></div>`;

  const css = `
.beat { opacity: 0; }
.big { font-size: 84px; line-height: 1.04; font-weight: 700; letter-spacing: -0.02em; color: var(--g-ink); text-wrap: balance; }
#ring path { fill: var(--g-band); stroke: var(--g-bg); stroke-width: 2.5; stroke-linejoin: round; }
#floor path { fill: var(--g-band); stroke: var(--g-bg); stroke-width: 4; stroke-linejoin: round; }
.ctr { position: absolute; left: 0; width: ${W}px; text-align: center; }
#lvcap { top: ${RING.cy - 160}px; }
#lvn, #qm { top: ${f1(LV_BASE - 0.8425 * LV_PX)}px; font-size: ${LV_PX}px; }
#qm { opacity: 0; color: var(--g-hot); }
.dbar { position: absolute; background: var(--c-base); border-radius: 4px 4px 0 0; transform-origin: 50% 100%; }
.dbar.launch { background: var(--c-hot); }
#typical { position: absolute; left: 0; top: ${f1(Number(typicalY) - 3)}px; width: ${W}px; height: 6px; opacity: 0; }
#hv { line-height: 1; }
`;

  const body = `
<svg id="floor" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true">${floor}</svg>
${bars}
<svg id="typical" viewBox="0 0 ${W} 6" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="3" x2="${W}" y2="3" stroke="var(--g-ink)" stroke-width="5" stroke-dasharray="16 12"/></svg>
<svg id="ring" class="r-full" viewBox="0 0 ${W} ${H}" aria-hidden="true">${ring.map(p => `<path id="${p.id}" d="${p.d}"/>`).join('')}</svg>
<p class="h-cap ctr" id="lvcap">Level</p>
<p class="h-big ctr" id="lvn">1</p>
<p class="h-big ctr" id="qm">?</p>
${mast('mast')}
<h1 class="r-abs big" id="h1" style="top:${top}px">${h('XP and levels are here')}</h1>
${bold ? '' : clubBeat}
<div class="r-abs beat" id="h3" style="top:${top}px">
  <p class="h-big hot" id="hv" style="font-size:${heroPx}px">0</p>
  <p class="h-lead" style="margin-top:18px">${h('results logged on launch day')}</p>
  <p class="h-dek" style="margin-top:6px">${h(`${f.launchDate} · ${f.multiple}× a typical day`)}</p>
</div>
<div class="r-abs beat" id="h4" style="top:${top}px"><h2 class="big">${h('What level are you?')}</h2><p class="h-dek" style="margin-top:16px">${h('Check your profile on myspeedpuzzling.com')}</p></div>
${bold ? posterLayer({ bold, seam: SEAM, mast: mast('mast2'), body: clubBeat }) : ''}
`;

  const script = `
const N = ${n}, STEP = ${STEP}, FILL_AT = ${FILL_AT}, C = DATA.colors, R = DATA.ring;
const ring = R.map(p => '#' + p.id);
const lvn = document.getElementById('lvn'), hv = document.getElementById('hv');
const lvl = { v: 1 }, res = { v: 0 };
const showLvl = () => { lvn.textContent = String(Math.round(lvl.v)); };
const showRes = () => { hv.textContent = Math.round(res.v).toLocaleString('en-US'); };
${stripState(v, BEATS, 'sp', 1, 0)}

// 0.35–3.4 s: the ring fills clockwise, one piece per level, while the centre counts up.
R.forEach((p, i) => {
  const at = FILL_AT + i * STEP;
  tl.fromTo('#' + p.id, { fill: C.band }, { fill: C.cool, duration: 0.18, ease: 'power1.out', immediateRender: false }, at);
  tl.fromTo('#' + p.id, { scale: 1.18, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, at);
});
tl.fromTo(lvl, { v: 1 }, { v: N, duration: (N - 1) * STEP, ease: 'none', onUpdate: showLvl, immediateRender: false }, FILL_AT + 0.09);
const DONE = FILL_AT + (N - 1) * STEP + 0.2;
tl.to(ring, { fill: C.hot, duration: 0.25, ease: 'power1.out', stagger: 0.006 }, DONE);
tl.fromTo('#ring', { scale: 1, transformOrigin: '50% ${f1(RING.cy / H * 100)}%' }, { scale: 1.035, duration: 0.12, ease: 'power1.out', immediateRender: false }, DONE);
tl.to('#ring', { scale: 1, duration: 0.45, ease: 'back.out(3)' }, DONE + 0.12);
tl.fromTo('#lvn', { scale: 1 }, { scale: 1.08, duration: 0.12, ease: 'power1.out', immediateRender: false }, DONE);
tl.to('#lvn', { scale: 1, duration: 0.45, ease: 'back.out(3)' }, DONE + 0.12);

// 3.6 s: the Level 50 club.
${bold ? posterMotion(SEAM, 3.55, 5.8) : ''}
tl.fromTo('#h1', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 3.6);
tl.fromTo('#h2', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 3.95);
${stripState(v, BEATS, 'sp', 2, 3.95)}

// 5.8 s: the ring flies apart; the launch-day spike grows from the bottom edge and its number counts up.
tl.fromTo('#h2', { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power2.in', immediateRender: false }, 5.8);
tl.to(ring, { x: (i) => R[i].dx, y: (i) => R[i].dy, rotation: (i) => R[i].rot, opacity: 0, duration: 0.5, ease: 'power2.in', stagger: { each: 0.004, from: 'random' } }, 5.9);
tl.fromTo(['#lvcap', '#lvn', '#floor'], { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in', immediateRender: false }, 5.9);
tl.fromTo('.dbar:not(.launch)', { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05, immediateRender: true }, 6.15);
tl.fromTo('.dbar.launch', { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'back.out(1.3)', immediateRender: true }, 6.15 + DATA.launchIndex * 0.05);
tl.fromTo('#h3', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 6.3);
tl.fromTo(res, { v: 0 }, { v: DATA.results, duration: 1.1, ease: 'power2.out', onUpdate: showRes, immediateRender: false }, 6.4);
tl.fromTo('#typical', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out', immediateRender: false }, 7.6);
${stripState(v, BEATS, 'sp', 3, 6.3)}

// 9.2 s: the bars sink, the ring comes back empty with a question mark, the call to action.
tl.fromTo('#h3', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 9.2);
tl.fromTo('#typical', { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, 9.2);
tl.to('.dbar', { scaleY: 0, duration: 0.4, ease: 'power2.in', stagger: { each: 0.02, from: 'end' } }, 9.2);
tl.set(ring, { fill: C.band }, 9.35);
tl.to(ring, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.004, from: 'random' } }, 9.4);
tl.fromTo(['#lvcap', '#floor'], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out', immediateRender: false }, 9.6);
tl.fromTo('#qm', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, 9.8);
tl.fromTo('#h4', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 9.6);
${stripState(v, BEATS, 'sp', 4, 9.6)}

// 11.2–11.8 s: back to the opening frame (hook, empty ring, level 1).
tl.fromTo('#h4', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 11.2);
tl.fromTo('#qm', { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, 11.2);
tl.fromTo(lvl, { v: N }, { v: 1, duration: 0.01, onUpdate: showLvl, immediateRender: false }, 11.3);
tl.fromTo('#lvn', { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, 11.45);
tl.fromTo('#h1', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, 11.4);
${stripState(v, BEATS, 'sp', 1, 11.4)}
`;

  const duration = 12;
  return {
    key: KEY,
    label: `Reel: XP and levels, the Level ${n} club and launch day (${duration} s feature reveal)`,
    caption: `XP and levels have been live on MySpeedPuzzling since ${f.launchDate}, and ${fmtInt(topLevel)} puzzlers already reached Level ${n}, the top level. Launch day was our busiest day ever: ${fmtInt(f.results)} results logged, ${f.multiple}× a typical day, many of them puzzles you solved weeks, months and years ago. What level are you? Check your profile and tell us in the comments.\n\n#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    duration,
    coverAt: 4.8,
    qaAt: [0, 1.6, 3.5, 4.8, 6.0, 7.9, 9.5, 10.6, 11.35, 11.95],
    html: composition({
      id: `${KEY}-${v.id.toLowerCase()}`, title: `${v.id} ${KEY}`, duration, ground: base, css, body,
      data: {
        ring: ring.map(({ id, dx, dy, rot }) => ({ id, dx, dy, rot })), results: f.results, launchIndex: days.indexOf(launch),
        colors: { band: base.band, cool: base.chart.cool, hot: base.chart.hot },
      },
      script,
    }),
    assets: {},
  };
}
