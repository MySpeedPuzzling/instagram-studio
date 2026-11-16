// MU1 gallery: listen to the ACE-Step beds and rate each (Works / Unsure / No-go), per brief, turbo vs XL turbo.
//   node lab/music/gallery.ts   → node tools/review.ts → /content/labs/MU1/
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'MU1';
const DIR = join(ROOT, 'content/labs', LAB);
type Clip = { id: string; brief: string; model: string; caption: string; bpm: number; key: string; seed: number; gen_s: number; file: string };
const clipsFile = join(DIR, 'clips.json');
if (!existsSync(clipsFile)) throw new Error(`no ${clipsFile}: run lab/music/acestep_bench.py first`);
const clips: Clip[] = JSON.parse(readFileSync(clipsFile, 'utf8'));
const briefs = [...new Set(clips.map(c => c.brief))];
// Fitted Story versions (drop placed on the video's key moment, the song's own ending): content/labs/MU1/fit/*.mp4
const fitDir = join(DIR, 'fit');
const fits = existsSync(fitDir) ? readdirSync(fitDir).filter(f => f.endsWith('.mp4')).sort() : [];
const FIT_NOTES: Record<string, string> = {
  'MU1-data-xl-turbo-s202-fit': 'Drop (8.0 s) lands on the poster drop (3.25 s); joins the song\'s own outro on a bar line as the cue appears (13.2 s).',
  'MU1-data-arc-xl-turbo-s101-fit': 'The whole build-up spans the Story; its peak and final hit land on the last frame (no fade).',
};
const fitTile = (f: string) => { const id = f.replace(/\.mp4$/, ''); return `<div class="tile"><p class="code"><b>${h(id)}</b><br>${h(FIT_NOTES[id] ?? '')}</p>
<video controls playsinline preload="metadata" src="/content/labs/${LAB}/fit/${h(f)}"></video>
<div class="rate" data-target="${h(id)}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`; };

const tile = (c: Clip) => `<div class="tile"><p class="code"><b>${h(c.id)}</b><br>${h(c.model.replace('acestep-v15-', ''))} · seed ${c.seed} · ${c.gen_s} s to make</p>
${existsSync(join(DIR, 'story', c.id + '.mp4')) ? `<video controls playsinline preload="metadata" src="/content/labs/${LAB}/story/${h(c.id)}.mp4"></video><p class="code">In the weekly Story (trimmed, fade-out, −14 LUFS)</p>` : ''}<audio controls preload="none" src="${h(c.file)}"></audio>
<div class="rate" data-target="${h(c.id)}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`;

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} Music beds (ACE-Step)</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}.row{display:flex;flex-wrap:wrap;gap:16px;padding-bottom:10px}.tile{flex:none;width:300px;background:#fff;border-radius:10px;padding:10px}audio{width:100%}video{width:100%;border-radius:6px;background:#000}
.code{margin:0 0 6px;font-size:14px}.rate button{margin-right:4px;padding:3px 8px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}h2{font-size:17px;margin:22px 0 4px}.brief{color:#556;margin:0 0 10px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · Music beds made on this Mac (ACE-Step 1.5)</h1></header>
<main><p>30 s instrumental beds, one row per mood. Listen on the phone speaker too: that's how most people hear Reels. Rate each; codes like "MU1-cozy-turbo-s11" work in the chat.</p>
${fits.length ? `<h2>Fitted to tonight's Story</h2><p class="brief">The best-rated beds, cut so the drop and the ending hit the video (two-pass loudness −14 LUFS, limiter).</p><div class="row">${fits.map(fitTile).join('')}</div>` : ''}
${briefs.map(b => { const cs = clips.filter(c => c.brief === b); return `<h2>${h(b)}</h2><p class="brief">${h(cs[0].caption)} · ${cs[0].bpm} BPM · ${h(cs[0].key)}</p><div class="row">${cs.map(tile).join('')}</div>`; }).join('')}
</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'audio',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${clips.length} clips in ${briefs.length} moods → node tools/review.ts → /content/labs/${LAB}/`);
