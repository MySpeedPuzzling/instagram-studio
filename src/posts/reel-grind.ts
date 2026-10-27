// Data for the Reel "Same puzzle. N times." (the grind, owner 2026-10-27; src/motion/reel-grind.ts): the featurable
// puzzler who solved one puzzle solo the most times, every attempt in order (queries/reel-grind-top.sql, the local
// do-not-feature list applied here), the community curve by try (reel-grind-curve) and the gap before a 2nd try by
// size (reel-grind-gaps). Unboxed and suspicious solves are excluded in the queries. `fresh: true` re-queries
// production (the day the Reel is finalised).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { fetchBoxes } from '../data/boxes.ts';
import { query, type QueryResult } from '../data/db.ts';
import { ROOT } from '../render/server.ts';

export interface GrindSpec {
  player: string; country: string; igHandle: string;
  puzzle: string; brand: string; pieces: number; img: string; aspect: number;
  /** Every solve in order (seconds) and its date (ISO). */
  s: number[]; at: string[];
  /** Attempts (1-based) that set a new personal best. */
  pbs: number[];
  best: number; bestAt: number; hours: number;
  /** The first ~5 hours of practice against everything after: tries, hours, seconds gained. */
  knee: { tries: number; h1: number; h2: number; gain1: number; gain2: number };
  /** Typical time vs the 1st solve (ratio) by try 1–10, per size; cohort = grinds with 10+ solves. */
  curve: Record<'500' | '≤200', Array<{ n: number; r: number }>>;
  cohort: Record<'500' | '≤200', number>;
  /** Median days between the 1st and 2nd solve, by size. */
  gapDays: Record<'500' | '≤200' | '1000', number>;
  queriedAt: string;
  /** The query results as used (facts.json). */
  facts: Record<string, QueryResult>;
}

const KNEE_H = 5;

export async function reelGrindSpec(o: { fresh: boolean }): Promise<GrindSpec> {
  const top = query('reel-grind-top', o), curveQ = query('reel-grind-curve', o), gapsQ = query('reel-grind-gaps', o);
  const dnf = new Set<string>((JSON.parse(readFileSync(join(ROOT, 'content/do-not-feature.json'), 'utf8')) as { player_ids: string[] }).player_ids);
  const rank = [...new Set(top.rows.map(r => r.grind_rank))].find(k => !dnf.has(top.rows.find(r => r.grind_rank === k)!.player_id));
  if (!rank) throw new Error('reel-grind: no featurable grind in the top 5');
  const rows = top.rows.filter(r => r.grind_rank === rank);
  const s = rows.map(r => Number(r.seconds)), at = rows.map(r => r.solved_at);
  const runBest = s.map((_, i) => Math.min(...s.slice(0, i + 1)));
  const pbs = s.flatMap((v, i) => (i === 0 || v < runBest[i - 1] ? [i + 1] : []));
  const best = runBest.at(-1)!;
  const cum = s.reduce<number[]>((a, v) => [...a, (a.at(-1) ?? 0) + v / 3600], []);
  const tries = cum.findIndex(v => v >= KNEE_H) + 1;
  const curve = (size: string) => [{ n: 1, r: 1 }, ...curveQ.rows.filter(r => r.size === size).map(r => ({ n: Number(r.attempt), r: 1 - Number(r.pct_faster_than_first) / 100 }))];
  const cohort = (size: string) => Number(curveQ.rows.find(r => r.size === size)?.grinds ?? 0);
  const gap = (size: string) => Number(gapsQ.rows.find(r => r.size === size)?.median_days_between ?? 0);
  const img = (await fetchBoxes([rows[0].image])).get(rows[0].image) ?? '';
  const meta = img ? await sharp(join(ROOT, img.slice(1))).metadata() : {};
  return {
    player: rows[0].player, country: rows[0].country, igHandle: rows[0].ig_handle,
    puzzle: rows[0].puzzle, brand: rows[0].brand, pieces: Number(rows[0].pieces), img, aspect: (meta.width ?? 4) / (meta.height ?? 3),
    s, at, pbs, best, bestAt: s.indexOf(best) + 1, hours: cum.at(-1)!,
    knee: { tries, h1: cum[tries - 1], h2: cum.at(-1)! - cum[tries - 1], gain1: s[0] - runBest[tries - 1], gain2: runBest[tries - 1] - best },
    curve: { '500': curve('500'), '≤200': curve('≤200') },
    cohort: { '500': cohort('500'), '≤200': cohort('≤200') },
    gapDays: { '500': gap('500'), '≤200': gap('≤200'), '1000': gap('1000') },
    queriedAt: [top.queried_at, curveQ.queried_at, gapsQ.queried_at].sort()[0],
    facts: { 'reel-grind-top': top, 'reel-grind-curve': curveQ, 'reel-grind-gaps': gapsQ },
  };
}
