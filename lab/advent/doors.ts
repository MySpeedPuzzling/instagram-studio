// AD1 · the daily door (quiz Story, 9:16) in four variants, plus the answer reveal (frame 1 of the next evening's set).
// No sticker on a door: people answer by replying to the Story (a DM), which the collector can read; a coral cue sits
// right above the reply field. Bands: key text y 200–1720 (story_dimensions_2026.md); the house Story footer carries
// the deadline next to myspeedpuzzling.com.
//   V1 Door poster    the H4 poster: a coral top piece with the door number, the quiz on the navy bottom piece;
//   V2 Calendar board navy board with the 6×4 Advent jigsaw (rows = weeks, columns = Mon–Sat), tonight's piece coral;
//   V3 Picture reveal the same jigsaw over a mystery box: every door opened shows one more piece of the picture;
//   V4 Box-led        the clue leads full width (boxes, crop, chart, cut), the day sits in the header index "7 / 24".
import { CW, GROUNDS, HOUSE, X0, f1, frame, groundVars, hero, heroFit, posterTopPath, seamReach, W } from '../../src/design/house.ts';
import { escapeHtml as h } from '../../src/design/page.ts';
import { AD_CSS, adventGrid, answerOf, doorSrc, finePrint, letterPiece, pieceStage, replyCue, stage, type Band } from './parts.ts';
import { dayDate, type Content, type NumberQuiz, type Quiz } from './content.ts';
import { garland, snowCap, snowDrift, snowfall } from './festive.ts';

export type VariantId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
export const VARIANT_INFO: Record<VariantId, { name: string; idea: string }> = {
  V1: { name: 'Door poster', idea: 'The H4 poster on every door: a coral top piece carries the door number (7 of 24), one real jigsaw cut, and the quiz on the deep-navy bottom. Loud and instantly recognisable in the Story tray; the number is the device.' },
  V2: { name: 'Calendar board', idea: 'The H1 navy board with the Advent puzzle on top: 24 generator pieces, one row per week, one column per day (Mon–Sat). Opened doors fill in grey, tonight\'s piece is coral. Reads as a calendar at a glance and shows progress through the campaign.' },
  V3: { name: 'Picture reveal', idea: 'The same 24-piece jigsaw over a mystery box image: each opened door shows one more piece of the picture, so followers watch it complete. Day 24 asks which puzzle it is. The strongest "come back tomorrow" hook; the quiz itself gets less room.' },
  V5: { name: 'Calendar board, festive', idea: 'V2 with a quiet Christmas layer (owner\'s idea): the header rule becomes a string of fairy lights whose bulbs are small generator puzzle pieces (coral, white, sky, softly glowing), a little snow falls in the header, snow rests on the calendar, and a soft drift fills the bottom strip. No clip art, no green; the quiz below stays exactly as V2.' },
  V4: { name: 'Box-led', idea: 'The clue leads at full width (box cards, the crop, the chart, the cut), the day sits quietly in the house header index ("7 / 24"). Closest to the published "Which is faster?" post; the most room for data and box images.' },
};

const CUE_TOP = 1400, FINE_TOP = 1562, BAND_BOTTOM = 1376;
const kick = (q: Quiz) => `Advent of Puzzle · ${q.kicker}`;

/** Puts a stage in a band, centred vertically in whatever room it leaves. */
function placed(q: Quiz, band: Band, size: 'large' | 'compact', fit?: number) {
  const first = stage(q, band, size, fit);
  if (first.end > band.bottom + 2) console.warn(`  layout: day ${q.day} ${q.key} (${size}) ends at ${Math.round(first.end)} > ${band.bottom}`);
  const spare = Math.max(0, band.bottom - first.end);
  return spare > 8 && q.kind !== 'number' ? stage(q, { top: Math.round(band.top + spare / 2), bottom: band.bottom }, size, fit) : first;
}
const question = (q: Quiz, top: number, px = 56) => `<h1 class="ad-q" style="top:${top}px; font-size:${px}px">${h(q.question)}</h1>`;
const qHeight = (q: Quiz, px = 56) => Math.ceil((q.question.length * 0.56 * px) / CW) * px * 1.1;
const bottomBits = (q: Quiz) => replyCue(q.reply, CUE_TOP) + finePrint(q, FINE_TOP);
const storyFrame = (ground: 'navy', q: Quiz, body: string, extra: Partial<Parameters<typeof frame>[0]> = {}) =>
  frame({ ground, kind: 'story', kicker: kick(q), device: 'piece', src: doorSrc(q), body: `<style>${AD_CSS}</style>${body}`, ...extra });

export function door(v: VariantId, q: Quiz, c: Content): string {
  const boxQuiz = q.kind === 'choice' && q.options.every(o => o.box);
  if (v === 'V1') {
    const size = boxQuiz ? 'large' : 'compact';
    const probe = stage(q, { top: 0, bottom: 2000 }, size);
    const below = Math.max(96, Math.round(seamReach().down) + 20);
    const qh = qHeight(q);
    const seam = Math.round(Math.max(600, Math.min(700, BAND_BOTTOM - probe.end - qh - 40 - below)));
    const fit = BAND_BOTTOM - (seam + below + qh + 34);
    const top = GROUNDS.coral, base = GROUNDS.navy;
    const baseline = seam - Math.max(112, Math.round(seamReach().up) + 22);
    const size0 = Math.min(heroFit(String(q.day) + '   ', 300), Math.floor((baseline - 300) / 0.72));
    const date = `<p class="h-cap" style="position:absolute; right:${W - 992}px; top:${baseline - 150}px; text-align:right">${h(dayDate(q.day))}</p>
      <p class="h-body" style="position:absolute; right:${W - 992}px; top:${baseline - 92}px; text-align:right; color:var(--g-ink)">Week ${q.week} · draw on Sunday</p>`;
    const heroHtml = `<div style="${groundVars(top)}" data-qa-bg="${top.bg}">${hero(String(q.day), { size: size0, baseline, unit: 'of 24' })}${date}</div>`;
    const under = `<svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(seam)}" fill="${top.bg}"/></svg>${heroHtml}`;
    const qTop = seam + below;
    const st = placed(q, { top: qTop + qh + 34, bottom: BAND_BOTTOM }, size, fit);
    return frame({ ground: base.key, kind: 'story', kicker: kick(q), device: 'piece', src: doorSrc(q), under, noRule: true, headGround: top.key,
      body: `<style>${AD_CSS}</style>${question(q, qTop)}${st.html}${bottomBits(q)}` });
  }
  if (v === 'V2') {
    const gy = 384, gh = 380;
    const grid = adventGrid({ x: X0, y: gy, w: CW, h: gh, day: q.day, mode: 'calendar', weekdays: true });
    const qTop = gy + gh + 40, qh = qHeight(q, 52);
    const st = placed(q, { top: qTop + qh + 30, bottom: BAND_BOTTOM }, 'compact');
    return storyFrame('navy', q, grid + question(q, qTop, 52) + st.html + bottomBits(q), { kicker: `Advent of Puzzle · Day ${q.day} of 24` });
  }
  if (v === 'V5') {
    const gy = 432, gh = 352;
    const grid = adventGrid({ x: X0, y: gy, w: CW, h: gh, day: q.day, mode: 'calendar', weekdays: true });
    const qTop = gy + gh + 40, qh = qHeight(q, 52);
    const st = placed(q, { top: qTop + qh + 30, bottom: BAND_BOTTOM }, 'compact');
    const under = snowfall({ until: 420, count: 60, seed: q.day }) + snowDrift({ seed: q.day }) + garland({ top: 296, sag: 20, seed: q.day });
    return storyFrame('navy', q, grid + snowCap({ x: X0, y: gy, w: CW, seed: q.day }) + question(q, qTop, 52) + st.html + bottomBits(q),
      { kicker: `Advent of Puzzle · Day ${q.day} of 24`, noRule: true, under });
  }
  if (v === 'V3') {
    const gw = 600, gh = Math.round(gw / c.mystery.ratio), gy = 322;
    const grid = adventGrid({ x: X0 + (CW - gw) / 2, y: gy, w: gw, h: gh, day: q.day, mode: 'reveal', img: c.mystery.img, id: `rv${q.day}` });
    const credit = `<p class="ad-credit" style="top:${gy + gh + 14}px">Mystery puzzle · ${h(c.mystery.brand)} · one more piece every evening</p>`;
    const qTop = gy + gh + 74, qh = qHeight(q, 52);
    const st = placed(q, { top: qTop + qh + 26, bottom: BAND_BOTTOM }, 'compact');
    return storyFrame('navy', q, grid + credit + question(q, qTop, 52) + st.html + bottomBits(q), { kicker: `Advent of Puzzle · Day ${q.day} of 24` });
  }
  // V4
  const qh = qHeight(q);
  const st = placed(q, { top: 330 + qh + 36, bottom: BAND_BOTTOM }, 'large');
  return storyFrame('navy', q, question(q, 330) + st.html + bottomBits(q), { idx: [q.day, 24], kicker: `Advent · ${q.kicker}` });
}

// ------------------------------------------------------------------ the answer reveal

const SAMPLE = { right: 58, answers: 412 };

function revealChart(q: NumberQuiz, top: number): string {
  const H = 380, n = q.bars.length + 1, gap = 34, bw = (CW - gap * (n - 1)) / n;
  const all = [...q.bars, q.hidden], max = Math.max(...all.map(b => b.value)) * 1.08;
  const y = (v: number) => H - (v / max) * H;
  return `<p class="h-cap h-abs" style="top:${top}px">Median solo time, minutes</p>
  <svg width="${CW}" height="${H + 60}" style="position:absolute; left:${X0}px; top:${top + 56}px" aria-hidden="true">
    <line x1="0" x2="${CW}" y1="${H}" y2="${H}" stroke="var(--g-rule)" stroke-width="3"/>
    ${all.map((b, i) => { const x = i * (bw + gap), last = i === all.length - 1; return `<rect x="${f1(x)}" y="${f1(y(b.value))}" width="${f1(bw)}" height="${f1(H - y(b.value))}" fill="${last ? 'var(--c-hot)' : 'var(--c-base)'}"/>
      <text class="${last ? 'c-hot-s' : 'c-lab-b'}" x="${f1(x + bw / 2)}" y="${f1(y(b.value) - 18)}" text-anchor="middle">${b.value}</text>
      <text class="c-lab" x="${f1(x + bw / 2)}" y="${H + 46}" text-anchor="middle">${b.label}</text>`; }).join('')}</svg>`;
}

/** Next evening, frame 1 of the set: yesterday's answer with the numbers, the box named and credited. */
export function reveal(q: Quiz): string {
  const title = `<h1 class="ad-q" style="top:330px; font-size:60px">${h(q.reveal.title)}</h1>`;
  const tH = Math.ceil((q.reveal.title.length * 0.56 * 60) / CW) * 66;
  let top = 330 + tH + 44;
  let vis = '';
  if (q.kind === 'number') { vis = revealChart(q, top); top += 500; }
  else if (q.kind === 'piece') { const p = pieceStage(q, top, { layout: 'row', w: 500, reveal: true }); vis = p.html; top = p.end; }
  else {
    const b = q.reveal.box!;
    const cw = 400, ch = cw / b.ratio;
    vis = `<div class="ad-card" style="left:${X0}px; top:${top}px; width:${cw}px; height:${f1(ch)}px"><img src="${b.img}" alt=""></div>
      <div class="h-abs" style="left:${X0 + cw + 40}px; width:${CW - cw - 40}px; top:${top}px">
        <p class="h-cap">The answer</p><p style="font-size:44px; font-weight:700; line-height:1.12; margin-top:10px">${h(b.puzzle)}</p>
        <p class="h-body" style="margin-top:8px">${h(b.brand)} · ${b.pieces} pieces</p></div>`;
    top += Math.max(ch, 260) + 40;
  }
  const lines = q.kind === 'piece' ? q.reveal.lines.slice(0, 2) : q.reveal.lines;
  const rows = lines.map((l, i) => `<div class="ad-row" style="top:${top + i * 82}px; height:82px"><div class="nm"><p style="font-size:38px; font-weight:${i === 0 ? 700 : 500}">${h(l)}</p></div></div>`).join('');
  top += lines.length * 82 + 40;
  const letter = answerOf(q);
  const strip = `<div class="h-abs" style="top:${top}px; display:flex; align-items:center; gap:28px">
      ${letter ? letterPiece(letter, 96, { hot: true }) : ''}
      <div><p style="font-size:44px; font-weight:700">${letter ? `Answer ${letter}` : `Answer ${(q as NumberQuiz).hidden.value} min`}</p>
      <p class="h-body">Sample: ${SAMPLE.right}% of ${SAMPLE.answers} answers were right</p></div></div>
    <div style="position:absolute; left:${X0}px; top:${top + 130}px; width:${CW}px; height:22px; background:var(--g-band); border-radius:11px"><div style="width:${SAMPLE.right}%; height:100%; background:var(--c-hot); border-radius:11px"></div></div>`;
  const next = `<p class="h-lead h-abs" style="top:${Math.max(top + 180, 1480)}px; text-align:center">Tap for tonight's door: day ${q.day + 1}</p>`;
  return frame({ ground: 'navy', kind: 'story', kicker: `Day ${q.day} · the answer`, device: 'piece', src: `Day ${q.day} of 24 · ${q.answerSrc ?? q.src}`, body: `<style>${AD_CSS}</style>${title}${vis}${rows}${strip}${next}` });
}

export const ACTIVE = HOUSE;
