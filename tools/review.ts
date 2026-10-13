// Starts the local review app (drafts, approve / refine / reject) and serves the design labs.
//
//   node tools/review.ts          # http://127.0.0.1:4173/review
//   node tools/review.ts --lan    # also reachable from a phone on the same Wi-Fi, behind a one-time token
import { randomBytes } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { reviewHandler } from '../src/review/app.ts';
import { ROOT, startServer, type Handler } from '../src/render/server.ts';

const lan = process.argv.includes('--lan');
const token = lan ? randomBytes(9).toString('base64url') : '';

// Drafts hold member data: on the LAN every request needs the token (set as a cookie by the first URL).
const gate: Handler = (req, res) => {
  if (!lan) return false;
  const u = new URL(req.url ?? '/', 'http://x');
  if (u.searchParams.get('t') === token) { res.setHeader('set-cookie', `t=${token}; HttpOnly; SameSite=Strict; Path=/`); return false; }
  if ((req.headers.cookie ?? '').includes(`t=${token}`)) return false;
  res.writeHead(403).end('forbidden');
  return true;
};

// Design-lab picks from the gallery pages.
const labFeedback: Handler = async (req, res) => {
  if (req.method !== 'POST' || !req.url?.startsWith('/api/feedback')) return false;
  let body = '';
  for await (const chunk of req) body += chunk;
  const data = JSON.parse(body) as { lab?: string };
  const lab = String(data.lab ?? 'misc').replace(/[^\w-]/g, '');
  mkdirSync(join(ROOT, 'content/labs', lab), { recursive: true });
  appendFileSync(join(ROOT, 'content/labs', lab, 'feedback.jsonl'), JSON.stringify({ at: new Date().toISOString(), author: 'human', ...data }) + '\n');
  res.writeHead(204).end();
  return true;
};

let publishNow: ((id: string) => Promise<string>) | undefined;
try {
  publishNow = (await import('../src/publish/publish.ts')).publishDraftNow;
} catch { /* publisher not available yet */ }

await startServer({
  port: 4173,
  host: lan ? '0.0.0.0' : '127.0.0.1',
  handlers: [gate, labFeedback, reviewHandler({ publishNow: publishNow ? d => publishNow!(d.id) : undefined })],
});
if (lan) {
  const ip = Object.values(networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`this Mac:   http://127.0.0.1:4173/review?t=${token}`);
  console.log(`your phone: http://${ip}:4173/review?t=${token}   (same Wi-Fi)`);
} else {
  console.log('http://127.0.0.1:4173/review   ·   design lab: http://127.0.0.1:4173/content/labs/DL1/');
}
