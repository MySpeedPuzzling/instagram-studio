// Builds a real draft from a post builder (src/posts/), in the house style, with fresh data:
//   1 re-runs the post's queries --fresh and snapshots them into facts.json (every number comes from there);
//   2 renders the slides in HOUSE (src/design/house.ts) and refuses to save if QA reports any error;
//   3 writes the proposed caption (msp-captions rules, linted) and alt text per slide;
//   4 saves content/drafts/<id>/ with status in_review for the owner to fine-tune in the review app.
// Before drafting, read editorial/standing-feedback.md (the owner's standing rules) and apply it in the builder.
//
//   node tools/draft.ts faster-postcards          # "Which is faster?" with Ravensburger's three postcards
//   node tools/draft.ts about                     # "Start here" explainer (third pinned post)
//   node tools/draft.ts weekly-rc1 | weekly-rc2   # The Weekly Numbers, two release candidates (full / compact)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintCaption } from '../src/captions/lint.ts';
import { fetchBoxes } from '../src/data/boxes.ts';
import { query, type QueryResult } from '../src/data/db.ts';
import { HOUSE, HOUSE_CSS, STICKER_STORY_SAFE, activateVariant } from '../src/design/house.ts';
import { page } from '../src/design/page.ts';
import { existsSync } from 'node:fs';
import { DRAFTS, loadDraft, saveDraft, type Draft } from '../src/drafts/model.ts';
import { aboutAlt, aboutSlides, plus, tens } from '../src/posts/about.ts';
import { buildAboutSpec } from '../src/posts/about-data.ts';
import { weeklyAlt, weeklyCaption, weeklyNames, weeklySlides, weeklyStories, weeklyTags, type Segment } from '../src/posts/weekly.ts';
import { buildWeeklySpec } from '../src/posts/weekly-data.ts';
import { fasterAlt, fasterSlides, fasterStories, type Contender, type FasterSpec } from '../src/posts/faster.ts';
import { metered } from '../src/render/meter.ts';
import { createRenderer } from '../src/render/render.ts';
import { ROOT } from '../src/render/server.ts';

interface Built { userTags?: Record<number, Array<{ username: string; x: number; y: number }>>; stories?: string[]; id: string; title: string; pillar: string; format: Draft['format']; tags: Record<string, string | number>; facts: Record<string, QueryResult>; slides: string[]; alt: string[]; caption: string; captionPillar: string; searchPhrases?: string[]; properNouns?: string[] }

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });

/** The Monday a Weekly Numbers episode goes out: today when it's Monday, else the next Monday (Prague time). */
const nextMonday = () => {
  const today = new Date(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' }) + 'T12:00:00Z');
  return new Date(today.getTime() + ((8 - today.getUTCDay()) % 7) * 86_400_000).toISOString().slice(0, 10);
};

/** The Weekly Numbers: a release candidate is a list of segments (src/posts/weekly.ts). Episode 1 = 19 Oct 2026. */
const weekly = (rc: string, segments: Segment[]) => async (): Promise<Built> => {
  const monday = nextMonday();
  const episode = 1 + Math.round((Date.parse(monday) - Date.parse('2026-10-19')) / (7 * 86_400_000));
  // --cached re-renders from the last fresh run (e.g. the Story of an episode already published, numbers as posted).
  const { spec, facts } = await buildWeeklySpec({ fresh: !process.argv.includes('--cached'), season: 1, episode, segments, question: 'What did you finish last week, and was it a personal best?' });
  activateVariant(HOUSE);
  const slides = weeklySlides(HOUSE, spec), stories = weeklyStories(HOUSE, spec);
  activateVariant(undefined);
  return {
    stories,
    id: `${monday}-weekly-${rc}`, title: `The Weekly Numbers, ep. ${episode} (${rc})`, pillar: 'data', format: 'carousel',
    tags: { series: 'weekly-numbers', season: 1, episode, slot: 'monday-recap', mechanic: 'recap', template: `weekly-${rc}`, style: 'H4', week: spec.weekStart },
    userTags: weeklyTags(spec), facts, slides, alt: weeklyAlt(spec), caption: weeklyCaption(spec), captionPillar: 'carousel',
    searchPhrases: ['puzzling', 'puzzle'], properNouns: weeklyNames(spec),
  };
};

const BUILDERS: Record<string, () => Promise<Built>> = {
  // RC1 full: every segment of the owner's list (8 slides). RC2 compact: cover, top, fastest 500s, shoutout, the week (5).
  'weekly-rc1': weekly('rc1', ['cover', 'top', 'fast500', 'fast1000', 'active', 'shout', 'days', 'close']),
  'weekly-rc2': weekly('rc2', ['cover', 'top', 'fast500', 'shout', 'days']),
  about: async () => {
    const { spec, facts } = await buildAboutSpec({ fresh: true });
    activateVariant(HOUSE);
    const slides = aboutSlides(HOUSE, spec);
    activateVariant(undefined);
    const caption = [
      `New here? MySpeedPuzzling is the speed puzzling home of the world's fastest and ${plus(spec.players)} puzzlers of every pace in ${tens(spec.countries)} countries.`,
      '',
      `Time a jigsaw puzzle with our stopwatch or type the time in, and keep all your puzzle times in one place.`,
      '',
      `The world's fastest 500-piece time, ${Math.floor(spec.fastest500s / 60)}:${String(spec.fastest500s % 60).padStart(2, '0')}, is logged here, and the fastest use MySpeedPuzzling to analyse every solve and compare. And if your first 500 takes an hour and a half, you're in good company: puzzlers who kept logging were typically ${spec.improve.medianGainPct}% faster by their 20th new puzzle. Every solve counts ⏱️`,
      '',
      'Joining is free, the link is in our bio. What was the last puzzle you finished? 🧩',
      '',
      `Numbers as of ${spec.asOf} and growing every day; we'll refresh this post now and then.`,
      '',
      '#speedpuzzling #jigsawpuzzle #myspeedpuzzling #puzzlecompetition',
    ].join('\n');
    return {
      id: `${new Date().toISOString().slice(0, 10)}-about`, title: 'Start here: what MySpeedPuzzling is', pillar: 'community', format: 'carousel',
      tags: { series: 'about', slot: 'pinned', mechanic: 'explainer', template: 'about', style: 'H4' },
      facts,
      slides, alt: aboutAlt(spec), caption, captionPillar: 'carousel',
      searchPhrases: ['speed puzzling', 'puzzle times', 'jigsaw puzzle'],
    };
  },
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
      storyQuestion: 'Three postcards. Which one is fastest?', what: '500 pieces each', src: `Data: myspeedpuzzling.com · ${dayOf(q.queried_at)}`, ask: 'Which postcard have you done, and what was your time?', contenders,
      // Poll on the question Story (17 Oct), read off the app by the owner on 18 Oct.
      poll: { Paris: 48, London: 30, 'New York': 22 },
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
      searchPhrases: ['speed puzzling', '500 piece'],
    };
  },
};

const name = process.argv[2];
if (!BUILDERS[name]) { console.error(`usage: node tools/draft.ts <${Object.keys(BUILDERS).join('|')}>`); process.exit(2); }
const b = await BUILDERS[name]();
// --id <draft id> targets an existing draft (e.g. yesterday's published post, to re-render its follow-up Stories).
const idArg = process.argv.indexOf('--id');
if (idArg > 0) b.id = process.argv[idArg + 1];
// A draft that is scheduled, publishing or published is frozen: only its follow-up Story frames may be re-rendered.
const frozen = existsSync(join(DRAFTS, b.id, 'draft.yaml')) && ['scheduled', 'publishing', 'published'].includes(loadDraft(b.id).status);
if (frozen) {
  const r = await createRenderer(join(DRAFTS, b.id));
  try {
    for (const [i, body] of (b.stories ?? []).entries()) {
      const res = await r.render({ id: `stories/story-${i + 1}`, html: page(body, { frame: 'story', css: HOUSE_CSS, title: `${b.id} story ${i + 1}` }), frame: 'story', ...(i === 0 ? { safe: STICKER_STORY_SAFE } : {}) });
      console.log(`story ${i + 1}: ${res.qa.errors.length} QA errors`);
    }
  } finally { await r.close(); }
  console.log(`draft ${b.id} is ${loadDraft(b.id).status}: left unchanged, Story frames re-rendered`);
  process.exit(0);
}
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
      const res = await renderer.render({ id: `stories/story-${i + 1}`, html: page(body, { frame: 'story', css: HOUSE_CSS, title: `${b.id} story ${i + 1}` }), frame: 'story', ...(i === 0 ? { safe: STICKER_STORY_SAFE } : {}) });
      errors.push(...res.qa.errors.map(e => `story ${i + 1}: ${e}`));
    }
  } finally { await renderer.close(); }
  return out;
});
if (errors.length) { console.error(`QA errors, draft not saved:\n  ${errors.join('\n  ')}`); process.exit(1); }
if (!b.searchPhrases?.length) console.log('  note: the builder declares no searchPhrases, so the search-phrase check is skipped');
const lint = lintCaption(b.caption, b.captionPillar as Parameters<typeof lintCaption>[1], { searchPhrases: b.searchPhrases, properNouns: b.properNouns });
writeFileSync(join(DRAFTS, b.id, 'facts.json'), JSON.stringify(b.facts, null, 1) + '\n');
const now = new Date().toISOString();
// Re-running a builder updates the draft: the version goes up, feedback.jsonl stays, and a caption the owner edited
// (caption_author: human) is never replaced.
const prev = existsSync(join(DRAFTS, b.id, 'draft.yaml')) ? loadDraft(b.id) : undefined;
const keepCaption = prev?.caption_author === 'human';
saveDraft({
  id: b.id, status: 'in_review', title: b.title, pillar: b.pillar, format: b.format, tags: b.tags,
  caption: keepCaption ? prev!.caption : b.caption, caption_author: keepCaption ? 'human' : 'claude', search_phrases: b.searchPhrases, ...(b.properNouns?.length ? { proper_nouns: b.properNouns } : {}), slides,
  created_at: prev?.created_at ?? now, updated_at: now, version: (prev?.version ?? 0) + 1,
});
if (keepCaption) console.log('kept the owner-edited caption');
console.log(`draft ${b.id}: ${slides.length} slides, 0 QA errors; caption lint: ${lint.errors.length} errors, ${lint.warnings.length} warnings`);
for (const e of lint.errors) console.log(`  caption ERROR ${e}`);
for (const w of lint.warnings) console.log(`  caption warn  ${w}`);
console.log(`review: node tools/review.ts → http://127.0.0.1:4173/review/d/${b.id}`);
