// Data for the Reel "Find your missing piece" (partner finder launch, src/motion/reel-partners.ts): the events the
// finder shows on (queries/partner-finder-events.sql) and the UI screens. Screens come from the draft's ui/ folder
// (real UI with demo listings only, never real members) or, until those exist, ui-placeholder/ (proposal mockups).
// Each folder has a manifest.json: { source, items: { event, listing, notif, found: { file, w, h, tap: {x, y} | null } } }
// with pixel sizes and the tap point (the button) in image pixels.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '../data/db.ts';
import { DRAFTS } from '../drafts/model.ts';
import { GROUNDS, STICKER_STORY_ROWS, frame, type Variant } from '../design/house.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import type { PartnersSpec, UiShot } from '../motion/reel-partners.ts';

export async function reelPartnersSpec(o: { id: string; fresh: boolean }): Promise<PartnersSpec> {
  const q = query('partner-finder-events', { fresh: o.fresh });
  const r = q.rows[0];
  if (!r) throw new Error('partner-finder-events: no row');
  const real = join(DRAFTS, o.id, 'ui'), ph = join(DRAFTS, o.id, 'ui-placeholder');
  const dir = existsSync(join(real, 'manifest.json')) ? real : ph;
  const man = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as { source: string; items: Record<string, Omit<UiShot, 'src'> & { file: string }> };
  const rel = dir.slice(dir.indexOf('/content/'));
  const shot = (k: string): UiShot => {
    const it = man.items[k];
    if (!it) throw new Error(`${dir}/manifest.json: no ${k}`);
    return { src: `${rel}/${it.file}`, w: it.w, h: it.h, tap: it.tap };
  };
  return {
    events: Number(r.with_finder), countries: Number(r.countries),
    ui: { event: shot('event'), listing: shot('listing'), notif: shot('notif'), found: shot('found') },
    uiSource: man.source, placeholder: dir === ph,
    queriedAt: q.queried_at,
  };
}

/**
 * The Story that follows the Reel (posted by hand): the question, the snapped 2×2 team of pieces and y ≈ 1380–1700 left
 * empty for the owner's link sticker to the events page (owner 2026-10-22: link to /en/partner-finder, never one event).
 */
export function partnersStory(v: Variant): string {
  const s = 210, jig = generateJigsaw({ cols: 2, rows: 2, width: 2 * s, height: 2 * s, seed: 17, tabSize: 0.27, jitter: 0.03 });
  const fills = [GROUNDS.coral.bg, GROUNDS.sky.bg, GROUNDS.indigo.bg, GROUNDS.navy.hotText];
  const at = (r: number, c: number) => jig.pieces.find(p => p.row === r && p.col === c)!;
  const pcs = [at(0, 0), at(0, 1), at(1, 0), at(1, 1)].map((p, i) => `<path d="${p.d}" fill="${fills[i]}" stroke="${GROUNDS.navyDeep.bg}" stroke-width="6" stroke-linejoin="round"/>`).join('');
  return frame({
    ground: 'navy', kind: 'story', kicker: 'New · Partner finder', device: v.device, src: '', rows: STICKER_STORY_ROWS, masthead: true,
    body: `<h1 class="h-title" style="top:380px; font-size:80px; line-height:1.06">Looking for<br><span style="color:var(--g-hot)">a pair or a team?</span></h1>
      <svg width="${2 * s}" height="${2 * s}" viewBox="0 0 ${2 * s} ${2 * s}" style="position:absolute; left:${540 - s}px; top:640px; overflow:visible" aria-hidden="true">${pcs}</svg>
      <p class="h-abs h-lead" style="top:1120px">List yourself on any event page, or find someone already looking. Free for everyone.</p>
      <p class="h-abs h-lab" style="top:1330px">Pick your event ↓</p>`,
  });
}
