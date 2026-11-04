// Reel "WHERE IS IT?" (the missing piece; owner 2026-11-04, concept A "The search", docs/ideas/reel-missing-piece.md).
// Humour + send-a-friend. One short line per beat, each held long enough to read twice; the joke beats get time.
//   0.0–2.4   splash, complete from frame 0: logo, myspeedpuzzling.com, "WHERE IS IT?" / "The last piece of the
//             puzzle" over an almost finished generator-piece puzzle (a cat puzzle) with one empty slot
//   2.4–2.9   the splash leaves (logo exit), the board sinks away
//   2.9–5.6   "Under the table?"   a torch beam sweeps under a flat table: dust, a coin, no piece
//   5.6–8.3   "In the box?"        the box turns upside down and shakes: two specks fall, no piece
//   8.3–11.0  "Did the dog eat it?" an empty bowl, licked clean, wobbles
//   11.0–15.4 the suspects (data): mentions in notes, cats vs dogs as two bars, "Prime suspect" stamp on cats
//   15.4–19.6 coral poster: N of your notes say a piece was missing
//   19.6–24.2 "N found it later." the board comes back, lifts, the piece was under the puzzle; it snaps in
//   24.2–27.8 the send: "Send this to someone who's still looking."
//   27.8–28.8 loop: the piece pops out again, the splash returns (= frame 0)
// Text only in the Reel safe area (x 60–960, y 220–1250); art may run to ~y 1500.
import { GROUNDS, W, X0, f1, frame, groundVars, hero, outlinedLogo, pieceMark, posterTopPath, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoExit } from './logo.ts';
import type { Motion } from './render.ts';
import type { ReelMissingSpec } from '../posts/reel-missing.ts';

const SAFE = FRAMES.reel.safe;
const RX = SAFE.x1, RW = RX - X0, CX = X0 + RW / 2;
export const T = { splashOut: 2.4, s1: 2.9, s2: 5.6, s3: 8.3, sus: 11.0, poster: 15.4, posterOut: 19.3, found: 19.6, lift: 21.4, snap: 22.7, send: 24.2, loop: 27.8 } as const;
const DURATION = 28.8;
const SEAM = 1262;
/** The board: 8×6 generator pieces of 100 px, the slot at column 4, row 2. */
const B = { cols: 8, rows: 6, pc: 108, x: 92, y: 852 };
const BW = B.cols * B.pc, BH = B.rows * B.pc;
const HOLE = { col: 4, row: 2 };
/** Where the lost piece lies under the board (board-local), and its tilt. */
const UNDER = { dx: -40, dy: 270, rot: 24 };
const C = { coral: '#ec726f', coralLight: '#ffb0ab', sky: '#97a5f9', ink: '#ffffff', soft: '#dfe3ea', band: '#2e3747', line: '#5a6479', dark: '#1a202c' };

function board(img: string) {
  const jig = generateJigsaw({ cols: B.cols, rows: B.rows, width: BW, height: BH, seed: 46, tabSize: 0.24, jitter: 0.04 });
  const hole = jig.pieces.find(p => p.col === HOLE.col && p.row === HOLE.row)!;
  const pat = (id: string) => `<pattern id="${id}" patternUnits="userSpaceOnUse" x="0" y="0" width="${BW}" height="${BH}"><image href="${img}" width="${BW}" height="${BH}" preserveAspectRatio="xMidYMid slice"/></pattern>`;
  const svg = `<svg class="mo-board" id="board" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="left:${B.x}px; top:${B.y}px" aria-hidden="true">
    <defs>${pat('bimg')}</defs>
    ${jig.pieces.filter(p => p !== hole).map(p => `<path class="mo-pc" d="${p.d}" fill="url(#bimg)"/>`).join('')}
    <path class="mo-hole" id="hole" d="${hole.d}"/>
  </svg>`;
  // the lost piece: its own SVG on the board's box (same pattern, so it carries its part of the picture), moved with
  // transforms around the piece's centre
  const cx = hole.bbox.x + hole.bbox.width / 2, cy = hole.bbox.y + hole.bbox.height / 2;
  const lost = `<svg class="mo-board" id="lost" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="left:${B.x}px; top:${B.y}px" aria-hidden="true">
    <defs>${pat('limg')}</defs><path class="mo-pc mo-lost" d="${hole.d}" fill="url(#limg)"/>
  </svg>`;
  return { svg, lost, origin: `${f1(cx)}px ${f1(cy)}px`, ox: cx, oy: cy };
}

/** Scene 1: a flat table, the floor, a torch beam sweeping under it (a cone from the bottom right to a floor spot). */
function sceneTable() {
  const floorY = 1400;
  return `<div class="mo-scene" id="s1">
    <p class="mo-line" style="top:560px">Under the table?</p>
    <svg class="mo-art" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true">
      <defs><clipPath id="under"><rect x="0" y="800" width="${W}" height="${floorY - 800 + 2}"/></clipPath>
        <radialGradient id="spot"><stop offset="0" stop-color="${C.coralLight}" stop-opacity="0.75"/><stop offset="1" stop-color="${C.coralLight}" stop-opacity="0"/></radialGradient></defs>
      <rect x="0" y="800" width="${W}" height="${floorY - 800}" fill="${C.dark}"/>
      <g clip-path="url(#under)">
        <g id="beam"><polygon points="1180,1250 230,1330 230,1430" fill="${C.coralLight}" opacity="0.3"/>
          <ellipse cx="230" cy="1380" rx="190" ry="54" fill="url(#spot)"/></g>
        <g class="mo-dust" fill="#7d879c"><circle cx="300" cy="1388" r="11"/><circle cx="322" cy="1396" r="6"/><circle cx="580" cy="1386" r="9"/><circle cx="790" cy="1390" r="12"/><circle cx="812" cy="1384" r="6"/></g>
        <ellipse cx="470" cy="1390" rx="26" ry="10" fill="#c9a24a"/>
      </g>
      <rect x="0" y="${floorY}" width="${W}" height="8" fill="${C.line}"/>
      <rect x="120" y="760" width="840" height="44" rx="6" fill="${C.sky}"/>
      <rect x="160" y="804" width="34" height="${floorY - 804}" fill="${C.sky}"/><rect x="886" y="804" width="34" height="${floorY - 804}" fill="${C.sky}"/>
    </svg>
  </div>`;
}

/** Scene 2: the box (its picture on the lid side) turns upside down and shakes; only two specks fall out. */
function sceneBox(img: string) {
  return `<div class="mo-scene" id="s2">
    <p class="mo-line" style="top:560px">In the box?</p>
    <div id="box" style="position:absolute; left:${CX - 270}px; top:860px; width:540px; height:400px">
      <div class="mo-boxin"></div>
      <div class="mo-boxfront" style="background-image:url('${img}')"></div>
    </div>
    <div class="mo-speck" id="sp1" style="left:${CX - 40}px; top:1180px"></div><div class="mo-speck" id="sp2" style="left:${CX + 50}px; top:1180px"></div>
  </div>`;
}

/** Scene 3: an empty dog bowl, licked clean, wobbling. */
function sceneBowl() {
  return `<div class="mo-scene" id="s3">
    <p class="mo-line" style="top:560px">Did the dog eat it?</p>
    <svg class="mo-art" id="bowl" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true">
      <ellipse cx="${CX}" cy="1352" rx="300" ry="34" fill="${C.dark}"/>
      <path d="M ${CX - 300} 1100 L ${CX + 300} 1100 L ${CX + 230} 1340 L ${CX - 230} 1340 Z" fill="${C.coral}"/>
      <ellipse cx="${CX}" cy="1100" rx="300" ry="62" fill="#e4625f"/>
      <ellipse cx="${CX}" cy="1106" rx="250" ry="44" fill="${C.dark}"/>
      <path d="M ${CX - 120} 1098 q 30 -14 70 -2" stroke="#7d879c" stroke-width="6" fill="none" stroke-linecap="round"/>
      <text x="${CX}" y="1250" text-anchor="middle" font-family="Rubik" font-weight="700" font-size="72" fill="${C.dark}" letter-spacing="8">DOG</text>
    </svg>
  </div>`;
}

/** Scene 4: the suspects: notes mentioning cats vs dogs as two bars; "Prime suspect" stamp on the cats. */
function sceneSuspects(s: ReelMissingSpec) {
  const max = Math.max(s.cats, s.dogs), L = 560;
  const bar = (k: string, n: number, y: number, col: string) => `
    <p class="mo-bl" style="top:${y}px">${k}</p>
    <div class="mo-bar" id="bar-${k.toLowerCase()}" style="top:${y + 70}px; width:${Math.round(L * n / max)}px; background:${col}"></div>
    <p class="mo-bn" id="n-${k.toLowerCase()}" style="top:${y + 62}px; left:${X0 + Math.round(L * n / max) + 24}px">${fmtInt(n)}</p>`;
  return `<div class="mo-scene" id="s4">
    <p class="mo-line" style="top:470px">The suspects</p>
    <p class="mo-sub2" style="top:566px">Mentioned in your result notes</p>
    ${bar('Cats', s.cats, 640, C.coral)}
    ${bar('Dogs', s.dogs, 820, C.sky)}
    <p class="mo-stamp" id="stamp" style="top:1100px; left:${CX - 290}px">Prime suspect</p>
  </div>`;
}

export function reelMissingMotion(v: Variant, s: ReelMissingSpec): Motion {
  const key = 'reel-missing';
  const coral = GROUNDS.coral;
  const b = board(s.box.img);
  const logo = logoExit({ cx: CX, cy: 410, width: 220 });
  const credit = `${s.box.puzzle} · ${s.box.brand}`;

  const splash = `<div id="slogo">${logo.html}</div>
  <div id="splash">
    <p class="mo-site" style="top:528px">myspeedpuzzling.com</p>
    <p class="mo-c mo-hook" style="top:600px">WHERE IS IT?</p>
    <p class="mo-c mo-sub" style="top:730px">The last piece of the puzzle</p>
  </div>`;
  const boardCredit = `<p class="h-abs h-credit mo-cc" id="bcredit" style="top:796px; width:${RW}px">Puzzle: ${h(credit)}</p>`;

  const poster = `<div id="poster">
    <svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${coral.bg}"/></svg>
    <div id="ptext" style="${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <header class="h-head" style="top:296px">${pieceMark('var(--g-device)')}<span class="h-kick">Did you know · result notes</span><span style="margin-left:auto">${outlinedLogo(96).replace('.svg"', '.svg?poster"')}</span></header>
      ${hero(fmtInt(s.missing), { size: 400, baseline: 860 })}
      <p class="h-abs h-lead" style="top:930px; width:${RW}px; font-size:52px">of your notes on MySpeedPuzzling say a piece was missing.</p>
    </div>
  </div>`;

  const found = `<div id="found">
    <p class="mo-line" id="f1" style="top:470px">${fmtInt(s.foundLater)} found it later.</p>
    <p class="mo-line hot" id="f2" style="top:470px">It was under the puzzle.</p>
  </div>`;
  const send = `<div id="send">
    <p class="mo-line" style="top:470px">Send this to someone</p>
    <p class="mo-line hot" style="top:580px">who's still looking.</p>
  </div>`;

  const body = `${splash}${sceneTable()}${sceneBox(s.box.img)}${sceneBowl()}${sceneSuspects(s)}${b.lost}${b.svg}${boardCredit}${found}${send}${poster}`;

  const css = LOGO_CSS + `
#s1, #s2, #s3, #s4, #found, #send, #poster, #ptext, #f1, #f2 { visibility: hidden; opacity: 0; }
.hf > .h-head, .hf > .h-src { visibility: hidden; opacity: 0; }
.mo-scene { position: absolute; inset: 0; }
.mo-art { position: absolute; left: 0; top: 0; }
.mo-board { position: absolute; overflow: visible; }
#lost { visibility: hidden; }
.mo-pc { stroke: rgba(18, 24, 36, 0.55); stroke-width: 1.4; stroke-linejoin: round; }
.mo-lost { stroke: rgba(18, 24, 36, 0.7); stroke-width: 2; }
.mo-hole { fill: ${C.dark}; stroke: ${C.coral}; stroke-width: 5; stroke-linejoin: round; }
.mo-cc { text-align: center; }
.mo-site { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 32px; font-weight: 700; color: var(--g-ink); }
.mo-c { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: var(--g-ink); }
.mo-hook { font-size: 112px; color: var(--g-hot); }
.mo-sub { font-size: 56px; font-weight: 600; letter-spacing: 0; color: var(--g-soft); }
.mo-line { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 76px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; color: var(--g-ink); white-space: nowrap; }
.mo-line.hot { color: var(--g-hot); }
.mo-sub2 { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 44px; font-weight: 500; color: var(--g-soft); }
.mo-bl { position: absolute; left: ${X0}px; font-size: 48px; font-weight: 700; color: var(--g-ink); }
.mo-bar { position: absolute; left: ${X0}px; height: 96px; border-radius: 0 10px 10px 0; transform-origin: 0 50%; }
.mo-bn { position: absolute; font-size: 96px; font-weight: 700; line-height: 1; color: var(--g-ink); font-variant-numeric: tabular-nums; }
.mo-stamp { position: absolute; z-index: 6; background: rgba(34, 42, 56, 0.82); padding: 14px 34px; font-size: 64px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
  color: ${C.coral}; border: 7px solid ${C.coral}; border-radius: 14px; transform: rotate(-7deg); white-space: nowrap; }
.mo-boxin { position: absolute; left: 0; right: 0; top: -36px; height: 72px; background: ${C.dark}; border: 8px solid #c95855; border-radius: 50%; }
.mo-boxfront { position: absolute; inset: 0; background-size: cover; background-position: center; border-radius: 8px; box-shadow: inset 0 0 0 8px #c95855; }
.mo-speck { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #7d879c; opacity: 0; }
#poster { position: absolute; inset: 0; z-index: 7; }
#s4 { z-index: 6; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: 'Did you know · the missing piece', device: v.device, src: `Result notes · data ${s.queriedAt.slice(0, 10)}`, rows: { headTop: 296 }, masthead: true, body });

  const script = `
const D = DATA, T = D.T;
const show = (sel, at, dur) => tl.to(sel, { autoAlpha: 1, duration: dur ?? 0.3 }, at);
const hide = (sel, at, dur) => tl.to(sel, { autoAlpha: 0, duration: dur ?? 0.25 }, at);
const MAST = '.hf > .h-head, .hf > .h-src';
const scene = (id, at, out) => { show(id, at, 0.01); riseIn(id + ' .mo-line', at, { dur: 0.35 }); tl.fromTo(id + ' .mo-art, ' + id + ' #box', { y: 500, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out', immediateRender: false }, at + 0.05); hide(id, out - 0.25, 0.2); };

// ---- the empty slot pulses on the splash (it already shows on frame 0)
tl.fromTo('#hole', { strokeOpacity: 1 }, { strokeOpacity: 0.35, duration: 0.5, repeat: 3, yoyo: true, ease: 'sine.inOut' }, 0.2);

// ---- the splash leaves: logo exit, lines lift, the board sinks out
${logo.out(T.splashOut)}
tl.to('#splash > *', { y: -60, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 }, T.splashOut + 0.05);
tl.set('#splash', { autoAlpha: 0 }, T.splashOut + 0.5);
tl.to('#board', { y: 1150, duration: 0.45, ease: 'power2.in' }, T.splashOut + 0.05);
hide('#bcredit', T.splashOut + 0.05, 0.2);
tl.set('#board', { autoAlpha: 0 }, T.splashOut + 0.55);
show(MAST, T.splashOut + 0.68);

// ---- 1: under the table, the beam sweeps left → right → back a little
scene('#s1', T.s1, T.s2);
tl.fromTo('#beam', { x: 0 }, { x: 620, duration: 1.7, ease: 'sine.inOut', immediateRender: false }, T.s1 + 0.4);
tl.to('#beam', { x: 380, duration: 0.5, ease: 'sine.inOut' }, T.s1 + 2.1);

// ---- 2: the box turns over, shakes, two specks fall
scene('#s2', T.s2, T.s3);
tl.to('#box', { rotation: 180, duration: 0.6, ease: 'back.inOut(1.4)' }, T.s2 + 0.5);
tl.to('#box', { x: '+=26', duration: 0.07, repeat: 7, yoyo: true, ease: 'none' }, T.s2 + 1.15);
tl.fromTo(['#sp1', '#sp2'], { y: 0, opacity: 1 }, { y: 260, opacity: 0, duration: 0.6, ease: 'power2.in', stagger: 0.15, immediateRender: false }, T.s2 + 1.3);

// ---- 3: the bowl wobbles, empty
scene('#s3', T.s3, T.sus);
tl.to('#bowl', { rotation: 4, transformOrigin: '${CX}px 1340px', duration: 0.12, repeat: 5, yoyo: true, ease: 'sine.inOut' }, T.s3 + 0.9);

// ---- 4: the suspects, bars grow, numbers count, the stamp lands on the cats
show('#s4', T.sus, 0.01);
riseIn('#s4 .mo-line, #s4 .mo-sub2', T.sus, { stagger: 0.15, dur: 0.35 });
riseIn('#s4 .mo-bl', T.sus + 0.5, { stagger: 0.3, dur: 0.3 });
tl.fromTo('#bar-cats', { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power3.out', immediateRender: true }, T.sus + 0.6);
tl.fromTo('#bar-dogs', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out', immediateRender: true }, T.sus + 0.9);
tl.fromTo('#s4 .mo-bn', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: true }, T.sus + 0.6);
countUp('#n-cats', D.cats, T.sus + 0.6, 1.0);
countUp('#n-dogs', D.dogs, T.sus + 0.9, 0.8);
tl.set('#board', { autoAlpha: 1, y: 1150, scale: 0.72, transformOrigin: '50% 0%' }, T.sus);
tl.to('#board', { y: 188, duration: 0.5, ease: 'power3.out' }, T.sus + 0.3);
tl.set('#bcredit', { y: 204 }, T.sus);
show('#bcredit', T.sus + 0.6);
tl.fromTo('#stamp', { scale: 2.4, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: -7, duration: 0.3, ease: 'power4.in', immediateRender: true }, T.sus + 2.1);
tl.to('#s4', { x: 8, duration: 0.05, repeat: 3, yoyo: true }, T.sus + 2.4);
hide('#s4', T.poster - 0.1, 0.1);
hide(['#board', '#bcredit'], T.poster - 0.1, 0.1);
tl.set('#board', { y: 1150, scale: 1 }, T.poster + 0.5);
tl.set('#bcredit', { y: 0 }, T.poster + 0.5);

// ---- poster: the number
tl.set('#poster', { autoAlpha: 1 }, T.poster);
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.42, ease: 'power3.out', immediateRender: false }, T.poster);
tl.set(MAST, { autoAlpha: 0 }, T.poster + 0.28);
tl.set('#ptext', { autoAlpha: 1 }, T.poster + 0.3);
countUp('#ptext .h-big', D.missing, T.poster + 0.32, 1.2);
riseIn('#ptext .h-lead', T.poster + 0.9, { dur: 0.35 });
tl.to('#ptext', { autoAlpha: 0, duration: 0.15 }, T.posterOut);
tl.set(MAST, { autoAlpha: 1 }, T.posterOut + 0.15);
tl.to('#poster', { y: -${SEAM + 140}, duration: 0.38, ease: 'power2.in' }, T.posterOut + 0.1);
tl.set('#poster', { autoAlpha: 0 }, T.posterOut + 0.49);

// ---- found: the board returns; it lifts and the lost piece lies under it; the piece flies into the slot
show('#found', T.found, 0.01);
tl.set('#board', { autoAlpha: 1 }, T.found);
tl.to('#board', { y: 0, duration: 0.5, ease: 'power3.out' }, T.found);
show('#bcredit', T.found + 0.3);
show('#f1', T.found + 0.2, 0.3);
tl.set('#lost', { autoAlpha: 1, x: D.under.dx, y: D.under.dy, rotation: D.under.rot, transformOrigin: D.origin, zIndex: 1 }, T.lift - 0.05);
tl.set('#board', { zIndex: 2 }, T.lift - 0.05);
tl.to('#board', { y: -250, rotation: -2, transformOrigin: '50% 50%', duration: 0.55, ease: 'power3.out' }, T.lift);
tl.to('#f1', { autoAlpha: 0, duration: 0.2 }, T.lift);
show('#f2', T.lift + 0.3, 0.3);
tl.set('#lost', { zIndex: 3 }, T.snap - 0.05);
tl.to('#lost', { x: 0, y: 0, rotation: 0, duration: 0.55, ease: 'back.out(1.6)' }, T.snap);
tl.to('#board', { y: 0, rotation: 0, duration: 0.5, ease: 'power3.inOut' }, T.snap);
tl.to('#hole', { strokeOpacity: 0, duration: 0.1 }, T.snap + 0.5);
flash('#f2', T.snap + 0.55);
hide('#found', T.send - 0.25, 0.2);

// ---- send
show('#send', T.send, 0.01);
riseIn('#send > *', T.send, { stagger: 0.3, dur: 0.35 });

// ---- loop: the piece pops out and is gone again, the splash returns (= frame 0)
hide(['#send', MAST], T.loop, 0.25);
tl.to('#hole', { strokeOpacity: 1, duration: 0.1 }, T.loop + 0.05);
tl.to('#lost', { y: -1300, rotation: 200, duration: 0.6, ease: 'power2.in' }, T.loop + 0.05);
tl.set('#lost', { autoAlpha: 0 }, T.loop + 0.7);
tl.set('#splash', { autoAlpha: 1 }, T.loop + 0.3);
tl.fromTo('#splash > *', { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, immediateRender: false }, T.loop + 0.3);
${logo.back(T.loop + 0.4)}
tl.set({}, {}, ${DURATION});
`;
  const data = { T, cats: s.cats, dogs: s.dogs, missing: s.missing, under: UNDER, origin: b.origin };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, 1.5, 4.2, 6.9, 7.6, 10.0, 13.5, 17.6, 20.8, 22.2, 23.6, 26.0, DURATION - 0.05],
    html: composition({ key, title: 'Reel WHERE IS IT? (missing piece)', duration: DURATION, frameHtml, css, data, script }),
  };
}
