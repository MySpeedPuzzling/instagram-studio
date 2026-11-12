// Data and baked art for the Reel "I'll solve it this weekend" (the pile of shame as a time-lapse; idea in
// docs/ideas/reel-pile-of-shame.md). Same queries and numbers as the carousel (src/posts/pile-of-shame.ts).
// Art: the draft's plates/ folder holds the shelf in three ages (clean.png, dusty.png, old.png; lab SH2), the museum
// wall (museum.png) and optionally a generated time-lapse as frames (timelapse/f0000.jpg …). From those this module
// bakes the "wall of shelves" for the biggest pile: one cubby per unsolved puzzle.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DRAFTS } from '../drafts/model.ts';
import { ROOT } from '../render/server.ts';
import { fetchBoxes } from '../data/boxes.ts';
import { query } from '../data/db.ts';
import { buildShelfSpec, type ShelfPuzzle, type ShelfSpec } from './pile-of-shame.ts';

/** The shelf plates are 896 × 1120 (lab SH1/SH2). The 12 cubbies, row by row (plate pixels). */
export const PLATE = { w: 896, h: 1120 };
const COLS = [{ x: 110, w: 220 }, { x: 345, w: 200 }, { x: 572, w: 208 }];
const ROWS = [{ y: 96, h: 222 }, { y: 340, h: 222 }, { y: 582, h: 218 }, { y: 822, h: 216 }];
export const CUBBIES = ROWS.flatMap(r => COLS.map(c => ({ x: c.x, y: r.y, w: c.w, h: r.h })));
/** The shelf itself inside the plate (for the wall of shelves). */
export const SHELF = { x: 86, y: 62, w: 726, h: 1012 };
/** The wall: WALL.cols shelves wide and as many rows as the pile needs, baked at `tile` px per shelf; the shelf the
 *  camera starts on (top row, column `start`) also at full width. */
export const WALL = { cols: 6, tile: 240, start: 2 };

export interface ReelShelfSpec {
  s: ShelfSpec;
  /** Boxes on the hero shelf: [0] is the most avoided puzzle (row 2, middle), then five more. */
  boxes: Array<{ p: ShelfPuzzle; slot: { x: number; y: number; w: number; h: number } }>;
  plates: { clean: string; dusty: string; old?: string; museum: string };
  /** Generated time-lapse frames (served paths), first = clean, last = oldest; empty when not there. */
  frames: string[];
  wall: { img: string; w: number; h: number; rows: number; tile0: string; tileW: number; tileH: number; shown: number };
  queriedAt: string;
}

const fit = (ar: number, maxW: number, maxH: number) => (maxW / ar <= maxH ? { w: maxW, h: maxW / ar } : { w: maxH * ar, h: maxH });
/** A box standing in a cubby: contained, bottom-aligned on the board (as on the carousel cover). */
export function inCubby(ar: number, s: { x: number; y: number; w: number; h: number }) {
  const z = fit(ar, s.w - 20, s.h - 40);
  return { x: s.x + (s.w - z.w) / 2, y: s.y + s.h - z.h - 2, w: z.w, h: z.h };
}

/** Bakes the wall of shelves (one box per unsolved puzzle of the biggest pile, the rest of the cubbies empty) and
 *  the centre shelf at full width, from the dusty plate and the box pictures. */
async function bakeWall(dir: string, dusty: string, arts: Array<{ img: string; ar: number }>, count: number) {
  if (arts.length < count) throw new Error(`reel-shelf: only ${arts.length} different box pictures for ${count} cubbies`);
  const k = WALL.tile / SHELF.w, th = Math.round(SHELF.h * k), n = WALL.cols, rows = Math.ceil(count / (CUBBIES.length * n));
  const shelf = sharp(join(ROOT, dusty)).extract({ left: SHELF.x, top: SHELF.y, width: SHELF.w, height: SHELF.h });
  const tileBuf = await shelf.clone().resize(WALL.tile, th).modulate({ brightness: 1.08, saturation: 1.14 }).toBuffer();
  const K0 = 1080 / SHELF.w, t0h = Math.round(SHELF.h * K0);
  const tile0Buf = await shelf.clone().resize(1080, t0h).modulate({ brightness: 1.08, saturation: 1.14 }).toBuffer();
  const cub = CUBBIES.map(c => ({ ...c, x: c.x - SHELF.x, y: c.y - SHELF.y }));
  const dustyBox = async (p: { img: string }, w: number, h: number) =>
    sharp(join(ROOT, p.img.slice(1))).resize(Math.max(2, Math.round(w)), Math.max(2, Math.round(h)), { fit: 'cover' }).modulate({ brightness: 1.03, saturation: 1.12 }).toBuffer();
  // filled shelf by shelf, row by row, every cubby a different puzzle (owner 2026-11-12: no picture twice); the last
  // shelf (bottom right) keeps the cubbies the pile doesn't need
  const comps: sharp.OverlayOptions[] = [], comps0: sharp.OverlayOptions[] = [];
  let next = 0;
  for (let t = 0; t < n * rows; t++) comps.push({ input: tileBuf, left: (t % n) * WALL.tile, top: Math.floor(t / n) * th });
  for (let t = 0; t < n * rows; t++) {
    for (let i = 0; i < cub.length && next < count; i++, next++) {
      const p = arts[next], z = inCubby(p.ar, cub[i]);
      comps.push({ input: await dustyBox(p, z.w * k, z.h * k), left: Math.round((t % n) * WALL.tile + z.x * k), top: Math.round(Math.floor(t / n) * th + z.y * k) });
      if (t === WALL.start) comps0.push({ input: await dustyBox(p, z.w * K0, z.h * K0), left: Math.round(z.x * K0), top: Math.round(z.y * K0) });
    }
  }
  const left = count - next;
  const W = n * WALL.tile, H = rows * th;
  await sharp({ create: { width: W, height: H, channels: 3, background: '#222a38' } }).composite(comps).jpeg({ quality: 88 }).toFile(join(dir, 'wall.jpg'));
  await sharp(tile0Buf).composite(comps0).jpeg({ quality: 90 }).toFile(join(dir, 'wall-tile0.jpg'));
  return { w: W, h: H, rows, tileW: 1080, tileH: t0h, shown: count - left };
}

export async function reelShelfSpec(o: { fresh: boolean; draft: string }): Promise<{ spec: ReelShelfSpec; facts: Record<string, unknown> }> {
  const { spec: s, facts } = await buildShelfSpec({ fresh: o.fresh });
  const dir = join(DRAFTS, o.draft, 'plates'), served = (f: string) => `/content/drafts/${o.draft}/plates/${f}`;
  mkdirSync(dir, { recursive: true });
  for (const f of ['clean.png', 'dusty.png', 'museum.png']) if (!existsSync(join(dir, f))) throw new Error(`reel-shelf: ${dir}/${f} is missing (lab SH2 plates)`);
  const others = s.puzzles.slice(1).filter(p => p.puzzle !== s.share.puzzle).sort((a, b) => b.pct - a.pct).slice(0, 5);
  // hero in row 2 middle (cubby 4), the rest around it in rows 2 and 3
  const slots = [4, 3, 5, 6, 7, 8].map(i => CUBBIES[i]);
  const boxes = [s.hero, ...others].map((p, i) => ({ p, slot: inCubby(p.ar, slots[i]) }));
  // the wall: one different picture per cubby, the puzzles most often left unsolved in collections (an aggregate,
  // never the biggest pile's own shelf)
  const wq = query('shelf-shame-wall', { fresh: o.fresh });
  (facts as Record<string, unknown>)['shelf-shame-wall'] = wq;
  const rows = wq.rows.filter(r => +r.image_ratio > 0);
  const imgs = await fetchBoxes(rows.map(r => r.image), 'puzzle_medium');
  const seen = new Set<string>();
  const arts = rows.flatMap(r => { const img = imgs.get(r.image); if (!img || seen.has(img)) return []; seen.add(img); return [{ img, ar: +r.image_ratio }]; });
  const wall = await bakeWall(dir, `content/drafts/${o.draft}/plates/dusty.png`, arts, s.big.unsolved);
  const tl = join(dir, 'timelapse');
  const frames = existsSync(tl) ? readdirSync(tl).filter(f => /^f\d+\.jpg$/.test(f)).sort().map(f => served(`timelapse/${f}`)) : [];
  return {
    facts,
    spec: {
      s, boxes, frames,
      plates: { clean: served('clean.png'), dusty: served('dusty.png'), old: existsSync(join(dir, 'old.png')) ? served('old.png') : undefined, museum: served('museum.png') },
      wall: { img: served('wall.jpg'), tile0: served('wall-tile0.jpg'), ...wall },
      queriedAt: (facts['shelf-shame-totals'] as { queried_at: string }).queried_at,
    },
  };
}
