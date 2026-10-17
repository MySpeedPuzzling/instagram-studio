// DL4 gallery: the house variants side by side. Sections: what each variant does differently, a mock profile grid
// per variant (4 weeks of 3 posts, one of them the owner's own photo post), side-by-side compares of key posts, then
// every slide of every variant with a code (H2-14) and Works / Unsure / No-go + note. Feedback posts to the review
// server and lands in content/labs/DL4/feedback.jsonl (latest entry per target wins).
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GROUNDS, SERIES_GROUND, SERIES_NAME, SERIES_OF, VARIANTS, type Series } from '../../src/design/house.ts';
import { escapeHtml as h } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';
import type { ManifestDirection, ManifestSlide } from '../dl1/run.ts';

const LAB = 'DL4';
const LAB_DIR = join(ROOT, 'content/labs', LAB);

export const POST_LABEL: Record<string, string> = {
  wall: 'The 59-minute wall', record: 'Record: fastest first try', countries: 'Fastest countries', share: '3 in 4 results are 500s',
  xp: 'The Level 50 club', weekly: 'The Weekly Numbers', event: 'Event preview: Wisconsin', feature: 'XP launch day', month: 'Record September',
  'sep-wall': 'September box wall', 'sep-mosaic': 'September in 1,000 puzzles', 'week-wall': 'Last week\'s puzzle wall', 'event-collage': 'Event collage (your photos)',
  potw: 'Puzzle of the week', guess: 'Guess the puzzle', faster: 'Which is faster?',
  atlas: 'Puzzle atlas', 'cats-dogs': 'Cats vs dogs', 'tier-list': 'Subject tier list', museum: 'Museum of most-solved',
  'clocks-back': 'Clocks go back', 'night-owls': 'Night owls', 'missing-piece': 'The missing piece', '75-years': '75 years of puzzling',
  'fun-minute-58': 'Funny fact: minute 58', 'fun-unboxed': 'Funny fact: unboxed', 'fun-1000': 'Funny fact: twice the pieces', 'fun-edges': 'Funny fact: edges first / last',
  'fun-sky': 'Funny fact: sorting the sky', 'fun-halloween': 'Funny fact: Halloween',
  'story-chapters': 'Story: six chapters', 'story-quiz': 'Story: quiz', 'reel-wall': 'Reel: the 59-minute wall', 'reel-sep': 'Reel: September top 5',
  'reel-counter': 'Reel: pieces counter', 'reel-xp': 'Reel: XP and levels (feature reveal)',
};

const FAMILY_OF = (key: string) =>
  key.startsWith('k1-navy') ? 'Navy: brand vs deep' : key.startsWith('k1-seam') ? 'Poster seam shapes' : key.startsWith('k1-fun') ? 'Funny-facts poster colour' :
  key.startsWith('reel-') ? 'Reels' : key.startsWith('story-') ? 'Stories' : key.startsWith('fun-') || ['clocks-back', 'night-owls', 'missing-piece', '75-years'].includes(key) ? 'Funny facts & timely stories'
    : ['sep-wall', 'sep-mosaic', 'week-wall', 'event-collage', 'potw', 'guess', 'faster'].includes(key) ? 'Image formats (DL2)'
    : ['atlas', 'cats-dogs', 'tier-list', 'museum'].includes(key) ? 'Ideas (DL3)' : key.startsWith('j1-') ? 'Approaches' : 'Data posts (DL1)';
const FAMILIES = ['Navy: brand vs deep', 'Poster seam shapes', 'Funny-facts poster colour', 'Data posts (DL1)', 'Image formats (DL2)', 'Ideas (DL3)', 'Funny facts & timely stories', 'Stories', 'Reels', 'Approaches'];

/** Four weeks, three posts a week, oldest first; null = the owner's own photo post. */
const GRID_WEEKS: Array<Array<string | null>> = [
  ['weekly', 'fun-edges', 'atlas'],
  ['potw', 'reel-wall', 'record'],
  ['month', null, 'cats-dogs'],
  ['event', 'fun-minute-58', 'sep-mosaic'],
];
/** Posts shown side by side in the three variants. */
const COMPARE = ['wall', 'weekly', 'record', 'sep-mosaic', 'potw', 'atlas', 'fun-edges', 'clocks-back', 'story-chapters', 'reel-xp'];

type Coded = ManifestSlide & { code: string };
function coded(d: ManifestDirection) {
  let n = 0;
  return d.posts.map(p => ({ key: p.key, label: p.label, slides: p.slides.map(s => ({ ...s, code: `${d.id}-${++n}` }) as Coded) }));
}

function readDirs(): ManifestDirection[] {
  if (!existsSync(LAB_DIR)) return [];
  return readdirSync(LAB_DIR).filter(d => /^[A-Z]\d+$/.test(d) && existsSync(join(LAB_DIR, d, 'manifest.json')))
    .map(d => JSON.parse(readFileSync(join(LAB_DIR, d, 'manifest.json'), 'utf8')) as ManifestDirection)
    .sort((a, b) => a.id.localeCompare(b.id));
}

const label = (key: string, fallback?: string) => fallback ?? POST_LABEL[key] ?? key;

export function buildGallery() {
  const dirs = readDirs();
  // The chosen house style (H4, owner 2026-10-17) leads; H1–H3 stay as reference.
  const ORDER = ['H4', 'H1', 'H2', 'H3'];
  const variants = dirs.filter(d => d.id in VARIANTS).sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  const extras = dirs.filter(d => !(d.id in VARIANTS));
  const byId = Object.fromEntries(dirs.map(d => [d.id, coded(d)]));
  const ownPosts = existsSync(join(ROOT, 'var/ig-compression'))
    ? readdirSync(join(ROOT, 'var/ig-compression')).filter(f => f.endsWith('_0.jpg')).sort().reverse().map(f => `/var/ig-compression/${f}`) : [];
  const totalSlides = (id: string) => (byId[id] ?? []).reduce((s, p) => s + p.slides.length, 0);
  const qaErrors = dirs.reduce((s, d) => s + d.posts.reduce((t, p) => t + p.slides.reduce((u, sl) => u + sl.errors.length, 0), 0), 0);

  const media = (s: Coded, cls = '') => s.video
    ? `<video class="${cls}" src="${s.video}" poster="${s.preview}" controls playsinline loop muted preload="none"></video>`
    : `<img class="${cls}" loading="lazy" src="${s.preview}" alt="${s.code}">`;

  const phone = (slides: Coded[], key: string) => {
    const tall = slides[0]?.frame !== 'feed';
    return `<div class="phone ${tall ? 'story' : ''}">
      <div class="ig-head"><img class="avatar" src="/assets/brand/speedpuzzling-logo-square.png" alt=""><b>myspeedpuzzling</b></div>
      <div class="media" data-count="${slides.length}"><div class="track">${slides.map(s => media(s)).join('')}</div>
        ${slides.length > 1 ? `<span class="count">1/${slides.length}</span>` : ''}</div>
      ${slides.length > 1 ? `<div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '<div style="height:8px"></div>'}
      <p class="codes">${slides.map(s => s.code).join(' · ')}</p>
    </div>`;
  };

  const rate = (target: string, extra: string) => `<div class="rate" data-target="${h(target)}" ${extra}>
      <button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button>
      <textarea placeholder="Why? (optional)" rows="2"></textarea><span class="saved"></span></div>`;

  // Profile grid: newest first, 3 per row (Instagram's 3:4 grid crop of 4:5 posts and 9:16 Reel covers).
  const profile = (id: string) => {
    const posts = byId[id] ?? [];
    let own = 0;
    const tiles = GRID_WEEKS.flat().reverse().map(key => {
      if (key === null) {
        const img = ownPosts[own++];
        return img ? `<div class="t own"><img src="${img}" alt=""><span>your photo post</span></div>` : '<div class="t own ph"><span>your photo post</span></div>';
      }
      const p = posts.find(q => q.key === key);
      if (!p) return `<div class="t ph"><span>${h(label(key))}<br>(not rendered yet)</span></div>`;
      const s = p.slides[0];
      return `<div class="t ${p.slides.length > 1 ? 'multi' : ''} ${s.video ? 'reel' : ''}" title="${h(label(key, p.label))} · ${s.code}"><img src="${s.preview}" alt="${s.code}"></div>`;
    }).join('');
    const v = VARIANTS[id as keyof typeof VARIANTS];
    return `<div class="cell"><p class="label">${id} · ${h(v.name)}</p>
      <div class="profile"><div class="prof-head"><img src="/assets/brand/speedpuzzling-logo-square.png" alt=""><div><b>myspeedpuzzling</b><p>MySpeedPuzzling · speed puzzling community<br>Times, rankings and stats for puzzlers</p></div></div>
      <div class="pgrid">${tiles}</div></div></div>`;
  };

  const swatch = (k: keyof typeof GROUNDS) => `<i class="gsw" style="background:${GROUNDS[k].bg}" title="${k}"></i>`;
  const seriesRow = (Object.keys(SERIES_GROUND) as Series[]).map(s => `<span class="ser">${swatch(SERIES_GROUND[s])}${h(SERIES_NAME[s])}</span>`).join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DL4 house system</title>
<style>
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik%5Bwght%5D.ttf'); font-weight: 300 900; }
:root { --bg: #f4f5f7; --ink: #1d2230; --muted: #667085; --line: #e3e6eb; --card: #fff; --accent: #4e54c8; --ok: #067647; --bad: #b42318; --mid: #b54708; }
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.5 -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
header { position: sticky; top: 0; z-index: 5; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 16px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
header h1 { font: 600 17px Rubik, sans-serif; margin: 0 8px 0 0; }
header a { color: var(--accent); text-decoration: none; font-size: 14px; }
main { padding: 16px; max-width: 1560px; margin: 0 auto; }
.intro { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 20px; max-width: 980px; }
h2 { font: 600 22px Rubik, sans-serif; margin: 30px 0 8px; }
h3 { font: 600 16px Rubik, sans-serif; margin: 22px 0 10px; }
.vars { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-top: 12px; }
.var { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; }
.var h3 { margin: 4px 0 6px; } .var p { margin: 0 0 8px; color: #344054; font-size: 14px; }
.gsw { display: inline-block; width: 18px; height: 18px; border-radius: 4px; margin-right: 6px; vertical-align: -4px; border: 1px solid rgba(0,0,0,.12); }
.ser { display: inline-block; margin: 0 14px 6px 0; font-size: 13px; }
.row { display: flex; gap: 18px; overflow-x: auto; padding-bottom: 10px; align-items: flex-start; }
.cell { flex: 0 0 auto; }
.label { font: 600 13px Rubik, sans-serif; margin: 0 0 6px; }
.phone { width: 300px; background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.phone.story { width: 220px; }
.ig-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 13px; }
.avatar { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--line); }
.media { position: relative; aspect-ratio: 4/5; overflow: hidden; background: #eee; }
.story .media { aspect-ratio: 9/16; }
.track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.track img, .track video { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.count { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; }
.dots { display: flex; justify-content: center; gap: 4px; padding: 6px; } .dots i { width: 6px; height: 6px; border-radius: 50%; background: #cfd4dc; } .dots i.on { background: #3897f0; }
.codes { font: 600 12px Rubik, sans-serif; color: var(--accent); margin: 0 10px 10px; }
.profile { width: 390px; background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.prof-head { display: flex; gap: 12px; padding: 12px; align-items: center; font-size: 12.5px; } .prof-head img { width: 64px; height: 64px; border-radius: 50%; border: 1px solid var(--line); }
.prof-head p { margin: 2px 0 0; color: var(--muted); }
.pgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.pgrid .t { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #e9ecf1; }
.pgrid .t img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pgrid .t.multi::after { content: ''; position: absolute; top: 6px; right: 6px; width: 12px; height: 12px; border: 2px solid #fff; border-radius: 2px; box-shadow: 2px -2px 0 -0px rgba(255,255,255,.8); }
.pgrid .t.reel::after { content: '▶'; position: absolute; top: 4px; right: 7px; color: #fff; font-size: 12px; text-shadow: 0 0 3px rgba(0,0,0,.6); }
.pgrid .t span { position: absolute; left: 6px; bottom: 6px; font-size: 11px; color: #fff; background: rgba(0,0,0,.55); padding: 1px 6px; border-radius: 8px; }
.pgrid .t.ph { display: grid; place-items: center; } .pgrid .t.ph span { position: static; background: none; color: var(--muted); text-align: center; }
section.dir { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 4px 18px 18px; margin-top: 22px; }
.idea { color: #344054; margin: 0 0 12px; max-width: 90ch; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.tile { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #fff; }
.tile a img, .tile video { width: 100%; display: block; aspect-ratio: 4/5; object-fit: cover; }
.tile.story a img, .tile.story video { aspect-ratio: 9/16; }
.tile .code { font: 700 15px Rubik, sans-serif; padding: 8px 10px 0; display: flex; justify-content: space-between; gap: 8px; }
.tile .code span { text-align: right; font-weight: 400; color: var(--muted); font-size: 12px; }
.qa { font-size: 11.5px; color: var(--bad); margin: 2px 10px 0; }
.rate { padding: 8px 10px 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rate button { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 6px 10px; font: 600 13px Rubik, sans-serif; cursor: pointer; }
.rate button.on[data-r="works"] { background: #e7f6ee; border-color: var(--ok); color: var(--ok); }
.rate button.on[data-r="unsure"] { background: #fef3e6; border-color: var(--mid); color: var(--mid); }
.rate button.on[data-r="no-go"] { background: #fde8e7; border-color: var(--bad); color: var(--bad); }
.rate textarea { width: 100%; font: inherit; font-size: 13px; border: 1px solid var(--line); border-radius: 8px; padding: 6px; }
.rate .saved { font-size: 12px; color: var(--ok); }
.verdict { background: #f7f8fb; border-radius: 12px; margin: 12px 0 16px; }
details.fam { margin-top: 10px; } details.fam > summary { cursor: pointer; font: 600 16px Rubik, sans-serif; padding: 8px 0; }
${LAB_NAV_CSS}
</style></head><body>
<header>${labNav(LAB)}<h1>DL4 · house system</h1><a href="#how">How it works</a><a href="#variants">Variants</a><a href="#grids">Profile grids</a><a href="#compare">Compare</a>${dirs.map(d => `<a href="#${d.id}">${d.id}</a>`).join('')}</header>
<main>
<div class="intro" id="how">
<h2 style="margin-top:6px">What you're looking at</h2>
<p><b>New (17 Oct):</b> <b>H4</b> combines H1 and H2 as you asked (navy boards, puzzle posters only on covers and big
facts, one navy, white + grey text with coral highlights, poster colour by type of post). <b>K1</b> at the bottom shows
the open choices side by side: brand navy vs deep navy, five seam shapes, and the funny-facts poster colour. Mark the
ones you want with Works.</p>
<p>One shared <b>house module</b> (grounds, type, header with one brand device, the outlined logo ≈ 1.5× bigger, chart colours,
slashed-zero times) and <b>three variants</b> built on it. All approved content from DL1, DL2 and DL3 is in every variant;
the layouts are the same, only the design system differs, so you can compare like for like. Funny facts and timely
stories are restyled away from the AI look (J1 shows alternative drawing approaches per joke). Stories use the D9
chapter idea; Reels fill the whole 9:16 frame.</p>
<p><b>How to give feedback:</b> each variant has an overall verdict box; every slide has a code (e.g. <b>H2-14</b>) with
Works / Unsure / No-go and a note. It saves as you go. Or write codes in the chat. Images are what followers see after
Instagram's re-encode; tap a slide for full size. ${totalSlides('H1') + totalSlides('H2') + totalSlides('H3')} slides in the three variants · QA errors: ${qaErrors}.</p>
</div>

<h2 id="variants">What each variant does differently</h2>
<div class="vars">${variants.map(d => {
    const v = VARIANTS[d.id as keyof typeof VARIANTS];
    const grounds = d.id === 'H4' ? [swatch('navy'), swatch('sky'), swatch('indigo'), swatch('coral'), swatch('ocean')].join('') : d.id === 'H1' ? [swatch('navy'), swatch('navyDeep')].join('') : d.id === 'H2' ? [swatch('navy'), swatch('navyDeep'), swatch('coral'), swatch('sky'), swatch('indigo'), swatch('ocean')].join('') : '';
    return `<div class="var"><h3>${d.id} · ${h(v.name)}</h3><p>${h(v.idea)}</p>${d.id === 'H3' ? `<p>${seriesRow}</p>` : `<p>${grounds}</p>`}<p style="color:var(--muted)">${totalSlides(d.id)} slides</p></div>`;
  }).join('')}</div>

<h2 id="grids">The feed as a whole: 4 weeks per variant</h2>
<p class="idea">Newest top left, three posts a week (Mon/Wed/Fri), one of them your own photo post (a real past post as the stand-in). Tiles are Instagram's 3:4 grid crop.</p>
<div class="row">${variants.map(d => profile(d.id)).join('')}</div>

<h2 id="compare">Compare side by side</h2>
${COMPARE.filter(k => variants.some(d => byId[d.id].some(p => p.key === k))).map(k => `<h3>${h(label(k))}</h3>
<div class="row">${variants.filter(d => byId[d.id].some(p => p.key === k)).map(d => `<div class="cell"><p class="label">${d.id} · ${h(VARIANTS[d.id as keyof typeof VARIANTS].name)}</p>${phone(byId[d.id].find(p => p.key === k)!.slides, k)}</div>`).join('')}</div>`).join('')}

${[...variants, ...extras].map(d => `<section class="dir" id="${d.id}">
<h2>${d.id} · ${h(d.name)}</h2><p class="idea">${h(d.idea)}</p>
<div class="verdict"><p class="label" style="padding:10px 10px 0">Your verdict on ${d.id} as a whole</p>${rate(d.id, 'data-kind="direction"')}</div>
${FAMILIES.filter(f => byId[d.id].some(p => FAMILY_OF(p.key) === f)).map(f => `<details class="fam" open><summary>${h(f)}</summary>
<div class="tiles">${byId[d.id].filter(p => FAMILY_OF(p.key) === f).flatMap(p => p.slides.map(s => `<div class="tile ${s.frame !== 'feed' ? 'story' : ''}">
  ${s.video ? media(s) : `<a href="${s.jpg}" target="_blank">${media(s)}</a>`}
  <p class="code"><b>${s.code}</b> <span>${h(label(p.key, p.label))}${SERIES_OF[p.key] ? ` · ${h(SERIES_NAME[SERIES_OF[p.key]])}` : ''}</span></p>
  ${s.errors.length ? `<p class="qa">QA: ${s.errors.length} error(s)</p>` : ''}${rate(s.code, `data-kind="slide" data-post="${p.key}"`)}</div>`)).join('')}</div></details>`).join('')}
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
  const body = { lab: '${LAB}', kind: box.dataset.kind, target: box.dataset.target, post: box.dataset.post, rating: on ? on.dataset.r : null, note: box.querySelector('textarea').value.trim() };
  const r = await fetch('/api/feedback' + qs, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const s = box.querySelector('.saved'); s.textContent = r.ok ? 'saved' : 'not saved'; setTimeout(() => s.textContent = '', 1500);
}
document.querySelectorAll('.rate').forEach(box => {
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    const was = b.classList.contains('on'); box.querySelectorAll('button').forEach(x => x.classList.remove('on')); if (!was) b.classList.add('on'); save(box);
  });
  box.querySelector('textarea').addEventListener('change', () => save(box));
});
fetch('/api/feedback' + (qs ? qs + '&' : '?') + 'lab=${LAB}').then(r => r.ok ? r.json() : []).then(rows => {
  const latest = {}; rows.forEach(r => { if (r.target) latest[r.target] = r; });
  document.querySelectorAll('.rate').forEach(box => { const r = latest[box.dataset.target]; if (!r) return;
    if (r.rating) box.querySelector('button[data-r="' + r.rating + '"]')?.classList.add('on'); box.querySelector('textarea').value = r.note || ''; });
});
</script>
</body></html>`;
  writeFileSync(join(LAB_DIR, 'index.html'), html);
}

if (import.meta.main) buildGallery();
