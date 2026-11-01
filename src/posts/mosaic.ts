// Colour mosaics of box images (owner: DL4 H4-26/27/28 "September in 1000 puzzles", used for the monthly recap):
// every box gets its perceived colour and a colourful square crop; a jigsaw piece from the generator is filled with one
// tile per box, hue running left → right (greys first) and lightness top → bottom within each column.
// Ported from lab/dl4/posts/formats.ts (the lab keeps its own copy as reference); the cache in content/cache/f1/
// (tones-v3.json, tile/<puzzle id>.jpg at 72 px) is shared with the labs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { generateJigsaw, outlineToPath, sampleOutline, type Point } from '../pieces/jigsaw.ts';
import { ROOT } from '../render/server.ts';

export interface MosaicBox { puzzleId: string; puzzle: string; brand: string; /** Local URL of the cached box image. */ img: string }
interface Crop { x: number; y: number; s: number; L: number; C: number; h: number }
export interface Tone { L: number; C: number; h: number; hex: string; w: number; h_px: number; crop?: Crop }
export interface Cell { col: number; row: number; x: number; y: number; cx: number; cy: number }

const CACHE = join(ROOT, 'content/cache/f1');
const TONES_FILE = join(CACHE, 'tones-v3.json');
/** Local URL of a box's 72 px mosaic tile. */
export const tileUrl = (b: MosaicBox) => `/content/cache/f1/tile/${b.puzzleId}.jpg`;

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function toLab(r: number, g: number, b: number): [number, number, number] {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const lch = (r: number, g: number, b: number) => {
  const [L, A, B] = toLab(r, g, b);
  return { L: +L.toFixed(2), C: +Math.hypot(A, B).toFixed(2), h: +((Math.atan2(B, A) * 180 / Math.PI + 360) % 360).toFixed(1) };
};

/** Mean colour of the whole box, and the most colourful square (55 % of the short side) for the tile. */
async function analyse(file: string): Promise<Tone> {
  const meta = await sharp(file).metadata();
  const W0 = meta.width!, H0 = meta.height!;
  const { data } = await sharp(file).flatten({ background: '#ffffff' }).resize(1, 1, { fit: 'fill', kernel: 'cubic' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const hex = '#' + [data[0], data[1], data[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  const out: Tone = { ...lch(data[0] / 255, data[1] / 255, data[2] / 255), hex, w: W0, h_px: H0 };
  const gw = 48, gh = Math.max(8, Math.round((48 * H0) / W0));
  const { data: px } = await sharp(file).flatten({ background: '#ffffff' }).resize(gw, gh, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const k = Math.round(Math.min(gw, gh) * 0.55);
  let best = { score: -Infinity, x: 0, y: 0, c: lch(0, 0, 0) };
  for (let y = 0; y + k <= gh; y++) for (let x = 0; x + k <= gw; x++) {
    let r = 0, g = 0, b = 0;
    for (let j = y; j < y + k; j++) for (let i = x; i < x + k; i++) { const o = (j * gw + i) * 3; r += px[o]; g += px[o + 1]; b += px[o + 2]; }
    const n = k * k * 255;
    const c = lch(r / n, g / n, b / n);
    const score = c.C - 0.5 * Math.max(0, 38 - c.L) - 0.5 * Math.max(0, c.L - 82);
    if (score > best.score) best = { score, x, y, c };
  }
  const sx = W0 / gw;
  out.crop = { x: Math.round(best.x * sx), y: Math.round(best.y * sx), s: Math.round(k * sx), ...best.c };
  out.crop.s = Math.min(out.crop.s, W0 - out.crop.x, H0 - out.crop.y);
  return out;
}

/** Tones and 72 px tiles for every box (cached); returns the tone per box image URL. */
export async function prepareTones(boxes: MosaicBox[]): Promise<Map<string, Tone>> {
  mkdirSync(join(CACHE, 'tile'), { recursive: true });
  const tones: Record<string, Tone> = existsSync(TONES_FILE) ? JSON.parse(readFileSync(TONES_FILE, 'utf8')) : {};
  const jobs = boxes.filter(b => existsSync(join(ROOT, b.img)) && (!tones[b.img]?.crop || !existsSync(join(ROOT, tileUrl(b)))));
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(jobs.slice(i, i + 8).map(async b => {
      const file = join(ROOT, b.img);
      if (!tones[b.img]?.crop) tones[b.img] = await analyse(file);
      const cr = tones[b.img].crop!, thumb = join(ROOT, tileUrl(b));
      if (!existsSync(thumb)) await sharp(file).flatten({ background: '#ffffff' }).extract({ left: cr.x, top: cr.y, width: cr.s, height: cr.s }).resize(72, 72).jpeg({ quality: 86 }).toFile(thumb);
    }));
  }
  if (jobs.length) writeFileSync(TONES_FILE, JSON.stringify(tones));
  const missing = boxes.filter(b => !tones[b.img]);
  if (missing.length) throw new Error(`mosaic: ${missing.length} box images are not cached (run node src/data/boxes.ts <query> puzzle_medium)`);
  return new Map(boxes.map(b => [b.img, tones[b.img]]));
}

export const NEUTRAL_C = 7;
/** Plain colour name of a tone ("greens"), for copy like "No. 1 sits among the greens". */
export function colourFamily(t: { C: number; h: number }) {
  if (t.C < NEUTRAL_C) return 'greys';
  const names: Array<[number, string]> = [[20, 'pinks'], [48, 'reds'], [72, 'oranges'], [102, 'yellows'], [170, 'greens'], [235, 'teals'], [295, 'blues'], [345, 'purples'], [360, 'pinks']];
  return names.find(([max]) => t.h < max)![1];
}

function pointIn(poly: Point[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * One interior jigsaw piece filled edge to edge with exactly `n` grid cells: every cell the outline touches gets a tile,
 * and the piece's own curve (clip-path) trims the edge tiles, so the edge is smooth with no notches (owner 2026-11-01:
 * "I don't like the sharp edges"). The piece is scaled until the touched cells number `n`; if no scale lands exactly,
 * the cells with the smallest visible sliver are dropped (a few px at most).
 */
export function pieceCells(n: number, pitch: number, seed: number, tabSize: number) {
  const base = generateJigsaw({ cols: 3, rows: 3, width: 300, height: 300, seed, tabSize, jitter: 0 });
  const p = base.pieces.find(q => q.col === 1 && q.row === 1)!;
  const norm = p.outline.map(([x, y]) => [x - p.bbox.x, y - p.bbox.y] as Point);
  const poly0 = sampleOutline(norm, 40);
  const K = 6; // samples per cell side for the visible share
  const cover = (s: number) => {
    const poly = poly0.map(([x, y]) => [x * s, y * s] as Point);
    const cells: Array<Cell & { share: number }> = [];
    for (let row = 0; row * pitch < p.bbox.height * s; row++) for (let col = 0; col * pitch < p.bbox.width * s; col++) {
      const x = col * pitch, y = row * pitch;
      let hit = 0;
      for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) if (pointIn(poly, x + (i + 0.5) * pitch / K, y + (j + 0.5) * pitch / K)) hit++;
      // A cell the outline only grazes between samples still counts when an outline point falls inside it.
      const grazed = !hit && poly.some(([px, py]) => px > x && px < x + pitch && py > y && py < y + pitch);
      if (hit || grazed) cells.push({ col, row, x, y, cx: x + pitch / 2, cy: y + pitch / 2, share: hit / (K * K) || 0.5 / (K * K) });
    }
    return cells;
  };
  let s = 2;
  while (cover(s).length < n) s += 0.1;
  s -= 0.1;
  let cells = cover(s);
  while (cells.length < n) { s += 0.0005; cells = cover(s); }
  if (cells.length > n) cells = [...cells].sort((a, z) => z.share - a.share).slice(0, n);
  return {
    cells: cells.map(({ share: _, ...c }) => c), dropped: cover(s).length - n,
    d: outlineToPath(norm.map(([x, y]) => [+(x * s).toFixed(2), +(y * s).toFixed(2)] as Point)), w: p.bbox.width * s, h: p.bbox.height * s,
  };
}

/** Colour field: hue runs left → right (greys first), lightness top → bottom within each column. */
export function colourField<B extends MosaicBox>(cells: Cell[], boxes: B[], tones: Map<string, Tone>) {
  const t = (b: B) => tones.get(b.img)!.crop ?? tones.get(b.img)!;
  const greys = boxes.filter(b => t(b).C < NEUTRAL_C).sort((a, b) => t(b).L - t(a).L);
  const hueKey = (b: B) => (t(b).h - 10 + 360) % 360;
  const colours = boxes.filter(b => t(b).C >= NEUTRAL_C).sort((a, b) => hueKey(a) - hueKey(b));
  const ordered = [...greys, ...colours];
  const byCol = new Map<number, Cell[]>();
  for (const c of cells) byCol.set(c.col, [...(byCol.get(c.col) ?? []), c]);
  const out = new Map<Cell, B>();
  let i = 0;
  for (const col of [...byCol.keys()].sort((a, b) => a - b)) {
    const cs = byCol.get(col)!.sort((a, b) => a.row - b.row);
    const bs = ordered.slice(i, i + cs.length).sort((a, b) => t(b).L - t(a).L);
    cs.forEach((c, k) => out.set(c, bs[k]));
    i += cs.length;
  }
  return out;
}
