// "Which puzzle is this piece from?" (weekend quiz, Halloween edition, owner 2026-10-30; structure A chosen the same
// day): facts, the pieces cut from the box picture with the generator (src/pieces/jigsaw.ts), the carousel slides
// (A zoom-out hints, B the owner's shorter sketch, kept for reference) and the teaser Story. Shared by lab PQ1
// (lab/piece-quiz/run.ts) and the teaser animation (src/motion/story-piece-quiz.ts). Facts from `quiz-piece-halloween`
// (cached; run it with --fresh on the day).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CW, HOUSE, STICKER_STORY_ROWS, X0, artCover, f1, frame, slide, type SlideCtx } from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';
import { query } from '../data/db.ts';
import { boxPaths } from '../data/boxes.ts';
import { generateJigsaw, type Jigsaw } from '../pieces/jigsaw.ts';
import { ROOT } from '../render/server.ts';

const rel = (p: string) => '/' + p.slice(ROOT.length + 1);
export const POST = 'fun-halloween'; // timely story: coral poster (standing feedback, poster colour by type)

// ---------------------------------------------------------------- facts
export const q = query('quiz-piece-halloween');
const rows = q.rows;
const find = (name: string) => {
  const r = rows.find(x => x.puzzle === name);
  if (!r) throw new Error(`${name} missing from quiz-piece-halloween`);
  return { puzzle: r.puzzle, brand: r.brand, pieces: +r.pieces, image: r.image, solvers: +r.solvers, results: +r.results, medianS: +r.median_solo_s, fastestS: +r.fastest_solo_s, month: +r.results_this_month };
};
export const ans = find('Fantasy Mystic Witch');
// Look-alike options from the same brand, so the "Mystery puzzle · Ravensburger" credit gives nothing away.
export const options = [find('Happy Halloween'), ans, find('Pumpkins')];
const day = q.queried_at.slice(0, 10);
export const SRC = `Box: Ravensburger · data ${day}`;
const sec = (s: number) => fmtDuration(s / 60);

// The original picture (1500 px) when cached, else the 1200 px preset.
const orig = join(ROOT, 'content/cache/boxes/original', ans.image.replace(/\.\w+$/, '.jpg'));
export const IMG = existsSync(orig) ? { url: rel(orig), w: 1500, h: 1103 } : { url: boxPaths(ans.image).url, w: 1200, h: 882 };
export const JIG: Jigsaw = generateJigsaw({ cols: 12, rows: 9, width: IMG.w, height: IMG.h, seed: 31 });
export const at = (c: number, r: number) => JIG.pieces.find(p => p.col === c && p.row === r)!;
export const PIECE: [number, number] = [6, 4]; // the potion splash above the cauldron
export const NEIGH: Array<[number, number]> = [[5, 4], [6, 4], [6, 5]];
export const CHUNK: Array<[number, number]> = [5, 6, 7].flatMap(c => [3, 4, 5].map(r => [c, r] as [number, number]));

// ---------------------------------------------------------------- piece art
let uid = 0;
type Box = { x: number; y: number; w: number; h: number };
/** Scale and offset that fit the selected pieces (pulled apart by `gap`) into a box. */
export function fitOf(sel: Array<[number, number]>, box: Box, gap = 0) {
  const ps = sel.map(([c, r]) => at(c, r));
  const cc = ps.reduce((s, p) => s + p.col, 0) / ps.length, rc = ps.reduce((s, p) => s + p.row, 0) / ps.length;
  const off = (p: typeof ps[0]) => [(p.col - cc) * gap, (p.row - rc) * gap];
  const x0 = Math.min(...ps.map(p => p.bbox.x + off(p)[0])), y0 = Math.min(...ps.map(p => p.bbox.y + off(p)[1]));
  const x1 = Math.max(...ps.map(p => p.bbox.x + p.bbox.width + off(p)[0])), y1 = Math.max(...ps.map(p => p.bbox.y + p.bbox.height + off(p)[1]));
  const s = Math.min(box.w / (x1 - x0), box.h / (y1 - y0));
  return { ps, off, s, tx: box.x + (box.w - (x1 - x0) * s) / 2 - x0 * s, ty: box.y + (box.h - (y1 - y0) * s) / 2 - y0 * s };
}
/** Selected pieces cut from the picture, fitted into a box (absolute SVG), with a soft shadow; `gap` pulls them apart. */
export function pieces(sel: Array<[number, number]>, box: Box, gap = 0): string {
  const { ps, off, s, tx, ty } = fitOf(sel, box, gap);
  const id = `pq${uid++}`;
  return `<svg width="1080" height="1350" style="position:absolute; left:0; top:0; overflow:visible" aria-hidden="true">
    <defs><filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="${f1(14)}" stdDeviation="14" flood-color="#0a0e18" flood-opacity="0.55"/></filter>
    ${ps.map((p, i) => `<clipPath id="${id}c${i}"><path d="${p.d}"/></clipPath>`).join('')}</defs>
    <g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})">
    ${ps.map((p, i) => { const [dx, dy] = off(p); return `<g transform="translate(${f1(dx)} ${f1(dy)})" filter="url(#${id}s)"><g clip-path="url(#${id}c${i})"><image href="${IMG.url}" width="${IMG.w}" height="${IMG.h}"/></g>
      <path d="${p.d}" fill="none" stroke="rgba(10,14,24,0.45)" stroke-width="${f1(1.6 / s * 2)}"/></g>`; }).join('')}
    </g></svg>`;
}
/** The whole picture with the quiz piece marked in coral and the rest dimmed. */
export function reveal(box: { x: number; y: number; w: number }): string {
  const s = box.w / IMG.w, hgt = IMG.h * s, p = at(...PIECE);
  return `<svg width="${box.w}" height="${f1(hgt)}" viewBox="0 0 ${IMG.w} ${IMG.h}" style="position:absolute; left:${box.x}px; top:${box.y}px; border-radius:6px" aria-hidden="true">
    <image href="${IMG.url}" width="${IMG.w}" height="${IMG.h}"/>
    <path d="M0 0 H${IMG.w} V${IMG.h} H0 Z ${p.d}" fill="rgba(10,14,24,0.42)" fill-rule="evenodd"/>
    <path d="${p.d}" fill="none" stroke="var(--c-hot, #ff6f61)" stroke-width="${f1(7 / s)}"/></svg>`;
}

export const CSS = `<style>
.pq-note { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 40px; font-weight: 600; color: var(--g-ink); }
.pq-note b { color: var(--g-hot); }
.pq-cred { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 30px; color: var(--g-soft); }
.pq-opt { position: absolute; left: ${X0}px; width: ${CW}px; height: 150px; display: flex; align-items: center; border-top: 2px solid var(--g-rule); }
.pq-opt .l { width: 110px; font-size: 84px; font-weight: 800; color: var(--g-hot); }
.pq-opt .n { font-size: 54px; font-weight: 700; color: var(--g-ink); line-height: 1.1; }
.pq-opt .s { font-size: 30px; color: var(--g-soft); margin-top: 6px; }
.pq-warn { position: absolute; left: ${X0}px; width: ${CW}px; text-align: center; }
.pq-steps { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; gap: 22px; justify-content: center; }
.pq-steps span { width: 120px; height: 120px; border-radius: 60px; border: 4px solid var(--g-rule); display: grid; place-items: center; font-size: 60px; font-weight: 800; color: var(--g-ink); }
</style>`;
const credit = (top: number) => `<p class="pq-cred" style="top:${top}px">Mystery puzzle · Ravensburger</p>`;
const ask = `Comment your guess and the slide where you knew it.`;
const warnIcon = (cx: number, top: number, size = 170) => `<svg width="${size}" height="${f1(size * 0.9)}" viewBox="0 0 100 90" style="position:absolute; left:${f1(cx - size / 2)}px; top:${top}px" aria-hidden="true">
  <path d="M50 4 L96 86 H4 Z" fill="var(--g-hot)" stroke="var(--g-hot)" stroke-width="6" stroke-linejoin="round"/>
  <rect x="45" y="30" width="10" height="32" rx="4" fill="var(--g-bg)"/><circle cx="50" cy="73" r="6" fill="var(--g-bg)"/></svg>`;

// ---------------------------------------------------------------- slides
export type Out = { key: string; label: string; html: string; story?: boolean };
export const kick = 'Halloween quiz';

export function structureA(): Out[] {
  const n = 7, c = (i: number): SlideCtx => ({ v: HOUSE, post: POST, slide: i, of: n });
  return [
    { key: 'A-1', label: 'Cover: one piece', html: artCover(c(1), { kicker: kick, title: 'One piece. Which spooky puzzle is it from?', src: 'Guess before you swipe →',
      art: band => CSS + pieces([PIECE], { x: 300, y: band.top + 10, w: 480, h: band.bottom - band.top - 100 }) + credit(band.bottom - 50) }) },
    { key: 'A-2', label: 'Hint 1: its neighbours + puzzlers', html: slide(c(2), 'quiz', { kicker: `${kick} · hint 1`, src: 'Still not sure? Swipe for a bigger piece →', title: 'Hint 1: its neighbours.',
      body: CSS + pieces(NEIGH, { x: 190, y: 300, w: 700, h: 640 }, 26) + `<p class="pq-note" style="top:1010px"><b>${fmtInt(ans.solvers)}</b> MySpeedPuzzling puzzlers have solved it.</p>` + credit(1080) }).html },
    { key: 'A-3', label: 'Hint 2: a 3×3 chunk', html: slide(c(3), 'quiz', { kicker: `${kick} · hint 2`, src: 'Last hint on the next slide →', title: 'Hint 2: a bigger corner.',
      body: CSS + pieces(CHUNK, { x: 150, y: 290, w: 780, h: 720 }, 10) + `<p class="pq-note" style="top:1050px">Logged <b>${fmtInt(ans.results)}</b> times on MySpeedPuzzling.</p>` }).html },
    { key: 'A-4', label: 'Hint 3: three options', html: slide(c(4), 'quiz', { kicker: `${kick} · hint 3`, src: 'Lock in your answer →', title: 'Hint 3: it is one of these.',
      body: CSS + options.map((o, i) => `<div class="pq-opt" style="top:${430 + i * 190}px"><span class="l">${'ABC'[i]}</span><div><p class="n">${h(o.puzzle)}</p><p class="s">Ravensburger · ${fmtInt(o.pieces)} pieces</p></div></div>`).join('')
        + `<p class="pq-note" style="top:1030px; font-weight:500; color:var(--g-soft)">All three are Ravensburger Halloween puzzles.</p>` }).html },
    { key: 'A-5', label: 'Spoiler alert', html: slide(c(5), 'quiz', { kicker: `${kick} · spoiler alert`, src: 'The answer is on the next slide →',
      body: CSS + warnIcon(540, 220) + `<h1 class="h-title xl pq-warn" style="top:420px">Spoiler alert</h1>
        <p class="h-lead pq-warn" style="top:560px">${h(ask)}</p>
        <div class="pq-steps" style="top:760px">${[1, 2, 3, 4].map(i => `<span>${i}</span>`).join('')}</div>
        <p class="h-body pq-warn" style="top:930px">1 = from the single piece. 4 = the options gave it away.</p>` }).html },
    { key: 'A-6', label: 'Answer: the picture, piece marked', html: slide(c(6), 'image', { kicker: `${kick} · the answer`, src: SRC, title: `${ans.puzzle}.`,
      body: CSS + `<p class="h-dek h-abs" style="top:280px">Ravensburger · ${fmtInt(ans.pieces)} pieces. The piece was the potion splash above the cauldron.</p>` + reveal({ x: X0, y: 420, w: CW }) }).html },
    { key: 'A-7', label: 'The numbers + ask', html: slide(c(7), 'data', { kicker: `${kick} · the numbers`, src: SRC, title: 'The most-solved Halloween puzzle on MySpeedPuzzling.',
      body: CSS + pieces([PIECE], { x: 780, y: 470, w: 200, h: 200 }) + `<div class="h-abs h-strip" style="top:500px; width:640px"><div><p class="k">Puzzlers</p><p class="v">${fmtInt(ans.solvers)}</p></div><div><p class="k">Solves</p><p class="v">${fmtInt(ans.results)}</p></div></div>
        <div class="h-abs h-strip" style="top:700px"><div><p class="k">Typical solo</p><p class="v">${sec(ans.medianS)}</p></div><div><p class="k">Fastest solo</p><p class="v">${sec(ans.fastestS)}</p></div></div>
        <p class="h-abs h-ask" style="top:930px">Only ${fmtInt(ans.month)} solves this October. Solving a spooky one this weekend?</p>` }).html },
  ];
}

export function structureB(): Out[] {
  const n = 4, c = (i: number): SlideCtx => ({ v: HOUSE, post: POST, slide: i, of: n });
  return [
    { key: 'B-1', label: 'Cover: guess without swiping', html: artCover(c(1), { kicker: kick, title: 'Guess without swiping: which puzzle is this piece from?', src: 'Swipe for a hint →',
      art: band => CSS + pieces([PIECE], { x: 300, y: band.top + 10, w: 480, h: band.bottom - band.top - 100 }) + credit(band.bottom - 50) }) },
    { key: 'B-2', label: 'Hint: chunk + all clues', html: slide(c(2), 'quiz', { kicker: `${kick} · hint`, src: 'Spoiler on the next slide →', title: 'Hint: a bigger piece.',
      body: CSS + pieces(CHUNK, { x: 190, y: 290, w: 700, h: 600 }, 10) + `<p class="pq-note" style="top:930px">Ravensburger · ${fmtInt(ans.pieces)} pieces · solved by <b>${fmtInt(ans.solvers)}</b> puzzlers on MySpeedPuzzling.</p>` }).html },
    { key: 'B-3', label: 'Spoiler alert', html: slide(c(3), 'quiz', { kicker: `${kick} · spoiler alert`, src: 'The answer is on the next slide →',
      body: CSS + warnIcon(540, 260) + `<h1 class="h-title xl pq-warn" style="top:460px">Spoiler alert</h1>
        <p class="h-lead pq-warn" style="top:610px">Comment your guess first, and whether you knew it from the piece (1) or the hint (2).</p>` }).html },
    { key: 'B-4', label: 'Answer + numbers', html: slide(c(4), 'image', { kicker: `${kick} · the answer`, src: SRC, title: `${ans.puzzle}.`,
      body: CSS + `<p class="h-dek h-abs" style="top:280px">Ravensburger · ${fmtInt(ans.pieces)} pieces · the most-solved Halloween puzzle on MySpeedPuzzling.</p>` + reveal({ x: X0 + 90, y: 400, w: CW - 180 })
        + `<div class="h-abs h-strip" style="top:${f1(400 + (CW - 180) * IMG.h / IMG.w + 50)}px"><div><p class="k">Puzzlers</p><p class="v">${fmtInt(ans.solvers)}</p></div><div><p class="k">Typical solo</p><p class="v">${sec(ans.medianS)}</p></div><div><p class="k">Fastest</p><p class="v">${sec(ans.fastestS)}</p></div></div>` }).html },
  ];
}

export function teaser(): Out {
  const body = CSS + `<h1 class="h-title" style="top:380px; font-size:76px; line-height:1.06">Tomorrow: one piece. Can you name the puzzle?</h1>
    <p class="h-abs h-lead" style="top:640px; color:var(--g-soft)">A Halloween quiz in our feed, Saturday morning.</p>`
    + pieces([PIECE], { x: 330, y: 760, w: 420, h: 460 }).replace('height="1350"', 'height="1920"')
    + `<p class="pq-cred" style="top:1300px; text-align:center">Mystery puzzle · Ravensburger</p>`;
  return { key: 'S-1', label: 'Teaser Story (Fri evening), room for a countdown sticker at the bottom', story: true,
    html: frame({ ground: 'coral', kind: 'story', kicker: 'Halloween quiz', device: HOUSE.device, src: '', rows: STICKER_STORY_ROWS, masthead: true, body }) };
}

/** Where the teaser's piece sits (shared with the animation, src/motion/story-piece-quiz.ts). */
export const TEASER_BOX = { x: 210, y: 760, w: 660, h: 560 };
/** Bigger-type teaser (owner 2026-10-30: "bigger text"): two big lines, the piece large, a fixed time, sticker room.
 *  Ids let the animation drive the same layout; its last frame is exactly this still. */
export function teaserBig(extra = ''): Out {
  const body = CSS + extra + `<h1 id="t1" class="h-title" style="top:360px; font-size:150px; line-height:1">One piece.</h1>
    <h1 id="t2" class="h-title" style="top:530px; font-size:96px; line-height:1.02">Which puzzle is it from?</h1>
    <div id="piece" style="position:absolute; left:0; top:0; width:1080px; height:1920px">${pieces([PIECE], TEASER_BOX).replace('height="1350"', 'height="1920"')}</div>
    <p id="cred" class="pq-cred" style="top:1340px; text-align:center; font-size:34px">Mystery puzzle · Ravensburger</p>
    <p id="when" class="h-abs" style="top:1400px; width:${CW}px; text-align:center; font-size:52px; font-weight:700; color:var(--g-ink)">Halloween quiz · tomorrow 10:00</p>`;
  return { key: 'S-2', label: 'Teaser Story, big type; countdown sticker under the last line (y ≈ 1480–1700)', story: true,
    html: frame({ ground: 'coral', kind: 'story', kicker: 'Halloween quiz', device: HOUSE.device, src: '', rows: STICKER_STORY_ROWS, masthead: true, body }) };
}
