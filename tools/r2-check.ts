// End-to-end check of the media host: upload a test JPEG, fetch it as Meta's crawler, delete it, confirm it's gone.
//   node tools/r2-check.ts
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { r2Host } from '../src/publish/r2.ts';
import { ROOT } from '../src/render/server.ts';

const dir = join(ROOT, 'content/tmp');
mkdirSync(dir, { recursive: true });
const file = join(dir, 'r2-check.jpg');
await sharp({ create: { width: 1080, height: 1350, channels: 3, background: '#ec726f' } }).jpeg({ quality: 90 }).toFile(file);

const host = r2Host();
const key = `${host.newPrefix()}/check.jpg`;
const t0 = performance.now();
const url = await host.put(key, file, 'image/jpeg'); // put() already verifies the crawler can fetch it
console.log(`uploaded and fetchable as facebookexternalhit in ${Math.round(performance.now() - t0)} ms`);
const get = await fetch(url, { headers: { 'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' } });
console.log(`GET ${get.status} ${get.headers.get('content-type')} ${(await get.arrayBuffer()).byteLength} bytes, cf-cache: ${get.headers.get('cf-cache-status') ?? '-'}`);
await host.remove(key);
const after = await fetch(url, { method: 'HEAD', headers: { 'cache-control': 'no-cache' } });
console.log(`after delete: ${after.status}${after.status === 200 ? ' (served from edge cache; origin object is gone)' : ''}`);
