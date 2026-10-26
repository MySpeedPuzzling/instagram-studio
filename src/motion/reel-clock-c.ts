// Reel "Your extra hour", concept C: the hour becomes a piece (owner 2026-10-22: "joyful, funny fact, WOW I have an
// extra hour for a puzzle", "draft all three"). A big clock face is the character: it snaps back from 03:00 to 02:00,
// the hour between 2 and 3 lights up coral and lifts out of the dial as a generator piece, which flies into the one
// gap of a 500 and completes it. Round 2 (owner 2026-10-23, picked C: "the clocks can go several times back like Back
// to the Future", "start at 57 seconds", "the 1 h going back was way too fast, I did not even notice", "slides with
// much text: keep them longer"; a different Ravensburger than before). ~28 s:
//   0.0–1.4   splash, complete from frame 0: the logo, myspeedpuzzling.com, "Tonight at 3:00 / the clock goes back",
//             "Puzzlers, this is big.", the clock face at 2:59 below, loose pieces at the bottom
//   1.4–1.9   the logo exits, the lines lift away, the clock face rises to the middle and grows; readout 02:59:57
//   1.9–3.5   tick … tick … tick: 58, 59, 03:00:00 (one step every 0.8 s), held to 4.7 (round 3: +1 s)
//   4.7–6.5   the rewind: the readout races back to 02:00:00, the minute hand whirls back a lap, flickering, the
//             frame trembles: "Rewinding…" (round 3: no overshoot, "Whoa, too far!" wasn't clear)
//   6.5       lands on 02:00:00 (coral, shake)                                                       ← sound hit 6.5 s
//   6.8–8.2   the slice from 2 to 3 lights up and pulses: "The hour from 2 to 3 happens twice"
//   8.2–9.5   it pops out as a puzzle piece; the clock leaves, a 500 with one gap rises in; the piece flies in and snaps
//   9.5       the snap: burst of confetti, the coral piece turns into its part of the picture         ← second hit 9.5 s
//   9.65–12.6 "Tonight you get +1 hour = one more puzzle!"
//   12.8–18.0 how much puzzle is an hour: the bars arrive empty and fill (an hour runs along the typical 500, the
//             missing minutes poke out; then three fastest 500s one by one)
//   18.2–22.3 funny fact: the clock goes back, your time doesn't
//   22.5–26.9 How will YOU spend your extra hour?
//   26.9–27.7 loop back to the splash
import { GROUNDS, X0, f1, frame, hero, type Variant } from '../design/house.ts';
import { escapeHtml as h } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import { BOARD_JS, CLOCK_CSS, CLOCK_JS, CONFETTI, CX, HOUR, RW, SAFE, board, clockFacts, confettiPile, digital, endAsk, funnyFact, minDown, splashText, tm, type ClockSpec } from './reel-clock-kit.ts';

const T = { out: 1.4, tick: 1.9, step: 0.8, rew: 4.7, snap: 6.5, wedge: 6.8, pop: 8.2, lift: 8.55, fly: 8.9, land: 9.5, title: 9.65, data: 12.8, fact: 18.2, ask: 22.5, loop: 26.9 } as const;
const DURATION = 27.7;
const LOGO = { cx: CX, cy: 390, width: 260 };
/** The clock face: an SVG 600 × 600 (user space −300…300) centred at (CX, DIAL_CY) during the clock beat; on the
 *  splash it sits lower and smaller (y offset and scale applied by GSAP). */
const DIAL_R = 280, DIAL_CY = 680, SPL = { dy: 1290 - DIAL_CY, s: 0.78 };
/** Where the piece sits on the dial: the middle of the 2–3 o'clock slice (clock angle 75°), a bit outwards. */
const WEDGE = { deg: 75, r: 0.6 * DIAL_R, scale: 1.6, rot: -15 };
/** The 500 with one gap (row 2, col 5: an inner piece with knobs on every side). */
const B = { cols: 8, rows: 6, pc: 70, x: CX - 4 * 70, y: 640 };
const HOLE = { row: 2, col: 5 };
/** Hour bars: the track is one hour. */
const TW = Math.round(RW * 0.86);

const polar = (deg: number, r: number) => ({ x: r * Math.sin(deg * Math.PI / 180), y: -r * Math.cos(deg * Math.PI / 180) });

/** The clock face SVG (house colours: deep band face, white ticks and hour hand, coral minute hand and hub). */
function dial(): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = polar(i * 30, DIAL_R - 26), b = polar(i * 30, DIAL_R - (i % 3 ? 58 : 84));
    return `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" stroke="#ffffff" stroke-width="${i % 3 ? 10 : 16}" stroke-linecap="round"/>`;
  }).join('');
  const w0 = polar(60, DIAL_R - 14), w1 = polar(90, DIAL_R - 14);
  const wedge = `<path id="wedge" d="M0 0 L${f1(w0.x)} ${f1(w0.y)} A${DIAL_R - 14} ${DIAL_R - 14} 0 0 1 ${f1(w1.x)} ${f1(w1.y)} Z" fill="${GROUNDS.coral.bg}"/>`;
  return `<div id="dial" style="position:absolute; left:${CX - 300}px; top:${DIAL_CY - 300}px; width:600px; height:600px">
    <svg width="600" height="600" viewBox="-300 -300 600 600" style="overflow:visible" aria-hidden="true">
      <circle r="${DIAL_R + 18}" fill="#ffffff"/>
      <circle r="${DIAL_R}" fill="${GROUNDS.navy.band}"/>
      ${wedge}
      ${ticks}
      <line id="dh-hour" x1="0" y1="24" x2="0" y2="-150" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>
      <line id="dh-min" x1="0" y1="34" x2="0" y2="-232" stroke="${GROUNDS.coral.bg}" stroke-width="14" stroke-linecap="round"/>
      <circle r="22" fill="${GROUNDS.coral.bg}" stroke="#ffffff" stroke-width="6"/>
    </svg>
  </div>`;
}

export function reelClockCMotion(v: Variant, s: ClockSpec): Motion {
  const key = 'reel-clock-c';
  const f = clockFacts(s);
  const logo = logoExit(LOGO);
  const pile = confettiPile({ seed: 57, colors: CONFETTI, n: 16, top: 1520 });
  const main = s.boxes500[0];

  // ---------------------------------------------------------------- the board and its gap
  const bd = board('hb', B, main.img, 14, { ghost: true });
  // the gap's outline: the same generator call board() makes, so the path is identical to the board's piece
  const jig = generateJigsaw({ cols: B.cols, rows: B.rows, width: B.cols * B.pc, height: B.rows * B.pc, seed: 14, tabSize: 0.24, jitter: 0.04 });
  const gap = jig.pieces.find(p => p.row === HOLE.row && p.col === HOLE.col)!;
  const m = bd.svg.match(new RegExp(`id="hb-(\\d+)" d="${gap.d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  if (!m) throw new Error('reel-clock-c: the gap piece is not on the board');
  const gapIdx = Number(m[1]);
  const bb = gap.bbox;
  // the flying piece: absolutely placed exactly over the gap; GSAP offsets it onto the dial and back
  const fin = { cx: B.x + bb.x + bb.width / 2, cy: B.y + bb.y + bb.height / 2 };
  const onDial = polar(WEDGE.deg, WEDGE.r);
  const off = { x: f1(CX + onDial.x - fin.cx), y: f1(DIAL_CY + onDial.y - fin.cy) };
  const piece = `<div id="hp" style="position:absolute; left:${f1(B.x + bb.x)}px; top:${f1(B.y + bb.y)}px; width:${f1(bb.width)}px; height:${f1(bb.height)}px">
    <svg width="${f1(bb.width)}" height="${f1(bb.height)}" viewBox="${f1(bb.x)} ${f1(bb.y)} ${f1(bb.width)} ${f1(bb.height)}" style="overflow:visible" aria-hidden="true">
      <path d="${gap.d}" fill="${GROUNDS.coral.bg}" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
    </svg>
  </div>`;

  // ---------------------------------------------------------------- beats
  const splash = `<div id="slogo">${logo.html}</div><div id="splash">${splashText(560)}</div>`;
  const tick = `<div id="tick" class="rc-beat">
    ${digital('dig', 1010, 150)}
    <p class="h-abs h-lead rc-mid rcc-say" id="say0" style="top:1186px; width:${RW}px">Rewinding…</p>
    <p class="h-abs h-lead rc-mid rcc-say" id="say2" style="top:1186px; width:${RW}px">The hour from 2 to 3 happens <b class="hot">twice</b></p>
  </div>`;
  const title = `<div id="title" class="rc-beat">
    <p class="h-abs h-cap rc-mid" style="top:300px; width:${RW}px">Tonight you get</p>
    ${hero('+1 hour', { size: 190, baseline: 540, hot: true, center: true })}
    <p class="rc-c" style="top:1100px; font-size:80px">= one more puzzle!</p>
  </div>`;
  const credit = `<p class="h-abs h-credit rc-mid" id="credit" style="top:1210px; width:${RW}px">${h(main.puzzle)} · ${h(main.brand)}</p>`;
  const typW = Math.round(TW * s.s500.p50 / HOUR), fastW = Math.round(TW * s.s500.best / HOUR);
  const data = `<div id="data" class="rc-beat">
    <p class="h-abs h-cap" style="top:470px">Solo 500s on MSP</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">How much puzzle is an hour?</p>
    <p class="h-abs h-lab" style="top:650px">Typical pace: <b>${tm(s.s500.p50)}</b></p>
    <p class="h-abs h-lab rcc-end" style="top:650px">1 hour</p>
    <div class="rcc-bar" style="top:700px"><i class="rcc-typ" style="width:${Math.min(TW, typW)}px"></i><i class="rcc-over" style="left:${TW}px; width:${Math.max(0, typW - TW)}px"></i></div>
    <p class="h-abs h-lab" style="top:784px; width:${RW}px">An hour is <b class="hot">${f.pct500} %</b> of one. Start ${Math.ceil(f.shortBy / 60)} minutes early!</p>
    <p class="h-abs h-lab" style="top:900px">Fastest on MSP: <b>${tm(s.s500.best)}</b></p>
    <div class="rcc-bar" style="top:950px">${Array.from({ length: f.fastFit }, (_, i) => `<i class="rcc-fast" style="left:${i * fastW}px; width:${fastW - 4}px"></i>`).join('')}</div>
    <p class="h-abs h-lab" style="top:1034px; width:${RW}px"><b class="hot">${f.fastFit} whole 500s</b>, and ${minDown(f.spare)} minutes to spare.</p>
  </div>`;

  const body = `${splash}${dial()}${tick}${bd.svg}${piece}${title}${credit}${data}${funnyFact(s)}${endAsk()}${pile.html}`;

  const css = LOGO_CSS + CLOCK_CSS + `
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
#hb, #hp, #credit, #wedge, .rcc-say { visibility: hidden; opacity: 0; }
#hb .rc-pc { opacity: 1; stroke-width: 1.6; }
#hb #hb-${gapIdx} { opacity: 0; } /* beats #hb .rc-pc; GSAP's inline opacity beats both (no !important: it kept the gap empty) */
#hb .rc-ghost { fill: ${GROUNDS.navy.band}; }
.rc-mid { text-align: center; }
.rcc-end { left: ${X0 + TW - 200}px; width: 200px; text-align: right; }
.rcc-bar { position: absolute; left: ${X0}px; width: ${TW}px; height: 64px; border-radius: 14px; background: var(--g-band);
  box-shadow: inset -4px 0 0 var(--g-soft); }
.rcc-bar i { position: absolute; top: 0; height: 64px; border-radius: 14px; }
.rcc-typ { left: 0; background: var(--g-accent); }
.rcc-over { background: var(--g-hot); border-radius: 0 14px 14px 0 !important; }
.rcc-fast { background: var(--g-accent); }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Clocks go back · Europe', device: v.device, src: `Solo results · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';
const beat = (id, at, out, extra) => { show('#' + id, at, 0.01); riseIn('#' + id + ' > *', at, { stagger: 0.12, dur: 0.35 }); if (extra) extra(at); hide('#' + id, out - 0.3); };
const hands = (min, hour, at, dur, ease) => {
  tl.to('#dh-min', { rotation: min, svgOrigin: '0 0', duration: dur, ease: ease }, at);
  tl.to('#dh-hour', { rotation: hour, svgOrigin: '0 0', duration: dur, ease: ease }, at);
};
// frame 0: the clock face low and small at 2:59; the piece waits on the dial (hidden)
gsap.set('#dial', { y: D.spl.dy, scale: D.spl.s, transformOrigin: '50% 50%' });
gsap.set('#dh-min', { rotation: 354, svgOrigin: '0 0' });
gsap.set('#dh-hour', { rotation: 89.5, svgOrigin: '0 0' });
gsap.set('.rcc-typ, .rcc-over, .rcc-fast', { scaleX: 0, transformOrigin: '0% 50%' });
gsap.set('#hp', { x: D.off.x, y: D.off.y, scale: D.w.scale, rotation: D.w.rot, transformOrigin: '50% 50%' });
digSet('dig', 2 * 3600 + 59 * 60 + 57);

// ---- the logo exits, the lines lift away, the clock face rises and grows
${logo.out(T.out - 0.1)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.out + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.out + 0.45);
tl.to('#dial', { y: 0, scale: 1, duration: 0.4, ease: 'power3.inOut' }, T.out + 0.3);  // after the logo's exit has cleared
show('#tick', T.out + 0.55, 0.01);
riseIn('#tick > .rc-dig', T.out + 0.55, { dur: 0.25 });  // once the rising dial has passed

// ---- tick … tick … tick: 02:59:58, 02:59:59, 03:00:00 (the minute hand steps up to 12 with each)
[58, 59, 60].forEach((sec, k) => {
  const at = T.tick + k * T.step;
  digJump('dig', 2 * 3600 + 59 * 60 + sec, at);
  hands(354 + (k + 1) * 2, 89.5 + (k + 1) / 6, at, 0.12, 'back.out(3)');
  tl.fromTo('#dig', { scale: 1.06 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.3, ease: 'power2.out', immediateRender: false }, at);
});

// ---- the rewind: 03:00:00 rolls back to 02:00:00 over 1.8 s (the minute hand whirls back a full lap, the hour hand
// back a step), the readout races back with it, flickering, the frame trembles (owner round 3: no overshoot)
show('#say0', T.rew, 0.15);
digRun('dig', 3 * 3600, 2 * 3600, T.rew, T.snap - T.rew, 'power2.inOut');
hands(0, 60, T.rew, T.snap - T.rew, 'power2.inOut');
for (let i = 0; i < 8; i++) tl.to('#dig', { color: i % 2 ? '#ffffff' : '${GROUNDS.navy.hot}', duration: 0.02 }, T.rew + 0.1 + i * 0.2);
shake('.hf', T.rew + 0.2, 7, T.snap - T.rew - 0.3);
hide('#say0', T.snap - 0.05, 0.1);
flash('#dig', T.snap);
tl.to('#dig', { color: '${GROUNDS.navy.hot}', duration: 0.05 }, T.snap);
shake('.hf', T.snap, 22, 0.4);
show('#say2', T.wedge + 0.15, 0.01);
riseIn('#say2', T.wedge + 0.15, { dur: 0.3 });

// ---- the slice from 2 to 3 lights up, then turns into a piece that pops out of the dial
tl.fromTo('#wedge', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, T.wedge);
tl.fromTo('#wedge', { scale: 1 }, { scale: 1.07, svgOrigin: '0 0', duration: 0.18, yoyo: true, repeat: 5, immediateRender: false }, T.wedge + 0.2);
tl.set('#hp', { autoAlpha: 1 }, T.pop);
tl.fromTo('#hp', { scale: 0.4 }, { scale: D.w.scale, duration: 0.32, ease: 'back.out(2.4)', immediateRender: false }, T.pop);
tl.to('#wedge', { autoAlpha: 0, duration: 0.15 }, T.pop + 0.1);
tl.to('#hp', { y: D.off.y - 46, rotation: D.w.rot + 12, duration: 0.18, ease: 'power2.out' }, T.lift);
tl.to('#hp', { rotation: D.w.rot - 10, duration: 0.14, ease: 'sine.inOut' }, T.lift + 0.18);

// ---- the clock leaves, the 500 rises in with its gap; the piece flies in, spinning, and snaps
hide('#tick', T.lift + 0.05, 0.15);
tl.to('#dial', { y: -1300, duration: 0.4, ease: 'power2.in' }, T.lift + 0.1);
tl.set('#hb', { autoAlpha: 1 }, T.lift + 0.2);
tl.fromTo('#hb', { y: 900 }, { y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, T.lift + 0.2);
show('#credit', T.lift + 0.4);
tl.to('#hp', { x: 0, y: 0, scale: 1, rotation: 360, duration: T.land - T.fly, ease: 'power3.inOut' }, T.fly);
tl.set('#hp', { rotation: 0 }, T.land);
tl.to('#hb-' + D.gap, { opacity: 1, duration: 0.25 }, T.land + 0.05);
tl.to('#hp', { autoAlpha: 0, duration: 0.25 }, T.land + 0.08);
flash('#hb', T.land);
shake('.hf', T.land, 10, 0.25);
burst(D.pile, T.land);

// ---- +1 hour = one more puzzle!
show('#title', T.title, 0.01);
riseIn('#title > .h-cap', T.title, { dur: 0.3 });
popIn('#title .h-big', T.title + 0.1, { from: '50% 80%', scale: 0.4 });
riseIn('#title > .rc-c', T.title + 0.5, { dur: 0.35 });
hide(['#title', '#hb', '#credit'], T.data - 0.3);

// ---- how much puzzle is an hour: the bars fill
show(MAST, T.data - 0.1, 0.2);
beat('data', T.data, T.fact);
// the bars arrive empty (set before anything shows) and fill: the hour runs out along the typical bar (linear, like
// time), the missing minutes poke out in coral; then the three fastest 500s fill one after another
tl.fromTo('.rcc-typ', { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: 1.6, ease: 'none', immediateRender: false }, T.data + 0.6);
tl.fromTo('.rcc-over', { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: 0.35, ease: 'power2.out', immediateRender: false }, T.data + 2.2);
flash('.rcc-over', T.data + 2.55);
document.querySelectorAll('.rcc-fast').forEach((el, i) => tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: 0.45, ease: 'power1.inOut', immediateRender: false }, T.data + 2.9 + i * 0.5));

// ---- funny fact, then the question
beat('fact', T.fact, T.ask);
show('#ask', T.ask, 0.01);
riseIn('#ask > .h-ask', T.ask, { dur: 0.35 });
riseIn('#ask .rc-opt', T.ask + 0.3, { stagger: 0.18, dur: 0.3 });
riseIn('#ask > .h-lead', T.ask + 1.1, { dur: 0.3 });

// ---- loop: back to the splash (frame 0): the clock face drops back in at 2:59, the logo returns
hide(['#ask', MAST], T.loop, 0.25);
tl.set('#dig', { color: '' }, T.loop);
tl.set('#dh-min', { rotation: -6, svgOrigin: '0 0' }, T.loop + 0.1);
tl.set('#dh-hour', { rotation: 89.5, svgOrigin: '0 0' }, T.loop + 0.1);
tl.fromTo('#dial', { y: 1300, scale: D.spl.s }, { y: D.spl.dy, scale: D.spl.s, duration: 0.45, ease: 'power3.out', immediateRender: false }, T.loop + 0.15);
${logo.back(T.loop + 0.15)}
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.2);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.2);
tl.set('#hb-' + D.gap, { opacity: 0 }, T.loop);
pileBack(D.pile, T.loop + 0.15);
tl.set({}, {}, ${DURATION});
`;
  const dataJs = { T, pile: pile.list, gap: gapIdx, off, spl: SPL, w: WEDGE };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.8, 2.3, 3.6, 4.5, 5.6, 6.6, 7.6, 8.4, 9.2, 10.5, 12.0, 12.9, 14.0, 15.5, 17.5, 20.0, 25.0, DURATION - 0.05],
    html: composition({ key, title: 'Reel extra hour (C: the hour becomes a piece)', duration: DURATION, frameHtml, css, data: dataJs, script: CLOCK_JS + BOARD_JS + script }),
  };
}
