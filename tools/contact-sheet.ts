// Contact sheet: tiles rendered slides into one JPEG so a whole set can be checked at a glance.
//
//   node tools/contact-sheet.ts out.jpg [--cols 6] [--width 300] [--labels] file1.jpg file2.jpg …
//   node tools/contact-sheet.ts out.jpg --cols 8 content/labs/DL4/H1/**/*.ig.jpg
//
// Tiles keep their aspect ratio (feed 4:5 and story 9:16 mix fine); --labels prints each file's last two path
// segments under its tile.
import { parseArgs } from 'node:util';
import sharp, { type OverlayOptions } from 'sharp';

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: { cols: { type: 'string', default: '6' }, width: { type: 'string', default: '300' }, labels: { type: 'boolean' } },
});
const [out, ...files] = positionals;
if (!out || !files.length) { console.error('usage: node tools/contact-sheet.ts out.jpg [--cols 6] [--width 300] [--labels] files…'); process.exit(1); }

export async function contactSheet(outFile: string, inputs: string[], cols = 6, tw = 300, labels = false) {
  const GAP = 8, LABEL = labels ? 22 : 0;
  const tiles = await Promise.all(inputs.map(async f => {
    const buf = await sharp(f).resize({ width: tw }).png().toBuffer();
    return { buf, h: (await sharp(buf).metadata()).height!, name: f.split('/').slice(-2).join('/') };
  }));
  const rows = Math.ceil(tiles.length / cols);
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(...tiles.slice(r * cols, r * cols + cols).map(t => t.h)) + LABEL);
  const top = (r: number) => GAP + rowH.slice(0, r).reduce((a, b) => a + b + GAP, 0);
  const W = cols * (tw + GAP) + GAP, H = top(rows);
  const comps: OverlayOptions[] = tiles.map((t, i) => ({ input: t.buf, left: GAP + (i % cols) * (tw + GAP), top: top(Math.floor(i / cols)) }));
  if (labels) tiles.forEach((t, i) => {
    const esc = t.name.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
    comps.push({ input: Buffer.from(`<svg width="${tw}" height="${LABEL}"><text x="2" y="16" font-family="Helvetica" font-size="14" fill="#fff">${esc}</text></svg>`),
      left: GAP + (i % cols) * (tw + GAP), top: top(Math.floor(i / cols)) + t.h + 2 });
  });
  await sharp({ create: { width: W, height: H, channels: 3, background: '#6b7080' } }).composite(comps).jpeg({ quality: 82 }).toFile(outFile);
  return { width: W, height: H, tiles: tiles.length };
}

if (import.meta.main) {
  const r = await contactSheet(out, files, Number(o.cols), Number(o.width), o.labels);
  console.log(`${out}: ${r.tiles} tiles, ${r.width}×${r.height}`);
}
