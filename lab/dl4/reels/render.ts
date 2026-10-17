// DL4 · Reels renderer: the house-style Reels (lab/dl4/reels/*.ts) per house variant, with HyperFrames (HTML + GSAP →
// MP4) on this Mac, one Reel at a time, 1 worker.
//
//   node lab/dl4/reels/render.ts                                  # every Reel in H1, H2, H3
//   node lab/dl4/reels/render.ts reel-xp --variants H2            # only these
//   node lab/dl4/reels/render.ts --qa-only                        # lint + QA + covers + post.json, no video
//   node lab/dl4/reels/render.ts reel-sep --qa-only --snap=/tmp/x  # also save a JPEG of every QA sample time
//
// Per (variant, Reel): build a self-contained HyperFrames project in var/render/reels-dl4/<H#>/<reel>/ →
// `hyperframes lint` → Playwright QA at sample times (repo qaInPage, Reel safe area) + lossless cover frame →
// `hyperframes render` (1 worker, software GPU, near-lossless CRF) → ffmpeg normalise to the Instagram spec
// (H.264 High, yuv420p, 30 fps, 10 Mbps VBR, closed 2 s GOP, silent AAC 48 kHz stereo, +faststart) → ffprobe check.
// Render + normalise are metered into content/labs/DL4/runs.jsonl; outputs land in content/labs/DL4/<H#>/<reel>/
// with a post.json (same shape as lab/dl4/run.ts); rebuild the gallery afterwards with `node lab/dl4/run.ts --gallery`.
//
// HyperFrames runs with telemetry, update checks and skill installs off and uses Playwright's cached
// chrome-headless-shell (never its own download). Never run `hyperframes usage|publish|cloud|skills|open`.
import { spawn } from 'node:child_process';
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { lintCaption } from '../../../src/captions/lint.ts';
import { boxPaths, fetchBoxes } from '../../../src/data/boxes.ts';
import { query } from '../../../src/data/db.ts';
import { activateVariant, VARIANTS, type Variant } from '../../../src/design/house.ts';
import { metered, treeRssGb } from '../../../src/render/meter.ts';
import { qaInPage } from '../../../src/render/qa.ts';
import { ROOT, startServer } from '../../../src/render/server.ts';
import type { ManifestSlide } from '../../dl1/run.ts';
import type { PostRecord } from '../run.ts';
import { counterReel } from './counter.ts';
import { sepReel } from './sep.ts';
import { BASE_ASSETS, FPS, SAFE, type Reel, type ReelContext } from './shared.ts';
import { wallReel } from './wall.ts';
import { xpReel } from './xp.ts';

const BUILDERS: Record<string, (ctx: ReelContext) => Reel> = { 'reel-wall': wallReel, 'reel-sep': sepReel, 'reel-counter': counterReel, 'reel-xp': xpReel };
const LAB_DIR = join(ROOT, 'content/labs/DL4');
const WORK_DIR = join(ROOT, 'var/render/reels-dl4');
const RUNS = join(LAB_DIR, 'runs.jsonl');
const HF_BIN = join(ROOT, 'node_modules/.bin/hyperframes');
const HF_VERSION: string = JSON.parse(readFileSync(join(ROOT, 'node_modules/hyperframes/package.json'), 'utf8')).version;
const CRF = 8;              // near-lossless intermediate; the Instagram encode happens in normalise()
const VIDEO_BITRATE = '10M';
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

/** Playwright's cached chrome-headless-shell (same Chromium build the stills use). HyperFrames must never download one. */
function headlessShell(): string {
  const full = chromium.executablePath();
  const m = full.match(/^(.*)\/chromium-(\d+)\//);
  const arch = process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  const shell = m ? `${m[1]}/chromium_headless_shell-${m[2]}/chrome-headless-shell-${arch}/chrome-headless-shell` : '';
  if (!shell || !existsSync(shell)) throw new Error(`Playwright chrome-headless-shell not found (${shell || full}); refusing to let HyperFrames download a browser`);
  return shell;
}

const HF_ENV = {
  ...process.env,
  HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_NO_UPDATE_CHECK: '1', HYPERFRAMES_SKIP_SKILLS: '1',
  HYPERFRAMES_BROWSER_PATH: headlessShell(),
};

/** Runs a command without blocking the event loop (so metered() keeps sampling); samples the child's tree RSS. */
function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv; log?: string } = {}) {
  return new Promise<{ code: number; out: string; ms: number; peakGb: number }>((resolve, reject) => {
    const t0 = performance.now();
    const child = spawn(cmd, args, { cwd: opts.cwd ?? ROOT, env: opts.env ?? process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let peakGb = 0;
    const timer = setInterval(() => { if (child.pid) peakGb = Math.max(peakGb, treeRssGb(child.pid)); }, 500);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('error', e => { clearInterval(timer); reject(e); });
    child.on('close', code => {
      clearInterval(timer);
      if (opts.log) writeFileSync(opts.log, out);
      resolve({ code: code ?? 1, out, ms: Math.round(performance.now() - t0), peakGb });
    });
  });
}

/** Top-level MP4 boxes in file order (to prove moov precedes mdat, i.e. faststart). */
function topBoxes(file: string): string[] {
  const fd = openSync(file, 'r');
  const size = statSync(file).size;
  const head = Buffer.alloc(16);
  const out: string[] = [];
  try {
    for (let pos = 0; pos + 8 <= size && out.length < 64;) {
      readSync(fd, head, 0, 16, pos);
      let len = head.readUInt32BE(0);
      const type = head.toString('latin1', 4, 8);
      if (len === 1) len = Number(head.readBigUInt64BE(8));
      else if (len === 0) len = size - pos;
      out.push(type);
      if (len < 8) break;
      pos += len;
    }
  } finally {
    closeSync(fd);
  }
  return out;
}

// ------------------------------------------------------------------ steps

function buildProject(v: Variant, reel: Reel): string {
  const dir = join(WORK_DIR, v.id, reel.key);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'assets'), { recursive: true });
  writeFileSync(join(dir, 'index.html'), reel.html);
  for (const [to, from] of Object.entries({ ...BASE_ASSETS, ...reel.assets })) {
    mkdirSync(dirname(join(dir, to)), { recursive: true });
    copyFileSync(from, join(dir, to));
  }
  return dir;
}

async function hfLint(dir: string) {
  const r = await run(HF_BIN, ['lint', dir, '--json'], { env: HF_ENV });
  const errors: string[] = [], warnings: string[] = [];
  try {
    const j = JSON.parse(r.out.slice(r.out.indexOf('{')));
    for (const f of j.findings ?? []) (f.severity === 'error' ? errors : warnings).push(`hf-lint ${f.code}: ${f.message}`);
  } catch {
    if (r.code) errors.push(`hf-lint failed: ${r.out.trim().slice(0, 300)}`);
  }
  return { errors, warnings };
}

type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type Server = Awaited<ReturnType<typeof startServer>>;

/** Seeks the composition's timeline in Playwright, lints the visible text at each sample time, and captures the cover. */
async function qaAndCover(env: { browser: Browser; server: Server }, v: Variant, reel: Reel, outBase: string, snapDir?: string) {
  const t0 = performance.now();
  const errors = new Set<string>(), warnings = new Set<string>();
  const ctx = await env.browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, colorScheme: 'light' });
  try {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.add(`page error: ${e.message}`));
    await page.goto(`${env.server.url}/var/render/reels-dl4/${v.id}/${reel.key}/index.html`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.decode().catch(() => undefined)));
    });
    const id = `${reel.key}-${v.id.toLowerCase()}`;
    const seek = (t: number) => page.evaluate(([t, id]) => {
      const tl = (window as unknown as { __timelines: Record<string, { pause(): void; totalTime(t: number, s: boolean): void }> }).__timelines[id];
      tl.pause();
      tl.totalTime(t, false);
      // qaInPage skips text whose own opacity is 0; also skip text inside hidden ancestors.
      for (const el of document.querySelectorAll('[data-qa-tmp]')) { el.removeAttribute('data-qa-ignore'); el.removeAttribute('data-qa-tmp'); }
      for (const el of document.querySelectorAll('#root *')) {
        const cs = getComputedStyle(el);
        if ((Number(cs.opacity) === 0 || cs.visibility === 'hidden') && !el.hasAttribute('data-qa-ignore')) el.setAttribute('data-qa-ignore', ''), el.setAttribute('data-qa-tmp', '');
      }
    }, [t, id] as const);
    for (const t of reel.qaAt) {
      await seek(t);
      const qa = await page.evaluate(qaInPage, { safe: SAFE, minFontPx: 30, fontFamily: 'Rubik' });
      qa.errors.forEach(e => errors.add(`@${t}s ${e}`));
      qa.warnings.forEach(w => warnings.add(`@${t}s ${w}`));
      if (snapDir) {
        mkdirSync(snapDir, { recursive: true });
        await page.screenshot({ path: join(snapDir, `${v.id}-${reel.key}-${t.toFixed(2)}s.jpg`), type: 'jpeg', quality: 80 });
      }
    }
    await seek(reel.coverAt);
    const png = join(WORK_DIR, v.id, reel.key, 'cover.png');
    await page.screenshot({ path: png, type: 'png' });
    // Same treatment as the stills: upload JPEG (sRGB, 4:4:4) + what followers see after Instagram's re-encode.
    await sharp(png).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).withIccProfile('srgb').toFile(`${outBase}.jpg`);
    await sharp(`${outBase}.jpg`).jpeg({ quality: 94, chromaSubsampling: '4:2:0' }).toFile(`${outBase}.ig.jpg`);
  } finally {
    await ctx.close();
  }
  return { errors: [...errors], warnings: [...warnings], ms: Math.round(performance.now() - t0) };
}

async function hfRender(dir: string, output: string, workers: number) {
  const args = ['render', dir, '--output', output, '--fps', String(FPS), '--quality', 'high', '--crf', String(CRF),
    '--workers', String(workers), '--no-browser-gpu'];
  const r = await run(HF_BIN, args, { env: HF_ENV, log: `${output}.log` });
  if (r.code !== 0 || !existsSync(output)) throw new Error(`hyperframes render failed (${r.code}), see ${rel(output)}.log`);
  const summary = r.out.split('\n').map(l => l.trim()).find(l => /capture · .*gpu/.test(l)) ?? '';
  return { ms: r.ms, peakGb: r.peakGb, summary };
}

/**
 * Instagram Reel spec: H.264 High, yuv420p, 30 fps CFR, 10 Mbps VBR target capped at 12 Mbps, closed 2 s GOP, silent AAC
 * stereo 48 kHz, faststart. One x264 thread keeps the upload byte-reproducible (VBV with frame threads is not; see DL2).
 */
async function normalise(raw: string, out: string, duration: number) {
  const args = ['-v', 'error', '-y', '-i', raw, '-f', 'lavfi', '-t', String(duration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-threads', '1', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-b:v', VIDEO_BITRATE, '-maxrate', '12M', '-bufsize', '24M',
    '-g', String(FPS * 2), '-keyint_min', String(FPS * 2), '-sc_threshold', '0', '-flags', '+cgop',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
    '-t', String(duration), '-map_metadata', '-1', '-movflags', '+faststart', out];
  const r = await run('ffmpeg', args);
  if (r.code !== 0) throw new Error(`ffmpeg normalise failed: ${r.out.slice(0, 500)}`);
  return r.ms;
}

/** ffprobe lint against the API video spec. */
async function probe(file: string, expectSeconds: number) {
  const r = await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  const j = JSON.parse(r.out);
  const vs = j.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
  const a = j.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
  const bytes = Number(j.format.size), dur = Number(j.format.duration);
  const kbps = Math.round(Number(vs?.bit_rate ?? 0) / 1000);
  const boxes = topBoxes(file);
  const errors: string[] = [], warnings: string[] = [];
  if (vs?.codec_name !== 'h264') errors.push(`video codec ${vs?.codec_name}, expected h264`);
  if (vs?.profile !== 'High') errors.push(`H.264 profile ${vs?.profile}, expected High`);
  if (vs?.pix_fmt !== 'yuv420p') errors.push(`pix_fmt ${vs?.pix_fmt}, expected yuv420p`);
  if (vs?.width !== 1080 || vs?.height !== 1920) errors.push(`size ${vs?.width}×${vs?.height}, expected 1080×1920`);
  if (vs?.r_frame_rate !== `${FPS}/1`) errors.push(`frame rate ${vs?.r_frame_rate}, expected ${FPS}/1`);
  if (dur < 3 || dur > 15 * 60) errors.push(`duration ${dur}s outside 3 s–15 min`);
  if (Math.abs(dur - expectSeconds) > 0.1) warnings.push(`duration ${dur}s, composition is ${expectSeconds}s`);
  if (bytes > 300 * 1024 * 1024) errors.push(`file is ${bytes} bytes (> 300 MB)`);
  if (kbps > 25000) errors.push(`video bitrate ${kbps} kbps > 25 Mbps`);
  if (!a || a.codec_name !== 'aac' || a.sample_rate !== '48000') errors.push('audio track must be AAC 48 kHz');
  if (boxes.indexOf('moov') < 0 || boxes.indexOf('moov') > boxes.indexOf('mdat')) errors.push(`moov atom not before mdat (${boxes.join(',')})`);
  return { errors, warnings, bytes, kbps, duration: dur, profile: vs?.profile as string, boxes };
}

/** sep shows its boxes at 800 px: fetch the 1200 px preset for the top five (the month query caches 400 px). */
async function largeBoxesFor(c: ReelContext['c']): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const want = new Set(c.dl2.september.boxes.slice(0, 5).map(b => b.puzzleId));
  const rows = query('boxes-month-top').rows.filter(r => want.has(r.puzzle_id));
  await fetchBoxes(rows.map(r => r.image), 'puzzle_large');
  for (const r of rows) if (existsSync(boxPaths(r.image, 'puzzle_large').file)) out.set(r.puzzle_id, boxPaths(r.image, 'puzzle_large').file);
  return out;
}

// ------------------------------------------------------------------ main

if (import.meta.main) {
  const { values: o, positionals } = parseArgs({ allowPositionals: true, options: {
    variants: { type: 'string' }, 'qa-only': { type: 'boolean' }, workers: { type: 'string' }, snap: { type: 'string' },
  } });
  const workers = Number(o.workers ?? 1);
  for (const k of positionals) if (!BUILDERS[k]) throw new Error(`unknown Reel "${k}" (have: ${Object.keys(BUILDERS).join(', ')})`);
  const selected = positionals.length ? positionals : Object.keys(BUILDERS);
  const variants: Variant[] = (o.variants?.split(',').map(s => s.trim().toUpperCase()) ?? Object.keys(VARIANTS)).map(id => VARIANTS[id as Variant['id']]).filter(Boolean);

  const c = (await import('../content.ts')).loadContent();
  const largeBoxes = selected.includes('reel-sep') ? await largeBoxesFor(c) : new Map<string, string>();
  const server = await startServer();
  const browser = await chromium.launch();
  let failed = 0;
  const summary: string[] = [];

  try {
    for (const v of variants) for (const key of selected) {
      activateVariant(v); // the variant's token overrides and seam apply while the Reel is built
      const reel = BUILDERS[key]({ c, v, largeBoxes });
      const frames = Math.round(reel.duration * FPS);
      console.log(`\n${v.id} ${key}: ${reel.duration}s, ${frames} frames`);
      const dir = buildProject(v, reel);
      const outDir = join(LAB_DIR, v.id, key);
      mkdirSync(outDir, { recursive: true });
      const outBase = join(outDir, key);

      const lint = await hfLint(dir);
      const qa = await qaAndCover({ browser, server }, v, reel, outBase, o.snap);
      const cap = lintCaption(reel.caption, 'reel');
      const errors = [...lint.errors, ...qa.errors];
      const warnings = [...lint.warnings, ...qa.warnings, ...cap.errors.map(e => `caption: ${e}`), ...cap.warnings.map(w => `caption (warn): ${w}`)];
      console.log(`  lint + QA + cover: ${qa.ms} ms, ${errors.length} errors, ${warnings.length} warnings`);
      for (const e of errors) console.log(`  ERROR ${e}`);
      for (const w of warnings.slice(0, 8)) console.log(`  warn  ${w}`);

      let video: string | undefined;
      let renderMs = 0;
      if (!o['qa-only'] && errors.length) {
        console.log('  skipping the video: fix the QA errors first');
      } else if (!o['qa-only']) {
        const fields: Record<string, unknown> = {
          lab: 'DL4', run_id: `DL4-${v.id}-${key}`, direction: v.id, family: 'reels', post: key, frames, fps: FPS, duration_s: reel.duration,
          engine: `hyperframes-${HF_VERSION}/chrome-headless-shell-156`, workers, browser_gpu: 'software (SwiftShader)', crf: CRF,
          qa_s: +(qa.ms / 1000).toFixed(2),
        };
        const raw = join(dir, 'raw.mp4');
        const final = `${outBase}.mp4`;
        const result = await metered(RUNS, fields, async () => {
          const r = await hfRender(dir, raw, workers);
          const nMs = await normalise(raw, final, reel.duration);
          const p = await probe(final, reel.duration);
          Object.assign(fields, {
            hf_render_s: +(r.ms / 1000).toFixed(2), hf_peak_rss_gb: +r.peakGb.toFixed(2), hf_summary: r.summary,
            normalise_s: +(nMs / 1000).toFixed(2), mp4_bytes: p.bytes, video_kbps: p.kbps, spec_errors: p.errors.length,
          });
          return { r, nMs, p };
        });
        rmSync(raw, { force: true });
        renderMs = result.r.ms;
        errors.push(...result.p.errors);
        warnings.push(...result.p.warnings);
        video = rel(final);
        console.log(`  hyperframes: ${(result.r.ms / 1000).toFixed(1)} s, peak ${result.r.peakGb.toFixed(2)} GB (${result.r.summary})`);
        console.log(`  final: ${(result.p.bytes / 1e6).toFixed(1)} MB, ${result.p.kbps} kbps, ${result.p.profile}, ${result.p.duration} s, boxes ${result.p.boxes.join('>')}, spec ${result.p.errors.length ? result.p.errors.join('; ') : 'ok'}`);
        summary.push(`${v.id} ${key}: ${reel.duration}s render ${(result.r.ms / 1000).toFixed(1)} s, HF peak ${result.r.peakGb.toFixed(2)} GB, normalise ${(result.nMs / 1000).toFixed(1)} s, ${(result.p.bytes / 1e6).toFixed(1)} MB, ${result.p.kbps} kbps, spec ${result.p.errors.length ? 'FAIL' : 'ok'}`);
      } else if (existsSync(`${outBase}.mp4`)) {
        video = rel(`${outBase}.mp4`);
      }

      failed += errors.length;
      const slide: ManifestSlide = { id: key, jpg: rel(`${outBase}.jpg`), preview: rel(`${outBase}.ig.jpg`), frame: 'reel', errors, warnings, ms: renderMs || qa.ms, video };
      const rec: PostRecord = { key, label: reel.label, caption: reel.caption, family: 'reels', renderedAt: new Date().toISOString(), slides: [slide] };
      writeFileSync(join(outDir, 'post.json'), JSON.stringify(rec, null, 1) + '\n');
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (summary.length) console.log('\n' + summary.join('\n'));
  console.log('\npost.json files written; rebuild the gallery with: node lab/dl4/run.ts --gallery');
  if (failed) process.exitCode = 1;
}
