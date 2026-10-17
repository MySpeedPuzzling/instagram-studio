// AD1 · a quiet Christmas layer for the Advent doors (owner 2026-10-17: "slightly christmas theme … lights, snow …
// something really decent but differentiate it from others"). House rules hold: no clip art, no green, only generator
// pieces; decoration never carries text and stays out of the text column's way.
//   garland()  a fairy-light string across the header rule: a sagging wire with bulbs that are small generator puzzle
//              pieces (coral, white, sky), each with a soft glow;
//   snowfall() sparse flakes (dots of a few sizes), dense near the top and fading out by mid-frame;
//   snowCap()  a thin snow layer resting on the top edge of the Advent jigsaw, with a few rounded drips;
//   snowDrift() a soft drift in the bottom bleed band (y > 1720, decoration only: hidden on 16:9 phones anyway).
import { singlePiece } from '../../src/design/svg.ts';
import { W, f1 } from '../../src/design/house.ts';

const SNOW = '#f3f6fa';
const BULBS = ['#ec726f', '#ffffff', '#69b3fe'];

/** Deterministic PRNG (mulberry32) so every render of a door is identical. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Wire y at x for a string hung from (x0, y0) to (x1, y0) with `sag` px of slack in the middle. */
const wireY = (x: number, x0: number, x1: number, y0: number, sag: number) => y0 + sag * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);

/**
 * Fairy lights hanging from the header rule (replaces the rule: render the frame with `noRule`). `top` is the wire's
 * anchor height, `count` bulbs evenly spaced; every bulb is a generator piece (~30 px) hanging point-down from a cap.
 */
export function garland(o: { top: number; sag?: number; count?: number; seed?: number; x0?: number; x1?: number }): string {
  const sag = o.sag ?? 22, n = o.count ?? 15, x0 = o.x0 ?? -10, x1 = o.x1 ?? W + 10;
  const r = rng(o.seed ?? 7);
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 12) pts.push(`${f1(x)},${f1(wireY(x, x0, x1, o.top, sag))}`);
  const bulbs = Array.from({ length: n }, (_, i) => {
    const x = 60 + ((W - 120) * (i + 0.5)) / n;
    const y = wireY(x, x0, x1, o.top, sag);
    const p = singlePiece(60, 11 + i * 7);
    const [vx, vy, vw, vh] = p.viewBox.split(' ').map(Number);
    const s = 38 / Math.max(vw, vh);
    const col = BULBS[i % BULBS.length];
    const tilt = (r() - 0.5) * 22;
    const glow = col === '#ffffff' ? 0.30 : 0.42;
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(tilt)})">
      <circle cx="0" cy="30" r="30" fill="${col}" opacity="${glow}" filter="url(#fx-glow)"/>
      <rect x="-5" y="-2" width="10" height="9" rx="2" fill="#5a6479"/>
      <g transform="translate(0 7) scale(${Math.round(s * 100) / 100}) translate(${f1(-vx - vw / 2)} ${f1(-vy)})"><path d="${p.d}" fill="${col}"/></g>
    </g>`;
  }).join('');
  return `<svg width="${W}" height="${o.top + sag + 90}" viewBox="0 0 ${W} ${o.top + sag + 90}" style="position:absolute; left:0; top:0" aria-hidden="true">
    <defs><filter id="fx-glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#5a6479" stroke-width="2.5" stroke-linecap="round"/>${bulbs}</svg>`;
}

/** Sparse snowfall: dots of 2–7 px, most near the top, fading out by `until`; avoids nothing (behind all content). */
export function snowfall(o: { until?: number; count?: number; seed?: number; height?: number } = {}): string {
  const until = o.until ?? 900, n = o.count ?? 70, r = rng(o.seed ?? 3), hh = o.height ?? 1920;
  const flakes = Array.from({ length: n }, () => {
    const y = until * Math.pow(r(), 1.6);
    const x = r() * W;
    const size = 1.5 + r() * r() * 5;
    // Keep clear of the header text (kicker row y ≈ 190–290 in the text column) and the light string's bulbs.
    if (y > 180 && y < 300 && x > 70 && x < 860) return '';
    if (y > 300 && y < 380) return '';
    const op = (0.18 + r() * 0.42) * (1 - y / until) ** 0.6;
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(size)}" fill="${SNOW}" opacity="${Math.round(op * 100) / 100}"/>`;
  }).join('');
  return `<svg width="${W}" height="${hh}" viewBox="0 0 ${W} ${hh}" style="position:absolute; left:0; top:0" aria-hidden="true">${flakes}</svg>`;
}

/** A thin snow layer on the top edge of a w-wide object at (x, y): bumpy top, wavy underside with a few drips. */
export function snowCap(o: { x: number; y: number; w: number; seed?: number }): string {
  const r = rng(o.seed ?? 5), step = 24;
  let top = `M 0 6`;
  for (let x = 0; x <= o.w; x += step) top += ` Q ${f1(x + step / 2)} ${f1(-6 - r() * 8)} ${f1(Math.min(o.w, x + step))} ${f1(-2 - r() * 3)}`;
  let under = '';
  for (let x = o.w; x > 0; x -= step) {
    const drip = r() < 0.14 ? 10 + r() * 12 : 0;
    under += ` Q ${f1(x - step / 2)} ${f1(8 + r() * 6 + drip)} ${f1(Math.max(0, x - step))} ${f1(6 + r() * 3)}`;
  }
  return `<svg width="${o.w + 8}" height="60" viewBox="-4 -20 ${o.w + 8} 60" style="position:absolute; left:${o.x - 4}px; top:${o.y - 20}px; overflow:visible" aria-hidden="true">
    <path d="${top} L ${o.w} 6${under} Z" fill="${SNOW}"/></svg>`;
}

/** A soft two-layer drift in the bottom bleed band (from y 1760): decoration only. */
export function snowDrift(o: { seed?: number } = {}): string {
  const r = rng(o.seed ?? 9);
  const layer = (base: number, amp: number, op: number) => {
    let d = `M -10 1930 L -10 ${base}`;
    for (let x = -10; x < W + 10; x += 180) d += ` Q ${f1(x + 90)} ${f1(base - amp * (0.5 + r()))} ${f1(x + 180)} ${f1(base + (r() - 0.5) * amp * 0.5)}`;
    return `<path d="${d} L ${W + 10} 1930 Z" fill="${SNOW}" opacity="${op}"/>`;
  };
  return `<svg width="${W}" height="1920" viewBox="0 0 ${W} 1920" style="position:absolute; left:0; top:0" aria-hidden="true">${layer(1790, 44, 0.09)}${layer(1845, 32, 0.15)}</svg>`;
}
