// GR1 runner: key frames of the "The grind" Reel (owner 2026-10-27, concept A "Same puzzle. N times."), three looks
// side by side so the owner can rate each frame before the HyperFrames builder is written:
//   L1 Staircase       every solve a dot, the personal bests a coral step line with coral generator pieces;
//   L2 Picture curve   the area under the best time is the box picture: the picture shrinks as the time drops;
//   L3 Shrinking puzzle boards of generator pieces carrying the box picture, sized by the solve time.
// Six frames per look: K1 splash (frame 0), K2 the first 10 tries, K3 the zoom-out to every try, K4 first to best,
// K5 the community curve, K6 the closing question. Data: reel-grind-top, reel-grind-curve, reel-grind-gaps (cached;
// --fresh re-queries). Writes content/labs/GR1/ with a gallery (Works / Unsure / No-go + note per frame).
//
//   node lab/grind/run.ts [--fresh]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { query } from '../../src/data/db.ts';
import { fetchBoxes } from '../../src/data/boxes.ts';
import { HOUSE, HOUSE_CSS, X0, activateVariant, clock, f1, frame, hero, heroFit } from '../../src/design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt, page } from '../../src/design/page.ts';
import { flagUrl, singlePiece } from '../../src/design/svg.ts';
import { generateJigsaw } from '../../src/pieces/jigsaw.ts';
import { LOGO_CSS, logoExit } from '../../src/motion/logo.ts';
import { metered } from '../../src/render/meter.ts';
import { FRAMES, createRenderer } from '../../src/render/render.ts';
import { ROOT } from '../../src/render/server.ts';
import { LAB_NAV_CSS, labNav } from '../../src/review/nav.ts';

const LAB = 'GR1';
const DIR = join(ROOT, 'content/labs', LAB);
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);
const fresh = process.argv.includes('--fresh');
const RX = FRAMES.reel.safe.x1, RW = RX - X0, CX = X0 + RW / 2;
const MINUS = '−';
const t = (sec: number) => fmtDuration(sec / 60);
const pct = (v: number) => `${v < 0 ? MINUS : '+'}${Math.round(Math.abs(v) * 100)}%`;
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
// Brand piece colours only, never a white piece (owner 2026-10-22).
const CORAL = '#ec726f', CORAL_L = '#ffb0ab', SKY = '#69b3fe', INDIGO = '#97a5f9';

// ------------------------------------------------------------------ data

const topQ = query('reel-grind-top', { fresh });
const curveQ = query('reel-grind-curve', { fresh });
const gapsQ = query('reel-grind-gaps', { fresh });
const dnf = new Set<string>((JSON.parse(readFileSync(join(ROOT, 'content/do-not-feature.json'), 'utf8')) as { player_ids: string[] }).player_ids);
const ranks = [...new Set(topQ.rows.map(r => r.grind_rank))];
const rank = ranks.find(k => !dnf.has(topQ.rows.find(r => r.grind_rank === k)!.player_id));
if (!rank) throw new Error('no featurable grind');
const rows = topQ.rows.filter(r => r.grind_rank === rank);
const g = {
  player: rows[0].player, country: rows[0].country, puzzle: rows[0].puzzle, brand: rows[0].brand, pieces: Number(rows[0].pieces),
  image: rows[0].image, s: rows.map(r => Number(r.seconds)), at: rows.map(r => r.solved_at),
};
const N = g.s.length;
const runBest: number[] = [];
g.s.forEach((v, i) => runBest.push(Math.min(v, i ? runBest[i - 1] : Infinity)));
const pbs = new Set(g.s.flatMap((v, i) => (i === 0 || v < runBest[i - 1] ? [i + 1] : [])));
const best = runBest[N - 1], bestAt = g.s.indexOf(best) + 1;
const cum = g.s.reduce<number[]>((a, v) => [...a, (a.at(-1) ?? 0) + v / 3600], []);
const hours = cum[N - 1];
// The knee: the solves that fit in the first ~5 hours of practice, against everything after.
const KNEE_H = 5;
const knee = cum.findIndex(v => v >= KNEE_H) + 1;
const gain1 = g.s[0] - runBest[knee - 1], gain2 = runBest[knee - 1] - best;
const h1 = Math.round(cum[knee - 1]), h2 = Math.round(hours - cum[knee - 1]);
const total = 1 - best / g.s[0];

const curve = (size: string) => [{ n: 1, r: 1 }, ...curveQ.rows.filter(r => r.size === size).map(r => ({ n: Number(r.attempt), r: 1 - Number(r.pct_faster_than_first) / 100 }))];
const cohort = (size: string) => Number(curveQ.rows.find(r => r.size === size)?.grinds ?? 0);
const c500 = curve('500'), cSmall = curve('≤200');
const gap = (size: string) => Number(gapsQ.rows.find(r => r.size === size)!.median_days_between);
const queried = topQ.queried_at.slice(0, 10);

const boxUrl = (await fetchBoxes([g.image])).get(g.image)!;
const meta = await sharp(join(ROOT, boxUrl.slice(1))).metadata();
const ASPECT = (meta.width ?? 4) / (meta.height ?? 3);

console.log(`${LAB}: grind #${rank}: ${N} solves of a ${g.pieces}, ${t(g.s[0])} → ${t(best)} (#${bestAt}), ${pbs.size} PBs, ${hours.toFixed(1)} h; knee at #${knee}: ${h1} h −${Math.round(gain1 / 60)} min, then ${h2} h −${Math.round(gain2 / 60)} min`);

// ------------------------------------------------------------------ drawing helpers

type Look = 'L1' | 'L2' | 'L3';

/** A generator piece of core size `s` centred on (cx, cy). */
function pieceAt(cx: number, cy: number, s: number, fill: string, seed = 3, rot = 0) {
  const p = singlePiece(s, seed);
  return `<path d="${p.d}" fill="${fill}" transform="translate(${f1(cx - 1.5 * s)} ${f1(cy - 1.5 * s)}) rotate(${rot} ${f1(1.5 * s)} ${f1(1.5 * s)})"/>`;
}

/** A board of generator pieces carrying the box picture (SVG markup in the caller's coordinates). */
function pictureBoard(id: string, x: number, y: number, w: number, cols: number, o: { lift?: number[]; seed?: number } = {}) {
  const hh = w / ASPECT, rows = Math.max(2, Math.round(cols / ASPECT));
  const jig = generateJigsaw({ cols, rows, width: w, height: hh, x, y, seed: o.seed ?? 17, tabSize: 0.24, jitter: 0.04 });
  const lift = new Set(o.lift ?? []);
  return `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(hh)}"><image href="${boxUrl}" width="${f1(w)}" height="${f1(hh)}" preserveAspectRatio="xMidYMid slice"/></pattern></defs>
    ${jig.pieces.map((p, i) => lift.has(i)
      ? `<path d="${p.d}" fill="url(#${id})" class="gr-pc" transform="translate(${18 + (i % 3) * 10} ${-40 - (i % 2) * 26}) rotate(${(i % 2 ? -1 : 1) * 12} ${f1(p.bbox.x + p.bbox.width / 2)} ${f1(p.bbox.y + p.bbox.height / 2)})" style="filter:drop-shadow(0 10px 12px rgba(0,0,0,.45))"/>`
      : `<path d="${p.d}" fill="url(#${id})" class="gr-pc"/>`).join('')}`;
}

/** A plain-colour board of generator pieces (no picture), for the community frames. */
function colourBoard(x: number, y: number, w: number, cols: number, fill: string, seed: number) {
  const hh = w * 0.75, rows = Math.max(2, Math.round(cols * 0.75));
  return generateJigsaw({ cols, rows, width: w, height: hh, x, y, seed, tabSize: 0.24, jitter: 0.04 }).pieces
    .map(p => `<path d="${p.d}" fill="${fill}" class="gr-cpc"/>`).join('');
}

interface Plot {
  id: string; look: Look; top: number; height: number;
  /** Attempts shown: 1..xMax. */
  xMax: number; xTicks: number[];
  yMax: number; yStep: number; yLabel: (sec: number) => string;
  pts: Array<{ n: number; s: number }>;
  /** Step line through the running best (the personal bests). */
  stair?: boolean;
  dotR: number; pieceS?: number;
  notes?: Array<{ n: number; s: number; text: string; anchor?: 'start' | 'middle' | 'end'; dy?: number; hot?: boolean }>;
  /** Step % between consecutive solves, written over each segment. */
  steps?: boolean;
  thumbs?: Array<{ n: number; s: number; w: number }>;
}

/** The time chart: minutes up, attempts across. Inner plot from x0 to RX, labels on the left. */
function plot(p: Plot) {
  const x0 = X0 + 128, x1 = RX - 12, y0 = 24, y1 = p.height - 56;
  const X = (n: number) => x0 + ((n - 1) / Math.max(1, p.xMax - 1)) * (x1 - x0);
  const Y = (s: number) => y1 - (s / p.yMax) * (y1 - y0);
  const out: string[] = [];
  for (let v = 0; v <= p.yMax + 1; v += p.yStep) {
    out.push(`<line x1="${x0}" x2="${x1}" y1="${f1(Y(v))}" y2="${f1(Y(v))}" stroke="var(--g-${v ? 'band' : 'rule'})" stroke-width="2"/>`);
    out.push(`<text class="c-lab" x="${x0 - 18}" y="${f1(Y(v) + 10)}" text-anchor="end">${h(p.yLabel(v))}</text>`);
  }
  for (const n of p.xTicks) out.push(`<text class="c-lab" x="${f1(X(n))}" y="${y1 + 44}" text-anchor="middle">${n}</text>`);
  const pts = p.pts.filter(q => q.n <= p.xMax);
  let rb = Infinity;
  const stair = pts.map(q => ({ n: q.n, s: (rb = Math.min(rb, q.s)) }));
  const stairD = stair.map((q, i) => (i ? `H${f1(X(q.n))}V${f1(Y(q.s))}` : `M${f1(X(q.n))} ${f1(Y(q.s))}`)).join('') + `H${f1(X(p.xMax))}`;
  if (p.look === 'L2') {
    out.push(`<defs><pattern id="${p.id}-img" patternUnits="userSpaceOnUse" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"><image href="${boxUrl}" width="${x1 - x0}" height="${y1 - y0}" preserveAspectRatio="xMidYMid slice"/></pattern></defs>`);
    out.push(`<path d="${stairD}V${y1}H${f1(X(1))}Z" fill="url(#${p.id}-img)"/>`);
  }
  if (p.stair) out.push(`<path d="${stairD}" fill="none" stroke="${CORAL}" stroke-width="${p.look === 'L2' ? 6 : 5}" stroke-linejoin="round"/>`);
  if (p.steps) pts.slice(1).forEach((q, i) => {
    const a = pts[i], d = q.s / a.s - 1;
    out.push(`<text class="gr-step${d < 0 ? ' down' : ''}" x="${f1((X(a.n) + X(q.n)) / 2)}" y="${f1(Math.min(Y(a.s), Y(q.s)) - 30)}" text-anchor="middle">${pct(d)}</text>`);
  });
  for (const q of pts) {
    const pb = pbs.has(q.n) && p.stair;
    if (pb && p.look === 'L1' && p.pieceS) out.push(pieceAt(X(q.n), Y(q.s), p.pieceS, CORAL, 3 + (q.n % 5)));
    else out.push(`<circle cx="${f1(X(q.n))}" cy="${f1(Y(q.s))}" r="${pb ? p.dotR + 2 : p.dotR}" fill="${pb ? CORAL : 'var(--c-context)'}"${p.look === 'L2' ? ' stroke="#222a38" stroke-width="2"' : ''}/>`);
  }
  for (const th of p.thumbs ?? []) out.push(pictureBoard(`${p.id}-th${th.n}`, X(th.n) - th.w / 2, Y(th.s) - th.w / ASPECT - 26, th.w, 3, { seed: th.n }));
  for (const n of p.notes ?? []) out.push(`<text class="${n.hot ? 'c-hot-s' : 'c-lab-b'}" x="${f1(X(n.n))}" y="${f1(Y(n.s) + (n.dy ?? -26))}" text-anchor="${n.anchor ?? 'middle'}">${h(n.text)}</text>`);
  return `<svg class="gr-plot" style="top:${p.top}px" width="1080" height="${p.height}" viewBox="0 0 1080 ${p.height}" aria-hidden="true">${out.join('')}</svg>`;
}

const minLabel = (sec: number) => `${Math.round(sec / 60)} min`;
const who = `<span class="gr-who">${g.country ? `<img src="${flagUrl(g.country)}" alt="">` : ''}${h(g.player)}</span>`;
const credit = (top: number, extra = '') => `<p class="h-abs h-credit" style="top:${top}px; width:${RW}px">${who} · ${h(g.puzzle)}, ${h(g.brand)} ${g.pieces}${extra}</p>`;

// ------------------------------------------------------------------ frames

function k1(look: Look) {
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  let art = '';
  if (look === 'L1') art = `<div class="h-mount" style="left:${X0 + 40}px; top:1110px; width:${RW - 80}px; height:${f1((RW - 80) / ASPECT)}px; transform:rotate(-2deg)"><img src="${boxUrl}" alt=""></div>
    <svg class="gr-plot" style="top:1040px" width="1080" height="880" aria-hidden="true">${pieceAt(900, 90, 46, CORAL, 4, 14)}${pieceAt(150, 640, 38, INDIGO, 6, -18)}</svg>`;
  if (look === 'L2') art = plot({ id: 'k1', look, top: 1040, height: 620, xMax: N, xTicks: [], yMax: g.s[0] * 1.02, yStep: 1e9, yLabel: () => '', pts: g.s.map((s, i) => ({ n: i + 1, s })), stair: true, dotR: 4 }).replace(/<text[^>]*><\/text>/g, '');
  if (look === 'L3') art = `<svg class="gr-plot" style="top:0" width="1080" height="1920" aria-hidden="true">${pictureBoard('k1b', X0 + 30, 1120, RW - 60, 7, { lift: [9, 23, 30] })}</svg>`;
  return `<div class="gr-splash">${logo.html}
    <p class="gr-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="gr-c gr-hook" style="top:600px">Same puzzle.</p>
    <p class="gr-c gr-hook hot" style="top:704px">${fmtInt(N)} times.</p>
    <p class="gr-c gr-sub" style="top:836px">${h(g.puzzle)} · ${g.pieces} pieces</p>
    <p class="h-abs h-credit gr-cc" style="top:930px; width:${RW}px">${who} · ${h(g.brand)} puzzle</p>
  </div>${art}`;
}

function k2(look: Look) {
  const first10 = g.s.slice(0, 10).map((s, i) => ({ n: i + 1, s }));
  const head = `<p class="h-abs h-cap" style="top:470px">The first 10 tries</p>
    <p class="h-abs gr-big" style="top:520px">${clock(t(g.s[0]))} <span class="gr-arrow">→</span> <span class="hot">${clock(t(runBest[9]))}</span></p>`;
  if (look === 'L3') {
    const pick = [1, 2, 3, 10], K = 262, gapX = 26;
    const ws = pick.map(n => K * Math.sqrt(g.s[n - 1] / g.s[0]));
    let x = X0 + (RW - ws.reduce((a, b) => a + b, 0) - gapX * 3) / 2;
    const base = 960;
    const boards = pick.map((n, i) => {
      const w = ws[i], hh = w / ASPECT, svg = pictureBoard(`k2b${n}`, x, base - hh, w, 4, { seed: 20 + n });
      const prev = i ? g.s[pick[i - 1] - 1] : 0;
      const lab = `<text class="c-lab-b" x="${f1(x + w / 2)}" y="${base + 50}" text-anchor="middle">Try ${n}</text>
        <text class="c-lab" x="${f1(x + w / 2)}" y="${base + 92}" text-anchor="middle">${t(g.s[n - 1])}</text>
        ${i ? `<text class="gr-step down" x="${f1(x + w / 2)}" y="${base + 134}" text-anchor="middle">${pct(g.s[n - 1] / prev - 1)}</text>` : ''}`;
      x += w + gapX;
      return svg + lab;
    });
    return `${head}<svg class="gr-plot" style="top:0" width="1080" height="1920" aria-hidden="true">${boards.join('')}</svg>
      <p class="h-abs h-lab" style="top:1132px; width:${RW}px">Board size = solve time · % vs the try before</p>${credit(1180)}`;
  }
  return `${head}${plot({ id: 'k2', look, top: 616, height: 500, xMax: 10, xTicks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yMax: Math.ceil(g.s[0] / 600) * 600, yStep: 1200, yLabel: minLabel, pts: first10, stair: true, steps: true, dotR: 9, pieceS: 26 })}
    <p class="h-abs h-lab" style="top:1132px; width:${RW}px">Each dot is one solve · % vs the try before</p>${credit(1180)}`;
}

function k3(look: Look) {
  const pts = g.s.map((s, i) => ({ n: i + 1, s }));
  const ticks = [1, ...[50, 100, 150, 200, 250, 300].filter(n => n < N - 15), N];
  const notes = [{ n: 1, s: g.s[0], text: t(g.s[0]), anchor: 'start' as const, dy: 10, hot: false },
    { n: bestAt, s: best, text: `Best ${t(best)}`, anchor: 'end' as const, dy: 64, hot: true }];
  notes[0].n = 1; // the first solve label sits right of its dot
  const p = plot({ id: 'k3', look, top: 616, height: 500, xMax: N, xTicks: ticks, yMax: Math.ceil(g.s[0] / 600) * 600, yStep: 1200, yLabel: minLabel, pts, stair: true, dotR: look === 'L2' ? 5 : 6, pieceS: 13,
    notes: notes.map(n => (n.n === 1 ? { ...n, text: `  ${n.text}` } : n)),
    thumbs: look === 'L3' ? [{ n: Math.round(N * 0.18), s: runBest[Math.round(N * 0.18)], w: 150 }, { n: Math.round(N * 0.75), s: runBest[Math.round(N * 0.75)], w: 110 }] : undefined });
  return `<p class="h-abs h-cap" style="top:470px">All ${fmtInt(N)} tries · ${day(g.at[0])} – ${day(g.at[N - 1])}</p>
    <p class="h-abs gr-big" style="top:520px"><span class="hot">${pbs.size}</span> personal bests</p>${p}
    <p class="h-abs h-lab" style="top:1132px; width:${RW}px">${look === 'L2' ? 'The picture is the best time so far' : 'Coral: a new personal best'}</p>${credit(1180)}`;
}

function k4(look: Look) {
  const big = pct(-total);
  const m1 = Math.round(gain1 / 60), m2 = Math.round(gain2 / 60);
  const BW = RW - 250;
  let bars: string;
  if (look === 'L3') {
    // one coral piece per minute saved
    const row = (n: number, y: number, fill: string) => Array.from({ length: n }, (_, i) => pieceAt(X0 + 24 + (i % 21) * 40, y + Math.floor(i / 21) * 40, 24, fill, 3 + (i % 4))).join('');
    bars = `<p class="h-abs h-lab" style="top:930px">First ${h1} hours (${knee} tries)</p>
      <p class="h-abs gr-bv hot" style="top:922px; width:${RW}px; text-align:right">${MINUS}${m1} min</p>
      <svg class="gr-plot" style="top:0" width="1080" height="1920" aria-hidden="true">${row(m1, 1010, CORAL)}${row(m2, 1150, INDIGO)}</svg>
      <p class="h-abs h-lab" style="top:1080px">Next ${h2} hours (${N - knee} tries)</p>
      <p class="h-abs gr-bv" style="top:1072px; width:${RW}px; text-align:right">${MINUS}${m2} min</p>
      <p class="h-abs h-lab" style="top:1200px">One piece = one minute faster</p>`;
  } else {
    const bar = (top: number, label: string, m: number, hot: boolean) => `<p class="h-abs h-lab" style="top:${top}px">${label}</p>
      <div class="gr-bar" style="top:${top + 50}px; width:${f1(Math.max(12, BW * m / m1))}px; background:${hot ? CORAL : 'var(--c-context)'}"></div>
      <p class="h-abs gr-bv${hot ? ' hot' : ''}" style="top:${top + 44}px; left:${f1(X0 + Math.max(12, BW * m / m1) + 24)}px; width:auto">${MINUS}${m} min</p>`;
    bars = bar(940, `First ${h1} hours (${knee} tries)`, m1, true) + bar(1090, `Next ${h2} hours (${N - knee} tries)`, m2, false);
  }
  const art = look === 'L2' ? `<div class="h-mount" style="left:${RX - 250}px; top:470px; width:250px; height:${f1(250 / ASPECT)}px"><img src="${boxUrl}" alt=""></div>` : '';
  return `<p class="h-abs h-cap" style="top:470px">From first try to best</p>
    ${hero(big, { size: heroFit(big, 300, RW - 280), baseline: 780, hot: true })}${art}
    <p class="h-abs h-lead" style="top:820px; width:${RW}px">${t(g.s[0])} → <b>${t(best)}</b> · ${Math.round(hours)} hours on one puzzle</p>
    ${bars}`;
}

function k5(look: Look) {
  const x0 = X0 + 128, x1 = RX - 12, top = 690, H = 430, y0 = 24, y1 = H - 56;
  const X = (n: number) => x0 + ((n - 1) / 9) * (x1 - x0);
  const Y = (r: number) => y1 - ((r - 0.5) / 0.5) * (y1 - y0);
  const out: string[] = [];
  for (const v of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) {
    out.push(`<line x1="${x0}" x2="${x1}" y1="${f1(Y(v))}" y2="${f1(Y(v))}" stroke="var(--g-${v === 0.5 ? 'rule' : 'band'})" stroke-width="2"/>`);
    out.push(`<text class="c-lab" x="${x0 - 18}" y="${f1(Y(v) + 10)}" text-anchor="end">${Math.round(v * 100)}%</text>`);
  }
  for (let n = 1; n <= 10; n++) out.push(`<text class="c-lab" x="${f1(X(n))}" y="${y1 + 44}" text-anchor="middle">${n}</text>`);
  const line = (c: typeof c500, col: string, w: number) => `<path d="${c.map((q, i) => `${i ? 'L' : 'M'}${f1(X(q.n))} ${f1(Y(q.r))}`).join('')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  out.push(line(cSmall, INDIGO, 6), line(c500, CORAL, 7));
  for (const n of [2, 5, 10]) {
    const q = c500.find(r => r.n === n)!;
    out.push(`<circle cx="${f1(X(n))}" cy="${f1(Y(q.r))}" r="10" fill="${CORAL}"/>`);
    out.push(`<text class="c-hot-s" x="${f1(X(n) + (n === 10 ? -6 : n === 2 ? 24 : 0))}" y="${f1(Y(q.r) + (n === 2 ? 12 : -28))}" text-anchor="${n === 10 ? 'end' : n === 2 ? 'start' : 'middle'}">${ord(n)} ${pct(q.r - 1)}</text>`);
  }
  let art = '';
  if (look === 'L3') {
    // the typical board at the 1st, 2nd, 5th and 10th solve: area = median time vs the 1st
    const pick = [1, 2, 5, 10], K = 190;
    let x = X0 + 10;
    art = `<svg class="gr-plot" style="top:0" width="1080" height="1920" aria-hidden="true">${pick.map((n, i) => {
      const r = c500.find(q => q.n === n)!.r, w = K * Math.sqrt(r), s = colourBoard(x, 1440 - w * 0.75, w, 4, [CORAL, CORAL_L, SKY, INDIGO][i], 40 + n);
      x += w + 34; return s;
    }).join('')}</svg>`;
  }
  return `<p class="h-abs h-cap" style="top:470px">Everyone who repeats a puzzle</p>
    <p class="h-abs h-title s" style="top:516px; width:${RW}px">You don't need ${fmtInt(N)} tries</p>
    <p class="h-abs h-lab" style="top:634px; width:${RW}px">Typical time vs the 1st solve, by try</p>
    <svg class="gr-plot" style="top:${top}px" width="1080" height="${H}" aria-hidden="true">${out.join('')}</svg>
    <p class="h-abs gr-legend" style="top:1150px; width:${RW}px"><i style="background:${CORAL}"></i>500 pieces <i style="background:${INDIGO}"></i>200 or fewer · <b>any size, same curve</b></p>
    <p class="h-abs h-lab" style="top:1206px; width:${RW}px">1000s? The 2nd try comes ${Math.round(gap('1000') / 30)} months later, not ${gap('≤200')} days.</p>${art}`;
}

function k6(look: Look) {
  let art = '';
  if (look === 'L1') art = plot({ id: 'k6', look, top: 1080, height: 520, xMax: N, xTicks: [], yMax: g.s[0] * 1.05, yStep: 1e9, yLabel: () => '', pts: g.s.map((s, i) => ({ n: i + 1, s })), stair: true, dotR: 5, pieceS: 12 }).replace(/<text[^>]*><\/text>/g, '');
  if (look === 'L2') art = `<div class="h-mount" style="left:${X0 + 120}px; top:1130px; width:${RW - 240}px; height:${f1((RW - 240) / ASPECT)}px; transform:rotate(2deg)"><img src="${boxUrl}" alt=""></div>`;
  if (look === 'L3') art = `<svg class="gr-plot" style="top:0" width="1080" height="1920" aria-hidden="true">${pictureBoard('k6b', X0 + 120, 1130, RW - 240, 6, { lift: [4, 15] })}</svg>`;
  return `<p class="h-abs h-ask" style="top:500px; width:${RW}px">Which puzzle have you solved the most times?</p>
    <p class="h-abs h-lead" style="top:800px; width:${RW}px">Log every repeat and watch your own curve drop: myspeedpuzzling.com</p>${art}`;
}

const FRAMES_OF = [
  { k: 'K1', label: 'Splash (frame 0)', f: k1, splash: true },
  { k: 'K2', label: 'The first 10 tries (steps between tries)', f: k2 },
  { k: 'K3', label: 'Zoom out: every try, personal bests', f: k3 },
  { k: 'K4', label: 'First to best, and per hour of practice', f: k4 },
  { k: 'K5', label: 'Community curve, any size', f: k5 },
  { k: 'K6', label: 'Closing question (loops to the splash)', f: k6 },
];
const LOOKS: Array<{ id: Look; name: string; note: string }> = [
  { id: 'L1', name: 'Staircase', note: 'Every solve a dot; personal bests are coral generator pieces on a coral step line.' },
  { id: 'L2', name: 'Picture curve', note: 'The area under the best time is the box picture: it shrinks as the time drops.' },
  { id: 'L3', name: 'Shrinking puzzle', note: 'Boards of generator pieces with the box picture, sized by the solve time.' },
];

const CSS = HOUSE_CSS + LOGO_CSS + `
.gr-plot { position: absolute; left: 0; overflow: visible; }
.gr-pc { stroke: rgba(18, 24, 36, 0.55); stroke-width: 1.4; stroke-linejoin: round; }
.gr-cpc { stroke: #222a38; stroke-width: 2; stroke-linejoin: round; }
.gr-step { font-size: 30px; font-weight: 700; fill: var(--g-accent); }
.gr-step.down { fill: var(--g-hot-text); }
.gr-big { margin: 0; font-size: 96px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.gr-big .hot { color: var(--g-hot); }
.gr-arrow { color: var(--g-soft); font-weight: 500; }
.gr-who img { width: 30px; height: 30px; vertical-align: -5px; margin-right: 10px; }
.gr-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.gr-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.gr-hook { font-size: 96px; }
.gr-hook.hot { color: var(--g-hot); }
.gr-sub { font-size: 50px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.gr-cc { text-align: center; }
.gr-bar { position: absolute; left: ${X0}px; height: 56px; border-radius: 4px; }
.gr-bv { margin: 0; font-size: 56px; font-weight: 700; line-height: 1; color: var(--g-ink); }
.gr-bv.hot { color: var(--g-hot); }
.gr-legend { font-size: 32px; color: var(--g-soft); }
.gr-legend i { display: inline-block; width: 36px; height: 10px; border-radius: 5px; vertical-align: 8px; margin: 0 12px 0 0; }
.gr-legend i + i, .gr-legend i:nth-of-type(2) { margin-left: 18px; }
.gr-legend b { color: var(--g-ink); }
.splash .hf > .h-head, .splash .hf > .h-src { display: none; }
`;

// ------------------------------------------------------------------ render + gallery

activateVariant(HOUSE);
const jobs = LOOKS.flatMap(L => FRAMES_OF.map(F => ({
  key: `${L.id}-${F.k}`, look: L.id, frame: F.k, label: F.label,
  html: page(`<div class="${F.splash ? 'splash' : ''}">${frame({ ground: 'navy', kind: 'story', kicker: 'Did you know · the grind', device: HOUSE.device, src: `Solo results · data ${queried}`, rows: { headTop: 296 }, masthead: true, body: F.f(L.id) })}</div>`, { frame: 'reel', css: CSS, title: `${LAB} ${L.id}-${F.k}` }),
})));
activateVariant(undefined);

const renderer = await createRenderer(DIR);
const out: Array<{ key: string; look: Look; frame: string; label: string; jpg: string; preview: string; errors: string[] }> = [];
try {
  await metered(join(DIR, 'runs.jsonl'), { lab: LAB, run_id: `${LAB}-keyframes`, posts: 1, slides: jobs.length, engine: 'playwright/chromium' }, async () => {
    for (const j of jobs) {
      const r = await renderer.render({ id: j.key, html: j.html, frame: 'reel' });
      out.push({ key: j.key, look: j.look, frame: j.frame, label: j.label, jpg: rel(r.jpg), preview: rel(r.preview), errors: r.qa.errors });
      for (const e of r.qa.errors) console.log(`  ERROR ${j.key}: ${e}`);
    }
  });
} finally { await renderer.close(); }

writeFileSync(join(DIR, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${LAB} The grind Reel</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1d2433}header{position:sticky;top:0;z-index:2;background:#fff;padding:10px 24px;border-bottom:1px solid #e3e6eb;display:flex;flex-wrap:wrap;gap:14px;align-items:center}${LAB_NAV_CSS}
main{padding:24px;max-width:1700px}h2{margin:34px 0 4px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}.tile{background:#fff;border-radius:10px;padding:10px}.tile img{width:100%;border-radius:6px;display:block}
.code{margin:8px 0 4px;font-size:14px}.rate button{margin-right:5px;padding:3px 9px;border:1px solid #c9ced8;background:#fff;border-radius:6px;cursor:pointer}.rate button.on{background:#1d2433;color:#fff}.rate textarea{width:100%;margin-top:6px;box-sizing:border-box}.saved{color:#2a7;font-size:12px}</style></head><body>
<header>${labNav(LAB)}<h1 style="font-size:20px;margin:0">${LAB} · "The grind" Reel: key frames, three looks</h1></header>
<main><p>Concept A (owner 2026-10-27). Six key frames of the ~28 s Reel per look; the motion between them (dots dropping in, the
zoom-out from 10 to ${fmtInt(N)} tries, count-ups) comes in the builder. Rate each frame (codes like "L2-K3" work in the chat), or pick a look per frame:
mixing is fine. Data queried ${queried}: ${fmtInt(N)} solves of ${h(g.puzzle)} (${h(g.brand)} ${g.pieces}), ${t(g.s[0])} → ${t(best)}; community curve from
${fmtInt(cohort('500'))} grinds of 500s and ${fmtInt(cohort('≤200'))} of ≤200s with 10+ solves. Frames are 1080×1920; text stays in the Reel safe area (y 220–1250), art below it may be covered by Instagram's caption.</p>
<p>Claude's pick: <b>L1 Staircase</b> for the data frames (K2–K5), with <b>L3's splash</b> (the box as generator pieces says "puzzle" at first sight).</p>
${LOOKS.map(L => `<h2>${L.id} · ${L.name}</h2><p>${h(L.note)}</p><div class="grid">${out.filter(o => o.look === L.id).map(o => `<div class="tile"><a href="${o.jpg}" target="_blank"><img src="${o.preview}" alt="${o.key}"></a>
<p class="code"><b>${o.key}</b> ${h(o.label)}${o.errors.length ? ` <span style="color:#c33">${o.errors.length} QA errors</span>` : ''}</p>
<div class="rate" data-target="${o.key}"><button data-r="works">Works</button><button data-r="unsure">Unsure</button><button data-r="no-go">No-go</button><textarea rows="2" placeholder="Why? (optional)"></textarea><span class="saved"></span></div></div>`).join('')}</div>`).join('')}
</main>
<script>
async function save(box){const on=box.querySelector('button.on');const body={lab:'${LAB}',kind:'keyframe',target:box.dataset.target,rating:on?on.dataset.r:null,note:box.querySelector('textarea').value.trim()};
const r=await fetch('/api/feedback'+location.search,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const s=box.querySelector('.saved');s.textContent=r.ok?'saved':'not saved';setTimeout(()=>s.textContent='',1500);}
document.querySelectorAll('.rate').forEach(box=>{box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const was=b.classList.contains('on');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));if(!was)b.classList.add('on');save(box);});box.querySelector('textarea').addEventListener('change',()=>save(box));});
fetch('/api/feedback'+(location.search?location.search+'&':'?')+'lab=${LAB}').then(r=>r.ok?r.json():[]).then(rows=>{const l={};rows.forEach(r=>{if(r.target)l[r.target]=r;});document.querySelectorAll('.rate').forEach(box=>{const r=l[box.dataset.target];if(!r)return;if(r.rating)box.querySelector('button[data-r="'+r.rating+'"]')?.classList.add('on');box.querySelector('textarea').value=r.note||'';});});
</script></body></html>`);
console.log(`${LAB}: ${out.length} frames, ${out.reduce((s, o) => s + o.errors.length, 0)} QA errors → node tools/review.ts → /content/labs/${LAB}/`);
