// Shared SVG building blocks for templates: chart geometry, unit grids and scattered pieces made from the
// jigsaw generator, flags and the logo. Geometry helpers return numbers so each direction styles its own marks.
import { scaleBand, scaleLinear } from 'd3';
import { generateJigsaw, type Piece } from '../pieces/jigsaw.ts';

export const LOGO_URL = '/assets/brand/speedpuzzling-logo.svg';
export const flagUrl = (iso2: string) => `/node_modules/circle-flags/flags/${iso2.toLowerCase()}.svg`;

export interface Bar<T> { datum: T; x: number; y: number; width: number; height: number }

/** Vertical bars on a band scale; values start at zero (house rule). */
export function barGeometry<T>(data: T[], opts: {
  x: (d: T) => string | number; y: (d: T) => number;
  width: number; height: number; padding?: number; yMax?: number;
}) {
  const xs = scaleBand<string>().domain(data.map(d => String(opts.x(d)))).range([0, opts.width]).padding(opts.padding ?? 0.18);
  const ys = scaleLinear().domain([0, opts.yMax ?? Math.max(...data.map(opts.y))]).nice().range([opts.height, 0]);
  const bars: Bar<T>[] = data.map(d => {
    const top = ys(opts.y(d));
    return { datum: d, x: xs(String(opts.x(d)))!, y: top, width: xs.bandwidth(), height: opts.height - top };
  });
  return { bars, xScale: xs, yScale: ys };
}

/** Horizontal bars for ranked lists (e.g. countries); starts at zero unless a domain is given. */
export function rankGeometry<T>(data: T[], opts: { value: (d: T) => number; width: number; rowHeight: number; gap?: number; domain?: [number, number] }) {
  const xs = scaleLinear().domain(opts.domain ?? [0, Math.max(...data.map(opts.value))]).range([0, opts.width]);
  return data.map((d, i) => ({ datum: d, y: i * (opts.rowHeight + (opts.gap ?? 0)), width: xs(opts.value(d)), height: opts.rowHeight }));
}

/**
 * A grid of interlocking pieces (e.g. a 10×10 unit chart). Pieces are returned in reading order, so the
 * first N pieces can carry the first category. All pieces come from one jigsaw, so they tessellate.
 */
export function pieceGrid(opts: { cols: number; rows: number; x: number; y: number; width: number; height: number; seed?: number; tabSize?: number }) {
  const jig = generateJigsaw({ ...opts, seed: opts.seed ?? 7 });
  return jig.pieces.sort((a, b) => a.row - b.row || a.col - b.col);
}

/** Assigns categories to grid pieces from unit counts, in order. */
export function assignUnits<K extends string>(pieces: Piece[], units: Array<{ key: K; units: number }>) {
  const out: Array<{ piece: Piece; key: K }> = [];
  let i = 0;
  for (const u of units) for (let n = 0; n < u.units && i < pieces.length; n++) out.push({ piece: pieces[i++], key: u.key });
  return out;
}

/** One interior piece (tabs or blanks on all four sides), normalised to a box of the given size at the origin. */
export function singlePiece(size: number, seed = 3): { d: string; viewBox: string } {
  const jig = generateJigsaw({ cols: 3, rows: 3, width: size * 3, height: size * 3, seed });
  const p = jig.pieces.find(q => q.col === 1 && q.row === 1)!;
  return { d: p.d, viewBox: `${p.bbox.x} ${p.bbox.y} ${p.bbox.width} ${p.bbox.height}` };
}

/**
 * Pieces lifted out of one jigsaw and scattered around a frame, avoiding a central keep-out box.
 * Deterministic for a seed. Returns transform strings (translate + rotate around the piece centre).
 */
export function scatterPieces(opts: {
  count: number; width: number; height: number; pieceSize: number;
  keepOut: { x: number; y: number; width: number; height: number }; seed?: number; maxRotate?: number;
}) {
  const cols = 6, rows = 6;
  const jig = generateJigsaw({ cols, rows, width: cols * opts.pieceSize, height: rows * opts.pieceSize, seed: opts.seed ?? 11, tabSize: 0.22 });
  let s = (opts.seed ?? 11) * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const pool = jig.pieces.filter(p => p.col > 0 && p.col < cols - 1 && p.row > 0 && p.row < rows - 1);
  const placed: Array<{ piece: Piece; transform: string; cx: number; cy: number }> = [];
  const k = opts.keepOut;
  for (let tries = 0; placed.length < opts.count && tries < 4000; tries++) {
    const cx = rnd() * opts.width, cy = rnd() * opts.height;
    const r = opts.pieceSize * 0.75;
    const insideKeepOut = cx > k.x - r && cx < k.x + k.width + r && cy > k.y - r && cy < k.y + k.height + r;
    const overlaps = placed.some(p => Math.hypot(p.cx - cx, p.cy - cy) < opts.pieceSize * 1.25);
    if (insideKeepOut || overlaps) continue;
    const piece = pool[placed.length % pool.length];
    const pcx = piece.bbox.x + piece.bbox.width / 2, pcy = piece.bbox.y + piece.bbox.height / 2;
    const rot = (rnd() * 2 - 1) * (opts.maxRotate ?? 28);
    placed.push({ piece, cx, cy, transform: `translate(${(cx - pcx).toFixed(1)} ${(cy - pcy).toFixed(1)}) rotate(${rot.toFixed(1)} ${pcx.toFixed(1)} ${pcy.toFixed(1)})` });
  }
  return placed;
}
