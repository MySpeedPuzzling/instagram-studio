// F4 · Reels renderer: HyperFrames (HTML + GSAP → MP4) on this Mac, one Reel at a time.
//
//   node lab/dl2/reels/render.ts                       # all Reels
//   node lab/dl2/reels/render.ts wall-reel             # only these
//   node lab/dl2/reels/render.ts wall-reel --twice     # render twice and compare hashes (determinism)
//   node lab/dl2/reels/render.ts --qa-only             # lint + QA + covers, no video
//
// Per Reel: build a self-contained HyperFrames project in var/render/reels/<post>/ → `hyperframes lint` →
// Playwright QA at sample times (repo qaInPage, Reel safe area) + lossless cover frame → `hyperframes render`
// (1 worker, software GPU, near-lossless CRF) → ffmpeg normalise to the Instagram spec (H.264 High, yuv420p,
// 30 fps, 10 Mbps VBR, closed 2 s GOP, silent AAC 48 kHz stereo, +faststart) → ffprobe spec check.
// The render + normalise is metered into content/labs/DL2/runs.jsonl; outputs land in content/labs/DL2/F4/<post>/
// and the DL2 gallery is rebuilt from content/labs/DL2/*/manifest.json.
//
// HyperFrames runs with telemetry, update checks and skill installs off, and uses Playwright's cached
// chrome-headless-shell (never its own download). Never run `hyperframes usage|publish|cloud|skills|open`.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { lintCaption } from '../../../src/captions/lint.ts';
import { boxPaths, fetchBoxes } from '../../../src/data/boxes.ts';
import { query } from '../../../src/data/db.ts';
import { metered, treeRssGb } from '../../../src/render/meter.ts';
import { qaInPage } from '../../../src/render/qa.ts';
import { ROOT, startServer } from '../../../src/render/server.ts';
import { counterReel } from './counter-reel.ts';
import { sepReel } from './sep-reel.ts';
import { BASE_ASSETS, FPS, SAFE, type Reel, type ReelContext } from './shared.ts';
import { wallReel } from './wall-reel.ts';

process.env.LAB = 'dl2';
const { readManifest } = await import('../../dl1/run.ts');
const { buildGallery } = await import('../../dl1/gallery.ts');
type ManifestSlide = import('../../dl1/run.ts').ManifestSlide;
type ManifestDirection = import('../../dl1/run.ts').ManifestDirection;

const BUILDERS: Record<string, (ctx: ReelContext) => Reel> = { 'wall-reel': wallReel, 'sep-reel': sepReel, 'counter-reel': counterReel };
const LAB_DIR = join(ROOT, 'content/labs/DL2');
const OUT_DIR = join(LAB_DIR, 'F4');
const WORK_DIR = join(ROOT, 'var/render/reels');
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

const sha256 = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');

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

function buildProject(reel: Reel): string {
  const dir = join(WORK_DIR, reel.key);
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

/** Seeks the composition's timeline in Playwright, lints the visible text at each sample time, and captures the cover. */
async function qaAndCover(reel: Reel, outBase: string) {
  const t0 = performance.now();
  const server = await startServer();
  const browser = await chromium.launch();
  const errors = new Set<string>(), warnings = new Set<string>();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, colorScheme: 'light' })).newPage();
    page.on('pageerror', e => errors.add(`page error: ${e.message}`));
    await page.goto(`${server.url}/var/render/reels/${reel.key}/index.html`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.decode().catch(() => undefined)));
    });
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
    }, [t, reel.key] as const);
    for (const t of reel.qaAt) {
      await seek(t);
      const qa = await page.evaluate(qaInPage, { safe: SAFE, minFontPx: 30, fontFamily: 'Rubik' });
      qa.errors.forEach(e => errors.add(`@${t}s ${e}`));
      qa.warnings.forEach(w => warnings.add(`@${t}s ${w}`));
    }
    await seek(reel.coverAt);
    const png = join(WORK_DIR, reel.key, 'cover.png');
    await page.screenshot({ path: png, type: 'png' });
    // Same treatment as the stills: upload JPEG (sRGB, 4:4:4) + what followers see after Instagram's re-encode.
    await sharp(png).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).withIccProfile('srgb').toFile(`${outBase}.jpg`);
    await sharp(`${outBase}.jpg`).jpeg({ quality: 94, chromaSubsampling: '4:2:0' }).toFile(`${outBase}.ig.jpg`);
  } finally {
    await browser.close();
    await server.close();
  }
  return { errors: [...errors], warnings: [...warnings], ms: Math.round(performance.now() - t0) };
}

async function hfRender(reel: Reel, dir: string, output: string, workers: number) {
  const args = ['render', dir, '--output', output, '--fps', String(FPS), '--quality', 'high', '--crf', String(CRF),
    '--workers', String(workers), '--no-browser-gpu'];
  const r = await run(HF_BIN, args, { env: HF_ENV, log: `${output}.log` });
  if (r.code !== 0 || !existsSync(output)) throw new Error(`hyperframes render failed (${r.code}), see ${rel(output)}.log`);
  // e.g. "screenshot capture · software gpu · compile 5.1s · … · capture 6.3s · encode (during capture) 6.3s · assemble 0.1s"
  const summary = r.out.split('\n').map(l => l.trim()).find(l => /capture · .*gpu/.test(l)) ?? '';
  return { ms: r.ms, peakGb: r.peakGb, summary };
}

/**
 * Instagram Reel spec: H.264 High, yuv420p, 30 fps CFR, 10 Mbps VBR target capped at 12 Mbps, closed 2 s GOP, silent AAC
 * stereo 48 kHz, faststart. One x264 thread: VBV rate control with frame threads is not repeatable (measured), and
 * the encode is only ~6 s. Flat graphics reach x264's quantiser floor well below 10 Mbps, so the real rate is lower.
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
  const v = j.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
  const a = j.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
  const bytes = Number(j.format.size), dur = Number(j.format.duration);
  const kbps = Math.round(Number(v?.bit_rate ?? 0) / 1000);
  const boxes = topBoxes(file);
  const errors: string[] = [], warnings: string[] = [];
  if (v?.codec_name !== 'h264') errors.push(`video codec ${v?.codec_name}, expected h264`);
  if (v?.pix_fmt !== 'yuv420p') errors.push(`pix_fmt ${v?.pix_fmt}, expected yuv420p`);
  if (v?.width !== 1080 || v?.height !== 1920) errors.push(`size ${v?.width}×${v?.height}, expected 1080×1920`);
  if (v?.r_frame_rate !== `${FPS}/1`) errors.push(`frame rate ${v?.r_frame_rate}, expected ${FPS}/1`);
  if (dur < 3 || dur > 15 * 60) errors.push(`duration ${dur}s outside 3 s–15 min`);
  if (Math.abs(dur - expectSeconds) > 0.1) warnings.push(`duration ${dur}s, composition is ${expectSeconds}s`);
  if (bytes > 300 * 1024 * 1024) errors.push(`file is ${bytes} bytes (> 300 MB)`);
  if (kbps > 25000) errors.push(`video bitrate ${kbps} kbps > 25 Mbps`);
  if (!a || a.codec_name !== 'aac' || a.sample_rate !== '48000') errors.push('audio track must be AAC 48 kHz');
  if (boxes.indexOf('moov') < 0 || boxes.indexOf('moov') > boxes.indexOf('mdat')) errors.push(`moov atom not before mdat (${boxes.join(',')})`);
  return { errors, warnings, bytes, kbps, duration: dur, profile: v?.profile as string, boxes };
}

async function frameHashes(file: string) {
  const r = await run('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-']);
  return r.out.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split(',').at(-1)!.trim());
}

// ------------------------------------------------------------------ main

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const twice = argv.includes('--twice');
  const qaOnly = argv.includes('--qa-only');
  const workers = Number(argv.find(a => a.startsWith('--workers='))?.split('=')[1] ?? 1);
  const keys = argv.filter(a => !a.startsWith('--'));
  for (const k of keys) if (!BUILDERS[k]) throw new Error(`unknown Reel "${k}" (have: ${Object.keys(BUILDERS).join(', ')})`);
  const selected = keys.length ? keys : Object.keys(BUILDERS);

  const dl1 = (await import('../../dl1/content.ts')).loadContent();
  const dl2 = (await import('../content.ts')).loadContent();
  // sep-reel shows its boxes at 800 px: fetch the 1200 px preset for those five (the month query caches 400 px).
  const largeBoxes = new Map<string, string>();
  if (selected.includes('sep-reel')) {
    const want = new Set(dl2.september.boxes.slice(0, 5).map(b => b.puzzleId));
    const rows = query('boxes-month-top').rows.filter(r => want.has(r.puzzle_id));
    await fetchBoxes(rows.map(r => r.image), 'puzzle_large');
    for (const r of rows) if (existsSync(boxPaths(r.image, 'puzzle_large').file)) largeBoxes.set(r.puzzle_id, boxPaths(r.image, 'puzzle_large').file);
  }
  const ctx: ReelContext = { dl1, dl2, largeBoxes };

  const manifestFile = join(OUT_DIR, 'manifest.json');
  const previous: ManifestDirection | null = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : null;
  const posts = new Map((previous?.posts ?? []).map(p => [p.key, p]));
  const determinismFile = join(OUT_DIR, 'determinism.json');
  const determinism: Record<string, unknown> = existsSync(determinismFile) ? JSON.parse(readFileSync(determinismFile, 'utf8')) : {};
  let failed = 0;

  for (const key of selected) {
    const reel = BUILDERS[key](ctx);
    const frames = Math.round(reel.duration * FPS);
    console.log(`\n${key}: ${reel.duration}s, ${frames} frames`);
    const dir = buildProject(reel);
    const outDir = join(OUT_DIR, key);
    mkdirSync(outDir, { recursive: true });
    const outBase = join(outDir, key);

    const lint = await hfLint(dir);
    const qa = await qaAndCover(reel, outBase);
    const cap = lintCaption(reel.caption, 'reel');
    const errors = [...lint.errors, ...qa.errors];
    const warnings = [...lint.warnings, ...qa.warnings, ...cap.errors.map(e => `caption: ${e}`), ...cap.warnings.map(w => `caption (warn): ${w}`)];
    console.log(`  lint + QA + cover: ${qa.ms} ms, ${errors.length} errors, ${warnings.length} warnings`);
    for (const e of errors) console.log(`  ERROR ${e}`);
    for (const w of warnings.slice(0, 8)) console.log(`  warn  ${w}`);

    let video: string | undefined;
    let renderMs = 0;
    if (!qaOnly) {
      const fields: Record<string, unknown> = {
        lab: 'DL2', run_id: `DL2-F4-${key}`, direction: 'F4', post: key, frames, fps: FPS, duration_s: reel.duration,
        engine: `hyperframes-${HF_VERSION}/chrome-headless-shell-156`, workers, browser_gpu: 'software (SwiftShader)', crf: CRF,
        qa_s: +(qa.ms / 1000).toFixed(2),
      };
      const raw = join(dir, 'raw.mp4');
      const final = `${outBase}.mp4`;
      const result = await metered(RUNS, fields, async () => {
        const r = await hfRender(reel, dir, raw, workers);
        const nMs = await normalise(raw, final, reel.duration);
        const p = await probe(final, reel.duration);
        Object.assign(fields, {
          hf_render_s: +(r.ms / 1000).toFixed(2), hf_peak_rss_gb: +r.peakGb.toFixed(2), hf_summary: r.summary,
          normalise_s: +(nMs / 1000).toFixed(2), mp4_bytes: p.bytes, video_kbps: p.kbps,
        });
        return { r, p };
      });
      renderMs = result.r.ms;
      errors.push(...result.p.errors);
      warnings.push(...result.p.warnings);
      video = rel(final);
      console.log(`  hyperframes: ${(result.r.ms / 1000).toFixed(1)} s, peak ${result.r.peakGb.toFixed(2)} GB (${result.r.summary})`);
      console.log(`  final: ${(result.p.bytes / 1e6).toFixed(1)} MB, ${result.p.kbps} kbps, ${result.p.profile}, boxes ${result.p.boxes.join('>')}`);

      if (twice) {
        // Determinism: a second, independent render of the same composition, compared byte- and frame-wise.
        const raw2 = join(dir, 'raw-2.mp4');
        const final2 = join(dir, 'final-2.mp4');
        const f2: Record<string, unknown> = { ...fields, run_id: `DL2-F4-${key}-repeat` };
        for (const k of ['hf_render_s', 'hf_peak_rss_gb', 'hf_summary', 'normalise_s', 'mp4_bytes', 'video_kbps']) delete f2[k];
        const r2 = await metered(RUNS, f2, async () => {
          const r = await hfRender(reel, dir, raw2, workers);
          const nMs = await normalise(raw2, final2, reel.duration);
          const p = await probe(final2, reel.duration);
          Object.assign(f2, { hf_render_s: +(r.ms / 1000).toFixed(2), hf_peak_rss_gb: +r.peakGb.toFixed(2), hf_summary: r.summary,
            normalise_s: +(nMs / 1000).toFixed(2), mp4_bytes: p.bytes, video_kbps: p.kbps });
          return r;
        });
        const [h1, h2] = await Promise.all([frameHashes(raw), frameHashes(raw2)]);
        const differing = h1.map((v, i) => (v === h2[i] ? -1 : i)).filter(i => i >= 0);
        determinism[key] = {
          at: new Date().toISOString(), hyperframes: HF_VERSION, workers, browser_gpu: 'software',
          raw_sha256: [sha256(raw), sha256(raw2)], raw_identical: sha256(raw) === sha256(raw2),
          frames: [h1.length, h2.length], frames_identical: differing.length === 0 && h1.length === h2.length,
          differing_frames: differing.slice(0, 50), differing_count: differing.length,
          final_sha256: [sha256(final), sha256(final2)], final_identical: sha256(final) === sha256(final2),
          render_s: [+(renderMs / 1000).toFixed(2), +(r2.ms / 1000).toFixed(2)],
        };
        writeFileSync(determinismFile, JSON.stringify(determinism, null, 1) + '\n');
        const d = determinism[key] as { raw_identical: boolean; frames_identical: boolean; final_identical: boolean; differing_count: number };
        console.log(`  determinism: raw ${d.raw_identical ? 'identical' : 'differs'}, decoded frames ${d.frames_identical ? 'identical' : `${d.differing_count} differ`}, final ${d.final_identical ? 'identical' : 'differs'}`);
      }
    } else if (existsSync(`${outBase}.mp4`)) {
      video = rel(`${outBase}.mp4`);
    }

    failed += errors.length;
    const slide: ManifestSlide = { id: 'reel', jpg: rel(`${outBase}.jpg`), preview: rel(`${outBase}.ig.jpg`), frame: 'reel', errors, warnings, ms: renderMs || qa.ms, video };
    posts.set(key, { key, label: reel.label, caption: reel.caption, slides: [slide] });
  }

  const order = Object.keys(BUILDERS);
  const entry: ManifestDirection = {
    id: 'F4', name: 'Reels',
    idea: 'Short vertical videos rendered from code with HyperFrames (HTML + GSAP → MP4): silent, every word burned in, the payoff by ~8 s and a seamless loop. Same tokens, Rubik and generated pieces as the stills.',
    renderedAt: new Date().toISOString(),
    posts: [...posts.values()].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)),
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(manifestFile, JSON.stringify(entry, null, 1) + '\n');
  buildGallery(readManifest(), 'DL2');
  console.log(`\nmanifest: ${rel(manifestFile)}\ngallery: content/labs/DL2/index.html (serve with: node tools/review.ts)`);
  if (failed) process.exitCode = 1;
}
