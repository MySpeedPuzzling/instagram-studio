// Data for the Reel "Your extra hour" (clocks go back in Europe, night of 24–25 Oct 2026; src/motion/reel-clock-*.ts):
// solo 500/1000 times from queries/reel-1000-vs-500.sql (via reel1000Spec), the 500 box pictures from
// queries/theme-ravensburger-500.sql (night/time themes, the most solved first, minus puzzles other posts already showed:
// editorial/used-puzzles.json), and last year's repeated-hour stopwatch count from queries/clock-change-night.sql.
// `fresh: true` re-queries production (the day the Reel goes out).
import { fetchBoxes } from '../data/boxes.ts';
import { query } from '../data/db.ts';
import { pickUnused } from '../data/used-puzzles.ts';
import type { ClockSpec } from '../motion/reel-clock-kit.ts';
import { REEL_PUZZLES, reel1000Spec } from './reel-1000.ts';

export async function reelClockSpec(o: { fresh: boolean; draft: string }): Promise<ClockSpec> {
  const r = await reel1000Spec({ fresh: o.fresh, pick: REEL_PUZZLES });
  const q = query('clock-change-night', { fresh: o.fresh });
  const last = q.rows.find(x => x.night === '2025-10-26');
  const th = query('theme-ravensburger-500', { fresh: o.fresh });
  const picks = pickUnused(th.rows.map(x => ({ puzzle: x.puzzle, brand: x.brand, image: x.image })), { draft: o.draft, n: 3 });
  const imgs = await fetchBoxes(picks.map(p => p.image));
  return {
    s500: { p50: r.s500.p50, best: r.s500.best, results: r.s500.results },
    s1000: { p50: r.s1000.p50, best: r.s1000.best },
    boxes500: picks.map(p => ({ puzzle: p.puzzle, brand: p.brand, img: imgs.get(p.image) ?? '' })),
    box1000: r.box1000,
    lastYear: { puzzlers: last ? Number(last.puzzlers) : 0 },
    queriedAt: [r.queriedAt, q.queried_at, th.queried_at].sort()[0],
  };
}
