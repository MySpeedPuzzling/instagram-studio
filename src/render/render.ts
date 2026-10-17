// Render harness: HTML document → PNG (Playwright/Chromium) → upload JPEG + Instagram-simulated preview.
//
// Designs are authored on a 1080-wide CSS canvas (feed 1080×1350, story 1080×1920) and captured at
// 4/3 device scale, so uploads are 1440 px wide: the largest width the API accepts and the size
// Instagram keeps as its master (measured from served media, 2026-10-13).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium, type Browser } from 'playwright';
import sharp from 'sharp';
import { qaInPage, type QaReport } from './qa.ts';
import { ROOT, startServer } from './server.ts';

export const FRAMES = {
  feed: { width: 1080, height: 1350, safe: { x0: 88, y0: 64, x1: 992, y1: 1286 } },
  story: { width: 1080, height: 1920, safe: { x0: 65, y0: 190, x1: 1015, y1: 1720 } }, // story_dimensions_2026.md
  reel: { width: 1080, height: 1920, safe: { x0: 60, y0: 220, x1: 960, y1: 1250 } },
} as const;
export type FrameKind = keyof typeof FRAMES;

export interface RenderJob {
  /** Output basename, e.g. "D1/wall-1". */
  id: string;
  /** Complete HTML document. */
  html: string;
  frame?: FrameKind;
  /** Override the frame's safe area (e.g. full-bleed covers). */
  safe?: { x0: number; y0: number; x1: number; y1: number };
}

export interface RenderResult {
  id: string;
  png: string;
  jpg: string;
  preview: string;
  qa: QaReport;
  ms: number;
}

export const OUTPUT_SCALE = 4 / 3;

export async function createRenderer(outDir: string) {
  const server = await startServer();
  const browser: Browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: OUTPUT_SCALE, colorScheme: 'light', reducedMotion: 'reduce' });
  mkdirSync(join(ROOT, 'var/render'), { recursive: true });

  async function render(job: RenderJob): Promise<RenderResult> {
    const t0 = performance.now();
    const frame = FRAMES[job.frame ?? 'feed'];
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: frame.width, height: frame.height });
      const pageFile = join(ROOT, 'var/render', job.id.replace(/[^\w.-]+/g, '_') + '.html');
      writeFileSync(pageFile, job.html);
      await page.goto(`${server.url}/${relative(ROOT, pageFile)}`, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        // Charts that draw asynchronously set window.__ready = true when done.
        const w = window as unknown as { __ready?: boolean; __async?: boolean };
        if (w.__async) for (let i = 0; i < 200 && !w.__ready; i++) await new Promise(r => setTimeout(r, 25));
      });
      const qa = await page.evaluate(qaInPage, { safe: job.safe ?? frame.safe, minFontPx: 30, fontFamily: 'Rubik' });

      const base = join(outDir, job.id);
      mkdirSync(join(base, '..'), { recursive: true });
      const png = `${base}.png`;
      await page.screenshot({ path: png, type: 'png', animations: 'disabled' });
      const jpg = `${base}.jpg`;
      await sharp(png).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).withIccProfile('srgb').toFile(jpg);
      // What followers will see: Instagram re-encodes to ~q94 4:2:0 and drops the ICC profile.
      const preview = `${base}.ig.jpg`;
      await sharp(jpg).jpeg({ quality: 94, chromaSubsampling: '4:2:0' }).toFile(preview);
      return { id: job.id, png, jpg, preview, qa, ms: Math.round(performance.now() - t0) };
    } finally {
      await page.close();
    }
  }

  async function close() {
    await context.close();
    await browser.close();
    await server.close();
  }

  return { render, close, serverUrl: server.url };
}
