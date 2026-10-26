// Reel "Find your missing piece" (partner finder launch, 2026-10-22): a catchy new-feature alert. Event-neutral
// (owner: never hang a feature launch on one organiser's event). Big titles, little to read, real UI as examples,
// and a "Tap" pointer at every button so it's clear where to click (owner, round 2). ~26 s:
//   0.0–2.4   splash, complete from frame 0: the MSP logo, myspeedpuzzling.com, "Looking for / a pair or a team?"
//             (both cases in coral: "pair partner" alone read as pairs only), "at a puzzle competition", a coral
//             generator piece with the dashed outlines of the other three, a tilted NEW sticker
//   2.4–2.9   the splash leaves (logo exit, lines lift); the pieces rise
//   2.9–5.0   the missing piece flies in and snaps (a burst at the joint): "Find your / missing piece."
//   5.0–7.0   the other two snap in (a 2×2 team): "…or your / whole team."
//   7.2–10.6  real UI (demo listings only): the event page, Tap → "Find a partner"
//   10.6–14.0 a listing, Tap → "I'd like to puzzle with you"
//   14.0–17.0 the notification drops in: they get your message, nobody's address is shared
//   17.0–20.6 the own listing, Tap → "Found my partner" → a check with a burst
//   20.6–25.1 end: free for everyone, the click path Events → your event → Find a partner, N events in M countries,
//             the send ask
//   25.1–26.1 loop back to the splash
// Text only in the Reel safe area (x 60–960, y 220–1250).
import { GROUNDS, X0, f1, frame, type Variant } from '../design/house.ts';
import { fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';

export interface UiShot { src: string; w: number; h: number; tap: { x: number; y: number; w?: number; h?: number } | null }
export interface PartnersSpec {
  events: number; countries: number;
  ui: { event: UiShot; listing: UiShot; notif: UiShot; found: UiShot };
  uiSource: string; placeholder: boolean;
  queriedAt: string;
}

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
// owner (round 4): hold ~1.6–1.8 s after each tap so the screens can be read (UI beats were 2.5–2.8 s, now 3.0–3.6 s)
const T = { splashOut: 2.4, pair: 2.9, team: 5.0, ui: 7.0, open: 7.2, see: 10.6, msg: 14.0, found: 17.0, end: 20.6, loop: 25.1 } as const;
const DURATION = 26.1;
/** The 2×2 block of generator pieces: size per piece and its top in the team layout. */
const S = 250, BY = 380;
/** The splash shows the block smaller under the hook (its top at y 940). */
const SPLASH = { dy: 940 - BY, scale: 0.8 };
// owner (round 3): more room between the masthead and each title; the bottom had space to spare
const CARD_TOP = 640, CARD_BOTTOM = 1240;
const COLORS = [GROUNDS.coral.bg, GROUNDS.sky.bg, GROUNDS.indigo.bg, GROUNDS.navy.hotText]; // no white piece (owner)

/** The block: a 2×2 jigsaw; piece 0 (top left) is the coral one, 1 its partner, 2 and 3 the rest of the team. Each
 *  missing piece has a dashed ghost outline. */
function block() {
  const jig = generateJigsaw({ cols: 2, rows: 2, width: 2 * S, height: 2 * S, seed: 17, tabSize: 0.27, jitter: 0.03 });
  const at = (r: number, c: number) => jig.pieces.find(p => p.row === r && p.col === c)!;
  const order = [at(0, 0), at(0, 1), at(1, 0), at(1, 1)];
  // where each piece flies in from (local px): the partner from the right, the team from below
  const from = [null, { dx: 760, dy: -40, rot: 38 }, { dx: -420, dy: 900, rot: -50 }, { dx: 420, dy: 960, rot: 44 }];
  const html = `<svg id="pf-blk" width="${2 * S}" height="${2 * S}" viewBox="0 0 ${2 * S} ${2 * S}" style="position:absolute; left:${CX - S}px; top:${BY}px; overflow:visible" aria-hidden="true">
    ${order.map((p, i) => i ? `<path class="pf-ghost" id="pf-g${i}" d="${p.d}"/>` : '').join('')}
    ${order.map((p, i) => `<path class="pf-pc" id="pf-p${i}" d="${p.d}" fill="${COLORS[i]}"/>`).join('')}
  </svg>`;
  return { html, from };
}

/** A burst of short rays around a point (the snap). */
function spark(id: string, x: number, y: number) {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2, r0 = 70, r1 = 120;
    return `<line x1="${f1(150 + Math.cos(a) * r0)}" y1="${f1(150 + Math.sin(a) * r0)}" x2="${f1(150 + Math.cos(a) * r1)}" y2="${f1(150 + Math.sin(a) * r1)}"/>`;
  }).join('');
  return `<svg class="pf-spark" id="${id}" width="300" height="300" viewBox="0 0 300 300" style="left:${f1(x - 150)}px; top:${f1(y - 150)}px" aria-hidden="true">${rays}</svg>`;
}

/** A UI screenshot as a card, full content width; returns the markup and the tap point in frame px. */
function card(id: string, u: UiShot, top: number) {
  const k = Math.min(RW / u.w, (CARD_BOTTOM - top) / u.h), ww = Math.round(u.w * k), hh = Math.round(u.h * k), left = Math.round(X0 + (RW - ww) / 2);
  const html = `<div class="pf-card" id="${id}" style="left:${left}px; top:${top}px; width:${ww}px; height:${hh}px"><img src="${u.src}" alt="" width="${ww}" height="${hh}"></div>`;
  const t = u.tap ?? { x: u.w - 300, y: u.h - 80, w: 400, h: 100 };
  return { html, bottom: top + hh, tap: { x: left + t.x * k, y: top + t.y * k, w: (t.w ?? 300) * k, h: (t.h ?? 90) * k } };
}

/** "Tap" pointer beside the button (owner: show where to click): a coral pill and a short arrow to the button's edge,
 *  on the side with more room (the cards fill the height, so there's no room below them). */
function pointer(id: string, tap: { x: number; y: number; w: number; h: number }, place: 'side' | 'above' = 'side') {
  const PILL = 150, ARROW = 84, GAP = 10;
  if (place === 'above') {
    // pill above the card, arrow down onto the button (when the row beside the button is taken)
    const x = Math.max(X0 + PILL / 2, Math.min(RX - PILL / 2, tap.x)), tip = tap.y - tap.h / 2 - GAP, len = 70;
    return `<div class="pf-ptr" id="${id}" data-dir="d">
    <svg width="60" height="${len}" viewBox="0 0 60 ${len}" style="position:absolute; left:${f1(x - 30)}px; top:${f1(tip - len)}px; overflow:visible" aria-hidden="true">
      <line x1="30" y1="4" x2="30" y2="${len - 22}"/><polygon points="30,${len} 12,${len - 28} 48,${len - 28}"/></svg>
    <p class="pf-pill" style="left:${f1(x - PILL / 2)}px; top:${f1(tip - len - 68)}px; width:${PILL}px">Tap</p>
  </div>`;
  }
  const right = tap.x + tap.w / 2 + GAP + ARROW + PILL <= RX + 30 || tap.x < CX;
  const edge = right ? tap.x + tap.w / 2 + GAP : tap.x - tap.w / 2 - GAP;
  const pillX = right ? edge + ARROW : edge - ARROW - PILL, ax = right ? edge : edge - ARROW;
  const arrow = right ? `<line x1="${ARROW - 4}" y1="30" x2="22" y2="30"/><polygon points="0,30 28,12 28,48"/>` : `<line x1="4" y1="30" x2="${ARROW - 22}" y2="30"/><polygon points="${ARROW},30 ${ARROW - 28},12 ${ARROW - 28},48"/>`;
  return `<div class="pf-ptr" id="${id}" data-dir="${right ? 'l' : 'r'}">
    <svg width="${ARROW}" height="60" viewBox="0 0 ${ARROW} 60" style="position:absolute; left:${f1(ax)}px; top:${f1(tap.y - 30)}px; overflow:visible" aria-hidden="true">${arrow}</svg>
    <p class="pf-pill" style="left:${f1(pillX)}px; top:${f1(tap.y - 34)}px; width:${PILL}px">Tap</p>
  </div>`;
}

export function reelPartnersMotion(v: Variant, s: PartnersSpec): Motion {
  const key = 'reel-partners';
  const blk = block();

  // ---------------------------------------------------------------- splash (complete at frame 0)
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mo-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="mo-c mo-hook" style="top:596px">Looking for</p>
    <p class="mo-c mo-hook2 hot" style="top:702px">a pair or a team?</p>
    <p class="mo-c mo-sub" style="top:822px">at a puzzle competition</p>
    <p class="pf-new" id="pf-new" style="left:${CX + 120}px; top:902px">NEW</p>
  </div>`;
  const pairText = `<div id="pairT"><p class="mo-c mo-hook" style="top:960px">Find your</p><p class="mo-c mo-hook hot" style="top:1064px">missing piece.</p></div>`;
  const teamText = `<div id="teamT"><p class="mo-c mo-hook" style="top:960px">…or your</p><p class="mo-c mo-hook hot" style="top:1064px">whole team.</p></div>`;
  const sparks = spark('pf-s1', CX, BY + S / 2) + spark('pf-s2', CX, BY + S);

  // ---------------------------------------------------------------- UI beats
  const say = (id: string, text: string) => `<p class="h-abs mo-say" id="${id}" style="top:512px; width:${RW}px">${text}</p>`;
  const cE = card('pf-ce', s.ui.event, CARD_TOP + 110), cL = card('pf-cl', s.ui.listing, CARD_TOP);
  const cN = card('pf-cn', s.ui.notif, CARD_TOP), cF = card('pf-cf', s.ui.found, CARD_TOP);
  // one short line per beat (owner: big catchy titles, not much to read); the pointer says where to tap
  const ui = `${say('sayE', 'Open any event')}${cE.html}${pointer('pf-pe', cE.tap, 'above')}
    ${say('sayL', 'Pick your partner')}${cL.html}${pointer('pf-pl', cL.tap)}
    ${say('sayN', 'They get your message')}${cN.html}
    <p class="h-abs h-lead" id="nolab" style="top:${cN.bottom + 44}px; width:${RW}px">In the app and by e-mail. Nobody’s address is shared.</p>
    ${say('sayF', 'Found them? One tap.')}${cF.html}${pointer('pf-pf', cF.tap)}
    ${spark('pf-s3', cF.tap.x + cF.tap.w / 2 - 10, cF.tap.y - cF.tap.h / 2 - 58)}
    <div id="pf-check" style="left:${f1(cF.tap.x + cF.tap.w / 2 - 70)}px; top:${f1(cF.tap.y - cF.tap.h / 2 - 118)}px">✓</div>
    ${[['pf-re', cE.tap], ['pf-rl', cL.tap], ['pf-rf', cF.tap]].map(([id, p]) => `<div class="pf-tap" id="${id}" style="left:${f1((p as { x: number }).x - 70)}px; top:${f1((p as { y: number }).y - 70)}px"></div>`).join('')}`;

  // ---------------------------------------------------------------- end card
  const end = `<div id="end">
    <p class="h-abs h-cap" style="top:520px">New · free for everyone</p>
    <p class="h-abs mo-title" style="top:570px; width:${RW}px">Find your partner on any event page</p>
    <div class="h-abs pf-path" style="top:754px; width:${RW}px"><span class="pf-chip">Events</span><i>→</i><span class="pf-chip">Your event</span><i>→</i><span class="pf-chip hot">Find a partner</span></div>
    <p class="h-abs h-lead" style="top:878px; width:${RW}px"><b class="pf-n" id="endN">${fmtInt(s.events)}</b> upcoming events in ${s.countries} countries already have it</p>
    <p class="h-abs h-ask" style="top:1040px; width:${RW}px">Send this to the one you’d puzzle with.</p>
  </div>`;

  const body = `${splash}${blk.html}${sparks}${pairText}${teamText}${ui}${end}`;
  const css = LOGO_CSS + `
#pairT, #teamT, #end, .mo-say, .pf-card, .pf-ptr, #nolab, #pf-check, .pf-tap, .pf-spark { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
.pf-pc { stroke: ${GROUNDS.navyDeep.bg}; stroke-width: 6; stroke-linejoin: round; }
.pf-ghost { fill: none; stroke: rgba(255, 255, 255, 0.75); stroke-width: 5; stroke-dasharray: 16 12; stroke-linejoin: round; }
#pf-p1, #pf-p2, #pf-p3 { opacity: 0; }
.pf-spark { position: absolute; overflow: visible; }
.pf-spark line { stroke: ${GROUNDS.navy.hotText}; stroke-width: 9; stroke-linecap: round; }
.mo-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.mo-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.mo-hook { font-size: 92px; }
.mo-hook2 { font-size: 84px; }
.mo-c.hot { color: var(--g-hot); }
.mo-sub { font-size: 52px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.pf-new { position: absolute; margin: 0; padding: 10px 26px; border-radius: 14px; background: ${GROUNDS.coral.bg}; color: ${GROUNDS.coral.ink}; font-size: 46px; font-weight: 800; letter-spacing: 0.06em; transform: rotate(8deg); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35); z-index: 3; }
.mo-say { font-size: 76px; font-weight: 700; line-height: 1.05; letter-spacing: -0.015em; white-space: nowrap; color: var(--g-ink); }
.mo-title { font-size: 68px; font-weight: 700; line-height: 1.06; letter-spacing: -0.01em; color: var(--g-ink); text-wrap: balance; }
.pf-card { position: absolute; border-radius: 22px; overflow: hidden; background: #fff; box-shadow: 0 22px 60px rgba(0, 0, 0, 0.38); }
.pf-card img { display: block; }
.pf-ptr svg line { stroke: ${GROUNDS.coral.bg}; stroke-width: 10; stroke-linecap: round; }
.pf-ptr svg polygon { fill: ${GROUNDS.coral.bg}; }
.pf-pill { position: absolute; margin: 0; text-align: center; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3); padding: 10px 0; border-radius: 40px; background: ${GROUNDS.coral.bg}; color: ${GROUNDS.coral.ink}; font-size: 40px; font-weight: 800; }
.pf-tap { position: absolute; width: 140px; height: 140px; border-radius: 50%; border: 8px solid #ffffff; box-shadow: 0 0 0 6px ${GROUNDS.coral.bg}; }
#pf-check { position: absolute; width: 120px; height: 120px; border-radius: 50%; background: ${GROUNDS.coral.bg}; color: ${GROUNDS.coral.ink}; font-size: 76px; font-weight: 700; line-height: 120px; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35); }
.pf-path { display: flex; align-items: center; gap: 14px; white-space: nowrap; }
.pf-path i { font-style: normal; font-size: 40px; font-weight: 700; color: var(--g-soft); }
.pf-chip { padding: 12px 22px; border-radius: 40px; border: 3px solid var(--g-rule); font-size: 36px; font-weight: 700; color: var(--g-ink); }
.pf-chip.hot { background: ${GROUNDS.coral.bg}; border-color: ${GROUNDS.coral.bg}; color: ${GROUNDS.coral.ink}; }
.pf-n { color: var(--g-hot); font-weight: 800; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'New · Partner finder', device: v.device, src: `Puzzle events · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';
gsap.set('#pf-blk', { x: 0, y: D.splash.dy, scale: D.splash.scale, transformOrigin: '50% 0%' });

// ---- splash: the NEW sticker wiggles once, then everything leaves; the pieces rise
tl.fromTo('#pf-new', { rotation: 8 }, { rotation: -6, duration: 0.12, ease: 'power1.inOut', yoyo: true, repeat: 3, immediateRender: false }, 0.7);
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
tl.to('#pf-blk', { y: 0, scale: 1, duration: 0.5, ease: 'power3.inOut' }, T.splashOut + 0.1);

// ---- snaps: a piece flies in, its ghost goes, the block thumps and a burst flashes at the joint
const fly = (i, at) => { const f = D.from[i];
  tl.fromTo('#pf-p' + i, { x: f.dx, y: f.dy, rotation: f.rot, opacity: 1, transformOrigin: '50% 50%' }, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, at);
  tl.to('#pf-g' + i, { opacity: 0, duration: 0.1 }, at + 0.4); };
const thump = (at, sparkSel) => {
  tl.fromTo('#pf-blk', { scale: 1 }, { scale: 1.07, duration: 0.07, ease: 'power1.out', transformOrigin: '50% 50%', immediateRender: false }, at);
  tl.to('#pf-blk', { scale: 1, duration: 0.4, ease: 'back.out(3)' }, at + 0.07);
  tl.set(sparkSel, { autoAlpha: 1 }, at);
  tl.fromTo(sparkSel, { scale: 0.5, opacity: 1 }, { scale: 1.35, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, at);
};
const payoff = (sel, at) => { show(sel, at, 0.01); riseIn(sel + ' > p:first-child', at, { dur: 0.3 }); popIn(sel + ' > .hot', at + 0.12, { scale: 0.5, dur: 0.4 }); };
fly(1, T.pair); thump(T.pair + 0.45, '#pf-s1'); payoff('#pairT', T.pair + 0.45);
hide('#pairT', T.team - 0.2, 0.18);
fly(2, T.team); fly(3, T.team + 0.12); thump(T.team + 0.55, '#pf-s2'); payoff('#teamT', T.team + 0.5);

// ---- out to the UI
hide('#teamT', T.ui - 0.1, 0.2);
tl.to('#pf-blk', { y: -500, scale: 0.6, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, T.ui - 0.1);
show(MAST, T.ui + 0.1);

// ---- a UI beat: the line, the card lands with a little bounce, the pointer bobs in, the tap
const land = (sel, at) => { show(sel, at, 0.01); tl.fromTo(sel, { y: 140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, at); };
const tapAt = (id, at) => { tl.set(id, { autoAlpha: 1 }, at); tl.fromTo(id, { scale: 0.35, opacity: 1 }, { scale: 1.3, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, at); };
const point = (id, at, tapId) => {
  show(id, at, 0.01);
  const d = document.querySelector(id).dataset.dir;  // l: points left, r: right, d: down
  const ax = d === 'd' ? 'y' : 'x', dir = d === 'l' ? -1 : 1;
  tl.fromTo(id, { [ax]: -dir * 80, opacity: 0 }, { [ax]: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)', immediateRender: false }, at);
  tl.to(id, { [ax]: dir * 16, duration: 0.18, ease: 'power1.inOut', yoyo: true, repeat: 1 }, at + 0.45);
  tapAt(tapId, at + 0.9);
  hide(id, at + 1.25, 0.2);
};
const beat = (sayId, at) => { show('#' + sayId, at, 0.01); riseIn('#' + sayId, at, { dur: 0.35 }); };

beat('sayE', T.open); land('#pf-ce', T.open + 0.15); point('#pf-pe', T.open + 0.7, '#pf-re');
hide(['#sayE', '#pf-ce'], T.see - 0.2, 0.18);
beat('sayL', T.see); land('#pf-cl', T.see + 0.15); point('#pf-pl', T.see + 0.75, '#pf-rl');
hide(['#sayL', '#pf-cl'], T.msg - 0.2, 0.18);

// ---- the notification drops in from the top, like on a phone
beat('sayN', T.msg);
show('#pf-cn', T.msg + 0.2, 0.01);
tl.fromTo('#pf-cn', { y: -360, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)', immediateRender: false }, T.msg + 0.2);
show('#nolab', T.msg + 0.8, 0.01); riseIn('#nolab', T.msg + 0.8, { dur: 0.35 });
hide(['#sayN', '#pf-cn', '#nolab'], T.found - 0.2, 0.18);

// ---- found my partner
beat('sayF', T.found); land('#pf-cf', T.found + 0.15); point('#pf-pf', T.found + 0.7, '#pf-rf');
show('#pf-check', T.found + 1.7, 0.01); popIn('#pf-check', T.found + 1.7);
tl.set('#pf-s3', { autoAlpha: 1 }, T.found + 1.7);
tl.fromTo('#pf-s3', { scale: 0.5, opacity: 1 }, { scale: 1.4, opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, T.found + 1.7);
hide(['#sayF', '#pf-cf', '#pf-check'], T.end - 0.2, 0.18);

// ---- end card: the click path pops chip by chip, the count ticks up
show('#end', T.end, 0.01);
riseIn('#end > p', T.end, { stagger: 0.2, dur: 0.4 });
popIn('#end .pf-path > *', T.end + 0.35, { stagger: 0.12, scale: 0.4, from: '0% 50%' });
countUp('#endN', D.events, T.end + 0.6, 1.0);

// ---- loop back to the splash: the coral piece and the ghosts return, the lines drop in, the logo plays back
hide(['#end', MAST], T.loop, 0.3);
tl.set(['#pf-p1', '#pf-p2', '#pf-p3'], { opacity: 0 }, T.loop + 0.2);
tl.set(['#pf-g1', '#pf-g2', '#pf-g3'], { opacity: 1 }, T.loop + 0.2);
tl.fromTo('#pf-blk', { x: 0, y: D.splash.dy + 300, scale: 0.5, autoAlpha: 0 }, { x: 0, y: D.splash.dy, scale: D.splash.scale, transformOrigin: '50% 0%', autoAlpha: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, T.loop + 0.25);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.4)}
tl.set({}, {}, ${DURATION});
`;
  const data = { T, splash: SPLASH, from: blk.from, events: s.events };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 2.0, 4.4, 6.5, 8.4, 9.6, 12.0, 13.4, 15.5, 18.9, 22.5, 24.8, DURATION - 0.05],
    html: composition({ key, title: 'Reel: Find your missing piece (partner finder)', duration: DURATION, frameHtml, css, data, script }),
  };
}
