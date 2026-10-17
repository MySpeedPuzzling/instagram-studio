// AD1 runner: renders the Advent of Puzzle lab (doors × variants, reveals, campaign posts, device sheets, the 300M
// guess, the Close Friends test Story) into content/labs/AD1/, writes manifest.json and rebuilds the gallery.
//
//   node lab/advent/run.ts                    # everything
//   node lab/advent/run.ts --only doors-V2    # posts whose key starts with this
//   node lab/advent/run.ts --gallery          # gallery only
//
// Every run is metered into content/labs/AD1/runs.jsonl (wall time, peak memory, swap, per-item time).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { HOUSE, HOUSE_CSS, activateVariant } from '../../src/design/house.ts';
import { page } from '../../src/design/page.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { loadContent } from './content.ts';
import { allPosts, type LabPost } from './posts.ts';

export const LAB_DIR = join(ROOT, 'content/labs/AD1');
const TEST_DIR = join(ROOT, 'content/labs/STORY-TEST');
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

export interface ManifestSlide { id: string; jpg: string; preview: string; frame: string; errors: string[]; warnings: string[]; ms: number }
export interface ManifestPost { key: string; section: string; label: string; note?: string; caption?: string; slides: ManifestSlide[] }

if (import.meta.main) {
  const { values: o } = parseArgs({ options: { only: { type: 'string' }, gallery: { type: 'boolean' } } });
  const manifestFile = join(LAB_DIR, 'manifest.json');
  const prev: ManifestPost[] = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')).posts : [];
  if (!o.gallery) {
    activateVariant(HOUSE);
    const content = loadContent();
    const posts: LabPost[] = allPosts(content).filter(p => !o.only || p.key.startsWith(o.only));
    activateVariant(undefined);
    mkdirSync(LAB_DIR, { recursive: true });
    const renderer = await createRenderer(LAB_DIR);
    const testRenderer = await createRenderer(TEST_DIR);
    const n = posts.reduce((s, p) => s + p.slides.length, 0);
    let errors = 0;
    const done: ManifestPost[] = [];
    try {
      await metered(join(LAB_DIR, 'runs.jsonl'), { lab: 'AD1', run_id: `AD1-${o.only ?? 'all'}`, posts: posts.length, slides: n, engine: 'playwright-1.64/chromium-156' }, async () => {
        for (const p of posts) {
          const slides: ManifestSlide[] = [];
          const r = p.testStory ? testRenderer : renderer;
          for (const s of p.slides) {
            const res = await r.render({ id: p.testStory ? s.id : `${p.key}/${s.id}`, html: page(s.body, { frame: s.frame, css: HOUSE_CSS, title: `AD1 ${p.key} ${s.id}` }), frame: s.frame, safe: s.safe });
            slides.push({ id: s.id, jpg: rel(res.jpg), preview: rel(res.preview), frame: s.frame ?? 'feed', errors: res.qa.errors, warnings: res.qa.warnings, ms: res.ms });
            errors += res.qa.errors.length;
            for (const e of res.qa.errors) console.log(`  ERROR ${p.key}/${s.id}: ${e}`);
          }
          done.push({ key: p.key, section: p.section, label: p.label, note: p.note, caption: p.caption, slides });
        }
      });
    } finally {
      await renderer.close();
      await testRenderer.close();
    }
    const keys = new Set(done.map(p => p.key));
    const order = allPostKeys();
    const merged = [...prev.filter(p => !keys.has(p.key) && order.includes(p.key)), ...done].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    writeFileSync(manifestFile, JSON.stringify({ renderedAt: new Date().toISOString(), posts: merged }, null, 1) + '\n');
    console.log(`AD1: ${n} slides, ${errors} QA errors`);
    if (errors) process.exitCode = 1;
  }
  const { buildGallery } = await import('./gallery.ts');
  buildGallery();
  console.log('gallery: content/labs/AD1/index.html (node tools/review.ts → /content/labs/AD1/)');
}

function allPostKeys(): string[] {
  activateVariant(HOUSE);
  const keys = allPosts(loadContent()).map(p => p.key);
  activateVariant(undefined);
  return keys;
}
