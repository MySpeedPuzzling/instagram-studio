// Daily answer collection (read-only): reads the day's answers, checks them against the answer key and stores every
// entry plus the list of people who answered correctly, with an audit file per day.
//
// Sources:
//   story-replies  replies to our quiz Story. They arrive as Instagram DMs carrying story.reply_to {id, link}
//                  (verified on our inbox 2026-10-17). The same field also marks replies WE send to other people's
//                  Stories, so only messages from others whose reply_to.id is one of the day's Stories count. A reply
//                  without an id is attributed by time ("inferred") only when every Story of ours live at that moment
//                  belongs to the day.
//   comments       comments (and replies) on one feed post, within the window: the fallback route.
//
// Idempotent: raw.json is a union of messages keyed by message id (the first copy seen is kept), and entries.json /
// correct.json / audit.md are a pure function of (raw union, key, window, exclusions). Run timestamps only go to runs.jsonl.
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { dayInfo, pad2, WINDOW_MS, type Paths } from './advent.ts';
import { isoUtc, sleep, type ReadOnlyIg } from './ig.ts';
import { matchAnswer, type AnswerKey } from './match.ts';
import { appendJsonl, loadExcluded, readJson, stableJson, writeAtomic, writeJson, type Excluded, type StorySnapshot } from './store.ts';

/** `dm`: a plain message (not a Story reply) starting with a door marker, "Door 7: B" (accessibility fallback). */
export type Source = 'story-replies' | 'comments' | 'dm';
export type EntryVerdict = 'correct' | 'wrong' | 'unparsed' | 'duplicate' | 'late' | 'excluded' | 'pending' | 'answered';

export interface RawMessage {
  id: string;
  source: Source;
  created_time: string;
  from_id: string;
  from_username: string;
  text: string;
  /** The Story it replies to (story-replies); null when Instagram left the id out. */
  story_id: string | null;
  /** How the message was tied to the day: by Story id, inferred by time, or by the comment window. */
  attributed: 'id' | 'inferred' | 'window';
  conversation_id?: string;
  parent_id?: string;
  /** Later texts of the same message (DMs can be edited since 2025-09); the verdict always uses the first-seen `text`. */
  text_history?: string[];
  /** The message was unsent/deleted after we received it. It still counts as the person's first answer, so editing or
   *  unsending can't be used to try twice. */
  withdrawn?: boolean;
}

export interface Entry {
  message_id: string;
  source: Source;
  at: string;
  user_id: string;
  username: string;
  text: string;
  parsed: string | number | null;
  verdict: EntryVerdict;
  reason: string;
  attributed: RawMessage['attributed'];
  withdrawn?: boolean;
}

export interface Window { opensAt: string; closesAt: string }
export interface Us { ids: string[]; username: string }

/** A candidate Story reply from the inbox, before it is tied to a day. */
export interface ReplyCandidate { id: string; created_time: string; from_id: string; from_username: string; text: string; reply_to_id: string | null; conversation_id: string; is_deleted?: boolean; /** The reply carries a photo, GIF, sticker or voice note instead of (or with) text. */ has_attachment?: boolean; /** Plain DM with a door marker: the door it names (text is the rest). */ door?: number }

/** "Door 7: B", "day 7 - London", "D7) b", "Tür 7: B", "dveře 7 B": a plain DM answering a door by number. */
export const DOOR_MARKER = /^\s*(?:door|d|day|tür|tur|dveře|dvere|den)\s*#?\s*(\d{1,2})\s*[:.\-–)]?\s*(.+)$/is;
export function doorMarker(text: string): { door: number; rest: string } | null {
  const m = text.match(DOOR_MARKER);
  return m ? { door: Number(m[1]), rest: m[2].trim() } : null;
}

/** What a fetch saw, so a missing message can be told apart from one we simply didn't read. */
export interface FetchResult {
  candidates?: ReplyCandidate[];
  raw?: RawMessage[];
  /** Every message since `since` was read (no errors, no early stop). */
  complete?: boolean;
  /** Conversations whose paging failed (e.g. Instagram's 20-newest-messages limit); their absences mean nothing. */
  incomplete?: string[];
  errors?: string[];
  calls?: number;
  conversations?: number;
  /** Conversation read state to keep for the next run (story-replies). */
  read?: Record<string, string>;
  skipped?: number;
}

const MESSAGE_FIELDS = 'messages.limit(50){id,created_time,from,message,story,attachments,is_deleted}';
const MESSAGE_FIELDS_BASIC = 'messages.limit(50){id,created_time,from,message,story,attachments}';

// ------------------------------------------------------------------ fetching (GET only)

export class BudgetExceeded extends Error {}
/** Instagram/Meta rate-limit errors (codes 4, 17, 32, 613; "request limit reached"): stop the whole run at once. */
export const isRateLimit = (e: unknown) => {
  const x = e as { code?: number; status?: number; message?: string };
  return [4, 17, 32, 613].includes(Number(x?.code)) || /request limit|rate limit|too many calls/i.test(String(x?.message ?? ''));
};

/**
 * Every message in our inbox since `since` that replies to a Story and was not sent by us. Conversations come newest
 * first; we stop at the first one last updated before `since`, and inside a conversation at the first older message.
 * Instagram documents detail access to only the 20 newest messages of a conversation; the conversation's messages edge
 * returns more in practice. If paging a conversation fails we stop there, note it, and carry on (that's why the
 * scheduled job also collects during the day, not only after the Story expires).
 */
export async function fetchStoryReplies(ig: ReadOnlyIg, o: { since: string; us: Us; pauseMs?: number; maxConversations?: number; maxCalls?: number; maxPagesPerConversation?: number; /** conversation id → updated_time already read in an earlier run (skipped when unchanged). */ read?: Record<string, string> }): Promise<FetchResult> {
  const out: ReplyCandidate[] = [];
  const errors: string[] = [], incomplete: string[] = [];
  let calls = 0, conversations = 0, complete = true;
  const pause = o.pauseMs ?? 120;
  // Guards (2026-10-17: a repeating cursor once burned ~95 calls on one conversation and hit the app's request limit):
  // a call budget per run, a page cap per conversation, stop when a page brings no new message, abort on rate limits.
  // Paging the /messages edge answered with error #4 (app request limit) at once on 2026-10-17, so by default we read
  // only the first page (up to 50 newest messages: a day's replies fit) and flag a conversation that may hold more.
  const maxCalls = o.maxCalls ?? 600, maxPages = o.maxPagesPerConversation ?? 1;
  const read: Record<string, string> = { ...(o.read ?? {}) };
  let skipped = 0;
  const budget = () => { if (calls >= maxCalls) throw new BudgetExceeded(`call budget of ${maxCalls} reached`); };
  let fields = MESSAGE_FIELDS;
  let page = await ig.get<{ data: Array<{ id: string; updated_time: string }>; paging?: { next?: string } }>('me/conversations', { platform: 'instagram', fields: 'id,updated_time', limit: 50 });
  calls++;
  try {
  outer: for (;;) {
    for (const c of page.data) {
      if (isoUtc(c.updated_time) < o.since) break outer;
      if (o.maxConversations && conversations >= o.maxConversations) { complete = false; break outer; }
      // Unchanged since an earlier run: nothing new to read (its messages are already in raw.json).
      if (read[c.id] && read[c.id] === c.updated_time) { skipped++; incomplete.push(c.id); continue; }
      conversations++;
      let msgs: { data: any[]; paging?: { next?: string } } | undefined;
      budget();
      try {
        msgs = (await ig.get<{ messages?: { data: any[]; paging?: { next?: string } } }>(c.id, { fields })).messages;
      } catch (e) {
        if (isRateLimit(e)) throw e;
        // Older API versions reject is_deleted: fall back to the basic fields once, for the whole run.
        if (fields === MESSAGE_FIELDS && /is_deleted|nonexisting field|\(#100\)/i.test(String((e as Error).message))) {
          fields = MESSAGE_FIELDS_BASIC;
          msgs = (await ig.get<{ messages?: { data: any[]; paging?: { next?: string } } }>(c.id, { fields })).messages;
        } else { errors.push(`conversation …${c.id.slice(-6)}: ${(e as Error).message.slice(0, 160)}`); incomplete.push(c.id); continue; }
      }
      calls++;
      const seenIds = new Set<string>();
      let pages = 1;
      for (;;) {
        let older = false, freshIds = 0;
        for (const m of msgs?.data ?? []) {
          if (seenIds.has(m.id)) continue;
          seenIds.add(m.id);
          freshIds++;
          if (!m.created_time) continue;
          const at = isoUtc(m.created_time);
          if (at < o.since) { older = true; continue; }
          const reply = m.story?.reply_to;
          const fromId = String(m.from?.id ?? ''), fromName = String(m.from?.username ?? '');
          if (o.us.ids.includes(fromId) || fromName.toLowerCase() === o.us.username.toLowerCase()) continue;
          const text = String(m.message ?? '');
          const marker = !reply && !m.story ? doorMarker(text) : null;
          if (!reply && !marker) continue;
          out.push({ id: m.id, created_time: at, from_id: fromId, from_username: fromName, text: marker ? marker.rest : text, reply_to_id: reply?.id ? String(reply.id) : null, conversation_id: c.id, ...(m.is_deleted ? { is_deleted: true } : {}), ...(m.attachments?.data?.length ? { has_attachment: true } : {}), ...(marker ? { door: marker.door } : {}) });
        }
        if (older || !msgs?.paging?.next || !freshIds) break;
        if (pages >= maxPages) { errors.push(`conversation …${c.id.slice(-6)}: more than ${pages} page(s) of messages since the window opened; older ones not read`); incomplete.push(c.id); break; }
        await sleep(pause);
        budget();
        // The edge's next page must carry the same fields (a bare cursor URL returns only id + created_time).
        const next = new URL(msgs.paging.next);
        if (!next.searchParams.has('fields')) next.searchParams.set('fields', fields.replace(/^messages\.limit\(50\)\{(.*)\}$/, '$1'));
        try { msgs = await ig.next(next.toString()); calls++; pages++; }
        catch (e) { calls++; if (isRateLimit(e)) throw e; errors.push(`conversation …${c.id.slice(-6)} paging: ${(e as Error).message.slice(0, 160)}`); incomplete.push(c.id); break; }
      }
      if (!incomplete.includes(c.id)) read[c.id] = c.updated_time;
      await sleep(pause);
    }
    if (!page.paging?.next) break;
    budget();
    page = await ig.next(page.paging.next);
    calls++;
  }
  } catch (e) {
    if (!(e instanceof BudgetExceeded)) throw e;
    errors.push(`${e.message}: partial read, the next run continues`);
    complete = false;
  }
  return { candidates: out, conversations, calls, errors, incomplete, complete, read, skipped };
}

/**
 * Comments and replies on one media, as raw messages inside the window (fallback route). The API can't filter by time,
 * so we page newest → oldest and stop once a page reaches past the window start.
 */
export async function fetchComments(ig: ReadOnlyIg, o: { mediaId: string; window: Window; us: Us; pauseMs?: number }): Promise<FetchResult> {
  const fields = 'id,text,timestamp,username,from{id,username},replies{id,text,timestamp,username,from{id,username}}';
  const rows: any[] = [];
  let calls = 1;
  let page = await ig.get<{ data: any[]; paging?: { next?: string } }>(`${o.mediaId}/comments`, { fields, limit: 50 });
  for (;;) {
    let past = false;
    for (const c of page.data ?? []) {
      rows.push(c);
      if (isoUtc(c.timestamp) < o.window.opensAt) past = true;
      let rep = c.replies;
      while (rep) {
        for (const r of rep.data ?? []) rows.push({ ...r, parent_id: c.id });
        rep = rep.paging?.next ? (calls++, await ig.next(rep.paging.next)) : null;
      }
    }
    if (past || !page.paging?.next) break;
    await sleep(o.pauseMs ?? 120);
    page = await ig.next(page.paging.next);
    calls++;
  }
  const raw = rows
    .map(c => ({ c, at: isoUtc(c.timestamp) }))
    .filter(({ c, at }) => at >= o.window.opensAt && !o.us.ids.includes(String(c.from?.id ?? '')) && String(c.from?.username ?? c.username ?? '').toLowerCase() !== o.us.username.toLowerCase())
    .map(({ c, at }) => ({
      id: String(c.id), source: 'comments' as const, created_time: at, from_id: String(c.from?.id ?? ''), from_username: String(c.from?.username ?? c.username ?? ''),
      text: String(c.text ?? ''), story_id: null, attributed: 'window' as const, ...(c.parent_id ? { parent_id: String(c.parent_id) } : {}),
    }));
  return { raw, complete: true, calls };
}

// ------------------------------------------------------------------ pure logic

/** The day's window: from its first Story to 24 h after its last (falls back to the calendar slot). */
export function dayWindow(dayStories: StorySnapshot[], fallback: Window): Window {
  const ts = dayStories.map(s => s.timestamp).filter(Boolean).map(isoUtc).sort();
  if (!ts.length) return fallback;
  return { opensAt: ts[0], closesAt: new Date(Date.parse(ts[ts.length - 1]) + WINDOW_MS).toISOString() };
}

/** Ties inbox replies to the day: by Story id, or inferred by time when every Story of ours live then is the day's;
 *  plain DMs with a door marker count for that door inside its window (`door` = the day number). */
export function attribute(cands: ReplyCandidate[], dayStories: StorySnapshot[], allStories: StorySnapshot[], window: Window, door?: number): { raw: RawMessage[]; unattributed: number } {
  const dayIds = new Set(dayStories.map(s => s.id));
  const raw: RawMessage[] = [];
  let unattributed = 0;
  for (const c of cands) {
    if (c.created_time < window.opensAt) continue;
    let how: RawMessage['attributed'] | null = null;
    if (c.door !== undefined) {
      if (door !== undefined && c.door === door) raw.push({ id: c.id, source: 'dm', created_time: c.created_time, from_id: c.from_id, from_username: c.from_username, text: c.text, story_id: null, attributed: 'window', conversation_id: c.conversation_id, ...(c.is_deleted ? { withdrawn: true } : {}) });
      continue;
    }
    if (c.reply_to_id) how = dayIds.has(c.reply_to_id) ? 'id' : null;
    else {
      const t = Date.parse(c.created_time);
      const live = allStories.filter(s => s.timestamp && Date.parse(isoUtc(s.timestamp)) <= t && t < Date.parse(isoUtc(s.timestamp)) + WINDOW_MS);
      if (live.length && live.every(s => dayIds.has(s.id))) how = 'inferred';
      else if (c.created_time <= window.closesAt) unattributed++;
    }
    if (!how) continue;
    raw.push({ id: c.id, source: 'story-replies', created_time: c.created_time, from_id: c.from_id, from_username: c.from_username, text: c.text, story_id: c.reply_to_id, attributed: how, conversation_id: c.conversation_id, ...(c.is_deleted ? { withdrawn: true } : {}) });
  }
  return { raw, unattributed };
}

/**
 * Union by message id. The first-seen text is kept (the rules: "your first answer as we received it counts"); a changed
 * text is added to text_history. A stored message that a complete fetch no longer returns (or that comes back deleted)
 * is flagged withdrawn: it still counts as that person's first answer. Re-running on the same input changes nothing.
 */
export function mergeRaw(existing: RawMessage[], fresh: RawMessage[], seen: { complete?: boolean; incomplete?: string[]; since?: string } = {}): RawMessage[] {
  const byId = new Map(existing.map(m => [m.id, { ...m }]));
  const freshIds = new Set(fresh.map(m => m.id));
  for (const m of fresh) {
    const old = byId.get(m.id);
    if (!old) { byId.set(m.id, { ...m }); continue; }
    if (m.text && m.text !== old.text && !(old.text_history ?? []).includes(m.text)) old.text_history = [...(old.text_history ?? []), m.text];
    if (m.withdrawn) old.withdrawn = true;
  }
  if (seen.complete) {
    const skip = new Set(seen.incomplete ?? []);
    for (const m of byId.values()) {
      if (freshIds.has(m.id) || m.withdrawn) continue;
      if (m.conversation_id && skip.has(m.conversation_id)) continue;
      if (seen.since && m.created_time < seen.since) continue;
      m.withdrawn = true;
    }
  }
  return [...byId.values()].sort((a, b) => a.created_time.localeCompare(b.created_time) || a.id.localeCompare(b.id));
}

/**
 * One entry per message, in time order. The first parseable answer of each person counts (correct/wrong); unparseable
 * chatter doesn't use up the answer; later answers are duplicates; answers after the window are late; our own and
 * excluded accounts are excluded.
 */
export function buildEntries(raw: RawMessage[], key: AnswerKey, window: Window, excluded: Excluded): Entry[] {
  const counted = new Set<string>();
  const ex = new Set(excluded.user_ids), exNames = new Set(excluded.usernames);
  return [...raw].sort((a, b) => a.created_time.localeCompare(b.created_time) || a.id.localeCompare(b.id)).map(m => {
    const user = m.from_id || `name:${m.from_username.toLowerCase()}`;
    const base = { message_id: m.id, source: m.source, at: m.created_time, user_id: m.from_id, username: m.from_username.toLowerCase(), text: m.text, attributed: m.attributed, ...(m.withdrawn ? { withdrawn: true } : {}) };
    if (ex.has(m.from_id) || exNames.has(m.from_username.toLowerCase())) return { ...base, parsed: null, verdict: 'excluded' as const, reason: 'excluded account' };
    if (m.created_time > window.closesAt) return { ...base, parsed: null, verdict: 'late' as const, reason: `after the window closed (${window.closesAt})` };
    const r = matchAnswer(m.text, key);
    if (r.verdict === 'unparsed') return { ...base, parsed: null, verdict: 'unparsed' as const, reason: r.reason };
    if (counted.has(user)) return { ...base, parsed: r.parsed, verdict: 'duplicate' as const, reason: 'a first answer already counts' };
    counted.add(user);
    return { ...base, parsed: r.parsed, verdict: r.verdict, reason: r.reason };
  });
}

export interface CorrectRow { user_id: string; username: string; at: string; message_id: string }
export const correctOf = (entries: Entry[]): CorrectRow[] => entries.filter(e => e.verdict === 'correct')
  .map(e => ({ user_id: e.user_id, username: e.username, at: e.at, message_id: e.message_id }))
  .sort((a, b) => a.username.localeCompare(b.username) || a.user_id.localeCompare(b.user_id));

export const countVerdicts = (entries: Entry[]) => Object.fromEntries((['correct', 'wrong', 'unparsed', 'duplicate', 'late', 'excluded', 'pending', 'answered'] as const).map(v => [v, entries.filter(e => e.verdict === v).length]).filter(([v, n]) => n || !['pending', 'answered'].includes(v as string)));

export interface ClosestRow { rank: number; user_id: string; username: string; guess: string; diff_days: number; at: string; message_id: string }
/** Closest-wins ranking (date keys): |guess − correct| in days, ties broken by the earliest reply. */
export function rankClosest(entries: Entry[], correct: string): ClosestRow[] {
  return entries.filter(e => e.verdict === 'answered' && typeof e.parsed === 'string')
    .map(e => ({ user_id: e.user_id, username: e.username, guess: e.parsed as string, diff_days: Math.round(Math.abs(Date.parse(e.parsed as string) - Date.parse(correct)) / 86_400_000), at: e.at, message_id: e.message_id }))
    .sort((a, b) => a.diff_days - b.diff_days || a.at.localeCompare(b.at) || a.message_id.localeCompare(b.message_id))
    .map((r, i) => ({ rank: i + 1, ...r }));
}

function keySummary(k: AnswerKey): string {
  switch (k.type) {
    case 'choice': return `choice ${Object.entries(k.options).map(([l, v]) => `${l}=${v}`).join(', ')}; correct ${k.correct}`;
    case 'order': return `order of ${Object.entries(k.options).map(([l, v]) => `${l}=${v}`).join(', ')}; correct ${k.correct}`;
    case 'number': return `number ${k.correct}${k.unit ? ' ' + k.unit : ''} ±${Math.max(k.tolerance?.abs ?? 0, (k.tolerance?.rel ?? 0) * k.correct)}`;
    case 'time': return `time ${k.correct} ±${k.tolerance?.abs ?? 60} s`;
    case 'text': return `name: ${k.accept.join(' / ')} (typo ratio ${k.maxEditRatio ?? 0.2})`;
    case 'date': return `date, closest wins; true date ${k.correct ?? 'not known yet'}`;
  }
}

/** Readable audit (local, gitignored: it holds usernames). Deterministic: no run times. */
export function auditMarkdown(o: { campaign: string; day: string; source: Source; window: Window; stories: StorySnapshot[]; key: AnswerKey; entries: Entry[]; unattributed: number }): string {
  const c = countVerdicts(o.entries);
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 80);
  return [
    `# ${o.campaign} · day ${o.day} · audit`, '',
    `- Source: ${o.source}${o.stories.length ? ` · Stories: ${o.stories.map(s => s.id).join(', ')}` : ''}`,
    `- Window (UTC): ${o.window.opensAt} → ${o.window.closesAt}`,
    `- Question: ${o.key.question ?? '(not in key)'}`,
    `- Key: ${keySummary(o.key)}`,
    `- Messages: ${o.entries.length} · ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    `- Replies to our Stories in the window that could not be tied to a day: ${o.unattributed}`,
    `- Rule: one answer per person, the first parseable answer as received counts (later edits are kept in raw.json as text_history; unsent answers stay counted and show "withdrawn"); unparsed messages are listed for review.`,
    `- Note: Instagram doesn't return message requests (non-followers) idle for 30+ days; irrelevant inside a 24 h window.`, '',
    '| time (UTC) | user | answer | read as | verdict | tied by | reason |', '|---|---|---|---|---|---|---|',
    ...o.entries.map(e => `| ${e.at.slice(0, 19)} | @${e.username} | ${esc(e.text)} | ${e.parsed ?? ''} | ${e.verdict}${e.withdrawn ? ' (withdrawn)' : ''} | ${e.attributed} | ${esc(e.reason)} |`),
    ...(o.key.type === 'date' && o.key.correct ? ['', `## Closest to ${o.key.correct}`, '', '| rank | user | guess | days off | replied (UTC) |', '|---|---|---|---|---|',
      ...rankClosest(o.entries, o.key.correct).map(r => `| ${r.rank} | @${r.username} | ${r.guess} | ${r.diff_days} | ${r.at.slice(0, 19)} |`)] : []),
    '',
  ].join('\n');
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export interface CollectResult { dir: string; window: Window; fetched: number; newMessages: number; total: number; counts: Record<string, number>; unattributed: number; final: boolean; entriesSha: string; errors: string[] }

/** Grace after the window closes before a day counts as final (late replies may still be in flight). */
export const FINAL_GRACE_MS = 15 * 60_000;

/**
 * Collect one day: fetch → attribute → merge → entries → files. `fetch` is injected so tests run on fixtures.
 * `day` is the day number (Advent) or any label for a test campaign.
 */
export async function collectDay(o: {
  paths: Paths; campaign: string; day: string; source: Source; key: AnswerKey; window: Window; now?: Date;
  dayStories?: StorySnapshot[]; allStories?: StorySnapshot[];
  fetch: () => Promise<FetchResult>;
}): Promise<CollectResult> {
  const now = o.now ?? new Date();
  const dir = o.paths.day(o.day);
  const got = await o.fetch();
  let fresh: RawMessage[] = got.raw ?? [];
  let unattributed = 0;
  if (got.candidates) {
    const a = attribute(got.candidates, o.dayStories ?? [], o.allStories ?? [], o.window, /^\d+$/.test(o.day) ? Number(o.day) : undefined);
    fresh = a.raw;
    unattributed = a.unattributed;
  }
  const existing = readJson<RawMessage[]>(join(dir, 'raw.json'), []);
  const raw = mergeRaw(existing, fresh, { complete: got.complete, incomplete: got.incomplete, since: o.window.opensAt });
  const entries = buildEntries(raw, o.key, o.window, loadExcluded(o.paths));
  const correct = correctOf(entries);
  const entriesText = stableJson(entries);
  writeJson(join(dir, 'raw.json'), raw);
  writeAtomic(join(dir, 'entries.json'), entriesText);
  writeJson(join(dir, 'correct.json'), correct);
  if (o.key.type === 'date' && o.key.correct) writeJson(join(dir, 'closest.json'), { correct: o.key.correct, top3: rankClosest(entries, o.key.correct).slice(0, 3) });
  // The unattributed count changes with what the inbox holds at run time, so it only goes to runs.jsonl; the audit file
  // shows the latest final count from final.json when present.
  const final = now.getTime() >= Date.parse(o.window.closesAt) + FINAL_GRACE_MS;
  const prevFinal = readJson<{ unattributed?: number } | null>(join(dir, 'final.json'), null);
  writeAtomic(join(dir, 'audit.md'), auditMarkdown({ campaign: o.campaign, day: o.day, source: o.source, window: o.window, stories: o.dayStories ?? [], key: o.key, entries, unattributed: final ? unattributed : prevFinal?.unattributed ?? unattributed }));
  const counts = countVerdicts(entries);
  const entriesSha = sha256(entriesText);
  if (final) writeJson(join(dir, 'final.json'), { window: o.window, counts, entries_sha256: entriesSha, unattributed, source: o.source });
  const errors = got.errors ?? [];
  if (got.read) writeJson(join(dir, 'conversations-read.json'), got.read);
  appendJsonl(join(dir, 'runs.jsonl'), { run_at: now.toISOString(), source: o.source, fetched: fresh.length, new_messages: raw.length - existing.length, total: raw.length, counts, unattributed, final, entries_sha256: entriesSha, calls: got.calls ?? null, conversations: got.conversations ?? null, complete: got.complete ?? null, errors });
  return { dir, window: o.window, fetched: fresh.length, newMessages: raw.length - existing.length, total: raw.length, counts, unattributed, final, entriesSha, errors };
}

/** Calendar window of an Advent day (used until its Stories are known). */
export const calendarWindow = (day: number): Window => { const d = dayInfo(day); return { opensAt: d.storyAt, closesAt: d.closesAt }; };
export const dayLabel = (day: number | string) => (typeof day === 'number' || /^\d+$/.test(String(day)) ? pad2(day) : String(day));
