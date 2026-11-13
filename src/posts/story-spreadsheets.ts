// Still Story "Your spreadsheets, wanted!" (owner 2026-11-13): MSP is building import for times and collections kept
// in spreadsheets, and asks puzzlers to send real sheets (DM or e-mail) so the import reads them right. No DB numbers.
// Three concepts (lab SW1): A "WANTED" alarm poster, B "WE WANT YOU(R SPREADSHEETS)", C the Story as a spreadsheet.
// The e-mail address is read from the gitignored content/contact.json (the repo is public: no addresses in code).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GROUNDS, f1, frame, type Variant } from '../design/house.ts';
import { escapeHtml as h } from '../design/page.ts';
import { ROOT } from '../render/server.ts';

export type SheetConcept = 'A' | 'B' | 'C';

export function contactEmail(): string {
  const p = join(ROOT, 'content/contact.json');
  if (!existsSync(p)) throw new Error('content/contact.json missing: {"email": "..."} (gitignored)');
  return String(JSON.parse(readFileSync(p, 'utf8')).email);
}

/** The sample sheet: invented rows (no member data). The Date column is written four ways on purpose: the joke that
 *  is also the reason we want real samples. */
const COLS = [
  { k: 'A', name: 'Puzzle', w: 280 }, { k: 'B', name: 'Time', w: 140, num: true },
  { k: 'C', name: 'Date', w: 212 }, { k: 'D', name: 'Notes', w: 200 },
] as const;
const ROWS: string[][] = [
  ['Harbour sunset', '3:12:44', '12/03/24', 'cat helped'],
  ['Owl in snow', '58:10', '2024-03-15', 'PB!!!'],
  ['Mystery box 4', '???', 'March 16th', '1 missing'],
  ['Christmas one', '1:47:03', '16. 3.', 'again'],
  ['Tea shop', '', '', 'unsolved'],
];

const SHEET_CSS = `
.sw-sheet { position: absolute; background: #fff; border-radius: 10px; box-shadow: 0 22px 48px -14px rgba(16,22,34,.5); overflow: hidden; }
.sw-sheet table { border-collapse: collapse; font-size: 30px; color: #2b3445; table-layout: fixed; }
.sw-sheet td, .sw-sheet th { border: 1.5px solid #d5dce6; height: 58px; padding: 0 12px; white-space: nowrap; overflow: hidden; text-overflow: clip; text-align: left; }
.sw-sheet th { background: #e9edf3; font-weight: 500; color: #4b566b; text-align: center; height: 46px; font-size: 30px; }
.sw-sheet td.rn { background: #e9edf3; color: #4b566b; text-align: center; font-size: 30px; padding: 0; }
.sw-sheet td.hd { font-weight: 700; }
.sw-sheet td.num { text-align: right; }
.sw-sheet td.sel { outline: 4px solid #ec726f; outline-offset: -3px; position: relative; }
.sw-sheet td.sel::after { content: ''; position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; background: #ec726f; border: 2px solid #fff; }
.sw-sheet td.date { color: #aa383a; font-weight: 500; }
`;

function sheet(o: { left: number; top: number; rows?: number; rotate?: number; sel?: [number, number] }): string {
  const rows = ROWS.slice(0, o.rows ?? ROWS.length);
  const width = 56 + COLS.reduce((s, c) => s + c.w, 0);
  const colgroup = `<colgroup><col style="width:56px">${COLS.map(c => `<col style="width:${c.w}px">`).join('')}</colgroup>`;
  const head = `<tr><th></th>${COLS.map(c => `<th>${c.k}</th>`).join('')}</tr>`;
  const r1 = `<tr><td class="rn">1</td>${COLS.map((c, i) => `<td class="hd${'num' in c ? ' num' : ''}${o.sel?.[0] === 0 && o.sel[1] === i ? ' sel' : ''}">${c.name}</td>`).join('')}</tr>`;
  const body = rows.map((r, ri) => `<tr><td class="rn">${ri + 2}</td>${r.map((v, ci) => {
    const c = COLS[ci], cls = [('num' in c) ? 'num' : '', c.k === 'C' && v ? 'date' : '', o.sel?.[0] === ri + 1 && o.sel[1] === ci ? 'sel' : ''].filter(Boolean).join(' ');
    return `<td${cls ? ` class="${cls}"` : ''}>${h(v)}</td>`;
  }).join('')}</tr>`).join('');
  return `<div class="sw-sheet" data-qa-bg="#ffffff" style="left:${o.left}px; top:${o.top}px; width:${width}px; transform:rotate(${o.rotate ?? 0}deg)"><table style="width:${width}px">${colgroup}${head}${r1}${body}</table></div>`;
}

/** A flat siren (poster shape, no AI): dome on a base, five rays. */
function siren(cx: number, top: number, s: number, dome: string, glare: string, rays: string, base?: string, rayAngles = [180, 145, 90, 35, 0]): string {
  const w = 150 * s, dh = 130 * s, bw = 210 * s, bh = 42 * s, y0 = top + 70 * s;
  const domeD = `M${f1(cx - w / 2)} ${f1(y0 + dh)} V${f1(y0 + w / 2)} A${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${f1(cx + w / 2)} ${f1(y0 + w / 2)} V${f1(y0 + dh)} Z`;
  const ray = (deg: number, r0: number, r1: number) => {
    const a = (deg * Math.PI) / 180, cy = y0 + w / 2;
    return `<line x1="${f1(cx + Math.cos(a) * r0)}" y1="${f1(cy - Math.sin(a) * r0)}" x2="${f1(cx + Math.cos(a) * r1)}" y2="${f1(cy - Math.sin(a) * r1)}" stroke="${rays}" stroke-width="${f1(16 * s)}" stroke-linecap="round"/>`;
  };
  return `<svg width="1080" height="${f1(y0 + dh + bh + 10)}" style="position:absolute; left:0; top:0; overflow:visible" aria-hidden="true">
    <g class="sw-rays">${rayAngles.map(d => ray(d, 118 * s, 168 * s)).join('')}</g>
    <path class="sw-dome" d="${domeD}" fill="${dome}"/>
    <path d="M${f1(cx - w * 0.22)} ${f1(y0 + dh - 16 * s)} V${f1(y0 + w * 0.42)} A${f1(w * 0.2)} ${f1(w * 0.2)} 0 0 1 ${f1(cx - w * 0.02)} ${f1(y0 + w * 0.26)}" fill="none" stroke="${glare}" stroke-width="${f1(14 * s)}" stroke-linecap="round"/>
    <rect x="${f1(cx - bw / 2)}" y="${f1(y0 + dh)}" width="${f1(bw)}" height="${f1(bh)}" rx="${f1(8 * s)}" fill="${base ?? dome}"/>
  </svg>`;
}

/** The call to action on a solid band: DM or e-mail (owner 2026-11-13: "say DM or email"). */
function cta(top: number, email: string, ground: 'navy' | 'coral' | 'paper'): string {
  const navyBand = ground !== 'navy';
  const bg = navyBand ? '#222a38' : GROUNDS.coral.bg, ink = navyBand ? '#ffffff' : '#1d2433', soft = navyBand ? '#ffb0ab' : '#1d2433';
  return `<div id="sw-cta" class="h-abs" data-qa-bg="${bg}" style="top:${top}px; background:${bg}; border-radius:14px; padding:30px 32px; box-sizing:border-box; text-align:center">
    <p style="margin:0; font-size:56px; font-weight:700; line-height:1.1; color:${ink}">DM us your file</p>
    <p style="margin:14px 0 0; font-size:38px; font-weight:500; line-height:1.25; color:${soft}">or e-mail <b style="color:${ink}">${h(email)}</b></p>
  </div>`;
}

/** B's siren (combined with A, owner 2026-11-13): dome centre, and the beacon's two light beams around it. */
export const SIREN_B = { cx: 948, cy: 300 + 70 * 0.75 + 75 * 0.75 } as const;
/** The beams' angle on frame 0 (the Story's preview): one beam across the headline, the other up and out of frame. */
export const BEAM_START = 148;

/** Two opposite coral light beams from the dome, fading out with distance; drawn behind the text (decoration). The
 *  wrapper rotates around the dome in the animated Story. */
function beacon(cx: number, cy: number, deg: number): string {
  const L = 1500, half = 13 * Math.PI / 180;
  const wedge = (a: number) => `M0 0 L${f1(Math.cos(a - half) * L)} ${f1(Math.sin(a - half) * L)} L${f1(Math.cos(a + half) * L)} ${f1(Math.sin(a + half) * L)} Z`;
  return `<div id="sw-beam" style="position:absolute; left:${f1(cx)}px; top:${f1(cy)}px; width:0; height:0; transform:rotate(${deg}deg)" aria-hidden="true">
    <svg width="${2 * L}" height="${2 * L}" viewBox="${-L} ${-L} ${2 * L} ${2 * L}" style="position:absolute; left:${-L}px; top:${-L}px; overflow:visible">
      <defs><radialGradient id="swb" cx="0" cy="0" r="${L * 0.75}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${GROUNDS.coral.bg}" stop-opacity="0.5"/><stop offset="0.55" stop-color="${GROUNDS.coral.bg}" stop-opacity="0.12"/><stop offset="1" stop-color="${GROUNDS.coral.bg}" stop-opacity="0"/></radialGradient></defs>
      <path d="${wedge(0)}" fill="url(#swb)"/><path d="${wedge(Math.PI)}" fill="url(#swb)"/></svg></div>`;
}

export function spreadsheetStory(v: Variant, c: SheetConcept, email = contactEmail()): string {
  const sheetLeft = (1080 - (56 + COLS.reduce((s, x) => s + x.w, 0))) / 2;
  if (c === 'A') {
    const g = GROUNDS.coral;
    return `<style>${SHEET_CSS}</style>` + frame({
      ground: 'coral', kind: 'story', kicker: 'Calling all spreadsheet keepers', device: v.device, src: 'We\'re building import',
      body: `${siren(540, 300, 1, g.ink, g.bg, g.ink)}
        <h1 class="h-title" style="top:560px; text-align:center; font-size:184px; line-height:1; letter-spacing:0.02em; font-weight:800">WANTED</h1>
        <p class="h-abs" style="top:760px; margin:0; text-align:center; font-size:76px; font-weight:700; line-height:1.05; color:${g.ink}">your spreadsheets</p>
        ${sheet({ left: sheetLeft, top: 878, rows: 4, rotate: -2, sel: [3, 2] })}
        <p class="h-abs h-lead" style="top:1252px; margin:0; text-align:center; font-size:38px">Times, collections, both. Any mess welcome.<br><b>Reward: an import that reads yours.</b></p>
        ${cta(1392, email, 'coral')}`,
    });
  }
  if (c === 'B') {
    const g = GROUNDS.navyDeep;
    return `<style>${SHEET_CSS}</style>` + frame({
      ground: 'navyDeep', kind: 'story', kicker: 'Calling all spreadsheet keepers', device: v.device, src: 'We\'re building import',
      body: `${beacon(SIREN_B.cx, SIREN_B.cy, BEAM_START)}${siren(SIREN_B.cx, 300, 0.75, g.hot, '#ffb0ab', g.hot, '#5a6479', [145, 90, 35, 0])}
        <h1 class="h-title" style="top:330px; font-size:150px; line-height:1; font-weight:800; letter-spacing:-0.01em">WE WANT</h1>
        <p class="h-abs" style="top:470px; margin:0; font-size:290px; font-weight:800; line-height:1; letter-spacing:-0.03em; color:${g.ink}">YOU<span style="color:${g.hot}">R</span><span id="sw-caret" style="display:inline-block; position:relative; width:12px; height:230px; margin-left:8px; vertical-align:-14px; background:${g.hot}"></span></p>
        <p class="h-abs" style="top:770px; margin:0; font-size:110px; font-weight:800; line-height:1; letter-spacing:-0.02em; color:${g.hot}">SPREADSHEETS</p>
        <p class="h-abs h-lead" style="top:918px; margin:0; font-size:40px; color:${g.soft}">Times or a collection in Excel, Google Sheets or Numbers? We're building import, and every real sheet makes it better.</p>
        ${sheet({ left: sheetLeft, top: 1100, rows: 2, rotate: 0, sel: [2, 2] })}
        ${cta(1392, email, 'navy')}`,
    });
  }
  // C: the Story is a spreadsheet (paper ground = white with depth)
  const g = GROUNDS.paper;
  const fx = `<div class="h-abs" data-qa-bg="#ffffff" style="top:320px; height:76px; background:#fff; border:2px solid #d5dce6; border-radius:10px; display:flex; align-items:center; font-size:34px; box-shadow:0 10px 24px -12px rgba(16,22,34,.3)">
      <span style="width:90px; text-align:center; font-style:italic; font-weight:700; color:#4b566b; border-right:2px solid #d5dce6; line-height:76px">fx</span>
      <span style="padding-left:22px; font-weight:600; color:#2b3445">=<span style="color:#aa383a">WANTED</span>(your_spreadsheet)</span></div>`;
  const callout = `<div class="h-abs" data-qa-bg="#ffffff" style="top:440px; background:#fff; outline:6px solid ${GROUNDS.coral.bg}; border-radius:4px; padding:36px 40px 40px; box-sizing:border-box; box-shadow:0 22px 48px -14px rgba(16,22,34,.4)">
      ${siren(870, -8, 0.56, '#1d2433', '#ffffff', GROUNDS.coral.bg).replace('left:0; top:0', 'left:-88px; top:0')}
      <p style="margin:0; font-size:30px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:${g.accent}">Calling every</p>
      <p style="margin:8px 0 0; font-size:96px; font-weight:800; line-height:1; letter-spacing:-0.02em; color:${g.ink}">spreadsheet<br>keeper</p>
      <span style="position:absolute; right:-9px; bottom:-9px; width:18px; height:18px; background:${GROUNDS.coral.bg}; border:3px solid #fff"></span></div>`;
  return `<style>${SHEET_CSS}</style>` + frame({
    ground: 'paper', kind: 'story', kicker: 'Your spreadsheets, wanted', device: v.device, src: 'We\'re building import',
    body: `${fx}${callout}
      ${sheet({ left: sheetLeft, top: 786, rows: 5, sel: [4, 2] })}
      <p class="h-abs h-lead" style="top:1208px; margin:0; font-size:38px; color:${g.ink}">Your times, your collection, your columns. Every sheet is different, so the more real ones we see, the better MSP's import reads yours.</p>
      ${cta(1392, email, 'paper')}`,
  });
}
