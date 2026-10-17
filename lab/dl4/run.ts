// DL4 runner: renders the content families (lab/dl4/posts/*.ts) in every house variant (H1–H3), plus the extra
// directions in lab/dl4/extra/*.ts (e.g. J1, the funny-fact drawing approaches), then rebuilds the gallery.
//
//   node lab/dl4/run.ts                              # everything
//   node lab/dl4/run.ts --family data                # one family, all variants
//   node lab/dl4/run.ts --family data --posts wall,record --variants H2
//   node lab/dl4/run.ts --extra J1                   # one extra direction only
//   node lab/dl4/run.ts --gallery                    # rebuild manifests + gallery from what exists
//
// Every post is written to content/labs/DL4/<H#>/<post>/post.json, so agents rendering different families at the
// same time never overwrite each other; the per-direction manifest.json is assembled from those files in
// POST_ORDER. Each (variant, family) run is metered into content/labs/DL4/runs.jsonl.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { HOUSE_CSS, POST_ORDER, VARIANTS, activateVariant, type Variant } from '../../src/design/house.ts';
import { page } from '../../src/design/page.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import type { Direction, Post } from '../dl1/types.ts';
import type { ManifestDirection, ManifestSlide } from '../dl1/run.ts';
import type { Family } from './types.ts';

export const LAB_DIR = join(ROOT, 'content/labs/DL4');
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

export interface PostRecord { key: string; label?: string; caption?: string; family: string; renderedAt: string; slides: ManifestSlide[] }

export async function loadFamilies(only?: string[]): Promise<Family[]> {
  const dir = join(ROOT, 'lab/dl4/posts');
  const out: Family[] = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.ts')).sort()) {
    const id = f.replace(/\.ts$/, '');
    if (only && !only.includes(id)) continue;
    const mod = await import(pathToFileURL(join(dir, f)).href);
    out.push({ ...mod.default, id });
  }
  return out;
}

export async function loadExtras(only?: string[]): Promise<Direction[]> {
  const dir = join(ROOT, 'lab/dl4/extra');
  if (!existsSync(dir)) return [];
  const out: Direction[] = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.ts')).sort()) {
    const d: Direction = (await import(pathToFileURL(join(dir, f)).href)).default;
    if (!only || only.includes(d.id)) out.push(d);
  }
  return out;
}

export const DIRECTION_INFO: Record<string, { name: string; idea: string }> = Object.fromEntries(Object.values(VARIANTS).map(v => [v.id, { name: v.name, idea: v.idea }]));

/** Writes <dir>/manifest.json from its post.json files, in POST_ORDER (unknown keys last, alphabetically). */
export function assembleManifest(dirId: string, info = DIRECTION_INFO[dirId]): ManifestDirection | null {
  const dir = join(LAB_DIR, dirId);
  if (!existsSync(dir)) return null;
  const posts: PostRecord[] = readdirSync(dir)
    .filter(k => existsSync(join(dir, k, 'post.json')))
    .map(k => JSON.parse(readFileSync(join(dir, k, 'post.json'), 'utf8')) as PostRecord);
  const order = (k: string) => { const i = (POST_ORDER as readonly string[]).indexOf(k); return i < 0 ? 1000 : i; };
  posts.sort((a, b) => order(a.key) - order(b.key) || a.key.localeCompare(b.key));
  const m: ManifestDirection = { id: dirId, name: info?.name ?? dirId, idea: info?.idea ?? '', renderedAt: new Date().toISOString(), posts: posts.map(p => ({ key: p.key, label: p.label, caption: p.caption, slides: p.slides })) };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(m, null, 1) + '\n');
  return m;
}

type Renderer = Awaited<ReturnType<typeof createRenderer>>;

async function renderPosts(renderer: Renderer, dirId: string, family: string, posts: Post[], css: string): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [], warnings: string[] = [];
  for (const post of posts) {
    const slides: ManifestSlide[] = [];
    for (const s of post.slides) {
      const res = await renderer.render({ id: `${dirId}/${post.key}/${s.id}`, html: page(s.body, { frame: s.frame, css, title: `${dirId} ${post.key} ${s.id}` }), frame: s.frame, safe: s.safe });
      slides.push({ id: s.id, jpg: rel(res.jpg), preview: rel(res.preview), frame: s.frame ?? 'feed', errors: res.qa.errors, warnings: res.qa.warnings, ms: res.ms });
      errors.push(...res.qa.errors.map(e => `${dirId} ${post.key}/${s.id}: ${e}`));
      warnings.push(...res.qa.warnings.map(e => `${dirId} ${post.key}/${s.id}: ${e}`));
    }
    const dir = join(LAB_DIR, dirId, post.key);
    mkdirSync(dir, { recursive: true });
    // Drop renders of slides this post no longer has.
    for (const f of readdirSync(dir)) if (/\.(jpg|png)$/.test(f) && !post.slides.some(s => f.startsWith(s.id + '.'))) rmSync(join(dir, f));
    const rec: PostRecord = { key: post.key, label: post.label, caption: post.caption, family, renderedAt: new Date().toISOString(), slides };
    writeFileSync(join(dir, 'post.json'), JSON.stringify(rec, null, 1) + '\n');
  }
  return { errors, warnings };
}

export async function rebuildGallery() {
  const ids = existsSync(LAB_DIR) ? readdirSync(LAB_DIR).filter(d => /^[A-Z]\d+$/.test(d)) : [];
  const extras = await loadExtras();
  for (const id of ids) assembleManifest(id, DIRECTION_INFO[id] ?? extras.find(e => e.id === id));
  const { buildGallery } = await import('./gallery.ts');
  buildGallery();
}

if (import.meta.main) {
  const { values: o } = parseArgs({ options: {
    family: { type: 'string' }, posts: { type: 'string' }, variants: { type: 'string' }, extra: { type: 'string' }, gallery: { type: 'boolean' },
  } });
  if (o.gallery) { await rebuildGallery(); console.log('gallery: content/labs/DL4/index.html'); process.exit(0); }
  const onlyPosts = o.posts?.split(',').map(s => s.trim());
  const variants: Variant[] = (o.variants?.split(',').map(s => s.trim().toUpperCase()) ?? Object.keys(VARIANTS)).map(id => VARIANTS[id as Variant['id']]).filter(Boolean);
  const families = o.extra ? [] : await loadFamilies(o.family?.split(','));
  const extras = o.family && !o.extra ? [] : await loadExtras(o.extra?.split(','));
  const { loadContent } = await import('./content.ts');
  const content = loadContent();
  mkdirSync(LAB_DIR, { recursive: true });
  const renderer = await createRenderer(LAB_DIR);
  let errorCount = 0;
  try {
    for (const v of variants) for (const fam of families) {
      activateVariant(v); // token overrides + seam style of this variant apply while its slides are built
      const posts = fam.posts(content, v).filter(p => !onlyPosts || onlyPosts.includes(p.key));
      if (!posts.length) continue;
      const unknown = posts.filter(p => !(POST_ORDER as readonly string[]).includes(p.key));
      if (unknown.length) console.log(`  note: post keys not in POST_ORDER: ${unknown.map(p => p.key).join(', ')}`);
      const n = posts.reduce((s, p) => s + p.slides.length, 0);
      const r = await metered(join(LAB_DIR, 'runs.jsonl'), { lab: 'DL4', run_id: `DL4-${v.id}-${fam.id}`, direction: v.id, family: fam.id, posts: posts.map(p => p.key), slides: n, engine: 'playwright-1.64/chromium-156' },
        () => renderPosts(renderer, v.id, fam.id, posts, HOUSE_CSS));
      errorCount += r.errors.length;
      console.log(`${v.id} ${fam.id}: ${n} slides, ${r.errors.length} QA errors, ${r.warnings.length} warnings`);
      for (const e of r.errors) console.log(`  ERROR ${e}`);
      for (const w of r.warnings.slice(0, 8)) console.log(`  warn  ${w}`);
    }
    for (const d of extras) {
      activateVariant(undefined);
      const posts = d.posts(content).filter(p => !onlyPosts || onlyPosts.includes(p.key));
      const n = posts.reduce((s, p) => s + p.slides.length, 0);
      const r = await metered(join(LAB_DIR, 'runs.jsonl'), { lab: 'DL4', run_id: `DL4-${d.id}`, direction: d.id, slides: n, engine: 'playwright-1.64/chromium-156' },
        () => renderPosts(renderer, d.id, d.id, posts, HOUSE_CSS + (d.css ?? '')));
      errorCount += r.errors.length;
      console.log(`${d.id} ${d.name}: ${n} slides, ${r.errors.length} QA errors, ${r.warnings.length} warnings`);
      for (const e of r.errors) console.log(`  ERROR ${e}`);
      for (const w of r.warnings.slice(0, 8)) console.log(`  warn  ${w}`);
    }
  } finally {
    await renderer.close();
  }
  await rebuildGallery();
  console.log(`\ngallery: content/labs/DL4/index.html (serve with: node tools/review.ts → /content/labs/DL4/)`);
  if (errorCount) process.exitCode = 1;
}
