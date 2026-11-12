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
/** The dusty shelf (AI1 E4, FLUX.2 klein 4B, Apache-2.0): dusk light, cobwebs, six empty compartments. */
export const SHELF_PLATE = 'content/labs/AI1/E4/shelf-dusk-s401.png';
const PLATE_GEN = { w: 1024, h: 1280 };
/** Compartments in generation pixels (AI1 scaffold `shelf`, 2 × 3). */
const SLOTS = [384, 672, 960].flatMap(y => [192, 544].map(x => ({ x, y, w: 288, h: 192 })));
const AI_CREDIT = 'Shelf: AI (FLUX.2 klein 4B)';
/** Empty gallery wall with a rope barrier (AI1 E1, Z-Image Turbo). */
export const MUSEUM_PLATE = 'content/labs/AI1/E1/museum-wall-s101.png';
const MUSEUM_CREDIT = 'Gallery: AI (Z-Image Turbo)';

export type Direction = 'A' | 'B';
export interface ShelfPuzzle { puzzle: string; brand: string; pieces: number; owners: number; unsolved: number; pct: number; medianS: number; img: string; ar: number }
export interface ShelfSpec {
  collected: number; unsolved: number; pct: number; collections: number; piles: number; medianPile: number; unsolvedPieces: number;
  big: { unsolved: number; withMedian: number; hours: number; days: number };
  hoursMedian: number; hoursP90: number; hoursAll: number; yearsAll: number; over100h: number;
  puzzles: ShelfPuzzle[]; hero: ShelfPuzzle; share: ShelfPuzzle; asOf: string; src: string;
}

export async function buildShelfSpec(o: { fresh: boolean }): Promise<{ spec: ShelfSpec; facts: Record<string, QueryResult> }> {
  const facts = { 'shelf-shame-totals': query('shelf-shame-totals', { fresh: o.fresh }), 'shelf-shame-puzzles': query('shelf-shame-puzzles', { fresh: o.fresh }), 'shelf-shame-pct': query('shelf-shame-pct', { fresh: o.fresh }) };
  const t = facts['shelf-shame-totals'].rows[0];
  const rows = facts['shelf-shame-puzzles'].rows, pctRows = facts['shelf-shame-pct'].rows;
  const imgs = await fetchBoxes([...rows, ...pctRows].map(r => r.image), 'puzzle_large');
  const toP = (r: Record<string, string>): ShelfPuzzle[] => {
    const img = imgs.get(r.image);
    return img ? [{ puzzle: r.puzzle, brand: r.brand, pieces: +r.pieces, owners: +r.owners, unsolved: +r.unsolved, pct: +r.pct_unsolved, medianS: +r.median_solo_s, img, ar: +r.image_ratio || 1.4 }] : [];
  };
  const puzzles = rows.flatMap(toP);
  const hero = puzzles[0];
  // Exhibit by share: the highest unsolved share among puzzles in 40+ collections (owner 2026-11-12: a second exhibit
  // when it's a different puzzle than the most-avoided by number).
  const share = pctRows.flatMap(toP)[0];
  if (!share || share.puzzle === hero?.puzzle) throw new Error('pile-of-shame: the share exhibit is missing or the same puzzle as the count exhibit');
  if (!hero || hero.puzzle !== 'Speed Puzzling') throw new Error(`pile-of-shame: the most-avoided puzzle is now "${hero?.puzzle}", not "Speed Puzzling": rethink the punchline`);
  const bigHours = Math.round(+t.big_median_s / 3600);
  const asOf = new Date(facts['shelf-shame-totals'].queried_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });
  return {
    facts,
    spec: {
      collected: +t.collected, unsolved: +t.unsolved, pct: +t.pct_unsolved, collections: +t.collections, piles: +t.piles, medianPile: +t.median_pile,
      unsolvedPieces: +t.unsolved_pieces,
      big: { unsolved: +t.big_unsolved, withMedian: +t.big_with_median, hours: bigHours, days: Math.floor(bigHours / 24) },
      hoursMedian: Math.round(+t.hours_median), hoursP90: Math.round(+t.hours_p90), hoursAll: +t.hours_all, yearsAll: Math.floor(+t.hours_all / (24 * 365.25)),
      over100h: +t.collections_100h, puzzles, hero, share, asOf, src: `Data: myspeedpuzzling.com · ${asOf}`,
    },
  };
}

// ---------------------------------------------------------------- helpers
const pct = (n: number) => `${n}%`;
const millions = (n: number) => `${(n / 1e6).toFixed(1)} million`;
const rel = (p: string) => '/' + p;
let uid = 0;
const svg = (inner: string) => `<svg style="position:absolute; left:0; top:0" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true">${inner}</svg>`;
const fit = (ar: number, maxW: number, maxH: number) => (maxW / ar <= maxH ? { w: maxW, h: maxW / ar } : { w: maxH * ar, h: maxH });
const boxImg = (b: ShelfPuzzle, x: number, y: number, w: number, hh: number, rot = 0, extra = '') =>
  `<img src="${b.img}" alt="" style="position:absolute; left:${f1(x)}px; top:${f1(y)}px; width:${f1(w)}px; height:${f1(hh)}px; object-fit:cover; transform:rotate(${rot}deg); box-shadow:0 10px 22px rgba(10,14,22,.5); border-radius:3px${extra}">`;

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
  const z = fit(b.ar, s.w - 16, s.h - 12);
  return { x: s.x + (s.w - z.w) / 2, y: s.y + s.h - z.h - 2, w: z.w, h: z.h };
}

// ---------------------------------------------------------------- slides
export function shelfSlides(v: Variant, s: ShelfSpec, dir: Direction): string[] {
  const order = ['cover', 'waffle', 'twist', 'scale', 'share', 'reveal', 'rest'] as const;
  const ctx = (k: typeof order[number]): SlideCtx => ({ v, post: POST, slide: order.indexOf(k) + 1, of: order.length });
  const others = s.puzzles.slice(1).filter(p => p.puzzle !== s.share.puzzle).sort((a, b) => b.pct - a.pct);
  const coverDek = `<b>${pct(Math.round(s.pct))}</b> of the puzzles in your collections have never been solved. The one you avoid most has a very ironic name…`;
  const boxCredit = `Box art: ${[...new Set(s.puzzles.map(p => p.brand))].join(', ')}`;

  const cover = () => {
    const seam = 452;
    if (dir === 'A') {
      // Photo: generation y 300 sits at the seam; the compartments follow at scale k.
      const k = 0.84, cropY = 300, left = (W - PLATE_GEN.w * k) / 2, photoTop = seam - 40;
      const place = (sl: typeof SLOTS[number]) => ({ x: left + sl.x * k, y: photoTop + (sl.y - cropY) * k, w: sl.w * k, h: sl.h * k });
      const slots = SLOTS.map(place);
      // Slot 1 stays empty (the punchline is on slide 5), the next five most-avoided boxes fill the rest.
      const boxes = slots.slice(1).map((sl, i) => {
        const b = others[i], z = inSlot(b, sl);
        return boxImg(b, z.x, z.y, z.w, z.h) + badge(z.x + z.w - 14, z.y + 4, 100, pct(b.pct), 30, 23 + i);
      }).join('');
      const empty = slots[0];
      return posterCover(ctx('cover'), {
        title: 'The pile of shame is real', dek: coverDek, seam,
        underArt: shelfPhoto(left, photoTop, k, cropY, FEED.footRule - photoTop - 6),
        body: boxes + badge(empty.x + empty.w / 2, empty.y + empty.h / 2 + 10, 116, '?', 64, 41),
        src: `${boxCredit} · ${AI_CREDIT}`,
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
    Hours = each unsolved puzzle's median solo time from its MySpeedPuzzling page (half of puzzlers are faster), added up per puzzler. Puzzles nobody has timed yet count as 0. Your pace may vary.</p>`;

  const twist = () => {
    const x = ctx('twist');
    const small = s.hoursMedian <= 20, cols = small ? 5 : 7, rows = Math.ceil(s.hoursMedian / cols), pw = small ? 150 : 92, top = 640;
    const jig = generateJigsaw({ cols, rows, width: cols * pw, height: rows * pw, x: X0, y: top, seed: 88, tabSize: 0.24 });
    const art = jig.pieces.filter(p => p.row * cols + p.col < s.hoursMedian)
      .map(p => `<path d="${p.d}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="4" stroke-linejoin="round"/>`).join('');
        return slide(x, 'data', {
      kicker: 'Plot twist', src: s.src,
      title: 'How long would your pile take?',
      body: svg(art) + `
        <p class="h-abs" style="top:336px; width:${CW}px; font-size:34px; line-height:1.3; color:var(--g-ink)">Got a pile? We did the math nobody asked for: the median solo time of every puzzle on it, added up. The typical pile, ${s.medianPile} puzzles:</p>
        <p class="h-abs" style="top:${top - 128}px; font-size:110px; font-weight:800; line-height:1; color:var(--c-hot)">${s.hoursMedian}<span style="font-size:54px; font-weight:700"> hours</span></p>
        <p class="h-abs" style="top:${top + rows * pw + 24}px; width:${CW}px; font-size:34px; line-height:1.3; color:var(--g-ink)">1 piece = 1 hour. That’s one rainy weekend. <b style="color:var(--c-hot)">No excuses.</b></p>
        ${disclaimer(1084)}`,
    }).html;
  };

  const scale = () => {
    const x = ctx('scale');
    const items = [
      { label: 'Typical pile', meta: `${s.medianPile} unsolved puzzles`, h: s.hoursMedian },
      { label: 'Top 10%', meta: `${fmtInt(s.over100h)} piles pass 100 hours`, h: s.hoursP90 },
      { label: 'The biggest pile', meta: `${fmtInt(s.big.unsolved)} unsolved puzzles`, h: s.big.hours, hot: true },
    ];
    const max = Math.max(...items.map(i => i.h));
    const top = 330, rowH = 128, BX = X0, BW = CW - 200;
    const art = items.map((it, i) => `<rect x="${BX}" y="${top + i * rowH + 56}" width="${f1(Math.max(6, (it.h / max) * BW))}" height="44" fill="${it.hot ? 'var(--c-hot)' : 'var(--c-base)'}"/>`).join('');
    const html = items.map((it, i) => `
      <p class="h-abs" style="top:${top + i * rowH}px; width:${CW}px; font-size:32px; font-weight:700; line-height:1.1; color:var(--g-ink)">${h(it.label)} <span data-qa-small style="font-size:24px; font-weight:400; color:var(--g-soft)">· ${h(it.meta)}</span></p>
      <p class="h-abs" style="left:${f1(BX + Math.max(6, (it.h / max) * BW) + 16)}px; top:${top + i * rowH + 58}px; font-size:38px; font-weight:800; line-height:1; color:${it.hot ? 'var(--c-hot)' : 'var(--g-ink)'}; white-space:nowrap">${fmtInt(it.h)} h</p>`).join('');
    const yT = top + items.length * rowH + 16;
    return slide(x, 'data', {
      kicker: 'Plot twist', src: s.src,
      title: 'And then there’s… this pile',
      body: svg(art) + html + `
        <p class="h-abs" style="top:${yT}px; width:${CW}px; font-size:46px; font-weight:800; line-height:1.15; color:var(--g-ink)">${fmtInt(s.big.hours)} hours = <span style="color:var(--c-hot)">${s.big.days} days and nights</span> without a break. Snacks not included.</p>
        <p class="h-abs" style="top:${yT + 124}px; width:${CW}px; font-size:30px; line-height:1.3; color:var(--g-soft)">All ${fmtInt(s.piles)} piles together: ${fmtInt(s.hoursAll)} hours, over ${s.yearsAll} years non-stop.</p>
        <p class="h-abs" style="top:${yT + 196}px; width:${CW}px; font-size:52px; font-weight:800; line-height:1.1; color:var(--c-hot)">Who is this puzzle collector?</p>
        <p class="h-abs" style="top:${yT + 262}px; width:${CW}px; font-size:32px; line-height:1.3; color:var(--g-ink)">Is it you? Blink twice. Or confess in the comments.</p>
        <p class="h-abs" data-qa-small style="top:1110px; width:${CW}px; font-size:24px; line-height:1.35; color:var(--g-soft)">Sums of median solo times, as on slide 3 (${fmtInt(s.big.withMedian)} of the biggest pile's ${fmtInt(s.big.unsolved)} puzzles have one).</p>`,
    }).html;
  };

  /** A museum exhibit (owner 2026-11-12): the real box framed on the gallery wall, a plaque that carries the joke. */
  const exhibit = (key: 'share' | 'reveal', b: ShelfPuzzle, o: { lead: string; no: number; line: string; plaque: string[] }) => {
    const x = ctx(key);
    const stats = `<p class="h-abs" style="top:992px; width:${CW}px; font-size:34px; line-height:1.3; color:var(--g-ink)"><b>${b.unsolved} of its ${b.owners} owners</b> haven't solved it <span style="color:var(--c-hot); font-weight:800">(${pct(b.pct)})</span>. ${h(o.line)}</p>
      <p class="h-abs" style="top:1104px; width:${CW}px; font-size:30px; line-height:1.3; color:var(--g-soft)">Those who dared: median ${h(fmtDuration(b.medianS / 60))} solo.</p>`;
    const nameSize = b.puzzle.length > 16 ? 76 : 92;
    const head = `<p class="h-abs" style="top:${FEED.contentTop + 4}px; width:${CW}px; font-size:44px; font-weight:700; line-height:1.15; color:var(--g-ink)">${h(o.lead)}</p>
      <p class="h-abs" style="top:${FEED.contentTop + 70}px; width:${CW}px; font-size:${nameSize}px; font-weight:800; line-height:1.05; color:var(--c-hot); white-space:nowrap">${h(b.puzzle)}</p>`;
    const P = { w: 1088, h: 1360 }, k = CW / P.w, cropY = 420, panelTop = 380, panelH = 580;
    const panel = `<div style="position:absolute; left:${X0}px; top:${panelTop}px; width:${CW}px; height:${panelH}px; overflow:hidden; border-radius:8px">
      <img src="${rel(MUSEUM_PLATE)}" alt="" style="position:absolute; left:0; top:${f1(-cropY * k)}px; width:${CW}px; height:${f1(P.h * k)}px"></div>`;
    const z = fit(b.ar, 380, 270), fr = 20, mat = 24;
    const fw = z.w + 2 * (fr + mat), fh = z.h + 2 * (fr + mat);
    const fx = X0 + 70, fy = panelTop + 50;
    const framed = `<div style="position:absolute; left:${f1(fx)}px; top:${f1(fy)}px; width:${f1(fw)}px; height:${f1(fh)}px; background:#1b1b1d; box-shadow:0 18px 30px rgba(20,20,20,.35)">
        <div style="position:absolute; inset:${fr}px; background:#f7f5f0"></div>
        <img src="${b.img}" alt="" style="position:absolute; left:${fr + mat}px; top:${fr + mat}px; width:${f1(z.w)}px; height:${f1(z.h)}px; object-fit:cover"></div>`;
    const px = fx + fw + 44, pw = X0 + CW - 40 - px;
    const plaque = `<div data-qa-bg="#ffffff" style="position:absolute; left:${f1(px)}px; top:${f1(fy + 30)}px; width:${f1(pw)}px; padding:16px 18px; background:#ffffff; color:#222a38; box-shadow:0 6px 14px rgba(20,20,20,.25); font-size:24px; line-height:1.3">
        <p data-qa-small style="font-weight:800">No. ${o.no} · ${h(b.puzzle)}</p>
        <p data-qa-small>${h(b.brand)}, ${fmtInt(b.pieces)} pieces</p>
        ${o.plaque.map((l, i) => `<p data-qa-small style="margin-top:10px${i === o.plaque.length - 1 ? '; font-style:italic' : ''}">${h(l)}</p>`).join('')}</div>`;
    return slide(x, 'data', { kicker: `The exhibit · No. ${o.no}`, src: `Box art: ${b.brand} · ${MUSEUM_CREDIT}`, body: head + panel + framed + plaque + stats }).html;
  };
  const shareExhibit = () => exhibit('share', s.share, {
    no: 1, lead: 'Most avoided by share of owners:',
    line: /most everyone/i.test(s.share.puzzle) ? 'Most everyone, indeed.' : 'Collected with love. Never opened. Probably.',
    plaque: [`Unsolved by ${pct(s.share.pct)} of its owners.`, `Solved by ${s.share.owners - s.share.unsolved} brave souls.`],
  });
  const reveal = () => exhibit('reveal', s.hero, {
    no: 2, lead: 'And by number of owners, it’s called…',
    line: 'The name is not a promise.',
    plaque: [`Unsolved by ${s.hero.unsolved} of its ${s.hero.owners} owners.`, 'Please do not touch. Nobody does.'],
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

  return [cover(), waffle(), twist(), scale(), shareExhibit(), reveal(), rest()];
}

export function shelfAlt(s: ShelfSpec, dir: Direction): string[] {
  const others = s.puzzles.slice(1).filter(p => p.puzzle !== s.share.puzzle).sort((a, b) => b.pct - a.pct);
  return [
    `Cover: The pile of shame is real. ${pct(Math.round(s.pct))} of the puzzles in your collections have never been solved, and the one you avoid most has a very ironic name. ${dir === 'A' ? 'A dusty, cobwebbed wooden shelf holds five puzzle boxes, each with a coral puzzle piece showing the share of owners who haven\'t solved it; the sixth compartment is empty with a question mark.' : 'A heap of puzzle boxes with a coral question-mark piece on top.'} Boxes: ${others.slice(0, 5).map(p => `${p.puzzle} ${pct(p.pct)}`).join(', ')}.`,
    `${fmtInt(s.unsolved)} puzzles, still waiting: a 10 by 10 grid of puzzle pieces with ${Math.round(s.pct)} in coral. ${pct(s.pct)} of ${fmtInt(s.collected)} puzzles in ${fmtInt(s.collections)} MySpeedPuzzling collections were never logged as solved by their owner. ${millions(s.unsolvedPieces)} pieces are still in their boxes; ${fmtInt(s.piles)} collectors have a pile of unsolved puzzles.`,
    `Plot twist: how long would your pile take? Adding up the median solo time of every puzzle on it, the typical pile (${s.medianPile} puzzles) holds ${s.hoursMedian} hours of puzzling, shown as ${s.hoursMedian} coral pieces, one per hour. Note: median solo times from each puzzle's page, half of puzzlers are faster; puzzles nobody has timed count as 0; your pace may vary.`,
    `And then there's the biggest pile. Bars: typical pile ${s.hoursMedian} hours, top 10% ${s.hoursP90} hours, the biggest pile ${fmtInt(s.big.hours)} hours for ${s.big.unsolved} unsolved puzzles. ${fmtInt(s.big.hours)} hours is ${s.big.days} days and nights without a break. All ${fmtInt(s.piles)} piles together: ${fmtInt(s.hoursAll)} hours, over ${s.yearsAll} years non-stop. Who is this puzzle collector? Is it you?`,
    `Museum exhibit number 1, most avoided by share of owners: ${s.share.puzzle}, ${s.share.brand}, ${s.share.pieces} pieces, framed on a gallery wall with a plaque. ${s.share.unsolved} of its ${s.share.owners} owners haven't solved it (${pct(s.share.pct)}); solved by ${s.share.owners - s.share.unsolved} brave souls. Those who dared: median ${fmtDuration(s.share.medianS / 60)} solo.`,
    `Museum exhibit number 2, and by number of owners it's called… ${s.hero.puzzle}. The ${s.hero.brand} ${s.hero.pieces}-piece box framed on a gallery wall, plaque: unsolved by ${s.hero.unsolved} of its ${s.hero.owners} owners (${pct(s.hero.pct)}). Please do not touch. Nobody does. Those who dared: median ${fmtDuration(s.hero.medianS / 60)} solo.`,
    `Also high on the pile, share of owners who haven't solved it: ${others.slice(0, 6).map(p => `${p.puzzle} (${p.pieces} pieces) ${p.unsolved} of ${p.owners}, ${pct(p.pct)}`).join('; ')}. What's been waiting on your shelf the longest?`,
  ];
}

export function shelfCaption(s: ShelfSpec): string {
  return [
    `${pct(Math.round(s.pct))} of the puzzles in your collections have never been solved. The pile of shame is real, and we have the numbers 📦`,
    '',
    `${fmtInt(s.unsolved)} puzzles on MySpeedPuzzling are waiting for "one day". Plot twist: we did the math nobody asked for and added up the median solo time of every puzzle on each pile. The typical pile (${s.medianPile} puzzles) is ${s.hoursMedian} hours: one rainy weekend, no excuses. The biggest one is ${fmtInt(s.big.hours)} hours, about ${s.big.days} days without sleep 😅 Who is this puzzle collector? Is it you? 👀`,
    '',
    `Welcome to the museum of unsolved puzzles 🖼️ Exhibit No. 1: ${s.share.puzzle}, unsolved by ${pct(s.share.pct)} of its owners. Exhibit No. 2, the most avoided by number of owners, is called… Speed Puzzling. ${s.hero.unsolved} of its ${s.hero.owners} owners haven't solved it yet. @ravensburgerglobal, we need to talk.`,
    '',
    `Hours are each puzzle's median solo time from its page, so half of puzzlers are faster and your pace may vary. Solved one and never logged it? Then it's still on the pile, so go log it ⏱️`,
    '',
    `What's been waiting on your shelf the longest? We won't judge. Much 👇`,
    '',
    '#speedpuzzling #jigsawpuzzle #puzzlecollection #ravensburger',
  ].join('\n');
}

export const shelfPlatePath = join(ROOT, SHELF_PLATE);
