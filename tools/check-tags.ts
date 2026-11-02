// Pre-check a draft's photo tags before publishing: every tag gets its own unpublished carousel-item container
// (nothing is posted; unpublished containers expire after 24 h). Instagram refuses some real accounts (private or
// tag-restricted ones), and one refused tag fails the whole publish (Weekly Numbers eps. 1 and 2).
//
//   node tools/check-tags.ts <draft-id>            # report which tags work, per slide
//   node tools/check-tags.ts <draft-id> --remove   # also drop the refused tags from draft.yaml (owner tags them by hand)
import { join } from 'node:path';
import { addFeedback, loadDraft, saveDraft } from '../src/drafts/model.ts';
import { igClient } from '../src/ig/api.ts';
import { r2Host } from '../src/publish/r2.ts';
import { ROOT } from '../src/render/server.ts';

const id = process.argv[2];
if (!id) { console.error('usage: node tools/check-tags.ts <draft-id> [--remove]'); process.exit(2); }
const remove = process.argv.includes('--remove');

const d = loadDraft(id);
const ig = igClient(), host = r2Host(), prefix = host.newPrefix();
const refused: Array<{ slide: number; username: string; x: number; y: number; error: string }> = [];
const keys: string[] = [];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

try {
  for (const [i, s] of d.slides.entries()) {
    if (!s.user_tags?.length) continue;
    const key = `${prefix}/tagcheck-${String(i + 1).padStart(2, '0')}.jpg`;
    const url = await host.put(key, join(ROOT, s.file), 'image/jpeg');
    keys.push(key);
    for (const t of s.user_tags) {
      let error = '';
      try {
        const c = (await ig.post('me/media', { image_url: url, is_carousel_item: true, user_tags: JSON.stringify([t]) })).id as string;
        for (let k = 0; k < 6; k++) {
          const st = await ig.get(c, { fields: 'status_code,status' });
          if (st.status_code === 'FINISHED') break;
          if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') { error = `${st.status_code} ${st.status ?? ''}`; break; }
          await sleep(2000);
        }
      } catch (e) { error = (e as Error).message; }
      console.log(`slide ${i + 1}  @${t.username.padEnd(30)} ${error ? `REFUSED  ${error}` : 'ok'}`);
      if (error) refused.push({ slide: i + 1, ...t, error });
    }
  }
} finally {
  for (const k of keys) await host.remove(k).catch(() => { /* lifecycle rule cleans up */ });
}

if (refused.length && remove) {
  for (const r of refused) {
    const s = d.slides[r.slide - 1];
    s.user_tags = s.user_tags?.filter(t => t.username !== r.username);
  }
  saveDraft(d);
  addFeedback(id, { author: 'claude', kind: 'comment', text: `Tag check: removed ${refused.map(r => `@${r.username} (slide ${r.slide})`).join(', ')}; Instagram refused them, the owner tags them by hand.` });
}
console.log(refused.length ? `${refused.length} refused${remove ? ' and removed from the draft' : ''}` : 'all tags ok');
