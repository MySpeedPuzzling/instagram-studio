// The monthly recap (first: October 2026, owner 2026-11-01), in the house style (HOUSE = H4). A carousel on the 1st
// (a regular Reel on the same topic follows later in the week as a different, visual experience):
//   cover    poster: the month as the big text, "Monthly report", the dates; solves, puzzlers, year on year;
//   chart    solves per month since January 2025, this month hot, the previous record in the accent;
//   mosaic   the month's 1000 most-solved puzzles sorted by colour into one generator piece (DL4 H4-26);
//   zoom     the 3×3 neighbourhood of No. 1 with ranks and credits (H4-27);
//   brands   the same tiles regrouped by brand (H4-28);
//   numbers  the month in numbers, and the question: can you spot the last puzzle you solved?
// Counting: results logged in the month, like MSP's statistics page (owner 2026-11-01: match the website; older solves
// typed in count too). No names or speed boards: the Weekly Numbers the next day carries those. Every number comes
// from the facts snapshot.
import { CW, FEED, GROUNDS, W, X0, X1, cover, f1, slide, slotOf, type SlideCtx, type Variant } from '../design/house.ts';
import { barGeometry } from '../design/svg.ts';
import { escapeHtml as h, fmtInt, fmtSignedPct } from '../design/page.ts';
import { colourField, colourFamily, pieceCells, tileUrl, type Cell, type MosaicBox, type Tone } from './mosaic.ts';

export interface MonthBox extends MosaicBox { pieces: number; solvers: number; results: number }
export interface MonthlySpec {
  key: 'month';
  /** "2026-10". */
  month: string;
  results: number;
  puzzlers: number;
  puzzles: number;
  pieces: number;
  hours: number;
  countries: number;
  newPuzzlers: number;
  personalBests: number;
  resultsYearAgo: number;
  /** Optional caption line about the month (owner's context, e.g. why it jumped). */
  note?: string;
  history: Array<{ month: string; results: number }>;
  boxes: MonthBox[];
  tones: Map<string, Tone>;
  src: string;
}

const monthName = (ym: string, month: 'short' | 'long' = 'long') => new Date(ym + '-01T12:00:00Z').toLocaleDateString('en-US', { month, timeZone: 'UTC' });
const year = (ym: string) => ym.slice(0, 4);
const lastDay = (ym: string) => new Date(Date.UTC(Number(year(ym)), Number(ym.slice(5, 7)), 0)).getUTCDate();
/** "1–31 Oct 2026". */
export const monthRange = (ym: string) => `1–${lastDay(ym)} ${monthName(ym, 'short')} ${year(ym)}`;

/** The previous record month (before this one) and whether this month beats it. */
export function record(s: MonthlySpec) {
  const before = s.history.filter(m => m.month < s.month);
  const prev = before.reduce((a, b) => (b.results > a.results ? b : a), before[0]);
  return { prev, isRecord: s.results > prev.results };
}
const yoyPct = (s: MonthlySpec) => ((s.results - s.resultsYearAgo) / s.resultsYearAgo) * 100;
const yearsOf = (hours: number) => Math.round((hours / 8766) * 10) / 10;

const CSS = `<style>
.mo-tile { position: absolute; display: block; }
.mo-pill { position: absolute; padding: 0 12px; height: 40px; line-height: 40px; border-radius: 20px; background: var(--g-bg); color: var(--g-ink); font-size: 26px; font-weight: 700; }
.mo-cr { font-size: 26px; line-height: 1.32; color: var(--g-soft); }
.mo-cr b { color: var(--g-ink); font-weight: 600; }
.mo-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 56px; row-gap: 36px; }
.mo-grid .v { font-size: 80px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.mo-grid .v.hot { color: var(--g-hot); }
.mo-grid .k { font-size: 30px; line-height: 1.25; margin-top: 10px; color: var(--g-soft); }
.mo-ask { font-size: 44px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em; color: var(--g-ink); }
.mo-ask-s { font-size: 30px; line-height: 1.3; margin-top: 16px; color: var(--g-soft); }
</style>`;

const PITCH = 20, GAP = 1;

export function monthlySlides(v: Variant, s: MonthlySpec): string[] {
  const name = monthName(s.month), label = `${name} ${year(s.month)}`;
  const kick = `Monthly report · ${label}`;
  const range = monthRange(s.month);
  const { prev, isRecord } = record(s);
  const n = s.boxes.length;
  const order = ['cover', 'chart', 'mosaic', 'zoom', 'brands', 'numbers'] as const;
  const ctx = (k: typeof order[number]): SlideCtx => ({ v, post: s.key, slide: order.indexOf(k) + 1, of: order.length });

  const pc = pieceCells(n, PITCH, 4, 0.2);
  const assign = colourField(pc.cells, s.boxes, s.tones);
  const rank = new Map(s.boxes.map((b, i) => [b.puzzleId, i + 1]));
  const brandCount = new Set(s.boxes.map(b => b.brand)).size;
  const solves = s.boxes.reduce((t, b) => t + b.results, 0);
  const share = Math.round((solves / s.results) * 100);
  // The tiles' gaps and the piece's outline show the ground, so the mosaic sits on any ground.
  const mosaic = (ox: number, oy: number, scale = 1) => `
    <div style="position:absolute; left:${f1(ox)}px; top:${f1(oy)}px; width:${f1(pc.w)}px; height:${f1(pc.h)}px; transform-origin:0 0; transform:scale(${scale}); clip-path:path('${pc.d}'); background:var(--g-bg)">
      ${pc.cells.map(cell => `<img class="mo-tile" src="${tileUrl(assign.get(cell)!)}" alt="" style="left:${cell.x + GAP / 2}px; top:${cell.y + GAP / 2}px; width:${PITCH - GAP}px; height:${PITCH - GAP}px">`).join('')}
      <svg style="position:absolute; left:0; top:0" width="${f1(pc.w)}" height="${f1(pc.h)}"><path d="${pc.d}" fill="none" stroke="var(--g-bg)" stroke-width="${f1(10 / scale)}"/></svg>
    </div>`;
  const credit = `${fmtInt(n)} most-solved of ${label} · ${brandCount} brands · box art: publishers`;

  const make: Record<typeof order[number], () => string> = {
    // Owner 2026-10-18: a recurring report's cover says what it is (period big, "report", dates); numbers in the strip.
    cover: () => cover(ctx('cover'), 'cover', {
      kicker: kick, title: 'Monthly report', dek: isRecord ? `${range} · our biggest month ever` : range, src: s.src,
      hero: { value: name, max: 300 },
      stats: [['Results', fmtInt(s.results)], ['Puzzlers', fmtInt(s.puzzlers)], ['Year on year', fmtSignedPct(yoyPct(s), 0)]],
    }),

    chart: () => {
      const CH = 560, top = 560;
      const cur = s.history.find(m => m.month === s.month)!;
      const g = barGeometry(s.history, { x: d => d.month, y: d => d.results, width: CW, height: CH, padding: 0.2, yMax: Math.max(...s.history.map(d => d.results)) * 1.14 });
      const fill = (d: typeof cur) => (d === cur ? 'var(--c-hot)' : d === prev ? 'var(--c-cool)' : 'var(--c-base)');
      const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${fill(b.datum)}"/>`).join('');
      const bCur = g.bars.find(b => b.datum === cur)!, bPrev = g.bars.find(b => b.datum === prev)!;
      const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
      // A record month right before this one: its value ends at its bar's edge (centred, it runs into the hot bar).
      const adjacent = g.bars.indexOf(bCur) - g.bars.indexOf(bPrev) === 1;
      const jan = g.bars.filter(b => b.datum.month.endsWith('-01'));
      const title = isRecord ? `${name} was our biggest month ever` : `${name} on MSP, month by month`;
      return slide(ctx('chart'), 'data', { kicker: kick, src: s.src, title, body: `
        <p class="h-abs h-dek" style="top:${FEED.contentTop + 170}px">Results logged per month. ${isRecord ? `${fmtInt(s.results - prev.results)} more than the record from ${monthName(prev.month)}.` : ''}</p>
        <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top}px" aria-hidden="true">
          ${bars}
          <text class="c-hot" x="${f1(bCur.x + bCur.width)}" y="${f1(bCur.y - 18)}" text-anchor="end">${fmtInt(cur.results)}</text>
          ${adjacent
            ? `<text class="c-lab-b" x="${f1(bPrev.x + bPrev.width)}" y="${f1(bPrev.y - 18)}" text-anchor="end">${fmtInt(prev.results)}</text>`
            : `<text class="c-lab-b" x="${f1(mid(bPrev))}" y="${f1(bPrev.y - 18)}" text-anchor="middle">${fmtInt(prev.results)}</text>`}
          ${jan.map((b, i) => `<text class="c-lab" x="${f1(i === 0 ? b.x : mid(b))}" y="${CH + 46}" text-anchor="${i === 0 ? 'start' : 'middle'}">${h(`${monthName(b.datum.month, 'short')} ${year(b.datum.month)}`)}</text>`).join('')}
          ${!adjacent ? `<text class="c-lab-b" x="${f1(mid(bPrev))}" y="${CH + 48}" text-anchor="middle">${h(monthName(prev.month, 'short'))}</text>` : ''}
          <text class="c-lab-b" x="${f1(bCur.x + bCur.width)}" y="${CH + 48}" text-anchor="end">${h(monthName(s.month, 'short'))}</text>
        </svg>` }).html;
    },

    mosaic: () => {
      const top = 268, room = FEED.contentBottom - top;
      const sc = Math.min(1, room / pc.h, CW / pc.w);
      return slide(ctx('mosaic'), 'image', { kicker: kick, src: credit, title: `${name} in ${fmtInt(n)} puzzles`, body: CSS + mosaic((W - pc.w * sc) / 2, top + (room - pc.h * sc) / 2, sc) }).html;
    },

    zoom: () => {
      const top1 = s.boxes[0];
      const cellOf = [...assign.entries()].find(([, b]) => b.puzzleId === top1.puzzleId)![0];
      const at = new Map(pc.cells.map(cl => [`${cl.col},${cl.row}`, cl] as [string, Cell]));
      let win = { c0: cellOf.col - 1, r0: cellOf.row - 1, score: -1 };
      for (let dc = -2; dc <= 0; dc++) for (let dr = -2; dr <= 0; dr++) {
        let f = 0;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (at.has(`${cellOf.col + dc + i},${cellOf.row + dr + j}`)) f++;
        const score = f + (dc === -1 && dr === -1 ? 0.5 : 0);
        if (score > win.score) win = { c0: cellOf.col + dc, r0: cellOf.row + dr, score };
      }
      const zoom: Array<{ b: MonthBox; i: number; j: number }> = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const cl = at.get(`${win.c0 + i},${win.r0 + j}`);
        if (cl) zoom.push({ b: assign.get(cl)!, i, j });
      }
      const list = [...zoom].sort((a, b) => rank.get(a.b.puzzleId)! - rank.get(b.b.puzzleId)!);
      const g = GROUNDS[v.ground(slotOf(ctx('zoom'), 'image'))];
      const zs = 128, zg = 8, zx = X0, zy = 324, zw = 3 * zs + 2 * zg;
      const mapScale = 0.4, mapX = X1 - pc.w * mapScale, mapY = zy + (zw - pc.h * mapScale) / 2;
      const win1 = { x: mapX + win.c0 * PITCH * mapScale, y: mapY + win.r0 * PITCH * mapScale, s: 3 * PITCH * mapScale };
      const listY = zy + zw + 30;
      const t1 = s.tones.get(top1.img)!;
      return slide(ctx('zoom'), 'image', { kicker: 'Zoom in', src: `Box art by their publishers · ${s.src}`, title: 'Every tile is one puzzle, sorted by colour', titleSize: 's', body: CSS + `
        ${zoom.map(z => {
          const t = s.tones.get(z.b.img)!, cr = t.crop!, k = zs / cr.s;
          return `<div style="position:absolute; left:${zx + z.i * (zs + zg)}px; top:${zy + z.j * (zs + zg)}px; width:${zs}px; height:${zs}px; overflow:hidden; border-radius:3px">
            <img src="${z.b.img}" alt="" style="position:absolute; left:${f1(-cr.x * k)}px; top:${f1(-cr.y * k)}px; width:${f1(t.w * k)}px; height:${f1(t.h_px * k)}px; max-width:none"></div>`;
        }).join('')}
        ${zoom.filter(z => z.b.puzzleId === top1.puzzleId).map(z => `<div style="position:absolute; left:${zx + z.i * (zs + zg) - 9}px; top:${zy + z.j * (zs + zg) - 9}px; width:${zs + 6}px; height:${zs + 6}px; border:6px solid var(--c-hot); border-radius:6px"></div>`).join('')}
        ${zoom.map(z => `<span class="mo-pill" data-qa-bg="${g.bg}" data-qa-small style="left:${zx + z.i * (zs + zg) + 6}px; top:${zy + z.j * (zs + zg) + zs - 46}px">${rank.get(z.b.puzzleId)}</span>`).join('')}
        ${mosaic(mapX, mapY, mapScale)}
        <svg style="position:absolute; left:${zx + zw}px; top:${zy}px" width="${f1(mapX - zx - zw)}" height="${zw}" viewBox="0 0 ${f1(mapX - zx - zw)} ${zw}">
          <path d="M 8 0 L ${f1(win1.x - zx - zw)} ${f1(win1.y - zy)} M 8 ${zw} L ${f1(win1.x - zx - zw)} ${f1(win1.y - zy + win1.s)}" stroke="var(--c-hot)" stroke-width="3" fill="none"/></svg>
        <div style="position:absolute; left:${f1(win1.x - 3)}px; top:${f1(win1.y - 3)}px; width:${f1(win1.s + 6)}px; height:${f1(win1.s + 6)}px; box-sizing:border-box; border:3px solid var(--c-hot)"></div>
        <div class="h-abs" style="top:${listY}px">
          <ol class="mo-cr" data-qa-small style="list-style:none; margin:0; padding:0">
            ${list.map(z => `<li><b>No. ${rank.get(z.b.puzzleId)}</b> ${h(z.b.puzzle)} · ${h(z.b.brand)} · ${fmtInt(z.b.solvers)} puzzlers</li>`).join('')}
          </ol>
          <p class="h-body" style="margin-top:16px; font-size:30px">No. 1 sits among the ${colourFamily(t1.crop ?? t1)}. Together the ${fmtInt(n)} were logged <b style="color:var(--g-ink)">${fmtInt(solves)}</b> times, ${share}% of all ${fmtInt(s.results)} results in ${h(name)}.</p>
        </div>` }).html;
    },

    brands: () => {
      const byBrand = new Map<string, MonthBox[]>();
      for (const b of s.boxes) byBrand.set(b.brand, [...(byBrand.get(b.brand) ?? []), b]);
      const ranked = [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
      const [lead, ...rest] = ranked;
      const side = rest.slice(0, 8), tail = rest.slice(8), tailBoxes = tail.flatMap(([, bs]) => bs);
      const block = (boxes: MonthBox[], cols: number, bx: number, by: number) => {
        const rows = Math.ceil(boxes.length / cols);
        const cells: Cell[] = boxes.map((_, i) => ({ col: Math.floor(i / rows), row: i % rows, x: Math.floor(i / rows) * PITCH, y: (i % rows) * PITCH, cx: 0, cy: 0 }));
        const a = colourField(cells, boxes, s.tones);
        return { h: rows * PITCH, html: cells.map(cl => `<img class="mo-tile" src="${tileUrl(a.get(cl)!)}" alt="" style="left:${bx + cl.x}px; top:${by + cl.y}px; width:${PITCH - GAP}px; height:${PITCH - GAP}px">`).join('') };
      };
      const leftCols = 25, rightX = X0 + leftCols * PITCH + 44, rightCols = Math.floor((X1 - rightX + GAP) / PITCH);
      const lbl = (k: number, nm: string, lx: number, ly: number, w: number, big = false) =>
        `<p style="position:absolute; left:${lx}px; top:${ly}px; width:${w}px; font-size:${big ? 40 : 30}px; line-height:1.1; font-weight:500; color:var(--g-ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis"><b style="font-weight:700">${fmtInt(k)}</b> ${h(nm)}</p>`;
      const y0 = 268;
      let html = '', y = y0;
      html += lbl(lead[1].length, lead[0], X0, y, leftCols * PITCH, true);
      const lb = block(lead[1], leftCols, X0, y + 58);
      html += lb.html;
      y += 58 + lb.h + 32;
      html += lbl(tailBoxes.length, `from ${tail.length} more brands`, X0, y, leftCols * PITCH);
      html += block(tailBoxes, leftCols, X0, y + 46).html;
      let ry = y0 + 10;
      for (const [nm, bs] of side) {
        html += lbl(bs.length, nm, rightX, ry, X1 - rightX);
        const b = block(bs, rightCols, rightX, ry + 44);
        html += b.html;
        ry += 44 + b.h + 22;
      }
      return slide(ctx('brands'), 'image', { kicker: `The same ${fmtInt(n)}, by brand`, src: `Box art by their publishers · ${s.src}`, title: `${fmtInt(byBrand.size)} brands made ${name}`, body: CSS + html }).html;
    },

    numbers: () => {
      const yrs = yearsOf(s.hours);
      const cells: Array<[string, string, boolean?]> = [
        [fmtInt(s.hours), `hours: ${yrs} years non-stop`, true],
        [fmtInt(s.pieces), 'pieces put in place'],
        [fmtInt(s.puzzles), 'different puzzles'],
        [fmtInt(s.personalBests), 'personal bests'],
        [fmtInt(s.newPuzzlers), 'new puzzlers joined'],
        [fmtInt(s.countries), 'countries'],
      ];
      const gridTop = 296, sc = 0.4, mx = X0, my = 852;
      return slide(ctx('numbers'), 'data', { kicker: kick, src: s.src, title: `${name} in numbers`, body: CSS + `
        <div class="h-abs mo-grid" style="top:${gridTop}px">
          ${cells.map(([val, k, hot]) => `<div><p class="v${hot ? ' hot' : ''}">${val}</p><p class="k">${h(k)}</p></div>`).join('')}
        </div>
        ${mosaic(mx, my, sc)}
        <div style="position:absolute; left:${f1(mx + pc.w * sc + 44)}px; width:${f1(X1 - (mx + pc.w * sc + 44))}px; top:${f1(my + (pc.h * sc) / 2 - 104)}px">
          <p class="mo-ask">Is the last puzzle you solved in there?</p>
          <p class="mo-ask-s">Swipe back to the piece and tell us in the comments.</p>
        </div>` }).html;
    },
  };
  return order.map(k => make[k]());
}

export function monthlyAlt(s: MonthlySpec): string[] {
  const name = monthName(s.month), { prev, isRecord } = record(s);
  const n = s.boxes.length, top = s.boxes[0];
  const brands = new Map<string, number>();
  for (const b of s.boxes) brands.set(b.brand, (brands.get(b.brand) ?? 0) + 1);
  const [lead] = [...brands.entries()].sort((a, b) => b[1] - a[1]);
  return [
    `Cover: ${name}, monthly report, ${monthRange(s.month)}${isRecord ? ', our biggest month ever' : ''}. ${fmtInt(s.results)} results logged by ${fmtInt(s.puzzlers)} puzzlers, ${fmtSignedPct(yoyPct(s), 0)} on ${name} ${Number(year(s.month)) - 1}.`,
    `Bar chart of results logged per month since January 2025, rising over time. ${name} ${year(s.month)} is the tallest bar with ${fmtInt(s.results)}; the previous record, ${monthName(prev.month)} ${year(prev.month)}, had ${fmtInt(prev.results)}.`,
    `A big jigsaw piece made of ${fmtInt(n)} tiny box images, the most-solved puzzles of ${name}, sorted by colour: reds and oranges on the left, then yellows and greens, blues and purples on the right.`,
    `Zoom into the piece: nine box images around No. 1, ${top.puzzle} by ${top.brand}, solved by ${fmtInt(top.solvers)} puzzlers in ${name}.`,
    `The same ${fmtInt(n)} tiles regrouped by brand: ${lead[1]} ${lead[0]} puzzles form the biggest block, then smaller blocks for the next brands and the rest.`,
    `${name} in numbers: ${fmtInt(s.hours)} hours of puzzling, ${fmtInt(s.pieces)} pieces, ${fmtInt(s.puzzles)} different puzzles, ${fmtInt(s.personalBests)} personal bests, ${fmtInt(s.newPuzzlers)} new puzzlers, ${s.countries} countries. Is the last puzzle you solved in there?`,
  ];
}

export function monthlyCaption(s: MonthlySpec): string {
  const name = monthName(s.month), { prev, isRecord } = record(s);
  const n = s.boxes.length;
  return [
    `Monthly report, ${name} (${monthRange(s.month)}): ${fmtInt(s.results)} puzzles logged${isRecord ? `, our biggest month ever` : ''} 🧩`,
    '',
    `${fmtInt(s.puzzlers)} puzzlers logged ${fmtInt(s.puzzles)} different puzzles, ${fmtSignedPct(yoyPct(s), 0)} on ${name} last year${isRecord ? ` and ${fmtInt(s.results - prev.results)} more than the old record from ${monthName(prev.month)}` : ''}. Together that's ${fmtInt(s.hours)} hours of puzzling.${s.note ? ` ${s.note}` : ''}`,
    '',
    `Slide 3 is ${name} in one piece: the ${fmtInt(n)} most-solved puzzles of the month, one tile each, sorted by colour. Is the last puzzle you solved in there? Tell us in the comments.`,
    '',
    'Box art by their publishers. Thank you for every solve you logged ⏱️',
    '',
    '#speedpuzzling #jigsawpuzzle #puzzlecommunity #puzzletime',
  ].join('\n');
}
