// DL4 · creative formats (the DL2 F1 box walls & mosaics and F2 puzzle of the week & quizzes) in the house system.
// Approved content and concepts; only the design changes (owner, DL2 feedback): no cream, paper or table grounds.
// Box art sits on the house grounds (navy, indigo, ocean, coral … per variant) on white mounts with one soft
// shadow; framed boxes stand on a ledge drawn in the ground's rule colour; the 1,000-box mosaic, the zoom and the
// "80 brands" slide keep their F1-6/7/8 layouts on the variant ground. Header, footer and logo come from house.ts.
//
// Roles: image-led carousel openers use a local art cover (`artCover`): H1 board (deep navy, title then art),
// H2 poster (the bold top piece carries the headline, one real jigsaw seam, the art on the navy bottom piece),
// H3 chapter (full series ground). The mosaic and the week wall open with their image (role 'image'), because
// the image is the headline. Walls and boards are 'image', clue/answer slides 'quiz', number slides 'data'.
//
// Colours only through the ground tokens (--g-*, --c-*); box art and white mounts (which carry the paper ground's
// tokens for their text) are the only fixed colours. Every box image carries its credit; quiz clues read
// "Mystery puzzle · Brand" until the answer slide names the puzzle; the mosaics carry a collective credit line.
//
// Precompute (sharp, cached in content/cache/f1/, shared with DL2 F1): perceived colour and tile crop per box,
// 72 px mosaic thumbnails. The functions are copied from lab/dl2/directions/f1-box-walls.ts (not exported there).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  CW, FEED, GROUNDS, STORY, W, X0, X1, f1, posterAt, frame, groundVars, linesOf, posterTopPath, seamReach, slide, slotOf,
  type Ground, type Role, type SlideCtx, type Variant,
} from '../../../src/design/house.ts';
import { fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw, outlineToPath, sampleOutline, type Jigsaw, type Piece, type Point } from '../../../src/pieces/jigsaw.ts';
import { ROOT } from '../../../src/render/server.ts';
import { loadContent as loadDl2, type Box } from '../../dl2/content.ts';
import type { Content } from '../content.ts';
import type { Family, Post, Slide } from '../types.ts';

type C2 = Content['dl2'];
type SepBox = C2['september']['boxes'][number];

// ---------------------------------------------------------------- precompute (cached; copied from DL2 F1)

interface Crop { x: number; y: number; s: number; L: number; C: number; h: number }
interface Tone { L: number; C: number; h: number; hex: string; w: number; h_px: number; crop?: Crop }
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

async function prepare(c: C2) {
  mkdirSync(join(CACHE, 'tile'), { recursive: true });
  const tones: Record<string, Tone> = existsSync(TONES_FILE) ? JSON.parse(readFileSync(TONES_FILE, 'utf8')) : {};
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

const TONES = await prepare(loadDl2());
const tone = (img: string) => TONES[img];
/** Pixel size of a cached JPEG (SOF marker), for images without a tone entry (copied from DL2 F2). */
const sizes = new Map<string, { w: number; h: number }>();
function imgSize(url: string) {
  const t = tone(url);
  if (t) return { w: t.w, h: t.h_px };
  if (sizes.has(url)) return sizes.get(url)!;
  const b = readFileSync(join(ROOT, url));
  let i = 2, out = { w: 4, h: 3 };
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { out = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; break; }
    i += 2 + b.readUInt16BE(i + 2);
  }
  sizes.set(url, out);
  return out;
}
const aspect = (img: string) => { const s = imgSize(img); return s.w / s.h; };
const bestImg = (img: string) => (existsSync(join(ROOT, largeOf(img))) ? largeOf(img) : img);
const NEUTRAL_C = 7;
function colourFamily(t: { C: number; h: number }) {
  if (t.C < NEUTRAL_C) return 'greys';
  const names: Array<[number, string]> = [[20, 'pinks'], [48, 'reds'], [72, 'oranges'], [102, 'yellows'], [170, 'greens'], [235, 'teals'], [295, 'blues'], [345, 'purples'], [360, 'pinks']];
  return names.find(([max]) => t.h < max)![1];
}

// ---------------------------------------------------------------- house glue

/** Local classes. Colours only via the ground tokens; white mounts carry the paper ground's tokens. */
const FX_CSS = `<style>
.fx-mat { box-sizing: border-box; padding: 12px; border-radius: 4px; }
.fx-shadow { filter: drop-shadow(0 16px 18px rgba(12, 16, 26, 0.42)); }
.fx-lift { filter: drop-shadow(0 22px 20px rgba(6, 8, 14, 0.62)); }
.fx-ledge { position: absolute; left: 0; width: ${W}px; height: 10px; background: var(--g-rule); }
.fx-stk { position: absolute; display: grid; place-items: center; border-radius: 50%; background: var(--g-device); font-weight: 700; letter-spacing: -0.02em; line-height: 1; box-shadow: 0 0 0 5px var(--g-bg); }
.fx-lbl { position: absolute; }
.fx-lbl .t { position: relative; padding-left: 42px; font-size: 30px; font-weight: 600; line-height: 1.15; color: var(--g-ink); }
.fx-lbl .t::before { content: ''; position: absolute; left: 0; top: 3px; width: 26px; height: 26px; box-sizing: border-box; border: 3px solid var(--g-ink); border-radius: 5px; }
.fx-lbl .s { padding-left: 42px; font-size: 24px; line-height: 1.3; color: var(--g-soft); margin-top: 6px; }
.fx-lbl .s b { color: var(--g-ink); font-weight: 700; }
.fx-cr { font-size: 24px; line-height: 1.3; color: var(--g-soft); }
.fx-cr b { color: var(--g-ink); font-weight: 600; }
.fx-tile { position: absolute; display: block; }
.fx-pill { position: absolute; padding: 0 12px; height: 40px; line-height: 40px; border-radius: 20px; background: var(--g-bg); color: var(--g-ink); font-size: 26px; font-weight: 700; }
.fx-name { font-size: 96px; font-weight: 700; line-height: 1.02; letter-spacing: -0.025em; color: var(--g-ink); text-wrap: balance; }
.fx-huge { font-size: 112px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; color: var(--g-ink); white-space: nowrap; }
.fx-kv { display: flex; gap: 64px; }
.fx-kv .v { font-size: 64px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.fx-kv .k { font-size: 30px; line-height: 1.25; margin-top: 6px; color: var(--g-soft); }
.fx-up .rk { font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); }
.fx-up .nm { font-size: 48px; font-weight: 700; line-height: 1.08; margin-top: 6px; color: var(--g-ink); text-wrap: balance; }
.fx-up .br { font-size: 30px; margin-top: 6px; color: var(--g-soft); }
.fx-up .n { font-size: 34px; margin-top: 14px; color: var(--g-soft); }
.fx-up .n b { color: var(--g-ink); font-weight: 700; }
.fx-stat .v { font-size: 104px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; color: var(--g-ink); }
.fx-stat .k { font-size: 32px; line-height: 1.2; margin-top: 12px; max-width: 300px; color: var(--g-ink); }
.fx-stat.r { text-align: right; }
.fx-stat.r .k { margin-left: auto; }
.fx-race .hd { display: flex; align-items: baseline; justify-content: space-between; }
.fx-race .nm { font-size: 44px; font-weight: 700; color: var(--g-ink); }
.fx-race .tm { font-size: 72px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; color: var(--g-ink); }
.fx-fam .nm { font-size: 34px; font-weight: 700; line-height: 1.15; color: var(--g-ink); }
.fx-fam .nm i { font-style: normal; color: var(--g-soft); font-weight: 500; margin-right: 10px; }
.fx-fam .tm { font-size: 44px; font-weight: 700; margin-top: 4px; color: var(--g-ink); }
.fx-fam .tm.hot { color: var(--g-hot); }
.fx-pod { display: flex; align-items: center; gap: 16px; height: 68px; margin-bottom: 12px; padding: 0 26px 0 8px; border-radius: 34px; background: var(--g-band); }
.fx-pod .rk { display: grid; place-items: center; flex: none; width: 54px; height: 54px; border-radius: 50%; background: #ffffff; font-size: 38px; font-weight: 700; color: var(--g-ink); }
.fx-pod.first .rk { background: var(--g-device); }
.fx-pod .nm { font-size: 32px; font-weight: 600; flex: 1; color: var(--g-ink); }
.fx-pod .tm { font-size: 32px; font-weight: 700; color: var(--g-ink); }
</style>`;

const PAPER = GROUNDS.paper;
/** Attributes that put the paper ground's text tokens on a white mount (QA checks text against white). */
const onWhite = `style="${groundVars(PAPER)}" data-qa-bg="#ffffff"`;

const groundOf = (x: SlideCtx, role: Role): Ground => GROUNDS[x.v.ground(slotOf(x, role))];

const lumOf = (hex: string) => {
  const ch = (i: number) => { const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(0) + 0.7152 * ch(1) + 0.0722 * ch(2);
};
const contrast = (a: string, b: string) => { const [x, y] = [lumOf(a), lumOf(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** Ink for text on a fill (the device colour): navy ink or white, whichever reads better. */
const inkOn = (fill: string) => (contrast('#1d2433', fill) >= contrast('#ffffff', fill) ? '#1d2433' : '#ffffff');

/** Rank sticker in the ground's device colour, ringed with the ground; the number is ≥ 37 px bold. */
const sticker = (g: Ground, rank: number | string, x: number, y: number, d = 64) =>
  `<span class="fx-stk" data-qa-bg="${g.device}" style="left:${f1(x)}px; top:${f1(y)}px; width:${d}px; height:${d}px; font-size:${Math.max(38, Math.round(d * 0.58))}px; color:${inkOn(g.device)}">${h(String(rank))}</span>`;

/** A content slide through house `slide()`, with the local classes. */
function sl(x: SlideCtx, role: Role, o: { kicker: string; body: string; src: string; title?: string; titleSize?: 'xl' | 's'; kind?: 'feed' | 'story' }) {
  return slide(x, role, { ...o, body: FX_CSS + o.body }).html;
}

interface Band { top: number; bottom: number }
interface ArtCoverSpec {
  kicker: string;
  title: string;
  dek?: string;
  src: string;
  titlePx?: number;
  /** The art (absolute markup) inside the band the layout leaves for it, on ground `g`. */
  art: (band: Band, g: Ground) => string;
}

/**
 * Image-led cover (local; proposed for house.ts as `cover({ art })` in every layout):
 *   board (H1)   deep navy, headline + dek, then the art;
 *   poster (H2)  the headline on the bold top piece, one real jigsaw seam, the art on the navy bottom piece;
 *   chapter (H3) the series ground, headline + dek, then the art.
 */
function artCover(x: SlideCtx, s: ArtCoverSpec): string {
  const v = x.v;
  const slot = slotOf(x, 'cover');
  const idx: [number, number] | undefined = x.of > 1 ? [x.slide, x.of] : undefined;
  const titlePx = s.titlePx ?? (s.title.length > 40 ? 62 : 76);
  const titleH = linesOf(s.title, titlePx, CW, true) * titlePx * 1.06;
  const dekH = s.dek ? 16 + linesOf(s.dek, 38) * 38 * 1.3 : 0;
  const textBottom = FEED.contentTop + titleH + dekH;
  const text = (g?: Ground) => `<div class="h-abs" style="top:${FEED.contentTop}px${g ? `; ${groundVars(g)}` : ''}"${g ? ` data-qa-bg="${g.bg}"` : ''}>
      <h1 class="h-title" style="position:static; font-size:${titlePx}px; line-height:1.06">${h(s.title)}</h1>
      ${s.dek ? `<p class="h-dek" style="margin-top:16px">${h(s.dek)}</p>` : ''}</div>`;
  if (posterAt(x)) {
    const top = GROUNDS[v.ground(slot)], base = GROUNDS[v.posterBase ?? 'navyDeep'];
    const seam = Math.round(textBottom + 92);
    const under = `<svg class="h-poster-top" width="${W}" height="${FEED.footRule}" viewBox="0 0 ${W} ${FEED.footRule}" aria-hidden="true"><path d="${posterTopPath(seam)}" fill="${top.bg}"/></svg>`;
    const body = FX_CSS + text(top) + s.art({ top: seam + Math.max(96, Math.round(seamReach().down) + 20), bottom: FEED.contentBottom }, base);
    return frame({ ground: base.key, kicker: s.kicker, idx, device: v.device, body, src: s.src, under, noRule: true, headGround: top.key });
  }
  const g = GROUNDS[v.ground(slot)];
  const body = FX_CSS + text() + s.art({ top: Math.round(textBottom + 48), bottom: FEED.contentBottom }, g);
  return frame({ ground: g.key, kicker: s.kicker, idx, device: v.device, body, src: s.src });
}

/** Builds a post with each slide's position known up front (makers are [name, build] pairs; ids are key-n). */
function post(v: Variant, meta: { key: string; label: string; caption: string }, makers: Array<[string, (x: SlideCtx) => string]>, kind?: 'story'): Post {
  return {
    ...meta,
    slides: makers.map(([, m], i): Slide => ({ id: `${meta.key}-${i + 1}`, body: m({ v, post: meta.key, slide: i + 1, of: makers.length }), frame: kind })),
  };
}

// ---------------------------------------------------------------- F1 · September wall (F1-1…5)

const MAT = 12, LEDGE = 10;
interface Placed { b: SepBox; rank: number; x: number; y: number; w: number; h: number; lx: number; lw: number; ledge: number }

/** Mounted boxes standing on ledges: equal slots per row; the art height shrinks so the wall fits [top, bottom]. */
function ledgeWall(items: Array<{ b: SepBox; rank: number }>, perRow: number, top: number, bottom: number) {
  const GAP = 34, ROWGAP = 30, LABEL_GAP = 18;
  const slotW = (CW - GAP * (perRow - 1)) / perRow;
  const rows: Array<typeof items> = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  const labelH = (r: typeof items) => Math.max(...r.map(it => Math.min(3, Math.ceil(it.b.puzzle.length * 16.5 / (slotW - 50))) * 35 + 2 * 31 + 6));
  const fixed = rows.reduce((s, r) => s + 2 * MAT + LEDGE + LABEL_GAP + labelH(r), 0) + ROWGAP * (rows.length - 1);
  const artMax = Math.min(((slotW - 2 * MAT) / 1.36) * 1.25, (bottom - top - fixed) / rows.length);
  const fit = (img: string) => {
    const a = aspect(img);
    let aw = slotW - 2 * MAT, ah = aw / a;
    if (ah > artMax) { ah = artMax; aw = ah * a; }
    return { aw, ah };
  };
  const rowArt = (r: typeof items) => Math.max(...r.map(it => fit(it.b.img).ah));
  const total = rows.reduce((s, r) => s + rowArt(r) + 2 * MAT + LEDGE + LABEL_GAP + labelH(r), 0) + ROWGAP * (rows.length - 1);
  let y = top + Math.max(0, (bottom - top - total) / 2);
  const placed: Placed[] = [];
  const ledges: number[] = [];
  for (const r of rows) {
    const ledgeY = y + rowArt(r) + 2 * MAT;
    const x0 = X0 + ((perRow - r.length) * (slotW + GAP)) / 2;
    r.forEach((it, k) => {
      const { aw, ah } = fit(it.b.img);
      const w = aw + 2 * MAT, hh = ah + 2 * MAT, slotX = x0 + k * (slotW + GAP);
      placed.push({ b: it.b, rank: it.rank, x: slotX + (slotW - w) / 2, y: ledgeY - hh, w, h: hh, lx: slotX, lw: slotW, ledge: ledgeY });
    });
    ledges.push(ledgeY);
    y = ledgeY + LEDGE + LABEL_GAP + labelH(r) + ROWGAP;
  }
  return { placed, ledges, labelTop: (p: Placed) => p.ledge + LEDGE + LABEL_GAP };
}

const mount = (p: { x: number; y: number; w: number; h: number }, img: string) =>
  `<figure class="h-mount fx-mat" style="left:${f1(p.x)}px; top:${f1(p.y)}px; width:${f1(p.w)}px; height:${f1(p.h)}px; margin:0"><img src="${img}" alt=""></figure>`;

function sepWall(c: C2, src: string, v: Variant): Post {
  const s = c.september;
  const N = 25;
  const top = s.boxes.slice(0, N).map((b, i) => ({ b, rank: i + 1 }));
  const hero = top[0];
  const kicker = `Most solved · ${s.label}`;

  const cover = (x: SlideCtx) => artCover(x, {
    kicker, src, title: `The ${N} most-solved puzzles of September`, dek: "Tick off the ones you've solved.",
    art: (band, g) => {
      // The No. 1 never cropped, standing on a ledge; its label and solver count under the ledge.
      const img = bestImg(hero.b.img);
      const a = aspect(img);
      const LABEL = 150;
      const artH0 = band.bottom - band.top - LABEL - 2 * MAT - LEDGE - 26;
      const artW = Math.min(700, (imgSize(img).w) * 1.13, artH0 * a), artH = artW / a;
      const fx = (W - artW) / 2 - MAT, fy = band.top + Math.max(0, (artH0 - artH) / 2) + 20;
      const ledgeY = fy + artH + 2 * MAT;
      return `<div class="fx-ledge" style="top:${f1(ledgeY)}px"></div>
        ${mount({ x: fx, y: fy, w: artW + 2 * MAT, h: artH + 2 * MAT }, img)}
        ${sticker(g, 1, Math.max(X0 - 4, fx - 40), fy - 40, 104)}
        <div class="fx-lbl" style="left:${X0}px; top:${f1(ledgeY + LEDGE + 30)}px; width:600px">
          <p class="t" style="font-size:48px; line-height:1.08; padding-left:58px">${h(hero.b.puzzle)}</p>
          <p class="s" style="font-size:30px; margin-top:12px; padding-left:58px">${h(hero.b.brand)} · ${fmtInt(hero.b.pieces)} pieces</p>
        </div>
        <style>.fx-lbl .t[style*="48px"]::before { width: 38px; height: 38px; top: 7px; }</style>
        <div class="h-abs" style="left:auto; right:${W - X1}px; width:auto; top:${f1(ledgeY + LEDGE + 24)}px; text-align:right">
          <p class="h-big" style="font-size:96px">${fmtInt(hero.b.solvers)}</p>
          <p class="h-lab" style="margin-top:8px">puzzlers solved it</p>
        </div>`;
    },
  });

  const walls: Array<[string, (x: SlideCtx) => string]> = [];
  const per = 6;
  for (let i = 1; i < N; i += per) {
    const grp = top.slice(i, i + per);
    const last = i + per >= N;
    walls.push(['wall', x => {
      const g = groundOf(x, 'image');
      const wall = ledgeWall(grp, 3, 262, FEED.contentBottom);
      return sl(x, 'image', { kicker, src, title: `No. ${grp[0].rank}–${grp[grp.length - 1].rank}`, body: `
        ${wall.ledges.map(y => `<div class="fx-ledge" style="top:${f1(y)}px"></div>`).join('')}
        ${wall.placed.map(p => mount(p, p.b.img)).join('')}
        ${wall.placed.map(p => sticker(g, p.rank, Math.max(X0 - 4, p.x - 22), p.y - 24, 64)).join('')}
        ${wall.placed.map(p => `<div class="fx-lbl" style="left:${f1(p.lx)}px; top:${f1(wall.labelTop(p))}px; width:${f1(p.lw)}px">
            <p class="t">${h(p.b.puzzle)}</p>
            <p class="s" data-qa-small>${h(p.b.brand)}<br>solved by <b>${fmtInt(p.b.solvers)}</b></p></div>`).join('')}
        ${last ? `<p class="h-abs" style="left:auto; right:${W - X1}px; width:auto; top:${FEED.contentTop + 14}px; font-size:38px; font-weight:700; line-height:1.2; padding-bottom:6px; border-bottom:8px solid var(--g-device)">How many have you solved?</p>` : ''}` });
    }]);
  }

  const brands = [...new Set(top.map(t => t.b.brand))];
  return post(v, {
    key: 'sep-wall',
    label: "September's most-solved puzzles (box wall)",
    caption: `September's most-solved puzzles on MySpeedPuzzling 🧩

${hero.b.puzzle} by ${hero.b.brand} takes the top spot: ${fmtInt(hero.b.solvers)} puzzlers solved it in ${s.label}. Swipe along the wall for No. 2–${N}.

How many of the ${N} have you solved? Screenshot, tick them off and drop your score in the comments.

Box art: ${brands.join(', ')}.
#speedpuzzling #jigsawpuzzle #puzzletime #ravensburger`,
  }, [['cover', cover], ...walls]);
}

// ---------------------------------------------------------------- F1 · September mosaic (F1-6, F1-7, F1-8)

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

const MOSAIC_PITCH = 20, MOSAIC_GAP = 1;
let mosaicCache: { pc: ReturnType<typeof pieceCells>; assign: Map<Cell, SepBox> } | null = null;
function mosaicModel(c: C2) {
  if (!mosaicCache) {
    const pc = pieceCells(c.september.boxes.length, MOSAIC_PITCH, 4, 0.2);
    mosaicCache = { pc, assign: colourField(pc.cells, c.september.boxes) };
  }
  return mosaicCache;
}

function sepMosaic(c: C2, src: string, v: Variant): Post {
  const s = c.september;
  const n = s.boxes.length;
  const pitch = MOSAIC_PITCH, gap = MOSAIC_GAP;
  const { pc, assign } = mosaicModel(c);
  const rank = new Map(s.boxes.map((b, i) => [b.puzzleId, i + 1]));
  const brands = new Set(s.boxes.map(b => b.brand)).size;
  const solves = s.boxes.reduce((t, b) => t + b.results, 0);
  const share = Math.round((solves / s.results) * 100);
  // The tiles' gaps and the piece's outline show the ground, so the mosaic sits on any variant ground.
  const mosaic = (ox: number, oy: number, scale = 1) => `
    <div style="position:absolute; left:${f1(ox)}px; top:${f1(oy)}px; width:${f1(pc.w)}px; height:${f1(pc.h)}px; transform-origin:0 0; transform:scale(${scale}); clip-path:path('${pc.d}'); background:var(--g-bg)">
      ${pc.cells.map(cell => `<img class="fx-tile" src="/${thumbRel(assign.get(cell)!)}" alt="" style="left:${cell.x + gap / 2}px; top:${cell.y + gap / 2}px; width:${pitch - gap}px; height:${pitch - gap}px">`).join('')}
      <svg style="position:absolute; left:0; top:0" width="${f1(pc.w)}" height="${f1(pc.h)}"><path d="${pc.d}" fill="none" stroke="var(--g-bg)" stroke-width="${f1(10 / scale)}"/></svg>
    </div>`;
  const credit = `${fmtInt(n)} most-solved of ${s.label} · ${brands} brands · box art: publishers`;

  // 1 · the mosaic (F1-6)
  const s1 = (x: SlideCtx) => {
    const top = 268, room = FEED.contentBottom - top;
    const sc = Math.min(1, room / pc.h, CW / pc.w);
    return sl(x, 'image', { kicker: `${s.label} on MSP`, src: credit, title: `September in ${fmtInt(n)} puzzles`, body: mosaic((W - pc.w * sc) / 2, top + (room - pc.h * sc) / 2, sc) });
  };

  // 2 · zoom (F1-7): the 3×3 neighbourhood of No. 1, numbered tiles, the map and the credits.
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
  const zoom: Array<{ b: SepBox; i: number; j: number }> = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const cl = at.get(`${win.c0 + i},${win.r0 + j}`);
    if (cl) zoom.push({ b: assign.get(cl)!, i, j });
  }
  const zoomList = [...zoom].sort((a, b) => rank.get(a.b.puzzleId)! - rank.get(b.b.puzzleId)!);
  const s2 = (x: SlideCtx) => {
    const g = groundOf(x, 'image');
    const zs = 128, zg = 8, zx = X0, zy = 324;
    const zw = 3 * zs + 2 * zg;
    const mapScale = 0.4, mapX = X1 - pc.w * mapScale, mapY = zy + (zw - pc.h * mapScale) / 2;
    const win1 = { x: mapX + win.c0 * pitch * mapScale, y: mapY + win.r0 * pitch * mapScale, s: 3 * pitch * mapScale };
    const listY = zy + zw + 30;
    return sl(x, 'image', { kicker: 'Zoom in', src, title: 'Every tile is one puzzle, sorted by colour', titleSize: 's', body: `
      ${zoom.map(z => {
        const t = tone(z.b.img), cr = t.crop!, k = zs / cr.s;
        return `<div style="position:absolute; left:${zx + z.i * (zs + zg)}px; top:${zy + z.j * (zs + zg)}px; width:${zs}px; height:${zs}px; overflow:hidden; border-radius:3px">
          <img src="${z.b.img}" alt="" style="position:absolute; left:${f1(-cr.x * k)}px; top:${f1(-cr.y * k)}px; width:${f1(t.w * k)}px; height:${f1(t.h_px * k)}px; max-width:none"></div>`;
      }).join('')}
      ${zoom.filter(z => z.b.puzzleId === top1.puzzleId).map(z => `<div style="position:absolute; left:${zx + z.i * (zs + zg) - 9}px; top:${zy + z.j * (zs + zg) - 9}px; width:${zs + 6}px; height:${zs + 6}px; border:6px solid var(--c-hot); border-radius:6px"></div>`).join('')}
      ${zoom.map(z => `<span class="fx-pill" data-qa-bg="${g.bg}" data-qa-small style="left:${zx + z.i * (zs + zg) + 6}px; top:${zy + z.j * (zs + zg) + zs - 46}px">${rank.get(z.b.puzzleId)}</span>`).join('')}
      ${mosaic(mapX, mapY, mapScale)}
      <svg style="position:absolute; left:${zx + zw}px; top:${zy}px" width="${f1(mapX - zx - zw)}" height="${zw}" viewBox="0 0 ${f1(mapX - zx - zw)} ${zw}">
        <path d="M 8 0 L ${f1(win1.x - zx - zw)} ${f1(win1.y - zy)} M 8 ${zw} L ${f1(win1.x - zx - zw)} ${f1(win1.y - zy + win1.s)}" stroke="var(--c-hot)" stroke-width="3" fill="none"/></svg>
      <div style="position:absolute; left:${f1(win1.x - 3)}px; top:${f1(win1.y - 3)}px; width:${f1(win1.s + 6)}px; height:${f1(win1.s + 6)}px; box-sizing:border-box; border:3px solid var(--c-hot)"></div>
      <div class="h-abs" style="top:${listY}px">
        <ol class="fx-cr" data-qa-small style="list-style:none; margin:0; padding:0">
          ${zoomList.map(z => `<li><b>No. ${rank.get(z.b.puzzleId)}</b> ${h(z.b.credit)} · ${fmtInt(z.b.solvers)} puzzlers</li>`).join('')}
        </ol>
        <p class="h-body" style="margin-top:16px; font-size:30px">No. 1 sits among the ${colourFamily(tone(top1.img).crop!)}. Together the ${fmtInt(n)} were solved <b style="color:var(--g-ink)">${fmtInt(solves)}</b> times, ${share}% of all ${fmtInt(s.results)} results in ${h(s.label)}.</p>
      </div>` });
  };

  return post(v, {
    key: 'sep-mosaic',
    label: 'September in 1,000 puzzles (colour mosaic)',
    caption: `This is September on MySpeedPuzzling: the ${fmtInt(n)} most-solved puzzles of the month, one tile each, sorted by colour into a single piece.

Together they were solved ${fmtInt(solves)} times, ${share}% of all ${fmtInt(s.results)} results logged in ${s.label}. Zoom in: can you spot the last puzzle you solved?

Last slide: the same ${fmtInt(n)} tiles regrouped by brand. Box art by their publishers (${brands} brands).
#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
  }, [['mosaic', s1], ['zoom', s2], ['brands', x => brandSlide(x, c, src)]]);
}

/** F1-8: the same 1,000 tiles regrouped by brand: one colour-sorted block per brand, the long tail pooled. */
function brandSlide(x: SlideCtx, c: C2, src: string): string {
  const s = c.september;
  const pitch = MOSAIC_PITCH, gap = MOSAIC_GAP;
  const byBrand = new Map<string, SepBox[]>();
  for (const b of s.boxes) byBrand.set(b.brand, [...(byBrand.get(b.brand) ?? []), b]);
  const ranked = [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length);
  const [lead, ...rest] = ranked;
  const side = rest.slice(0, 8);
  const tail = rest.slice(8);
  const tailBoxes = tail.flatMap(([, bs]) => bs);
  const block = (boxes: SepBox[], cols: number, bx: number, by: number) => {
    const rows = Math.ceil(boxes.length / cols);
    const cells: Cell[] = boxes.map((_, i) => {
      const col = Math.floor(i / rows), row = i % rows;
      return { col, row, x: col * pitch, y: row * pitch, cx: 0, cy: 0 };
    });
    const assign = colourField(cells, boxes);
    return { h: rows * pitch, html: cells.map(cl => `<img class="fx-tile" src="/${thumbRel(assign.get(cl)!)}" alt="" style="left:${bx + cl.x}px; top:${by + cl.y}px; width:${pitch - gap}px; height:${pitch - gap}px">`).join('') };
  };
  const leftCols = 25, rightX = X0 + leftCols * pitch + 44, rightCols = Math.floor((X1 - rightX + gap) / pitch);
  const label = (n: number, name: string, lx: number, ly: number, w: number, big = false) =>
    `<p style="position:absolute; left:${lx}px; top:${ly}px; width:${w}px; font-size:${big ? 40 : 30}px; line-height:1.1; font-weight:500; color:var(--g-ink); white-space:nowrap"><b style="font-weight:700">${fmtInt(n)}</b> ${h(name)}</p>`;
  const y0 = 268;
  let html = '';
  let y = y0;
  html += label(lead[1].length, lead[0], X0, y, leftCols * pitch, true);
  const lb = block(lead[1], leftCols, X0, y + 58);
  html += lb.html;
  y += 58 + lb.h + 32;
  html += label(tailBoxes.length, `from ${tail.length} more brands`, X0, y, leftCols * pitch);
  html += block(tailBoxes, leftCols, X0, y + 46).html;
  let ry = y0 + 10;
  for (const [name, bs] of side) {
    html += label(bs.length, name, rightX, ry, X1 - rightX);
    const b = block(bs, rightCols, rightX, ry + 44);
    html += b.html;
    ry += 44 + b.h + 22;
  }
  return sl(x, 'image', { kicker: `The same ${fmtInt(s.boxes.length)}, by brand`, src: `Box art by their publishers · ${src}`, title: `${fmtInt(byBrand.size)} brands made September`, body: html });
}

// ---------------------------------------------------------------- F1 · Week wall (F1-9, F1-10)

/** "Box art: Ravensburger unless noted. 1 Title · 2 Title (speedpuzzle.eu) …" */
function creditLine(items: Array<{ rank: number; b: Box }>) {
  const count = new Map<string, number>();
  for (const { b } of items) count.set(b.brand, (count.get(b.brand) ?? 0) + 1);
  const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const parts = items.map(({ rank, b }) => `<b>${rank}</b>&nbsp;${h(b.puzzle)}${b.brand === main ? '' : ` (${h(b.brand)})`}`);
  return `Box art: ${h(main)} unless noted. ${parts.join(' · ')}`;
}

function weekWall(c: C2, src: string, v: Variant): Post {
  const wk = c.weekTop;
  const cols = 3, rows = 4, pw = CW / cols, ph = Math.round(pw / 1.56);
  const px = X0, py = 270;
  const jig = generateJigsaw({ cols, rows, width: CW, height: ph * rows, x: px, y: py, seed: 21, tabSize: 0.22 });
  const pieces = [...jig.pieces].sort((a, b) => a.row - b.row || a.col - b.col);
  const items = wk.map((b, i) => ({ rank: i + 1, b }));
  const kicker = `Most solved · ${c.weekRange}`;

  const s1 = (x: SlideCtx) => {
    const g = groundOf(x, 'image');
    const defs = pieces.map((p, i) => `<clipPath id="wp${i}"><path d="${p.d}"/></clipPath>`).join('');
    const imgs = pieces.map((p, i) => `<image href="${wk[i].img}" x="${p.bbox.x}" y="${p.bbox.y}" width="${p.bbox.width}" height="${p.bbox.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#wp${i})"/>`).join('');
    return sl(x, 'image', { kicker, src, title: "Last week's puzzle wall", body: `
      <svg style="position:absolute; left:0; top:0" width="${W}" height="1350" viewBox="0 0 ${W} 1350"><defs>${defs}</defs>
        <g class="fx-shadow">${imgs}</g>
        <path d="${jig.cuts}" fill="none" stroke="var(--g-bg)" stroke-width="7" stroke-linecap="round"/>
        <path d="${pieces[0].d}" fill="none" stroke="var(--c-hot)" stroke-width="7" stroke-linejoin="round"/></svg>
      ${pieces.map((p, i) => sticker(g, i + 1, px + p.col * pw + 14, py + p.row * ph + 14, 60)).join('')}
      <p class="h-abs fx-cr" data-qa-small style="top:${py + ph * rows + 16}px">${creditLine(items)}</p>` });
  };

  // The numbers: the same pieces as thumbnails on a timing board.
  const s2 = (x: SlideCtx) => {
    const rowH = 68, ty = 316;
    const thumb = (p: Piece, i: number) => {
      const sc = 58 / pw;
      return `<svg width="${f1(p.bbox.width * sc)}" height="${f1(p.bbox.height * sc)}" viewBox="${p.bbox.x} ${p.bbox.y} ${p.bbox.width} ${p.bbox.height}"><defs><clipPath id="tp${i}"><path d="${p.d}"/></clipPath></defs>
        <image href="${wk[i].img}" x="${p.bbox.x}" y="${p.bbox.y}" width="${p.bbox.width}" height="${p.bbox.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#tp${i})"/></svg>`;
    };
    const grid = 'display:grid; grid-template-columns: 52px 96px 1fr 100px 126px 126px; align-items:center';
    const hd = 'text-align:right; font-size:26px; letter-spacing:0.02em; text-transform:none';
    return sl(x, 'data', { kicker, src: `Median and fastest: all-time solo times on each puzzle · ${src}`, title: 'The numbers behind the wall', titleSize: 's', body: `
      <div class="h-board" style="top:${ty - 58}px">
        <div class="h-bh" data-qa-small style="${grid}"><span></span><span></span><span style="${hd}; text-align:left">Puzzle</span><span style="${hd}">Puzzlers</span><span style="${hd}">Median</span><span style="${hd}">Fastest</span></div>
        ${wk.map((b, i) => `<div class="h-br${i === 0 ? ' hot' : ''}" style="${grid}; height:${rowH}px">
          <span class="rk" style="width:auto">${i + 1}</span>
          <span style="display:flex; align-items:center">${thumb(pieces[i], i)}</span>
          <span style="line-height:1.08; white-space:nowrap; overflow:hidden"><span style="font-size:30px; font-weight:600; color:var(--g-ink)">${h(b.puzzle)}</span><br><span data-qa-small style="font-size:24px; color:var(--g-soft)">${h(b.brand)}</span></span>
          <span style="font-size:34px; font-weight:700; text-align:right; color:var(--g-ink)">${fmtInt(b.solversWeek)}</span>
          <span style="font-size:30px; text-align:right; color:var(--g-soft)">${b.medianSolo ?? '–'}</span>
          <span style="font-size:30px; text-align:right; color:var(--g-soft)">${b.fastestSolo ?? '–'}</span></div>`).join('')}
      </div>` });
  };

  const p1 = wk[0];
  return post(v, {
    key: 'week-wall',
    label: "Last week's puzzle wall (12 most-solved)",
    caption: `Last week's puzzle wall: the 12 most-solved puzzles on MySpeedPuzzling, ${c.weekRange}.

${p1.puzzle} by ${p1.brand} led the week with ${fmtInt(p1.solversWeek)} puzzlers. Which one is on your table this week?

Box art: ${[...new Set(wk.map(b => b.brand))].join(', ')}.
#speedpuzzling #jigsawpuzzle #puzzleoftheweek`,
  }, [['wall', s1], ['numbers', s2]]);
}

// ---------------------------------------------------------------- F1 · Event collage template (F1-11)

const edgePath = (pts: Point[]) => `M ${pts[0][0]} ${pts[0][1]} C ${pts[1].join(' ')} ${pts[2].join(' ')} ${pts[3].join(' ')} C ${pts[4].join(' ')} ${pts[5].join(' ')} ${pts[6].join(' ')} C ${pts[7].join(' ')} ${pts[8].join(' ')} ${pts[9].join(' ')}`;
const pieceEdge = (p: Piece, k: number) => p.outline.slice(9 * k, 9 * k + 10);

interface EventCollage { name: string; when: string; where: string; photos: Array<string | null>; podium: Array<{ name: string; time: string }> }
type Region = { kind: 'photo'; slot: number; hint: string } | { kind: 'title' } | { kind: 'results' };

function eventCollage(x: SlideCtx, ev: EventCollage): string {
  const g = groundOf(x, 'cover');
  // A 3 × 4 jigsaw over the content area; regions are unions of whole pieces, cut lines only between regions.
  const cols = 3, rows = 4, top = FEED.contentTop + 4, H = FEED.contentBottom - top, pw = CW / cols, ph = H / rows;
  const jig = generateJigsaw({ cols, rows, width: CW, height: H, x: X0, y: top, seed: 9, tabSize: 0.2 });
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
    return { x: X0 + c0 * pw, y: top + r0 * ph, w: (c1 - c0) * pw, h: (r1 - r0) * ph };
  };
  const defs = regions.map((rg, i) => `<clipPath id="er${i}">${piecesOf(rg).map(p => `<path d="${p.d}"/>`).join('')}</clipPath>`).join('');
  // Photo slots and results are light prints (the paper ground's band and white) in one shadowed group, so the
  // template reads the same on every ground; the owner's photos replace the slots.
  const fills = regions.map((rg, i) => {
    const b = bboxOf(piecesOf(rg));
    const photo = rg.kind === 'photo' ? ev.photos[rg.slot - 1] : null;
    if (photo) return `<image href="${photo}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#er${i})"/>`;
    if (rg.kind === 'title') return '';
    const fill = rg.kind === 'photo' ? PAPER.band : '#ffffff';
    return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fill}" clip-path="url(#er${i})"/>`;
  }).join('');
  const cuts: string[] = [];
  for (const p of jig.pieces) {
    const me = grid[p.row][p.col];
    if (p.col + 1 < cols && grid[p.row][p.col + 1] !== me) cuts.push(edgePath(pieceEdge(p, 1)));
    if (p.row + 1 < rows && grid[p.row + 1][p.col] !== me) cuts.push(edgePath(pieceEdge(p, 2)));
  }
  const placeholders = regions.filter((rg): rg is Extract<Region, { kind: 'photo' }> => rg.kind === 'photo' && !ev.photos[rg.slot - 1]).map(rg => {
    const b = cellBox(rg);
    const cx = Math.min(Math.max(b.x + b.w / 2, X0 + 130), X1 - 130), cy = b.y + b.h / 2;
    return `<svg style="position:absolute; left:${f1(cx - 44)}px; top:${f1(cy - 92)}px" width="88" height="66" viewBox="0 0 88 66"><rect x="3" y="3" width="82" height="60" rx="8" fill="none" stroke="${PAPER.soft}" stroke-width="4"/><circle cx="62" cy="22" r="8" fill="${PAPER.soft}"/><path d="M 6 56 L 30 30 L 48 48 L 58 38 L 82 60" fill="none" stroke="${PAPER.soft}" stroke-width="4" stroke-linejoin="round"/></svg>
      <div data-qa-bg="${PAPER.band}" style="position:absolute; left:${f1(cx - 120)}px; top:${f1(cy - 10)}px; width:240px; text-align:center; ${groundVars(PAPER)}">
        <p style="font-size:30px; font-weight:700; color:var(--g-ink)">Your photo ${rg.slot}</p>
        <p data-qa-small style="font-size:24px; color:var(--g-soft); margin-top:2px">${h(rg.hint)}</p></div>`;
  }).join('');
  const tb = cellBox(title), rb = cellBox(res);
  const body = `${FX_CSS}
    <svg style="position:absolute; left:0; top:0" width="${W}" height="1350" viewBox="0 0 ${W} 1350"><defs>${defs}</defs>
      <g class="fx-shadow">${fills}</g>
      <path d="${cuts.join(' ')}" fill="none" stroke="var(--g-bg)" stroke-width="12" stroke-linecap="round"/></svg>
    ${placeholders}
    <div class="h-abs" style="top:${f1(tb.y + 40)}px; width:${f1(tb.w - 90)}px">
      <p class="h-cap">${h(ev.when)} · ${h(ev.where)}</p>
      <p style="font-size:72px; font-weight:700; line-height:1.0; letter-spacing:-0.02em; margin-top:14px; color:var(--g-ink)">${h(ev.name)}</p>
    </div>
    <div class="h-abs" ${onWhite.replace('style="', `style="top:${f1(rb.y + 30)}px; left:${X0 + 22}px; width:${f1(rb.w - 110)}px; `)}>
      ${ev.podium.map((p, i) => `<div class="fx-pod${i === 0 ? ' first' : ''}" data-qa-bg="${PAPER.band}">
        <span class="rk" data-qa-bg="${i === 0 ? PAPER.device : '#ffffff'}" style="${i === 0 ? `color:${inkOn(PAPER.device)}` : ''}">${i + 1}</span>
        <span class="nm">${h(p.name)}</span><span class="tm">${h(p.time)}</span></div>`).join('')}
    </div>`;
  return frame({ ground: g.key, kicker: 'Event · photo template', device: x.v.device, body, src: 'Results: myspeedpuzzling.com' });
}

function event(v: Variant): Post {
  const sample: EventCollage = {
    name: 'Your event name', when: 'Date', where: 'City',
    photos: [null, null, null, null],
    podium: [{ name: 'Winner', time: 'time' }, { name: 'Second place', time: 'time' }, { name: 'Third place', time: 'time' }],
  };
  return post(v, {
    key: 'event-collage',
    label: 'Event collage template (photo placeholders)',
    caption: `[Template] {Event name}, {date} in {city}. {N} puzzlers, {pieces} pieces each, and a podium decided by {gap}.

Congratulations to {winner}, {second} and {third}! Full results on myspeedpuzzling.com.

#speedpuzzling #jigsawpuzzle #puzzlecompetition`,
  }, [['collage', x => eventCollage(x, sample)]]);
}

// ---------------------------------------------------------------- F2 · the puzzle board (copied, house colours)

const GAP_LINE = 'rgba(24,28,38,.30)';
const toSec = (t: string | null) => (t ?? '0').split(':').map(Number).reduce((s, v) => s * 60 + v, 0);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function weekOf(range: string) {
  const m = range.match(/(\d+) (\w{3}) – (\d+) (\w{3}) (\d{4})/)!;
  const d = new Date(Date.UTC(Number(m[5]), MONTHS.indexOf(m[2]), Number(m[1])));
  const t = new Date(d); t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - jan4.getTime()) / 864e5 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return { week, short: m[2] === m[4] ? `${m[1]}–${m[3]} ${m[2]} ${m[5]}` : range };
}

interface Board { img: string; x: number; y: number; w: number; h: number; jig: Jigsaw; uid: string; at: (c: number, r: number) => Piece }
/** A board `w` wide (or fitted into maxH), the generator's cut pattern over the box art. */
function makeBoard(img: string, o: { x: number; y: number; w: number; maxH?: number; cols: number; seed: number; uid: string; tab?: number; center?: boolean }): Board {
  const a = aspect(img);
  let w = o.w, hh = Math.round(w / a);
  if (o.maxH && hh > o.maxH) { hh = Math.round(o.maxH); w = Math.round(hh * a); }
  const x = o.center ? Math.round(o.x + (o.w - w) / 2) : o.x;
  const rows = Math.max(2, Math.round((o.cols * hh) / w));
  const jig = generateJigsaw({ cols: o.cols, rows, width: w, height: hh, x, y: o.y, seed: o.seed, tabSize: o.tab ?? 0.2 });
  return { img, x, y: o.y, w, h: hh, jig, uid: o.uid, at: (c, r) => jig.pieces.find(p => p.col === c && p.row === r)! };
}
const image = (b: Board, extra = '') => `<image href="${b.img}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid slice" ${extra}/>`;
const centre = (p: Piece) => [p.bbox.x + p.bbox.width / 2, p.bbox.y + p.bbox.height / 2];
const cellCentre = (b: Board, p: Piece) => {
  const pw = b.w / b.jig.options.cols, ph = b.h / b.jig.options.rows;
  return [b.x + pw * (p.col + 0.5), b.y + ph * (p.row + 0.5)];
};
/** Full-frame SVG layer for boards and loose pieces. */
const art = (inner: string, hgt = 1350) => `<svg style="position:absolute; left:0; top:0" width="${W}" height="${hgt}" viewBox="0 0 ${W} ${hgt}" aria-hidden="true">${inner}</svg>`;

/** The finished puzzle with its one soft shadow; optional holes (pieces taken out) show a slot in `holeFill`. */
function boardFull(b: Board, o: { holes?: Piece[]; holeFill?: string } = {}) {
  return `<g class="fx-shadow">${image(b)}</g>
    ${(o.holes ?? []).map(p => `<path d="${p.d}" fill="${o.holeFill ?? 'var(--g-band)'}"/>`).join('')}
    <path d="${b.jig.cuts}" fill="none" stroke="${GAP_LINE}" stroke-width="1.6"/>`;
}
/** A puzzle in progress: an empty mat in the ground's band colour with guide cuts, only `shown` pieces placed. */
function boardPartial(b: Board, shown: Piece[]) {
  const id = `${b.uid}-shown`;
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="var(--g-band)"/>
    <path d="${b.jig.cuts}" fill="none" stroke="var(--g-rule)" stroke-width="2"/>
    <clipPath id="${id}">${shown.map(p => `<path d="${p.d}"/>`).join('')}</clipPath>
    <g class="fx-shadow">${image(b, `clip-path="url(#${id})"`)}</g>
    ${shown.map(p => `<path d="${p.d}" fill="none" stroke="${GAP_LINE}" stroke-width="1.6"/>`).join('')}`;
}
/** One piece lifted off the board: moved to (cx, cy), rotated and scaled, with the soft shadow. */
function loose(b: Board, p: Piece, cx: number, cy: number, rot: number, s: number) {
  const [pcx, pcy] = centre(p);
  const t = `translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) scale(${s}) translate(${f1(-pcx)} ${f1(-pcy)})`;
  const id = `${b.uid}-p${p.col}-${p.row}`;
  return `<clipPath id="${id}"><path d="${p.d}"/></clipPath>
    <g class="fx-lift"><g transform="${t}">${image(b, `clip-path="url(#${id})"`)}
      <path d="${p.d}" fill="none" stroke="rgba(24,28,38,.28)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g></g>`;
}
const edgePieces = (b: Board) => b.jig.pieces.filter(p => p.col === 0 || p.row === 0 || p.col === b.jig.options.cols - 1 || p.row === b.jig.options.rows - 1);

const credit = (b: Box, top: number) => `<p class="h-abs h-credit" style="top:${f1(top)}px">${h(b.credit)}</p>`;
const byline = (b: Box, top: number) => `<p class="h-abs h-credit" style="top:${f1(top)}px"><b style="color:var(--g-ink); font-weight:600">${h(b.brand)}</b> · ${b.pieces} pieces</p>`;
const mystery = (b: Box, top: number) => `<p class="h-abs h-credit" style="top:${f1(top)}px">Mystery puzzle · ${h(b.brand)}</p>`;

// ---------------------------------------------------------------- F2 · Puzzle of the week (F2-1…4)

function potw(c: C2, src: string, v: Variant): Post {
  const p = c.puzzleOfTheWeek;
  const wk = weekOf(c.weekRange);
  const kicker = `Puzzle of the week · week ${wk.week}`;

  // 1 · cover: the finished puzzle with the "piece of the week" lifted out
  const cover = (x: SlideCtx) => artCover(x, {
    kicker, src, title: p.puzzle, titlePx: 96, dek: `${p.brand} · ${p.pieces} pieces · ${wk.short}`,
    art: band => {
      const SUB = 112;
      const b1 = makeBoard(p.img, { x: X0, y: band.top + 24, w: CW, maxH: band.bottom - band.top - SUB - 24, cols: 8, seed: 12, uid: 'potw1', center: true });
      const pick = b1.at(2, 1);
      const [pcx, pcy] = cellCentre(b1, pick);
      return `<div style="position:absolute; left:${b1.x}px; top:${b1.y}px; width:${b1.w}px; height:${b1.h}px"></div>
        ${art(`${boardFull(b1, { holes: [pick] })}${loose(b1, pick, pcx + 84, pcy - 96, 11, 1.25)}`)}
        <p class="h-abs h-dek" style="top:${b1.y + b1.h + 26}px">The most-solved puzzle on MSP last week: <b style="color:var(--g-ink)">${fmtInt(p.solversWeek)} puzzlers</b> in seven days.</p>`;
    },
  });

  // 2 · numbers: four interlocking pieces, the first cut from the box art, three white stat pieces
  const numbers = (x: SlideCtx) => {
    const gy = 360, gh = 700;
    const g = generateJigsaw({ cols: 2, rows: 2, width: CW, height: gh, x: X0, y: gy, seed: 21, tabSize: 0.15 });
    const [artPiece, ...tiles] = [...g.pieces].sort((a, b) => a.row - b.row || a.col - b.col);
    const stats = [
      { v: p.medianSolo ?? '–', k: 'median solo time' },
      { v: p.fastestSolo ?? '–', k: 'fastest solo time' },
      { v: p.firstAttemptPct == null ? '–' : `${p.firstAttemptPct}%`, k: 'first-attempt solves' },
    ];
    const pad = 46;
    const statHtml = stats.map((st, j) => {
      const i = j + 1, col = i % 2, row = Math.floor(i / 2);
      const pos = [col === 0 ? `left:${X0 + pad}px` : `right:${W - X1 + pad}px`, row === 0 ? `top:${gy + pad}px` : `top:${gy + gh - pad - 170}px`].join(';');
      return `<div class="fx-stat${col ? ' r' : ''}" ${onWhite.replace('style="', `style="position:absolute; ${pos}; `)}><div class="v">${h(st.v)}</div><div class="k">${h(st.k)}</div></div>`;
    }).join('');
    return sl(x, 'data', { kicker, src, title: `${fmtInt(p.solversWeek)} of its ${fmtInt(p.solversAll)} solvers on MSP did it last week.`, body: `
      ${art(`<g class="fx-shadow">${tiles.map(q => `<path d="${q.d}" fill="#ffffff"/>`).join('')}
        <clipPath id="nb-art"><path d="${artPiece.d}"/></clipPath>
        <image href="${p.img}" x="${X0}" y="${gy}" width="${CW}" height="${gh}" preserveAspectRatio="xMidYMid slice" clip-path="url(#nb-art)"/></g>
        ${g.pieces.map(q => `<path d="${q.d}" fill="none" stroke="var(--g-bg)" stroke-width="8"/>`).join('')}`)}
      ${statHtml}
      ${credit(p, gy + gh + 24)}` });
  };

  // 3 · runners-up
  const runners = (x: SlideCtx) => {
    const ups = c.weekTop.slice(1, 4);
    const rowY = [300, 584, 868];
    const upArt: string[] = [];
    const upHtml = ups.map((u, i) => {
      const s = imgSize(u.img);
      const bw = Math.round(Math.min(300, (220 * s.w) / s.h)), bh = (bw * s.h) / s.w;
      const top = Math.round(rowY[i] + (220 - bh) / 2);
      upArt.push(boardFull(makeBoard(u.img, { x: X0 + Math.round((300 - bw) / 2), y: top, w: bw, cols: bw < 250 ? 3 : 5, seed: 30 + i, uid: `up${i}` })));
      return `<div class="fx-up" style="position:absolute; left:430px; width:562px; top:${rowY[i] - 2}px"><div class="rk">No. ${i + 2}</div><div class="nm">${h(u.puzzle)}</div>
        <div class="br">${h(u.brand)} · ${u.pieces} pieces</div><div class="n"><b>${fmtInt(u.solversWeek)}</b> puzzlers last week</div></div>`;
    }).join('');
    return sl(x, 'image', { kicker, src, title: 'Also busy on the tables', body: art(upArt.join('')) + upHtml });
  };

  // 4 · your turn: the same puzzle with one slot in the device colour
  const turn = (x: SlideCtx) => {
    const g = groundOf(x, 'image');
    const b4 = makeBoard(p.img, { x: X0, y: 330, w: CW, maxH: 640, cols: 8, seed: 12, uid: 'potw4', center: true });
    const slot = b4.at(5, 1);
    const [sx, sy] = cellCentre(b4, slot);
    return sl(x, 'image', { kicker, src: 'Log it on myspeedpuzzling.com', body: `
      <p class="h-abs fx-huge" style="top:${FEED.contentTop + 10}px">Your turn.</p>
      ${art(boardFull(b4, { holes: [slot], holeFill: 'var(--g-device)' }))}
      <span data-qa-bg="${g.device}" style="position:absolute; left:${f1(sx)}px; top:${f1(sy)}px; transform:translate(-50%, -50%); font-size:40px; font-weight:800; color:${inkOn(g.device)}">you</span>
      ${credit(p, b4.y + b4.h + 22)}
      <p class="h-abs h-dek" style="top:${b4.y + b4.h + 82}px">The median solo time is <b style="color:var(--g-ink)">${h(p.medianSolo ?? '–')}</b>. Where does yours land?</p>` });
  };

  return post(v, {
    key: 'potw',
    label: `Puzzle of the week: ${p.puzzle} (4-slide carousel)`,
    caption: `${fmtInt(p.solversWeek)} puzzlers solved ${p.puzzle} last week, more than any other puzzle on MSP. That makes it our Puzzle of the Week.

It's a ${p.pieces} from ${p.brand}, and ${fmtInt(p.solversWeek)} of its ${fmtInt(p.solversAll)} solvers on MSP did it in the last seven days. Median solo time ${p.medianSolo}, fastest solo ${p.fastestSolo}, and ${p.firstAttemptPct}% of the solves were first attempts.

What's your time on it, and was it a first attempt?

Box art: ${p.puzzle} by ${p.brand}

#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
  }, [['cover', cover], ['numbers', numbers], ['runners-up', runners], ['your-turn', turn]]);
}

// ---------------------------------------------------------------- F2 · Guess the puzzle (F2-5…7)

const GUESS_PIECES: Array<[number, number]> = [[0, 3], [1, 2], [5, 5], [7, 4]];
function guess(c: C2, src: string, v: Variant): Post {
  const a = c.allTime[0];
  const most = c.allTime.every(o => o.solvers <= a.solvers);
  const kicker = 'Guess the puzzle';

  // 1 · four loose pieces
  const s1 = (x: SlideCtx) => artCover(x, {
    kicker: `${kicker} · clue 1 of 2`, src: 'Swipe for clue 2', title: 'Four pieces, one famous 500. Can you name the puzzle?',
    art: band => {
      const b = makeBoard(a.img, { x: X0, y: band.top, w: CW, cols: 8, seed: 8, uid: 'g1' });
      const hgt = band.bottom - band.top - 60;
      const ys = [band.top + hgt * 0.27, band.top + hgt * 0.73];
      const sc = Math.min(1.75, (hgt / 2 - 24) / ((b.h / b.jig.options.rows) * 1.6));
      const dy = Math.min(24, hgt * 0.04);
      const spots: Array<[number, number, number]> = [[290, ys[0], -13], [790, ys[0] - dy, 9], [330, ys[1], 6], [760, ys[1] + dy, -10]];
      return art(GUESS_PIECES.map(([cc, r], i) => loose(b, b.at(cc, r), spots[i][0], spots[i][1], spots[i][2], sc)).join(''))
        + mystery(a, band.bottom - 40);
    },
  });

  // 2 · edges done
  const s2 = (x: SlideCtx) => {
    const b2 = makeBoard(a.img, { x: X0, y: 330, w: CW, maxH: 640, cols: 8, seed: 8, uid: 'g2', center: true });
    return sl(x, 'quiz', { kicker: `${kicker} · clue 2 of 2`, src: 'Swipe for the answer', title: 'Edges first, obviously. Got it now?', body: `
      ${art(boardPartial(b2, edgePieces(b2)))}
      ${mystery(a, b2.y + b2.h + 22)}
      <p class="h-abs h-dek" style="top:${b2.y + b2.h + 78}px">Clue: <b style="color:var(--g-ink)">${fmtInt(a.solvers)} puzzlers</b> have solved it on MSP.</p>` });
  };

  // 3 · the answer
  const s3 = (x: SlideCtx) => {
    const b3 = makeBoard(a.img, { x: X0, y: FEED.contentTop + 8, w: CW, maxH: 600, cols: 8, seed: 8, uid: 'g3', center: true });
    return sl(x, 'quiz', { kicker: `${kicker} · the answer`, src, body: `
      ${art(boardFull(b3))}
      <h2 class="h-abs fx-name" style="top:${b3.y + b3.h + 34}px">${h(a.puzzle)}</h2>
      ${byline(a, b3.y + b3.h + 140)}
      <div class="h-abs fx-kv" style="top:${b3.y + b3.h + 204}px">
        <div><div class="v">${fmtInt(a.solvers)}</div><div class="k">solvers${most ? ', the most on MSP' : ' on MSP'}</div></div>
        <div><div class="v">${h(a.medianSolo ?? '–')}</div><div class="k">median solo time</div></div></div>` });
  };

  return post(v, {
    key: 'guess',
    label: 'Guess the puzzle: loose pieces → edges → answer (3-slide carousel)',
    caption: `Four pieces from one of the most-solved puzzles on MSP. Can you name it before the last slide?

Clue 2 is the edges, because that's how most of us start. The answer has ${fmtInt(a.solvers)} solvers on MSP behind it.

How many slides did you need? And if you've done this one, what's your time on it?

Box art: ${a.brand} (the puzzle's name is on the last slide)

#speedpuzzling #jigsawpuzzle`,
  }, [['clue-1', s1], ['clue-2', s2], ['answer', s3]]);
}

// ---------------------------------------------------------------- F2 · Which one is faster? (F2-8…10)

function faster(c: C2, src: string, v: Variant): Post {
  const fam = c.allTime.filter(o => /^Circle of Colors/.test(o.puzzle) && o.medianSolo).sort((x, y) => toSec(x.medianSolo) - toSec(y.medianSolo));
  const fast = fam[0], slow = fam[fam.length - 1];
  const series = fast.puzzle.split(':')[0];
  const short = (o: Box) => o.puzzle.replace(/^[^:]+:\s*/, '');
  const diff = toSec(slow.medianSolo) - toSec(fast.medianSolo);
  const kicker = 'Which is faster?';
  const circle = (o: Box, cx: number, cy: number, r: number, id: string) => `<clipPath id="${id}"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}"/></clipPath>
    <g class="fx-shadow"><image href="${o.img}" x="${f1(cx - r * 1.02)}" y="${f1(cy - r * 1.02)}" width="${f1(r * 2.04)}" height="${f1(r * 2.04)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/></g>`;

  // 1 · the question (slow one on the left, so position gives nothing away)
  const s1 = (x: SlideCtx) => artCover(x, {
    kicker: `${kicker} · median solo time`, src: 'Swipe for the answer', title: `Two round ${fast.pieces}s. Which one do puzzlers finish faster?`,
    art: band => {
      const LAB = 150;
      const r = Math.min(220, (band.bottom - band.top - LAB - 30) / 2);
      const cy = band.top + 10 + r;
      const pair = [slow, fast];
      return art(pair.map((o, i) => circle(o, X0 + r + i * (CW - 2 * r), cy, r, `q${i}`)).join(''))
        + pair.map((o, i) => `<div style="position:absolute; top:${f1(cy + r + 30)}px; ${i ? `right:${W - X1}px; text-align:right` : `left:${X0}px`}; width:420px">
          <p class="h-lab">${h(series)}:</p><p style="font-size:48px; font-weight:700; line-height:1.1; color:var(--g-ink)">${h(short(o))}</p><p class="h-lab">${h(o.brand)} · ${o.pieces} pieces</p></div>`).join('');
    },
  });

  // 2 · the answer
  const s2 = (x: SlideCtx) => {
    const r2 = 130, rowY = [420, 730];
    const order = [fast, slow];
    const barX = 368, barMax = X1 - barX;
    return sl(x, 'data', { kicker: `${kicker} · the answer`, src, title: `${short(fast)}, by ${Math.round(diff / 60)} minutes.`, body: `
      <p class="h-abs h-dek" style="top:262px">Median solo time on MSP, ${fast.pieces} pieces each.</p>
      ${art(order.map((o, i) => {
        const cy = rowY[i] + r2;
        const w = (toSec(o.medianSolo) / toSec(slow.medianSolo)) * barMax;
        return `${circle(o, X0 + r2, cy, r2, `a${i}`)}
          <rect x="${barX}" y="${cy + 6}" width="${barMax}" height="44" fill="var(--g-band)"/>
          <rect x="${barX}" y="${cy + 6}" width="${f1(w)}" height="44" fill="${i === 0 ? 'var(--c-hot)' : 'var(--c-base)'}"/>`;
      }).join(''))}
      ${order.map((o, i) => `<div class="fx-race" style="position:absolute; left:${barX}px; width:${barMax}px; top:${rowY[i] + r2 - 92}px"><div class="hd"><span class="nm">${h(short(o))}</span><span class="tm">${h(o.medianSolo!)}</span></div></div>
        <p class="h-lab" style="position:absolute; left:${barX}px; top:${rowY[i] + r2 + 64}px">${fmtInt(o.solvers)} solvers</p>`).join('')}
      <p class="h-abs h-credit" style="top:1030px">${h(series)}: ${h(short(fast))} and ${h(short(slow))} · ${h(fast.brand)}</p>
      <p class="h-abs h-body" style="top:1084px">The fastest and the slowest of the ${fam.length} ${h(series)} in MSP's ${c.allTime.length} most-solved puzzles.</p>` });
  };

  // 3 · every puzzle of the series in the all-time top list, fastest to slowest
  const s3 = (x: SlideCtx) => {
    const r3 = 120, colX = [X0, X0 + 317, X0 + 634], rowY3 = [400, 790];
    return sl(x, 'data', { kicker: `${kicker} · the family`, src, title: `All ${fam.length} ${series} in MSP's top ${c.allTime.length}, fastest to slowest`, titleSize: 's', body: `
      <p class="h-abs h-credit" style="top:322px">${h(series)} · ${h(fast.brand)} · ${fast.pieces} pieces each</p>
      ${art(fam.slice(0, 6).map((o, i) => circle(o, colX[i % 3] + r3, rowY3[Math.floor(i / 3)] + r3, r3, `f${i}`)).join(''))}
      ${fam.slice(0, 6).map((o, i) => `<div class="fx-fam" style="position:absolute; width:280px; left:${colX[i % 3]}px; top:${rowY3[Math.floor(i / 3)] + 2 * r3 + 20}px">
        <div class="nm"><i>${i + 1}</i>${h(short(o))}</div><div class="tm${i === 0 ? ' hot' : ''}">${h(o.medianSolo!)}</div></div>`).join('')}` });
  };

  return post(v, {
    key: 'faster',
    label: `Which is faster? ${short(slow)} vs ${short(fast)} (3-slide carousel)`,
    caption: `Two round ${fast.pieces}s from the same ${fast.brand} series, and one of them takes puzzlers ${Math.round(diff / 60)} minutes longer.

Swipe for the median solo times on MSP, then all ${fam.length} ${series} puzzles from MSP's ${c.allTime.length} most-solved, ranked from fastest to slowest.

Have you done either of them? Which one felt slower to you?

Box art: ${series} by ${fast.brand}

#speedpuzzling #jigsawpuzzle #myspeedpuzzling`,
  }, [['question', s1], ['answer', s2], ['family', s3]]);
}

// ---------------------------------------------------------------- F2 · Story quiz (F2-11, F2-12; 9:16)

const STORY_PIECES: Array<[number, number]> = [[0, 2], [7, 1], [0, 5]];
function storyQuiz(c: C2, v: Variant): Post {
  const a = c.allTime[1];
  const alts = c.allTime.filter(o => /Postcard/.test(o.puzzle) && o.puzzle !== a.puzzle).slice(0, 2);
  // The quiz sticker zone (Instagram's sticker is added in the app; the plate stays empty in the export).
  const STICKER = { y0: 1010, y1: 1400 };

  const q = (x: SlideCtx) => {
    const b = makeBoard(a.img, { x: X0, y: 600, w: CW, cols: 8, seed: 14, uid: 's1' });
    const spots: Array<[number, number, number]> = [[240, 780, -9], [540, 750, 7], [840, 785, -6]];
    return sl(x, 'story', { kind: 'story', kicker: 'Guess the puzzle · story quiz', src: '', title: 'Three pieces. Which postcard are they from?', body: `
      ${art(`<rect x="${X0}" y="${STICKER.y0}" width="${CW}" height="${STICKER.y1 - STICKER.y0}" rx="28" fill="var(--g-band)"/>
        ${STORY_PIECES.map(([cc, r], i) => loose(b, b.at(cc, r), spots[i][0], spots[i][1], spots[i][2], 1.9)).join('')}`, 1920)}
      ${mystery(a, 940)}` });
  };

  const ans = (x: SlideCtx) => {
    const b2 = makeBoard(a.img, { x: X0, y: STORY.contentTop + 10, w: CW, maxH: 540, cols: 8, seed: 14, uid: 's2', center: true });
    return sl(x, 'story', { kind: 'story', kicker: 'Guess the puzzle · the answer', src: '', body: `
      ${art(boardFull(b2), 1920)}
      <h2 class="h-abs fx-name" style="top:${b2.y + b2.h + 40}px">${h(a.puzzle)}</h2>
      ${byline(a, b2.y + b2.h + 150)}
      <div class="h-abs fx-kv" style="top:${b2.y + b2.h + 214}px">
        <div><div class="v">${fmtInt(a.solvers)}</div><div class="k">solvers on MSP</div></div>
        <div><div class="v">${h(a.medianSolo ?? '–')}</div><div class="k">median solo time</div></div></div>
      <p class="h-abs h-ask" style="top:${b2.y + b2.h + 350}px; font-size:44px">Did you get it from three pieces?</p>` });
  };

  return post(v, {
    key: 'story-quiz',
    label: `Story quiz: three pieces → ${a.puzzle} (2 Story frames, quiz sticker zone y ${STICKER.y0}–${STICKER.y1} on frame 1)`,
    caption: `Story frames, no caption or hashtags. Frame 1: add Instagram's quiz sticker in the blank zone under the pieces with the options ${a.puzzle} (correct), ${alts.map(o => o.puzzle).join(', ')}. Frame 2 reveals it.`,
  }, [['question', q], ['answer', ans]], 'story');
}

// ---------------------------------------------------------------- family

const family: Family = {
  id: 'formats',
  name: 'Creative formats (DL2 content)',
  posts: (c, v) => {
    const d = c.dl2;
    return [sepWall(d, d.source, v), sepMosaic(d, d.source, v), weekWall(d, d.source, v), event(v), potw(d, d.source, v), guess(d, d.source, v), faster(d, d.source, v), storyQuiz(d, v)];
  },
};
export default family;
