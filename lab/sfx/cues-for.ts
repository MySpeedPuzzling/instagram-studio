// Sound cues of an already-published Reel without touching its draft: builds the same motion from cached data and
// runs only the QA pass (no video render), writing content/labs/FX1/src/<kind>.cues.json (+ a cover JPEG).
//   node lab/sfx/cues-for.ts shelf 2026-11-12-reel-shelf
//   node lab/sfx/cues-for.ts unlucky 2026-11-13-reel-unlucky
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSE, activateVariant } from '../../src/design/house.ts';
import { renderMotion } from '../../src/motion/render.ts';
import { ROOT } from '../../src/render/server.ts';

const [kind, id] = process.argv.slice(2);
const OUT = join(ROOT, 'content/labs/FX1/src');
mkdirSync(OUT, { recursive: true });
let motion;
activateVariant(HOUSE);
if (kind === 'shelf') {
  const { reelShelfSpec } = await import('../../src/posts/reel-shelf.ts');
  const { reelShelfMotion } = await import('../../src/motion/reel-shelf.ts');
  motion = reelShelfMotion(HOUSE, (await reelShelfSpec({ fresh: false, draft: id })).spec, { story: false });
} else if (kind === 'unlucky') {
  const { reelUnluckySpec } = await import('../../src/posts/reel-unlucky.ts');
  const { reelUnluckyMotion } = await import('../../src/motion/reel-unlucky.ts');
  motion = reelUnluckyMotion(HOUSE, (await reelUnluckySpec({ fresh: false, draft: id })).spec);
} else throw new Error('kind: shelf | unlucky');
activateVariant(undefined);
const res = await renderMotion(motion, join(OUT, kind), { qaOnly: true, label: `FX1 cues ${kind}` });
console.log(`${kind}: ${res.errors?.length ?? 0} QA errors → ${join(OUT, kind)}.cues.json`);
process.exit(0);
