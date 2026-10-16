// DL4 · data posts (the DL1 content) in the house system. Approved content; only the design changes.
// Layouts come from src/design/house.ts: cover()/fact slides follow the variant's cover layout (H1 board, H2 poster,
// H3 chapter), data slides are D5 timing boards and charts on the variant's ground. Colours only via the ground
// tokens (CSS vars --g-*, --c-*), so every slide works on navy, coral, indigo, sky, ocean or paper.
import { barGeometry, flagUrl } from '../../../src/design/svg.ts';
import { CW, FEED, W, X0, clock, cover, f1, hero, heroEm, heroFit, linesOf, slide, type SlideCtx, type Variant } from '../../../src/design/house.ts';
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw, sampleOutline, type Point } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Family, Post, Slide } from '../types.ts';

// ---------------------------------------------------------------- helpers
const polar = (cx: number, cy: number, r: number, a: number): Point => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) return `${arc(cx, cy, r, a0, a0 + Math.PI)} ${arc(cx, cy, r, a0 + Math.PI, a0 + Math.PI * 2).replace(/^M [^A]+/, '')}`;
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M ${f1(x0)} ${f1(y0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}
const TOP = -Math.PI / 2;
const minAngle = (m: number) => TOP + (m / 60) * Math.PI * 2;
const pct1 = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}%`;
const toMin = (t: string) => t.split(':').map(Number).reduce((s, v) => s * 60 + v, 0) / 60;

/** Builds a post: `make(ctx)` per slide with the slide's position known up front (index, count). */
function post(v: Variant, key: string, makers: Array<(c: SlideCtx) => string>, frameKind?: Slide['frame']): Post {
  return { key, slides: makers.map((m, i) => ({ id: `${key}-${i + 1}`, body: m({ v, post: key, slide: i + 1, of: makers.length }), frame: frameKind })) };
}

// ---------------------------------------------------------------- the 59-minute wall
function wall(c: Content, v: Variant): Post {
  const w = c.dl1.wall;
  const wallMin = Number(w.title.match(/\d+/)![0]);
  const hour = wallMin + 1;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;
  const step = (m: number) => ((at(m) - at(m - 1)) / at(m - 1)) * 100;

  // Cover art for the board layout: a 60-minute dial, the race runs to the wall minute, the hour is an ink bar.
  const cx = W / 2, cy = 780, R = 270;
  const ticks = Array.from({ length: 60 }, (_, m) => {
    const major = m % 5 === 0;
    const [x0, y0] = polar(cx, cy, R - 42 - (major ? 26 : 0), minAngle(m)), [x1, y1] = polar(cx, cy, R - 42, minAngle(m));
    return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="${major ? 'var(--g-ink)' : 'var(--g-rule)'}" stroke-width="${major ? 6 : 3}" stroke-linecap="round"/>`;
  }).join('');
  const [wx0, wy0] = polar(cx, cy, R - 30, minAngle(0)), [wx1, wy1] = polar(cx, cy, R + 34, minAngle(0));
  const dial = `<svg width="${W}" height="1350" style="position:absolute; left:0; top:0" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--g-band)" stroke-width="30"/>
    <path d="${arc(cx, cy, R, minAngle(0), minAngle(wallMin))}" fill="none" stroke="var(--c-hot)" stroke-width="30"/>
    <line x1="${f1(wx0)}" y1="${f1(wy0)}" x2="${f1(wx1)}" y2="${f1(wy1)}" stroke="var(--g-ink)" stroke-width="10"/>
    ${ticks}
  </svg>
  ${hero(String(wallMin), { size: 190, baseline: cy + 64, center: true })}
  <p class="h-cap" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 92}px">Minutes</p>`;

  // Histogram.
  const CH = 520, top2 = 540;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: CW, height: CH, padding: 0.22 });
  const hot = (m: number) => m > wallMin - 5 && m <= wallMin;
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${hot(b.datum.minute) ? 'var(--c-hot)' : 'var(--c-base)'}"/>`).join('');
  const line60 = g.xScale(String(hour))! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const mid = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
  const first = w.histogram[0].minute, last = w.histogram[w.histogram.length - 1].minute;

  const splits = [...w.noStepAt, hour].map(m => ({ m, finishes: at(m), change: step(m) }));
  const under = w.subHour.under60, over = w.subHour.puzzlers - under;
  const split = (under / w.subHour.puzzlers) * CW;

  return post(v, 'wall', [
    x => cover(x, 'cover', {
      kicker: w.kicker, title: w.title, dek: w.dek, src: c.source,
      art: dial, hero: { value: String(wallMin), unit: 'min', hot: true, max: 360 },
    }),
    x => slide(x, 'data', { kicker: w.kicker, src: c.source, title: `${w.mode.minute} minutes is the most common finish. Then the counts drop.`, body: `
      <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top2}px">
        ${bars}
        <line x1="${f1(line60)}" x2="${f1(line60)}" y1="-78" y2="${CH}" stroke="var(--g-ink)" stroke-width="4"/>
        <text class="c-lab-b" x="${f1(line60 - 18)}" y="${f1(modeBar.y - 56)}" text-anchor="end">${w.mode.minute} min</text>
        <text class="c-lab" x="${f1(line60 - 18)}" y="${f1(modeBar.y - 18)}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
        <text class="c-hot" x="${f1(line60 + 20)}" y="${f1(modeBar.y - 42)}">${pct1(w.dropPct)}</text>
        <text class="c-lab" x="${f1(line60 + 20)}" y="${f1(modeBar.y - 4)}">at the hour</text>
        <text class="c-lab" x="${f1(mid(first))}" y="${CH + 46}" text-anchor="middle">${first}</text>
        <text class="c-lab" x="${f1(mid(50))}" y="${CH + 46}" text-anchor="middle">50</text>
        <text class="c-lab-b" x="${f1(line60)}" y="${CH + 48}" text-anchor="middle">${fmtDuration(hour)}</text>
        <text class="c-lab" x="${f1(mid(70))}" y="${CH + 46}" text-anchor="middle">70</text>
        <text class="c-lab" x="${CW}" y="${CH + 46}" text-anchor="end">${last} min</text>
      </svg>` }).html,
    x => slide(x, 'data', { kicker: w.kicker, src: c.source, title: w.context, body: `
      <div class="h-board" style="top:470px">
        <div class="h-bh"><span style="flex:1">Into minute</span><span style="width:260px; text-align:right">Finishes</span><span style="width:240px; text-align:right">Change</span></div>
        ${splits.map(s => `<div class="h-br ${s.m === hour ? 'hot' : ''}" style="height:150px">
          <span class="h-big" style="flex:1; font-size:84px">${clock(fmtDuration(s.m))}</span>
          <span style="width:260px; text-align:right; font-size:44px; font-weight:500">${fmtInt(s.finishes)}</span>
          <span class="h-big ${s.m === hour ? 'hot' : ''}" style="width:240px; text-align:right; font-size:64px">${pct1(s.change)}</span>
        </div>`).join('')}
        <p class="h-dek" style="margin-top:34px; font-size:32px">Change in finishes from the minute before.</p>
      </div>` }).html,
    x => cover(x, 'fact', {
      kicker: w.kicker, title: 'of 500-piece puzzlers have a personal best under one hour', src: c.source,
      hero: { value: `${w.subHour.pct}%`, max: 300 }, extraHeight: 400,
      extra: `<svg width="${CW}" height="230" style="display:block">
        <text class="c-cap" x="0" y="34">UNDER ${fmtDuration(hour)}</text>
        <text class="c-cap" x="${CW}" y="34" text-anchor="end">OVER</text>
        <rect x="0" y="62" width="${f1(split - 6)}" height="64" fill="var(--c-hot)"/>
        <rect x="${f1(split + 6)}" y="62" width="${f1(CW - split - 6)}" height="64" fill="var(--c-base)"/>
        <text class="c-lab-b" x="0" y="180">${fmtInt(under)}</text>
        <text class="c-lab-b" x="${CW}" y="180" text-anchor="end">${fmtInt(over)}</text>
        <text class="c-lab" x="0" y="220">puzzlers</text>
        <text class="c-lab" x="${CW}" y="220" text-anchor="end">puzzlers</text>
      </svg>
      <p class="h-ask" style="margin-top:20px">${h(w.question)}</p>`,
    }),
  ]);
}

// ---------------------------------------------------------------- record
function record(c: Content, v: Variant): Post {
  const r = c.dl1.record;
  const firstTry = toMin(r.value), overall = toMin(r.overall);
  const scale = (m: number) => (m / 60) * CW;
  const lanes = [{ label: 'First try', m: firstTry, hot: true }, { label: 'Overall record', m: overall, hot: false }];
  const chart = `<svg width="${CW}" height="300" style="display:block">
      ${[0, 15, 30, 45, 60].map(m => `<line x1="${f1(scale(m))}" x2="${f1(scale(m))}" y1="0" y2="240" stroke="var(--g-band)" stroke-width="2"/>`).join('')}
      ${lanes.map((l, i) => `
        <text class="c-cap" x="0" y="${i * 120 + 32}">${h(l.label.toUpperCase())}</text>
        <rect x="0" y="${i * 120 + 50}" width="${CW}" height="40" fill="var(--g-band)"/>
        <rect x="0" y="${i * 120 + 50}" width="${f1(scale(l.m))}" height="40" fill="${l.hot ? 'var(--c-hot)' : 'var(--c-context)'}"/>
        <text class="c-lab-b" x="${f1(scale(l.m) + 18)}" y="${i * 120 + 82}">${fmtDuration(l.m)}</text>`).join('')}
      ${[0, 15, 30, 45, 60].map(m => `<text class="c-lab" x="${f1(scale(m))}" y="290" text-anchor="${m === 0 ? 'start' : m === 60 ? 'end' : 'middle'}">${fmtDuration(m)}</text>`).join('')}
    </svg>`;
  return post(v, 'record', [
    x => cover(x, 'fact', {
      kicker: `${r.kicker} · solo 500 pieces`, title: r.title, dek: r.context, src: c.source,
      hero: { value: r.value, max: 300 }, extra: chart, extraHeight: 300,
    }),
  ]);
}

// ---------------------------------------------------------------- local helpers (proposed for house.ts, see README)
/**
 * Board extras the house CSS doesn't carry yet: flags in board rows, two-line "who" cells (name, handle, detail),
 * a reference line under a board, key/value rows. Injected per slide as a <style> block (display:none, QA skips it).
 */
const LOCAL_CSS = `<style>
.d4-flag { display: block; flex: none; width: 44px; height: 44px; margin-right: 20px; }
.h-br .who { flex: 1; min-width: 0; }
.h-br .who .nm { display: flex; align-items: center; line-height: 1.15; }
.h-br .who .nm .d4-flag { width: 40px; height: 40px; margin-right: 16px; }
.h-br .who .nm span { min-width: 0; overflow-wrap: anywhere; }
.h-br .who .sub { margin-top: 6px; }
.h-br .ig { font-size: 30px; font-weight: 500; line-height: 1.2; color: var(--g-accent); margin-top: 6px; overflow-wrap: anywhere; }
.d4-ref { display: flex; gap: 36px; white-space: nowrap; font-size: 30px; color: var(--g-soft); }
.d4-ref b { color: var(--g-ink); font-weight: 700; }
</style>`;

/** Largest hero size whose figures plus the 0.2 em unit fit the column (house heroFit only counts the figures). */
const heroFitUnit = (v: string, unit: string, max: number) => Math.min(max, Math.floor((CW - 8) / (heroEm(v) + 0.1 + 0.2 * 0.62 * unit.length)));

/** Key / value rows (a small board) for cover extras: label in the accent caps, value as a bold number. */
const kvRows = (rows: Array<[string, string]>, rowH = 92, valPx = 56) => rows.map(([k, val]) => `<div class="h-br" style="height:${rowH}px">
  <span class="h-cap" style="flex:1">${h(k)}</span><span class="h-big" style="font-size:${valPx}px">${clock(val)}</span></div>`).join('');

/** A split bar (two sides of a whole) with labels and counts, for fact extras. Height 230. */
function splitBar(o: { left: string; right: string; a: number; b: number; unit: string }): string {
  const split = (o.a / (o.a + o.b)) * CW;
  return `<svg width="${CW}" height="230" style="display:block" aria-hidden="true">
    <text class="c-cap" x="0" y="34">${h(o.left.toUpperCase())}</text>
    <text class="c-cap" x="${CW}" y="34" text-anchor="end">${h(o.right.toUpperCase())}</text>
    <rect x="0" y="62" width="${f1(split - 6)}" height="64" fill="var(--c-hot)"/>
    <rect x="${f1(split + 6)}" y="62" width="${f1(CW - split - 6)}" height="64" fill="var(--c-base)"/>
    <text class="c-lab-b" x="0" y="180">${fmtInt(o.a)}</text>
    <text class="c-lab-b" x="${CW}" y="180" text-anchor="end">${fmtInt(o.b)}</text>
    <text class="c-lab" x="0" y="220">${h(o.unit)}</text>
    <text class="c-lab" x="${CW}" y="220" text-anchor="end">${h(o.unit)}</text>
  </svg>`;
}
/** The question that closes a post (house .h-ask: device-coloured bar + 54 px bold). Height ≈ 34 + 61 per line. */
const ask = (q: string, mt = 20) => `<p class="h-ask" style="margin-top:${mt}px">${h(q)}</p>`;
const askH = (q: string) => 34 + linesOf(q, 54, CW, true) * 61;

/**
 * A round puzzle (D5 lineage): n interlocking pieces from one generated strip, wrapped into a ring. The strip has
 * n+1 columns; pieces 1..n are kept and the last piece's right edge is replaced by the first piece's left cut, so
 * the ring closes on a real knob. Outlines are sampled densely and mapped x→angle, y→radius.
 */
function pieceRing(n: number, cx: number, cy: number, rIn: number, rOut: number, seed = 4): string[] {
  const pw = 100, width = rOut - rIn;
  const ph = (pw * width) / ((Math.PI * (rIn + rOut)) / n);
  const jig = generateJigsaw({ cols: n + 1, rows: 1, width: (n + 1) * pw, height: ph, seed, tabSize: 0.24, jitter: 0.04 });
  const ps = [...jig.pieces].sort((a, b) => a.col - b.col);
  // outline = start + 9 points per edge: top 1..9, right 10..18, bottom 19..27, left 28..36 (left runs bottom→top).
  const wrapRight = ps[1].outline.slice(27, 37).reverse().map(([x, y]) => [x + n * pw, y] as Point);
  const rot0 = -Math.PI / n; // centre the first piece at 12 o'clock
  const map = ([x, y]: Point): Point => polar(cx, cy, rOut - (y / ph) * width, rot0 + TOP + ((x - pw) / (n * pw)) * Math.PI * 2);
  return ps.slice(1).map(p => {
    const outline = p.col === n ? [...p.outline.slice(0, 10), ...wrapRight.slice(1), ...p.outline.slice(19)] : p.outline;
    const pts = sampleOutline(outline, 24).map(map);
    return `M ${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ')} Z`;
  });
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}`; // "28 Sep"
const monthLabel = (ym: string, month: 'short' | 'long' = 'short') => new Date(ym + '-01T12:00:00Z').toLocaleDateString('en-US', { month, timeZone: 'UTC' });
/** Shortens text to at most `max` characters at a word boundary, with an ellipsis. */
const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return `${(/\s/.test(s[max - 1]) ? head : head.replace(/\s+\S*$/, '') || head).replace(/[\s,.:;·–-]+$/, '')}…`;
};
/** Height of an H1 board-cover title (XL, 84 px), as cover() budgets it. */
const boardTitleH = (t: string) => linesOf(t, 84, CW, true) * 84 * 1.04;

// ---------------------------------------------------------------- countries (single, data board)
function countries(c: Content, v: Variant): Post {
  const k = c.dl1.countries;
  const lead = k.top[0].medianPb;
  const refs = [...k.reference].reverse().filter(r => r.value !== null);
  return post(v, 'countries', [
    x => slide(x, 'data', { kicker: 'Solo 500 pieces · median PB', src: c.source, title: k.title, body: LOCAL_CSS + `
      <div class="h-board" style="top:352px">
        <div class="h-bh"><span style="width:76px">#</span><span style="flex:1">Country · ${k.minPuzzlers}+ puzzlers</span><span style="width:160px; text-align:right">Time</span><span style="width:150px; text-align:right">Gap</span></div>
        ${k.top.map((d, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:68px">
          <span class="rk">${pad2(i + 1)}</span><img class="d4-flag" src="${flagUrl(d.code)}" alt="">
          <span class="nm"${i === 0 ? ' style="font-weight:700"' : ''}>${h(d.name)}</span>
          <span class="tm" style="width:160px">${fmtDuration(d.medianPb)}</span>
          <span style="width:150px; text-align:right; font-size:32px; color:var(--g-soft)">${i === 0 ? '' : `+${fmtDuration(d.medianPb - lead)}`}</span></div>`).join('')}
        <div class="d4-ref" style="margin-top:26px">${refs.map(r => `<span>${h(r.label)} <b>${fmtDuration(r.value!)}</b></span>`).join('')}</div>
      </div>` }).html,
  ]);
}

// ---------------------------------------------------------------- share (single, 100-tick ring)
function share(c: Content, v: Variant): Post {
  const s = c.dl1.share;
  // Purple (c-cool) is the accent series; coral marks the lead size.
  const colour: Record<string, string> = { '500': 'var(--c-hot)', 'under 500': 'var(--c-cool)', '1000': 'var(--c-context)', other: 'var(--c-base)' };
  const cx = W / 2, cy = 656, r0 = 214, r1 = 290;
  const keys = s.units.flatMap(u => Array.from({ length: u.units }, () => u.key));
  const ticks = keys.map((key, i) => {
    const a = TOP + ((i + 0.5) / keys.length) * Math.PI * 2;
    const [x0, y0] = polar(cx, cy, r0, a), [x1, y1] = polar(cx, cy, r1, a);
    return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="${colour[key]}" stroke-width="10"/>`;
  }).join('');
  const lead = s.parts[0];
  return post(v, 'share', [
    x => slide(x, 'data', { kicker: 'Puzzle sizes · all results', src: `1 tick = 1% of ${fmtInt(c.dl1.totals.results)} results · ${c.asOf}`, title: s.title, body: `
      <svg width="${W}" height="1350" style="position:absolute; left:0; top:0" aria-hidden="true">${ticks}</svg>
      ${hero(`${lead.pct}%`, { size: 150, baseline: cy + 44, center: true })}
      <p class="h-cap" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + 76}px">${h(s.labels[lead.key])}</p>
      <div class="h-legend h-abs" style="top:1012px">${s.parts.map(p => `<span><i class="h-sw" style="background:${colour[p.key]}"></i><b>${p.pct}%</b> ${h(s.labels[p.key])}</span>`).join('')}</div>` }).html,
  ]);
}

// ---------------------------------------------------------------- xp (single, the Level 50 ring of pieces)
function xp(c: Content, v: Variant): Post {
  const x = c.dl1.xp;
  const club = x.distribution.find(d => d.level === x.level)?.players ?? 0;
  const cx = W / 2, cy = 516, rOut = 280, rIn = 164;
  const ring = pieceRing(Math.max(club, 3), cx, cy, rIn, rOut, 4);
  return post(v, 'xp', [
    s => slide(s, 'data', { kicker: x.kicker, src: c.source, body: `
      <svg width="${W}" height="1350" style="position:absolute; left:0; top:0" aria-hidden="true">
        ${ring.map(d => `<path d="${d}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="6" stroke-linejoin="round"/>`).join('')}
      </svg>
      <p class="h-cap" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy - 112}px; letter-spacing:0.3em; text-indent:0.3em">Level</p>
      ${hero(String(x.level), { size: 190, baseline: cy + 80, center: true })}
      <p class="h-cap" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy + rOut + 30}px">1 piece = 1 puzzler at level ${x.level}</p>
      <h1 class="h-title" style="top:${cy + rOut + 104}px; font-size:64px">${h(x.title)}</h1>
      <p class="h-dek h-abs" style="top:${cy + rOut + 194}px">${h(x.dek)}. ${h(x.context)}</p>` }).html,
  ]);
}

// ---------------------------------------------------------------- weekly (carousel: cover, top puzzles, fastest boards, bests)
type Fast = Content['dl1']['weekly']['fastest500'][number];
type FastGroup = Fast & { also: string[]; samePuzzle: boolean };
/** One row per puzzler: the best time leads, any further top times by the same puzzler are listed under it. */
function byPlayer(rows: Fast[]): FastGroup[] {
  const out: FastGroup[] = [];
  for (const r of rows) {
    const g = out.find(o => o.player === r.player);
    if (g) { g.also.push(r.time); g.samePuzzle &&= g.puzzle === r.puzzle; } else out.push({ ...r, also: [], samePuzzle: true });
  }
  return out;
}

function weekly(c: Content, v: Variant): Post {
  const w = c.dl1.weekly;
  const kick = `${w.series} · Ep. ${w.episode}`;
  const g500 = byPlayer(w.fastest500), g1000 = byPlayer(w.fastest1000);

  // H1 cover art: a one-week dial (a full lap, day initials round the bezel) carrying the episode number.
  const cx = W / 2, cy = 690, R = 226;
  const dayTicks = Array.from({ length: 7 }, (_, d) => {
    const a = TOP + (d / 7) * Math.PI * 2;
    const [x0, y0] = polar(cx, cy, R - 30, a), [x1, y1] = polar(cx, cy, R - 50, a);
    return `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}" stroke="var(--g-ink)" stroke-width="6" stroke-linecap="round"/>`;
  }).join('');
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, d) => {
    const [x, y] = polar(cx, cy, R + 58, TOP + ((d + 0.5) / 7) * Math.PI * 2);
    return `<text class="c-cap" x="${f1(x)}" y="${f1(y + 11)}" text-anchor="middle" style="letter-spacing:0">${l}</text>`;
  }).join('');
  const dial = `<svg width="${W}" height="1350" style="position:absolute; left:0; top:0" aria-hidden="true">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--c-hot)" stroke-width="30"/>
      ${dayTicks}${dayNames}
    </svg>
    <p class="h-cap" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy - 128}px; letter-spacing:0.3em; text-indent:0.3em">Episode</p>
    ${hero(pad2(w.episode), { size: 196, baseline: cy + 86, center: true })}`;
  const stats: Array<[string, string]> = [['Results', fmtInt(w.results)], ['Week on week', fmtSignedPct(w.resultsChangePct)], ['Puzzlers', fmtInt(w.puzzlers)]];

  // Fastest boards, one slide per size, one row per puzzler (repeat finishes fold into "Also").
  const detail = (g: FastGroup) => {
    const brand = cut(g.brand, 24);
    return `${h(cut(g.puzzle, 66 - brand.length - 3 - (g.firstAttempt ? 16 : 0)))}&nbsp;· ${h(brand)}${g.firstAttempt ? '&nbsp;· first&nbsp;attempt' : ''}`;
  };
  const fastRow = (g: FastGroup, i: number) => `<div class="h-br ${i === 0 ? 'hot' : ''}">
    <span class="rk">${pad2(i + 1)}</span>
    <div class="who" style="padding:28px 0"><p class="nm" style="font-size:42px">${g.country ? `<img class="d4-flag" src="${flagUrl(g.country)}" alt="">` : ''}<span>${h(cut(g.player, 48))}</span></p>
      ${g.handle ? `<p class="ig">@${h(g.handle)}</p>` : ''}
      <p class="sub">${detail(g)}</p>
      ${g.also.length ? `<p class="sub">Also ${andList(g.also)}${g.samePuzzle ? ' on the same puzzle' : ''}</p>` : ''}</div>
    <span class="h-big" style="width:220px; text-align:right; font-size:52px">${clock(g.time)}</span></div>`;
  // The leader is named in the title when it still fits two lines; the board always names everyone.
  const title = (size: string, leader: string) => (`The week's fastest solo ${size}: ${leader}`.length <= 48 ? `The week's fastest solo ${size}: ${leader}` : `The week's fastest solo ${size}`);
  const fastest = (gs: FastGroup[], size: string) => (x: SlideCtx) => slide(x, 'data', { kicker: kick, src: c.source, title: title(size, gs[0].player), body: LOCAL_CSS + `
      <div class="h-board" style="top:380px">
        <div class="h-bh"><span style="width:76px">#</span><span style="flex:1">Solo ${size} pieces</span><span style="width:220px; text-align:right">Time</span></div>
        ${gs.map(fastRow).join('')}</div>` }).html;

  const tp = w.topPuzzles;
  const bests: Array<[string, string]> = [['New puzzlers', fmtInt(w.newPuzzlers)], ['Puzzlers', fmtInt(w.puzzlers)], ['Pieces', fmtInt(w.pieces)]];
  return post(v, 'weekly', [
    x => cover(x, 'cover', {
      kicker: `Season ${w.season} · Episode ${w.episode}`, title: w.series, dek: w.range, src: c.source,
      art: dial, hero: { value: fmtInt(w.results), unit: 'results', max: heroFitUnit(fmtInt(w.results), 'results', 300) },
      // The board cover shows the dial, so its strip carries the results; the hero layouts lead with them.
      stats: v.cover === 'board' ? stats : stats.slice(1),
    }),
    x => slide(x, 'data', { kicker: kick, src: c.source, title: `${tp[0].puzzle} was the most-solved puzzle of the week`, body: LOCAL_CSS + `
      <div class="h-board" style="top:360px">
        <div class="h-bh"><span style="width:76px">#</span><span style="flex:1">Puzzle</span><span style="width:180px; text-align:right">Solvers</span></div>
        ${tp.map((p, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:132px">
          <span class="rk">${pad2(i + 1)}</span>
          <div class="who"><p class="nm"${i === 0 ? ' style="font-weight:700"' : ''}>${h(p.puzzle)}</p><p class="sub">${h(p.brand)} · ${fmtInt(p.pieces)} pieces</p></div>
          <span class="tm" style="width:180px">${fmtInt(p.solvers)}</span></div>`).join('')}
      </div>` }).html,
    ...(g500.length ? [fastest(g500, '500')] : []),
    ...(g1000.length ? [fastest(g1000, '1,000')] : []),
    x => cover(x, 'fact', {
      kicker: kick, title: 'personal bests were set last week', src: c.source,
      hero: { value: fmtInt(w.personalBests), max: 300 },
      extra: `<div>${kvRows(bests)}</div>${ask(w.question, 40)}`, extraHeight: bests.length * 92 + 40 + askH(w.question),
    }),
  ]);
}

// ---------------------------------------------------------------- event (preview + benchmark)
function event(c: Content, v: Variant): Post {
  const e = c.dl1.event;
  const facts: Array<[string, string]> = [['Date', e.date], ['Venue', e.location], ['On MSP', `${fmtInt(e.onMsp)} of ${fmtInt(e.registered)} registered`]];
  const factRows = facts.map(([k, val]) => `<div class="h-br" style="height:92px"><span class="h-cap" style="width:230px">${h(k)}</span><span class="nm" style="font-weight:700; font-size:40px">${h(val)}</span></div>`).join('');
  const reg = fmtInt(e.registered);
  // H1 board art: the number under the title, centred in the room between the title and the facts board.
  const zoneTop = FEED.contentTop + boardTitleH(e.name) + 40, zoneBottom = FEED.contentBottom - facts.length * 92 - 40;
  const hs = Math.min(260, heroFit(reg, 260));
  const heroTop = zoneTop + Math.max(0, (zoneBottom - zoneTop - (hs * 0.72 + 30 + 36)) / 2);
  const art = `${hero(reg, { size: hs, baseline: heroTop + hs * 0.72 })}
    <p class="h-cap h-abs" style="top:${f1(heroTop + hs * 0.72 + 30)}px">Registered puzzlers</p>`;

  const makers: Array<(x: SlideCtx) => string> = [
    x => cover(x, 'cover', {
      kicker: 'Event preview', title: e.name, src: c.source, art,
      hero: { value: reg, unit: 'registered', max: heroFitUnit(reg, 'registered', 300) },
      extra: `<div>${factRows}</div>`, extraHeight: facts.length * 92,
    }),
  ];
  if (e.usMedianPb) {
    const usPb = e.usMedianPb;
    const pb = toMin(usPb);
    const max = Math.ceil(pb / 30) * 30 + (Math.ceil(pb / 30) * 30 - pb < 10 ? 30 : 0); // the next half hour past the benchmark
    const scale = (m: number) => (m / max) * CW;
    const ticks = Array.from({ length: max / 30 + 1 }, (_, i) => i * 30);
    makers.push(x => slide(x, 'data', { kicker: 'Event preview · solo 500 pieces', src: c.source, title: 'The benchmark: the median US personal best', body: `
      ${hero(usPb, { size: 230, baseline: 560 })}
      <svg width="${CW}" height="330" style="position:absolute; left:${X0}px; top:620px" aria-hidden="true">
        ${ticks.map(m => `<line x1="${f1(scale(m))}" x2="${f1(scale(m))}" y1="0" y2="270" stroke="var(--g-band)" stroke-width="2"/>`).join('')}
        <text class="c-cap" x="0" y="32">US MEDIAN PB${e.usPuzzlers ? ` · ${fmtInt(e.usPuzzlers)} PUZZLERS` : ''}</text>
        <rect x="0" y="54" width="${CW}" height="44" fill="var(--g-band)"/>
        <rect x="0" y="54" width="${f1(scale(pb))}" height="44" fill="var(--c-context)"/>
        <text class="c-lab-b" x="${f1(scale(pb) + 18)}" y="88">${h(usPb)}</text>
        <text class="c-cap" x="0" y="167">YOUR GOAL TIME</text>
        <rect x="2" y="191" width="${CW - 4}" height="40" fill="none" stroke="var(--g-accent)" stroke-width="3" stroke-dasharray="12 10"/>
        ${ticks.map(m => `<text class="c-lab" x="${f1(scale(m))}" y="314" text-anchor="${m === 0 ? 'start' : m === max ? 'end' : 'middle'}">${fmtDuration(m)}</text>`).join('')}
      </svg>
      <div class="h-abs" style="top:1000px">${ask(e.question, 0)}</div>` }).html);
  }
  return post(v, 'event', makers);
}

// ---------------------------------------------------------------- feature (XP launch day: chart cover + backfill fact)
function feature(c: Content, v: Variant): Post {
  const f = c.dl1.feature;
  // Complete days only: the as-of day is still running.
  const days = f.days.filter(d => !c.dl1.asOf.startsWith(dayLabel(d.day) + ' '));
  const isLaunch = (d: { day: string }) => f.launchDate.startsWith(dayLabel(d.day) + ' ');
  const range = `${dayLabel(days[0].day)} – ${dayLabel(days.at(-1)!.day)}`;
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;

  /** Daily bars, the launch day hot, the typical day as an ink line. `full` adds the D5 annotations. */
  const chart = (CH: number, full: boolean) => {
    const g = barGeometry(days, { x: d => d.day, y: d => d.results, width: CW, height: CH, padding: 0.22 });
    const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${isLaunch(b.datum) ? 'var(--c-hot)' : 'var(--c-base)'}"/>`).join('');
    const launch = g.bars.find(b => isLaunch(b.datum))!;
    const ty = g.yScale(f.typicalDay);
    const wk = g.bars[7];
    return `<svg width="${CW}" height="${CH + 56}" style="display:block" aria-hidden="true">
      ${bars}
      <line x1="0" x2="${CW}" y1="${f1(ty)}" y2="${f1(ty)}" stroke="var(--g-ink)" stroke-width="3"/>
      ${full ? `<text class="c-cap" x="0" y="${f1(ty - 56)}">TYPICAL DAY</text>
      <text class="c-lab-b" x="0" y="${f1(ty - 14)}">${fmtInt(f.typicalDay)}</text>
      <text class="c-hot" x="${f1(launch.x - 20)}" y="${f1(launch.y + 46)}" text-anchor="end">${fmtInt(f.results)}</text>
      <text class="c-lab" x="${f1(launch.x - 20)}" y="${f1(launch.y + 86)}" text-anchor="end">launch day, ${f.multiple}× typical</text>` : ''}
      <text class="c-lab" x="0" y="${CH + 46}">${h(dayLabel(days[0].day))}</text>
      ${full && wk && wk !== launch ? `<text class="c-lab" x="${f1(mid(wk))}" y="${CH + 46}" text-anchor="middle">${h(dayLabel(wk.datum.day))}</text>` : ''}
      <text class="c-lab-b" x="${f1(launch.x + launch.width)}" y="${CH + 48}" text-anchor="end">${h(dayLabel(launch.datum.day))}</text>
    </svg>`;
  };
  // H1 board art: the full chart under title and dek.
  const dekTop = FEED.contentTop + boardTitleH(f.title) + 22;
  const artTop = dekTop + linesOf(f.dek, 38) * 38 * 1.3 + 44;
  const artCH = FEED.contentBottom - 40 - artTop - 56 - 60;
  const art = `<p class="h-cap h-abs" style="top:${f1(artTop)}px">Results logged per day · ${h(range)}</p>
    <div class="h-abs" style="top:${f1(artTop + 60)}px">${chart(artCH, true)}</div>`;
  // Hero layouts: a compact chart with a one-line key under it.
  const compactCH = 170;
  const compact = `${chart(compactCH, false)}
    <p class="h-lab" style="margin-top:14px">Results per day · typical day <b style="color:var(--g-ink)">${fmtInt(f.typicalDay)}</b> · launch day ${f.multiple}×</p>`;

  return post(v, 'feature', [
    x => cover(x, 'cover', {
      kicker: f.kicker, title: f.title, dek: f.dek, src: c.source, art,
      hero: { value: fmtInt(f.results), unit: 'results', hot: true, max: heroFitUnit(fmtInt(f.results), 'results', 300) },
      extra: v.cover === 'board' ? undefined : compact, extraHeight: compactCH + 56 + 14 + 40,
    }),
    x => cover(x, 'fact', {
      kicker: f.kicker, title: 'of launch-day results were puzzles solved before that day', src: c.source,
      hero: { value: `${f.backfilledPct}%`, max: 300 },
      extra: splitBar({ left: 'Solved earlier', right: 'Solved that day', a: f.backfilled, b: f.results - f.backfilled, unit: 'results' }) + ask(f.question),
      extraHeight: 230 + 20 + askH(f.question),
    }),
  ]);
}

// ---------------------------------------------------------------- month (record September: cover, chart, board)
function month(c: Content, v: Variant): Post {
  const m = c.dl1.month;
  const cur = m.series.at(-1)!;
  const prevKey = `${Number(cur.month.slice(0, 4)) - 1}${cur.month.slice(4)}`;
  const prev = m.series.find(x => x.month === prevKey)!;
  const long = (ym: string) => `${monthLabel(ym, 'long')} ${ym.slice(0, 4)}`;
  const short = (ym: string) => `${monthLabel(ym)} ${ym.slice(0, 4)}`;
  const kick = `Monthly report · ${m.label}`;
  const res = fmtInt(m.results);
  const delta = fmtSignedPct(m.vsLastYearPct, 0);

  // H1 board art: the number, its label and the year-on-year line, centred between the title and the stat strip.
  const zoneTop = FEED.contentTop + boardTitleH(m.title) + 40, zoneBottom = FEED.contentBottom - 124 - 40;
  const hs = heroFit(res, 250);
  const gap = Math.round(hs * 0.21) + 16; // clears the comma's descender
  const block = hs * 0.72 + gap + 36 + 40 + 80;
  const heroTop = zoneTop + Math.max(0, (zoneBottom - zoneTop - block) / 2);
  const base = heroTop + hs * 0.72;
  const art = `${hero(res, { size: hs, baseline: base })}
    <p class="h-cap h-abs" style="top:${f1(base + gap)}px">Results logged</p>
    <p class="h-abs" style="top:${f1(base + gap + 76)}px; display:flex; align-items:baseline; gap:22px"><span class="h-big hot" style="font-size:72px">${h(delta)}</span><span class="h-dek">vs ${h(long(prev.month))}</span></p>`;

  // Chart: every month, this one hot, the same month last year in the accent (our purple).
  const CH = 500, top2 = 540;
  const g = barGeometry(m.series, { x: d => d.month, y: d => d.results, width: CW, height: CH, padding: 0.2, yMax: Math.max(...m.series.map(d => d.results)) * 1.14 });
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${b.datum === cur ? 'var(--c-hot)' : b.datum === prev ? 'var(--c-cool)' : 'var(--c-base)'}"/>`).join('');
  const bCur = g.bars.at(-1)!, iPrev = g.bars.findIndex(b => b.datum === prev), bPrev = g.bars[iPrev];
  const prevTop = Math.min(...g.bars.slice(Math.max(0, iPrev - 1), iPrev + 2).map(b => b.y));
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
  const jan = g.bars.filter(b => b.datum.month.endsWith('-01'));

  const rowsT: Array<[string, number, number]> = [
    ['Results', prev.results, cur.results], ['Active puzzlers', prev.active, cur.active],
    ['Pieces', prev.pieces, cur.pieces], ['New puzzlers', prev.newPlayers, cur.newPlayers],
  ];
  const allUp = rowsT.every(([, a, b]) => b > a);
  return post(v, 'month', [
    x => cover(x, 'cover', {
      kicker: kick, title: m.title, src: c.source, art,
      dek: v.cover === 'board' ? undefined : `Up ${m.vsLastYearPct}% on ${long(prev.month)}`,
      hero: { value: res, unit: 'results', hot: true, max: heroFitUnit(res, 'results', 300) },
      stats: [['Active puzzlers', fmtInt(m.active)], ['New puzzlers', fmtInt(m.newPlayers)]],
    }),
    x => slide(x, 'data', { kicker: kick, src: c.source, title: `${monthLabel(cur.month, 'long')} results were up ${m.vsLastYearPct}% on a year earlier`, body: `
      <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top2}px" aria-hidden="true">
        ${bars}
        <text class="c-hot" x="${f1(bCur.x + bCur.width)}" y="${f1(bCur.y - 18)}" text-anchor="end">${fmtInt(cur.results)}</text>
        <text class="c-lab-b" x="${f1(mid(bPrev))}" y="${f1(prevTop - 18)}" text-anchor="middle">${fmtInt(prev.results)}</text>
        ${jan.map((b, i) => `<text class="c-lab" x="${f1(i === 0 ? b.x : mid(b))}" y="${CH + 46}" text-anchor="${i === 0 ? 'start' : 'middle'}">${h(short(b.datum.month))}</text>`).join('')}
        <text class="c-lab-b" x="${f1(mid(bPrev))}" y="${CH + 48}" text-anchor="middle">${h(monthLabel(prev.month))}</text>
        <text class="c-lab-b" x="${f1(bCur.x + bCur.width)}" y="${CH + 48}" text-anchor="end">${h(monthLabel(cur.month))}</text>
      </svg>` }).html,
    x => slide(x, 'data', { kicker: kick, src: c.source, title: allUp ? `Every number is up on ${long(prev.month)}` : `${m.label} against a year earlier`, body: `
      <div class="h-board" style="top:360px">
        <div class="h-bh"><span style="flex:1"></span><span style="width:196px; text-align:right">${h(short(prev.month))}</span><span style="width:250px; text-align:right">${h(short(cur.month))}</span><span style="width:170px; text-align:right">Change</span></div>
        ${rowsT.map(([l, a, b]) => `<div class="h-br" style="height:120px">
          <span class="nm" style="font-size:36px">${h(l)}</span>
          <span style="width:196px; text-align:right; font-size:36px; color:var(--g-soft)">${fmtInt(a)}</span>
          <span class="h-big" style="width:250px; text-align:right; font-size:42px">${fmtInt(b)}</span>
          <span class="h-big" style="width:170px; text-align:right; font-size:42px">${fmtSignedPct(((b - a) / a) * 100, 0)}</span></div>`).join('')}
      </div>
      <div class="h-abs" style="top:1010px">${ask(m.question, 0)}</div>` }).html,
  ]);
}

const family: Family = {
  id: 'data',
  name: 'Data posts (DL1 content)',
  posts: (c, v) => [wall(c, v), record(c, v), countries(c, v), share(c, v), xp(c, v), weekly(c, v), event(c, v), feature(c, v), month(c, v)],
};
export default family;

// Re-exported for other families that want the same small helpers.
export { arc, polar, minAngle, TOP, pct1, toMin, post, pieceRing, heroFitUnit, LOCAL_CSS, ask, askH, kvRows, splitBar };
export const heroFitFor = heroFit;
export const FEED_ROWS = FEED;
