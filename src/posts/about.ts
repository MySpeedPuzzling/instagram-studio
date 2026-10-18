// "Start here" explainer (the third pinned post): what MySpeedPuzzling is, what a puzzler can do there, how to join.
// House style (HOUSE = H4): a poster cover with the community's size, then one idea per navy board slide, each with its
// number and a visual built from real things (generator pieces, box images, charts from the data):
//   1 cover: 11,000+ puzzlers, what MSP is;            2 time it, log it: logged times by kind (solo, pairs, teams);
//   3 the puzzle database: a wall of real boxes;        4 watch yourself improve: the same puzzlers, 1st to 20th puzzle;
//   5 competitions: the total, a typical six weeks drawn as pieces;   6 what's free (and what membership adds, honestly);
//   7 how to start, then the question to the community.
// Every number comes from the facts snapshot (fresh queries on the day); titles round numbers down ("11,000+") so the
// pinned post stays true as the community grows, exact values sit in the stat strips next to the date.
import { CW, X0, artCover, clock, cover, f1, hero, heroFit, pieceMark, slide, type ArtBand, type SlideCtx, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';

export interface AboutBox { puzzle: string; brand: string; img: string }
export interface AboutEvent { date: string; country: string; online: boolean }
/** The same puzzlers' typical time (minutes) on their Nth new 500-piece solo, and how many got faster by the 20th. */
export interface Improvement { puzzlers: number; points: Array<[number, number]>; shareFaster: number; medianGainPct: number }

export interface AboutSpec {
  key: string;
  /** Footer source line with the query date. */
  src: string;
  /** Registered players without a private profile, and their countries. */
  players: number;
  countries: number;
  puzzles: number;
  brands: number;
  /** Logged times by kind and the hours behind them. */
  kinds: { solo: number; duo: number; team: number; hours: number };
  pieces: number;
  improve: Improvement;
  /** Which cover variant (lab AB1) slide 1 uses; default C1 (owner pick 2026-10-18). */
  coverKey?: string;
  /** The fastest solo 500-piece time on MSP, in seconds (no player named). */
  fastest500s: number;
  /** Events on the calendar so far, and the ones in the coming window. */
  eventsTotal: number;
  upcoming: AboutEvent[];
  /** First day of the window (YYYY-MM-DD) and its length in weeks. */
  from: string;
  weeks: number;
  boxes: AboutBox[];
}

/** Round down to two significant figures: 11,780 → "11,000+", 551,251 → "550,000+", 43,072 → "43,000+". */
export function plus(n: number): string {
  const step = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, n))) - 1);
  return `${fmtInt(Math.floor(n / step) * step)}+`;
}
/** "278 million" for big counts. */
// Evergreen (owner 2026-10-18): the post is pinned for months, so counts are floors that stay true as they grow.
const millions = (n: number) => `${Math.floor(n / 1e7) * 10}+ million`;
/** Countries and other small counts: down to the ten, 86 → "80+". */
export const tens = (n: number) => `${Math.floor(n / 10) * 10}+`;
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
/** Minutes → "43 min" / "1 h 05". */
export function fmtMin(m: number): string {
  const t = Math.round(m);
  return t < 60 ? `${t} min` : `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')}`;
}
const total = (s: AboutSpec) => s.kinds.solo + s.kinds.duo + s.kinds.team;
const dayMs = 86_400_000;
const weekOf = (s: AboutSpec, date: string) => Math.floor((Date.parse(date) - Date.parse(s.from)) / (7 * dayMs));
const countriesOf = (ev: AboutEvent[]) => new Set(ev.map(e => e.country.toLowerCase())).size;

const CSS = `<style>
.ab-row { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; align-items: center; gap: 24px; }
.ab-row .nm { width: 190px; font-size: 38px; font-weight: 700; color: var(--g-ink); }
.ab-row .ct { width: 200px; text-align: right; font-size: 38px; font-weight: 700; color: var(--g-ink); }
.ab-row .track { flex: 1; height: 40px; position: relative; }
.ab-row .track i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--g-ink); }
.ab-row.hot .track i { background: var(--g-hot); }
.ab-box { position: absolute; }
.ab-box .h-mount { position: static; width: 100%; padding: 8px; box-sizing: border-box; }
.ab-box .h-mount img { border-radius: 4px; }
.ab-box p { margin-top: 12px; font-size: 30px; line-height: 1.15; color: var(--g-soft); text-align: center; white-space: nowrap; }
.ab-list { position: absolute; left: ${X0}px; width: ${CW}px; }
.ab-list li { list-style: none; display: flex; align-items: center; gap: 26px; height: 92px; border-bottom: 2px solid var(--g-band); font-size: 38px; font-weight: 500; color: var(--g-ink); }
.ab-list li svg { flex: none; }
.ab-step { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; align-items: flex-start; gap: 30px; }
.ab-step .n { flex: none; width: 76px; font-size: 54px; font-weight: 700; line-height: 1; color: var(--g-hot); }
.ab-step .t { font-size: 40px; line-height: 1.22; font-weight: 500; color: var(--g-ink); }
.ab-step .t b { font-weight: 700; }
.ab-step .t span { display: block; margin-top: 6px; font-size: 32px; font-weight: 400; color: var(--g-soft); }
</style>`;

export function aboutSlides(v: Variant, s: AboutSpec): string[] {
  const n = 7;
  const ctx = (i: number): SlideCtx => ({ v, post: s.key, slide: i, of: n });
  const K = 'Start here';

  // 1 · cover: one of the "new here?" variants (lab AB1); owner picked C1, the missing piece (2026-10-18).
  const c1 = aboutCovers(v, s, n).find(c => c.key === (s.coverKey ?? 'C1'))!.html;

  // 2 · time it, log it: the hero count of logged times, then bars by kind (from zero), then hours and pieces.
  const all = total(s);
  const heroV = plus(all);
  const heroS = heroFit(heroV, 168);
  const kinds: Array<[string, number]> = [['Solo', s.kinds.solo], ['Pairs', s.kinds.duo], ['Teams', s.kinds.team]];
  const max = Math.max(...kinds.map(k => k[1]));
  const c2 = slide(ctx(2), 'data', {
    kicker: `${K} · log your times`, src: s.src, title: 'Time it, log it: solo, in a pair or as a team.', body: CSS + `
      <p class="h-abs h-dek" style="top:330px">Every solve counts. Analyse your times, compare with others, see where you can still gain.</p>
      ${hero(heroV, { size: heroS, baseline: 600 })}
      <p class="h-abs h-cap" style="top:642px">Times logged on MySpeedPuzzling</p>
      ${kinds.map(([k, val], i) => `<div class="ab-row ${i === 0 ? 'hot' : ''}" style="top:${724 + i * 84}px">
        <span class="nm">${k}</span><span class="track"><i style="width:${f1(Math.max(1.2, (val / max) * 100))}%"></i></span><span class="ct">${plus(val)}</span></div>`).join('')}
      <div class="h-abs h-strip" style="top:1000px">
        <div><p class="k">Hours puzzled</p><p class="v">${plus(s.kinds.hours)}</p></div>
        <div><p class="k">Pieces placed</p><p class="v">${millions(s.pieces)}</p></div>
      </div>`,
  }).html;

  // 3 · the puzzle database: the most-solved box of eight brands, each credited under its box.
  const cols = 4, gap = 28, bw = (CW - gap * (cols - 1)) / cols, bh = bw * 0.75 + 16;
  const boxes = s.boxes.slice(0, 8);
  const c3 = slide(ctx(3), 'image', {
    kicker: `${K} · the puzzles`, src: s.src, title: `${plus(s.puzzles)} puzzles, box images included.`, body: CSS + `
      <p class="h-abs h-dek" style="top:330px">Find yours by name, brand or code, log your time and see how others did on the same puzzle.</p>
      ${boxes.map((b, i) => {
        const x = X0 + (i % cols) * (bw + gap), y = 470 + Math.floor(i / cols) * (bh + 80);
        return `<div class="ab-box" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(bw)}px"><div class="h-mount" style="height:${f1(bh)}px"><img src="${b.img}" alt=""></div><p>${h(b.brand)}</p></div>`;
      }).join('')}
      <div class="h-abs h-strip" style="top:1000px">
        <div><p class="k">Puzzles</p><p class="v">${plus(s.puzzles)}</p></div>
        <div><p class="k">Brands</p><p class="v">${plus(s.brands)}</p></div>
      </div>`,
  }).html;

  // 4 · watch yourself improve (owner 2026-10-18: every pace is welcome, no "fastest 10%" ladders): the typical time of
  // the same puzzlers on their 1st, 5th, 10th and 20th new 500-piece puzzle, bars from zero (axis 0–2 h).
  const im = s.improve;
  const AX = 120;
  const c4 = slide(ctx(4), 'data', {
    kicker: `${K} · your progress`, src: s.src, title: `Every time counts, and you'll see yourself get faster.`, body: CSS + `
      <p class="h-abs h-dek" style="top:330px">A first 500 often takes an hour and a half. Keep logging and watch your own times drop.</p>
      <div class="h-board" style="top:470px">
        <div class="h-bh"><span style="flex:1">500 pieces, solo, new puzzles</span><span style="width:320px; text-align:right">Typical time</span></div>
      </div>
      ${im.points.map(([n, m], i, all) => `<div class="ab-row ${i === all.length - 1 ? 'hot' : ''}" style="top:${560 + i * 96}px">
        <span class="nm" style="width:300px; font-weight:${i === all.length - 1 ? 700 : 500}">${ordinal(n)} puzzle</span><span class="track"><i style="width:${f1((m / AX) * 100)}%"></i></span><span class="ct" style="width:220px">${clock(fmtMin(m))}</span></div>`).join('')}
      <div class="h-abs h-strip" style="top:1000px">
        <div><p class="k">Fastest 500</p><p class="v">${clock(mmss(s.fastest500s))}</p></div>
        <div><p class="k">Got faster</p><p class="v">${im.shareFaster >= 66 && im.shareFaster < 70 ? '2 in 3' : `${im.shareFaster}%`}</p></div>
        <div><p class="k">Typical gain</p><p class="v">${im.medianGainPct}%</p></div>
      </div>`,
  }).html;

  // 5 · competitions: the total listed as the headline (evergreen); the chart shows one sample window, "a typical six
  // weeks", one generator piece per event (filled in person, outlined online), weeks numbered instead of dated.
  const ev = s.upcoming;
  const online = ev.filter(e => e.online).length;
  const colW = CW / s.weeks;
  const PS = 58;
  const perWeek = Array.from({ length: s.weeks }, (_, w) => ev.filter(e => weekOf(s, e.date) === w).sort((a, b) => Number(a.online) - Number(b.online)));
  const base = 860;
  // One generator piece shape for every event (the house device), filled in person, outlined online.
  const piece = (online: boolean, px = PS, style = '') => {
    const mark = pieceMark(online ? 'none' : 'var(--g-ink)', px, 5);
    const m = online ? mark.replace('fill="none"', 'fill="none" stroke="var(--g-ink)" stroke-width="6"') : mark;
    return style ? m.replace('class="h-dev"', `class="h-dev" style="${style}"`) : m;
  };
  const c5 = slide(ctx(5), 'data', {
    kicker: `${K} · competitions`, src: s.src, title: `${plus(s.eventsTotal)} competitions listed, online and in person.`, body: CSS + `
      <p class="h-abs h-dek" style="top:330px">The world's fastest puzzlers compete here, and so does everyone else. Find events, follow live results; organisers run them here for free.</p>
      ${perWeek.map((list, w) => list.map((e, i) => `<div style="position:absolute; left:${f1(X0 + colW * w + (colW - PS) / 2)}px; top:${base - (i + 1) * (PS + 10)}px">${piece(e.online)}</div>`).join('')).join('')}
      <div class="h-rule" style="top:${base + 6}px"></div>
      ${perWeek.map((_, w) => `<p class="h-lab" style="position:absolute; left:${f1(X0 + colW * w)}px; width:${f1(colW)}px; top:${base + 22}px; text-align:center">Week ${w + 1}</p>`).join('')}
      <p class="h-abs h-cap" style="top:${base + 74}px">A typical ${s.weeks === 6 ? 'six' : s.weeks} weeks on the calendar</p>
      <div class="h-abs h-strip" style="top:1010px">
        <div><p class="k">${piece(false, 30, 'display:inline-block; vertical-align:-4px; margin-right:12px')}In person</p><p class="v">${ev.length - online}</p></div>
        <div><p class="k">${piece(true, 30, 'display:inline-block; vertical-align:-4px; margin-right:12px')}Online</p><p class="v">${online}</p></div>
        <div><p class="k">Countries</p><p class="v">${countriesOf(ev)}</p></div>
      </div>`,
  }).html;

  // 6 · what's free, and what membership adds (said plainly, not sold).
  const free = ['Stopwatch and your time log', 'Puzzle database with box images', 'Your personal bests and progress', 'Competitions and live results', 'XP and levels', 'Wish list and puzzle library'];
  const c6 = slide(ctx(6), 'data', {
    kicker: `${K} · what's free`, src: s.src, title: 'Free for everyone:', body: CSS + `
      <ul class="ab-list" style="top:300px">${free.map((f, i) => `<li>${pieceMark('var(--g-device)', 40, 5)}${h(f)}</li>`).join('')}</ul>
      <p class="h-abs h-dek" style="top:${300 + free.length * 92 + 60}px">An optional membership adds charts and detailed stats, achievements, the barcode scanner, and selling, swapping or lending puzzles. You can try it free for 10 days.</p>`,
  }).html;

  // 7 · how to start: a column of three interlocking generator pieces (the middle column of a 3×3 cut), one per step,
  // the first in the highlight colour; each step's text sits beside its piece. Then the question.
  const P = 170, top7 = 290;
  const jig = generateJigsaw({ cols: 3, rows: 3, width: 3 * P, height: 3 * P, seed: 11, tabSize: 0.24, jitter: 0.02 });
  const col = jig.pieces.filter(q => q.col === 1).sort((a, b) => a.row - b.row);
  const x0 = Math.min(...col.map(q => q.bbox.x)), x1 = Math.max(...col.map(q => q.bbox.x + q.bbox.width));
  const art = `<svg width="${f1(x1 - x0 + 8)}" height="${3 * P + 8}" viewBox="${f1(x0 - 4)} -4 ${f1(x1 - x0 + 8)} ${3 * P + 8}" style="position:absolute; left:${X0}px; top:${top7}px" aria-hidden="true">
    ${col.map((q, i) => `<path d="${q.d}" fill="${i === 0 ? 'var(--g-device)' : 'var(--g-ink)'}" stroke="var(--g-bg)" stroke-width="4" stroke-linejoin="round"/>
      <text x="${1.5 * P}" y="${i * P + P / 2 + 26}" text-anchor="middle" style="font-size:72px; font-weight:700; fill:var(--g-bg)">${i + 1}</text>`).join('')}
  </svg>`;
  const textX = X0 + (x1 - x0) + 44;
  const steps: Array<[string, string]> = [
    ['Open <b>myspeedpuzzling.com</b>', 'The link is in our bio.'],
    ['Sign up for free', 'With Google, Apple, Facebook, Microsoft or an e-mail code.'],
    ['Log your first time', 'Find your puzzle, in the browser on any phone or computer.'],
  ];
  const c7 = slide(ctx(7), 'data', {
    kicker: `${K} · join us`, src: s.src, title: 'Start in three steps.', body: CSS + art + `
      ${steps.map(([t, sub], i) => `<div class="ab-step" style="left:${f1(textX)}px; width:${f1(X0 + CW - textX)}px; top:${top7 + 4 + i * P + (P - 132) / 2}px"><p class="t">${t}<span>${h(sub)}</span></p></div>`).join('')}
      <p class="h-abs h-ask" style="top:${top7 + 3 * P + 90}px">What was the last puzzle you finished?</p>`,
  }).html;

  return [c1, c2, c3, c4, c5, c6, c7];
}

/** Box images are credited on every slide that shows them. */
const CREDIT = 'font-size:30px; color:var(--g-soft)';
/** At most three brands, then "and more", so the credit fits one line. */
const brandsShort = (b: AboutBox[]) => { const all = [...new Set(b.map(x => x.brand))]; return all.length > 3 ? `${all.slice(0, 3).join(', ')} and more` : all.join(', '); };

/**
 * "New here?" cover variants for the Start here post (lab AB1, owner 2026-10-18: "Are you new to (My) Speed Puzzling",
 * visually more interesting). All are H4 posters: the question on the sky top piece, art on the navy bottom piece.
 *   C1 missing piece: a real box image cut into generator pieces, one coral piece lifted out, "you";
 *   C2 box pile: real boxes fanned like a shelf, "11,000+ puzzlers already here";
 *   C3 hero: the poster with the hero number, the question as the headline (closest to the current cover);
 *   C4 box wall: seven real boxes and one dashed empty slot, "your next puzzle".
 */
export function aboutCovers(v: Variant, s: AboutSpec, of = 7): Array<{ key: string; label: string; html: string }> {
  const ctx: SlideCtx = { v, post: s.key, slide: 1, of };
  const kicker = 'Start here', src = 'Swipe for a quick tour';
  const who = `${plus(s.players)} puzzlers, every pace, ${tens(s.countries)} countries`;

  // C1 · the missing piece
  const c1 = artCover(ctx, {
    kicker, src, title: 'Are you new to speed puzzling?', dek: `${who}. You're the missing piece.`,
    art: (band: ArtBand) => {
      const cols = 5, rows = 3, P = 150;
      const jig = generateJigsaw({ cols, rows, width: cols * P, height: rows * P, seed: 7, tabSize: 0.22, jitter: 0.03 });
      const box = s.boxes[0];
      const miss = jig.pieces.find(q => q.col === 3 && q.row === 1)!;
      const rest = jig.pieces.filter(q => q !== miss);
      const bw = cols * P, bh = rows * P;
      const left = X0 + (CW - bw) / 2, top = band.top + Math.max(10, (band.bottom - band.top - bh - 70) / 2);
      const lift = `translate(${f1(P * 0.62)} ${f1(-P * 0.78)}) rotate(9 ${f1(miss.bbox.x + miss.bbox.width / 2)} ${f1(miss.bbox.y + miss.bbox.height / 2)})`;
      return `<svg width="${bw + 120}" height="${bh + 140}" viewBox="-60 -100 ${bw + 120} ${bh + 140}" style="position:absolute; left:${f1(left - 60)}px; top:${f1(top - 100)}px; overflow:visible" aria-hidden="true">
        <defs><clipPath id="ab-c1">${rest.map(q => `<path d="${q.d}"/>`).join('')}</clipPath></defs>
        <image href="${box.img}" x="0" y="0" width="${bw}" height="${bh}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ab-c1)"/>
        ${rest.map(q => `<path d="${q.d}" fill="none" stroke="var(--g-bg)" stroke-width="3" stroke-linejoin="round" opacity="0.85"/>`).join('')}
        <path d="${miss.d}" fill="var(--g-bg)" stroke="var(--g-ink)" stroke-width="4" stroke-dasharray="14 10" stroke-linejoin="round"/>
        <g transform="${lift}"><path d="${miss.d}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="4" stroke-linejoin="round"/>
          <text x="${f1(miss.bbox.x + miss.bbox.width / 2)}" y="${f1(miss.bbox.y + miss.bbox.height / 2 + 16)}" text-anchor="middle" style="font-size:48px; font-weight:800; fill:var(--g-bg)">you</text></g>
      </svg>
      <p class="h-abs" style="top:${f1(top + bh + 26)}px; ${CREDIT}">Puzzle: ${h(box.puzzle)}, ${h(box.brand)}</p>`;
    },
  });

  // C2 · the box pile
  const c2 = artCover(ctx, {
    kicker, src, title: 'New to MySpeedPuzzling?', dek: 'Welcome to the speed puzzling community. Here is a quick tour.',
    art: (band: ArtBand) => {
      const pile = s.boxes.slice(0, 6);
      const bw = 300, bh = 225;
      const spots: Array<[number, number, number]> = [[0.02, 0.10, -8], [0.33, 0.00, 4], [0.64, 0.12, -3], [0.12, 0.47, 6], [0.42, 0.42, -5], [0.70, 0.50, 7]];
      const H = Math.min(band.bottom - band.top - 260, 360);
      const boxes = pile.map((b, i) => {
        const [fx, fy, rot] = spots[i];
        return `<div class="h-mount" style="position:absolute; left:${f1(X0 + fx * (CW - bw) / 0.70 * 0.70)}px; top:${f1(band.top + fy * H)}px; width:${bw}px; height:${bh}px; transform:rotate(${rot}deg); box-shadow:0 18px 40px rgba(0,0,0,.45)"><img src="${b.img}" alt="" style="width:100%; height:100%; object-fit:cover"></div>`;
      }).join('');
      const chipTop = band.top + H + bh * 0.55 + 10;
      return `${boxes}
        <div class="h-abs" style="top:${f1(chipTop)}px; display:flex; align-items:center; gap:18px">
          <span style="background:var(--c-hot); color:var(--g-bg); font-weight:800; font-size:40px; padding:10px 26px; border-radius:40px">${h(plus(s.players))} puzzlers</span>
          <span style="font-size:34px; color:var(--g-ink)">already here, every pace</span></div>
        <p class="h-abs" style="top:${f1(chipTop + 86)}px; ${CREDIT}">Boxes: ${h(brandsShort(pile))}</p>`;
    },
  });

  // C3 · the hero number, the question as the headline
  const c3 = cover(ctx, 'cover', {
    kicker, hero: { value: plus(s.players), unit: 'puzzlers', max: 170 },
    title: 'Are you new to speed puzzling?',
    dek: `Home of the world's fastest speed puzzlers, and of puzzlers at every pace in ${tens(s.countries)} countries. Joining is free.`,
    src,
  });

  // C4 · the box wall with an empty slot
  const c4 = artCover(ctx, {
    kicker, src, title: 'Are you new to speed puzzling?', dek: `${plus(s.puzzles)} puzzles, ${who}.`,
    art: (band: ArtBand) => {
      const cols = 4, rows = 2, gap = 20;
      const tw = (CW - gap * (cols - 1)) / cols, th = tw * 0.75;
      const wall = s.boxes.slice(0, cols * rows - 1);
      const y0 = band.top + Math.max(0, (band.bottom - band.top - (rows * th + (rows - 1) * gap + 70)) / 2);
      const at = (i: number) => `left:${f1(X0 + (i % cols) * (tw + gap))}px; top:${f1(y0 + Math.floor(i / cols) * (th + gap))}px; width:${f1(tw)}px; height:${f1(th)}px`;
      const tiles = wall.map((b, i) => `<div class="h-mount" style="position:absolute; ${at(i)}"><img src="${b.img}" alt="" style="width:100%; height:100%; object-fit:cover"></div>`).join('')
        + `<div style="position:absolute; ${at(wall.length)}; box-sizing:border-box; border:4px dashed var(--c-hot); border-radius:12px; display:flex; align-items:center; justify-content:center; text-align:center; color:var(--c-hot); font-weight:800; font-size:32px; line-height:1.15">+ your next<br>puzzle</div>`;
      return `${tiles}
        <p class="h-abs" style="top:${f1(y0 + rows * th + (rows - 1) * gap + 26)}px; ${CREDIT}">Boxes: ${h(brandsShort(wall))}</p>`;
    },
  });

  return [
    { key: 'C1', label: 'Missing piece: a real box cut into generator pieces, the coral piece "you"', html: c1 },
    { key: 'C2', label: 'Box pile: real boxes fanned out, "11,000+ puzzlers already here"', html: c2 },
    { key: 'C3', label: 'Hero number (current cover) with the question as the headline', html: c3 },
    { key: 'C4', label: 'Box wall: seven real boxes and an empty "your next puzzle" slot', html: c4 },
  ];
}

/** Alt text per slide, from the same facts. */
export function aboutAlt(s: AboutSpec): string[] {
  const ev = s.upcoming, online = ev.filter(e => e.online).length;
  return [
    `Start here. Are you new to speed puzzling? ${plus(s.players)} puzzlers, every pace, ${tens(s.countries)} countries. You're the missing piece: a real puzzle, ${s.boxes[0].puzzle} by ${s.boxes[0].brand}, cut into pieces, with one coral piece labelled you lifted out of its place.`,
    `Time it, log it: solo, in a pair or as a team. Stopwatch or typed in, every solve counts; analyse your times, compare with others and see where you can still gain. ${plus(total(s))} times logged on MySpeedPuzzling: ${plus(s.kinds.solo)} solo, ${plus(s.kinds.duo)} in pairs, ${plus(s.kinds.team)} in teams, shown as bars. ${plus(s.kinds.hours)} hours puzzled and ${millions(s.pieces)} pieces placed.`,
    `${plus(s.puzzles)} puzzles from ${plus(s.brands)} brands, with box images. A wall of eight boxes, the most-solved puzzle of each of these brands: ${s.boxes.slice(0, 8).map(b => `${b.puzzle} by ${b.brand}`).join(', ')}. Every puzzle has its own page with everyone's times.`,
    `Every time counts, and you'll see yourself get faster. A first 500-piece puzzle often takes an hour and a half. The same ${fmtInt(s.improve.puzzlers)} puzzlers, solo on 500-piece puzzles new to them, took a typical ${s.improve.points.map(([n, m]) => `${fmtMin(m)} on their ${ordinal(n)}`).join(', ')}, shown as bars. ${s.improve.shareFaster}% were faster on their 20th than their 1st; the typical gain was ${s.improve.medianGainPct}%. The fastest solo 500-piece time on MySpeedPuzzling is ${mmss(s.fastest500s)}.`,
    `${plus(s.eventsTotal)} competitions listed on MySpeedPuzzling, online and in person. A typical ${s.weeks} weeks on the calendar: ${ev.length} competitions in ${countriesOf(ev)} countries, one puzzle piece per event, stacked by week, ${ev.length - online} in person and ${online} online. The world's fastest puzzlers compete here, and so does everyone else; organisers run events on MySpeedPuzzling for free.`,
    'Free for everyone: the stopwatch and your time log, the puzzle database with box images, your personal bests and progress, competitions and live results, XP and levels, a wish list and puzzle library. An optional membership adds charts and detailed stats, achievements, the barcode scanner, and selling, swapping or lending puzzles, with a 10-day free trial.',
    'Start in three steps, numbered on three interlocking puzzle pieces: 1 open myspeedpuzzling.com, the link is in our bio; 2 sign up for free with Google, Apple, Facebook, Microsoft or an e-mail code; 3 log your first time: find your puzzle, in the browser on any phone or computer. What was the last puzzle you finished?',
  ];
}
