// The weekly draw: who is in the pool (the owner's eligibility rule), a commit–reveal seed, a reproducible draw, a
// public audit and a winner draft for approval. Never publishes and never messages anyone.
//
// Commit–reveal: before the week's first quiz goes up, `seed` makes a random 64-hex secret and we publish its SHA-256
// (the commitment). After the week closes, `draw` reveals the secret: anyone can check sha256(secret) = commitment, and
// every ticket's score = sha256(`${secret}|${campaign}|week-${n}|${username}#${k}`); the lowest score wins. Because the
// secret was fixed before anyone answered, we can't pick it to favour someone; because it was hidden, nobody could game it.
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { weekInfo, type Paths } from './advent.ts';
import { sha256, type CorrectRow } from './collect.ts';
import { readJson, writeAtomic, writeJson } from './store.ts';

export type Rule = 'all6' | 'any' | 'tickets';
export const RULES: Record<Rule, string> = {
  all6: 'only people with all six answers of the week correct (one ticket each)',
  any: 'everyone with at least one correct answer (one ticket each)',
  tickets: 'one ticket per correct answer (up to six per person)',
};
/** Claude's recommendation; the owner decides (docs/advent-morning.md). */
export const DEFAULT_RULE: Rule = 'tickets';

export interface PoolMember { user_id: string; username: string; correct_days: string[]; tickets: number }
export interface Pool { campaign: string; week: number; rule: Rule; days: string[]; missing_days: string[]; members: PoolMember[]; excluded_previous_winners: string[]; tickets: number }

/** One person = one Instagram user id (usernames can change; the latest one seen is shown). */
export function buildPool(o: { campaign: string; week: number; days: string[]; correctByDay: Record<string, CorrectRow[] | null>; rule: Rule; previousWinners?: string[] }): Pool {
  const byUser = new Map<string, { username: string; lastAt: string; days: Set<string> }>();
  const missing: string[] = [];
  for (const d of o.days) {
    const rows = o.correctByDay[d];
    if (!rows) { missing.push(d); continue; }
    for (const r of rows) {
      const id = r.user_id || `name:${r.username}`;
      const u = byUser.get(id) ?? { username: r.username, lastAt: '', days: new Set<string>() };
      if (r.at >= u.lastAt) { u.username = r.username; u.lastAt = r.at; }
      u.days.add(d);
      byUser.set(id, u);
    }
  }
  const prev = new Set(o.previousWinners ?? []);
  const excludedPrev: string[] = [];
  const members: PoolMember[] = [];
  for (const [id, u] of byUser) {
    if (prev.has(id)) { excludedPrev.push(u.username); continue; }
    const n = u.days.size;
    const tickets = o.rule === 'tickets' ? n : o.rule === 'any' ? (n >= 1 ? 1 : 0) : (n === o.days.length ? 1 : 0);
    if (tickets > 0) members.push({ user_id: id, username: u.username, correct_days: [...u.days].sort(), tickets });
  }
  members.sort((a, b) => a.username.localeCompare(b.username) || a.user_id.localeCompare(b.user_id));
  return { campaign: o.campaign, week: o.week, rule: o.rule, days: o.days, missing_days: missing, members, excluded_previous_winners: excludedPrev.sort(), tickets: members.reduce((s, m) => s + m.tickets, 0) };
}

// ------------------------------------------------------------------ seed

export interface SeedRecord { campaign: string; week: number; commitment: string; created_at: string; method: string }

export function makeSeed(p: Paths, campaign: string, week: number, now = new Date()): SeedRecord {
  const dir = p.week(week);
  if (existsSync(join(dir, 'seed.json'))) throw new Error(`week ${week} already has a seed (${join(dir, 'seed.json')}); a published commitment must never change`);
  const secret = randomBytes(32).toString('hex');
  const rec: SeedRecord = { campaign, week, commitment: sha256(secret), created_at: now.toISOString(), method: 'commitment = sha256(secret as a 64-character hex string, UTF-8)' };
  writeJson(join(dir, 'seed.secret.json'), { secret });
  writeJson(join(dir, 'seed.json'), rec);
  return rec;
}

export const ticketScore = (secret: string, campaign: string, week: number, ticket: string) => sha256(`${secret}|${campaign}|week-${week}|${ticket}`);

export interface Ticket { ticket: string; user_id: string; username: string; k: number; score: string }
export interface DrawResult {
  campaign: string; week: number; rule: Rule; commitment: string; secret: string; drawn_at: string;
  entrants: number; tickets: number; winner: Ticket; backups: Ticket[]; ranked: Ticket[]; missing_days: string[];
}

/** Ranks every ticket; the winner is the lowest score, back-ups are the next three different people. */
export function runDraw(pool: Pool, secret: string, commitment: string, now = new Date()): DrawResult {
  if (sha256(secret) !== commitment) throw new Error('the secret does not match the published commitment');
  if (!pool.members.length) throw new Error('nobody is in the pool');
  const ranked: Ticket[] = pool.members.flatMap(m => Array.from({ length: m.tickets }, (_, i) => {
    const ticket = `${m.username}#${i + 1}`;
    return { ticket, user_id: m.user_id, username: m.username, k: i + 1, score: ticketScore(secret, pool.campaign, pool.week, ticket) };
  })).sort((a, b) => a.score.localeCompare(b.score));
  const winner = ranked[0];
  const backups: Ticket[] = [];
  const seen = new Set([winner.user_id]);
  for (const t of ranked) if (!seen.has(t.user_id) && backups.length < 3) { seen.add(t.user_id); backups.push(t); }
  return { campaign: pool.campaign, week: pool.week, rule: pool.rule, commitment, secret, drawn_at: now.toISOString(), entrants: pool.members.length, tickets: ranked.length, winner, backups, ranked, missing_days: pool.missing_days };
}

/**
 * Publishable audit: commitment, revealed secret, rule, counts, the winner (handle, score, rank 1) and the sorted list of
 * every ticket score, nothing else (GDPR: no identifier of any other entrant). Each entrant recomputes their own scores
 * from the secret and their handle and finds them in the list. Usernames stay only in the local draw.json.
 */
export function publicAudit(r: DrawResult): string {
  return [
    `# ${r.campaign} · week ${r.week} · the draw`, '',
    `- Rule: ${RULES[r.rule]}`,
    `- People in the draw: ${r.entrants} · tickets: ${r.tickets}`,
    `- Commitment published before the week: \`${r.commitment}\``,
    `- Secret revealed now: \`${r.secret}\` (check: SHA-256 of the secret = the commitment)`,
    `- Winner: **@${r.winner.username}**, rank 1, score \`${r.winner.score}\``, '',
    '## Check it yourself', '',
    'Each ticket\'s score is SHA-256 of `SECRET|' + r.campaign + '|week-' + r.week + '|yourusername#k` (your handle in lowercase, k = 1 for',
    'your first ticket, 2 for your second, …). In a terminal:',
    '`printf \'%s\' \'' + r.secret + '|' + r.campaign + '|week-' + r.week + '|yourusername#1\' | shasum -a 256`.',
    'Your score is in the list below; the lowest score wins.', '',
    '## All ticket scores, lowest first', '',
    ...r.ranked.map((t, i) => `${i + 1}. \`${t.score}\`${i === 0 ? ' ← winner' : ''}`),
    '',
  ].join('\n');
}

/** Caption + Story text for the owner to approve (rendered by the lab / draft tools; nothing is published here). */
export function winnerDraft(r: DrawResult, o: { claimDays?: number; prize?: string } = {}) {
  const claim = o.claimDays ?? 7;
  const prize = o.prize ?? '[PRIZE]';
  const caption = [
    `Advent of Puzzle, week ${r.week}: the winner is @${r.winner.username} 🎉`,
    '',
    `${r.entrants} puzzlers answered at least one door correctly this week (${r.tickets} tickets). We drew the winner with a seed we locked before the first question: its fingerprint was ${r.commitment.slice(0, 12)}…, and the full secret is in the audit, so anyone can re-run the draw.`,
    '',
    `@${r.winner.username}, we'll message you from @myspeedpuzzling only: reply within ${claim} days to claim ${prize}. We never ask for payment or passwords.`,
    '',
    'A new door opens tomorrow at 19:00 (Prague). Which one did you find hardest this week?',
    '',
    '#speedpuzzling #jigsawpuzzle #adventofpuzzle',
  ].join('\n');
  const story = {
    frames: [{ kind: 'winner', week: r.week, winner: `@${r.winner.username}`, entrants: r.entrants, tickets: r.tickets, commitment: r.commitment, secret: r.secret, claim_days: claim, prize, link_sticker: 'the week post' }],
  };
  return { caption, story };
}

// ------------------------------------------------------------------ files

export const previousWinners = (p: Paths, week: number): string[] =>
  Array.from({ length: week - 1 }, (_, i) => readJson<DrawResult | null>(join(p.week(i + 1), 'draw.json'), null)).filter(Boolean).map(d => d!.winner.user_id);

export function loadCorrectByDay(p: Paths, days: string[]): Record<string, CorrectRow[] | null> {
  return Object.fromEntries(days.map(d => [d, existsSync(join(p.day(d), 'final.json')) || existsSync(join(p.day(d), 'correct.json')) ? readJson<CorrectRow[]>(join(p.day(d), 'correct.json'), []) : null]));
}

export function weekPool(p: Paths, campaign: string, week: number, rule: Rule, excludePrevious = true): Pool {
  const days = weekInfo(week).days.map(String);
  return buildPool({ campaign, week, days, correctByDay: loadCorrectByDay(p, days), rule, previousWinners: excludePrevious ? previousWinners(p, week) : [] });
}

export function writeDraw(p: Paths, r: DrawResult, pool: Pool) {
  const dir = p.week(r.week);
  if (existsSync(join(dir, 'draw.json'))) throw new Error(`week ${r.week} was already drawn (${join(dir, 'draw.json')}); a redraw is a manual decision`);
  writeJson(join(dir, 'pool.json'), pool);
  writeJson(join(dir, 'draw.json'), r);
  writeAtomic(join(dir, 'draw-public.md'), publicAudit(r));
  const d = winnerDraft(r);
  writeAtomic(join(dir, 'winner', 'caption.txt'), d.caption + '\n');
  writeJson(join(dir, 'winner', 'story.json'), d.story);
  const winners = readJson<Array<Record<string, unknown>>>(join(p.base, 'winners.json'), []);
  if (!winners.some(w => w.week === r.week)) writeJson(join(p.base, 'winners.json'), [...winners, { week: r.week, username: r.winner.username, user_id: r.winner.user_id, drawn_at: r.drawn_at, claimed: null }]);
  writeAtomic(join(dir, 'winner', 'README.md'), `Draft for the owner's approval (nothing was published or sent).\n\n- Contact the winner from @myspeedpuzzling; back-ups if no reply within the claim period: ${r.backups.map(b => '@' + b.username).join(', ') || 'none'}.\n- Story frame spec: story.json (render in the AD1 lab).\n`);
}

// ------------------------------------------------------------------ retention (GDPR)

/** Non-winner entries are deleted this many days after the campaign's final draw (rules + privacy notice). */
export const RETENTION_DAYS = 60;

export interface PurgePlan { delete: string[]; redact: string[]; keep: string[] }

/**
 * What a purge before `before` (YYYY-MM-DD) removes: per day the raw messages, entries, correct list and audit (they
 * hold usernames and answers); per drawn week the pool, and draw.json is rewritten to keep only the winner. Kept:
 * winners.json, draw-public.md (winner only), seeds, runs.jsonl / final.json (counts only), stories.jsonl (no people).
 */
export function purgePlan(p: Paths, dayDirs: Array<{ dir: string; closesAt: string }>, weekDirs: Array<{ dir: string; drawDate: string }>, before: string): PurgePlan {
  const plan: PurgePlan = { delete: [], redact: [], keep: [] };
  for (const d of dayDirs) {
    if (d.closesAt.slice(0, 10) >= before) continue;
    for (const f of ['raw.json', 'entries.json', 'correct.json', 'audit.md', 'closest.json']) if (existsSync(join(d.dir, f))) plan.delete.push(join(d.dir, f));
  }
  for (const w of weekDirs) {
    if (w.drawDate >= before) continue;
    if (existsSync(join(w.dir, 'pool.json'))) plan.delete.push(join(w.dir, 'pool.json'));
    if (existsSync(join(w.dir, 'draw.json'))) plan.redact.push(join(w.dir, 'draw.json'));
  }
  plan.keep.push(join(p.base, 'winners.json'));
  return plan;
}

/** draw.json without any entrant except the winner (scores stay, so the public audit can still be checked). */
export function redactDraw(r: DrawResult): DrawResult {
  const anon = (t: Ticket): Ticket => (t.user_id === r.winner.user_id ? t : { ...t, username: '', user_id: '', ticket: '' });
  return { ...r, ranked: r.ranked.map(anon), backups: [] };
}
