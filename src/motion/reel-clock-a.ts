// Reel "Your extra hour", concept A: the stopwatch double-take (owner 2026-10-22: "animated 'wow shocked' in a good
// way, WOW I HAVE AN EXTRA HOUR FOR A PUZZLE", "joyful, funny fact, how will YOU spend your extra hour?"). The MSP
// stopwatch (the logo rig) is the character. ~19 s:
//   0.0–1.6   splash, complete from frame 0: the logo (big), myspeedpuzzling.com, "Tonight at 3:00 / the clock goes
//             back", "Puzzlers, this is big.", a pile of loose pieces at the bottom
//   1.6–2.0   the lines lift away; the readout appears at 02:59:57 and the logo's hands jump to 2:59
//   2.0–2.6   it ticks to 03:00:00 … and snaps BACK to 02:00:00 (hands spin back, the frame shakes)   ← sound hit 2.6 s
//   2.9–3.7   the double-take: the stopwatch squashes, jumps for joy; "WOW." and the pile bursts into confetti
//   3.9–6.0   coral poster drops over the falling confetti: "Tonight you get +1 hour for puzzling?!"
//   6.2–9.4   at the typical pace: 60 minutes = 92 % of a 500 (a board fills to 92 %), "start 5 minutes early"
//   9.6–12.6  at the fastest pace: three whole 500s (16:30 each), with minutes to spare
//   12.8–15.8 funny fact: the clock goes back, your time doesn't
//   16.0–19.0 How will YOU spend your extra hour? A–D, comment
//   19.0–19.8 loop back to the splash
import { GROUNDS, W, X0, frame, groundVars, hero, outlinedLogo, pieceMark, posterTopPath, type Variant } from '../design/house.ts';
import { escapeHtml as h } from '../design/page.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import { BOARD_JS, CLOCK_CSS, CLOCK_JS, CX, HOUR, RW, SAFE, board, clockFacts, confettiPile, digital, endAsk, funnyFact, handAngles, handsSet, handsTo, minDown, splashText, tm, type ClockSpec } from './reel-clock-kit.ts';

const T = { lift: 1.6, tick: 2.0, snap: 2.6, take: 2.9, wow: 3.3, poster: 3.9, posterOut: 6.0, typical: 6.2, fast: 9.6, fact: 12.8, ask: 16.0, loop: 19.0 } as const;
const DURATION = 19.8;
const SEAM = 1262;
const LOGO = { cx: CX, cy: 470, width: 380 };
/** The typical-pace board (8 × 6 drawn pieces) and the three small fastest boards. */
const B = { cols: 8, rows: 6, pc: 60, x: CX - 4 * 60, y: 740 };
const SB = (i: number) => ({ cols: 8, rows: 6, pc: 34, x: X0 + 18 + i * 300, y: 820 });

export function reelClockAMotion(v: Variant, s: ClockSpec): Motion {
  const key = 'reel-clock-a';
  const coral = GROUNDS.coral;
  const f = clockFacts(s);
  const logo = logoExit(LOGO);
  const pile = confettiPile({ seed: 41, n: 24 });
  const main = s.boxes500[0];
  const big = board('tb', B, main.img, 12, { ghost: true });
  const fill = Math.round(big.pieces.length * f.share500);          // 92 % of the drawn pieces
  const smalls = [0, 1, 2].map(i => board(`fb${i}`, SB(i), s.boxes500[i % s.boxes500.length].img, 31 + i));
  const brands = [...new Set(s.boxes500.map(b => b.brand))].join(', ');

  const splash = `<div id="slogo">${logo.html}</div><div id="splash">${splashText(760)}</div>`;
  const tick = `<div id="tick" class="rc-beat">
    ${digital('dig', 820)}
    <p class="h-abs h-lead rc-mid" id="tl1" style="top:1060px; width:${RW}px">Clocks go back one hour</p>
  </div>
  <p class="rc-wow" id="wow" style="top:860px; font-size:250px; visibility:hidden">WOW.</p>`;
  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <header class="h-head" style="top:296px">${pieceMark('var(--g-device)')}<span class="h-kick">Clocks go back · Europe</span><span style="margin-left:auto">${outlinedLogo(96).replace('.svg"', '.svg?poster"')}</span></header>
      <p class="h-abs h-cap" style="top:480px">Tonight you get</p>
      ${hero('+1 hour', { size: 230, baseline: 720 })}
      <p class="rc-c" style="top:800px; font-size:96px; color:var(--g-ink)">for puzzling?!</p>
      <p class="h-abs h-lead" style="top:960px; width:${RW}px">Night of 24–25 October: 03:00 becomes 02:00 again.</p>
    </div>
  </div>`;
  const typical = `<div id="typical" class="rc-beat">
    <p class="h-abs h-cap" style="top:470px">At the typical pace</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">An hour is <span class="hot">${f.pct500} %</span> of a 500</p>
    <p class="h-abs h-lab rc-mid" style="top:1120px; width:${RW}px">Typical solo 500 on MSP: <b>${tm(s.s500.p50)}</b>. Start ${Math.ceil(f.shortBy / 60)} minutes early and it’s a whole one.</p>
  </div>`;
  const fast = `<div id="fast" class="rc-beat">
    <p class="h-abs h-cap" style="top:470px">At the fastest pace</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px"><span class="hot">${f.fastFit} whole 500s</span> in an hour</p>
    ${[0, 1, 2].map(i => `<p class="h-abs h-lab rc-ft" id="ft${i}" style="left:${SB(i).x}px; top:1050px; width:${SB(i).cols * SB(i).pc}px">${tm(s.s500.best)}</p>`).join('')}
    <p class="h-abs h-lab rc-mid" style="top:1120px; width:${RW}px">The fastest solo 500 on MSP: <b>${tm(s.s500.best)}</b>. Three of those, and ${minDown(f.spare)} minutes to spare.</p>
  </div>`;
  const credit = `<p class="h-abs h-credit" id="credit" style="top:1210px; width:${RW}px">Pictures: ${h(brands)} puzzles</p>`;

  const body = `${splash}${tick}${big.svg}${smalls.map(b => b.svg).join('')}${typical}${fast}${funnyFact(s)}${endAsk()}${credit}${poster}${pile.html}`;

  const css = LOGO_CSS + CLOCK_CSS + `
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
#poster, #ptext, #tb, #fb0, #fb1, #fb2, #credit { visibility: hidden; opacity: 0; }
#poster { position: absolute; inset: 0; z-index: 5; }
.rc-mid { text-align: center; }
.rc-ft { text-align: center; color: var(--g-hot); font-weight: 700; font-size: 40px; }
#tb .rc-pc { stroke-width: 1.6; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Clocks go back · Europe', device: v.device, src: `Solo results · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const a259 = handAngles(2, 59), a300 = handAngles(3, 0, 1), a200 = handAngles(2, 0);
  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';
const beat = (id, at, out, extra) => { show('#' + id, at, 0.01); riseIn('#' + id + ' > *', at, { stagger: 0.12, dur: 0.35 }); if (extra) extra(at); hide('#' + id, out - 0.3); };

// ---- splash lines lift away; the logo stays: it's the character. Trails off, hands to 2:59
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.lift);
tl.set('#splash', { autoAlpha: 0 }, T.lift + 0.4);
tl.set('#trails', { autoAlpha: 0 }, T.lift);
${handsTo(a259, T.lift, 0.35, 'power3.out')}
digSet('dig', 2 * 3600 + 59 * 60 + 57);
show('#tick', T.lift + 0.15, 0.01);
riseIn('#tick > *', T.lift + 0.3, { stagger: 0.1, dur: 0.3 });

// ---- 02:59:57 → 03:00:00, the minute hand creeps to 12 … and SNAPS back to 02:00 (both hands spin back)
digRun('dig', 2 * 3600 + 59 * 60 + 57, 3 * 3600, T.tick, T.snap - T.tick);
${handsTo(a300, T.tick, T.snap - T.tick, 'none')}
digJump('dig', 2 * 3600, T.snap);
${handsTo({ min: a200.min, hour: a200.hour }, T.snap, 0.45, 'power3.out')}
flash('#dig', T.snap);
tl.to('#dig', { color: '${GROUNDS.navy.hot}', duration: 0.05 }, T.snap);
shake('.hf', T.snap, 22, 0.4);

// ---- the double-take: squash, jump for joy (stretch), land; speed lines; WOW.
tl.to('#mark', { scaleX: 1.14, scaleY: 0.84, transformOrigin: '50% 100%', duration: 0.14, ease: 'power2.out' }, T.take);
tl.to('#mark', { scaleX: 0.92, scaleY: 1.12, y: -110, rotation: -8, duration: 0.24, ease: 'power3.out' }, T.take + 0.14);
tl.to('#mark', { scaleX: 1, scaleY: 1, y: 0, rotation: 6, duration: 0.22, ease: 'power2.in' }, T.take + 0.38);
tl.to('#mark', { rotation: 0, duration: 0.2, ease: 'back.out(3)' }, T.take + 0.6);
hide('#tick', T.wow - 0.1, 0.1);
tl.set('#wow', { autoAlpha: 1 }, T.wow);
popIn('#wow', T.wow, { scale: 0.3, dur: 0.35 });
shake('#wow', T.wow + 0.3, 10, 0.25);
burst(D.pile, T.wow + 0.05);
// the poster drops over the falling confetti (the pile goes under it)
tl.set('#cf', { zIndex: 4 }, T.poster);

// ---- coral poster drops: +1 hour for puzzling?!, the pile bursts into confetti
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.poster);
${logo.out(T.poster)}
tl.set('#wow', { autoAlpha: 0 }, T.poster + 0.3);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.3);
popIn('#ptext .h-big', T.poster + 0.32, { from: '50% 80%', scale: 0.5 });
riseIn('#ptext .rc-c, #ptext .h-lead', T.poster + 0.55, { stagger: 0.15, dur: 0.3 });
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.to('#poster', { y: -${SEAM + 140}, duration: 0.38, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.49);
show([MAST, '#credit'], T.posterOut + 0.2, 0.2);

// ---- typical pace: the board fills to 92 % while the hour runs out
beat('typical', T.typical, T.fast);
show('#tb', T.typical, 0.2);
flyPieces('tb', D.big, T.typical + 0.3, 2.2, D.fill);
hide('#tb', T.fast - 0.3);

// ---- fastest pace: three small boards, one after another
beat('fast', T.fast, T.fact, at => {
  D.smalls.forEach((b, i) => { show('#fb' + i, at, 0.01); flyPieces('fb' + i, b, at + 0.2 + i * 0.6, 0.6); popIn('#ft' + i, at + 0.85 + i * 0.6, { scale: 0.5 }); });
});
hide(['#fb0', '#fb1', '#fb2', '#credit'], T.fact - 0.3);

// ---- funny fact, then the question
beat('fact', T.fact, T.ask);
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
tl.set('#cf', { zIndex: 6 }, T.loop);
pileBack(D.pile, T.loop + 0.15);
tl.set({}, {}, ${DURATION});
`;
  const data = { T, pile: pile.list, big: big.pieces, fill, smalls: smalls.map(b => b.pieces) };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.9, 2.5, 2.8, 3.6, 4.8, 7.5, 9.0, 11.5, 14.5, 18.0, DURATION - 0.05],
    html: composition({ key, title: 'Reel extra hour (A: double-take)', duration: DURATION, frameHtml, css, data, script: CLOCK_JS + BOARD_JS + script }),
  };
}
