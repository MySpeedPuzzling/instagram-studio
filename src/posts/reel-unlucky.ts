// Data for the Reel "The cruellest 13 seconds" (Friday the 13th, owner pick 2026-11-13 after the pile-of-shame hit:
// shared pain + humour, ends on "your closest near miss?") from queries/unlucky-13.sql (solo 500s that finished just
// over / just under the hour), wall-500.sql (results per whole minute: the pile-up before 1:00:00) and
// unlucky-13-boxes.sql (the board's picture: a black cat, for Friday the 13th). Also the follow-up Story "300 million
// pieces: guess the day" (bs-milestone-pace) with a poll-sticker zone. `fresh: true` re-queries production.
import { fetchBoxes } from '../data/boxes.ts';
import { query } from '../data/db.ts';
import { pickUnused } from '../data/used-puzzles.ts';
import { GROUNDS, STICKER_STORY_ROWS, f1, frame, hero, heroFit, type Variant } from '../design/house.ts';
import { fmtInt } from '../design/page.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';

/** Owner-facing pick (2026-11-13): a black cat crossing your path, on Friday the 13th. */
export const UNLUCKY_PUZZLE = 'Black Cat and Raven';
/** The stopwatch drama on the splash: starts here (59:47: exactly 13 seconds left, owner 2026-11-13) and stops when the last piece lands (1:00:02). */
export const CLOCK = { from: 3587, to: 3602 } as const;

export interface ReelUnluckySpec {
  missed: number;        // solo 500s finished 1:00:00–1:00:13
  missedPuzzlers: number;
  made: number;          // solo 500s finished 59:47–59:59
  wall: Array<{ minute: number; results: number }>; // 50–69 min
  box: { puzzle: string; brand: string; img: string };
  queriedAt: string;
}

export async function reelUnluckySpec(o: { fresh: boolean; draft: string }): Promise<{ spec: ReelUnluckySpec; facts: Record<string, unknown> }> {
  const u = query('unlucky-13', { fresh: o.fresh });
  const w = query('wall-500', { fresh: o.fresh });
  const bx = query('unlucky-13-boxes', { fresh: o.fresh });
  const r = u.rows[0];
  const cands = bx.rows.map(x => ({ puzzle: x.puzzle, brand: x.brand, image: x.image }));
  const [pick] = pickUnused([...cands.filter(x => x.puzzle === UNLUCKY_PUZZLE), ...cands], { draft: o.draft });
  const imgs = await fetchBoxes([pick.image], 'puzzle_large');
  const spec: ReelUnluckySpec = {
    missed: Number(r.missed_hour_by_0_13s), missedPuzzlers: Number(r.puzzlers_missed), made: Number(r.made_hour_by_1_13s),
    wall: w.rows.map(x => ({ minute: Number(x.minute), results: Number(x.results) })).filter(x => x.minute >= 50 && x.minute <= 69),
    box: { puzzle: pick.puzzle, brand: pick.brand, img: imgs.get(pick.image) ?? '' },
    queriedAt: u.queried_at,
  };
  return { spec, facts: { 'unlucky-13': u, 'wall-500': w, 'unlucky-13-boxes': bx } };
}

// ------------------------------------------------------------------ Story: 300 million pieces, guess the day

export interface MillionFacts { pieces: number; queriedAt: string }

export function millionFacts(fresh: boolean): { f: MillionFacts; facts: Record<string, unknown> } {
  const m = query('bs-milestone-pace', { fresh });
  return { f: { pieces: Number(m.rows[0].pieces), queriedAt: m.queried_at }, facts: { 'bs-milestone-pace': m } };
}

/**
 * Sticker Story: the running piece count, a strip of ten generator pieces (one per 30 million; the tenth filled as far
 * as we've got) and "Guess the day we pass 300 million"; the poll sticker (4 days) goes in the free band by hand.
 */
export function millionStory(v: Variant, f: MillionFacts): string {
  const n = 10, pw = 88, jig = generateJigsaw({ cols: n, rows: 1, width: n * pw, height: pw, seed: 13, tabSize: 0.26, jitter: 0.03 });
  const per = 30_000_000, full = Math.floor(f.pieces / per), part = (f.pieces - full * per) / per;
  const x0 = (1080 - n * pw) / 2, y0 = 800;
  const coral = GROUNDS.coral.bg, band = GROUNDS.navy.band ?? '#2e3747';
  const pcs = jig.pieces.sort((a, b) => a.col - b.col).map(p => {
    const fill = p.col < full ? coral : band;
    return `<path d="${p.d}" fill="${fill}" stroke="#222a38" stroke-width="4" stroke-linejoin="round"/>`;
  }).join('');
  const last = jig.pieces.find(p => p.col === full);
  const partial = last ? `<clipPath id="pc"><rect x="${f1(last.bbox.x)}" y="-40" width="${f1(last.bbox.width * part)}" height="${pw + 80}"/></clipPath>
    <path d="${last.d}" fill="${coral}" clip-path="url(#pc)"/><path d="${last.d}" fill="none" stroke="#ffb0ab" stroke-width="4" stroke-dasharray="10 8" stroke-linejoin="round"/>` : '';
  const size = heroFit(fmtInt(f.pieces), 150, 900);
  return frame({
    ground: 'navy', kind: 'story', kicker: 'Coming soon · 300 million pieces', device: v.device, src: `All logged results · data ${f.queriedAt.slice(0, 10)}`,
    rows: STICKER_STORY_ROWS, masthead: true,
    body: `<p class="h-abs h-cap" style="top:430px; text-align:center">Pieces logged on MySpeedPuzzling so far</p>
      ${hero(fmtInt(f.pieces), { size, baseline: 470 + size * 0.95, center: true })}
      <svg width="${n * pw}" height="${pw}" viewBox="0 0 ${n * pw} ${pw}" style="position:absolute; left:${x0}px; top:${y0}px; overflow:visible" aria-hidden="true">${pcs}${partial}</svg>
      <p class="h-abs h-lab" style="top:${y0 + pw + 34}px; text-align:center">Each piece = 30 million. Only <b style="color:var(--g-hot-text)">${fmtInt(300_000_000 - f.pieces)}</b> to go.</p>
      <h1 class="h-title" style="top:1060px; font-size:76px; line-height:1.06; text-align:center">Guess the day we<br><span style="color:var(--g-hot)">pass 300 million</span></h1>`,
  });
}
