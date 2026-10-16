// Screenshot of a page served by the local render server (galleries, lab pages), for checking layouts by eye.
//
//   node tools/page-shot.ts /content/labs/DL4/index.html out.png [width=1500] [height=1700] [scrollY=0]
import { chromium } from 'playwright';
import { startServer } from '../src/render/server.ts';

const [url, out, w = '1500', h = '1700', y = '0'] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node tools/page-shot.ts <path> <out.png> [width] [height] [scrollY]'); process.exit(1); }
const server = await startServer();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
  await page.goto(server.url + url, { waitUntil: 'networkidle' });
  await page.evaluate(top => window.scrollTo(0, top), Number(y));
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  console.log(out);
} finally {
  await browser.close();
  await server.close();
}
