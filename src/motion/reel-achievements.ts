// Reel "5 new achievements" (owner 2026-10-29: look L4 from lab AC1: every badge assembles through the app's own
// last-piece reveal, then the five fly onto the shelf; reveal cut A = the app's shipped geometry, ported as is).
// ~33 s:
//   0.0–2.9   splash, complete from frame 0: logo, myspeedpuzzling.com, "Badges for / solving puzzles?", "Now there are 5
//             more!", a Night Owl puzzle with its icon piece hovering; at 1.5 the piece clicks in and the badge pops;
//             then it all leaves
//   3.0–24.5  five beats of 4.3 s: name and rule, the badge assembles (the app's timing: 8 frame pieces corners first, the
//             icon piece hovers and clicks in last ~1 s in, seams flash, burst, piece confetti), then it steps up from
//             Bronze to Diamond; the rule stays put, only its own line "Bronze · 3 times" steps with it
//   24.5–28.5 the shelf: the badges you can already earn (dimmed, never counted: owner 2026-10-29), five lit sockets; the
//             five new ones line up and fly in
//   28.5–32.0 the closing line over the full shelf + "open your profile and reveal them" (the app has no notification:
//             new tiers wait as "?" seals with a "Reveal them" call-out; app session 2026-10-29)
//   32.0–33.1 loop back to the splash
// The reveal is a port of speedpuzzling.cz assets/last_piece_reveal/reveal.js + looks.js (timing, offsets, colours),
// fed with the app's badge art (content/assets/achievements/, copied from the app; gitignored).
// Text only in the Reel safe area (x 60–960, y 220–1250).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { X0, f1, frame, type Variant } from '../design/house.ts';
import { escapeHtml as h } from '../design/page.ts';
import { FRAMES } from '../render/render.ts';
import { ROOT } from '../render/server.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
const NAVY = '#2b3445', CORAL = '#ec726f';

export type BadgeKey = 'muscle_memory' | 'muscle_memory_unboxed' | 'night_owl' | 'competitor' | 'online_competitor';
/** `rule` = the app's text per tier (facts, alt text); the Reel shows `line` (static) and `amount` per tier on its own
 * line, so only that short line changes as the badge steps up (owner 2026-10-29: the sentence must not jump). */
export interface NewBadge { key: BadgeKey; name: string; tiers: number[]; rule: (n: number) => string; line: string; amount: (n: number) => string; note?: string }
/** The five, with the app's EN texts (translations/messages.en.yml, badges.requirement.<key>_1.._5), 2026-10-29. */
export const NEW_BADGES: NewBadge[] = [
  { key: 'muscle_memory', name: 'Muscle Memory', tiers: [3, 8, 15, 30, 50], rule: n => `Solve the same 500-piece puzzle ${n} times (solo)`, line: 'Solve the same 500-piece puzzle again and again (solo)', amount: n => `${n} times` },
  { key: 'muscle_memory_unboxed', name: 'Muscle Memory (unboxed)', tiers: [2, 4, 8, 15, 25], rule: n => `Solve the same 500-piece puzzle ${n} times without looking at the box (solo)`, line: 'Solve the same 500-piece puzzle without looking at the box (solo)', amount: n => `${n} times` },
  { key: 'night_owl', name: 'Night Owl', tiers: [10, 30, 75, 150, 250], rule: n => `Log ${n} results between 10 pm and 4 am`, line: 'Log results between 10 pm and 4 am', amount: n => `${n} results`, note: 'Set your time zone in your profile settings' },
  { key: 'competitor', name: 'Competitor', tiers: [1, 3, 6, 12, 25], rule: n => `Take part in ${n} in-person competition${n === 1 ? '' : 's'}`, line: 'Take part in puzzle competitions in person', amount: n => `${n} competition${n === 1 ? '' : 's'}` },
  { key: 'online_competitor', name: 'Online Competitor', tiers: [2, 6, 12, 25, 50], rule: n => `Log ${n} results at online competitions`, line: 'Log your results at online competitions', amount: n => `${n} results` },
];
const OLD = ['puzzles_solved', 'pieces_solved', 'speed_500_pieces', 'speed_1000_pieces', 'streak', 'team_player', 'zen_puzzler', 'first_try',
  'unboxed', 'brand_explorer', 'marathoner', 'photographer', 'steady_hands', 'librarian', 'weekend_puzzler', 'cataloger'];
const TIER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const TIER_INK = ['#f0a27c', '#b6c2d6', '#f6b24c', '#b3abf5', '#9fd3f7'];
const art = (key: string, tier: number) => `/content/assets/achievements/webp480/${key}-t${tier}.webp`;

// looks.js: the card tint behind the picture, the burst ring + rays and the confetti colours per tier.
const LOOK: Record<number, { card: string[]; ring: string; rays: string[]; confetti: string[] }> = {
  1: { card: ['#ffffff', '#fbf3ee', '#f3dfd1'], ring: '#ef9f78', rays: ['#fb8180', '#eea47a', '#75b5fa', '#8fd5da'], confetti: ['#fb8180', '#eea47a', '#75b5fa', '#8fd5da', '#fcd2b8'] },
  5: { card: ['#ffffff', '#f2f7fd', '#e2ecf9'], ring: '#9a93f4', rays: ['#ffb3cf', '#fdd26f', '#8fd5da', '#75b5fa', '#9a93f4'], confetti: ['#bfe9f6', '#c3bcf6', '#ffb8d2', '#8fd5da', '#a6ccfd', '#fde3a7'] },
};

interface Geo { size: number; outer: string; seams: string[]; confetti: string[]; pieces: Array<{ d: string; bbox: number[]; centroid: number[]; slot: number[] }> }
const geo = (): Geo => JSON.parse(readFileSync(join(ROOT, 'content/assets/achievements/geometry.json'), 'utf8'));

const ORDER = [0, 2, 8, 6, 1, 5, 7, 3]; // reveal.js: TL, TR, BR, BL corners, then T, R, B, L edges
const CENTRE = 4;
// reveal.js timing (s)
const STAGGER = 0.062, FLY = 0.38, T_IN = 0.56, T_HOVER = 0.74, T_DROP = 0.86, CLICK = 0.98;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One reveal stage: markup (absolute, `px` square at (cx, top)) + its timeline from `t0` (s, the "tap"). */
function stage(G: Geo, id: string, key: string, tiers: number[], cx: number, top: number, px: number, t0: number, o: { preHover?: boolean; seed?: number } = {}) {
  const S = G.size, u = px / S, L = LOOK[tiers[0]] ?? LOOK[1];
  const pct = (v: number) => `${f1((v / S) * 100)}%`;
  const rnd = mulberry32(7919 * (o.seed ?? 1) + 17);
  let rays = '';
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI / 18;
    rays += `M150 142L${f1(150 + 260 * Math.cos(a0))} ${f1(142 + 260 * Math.sin(a0))}L${f1(150 + 260 * Math.cos(a1))} ${f1(142 + 260 * Math.sin(a1))}Z`;
  }
  const defs = `<svg class="ac-defs" width="0" height="0" aria-hidden="true"><defs>
    <radialGradient id="${id}c" gradientUnits="userSpaceOnUse" cx="150" cy="142" r="215">${L.card.map((s, i) => `<stop offset="${[0, 0.55, 1][i]}" stop-color="${s}"/>`).join('')}</radialGradient>
    <g id="${id}art"><rect width="300" height="300" fill="url(#${id}c)"/><path d="${rays}" fill="#ffffff" fill-opacity=".55"/><image href="${art(key, tiers[0])}" x="7" y="7" width="286" height="286"/></g>
    ${G.pieces.map((p, i) => `<clipPath id="${id}p${i}"><path d="${p.d}"/></clipPath>`).join('')}
    <clipPath id="${id}o"><path d="${G.outer}"/></clipPath></defs></svg>`;
  let burst = `<circle r="150" fill="none" stroke="${L.ring}" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    burst += `<line x1="${f1(166 * Math.cos(a))}" y1="${f1(166 * Math.sin(a))}" x2="${f1(188 * Math.cos(a))}" y2="${f1(188 * Math.sin(a))}" stroke="${L.rays[i % L.rays.length]}" stroke-width="5" stroke-linecap="round"/>`;
  }
  const pieceDivs = [...ORDER, CENTRE].map(i => {
    const p = G.pieces[i], [bx, by, bw, bh] = p.bbox;
    const box = `left:${pct(bx)};top:${pct(by)};width:${pct(bw)};height:${pct(bh)};transform-origin:${f1(((p.centroid[0] - bx) / bw) * 100)}% ${f1(((p.centroid[1] - by) / bh) * 100)}%`;
    const vb = `${bx} ${by} ${bw} ${bh}`;
    return `<div class="ac-sh${i === CENTRE ? ' hero' : ''}" id="${id}s${i}" style="${box}"><svg viewBox="${vb}"><path d="${p.d}"/></svg></div>
      <div class="ac-pc" id="${id}k${i}" style="${box}"><svg viewBox="${vb}"><g clip-path="url(#${id}p${i})"><use href="#${id}art"/></g><path d="${p.d}" class="ac-edge"/></svg></div>`;
  }).join('');
  // piece confetti: the app's unit pieces, flung out from the centre (never up over the rule text)
  const conf: Array<{ d: string; fill: string; x: number; y: number; r: number; s: number }> = [];
  for (let i = 0; i < 30; i++) {
    const a = rnd() * Math.PI * 2, r = (190 + rnd() * 170) * u;
    conf.push({ d: G.confetti[i % G.confetti.length], fill: L.confetti[i % L.confetti.length], x: Math.cos(a) * r, y: Math.max(-0.62 * px, Math.sin(a) * r * 0.9 + 40 * u), r: (rnd() - 0.5) * 540, s: (10 + rnd() * 9) * u });
  }
  const html = `<div class="ac-stage" id="${id}" style="left:${f1(cx - px / 2)}px; top:${f1(top)}px; width:${px}px; height:${px}px">${defs}
    <svg class="ac-burst" id="${id}b" viewBox="-225 -225 450 450" aria-hidden="true">${burst}</svg>
    <div class="ac-board" id="${id}bd">
      <svg class="ac-tray" id="${id}t" viewBox="-2 -2 304 304" aria-hidden="true"><path d="${G.outer}" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".3" stroke-width="2.4"/>
        <g fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="2">${G.seams.map(d => `<path d="${d}"/>`).join('')}</g>
        <text x="150" y="176" text-anchor="middle" font-size="76" font-weight="700" fill="#ffffff" fill-opacity=".4">?</text></svg>
      <div class="ac-layer" id="${id}ps">${pieceDivs}</div>
      <div class="ac-layer ac-final" id="${id}f">
        <svg class="ac-card" id="${id}fc" viewBox="0 0 300 300" aria-hidden="true"><g clip-path="url(#${id}o)"><use href="#${id}art"/></g><path d="${G.outer}" class="ac-edge"/></svg>
        <div class="ac-badge" id="${id}bg">${tiers.map((t, i) => `<img id="${id}i${i}" src="${art(key, t)}" alt=""${i ? ' style="opacity:0"' : ''}>`).join('')}</div>
      </div>
      <svg class="ac-flash" id="${id}fl" viewBox="0 0 300 300" aria-hidden="true"><g fill="none" stroke="#ffffff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">${G.seams.map(d => `<path d="${d}"/>`).join('')}</g></svg>
    </div>
    <svg class="ac-conf" width="${px * 3}" height="${px * 3}" viewBox="${-px * 1.5} ${-px * 1.5} ${px * 3} ${px * 3}" style="left:${-px}px; top:${-px}px" aria-hidden="true">${conf.map((c, i) => `<path id="${id}cf${i}" d="${c.d}" fill="${c.fill}"/>`).join('')}</svg>
  </div>`;

  // ---- the timeline (absolute seconds); every start state is set at 0 so any frame can be sought
  const js: string[] = [];
  const at = (t: number) => f1((t0 + t) * 1000) + '/1000';
  const set = (sel: string, vars: string, t = -t0) => js.push(`tl.set('${sel}', ${vars}, ${at(t)});`);
  const to = (sel: string, vars: string, t: number, dur: number, ease = 'none') => js.push(`tl.to('${sel}', { ${vars}, duration: ${dur}, ease: '${ease}', immediateRender: false }, ${at(t)});`);
  ORDER.forEach((i, k) => {
    const p = G.pieces[i], dx = p.slot[0] - 150, dy = p.slot[1] - 150, len = Math.hypot(dx, dy), nx = dx / len, ny = dy / len;
    const side = rnd() < 0.5 ? -1 : 1, dist = (120 + rnd() * 40) * u, tan = side * (12 + rnd() * 26) * u;
    const x0 = nx * dist - ny * tan, y0 = ny * dist + nx * tan, r0 = side * (16 + rnd() * 26), xn = nx * 6 * u, yn = ny * 6 * u, lift = 11 * u;
    const ts = 0.03 + k * STAGGER, tl = ts + FLY * 0.86, te = ts + FLY;
    const pc = `#${id}k${i}`, sh = `#${id}s${i}`;
    if (o.preHover) { set(pc, '{ x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }'); set(sh, '{ opacity: 0 }'); return; }
    set(pc, `{ x: ${f1(x0)}, y: ${f1(y0)}, rotation: ${f1(r0)}, scale: 1.1, opacity: 0 }`);
    set(sh, `{ x: ${f1(x0)}, y: ${f1(y0 + lift)}, rotation: ${f1(r0)}, scale: 1.1, opacity: 0 }`);
    to(pc, 'opacity: 1', ts, FLY * 0.18);
    to(sh, 'opacity: 0.9', ts, FLY * 0.18);
    to(pc, `x: ${f1(xn)}, y: ${f1(yn)}, rotation: ${f1(r0 * 0.12)}, scale: 1.09`, ts, FLY * 0.64, 'power3.out');
    to(sh, `x: ${f1(xn)}, y: ${f1(yn + lift * 0.8)}, rotation: ${f1(r0 * 0.12)}, scale: 1.09`, ts, FLY * 0.64, 'power3.out');
    to(pc, 'x: 0, y: 0, rotation: 0, scale: 0.965', ts + FLY * 0.64, tl - ts - FLY * 0.64, 'power2.in');
    to(sh, `x: 0, y: ${f1(u)}, rotation: 0, scale: 0.965, opacity: 0`, ts + FLY * 0.64, tl - ts - FLY * 0.64, 'power2.in');
    to(pc, 'scale: 1', tl, te - tl, 'back.out(3)');
  });
  // the icon piece: in from above, hovers clear of its "?" slot, clicks in last
  const HY = -108 * u, hk = `#${id}k${CENTRE}`, hs = `#${id}s${CENTRE}`, hl = 24 * u;
  if (o.preHover) {
    set(hk, `{ x: 0, y: ${f1(HY)}, rotation: -3, scale: 1.12, opacity: 1 }`);
    set(hs, `{ x: 0, y: ${f1(HY + hl)}, rotation: -3, scale: 1.12, opacity: 0.75 }`);
  } else {
    set(hk, `{ x: 0, y: ${f1(-190 * u)}, rotation: -10, scale: 1.2, opacity: 0 }`);
    set(hs, `{ x: 0, y: ${f1(-190 * u + hl * 1.4)}, rotation: -10, scale: 1.2, opacity: 0 }`);
    to(hk, 'opacity: 1', T_IN, 0.07);
    to(hs, 'opacity: 0.75', T_IN, 0.07);
    to(hk, `y: ${f1(HY)}, rotation: -3, scale: 1.12`, T_IN, T_HOVER - T_IN, 'power3.out');
    to(hs, `y: ${f1(HY + hl)}, rotation: -3, scale: 1.12`, T_IN, T_HOVER - T_IN, 'power3.out');
  }
  to(hk, `y: ${f1(HY - 3.5 * u)}, rotation: -2, scale: 1.13`, T_HOVER, T_DROP - 0.045 - T_HOVER, 'sine.inOut');
  to(hs, `y: ${f1(HY - 3.5 * u + hl * 1.08)}, rotation: -2, scale: 1.13`, T_HOVER, T_DROP - 0.045 - T_HOVER, 'sine.inOut');
  to(hk, 'y: 0, rotation: 0, scale: 0.95', T_DROP, CLICK - T_DROP, 'power2.in');
  to(hs, `y: ${f1(u)}, rotation: 0, scale: 0.95, opacity: 0`, T_DROP, CLICK - T_DROP, 'power2.in');
  to(hk, 'scale: 1', CLICK, 0.21, 'back.out(3)');
  // the settle: tray and pieces hand over to the finished picture, the card dissolves, thunk, burst, flash, pop
  set(`#${id}t`, '{ opacity: 1 }'); set(`#${id}ps`, '{ opacity: 1 }'); set(`#${id}f`, '{ opacity: 0 }'); set(`#${id}fc`, '{ opacity: 1 }');
  set(`#${id}b`, '{ opacity: 0, scale: 0.86 }'); set(`#${id}fl`, '{ opacity: 0 }'); set(`#${id}bg`, '{ scale: 1 }');
  set(`#${id}t`, '{ opacity: 0 }', CLICK + 0.206); set(`#${id}ps`, '{ opacity: 0 }', CLICK + 0.206);
  to(`#${id}f`, 'opacity: 1', CLICK + 0.04, 0.16, 'power1.out');
  // the app dissolves the card over 0.3 s into a white page; on navy that reads as a grey square, so faster
  to(`#${id}fc`, 'opacity: 0', CLICK + 0.2, 0.14, 'power1.in');
  to(`#${id}bd`, 'scale: 0.984', CLICK, 0.07, 'power1.inOut');
  to(`#${id}bd`, 'scale: 1.012', CLICK + 0.07, 0.13, 'power1.inOut');
  to(`#${id}bd`, 'scale: 1', CLICK + 0.2, 0.12, 'sine.inOut');
  to(`#${id}b`, 'opacity: 1', CLICK, 0.04);
  to(`#${id}b`, 'scale: 1.2', CLICK, 0.52, 'power3.out');
  to(`#${id}b`, 'opacity: 0', CLICK + 0.2, 0.32, 'power1.in');
  to(`#${id}fl`, 'opacity: 1', CLICK, 0.05, 'power1.out');
  to(`#${id}fl`, 'opacity: 0', CLICK + 0.05, 0.21, 'power1.in');
  to(`#${id}bg`, 'scale: 1.06', CLICK + 0.24, 0.16, 'power1.inOut');
  to(`#${id}bg`, 'scale: 0.995', CLICK + 0.4, 0.16, 'sine.inOut');
  to(`#${id}bg`, 'scale: 1', CLICK + 0.56, 0.14, 'power1.out');
  conf.forEach((c, i) => {
    const sel = `#${id}cf${i}`;
    set(sel, `{ x: 0, y: 0, rotation: 0, scale: ${f1(c.s)}, opacity: 0 }`);
    to(sel, 'opacity: 1', CLICK + 0.05, 0.05);
    js.push(`tl.to('${sel}', { x: ${f1(c.x)}, y: ${f1(c.y)}, rotation: ${f1(c.r)}, duration: 1.0, ease: 'power3.out', immediateRender: false }, ${at(CLICK + 0.05)});`);
    to(sel, `y: ${f1(c.y + 90 * u)}`, CLICK + 1.05, 0.5, 'power1.in');
    to(sel, 'opacity: 0', CLICK + 1.0, 0.55, 'power1.in');
  });
  return { html, js: js.join('\n'), click: t0 + CLICK };
}

export function reelAchievementsMotion(v: Variant): Motion {
  const key = 'reel-achievements';
  const G = geo();
  const T = { splashClick: 1.5, splashOut: 2.6, beats: 3.0, beat: 4.3, shelf: 24.5, close: 28.5, loop: 32.0 } as const;
  const DURATION = 33.1;

  // ---------------------------------------------------------------- splash (frame 0: the icon piece hovers)
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  const sp = stage(G, 'sp', 'night_owl', [5], CX, 1000, 520, T.splashClick - T_DROP + 0.02, { preHover: true, seed: 5 });
  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="ac-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="ac-c ac-hook" style="top:620px">Badges for</p>
    <p class="ac-c ac-hook hot" style="top:724px">solving puzzles?</p>
    <p class="ac-c ac-sub" style="top:860px">Now there are 5 more!</p>
  </div>
  <div id="sstage">${sp.html}</div>`;

  // ---------------------------------------------------------------- five beats
  const nameSize = (s: string) => Math.min(88, Math.floor(RW / (s.length * 0.6)));
  const beats = NEW_BADGES.map((b, n) => {
    const t0 = T.beats + n * T.beat;
    const st = stage(G, `b${n}`, b.key, [1, 2, 3, 4, 5], CX, 960, 400, t0 + 0.35, { seed: 11 + n });
    const html = `<div class="ac-beat" id="beat${n}">
      <p class="h-abs h-cap" style="top:480px">New achievement ${n + 1} of 5</p>
      <p class="ac-name" style="top:530px; font-size:${nameSize(b.name)}px">${h(b.name)}</p>
      <p class="h-abs h-lead ac-rule" style="top:648px; width:${RW}px">${h(b.line)}</p>
      ${b.note ? `<p class="h-abs h-lab ac-note" style="top:716px; width:${RW}px">${h(b.note)}</p>` : ''}
      <p class="h-abs ac-step" style="top:784px; width:${RW}px"><b class="ac-tier" id="tn${n}">Bronze</b> · <span id="rt${n}">${h(b.amount(b.tiers[0]))}</span></p>
    </div>${st.html}`;
    return { b, n, t0, st, html };
  });

  // ---------------------------------------------------------------- the shelf
  const S = 118, cols = 6, gap = (RW - cols * S) / (cols - 1), shelfTop = 1060;
  const pos = (i: number) => ({ x: X0 + (i % cols) * (S + gap), y: shelfTop + Math.floor(i / cols) * (S + 26) });
  const oldHtml = OLD.map((k, i) => { const p = pos(i); return `<img class="ac-old" src="${art(k, (i % 5) + 1)}" alt="" style="left:${f1(p.x)}px; top:${f1(p.y)}px; width:${S}px; height:${S}px">`; }).join('');
  const FLY_S = 170;
  const flyers = NEW_BADGES.map((b, j) => {
    const p = pos(OLD.length + j), sx = X0 + j * ((RW - FLY_S) / 4), sy = 700 + (j % 2) * 60;
    return { b, j, p, dx: sx - p.x, dy: sy - p.y, k: FLY_S / S };
  });
  const shelf = `<div id="shelf">
    <div id="shead"><p class="h-abs h-cap" style="top:480px">All five</p><p class="h-abs h-title s" style="top:526px; width:${RW}px">5 new achievements to earn</p></div>
    <div id="close"><p class="h-abs h-ask" style="top:500px; width:${RW}px">Your past solves count: you may already have some</p>
      <p class="h-abs h-lead" style="top:800px; width:${RW}px">Open your profile on myspeedpuzzling.com and reveal them</p></div>
    ${oldHtml}
    ${flyers.map(f => `<div class="ac-socket" id="so${f.j}" style="left:${f1(f.p.x)}px; top:${f1(f.p.y)}px; width:${S}px; height:${S}px"></div>`).join('')}
    ${flyers.map(f => `<img class="ac-new" id="fy${f.j}" src="${art(f.b.key, 3)}" alt="" style="left:${f1(f.p.x)}px; top:${f1(f.p.y)}px; width:${S}px; height:${S}px">`).join('')}
  </div>`;

  const body = `${splash}${beats.map(x => x.html).join('')}${shelf}`;
  const css = LOGO_CSS + `
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
.ac-beat, ${beats.map(x => `#b${x.n}`).join(', ')}, #shelf, #close { visibility: hidden; opacity: 0; }
.ac-defs { position: absolute; width: 0; height: 0; }
.ac-stage { position: absolute; }
.ac-board, .ac-layer, .ac-tray, .ac-flash { position: absolute; inset: 0; }
.ac-tray { inset: -0.6667%; width: 101.3333%; height: 101.3333%; }
.ac-burst { position: absolute; left: -25%; top: -25%; width: 150%; height: 150%; overflow: visible; }
.ac-pc, .ac-sh { position: absolute; display: block; }
.ac-pc svg, .ac-sh svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
/* flat offset shadows: the house allows no blur filters */
.ac-sh path { fill: #0b1020; fill-opacity: .45; }
.ac-sh.hero path { fill-opacity: .35; }
.ac-edge { fill: none; stroke: ${NAVY}; stroke-width: 2.4; stroke-linejoin: round; }
.ac-card { position: absolute; inset: 0; width: 100%; height: 100%; }
.ac-badge { position: absolute; left: 2.3333%; top: 2.3333%; width: 95.3333%; height: 95.3333%; }
.ac-badge img { position: absolute; inset: 0; width: 100%; height: 100%; }
.ac-conf { position: absolute; overflow: visible; pointer-events: none; }
.ac-name { position: absolute; left: ${X0}px; width: ${RW}px; margin: 0; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.ac-rule { font-size: 46px; }
.ac-step { margin: 0; font-size: 50px; font-weight: 600; line-height: 1; white-space: nowrap; color: var(--g-ink); font-variant-numeric: tabular-nums; }
.ac-tier { font-weight: 700; }
.ac-note { color: var(--g-hot-text); font-weight: 600; }
.ac-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.ac-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.ac-hook { font-size: 100px; }
.ac-hook.hot { color: var(--g-hot); }
.ac-sub { font-size: 48px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.ac-old, .ac-new { position: absolute; display: block; }
.ac-old { opacity: .38; }
.ac-new { filter: drop-shadow(0 0 18px rgba(255, 210, 120, .55)); transform-origin: 0 0; }
.ac-socket { position: absolute; border-radius: 50%; border: 4px dashed ${CORAL}; background: rgba(236, 114, 111, .12); box-sizing: border-box; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'New · achievements', device: v.device, src: 'Achievements · added Oct 2026', rows: { headTop: 296 }, masthead: true, body });

  const tierJs = beats.map(x => {
    const st0 = x.st.click + 0.65, step = 0.36;
    return `
// ---- beat ${x.n + 1}: ${x.b.name}
show('#beat${x.n}', ${x.t0}, 0.01);
riseIn('#beat${x.n} > p', ${x.t0}, { stagger: 0.1, dur: 0.35 });
show('#b${x.n}', ${x.t0}, 0.01);
${x.st.js}
{ const o = { v: 1 }, n = ${x.n};
  const draw = () => { const t = Math.min(5, Math.floor(o.v + 1e-6));
    for (let i = 0; i < 5; i++) $('b' + n + 'i' + i).style.opacity = i === t - 1 ? 1 : 0;
    const tn = $('tn' + n); tn.textContent = D.tier[t - 1]; tn.style.color = D.ink[t - 1];
    $('rt' + n).textContent = D.amounts[n][t - 1]; };
  draw();
  tl.fromTo(o, { v: 1 }, { v: 5, duration: ${f1(step * 4)}, ease: 'none', onUpdate: draw, onComplete: draw, immediateRender: false }, ${f1(st0)});
  for (let k = 1; k <= 4; k++) flash('#b${x.n}bg', ${f1(st0)} + k * ${step} - 0.02);
}
tl.to(['#beat${x.n}', '#b${x.n}'], { autoAlpha: 0, duration: 0.25, immediateRender: false }, ${f1(x.t0 + T.beat - 0.3)});`;
  }).join('\n');

  const script = `
const D = DATA, $ = id => document.getElementById(id);
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3, immediateRender: false }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25, immediateRender: false }, at);
const MAST = '.hf > .h-head, .hf > .h-src';

// ---- splash: the hovering icon piece clicks in, the Night Owl pops; then it all leaves
${sp.js}
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, ${T.splashOut + 0.05});
tl.set('#splash', { autoAlpha: 0 }, ${T.splashOut + 0.5});
tl.to('#sstage', { y: 900, rotation: 8, duration: 0.5, ease: 'power2.in' }, ${T.splashOut + 0.1});
tl.set('#sstage', { autoAlpha: 0 }, ${T.splashOut + 0.65});
show(MAST, ${T.splashOut + 0.6});
${tierJs}

// ---- the shelf: the dimmed shelf rises, the five line up and fly into their lit sockets
show('#shelf', ${T.shelf}, 0.01);
riseIn('#shead > p', ${T.shelf}, { stagger: 0.12, dur: 0.35 });
tl.fromTo('.ac-old', { y: 30, opacity: 0 }, { y: 0, opacity: 0.38, duration: 0.35, ease: 'power3.out', stagger: 0.025 }, ${T.shelf + 0.1});
riseIn('.ac-socket', ${T.shelf + 0.5}, { stagger: 0.05, dur: 0.35, y: 30 });
${flyers.map(f => `tl.set('#fy${f.j}', { x: ${f1(f.dx)}, y: ${f1(f.dy)}, scale: ${f1(f.k)}, opacity: 0 }, 0);
tl.to('#fy${f.j}', { opacity: 1, duration: 0.25, immediateRender: false }, ${f1(T.shelf + 0.7 + f.j * 0.12)});
popIn('#fy${f.j}', ${f1(T.shelf + 0.7 + f.j * 0.12)}, { from: '0% 0%' });
tl.to('#fy${f.j}', { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut', immediateRender: false }, ${f1(T.shelf + 1.9 + f.j * 0.16)});
tl.to('#so${f.j}', { autoAlpha: 0, duration: 0.15, immediateRender: false }, ${f1(T.shelf + 2.5 + f.j * 0.16)});
flash('#fy${f.j}', ${f1(T.shelf + 2.6 + f.j * 0.16)});`).join('\n')}

// ---- closing: the question over the full shelf
hide('#shead', ${T.close - 0.3});
show('#close', ${T.close}, 0.01);
riseIn('#close > p', ${T.close}, { stagger: 0.35, dur: 0.4 });

// ---- loop: back to the splash (frame 0: the icon piece hovering again)
hide(['#shelf', MAST], ${T.loop}, 0.3);
${sp.js.split('\n').filter(l => l.startsWith('tl.set(') && l.endsWith(', 0.0/1000);')).map(l => l.replace(/, 0\.0\/1000\);$/, `, ${f1(T.loop + 0.3)});`)).join('\n')}
tl.set('#sstage', { autoAlpha: 1 }, ${T.loop + 0.3});
tl.fromTo('#sstage', { y: 900, rotation: 8 }, { y: 0, rotation: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, ${T.loop + 0.3});
tl.set('#splash', { autoAlpha: 1 }, ${T.loop + 0.4});
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, ${T.loop + 0.4});
${logo.back(T.loop + 0.5)}
tl.set({}, {}, ${DURATION});
`;
  const data = { tier: TIER, ink: TIER_INK, amounts: NEW_BADGES.map(b => b.tiers.map(n => b.amount(n))) };
  const qaAt = [0.05, 1.2, 2.3, ...beats.flatMap(x => [x.t0 + 0.9, x.t0 + 1.6, x.t0 + 3.5]), T.shelf + 1.0, T.shelf + 3.6, T.close + 1.5, T.loop - 0.1, DURATION - 0.05];
  return {
    // Cover = frame 0, the complete splash.
    key, duration: DURATION, coverAt: 0.05, safe: SAFE, qaAt,
    html: composition({ key, title: 'Reel 5 new achievements', duration: DURATION, frameHtml, css, data, script }),
  };
}
