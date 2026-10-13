// Puzzle box images from MSP's public image proxy, cached locally (content/cache/boxes, gitignored).
// Owner decision 2026-10-13: box images may be used with the brand credited; remove if a brand objects.
// Queries must already exclude embargoed images (hide_image_until) and hidden puzzles.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

const PROXY = 'https://img.myspeedpuzzling.com';
/** MSP imgproxy presets: puzzle_small 200 px, puzzle_medium 400 px, puzzle_large 1200 px JPEG. */
export type BoxPreset = 'puzzle_small' | 'puzzle_medium' | 'puzzle_large';

const localName = (image: string) => image.replace(/^\/+/, '').replace(/[^\w.-]+/g, '_').replace(/\.(png|jpe?g|webp)$/i, '') + '.jpg';

/** Local file path and the URL the render server serves it at. */
export function boxPaths(image: string, preset: BoxPreset = 'puzzle_large') {
  const rel = `content/cache/boxes/${preset}/${localName(image)}`;
  return { file: join(ROOT, rel), url: `/${rel}` };
}

/** Downloads missing images (4 at a time, polite user agent); returns the local URL per image path. */
export async function fetchBoxes(images: string[], preset: BoxPreset = 'puzzle_large', concurrency = 4): Promise<Map<string, string>> {
  mkdirSync(join(ROOT, 'content/cache/boxes', preset), { recursive: true });
  const out = new Map<string, string>();
  const queue = [...new Set(images.filter(Boolean))];
  let failed = 0;
  async function worker() {
    for (let img = queue.shift(); img; img = queue.shift()) {
      const { file, url } = boxPaths(img, preset);
      if (!existsSync(file)) {
        // puzzle_large returns JPEG; the smaller presets keep the source format, so convert on the way in.
        const res = await fetch(`${PROXY}/preset:${preset}/plain/${img.replace(/^\/+/, '')}`, { headers: { 'user-agent': 'msp-instagram (myspeedpuzzling.com)' } });
        if (!res.ok) { failed++; continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        if (preset === 'puzzle_large') writeFileSync(file, buf);
        else {
          const sharp = (await import('sharp')).default;
          await sharp(buf).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toFile(file);
        }
      }
      out.set(img, url);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (failed) console.warn(`box images: ${failed} could not be fetched`);
  return out;
}

if (import.meta.main) {
  // node src/data/boxes.ts <query-name> [preset]  — prefetch every image of a cached query
  const { query } = await import('./db.ts');
  const [name, preset = 'puzzle_large'] = process.argv.slice(2);
  const rows = query(name).rows;
  const t0 = performance.now();
  const map = await fetchBoxes(rows.map(r => r.image), preset as BoxPreset);
  console.log(`${map.size}/${rows.length} images ready (${preset}) in ${Math.round(performance.now() - t0)} ms`);
}
