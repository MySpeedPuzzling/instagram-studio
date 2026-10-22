// Data for the Reel "A 1000 isn't twice a 500" (src/motion/reel-1000.ts) from queries/reel-1000-vs-500.sql, plus the
// two box images (cached locally). `fresh: true` re-queries production (the day the Reel goes out).
import { fetchBoxes } from '../data/boxes.ts';
import { query } from '../data/db.ts';
import type { Reel1000Spec } from '../motion/reel-1000.ts';

/** The puzzles the Reel shows (owner 2026-10-21: not the postcards; Speed Puzzling's dark hair read as a missing piece
 *  at board size, so the 1000 is Garden Allotment). Must be among the query's top 10 per size. */
export const REEL_PUZZLES = { p500: 'Air Balloon Valley', p1000: 'Garden Allotment', more500: ['Cute Kawaii Chaos', 'Boathouses in Smogen, Sweden'] };

export async function reel1000Spec(o: { fresh: boolean; pick?: { p500?: string; p1000?: string; more500?: string[] } }): Promise<Reel1000Spec> {
  const q = query('reel-1000-vs-500', { fresh: o.fresh });
  const row = (kind: string, a?: string) => {
    const r = q.rows.find(r => r.kind === kind && (a === undefined || r.a === a));
    if (!r) throw new Error(`reel-1000-vs-500: no ${kind} ${a ?? ''} row`);
    return r;
  };
  const size = (pieces: string) => {
    const r = row('size', pieces), [p25, p50, p75] = r.c.split('/').map(Number);
    return { p25, p50, p75, best: Number(r.d), results: Number(r.b) };
  };
  const same = row('same_puzzlers');
  const top = (kind: string, name?: string) => {
    const r = name ? q.rows.find(r => r.kind === kind && r.a.split(' · ')[0] === name) : row(kind);
    if (!r) throw new Error(`reel-1000-vs-500: ${name} is not among the top ${kind} puzzles`);
    const [puzzle, brand] = r.a.split(' · ');
    return { puzzle, brand, image: r.c };
  };
  const t500 = top('top_500', o.pick?.p500), t1000 = top('top_1000', o.pick?.p1000);
  const extra = (o.pick?.more500 ?? []).map(n => top('top_500', n));
  const imgs = await fetchBoxes([t500.image, t1000.image, ...extra.map(e => e.image)]);
  const box = (t: typeof t500) => ({ puzzle: t.puzzle, brand: t.brand, img: imgs.get(t.image) ?? '' });
  return {
    s500: size('500'), s1000: size('1000'),
    same: { puzzlers: Number(same.a), ratioMedian: Number(same.b), ratioBest: Number(same.c) },
    box500: box(t500), box1000: box(t1000), more500: extra.map(box),
    queriedAt: q.queried_at,
  };
}
