// LM1 · logo motion renderer: the intro/outro variants (lab/logo/clips.ts) with HyperFrames (HTML + GSAP → MP4) on
// this Mac, one clip at a time, 1 worker. Adapted from lab/dl4/reels/render.ts (same safety rules: telemetry, update
// checks and skill installs off, Playwright's cached chrome-headless-shell, never `hyperframes
// usage|publish|cloud|skills|open`).
//
//   node lab/logo/render.ts                          # every clip
//   node lab/logo/render.ts intro-tick outro-lap     # only these
//   node lab/logo/render.ts --qa-only                # lint + QA + settled check + cover/final PNG, no video
//   node lab/logo/render.ts intro-snap --qa-only --snap=/tmp/f   # also save a JPEG at every QA sample time
//   node lab/logo/render.ts --gallery                # rebuild the manifests + gallery only
//   node lab/logo/render.ts --chain "rain start hold:0.5 breakup" [--key=…] [--ground=…] [--reveal=…] [--place=mast] [--qa-only]
//
// Per clip: build the project in var/render/logo-lm1/<key>/ → `hyperframes lint` → Playwright QA (repo qaInPage, Reel
// safe area) at the clip's sample times → settled check: the last frame must equal, pixel for pixel, the same page
// without its timeline (the default DOM is the settled logo, see shared.ts) → cover JPEG + final-frame PNG →
// `hyperframes render` → ffmpeg normalise (H.264 High, yuv420p, 30 fps, 10 Mbps VBR, closed 2 s GOP, silent AAC
// 48 kHz, faststart) → ffprobe check. Render + normalise are metered into content/labs/LM1/runs.jsonl. Outputs:
// content/labs/LM1/<L#>/<key>/ (<key>.mp4, <key>.jpg cover, <key>.ig.jpg, <key>-final.png, post.json), then the
// per-direction manifests and the gallery (content/labs/LM1/index.html).
import { spawn } from 'node:child_process';
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { metered, treeRssGb } from '../../src/render/meter.ts';
import { qaInPage } from '../../src/render/qa.ts';
import { ROOT, startServer } from '../../src/render/server.ts';
import { buildGallery } from '../dl1/gallery.ts';
import type { Manifest, ManifestDirection, ManifestSlide } from '../dl1/run.ts';
import { chain, plan } from './chain.ts';
import { allClips } from './clips.ts';
import type { GroundKey } from '../../src/design/house.ts';
import { diffRgba } from './rig-check.ts';
import { ASSETS, FPS, SAFE, type Clip } from './shared.ts';

const LAB_ID = 'LM1';
const LAB_DIR = join(ROOT, 'content/labs', LAB_ID);
const WORK_DIR = join(ROOT, 'var/render/logo-lm1');
const REF_DIR = join(ROOT, 'var/render/logo-lm1-ref');
const RUNS = join(LAB_DIR, 'runs.jsonl');
const HF_BIN = join(ROOT, 'node_modules/.bin/hyperframes');
const HF_VERSION: string = JSON.parse(readFileSync(join(ROOT, 'node_modules/hyperframes/package.json'), 'utf8')).version;
const CRF = 8;
const VIDEO_BITRATE = '10M';
const rel = (p: string) => '/' + p.slice(ROOT.length + 1);

export const DIRECTIONS: Record<Clip['dir'], { name: string; idea: string }> = {
  L1: { name: 'Intros on navy', idea: 'Five logo intros (2.0–2.4 s) that end on the settled, outlined logo in the middle of a 9:16 frame, for the start of a Reel. Rate the idea and the motion; the logo itself is the real mark, rigged.' },
  L2: { name: 'Outros on navy', idea: 'Three sign-offs (2.0–2.2 s) for the end of a Reel: the outlined logo with myspeedpuzzling.com and @myspeedpuzzling in the house type (bold Rubik).' },
  L4: { name: 'Modules and chains', idea: 'Round 2 is a kit: modules that all meet on one hand-off frame (the settled logo, centred, on navy), so any intro, any content and any outro cut together. Here: the idle / loading loop for the app (seamless) and example chains built from the modules (lab/logo/chain.ts).' },
  L3: { name: 'App splash cuts', idea: 'The two most promising intros on coral and on the white-with-depth ground, as a phone app splash screen. Each has its clip and the final frame (the still the app would hold). For the app the chosen one would be rebuilt in Rive or Lottie.' },
};

/** Playwright's cached chrome-headless-shell. HyperFrames must never download one. */
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

function writeProject(dir: string, html: string, extra: Record<string, string> = {}) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'assets'), { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  for (const [to, from] of Object.entries({ ...ASSETS, ...extra })) {
    mkdirSync(dirname(join(dir, to)), { recursive: true });
    copyFileSync(from, join(dir, to));
  }
}

/** The project, plus the same page without its timeline (the settled reference) outside the HyperFrames project. */
function buildProject(c: Clip): string {
  const dir = join(WORK_DIR, c.key);
  writeProject(dir, c.html, c.assets);
  const ref = c.html.replace(/<script>\s*const DATA[\s\S]*?<\/script>/, '<script>window.__timelines = {};</script>');
  if (ref === c.html) throw new Error(`${c.key}: could not strip the timeline for the settled reference`);
  writeProject(join(REF_DIR, c.key), ref, c.assets);
  if (c.handoffRef) writeProject(join(REF_DIR, `${c.key}-handoff`), c.handoffRef);
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

/** QA at the sample times, the settled check, the cover JPEG and the final-frame PNG. */
async function qaAndStills(env: { browser: Browser; server: Server }, c: Clip, outBase: string, snapDir?: string) {
  const t0 = performance.now();
  const errors = new Set<string>(), warnings = new Set<string>();
  const ctx = await env.browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, colorScheme: 'light' });
  const lastT = +(c.duration - 1 / FPS).toFixed(4);
  let settled = { differing: -1, maxDelta: -1 };
  const handoff: Array<{ at: number; differing: number }> = [];
  const loops: Array<{ at: [number, number]; differing: number; wrapStep: number; firstStep: number }> = [];
  try {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.add(`page error: ${e.message}`));
    const load = async (url: string) => {
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(i => i.decode().catch(() => undefined)));
      });
    };
    await load(`${env.server.url}/var/render/logo-lm1/${c.key}/index.html`);
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
    }, [t, c.key] as const);
    for (const t of [...c.qaAt].sort((a, b) => a - b)) {
      await seek(t);
      const qa = await page.evaluate(qaInPage, { safe: SAFE, minFontPx: 30, fontFamily: 'Rubik' });
      qa.errors.forEach(e => errors.add(`@${t}s ${e}`));
      qa.warnings.forEach(w => warnings.add(`@${t}s ${w}`));
      if (snapDir) {
        mkdirSync(snapDir, { recursive: true });
        await page.screenshot({ path: join(snapDir, `${c.key}-${t.toFixed(2)}s.jpg`), type: 'jpeg', quality: 85 });
      }
    }
    const raw = async (b: Buffer) => (await sharp(b).ensureAlpha().raw().toBuffer());
    // Seamless loops: the frame at a loop's end must equal the frame at its start, pixel for pixel.
    for (const [a, z] of c.loops ?? []) {
      await seek(a); const fa = await raw(await page.screenshot({ type: 'png' }));
      await seek(z); const fz = await raw(await page.screenshot({ type: 'png' }));
      await seek(+(z - 1 / FPS).toFixed(4)); const fl = await raw(await page.screenshot({ type: 'png' }));
      await seek(+(a + 1 / FPS).toFixed(4)); const f1 = await raw(await page.screenshot({ type: 'png' }));
      const d = diffRgba(fa, fz), step = diffRgba(fl, fa), inner = diffRgba(fa, f1);
      loops.push({ at: [a, z], differing: d.differing, wrapStep: step.differing, firstStep: inner.differing });
      if (d.differing) errors.add(`loop ${a}–${z}s: the end frame differs from the start frame on ${d.differing} px (max Δ ${d.maxDelta})`);
    }
    // Hand-off frames: every module boundary at the hand-off state must equal the hand-off frame rendered alone.
    const handoffShots: Array<[number, Buffer]> = [];
    for (const t of c.handoffAt ?? []) { await seek(t); handoffShots.push([t, await raw(await page.screenshot({ type: 'png' }))]); }
    // Seek backwards too (HyperFrames may capture frames out of order): the last frame must not depend on the path.
    // A clip that ends on a loop shows its loop's end (= start) frame as the settled frame, one frame after the last.
    const loopEnd = (c.loops ?? []).some(([, z]) => Math.abs(z - c.duration) < 1e-6);
    await seek(0);
    await seek(loopEnd ? c.duration : lastT);
    const last = await page.screenshot({ type: 'png' });
    await load(`${env.server.url}/var/render/logo-lm1-ref/${c.key}/index.html`);
    const ref = await page.screenshot({ type: 'png' });
    settled = diffRgba(await raw(last), await raw(ref));
    if (handoffShots.length) {
      await load(`${env.server.url}/var/render/logo-lm1-ref/${c.key}-handoff/index.html`);
      const hand = await raw(await page.screenshot({ type: 'png' }));
      for (const [t, shot] of handoffShots) {
        const d = diffRgba(shot, hand);
        handoff.push({ at: t, differing: d.differing });
        if (d.differing) errors.add(`hand-off @${t}s: differs from the hand-off frame on ${d.differing} px (max Δ ${d.maxDelta})`);
      }
    }
    if (settled.differing) errors.add(`settled check: the last frame differs from the settled logo on ${settled.differing} px (max Δ ${settled.maxDelta})`);
    writeFileSync(`${outBase}-final.png`, last);
    await sharp(last).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).withIccProfile('srgb').toFile(`${outBase}.jpg`);
    await sharp(`${outBase}.jpg`).jpeg({ quality: 94, chromaSubsampling: '4:2:0' }).toFile(`${outBase}.ig.jpg`);
  } finally {
    await ctx.close();
  }
  return { errors: [...errors], warnings: [...warnings], ms: Math.round(performance.now() - t0), settled, handoff, loops };
}

async function hfRender(dir: string, output: string, workers: number) {
  const args = ['render', dir, '--output', output, '--fps', String(FPS), '--quality', 'high', '--crf', String(CRF),
    '--workers', String(workers), '--no-browser-gpu'];
  const r = await run(HF_BIN, args, { env: HF_ENV, log: `${output}.log` });
  if (r.code !== 0 || !existsSync(output)) throw new Error(`hyperframes render failed (${r.code}), see ${rel(output)}.log`);
  const summary = r.out.split('\n').map(l => l.trim()).find(l => /capture · .*gpu/.test(l)) ?? '';
  return { ms: r.ms, peakGb: r.peakGb, summary };
}

/** Instagram Reel encode (as DL4): H.264 High, yuv420p, 30 fps CFR, 10 Mbps VBR, closed 2 s GOP, silent AAC, faststart. */
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

/**
 * ffprobe lint against the API video spec. A sting is shorter than Instagram's 3 s minimum for a standalone Reel:
 * it is joined to a Reel's start or end, so that is a warning here, not an error.
 */
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
  if (Number(vs?.nb_frames) !== Math.round(expectSeconds * FPS)) errors.push(`${vs?.nb_frames} frames, expected ${Math.round(expectSeconds * FPS)}`);
  if (Math.abs(dur - expectSeconds) > 0.1) errors.push(`duration ${dur}s, composition is ${expectSeconds}s`);
  if (dur < 3) warnings.push(`sting ${dur}s: shorter than the 3 s minimum of a standalone Reel (it is joined to a Reel)`);
  if (bytes > 300 * 1024 * 1024) errors.push(`file is ${bytes} bytes (> 300 MB)`);
  if (kbps > 25000) errors.push(`video bitrate ${kbps} kbps > 25 Mbps`);
  if (!a || a.codec_name !== 'aac' || a.sample_rate !== '48000') errors.push('audio track must be AAC 48 kHz');
  if (boxes.indexOf('moov') < 0 || boxes.indexOf('moov') > boxes.indexOf('mdat')) errors.push(`moov atom not before mdat (${boxes.join(',')})`);
  return { errors, warnings, bytes, kbps, duration: dur, frames: Number(vs?.nb_frames), profile: vs?.profile as string, boxes };
}

// ------------------------------------------------------------------ manifests + gallery

interface PostRecord { key: string; label: string; caption: string; family: string; renderedAt: string; dir: Clip['dir']; duration: number; settleAt: number; slides: ManifestSlide[]; chain?: string[]; handoff?: unknown; loops?: unknown }

/** Assembles content/labs/LM1/<L#>/manifest.json from the clips' post.json files (clip order of clips.ts). */
export function writeManifests(): Manifest {
  const order = allClips().map(c => c.key);
  const out: Manifest = {};
  for (const id of Object.keys(DIRECTIONS) as Clip['dir'][]) {
    const dir = join(LAB_DIR, id);
    if (!existsSync(dir)) continue;
    const posts = readdirSync(dir).filter(k => existsSync(join(dir, k, 'post.json')))
      .map(k => JSON.parse(readFileSync(join(dir, k, 'post.json'), 'utf8')) as PostRecord)
      .sort((a, b) => (order.indexOf(a.key) + 1 || 1e9) - (order.indexOf(b.key) + 1 || 1e9) || a.key.localeCompare(b.key));
    if (!posts.length) continue;
    const entry: ManifestDirection = {
      id, ...DIRECTIONS[id], renderedAt: posts.map(p => p.renderedAt).sort().at(-1)!,
      posts: posts.map(p => ({ key: p.key, label: p.label, caption: p.caption, slides: p.slides })),
    };
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify(entry, null, 1) + '\n');
    out[id] = entry;
  }
  return out;
}

/** The readManifest() equivalent for LM1 (lab/dl1/run.ts reads by LAB env). */
export function readManifest(): Manifest {
  const out: Manifest = {};
  if (!existsSync(LAB_DIR)) return out;
  for (const id of readdirSync(LAB_DIR)) {
    const f = join(LAB_DIR, id, 'manifest.json');
    if (/^[A-Z]\d+$/.test(id) && existsSync(f)) out[id] = JSON.parse(readFileSync(f, 'utf8'));
  }
  return out;
}

// ------------------------------------------------------------------ main

/** Renders clips one at a time (lint, QA, checks, stills, then video unless qaOnly), writes post.json, rebuilds the gallery. */
export async function renderClips(selected: Clip[], o: { qaOnly?: boolean; snap?: string; workers?: number } = {}) {
  const workers = o.workers ?? 1;
  let failed = 0;
  const summary: string[] = [];
  if (selected.length) {
    const server = await startServer();
    const browser = await chromium.launch();
    try {
      for (const c of selected) {
        const frames = Math.round(c.duration * FPS);
        console.log(`\n${c.dir} ${c.key}: ${c.duration}s, ${frames} frames, settles at ${c.settleAt}s`);
        const dir = buildProject(c);
        const outDir = join(LAB_DIR, c.dir, c.key);
        mkdirSync(outDir, { recursive: true });
        const outBase = join(outDir, c.key);

        const lint = await hfLint(dir);
        const qa = await qaAndStills({ browser, server }, c, outBase, o.snap);
        const errors = [...lint.errors, ...qa.errors];
        const warnings = [...lint.warnings, ...qa.warnings];
        console.log(`  lint + QA + settled check + stills: ${qa.ms} ms, ${errors.length} errors, ${warnings.length} warnings; settled diff ${qa.settled.differing} px`);
        if (qa.handoff.length) console.log(`  hand-off frames: ${qa.handoff.map(h => `@${h.at}s ${h.differing} px`).join(', ')}`);
        for (const l of qa.loops) console.log(`  loop ${l.at[0]}–${l.at[1]}s: end vs start ${l.differing} px; wrap step (last → first) ${l.wrapStep} px vs first step ${l.firstStep} px`);
        for (const e of errors) console.log(`  ERROR ${e}`);
        for (const w of warnings.slice(0, 8)) console.log(`  warn  ${w}`);

        let video: string | undefined;
        let renderMs = 0;
        if (!o.qaOnly && errors.length) {
          console.log('  skipping the video: fix the QA errors first');
        } else if (!o.qaOnly) {
          const fields: Record<string, unknown> = {
            lab: LAB_ID, run_id: `${LAB_ID}-${c.key}`, direction: c.dir, family: 'logo-motion', post: c.key, frames, fps: FPS, duration_s: c.duration,
            engine: `hyperframes-${HF_VERSION}/chrome-headless-shell-156`, workers, browser_gpu: 'software (SwiftShader)', crf: CRF,
            qa_s: +(qa.ms / 1000).toFixed(2),
          };
          const raw = join(dir, 'raw.mp4');
          const final = `${outBase}.mp4`;
          const result = await metered(RUNS, fields, async () => {
            const r = await hfRender(dir, raw, workers);
            const nMs = await normalise(raw, final, c.duration);
            const p = await probe(final, c.duration);
            Object.assign(fields, {
              hf_render_s: +(r.ms / 1000).toFixed(2), hf_peak_rss_gb: +r.peakGb.toFixed(2), hf_summary: r.summary,
              per_frame_ms: Math.round(r.ms / frames), normalise_s: +(nMs / 1000).toFixed(2), mp4_bytes: p.bytes, video_kbps: p.kbps,
              spec_errors: p.errors.length,
            });
            return { r, nMs, p };
          });
          rmSync(raw, { force: true });
          renderMs = result.r.ms;
          errors.push(...result.p.errors);
          warnings.push(...result.p.warnings);
          video = rel(final);
          console.log(`  hyperframes: ${(result.r.ms / 1000).toFixed(1)} s, peak ${result.r.peakGb.toFixed(2)} GB (${result.r.summary})`);
          console.log(`  final: ${(result.p.bytes / 1e6).toFixed(2)} MB, ${result.p.kbps} kbps, ${result.p.profile}, ${result.p.duration} s, ${result.p.frames} frames, boxes ${result.p.boxes.join('>')}, spec ${result.p.errors.length ? result.p.errors.join('; ') : 'ok'}`);
          summary.push(`${c.key}: ${c.duration}s render ${(result.r.ms / 1000).toFixed(1)} s, HF peak ${result.r.peakGb.toFixed(2)} GB, normalise ${(result.nMs / 1000).toFixed(1)} s, ${(result.p.bytes / 1e6).toFixed(2)} MB, spec ${result.p.errors.length ? 'FAIL' : 'ok'}`);
        } else if (existsSync(`${outBase}.mp4`)) {
          video = rel(`${outBase}.mp4`);
        }

        failed += errors.length;
        const holdFrame = Math.ceil(c.settleAt * FPS);
        const slides: ManifestSlide[] = [{ id: c.key, jpg: rel(`${outBase}.jpg`), preview: rel(`${outBase}.ig.jpg`), frame: 'reel', errors, warnings, ms: renderMs || qa.ms, video }];
        // Splash cuts also offer the final frame as a still (what the app holds after the animation).
        if (c.dir === 'L3') slides.push({ id: `${c.key}-final`, jpg: rel(`${outBase}-final.png`), preview: rel(`${outBase}.ig.jpg`), frame: 'reel', errors: [], warnings: [], ms: 0 });
        const rec: PostRecord = {
          key: c.key, label: `${c.label} · ${c.duration} s, settled from ${c.settleAt} s (frame ${holdFrame})`, caption: '', family: 'logo-motion',
          renderedAt: new Date().toISOString(), dir: c.dir, duration: c.duration, settleAt: c.settleAt, slides,
          ...(c.chain ? { chain: c.chain, handoff: qa.handoff, loops: qa.loops } : {}),
        };
        writeFileSync(join(outDir, 'post.json'), JSON.stringify(rec, null, 1) + '\n');
      }
    } finally {
      await browser.close();
      await server.close();
    }
  }
  writeManifests();
  buildGallery(readManifest(), LAB_ID);
  if (summary.length) console.log('\n' + summary.join('\n'));
  console.log(`\ngallery: content/labs/${LAB_ID}/index.html (serve with: node tools/review.ts → /content/labs/${LAB_ID}/)`);
  if (failed) process.exitCode = 1;
}

if (import.meta.main) {
  const { values: o, positionals } = parseArgs({ allowPositionals: true, options: {
    'qa-only': { type: 'boolean' }, gallery: { type: 'boolean' }, workers: { type: 'string' }, snap: { type: 'string' },
    chain: { type: 'string' }, key: { type: 'string' }, ground: { type: 'string' }, reveal: { type: 'string' }, place: { type: 'string' },
  } });
  if (o.chain) {
    // An ad-hoc chain of modules (lab/logo/chain.ts), rendered into the L4 section of the gallery.
    const items = o.chain.trim().split(/\s+/);
    const key = o.key ?? `chain-${items.map(p => p.replace(/[^\w]+/g, '')).join('-')}`.slice(0, 60).toLowerCase();
    console.log(plan(items).map(st => `${st.name.padEnd(12)} ${st.from} → ${st.to}  ${st.t0}–${+(st.t0 + st.dur).toFixed(3)} s`).join('\n'));
    const c = chain({ key, dir: 'L4', label: `Chain [${items.join(' → ')}]`, items, ground: o.ground as GroundKey | undefined, reveal: o.reveal as GroundKey | undefined, place: o.place as 'center' | 'mast' | undefined });
    await renderClips([c], { qaOnly: o['qa-only'], snap: o.snap, workers: Number(o.workers ?? 1) });
    process.exit();
  }
  const clips = allClips();
  for (const k of positionals) if (!clips.some(c => c.key === k)) throw new Error(`unknown clip "${k}" (have: ${clips.map(c => c.key).join(', ')})`);
  const selected = o.gallery ? [] : clips.filter(c => !positionals.length || positionals.includes(c.key));
  await renderClips(selected, { qaOnly: o['qa-only'], snap: o.snap, workers: Number(o.workers ?? 1) });
}
