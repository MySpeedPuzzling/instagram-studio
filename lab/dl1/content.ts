// Design lab DL1: the fixed test content every visual direction renders, built from cached production
// queries (content/cache, refreshed with `node src/data/db.ts <name> --fresh`).
import { query } from '../../src/data/db.ts';
import { fmtDuration, fmtInt } from '../../src/design/page.ts';
import { featurable } from '../../src/data/featuring.ts';

const rows = (name: string) => query(name).rows;
const num = (v: string) => Number(v);
const countryName = new Intl.DisplayNames(['en'], { type: 'region' });

/** Largest-remainder rounding so unit charts always total exactly 100 units. */
export function toUnits(values: Array<{ key: string; pct: number }>, total = 100) {
  const floors = values.map(v => ({ ...v, units: Math.floor((v.pct / 100) * total), rem: ((v.pct / 100) * total) % 1 }));
  let left = total - floors.reduce((s, v) => s + v.units, 0);
  for (const v of [...floors].sort((a, b) => b.rem - a.rem)) { if (left-- <= 0) break; v.units++; }
  return floors.map(({ key, pct, units }) => ({ key, pct, units }));
}

export function loadContent() {
  const totals = rows('totals')[0];
  const wall = rows('wall-500').map(r => ({ minute: num(r.minute), results: num(r.results) }));
  const at = (m: number) => wall.find(w => w.minute === m)!.results;
  const mode = wall.filter(w => w.minute >= 45 && w.minute <= 75).reduce((a, b) => (b.results > a.results ? b : a));
  const dist = Object.fromEntries(rows('solo-distribution').map(r => [r.pieces_count, r]));
  const pb = rows('pb-500-thresholds')[0];
  const rec = rows('records-500')[0];
  const countries = rows('country-pb-500').map(r => ({ code: r.country, name: countryName.of(r.country) ?? r.country, puzzlers: num(r.puzzlers), medianPb: num(r.median_pb) }));
  const share = rows('share-by-pieces').map(r => ({ key: r.size, results: num(r.results), pct: num(r.pct) }));
  const xp = rows('xp-levels').map(r => ({ level: num(r.level), players: num(r.players) }));

  return {
    asOf: '13 Oct 2026',
    source: 'Data: myspeedpuzzling.com · 13 Oct 2026',
    totals: { results: num(totals.results), players: num(totals.players), countries: num(totals.countries), pieces: num(totals.pieces), hours: num(totals.hours) },

    /** Carousel: "The 59-minute wall" (cover, histogram, context, takeaway). */
    wall: {
      kicker: 'Solo 500-piece times',
      title: 'The 59-minute wall',
      dek: 'Thousands of you finish just before the hour. Then the counts drop.',
      histogram: wall.filter(w => w.minute >= 40 && w.minute <= 80),
      mode: { minute: mode.minute, results: mode.results },
      at59: at(59),
      at60: at(60),
      dropPct: Math.round(((at(60) - at(59)) / at(59)) * 1000) / 10, // -7.4
      quartiles: { p25: num(dist['500'].p25), median: num(dist['500'].p50), p75: num(dist['500'].p75) },
      noStepAt: [45, 50],
      context: 'There is no such step at 45 or 50 minutes. The hour is the line people race for.',
      subHour: { puzzlers: num(pb.puzzlers), under60: num(pb.under_60), pct: Math.round((num(pb.under_60) / num(pb.puzzlers)) * 100) },
      question: 'Which side of the wall is your PB?',
      wallMinute: 59,
    },

    /** Single image: anonymous record hero number. */
    record: {
      kicker: 'Record',
      value: fmtDuration(num(rec.fastest_first_try) / 60), // 22:30
      title: 'The fastest first try ever logged on a 500-piece puzzle',
      context: `The overall record is ${fmtDuration(num(rec.fastest_any) / 60)}, set on a puzzle its solver had done before.`,
      firstTries: num(rec.first_tries),
      footnote: `Fastest of ${fmtInt(num(rec.first_tries))} first attempts on 500 pieces`,
      firstTrySeconds: num(rec.fastest_first_try),
      overallSeconds: num(rec.fastest_any),
      overall: fmtDuration(num(rec.fastest_any) / 60),
    },

    /** Single image: country top 10 by median personal best. */
    countries: {
      title: 'Danish puzzlers are the fastest on a 500',
      dek: 'Median personal best, solo 500 pieces (countries with 40+ puzzlers)',
      top: countries.slice(0, 10),
      minPuzzlers: 40,
      reference: [
        { label: 'United States', value: countries.find(c => c.code === 'US')?.medianPb ?? null },
        { label: 'Everyone', value: num(pb.median_pb) },
      ],
    },

    /** Single image: proportion, as a 10×10 unit grid. */
    share: {
      title: '3 in 4 results are 500-piece puzzles',
      dek: `Share of all ${fmtInt(num(totals.results))} results on MySpeedPuzzling, by puzzle size`,
      parts: share,
      units: toUnits(share.map(s => ({ key: s.key, pct: s.pct }))),
      labels: { '500': '500 pieces', '1000': '1,000 pieces', 'under 500': 'Under 500', other: 'Other sizes' } as Record<string, string>,
    },

    /** XP share-card concept rebuilt with correct pieces: the Level 50 club. */
    xp: {
      kicker: 'New on MSP: XP and levels',
      level: 50,
      title: 'The Level 50 club',
      dek: `${xp.find(x => x.level === 50)?.players ?? 0} puzzlers already reached the top level`,
      context: `${xp.filter(x => x.level >= 40).reduce((s, x) => s + x.players, 0)} are at level 40 or higher, out of ${fmtInt(xp.reduce((s, x) => s + x.players, 0))} puzzlers with XP.`,
      distribution: xp,
    },

    /** Carousel: The Weekly Numbers, season 1 episode 1 (last full week). Real names: local renders only. */
    weekly: (() => {
      const t = rows('weekly-totals')[0];
      const start = new Date(t.week_start + 'T00:00:00Z');
      const end = new Date(start.getTime() + 6 * 86400000);
      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
      const fastest = featurable(rows('weekly-fastest') as Array<Record<string, string> & { player_id: string }>).map(r => ({
        player: r.player, country: r.country, pieces: num(r.pieces), time: fmtDuration(num(r.seconds) / 60), firstAttempt: r.first_attempt === 't',
        puzzle: r.puzzle, brand: r.brand, handle: r.ig_handle || null,
      }));
      return {
        series: 'The Weekly Numbers', episode: 1, season: 1,
        range: `${fmt(start)} – ${fmt(end)} ${end.getUTCFullYear()}`,
        results: num(t.results), resultsPrev: num(t.results_prev),
        resultsChangePct: Math.round(((num(t.results) - num(t.results_prev)) / num(t.results_prev)) * 1000) / 10,
        puzzlers: num(t.puzzlers), pieces: num(t.pieces), newPuzzlers: num(t.new_puzzlers), personalBests: num(t.personal_bests),
        topPuzzles: rows('weekly-top-puzzles').map(r => ({ puzzle: r.puzzle, brand: r.brand, pieces: num(r.pieces), solvers: num(r.solvers) })),
        fastest500: fastest.filter(f => f.pieces === 500).slice(0, 3),
        fastest1000: fastest.filter(f => f.pieces === 1000).slice(0, 3),
        question: 'What did you puzzle last week?',
      };
    })(),

    /** Event preview: the next big event on the calendar. */
    event: (() => {
      const e = rows('event-wisconsin').at(-1)!;
      const us = countries.find(c => c.code === 'US');
      return {
        name: 'Wisconsin State Jigsaw Puzzle Championship', short: 'Wisconsin State Championship',
        date: new Date(e.date_from + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
        location: e.location, registered: num(e.participants), onMsp: num(e.linked_players),
        usMedianPb: us ? fmtDuration(us.medianPb) : null, usPuzzlers: us?.puzzlers ?? null,
        question: 'Competing on Friday? Tell us your goal time.',
        upcomingCount: rows('upcoming-events').length,
      };
    })(),

    /** Feature news: XP launch day (12 Oct 2026) as "launch-day archaeology". */
    feature: (() => {
      const days = rows('logging-daily-recent').map(r => ({ day: r.day, results: num(r.results), backfilled: num(r.backfilled) }));
      const launch = days.find(d => d.day === '2026-10-12')!;
      const before = days.filter(d => d.day < '2026-10-12' && d.day >= '2026-09-28');
      const avg = Math.round(before.reduce((s, d) => s + d.results, 0) / before.length);
      return {
        kicker: 'New on MSP: XP and levels', launchDate: '12 Oct 2026', results: launch.results, backfilled: launch.backfilled,
        backfilledPct: Math.round((launch.backfilled / launch.results) * 100), typicalDay: avg,
        multiple: Math.round((launch.results / avg) * 10) / 10, days,
        title: 'XP launch day was our busiest day ever',
        dek: 'You logged puzzles you solved weeks, months and years ago.',
        question: 'What level did you start at?',
      };
    })(),

    /** Monthly report: September 2026, the biggest month ever. */
    month: (() => {
      const m = rows('monthly').map(r => ({ month: r.month, results: num(r.results), active: num(r.active), pieces: num(r.pieces), newPlayers: num(r.new_players) }));
      const sep = m.find(x => x.month === '2026-09')!, sep25 = m.find(x => x.month === '2025-09')!;
      return {
        label: 'September 2026', title: 'September was our biggest month ever',
        results: sep.results, active: sep.active, pieces: sep.pieces, newPlayers: sep.newPlayers,
        vsLastYearPct: Math.round(((sep.results - sep25.results) / sep25.results) * 100),
        series: m.filter(x => x.month < '2026-10'),
        question: 'How many puzzles did you finish in September?',
      };
    })(),
  };
}

export type Content = ReturnType<typeof loadContent>;
