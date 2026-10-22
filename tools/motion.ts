// Renders the animated Story of a post (HyperFrames, src/motion/) next to its still Story frames:
// content/drafts/<id>/stories/story-1-video.mp4 (+ story-1-video.jpg, its last frame, and story-1-video-preview.jpg,
// frame 0 = Instagram's preview). Light job (~15–30 s, ~1.5 GB peak, logged in
// content/motion-runs.jsonl); still, video renders run with the owner's go-ahead (CLAUDE.md, heavy local jobs).
//
//   node tools/motion.ts weekly 2026-10-19-weekly-rc1            # numbers from the last fresh run (= as published)
//   node tools/motion.ts weekly 2026-10-19-weekly-rc1 --qa-only  # lint + QA + cover only (~2 s)
//   node tools/motion.ts weekly <id> --snap=/tmp/frames          # also save a JPEG at every QA time
//   node tools/motion.ts reel1000 <draft-id> --look A|B|C|v2 [--qa-only]  # Reel "A 1000 isn't twice a 500" (last fresh run)
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { HOUSE, activateVariant } from '../src/design/house.ts';
import { DRAFTS, loadDraft } from '../src/drafts/model.ts';
import { renderMotion } from '../src/motion/render.ts';
import { reel1000Motion, type Look } from '../src/motion/reel-1000.ts';
import { reel1000V2Motion } from '../src/motion/reel-1000-v2.ts';
import { REEL_PUZZLES, reel1000Spec } from '../src/posts/reel-1000.ts';
import { weeklyStoryMotion } from '../src/motion/weekly-story.ts';
import { buildWeeklySpec } from '../src/posts/weekly-data.ts';

const { values: o, positionals: [kind, id] } = parseArgs({ allowPositionals: true, options: { 'qa-only': { type: 'boolean' }, snap: { type: 'string' }, look: { type: 'string', default: 'A' } } });
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
