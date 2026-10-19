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
import { CW, FEED, X0, clock, cover, f1, linesOf, slide, type SlideCtx, type Variant } from '../design/house.ts';
import { flagUrl } from '../design/svg.ts';
import { escapeHtml as h, fmtDuration, fmtInt, fmtSignedPct } from '../design/page.ts';

export type Kind = 'solo' | 'duo' | 'team';
export type Segment = 'cover' | 'top' | 'fast500' | 'fast1000' | 'active' | 'shout' | 'days' | 'close';
export interface Person { id: string; name: string; country?: string; handle?: string }
export interface FastRow { kind: Kind; pieces: number; seconds: number; firstAttempt: boolean; puzzle: string; brand: string; people: Person[]; teamName?: string }
export interface ActiveRow { kind: Kind; person: Person; results: number; pieces: number }
export interface Shout { person: Person; results: number; puzzle: string; brand: string; pieces: number; img?: string }

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
  week: { hours: number; countries: number; puzzles: number; firstEver: number; added: number; biggest: { puzzle: string; brand: string; pieces: number }; firstAttemptPct: number };
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
const sizeOf = (pieces: number) => fmtInt(pieces);
const andJoin = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} & ${xs.at(-1)}`);
const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return `${(/\s/.test(s[max - 1]) ? head : head.replace(/\s+\S*$/, '') || head).replace(/[\s,.:;·–-]+$/, '')}…`;
};
/** Top of the line under a slide title (62 px, line-height 1.1). */
const underTitle = (title: string) => Math.round(FEED.contentTop + linesOf(title, 62, CW, true) * 62 * 1.1 + 20);
const flag = (p: Person) => (p.country ? `<img class="wk-flag" src="${flagUrl(p.country)}" alt="">` : '');
const handles = (ps: Person[]) => ps.filter(p => p.handle).map(p => `@${p.handle}`);
/** Display name of a group: the team's own name, else its members. */
const groupName = (r: { people: Person[]; teamName?: string }) => r.teamName ?? andJoin(r.people.map(p => p.name));
const weekday = (d: string) => ({ Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' } as Record<string, string>)[d] ?? d;

/** Players with the same count and pieces next to each other in a kind's top list solved together: one row. */
function activeGroups(rows: ActiveRow[], kind: Kind, take: number): Array<{ people: Person[]; results: number }> {
  const rs = rows.filter(r => r.kind === kind);
  const out: Array<{ people: Person[]; results: number; pieces: number }> = [];
  for (const r of rs) {
    const g = kind !== 'solo' ? out.find(o => o.results === r.results && o.pieces === r.pieces) : undefined;
    if (g) g.people.push(r.person); else out.push({ people: [r.person], results: r.results, pieces: r.pieces });
  }
  return out.slice(0, take);
}

const CSS = `<style>
.wk-flag { display: inline-block; flex: none; width: 38px; height: 38px; margin-right: 12px; vertical-align: -7px; }
.h-br .who { flex: 1; min-width: 0; overflow: hidden; padding-right: 16px; }
.h-br .who .nm { font-size: 38px; font-weight: 600; line-height: 1.18; overflow-wrap: anywhere; }
.h-br.hot .who .nm { font-weight: 700; }
.h-br .who .ig { font-size: 30px; font-weight: 500; line-height: 1.2; color: var(--g-accent); margin-top: 4px; overflow-wrap: anywhere; }
.h-br .who .sub { margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wk-time { flex: none; width: 210px; text-align: right; font-size: 48px; font-weight: 700; color: var(--g-ink); }
.h-br.hot .wk-time { color: var(--g-hot); }
.wk-sec { display: flex; align-items: flex-end; height: 50px; padding-bottom: 8px; font-size: 30px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g-accent); border-bottom: 2px solid var(--g-rule); }
.wk-sec span:last-child { margin-left: auto; }
.wk-thumb { flex: none; background: #ffffff; padding: 6px; border-radius: 4px; margin-right: 24px; box-shadow: 0 12px 26px -12px rgba(10, 14, 24, 0.6); }
.wk-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.wk-note { font-size: 30px; line-height: 1.3; color: var(--g-soft); }
.wk-note b { color: var(--g-ink); font-weight: 700; }
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
      const sections = (['solo', 'duo', 'team'] as Kind[]).map(k => ({ k, rows: activeGroups(s.active, k, k === 'solo' ? 3 : 1) })).filter(x => x.rows.length);
      const title = 'Most solves this week', dek = 'Puzzles finished last week; every member of a pair or team counts.';
      return slide(ctx('active'), 'data', { kicker: kick, src: s.src, title, body: CSS + `
        <p class="h-abs h-dek" style="top:${underTitle(title)}px">${dek}</p>
        <div class="h-board" style="top:${underTitle(title) + linesOf(dek, 38) * 50 + 30}px">
          ${sections.map(({ k, rows }, si) => `<div class="wk-sec"${si ? ' style="margin-top:22px"' : ''}><span>${KIND[k]}</span>${si === 0 ? '<span>Solves</span>' : ''}</div>
            ${rows.map((g, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="padding:22px 0">
              <span class="rk">${pad2(i + 1)}</span>
              <div class="who"><p class="nm">${g.people.map(p => `${flag(p)}${h(cut(p.name, 30))}`).join(' &amp; ')}</p>
                ${handles(g.people).length ? `<p class="ig">${h(handles(g.people).join(' · '))}</p>` : ''}</div>
              <span class="wk-time">${fmtInt(g.results)}</span></div>`).join('')}`).join('')}
        </div>` }).html;
    },

    shout: () => {
      const title = 'Shoutout draw', y0 = underTitle(title);
      const dekLines = linesOf(`Three puzzlers, drawn at random from all ${fmtInt(s.poolSize)} who finished a puzzle last week. Every solve counts.`, 38);
      const rowY = (i: number) => y0 + dekLines * 50 + 44 + i * 236;
      return slide(ctx('shout'), 'data', { kicker: kick, src: s.src, title, body: CSS + `
        <p class="h-abs h-dek" style="top:${y0}px">${s.shout.length === 1 ? 'One puzzler' : `${s.shout.length === 2 ? 'Two' : 'Three'} puzzlers`}, drawn at random from all ${fmtInt(s.poolSize)} who finished a puzzle last week. Every solve counts.</p>
        ${s.shout.map((x, i) => `<div class="h-abs" style="top:${rowY(i)}px; display:flex; align-items:center; height:200px; border-bottom:2px solid var(--g-band)">
          ${x.img ? `<span class="wk-thumb" style="width:210px; height:158px"><img src="${x.img}" alt=""></span>` : ''}
          <div style="flex:1; min-width:0">
            <p style="font-size:44px; font-weight:700; line-height:1.15; color:var(--g-ink); overflow-wrap:anywhere">${flag(x.person)}${h(cut(x.person.name, 30))}</p>
            ${x.person.handle ? `<p style="font-size:30px; font-weight:500; color:var(--g-accent); margin-top:4px">@${h(x.person.handle)}</p>` : ''}
            <p class="wk-note" style="margin-top:6px">${h(cut(x.puzzle, 34))} · ${h(cut(x.brand, 22))}</p>
            <p class="wk-note"><b>${fmtInt(x.results)}</b> ${x.results === 1 ? 'solve' : 'solves'} this week</p>
          </div></div>`).join('')}` }).html;
    },

    days: () => {
      const max = Math.max(...s.days.map(d => d.results));
      const busiest = s.days.find(d => d.results === max)!;
      const title = `${fmtInt(s.week.hours)} hours of puzzling in one week`, y0 = underTitle(title);
      const CH = 300, top = y0 + 170, colW = CW / 7, barW = colW * 0.62;
      const bars = s.days.map((d, i) => {
        const bh = (d.results / max) * (CH - 50), x = colW * i + (colW - barW) / 2, y = CH - bh;
        const hot = d === busiest;
        return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(barW)}" height="${f1(bh)}" rx="4" fill="${hot ? 'var(--c-hot)' : 'var(--c-base)'}"/>
          <text class="${hot ? 'c-lab-b' : 'c-lab'}" x="${f1(x + barW / 2)}" y="${f1(y - 14)}" text-anchor="middle">${fmtInt(d.results)}</text>
          <text class="${hot ? 'c-lab-b' : 'c-lab'}" x="${f1(x + barW / 2)}" y="${CH + 44}" text-anchor="middle">${d.weekday}</text>`;
      }).join('');
      const daysRound = Math.floor(s.week.hours / 24);
      const stripTop = top + CH + 80;
      return slide(ctx('days'), 'data', { kicker: kick, src: s.src, title, body: CSS + `
        <p class="h-abs h-dek" style="top:${y0}px">That's ${fmtInt(daysRound)} days around the clock. Busiest day: ${weekday(busiest.weekday)}, with ${fmtInt(max)} solves.</p>
        <svg width="${CW}" height="${CH + 60}" style="position:absolute; left:${X0}px; top:${top}px" aria-hidden="true">${bars}</svg>
        <div class="h-abs h-strip" style="top:${stripTop}px">
          <div><p class="k">Countries</p><p class="v">${fmtInt(s.week.countries)}</p></div>
          <div><p class="k">Puzzles</p><p class="v">${fmtInt(s.week.puzzles)}</p></div>
          ${closes ? `<div><p class="k">PBs</p><p class="v">${fmtInt(s.personalBests)}</p></div>` : `<div><p class="k">Pieces</p><p class="v">${(Math.floor(s.pieces / 1e5) / 10).toFixed(1)}M</p></div>`}
        </div>
        ${closes ? `<p class="h-abs h-ask" style="top:${stripTop + 170}px">${h(s.question)}</p>` : `<p class="h-abs wk-note" style="top:${stripTop + 170}px">${fmtInt(s.week.firstEver)} puzzles got their first-ever time on MySpeedPuzzling, and the biggest finished was ${h(s.week.biggest.puzzle)} by ${h(s.week.biggest.brand)}: <b>${fmtInt(s.week.biggest.pieces)} pieces</b>.</p>`}` }).html;
    },

    close: () => {
      const kv: Array<[string, string]> = [['New puzzlers', fmtInt(s.newPuzzlers)], ['Puzzlers', fmtInt(s.puzzlers)], ['Solves', fmtInt(s.results)]];
      const rows = kv.map(([k, val]) => `<div class="h-br" style="height:92px"><span class="h-cap" style="flex:1">${h(k)}</span><span class="h-big" style="font-size:56px">${clock(val)}</span></div>`).join('');
      return cover(ctx('close'), 'fact', {
        kicker: kick, title: 'personal bests were set last week', src: s.src, hero: { value: fmtInt(s.personalBests), max: 300 },
        extra: `<div>${rows}</div><p class="h-ask" style="margin-top:40px">${h(s.question)}</p>`, extraHeight: kv.length * 92 + 40 + 34 + 2 * 61,
      });
    },
  };

  function fastSlide(pieces: number): string {
    const seg: Segment = pieces === 500 ? 'fast500' : 'fast1000';
    const rows = (k: Kind, take: number) => s.fast.filter(r => r.kind === k && r.pieces === pieces).slice(0, take);
    const sections = ([['solo', 3], ['duo', 1], ['team', 1]] as Array<[Kind, number]>).map(([k, t]) => ({ k, rows: rows(k, t) })).filter(x => x.rows.length);
    const detail = (r: FastRow) => {
      // One line in the ~600 px name column: at most ~37 characters of 30 px text.
      const pre = r.firstAttempt ? 'First attempt · ' : '', brand = cut(r.brand, 14);
      return `${pre}${h(cut(r.puzzle, 37 - pre.length - brand.length - 3))} · ${h(brand)}`;
    };
    const note = pieces === 500 && s.solo500Results >= 100
      ? `<p class="wk-note" style="margin-top:18px">The week's typical solo 500: <b>${sec(s.median500s)}</b>, the middle of ${fmtInt(s.solo500Results)} solo times.</p>` : '';
    return slide(ctx(seg), 'data', { kicker: kick, src: s.src, title: `The week's fastest ${sizeOf(pieces)}s`, body: CSS + `
      <div class="h-abs" style="top:262px"><div class="h-board" style="position:static">
        ${sections.map(({ k, rows: rs }, si) => `<div class="wk-sec"${si ? ' style="margin-top:8px"' : ''}><span>${KIND[k]} · ${sizeOf(pieces)} pieces</span>${si === 0 ? '<span>Time</span>' : ''}</div>
          ${rs.map((r, i) => `<div class="h-br ${i === 0 ? 'hot' : ''}" style="padding:11px 0">
            <span class="rk">${pad2(i + 1)}</span>
            <div class="who"><p class="nm">${r.teamName ? h(cut(r.teamName, 34)) : r.people.map(p => `${flag(p)}${h(cut(p.name, r.people.length > 2 ? 16 : 26))}`).join(r.people.length > 2 ? ', ' : ' &amp; ')}</p>
              ${handles(r.people).length ? `<p class="ig">${h(handles(r.people).join(' · '))}</p>` : ''}
              <p class="sub">${detail(r)}</p></div>
            <span class="wk-time">${clock(sec(r.seconds))}</span></div>`).join('')}`).join('')}
      </div>${note}</div>` }).html;
  }

  return s.segments.map(seg => make[seg]());
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
    shout: () => `Shoutout to puzzlers drawn at random from the ${fmtInt(s.poolSize)} who finished a puzzle last week: ${s.shout.map(x => `${x.person.name}, ${x.results} ${x.results === 1 ? 'solve' : 'solves'}, last one ${x.puzzle} by ${x.brand}`).join('; ')}.`,
    days: () => `${fmtInt(s.week.hours)} hours of puzzling in one week. Bar chart of solves per day: ${s.days.map(d => `${d.weekday} ${fmtInt(d.results)}`).join(', ')}; the busiest day had ${fmtInt(max)}. ${s.week.countries} countries, ${fmtInt(s.week.puzzles)} different puzzles, ${fmtInt(s.personalBests)} personal bests.`,
    close: () => `${fmtInt(s.personalBests)} personal bests were set last week. New puzzlers ${fmtInt(s.newPuzzlers)}, puzzlers ${fmtInt(s.puzzlers)}, pieces ${fmtInt(s.pieces)}. ${s.question}`,
  };
  return s.segments.map(seg => alt[seg]());
}

/** Photo tags per slide index: everyone named on a slide who has an Instagram handle on their MSP profile, on their row. */
export function weeklyTags(s: WeeklySpec): Record<number, Array<{ username: string; x: number; y: number }>> {
  const out: Record<number, Array<{ username: string; x: number; y: number }>> = {};
  const put = (seg: Segment, ps: Person[], y: number) => {
    const i = s.segments.indexOf(seg);
    if (i < 0) return;
    for (const [j, p] of ps.filter(p => p.handle).entries()) (out[i] ??= []).push({ username: p.handle!, x: Math.min(0.8, 0.3 + j * 0.15), y: Math.round((y / 1350) * 100) / 100 });
  };
  // Only the rows the slide shows (solo top 3, best pair, best team), at roughly their row's height.
  for (const pieces of [500, 1000]) {
    const seg: Segment = pieces === 500 ? 'fast500' : 'fast1000';
    let y = 262;
    for (const [k, take] of [['solo', 3], ['duo', 1], ['team', 1]] as Array<[Kind, number]>) {
      const rs = s.fast.filter(r => r.kind === k && r.pieces === pieces).slice(0, take);
      if (!rs.length) continue;
      y += 58;
      for (const r of rs) { put(seg, r.people, y + 50); y += r.people.some(p => p.handle) ? 120 : 86; }
    }
  }
  (['solo', 'duo', 'team'] as Kind[]).forEach((k, ki) => activeGroups(s.active, k, k === 'solo' ? 3 : 1).forEach((g, i) => put('active', g.people, 440 + (ki * 3 + i) * 120)));
  s.shout.forEach((x, i) => put('shout', [x.person], 515 + i * 236));
  for (const k of Object.keys(out)) out[Number(k)] = out[Number(k)].slice(0, 20);
  return out;
}

/** Puzzle, brand, player and team names the caption may quote (exempt from the banned-word lint). */
export function weeklyNames(s: WeeklySpec): string[] {
  return [...new Set([...s.top.flatMap(p => [p.puzzle, p.brand]), ...s.fast.flatMap(r => [r.puzzle, r.brand, r.teamName ?? '', ...r.people.map(p => p.name)]),
    ...s.shout.flatMap(x => [x.puzzle, x.brand, x.person.name]), s.week.biggest.puzzle])].filter(Boolean);
}

/** The proposed caption (msp-captions rules): number first, what it means, the credits, one question, 3–5 topic labels. */
export function weeklyCaption(s: WeeklySpec): string {
  const solo500 = s.fast.find(r => r.kind === 'solo' && r.pieces === 500);
  const pair500 = s.fast.find(r => r.kind === 'duo' && r.pieces === 500);
  const team500 = s.fast.find(r => r.kind === 'team' && r.pieces === 500);
  const credit = (r?: FastRow) => {
    if (!r) return '';
    const hs = handles(r.people);
    // A team with its own name goes by it (members' handles after it); pairs and solo by handle, else by name.
    if (r.teamName) return hs.length ? `${r.teamName} with ${andJoin(hs)}` : r.teamName;
    return andJoin(r.people.map(p => (p.handle ? `@${p.handle}` : p.name)));
  };
  const credits = [solo500 && `solo ${credit(solo500)} (${sec(solo500.seconds)})`, pair500 && `pairs ${credit(pair500)} (${sec(pair500.seconds)})`, team500 && `teams ${credit(team500)} (${sec(team500.seconds)})`].filter(Boolean);
  const shout = s.segments.includes('shout') && s.shout.length ? `Shoutout draw 🎉 ${andJoin(s.shout.map(x => (x.person.handle ? `@${x.person.handle}` : x.person.name)))}, picked at random from everyone who finished a puzzle last week.` : '';
  return [
    `Weekly report, week ${isoWeek(s.weekStart)} (${s.range.replace(/ \d{4}$/, '')}): ${fmtInt(s.week.hours)} hours of puzzling, that's ${fmtInt(Math.floor(s.week.hours / 24))} days around the clock on MySpeedPuzzling.`,
    '',
    `${fmtInt(s.puzzlers)} puzzlers in ${s.week.countries} countries finished ${fmtInt(s.results)} puzzles. The most-solved was ${s.top[0].puzzle} by ${s.top[0].brand}, done by ${fmtInt(s.top[0].solvers)} of you. The typical solo 500 took ${sec(s.median500s)}, and ${fmtInt(s.personalBests)} of you set a personal best.`,
    '',
    credits.length ? `Fastest 500s of the week ⏱️ ${credits.join(' · ')}` : '',
    '',
    shout,
    '',
    s.question,
    '',
    '#speedpuzzling #jigsawpuzzle #myspeedpuzzling #puzzlestats',
  ].join('\n').replace(/\n{3,}/g, '\n\n');
}
