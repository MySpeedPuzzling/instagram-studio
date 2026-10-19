// The MSP logo's motion modules for any composition: the rigged logo (src/design/logo-rig.ts) placed at any position
// and size, with an LM1 intro played from any second. Built on the LM1 snippets (lab/logo/shared.ts); owner pick for
// stopwatch moments: L1-3 "Tick" (2026-10-19).
//
//   const t = logoTick({ at: 7.6, cx: 540, cy: 1505, width: 240 });
//   frame body += t.html;  timeline script += t.script;  css += LOGO_CSS;
//   the logo settles at t.settleAt (exact brand mark: every rig transform cleared), then holds.
import { DIAL_ORIGIN, RIG, hideAt, logoSvg, outlineJoin, scaleIn, showAt, speedLinesIn } from '../../lab/logo/shared.ts';

export { LOGO_CSS } from '../../lab/logo/shared.ts';

const f2 = (v: number) => +v.toFixed(3);
const j = JSON.stringify;

/** Moves every absolute time in a snippet by `dt` (the snippets are written from 0), keeping "set at 0" states. */
const shift = (snippet: string, dt: number) => snippet
  // position-0 sets are the initial state: apply them immediately (HyperFrames won't render a set at exactly 0)
  .replace(/tl\.set\(([^;]*?), 0\);/g, 'gsap.set($1);')
  .replace(/(tl\.(?:set|fromTo|to)\([\s\S]*?), (\d+(?:\.\d+)?)\);/g, (_m, head: string, t: string) => `${head}, ${f2(Number(t) + dt)});`);

/**
 * L1-3 "Tick": the dial ring draws itself clockwise, face and ticks pop in, the hand ticks 6 → 12 leaving a ghost at
 * each stop, then the piece pops out from behind with crown and buttons and the speed lines shoot out. 1.92 s.
 */
export function logoTick(o: { at: number; cx: number; cy: number; width: number }): { html: string; script: string; settleAt: number } {
  const { cx: DCX, cy: DCY } = RIG.dial;
  const RING = { r: ((RIG.parts['dial-ring'].box.x1 - RIG.parts['dial-ring'].box.x0) / 2) - 100.25, w: 200.5 };
  const INK = '#2C3679';
  const ring = `<circle id="ring-draw" cx="${DCX}" cy="${DCY}" r="${RING.r}" fill="none" stroke="${INK}" stroke-width="${RING.w}" pathLength="1" stroke-dasharray="1 1" transform="rotate(-90 ${DCX} ${DCY})" visibility="hidden"/>`;
  const html = logoSvg({ cx: o.cx, cy: o.cy, width: o.width, insert: { end: ring } });
  const crown = RIG.parts.crown.box, bl = RIG.parts['button-left'].box, br = RIG.parts['button-right'].box;
  const s: string[] = [
    hideAt(['piece', 'piece-tint', 'piece-shine', 'outline', 'case', 'crown', 'buttons', 'dial-face', 'ticks', 'hub', 'hand-minute', 'hand-hour']),
    `tl.set('#ring-draw', { autoAlpha: 1, attr: { 'stroke-dashoffset': 1 } }, 0.08);`,
    `tl.fromTo('#ring-draw', { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.37, ease: 'power2.inOut', immediateRender: false }, 0.08);`,
    scaleIn(['case', 'dial-face'], { at: 0.36, dur: 0.24, from: 0.5 }),
    showAt(['ticks'], 0.45),
  ];
  RIG.ticks.map(t => t.hour % 12).sort((a, b) => a - b).forEach((hr, n) => {
    const id = `tick-${hr || 12}`;
    s.push(`tl.set('#${id}', { scale: 0, transformOrigin: '50% 50%' }, 0);`);
    s.push(`tl.fromTo('#${id}', { scale: 0 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.16, ease: 'power3.out', immediateRender: false }, ${f2(0.45 + n * 0.022)});`);
  });
  s.push(showAt(['hub', 'hand-minute', 'hand-hour'], 0.7), hideAt(['trails'], 0), showAt(['trails'], 0.7));
  s.push(`tl.set('#hand-minute', { rotation: 180, svgOrigin: ${j(DIAL_ORIGIN)} }, 0);`);
  const stops = [180, 225, 270, 315, 360];
  for (const t of RIG.trails) s.push(hideAt([t.id], 0));
  for (let k = 1; k < stops.length; k++) {
    const at = f2(0.82 + (k - 1) * 0.12);
    s.push(`tl.fromTo('#hand-minute', { rotation: ${stops[k - 1]} }, { rotation: ${stops[k]}, svgOrigin: ${j(DIAL_ORIGIN)}, duration: 0.08, ease: 'power4.out', immediateRender: false }, ${at});`);
    s.push(showAt([RIG.trails.find(t => t.deg === stops[k - 1])!.id], at));
  }
  s.push(`tl.set('#hand-minute', { rotation: 0, svgOrigin: ${j(DIAL_ORIGIN)} }, 1.3);`);
  s.push(scaleIn(['piece', 'piece-tint'], { at: 1.3, dur: 0.28, from: 0.55 }));
  s.push(scaleIn(['crown'], { at: 1.38, dur: 0.22, from: 0.2, origin: `${DCX} ${crown.y1.toFixed(1)}` }));
  s.push(scaleIn(['button-left'], { at: 1.42, dur: 0.2, from: 0.2, origin: `${bl.x1.toFixed(1)} ${bl.y1.toFixed(1)}` }));
  s.push(scaleIn(['button-right'], { at: 1.42, dur: 0.2, from: 0.2, origin: `${br.x0.toFixed(1)} ${br.y1.toFixed(1)}` }));
  s.push(showAt(['buttons'], 1.42));
  s.push(outlineJoin(1.62), hideAt(['ring-draw'], 1.62), showAt(['piece-shine'], 1.62));
  s.push(speedLinesIn(1.5));
  const settleAt = 1.92;
  s.push(`tl.set('#logo g, #logo path', { clearProps: 'transform' }, ${settleAt});`);
  return { html, script: shift(s.join('\n'), o.at), settleAt: f2(o.at + settleAt) };
}
