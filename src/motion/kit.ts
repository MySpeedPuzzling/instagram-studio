// Reusable motion kit for HyperFrames compositions in the house style. A composition is a normal house frame (the
// same frame() the stills use, so stills and motion share one layout) wrapped in a root HyperFrames reads
// (data-composition-id, duration, fps), plus a paused GSAP timeline `tl` built from the helpers below.
//
// KIT_JS (in every composition's script) — call these from a builder's timeline code:
//   fmtN(n)                       house number format: 8103, 12 450 (narrow space from 10 000), never commas
//   fmtT(seconds)                 stopwatch format: 18:41, 1:05:20
//   countUp(sel, to, at, dur, fmt?)   a number ticking up to its final value (text of every element matching sel)
//   riseIn(sel, at, o?)           text/blocks rising 40 px into place while fading in (o.stagger for lists)
//   popIn(sel, at, o?)            scale from 0.6 with a small overshoot (o.from = transform origin)
//   flyIn(items, at, o?)          items [{sel, dx, dy, rot}] converge from their offsets and snap (seeded scatters)
//   dropOut(sel, at, o?)          falls out of the frame with a spin, then hidden
//   moveTo(sel, from, to, at, dur)  moves an absolutely placed box onto another box with transforms only (FLIP)
//   slotLand(sel, at, o?)         a slot-machine column rolls and lands on its last row (names without blur frames of
//                                 other people: the rolling rows are blank bars)
//   flash(sel, at)                a quick coral highlight pulse on text
// The final frame of every builder equals its still (so stickers placed on the still fit the video too).
import { page } from '../design/page.ts';
import { HOUSE_CSS } from '../design/house.ts';
import { FPS } from './render.ts';

export const KIT_JS = `
const fmtN = n => { const s = String(Math.round(Math.abs(n))); return (n < 0 ? '\\u2212' : '') + (s.length < 5 ? s : s.replace(/\\B(?=(\\d{3})+$)/g, '\\u202F')); };
const fmtT = sec => { sec = Math.round(sec); const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60, p = v => String(v).padStart(2, '0'); return hh ? hh + ':' + p(mm) + ':' + p(ss) : mm + ':' + p(ss); };
function countUp(sel, to, at, dur, fmt) {
  const f = fmt || fmtN, o = { v: 0 }, els = [...document.querySelectorAll(sel)];
  const show = () => { for (const e of els) e.textContent = f(o.v); };
  show();
  tl.fromTo(o, { v: 0 }, { v: to, duration: dur, ease: 'power3.out', onUpdate: show, onComplete: show }, at);
}
function riseIn(sel, at, o) {
  o = o || {};
  tl.fromTo(sel, { y: o.y ?? 40, opacity: 0 }, { y: 0, opacity: 1, duration: o.dur ?? 0.5, ease: o.ease ?? 'power3.out', stagger: o.stagger ?? 0 }, at);
}
function popIn(sel, at, o) {
  o = o || {};
  tl.fromTo(sel, { scale: o.scale ?? 0.6, opacity: 0, transformOrigin: o.from ?? '50% 50%' }, { scale: 1, opacity: 1, duration: o.dur ?? 0.45, ease: 'back.out(2)', stagger: o.stagger ?? 0 }, at);
}
function flyIn(items, at, o) {
  o = o || {};
  items.forEach((it, i) => tl.fromTo(it.sel, { x: it.dx, y: it.dy, rotation: it.rot || 0, opacity: 0, transformOrigin: '50% 50%' },
    { x: 0, y: 0, rotation: 0, opacity: 1, duration: o.dur ?? 0.55, ease: it.ease || o.ease || 'expo.out' }, at + i * (o.stagger ?? 0.1)));
}
function dropOut(sel, at, o) {
  o = o || {};
  tl.to(sel, { y: o.y ?? 1100, rotation: (i) => (i % 2 ? 1 : -1) * (25 + i * 9), duration: o.dur ?? 0.6, ease: 'power2.in', stagger: o.stagger ?? 0.05 }, at);
  tl.set(sel, { autoAlpha: 0 }, at + (o.dur ?? 0.6) + (o.stagger ?? 0.05) * 6);
}
function moveTo(sel, from, to, at, dur) {
  // Transform-only FLIP (layout properties stutter under frame-by-frame capture): translate + scale from box to box.
  tl.to(sel, { x: to.x - from.x, y: to.y - from.y, scaleX: to.w / from.w, scaleY: to.h / from.h, rotation: 0, transformOrigin: '0% 0%',
    duration: dur ?? 0.6, ease: 'power3.inOut' }, at);
}
function slotLand(sel, at, o) {
  o = o || {};
  document.querySelectorAll(sel).forEach((col, i) => {
    const rows = col.children.length, rowH = col.children[0].offsetHeight;
    tl.fromTo(col, { y: 0 }, { y: -(rows - 1) * rowH, duration: (o.dur ?? 1.0) + i * (o.stagger ?? 0.25), ease: 'power4.out' }, at);
  });
}
function flash(sel, at) {
  tl.fromTo(sel, { scale: 1 }, { scale: 1.12, duration: 0.1, ease: 'power1.out', immediateRender: false }, at);
  tl.to(sel, { scale: 1, duration: 0.45, ease: 'back.out(3)' }, at + 0.1);
}
`;

/**
 * A complete HyperFrames composition around a house frame (`frameHtml`, from frame()): the page shell the stills use
 * (fonts, tokens, HOUSE_CSS), the root HyperFrames reads, GSAP, KIT_JS and the builder's timeline `script` (which may
 * read DATA). The timeline is registered under `key` after the build, as HyperFrames requires.
 */
export function composition(o: { key: string; title: string; duration: number; frameHtml: string; css?: string; data?: unknown; script: string }): string {
  const body = `<div id="root" data-composition-id="${o.key}" data-start="0" data-duration="${o.duration}" data-fps="${FPS}" data-width="1080" data-height="1920" style="position:relative; width:1080px; height:1920px; overflow:hidden">
${o.frameHtml}
</div>
<script src="/node_modules/gsap/dist/gsap.min.js"></script>
<script>
const DATA = ${JSON.stringify(o.data ?? {})};
const tl = gsap.timeline({ paused: true });
${KIT_JS}
${o.script}
window.__timelines = window.__timelines || {};
window.__timelines[${JSON.stringify(o.key)}] = tl;
</script>`;
  return page(body, { frame: 'story', css: HOUSE_CSS + (o.css ?? ''), title: o.title });
}
