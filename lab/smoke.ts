// Smoke test of the render stack: one slide with a hero number and generator pieces.
//   node lab/smoke.ts
import { join } from 'node:path';
import { generateJigsaw } from '../src/pieces/jigsaw.ts';
import { page } from '../src/design/page.ts';
import { createRenderer } from '../src/render/render.ts';
import { metered } from '../src/render/meter.ts';
import { ROOT } from '../src/render/server.ts';

const jig = generateJigsaw({ cols: 4, rows: 3, width: 720, height: 540, x: 180, y: 640, seed: 2026 });
const pieces = jig.pieces.map((p, i) =>
  `<path d="${p.d}" fill="${i === 5 ? 'var(--coral-500)' : 'var(--paper-cool)'}" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>`,
).join('');

const html = page(`
<main style="padding: 120px 88px">
  <p style="font-size: 44px; font-weight: 500; color: var(--ink-soft)">Pieces placed on MSP</p>
  <p style="font-size: 200px; font-weight: 700; line-height: 1; letter-spacing: -4px">275,231,094</p>
  <svg width="1080" height="1350" style="position: absolute; inset: 0">${pieces}</svg>
  <p style="position: absolute; left: 88px; bottom: 80px; font-size: 30px; color: var(--ink-muted)">Source: myspeedpuzzling.com, 13 Oct 2026</p>
</main>`);

const r = await createRenderer(join(ROOT, 'content/labs/smoke'));
try {
  const res = await metered(join(ROOT, 'content/runs.jsonl'), { lab: 'smoke', run_id: 'smoke-1', engine: 'playwright-1.64/chromium-156' }, () => r.render({ id: 'smoke', html }));
  console.log(JSON.stringify({ ...res, qa: res.qa }, null, 1));
} finally {
  await r.close();
}
