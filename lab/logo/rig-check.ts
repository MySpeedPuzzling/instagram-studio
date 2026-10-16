// LM1 · proves the rigged logo looks exactly like the brand mark: renders the source and the rig at 1024 px wide and
// compares them pixel by pixel (RGBA, transparent background), in Chromium (what the Reels use) both as <img> and
// inlined into the page the way the compositions inline it, and in librsvg (sharp) as a second renderer. Same for the
// outline variant against assets/brand/speedpuzzling-logo-outline.svg.
//
//   node lab/logo/rig-check.ts            # prints the diff table; exit 1 if the mark or the halo differs in Chromium
//   node lab/logo/rig-check.ts --out=DIR  # also writes the renders and diff masks as PNGs into DIR
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { OUTLINED_LOGO } from '../../src/design/build-logo.ts';
import { buildRig, RIG_FILE, RIG_OUTLINE_FILE } from '../../src/design/logo-rig.ts';
import { ROOT, startServer } from '../../src/render/server.ts';

const WIDTH = 1024;
const SRC = join(ROOT, 'assets/brand/speedpuzzling-logo.svg');
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

export interface Diff { pixels: number; differing: number; maxDelta: number; meanDelta: number }

export function diffRgba(a: Buffer, b: Buffer): Diff {
  if (a.length !== b.length) throw new Error(`size mismatch ${a.length} vs ${b.length}`);
  let differing = 0, maxDelta = 0, sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    let m = 0;
    for (let c = 0; c < 4; c++) m = Math.max(m, Math.abs(a[i + c] - b[i + c]));
    if (m) { differing++; sum += m; }
    maxDelta = Math.max(maxDelta, m);
  }
  return { pixels: a.length / 4, differing, maxDelta, meanDelta: differing ? +(sum / differing).toFixed(2) : 0 };
}

const raw = async (png: Buffer) => (await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));

if (import.meta.main) {
  const { values: o } = parseArgs({ options: { out: { type: 'string' } } });
  if (o.out) mkdirSync(o.out, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const rows: string[] = [];
  let failed = false;
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH + 40, height: 1100 }, deviceScaleFactor: 1 });
    const shot = async (body: string) => {
      await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent} #s{width:${WIDTH}px} #s svg{display:block;width:${WIDTH}px;height:auto} img{display:block;width:${WIDTH}px}</style><div id="s">${body}</div>`);
      await page.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode().catch(() => undefined))); });
      return page.locator('#s').screenshot({ omitBackground: true, type: 'png' });
    };
    const pairs: Array<[string, string, string, boolean]> = [
      ['mark: Chromium <img>', `<img src="${server.url}${rel(SRC)}">`, `<img src="${server.url}${rel(RIG_FILE)}">`, true],
      ['mark: Chromium inline <svg>', readFileSync(SRC, 'utf8').replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/g, ''), buildRig({ inline: true }), false],
      ['outline: Chromium <img>, all', `<img src="${server.url}${rel(OUTLINED_LOGO)}">`, `<img src="${server.url}${rel(RIG_OUTLINE_FILE)}">`, false],
    ];
    // The outline variant draws the halo under an unfiltered mark, while speedpuzzling-logo-outline.svg puts the whole
    // mark through the filter (Chromium re-rasterises it there: edges and gradient dithering shift). So the outline
    // pair is split: halo pixels (where the bare mark is transparent) against the outline file, mark pixels (where the
    // bare mark is opaque) against the bare mark itself.
    {
      const bare = buildRig({ outline: true }).replace(/<use id="halo"[^>]*\/>/, '');
      const pad = (await raw(await shot(`<img src="data:image/svg+xml;base64,${Buffer.from(bare).toString('base64')}">`))).data;
      const ref = (await raw(await shot(`<img src="${server.url}${rel(OUTLINED_LOGO)}">`))).data;
      const mine = (await raw(await shot(`<img src="${server.url}${rel(RIG_OUTLINE_FILE)}">`))).data;
      const pick = (buf: Buffer, keep: (alpha: number, px: number) => boolean) => {
        const out = Buffer.from(buf);
        for (let i = 0; i < out.length; i += 4) if (!keep(pad[i + 3], i / 4)) out.fill(0, i, i + 4);
        return out;
      };
      // "Clear" halo pixels: the bare mark is transparent in the whole 5×5 neighbourhood (≥ 2 px from its edge).
      const clear = (px: number) => {
        const x = px % WIDTH, y = Math.floor(px / WIDTH);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const q = ((y + dy) * WIDTH + x + dx) * 4 + 3;
          if (q >= 0 && q < pad.length && pad[q]) return false;
        }
        return true;
      };
      const haloAll = diffRgba(pick(ref, a => a === 0), pick(mine, a => a === 0));
      const halo = diffRgba(pick(ref, (a, px) => a === 0 && clear(px)), pick(mine, (a, px) => a === 0 && clear(px)));
      const mark = diffRgba(pick(pad, a => a === 255), pick(mine, a => a === 255));
      if (halo.differing || mark.differing) failed = true;
      rows.push(`${'outline: halo vs outline file'.padEnd(30)} differing ${halo.differing} px ≥ 2 px from the mark (max Δ ${halo.maxDelta}); ${haloAll.differing} px incl. the mark's edge (max Δ ${haloAll.maxDelta}: the outline file's filtered mark edge)`);
      rows.push(`${'outline: mark vs bare mark'.padEnd(30)} differing ${mark.differing} px  max Δ ${mark.maxDelta}`);
    }
    for (const [name, a, b, gate] of pairs) {
      const [pa, pb] = [await shot(a), await shot(b)];
      const [ra, rb] = [await raw(pa), await raw(pb)];
      const d = diffRgba(ra.data, rb.data);
      if (gate && d.differing) failed = true;
      rows.push(`${name.padEnd(30)} ${ra.info.width}×${ra.info.height}  differing ${d.differing}/${d.pixels} px  max Δ ${d.maxDelta}  mean Δ ${d.meanDelta}`);
      if (o.out) {
        const slug = name.replace(/\W+/g, '-').toLowerCase();
        await sharp(pa).toFile(join(o.out, `${slug}-a.png`));
        await sharp(pb).toFile(join(o.out, `${slug}-b.png`));
      }
    }
    // librsvg (sharp) as a second renderer: same 1024 px width.
    for (const [name, a, b] of [['mark: librsvg', SRC, RIG_FILE], ['outline: librsvg', OUTLINED_LOGO, RIG_OUTLINE_FILE]] as const) {
      const r = async (f: string) => raw(await sharp(f, { density: 600 }).resize(WIDTH).png().toBuffer());
      const [ra, rb] = [await r(a), await r(b)];
      const d = diffRgba(ra.data, rb.data);
      rows.push(`${name.padEnd(30)} ${ra.info.width}×${ra.info.height}  differing ${d.differing}/${d.pixels} px  max Δ ${d.maxDelta}  mean Δ ${d.meanDelta}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(rows.join('\n'));
  if (failed) process.exitCode = 1;
}
