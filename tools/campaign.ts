// Advent of Puzzle (and other answer campaigns): read-only collection, weekly pools and seeded draws.
// Design: docs/ideas/advent-of-puzzle.md. Store: content/campaign/<campaign>/ (gitignored: it holds usernames).
// Everything here only READS from Instagram (GET); it never replies, hides, deletes, messages or publishes.
//
//   node tools/campaign.ts status                         # days, weeks, seeds, draws, alerts
//   node tools/campaign.ts stories                        # snapshot our live Stories (+ insights) while they run
//   node tools/campaign.ts probe [--since ISO] [--show-text]   # what the API returns for Story replies (test Story)
//   node tools/campaign.ts collect <day> [--source story-replies|comments] [--media <id>] [--story <id>…]
//                                        [--campaign <id>] [--key <file>] [--from ISO] [--to ISO]
//   node tools/campaign.ts week <n> [--rule all6|any|tickets] [--list] [--include-previous-winners]
//   node tools/campaign.ts seed <n>                       # make + store week n's secret, print the commitment to publish
//   node tools/campaign.ts draw <n> [--rule …] [--dry-run] [--include-previous-winners]
//   node tools/campaign.ts tick [--force]                 # the scheduled job: snapshot, collect, seeds, Sunday draw
//   node tools/campaign.ts schedule [--print]             # write the launchd plist + print the commands (no install)
//   node tools/campaign.ts purge [--before YYYY-MM-DD] [--yes]   # retention: dry run unless --yes
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { CAMPAIGN_ID, DAYS, WEEKS, dayInfo, pad2, paths, pragueParts, weekInfo, type Paths } from '../src/campaign/advent.ts';
import { calendarWindow, collectDay, dayWindow, fetchComments, fetchStoryReplies, type Us, type Window } from '../src/campaign/collect.ts';
import { DEFAULT_RULE, RETENTION_DAYS, RULES, makeSeed, purgePlan, redactDraw, runDraw, weekPool, writeDraw, type DrawResult, type Rule, type SeedRecord } from '../src/campaign/draw.ts';
import { isoUtc, maskUser, readOnlyIg, redactAll, sleep, type ReadOnlyIg } from '../src/campaign/ig.ts';
import { matchChoice, validateKey, type AnswerKey } from '../src/campaign/match.ts';
import { appendJsonl, knownStories, readJson, readJsonl, setManualStories, storiesForDay, writeAtomic, writeJson, type StorySnapshot } from '../src/campaign/store.ts';
import { loadEnv } from '../src/data/db.ts';
import { ROOT } from '../src/render/server.ts';

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    campaign: { type: 'string' }, source: { type: 'string' }, media: { type: 'string' }, story: { type: 'string', multiple: true },
    key: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, since: { type: 'string' }, rule: { type: 'string' },
    list: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, 'include-previous-winners': { type: 'boolean' }, force: { type: 'boolean' },
    print: { type: 'boolean' }, 'show-text': { type: 'boolean' }, before: { type: 'string' }, yes: { type: 'boolean' },
  },
});
const [cmd = 'status', arg] = positionals;
const campaign = o.campaign ?? CAMPAIGN_ID;
const isAdvent = campaign === CAMPAIGN_ID;
const P = paths(campaign);
const rel = (f: string) => relative(ROOT, f);
const LABEL = 'cz.myspeedpuzzling.instagram.advent';

let igCache: ReadOnlyIg | undefined;
const ig = () => (igCache ??= readOnlyIg());

async function us(): Promise<Us> {
  const me = await ig().get<{ id: string; user_id?: string; username: string }>('me', { fields: 'user_id,username' });
  return { ids: [me.id, me.user_id].filter(Boolean).map(String), username: me.username };
}

function loadKey(day: string): AnswerKey {
  const file = o.key ?? P.key(day);
  if (!existsSync(file)) throw new Error(`no answer key for day ${day}: ${rel(file)} (see docs/ideas/advent-of-puzzle.md for the format)`);
  return validateKey(JSON.parse(readFileSync(file, 'utf8')));
}

const STORY_METRICS = 'reach,views,navigation,follows,profile_visits,shares,total_interactions';

/** Live Stories with their insights (insights vanish with the Story; values under 5 come back as error #10 → null). */
async function snapshotStories(): Promise<StorySnapshot[]> {
  const live = await ig().get<{ data: Array<{ id: string; timestamp: string; media_type?: string }> }>('me/stories', { fields: 'id,timestamp,media_type' });
  const seen = new Set(knownStories(P).map(s => s.id));
  const now = new Date().toISOString();
  const out: StorySnapshot[] = [];
  for (const s of live.data) {
    const insights: Record<string, number | null> = {};
    for (const m of STORY_METRICS.split(',')) {
      try {
        const r = await ig().get<{ data: Array<{ name: string; values?: Array<{ value: number }>; total_value?: { value: number } }> }>(`${s.id}/insights`, { metric: m });
        const x = r.data[0];
        insights[m] = (x?.values?.[0]?.value ?? x?.total_value?.value ?? null) as number | null;
      } catch { insights[m] = null; }
      await sleep(80);
    }
    const row = { id: s.id, timestamp: isoUtc(s.timestamp), seen_at: now, ...(s.media_type ? { media_type: s.media_type } : {}), insights };
    appendJsonl(P.stories, row);
    if (!seen.has(s.id)) out.push(row);
  }
  return out;
}

/** A Story's timestamp from our snapshots, or from the API (works for our own media while we can read it). */
async function storyTimestamp(id: string): Promise<string> {
  const known = knownStories(P).find(s => s.id === id);
  if (known?.timestamp) return known.timestamp;
  const r = await ig().get<{ timestamp: string }>(id, { fields: 'timestamp' });
  const ts = isoUtc(r.timestamp);
  appendJsonl(P.stories, { id, timestamp: ts, seen_at: new Date().toISOString(), via: 'lookup' });
  return ts;
}

async function collect(day: string) {
  const source = (o.source ?? 'story-replies') as 'story-replies' | 'comments';
  const key = loadKey(day);
  const me = await us();
  if (o.story?.length) {
    for (const id of o.story) await storyTimestamp(id);
    setManualStories(P, day, o.story);
  }
  const dayStories = storiesForDay(P, day, isAdvent ? undefined : () => null);
  let fallback: Window;
  if (isAdvent && /^\d+$/.test(day)) fallback = calendarWindow(Number(day));
  // Open-ended test windows end a fixed year after they open, so re-runs write identical files.
  else if (o.from) fallback = { opensAt: new Date(o.from).toISOString(), closesAt: new Date(o.to ?? Date.parse(o.from) + 365 * 86_400_000).toISOString() };
  else if (source === 'comments' && o.media) {
    const m = await ig().get<{ timestamp: string }>(o.media, { fields: 'timestamp' });
    fallback = { opensAt: isoUtc(m.timestamp), closesAt: new Date(o.to ?? Date.parse(isoUtc(m.timestamp)) + 365 * 86_400_000).toISOString() };
  } else if (!dayStories.length) throw new Error('test campaigns need --story <id> or --from/--to (or --media for comments)');
  else fallback = { opensAt: '', closesAt: '' };
  const window = source === 'comments' ? fallback : dayWindow(dayStories, fallback);
  if (source === 'comments' && !o.media) throw new Error('--media <id> is required with --source comments');
  const res = await collectDay({
    paths: P, campaign, day, source, key, window, dayStories, allStories: knownStories(P),
    fetch: () => source === 'comments' ? fetchComments(ig(), { mediaId: o.media!, window, us: me }) : fetchStoryReplies(ig(), { since: window.opensAt, us: me, pauseMs: 300, read: readJson(join(P.day(day), 'conversations-read.json'), {}) }),
  });
  console.log(`${campaign} day ${day} (${source}): window ${res.window.opensAt.slice(0, 16)} → ${res.window.closesAt.slice(0, 16)} UTC`);
  console.log(`  fetched ${res.fetched}, new ${res.newMessages}, total ${res.total}; ${Object.entries(res.counts).map(([k, v]) => `${k} ${v}`).join(', ')}; unattributed ${res.unattributed}${res.final ? '; FINAL' : ''}`);
  for (const e of res.errors) console.log(`  warn ${redactAll(e)}`);
  console.log(`  files: ${rel(res.dir)}/{raw,entries,correct}.json, audit.md, runs.jsonl`);
  return res;
}

function parseRule(): Rule {
  const r = (o.rule ?? readJson<{ rule?: Rule }>(join(P.base, 'config.json'), {}).rule ?? DEFAULT_RULE) as Rule;
  if (!(r in RULES)) throw new Error(`unknown rule ${r} (all6 | any | tickets)`);
  return r;
}

function week(n: number) {
  const exclude = !o['include-previous-winners'];
  console.log(`${campaign} week ${n} (days ${weekInfo(n).days.join(', ')}), previous winners ${exclude ? 'excluded' : 'included'}`);
  for (const r of Object.keys(RULES) as Rule[]) {
    const pool = weekPool(P, campaign, n, r, exclude);
    console.log(`  ${r.padEnd(8)} ${String(pool.members.length).padStart(4)} people, ${String(pool.tickets).padStart(4)} tickets  (${RULES[r]})${pool.missing_days.length ? `  missing days: ${pool.missing_days.join(', ')}` : ''}`);
  }
  const chosen = parseRule();
  const pool = weekPool(P, campaign, n, chosen, exclude);
  writeJson(join(P.week(n), 'pool.json'), pool);
  console.log(`  rule in use: ${chosen} → ${rel(join(P.week(n), 'pool.json'))}`);
  if (o.list) for (const m of pool.members) console.log(`    @${m.username}  days ${m.correct_days.join(',')}  tickets ${m.tickets}`);
}

function seed(n: number) {
  const rec = makeSeed(P, campaign, n);
  console.log(`week ${n} seed made; publish this commitment before the week's first quiz:\n  ${rec.commitment}\n  (stored: ${rel(join(P.week(n), 'seed.json'))}; the secret stays in seed.secret.json until the draw)`);
}

function draw(n: number) {
  const seedRec = readJson<SeedRecord | null>(join(P.week(n), 'seed.json'), null);
  const secret = readJson<{ secret?: string }>(join(P.week(n), 'seed.secret.json'), {}).secret;
  if (!seedRec || !secret) throw new Error(`week ${n} has no seed; run: node tools/campaign.ts seed ${n} (before the week starts)`);
  const w = weekInfo(n);
  const lastDay = w.days[w.days.length - 1];
  const finalDays = w.days.filter(d => existsSync(join(P.day(d), 'final.json')));
  if (!o['dry-run'] && isAdvent && finalDays.length < w.days.length) throw new Error(`week ${n}: days ${w.days.filter(d => !finalDays.includes(d)).join(', ')} not final yet (day ${lastDay} closes ${dayInfo(lastDay).closesAt}); use --dry-run for a preview`);
  const pool = weekPool(P, campaign, n, parseRule(), !o['include-previous-winners']);
  const r = runDraw(pool, secret, seedRec.commitment);
  console.log(`week ${n}: ${r.entrants} people, ${r.tickets} tickets, rule ${r.rule}${pool.missing_days.length ? `, missing days ${pool.missing_days.join(', ')}` : ''}`);
  console.log(`  winner ${o['dry-run'] ? maskUser(r.winner.username) : '@' + r.winner.username} (score ${r.winner.score.slice(0, 16)}…); back-ups ${r.backups.length}`);
  if (o['dry-run']) { console.log('  dry run: nothing written'); return r; }
  writeDraw(P, r, pool);
  console.log(`  written: ${rel(P.week(n))}/{pool,draw}.json, draw-public.md, winner/ (draft for approval; nothing published or sent)`);
  return r;
}

async function probe() {
  const since = o.since ? new Date(o.since).toISOString() : new Date(Date.now() - 2 * 86_400_000).toISOString();
  const me = await us();
  console.log(`account: @${me.username} (ids …${me.ids.map(i => i.slice(-4)).join(', …')})`);
  const live = await ig().get<{ data: Array<{ id: string; timestamp: string; media_type?: string }> }>('me/stories', { fields: 'id,timestamp,media_type,permalink' });
  const known = knownStories(P);
  console.log(`live Stories: ${live.data.length}`);
  for (const s of live.data) {
    let ins = '';
    try { const r = await ig().get<{ data: Array<{ name: string; values?: Array<{ value: number }>; total_value?: { value: number } }> }>(`${s.id}/insights`, { metric: 'reach,views,navigation,total_interactions' }); ins = r.data.map(x => `${x.name}=${x.values?.[0]?.value ?? x.total_value?.value}`).join(' '); } catch (e) { ins = `insights: ${redactAll((e as Error).message).slice(0, 80)}`; }
    console.log(`  ${s.id}  ${isoUtc(s.timestamp)}  ${s.media_type ?? ''}  ${ins}`);
  }
  const ourStoryIds = new Set([...live.data.map(s => s.id), ...known.map(s => s.id)]);
  const res = await fetchStoryReplies(ig(), { since, us: { ids: [], username: '\u0000' }, maxCalls: 60, pauseMs: 300 }); // keep our own too, to show both directions
  console.log(`\nStory replies in DMs since ${since.slice(0, 16)}Z: ${res.candidates!.length} (conversations read ${res.conversations}, API calls ${res.calls}${res.errors?.length ? `, errors ${res.errors.length}` : ''})`);
  for (const c of res.candidates!) {
    const ours = me.ids.includes(c.from_id) || c.from_username.toLowerCase() === me.username.toLowerCase();
    const target = !c.reply_to_id ? 'reply_to.id MISSING' : ourStoryIds.has(c.reply_to_id) ? `→ our Story ${c.reply_to_id}${live.data.some(s => s.id === c.reply_to_id) ? ' (live)' : ' (snapshotted)'}` : '→ not one of our known Stories';
    const t = c.text.trim();
    const shape = `len ${t.length}, ${t.split(/\s+/).filter(Boolean).length} word(s)${/^[\p{L}]$/u.test(t) ? ', single letter' : ''}${c.has_attachment ? ', with attachment' : ''}`;
    const read = matchChoice(t, { type: 'choice', options: { A: 'A', B: 'B', C: 'C' }, correct: 'A' });
    console.log(`  ${c.created_time.slice(0, 19)}  ${ours ? 'FROM US  ' : 'from ' + maskUser(c.from_username, c.from_id)}  ${target}  [${shape}; as A/B/C → ${read.parsed ?? 'unparsed'}]${o['show-text'] ? `  "${t.slice(0, 60)}"` : ''}${c.is_deleted ? ' (deleted)' : ''}`);
  }
  // Mentions (someone tagged us in their Story) also arrive as DMs; counted for the giveaway context.
  let mentions = 0;
  try {
    const convs = await ig().get<{ data: Array<{ id: string; updated_time: string }> }>('me/conversations', { platform: 'instagram', fields: 'id,updated_time', limit: 25 });
    for (const c of convs.data.filter(x => isoUtc(x.updated_time) >= since)) {
      const d = await ig().get<{ messages?: { data: any[] } }>(c.id, { fields: 'messages.limit(20){created_time,story}' });
      mentions += (d.messages?.data ?? []).filter(m => m.story?.mention && isoUtc(m.created_time) >= since).length;
      await sleep(100);
    }
  } catch (e) { console.log(`  mentions: ${redactAll((e as Error).message).slice(0, 100)}`); }
  console.log(`Story mentions of us since then: ${mentions}`);
  for (const e of res.errors ?? []) console.log(`  warn ${redactAll(e)}`);
  console.log('\nRead-only: GET requests only. Usernames are masked; add --show-text to see message text (local terminal only).');
}

// ------------------------------------------------------------------ status

function status() {
  const now = new Date();
  console.log(`${campaign} · ${rel(P.base)} · now ${pragueParts(now).date} ${pragueParts(now).time} Prague`);
  const env = loadEnv();
  if (env.IG_TOKEN_EXPIRES_AT) {
    const days = Math.floor((Date.parse(env.IG_TOKEN_EXPIRES_AT) - now.getTime()) / 86_400_000);
    console.log(`token: ${days} days left (expires ${env.IG_TOKEN_EXPIRES_AT.slice(0, 10)})${Date.parse(env.IG_TOKEN_EXPIRES_AT) < Date.parse(DAYS[23].closesAt) + 7 * 86_400_000 ? '  ← refresh before the campaign ends (node tools/ig-token.ts refresh)' : ''}`);
  }
  const cfg = readJson<{ rule?: string; exclude_previous_winners?: boolean }>(join(P.base, 'config.json'), {});
  console.log(`rule: ${cfg.rule ?? `not chosen (config.json) → default ${DEFAULT_RULE}, the Sunday tick will NOT draw until it is set`}`);
  if (!isAdvent) {
    const days = existsSync(P.base) ? readJsonl<{ run_at: string }>(join(P.day('1'), 'runs.jsonl')) : [];
    console.log(`test campaign; runs: ${days.length}`);
  } else {
    for (const w of WEEKS) {
      const s = readJson<SeedRecord | null>(join(P.week(w.week), 'seed.json'), null);
      const d = readJson<DrawResult | null>(join(P.week(w.week), 'draw.json'), null);
      console.log(`\nweek ${w.week} · draw ${w.drawDate} · seed ${s ? s.commitment.slice(0, 16) + '…' : 'none'} · ${d ? `drawn (${d.entrants} people, ${d.tickets} tickets)` : 'not drawn'}`);
      for (const n of w.days) {
        const di = dayInfo(n);
        const st = storiesForDay(P, n);
        const fin = readJson<{ counts?: Record<string, number> } | null>(join(P.day(n), 'final.json'), null);
        const runs = readJsonl<{ counts: Record<string, number>; run_at: string }>(join(P.day(n), 'runs.jsonl'));
        const last = runs[runs.length - 1];
        const key = existsSync(P.key(n)) ? 'key ok' : 'NO KEY';
        console.log(`  day ${pad2(n)} ${di.weekday} ${di.date}  ${key}  stories ${st.length}  ${fin ? `final: ${fin.counts!.correct} correct / ${Object.values(fin.counts!).reduce((a, b) => a + b, 0)} msgs` : last ? `provisional (${last.run_at.slice(5, 16)}): ${last.counts.correct} correct` : '—'}`);
      }
    }
  }
  const alerts = existsSync(P.alerts) ? readFileSync(P.alerts, 'utf8').trim().split('\n').slice(-5) : [];
  if (alerts.length) console.log(`\nlast alerts:\n  ${alerts.join('\n  ')}`);
  const st = readJson<{ last_tick?: string; needs_attention?: string[] } | null>(P.status, null);
  if (st) console.log(`\nlast tick ${st.last_tick}; needs attention: ${st.needs_attention?.length ? st.needs_attention.join('; ') : 'nothing'}`);
}

// ------------------------------------------------------------------ the scheduled tick

function alert(msg: string) {
  const line = `${new Date().toISOString()}  ${msg}`;
  appendJsonl(join(P.base, 'alerts.jsonl'), { at: new Date().toISOString(), msg });
  appendFileSync(P.alerts, line + '\n', { mode: 0o600 });
  console.error(`ALERT ${msg}`);
  if (!process.env.CAMPAIGN_NO_NOTIFY) {
    try { execFileSync('osascript', ['-e', `display notification ${JSON.stringify(msg.slice(0, 200))} with title "Advent of Puzzle" sound name "Basso"`], { stdio: 'ignore' }); } catch { /* headless */ }
  }
}

/** 3 retries after 2, 5 and 10 minutes (CAMPAIGN_RETRY_SCALE shrinks the waits, e.g. 0.001 in a dry run). */
async function retry<T>(label: string, f: () => Promise<T>): Promise<T | undefined> {
  const waits = [2, 5, 10].map(m => m * 60_000 * Number(process.env.CAMPAIGN_RETRY_SCALE ?? 1));
  for (let i = 0; ; i++) {
    try { return await f(); } catch (e) {
      const msg = redactAll((e as Error).message).slice(0, 200);
      if (i >= waits.length) { alert(`${label} failed after ${i + 1} tries: ${msg}`); return undefined; }
      console.error(`${label}: ${msg}; retrying in ${Math.round(waits[i] / 1000)} s`);
      await sleep(waits[i]);
    }
  }
}

async function tick() {
  const now = new Date();
  const start = Date.parse(DAYS[0].storyAt) - 4 * 86_400_000, end = Date.parse(DAYS[23].closesAt) + 2 * 86_400_000;
  if (!o.force && (now.getTime() < start || now.getTime() > end)) { console.log(`tick ${now.toISOString()}: outside the campaign (${new Date(start).toISOString().slice(0, 10)} → ${new Date(end).toISOString().slice(0, 10)}); nothing to do`); return; }
  if (existsSync(P.lock) && now.getTime() - statSync(P.lock).mtimeMs < 45 * 60_000) { console.log('another tick is running; skipping'); return; }
  writeJson(P.lock, { pid: process.pid, at: now.toISOString() });
  const attention: string[] = [];
  try {
    const fresh = await retry('Story snapshot', snapshotStories);
    if (fresh?.length) console.log(`new Stories seen: ${fresh.length}`);
    // Seeds: made 3 days before each week so the commitment can go into the week's first quiz Story.
    for (const w of WEEKS) {
      const ws = Date.parse(dayInfo(w.days[0]).storyAt);
      if (now.getTime() >= ws - 3 * 86_400_000 && !existsSync(join(P.week(w.week), 'seed.json'))) {
        const rec = makeSeed(P, campaign, w.week);
        alert(`week ${w.week} seed made: publish the commitment ${rec.commitment.slice(0, 16)}… before day ${w.days[0]}`);
      }
    }
    for (const d of DAYS) {
      if (now.getTime() < Date.parse(d.storyAt) || existsSync(join(P.day(d.day), 'final.json'))) continue;
      if (!existsSync(P.key(d.day))) { attention.push(`day ${d.day}: no answer key`); alert(`day ${d.day}: no answer key (${rel(P.key(d.day))})`); continue; }
      const st = storiesForDay(P, d.day);
      if (!st.length && now.getTime() > Date.parse(d.storyAt) + 2 * 3600_000) { attention.push(`day ${d.day}: no Story of ours seen`); alert(`day ${d.day}: no Story of ours seen since ${d.storyAt.slice(0, 16)}Z (posted? or set it: collect ${d.day} --story <id>)`); }
      const r = await retry(`collect day ${d.day}`, () => collect(String(d.day)));
      if (!r) attention.push(`day ${d.day}: collection failed`);
      else if (r.errors.length) attention.push(`day ${d.day}: ${r.errors.length} paging warning(s)`);
    }
    // Sunday: once a week's six days are final, draw (only with the owner's rule chosen in config.json).
    const cfg = readJson<{ rule?: Rule; exclude_previous_winners?: boolean }>(join(P.base, 'config.json'), {});
    for (const w of WEEKS) {
      if (existsSync(join(P.week(w.week), 'draw.json')) || !w.days.every(n => existsSync(join(P.day(n), 'final.json')))) continue;
      if (!cfg.rule) { attention.push(`week ${w.week}: ready to draw, but no rule chosen`); alert(`week ${w.week}: ready to draw; set "rule" in ${rel(join(P.base, 'config.json'))} (all6 | any | tickets), then run draw ${w.week}`); continue; }
      o.rule = cfg.rule;
      o['include-previous-winners'] = cfg.exclude_previous_winners === false;
      try { draw(w.week); alert(`week ${w.week} drawn: the winner draft is ready for approval (${rel(join(P.week(w.week), 'winner'))})`); }
      catch (e) { attention.push(`week ${w.week}: draw failed`); alert(`week ${w.week} draw failed: ${(e as Error).message.slice(0, 160)}`); }
    }
  } finally {
    writeJson(P.status, { last_tick: now.toISOString(), needs_attention: attention });
    rmSync(P.lock, { force: true });
  }
  console.log(`tick ${now.toISOString()} done; needs attention: ${attention.length ? attention.join('; ') : 'nothing'}`);
}

// ------------------------------------------------------------------ launchd (written, never installed here)

function schedule() {
  const node = ['/opt/homebrew/bin/node', '/usr/local/bin/node'].find(p => existsSync(p)) ?? process.execPath;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const times: Array<[number, number]> = [[9, 0], [13, 0], [17, 0], [19, 30], [23, 30]];
  const log = join(P.launchd, 'advent.log');
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <!-- Advent of Puzzle 2026 (msp-instagram): read-only collection of quiz answers, 5× a day (Mac local time = Prague).
       09:00 / 13:00 / 17:00 provisional collect while the 19:00 Story is still live; 19:30 final collect of the day that
       just closed + snapshot of the new Story; 23:30 safety snapshot. Outside 26 Nov – 29 Dec it exits at once.
       Remove: launchctl bootout gui/$(id -u)/${LABEL} -->
  <key>ProgramArguments</key>
  <array>
    <string>${esc(node)}</string>
    <string>${esc(join(ROOT, 'tools/campaign.ts'))}</string>
    <string>tick</string>
  </array>
  <key>WorkingDirectory</key><string>${esc(ROOT)}</string>
  <key>StartCalendarInterval</key>
  <array>
${times.map(([h, m]) => `    <dict><key>Hour</key><integer>${h}</integer><key>Minute</key><integer>${m}</integer></dict>`).join('\n')}
  </array>
  <key>RunAtLoad</key><false/>
  <key>ProcessType</key><string>Background</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${esc([...new Set([join(node, '..'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'])].join(':'))}</string>
    <key>HOME</key><string>${esc(homedir())}</string>
    <key>LANG</key><string>en_US.UTF-8</string>
    <key>TZ</key><string>Europe/Prague</string>
  </dict>
  <key>StandardOutPath</key><string>${esc(log)}</string>
  <key>StandardErrorPath</key><string>${esc(log)}</string>
</dict>
</plist>
`;
  const file = join(P.launchd, `${LABEL}.plist`);
  writeAtomic(file, plist);
  try { execFileSync('plutil', ['-lint', file], { stdio: 'pipe' }); console.log(`plist OK: ${rel(file)}`); } catch (e) { console.log(`plutil: ${(e as Error).message.split('\n')[0]}`); }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz !== 'Europe/Prague') console.log(`note: this Mac's time zone is ${tz}; launchd fires at Mac local time (the plist sets TZ for the job only)`);
  const dst = `~/Library/LaunchAgents/${LABEL}.plist`;
  console.log(`\nNot installed. To install (owner's go-ahead first):
  cp ${rel(file)} ${dst}
  launchctl bootstrap gui/$(id -u) ${dst}
  launchctl print gui/$(id -u)/${LABEL} | head -20      # loaded? next run?
  launchctl kickstart -k gui/$(id -u)/${LABEL}          # run one tick now
  tail -f ${rel(log)}                                    # its log
To remove:
  launchctl bootout gui/$(id -u)/${LABEL} && rm ${dst}
A Mac asleep at a scheduled time runs the missed tick when it wakes; keep it awake (or on power with "wake for network
access") on campaign evenings, because Story ids can only be snapshotted while the Story is live.`);
  if (o.print) console.log('\n' + plist);
}
// ------------------------------------------------------------------ retention

function purge() {
  const lastDraw = WEEKS[WEEKS.length - 1].drawDate;
  const before = o.before ?? new Date(Date.parse(`${lastDraw}T12:00:00Z`) + RETENTION_DAYS * 86_400_000).toISOString().slice(0, 10);
  const plan = purgePlan(P, DAYS.map(d => ({ dir: P.day(d.day), closesAt: d.closesAt })), WEEKS.map(w => ({ dir: P.week(w.week), drawDate: w.drawDate })), before);
  console.log(`purge of entries from days that closed / weeks drawn before ${before} (retention: ${RETENTION_DAYS} days after the final draw ${lastDraw})`);
  for (const f of plan.delete) console.log(`  delete  ${rel(f)}`);
  for (const f of plan.redact) console.log(`  redact  ${rel(f)} (keep the winner, drop every other entrant)`);
  if (!plan.delete.length && !plan.redact.length) { console.log('  nothing to purge'); return; }
  if (!o.yes) { console.log('dry run (default): nothing deleted; add --yes to delete'); return; }
  for (const f of plan.delete) rmSync(f, { force: true });
  for (const f of plan.redact) writeJson(f, redactDraw(readJson<DrawResult>(f, null as unknown as DrawResult)));
  console.log(`deleted ${plan.delete.length} file(s), redacted ${plan.redact.length}`);
}

// ------------------------------------------------------------------ main

try {
  switch (cmd) {
    case 'status': status(); break;
    case 'stories': { const f = await snapshotStories(); const all = knownStories(P); console.log(`live Stories snapshotted (with insights) → ${rel(P.stories)}; new: ${f.length}; known: ${all.length}`); for (const s of all.slice(-5)) console.log(`  ${s.id}  ${s.timestamp}  ${isAdvent ? `day ${storiesForDayOf(s.timestamp)}` : ''}`); break; }
    case 'probe': await probe(); break;
    case 'collect': if (!arg) throw new Error('usage: collect <day>'); await collect(arg); break;
    case 'week': week(Number(arg)); break;
    case 'seed': seed(Number(arg)); break;
    case 'draw': draw(Number(arg)); break;
    case 'tick': await tick(); break;
    case 'schedule': schedule(); break;
    case 'purge': purge(); break;
    default: console.error('usage: node tools/campaign.ts status|stories|probe|collect <day>|week <n>|seed <n>|draw <n>|tick|schedule|purge'); process.exit(2);
  }
} catch (e) {
  console.error(redactAll((e as Error).message));
  process.exit(1);
}

function storiesForDayOf(ts: string) {
  const d = DAYS.find(x => x.date === pragueParts(new Date(ts)).date);
  return d && pragueParts(new Date(ts)).time >= '12:00' ? d.day : '—';
}
