// Insights page of the review app: every published post, Reel and Story with its latest numbers from
// content/state.sqlite (filled twice a day by the background pull, see CLAUDE.md "Background jobs"), judged against
// the account's own median for the same format; medians by format, series and mechanic with the number of posts
// behind each; the automatic reports from content/reports/.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import { listDrafts, type Draft } from '../drafts/model.ts';
import { ROOT } from '../render/server.ts';
import { openStore } from '../store/db.ts';

type Kind = 'carousel' | 'image' | 'reel' | 'story';
interface Row {
  id: string; timestamp: string; kind: Kind; permalink: string | null; draft?: Draft; tags: Record<string, string | number>;
  pulled_at: string; age_hours: number; snapshots: number;
  views: number | null; reach: number | null; likes: number | null; comments: number | null; shares: number | null; saved: number | null;
  follows: number | null; profile_visits: number | null; avg_watch_time_ms: number | null; raw: Record<string, number>;
}
const REPORTS = join(ROOT, 'content/reports');
const KIND_LABEL: Record<Kind, string> = { carousel: 'Carousel', image: 'Image', reel: 'Reel', story: 'Story' };
const median = (xs: Array<number | null | undefined>) => { const s = xs.filter((x): x is number => x != null).sort((a, b) => a - b); return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2 : null; };
const n0 = (v: number | null | undefined) => (v == null ? '<span class="na">n/a</span>' : fmtInt(v));
const pct = (a: number | null | undefined, b: number | null | undefined) => (a == null || !b ? null : (100 * a) / b);
const p1 = (v: number | null) => (v == null ? '<span class="na">n/a</span>' : `${v.toFixed(1)}%`);
const still = (d?: Draft) => { const f = d?.slides[0]?.preview ?? d?.slides[0]?.file; return f ? '/' + f.replace(/\.mp4$/i, '-preview.jpg') : ''; };
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' });

function load(): { rows: Row[]; followers: Array<{ pulled_at: string; followers: number }> } {
  const db = openStore();
  const drafts = new Map(listDrafts().map(d => [d.id, d]));
  const raw = db.prepare(`
    SELECT m.id, m.timestamp, m.media_type, m.media_product_type, m.permalink, m.draft_id, m.tags, i.*,
           (SELECT count(*) FROM media_insights x WHERE x.media_id = m.id) AS snapshots
    FROM media m JOIN media_insights i ON i.media_id = m.id
    WHERE i.pulled_at = (SELECT max(pulled_at) FROM media_insights x WHERE x.media_id = m.id)
    ORDER BY m.timestamp DESC`).all() as any[];
  const rows = raw.map((r): Row => {
    const draft = r.draft_id ? drafts.get(r.draft_id) : undefined;
    const kind: Kind = r.media_product_type === 'STORY' ? 'story'
      : r.media_product_type === 'REELS' || draft?.format === 'reel' || /\/reel\//.test(r.permalink ?? '') ? 'reel'
      : r.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image';
    let tags = {}, metrics = {};
    try { tags = JSON.parse(r.tags ?? '{}') ?? {}; } catch { /* no tags */ }
    try { metrics = JSON.parse(r.raw ?? '{}') ?? {}; } catch { /* no raw */ }
    return { ...r, kind, draft, tags, raw: metrics };
  });
  const followers = db.prepare('SELECT pulled_at, followers FROM account_snapshot ORDER BY pulled_at').all() as any[];
  db.close();
  return { rows, followers };
}

/** Snapshots of one post over time, oldest first (for the draft page). */
export function snapshotsOf(draftId: string) {
  const db = openStore();
  const rows = db.prepare(`SELECT i.pulled_at, i.age_hours, i.views, i.reach, i.likes, i.comments, i.shares, i.saved, i.follows, i.avg_watch_time_ms
    FROM media m JOIN media_insights i ON i.media_id = m.id WHERE m.draft_id = ? ORDER BY i.pulled_at`).all(draftId) as any[];
  db.close();
  return rows;
}

/** The "Insights" panel of a published draft's page: the latest numbers and how they grew. */
export function draftInsightsPanel(draftId: string): string {
  const s = snapshotsOf(draftId);
  if (!s.length) return '';
  return `<div class="panel"><h3>Insights</h3><table class="ins-mini"><thead><tr><th>Age</th><th>Reach</th><th>Views</th><th>Likes</th><th>Comments</th><th>Sends</th><th>Saves</th></tr></thead><tbody>
    ${s.map(r => `<tr><td>${r.age_hours < 72 ? `${Math.round(r.age_hours)} h` : `${Math.round(r.age_hours / 24)} d`}</td><td>${n0(r.reach)}</td><td>${n0(r.views)}</td><td>${n0(r.likes)}</td><td>${n0(r.comments)}</td><td>${n0(r.shares)}</td><td>${n0(r.saved)}</td></tr>`).join('')}
    </tbody></table><p class="meta"><a href="/review/insights">All posts compared</a></p></div>`;
}

export const INSIGHTS_CSS = `
.ins-top { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
.tile { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; min-width: 150px; }
.tile b { display: block; font: 600 24px Rubik, sans-serif; } .tile span { font-size: 12px; color: var(--muted); }
.filters { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 12px; align-items: center; }
.filters button { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 5px 10px; cursor: pointer; font: inherit; }
.filters button.on { border-color: var(--accent); color: var(--accent); }
.tablewrap { overflow-x: auto; background: var(--card); border: 1px solid var(--line); border-radius: 12px; }
table.ins { border-collapse: collapse; width: 100%; font-size: 13px; font-variant-numeric: tabular-nums; }
table.ins th, table.ins td { padding: 7px 10px; text-align: right; border-bottom: 1px solid var(--line); white-space: nowrap; }
table.ins th { font-weight: 600; color: var(--muted); cursor: pointer; user-select: none; position: sticky; top: 0; background: #fff; }
table.ins th.sorted::after { content: ' ↓'; } table.ins th.sorted.asc::after { content: ' ↑'; }
table.ins td.date, table.ins th.date { text-align: left; color: var(--muted); }
table.ins td.post, table.ins th.post { text-align: left; white-space: normal; min-width: 240px; }
table.ins tr:hover td { background: #f8f9fb; }
.post a { display: flex; gap: 10px; align-items: center; color: inherit; } .post img { width: 34px; height: 42px; object-fit: cover; border-radius: 4px; flex: none; background: #eef0f6; }
.post small { display: block; color: var(--muted); }
.vs { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
.vs i { display: block; height: 8px; border-radius: 0 4px 4px 0; background: #4e54c8; min-width: 2px; }
.vs i.low { background: #b9bce8; }
.vs em { font-style: normal; color: var(--muted); min-width: 38px; }
.na { color: #b3b9c4; }
.groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 16px; margin-top: 22px; }
.groups table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.groups th, .groups td { padding: 5px 6px; text-align: right; border-bottom: 1px solid var(--line); } .groups th:first-child, .groups td:first-child { text-align: left; }
.groups th { color: var(--muted); font-weight: 600; }
.few { color: var(--warn); }
table.ins-mini { border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; } table.ins-mini th, table.ins-mini td { padding: 4px 12px 4px 0; text-align: right; } table.ins-mini th { color: var(--muted); font-weight: 600; }
.report { white-space: pre-wrap; font: 14px/1.5 -apple-system, system-ui, sans-serif; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px 22px; }
`;

const SINCE_DEFAULT = '2026-10-17'; // the pipeline's first post

export function insightsPage(q: URLSearchParams): string {
  const { rows: all, followers } = load();
  const since = q.get('since') === 'all' ? '' : SINCE_DEFAULT;
  const rows = all.filter(r => r.timestamp >= since);
  const med: Record<Kind, { reach: number | null; n: number }> = Object.fromEntries((['carousel', 'image', 'reel', 'story'] as Kind[]).map(k => {
    // a post counts towards the median once it is a day old (Stories: once they have been read at all)
    const rs = rows.filter(r => r.kind === k && (k === 'story' ? (r.reach ?? 0) > 0 : r.age_hours >= 24));
    return [k, { reach: median(rs.map(r => r.reach)), n: rs.length }];
  })) as Record<Kind, { reach: number | null; n: number }>;
  const maxReach = Math.max(1, ...rows.map(r => r.reach ?? 0));
  const lastPull = all.map(r => r.pulled_at).sort().pop();
  const f0 = followers[0], f1 = followers[followers.length - 1];

  const tr = (r: Row) => {
    const m = med[r.kind].reach, ratio = r.reach != null && m ? r.reach / m : null;
    const title = r.draft?.title ?? (r.kind === 'story' ? 'Story' : 'Posted by hand');
    const sendRate = pct(r.shares, r.reach), watch = r.avg_watch_time_ms != null ? r.avg_watch_time_ms / 1000 : null;
    const link = r.draft ? `/review/d/${r.draft.id}` : r.permalink ?? '#';
    const extra = r.kind === 'story' ? [r.raw.replies != null ? `${r.raw.replies} replies` : '', r.raw.nav_tap_exit != null ? `${r.raw.nav_tap_exit} exits` : ''].filter(Boolean).join(' · ') : String(r.tags.series ?? '');
    const cell = (v: number | null, sort = v) => `<td data-v="${sort ?? -1}">${n0(v)}</td>`;
    return `<tr data-kind="${r.kind}">
      <td class="date" data-v="${h(r.timestamp)}">${when(r.timestamp)}</td>
      <td class="post" data-v="${h(title.toLowerCase())}"><a href="${h(link)}">${still(r.draft) ? `<img src="${h(still(r.draft))}" alt="" loading="lazy">` : '<img alt="">'}<span>${h(title)}<small>${KIND_LABEL[r.kind]}${extra ? ' · ' + h(extra) : ''} · read at ${r.age_hours < 72 ? `${Math.round(r.age_hours)} h` : `${Math.round(r.age_hours / 24)} d`}</small></span></a></td>
      <td data-v="${r.reach ?? -1}" title="${ratio == null ? 'no median to compare with' : `${ratio.toFixed(2)}× the median ${KIND_LABEL[r.kind].toLowerCase()} (${fmtInt(Math.round(m!))}, ${med[r.kind].n} posts)`}"><div class="vs"><span>${n0(r.reach)}</span><i class="${ratio != null && ratio < 1 ? 'low' : ''}" style="width:${Math.round((90 * (r.reach ?? 0)) / maxReach)}px"></i><em>${ratio == null ? '' : ratio.toFixed(1) + '×'}</em></div></td>
      ${cell(r.views)}${cell(r.likes)}${cell(r.comments)}${cell(r.shares)}${cell(r.saved)}
      <td data-v="${sendRate ?? -1}">${p1(sendRate)}</td>${cell(r.follows)}
      <td data-v="${watch ?? -1}">${watch == null ? '<span class="na">n/a</span>' : watch.toFixed(1) + ' s'}</td></tr>`;
  };

  // medians by group, always with the number of posts behind them
  const group = (name: string, keyOf: (r: Row) => string[]) => {
    const g = new Map<string, Row[]>();
    for (const r of rows.filter(x => x.kind !== 'story' && x.age_hours >= 24)) for (const k of keyOf(r)) g.set(k, [...(g.get(k) ?? []), r]);
    const out = [...g.entries()].map(([k, rs]) => ({ k, n: rs.length, reach: median(rs.map(r => r.reach)), sends: median(rs.map(r => r.shares)), saves: median(rs.map(r => r.saved)), rate: median(rs.map(r => pct(r.shares, r.reach))) }))
      .sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0));
    const top = Math.max(1, ...out.map(o => o.reach ?? 0));
    return `<div class="panel"><h3>${h(name)}</h3><table><thead><tr><th>${h(name.replace(/^By /, ''))}</th><th>Posts</th><th>Median reach</th><th>Sends</th><th>Saves</th><th>Send rate</th></tr></thead><tbody>
      ${out.map(o => `<tr title="${o.n < 4 ? 'Fewer than 4 posts: a hunch, not a finding' : ''}"><td>${h(o.k)}</td><td class="${o.n < 4 ? 'few' : ''}">${o.n}</td><td><div class="vs"><span>${n0(o.reach == null ? null : Math.round(o.reach))}</span><i style="width:${Math.round((60 * (o.reach ?? 0)) / top)}px"></i></div></td><td>${n0(o.sends == null ? null : Math.round(o.sends))}</td><td>${n0(o.saves == null ? null : Math.round(o.saves))}</td><td>${p1(o.rate)}</td></tr>`).join('')}
      </tbody></table></div>`;
  };
  const mech = (r: Row) => String(r.tags.mechanic ?? '').split(/\s*\+\s*/).map(s => s.trim().toLowerCase()).filter(Boolean);

  const reports = existsSync(REPORTS) ? readdirSync(REPORTS).filter(f => f.endsWith('.md')).map(f => ({ f, t: statSync(join(REPORTS, f)).mtime })).sort((a, b) => +b.t - +a.t) : [];
  const body = `
  <h2 style="text-transform:none">Insights</h2>
  <div class="ins-top">
    <div class="tile"><b>${f1 ? fmtInt(f1.followers) : 'n/a'}</b><span>followers${f0 && f1 && f0 !== f1 ? ` (${f1.followers - f0.followers >= 0 ? '+' : ''}${fmtInt(f1.followers - f0.followers)} since ${when(f0.pulled_at).split(',')[0]})` : ''}</span></div>
    ${(['carousel', 'reel', 'image', 'story'] as Kind[]).filter(k => med[k].n).map(k => `<div class="tile"><b>${med[k].reach == null ? 'n/a' : fmtInt(Math.round(med[k].reach!))}</b><span>median reach, ${KIND_LABEL[k].toLowerCase()} (${med[k].n} posts)</span></div>`).join('')}
    <div class="tile"><b style="font-size:17px; line-height:29px">${lastPull ? when(lastPull) : 'never'}</b><span>last pull (automatic at 08:10 and 20:10)</span></div>
  </div>
  <div class="filters" id="kinds"><button class="on" data-k="">All</button>${(['carousel', 'reel', 'image', 'story'] as Kind[]).filter(k => med[k].n).map(k => `<button data-k="${k}">${k === 'story' ? 'Stories' : KIND_LABEL[k] + 's'}</button>`).join('')}
    <span class="meta" style="margin-left:auto">${since ? `Since the first pipeline post (17 Oct 2026) · <a href="/review/insights?since=all">show everything</a>` : `All posts with numbers · <a href="/review/insights">since 17 Oct 2026 only</a>`}</span></div>
  <div class="tablewrap"><table class="ins" id="ins"><thead><tr><th class="date sorted" data-t="s">Date</th><th class="post" data-t="s">Post</th><th>Reach vs median</th><th>Views</th><th>Likes</th><th>Comments</th><th>Sends</th><th>Saves</th><th>Send rate</th><th>Follows</th><th>Avg watch</th></tr></thead>
    <tbody>${rows.map(tr).join('')}</tbody></table></div>
  <p class="meta">Reach is compared with the median of the same format in this list (hover a bar); posts younger than a day are shown but not counted in medians or groups. A Trial Reel's reach is non-followers. Story numbers exist only if a pull ran while the Story was live. History is thin before 12 Nov 2026: until then numbers were pulled on five days only.</p>
  <div class="groups">${group('By format', r => [KIND_LABEL[r.kind]])}${group('By series', r => [String(r.tags.series ?? 'untagged')])}${group('By mechanic', r => (mech(r).length ? mech(r) : ['untagged']))}</div>
  <p class="meta">A post with two mechanics counts in both rows. Orange counts mean fewer than 4 posts: a hunch, not a finding.</p>
  <h2>Reports</h2>
  ${reports.length ? `<div class="panel">${reports.map(r => `<div class="fb"><a href="/review/report/${encodeURIComponent(r.f)}">${h(r.f.replace(/\.md$/, ''))}</a> · ${when(r.t.toISOString())}</div>`).join('')}</div>` : '<p class="meta">No automatic reports yet. The first one (pile-of-shame, +24 h) is due Fri 13 Nov 11:41.</p>'}`;
  const script = `
const tb = document.querySelector('#ins tbody'), ths = [...document.querySelectorAll('#ins th')];
ths.forEach((th, i) => th.onclick = () => {
  const asc = th.classList.contains('sorted') && !th.classList.contains('asc');
  ths.forEach(x => x.classList.remove('sorted', 'asc')); th.classList.add('sorted'); if (asc) th.classList.add('asc');
  const str = th.dataset.t === 's';
  [...tb.rows].sort((a, b) => { const x = a.cells[i].dataset.v, y = b.cells[i].dataset.v; const d = str ? x.localeCompare(y) : Number(x) - Number(y); return asc ? d : -d; }).forEach(r => tb.appendChild(r));
});
document.querySelectorAll('#kinds button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#kinds button').forEach(x => x.classList.toggle('on', x === b));
  [...tb.rows].forEach(r => r.hidden = !!b.dataset.k && r.dataset.kind !== b.dataset.k);
});`;
  return JSON.stringify({ body, script });
}

export function reportPage(name: string): string | null {
  const f = join(REPORTS, name);
  if (!/^[\w.-]+\.md$/.test(name) || !existsSync(f)) return null;
  return `<p><a href="/review/insights">← Insights</a></p><h2 style="text-transform:none">${h(name.replace(/\.md$/, ''))}</h2><div class="report">${h(readFileSync(f, 'utf8'))}</div>`;
}
