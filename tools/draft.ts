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
//   node tools/draft.ts tier-list                 # Subject tier list + HELL tier (Krypt), weekend data carousel
//   node tools/draft.ts pile-of-shame             # Funny fact: unsolved puzzles in collections, pile ladder, museum exhibits (SH1 A)
//   node tools/draft.ts import-launch             # Import launch: "Break it. (Gently.)", call for testers + sandbox by DM
//   node tools/draft.ts monthly                   # The monthly recap of the last full month (run on the 1st)
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
import { monthlyAlt, monthlyCaption, monthlySlides } from '../src/posts/monthly.ts';
import { buildMonthlySpec } from '../src/posts/monthly-data.ts';
import { fasterAlt, fasterSlides, fasterStories, type Contender, type FasterSpec } from '../src/posts/faster.ts';
import { buildTierSpec, tierAlt, tierCaption, tierSlides } from '../src/posts/tier-list.ts';
import { buildShelfSpec, shelfAlt, shelfCaption, shelfSlides } from '../src/posts/pile-of-shame.ts';
import { buildImportSpec, importAlt, importCaption, importSlides } from '../src/posts/import-launch.ts';
import { metered } from '../src/render/meter.ts';
import { createRenderer } from '../src/render/render.ts';
import { ROOT } from '../src/render/server.ts';

/** One tag per account and slide (week 44: a puzzler on two rows, a club handle shared by two members); the first row keeps it. */
const uniqueTags = <T extends { username: string }>(tags: T[]): T[] => tags.filter((t, i) => tags.findIndex(u => u.username === t.username) === i);

interface Built { userTags?: Record<number, Array<{ username: string; x: number; y: number }>>; stories?: string[]; id: string; title: string; pillar: string; format: Draft['format']; tags: Record<string, string | number>; facts: Record<string, QueryResult>; slides: string[]; alt: string[]; caption: string; captionPillar: string; searchPhrases?: string[]; properNouns?: string[] }

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });

/** The Monday a Weekly Numbers episode goes out: today when it's Monday, else the next Monday (Prague time). */
const nextMonday = () => {
  const today = new Date(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' }) + 'T12:00:00Z');
  return new Date(today.getTime() + ((8 - today.getUTCDay()) % 7) * 86_400_000).toISOString().slice(0, 10);
};

/** The Weekly Numbers: a release candidate is a list of segments (src/posts/weekly.ts). Episode 1 = 19 Oct 2026. */
const weekly = (rc: string, segments: Segment[], coverStyle: 'stats' | 'boxes' = 'stats') => async (): Promise<Built> => {
  const monday = nextMonday();
  const episode = 1 + Math.round((Date.parse(monday) - Date.parse('2026-10-19')) / (7 * 86_400_000));
  // --cached re-renders from the last fresh run (e.g. the Story of an episode already published, numbers as posted).
  const { spec, facts } = await buildWeeklySpec({ fresh: !process.argv.includes('--cached'), season: 1, episode, segments, question: 'What did you finish last week, and was it a personal best?' });
  spec.coverStyle = coverStyle;
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
  // Owner 2026-11-09 (ep. 4): the three most-solved boxes lead the cover (picked over the stat strip, eps. 1–3).
  'weekly-rc1': weekly('rc1', ['cover', 'top', 'fast500', 'fast1000', 'active', 'shout', 'days', 'close'], 'boxes'),
  'weekly-rc2': weekly('rc2', ['cover', 'top', 'fast500', 'shout', 'days']),
  // Monthly recap (owner 2026-11-01): carousel on the 1st, built on the DL4 colour mosaic (H4-26/27/28).
  monthly: async () => {
    // Owner's context for the month's caption (owner 2026-11-01: the October jump came from achievement backfills).
    const NOTES: Record<string, string> = { '2026-10': 'Many of you also logged older solves to earn badges 🏅' };
    const prevMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
    const { spec, facts } = await buildMonthlySpec({ fresh: !process.argv.includes('--cached'), note: NOTES[prevMonth] });
    activateVariant(HOUSE);
    const slides = monthlySlides(HOUSE, spec);
    activateVariant(undefined);
    const [y, m] = spec.month.split('-').map(Number);
    return {
      id: `${new Date().toISOString().slice(0, 10)}-monthly`, title: `Monthly report, ${spec.month}`, pillar: 'data', format: 'carousel',
      tags: { series: 'monthly-report', season: 1, episode: (y - 2026) * 12 + m - 9, slot: 'monthly-recap', mechanic: 'recap+find-yours', template: 'monthly-mosaic', style: 'H4', month: spec.month },
      facts, slides, alt: monthlyAlt(spec), caption: monthlyCaption(spec), captionPillar: 'carousel',
      searchPhrases: ['puzzles', 'puzzling'], properNouns: [spec.boxes[0].puzzle],
    };
  },
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
  // Halloween piece quiz, structure A (lab PQ1, owner 2026-10-30): the caption never names the answer.
  'piece-quiz-halloween': async () => {
    const q = query('quiz-piece-halloween', { fresh: true });
    const { structureA, ans, options } = await import('../src/posts/piece-quiz.ts');
    activateVariant(HOUSE);
    const slides = structureA().map(s => s.html);
    activateVariant(undefined);
    const fmtT = (s: number) => { const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return hh ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${mm}:${String(ss).padStart(2, '0')}`; };
    const [a, b, c] = options;
    const caption = [
      '1 piece, 3 hints: which Halloween puzzle is it from? 🎃 Guess before you swipe.',
      '',
      `Every swipe shows you a little more of the picture, then three options, and the answer on slide 6. All three options are @ravensburgerglobal Halloween puzzles, so the brand won't give it away.`,
      '',
      'Comment your guess and the slide where you knew it: 1 if one piece was enough 👀',
      '',
      '#speedpuzzling #jigsawpuzzle #halloweenpuzzle #ravensburger',
    ].join('\n');
    const alt = [
      'Halloween quiz cover: a single jigsaw piece cut from a puzzle picture: a pale curl of smoke on the left, grass green on the right with two orange splashes. Title: One piece. Which spooky puzzle is it from? Mystery puzzle, Ravensburger. Guess before you swipe.',
      `Hint 1: the piece with two of its neighbours, pulled slightly apart. ${ans.solvers} MySpeedPuzzling puzzlers have solved it.`,
      `Hint 2: a bigger corner, a 3 by 3 block of pieces around the quiz piece. Logged ${ans.results} times on MySpeedPuzzling.`,
      `Hint 3: it is one of these. A: ${a.puzzle}, ${a.pieces} pieces. B: ${b.puzzle}, ${b.pieces} pieces. C: ${c.puzzle}, ${c.pieces} pieces. All three are Ravensburger Halloween puzzles.`,
      'Spoiler alert, with a warning sign: comment your guess and the slide where you knew it, numbers 1 to 4. 1 means from the single piece, 4 means the options gave it away.',
      `The answer: ${ans.puzzle}, Ravensburger, ${ans.pieces} pieces. The whole picture of a witch at her bubbling cauldron in a dark forest, with the quiz piece outlined in coral: the potion splash above the cauldron.`,
      `The numbers for ${ans.puzzle}, the most-solved Halloween puzzle on MySpeedPuzzling: ${ans.solvers} puzzlers, ${ans.results} solves, typical solo time ${fmtT(ans.medianS)}, fastest solo ${fmtT(ans.fastestS)}. Only ${ans.month} solves this October. Solving a spooky one this weekend?`,
    ];
    return {
      id: `${new Date().toISOString().slice(0, 10)}-piece-quiz-halloween`, title: 'Halloween quiz: which puzzle is this piece from? (A, zoom-out hints)', pillar: 'community', format: 'carousel',
      tags: { series: 'piece-quiz', slot: 'weekend-interactive', season: 'halloween', mechanic: 'guess', template: 'piece-quiz-zoom', style: 'H4', lab: 'PQ1/A' },
      // Photo tag on the answer slide (the brand), never on the cover: a tag there would hint at the brand only.
      userTags: { 5: [{ username: 'ravensburgerglobal', x: 0.5, y: 0.6 }] },
      facts: { 'quiz-piece-halloween': q }, slides, alt, caption, captionPillar: 'carousel',
      searchPhrases: ['halloween puzzle'], properNouns: [ans.puzzle, a.puzzle, c.puzzle],
    };
  },
  // Subject tier list + HELL tier (owner 2026-11-07): weekend data carousel, DL4 H4 tier-list prototype made real.
  'tier-list': async () => {
    const { spec, facts } = await buildTierSpec({ fresh: !process.argv.includes('--cached') });
    activateVariant(HOUSE);
    const slides = tierSlides(HOUSE, spec);
    activateVariant(undefined);
    return {
      id: `${new Date().toISOString().slice(0, 10)}-tier-list`, title: 'Subject tier list (+ HELL tier)', pillar: 'data', format: 'carousel',
      tags: { series: 'tier-list', slot: 'weekend-data', mechanic: 'identity+debate', template: 'tier-list', style: 'H4', lab: 'DL4/tier-list' },
      // Brand tag on the HELL slide (all four Krypts are Ravensburger), never on the cover.
      userTags: { [slides.length - 1]: [{ username: 'ravensburgerglobal', x: 0.5, y: 0.3 }] },
      facts, slides, alt: tierAlt(spec), caption: tierCaption(spec), captionPillar: 'carousel',
      searchPhrases: ['jigsaw puzzle', 'puzzle'], properNouns: ['Krypt', ...spec.hell.map(k => k.puzzle), ...spec.subjects.map(x => x.box.puzzle)],
    };
  },
  // Funny fact (owner 2026-11-12, lab SH1 direction A): the pile of shame, three plot twists, two museum exhibits.
  'pile-of-shame': async () => {
    const { spec, facts } = await buildShelfSpec({ fresh: !process.argv.includes('--cached') });
    activateVariant(HOUSE);
    const slides = shelfSlides(HOUSE, spec, 'A');
    activateVariant(undefined);
    return {
      id: `${new Date().toISOString().slice(0, 10)}-pile-of-shame`, title: 'The pile of shame (funny fact)', pillar: 'did-you-know', format: 'carousel',
      tags: { series: 'funny-facts', slot: 'thursday-did-you-know', mechanic: 'humour+identity+send-a-friend', template: 'pile-of-shame', style: 'H4', lab: 'SH1/A' },
      // Brand tag on the Speed Puzzling exhibit (second-to-last slide), never on the cover.
      userTags: { [slides.length - 2]: [{ username: 'ravensburgerglobal', x: 0.4, y: 0.5 }] },
      facts, slides, alt: shelfAlt(spec, 'A'), caption: shelfCaption(spec), captionPillar: 'carousel',
      searchPhrases: ['jigsaw puzzles', 'puzzle collector'],
      properNouns: [...new Set([spec.hero.puzzle, spec.share.puzzle, spec.giant.puzzle, ...spec.puzzles.map(p => p.puzzle)])],
    };
  },
  // Import launch (owner 2026-11-15): spreadsheet import is live, a first version; call for testers, sandbox by DM.
  'import-launch': async () => {
    const { spec, facts } = await buildImportSpec({ fresh: !process.argv.includes('--cached') });
    activateVariant(HOUSE);
    const slides = importSlides(HOUSE, spec);
    activateVariant(undefined);
    return {
      id: `${new Date().toISOString().slice(0, 10)}-import-launch`, title: 'Import launch: Break it. (Gently.)', pillar: 'community', format: 'carousel',
      tags: { series: 'feature-launch', slot: 'sunday-launch', mechanic: 'call-to-action+humour+send-a-friend', template: 'import-launch', style: 'H4', follows: '2026-11-13-story-spreadsheets' },
      facts, slides, alt: importAlt(spec), caption: importCaption(spec), captionPillar: 'carousel',
      searchPhrases: ['spreadsheet import', 'puzzle collection'], properNouns: ['MySpeedPuzzling', 'Google Sheets', 'Excel', 'MSP', 'SANDBOX'],
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
      out.push({ file: `content/drafts/${b.id}/slides/slide-${n}.jpg`, preview: `content/drafts/${b.id}/slides/slide-${n}.ig.jpg`, alt: b.alt[i] ?? '', ...(b.userTags?.[i] ? { user_tags: uniqueTags(b.userTags[i]) } : {}) });
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
