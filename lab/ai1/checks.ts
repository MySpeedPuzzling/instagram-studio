// Cheap, code-only pass checks for AI1 candidates (brainstorm §5 pass criteria). CPU only, ~0.1–0.5 s per image.
// Owner judgement (no glyphs, nothing that reads as a puzzle/person/landmark, "would post") stays with the owner;
// these numbers only sort and flag.
//
// - zone:    luma std-dev inside the reserved type zone after a 9 px box blur (pass ≤ 10 on 0–255).
// - palette: mean CIEDE2000 to the nearest brand colour after the brand-LUT snap (pass ≤ 10). The snap is a 50 %
//            pull in OKLab towards the nearest colour of assets/design/palette.json (ramps, semantic, brand).
// - seam:    offset-tile seam ratio (edge-wrap difference / typical neighbour difference; ≈ 1 = tiles as is) and
//            the spread of 4×4 block means (even light, no objects).
// - spot:    flood-fill cutout from the border, coral share of the filled area (want 30–40 %), navy outline share,
//            and the outline weight estimated as 2·area/boundary of the navy mask (want 2.5–3.3 % of the width).
// - slots:   each scaffold slot edge located as the strongest luma step within ±12 px; offsets and IoU against the
//            code rectangle (pass: every box slot within ±4 px, IoU ≥ 0.98).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { converter, differenceCiede2000 } from 'culori';
import sharp from 'sharp';
import { ROOT } from '../../src/render/server.ts';
import type { Job, Zone } from './batch.ts';
import type { Rect } from './scaffolds.ts';

type Img = { data: Buffer; w: number; h: number };
const toOklab = converter('oklab');
const toLab = converter('lab65');
const de2000 = differenceCiede2000();

async function rgb(file: string, width?: number): Promise<Img> {
  let s = sharp(file).removeAlpha().toColourspace('srgb');
  if (width) s = s.resize({ width, kernel: 'cubic' });
  const { data, info } = await s.raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function luma(img: Img): Float32Array {
  const out = new Float32Array(img.w * img.h);
  for (let i = 0, p = 0; i < out.length; i++, p += 3) out[i] = 0.2126 * img.data[p] + 0.7152 * img.data[p + 1] + 0.0722 * img.data[p + 2];
  return out;
}

/** Separable box blur with radius r (kernel 2r+1), edges clamped. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 2 * r + 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let d = -r; d <= r; d++) s += src[y * w + Math.min(w - 1, Math.max(0, x + d))]; tmp[y * w + x] = s / k;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let d = -r; d <= r; d++) s += tmp[Math.min(h - 1, Math.max(0, y + d)) * w + x]; out[y * w + x] = s / k;
  }
  return out;
}

const hexes = (o: unknown): string[] => typeof o === 'string' ? (/^#[0-9a-f]{6}$/i.test(o) ? [o] : []) : o && typeof o === 'object' ? Object.values(o).flatMap(hexes) : [];
const PALETTE = [...new Set(hexes(JSON.parse(readFileSync(join(ROOT, 'assets/design/palette.json'), 'utf8'))).map(h => h.toLowerCase()))];
const PAL_OK = PALETTE.map(h => toOklab(h)!);
const PAL_LAB = PALETTE.map(h => toLab(h)!);

const okDist = (a: { l: number; a: number; b: number }, b: { l: number; a: number; b: number }) => Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
function nearest(c: { l: number; a: number; b: number }) {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < PAL_OK.length; i++) { const d = okDist(c, PAL_OK[i]); if (d < bd) { bd = d; bi = i; } }
  return bi;
}

export function zoneSigma(l: Float32Array, w: number, h: number, z: Zone): number {
  const b = boxBlur(l, w, h, 4);
  const x0 = Math.round(z.x0 * w), x1 = Math.round(z.x1 * w), y0 = Math.round(z.y0 * h), y1 = Math.round(z.y1 * h);
  let s = 0, s2 = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const v = b[y * w + x]; s += v; s2 += v * v; n++; }
  return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
}

export async function paletteDeltaE(file: string, strength = 0.5) {
  const img = await rgb(file, 96);
  let raw = 0, snapped = 0;
  const n = img.w * img.h;
  for (let p = 0; p < img.data.length; p += 3) {
    const c = { mode: 'rgb' as const, r: img.data[p] / 255, g: img.data[p + 1] / 255, b: img.data[p + 2] / 255 };
    const ok = toOklab(c)!;
    const i = nearest(ok);
    raw += de2000(toLab(c)!, PAL_LAB[i]);
    const q = PAL_OK[i];
    const s = { mode: 'oklab' as const, l: ok.l + (q.l - ok.l) * strength, a: ok.a + (q.a - ok.a) * strength, b: ok.b + (q.b - ok.b) * strength };
    snapped += de2000(toLab(s)!, PAL_LAB[nearest(s)]);
  }
  return { raw: raw / n, snapped: snapped / n };
}

export function seam(l: Float32Array, w: number, h: number) {
  let sh = 0, sv = 0, ih = 0, iv = 0;
  for (let x = 0; x < w; x++) sh += Math.abs(l[x] - l[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) sv += Math.abs(l[y * w] - l[y * w + w - 1]);
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) ih += Math.abs(l[y * w + x] - l[(y + 1) * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) iv += Math.abs(l[y * w + x] - l[y * w + x + 1]);
  const b = boxBlur(l, w, h, 4);
  const means: number[] = [];
  for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) {
    let s = 0, n = 0;
    for (let y = Math.floor(by * h / 4); y < Math.floor((by + 1) * h / 4); y++) for (let x = Math.floor(bx * w / 4); x < Math.floor((bx + 1) * w / 4); x++) { s += b[y * w + x]; n++; }
    means.push(s / n);
  }
  return { ratioH: (sh / w) / (ih / ((h - 1) * w)), ratioV: (sv / h) / (iv / (w - 1) / h), blockRange: Math.max(...means) - Math.min(...means) };
}

export async function spot(file: string) {
  const img = await rgb(file, 512);
  const { w, h } = img, n = w * h;
  const ok = new Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 3) ok[i] = toOklab({ mode: 'rgb', r: img.data[p] / 255, g: img.data[p + 1] / 255, b: img.data[p + 2] / 255 })!;
  const white = (c: { l: number; a: number; b: number }) => c.l > 0.93 && Math.hypot(c.a, c.b) < 0.03;
  // Flood fill the background from every border pixel through near-white pixels.
  const bg = new Uint8Array(n), stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (bg[i] || !white(ok[i])) continue;
    bg[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w);
  }
  const band = Math.round(0.02 * w);
  let borderN = 0, borderBg = 0, subject = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!bg[i]) subject++;
    if (x < band || y < band || x >= w - band || y >= h - band) { borderN++; borderBg += bg[i]; }
  }
  const cat = (hex: string[]) => hex.map(c => toOklab(c)!);
  const pal = JSON.parse(readFileSync(join(ROOT, 'assets/design/palette.json'), 'utf8'));
  const stops = (r: Record<string, string>) => ['200', '300', '400', '500', '600', '700'].map(k => r[k]);
  const cats: Record<string, ReturnType<typeof cat>> = {
    coral: cat(stops(pal.ramps.coral)), sky: cat(stops(pal.ramps.sky)), lavender: cat(stops(pal.ramps.indigo)), navy: cat(['#2b3445', '#373f50']),
  };
  const count: Record<string, number> = { coral: 0, sky: 0, lavender: 0, navy: 0, other: 0 };
  for (let i = 0; i < n; i++) {
    if (bg[i]) continue;
    let best = 'other', bd = 0.1;
    for (const [k, cs] of Object.entries(cats)) for (const c of cs) { const d = okDist(ok[i], c); if (d < bd) { bd = d; best = k; } }
    count[best]++;
  }
  // Outline weight on the full-size navy mask.
  const full = await rgb(file);
  const navyOk = toOklab('#2b3445')!;
  const m = new Uint8Array(full.w * full.h);
  for (let i = 0, p = 0; i < m.length; i++, p += 3) m[i] = okDist(toOklab({ mode: 'rgb', r: full.data[p] / 255, g: full.data[p + 1] / 255, b: full.data[p + 2] / 255 })!, navyOk) < 0.1 ? 1 : 0;
  let area = 0, boundary = 0;
  for (let y = 1; y < full.h - 1; y++) for (let x = 1; x < full.w - 1; x++) {
    const i = y * full.w + x;
    if (!m[i]) continue;
    area++;
    if (!m[i - 1] || !m[i + 1] || !m[i - full.w] || !m[i + full.w]) boundary++;
  }
  const filled = subject - count.navy;
  return {
    borderBgPct: 100 * borderBg / borderN, subjectPct: 100 * subject / n,
    coralPct: filled > 0 ? 100 * count.coral / filled : 0, navyPct: subject > 0 ? 100 * count.navy / subject : 0,
    lineWeightPct: boundary ? 100 * (2 * area / boundary) / full.w : 0,
  };
}

/** Locate each slot's four edges as the strongest luma step within ±12 px of the code rectangle. */
export function slotFit(l: Float32Array, w: number, h: number, slots: Array<{ id: string; kind: string; gen: Rect }>) {
  const b = l; // no blur: a blur spreads a 1 px step over ties; averaging along the edge already removes noise
  const R = 12;
  const res = slots.map(s => {
    const r = s.gen;
    const ys = [Math.round(r.y + 0.2 * r.h), Math.round(r.y + 0.8 * r.h)], xs = [Math.round(r.x + 0.2 * r.w), Math.round(r.x + 0.8 * r.w)];
    const vEdge = (x0: number) => { // boundary between columns x-1 and x
      let best = x0, bs = -1;
      for (let x = Math.max(1, x0 - R); x <= Math.min(w - 1, x0 + R); x++) {
        let s = 0; for (let y = ys[0]; y < ys[1]; y++) s += Math.abs(b[y * w + x] - b[y * w + x - 1]);
        s /= ys[1] - ys[0]; if (s > bs) { bs = s; best = x; }
      }
      return { pos: best, strength: bs };
    };
    const hEdge = (y0: number) => {
      let best = y0, bs = -1;
      for (let y = Math.max(1, y0 - R); y <= Math.min(h - 1, y0 + R); y++) {
        let s = 0; for (let x = xs[0]; x < xs[1]; x++) s += Math.abs(b[y * w + x] - b[(y - 1) * w + x]);
        s /= xs[1] - xs[0]; if (s > bs) { bs = s; best = y; }
      }
      return { pos: best, strength: bs };
    };
    const e = { l: vEdge(r.x), r: vEdge(r.x + r.w), t: hEdge(r.y), b: hEdge(r.y + r.h) };
    const lost = Object.values(e).some(v => v.strength < 4);
    const m = { x: e.l.pos, y: e.t.pos, w: e.r.pos - e.l.pos, h: e.b.pos - e.t.pos };
    const ix = Math.max(0, Math.min(r.x + r.w, m.x + m.w) - Math.max(r.x, m.x)), iy = Math.max(0, Math.min(r.y + r.h, m.y + m.h) - Math.max(r.y, m.y));
    const inter = ix * iy, iou = inter / (r.w * r.h + Math.max(0, m.w) * Math.max(0, m.h) - inter);
    const off = Math.max(Math.abs(e.l.pos - r.x), Math.abs(e.r.pos - r.x - r.w), Math.abs(e.t.pos - r.y), Math.abs(e.b.pos - r.y - r.h));
    return { id: s.id, kind: s.kind, offset: lost ? R : off, iou: lost ? 0 : iou, lost };
  });
  const boxes = res.filter(s => s.kind === 'box');
  return { slots: res, maxOffset: Math.max(...boxes.map(s => s.offset)), minIoU: Math.min(...boxes.map(s => s.iou)), within: boxes.filter(s => s.offset <= 4 && s.iou >= 0.98).length, boxes: boxes.length };
}

export interface CheckResult { metrics: Record<string, unknown>; warnings: string[]; pass: boolean | null }

const ok = (b: boolean) => (b ? 'ok' : 'FAIL');

/** Runs the job's checks on its PNG. `slots` come from the scaffold the job edited (E4/E5). */
export async function runChecks(job: Pick<Job, 'checks' | 'zone'>, file: string, slots?: Array<{ id: string; kind: string; gen: Rect }>): Promise<CheckResult> {
  const metrics: Record<string, unknown> = {}, warnings: string[] = [], verdicts: boolean[] = [];
  const img = await rgb(file);
  const l = luma(img);
  if (job.checks.includes('zone') && job.zone) {
    const s = zoneSigma(l, img.w, img.h, job.zone);
    metrics.zone_sigma = +s.toFixed(2);
    verdicts.push(s <= 10);
    warnings.push(`auto ${ok(s <= 10)}: type zone flat, luma σ ${s.toFixed(1)} (≤ 10)`);
  }
  if (job.checks.includes('palette')) {
    const d = await paletteDeltaE(file);
    metrics.palette_de2000_raw = +d.raw.toFixed(2);
    metrics.palette_de2000_snapped = +d.snapped.toFixed(2);
    verdicts.push(d.snapped <= 10);
    warnings.push(`auto ${ok(d.snapped <= 10)}: brand palette, mean ΔE2000 ${d.snapped.toFixed(1)} after LUT snap (≤ 10; raw ${d.raw.toFixed(1)})`);
  }
  if (job.checks.includes('seam')) {
    const s = seam(l, img.w, img.h);
    Object.assign(metrics, { seam_ratio_h: +s.ratioH.toFixed(2), seam_ratio_v: +s.ratioV.toFixed(2), block_range: +s.blockRange.toFixed(1) });
    const seamOk = Math.max(s.ratioH, s.ratioV) <= 1.5, even = s.blockRange <= 12;
    verdicts.push(even);
    warnings.push(`auto ${ok(even)}: even surface, 4×4 block-mean range ${s.blockRange.toFixed(1)} (≤ 12)`);
    warnings.push(`info: raw seam ratio ${Math.max(s.ratioH, s.ratioV).toFixed(2)} (${seamOk ? 'tiles as is' : 'needs the code offset-and-blend'})`);
  }
  if (job.checks.includes('spot')) {
    const s = await spot(file);
    Object.assign(metrics, Object.fromEntries(Object.entries(s).map(([k, v]) => [k, +v.toFixed(2)])));
    const cut = s.borderBgPct >= 98, coral = s.coralPct >= 30 && s.coralPct <= 40, line = s.lineWeightPct >= 2.5 && s.lineWeightPct <= 3.3;
    verdicts.push(cut, coral);
    warnings.push(`auto ${ok(cut)}: clean cutout, ${s.borderBgPct.toFixed(0)} % white border (≥ 98)`);
    warnings.push(`auto ${ok(coral)}: coral ${s.coralPct.toFixed(0)} % of the filled area (30–40)`);
    warnings.push(`info: navy outline ${s.navyPct.toFixed(0)} % of the subject, weight ≈ ${s.lineWeightPct.toFixed(2)} % of width (${line ? 'in' : 'outside'} 2.5–3.3)`);
  }
  if (job.checks.includes('slots') && slots) {
    const s = slotFit(l, img.w, img.h, slots);
    Object.assign(metrics, { slot_max_offset_px: s.maxOffset, slot_min_iou: +s.minIoU.toFixed(3), slots: s.slots });
    const pass = s.within === s.boxes;
    verdicts.push(pass);
    warnings.push(`auto ${ok(pass)}: slots kept ${s.within}/${s.boxes} (max offset ${s.maxOffset} px, min IoU ${s.minIoU.toFixed(3)}; want ±4 px, ≥ 0.98)`);
  }
  return { metrics, warnings, pass: verdicts.length ? verdicts.every(Boolean) : null };
}
