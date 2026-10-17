// Collection logic on synthetic fixtures (fake usernames, fake ids; no real data, no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DAYS, dayForStoryTimestamp, dayInfo, paths, pragueToUtc } from './advent.ts';
import { attribute, buildEntries, collectDay, doorMarker, fetchStoryReplies, mergeRaw, rankClosest, type RawMessage, type ReplyCandidate, type Window } from './collect.ts';
import { readOnlyIg, ReadOnlyViolation, type ReadOnlyIg } from './ig.ts';
import type { ChoiceKey, DateKey } from './match.ts';
import type { StorySnapshot } from './store.ts';

const key: ChoiceKey = { type: 'choice', question: 'Which is fastest?', options: { A: 'Paris', B: 'London', C: 'New York' }, correct: 'B' };
const W: Window = { opensAt: '2026-12-07T18:00:00.000Z', closesAt: '2026-12-08T18:00:00.000Z' };
const msg = (id: string, user: string, at: string, text: string, extra: Partial<RawMessage> = {}): RawMessage =>
  ({ id, source: 'story-replies', created_time: at, from_id: `id_${user}`, from_username: user, text, story_id: 'S7', attributed: 'id', conversation_id: `c_${user}`, ...extra });
const none = { user_ids: [], usernames: [] };

test('calendar: 24 doors Mon–Sat over four weeks, 19:00 Prague = 18:00 UTC in December', () => {
  assert.equal(DAYS.length, 24);
  assert.deepEqual([DAYS[0].date, DAYS[5].date, DAYS[6].date, DAYS[23].date], ['2026-11-30', '2026-12-05', '2026-12-07', '2026-12-26']);
  assert.ok(DAYS.every(d => d.weekday !== 'Sun'));
  assert.equal(dayInfo(1).storyAt, '2026-11-30T18:00:00.000Z');
  assert.equal(dayInfo(22).date, '2026-12-24');
  assert.equal(pragueToUtc('2026-07-01', '19:00').toISOString(), '2026-07-01T17:00:00.000Z'); // summer time
  assert.equal(dayForStoryTimestamp('2026-12-07T18:04:00Z'), 7);
  assert.equal(dayForStoryTimestamp('2026-12-07T08:00:00Z'), null); // a morning Story isn't the door
  assert.equal(dayForStoryTimestamp('2026-12-13T18:00:00Z'), null); // Sunday
});

test('first parseable answer counts; chatter does not use it up; later answers are duplicates', () => {
  const raw = [
    msg('m1', 'puzzler_a', '2026-12-07T18:10:00.000Z', 'good luck everyone!'),
    msg('m2', 'puzzler_a', '2026-12-07T18:11:00.000Z', 'B'),
    msg('m3', 'puzzler_a', '2026-12-07T18:12:00.000Z', 'no wait, C'),
    msg('m4', 'puzzler_b', '2026-12-07T19:00:00.000Z', 'Paris'),
    msg('m5', 'puzzler_b', '2026-12-07T19:01:00.000Z', 'London'),
  ];
  const e = buildEntries(raw, key, W, none);
  assert.deepEqual(e.map(x => x.verdict), ['unparsed', 'correct', 'duplicate', 'wrong', 'duplicate']);
});

test('late, excluded and username-only exclusion', () => {
  const raw = [
    msg('m1', 'puzzler_c', '2026-12-08T18:00:01.000Z', 'B'),
    msg('m2', 'msp_team', '2026-12-07T18:30:00.000Z', 'B'),
    msg('m3', 'Puzzler_D', '2026-12-07T18:31:00.000Z', 'B'),
  ];
  const e = buildEntries(raw, key, W, { user_ids: ['id_msp_team'], usernames: ['puzzler_d'] });
  assert.deepEqual(e.map(x => x.verdict), ['excluded', 'excluded', 'late']);
});

test('attribution: by Story id; inferred only when every live Story of ours is the day\'s', () => {
  const s7a: StorySnapshot = { id: 'S7a', timestamp: '2026-12-07T18:00:00.000Z', seen_at: '' };
  const s7b: StorySnapshot = { id: 'S7b', timestamp: '2026-12-07T18:00:30.000Z', seen_at: '' };
  const s6: StorySnapshot = { id: 'S6', timestamp: '2026-12-05T18:00:00.000Z', seen_at: '' };
  const other: StorySnapshot = { id: 'X', timestamp: '2026-12-07T20:00:00.000Z', seen_at: '' };
  const c = (id: string, at: string, reply: string | null): ReplyCandidate => ({ id, created_time: at, from_id: `id_${id}`, from_username: `p_${id}`, text: 'B', reply_to_id: reply, conversation_id: `c_${id}` });
  const cands = [c('1', '2026-12-07T18:05:00.000Z', 'S7b'), c('2', '2026-12-07T18:06:00.000Z', null), c('3', '2026-12-07T21:00:00.000Z', null), c('4', '2026-12-07T18:07:00.000Z', 'S6'), c('5', '2026-12-07T18:08:00.000Z', 'SOMEONE_ELSE')];
  const { raw, unattributed } = attribute(cands, [s7a, s7b], [s6, s7a, s7b, other], W);
  assert.deepEqual(raw.map(r => [r.id, r.attributed]), [['1', 'id'], ['2', 'inferred']]);
  assert.equal(unattributed, 1); // reply 3 came while a non-campaign Story was live too
});

test('merge keeps the first-seen text, records edits, flags withdrawn messages (still counted)', () => {
  const first = [msg('m1', 'puzzler_a', '2026-12-07T18:10:00.000Z', 'B'), msg('m2', 'puzzler_b', '2026-12-07T18:20:00.000Z', 'C')];
  const edited = [msg('m1', 'puzzler_a', '2026-12-07T18:10:00.000Z', 'C')]; // m2 unsent
  const merged = mergeRaw(first, edited, { complete: true, since: W.opensAt });
  assert.equal(merged[0].text, 'B');
  assert.deepEqual(merged[0].text_history, ['C']);
  assert.equal(merged[1].withdrawn, true);
  assert.deepEqual(mergeRaw(merged, edited, { complete: true, since: W.opensAt }), merged, 'idempotent');
  const e = buildEntries(merged, key, W, none);
  assert.deepEqual(e.map(x => [x.verdict, !!x.withdrawn]), [['correct', false], ['wrong', true]]);
  // An incomplete read (e.g. a paging error) never flags anything.
  assert.equal(mergeRaw(first, [], { complete: true, incomplete: ['c_puzzler_a', 'c_puzzler_b'], since: W.opensAt })[0].withdrawn, undefined);
});

test('collectDay twice on the same fixture writes byte-identical entries and correct lists', async () => {
  const root = mkdtempSync(join(tmpdir(), 'campaign-test-'));
  try {
    const p = paths('advent-2026', root);
    const stories: StorySnapshot[] = [{ id: 'S7', timestamp: W.opensAt, seen_at: '' }];
    const cands: ReplyCandidate[] = [
      { id: 'm1', created_time: '2026-12-07T18:10:00.000Z', from_id: 'id_a', from_username: 'puzzler_a', text: 'B!', reply_to_id: 'S7', conversation_id: 'ca' },
      { id: 'm2', created_time: '2026-12-07T18:11:00.000Z', from_id: 'id_b', from_username: 'puzzler_b', text: 'Londýn 🎄', reply_to_id: 'S7', conversation_id: 'cb' },
      { id: 'm3', created_time: '2026-12-07T18:12:00.000Z', from_id: 'id_c', from_username: 'puzzler_c', text: 'Paris', reply_to_id: 'S7', conversation_id: 'cc' },
    ];
    const run = () => collectDay({ paths: p, campaign: 'advent-2026', day: '07', source: 'story-replies', key, window: W, dayStories: stories, allStories: stories, now: new Date('2026-12-08T19:00:00Z'), fetch: async () => ({ candidates: cands, complete: true }) });
    const a = await run();
    const read = (f: string) => readFileSync(join(p.day('07'), f), 'utf8');
    const snap = ['entries.json', 'correct.json', 'raw.json', 'audit.md'].map(read);
    const b = await run();
    assert.deepEqual(['entries.json', 'correct.json', 'raw.json', 'audit.md'].map(read), snap);
    assert.equal(a.entriesSha, b.entriesSha);
    assert.equal(b.newMessages, 0);
    assert.ok(a.final);
    assert.deepEqual(JSON.parse(read('correct.json')).map((r: { username: string }) => r.username), ['puzzler_a', 'puzzler_b']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('closest-wins date ranking: days off, ties broken by the earliest reply', () => {
  const k: DateKey = { type: 'date', correct: '2026-11-25', mode: 'closest', year: 2026 };
  const raw = [
    msg('m1', 'puzzler_a', '2026-11-01T10:00:00.000Z', '27 Nov'),
    msg('m2', 'puzzler_b', '2026-11-01T09:00:00.000Z', '23/11'),
    msg('m3', 'puzzler_c', '2026-11-01T11:00:00.000Z', 'Nov 25th'),
    msg('m4', 'puzzler_d', '2026-11-01T12:00:00.000Z', 'hmm, not sure'),
  ];
  const w: Window = { opensAt: '2026-11-01T00:00:00.000Z', closesAt: '2026-11-02T00:00:00.000Z' };
  const r = rankClosest(buildEntries(raw, k, w, none), k.correct!);
  assert.deepEqual(r.map(x => [x.username, x.diff_days]), [['puzzler_c', 0], ['puzzler_b', 2], ['puzzler_a', 2]]);
  assert.deepEqual(buildEntries(raw, { ...k, correct: null }, w, none).map(e => e.verdict), ['pending', 'pending', 'pending', 'unparsed']);
});

test('fetchStoryReplies stops at old conversations, skips our own replies, keeps paging errors local', async () => {
  const conv = { data: [{ id: 'c1', updated_time: '2026-12-07T19:00:00+0000' }, { id: 'c2', updated_time: '2026-12-07T18:30:00+0000' }, { id: 'c3', updated_time: '2026-12-01T10:00:00+0000' }] };
  let calls = 0;
  const fake: ReadOnlyIg = {
    get: (async (path: string) => {
      calls++;
      if (path === 'me/conversations') return conv;
      if (path === 'c1') return { messages: { data: [
        { id: 'a1', created_time: '2026-12-07T18:20:00+0000', from: { id: 'u1', username: 'puzzler_a' }, message: 'B', story: { reply_to: { id: 'S7', link: 'x' } } },
        { id: 'a2', created_time: '2026-12-07T18:21:00+0000', from: { id: 'OUR', username: 'myspeedpuzzling' }, message: 'thanks!', story: { reply_to: { id: 'THEIRS' } } },
        { id: 'a3', created_time: '2026-12-07T18:22:00+0000', from: { id: 'u1', username: 'puzzler_a' }, message: 'plain DM' },
      ], paging: { next: 'https://graph.instagram.com/v25.0/c1?after=1' } } };
      if (path === 'c2') return { messages: { data: [{ id: 'b1', created_time: '2026-12-07T18:25:00+0000', from: { id: 'u2', username: 'puzzler_b' }, message: 'C', story: { reply_to: { link: 'x' } } }] } };
      throw new Error(`unexpected ${path}`);
    }) as ReadOnlyIg['get'],
    all: async () => [],
    next: async () => { throw new Error('(#100) message has been deleted'); },
  };
  const r = await fetchStoryReplies(fake, { since: '2026-12-07T18:00:00.000Z', us: { ids: ['OUR'], username: 'myspeedpuzzling' }, pauseMs: 0, maxPagesPerConversation: 3 });
  assert.deepEqual(r.candidates!.map(c => [c.id, c.reply_to_id]), [['a1', 'S7'], ['b1', null]]);
  assert.deepEqual(r.incomplete, ['c1']);
  assert.equal(r.conversations, 2); // c3 is older than the window
  assert.ok(calls >= 3);
});

test('the campaign client is GET only', () => {
  const ro = readOnlyIg('fake-token-for-test');
  assert.throws(() => (ro as unknown as { post: unknown }).post, ReadOnlyViolation);
  assert.throws(() => (ro as unknown as { delete: unknown }).delete, ReadOnlyViolation);
  assert.equal(typeof ro.get, 'function');
});

test('door marker: plain DMs answer a door by number; the earlier of a Story reply and a DM counts', () => {
  assert.deepEqual(doorMarker('Door 7: B'), { door: 7, rest: 'B' });
  assert.deepEqual(doorMarker('day 7 - London'), { door: 7, rest: 'London' });
  assert.deepEqual(doorMarker('D7) b'), { door: 7, rest: 'b' });
  assert.deepEqual(doorMarker('Tür 12: C'), { door: 12, rest: 'C' });
  assert.equal(doorMarker('B'), null);
  assert.equal(doorMarker('Did you see this?'), null);
  const s7: StorySnapshot = { id: 'S7', timestamp: W.opensAt, seen_at: '' };
  const c = (id: string, at: string, text: string, extra: Partial<ReplyCandidate>): ReplyCandidate => ({ id, created_time: at, from_id: 'id_a', from_username: 'puzzler_a', text, reply_to_id: null, conversation_id: 'ca', ...extra });
  const cands = [c('d1', '2026-12-07T18:05:00.000Z', 'C', { door: 7 }), c('r1', '2026-12-07T18:06:00.000Z', 'B', { reply_to_id: 'S7' }), c('d2', '2026-12-07T18:07:00.000Z', 'B', { door: 8 })];
  const { raw } = attribute(cands, [s7], [s7], W, 7);
  assert.deepEqual(raw.map(r => [r.id, r.source]), [['d1', 'dm'], ['r1', 'story-replies']]);
  assert.deepEqual(buildEntries(raw, key, W, none).map(e => [e.message_id, e.verdict]), [['d1', 'wrong'], ['r1', 'duplicate']]);
});

test('fetch guards: unchanged conversations are skipped, a repeating cursor stops, the call budget ends a run softly', async () => {
  const conv = { data: [{ id: 'c1', updated_time: '2026-12-07T19:00:00+0000' }, { id: 'c2', updated_time: '2026-12-07T18:50:00+0000' }] };
  const page = { data: [{ id: 'x1', created_time: '2026-12-07T18:40:00+0000', from: { id: 'u2', username: 'puzzler_b' }, message: 'B', story: { reply_to: { id: 'S7' } } }], paging: { next: 'https://graph.instagram.com/v25.0/c2/messages?after=same' } };
  let nexts = 0;
  const fake: ReadOnlyIg = {
    get: (async (path: string) => (path === 'me/conversations' ? conv : { messages: page })) as ReadOnlyIg['get'],
    all: async () => [],
    next: (async () => { nexts++; return page; }) as ReadOnlyIg['next'], // the same page again and again
  };
  const r = await fetchStoryReplies(fake, { since: '2026-12-07T18:00:00.000Z', us: { ids: [], username: 'myspeedpuzzling' }, pauseMs: 0, maxPagesPerConversation: 6, read: { c1: '2026-12-07T19:00:00+0000' } });
  assert.equal(r.skipped, 1);
  assert.ok(r.incomplete!.includes('c1'));
  assert.equal(nexts, 1, 'a page with no new message ends the paging');
  assert.deepEqual(r.candidates!.map(c => c.id), ['x1']);
  assert.equal(r.read!.c2, '2026-12-07T18:50:00+0000');
  const tight = await fetchStoryReplies(fake, { since: '2026-12-07T18:00:00.000Z', us: { ids: [], username: 'myspeedpuzzling' }, pauseMs: 0, maxCalls: 1 });
  assert.equal(tight.complete, false);
  assert.match(tight.errors!.join(' '), /call budget/);
});
