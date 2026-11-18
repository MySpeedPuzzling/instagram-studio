// Reel "300 million pieces" (passed Mon 16 Nov 2026; owner pick 2026-11-18: concept 1 "Origin story", funny and
// celebratory: when we started, we couldn't imagine this, thank you, we love you, spread the puzzle love). Code only.
// Frame 0 is the payoff (300 000 000 + falling piece confetti, already moving).
//   0.0–3.6   splash: logo, site, 300 000 000, "pieces. Solved together.", confetti
//   3.6–5.4   "Wait. How did we get here?" the counter rewinds to 174
//   5.4–11.2  flashback: 24 October 2023, first line of code; 174 results in the first month; (We were very proud.)
//   11.2–13.4 "We never imagined this."
//   13.4      KEY (music drop): the counter flies 174 → 300 000 000, confetti burst, "pieces later."
//   18.0–23.6 laid edge to edge: London Postcard → chain of pieces → New York Postcard, km counter
//   24.0–29.0 coral poster: 77 years of puzzling, non-stop (start in 1949, finish about now)
//   29.4–33.6 thank you, N puzzlers in M countries. We love you.
//   33.8–38.4 spread the puzzle love: send this to a puzzler you love (confetti)
//   38.4–39.4 loop back to the splash (= frame 0)
// Text only in the Reel safe area (x 60–960, y 220–1250).
import { GROUNDS, W, X0, f1, frame, groundVars, hero, heroFit, posterTopPath, siteLine, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import { PIECE_CM, LON_NYC_KM, type Reel300mSpec } from '../posts/reel-300m.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0;
// On a 120 BPM grid (1 bar = 2 s) from the drop at 13.4: proud 9.4, chain 17.4, poster lands 23.4, thanks 29.4, send 33.4.
const T = { splashOut: 3.4, rewind: 3.8, origin: 5.4, month: 7.4, proud: 9.4, imagine: 11.4, drop: 13.4, chain: 17.4, poster: 23.17, posterOut: 28.6, thanks: 29.4, send: 33.4, loop: 38.0 } as const;
const DURATION = 39.0;
const SEAM = 1262;
const COUNT_BASE = 760;
const COLORS = [GROUNDS.coral.bg, '#ffb0ab', GROUNDS.sky.bg, GROUNDS.indigo.bg];

/** Deterministic pseudo-random (the render must be repeatable). */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

/** Confetti: generator pieces in the brand colours, each in its own little SVG. */
function confetti(prefix: string, n: number, seed: number, size: number) {
  const cols = 6, rows = Math.ceil(n / cols);
  const jig = generateJigsaw({ cols, rows, width: cols * size, height: rows * size, seed, tabSize: 0.26, jitter: 0.05 });
  const r = rng(seed);
  const items = jig.pieces.slice(0, n).map((p, i) => {
    const pad = size * 0.35, b = p.bbox;
    const html = `<svg class="cf ${prefix}" id="${prefix}${i}" width="${f1(b.width + 2 * pad)}" height="${f1(b.height + 2 * pad)}" viewBox="${f1(b.x - pad)} ${f1(b.y - pad)} ${f1(b.width + 2 * pad)} ${f1(b.height + 2 * pad)}" aria-hidden="true"><path d="${p.d}" fill="${COLORS[i % COLORS.length]}" stroke="#1d2431" stroke-width="2" stroke-linejoin="round"/></svg>`;
    const y = Math.round(r() * 1900 - 200), side = r(), xx = y < 1230 ? (side < 0.5 ? Math.round(side * 2 * 40) - 50 : W - 60 + Math.round((side - 0.5) * 2 * 40)) : Math.round(side * (W - size));
    return { html, x: xx, y, rot: Math.round(r() * 360), spin: (r() < 0.5 ? -1 : 1) * Math.round(120 + r() * 240), speed: Math.round(420 + r() * 300), r1: r(), r2: r() };
  });
  return { html: items.map(i => i.html).join(''), items };
}

/** The chain of pieces from London to New York along a cubic Bézier. */
function chain(p0: number[], c1: number[], c2: number[], p3: number[], pc: number) {
  const at = (t: number) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p3[k]); };
  const samples: Array<{ t: number; s: number; p: number[] }> = [];
  let s = 0, prev = at(0);
  for (let i = 0; i <= 400; i++) { const t = i / 400, p = at(t); s += Math.hypot(p[0] - prev[0], p[1] - prev[1]); samples.push({ t, s, p }); prev = p; }
  const L = s, n = Math.floor(L / pc);
  const jig = generateJigsaw({ cols: n, rows: 1, width: n * pc, height: pc, seed: 300, tabSize: 0.26, jitter: 0.04 });
  const pos = (d: number) => { const k = samples.findIndex(x => x.s >= d); return samples[Math.max(1, k)]; };
  const g = jig.pieces.sort((a, b) => a.col - b.col).map((p, i) => {
    const m = pos((i + 0.5) * (L / n)), a = pos(Math.min(L, (i + 0.5) * (L / n) + 2));
    const b = samples[samples.indexOf(a) - 1] ?? a;
    const ang = Math.atan2(a.p[1] - b.p[1], a.p[0] - b.p[0]) * 180 / Math.PI;
    const cx = p.col * pc + pc / 2, cy = pc / 2;
    return `<g transform="translate(${f1(m.p[0])} ${f1(m.p[1])}) rotate(${f1(ang)}) translate(${f1(-cx)} ${f1(-cy)})"><path class="ch" d="${p.d}" fill="${COLORS[i % 2 === 0 ? 0 : 1]}" stroke="#1d2431" stroke-width="2" stroke-linejoin="round"/></g>`;
  }).join('');
  return { svg: `<svg id="chain" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true">${g}</svg>`, n };
}

export function reel300mMotion(v: Variant, s: Reel300mSpec): Motion {
  const key = 'reel-300m';
  const coral = GROUNDS.coral;
  const date = s.queriedAt.slice(0, 10);
  const logo = logoExit({ cx: 540, cy: 380, width: 220 });
  const big = '300 000 000'.replace(/ /g, ' ');
  const cSize = heroFit(big, 170, RW - 40);
  const rain = confetti('ra', 30, 7, 70), burst = confetti('bu', 36, 11, 70), love = confetti('lo', 36, 23, 70);

  const counter = hero(big, { size: cSize, baseline: COUNT_BASE, center: true }).replace('<p class="h-big"', '<p class="h-big" id="count"');

  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mo-site" style="top:500px">myspeedpuzzling.com</p>
    <p class="mo-sub2" style="top:800px">pieces. Solved together.</p>
    <p class="h-abs h-credit mo-cc" style="top:1150px; width:${RW}px">All logged results · passed on ${h(dayName(s.crossedOn))}</p>
  </div>`;

  const rewind = `<div id="rewind"><p class="mo-line s" style="top:880px">Wait. How did we get here?</p></div>`;

  const origin = `<div id="origin">
    <p class="mo-cap" style="top:420px">24 October 2023</p>
    <p class="mo-line s" style="top:480px">First line of code.</p>
    <p class="mo-sub2" id="o-month" style="top:800px">results in the whole first month.</p>
    <p class="mo-wink" id="o-proud" style="top:900px">(We were very proud.)</p>
    <p class="h-abs h-credit mo-cc" id="o-src" style="top:1150px; width:${RW}px">Results logged in November 2023 · data ${date}</p>
  </div>`;

  const imagine = `<div id="imagine"><p class="mo-line" style="top:440px">We never</p><p class="mo-line hot" style="top:540px">imagined this.</p></div>`;
  const later = `<div id="later"><p class="mo-line s" style="top:830px">pieces later.</p></div>`;

  // the chain: London top-left, New York bottom-right
  const lw = 280, nw = 270, lh = Math.round(lw / s.london.aspect), nh = Math.round(nw / s.nyc.aspect);
  const L = { x: 96, y: 720 }, N = { x: RX - nw, y: 960 };
  const ch = chain([L.x + lw - 10, L.y + lh * 0.55], [700, 640], [420, 1240], [N.x + 10, N.y + nh * 0.45], 46);
  const km = String(s.chainKm);
  const chainHtml = `<div id="chainb">
    <p class="mo-line s" style="top:440px">Laid edge to edge:</p>
    <p class="mo-line hot" style="top:530px">London → New York</p>
    ${ch.svg}
    <img class="pc-box" id="b-lon" src="${s.london.img}" style="left:${L.x}px; top:${L.y}px; width:${lw}px; height:${lh}px" alt="">
    <img class="pc-box" id="b-nyc" src="${s.nyc.img}" style="left:${N.x}px; top:${N.y}px; width:${nw}px; height:${nh}px" alt="">
    ${hero(km, { size: 120, baseline: 1090, x: X0 + 8, unit: 'km' }).replace('<p class="h-big"', '<p class="h-big" id="km"')}
    <p class="h-abs h-credit" style="top:1110px; left:${X0 + 8}px; width:540px">About ${PIECE_CM} cm a piece. London–New York ≈ ${LON_NYC_KM} km. Postcards: ${h(s.london.brand)}</p>
  </div>`;

  const yrs = String(Math.floor(s.years));
  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <p class="h-src h-abs" style="top:388px">${siteLine(`${fmtInt(s.hours)} stopwatch hours · data ${date}`)}</p>
      ${hero(yrs, { size: 360, baseline: 760 }).replace('<p class="h-big"', '<p class="h-big" id="yrs"')}
      <p class="h-abs h-lead" style="top:810px; width:${RW}px; font-size:52px; font-weight:700; white-space:nowrap">years of puzzling. Non-stop.</p>
      <p class="h-abs h-lead" style="top:900px; width:${RW}px; font-size:42px">Start a puzzle in ${s.startYear} and you'd be placing the last piece about now.</p>
    </div>
  </div>`;

  const thanks = `<div id="thanks">
    <p class="mo-line s" style="top:440px">Thank you,</p>
    <p class="mo-line hot" style="top:540px">${fmtInt(s.puzzlers)} puzzlers</p>
    <p class="mo-line s" style="top:650px">in ${s.countries} countries.</p>
    <p class="mo-line xl hot" style="top:820px">We love you.</p>
    <p class="h-abs h-credit mo-cc" style="top:1150px; width:${RW}px">Puzzlers with a public profile and a logged result · data ${date}</p>
  </div>`;

  const send = `<div id="send">
    <p class="mo-line s" style="top:460px">Spread the puzzle love:</p>
    <p class="mo-line" style="top:580px">send this to a puzzler</p>
    <p class="mo-line hot" style="top:690px">you love.</p>
  </div>`;

  const body = `<div id="cf">${rain.html}${burst.html}${love.html}</div>${splash}${counter}${rewind}${origin}${imagine}${later}${chainHtml}${thanks}${send}${poster}`;

  const css = LOGO_CSS + `
#rewind, #origin, #imagine, #later, #chainb, #thanks, #send, #poster, #ptext { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; z-index: 4; }
#cf { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.cf { position: absolute; left: 0; top: 0; overflow: visible; }
.bu, .lo { visibility: hidden; }
#count { z-index: 3; transform-origin: 50% 60%; }
#chain { position: absolute; left: 0; top: 0; overflow: visible; }
.pc-box { position: absolute; object-fit: cover; border-radius: 6px; box-shadow: 0 12px 28px rgba(0,0,0,0.45); border: 6px solid #f4f1ea; }
#b-lon { transform: rotate(-5deg); }
#b-nyc { transform: rotate(4deg); }
.mo-cc { text-align: center; }
.mo-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); z-index: 2; }
.mo-cap { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 38px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); }
.mo-line { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 80px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; color: var(--g-ink); white-space: nowrap; z-index: 2; }
.mo-line.s { font-size: 64px; }
.mo-line.xl { font-size: 120px; }
.mo-line.hot { color: var(--g-hot); }
.mo-sub2 { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 50px; font-weight: 600; color: var(--g-ink); z-index: 2; }
.mo-wink { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 46px; font-weight: 500; font-style: italic; color: var(--g-accent); }
#poster { position: absolute; inset: 0; z-index: 7; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: '300 million pieces', device: v.device, src: '', rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T, $ = id => document.getElementById(id);
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head';
const cnt = { v: 300000000 };
const showCnt = () => { $('count').textContent = fmtN(cnt.v); };

// ---- confetti rain: on screen from frame 0, falling; it loops seamlessly (the last second falls into the frame-0 positions)
D.rain.forEach((p, i) => {
  const el = '#ra' + i, fall = p.speed * (T.splashOut + 1.2);
  tl.fromTo(el, { x: p.x, y: p.y, rotation: p.rot }, { y: p.y + fall, rotation: p.rot + p.spin * (T.splashOut + 1.2) / 3, duration: T.splashOut + 1.2, ease: 'none', immediateRender: true }, 0);
  tl.fromTo(el, { x: p.x, y: p.y - p.speed * 1.0, rotation: p.rot - p.spin / 3 }, { y: p.y, rotation: p.rot, duration: 1.0, ease: 'none', immediateRender: false }, ${DURATION} - 1.0);
});
const burstAt = (pre, arr, at) => arr.forEach((p, i) => {
  const el = '#' + pre + i, x1 = -20 + p.r1 * 1060, y1 = 960 + p.r2 * 520;
  tl.set(el, { autoAlpha: 1, x: 505, y: 1500, scale: 0.2, rotation: p.rot }, at);
  tl.to(el, { x: x1, y: y1, scale: 1, rotation: p.rot + p.spin / 2, duration: 0.6, ease: 'power3.out' }, at);
  tl.to(el, { y: y1 + 1500, rotation: p.rot + p.spin * 2, duration: 2.6, ease: 'power2.in' }, at + 0.6);
  tl.set(el, { autoAlpha: 0 }, at + 3.3);
});

// ---- splash out; the counter rewinds
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
show('#rewind', T.splashOut + 0.3, 0.01);
riseIn('#rewind > *', T.splashOut + 0.3, { dur: 0.35 });
cue('punch', T.splashOut + 0.3, { what: 'wait, how did we get here?' });
tl.fromTo(cnt, { v: 300000000 }, { v: D.origin, duration: 1.2, ease: 'power3.inOut', onUpdate: showCnt, immediateRender: false }, T.rewind);
cue('rewind', T.rewind, { dur: 1.2 });
hide('#rewind', T.origin - 0.3);

// ---- flashback
show('#origin', T.origin, 0.01);
riseIn('#origin .mo-cap, #origin .mo-line', T.origin, { stagger: 0.4, dur: 0.4 });
riseIn('#o-month, #o-src', T.month, { stagger: 0.3, dur: 0.4 });
flash('#count', T.month);
riseIn('#o-proud', T.proud, { dur: 0.4 });
cue('punch-main', T.proud, { what: '(We were very proud.)' });
hide('#origin', T.imagine - 0.3);
show('#imagine', T.imagine, 0.01);
riseIn('#imagine > *', T.imagine, { stagger: 0.5, dur: 0.4 });

// ---- KEY: 174 → 300 000 000 + confetti burst
cue('key', T.drop, { what: 'the counter flies to 300 million' });
tl.fromTo(cnt, { v: D.origin }, { v: 300000000, duration: 1.6, ease: 'expo.out', onUpdate: showCnt, onComplete: showCnt, immediateRender: false }, T.drop);
tl.fromTo('#count', { scale: 0.85 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', immediateRender: false }, T.drop);
burstAt('bu', D.burst, T.drop);
hide('#imagine', T.drop + 1.6, 0.3);
show('#later', T.drop + 0.8, 0.01);
riseIn('#later > *', T.drop + 0.8, { dur: 0.4 });
show(MAST, T.drop + 1.8);
hide(['#later', '#count'], T.chain - 0.35);

// ---- the chain London → New York
cue('reveal', T.chain, { what: 'London to New York' });
show('#chainb', T.chain, 0.01);
riseIn('#chainb .mo-line', T.chain, { stagger: 0.35, dur: 0.4 });
popIn('#b-lon', T.chain + 0.6);
tl.fromTo('#chain .ch', { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', stagger: 2.2 / D.chainN, immediateRender: false }, T.chain + 0.9);
tl.set('#chain .ch', { autoAlpha: 0 }, 0);
countUp('#km', D.km, T.chain + 0.9, 2.4);
popIn('#b-nyc', T.chain + 3.2);
riseIn('#chainb .h-credit, #chainb .h-big + .h-big', T.chain + 3.4, { dur: 0.3 });
hide('#chainb', T.poster - 0.3);

// ---- poster: 77 years
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.poster);
cue('reveal', 23.4, { what: '77 years' });
tl.set(MAST, { autoAlpha: 0 }, T.poster + 0.28);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.3);
countUp('#yrs', D.years, T.poster + 0.32, 1.0);
riseIn('#ptext .h-lead', T.poster + 0.9, { stagger: 1.0, dur: 0.4 });
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.set(MAST, { autoAlpha: 1 }, T.posterOut + 0.15);
tl.to('#poster', { y: -${SEAM + 140}, duration: 0.38, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.49);

// ---- thank you
show('#thanks', T.thanks, 0.01);
riseIn('#thanks .mo-line', T.thanks, { stagger: 0.5, dur: 0.4 });
countUp('#thanks .mo-line.hot:not(.xl)', D.puzzlers, T.thanks + 0.5, 1.0, n => fmtN(n) + ' puzzlers');
riseIn('#thanks .h-credit', T.thanks + 1.6, { dur: 0.3 });
cue('punch', T.thanks + 1.5, { what: 'We love you.' });
cue('section', T.thanks, { what: 'thank you' });
hide('#thanks', T.send - 0.3);

// ---- spread the love
cue('outro', T.send, { what: 'send this to a puzzler you love' });
show('#send', T.send, 0.01);
riseIn('#send > *', T.send, { stagger: 0.5, dur: 0.4 });
burstAt('lo', D.love, T.send + 1.2);

// ---- loop: back to the splash (= frame 0)
hide(['#send', MAST], T.loop, 0.25);
tl.call(() => { cnt.v = 300000000; showCnt(); }, [], T.loop + 0.2);
tl.set('#count', { autoAlpha: 1, scale: 1 }, T.loop + 0.2);
tl.fromTo('#count', { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, T.loop + 0.2);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.4)}
tl.set({}, {}, ${DURATION});
`;
  const pick = (a: ReturnType<typeof confetti>) => a.items.map(({ x, y, rot, spin, speed, r1, r2 }) => ({ x, y, rot, spin, speed, r1, r2 }));
  const data = { T, origin: s.originResults, km: s.chainKm, years: Math.floor(s.years), puzzlers: s.puzzlers, chainN: ch.n, rain: pick(rain), burst: pick(burst), love: pick(love) };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 2.0, T.rewind + 0.8, T.month + 1.0, T.proud + 1.0, T.imagine + 1.5, T.drop + 2.5, T.chain + 4.5, T.poster + 3.0, T.thanks + 3.0, T.send + 2.5, DURATION - 0.05],
    html: composition({ key, title: 'Reel 300 million pieces', duration: DURATION, frameHtml, css, data, script }),
  };
}

function dayName(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '');
}
