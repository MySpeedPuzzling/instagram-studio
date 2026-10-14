// F1 · Box walls & mosaics.
// Puzzle box art treated like a gallery: framed boxes resting on picture ledges with museum labels, a tick
// box and a coral rank sticker; a 1,000-box colour mosaic in the shape of one jigsaw piece; last week's
// top 12 cut into one 12-piece puzzle; and a jigsaw collage template for the owner's competition photos.
// Every visible box carries its credit (puzzle · brand); mosaics carry a collective credit line.
//
// Precompute (sharp, cached in content/cache/f1/): image sizes, the perceived (average) colour of each
// box in CIELAB for the colour-sorted mosaic, and 72 px square thumbnails so the mosaic loads tiny files.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { escapeHtml as h, fmtInt } from '../../../src/design/page.ts';
import { LOGO_URL } from '../../../src/design/svg.ts';
import { generateJigsaw, outlineToPath, sampleOutline, type Piece, type Point } from '../../../src/pieces/jigsaw.ts';
import { ROOT } from '../../../src/render/server.ts';
import { loadContent, type Box, type Content } from '../content.ts';
import type { Direction, Post, Slide } from '../../dl1/types.ts';

const W = 1080, H = 1350, X0 = 88, X1 = 992, CW = X1 - X0;

// ---------------------------------------------------------------- precompute (cached)

/** Perceived colour (CIELAB of the average sRGB colour) of a whole box image, plus its size. */
interface Tone { L: number; C: number; h: number; hex: string; w: number; h_px: number; crop?: Crop }
/** Mosaic tile: the most colourful square detail of the box (same rule for every box), in source pixels. */
interface Crop { x: number; y: number; s: number; L: number; C: number; h: number }
const CACHE = join(ROOT, 'content/cache/f1');
const TONES_FILE = join(CACHE, 'tones-v3.json');
const thumbRel = (b: Box) => `content/cache/f1/tile/${b.puzzleId}.jpg`;
const largeOf = (img: string) => img.replace('/puzzle_medium/', '/puzzle_large/');

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function toLab(r: number, g: number, b: number): [number, number, number] {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

const lch = (r: number, g: number, b: number) => {
  const [L, A, B] = toLab(r, g, b);
  return { L: +L.toFixed(2), C: +Math.hypot(A, B).toFixed(2), h: +((Math.atan2(B, A) * 180 / Math.PI + 360) % 360).toFixed(1) };
};

async function analyse(file: string, withCrop: boolean): Promise<Tone> {
  const meta = await sharp(file).metadata();
  const W0 = meta.width!, H0 = meta.height!;
  const { data } = await sharp(file).flatten({ background: '#ffffff' }).resize(1, 1, { fit: 'fill', kernel: 'cubic' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const hex = '#' + [data[0], data[1], data[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  const out: Tone = { ...lch(data[0] / 255, data[1] / 255, data[2] / 255), hex, w: W0, h_px: H0 };
  if (!withCrop) return out;
  // Slide a square window (55 % of the short side) over a 48 px wide proxy; keep the most colourful one,
  // avoiding near-black and near-white windows.
  const gw = 48, gh = Math.max(8, Math.round((48 * H0) / W0));
  const { data: px } = await sharp(file).flatten({ background: '#ffffff' }).resize(gw, gh, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const k = Math.round(Math.min(gw, gh) * 0.55);
  let best = { score: -Infinity, x: 0, y: 0, c: lch(0, 0, 0) };
  for (let y = 0; y + k <= gh; y++) for (let x = 0; x + k <= gw; x++) {
    let r = 0, g = 0, b = 0;
    for (let j = y; j < y + k; j++) for (let i = x; i < x + k; i++) { const o = (j * gw + i) * 3; r += px[o]; g += px[o + 1]; b += px[o + 2]; }
    const n = k * k * 255;
    const c = lch(r / n, g / n, b / n);
    const score = c.C - 0.5 * Math.max(0, 38 - c.L) - 0.5 * Math.max(0, c.L - 82);
    if (score > best.score) best = { score, x, y, c };
  }
  const sx = W0 / gw;
  out.crop = { x: Math.round(best.x * sx), y: Math.round(best.y * sx), s: Math.round(k * sx), ...best.c };
  out.crop.s = Math.min(out.crop.s, W0 - out.crop.x, H0 - out.crop.y);
  return out;
}

async function prepare(c: Content) {
  mkdirSync(join(CACHE, 'tile'), { recursive: true });
  const tones: Record<string, Tone> = existsSync(TONES_FILE) ? JSON.parse(readFileSync(TONES_FILE, 'utf8')) : {};
  // Medium images: every September box. Large images: the week's top 12 and the September hero.
  type Job = { key: string; file: string; thumb?: string };
  const jobs: Job[] = ([
    ...c.september.boxes.map((b): Job => ({ key: b.img, file: join(ROOT, b.img), thumb: join(ROOT, thumbRel(b)) })),
    ...c.weekTop.map((b): Job => ({ key: b.img, file: join(ROOT, b.img) })),
    ...c.september.boxes.slice(0, 1).map((b): Job => ({ key: largeOf(b.img), file: join(ROOT, largeOf(b.img)) })),
  ] as Job[]).filter(j => existsSync(j.file) && (!tones[j.key] || (j.thumb && !existsSync(j.thumb))));
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(jobs.slice(i, i + 8).map(async j => {
      tones[j.key] ??= await analyse(j.file, !!j.thumb);
      const cr = tones[j.key].crop;
      if (j.thumb && cr && !existsSync(j.thumb)) {
        await sharp(j.file).flatten({ background: '#ffffff' }).extract({ left: cr.x, top: cr.y, width: cr.s, height: cr.s }).resize(72, 72).jpeg({ quality: 86 }).toFile(j.thumb);
      }
    }));
  }
  if (jobs.length) writeFileSync(TONES_FILE, JSON.stringify(tones));
  return tones;
}

const TONES = await prepare(loadContent());
const tone = (img: string) => TONES[img];
const aspect = (img: string) => (tone(img) ? tone(img).w / tone(img).h_px : 4 / 3);
/** Best available file for a large display: the 1200 px preset when cached, else the 400 px one. */
const bestImg = (img: string) => (existsSync(join(ROOT, largeOf(img))) ? largeOf(img) : img);
const NEUTRAL_C = 7;
/** Colour family of a perceived colour (Lab hue angle), for copy like "No. 1 sits among the greens". */
function family(t: { C: number; h: number }) {
  if (t.C < NEUTRAL_C) return 'greys';
  const names: Array<[number, string]> = [[20, 'pinks'], [48, 'reds'], [72, 'oranges'], [102, 'yellows'], [170, 'greens'], [235, 'teals'], [295, 'blues'], [345, 'purples'], [360, 'pinks']];
  return names.find(([max]) => t.h < max)![1];
}

// ---------------------------------------------------------------- theme

const css = `
:root { --f1-wall: #f1ebe2; --f1-wall-deep: #e3d9cb; --f1-night: #232a38; --f1-ph: #e4ddd2; --f1-ph2: #d9d0c3; }
body { background: var(--f1-wall); }
.slide { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--f1-wall); }
.slide.night { background: var(--f1-night); color: #fff; }
.abs { position: absolute; }
.kick { font-size: 30px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--ink-soft); line-height: 1.2; }
.night .kick { color: var(--sky-200); }
.title { font-size: 84px; line-height: 1.0; font-weight: 300; letter-spacing: -2.5px; text-wrap: balance; }
.title b, .h2 b { font-weight: 700; }
.h2 { font-size: 64px; line-height: 1.04; font-weight: 300; letter-spacing: -1.5px; text-wrap: balance; }
.dek { font-size: 34px; line-height: 1.3; color: var(--ink-soft); text-wrap: pretty; }
.dek b { color: var(--ink); }
.night .dek { color: #d6dbe6; }
.night .dek b { color: #fff; }
.foot { position: absolute; left: ${X0}px; right: ${W - X1}px; bottom: 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.src { font-size: 30px; color: var(--ink-soft); line-height: 1.2; }
.night .src { color: #c9d0dc; }
.logo { width: 64px; height: 57px; flex: none; }
.night .logo { background: #fff; border-radius: 12px; padding: 6px; width: 72px; height: 64px; }
/* framed box on a picture ledge */
.fr { position: absolute; background: #fff; border: 3px solid var(--ink); padding: 12px; }
.fr img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ledge { position: absolute; left: 0; right: 0; height: 10px; background: var(--ink); }
.ledge::after { content: ''; position: absolute; left: 0; right: 0; top: 10px; height: 10px; background: var(--f1-wall-deep); }
.sticker { position: absolute; display: grid; place-items: center; border-radius: 50%; background: var(--coral-500); color: var(--ink); font-weight: 700; letter-spacing: -1px; border: 3px solid var(--ink); }
.lbl { position: absolute; }
.lbl .t { position: relative; padding-left: 42px; font-size: 30px; font-weight: 600; line-height: 1.15; }
.lbl .t::before { content: ''; position: absolute; left: 0; top: 4px; width: 26px; height: 26px; border: 3px solid var(--ink); border-radius: 5px; background: #fff; }
.lbl .s { padding-left: 42px; font-size: 24px; line-height: 1.3; color: var(--ink-soft); margin-top: 6px; }
.lbl .s b { color: var(--ink); font-weight: 700; }
/* mosaic */
.tile { position: absolute; display: block; }
.credit { font-size: 24px; line-height: 1.3; color: var(--ink-soft); }
.credit b { color: var(--ink); font-weight: 600; }
.night .credit { color: #c9d0dc; }
.night .credit b { color: #fff; }
`;

const foot = (src: string) => `<footer class="foot"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const slide = (inner: string, cls = '') => `<div class="slide ${cls}">${inner}</div>`;
/** Coral rank sticker; the number is ≥ 37 px bold so navy on coral passes as large text. */
const sticker = (rank: number, x: number, y: number, d = 64) =>
  `<span class="sticker" style="left:${x.toFixed(1)}px; top:${y.toFixed(1)}px; width:${d}px; height:${d}px; font-size:${Math.max(38, Math.round(d * 0.6))}px" data-qa-bg="#ec726f">${rank}</span>`;

type SepBox = Content['september']['boxes'][number];

/** Credit paragraph: "Box art: Ravensburger unless noted. 1 Title · 2 Title · 23 Title (speedpuzzle.eu)". */
function creditLine(items: Array<{ rank: number; b: Box }>) {
  const count = new Map<string, number>();
  for (const { b } of items) count.set(b.brand, (count.get(b.brand) ?? 0) + 1);
  const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const parts = items.map(({ rank, b }) => `<b>${rank}</b>&nbsp;${h(b.puzzle)}${b.brand === main ? '' : ` (${h(b.brand)})`}`);
  return `Box art: ${h(main)} unless noted. ${parts.join(' · ')}`;
}

// ---------------------------------------------------------------- 1 · September wall

const MAT = 15;           // border 3 + mat 12 per side
const LEDGE = 10;

interface Placed { b: SepBox; rank: number; x: number; y: number; w: number; h: number; lx: number; lw: number; ledge: number }

/** Frames on ledges: equal slots per row, each frame contained in slot width × a common art height. */
function ledgeWall(items: Array<{ b: SepBox; rank: number }>, perRow: number, top: number, bottom: number) {
  const GAP = 34, ROWGAP = 40, LABEL_GAP = 22;
  const slotW = (CW - GAP * (perRow - 1)) / perRow;
  const rows: Array<typeof items> = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  const labelH = (r: typeof items) => Math.max(...r.map(it => Math.min(3, Math.ceil(it.b.puzzle.length * 16.5 / (slotW - 50))) * 35 + 2 * 31 + 6));
  const landscapeH = (slotW - 2 * MAT) / 1.36;
  const rowArt = (r: typeof items) => Math.max(...r.map(it => {
    const a = aspect(it.b.img);
    return Math.min(landscapeH * 1.25, (slotW - 2 * MAT) / a);
  }));
  const total = rows.reduce((s, r) => s + rowArt(r) + 2 * MAT + LEDGE + LABEL_GAP + labelH(r), 0) + ROWGAP * (rows.length - 1);
  let y = top + Math.max(0, (bottom - top - total) / 2);
  const placed: Placed[] = [];
  const ledges: number[] = [];
  for (const r of rows) {
    const ledgeY = y + rowArt(r) + 2 * MAT;
    // A short row is centred.
    const x0 = X0 + ((perRow - r.length) * (slotW + GAP)) / 2;
    r.forEach((it, k) => {
      const a = aspect(it.b.img);
      let aw = slotW - 2 * MAT, ah = aw / a;
      if (ah > landscapeH * 1.25) { ah = landscapeH * 1.25; aw = ah * a; }
      const w = aw + 2 * MAT, hh = ah + 2 * MAT, slotX = x0 + k * (slotW + GAP);
      const x = slotX + (slotW - w) / 2;
      placed.push({ b: it.b, rank: it.rank, x, y: ledgeY - hh, w, h: hh, lx: slotX, lw: slotW, ledge: ledgeY });
    });
    ledges.push(ledgeY);
    y = ledgeY + LEDGE + LABEL_GAP + labelH(r) + ROWGAP;
  }
  return { placed, ledges, end: y - ROWGAP, labelTop: (p: Placed) => p.ledge + LEDGE + LABEL_GAP };
}

const frameHtml = (p: { x: number; y: number; w: number; h: number }, img: string) =>
  `<figure class="fr" style="left:${p.x.toFixed(1)}px; top:${p.y.toFixed(1)}px; width:${p.w.toFixed(1)}px; height:${p.h.toFixed(1)}px"><img src="${img}" alt=""></figure>`;

function sepWall(c: Content): Post {
  const s = c.september;
  const N = 25;
  const top = s.boxes.slice(0, N).map((b, i) => ({ b, rank: i + 1 }));
  const hero = top[0];
  const kicker = `${s.label} · most solved on MSP`;

  // Cover: the No. 1 hero, never cropped.
  const heroImg = bestImg(hero.b.img);
  const ha = aspect(heroImg);
  // The hero's source is often only 600 px wide: keep the upscale near 1.5× at the 4/3 output scale.
  const artW = Math.min(680, (tone(heroImg)?.w ?? 600) * 1.13), artH = artW / ha;
  const fx = (W - artW) / 2 - MAT, fy = 430;
  const ledgeY = fy + artH + 2 * MAT;
  const cover: Slide = { id: 'wall-1', body: slide(`
    <p class="abs kick" style="left:${X0}px; top:72px">${h(kicker)}</p>
    <h1 class="abs title" style="left:${X0}px; top:124px; width:${CW}px">The <b>${N}</b> most-solved puzzles of <b>September</b></h1>
    <p class="abs dek" style="left:${X0}px; top:304px; width:${CW}px">Tick off the ones you've solved.</p>
    <div class="ledge" style="top:${ledgeY}px"></div>
    ${frameHtml({ x: fx, y: fy, w: artW + 2 * MAT, h: artH + 2 * MAT }, heroImg)}
    ${sticker(1, fx - 36, fy - 40, 112)}
    <div class="lbl" style="left:${X0}px; top:${ledgeY + 50}px; width:600px">
      <p class="t" style="font-size:48px; line-height:1.08; padding-left:58px">${h(hero.b.puzzle)}</p>
      <p class="s" style="font-size:30px; margin-top:12px; padding-left:58px">${h(hero.b.brand)} · ${fmtInt(hero.b.pieces)} pieces</p>
    </div>
    <style>.slide .lbl .t[style*="48px"]::before { width: 38px; height: 38px; top: 7px; }</style>
    <div class="abs" style="right:${W - X1}px; top:${ledgeY + 40}px; text-align:right">
      <p style="font-size:96px; font-weight:700; letter-spacing:-3px; line-height:1">${fmtInt(hero.b.solvers)}</p>
      <p class="dek" style="font-size:30px; margin-top:6px">puzzlers solved it</p>
    </div>
    ${foot(c.source)}`) };

  const walls: Slide[] = [];
  const per = 6;
  for (let i = 1; i < N; i += per) {
    const g = top.slice(i, i + per);
    const last = i + per >= N;
    const wall = ledgeWall(g, 3, 236, 1196);
    walls.push({ id: `wall-${walls.length + 2}`, body: slide(`
      <p class="abs kick" style="left:${X0}px; top:72px">${h(kicker)}</p>
      <h2 class="abs h2" style="left:${X0}px; top:116px">No. <b>${g[0].rank}–${g[g.length - 1].rank}</b></h2>
      ${wall.ledges.map(y => `<div class="ledge" style="top:${y}px"></div>`).join('')}
      ${wall.placed.map(p => frameHtml(p, p.b.img)).join('')}
      ${wall.placed.map(p => sticker(p.rank, Math.max(X0 - 6, p.x - 22), p.y - 24, 66)).join('')}
      ${wall.placed.map(p => `<div class="lbl" style="left:${p.lx.toFixed(1)}px; top:${wall.labelTop(p).toFixed(1)}px; width:${p.lw.toFixed(1)}px">
          <p class="t">${h(p.b.puzzle)}</p>
          <p class="s" data-qa-small>${h(p.b.brand)}<br>solved by <b>${fmtInt(p.b.solvers)}</b></p></div>`).join('')}
      ${last ? `<p class="abs" style="right:${W - X1}px; top:136px; font-size:38px; font-weight:700; line-height:1.2; padding-bottom:4px; border-bottom:8px solid var(--coral-500)">How many have you solved?</p>` : ''}
      ${foot(c.source)}`) });
  }

  const brands = [...new Set(top.map(t => t.b.brand))];
  return {
    key: 'sep-wall',
    label: "September's most-solved puzzles (box wall)",
    caption: `September's most-solved puzzles on MySpeedPuzzling 🧩

${hero.b.puzzle} by ${hero.b.brand} takes the top spot: ${fmtInt(hero.b.solvers)} puzzlers solved it in ${s.label}. Swipe along the wall for No. 2–${N}.

How many of the ${N} have you solved? Screenshot, tick them off and drop your score in the comments.

Box art: ${brands.join(', ')}.
#speedpuzzling #jigsawpuzzle #puzzletime #ravensburger`,
    slides: [cover, ...walls],
  };
}

// ---------------------------------------------------------------- 2 · September mosaic

interface Cell { col: number; row: number; x: number; y: number; cx: number; cy: number }

function pointIn(poly: Point[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** One interior jigsaw piece, scaled so that exactly `n` grid cells (by centre) fall inside its outline. */
function pieceCells(n: number, pitch: number, seed: number, tabSize: number) {
  const base = generateJigsaw({ cols: 3, rows: 3, width: 300, height: 300, seed, tabSize, jitter: 0 });
  const p = base.pieces.find(q => q.col === 1 && q.row === 1)!;
  const norm = p.outline.map(([x, y]) => [x - p.bbox.x, y - p.bbox.y] as Point);
  const poly0 = sampleOutline(norm, 40);
  const count = (s: number) => {
    const poly = poly0.map(([x, y]) => [x * s, y * s] as Point);
    const cells: Cell[] = [];
    for (let row = 0; row * pitch < p.bbox.height * s; row++) for (let col = 0; col * pitch < p.bbox.width * s; col++) {
      const cx = col * pitch + pitch / 2, cy = row * pitch + pitch / 2;
      if (pointIn(poly, cx, cy)) cells.push({ col, row, x: col * pitch, y: row * pitch, cx, cy });
    }
    return cells;
  };
  let s = 2;
  while (count(s).length < n) s += 0.1;
  s -= 0.1;
  while (count(s).length < n) s += 0.002;
  let cells = count(s);
  // Trim a surplus (if the count jumped past n) from the cells closest to the outline.
  if (cells.length > n) {
    const poly = poly0.map(([x, y]) => [x * s, y * s] as Point);
    const edge = (c: Cell) => Math.min(...poly.map(([x, y]) => Math.hypot(x - c.cx, y - c.cy)));
    cells = cells.map(c => ({ c, d: edge(c) })).sort((a, z) => z.d - a.d).slice(0, n).map(o => o.c);
  }
  return { cells, d: outlineToPath(norm.map(([x, y]) => [+(x * s).toFixed(2), +(y * s).toFixed(2)] as Point)), w: p.bbox.width * s, h: p.bbox.height * s };
}

/** Colour field: hue runs left → right (greys first), lightness top → bottom within each column. */
function colourField(cells: Cell[], boxes: SepBox[]) {
  const t = (b: SepBox) => tone(b.img).crop ?? tone(b.img);
  const greys = boxes.filter(b => t(b).C < NEUTRAL_C).sort((a, b) => t(b).L - t(a).L);
  const hueKey = (b: SepBox) => (t(b).h - 10 + 360) % 360;
  const colours = boxes.filter(b => t(b).C >= NEUTRAL_C).sort((a, b) => hueKey(a) - hueKey(b));
  const ordered = [...greys, ...colours];
  const byCol = new Map<number, Cell[]>();
  for (const c of cells) byCol.set(c.col, [...(byCol.get(c.col) ?? []), c]);
  const out = new Map<Cell, SepBox>();
  let i = 0;
  for (const col of [...byCol.keys()].sort((a, b) => a - b)) {
    const cs = byCol.get(col)!.sort((a, b) => a.row - b.row);
    const bs = ordered.slice(i, i + cs.length).sort((a, b) => t(b).L - t(a).L);
    cs.forEach((c, k) => out.set(c, bs[k]));
    i += cs.length;
  }
  return out;
}

function sepMosaic(c: Content): Post {
  const s = c.september;
  const n = s.boxes.length;
  const pitch = 21, gap = 1;
  const pc = pieceCells(n, pitch, 4, 0.2);
  const assign = colourField(pc.cells, s.boxes);
  const rank = new Map(s.boxes.map((b, i) => [b.puzzleId, i + 1]));
  const brands = new Set(s.boxes.map(b => b.brand)).size;
  const solves = s.boxes.reduce((t, b) => t + b.results, 0);
  const share = Math.round((solves / s.results) * 100);
  const mosaic = (ox: number, oy: number, scale = 1, extra = '') => `
    <div class="abs" style="left:${ox.toFixed(1)}px; top:${oy.toFixed(1)}px; width:${pc.w.toFixed(1)}px; height:${pc.h.toFixed(1)}px; transform-origin:0 0; transform:scale(${scale}); clip-path:path('${pc.d}'); background:var(--f1-wall)">
      ${pc.cells.map(cell => `<img class="tile" src="/${thumbRel(assign.get(cell)!)}" alt="" style="left:${cell.x + gap / 2}px; top:${cell.y + gap / 2}px; width:${pitch - gap}px; height:${pitch - gap}px">`).join('')}
      <svg class="abs" style="left:0; top:0" width="${pc.w.toFixed(1)}" height="${pc.h.toFixed(1)}"><path d="${pc.d}" fill="none" stroke="var(--f1-wall)" stroke-width="${(10 / scale).toFixed(1)}"/></svg>
    </div>${extra}`;
  const credit = `${fmtInt(n)} most-solved puzzles of ${s.label} · ${brands} brands · box art by their publishers`;
  const mx = (W - pc.w) / 2, my = 312;

  const s1: Slide = { id: 'mosaic-1', body: slide(`
    <p class="abs kick" style="left:${X0}px; top:72px">${h(s.label)} on MSP</p>
    <h1 class="abs title" style="left:${X0}px; top:120px; width:${CW}px; color:#fff">September in <b>${fmtInt(n)}</b> puzzles</h1>
    ${mosaic(mx, my)}
    <p class="abs credit" data-qa-small style="left:${X0}px; top:1224px; width:740px">${h(credit)}</p>
    <img class="abs logo" src="${LOGO_URL}" alt="" style="right:${W - X1}px; top:1214px">`, 'night') };

  // Zoom: the 3×3 neighbourhood of No. 1.
  const top1 = s.boxes[0];
  const cellOf = [...assign.entries()].find(([, b]) => b.puzzleId === top1.puzzleId)![0];
  const at = new Map(pc.cells.map(cl => [`${cl.col},${cl.row}`, cl]));
  let win = { c0: cellOf.col - 1, r0: cellOf.row - 1, score: -1 };
  for (let dc = -2; dc <= 0; dc++) for (let dr = -2; dr <= 0; dr++) {
    let f = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (at.has(`${cellOf.col + dc + i},${cellOf.row + dr + j}`)) f++;
    const score = f + (dc === -1 && dr === -1 ? 0.5 : 0);
    if (score > win.score) win = { c0: cellOf.col + dc, r0: cellOf.row + dr, score };
  }
  const zs = 140, zg = 8, zx = X0, zy = 296; // 140 leaves room for credits that wrap to two lines
  const zoom: Array<{ b: SepBox; i: number; j: number }> = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const cl = at.get(`${win.c0 + i},${win.r0 + j}`);
    if (cl) zoom.push({ b: assign.get(cl)!, i, j });
  }
  const zw = 3 * zs + 2 * zg;
  const mapScale = 0.4, mapX = X1 - pc.w * mapScale, mapY = zy + (zw - pc.h * mapScale) / 2;
  const win1 = { x: mapX + win.c0 * pitch * mapScale, y: mapY + win.r0 * pitch * mapScale, s: 3 * pitch * mapScale };
  const zoomList = [...zoom].sort((a, b) => rank.get(a.b.puzzleId)! - rank.get(b.b.puzzleId)!);
  const listY = zy + zw + 36;
  const s2: Slide = { id: 'mosaic-2', body: slide(`
    <p class="abs kick" style="left:${X0}px; top:72px">Zoom in</p>
    <h2 class="abs h2" style="left:${X0}px; top:116px; width:${CW}px; color:#fff">Every tile is <b>one puzzle</b>, sorted by colour</h2>
    ${zoom.map(z => {
      const t = tone(z.b.img), cr = t.crop!, k = zs / cr.s;
      return `<div class="abs" style="left:${zx + z.i * (zs + zg)}px; top:${zy + z.j * (zs + zg)}px; width:${zs}px; height:${zs}px; overflow:hidden">
        <img src="${z.b.img}" alt="" style="position:absolute; left:${(-cr.x * k).toFixed(1)}px; top:${(-cr.y * k).toFixed(1)}px; width:${(t.w * k).toFixed(1)}px; height:${(t.h_px * k).toFixed(1)}px; max-width:none"></div>`;
    }).join('')}
    ${zoom.filter(z => z.b.puzzleId === top1.puzzleId).map(z => `<div class="abs" style="left:${zx + z.i * (zs + zg) - 8}px; top:${zy + z.j * (zs + zg) - 8}px; width:${zs + 16}px; height:${zs + 16}px; border:6px solid var(--coral-500); border-radius:4px"></div>`).join('')}
    ${zoom.map(z => `<span class="abs" data-qa-bg="#232a38" data-qa-small style="left:${zx + z.i * (zs + zg) + 6}px; top:${zy + z.j * (zs + zg) + zs - 44}px; padding:0 10px; height:38px; line-height:38px; border-radius:19px; background:var(--f1-night); color:#fff; font-size:24px; font-weight:700">${rank.get(z.b.puzzleId)}</span>`).join('')}
    ${mosaic(mapX, mapY, mapScale)}
    <svg class="abs" style="left:${zx + zw}px; top:${zy}px" width="${mapX - zx - zw}" height="${zw}" viewBox="0 0 ${mapX - zx - zw} ${zw}">
      <path d="M 6 0 L ${win1.x - zx - zw} ${win1.y - zy} M 6 ${zw} L ${win1.x - zx - zw} ${win1.y - zy + win1.s}" stroke="var(--coral-500)" stroke-width="3" fill="none"/></svg>
    <div class="abs" style="left:${(win1.x - 3).toFixed(1)}px; top:${(win1.y - 3).toFixed(1)}px; width:${(win1.s + 6).toFixed(1)}px; height:${(win1.s + 6).toFixed(1)}px; border:3px solid var(--coral-500)"></div>
    <div class="abs" style="left:${X0}px; top:${listY}px; width:${CW}px">
      <ol class="credit" data-qa-small style="list-style:none">
        ${zoomList.map(z => `<li><b>No. ${rank.get(z.b.puzzleId)}</b> ${h(z.b.credit)} · ${fmtInt(z.b.solvers)} puzzlers</li>`).join('')}
      </ol>
      <p class="dek" style="margin-top:16px; font-size:32px">No. 1 sits among the ${family(tone(top1.img).crop!)}. Together the ${fmtInt(n)} were solved <b>${fmtInt(solves)}</b> times, ${share}% of all ${fmtInt(s.results)} results in ${h(s.label)}.</p>
    </div>
    ${foot(c.source)}`, 'night') };

  return {
    key: 'sep-mosaic',
    label: 'September in 1,000 puzzles (colour mosaic)',
    caption: `This is September on MySpeedPuzzling: the ${fmtInt(n)} most-solved puzzles of the month, one tile each, sorted by colour into a single piece.

Together they were solved ${fmtInt(solves)} times, ${share}% of all ${fmtInt(s.results)} results logged in ${s.label}. Zoom in: can you spot the last puzzle you solved?

Last slide: the same ${fmtInt(n)} tiles regrouped by brand. Box art by their publishers (${brands} brands).
#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    slides: [s1, s2, brandSlide(c, pitch, gap)],
  };
}

/** The same 1,000 tiles regrouped by brand: one colour-sorted block per brand, the long tail pooled. */
function brandSlide(c: Content, pitch0: number, gap: number): Slide {
  const s = c.september;
  const byBrand = new Map<string, SepBox[]>();
  for (const b of s.boxes) byBrand.set(b.brand, [...(byBrand.get(b.brand) ?? []), b]);
  const ranked = [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length);
  const [lead, ...rest] = ranked;
  const side = rest.slice(0, 8);
  const tail = rest.slice(8);
  const tailBoxes = tail.flatMap(([, bs]) => bs);
  const pitch = pitch0;
  // A block fills columns top to bottom, so colourField's columns run left → right in hue.
  const block = (boxes: SepBox[], cols: number, x: number, y: number) => {
    const rows = Math.ceil(boxes.length / cols);
    const cells: Cell[] = boxes.map((_, i) => {
      const col = Math.floor(i / rows), row = i % rows;
      return { col, row, x: col * pitch, y: row * pitch, cx: 0, cy: 0 };
    });
    const assign = colourField(cells, boxes);
    return {
      h: rows * pitch,
      html: cells.map(cl => `<img class="tile" src="/${thumbRel(assign.get(cl)!)}" alt="" style="left:${x + cl.x}px; top:${y + cl.y}px; width:${pitch - gap}px; height:${pitch - gap}px">`).join(''),
    };
  };
  const leftCols = 24, rightX = X0 + leftCols * pitch + 44, rightCols = Math.floor((X1 - rightX + gap) / pitch);
  const label = (n: number, name: string, x: number, y: number, w: number, big = false) =>
    `<p class="abs" style="left:${x}px; top:${y}px; width:${w}px; font-size:${big ? 40 : 30}px; line-height:1.1; font-weight:500; color:#fff; white-space:nowrap"><b style="font-weight:700">${fmtInt(n)}</b> ${h(name)}</p>`;
  let html = '';
  let y = 262;
  html += label(lead[1].length, lead[0], X0, y, leftCols * pitch, true);
  const lb = block(lead[1], leftCols, X0, y + 58);
  html += lb.html;
  y += 58 + lb.h + 34;
  html += label(tailBoxes.length, `from ${tail.length} more brands`, X0, y, leftCols * pitch);
  html += block(tailBoxes, leftCols, X0, y + 46).html;
  let ry = 262 + 10;
  for (const [name, bs] of side) {
    html += label(bs.length, name, rightX, ry, X1 - rightX);
    const b = block(bs, rightCols, rightX, ry + 44);
    html += b.html;
    ry += 44 + b.h + 24;
  }
  return { id: 'mosaic-3', body: slide(`
    <p class="abs kick" style="left:${X0}px; top:72px">The same ${fmtInt(s.boxes.length)}, by brand</p>
    <h2 class="abs h2" style="left:${X0}px; top:116px; width:${CW}px; color:#fff">${fmtInt(byBrand.size)} brands made <b>September</b></h2>
    ${html}
    <p class="abs credit" data-qa-small style="left:${X0}px; top:1214px; width:760px">Box art by their publishers<br>${h(c.source)}</p>
    <img class="abs logo" src="${LOGO_URL}" alt="" style="right:${W - X1}px; top:1214px">`, 'night') };
}

// ---------------------------------------------------------------- 3 · Week wall (12-piece puzzle)

const edgePath = (pts: Point[]) => `M ${pts[0][0]} ${pts[0][1]} C ${pts[1].join(' ')} ${pts[2].join(' ')} ${pts[3].join(' ')} C ${pts[4].join(' ')} ${pts[5].join(' ')} ${pts[6].join(' ')} C ${pts[7].join(' ')} ${pts[8].join(' ')} ${pts[9].join(' ')}`;
/** Edge k of a generated piece (0 top, 1 right, 2 bottom, 3 left) as 10 control points. */
const pieceEdge = (p: Piece, k: number) => p.outline.slice(9 * k, 9 * k + 10);

function weekWall(c: Content): Post {
  const wk = c.weekTop;
  const cols = 3, rows = 4, pw = CW / cols, ph = Math.round(pw / 1.38);
  const px = X0, py = 236;
  const jig = generateJigsaw({ cols, rows, width: CW, height: ph * rows, x: px, y: py, seed: 21, tabSize: 0.22 });
  const pieces = [...jig.pieces].sort((a, b) => a.row - b.row || a.col - b.col);
  const defs = pieces.map((p, i) => `<clipPath id="wp${i}"><path d="${p.d}"/></clipPath>`).join('');
  const imgs = pieces.map((p, i) => `<image href="${wk[i].img}" x="${p.bbox.x}" y="${p.bbox.y}" width="${p.bbox.width}" height="${p.bbox.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#wp${i})"/>`).join('');
  const svg = `<svg class="abs" style="left:0; top:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${imgs}
    <path d="${jig.cuts}" fill="none" stroke="var(--f1-wall)" stroke-width="8" stroke-linecap="round"/>
    <path d="${jig.border}" fill="none" stroke="var(--ink)" stroke-width="4"/>
    <path d="${pieces[0].d}" fill="none" stroke="var(--coral-500)" stroke-width="7" stroke-linejoin="round"/></svg>`;
  const stickers = pieces.map((p, i) => sticker(i + 1, px + p.col * pw + 14, py + p.row * ph + 14, 64)).join('');
  const items = wk.map((b, i) => ({ rank: i + 1, b }));

  const s1: Slide = { id: 'week-1', body: slide(`
    <p class="abs kick" style="left:${X0}px; top:72px">Most solved · ${h(c.weekRange)}</p>
    <h2 class="abs h2" style="left:${X0}px; top:116px; width:${CW}px">Last week's <b>puzzle wall</b></h2>
    ${svg}${stickers}
    <p class="abs credit" data-qa-small style="left:${X0}px; top:${py + ph * rows + 18}px; width:${CW}px">${creditLine(items)}</p>`) };

  // Numbers: the same pieces as thumbnails.
  const rowH = 74, ty = 292;
  const thumb = (p: Piece, i: number) => {
    const sc = 62 / pw;
    return `<svg width="${(p.bbox.width * sc).toFixed(1)}" height="${(p.bbox.height * sc).toFixed(1)}" viewBox="${p.bbox.x} ${p.bbox.y} ${p.bbox.width} ${p.bbox.height}"><defs><clipPath id="tp${i}"><path d="${p.d}"/></clipPath></defs>
      <image href="${wk[i].img}" x="${p.bbox.x}" y="${p.bbox.y}" width="${p.bbox.width}" height="${p.bbox.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#tp${i})"/></svg>`;
  };
  const grid = 'grid-template-columns: 46px 92px 1fr 118px 128px 128px';
  const s2: Slide = { id: 'week-2', body: slide(`
    <p class="abs kick" style="left:${X0}px; top:72px">Most solved · ${h(c.weekRange)}</p>
    <h2 class="abs h2" style="left:${X0}px; top:116px; width:${CW}px">The numbers <b>behind the wall</b></h2>
    <div class="abs" data-qa-small style="left:${X0}px; top:${ty - 40}px; width:${CW}px; display:grid; ${grid}; font-size:24px; line-height:1.2; color:var(--ink-soft); text-align:right">
      <span></span><span></span><span></span><span>Puzzlers</span><span>Median</span><span>Fastest</span></div>
    ${wk.map((b, i) => `<div class="abs" style="left:${X0}px; top:${ty + i * rowH}px; width:${CW}px; height:${rowH}px; display:grid; ${grid}; align-items:center; border-top:2px solid var(--f1-wall-deep)">
      <span style="font-size:30px; font-weight:700">${i + 1}</span>
      <span style="display:flex; align-items:center">${thumb(pieces[i], i)}</span>
      <span style="line-height:1.1; white-space:nowrap"><span style="font-size:30px; font-weight:600">${h(b.puzzle)}</span><br><span data-qa-small style="font-size:24px; color:var(--ink-soft)">${h(b.brand)}</span></span>
      <span style="font-size:34px; font-weight:700; text-align:right">${fmtInt(b.solversWeek)}</span>
      <span style="font-size:30px; text-align:right">${b.medianSolo ?? '–'}</span>
      <span style="font-size:30px; text-align:right">${b.fastestSolo ?? '–'}</span></div>`).join('')}
    <p class="abs src" data-qa-small style="left:${X0}px; top:${ty + wk.length * rowH + 10}px; width:${CW}px; font-size:24px">Median and fastest: all-time solo times on each puzzle.</p>
    ${foot(c.source)}`) };

  const p1 = wk[0];
  return {
    key: 'week-wall',
    label: "Last week's puzzle wall (12 most-solved)",
    caption: `Last week's puzzle wall: the 12 most-solved puzzles on MySpeedPuzzling, ${c.weekRange}.

${p1.puzzle} by ${p1.brand} led the week with ${fmtInt(p1.solversWeek)} puzzlers. Which one is on your table this week?

Box art: ${[...new Set(wk.map(b => b.brand))].join(', ')}.
#speedpuzzling #jigsawpuzzle #puzzleoftheweek`,
    slides: [s1, s2],
  };
}

// ---------------------------------------------------------------- 4 · Event collage template

export interface EventCollage {
  name: string;
  when: string;
  where: string;
  /** Photo URLs per slot (null = placeholder). Slots: 1 hero (landscape), 2–3 near-square, 4 portrait. */
  photos: Array<string | null>;
  podium: Array<{ name: string; time: string }>;
}

type Region = { kind: 'photo'; slot: number; hint: string } | { kind: 'title' } | { kind: 'results' };

function eventCollage(ev: EventCollage): Slide {
  // A 3 × 4 jigsaw over the full frame; regions are unions of whole pieces, cut lines only between regions.
  const cols = 3, rows = 4, pw = W / cols, ph = H / rows;
  const jig = generateJigsaw({ cols, rows, width: W, height: H, seed: 9, tabSize: 0.2 });
  const hero: Region = { kind: 'photo', slot: 1, hint: 'landscape' }, p2: Region = { kind: 'photo', slot: 2, hint: 'square' };
  const p3: Region = { kind: 'photo', slot: 3, hint: 'square' }, p4: Region = { kind: 'photo', slot: 4, hint: 'portrait' };
  const title: Region = { kind: 'title' }, res: Region = { kind: 'results' };
  const grid: Region[][] = [[hero, hero, p2], [hero, hero, p3], [title, title, p4], [res, res, p4]];
  const regions = [hero, p2, p3, p4, title, res];
  const piecesOf = (rg: Region) => jig.pieces.filter(p => grid[p.row][p.col] === rg);
  const bboxOf = (ps: Piece[]) => {
    const x0 = Math.min(...ps.map(p => p.bbox.x)), y0 = Math.min(...ps.map(p => p.bbox.y));
    return { x: x0, y: y0, w: Math.max(...ps.map(p => p.bbox.x + p.bbox.width)) - x0, h: Math.max(...ps.map(p => p.bbox.y + p.bbox.height)) - y0 };
  };
  const cellBox = (rg: Region) => {
    const ps = piecesOf(rg);
    const c0 = Math.min(...ps.map(p => p.col)), c1 = Math.max(...ps.map(p => p.col)) + 1;
    const r0 = Math.min(...ps.map(p => p.row)), r1 = Math.max(...ps.map(p => p.row)) + 1;
    return { x: c0 * pw, y: r0 * ph, w: (c1 - c0) * pw, h: (r1 - r0) * ph };
  };
  const phFill = ['var(--f1-ph)', 'var(--f1-ph2)', 'var(--f1-ph2)', 'var(--f1-ph)'];
  const defs = regions.map((rg, i) => `<clipPath id="er${i}">${piecesOf(rg).map(p => `<path d="${p.d}"/>`).join('')}</clipPath>`).join('');
  const body = regions.map((rg, i) => {
    const b = bboxOf(piecesOf(rg));
    const photo = rg.kind === 'photo' ? ev.photos[rg.slot - 1] : null;
    if (photo) return `<image href="${photo}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#er${i})"/>`;
    const fill = rg.kind === 'photo' ? phFill[rg.slot - 1] : rg.kind === 'title' ? 'var(--f1-night)' : '#ffffff';
    return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fill}" clip-path="url(#er${i})"/>`;
  }).join('');
  const cuts: string[] = [];
  for (const p of jig.pieces) {
    const me = grid[p.row][p.col];
    if (p.col + 1 < cols && grid[p.row][p.col + 1] !== me) cuts.push(edgePath(pieceEdge(p, 1)));
    if (p.row + 1 < rows && grid[p.row + 1][p.col] !== me) cuts.push(edgePath(pieceEdge(p, 2)));
  }
  // Placeholder: a drawn photo glyph (frame, sun, hills) and the slot name, centred on the region's grid box.
  const placeholders = regions.filter((rg): rg is Extract<Region, { kind: 'photo' }> => rg.kind === 'photo' && !ev.photos[rg.slot - 1]).map(rg => {
    const b = cellBox(rg), bg = rg.slot === 2 || rg.slot === 3 ? '#d9d0c3' : '#e4ddd2';
    const cx = Math.min(Math.max(b.x + b.w / 2, X0 + 120), X1 - 120), cy = Math.min(Math.max(b.y + b.h / 2, 170), 1180);
    return `<svg class="abs" style="left:${cx - 44}px; top:${cy - 92}px" width="88" height="66" viewBox="0 0 88 66"><rect x="3" y="3" width="82" height="60" rx="8" fill="none" stroke="#4b566b" stroke-width="4"/><circle cx="62" cy="22" r="8" fill="#4b566b"/><path d="M 6 56 L 30 30 L 48 48 L 58 38 L 82 60" fill="none" stroke="#4b566b" stroke-width="4" stroke-linejoin="round"/></svg>
      <div class="abs" data-qa-bg="${bg}" style="left:${cx - 120}px; top:${cy - 10}px; width:240px; text-align:center">
        <p style="font-size:30px; font-weight:700; color:var(--ink-soft)">Your photo ${rg.slot}</p>
        <p data-qa-small style="font-size:24px; color:var(--ink-soft); margin-top:2px">${h(rg.hint)}</p></div>`;
  }).join('');
  const tb = cellBox(title), rb = cellBox(res);
  return { id: 'event-1', body: slide(`
    <svg class="abs" style="left:0; top:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}
      <path d="${cuts.join(' ')}" fill="none" stroke="var(--f1-wall)" stroke-width="12" stroke-linecap="round"/></svg>
    ${placeholders}
    <div class="abs" data-qa-bg="#232a38" style="left:${X0}px; top:${tb.y + 74}px; width:${tb.w - X0 - 70}px; color:#fff">
      <p class="kick" style="color:var(--sky-200)">${h(ev.when)} · ${h(ev.where)}</p>
      <p style="font-size:72px; font-weight:700; line-height:1.0; letter-spacing:-1.5px; margin-top:14px">${h(ev.name)}</p>
    </div>
    <div class="abs" data-qa-bg="#ffffff" style="left:${X0 - 10}px; top:${rb.y + 56}px; width:${rb.w - X0 - 90}px">
      ${ev.podium.map((p, i) => `<div style="display:flex; align-items:center; gap:16px; height:68px; margin-bottom:12px; padding:0 26px 0 6px; border:3px solid var(--ink); border-radius:40px; background:${i === 0 ? 'var(--coral-100)' : '#fff'}" data-qa-bg="${i === 0 ? '#ffe6e3' : '#ffffff'}">
        <span style="display:grid; place-items:center; flex:none; width:54px; height:54px; border-radius:50%; background:${i === 0 ? 'var(--coral-500)' : 'var(--f1-wall)'}; border:3px solid var(--ink); font-size:38px; font-weight:700" data-qa-bg="${i === 0 ? '#ec726f' : '#f1ebe2'}">${i + 1}</span>
        <span style="font-size:32px; font-weight:600; flex:1">${h(p.name)}</span>
        <span style="font-size:32px; font-weight:700">${h(p.time)}</span></div>`).join('')}
    </div>
    <img class="abs" src="${LOGO_URL}" alt="" style="left:${X1 - 66}px; top:${H - 64 - 59}px; width:66px; height:59px">`) };
}

function event(c: Content): Post {
  const sample: EventCollage = {
    name: 'Your event name', when: 'Date', where: 'City',
    photos: [null, null, null, null],
    podium: [{ name: 'Winner', time: 'time' }, { name: 'Second place', time: 'time' }, { name: 'Third place', time: 'time' }],
  };
  void c;
  return {
    key: 'event-collage',
    label: 'Event collage template (photo placeholders)',
    caption: `[Template] {Event name}, {date} in {city}. {N} puzzlers, {pieces} pieces each, and a podium decided by {gap}.

Congratulations to {winner}, {second} and {third}! Full results on myspeedpuzzling.com.

#speedpuzzling #jigsawpuzzle #puzzlecompetition`,
    slides: [eventCollage(sample)],
  };
}

// ---------------------------------------------------------------- direction

const F1 = {
  id: 'F1',
  name: 'Box walls & mosaics',
  idea: 'Box art hung like a gallery: framed boxes on picture ledges with museum labels, tick boxes and coral rank stickers; 1,000 boxes sorted by colour into one jigsaw piece; the week cut into a 12-piece puzzle.',
  css,
  posts: (c: Content): Post[] => [sepWall(c), sepMosaic(c), weekWall(c), event(c)],
};

export default F1 as unknown as Direction;
