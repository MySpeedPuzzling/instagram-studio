// Teaser Story for the piece quiz as an ~8 s animation (HyperFrames; owner 2026-10-30: "video"). Frame 0 and the last
// frame are exactly the still teaser (src/posts/piece-quiz.ts teaserBig), so the preview is complete and the owner's
// countdown sticker (under the last line, y ≈ 1480–1700) fits the whole video. Beats:
//   0.0–0.9  hold the finished frame (Instagram's preview)
//   0.9–1.3  the piece lifts off the ground (scale up, deeper shadow), a big faint "?" breathes in behind it
//   1.5–2.9  turned over like in your hand: the front folds away, the navy back with the MSP logo shows, then the front
//   2.9–4.3  a few wobbles, as if trying where it fits; then it settles back into place
//   4.6      "Halloween quiz · tomorrow 10:00" pulses once
//   6.6–7.2  the "?" fades out; hold on the still
//   all the way: navy bat silhouettes (flat poster shapes, owner 2026-10-30: "spooky flying around") cross behind the
//            text and the piece at three depths (small and faint far away, bigger near), wings flapping; two are
//            already in the air on frame 0 so the preview reads spooky too
// Nothing animates below y ≈ 1460 (the countdown sticker zone).
import { GROUNDS, LOGO_OUTLINE_URL, f1, type Variant } from '../design/house.ts';
import { PIECE, TEASER_BOX, at, fitOf, teaserBig } from '../posts/piece-quiz.ts';
import { composition } from './kit.ts';
import type { Motion } from './render.ts';

const DURATION = 8;

/** One bat, centred on 0,0 (≈ 220 × 90): two scalloped wings that beat up and down around the shoulders (rotation,
 *  so the silhouette always reads as a bat; squashing them read as lines), body, head and ears. */
const BAT_RIGHT = 'M 8 -6 C 30 -30 70 -36 104 -16 C 92 -8 88 4 90 16 C 78 4 64 4 56 16 C 48 4 36 2 28 14 C 22 4 14 2 8 8 Z';
const bat = (id: string, fill: string) => `<div id="${id}" class="pq-bat" style="position:absolute; left:0; top:0"><div class="bob">
  <svg width="220" height="100" viewBox="-110 -50 220 100" style="position:absolute; left:-110px; top:-50px; overflow:visible" aria-hidden="true"><g class="dir" fill="${fill}">
    <g class="wing-r"><path d="${BAT_RIGHT}"/></g><g class="wing-l"><path d="${BAT_RIGHT}" transform="scale(-1 1)"/></g>
    <ellipse cx="0" cy="4" rx="11" ry="19"/><circle cx="0" cy="-15" r="10"/>
    <path d="M -9 -19 L -7 -32 L -2 -22 Z M 9 -19 L 7 -32 L 2 -22 Z"/></g></svg></div></div>`;
/** Flights: x/y from → to (frame px), start, duration, depth scale, opacity. Bats 1 and 2 are in frame at t = 0. */
const BATS = [
  { x0: 120, x1: 1300, y0: 880, y1: 820, t0: 0, dur: 7.5, sc: 0.8, op: 0.45 },
  { x0: 940, x1: -350, y0: 1180, y1: 1060, t0: 0, dur: 4.4, sc: 1.6, op: 0.9 },
  { x0: -250, x1: 1350, y0: 370, y1: 310, t0: 1.2, dur: 6.5, sc: 0.7, op: 0.35 },
  { x0: 1400, x1: -400, y0: 760, y1: 920, t0: 3.0, dur: 4.0, sc: 1.9, op: 0.9 },
  { x0: -300, x1: 1350, y0: 1010, y1: 1230, t0: 4.6, dur: 4.6, sc: 1.2, op: 0.6 },
];

export function pieceQuizTeaserMotion(_v: Variant): Motion {
  const key = 'story-piece-quiz-teaser';
  const navy = GROUNDS.navy;
  const { s, tx, ty } = fitOf([PIECE], TEASER_BOX);
  const p = at(...PIECE);
  const cx = tx + (p.bbox.x + p.bbox.width / 2) * s, cy = ty + (p.bbox.y + p.bbox.height / 2) * s;
  // The back of the piece: the outline mirrored (as when you turn a real piece over) in navy with the outlined logo in the middle (brand colours, never white).
  const back = `<div id="back" style="position:absolute; left:0; top:0; width:1080px; height:1920px; visibility:hidden">
    <svg width="1080" height="1920" style="position:absolute; left:0; top:0" aria-hidden="true">
      <g transform="translate(${f1(2 * cx)} 0) scale(-1 1) translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})"><path d="${p.d}" fill="${navy.bg}" stroke="rgba(10,14,24,0.5)" stroke-width="${f1(3.2 / s)}"/></g></svg>
    <img src="${LOGO_OUTLINE_URL}" alt="" style="position:absolute; left:${f1(cx - 90)}px; top:${f1(cy - 90)}px; width:180px; height:180px; object-fit:contain"></div>`;
  // A drawn "?" (stroke + dot, not a glyph): decoration behind the piece, so the text QA leaves it alone.
  const q = `<svg id="qmark" width="1080" height="1920" style="position:absolute; left:0; top:0; opacity:0" aria-hidden="true"><g transform="translate(540 ${f1(cy - 40)}) scale(2.3)" fill="none" stroke="${navy.bg}" stroke-width="64" stroke-linecap="round">
    <path d="M -120 -150 C -120 -300 150 -300 150 -150 C 150 -50 10 -50 10 50"/><circle cx="10" cy="175" r="22" fill="${navy.bg}"/></g></svg>`;
  // The "?" sits behind everything; the back sits right after the piece in paint order.
  const frameHtml = teaserBig(q + BATS.map((_, i) => bat(`bat${i}`, navy.bg)).join('')).html.replace('<p id="cred"', `${back}<p id="cred"`);
  const css = `<style>#piece, #back { transform-origin: ${f1(cx)}px ${f1(cy)}px; } #qmark { transform-origin: 540px ${f1(cy)}px; }</style>`;
  const script = `
const O = '${f1(cx)}px ${f1(cy)}px';
// lift
tl.to(['#piece', '#back'], { scale: 1.08, y: -24, duration: 0.4, ease: 'power2.out', transformOrigin: O }, 0.9);
tl.fromTo('#qmark', { opacity: 0, scale: 0.85 }, { opacity: 0.12, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.95);
tl.to('#qmark', { scale: 1.05, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 1.75);
// turn over: front folds to an edge, the back opens, holds, folds, the front returns
tl.to('#piece', { scaleX: 0, duration: 0.22, ease: 'power2.in' }, 1.5);
tl.set('#piece', { visibility: 'hidden' }, 1.72);
tl.set('#back', { visibility: 'visible', scaleX: 0, scaleY: 1.08, y: -24 }, 1.72);
tl.to('#back', { scaleX: 1.08, duration: 0.22, ease: 'power2.out' }, 1.72);
tl.to('#back', { scaleX: 0, duration: 0.22, ease: 'power2.in' }, 2.45);
tl.set('#back', { visibility: 'hidden' }, 2.67);
tl.set('#piece', { visibility: 'visible' }, 2.67);
tl.to('#piece', { scaleX: 1.08, duration: 0.22, ease: 'power2.out' }, 2.67);
// wobble, then settle
tl.to('#piece', { rotation: -7, x: -26, duration: 0.32, ease: 'sine.inOut' }, 2.95);
tl.to('#piece', { rotation: 6, x: 22, duration: 0.36, ease: 'sine.inOut' }, 3.27);
tl.to('#piece', { rotation: -3, x: -8, duration: 0.3, ease: 'sine.inOut' }, 3.63);
tl.to('#piece', { rotation: 0, x: 0, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, 3.93);
// the time line pulses once
flash('#when', 4.6);
// the "?" leaves; hold on the still
tl.to('#qmark', { opacity: 0, duration: 0.6, ease: 'power1.in', overwrite: 'auto' }, 6.6);
// bats: fly across at their depth, bob, beat their wings around the shoulders
DATA.bats.forEach((b, i) => {
  const sel = '#bat' + i;
  tl.set(sel, { x: b.x0, y: b.y0, scale: b.sc, opacity: b.op }, 0);
  tl.set(sel + ' .dir', { scaleX: b.x1 < b.x0 ? -1 : 1, svgOrigin: '0 0' }, 0);
  tl.to(sel, { x: b.x1, y: b.y1, duration: b.dur, ease: 'none' }, b.t0);
  tl.to(sel + ' .bob', { y: -26, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(${DURATION} / 0.55) }, 0);
  const beat = 0.16 + i * 0.012;
  tl.fromTo(sel + ' .wing-r', { rotation: -28 }, { rotation: 22, svgOrigin: '8 -6', duration: beat, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(${DURATION} / beat) }, 0);
  tl.fromTo(sel + ' .wing-l', { rotation: 28 }, { rotation: -22, svgOrigin: '-8 -6', duration: beat, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(${DURATION} / beat) }, 0);
});
tl.set({}, {}, ${DURATION});
`;
  return {
    key, duration: DURATION, coverAt: DURATION - 0.1,
    qaAt: [0.05, 1.2, 2.0, 3.3, 4.0, 4.7, 6.0, DURATION - 0.1],
    html: composition({ key, title: 'Piece quiz teaser Story', duration: DURATION, frameHtml, css, data: { bats: BATS }, script }),
  };
}
