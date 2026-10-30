// Teaser Story for the piece quiz as an ~8 s animation (HyperFrames; owner 2026-10-30: "video"). Frame 0 and the last
// frame are exactly the still teaser (src/posts/piece-quiz.ts teaserBig), so the preview is complete and the owner's
// countdown sticker (under the last line, y ≈ 1480–1700) fits the whole video. Beats:
//   0.0–0.9  hold the finished frame (Instagram's preview)
//   0.9–1.3  the piece lifts off the ground (scale up, deeper shadow), a big faint "?" breathes in behind it
//   1.5–2.9  turned over like in your hand: the front folds away, the navy back with the MSP logo shows, then the front
//   2.9–4.3  a few wobbles, as if trying where it fits; then it settles back into place
//   4.6      "Halloween quiz · tomorrow 10:00" pulses once
//   6.6–7.2  the "?" fades out; hold on the still
// Nothing animates below y ≈ 1460.
import { GROUNDS, LOGO_OUTLINE_URL, f1, type Variant } from '../design/house.ts';
import { PIECE, TEASER_BOX, at, fitOf, teaserBig } from '../posts/piece-quiz.ts';
import { composition } from './kit.ts';
import type { Motion } from './render.ts';

const DURATION = 8;

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
  const frameHtml = teaserBig(q).html.replace('<p id="cred"', `${back}<p id="cred"`);
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
tl.set({}, {}, ${DURATION});
`;
  return {
    key, duration: DURATION, coverAt: DURATION - 0.1,
    qaAt: [0.05, 1.2, 2.0, 3.3, 4.7, DURATION - 0.1],
    html: composition({ key, title: 'Piece quiz teaser Story', duration: DURATION, frameHtml, css, script }),
  };
}
