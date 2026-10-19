// Production motion renderer: one HyperFrames composition (HTML + a paused GSAP timeline) → MP4 in Instagram's video
// spec, plus a cover JPEG. Generic: any builder in src/motion/ hands over a Motion (html, duration, QA times) and gets
// back the files. Promoted from lab/dl4/reels/render.ts (same safety rules, same encode).
//
// Steps: build a self-contained project in var/render/motion/<key>/ (every absolute /assets, /content, /node_modules
// path the page loads is copied in at the same path, so the page renders in HyperFrames and in the repo's QA server
// alike) → `hyperframes lint` → Playwright QA at sample times (qaInPage, the frame's safe area) + cover frame →
// `hyperframes render` (1 worker, software GPU, near-lossless) → ffmpeg normalise (H.264 High, yuv420p, 30 fps,
// 10 Mbps VBR, closed 2 s GOP, silent AAC 48 kHz, faststart) → ffprobe check. Render + normalise are metered into
// content/motion-runs.jsonl (wall time, peak memory, swap, what else ran).
//
// HyperFrames runs with telemetry, update checks and skill installs off and uses Playwright's cached
// chrome-headless-shell. Never run `hyperframes usage|publish|cloud|skills|open`.
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { metered, treeRssGb } from '../render/meter.ts';
import { qaInPage } from '../render/qa.ts';
import { FRAMES } from '../render/render.ts';
import { ROOT, startServer } from '../render/server.ts';

export const FPS = 30;

export interface Motion {
  /** Folder name under var/render/motion/ and the composition id. */
  key: string;
  html: string;
  duration: number;
  /** Timeline seconds at which the visible text is linted. */
  qaAt: number[];
  /** Timeline second whose frame becomes the cover JPEG. */
  coverAt: number;
  /** Text safe area for the QA (default: the Story frame's). */
  safe?: { x0: number; y0: number; x1: number; y1: number };
}

const WORK = join(ROOT, 'var/render/motion');
const RUNS = join(ROOT, 'content/motion-runs.jsonl');
const HF_BIN = join(ROOT, 'node_modules/.bin/hyperframes');
const HF_VERSION: string = JSON.parse(readFileSync(join(ROOT, 'node_modules/hyperframes/package.json'), 'utf8')).version;
const CRF = 8;

function headlessShell(): string {
  const full = chromium.executablePath();
  const m = full.match(/^(.*)\/chromium-(\d+)\//);
  const arch = process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  const shell = m ? `${m[1]}/chromium_headless_shell-${m[2]}/chrome-headless-shell-${arch}/chrome-headless-shell` : '';
  if (!shell || !existsSync(shell)) throw new Error(`Playwright chrome-headless-shell not found (${shell || full}); refusing to let HyperFrames download a browser`);
  return shell;
}

const hfEnv = () => ({
  ...process.env,
  HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_NO_UPDATE_CHECK: '1', HYPERFRAMES_SKIP_SKILLS: '1',
  HYPERFRAMES_BROWSER_PATH: headlessShell(),
});

function run(cmd: string, args: string[], opts: { env?: NodeJS.ProcessEnv; log?: string } = {}) {
  return new Promise<{ code: number; out: string; ms: number; peakGb: number }>((resolve, reject) => {
    const t0 = performance.now();
    const child = spawn(cmd, args, { cwd: ROOT, env: opts.env ?? process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', peakGb = 0;
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

/** Absolute repo paths the page (and the CSS it loads) refers to. */
function referenced(text: string): string[] {
  return [...new Set([...text.matchAll(/["'(]\/((?:assets|content|node_modules)\/[^"')\s?#]+)/g)].map(m => decodeURIComponent(m[1])))];
}

function buildProject(m: Motion): string {
  const dir = join(WORK, m.key);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), m.html);
  const todo = referenced(m.html), done = new Set<string>();
  while (todo.length) {
    const rel = todo.pop()!;
    if (done.has(rel)) continue;
    done.add(rel);
    const from = join(ROOT, rel);
    if (!existsSync(from) || statSync(from).isDirectory()) continue;
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    copyFileSync(from, join(dir, rel));
    if (rel.endsWith('.css')) todo.push(...referenced(readFileSync(from, 'utf8')));
  }
  return dir;
}

async function lint(dir: string) {
  const r = await run(HF_BIN, ['lint', dir, '--json'], { env: hfEnv() });
  const errors: string[] = [], warnings: string[] = [];
  try {
    const j = JSON.parse(r.out.slice(r.out.indexOf('{')));
    for (const f of j.findings ?? []) (f.severity === 'error' ? errors : warnings).push(`hf-lint ${f.code}: ${f.message}`);
  } catch {
    if (r.code) errors.push(`hf-lint failed: ${r.out.trim().slice(0, 300)}`);
  }
  return { errors, warnings };
}

/** Seeks the timeline at each QA time, lints the visible text, saves snapshots on request, and writes the cover. */
async function qaAndCover(m: Motion, outBase: string, snapDir?: string) {
  const server = await startServer();
  const browser = await chromium.launch();
  const errors = new Set<string>(), warnings = new Set<string>();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
    page.on('pageerror', e => errors.add(`page error: ${e.message}`));
    await page.goto(`${server.url}/var/render/motion/${m.key}/index.html`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.decode().catch(() => undefined)));
    });
    const seek = (t: number) => page.evaluate(([t, id]) => {
      const tl = (window as unknown as { __timelines: Record<string, { pause(): void; totalTime(t: number, s: boolean): void }> }).__timelines[id];
      tl.pause();
      tl.totalTime(t, false);
      for (const el of document.querySelectorAll('[data-qa-tmp]')) { el.removeAttribute('data-qa-ignore'); el.removeAttribute('data-qa-tmp'); }
      for (const el of document.querySelectorAll('#root *')) {
        let hidden = false;
        for (let a: Element | null = el; a && a.id !== 'root'; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (Number(cs.opacity) < 0.05 || cs.visibility === 'hidden') { hidden = true; break; }
        }
        if (hidden && !el.hasAttribute('data-qa-ignore')) el.setAttribute('data-qa-ignore', ''), el.setAttribute('data-qa-tmp', '');
      }
    }, [t, m.key] as const);
    for (const t of m.qaAt) {
      await seek(t);
      const qa = await page.evaluate(qaInPage, { safe: m.safe ?? FRAMES.story.safe, minFontPx: 30, fontFamily: 'Rubik' });
      qa.errors.forEach(e => errors.add(`@${t}s ${e}`));
      qa.warnings.forEach(w => warnings.add(`@${t}s ${w}`));
      if (snapDir) {
        mkdirSync(snapDir, { recursive: true });
        await page.screenshot({ path: join(snapDir, `${m.key}-${t.toFixed(2)}s.jpg`), type: 'jpeg', quality: 80 });
      }
    }
    // Frame 0 is what Instagram shows as the Story's preview (owner 2026-10-19): saved next to the video to check it.
    await seek(0);
    await page.screenshot({ path: `${outBase}-preview.jpg`, type: 'jpeg', quality: 85 });
    await seek(m.coverAt);
    const png = join(WORK, m.key, 'cover.png');
    await page.screenshot({ path: png, type: 'png' });
    await sharp(png).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).withIccProfile('srgb').toFile(`${outBase}.jpg`);
  } finally {
    await browser.close();
    await server.close();
  }
  return { errors: [...errors], warnings: [...warnings] };
}

async function normalise(raw: string, out: string, duration: number) {
  const args = ['-v', 'error', '-y', '-i', raw, '-f', 'lavfi', '-t', String(duration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-threads', '1', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-b:v', '10M', '-maxrate', '12M', '-bufsize', '24M',
    '-g', String(FPS * 2), '-keyint_min', String(FPS * 2), '-sc_threshold', '0', '-flags', '+cgop',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
    '-t', String(duration), '-map_metadata', '-1', '-movflags', '+faststart', out];
  const r = await run('ffmpeg', args);
  if (r.code !== 0) throw new Error(`ffmpeg normalise failed: ${r.out.slice(0, 500)}`);
}

async function probe(file: string, expect: number) {
  const r = await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  const j = JSON.parse(r.out);
  const vs = j.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
  const a = j.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
  const errors: string[] = [];
  if (vs?.codec_name !== 'h264' || vs?.profile !== 'High' || vs?.pix_fmt !== 'yuv420p') errors.push(`video ${vs?.codec_name}/${vs?.profile}/${vs?.pix_fmt}, expected h264/High/yuv420p`);
  if (vs?.width !== 1080 || vs?.height !== 1920) errors.push(`size ${vs?.width}×${vs?.height}, expected 1080×1920`);
  if (vs?.r_frame_rate !== `${FPS}/1`) errors.push(`frame rate ${vs?.r_frame_rate}`);
  if (!a || a.codec_name !== 'aac') errors.push('audio track must be AAC');
  const dur = Number(j.format.duration);
  if (Math.abs(dur - expect) > 0.15) errors.push(`duration ${dur}s, composition is ${expect}s`);
  return { errors, bytes: Number(j.format.size), duration: dur };
}

/**
 * Renders `m` to `<outBase>.mp4` (+ `<outBase>.jpg` cover). With `qaOnly`, stops after lint, QA and the cover (no
 * video; ~1 s). Throws on QA or spec errors, so a broken frame never reaches the owner.
 */
export async function renderMotion(m: Motion, outBase: string, o: { qaOnly?: boolean; snap?: string; label?: string } = {}) {
  mkdirSync(dirname(outBase), { recursive: true });
  const dir = buildProject(m);
  const l = await lint(dir);
  const qa = await qaAndCover(m, outBase, o.snap);
  const errors = [...l.errors, ...qa.errors];
  if (errors.length) throw new Error(`motion QA failed:\n  ${errors.join('\n  ')}`);
  if (o.qaOnly) return { video: undefined, warnings: [...l.warnings, ...qa.warnings] };
  const fields: Record<string, unknown> = { kind: 'motion', key: m.key, label: o.label, frames: Math.round(m.duration * FPS), fps: FPS, duration_s: m.duration,
    engine: `hyperframes-${HF_VERSION}/chrome-headless-shell`, workers: 1, browser_gpu: 'software', crf: CRF };
  const raw = join(dir, 'raw.mp4'), video = `${outBase}.mp4`;
  const res = await metered(RUNS, fields, async () => {
    const r = await run(HF_BIN, ['render', dir, '--output', raw, '--fps', String(FPS), '--quality', 'high', '--crf', String(CRF), '--workers', '1', '--no-browser-gpu'],
      { env: hfEnv(), log: `${raw}.log` });
    if (r.code !== 0 || !existsSync(raw)) throw new Error(`hyperframes render failed (${r.code}), see ${raw}.log`);
    await normalise(raw, video, m.duration);
    const p = await probe(video, m.duration);
    Object.assign(fields, { hf_render_s: +(r.ms / 1000).toFixed(2), hf_peak_rss_gb: +r.peakGb.toFixed(2), mp4_bytes: p.bytes, spec_errors: p.errors.length });
    return { r, p };
  });
  rmSync(raw, { force: true });
  if (res.p.errors.length) throw new Error(`video spec: ${res.p.errors.join('; ')}`);
  return { video, warnings: [...l.warnings, ...qa.warnings], renderS: res.r.ms / 1000, peakGb: res.r.peakGb, bytes: res.p.bytes };
}
