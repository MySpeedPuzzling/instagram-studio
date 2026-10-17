import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ROOT } from '../render/server.ts';
import type { Draft } from '../drafts/model.ts';
import { factsAge, preflight } from './publish.ts';

const dir = join(ROOT, 'content/test-preflight');

async function jpeg(name: string, w: number, h: number, format: 'jpeg' | 'png' = 'jpeg') {
  mkdirSync(dir, { recursive: true });
  const img = sharp({ create: { width: w, height: h, channels: 3, background: '#ffffff' } });
  await (format === 'jpeg' ? img.jpeg() : img.png()).toFile(join(dir, name));
  return `content/test-preflight/${name}`;
}

const DRAFT = 'test-preflight';
function writeFacts(queriedAt: string) {
  mkdirSync(join(ROOT, 'content/drafts', DRAFT), { recursive: true });
  writeFileSync(join(ROOT, 'content/drafts', DRAFT, 'facts.json'), JSON.stringify({ totals: { name: 'totals', queried_at: queriedAt, rows: [] } }));
}

const base = (slides: Draft['slides'], format: Draft['format'] = 'carousel'): Draft => ({
  id: DRAFT, status: 'approved', title: 't', format, caption_author: 'claude', created_at: '', updated_at: '', version: 1, slides,
  caption: '58 minutes is the most common finish time for a solo 500 on MySpeedPuzzling, based on every result logged up to 13 Oct 2026. What is your PB?',
});

test('valid 4:5 carousel passes, wrong shapes fail', async () => {
  writeFacts(new Date().toISOString());
  const ok = await jpeg('ok.jpg', 1440, 1800);
  assert.deepEqual(await preflight(base([{ file: ok, alt: 'a' }, { file: ok, alt: 'b' }])), []);

  const tall = await jpeg('tall.jpg', 1440, 1920); // 3:4 is rejected by the API
  const png = await jpeg('p.png', 1080, 1350, 'png');
  const issues = (await preflight(base([{ file: tall, alt: '' }, { file: png, alt: 'x' }]))).map(i => i.problem).join('\n');
  assert.match(issues, /aspect 0\.750/);
  assert.match(issues, /must be JPEG/);
  assert.match(issues, /alt text missing/);
  rmSync(dir, { recursive: true, force: true });
});

test('data older than 24 h blocks publishing', () => {
  writeFacts(new Date(Date.now() - 30 * 3_600_000).toISOString());
  const age = factsAge(DRAFT);
  assert.equal(age.ok, false);
  assert.match(age.problem!, /30 h old/);
  writeFacts(new Date(Date.now() - 2 * 3_600_000).toISOString());
  assert.equal(factsAge(DRAFT).ok, true);
  rmSync(join(ROOT, 'content/drafts', DRAFT), { recursive: true, force: true });
});
