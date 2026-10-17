// AD1 building blocks shared by the four door variants and the campaign posts. Everything is drawn from generator
// pieces (src/pieces/jigsaw.ts) and real box images; colours come from the frame's ground tokens (--g-*, --c-*), so a
// part renders on any H4 ground. Proposals for src/design/house.ts are listed in lab/advent/README.md.
import { CW, W, X0, f1 } from '../../src/design/house.ts';
import { escapeHtml as h } from '../../src/design/page.ts';
import { flagUrl, singlePiece } from '../../src/design/svg.ts';
import { generateJigsaw, type Piece } from '../../src/pieces/jigsaw.ts';
import { FAKE_SEED, type Box, type ChoiceQuiz, type NumberQuiz, type Option, type PieceQuiz, type Quiz } from './content.ts';

export const CORAL = '#ec726f';
export const INK_DARK = '#1d2433';

export const AD_CSS = `
.ad-cue { position: absolute; left: ${X0 + 60}px; width: ${CW - 120}px; height: 104px; border-radius: 52px; background: ${CORAL}; display: flex; align-items: center; justify-content: center; gap: 22px; }
.ad-cue span { font-size: 40px; font-weight: 700; color: ${INK_DARK}; letter-spacing: -0.005em; white-space: nowrap; }
.ad-cue svg { flex: none; }
.ad-fine { position: absolute; left: ${X0}px; width: ${CW}px; text-align: center; font-size: 30px; line-height: 1.25; color: var(--g-soft); }
.ad-fine b { font-weight: 600; color: var(--g-ink); letter-spacing: 0.04em; }
.ad-q { position: absolute; left: ${X0}px; width: ${CW}px; font-size: 56px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; color: var(--g-ink); text-wrap: balance; }
.ad-card { position: absolute; background: #ffffff; padding: 10px; border-radius: 8px; box-shadow: 0 20px 40px -14px rgba(10, 14, 24, 0.6); }
.ad-card > div, .ad-card img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 3px; background-repeat: no-repeat; }
.ad-row { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; align-items: center; gap: 24px; border-bottom: 2px solid var(--g-band); }
.ad-row .lt { flex: none; }
.ad-row .th { flex: none; background: #fff; padding: 6px; border-radius: 4px; }
.ad-row .th img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ad-row .fl { flex: none; width: 76px; height: 76px; }
.ad-row .nm { flex: 1; min-width: 0; }
.ad-row .nm p:first-child { font-size: 44px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.ad-row .nm p + p { font-size: 30px; line-height: 1.25; color: var(--g-soft); margin-top: 4px; }
.ad-row .vl { font-size: 46px; font-weight: 700; color: var(--g-ink); }
.ad-row.hot .vl, .ad-row.hot .nm p:first-child { color: var(--g-hot); }
.ad-lab { position: absolute; font-size: 38px; font-weight: 700; line-height: 1.1; color: var(--g-ink); text-align: center; }
.ad-credit { position: absolute; left: ${X0}px; width: ${CW}px; text-align: center; font-size: 30px; color: var(--g-soft); }
.ad-wk { position: absolute; display: flex; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; color: var(--g-accent); }
.ad-wk span { text-align: center; }
`;

// ------------------------------------------------------------------ letter pieces

/** A generator piece carrying an answer letter (A/B/C): coral = the highlight, otherwise ink-outlined. */
export function letterPiece(letter: string, px = 88, o: { hot?: boolean; seed?: number; fill?: string } = {}): string {
  const seed = o.seed ?? { A: 4, B: 11, C: 17, D: 23 }[letter] ?? 5;
  const p = singlePiece(60, seed);
  const [vx, vy, vw, vh] = p.viewBox.split(' ').map(Number);
  const fill = o.fill ?? (o.hot ? 'var(--g-hot)' : 'var(--g-ink)');
  const txt = o.hot || !o.fill ? 'var(--g-bg)' : INK_DARK;
  return `<svg class="lt" width="${px}" height="${f1((px * vh) / vw)}" viewBox="${p.viewBox}" aria-hidden="true"><path d="${p.d}" fill="${fill}"/>
    <text x="${f1(vx + vw / 2)}" y="${f1(vy + vh / 2 + 15)}" text-anchor="middle" font-size="42" font-weight="700" fill="${txt}" style="font-family:Rubik">${h(letter)}</text></svg>`;
}

// ------------------------------------------------------------------ reply cue + fine print

const arrow = (c = INK_DARK) => `<svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true"><path d="M20 4 V40 M6 27 L20 42 L34 27" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** The coral pill that tells people how to answer (the reply field sits right under the Story card), with the
 *  matching rule in small print under it. */
export const replyCue = (reply: string, top: number, sub = 'Text only. Your first answer counts.') =>
  `<div class="ad-cue" style="top:${top}px" data-qa-bg="${CORAL}"><span>Reply to this Story: ${h(reply)}</span>${arrow()}</div>` +
  (sub ? `<p class="ad-fine" style="top:${top + 116}px">${h(sub)}</p>` : '');
/** Rules link, plus the week's draw-seed fingerprint on Monday doors (days 1, 7, 13, 19; placeholder in the lab). */
export const finePrint = (q: { day: number; week: number }, top: number) =>
  `<p class="ad-fine" style="top:${top}px">Rules: link in bio${q.day % 6 === 1 ? ` · draw seed fingerprint <b>${FAKE_SEED(q.week)}</b>` : ''}</p>`;
/** The footer source line for a door (the footer adds myspeedpuzzling.com in bold). */
export const doorSrc = (q: { day: number }) => `Day ${q.day} of 24 · Free · 18+ · answers until 19:00 CET tomorrow`;

// ------------------------------------------------------------------ the 6×4 Advent jigsaw (the "day N of 24" device)

/** Knob direction of each side ('o' out, 'i' in, 'f' flat): top, right, bottom, left. */
export function knobs(p: Piece, cell: { x: number; y: number; w: number; h: number }): string {
  const o = p.outline, eps = 2;
  const side = (idx: number[], axis: 0 | 1, line: number, outSign: number) => {
    const vals = idx.map(i => o[i][axis] - line);
    const ext = vals.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0);
    return Math.abs(ext) < eps ? 'f' : Math.sign(ext) === outSign ? 'o' : 'i';
  };
  const r = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  return side(r(0, 9), 1, cell.y, -1) + side(r(9, 18), 0, cell.x + cell.w, 1) + side(r(18, 27), 1, cell.y + cell.h, 1) + side(r(27, 36), 0, cell.x, -1);
}

export interface AdventGrid { x: number; y: number; w: number; h: number; day: number; mode: 'calendar' | 'reveal'; img?: string; seed?: number; numbers?: boolean; id?: string; weekdays?: boolean }

/**
 * The Advent puzzle: 24 generator pieces, 6 columns (Mon–Sat) × 4 rows (the four weeks). Doors before `day` are done,
 * door `day` is tonight (coral), later doors are outlined. In 'reveal' mode the done doors show their piece of a
 * mystery box image, so the picture completes piece by piece until day 24 asks which puzzle it is.
 */
export function adventGrid(g: AdventGrid): string {
  const jig = generateJigsaw({ cols: 6, rows: 4, width: g.w, height: g.h, seed: g.seed ?? 31, tabSize: 0.2, jitter: 0.03 });
  const pw = g.w / 6, ph = g.h / 4;
  const id = g.id ?? `ag${g.day}${g.mode}`;
  const fs = Math.round(Math.min(pw, ph) * 0.34);
  const parts = jig.pieces.sort((a, b) => a.row - b.row || a.col - b.col).map(p => {
    const n = p.row * 6 + p.col + 1;
    const done = n < g.day, now = n === g.day;
    const cx = p.col * pw + pw / 2, cy = p.row * ph + ph / 2;
    let shape: string;
    if (g.mode === 'reveal' && done && g.img) {
      shape = `<clipPath id="${id}c${n}"><path d="${p.d}"/></clipPath><image href="${g.img}" x="0" y="0" width="${g.w}" height="${g.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}c${n})"/>
        <path d="${p.d}" fill="none" stroke="var(--g-bg)" stroke-width="2.5"/>`;
    } else if (now) shape = `<path d="${p.d}" fill="var(--g-device)" stroke="var(--g-bg)" stroke-width="3"/>`;
    else if (done) shape = `<path d="${p.d}" fill="var(--c-base)" stroke="var(--g-bg)" stroke-width="3"/>`;
    else shape = `<path d="${p.d}" fill="var(--g-band)" stroke="var(--g-rule)" stroke-width="2.5"/>`;
    const num = g.numbers === false || (g.mode === 'reveal' && done) ? '' : `<text x="${f1(cx)}" y="${f1(cy + fs * 0.36)}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${now ? 'var(--g-bg)' : done ? 'var(--g-bg)' : 'var(--g-soft)'}">${n}</text>`;
    return shape + num;
  }).join('');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const head = g.weekdays ? `<div class="ad-wk" style="left:${g.x}px; top:${g.y - 52}px; width:${g.w}px">${days.map(d => `<span style="width:${f1(pw)}px">${d.toUpperCase()}</span>`).join('')}</div>` : '';
  return `${head}<svg width="${g.w}" height="${g.h}" viewBox="0 0 ${g.w} ${g.h}" style="position:absolute; left:${g.x}px; top:${g.y}px" aria-hidden="true">${parts}</svg>`;
}

// ------------------------------------------------------------------ quiz stages

export interface Band { top: number; bottom: number }

/** Box cards side by side with a letter piece on each; one shared credit line under them. */
function boxCards(opts: Option[], band: Band, cardMax = 330): string {
  const k = opts.length, colW = CW / k;
  const ratio = Math.max(...opts.map(o => o.box!.ratio));
  const cardW = Math.min(cardMax, colW - 26), cardH = cardW / ratio;
  const top = band.top + 30;
  const cards = opts.map((o, i) => {
    const cx = X0 + colW * (i + 0.5), tilt = k === 1 ? 0 : -4 + (8 * i) / (k - 1);
    return `<div class="ad-card" style="left:${f1(cx - cardW / 2)}px; top:${f1(top + (i % 2) * 10)}px; width:${f1(cardW)}px; height:${f1(cardH)}px; transform:rotate(${f1(tilt)}deg)"><img src="${o.box!.img}" alt=""></div>
      <div style="position:absolute; left:${f1(cx - cardW / 2 - 26)}px; top:${f1(top - 34)}px; z-index:3">${letterPiece(o.letter, 92)}</div>
      <p class="ad-lab" style="left:${f1(X0 + colW * i + 6)}px; width:${f1(colW - 12)}px; top:${f1(top + cardH + 44)}px">${h(o.label)}</p>`;
  }).join('');
  const brand = opts[0].sub?.replace(/^Mystery puzzle/, 'Puzzles') ?? '';
  return cards + `<p class="ad-credit" style="top:${f1(top + cardH + 44 + 100)}px">${h(brand)}</p>`;
}
export const boxCardsHeight = (opts: Option[], cardMax = 330) => {
  const colW = CW / opts.length, ratio = Math.max(...opts.map(o => o.box!.ratio));
  return 30 + Math.min(cardMax, colW - 26) / ratio + 44 + 100 + 40;
};

/** Option rows (letter piece, optional thumbnail or flag, label + sub). */
export function optionRows(opts: Option[], top: number, rowH = 112, o: { hot?: string; values?: boolean } = {}): string {
  return opts.map((op, i) => `<div class="ad-row ${o.hot === op.letter ? 'hot' : ''}" style="top:${top + i * rowH}px; height:${rowH}px">
    ${letterPiece(op.letter, 76, { hot: o.hot === op.letter })}
    ${op.box ? `<span class="th" style="width:${f1((rowH - 24) * op.box.ratio)}px; height:${rowH - 24}px"><img src="${op.box.img}" alt=""></span>` : ''}
    ${op.flag ? `<img class="fl" src="${flagUrl(op.flag)}" alt="">` : ''}
    <div class="nm"><p>${h(op.label)}</p>${op.sub && !op.box ? `<p>${h(op.sub)}</p>` : ''}</div>
    ${o.values && op.value ? `<span class="vl">${h(op.value)}</span>` : ''}</div>`).join('');
}

/** A crop of the box, zoomed: the "guess the puzzle" clue. */
function cropCard(b: Box, x: number, y: number, w: number, hh: number, zoom = 3.2, fx = 0.62, fy = 0.38): string {
  return `<div class="ad-card" style="left:${f1(x)}px; top:${f1(y)}px; width:${f1(w)}px; height:${f1(hh)}px"><div style="background-image:url('${b.img}'); background-size:${f1(zoom * 100)}% auto; background-position:${f1(fx * 100)}% ${f1(fy * 100)}%"></div></div>`;
}

/** Bars from zero for the guess-the-number quiz; the hidden year is a dashed coral outline with a question mark. */
function numberChart(q: NumberQuiz, band: Band): string {
  const H = band.bottom - band.top - 150, n = q.bars.length + 1, gap = 34;
  const bw = (CW - gap * (n - 1)) / n, max = Math.max(...q.bars.map(b => b.value), q.hidden.value) * 1.08;
  const y = (v: number) => H - (v / max) * H;
  const bars = q.bars.map((b, i) => {
    const x = i * (bw + gap);
    return `<rect x="${f1(x)}" y="${f1(y(b.value))}" width="${f1(bw)}" height="${f1(H - y(b.value))}" fill="var(--c-base)"/>
      <text class="c-lab-b" x="${f1(x + bw / 2)}" y="${f1(y(b.value) - 18)}" text-anchor="middle">${b.value}</text>
      <text class="c-lab" x="${f1(x + bw / 2)}" y="${H + 46}" text-anchor="middle">${b.label}</text>`;
  }).join('');
  const hx = q.bars.length * (bw + gap), hy = y(q.hidden.value);
  const hidden = `<rect x="${f1(hx + 3)}" y="${f1(hy)}" width="${f1(bw - 6)}" height="${f1(H - hy - 3)}" fill="none" stroke="var(--c-hot)" stroke-width="6" stroke-dasharray="18 12"/>
    <text x="${f1(hx + bw / 2)}" y="${f1(hy + (H - hy) / 2 + 40)}" text-anchor="middle" font-size="120" font-weight="700" fill="var(--c-hot)">?</text>
    <text class="c-lab-b" x="${f1(hx + bw / 2)}" y="${H + 46}" text-anchor="middle">${q.hidden.label}</text>`;
  return `<svg width="${CW}" height="${H + 60}" style="position:absolute; left:${X0}px; top:${band.top + 96}px" aria-hidden="true">
    <line x1="0" x2="${CW}" y1="${H}" y2="${H}" stroke="var(--g-rule)" stroke-width="3"/>${bars}${hidden}</svg>
    <p class="h-cap h-abs" style="top:${band.top}px">Median solo time, minutes</p>`;
}

/**
 * The missing piece: a generator cut over the box, one hole, three candidate shapes each filled with the hole's own
 * picture, so only the outline decides. layout 'row': image (width w, centred) with the candidates in a row under it;
 * 'side': image on the left, candidates stacked on the right.
 */
export function pieceStage(q: PieceQuiz, top: number, o: { layout: 'row' | 'side'; w: number; reveal?: boolean }): { html: string; end: number } {
  const cols = 5, rows = 4;
  const iw = o.w, ih = iw / q.box.ratio;
  const ix = o.layout === 'row' ? X0 + (CW - iw) / 2 : X0, iy = top;
  const jig = generateJigsaw({ cols, rows, width: iw, height: ih, seed: 44, tabSize: 0.22, jitter: 0.03 });
  const pw = iw / cols, ph = ih / rows;
  const cell = (p: Piece) => ({ x: p.col * pw, y: p.row * ph, w: pw, h: ph });
  const hole = jig.pieces.find(p => p.col === 2 && p.row === 1)!;
  const sig = knobs(hole, cell(hole));
  const diff = (a: string, b: string) => [...a].filter((c, i) => c !== b[i]).length;
  const decoys = jig.pieces.filter(p => p !== hole && p.col > 0 && p.col < cols - 1 && p.row > 0 && p.row < rows - 1 && diff(knobs(p, cell(p)), sig) >= 2).slice(0, 2);
  if (decoys.length < 2) throw new Error('missing piece: not enough distinct decoys');
  const cand = [decoys[0], decoys[1], hole]; // C is the answer
  const hc = { x: hole.col * pw + pw / 2, y: hole.row * ph + ph / 2 };
  const cut = `<svg width="${f1(iw)}" height="${f1(ih)}" style="position:absolute; left:${f1(ix)}px; top:${f1(iy)}px" aria-hidden="true">
    <defs><clipPath id="mp-all"><rect x="0" y="0" width="${f1(iw)}" height="${f1(ih)}" rx="6"/></clipPath></defs>
    <image href="${q.box.img}" x="0" y="0" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#mp-all)"/>
    <path d="${jig.cuts}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.5"/>
    ${o.reveal ? `<path d="${hole.d}" fill="none" stroke="var(--c-hot)" stroke-width="8"/>` : `<path d="${hole.d}" fill="var(--g-bg)" stroke="var(--g-ink)" stroke-width="4"/>`}</svg>`;
  // Candidate scale: each candidate box is 1.7 cells; side layout fits three into the image height.
  const s = o.layout === 'side' ? (ih / 3) / (1.7 * ph) : 0.82;
  const bw = pw * 1.7 * s, bh = ph * 1.7 * s;
  const slot = (i: number) => o.layout === 'side'
    ? { lx: X0 + iw + 28, cx: X0 + iw + 28 + 70 + (CW - iw - 28 - 70) / 2, cy: iy + (i + 0.5) * (ih / 3) }
    : { lx: X0 + (CW / 3) * i + 4, cx: X0 + (CW / 3) * i + 4 + 76 + bw / 2, cy: iy + ih + 40 + bh / 2 };
  const cands = cand.map((p, i) => {
    const pc = { x: p.col * pw + pw / 2, y: p.row * ph + ph / 2 }, sl = slot(i);
    const hot = !!o.reveal && i === 2;
    return `<svg width="${f1(bw)}" height="${f1(bh)}" viewBox="${f1(pc.x - pw * 0.85)} ${f1(pc.y - ph * 0.85)} ${f1(pw * 1.7)} ${f1(ph * 1.7)}" style="position:absolute; left:${f1(sl.cx - bw / 2)}px; top:${f1(sl.cy - bh / 2)}px" aria-hidden="true">
        <clipPath id="mpc${i}"><path d="${p.d}"/></clipPath>
        <image href="${q.box.img}" x="${f1(pc.x - hc.x)}" y="${f1(pc.y - hc.y)}" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#mpc${i})"/>
        <path d="${p.d}" fill="none" stroke="${hot ? 'var(--c-hot)' : 'var(--g-ink)'}" stroke-width="${f1((hot ? 7 : 4) / s)}"/></svg>
      <div style="position:absolute; left:${f1(sl.lx)}px; top:${f1(sl.cy - 34)}px">${letterPiece('ABC'[i], 64, { hot })}</div>`;
  }).join('');
  const end = o.layout === 'side' ? iy + ih : iy + ih + 40 + bh;
  const credit = `<p class="ad-credit" style="top:${f1(end + 14)}px">${h(q.src.split(' · pieces')[0])}</p>`;
  return { html: cut + cands + credit, end: end + 60 };
}

/**
 * The quiz's main visual in a band. `size` large = the visual leads (V1, V2, V4); compact = rows with thumbnails (V3,
 * where the reveal jigsaw is the hero). Returns markup and the y where it ended.
 */
export function stage(q: Quiz, band: Band, size: 'large' | 'compact', fit?: number): { html: string; end: number } {
  if (q.kind === 'number') {
    const hgt = Math.min(size === 'large' ? 600 : 470, band.bottom - band.top - 70);
    return { html: numberChart(q, { top: band.top, bottom: band.top + hgt }) + `<p class="h-lead h-abs" style="top:${band.top + hgt + 14}px; text-align:center; color:var(--g-soft)">${h(q.tolerance)}</p>`, end: band.top + hgt + 70 };
  }
  if (q.kind === 'piece') return size === 'large' ? pieceStage(q, band.top, { layout: 'row', w: 720 }) : pieceStage(q, band.top, { layout: 'side', w: Math.min(560, (band.bottom - band.top - 64) * q.box.ratio) });
  const opts = q.options;
  if (opts.every(o => o.box) && size === 'large') {
    const ratio = Math.max(...opts.map(o => o.box!.ratio));
    const cardMax = Math.min(opts.length === 2 ? 400 : 330, fit ? Math.max(200, (fit - 214) * ratio) : 999);
    return { html: boxCards(opts, band, cardMax), end: band.top + boxCardsHeight(opts, cardMax) };
  }
  if (opts.every(o => o.box)) {
    const rh = Math.max(96, Math.min(120, Math.floor((band.bottom - band.top - 62) / opts.length)));
    return { html: optionRows(opts, band.top, rh) + `<p class="ad-credit" style="top:${band.top + opts.length * rh + 14}px">${h(opts[0].sub!.replace(/^Mystery puzzle/, 'Puzzles'))}</p>`, end: band.top + opts.length * rh + 62 };
  }
  // guess / country: a clue image plus text options.
  const clue = q.key === 'guess' ? q.reveal.box! : q.reveal.box!;
  const rowH = 104;
  if (size === 'large') {
    const ch = Math.min(470, band.bottom - band.top - opts.length * rowH - 80), cw = q.key === 'guess' ? CW : ch * clue.ratio;
    const cx = X0 + (CW - cw) / 2;
    const img = q.key === 'guess' ? cropCard(clue, cx, band.top, cw, ch) : `<div class="ad-card" style="left:${f1(cx)}px; top:${band.top}px; width:${f1(cw)}px; height:${f1(ch)}px"><img src="${clue.img}" alt=""></div>`;
    const credit = `<p class="ad-credit" style="top:${f1(band.top + ch + 22)}px">Mystery puzzle · ${h(clue.brand)}</p>`;
    const rows = optionRows(opts.map(o => ({ ...o, sub: q.key === 'guess' ? undefined : o.sub })), band.top + ch + 80, rowH);
    return { html: img + credit + rows, end: band.top + ch + 80 + opts.length * rowH };
  }
  const ch = Math.min(300, band.bottom - band.top - 60), cw = q.key === 'guess' ? ch : ch * clue.ratio * 0.8, rr = ch / opts.length;
  const img = q.key === 'guess' ? cropCard(clue, X0, band.top, cw, ch) : `<div class="ad-card" style="left:${X0}px; top:${band.top}px; width:${f1(cw)}px; height:${ch}px"><img src="${clue.img}" alt=""></div>`;
  const rows = opts.map((op, i) => `<div class="ad-row" style="left:${f1(X0 + cw + 34)}px; width:${f1(CW - cw - 34)}px; top:${f1(band.top + i * rr)}px; height:${f1(rr)}px">${letterPiece(op.letter, 64)}${op.flag ? `<img class="fl" style="width:60px; height:60px" src="${flagUrl(op.flag)}" alt="">` : ''}<div class="nm"><p style="font-size:38px">${h(op.label)}</p></div></div>`).join('');
  return { html: img + rows + `<p class="ad-credit" style="top:${band.top + ch + 14}px; text-align:left">Mystery puzzle · ${h(clue.brand)}</p>`, end: band.top + ch + 60 };
}

/** The right answer's letter for a quiz (number quizzes have none). */
export const answerOf = (q: Quiz) => (q.kind === 'number' ? '' : q.correct);
export const isChoice = (q: Quiz): q is ChoiceQuiz => q.kind === 'choice';

/** Dashed sticker zone (w × h canvas px at default size), with an optional outer 130 % outline. */
export function stickerZone(x: number, y: number, w: number, hh: number, label: string, o: { outer?: number; ink?: string } = {}): string {
  const ink = o.ink ?? 'var(--g-rule)';
  const outer = o.outer ? `<div style="position:absolute; left:${f1(x + w / 2 - (w * o.outer) / 2)}px; top:${f1(y + hh / 2 - (hh * o.outer) / 2)}px; width:${f1(w * o.outer)}px; height:${f1(hh * o.outer)}px; border:3px dashed ${ink}; opacity:.55; border-radius:40px"></div>` : '';
  return `${outer}<div style="position:absolute; left:${x}px; top:${y}px; width:${w}px; height:${hh}px; border:5px dashed ${ink}; border-radius:36px; display:grid; place-items:center">
    <p style="font-size:30px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--g-accent); text-align:center; padding:0 24px">${h(label)}</p></div>`;
}
export const centreX = (w: number) => Math.round((W - w) / 2);
