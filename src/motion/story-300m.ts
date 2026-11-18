// Story "LET'S CELEBRATE 300 000 000 PIECES PLACED TOGETHER!" (owner 2026-11-18, the evening the 300M Reel went out).
// Everything is readable on frame 0 (a Story is tapped past fast); the motion is the party: confetti rain from frame
// 0, a counter shake + confetti burst on the music's drop, the puzzle-piece heart beating on the beat.
// y 1300–1660 stays empty: the owner places a sticker there in the app (the API cannot place stickers).
//   0.0       headline, 300 000 000, PIECES PLACED TOGETHER!, heart, credit; confetti falling
//   2.0       KEY (music drop): the counter pops, the screen shakes, confetti bursts; the heart starts beating
//   12.0      end = frame 0 (seamless loop)
import { GROUNDS, W, X0, frame, hero, heroFit, type Variant } from '../design/house.ts';
import { fmtInt } from '../design/page.ts';
import { FRAMES } from '../render/render.ts';
import { composition } from './kit.ts';
import type { Motion } from './render.ts';
import { confetti, heart } from './reel-300m.ts';
import type { Reel300mSpec } from '../posts/reel-300m.ts';

const SAFE = FRAMES.story.safe;
const RW = SAFE.x1 - X0;
const T = { drop: 2.0, beat: 0.5 } as const;
const DURATION = 12.0;

export function story300mMotion(v: Variant, s: Reel300mSpec): Motion {
  const key = 'story-300m';
  const date = s.queriedAt.slice(0, 10);
  const big = '300 000 000'.replace(/ /g, ' ');
  const cSize = heroFit(big, 170, RW - 40);
  const rain = confetti('ra', 30, 7, 70), burst = confetti('bu', 36, 11, 70);
  const counter = hero(big, { size: cSize, baseline: 640, center: true }).replace('<p class="h-big"', '<p class="h-big" id="count"');
  const body = `<div id="cf">${rain.html}${burst.html}</div>
    <p class="s-line hot" style="top:330px">LET'S CELEBRATE</p>
    ${counter}
    <p class="s-line" style="top:700px">PIECES PLACED</p>
    <p class="s-line" style="top:800px">TOGETHER!</p>
    ${heart(540, 950, 6, 5, 44)}
    <p class="h-abs h-credit s-cc" style="top:1196px; width:${RW}px">${fmtInt(s.puzzlers)} puzzlers · ${s.countries} countries · data ${date}</p>`;
  const css = `
#cf { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.cf { position: absolute; left: 0; top: 0; overflow: visible; }
.bu { visibility: hidden; }
#count { z-index: 3; transform-origin: 50% 60%; }
#heart { transform-origin: 50% 55%; z-index: 2; }
.s-cc { text-align: center; }
.s-line { position: absolute; left: ${X0}px; width: ${RW}px; text-align: center; font-size: 92px; font-weight: 800; line-height: 1.05; letter-spacing: -0.01em; color: var(--g-ink); white-space: nowrap; z-index: 2; }
.s-line.hot { color: var(--g-hot); font-size: 84px; }
`;
  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: '300 million pieces', device: v.device, src: '', rows: { headTop: 200 }, masthead: false, body });
  const script = `
const D = DATA, T = D.T;
// confetti rain all the way through, in the side gutters, a whole number of passes per loop (seamless)
D.rain.forEach((p, i) => {
  const el = '#ra' + i, top = -150, bot = 2000, span = bot - top;
  const k = Math.max(1, Math.round(${DURATION} * p.speed / span)), d = ${DURATION} / k, v = span / d;
  const x = p.r1 < 0.5 ? -40 + p.r1 * 80 : ${W} - 70 + (p.r1 - 0.5) * 80;
  const y0 = top + ((p.y - top) % span + span) % span, t1 = (bot - y0) / v;
  tl.fromTo(el, { x, y: y0, rotation: p.rot }, { y: bot, rotation: p.rot + p.spin * t1 / 3, duration: t1, ease: 'none', immediateRender: true }, 0);
  for (let j = 0; j < k; j++) {
    const at = t1 + j * d, end = Math.min(${DURATION}, at + d), yEnd = top + (end - at) * v;
    tl.fromTo(el, { y: top }, { y: yEnd, rotation: '+=' + (p.spin * (end - at) / 3), duration: end - at, ease: 'none', immediateRender: false }, at);
  }
});
cue('key', T.drop, { what: 'the party: counter pop, shake, confetti burst' });
tl.fromTo('#count', { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, T.drop);
tl.fromTo('#root .hf', { x: 0, y: 0 }, { x: 14, y: -10, duration: 0.05, repeat: 7, yoyo: true, ease: 'none', immediateRender: false }, T.drop);
tl.set('#root .hf', { x: 0, y: 0 }, T.drop + 0.42);
D.burst.forEach((p, i) => {
  const el = '#bu' + i, x1 = -20 + p.r1 * 1060, y1 = 900 + p.r2 * 700;
  tl.set(el, { autoAlpha: 1, x: 505, y: 1950, scale: 0.2, rotation: p.rot }, T.drop);
  tl.to(el, { x: x1, y: y1, scale: 1, rotation: p.rot + p.spin / 2, duration: 0.6, ease: 'power3.out' }, T.drop);
  tl.to(el, { y: y1 + 1500, rotation: p.rot + p.spin * 2, duration: 2.6, ease: 'power2.in' }, T.drop + 0.6);
  tl.set(el, { autoAlpha: 0 }, T.drop + 3.3);
});
for (let t = T.drop; t < ${DURATION} - 0.4; t += T.beat) tl.fromTo('#heart', { scale: 1 }, { scale: 1.08, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, t);
cue('outro', ${DURATION} - 2.5, { what: 'end' });
tl.set({}, {}, ${DURATION});
`;
  const pick = (a: ReturnType<typeof confetti>) => a.items.map(({ x, y, rot, spin, speed, r1, r2 }) => ({ x, y, rot, spin, speed, r1, r2 }));
  const data = { T, rain: pick(rain), burst: pick(burst) };
  return {
    key, duration: DURATION, coverAt: 0.05, safe: SAFE,
    qaAt: [0.05, T.drop + 0.3, 5.0, DURATION - 0.05],
    html: composition({ key, title: 'Story 300 million pieces', duration: DURATION, frameHtml, css, data, script }),
  };
}
