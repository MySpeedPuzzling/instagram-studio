// Import launch (owner 2026-11-15): spreadsheet import is live on MySpeedPuzzling, a first version built in 3 days;
// we want people to try it, and the keen ones to test on the sandbox (by DM only, no address on the slides).
// Follows the 13 Nov Story "WE WANT YOU(R SPREADSHEETS)" (same siren, same sample sheet). Owner picks: cover
// "Break it. (Gently.)", "75 000 lines of code + 46 000 lines of tests", sandbox by DM only, out tonight.
//   1 cover    coral poster "Break it. (Gently.)" over the Story's sheet with FRAGILE tape and the siren;
//   2 steps    the five steps as a column of five interlocking pieces (File, Check, People, Puzzles, Add);
//   3 chaos    real-spreadsheet values and how the import reads them (checked against the app's parser tests 2026-11-15:
//              DurationReaderTest 8min/1h23/1:40ish (two readings, asked per column), ImportDateReaderTest Sept 2020 (month),
//              PiecesReaderTest 13x99 (multipack, choices));
//   4 why      results typed in by hand in the last 12 months (`import-backdated`), 1 in 11 as a strip of 11 pieces;
//   5 code     75 000+ lines of code, 46 000 of tests, 30 updates (1 piece each) (GitHub PRs, `github-import-prs`); no languages line (owner: useless);
//   6 sandbox  first version, it will trip; a piece with a plaster; comment "SANDBOX" and we DM you (owner 2026-11-15);
//   7 cta      tell us everything: DM or e-mail; where to find it; send it to the spreadsheet friend.
// Facts the app session confirmed (2026-11-15): free for everyone; .xlsx, .csv, .tsv or a Google Sheets link (not .xls,
// .ods or Numbers); results solo/pair/team, owned puzzles, wish list; Undo per row, adding or import; never added twice.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { query, type QueryResult } from '../data/db.ts';
import { CW, FEED, FEED_H, GROUNDS, W, X0, X1, f1, frame, groundVars, heroFit, posterTopPath, seamReach, slotOf, type SlideCtx, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { ROOT } from '../render/server.ts';
import { SHEET_CSS, contactEmail, sheet, siren } from './story-spreadsheets.ts';

export const POST = 'feature'; // a feature launch: coral poster (milestones & events)
const TOP = 104; // first text line now that the kicker header is gone (backlog 2026-11-13: tighten the top band)
const REPO = 'MySpeedPuzzling/myspeedpuzzling.com';
/** The import's pull requests: data-import stages 1a–8 and the guided flow; #349 (a photo fix) is not part of it. */
const IMPORT_PRS = [344, 345, 346, 347, 348, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374];

export interface CodeStats { prs: number; first: string; last: string; code: number; tests: number; translations: number; docs: number; total: number; languages: number }
export interface ImportSpec { backdated: number; puzzlers: number; p100: number; addedAll: number; oneIn: number; since: string; code: CodeStats; email: string; asOf: string }

/** Lines added per kind of file across the import's merged PRs (GitHub API via gh; merged PRs don't change, so cached). */
function githubStats(fresh: boolean): QueryResult {
  const cache = join(ROOT, 'content/cache/github-import-prs.json');
  if (!fresh && existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf8'));
  const sum: Record<string, number> = { code: 0, tests: 0, translations: 0, docs: 0, other: 0 };
  const dates: string[] = [];
  for (const n of IMPORT_PRS) {
    const pr = JSON.parse(execFileSync('gh', ['api', `repos/${REPO}/pulls/${n}`, '--jq', '{merged_at, created_at}'], { encoding: 'utf8' }));
    if (!pr.merged_at) throw new Error(`PR #${n} is not merged`);
    dates.push(pr.created_at, pr.merged_at);
    const files = execFileSync('gh', ['api', '--paginate', `repos/${REPO}/pulls/${n}/files?per_page=100`, '--jq', '.[] | [.filename, .additions] | @tsv'], { encoding: 'utf8', maxBuffer: 64 << 20 });
    for (const line of files.trim().split('\n')) {
      const [f, a] = line.split('\t');
      const k = f.startsWith('tests/') ? 'tests' : f.startsWith('translations/') ? 'translations' : f.startsWith('docs/') || f.endsWith('.md') ? 'docs'
        : /^(src|templates|assets|migrations)\//.test(f) ? 'code' : 'other';
      sum[k] += Number(a);
    }
  }
  dates.sort();
  const row = { prs: String(IMPORT_PRS.length), first_created: dates[0], last_merged: dates[dates.length - 1], ...Object.fromEntries(Object.entries(sum).map(([k, v]) => [`added_${k}`, String(v)])), added_total: String(Object.values(sum).reduce((a, b) => a + b, 0)) };
  const res = { name: 'github-import-prs', queried_at: new Date().toISOString(), rows: [row], note: `${REPO} PRs #${IMPORT_PRS.join(', #')}; code = src/ + templates/ + assets/ + migrations/` } as unknown as QueryResult;
  mkdirSync(join(ROOT, 'content/cache'), { recursive: true });
  writeFileSync(cache, JSON.stringify(res, null, 1));
  return res;
}

export async function buildImportSpec(o: { fresh: boolean }): Promise<{ spec: ImportSpec; facts: Record<string, QueryResult> }> {
  const facts = { 'import-backdated': query('import-backdated', { fresh: o.fresh }), 'github-import-prs': githubStats(o.fresh) };
  const b = facts['import-backdated'].rows[0], g = facts['github-import-prs'].rows[0] as Record<string, string>;
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });
  const code: CodeStats = {
    prs: +g.prs, first: g.first_created, last: g.last_merged, code: +g.added_code, tests: +g.added_tests, translations: +g.added_translations,
    docs: +g.added_docs, total: +g.added_total, languages: 6,
  };
  if (code.code < 75_000 || code.tests < 45_500) throw new Error(`github-import-prs: code ${code.code} / tests ${code.tests} no longer match the slide's "75 000+" / "46 000"`);
  return {
    facts,
    spec: {
      backdated: +b.backdated, puzzlers: +b.puzzlers, p100: +b.puzzlers_100plus, addedAll: +b.added_all,
      oneIn: Math.round(+b.added_all / +b.backdated), since: day(b.since), code, email: contactEmail(), asOf: day(facts['import-backdated'].queried_at),
    },
  };
}

// ---------------------------------------------------------------- helpers
const svg = (inner: string) => `<svg style="position:absolute; left:0; top:0" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true">${inner}</svg>`;
const NAVY = GROUNDS.navyDeep.bg, CORAL = GROUNDS.coral.bg;
/** "75 000+" style: thousands rounded down, so the slide never claims more than the PRs hold. */
const thousandsDown = (n: number) => `${fmtInt(Math.floor(n / 5000) * 5000)}`; // 76 846 → "75 000+" (owner 2026-11-15)
const thousandsNear = (n: number) => `${fmtInt(Math.round(n / 1000) * 1000)}`;

/** A navy content slide in the house style (no header since 13 Nov): title at TOP, body, footer source line. */
function board(v: Variant, x: SlideCtx, o: { title?: string; titleSize?: number; body: string; src: string; css?: string }) {
  const g = GROUNDS[v.ground(slotOf(x, 'data'))];
  const title = o.title ? `<h1 class="h-title" style="top:${TOP}px; font-size:${o.titleSize ?? 62}px">${o.title}</h1>` : '';
  return (o.css ? `<style>${o.css}</style>` : '') + frame({ ground: g.key, kicker: 'Import', device: v.device, body: title + o.body, src: o.src });
}

/** Parcel tape across the sheet: FRAGILE · HANDLE WITH CARE, repeated. */
const tape = (cx: number, cy: number, len: number, rot: number) => `<div data-qa-bleed data-qa-overlap-ok data-qa-bg="${CORAL}" style="position:absolute; left:${f1(cx - len / 2)}px; top:${f1(cy - 36)}px; width:${len}px; height:72px; transform:rotate(${rot}deg); background:${CORAL}; box-shadow:0 10px 22px rgba(10,14,22,.45); display:flex; align-items:center; justify-content:center; gap:26px; overflow:hidden; white-space:nowrap">
    ${Array.from({ length: 3 }, () => `<span style="font-size:34px; font-weight:800; letter-spacing:.08em; color:${NAVY}">FRAGILE</span><span style="font-size:30px; font-weight:600; letter-spacing:.06em; color:${NAVY}">HANDLE WITH CARE</span>`).join('')}</div>`;

/** A coral sticking plaster across a puzzle piece ("be gentle"): rounded strip, pad in the middle, small holes. */
function plaster(cx: number, cy: number, len: number, rot: number) {
  const hgt = len * 0.3, pad = len * 0.34;
  const holes = (x0: number) => Array.from({ length: 6 }, (_, i) => `<circle cx="${f1(x0 + (i % 3) * hgt * 0.22)}" cy="${f1(hgt * 0.32 + Math.floor(i / 3) * hgt * 0.36)}" r="${f1(hgt * 0.045)}" fill="#c95855"/>`).join('');
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) translate(${f1(-len / 2)} ${f1(-hgt / 2)})">
    <rect x="4" y="8" width="${f1(len)}" height="${f1(hgt)}" rx="${f1(hgt / 2)}" fill="rgba(10,14,22,.35)"/>
    <rect width="${f1(len)}" height="${f1(hgt)}" rx="${f1(hgt / 2)}" fill="#ffb0ab"/>
    <rect x="${f1((len - pad) / 2)}" y="${f1(hgt * 0.16)}" width="${f1(pad)}" height="${f1(hgt * 0.68)}" rx="${f1(hgt * 0.12)}" fill="${CORAL}"/>
    ${holes(hgt * 0.45)}${holes(len - hgt * 0.45 - hgt * 0.44)}</g>`;
}

// ---------------------------------------------------------------- slides
export function importSlides(v: Variant, s: ImportSpec): string[] {
  const order = ['cover', 'steps', 'chaos', 'why', 'code', 'sandbox', 'cta'] as const;
  const ctx = (k: typeof order[number]): SlideCtx => ({ v, post: POST, slide: order.indexOf(k) + 1, of: order.length });
  const src = `Data: myspeedpuzzling.com · ${s.asOf}`;

  const cover = () => {
    // Owner 2026-11-15: the dek touched a seam knob. The seam follows the text: dek bottom + 60 px + the knobs' upward reach.
    const x = ctx('cover'), dekTop = TOP + 300, dekBottom = dekTop + 2 * Math.ceil(38 * 1.3), seam = Math.ceil(dekBottom + 60 + seamReach().up);
    const topG = GROUNDS[v.ground(slotOf(x, 'cover'))], base = GROUNDS[v.posterBase ?? 'navyDeep'];
    const head = `<div style="${groundVars(topG)}" data-qa-bg="${topG.bg}">
        <h1 class="h-title" style="top:${TOP - 6}px; font-size:168px; line-height:.98; letter-spacing:-0.03em; font-weight:800">Break it.</h1>
        <p class="h-abs" style="top:${TOP + 166}px; font-size:110px; line-height:1; letter-spacing:-0.02em; font-weight:800; color:${topG.ink}">(Gently.)</p>
        <p class="h-dek h-abs" style="top:${dekTop}px; width:${CW - 20}px; font-size:38px; color:${topG.ink}">Spreadsheet import is live on MySpeedPuzzling. It’s brand new, and we want you to test it.</p></div>`;
    const under = `<svg class="h-poster-top" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true"><path d="${posterTopPath(seam)}" fill="${topG.bg}"/></svg>${head}`;
    const sheetW = 56 + 280 + 140 + 212 + 200, left = (W - sheetW) / 2 - 30;
    const body = `<style>${SHEET_CSS}</style>
      <div data-qa-bleed data-qa-overlap-ok>${sheet({ left, top: seam + 200, rows: 3, rotate: -3, sel: [3, 2] })}</div>
      ${tape(W / 2 - 20, seam + 360, 1240, -9)}
      ${siren(940, seam + 30, 0.62, CORAL, '#ffb0ab', CORAL, '#5a6479', [145, 90, 35])}`;
    return frame({ ground: base.key, kicker: 'Import', device: v.device, body, src: 'Spreadsheet import · free for every MSP account', under, noRule: true, headGround: topG.key });
  };

  const steps = () => {
    const x = ctx('steps');
    const rows = [
      ['File', 'Excel (.xlsx), CSV, or a Google Sheets link'],
      ['Check', 'We read your columns and ask only what’s unclear'],
      ['People', 'Pair and team partners become players'],
      ['Puzzles', 'Your rows matched to the MSP catalogue'],
      ['Add', 'You pick what goes in. Changed your mind? Undo.'],
    ];
    const top = 330, ph = 150, pw = 150;
    const jig = generateJigsaw({ cols: 1, rows: rows.length, width: pw, height: ph * rows.length, x: X0, y: top, seed: 31, tabSize: 0.26 });
    const art = jig.pieces.map((p, i) => `<path d="${p.d}" fill="${i === rows.length - 1 ? 'var(--c-hot)' : 'var(--c-base)'}" stroke="var(--g-bg)" stroke-width="4" stroke-linejoin="round"/>`).join('');
    const tx = X0 + pw + 50;
    // Owner 2026-11-15: centre each number in the piece's visible body. The knob of the piece above bites into pieces
    // 2–5, so their number moves down by about a third of that knob's depth (owner: half was "too much").
    const bite = (i: number) => (i === 0 ? 0 : Math.max(0, Math.max(...jig.pieces[i - 1].outline.map(([, y]) => y)) - (top + i * ph)));
    const html = rows.map(([k, t], i) => `
      <span data-qa-bg="${i === rows.length - 1 ? CORAL : '#5a6479'}" style="position:absolute; left:${X0}px; top:${f1(top + i * ph + ph / 2 + bite(i) * 0.35 - 30)}px; width:${pw}px; text-align:center; font-size:56px; font-weight:800; line-height:60px; color:${i === rows.length - 1 ? NAVY : '#ffffff'}">${i + 1}</span>
      <p class="h-abs" style="left:${tx}px; top:${top + i * ph + 24}px; width:${X1 - tx}px; font-size:44px; font-weight:800; line-height:1.05; color:var(--g-ink)">${k}</p>
      <p class="h-abs" style="left:${tx}px; top:${top + i * ph + 80}px; width:${X1 - tx}px; font-size:32px; line-height:1.2; color:var(--g-soft)">${h(t)}</p>`).join('');
    return board(v, x, {
      title: 'Years of puzzles in a spreadsheet? Bring them in.',
      body: svg(art) + html + `<p class="h-abs" style="top:${top + rows.length * ph + 34}px; font-size:32px; line-height:1.25; color:var(--g-ink)">Times (solo, pair, team), your collection and your wish list. <b style="color:var(--c-hot)">Never added twice.</b></p>`,
      src: 'Your profile → Import a spreadsheet',
    });
  };

  const chaos = () => {
    const x = ctx('chaos');
    const rows: Array<[string, string, boolean?]> = [
      ['8min', '8:00'],
      ['1h23', '1:23:00'],
      ['1:40ish', 'hours or minutes?\nIt asks once.', true],
      ['Sept 2020', 'September 2020'],
      ['13x99', 'asks you first', true],
    ];
    const top = 316, rh = 132, cellW = 330, ax = X0 + cellW + 30, rx = ax + 90;
    const html = rows.map(([a, b, ask], i) => `
      <div class="sw-cell" data-qa-bg="#ffffff" style="position:absolute; left:${X0}px; top:${top + i * rh}px; width:${cellW}px; height:96px; background:#fff; border:2px solid #d5dce6; border-radius:6px; box-sizing:border-box; padding:0 22px; display:flex; align-items:center; font-size:44px; font-weight:500; color:#aa383a; font-variant-numeric:tabular-nums; ${i === 2 ? 'outline:5px solid #ec726f; outline-offset:-4px;' : ''}">${h(a)}</div>
      <span style="position:absolute; left:${ax}px; top:${top + i * rh + 14}px; font-size:56px; font-weight:800; line-height:1; color:var(--c-hot)">→</span>
      <p class="h-abs" style="left:${rx}px; top:${top + i * rh + 22}px; width:${X1 - rx}px; font-size:40px; font-weight:${ask ? 600 : 800}; line-height:1.1; color:${ask ? 'var(--g-soft)' : 'var(--g-ink)'}">${h(b).replace('\n', '<br>')}</p>`).join('');
    return board(v, x, {
      title: 'Made for real spreadsheets, not tidy ones',
      body: `<p class="h-abs" style="top:${TOP + 150}px; width:${CW}px; font-size:30px; line-height:1.2; color:var(--g-soft)">You typed it · we read it</p>${html}
        <p class="h-abs" style="top:${top + rows.length * rh + 18}px; font-size:32px; line-height:1.3; color:var(--g-ink)">A puzzle that isn’t in our catalogue stays yours, just for you, until it’s matched. Dates with only a month or a year stay that way.</p>
        <p class="h-abs" style="top:${top + rows.length * rh + 150}px; font-size:40px; font-weight:700; line-height:1.15; color:var(--c-hot)">We’ve seen things.</p>`,
      src: 'Examples from real spreadsheets puzzlers keep',
    });
  };

  const why = () => {
    const x = ctx('why');
    const v0 = fmtInt(s.backdated), size = heroFit(v0, 220);
    const n = s.oneIn, pw = CW / n, top = 820;
    const jig = generateJigsaw({ cols: n, rows: 1, width: CW, height: pw, x: X0, y: top, seed: 58, tabSize: 0.26 });
    const art = jig.pieces.map((p, i) => `<path d="${p.d}" fill="${i === 0 ? 'var(--c-hot)' : 'var(--c-base)'}" stroke="var(--g-bg)" stroke-width="3" stroke-linejoin="round"/>`).join('');
    return board(v, x, {
      title: 'Why we built it',
      body: svg(art) + `
        <p class="h-abs" style="top:${TOP + 120}px; font-size:${size}px; font-weight:800; line-height:1; letter-spacing:-0.02em; color:var(--c-hot); font-variant-numeric:tabular-nums">${v0}</p>
        <p class="h-abs h-lead" style="top:${TOP + 140 + size}px; font-size:42px">old results backfilled by hand in the last 12 months: puzzlers typing in their whole history, one result at a time.</p>
        <p class="h-abs" data-qa-small style="top:${top - 46}px; font-size:26px; color:var(--g-soft)">1 in ${n} of all results added on MSP</p>
        <p class="h-abs" style="top:${f1(top + pw + 40)}px; font-size:34px; line-height:1.3; color:var(--g-ink)">By ${fmtInt(s.puzzlers)} puzzlers. ${s.p100} of them backfilled over 100.</p>
        <p class="h-abs" style="top:${f1(top + pw + 108)}px; font-size:44px; font-weight:700; line-height:1.15; color:var(--c-hot)">Your fingers deserve a break.</p>
        <p class="h-abs" data-qa-small style="top:${f1(top + pw + 200)}px; font-size:24px; line-height:1.3; color:var(--g-soft)">Counted: results added since ${s.since} whose solve date was over 30 days earlier. Private profiles left out.</p>`,
      src,
    });
  };

  const code = () => {
    const x = ctx('code'), c = s.code;
    const cols = 10, rws = Math.ceil(c.prs / cols), pw = CW / cols, top = 600;
    const jig = generateJigsaw({ cols, rows: rws, width: CW, height: rws * pw, x: X0, y: top, seed: 74, tabSize: 0.26 });
    const art = jig.pieces.filter(p => p.row * cols + p.col < c.prs).map(p => `<path d="${p.d}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="3" stroke-linejoin="round"/>`).join('');
    const yS = top + rws * pw + 70;
    const stat = (big: string, label: string) => `<div style="flex:1"><p style="font-size:60px; font-weight:800; line-height:1; color:var(--g-ink); white-space:nowrap">${big}</p><p style="font-size:30px; line-height:1.25; color:var(--g-soft); margin-top:10px">${label}</p></div>`;
    return board(v, x, {
      title: 'Looks like one menu item.',
      body: svg(art) + `
        <p class="h-abs" style="top:${TOP + 82}px; font-size:76px; font-weight:800; line-height:1.05; letter-spacing:-0.02em; color:var(--g-ink)">It’s <span style="color:var(--c-hot)">${thousandsDown(c.code)}+</span> lines of code.</p>
        <p class="h-abs" style="top:${TOP + 270}px; font-size:34px; line-height:1.3; color:var(--g-soft)">Built and shipped in 3 days, in ${c.prs} updates:</p>
        <p class="h-abs" data-qa-small style="top:${top - 44}px; font-size:26px; color:var(--g-soft)">1 piece = 1 update</p>
        <div class="h-abs" style="top:${yS}px; display:flex; gap:36px">${stat(thousandsNear(c.tests), 'lines of tests, so it doesn’t break your data')}</div>`,
      src: `Code: GitHub, pull requests #${IMPORT_PRS[0]}–#${IMPORT_PRS[IMPORT_PRS.length - 1]}`,
    });
  };

  const sandbox = () => {
    const x = ctx('sandbox');
    const pw = 290, top = 520, left = X0 + 92;
    const jig = generateJigsaw({ cols: 3, rows: 3, width: pw * 3, height: pw * 3, x: left - pw, y: top - pw, seed: 12, tabSize: 0.27 });
    const mid = jig.pieces.find(p => p.row === 1 && p.col === 1)!;
    const art = `<g transform="translate(6 10)"><path d="${mid.d}" fill="rgba(10,14,22,.4)"/></g><path d="${mid.d}" fill="var(--c-base)"/>${plaster(left + pw / 2, top + pw / 2, 330, -32)}`;
    const tx = left + pw + 110;
    return board(v, x, {
      title: 'It’s a first version. It will trip somewhere.',
      body: svg(art) + `
        <p class="h-abs" style="top:${TOP + 166}px; font-size:38px; line-height:1.3; color:var(--g-ink)">That’s where you come in: throw your weirdest spreadsheet at it.</p>
        <p class="h-abs" style="left:${tx}px; top:${top - 20}px; width:${X1 - tx}px; font-size:34px; line-height:1.3; color:var(--g-soft)">Want to go all in? Our <b style="color:var(--g-ink)">sandbox</b> is a test copy of MySpeedPuzzling. Nothing there touches your real profile.</p>
        <p class="h-abs" style="top:${top + pw + 130}px; font-size:64px; font-weight:800; line-height:1.1; color:var(--c-hot)">Break it there. Gently.</p>
        <p class="h-abs" style="top:${top + pw + 226}px; font-size:40px; line-height:1.25; color:var(--g-ink)">Comment <b>SANDBOX</b> and we’ll DM you.</p>`,
      src: '',
    });
  };

  const cta = () => {
    const x = ctx('cta');
    const g = GROUNDS.navyDeep;
    return board(v, x, {
      title: 'Tried it? Tell us everything.',
      body: `${siren(900, TOP + 96, 0.6, g.hot, '#ffb0ab', g.hot, '#5a6479', [145, 90, 35])}
        <p class="h-abs" style="top:${TOP + 100}px; width:${CW - 200}px; font-size:38px; line-height:1.3; color:var(--g-soft)">What broke, what confused you, what you wish it did. Every note makes version 2 better.</p>
        <div class="h-abs" data-qa-bg="${CORAL}" style="top:430px; background:${CORAL}; border-radius:14px; padding:34px 36px; box-sizing:border-box; text-align:center">
          <p style="margin:0; font-size:60px; font-weight:800; line-height:1.1; color:${NAVY}">DM us</p>
          <p style="margin:12px 0 0; font-size:38px; font-weight:500; line-height:1.25; color:${NAVY}">or e-mail <b>${h(s.email)}</b></p></div>
        <p class="h-abs" style="top:720px; font-size:30px; line-height:1.2; color:var(--g-soft)">Find it on myspeedpuzzling.com</p>
        <p class="h-abs" style="top:762px; font-size:40px; font-weight:700; line-height:1.2; color:var(--g-ink)">Your profile → Import a spreadsheet</p>
        <p class="h-abs" style="top:822px; font-size:32px; line-height:1.3; color:var(--g-soft)">Free for every account. The guide walks you through it.</p>
        <p class="h-abs" style="top:960px; font-size:46px; font-weight:800; line-height:1.15; color:var(--g-ink)">Know someone with a <span style="color:var(--c-hot)">legendary</span> puzzle spreadsheet? Send them this.</p>`,
      src: 'myspeedpuzzling.com/en/import-your-spreadsheet',
      // Owner 2026-11-15: the guide's address on one line (it needs /en; the address without it is a 404).
      css: '.h-foot .h-src { white-space: nowrap; letter-spacing: -0.01em; } .h-foot .h-site { font-size: 1em; }',
    });
  };

  return [cover(), steps(), chaos(), why(), code(), sandbox(), cta()];
}

export function importAlt(s: ImportSpec): string[] {
  const c = s.code;
  return [
    `Cover on a coral and navy puzzle poster: Break it. (Gently.) Spreadsheet import is live on MySpeedPuzzling. It's brand new, and we want you to test it. Below, a small spreadsheet with columns Puzzle, Time, Date and Notes, its dates written in different ways, wrapped in coral parcel tape that says FRAGILE, HANDLE WITH CARE, and a coral siren.`,
    `Years of puzzles in a spreadsheet? Bring them in. Five steps as a column of five interlocking puzzle pieces: 1 File: Excel (.xlsx), CSV, or a Google Sheets link. 2 Check: we read your columns and ask only what's unclear. 3 People: pair and team partners become players. 4 Puzzles: your rows matched to the MSP catalogue. 5 Add: you pick what goes in; changed your mind? Undo. Times (solo, pair, team), your collection and your wish list. Never added twice. Your profile, Import a spreadsheet.`,
    `Made for real spreadsheets, not tidy ones. What you typed and what the import reads: 8min reads as 8:00; 1h23 as 1:23:00; 1:40ish gets one question: hours or minutes?; Sept 2020 as September 2020; 13x99 asks you first. A puzzle that isn't in the catalogue stays yours, just for you, until it's matched. Dates with only a month or a year stay that way. We've seen things.`,
    `Why we built it: ${fmtInt(s.backdated)} old results were backfilled by hand in the last 12 months: puzzlers typing in their whole history, one result at a time. A strip of ${s.oneIn} puzzle pieces with one in coral: 1 in ${s.oneIn} of all results added on MSP. By ${fmtInt(s.puzzlers)} puzzlers; ${s.p100} of them backfilled over 100. Your fingers deserve a break.`,
    `Looks like one menu item. It's ${thousandsDown(c.code)}+ lines of code, built and shipped in 3 days in ${c.prs} updates, shown as ${c.prs} coral puzzle pieces, one per update. ${thousandsNear(c.tests)} lines of tests, so it doesn't break your data.`,
    `It's a first version. It will trip somewhere. That's where you come in: throw your weirdest spreadsheet at it. A puzzle piece with a coral sticking plaster across it. Want to go all in? Our sandbox is a test copy of MySpeedPuzzling; nothing there touches your real profile. Break it there. Gently. Comment SANDBOX and we'll DM you.`,
    `Tried it? Tell us everything: what broke, what confused you, what you wish it did. Every note makes version 2 better. DM us or e-mail ${s.email}. Find it on myspeedpuzzling.com: Your profile, Import a spreadsheet. Free for every account; the guide walks you through it. Know someone with a legendary puzzle spreadsheet? Send them this.`,
  ];
}

export function importCaption(s: ImportSpec): string {
  const c = s.code;
  return [
    `${fmtInt(s.backdated)} old results backfilled by hand in 12 months. Never again: spreadsheet import is live on MySpeedPuzzling 🧩`,
    '',
    'Upload Excel or CSV, or paste a Google Sheets link. We read your columns, match your rows to puzzles in the catalogue, and you add what you want: solo, pair and team puzzle times, your puzzle collection, your wish list. Never twice, with Undo.',
    '',
    `It's a first version (${thousandsDown(c.code)}+ lines of code, built in 3 days), so it will trip over some sheets. Break it. Gently 🙏 Want to test it hard? Comment "sandbox" and we'll DM you access to our test copy of MSP.`,
    '',
    `Found a bug? DM us or e-mail ${s.email}. It's free: Your profile → Import a spreadsheet.`,
    '',
    'Know someone with a legendary puzzle spreadsheet? Send them this.',
    '',
    '#speedpuzzling #jigsawpuzzle #puzzlecollection #puzzletracker',
  ].join('\n');
}
