// DL4 · Stories in the house system: the six D9 chapters (D9-1/D9-5 lineage, "great" per the owner) as 9:16 frames.
// Every chapter takes the variant's ground for role 'story' (house.ts rotates navy, sky, coral, indigo, ocean, deep
// navy per chapter); the header device is the variant's (H3: the strip of interlocking pieces that fills in, the D9
// marker; H1/H2: the piece + "n / 6"). All text stays in the Story safe area (y 270–1540, house STORY rows); a tonal
// floor of generator pieces sits below y 1630, under the reply bar. Colours only via the ground tokens.
import { assignUnits, barGeometry, flagUrl, pieceGrid, rankGeometry } from '../../../src/design/svg.ts';
import { CW, STORY, W, X0, f1, hero, heroFit, slide, type SlideCtx, type Variant } from '../../../src/design/house.ts';
import { fmtDuration, fmtInt, escapeHtml as h } from '../../../src/design/page.ts';
import { generateJigsaw } from '../../../src/pieces/jigsaw.ts';
import type { Content } from '../content.ts';
import type { Family, Post } from '../types.ts';
import { pieceRing, post } from './data.ts';

const TOP = STORY.contentTop; // 400

/** Story-only components (proposed for house.ts): chapter stat rows, ranking rows, the poll-sticker gap, centred copy. */
const STORY_CSS = `<style>
.s-stats { position: absolute; left: ${X0}px; width: ${CW}px; }
.s-stats > div { display: flex; align-items: baseline; gap: 24px; padding: 20px 0; border-top: 2px solid var(--g-rule); }
.s-stats b { font-size: 72px; font-weight: 700; line-height: 1; letter-spacing: -0.01em; color: var(--g-ink); }
.s-stats span { font-size: 38px; color: var(--g-soft); }
.s-rk { position: absolute; left: 0; width: ${CW}px; display: flex; align-items: center; }
.s-rk img { display: block; flex: none; width: 56px; height: 56px; }
.s-rk .nm { width: 330px; margin-left: 22px; font-size: 40px; font-weight: 500; color: var(--g-ink); }
.s-rk .val { width: 160px; text-align: right; font-size: 40px; font-weight: 700; color: var(--g-ink); }
.s-rk .bar { height: 30px; margin-left: 26px; border-radius: 0 8px 8px 0; background: var(--c-context); }
.s-rk.first img { width: 84px; height: 84px; }
.s-rk.first .nm { width: 302px; font-size: 54px; font-weight: 700; }
.s-rk.first .val { font-size: 54px; }
.s-rk.first .bar { height: 44px; background: var(--c-hot); }
.s-sticker { position: absolute; left: ${X0 + 92}px; width: ${CW - 184}px; border: 4px dashed var(--g-rule); border-radius: 36px; }
.s-c { position: absolute; left: ${X0}px; width: ${CW}px; text-align: center; }
</style>`;

/** Tonal jigsaw floor under the reply bar (below y 1630): ground-tone pieces separated by the ground colour. */
function floor(seed: number): string {
  const S = 300, cols = 5, rows = 2;
  const jig = generateJigsaw({ cols, rows, width: S * cols, height: S * rows, seed, tabSize: 0.22, jitter: 0.04, x: -210, y: 0 });
  return `<svg width="${W}" height="${1920 - 1630}" style="position:absolute; left:0; top:1630px" aria-hidden="true">
    ${jig.pieces.map(p => `<path d="${p.d}" fill="var(--g-band)" stroke="var(--g-bg)" stroke-width="12" stroke-linejoin="round"/>`).join('')}</svg>`;
}

/**
 * One chapter: the variant's story frame with the floor and the chapter name in the kicker. The strip device (H3)
 * already shows which chapter this is, so there the kicker is the name alone (and the wide strip leaves no room).
 */
const chapter = (x: SlideCtx, name: string, body: string, src: string) =>
  slide(x, 'story', { kind: 'story', kicker: x.v.device === 'strip' ? name : `Chapter ${x.slide} · ${name}`, src, body: STORY_CSS + floor(30 + x.slide) + body }).html;

function stories(c: Content, v: Variant): Post {
  const d = c.dl1;
  const src = c.source;

  // 1 · The count (D9-1/D9-5): the all-time results as the hero, four totals as chapter stat rows.
  const ch1 = (x: SlideCtx) => {
    const t = d.totals, v1 = fmtInt(t.results);
    const size = heroFit(v1, 230), base = TOP + 156 + size * 0.72;
    return chapter(x, 'The count', `
      <h1 class="h-title" style="top:${TOP + 30}px; font-size:64px">Speed puzzlers have logged</h1>
      ${hero(v1, { size, baseline: base, hot: true })}
      <p class="h-lead h-abs" style="top:${f1(base + 56)}px">results on MySpeedPuzzling</p>
      <div class="s-stats" style="top:${f1(base + 150)}px">
        <div><b>${fmtInt(t.players)}</b><span>puzzlers</span></div>
        <div><b>${fmtInt(t.countries)}</b><span>countries</span></div>
        <div><b>${fmtInt(t.hours)}</b><span>hours on the clock</span></div>
        <div><b>${fmtInt(t.pieces)}</b><span>pieces</span></div>
      </div>`, src);
  };

  // 2 · The wall: the histogram, the question and room for a poll sticker.
  const ch2 = (x: SlideCtx) => {
    const w = d.wall;
    const isWall = (m: number) => m >= w.mode.minute - 3 && m <= 59;
    const H = 320, top = 736;
    const g = barGeometry(w.histogram, { x: q => q.minute, y: q => q.results, width: CW, height: H, padding: 0.22 });
    const bars = g.bars.map(b => `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.width)}" height="${f1(b.height)}" fill="${isWall(b.datum.minute) ? 'var(--c-hot)' : 'var(--c-base)'}"/>`).join('');
    const band = (m: number) => g.xScale(String(m))! + g.xScale.bandwidth() / 2;
    const modeBar = g.bars.find(b => b.datum.minute === w.mode.minute)!;
    const wallStart = g.bars.find(b => isWall(b.datum.minute))!;
    const line60 = g.xScale('60')! - (g.xScale.step() - g.xScale.bandwidth()) / 2;
    const ticks = [40, 50, 60, 70, 80].map(m => `<text class="${m === 60 ? 'c-lab-b' : 'c-lab'}" x="${f1(band(m))}" y="${H + 46}" text-anchor="${m === 40 ? 'start' : m === 80 ? 'end' : 'middle'}">${m === 80 ? '80 min' : m}</text>`).join('');
    return chapter(x, 'The wall', `
      <h1 class="h-title xl" style="top:${TOP + 20}px">${h(w.title)}</h1>
      <p class="h-dek h-abs" style="top:${TOP + 130}px">${h(w.dek)}</p>
      <svg width="${CW}" height="${H + 60}" style="position:absolute; left:${X0}px; top:${top}px" aria-hidden="true">
        ${bars}
        <line x1="0" x2="${CW}" y1="${H}" y2="${H}" stroke="var(--g-ink)" stroke-width="3"/>
        <line x1="${f1(line60)}" x2="${f1(line60)}" y1="-56" y2="${H}" stroke="var(--g-ink)" stroke-width="4" stroke-dasharray="10 9"/>
        <text class="c-lab-b" x="${f1(wallStart.x - 14)}" y="${f1(modeBar.y - 54)}" text-anchor="end">${w.mode.minute} min</text>
        <text class="c-lab" x="${f1(wallStart.x - 14)}" y="${f1(modeBar.y - 16)}" text-anchor="end">${fmtInt(w.mode.results)} results</text>
        <text class="c-hot-s" x="${f1(line60 + 18)}" y="${f1(modeBar.y - 30)}">${String(w.dropPct).replace('-', '−')}% at the hour</text>
        ${ticks}
      </svg>
      <div class="h-abs" style="top:1140px"><p class="h-ask">${h(w.question)}</p></div>
      <div class="s-sticker" style="top:1306px; height:114px" data-qa-ignore></div>`, src);
  };

  // 3 · The record: the fastest first try as the hero, then what it is and how it compares.
  const ch3 = (x: SlideCtx) => {
    const r = d.record;
    const size = heroFit(r.value, 320), base = TOP + 160 + size * 0.72;
    return chapter(x, 'The record', `
      <h1 class="h-title" style="top:${TOP + 30}px; font-size:64px">Fastest first try on a 500</h1>
      ${hero(r.value, { size, baseline: base, hot: true })}
      <p class="h-lead h-abs" style="top:${f1(base + 70)}px; font-weight:700">${h(r.title)}</p>
      <p class="h-dek h-abs" style="top:${f1(base + 230)}px; font-size:40px">${h(r.context)}</p>
      <p class="h-cap h-abs" style="top:${f1(base + 390)}px; text-transform:none; letter-spacing:0; font-size:36px; font-weight:700">${h(r.footnote)}</p>`, src);
  };

  // 4 · The fastest countries: ranked bars with flags, the leader large and hot.
  const ch4 = (x: SlideCtx) => {
    const k = d.countries;
    const [first, ...rest] = k.top;
    const rg = (list: typeof k.top, rowH: number, gap = 0) => rankGeometry(list, { value: q => q.medianPb, width: 280, rowHeight: rowH, gap, domain: [0, 70] });
    const rows = rg(rest, 52, 6), firstW = rg([first], 92)[0].width;
    const ref = [...k.reference].reverse().filter(r => r.value !== null).map(r => `${h(r.label)}: <b style="color:var(--g-ink)">${fmtDuration(r.value!)}</b>`).join(' · ');
    return chapter(x, 'The fastest countries', `
      <h1 class="h-title" style="top:${TOP + 20}px; font-size:72px">${h(k.title)}</h1>
      <p class="h-dek h-abs" style="top:${TOP + 200}px; font-size:34px">${h(k.dek)}</p>
      <div class="h-abs" style="top:716px">
        <div class="s-rk first" style="top:0; height:92px"><img src="${flagUrl(first.code)}" alt=""><span class="nm">${h(first.name)}</span><span class="val">${fmtDuration(first.medianPb)}</span><span class="bar" style="width:${f1(firstW)}px"></span></div>
        ${rows.map(r => `<div class="s-rk" style="top:${r.y + 112}px; height:52px"><img src="${flagUrl(r.datum.code)}" alt=""><span class="nm">${h(r.datum.name)}</span><span class="val">${fmtDuration(r.datum.medianPb)}</span><span class="bar" style="width:${f1(r.width)}px"></span></div>`).join('')}
      </div>
      <p class="h-lab h-abs" style="top:1366px">${ref}</p>`, src);
  };

  // 5 · The favourite size (D9-5): a 10×10 grid of real interlocking pieces, one per 1% of results.
  const ch5 = (x: SlideCtx) => {
    const s = d.share;
    const size = 600;
    const grid = pieceGrid({ cols: 10, rows: 10, x: 0, y: 0, width: size, height: size, seed: 21 });
    const colour: Record<string, string> = { '500': 'var(--c-hot)', 'under 500': 'var(--c-cool)', '1000': 'var(--c-context)', other: 'var(--c-base)' };
    const units = assignUnits(grid, s.units.map(u => ({ key: u.key, units: u.units })));
    return chapter(x, 'The favourite size', `
      <h1 class="h-title xl" style="top:${TOP + 20}px; font-size:80px">${h(s.title)}</h1>
      <svg width="${size}" height="${size}" viewBox="-6 -6 ${size + 12} ${size + 12}" style="position:absolute; left:${(W - size) / 2}px; top:640px" aria-hidden="true">
        ${units.map(u => `<path d="${u.piece.d}" fill="${colour[u.key]}" stroke="var(--g-bg)" stroke-width="4" stroke-linejoin="round"/>`).join('')}
      </svg>
      <div class="h-legend h-abs" style="top:1270px">${s.units.map(u => `<span><i class="h-sw" style="background:${colour[u.key]}"></i><b>${u.pct}%</b> ${h(s.labels[u.key])}</span>`).join('')}</div>`,
      `Each piece = 1% of ${fmtInt(d.totals.results)} results · ${c.asOf}`);
  };

  // 6 · The Level 50 club: the D5 round puzzle of generator pieces (not the rejected D2-8 medallion).
  const ch6 = (x: SlideCtx) => {
    const xp = d.xp;
    const club = xp.distribution.find(q => q.level === xp.level)?.players ?? 0;
    const cx = W / 2, cy = 770, rOut = 240, rIn = 140;
    const ring = pieceRing(Math.max(club, 3), cx, cy, rIn, rOut, 4);
    return chapter(x, 'The Level 50 club', `
      <h1 class="h-title" style="top:${TOP + 30}px; font-size:56px">${h(xp.kicker)}</h1>
      <svg width="${W}" height="1920" style="position:absolute; left:0; top:0" aria-hidden="true">
        ${ring.map(p => `<path d="${p}" fill="var(--c-hot)" stroke="var(--g-bg)" stroke-width="6" stroke-linejoin="round"/>`).join('')}
      </svg>
      <p class="h-cap" style="position:absolute; left:0; width:${W}px; text-align:center; top:${cy - 100}px; letter-spacing:0.3em; text-indent:0.3em">Level</p>
      ${hero(String(xp.level), { size: 170, baseline: cy + 70, center: true })}
      <p class="h-cap s-c" style="top:${cy + rOut + 24}px">1 piece = 1 puzzler at level ${xp.level}</p>
      <p class="s-c" style="top:${cy + rOut + 86}px; font-size:52px; font-weight:700; line-height:1.1; text-wrap:balance; color:var(--g-ink)">${h(xp.dek)}</p>
      <p class="h-body s-c" style="top:${cy + rOut + 216}px; text-wrap:balance">${h(xp.context)}</p>
      <p class="s-c" style="top:${cy + rOut + 330}px; font-size:48px; font-weight:700; color:var(--g-ink)">What level are you?</p>`, src);
  };

  return post(v, 'story-chapters', [ch1, ch2, ch3, ch4, ch5, ch6], 'story');
}

const family: Family = {
  id: 'stories',
  name: 'Stories (D9 chapters)',
  posts: (c, v) => [stories(c, v)],
};
export default family;
