// AB1 runner: the "new here?" cover variants for the Start here post (owner 2026-10-18). Renders every variant from
// the about draft's facts snapshot (no new queries), writes content/labs/AB1/ with a gallery where each cover gets
// Works / Unsure / No-go + a note (POST /api/feedback?lab=AB1 → content/labs/AB1/feedback.jsonl, latest wins).
//
//   node lab/about/run.ts      # needs content/drafts/<day>-about/ from `node tools/draft.ts about`
import { writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSE, HOUSE_CSS, activateVariant } from '../../src/design/house.ts';
import { escapeHtml as h, page } from '../../src/design/page.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';
import { aboutCovers } from '../../src/posts/about.ts';
import { buildAboutSpec } from '../../src/posts/about-data.ts';

const LAB = 'AB1';
const DIR = join(ROOT, 'content/labs', LAB);
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

const { spec } = await buildAboutSpec({ fresh: false });
activateVariant(HOUSE);
const covers = aboutCovers(HOUSE, spec);
activateVariant(undefined);
const renderer = await createRenderer(DIR);
const out: Array<{ key: string; label: string; jpg: string; preview: string; errors: string[] }> = [];
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-covers`, posts: 1, slides: covers.length, engine: 'playwright/chromium' }, async () => {
    for (const c of covers) {
      const r = await renderer.render({ id: c.key, html: page(c.html, { css: HOUSE_CSS, title: `${LAB} ${c.key}` }) });
      out.push({ key: c.key, label: c.label, jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors });
      for (const e of r.qa.errors) console.log(`  ERROR ${c.key}: ${e}`);
    }
  });
} finally { await renderer.close(); }

const draft = readdirSync(join(ROOT, 'content/drafts')).filter(d => d.endsWith('-about')).sort().pop();
writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} Start here covers</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1500px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:24px}.tile{background:#fff;border-radius:10px;padding:12px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px}.rate button{margin-right:6px;padding:4px 10px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · Start here: "new here?" covers</h1></header>
<main><p>Four covers for slide 1 of the pinned Start here post, all on the coral poster (owner: coral for the intro). Rate each one; codes like "${LAB}-2" work in the chat too.
Claude's pick: <b>C1 missing piece</b> (the clearest "join us" picture, built from a real box and generator pieces). The rest of the post is in the review app${draft ? `: <a href="/review/d/${draft}">${draft}</a>` : ''}.</p>
<div class="grid">${out.map((o, i) => `<div class="tile"><a href="${o.jpg}" target="_blank"><img src="${o.preview}" alt="${o.key}"></a>
<p class="code"><b>${LAB}-${i + 1} · ${o.key}</b> ${h(o.label)}${o.errors.length ? ` <span style="color:#c33">${o.errors.length} QA errors</span>` : ''}</p>
<div class="rate" data-target="${o.key}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`).join('')}</div></main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'cover',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${out.length} covers, ${out.reduce((s, o) => s + o.errors.length, 0)} QA errors → node tools/review.ts → /content/labs/${LAB}/`);
