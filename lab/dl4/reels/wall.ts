// DL4 · reel-wall (12 s): the 59-minute wall in the house style, full 9:16. The histogram grows from the bottom edge
// of the frame (full bleed, value scale from zero at the edge), so the lower half is the chart itself.
//   0–3.6 s   hook "When do most 500s finish?"; bars build left to right (0.25–3.6 s)
//   3.9 s     55–59 min turn hot; the answer "58 minutes" replaces the question (H2: a bold poster piece drops in)
//   5.6 s     the wall drops at 60:00, the bars behind it flinch, "−7.3% at the hour" lands
//   8.6 s     the question to the viewer: "Which side of the wall is your PB?"
//   10.9 s    everything unwinds to the opening frame (seamless loop)
import { fmtInt, fmtSignedPct, escapeHtml as h } from '../../../src/design/page.ts';
import {
  H, HEAD, W, composition, device, f1, looks, masthead, posterLayer, posterMotion, stripState, type Reel, type ReelContext,
} from './shared.ts';

const KEY = 'reel-wall';
const Y_MAX = 7500;        // value scale from zero (house rule)
const BAR_SCALE = 930;     // px for Y_MAX; bars stand on the bottom edge (y 1920)
const SEAM = 726;          // H2 poster seam (its knobs reach ±54 px)
const ANN_TOP = 792;       // annotations, below the seam's knobs
const RULER_TOP = 906;     // minute labels above the tallest bar
const WALL_TOP = 784;
const BEATS = 4;

export function wallReel({ c, v }: ReelContext): Reel {
  const w = c.dl1.wall;
  const { base, bold } = looks(v, KEY);
  const hist = w.histogram;                      // minutes 40..80
  const m0 = hist[0].minute;
  const band = W / hist.length;
  const barW = band * 0.76;
  const x = (minute: number) => (minute - m0) * band;   // left edge of a minute's band
  const hour = w.wallMinute + 1;
  const wallX = f1(x(hour));
  const peak = w.mode;
  const hot = hist.filter(b => b.minute > w.wallMinute - 5 && b.minute <= w.wallMinute).map(b => b.minute);

  const bars = hist.map(b => {
    const hgt = f1((b.results / Y_MAX) * BAR_SCALE);
    const pos = `left:${f1(x(b.minute) + (band - barW) / 2)}px;top:${f1(H - hgt)}px;width:${f1(barW)}px;height:${hgt}px`;
    // A ghost track (band colour, true height) under every bar keeps the frame full before the bars build.
    return `<div class="ghost" style="${pos}"></div><div class="bar" id="b${b.minute}" style="${pos}"></div>`;
  }).join('');
  const ruler = [50, hour, 70].map(m => {
    const cx = x(m) + band / 2;
    const label = m === hour ? '1:00:00' : String(m);
    // The hour label sits right of the wall line (the line runs through its column).
    const pos = m === hour ? `left:${f1(Number(wallX) + 16)}px` : `left:${f1(cx)}px; transform:translateX(-50%)`;
    return `<p class="h-lab tick${m === hour ? ' hr' : ''}" style="${pos}">${label}</p>`;
  }).join('');

  const answer = `<div class="r-abs beat" id="ha" style="top:${HEAD.content}px"><p class="ans"><span class="hot">${peak.minute}</span> minutes</p><p class="h-lead" style="margin-top:14px">${h('is the most common finish time')}</p></div>`;
  const question = `<h2 class="r-abs beat q" id="hc" style="top:${HEAD.content}px">${h(w.question)}</h2>`;
  const dev = device(v, BEATS, 'sp');
  const mast = masthead({ id: 'mast', kicker: w.kicker, src: c.dl1.source, device: dev });

  const css = `
.beat { opacity: 0; }
#hq { font-size: 96px; line-height: 1.04; font-weight: 700; letter-spacing: -0.02em; color: var(--g-ink); text-wrap: balance; }
.ans { font-size: 136px; line-height: 1; font-weight: 700; letter-spacing: -0.03em; color: var(--g-ink); white-space: nowrap; }
.ans .hot { color: var(--g-hot); }
.q { font-size: 84px; line-height: 1.06; font-weight: 700; letter-spacing: -0.02em; color: var(--g-ink); text-wrap: balance; }
.ghost { position: absolute; background: var(--g-band); border-radius: 4px 4px 0 0; }
.bar { position: absolute; background: var(--c-base); border-radius: 4px 4px 0 0; transform-origin: 50% 100%; will-change: transform; }
.tick { position: absolute; top: ${RULER_TOP}px; line-height: 36px; white-space: nowrap; }
.tick.hr { font-weight: 700; color: var(--g-ink); }
.ann { position: absolute; top: ${ANN_TOP}px; opacity: 0; white-space: nowrap; }
.ann b { display: block; font-size: 56px; line-height: 60px; font-weight: 700; color: var(--g-ink); }
.ann span { display: block; font-size: 34px; line-height: 42px; color: var(--g-soft); }
#peak { right: ${f1(W - (Number(wallX) - 16))}px; text-align: right; }
#drop { left: ${f1(Number(wallX) + 16)}px; }
#drop b { color: var(--g-hot); }
#wall { position: absolute; left: ${f1(Number(wallX) - 3)}px; top: ${WALL_TOP}px; width: 6px; height: ${H - WALL_TOP}px; }
`;

  const beatsHtml = answer + question;
  const body = `
${mast}
<h1 class="r-abs" id="hq" style="top:${HEAD.content}px">${h('When do most 500s finish?')}</h1>
${bold ? '' : beatsHtml}
${bars}
${ruler}
<svg id="wall" viewBox="0 0 6 ${H - WALL_TOP}" preserveAspectRatio="none" aria-hidden="true"><line x1="3" y1="0" x2="3" y2="${H - WALL_TOP}" stroke="var(--g-ink)" stroke-width="6" stroke-dasharray="14 10"/></svg>
<div class="ann" id="peak"><b>${peak.minute} min</b><span>${fmtInt(peak.results)} results</span></div>
<div class="ann" id="drop"><b>${fmtSignedPct(w.dropPct)}</b><span>at the hour</span></div>
${bold ? posterLayer({ bold, seam: SEAM, mast: masthead({ id: 'mast2', kicker: w.kicker, src: c.dl1.source, device: dev }), body: beatsHtml }) : ''}
`;

  const script = `
const BASE = DATA.base, HOT = DATA.hot;
const all = DATA.minutes.map(m => '#b' + m);
const hot = DATA.hotMinutes.map(m => '#b' + m);
const behind = DATA.minutes.filter(m => m >= DATA.hour).map(m => '#b' + m);
${stripState(v, BEATS, 'sp', 1, 0)}

// 0.25–3.6 s: bars build left to right, standing on the bottom edge.
tl.fromTo(all, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: 'power3.out', stagger: 0.068 }, 0.25);
tl.fromTo('.tick', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0.6);

// 3.9 s: the run-up to the hour lights up; the answer replaces the question.
${bold ? posterMotion(SEAM, 3.75, 10.85) : ''}
tl.fromTo(hot, { backgroundColor: BASE }, { backgroundColor: HOT, duration: 0.3, ease: 'power1.out', stagger: 0.06, immediateRender: false }, 3.9);
tl.fromTo('#hq', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 3.9);
tl.fromTo('#ha', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 4.3);
tl.fromTo('#peak', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, 4.45);
${stripState(v, BEATS, 'sp', 2, 4.3)}

// 5.6 s: the wall drops at the hour; the bars behind it flinch; the drop lands.
tl.fromTo('#wall', { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.35, ease: 'power3.in' }, 5.6);
tl.to(behind, { scaleY: 0.955, duration: 0.12, ease: 'power2.in', stagger: 0.012 }, 5.95);
tl.to(behind, { scaleY: 1, duration: 0.4, ease: 'back.out(2.2)', stagger: 0.012 }, 6.07);
tl.fromTo('#drop', { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, 6.1);
${stripState(v, BEATS, 'sp', 3, 6.1)}

// 8.6 s: the question to the viewer.
tl.fromTo('#ha', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 8.6);
tl.fromTo('#hc', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 8.9);
${stripState(v, BEATS, 'sp', 4, 8.9)}

// 10.9–11.8 s: unwind to the opening frame.
tl.fromTo('#hc', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 10.9);
tl.fromTo(['#peak', '#drop', '#wall', '.tick'], { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in', immediateRender: false }, 10.9);
tl.fromTo(hot, { backgroundColor: HOT }, { backgroundColor: BASE, duration: 0.3, immediateRender: false }, 10.95);
tl.to([...all].reverse(), { scaleY: 0, duration: 0.4, ease: 'power2.in', stagger: 0.008 }, 11.0);
tl.fromTo('#hq', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, 11.4);
${stripState(v, BEATS, 'sp', 1, 11.4)}
`;

  const duration = 12;
  return {
    key: KEY,
    label: `Reel: ${w.title} (${duration} s loop)`,
    caption: `${peak.minute} minutes is the most common finish time for a solo 500 on MySpeedPuzzling. Then the hour hits: ${fmtInt(w.at59)} results at 59 minutes, ${fmtInt(w.at60)} at 60, a ${Math.abs(w.dropPct)}% drop. There is no such step at 45 or 50 minutes. Which side of the wall is your PB?\n\n#speedpuzzling #jigsawpuzzle #500pieces`,
    duration,
    coverAt: 7.6,
    qaAt: [0, 2.2, 3.8, 4.4, 5.0, 7.6, 10.2, 11.0, 11.95],
    html: composition({
      id: `${KEY}-${v.id.toLowerCase()}`, title: `${v.id} ${KEY}`, duration, ground: base, css, body,
      data: { minutes: hist.map(b => b.minute), hotMinutes: hot, hour, base: base.chart.base, hot: base.chart.hot }, script,
    }),
    assets: {},
  };
}

