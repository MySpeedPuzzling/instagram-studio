// The publisher: the only code path that posts to Instagram. Deterministic, no LLM, idempotent.
// It publishes only drafts the owner approved (status approved, or scheduled and due).
//
//   node src/publish/publish.ts <draft-id>     # publish one approved draft now
//   node src/publish/publish.ts --due          # publish scheduled drafts that are due (for launchd)
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { lintCaption } from '../captions/lint.ts';
import { addFeedback, listDrafts, loadDraft, saveDraft, transition, type Draft } from '../drafts/model.ts';
import { igClient } from '../ig/api.ts';
import { ROOT } from '../render/server.ts';
import { openStore } from '../store/db.ts';
import { r2Host, type MediaHost } from './r2.ts';

/** Refuse posts that are this late; they wait for the owner to reschedule. */
const MAX_LATE_HOURS = 6;
/** Owner rule: every number is fresh. Facts must have been queried at most this long before publishing. */
export const MAX_FACTS_AGE_HOURS = 24;

/**
 * Age of the draft's data: facts.json maps query names to QueryResult snapshots (each with queried_at), or is
 * { "no_data": true } for posts without numbers (cartoons, seasonal art).
 */
export function factsAge(draftId: string, now = new Date()): { ok: boolean; problem?: string; oldest?: string } {
  const f = join(ROOT, 'content/drafts', draftId, 'facts.json');
  if (!existsSync(f)) return { ok: false, problem: 'no facts.json: every post needs its data snapshot (or {"no_data": true})' };
  const facts = JSON.parse(readFileSync(f, 'utf8'));
  if (facts.no_data === true) return { ok: true };
  const dates = Object.values(facts).map((r: any) => r?.queried_at).filter(Boolean) as string[];
  if (!dates.length) return { ok: false, problem: 'facts.json has no queried_at dates' };
  const oldest = dates.sort()[0];
  const hours = (now.getTime() - Date.parse(oldest)) / 3_600_000;
  if (hours > MAX_FACTS_AGE_HOURS) {
    return { ok: false, oldest, problem: `data is ${Math.round(hours)} h old (queried ${oldest.slice(0, 16).replace('T', ' ')} UTC); re-query and re-render before publishing (max ${MAX_FACTS_AGE_HOURS} h)` };
  }
  return { ok: true, oldest };
}

export interface PreflightIssue { slide?: number; problem: string }

/** Every Instagram API limit that would otherwise fail mid-publish (as of 2026-10-13). */
export async function preflight(d: Draft): Promise<PreflightIssue[]> {
  const issues: PreflightIssue[] = [];
  const age = factsAge(d.id);
  if (!age.ok) issues.push({ problem: `stale or missing data: ${age.problem}` });
  const n = d.slides.length;
  if (d.format === 'carousel' && (n < 2 || n > 10)) issues.push({ problem: `carousel needs 2–10 slides, has ${n}` });
  if (d.format === 'single' && n !== 1) issues.push({ problem: `single image needs exactly 1 slide, has ${n}` });
  if (d.format === 'reel' || d.format === 'story') issues.push({ problem: `${d.format} publishing is not implemented yet` });
  let firstRatio: number | undefined;
  for (const [i, s] of d.slides.entries()) {
    const file = join(ROOT, s.file);
    const meta = await sharp(file).metadata();
    const ratio = (meta.width ?? 0) / (meta.height ?? 1);
    if (meta.format !== 'jpeg') issues.push({ slide: i + 1, problem: `must be JPEG, is ${meta.format}` });
    if ((meta.width ?? 0) < 320 || (meta.width ?? 0) > 1440) issues.push({ slide: i + 1, problem: `width ${meta.width} outside 320–1440` });
    if (ratio < 0.8 - 1e-3 || ratio > 1.91) issues.push({ slide: i + 1, problem: `aspect ${ratio.toFixed(3)} outside 4:5–1.91:1` });
    if (statSync(file).size > 8 * 1024 * 1024) issues.push({ slide: i + 1, problem: 'larger than 8 MB' });
    if (firstRatio !== undefined && Math.abs(ratio - firstRatio) > 0.01) issues.push({ slide: i + 1, problem: 'aspect differs from slide 1 (Instagram crops every slide to slide 1)' });
    firstRatio ??= ratio;
    if (!s.alt?.trim()) issues.push({ slide: i + 1, problem: 'alt text missing' });
    if ((s.alt ?? '').length > 1000) issues.push({ slide: i + 1, problem: 'alt text over 1,000 characters' });
    for (const t of s.user_tags ?? []) {
      if (!/^[a-z0-9._]{1,30}$/.test(t.username)) issues.push({ slide: i + 1, problem: `photo tag: invalid username "${t.username}"` });
      if (!(t.x >= 0 && t.x <= 1 && t.y >= 0 && t.y <= 1)) issues.push({ slide: i + 1, problem: `photo tag @${t.username}: x/y must be within 0–1` });
    }
    if ((s.user_tags?.length ?? 0) > 20) issues.push({ slide: i + 1, problem: 'more than 20 photo tags' });
  }
  const lint = lintCaption(d.caption, d.format === 'carousel' ? 'carousel' : 'single', { searchPhrases: d.search_phrases, properNouns: d.proper_nouns });
  for (const e of lint.errors) issues.push({ problem: `caption: ${e}` });
  if (!d.caption.trim()) issues.push({ problem: 'caption is empty' });
  if ((d.collaborators?.length ?? 0) > 3) issues.push({ problem: 'more than 3 collaborators' });
  return issues;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function waitFinished(ig: ReturnType<typeof igClient>, container: string) {
  // Images are usually ready at once; Meta asks for at most one status call per minute after the first few.
  const delays = [2, 3, 5, 10, 20, 30, 60, 60, 60, 60];
  for (const s of delays) {
    const r = await ig.get(container, { fields: 'status_code,status' });
    if (r.status_code === 'FINISHED') return;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') throw new Error(`container ${container}: ${r.status_code} ${r.status ?? ''}`);
    await sleep(s * 1000);
  }
  throw new Error(`container ${container} not ready after 5 minutes`);
}

/**
 * media_publish with retries: Instagram sometimes answers "Media ID is not available" (code 9007) for a few seconds
 * after a container reports FINISHED (seen on the first pipeline post, 2026-10-17). Before every retry, check that the
 * post didn't go out anyway (same caption, created after `since`), so a retry can never post twice.
 */
async function publishContainer(ig: ReturnType<typeof igClient>, container: string, caption: string, since: string): Promise<string> {
  const waits = [5, 10, 20, 30, 45];
  for (let i = 0; ; i++) {
    try {
      return (await ig.post('me/media_publish', { creation_id: container })).id as string;
    } catch (e) {
      if (i >= waits.length || !/not available|9007/i.test((e as Error).message)) throw e;
      await sleep(waits[i] * 1000);
      const recent = await ig.get('me/media', { fields: 'id,caption,timestamp', limit: 5 });
      const hit = recent.data?.find((m: any) => (m.caption ?? '').trim() === caption.trim() && m.timestamp >= since.slice(0, 19));
      if (hit) return hit.id as string;
    }
  }
}

export async function publishDraft(id: string, opts: { host?: MediaHost; now?: Date } = {}): Promise<string> {
  const db = openStore();
  const d = loadDraft(id);
  const log = db.prepare('SELECT * FROM publish_log WHERE draft_id = ?').get(id) as any;
  if (log?.status === 'published' || d.status === 'published') return `already published: ${log?.permalink ?? d.permalink}`;
  if (!['approved', 'scheduled', 'publishing'].includes(d.status)) throw new Error(`draft ${id} is ${d.status}; only approved drafts are published`);
  if (d.status === 'scheduled' && d.scheduled_for) {
    const late = ((opts.now ?? new Date()).getTime() - Date.parse(d.scheduled_for)) / 3_600_000;
    if (late < 0) return `not due yet (scheduled for ${d.scheduled_for})`;
    if (late > MAX_LATE_HOURS) {
      transition(d, 'needs_reschedule');
      saveDraft(d);
      return `${late.toFixed(1)} h late: marked needs_reschedule instead of posting`;
    }
  }

  const issues = await preflight(d);
  if (issues.length) throw new Error(`preflight failed:\n${issues.map(i => `  ${i.slide ? `slide ${i.slide}: ` : ''}${i.problem}`).join('\n')}`);

  const ig = igClient();
  const startedAt = new Date().toISOString();
  const upd = db.prepare(`INSERT INTO publish_log (draft_id, container_id, media_id, permalink, status, scheduled_for, published_at, error, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(draft_id) DO UPDATE SET container_id = coalesce(excluded.container_id, container_id),
    media_id = coalesce(excluded.media_id, media_id), permalink = coalesce(excluded.permalink, permalink), status = excluded.status,
    published_at = coalesce(excluded.published_at, published_at), error = excluded.error, updated_at = excluded.updated_at`);
  const record = (status: string, f: { container?: string; media?: string; permalink?: string; error?: string } = {}) =>
    upd.run(id, f.container ?? null, f.media ?? null, f.permalink ?? null, status, d.scheduled_for ?? null,
      status === 'published' ? new Date().toISOString() : null, f.error ?? null, new Date().toISOString());

  // Crash recovery: a container was created earlier. If a post with this caption appeared since, it went out.
  if (log?.container_id) {
    const recent = await ig.get('me/media', { fields: 'id,caption,permalink,timestamp', limit: 5 });
    const hit = recent.data?.find((m: any) => (m.caption ?? '').trim() === d.caption.trim() && m.timestamp >= log.updated_at.slice(0, 19));
    if (hit) {
      record('published', { media: hit.id, permalink: hit.permalink });
      d.status = 'published'; d.media_id = hit.id; d.permalink = hit.permalink; saveDraft(d);
      return `recovered: it was already published (${hit.permalink})`;
    }
  }

  const quota = await ig.get('me/content_publishing_limit', { fields: 'quota_usage,config' });
  const usage = quota.data?.[0]?.quota_usage ?? 0, total = quota.data?.[0]?.config?.quota_total ?? 25;
  if (usage >= total) throw new Error(`publishing quota used up (${usage}/${total} in 24 h)`);

  if (d.status !== 'publishing') { transition(d, 'publishing'); saveDraft(d); }
  record('creating');
  const host = opts.host ?? r2Host();
  const prefix = host.newPrefix();
  const keys: string[] = [];
  try {
    const urls: string[] = [];
    for (const [i, s] of d.slides.entries()) {
      const key = `${prefix}/slide-${String(i + 1).padStart(2, '0')}.jpg`;
      urls.push(await host.put(key, join(ROOT, s.file), 'image/jpeg'));
      keys.push(key);
    }
    const collab: Record<string, string> = d.collaborators?.length ? { collaborators: JSON.stringify(d.collaborators) } : {};
    // Photo tags go on each image container (on carousels: the child, never the CAROUSEL container).
    const tags = (i: number): Record<string, string> => (d.slides[i].user_tags?.length ? { user_tags: JSON.stringify(d.slides[i].user_tags) } : {});
    let container: string;
    if (d.format === 'single') {
      container = (await ig.post('me/media', { image_url: urls[0], caption: d.caption, alt_text: d.slides[0].alt, ...tags(0), ...collab })).id;
    } else {
      const children: string[] = [];
      for (const [i, u] of urls.entries()) {
        children.push((await ig.post('me/media', { image_url: u, is_carousel_item: true, alt_text: d.slides[i].alt, ...tags(i) })).id);
      }
      for (const c of children) await waitFinished(ig, c);
      container = (await ig.post('me/media', { media_type: 'CAROUSEL', children: children.join(','), caption: d.caption, ...collab })).id;
    }
    record('created', { container });
    await waitFinished(ig, container);
    const media = await publishContainer(ig, container, d.caption, startedAt);
    const info = await ig.get(media, { fields: 'permalink,timestamp' });
    record('published', { container, media, permalink: info.permalink });

    transition(d, 'published');
    d.media_id = media;
    d.permalink = info.permalink;
    saveDraft(d);
    addFeedback(id, { author: 'claude', kind: 'resolved', text: `published ${info.permalink}` });
    db.prepare(`INSERT INTO media (id, timestamp, media_type, permalink, caption_chars, hashtags, children, source, draft_id, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pipeline', ?, ?) ON CONFLICT(id) DO UPDATE SET source = 'pipeline', draft_id = excluded.draft_id, tags = excluded.tags`)
      .run(media, info.timestamp, d.format === 'single' ? 'IMAGE' : 'CAROUSEL_ALBUM', info.permalink, [...d.caption].length,
        (d.caption.match(/#[\p{L}\d_]+/gu) ?? []).length, d.format === 'single' ? null : d.slides.length, id, JSON.stringify({ pillar: d.pillar, ...d.tags }));
    return `published: ${info.permalink}`;
  } catch (e) {
    const msg = (e as Error).message;
    record('failed', { error: msg });
    transition(d, 'failed');
    saveDraft(d);
    addFeedback(id, { author: 'claude', kind: 'comment', text: `publish failed: ${msg}` });
    throw e;
  } finally {
    for (const k of keys) await host.remove(k).catch(() => { /* lifecycle rule cleans up stragglers */ });
  }
}

export async function publishDraftNow(id: string): Promise<string> {
  try { return await publishDraft(id); } catch (e) { return `Not published: ${(e as Error).message}`; }
}

if (import.meta.main) {
  const arg = process.argv[2];
  if (arg === '--due') {
    for (const d of listDrafts().filter(x => x.status === 'scheduled')) {
      try { console.log(`${d.id}: ${await publishDraft(d.id)}`); } catch (e) { console.error(`${d.id}: ${(e as Error).message}`); }
    }
  } else if (arg) {
    console.log(await publishDraft(arg));
  } else {
    console.error('usage: node src/publish/publish.ts <draft-id> | --due');
    process.exit(2);
  }
}
