// DL1 review gallery: every direction shown as the owner will meet it, inside an Instagram feed post
// (phone width, carousel with dots, caption cut at "… more") and in the profile grid (3:4 crops next to
// real recent posts). Picks and notes post to the local server and land in content/labs/DL1/feedback.jsonl.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';
import type { Content } from './content.ts';
import type { Manifest } from './run.ts';

const POST_LABEL: Record<string, string> = {
  wall: 'The 59-minute wall (carousel)', record: 'Record hero number', countries: 'Country top 10',
  share: 'Proportion (unit grid)', xp: 'XP card concept: Level 50 club', story: 'Story frames',
};

const CAPTION: Record<string, string> = {
  wall: '58 minutes is the most common finish time for a solo 500. Then the counts drop by 7.4% at the hour. Which side of the wall is your PB?',
  record: '22:30. That is the fastest first attempt ever logged on a 500-piece puzzle on MySpeedPuzzling.',
  countries: 'Denmark, Switzerland and Finland lead on median personal bests for a solo 500.',
  share: 'Three in four results logged on MySpeedPuzzling are 500-piece puzzles.',
  xp: 'Ten puzzlers already reached Level 50, the top level of the new XP system.',
  story: 'Story frames',
};

export function buildGallery(manifest: Manifest, _content: Content) {
  const realPosts = existsSync(join(ROOT, 'var/ig-compression'))
    ? readdirSync(join(ROOT, 'var/ig-compression')).filter(f => f.endsWith('_0.jpg')).sort().reverse().slice(0, 9).map(f => `/var/ig-compression/${f}`)
    : [];
  const dirs = Object.values(manifest).sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));
  const keys = [...new Set(dirs.flatMap(d => d.posts.map(p => p.key)))];

  const feedPost = (dirId: string, key: string, slides: { preview: string; id: string; errors: string[]; frame: string }[]) => {
    const isStory = slides[0]?.frame !== 'feed';
    return `
    <div class="phone ${isStory ? 'story' : ''}">
      <div class="ig-head"><img class="avatar" src="/assets/brand/speedpuzzling-logo-square.png" alt=""><b>myspeedpuzzling</b></div>
      <div class="media" data-count="${slides.length}">
        <div class="track">${slides.map(s => `<img loading="lazy" src="${s.preview}" alt="${h(s.id)}">`).join('')}</div>
        ${slides.length > 1 ? `<span class="count">1/${slides.length}</span>` : ''}
      </div>
      ${slides.length > 1 ? `<div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      ${isStory ? '' : `<p class="cap"><b>myspeedpuzzling</b> ${h(CAPTION[key].slice(0, 110))}… <span class="more">more</span></p>`}
      ${slides.some(s => s.errors.length) ? `<p class="qa">QA: ${slides.reduce((n, s) => n + s.errors.length, 0)} issue(s)</p>` : ''}
    </div>`;
  };

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DL1 design lab</title>
<style>
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik%5Bwght%5D.ttf'); font-weight: 300 900; }
:root { --bg: #f4f5f7; --ink: #1d2230; --muted: #667085; --line: #e3e6eb; --card: #fff; --accent: #4e54c8; }
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
header { position: sticky; top: 0; z-index: 5; background: #fff; border-bottom: 1px solid var(--line); padding: 12px 20px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
header h1 { font: 600 18px/1.2 Rubik, sans-serif; margin: 0 12px 0 0; }
header nav a { color: var(--accent); text-decoration: none; margin-right: 12px; font-size: 14px; }
main { padding: 20px; max-width: 1500px; margin: 0 auto; }
h2 { font: 600 22px Rubik, sans-serif; margin: 36px 0 6px; }
h3 { font: 600 16px Rubik, sans-serif; margin: 22px 0 10px; }
.idea { color: var(--muted); margin: 0 0 14px; max-width: 70ch; }
.row { display: flex; gap: 18px; overflow-x: auto; padding-bottom: 10px; scroll-snap-type: x proximity; }
.cell { flex: 0 0 auto; scroll-snap-align: start; }
.cell > .label { font: 500 13px Rubik, sans-serif; margin: 0 0 6px; color: var(--muted); }
.phone { width: 340px; background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.phone.story { width: 240px; }
.ig-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 13px; }
.avatar { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--line); }
.media { position: relative; aspect-ratio: 4 / 5; overflow: hidden; background: #eee; }
.story .media { aspect-ratio: 9 / 16; }
.track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.count { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; }
.dots { display: flex; justify-content: center; gap: 4px; padding: 6px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: #cfd4dc; }
.dots i.on { background: #3897f0; }
.cap { font-size: 13px; line-height: 1.35; margin: 2px 10px 10px; }
.more { color: var(--muted); }
.qa { margin: 0 10px 10px; font-size: 12px; color: #b42318; }
.grid { display: grid; grid-template-columns: repeat(3, 110px); gap: 2px; width: max-content; background: #fff; padding: 2px; border: 1px solid var(--line); border-radius: 8px; }
.grid img { width: 110px; aspect-ratio: 3 / 4; object-fit: cover; display: block; }
.grid img.real { filter: grayscale(.2) opacity(.85); }
.pick { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 10px 0 0; font-size: 14px; }
.pick textarea { width: min(600px, 100%); height: 54px; font: inherit; }
.pick button { background: var(--accent); color: #fff; border: 0; border-radius: 8px; padding: 8px 14px; font: 600 14px Rubik, sans-serif; cursor: pointer; }
.saved { color: #067647; font-size: 13px; }
section.dir { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 4px 20px 20px; margin-top: 24px; }
</style></head><body>
<header><h1>DL1 · nine visual directions</h1><nav><a href="#compare">Compare side by side</a>${dirs.map(d => `<a href="#${d.id}">${d.id}</a>`).join('')}</nav></header>
<main>
<p class="idea">Same content, rendered in every direction. Images are the Instagram-simulated previews (what followers will see after Instagram's re-encode). Swipe carousels inside each phone. Pick one primary and one secondary direction at the bottom of each section, or leave notes.</p>

<h2 id="compare">Compare side by side</h2>
${keys.map(key => `<h3>${h(POST_LABEL[key] ?? key)}</h3>
<div class="row">${dirs.filter(d => d.posts.some(p => p.key === key)).map(d => `<div class="cell"><p class="label">${d.id} · ${h(d.name)}</p>${feedPost(d.id, key, d.posts.find(p => p.key === key)!.slides)}</div>`).join('')}</div>`).join('')}

<h3>Profile grid: each direction's covers next to the real latest posts</h3>
<div class="row">${dirs.map(d => {
  const covers = d.posts.filter(p => p.slides[0]?.frame === 'feed').map(p => p.slides[0].preview).slice(0, 6);
  const tiles = [...covers, ...realPosts].slice(0, 12);
  return `<div class="cell"><p class="label">${d.id} · ${h(d.name)}</p><div class="grid">${tiles.map((t, i) => `<img src="${t}" class="${i >= covers.length ? 'real' : ''}" alt="">`).join('')}</div></div>`;
}).join('')}</div>

${dirs.map(d => `<section class="dir" id="${d.id}">
<h2>${d.id} · ${h(d.name)}</h2><p class="idea">${h(d.idea)}</p>
<div class="row">${d.posts.map(p => `<div class="cell"><p class="label">${h(POST_LABEL[p.key] ?? p.key)}</p>${feedPost(d.id, p.key, p.slides)}</div>`).join('')}</div>
<form class="pick" data-dir="${d.id}">
  <label><input type="radio" name="verdict" value="primary"> Primary</label>
  <label><input type="radio" name="verdict" value="secondary"> Secondary</label>
  <label><input type="radio" name="verdict" value="keep-device"> Keep one device from it</label>
  <label><input type="radio" name="verdict" value="no"> No</label>
  <textarea name="note" placeholder="What works, what doesn't (optional)"></textarea>
  <button type="submit">Save</button><span class="saved"></span>
</form>
</section>`).join('')}
</main>
<script>
document.querySelectorAll('.media').forEach(m => {
  const track = m.querySelector('.track'), count = m.querySelector('.count'), dots = m.parentElement.querySelectorAll('.dots i');
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (count) count.textContent = (i + 1) + '/' + m.dataset.count;
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
  });
});
document.querySelectorAll('form.pick').forEach(f => f.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(f));
  const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lab: 'DL1', direction: f.dataset.dir, ...data }) });
  f.querySelector('.saved').textContent = r.ok ? 'Saved' : 'Not saved (is tools/review.ts running?)';
}));
</script>
</body></html>`;
  writeFileSync(join(ROOT, 'content/labs/DL1/index.html'), html);
}
