// Reel "October in 1000 puzzles" (owner 2026-11-01: concept A "The Shuffle" from lab MR1, with the owner's script:
// meet the top 10, burst, solve it together, back to the splash). ~25 s, loops. Visual first: on screen only the hook,
// three slow reveals (No. 1–3: name, brand, puzzlers), seven fast rank tags, and one fact on a solid backing.
//   0.0–0.9    splash, complete from frame 0: logo, myspeedpuzzling.com, "October in 1000 puzzles", the collage piece
//   0.9–2.0    clear the board: the logo plays its exit, the hook lifts away, the tiles drop out of the piece in a
//              ripple from the centre; the piece's outline stays as a dashed board
//   2.0–10.7   No. 1–3, slow: each box flies in big with "No. N", its name, brand and puzzlers (~2.4 s to read),
//              then shrinks into its tile on the board and leaves a coral ring (the colour sort decides where)
//   10.8–14.2  No. 4–10, fast and accelerating: the box pops in with "No. N" and the brand, and lands
//   14.4–15.2  burst: the other 990 tiles explode out of the centre over the whole screen
//   15.1–17.8  the one fact, on a solid backing, over the still scatter
//   17.9–19.2  edges first: the tiles along the outline fly home, running round the edge
//   19.1–22.5  puzzling: the gaps close from the outline inward, ring by ring; the centre is filled last (owner)
//   22.6–23.0  done: the piece settles with a small pop; board and rings fade
//   23.2–25.6  loop: the hook and the logo return, identical to frame 0
// Tiles live in two layers: `home` (clipped by the piece's smooth outline, for tiles at rest) and `free` (for tiles in
// flight). A tile switches layer at the moment it lands, where both positions match. One draw() computes every tile
// from a few phase values on each update, so seeking any frame is exact. Text only in the Reel safe area.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { STICKER_STORY_SAFE, X0, f1, frame, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { colourField, pieceCells, tileUrl, type Cell } from '../posts/mosaic.ts';
import type { MonthBox, MonthlySpec } from '../posts/monthly.ts';
import { FRAMES } from '../render/render.ts';
import { ROOT } from '../render/server.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
const FW = 1080, FH = 1920, PITCH = 20;
const REEL_PIECE = { top: 770, size: 740 }, STORY_PIECE = { top: 712, size: 640 };
/** Story: the lowest point anything moves to (the link sticker zone starts below it). */
const STORY_FLOOR = 1440;

export interface ReelMonthSpec { spec: MonthlySpec; top: Array<MonthBox & { large: string; aspect: number }>; /** "col,row" → URL of the edge tile cropped by the piece's outline. */ edgeImg: Map<string, string> }

/**
 * The edge tiles cropped by the piece's outline, baked once into transparent PNGs (content/cache/f1/edge/): CSS
 * clip-paths on ~120 moving tiles made the render 10× slower (20 min instead of 2).
 */
export async function edgeTiles(spec: MonthlySpec): Promise<Map<string, string>> {
  const pc = pieceCells(spec.boxes.length, PITCH, 4, 0.2), assign = colourField(pc.cells, spec.boxes, spec.tones);
  const at = new Set(pc.cells.map(c => `${c.col},${c.row}`)), R = 72, k = R / (PITCH - 1);
  const dir = join(ROOT, 'content/cache/f1/edge');
  mkdirSync(dir, { recursive: true });
  const out = new Map<string, string>();
  await Promise.all(pc.cells.filter(c => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !at.has(`${c.col + dx},${c.row + dy}`))).map(async c => {
    const b = assign.get(c)!, name = `${b.puzzleId}-${c.col}-${c.row}-${R}.png`, url = `/content/cache/f1/edge/${name}`;
    if (!existsSync(join(dir, name))) {
      let i = 0;
      const d = pc.d.replace(/-?\d+(?:\.\d+)?/g, v => ((Number(v) - (i++ % 2 ? c.y + 0.5 : c.x + 0.5)) * k).toFixed(2));
      const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${R}" height="${R}"><path d="${d}" fill="#fff"/></svg>`);
      await sharp(join(ROOT, tileUrl(b).slice(1))).resize(R, R).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toFile(join(dir, name));
    }
    out.set(`${c.col},${c.row}`, url);
  }));
  return out;
}

/** Timeline marks (seconds). */
function marks() {
  const slow = [2.0, 4.9, 7.8], SLOW = 2.9;
  const gaps = [0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
  const fast = [slow[2] + SLOW + 0.1];
  for (const g of gaps) fast.push(fast.at(-1)! + g);
  const burst = fast.at(-1)! + 0.75;
  return { splashOut: 0.9, clear: 1.0, slow, SLOW, fast, burst, fact: burst + 0.7, factOut: burst + 3.4, edge: burst + 3.5, fill: burst + 4.7, done: burst + 8.2, loop: burst + 8.8, end: burst + 11.2 };
}

/**
 * `story`: the same animation as a Story pointing to the monthly report (owner 2026-11-01): the piece smaller and
 * higher, a fixed cue to the report under it, and y ≈ 1480–1720 left empty for the owner's link sticker (nothing
 * animates there, as in the Weekly Numbers Story).
 */
export function reelMonthMotion(v: Variant, r: ReelMonthSpec, o: { story?: boolean } = {}): Motion {
  const story = !!o.story, PIECE = story ? STORY_PIECE : REEL_PIECE, key = story ? 'story-month' : 'reel-month';
  const s = r.spec, T = marks(), DURATION = +T.end.toFixed(2);
  const month = new Date(s.month + '-01T12:00:00Z').toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const n = s.boxes.length;
  const pc = pieceCells(n, PITCH, 4, 0.2);
  const assign = colourField(pc.cells, s.boxes, s.tones);
  const cols = Math.max(...pc.cells.map(c => c.col)) + 1;
  const at = new Set(pc.cells.map(c => `${c.col},${c.row}`));
  const SC = PIECE.size / Math.max(pc.w, pc.h), PX = CX - (pc.w * SC) / 2, PY = PIECE.top;
  const cx0 = PX + (pc.w * SC) / 2, cy0 = PY + (pc.h * SC) / 2;
  const home = (c: Cell) => ({ x: PX + c.x * SC, y: PY + c.y * SC });
  const S = PITCH * SC;
  const rankOf = new Map(s.boxes.map((b, i) => [b.puzzleId, i + 1]));

  // Seeded scatter (mulberry32), so every render is the same.
  let seed = 20261101;
  const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // Grid steps from the outline (edge cells 0): the inside fills ring by ring, the centre last (owner 2026-11-01).
  const byKey = new Map(pc.cells.map(c => [`${c.col},${c.row}`, c]));
  const depth = new Map<Cell, number>(), queue: Cell[] = [];
  for (const c of pc.cells) if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !at.has(`${c.col + dx},${c.row + dy}`))) { depth.set(c, 0); queue.push(c); }
  for (let qi = 0; qi < queue.length; qi++) {
    const c = queue[qi];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nb = byKey.get(`${c.col + dx},${c.row + dy}`);
      if (nb && !depth.has(nb)) { depth.set(nb, depth.get(c)! + 1); queue.push(nb); }
    }
  }
  const maxDepth = Math.max(...depth.values());
  // The clear ripple runs from the centre (d = 0) to the farthest tile (d = 1), whatever the piece's size.
  const maxR = Math.max(...pc.cells.map(c => Math.hypot(PX + c.x * SC + PITCH * SC / 2 - cx0, PY + c.y * SC + PITCH * SC / 2 - cy0)));
  // The burst throws the tiles around the board, never over it, so the edges and the colour waves stay visible.
  const clear = { x0: PX - 50, y0: PY - 50, x1: PX + pc.w * SC + 50, y1: PY + pc.h * SC + 50 };
  const spot = () => {
    for (;;) {
      const sx = rnd() * (FW - 60) + 10, sy = 150 + rnd() * ((story ? STORY_FLOOR - 40 : FH - 180) - 150);
      if (sx + 40 < clear.x0 || sx > clear.x1 || sy + 40 < clear.y0 || sy > clear.y1) return { sx: +sx.toFixed(1), sy: +sy.toFixed(1) };
    }
  };
  const tiles = pc.cells.map(c => {
    const b = assign.get(c)!, p = home(c), edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !at.has(`${c.col + dx},${c.row + dy}`));
    const ang = (Math.atan2(p.y + S / 2 - cy0, p.x + S / 2 - cx0) / (2 * Math.PI) + 1.25) % 1; // 0 at the top, clockwise
    return {
      x: +p.x.toFixed(1), y: +p.y.toFixed(1), url: tileUrl(b), rank: rankOf.get(b.puzzleId)!,
      ...spot(), sr: +((rnd() - 0.5) * 70).toFixed(1), sk: +(1.6 + rnd() * 0.9).toFixed(2),
      col: +(c.col / (cols - 1)).toFixed(3), ring: +((depth.get(c)! - 1) / Math.max(1, maxDepth - 1)).toFixed(3), edge, ang: +ang.toFixed(3), d: +(Math.hypot(p.x + S / 2 - cx0, p.y + S / 2 - cy0) / maxR).toFixed(3), j: +rnd().toFixed(3),
    };
  });
  const topTile = (k: number) => tiles.find(t => t.rank === k)!;

  // ---------------------------------------------------------------- markup
  const logo = logoExit({ cx: CX, cy: 318, width: 180 });
  // Owner 2026-11-01: no "box art: publishers" on screen (the top 10 name their brands; the caption credits the rest).
  const credit = `${fmtInt(n)} most-solved of ${month}`;
  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mm-c mm-site" style="top:420px">myspeedpuzzling.com</p>
    <p class="mm-c mm-hook" style="top:488px">${month} in<br><span class="hot">${fmtInt(n)}</span> puzzles</p>
    <p class="h-abs mm-credit" style="top:672px; width:${RW}px">${h(credit)}</p>
  </div>`;
  const board = `<svg id="board" style="position:absolute; left:${f1(PX)}px; top:${f1(PY)}px; overflow:visible; visibility:hidden" width="${f1(pc.w * SC)}" height="${f1(pc.h * SC)}" aria-hidden="true">
    <path d="${pc.d}" transform="scale(${SC})" fill="rgba(255,255,255,0.04)" stroke="rgba(151,165,249,0.6)" stroke-width="${f1(3 / SC)}" stroke-dasharray="${f1(10 / SC)} ${f1(8 / SC)}"/></svg>`;
  const homeLayer = `<div id="home" style="position:absolute; left:${f1(cx0 - pc.w / 2)}px; top:${f1(cy0 - pc.h / 2)}px; width:${f1(pc.w)}px; height:${f1(pc.h)}px; transform-origin:${f1(pc.w / 2)}px ${f1(pc.h / 2)}px; transform:scale(${SC}); clip-path:path('${pc.d}')">
    ${pc.cells.map((c, i) => `<img id="h${i}" class="mm-t" src="${tiles[i].url}" alt="" style="left:${c.x + 0.5}px; top:${c.y + 0.5}px; width:${PITCH - 1}px; height:${PITCH - 1}px">`).join('')}</div>`;
  // Scaled about the piece's centre (left/top place that centre at cx0, cy0), so the final pop stays in place.
  const homeWrap = `<div style="position:absolute; inset:0">${homeLayer}</div>`;
  // Flying tiles match the resting ones exactly (same 1 px gap); edge tiles fly as their pre-cropped slice of the
  // piece (edgeTiles, a transparent PNG each), so no square corners blip at take-off or landing (owner 2026-11-01).
  const freeLayer = `<div id="free">${pc.cells.map((c, i) => {
    const t = tiles[i], box = `left:${f1(t.x + 0.5 * SC)}px; top:${f1(t.y + 0.5 * SC)}px; width:${f1((PITCH - 1) * SC)}px; height:${f1((PITCH - 1) * SC)}px; visibility:hidden`;
    return `<img id="f${i}" class="mm-t mm-f" src="${t.edge ? r.edgeImg.get(`${c.col},${c.row}`) : t.url}" alt="" style="${box}">`;
  }).join('')}</div>`;
  const rings = r.top.map((_, k) => { const t = topTile(k + 1); return `<div id="ring${k + 1}" class="mm-ring" style="left:${f1(t.x + S / 2 - 19)}px; top:${f1(t.y + S / 2 - 19)}px; visibility:hidden"></div>`; }).join('');
  // The top 10: a mounted box per rank at the centre, with its tag (and, for No. 1–3, the name and puzzlers).
  const BOXY = 790;
  const boxes = r.top.map((b, k) => {
    const slow = k < 3, maxW = slow ? 600 : 400, maxH = slow ? 470 : 320;
    const w = Math.min(maxW, maxH * b.aspect), hh = w / b.aspect, x = CX - w / 2, y = BOXY - hh / 2;
    return {
      w, h: hh, x, y,
      html: `<div id="box${k + 1}" class="mm-mount" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(w)}px; height:${f1(hh)}px; visibility:hidden"><img src="${b.large}" alt=""></div>
      <div id="tag${k + 1}" style="visibility:hidden; position:relative; z-index:6">
        <p class="mm-c mm-rank" style="top:${f1(y - 130)}px">No. ${k + 1}</p>
        ${slow ? `<p class="mm-c mm-name" style="top:${f1(y + hh + 36)}px">${h(b.puzzle)}</p>
        <p class="mm-c mm-sub" style="top:${f1(y + hh + 106)}px">${h(b.brand)} · ${fmtInt(b.solvers)} puzzlers</p>`
          : `<p class="mm-c mm-sub" style="top:${f1(y + hh + 30)}px">${h(b.brand)}</p>`}
      </div>`,
    };
  });
  const fact = `<p id="fact" class="mm-c mm-beat" style="top:300px; visibility:hidden"><span><b class="hot">${fmtInt(s.results)}</b> puzzles logged<br>in ${month}</span></p>`;
  const cue = story ? `<p class="mm-c mm-cue" style="top:${STORY_FLOOR - 50}px">The full ${month} report <span class="hot">↓</span></p>` : '';
  const body = `${splash}${board}${homeWrap}${rings}${freeLayer}${boxes.map(b => b.html).join('')}${fact}${cue}`;
  const frameHtml = `<div class="bare">${frame({ ground: 'navy', kind: 'story', kicker: `${month} in ${fmtInt(n)} puzzles`, device: v.device, src: 'myspeedpuzzling.com', rows: { headTop: 296 }, masthead: true, body })}</div>`;

  const css = LOGO_CSS + `
.bare .hf > .h-head, .bare .hf > .h-src { display: none; }
.mm-t { position: absolute; display: block; }
.mm-f { will-change: transform, opacity; border-radius: 1px; }
.mm-c { position: absolute; left: ${X0}px; width: ${RW}px; margin: 0; text-align: center; font-weight: 700; letter-spacing: -0.02em; color: var(--g-ink); }
.mm-c .hot { color: var(--g-hot); }
.mm-site { font-size: 34px; letter-spacing: 0; }
.mm-hook { font-size: 72px; line-height: 1.05; }
.mm-cue { font-size: 44px; line-height: 1.1; z-index: 5; }
.mm-rank { font-size: 88px; line-height: 1; color: var(--g-hot); }
.mm-name { font-size: 60px; line-height: 1.05; }
.mm-sub { font-size: 40px; line-height: 1.2; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.mm-beat { font-size: 64px; line-height: 1.12; z-index: 3; }
.mm-beat span { display: inline-block; padding: 18px 34px; border-radius: 18px; background: rgba(34, 42, 56, 0.94); box-shadow: 0 10px 40px rgba(6, 8, 14, 0.6); }
.mm-credit { text-align: center; font-size: 30px; color: var(--g-soft); }
.mm-mount { position: absolute; box-sizing: border-box; padding: 10px; background: #ffffff; border-radius: 6px; box-shadow: 0 24px 40px -16px rgba(6, 8, 14, 0.8); z-index: 4; }
.mm-mount img { display: block; width: 100%; height: 100%; object-fit: cover; }
.mm-ring { position: absolute; width: 38px; height: 38px; box-sizing: border-box; border: 5px solid var(--c-hot); border-radius: 50%; }
`;

  const script = `
const D = DATA, T = D.T, $ = id => document.getElementById(id);
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const clamp = v => Math.max(0, Math.min(1, v));
const eo = f => 1 - Math.pow(1 - f, 3);
const eio = f => f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
const st = { clear: 0, burst: 0, edge: 0, fill: 0, back: 0 };
for (let k = 1; k <= 10; k++) st['r' + k] = 0;
const H = D.tiles.map((_, i) => $('h' + i)), F = D.tiles.map((_, i) => $('f' + i));
const BX = D.cx0, BY = D.cy0, S = D.S;
function draw() {
  for (let i = 0; i < D.tiles.length; i++) {
    const t = D.tiles[i], hEl = H[i], fEl = F[i];
    const top = t.rank <= 10 ? st['r' + t.rank] : 0;
    // 1 · at home before the clear, and again once the loop has brought the splash back
    if (st.clear <= 0 || st.back >= 1) { hEl.style.visibility = 'visible'; fEl.style.visibility = 'hidden'; continue; }
    // 2 · the clear: every tile falls out of the piece in a ripple from the centre
    const c = clamp(st.clear * 1.7 - t.d * 0.7);
    if (st.burst <= 0 && !top) {
      hEl.style.visibility = 'hidden';
      if (c >= 1) { fEl.style.visibility = 'hidden'; continue; }
      fEl.style.visibility = 'visible';
      fEl.style.opacity = 1 - c;
      fEl.style.transform = 'translate(0px,' + (eo(c) * 260).toFixed(1) + 'px) rotate(' + (t.sr * c).toFixed(1) + 'deg) scale(' + (1 - 0.4 * c).toFixed(3) + ')';
      continue;
    }
    // 3 · the top 10 sit on the board from their landing on
    if (top) { hEl.style.visibility = 'visible'; fEl.style.visibility = 'hidden'; continue; }
    // 4 · burst out of the centre, then home again: edges first, then the colour waves
    const b = eo(clamp(st.burst * 1.35 - t.j * 0.35));
    const q = t.edge ? clamp(st.edge * 1.6 - t.ang * 0.6) : clamp((st.fill * 1.2 - t.ring) / 0.2);
    if (q >= 1) { hEl.style.visibility = 'visible'; fEl.style.visibility = 'hidden'; continue; }
    hEl.style.visibility = 'hidden';
    if (b <= 0) { fEl.style.visibility = 'hidden'; continue; }
    fEl.style.visibility = 'visible';
    fEl.style.opacity = 1;
    const e = eio(q);
    // scattered spot = burst from the centre; home = (0, 0) offset
    const sx = (BX - t.x - S / 2) * (1 - b) + (t.sx - t.x) * b, sy = (BY - t.y - S / 2) * (1 - b) + (t.sy - t.y) * b;
    const k = (0.2 + (t.sk - 0.2) * b) * (1 - e) + e, rot = t.sr * b * (1 - e);
    fEl.style.transform = 'translate(' + (sx * (1 - e)).toFixed(1) + 'px,' + (sy * (1 - e)).toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + k.toFixed(3) + ')';
  }
}
draw();
const drive = (vars, at, dur, ease) => tl.to(st, { ...vars, duration: dur, ease: ease || 'none', onUpdate: draw, onComplete: draw }, at);

// ---- the splash leaves, the board clears
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.25, ease: 'power2.in', stagger: 0.04 }, T.splashOut + 0.05);
drive({ clear: 1 }, T.clear, 0.95);
show('#board', T.clear + 0.35, 0.4);

// ---- the top 10 meet the board: a box flies in, holds, shrinks into its tile, leaves a ring
D.boxes.forEach((bx, k) => {
  const r = k + 1, slow = r <= 3, t0 = slow ? T.slow[k] : T.fast[k - 3], tile = D.tiles[D.topIdx[k]];
  const hold = slow ? T.SLOW - 0.95 : 0.3, land = t0 + 0.4 + hold;
  tl.set(['#box' + r, '#tag' + r], { autoAlpha: 1 }, t0);
  tl.fromTo('#box' + r, { scale: 0.4, rotation: -6, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: slow ? 0.45 : 0.28, ease: 'back.out(1.8)', immediateRender: false }, t0);
  riseIn('#tag' + r + ' > p', t0 + (slow ? 0.15 : 0.05), { stagger: slow ? 0.18 : 0, dur: slow ? 0.35 : 0.2, y: 24 });
  hide('#tag' + r, land - 0.05, 0.15);
  moveTo('#box' + r, { x: bx.x, y: bx.y, w: bx.w, h: bx.h }, { x: tile.x, y: tile.y, w: D.S, h: D.S }, land, slow ? 0.5 : 0.42);
  tl.set('#box' + r, { autoAlpha: 0 }, land + (slow ? 0.5 : 0.42));
  drive({ ['r' + r]: 1 }, land + (slow ? 0.48 : 0.4), 0.02);
  popIn('#ring' + r, land + (slow ? 0.5 : 0.42), { dur: 0.35 });
});

// ---- burst, the one fact, edges first, the colour waves
drive({ burst: 1 }, T.burst, 0.8);
show('#fact', T.fact, 0.01);
tl.fromTo('#fact', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, T.fact);
hide('#fact', T.factOut, 0.3);
drive({ edge: 1 }, T.edge, 1.3, 'power1.inOut');
drive({ fill: 1 }, T.fill, 3.4, 'power1.inOut');

// ---- done: a small pop; the board and the rings fade
hide(['#board', '.mm-ring'], T.done - 0.1, 0.3);
tl.fromTo('#home', { scale: D.SC }, { scale: D.SC * 1.045, duration: 0.18, ease: 'power2.out', immediateRender: false }, T.done);
tl.to('#home', { scale: D.SC, duration: 0.4, ease: 'back.out(3)' }, T.done + 0.18);

// ---- loop: the hook and the logo come back; the last frame equals frame 0
drive({ back: 1 }, T.loop - 0.05, 0.01);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', stagger: 0.06, immediateRender: false }, T.loop);
${logo.back(T.loop + 0.15)}
tl.set({}, {}, ${DURATION});
`;
  const data = {
    T, S: +S.toFixed(2), SC: +SC.toFixed(5), cx0: +cx0.toFixed(1), cy0: +cy0.toFixed(1), tiles,
    topIdx: r.top.map((_, k) => tiles.findIndex(t => t.rank === k + 1)),
    boxes: boxes.map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.w.toFixed(1), h: +b.h.toFixed(1) })),
  };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: story ? STICKER_STORY_SAFE : SAFE,
    qaAt: [0.05, T.slow[0] + 1.2, T.slow[1] + 1.2, T.slow[2] + 1.2, T.fast[0] + 0.3, T.fast[6] + 0.3, T.fact + 1.0, T.edge + 0.6, T.fill + 1.7, T.done + 0.5, DURATION - 0.05],
    html: composition({ key, title: `${story ? 'Story' : 'Reel'} ${month} in ${n} puzzles`, duration: DURATION, frameHtml, css, data, script }),
  };
}
