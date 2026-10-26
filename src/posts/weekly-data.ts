// Facts for the Weekly Numbers (src/posts/weekly.ts): the queries, the box images and the spec the slides render from.
// Every query counts solves *finished* in the last full ISO week (Mon–Sun): about 1 in 6 results logged in a week are
// older solves typed in later, and they'd otherwise top "most solves" and could pass for the week's fastest.
// The draft tool runs it fresh on Monday (owner rule: fresh data on the day); labs reuse the cache (fresh: false).
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fetchBoxes } from '../data/boxes.ts';
import { query, type QueryResult } from '../data/db.ts';
import { doNotFeature, invalidHandles } from '../data/featuring.ts';
import { ROOT } from '../render/server.ts';
import type { ActiveRow, FastRow, Kind, Person, Segment, WeeklySpec } from './weekly.ts';

const num = Number;

/** Deterministic 32-bit generator (mulberry32), so the shoutout draw is the same every time it's re-run. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Display names without emoji (slides use the house font only; the QA rejects emoji in graphics). */
const plainName = (n: string) => n.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu, '')
  // no handles on slides (standing rule): "Feifei (@feifeipuzzle)" → "Feifei"
  .replace(/\(?\s*@[A-Za-z0-9._]+\s*\)?/g, ' ').replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim();
/** A handle we can photo-tag: lowercase (Instagram ignores case), never one Instagram rejected before. */
const badHandles = invalidHandles();
const tagHandle = (raw: string | null | undefined) => { const v = raw?.toLowerCase(); return v && !badHandles.has(v) ? v : undefined; };
const flagOk = (cc: string | undefined) => !!cc && /^[A-Z]{2}$/.test(cc) && existsSync(join(ROOT, 'node_modules/circle-flags/flags', `${cc.toLowerCase()}.svg`));
const person = (r: { [k: string]: string | null | undefined }): Person => ({
  id: r.player_id!, name: plainName(r.player ?? r.name ?? ''), country: flagOk(r.country ?? undefined) ? r.country! : undefined, handle: tagHandle(r.ig_handle),
});

export interface WeeklyOptions { fresh: boolean; season: number; episode: number; segments: Segment[]; question: string; shoutouts?: number }

export async function buildWeeklySpec(o: WeeklyOptions): Promise<{ spec: WeeklySpec; facts: Record<string, QueryResult> }> {
  const names = ['weekly-totals', 'weekly-days', 'weekly-fastest', 'weekly-groups', 'weekly-active', 'weekly-pool', 'weekly-facts', 'weekly-biggest', 'boxes-week-top'] as const;
  const q = Object.fromEntries(names.map(n => [n, query(n, { fresh: o.fresh })])) as Record<typeof names[number], QueryResult>;
  const t = q['weekly-totals'].rows[0], f = q['weekly-facts'].rows[0], days = q['weekly-days'].rows;
  if (!t || !f || days.length !== 7 || q['boxes-week-top'].rows.length < 5) throw new Error('weekly: a query came back incomplete');
  const blocked = doNotFeature();

  const start = new Date(t.week_start + 'T00:00:00Z'), end = new Date(start.getTime() + 6 * 86_400_000);
  const md = (d: Date) => `${d.getUTCDate()} ${d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}`; // en-GB gives "Sept"
  const range = start.getUTCMonth() === end.getUTCMonth() ? `${start.getUTCDate()}–${md(end)} ${end.getUTCFullYear()}` : `${md(start)} – ${md(end)} ${end.getUTCFullYear()}`;

  // Fastest: solo from weekly-fastest (one row per puzzler), pairs and teams from weekly-groups (every member featurable).
  const fast: FastRow[] = [
    ...q['weekly-fastest'].rows.filter(r => !blocked.has(r.player_id)).map(r => ({
      kind: 'solo' as Kind, pieces: num(r.pieces), seconds: num(r.seconds), firstAttempt: r.first_attempt === 't', puzzle: r.puzzle, brand: r.brand, people: [person(r)], image: r.image || undefined,
    })),
    ...q['weekly-groups'].rows.map(r => ({ r, people: (JSON.parse(r.members) as Array<{ player_id: string; name: string; country: string | null; ig_handle: string | null }>).map(person) }))
      .filter(({ people }) => people.every(p => !blocked.has(p.id)))
      .map(({ r, people }) => ({
        kind: r.type as Kind, pieces: num(r.pieces), seconds: num(r.seconds), firstAttempt: r.first_attempt === 't', puzzle: r.puzzle, brand: r.brand, people, teamName: r.team_name || undefined, image: r.image || undefined,
      })),
  ];

  const active: ActiveRow[] = q['weekly-active'].rows.filter(r => !blocked.has(r.player_id) && plainName(r.player ?? ''))
    .map(r => ({ kind: r.type as Kind, person: person(r), results: num(r.results), pieces: num(r.pieces), image: r.last_image || undefined }));

  const top = q['boxes-week-top'].rows.slice(0, 5);

  // Shoutout draw: everyone who solved something, minus anyone already named on another slide, drawn with a seed made
  // from the week (same week → same three, however often the draft is re-rendered).
  const shown = new Set([...fast.flatMap(r => r.people.map(p => p.id)), ...active.map(a => a.person.id)]);
  const pool = q['weekly-pool'].rows.filter(r => !blocked.has(r.player_id) && r.player.trim());
  const seed = parseInt(createHash('sha256').update(`msp-weekly-shoutout:${t.week_start}`).digest('hex').slice(0, 8), 16);
  // Shuffle the whole pool (sorted by id in SQL) once, then take the first ones not named elsewhere: a late-logged time
  // that changes another slide can only swap out a puzzler who just landed on that slide, never reshuffle the draw.
  const rand = rng(seed), order = [...pool];
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const picks = order.filter(r => !shown.has(r.player_id)).slice(0, o.shoutouts ?? 3);

  // Who finished the biggest puzzle (owner 2026-10-26: a shoutout with their avatar on the week slide). Only results
  // whose every member is featurable come back from SQL; do-not-feature drops the whole result here.
  const bigRows = q['weekly-biggest'].rows, bigOk = new Set(bigRows.map(r => r.time_id));
  for (const r of bigRows) if (blocked.has(r.player_id)) bigOk.delete(r.time_id);
  const bigPeople = [...new Map(bigRows.filter(r => bigOk.has(r.time_id)).map(r => [r.player_id, r])).values()].slice(0, 4);
  const bigOne = bigPeople.length === 1 ? bigPeople[0] : undefined;
  const avatars = bigOne?.avatar ? await fetchBoxes([bigOne.avatar], 'puzzle_medium') : new Map<string, string>();

  const imgs = await fetchBoxes([...(bigRows[0]?.image ? [bigRows[0].image] : []), ...new Set([...top.map(r => r.image), ...picks.map(r => r.last_image), ...fast.map(r => r.image), ...active.map(r => r.image)].filter((x): x is string => !!x))]);
  for (const r of [...fast, ...active]) if (r.image) r.img = imgs.get(r.image);
  const spec: WeeklySpec = {
    key: 'weekly', season: o.season, episode: o.episode, segments: o.segments, question: o.question,
    weekStart: t.week_start, range, src: `Data: myspeedpuzzling.com · ${range}`,
    results: num(t.results), resultsPrev: num(t.results_prev), puzzlers: num(t.puzzlers), pieces: num(t.pieces),
    newPuzzlers: num(t.new_puzzlers), personalBests: num(t.personal_bests),
    days: days.map(d => ({ weekday: d.weekday, day: d.day, results: num(d.results) })),
    median500s: num(days[0].week_median_solo500_s), solo500Results: num(days[0].week_solo500_results),
    top: top.map(r => ({ puzzle: r.puzzle, brand: r.brand, pieces: num(r.pieces), solvers: num(r.solvers_week), img: imgs.get(r.image)! })),
    fast, active,
    shout: picks.map(r => ({ person: person(r), results: num(r.results), seconds: r.shown_seconds ? num(r.shown_seconds) : undefined, kind: r.shown_type as Kind, puzzle: r.last_puzzle, brand: r.last_brand, pieces: num(r.last_pieces), img: r.last_image ? imgs.get(r.last_image) : undefined })),
    poolSize: q['weekly-pool'].rows.length,
    week: { hours: num(f.hours), countries: num(f.countries), puzzles: num(f.puzzles), firstEver: num(f.first_ever_puzzles), added: num(f.puzzles_added),
      biggest: { puzzle: f.biggest_puzzle, brand: f.biggest_brand, pieces: num(f.biggest_pieces), people: bigPeople.map(person),
        seconds: bigOne?.seconds ? num(bigOne.seconds) : undefined, img: bigRows[0]?.image ? imgs.get(bigRows[0].image) : undefined,
        avatar: bigOne?.avatar ? avatars.get(bigOne.avatar) : undefined }, firstAttemptPct: num(f.solo_first_attempt_pct) },
  };
  return { spec, facts: q };
}
