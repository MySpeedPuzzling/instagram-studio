// Lab SH2: first and last frame for a generated time-lapse of the pile-of-shame shelf (WAN first/last-frame video):
// the six boxes of the Reel baked into the clean plate (first) and, dusty, into the old plate (last).
//   node lab/pile-of-shame/reel-frames.ts <draft-id> <first-plate.png> <last-plate.png> <out-prefix>
import { join } from 'node:path';
import sharp from 'sharp';
import { ROOT } from '../../src/render/server.ts';
import { PLATE, reelShelfSpec } from '../../src/posts/reel-shelf.ts';

const [draft, first, last, out] = process.argv.slice(2);
if (!draft || !first || !last || !out) { console.error('usage: reel-frames.ts <draft-id> <first.png> <last.png> <out-prefix>'); process.exit(2); }
const { spec } = await reelShelfSpec({ fresh: false, draft });

async function bake(plate: string, dusty: boolean, file: string) {
  const comps: sharp.OverlayOptions[] = [];
  for (const b of spec.boxes) {
    const w = Math.round(b.slot.w), h = Math.round(b.slot.h), x = Math.round(b.slot.x), y = Math.round(b.slot.y);
    let img = sharp(join(ROOT, b.p.img.slice(1))).resize(w, h, { fit: 'cover' });
    if (dusty) img = img.modulate({ brightness: 0.84, saturation: 0.66 });
    const shadow = Buffer.from(`<svg width="${w + 40}" height="${h + 40}"><defs><filter id="b"><feGaussianBlur stdDeviation="8"/></filter></defs><rect x="20" y="26" width="${w}" height="${h}" fill="rgba(10,14,22,0.55)" filter="url(#b)"/></svg>`);
    comps.push({ input: shadow, left: x - 20, top: y - 20 });
    comps.push({ input: await img.toBuffer(), left: x, top: y });
    if (dusty) comps.push({ input: Buffer.from(`<svg width="${w}" height="${h}"><defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(200,194,182)" stop-opacity="0.66"/><stop offset="0.2" stop-color="rgb(200,194,182)" stop-opacity="0.24"/><stop offset="0.6" stop-color="rgb(120,110,95)" stop-opacity="0.16"/><stop offset="1" stop-color="rgb(40,32,24)" stop-opacity="0.34"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#d)"/></svg>`), left: x, top: y });
  }
  await sharp(plate).resize(PLATE.w, PLATE.h).composite(comps).png().toFile(file);
  console.log(file);
}
await bake(first, false, `${out}-first.png`);
await bake(last, true, `${out}-last.png`);
