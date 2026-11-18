// Data for the Reel "300 million pieces" (owner pick 2026-11-18: concept 1 "Origin story", funny + celebratory):
// bs-milestone-pace (totals, hours, pace), milestone-300m-day (the crossing day), msp-story (puzzlers, countries),
// msp-story-months (Nov 2023 = the first month with real logging) and quiz-postcards (the London and New York
// postcards that the chain of pieces joins). `fresh: true` re-queries production.
import { fetchBoxes } from '../data/boxes.ts';
import { query } from '../data/db.ts';

/** One piece edge of a 500-piece Ravensburger (49 × 36 cm → √(1764 / 500) ≈ 1.88 cm); kept at the brainstorm's 1.87. */
export const PIECE_CM = 1.87;
/** London to New York, great circle, km (rounded). */
export const LON_NYC_KM = 5570;
/** The month the story starts in (owner 2026-11-18: "Data: Nov 2023"): the first full month after the first commit. */
export const ORIGIN_MONTH = '2023-11-01';
/** MSP's birthday: the first commit of the app repo (LICENSE, 24 Oct 2023 21:34; owner 2026-11-18). */
export const FIRST_COMMIT = '2023-10-24';

export interface Reel300mSpec {
  pieces: number;            // all logged pieces now
  hours: number;             // stopwatch hours, all results
  years: number;             // hours / 24 / 365.25
  resultsPerDay: number;     // last 28 days
  crossedOn: string;         // first day whose end-of-day total ≥ 300M (YYYY-MM-DD)
  originResults: number;     // results logged in ORIGIN_MONTH
  puzzlers: number;
  countries: number;
  chainKm: number;           // 300M pieces × PIECE_CM, rounded to 100 km
  startYear: number;         // the year a non-stop solve of `years` would have started
  london: { puzzle: string; brand: string; img: string; aspect: number };
  nyc: { puzzle: string; brand: string; img: string; aspect: number };
  queriedAt: string;
}

export async function reel300mSpec(o: { fresh: boolean }): Promise<{ spec: Reel300mSpec; facts: Record<string, unknown> }> {
  const pace = query('bs-milestone-pace', { fresh: o.fresh });
  const day = query('milestone-300m-day', { fresh: o.fresh });
  const story = query('msp-story', { fresh: o.fresh });
  const months = query('msp-story-months', { fresh: o.fresh });
  const pc = query('quiz-postcards', { fresh: o.fresh });
  const p = pace.rows[0], s = story.rows[0];
  const crossed = day.rows.find(r => Number(r.total_at_day_end) >= 300_000_000);
  if (!crossed) throw new Error('300M not crossed in milestone-300m-day');
  const origin = months.rows.find(r => String(r.month).slice(0, 10) === ORIGIN_MONTH);
  if (!origin) throw new Error(`no ${ORIGIN_MONTH} row in msp-story-months`);
  const find = (re: RegExp) => { const r = pc.rows.find(x => re.test(String(x.puzzle))); if (!r) throw new Error(`postcard ${re} missing`); return r; };
  const lon = find(/^London Postcard$/), ny = find(/^New York Postcard$/);
  const imgs = await fetchBoxes([lon.image, ny.image], 'puzzle_large');
  const sharp = (await import('sharp')).default;
  const { ROOT } = await import('../render/server.ts');
  const { join } = await import('node:path');
  const box = async (r: Record<string, any>) => {
    const img = imgs.get(r.image) ?? '';
    const m = await sharp(join(ROOT, img.slice(1))).metadata();
    return { puzzle: String(r.puzzle), brand: String(r.brand), img, aspect: (m.width ?? 4) / (m.height ?? 3) };
  };
  const years = Number(p.years), queriedAt = pace.queried_at;
  const spec: Reel300mSpec = {
    pieces: Number(p.pieces), hours: Number(p.hours), years, resultsPerDay: Number(p.results_per_day),
    crossedOn: String(crossed.day).slice(0, 10), originResults: Number(origin.results),
    puzzlers: Number(s.puzzlers), countries: Number(s.countries),
    chainKm: Math.round((300_000_000 * PIECE_CM) / 1e5 / 100) * 100,
    startYear: Math.round(Number(queriedAt.slice(0, 4)) + (Number(queriedAt.slice(5, 7)) - 1) / 12 - years),
    london: await box(lon), nyc: await box(ny), queriedAt,
  };
  return { spec, facts: { 'bs-milestone-pace': pace, 'milestone-300m-day': day, 'msp-story': story, 'msp-story-months': months, 'quiz-postcards': pc } };
}
