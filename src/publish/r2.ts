// Cloudflare R2 (S3 API) as the public media host Meta fetches images from. SigV4 signing with node:crypto,
// no SDK. Objects get random keys and are deleted right after publishing (plus a bucket lifecycle rule).
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadEnv } from '../data/db.ts';

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest();

export interface MediaHost {
  put(key: string, file: string, contentType: string): Promise<string>;
  remove(key: string): Promise<void>;
  newPrefix(): string;
}

export function r2Host(env = loadEnv()): MediaHost {
  const need = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL'];
  const missing = need.filter(k => !env[k]);
  if (missing.length) throw new Error(`media host not configured: ${missing.join(', ')} missing in .env`);
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  async function signed(method: 'PUT' | 'DELETE', key: string, body?: Buffer, contentType?: string) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = amzDate.slice(0, 8);
    const path = `/${env.R2_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const payloadHash = body ? sha256(body) : sha256('');
    const headers: Record<string, string> = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
    if (contentType) headers['content-type'] = contentType;
    const names = Object.keys(headers).sort();
    const canonical = [method, path, '', ...names.map(n => `${n}:${headers[n]}`), '', names.join(';'), payloadHash].join('\n');
    const scope = `${date}/auto/s3/aws4_request`;
    const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n');
    const kDate = hmac(`AWS4${env.R2_SECRET_ACCESS_KEY}`, date);
    const kSigning = hmac(hmac(hmac(kDate, 'auto'), 's3'), 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(toSign).digest('hex');
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`;
    const res = await fetch(`https://${host}${path}`, { method, headers, body: body ? new Uint8Array(body) : undefined });
    if (!res.ok) throw new Error(`R2 ${method} ${key}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }

  return {
    newPrefix: () => `ig/${randomBytes(12).toString('hex')}`,
    async put(key, file, contentType) {
      await signed('PUT', key, readFileSync(file), contentType);
      const url = `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
      // Meta's crawler must be able to fetch it: verify the public URL answers with the right type.
      const head = await fetch(url, { method: 'HEAD', headers: { 'user-agent': 'facebookexternalhit/1.1' } });
      if (!head.ok || !String(head.headers.get('content-type')).startsWith(contentType)) {
        throw new Error(`public URL not fetchable for Meta's crawler: ${head.status} ${head.headers.get('content-type')}`);
      }
      return url;
    },
    async remove(key) { await signed('DELETE', key); },
  };
}
