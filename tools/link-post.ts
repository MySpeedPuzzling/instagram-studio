// Link a post the owner published by hand to its draft: status "published", media id and permalink, so insights and
// the review app count it. Finds the post by its permalink code, or takes the newest post; refuses when the caption
// doesn't start like the draft's (the wrong post), and reports whether the caption matches the draft exactly.
//
//   node tools/link-post.ts <draft-id> [<permalink-code>]      # e.g. 2026-10-18-about DepAfaWDaud
import { loadDraft, saveDraft } from '../src/drafts/model.ts';
import { igClient, redact } from '../src/ig/api.ts';

const [id, code] = process.argv.slice(2);
if (!id) { console.error('usage: node tools/link-post.ts <draft-id> [<permalink-code>]'); process.exit(2); }
const d = loadDraft(id);
const ig = igClient();
try {
  const recent = (await ig.get('me/media', { fields: 'id,permalink,timestamp,media_type,caption,children{id}', limit: 10 })).data;
  const m = code ? recent.find((x: any) => x.permalink.includes(code)) : recent[0];
  if (!m) throw new Error(`no recent post ${code ? `with code ${code}` : 'found'}`);
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const head = (s: string) => norm(s).slice(0, 40);
  if (head(m.caption ?? '') !== head(d.caption)) throw new Error(`the post's caption doesn't start like draft ${id}'s: ${m.permalink}`);
  const slides = m.children?.data?.length ?? 1;
  console.log(`${m.permalink} · ${m.media_type} · ${slides} slide(s) · ${m.timestamp}`);
  console.log(`caption matches the draft: ${norm(m.caption ?? '') === norm(d.caption) ? 'yes' : 'no (edited when posting)'}`);
  if (slides !== d.slides.length) console.log(`note: the draft has ${d.slides.length} slides`);
  Object.assign(d, { status: 'published', media_id: m.id, permalink: m.permalink, updated_at: new Date().toISOString() });
  saveDraft(d);
  console.log(`draft ${id} linked`);
} catch (e) {
  console.error(redact(String(e)));
  process.exitCode = 1;
}
