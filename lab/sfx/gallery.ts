// Generic video/audio listening gallery for the sound labs (FX1, MU2, …): every file in content/labs/<LAB>/out/,
// grouped and annotated by content/labs/<LAB>/notes.json ({title, intro, groups: [{title, note, prefix}], notes: {id: text}}).
//   node lab/sfx/gallery.ts FX1   → node tools/review.ts → /content/labs/FX1/
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = process.argv[2];
if (!LAB) throw new Error('usage: node lab/sfx/gallery.ts <LAB>');
const DIR = join(ROOT, 'content/labs', LAB);
type Notes = { title: string; intro?: string; groups?: Array<{ title: string; note?: string; prefix: string }>; notes?: Record<string, string> };
const notes: Notes = existsSync(join(DIR, 'notes.json')) ? JSON.parse(readFileSync(join(DIR, 'notes.json'), 'utf8')) : { title: LAB };
const rank: Record<string, Array<{ id: string; score: number; fails: string[] }>> = existsSync(join(DIR, 'rank.json')) ? JSON.parse(readFileSync(join(DIR, 'rank.json'), 'utf8')) : {};
const pos = new Map<string, { n: number; score: number; fails: string[] }>();
for (const g of Object.values(rank)) g.forEach((r, i) => pos.set(r.id, { n: i + 1, score: r.score, fails: r.fails }));
const files = readdirSync(join(DIR, 'out')).filter(f => /\.(mp4|wav|flac|m4a)$/.test(f))
  .sort((a, b) => (pos.get(a.replace(/\.[^.]+$/, ''))?.n ?? 99) - (pos.get(b.replace(/\.[^.]+$/, ''))?.n ?? 99) || a.localeCompare(b));
const groups = notes.groups?.length ? notes.groups : [{ title: 'All', prefix: '' }];
const used = new Set<string>();
const vocals: Record<string, { vocal_db: number; flag: boolean }> = existsSync(join(DIR, 'vocals.json')) ? JSON.parse(readFileSync(join(DIR, 'vocals.json'), 'utf8')) : {};

const tile = (f: string) => {
  const id = f.replace(/\.[^.]+$/, ''), src = `/content/labs/${LAB}/out/${f}`;
  const fit = existsSync(join(DIR, 'out', id + '.fit.json')) ? JSON.parse(readFileSync(join(DIR, 'out', id + '.fit.json'), 'utf8')) : null;
  const bedId = Object.keys(vocals).find(k => id.startsWith(k));
  const voc = bedId ? ` · vocals ${vocals[bedId].vocal_db} dB${vocals[bedId].flag ? ' ⚠ listen' : ''}` : '';
  const hitsTxt = fit?.hits_ms ? ' · hits ' + Object.entries(fit.hits_ms).map(([k, v]) => `${k} ${v} ms`).join(', ') : '';
  const meta = fit ? `${fit.tempo} BPM · drop ${fit.drop}s → ${fit.key}s · ${fit.mode} · ${fit.lufs} LUFS${Array.isArray(fit.qa) ? ' · QA: ' + fit.qa.join('; ') : ''}${voc}${hitsTxt}` : '';
  const rk = pos.get(id);
  return `<div class="tile"><p class="code">${rk ? `<b>#${rk.n}</b> (score ${rk.score}${rk.fails.length ? `, ⚠ ${h(rk.fails.join('; '))}` : ''})<br>` : ''}<b>${h(id)}</b>${notes.notes?.[id] ? `<br>${h(notes.notes[id])}` : ''}${meta ? `<br><span class="meta">${h(meta)}</span>` : ''}</p>
${f.endsWith('.mp4') ? `<video controls playsinline preload="metadata" src="${h(src)}"></video>` : `<audio controls preload="none" src="${h(src)}"></audio>`}
<div class="rate" data-target="${h(id)}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`;
};
const sections = groups.map(g => {
  const fs = files.filter(f => f.startsWith(g.prefix) && !used.has(f));
  fs.forEach(f => used.add(f));
  return fs.length ? `<h2>${h(g.title)}</h2>${g.note ? `<p class="brief">${h(g.note)}</p>` : ''}<div class="row">${fs.map(tile).join('')}</div>` : '';
}).join('');

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} ${h(notes.title)}</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}.row{display:flex;flex-wrap:wrap;gap:16px;padding-bottom:10px}.tile{flex:none;width:300px;background:#fff;border-radius:10px;padding:10px}audio{width:100%}video{width:100%;border-radius:6px;background:#000}
.code{margin:0 0 6px;font-size:14px}.meta{color:#667;font-size:12px}.rate button{margin-right:4px;padding:3px 8px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}h2{font-size:17px;margin:22px 0 4px}.brief{color:#556;margin:0 0 10px;max-width:900px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · ${h(notes.title)}</h1></header>
<main>${notes.intro ? `<p class="brief">${h(notes.intro)}</p>` : ''}${sections}</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'audio',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${files.length} files → node tools/review.ts → /content/labs/${LAB}/`);
