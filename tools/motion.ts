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
//   node tools/motion.ts clock <draft-id> --look A|B|C [--qa-only] [--fresh] [--snap=<dir>]  # Reel "Your extra hour" (clocks go back)
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

const { values: o, positionals: [kind, id] } = parseArgs({ allowPositionals: true, options: { 'qa-only': { type: 'boolean' }, snap: { type: 'string' }, look: { type: 'string', default: 'A' }, fresh: { type: 'boolean' } } });
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
