// Rigs the MSP logo for motion (logo motion lab LM1): the same vector mark as assets/brand/speedpuzzling-logo.svg,
// with its 70 CorelDRAW elements grouped into named parts with stable ids, so a timeline can move each part.
//
//   node src/design/logo-rig.ts     # writes assets/brand/speedpuzzling-logo-rig.svg and …-rig-outline.svg
//
// What changes against the source file (and what doesn't):
//   - The CSS classes (.fil0 …) become presentation attributes (fill, fill-opacity, fill-rule), the <style> block is
//     gone, and the one inherited gradient (xlink:href) is resolved, so the file survives tools that drop CSS.
//   - The ten gradient opacity masks (knob, corner and dial-glass shading) are kept as masks, ids prefixed.
//   - The big navy outline (`outline`) stays the source's one compound path: the band around the whole silhouette plus
//     the dial ring. Split into two paths, Chromium anti-aliases its edges differently (~560 px off by up to 128 at
//     1024 px), so the split halves exist only as hidden helpers for motion: `silhouette` (the band) and `dial-ring`
//     (inside `dial`). A timeline that moves the dial without the silhouette hides `outline`, shows both helpers, and
//     swaps back when it settles.
//   - Elements are re-ordered into part groups only where they don't overlap, so the settled mark is pixel-identical
//     (verified by lab/logo/rig-check.ts: the rig and the source rendered at 1024 px, pixel by pixel).
//
// Paint order of the parts (bottom → top), as in the source wherever parts overlap. The navy outline is drawn over
// the whole watch (crown stem and button necks tuck under it). A rigid body that is split over the paint order shares
// a class: `.piece` (piece, piece-tint, piece-shine) and `.watch` (watch-back, watch-face); move every member with the
// same transform (GSAP: the same svgOrigin in logo units).
//
//   piece:       piece-fill (the coloured piece + case silhouette), piece-knobs (knob shading, masked)
//   speed-lines  (speed-line-1…5, top → bottom; their right ends overlap the piece)
//   piece-tint   (the bottom knob's second, lilac shading layer: the lowest speed line ends between the two)
//   watch-back:  case (white case disc + its blue shading), crown, buttons (button-left, button-right)
//   watch-face:  dial (dial-face, dial-ring*), ticks (tick-1…12 by the hour), hub, hand-minute, trails
//                (trail-1…4, newest → oldest: 10:30, 9:00, 7:30, 6:00), hand-hour
//   outline      (navy band around the whole silhouette + the dial ring), silhouette* (the band alone)
//   piece-shine  (the two masked highlights in the piece's lower corners)
//   * hidden helpers (visibility="hidden") for motion, see above.
//
// The outline variant (speedpuzzling-logo-rig-outline.svg) adds the rounded white outline of
// speedpuzzling-logo-outline.svg as a `halo`: a filtered <use> of the whole rig drawn under it, so the outline
// follows the parts while they move. Same viewBox growth as the outline file, so it is a drop-in replacement.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

const SRC = join(ROOT, 'assets/brand/speedpuzzling-logo.svg');
export const RIG_FILE = join(ROOT, 'assets/brand/speedpuzzling-logo-rig.svg');
export const RIG_OUTLINE_FILE = join(ROOT, 'assets/brand/speedpuzzling-logo-rig-outline.svg');

/** The source viewBox (logo units). */
export const VIEWBOX = { x: 0, y: 0, w: 7624.51, h: 6739.65 } as const;
/** Dial centre: the pivot of both hands and the trails (the hub circle's centre). */
export const DIAL = { cx: 4278.44, cy: 3461.66 } as const;
/** Outline width as a share of the mark's width (same as build-logo.ts). */
export const OUTLINE = 0.034;
/** viewBox padding of the outline variant (same rule as build-logo.ts). */
export const OUTLINE_PAD = Math.ceil(VIEWBOX.w * OUTLINE * 1.25);

// ------------------------------------------------------------------ parsing

type Box = { x0: number; y0: number; x1: number; y1: number };

/** Splits a path (M/m, L/l, c, z) into absolute-start subpaths and collects the bbox of its points (control-point hull). */
export function parsePath(d: string): { subpaths: string[]; box: Box } {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const subpaths: string[] = [];
  const box: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const see = (x: number, y: number) => { box.x0 = Math.min(box.x0, x); box.y0 = Math.min(box.y0, y); box.x1 = Math.max(box.x1, x); box.y1 = Math.max(box.y1, y); };
  let cur = '', x = 0, y = 0, sx = 0, sy = 0, cmd = '', i = 0;
  const n = () => Number(tok[i++]);
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    switch (cmd) {
      case 'M': case 'm': {
        let a = n(), b = n();
        if (cmd === 'm') { a += x; b += y; }
        if (cur) subpaths.push(cur);
        cur = `M${round(a)} ${round(b)}`;
        x = sx = a; y = sy = b; see(x, y);
        cmd = cmd === 'm' ? 'l' : 'L';
        break;
      }
      case 'l': { const a = n(), b = n(); cur += `l${a} ${b}`; x += a; y += b; see(x, y); break; }
      case 'L': { const a = n(), b = n(); cur += `L${a} ${b}`; x = a; y = b; see(x, y); break; }
      case 'c': {
        const v = [n(), n(), n(), n(), n(), n()];
        cur += `c${v.join(' ')}`;
        see(x + v[0], y + v[1]); see(x + v[2], y + v[3]);
        x += v[4]; y += v[5]; see(x, y);
        break;
      }
      case 'z': case 'Z': cur += 'z'; x = sx; y = sy; break;
      default: throw new Error(`logo-rig: unsupported path command "${cmd}"`);
    }
  }
  if (cur) subpaths.push(cur);
  return { subpaths, box };
}

const round = (v: number) => Math.round(v * 100) / 100;

interface El { tag: 'path' | 'circle'; attrs: Record<string, string>; box: Box }

/** The source's style classes as presentation attributes. */
function classAttrs(svg: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const m of svg.matchAll(/\.(fil\d+)\s*\{([^}]*)\}/g)) {
    const a: Record<string, string> = {};
    for (const decl of m[2].split(';')) {
      const [k, v] = decl.split(':').map(s => s?.trim());
      if (k && v) a[k] = v;
    }
    out[m[1]] = a;
  }
  return out;
}

function readSource() {
  const svg = readFileSync(SRC, 'utf8');
  const classes = classAttrs(svg);
  const defs = svg.slice(svg.indexOf('<defs>') + 6, svg.indexOf('</defs>')).replace(/<style[\s\S]*?<\/style>/, '');
  const body = svg.slice(svg.indexOf('</defs>'));
  const els: El[] = [];
  for (const m of body.matchAll(/<(path|circle)\b([^>]*?)\/?>/g)) {
    const raw: Record<string, string> = {};
    for (const a of m[2].matchAll(/([\w:-]+)="([^"]*)"/g)) raw[a[1]] = a[2];
    const attrs: Record<string, string> = { ...(classes[raw.class] ?? {}) };
    const mask = raw.style?.match(/mask:url\(#(id\d+)\)/);
    if (mask) attrs.mask = `url(#${mask[1]})`;
    if (m[1] === 'path') attrs.d = raw.d;
    else for (const k of ['cx', 'cy', 'r']) attrs[k] = raw[k];
    const box = m[1] === 'path' ? parsePath(raw.d).box
      : { x0: +raw.cx - +raw.r, y0: +raw.cy - +raw.r, x1: +raw.cx + +raw.r, y1: +raw.cy + +raw.r };
    els.push({ tag: m[1] as El['tag'], attrs, box });
  }
  if (els.length !== 70) throw new Error(`logo-rig: expected 70 elements in the source logo, found ${els.length}`);
  const srcSize = svg.match(/width="[^"]*mm" height="[^"]*mm"/)![0];
  return { defs, els, srcSize };
}

// ------------------------------------------------------------------ the rig

/** Source element indices per part (document order of the CorelDRAW file; checked against the bboxes on build). */
const PARTS = {
  pieceFill: [0], pieceKnobs: [7, 10, 11], pieceTint: [66], pieceShine: [68, 69],
  case: [4, 20],
  crown: [1, 2, 3, 12, 13, 14, 15, 16, 17, 18, 19, 23, 24],
  buttonLeft: [6, 9, 21, 25, 26, 27, 28], buttonRight: [5, 8, 22, 29, 30, 31, 32],
  dialFace: [33, 34, 35], hub: [36, 37], handMinute: [38], trails: [39, 40, 41, 42], handHour: [43],
  ticks: [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  speedLines: [56, 57, 58, 59, 60, 61, 62, 63, 64, 65],
  outline: [67],
} as const;

export interface RigOptions {
  /** Prefix for every id (parts and defs), for pages that inline more than one rig. */
  prefix?: string;
  /** Add the white outline halo (the outline variant) and grow the viewBox like speedpuzzling-logo-outline.svg. */
  outline?: boolean;
  /** Extra attributes on the root <svg> (e.g. class, style, width). Default: the source's mm size. */
  rootAttrs?: string;
  /** Leave out the XML declaration (for inlining into HTML). */
  inline?: boolean;
}

export interface PartInfo { id: string; box: Box; cx: number; cy: number }
export interface RigInfo {
  viewBox: typeof VIEWBOX; dial: typeof DIAL;
  parts: Record<string, PartInfo>;
  /** Tick ids by the hour (tick-1 … tick-12) with their angle (deg, clockwise from 12). */
  ticks: Array<{ id: string; hour: number; deg: number }>;
  /** Trails, newest → oldest, with the angle each one points at (deg clockwise from 12) and its opacity. */
  trails: Array<{ id: string; deg: number; opacity: number }>;
  /** Speed lines top → bottom with their extent (logo units). */
  speedLines: Array<{ id: string; box: Box }>;
  /** The hour hand's angle (deg clockwise from 12) and the minute hand's (0). */
  handHourDeg: number;
  /** The silhouette's outer and inner contours and the dial ring's (absolute-start subpaths), for clip paths. */
  contours: { silhouetteOuter: string; silhouetteInner: string; dialOuter: string; dialInner: string };
}

const union = (bs: Box[]): Box => ({ x0: Math.min(...bs.map(b => b.x0)), y0: Math.min(...bs.map(b => b.y0)), x1: Math.max(...bs.map(b => b.x1)), y1: Math.max(...bs.map(b => b.y1)) });
const angleOf = (b: Box) => {
  const x = (b.x0 + b.x1) / 2 - DIAL.cx, y = (b.y0 + b.y1) / 2 - DIAL.cy;
  return (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
};

function build(o: RigOptions = {}) {
  const p = o.prefix ?? '';
  const { defs, els, srcSize } = readSource();
  const ref = (s: string) => s.replace(/#id(\d+)/g, (_, n) => `#${p}lg${n}`);
  const attrStr = (a: Record<string, string>) => Object.entries(a).map(([k, v]) => `${k}="${k === 'mask' || v.startsWith('url(') ? ref(v) : v}"`).join(' ');
  const el = (i: number, extra: Record<string, string> = {}) => `<${els[i].tag} ${attrStr({ ...extra, ...els[i].attrs })}/>`;

  // defs: ids prefixed, style="" on rects and stops turned into attributes, the inherited gradient resolved.
  const stopsOf = (id: string) => defs.match(new RegExp(`<linearGradient id="${id}"[^>]*>([\\s\\S]*?)</linearGradient>`))![1];
  let d = defs.replace(/<linearGradient id="(id\d+)"([^>]*?)xlink:href="#(id\d+)"([^>]*?)>\s*<\/linearGradient>/g,
    (_, id, a, from, b) => `<linearGradient id="${id}"${a}${b}>${stopsOf(from)}</linearGradient>`);
  d = d.replace(/style="stop-opacity:([\d.]+); stop-color:([^"]+)"/g, 'stop-opacity="$1" stop-color="$2"')
    .replace(/style="fill:url\(#(id\d+)\)"/g, 'fill="url(#$1)"')
    .replace(/id="id(\d+)"/g, `id="${p}lg$1"`)
    .replace(/url\(#id(\d+)\)/g, `url(#${p}lg$1)`)
    .replace(/\n\s*\n/g, '\n');

  // The compound outline: silhouette band (outer + inner contour) and dial ring (outer + inner).
  const outline = parsePath(els[67].attrs.d);
  if (outline.subpaths.length !== 4) throw new Error('logo-rig: the outline path changed (expected 4 contours)');
  const sub = outline.subpaths.map(s => ({ s, box: parsePath(s).box }));
  const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0);
  const bySize = [...sub].sort((a, b) => area(b.box) - area(a.box));
  const [silOuter, silInner, dialOuter, dialInner] = bySize;
  const navy = { fill: els[67].attrs.fill, 'fill-rule': els[67].attrs['fill-rule'] ?? 'nonzero' };
  const navyAttrs = Object.entries(navy).map(([k, v]) => `${k}="${v}"`).join(' ');
  // Keep the source's contour order inside each pair (winding is what matters; order keeps the raster identical).
  const pair = (a: typeof sub[number], b: typeof sub[number]) => [a, b].sort((x, y) => sub.indexOf(x) - sub.indexOf(y)).map(q => q.s).join('');

  const ticks = PARTS.ticks.map(i => ({ i, deg: angleOf(els[i].box) })).map(t => ({ ...t, hour: Math.round(t.deg / 30) || 12 }));
  if (new Set(ticks.map(t => t.hour)).size !== 12) throw new Error('logo-rig: ticks are not one per hour');
  const trails = PARTS.trails.map(i => ({ i, deg: Math.round(angleOf(els[i].box) / 15) * 15, opacity: Number(els[i].attrs['fill-opacity']) }))
    .sort((a, b) => b.opacity - a.opacity);
  // Speed lines: pairs of dashes on one row (same y), top → bottom.
  const rows = new Map<number, number[]>();
  for (const i of PARTS.speedLines) { const y = Math.round(els[i].box.y0); rows.set(y, [...(rows.get(y) ?? []), i]); }
  const lines = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, is], k) => ({ id: `speed-line-${k + 1}`, is: is.sort((a, b) => a - b) }));
  if (lines.length !== 5) throw new Error('logo-rig: expected 5 speed lines');

  const g = (id: string, inner: string, cls = '') => `<g id="${p}${id}"${cls ? ` class="${cls}"` : ''}>${inner}</g>`;
  const els_ = (is: readonly number[]) => is.map(i => el(i)).join('');
  const art = g('logo', [
    g('piece', `${el(0, { id: `${p}piece-fill` })}${g('piece-knobs', els_(PARTS.pieceKnobs))}`, 'piece'),
    g('speed-lines', lines.map(l => g(l.id, els_(l.is))).join('')),
    g('piece-tint', els_(PARTS.pieceTint), 'piece'),
    g('watch-back', [
      g('case', els_(PARTS.case)),
      g('crown', els_(PARTS.crown)),
      g('buttons', g('button-left', els_(PARTS.buttonLeft)) + g('button-right', els_(PARTS.buttonRight))),
    ].join(''), 'watch'),
    g('watch-face', [
      g('dial', g('dial-face', els_(PARTS.dialFace)) + `<path id="${p}dial-ring" ${navyAttrs} visibility="hidden" d="${pair(dialOuter, dialInner)}"/>`),
      g('ticks', [...ticks].sort((a, b) => a.hour - b.hour).map(t => el(t.i, { id: `${p}tick-${t.hour}` })).join('')),
      g('hub', els_(PARTS.hub)),
      g('hand-minute', els_(PARTS.handMinute)),
      g('trails', [...trails].sort((a, b) => a.i - b.i).map(t => el(t.i, { id: `${p}trail-${trails.indexOf(t) + 1}` })).join('')),
      g('hand-hour', els_(PARTS.handHour)),
    ].join(''), 'watch'),
    // The settled outline is the source's compound path, untouched: split into two paths, Chromium's anti-aliasing
    // of the band changes by up to half a level on ~560 edge pixels. The split halves are hidden helpers for motion.
    el(67, { id: `${p}outline` }),
    `<path id="${p}silhouette" ${navyAttrs} visibility="hidden" d="${pair(silOuter, silInner)}"/>`,
    g('piece-shine', els_(PARTS.pieceShine), 'piece'),
  ].join('\n'));

  const { x, y, w, h } = VIEWBOX;
  const pad = o.outline ? OUTLINE_PAD : 0;
  const r = w * OUTLINE, sigma = r / 1.55;
  const halo = o.outline ? {
    defs: `<filter id="${p}halo-f" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
   <feGaussianBlur in="SourceAlpha" stdDeviation="${sigma.toFixed(1)}" result="b"/>
   <feComponentTransfer in="b" result="m"><feFuncA type="linear" slope="30" intercept="-1.5"/></feComponentTransfer>
   <feFlood flood-color="#ffffff" result="w"/>
   <feComposite in="w" in2="m" operator="in"/>
  </filter>`,
    use: `<use id="${p}halo" href="#${p}logo" filter="url(#${p}halo-f)"/>`,
  } : null;
  // Same intrinsic size as the files they replace: the source's mm size, or build-logo.ts's unitless outline size.
  const size = o.rootAttrs ?? (o.outline ? `width="${((w + 2 * pad) / 100).toFixed(2)}" height="${((h + 2 * pad) / 100).toFixed(2)}"` : srcSize);
  const svg = `${o.inline ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n'}<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${x - pad} ${y - pad} ${w + 2 * pad} ${h + 2 * pad}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd">
<!-- MySpeedPuzzling logo, rigged for motion by src/design/logo-rig.ts (parts: see that file). Generated; don't edit. -->
<defs>${d}${halo ? halo.defs : ''}</defs>
${halo ? halo.use + '\n' : ''}${art}
</svg>
`;

  // Metadata for compositions: part boxes and pivots, tick/trail angles, contours for clip paths.
  const partBoxes: Record<string, number[]> = {
    'speed-lines': [...PARTS.speedLines], piece: [0, ...PARTS.pieceKnobs], 'piece-fill': [0], 'piece-knobs': [...PARTS.pieceKnobs], 'piece-tint': [...PARTS.pieceTint],
    'piece-shine': [...PARTS.pieceShine], case: [...PARTS.case], crown: [...PARTS.crown], 'button-left': [...PARTS.buttonLeft],
    'button-right': [...PARTS.buttonRight], buttons: [...PARTS.buttonLeft, ...PARTS.buttonRight], 'dial-face': [...PARTS.dialFace],
    hub: [...PARTS.hub], 'hand-minute': [...PARTS.handMinute], trails: [...PARTS.trails], 'hand-hour': [...PARTS.handHour],
    ticks: [...PARTS.ticks], logo: els.map((_, i) => i),
  };
  const parts: Record<string, PartInfo> = {};
  for (const [id, is] of Object.entries(partBoxes)) {
    const box = union(is.map(i => els[i].box));
    parts[id] = { id, box, cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2 };
  }
  for (const [id, s] of [['silhouette', silOuter], ['dial-ring', dialOuter]] as const) parts[id] = { id, box: s.box, cx: (s.box.x0 + s.box.x1) / 2, cy: (s.box.y0 + s.box.y1) / 2 };
  const info: RigInfo = {
    viewBox: VIEWBOX, dial: DIAL, parts,
    ticks: ticks.map(t => ({ id: `tick-${t.hour}`, hour: t.hour, deg: t.hour * 30 % 360 })).sort((a, b) => a.hour - b.hour),
    trails: trails.map((t, k) => ({ id: `trail-${k + 1}`, deg: t.deg, opacity: t.opacity })),
    speedLines: lines.map(l => ({ id: l.id, box: union(l.is.map(i => els[i].box)) })),
    handHourDeg: Math.round(angleOf(els[PARTS.handHour[0]].box) / 15) * 15,
    contours: { silhouetteOuter: silOuter.s, silhouetteInner: silInner.s, dialOuter: dialOuter.s, dialInner: dialInner.s },
  };
  return { svg, info };
}

/** The rigged logo as SVG markup. */
export const buildRig = (o: RigOptions = {}) => build(o).svg;
/** Part boxes, pivots and angles of the rig (logo units). */
export const rigInfo = (): RigInfo => build().info;

if (import.meta.main) {
  writeFileSync(RIG_FILE, buildRig());
  writeFileSync(RIG_OUTLINE_FILE, buildRig({ outline: true }));
  const info = rigInfo();
  console.log(`wrote ${RIG_FILE.slice(ROOT.length + 1)} and ${RIG_OUTLINE_FILE.slice(ROOT.length + 1)}`);
  console.log(`ticks ${info.ticks.map(t => t.hour).join(',')}; trails ${info.trails.map(t => `${t.id}@${t.deg}°/${t.opacity.toFixed(2)}`).join(' ')}; hour hand ${info.handHourDeg}°`);
}
