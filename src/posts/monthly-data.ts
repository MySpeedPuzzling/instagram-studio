// Facts for the monthly recap (src/posts/monthly.ts): the last full calendar month, results logged in it (like MSP's
// statistics page; owner 2026-11-01). The draft tool runs the queries fresh on the 1st (owner rule: fresh data on the day).
import { fetchBoxes } from '../data/boxes.ts';
import { query, type QueryResult } from '../data/db.ts';
import type { MonthlySpec } from './monthly.ts';
import { prepareTones } from './mosaic.ts';

const num = Number;

export async function buildMonthlySpec(o: { fresh: boolean; note?: string }): Promise<{ spec: MonthlySpec; facts: Record<string, QueryResult> }> {
  const names = ['monthly-totals', 'monthly-history', 'monthly-boxes'] as const;
  const q = Object.fromEntries(names.map(n => [n, query(n, { fresh: o.fresh })])) as Record<typeof names[number], QueryResult>;
  const t = q['monthly-totals'].rows[0];
  const month = t?.month_start.slice(0, 7);
  if (!t || q['monthly-boxes'].rows.length < 1000 || !q['monthly-history'].rows.some(r => r.month === month)) throw new Error('monthly: a query came back incomplete');
  const imgs = await fetchBoxes(q['monthly-boxes'].rows.map(r => r.image), 'puzzle_medium');
  const boxes = q['monthly-boxes'].rows.filter(r => imgs.has(r.image)).map(r => ({
    puzzleId: r.puzzle_id, puzzle: r.puzzle, brand: r.brand, img: imgs.get(r.image)!, image: r.image,
    pieces: num(r.pieces), solvers: num(r.solvers), results: num(r.results),
  }));
  const tones = await prepareTones(boxes);
  const asOf = new Date(q['monthly-totals'].queried_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Prague' });
  const spec: MonthlySpec = {
    key: 'month', month,
    results: num(t.results), puzzlers: num(t.puzzlers), puzzles: num(t.puzzles), pieces: num(t.pieces), hours: num(t.hours),
    countries: num(t.countries), newPuzzlers: num(t.new_puzzlers), personalBests: num(t.personal_bests), resultsYearAgo: num(t.results_year_ago),
    history: q['monthly-history'].rows.map(r => ({ month: r.month, results: num(r.results) })),
    boxes, tones, note: o.note, src: `Data: myspeedpuzzling.com · ${asOf}`,
  };
  return { spec, facts: q };
}
