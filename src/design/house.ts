// The MSP house system (design lab DL4, brief: docs/design/house-brief.md). One module every post type uses, so the
// profile grid reads as one brand while content varies:
//   - grounds: the brand palette as full-bleed grounds, each with text, accent and chart tokens that pass WCAG AA
//     (QA re-checks every slide); never cream, beige, pastel or yellow; white only with depth;
//   - type scale (Rubik, tabular lining figures with slashed zeros everywhere);
//   - the quiet header (one fixed brand device + kicker + carousel index) and footer (source + outlined logo);
//   - the outlined logo (assets/brand/speedpuzzling-logo-outline.svg, built by src/design/build-logo.ts), ≈ 1.5× DL1;
//   - chart theme per ground; big-number helpers (optically centred colons, ink-aligned left edge);
//   - three house variants (H1–H3) that differ only in how they choose grounds, the device and the cover layout.
//
// Components read CSS custom properties set by the frame (--g-*), so one layout renders on any ground.
// Text over the depth layer is checked against the ground's flat colour: the depth gradient is a sibling layer,
// never an ancestor of text.
import { escapeHtml as h } from './page.ts';
import { singlePiece } from './svg.ts';
import { FRAMES, type FrameKind } from '../render/render.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';

// ------------------------------------------------------------------ geometry

export const W = 1080;
export const FEED_H = 1350;
export const STORY_H = 1920;
/** Content column (feed and story): x 88–992. */
export const X0 = 88, X1 = 992, CW = X1 - X0;
/** Feed layout rows. Header 64–136, rule 148, content 176–1180, rule 1196, footer 1206–1290. */
export const FEED = { headTop: 64, ruleTop: 148, contentTop: 176, contentBottom: 1180, footRule: 1196, footTop: 1210 } as const;
/** Story layout rows, inside the Story safe area (y 270–1540). */
export const STORY = { headTop: 286, ruleTop: 370, contentTop: 400, contentBottom: 1420, footRule: 1436, footTop: 1452 } as const;
export const rowsFor = (kind: FrameKind) => (kind === 'feed' ? FEED : STORY);

export const f1 = (v: number) => v.toFixed(1);

// ------------------------------------------------------------------ grounds

export type GroundKey = 'navy' | 'navyDeep' | 'coral' | 'indigo' | 'sky' | 'ocean' | 'paper' | 'green';

export interface Ground {
  key: GroundKey;
  /** Flat ground colour (what QA checks text against). */
  bg: string;
  /** Depth layer drawn over the flat colour: a same-hue gradient (≤ 3 stops). */
  depth: string;
  dark: boolean;
  /** Text: ink (titles, numbers), soft (deks, labels), accent (kickers, small highlights), all ≥ 4.5:1. */
  ink: string; soft: string; accent: string;
  /** Hero highlight for large text only (≥ 48 px, or ≥ 37 px bold; ≥ 3:1). */
  hot: string;
  /** Small-text highlight (≥ 4.5:1). */
  hotText: string;
  /** Lines and chart tracks (no contrast duty). */
  rule: string; band: string;
  /** Chart marks: base bars, context bars, the highlighted mark, a cool second series. */
  chart: { base: string; context: string; hot: string; cool: string };
  /** The brand device's fill on this ground. */
  device: string;
}

// Contrast (WCAG) measured 2026-10-16: white on navy 12.5, on indigo 6.1, on ocean 7.5; #1d2433 on coral 5.3, on sky 7.0;
// indigo-300 on navy 5.4; sky-200 on indigo 4.8; coral-200 on ocean 5.3; indigo-800 on sky 6.5 and on coral 4.9.
const BASE_GROUNDS: Record<GroundKey, Ground> = {
  navy: {
    key: 'navy', bg: '#2b3445', depth: 'linear-gradient(170deg, #303a4d 0%, #2b3445 45%, #262e3d 100%)', dark: true,
    ink: '#ffffff', soft: '#dfe3ea', accent: '#97a5f9', hot: '#ec726f', hotText: '#ffb0ab',
    rule: '#4b566b', band: '#373f50', chart: { base: '#626c80', context: '#7d879c', hot: '#ec726f', cool: '#97a5f9' }, device: '#ec726f',
  },
  navyDeep: {
    key: 'navyDeep', bg: '#222a38', depth: 'linear-gradient(170deg, #273041 0%, #222a38 50%, #1d2431 100%)', dark: true,
    ink: '#ffffff', soft: '#dfe3ea', accent: '#97a5f9', hot: '#ec726f', hotText: '#ffb0ab',
    rule: '#3d475b', band: '#2e3747', chart: { base: '#5a6479', context: '#7d879c', hot: '#ec726f', cool: '#97a5f9' }, device: '#ec726f',
  },
  coral: {
    key: 'coral', bg: '#ec726f', depth: 'linear-gradient(170deg, #f07c78 0%, #ec726f 45%, #e4625f 100%)', dark: false,
    ink: '#1d2433', soft: '#1d2433', accent: '#211281', hot: '#1d2433', hotText: '#1d2433',
    rule: '#c95855', band: '#f19a97', chart: { base: '#f6b3b0', context: '#f9cbc9', hot: '#1d2433', cool: '#211281' }, device: '#1d2433',
  },
  indigo: {
    key: 'indigo', bg: '#4e54c8', depth: 'linear-gradient(170deg, #575dd0 0%, #4e54c8 45%, #474cbb 100%)', dark: true,
    ink: '#ffffff', soft: '#dde3ff', accent: '#c7e8ff', hot: '#ffb0ab', hotText: '#ffffff',
    rule: '#7177d8', band: '#5c62cf', chart: { base: '#8b91e3', context: '#a4a9ea', hot: '#ffb0ab', cool: '#c7e8ff' }, device: '#ffb0ab',
  },
  sky: {
    key: 'sky', bg: '#69b3fe', depth: 'linear-gradient(170deg, #76baff 0%, #69b3fe 45%, #5ea9f5 100%)', dark: false,
    ink: '#1d2433', soft: '#2b3445', accent: '#211281', hot: '#211281', hotText: '#211281',
    rule: '#4d97e2', band: '#8cc5ff', chart: { base: '#bfe0ff', context: '#d6ebff', hot: '#1d2433', cool: '#211281' }, device: '#1d2433',
  },
  ocean: {
    key: 'ocean', bg: '#055797', depth: 'linear-gradient(170deg, #0b60a2 0%, #055797 45%, #044d87 100%)', dark: true,
    ink: '#ffffff', soft: '#c7e8ff', accent: '#ffcdc9', hot: '#ffb0ab', hotText: '#ffcdc9',
    rule: '#2a74b9', band: '#0c63a6', chart: { base: '#3a83c7', context: '#5b9bd6', hot: '#ffb0ab', cool: '#a8d9ff' }, device: '#ffb0ab',
  },
  // The only light ground: white with depth (a cool top-lit gradient); content sits on shadowed cards.
  paper: {
    key: 'paper', bg: '#f3f6fa', depth: 'linear-gradient(170deg, #ffffff 0%, #f3f6fa 50%, #e6ebf3 100%)', dark: false,
    ink: '#2b3445', soft: '#4b566b', accent: '#4e54c8', hot: '#ca5453', hotText: '#aa383a',
    rule: '#d5dce6', band: '#e3e9ef', chart: { base: '#c3cad8', context: '#dfe3ea', hot: '#ec726f', cool: '#4e54c8' }, device: '#ec726f',
  },

  // Brand green (website accent, --brand-green). Tried for H4's funny-facts posters; rejected by the owner on 2026-10-17
  // ("no green for H4"). Kept only so the K1 record still renders; don't use it in new designs.
  green: {
    key: 'green', bg: '#42d697', depth: 'linear-gradient(170deg, #4fdc9f 0%, #42d697 45%, #37c98a 100%)', dark: false,
    ink: '#1d2433', soft: '#1d2433', accent: '#1d2433', hot: '#1d2433', hotText: '#1d2433',
    rule: '#2fb57c', band: '#6fe0b0', chart: { base: '#8de8c1', context: '#b4f0d6', hot: '#1d2433', cool: '#211281' }, device: '#1d2433',
  },
};

/** Per-variant token overrides (e.g. H4's two-colour text). Set by activateVariant() before a variant's slides are built. */
export type GroundOverrides = Partial<Record<GroundKey, Partial<Omit<Ground, 'chart'>> & { chart?: Partial<Ground['chart']> }>>;
let ACTIVE: Variant | undefined;
/** Makes `v` the variant whose token overrides and seam style apply to GROUNDS and posterTopPath() from now on. */
export function activateVariant(v: Variant | undefined) { ACTIVE = v; }
export const activeVariant = () => ACTIVE;

/** The grounds as the active variant sees them (base tokens + its overrides). */
export const GROUNDS: Record<GroundKey, Ground> = new Proxy(BASE_GROUNDS, {
  get(t, k: string) {
    const base = t[k as GroundKey];
    const o = ACTIVE?.tokens?.[k as GroundKey];
    return o && base ? { ...base, ...o, chart: { ...base.chart, ...(o.chart ?? {}) } } : base;
  },
});

/** CSS custom properties for a ground, set on the frame. */
export function groundVars(g: Ground): string {
  return [
    `--g-bg:${g.bg}`, `--g-depth:${g.depth}`, `--g-ink:${g.ink}`, `--g-soft:${g.soft}`, `--g-accent:${g.accent}`,
    `--g-hot:${g.hot}`, `--g-hot-text:${g.hotText}`, `--g-rule:${g.rule}`, `--g-band:${g.band}`,
    `--c-base:${g.chart.base}`, `--c-context:${g.chart.context}`, `--c-hot:${g.chart.hot}`, `--c-cool:${g.chart.cool}`, `--g-device:${g.device}`,
  ].join(';');
}

// ------------------------------------------------------------------ type

/** Type scale (px on the 1080 canvas). Nothing below 30 px except data-qa-small notes (≥ 24). */
export const TYPE = {
  hero: 300,       // single big number (fit to the column with heroFit)
  display: 84,     // cover titles
  title: 62,       // slide titles
  titleS: 52,      // long titles, Story questions
  lead: 44,        // the statement under a hero number
  dek: 38,         // standfirst
  body: 34,        // board rows, legends
  label: 30,       // kickers, axis labels, sources (the QA floor)
} as const;

// ------------------------------------------------------------------ brand marks

export const LOGO_OUTLINE_URL = '/assets/brand/speedpuzzling-logo-outline.svg';
/** Outlined logo, `px` tall including its outline (DL1 bug was 54 px wide; 112 px tall ≈ 1.8× the mark; owner 2026-10-16: branding more notable). */
export const outlinedLogo = (px = 112, base = '') => `<img class="h-logo" src="${base}${LOGO_OUTLINE_URL}" alt="MySpeedPuzzling" style="height:${px}px">`;

/** One interlocking generator piece (the brand device), `px` wide. */
export function pieceMark(fill = 'var(--g-device)', px = 44, seed = 5): string {
  const p = singlePiece(60, seed);
  return `<svg class="h-dev" width="${px}" height="${px}" viewBox="${p.viewBox}" aria-hidden="true"><path d="${p.d}" fill="${fill}"/></svg>`;
}

/**
 * Progress strip (H3's device, D9 lineage): the middle row of an n×3 jigsaw, so every piece has real knobs and
 * interlocks. Pieces before `current` are filled with ink, the current one with the device colour, later ones
 * outlined. A single post shows one filled piece (the same mark as H1/H2).
 */
export function pieceStrip(n: number, current: number, s = 40, seed = 9): string {
  const jig = generateJigsaw({ cols: Math.max(n, 1), rows: 3, width: s * Math.max(n, 1), height: s * 3, seed, tabSize: 0.24, jitter: 0.02 });
  const row = jig.pieces.filter(p => p.row === 1).sort((a, b) => a.col - b.col);
  const y0 = Math.min(...row.map(p => p.bbox.y)), y1 = Math.max(...row.map(p => p.bbox.y + p.bbox.height));
  const pad = 4, w = s * n + pad * 2, hh = y1 - y0 + pad * 2;
  const paths = row.map((p, i) => {
    const now = i === current - 1, done = i < current - 1;
    const fill = now ? 'var(--g-device)' : done ? 'var(--g-ink)' : 'none';
    return `<path d="${p.d}" fill="${fill}" stroke="${now || done ? 'var(--g-bg)' : 'var(--g-ink)'}" stroke-width="${now || done ? 2.5 : 3}" stroke-linejoin="round"/>`;
  }).join('');
  return `<svg class="h-dev" width="${w}" height="${f1(hh)}" viewBox="${-pad} ${f1(y0 - pad)} ${w} ${f1(hh)}" aria-hidden="true">${paths}</svg>`;
}

// ------------------------------------------------------------------ numbers

/** Big number / time markup: colons lifted to the figure centre, a true minus, a small %. */
export function clock(v: string): string {
  return h(v).replace(/^-/, '−').replace(/:/g, '<span class="c">:</span>').replace(/%$/, '<span class="pct">%</span>');
}
/** Set width (em) of a hero string in Rubik 700 with the hero tracking (−0.03 em); tabular figures 0.6625 em. */
export function heroEm(v: string): number {
  const adv: Record<string, number> = { ':': 0.2916, '.': 0.284, ',': 0.278, '%': 0.6 * 0.807 + 0.03, '−': 0.645, '-': 0.645, '+': 0.607, ' ': 0.25, '×': 0.6 };
  return [...v].reduce((s, ch) => s + (adv[ch] ?? (/[A-Za-z]/.test(ch) ? 0.6 : 0.6625)) - 0.03, 0);
}
/** Largest hero size ≤ max that fits `width`. */
export const heroFit = (v: string, max: number, width = CW - 8) => Math.min(max, Math.floor(width / heroEm(v)));
/** Left side bearing (em) of Rubik 700 figures, measured from rendered ink. */
const LSB: Record<string, number> = { '0': 0.042, '1': 0.06, '2': 0.048, '3': 0.034, '4': 0.019, '5': 0.041, '6': 0.039, '7': 0.072, '8': 0.038, '9': 0.04, '−': 0.061, '+': 0.05 };
/** Rubik: the baseline sits 0.8425 em below the top of a line-height-1 box. */
export const BASELINE = 0.8425;

/**
 * A positioned hero number whose ink starts exactly on `x` (default the column edge) with its baseline at `baseline`.
 * `hot` paints it in the ground's large-text highlight.
 */
export function hero(v: string, o: { size: number; baseline: number; x?: number; hot?: boolean; center?: boolean; unit?: string; extra?: string }): string {
  const first = v.replace(/^-/, '−')[0];
  const top = o.baseline - BASELINE * o.size;
  const left = (o.x ?? X0) - (LSB[first] ?? 0.04) * o.size;
  const pos = o.center ? `left:0; width:${W}px; text-align:center` : `left:${f1(left)}px`;
  const num = `<p class="h-big${o.hot ? ' hot' : ''}" data-qa-bleed style="position:absolute; ${pos}; top:${f1(top)}px; font-size:${o.size}px${o.extra ? '; ' + o.extra : ''}">${clock(v)}</p>`;
  if (!o.unit || o.center) return num;
  // The unit is its own element (an inline span would merge into the hero's text box in the overlap check), set
  // bold at 0.2 em, 0.1 em after the figures, its cap height aligned with the figures' (D2 lineage).
  const us = Math.max(30, Math.round(o.size * 0.2));
  const ux = left + (heroEm(v) + 0.1) * o.size;
  const unitBase = o.baseline - 0.7 * o.size + 0.7 * us;
  return num + `<p class="h-big${o.hot ? ' hot' : ''}" style="position:absolute; left:${f1(ux)}px; top:${f1(unitBase - BASELINE * us)}px; font-size:${us}px; letter-spacing:0.01em">${h(o.unit)}</p>`;
}

/** Rough line count of wrapped text (Rubik ≈ 0.52 em per character, bold ≈ 0.56), for layout budgets. */
export const linesOf = (text: string, px: number, width = CW, bold = false) => Math.max(1, Math.ceil((text.length * (bold ? 0.56 : 0.52) * px) / width));

// ------------------------------------------------------------------ CSS

export const HOUSE_CSS = `
body { font-variant-numeric: tabular-nums lining-nums slashed-zero; background: var(--g-bg, #2b3445); }
.hf { position: relative; width: ${W}px; height: ${FEED_H}px; overflow: hidden; background: var(--g-bg); color: var(--g-ink); }
.hf.story { height: ${STORY_H}px; }
.hf > .h-depth { position: absolute; inset: 0; background: var(--g-depth); }
.hf svg text { font-family: Rubik; font-variant-numeric: tabular-nums lining-nums slashed-zero; }
.h-head { position: absolute; left: ${X0}px; width: ${CW}px; height: 72px; display: flex; align-items: center; gap: 20px; }
.h-dev { display: block; flex: none; }
.h-kick { min-width: 0; font-size: 30px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--g-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-idx { margin-left: auto; font-size: 30px; font-weight: 700; letter-spacing: 0.04em; color: var(--g-ink); white-space: nowrap; }
.h-idx i { font-style: normal; font-weight: 500; color: var(--g-soft); }
.h-rule { position: absolute; left: ${X0}px; width: ${CW}px; height: 2px; background: var(--g-rule); }
.h-foot { position: absolute; left: ${X0}px; width: ${CW}px; height: 112px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.h-src { font-size: 30px; line-height: 1.2; color: var(--g-soft); }
.h-site { font-size: 32px; font-weight: 700; letter-spacing: 0.005em; color: var(--g-ink); white-space: nowrap; }
.h-logo { display: block; flex: none; width: auto; }
.h-title { position: absolute; left: ${X0}px; width: ${CW}px; font-size: ${TYPE.title}px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; text-wrap: balance; color: var(--g-ink); }
.h-title.xl { font-size: ${TYPE.display}px; line-height: 1.04; letter-spacing: -0.02em; }
.h-title.s { font-size: ${TYPE.titleS}px; }
.h-dek { font-size: ${TYPE.dek}px; line-height: 1.3; color: var(--g-soft); text-wrap: pretty; }
.h-lead { font-size: ${TYPE.lead}px; line-height: 1.22; font-weight: 500; color: var(--g-ink); text-wrap: pretty; }
.h-body { font-size: ${TYPE.body}px; line-height: 1.3; color: var(--g-soft); }
.h-lab { font-size: ${TYPE.label}px; color: var(--g-soft); }
.h-cap { font-size: ${TYPE.label}px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); }
.h-ask { font-size: 54px; font-weight: 700; line-height: 1.12; color: var(--g-ink); text-wrap: balance; }
.h-ask::before { content: ''; display: block; width: 72px; height: 8px; margin-bottom: 26px; background: var(--g-device); border-radius: 2px; }
.h-abs { position: absolute; left: ${X0}px; width: ${CW}px; }
.h-big { margin: 0; font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; color: var(--g-ink); }
.h-big.hot { color: var(--g-hot); }
.h-big .c, .c { display: inline-block; transform: translateY(-0.1em); }
.h-big .pct { font-size: 0.55em; margin-left: 0.04em; letter-spacing: 0; }
/* chart text (SVG) */
.c-lab { font-size: 30px; fill: var(--g-soft); }
.c-lab-b { font-size: 34px; font-weight: 700; fill: var(--g-ink); }
.c-cap { font-size: 30px; font-weight: 600; letter-spacing: 0.1em; fill: var(--g-accent); }
.c-hot { font-size: 56px; font-weight: 700; fill: var(--g-hot); }
.c-hot-s { font-size: 34px; font-weight: 700; fill: var(--g-hot-text); }
/* timing board */
.h-board { position: absolute; left: ${X0}px; width: ${CW}px; }
.h-bh { display: flex; align-items: flex-end; height: 48px; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); border-bottom: 2px solid var(--g-rule); padding-bottom: 10px; }
.h-br { position: relative; display: flex; align-items: center; border-bottom: 2px solid var(--g-band); }
.h-br.hot::before { content: ''; position: absolute; left: -${X0}px; top: 0; bottom: 0; width: 14px; background: var(--g-device); }
.h-br .rk { width: 76px; font-size: 34px; font-weight: 700; color: var(--g-accent); }
.h-br.hot .rk { color: var(--g-ink); }
.h-br .nm { flex: 1; font-size: 38px; font-weight: 500; color: var(--g-ink); }
.h-br .tm { text-align: right; font-size: 40px; font-weight: 700; color: var(--g-ink); }
.h-br .sub { font-size: 30px; line-height: 1.25; color: var(--g-soft); }
/* stat strip */
.h-strip { display: flex; }
.h-strip > div { flex: 1; border-left: 2px solid var(--g-rule); padding-left: 26px; }
.h-strip > div:first-child { border-left: 0; padding-left: 0; }
.h-strip .k { font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); }
.h-strip .v { font-size: 64px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; margin-top: 8px; color: var(--g-ink); }
/* legend */
.h-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; font-size: 34px; color: var(--g-soft); }
.h-legend b { color: var(--g-ink); font-weight: 700; }
.h-sw { display: inline-block; width: 14px; height: 34px; border-radius: 3px; vertical-align: -6px; margin-right: 16px; }
/* image mounts: white cards with one soft shadow (the depth rule for light surfaces) */
.h-mount { position: absolute; background: #ffffff; border-radius: 10px; box-shadow: 0 18px 40px -12px rgba(16, 22, 34, 0.45); overflow: hidden; }
.h-mount img { display: block; width: 100%; height: 100%; object-fit: cover; }
.h-credit { font-size: 30px; line-height: 1.2; color: var(--g-soft); }
/* poster seam (H2 covers and facts) */
.h-poster-top { position: absolute; left: 0; top: 0; }
`;

// ------------------------------------------------------------------ frame

export interface FrameOptions {
  ground: GroundKey;
  kind?: 'feed' | 'story';
  /** Header: kicker text and carousel index [i, n]. */
  kicker: string;
  idx?: [number, number];
  /** The brand device in the header. */
  device: 'piece' | 'strip';
  /** Rendered inside the frame after the header (absolutely positioned markup). */
  body: string;
  /** Source line in the footer. Empty for none. */
  src: string;
  /** Extra markup under everything (e.g. the H2 poster's top piece), drawn above the depth layer. */
  under?: string;
  /** Hide the header rule (e.g. when a poster top piece runs behind the header). */
  noRule?: boolean;
  /** Header text colours over an `under` layer of a different ground. */
  headGround?: GroundKey;
}

/** Source line with the site name set as the brand mention (bold, ink, slightly larger) so every post promotes MSP. */
export const siteLine = (src: string) => {
  const site = '<b class="h-site">myspeedpuzzling.com</b>';
  return /myspeedpuzzling\.com/i.test(src) ? h(src).replace(/myspeedpuzzling\.com/gi, site) : src.trim() ? `${site} · ${h(src)}` : site;
};

export function frame(o: FrameOptions): string {
  const g = GROUNDS[o.ground];
  const kind = o.kind ?? 'feed';
  const r = rowsFor(kind);
  const hg = o.headGround ? GROUNDS[o.headGround] : g;
  const [i, n] = o.idx ?? [1, 1];
  const device = o.device === 'strip' ? pieceStrip(n, i) : pieceMark();
  // Over a poster top piece the header takes that piece's ground (QA checks the header text against it).
  const headAttr = o.headGround ? ` style="top:${r.headTop}px; ${groundVars(hg)}" data-qa-bg="${hg.bg}"` : ` style="top:${r.headTop}px"`;
  // The strip device already shows the position, so it carries no number.
  const idxHtml = o.idx && o.device !== 'strip' ? `<span class="h-idx">${i}<i> / ${n}</i></span>` : '';
  return `<div class="hf ${kind === 'story' ? 'story' : ''}" style="${groundVars(g)}">
  <div class="h-depth"></div>
  ${o.under ?? ''}
  <header class="h-head"${headAttr}>${device}<span class="h-kick">${h(o.kicker)}</span>${idxHtml}</header>
  ${o.noRule ? '' : `<div class="h-rule" style="top:${r.ruleTop}px"></div>`}
  ${o.body}
  <div class="h-rule" style="top:${r.footRule}px"></div>
  <footer class="h-foot" style="top:${r.footTop - 20}px"><span class="h-src">${siteLine(o.src)}</span>${outlinedLogo()}</footer>
</div>`;
}

// ------------------------------------------------------------------ the H2 poster seam (D2 lineage)

/**
 * Seam shapes for the poster top piece (owner 2026-10-17: "the shape could be slightly improved"; options K1-…).
 *   grid4    the original: 4 generator pieces across (270 px), knobs as the seed falls, a little jitter (H2);
 *   bold3    3 pieces across (360 px): fewer, bigger knobs, alternating down-up-down;
 *   classic4 4 pieces across, no jitter, knobs strictly alternating down-up-down-up (a "textbook" cut);
 *   drip4    4 pieces across, every knob pointing down into the bottom piece (the coloured piece "hangs" over navy);
 *   tilt4    grid4 cut on a gentle slope (left 30 px lower than right), like a lifted lid.
 */
export type SeamStyle = 'grid4' | 'bold3' | 'classic4' | 'drip4' | 'tilt4';
const SEAM_SPEC: Record<SeamStyle, { cols: number; tab: number; jitter: number; pattern?: Array<'d' | 'u'>; seed?: number; tilt?: number }> = {
  grid4: { cols: 4, tab: 0.2, jitter: 0.04, seed: 21 },
  bold3: { cols: 3, tab: 0.24, jitter: 0.02, pattern: ['d', 'u', 'd'] },
  classic4: { cols: 4, tab: 0.22, jitter: 0, pattern: ['d', 'u', 'd', 'u'] },
  drip4: { cols: 4, tab: 0.21, jitter: 0.02, pattern: ['d', 'd', 'd', 'd'] },
  tilt4: { cols: 4, tab: 0.2, jitter: 0.04, seed: 21, tilt: 30 },
};
const seamJig = (cols: number, seam: number, seed: number, tab: number, jitter: number) => {
  const pw = W / cols;
  return generateJigsaw({ cols, rows: 2, width: W, height: 2 * pw, y: seam - pw, seed, tabSize: tab, jitter });
};
/** Knob direction of each top-row piece's bottom edge: 'd' = into the bottom piece. */
const knobs = (jig: ReturnType<typeof generateJigsaw>, seam: number) => jig.pieces.filter(q => q.row === 0).sort((a, b) => a.col - b.col)
  .map(p => { const e = p.outline.slice(18, 28); const ext = e.reduce((m, [, y]) => (Math.abs(y - seam) > Math.abs(m - seam) ? y : m), seam); return ext > seam ? 'd' : 'u'; });
const seedCache = new Map<SeamStyle, number>();
function seamSeed(style: SeamStyle): number {
  const spec = SEAM_SPEC[style];
  if (spec.seed !== undefined) return spec.seed;
  if (!seedCache.has(style)) {
    let found = 1;
    for (let sd = 1; sd < 5000; sd++) if (knobs(seamJig(spec.cols, 600, sd, spec.tab, spec.jitter), 600).join('') === spec.pattern!.join('')) { found = sd; break; }
    seedCache.set(style, found);
  }
  return seedCache.get(style)!;
}

/** How far the cut's knobs reach below / above the seam line (px), for the active (or given) seam style. */
export function seamReach(style: SeamStyle = ACTIVE?.seam ?? 'grid4'): { down: number; up: number } {
  const spec = SEAM_SPEC[style];
  const jig = seamJig(spec.cols, 600, seamSeed(style), spec.tab, spec.jitter);
  const ys = jig.pieces.filter(q => q.row === 0).flatMap(p => p.outline.slice(18, 28).map(([, y]) => y));
  return { down: Math.max(0, ...ys.map(y => y - 600)) + (spec.tilt ?? 0), up: Math.max(0, ...ys.map(y => 600 - y)) };
}

/**
 * The top piece of a poster: the frame from y = 0 down to one real jigsaw cut line at `seam` (the seam between the two
 * rows of a generated jigsaw, so the knobs have the generator's true proportions). The style defaults to the active
 * variant's seam.
 */
export function posterTopPath(seam: number, style: SeamStyle = ACTIVE?.seam ?? 'grid4'): string {
  const spec = SEAM_SPEC[style];
  const jig = seamJig(spec.cols, seam, seamSeed(style), spec.tab, spec.jitter);
  // Tilt: shift every point by a slope across the width (left lower), keeping the right edge at the seam.
  const dy = (x: number) => (spec.tilt ? spec.tilt * (1 - x / W) : 0);
  const pt = ([x, y]: number[]) => `${f1(x)} ${f1(y + dy(x))}`;
  let d = `M -4 -4 H ${W + 4} V ${seam} H ${W}`;
  for (const p of jig.pieces.filter(q => q.row === 0).sort((a, b) => b.col - a.col)) {
    const e = p.outline.slice(18, 28);
    for (let k = 1; k + 2 < e.length; k += 3) d += ` C ${pt(e[k])} ${pt(e[k + 1])} ${pt(e[k + 2])}`;
  }
  return `${d} V ${f1(seam + dy(0))} H -4 Z`;
}

// ------------------------------------------------------------------ variants

export type Role = 'cover' | 'fact' | 'data' | 'image' | 'quiz' | 'story' | 'reel';
export type Series = 'data' | 'weekly' | 'milestone' | 'puzzles' | 'atlas' | 'fun';

/** Where a slide sits: chooses its ground in every variant. `ordinal` is the post's stable feed position (POST_ORDER). */
export interface Slot { role: Role; series: Series; post: string; slide: number; of: number }

export interface Variant {
  id: 'H1' | 'H2' | 'H3' | 'H4';
  name: string;
  idea: string;
  device: 'piece' | 'strip';
  /** Covers and single big facts: D5 board, D2 two-piece poster, D9 chapter (full ground, hero first). */
  cover: 'board' | 'poster' | 'chapter';
  ground(slot: Slot): GroundKey;
  /** H2 posters: the ground of the bottom piece (the top piece takes ground(slot)). */
  posterBase?: GroundKey;
  /** Token overrides applied while this variant is active (activateVariant). */
  tokens?: GroundOverrides;
  /** Poster seam shape (default grid4). */
  seam?: SeamStyle;
  /** Which cover/fact slides become posters: every one (H2) or only a post's first slide (H4: "H2 as the facing first
   *  slide for titles, H1 for the other slides", owner 2026-10-17). */
  posterSlides?: 'all' | 'first';
}

/** Canonical feed order of every DL4 post key (stable colour rotation, gallery order, profile grid). */
export const POST_ORDER = [
  // DL1 data posts
  'wall', 'record', 'countries', 'share', 'xp', 'weekly', 'event', 'feature', 'month',
  // DL2 formats
  'sep-wall', 'sep-mosaic', 'week-wall', 'event-collage', 'potw', 'guess', 'faster',
  // DL3 ideas
  'atlas', 'cats-dogs', 'tier-list', 'museum', 'clocks-back', 'night-owls', 'missing-piece', '75-years',
  // funny facts (F3 restyled)
  'fun-minute-58', 'fun-unboxed', 'fun-1000', 'fun-edges', 'fun-sky', 'fun-halloween',
  // Stories and Reels
  'story-chapters', 'story-quiz', 'reel-wall', 'reel-sep', 'reel-counter', 'reel-xp',
] as const;
export type PostKey = typeof POST_ORDER[number];
export const ordinal = (post: string) => Math.max(0, (POST_ORDER as readonly string[]).indexOf(post));

/** Series of every post (H3 colours, gallery grouping). */
export const SERIES_OF: Record<string, Series> = {
  wall: 'data', countries: 'data', share: 'data', month: 'data',
  weekly: 'weekly', 'week-wall': 'weekly', potw: 'weekly',
  record: 'milestone', xp: 'milestone', feature: 'milestone', event: 'milestone', 'event-collage': 'milestone', '75-years': 'milestone',
  'sep-wall': 'puzzles', 'sep-mosaic': 'puzzles', guess: 'puzzles', faster: 'puzzles',
  atlas: 'atlas', 'cats-dogs': 'atlas', 'tier-list': 'atlas', museum: 'atlas',
  'clocks-back': 'fun', 'night-owls': 'fun', 'missing-piece': 'fun',
  'fun-minute-58': 'fun', 'fun-unboxed': 'fun', 'fun-1000': 'fun', 'fun-edges': 'fun', 'fun-sky': 'fun', 'fun-halloween': 'fun',
  'story-chapters': 'data', 'story-quiz': 'puzzles',
  'reel-wall': 'data', 'reel-sep': 'puzzles', 'reel-counter': 'milestone', 'reel-xp': 'milestone',
};
export const seriesOf = (post: string): Series => SERIES_OF[post] ?? 'data';

/** H3: each series owns one ground. */
export const SERIES_GROUND: Record<Series, GroundKey> = {
  data: 'navy', weekly: 'indigo', milestone: 'coral', puzzles: 'ocean', atlas: 'sky', fun: 'paper',
};
export const SERIES_NAME: Record<Series, string> = {
  data: 'Data desk', weekly: 'The week', milestone: 'Milestones & events', puzzles: 'Puzzles', atlas: 'Puzzle atlas', fun: 'Funny facts & stories',
};

/** H2's bold rotation for covers, milestones and single big facts. */
const BOLD: GroundKey[] = ['coral', 'sky', 'indigo', 'ocean'];
/** Stories rotate through the palette per chapter in every variant (D9-1/D9-5 lineage). */
const STORY_ROTATION: GroundKey[] = ['navy', 'sky', 'coral', 'indigo', 'ocean', 'navyDeep'];

/** H4 poster tops by type of post (owner 2026-10-17: colour by post type, the H3 idea, on H2's posters). */
export const POSTER_GROUND: Record<Series, GroundKey> = {
  data: 'sky', weekly: 'indigo', milestone: 'coral', puzzles: 'ocean', atlas: 'sky', fun: 'coral',
};
/** H4 text tokens. Purple headings as in H1 (kickers, board headers, labels: indigo-300 on navy, indigo-800 on coral and
 *  sky; owner 2026-10-17 reverted the two-colour call: "never too many colours", but the purple stays). On indigo and
 *  ocean posters purple can't be read, so their kicker uses the ground's light secondary; sky's highlight is ink. */
export const H4_TOKENS: GroundOverrides = {
  sky: { hot: '#1d2433', hotText: '#1d2433' },
  indigo: { accent: '#dde3ff' },
  ocean: { accent: '#c7e8ff' },
};

export const VARIANTS: Record<Variant['id'], Variant> = {
  H1: {
    id: 'H1', name: 'Race Clock refined', device: 'piece', cover: 'board',
    idea: 'Navy-led, the D5 timing board grown into a system: every feed slide on navy, white type, coral only for the #1 and the record line, our purple (indigo-300) as the accent for kickers, labels and second series. Covers keep the board layout; Stories stay navy-led too. A coral generator piece is the fixed device; the outlined logo signs every slide.',
    ground: s => (s.role === 'story' ? (s.slide % 2 ? 'navy' : 'navyDeep') : s.role === 'cover' ? 'navyDeep' : 'navy'),
  },
  H2: {
    id: 'H2', name: 'Race Clock + Poster', device: 'piece', cover: 'poster', posterBase: 'navyDeep',
    idea: 'Navy for data, bold brand grounds for the moments: covers, milestones and single big facts become D2 two-piece posters whose top piece rotates coral, sky blue, indigo and ocean blue across the feed, joined to a navy bottom by one real jigsaw cut. Data slides stay on the D5 navy board.',
    ground: s => {
      if (s.role === 'story') return STORY_ROTATION[(s.slide - 1) % STORY_ROTATION.length];
      if (s.role === 'cover' || s.role === 'fact') return BOLD[(ordinal(s.post) + s.slide - 1) % BOLD.length];
      return 'navy';
    },
  },
  H3: {
    id: 'H3', name: 'Series colours', device: 'strip', cover: 'chapter',
    idea: 'Each series owns one ground, full bleed on every slide (D9-1/D9-5 lineage): data desk navy, the week indigo, milestones and events coral, puzzles ocean blue, the atlas sky blue, funny facts and stories white with depth. The header device is a strip of interlocking pieces that fills in through a carousel.',
    ground: s => (s.role === 'story' ? SERIES_GROUND[s.series] === 'paper' ? 'navy' : STORY_ROTATION[(s.slide - 1) % STORY_ROTATION.length] : SERIES_GROUND[s.series]),
  },
  H4: {
    id: 'H4', name: 'House (H1 + H2)', device: 'piece', cover: 'poster', posterSlides: 'first', posterBase: 'navy', tokens: H4_TOKENS, seam: 'grid4',
    idea: 'The owner\'s combination (2026-10-17): H1\'s navy timing board for every data and image slide, H2\'s two-piece puzzle poster only as the first (title) slide of a post, so the profile grid reads unified. One navy everywhere; white titles, grey text, H1\'s purple for kickers and labels, coral only for highlights; no further colours. Poster tops take the colour of the type of post: data desk and atlas sky, the week indigo, milestones and events coral, puzzles ocean, funny facts and timely stories coral (owner: no green).',
    ground: s => {
      if (s.role === 'story') return (['navy', 'sky', 'coral', 'indigo', 'ocean', 'navy'] as GroundKey[])[(s.slide - 1) % 6];
      if ((s.role === 'cover' || s.role === 'fact') && s.slide === 1) return POSTER_GROUND[s.series];
      return 'navy';
    },
  },
};

// ------------------------------------------------------------------ slide builders

export interface SlideCtx { v: Variant; post: string; slide: number; of: number }
/** Is this slide a two-piece poster in its variant? (H2: every cover/fact; H4: only a post's first slide.) */
export const posterAt = (c: SlideCtx) => c.v.cover === 'poster' && (c.v.posterSlides !== 'first' || c.slide === 1);
export const slotOf = (c: SlideCtx, role: Role): Slot => ({ role, series: seriesOf(c.post), post: c.post, slide: c.slide, of: c.of });

/** A content slide (boards, charts, image walls) on the variant's ground for this role. */
export function slide(c: SlideCtx, role: Role, o: { kicker: string; body: string; src: string; kind?: 'feed' | 'story'; title?: string; titleSize?: 'xl' | 's'; noIdx?: boolean }): { html: string; ground: Ground } {
  const g = GROUNDS[c.v.ground(slotOf(c, role))];
  const r = rowsFor(o.kind ?? 'feed');
  const title = o.title ? `<h1 class="h-title ${o.titleSize ?? ''}" style="top:${r.contentTop}px">${h(o.title)}</h1>` : '';
  const html = frame({ ground: g.key, kind: o.kind, kicker: o.kicker, idx: c.of > 1 && !o.noIdx ? [c.slide, c.of] : undefined, device: c.v.device, body: title + o.body, src: o.src });
  return { html, ground: g };
}

export interface HeroSpec {
  /** The number or time (e.g. "22:30", "56%", "8,130"). */
  value: string;
  /** Small unit after the number ("min"). */
  unit?: string;
  hot?: boolean;
  max?: number;
}

export interface CoverSpec {
  kicker: string;
  title: string;
  dek?: string;
  hero?: HeroSpec;
  /** H1 board covers: optional art (absolute markup) for the area y 420–1150 instead of the hero number. */
  art?: string;
  /** A stat strip [label, value][] under the title (all layouts). */
  stats?: Array<[string, string]>;
  src: string;
  /** Markup under the text block (a small chart, a question); give its height in px so the layout can budget it. */
  extra?: string;
  extraHeight?: number;
}

const STATS_H = 124;

/**
 * Cover or single-big-fact slide in the variant's cover layout:
 *   board (H1)   covers: header, XL title + dek, then the art or the hero number, a stat strip at the bottom;
 *                facts: the hero number first, then the statement (as chapter);
 *   poster (H2)  a bold top piece with the hero number, cut by one real jigsaw seam from a navy bottom that carries
 *                kicker, title, dek, stats and the extra; the seam rises when the bottom needs more room;
 *   chapter (H3) full series ground, the hero number first, then title, dek, stats and the extra (D9-1).
 * Facts (role 'fact') set the title as the statement under the number (44 px), covers as a headline.
 */
export function cover(c: SlideCtx, role: 'cover' | 'fact', s: CoverSpec): string {
  const v = c.v;
  const slot = slotOf(c, role);
  const idx: [number, number] | undefined = c.of > 1 ? [c.slide, c.of] : undefined;
  const isFact = role === 'fact';
  const stats = s.stats?.length ? `<div class="h-strip">${s.stats.map(([k, val]) => `<div><p class="k">${h(k)}</p><p class="v">${clock(val)}</p></div>`).join('')}</div>` : '';
  const titlePx = isFact ? TYPE.lead : s.title.length > 40 ? TYPE.title : 76;
  const titleLh = isFact ? 1.22 : 1.08;
  const titleHtml = `<h1 class="${isFact ? 'h-lead' : 'h-title'}" style="position:static; font-size:${titlePx}px; line-height:${titleLh}${isFact ? '; font-weight:700' : ''}">${h(s.title)}</h1>`;
  const dekHtml = s.dek ? `<p class="h-dek" style="margin-top:18px">${h(s.dek)}</p>` : '';
  const extraHtml = s.extra ? `<div style="margin-top:34px">${s.extra}</div>` : '';
  /** Height of the text block below the hero (title, dek, stats, extra). */
  const blockH = (capLine: boolean) =>
    (capLine ? 54 : 0)
    + linesOf(s.title, titlePx, CW, true) * titlePx * titleLh
    + (s.dek ? 18 + linesOf(s.dek, TYPE.dek) * TYPE.dek * 1.3 : 0)
    + (stats ? 40 + STATS_H : 0)
    + (s.extra ? 34 + (s.extraHeight ?? 200) : 0);

  if (posterAt(c)) {
    const top = GROUNDS[v.ground(slot)], base = GROUNDS[v.posterBase ?? 'navyDeep'];
    // The bottom piece needs blockH below the knobs (≈ 90 px under the seam); the seam stays between 430 and 680.
    const need = blockH(!isFact);
    // Text starts below the deepest knob of the active cut (≥ 96 px under the seam line).
    const below = Math.max(96, Math.round(seamReach().down) + 20);
    const SEAM = Math.round(Math.max(430, Math.min(680, FEED.contentBottom - need - below)));
    const above = Math.max(112, Math.round(seamReach().up) + 22); // the hero's baseline clears the cut's upward knobs
    const room = SEAM - above - 8 - 170; // hero cap height must clear the header
    const size = s.hero ? Math.min(heroFit(s.hero.value + (s.hero.unit ? '  ' : ''), s.hero.max ?? 340), Math.floor(room / 0.72)) : 0;
    const heroHtml = s.hero ? `<div style="${groundVars(top)}" data-qa-bg="${top.bg}">${hero(s.hero.value, { size, baseline: SEAM - above, unit: s.hero.unit })}</div>` : '';
    const under = `<svg class="h-poster-top" width="${W}" height="${FEED_H}" viewBox="0 0 ${W} ${FEED_H}" aria-hidden="true">
      <path d="${posterTopPath(SEAM)}" fill="${top.bg}"/></svg>${heroHtml}`;
    const body = `<div class="h-abs" style="top:${SEAM + below}px">
        ${isFact ? '' : `<p class="h-cap" style="margin-bottom:22px">${h(s.kicker)}</p>`}
        ${titleHtml}${dekHtml}${stats ? `<div style="margin-top:40px">${stats}</div>` : ''}${extraHtml}
      </div>`;
    return frame({ ground: base.key, kicker: s.kicker, idx, device: v.device, body, src: s.src, under, noRule: true, headGround: top.key });
  }

  const g = GROUNDS[v.ground(slot)];
  if (v.cover === 'board' && !isFact && (s.art || !s.hero)) {
    const titleH = linesOf(s.title, TYPE.display, CW, true) * TYPE.display * 1.04;
    const body = `<h1 class="h-title xl" style="top:${FEED.contentTop}px">${h(s.title)}</h1>
      ${s.dek ? `<p class="h-dek h-abs" style="top:${FEED.contentTop + titleH + 22}px">${h(s.dek)}</p>` : ''}
      ${s.art ?? ''}
      ${stats ? `<div class="h-abs" style="top:${FEED.contentBottom - STATS_H - (s.extra ? (s.extraHeight ?? 200) + 34 : 0)}px">${stats}</div>` : ''}
      ${s.extra ? `<div class="h-abs" style="top:${FEED.contentBottom - (s.extraHeight ?? 200)}px">${s.extra}</div>` : ''}`;
    return frame({ ground: g.key, kicker: s.kicker, idx, device: v.device, body, src: s.src });
  }

  // Hero first, then the text block (H3 chapter covers, every H1/H3 fact, H1 covers without art); the group is
  // centred in the content area so short facts don't leave an empty band above the footer.
  const need = blockH(false);
  const avail = FEED.contentBottom - FEED.contentTop;
  const room = avail - need - 90; // space for the hero (cap height + gap)
  const size = s.hero ? Math.min(heroFit(s.hero.value + (s.hero.unit ? '  ' : ''), s.hero.max ?? 300), Math.floor(room / 0.74)) : 0;
  const group = (s.hero ? size * 0.72 + 64 : 0) + need;
  const offset = Math.max(0, Math.min(220, (avail - group) / 2 - 20));
  const baseline = FEED.contentTop + 22 + offset + size * 0.72;
  const heroHtml = s.hero ? hero(s.hero.value, { size, baseline, hot: s.hero.hot, unit: s.hero.unit }) : '';
  const after = s.hero ? baseline + 64 : FEED.contentTop + offset;
  const body = `${heroHtml}
    <div class="h-abs" style="top:${f1(after)}px">${titleHtml}${dekHtml}${stats ? `<div style="margin-top:40px">${stats}</div>` : ''}${extraHtml}</div>`;
  return frame({ ground: g.key, kicker: s.kicker, idx, device: v.device, body, src: s.src });
}
