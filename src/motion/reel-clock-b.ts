// Reel "Your extra hour", concept B: the extra-hour slot machine (owner 2026-10-22: "joyful, funny fact, WOW I have an
// extra hour for a puzzle", "draft all three"). After a quick snap-back 03:00 → 02:00, a slot machine rolls through real
// box pictures and lands three times on what fits into the extra hour. ~20.8 s:
//   0.0–1.4   splash, complete from frame 0: the logo, myspeedpuzzling.com, "Tonight at 3:00 / the clock goes back",
//             "Puzzlers, this is big.", a pile of loose pieces at the bottom
//   1.4–2.1   the lines lift away; the readout ticks 02:59:58 → 03:00:00 and the logo's hands follow
//   2.1       SNAP back to 02:00:00 (hands spin back, the frame shakes)                         ← sound hit 2.1 s
//   2.45–3.4  the logo exits; "+1 hour / What fits in?" pops (3.1), the slot window opens
//   3.4–6.8   spin 1 lands (4.3): almost a whole 500 at the typical pace
//   6.9–10.4  spin 2 lands (7.8): 3 whole 500s at the fastest pace, minutes to spare
//   10.5–14.0 spin 3 lands (11.4): almost a third of a 1000; the pile bursts into confetti
//   14.2–17.0 funny fact: the clock goes back, your time doesn't
//   17.2–20.0 How will YOU spend your extra hour? A–D, comment
//   20.0–20.8 loop back to the splash
// Rolling rows are box pictures only (never people). Text only in the Reel safe area (x 60–960, y 220–1250).
import { frame, hero, type Variant } from '../design/house.ts';
import { escapeHtml as h } from '../design/page.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import { CLOCK_CSS, CLOCK_JS, CX, RW, SAFE, clockFacts, confettiPile, digital, endAsk, funnyFact, handAngles, handsSet, handsTo, minDown, splashText, tm, type ClockSpec } from './reel-clock-kit.ts';

const T = { lift: 1.4, tick: 1.7, snap: 2.1, out: 2.45, head: 3.1, spin: [3.4, 6.9, 10.5], fact: 14.2, ask: 17.2, loop: 20.0 } as const;
const SPIN = 0.9;
const DURATION = 20.8;
const LOGO = { cx: CX, cy: 470, width: 380 };
/** The slot window (one reel, wide) and its rows. */
const WIN = { x: CX - 360, y: 690, w: 720, h: 280 };
const ROWS = 8;

/** One row of the reel: one big picture or three small ones (box picture classes .bx0…). */
const row = (pics: number[]) => `<div class="rc-row">${pics.map(p => `<div class="bx bx${p}${pics.length > 1 ? ' sm' : ''}"></div>`).join('')}</div>`;

export function reelClockBMotion(v: Variant, s: ClockSpec): Motion {
  const key = 'reel-clock-b';
  const f = clockFacts(s);
  const logo = logoExit(LOGO);
  const pile = confettiPile({ seed: 43, n: 24 });
  const boxes = [...s.boxes500, s.box1000];
  const i1000 = boxes.length - 1;
  const brands = [...new Set(boxes.map(b => b.brand))].join(', ');

  // the three landings: what each reel ends on, and its result text
  const third = f.share1000 >= 1 / 3 ? 'A third of a 1000' : 'Almost a third of a 1000';
  const lands = [
    { pics: [0], cap: 'At the typical pace', big: f.share500 >= 1 ? 'A whole 500' : 'Almost a whole 500',
      lab: `An hour is <b>${f.pct500} %</b> of a typical solo 500 (${tm(s.s500.p50)}).` },
    { pics: s.boxes500.slice(0, 3).map((_, i) => i), cap: 'At the fastest pace', big: `${f.fastFit} whole 500s`,
      lab: `Fastest solo 500 on MSP: <b>${tm(s.s500.best)}</b>. ${minDown(f.spare)} minutes to spare.` },
    { pics: [i1000], cap: 'Or start something big', big: third,
      lab: `A typical solo 1000 takes <b>${tm(s.s1000.p50)}</b>.` },
  ];
  // each reel starts on the previous reel's landing, rolls past other pictures and lands on its own
  const fillers = [[1], [0, 2, 1], [i1000], [2], [1, 0, 2], [0], [i1000]];
  const reels = lands.map((l, k) => {
    const first = k ? lands[k - 1].pics : [i1000];
    const mid = Array.from({ length: ROWS - 2 }, (_, j) => fillers[(j + k * 2) % fillers.length]);
    return `<div class="rc-col" id="col${k}">${[first, ...mid, l.pics].map(row).join('')}</div>`;
  }).join('');
  const results = lands.map((l, k) => `<div class="rc-beat rc-res" id="res${k}">
      <p class="h-abs h-cap rc-mid" style="top:1018px; width:${RW}px">${h(l.cap)}</p>
      <p class="rc-c rc-big" style="top:1056px">${h(l.big)}</p>
      <p class="h-abs h-lab rc-mid" style="top:1146px; width:${RW}px">${l.lab}</p>
    </div>`).join('');

  const splash = `<div id="slogo">${logo.html}</div><div id="splash">${splashText(760)}</div>`;
  const tick = `<div id="tick" class="rc-beat">
    ${digital('dig', 820)}
    <p class="h-abs h-lead rc-mid" style="top:1060px; width:${RW}px">Clocks go back one hour</p>
  </div>`;
  const head = `<div id="head" class="rc-beat">
    ${hero('+1 hour', { size: 150, baseline: 590, center: true, hot: true }).replace('<p class="h-big', '<p id="plus" class="h-big')}
    <p class="rc-c" id="fits" style="top:616px; font-size:60px">What fits in?</p>
  </div>
  <div id="win" style="left:${WIN.x}px; top:${WIN.y}px; width:${WIN.w}px; height:${WIN.h}px">${reels}</div>`;
  const credit = `<p class="h-abs h-credit rc-mid" id="credit" style="top:980px; width:${RW}px">Pictures: ${h(brands)} puzzles</p>`;

  const body = `${splash}${tick}${head}${results}${funnyFact(s)}${endAsk()}${credit}${pile.html}`;

  const css = LOGO_CSS + CLOCK_CSS + `
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
#win, #credit, .rc-col { visibility: hidden; opacity: 0; }
.rc-mid { text-align: center; }
.rc-big { font-size: 76px; color: var(--g-hot); }
#win { position: absolute; overflow: hidden; border-radius: 28px; background: var(--g-band); box-shadow: inset 0 0 0 8px var(--g-hot); }
.rc-col { position: absolute; left: 0; top: 0; width: 100%; }
.rc-row { height: ${WIN.h}px; display: flex; align-items: center; justify-content: center; gap: 18px; }
.bx { width: 330px; height: 234px; border-radius: 10px; background-size: cover; background-position: center; }
.bx.sm { width: 210px; height: 158px; }
.rc-res .h-lab { font-size: 36px; }
${boxes.map((b, i) => `.bx${i} { background-image: url("${b.img}"); }`).join('\n')}
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Clocks go back · Europe', device: v.device, src: `Solo results · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const a259 = handAngles(2, 59), a300 = handAngles(3, 0, 1), a200 = handAngles(2, 0);
  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';

// ---- splash lines lift away; trails off, hands to 2:59; the readout appears
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.lift);
tl.set('#splash', { autoAlpha: 0 }, T.lift + 0.4);
tl.set('#trails', { autoAlpha: 0 }, T.lift);
${handsTo(a259, T.lift, 0.3, 'power3.out')}
digSet('dig', 2 * 3600 + 59 * 60 + 58);
show('#tick', T.lift + 0.1, 0.01);
riseIn('#tick > *', T.lift + 0.3, { stagger: 0.1, dur: 0.25 });

// ---- 02:59:58 → 03:00:00 … SNAP back to 02:00:00
digRun('dig', 2 * 3600 + 59 * 60 + 58, 3 * 3600, T.tick, T.snap - T.tick);
${handsTo(a300, T.tick, T.snap - T.tick, 'none')}
digJump('dig', 2 * 3600, T.snap);
${handsTo({ min: a200.min, hour: a200.hour }, T.snap, 0.3, 'power3.out')}
flash('#dig', T.snap);
tl.to('#dig', { color: D.hot, duration: 0.05 }, T.snap);
shake('.hf', T.snap, 22, 0.35);

// ---- the logo exits; +1 hour, what fits in? The slot window opens
hide('#tick', T.out, 0.15);
${logo.out(T.out)}
show('#head', T.head, 0.01);
tl.set('#plus', { autoAlpha: 1 }, T.head);
popIn('#plus', T.head, { scale: 0.3, dur: 0.35 });
riseIn('#fits', T.head + 0.2, { dur: 0.3 });
show([MAST, '#credit'], T.head + 0.2, 0.2);
tl.set('#win', { autoAlpha: 1 }, T.head + 0.1);
tl.fromTo('#win', { scaleY: 0.1, transformOrigin: '50% 50%' }, { scaleY: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, T.head + 0.1);
tl.set('#col0', { autoAlpha: 1 }, T.head + 0.1);

// ---- three spins; each lands, flashes, and its result rises in
D.spins.forEach((at, k) => {
  if (k) { tl.set('#col' + (k - 1), { autoAlpha: 0 }, at); tl.set('#col' + k, { autoAlpha: 1 }, at); hide('#res' + (k - 1), at - 0.1, 0.15); }
  slotLand('#col' + k, at, { dur: D.SPIN });
  flash('#win', at + D.SPIN - 0.1);
  show('#res' + k, at + D.SPIN - 0.15, 0.01);
  riseIn('#res' + k + ' > *', at + D.SPIN - 0.15, { stagger: 0.12, dur: 0.3 });
});
burst(D.pile, D.spins[2] + D.SPIN - 0.1);
hide(['#head', '#win', '#res2', '#credit'], T.fact - 0.25, 0.2);

// ---- funny fact, then the question
show('#fact', T.fact, 0.01);
riseIn('#fact > *', T.fact, { stagger: 0.12, dur: 0.35 });
hide('#fact', T.ask - 0.3);
show('#ask', T.ask, 0.01);
riseIn('#ask > .h-ask', T.ask, { dur: 0.35 });
riseIn('#ask .rc-opt', T.ask + 0.3, { stagger: 0.18, dur: 0.3 });
riseIn('#ask > .h-lead', T.ask + 1.1, { dur: 0.3 });

// ---- loop: back to the splash (frame 0)
hide(['#ask', MAST], T.loop, 0.25);
tl.set('#trails', { autoAlpha: 1 }, T.loop + 0.2);
${handsSet({ min: 0, hour: 0 }, T.loop + 0.2)}
${logo.back(T.loop + 0.2)}
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.25);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.25);
tl.set('#dig', { color: '' }, T.loop);
pileBack(D.pile, T.loop + 0.15);
tl.set({}, {}, ${DURATION});
`;
  const data = { T, spins: T.spin, SPIN, pile: pile.list, hot: '#ec726f' };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.9, 2.3, 3.3, 3.8, 5.5, 7.4, 9.0, 11.0, 12.6, 15.5, 19.0, DURATION - 0.05],
    html: composition({ key, title: 'Reel extra hour (B: slot machine)', duration: DURATION, frameHtml, css, data, script: CLOCK_JS + script }),
  };
}
