// The lab list shared by the review app header and every lab gallery, so each page links to all the others.
// Add a lab here once and every navbar picks it up (galleries after their next rebuild).
export const LABS: Array<{ id: string; label: string }> = [
  { id: 'AD1', label: 'Advent (AD1)' },
  { id: 'DL4', label: 'House system (DL4)' },
  { id: 'LM1', label: 'Logo motion (LM1)' },
  { id: 'IL1', label: 'Illustrations (IL1)' },
  { id: 'DL1', label: 'Styles (DL1)' },
  { id: 'DL2', label: 'Formats (DL2)' },
  { id: 'DL3', label: 'Ideas (DL3)' },
  { id: 'AI1', label: 'AI images (AI1)' },
];

/** Links to the review app and every lab; the current lab is marked. */
export function labNavLinks(current?: string): string {
  return `<a href="/review">Review app</a>` + LABS.map(l => `<a href="/content/labs/${l.id}/"${l.id === current ? ' class="cur" aria-current="page"' : ''}>${l.label}</a>`).join('');
}

/** A full-width lab strip for gallery pages (sits at the top of the sticky header). */
export const LAB_NAV_CSS = `.labnav { flex-basis: 100%; display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; padding-bottom: 6px; margin-bottom: 2px; border-bottom: 1px solid #e3e6eb; }
.labnav a { color: #667085; text-decoration: none; } .labnav a.cur { color: #1d2230; font-weight: 600; }`;
export const labNav = (current?: string) => `<nav class="labnav">${labNavLinks(current)}</nav>`;
