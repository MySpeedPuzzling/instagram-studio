// Design lab DL1: the fixed test content every visual direction renders, built from cached production
// queries (content/cache, refreshed with `node src/data/db.ts <name> --fresh`).
import { query } from '../../src/data/db.ts';
import { fmtDuration, fmtInt } from '../../src/design/page.ts';

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
    },

    /** Single image: anonymous record hero number. */
    record: {
      kicker: 'Record',
      value: fmtDuration(num(rec.fastest_first_try) / 60), // 22:30
      title: 'The fastest first try ever logged on a 500-piece puzzle',
      context: `The overall record is ${fmtDuration(num(rec.fastest_any) / 60)}, set on a puzzle its solver had done before.`,
      firstTries: num(rec.first_tries),
      footnote: `Fastest of ${fmtInt(num(rec.first_tries))} first attempts on 500 pieces`,
    },

    /** Single image: country top 10 by median personal best. */
    countries: {
      title: 'Danish puzzlers are the fastest on a 500',
      dek: 'Median personal best, solo 500 pieces (countries with 40+ puzzlers)',
      top: countries.slice(0, 10),
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
  };
}

export type Content = ReturnType<typeof loadContent>;
