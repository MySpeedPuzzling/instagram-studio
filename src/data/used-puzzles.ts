// Puzzles already shown as examples (editorial/used-puzzles.json; owner 2026-10-23: "remember what puzzle we used
// already as examples/placeholders so we do not repeat them all the time"). Builders pick example boxes with
// pickUnused(); a draft's own entries stay available to it, so re-rendering a draft keeps its pictures.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

export interface UsedPuzzle { puzzle: string; brand: string; draft: string; role: string }

const FILE = join(ROOT, 'editorial/used-puzzles.json');
const key = (puzzle: string, brand: string) => `${puzzle.trim().toLowerCase()}|${brand.trim().toLowerCase()}`;

export function usedPuzzles(): UsedPuzzle[] {
  return (JSON.parse(readFileSync(FILE, 'utf8')) as { used: UsedPuzzle[] }).used;
}

/** Candidates in their given order (e.g. most solved first) minus puzzles other drafts have used; throws when fewer
 *  than `n` are left, so a builder never quietly falls back to a repeat. */
export function pickUnused<T extends { puzzle: string; brand: string }>(candidates: T[], o: { draft: string; n?: number }): T[] {
  const taken = new Set(usedPuzzles().filter(u => u.draft !== o.draft).map(u => key(u.puzzle, u.brand)));
  const free = candidates.filter(c => !taken.has(key(c.puzzle, c.brand)));
  const n = o.n ?? 1;
  if (free.length < n) throw new Error(`pickUnused: only ${free.length} of ${candidates.length} candidates unused, need ${n} (editorial/used-puzzles.json)`);
  return free.slice(0, n);
}
