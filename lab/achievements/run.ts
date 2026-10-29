// AC1 runner: key frames of the achievements launch Reel (owner 2026-10-29: 5 new achievements join the existing 16),
// three looks side by side so the owner can rate each frame before the HyperFrames builder is written:
//   L1 Puzzle reveal  every badge arrives through the app's shipped last-piece reveal (3×3 jigsaw, icon piece last);
//   L2 Shelf          the 16 existing badges on a shelf, the 5 new ones drop into lit sockets;
//   L3 Tier ladder    each badge from Bronze to Diamond with the number every tier needs;
//   L4 Reveal → shelf the owner's combination (2026-10-29): L1's reveals, then the five fly onto L2's shelf.
// Six frames per look: K1 hook (frame 0), K2 the reveal moment, K3 Muscle Memory, K4 Night Owl, K5 all five (no count of the
// existing ones: owner 2026-10-29), K6 closing. Plus the reveal compared (owner 2026-10-29): A = the app's own cut (speedpuzzling.cz
// assets/last_piece_reveal/geometry.json, ported as is), B = the same motion with pieces from src/pieces/jigsaw.ts.
// Art: the app's final badge files, copied into gitignored content/assets/achievements/ (webp480, manifest, geometry).
// Rule texts are the app's EN strings (translations/messages.en.yml, badges.requirement.*). Writes content/labs/AC1/.
//
//   node lab/achievements/run.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSE, HOUSE_CSS, X0, activateVariant, f1, frame } from '../../src/design/house.ts';
import { escapeHtml as h, page } from '../../src/design/page.ts';
import { singlePiece } from '../../src/design/svg.ts';
import { generateJigsaw } from '../../src/pieces/jigsaw.ts';
import { LOGO_CSS, logoExit } from '../../src/motion/logo.ts';
import { metered } from '../../src/render/meter.ts';
import { FRAMES, createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'AC1';
const DIR = join(ROOT, 'content/labs', LAB);
const ART = join(ROOT, 'content/assets/achievements');
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);
const RX = FRAMES.reel.safe.x1, RW = RX - X0, CX = X0 + RW / 2;
const CORAL = '#ec726f', NAVY = '#2b3445';

if (!existsSync(join(ART, 'geometry.json'))) throw new Error('copy the app art first: see docs/ideas/reel-achievements.md');

// ------------------------------------------------------------------ the five (app texts, 2026-10-29)

type Key = 'muscle_memory' | 'muscle_memory_unboxed' | 'night_owl' | 'competitor' | 'online_competitor';
const NEW: Array<{ key: Key; name: string; tiers: number[]; rule: (n: number | string) => string; unit: string }> = [
  { key: 'muscle_memory', name: 'Muscle Memory', tiers: [3, 8, 15, 30, 50], unit: 'solves', rule: n => `Solve the same 500-piece puzzle ${n} times (solo)` },
  { key: 'muscle_memory_unboxed', name: 'Muscle Memory (unboxed)', tiers: [2, 4, 8, 15, 25], unit: 'solves', rule: n => `Solve the same 500-piece puzzle ${n} times without looking at the box (solo)` },
  { key: 'night_owl', name: 'Night Owl', tiers: [10, 30, 75, 150, 250], unit: 'results', rule: n => `Log ${n} results between 10 pm and 4 am` },
  { key: 'competitor', name: 'Competitor', tiers: [1, 3, 6, 12, 25], unit: 'events', rule: n => `Take part in ${n} in-person competition${n === 1 ? '' : 's'}` },
  { key: 'online_competitor', name: 'Online Competitor', tiers: [2, 6, 12, 25, 50], unit: 'results', rule: n => `Log ${n} results at online competitions` },
];
const OLD = ['puzzles_solved', 'pieces_solved', 'speed_500_pieces', 'speed_1000_pieces', 'streak', 'team_player', 'zen_puzzler', 'first_try',
  'unboxed', 'brand_explorer', 'marathoner', 'photographer', 'steady_hands', 'librarian', 'weekend_puzzler', 'cataloger'];
const TIER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const art = (key: string, tier: number) => `/content/assets/achievements/webp480/${key}-t${tier}.webp`;
const byKey = (k: Key) => NEW.find(b => b.key === k)!;

// ------------------------------------------------------------------ the reveal (port of the app's reveal.js + looks.js)

// looks.js: the card tint, the burst ring and its rays per tier (the pieces and their timing stay the same).
const LOOKS: Record<number, { card: string[]; ring: string; rays: string[]; confetti: string[] }> = {
  1: { card: ['#ffffff', '#fbf3ee', '#f3dfd1'], ring: '#ef9f78', rays: ['#fb8180', '#eea47a', '#75b5fa', '#8fd5da'], confetti: ['#fb8180', '#eea47a', '#75b5fa', '#8fd5da', '#fcd2b8'] },
  3: { card: ['#ffffff', '#fdf7e7', '#f8e9c0'], ring: '#f6b24c', rays: ['#fdd26f', '#fb8180', '#75b5fa', '#9a93f4'], confetti: ['#fdd26f', '#fb8180', '#75b5fa', '#9a93f4', '#8fd5da'] },
  5: { card: ['#ffffff', '#f2f7fd', '#e2ecf9'], ring: '#9a93f4', rays: ['#ffb3cf', '#fdd26f', '#8fd5da', '#75b5fa', '#9a93f4'], confetti: ['#bfe9f6', '#c3bcf6', '#ffb8d2', '#8fd5da', '#a6ccfd', '#fde3a7'] },
};
const look = (tier: number) => LOOKS[tier] ?? LOOKS[1];

interface Cut { pieces: Array<{ d: string; cx: number; cy: number }>; outer: string; seams: string[]; confetti: string[] }
const GEO = JSON.parse(readFileSync(join(ART, 'geometry.json'), 'utf8')) as { outer: string; seams: string[]; pieces: Array<{ d: string; centroid: [number, number] }>; confetti: string[] };
const CUT: Record<'A' | 'B', Cut> = {
  A: { pieces: GEO.pieces.map(p => ({ d: p.d, cx: p.centroid[0], cy: p.centroid[1] })), outer: GEO.outer, seams: GEO.seams, confetti: GEO.confetti },
  B: (() => {
    const j = generateJigsaw({ cols: 3, rows: 3, width: 300, height: 300, seed: 11, tabSize: 0.24, jitter: 0.04 });
    const pieces = [...j.pieces].sort((a, b) => a.row - b.row || a.col - b.col).map(p => ({ d: p.d, cx: p.col * 100 + 50, cy: p.row * 100 + 50 }));
    // confetti: generator pieces normalised to the unit square, like the app's
    const conf = [3, 5, 8].map(s => singlePiece(1, s).d);
    return { pieces, outer: j.border, seams: [j.cuts], confetti: conf };
  })(),
};

const ORDER = [0, 2, 8, 6, 1, 5, 7, 3]; // reveal.js: TL, TR, BR, BL corners, then T, R, B, L edges
const CENTRE = 4;

type RevealState = 'flight' | 'hover' | 'pop';
let uid = 0;
/**
 * One still of the reveal, `px` wide, centred on (cx, top). flight: corners + top edge down, right and bottom edges in
 * the air, left and the icon piece not yet in; hover: the frame is done, the icon piece hovers over its "?" slot;
 * pop: the card has dissolved, the badge stands alone over the burst, with piece confetti.
 */
function reveal(cutId: 'A' | 'B', key: string, tier: number, state: RevealState, cx: number, top: number, px: number) {
  const c = CUT[cutId], L = look(tier), id = `rv${++uid}`, M = 120; // margin around the 300-unit square
  const out: string[] = [`<defs><radialGradient id="${id}c" gradientUnits="userSpaceOnUse" cx="150" cy="142" r="215">${L.card.map((s, i) => `<stop offset="${[0, 0.55, 1][i]}" stop-color="${s}"/>`).join('')}</radialGradient>
    <g id="${id}art"><rect width="300" height="300" fill="url(#${id}c)"/>${rays()}<image href="${art(key, tier)}" x="7" y="7" width="286" height="286"/></g>
    ${c.pieces.map((p, i) => `<clipPath id="${id}p${i}"><path d="${p.d}"/></clipPath>`).join('')}
    <filter id="${id}sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>`];
  if (state === 'pop') {
    // the burst behind the badge: ring + 12 short strokes (reveal.js), then the badge, then piece confetti
    out.push(`<circle cx="150" cy="150" r="168" fill="none" stroke="${L.ring}" stroke-width="5" opacity=".9"/>`);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      out.push(`<line x1="${f1(150 + 186 * Math.cos(a))}" y1="${f1(150 + 186 * Math.sin(a))}" x2="${f1(150 + 214 * Math.cos(a))}" y2="${f1(150 + 214 * Math.sin(a))}" stroke="${L.rays[i % L.rays.length]}" stroke-width="7" stroke-linecap="round"/>`);
    }
    out.push(`<image href="${art(key, tier)}" x="-4" y="-4" width="308" height="308"/>`);
    for (let i = 0; i < 22; i++) {
      const a = i * 2.39996, r = 200 + (i * 37) % 90, s = 14 + (i * 7) % 12;
      out.push(`<path d="${c.confetti[i % c.confetti.length]}" fill="${L.confetti[i % L.confetti.length]}" transform="translate(${f1(150 + r * Math.cos(a))} ${f1(150 + r * Math.sin(a) * 0.9)}) rotate(${(i * 53) % 360}) scale(${s})"/>`);
    }
  } else {
    // the tray: the cut printed faintly with a "?" in the icon slot (assets/img/last-piece-reveal-tray.svg, on navy)
    out.push(`<path d="${c.outer}" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".28" stroke-width="2.4"/>`);
    out.push(`<g fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="2">${c.seams.map(d => `<path d="${d}"/>`).join('')}</g>`);
    out.push(`<text x="150" y="176" text-anchor="middle" font-size="76" font-weight="700" fill="#ffffff" fill-opacity=".38">?</text>`);
    const landed = state === 'flight' ? [0, 2, 8, 6, 1] : ORDER;
    const flying = state === 'flight' ? [{ i: 5, k: 0.45 }, { i: 7, k: 1 }] : [];
    const piece = (i: number, dx: number, dy: number, rot: number, s: number, lifted: boolean) => {
      const p = c.pieces[i];
      const t = `translate(${f1(dx)} ${f1(dy)}) translate(${f1(p.cx)} ${f1(p.cy)}) rotate(${rot}) scale(${s}) translate(${f1(-p.cx)} ${f1(-p.cy)})`;
      return (lifted ? `<path d="${p.d}" fill="${NAVY}" fill-opacity=".55" filter="url(#${id}sh)" transform="translate(${f1(dx + 6)} ${f1(dy + 14)}) translate(${f1(p.cx)} ${f1(p.cy)}) rotate(${rot}) translate(${f1(-p.cx)} ${f1(-p.cy)})"/>` : '')
        + `<g transform="${t}"><g clip-path="url(#${id}p${i})"><use href="#${id}art"/></g><path d="${p.d}" fill="none" stroke="${NAVY}" stroke-width="2.4" stroke-linejoin="round"/></g>`;
    };
    for (const i of landed) out.push(piece(i, 0, 0, 0, 1, false));
    for (const f of flying) {
      const p = c.pieces[f.i], vx = p.cx - 150, vy = p.cy - 150, d = Math.hypot(vx, vy) || 1;
      out.push(piece(f.i, (vx / d) * 150 * f.k, (vy / d) * 150 * f.k - 30 * f.k, f.k * (f.i === 5 ? 14 : -18), 1.1, true));
    }
    if (state === 'hover') out.push(piece(CENTRE, 0, -58, 0, 1.1, true));
  }
  const V = 300 + 2 * M;
  return `<svg class="ac-art" style="left:${f1(cx - px / 2)}px; top:${f1(top)}px" width="${px}" height="${px}" viewBox="${-M} ${-M} ${V} ${V}" aria-hidden="true">${out.join('')}</svg>`;
}

function rays() {
  let d = '';
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI / 18;
    d += `M150 142L${f1(150 + 260 * Math.cos(a0))} ${f1(142 + 260 * Math.sin(a0))}L${f1(150 + 260 * Math.cos(a1))} ${f1(142 + 260 * Math.sin(a1))}Z`;
  }
  return `<path d="${d}" fill="#ffffff" fill-opacity=".55"/>`;
}

// ------------------------------------------------------------------ helpers

const img = (key: string, tier: number, x: number, y: number, s: number, cls = '') =>
  `<img class="ac-b ${cls}" src="${art(key, tier)}" alt="" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(s)}px; height:${f1(s)}px">`;

/** A shelf of 21: the 16 existing badges dimmed, the new 5 lit (or empty sockets when `empty`; `fly` = the new 5 on
 * their way from a row at `fly.y` into the sockets, `fly.k` 0 = start, 1 = in). */
function shelf(top: number, s: number, o: { empty?: boolean; focus?: Key; fly?: { y: number; k: number; size: number } } = {}) {
  const cols = 6, gap = (RW - cols * s) / (cols - 1);
  if (o.fly) {
    const f = o.fly, start = (j: number) => ({ x: X0 + j * ((RW - f.size) / 4), y: f.y + (j % 2) * 60 });
    const flying = NEW.map((b, j) => {
      const i = OLD.length + j, sx = X0 + (i % cols) * (s + gap), sy = top + Math.floor(i / cols) * (s + 26), a = start(j);
      const size = f.size + (s - f.size) * f.k, x = a.x + (sx - a.x) * f.k, y = a.y + (sy - a.y) * f.k - Math.sin(Math.PI * f.k) * 50;
      return img(b.key, 3, x, y, size, 'lit fly');
    }).join('');
    return shelf(top, s, { empty: true }) + flying;
  }
  const all = [...OLD.map(k => ({ k, isNew: false })), ...NEW.map(b => ({ k: b.key as string, isNew: true }))];
  return all.map((b, i) => {
    const x = X0 + (i % cols) * (s + gap), y = top + Math.floor(i / cols) * (s + 26);
    if (b.isNew && o.empty) return `<div class="ac-socket" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(s)}px; height:${f1(s)}px"></div>`;
    const cls = b.isNew ? (o.focus && o.focus !== b.k ? 'dim2' : 'lit') : 'dim';
    return img(b.k, b.isNew ? 3 : (i % 5) + 1, x, y, s, cls);
  }).join('');
}

/** Bronze → Diamond with the number each tier needs. */
function ladder(b: (typeof NEW)[number], top: number, s: number) {
  const gap = (RW - 5 * s) / 4;
  return b.tiers.map((n, i) => {
    const x = X0 + i * (s + gap);
    return `${img(b.key, i + 1, x, top, s)}<p class="ac-tn" style="left:${f1(x - 20)}px; top:${f1(top + s + 10)}px; width:${f1(s + 40)}px">${n}</p>
      <p class="ac-tl" style="left:${f1(x - 20)}px; top:${f1(top + s + 76)}px; width:${f1(s + 40)}px">${TIER[i]}</p>`;
  }).join('');
}

const name = (top: number, text: string) => `<p class="ac-name" style="top:${top}px">${h(text)}</p>`;
const ruleLine = (top: number, text: string) => `<p class="h-abs h-lead ac-rule" style="top:${top}px; width:${RW}px">${h(text)}</p>`;

// ------------------------------------------------------------------ frames

type Look = 'L1' | 'L2' | 'L3' | 'L4';

function k1(lk: Look) {
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  let artHtml = '';
  if (lk === 'L1') artHtml = reveal('A', 'night_owl', 5, 'hover', CX, 930, 860);
  if (lk === 'L2') artHtml = shelf(1010, 118, { empty: true });
  if (lk === 'L3') artHtml = NEW.map((b, i) => img(b.key, 5, X0 + 10 + i * 168, 1060 + (i % 2) * 120, 200)).join('');
  return `<div class="ac-splash">${logo.html}
    <p class="ac-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="ac-c ac-hook" style="top:620px">Badges for</p>
    <p class="ac-c ac-hook hot" style="top:724px">solving puzzles?</p>
    <p class="ac-c ac-sub" style="top:860px">Now there are 5 more!</p>
  </div>${artHtml}`;
}

function k2(lk: Look) {
  const head = `<p class="h-abs h-cap" style="top:480px">New achievement 1 of 5</p>`;
  if (lk === 'L1') return `${head}${name(530, 'Muscle Memory')}${reveal('A', 'muscle_memory', 1, 'hover', CX, 640, 1000)}`;
  if (lk === 'L2') return `${head}${name(530, 'Muscle Memory')}${shelf(720, 118, { empty: true })}
    ${img('muscle_memory', 3, CX - 150, 1180, 300, 'drop')}`;
  return `${head}${name(530, 'Muscle Memory')}${img('muscle_memory', 1, CX - 230, 700, 460)}
    <p class="h-abs h-lab ac-c2" style="top:1200px; width:${RW}px">Bronze · tier 1 of 5</p>`;
}

function explain(lk: Look, key: Key, idx: number, extra = '') {
  const b = byKey(key);
  const head = `<p class="h-abs h-cap" style="top:480px">New achievement ${idx} of 5</p>${name(530, b.name)}`;
  if (lk === 'L1') return `${head}${ruleLine(650, b.rule(b.tiers[0]))}${reveal('A', key, 3, 'pop', CX, 790, 820)}${extra}`;
  if (lk === 'L2') return `${head}${ruleLine(650, b.rule(b.tiers[0]))}${img(key, 3, CX - 170, 800, 340, 'lit')}${shelf(1210, 96, { focus: key })}${extra}`;
  return `${head}${ruleLine(650, b.rule('…'))}${ladder(b, 900, 150)}${extra}`;
}

const k3 = (lk: Look) => explain(lk, 'muscle_memory', 1);
const k4 = (lk: Look) => explain(lk, 'night_owl', 3, `<p class="h-abs h-lab ac-note" style="top:${lk === 'L3' ? 1180 : 760}px; width:${RW}px">Set your time zone in your profile settings</p>`);

function k5(lk: Look) {
  const head = `<p class="h-abs h-cap" style="top:480px">All five</p><p class="h-abs h-title s" style="top:526px; width:${RW}px">5 new achievements to earn</p>`;
  if (lk === 'L2') return `${head}${shelf(740, 126)}`;
  const rows = NEW.map((b, i) => {
    const y = 640 + i * 126;
    return `${img(b.key, lk === 'L3' ? 5 : 3, X0, y, 100)}<p class="ac-row" style="left:${X0 + 140}px; top:${y + 2}px; width:${RW - 140}px"><b>${h(b.name)}</b><br>${h(b.rule(b.tiers[0]))}</p>`;
  }).join('');
  return `${head}${rows}`;
}

/** L4 (owner 2026-10-29): L1's reveals, then the five fly onto the shelf. */
const k5shelf = () => `<p class="h-abs h-cap" style="top:480px">All five</p><p class="h-abs h-title s" style="top:526px; width:${RW}px">5 new achievements to earn</p>
  ${shelf(1060, 118, { fly: { y: 700, k: 0.08, size: 170 } })}`;
const k6shelf = () => `<p class="h-abs h-ask" style="top:500px; width:${RW}px">Your past solves count: you may already have some</p>
  <p class="h-abs h-lead" style="top:800px; width:${RW}px">See yours: myspeedpuzzling.com/en/achievements</p>${shelf(1000, 118)}`;

function k6(lk: Look) {
  let artHtml = '';
  if (lk === 'L1') artHtml = reveal('A', 'competitor', 5, 'pop', CX, 1000, 560);
  if (lk === 'L2') artHtml = shelf(1010, 118);
  if (lk === 'L3') artHtml = NEW.map((b, i) => img(b.key, i + 1, X0 + 10 + i * 168, 1060 + (i % 2) * 120, 200)).join('');
  return `<p class="h-abs h-ask" style="top:500px; width:${RW}px">Your past solves count: you may already have some</p>
    <p class="h-abs h-lead" style="top:800px; width:${RW}px">See yours: myspeedpuzzling.com/en/achievements</p>${artHtml}`;
}

/** The reveal comparison: the same moment with the app's cut (A) and with generator pieces (B). */
function rv(cutId: 'A' | 'B', state: RevealState) {
  return `<p class="h-abs h-cap" style="top:480px">New achievement 1 of 5</p>${name(530, 'Muscle Memory')}${reveal(cutId, 'muscle_memory', 1, state, CX, 640, 1000)}`;
}

const FRAMES_OF = [
  { k: 'K1', label: 'Hook (frame 0)', f: k1, splash: true },
  { k: 'K2', label: 'The reveal moment', f: k2 },
  { k: 'K3', label: 'Muscle Memory and its rule', f: k3 },
  { k: 'K4', label: 'Night Owl (+ time zone note)', f: k4 },
  { k: 'K5', label: 'All five', f: k5 },
  { k: 'K6', label: 'Closing: past solves count + link', f: k6 },
];
const LOOKS_OF: Array<{ id: Look; name: string; note: string }> = [
  { id: 'L1', name: 'Puzzle reveal', note: 'Every badge arrives through the app\'s own last-piece reveal: frame pieces snap in, the icon piece clicks in last, burst and piece confetti.' },
  { id: 'L2', name: 'Shelf', note: 'The badges you can already earn on a shelf (dimmed, no count named), the 5 new ones drop into lit sockets.' },
  { id: 'L3', name: 'Tier ladder', note: 'Each badge from Bronze to Diamond with the number every tier needs.' },
  { id: 'L4', name: 'Reveal → shelf (owner\'s combination)', note: 'L1\'s puzzle reveal for every badge (K1–K4 as L1), then the five fly onto the shelf and land in lit sockets (K5), closing on the full shelf (K6).' },
];
const REVEALS = [
  { k: 'RA-1', cut: 'A' as const, state: 'flight' as const, label: 'A · app cut: frame pieces flying in' },
  { k: 'RA-2', cut: 'A' as const, state: 'hover' as const, label: 'A · app cut: the icon piece hovers' },
  { k: 'RB-1', cut: 'B' as const, state: 'flight' as const, label: 'B · our generator: frame pieces flying in' },
  { k: 'RB-2', cut: 'B' as const, state: 'hover' as const, label: 'B · our generator: the icon piece hovers' },
];

const CSS = HOUSE_CSS + LOGO_CSS + `
.ac-art { position: absolute; overflow: visible; }
.ac-b { position: absolute; display: block; }
.ac-b.dim { opacity: .38; }
.ac-b.dim2 { opacity: .55; }
.ac-b.lit { filter: drop-shadow(0 0 18px rgba(255, 210, 120, .55)); }
.ac-b.fly { filter: drop-shadow(0 0 18px rgba(255, 210, 120, .55)) drop-shadow(0 22px 26px rgba(0, 0, 0, .45)); }
.ac-b.drop { filter: drop-shadow(0 26px 30px rgba(0, 0, 0, .5)); transform: rotate(-8deg); }
.ac-socket { position: absolute; border-radius: 50%; border: 4px dashed ${CORAL}; background: rgba(236, 114, 111, .12); box-sizing: border-box; }
.ac-name { position: absolute; left: ${X0}px; width: ${RW}px; margin: 0; font-size: 88px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; color: var(--g-ink); }
.ac-rule { font-size: 46px; }
.ac-note { color: var(--g-hot-text); font-weight: 600; }
.ac-c2 { text-align: center; }
.ac-tn { position: absolute; margin: 0; text-align: center; font-size: 56px; font-weight: 700; line-height: 1; color: var(--g-ink); }
.ac-tl { position: absolute; margin: 0; text-align: center; font-size: 30px; color: var(--g-soft); }
.ac-row { position: absolute; margin: 0; font-size: 30px; line-height: 1.2; color: var(--g-soft); }
.ac-row b { font-size: 36px; color: var(--g-ink); }
.ac-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.ac-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.ac-hook { font-size: 100px; }
.ac-hook.hot { color: var(--g-hot); }
.ac-sub { font-size: 48px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.splash .hf > .h-head, .splash .hf > .h-src { display: none; }
`;

// ------------------------------------------------------------------ render + gallery

activateVariant(HOUSE);
const wrap = (body: string, splash = false) => `<div class="${splash ? 'splash' : ''}">${frame({ ground: 'navy', kind: 'story', kicker: 'New · achievements', device: HOUSE.device, src: 'Achievements · added Oct 2026', rows: { headTop: 296 }, masthead: true, body })}</div>`;
const jobs = [
  ...LOOKS_OF.flatMap(L => FRAMES_OF.map(F => {
    const f = L.id !== 'L4' ? F.f(L.id) : F.k === 'K5' ? k5shelf() : F.k === 'K6' ? k6shelf() : F.f('L1');
    const label = L.id === 'L4' && F.k === 'K5' ? 'All five fly onto the shelf' : L.id === 'L4' && F.k === 'K6' ? 'Closing on the full shelf + link' : F.label;
    return { key: `${L.id}-${F.k}`, group: L.id as string, label, body: wrap(f, F.splash) };
  })),
  ...REVEALS.map(R => ({ key: R.k, group: 'R', label: R.label, body: wrap(rv(R.cut, R.state)) })),
].map(j => ({ ...j, html: page(j.body, { frame: 'reel', css: CSS, title: `${LAB} ${j.key}` }) }));
activateVariant(undefined);

const renderer = await createRenderer(DIR);
const out: Array<{ key: string; group: string; label: string; jpg: string; preview: string; errors: string[] }> = [];
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-keyframes`, posts: 1, slides: jobs.length, engine: 'playwright/chromium' }, async () => {
    for (const j of jobs) {
      const r = await renderer.render({ id: j.key, html: j.html, frame: 'reel' });
      out.push({ key: j.key, group: j.group, label: j.label, jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors });
      for (const e of r.qa.errors) console.log(`  ERROR ${j.key}: ${e}`);
    }
  });
} finally { await renderer.close(); }

const tiles = (group: string) => `<div class="grid">${out.filter(o => o.group === group).map(o => `<div class="tile"><a href="${o.jpg}" target="_blank"><img src="${o.preview}" alt="${o.key}"></a>
<p class="code"><b>${o.key}</b> ${h(o.label)}${o.errors.length ? ` <span style="color:#c33">${o.errors.length} QA errors</span>` : ''}</p>
<div class="rate" data-target="${o.key}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`).join('')}</div>`;

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} Achievements Reel</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}h2{margin:34px 0 4px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}.tile{background:#fff;border-radius:10px;padding:10px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px;font-size:14px}.rate button{margin-right:5px;padding:3px 9px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · Achievements launch Reel: key frames, three looks + reveal A/B</h1></header>
<main><p>5 new achievements (Muscle Memory, Muscle Memory unboxed, Night Owl, Competitor, Online Competitor) are released. Copy names only the new ones (owner 2026-10-29: no \"joined the 16\").
Final app art (approved 29 Oct); rule texts are the app's own. Six key frames per look of a ~25 s Reel; the motion between them (pieces flying in,
badges dropping, count-ups) comes in the builder. Rate each frame (codes like "L2-K3" work in the chat); mixing looks per frame is fine.
Frames are 1080×1920; text stays in the Reel safe area (y 220–1250), art below it may sit under Instagram's caption.</p>
<p>Owner's direction (29 Oct): <b>L4</b> = L1's reveal for each badge, then the five onto the shelf. L1–L3 stay for reference.</p>
<h2>Reveal pieces: A vs B</h2><p>The same moment twice. <b>A</b> = the app's shipped cut, ported as is (what players see). <b>B</b> = the same motion with pieces from our generator (house rule). L1 frames above use A until you pick.</p>
${tiles('R')}
${LOOKS_OF.map(L => `<h2>${L.id} · ${L.name}</h2><p>${h(L.note)}</p>${tiles(L.id)}`).join('')}
</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'keyframe',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${out.length} frames, ${out.reduce((s, o) => s + o.errors.length, 0)} QA errors → node tools/review.ts → /content/labs/${LAB}/`);
