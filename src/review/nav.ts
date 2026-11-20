// The lab list shared by the review app header and every lab gallery, so each page links to all the others.
// Add a lab here once for a nice label and group. Any content/labs/<ID>/index.html that is not listed still shows up
// (under "Other", titled from its <title>), and the review server swaps every gallery's baked-in nav for the live one,
// so no lab goes missing from the nav and old galleries never need a rebuild for it.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

export type LabGroup = 'Music & sound' | 'Reels & posts' | 'Look & design' | 'Other';
export const GROUPS: LabGroup[] = ['Music & sound', 'Reels & posts', 'Look & design', 'Other'];

/** Newest first inside each group. */
export const LABS: Array<{ id: string; label: string; group: LabGroup }> = [
  { id: 'BR3', label: '300M Reel music v3 (BR3)', group: 'Music & sound' },
  { id: 'BR2', label: '300M Reel music (BR2)', group: 'Music & sound' },
  { id: 'BR1', label: 'Music per post (BR1)', group: 'Music & sound' },
  { id: 'MU3', label: 'Trend flavours (MU3)', group: 'Music & sound' },
  { id: 'MU2', label: 'House sound (MU2)', group: 'Music & sound' },
  { id: 'MU1', label: 'Music beds (MU1)', group: 'Music & sound' },
  { id: 'FX1', label: 'Sound effects (FX1)', group: 'Music & sound' },
  { id: 'SW1', label: 'Spreadsheets wanted (SW1)', group: 'Reels & posts' },
  { id: 'SH1', label: 'Pile of shame (SH1)', group: 'Reels & posts' },
  { id: 'PQ1', label: 'Piece quiz (PQ1)', group: 'Reels & posts' },
  { id: 'GR1', label: 'Grind Reel (GR1)', group: 'Reels & posts' },
  { id: 'AC1', label: 'Achievements Reel (AC1)', group: 'Reels & posts' },
  { id: 'MR1', label: 'Monthly Reel (MR1)', group: 'Reels & posts' },
  { id: 'AB1', label: 'Start here covers (AB1)', group: 'Reels & posts' },
  { id: 'AD1', label: 'Advent (AD1)', group: 'Reels & posts' },
  { id: 'DL4', label: 'House system (DL4)', group: 'Look & design' },
  { id: 'LM1', label: 'Logo motion (LM1)', group: 'Look & design' },
  { id: 'IL1', label: 'Illustrations (IL1)', group: 'Look & design' },
  { id: 'DL1', label: 'Styles (DL1)', group: 'Look & design' },
  { id: 'DL2', label: 'Formats (DL2)', group: 'Look & design' },
  { id: 'DL3', label: 'Ideas (DL3)', group: 'Look & design' },
  { id: 'AI1', label: 'AI images (AI1)', group: 'Look & design' },
];

export interface Lab { id: string; label: string; group: LabGroup; title?: string; updated?: Date; built: boolean }

const LABS_DIR = join(ROOT, 'content/labs');
const titleOf = (file: string) => /<title>([^<]*)<\/title>/i.exec(readFileSync(file, 'utf8').slice(0, 4000))?.[1]?.trim();

/** Registered labs plus every built gallery on disk that is not registered yet. */
export function allLabs(): Lab[] {
  const onDisk = existsSync(LABS_DIR) ? readdirSync(LABS_DIR).filter(id => existsSync(join(LABS_DIR, id, 'index.html'))) : [];
  const info = (id: string) => {
    const f = join(LABS_DIR, id, 'index.html');
    return existsSync(f) ? { built: true, title: titleOf(f), updated: statSync(f).mtime } : { built: false };
  };
  const known = new Set(LABS.map(l => l.id));
  const extra = onDisk.filter(id => !known.has(id)).sort().map(id => {
    const i = info(id);
    return { id, label: `${i.title?.replace(new RegExp(`^${id}:?\\s*`), '') || id} (${id})`, group: 'Other' as const, ...i };
  });
  return [...LABS.map(l => ({ ...l, ...info(l.id) })), ...extra];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Links to the review app and every built lab, grouped; the current lab is marked. */
export function labNavLinks(current?: string, opts: { home?: boolean } = {}): string {
  const labs = allLabs().filter(l => l.built);
  const groups = GROUPS.map(g => [g, labs.filter(l => l.group === g)] as const).filter(([, ls]) => ls.length);
  return (opts.home === false ? '' : `<a href="/review">Review app</a><a href="/review/labs">All labs</a>`)
    + groups.map(([g, ls]) => `<span class="labgroup"><span class="labg">${g}</span>${ls.map(l =>
      `<a href="/content/labs/${l.id}/"${l.id === current ? ' class="cur" aria-current="page"' : ''}>${esc(l.label)}</a>`).join('')}</span>`).join('');
}

/** A full-width lab strip for gallery pages (sits at the top of the sticky header). */
export const LAB_NAV_CSS = `.labnav { flex-basis: 100%; display: flex; gap: 6px 14px; flex-wrap: wrap; align-items: baseline; font-size: 13px; padding-bottom: 6px; margin-bottom: 2px; border-bottom: 1px solid #e3e6eb; }
.labnav a { color: #667085; text-decoration: none; } .labnav a:hover { color: #1d2230; } .labnav a.cur { color: #1d2230; font-weight: 600; }
.labgroup { display: inline-flex; gap: 4px 12px; flex-wrap: wrap; align-items: baseline; padding-left: 12px; border-left: 1px solid #e3e6eb; }
.labg { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #98a2b3; font-weight: 600; }`;
// The CSS rides inside the nav so galleries built with older CSS still get the grouped look when the server swaps it in.
export const labNav = (current?: string) => `<nav class="labnav"><style>${LAB_NAV_CSS}</style>${labNavLinks(current)}</nav>`;

/** Replace a gallery's baked-in nav with the live one (or add one at the top of the header/body if it has none). */
export function withLiveNav(page: string, current: string): string {
  const nav = labNav(current);
  if (/<nav class="labnav">[\s\S]*?<\/nav>/.test(page)) return page.replace(/<nav class="labnav">[\s\S]*?<\/nav>/, () => nav);
  if (/<header[^>]*>/.test(page)) return page.replace(/<header[^>]*>/, m => m + nav);
  return page.replace(/<body[^>]*>/, m => `${m}<div style="padding:8px 20px;background:#fff">${nav}</div>`);
}
