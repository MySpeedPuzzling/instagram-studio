// D7 · House Illustrated (MSP semi-flat outlined).
// White ground. One hand-drawn spot illustration per slide in the badge-art house style: ONE navy ink at one
// fixed stroke, same-hue two-stop washes lit from the top-left, a white rim light + glint, a deep-tone bevel shade
// bottom-right, no gloss, no faces, no hands. Objects stand on a navy ground line that is also the chart baseline,
// so the drawing and the data share the same ink. Illustrations never carry numbers; pieces come from the generator.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import { LOGO_URL, assignUnits, barGeometry, flagUrl, pieceGrid, rankGeometry } from '../../../src/design/svg.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../types.ts';

const X0 = 88, CW = 904, GROUND = 1150;

// ── House illustration kit ─────────────────────────────────────────────────────────────────────────────
const INK = '#2b3445';
const SW = 11;                 // the one outline weight, px on the 1080 canvas (every illustration, every slide)
const DET = 7;                 // interior details (≥ 0.6 × SW)
const RIM = 0.4 * SW;          // rim light / bevel shade width
const IN = 0.95 * SW;          // rim light distance inside the outline centre line

type Wash = 'coral' | 'pale' | 'sky' | 'lav' | 'face' | 'skyp' | 'lavp';
const WASH: Record<Wash, [string, string]> = {
  coral: ['#ffa6a3', '#f77b7c'],
  pale: ['#fff0ee', '#fdd3cf'],
  sky: ['#a8cefe', '#6aaef6'],
  lav: ['#b9b1fd', '#928bf1'],
  face: ['#ffffff', '#e3eaf6'],
  skyp: ['#f1f8ff', '#d6eaff'],
  lavp: ['#f4f2ff', '#e0dcff'],
};
const DEEP: Record<Wash, string> = { coral: '#e15b5f', pale: '#efa59f', sky: '#3f88d6', lav: '#6b63d4', face: '#b9c6dc', skyp: '#9fc6ef', lavp: '#aaa3ec' };

const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${(Object.keys(WASH) as Wash[]).map(k =>
  `<linearGradient id="w-${k}" x1="0.12" y1="0.04" x2="0.88" y2="0.96"><stop offset="0" stop-color="${WASH[k][0]}"/><stop offset="1" stop-color="${WASH[k][1]}"/></linearGradient>`).join('')}</defs></svg>`;

const n = (v: number) => +v.toFixed(2);
const rad = (deg: number) => (deg * Math.PI) / 180;
const P = (cx: number, cy: number, r: number, deg: number): [number, number] => [n(cx + r * Math.cos(rad(deg))), n(cy + r * Math.sin(rad(deg)))];
const circ = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}Z`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1);
  return `M${x0} ${y0}A${n(r)} ${n(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
};
const rr = (x: number, y: number, w: number, hh: number, r: number) =>
  `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + hh - r)}A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + hh)}H${n(x + r)}A${r} ${r} 0 0 1 ${n(x)} ${n(y + hh - r)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z`;

const fill = (d: string, w: Wash, extra = '') => `<path d="${d}" fill="url(#w-${w})"${extra}/>`;
const ink = (d: string, width = SW, extra = '') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const solid = (d: string) => `<path d="${d}" fill="${INK}"/>`;
const rim = (d: string) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="${RIM}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shade = (d: string, w: Wash) => `<path d="${d}" fill="none" stroke="${DEEP[w]}" stroke-opacity="0.45" stroke-width="${RIM}" stroke-linecap="round" stroke-linejoin="round"/>`;
const glint = (x: number, y: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.3 * SW)}" fill="#fff" fill-opacity="0.9"/>`;

/** Rim light along the top-left of a rounded rect, and the bevel shade along its bottom-right. */
const rrLight = (x: number, y: number, w: number, hh: number, r: number, wash: Wash, o: { rim?: boolean; shade?: boolean; glint?: boolean } = {}) => {
  const i = IN, ri = Math.max(r - i, 1);
  const out: string[] = [];
  if (o.rim !== false) {
    const sy = y + Math.max(r, Math.min(hh * 0.62, hh - r - 2));
    out.push(rim(`M${n(x + i)} ${n(sy)}V${n(y + r)}A${n(ri)} ${n(ri)} 0 0 1 ${n(x + r)} ${n(y + i)}H${n(x + Math.max(r + 4, w * 0.42))}`));
    if (o.glint !== false) out.push(glint(x + Math.max(r + 4, w * 0.42) + 2.2 * SW, y + i));
  }
  if (o.shade !== false) {
    const sy = y + hh - Math.max(r, Math.min(hh * 0.62, hh - r - 2));
    out.push(shade(`M${n(x + w - i)} ${n(sy)}V${n(y + hh - r)}A${n(ri)} ${n(ri)} 0 0 1 ${n(x + w - r)} ${n(y + hh - i)}H${n(x + w - Math.max(r + 4, w * 0.42))}`, wash));
  }
  return out.join('');
};
/** Rim light + glint on the top-left of a circle and the shade on its bottom-right. */
const circLight = (cx: number, cy: number, r: number, wash: Wash, inset = IN) =>
  rim(arc(cx, cy, r - inset, 196, 246)) + glint(...P(cx, cy, r - inset, 258)) + shade(arc(cx, cy, r - inset, 18, 104), wash);

/**
 * A generator piece (centre piece of a 3×3 jigsaw), centred on (cx, cy) and rotated. Seeds with a classic
 * two-knob/two-socket layout: 4, 7, 33 (adjacent knobs), 1, 12, 21 (opposite knobs).
 */
function piece(cx: number, cy: number, size: number, seed: number, wash: Wash | 'white', o: { rot?: number; stroke?: number; opacity?: number } = {}) {
  const jig = generateJigsaw({ cols: 3, rows: 3, width: size * 3, height: size * 3, seed, tabSize: 0.22, jitter: 0.02 });
  const p = jig.pieces.find(q => q.col === 1 && q.row === 1)!;
  const c = size * 1.5;
  const tf = `translate(${n(cx - c)} ${n(cy - c)}) rotate(${o.rot ?? 0} ${c} ${c})`;
  const paint = wash === 'white' ? `fill="#fff" fill-opacity="${o.opacity ?? 0.95}"` : `fill="url(#w-${wash})"`;
  const stroke = o.stroke === 0 ? '' : ` stroke="${INK}" stroke-width="${o.stroke ?? SW}" stroke-linejoin="round"`;
  return `<path d="${p.d}" transform="${tf}" ${paint}${stroke}/>`;
}

interface Art { w: number; h: number; base: number; svg: string }
const art = (w: number, hh: number, base: number, body: string): Art => ({ w, h: hh, base, svg: body });
/** Places an illustration so its ground contact line sits on the ground (or at a given y). */
const place = (a: Art, x: number, groundY = GROUND) =>
  `<svg class="art" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" style="left:${x}px; top:${groundY - a.base}px" aria-hidden="true">${a.svg}</svg>`;

// ── The illustrations (objects only: no hands, no faces, no numbers) ─────────────────────────────────

/** Stopwatch with its hand just short of the top: the "just before the hour" moment. */
function stopwatch(): Art {
  const W = 470, cx = 235, R = 194, r = 126, cy = 10 + 52 + 18 + R; // cap + short neck above the bezel
  const base = cy + R;
  const s: string[] = [];
  // Pushers at ±45° from the top.
  for (const a of [-135, -45]) {
    const [px, py] = P(cx, cy, R + 24, a);
    const t = `transform="rotate(${a + 90} ${px} ${py})"`;
    const [n1, n2] = [P(cx, cy, R - 2, a - 4.2), P(cx, cy, R + 12, a - 4.2)];
    const [m1, m2] = [P(cx, cy, R - 2, a + 4.2), P(cx, cy, R + 12, a + 4.2)];
    s.push(ink(`M${n1[0]} ${n1[1]}L${n2[0]} ${n2[1]}M${m1[0]} ${m1[1]}L${m2[0]} ${m2[1]}`));
    s.push(`<g ${t}>${fill(rr(px - 34, py - 16, 68, 32, 14), 'coral')}${rim(`M${px - 22} ${py - 16 + IN}H${px + 2}`)}${ink(rr(px - 34, py - 16, 68, 32, 14))}</g>`);
  }
  // Crown: neck + cap.
  const capY = 10, capH = 52, neckY = capY + capH;
  s.push(ink(`M${cx - 20} ${neckY}V${cy - R + 2}M${cx + 20} ${neckY}V${cy - R + 2}`));
  s.push(fill(rr(cx - 62, capY, 124, capH, 20), 'coral') + rrLight(cx - 62, capY, 124, capH, 20, 'coral', { glint: false }) + ink(rr(cx - 62, capY, 124, capH, 20)));
  // Bezel ring and dial.
  s.push(fill(circ(cx, cy, r), 'face'));
  s.push(fill(circ(cx, cy, R) + circ(cx, cy, r), 'coral', ' fill-rule="evenodd"'));
  s.push(circLight(cx, cy, R, 'coral'));
  // Elapsed wedge from the top round to the hand (pale), then ticks, hand and pivot.
  const handA = -98;
  const [hx, hy] = P(cx, cy, r - 30, handA);
  const [wx0, wy0] = P(cx, cy, r - 10, -90), [wx1, wy1] = P(cx, cy, r - 10, handA);
  s.push(`<path d="M${cx} ${cy}L${wx0} ${wy0}A${r - 10} ${r - 10} 0 1 1 ${wx1} ${wy1}Z" fill="url(#w-pale)"/>`);
  s.push(ink(circ(cx, cy, R)) + ink(circ(cx, cy, r)));
  for (let k = 0; k < 12; k++) {
    const a = -90 + k * 30, major = k % 3 === 0;
    const [x1, y1] = P(cx, cy, r - (major ? 30 : 22), a), [x2, y2] = P(cx, cy, r - 14, a);
    s.push(ink(`M${x1} ${y1}L${x2} ${y2}`, major ? SW : DET));
  }
  s.push(ink(`M${cx} ${cy}L${hx} ${hy}`));
  s.push(solid(circ(cx, cy, 14)));
  return art(W, base + SW, base, s.join(''));
}

/** Hourglass: coral sand nearly run through, sky end caps, white glass. */
function hourglass(): Art {
  const W = 230, cx = 115, capW = 206, capH = 40, top = 8, gTop = top + capH, gBot = gTop + 250, bot = gBot + capH;
  const L = cx - 70, Rr = cx + 70, neck = 13, mid = (gTop + gBot) / 2;
  const glass = `M${L} ${gTop}C${L} ${gTop + 82} ${cx - neck} ${mid - 36} ${cx - neck} ${mid}C${cx - neck} ${mid + 36} ${L} ${gBot - 82} ${L} ${gBot}H${Rr}C${Rr} ${gBot - 82} ${cx + neck} ${mid + 36} ${cx + neck} ${mid}C${cx + neck} ${mid - 36} ${Rr} ${gTop + 82} ${Rr} ${gTop}Z`;
  const clip = `<clipPath id="hg-clip"><path d="${glass}"/></clipPath>`;
  const sandTop = `M0 ${mid - 62}Q${cx} ${mid - 46} ${W} ${mid - 62}V${mid}H0Z`;
  const sandBot = `M0 ${gBot}V${gBot - 26}C${cx - 60} ${gBot - 34} ${cx - 34} ${gBot - 84} ${cx} ${gBot - 88}C${cx + 34} ${gBot - 84} ${cx + 60} ${gBot - 34} ${W} ${gBot - 26}V${gBot}Z`;
  const s = [
    `<defs>${clip}</defs>`,
    fill(glass, 'face'),
    `<g clip-path="url(#hg-clip)">${fill(sandTop, 'coral')}${fill(sandBot, 'coral')}<path d="M${cx} ${mid}V${gBot - 88}" stroke="#f77b7c" stroke-width="${DET}" stroke-linecap="round"/></g>`,
    rim(`M${L + IN} ${gTop + 14}C${L + IN} ${gTop + 60} ${cx - neck - 30} ${mid - 60} ${cx - neck - 8} ${mid - 26}`),
    ink(glass),
  ];
  for (const y of [top, gBot]) s.push(fill(rr(cx - capW / 2, y, capW, capH, 16), 'sky') + rrLight(cx - capW / 2, y, capW, capH, 16, 'sky') + ink(rr(cx - capW / 2, y, capW, capH, 16)));
  return art(W, bot + SW, bot, s.join(''));
}

/** A finish banner on two posts: "the line people race for". */
function finishLine(): Art {
  const W = 330, postW = 34, H0 = 340, lx = 22, rx = W - 22 - postW, ballR = 22, py0 = 50;
  const s: string[] = [];
  for (const x of [lx, rx]) {
    s.push(fill(rr(x, py0, postW, H0 - py0, 12), 'sky') + rrLight(x, py0, postW, H0 - py0, 12, 'sky', { glint: false }) + ink(rr(x, py0, postW, H0 - py0, 12)));
    s.push(fill(circ(x + postW / 2, py0 - ballR + 4, ballR), 'coral') + rim(arc(x + postW / 2, py0 - ballR + 4, ballR - IN, 200, 250)) + ink(circ(x + postW / 2, py0 - ballR + 4, ballR)));
  }
  // Banner with a two-row checker.
  const bx = lx + postW, bw = rx - bx, by = 80, bh = 76, cols = 8, cw = bw / cols, ch = bh / 2;
  const checks: string[] = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < cols; col++) if ((row + col) % 2 === 0) checks.push(`M${n(bx + col * cw)} ${n(by + row * ch)}h${n(cw)}v${n(ch)}h${n(-cw)}Z`);
  s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#fff"/>`);
  s.push(`<path d="${checks.join('')}" fill="${INK}"/>`);
  s.push(ink(`M${bx} ${by}H${bx + bw}V${by + bh}H${bx}Z`));
  return art(W, H0 + SW, H0, s.join(''));
}

/** Trophy with a white generator-piece print on the cup. */
function trophy(): Art {
  const W = 320, cx = 160, top = 30;
  const cupL = cx - 88, cupR = cx + 88, cupB = 228;
  const cup = `M${cupL} ${top + 22}H${cupR}V${top + 92}C${cupR} ${cupB - 40} ${cx + 52} ${cupB} ${cx} ${cupB}C${cx - 52} ${cupB} ${cupL} ${cupB - 40} ${cupL} ${top + 92}Z`;
  const lip = [cx - 106, top, 212, 36, 16] as const;
  const stem = `M${cx - 18} ${cupB - 4}H${cx + 18}V${cupB + 46}H${cx - 18}Z`;
  const collar = [cx - 52, cupB + 44, 104, 30, 12] as const;
  const plinth = [cx - 96, cupB + 74, 192, 62, 16] as const;
  const base = cupB + 74 + 62;
  const s = [
    ink(`M${cupL + 4} ${top + 62}C${cupL - 62} ${top + 56} ${cupL - 66} ${top + 150} ${cupL + 14} ${top + 160}`),
    ink(`M${cupR - 4} ${top + 62}C${cupR + 62} ${top + 56} ${cupR + 66} ${top + 150} ${cupR - 14} ${top + 160}`),
    fill(stem, 'coral'), ink(stem),
    fill(cup, 'coral'),
    rim(`M${cupL + IN} ${top + 50}V${top + 104}C${cupL + IN} ${top + 128} ${cupL + 18} ${top + 150} ${cupL + 30} ${top + 164}`),
    shade(`M${cupR - IN} ${top + 112}C${cupR - IN} ${cupB - 50} ${cx + 52} ${cupB - IN - 2} ${cx + 8} ${cupB - IN}`, 'coral'),
    piece(cx, top + 112, 66, 33, 'white', { stroke: 0, rot: 0 }),
    ink(cup),
    fill(rr(...lip), 'coral') + rrLight(...lip, 'coral', { shade: false }) + ink(rr(...lip)),
    fill(rr(...collar), 'lav') + ink(rr(...collar)),
    fill(rr(...plinth), 'lav') + rrLight(...plinth, 'lav') + ink(rr(...plinth)),
  ];
  return art(W, base + SW, base, s.join(''));
}

/** A fresh puzzle box, its lid tipped open and one generator piece rising out of it: the first try. */
function puzzleBox(): Art {
  const W = 400, bx = 30, bw = 300, by = 220, bh = 140, base = by + bh;
  const lid = [bx - 12, by - 58, bw + 24, 58, 16] as const;
  const s = [
    piece(bx + 214, by - 20, 104, 4, 'sky', { rot: 12 }),
    fill(rr(bx, by, bw, bh, 18), 'coral') + rrLight(bx, by, bw, bh, 18, 'coral'),
    `<rect x="${bx + 64}" y="${by + 32}" width="${bw - 128}" height="${bh - 64}" rx="12" fill="#fff"/>`,
    piece(bx + bw / 2, by + bh / 2, 44, 1, 'coral', { stroke: 0, rot: 90 }),
    ink(rr(bx + 64, by + 32, bw - 128, bh - 64, 12), DET),
    ink(rr(bx, by, bw, bh, 18)),
    `<g transform="rotate(-24 ${lid[0]} ${lid[1] + lid[3]})">${fill(rr(...lid), 'coral')}${rrLight(...lid, 'coral')}${ink(rr(...lid))}</g>`,
  ];
  return art(W, base + SW, base, s.join(''));
}

/** A three-step podium with a generator piece standing on the top step. */
function podium(): Art {
  const W = 268, bw = 82, x0 = 11, base = 270, hts = [100, 140, 72];
  const order: Wash[] = ['sky', 'coral', 'lav'];
  const s: string[] = [piece(x0 + bw * 1.5, base - hts[1] - 42, 82, 4, 'coral', { rot: 0 })];
  hts.forEach((ht, i) => {
    const x = x0 + i * bw, y = base - ht;
    s.push(fill(rr(x, y, bw, ht, 10), order[i]) + rrLight(x, y, bw, ht, 10, order[i], { glint: i === 1 }));
  });
  hts.forEach((ht, i) => s.push(ink(rr(x0 + i * bw, base - ht, bw, ht, 10))));
  return art(W, base + SW, base, s.join(''));
}

/** Three puzzle boxes stacked: white bodies, coral and sky lids. */
function boxStack(): Art {
  const W = 280, base = 270;
  const boxes = [
    { x: 12, w: 256, hh: 98 },
    { x: 36, w: 206, hh: 86 },
    { x: 62, w: 156, hh: 74 },
  ];
  const s: string[] = [];
  let y = base;
  for (const [i, b] of boxes.entries()) {
    y -= b.hh;
    const lidH = Math.round(b.hh * 0.36), r = 12, ri = r - IN;
    const wash: Wash = i === 1 ? 'sky' : 'coral';
    s.push(fill(rr(b.x, y, b.w, b.hh, r), 'face'));
    s.push(`<path d="M${b.x + r} ${y}H${b.x + b.w - r}A${r} ${r} 0 0 1 ${b.x + b.w} ${y + r}V${y + lidH}H${b.x}V${y + r}A${r} ${r} 0 0 1 ${b.x + r} ${y}Z" fill="url(#w-${wash})"/>`);
    s.push(rim(`M${b.x + IN} ${y + lidH - 4}V${y + r}A${n(ri)} ${n(ri)} 0 0 1 ${b.x + r} ${y + IN}H${n(b.x + b.w * 0.4)}`));
    s.push(piece(b.x + b.w / 2, y + lidH + (b.hh - lidH) / 2 + 2, 30, 7, wash, { stroke: 0 }));
    s.push(ink(`M${b.x} ${y + lidH}H${b.x + b.w}`));
    s.push(ink(rr(b.x, y, b.w, b.hh, r)));
  }
  return art(W, base + SW, base, s.join(''));
}

/** Level medallion: a 12-scallop seal with ribbon tails and a white plate (the plate carries the type, not the art). */
function medallion(R: number) {
  const W = R * 2 + 40, cx = W / 2, cy = R + 20, k = 12, rIn = R * 0.86, plate = R * 0.7;
  // Scalloped outline: arcs between points on the inner radius bulging out to R.
  let d = '';
  for (let i = 0; i < k; i++) {
    const a0 = -90 + (360 / k) * i, a1 = a0 + 360 / k;
    const [x0, y0] = P(cx, cy, rIn, a0), [x1, y1] = P(cx, cy, rIn, a1);
    const chord = Math.hypot(x1 - x0, y1 - y0);
    const sag = R - rIn * Math.cos(rad(180 / k));
    const rr0 = (chord * chord / 4 + sag * sag) / (2 * sag);
    d += `${i === 0 ? `M${x0} ${y0}` : ''}A${n(rr0)} ${n(rr0)} 0 0 1 ${x1} ${y1}`;
  }
  d += 'Z';
  const tail = (dir: 1 | -1) => {
    const x = cx + dir * R * 0.36, y = cy + R * 0.55;
    return `M${n(x - 30 * dir)} ${n(y)}L${n(x + 34 * dir)} ${n(y + 14)}L${n(x + 52 * dir)} ${n(y + R * 0.6)}L${n(x + 24 * dir)} ${n(y + R * 0.5)}L${n(x + 4 * dir)} ${n(y + R * 0.68)}Z`;
  };
  const s = [
    fill(tail(-1), 'lav') + ink(tail(-1)),
    fill(tail(1), 'lav') + ink(tail(1)),
    fill(d, 'coral'),
    rim(arc(cx, cy, rIn - IN * 0.6, 198, 244)), glint(...P(cx, cy, rIn - IN * 0.6, 256)), shade(arc(cx, cy, rIn - IN * 0.6, 20, 100), 'coral'),
    `<circle cx="${cx}" cy="${cy}" r="${plate}" fill="#fff"/>`,
    ink(d),
  ];
  return { w: W, h: cy + R * 1.0 + 20 + R * 0.3, cx, cy, plate, svg: s.join('') };
}

// ── Page chrome ────────────────────────────────────────────────────────────────────────────────────────
const css = `
.frame { position: relative; width: 1080px; height: 1350px; background: var(--paper); overflow: hidden; }
.art { position: absolute; display: block; }
.hd { position: absolute; left: ${X0}px; width: ${CW}px; top: 64px; display: flex; align-items: center; justify-content: space-between; }
.kick { font-size: 32px; font-weight: 500; color: var(--ink-soft); }
.kick b { color: var(--ink); font-weight: 700; }
.no { font-size: 30px; font-weight: 500; color: var(--ink-muted); }
.h1 { position: absolute; left: ${X0}px; width: ${CW}px; top: 146px; font-size: 116px; line-height: 0.98; font-weight: 700; letter-spacing: -3px; }
.h2 { position: absolute; left: ${X0}px; width: ${CW}px; top: 146px; font-size: 64px; line-height: 1.1; font-weight: 700; letter-spacing: -1.2px; text-wrap: balance; }
.dek { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 40px; line-height: 1.3; color: var(--ink-soft); text-wrap: pretty; }
.ground { position: absolute; left: ${X0 - 4}px; width: ${CW + 8}px; top: ${GROUND - 3}px; height: 6px; border-radius: 3px; background: var(--ink); }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1214px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.src { font-size: 30px; color: var(--ink-muted); }
.logo { width: 66px; height: 58px; }
.lab { font-size: 34px; fill: var(--ink-soft); font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-strong { font-size: 38px; font-weight: 700; fill: var(--ink); font-family: Rubik; font-variant-numeric: tabular-nums; }
.lab-accent { font-size: 38px; font-weight: 700; fill: var(--indigo-500); font-family: Rubik; font-variant-numeric: tabular-nums; }
.big { position: absolute; left: ${X0}px; font-size: 280px; font-weight: 700; line-height: 1; letter-spacing: -9px; }
.q { position: absolute; left: ${X0}px; font-size: 48px; line-height: 1.15; font-weight: 700; color: var(--indigo-500); }
.rank { position: absolute; left: ${X0}px; }
.row { position: absolute; left: 0; display: flex; align-items: center; height: 60px; width: 640px; }
.row .flag { position: relative; width: 50px; height: 50px; flex: none; }
.row .flag img { width: 50px; height: 50px; display: block; }
.row .flag i { position: absolute; inset: -2px; border: 4px solid var(--ink); border-radius: 50%; }
.row .name { width: 250px; margin-left: 20px; font-size: 36px; font-weight: 500; }
.row .val { width: 106px; text-align: right; font-size: 36px; font-weight: 700; }
.row .bar { height: 30px; margin-left: 22px; border-radius: 0 6px 6px 0; background: var(--context); }
.row.first .bar { background: #fb8180; outline: 4px solid var(--ink); outline-offset: -2px; border-radius: 0 8px 8px 0; }
.legend { position: absolute; left: ${X0}px; top: 316px; width: ${CW}px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; font-size: 34px; color: var(--ink-soft); }
.legend b { color: var(--ink); font-weight: 700; }
.sw { display: inline-block; width: 34px; height: 34px; border-radius: 9px; vertical-align: -7px; margin-right: 14px; border: 4px solid var(--ink); }
`;

const head = (kicker: string, no: string) => `${DEFS}<header class="hd"><span class="kick">${h(kicker)}</span><span class="no">${h(no)}</span></header>`;
const foot = (src: string) => `<div class="ground"></div><footer class="foot"><span class="src">${h(src)}</span><img class="logo" src="${LOGO_URL}" alt=""></footer>`;
const frame = (inner: string) => `<div class="frame">${inner}</div>`;
const CORAL = '#fb8180';

function wall(c: Content): Post {
  const w = c.wall;
  const isWall = (m: number) => m >= w.mode.minute - 3 && m <= 59;

  // Cover: a teaser of the bars left of the stopwatch, both standing on the ground line.
  const sw = stopwatch();
  const teaser = w.histogram.filter(d => d.minute >= 50 && d.minute <= 66);
  const TW = 420, TH = 430;
  const tg = barGeometry(teaser, { x: d => d.minute, y: d => d.results, width: TW, height: TH, padding: 0.3 });
  const tBars = tg.bars.map(b => `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height + 3)}" rx="4" ${isWall(b.datum.minute) ? `fill="${CORAL}" stroke="${INK}" stroke-width="4"` : 'fill="var(--context)"'}/>`).join('');
  const tx60 = tg.xScale('60')! - (tg.xScale.step() - tg.xScale.bandwidth()) / 2;

  // Histogram slide: full 40–80 min, the hourglass standing at the right.
  const hg = hourglass();
  const HW = 660, HH = 560;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: HW, height: HH, padding: 0.24 });
  const bars = g.bars.map(b => `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height + 3)}" rx="2.5" ${isWall(b.datum.minute) ? `fill="${CORAL}" stroke="${INK}" stroke-width="3.5"` : 'fill="var(--context)"'}/>`).join('');
  const band = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const wallStart = g.bars.find(b => isWall(b.datum.minute))!;
  const bar60 = g.bars.find(b => b.datum.minute === 60)!;
  const line60 = g.xScale('60')! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const ticks = [40, 50, 60, 70, 80].map(m => `<text class="lab" x="${n(band(m))}" y="${HH + 50}" text-anchor="${m === 40 ? 'start' : m === 80 ? 'end' : 'middle'}">${m === 80 ? '80 min' : m}</text>`).join('');

  // Context slide: the middle half of all solo 500s against the hour.
  const fl = finishLine();
  const q = w.quartiles;
  const lo = 30, hi = 100, SWD = CW;
  const qs = (m: number) => ((m - lo) / (hi - lo)) * SWD;

  // Takeaway slide.
  const tr = trophy();

  return {
    key: 'wall',
    slides: [
      { id: 'wall-1', body: frame(`${head(w.kicker, 'MSP DATA')}
        <h1 class="h1">The 59-minute wall</h1>
        <p class="dek" style="top:408px; width:820px">${h(w.dek)}</p>
        <svg class="art" width="${TW}" height="${TH + 70}" style="left:${X0}px; top:${GROUND - TH}px" aria-hidden="true">
          ${tBars}
          <line x1="${n(tx60)}" x2="${n(tx60)}" y1="-64" y2="${TH}" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
        </svg>
        <svg class="art" width="200" height="60" style="left:${X0 + n(tx60) + 14}px; top:${GROUND - TH - 92}px"><text class="lab-strong" x="0" y="40">60:00</text></svg>
        ${place(sw, 992 - sw.w + 8)}
        ${foot(c.source)}`) },
      { id: 'wall-2', body: frame(`${head(w.kicker, '2 / 4')}
        <h2 class="h2">${w.mode.minute} minutes is the most common finish. Then the counts drop.</h2>
        <svg class="art" width="${HW}" height="${HH + 70}" style="left:${X0}px; top:${GROUND - HH}px">
          ${bars}
          <line x1="${n(line60)}" x2="${n(line60)}" y1="-40" y2="${HH}" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
          <text class="lab-strong" x="${n(wallStart.x - 14)}" y="${n(modeBar.y - 56)}" text-anchor="end">${w.mode.minute} min</text>
          <text class="lab" x="${n(wallStart.x - 14)}" y="${n(modeBar.y - 16)}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
          <text class="lab-accent" x="${n(line60 + 18)}" y="${n(bar60.y - 28)}">${String(w.dropPct).replace('-', '\u2212')}% at the hour</text>
          ${ticks}
        </svg>
        ${place(hg, 992 - hg.w + 8)}
        ${foot(c.source)}`) },
      { id: 'wall-3', body: frame(`${head(w.kicker, '3 / 4')}
        <h2 class="h2">No step at ${w.noStepAt.join(' or ')} minutes. The hour is the line people race for.</h2>
        <svg class="art" width="${SWD}" height="300" style="left:${X0}px; top:470px">
          <rect x="0" y="122" width="${SWD}" height="20" rx="10" fill="var(--context)"/>
          <rect x="${n(qs(q.p25))}" y="96" width="${n(qs(q.p75) - qs(q.p25))}" height="72" rx="14" fill="url(#w-pale)" stroke="${INK}" stroke-width="5"/>
          <line x1="${n(qs(q.median))}" x2="${n(qs(q.median))}" y1="82" y2="182" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
          <line x1="${n(qs(60))}" x2="${n(qs(60))}" y1="40" y2="226" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
          <text class="lab-strong" x="${n(qs(60))}" y="22" text-anchor="middle">1 hour</text>
          <text class="lab" x="${n(qs(q.p25))}" y="230" text-anchor="middle">${fmtDuration(q.p25)}</text>
          <text class="lab-accent" x="${n(qs(q.median))}" y="282" text-anchor="middle">median ${fmtDuration(q.median)}</text>
          <text class="lab" x="${n(qs(q.p75))}" y="230" text-anchor="middle">${fmtDuration(q.p75)}</text>
        </svg>
        <p class="dek" style="top:820px; width:500px; font-size:38px">The middle half of all solo 500s finish between ${fmtDuration(q.p25)} and ${fmtDuration(q.p75)}.</p>
        ${place(fl, 992 - fl.w + 10)}
        ${foot(c.source)}`) },
      { id: 'wall-4', body: frame(`${head(w.kicker, '4 / 4')}
        <p class="big" style="top:150px">${w.subHour.pct}%</p>
        <h2 class="h2" style="top:460px; width:860px">of 500-piece puzzlers have a personal best under one hour</h2>
        <p class="dek" style="top:690px; width:520px">${fmtInt(w.subHour.under60)} of ${fmtInt(w.subHour.puzzlers)} puzzlers with a solo 500 time</p>
        <p class="q" style="top:930px; width:540px">${h(w.question)}</p>
        ${place(tr, 992 - tr.w + 14)}
        ${foot(c.source)}`) },
    ],
  };
}

function record(c: Content): Post {
  const r = c.record;
  const box = puzzleBox();
  return { key: 'record', slides: [{ id: 'record-1', body: frame(`${head(r.kicker, 'MSP DATA')}
    <p class="big" style="top:150px; font-size:300px">${r.value}</p>
    <h2 class="h2" style="top:480px; width:880px">${h(r.title)}</h2>
    <p class="dek" style="top:716px; width:500px">${h(r.context)}</p>
    <p class="dek" style="top:1010px; width:500px; font-size:32px; color:var(--ink-muted)">${h(r.footnote)}</p>
    ${place(box, 992 - box.w + 14)}
    ${foot(c.source)}`) }] };
}

function countries(c: Content): Post {
  const k = c.countries;
  const pod = podium();
  const rows = rankGeometry(k.top, { value: d => d.medianPb, width: 190, rowHeight: 58, gap: 6, domain: [0, 70] });
  return { key: 'countries', slides: [{ id: 'countries-1', body: frame(`${head('Solo 500 pieces', 'MSP DATA')}
    <h2 class="h2">${h(k.title)}</h2>
    <p class="dek" style="top:300px; font-size:34px; width:860px">${h(k.dek)}</p>
    <div class="rank" style="top:424px">${rows.map((r, i) => `<div class="row ${i === 0 ? 'first' : ''}" style="top:${r.y}px">
      <span class="flag"><img src="${flagUrl(r.datum.code)}" alt=""><i></i></span><span class="name">${h(r.datum.name)}</span><span class="val">${fmtDuration(r.datum.medianPb)}</span><span class="bar" style="width:${n(r.width)}px"></span></div>`).join('')}</div>
    <p class="dek" style="top:1072px; width:640px; font-size:30px; color:var(--ink-muted)">Everyone: ${fmtDuration(k.reference[1].value!)} · United States: ${fmtDuration(k.reference[0].value!)}</p>
    ${place(pod, 992 - pod.w + 12)}
    ${foot(c.source)}`) }] };
}

function share(c: Content): Post {
  const s = c.share;
  const size = 616;
  const grid = pieceGrid({ cols: 10, rows: 10, x: 0, y: 0, width: size, height: size, seed: 21 });
  const colour: Record<string, string> = { '500': CORAL, 'under 500': 'var(--indigo-200)', '1000': 'var(--sky-300)', other: 'var(--ink)' };
  const units = assignUnits(grid, s.units.map(u => ({ key: u.key, units: u.units })));
  const st = boxStack();
  return { key: 'share', slides: [{ id: 'share-1', body: frame(`${head('Puzzle sizes', 'MSP DATA')}
    <h2 class="h2">${h(s.title)}</h2>
    <div class="legend">
      ${s.units.map(u => `<span><i class="sw" style="background:${colour[u.key]}"></i><b>${u.pct}%</b> ${h(s.labels[u.key])}</span>`).join('')}
    </div>
    <svg class="art" width="${size}" height="${size}" viewBox="-3 -3 ${size + 6} ${size + 6}" style="left:${X0}px; top:${GROUND - size}px">
      ${units.map(u => `<path d="${u.piece.d}" fill="${colour[u.key]}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`).join('')}
    </svg>
    ${place(st, 992 - st.w + 10)}
    ${foot(`Each piece = 1% of ${fmtInt(c.totals.results)} results · ${c.asOf}`)}`) }] };
}

function xp(c: Content): Post {
  const x = c.xp;
  // A 5×5 jigsaw with the middle 3×3 lifted out: an interlocking frame of generator pieces around the medallion.
  const S = 144, N = 5, side = S * N, ox = (1080 - side) / 2, oy = 134;
  const jig = generateJigsaw({ cols: N, rows: N, width: side, height: side, seed: 5, tabSize: 0.22, jitter: 0.03 });
  const ring = jig.pieces.filter(p => p.col === 0 || p.row === 0 || p.col === N - 1 || p.row === N - 1);
  const tint = (p: { col: number; row: number }) => ((p.col + p.row) % 2 === 0 ? 'url(#w-skyp)' : 'url(#w-lavp)');
  const med = medallion(160);
  const mx = ox + side / 2 - med.cx, my = oy + side / 2 - med.cy - 22;
  return { key: 'xp', slides: [{ id: 'xp-1', body: frame(`${head(x.kicker, 'MSP DATA')}
    <svg class="art" width="${side}" height="${side}" viewBox="-8 -8 ${side + 16} ${side + 16}" style="left:${ox - 8}px; top:${oy - 8}px" aria-hidden="true">
      ${ring.map(p => `<path d="${p.d}" fill="${tint(p)}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`).join('')}
    </svg>
    <svg class="art" width="${med.w}" height="${med.h}" style="left:${mx}px; top:${my}px" aria-hidden="true">${med.svg}</svg>
    <div style="position:absolute; left:${mx + med.cx - med.plate}px; top:${my + med.cy - med.plate}px; width:${med.plate * 2}px; height:${med.plate * 2}px; display:flex; flex-direction:column; align-items:center; justify-content:center">
      <p style="font-size:30px; font-weight:700; letter-spacing:6px; color:var(--ink-soft); margin-left:6px">LEVEL</p>
      <p style="font-size:128px; font-weight:700; line-height:0.92; letter-spacing:-4px">${x.level}</p>
    </div>
    <h2 class="h2" style="top:${oy + side + 40}px; text-align:center">${h(x.title)}</h2>
    <p class="dek" style="top:${oy + side + 118}px; text-align:center">${h(x.dek)}</p>
    <p class="dek" style="top:${oy + side + 180}px; text-align:center; font-size:32px; color:var(--ink-muted)">${h(x.context)}</p>
    ${foot(c.source)}`) }] };
}

// ══ Round 2: weekly, event, feature and month posts. New objects follow the same kit: one ink at SW,
// details at DET, same-hue two-stop washes lit top-left, rim + glint, bevel shade, no numbers in the art. ══

/** Closed scallop outline (k bulges between points on the inner radius), as the level medallion uses. */
function scallop(cx: number, cy: number, R: number, k = 12, inner = 0.86) {
  const rIn = R * inner;
  let d = '';
  for (let i = 0; i < k; i++) {
    const a0 = -90 + (360 / k) * i, a1 = a0 + 360 / k;
    const [x0, y0] = P(cx, cy, rIn, a0), [x1, y1] = P(cx, cy, rIn, a1);
    const chord = Math.hypot(x1 - x0, y1 - y0), sag = R - rIn * Math.cos(rad(180 / k));
    const r0 = (chord * chord / 4 + sag * sag) / (2 * sag);
    d += `${i === 0 ? `M${x0} ${y0}` : ''}A${n(r0)} ${n(r0)} 0 0 1 ${x1} ${y1}`;
  }
  return { d: d + 'Z', rIn };
}

/** Desk calendar on a lavender foot. 'week' marks one row of seven days; 'month' fills the month. */
function calendar(variant: 'week' | 'month'): Art {
  const W = 372, x = 22, w = W - 44, top = 36, bandH = 66, r = 20;
  const cols = 7, rows = 5, cell = 30, gap = 8;
  const gridW = cols * cell + (cols - 1) * gap;
  const gx = x + (w - gridW) / 2, gy = top + bandH + 30;
  const pageH = bandH + 30 + rows * cell + (rows - 1) * gap + 34;
  const footH = 36, footY = top + pageH - 12, base = footY + footH;
  const s: string[] = [];
  s.push(fill(rr(x, top, w, pageH, r), 'face'));
  // Header band with the rounded top corners of the page.
  s.push(`<path d="M${x + r} ${top}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${top + r}V${top + bandH}H${x}V${top + r}A${r} ${r} 0 0 1 ${x + r} ${top}Z" fill="url(#w-coral)"/>`);
  s.push(rim(`M${x + IN} ${top + bandH - 10}V${top + r}A${n(r - IN)} ${n(r - IN)} 0 0 1 ${x + r} ${top + IN}H${n(x + w * 0.36)}`));
  s.push(shade(`M${x + w - IN} ${top + r + 6}V${top + bandH - IN + 2}`, 'coral'));
  const weekRow = 1;
  if (variant === 'week') {
    const ry = gy + weekRow * (cell + gap);
    s.push(fill(rr(gx - 12, ry - 12, gridW + 24, cell + 24, 14), 'pale') + ink(rr(gx - 12, ry - 12, gridW + 24, cell + 24, 14), DET));
  }
  for (let i = 0; i < rows * cols; i++) {
    const c = i % cols, ri = Math.floor(i / cols);
    const on = variant === 'week' ? ri === weekRow : i < 30;
    s.push(`<path d="${rr(gx + c * (cell + gap), gy + ri * (cell + gap), cell, cell, 8)}" fill="${on ? 'url(#w-coral)' : 'url(#w-skyp)'}"/>`);
  }
  s.push(rrLight(x, top, w, pageH, r, 'face', { rim: false }));
  s.push(ink(rr(x, top, w, pageH, r)) + ink(`M${x} ${top + bandH}H${x + w}`));
  // Binding rings across the top edge.
  for (const f of [0.22, 0.5, 0.78]) {
    const rx = x + w * f;
    s.push(fill(rr(rx - 12, top - 26, 24, 54, 12), 'sky') + ink(rr(rx - 12, top - 26, 24, 54, 12)));
  }
  s.push(fill(rr(4, footY, W - 8, footH, 14), 'lav') + rrLight(4, footY, W - 8, footH, 14, 'lav', { glint: false }) + ink(rr(4, footY, W - 8, footH, 14)));
  return art(W, base + SW, base, s.join(''));
}

/** Chequered flag on a pole: the cells follow the wave of the cloth. */
function chequeredFlag(): Art {
  const W = 330, poleX = 40, poleW = 26, top = 46, footH = 42, base = 262;
  const fx0 = poleX + poleW - 2, fx1 = W - 16, fy = top + 14, FH = 128, A = 12, FW = fx1 - fx0;
  const wave = (xx: number) => A * Math.sin(((xx - fx0) / FW) * Math.PI * 1.9);
  const edge = (yOff: number, xa: number, xb: number, k: number) =>
    Array.from({ length: k + 1 }, (_, i) => { const xx = xa + ((xb - xa) * i) / k; return `${n(xx)} ${n(fy + yOff + wave(xx))}`; });
  const cloth = `M${[...edge(0, fx0, fx1, 40), ...edge(FH, fx1, fx0, 40)].join('L')}Z`;
  const cc = 6, cr = 4, cw = FW / cc, ch = FH / cr; // ~40 px cells
  const cells: string[] = [];
  for (let j = 0; j < cr; j++) for (let i = 0; i < cc; i++) if ((i + j) % 2 === 0) {
    cells.push(`M${[...edge(j * ch, fx0 + i * cw, fx0 + (i + 1) * cw, 8), ...edge((j + 1) * ch, fx0 + (i + 1) * cw, fx0 + i * cw, 8)].join('L')}Z`);
  }
  const poleH = base - footH - top + 12;
  const s = [
    fill(rr(poleX, top, poleW, poleH, 12), 'sky') + rrLight(poleX, top, poleW, poleH, 12, 'sky', { glint: false }) + ink(rr(poleX, top, poleW, poleH, 12)),
    `<path d="${cloth}" fill="#fff"/>`,
    `<path d="${cells.join('')}" fill="${INK}"/>`,
    rim(`M${fx0 + 14} ${n(fy + IN + wave(fx0 + 14))}${edge(IN, fx0 + 14, fx0 + FW * 0.24, 8).map(p => 'L' + p).join('')}`).replace('stroke="#fff"', `stroke="${WASH.sky[0]}"`),
    ink(cloth),
    fill(circ(poleX + poleW / 2, top - 20, 22), 'coral') + rim(arc(poleX + poleW / 2, top - 20, 22 - IN, 200, 250)) + ink(circ(poleX + poleW / 2, top - 20, 22)),
    fill(rr(poleX + poleW / 2 - 74, base - footH, 148, footH, 16), 'lav') + rrLight(poleX + poleW / 2 - 74, base - footH, 148, footH, 16, 'lav') + ink(rr(poleX + poleW / 2 - 74, base - footH, 148, footH, 16)),
  ];
  return art(W, base + SW, base, s.join(''));
}

/** A-frame sign board, the kind that stands outside a venue: trapezoid board whose side rails run on to the
 *  ground as legs, a coral header strip, a piece and two lines of "text" (no words). */
function easelSign(): Art {
  const W = 340, cx = 170, by = 34, bh = 330, tw = 112, bw = 146, base = 444, lw = 24;
  const sl = (bw - tw) / bh; // outward slope of the rails per px
  const s: string[] = [];
  // Legs: the rails continue below the board along the same slope.
  for (const dir of [-1, 1] as const) {
    const x1 = cx + dir * (bw - 12), y1 = by + bh - 30, x2 = cx + dir * (bw - 12 + sl * (base - y1));
    const L = Math.hypot(x2 - x1, base - y1), ang = (-Math.asin((x2 - x1) / L) * 180) / Math.PI;
    s.push(`<g transform="translate(${n(x1)} ${y1}) rotate(${n(ang)})">${fill(rr(-lw / 2, 0, lw, n(L), 11), 'sky')}${ink(rr(-lw / 2, 0, lw, n(L), 11))}</g>`);
  }
  const trap = (inset: number, y0: number, y1: number) => {
    const at = (y: number) => tw + (bw - tw) * ((y - by) / bh) - inset;
    return `M${n(cx - at(y0))} ${y0}H${n(cx + at(y0))}L${n(cx + at(y1))} ${y1}H${n(cx - at(y1))}Z`;
  };
  const board = trap(0, by, by + bh);
  s.push(fill(board, 'sky'));
  s.push(rim(`M${n(cx - tw + IN + 2)} ${by + 90}L${n(cx - tw + IN)} ${by + IN}H${n(cx - 20)}`) + glint(cx + 6, by + IN));
  s.push(shade(`M${n(cx + bw - IN - 2 - sl * 120)} ${by + bh - 120}L${n(cx + bw - IN - 2)} ${by + bh - IN}H${n(cx + 30)}`, 'sky'));
  const p0 = by + 30, p1 = by + bh - 30, hdr = p0 + 56;
  s.push(fill(trap(30, p0, p1), 'face'));
  s.push(`<path d="${trap(30, p0, hdr)}" fill="url(#w-coral)"/>` + ink(`M${n(cx - (tw + (bw - tw) * ((hdr - by) / bh) - 30))} ${hdr}H${n(cx + (tw + (bw - tw) * ((hdr - by) / bh) - 30))}`, DET));
  s.push(piece(cx, hdr + 92, 66, 33, 'coral', { rot: -6 }));
  s.push(ink(`M${cx - 70} ${p1 - 66}H${cx + 70}`, DET) + ink(`M${cx - 44} ${p1 - 32}H${cx + 44}`, DET));
  s.push(ink(trap(30, p0, p1), DET) + ink(board));
  return art(W, base + SW, base, s.join(''));
}

/** Open logbook: log lines with piece bullets on the left page, a level seal on the right, a bookmark. */
function logbook(): Art {
  const W = 520, cx = 260, pw = 214, yT = 64, dip = 24, yB = 312, stack = 16;
  const x0 = cx - pw;
  const page = (side: -1 | 1, dy = 0) => {
    const xo = cx + side * pw;
    return `M${cx} ${yT + dip + dy}C${cx + side * 70} ${yT - 2 + dy} ${xo - side * 70} ${yT - 8 + dy} ${xo} ${yT + dy}V${yB + dy}C${xo - side * 70} ${yB - 8 + dy} ${cx + side * 70} ${yB - 2 + dy} ${cx} ${yB + dip + dy}Z`;
  };
  const cy0 = yT + 34, base = yB + dip + stack + 24;
  const cover = [x0 - 24, cy0, 2 * pw + 48, base - cy0, 20] as const;
  const s: string[] = [];
  s.push(fill(rr(...cover), 'coral') + rrLight(...cover, 'coral', { glint: false }) + ink(rr(...cover)));
  // Bookmark peeking out of the top, behind the pages.
  const bm = cx + 46;
  s.push(fill(`M${bm} ${yT + 40}V${yT - 44}L${bm + 17} ${yT - 30}L${bm + 34} ${yT - 44}V${yT + 40}Z`, 'lav') + ink(`M${bm} ${yT + 40}V${yT - 44}L${bm + 17} ${yT - 30}L${bm + 34} ${yT - 44}V${yT + 40}Z`));
  for (const side of [-1, 1] as const) s.push(fill(page(side, stack), 'face') + ink(page(side, stack)));
  for (const side of [-1, 1] as const) s.push(fill(page(side), 'face'));
  // Left page: four log lines with generator-piece bullets.
  [0, 1, 2].forEach(k => {
    const y = yT + 84 + k * 68;
    s.push(piece(x0 + 58, y, 34, [4, 7, 33][k], k === 2 ? 'skyp' : 'coral', { stroke: DET, rot: [0, 90, 180][k] }));
    s.push(ink(`M${x0 + 100} ${y}H${cx - 34 - (k % 2) * 44}`, DET));
  });
  // Right page: the level seal and two lines.
  const sc = scallop(cx + pw / 2 + 4, yT + 122, 62);
  s.push(fill(sc.d, 'coral') + rim(arc(cx + pw / 2 + 4, yT + 122, sc.rIn - IN * 0.6, 198, 244)) + shade(arc(cx + pw / 2 + 4, yT + 122, sc.rIn - IN * 0.6, 20, 100), 'coral'));
  s.push(`<circle cx="${cx + pw / 2 + 4}" cy="${yT + 122}" r="${n(62 * 0.62)}" fill="#fff"/>` + ink(sc.d));
  s.push(piece(cx + pw / 2 + 4, yT + 122, 32, 4, 'sky', { stroke: DET, rot: 0 }));
  s.push(ink(`M${cx + pw / 2 - 60} ${yT + 226}H${cx + pw / 2 + 68}`, DET) + ink(`M${cx + pw / 2 - 40} ${yT + 262}H${cx + pw / 2 + 48}`, DET));
  for (const side of [-1, 1] as const) s.push(ink(page(side)));
  s.push(ink(`M${cx} ${yT + dip}V${yB + dip + stack}`));
  return art(W, base + SW, base, s.join(''));
}

/** Three old logbooks stacked spine-out: end bands and a label plate on each spine. */
function bookStack(): Art {
  const W = 330, base = 318;
  const books: Array<{ x: number; w: number; hh: number; wash: Wash }> = [
    { x: 12, w: 300, hh: 74, wash: 'sky' },
    { x: 34, w: 270, hh: 64, wash: 'coral' },
    { x: 20, w: 286, hh: 68, wash: 'lav' },
  ];
  const s: string[] = [];
  let y = base;
  for (const b of books) {
    y -= b.hh;
    s.push(fill(rr(b.x, y, b.w, b.hh, 14), b.wash) + rrLight(b.x, y, b.w, b.hh, 14, b.wash, { glint: false }));
    const pw = b.w * 0.36, ph = b.hh * 0.42;
    s.push(`<path d="${rr(b.x + (b.w - pw) / 2, y + (b.hh - ph) / 2, pw, ph, 8)}" fill="#fff"/>` + ink(rr(b.x + (b.w - pw) / 2, y + (b.hh - ph) / 2, pw, ph, 8), DET));
    for (const f of [0.13, 0.87]) s.push(ink(`M${n(b.x + b.w * f)} ${y + 4}V${y + b.hh - 4}`, DET));
    s.push(ink(rr(b.x, y, b.w, b.hh, 14)));
  }
  s.unshift(piece(220, y - 40, 66, 7, 'coral', { rot: 14 }));
  return art(W, base + SW, base, s.join(''));
}

// ── Round-2 helpers ───────────────────────────────────────────────────────────────────────────────────
const flagDisc = (code: string, size: number) =>
  code ? `<span class="fl" style="width:${size}px; height:${size}px"><img src="${flagUrl(code)}" alt=""><i></i></span>` : '';
const dayLabel = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthLabel = (ym: string, o: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }) =>
  new Date(ym + '-01T00:00:00Z').toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** Consecutive results by one player on one puzzle collapse into one entry ("also 17:59 and 18:10"). */
function groupRuns<T extends { player: string; puzzle: string; time: string }>(list: T[]) {
  const out: Array<T & { more: string[] }> = [];
  for (const r of list) {
    const last = out.at(-1);
    if (last && last.player === r.player && last.puzzle === r.puzzle) last.more.push(r.time);
    else out.push({ ...r, more: [] });
  }
  return out;
}

const css2 = `
.hd .kick.series { color: var(--ink); font-weight: 700; }
.fl { position: relative; flex: none; display: inline-block; }
.fl img { width: 100%; height: 100%; display: block; }
.fl i { position: absolute; inset: -2px; border: 4px solid var(--ink); border-radius: 50%; }
.up { font-weight: 700; color: var(--indigo-500); }
.tp { position: absolute; left: ${X0}px; width: 640px; }
.tp .r { position: absolute; left: 0; width: 640px; height: 104px; }
.tp .k { position: absolute; left: 0; top: 0; width: 44px; font-size: 36px; font-weight: 700; color: var(--ink-muted); }
.tp .nm { position: absolute; left: 56px; top: 0; font-size: 36px; font-weight: 700; white-space: nowrap; }
.tp .br { font-size: 30px; font-weight: 400; color: var(--ink-soft); margin-left: 14px; }
.tp .bar { position: absolute; left: 56px; top: 56px; height: 30px; border-radius: 0 6px 6px 0; background: var(--context); }
.tp .r.first .bar { background: ${CORAL}; outline: 4px solid var(--ink); outline-offset: -2px; border-radius: 0 8px 8px 0; }
.tp .v { position: absolute; top: 48px; font-size: 36px; font-weight: 700; white-space: nowrap; }
.tp .v span { font-weight: 400; color: var(--ink-soft); }
.fc { position: absolute; top: 262px; width: 440px; }
.fc .sec { display: inline-block; font-size: 30px; font-weight: 700; padding: 2px 18px; border: 4px solid var(--ink); border-radius: 999px; background: var(--sky-100); }
.fc .who { display: flex; align-items: center; gap: 16px; margin-top: 30px; font-size: 44px; font-weight: 700; line-height: 1.1; }
.fc .hdl { font-size: 32px; font-weight: 500; color: var(--indigo-500); margin-top: 6px; }
.fc .time { position: relative; isolation: isolate; display: inline-block; margin-top: 14px; font-size: 108px; font-weight: 700; line-height: 1; letter-spacing: -4px; }
.fc .time::after { content: ''; position: absolute; left: -6px; right: -10px; bottom: 2px; height: 26px; z-index: -1; background: ${CORAL}; border-radius: 8px; }
.fc .what { font-size: 34px; line-height: 1.25; font-weight: 500; margin-top: 22px; }
.fc .what .brand { font-size: 30px; font-weight: 400; color: var(--ink-soft); }
.fc .tags { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.fc .pill { font-size: 30px; font-weight: 700; padding: 2px 16px; border: 3px solid var(--ink); border-radius: 999px; background: var(--coral-100); }
.fc .also { font-size: 32px; color: var(--ink-soft); }
.fc .ru { margin-top: 30px; }
.fc .ru > div { display: flex; align-items: center; gap: 14px; min-height: 66px; border-top: 3px solid var(--line); }
.fc .rk { width: 26px; font-size: 32px; font-weight: 700; color: var(--ink-muted); }
.fc .rn { flex: 1 1 0; min-width: 0; font-size: 34px; font-weight: 500; line-height: 1.15; }
.fc .rn em { display: block; font-style: normal; font-size: 30px; color: var(--indigo-500); }
.fc .rt { flex: none; font-size: 32px; font-weight: 700; }
.stat { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; flex-direction: column; }
.stat > div { display: flex; align-items: baseline; gap: 22px; padding: 22px 0; border-top: 3px solid var(--line); }
.stat b { font-size: 72px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; }
.stat span { font-size: 38px; color: var(--ink-soft); }
.stat .pill { align-self: center; font-size: 30px; font-weight: 700; padding: 2px 16px; border: 3px solid var(--ink); border-radius: 999px; background: var(--coral-100); color: var(--ink); }
.nw { white-space: nowrap; }
.halo { paint-order: stroke; stroke: #fff; stroke-width: 10px; stroke-linejoin: round; }
`;

function weekly(c: Content): Post {
  const w = c.weekly, total = 4;
  const ep = `Season ${w.season} · Episode ${w.episode}`;
  const hd = (no: string) => `${DEFS}<header class="hd"><span class="kick series">${h(w.series)}</span><span class="no">${h(no)}</span></header>`;

  const cal = calendar('week');
  const stack = boxStack();
  const flag = chequeredFlag();
  const box = puzzleBox();

  const top = w.topPuzzles;
  const rows = rankGeometry(top, { value: d => d.solvers, width: 480, rowHeight: 104, gap: 12, domain: [0, Math.max(...top.map(t => t.solvers))] });

  const col = (label: string, list: typeof w.fastest500) => {
    const [win, ...rest] = groupRuns(list);
    if (!win) return `<p class="sec">${h(label)}</p><p class="what">No results this week</p>`;
    return `<p class="sec">${h(label)}</p>
      <p class="who">${flagDisc(win.country, 56)}<span>${h(win.player)}</span></p>
      ${win.handle ? `<p class="hdl">@${h(win.handle)}</p>` : ''}
      <p class="time">${win.time}</p>
      <p class="what">${h(win.puzzle)}<br><span class="brand">${h(win.brand)}</span></p>
      ${win.firstAttempt || win.more.length ? `<p class="tags">${win.firstAttempt ? '<span class="pill">First try</span>' : ''}${win.more.length ? `<span class="also">also ${andList(win.more)}</span>` : ''}</p>` : ''}
      ${rest.length ? `<div class="ru">${rest.map((r, i) => `<div><span class="rk">${i + 2}</span>${flagDisc(r.country, 40)}<span class="rn">${h(r.player)}${r.handle ? `<em>@${h(r.handle)}</em>` : ''}</span><span class="rt">${r.time}</span></div>`).join('')}</div>` : ''}`;
  };

  return {
    key: 'weekly',
    slides: [
      { id: 'weekly-1', body: frame(`${DEFS}<header class="hd"><span class="kick">${h(ep)}</span><span class="no">MSP DATA</span></header>
        <h1 class="h1">${h(w.series)}</h1>
        <p class="dek" style="top:390px">${h(w.range)}</p>
        <p class="big" style="top:500px; font-size:250px">${fmtInt(w.results)}</p>
        <p class="dek" style="top:780px; width:500px">results logged by ${fmtInt(w.puzzlers)} puzzlers, <span class="up">${fmtSignedPct(w.resultsChangePct)}</span> on the week before</p>
        ${place(cal, 992 - cal.w + 14)}
        ${foot(c.source)}`) },
      { id: 'weekly-2', body: frame(`${hd(`2 / ${total}`)}
        <h2 class="h2">${h(top[0].puzzle)} was the most-solved puzzle</h2>
        <p class="dek" style="top:300px; font-size:34px">Puzzlers who logged each puzzle, ${h(w.range)}</p>
        <div class="tp" style="top:400px">${rows.map((r, i) => `<div class="r ${i === 0 ? 'first' : ''}" style="top:${r.y}px">
          <span class="k">${i + 1}</span><span class="nm">${h(r.datum.puzzle)}<span class="br">${h(r.datum.brand)}</span></span>
          <span class="bar" style="width:${n(r.width)}px"></span><span class="v" style="left:${n(56 + r.width + 18)}px">${fmtInt(r.datum.solvers)}${i === 0 ? ' <span>puzzlers</span>' : ''}</span></div>`).join('')}</div>
        ${place(stack, 992 - stack.w + 10)}
        ${foot(c.source)}`) },
      { id: 'weekly-3', body: frame(`${hd(`3 / ${total}`)}
        <h2 class="h2">Fastest of the week</h2>
        <div class="fc" style="left:${X0}px">${col('Solo 500', w.fastest500)}</div>
        <div class="fc" style="left:${X0 + 464}px">${col('Solo 1,000', w.fastest1000)}</div>
        ${place(flag, 992 - flag.w + 14)}
        ${foot(c.source)}`) },
      { id: 'weekly-4', body: frame(`${hd(`4 / ${total}`)}
        <p class="big" style="top:150px">${fmtInt(w.personalBests)}</p>
        <h2 class="h2" style="top:460px; width:860px">personal bests set last week</h2>
        <p class="dek" style="top:640px; width:580px">${fmtInt(w.newPuzzlers)} new puzzlers joined in, and together you placed ${fmtInt(w.pieces)} pieces.</p>
        <p class="q" style="top:900px; width:540px">${h(w.question)}</p>
        ${place(box, 992 - box.w + 14)}
        ${foot(c.source)}`) },
    ],
  };
}

function event(c: Content): Post {
  const e = c.event;
  const sign = easelSign(), hg = hourglass();
  const slides = [
    { id: 'event-1', body: frame(`${head('Event preview', 'MSP DATA')}
      <h2 class="h2" style="width:860px">${h(e.name)}</h2>
      <p class="dek" style="top:310px"><b style="color:var(--ink)">${h(e.date)}</b> · ${h(e.location)}</p>
      <p class="big" style="top:440px">${fmtInt(e.registered)}</p>
      <p class="dek" style="top:740px; width:520px">puzzlers registered. ${fmtInt(e.onMsp)} of them already log their times on MySpeedPuzzling.</p>
      ${place(sign, 992 - sign.w + 10)}
      ${foot(c.source)}`) },
  ];
  if (e.usMedianPb) slides.push({ id: 'event-2', body: frame(`${head('Event preview', '2 / 2')}
      <h2 class="h2" style="width:860px">A typical US personal best on a 500</h2>
      <p class="big" style="top:300px; font-size:220px">${e.usMedianPb}</p>
      <p class="dek" style="top:560px; width:600px">Median solo 500 personal best of the ${fmtInt(e.usPuzzlers ?? 0)} US puzzlers on MySpeedPuzzling</p>
      <p class="q" style="top:900px; width:560px">${h(e.question)}</p>
      ${place(hg, 992 - hg.w + 8)}
      ${foot(c.source)}`) });
  return { key: 'event', slides };
}

function feature(c: Content): Post {
  const f = c.feature;
  const book = logbook(), books = bookStack();
  const launch = f.days.reduce((a, b) => (b.results > a.results ? b : a));
  const days = f.days.filter(d => d.day <= launch.day);
  const GW = 540, GH = 650;
  const g = barGeometry(days, { x: d => d.day, y: d => d.results, width: GW, height: GH, padding: 0.24 });
  const lb = g.bars.find(b => b.datum.day === launch.day)!;
  const split = g.yScale(launch.results - launch.backfilled);
  const bars = g.bars.map(b => b.datum.day === launch.day
    ? `<rect x="${n(b.x)}" y="${n(split)}" width="${n(b.width)}" height="${n(GH - split + 3)}" fill="var(--context)"/>
       <rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(split - b.y)}" fill="${CORAL}"/>
       <rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(GH - b.y + 3)}" rx="4" fill="none" stroke="${INK}" stroke-width="4"/>`
    : `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height + 3)}" rx="3" fill="var(--context)"/>`).join('');
  const typ = g.yScale(f.typicalDay);
  const cxb = (b: { x: number; width: number }) => b.x + b.width / 2;
  return {
    key: 'feature',
    slides: [
      { id: 'feature-1', body: frame(`${head(f.kicker, 'MSP DATA')}
        <h2 class="h2" style="width:820px">${h(f.title)}</h2>
        <p class="big" style="top:330px; font-size:250px">${fmtInt(f.results)}</p>
        <p class="dek" style="top:610px; width:640px">results logged on <span class="nw">${h(f.launchDate)}</span>,<br><span class="up">${f.multiple}×</span> a typical day</p>
        ${place(book, 992 - book.w + 16)}
        ${foot(c.source)}`) },
      { id: 'feature-2', body: frame(`${head(f.kicker, '2 / 2')}
        <h2 class="h2" style="width:880px">${f.backfilledPct}% of them were puzzles solved before that day</h2>
        <p class="dek" style="top:310px; font-size:36px">${h(f.dek)}</p>
        <svg class="art" width="${GW}" height="${GH + 70}" style="left:${X0}px; top:${GROUND - GH}px">
          ${bars}
          <line x1="0" x2="${n(lb.x - 10)}" y1="${n(typ)}" y2="${n(typ)}" stroke="${INK}" stroke-width="4" stroke-dasharray="10 9"/>
          <text class="lab" x="0" y="${n(typ - 56)}" style="font-size:32px">typical day</text>
          <text class="lab-strong" x="0" y="${n(typ - 16)}" style="font-size:34px">${fmtInt(f.typicalDay)}</text>
          <text class="lab-strong" x="${n(cxb(lb))}" y="${n(lb.y - 18)}" text-anchor="middle">${fmtInt(launch.results)}</text>
          <text class="lab-accent" x="${n(lb.x - 18)}" y="${n((lb.y + split) / 2 + 2)}" text-anchor="end">${fmtInt(launch.backfilled)} solved earlier</text>
          <text class="lab" x="0" y="${GH + 50}">${dayLabel(days[0].day)}</text>
          <text class="lab" x="${n(lb.x + lb.width)}" y="${GH + 50}" text-anchor="end">${dayLabel(launch.day)}</text>
        </svg>
        ${place(books, 992 - books.w + 10)}
        ${foot(c.source)}`) },
    ],
  };
}

function month(c: Content): Post {
  const m = c.month;
  const cal = calendar('month'), pod = podium(), tr = trophy();
  const cur = m.series.at(-1)!;
  const [yy, mm] = cur.month.split('-');
  const prevKey = `${Number(yy) - 1}-${mm}`;
  const prev = m.series.find(x => x.month === prevKey);
  const GW = 620, GH = 650;
  const g = barGeometry(m.series, { x: d => d.month, y: d => d.results, width: GW, height: GH, padding: 0.24 });
  const bars = g.bars.map(b => {
    const isCur = b.datum.month === cur.month, isPrev = b.datum.month === prevKey;
    return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.width)}" height="${n(b.height + 3)}" rx="3" ${isCur ? `fill="${CORAL}" stroke="${INK}" stroke-width="4"` : isPrev ? `fill="url(#w-sky)" stroke="${INK}" stroke-width="4"` : 'fill="var(--context)"'}/>`;
  }).join('');
  const bc = g.bars.at(-1)!, bp = g.bars.find(b => b.datum.month === prevKey);
  const metrics = [
    { key: 'active' as const, label: 'puzzlers logged a result', value: m.active },
    { key: 'newPlayers' as const, label: 'new puzzlers', value: m.newPlayers },
    { key: 'pieces' as const, label: 'pieces', value: m.pieces },
  ];
  const isRecord = (k: 'active' | 'newPlayers' | 'pieces') => m.series.every(x => x[k] <= cur[k]);
  const allRecords = metrics.every(x => isRecord(x.key));
  const name = monthLabel(cur.month, { month: 'long' });
  return {
    key: 'month',
    slides: [
      { id: 'month-1', body: frame(`${head(m.label, 'MSP DATA')}
        <h2 class="h2" style="width:820px">${h(m.title)}</h2>
        <p class="big" style="top:330px; font-size:240px">${fmtInt(m.results)}</p>
        <p class="dek" style="top:610px; width:500px">results logged in ${h(m.label)}</p>
        ${place(cal, 992 - cal.w + 14)}
        ${foot(c.source)}`) },
      { id: 'month-2', body: frame(`${head(m.label, '2 / 3')}
        <h2 class="h2" style="width:880px">${fmtSignedPct(m.vsLastYearPct, 0)} on ${h(name)} last year</h2>
        <p class="dek" style="top:304px; font-size:36px">Results logged per month since ${h(monthLabel(m.series[0].month, { month: 'long', year: 'numeric' }))}</p>
        <svg class="art" width="${GW}" height="${GH + 70}" style="left:${X0}px; top:${GROUND - GH}px">
          ${bars}
          <text class="lab-strong" x="${n(bc.x + bc.width)}" y="${n(bc.y - 18)}" text-anchor="end">${fmtInt(cur.results)}</text>
          ${bp && prev ? `<text class="lab halo" x="${n(bp.x + bp.width / 2)}" y="${n(bp.y - 18)}" text-anchor="middle">${fmtInt(prev.results)}</text>` : ''}
          ${bp ? `<text class="lab" x="${n(bp.x + bp.width / 2)}" y="${GH + 50}" text-anchor="middle">${monthLabel(prevKey)}</text>` : ''}
          <text class="lab" x="${n(bc.x + bc.width)}" y="${GH + 50}" text-anchor="end">${monthLabel(cur.month)}</text>
        </svg>
        ${place(pod, 992 - pod.w + 12)}
        ${foot(c.source)}`) },
      { id: 'month-3', body: frame(`${head(m.label, '3 / 3')}
        <h2 class="h2" style="width:880px">${allRecords ? 'Records across the board' : `More of you than ever in ${h(name)}`}</h2>
        <div class="stat" style="top:290px">${metrics.map(x => `<div><b>${fmtInt(x.value)}</b><span>${h(x.label)}</span>${isRecord(x.key) ? '<em class="pill" style="font-style:normal">Record</em>' : ''}</div>`).join('')}</div>
        <p class="q" style="top:900px; width:540px">${h(m.question)}</p>
        ${place(tr, 992 - tr.w + 14)}
        ${foot(c.source)}`) },
    ],
  };
}

const direction: Direction = {
  id: 'D7',
  name: 'House Illustrated',
  idea: 'White pages where one hand-drawn object in the MSP badge style (one navy ink, same-hue washes, lit top-left) stands on the same navy ground line as the chart; the drawing never carries data.',
  css: css + css2,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
