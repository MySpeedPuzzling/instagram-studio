// In-page QA lint, run by Playwright inside the rendered page before every capture.
// The function must stay self-contained: Playwright serialises it into the browser.
//
// Opt-outs on elements: data-qa-bleed (may leave the safe area), data-qa-small (may go below the type
// floor, still ≥ 24px), data-qa-bg="#hex" (declares the ground behind text over images/textures),
// data-qa-ignore (skip the element and its subtree).

export interface QaOptions {
  safe: { x0: number; y0: number; x1: number; y1: number };
  minFontPx: number;
  fontFamily: string;
}

export interface QaReport { errors: string[]; warnings: string[]; stats: Record<string, number> }

export function qaInPage(o: QaOptions): QaReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const root = document.documentElement;

  const label = (el: Element) => {
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].join('.') : ''}> "${text}"`;
  };
  const parse = (c: string): [number, number, number, number] | null => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const hex = (h: string): [number, number, number, number] => {
    const v = h.replace('#', '');
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 1];
  };
  const lum = ([r, g, b]: number[]) => {
    const ch = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  };
  const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  // Effective ground colour behind an element: first opaque background up the tree, alpha-composited.
  const ground = (el: Element): { color: number[] | null; unknown: boolean } => {
    const layers: number[][] = [];
    for (let n: Element | null = el; n; n = n.parentElement) {
      const declared = n.getAttribute('data-qa-bg');
      if (declared) { layers.push(hex(declared)); break; }
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none' && !n.hasAttribute('data-qa-bg')) return { color: null, unknown: true };
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    if (!layers.length) return { color: [255, 255, 255, 1], unknown: false };
    let out = [255, 255, 255];
    for (const l of layers.reverse()) out = out.map((v, i) => v * (1 - l[3]) + l[i] * l[3]);
    return { color: out, unknown: false };
  };

  // Frame must not scroll.
  if (root.scrollWidth > innerWidth + 1 || root.scrollHeight > innerHeight + 1) {
    errors.push(`page overflows the frame: ${root.scrollWidth}×${root.scrollHeight} > ${innerWidth}×${innerHeight}`);
  }

  // Fonts must be loaded, no fallback faces.
  for (const f of document.fonts) if (f.status === 'error') errors.push(`font failed to load: ${f.family} ${f.weight}`);

  let textCount = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set<Element>();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node.textContent ?? '').trim();
    const el = node.parentElement;
    if (!text || !el || seen.has(el) || el.closest('[data-qa-ignore]') || el.closest('svg')) continue;
    seen.add(el);
    textCount++;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    const size = parseFloat(cs.fontSize);
    const small = el.closest('[data-qa-small]');
    if (size < (small ? 24 : o.minFontPx)) errors.push(`font ${size}px below the ${small ? 24 : o.minFontPx}px floor: ${label(el)}`);
    if (!cs.fontFamily.toLowerCase().includes(o.fontFamily.toLowerCase())) warnings.push(`not ${o.fontFamily}: ${cs.fontFamily} ${label(el)}`);
    if (/\d/.test(text) && !cs.fontVariantNumeric.includes('tabular-nums')) errors.push(`digits without tabular-nums: ${label(el)}`);
    if (/\p{Extended_Pictographic}/u.test(text)) errors.push(`emoji in a graphic: ${label(el)}`);

    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width === 0) continue;
      const out = r.left < o.safe.x0 - 0.5 || r.right > o.safe.x1 + 0.5 || r.top < o.safe.y0 - 0.5 || r.bottom > o.safe.y1 + 0.5;
      if (out && !el.closest('[data-qa-bleed]')) {
        errors.push(`text outside the safe area (${Math.round(r.left)},${Math.round(r.top)})–(${Math.round(r.right)},${Math.round(r.bottom)}): ${label(el)}`);
        break;
      }
    }

    const fg = parse(cs.color);
    const g = ground(el);
    if (fg && g.color) {
      const c = ratio(fg, g.color);
      const large = size >= 48 || (size >= 37 && Number(cs.fontWeight) >= 700);
      const min = large ? 3 : 4.5;
      if (c < min) errors.push(`contrast ${c.toFixed(2)} < ${min} (${large ? 'large' : 'body'} text): ${label(el)}`);
    } else if (g.unknown) {
      warnings.push(`text over an image or gradient, contrast unchecked (add data-qa-bg): ${label(el)}`);
    }
  }

  // Banned effects (house style: no glass, blur, glow or stacked shadows).
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('[data-qa-ignore]')) continue;
    const cs = getComputedStyle(el);
    if (cs.backdropFilter && cs.backdropFilter !== 'none') errors.push(`backdrop-filter: ${label(el)}`);
    if (cs.filter.includes('blur')) errors.push(`blur filter: ${label(el)}`);
    if (cs.boxShadow !== 'none' && cs.boxShadow.split(/,(?![^(]*\))/).length > 1) warnings.push(`stacked box-shadow: ${label(el)}`);
    if ((cs.backgroundImage.match(/gradient/g) ?? []).length && (cs.backgroundImage.match(/(rgb|#)/g) ?? []).length > 3) {
      warnings.push(`multi-stop gradient: ${label(el)}`);
    }
  }

  return { errors, warnings, stats: { textCount } };
}
