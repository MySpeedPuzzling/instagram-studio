// DL1 review gallery. Every slide has a short code (e.g. "D4-3") so feedback can be given per slide, per
// direction, or in chat. Feedback posts to the local review server and lands in
// content/labs/DL1/feedback.jsonl (latest entry per target wins).
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';
import type { Manifest, ManifestDirection } from './run.ts';

export const POST_LABEL: Record<string, string> = {
  wall: 'The 59-minute wall (4-slide carousel)', record: 'Record (single image)', countries: 'Country top 10 (single image)',
  share: 'Proportion (single image)', xp: 'Level 50 club: the XP card idea (single image)', story: 'Story frames',
  weekly: 'The Weekly Numbers (carousel)', event: 'Event preview: Wisconsin championship', feature: 'Feature news: XP launch day',
  month: 'Monthly report: record September', 'weekly-story': 'Weekly Story pack', 'event-story': 'Event Stories',
};

const CAPTION: Record<string, string> = {
  wall: '58 minutes is the most common finish time for a solo 500. Then the counts drop by 7.4% at the hour. Which side of the wall is your PB?',
  record: '22:30. That is the fastest first attempt ever logged on a 500-piece puzzle on MySpeedPuzzling.',
  countries: 'Denmark, Switzerland and Finland lead on median personal bests for a solo 500.',
  share: 'Three in four results logged on MySpeedPuzzling are 500-piece puzzles.',
  xp: 'Ten puzzlers already reached Level 50, the top level of the new XP system.',
  weekly: 'The Weekly Numbers: what the community puzzled last week.',
  event: 'The Wisconsin State Jigsaw Puzzle Championship is on Friday.',
  feature: 'You logged 2,890 results on XP launch day, our busiest day ever.',
  month: 'September 2026 was our biggest month ever.',
  story: '',
};

/** Slide codes: D4-1, D4-2, … numbered through the direction in post order. */
export function slideCodes(d: ManifestDirection) {
  let n = 0;
  return d.posts.map(p => ({ key: p.key, slides: p.slides.map(s => ({ ...s, code: `${d.id}-${++n}` })) }));
}

export function buildGallery(manifest: Manifest, labId = 'DL1') {
  const realPosts = existsSync(join(ROOT, 'var/ig-compression'))
    ? readdirSync(join(ROOT, 'var/ig-compression')).filter(f => f.endsWith('_0.jpg')).sort().reverse().slice(0, 9).map(f => `/var/ig-compression/${f}`)
    : [];
  const dirs = Object.values(manifest).sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));
  const coded = Object.fromEntries(dirs.map(d => [d.id, slideCodes(d)]));
  const keys = [...new Set(dirs.flatMap(d => d.posts.map(p => p.key)))];
  for (const d of dirs) for (const p of d.posts) { if (p.label) POST_LABEL[p.key] ??= p.label; if (p.caption) CAPTION[p.key] ??= p.caption; }

  type CodedSlide = { preview: string; jpg: string; id: string; frame: string; code: string; video?: string };
  const phone = (slides: CodedSlide[], key: string) => {
    const story = slides[0]?.frame !== 'feed';
    return `<div class="phone ${story ? 'story' : ''}">
      <div class="ig-head"><img class="avatar" src="/assets/brand/speedpuzzling-logo-square.png" alt=""><b>myspeedpuzzling</b></div>
      <div class="media" data-count="${slides.length}">
        <div class="track">${slides.map(s => s.video ? `<video src="${s.video}" poster="${s.preview}" controls playsinline loop muted preload="none"></video>` : `<img loading="lazy" src="${s.preview}" alt="${s.code}">`).join('')}</div>
        ${slides.length > 1 ? `<span class="count">1/${slides.length}</span>` : ''}
      </div>
      ${slides.length > 1 ? `<div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '<div style="height:8px"></div>'}
      ${story || !CAPTION[key] ? '' : `<p class="cap"><b>myspeedpuzzling</b> ${h(CAPTION[key].slice(0, 100))}… <span class="more">more</span></p>`}
      <p class="codes">${slides.map(s => s.code).join(' · ')}</p>
    </div>`;
  };

  const rate = (target: string, extra: string) => `<div class="rate" data-target="${target}" ${extra}>
      <button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button>
      <textarea placeholder="Why? (optional)" rows="2"></textarea><span class="saved"></span></div>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${labId} design lab</title>
<style>
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik%5Bwght%5D.ttf'); font-weight: 300 900; }
:root { --bg: #f4f5f7; --ink: #1d2230; --muted: #667085; --line: #e3e6eb; --card: #fff; --accent: #4e54c8; --ok: #067647; --bad: #b42318; --mid: #b54708; }
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.5 -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
header { position: sticky; top: 0; z-index: 5; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
header h1 { font: 600 17px Rubik, sans-serif; margin: 0 8px 0 0; }
header a { color: var(--accent); text-decoration: none; font-size: 14px; }
main { padding: 16px; max-width: 1500px; margin: 0 auto; }
.intro { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 18px; max-width: 900px; }
.intro h2 { margin-top: 6px; }
h2 { font: 600 21px Rubik, sans-serif; margin: 30px 0 6px; }
h3 { font: 600 16px Rubik, sans-serif; margin: 22px 0 10px; }
.idea { color: var(--muted); margin: 0 0 12px; max-width: 75ch; }
.row { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; }
.cell { flex: 0 0 auto; }
.label { font: 600 13px Rubik, sans-serif; margin: 0 0 6px; }
.phone { width: 320px; background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.phone.story { width: 230px; }
.ig-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 13px; }
.avatar { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--line); }
.media { position: relative; aspect-ratio: 4/5; overflow: hidden; background: #eee; }
.story .media { aspect-ratio: 9/16; }
.track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.track video { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.count { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; }
.dots { display: flex; justify-content: center; gap: 4px; padding: 6px; } .dots i { width: 6px; height: 6px; border-radius: 50%; background: #cfd4dc; } .dots i.on { background: #3897f0; }
.cap { font-size: 13px; margin: 0 10px 6px; } .more { color: var(--muted); }
.codes { font: 600 12px Rubik, sans-serif; color: var(--accent); margin: 0 10px 10px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 108px); gap: 2px; background: #fff; padding: 2px; border: 1px solid var(--line); border-radius: 8px; width: max-content; }
.grid3 img { width: 108px; aspect-ratio: 3/4; object-fit: cover; display: block; } .grid3 img.real { opacity: .75; }
section.dir { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 4px 18px 18px; margin-top: 22px; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.tile { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #fff; }
.tile a img { width: 100%; display: block; aspect-ratio: 4/5; object-fit: cover; }
.tile.story a img { aspect-ratio: 9/16; }
.tile .code { font: 700 15px Rubik, sans-serif; padding: 8px 10px 0; display: flex; justify-content: space-between; }
.tile .code b { white-space: nowrap; margin-right: 8px; } .tile .code span { text-align: right; font-weight: 400; color: var(--muted); font-size: 12px; }
.rate { padding: 8px 10px 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rate button { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 6px 10px; font: 600 13px Rubik, sans-serif; cursor: pointer; }
.rate button.on[data-r="works"] { background: #e7f6ee; border-color: var(--ok); color: var(--ok); }
.rate button.on[data-r="unsure"] { background: #fef3e6; border-color: var(--mid); color: var(--mid); }
.rate button.on[data-r="no-go"] { background: #fde8e7; border-color: var(--bad); color: var(--bad); }
.rate textarea { width: 100%; font: inherit; font-size: 13px; border: 1px solid var(--line); border-radius: 8px; padding: 6px; }
.rate .saved { font-size: 12px; color: var(--ok); }
.verdict { background: #f7f8fb; border-radius: 12px; margin: 12px 0 16px; }
.verdict .rate textarea { min-height: 54px; }
</style></head><body>
<header><h1>Design lab ${labId.replace('DL', '')}</h1><a href="#how">How it works</a><a href="#compare">Compare</a>${dirs.map(d => `<a href="#${d.id}">${d.id}</a>`).join('')}</header>
<main>
<div class="intro" id="how">
<h2>What you're looking at</h2>
<p><b>A "house style" is the visual look of the posts</b>: layout, colours, type, how charts look and one recognisable
brand device, applied the same way every time so people recognise an MSP post in their feed before they read it.
It's separate from the voice of the captions (that has its own playbook).</p>
${labId === 'DL1' ? `<p>Here, the same content is rendered in nine different styles (D1–D9). Nothing has to be picked as a single winner:
the best result is usually a small system, e.g. one style for the regular feed and others for milestones, events and Stories,
plus single devices borrowed from styles that don't make it.</p>` : `<p>Here each section (F1, F2, …) is a creative post format with a few examples. Tell me which formats
are worth having in the feed, which need work, and which are no-gos.</p>`}
<h3>How to give feedback</h3>
<p>Every slide has a code like <b>D4-3</b>. Under each slide tap <b>Works</b>, <b>Unsure</b> or <b>No-go</b> and, if you like,
write why. Each style also has an overall verdict box. It saves as you go. Or just write codes in the chat
("D4-3 love the spine, D8 no-go, D3-5 too busy").</p>
<p>Images are what followers will see after Instagram's re-encode; tap a slide to open it full size.</p>
</div>

${keys.some(key => dirs.filter(d => d.posts.some(p => p.key === key)).length > 1) ? '<h2 id="compare">Compare side by side</h2>' : ''}
${keys.filter(key => dirs.filter(d => d.posts.some(p => p.key === key)).length > 1).map(key => `<h3>${h(POST_LABEL[key] ?? key)}</h3>
<div class="row">${dirs.filter(d => coded[d.id].some(p => p.key === key)).map(d => `<div class="cell"><p class="label">${d.id} · ${h(d.name)}</p>${phone(coded[d.id].find(p => p.key === key)!.slides as CodedSlide[], key)}</div>`).join('')}</div>`).join('')}

<h3>In the profile grid: each style's covers next to the real latest posts</h3>
<div class="row">${dirs.map(d => {
    const covers = coded[d.id].filter(p => p.slides[0]?.frame === 'feed').map(p => p.slides[0].preview).slice(0, 6);
    const tiles = [...covers, ...realPosts].slice(0, 12);
    return `<div class="cell"><p class="label">${d.id} · ${h(d.name)}</p><div class="grid3">${tiles.map((t, i) => `<img src="${t}" class="${i >= covers.length ? 'real' : ''}" alt="">`).join('')}</div></div>`;
  }).join('')}</div>

${dirs.map(d => `<section class="dir" id="${d.id}">
<h2>${d.id} · ${h(d.name)}</h2><p class="idea">${h(d.idea)}</p>
<div class="verdict"><p class="label" style="padding:10px 10px 0">Your verdict on ${d.id} as a whole</p>${rate(d.id, 'data-kind="direction"')}</div>
<div class="tiles">${coded[d.id].flatMap(p => p.slides.map(s => `<div class="tile ${s.frame !== 'feed' ? 'story' : ''}">
  ${(s as CodedSlide).video ? `<video src="${(s as CodedSlide).video}" poster="${s.preview}" controls playsinline loop muted preload="none" style="width:100%;display:block"></video>` : `<a href="${s.jpg}" target="_blank"><img loading="lazy" src="${s.preview}" alt="${s.code}"></a>`}
  <p class="code"><b>${s.code}</b> <span>${h(POST_LABEL[p.key] ?? p.key)}</span></p>${rate(s.code, `data-kind="slide" data-post="${p.key}"`)}</div>`)).join('')}</div>
</section>`).join('')}
</main>
<script>
document.querySelectorAll('.media').forEach(m => {
  const track = m.querySelector('.track'), count = m.querySelector('.count'), dots = m.parentElement.querySelectorAll('.dots i');
  track.addEventListener('scroll', () => { const i = Math.round(track.scrollLeft / track.clientWidth);
    if (count) count.textContent = (i + 1) + '/' + m.dataset.count; dots.forEach((d, j) => d.classList.toggle('on', j === i)); });
});
const qs = location.search;
async function save(box) {
  const on = box.querySelector('button.on');
  const body = { lab: '${labId}', kind: box.dataset.kind, target: box.dataset.target, post: box.dataset.post, rating: on ? on.dataset.r : null, note: box.querySelector('textarea').value.trim() };
  const r = await fetch('/api/feedback' + qs, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const s = box.querySelector('.saved'); s.textContent = r.ok ? 'saved' : 'not saved'; setTimeout(() => s.textContent = '', 1500);
}
document.querySelectorAll('.rate').forEach(box => {
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    const was = b.classList.contains('on'); box.querySelectorAll('button').forEach(x => x.classList.remove('on')); if (!was) b.classList.add('on'); save(box);
  });
  box.querySelector('textarea').addEventListener('change', () => save(box));
});
fetch('/api/feedback' + (qs ? qs + '&' : '?') + 'lab=${labId}').then(r => r.ok ? r.json() : []).then(rows => {
  const latest = {}; rows.forEach(r => { if (r.target) latest[r.target] = r; });
  document.querySelectorAll('.rate').forEach(box => { const r = latest[box.dataset.target]; if (!r) return;
    if (r.rating) box.querySelector('button[data-r="' + r.rating + '"]')?.classList.add('on'); box.querySelector('textarea').value = r.note || ''; });
});
</script>
</body></html>`;
  writeFileSync(join(ROOT, 'content/labs', labId, 'index.html'), html);
}
