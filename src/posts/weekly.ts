// The Weekly Numbers (Monday recap), in the house style (HOUSE = H4, src/design/house.ts). Promoted from the DL4 lab
// post, rebuilt around the owner's list (2026-10-18): most-solved puzzle, fastest solo/pairs/teams, most solves,
// a random shoutout draw, a fact of the week. A post is a list of segments, so release candidates differ only in
// which segments they carry and in what order:
//   cover     poster: solves finished, puzzlers, week on week;
//   top       the week's five most-solved puzzles, box images credited;
//   fast500 / fast1000   fastest solo (top 3), pair and team of the week, with the week's typical solo time;
//   active    most solves this week, solo / pairs / teams;
//   shout     three puzzlers drawn at random from everyone who solved something (seeded by the week, reproducible);
//   days      the week in hours: solves per day (busiest day hot), countries, puzzles; closes with the question
//             when there is no `close` segment;
//   close     personal bests, new puzzlers, pieces, and the question.
// Every number comes from the facts snapshot (fresh queries on Monday); nothing is typed into copy.
import { CW, FEED, GROUNDS, STICKER_STORY_ROWS, W, X0, clock, cover, f1, frame, groundVars, hero, heroFit, linesOf, posterTopPath, slide, type SlideCtx, type Variant } from '../design/house.ts';
import { flagUrl } from '../design/svg.ts';
import { escapeHtml as h, fmtDuration, fmtInt, fmtSignedPct } from '../design/page.ts';

export type Kind = 'solo' | 'duo' | 'team';
export type Segment = 'cover' | 'top' | 'fast500' | 'fast1000' | 'active' | 'shout' | 'days' | 'close';
export interface Person { id: string; name: string; country?: string; handle?: string }
export interface FastRow { kind: Kind; pieces: number; seconds: number; firstAttempt: boolean; puzzle: string; brand: string; people: Person[]; teamName?: string; /** Box image path (DB) and its local URL. */ image?: string; img?: string }
export interface ActiveRow { kind: Kind; people: Person[]; results: number; pieces: number; teamName?: string; /** Box of the puzzler's latest puzzle of the week. */ image?: string; img?: string }
export interface Shout { person: Person; results: number; /** The solve they're shown with: its time (if timed) and kind. */ seconds?: number; kind: Kind; puzzle: string; brand: string; pieces: number; img?: string }

export interface WeeklySpec {
  key: 'weekly';
  season: number;
  episode: number;
  segments: Segment[];
  question: string;
  weekStart: string;
  /** "5–11 Oct 2026". */
  range: string;
  src: string;
  results: number;
  resultsPrev: number;
  puzzlers: number;
  pieces: number;
  newPuzzlers: number;
  personalBests: number;
  days: Array<{ weekday: string; day: string; results: number }>;
  /** The week's median solo 500-piece time and the results it rests on. */
  median500s: number;
  solo500Results: number;
  top: Array<{ puzzle: string; brand: string; pieces: number; solvers: number; img: string }>;
  fast: FastRow[];
  active: ActiveRow[];
  shout: Shout[];
  /** Everyone the shoutout was drawn from. */
  poolSize: number;
  week: { hours: number; countries: number; puzzles: number; firstEver: number; added: number; biggest: { puzzle: string; brand: string; pieces: number; people: Person[]; seconds?: number; img?: string; avatar?: string }; firstAttemptPct: number };
}

const sec = (s: number) => fmtDuration(s / 60);
const pad2 = (n: number) => String(n).padStart(2, '0');
/** ISO week number of a Monday (YYYY-MM-DD): the week containing that year's 4 January is week 1. */
export function isoWeek(monday: string): number {
  const d = new Date(monday + 'T12:00:00Z');
  const thu = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 86_400_000);
  const jan1 = Date.UTC(thu.getUTCFullYear(), 0, 1);
  return 1 + Math.floor((thu.getTime() - jan1) / (7 * 86_400_000));
}
const KIND: Record<Kind, string> = { solo: 'Solo', duo: 'Pairs', team: 'Teams' };
const KIND_ONE: Record<Kind, string> = { solo: 'Solo', duo: 'In a pair', team: 'In a team' };
const sizeOf = (pieces: number) => fmtInt(pieces);
const andJoin = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} & ${xs.at(-1)}`);
const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return `${(/\s/.test(s[max - 1]) ? head : head.replace(/\s+\S*$/, '') || head).replace(/[\s,.:;·–-]+$/, '')}…`;
};
/** Top of the line under a slide title (62 px, line-height 1.1). */
const underTitle = (title: string) => Math.round(FEED.contentTop + linesOf(title, 62, CW, true) * 62 * 1.1 + 20);
/** A box thumbnail in a board row (an empty slot of the same size when the box image is embargoed or missing). */
const box = (img?: string) => (img ? `<span class="wk-thumb wk-box"><img src="${img}" alt=""></span>` : '<span class="wk-box"></span>');
/**
 * Who: every member, always (owner 2026-10-26: no "+2"). Flags separate the names, so no commas or "&" between them;
 * a member without a flag gets a comma in front. Groups wrap between people onto more lines (see nameLayout).
 */
const NAME_PX = 36, NAME_LH = 43, PERSON_GAP = 18;
const shortName = (p: Person, group: boolean) => cut(p.name, group ? 18 : 28);
const whoLine = (people: Person[]) => people.length < 2 ? people.map(p => `${flag(p)}${h(shortName(p, false))}`).join('')
  : people.map((p, i) => `<span class="wk-person">${i && !p.country ? ', ' : ''}${flag(p)}${h(shortName(p, true))}</span>`).join('');
/** Greedy line fill of whoLine in a name column `width` px wide: the line count and each member's line and x. */
function nameLayout(people: Person[], width: number): { lines: number; at: Array<{ line: number; x: number }> } {
  const at: Array<{ line: number; x: number }> = [];
  let line = 0, x = 0;
  for (const [i, p] of people.entries()) {
    const w = (p.country ? 50 : 0) + (i && !p.country ? 14 : 0) + shortName(p, people.length > 1).length * 0.6 * NAME_PX;
    if (x > 0 && x + w > width) { line++; x = 0; }
    at.push({ line, x });
    x += w + PERSON_GAP;
  }
  return { lines: line + 1, at };
}
// Name column widths: board width minus the box thumbnail and the time / count column.
const FAST_WHO_W = CW - 136 - 210 - 16, ACT_WHO_W = CW - 136 - 100 - 16, WHO_X = X0 + 136;
const flag = (p: Person) => (p.country ? `<img class="wk-flag" src="${flagUrl(p.country)}" alt="">` : '');
/** Display name of a group: the team's own name, else its members. */
const groupName = (r: { people: Person[]; teamName?: string }) => andJoin(r.people.map(p => p.name));
const weekday = (d: string) => ({ Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' } as Record<string, string>)[d] ?? d;

// Board geometry, shared by the slides and the photo tags so each tag sits on its puzzler's row.
const FAST_TOP = 262, SEC_H = 52, SEC_GAP = 28, FAST_ROW = 104, ACT_ROW = 98, SHOUT_ROW = 236;
const ACTIVE_TITLE = 'Most solves this week', ACTIVE_DEK = 'Puzzles finished last week; a pair or team counts only the same members playing together.';
const shoutDek = (s: WeeklySpec) => `${s.shout.length === 1 ? 'One puzzler' : `${s.shout.length === 2 ? 'Two' : 'Three'} puzzlers`}, drawn at random from all ${fmtInt(s.poolSize)} who finished a puzzle last week, pairs and teams included. Every solve counts.`;
/** Top of each board row (y), given each section's row heights. */
function rowTops(top: number, heights: number[][], gap = SEC_GAP): number[][] {
  let y = top;
  return heights.map((hs, si) => {
    y += (si ? gap : 0) + SEC_H;
    return hs.map(rh => (y += rh) - rh);
  });
}
/** Gap above each later section: SEC_GAP (owner 2026-10-26: room before a new category), shrunk only as far as needed
 *  (down to 8 px) so a board with wrapped names plus `below` px under it still ends above the footer. */
function secGap(top: number, heights: number[][], below = 0): number {
  if (heights.length < 2) return SEC_GAP;
  const used = heights.reduce((a, hs) => a + SEC_H + hs.reduce((b, x) => b + x, 0), 0);
  return Math.max(8, Math.min(SEC_GAP, Math.floor((FEED.contentBottom - top - below - used) / (heights.length - 1))));
}
const NOTE_H = 18 + 2 * 39;
const fastHeights = (s: WeeklySpec, pieces: number) => fastSections(s, pieces).map(x => x.rows.map(r => fastRowH(r.people)));
const fastNote = (s: WeeklySpec, pieces: number) => pieces === 500 && s.solo500Results >= 100;
const fastGap = (s: WeeklySpec, pieces: number) => secGap(FAST_TOP, fastHeights(s, pieces), fastNote(s, pieces) ? NOTE_H : 0);
const actHeights = (s: WeeklySpec) => activeSections(s).map(x => x.rows.map(g => actRowH(g.people)));
/** Row heights: one extra name line per wrapped line of members. */
const fastRowH = (people: Person[]) => FAST_ROW + (nameLayout(people, FAST_WHO_W).lines - 1) * NAME_LH;
const actRowH = (people: Person[]) => ACT_ROW + (nameLayout(people, ACT_WHO_W).lines - 1) * NAME_LH;
const fastSections = (s: WeeklySpec, pieces: number) => ([['solo', 3], ['duo', 1], ['team', 1]] as Array<[Kind, number]>)
  .map(([k, t]) => ({ k, rows: s.fast.filter(r => r.kind === k && r.pieces === pieces).slice(0, t) })).filter(x => x.rows.length);
const activeSections = (s: WeeklySpec) => (['solo', 'duo', 'team'] as Kind[])
  .map(k => ({ k, rows: activeGroups(s.active, k, k === 'solo' ? 3 : 1) })).filter(x => x.rows.length);
const activeTop = () => underTitle(ACTIVE_TITLE) + linesOf(ACTIVE_DEK, 38) * 50 + 30;
const shoutTop = (s: WeeklySpec, i: number) => underTitle('Shoutout draw') + linesOf(shoutDek(s), 38) * 50 + 44 + i * SHOUT_ROW;

/** A kind's top rows: puzzlers for solo, line-ups for pairs and teams (already one row each from SQL). */
function activeGroups(rows: ActiveRow[], kind: Kind, take: number): Array<{ people: Person[]; results: number; img?: string }> {
  return rows.filter(r => r.kind === kind).slice(0, take).map(r => ({ people: r.people, results: r.results, img: r.img }));
}

const CSS = `<style>
.wk-flag { display: inline-block; flex: none; width: 38px; height: 38px; margin-right: 12px; vertical-align: -7px; }
.h-br .who { flex: 1; min-width: 0; overflow: hidden; padding-right: 16px; }
.h-br .who .nm { font-size: 36px; font-weight: 600; line-height: 1.18; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-br.hot .who .nm { font-weight: 700; }
.h-br .who .ig { font-size: 30px; font-weight: 500; line-height: 1.2; color: var(--g-accent); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h-br .who .sub { margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wk-time { flex: none; width: 210px; text-align: right; font-size: 48px; font-weight: 700; color: var(--g-ink); }
.h-br.hot .wk-time { color: var(--g-hot); }
.wk-sec { display: flex; align-items: flex-end; box-sizing: border-box; height: 52px; padding-bottom: 8px; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); border-bottom: 2px solid var(--g-rule); }
.wk-sec span + span { margin-left: auto; }
.h-br .who .nm.group { white-space: normal; text-overflow: clip; }
.wk-person { display: inline-block; white-space: nowrap; margin-right: ${PERSON_GAP}px; }
.wk-thumb { flex: none; background: #ffffff; padding: 6px; border-radius: 4px; margin-right: 24px; box-shadow: 0 12px 26px -12px rgba(10, 14, 24, 0.6); }
.wk-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
/* Owner 2026-10-19: box images instead of ranks on people boards (the H4 house style drops the leader's accent bar). */
.wk-box { flex: none; width: 112px; height: 84px; margin-right: 24px; }
.wk-note { font-size: 30px; line-height: 1.3; color: var(--g-soft); }
.wk-note b { color: var(--g-ink); font-weight: 700; }
.wk-who .wk-note { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>`;

export function weeklySlides(v: Variant, s: WeeklySpec): string[] {
  const n = s.segments.length;
  const ctx = (seg: Segment): SlideCtx => ({ v, post: s.key, slide: s.segments.indexOf(seg) + 1, of: n });
  const kick = `The Weekly Numbers · Ep. ${s.episode}`;
  const closes = !s.segments.includes('close');
  const wow = s.resultsPrev ? ((s.results - s.resultsPrev) / s.resultsPrev) * 100 : 0;

  const make: Record<Segment, () => string> = {
    cover: () => cover(ctx('cover'), 'cover', {
      // Owner 2026-10-18: the cover says what the post is at first sight (week number + "report"), not a big count.
      kicker: `The Weekly Numbers · Ep. ${s.episode}`, title: 'Weekly report', dek: s.range, src: s.src,
      hero: { value: `Week ${isoWeek(s.weekStart)}`, max: 300 },
      stats: [['Solves', fmtInt(s.results)], ['Puzzlers', fmtInt(s.puzzlers)], ['Week on week', fmtSignedPct(wow)]],
    }),

    top: () => {
      const rowH = 150;
      return slide(ctx('top'), 'data', { kicker: kick, src: s.src, title: `${s.top[0].puzzle} was the week's most-solved puzzle`, body: CSS + `
        <div class="h-board" style="top:380px">
          <div class="h-bh"><span style="width:76px">#</span><span style="flex:1">Puzzle</span><span style="width:180px; text-align:right">Puzzlers</span></div>
          ${s.top.map((p, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:${rowH}px">
            <span class="rk">${pad2(i + 1)}</span>
            <span class="wk-thumb" style="width:136px; height:104px"><img src="${p.img}" alt=""></span>
            <div class="who"><p class="nm">${h(cut(p.puzzle, 34))}</p><p class="sub">${h(cut(p.brand, 26))} · ${fmtInt(p.pieces)} pieces</p></div>
            <span class="wk-time" style="width:180px">${fmtInt(p.solvers)}</span></div>`).join('')}
        </div>` }).html;
    },

    fast500: () => fastSlide(500),
    fast1000: () => fastSlide(1000),

    active: () => {
      const sections = activeSections(s), title = ACTIVE_TITLE, dek = ACTIVE_DEK;
      return slide(ctx('active'), 'data', { kicker: kick, src: s.src, title, body: CSS + `
        <p class="h-abs h-dek" style="top:${underTitle(title)}px">${dek}</p>
        <div class="h-board" style="top:${activeTop()}px">
          ${sections.map(({ k, rows }, si) => `<div class="wk-sec"${si ? ` style="margin-top:${secGap(activeTop(), actHeights(s))}px"` : ''}><span>${KIND[k]}</span>${si === 0 ? '<span>Solves</span>' : ''}</div>
            ${rows.map((g, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:${actRowH(g.people) - 2}px">
              ${box(g.img)}
              <div class="who"><p class="nm${g.people.length > 1 ? ' group' : ''}">${whoLine(g.people)}</p></div>
              <span class="wk-time" style="width:100px">${fmtInt(g.results)}</span></div>`).join('')}`).join('')}
        </div>` }).html;
    },

    shout: () => {
      const title = 'Shoutout draw', y0 = underTitle(title);
      const rowY = (i: number) => shoutTop(s, i);
      return slide(ctx('shout'), 'data', { kicker: kick, src: s.src, title, body: CSS + `
        <p class="h-abs h-dek" style="top:${y0}px">${shoutDek(s)}</p>
        ${s.shout.map((x, i) => `<div class="h-abs" style="top:${rowY(i)}px; display:flex; align-items:center; height:200px; border-bottom:2px solid var(--g-band)">
          ${x.img ? `<span class="wk-thumb" style="width:210px; height:158px"><img src="${x.img}" alt=""></span>` : ''}
          <div class="wk-who" style="flex:1; min-width:0; overflow:hidden; padding-right:20px">
            <p style="font-size:44px; font-weight:700; line-height:1.15; color:var(--g-ink); overflow-wrap:anywhere">${flag(x.person)}${h(cut(x.person.name, 30))}</p>
            <p class="wk-note" style="margin-top:6px; color:var(--g-ink)">${h(cut(x.puzzle, 29))}</p>
            <p class="wk-note">${h(cut(x.brand, 16))} · ${KIND_ONE[x.kind]}${x.results > 1 ? ` · ${fmtInt(x.results)} solves` : ''}</p>
          </div>
          <div style="flex:none; width:230px; text-align:right">
            ${x.seconds ? `<span class="wk-time" style="display:block; width:auto">${clock(sec(x.seconds))}</span>` : ''}
            ${x.pieces ? `<p class="wk-note" style="margin-top:4px">${fmtInt(x.pieces)} pieces</p>` : ''}</div></div>`).join('')}` }).html;
    },

    days: () => {
      /** The biggest puzzle finished, with a shoutout to who finished it (owner 2026-10-26: with their avatar when they have one). */
      const biggestCard = (y: number) => {
        const b = s.week.biggest, who = b.people.length ? `${whoLine(b.people)}` : '';
        return `<div class="h-abs" style="top:${y}px; display:flex; align-items:center; gap:0">
          <div style="position:relative; flex:none; width:${b.avatar ? 236 : 190}px; height:132px">
            ${b.img ? `<span class="wk-thumb" style="position:absolute; left:0; top:0; width:176px; height:132px; margin:0"><img src="${b.img}" alt=""></span>` : ''}
            ${b.avatar ? `<img src="${b.avatar}" alt="" style="position:absolute; left:128px; top:34px; width:96px; height:96px; border-radius:50%; object-fit:cover; border:5px solid #ffffff; box-shadow:0 12px 26px -12px rgba(10,14,24,0.6); background:#ffffff">` : ''}
          </div>
          <div style="flex:1; min-width:0; padding-left:24px">
            <p class="wk-sec" style="height:auto; border:0; padding:0; font-size:30px">Biggest puzzle finished</p>
            <p style="font-size:36px; font-weight:700; line-height:1.2; color:var(--g-ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${h(b.puzzle)}</p>
            <p class="wk-note" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${h(cut(b.brand, 16))} · <b>${fmtInt(b.pieces)} pieces</b>${who ? ` · by <span style="color:var(--g-ink); font-weight:600">${who}</span>` : ''}</p>
          </div></div>`;
      };
      const max = Math.max(...s.days.map(d => d.results));
      const busiest = s.days.find(d => d.results === max)!;
      const title = `${fmtInt(s.week.hours)} hours of puzzling in one week`, y0 = underTitle(title);
      const CH = 250, top = y0 + 150, colW = CW / 7, barW = colW * 0.62;
      const bars = s.days.map((d, i) => {
        const bh = (d.results / max) * (CH - 50), x = colW * i + (colW - barW) / 2, y = CH - bh;
        const hot = d === busiest;
        return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(barW)}" height="${f1(bh)}" rx="4" fill="${hot ? 'var(--c-hot)' : 'var(--c-base)'}"/>
          <text class="${hot ? 'c-lab-b' : 'c-lab'}" x="${f1(x + barW / 2)}" y="${f1(y - 14)}" text-anchor="middle">${fmtInt(d.results)}</text>
          <text class="${hot ? 'c-lab-b' : 'c-lab'}" x="${f1(x + barW / 2)}" y="${CH + 44}" text-anchor="middle">${d.weekday}</text>`;
      }).join('');
      const daysRound = Math.floor(s.week.hours / 24);
      const stripTop = top + CH + 70;
      return slide(ctx('days'), 'data', { kicker: kick, src: s.src, title, body: CSS + `
        <p class="h-abs h-dek" style="top:${y0}px">That's ${fmtInt(daysRound)} days around the clock. Busiest day: ${weekday(busiest.weekday)}, with ${fmtInt(max)} solves.</p>
        <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top}px" aria-hidden="true">${bars}</svg>
        <div class="h-abs h-strip" style="top:${stripTop}px">
          <div><p class="k">Countries</p><p class="v">${fmtInt(s.week.countries)}</p></div>
          <div><p class="k">Puzzles</p><p class="v">${fmtInt(s.week.puzzles)}</p></div>
          ${closes ? `<div><p class="k">PBs</p><p class="v">${fmtInt(s.personalBests)}</p></div>` : `<div><p class="k">Pieces</p><p class="v">${(Math.floor(s.pieces / 1e5) / 10).toFixed(1)}M</p></div>`}
        </div>
        ${closes ? `<p class="h-abs h-ask" style="top:${stripTop + 170}px">${h(s.question)}</p>` : biggestCard(stripTop + 165)}` }).html;
    },

    close: () => {
      const kv: Array<[string, string]> = [['Puzzlers joined us', fmtInt(s.newPuzzlers)], ['Puzzlers added times', fmtInt(s.puzzlers)], ['Added times', fmtInt(s.results)]];
      const rows = kv.map(([k, val]) => `<div class="h-br" style="height:92px"><span class="h-cap" style="flex:1">${h(k)}</span><span class="h-big" style="font-size:56px">${clock(val)}</span></div>`).join('');
      return cover(ctx('close'), 'fact', {
        kicker: kick, title: 'personal bests were set last week', src: s.src, hero: { value: fmtInt(s.personalBests), max: 300 },
        extra: `<div>${rows}</div><p class="h-ask" style="margin-top:40px">${h(s.question)}</p>`, extraHeight: kv.length * 92 + 40 + 34 + 2 * 61,
      });
    },
  };

  function fastSlide(pieces: number): string {
    const seg: Segment = pieces === 500 ? 'fast500' : 'fast1000';
    const sections = fastSections(s, pieces);
    const detail = (r: FastRow) => {
      // One line in the ~600 px name column: at most ~37 characters of 30 px text.
      const team = r.teamName ? `${cut(r.teamName, 16)} · ` : '';
      const pre = team + (r.firstAttempt ? 'First attempt · ' : ''), brand = cut(r.brand, 14);
      return `${pre}${h(cut(r.puzzle, 37 - pre.length - brand.length - 3))} · ${h(brand)}`;
    };
    const note = fastNote(s, pieces)
      ? `<p class="wk-note" style="margin-top:18px">The week's typical solo 500: <b>${sec(s.median500s)}</b>, the middle of ${fmtInt(s.solo500Results)} solo times.</p>` : '';
    return slide(ctx(seg), 'data', { kicker: kick, src: s.src, title: `The week's fastest ${sizeOf(pieces)}s`, body: CSS + `
      <div class="h-abs" style="top:${FAST_TOP}px"><div class="h-board" style="position:static">
        ${sections.map(({ k, rows: rs }, si) => `<div class="wk-sec"${si ? ` style="margin-top:${fastGap(s, pieces)}px"` : ''}><span>${KIND[k]} · ${sizeOf(pieces)} pieces</span>${si === 0 ? '<span>Time</span>' : ''}</div>
          ${rs.map((r, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="height:${fastRowH(r.people) - 2}px">
            ${box(r.img)}
            <div class="who"><p class="nm${r.people.length > 1 ? ' group' : ''}">${whoLine(r.people)}</p>
              <p class="sub">${detail(r)}</p></div>
            <span class="wk-time">${clock(sec(r.seconds))}</span></div>`).join('')}`).join('')}
      </div>${note}</div>` }).html;
  }

  return s.segments.map(seg => make[seg]());
}

/**
 * The Story that follows the post (posted by hand; it also feeds the "Recaps" highlight): the cover's poster at Story
 * size (indigo top with the week, navy bottom), the three headline numbers, the most-solved box and the fastest solo
 * 500, and y ≈ 1400–1700 left empty for the owner's link sticker to the post. Masthead, no footer.
 */
export function weeklyStories(v: Variant, s: WeeklySpec): string[] {
  const top = GROUNDS.indigo, SEAM = 860;
  const week = `Week ${isoWeek(s.weekStart)}`, size = heroFit(week, 250);
  const solo = s.fast.find(r => r.kind === 'solo' && r.pieces === 500);
  const p = s.top[0];
  const under = `<svg class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${top.bg}"/></svg>
    <div style="${groundVars(top)}" data-qa-bg="${top.bg}">
      <p class="h-abs h-cap" style="top:420px">Weekly report</p>
      ${hero(week, { size, baseline: 470 + size * 0.75 })}
      <p class="h-abs h-dek" style="top:${470 + size * 0.75 + 40}px; color:var(--g-ink)">${h(s.range)}</p>
    </div>`;
  const body = CSS + `
    <div class="h-abs h-strip" style="top:${SEAM + 120}px">
      <div><p class="k">Solves</p><p class="v">${fmtInt(s.results)}</p></div>
      <div><p class="k">Puzzlers</p><p class="v">${fmtInt(s.puzzlers)}</p></div>
      <div><p class="k">PBs</p><p class="v">${fmtInt(s.personalBests)}</p></div>
    </div>
    <div class="h-abs" style="top:${SEAM + 300}px; display:flex; align-items:center">
      <span class="wk-thumb" style="width:200px; height:150px"><img src="${p.img}" alt=""></span>
      <div style="flex:1; min-width:0">
        <p class="h-cap">Most solved</p>
        <p style="font-size:42px; font-weight:700; line-height:1.15; color:var(--g-ink); margin-top:6px">${h(cut(p.puzzle, 28))}</p>
        <p class="wk-note">${h(cut(p.brand, 20))} · ${fmtInt(p.solvers)} puzzlers</p>
      </div>
    </div>
    ${solo ? `<div class="h-abs" style="top:${SEAM + 500}px; display:flex; align-items:baseline; justify-content:space-between">
      <p class="h-cap">Fastest solo 500</p><p class="h-big hot" style="font-size:72px">${clock(sec(solo.seconds))}</p></div>` : ''}
    <p class="h-abs h-lead" style="top:${SEAM + 640}px; color:var(--g-soft)">Fastest pairs, most solves and a shoutout draw in the full report ↓</p>`;
  return [frame({ ground: 'navy', kind: 'story', kicker: `The Weekly Numbers · Ep. ${s.episode}`, device: v.device, src: s.src, rows: STICKER_STORY_ROWS, masthead: true, under, headGround: 'indigo', body })];
}

/** Alt text per slide, from the same facts. */
export function weeklyAlt(s: WeeklySpec): string[] {
  const max = Math.max(...s.days.map(d => d.results));
  const fastAlt = (pieces: number) => {
    const part = (k: Kind, take: number) => s.fast.filter(r => r.kind === k && r.pieces === pieces).slice(0, take).map(r => `${groupName(r)} ${sec(r.seconds)} (${r.puzzle} by ${r.brand})`);
    return `The week's fastest ${sizeOf(pieces)}-piece times. Solo: ${part('solo', 3).join('; ') || 'none'}. Pairs: ${part('duo', 1).join('') || 'none'}. Teams: ${part('team', 1).join('') || 'none'}.${pieces === 500 ? ` The week's typical solo 500 took ${sec(s.median500s)}.` : ''}`;
  };
  const alt: Record<Segment, () => string> = {
    cover: () => `Weekly report, week ${isoWeek(s.weekStart)}, ${s.range} (The Weekly Numbers, episode ${s.episode}): ${fmtInt(s.results)} solves finished by ${fmtInt(s.puzzlers)} puzzlers in ${s.week.countries} countries, ${fmtSignedPct(((s.results - s.resultsPrev) / s.resultsPrev) * 100)} on the week before.`,
    top: () => `The week's five most-solved puzzles with their box images: ${s.top.map(p => `${p.puzzle} by ${p.brand}, ${p.solvers} puzzlers`).join('; ')}.`,
    fast500: () => fastAlt(500),
    fast1000: () => fastAlt(1000),
    active: () => `Most solves this week. ${(['solo', 'duo', 'team'] as Kind[]).map(k => `${KIND[k]}: ${activeGroups(s.active, k, k === 'solo' ? 3 : 1).map(g => `${andJoin(g.people.map(p => p.name))} ${g.results}`).join(', ')}`).join('. ')}.`,
    shout: () => `Shoutout to puzzlers drawn at random from the ${fmtInt(s.poolSize)} who finished a puzzle last week: ${s.shout.map(x => `${x.person.name}, ${x.puzzle} by ${x.brand} (${fmtInt(x.pieces)} pieces)${x.seconds ? ` in ${sec(x.seconds)}` : ''} (${KIND_ONE[x.kind].toLowerCase()})`).join('; ')}.`,
    days: () => `${fmtInt(s.week.hours)} hours of puzzling in one week. Bar chart of solves per day: ${s.days.map(d => `${d.weekday} ${fmtInt(d.results)}`).join(', ')}; the busiest day had ${fmtInt(max)}. ${s.week.countries} countries, ${fmtInt(s.week.puzzles)} different puzzles, ${fmtInt(s.personalBests)} personal bests. Biggest puzzle finished: ${s.week.biggest.puzzle} by ${s.week.biggest.brand}, ${fmtInt(s.week.biggest.pieces)} pieces${s.week.biggest.people.length ? `, finished by ${andJoin(s.week.biggest.people.map(p => p.name))}` : ''}.`,
    close: () => `${fmtInt(s.personalBests)} personal bests were set last week. New puzzlers ${fmtInt(s.newPuzzlers)}, puzzlers ${fmtInt(s.puzzlers)}, pieces ${fmtInt(s.pieces)}. ${s.question}`,
  };
  return s.segments.map(seg => alt[seg]());
}

/** Photo tags per slide index: everyone named on a slide who has an Instagram handle on their MSP profile, on their row. */
export function weeklyTags(s: WeeklySpec): Record<number, Array<{ username: string; x: number; y: number }>> {
  // Each puzzler with an Instagram handle on their MSP profile is tagged on their own row (the slides show no handles,
  // owner 2026-10-19): y = the row's middle, x over the name (two names side by side for pairs, then further right).
  const out: Record<number, Array<{ username: string; x: number; y: number }>> = {};
  const tag = (seg: Segment, p: Person, x: number, y: number) => {
    const i = s.segments.indexOf(seg);
    if (i >= 0 && p.handle) (out[i] ??= []).push({ username: p.handle, x: Math.round((x / W) * 1000) / 1000, y: Math.round((y / 1350) * 1000) / 1000 });
  };
  // Each member on their own name: the row's name block is centred, `extra` px of text (the detail line) under the names.
  const put = (seg: Segment, ps: Person[], top: number, rowH: number, width: number, extra: number) => {
    const { lines, at } = nameLayout(ps, width), block = lines * NAME_LH + extra, y0 = top + (rowH - block) / 2;
    ps.forEach((p, j) => tag(seg, p, Math.min(W * 0.8, WHO_X + at[j].x + 80), y0 + at[j].line * NAME_LH + NAME_LH / 2));
  };
  for (const pieces of [500, 1000]) {
    const seg: Segment = pieces === 500 ? 'fast500' : 'fast1000', secs = fastSections(s, pieces);
    rowTops(FAST_TOP, fastHeights(s, pieces), fastGap(s, pieces)).forEach((ys, si) => ys.forEach((y, ri) => {
      const ps = secs[si].rows[ri].people;
      put(seg, ps, y, fastRowH(ps), FAST_WHO_W, 43);
    }));
  }
  const act = activeSections(s);
  rowTops(activeTop(), actHeights(s), secGap(activeTop(), actHeights(s))).forEach((ys, si) => ys.forEach((y, ri) => {
    const ps = act[si].rows[ri].people;
    put('active', ps, y, actRowH(ps), ACT_WHO_W, 0);
  }));
  s.shout.forEach((x, i) => tag('shout', x.person, 0.3 * W, shoutTop(s, i) + 100));
  // The biggest puzzle's finisher(s), on the card's last line (same geometry as the days slide).
  const cardTop = underTitle(`${fmtInt(s.week.hours)} hours of puzzling in one week`) + 150 + 250 + 70 + 165;
  s.week.biggest.people.forEach((p, j) => tag('days', p, Math.min(W * 0.8, W * 0.62 + j * 120), cardTop + 104));
  for (const k of Object.keys(out)) out[Number(k)] = out[Number(k)].slice(0, 20);
  return out;
}

/** Puzzle, brand, player and team names the caption may quote (exempt from the banned-word lint). */
export function weeklyNames(s: WeeklySpec): string[] {
  return [...new Set([...s.top.flatMap(p => [p.puzzle, p.brand]), ...s.fast.flatMap(r => [r.puzzle, r.brand, r.teamName ?? '', ...r.people.map(p => p.name)]),
    ...s.shout.flatMap(x => [x.puzzle, x.brand, x.person.name]), s.week.biggest.puzzle, s.week.biggest.brand, ...s.week.biggest.people.map(p => p.name)])].filter(Boolean);
}

/** The proposed caption (msp-captions rules): number first, what it means, the credits, one question, 3–5 topic labels. */
export function weeklyCaption(s: WeeklySpec): string {
  const solo500 = s.fast.find(r => r.kind === 'solo' && r.pieces === 500);
  const pair500 = s.fast.find(r => r.kind === 'duo' && r.pieces === 500);
  const team500 = s.fast.find(r => r.kind === 'team' && r.pieces === 500);
  // Credits by MSP name (owner 2026-10-19): handles live only in the photo tags on each puzzler's row.
  const credit = (r?: FastRow) => (r ? `${r.teamName ? `${r.teamName} (${groupName(r)})` : groupName(r)}` : '');
  const credits = [solo500 && `solo ${credit(solo500)} (${sec(solo500.seconds)})`, pair500 && `pairs ${credit(pair500)} (${sec(pair500.seconds)})`, team500 && `teams ${credit(team500)} (${sec(team500.seconds)})`].filter(Boolean);
  const shout = s.segments.includes('shout') && s.shout.length ? `Shoutout draw 🎉 ${andJoin(s.shout.map(x => x.person.name))}, picked at random from everyone who finished a puzzle last week.` : '';
  const b = s.week.biggest;
  const biggest = s.segments.includes('days') && b.people.length ? `Biggest finish of the week: ${andJoin(b.people.map(p => p.name))} completed ${b.puzzle} by ${b.brand}, all ${fmtInt(b.pieces)} pieces 👏` : '';
  return [
    `Weekly report, week ${isoWeek(s.weekStart)} (${s.range.replace(/ \d{4}$/, '')}): ${fmtInt(s.week.hours)} hours of puzzling, that's ${fmtInt(Math.floor(s.week.hours / 24))} days around the clock on MySpeedPuzzling.`,
    '',
    `${fmtInt(s.puzzlers)} puzzlers in ${s.week.countries} countries finished ${fmtInt(s.results)} puzzles. The most-solved was ${s.top[0].puzzle} by ${s.top[0].brand}, done by ${fmtInt(s.top[0].solvers)} of you. The typical solo 500 took ${sec(s.median500s)}, and ${fmtInt(s.personalBests)} of you set a personal best.`,
    '',
    credits.length ? `Fastest 500s of the week ⏱️ ${credits.join(' · ')}` : '',
    '',
    shout,
    '',
    biggest,
    '',
    s.question,
    '',
    '#speedpuzzling #jigsawpuzzle #myspeedpuzzling #puzzlestats',
  ].join('\n').replace(/\n{3,}/g, '\n\n');
}
