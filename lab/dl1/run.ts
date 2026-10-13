// DL1 runner: renders every direction in lab/dl1/directions/ (or the ids given) and writes a manifest
// plus the review gallery. Each direction's run is metered into content/labs/DL1/runs.jsonl.
//
//   node lab/dl1/run.ts            # all directions
//   node lab/dl1/run.ts D1 D3      # only these
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { page } from '../../src/design/page.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer, type RenderResult } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { loadContent } from './content.ts';
import { buildGallery } from './gallery.ts';
import type { Direction } from './types.ts';

export const LAB_DIR = join(ROOT, 'content/labs/DL1');

export interface ManifestSlide { id: string; jpg: string; preview: string; frame: string; errors: string[]; warnings: string[]; ms: number }
export interface ManifestDirection { id: string; name: string; idea: string; renderedAt: string; posts: Array<{ key: string; slides: ManifestSlide[] }> }
export type Manifest = Record<string, ManifestDirection>;

async function loadDirections(only: string[]): Promise<Direction[]> {
  const dir = join(ROOT, 'lab/dl1/directions');
  const files = readdirSync(dir).filter(f => /^d\d+.*\.ts$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  const out: Direction[] = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    const d: Direction = mod.default;
    if (!only.length || only.includes(d.id)) out.push(d);
  }
  return out;
}

const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

/** All rendered directions, merged from their per-direction manifests. */
export function readManifest(): Manifest {
  const out: Manifest = {};
  if (!existsSync(LAB_DIR)) return out;
  for (const id of readdirSync(LAB_DIR)) {
    const f = join(LAB_DIR, id, 'manifest.json');
    if (/^D\d+$/.test(id) && existsSync(f)) out[id] = JSON.parse(readFileSync(f, 'utf8'));
  }
  return out;
}

if (import.meta.main) {
  const only = process.argv.slice(2);
  const content = loadContent();
  const directions = await loadDirections(only);
  mkdirSync(LAB_DIR, { recursive: true });
  const renderer = await createRenderer(LAB_DIR);
  let errors = 0;
  try {
    for (const d of directions) {
      const posts = d.posts(content);
      const slideCount = posts.reduce((s, p) => s + p.slides.length, 0);
      const results = await metered(join(LAB_DIR, 'runs.jsonl'), { lab: 'DL1', run_id: `DL1-${d.id}`, direction: d.id, slides: slideCount, engine: 'playwright-1.64/chromium-156' }, async () => {
        const out: Array<{ key: string; slides: ManifestSlide[] }> = [];
        for (const post of posts) {
          const slides: ManifestSlide[] = [];
          for (const s of post.slides) {
            const res: RenderResult = await renderer.render({ id: `${d.id}/${post.key}/${s.id}`, html: page(s.body, { frame: s.frame, css: d.css, title: `${d.id} ${s.id}` }), frame: s.frame, safe: s.safe });
            slides.push({ id: s.id, jpg: rel(res.jpg), preview: rel(res.preview), frame: s.frame ?? 'feed', errors: res.qa.errors, warnings: res.qa.warnings, ms: res.ms });
          }
          out.push({ key: post.key, slides });
        }
        return out;
      });
      // One manifest per direction, so directions can be rendered in parallel without clobbering each other.
      const entry: ManifestDirection = { id: d.id, name: d.name, idea: d.idea, renderedAt: new Date().toISOString(), posts: results };
      mkdirSync(join(LAB_DIR, d.id), { recursive: true });
      writeFileSync(join(LAB_DIR, d.id, 'manifest.json'), JSON.stringify(entry, null, 1) + '\n');
      const e = results.flatMap(p => p.slides.flatMap(s => s.errors.map(m => `${p.key}/${s.id}: ${m}`)));
      const w = results.flatMap(p => p.slides.flatMap(s => s.warnings.map(m => `${p.key}/${s.id}: ${m}`)));
      errors += e.length;
      console.log(`${d.id} ${d.name}: ${slideCount} slides, ${e.length} QA errors, ${w.length} warnings`);
      for (const m of e) console.log(`  ERROR ${m}`);
      for (const m of w.slice(0, 5)) console.log(`  warn  ${m}`);
    }
  } finally {
    await renderer.close();
  }
  buildGallery(readManifest(), content);
  console.log(`\ngallery: content/labs/DL1/index.html (serve with: node tools/review.ts)`);
  if (errors) process.exitCode = 1;
}
