// E4 inputs: flat grey scaffolds with the box slots at their final pixel positions, rendered with the normal
// Playwright harness (1440×1800, the post's master size) and reduced to the 1024×1280 generation size.
//
// Every edge sits on a 45 px grid in the 1440 master, which is a 32 px grid at 1024 and 33.75 CSS px in the
// 1080-wide design canvas, so the slots are exact integers in both pixel spaces and nearest-neighbour reduction
// keeps them pixel-exact. Code later drops the real (credited) box images into the same rectangles.
//
//   node lab/ai1/scaffolds.ts        # writes content/labs/AI1/scaffolds/{shelf,room}.{png,json} (+ the 1440 master)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { page } from '../../src/design/page.ts';
import { createRenderer } from '../../src/render/render.ts';
import { OUT_DIR } from './batch.ts';

export const SCAFFOLD_DIR = join(OUT_DIR, 'scaffolds');
const U = { master: 45, gen: 32 };
export const GEN = { width: 1024, height: 1280 };

interface Block { id: string; kind: 'wall' | 'floor' | 'board' | 'back' | 'box' | 'label' | 'type'; x: number; y: number; w: number; h: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Scaffold { name: string; use: string; colours: Record<string, string>; slots: Array<{ id: string; kind: 'box' | 'label'; master: Rect; gen: Rect }>; typeZone: { master: Rect; gen: Rect }; file: string; master: string }

const COLOURS: Record<string, Record<string, string>> = {
  // Shelf: dark wall, light boards, mid back panel, very dark slots (the prompt keeps them "plain dark empty spaces").
  shelf: { wall: '#555a64', floor: '#43474f', board: '#9aa0aa', back: '#6b717c', box: '#2c2f35', label: '#2c2f35' },
  // Room: light wall, mid floor, one dark frame slot and a dark plaque slot.
  room: { wall: '#c5c8ce', floor: '#8f939b', board: '#8f939b', back: '#c5c8ce', box: '#33363c', label: '#33363c' },
};

/** Layouts on a 32 × 40 unit grid (1 unit = 45 px of the 1440×1800 master). Later blocks paint over earlier ones. */
function layout(name: 'shelf' | 'room'): Block[] {
  if (name === 'shelf') {
    const b: Block[] = [
      { id: 'wall', kind: 'wall', x: 0, y: 0, w: 32, h: 40 },
      { id: 'floor', kind: 'floor', x: 0, y: 38, w: 32, h: 2 },
      { id: 'cabinet', kind: 'board', x: 4, y: 9, w: 24, h: 29 },     // sides, top board and plinth
      { id: 'back-1', kind: 'back', x: 5, y: 10, w: 22, h: 8 },
      { id: 'back-2', kind: 'back', x: 5, y: 19, w: 22, h: 8 },
      { id: 'back-3', kind: 'back', x: 5, y: 28, w: 22, h: 8 },
    ];
    // Two upright boxes per compartment, 9 × 6 units, standing on the board below.
    [[12, 18], [21, 27], [30, 36]].forEach(([y0], row) => {
      b.push({ id: `box-${row * 2 + 1}`, kind: 'box', x: 6, y: y0, w: 9, h: 6 });
      b.push({ id: `box-${row * 2 + 2}`, kind: 'box', x: 17, y: y0, w: 9, h: 6 });
    });
    b.push({ id: 'type', kind: 'type', x: 2, y: 1, w: 28, h: 7 });
    return b;
  }
  return [
    { id: 'wall', kind: 'wall', x: 0, y: 0, w: 32, h: 40 },
    { id: 'floor', kind: 'floor', x: 0, y: 33, w: 32, h: 7 },
    { id: 'box-1', kind: 'box', x: 7, y: 11, w: 18, h: 13 },     // one framed box per room (A3), ≈ 1.38:1
    { id: 'label-1', kind: 'label', x: 19, y: 26, w: 6, h: 3 },  // the museum label code sets in Rubik
    { id: 'type', kind: 'type', x: 3, y: 2, w: 26, h: 7 },
  ];
}

const scale = (b: { x: number; y: number; w: number; h: number }, u: number): Rect => ({ x: b.x * u, y: b.y * u, w: b.w * u, h: b.h * u });

export async function renderScaffolds(): Promise<Scaffold[]> {
  mkdirSync(SCAFFOLD_DIR, { recursive: true });
  const renderer = await createRenderer(SCAFFOLD_DIR);
  const out: Scaffold[] = [];
  try {
    for (const name of ['shelf', 'room'] as const) {
      const c = COLOURS[name];
      const blocks = layout(name);
      // An SVG in master pixels (viewBox 1440×1800 on the 1080×1350 canvas): CSS boxes at 202.5 px get antialiased,
      // crispEdges rects on integer device pixels don't.
      const body = `<svg width="1080" height="1350" viewBox="0 0 1440 1800" shape-rendering="crispEdges" style="position:absolute;inset:0">${blocks.filter(b => b.kind !== 'type').map(b => {
        const r = scale(b, U.master);
        return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${c[b.kind]}"/>`;
      }).join('')}</svg>`;
      const res = await renderer.render({ id: `${name}-master`, html: page(body, { title: `AI1 scaffold ${name}` }) });
      // Nearest-neighbour is exact here: every edge lies on both grids. Then snap to the flat palette as a safety net.
      const { data, info } = await sharp(res.png).removeAlpha().resize(GEN.width, GEN.height, { kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true });
      const pal = [...new Set(Object.values(c))].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
      for (let i = 0; i < data.length; i += 3) {
        let best = pal[0], bd = Infinity;
        for (const p of pal) { const d = (p[0] - data[i]) ** 2 + (p[1] - data[i + 1]) ** 2 + (p[2] - data[i + 2]) ** 2; if (d < bd) { bd = d; best = p; } }
        data[i] = best[0]; data[i + 1] = best[1]; data[i + 2] = best[2];
      }
      const file = join(SCAFFOLD_DIR, `${name}.png`);
      await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toFile(file);
      const type = blocks.find(b => b.kind === 'type')!;
      const s: Scaffold = {
        name, use: name === 'shelf' ? 'G1 Shelf of fear' : 'A3 Museum of Most-Solved', colours: c, file, master: res.png,
        slots: blocks.filter(b => b.kind === 'box' || b.kind === 'label').map(b => ({ id: b.id, kind: b.kind as 'box' | 'label', master: scale(b, U.master), gen: scale(b, U.gen) })),
        typeZone: { master: scale(type, U.master), gen: scale(type, U.gen) },
      };
      writeFileSync(join(SCAFFOLD_DIR, `${name}.json`), JSON.stringify({ ...s, file: `${name}.png`, master: `${name}-master.png` }, null, 1) + '\n');
      out.push(s);
    }
  } finally {
    await renderer.close();
  }
  return out;
}

if (import.meta.main) {
  for (const s of await renderScaffolds()) console.log(`${s.name}: ${s.slots.length} slots → ${s.file}`);
}
