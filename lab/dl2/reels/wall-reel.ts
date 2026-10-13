// F4 · wall-reel (12 s): the 59-minute wall as a loopable histogram build.
//   0–4 s   hook: "When do most 500s finish?" over an empty axis; bars build left to right (0.25–3.6 s)
//   3.9 s   the five minutes before the hour turn coral; the answer "58 minutes" replaces the question
//   5.6 s   the wall drops at 60:00, the bars behind it flinch, "−7.3% at the hour" lands (by ~6.5 s)
//   8.6 s   the question to the viewer: "Which side of the wall is your PB?"
//   10.9 s  everything unwinds back to the opening frame, so the loop is seamless
import { escapeHtml as h, fmtInt, fmtSignedPct } from '../../../src/design/page.ts';
import { X0, CW, composition, f1, kicker, sourceLine, type Reel, type ReelContext } from './shared.ts';

const BASE = 1110;          // bar baseline (y)
const BAR_H = 416;          // height of a 7,500-result bar
const Y_MAX = 7500;         // value scale starts at zero (house rule)
const LABEL_TOP = 580;      // annotation block above the peak

export function wallReel({ dl1: c }: ReelContext): Reel {
  const w = c.wall;
  const hist = w.histogram;                      // minutes 40..80
  const m0 = hist[0].minute;
  const band = CW / hist.length;
  const barW = band * 0.8;
  const x = (minute: number) => X0 + (minute - m0) * band; // left edge of a minute's band
  const wallX = f1(x(60));
  const peak = w.mode;                           // 58 min, 7,419 results
  const hot = hist.filter(b => b.minute >= 55 && b.minute <= 59).map(b => b.minute);

  const bars = hist.map(b => {
    const hgt = f1((b.results / Y_MAX) * BAR_H);
    return `<div class="bar" id="b${b.minute}" style="left:${f1(x(b.minute) + (band - barW) / 2)}px;top:${f1(BASE - hgt)}px;width:${f1(barW)}px;height:${hgt}px"></div>`;
  }).join('');

  const ticks = [40, 50, 60, 70, 80].map(m => {
    const cls = m === 40 ? 'tick first' : m === 80 ? 'tick last' : 'tick';
    const left = m === 80 ? X0 + CW : x(m);
    return `<div class="tickmark" style="left:${f1(x(m) - 1.5)}px"></div><p class="${cls}" style="left:${f1(left)}px">${m === 80 ? '80 min' : m}</p>`;
  }).join('');

  const css = `
.hl { position: absolute; left: ${X0}px; top: 322px; width: ${CW}px; }
#hq { font-size: 104px; line-height: 1.02; font-weight: 700; letter-spacing: -2.5px; }
#ha { opacity: 0; }
#ha .big { font-size: 140px; line-height: 1; font-weight: 700; letter-spacing: -4px; }
#ha .big span { display: inline-block; border-bottom: 16px solid var(--coral-500); line-height: 0.82; }
#ha .dek { font-size: 44px; line-height: 1.2; color: var(--ink-soft); margin-top: 16px; }
#hc { opacity: 0; font-size: 84px; line-height: 1.06; font-weight: 700; letter-spacing: -1.5px; color: var(--indigo-500); }
.bar { position: absolute; background: #dfe3ea; border-radius: 3px 3px 0 0; transform-origin: 50% 100%; will-change: transform; }
.baseline { position: absolute; left: ${X0}px; top: ${BASE}px; width: ${CW}px; height: 3px; background: var(--context); }
.tickmark { position: absolute; top: ${BASE + 3}px; width: 3px; height: 12px; background: var(--context); }
.tick { position: absolute; top: ${BASE + 18}px; font-size: 34px; line-height: 40px; color: var(--ink-soft); transform: translateX(-50%); white-space: nowrap; }
.tick.first { transform: none; }
.tick.last { transform: translateX(-100%); }
.ann { position: absolute; top: ${LABEL_TOP}px; opacity: 0; white-space: nowrap; }
.ann b { display: block; font-size: 56px; line-height: 60px; font-weight: 700; }
.ann span { display: block; font-size: 36px; line-height: 44px; color: var(--ink-soft); }
#peak { right: ${f1(1080 - (Number(wallX) - 14))}px; text-align: right; }
#drop { left: ${f1(Number(wallX) + 16)}px; }
#drop b { color: var(--indigo-500); }
#wall { position: absolute; left: ${f1(Number(wallX) - 2)}px; top: ${LABEL_TOP - 6}px; width: 4px; height: ${BASE - LABEL_TOP + 6}px; }
`;

  const body = `
${kicker(w.kicker)}
<h1 class="hl" id="hq">${h('When do most 500s finish?')}</h1>
<div class="hl" id="ha"><p class="big"><span>${peak.minute}</span> minutes</p><p class="dek">is the most common finish time</p></div>
<h2 class="hl" id="hc">${h(w.question)}</h2>
<div class="baseline"></div>
${bars}
${ticks}
<svg id="wall" viewBox="0 0 4 ${BASE - LABEL_TOP + 6}" preserveAspectRatio="none"><line x1="2" y1="0" x2="2" y2="${BASE - LABEL_TOP + 6}" stroke="#2b3445" stroke-width="4" stroke-dasharray="12 9"/></svg>
<div class="ann" id="peak"><b>${peak.minute} min</b><span>${fmtInt(peak.results)} results</span></div>
<div class="ann" id="drop"><b>${fmtSignedPct(w.dropPct)}</b><span>at the hour</span></div>
${sourceLine(c.source)}
`;

  const script = `
const CONTEXT = '#dfe3ea', CORAL = '#ec726f';
const all = DATA.minutes.map(m => '#b' + m);
const hot = DATA.hot.map(m => '#b' + m);
const behind = DATA.minutes.filter(m => m >= 60).map(m => '#b' + m);

// 0.25–3.6 s: bars build left to right.
tl.fromTo(all, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: 'power3.out', stagger: 0.068 }, 0.25);

// 3.9 s: the run-up to the hour lights up; the answer replaces the question.
tl.fromTo(hot, { backgroundColor: CONTEXT }, { backgroundColor: CORAL, duration: 0.3, ease: 'power1.out', stagger: 0.06, immediateRender: false }, 3.9);
tl.fromTo('#hq', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 4.0);
tl.fromTo('#ha', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 4.3);
tl.fromTo('#peak', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, 4.45);

// 5.6 s: the wall drops at 60:00; the bars behind it flinch; the drop lands.
tl.fromTo('#wall', { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.35, ease: 'power3.in' }, 5.6);
tl.to(behind, { scaleY: 0.955, duration: 0.12, ease: 'power2.in', stagger: 0.012 }, 5.95);
tl.to(behind, { scaleY: 1, duration: 0.4, ease: 'back.out(2.2)', stagger: 0.012 }, 6.07);
tl.fromTo('#drop', { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, 6.1);

// 8.6 s: the question to the viewer.
tl.fromTo('#ha', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 8.6);
tl.fromTo('#hc', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, 8.9);

// 10.9–11.8 s: unwind to the opening frame.
tl.fromTo('#hc', { opacity: 1, y: 0 }, { opacity: 0, y: -40, duration: 0.35, ease: 'power2.in', immediateRender: false }, 10.9);
tl.fromTo(['#peak', '#drop', '#wall'], { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in', immediateRender: false }, 10.9);
tl.fromTo(hot, { backgroundColor: CORAL }, { backgroundColor: CONTEXT, duration: 0.3, immediateRender: false }, 10.95);
tl.to([...all].reverse(), { scaleY: 0, duration: 0.4, ease: 'power2.in', stagger: 0.008 }, 11.0);
tl.fromTo('#hq', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', immediateRender: false }, 11.3);
`;

  const duration = 12;
  return {
    key: 'wall-reel',
    label: 'Reel: the 59-minute wall (12 s loop)',
    caption: `${peak.minute} minutes is the most common finish time for a solo 500 on MySpeedPuzzling. Then the hour hits: ${fmtInt(w.at59)} results at 59 minutes, ${fmtInt(w.at60)} at 60, a ${Math.abs(w.dropPct)}% drop. There is no such step at 45 or 50 minutes. Which side of the wall is your PB?\n\n#speedpuzzling #jigsawpuzzle #500pieces`,
    duration,
    coverAt: 7.6,
    qaAt: [0, 2.2, 5.0, 7.6, 10.2, 11.95],
    html: composition({ id: 'wall-reel', title: 'wall-reel', duration, css, body, data: { minutes: hist.map(b => b.minute), hot }, script }),
    assets: {},
  };
}
