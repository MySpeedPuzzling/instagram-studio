// "The pile of shame" (Did you know / funny fact, owner 2026-11-12): how much of what puzzlers collect on MSP is
// still unsolved, the plot twist in hours of median solo time, and the punchline: the puzzle owners avoid the most is
// called "Speed Puzzling". All collections count, private ones included (owner 2026-11-12: fine for aggregates that
// name nobody); private profiles excluded. A "pile" = one puzzler's unsolved collected puzzles; every number comes from `shelf-shame-totals` and `shelf-shame-puzzles`.
//   1 cover   coral poster "The pile of shame is real"; A: the dusty AI1 shelf with the most-avoided boxes and one
//             empty slot, B: the same boxes as a heap (no photo);
//   2 waffle  100 pieces, the unsolved share in coral; collected, collections, pieces still in the box;
//   3 twist   the typical pile in hours (1 piece = 1 hour) + the median disclaimer;
//   4 scale   typical, top 10 %, the biggest pile (in days non-stop), all piles together;
//   5 reveal  "the puzzle you avoid the most is called… Speed Puzzling" (A on the shelf, B as a big box);
//   6 rest    the next most-avoided puzzles with their unsolved share, and the question for the comments.
import { join } from 'node:path';
import { fetchBoxes } from '../data/boxes.ts';
import { query, type QueryResult } from '../data/db.ts';
import {
  CW, FEED, FEED_H, GROUNDS, W, X0, X1, f1, frame, groundVars, posterTopPath, seamReach, slide, slotOf,
  type SlideCtx, type Variant,
} from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';
import { singlePiece } from '../design/svg.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { ROOT } from '../render/server.ts';

export const POST = 'fun-shelf'; // funny fact: coral poster (standing feedback, poster colour by type)
const KICKER = 'Did you know? · Collections';
const SHADOW = 'rgba(16,22,34,.36)';
/** The dusty wooden cube shelf (lab SH1, s4-natural-221, owner 2026-11-12: natural cobwebs): fine dust, wispy webs, spiders. */
export const SHELF_PLATE = 'content/labs/SH1/stills/s4-natural-221.png';
const PLATE_GEN = { w: 896, h: 1120 };
/** Cubbies of the SH1 shelf plate (896 × 1120 px), rows 2 and 3; natural thin cobwebs stay visible above the boxes. */
const SLOTS = [
  { x: 345, y: 340, w: 200, h: 222 }, // row 2 middle, under the dangling spider: the "?" slot
  { x: 110, y: 340, w: 220, h: 222 }, { x: 572, y: 340, w: 208, h: 222 },
  { x: 110, y: 582, w: 220, h: 218 }, { x: 345, y: 582, w: 200, h: 218 }, { x: 572, y: 582, w: 208, h: 218 },
];
/** The old, forgotten museum wall (lab SH1, m1-museum-211): gilt frame with an empty grey canvas, cobwebs, a spider.
 *  `canvas` = the flat grey area inside the frame in plate pixels (measured from the image). */
export const MUSEUM = { plate: 'content/labs/SH1/stills/m1-museum-212.png', w: 896, h: 1120, canvas: { x0: 248, x1: 652, y0: 318, y1: 675 }, frameBottom: 735 };


export type Direction = 'A' | 'B';
export interface ShelfPuzzle { puzzle: string; brand: string; pieces: number; owners: number; unsolved: number; pct: number; medianS: number; img: string; ar: number }
export interface ShelfSpec {
  collected: number; unsolved: number; pct: number; collections: number; piles: number; medianPile: number; unsolvedPieces: number;
  big: { unsolved: number; hours: number; days: number };
  ladder: { q1: number; median: number; q3: number; p90: number }; hoursAll: number; yearsAll: number;
  puzzles: ShelfPuzzle[]; hero: ShelfPuzzle; share: ShelfPuzzle; sizes: Array<{ label: string; owners: number; pct: number }>; giant: ShelfPuzzle; asOf: string; src: string;
}

export async function buildShelfSpec(o: { fresh: boolean }): Promise<{ spec: ShelfSpec; facts: Record<string, QueryResult> }> {
  const facts = { 'shelf-shame-totals': query('shelf-shame-totals', { fresh: o.fresh }), 'shelf-shame-puzzles': query('shelf-shame-puzzles', { fresh: o.fresh }), 'shelf-shame-pct': query('shelf-shame-pct', { fresh: o.fresh }), 'shelf-shame-sizes': query('shelf-shame-sizes', { fresh: o.fresh }) };
  const t = facts['shelf-shame-totals'].rows[0];
  const rows = facts['shelf-shame-puzzles'].rows, pctRows = facts['shelf-shame-pct'].rows;
  const sizeRows = facts['shelf-shame-sizes'].rows, bigRows = sizeRows.filter(r => r.kind === 'big');
  const imgs = await fetchBoxes([...rows, ...pctRows, ...bigRows].map(r => r.image), 'puzzle_large');
  const toP = (r: Record<string, string>): ShelfPuzzle[] => {
    const img = imgs.get(r.image);
    return img ? [{ puzzle: r.puzzle, brand: r.brand, pieces: +r.pieces, owners: +r.owners, unsolved: +r.unsolved, pct: +r.pct_unsolved, medianS: +r.median_solo_s, img, ar: +r.image_ratio || 1.4 }] : [];
  };
  const puzzles = rows.flatMap(toP);
  const hero = puzzles[0];
  // Exhibit by share: the highest unsolved share among puzzles in 40+ collections (owner 2026-11-12: a second exhibit
  // when it's a different puzzle than the most-avoided by number).
  const share = pctRows.flatMap(toP)[0];
  // Plot twist 3 (owner 2026-11-12): the bigger the box, the less it gets solved. Bands merged from the query's 7.
  const band = (ks: string[], label: string) => {
    const rs = sizeRows.filter(r => r.kind === 'band' && ks.includes(r.k));
    const owners = rs.reduce((a, r) => a + +r.owners, 0), uns = rs.reduce((a, r) => a + +r.unsolved, 0);
    return { label, owners, pct: Math.round((100 * uns) / owners) };
  };
  const sizes = [band(['1', '2'], 'Up to 500 pieces'), band(['3', '4'], '501 to 1000'), band(['5', '6'], '1001 to 3999'), band(['7'], '4000 and more')];
  // The giant: the biggest puzzle among the most-collected 4000+ ones that at least 10 people own.
  const giant = bigRows.filter(r => +r.owners >= 10).sort((a, b) => +b.pieces - +a.pieces).flatMap(r => toP({ ...r, median_solo_s: '0' }))[0];
  if (!giant) throw new Error('pile-of-shame: no 4000+ puzzle with 10+ owners');
  if (!share || share.puzzle === hero?.puzzle) throw new Error('pile-of-shame: the share exhibit is missing or the same puzzle as the count exhibit');
  if (!hero || hero.puzzle !== 'Speed Puzzling') throw new Error(`pile-of-shame: the most-avoided puzzle is now "${hero?.puzzle}", not "Speed Puzzling": rethink the punchline`);
  const bigHours = +t.big_hours;
  const asOf = new Date(facts['shelf-shame-totals'].queried_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });
  return {
    facts,
    spec: {
      collected: +t.collected, unsolved: +t.unsolved, pct: +t.pct_unsolved, collections: +t.collections, piles: +t.piles, medianPile: +t.median_pile,
      unsolvedPieces: +t.unsolved_pieces,
      big: { unsolved: +t.big_unsolved, hours: bigHours, days: Math.floor(bigHours / 24) },
      ladder: { q1: +t.hours_q1, median: +t.hours_median, q3: +t.hours_q3, p90: +t.hours_p90 },
      hoursAll: +t.hours_all, yearsAll: Math.floor(+t.hours_all / (24 * 365.25)), puzzles, hero, share, sizes, giant, asOf, src: `Data: myspeedpuzzling.com · ${asOf}`,
    },
  };
}

// ---------------------------------------------------------------- helpers
const pct = (n: number) => `${n}%`;
const hrs = (v: number) => (v < 10 ? v.toFixed(1) : fmtInt(Math.round(v)));
const millions = (n: number) => `${(n / 1e6).toFixed(1)} million`;
const rel = (p: string) => '/' + p;
let uid = 0;
const svg = (inner: string) => `<svg style="position:absolute; left:0; top:0" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true">${inner}</svg>`;
const fit = (ar: number, maxW: number, maxH: number) => (maxW / ar <= maxH ? { w: maxW, h: maxW / ar } : { w: maxH * ar, h: maxH });
const boxImg = (b: ShelfPuzzle, x: number, y: number, w: number, hh: number, rot = 0, extra = '') =>
  `<img src="${b.img}" alt="" style="position:absolute; left:${f1(x)}px; top:${f1(y)}px; width:${f1(w)}px; height:${f1(hh)}px; object-fit:cover; transform:rotate(${rot}deg); box-shadow:0 10px 22px rgba(10,14,22,.5); border-radius:3px${extra}">`;

/** The mystery box in the "?" slot: a coral box standing upright like the real ones, a big centred "?", the same price
 *  sticker with "??%" (the reveal is the Speed Puzzling exhibit). Left in the cubby so the plate's dangling spider shows. */
function mysteryBox(sl: { x: number; y: number; w: number; h: number }) {
  const bw = 112, bh = 150, x = sl.x + sl.w * 0.1, y = sl.y + sl.h - bh - 4;
  return `<div style="position:absolute; left:${f1(x)}px; top:${f1(y)}px; width:${bw}px; height:${bh}px; border-radius:3px; background:linear-gradient(100deg, #f08a86 0%, #ec726f 55%, #d9605d 100%); box-shadow:0 10px 22px rgba(10,14,22,.5), inset -6px 0 0 rgba(0,0,0,.08)">
      <div style="position:absolute; left:0; right:0; bottom:0; height:26px; background:#222a38; opacity:.9; border-radius:0 0 3px 3px"></div>
      <span data-qa-bg="#ec726f" style="position:absolute; left:50%; top:58%; transform:translate(-50%,-50%); font-size:84px; font-weight:800; line-height:1; color:#222a38">?</span></div>
    ${shelfTag(x + bw / 2, y - 34, '??')}`;
}

/** A shop-style shelf tag hanging from the board under a box: the unsolved share, big and fully inside the label. */
function shelfTag(cx: number, top: number, value: number | string) {
  return `<div data-qa-bg="#ec726f" style="position:absolute; left:${f1(cx)}px; top:${f1(top)}px; transform:translateX(-50%) rotate(-2deg); padding:4px 14px 6px; background:#ec726f; color:#222a38; border-radius:8px; box-shadow:0 6px 12px rgba(10,14,22,.45); text-align:center; white-space:nowrap">
    <p style="font-size:36px; font-weight:800; line-height:1">${value}%</p><p data-qa-small style="font-size:24px; font-weight:700; line-height:1.1">unsolved</p></div>`;
}

/** A coral generator piece with a label on it (unsolved share, "?"). */
function badge(cx: number, cy: number, px: number, label: string, fontPx: number, seed = 23) {
  const sp = singlePiece(60, seed);
  const [vx, vy, vw, vh] = sp.viewBox.split(' ').map(Number);
  const k = px / Math.max(vw, vh);
  const x = cx - (90 - vx) * k, y = cy - (90 - vy) * k; // the piece body's centre (60 px cell at 60..120) lands on cx, cy
  return `${svg(`<g transform="translate(${f1(x - vx * k + 4)} ${f1(y - vy * k + 6)}) scale(${f1(k)})"><path d="${sp.d}" fill="${SHADOW}"/></g>
    <g transform="translate(${f1(x - vx * k)} ${f1(y - vy * k)}) scale(${f1(k)})"><path d="${sp.d}" fill="var(--c-hot)"/></g>`)}
    <span data-qa-bg="#ec726f" style="position:absolute; left:${f1(cx)}px; top:${f1(cy)}px; transform:translate(-50%,-50%); font-size:${fontPx}px; font-weight:800; line-height:1; color:#222a38; white-space:nowrap">${h(label)}</span>`;
}

/** The poster top piece (coral) with title + dek, and whatever goes under it (the shelf photo). */
function posterCover(x: SlideCtx, o: { title: string; dek: string; seam: number; underArt?: string; body: string; src: string }) {
  const v = x.v;
  const topG = GROUNDS[v.ground(slotOf(x, 'cover'))], base = GROUNDS[v.posterBase ?? 'navyDeep'];
  const head = `<div style="${groundVars(topG)}" data-qa-bg="${topG.bg}">
      <h1 class="h-title" style="top:${FEED.contentTop}px; width:${CW}px; font-size:72px; line-height:1.04">${h(o.title)}</h1>
      <p class="h-dek h-abs" style="top:${FEED.contentTop + 96}px; width:${CW - 20}px; font-size:31px">${o.dek}</p></div>`;
  const under = `${o.underArt ?? ''}<svg class="h-poster-top" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true"><path d="${posterTopPath(o.seam)}" fill="${topG.bg}"/></svg>${head}`;
  return frame({ ground: base.key, kicker: KICKER, idx: [x.slide, x.of], device: v.device, body: o.body, src: o.src, under, noRule: true, headGround: topG.key });
}

/** The shelf photo, cropped from generation y `cropY`, scaled by k, top-left at (left, top); edges fade into navy. */
function shelfPhoto(left: number, top: number, k: number, cropY: number, height: number) {
  const w = PLATE_GEN.w * k;
  return `<div style="position:absolute; left:${f1(left)}px; top:${f1(top)}px; width:${f1(w)}px; height:${f1(height)}px; overflow:hidden;
      -webkit-mask-image: linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%); mask-image: linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)">
    <div style="position:absolute; inset:0; -webkit-mask-image: linear-gradient(to bottom, #000 82%, transparent 100%); mask-image: linear-gradient(to bottom, #000 82%, transparent 100%)">
      <img src="${rel(SHELF_PLATE)}" alt="" style="position:absolute; left:0; top:${f1(-cropY * k)}px; width:${f1(w)}px; height:${f1(PLATE_GEN.h * k)}px"></div></div>`;
}
/** Box standing in a compartment: contained, bottom-aligned on the board. */
function inSlot(b: ShelfPuzzle, s: { x: number; y: number; w: number; h: number }) {
  const z = fit(b.ar, s.w - 20, s.h - 40);
  return { x: s.x + (s.w - z.w) / 2, y: s.y + s.h - z.h - 2, w: z.w, h: z.h };
}

// ---------------------------------------------------------------- slides
export function shelfSlides(v: Variant, s: ShelfSpec, dir: Direction): string[] {
  const order = ['cover', 'waffle', 'twist', 'scale', 'sizes', 'share', 'reveal', 'rest'] as const;
  const ctx = (k: typeof order[number]): SlideCtx => ({ v, post: POST, slide: order.indexOf(k) + 1, of: order.length });
  const others = s.puzzles.slice(1).filter(p => p.puzzle !== s.share.puzzle).sort((a, b) => b.pct - a.pct);
  const coverDek = `<b>${pct(Math.round(s.pct))}</b> of the puzzles in your collections have never been solved. The one you avoid most has a very ironic name…`;
  const boxCredit = `Box art: ${[...new Set(s.puzzles.map(p => p.brand))].join(', ')}`;

  const cover = () => {
    const seam = 452;
    if (dir === 'A') {
      // Photo: generation y 300 sits at the seam; the compartments follow at scale k.
      const k = 0.97, cropY = 250, left = (W - PLATE_GEN.w * k) / 2, photoTop = seam - 40;
      const place = (sl: typeof SLOTS[number]) => ({ x: left + sl.x * k, y: photoTop + (sl.y - cropY) * k, w: sl.w * k, h: sl.h * k });
      const slots = SLOTS.map(place);
      // Slot 1 stays empty (the punchline is on slide 5), the next five most-avoided boxes fill the rest.
      const boxes = slots.slice(1).map((sl, i) => {
        const b = others[i], z = inSlot(b, sl);
        return boxImg(b, z.x, z.y, z.w, z.h) + shelfTag(z.x + z.w / 2, z.y - 34, b.pct);
      }).join('');
      const empty = slots[0];
      return posterCover(ctx('cover'), {
        title: 'The pile of shame is real', dek: coverDek, seam,
        underArt: shelfPhoto(left, photoTop, k, cropY, FEED.footRule - photoTop - 6),
        body: boxes + mysteryBox(empty),
        src: `${boxCredit} · data ${s.asOf}`,
      });
    }
    // B: the same boxes as a heap on navy, a coral "?" piece on top.
    const bw = 300, row = (n: number, y: number, rot: number[]) => Array.from({ length: n }, (_, i) => ({ x: W / 2 - (n * bw * 0.86) / 2 + i * bw * 0.86, y, rot: rot[i] }));
    const spots = [...row(3, 930, [-4, 2, 5]), ...row(2, 760, [3, -5]), ...row(1, 600, [-2])];
    const heap = spots.map((p, i) => {
      const b = others[i % others.length], z = fit(b.ar, bw, 230);
      return boxImg(b, p.x, p.y, z.w, z.h, p.rot);
    }).join('');
    const top = spots[spots.length - 1];
    return posterCover(ctx('cover'), {
      title: 'The pile of shame is real', dek: coverDek, seam,
      body: heap + badge(top.x + bw / 2, top.y - 6, 120, '?', 64, 41),
      src: `${boxCredit} · the most-avoided puzzles in MSP collections`,
    });
  };

  const waffle = () => {
    const x = ctx('waffle');
    const n = 10, size = 560, top = 360;
    const jig = generateJigsaw({ cols: n, rows: n, width: size, height: size, x: X0, y: top, seed: 77, tabSize: 0.24 });
    const hot = Math.round(s.pct);
    // Unsolved pieces pile up from the bottom rows (reading order from the end).
    const sorted = [...jig.pieces].sort((a, b) => (b.row - a.row) || (a.col - b.col));
    const art = sorted.map((p, i) => `<path d="${p.d}" fill="${i < hot ? 'var(--c-hot)' : 'var(--c-base)'}" stroke="var(--g-bg)" stroke-width="3" stroke-linejoin="round"/>`).join('');
    const RX = X0 + size + 44, RW = X1 - RX;
    return slide(x, 'data', {
      kicker: KICKER, src: s.src,
      title: `${fmtInt(s.unsolved)} puzzles waiting for “one day”`,
      body: svg(art) + `
        <p class="h-abs" style="left:${RX}px; top:${top - 6}px; width:${RW}px; font-size:130px; font-weight:800; line-height:1; color:var(--c-hot)">${Math.round(s.pct)}<span style="font-size:64px">%</span></p>
        <p class="h-abs" style="left:${RX}px; top:${top + 140}px; width:${RW}px; font-size:32px; line-height:1.25; color:var(--g-ink)">of collected puzzles were never logged as solved. “This weekend, for sure.”</p>
        <p class="h-abs" data-qa-small style="left:${RX}px; top:${top + 330}px; width:${RW}px; font-size:24px; line-height:1.3; color:var(--g-soft)">1 piece = 1% of ${fmtInt(s.collected)} puzzles in ${fmtInt(s.collections)} collections</p>
        <div class="h-abs" style="top:${top + size + 70}px; width:${CW}px; display:flex; gap:40px">
          <div style="flex:1"><p style="font-size:56px; font-weight:800; line-height:1; color:var(--g-ink)">${millions(s.unsolvedPieces)}</p><p style="font-size:30px; line-height:1.25; color:var(--g-soft); margin-top:10px">pieces still waiting for their moment</p></div>
          <div style="flex:1"><p style="font-size:56px; font-weight:800; line-height:1; color:var(--g-ink)">${fmtInt(s.piles)}</p><p style="font-size:30px; line-height:1.25; color:var(--g-soft); margin-top:10px">collectors with a pile (we see you)</p></div>
        </div>`,
    }).html;
  };

  const disclaimer = (top: number) => `<p class="h-abs" data-qa-small style="top:${top}px; width:${CW}px; font-size:24px; line-height:1.35; color:var(--g-soft)">
    Hours = each puzzle's median solo time from its MySpeedPuzzling page (half of puzzlers are faster), added up per pile; puzzles nobody has timed yet get the typical time for their piece count. Your pace may vary.</p>`;

  /** The pile ladder (owner 2026-11-12): quartiles of pile hours, each with a joke that matches its size. */
  const twist = () => {
    const x = ctx('twist'), L = s.ladder;
    const rows = [
      { who: '1 in 4 piles', q: 'up to', h: L.q1, joke: 'A lazy Sunday afternoon.' },
      { who: 'Half of all piles', q: 'up to', h: L.median, joke: 'One rainy weekend. No excuses.' },
      { who: '1 in 4 piles', q: 'over', h: L.q3, joke: 'A full week off, 7 hours a day.' },
      { who: '1 in 10 piles', q: 'over', h: L.p90, joke: '5 hours every evening, for a month.' },
    ];
    const top = 430, rh = 156, BW = CW - 4, max = L.p90;
    const art = rows.map((r, i) => `<rect x="${X0}" y="${top + i * rh + 96}" width="${BW}" height="26" fill="var(--g-band)"/>
      <rect x="${X0}" y="${top + i * rh + 96}" width="${f1(Math.max(8, (r.h / max) * BW))}" height="26" fill="var(--c-hot)"/>`).join('');
    const html = rows.map((r, i) => `
      <p class="h-abs" style="top:${top + i * rh}px; width:${CW}px; font-size:36px; font-weight:700; line-height:1.1; color:var(--g-ink)">${h(r.who)}: ${r.q} <span style="color:var(--c-hot)">${hrs(r.h)} hours</span></p>
      <p class="h-abs" style="top:${top + i * rh + 48}px; width:${CW}px; font-size:30px; line-height:1.2; color:var(--g-soft)">${h(r.joke)}</p>`).join('');
    return slide(x, 'data', {
      kicker: 'Plot twist', src: s.src,
      title: 'How long would your pile take?',
      body: svg(art) + html + `
        <p class="h-abs" style="top:336px; width:${CW}px; font-size:32px; line-height:1.3; color:var(--g-ink)">We did the math nobody asked for, for all ${fmtInt(s.piles)} piles:</p>
        ${disclaimer(1066)}`,
    }).html;
  };

  /** The biggest pile: 1 piece = 1 day, then the open question. */
  const scale = () => {
    const x = ctx('scale');
    const cols = 16, n = s.big.days, rws = Math.ceil(n / cols), pw = CW / cols, top = 440;
    const jig = generateJigsaw({ cols, rows: rws, width: CW, height: rws * pw, x: X0, y: top, seed: 99, tabSize: 0.24 });
    const art = jig.pieces.filter(p => p.row * cols + p.col < n)
      .map(p => `<path d="${p.d}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="3" stroke-linejoin="round"/>`).join('');
    const yT = top + rws * pw + 30;
    return slide(x, 'data', {
      kicker: 'Plot twist', src: s.src,
      title: 'And then there’s… this pile',
      body: svg(art) + `
        <p class="h-abs" style="top:300px; width:${CW}px; font-size:52px; font-weight:800; line-height:1.1; color:var(--g-ink)">${fmtInt(s.big.unsolved)} puzzles. <span style="color:var(--c-hot)">${fmtInt(s.big.hours)} hours.</span></p>
        <p class="h-abs" style="top:${yT}px; width:${CW}px; font-size:40px; font-weight:700; line-height:1.2; color:var(--g-ink)">That’s ${n} days and nights without a break. Snacks not included.</p>
        <p class="h-abs" data-qa-small style="top:${top - 46}px; font-size:24px; color:var(--g-soft)">1 piece = 1 day</p>
        <p class="h-abs" style="top:${yT + 120}px; width:${CW}px; font-size:30px; line-height:1.3; color:var(--g-soft)">All ${fmtInt(s.piles)} piles together: ${fmtInt(s.hoursAll)} hours, over ${s.yearsAll} years non-stop.</p>
        <p class="h-abs" style="top:${yT + 196}px; width:${CW}px; font-size:52px; font-weight:800; line-height:1.1; color:var(--c-hot)">Who is this puzzle collector?</p>
        <p class="h-abs" style="top:${yT + 262}px; width:${CW}px; font-size:32px; line-height:1.3; color:var(--g-ink)">Is it you? Blink twice. Or confess in the comments.</p>`,
    }).html;
  };

  /** Plot twist 3: the bigger the box, the braver you need to be (owner 2026-11-12). */
  const sizesSlide = () => {
    const x = ctx('sizes'), top = 390, rh = 88, LW = 330, BX = X0 + LW, BW = X1 - BX - 120;
    const art = s.sizes.map((b, i) => `<rect x="${BX}" y="${top + i * rh + 8}" width="${BW}" height="40" fill="var(--g-band)"/>
      <rect x="${BX}" y="${top + i * rh + 8}" width="${f1((b.pct / 100) * BW)}" height="40" fill="${i === s.sizes.length - 1 ? 'var(--c-hot)' : 'var(--c-base)'}"/>`).join('');
    const html = s.sizes.map((b, i) => `<p class="h-abs" style="top:${top + i * rh + 10}px; width:${LW - 20}px; font-size:30px; font-weight:700; line-height:1.15; color:var(--g-ink); white-space:nowrap">${h(b.label)}</p>
      <p class="h-abs" style="left:${f1(BX + (b.pct / 100) * BW + 14)}px; top:${top + i * rh + 10}px; font-size:34px; font-weight:800; line-height:1.1; color:${i === s.sizes.length - 1 ? 'var(--c-hot)' : 'var(--g-ink)'}">${pct(b.pct)}</p>`).join('');
    const g = s.giant, gy = top + s.sizes.length * rh + 30;
    const z = fit(g.ar, 420, 230);
    const tx = X0 + z.w + 36;
    return slide(x, 'data', {
      kicker: 'Plot twist', src: `Box art: ${g.brand} · data ${s.asOf}`,
      title: 'The bigger the box, the braver you need to be',
      body: svg(art) + html + `<p class="h-abs" data-qa-small style="top:${top - 46}px; font-size:24px; color:var(--g-soft)">Share of collected puzzles never solved by their owner, by size</p>`
        + boxImg(g, X0, gy, z.w, z.h, -2)
        + `<div class="h-abs" style="left:${f1(tx)}px; top:${gy}px; width:${f1(X1 - tx)}px">
            <p style="font-size:34px; font-weight:800; line-height:1.15; color:var(--g-ink)">${h(g.puzzle)}</p>
            <p style="font-size:30px; line-height:1.3; color:var(--g-soft); margin-top:6px">${h(g.brand)}, ${fmtInt(g.pieces)} pieces</p>
            <p style="font-size:30px; line-height:1.3; color:var(--g-ink); margin-top:10px"><b style="color:var(--c-hot)">${g.unsolved} of its ${g.owners}</b> owners haven't solved it.</p></div>
          <p class="h-abs" style="top:${f1(gy + Math.max(z.h, 210) + 34)}px; width:${CW}px; font-size:40px; font-weight:700; line-height:1.2; color:var(--g-ink)">We get it. It’s not for solving, it’s for owning. <span style="color:var(--c-hot)">Maybe one day you’ll find the courage.</span></p>`,
    }).html;
  };

  /** A museum exhibit (owner 2026-11-12): the real box framed on the gallery wall, a plaque that carries the joke. */
  const exhibit = (key: 'share' | 'reveal', b: ShelfPuzzle, o: { lead: string; no: number; plaque: string[]; line: string }) => {
    const x = ctx(key);
    const nameSize = b.puzzle.length > 16 ? 76 : 92;
    const head = `<p class="h-abs" style="top:${FEED.contentTop + 4}px; width:${CW}px; font-size:44px; font-weight:700; line-height:1.15; color:var(--g-ink)">${h(o.lead)}</p>
      <p class="h-abs" style="top:${FEED.contentTop + 70}px; width:${CW}px; font-size:${nameSize}px; font-weight:800; line-height:1.05; color:var(--c-hot); white-space:nowrap">${h(b.puzzle)}</p>`;
    // The old room across the content width (owner 2026-11-12: bigger art, the label on the wall in the room).
    const M = MUSEUM, k = 1, cropY = 225, panelTop = 352, panelH = 760, left = (W - M.w * k) / 2;
    const panel = `<div style="position:absolute; left:${f1(left)}px; top:${panelTop}px; width:${f1(M.w * k)}px; height:${panelH}px; overflow:hidden; border-radius:8px">
      <img src="${rel(M.plate)}" alt="" style="position:absolute; left:0; top:${f1(-cropY * k)}px; width:${f1(M.w * k)}px; height:${f1(M.h * k)}px"></div>`;
    const cv = { x: left + M.canvas.x0 * k, y: panelTop + (M.canvas.y0 - cropY) * k, w: (M.canvas.x1 - M.canvas.x0) * k, h: (M.canvas.y1 - M.canvas.y0) * k };
    const z = fit(b.ar, cv.w - 14, cv.h - 14);
    const web = (x0: number, y0: number, r: number) => {
      const rays = [0, 22, 45, 68, 90].map(a => `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x0 + r * Math.cos(a * Math.PI / 180))}" y2="${f1(y0 + r * Math.sin(a * Math.PI / 180))}"/>`).join('');
      const arcs = [0.3, 0.55, 0.8].map(t => `<path d="M ${f1(x0 + r * t)} ${f1(y0)} Q ${f1(x0 + r * t * 0.62)} ${f1(y0 + r * t * 0.62)} ${f1(x0)} ${f1(y0 + r * t)}" fill="none"/>`).join('');
      return `<g stroke="rgba(255,255,255,.55)" stroke-width="1.2">${rays}${arcs}</g>`;
    };
    // A small spider on its thread over the art (the plate's own spider sits inside the canvas).
    const sx = cv.w * 0.8, sy = 96;
    const spider = `<line x1="${f1(sx)}" y1="0" x2="${f1(sx)}" y2="${sy - 6}" stroke="rgba(255,255,255,.75)" stroke-width="1"/>
      <g transform="translate(${f1(sx)} ${sy})" stroke="#111" stroke-width="2" fill="none">${[-1, 1].flatMap(d => [[-6, -7], [-9, -1], [-9, 5], [-6, 10]].map(([a, c]) => `<path d="M 0 2 Q ${d * 7} ${a + 2} ${d * 12} ${c}"/>`)).join('')}</g>
      <ellipse cx="${f1(sx)}" cy="${sy + 3}" rx="5" ry="7" fill="#111"/><circle cx="${f1(sx)}" cy="${sy - 5}" r="3.5" fill="#111"/>`;
    const framed = `<div style="position:absolute; left:${f1(cv.x)}px; top:${f1(cv.y)}px; width:${f1(cv.w)}px; height:${f1(cv.h)}px; background:#ddd3bb; box-shadow:inset 0 0 18px rgba(60,50,30,.45)">
        <img src="${b.img}" alt="" style="position:absolute; left:${f1((cv.w - z.w) / 2)}px; top:${f1((cv.h - z.h) / 2)}px; width:${f1(z.w)}px; height:${f1(z.h)}px; object-fit:cover; filter:sepia(.3) saturate(.85) brightness(.95)">
        <div style="position:absolute; inset:0; background:linear-gradient(160deg, rgba(190,185,170,.32), rgba(150,145,130,.12) 45%, rgba(190,185,170,.28))"></div>
        <svg style="position:absolute; left:0; top:0" width="${f1(cv.w)}" height="${f1(cv.h)}">${web(0, 0, 80)}${spider}</svg></div>`;
    // The museum label on the wallpaper under the frame: an aged card in a thin brass edge, lit like the wall.
    const ly = panelTop + (M.frameBottom + 22 - cropY) * k;
    const plaque = `<div data-qa-bg="#ece2c8" style="position:absolute; left:${f1(cv.x - 60)}px; top:${f1(ly)}px; width:${f1(cv.w + 120)}px; padding:12px 16px; background:linear-gradient(170deg, #f1e8cf, #e2d6b6); color:#2a2418; border:3px solid #a8874a; border-radius:3px; box-shadow:0 8px 14px rgba(0,0,0,.45), inset 0 0 10px rgba(120,95,50,.25); font-size:24px; line-height:1.28">
        <p data-qa-small style="font-weight:800">No. ${o.no} · ${h(b.puzzle)}</p>
        <p data-qa-small>${h(b.brand)}, ${fmtInt(b.pieces)} pieces</p>
        ${o.plaque.map((l, i) => `<p data-qa-small style="margin-top:6px${i === o.plaque.length - 1 ? '; font-style:italic' : ''}">${h(l)}</p>`).join('')}</div>`;
    const stats = `<p class="h-abs" style="top:${panelTop + panelH + 14}px; width:${CW}px; font-size:30px; line-height:1.2; color:var(--g-ink); white-space:nowrap"><b style="color:var(--c-hot)">${pct(b.pct)}</b> of its owners haven't solved it. ${h(o.line)}</p>`;
    return slide(x, 'data', { kicker: `The exhibit · No. ${o.no}`, src: `Box art: ${b.brand} · data ${s.asOf}`, body: head + panel + framed + plaque + stats }).html;
  };
  const shareExhibit = () => exhibit('share', s.share, {
    no: 1, lead: 'Most avoided by share of owners:',
    plaque: [`Unsolved by ${s.share.unsolved} of its ${s.share.owners} owners.`, `Solved by ${s.share.owners - s.share.unsolved} brave souls (median ${fmtDuration(s.share.medianS / 60)}).`, 'Handle with courage.'],
    line: /most everyone/i.test(s.share.puzzle) ? 'Most everyone, indeed.' : 'Collected with love.',
  });
  const reveal = () => exhibit('reveal', s.hero, {
    no: 2, lead: 'And by number of owners, it’s called…',
    plaque: [`Unsolved by ${s.hero.unsolved} of its ${s.hero.owners} owners.`, 'Please do not touch. Nobody does.'],
    line: 'The name is not a promise.',
  });

  const rest = () => {
    const x = ctx('rest');
    const list = others.slice(0, 6);
    const top = 330, rh = 112, BXw = 120, NX = X0 + BXw + 24, barX = 700, barW = X1 - 110 - barX;
    const art = list.map((p, i) => `<rect x="${barX}" y="${top + i * rh + 38}" width="${barW}" height="30" fill="var(--g-band)"/>
      <rect x="${barX}" y="${top + i * rh + 38}" width="${f1(barW * p.pct / 100)}" height="30" fill="var(--c-base)"/>`).join('');
    const html = list.map((p, i) => {
      const z = fit(p.ar, BXw, rh - 24);
      return boxImg(p, X0 + (BXw - z.w) / 2, top + i * rh + (rh - 12 - z.h) / 2, z.w, z.h) + `
        <div class="h-abs" style="left:${NX}px; top:${top + i * rh + 18}px; width:${barX - NX - 20}px">
          <p style="font-size:30px; font-weight:700; line-height:1.1; color:var(--g-ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${h(p.puzzle)}</p>
          <p data-qa-small style="font-size:24px; line-height:1.25; color:var(--g-soft); margin-top:4px; white-space:nowrap">${fmtInt(p.pieces)} pieces · ${p.unsolved} of ${p.owners} owners</p></div>
        <p class="h-abs" style="left:${f1(barX + barW + 14)}px; top:${top + i * rh + 34}px; font-size:32px; font-weight:800; line-height:1; color:var(--g-ink); white-space:nowrap">${pct(p.pct)}</p>`;
    }).join('');
    return slide(x, 'data', {
      kicker: KICKER, src: `${boxCredit} · data ${s.asOf}`,
      title: 'Also gathering dust',
      body: svg(art) + `<p class="h-abs" data-qa-small style="top:256px; font-size:26px; color:var(--g-soft)">Owners who haven't solved the puzzle in their collection. Yet, of course.</p>` + html + `
        <p class="h-abs" style="top:${top + list.length * rh + 40}px; width:${CW}px; font-size:44px; font-weight:700; line-height:1.15; color:var(--g-ink)">What’s been waiting on <span style="color:var(--c-hot)">your</span> shelf the longest? We won’t judge. Much.</p>`,
    }).html;
  };

  return [cover(), waffle(), twist(), scale(), sizesSlide(), shareExhibit(), reveal(), rest()];
}

export function shelfAlt(s: ShelfSpec, dir: Direction): string[] {
  const others = s.puzzles.slice(1).filter(p => p.puzzle !== s.share.puzzle).sort((a, b) => b.pct - a.pct);
  return [
    `Cover: The pile of shame is real. ${pct(Math.round(s.pct))} of the puzzles in your collections have never been solved, and the one you avoid most has a very ironic name. ${dir === 'A' ? 'A dusty, cobwebbed wooden shelf holds five puzzle boxes, each with a coral shelf tag showing the share of owners who haven\'t solved it; the sixth holds a coral mystery box with a big question mark and a ??% unsolved sticker.' : 'A heap of puzzle boxes with a coral question-mark piece on top.'} Boxes: ${others.slice(0, 5).map(p => `${p.puzzle} ${pct(p.pct)}`).join(', ')}.`,
    `${fmtInt(s.unsolved)} puzzles, still waiting: a 10 by 10 grid of puzzle pieces with ${Math.round(s.pct)} in coral. ${pct(s.pct)} of ${fmtInt(s.collected)} puzzles in ${fmtInt(s.collections)} MySpeedPuzzling collections were never logged as solved by their owner. ${millions(s.unsolvedPieces)} pieces are still in their boxes; ${fmtInt(s.piles)} collectors have a pile of unsolved puzzles.`,
    `Plot twist: how long would your pile take? The math nobody asked for, for all ${fmtInt(s.piles)} piles, with bars: 1 in 4 piles up to ${hrs(s.ladder.q1)} hours, a lazy Sunday afternoon. Half of all piles up to ${hrs(s.ladder.median)} hours, one rainy weekend. 1 in 4 piles over ${hrs(s.ladder.q3)} hours, a full week off. 1 in 10 piles over ${hrs(s.ladder.p90)} hours, 5 hours every evening for a month. Hours are each puzzle's median solo time from its page, added up per pile; untimed puzzles get the typical time for their piece count; your pace may vary.`,
    `And then there's this pile: ${fmtInt(s.big.unsolved)} puzzles, ${fmtInt(s.big.hours)} hours, shown as ${s.big.days} coral puzzle pieces, one per day: ${s.big.days} days and nights without a break. All ${fmtInt(s.piles)} piles together: ${fmtInt(s.hoursAll)} hours, over ${s.yearsAll} years non-stop. Who is this puzzle collector? Is it you?`,
    `The bigger the box, the braver you need to be. Share of collected puzzles never solved by their owner: ${s.sizes.map(b => `${b.label.toLowerCase()} ${pct(b.pct)}`).join(', ')}. ${s.giant.puzzle}, ${s.giant.brand}, ${s.giant.pieces} pieces: ${s.giant.unsolved} of its ${s.giant.owners} owners haven't solved it. We get it: it's not for solving, it's for owning. Maybe one day you'll find the courage.`,
    `Museum exhibit number 1, most avoided by share of owners: ${s.share.puzzle}, ${s.share.brand}, ${s.share.pieces} pieces, framed on a gallery wall with a plaque. ${s.share.unsolved} of its ${s.share.owners} owners haven't solved it (${pct(s.share.pct)}); solved by ${s.share.owners - s.share.unsolved} brave souls. Those who dared: median ${fmtDuration(s.share.medianS / 60)} solo.`,
    `Museum exhibit number 2, and by number of owners it's called… ${s.hero.puzzle}. The ${s.hero.brand} ${s.hero.pieces}-piece box framed on a gallery wall, plaque: unsolved by ${s.hero.unsolved} of its ${s.hero.owners} owners (${pct(s.hero.pct)}). Please do not touch. Nobody does. Those who dared: median ${fmtDuration(s.hero.medianS / 60)} solo.`,
    `Also high on the pile, share of owners who haven't solved it: ${others.slice(0, 6).map(p => `${p.puzzle} (${p.pieces} pieces) ${p.unsolved} of ${p.owners}, ${pct(p.pct)}`).join('; ')}. What's been waiting on your shelf the longest?`,
  ];
}

export function shelfCaption(s: ShelfSpec): string {
  const giants = s.sizes[s.sizes.length - 1];
  return [
    `${pct(Math.round(s.pct))} of the jigsaw puzzles in your collections have never been solved. The pile of shame is real 📦`,
    '',
    `We did the math nobody asked for: half of all piles would take up to ${hrs(s.ladder.median)} hours (one rainy weekend, no excuses). The biggest one: ${fmtInt(s.big.unsolved)} puzzles, ${fmtInt(s.big.hours)} hours. Who is this puzzle collector? 👀`,
    '',
    `The bigger the box, the braver you need to be: ${pct(giants.pct)} of the ${giants.label.replace(' and more', '+')} piece giants are still unsolved.`,
    '',
    `And the most avoided puzzle in your collections? It's called Speed Puzzling. ${s.hero.unsolved} of its ${s.hero.owners} owners haven't solved it yet. @ravensburgerglobal, we need to talk.`,
    '',
    `Hours = each puzzle's median solo time, so your pace may vary. Solved one but never logged it? Go log it ⏱️`,
    '',
    `What's been waiting on your shelf the longest? We won't judge. Much.`,
    '',
    '#speedpuzzling #jigsawpuzzle #puzzlecollection #ravensburger',
  ].join('\n');
}

export const shelfPlatePath = join(ROOT, SHELF_PLATE);
