// PQ1 lab: "Which puzzle is this piece from?" (weekend quiz, Halloween edition, owner 2026-10-30). Two carousel
// structures from the same facts so the owner can compare them slide by slide (owner picked A, 2026-10-30):
//   A zoom-out hints: piece → its neighbours → a 3×3 chunk → three options → spoiler alert → answer → the numbers;
//   B the owner's sketch: piece ("guess before you swipe") → one hint slide → spoiler alert → answer with numbers;
// plus the teaser Stories for the evening before. Slides and facts live in src/posts/piece-quiz.ts.
//
//   node src/data/db.ts quiz-piece-halloween --fresh && node lab/piece-quiz/run.ts
//   node lab/piece-quiz/run.ts --video [--qa-only]   # also the animated teaser (S-2 video; owner's go-ahead)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSE, HOUSE_CSS, STICKER_STORY_SAFE, activateVariant } from '../../src/design/house.ts';
import { escapeHtml as h, page } from '../../src/design/page.ts';
import { q, structureA, structureB, teaser, teaserBig, type Out } from '../../src/posts/piece-quiz.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'PQ1';
const DIR = join(ROOT, 'content/labs', LAB);
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

// ---------------------------------------------------------------- render + gallery
activateVariant(HOUSE);
const groups: Array<{ id: string; title: string; note: string; slides: Out[] }> = [
  { id: 'A', title: 'A · Zoom-out hints (7 slides)', note: 'Every swipe shows more of the picture: piece → neighbours → 3×3 chunk → three options → spoiler alert → answer → numbers. Slide 2 repeats the piece and the question, so it works when Instagram re-serves the post starting on slide 2.', slides: structureA() },
  { id: 'B', title: "B · The owner's sketch (4 slides)", note: '"Guess without swiping" → one hint slide → spoiler alert → answer with the numbers. Shorter, fewer swipes.', slides: structureB() },
  { id: 'S', title: 'Teaser Story for tonight', note: 'Coral (timely), masthead, a single piece; the bottom stays free for a countdown sticker to Saturday 10:00.', slides: [teaser(), teaserBig()] },
];
activateVariant(undefined);

const renderer = await createRenderer(DIR);
const out = new Map<string, { jpg: string; preview: string; errors: string[] }>();
const all = groups.flatMap(g => g.slides);
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-${Date.now()}`, posts: 2, slides: all.length, engine: 'playwright/chromium' }, async () => {
    for (const s of all) {
      const r = await renderer.render({ id: s.key, html: page(s.html, { css: HOUSE_CSS, title: `${LAB} ${s.key}`, frame: s.story ? 'story' : undefined }), frame: s.story ? 'story' : undefined, safe: s.story ? STICKER_STORY_SAFE : undefined });
      out.set(s.key, { jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors });
      for (const e of r.qa.errors) console.log(`  ERROR ${s.key}: ${e}`);
    }
  });
} finally { await renderer.close(); }

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} Which puzzle is this piece from?</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}h2{margin:34px 0 4px}.row{display:flex;gap:16px;overflow-x:auto;padding-bottom:10px}.tile{flex:none;width:300px;background:#fff;border-radius:10px;padding:10px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px;font-size:14px}.rate button{margin-right:4px;padding:3px 8px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · Which puzzle is this piece from? (Halloween)</h1></header>
<main><p>Two carousel structures for Saturday 31 Oct from the same facts (<code>quiz-piece-halloween</code>, ${h(q.queried_at.slice(0, 16).replace('T', ' '))} UTC; re-queried fresh on the day). Swipe each row left to right like the post. Rate each slide; codes like "A-3" work in the chat too.
Claude's pick: <b>A</b>: the zoom-out makes every swipe a reward, and slide 2 survives Instagram re-serving the post from slide 2.</p>
${groups.map(g => `<h2>${h(g.title)}</h2><p>${h(g.note)}</p><div class="row">${g.slides.map(s => { const o = out.get(s.key)!; return `<div class="tile"${s.story ? ' style="width:260px"' : ''}><a href="${o.jpg}" target="_blank"><img src="${o.preview}" alt="${s.key}"></a>
<p class="code"><b>${s.key}</b> ${h(s.label)}${o.errors.length ? ` <span style="color:#c33">${o.errors.length} QA errors</span>` : ''}</p>
<div class="rate" data-target="${s.key}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`; }).join('')}</div>`).join('')}
</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'slide',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${all.length} slides, ${[...out.values()].reduce((s, o) => s + o.errors.length, 0)} QA errors → node tools/review.ts → /content/labs/${LAB}/`);

if (process.argv.includes('--video')) {
  const { pieceQuizTeaserMotion } = await import('../../src/motion/story-piece-quiz.ts');
  const { renderMotion } = await import('../../src/motion/render.ts');
  activateVariant(HOUSE);
  const motion = pieceQuizTeaserMotion(HOUSE);
  activateVariant(undefined);
  const res = await renderMotion(motion, join(DIR, 'video'), { qaOnly: process.argv.includes('--qa-only'), snap: process.argv.find(a => a.startsWith('--snap='))?.slice(7), label: `${LAB} teaser video` });
  for (const w of res.warnings.slice(0, 6)) console.log(`  warn ${w}`);
  console.log(res.video ? `video: ${res.video} (${res.renderS?.toFixed(1)} s render, peak ${res.peakGb?.toFixed(2)} GB, ${((res.bytes ?? 0) / 1e6).toFixed(1)} MB)` : 'QA ok (no video)');
}
