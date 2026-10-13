// Wraps slide markup into a complete HTML document with MSP's fonts, tokens and base rules.
import { FRAMES, type FrameKind } from '../render/render.ts';

export const BASE_CSS = `
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik%5Bwght%5D.ttf') format('truetype'); font-weight: 300 900; font-style: normal; font-display: block; }
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik-Italic%5Bwght%5D.ttf') format('truetype'); font-weight: 300 900; font-style: italic; font-display: block; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; overflow: hidden; }
body {
  font-family: 'Rubik', sans-serif;
  font-variant-numeric: tabular-nums lining-nums;
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  font-kerning: normal;
}
h1, h2, h3, p, figure, ol, ul { margin: 0; padding: 0; }
svg { display: block; overflow: visible; }
`;

export interface PageOptions {
  frame?: FrameKind;
  /** Extra CSS for this slide (direction theme + component styles). */
  css?: string;
  title?: string;
}

export function page(body: string, opts: PageOptions = {}): string {
  const f = FRAMES[opts.frame ?? 'feed'];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(opts.title ?? 'slide')}</title>
<link rel="stylesheet" href="/assets/design/tokens.css">
<style>${BASE_CSS}
html, body { width: ${f.width}px; height: ${f.height}px; }
${opts.css ?? ''}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Format integers with comma thousands separators (Rubik has no thin space). */
export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Minutes (float) → "m:ss" or "h:mm:ss". */
export function fmtDuration(minutes: number): string {
  const total = Math.round(minutes * 60);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
