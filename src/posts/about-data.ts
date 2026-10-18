// Facts for the Start here post (src/posts/about.ts): the queries, the box images and the spec the slides render from.
// The draft tool runs it fresh (owner rule: fresh data on the day); labs reuse the cached results (fresh: false).
import { query, type QueryResult } from '../data/db.ts';
import { fetchBoxes } from '../data/boxes.ts';
import type { AboutSpec } from './about.ts';

export async function buildAboutSpec({ fresh }: { fresh: boolean }): Promise<{ spec: AboutSpec & { asOf: string }; facts: Record<string, QueryResult> }> {
  const com = query('about-community', { fresh }), types = query('about-types', { fresh }), tot = query('totals', { fresh });
  const imp = query('about-improvement', { fresh }), fast = query('about-fastest-500', { fresh }), evq = query('upcoming-events', { fresh }), bx = query('about-brand-boxes', { fresh });
  // The owner's box for the cover (and Ravensburger's tile on the wall), instead of the postcard from the recent quiz.
  const pick = query('about-cover-puzzle', { fresh });
  const wall = bx.rows.slice(0, 12).map(r => (pick.rows[0] && r.brand === pick.rows[0].brand ? pick.rows[0] : r));
  const c = com.rows[0], k = Object.fromEntries(types.rows.map(r => [r.kind, r]));
  if (!c || !k.solo || !k.duo || !k.team || imp.rows.length < 4 || bx.rows.length < 8) throw new Error('about: a query came back incomplete');
  // Events window: today (Prague) and the next 6 weeks.
  const from = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' }), weeks = 6;
  const until = new Date(Date.parse(from) + weeks * 7 * 86_400_000).toISOString().slice(0, 10);
  const upcoming = evq.rows.filter(r => r.date_from >= from && r.date_from < until).map(r => ({ date: r.date_from, country: r.country, online: r.is_online === 't' }));
  const imgs = await fetchBoxes(wall.map(r => r.image));
  const spec: AboutSpec = {
    // Pinned and evergreen (owner 2026-10-18): the footer says the month, not the day.
    key: 'about', src: `myspeedpuzzling.com · ${new Date(com.queried_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })}, growing daily`,
    players: Number(c.players), countries: Number(c.countries), puzzles: Number(c.puzzles), brands: Number(c.brands),
    kinds: { solo: Number(k.solo.results), duo: Number(k.duo.results), team: Number(k.team.results), hours: types.rows.reduce((t, r) => t + Number(r.hours), 0) },
    pieces: Number(tot.rows[0].pieces),
    improve: {
      puzzlers: Number(imp.rows[0].puzzlers), points: imp.rows.map(r => [Number(r.attempt), Number(r.median_min)] as [number, number]),
      shareFaster: Number(imp.rows[0].pct_faster_by_20), medianGainPct: Number(imp.rows[0].median_pct_faster_by_20),
    },
    fastest500s: Number(fast.rows[0].fastest_s),
    eventsTotal: Number(c.events), upcoming, from, weeks,
    boxes: wall.map(r => ({ puzzle: r.puzzle, brand: r.brand, img: imgs.get(r.image)! })),
  };
  const asOf = new Date(com.queried_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { spec: { ...spec, asOf }, facts: { 'about-community': com, 'about-types': types, totals: tot, 'about-improvement': imp, 'about-fastest-500': fast, 'upcoming-events': evq, 'about-brand-boxes': bx, 'about-cover-puzzle': pick } };
}
