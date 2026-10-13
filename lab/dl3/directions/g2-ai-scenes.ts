// G2 · AI scenes, composited back with code.
// The AI paints only the stage: an empty gallery wall (A3), a night ocean (D3), a moonlit shelf (G1) and
// house-style spot animals (H1). Code renders everything that carries meaning on top: every word and number
// (always on a code-drawn solid panel), the frames, plaques and their light, the real credited box images,
// the route and every puzzle piece (generator pieces only).
//
// Plates come from the AI1 batch (content/labs/AI1/<E#>/<job>.png + JSON sidecar). Each slide asks for one
// plate in PLATES; if that file isn't there yet, it takes the best available plate of the same kind by its
// check score (the sidecar's own checks, else lab/ai1/checks.ts run here on the CPU, cached), else a neutral
// code-drawn placeholder clearly labelled "AI plate pending". The slide's source line names the model and
// licence of the plate it used. Spot animals are cut out of their white ground here (flood fill from the
// border + a soft matte on the outline), cached in content/cache/g2/.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { geoDistance } from 'd3';
import { escapeHtml as h, fmtInt } from '../../../src/design/page.ts';
import { LOGO_URL, singlePiece } from '../../../src/design/svg.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import { ROOT } from '../../../src/render/server.ts';
import { query } from '../../../src/data/db.ts';
import { fetchBoxes } from '../../../src/data/boxes.ts';
import { EXPERIMENTS } from '../../ai1/batch.ts';
import { runChecks, type CheckResult } from '../../ai1/checks.ts';
import type { Content } from '../content.ts';
import type { Direction, Post, Slide } from '../../dl1/types.ts';

const W = 1080, H = 1350, X0 = 88, X1 = 992, CW = X1 - X0;
const f1 = (v: number) => v.toFixed(1);
const AI_DIR = join(ROOT, 'content/labs/AI1');
const CACHE = join(ROOT, 'content/cache/g2');
const INK = '#2b3445', CORAL = '#ec726f';

// ---------------------------------------------------------------- plate mapping

/** Which AI1 output each slide wants. Missing → best of the same kind by check score → code placeholder. */
export const PLATES: Record<string, string> = {
  'museum-1': 'E1/museum-wall-s101.png',
  'museum-2': 'E1/museum-wall-s102.png',
  'museum-3': 'E1/museum-wall-s103.png',
  'museum-4': 'E1/museum-wall-s104.png',
  'museum-5': 'E1/museum-wall-s105.png',
  'museum-6': 'E1/museum-wall-s101.png',
  'ocean-1': 'E1/night-ocean-s105.png',
  'ocean-3': 'E1/night-ocean-s102.png',
  'shelf-1': 'E4/shelf-moonlight-s401.png',
  'shelf-3': 'E4/shelf-candle-s401.png',
  owl: 'E3/9b-owl-s301.png', lark: 'E3/9b-lark-s301.png', hare: 'E3/9b-hare-s301.png', tortoise: 'E3/9b-tortoise-s301.png',
  magpie: 'E3/9b-magpie-s301.png', parrot: 'E3/9b-parrot-s301.png', bat: 'E3/9b-bat-s301.png', swallow: 'E3/9b-swallow-s301.png',
};

const MODEL: Record<string, string> = { zimage: 'Z-Image Turbo', klein4b: 'FLUX.2 klein 4B', klein9b: 'FLUX.2 klein 9B', qwen: 'Qwen-Image-Edit-2511' };
const shortLicence = (l: string) => l.replace('FLUX Non-Commercial License', 'FLUX Non-Commercial');

interface Plate {
  key: string;
  want: string;
  status: 'chosen' | 'best' | 'pending';
  exp: string;
  /** What kind of plate this is, for the placeholder label ("E1 museum wall"). */
  kindLabel: string;
  url?: string;
  file?: string;
  job?: string;
  model?: string;
  licence?: string;
  score?: number;
  w: number;
  h: number;
  /** Museum plates: wall/floor line as a fraction of the height, and the wall colour around the hang. */
  floor?: number;
  wallTop?: string;
  wallBottom?: string;
  /** Spot animals: the cut-out PNG (transparent ground). */
  cut?: string;
}

interface Side { status?: string; family?: string; licence?: string; prompt_id?: string; checks?: CheckResult; checks_png_mtime?: number }
const readSide = (f: string): Side | null => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };

mkdirSync(join(CACHE, 'cut'), { recursive: true });
const CHECKS_FILE = join(CACHE, 'checks.json');
const checkCache: Record<string, CheckResult> = existsSync(CHECKS_FILE) ? JSON.parse(readFileSync(CHECKS_FILE, 'utf8')) : {};
let checkCacheDirty = false;

function kindOf(want: string) {
  const [exp, base] = want.replace(/\.png$/, '').split('/');
  const stem = base.replace(/-s\d+$/, '');
  if (exp === 'E3') {
    const animal = stem.replace(/^(9b|4b)-/, '');
    return { exp, re: new RegExp(`^(?:9b|4b)-${animal}-s\\d+$`), label: `E3 ${animal}` };
  }
  if (exp === 'E4') {
    const scaffold = stem.split('-')[0];
    return { exp, re: new RegExp(`^${scaffold}-[a-z]+-s\\d+$`), label: `E4 ${scaffold} scene` };
  }
  return { exp, re: new RegExp(`^${stem}-s\\d+$`), label: `${exp} ${stem.replace(/-/g, ' ')}` };
}

const SCAFFOLD_SLOTS = (name: string) => {
  const f = join(AI_DIR, 'scaffolds', `${name}.json`);
  return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')).slots as Array<{ id: string; kind: string; gen: { x: number; y: number; w: number; h: number } }>) : undefined;
};

/** Check result for one candidate: the sidecar's own when current, else computed here (CPU) and cached. */
async function checksOf(exp: string, job: string, file: string, side: Side): Promise<CheckResult | null> {
  const mtime = statSync(file).mtimeMs;
  if (side.checks && side.checks_png_mtime === mtime) return side.checks;
  const key = `${exp}/${job}@${mtime}`;
  if (checkCache[key]) return checkCache[key];
  let res: CheckResult | null = null;
  try {
    if (exp === 'E1') {
      const zone = EXPERIMENTS.find(e => e.id === 'E1')!.prompts.find(p => p.id === side.prompt_id)?.zone;
      res = await runChecks({ checks: ['zone', 'palette'], zone }, file);
    } else if (exp === 'E3') res = await runChecks({ checks: ['spot'], zone: undefined }, file);
    else if (exp === 'E4') res = await runChecks({ checks: ['slots', 'palette'], zone: undefined }, file, SCAFFOLD_SLOTS(job.startsWith('room') ? 'room' : 'shelf'));
  } catch { res = null; }
  if (res) { checkCache[key] = res; checkCacheDirty = true; }
  return res;
}

/** Higher is better. Passing all auto-checks dominates; then the experiment's own continuous metrics. */
function scoreOf(exp: string, job: string, c: CheckResult | null): number {
  if (!c) return -1e6;
  const m = c.metrics as Record<string, number>;
  let s = c.pass ? 100 : 0;
  if (exp === 'E1') s -= (m.zone_sigma ?? 30) + 0.5 * (m.palette_de2000_snapped ?? 20);
  if (exp === 'E3') s -= Math.abs((m.coralPct ?? 0) - 35) + 10 * Math.abs((m.lineWeightPct ?? 0) - 2.9) + ((m.borderBgPct ?? 0) >= 98 ? 0 : 50) - (job.startsWith('9b') ? 5 : 0);
  if (exp === 'E4') s += 100 * (m.slot_min_iou ?? 0) - (m.slot_max_offset_px ?? 12) - 0.5 * (m.palette_de2000_snapped ?? 20);
  return s;
}

async function resolvePlate(key: string, avoid: Set<string>): Promise<Plate> {
  const want = PLATES[key];
  const k = kindOf(want);
  const dir = join(AI_DIR, k.exp);
  const base: Plate = { key, want, status: 'pending', exp: k.exp, kindLabel: k.label, w: 1088, h: 1360 };
  const ok = (job: string) => {
    const png = join(dir, `${job}.png`), side = readSide(join(dir, `${job}.json`));
    return existsSync(png) && side?.status === 'ok' ? { png, side } : null;
  };
  let pick: { job: string; png: string; side: Side; score?: number; status: Plate['status'] } | null = null;
  const wantedJob = want.split('/')[1].replace(/\.png$/, '');
  const w0 = ok(wantedJob);
  if (w0) pick = { job: wantedJob, ...w0, status: 'chosen' };
  else if (existsSync(dir)) {
    const cands: Array<{ job: string; png: string; side: Side; score: number }> = [];
    for (const f of readdirSync(dir)) {
      const job = f.replace(/\.png$/, '');
      if (!f.endsWith('.png') || !k.re.test(job)) continue;
      const c = ok(job);
      if (!c) continue;
      cands.push({ job, ...c, score: scoreOf(k.exp, job, await checksOf(k.exp, job, c.png, c.side)) });
    }
    cands.sort((a, b) => b.score - a.score);
    const best = cands.find(c => !avoid.has(`${k.exp}/${c.job}`)) ?? cands[0];
    if (best) pick = { ...best, status: 'best' };
  }
  if (!pick) return base;
  avoid.add(`${k.exp}/${pick.job}`);
  const meta = await sharp(pick.png).metadata();
  return {
    ...base, status: pick.status, file: pick.png, url: '/' + pick.png.slice(ROOT.length + 1), job: pick.job, score: pick.score,
    model: MODEL[pick.side.family ?? ''] ?? pick.side.family, licence: shortLicence(pick.side.licence ?? 'licence unknown'),
    w: meta.width ?? 1088, h: meta.height ?? 1360,
  };
}

/** "Backdrop: AI (Z-Image Turbo, Apache-2.0)" or the pending note. */
const aiCredit = (p: Plate, what = 'Backdrop') => p.status === 'pending' ? `${what}: AI plate pending` : `${what}: AI (${p.model}, ${p.licence})`;

// ---------------------------------------------------------------- plate analysis (museum light, cutouts)

async function regionRgb(file: string, fx0: number, fy0: number, fx1: number, fy1: number): Promise<[number, number, number]> {
  const m = await sharp(file).metadata();
  const left = Math.round(fx0 * m.width!), top = Math.round(fy0 * m.height!);
  const { data } = await sharp(file).removeAlpha().extract({ left, top, width: Math.round((fx1 - fx0) * m.width!), height: Math.round((fy1 - fy0) * m.height!) })
    .resize(1, 1, { fit: 'fill', kernel: 'cubic' }).raw().toBuffer({ resolveWithObject: true });
  return [data[0], data[1], data[2]];
}
const hex = (c: number[]) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const rgbOf = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));

/** Wall → floor line: the strongest rise in colourfulness (plaster is grey, oak is not) in the lower half. */
async function floorLine(file: string): Promise<number> {
  const gw = 68, gh = 85;
  const { data } = await sharp(file).removeAlpha().resize(gw, gh, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const rows: number[] = [];
  for (let y = 0; y < gh; y++) {
    let s = 0;
    for (let x = 8; x < gw - 8; x++) { const p = (y * gw + x) * 3; s += Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]); }
    rows.push(s / (gw - 16));
  }
  let best = 0.75, bd = -1;
  for (let y = Math.round(gh * 0.5); y < gh - 3; y++) { const d = rows[y + 2] - rows[y - 1]; if (d > bd) { bd = d; best = (y + 0.5) / gh; } }
  return best;
}

/**
 * Cut a spot illustration out of its white ground: flood fill from the border through near-white pixels
 * (interior whites such as a magpie's chest stay opaque), then a soft matte on a 2 px band along the edge,
 * un-mixing the white so the navy outline stays clean on any ground. Trimmed to the subject + 3 % padding.
 */
export async function cutout(src: string, out: string) {
  if (existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs) return;
  const { data, info } = await sharp(src).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, hh = info.height, n = w * hh;
  const white = (i: number) => { const p = i * 3, r = data[p], g = data[p + 1], b = data[p + 2]; const mn = Math.min(r, g, b); return mn >= 226 && Math.max(r, g, b) - mn <= 20; };
  const bg = new Uint8Array(n), q = new Int32Array(n);
  let head = 0, tail = 0;
  const push = (i: number) => { if (!bg[i] && white(i)) { bg[i] = 1; q[tail++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((hh - 1) * w + x); }
  for (let y = 0; y < hh; y++) { push(y * w); push(y * w + w - 1); }
  while (head < tail) {
    const i = q[head++], x = i % w, y = (i / w) | 0;
    if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < hh - 1) push(i + w);
  }
  // Distance (0, 1, 2, >2) of each subject pixel from the background, for the matte band.
  const near = new Uint8Array(n).fill(9);
  for (let i = 0; i < n; i++) if (bg[i]) near[i] = 0;
  for (let pass = 1; pass <= 2; pass++) {
    for (let i = 0; i < n; i++) {
      if (near[i] <= pass) continue;
      const x = i % w, y = (i / w) | 0;
      if ((x > 0 && near[i - 1] === pass - 1) || (x < w - 1 && near[i + 1] === pass - 1) || (y > 0 && near[i - w] === pass - 1) || (y < hh - 1 && near[i + w] === pass - 1)) near[i] = pass;
    }
  }
  const rgba = Buffer.alloc(n * 4);
  let x0 = w, y0 = hh, x1 = 0, y1 = 0;
  for (let i = 0; i < n; i++) {
    const p = i * 3, o = i * 4;
    let a = 1;
    if (bg[i]) a = 0;
    else if (near[i] <= 2) a = Math.max(0, Math.min(1, (255 - Math.min(data[p], data[p + 1], data[p + 2])) / 135));
    for (let c = 0; c < 3; c++) rgba[o + c] = a > 0 && a < 1 ? Math.max(0, Math.min(255, Math.round(255 - (255 - data[p + c]) / a))) : data[p + c];
    rgba[o + 3] = Math.round(a * 255);
    if (a > 0.05) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const pad = Math.round(0.03 * w);
  const left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad);
  await sharp(rgba, { raw: { width: w, height: hh, channels: 4 } })
    .extract({ left, top, width: Math.min(w, x1 + pad + 1) - left, height: Math.min(hh, y1 + pad + 1) - top })
    .png({ compressionLevel: 9 }).toFile(out);
}

// ---------------------------------------------------------------- data

const rows = (name: string) => query(name).rows;
const BOX_ROWS = ['boxes-alltime-top', 'boxes-month-top', 'boxes-week-top'].flatMap(rows).filter(r => r.image);
const imageOf = (puzzle: string, brand: string) => BOX_ROWS.find(r => r.puzzle === puzzle && r.brand === brand)?.image;

interface Box { puzzle: string; brand: string; pieces: number; image: string; url: string; aspect: number; credit: string }

// A3 museum rooms: the most-solved puzzle per subject (bs-theme-champions, rank 1).
const champs = rows('bs-theme-champions').filter(r => r.rk === '1');
const ROOM_THEMES: Array<[string, string]> = [['lighthouses', 'Lighthouses'], ['books', 'Books'], ['mushrooms', 'Mushrooms'], ['owls', 'Owls'], ['space', 'Space']];
const NEXT_THEMES: Array<[string, string]> = [['cats', 'Cats'], ['flowers', 'Flowers'], ['ocean', 'The ocean']];
// G1: shelf queens with the highest unsolved share.
const queens = rows('bs-shelf-queens').map(r => ({ puzzle: r.puzzle, brand: r.brand, pieces: r.pieces, owners: r.owners, unsolved: r.unsolved, pct: Number(r.pct_unsolved) })).sort((a, b) => b.pct - a.pct);
// D3: the milestone pace and the two postcards.
const pace = rows('bs-milestone-pace')[0];

const wantImages = [
  ...ROOM_THEMES.map(([t]) => champs.find(r => r.theme === t)!).map(r => imageOf(r.puzzle, r.brand)),
  ...queens.map(r => imageOf(r.puzzle, r.brand)),
  imageOf('London Postcard', 'Ravensburger'), imageOf('New York Postcard', 'Ravensburger'),
].filter((x): x is string => !!x);

// ---------------------------------------------------------------- prepare (top-level, cached)

const BOX_URLS = await fetchBoxes(wantImages, 'puzzle_large');
const ASPECT = new Map<string, number>();
for (const [img, url] of BOX_URLS) {
  const m = await sharp(join(ROOT, url)).metadata();
  ASPECT.set(img, (m.width ?? 4) / (m.height ?? 3));
}
function box(puzzle: string, brand: string, pieces: number | string): Box | null {
  const image = imageOf(puzzle, brand);
  if (!image || !BOX_URLS.has(image)) return null;
  return { puzzle, brand, pieces: Number(pieces), image, url: BOX_URLS.get(image)!, aspect: ASPECT.get(image)!, credit: `${puzzle} · ${brand}` };
}

const avoidMuseum = new Set<string>(), avoidOcean = new Set<string>(), avoidShelf = new Set<string>(), avoidAnimals = new Set<string>();
const P: Record<string, Plate> = {};
for (const k of ['museum-1', 'museum-2', 'museum-3', 'museum-4', 'museum-5']) P[k] = await resolvePlate(k, avoidMuseum);
P['museum-6'] = await resolvePlate('museum-6', new Set());
for (const k of ['ocean-1', 'ocean-3']) P[k] = await resolvePlate(k, avoidOcean);
for (const k of ['shelf-1', 'shelf-3']) P[k] = await resolvePlate(k, avoidShelf);
const ANIMAL_IDS = ['owl', 'lark', 'hare', 'tortoise', 'magpie', 'parrot', 'bat', 'swallow'] as const;
for (const k of ANIMAL_IDS) P[k] = await resolvePlate(k, avoidAnimals);

for (const p of Object.values(P)) {
  if (!p.file) continue;
  if (p.exp === 'E1' && p.want.includes('museum-wall')) {
    p.floor = await floorLine(p.file);
    p.wallTop = hex(await regionRgb(p.file, 0.1, 0.3, 0.6, 0.4));
    p.wallBottom = hex(await regionRgb(p.file, 0.1, Math.max(0.42, p.floor - 0.14), 0.6, p.floor - 0.04));
  }
  if (p.exp === 'E3') {
    const out = join(CACHE, 'cut', `${p.exp}-${p.job}.png`);
    await cutout(p.file, out);
    p.cut = '/' + out.slice(ROOT.length + 1);
  }
}
if (checkCacheDirty) writeFileSync(CHECKS_FILE, JSON.stringify(checkCache, null, 1) + '\n');
console.log('G2 plates: ' + Object.values(P).map(p => `${p.key}=${p.status === 'pending' ? 'PENDING' : `${p.exp}/${p.job}${p.status === 'best' ? '*' : ''}`}`).join(' '));

// ---------------------------------------------------------------- shared pieces

const css = `
body { background: #e9e4dc; }
.slide { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #e9e4dc; color: var(--ink); }
.abs { position: absolute; }
.plate { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; display: block; object-fit: cover; }
.kick { font-size: 30px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; line-height: 1.2; }
.src { font-size: 24px; line-height: 1.3; color: var(--ink-soft); }
.logo { width: 64px; height: 57px; flex: none; }
.logo-w { flex: none; background: #fff; border-radius: 12px; padding: 7px 8px; width: 80px; height: 71px; }
.pending { position: absolute; display: flex; align-items: center; gap: 14px; padding: 10px 22px; border: 3px dashed #626c80; border-radius: 40px; background: #ffffff; font-size: 24px; font-weight: 700; color: #4b566b; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
/* A3 museum */
.sign { position: absolute; left: ${X0}px; background: ${INK}; color: #fff; padding: 26px 34px 30px; }
.sign .kick { color: var(--sky-200); }
.sign .t { font-size: 64px; font-weight: 700; line-height: 1.04; letter-spacing: -1.5px; margin-top: 10px; }
.sign .t i { font-style: normal; font-weight: 300; }
.sign .d { font-size: 32px; line-height: 1.3; color: #d6dbe6; margin-top: 14px; max-width: 760px; text-wrap: pretty; }
.sign .d b { color: #fff; }
.frm { position: absolute; background: #23201d; }
.frm .mat { position: absolute; box-shadow: inset 0 7px 9px -5px rgba(30,24,18,.45); }
.frm .art { position: absolute; display: block; object-fit: cover; outline: 3px solid rgba(255,255,255,.75); }
.plq { position: absolute; padding: 22px 24px 22px; }
.plq .t { font-size: 32px; font-weight: 700; line-height: 1.12; text-wrap: balance; }
.plq .s { font-size: 24px; line-height: 1.35; color: var(--ink-soft); margin-top: 8px; }
.plq .s i { font-style: italic; }
.plq hr { border: 0; border-top: 2px solid ${INK}; margin: 16px 0 14px; width: 48px; }
.plq .n { font-size: 30px; line-height: 1.25; }
.plq .n b { font-weight: 700; }
.band { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 28px; padding: 26px ${W - X1}px 0 ${X0}px; }
/* D3 ocean */
.sea { position: absolute; left: 0; right: 0; bottom: 0; background: #141b2b; color: #fff; padding: 0 ${W - X1}px 0 ${X0}px; }
.sea .kick { color: var(--sky-200); }
.sea .hl { font-size: 54px; font-weight: 300; line-height: 1.08; letter-spacing: -1px; text-wrap: balance; }
.sea .hl b { font-weight: 700; }
.sea .big { font-size: 104px; font-weight: 700; line-height: 1; letter-spacing: -3px; color: var(--coral-400); white-space: nowrap; }
.sea .u { font-size: 32px; line-height: 1.25; color: #d6dbe6; }
.sea .u b { color: #fff; }
.sea .src { color: #c9d0dc; }
.tag { position: absolute; background: #141b2b; color: #fff; padding: 8px 16px; font-size: 24px; line-height: 1.25; border-radius: 6px; white-space: nowrap; }
.tag b { font-weight: 700; }
.pc { position: absolute; background: #fbf7f3; padding: 10px; box-shadow: 0 16px 28px -10px rgba(0,0,0,.6); }
.pc img { display: block; width: 100%; height: 100%; object-fit: cover; }
/* G1 shelf */
.fear { position: absolute; left: 0; right: 0; background: #161a24; color: #fff; padding: 0 ${W - X1}px 0 ${X0}px; }
.fear .kick { color: var(--coral-300); }
.fear .t { font-size: 76px; font-weight: 700; line-height: 1; letter-spacing: -2px; }
.fear .d { font-size: 32px; line-height: 1.28; color: #d6dbe6; text-wrap: pretty; }
.fear .d b { color: #fff; }
.fear .src { color: #c9d0dc; }
.sbox { position: absolute; display: block; object-fit: cover; box-shadow: 0 8px 12px -4px rgba(0,0,0,.7); outline: 2px solid rgba(0,0,0,.55); }
.slbl { position: absolute; display: flex; align-items: center; justify-content: center; background: #efe6d6; color: ${INK}; font-size: 24px; font-weight: 600; white-space: nowrap; overflow: hidden; }
.ghost { position: absolute; }
.ghost span { position: absolute; left: 0; right: 0; text-align: center; font-weight: 800; letter-spacing: -1px; color: ${INK}; }
/* H1 animals */
.card { position: absolute; background: #fff; border: 3px solid ${INK}; border-radius: 28px; overflow: hidden; }
.card img { position: absolute; display: block; object-fit: contain; }
.an .nm { font-size: 34px; font-weight: 700; line-height: 1.1; }
.an .hn { font-size: 24px; line-height: 1.3; color: var(--ink-soft); margin-top: 6px; }
.badge { position: relative; width: 104px; height: 104px; flex: none; }
.badge svg { position: absolute; left: 0; top: 0; }
.badge span { position: absolute; transform: translate(-50%, -50%); font-size: 40px; font-weight: 800; line-height: 1; color: ${INK}; }
.who { font-size: 80px; font-weight: 700; line-height: 1; letter-spacing: -2px; }
.trait { font-size: 36px; line-height: 1.25; color: var(--ink-soft); }
.statv { font-size: 104px; font-weight: 700; line-height: 1; letter-spacing: -3px; white-space: nowrap; }
.statk { font-size: 32px; line-height: 1.28; color: var(--ink); text-wrap: pretty; }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1206px; height: 80px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
`;

const slide = (inner: string, bg = '#e9e4dc') => `<div class="slide" style="background:${bg}">${inner}</div>`;
const plateImg = (p: Plate) => p.url ? `<img class="plate" src="${p.url}" alt="">` : '';
/** The "AI plate pending" pill, on its own solid ground. */
const pendingPill = (p: Plate, x?: number, y?: number) => p.status === 'pending'
  ? `<div class="pending" data-qa-bg="#ffffff" data-qa-small style="${x === undefined ? 'position:static' : `left:${x}px; top:${y}px`}"><svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="none" stroke="#626c80" stroke-width="3"/><path d="M14 8 V14 L18 17" stroke="#626c80" stroke-width="3" fill="none" stroke-linecap="round"/></svg>AI plate pending · ${h(p.kindLabel)}</div>` : '';

const badgePiece = (() => {
  const size = 60, sp = singlePiece(size, 23), B = 104;
  const [vx, vy, vw, vh] = sp.viewBox.split(' ').map(Number);
  const k = B / Math.max(vw, vh), ox = (B - vw * k) / 2, oy = (B - vh * k) / 2;
  return { d: sp.d, viewBox: sp.viewBox, cx: ox + (1.5 * size - vx) * k, cy: oy + (1.5 * size - vy) * k };
})();
const badge = (glyph: string) => `<div class="badge"><svg width="104" height="104" viewBox="${badgePiece.viewBox}"><path d="${badgePiece.d}" fill="${CORAL}" stroke="${INK}" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>
  <span data-qa-bg="${CORAL}" style="left:${f1(badgePiece.cx)}px; top:${f1(badgePiece.cy)}px">${h(glyph)}</span></div>`;

// ---------------------------------------------------------------- 1 · A3 Museum of Most-Solved

const WALL_PENDING = { top: '#e4ded5', bottom: '#d8d1c6', floor: 0.745 };

/** Code placeholder: plaster wall and an oak-coloured floor band, flat. */
const museumPending = (p: Plate) => p.status === 'pending'
  ? `<svg class="abs" style="left:0; top:0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${WALL_PENDING.top}"/><rect y="${WALL_PENDING.floor * H}" width="${W}" height="${H}" fill="#c4ad8c"/></svg>` : '';

interface Hang { x: number; y: number; w: number; h: number; art: { w: number; h: number } }

/** Frame + plaque on the wall: hung so the frame's bottom sits well above the floor, plaque to its right. */
function hang(aspect: number, floorY: number): { frame: Hang; plaque: { x: number; w: number } } {
  const FR = 12, MAT = 46, PW = 318, GAP = 40;
  const maxOuter = CW - PW - GAP;
  let aw = maxOuter - 2 * (FR + MAT), ah = aw / aspect;
  if (ah > 372) { ah = 372; aw = ah * aspect; }
  const ow = aw + 2 * (FR + MAT), oh = ah + 2 * (FR + MAT);
  const group = ow + GAP + PW;
  const x = Math.round((W - group) / 2);
  const bottom = floorY - 0.115 * H;
  return { frame: { x, y: Math.round(bottom - oh), w: ow, h: oh, art: { w: aw, h: ah } }, plaque: { x: x + ow + GAP, w: PW } };
}

function frameHtml(f: Hang, img: string | null, matTop: number[], matBottom: number[]) {
  const FR = 12, MAT = 46;
  const mt = hex(mix(matTop, [255, 255, 255], 0.62)), mb = hex(mix(matBottom, [255, 255, 255], 0.55));
  // Light from the skylight above: the shadow falls below the frame.
  return `<div class="frm" style="left:${f.x}px; top:${f.y}px; width:${f1(f.w)}px; height:${f1(f.h)}px; box-shadow: 0 30px 34px -16px rgba(46,36,26,.5)">
    <div class="mat" style="left:${FR}px; top:${FR}px; right:${FR}px; bottom:${FR}px; background:linear-gradient(${mt}, ${mb})"></div>
    ${img ? `<img class="art" src="${img}" alt="" style="left:${FR + MAT}px; top:${FR + MAT}px; width:${f1(f.art.w)}px; height:${f1(f.art.h)}px">`
    : `<div class="art" data-qa-bg="${hex(mix(matBottom, [255, 255, 255], 0.4))}" style="left:${FR + MAT}px; top:${FR + MAT}px; width:${f1(f.art.w)}px; height:${f1(f.art.h)}px; background:${hex(mix(matBottom, [255, 255, 255], 0.4))}; outline:3px dashed #8a8f9a; outline-offset:-14px; display:grid; place-items:center">
        <p style="font-size:120px; font-weight:300; line-height:1; color:#4b566b">?</p></div>`}
  </div>`;
}

function museumSlide(c: Content, p: Plate, room: number, sign: string, plaque: string, b: Box | null, footExtra: string, aspect = 1.36) {
  const floorY = (p.floor ?? WALL_PENDING.floor) * H;
  const top = rgbOf(p.wallTop ?? WALL_PENDING.top), bottom = rgbOf(p.wallBottom ?? WALL_PENDING.bottom);
  const g = hang(b?.aspect ?? aspect, floorY);
  const plaqueBg = hex(mix(bottom, [255, 255, 255], 0.72));
  const footBg = '#fbf7f3';
  return slide(`
    ${plateImg(p)}${museumPending(p)}
    <div class="sign" data-qa-bg="${INK}" style="top:${room === 1 ? 118 : 150}px">${sign}</div>
    ${frameHtml(g.frame, b?.url ?? null, top, bottom)}
    <div class="plq" data-qa-bg="${plaqueBg}" style="left:${g.plaque.x}px; width:${g.plaque.w}px; bottom:${f1(H - g.frame.y - g.frame.h)}px; background:${plaqueBg}; box-shadow: 0 10px 12px -6px rgba(46,36,26,.45)">${plaque}</div>
    ${pendingPill(p, X0, Math.round(floorY) + 30)}
    <div class="band" data-qa-bg="${footBg}" style="height:${H - 1184}px; background:${footBg}">
      <p class="src" data-qa-small style="max-width:780px">${h(c.source)} · ${footExtra}${h(aiCredit(p))}</p>
      <img class="logo" src="${LOGO_URL}" alt=""></div>`);
}

function museum(c: Content): Post {
  const rooms = ROOM_THEMES.map(([theme, title], i) => {
    const r = champs.find(x => x.theme === theme)!;
    return { n: i + 1, theme, title, r, b: box(r.puzzle, r.brand, r.pieces) };
  });
  const plaqueOf = (r: Record<string, string>) => `
    <p class="t">${h(r.puzzle)}</p>
    <p class="s" data-qa-small>${h(r.brand)}<br><i>Jigsaw puzzle, ${fmtInt(Number(r.pieces))}&nbsp;pieces</i></p>
    <hr>
    <p class="n">Solved by <b>${fmtInt(Number(r.solvers))}</b> puzzlers</p>
    <p class="s" data-qa-small>Median solo time <b style="white-space:nowrap">${Math.round(Number(r.median_solo_min))} min</b></p>`;
  const slides: Slide[] = rooms.map((rm, i) => {
    const sign = `<p class="kick">Museum of Most-Solved</p>
      <p class="t">Room ${rm.n} <i>·</i> ${h(rm.title)}</p>
      ${i === 0 ? `<p class="d"><b>${fmtInt(Number(rm.r.solvers))}</b> of you have built the most-solved lighthouse on MySpeedPuzzling.</p>` : ''}`;
    return { id: `room-${rm.n}`, body: museumSlide(c, P[`museum-${rm.n}`], rm.n, sign, plaqueOf(rm.r), rm.b, `Box art: ${h(rm.r.brand)} · `) };
  });
  // Closing room: an empty frame and the vote.
  const next = NEXT_THEMES.map(([t, name]) => ({ name, r: champs.find(x => x.theme === t)! }));
  const sign = `<p class="kick">Museum of Most-Solved</p><p class="t">Room 6 <i>·</i> your pick</p>
    <p class="d">Which subject gets the next room?</p>`;
  const plaque = `<p class="t">Coming soon</p>
    ${next.map(n => `<p class="n" style="margin-top:12px"><b>${h(n.name)}</b></p><p class="s" data-qa-small style="margin-top:2px">${h(n.r.puzzle)}, ${fmtInt(Number(n.r.solvers))} solvers</p>`).join('')}`;
  slides.push({ id: 'room-6', body: museumSlide(c, P['museum-6'], 6, sign, plaque, null, '', 1.36) });
  const r1 = rooms[0].r;
  const brands = [...new Set(rooms.map(r => r.r.brand))];
  return {
    key: 'museum',
    label: 'A3 Museum of Most-Solved (AI gallery wall + framed boxes)',
    caption: `Room 1 of the Museum of Most-Solved: lighthouses. ${r1.puzzle} by ${r1.brand} has been solved by ${fmtInt(Number(r1.solvers))} puzzlers on MySpeedPuzzling, with a median solo time of ${Math.round(Number(r1.median_solo_min))} minutes.

Swipe through four more rooms: ${rooms.slice(1).map(r => r.title.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' and $1')}. Each one holds the most-solved puzzle of its subject.

Which room should we open next: ${next.map(n => n.name.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' or $1')}?

Box art: ${brands.join(', ')}.
#speedpuzzling #jigsawpuzzle #ravensburger`,
    slides,
  };
}

// ---------------------------------------------------------------- 2 · G1 Shelf of fear

const GS = W / 1024; // E4 generation pixels → design px
const shelfSlots = (SCAFFOLD_SLOTS('shelf') ?? []).filter(s => s.kind === 'box').map(s => ({ id: s.id, x: s.gen.x * GS, y: s.gen.y * GS, w: s.gen.w * GS, h: s.gen.h * GS }));

/** Code placeholder in the scaffold's own geometry (45 px master grid = 33.75 design px). */
function shelfPending(p: Plate) {
  if (p.status !== 'pending') return '';
  const u = 33.75, r = (x: number, y: number, w: number, hh: number, fill: string) => `<rect x="${x * u}" y="${y * u}" width="${w * u}" height="${hh * u}" fill="${fill}"/>`;
  return `<svg class="abs" style="left:0; top:0" width="${W}" height="${H}">${r(0, 0, 32, 40, '#232838')}${r(0, 38, 32, 2, '#1b1f2b')}${r(4, 9, 24, 29, '#4a4f5c')}
    ${[10, 19, 28].map(y => r(5, y, 22, 8, '#30343f')).join('')}</svg>`;
}

/** A small ghost tag with the unsolved share (≥ 38 px bold, so navy on coral counts as large text). */
function ghost(x: number, y: number, pct: number, hero: boolean) {
  const gw = hero ? 132 : 112, gh = gw * 1.06, fill = hero ? CORAL : '#f4f2fb';
  const d = `M 6 ${gh * 0.45} A ${gw / 2 - 6} ${gw / 2 - 6} 0 0 1 ${gw - 6} ${gh * 0.45} L ${gw - 6} ${gh - 6} L ${gw * 0.8} ${gh - 18} L ${gw * 0.6} ${gh - 6} L ${gw * 0.4} ${gh - 18} L ${gw * 0.2} ${gh - 6} L 6 ${gh - 18} Z`;
  return `<div class="ghost" style="left:${f1(x)}px; top:${f1(y)}px; width:${gw}px; height:${f1(gh)}px; transform:rotate(${hero ? -6 : 5}deg)">
    <svg width="${gw}" height="${f1(gh)}"><path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="${gw * 0.37}" cy="${gh * 0.3}" rx="5" ry="7" fill="${INK}"/><ellipse cx="${gw * 0.63}" cy="${gh * 0.3}" rx="5" ry="7" fill="${INK}"/></svg>
    <span data-qa-bg="${fill}" style="top:${f1(gh * 0.42)}px; font-size:${hero ? 40 : 38}px">${pct}%</span></div>`;
}

function shelf(c: Content): Post {
  const six = queens.slice(0, 6).map(q => ({ q, b: box(q.puzzle, q.brand, q.pieces) }));
  const hero = six[0].q;
  const brands = [...new Set(six.map(s => s.q.brand))];
  const p1 = P['shelf-1'];
  // Boxes stand on the board inside each slot: contained, bottom-aligned, never cropped.
  const placed = shelfSlots.map((s, i) => {
    const it = six[i];
    const a = it.b?.aspect ?? 1.4;
    let bh = s.h - 10, bw = bh * a;
    if (bw > s.w - 12) { bw = s.w - 12; bh = bw / a; }
    return { s, it, x: s.x + (s.w - bw) / 2, y: s.y + s.h - bh, w: bw, h: bh };
  });
  const titleH = 296;
  /** Top panel (in the scaffold's reserved type zone) and a slim bottom band over the plinth for the source. */
  const top = (kicker: string, title: string, dek: string, p: Plate, size = 76) => `
    <div class="fear" data-qa-bg="#161a24" style="top:0; height:${titleH}px; padding-top:62px">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; height:44px"><p class="kick">${kicker}</p>${pendingPill(p)}</div>
      <p class="t" style="margin-top:12px; font-size:${size}px">${title}</p>
      <p class="d" style="margin-top:14px">${dek}</p>
    </div>`;
  const bottomBand = (text: string) => `<div class="fear" data-qa-bg="#161a24" style="top:1248px; bottom:0; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; padding-top:4px">
      <p class="src" data-qa-small style="white-space:nowrap">${text}</p><img class="logo" src="${LOGO_URL}" alt="" style="background:#fff; border-radius:10px; padding:5px; width:56px; height:50px; margin-top:-4px"></div>`;
  const cover: Slide = { id: 'shelf-1', body: slide(`
    ${plateImg(p1)}${shelfPending(p1)}
    ${placed.map(b => b.it.b ? `<img class="sbox" src="${b.it.b.url}" alt="" style="left:${f1(b.x)}px; top:${f1(b.y)}px; width:${f1(b.w)}px; height:${f1(b.h)}px">` : '').join('')}
    ${placed.map(b => `<div class="slbl" data-qa-bg="#efe6d6" data-qa-small style="left:${f1(b.s.x + b.s.w / 2)}px; top:${f1(b.s.y + b.s.h + 2)}px; height:30px; transform:translateX(-50%); padding:0 12px">${h(b.it.q.puzzle)}</div>`).join('')}
    ${placed.map((b, i) => ghost(b.x + b.w - (i === 0 ? 88 : 74), b.y - (i === 0 ? 70 : 58), b.it.q.pct, i === 0)).join('')}
    ${top('Halloween', 'The shelf of fear', `<b>${hero.pct}%</b> of owners haven't solved the puzzle called <b>${h(hero.puzzle)}</b>.`, p1)}
    ${bottomBand(`Box art: ${h(brands.join(', '))} · ${h(aiCredit(p1))}`)}`, '#161a24') };

  // 2 · the ranking, code only.
  const bx = 620, bwMax = X1 - 90 - bx;
  const rowH = 136, ry = 318;
  const list: Slide = { id: 'shelf-2', body: slide(`
    <div class="fear" data-qa-bg="#161a24" style="top:0; bottom:0">
      <p class="kick abs" style="left:${X0}px; top:72px">The shelf of fear</p>
      <p class="t abs" style="left:${X0}px; top:118px; font-size:60px; width:${CW}px; line-height:1.05">The puzzles you own<br>and don't dare to start</p>
      ${six.map(({ q, b }, i) => `
        <div class="abs" style="left:${X0}px; top:${ry + i * rowH}px; width:${CW}px; height:${rowH}px; border-top:2px solid #2c3346; display:flex; align-items:center; gap:18px">
          ${b ? `<img src="${b.url}" alt="" style="flex:none; height:84px; width:${f1(84 * Math.min(1.5, b.aspect))}px; object-fit:cover; display:block">` : ''}
          <div style="width:${bx - X0 - 18 - 126 - 16}px">
            <p style="font-size:30px; font-weight:700; line-height:1.1">${h(q.puzzle)}</p>
            <p class="src" data-qa-small style="color:#c9d0dc; margin-top:4px">${h(q.brand)} · ${fmtInt(Number(q.unsolved))} of ${fmtInt(Number(q.owners))} owners</p></div></div>
        <div class="abs" style="left:${bx}px; top:${ry + i * rowH + 42}px; width:${f1(bwMax)}px; height:52px; background:#232a3b"></div>
        <div class="abs" style="left:${bx}px; top:${ry + i * rowH + 42}px; width:${f1(bwMax * q.pct / 100)}px; height:52px; background:${i === 0 ? CORAL : '#d6dbe6'}"></div>
        <p class="abs" data-qa-bg="#161a24" style="left:${f1(bx + bwMax * q.pct / 100 + 14)}px; top:${ry + i * rowH + 46}px; font-size:38px; font-weight:700; line-height:1.1">${q.pct}%</p>`).join('')}
      <div class="foot"><p class="src" data-qa-small style="color:#c9d0dc">${h(c.source)} · Box art: ${h(brands.join(', '))} · % of owners (puzzle in their MSP collection) with no logged solve; public profiles only</p><img class="logo logo-w" src="${LOGO_URL}" alt=""></div>
    </div>`, '#161a24') };

  // 3 · your turn: the second light, the shelf with question cards.
  const p3 = P['shelf-3'];
  const ask: Slide = { id: 'shelf-3', body: slide(`
    ${plateImg(p3)}${shelfPending(p3)}
    ${shelfSlots.map((s, i) => {
      const bw = s.w - 48, bh = bw / 1.4, x = s.x + 24, y = s.y + s.h - bh;
      return `<div class="abs" data-qa-bg="#2c3142" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(bw)}px; height:${f1(bh)}px; background:#2c3142; border:3px dashed #8a93a6; border-radius:6px; transform:rotate(${i % 2 ? 2 : -2}deg); display:grid; place-items:center">
        <p style="font-size:64px; font-weight:800; line-height:1; color:#ff8f8a">?</p></div>`;
    }).join('')}
    ${top('Your turn', 'Which puzzle haunts your shelf?', 'Tell us the one you keep walking past.', p3, 60)}
    ${bottomBand(`${h(aiCredit(p3))} · myspeedpuzzling.com`)}`, '#161a24') };

  const [k, v] = [six[1].q, six[2].q];
  return {
    key: 'shelf-of-fear',
    label: 'G1 Shelf of fear (AI shelf scene + real boxes in exact slots)',
    caption: `The puzzle called ${hero.puzzle} is the one you're most scared of: ${fmtInt(Number(hero.unsolved))} of its ${fmtInt(Number(hero.owners))} owners on MySpeedPuzzling haven't solved it yet, a spooky ${hero.pct}%. 👻

${k.puzzle} (${k.pct}%) and ${v.puzzle} (${v.pct}%) are hiding on the same shelf, waiting for a brave evening.

What's the scariest unsolved puzzle on yours? Tell us in the comments, we won't judge.

Box art: ${brands.join(', ')}.
#speedpuzzling #jigsawpuzzle #halloween`,
    slides: [cover, list, ask],
  };
}

// ---------------------------------------------------------------- 3 · D3 300M pieces ≈ London → New York

const PIECE_CM = Math.sqrt((49 * 36) / 500);          // a 500-piece Ravensburger is 49 × 36 cm
const LON: [number, number] = [-0.1278, 51.5074], NYC: [number, number] = [-74.006, 40.7128];
const LON_NYC_KM = geoDistance(LON, NYC) * 6371;

type Pt = [number, number];
function bezier(P4: Pt[], t: number): Pt {
  const u = 1 - t;
  return [0, 1].map(k => u * u * u * P4[0][k] + 3 * u * u * t * P4[1][k] + 3 * u * t * t * P4[2][k] + t * t * t * P4[3][k]) as Pt;
}
/** Points at equal arc length along a cubic Bézier, with the tangent angle at each. */
function alongArc(P4: Pt[], n: number) {
  const table: Array<{ p: Pt; s: number }> = [];
  let s = 0, prev = bezier(P4, 0);
  for (let i = 0; i <= 600; i++) { const p = bezier(P4, i / 600); s += Math.hypot(p[0] - prev[0], p[1] - prev[1]); table.push({ p, s }); prev = p; }
  const L = s;
  const at = (d: number) => {
    const j = Math.max(1, table.findIndex(e => e.s >= d));
    const a = table[j - 1], b = table[Math.min(j, table.length - 1)];
    const t = b.s === a.s ? 0 : (d - a.s) / (b.s - a.s);
    return { x: a.p[0] + (b.p[0] - a.p[0]) * t, y: a.p[1] + (b.p[1] - a.p[1]) * t, ang: Math.atan2(b.p[1] - a.p[1], b.p[0] - a.p[0]) * 180 / Math.PI };
  };
  return { L, pts: Array.from({ length: n }, (_, i) => at(((i + 0.5) * L) / n)), at };
}

/** The chain: interlocking pieces (middle row of a 3-row generator jigsaw) laid along the route. */
function chain(P4: Pt[], n: number, done: number) {
  const arc = alongArc(P4, n);
  const s = arc.L / n;
  const jig = generateJigsaw({ cols: n, rows: 3, width: n * s, height: 3 * s, seed: 31, tabSize: 0.24, jitter: 0.03 });
  const row = jig.pieces.filter(p => p.row === 1).sort((a, b) => a.col - b.col);
  const out = row.map((pc, i) => {
    const q = arc.pts[i];
    const t = `translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(q.ang)}) translate(${f1(-(i + 0.5) * s)} ${f1(-1.5 * s)})`;
    return i < done
      ? `<path d="${pc.d}" transform="${t}" fill="${CORAL}" stroke="#141b2b" stroke-width="2" stroke-linejoin="round"/>`
      : `<path d="${pc.d}" transform="${t}" fill="rgba(255,255,255,.16)" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="6 4" stroke-linejoin="round"/>`;
  }).join('');
  return { svg: out, front: arc.at(done * s), L: arc.L };
}

const oceanPending = (p: Plate) => p.status === 'pending'
  ? `<svg class="abs" style="left:0; top:0" width="${W}" height="${H}"><defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3554"/><stop offset="1" stop-color="#0d1322"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#og)"/></svg>` : '';

function ocean(c: Content): Post {
  const pieces = Number(pace.pieces), perDay = Number(pace.pieces_per_day), goal = 300_000_000;
  const left = goal - pieces, frac = pieces / goal;
  const km = (n: number) => (n * PIECE_CM) / 100_000;
  const eta = new Date(pace.eta_300m_pieces + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const lon = box('London Postcard', 'Ravensburger', 500), ny = box('New York Postcard', 'Ravensburger', 500);
  const p1 = P['ocean-1'];
  // Route: London (east, right) to New York (west, left), arcing north like the great circle.
  const A: Pt = [868, 528], B: Pt = [212, 540];
  const P4: Pt[] = [A, [700, 352], [392, 358], B];
  const N = 26, done = Math.floor(N * frac);
  const ch = chain(P4, N, done);
  const card = (b: Box | null, x: number, y: number, w: number, rot: number) => b
    ? `<div class="pc" style="left:${x}px; top:${y}px; width:${w}px; height:${f1(w / b.aspect + 20)}px; transform:rotate(${rot}deg)"><img src="${b.url}" alt=""></div>` : '';
  const pin = (p: Pt) => `<circle cx="${p[0]}" cy="${p[1]}" r="11" fill="#fff" stroke="#141b2b" stroke-width="4"/>`;
  const seaTop = 774;
  const foot = (text: string) => `<div class="foot"><p class="src" data-qa-small style="color:#c9d0dc; max-width:790px">${text}</p><img class="logo logo-w" src="${LOGO_URL}" alt=""></div>`;
  const cover: Slide = { id: 'ocean-1', body: slide(`
    ${plateImg(p1)}${oceanPending(p1)}
    ${card(lon, 742, A[1] + 12, 250, 3)}${card(ny, 88, B[1] + 12, 250, -3)}
    <svg class="abs" style="left:0; top:0" width="${W}" height="${H}">${ch.svg}${pin(A)}${pin(B)}</svg>
    <svg class="abs" style="left:0; top:0" width="${W}" height="${H}"><path d="M ${f1(ch.front.x)} ${f1(ch.front.y - 14)} V ${f1(ch.front.y - 58)}" stroke="#fff" stroke-width="3"/></svg>
    <p class="tag" data-qa-bg="#141b2b" style="left:${f1(ch.front.x - 30)}px; top:${f1(ch.front.y - 112)}px; font-size:30px">Today <b>${fmtInt(km(pieces))} km</b></p>
    <p class="tag" data-qa-small data-qa-bg="#141b2b" style="right:${W - X1}px; top:${A[1] - 66}px">London</p>
    <p class="tag" data-qa-small data-qa-bg="#141b2b" style="left:${X0}px; top:${B[1] - 66}px">New York</p>
    ${pendingPill(p1, X0, 96)}
    <div class="sea" data-qa-bg="#141b2b" style="top:${seaTop}px; padding-top:32px">
      <p class="kick">Every piece you've logged, edge to edge</p>
      <p class="hl" style="margin-top:10px"><b>300 million pieces</b> would reach from London to New York</p>
      <p class="big" style="margin-top:22px">${fmtInt(left)}</p>
      <p class="u" style="margin-top:10px">pieces to go, about <b>${fmtInt(km(left))} km</b>. ETA ≈ <b>${h(eta)}</b></p>
    </div>
    ${foot(`${h(c.source)} · Box art: London Postcard, New York Postcard (Ravensburger) · ${h(aiCredit(p1))}`)}`, '#141b2b') };

  // 2 · the maths, code only: one 500-piece puzzle, one piece highlighted.
  const gw = 25, gh = 20, pw = 640, ph = (pw * 36) / 49, gx = X0, gy = 360;
  const jig = generateJigsaw({ cols: gw, rows: gh, width: pw, height: ph, x: gx, y: gy, seed: 12, tabSize: 0.22 });
  const one = jig.pieces.find(p => p.col === 12 && p.row === 9)!;
  const line = (label: string, value: string, y: number, strong = false) =>
    `<p class="abs" style="left:${X0}px; top:${y}px; width:${CW}px; display:flex; justify-content:space-between; gap:24px; font-size:${strong ? 40 : 34}px; line-height:1.2; ${strong ? 'font-weight:700' : ''}; border-top:2px solid #2c3346; padding-top:16px"><span>${label}</span><span style="white-space:nowrap">${value}</span></p>`;
  const maths: Slide = { id: 'ocean-2', body: slide(`
    <div class="sea" data-qa-bg="#141b2b" style="top:0; bottom:0">
      <p class="kick abs" style="left:${X0}px; top:72px">The maths</p>
      <p class="hl abs" style="left:${X0}px; top:118px; width:${CW}px; font-size:60px">How long is <b>one piece</b>?</p>
      <svg class="abs" style="left:0; top:0" width="${W}" height="${H}">
        <rect x="${gx}" y="${gy}" width="${pw}" height="${f1(ph)}" fill="#1f2840"/>
        <path d="${jig.cuts}" fill="none" stroke="#4a5a80" stroke-width="1.2"/>
        <path d="${jig.border}" fill="none" stroke="#c7e8ff" stroke-width="3"/>
        <path d="${one.d}" fill="${CORAL}" stroke="#141b2b" stroke-width="1.5"/>
        <path d="M ${gx} ${gy - 22} H ${gx + pw}" stroke="#c7e8ff" stroke-width="2"/><path d="M ${gx} ${gy - 30} v 16 M ${gx + pw} ${gy - 30} v 16" stroke="#c7e8ff" stroke-width="2"/>
        <path d="M ${gx + pw + 22} ${gy} V ${f1(gy + ph)}" stroke="#c7e8ff" stroke-width="2"/><path d="M ${gx + pw + 14} ${gy} h 16 M ${gx + pw + 14} ${f1(gy + ph)} h 16" stroke="#c7e8ff" stroke-width="2"/>
      </svg>
      <p class="abs u" style="left:${gx + pw / 2 - 60}px; top:${gy - 74}px; width:120px; text-align:center">49 cm</p>
      <p class="abs u" style="left:${gx + pw + 44}px; top:${f1(gy + ph / 2 - 20)}px">36 cm</p>
      <p class="abs u" style="left:${gx + pw + 44}px; top:${gy + 6}px; width:${X1 - gx - pw - 44}px; color:#fff">A 500-piece<br>Ravensburger</p>
      ${line('One piece, edge to edge', `≈ ${PIECE_CM.toFixed(2)} cm`, 860)}
      ${line(`${fmtInt(goal)} pieces in a row`, `≈ ${fmtInt(Math.round(km(goal) / 100) * 100)} km`, 940)}
      ${line('London to New York', `≈ ${fmtInt(Math.round(LON_NYC_KM / 10) * 10)} km`, 1020)}
      ${line('Logged on MSP so far', `${fmtInt(pieces)}`, 1100, true)}
      <div class="foot"><p class="src" data-qa-small style="color:#c9d0dc">${h(c.source)} · piece size from a 49 × 36 cm, 500-piece puzzle · great-circle distance</p><img class="logo logo-w" src="${LOGO_URL}" alt=""></div>
    </div>`, '#141b2b') };

  // 3 · the pace, on the second ocean plate.
  const p3 = P['ocean-3'];
  const pace3: Slide = { id: 'ocean-3', body: slide(`
    ${plateImg(p3)}${oceanPending(p3)}
    ${pendingPill(p3, X0, 96)}
    <div class="sea" data-qa-bg="#141b2b" style="top:${seaTop - 120}px; padding-top:36px">
      <p class="kick">The countdown</p>
      <p class="hl" style="margin-top:10px">The chain grows by about</p>
      <p class="big" style="margin-top:14px">${fmtInt(km(perDay))} km a day</p>
      <p class="u" style="margin-top:18px">That's ${fmtInt(perDay)} pieces logged every day. At this pace it reaches New York around <b>${h(eta)}</b>.</p>
      <div style="position:relative; height:28px; margin-top:34px; background:#232a3b"><div style="position:absolute; left:0; top:0; bottom:0; width:${(frac * 100).toFixed(2)}%; background:${CORAL}"></div></div>
      <div style="display:flex; justify-content:space-between; margin-top:10px"><p class="src" data-qa-small style="color:#c9d0dc">London</p><p class="src" data-qa-small style="color:#c9d0dc">${(frac * 100).toFixed(1)}% of the way · New York</p></div>
    </div>
    ${foot(`${h(c.source)} · ${h(aiCredit(p3))}`)}`, '#141b2b') };

  return {
    key: '300m-ocean',
    label: 'D3 300M pieces ≈ London to New York (AI night ocean + code route)',
    caption: `${fmtInt(goal)} pieces laid edge to edge would reach from London to New York. You've logged ${fmtInt(pieces)} on MySpeedPuzzling so far.

One piece of a 500-piece puzzle is about ${PIECE_CM.toFixed(2)} cm across, so the chain is now about ${fmtInt(km(pieces))} km long and grows about ${fmtInt(km(perDay))} km a day. At this pace it reaches New York around ${eta}.

Every result you log moves it west. Where do you think it is right now?

Box art: London Postcard and New York Postcard, Ravensburger.
#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    slides: [cover, maths, pace3],
  };
}

// ---------------------------------------------------------------- 4 · H1 Which puzzler are you?

interface Animal { id: typeof ANIMAL_IDS[number]; name: string; trait: string; value: string; stat: string; scope: string; ground: string }

function animals(): Animal[] {
  const day = rows('bs-stopwatch-daypart'), night = day.find(r => r.daypart.includes('night'))!, eve = day.find(r => r.daypart.includes('evening'))!;
  const hours = rows('bs-stopwatch-hours'), early = hours.filter(r => Number(r.local_hour) >= 4 && Number(r.local_hour) < 8).reduce((s, r) => s + Number(r.sessions), 0);
  const pb = rows('pb-500-thresholds')[0], solo = rows('solo-distribution').find(r => r.pieces_count === '500')!;
  const shelfRow = rows('bs-shelf')[0], pers = rows('bs-persistence')[0], unb = rows('bs-unboxed').find(r => r.kind === 'summary')!;
  const p90 = Number(solo.p90);
  return [
    { id: 'owl', name: 'The Night Owl', trait: 'Starts the stopwatch after 10 pm.', value: `${night.median_active_min} min`, stat: `median 500-piece time for sessions started after 10 pm. The evening crowd needs ${eve.median_active_min}.`, scope: 'stopwatch sessions, Central European time', ground: '#dde3ff' },
    { id: 'lark', name: 'The Early Lark', trait: 'Puzzles before breakfast.', value: fmtInt(early), stat: 'timed sessions started before 8 in the morning.', scope: 'stopwatch sessions, Central European time', ground: '#ffe6e3' },
    { id: 'hare', name: 'The Sprint Hare', trait: 'Lives for the personal best.', value: fmtInt(Number(pb.under_30)), stat: `puzzlers have a solo 500 under 30 minutes, out of ${fmtInt(Number(pb.puzzlers))} with a 500-piece PB.`, scope: 'solo personal bests', ground: '#e2f4ff' },
    { id: 'tortoise', name: 'The Zen Tortoise', trait: 'Slow, steady, unbothered.', value: '1 in 10', stat: `solo 500s take longer than ${Math.floor(p90 / 60)} h ${Math.round(p90 % 60)} min. No rush.`, scope: `${fmtInt(Number(solo.results))} solo 500-piece results`, ground: '#f1ebe2' },
    { id: 'magpie', name: 'The Hoarding Magpie', trait: 'Buys faster than they solve.', value: `${shelfRow.pct_unsolved}%`, stat: 'of puzzles in MSP collections are still waiting to be solved by their owner.', scope: `${fmtInt(Number(shelfRow.collected_pairs))} collection entries`, ground: '#dde3ff' },
    { id: 'parrot', name: 'The Re-solving Parrot', trait: 'Loves a puzzle twice.', value: `${pers.median_days_between_two_solves} days`, stat: `median gap before a puzzler solves the same puzzle again. The longest gap: ${pers.longest_repeat_gap_years} years.`, scope: 'puzzlers with two results on one puzzle', ground: '#ffe6e3' },
    { id: 'bat', name: 'The Blind Bat', trait: 'Never looks at the box.', value: fmtInt(Number(unb.b)), stat: `puzzlers have solved without the box image. Fastest unboxed solo 500: ${unb.c}.`, scope: `${fmtInt(Number(unb.a))} unboxed results`, ground: '#e2f4ff' },
    { id: 'swallow', name: 'The Brand-hopping Swallow', trait: 'Migrates from brand to brand.', value: fmtInt(Number(pers.brands_50plus)), stat: `puzzlers have solved puzzles from 50 or more brands. The record is ${pers.max_brands}.`, scope: 'distinct brands per puzzler', ground: '#f1ebe2' },
  ];
}

/** The animal in its card: the cut-out on white, or a dashed placeholder labelled pending. */
function animalArt(a: Animal, x: number, y: number, w: number, hh: number, big: boolean) {
  const p = P[a.id];
  if (p.cut) return `<img src="${p.cut}" alt="" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(w)}px; height:${f1(hh)}px">`;
  const r = Math.min(w, hh) / 2 - 6;
  return `<svg class="abs" style="left:${f1(x)}px; top:${f1(y)}px" width="${f1(w)}" height="${f1(hh)}"><circle cx="${f1(w / 2)}" cy="${f1(hh / 2)}" r="${f1(r)}" fill="${a.ground}" stroke="#626c80" stroke-width="3" stroke-dasharray="10 9"/></svg>
    ${big ? '' : `<p class="abs" data-qa-small data-qa-bg="${a.ground}" style="left:${f1(x)}px; top:${f1(y + hh / 2 - 15)}px; width:${f1(w)}px; text-align:center; font-size:24px; font-weight:700; color:#4b566b">pending</p>`}`;
}

const animalCredit = (ids: readonly string[]) => {
  const ps = ids.map(i => P[i]);
  const used = [...new Set(ps.filter(p => p.status !== 'pending').map(p => `${p.model}, ${p.licence}`))];
  const pending = ps.filter(p => p.status === 'pending').length;
  return [used.length ? `Illustrations: AI (${used.join('; ')})` : '', pending ? `${pending === ps.length ? 'AI illustrations pending' : `${pending} AI illustration${pending > 1 ? 's' : ''} pending`}` : ''].filter(Boolean).join(' · ');
};

function spirit(c: Content): Post {
  const list = animals();
  // Cover: 2 × 4 grid of cards.
  const cw = (CW - 24) / 2, chh = 196, cy0 = 330;
  const coverCards = list.map((a, i) => {
    const x = X0 + (i % 2) * (cw + 24), y = cy0 + Math.floor(i / 2) * (chh + 20);
    return `<div class="card an" style="left:${f1(x)}px; top:${y}px; width:${f1(cw)}px; height:${chh}px">
      ${animalArt(a, 14, 14, chh - 28, chh - 28, false)}
      <div class="abs" style="left:${chh}px; top:0; bottom:0; right:16px; display:flex; flex-direction:column; justify-content:center">
        <p class="nm">${h(a.name.replace(/^The /, ''))}</p><p class="hn" data-qa-small>${h(a.trait)}</p></div></div>`;
  }).join('');
  const cover: Slide = { id: 'animals-1', body: slide(`
    <div class="abs" style="left:${X0}px; top:64px; width:${CW}px; display:flex; align-items:center; gap:22px">${badge('?')}
      <p class="kick" style="color:var(--ink-soft)">8 puzzlers · 8 real numbers</p>
      <div style="margin-left:auto">${P.owl.status === 'pending' ? pendingPill({ ...P.owl, kindLabel: 'E3 animals' }) : ''}</div></div>
    <p class="abs who" style="left:${X0}px; top:196px; width:${CW}px">Which puzzler are you?</p>
    ${coverCards}
    <div class="foot"><p class="src" data-qa-small>${h(c.source)} · ${h(animalCredit(ANIMAL_IDS))}</p><img class="logo" src="${LOGO_URL}" alt=""></div>`, '#fbf7f3') };

  const slides: Slide[] = list.map((a, i) => {
    const p = P[a.id];
    return { id: `animal-${i + 1}`, body: slide(`
      <div class="abs" style="left:${X0}px; top:64px; width:${CW}px; display:flex; align-items:center; gap:22px">${badge(String(i + 1))}
        <p class="kick" style="color:var(--ink-soft)">Which puzzler are you?</p>
        <p style="margin-left:auto; font-size:30px; font-weight:700">${i + 1}<span style="font-weight:400; color:var(--ink-soft)"> / 8</span></p></div>
      <div class="card" style="left:${X0}px; top:196px; width:${CW}px; height:560px">
        ${animalArt(a, (CW - 520) / 2, 20, 520, 520, true)}
        ${p.status === 'pending' ? `<p class="abs" data-qa-bg="${a.ground}" style="left:0; right:0; top:250px; text-align:center; font-size:30px; font-weight:700; color:#4b566b">AI illustration pending<br><span style="font-weight:400; font-size:24px" data-qa-small>${h(p.kindLabel)}</span></p>` : ''}
      </div>
      <p class="abs who" style="left:${X0}px; top:792px; width:${CW}px; font-size:${a.name.length > 20 ? 64 : 76}px">${h(a.name)}</p>
      <p class="abs trait" style="left:${X0}px; top:880px; width:${CW}px">${h(a.trait)}</p>
      <div class="abs" style="left:${X0}px; top:960px; width:${CW}px; border-top:3px solid ${INK}; padding-top:28px; display:flex; gap:32px; align-items:flex-start">
        <p class="statv">${h(a.value)}</p>
        <p class="statk" style="padding-top:6px">${h(a.stat)}</p></div>
      <div class="foot"><p class="src" data-qa-small>${h(c.source)} · ${h(a.scope)} · ${h(aiCredit(p, 'Illustration'))}</p><img class="logo" src="${LOGO_URL}" alt=""></div>`, a.ground) };
  });

  const owl = list[0], bat = list[6], magpie = list[4];
  return {
    key: 'spirit-animals',
    label: 'H1 Which puzzler are you? (AI house-style animals + real stats)',
    caption: `Which puzzler are you? We matched 8 puzzling habits to 8 animals, each with a real number from MySpeedPuzzling.

Night owls solve a 500 in ${owl.value} (median), ${bat.value} blind bats have solved without looking at the box, and ${magpie.value} of the puzzles in your collections are still waiting on the shelf.

Owl, lark, hare, tortoise, magpie, parrot, bat or swallow? Tell us yours in the comments, and send this to the magpie in your puzzle group.
#speedpuzzling #jigsawpuzzle #puzzlecommunity`,
    slides: [cover, ...slides],
  };
}

// ---------------------------------------------------------------- direction

const G2 = {
  id: 'G2',
  name: 'AI scenes, composited back',
  idea: 'AI paints only the stage (a quiet gallery wall, a night ocean, a moonlit shelf, house-style animals); code hangs the real credited boxes in it with matching light and sets every word, number, route and piece on solid panels.',
  css,
  posts: (c: Content): Post[] => [museum(c), shelf(c), ocean(c), spirit(c)],
};

export default G2 as unknown as Direction;
