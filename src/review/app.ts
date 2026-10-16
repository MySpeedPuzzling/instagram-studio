// Local review app: the owner's approve / refine / reject surface for drafts.
// Feed, grid and Story mocks show each draft the way followers will meet it (Instagram-simulated previews).
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { lintCaption, type Pillar } from '../captions/lint.ts';
import { escapeHtml as h } from '../design/page.ts';
import { addFeedback, feedback, listDrafts, loadDraft, REJECT_REASONS, saveDraft, transition, type Draft } from '../drafts/model.ts';
import { ROOT, type Handler } from '../render/server.ts';
import { factsAge, MAX_FACTS_AGE_HOURS } from '../publish/publish.ts';

export interface ReviewHooks {
  /** Called when the owner approves with "publish now"; returns a message for the page. */
  publishNow?: (d: Draft) => Promise<string>;
}

const STATUS_ORDER = ['in_review', 'changes_requested', 'drafted', 'approved', 'scheduled', 'publishing', 'failed', 'needs_reschedule', 'published', 'rejected', 'idea'];
const pillarOf = (d: Draft): Pillar => (d.format === 'carousel' ? 'carousel' : d.format === 'reel' ? 'reel' : d.format === 'story' ? 'story' : 'single');
const url = (p: string) => '/' + p.replace(/^\/+/, '');

function realGrid(): string[] {
  const d = join(ROOT, 'var/ig-compression');
  return existsSync(d) ? readdirSync(d).filter(f => f.endsWith('_0.jpg')).sort().reverse().slice(0, 11).map(f => `/var/ig-compression/${f}`) : [];
}

const CSS = `
@font-face { font-family: 'Rubik'; src: url('/assets/fonts/rubik/Rubik%5Bwght%5D.ttf'); font-weight: 300 900; }
:root { --bg: #f4f5f7; --ink: #1d2230; --muted: #667085; --line: #e3e6eb; --card: #fff; --accent: #4e54c8; --ok: #067647; --bad: #b42318; --warn: #b54708; }
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.45 -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
a { color: var(--accent); text-decoration: none; }
header { position: sticky; top: 0; z-index: 5; background: #fff; border-bottom: 1px solid var(--line); padding: 10px 20px; display: flex; gap: 18px; align-items: center; }
header b { font: 600 17px Rubik, sans-serif; }
main { padding: 20px; max-width: 1280px; margin: 0 auto; }
h2 { font: 600 18px Rubik, sans-serif; margin: 26px 0 10px; text-transform: capitalize; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; color: inherit; }
.card img { width: 100%; aspect-ratio: 4/5; object-fit: cover; display: block; }
.card div { padding: 8px 10px; font-size: 13px; }
.pill { display: inline-block; font-size: 12px; padding: 1px 8px; border-radius: 10px; background: #eef0f6; color: var(--muted); }
.layout { display: grid; grid-template-columns: 380px 1fr; gap: 28px; align-items: start; }
@media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
.phone { width: 360px; background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.phone.story { width: 300px; }
.ig-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 13px; }
.avatar { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); }
.media { position: relative; aspect-ratio: 4/5; overflow: hidden; background: #eee; }
.story .media { aspect-ratio: 9/16; }
.track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.count { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; }
.dots { display: flex; justify-content: center; gap: 4px; padding: 7px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: #cfd4dc; } .dots i.on { background: #3897f0; }
.cap { font-size: 13px; margin: 0 10px 12px; white-space: pre-wrap; }
.cap .more { color: var(--muted); cursor: pointer; }
.tabs { display: flex; gap: 6px; margin: 0 0 10px; } .tabs button { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 5px 10px; cursor: pointer; } .tabs button.on { border-color: var(--accent); color: var(--accent); }
.grid { display: grid; grid-template-columns: repeat(3, 118px); gap: 2px; background: #fff; padding: 2px; border: 1px solid var(--line); border-radius: 10px; width: max-content; }
.grid img { width: 118px; aspect-ratio: 3/4; object-fit: cover; display: block; } .grid img.real { opacity: .8; }
.panel { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; }
.panel h3 { font: 600 15px Rubik, sans-serif; margin: 0 0 10px; }
textarea, input, select { font: inherit; border: 1px solid var(--line); border-radius: 8px; padding: 8px; width: 100%; }
textarea.caption { min-height: 230px; }
.meta { display: flex; gap: 14px; font-size: 13px; color: var(--muted); margin: 6px 0; flex-wrap: wrap; }
.lint li.err { color: var(--bad); } .lint li.warn { color: var(--warn); } .lint ul { margin: 6px 0 0; padding-left: 18px; font-size: 13px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
button.primary, button.secondary, button.danger { border: 0; border-radius: 9px; padding: 9px 14px; font: 600 14px Rubik, sans-serif; cursor: pointer; }
button.primary { background: var(--accent); color: #fff; } button.secondary { background: #eef0f6; color: var(--ink); } button.danger { background: #fde8e7; color: var(--bad); }
.fb { font-size: 13px; border-top: 1px solid var(--line); padding: 8px 0; } .fb b { text-transform: capitalize; }
.msg { font-size: 13px; color: var(--ok); }
.alt { display: grid; grid-template-columns: 70px 1fr; gap: 10px; align-items: start; margin-bottom: 10px; } .alt img { width: 70px; aspect-ratio: 4/5; object-fit: cover; border-radius: 6px; }
`;

const layout = (title: string, body: string, script = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${h(title)}</title><style>${CSS}</style></head>
<body><header><b>MSP review</b><a href="/review">Drafts</a><a href="/content/labs/DL4/">House system (DL4)</a><a href="/content/labs/DL1/">Design lab (styles)</a><a href="/content/labs/DL2/">Creative lab (formats)</a><a href="/content/labs/DL3/">Idea prototypes</a><a href="/content/labs/AI1/">AI images</a><a href="/content/labs/IL1/">Illustration lab (IL1)</a><a href="/content/labs/LM1/">Logo motion (LM1)</a></header><main>${body}</main>
<script>
async function post(path, data) {
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data || {}) });
  const t = await r.text(); if (!r.ok) { alert(t); throw new Error(t); } return t ? JSON.parse(t) : {};
}
document.querySelectorAll('.media').forEach(m => {
  const track = m.querySelector('.track'), count = m.querySelector('.count'), dots = m.parentElement.querySelectorAll('.dots i');
  track && track.addEventListener('scroll', () => { const i = Math.round(track.scrollLeft / track.clientWidth);
    if (count) count.textContent = (i + 1) + '/' + m.dataset.count; dots.forEach((d, j) => d.classList.toggle('on', j === i)); });
});
${script}
</script></body></html>`;

function phone(d: Draft) {
  const story = d.format === 'story' || d.format === 'reel';
  const slides = d.slides.map(s => url(s.preview ?? s.file));
  const first = d.caption.split('\n')[0];
  const short = [...d.caption].length > 125 ? [...d.caption].slice(0, 125).join('') : d.caption;
  return `<div class="phone ${story ? 'story' : ''}">
    <div class="ig-head"><img class="avatar" src="/assets/brand/speedpuzzling-logo-square.png" alt=""><b>myspeedpuzzling</b></div>
    <div class="media" data-count="${slides.length}"><div class="track">${slides.map(s => `<img src="${s}" alt="">`).join('')}</div>
    ${slides.length > 1 ? `<span class="count">1/${slides.length}</span>` : ''}</div>
    ${slides.length > 1 ? `<div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '<div style="height:8px"></div>'}
    ${story ? '' : `<p class="cap" id="cap"><b>myspeedpuzzling</b> <span id="capShort">${h(short)}</span>${short !== d.caption ? `<span class="more" onclick="this.previousElementSibling.textContent=${h(JSON.stringify(d.caption))};this.remove()">… more</span>` : ''}</p>`}
    ${first ? '' : ''}
  </div>`;
}

function indexPage() {
  const drafts = listDrafts();
  const groups = STATUS_ORDER.map(s => [s, drafts.filter(d => d.status === s)] as const).filter(([, ds]) => ds.length);
  const body = drafts.length ? groups.map(([s, ds]) => `<h2>${s.replace(/_/g, ' ')} (${ds.length})</h2><div class="cards">${ds.map(d => `
    <a class="card" href="/review/d/${d.id}"><img src="${url(d.slides[0]?.preview ?? d.slides[0]?.file ?? '')}" alt="">
    <div><b>${h(d.title)}</b><br><span class="pill">${h(d.format)}</span> <span class="pill">${h(d.pillar ?? '')}</span> <span class="pill">v${d.version}</span></div></a>`).join('')}</div>`).join('')
    : '<p>No drafts yet. Claude creates them under content/drafts/.</p>';
  return layout('Drafts', body);
}

function draftPage(d: Draft) {
  const fb = feedback(d.id);
  const lint = lintCaption(d.caption, pillarOf(d));
  const grid = [url(d.slides[0]?.preview ?? d.slides[0]?.file ?? ''), ...realGrid()];
  const canAct = ['in_review', 'changes_requested', 'drafted', 'failed', 'needs_reschedule', 'approved'].includes(d.status);
  const body = `
  <p><a href="/review">← Drafts</a> · <span class="pill">${h(d.status.replace(/_/g, ' '))}</span> <span class="pill">v${d.version}</span> ${d.permalink ? `· <a href="${h(d.permalink)}">on Instagram</a>` : ''}</p>
  <h2 style="text-transform:none">${h(d.title)}</h2>
  <div class="layout">
    <div>
      <div class="tabs"><button class="on" data-view="feed">Feed</button><button data-view="grid">Profile grid</button></div>
      <div data-pane="feed">${phone(d)}</div>
      <div data-pane="grid" hidden><div class="grid">${grid.map((g, i) => `<img src="${g}" class="${i ? 'real' : ''}" alt="">`).join('')}</div>
        <p class="meta">Top-left tile: this draft, cropped to the grid's 3:4. Others: the latest real posts.</p></div>
    </div>
    <div>
      ${(() => { const a = factsAge(d.id); return a.ok
        ? `<div class="panel"><h3>Data</h3><p class="meta">${a.oldest ? `Queried ${h(a.oldest.slice(0, 16).replace('T', ' '))} UTC (fresh: under ${MAX_FACTS_AGE_HOURS} h).` : 'No data in this post.'}</p></div>`
        : `<div class="panel" style="border-color:#f04438"><h3 style="color:#b42318">Data is not fresh</h3><p class="meta" style="color:#b42318">${h(a.problem ?? '')}. Ask Claude to refresh this draft; it can't be published until then.</p></div>`; })()}
      <div class="panel"><h3>Caption ${d.caption_author === 'human' ? '<span class="pill">edited by you</span>' : ''}</h3>
        <textarea class="caption" id="caption">${h(d.caption)}</textarea>
        <div class="meta"><span id="chars"></span><span id="tags"></span><span id="mentions"></span></div>
        <div class="lint" id="lint">${lintHtml(lint)}</div>
        <div class="actions" style="margin-top:10px"><button class="secondary" id="saveCaption">Save my caption edit</button><span class="msg" id="capMsg"></span></div>
      </div>
      <div class="panel"><h3>Alt text</h3>${d.slides.map((s, i) => `<div class="alt"><img src="${url(s.preview ?? s.file)}" alt=""><textarea data-alt="${i}" rows="3">${h(s.alt)}</textarea></div>`).join('')}
        <button class="secondary" id="saveAlt">Save alt text</button> <span class="msg" id="altMsg"></span></div>
      <div class="panel"><h3>Decide</h3>
        ${canAct ? `<div class="actions" style="margin-bottom:12px">
          <button class="primary" id="approveNow">Approve and publish now</button>
          <input type="datetime-local" id="when" style="width:auto"><button class="secondary" id="approveAt">Approve for this time</button></div>
        <textarea id="fbText" rows="3" placeholder="What should change? (one note per point; target below)"></textarea>
        <div class="actions" style="margin-top:8px">
          <select id="fbTarget" style="width:auto"><option value="general">General</option><option value="caption">Caption</option><option value="alt">Alt text</option>${d.slides.map((_, i) => `<option value="slide:${i + 1}">Slide ${i + 1}</option>`).join('')}</select>
          <button class="secondary" id="comment">Add note</button><button class="secondary" id="changes">Request changes</button>
          <select id="reason" style="width:auto">${REJECT_REASONS.map(r => `<option>${r}</option>`).join('')}</select><button class="danger" id="reject">Reject</button>
        </div><p class="msg" id="decideMsg"></p>` : `<p class="meta">No actions in this state.</p>`}
      </div>
      <div class="panel"><h3>History</h3>${fb.length ? fb.slice().reverse().map(f => `<div class="fb"><b>${h(f.kind.replace(/_/g, ' '))}</b> ${f.target ? `· ${h(f.target)}` : ''} ${f.reason ? `· ${h(f.reason)}` : ''} <span class="meta">${h(f.author)} · ${h(f.at.slice(0, 16).replace('T', ' '))}${f.version ? ` · v${f.version}` : ''}</span>${f.text ? `<br>${h(f.text)}` : ''}</div>`).join('') : '<p class="meta">Nothing yet.</p>'}</div>
    </div>
  </div>`;
  const script = `
const id = ${JSON.stringify(d.id)}, pillar = ${JSON.stringify(pillarOf(d))};
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== b.dataset.view);
});
const cap = document.getElementById('caption');
async function relint() {
  const t = cap.value; document.getElementById('chars').textContent = [...t].length + ' / 2,200 characters';
  document.getElementById('tags').textContent = (t.match(/#[\\p{L}\\d_]+/gu) || []).length + ' hashtags (2–4)';
  document.getElementById('mentions').textContent = (t.match(/@[\\w.]+/g) || []).length + ' mentions';
  const r = await post('/api/lint', { caption: t, pillar }); document.getElementById('lint').innerHTML = r.html;
  const s = [...t].length > 125 ? [...t].slice(0, 125).join('') : t; const cs = document.getElementById('capShort'); if (cs) cs.textContent = s;
}
let timer; cap.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(relint, 250); }); relint();
document.getElementById('saveCaption').onclick = async () => { await post('/api/d/' + id + '/caption', { caption: cap.value }); document.getElementById('capMsg').textContent = 'Saved as your edit'; };
document.getElementById('saveAlt').onclick = async () => { const alts = [...document.querySelectorAll('[data-alt]')].map(t => t.value); await post('/api/d/' + id + '/alt', { alts }); document.getElementById('altMsg').textContent = 'Saved'; };
const msg = t => document.getElementById('decideMsg').textContent = t;
const val = i => (document.getElementById(i) || {}).value;
const on = (i, f) => { const el = document.getElementById(i); if (el) el.onclick = f; };
on('approveNow', async () => { if (!confirm('Publish this post to @myspeedpuzzling now?')) return; const r = await post('/api/d/' + id + '/approve', { mode: 'now' }); msg(r.message); setTimeout(() => location.reload(), 1500); });
on('approveAt', async () => { if (!val('when')) return alert('Pick a time'); const r = await post('/api/d/' + id + '/approve', { mode: 'schedule', at: new Date(val('when')).toISOString() }); msg(r.message); setTimeout(() => location.reload(), 1200); });
on('comment', async () => { await post('/api/d/' + id + '/feedback', { kind: 'comment', target: val('fbTarget'), text: val('fbText') }); location.reload(); });
on('changes', async () => { await post('/api/d/' + id + '/feedback', { kind: 'request_changes', target: val('fbTarget'), text: val('fbText') }); location.reload(); });
on('reject', async () => { if (!confirm('Reject this draft?')) return; await post('/api/d/' + id + '/feedback', { kind: 'reject', reason: val('reason'), text: val('fbText') }); location.reload(); });
`;
  return layout(d.title, body, script);
}

function lintHtml(r: ReturnType<typeof lintCaption>) {
  if (!r.errors.length && !r.warnings.length) return '<p class="msg">Lint: clean</p>';
  return `<ul>${r.errors.map(e => `<li class="err">${h(e)}</li>`).join('')}${r.warnings.map(w => `<li class="warn">${h(w)}</li>`).join('')}</ul>`;
}

async function body(req: IncomingMessage): Promise<any> {
  let s = '';
  for await (const c of req) s += c;
  return s ? JSON.parse(s) : {};
}
const json = (res: ServerResponse, code: number, data: unknown) => { res.writeHead(code, { 'content-type': 'application/json' }).end(JSON.stringify(data)); return true; };
const html = (res: ServerResponse, page: string) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(page); return true; };

export function reviewHandler(hooks: ReviewHooks = {}): Handler {
  return async (req, res) => {
    const u = new URL(req.url ?? '/', 'http://x');
    const p = u.pathname;
    try {
      if (req.method === 'GET' && (p === '/' || p === '/review' || p === '/review/')) return html(res, indexPage());
      let m = p.match(/^\/review\/d\/([\w-]+)$/);
      if (req.method === 'GET' && m) return html(res, draftPage(loadDraft(m[1])));
      if (req.method !== 'POST') return false;
      if (p === '/api/lint') { const b = await body(req); return json(res, 200, { html: lintHtml(lintCaption(String(b.caption ?? ''), b.pillar)) }); }
      m = p.match(/^\/api\/d\/([\w-]+)\/(caption|alt|feedback|approve)$/);
      if (!m) return false;
      const d = loadDraft(m[1]);
      const b = await body(req);
      switch (m[2]) {
        case 'caption':
          d.caption = String(b.caption).replace(/\r/g, '');
          d.caption_author = 'human';
          saveDraft(d);
          addFeedback(d.id, { author: 'human', kind: 'caption_edit', target: 'caption', text: d.caption, version: d.version });
          return json(res, 200, {});
        case 'alt':
          (b.alts as string[]).forEach((a, i) => { if (d.slides[i]) d.slides[i].alt = a; });
          saveDraft(d);
          return json(res, 200, {});
        case 'feedback': {
          const kind = b.kind as 'comment' | 'request_changes' | 'reject';
          if (kind === 'request_changes') transition(d, 'changes_requested');
          if (kind === 'reject') transition(d, 'rejected');
          if (kind !== 'comment') saveDraft(d);
          addFeedback(d.id, { author: 'human', kind, target: b.target, text: b.text || undefined, reason: b.reason, version: d.version });
          return json(res, 200, {});
        }
        case 'approve': {
          if (d.status !== 'approved') transition(d, 'approved');
          addFeedback(d.id, { author: 'human', kind: 'approve', text: b.mode === 'schedule' ? `scheduled for ${b.at}` : 'publish now', version: d.version });
          if (b.mode === 'schedule') {
            d.scheduled_for = b.at;
            transition(d, 'scheduled');
            saveDraft(d);
            return json(res, 200, { message: `Scheduled for ${new Date(b.at).toLocaleString('en-GB')}` });
          }
          saveDraft(d);
          if (!hooks.publishNow) return json(res, 200, { message: 'Approved. The publisher is not configured yet, so nothing was posted.' });
          return json(res, 200, { message: await hooks.publishNow(d) });
        }
      }
      return false;
    } catch (e) {
      return json(res, 400, { error: (e as Error).message });
    }
  };
}
