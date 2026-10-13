// Turns a rendered design-lab post into a draft for the review app (used to test the flow end to end, and
// to promote a lab post the owner likes into a real draft).
//
//   node tools/draft-from-lab.ts DL1 D1 wall
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAFTS, saveDraft, type Draft } from '../src/drafts/model.ts';
import { ROOT } from '../src/render/server.ts';

const [lab, direction, key] = process.argv.slice(2);
if (!lab || !direction || !key) { console.error('usage: node tools/draft-from-lab.ts <lab> <direction> <post-key>'); process.exit(2); }
const manifest = JSON.parse(readFileSync(join(ROOT, 'content/labs', lab, direction, 'manifest.json'), 'utf8'));
const post = manifest.posts.find((p: { key: string }) => p.key === key);
if (!post) { console.error(`no post ${key} in ${lab}/${direction}`); process.exit(2); }

const id = `${new Date().toISOString().slice(0, 10)}-${key}-${direction.toLowerCase()}`;
const dir = join(DRAFTS, id, 'slides');
mkdirSync(dir, { recursive: true });
const slides = post.slides.map((s: { id: string; jpg: string; preview: string }, i: number) => {
  const n = String(i + 1).padStart(2, '0');
  copyFileSync(join(ROOT, s.jpg), join(dir, `slide-${n}.jpg`));
  copyFileSync(join(ROOT, s.preview), join(dir, `slide-${n}.ig.jpg`));
  return { file: `content/drafts/${id}/slides/slide-${n}.jpg`, preview: `content/drafts/${id}/slides/slide-${n}.ig.jpg`, alt: '' };
});

// Facts snapshot: the cached queries the lab content was built from.
const cache = join(ROOT, 'content/cache');
const facts: Record<string, unknown> = {};
for (const q of ['totals', 'wall-500', 'solo-distribution', 'pb-500-thresholds', 'records-500', 'country-pb-500', 'share-by-pieces', 'xp-levels']) {
  const f = join(cache, `${q}.json`);
  if (existsSync(f)) facts[q] = JSON.parse(readFileSync(f, 'utf8'));
}
writeFileSync(join(DRAFTS, id, 'facts.json'), JSON.stringify(facts, null, 1) + '\n');

const now = new Date().toISOString();
const draft: Draft = {
  id, status: 'in_review', title: `${post.key} (${direction} from ${lab})`, pillar: 'did-you-know',
  format: slides.length > 1 ? 'carousel' : 'single', tags: { source: `${lab}/${direction}/${key}` },
  caption: '', caption_author: 'claude', slides, created_at: now, updated_at: now, version: 1,
};
saveDraft(draft);
console.log(`draft ${id} created (${slides.length} slides); write the caption and alt text, then review at /review/d/${id}`);
