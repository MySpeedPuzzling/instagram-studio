// Story highlight covers in the house style: deep navy, one coral generator piece, a white glyph, sized 1080×1920
// with the art inside Instagram's round crop. Output is local (content/highlights/, gitignored); AirDrop to the phone.
//
//   node tools/highlight-covers.ts quizzes:? start-here:i
//   node tools/highlight-covers.ts recaps:@days         # drawn icons: @bars @days @line @calendar
//   node tools/highlight-covers.ts recaps-in:@bars:indigo  # third part: ground:piece colours (indigo = the post header's
//   indigo #4e54c8 ground with a coral piece; navy-indigo = navy ground, indigo piece; default navy ground, coral piece)
//   --out   a piece with all four tabs outward (seed 13), so the square body holds the icon; centred on the body, not
//           the outline (owner 2026-10-26: icons didn't fit the piece with holes)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { generateJigsaw } from '../src/pieces/jigsaw.ts';
import { ROOT } from '../src/render/server.ts';

/**
 * Drawn icons (glyph "@name"), white on the coral piece, inside a ~300 px box centred on the piece; navy (#222a38)
 * marks the one element that is "this week".
 */
function icon(name: string): string {
  const W = '#ffffff', N = '#222a38', cx = 540, cy = 960;
  const bar = (x: number, w: number, h: number, fill = W) => `<rect x="${x}" y="${cy + 150 - h}" width="${w}" height="${h}" rx="${Math.min(14, w / 2)}" fill="${fill}"/>`;
  switch (name) {
    case 'bars': return [70, 140, 210, 290].map((h, i) => bar(cx - 150 + i * 80, 58, h, i === 3 ? N : W)).join('');
    case 'days': return [150, 120, 130, 125, 140, 300, 220].map((h, i) => bar(cx - 168 + i * 48, 36, h, i === 5 ? N : W)).join('');
    case 'line': return `<polyline points="${cx - 150},${cy + 110} ${cx - 60},${cy + 40} ${cx + 10},${cy + 80} ${cx + 140},${cy - 110}" fill="none" stroke="${W}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${cx + 140}" cy="${cy - 110}" r="40" fill="${N}" stroke="${W}" stroke-width="16"/>`;
    case 'calendar': {
      const x0 = cx - 150, y0 = cy - 130;
      const cells = Array.from({ length: 7 }, (_, i) => `<rect x="${x0 + 26 + (i % 4) * 66}" y="${y0 + 110 + Math.floor(i / 4) * 66}" width="50" height="50" rx="8" fill="${i === 6 ? N : W}"/>`).join('');
      return `<rect x="${x0}" y="${y0}" width="300" height="280" rx="28" fill="none" stroke="${W}" stroke-width="22"/>
        <rect x="${x0}" y="${y0}" width="300" height="76" rx="22" fill="${W}"/>
        <rect x="${x0 + 70}" y="${y0 - 34}" width="22" height="64" rx="11" fill="${W}"/><rect x="${x0 + 208}" y="${y0 - 34}" width="22" height="64" rx="11" fill="${W}"/>${cells}`;
    }
    default: throw new Error(`unknown icon "${name}" (bars, days, line, calendar)`);
  }
}

const OUT = process.argv.includes('--out');
const covers = process.argv.slice(2).filter(a => a !== '--out').map(a => a.split(':') as [string, string, string?]);
const LOOKS: Record<string, { ground: string; piece: string }> = {
  navy: { ground: '#222a38', piece: '#ec726f' }, indigo: { ground: '#4e54c8', piece: '#ec726f' }, 'navy-indigo': { ground: '#222a38', piece: '#4e54c8' },
};
if (!covers.length) { console.error('usage: node tools/highlight-covers.ts <name>:<glyph> …'); process.exit(2); }
const P = 520;
const jig = generateJigsaw({ cols: 3, rows: 3, width: 3 * P, height: 3 * P, seed: OUT ? 13 : 5, tabSize: 0.24, jitter: 0.02 });
const q = jig.pieces.find(p => p.col === 1 && p.row === 1)!; // the middle piece: knobs or holes on every side
// Centre: the outline's box by default; with --out the square body (the grid cell), where the icon sits.
const cx = OUT ? 1.5 * P : q.bbox.x + q.bbox.width / 2, cy = OUT ? 1.5 * P : q.bbox.y + q.bbox.height / 2;
const S = OUT ? 0.8 : 0.9;
const out = join(ROOT, 'content/highlights');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, glyph, lookKey = 'navy'] of covers) {
  const look = LOOKS[lookKey];
  if (!look) throw new Error(`unknown look "${lookKey}" (${Object.keys(LOOKS).join(', ')})`);
  const svg = `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="${look.ground}"/>
    <g transform="translate(${540 - cx * S} ${960 - cy * S}) scale(${S})"><path d="${q.d}" fill="${look.piece}"/></g>
    ${glyph.startsWith('@') ? `<g transform="translate(540 960) scale(0.78) translate(-540 -960)">${icon(glyph.slice(1))}</g>` : `<text x="540" y="1080" text-anchor="middle" font-family="Rubik, Inter, system-ui, sans-serif" font-weight="800" font-size="340" fill="#ffffff">${glyph}</text>`}</svg>`;
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  const file = join(out, `highlight-${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  console.log(file);
}
await browser.close();
