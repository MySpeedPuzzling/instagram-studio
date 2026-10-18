// Story highlight covers in the house style: deep navy, one coral generator piece, a white glyph, sized 1080×1920
// with the art inside Instagram's round crop. Output is local (content/highlights/, gitignored); AirDrop to the phone.
//
//   node tools/highlight-covers.ts quizzes:? start-here:i
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { generateJigsaw } from '../src/pieces/jigsaw.ts';
import { ROOT } from '../src/render/server.ts';

const covers = process.argv.slice(2).map(a => a.split(':') as [string, string]);
if (!covers.length) { console.error('usage: node tools/highlight-covers.ts <name>:<glyph> …'); process.exit(2); }
const P = 520;
const jig = generateJigsaw({ cols: 3, rows: 3, width: 3 * P, height: 3 * P, seed: 5, tabSize: 0.24, jitter: 0.02 });
const q = jig.pieces.find(p => p.col === 1 && p.row === 1)!; // the middle piece: knobs or holes on every side
const cx = q.bbox.x + q.bbox.width / 2, cy = q.bbox.y + q.bbox.height / 2;
const out = join(ROOT, 'content/highlights');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, glyph] of covers) {
  const svg = `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="#222a38"/>
    <g transform="translate(${540 - cx * 0.9} ${960 - cy * 0.9}) scale(0.9)"><path d="${q.d}" fill="#ec726f"/></g>
    <text x="540" y="1080" text-anchor="middle" font-family="Rubik, Inter, system-ui, sans-serif" font-weight="800" font-size="340" fill="#ffffff">${glyph}</text></svg>`;
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  const file = join(out, `highlight-${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  console.log(file);
}
await browser.close();
