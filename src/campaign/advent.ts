// Advent of Puzzle 2026: the campaign calendar and where its local (gitignored) store lives.
// Design: docs/ideas/advent-of-puzzle.md. Four weeks of six daily quiz Stories ("doors", Mon–Sat, 19:00 Prague),
// each answered by replying to the Story (an Instagram DM); a seeded draw every Sunday among the week's correct answers.
// Every time here is computed for Europe/Prague and stored in UTC.
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

export const CAMPAIGN_ID = 'advent-2026';
export const TZ = 'Europe/Prague';
/** When the daily quiz Story goes up (Prague time). */
export const STORY_TIME = '19:00';
/** How long a Story's answers count: its 24 hours. */
export const WINDOW_MS = 24 * 3600_000;
/** Instagram account id of @myspeedpuzzling is read from the API (`me`), never hard-coded. */

export interface CampaignDay {
  day: number;
  week: number;
  /** Prague calendar date of the Story, YYYY-MM-DD. */
  date: string;
  weekday: string;
  /** Scheduled Story time (UTC ISO). The real window uses the Story's own timestamp when known. */
  storyAt: string;
  /** storyAt + 24 h (UTC ISO). */
  closesAt: string;
}

export interface CampaignWeek { week: number; days: number[]; drawDate: string }

/** Offset of `tz` from UTC at instant `d`, in ms (CET +1 h, CEST +2 h). */
export function tzOffsetMs(d: Date, tz = TZ): number {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d);
  const g = (t: string) => Number(p.find(x => x.type === t)!.value);
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - Math.floor(d.getTime() / 1000) * 1000;
}

/** A Prague wall-clock time (date YYYY-MM-DD, time HH:MM) as a UTC Date. */
export function pragueToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let t = naive;
  for (let i = 0; i < 3; i++) t = naive - tzOffsetMs(new Date(t));
  return new Date(t);
}

/** Prague calendar date (YYYY-MM-DD) and HH:MM of a UTC instant. */
export function pragueParts(d: Date): { date: string; time: string; weekday: string } {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(d);
  const g = (t: string) => p.find(x => x.type === t)!.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}`, weekday: g('weekday') };
}

const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Week 1 starts Monday 30 Nov 2026 (the day after the 1st Advent Sunday); 4 × (Mon–Sat quizzes + a Sunday draw). */
export const FIRST_MONDAY = '2026-11-30';

export const DAYS: CampaignDay[] = Array.from({ length: 24 }, (_, i) => {
  const week = Math.floor(i / 6) + 1;
  const date = addDays(FIRST_MONDAY, (week - 1) * 7 + (i % 6));
  const at = pragueToUtc(date, STORY_TIME);
  return { day: i + 1, week, date, weekday: pragueParts(at).weekday, storyAt: at.toISOString(), closesAt: new Date(at.getTime() + WINDOW_MS).toISOString() };
});

export const WEEKS: CampaignWeek[] = [1, 2, 3, 4].map(w => ({ week: w, days: DAYS.filter(d => d.week === w).map(d => d.day), drawDate: addDays(FIRST_MONDAY, (w - 1) * 7 + 6) }));

export const dayInfo = (n: number): CampaignDay => {
  const d = DAYS.find(x => x.day === n);
  if (!d) throw new Error(`no campaign day ${n} (1–24)`);
  return d;
};
export const weekInfo = (n: number): CampaignWeek => {
  const w = WEEKS.find(x => x.week === n);
  if (!w) throw new Error(`no campaign week ${n} (1–4)`);
  return w;
};

/** The Advent day whose Story slot a Story posted at `ts` belongs to: posted on that day's Prague date, 12:00–23:59. */
export function dayForStoryTimestamp(ts: string): number | null {
  const p = pragueParts(new Date(ts));
  const d = DAYS.find(x => x.date === p.date);
  return d && p.time >= '12:00' ? d.day : null;
}

// ------------------------------------------------------------------ store paths (all under gitignored content/)

export const STORE_ROOT = join(ROOT, 'content/campaign');
export const pad2 = (n: number | string) => String(n).padStart(2, '0');

export function paths(campaign = CAMPAIGN_ID, root = STORE_ROOT) {
  const base = join(root, campaign);
  return {
    base,
    stories: join(base, 'stories.jsonl'),
    storyMap: join(base, 'story-map.json'),
    excluded: join(base, 'excluded.json'),
    alerts: join(base, 'alerts.log'),
    status: join(base, 'status.json'),
    lock: join(base, '.tick.lock'),
    key: (day: number | string) => join(base, 'keys', `day-${pad2(day)}.json`),
    day: (day: number | string) => join(base, `day-${pad2(day)}`),
    week: (week: number) => join(base, `week-${week}`),
    launchd: join(root, 'launchd'),
  };
}
export type Paths = ReturnType<typeof paths>;
