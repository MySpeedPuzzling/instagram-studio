// Builds a real draft from a post builder (src/posts/), in the house style, with fresh data:
//   1 re-runs the post's queries --fresh and snapshots them into facts.json (every number comes from there);
//   2 renders the slides in HOUSE (src/design/house.ts) and refuses to save if QA reports any error;
//   3 writes the proposed caption (msp-captions rules, linted) and alt text per slide;
//   4 saves content/drafts/<id>/ with status in_review for the owner to fine-tune in the review app.
// Before drafting, read editorial/standing-feedback.md (the owner's standing rules) and apply it in the builder.
//
//   node tools/draft.ts faster-postcards          # "Which is faster?" with Ravensburger's three postcards
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintCaption } from '../src/captions/lint.ts';
import { fetchBoxes } from '../src/data/boxes.ts';
import { query, type QueryResult } from '../src/data/db.ts';
import { HOUSE, HOUSE_CSS, activateVariant } from '../src/design/house.ts';
import { page } from '../src/design/page.ts';
import { existsSync } from 'node:fs';
import { DRAFTS, loadDraft, saveDraft, type Draft } from '../src/drafts/model.ts';
import { fasterAlt, fasterSlides, fasterStories, type Contender, type FasterSpec } from '../src/posts/faster.ts';
import { metered } from '../src/render/meter.ts';
import { createRenderer } from '../src/render/render.ts';
import { ROOT } from '../src/render/server.ts';

interface Built { userTags?: Record<number, Array<{ username: string; x: number; y: number }>>; stories?: string[]; id: string; title: string; pillar: string; format: Draft['format']; tags: Record<string, string | number>; facts: Record<string, QueryResult>; slides: string[]; alt: string[]; caption: string; captionPillar: string }

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });

const BUILDERS: Record<string, () => Promise<Built>> = {
  'faster-postcards': async () => {
    const q = query('quiz-postcards', { fresh: true });
    const want: Array<[string, string]> = [['Postcard from Paris', 'Paris'], ['London Postcard', 'London'], ['New York Postcard', 'New York']];
    const rows = want.map(([name]) => q.rows.find(r => r.puzzle === name));
    if (rows.some(r => !r)) throw new Error(`quiz-postcards: missing ${want.filter((_, i) => !rows[i]).map(w => w[0]).join(', ')}`);
    const imgs = await fetchBoxes(rows.map(r => r!.image));
    const contenders: Contender[] = rows.map((r, i) => ({
      puzzle: r!.puzzle, brand: r!.brand, pieces: Number(r!.pieces), img: imgs.get(r!.image)!, short: want[i][1],
      solvers: Number(r!.solvers), soloResults: Number(r!.solo_results), medianS: Number(r!.median_solo_s), fastestS: Number(r!.fastest_solo_s),
      duoResults: Number(r!.duo_results), duoMedianS: Number(r!.median_duo_s),
    }));
    const spec: FasterSpec = {
      key: 'faster-postcards', kicker: 'Which is faster?', question: 'Three postcards, 500 pieces each. Which one do puzzlers finish fastest?',
      what: '500 pieces each', src: `Data: myspeedpuzzling.com · ${dayOf(q.queried_at)}`, ask: 'Which postcard have you done, and what was your time?', contenders,
    };
    activateVariant(HOUSE);
    const slides = fasterSlides(HOUSE, spec);
    const stories = fasterStories(HOUSE, spec);
    activateVariant(undefined);
    const caption = [
      'Paris, London or New York: which 500-piece postcard do puzzlers finish fastest? Guess before you swipe.',
      '',
      `All three are @ravensburgerglobal postcards and among the most-solved puzzles on MySpeedPuzzling. We compared the median solo time of each, so half of all solo times on that puzzle are faster. The race is closer than you'd think, pairs change it completely, and the fastest single solve goes to a different city.`,
      '',
      'Which postcard have you done, and what was your time? ⏱️',
      '',
      '#speedpuzzling #jigsawpuzzle #ravensburger #500pieces',
    ].join('\n');
    return {
      id: `${new Date().toISOString().slice(0, 10)}-faster-postcards`, title: 'Which is faster? The postcard trio', pillar: 'community', format: 'carousel',
      tags: { series: 'which-is-faster', slot: 'weekend-interactive', mechanic: 'prediction', template: 'faster-quiz', style: 'H4' },
      // Photo tag on slide 1, on the postcards (owner 2026-10-17: "tag ravensburgerglobal").
      userTags: { 0: [{ username: 'ravensburgerglobal', x: 0.5, y: 0.55 }] },
      facts: { 'quiz-postcards': q }, slides, stories, alt: fasterAlt(spec), caption, captionPillar: 'carousel',
    };
  },
};

const name = process.argv[2];
if (!BUILDERS[name]) { console.error(`usage: node tools/draft.ts <${Object.keys(BUILDERS).join('|')}>`); process.exit(2); }
const b = await BUILDERS[name]();
const dir = join(DRAFTS, b.id, 'slides');
mkdirSync(dir, { recursive: true });
const renderer = await createRenderer(join(DRAFTS, b.id));
const errors: string[] = [];
const slides = await metered(join(ROOT, 'content/drafts/runs.jsonl'), { draft: b.id, slides: b.slides.length, engine: 'playwright-1.64/chromium-156' }, async () => {
  const out: Draft['slides'] = [];
  try {
    for (const [i, body] of b.slides.entries()) {
      const n = String(i + 1).padStart(2, '0');
      const res = await renderer.render({ id: `slides/slide-${n}`, html: page(body, { css: HOUSE_CSS, title: `${b.id} ${n}` }) });
      errors.push(...res.qa.errors.map(e => `slide ${n}: ${e}`));
      out.push({ file: `content/drafts/${b.id}/slides/slide-${n}.jpg`, preview: `content/drafts/${b.id}/slides/slide-${n}.ig.jpg`, alt: b.alt[i] ?? '', ...(b.userTags?.[i] ? { user_tags: b.userTags[i] } : {}) });
    }
    // Story frames that follow the post (posted by hand with a sticker): content/drafts/<id>/stories/story-N.jpg
    for (const [i, body] of (b.stories ?? []).entries()) {
      const res = await renderer.render({ id: `stories/story-${i + 1}`, html: page(body, { frame: 'story', css: HOUSE_CSS, title: `${b.id} story ${i + 1}` }), frame: 'story' });
      errors.push(...res.qa.errors.map(e => `story ${i + 1}: ${e}`));
    }
  } finally { await renderer.close(); }
  return out;
});
if (errors.length) { console.error(`QA errors, draft not saved:\n  ${errors.join('\n  ')}`); process.exit(1); }
const lint = lintCaption(b.caption, b.captionPillar as Parameters<typeof lintCaption>[1]);
writeFileSync(join(DRAFTS, b.id, 'facts.json'), JSON.stringify(b.facts, null, 1) + '\n');
const now = new Date().toISOString();
// Re-running a builder updates the draft: the version goes up, feedback.jsonl stays, and a caption the owner edited
// (caption_author: human) is never replaced.
const prev = existsSync(join(DRAFTS, b.id, 'draft.yaml')) ? loadDraft(b.id) : undefined;
const keepCaption = prev?.caption_author === 'human';
saveDraft({
  id: b.id, status: 'in_review', title: b.title, pillar: b.pillar, format: b.format, tags: b.tags,
  caption: keepCaption ? prev!.caption : b.caption, caption_author: keepCaption ? 'human' : 'claude', slides,
  created_at: prev?.created_at ?? now, updated_at: now, version: (prev?.version ?? 0) + 1,
});
if (keepCaption) console.log('kept the owner-edited caption');
console.log(`draft ${b.id}: ${slides.length} slides, 0 QA errors; caption lint: ${lint.errors.length} errors, ${lint.warnings.length} warnings`);
for (const e of lint.errors) console.log(`  caption ERROR ${e}`);
for (const w of lint.warnings) console.log(`  caption warn  ${w}`);
console.log(`review: node tools/review.ts → http://127.0.0.1:4173/review/d/${b.id}`);
