// Pools, the seeded draw and the public audit on synthetic data (fake usernames; no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { paths } from './advent.ts';
import { sha256, type CorrectRow } from './collect.ts';
import { buildPool, makeSeed, publicAudit, purgePlan, redactDraw, runDraw, ticketScore, weekPool, winnerDraft, writeDraw } from './draw.ts';

const row = (u: string): CorrectRow => ({ user_id: `id_${u}`, username: u, at: '2026-12-01T18:30:00.000Z', message_id: `m_${u}` });
const days = ['1', '2', '3', '4', '5', '6'];
// a: all six; b: two days; c: one day; d: none.
const correctByDay = Object.fromEntries(days.map(d => [d, [row('puzzler_a'), ...(['1', '2'].includes(d) ? [row('puzzler_b')] : []), ...(d === '6' ? [row('puzzler_c')] : [])]]));

test('eligibility rules', () => {
  const pool = (rule: 'all6' | 'any' | 'tickets', prev: string[] = []) => buildPool({ campaign: 'advent-2026', week: 1, days, correctByDay, rule, previousWinners: prev });
  assert.deepEqual(pool('all6').members.map(m => [m.username, m.tickets]), [['puzzler_a', 1]]);
  assert.deepEqual(pool('any').members.map(m => [m.username, m.tickets]), [['puzzler_a', 1], ['puzzler_b', 1], ['puzzler_c', 1]]);
  assert.deepEqual(pool('tickets').members.map(m => [m.username, m.tickets]), [['puzzler_a', 6], ['puzzler_b', 2], ['puzzler_c', 1]]);
  assert.equal(pool('tickets').tickets, 9);
  const p = pool('tickets', ['id_puzzler_a']);
  assert.deepEqual(p.members.map(m => m.username), ['puzzler_b', 'puzzler_c']);
  assert.deepEqual(p.excluded_previous_winners, ['puzzler_a']);
  const missing = buildPool({ campaign: 'advent-2026', week: 1, days, correctByDay: { ...correctByDay, '4': null }, rule: 'any' });
  assert.deepEqual(missing.missing_days, ['4']);
});

test('draw: reproducible, checked against the commitment, lowest score wins, back-ups are other people', () => {
  const secret = 'a'.repeat(64);
  const pool = buildPool({ campaign: 'advent-2026', week: 1, days, correctByDay, rule: 'tickets' });
  const r1 = runDraw(pool, secret, sha256(secret), new Date('2026-12-06T18:30:00Z'));
  const r2 = runDraw(pool, secret, sha256(secret), new Date('2026-12-06T18:30:00Z'));
  assert.deepEqual(r1, r2);
  assert.equal(r1.tickets, 9);
  const all = pool.members.flatMap(m => Array.from({ length: m.tickets }, (_, i) => ticketScore(secret, 'advent-2026', 1, `${m.username}#${i + 1}`))).sort();
  assert.equal(r1.winner.score, all[0]);
  assert.ok(r1.backups.every(b => b.user_id !== r1.winner.user_id));
  assert.equal(new Set(r1.backups.map(b => b.user_id)).size, r1.backups.length);
  assert.throws(() => runDraw(pool, secret, sha256('b'.repeat(64))), /commitment/);
  assert.notEqual(runDraw(pool, 'c'.repeat(64), sha256('c'.repeat(64))).winner.score, r1.winner.score);
});

test('the public audit names only the winner and lists every score', () => {
  const secret = 'd'.repeat(64);
  const pool = buildPool({ campaign: 'advent-2026', week: 1, days, correctByDay, rule: 'tickets' });
  const r = runDraw(pool, secret, sha256(secret));
  const md = publicAudit(r);
  const others = pool.members.map(m => m.username).filter(u => u !== r.winner.username);
  for (const u of others) assert.ok(!md.includes(u), `audit leaks ${u}`);
  assert.ok(md.includes(`@${r.winner.username}`));
  assert.ok(md.includes(secret) && md.includes(sha256(secret)));
  for (const t of r.ranked) assert.ok(md.includes(t.score));
  assert.ok(!/id_puzzler/.test(md));
  const d = winnerDraft(r, { prize: 'a test voucher' });
  for (const u of others) assert.ok(!d.caption.includes(u));
  assert.match(d.caption, /never ask for payment/);
});

test('seed → week pool → draw files, seed never overwritten, draw never repeated, purge plan', () => {
  const root = mkdtempSync(join(tmpdir(), 'campaign-draw-'));
  try {
    const p = paths('advent-2026', root);
    const rec = makeSeed(p, 'advent-2026', 1);
    const secret = JSON.parse(readFileSync(join(p.week(1), 'seed.secret.json'), 'utf8')).secret;
    assert.equal(sha256(secret), rec.commitment);
    assert.throws(() => makeSeed(p, 'advent-2026', 1), /already has a seed/);
    for (const d of days) { mkdirSync(p.day(d), { recursive: true }); writeFileSync(join(p.day(d), 'correct.json'), JSON.stringify(correctByDay[d])); writeFileSync(join(p.day(d), 'final.json'), '{}'); }
    const pool = weekPool(p, 'advent-2026', 1, 'tickets');
    assert.equal(pool.tickets, 9);
    const r = runDraw(pool, secret, rec.commitment);
    writeDraw(p, r, pool);
    assert.ok(existsSync(join(p.week(1), 'draw-public.md')) && existsSync(join(p.week(1), 'winner', 'caption.txt')));
    assert.throws(() => writeDraw(p, r, pool), /already drawn/);
    // Week 2 excludes the week-1 winner by default.
    assert.ok(!weekPool(p, 'advent-2026', 2, 'tickets').members.some(m => m.user_id === r.winner.user_id));
    const plan = purgePlan(p, days.map(d => ({ dir: p.day(d), closesAt: '2026-12-06T18:00:00.000Z' })), [{ dir: p.week(1), drawDate: '2026-12-06' }], '2027-02-25');
    assert.equal(plan.delete.filter(f => f.endsWith('correct.json')).length, 6);
    assert.ok(plan.redact[0].endsWith('draw.json'));
    const red = redactDraw(r);
    assert.ok(red.ranked.every(t => t.user_id === r.winner.user_id || t.username === ''));
    assert.deepEqual(purgePlan(p, [], [], '2026-12-01').delete, []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
