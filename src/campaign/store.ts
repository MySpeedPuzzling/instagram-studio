// Local campaign store (gitignored content/campaign/<campaign>/): small JSON files written atomically with a stable
// key order, so running a command twice on the same input produces byte-identical files.
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { dayForStoryTimestamp, type Paths } from './advent.ts';

/** JSON with object keys sorted (arrays keep their order), two-space indent, trailing newline. */
export function stableJson(v: unknown): string {
  const sort = (x: unknown): unknown => Array.isArray(x) ? x.map(sort)
    : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x as object).sort().map(k => [k, sort((x as Record<string, unknown>)[k])])) : x;
  return JSON.stringify(sort(v), null, 2) + '\n';
}

export function writeAtomic(file: string, text: string) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, text, { mode: 0o600 });
  renameSync(tmp, file);
}
export const writeJson = (file: string, v: unknown) => writeAtomic(file, stableJson(v));
export function readJson<T>(file: string, fallback: T): T {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback;
}
export function appendJsonl(file: string, row: unknown) {
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(row) + '\n', { mode: 0o600 });
}
export function readJsonl<T>(file: string): T[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as T);
}

// ------------------------------------------------------------------ excluded accounts

export interface Excluded { user_ids: string[]; usernames: string[] }
export function loadExcluded(p: Paths): Excluded {
  const e = readJson<Partial<Excluded>>(p.excluded, {});
  return { user_ids: (e.user_ids ?? []).map(String), usernames: (e.usernames ?? []).map(u => u.toLowerCase().replace(/^@/, '')) };
}

// ------------------------------------------------------------------ our Stories: snapshots and the day map

export interface StorySnapshot { id: string; timestamp: string; seen_at: string; media_type?: string }

/** Every Story of ours seen live (me/stories only lists live ones, so the scheduled job snapshots them while they run). */
export function knownStories(p: Paths): StorySnapshot[] {
  const byId = new Map<string, StorySnapshot>();
  for (const s of readJsonl<StorySnapshot>(p.stories)) if (!byId.has(s.id)) byId.set(s.id, s);
  return [...byId.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
}

/** Appends Stories not seen before; returns the new ones. */
export function recordStories(p: Paths, live: Array<{ id: string; timestamp: string; media_type?: string }>, now = new Date()): StorySnapshot[] {
  const seen = new Set(knownStories(p).map(s => s.id));
  const fresh = live.filter(s => !seen.has(s.id)).map(s => ({ id: s.id, timestamp: s.timestamp, seen_at: now.toISOString(), ...(s.media_type ? { media_type: s.media_type } : {}) }));
  for (const s of fresh) appendJsonl(p.stories, s);
  return fresh;
}

/** Day → our Story ids for that door. Manual entries (`collect --story <id>`) win; otherwise a Story posted on the
 *  day's Prague date after 12:00 belongs to that day (both evening frames: yesterday's answer and today's quiz). */
export interface StoryMap { manual: Record<string, string[]> }
export function loadStoryMap(p: Paths): StoryMap { return readJson<StoryMap>(p.storyMap, { manual: {} }); }
export function setManualStories(p: Paths, day: number | string, ids: string[]) {
  const m = loadStoryMap(p);
  m.manual[String(day)] = [...new Set([...(m.manual[String(day)] ?? []), ...ids])].sort();
  writeJson(p.storyMap, m);
}
export function storiesForDay(p: Paths, day: number | string, dayOf: (ts: string) => number | string | null = dayForStoryTimestamp): StorySnapshot[] {
  const all = knownStories(p);
  const manual = loadStoryMap(p).manual[String(day)];
  if (manual?.length) return manual.map(id => all.find(s => s.id === id) ?? { id, timestamp: '', seen_at: '' });
  return all.filter(s => String(dayOf(s.timestamp)) === String(day));
}
