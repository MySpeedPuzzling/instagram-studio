// Subject tier list (DL3 G1 idea A2, DL4 H4 "tier-list" prototype; owner picked it 2026-11-07 as a weekend data
// carousel and asked for "a category on its own for puzzles like Krypt, call it HELL or something funny"):
//   1 cover   poster: "Where would you put butterflies?", the S–C board below with the slowest subject lifted off;
//   2 board   every subject with its median solo-500 time (S = fastest);
//   3 detail  S and A: box, median bar from 0, puzzles and results behind each subject;
//   4 detail  B and C;
//   5 hell    HELL tier: Ravensburger's Krypt puzzles (one colour, no picture) as pieces in a row, then one time scale
//             from the fastest subject to the slowest Krypt, and the question for the comments.
// Subjects come from words in puzzle titles (bs-theme-speed, boxes-subject-speed); every number comes from the facts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchBoxes } from '../data/boxes.ts';
import { query, type QueryResult } from '../data/db.ts';
import {
  CW, FEED, FEED_H, GROUNDS, TYPE, W, X0, X1, f1, frame, groundVars, linesOf, posterAt, posterTopPath, seamReach, slide, slotOf,
  type Ground, type SlideCtx, type Variant,
} from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { singlePiece } from '../design/svg.ts';
import { generateJigsaw, type Piece } from '../pieces/jigsaw.ts';
import { ROOT } from '../render/server.ts';

type Row = Record<string, string>;
const num = (s: string | undefined) => Number(s ?? NaN);
const SHADOW = 'rgba(16,22,34,.32)';

// ---------------------------------------------------------------- colour helpers (as in lab/dl4/posts/ideas.ts)
const rgbOf = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
const hexOf = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = (x: string) => {
  const [r, g, b] = rgbOf(x).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const blend = (fg: string, bg: string, a: number) => hexOf(rgbOf(fg).map((v, i) => v * a + rgbOf(bg)[i] * (1 - a)));
const dist = (a: string, b: string) => Math.hypot(...rgbOf(a).map((v, i) => v - rgbOf(b)[i]));
interface Tone { css: string; hex: string; op?: number }
const textOn = (g: Ground, fill: string): Tone =>
  contrast(g.ink, fill) >= contrast(g.bg, fill) ? { css: 'var(--g-ink)', hex: g.ink } : { css: 'var(--g-bg)', hex: g.bg };
/** Tier fills, fast → slow: S the highlight, then ink fading into the ground. */
function tierTones(g: Ground): Tone[] {
  const s: Tone = dist(g.chart.hot, g.ink) > 120 ? { css: 'var(--c-hot)', hex: g.chart.hot } : { css: 'var(--g-ink)', hex: g.ink };
  const tone = (op: number): Tone => {
    const best = (o: number) => { const hx = blend(g.ink, g.bg, o); return Math.max(contrast(g.ink, hx), contrast(g.bg, hx)); };
    for (let k = 0; k < 12 && best(op) < 3.4; k++) op = op >= 0.5 ? Math.min(1, op + 0.03) : Math.max(0, op - 0.03);
    return { css: 'var(--g-ink)', op: Number(op.toFixed(2)), hex: blend(g.ink, g.bg, op) };
  };
  return [s, ...[0.76, 0.54, 0.28].map(tone)];
}
const fillAttr = (t: Tone) => `fill="${t.css}"${t.op ? ` fill-opacity="${t.op}"` : ''}`;

const STYLE = `<style>
.tl-svg { position: absolute; left: 0; top: 0; }
.tl-mid { position: absolute; transform: translate(-50%, -50%); font-weight: 800; line-height: 1; white-space: nowrap; }
.tl-small { font-size: 24px; line-height: 1.25; color: var(--g-soft); }
.tl-sub { position: absolute; text-align: center; transform: translateX(-50%); }
.tl-sub .nm { font-size: 24px; font-weight: 700; line-height: 1.1; color: var(--g-ink); text-wrap: balance; }
.tl-sub .m { font-size: 30px; font-weight: 700; line-height: 1.1; margin-top: 2px; color: var(--g-ink); }
.tl-sub .m span { font-size: 24px; font-weight: 400; color: var(--g-soft); }
.tl-sub .bd { font-size: 24px; font-weight: 600; line-height: 1.1; color: var(--g-soft); white-space: nowrap; }
.tl-drow { position: absolute; }
.tl-drow .nm { font-size: 34px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.tl-drow .cr { font-size: 24px; line-height: 1.2; color: var(--g-soft); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-dval { position: absolute; font-size: 34px; font-weight: 700; line-height: 1; white-space: nowrap; color: var(--g-ink); }
.tl-dmeta { position: absolute; font-size: 24px; line-height: 1.2; color: var(--g-soft); white-space: nowrap; }
.tl-hell { position: absolute; text-align: center; transform: translateX(-50%); }
.tl-hell .t { font-size: 36px; font-weight: 700; line-height: 1.05; color: var(--g-ink); white-space: nowrap; }
.tl-hell .nm { font-size: 30px; font-weight: 700; line-height: 1.15; margin-top: 6px; color: var(--g-ink); }
.tl-hell .p { font-size: 24px; line-height: 1.2; color: var(--g-soft); white-space: nowrap; }
.tl-sc { position: absolute; font-size: 30px; line-height: 1.05; white-space: nowrap; color: var(--g-ink); }
.tl-sc i { font-style: normal; font-size: 24px; color: var(--g-soft); }
.tl-scv { position: absolute; font-size: 30px; font-weight: 700; line-height: 1; white-space: nowrap; color: var(--g-ink); }
.tl-ask { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 42px; font-weight: 700; line-height: 1.15; color: var(--g-ink); }
</style>`;

// ---------------------------------------------------------------- data
/** Subjects on the board: bs-theme-speed themes minus colour words, series, artists and near-duplicates (as in DL4). */
const SUBJECTS: Array<[string, string]> = [
  ['disney/pixar', 'Disney & Pixar'], ['postcards', 'Postcards'], ['kawaii/cute', 'Kawaii'], ['national parks', 'National parks'],
  ['balloons', 'Balloons'], ['lighthouse', 'Lighthouses'], ['gradient/rainbow', 'Rainbows'], ['library/books', 'Books'],
  ['dogs', 'Dogs'], ['cats', 'Cats'], ['ocean', 'Ocean'], ['christmas', 'Christmas'], ['flowers', 'Flowers'],
  ['birds', 'Birds'], ['snow/winter', 'Winter'], ['food/sweets', 'Sweets'], ['mushrooms', 'Mushrooms'], ['butterflies', 'Butterflies'],
];
const TIERS = [
  { key: 'S', band: '< 60 min', max: 60 },
  { key: 'A', band: '60–65 min', max: 65 },
  { key: 'B', band: '65–70 min', max: 70 },
  { key: 'C', band: '70+ min', max: Infinity },
];
/** Subjects per tier, by their minutes as shown (rounded), so "60 min" never sits under "< 60 min". */
const tiersOf = (subs: Subject[]) => TIERS.map((t, i) => ({ ...t, subs: subs.filter(x => Math.round(x.median) < t.max && (i === 0 || Math.round(x.median) >= TIERS[i - 1].max)) }));
/** Krypt puzzles slower than this many minutes go to HELL (Krypt Gradient, with colours to go by, stays out). */
const HELL_MIN = 240;

interface Box { puzzle: string; brand: string; img: string; ar: number }
export interface Subject { theme: string; name: string; median: number; results: number; puzzles: number; box: Box }
export interface HellPuzzle { puzzle: string; short: string; pieces: number; medianS: number; fastestS: number; results: number; solvers: number; box: Box }
export interface TierSpec { subjects: Subject[]; hell: HellPuzzle[]; mercy?: HellPuzzle; src: string; asOf: string }

function imgSize(url: string) {
  const b = readFileSync(join(ROOT, url));
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return { w: 4, h: 3 };
}

export async function buildTierSpec(o: { fresh: boolean }): Promise<{ spec: TierSpec; facts: Record<string, QueryResult> }> {
  const names = ['bs-theme-speed', 'boxes-subject-speed', 'tier-hell'] as const;
  const q = Object.fromEntries(names.map(n => [n, query(n, { fresh: o.fresh })])) as Record<typeof names[number], QueryResult>;
  const speed = new Map(q['bs-theme-speed'].rows.map(r => [r.theme, r]));
  const reps = q['boxes-subject-speed'].rows;
  const imgs = await fetchBoxes([...reps.map(r => r.image), ...q['tier-hell'].rows.map(r => r.image)].filter(Boolean), 'puzzle_large');
  const toBox = (r: Row): Box | null => {
    const img = r.image ? imgs.get(r.image) : undefined;
    if (!img) return null;
    const s = imgSize(img);
    return { puzzle: r.puzzle, brand: r.brand, img, ar: s.w / s.h };
  };
  const used = new Set<string>();
  const subjects = SUBJECTS.flatMap(([theme, name]) => {
    const s = speed.get(theme);
    const rep = reps.filter(r => r.theme === theme).sort((a, b) => num(a.rk) - num(b.rk)).find(r => !used.has(r.puzzle_id) && toBox(r));
    if (!s || !rep) return [];
    used.add(rep.puzzle_id);
    return [{ theme, name, median: num(s.median_min), results: num(s.solo_results), puzzles: num(s.puzzles), box: toBox(rep)! }];
  }).sort((a, b) => a.median - b.median);
  if (subjects.length < 16) throw new Error(`tier-list: only ${subjects.length} subjects came back`);
  const krypt = q['tier-hell'].rows.flatMap(r => {
    const box = toBox(r);
    return box ? [{ puzzle: r.puzzle, short: r.puzzle.replace(/^Krypt\s+/i, ''), pieces: num(r.pieces), medianS: num(r.median_s), fastestS: num(r.fastest_s), results: num(r.solo_results), solvers: num(r.solvers), box }] : [];
  });
  const hell = krypt.filter(k => k.medianS / 60 >= HELL_MIN).sort((a, b) => b.medianS - a.medianS);
  const mercy = krypt.find(k => k.medianS / 60 < HELL_MIN);
  if (hell.length < 3) throw new Error('tier-list: fewer than 3 Krypt puzzles for HELL');
  const asOf = new Date(q['bs-theme-speed'].queried_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });
  return { spec: { subjects, hell, mercy, asOf, src: `Data: myspeedpuzzling.com · ${asOf}` }, facts: q };
}

// ---------------------------------------------------------------- formatting
/** "10 h 24 min", "95 min". */
export const hm = (sec: number) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
};
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const lc = (n: string) => (/^(Disney|Christmas)/.test(n) ? n : n.toLowerCase());
const brandList = (boxes: Box[]) => {
  const n = new Map<string, number>();
  for (const b of boxes) n.set(b.brand, (n.get(b.brand) ?? 0) + 1);
  return andList([...n.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k));
};

// ---------------------------------------------------------------- drawing helpers
let uid = 0;
const nextId = (p: string) => `tl${p}${++uid}`;
function pieceArt(p: Piece, b: Box) {
  const id = nextId('pa');
  return `<clipPath id="${id}"><path d="${p.d}"/></clipPath>
    <image href="${b.img}" x="${f1(p.bbox.x)}" y="${f1(p.bbox.y)}" width="${f1(p.bbox.width)}" height="${f1(p.bbox.height)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}
function mount(b: Box, x: number, y: number, w: number, hh: number, pad = 4) {
  return `<div class="h-mount" style="left:${f1(x - pad)}px; top:${f1(y - pad)}px; width:${f1(w + 2 * pad)}px; height:${f1(hh + 2 * pad)}px; padding:${pad}px; border-radius:6px"><img src="${b.img}" alt=""></div>`;
}
const fit = (b: Box, maxW: number, maxH: number) => (maxW / b.ar <= maxH ? { w: maxW, h: maxW / b.ar } : { w: maxH * b.ar, h: maxH });
const svg = (inner: string) => `<svg class="tl-svg" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true">${inner}</svg>`;
function lifted(p: Piece, b: Box, cx: number, cy: number, rot: number, s: number) {
  const pcx = p.bbox.x + p.bbox.width / 2, pcy = p.bbox.y + p.bbox.height / 2;
  const t = (dx: number, dy: number) => `translate(${f1(cx + dx)} ${f1(cy + dy)}) rotate(${rot}) scale(${s}) translate(${f1(-pcx)} ${f1(-pcy)})`;
  return `<path d="${p.d}" transform="${t(12, 16)}" fill="${SHADOW}"/>
    <g transform="${t(0, 0)}">${pieceArt(p, b)}<path d="${p.d}" fill="none" stroke="#ffffff" stroke-width="3" vector-effect="non-scaling-stroke"/></g>`;
}
function badgePiece(x: number, y: number, px: number, fill: Tone, seed = 23) {
  const sp = singlePiece(60, seed);
  const [vx, vy, vw, vh] = sp.viewBox.split(' ').map(Number);
  const k = px / Math.max(vw, vh);
  return { svg: `<g transform="translate(${f1(x - vx * k)} ${f1(y - vy * k)}) scale(${f1(k)})"><path d="${sp.d}" ${fillAttr(fill)}/></g>`, cx: x + (90 - vx) * k, cy: y + (90 - vy) * k };
}

interface ArtArea { top: number; bottom: number; g: Ground; seam?: number }
/** Poster cover whose hero is a picture (as DL4 artSlide, poster branch only: HOUSE = H4). */
function artCoverSlide(x: SlideCtx, s: { kicker: string; title: string; dek: string; src: string; titlePx: number; titleW: number; dekPx: number; art: (a: ArtArea) => string }): string {
  if (!posterAt(x)) throw new Error('tier-list cover expects the H4 poster');
  const v = x.v;
  const px = Math.min(s.titlePx, 68), tw = s.titleW;
  const titleH = linesOf(s.title, px, tw, true) * px * 1.06;
  const dekH = 18 + linesOf(s.dek, s.dekPx, tw) * s.dekPx * 1.3;
  const topG = GROUNDS[v.ground(slotOf(x, 'cover'))], base = GROUNDS[v.posterBase ?? 'navyDeep'];
  const T = 174, seam = Math.round(T + titleH + dekH + 66);
  const head = `<h1 class="h-title" style="top:${T}px; width:${tw}px; font-size:${px}px; line-height:1.06">${h(s.title)}</h1>
    <p class="h-dek h-abs" style="top:${f1(T + titleH + 18)}px; width:${tw}px; font-size:${s.dekPx}px">${h(s.dek)}</p>`;
  const under = `<svg class="h-poster-top" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true"><path d="${posterTopPath(seam)}" fill="${topG.bg}"/></svg>
    <div style="${groundVars(topG)}" data-qa-bg="${topG.bg}">${head}</div>`;
  return frame({ ground: base.key, kicker: s.kicker, idx: [x.slide, x.of], device: v.device, body: STYLE + s.art({ top: seam + Math.max(82, Math.round(seamReach().down) + 16), bottom: FEED.contentBottom, g: base, seam }), src: s.src, under, noRule: true, headGround: topG.key });
}
const titleBlock = (title: string, px: number = TYPE.title) => `<h1 class="h-title" style="top:${FEED.contentTop}px; width:${CW}px; font-size:${px}px">${h(title)}</h1>`;

// ---------------------------------------------------------------- slides
const KICKER = 'Tier list · Puzzle subjects';

export function tierSlides(v: Variant, s: TierSpec): string[] {
  const subs = s.subjects;
  const tiers = tiersOf(subs);
  if (tiers.some(t => t.subs.length > 5)) throw new Error(`tier-list: a tier has more than 5 subjects (${tiers.map(t => t.subs.length).join('/')})`);
  const slowest = subs[subs.length - 1], fastest = subs[0];
  const cols = 6, PW = CW / cols;
  const twoLines = (t: (typeof tiers)[number]) => t.subs.some(x => x.name.length > 11);
  const order = ['cover', 'board', 'fast', 'slow', 'hell'] as const;
  const ctx = (k: typeof order[number]): SlideCtx => ({ v, post: 'tier-list', slide: order.indexOf(k) + 1, of: order.length });
  const allBoxes = subs.map(x => x.box);
  const mainBrand = [...allBoxes.reduce((m, b) => m.set(b.brand, (m.get(b.brand) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0][0];
  const boardCredit = `Box art: ${brandList(allBoxes)}; every box is named on slides 3 and 4`;

  function board(o: { g: Ground; top: number; bottom: number; hide?: string; times: boolean; highlight?: string; maxGap?: number }) {
    const tones = tierTones(o.g);
    const labH = (t: (typeof tiers)[number]) => 10 + (o.times ? 34 : 0) + (twoLines(t) ? 54 : 28);
    const fixed = tiers.reduce((a, t) => a + labH(t), 0);
    const avail = o.bottom - o.top;
    const PH = Math.floor(Math.min(118, (avail - fixed - 3 * 18) / 4));
    const gap = Math.min(o.maxGap ?? 40, (avail - fixed - 4 * PH) / 3);
    const art: string[] = [], html: string[] = [];
    let held: { p: Piece; s: Subject } | null = null;
    let y = o.top;
    tiers.forEach((t, ti) => {
      const tone = tones[ti];
      const jig = generateJigsaw({ cols, rows: 1, width: CW, height: PH, x: X0, y, seed: 41 + ti, tabSize: 0.22 });
      const ps = [...jig.pieces].sort((a, b) => a.col - b.col);
      ps.forEach((p, k) => {
        const sub = k ? t.subs[k - 1] : undefined;
        const shown = k === 0 || (sub && sub.theme !== o.hide);
        if (sub && sub.theme === o.hide) held = { p, s: sub };
        if (shown) art.push(`<path d="${p.d}" transform="translate(5 7)" fill="${SHADOW}"/>`);
        art.push(k === 0 ? `<path d="${p.d}" ${fillAttr(tone)}/>` : shown ? pieceArt(p, sub!.box) : `<path d="${p.d}" fill="var(--g-band)"/>`);
      });
      ps.forEach(p => art.push(`<path d="${p.d}" fill="none" stroke="var(--g-bg)" stroke-width="5" stroke-linejoin="round"/>`));
      if (o.highlight) {
        const k = t.subs.findIndex(x => x.theme === o.highlight);
        if (k >= 0) art.push(`<path d="${ps[k + 1].d}" fill="none" stroke="var(--g-ink)" stroke-width="6" stroke-linejoin="round"/>`);
      }
      const cx = (k: number) => X0 + PW * (k + 0.5);
      const lt = textOn(o.g, tone.hex);
      html.push(`<span class="tl-mid" data-qa-bg="${tone.hex}" style="left:${f1(cx(0))}px; top:${f1(y + PH / 2)}px; font-size:${Math.round(Math.min(64, PH * 0.56))}px; color:${lt.css}">${t.key}</span>
        <div class="tl-sub" data-qa-small style="left:${f1(cx(0))}px; top:${y + PH + 10}px; width:${f1(PW - 8)}px"><p class="bd">${h(t.band)}</p></div>`);
      t.subs.forEach((x, k) => {
        if (x.theme === o.hide) return;
        html.push(`<div class="tl-sub" data-qa-small style="left:${f1(cx(k + 1))}px; top:${y + PH + 10}px; width:${f1(PW - 8)}px">
          ${o.times ? `<p class="m">${Math.round(x.median)} <span>min</span></p>` : ''}<p class="nm">${h(x.name)}</p></div>`);
      });
      y += PH + labH(t) + gap;
    });
    return { art: art.join(''), html: html.join(''), held: held as { p: Piece; s: Subject } | null, PH };
  }

  const detail = (x: SlideCtx, tierKeys: string[], title: string) => {
    const g = GROUNDS[v.ground(slotOf(x, 'data'))], tones = tierTones(g);
    const ts = tiers.map((t, i) => ({ ...t, tone: tones[i] })).filter(t => tierKeys.includes(t.key));
    const list = ts.flatMap(t => t.subs.map(sub => ({ sub, t })));
    const top = 330, bottom = 1186, rh = Math.min(118, (bottom - top - 24 * (ts.length - 1)) / list.length);
    const BX = 178, BW = 108, NX = 306, barX = 652, barW = 220, maxMin = 100;
    const art: string[] = [], html: string[] = [];
    let y = top, prev = '';
    list.forEach(({ sub, t }) => {
      if (prev && prev !== t.key) y += 24;
      if (prev !== t.key) {
        const b = badgePiece(X0 - 12, y + (rh - 84) / 2, 84, t.tone);
        art.push(b.svg);
        html.push(`<span class="tl-mid" data-qa-bg="${t.tone.hex}" style="left:${f1(b.cx)}px; top:${f1(b.cy)}px; font-size:44px; color:${textOn(g, t.tone.hex).css}">${t.key}</span>`);
      }
      prev = t.key;
      const sz = fit(sub.box, BW - 8, rh - 22);
      html.push(mount(sub.box, BX + (BW - sz.w) / 2, y + (rh - sz.h) / 2 - 2, sz.w, sz.h));
      const bw = (Math.min(sub.median, maxMin) / maxMin) * barW;
      art.push(`<rect x="${barX}" y="${f1(y + rh / 2 - 26)}" width="${barW}" height="26" fill="var(--g-band)"/>
        <rect x="${barX}" y="${f1(y + rh / 2 - 26)}" width="${f1(bw)}" height="26" ${fillAttr(t.tone)}/>`);
      html.push(`<div class="tl-drow" style="left:${NX}px; width:${barX - NX - 16}px; top:${f1(y + rh / 2 - 34)}px">
          <p class="nm">${h(sub.name)}</p><p class="cr" data-qa-small>${h(sub.box.brand === mainBrand ? sub.box.puzzle : `${sub.box.puzzle} (${sub.box.brand})`)}</p></div>
        <span class="tl-dval" style="left:${f1(barX + barW + 14)}px; top:${f1(y + rh / 2 - 31)}px">${sub.median.toFixed(1)}</span>
        <span class="tl-dmeta" data-qa-small style="left:${barX}px; top:${f1(y + rh / 2 + 6)}px">${fmtInt(sub.puzzles)} puzzles · ${fmtInt(sub.results)} results</span>`);
      y += rh;
    });
    return slide(x, 'data', {
      kicker: KICKER, src: s.src,
      body: STYLE + svg(art.join('')) + titleBlock(title, 56)
        + `<p class="h-abs tl-small" data-qa-small style="top:252px">Median solo minutes on 500-piece puzzles, bars from 0 to ${maxMin}. Each subject's most-solved box; box art: ${h(mainBrand)} unless noted.</p>`
        + html.join(''),
    }).html;
  };

  const make: Record<typeof order[number], () => string> = {
    cover: () => artCoverSlide(ctx('cover'), {
      kicker: KICKER, title: `Where would you put ${slowest.name.toLowerCase()}?`, titleW: 640, titlePx: 68,
      dek: `${subs.length} subjects, ranked by median solo time on 500s. Plus one tier from hell.`, dekPx: 30, src: boardCredit,
      art: a => {
        const q = board({ g: a.g, top: a.top, bottom: a.bottom, hide: slowest.theme, times: false, maxGap: 52 });
        const cy = a.seam ?? FEED.contentTop + 120;
        return svg(q.art + (q.held ? lifted(q.held.p, q.held.s.box, 862, cy, 11, 1.3 * Math.min(1, 118 / q.PH)) : '')) + q.html;
      },
    }),
    board: () => {
      const x = ctx('board'), g = GROUNDS[v.ground(slotOf(x, 'data'))];
      const title = `Median solo times: ${lc(slowest.name)} ${Math.round(slowest.median)} min, ${fastest.name} ${Math.round(fastest.median)}.`;
      const a = board({ g, top: 344, bottom: FEED.contentBottom, times: true, highlight: slowest.theme });
      return slide(x, 'data', { kicker: KICKER, src: boardCredit, body: STYLE + svg(a.art) + titleBlock(title, 56) + a.html }).html;
    },
    fast: () => detail(ctx('fast'), ['S', 'A'], 'S and A: the quick ones'),
    slow: () => detail(ctx('slow'), ['B', 'C'], 'B and C: settle in'),
    hell: () => hellSlide(ctx('hell')),
  };

  /** HELL: the Krypt row as one jigsaw strip (label piece + one piece per Krypt), then one time scale for everything. */
  function hellSlide(x: SlideCtx) {
    const g = GROUNDS[v.ground(slotOf(x, 'data'))];
    const hot: Tone = { css: 'var(--c-hot)', hex: g.chart.hot };
    const n = s.hell.length, rowCols = n + 1, PWh = CW / rowCols, PH = 128, top = 336;
    const jig = generateJigsaw({ cols: rowCols, rows: 1, width: CW, height: PH, x: X0, y: top, seed: 61, tabSize: 0.22 });
    const ps = [...jig.pieces].sort((a, b) => a.col - b.col);
    const art: string[] = [], html: string[] = [];
    ps.forEach((p, k) => {
      art.push(`<path d="${p.d}" transform="translate(5 7)" fill="${SHADOW}"/>`);
      art.push(k === 0 ? `<path d="${p.d}" ${fillAttr(hot)}/>` : pieceArt(p, s.hell[k - 1].box));
    });
    ps.forEach(p => art.push(`<path d="${p.d}" fill="none" stroke="var(--g-bg)" stroke-width="5" stroke-linejoin="round"/>`));
    const cx = (k: number) => X0 + PWh * (k + 0.5);
    html.push(`<span class="tl-mid" data-qa-bg="${hot.hex}" style="left:${f1(cx(0))}px; top:${f1(top + PH / 2)}px; font-size:46px; color:${textOn(g, hot.hex).css}">HELL</span>
      <div class="tl-hell" data-qa-small style="left:${f1(cx(0))}px; top:${top + PH + 14}px; width:${f1(PWh - 6)}px"><p class="p">median, solo</p></div>`);
    s.hell.forEach((k, i) => {
      html.push(`<div class="tl-hell" style="left:${f1(cx(i + 1))}px; top:${top + PH + 14}px; width:${f1(PWh - 6)}px">
        <p class="t">${h(hm(k.medianS).replace(' min', ''))}</p><p class="nm" data-qa-small>${h(k.short)}</p><p class="p" data-qa-small>${fmtInt(k.pieces)} pieces</p></div>`);
    });

    // One time scale: fastest subject, slowest subject, the friendly Krypt, the HELL Krypts (minutes, from 0).
    const scale: Array<{ label: string; meta: string; sec: number; hot?: boolean }> = [
      { label: fastest.name, meta: '500 pieces', sec: fastest.median * 60 },
      { label: slowest.name, meta: '500 pieces', sec: slowest.median * 60 },
      ...(s.mercy ? [{ label: s.mercy.puzzle, meta: `${s.mercy.pieces} pieces, with colours`, sec: s.mercy.medianS }] : []),
      { label: s.hell[0].puzzle, meta: `${s.hell[0].pieces} pieces`, sec: s.hell[0].medianS, hot: true },
    ];
    const maxS = Math.max(...scale.map(r => r.sec));
    const sTop = 660, rowH = 96, LX = X0, BX0 = X0 + 300, BW = X1 - BX0 - 190;
    scale.forEach((r, i) => {
      const y = sTop + i * rowH;
      const bw = Math.max(4, (r.sec / maxS) * BW);
      art.push(`<rect x="${BX0}" y="${y + 10}" width="${f1(bw)}" height="36" ${r.hot ? fillAttr(hot) : 'fill="var(--c-base)"'}/>`);
      html.push(`<p class="tl-sc" style="left:${LX}px; top:${y}px; width:${BX0 - LX - 16}px"><b>${h(r.label)}</b><br><i data-qa-small>${h(r.meta)}</i></p>
        <span class="tl-scv" style="left:${f1(BX0 + bw + 14)}px; top:${y + 13}px">${h(hm(r.sec))}</span>`);
    });
    html.push(`<p class="h-abs tl-small" data-qa-small style="top:${sTop - 52}px">Median solo times on one clock:</p>`);
    const askY = sTop + scale.length * rowH + 40;
    return slide(x, 'data', {
      kicker: KICKER, src: `Box art: Ravensburger · ${s.src}`,
      body: STYLE + svg(art.join('')) + titleBlock('And then there’s HELL tier', 56)
        + `<p class="h-abs tl-small" data-qa-small style="top:252px; font-size:26px">Ravensburger’s Krypt puzzles: one colour, no picture. Median solo time; half of all solves are faster.</p>`
        + html.join('')
        + `<p class="tl-ask" style="top:${askY}px">Which puzzle belongs in <span style="color:var(--c-hot)">HELL</span>?</p>`,
    }).html;
  }

  return order.map(k => make[k]());
}

export function tierAlt(s: TierSpec): string[] {
  const subs = s.subjects;
  const tiers = tiersOf(subs);
  const slowest = subs[subs.length - 1], fastest = subs[0];
  const tierLine = (t: (typeof tiers)[number]) => `${t.key} tier (${t.band}): ${t.subs.map(x => `${x.name} ${Math.round(x.median)}`).join(', ')}`;
  const det = (keys: string[]) => tiers.filter(t => keys.includes(t.key)).flatMap(t => t.subs.map(x => `${x.name}, ${x.median.toFixed(1)} minutes, ${fmtInt(x.puzzles)} puzzles and ${fmtInt(x.results)} results; box shown: ${x.box.puzzle} by ${x.box.brand}`)).join('. ');
  return [
    `Cover: Where would you put ${lc(slowest.name)}? A tier list board made of jigsaw pieces cut from puzzle box art, rows S, A, B and C, with the ${lc(slowest.name)} piece lifted off the board. ${subs.length} subjects ranked by median solo time on 500-piece puzzles, plus one tier from hell.`,
    `Median solo times: ${lc(slowest.name)} ${Math.round(slowest.median)} minutes, ${fastest.name} ${Math.round(fastest.median)}. The full board, median solo minutes on 500-piece puzzles: ${tiers.map(tierLine).join('. ')}.`,
    `S and A in detail, each subject with its most-solved box and a bar from 0 to 100 minutes: ${det(['S', 'A'])}.`,
    `B and C in detail: ${det(['B', 'C'])}.`,
    `HELL tier: Ravensburger's Krypt puzzles, one colour and no picture, as pieces in a coral row. Median solo times: ${s.hell.map(k => `Krypt ${k.short}, ${k.pieces} pieces, ${hm(k.medianS)}`).join('; ')}. A bar scale compares them with ${fastest.name} (${Math.round(fastest.median)} min) and ${lc(slowest.name)} (${Math.round(slowest.median)} min)${s.mercy ? ` and ${s.mercy.puzzle}, which has colours (${hm(s.mercy.medianS)})` : ''}. Which puzzle belongs in HELL? Comment below.`,
  ];
}

export function tierCaption(s: TierSpec): string {
  const subs = s.subjects;
  const tiers = tiersOf(subs);
  const slowest = subs[subs.length - 1], fastest = subs[0];
  const worst = s.hell[0];
  const sameTier = tiers.find(t => ['cats', 'dogs'].every(th => t.subs.some(x => x.theme === th)));
  return [
    `Median solo time on a 500: ${lc(slowest.name)} ${Math.round(slowest.median)} minutes, ${fastest.name} ${Math.round(fastest.median)}. We ranked ${subs.length} jigsaw puzzle subjects by it 🧩 Median means half of all solo times are faster, so the fastest puzzlers are far quicker.`,
    '',
    `S tier, under an hour: ${andList(tiers[0].subs.map(x => lc(x.name)))}. C tier, 70 minutes and up: ${andList(tiers[3].subs.map(x => lc(x.name)))}.${sameTier ? ` Cats and dogs share ${sameTier.key} tier.` : ''}`,
    '',
    `And then there's HELL tier: @ravensburgerglobal's Krypt puzzles, one colour and no picture. Krypt ${worst.short} (${worst.pieces} pieces) takes a median ${hm(worst.medianS)} solo 😈`,
    '',
    'Subjects come from words in puzzle titles; slides 3 and 4 show the numbers behind each.',
    '',
    `Where would you move ${lc(slowest.name)}, and which puzzle belongs in HELL? Tell us in the comments.`,
    '',
    `Box art by ${brandList([...subs.map(x => x.box), ...s.hell.map(k => k.box)])}.`,
    '',
    '#speedpuzzling #jigsawpuzzle #puzzletime #ravensburger',
  ].join('\n');
}
