// Builds the outlined logo for dark and colour grounds (owner decision 2026-10-14): the vector mark with a white
// outline around its silhouette, like assets/brand/email-logo.png, instead of a white disc behind it.
//
//   node src/design/build-logo.ts      # writes assets/brand/speedpuzzling-logo-outline.svg
//
// The outline is a rounded dilation: the mark's alpha is blurred and thresholded (an feMorphology dilate gives
// square corners at this radius), flooded white and laid under the mark. The viewBox grows by the outline width
// so nothing is clipped. Images reference the file with <img>, so no CSS filter ever lands on a slide.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

const SRC = join(ROOT, 'assets/brand/speedpuzzling-logo.svg');
export const OUTLINED_LOGO = join(ROOT, 'assets/brand/speedpuzzling-logo-outline.svg');

/** Outline width as a share of the mark's width (email-logo.png: about 3.5 %). */
const OUTLINE = 0.034;

export function buildOutlinedLogo(): string {
  const svg = readFileSync(SRC, 'utf8');
  const vb = svg.match(/viewBox="([\d.\s-]+)"/)![1].trim().split(/\s+/).map(Number);
  const [x, y, w, h] = vb;
  const r = w * OUTLINE;
  const sigma = r / 1.55;          // the thresholded blur reaches ≈ 1.55 σ past a straight edge
  const pad = Math.ceil(r * 1.25);
  const filter = `<filter id="msp-outline" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
   <feGaussianBlur in="SourceAlpha" stdDeviation="${sigma.toFixed(1)}" result="b"/>
   <feComponentTransfer in="b" result="m"><feFuncA type="linear" slope="30" intercept="-1.5"/></feComponentTransfer>
   <feFlood flood-color="#ffffff" result="w"/>
   <feComposite in="w" in2="m" operator="in" result="o"/>
   <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
  return svg
    .replace(/<!DOCTYPE[^>]*>\s*/, '')
    .replace(/<!-- Creator[^>]*-->\s*/, '')
    .replace(/width="[^"]*mm" height="[^"]*mm"/, `width="${((w + 2 * pad) / 100).toFixed(2)}" height="${((h + 2 * pad) / 100).toFixed(2)}"`)
    .replace(/viewBox="[^"]*"/, `viewBox="${x - pad} ${y - pad} ${w + 2 * pad} ${h + 2 * pad}"`)
    .replace('</defs>', ` ${filter}\n </defs>`)
    .replace('<g id="Layer_x0020_1">', '<g filter="url(#msp-outline)"><g id="Layer_x0020_1">')
    .replace(/<\/svg>\s*$/, '</g>\n</svg>\n');
}

if (import.meta.main) {
  writeFileSync(OUTLINED_LOGO, buildOutlinedLogo());
  console.log(`wrote ${OUTLINED_LOGO.slice(ROOT.length + 1)}`);
}
