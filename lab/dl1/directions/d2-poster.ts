// D2 · Poster Numbers (Wrapped 2025 restraint × Chartr boldness).
// Every slide is a two-piece poster: the top piece carries one hero number, the bottom piece the caption.
// The pieces meet along one real jigsaw cut line (four segments from the generator, identical on every
// slide), which is the direction's device. Grounds rotate navy / white / coral; coral only ever sits behind navy
// numerals. Hero times get optically centred colons; units are set small against the cap height.
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
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
  const adv: Record<string, number> = { ':': 0.2916, '.': 0.284, '%': 0.6 * 0.807 + 0.03, '−': 0.645, '-': 0.645, '+': 0.607 };
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

const direction: Direction = {
  id: 'D2',
  name: 'Poster Numbers',
  idea: 'Two-piece posters: one hero number on the top piece, the caption on the bottom, joined by one real jigsaw cut line that sits at the same height on every slide. Navy, white and coral grounds rotate; coral only behind navy numerals.',
  css,
  posts: c => [wall(c), record(c), countries(c), share(c), xp(c)],
};
export default direction;
