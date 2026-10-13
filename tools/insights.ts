// Pull Instagram insights into content/state.sqlite (read-only API calls).
//
//   node tools/insights.ts            # all media + last 30 days of account metrics
//   node tools/insights.ts --summary  # medians by format and year from the latest snapshots
//
// Per post the latest snapshot is what counts; the scheduler later pulls at +48 h, +7 d and +30 d.
// Pre-business media return error subcode 2108006 and are stored without metrics.
import { igClient, IgError } from '../src/ig/api.ts';
import { openStore } from '../src/store/db.ts';

const FEED = ['reach', 'views', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'follows', 'profile_visits'];
const REELS = ['reach', 'views', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'ig_reels_avg_watch_time'];

const ig = igClient();
const db = openStore();
const now = new Date();

async function insightsFor(id: string, metrics: string[]): Promise<Record<string, number> | null> {
  const parse = (r: any) => Object.fromEntries((r.data ?? []).map((m: any) => [m.name, m.total_value?.value ?? m.values?.[0]?.value ?? null]));
  try {
    return parse(await ig.get(`${id}/insights`, { metric: metrics.join(',') }));
  } catch (e) {
    if (e instanceof IgError && e.subcode === 2108006) return null; // media from before the business account
    // One unsupported metric fails the whole call: retry one by one and keep what works.
    const out: Record<string, number> = {};
    for (const m of metrics) {
      try { Object.assign(out, parse(await ig.get(`${id}/insights`, { metric: m }))); } catch { /* not available for this media */ }
    }
    return Object.keys(out).length ? out : null;
  }
}

async function pull() {
  const me = await ig.get('me', { fields: 'followers_count,follows_count,media_count' });
  db.prepare('INSERT OR REPLACE INTO account_snapshot VALUES (?, ?, ?, ?)').run(now.toISOString(), me.followers_count, me.follows_count, me.media_count);

  const media = await ig.all('me/media', { fields: 'id,timestamp,media_type,media_product_type,permalink,caption,children{id}', limit: 50 });
  const upsert = db.prepare(`INSERT INTO media (id, timestamp, media_type, media_product_type, permalink, caption_chars, hashtags, children)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET caption_chars = excluded.caption_chars, hashtags = excluded.hashtags, children = excluded.children`);
  const snap = db.prepare(`INSERT OR REPLACE INTO media_insights (media_id, pulled_at, age_hours, views, reach, likes, comments, shares, saved,
    total_interactions, follows, profile_visits, avg_watch_time_ms, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  let withData = 0;
  for (const m of media) {
    const caption: string = m.caption ?? '';
    upsert.run(m.id, m.timestamp, m.media_type, m.media_product_type ?? null, m.permalink ?? null, [...caption].length,
      (caption.match(/#[\p{L}\d_]+/gu) ?? []).length, m.children?.data?.length ?? null);
    const metrics = await insightsFor(m.id, m.media_product_type === 'REELS' ? REELS : FEED);
    if (!metrics) continue;
    withData++;
    const age = (now.getTime() - Date.parse(m.timestamp)) / 3_600_000;
    const v = (k: string) => (metrics[k] == null ? null : Number(metrics[k]));
    snap.run(m.id, now.toISOString(), +age.toFixed(1), v('views'), v('reach'), v('likes'), v('comments'), v('shares'), v('saved'),
      v('total_interactions'), v('follows'), v('profile_visits'), v('ig_reels_avg_watch_time'), JSON.stringify(metrics));
  }

  // Account daily metrics, last 30 days (the API's maximum window per call).
  const until = Math.floor(now.getTime() / 1000), since = until - 30 * 86400;
  const daily = db.prepare('INSERT OR REPLACE INTO account_daily VALUES (?, ?, ?, ?)');
  for (const metric of ['reach', 'follower_count']) {
    try {
      const r = await ig.get('me/insights', { metric, period: 'day', since, until });
      for (const v of r.data?.[0]?.values ?? []) daily.run(String(v.end_time).slice(0, 10), metric, v.value, now.toISOString());
    } catch (e) { console.warn(`account ${metric}: ${(e as Error).message}`); }
  }
  console.log(`followers ${me.followers_count}; media ${media.length}, ${withData} with insights; account metrics stored`);
}

function summary() {
  const rows = db.prepare(`
    WITH latest AS (
      SELECT i.* FROM media_insights i
      JOIN (SELECT media_id, max(pulled_at) p FROM media_insights GROUP BY media_id) l ON l.media_id = i.media_id AND l.p = i.pulled_at)
    SELECT substr(m.timestamp, 1, 4) AS year, coalesce(m.media_product_type, m.media_type) AS kind, m.media_type, l.reach, l.views,
           l.likes, l.shares, l.saved, l.follows, l.total_interactions
    FROM media m JOIN latest l ON l.media_id = m.id`).all() as any[];
  const median = (xs: number[]) => { const s = xs.filter(x => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
  const groups = new Map<string, any[]>();
  for (const r of rows) {
    const k = `${r.year} ${r.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : r.kind === 'REELS' ? 'reel' : 'image'}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  console.log('year  format     posts  reach  views  likes  shares  saved  follows  ER(int/reach)');
  for (const [k, rs] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
    const er = median(rs.filter(r => r.reach).map(r => r.total_interactions / r.reach));
    console.log(`${k.padEnd(16)} ${String(rs.length).padStart(5)} ${[median(rs.map(r => r.reach)), median(rs.map(r => r.views)), median(rs.map(r => r.likes)), median(rs.map(r => r.shares)), median(rs.map(r => r.saved)), median(rs.map(r => r.follows))].map(v => String(v ?? '-').padStart(6)).join(' ')}   ${er == null ? '-' : (er * 100).toFixed(1) + '%'}`);
  }
}

if (process.argv.includes('--summary')) summary();
else { await pull(); summary(); }
