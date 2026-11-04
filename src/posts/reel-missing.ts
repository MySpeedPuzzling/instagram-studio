// Data for the Reel "WHERE IS IT?" (the missing piece, owner 2026-11-04, concept A in docs/ideas/reel-missing-piece.md)
// from queries/reel-missing-piece.sql (notes that say a piece was missing), bs-comment-words (cats vs dogs mentioned in
// notes) and reel-missing-boxes.sql (the board's picture: a cat puzzle, the cat being the prime suspect).
// `fresh: true` re-queries production (the day the Reel goes out).
import { fetchBoxes } from '../data/boxes.ts';
import { query } from '../data/db.ts';
import { pickUnused } from '../data/used-puzzles.ts';

/** Owner-facing pick (2026-11-04): ten kittens on a shelf = a whole line-up of suspects. */
export const MISSING_PUZZLE = 'Cats on the Shelf';

export interface ReelMissingSpec {
  notes: number;       // all result notes (public profiles, not suspicious)
  missing: number;     // notes that say a piece was missing (negations like "no missing pieces" left out)
  foundLater: number;  // of those, notes that also say it was found
  cats: number; dogs: number; // all notes mentioning cats / dogs
  box: { puzzle: string; brand: string; img: string };
  queriedAt: string;
}

export async function reelMissingSpec(o: { fresh: boolean; draft: string }): Promise<{ spec: ReelMissingSpec; facts: Record<string, unknown> }> {
  const mp = query('reel-missing-piece', { fresh: o.fresh });
  const cw = query('bs-comment-words', { fresh: o.fresh });
  const bx = query('reel-missing-boxes', { fresh: o.fresh });
  const r = mp.rows[0], c = cw.rows[0];
  const cands = bx.rows.map(x => ({ puzzle: x.puzzle, brand: x.brand, image: x.image }));
  const preferred = cands.filter(x => x.puzzle === MISSING_PUZZLE);
  const [pick] = pickUnused([...preferred, ...cands], { draft: o.draft });
  const imgs = await fetchBoxes([pick.image], 'puzzle_large');
  const spec: ReelMissingSpec = {
    notes: Number(r.notes), missing: Number(r.missing), foundLater: Number(r.found_later),
    cats: Number(c.cat), dogs: Number(c.dog),
    box: { puzzle: pick.puzzle, brand: pick.brand, img: imgs.get(pick.image) ?? '' },
    queriedAt: mp.queried_at,
  };
  return { spec, facts: { 'reel-missing-piece': mp, 'bs-comment-words': cw, 'reel-missing-boxes': bx } };
}
