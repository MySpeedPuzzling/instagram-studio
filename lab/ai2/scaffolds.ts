// IL1 inputs for the style-locked direction (I6): flat, code-drawn compositions in the brand colours whose jigsaw
// pieces all come from the generator (src/pieces/jigsaw.ts), so the piece shapes are correct by construction. klein 4B
// (1-reference edit) then restyles them (screen print, cut paper) without being asked to invent a single piece.
//
// Rendered with the normal Playwright harness on the 1080 design canvas (feed frame, the square top 1080×1080), then
// reduced to the 1024×1024 generation size. Scenes match the funny facts that need pieces (edges first / last, sorting
// the sky) and three site-like spots (empty state, achievement badge, XP and levels).
//
//   node lab/ai2/scaffolds.ts        # writes content/labs/IL1/scaffolds/<name>.png (+ .json, + the 1440 master)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { page } from '../../src/design/page.ts';
import { generateJigsaw, type Jigsaw, type Piece } from '../../src/pieces/jigsaw.ts';
import { createRenderer } from '../../src/render/render.ts';
import { OUT_DIR } from './batch.ts';

export const SCAFFOLD_DIR = join(OUT_DIR, 'scaffolds');
export const GEN = { width: 1024, height: 1024 };
const C = { navy: '#2b3445', coral: '#ec726f', indigo: '#4e54c8', sky: '#69b3fe', white: '#ffffff', skyLight: '#9fcdfe', skyDeep: '#4a9cf0' };

export const SCAFFOLDS = ['edges-first', 'edges-last', 'sky', 'empty', 'badge', 'levels'] as const;
export type ScaffoldName = (typeof SCAFFOLDS)[number];

const n = (v: number) => +v.toFixed(2);
const centre = (j: Jigsaw, p: Piece): [number, number] => {
  const o = j.options;
  return [o.x + (p.col + 0.5) * (o.width / o.cols), o.y + (p.row + 0.5) * (o.height / o.rows)];
};
/** A generator piece, flat fill, with a ground-coloured stroke so the cuts between same-colour neighbours stay visible. */
function piece(j: Jigsaw, p: Piece, fill: string, to?: [number, number], rot = 0, stroke = C.navy) {
  const [cx, cy] = centre(j, p);
  const tf = to ? ` transform="translate(${n(to[0] - cx)} ${n(to[1] - cy)}) rotate(${n(rot)} ${n(cx)} ${n(cy)})"` : '';
  return `<path d="${p.d}" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"${tf}/>`;
}
function rng(seed: number) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
const isEdge = (j: Jigsaw, p: Piece) => p.col === 0 || p.row === 0 || p.col === j.options.cols - 1 || p.row === j.options.rows - 1;
const mat = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="${C.indigo}"/>`;

/** The scenes, each an SVG body on the 1080×1080 canvas (navy ground). */
function scene(name: ScaffoldName): string {
  const out: string[] = [`<rect width="1080" height="1080" fill="${C.navy}"/>`];
  if (name === 'edges-first' || name === 'edges-last') {
    const S = 80, cols = 7, rows = 5;
    const j = generateJigsaw({ cols, rows, width: cols * S, height: rows * S, x: (1080 - cols * S) / 2, y: 120, seed: 15, tabSize: 0.22, jitter: 0.03 });
    out.push(mat(70, 60, 940, 960));
    const edge = j.pieces.filter(p => isEdge(j, p)), mid = j.pieces.filter(p => !isEdge(j, p));
    const r = rng(name === 'edges-first' ? 7 : 11);
    if (name === 'edges-first') {
      // The frame is done; the middle pieces lie about below it.
      out.push(...edge.map(p => piece(j, p, C.coral, undefined, 0, C.indigo)));
      mid.forEach((p, i) => {
        const col = i % 5, row = Math.floor(i / 5);
        out.push(piece(j, p, C.sky, [220 + col * 160 + (row % 2 ? 40 : 0) + (r() - 0.5) * 24, 690 + row * 115 + (r() - 0.5) * 14], Math.round((r() - 0.5) * 80), C.indigo));
      });
    } else {
      // The middle is done; the border pieces wait in sorted rows, flat side down.
      out.push(...mid.map(p => piece(j, p, C.sky, undefined, 0, C.indigo)));
      const rot = (p: Piece) => (p.row === 0 && p.col === 0 ? -90 : p.row === 0 && p.col === cols - 1 ? 90 : p.row === 0 ? 180 : p.row === rows - 1 ? 0 : p.col === 0 ? -90 : 90);
      const lines = [edge.filter(p => p.row === 0), edge.filter(p => p.row === rows - 1), edge.filter(p => p.row > 0 && p.row < rows - 1)];
      lines.forEach((line, li) => line.forEach((p, i) => out.push(piece(j, p, C.coral, [540 + (i - (line.length - 1) / 2) * 122, 690 + li * 120], rot(p), C.indigo))));
    }
  } else if (name === 'sky') {
    // Four round sorting trays; three hold sky pieces in near-identical blues, the fourth one coral piece. The white
    // tape strips stay blank (code writes "sky", "also sky", "sky?", "not sky" on them later).
    const S = 72;
    const j = generateJigsaw({ cols: 7, rows: 6, width: 7 * S, height: 6 * S, seed: 23, tabSize: 0.22, jitter: 0.03 });
    const inner = j.pieces.filter(p => !isEdge(j, p));
    const r = rng(3);
    const blues = [C.sky, C.skyLight, C.skyDeep];
    let k = 0;
    [[290, 300], [790, 300], [290, 790], [790, 790]].forEach(([cx, cy], t) => {
      out.push(`<circle cx="${cx}" cy="${cy}" r="215" fill="${C.indigo}"/><circle cx="${cx}" cy="${cy}" r="180" fill="#232a3a"/>`);
      if (t < 3) {
        [[-70, -62], [70, -62], [-95, 50], [0, 30], [95, 55], [10, 120]].forEach(([dx, dy], i) =>
          out.push(piece(j, inner[k++ % inner.length], blues[(i + t) % 3], [cx + dx + (r() - 0.5) * 10, cy + dy + (r() - 0.5) * 10], Math.round((r() - 0.5) * 180), '#232a3a')));
      } else out.push(piece(j, inner[k++ % inner.length], C.coral, [cx, cy + 10], -8, '#232a3a'));
      out.push(`<rect x="${cx - 80}" y="${cy - 236}" width="160" height="40" rx="4" fill="${C.white}" transform="rotate(${t % 2 ? 3 : -3} ${cx} ${cy - 216})"/>`);
    });
  } else if (name === 'empty') {
    // "No puzzles logged yet": an empty dashed footprint on the mat and one lonely corner piece.
    const S = 110, cols = 5, rows = 4;
    const j = generateJigsaw({ cols, rows, width: cols * S, height: rows * S, x: (1080 - cols * S) / 2, y: 250, seed: 31, tabSize: 0.22, jitter: 0.03 });
    out.push(mat(120, 170, 840, 760));
    out.push(`<path d="${j.cuts}" fill="none" stroke="${C.sky}" stroke-opacity="0.55" stroke-width="4" stroke-dasharray="10 12" stroke-linecap="round"/>`);
    out.push(`<path d="${j.border}" fill="none" stroke="${C.white}" stroke-width="6" stroke-dasharray="16 14" stroke-linecap="round"/>`);
    out.push(piece(j, j.pieces.find(p => p.row === rows - 1 && p.col === cols - 1)!, C.coral, [800, 810], 14, C.indigo));
  } else if (name === 'badge') {
    // An achievement medal: ribbon straps, an indigo rim, a white face and one big generator piece.
    out.push(`<path d="M380 0H500L585 420H470Z" fill="${C.sky}"/><path d="M580 0H700L610 420H495Z" fill="${C.indigo}"/>`);
    out.push(`<circle cx="540" cy="610" r="270" fill="${C.indigo}"/><circle cx="540" cy="610" r="232" fill="${C.white}"/>`);
    const S = 210;
    const j = generateJigsaw({ cols: 3, rows: 3, width: 3 * S, height: 3 * S, seed: 42, tabSize: 0.22, jitter: 0.02 });
    out.push(piece(j, j.pieces.find(p => p.row === 1 && p.col === 1)!, C.coral, [540, 610], 0, C.white));
  } else if (name === 'levels') {
    // XP and levels: a staircase of interlocking pieces rising to the right, the top step coral, a pennant on top.
    const S = 140, N = 5;
    const j = generateJigsaw({ cols: N, rows: N, width: N * S, height: N * S, x: (1080 - N * S) / 2, y: 260, seed: 52, tabSize: 0.22, jitter: 0.03 });
    const steps = j.pieces.filter(p => p.col >= N - 1 - p.row);
    out.push(...steps.map(p => piece(j, p, p.col === N - 1 && p.row === 0 ? C.coral : p.col % 2 ? C.indigo : C.sky)));
    const [fx] = centre(j, j.pieces.find(p => p.col === N - 1 && p.row === 0)!);
    out.push(`<rect x="${fx - 4}" y="110" width="8" height="160" fill="${C.white}"/><path d="M${fx + 4} 112L${fx + 120} 150L${fx + 4} 188Z" fill="${C.coral}"/>`);
    out.push(`<rect x="0" y="${260 + N * S}" width="1080" height="${1080 - 260 - N * S}" fill="${C.indigo}"/>`);
  }
  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;left:0;top:0">${out.join('')}</svg>`;
}

export async function renderScaffolds(): Promise<string[]> {
  mkdirSync(SCAFFOLD_DIR, { recursive: true });
  const renderer = await createRenderer(SCAFFOLD_DIR);
  const files: string[] = [];
  try {
    for (const name of SCAFFOLDS) {
      const res = await renderer.render({ id: `${name}-master`, html: page(scene(name), { title: `IL1 scaffold ${name}`, css: `body{background:${C.navy}}` }) });
      const m = await sharp(res.png).metadata();
      const side = m.width!; // the square top of the 1440×1800 capture
      const file = join(SCAFFOLD_DIR, `${name}.png`);
      await sharp(res.png).extract({ left: 0, top: 0, width: side, height: side }).resize(GEN.width, GEN.height, { kernel: 'lanczos3' }).removeAlpha().png().toFile(file);
      writeFileSync(join(SCAFFOLD_DIR, `${name}.json`), JSON.stringify({ name, file: `${name}.png`, master: `${name}-master.png`, size: GEN, colours: C }, null, 1) + '\n');
      files.push(file);
    }
  } finally {
    await renderer.close();
  }
  return files;
}

if (import.meta.main) {
  for (const f of await renderScaffolds()) console.log(f.slice(f.indexOf('content/')));
}
