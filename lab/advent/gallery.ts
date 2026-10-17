// AD1 gallery: the Advent of Puzzle lab. Sections: what to look at first, the four door variants side by side per quiz
// type, a mock profile grid of one Advent week mixed with the normal posts, a 7-day Story tray, then every slide with a
// code (AD1-12) and Works / Unsure / No-go + note (POST /api/feedback → content/labs/AD1/feedback.jsonl, latest wins).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';
import type { ManifestPost, ManifestSlide } from './run.ts';

const LAB = 'AD1';
const DIR = join(ROOT, 'content/labs', LAB);
const SECTIONS = ['Doors', 'Answer reveals', 'Announcement', 'Sunday draw', 'Day N of 24', 'Recommended: 300M guess', 'Test Story (Close Friends)'];
type Coded = ManifestSlide & { code: string };

export function buildGallery() {
  const file = join(DIR, 'manifest.json');
  if (!existsSync(file)) return;
  const posts: ManifestPost[] = JSON.parse(readFileSync(file, 'utf8')).posts;
  let n = 0;
  const coded = posts.map(p => ({ ...p, slides: p.slides.map(s => ({ ...s, code: `${LAB}-${++n}` }) as Coded) }));
  const byKey = Object.fromEntries(coded.map(p => [p.key, p]));
  const qa = coded.reduce((s, p) => s + p.slides.reduce((t, x) => t + x.errors.length, 0), 0);

  const rate = (target: string, extra: string) => `<div class="rate" data-target="${h(target)}" ${extra}>
      <button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button>
      <textarea placeholder="Why? (optional)" rows="2"></textarea><span class="saved"></span></div>`;
  const tile = (p: ManifestPost, s: Coded) => `<div class="tile ${s.frame !== 'feed' ? 'story' : ''}">
    <a href="${s.jpg}" target="_blank"><img loading="lazy" src="${s.preview}" alt="${s.code}"></a>
    <p class="code"><b>${s.code}</b> <span>${h(s.id)}</span></p>
    ${s.errors.length ? `<p class="qa">QA: ${s.errors.length} error(s)</p>` : ''}${rate(s.code, `data-kind="slide" data-post="${p.key}"`)}</div>`;
  const phone = (slides: Coded[], caption?: string) => `<div class="phone ${slides[0].frame !== 'feed' ? 'story' : ''}">
      <div class="ig-head"><img class="avatar" src="/assets/brand/speedpuzzling-logo-square.png" alt=""><b>myspeedpuzzling</b></div>
      <div class="media"><div class="track">${slides.map(s => `<img loading="lazy" src="${s.preview}" alt="${s.code}">`).join('')}</div>${slides.length > 1 ? `<span class="count">${slides.length} slides</span>` : ''}</div>
      <p class="codes">${slides.map(s => s.code).join(' · ')}</p>${caption ? `<pre class="cap">${h(caption)}</pre>` : ''}</div>`;

  // Doors compared: one row per quiz type, the four variants side by side.
  const variants = ['V1', 'V2', 'V3', 'V4'].map(v => byKey[`doors-${v}`]).filter(Boolean);
  const types = variants[0]?.slides.map(s => s.id.replace(/^V\d-/, '')) ?? [];
  const compare = types.map(t => `<h3>${h(t.replace(/^d(\d+)-/, 'Day $1 · '))}</h3><div class="row">${variants.map(p => {
    const s = p.slides.find(x => x.id.endsWith(t))!;
    return `<figure><figcaption>${h(p.label)} · ${s.code}</figcaption><a href="${s.jpg}" target="_blank"><img loading="lazy" src="${s.preview}" alt=""></a></figure>`;
  }).join('')}${byKey.reveals ? (() => { const r = byKey.reveals.slides.find(x => x.id.endsWith(t)); return r ? `<figure><figcaption>Next evening: answer · ${r.code}</figcaption><a href="${r.jpg}" target="_blank"><img loading="lazy" src="${r.preview}" alt=""></a></figure>` : ''; })() : ''}</div>`).join('');

  // Profile grid: the Advent week 2 (Mon 7 – Sun 13 Dec) with the normal rhythm, newest first. Normal posts are DL4 H4
  // renders standing in for that week's real posts; the owner's own post is a past photo post.
  const dl4 = (key: string) => { const f = join(ROOT, 'content/labs/DL4/H4/manifest.json'); if (!existsSync(f)) return undefined; const m = JSON.parse(readFileSync(f, 'utf8')); return m.posts.find((p: { key: string }) => p.key === key)?.slides[0]?.preview as string | undefined; };
  const own = '/var/ig-compression/2025-07-29_20_0.jpg';
  const first = (key: string) => byKey[key]?.slides[0]?.preview;
  const grid: Array<{ img?: string; label: string; multi?: boolean; advent?: boolean }> = [
    { img: first('advent-week'), label: 'Sun 13 · Advent week 2 recap + winner', multi: true, advent: true },
    { img: dl4('fun-edges'), label: 'Fri 11 · rotating (funny fact)', multi: true },
    { img: dl4('atlas'), label: 'Wed 9 · data story', multi: true },
    { img: dl4('weekly'), label: 'Mon 7 · Weekly Numbers', multi: true },
    { img: first('advent-week'), label: 'Sun 6 · Advent week 1 recap + winner', multi: true, advent: true },
    { img: existsSync(join(ROOT, own.slice(1))) ? own : undefined, label: 'Fri 4 · your own post' },
    { img: dl4('countries'), label: 'Wed 2 · data story' },
    { img: dl4('weekly'), label: 'Mon 30 Nov · Weekly Numbers', multi: true },
    { img: first('advent-announce'), label: 'Sun 29 Nov · Advent announcement', multi: true, advent: true },
  ];
  const profile = `<div class="profile"><div class="prof-head"><img src="/assets/brand/speedpuzzling-logo-square.png" alt=""><div><b>myspeedpuzzling</b><p>Advent of Puzzle 🧩 Rules in the link</p></div></div>
    <div class="highlights">${['Advent', 'Week 1', 'Week 2', 'Rules'].map(t => `<span><i style="background-image:url('${first('doors-V2') ?? ''}')"></i>${t}</span>`).join('')}</div>
    <div class="pgrid">${grid.map(g => `<div class="t ${g.multi ? 'multi' : ''} ${g.advent ? 'adv' : ''}" title="${h(g.label)}">${g.img ? `<img src="${g.img}" alt="">` : ''}<span>${h(g.label)}</span></div>`).join('')}</div></div>`;

  // Story tray: one evening set per day of week 2 (answer frame + door), Sunday = winner.
  const rev = byKey.reveals?.slides ?? [], v2 = byKey['doors-V2']?.slides ?? [];
  const tray = ['Mon 7', 'Tue 8', 'Wed 9', 'Thu 10', 'Fri 11', 'Sat 12', 'Sun 13'].map((d, i) => {
    const frames = i === 6 ? [rev[5], byKey['advent-sunday-story']?.slides[0]] : i === 0 ? [v2[0]] : [rev[i - 1], v2[i]];
    return `<div class="day"><p class="label">${d} · 19:00${i === 6 ? ' (draw ~19:30)' : ''}</p><div class="frames">${frames.filter(Boolean).map(s => `<img loading="lazy" src="${s!.preview}" alt="${s!.code}" title="${s!.code}">`).join('')}</div></div>`;
  }).join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AD1 Advent of Puzzle</title>
<style>
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik%5Bwght%5D.ttf'); font-weight: 300 900; }
:root { --bg: #f4f5f7; --ink: #1d2230; --muted: #667085; --line: #e3e6eb; --accent: #4e54c8; --ok: #067647; --bad: #b42318; --mid: #b54708; }
* { box-sizing: border-box; } body { margin: 0; font: 15px/1.5 -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
header { position: sticky; top: 0; z-index: 5; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 16px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
header h1 { font: 600 17px Rubik, sans-serif; margin: 0 8px 0 0; } header a { color: var(--accent); text-decoration: none; font-size: 14px; }
main { padding: 16px; max-width: 1560px; margin: 0 auto; }
.intro { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 20px; max-width: 1000px; }
h2 { font: 600 22px Rubik, sans-serif; margin: 30px 0 8px; } h3 { font: 600 16px Rubik, sans-serif; margin: 20px 0 8px; }
.row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px; } .row figure { margin: 0; flex: 0 0 230px; } .row img { width: 230px; border-radius: 10px; display: block; }
figcaption, .label { font: 600 12.5px Rubik, sans-serif; color: var(--accent); margin: 0 0 4px; }
.vars { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; } .var { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; } .var p { margin: 4px 0 8px; font-size: 14px; color: #344054; }
section.sec { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 4px 18px 18px; margin-top: 22px; }
.idea { color: #344054; max-width: 95ch; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.tile { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #fff; } .tile img { width: 100%; display: block; aspect-ratio: 4/5; object-fit: cover; } .tile.story img { aspect-ratio: 9/16; }
.tile .code { font: 700 15px Rubik, sans-serif; padding: 8px 10px 0; display: flex; justify-content: space-between; gap: 8px; margin: 0; } .tile .code span { font-weight: 400; color: var(--muted); font-size: 11.5px; text-align: right; }
.qa { font-size: 11.5px; color: var(--bad); margin: 2px 10px 0; }
.rate { padding: 8px 10px 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rate button { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 6px 10px; font: 600 13px Rubik, sans-serif; cursor: pointer; }
.rate button.on[data-r="works"] { background: #e7f6ee; border-color: var(--ok); color: var(--ok); } .rate button.on[data-r="unsure"] { background: #fef3e6; border-color: var(--mid); color: var(--mid); } .rate button.on[data-r="no-go"] { background: #fde8e7; border-color: var(--bad); color: var(--bad); }
.rate textarea { width: 100%; font: inherit; font-size: 13px; border: 1px solid var(--line); border-radius: 8px; padding: 6px; } .rate .saved { font-size: 12px; color: var(--ok); }
.post { margin-top: 14px; } .post-row { display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap; }
.phone { width: 300px; background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; flex: none; } .phone.story { width: 230px; }
.ig-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 13px; } .avatar { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--line); }
.media { position: relative; aspect-ratio: 4/5; background: #eee; } .story .media { aspect-ratio: 9/16; }
.track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; } .track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.count { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; }
.codes { font: 600 12px Rubik, sans-serif; color: var(--accent); margin: 6px 10px; } .cap { white-space: pre-wrap; font: 12.5px/1.45 -apple-system, sans-serif; margin: 0 10px 10px; color: #344054; }
.profile { width: 400px; background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.prof-head { display: flex; gap: 12px; padding: 12px; align-items: center; font-size: 12.5px; } .prof-head img { width: 64px; height: 64px; border-radius: 50%; border: 1px solid var(--line); } .prof-head p { margin: 2px 0 0; color: var(--muted); }
.highlights { display: flex; gap: 14px; padding: 0 12px 12px; font-size: 11px; text-align: center; } .highlights span { display: grid; gap: 4px; justify-items: center; } .highlights i { width: 54px; height: 54px; border-radius: 50%; border: 2px solid #e3e6eb; background-size: cover; background-position: center 30%; }
.pgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; } .pgrid .t { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #e9ecf1; } .pgrid .t img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pgrid .t span { position: absolute; left: 4px; right: 4px; bottom: 4px; font-size: 10.5px; color: #fff; background: rgba(0,0,0,.6); padding: 1px 6px; border-radius: 8px; } .pgrid .t.adv span { background: #ec726f; color: #1d2433; }
.tray { display: flex; gap: 12px; overflow-x: auto; } .tray .day { flex: none; } .tray .frames { display: flex; gap: 4px; } .tray img { width: 120px; border-radius: 8px; display: block; }
${LAB_NAV_CSS}
</style></head><body>
<header>${labNav(LAB)}<h1>AD1 · Advent of Puzzle</h1><a href="#first">Look at first</a><a href="#compare">Doors compared</a><a href="#feed">Feed + Story tray</a>${SECTIONS.map(s => `<a href="#${s.replace(/\W+/g, '-')}">${h(s)}</a>`).join('')}</header>
<main>
<div class="intro" id="first">
<h2 style="margin-top:6px">What to look at first</h2>
<ol>
<li><b>Doors compared</b> (below): the same six quizzes (week 2, days 7–12) in the four door variants. Pick the variant
(Works / Unsure / No-go on its slides, or write codes like "AD1-14" in the chat). Claude's pick: <b>V2 Calendar board</b>.</li>
<li><b>The feed and the Story tray</b>: one Advent week mixed with the normal rhythm.</li>
<li>The announcement, the Sunday draw and the recommended <b>300M guess</b> (a public dry run of the reply route in early Nov).</li>
<li>The <b>test Story</b> for Close Friends: frames + guides; steps in <code>content/labs/STORY-TEST/instructions.md</code>.</li>
</ol>
<p><b>How answering works in these designs:</b> no sticker on a door. People reply to the Story (a private message the
collector can read through the API); a coral cue sits right above Instagram's reply field. Real numbers from the cached
production queries; <b>placeholders</b>: the seed fingerprints and hashes (fake hex), "@winner_handle",
"@handle_placeholder", ticket counts and every "share right" percentage (sample numbers, labelled on the slides), the
prize line. ${n} slides · QA errors: ${qa}.</p>
</div>

<h2 id="variants">The four door variants</h2>
<div class="vars">${variants.map(p => `<div class="var"><b>${h(p.label)}</b><p>${h(p.note ?? '')}</p>${rate(p.key, 'data-kind="direction"')}</div>`).join('')}</div>

<h2 id="compare">Doors compared, with the next evening's answer</h2>${compare}

<h2 id="feed">One Advent week in the feed and in Stories</h2>
<p class="idea">Week 2 of Advent (Mon 7 – Sun 13 Dec) on the profile, newest first: the normal rhythm keeps Monday's Weekly
Numbers, a midweek data story and a rotating post; the Sunday recap replaces the Saturday community slot; doors live in
Stories (and in an "Advent" highlight). Normal posts are DL4 H4 stand-ins. Below: the Story tray, one evening set per
day (yesterday's answer, then tonight's door; Sunday ends with the winner).</p>
<div class="post-row">${profile}<div style="flex:1; min-width:300px"><div class="tray">${tray}</div></div></div>

${SECTIONS.map(sec => {
    const ps = coded.filter(p => p.section === sec);
    if (!ps.length) return '';
    return `<section class="sec" id="${sec.replace(/\W+/g, '-')}"><h2>${h(sec)}</h2>${ps.map(p => `<div class="post"><h3>${h(p.label)}</h3>${p.note ? `<p class="idea">${h(p.note)}</p>` : ''}
      <div class="post-row">${p.caption || p.slides.length > 1 ? phone(p.slides, p.caption) : ''}<div class="tiles" style="flex:1; min-width:260px">${p.slides.map(s => tile(p, s)).join('')}</div></div></div>`).join('')}</section>`;
  }).join('')}
</main>
<script>
const qs = location.search;
async function save(box) {
  const on = box.querySelector('button.on');
  const body = { lab: '${LAB}', kind: box.dataset.kind, target: box.dataset.target, post: box.dataset.post, rating: on ? on.dataset.r : null, note: box.querySelector('textarea').value.trim() };
  const r = await fetch('/api/feedback' + qs, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const s = box.querySelector('.saved'); s.textContent = r.ok ? 'saved' : 'not saved'; setTimeout(() => s.textContent = '', 1500);
}
document.querySelectorAll('.rate').forEach(box => {
  box.querySelectorAll('button').forEach(b => b.onclick = () => { const was = b.classList.contains('on'); box.querySelectorAll('button').forEach(x => x.classList.remove('on')); if (!was) b.classList.add('on'); save(box); });
  box.querySelector('textarea').addEventListener('change', () => save(box));
});
fetch('/api/feedback' + (qs ? qs + '&' : '?') + 'lab=${LAB}').then(r => r.ok ? r.json() : []).then(rows => {
  const latest = {}; rows.forEach(r => { if (r.target) latest[r.target] = r; });
  document.querySelectorAll('.rate').forEach(box => { const r = latest[box.dataset.target]; if (!r) return;
    if (r.rating) box.querySelector('button[data-r="' + r.rating + '"]')?.classList.add('on'); box.querySelector('textarea').value = r.note || ''; });
});
</script>
</body></html>`;
  writeFileSync(join(DIR, 'index.html'), html);
}

if (import.meta.main) buildGallery();
