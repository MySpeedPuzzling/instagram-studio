// Renders the animated Story of a post (HyperFrames, src/motion/) next to its still Story frames:
// content/drafts/<id>/stories/story-1-video.mp4 (+ story-1-video.jpg, its last frame, and story-1-video-preview.jpg,
// frame 0 = Instagram's preview). Light job (~15–30 s, ~1.5 GB peak, logged in
// content/motion-runs.jsonl); still, video renders run with the owner's go-ahead (CLAUDE.md, heavy local jobs).
//
//   node tools/motion.ts weekly 2026-10-19-weekly-rc1            # numbers from the last fresh run (= as published)
//   node tools/motion.ts weekly 2026-10-19-weekly-rc1 --qa-only  # lint + QA + cover only (~2 s)
//   node tools/motion.ts weekly <id> --snap=/tmp/frames          # also save a JPEG at every QA time
//   node tools/motion.ts reel1000 <draft-id> --look A|B|C|v2 [--qa-only]  # Reel "A 1000 isn't twice a 500" (last fresh run)
//   node tools/motion.ts partners <draft-id> [--qa-only] [--fresh]           # Reel "Find your missing piece" (partner finder)
//   node tools/motion.ts grind <draft-id> [--qa-only] [--fresh] [--snap=<dir>]   # Reel "Same puzzle. N times." (the grind)
//   node tools/motion.ts achievements <draft-id> [--qa-only] [--snap=<dir>]     # Reel "5 new achievements" (lab AC1, look L4)
//   node tools/motion.ts achievements <draft-id> --story                        # its follow-up Story (holder numbers, fresh)
//   node tools/motion.ts month <draft-id> [--qa-only] [--fresh] [--snap=<dir>]  # Reel "October in 1000 puzzles" (lab MR1, A + owner's script)
//   node tools/motion.ts month <monthly-report-id> --story   # the same as a Story with a link-sticker zone to the report
//   node tools/motion.ts missing <draft-id> [--qa-only] [--fresh] [--snap=<dir>]  # Reel "WHERE IS IT?" (the missing piece)
//   node tools/motion.ts shelf <draft-id> --story                              # its teaser Story for followers (Link sticker to the carousel)
//   node tools/motion.ts shelf <draft-id> [--qa-only] [--fresh] [--snap=<dir>]    # Reel "I'll solve it this weekend" (pile of shame time-lapse)
//   node tools/motion.ts unlucky <draft-id> [--qa-only] [--fresh] [--snap=<dir>]  # Reel "The cruellest 13 seconds" + Story "300M: guess the day"
//   node tools/motion.ts clock <draft-id> --look A|B|C [--qa-only] [--fresh] [--snap=<dir>]  # Reel "Your extra hour" (clocks go back)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { HOUSE, activateVariant } from '../src/design/house.ts';
import { DRAFTS, loadDraft } from '../src/drafts/model.ts';
import { renderMotion } from '../src/motion/render.ts';
import { reel1000Motion, type Look } from '../src/motion/reel-1000.ts';
import { reel1000V2Motion } from '../src/motion/reel-1000-v2.ts';
import { reelPartnersMotion } from '../src/motion/reel-partners.ts';
import { partnersStory, reelPartnersSpec } from '../src/posts/reel-partners.ts';
import { createRenderer } from '../src/render/render.ts';
import { page } from '../src/design/page.ts';
import { HOUSE_CSS, STICKER_STORY_SAFE } from '../src/design/house.ts';
import { REEL_PUZZLES, reel1000Spec } from '../src/posts/reel-1000.ts';
import { weeklyStoryMotion } from '../src/motion/weekly-story.ts';
import { buildWeeklySpec } from '../src/posts/weekly-data.ts';

const { values: o, positionals: [kind, id] } = parseArgs({ allowPositionals: true, options: { 'qa-only': { type: 'boolean' }, snap: { type: 'string' }, look: { type: 'string', default: 'A' }, fresh: { type: 'boolean' }, story: { type: 'boolean' } } });
if (kind === 'partners' && id) {
  const spec = await reelPartnersSpec({ id, fresh: !!o.fresh });
  if (spec.placeholder) console.log('  note: UI screens are placeholders (ui-placeholder/), not the real UI');
  activateVariant(HOUSE);
  const motion = reelPartnersMotion(HOUSE, spec);
  const story = partnersStory(HOUSE);
  activateVariant(undefined);
  // the follow-up Story still (link sticker to the events page, placed by hand)
  const r = await createRenderer(join(DRAFTS, id));
  try {
    const sr = await r.render({ id: 'stories/story-1', html: page(story, { frame: 'story', css: HOUSE_CSS, title: `${id} story 1` }), frame: 'story', safe: STICKER_STORY_SAFE });
    if (sr.qa.errors.length) throw new Error(`story QA:\n  ${sr.qa.errors.join('\n  ')}`);
  } finally { await r.close(); }
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', 'reel-partners'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel partners` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'month' && id) {
  // Reel "October in 1000 puzzles" (owner 2026-11-01: concept A from lab MR1 + the owner's script); facts.json = the
  // monthly queries used (cached unless --fresh: re-query on the day it is finalised)
  const sharp = (await import('sharp')).default;
  const { ROOT } = await import('../src/render/server.ts');
  const { fetchBoxes } = await import('../src/data/boxes.ts');
  const { buildMonthlySpec } = await import('../src/posts/monthly-data.ts');
  const { reelMonthMotion, edgeTiles } = await import('../src/motion/reel-month.ts');
  const { spec, facts } = await buildMonthlySpec({ fresh: !!o.fresh });
  const top10 = spec.boxes.slice(0, 10), large = await fetchBoxes(top10.map(b => b.image), 'puzzle_large');
  const top = await Promise.all(top10.map(async b => {
    const url = large.get(b.image) ?? b.img, m = await sharp(join(ROOT, url.slice(1))).metadata();
    return { ...b, large: url, aspect: (m.width ?? 4) / (m.height ?? 3) };
  }));
  // --story renders into the monthly report's draft (published: its facts.json is never rewritten)
  if (!o.story) {
    mkdirSync(join(DRAFTS, id), { recursive: true });
    writeFileSync(join(DRAFTS, id, 'facts.json'), JSON.stringify(facts, null, 1) + '\n');
  }
  const edgeImg = await edgeTiles(spec);
  activateVariant(HOUSE);
  const motion = reelMonthMotion(HOUSE, { spec, top, edgeImg }, { story: !!o.story });
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, o.story ? 'stories' : 'reels', o.story ? 'story-month' : 'reel-month'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} ${o.story ? 'story' : 'reel'} month` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'grind' && id) {
  // Reel "Same puzzle. N times." (owner 2026-10-27: concept A, look L1 from lab GR1); facts.json = the queries used
  const { reelGrindSpec } = await import('../src/posts/reel-grind.ts');
  const { reelGrindMotion } = await import('../src/motion/reel-grind.ts');
  const spec = await reelGrindSpec({ fresh: !!o.fresh });
  mkdirSync(join(DRAFTS, id), { recursive: true });
  writeFileSync(join(DRAFTS, id, 'facts.json'), JSON.stringify(spec.facts, null, 1) + '\n');
  console.log(`grind: ${spec.s.length} solves of ${spec.puzzle}, ${spec.pbs.length} PBs, data ${spec.queriedAt}`);
  activateVariant(HOUSE);
  const motion = reelGrindMotion(HOUSE, spec);
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', 'reel-grind'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel grind` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'missing' && id) {
  // Reel "WHERE IS IT?" (the missing piece; owner 2026-11-04, concept A "The search"); facts.json = the queries used
  const { reelMissingSpec } = await import('../src/posts/reel-missing.ts');
  const { reelMissingMotion } = await import('../src/motion/reel-missing.ts');
  const { spec, facts } = await reelMissingSpec({ fresh: !!o.fresh, draft: id });
  mkdirSync(join(DRAFTS, id), { recursive: true });
  writeFileSync(join(DRAFTS, id, 'facts.json'), JSON.stringify(facts, null, 1) + '\n');
  console.log(`missing: ${spec.missing} of ${spec.notes} notes, ${spec.foundLater} found later, cats ${spec.cats} / dogs ${spec.dogs}, board ${spec.box.puzzle}, data ${spec.queriedAt}`);
  activateVariant(HOUSE);
  const motion = reelMissingMotion(HOUSE, spec);
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', 'reel-missing'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel missing` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'unlucky' && id) {
  // Reel "The cruellest 13 seconds" (Friday the 13th) + its sticker Story "300 million pieces: guess the day";
  // facts.json = every query either uses (cached unless --fresh)
  const { reelUnluckySpec, millionFacts, millionStory } = await import('../src/posts/reel-unlucky.ts');
  const { reelUnluckyMotion } = await import('../src/motion/reel-unlucky.ts');
  const { spec, facts } = await reelUnluckySpec({ fresh: !!o.fresh, draft: id });
  const m = millionFacts(!!o.fresh);
  mkdirSync(join(DRAFTS, id), { recursive: true });
  writeFileSync(join(DRAFTS, id, 'facts.json'), JSON.stringify({ ...facts, ...m.facts }, null, 1) + '\n');
  console.log(`unlucky: ${spec.missed} missed (${spec.missedPuzzlers} puzzlers), ${spec.made} made, 59:xx ${spec.wall.find(w => w.minute === 59)?.results} vs 1:00:xx ${spec.wall.find(w => w.minute === 60)?.results}, board ${spec.box.puzzle}, pieces ${m.f.pieces}, data ${spec.queriedAt}`);
  activateVariant(HOUSE);
  const motion = reelUnluckyMotion(HOUSE, spec);
  const storyHtml = page(millionStory(HOUSE, m.f), { frame: 'story', css: HOUSE_CSS, title: `${id} story 300M` });
  activateVariant(undefined);
  const r = await createRenderer(join(DRAFTS, id));
  try {
    const sr = await r.render({ id: 'stories/story-300m', html: storyHtml, frame: 'story', safe: STICKER_STORY_SAFE });
    if (sr.qa.errors.length) throw new Error(`story QA:\n  ${sr.qa.errors.join('\n  ')}`);
    for (const w of sr.qa.warnings ?? []) console.log(`  story warn ${w}`);
  } finally { await r.close(); }
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', 'reel-unlucky'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel unlucky` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'shelf' && id) {
  // Reel "I'll solve it this weekend" (the pile of shame as a time-lapse); facts.json = the carousel's queries
  const { reelShelfSpec } = await import('../src/posts/reel-shelf.ts');
  const { reelShelfMotion } = await import('../src/motion/reel-shelf.ts');
  const { spec, facts } = await reelShelfSpec({ fresh: !!o.fresh, draft: id });
  if (!o.story) writeFileSync(join(DRAFTS, id, 'facts.json'), JSON.stringify(facts, null, 1) + '\n');
  console.log(`shelf: ${spec.s.pct}% of ${spec.s.collected} unsolved, biggest pile ${spec.s.big.unsolved} / ${spec.s.big.days} days, hero ${spec.s.hero.puzzle} ${spec.s.hero.unsolved}/${spec.s.hero.owners}, ${spec.frames.length} time-lapse frames, data ${spec.queriedAt}`);
  activateVariant(HOUSE);
  const motion = reelShelfMotion(HOUSE, spec, { story: !!o.story });
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, o.story ? 'stories' : 'reels', o.story ? 'story-shelf' : 'reel-shelf'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} ${o.story ? 'story' : 'reel'} shelf` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'achievements' && id) {
  // Reel "5 new achievements" (owner 2026-10-29: look L4 from lab AC1, reveal cut A); no DB numbers (rules are the app's)
  if (o.story) {
    // the follow-up Story: holder numbers queried fresh (sticker Story; the link sticker is placed by hand)
    const { query } = await import('../src/data/db.ts');
    const { achievementsStory, holderFacts } = await import('../src/posts/reel-achievements.ts');
    const f = holderFacts(query('achievements-new-holders', { fresh: true }));
    activateVariant(HOUSE);
    const html = page(achievementsStory(HOUSE, f), { frame: 'story', css: HOUSE_CSS, title: `${id} story 1` });
    activateVariant(undefined);
    const r = await createRenderer(join(DRAFTS, id));
    try {
      const sr = await r.render({ id: 'stories/story-1', html, frame: 'story', safe: STICKER_STORY_SAFE });
      if (sr.qa.errors.length) throw new Error(`story QA:\n  ${sr.qa.errors.join('\n  ')}`);
      console.log(`story: ${sr.jpg} (data ${f.queriedAt}, ${f.active} active players)`);
    } finally { await r.close(); }
    process.exit(0);
  }
  const { reelAchievementsMotion } = await import('../src/motion/reel-achievements.ts');
  activateVariant(HOUSE);
  const motion = reelAchievementsMotion(HOUSE);
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', 'reel-achievements'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel achievements` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'clock' && id) {
  // Reel "Your extra hour" (clocks go back, 24–25 Oct 2026): --look A (double-take) | B (slot machine) | C (hour piece)
  const look = (o.look ?? 'A').toUpperCase();
  if (!['A', 'B', 'C'].includes(look)) { console.error('--look A|B|C'); process.exit(2); }
  const mod = await import(`../src/motion/reel-clock-${look.toLowerCase()}.ts`);
  const { reelClockSpec } = await import('../src/posts/reel-clock.ts');
  const spec = await reelClockSpec({ fresh: !!o.fresh, draft: id });
  activateVariant(HOUSE);
  const motion = mod[`reelClock${look}Motion`](HOUSE, spec);
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', `reel-clock-${look.toLowerCase()}`), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel clock ${look}` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind === 'reel1000' && id) {
  const spec = await reel1000Spec({ fresh: false, pick: o.look === 'v2' ? REEL_PUZZLES : undefined });
  activateVariant(HOUSE);
  const motion = o.look === 'v2' ? reel1000V2Motion(HOUSE, spec) : reel1000Motion(HOUSE, spec, o.look as Look);
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DRAFTS, id, 'reels', `reel-${o.look}`), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} reel ${o.look}` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
  process.exit(0);
}
if (kind !== 'weekly' || !id) { console.error('usage: node tools/motion.ts weekly <draft-id> [--qa-only] [--snap=<dir>]'); process.exit(2); }
const d = loadDraft(id), tags = d.tags ?? {};
const segments = (tags.template === 'weekly-rc2' ? ['cover', 'top', 'fast500', 'shout', 'days'] : ['cover', 'top', 'fast500', 'fast1000', 'active', 'shout', 'days', 'close']) as Parameters<typeof buildWeeklySpec>[0]['segments'];
const { spec } = await buildWeeklySpec({ fresh: false, season: Number(tags.season ?? 1), episode: Number(tags.episode ?? 1), segments, question: '' });
if (tags.week && tags.week !== spec.weekStart) throw new Error(`cached data is for the week of ${spec.weekStart}, the draft is for ${tags.week}: re-run the draft first`);
activateVariant(HOUSE);
const motion = weeklyStoryMotion(HOUSE, spec);
activateVariant(undefined);
const res = await renderMotion(motion, join(DRAFTS, id, 'stories', 'story-1-video'), { qaOnly: o['qa-only'], snap: o.snap, label: `${id} story` });
for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
