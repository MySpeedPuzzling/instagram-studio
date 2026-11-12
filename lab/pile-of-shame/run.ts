// SH1 lab: "The pile of shame" funny-fact carousel (owner 2026-11-12: "funny plot twist how long … would it take to solve
// your unsolved puzzles, use some shelf image from the library, propose the visual style"). Two directions from the
// same facts: A the dusty AI1 shelf (E4 shelf-dusk-s401) with real boxes, B a code-built heap of boxes (no photo).
// Slides, facts, alt text and caption live in src/posts/pile-of-shame.ts.
//
//   node lab/pile-of-shame/run.ts            # cached facts; add --fresh to re-query
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSE, HOUSE_CSS, activateVariant } from '../../src/design/house.ts';
import { escapeHtml as h, page } from '../../src/design/page.ts';
import { buildShelfSpec, shelfSlides } from '../../src/posts/pile-of-shame.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'SH1';
const DIR = join(ROOT, 'content/labs', LAB);
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);
type Out = { key: string; label: string; html: string; story?: boolean };

const { spec } = await buildShelfSpec({ fresh: process.argv.includes('--fresh') });
const LABELS = ['cover', '37% waffle', 'plot twist: your pile in hours', 'the biggest pile', 'exhibit 1: by share', 'exhibit 2: Speed Puzzling', 'also gathering dust + question'];
activateVariant(HOUSE);
const mk = (d: 'A' | 'B'): Out[] => shelfSlides(HOUSE, spec, d).map((html, i) => ({ key: `${d}-${i + 1}`, label: LABELS[i], html }));
const groups: Array<{ id: string; title: string; note: string; slides: Out[] }> = [
  { id: 'A', title: 'A · Dusty shelf (AI1 photo + real boxes)', note: 'The cobwebbed shelf from the AI library (dusk light, no candle, so it reads "gathering dust", not Halloween). Coral piece badges = share of owners who haven\'t solved it. Slot 1 is empty with a "?"; slide 5 puts Speed Puzzling in it, close up.', slides: mk('A') },
  { id: 'B', title: 'B · The pile (code, real boxes, no photo)', note: 'Same boxes as a leaning heap on navy, a coral "?" piece on top; slide 5 shows the Speed Puzzling box big with its badge.', slides: mk('B') },
];
activateVariant(undefined);

const renderer = await createRenderer(DIR);
const out = new Map<string, { jpg: string; preview: string; errors: string[] }>();
const all = groups.flatMap(g => g.slides);
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-${Date.now()}`, posts: 2, slides: all.length, engine: 'playwright/chromium' }, async () => {
    for (const s of all) {
      const r = await renderer.render({ id: s.key, html: page(s.html, { css: HOUSE_CSS, title: `${LAB} ${s.key}` }) });
      out.set(s.key, { jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors });
      for (const e of r.qa.errors) console.log(`  ERROR ${s.key}: ${e}`);
    }
  });
} finally { await renderer.close(); }

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} Pile of shame</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}h2{margin:34px 0 4px}.row{display:flex;gap:16px;overflow-x:auto;padding-bottom:10px}.tile{flex:none;width:300px;background:#fff;border-radius:10px;padding:10px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px;font-size:14px}.rate button{margin-right:4px;padding:3px 8px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · The pile of shame (funny fact)</h1></header>
<main><p>Two visual directions for the funny-fact carousel (Thu 12 Nov), same facts (<code>shelf-shame-totals</code>, <code>shelf-shame-puzzles</code>, ${h(spec.asOf)}; public collections only). Slides 2–4 and 6 are shared; the cover (1) and the reveal (5) differ. Rate each slide; codes like "A-1" work in the chat too.
Claude's pick: <b>A</b>: the cobwebbed shelf *is* the joke (puzzles gathering dust), and the empty slot on the cover pays off on slide 5.</p>
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
