// Instagram token status and refresh. Never prints the token.
//
//   node tools/ig-token.ts status    # is it valid, which account, days left (from IG_TOKEN_EXPIRES_AT)
//   node tools/ig-token.ts refresh   # extend by 60 days; writes the new token and dates back to .env
//
// Instagram Login has no endpoint that reports a token's expiry, so the refresh response's expires_in is
// recorded in .env (IG_TOKEN_REFRESHED_AT / IG_TOKEN_EXPIRES_AT). A token can be refreshed once it is at
// least 24 h old and still valid; an expired one must be re-issued in the Meta App Dashboard.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../src/data/db.ts';
import { ROOT } from '../src/render/server.ts';

const HOST = 'https://graph.instagram.com';
const redact = (s: string) => s.replace(/access_token=[^&"\s]+/g, 'access_token=<redacted>').replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"<redacted>"');

async function get(path: string, params: Record<string, string>) {
  const url = `${HOST}/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) throw new Error(`Instagram API ${res.status} on /${path}: ${redact(body).slice(0, 300)}`);
  return JSON.parse(body);
}

function writeEnv(updates: Record<string, string>) {
  const file = join(ROOT, '.env');
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const [k, v] of Object.entries(updates)) {
    const i = lines.findIndex(l => l.startsWith(`${k}=`));
    if (i >= 0) lines[i] = `${k}=${v}`;
    else lines.push(`${k}=${v}`);
  }
  writeFileSync(file, lines.join('\n').replace(/\n*$/, '\n'), { mode: 0o600 });
}

export function tokenDaysLeft(env = loadEnv()): number | null {
  if (!env.IG_TOKEN_EXPIRES_AT) return null;
  return Math.floor((Date.parse(env.IG_TOKEN_EXPIRES_AT) - Date.now()) / 86_400_000);
}

const cmd = process.argv[2] ?? 'status';
const env = loadEnv();
if (!env.IG_ACCESS_TOKEN) { console.error('IG_ACCESS_TOKEN missing in .env'); process.exit(2); }

if (cmd === 'status') {
  const me = await get('v25.0/me', { fields: 'username,account_type', access_token: env.IG_ACCESS_TOKEN });
  const days = tokenDaysLeft(env);
  console.log(`token works: @${me.username} (${me.account_type})`);
  console.log(days === null ? 'expiry unknown: run "node tools/ig-token.ts refresh" once to start tracking it'
    : `expires ${env.IG_TOKEN_EXPIRES_AT.slice(0, 10)} (${days} days left)${days < 7 ? '  REFRESH NOW' : ''}`);
} else if (cmd === 'refresh') {
  const r = await get('refresh_access_token', { grant_type: 'ig_refresh_token', access_token: env.IG_ACCESS_TOKEN });
  const now = new Date();
  const expires = new Date(now.getTime() + Number(r.expires_in) * 1000);
  writeEnv({ IG_ACCESS_TOKEN: r.access_token, IG_TOKEN_REFRESHED_AT: now.toISOString(), IG_TOKEN_EXPIRES_AT: expires.toISOString() });
  console.log(`refreshed: valid until ${expires.toISOString().slice(0, 10)} (${Math.round(Number(r.expires_in) / 86400)} days), written to .env`);
} else {
  console.error('usage: node tools/ig-token.ts status|refresh');
  process.exit(2);
}
