// SW1 lab: still Story "Your spreadsheets, wanted!" (owner 2026-11-13: call on spreadsheet keepers to send samples so
// MSP's new import reads real sheets; DM or e-mail). Three concepts from src/posts/story-spreadsheets.ts.
//
//   node lab/spreadsheets/run.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOUSE, HOUSE_CSS, STICKER_STORY_SAFE, activateVariant } from '../../src/design/house.ts';
import { escapeHtml as h, page } from '../../src/design/page.ts';
import { spreadsheetStory, type SheetConcept } from '../../src/posts/story-spreadsheets.ts';
import { metered } from '../../src/render/meter.ts';
import { createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'SW1';
const DIR = join(ROOT, 'content/labs', LAB);
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);
const CONCEPTS: Array<{ key: SheetConcept; label: string; note: string }> = [
  { key: 'A', label: 'WANTED (coral alarm poster)', note: 'A siren, WANTED, a messy sample sheet, "Reward: an import that reads yours".' },
  { key: 'B', label: 'WE WANT YOU(R SPREADSHEETS)', note: 'Navy type gag: the coral R typed in with a cursor turns the recruiting poster into the ask.' },
  { key: 'C', label: 'The Story is a spreadsheet', note: 'Formula bar =WANTED(your_spreadsheet), the selected cell is the call-out; nerdiest.' },
];
activateVariant(HOUSE);
const slides = CONCEPTS.map(c => ({ ...c, html: spreadsheetStory(HOUSE, c.key) }));
activateVariant(undefined);

const renderer = await createRenderer(DIR);
const out = new Map<string, { jpg: string; preview: string; errors: string[]; warnings: string[] }>();
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-${Date.now()}`, posts: 1, slides: slides.length, engine: 'playwright/chromium' }, async () => {
    for (const s of slides) {
      const r = await renderer.render({ id: `SW1-${s.key}`, html: page(s.html, { frame: 'story', css: HOUSE_CSS, title: `${LAB} ${s.key}` }), frame: 'story', safe: STICKER_STORY_SAFE });
      out.set(s.key, { jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors, warnings: r.qa.warnings ?? [] });
      for (const e of r.qa.errors) console.log(`  ERROR ${s.key}: ${e}`);
      for (const w of r.qa.warnings ?? []) console.log(`  warn ${s.key}: ${w}`);
    }
  });
} finally { await renderer.close(); }

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} Spreadsheets wanted</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}.row{display:flex;gap:16px;overflow-x:auto;padding-bottom:10px}.tile{flex:none;width:300px;background:#fff;border-radius:10px;padding:10px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px;font-size:14px}.rate button{margin-right:4px;padding:3px 8px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · Your spreadsheets, wanted (still Story)</h1></header>
<main><p>Three concepts for the call for spreadsheet samples (import feature). Rate each; codes like "SW1-A" work in the chat too.</p>
<div class="row">${slides.map(s => { const o = out.get(s.key)!; return `<div class="tile"><a href="${o.jpg}" target="_blank"><img src="${o.preview}" alt="${s.key}"></a>
<p class="code"><b>SW1-${s.key}</b> ${h(s.label)}${o.errors.length ? ` <span style="color:#c33">${o.errors.length} QA errors</span>` : ''}<br>${h(s.note)}</p>
<div class="rate" data-target="SW1-${s.key}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`; }).join('')}</div>
</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'slide',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${slides.length} slides, ${[...out.values()].reduce((s, o) => s + o.errors.length, 0)} QA errors → node tools/review.ts → /content/labs/${LAB}/`);
