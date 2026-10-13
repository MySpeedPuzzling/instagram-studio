// Design lab DL2: creative formats. Content from cached production queries plus locally cached box images.
// Prefetch images first:  node src/data/boxes.ts boxes-week-top && node src/data/boxes.ts boxes-alltime-top
//                         node src/data/boxes.ts boxes-month-top puzzle_medium
import { boxPaths } from '../../src/data/boxes.ts';
import { query } from '../../src/data/db.ts';
import { fmtDuration } from '../../src/design/page.ts';

const rows = (name: string) => query(name).rows;
const num = (v: string) => Number(v);

export interface Box {
  puzzleId: string;
  puzzle: string;
  brand: string;
  pieces: number;
  /** Local URL of the cached box image (served by the render server). */
  img: string;
  /** Credit line required on every post that shows the image (owner decision 2026-10-13). */
  credit: string;
}

const box = (r: Record<string, string>, preset: 'puzzle_large' | 'puzzle_medium' = 'puzzle_large'): Box => ({
  puzzleId: r.puzzle_id, puzzle: r.puzzle, brand: r.brand, pieces: num(r.pieces),
  img: boxPaths(r.image, preset).url, credit: `${r.puzzle} · ${r.brand}`,
});

export function loadContent() {
  const week = rows('boxes-week-top').map(r => ({
    ...box(r), solversWeek: num(r.solvers_week), resultsWeek: num(r.results_week), solversAll: num(r.solvers_all),
    medianSolo: r.median_solo_s ? fmtDuration(num(r.median_solo_s) / 60) : null,
    fastestSolo: r.fastest_solo_s ? fmtDuration(num(r.fastest_solo_s) / 60) : null,
    firstAttemptPct: r.first_attempt_pct ? num(r.first_attempt_pct) : null,
  }));
  const allTime = rows('boxes-alltime-top').map(r => ({ ...box(r), solvers: num(r.solvers), medianSolo: r.median_solo_s ? fmtDuration(num(r.median_solo_s) / 60) : null }));
  const month = rows('boxes-month-top').map(r => ({ ...box(r, 'puzzle_medium'), solvers: num(r.solvers), results: num(r.results) }));
  const monthly = rows('monthly');
  const sep = monthly.find(m => m.month === '2026-09')!;

  return {
    asOf: '13 Oct 2026',
    source: 'Data: myspeedpuzzling.com · 13 Oct 2026',
    weekRange: '5 Oct – 11 Oct 2026',
    /** Puzzle of the week = the most-solved puzzle last week; the rest are runners-up. */
    puzzleOfTheWeek: week[0],
    weekTop: week,
    /** All-time favourites (quizzes: guess the puzzle from a crop; which was faster?). */
    allTime,
    /** September 2026: the 1,000 most-solved puzzles (400 px images) for walls and mosaics. */
    september: {
      label: 'September 2026', boxes: month, results: num(sep.results), active: num(sep.active), pieces: num(sep.pieces),
      distinctPuzzlesShown: month.length,
    },
  };
}

export type Content = ReturnType<typeof loadContent>;
