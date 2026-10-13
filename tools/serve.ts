// Local review server: serves the gallery and labs, and records feedback.
//
//   node tools/serve.ts            # http://127.0.0.1:4173/content/labs/DL1/
//   node tools/serve.ts --lan      # also reachable from a phone on the same Wi-Fi (prints a URL with a token)
import { appendFileSync, mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { ROOT, startServer, type Handler } from '../src/render/server.ts';

const lan = process.argv.includes('--lan');
const token = lan ? randomBytes(9).toString('base64url') : '';

const feedback: Handler = async (req, res) => {
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

// On the LAN every request needs the token (cookie set by the first URL), since drafts hold member data.
const gate: Handler = (req, res) => {
  if (!lan) return false;
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.searchParams.get('t') === token) { res.setHeader('set-cookie', `t=${token}; HttpOnly; SameSite=Strict; Path=/`); return false; }
  if ((req.headers.cookie ?? '').includes(`t=${token}`)) return false;
  res.writeHead(403).end('forbidden');
  return true;
};

const server = await startServer({ port: 4173, host: lan ? '0.0.0.0' : '127.0.0.1', handlers: [gate, feedback] });
const path = '/content/labs/DL1/';
if (lan) {
  const ip = Object.values(networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`on this Mac: http://127.0.0.1:4173${path}?t=${token}`);
  console.log(`on your phone (same Wi-Fi): http://${ip}:4173${path}?t=${token}`);
} else {
  console.log(`${server.url}${path}`);
}
