// "Which is faster?" quiz (weekend interactive slot), in the house style (HOUSE = H4, src/design/house.ts).
// Three slides for 2–4 contenders of the same size:
//   1 the question: the boxes fanned out like postcards on the poster cover, each credited (puzzle · brand);
//   2 the answer: a timing board of median solo times + a "photo finish" strip (dots on a zoomed time axis: a dot
//     plot, not bars, so the axis may start near the times);
//   3 the twist: fastest single solves and the most-solved contender, then the question to the community.
// Every number comes from the facts snapshot passed in (a fresh query on the day); nothing is typed into copy.
import { CW, X0, artCover, clock, f1, slide, type SlideCtx, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';

export interface Contender {
  puzzle: string;
  brand: string;
  pieces: number;
  /** Local URL of the box image (fetchBoxes). */
  img: string;
  /** Short name used in headlines ("Paris"). */
  short: string;
  solvers: number;
  soloResults: number;
  medianS: number;
  fastestS: number;
}

export interface FasterSpec {
  key: string;
  /** Kicker of every slide, e.g. "Which is faster?". */
  kicker: string;
  /** The question on the cover, e.g. "Three postcards. Which one do puzzlers finish fastest?". */
  question: string;
  /** What the contenders are, for the answer slide's dek ("500-piece postcards"). */
  what: string;
  /** Footer source line (date of the fresh query). */
  src: string;
  /** The closing question. */
  ask: string;
  contenders: Contender[];
}

const sec = (s: number) => fmtDuration(s / 60);
/** "4 seconds" / "1:52". */
const gapText = (s: number) => (s < 60 ? `${s} second${s === 1 ? '' : 's'}` : sec(s));

const CSS = `<style>
.fq-card { position: absolute; background: #ffffff; padding: 12px; border-radius: 6px; box-shadow: 0 22px 44px -14px rgba(10, 14, 24, 0.6); }
.fq-card img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 2px; }
.fq-lab { position: absolute; }
.fq-lab .city { font-size: 46px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.fq-lab .full { font-size: 30px; line-height: 1.25; color: var(--g-soft); margin-top: 4px; }
.fq-thumb { flex: none; width: 150px; height: 112px; margin-right: 26px; background: #ffffff; padding: 6px; border-radius: 4px; }
.fq-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.fq-who { flex: 1; min-width: 0; }
.fq-who .city { font-size: 42px; font-weight: 700; line-height: 1.1; color: var(--g-ink); }
.fq-who .sub { font-size: 30px; line-height: 1.25; color: var(--g-soft); margin-top: 4px; }
.fq-time { width: 210px; text-align: right; font-size: 56px; font-weight: 700; color: var(--g-ink); }
.fq-gap { width: 180px; text-align: right; font-size: 34px; color: var(--g-soft); }
.h-br.hot .fq-time { color: var(--g-hot); }
</style>`;

export function fasterSlides(v: Variant, s: FasterSpec): string[] {
  const byMedian = [...s.contenders].sort((a, b) => a.medianS - b.medianS);
  const byFastest = [...s.contenders].sort((a, b) => a.fastestS - b.fastestS);
  const win = byMedian[0], second = byMedian[1], last = byMedian[byMedian.length - 1];
  const mostSolved = [...s.contenders].sort((a, b) => b.solvers - a.solvers)[0];
  const n = 3;
  const ctx = (i: number): SlideCtx => ({ v, post: s.key, slide: i, of: n });

  // 1 · the question: postcards fanned out, tilted, overlapping a little; labels in equal columns under them.
  const q = artCover(ctx(1), {
    kicker: `${s.kicker} · median solo time`, title: s.question, src: 'Swipe for the answer',
    art: band => {
      const k = s.contenders.length;
      const colW = CW / k;
      const cardW = Math.min(400, colW + 90), aspect = 0.735;
      const cardH = cardW * aspect;
      const LAB = 170;
      const block = cardH + 46 + LAB;
      const top = band.top + Math.max(0, (band.bottom - band.top - block) / 2);
      const tilt = (i: number) => (k === 1 ? 0 : -6 + (12 * i) / (k - 1));
      return CSS + s.contenders.map((c, i) => {
        const cx = X0 + colW * (i + 0.5);
        return `<div class="fq-card" style="left:${f1(cx - cardW / 2)}px; top:${f1(top + (i % 2) * 14)}px; width:${f1(cardW)}px; height:${f1(cardH)}px; transform:rotate(${f1(tilt(i))}deg); z-index:${i + 1}"><img src="${c.img}" alt=""></div>
        <div class="fq-lab" style="left:${f1(X0 + colW * i + 8)}px; width:${f1(colW - 16)}px; top:${f1(top + cardH + 46)}px; text-align:center">
          <p class="city">${h(c.short)}</p><p class="full">${h(c.puzzle)}</p><p class="full" style="margin-top:0">${h(c.brand)}</p></div>`;
      }).join('');
    },
  });

  // 2 · the answer: timing board + photo-finish strip.
  const rowH = 140, boardTop = 440;
  const span = [Math.floor((win.medianS - 15) / 30) * 30, Math.ceil((last.medianS + 15) / 30) * 30];
  const ax = (t: number) => ((t - span[0]) / (span[1] - span[0])) * CW;
  const ticks: number[] = [];
  for (let t = span[0]; t <= span[1]; t += 30) ticks.push(t);
  const stripTop = boardTop + 60 + rowH * byMedian.length + 40;
  const AXIS = 76;
  const strip = `<svg width="${CW}" height="176" style="position:absolute; left:${X0}px; top:${stripTop + 30}px" aria-hidden="true">
    <line x1="0" x2="${CW}" y1="${AXIS}" y2="${AXIS}" stroke="var(--g-rule)" stroke-width="3"/>
    ${ticks.map(t => `<line x1="${f1(ax(t))}" x2="${f1(ax(t))}" y1="${AXIS - 10}" y2="${AXIS + 10}" stroke="var(--g-rule)" stroke-width="3"/>
      <text class="c-lab" x="${f1(ax(t))}" y="${AXIS + 50}" text-anchor="${t === span[0] ? 'start' : t === span[1] ? 'end' : 'middle'}">${sec(t)}</text>`).join('')}
    ${byMedian.map((c, i) => `<circle cx="${f1(ax(c.medianS))}" cy="${AXIS}" r="${i === 0 ? 16 : 12}" fill="${i === 0 ? 'var(--c-hot)' : 'var(--g-ink)'}" stroke="var(--g-bg)" stroke-width="4"/>`).join('')}
    ${byMedian.map((c, i) => {
      // Labels alternate above the axis and to the side, so two dots seconds apart don't collide.
      const x = ax(c.medianS), up = i % 2 === 0;
      const anchor = x > CW - 160 ? 'end' : x < 160 ? 'start' : 'middle';
      return `<text class="${i === 0 ? 'c-lab-b' : 'c-lab'}" x="${f1(x)}" y="${up ? AXIS - 34 : AXIS + 92}" text-anchor="${anchor}">${h(c.short)}</text>`;
    }).join('')}
  </svg>`;
  const a = slide(ctx(2), 'data', {
    kicker: `${s.kicker} · the answer`, src: s.src, title: `${win.short}, by ${gapText(second.medianS - win.medianS)}.`, body: CSS + `
      <p class="h-abs h-dek" style="top:268px">Median solo time on MySpeedPuzzling, ${h(s.what)}. Half of all solo times on each puzzle are faster.</p>
      <div class="h-board" style="top:${boardTop}px">
        <div class="h-bh"><span style="width:76px">#</span><span style="flex:1">Puzzle</span><span style="width:210px; text-align:right">Median</span><span style="width:180px; text-align:right">Behind</span></div>
        ${byMedian.map((c, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:${rowH}px">
          <span class="rk">${String(i + 1).padStart(2, '0')}</span>
          <span class="fq-thumb" style="width:136px; height:100px"><img src="${c.img}" alt=""></span>
          <div class="fq-who"><p class="city">${h(c.short)}</p><p class="sub">${fmtInt(c.solvers)} puzzlers</p></div>
          <span class="fq-time">${clock(sec(c.medianS))}</span>
          <span class="fq-gap">${i === 0 ? '' : `+${clock(sec(c.medianS - win.medianS))}`}</span></div>`).join('')}
      </div>
      <p class="h-abs h-cap" style="top:${stripTop}px">Photo finish</p>
      ${strip}`,
  }).html;

  // 3 · the twist: fastest single solves, the most-solved contender, the question.
  const t = slide(ctx(3), 'data', {
    kicker: `${s.kicker} · fastest solves`, src: s.src,
    title: byFastest[0] === win ? `${win.short} also has the fastest single solve: ${sec(win.fastestS)}.` : `But the fastest single solve is ${byFastest[0].short}'s: ${sec(byFastest[0].fastestS)}.`,
    body: CSS + `
      <div class="h-board" style="top:370px">
        <div class="h-bh"><span style="width:76px">#</span><span style="flex:1">Fastest solo solve</span><span style="width:210px; text-align:right">Time</span></div>
        ${byFastest.map((c, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:132px">
          <span class="rk">${String(i + 1).padStart(2, '0')}</span>
          <span class="fq-thumb" style="width:124px; height:92px"><img src="${c.img}" alt=""></span>
          <div class="fq-who"><p class="city">${h(c.short)}</p><p class="sub">${fmtInt(c.soloResults)} solo times</p></div>
          <span class="fq-time">${clock(sec(c.fastestS))}</span></div>`).join('')}
      </div>
      <div class="h-abs h-strip" style="top:${370 + 60 + 132 * byFastest.length + 34}px">
        <div><p class="k">Most solved</p><p class="v">${h(mostSolved.short)}</p></div>
        <div><p class="k">Puzzlers</p><p class="v">${fmtInt(mostSolved.solvers)}</p></div>
      </div>
      <p class="h-abs h-ask" style="top:${370 + 60 + 132 * byFastest.length + 34 + 146}px">${h(s.ask)}</p>`,
  }).html;

  return [q, a, t];
}

/** Alt text per slide, from the same facts. */
export function fasterAlt(s: FasterSpec): string[] {
  const byMedian = [...s.contenders].sort((a, b) => a.medianS - b.medianS);
  const byFastest = [...s.contenders].sort((a, b) => a.fastestS - b.fastestS);
  const win = byMedian[0];
  const list = (cs: Contender[], key: 'medianS' | 'fastestS') => cs.map(c => `${c.puzzle} ${sec(c[key])}`).join(', ');
  const most = [...s.contenders].sort((a, b) => b.solvers - a.solvers)[0];
  return [
    `Quiz: ${s.contenders.map(c => `${c.puzzle} by ${c.brand}`).join(', ')}, shown as tilted postcards. ${s.question}`,
    `Answer: median solo times on MySpeedPuzzling, ${s.what}: ${list(byMedian, 'medianS')}. ${win.puzzle} is fastest, ${byMedian[1].medianS - win.medianS} seconds ahead of ${byMedian[1].puzzle}. A photo-finish strip places the three medians on one time axis.`,
    `Fastest single solo solves: ${list(byFastest, 'fastestS')}. Most solved: ${most.puzzle}, by ${fmtInt(most.solvers)} puzzlers. ${s.ask}`,
  ];
}

