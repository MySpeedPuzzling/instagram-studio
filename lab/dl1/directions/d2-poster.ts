// D2 · Poster Numbers (Wrapped 2025 restraint × Chartr boldness).
// Every slide is a two-piece poster: the top piece carries one hero number, the bottom piece the caption.
// The pieces meet along one real jigsaw cut line (four segments from the generator, identical on every
// slide), which is the direction's device. Grounds rotate navy / white / coral; coral only ever sits behind navy
// numerals. Hero times get optically centred colons; units are set small against the cap height.
import { fmtDuration, fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import { LOGO_URL, barGeometry, flagUrl } from '../../../src/design/svg.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Direction, Post, Slide } from '../types.ts';

const W = 1080, H = 1350, X0 = 88, CW = 904;
const SEAM = 632;            // y of the cut between the two pieces (same on every slide)
const SEAM_SEED = 21;        // one generated cut line, four segments, knobs alternating
const CAP_TOP = 748;         // caption block starts below the knobs
const HERO_BASE = SEAM - 112; // hero numeral baseline, clear of the upward knobs

const NAVY = '#2b3445', WHITE = '#ffffff', CORAL = '#ec726f';
type Ground = 'navy' | 'white' | 'coral';
const fill: Record<Ground, string> = { navy: 'var(--ink)', white: 'var(--paper)', coral: 'var(--coral-500)' };
const hex: Record<Ground, string> = { navy: NAVY, white: WHITE, coral: CORAL };

// ---------------------------------------------------------------- the cut
const f1 = (v: number) => v.toFixed(1);
/**
 * The top piece: the frame from y=0 down to one real jigsaw cut line. The cut is the seam between the two
 * rows of a 4×2 jigsaw (square 270 px pieces), so its knobs have the generator's true proportions.
 */
function topPiecePath(seam = SEAM): string {
  const pw = W / 4;
  const jig = generateJigsaw({ cols: 4, rows: 2, width: W, height: 2 * pw, y: seam - pw, seed: SEAM_SEED, tabSize: 0.2, jitter: 0.04 });
  // Each top-row piece's outline is start + 9 points per edge (top, right, bottom, left); the bottom edge is
  // indices 18..27 and runs right→left, so walking the pieces from the right traces the seam leftwards.
  let d = `M -4 -4 H ${W + 4} V ${seam} H ${W}`;
  for (const p of jig.pieces.filter(q => q.row === 0).sort((a, b) => b.col - a.col)) {
    const e = p.outline.slice(18, 28);
    for (let i = 1; i + 2 < e.length; i += 3) d += ` C ${f1(e[i][0])} ${f1(e[i][1])} ${f1(e[i + 1][0])} ${f1(e[i + 1][1])} ${f1(e[i + 2][0])} ${f1(e[i + 2][1])}`;
  }
  return `${d} H -4 Z`;
}

// ---------------------------------------------------------------- type helpers
/** Hero number markup: colons lifted to the figure centre, a true minus, a small raised % or unit. */
function heroText(v: string, unit?: string): string {
  const s = h(v).replace(/^-/, '−').replace(/:/g, '<span class="c">:</span>').replace(/%$/, '<span class="pct">%</span>');
  return s + (unit ? `<span class="u">${h(unit)}</span>` : '');
}
/** Set width in em of a hero string: Rubik 700 advances measured in Chromium (tabular figures 0.6625 em), tracking −0.035 em. */
function heroEm(v: string, unit?: string): number {
  const adv: Record<string, number> = { ':': 0.2916, '.': 0.284, ',': 0.278, '%': 0.6 * 0.807 + 0.03, '−': 0.645, '-': 0.645, '+': 0.607 };
  const em = [...v].reduce((s, ch) => s + (adv[ch] ?? 0.6625) - 0.035, 0);
  return em + (unit ? 0.19 * (0.3 + unit.length * 0.62) : 0);
}
/** Left side bearing (em) of the first glyph, Rubik 700, measured from rendered ink. Used to align hero ink to x = 88. */
const LSB: Record<string, number> = { '0': 0.042, '1': 0.06, '2': 0.048, '3': 0.034, '4': 0.019, '5': 0.041, '6': 0.039, '7': 0.072, '8': 0.038, '9': 0.04, '−': 0.061 };
const fit = (v: string, max: number, unit?: string) => Math.min(max, Math.floor((CW - 8) / heroEm(v, unit)));
const pct1 = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}%`;

const css = `
.frame { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--paper); }
.ground { position: absolute; left: 0; top: 0; }
.hero { position: absolute; left: ${X0}px; margin: 0; font-weight: 700; line-height: 1; letter-spacing: -0.035em; white-space: nowrap; }
.hero .c { display: inline-block; transform: translateY(-0.1em); }
.hero .pct { font-size: 0.6em; letter-spacing: 0; margin-left: 0.03em; vertical-align: 0.5em; }
.hero .u { font-size: 0.19em; font-weight: 700; letter-spacing: 0.01em; margin-left: 0.3em; vertical-align: 2.62em; }
.on-navy { color: var(--paper); }
.on-white, .on-coral { color: var(--ink); }
.coral-num { color: var(--coral-500); }
.cap { position: absolute; left: ${X0}px; width: ${CW}px; top: ${CAP_TOP}px; }
.kick { font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
.hl { font-size: 58px; font-weight: 700; line-height: 1.08; letter-spacing: -0.012em; text-wrap: balance; }
.kick + .hl { margin-top: 20px; }
.dek { font-size: 38px; line-height: 1.3; margin-top: 22px; text-wrap: pretty; }
.dark .kick, .dark .dek, .dark .src, .dark .idx { color: var(--context); }
.light .kick, .light .dek { color: var(--ink-soft); }
.light .src, .light .idx { color: var(--ink-muted); }
.dark .hl { color: var(--paper); }
.light .hl { color: var(--ink); }
.ask { font-size: 52px; font-weight: 700; line-height: 1.12; color: var(--indigo-500); margin-top: 44px; }
.foot { position: absolute; left: ${X0}px; width: ${CW}px; top: 1214px; height: 72px; display: flex; align-items: center; gap: 24px; }
.src { font-size: 30px; }
.idx { margin-left: auto; font-size: 30px; font-weight: 600; letter-spacing: 0.06em; }
.chip { width: 72px; height: 72px; border-radius: 50%; background: var(--paper); display: grid; place-items: center; flex: none; }
.chip img { width: 58px; height: auto; display: block; }
.lab { font-family: Rubik; font-size: 30px; font-variant-numeric: tabular-nums; }
.lab-b { font-family: Rubik; font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
.stats { display: flex; margin-top: 46px; }
.stat { flex: 1; border-left: 2px solid #5a647a; padding-left: 26px; }
.stat:first-child { border-left: 0; padding-left: 0; }
.stat .k { font-size: 30px; color: var(--context); }
.stat .v { font-size: 60px; font-weight: 700; letter-spacing: -0.01em; margin-top: 4px; color: var(--paper); }
.stat .v.hot { color: var(--coral-500); }
.light .stat { border-left-color: var(--line); }
.light .stat .k { color: var(--ink-soft); }
.light .stat .v { color: var(--ink); }
.rows { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; grid-template-rows: repeat(5, 45px); column-gap: 60px; margin-top: 22px; }
.rk { display: flex; align-items: center; font-size: 30px; border-top: 2px solid #46506a; }
.rk .n { width: 52px; font-weight: 600; color: var(--context); }
.rk img { width: 32px; height: 32px; margin-right: 14px; }
.rk .nm { flex: 1; color: var(--paper); }
.rk .t { font-weight: 600; color: var(--paper); }
.rk.first .nm, .rk.first .n, .rk.first .t { font-weight: 700; }
.legend { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 40px; margin-top: 28px; font-size: 34px; color: var(--ink-soft); }
.legend b { color: var(--ink); font-weight: 700; }
.sw { display: inline-block; width: 26px; height: 26px; border-radius: 5px; vertical-align: -3px; margin-right: 12px; }
.medal { position: absolute; left: 0; width: ${W}px; text-align: center; color: var(--ink); }
.medal .lv { font-size: 40px; font-weight: 700; letter-spacing: 0.24em; margin-left: 0.24em; }
.medal .no { font-weight: 700; line-height: 1; letter-spacing: -0.035em; }
.ep { position: absolute; left: ${X0}px; font-size: 40px; font-weight: 700; letter-spacing: 0.24em; color: var(--paper); }
.pz { margin-top: 24px; }
.pz .r { display: flex; align-items: center; height: 54px; font-size: 30px; border-top: 2px solid #46506a; }
.pz .r .n { width: 52px; flex: none; font-weight: 600; color: var(--context); }
.pz .r img { width: 32px; height: 32px; margin-right: 14px; }
.pz .r .nm { font-weight: 600; color: var(--paper); white-space: nowrap; }
.pz .r .br { flex: 1; margin-left: 16px; color: var(--context); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pz .r .v { font-weight: 700; color: var(--paper); margin-left: 16px; }
.light .pz .r { border-top-color: var(--line); }
.light .pz .r .n, .light .pz .r .br { color: var(--ink-soft); }
.light .pz .r .nm, .light .pz .r .v { color: var(--ink); }
.ig { color: var(--indigo-500); font-weight: 500; }
.hl .ig { font-size: 0.62em; margin-left: 0.4em; }
`;

// ---------------------------------------------------------------- frame
interface PosterOpts {
  top: Ground; bottom: Ground;
  hero?: { text: string; unit?: string; max?: number; coral?: boolean; flag?: string };
  topSvg?: string;      // svg drawn inside the top piece (clipped to it), behind the hero
  topHtml?: string;     // extra html over the top piece
  caption: string;      // html of the caption block
  src: string; idx?: string;
}

function poster(o: PosterOpts): string {
  const dark = o.bottom === 'navy';
  const tp = topPiecePath();
  let hero = '';
  if (o.hero) {
    const size = fit(o.hero.text, o.hero.max ?? 330, o.hero.unit);
    const top = HERO_BASE - 0.8425 * size; // Rubik: the baseline sits 0.8425 em below the top of a line-height-1 box
    const cls = o.hero.coral ? 'coral-num' : 'on-' + o.top;
    const first = o.hero.text.replace(/^-/, '−')[0];
    const left = X0 - (LSB[first] ?? 0.04) * size; // the box starts left of the margin by the side bearing; the ink starts on it
    hero = `<p class="hero ${cls}" data-qa-bg="${hex[o.top]}" data-qa-bleed style="left:${left.toFixed(1)}px; top:${top.toFixed(1)}px; font-size:${size}px">${heroText(o.hero.text, o.hero.unit)}</p>`;
    if (o.hero.flag) {
      const fs = Math.round(size * 0.46);
      hero += `<img src="${o.hero.flag}" alt="" style="position:absolute; width:${fs}px; height:${fs}px; left:${(left + heroEm(o.hero.text) * size + 0.12 * size).toFixed(1)}px; top:${(HERO_BASE - 0.35 * size - fs / 2).toFixed(1)}px">`;
    }
  }
  return `<div class="frame">
  <svg class="ground" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="tp"><path d="${tp}"/></clipPath></defs>
    <rect width="${W}" height="${H}" fill="${fill[o.bottom]}"/>
    <path d="${tp}" fill="${fill[o.top]}"/>
    ${o.topSvg ? `<g clip-path="url(#tp)">${o.topSvg}</g>` : ''}
  </svg>
  ${hero}${o.topHtml ?? ''}
  <div class="cap ${dark ? 'dark' : 'light'}" data-qa-bg="${hex[o.bottom]}">${o.caption}</div>
  <footer class="foot ${dark ? 'dark' : 'light'}" data-qa-bg="${hex[o.bottom]}">
    <span class="src">${h(o.src)}</span><span class="idx">${h(o.idx ?? '')}</span>
    <span class="chip"><img src="${LOGO_URL}" alt=""></span>
  </footer>
</div>`;
}

// ---------------------------------------------------------------- posts
function wall(c: Content): Post {
  const w = c.wall;
  const wallMin = Number(w.title.match(/\d+/)![0]); // "The 59-minute wall" → 59
  const hour = wallMin + 1;
  const at = (m: number) => w.histogram.find(d => d.minute === m)!.results;
  const step = (m: number) => ((at(m) - at(m - 1)) / at(m - 1)) * 100;

  // Histogram for the reveal: the full range, the last five minutes before the hour in coral.
  const CH = 150;
  const g = barGeometry(w.histogram, { x: d => d.minute, y: d => d.results, width: CW, height: CH, padding: 0.24 });
  const hot = (m: number) => m > wallMin - 5 && m <= wallMin;
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${hot(b.datum.minute) ? 'var(--coral-500)' : 'var(--context)'}"/>`).join('');
  const line = g.xScale(String(hour))! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
  const mid = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
  const first = w.histogram[0].minute, last = w.histogram[w.histogram.length - 1].minute;

  const slides: Slide[] = [
    { id: 'wall-1', body: poster({
      top: 'navy', bottom: 'white', hero: { text: String(wallMin), unit: 'min', max: 360, coral: true },
      caption: `<p class="kick">${h(w.kicker)}</p><h1 class="hl" style="font-size:94px; letter-spacing:-0.022em">${h(w.title)}</h1><p class="dek">${h(w.dek)}</p>`,
      src: c.source, idx: '1/4',
    }) },
    { id: 'wall-2', body: poster({
      top: 'coral', bottom: 'white', hero: { text: `${Math.abs(w.dropPct)}%` },
      caption: `<h2 class="hl">fewer finishes in minute&nbsp;${hour} than in minute&nbsp;${wallMin}</h2>
        <p class="dek">${fmtInt(w.at59)} in minute&nbsp;${wallMin}, ${fmtInt(w.at60)} in minute&nbsp;${hour}</p>
        <svg width="${CW}" height="${CH + 46}" style="margin-top:34px">
          ${bars}
          <line x1="${f1(line)}" x2="${f1(line)}" y1="-10" y2="${CH}" stroke="var(--ink)" stroke-width="4"/>
          <text class="lab" x="${f1(mid(first))}" y="${CH + 40}" text-anchor="middle" fill="var(--ink-soft)">${first}</text>
          <text class="lab-b" x="${f1(line)}" y="${CH + 40}" text-anchor="middle" fill="var(--ink)">${hour} min</text>
          <text class="lab" x="${CW}" y="${CH + 40}" text-anchor="end" fill="var(--ink-soft)">${last}</text>
        </svg>`,
      src: c.source, idx: '2/4',
    }) },
    { id: 'wall-3', body: poster({
      top: 'white', bottom: 'navy', hero: { text: fmtDuration(hour) },
      caption: `<h2 class="hl">${h(w.context)}</h2>
        <div class="stats">${[...w.noStepAt, hour].map(m => `<div class="stat"><p class="k">Step into minute ${m}</p><p class="v ${m === hour ? 'hot' : ''}">${pct1(step(m))}</p></div>`).join('')}</div>`,
      src: c.source, idx: '3/4',
    }) },
    { id: 'wall-4', body: poster({
      top: 'coral', bottom: 'white', hero: { text: `${w.subHour.pct}%`, max: 360 },
      caption: `<h2 class="hl">of 500-piece puzzlers have a personal best under one hour</h2>
        <p class="dek">${fmtInt(w.subHour.under60)} of ${fmtInt(w.subHour.puzzlers)} puzzlers with a solo 500 time</p>
        <p class="ask">${h(w.question)}</p>`,
      src: c.source, idx: '4/4',
    }) },
  ];
  return { key: 'wall', slides };
}

function record(c: Content): Post {
  const r = c.record;
  return { key: 'record', slides: [{ id: 'record-1', body: poster({
    top: 'navy', bottom: 'white', hero: { text: r.value, max: 340 },
    caption: `<p class="kick">${h(r.kicker)} · ${fmtInt(r.firstTries)} first tries</p><h1 class="hl">${h(r.title)}</h1><p class="dek">${h(r.context)}</p>`,
    src: c.source,
  }) }] };
}

function countries(c: Content): Post {
  const k = c.countries;
  const lead = k.top[0];
  const cell = (d: typeof lead, i: number) => `<div class="rk ${i === 0 ? 'first' : ''}"><span class="n">${i + 1}</span><img src="${flagUrl(d.code)}" alt=""><span class="nm">${h(d.name)}</span><span class="t">${fmtDuration(d.medianPb)}</span></div>`;
  return { key: 'countries', slides: [{ id: 'countries-1', body: poster({
    top: 'white', bottom: 'navy', hero: { text: fmtDuration(lead.medianPb), max: 262, flag: flagUrl(lead.code) },
    caption: `<h1 class="hl" style="font-size:52px">${h(k.title)}</h1>
      <p class="dek" style="font-size:30px; margin-top:12px">${h(k.dek)}</p>
      <div class="rows">${k.top.map(cell).join('')}</div>`,
    src: c.source,
  }) }] };
}

function share(c: Content): Post {
  const s = c.share;
  const lead = s.parts[0];
  const colour: Record<string, string> = { '500': 'var(--coral-500)', 'under 500': 'var(--ink)', '1000': 'var(--ink-muted)', other: 'var(--context)' };
  let x = 0;
  const segs = s.parts.map(p => {
    const w = (p.pct / 100) * CW;
    const seg = `<rect x="${f1(x)}" y="0" width="${f1(Math.max(w - 4, 3))}" height="48" fill="${colour[p.key]}"/>`;
    x += w;
    return seg;
  }).join('');
  return { key: 'share', slides: [{ id: 'share-1', body: poster({
    top: 'navy', bottom: 'white', hero: { text: `${lead.pct}%`, max: 340, coral: true },
    caption: `<h1 class="hl">${h(s.title)}</h1>
      <svg width="${CW}" height="48" style="margin-top:44px">${segs}</svg>
      <div class="legend">${s.parts.map(p => `<span><i class="sw" style="background:${colour[p.key]}"></i><b>${p.pct}%</b> ${h(s.labels[p.key])}</span>`).join('')}</div>`,
    src: `Share of ${fmtInt(c.totals.results)} results · ${c.asOf}`,
  }) }] };
}

function xp(c: Content): Post {
  const x = c.xp;
  // The medallion is a piece: the centre of a 3×3 jigsaw (a seed whose centre piece has four tabs), white,
  // with its eight coral neighbours pulled apart around it and cropped by the frame and the seam.
  const cell = 350, gap = 18;
  const cx = W / 2, cy = SEAM / 2 - 2;
  const ox = cx - 1.5 * cell, oy = cy - 1.5 * cell;
  const jig = generateJigsaw({ cols: 3, rows: 3, width: 3 * cell, height: 3 * cell, x: ox, y: oy, seed: 13, tabSize: 0.22 });
  const pieces = jig.pieces.map(p => {
    const centre = p.col === 1 && p.row === 1;
    return `<path d="${p.d}" transform="translate(${(p.col - 1) * gap} ${(p.row - 1) * gap})" fill="${centre ? 'var(--paper)' : 'var(--coral-500)'}"/>`;
  }).join('');
  const size = 230;
  const players = (min: number) => x.distribution.filter(d => d.level >= min).reduce((s, d) => s + d.players, 0);
  const stats: Array<[string, string]> = [
    [`Level ${x.level}`, fmtInt(players(x.level))],
    [`Level ${x.level - 10}+`, fmtInt(players(x.level - 10))],
    ['With XP', fmtInt(players(0))],
  ];
  const numBase = cy + 116;
  return { key: 'xp', slides: [{ id: 'xp-1', body: poster({
    top: 'navy', bottom: 'white', topSvg: pieces,
    topHtml: `<div class="medal" data-qa-bg="${WHITE}">
      <p class="lv" style="position:absolute; left:0; width:${W}px; top:${cy - 132}px">LEVEL</p>
      <p class="no" style="position:absolute; left:0; width:${W}px; top:${(numBase - 0.8425 * size).toFixed(1)}px; font-size:${size}px">${x.level}</p>
    </div>`,
    caption: `<p class="kick">${h(x.kicker)}</p><h1 class="hl">${h(x.title)}</h1><p class="dek">${h(x.dek)}.</p>
      <div class="stats">${stats.map(([k, v], i) => `<div class="stat"><p class="k">${k}</p><p class="v">${v}</p></div>`).join('')}</div>`,
    src: c.source,
  }) }] };
}

// ---------------------------------------------------------------- recurring and news posts
type Fast = Content['weekly']['fastest500'][number];
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
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}`; // "28 Sep"
const monthLabel = (ym: string, month: 'short' | 'long' = 'short') => new Date(ym + '-01T12:00:00Z').toLocaleDateString('en-US', { month, timeZone: 'UTC' });
/** Hero size as poster() will set it, for placing labels around the hero. */
const heroSize = (v: string, max = 330, unit?: string) => fit(v, max, unit);
/** Largest hero size that still leaves room for the flag poster() sets after it (gap 0.12 em + flag 0.46 em). */
const withFlag = (v: string, max: number) => Math.min(max, Math.floor((CW - 8) / (heroEm(v) + 0.62)));

function weekly(c: Content): Post {
  const w = c.weekly;
  const n = 5;
  const ep = String(w.episode);
  const epSize = heroSize(ep, 470);
  const g500 = byPlayer(w.fastest500), g1000 = byPlayer(w.fastest1000);
  const tp = w.topPuzzles;
  const detail = (g: FastGroup) => `${h(g.puzzle)} · ${h(g.brand)}${g.firstAttempt ? ' · first attempt' : ''}`;
  const also = (g: FastGroup) => (g.also.length ? `Also ${andList(g.also)}${g.samePuzzle ? ' on the same puzzle' : ''}.` : '');
  const who = (g: FastGroup) => `${h(g.player)}${g.handle ? `<span class="ig">@${h(g.handle)}</span>` : ''}`;
  const rows = (gs: FastGroup[], from: number) => gs.length ? `<div class="pz">${gs.map((g, i) => `<div class="r"><span class="n">${from + i}</span>${g.country ? `<img src="${flagUrl(g.country)}" alt="">` : ''}<span class="nm">${h(g.player)}</span><span class="br">${g.handle ? `<span class="ig">@${h(g.handle)}</span>` : ''}</span><span class="v">${g.time}</span></div>`).join('')}</div>` : '';
  const fastest = (g: FastGroup | undefined, rest: FastGroup[], label: string, top: Ground, idx: string): Slide[] => g ? [{ id: '', body: poster({
    top, bottom: 'white', hero: g.country ? { text: g.time, max: withFlag(g.time, 330), flag: flagUrl(g.country) } : { text: g.time, max: 330 },
    caption: `<p class="kick">${label}</p><h2 class="hl">${who(g)}</h2>
      <p class="dek">${detail(g)}${g.also.length ? `<br>${also(g)}` : ''}</p>${rows(rest, 2)}`,
    src: c.source, idx,
  }) }] : [];

  const slides: Slide[] = [
    { id: 'weekly-1', body: poster({
      top: 'navy', bottom: 'white', hero: { text: ep, max: 470, coral: true },
      topHtml: `<p class="ep" data-qa-bg="${NAVY}" style="top:${(HERO_BASE - 0.7 * epSize - 96).toFixed(1)}px">EPISODE</p>`,
      caption: `<p class="kick">Season ${w.season} · ${h(w.range)}</p><h1 class="hl" style="font-size:88px; letter-spacing:-0.022em">${h(w.series)}</h1>
        <div class="stats">${([['Results', fmtInt(w.results)], ['On the week before', fmtSignedPct(w.resultsChangePct)], ['Puzzlers', fmtInt(w.puzzlers)]] as const).map(([k, v]) => `<div class="stat"><p class="k">${k}</p><p class="v">${v}</p></div>`).join('')}</div>`,
      src: c.source, idx: `1/${n}`,
    }) },
    { id: 'weekly-2', body: poster({
      top: 'white', bottom: 'navy', hero: { text: fmtInt(tp[0].solvers), unit: 'solvers' },
      caption: `<h2 class="hl">${h(tp[0].puzzle)} was the most-solved puzzle of the week</h2>
        <div class="pz">${tp.map((p, i) => `<div class="r"><span class="n">${i + 1}</span><span class="nm">${h(p.puzzle)}</span><span class="br">${h(p.brand)}</span><span class="v">${fmtInt(p.solvers)}</span></div>`).join('')}</div>`,
      src: c.source, idx: `2/${n}`,
    }) },
    ...fastest(g500[0], g500.slice(1), 'Fastest solo 500 of the week', 'coral', `3/${n}`),
    ...fastest(g1000[0], g1000.slice(1), 'Fastest solo 1,000 of the week', 'navy', `4/${n}`),
    { id: 'weekly-5', body: poster({
      top: 'coral', bottom: 'white', hero: { text: fmtInt(w.personalBests), max: 360 },
      caption: `<h2 class="hl">personal bests were set last week</h2>
        <p class="dek">And ${fmtInt(w.newPuzzlers)} new puzzlers logged their first time on MySpeedPuzzling.</p>
        <p class="ask">${h(w.question)}</p>`,
      src: c.source, idx: `${n}/${n}`,
    }) },
  ];
  slides.forEach((s, i) => { s.id = `weekly-${i + 1}`; });
  return { key: 'weekly', slides };
}

function event(c: Content): Post {
  const e = c.event;
  const slides: Slide[] = [
    { id: 'event-1', body: poster({
      top: 'navy', bottom: 'white', hero: { text: fmtInt(e.registered), max: 360, coral: true },
      caption: `<p class="kick">Event preview · ${h(e.date)}</p><h1 class="hl">puzzlers are registered for the ${h(e.name)}</h1>
        <p class="dek">${h(e.location)}. ${fmtInt(e.onMsp)} of them already log their times on MySpeedPuzzling.</p>`,
      src: c.source, idx: e.usMedianPb ? '1/2' : '',
    }) },
  ];
  if (e.usMedianPb) slides.push({ id: 'event-2', body: poster({
    top: 'coral', bottom: 'white', hero: { text: e.usMedianPb, max: withFlag(e.usMedianPb, 300), flag: flagUrl('us') },
    caption: `<h2 class="hl">is the median personal best of US puzzlers on a solo 500</h2>
      <p class="dek">${e.usPuzzlers ? `Across ${fmtInt(e.usPuzzlers)} US puzzlers on MySpeedPuzzling.` : ''}</p>
      <p class="ask">${h(e.question)}</p>`,
    src: c.source, idx: '2/2',
  }) });
  return { key: 'event', slides };
}

function feature(c: Content): Post {
  const f = c.feature;
  // Complete days only: the as-of day is still running.
  const days = f.days.filter(d => !c.asOf.startsWith(dayLabel(d.day) + ' '));
  const isLaunch = (d: { day: string }) => f.launchDate.startsWith(dayLabel(d.day) + ' ');
  const CH = 150;
  const g = barGeometry(days, { x: d => d.day, y: d => d.results, width: CW, height: CH, padding: 0.24 });
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${isLaunch(b.datum) ? 'var(--coral-500)' : 'var(--context)'}"/>`).join('');
  const launch = g.bars.find(b => isLaunch(b.datum))!;
  const ty = g.yScale(f.typicalDay);
  return { key: 'feature', slides: [
    { id: 'feature-1', body: poster({
      top: 'navy', bottom: 'white', hero: { text: fmtInt(f.results), max: 340, coral: true },
      caption: `<p class="kick">${h(f.kicker)}</p><h1 class="hl">results on launch day: our busiest day ever</h1>
        <svg width="${CW}" height="${CH + 46}" style="margin-top:34px">
          ${bars}
          <line x1="0" x2="${CW}" y1="${f1(ty)}" y2="${f1(ty)}" stroke="var(--ink)" stroke-width="3"/>
          <text class="lab" x="0" y="${f1(ty - 12)}" fill="var(--ink-soft)">Typical day ${fmtInt(f.typicalDay)}</text>
          <text class="lab-b" x="${f1(launch.x - 14)}" y="${f1(launch.y + 28)}" text-anchor="end" fill="var(--ink)">${f.multiple}×</text>
          <text class="lab" x="0" y="${CH + 40}" fill="var(--ink-soft)">${h(dayLabel(days[0].day))}</text>
          <text class="lab-b" x="${f1(launch.x + launch.width)}" y="${CH + 40}" text-anchor="end" fill="var(--ink)">${h(dayLabel(launch.datum.day))}</text>
        </svg>`,
      src: c.source, idx: '1/2',
    }) },
    { id: 'feature-2', body: poster({
      top: 'coral', bottom: 'white', hero: { text: `${f.backfilledPct}%`, max: 360 },
      caption: `<h2 class="hl">of launch-day results were puzzles solved before that day</h2>
        <p class="dek">${fmtInt(f.backfilled)} of ${fmtInt(f.results)}. ${h(f.dek)}</p>
        <p class="ask">${h(f.question)}</p>`,
      src: c.source, idx: '2/2',
    }) },
  ] };
}

function month(c: Content): Post {
  const m = c.month;
  const cur = m.series.at(-1)!;
  const prevKey = `${Number(cur.month.slice(0, 4)) - 1}${cur.month.slice(4)}`;
  const prev = m.series.find(x => x.month === prevKey)!;
  const long = (ym: string) => `${monthLabel(ym, 'long')} ${ym.slice(0, 4)}`;
  const short = (ym: string) => `${monthLabel(ym)} ${ym.slice(0, 4)}`;
  const CH = 170;
  const g = barGeometry(m.series, { x: d => d.month, y: d => d.results, width: CW, height: CH, padding: 0.2 });
  const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${b.datum === cur ? 'var(--coral-500)' : b.datum === prev ? 'var(--context)' : 'var(--ink-muted)'}"/>`).join('');
  const bCur = g.bars.at(-1)!, bPrev = g.bars.find(b => b.datum === prev)!;
  const mid = (b: { x: number; width: number }) => b.x + b.width / 2;
  return { key: 'month', slides: [
    { id: 'month-1', body: poster({
      top: 'navy', bottom: 'white', hero: { text: fmtInt(m.results), max: 340, coral: true },
      caption: `<p class="kick">Monthly report · ${h(m.label)}</p><h1 class="hl" style="font-size:80px; letter-spacing:-0.02em">${h(m.title)}</h1>
        <p class="dek">results logged, ${fmtSignedPct(m.vsLastYearPct, 0)} on ${h(long(prev.month))}</p>`,
      src: c.source, idx: '1/3',
    }) },
    { id: 'month-2', body: poster({
      top: 'white', bottom: 'navy', hero: { text: fmtSignedPct(m.vsLastYearPct, 0), max: 340 },
      caption: `<h2 class="hl">more results than in ${h(long(prev.month))}</h2>
        <svg width="${CW}" height="${CH + 46}" style="margin-top:40px">
          ${bars}
          <text class="lab" x="0" y="${CH + 40}" fill="var(--context)">${h(short(m.series[0].month))}</text>
          <text class="lab-b" x="${f1(mid(bPrev))}" y="${CH + 40}" text-anchor="middle" fill="var(--paper)">${h(short(prev.month))}</text>
          <text class="lab-b" x="${f1(bCur.x + bCur.width)}" y="${CH + 40}" text-anchor="end" fill="var(--paper)">${h(short(cur.month))}</text>
        </svg>`,
      src: c.source, idx: '2/3',
    }) },
    { id: 'month-3', body: poster({
      top: 'coral', bottom: 'white', hero: { text: fmtInt(m.active), max: 340 },
      caption: `<h2 class="hl">puzzlers logged a result in ${h(monthLabel(cur.month, 'long'))}</h2>
        <div class="stats" style="margin-top:34px">${([['New puzzlers', fmtInt(m.newPlayers)], ['Pieces', fmtInt(m.pieces)]] as const).map(([k, v]) => `<div class="stat"><p class="k">${k}</p><p class="v">${v}</p></div>`).join('')}</div>
        <p class="ask">${h(m.question)}</p>`,
      src: c.source, idx: '3/3',
    }) },
  ] };
}

const direction: Direction = {
  id: 'D2',
  name: 'Poster Numbers',
  idea: 'Two-piece posters: one hero number on the top piece, the caption on the bottom, joined by one real jigsaw cut line that sits at the same height on every slide. Navy, white and coral grounds rotate; coral only behind navy numerals.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c), weekly(c), event(c), feature(c), month(c)],
};
export default direction;
