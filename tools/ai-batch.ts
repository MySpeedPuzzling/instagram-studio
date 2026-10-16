// Overnight runner for the AI image lab batches. A batch file (lab/<lab>/batch.ts, built on lab/ai/core.ts) holds the
// spec: AI1 (docs/ideas/brainstorm-2026-10.md §5, the default) or IL1 (lab/ai2/batch.ts, the illustration lab). The
// runner generates nothing before the start time and the calm-machine check; it runs one model family at a time (in
// the batch's FAMILY_ORDER; a family whose gate passes may go before an earlier one that can't get its memory;
// LAST_FAMILIES such as AI1's Qwen only at the end and only if they fit), frees memory between families, aborts on
// critical memory pressure or > 4 GB swap growth, and records every image (model, licence, seed, prompt and workflow
// hashes, wall time, ComfyUI peak memory, pressure and swap) in content/labs/<LAB>/runs.jsonl. Gallery and SUMMARY.md
// are rebuilt after each family.
// Test mode (mock API, separate lab id, never starts ComfyUI): AI1_TEST_MODE=1 AI_LAB_ID=AI1TEST COMFYUI_PORT=<mock>.
//
//   node tools/ai-batch.ts --dry-run       # plan, file checks and the calm check now; starts nothing
//   node tools/ai-batch.ts --validate      # start ComfyUI headless (no jobs), check every workflow against /object_info, stop it
//   node tools/ai-batch.ts --status        # progress; safe while the batch runs
//   node tools/ai-batch.ts                 # wait for 22:30 and calm, run, stop at 06:00 (launchd adds --scheduled)
//   node tools/ai-batch.ts --now           # don't wait for the start time (still waits for calm)
//   node tools/ai-batch.ts --force         # run although DONE.json exists; finished images are skipped
//   node tools/ai-batch.ts --gallery       # rebuild manifests, the lab gallery and SUMMARY.md from what exists
//   node tools/ai-batch.ts --schedule [--at 22:30] [--date 2026-10-13]   # install the one-night launchd agent
//   node tools/ai-batch.ts --unschedule
// Options: --batch lab/ai2/batch.ts (default lab/ai1/batch.ts), --start HH:MM (22:30), --deadline HH:MM (06:00),
//          --only E1,E4, --no-qwen
import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { WORKFLOW_DIR, type BatchModule, type CheckKind, type FamilyId, type Job, type RunnerCtx, type Slot } from '../lab/ai/core.ts';
import { runChecks, type CheckResult } from '../lab/ai1/checks.ts';
import {
  COMFY_FLAGS_LOGGED, alive, client, comfyArgs, comfyConfig, freePct, gpuStats, listenerPid, missingFiles, otherComfy, pressureLevel,
  sampleProc, sleep, startComfy, stopComfy, swapUsedGb, validateGraph, waitUp, type Client, type ComfyConfig, type ImageRef, type NodeInfo,
} from '../lab/ai1/comfy.ts';
import { ROOT } from '../src/render/server.ts';
import { calmCheck } from './calm.ts';

const { values: opt } = parseArgs({
  options: {
    batch: { type: 'string', default: 'lab/ai1/batch.ts' },
    'dry-run': { type: 'boolean' }, validate: { type: 'boolean' }, status: { type: 'boolean' }, gallery: { type: 'boolean' },
    now: { type: 'boolean' }, force: { type: 'boolean' }, scheduled: { type: 'boolean' }, 'no-qwen': { type: 'boolean' },
    schedule: { type: 'boolean' }, unschedule: { type: 'boolean' }, at: { type: 'string' }, date: { type: 'string' },
    start: { type: 'string', default: '22:30' }, deadline: { type: 'string', default: '06:00' }, only: { type: 'string' }, help: { type: 'boolean', short: 'h' },
  },
});

// The batch spec. Both batch files must fit the runner's contract (checked at compile time only).
type Conforms<T extends BatchModule> = T;
export type BatchFilesConform = [Conforms<typeof import('../lab/ai1/batch.ts')>, Conforms<typeof import('../lab/ai2/batch.ts')>];
const BATCH_FILE = resolve(ROOT, opt.batch!);
const BATCH_REL = relative(ROOT, BATCH_FILE);
if (!existsSync(BATCH_FILE)) throw new Error(`--batch ${opt.batch}: no such file`);
const B = (await import(pathToFileURL(BATCH_FILE).href)) as BatchModule;
const { EXPERIMENTS, FAMILIES, FAMILY_ORDER, LAB_ID, OUT_DIR, WORKFLOWS, familyFiles, fillWorkflow, sha256 } = B;
const allJobs = () => B.jobs();
const hooks = B.hooks ?? {};
const LAST = B.LAST_FAMILIES ?? [];
/** Experiment ids in spec order (E1…E5, I1…I6): manifests, summary and status follow it. */
const EXP_IDS = [...new Set(EXPERIMENTS.map(e => e.id))];
const lab = LAB_ID.toLowerCase();

process.env.LAB = lab; // lab/dl1/run.ts reads LAB when finalize() imports it
// Test mode (AI1_TEST_MODE=1 with AI_LAB_ID set to a test lab id such as AI1TEST or IL1TEST): the calm gate is logged
// but treated as passed and a real ComfyUI is never started, so the control flow can be exercised against a mock API
// without generating anything.
const TEST = process.env.AI1_TEST_MODE === '1';
if (TEST && (!process.env.AI_LAB_ID || /^[A-Z]+\d+$/.test(LAB_ID))) throw new Error('AI1_TEST_MODE needs AI_LAB_ID set to a test lab id (e.g. AI1TEST), never a real lab id');

const F = {
  state: join(OUT_DIR, 'state.json'), done: join(OUT_DIR, 'DONE.json'), lock: join(OUT_DIR, 'runner.pid'), runs: join(OUT_DIR, 'runs.jsonl'),
  log: join(OUT_DIR, 'batch.log'), comfyLog: join(OUT_DIR, 'comfyui.log'), summary: join(OUT_DIR, 'SUMMARY.md'), validation: join(OUT_DIR, 'validation.json'),
  launchdLog: join(OUT_DIR, 'launchd.log'),
};
const REL = OUT_DIR.slice(ROOT.length + 1); // content/labs/<LAB>
const LABEL = B.LABEL ?? `cz.myspeedpuzzling.instagram.${lab}`;
const PLIST = join(homedir(), 'Library/LaunchAgents', `${LABEL}.plist`);
const DISK_MIN_GB = 30;
const JOB_TIMEOUT_MS = 15 * 60_000; // the lab's GPU-turn cap
const SWAP_GROWTH_GB = TEST && process.env.AI1_TEST_SWAP_GB ? Number(process.env.AI1_TEST_SWAP_GB) : 4; // override only to test the watchdog
const POLL_CALM_MS = 5 * 60_000;
mkdirSync(OUT_DIR, { recursive: true });

const iso = (d = new Date()) => d.toISOString();
const hhmm = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const round = (n: number | null | undefined, k = 2) => (n === null || n === undefined || Number.isNaN(n) ? null : +n.toFixed(k));
function log(msg: string) {
  const line = `${new Date().toLocaleString('sv-SE').slice(0, 19)} ${msg}`;
  appendFileSync(F.log, line + '\n');
  if (!opt.scheduled || process.stdout.isTTY) console.log(line);
}
const readJson = <T>(f: string): T | undefined => { try { return JSON.parse(readFileSync(f, 'utf8')) as T; } catch { return undefined; } };
const sh = (cmd: string, args: string[]) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return String((e as { stdout?: string }).stdout ?? ''); } };

// ------------------------------------------------------------------ jobs, records, window

const only = opt.only?.split(',').map(s => s.trim().toUpperCase());
const JOBS = allJobs().filter(j => (!only || only.includes(j.exp)) && !(opt['no-qwen'] && j.family === 'qwen'));
const pngOf = (j: Pick<Job, 'exp' | 'id'>) => join(OUT_DIR, j.exp, `${j.id}.png`);
const sidecarOf = (j: Pick<Job, 'exp' | 'id'>) => join(OUT_DIR, j.exp, `${j.id}.json`);
const isDone = (j: Job) => existsSync(pngOf(j)) && readJson<{ status: string }>(sidecarOf(j))?.status === 'ok';

type RunRec = Record<string, any> & { exp: string; job: string; family: FamilyId; status: string };
function runRecords(): RunRec[] {
  if (!existsSync(F.runs)) return [];
  return readFileSync(F.runs, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
function latestByJob() { const m = new Map<string, RunRec>(); for (const r of runRecords()) m.set(`${r.exp}/${r.job}`, r); return m; }

function at(base: Date, t: string, dayOffset = 0) {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(base); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0);
  return d;
}
/** The night window [start, deadline) that contains now, or the next one. */
function nightWindow(now = new Date()) {
  if (opt.now) { let d = at(now, opt.deadline!); if (d <= now) d = at(now, opt.deadline!, 1); return { start: now, deadline: d, inside: true }; }
  const mk = (off: number) => { const s = at(now, opt.start!, off); let d = at(now, opt.deadline!, off); if (d <= s) d = at(now, opt.deadline!, off + 1); return { start: s, deadline: d }; };
  const y = mk(-1);
  if (now >= y.start && now < y.deadline) return { ...y, inside: true };
  const t = mk(0);
  return { ...t, inside: now >= t.start && now < t.deadline };
}

// ------------------------------------------------------------------ state

type CalmCompact = { at: string; need_gb: number; calm: boolean; failed: string[]; values: Record<string, string>; disk_gb: number; other_comfy: string[]; top_rss: string[] };
type FamState = { status: string; note?: string; started?: string; ended?: string; gate?: CalmCompact; images_ok?: number; peak_footprint_gb?: number };
interface State {
  pid: number; started: string; updated: string; phase: string; window: { start: string; deadline: string };
  family?: FamilyId; job?: string; job_started?: string; comfy?: { pid?: number; ours: boolean; port: number; engine?: string };
  families: Partial<Record<FamilyId, FamState>>; last_calm?: CalmCompact & { family: FamilyId };
  /** Values the batch's hooks keep for the night (AI1: e5_source; older AI1 state files have it at the top level). */
  picks?: Record<string, string>;
}
let state: State;
const saveState = (patch: Partial<State> = {}) => { Object.assign(state, patch, { updated: iso() }); writeFileSync(F.state, JSON.stringify(state, null, 1) + '\n'); };
const famState = (f: FamilyId, patch: Partial<FamState>) => { state.families[f] = { ...(state.families[f] ?? { status: 'pending' }), ...patch }; saveState(); };

function topRss(n = 5) {
  return sh('ps', ['-A', '-o', 'rss=,comm=']).trim().split('\n').map(l => l.trim().match(/^(\d+)\s+(.*)$/)).filter(Boolean)
    .map(m => [Number(m![1]), m![2].split('/').pop()!] as const).sort((a, b) => b[0] - a[0]).slice(0, n).map(([kb, c]) => `${c} ${(kb / 1048576).toFixed(1)} GB`);
}
function calmNow(f: FamilyId, comfyPid?: number): CalmCompact {
  const need = FAMILIES[f].needGb;
  const r = calmCheck(need);
  const others = otherComfy(comfyPid);
  const failed = r.checks.filter(c => !c.ok && c.want !== 'informational').map(c => `${c.name} ${c.value} (want ${c.want})`);
  if (others.length) failed.push(`another ComfyUI is running (pid ${others.join(', ')})`);
  if (r.diskGb < DISK_MIN_GB) failed.push(`free disk ${r.diskGb.toFixed(0)} GB (want ≥ ${DISK_MIN_GB})`);
  if (TEST && process.env.AI1_TEST_NOT_CALM?.split(',').includes(f)) return { at: iso(), need_gb: need, calm: false, failed: ['(test) simulated not calm'], values: {}, disk_gb: Math.round(r.diskGb), other_comfy: [], top_rss: [] };
  return { at: iso(), need_gb: need, calm: failed.length === 0 || TEST, failed: TEST ? failed.map(x => `(test mode, ignored) ${x}`) : failed, values: Object.fromEntries(r.checks.map(c => [c.name, c.value])), disk_gb: Math.round(r.diskGb), other_comfy: others, top_rss: topRss() };
}

// ------------------------------------------------------------------ the run

let cfg: ComfyConfig;
let api: Client;
let info: Record<string, NodeInfo> | undefined;
let comfy: { pid?: number; ours: boolean; engine?: string } = { ours: false };
let aborted = false;
const wake = new Set<() => void>();
function nap(ms: number) { return new Promise<void>(r => { const t = setTimeout(done, ms); function done() { clearTimeout(t); wake.delete(done); r(); } wake.add(done); }); }
const CLIENT_ID = `msp-${lab}-${process.pid}`;

async function ensureComfy(): Promise<boolean> {
  if (await api.up()) {
    comfy.pid ??= listenerPid(cfg.port);
    if (!comfy.ours && !TEST) { comfy.ours = true; log(`ComfyUI already up on port ${cfg.port} (pid ${comfy.pid}); using it and stopping it at the end`); }
  } else if (TEST) {
    log('test mode: no API listening, and test mode never starts a real ComfyUI');
    return false;
  } else {
    log(`starting ComfyUI headless on 127.0.0.1:${cfg.port} (${COMFY_FLAGS_LOGGED.join(' ')})`);
    const pid = startComfy(cfg, F.comfyLog);
    comfy = { pid, ours: true };
    if (!(await waitUp(api, pid))) { log('ComfyUI did not come up within 4 min (see comfyui.log)'); await stopComfy(pid); comfy = { ours: false }; return false; }
  }
  const ss = await api.systemStats();
  comfy.engine = `comfyui-${ss?.system?.comfyui_version ?? '?'}/torch-${ss?.system?.pytorch_version ?? '?'}`;
  info = await api.objectInfo();
  saveState({ comfy: { ...comfy, port: cfg.port } });
  log(`ComfyUI up (${comfy.engine}, pid ${comfy.pid}, ${Object.keys(info).length} node types)`);
  return true;
}

async function stopOurComfy() {
  if (comfy.ours && comfy.pid) {
    try { await api.free(); } catch { /* not up */ }
    await stopComfy(comfy.pid);
    log('ComfyUI stopped');
  }
  comfy = { ours: false };
  info = undefined;
  if (state) saveState({ comfy: { ours: false, port: cfg.port } });
}

/** Polls the calm check every 5 min until one of the candidate families passes (first in spec order wins) or every
 * candidate is past its give-up time. A family that needs less memory may thus run before a bigger one that can't. */
async function waitCalm(cands: Array<{ f: FamilyId; giveUpAt: Date }>): Promise<{ f?: FamilyId; gate?: CalmCompact; reason?: string; expired: FamilyId[] }> {
  for (;;) {
    if (aborted) return { reason: 'aborted', expired: [] };
    const live = cands.filter(c => Date.now() < c.giveUpAt.getTime());
    const checks = (live.length ? live : cands.slice(0, 1)).map(c => ({ ...c, r: calmNow(c.f, comfy.pid) }));
    const first = checks[0];
    saveState({ last_calm: { ...first.r, family: first.f } });
    if (first.r.disk_gb < DISK_MIN_GB) { log(`DISK: ${first.r.disk_gb} GB free (< ${DISK_MIN_GB} GB): not starting anything; tell the owner`); return { reason: `disk ${first.r.disk_gb} GB < ${DISK_MIN_GB} GB`, expired: cands.map(c => c.f) }; }
    const ok = live.length ? checks.find(c => c.r.calm) : undefined;
    if (ok) {
      if (ok.f !== cands[0].f) log(`${cands[0].f} is not calm (${checks[0].r.failed.join('; ')}), but ${ok.f} is: running ${ok.f} first`);
      log(`calm for ${ok.f} (need ${ok.r.need_gb} GB): free ${ok.r.values['free memory']}, swap ${ok.r.values['swap used']}, disk ${ok.r.disk_gb} GB`);
      return { f: ok.f, gate: ok.r, expired: cands.filter(c => Date.now() >= c.giveUpAt.getTime()).map(c => c.f) };
    }
    if (!live.length) {
      const why = first.r.calm ? 'not enough time left before the deadline' : `not calm before ${hhmm(new Date(Math.max(...cands.map(c => c.giveUpAt.getTime()))))}: ${first.r.failed.join('; ')}`;
      log(`gave up on ${cands.map(c => c.f).join(', ')}: ${why}`);
      return { reason: why, expired: cands.map(c => c.f) };
    }
    const nextGiveUp = Math.min(...live.map(c => c.giveUpAt.getTime()));
    log(`not calm for ${live.map(c => `${c.f} (${FAMILIES[c.f].needGb} GB)`).join(', ')}: ${first.r.failed.join('; ')}. Next check in 5 min (give up at ${hhmm(new Date(Math.max(...live.map(c => c.giveUpAt.getTime()))))})`);
    for (const c of live) famState(c.f, { status: 'waiting-calm', note: checks.find(x => x.f === c.f)!.r.failed.join('; ') });
    saveState({ phase: 'waiting-calm', family: first.f });
    await nap(Math.max(1000, Math.min(POLL_CALM_MS, nextGiveUp - Date.now() + 1000)));
  }
}

/** What the batch's hooks may use. */
const ctx: RunnerCtx = {
  isDone: j => isDone(j),
  pngOf: j => pngOf(j),
  checksFor: (j, slots) => checksFor(j, slots),
  pick(key, value) {
    const st = state ?? readJson<State>(F.state);
    if (value !== undefined && state) saveState({ picks: { ...(state.picks ?? {}), [key]: value } });
    return value ?? st?.picks?.[key] ?? (st as Record<string, any> | undefined)?.[key];
  },
  log: msg => log(msg),
};

function referenceFile(j: Job): Promise<string | undefined> | string | undefined {
  if (!j.reference) return undefined;
  return hooks.referenceFile?.(j, ctx);
}

async function waitIdle(ms = 90_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const q = await api.get('/queue'); if (!q.queue_running?.length && !q.queue_pending?.length) return; } catch { return; }
    await sleep(2000);
  }
}

type Outcome = 'ok' | 'error' | 'deferred' | 'skipped' | 'aborted';
function record(j: Job, status: Outcome, extra: Record<string, unknown>): Record<string, any> {
  const f = FAMILIES[j.family];
  const rec = {
    at: iso(), lab: LAB_ID, run_id: `${LAB_ID}-${j.exp}-${j.id}`, exp: j.exp, variant: j.variant, job: j.id, family: j.family, status,
    model_file: j.modelFile, text_encoder: j.textEncoder, vae: j.vae, lora: j.lora, licence: f.licence, licence_note: f.licenceNote,
    engine: comfy.engine, comfy_flags: COMFY_FLAGS_LOGGED, workflow: WORKFLOWS[j.workflow].file, resolution: `${j.width}x${j.height}`,
    steps: j.steps, guidance: j.cfg, sampler: j.sampler, scheduler: j.scheduler, seed: j.seed, prompt_id: j.promptId, prompt_sha: j.promptSha, use: j.use,
    ...extra,
  };
  appendFileSync(F.runs, JSON.stringify(rec) + '\n');
  return rec;
}

async function runJob(j: Job, gate: CalmCompact, ctx: { swapStart: number; cold: boolean }): Promise<Outcome> {
  const t0 = Date.now();
  saveState({ phase: 'running', family: j.family, job: `${j.exp}/${j.id}`, job_started: iso() });
  const start = { pressure: pressureLevel(), swap: swapUsedGb(), free: freePct() };
  let refFile: string | undefined, refName: string | undefined;
  if (j.reference) {
    refFile = await referenceFile(j);
    if (!refFile) { record(j, 'skipped', { error: `no reference image for ${j.reference}` }); log(`SKIP ${j.exp}/${j.id}: no reference image (${j.reference})`); return 'skipped'; }
    refName = await api.upload(refFile, `msp-${lab}-${j.exp}-${refFile.split('/').slice(-2).join('-')}`);
    if (info) Object.assign(info, await api.get('/object_info/LoadImage')); // its file list now includes the upload
  }
  const { graph, workflowSha, graphSha } = fillWorkflow(j, refName);
  const invalid = info ? validateGraph(graph, info) : [];
  const pid = comfy.pid ?? listenerPid(cfg.port);
  const peak = { rss: 0, fp: 0, gpu: 0, pressure: start.pressure ?? 0, swap: start.swap ?? 0, freeMin: start.free ?? 100, util: [] as number[] };
  let trip: string | undefined;
  const timer = setInterval(() => {
    if (pid) { const p = sampleProc(pid); peak.rss = Math.max(peak.rss, p.rss_gb); peak.fp = Math.max(peak.fp, p.footprint_gb ?? 0); }
    const g = gpuStats(); peak.gpu = Math.max(peak.gpu, g.inuse_gb ?? 0); if (g.util !== null) peak.util.push(g.util);
    const pr = pressureLevel(), sw = swapUsedGb(), fr = freePct();
    if (pr) peak.pressure = Math.max(peak.pressure, pr);
    if (sw !== null) peak.swap = Math.max(peak.swap, sw);
    if (fr !== null) peak.freeMin = Math.min(peak.freeMin, fr);
    if (pr === 4) trip ??= 'memory pressure critical';
    if (sw !== null && sw - ctx.swapStart > SWAP_GROWTH_GB) trip ??= `swap grew ${(sw - ctx.swapStart).toFixed(1)} GB since the family started`;
  }, 1000);

  let status: Outcome = 'ok', error = '', execS: number | null = null, comfyPrompt = '';
  try {
    if (invalid.length) throw new Error(`workflow invalid: ${invalid.slice(0, 3).join('; ')}`);
    const res = await api.post('/prompt', { prompt: graph, client_id: CLIENT_ID });
    comfyPrompt = res.prompt_id;
    for (;;) {
      await sleep(2000);
      if (trip || aborted || Date.now() - t0 > JOB_TIMEOUT_MS) {
        status = trip ? 'deferred' : aborted ? 'aborted' : 'error';
        error = trip ? `watchdog: ${trip}` : aborted ? 'runner stopped' : `timeout after ${JOB_TIMEOUT_MS / 60000} min`;
        try { await api.interrupt(); await waitIdle(); await api.free(); } catch { /* ComfyUI gone */ }
        break;
      }
      let h: any;
      try { h = (await api.get(`/history/${comfyPrompt}`))[comfyPrompt]; } catch (e) {
        if (pid && !alive(pid)) throw new Error('ComfyUI process died');
        continue;
      }
      if (!h) continue;
      const msgs: Array<[string, any]> = h.status?.messages ?? [];
      const ts = (k: string) => msgs.find(m => m[0] === k)?.[1]?.timestamp as number | undefined;
      if (h.status?.status_str === 'error') {
        const e = msgs.find(m => m[0] === 'execution_error')?.[1];
        throw new Error(`execution error in ${e?.node_type ?? '?'}: ${String(e?.exception_message ?? '?').slice(0, 300)}`);
      }
      if (h.status?.completed) {
        const s0 = ts('execution_start'), s1 = ts('execution_success');
        execS = s0 && s1 ? (s1 - s0) / 1000 : null;
        const imgs: ImageRef[] = Object.values(h.outputs ?? {}).flatMap((o: any) => o.images ?? []).filter((i: ImageRef) => (i.type ?? 'output') === 'output');
        if (!imgs.length) throw new Error('finished without an image');
        mkdirSync(join(OUT_DIR, j.exp), { recursive: true });
        writeFileSync(pngOf(j), await api.view(imgs[0]));
        break;
      }
    }
  } catch (e) {
    status = 'error';
    error = (e as Error).message.slice(0, 600);
  } finally {
    clearInterval(timer);
  }
  const end = { pressure: pressureLevel(), swap: swapUsedGb() };
  const utilMean = peak.util.length ? peak.util.reduce((a, b) => a + b, 0) / peak.util.length : null;
  const rec = record(j, status, {
    error: error || undefined, workflow_sha: workflowSha, graph_sha: graphSha, comfy_prompt: comfyPrompt || undefined,
    reference: refFile ? refFile.slice(ROOT.length + 1) : undefined, reference_sha: refFile ? sha256(readFileSync(refFile)) : undefined,
    wall_s: round((Date.now() - t0) / 1000, 1), exec_s: round(execS, 1), cold: ctx.cold,
    proc_peak_rss_gb: round(peak.rss), proc_peak_footprint_gb: round(peak.fp), gpu_inuse_peak_gb: round(peak.gpu), gpu_util_mean: round(utilMean, 0),
    pressure_start: start.pressure, pressure_max: peak.pressure, pressure_end: end.pressure,
    swap_used_gb_start: round(start.swap), swap_used_gb_peak: round(peak.swap), swap_used_gb_end: round(end.swap), free_pct_start: start.free, free_pct_min: peak.freeMin,
    calm_check: gate, output: status === 'ok' ? pngOf(j).slice(ROOT.length + 1) : undefined,
  });
  if (status === 'ok') writeFileSync(sidecarOf(j), JSON.stringify({ ...rec, prompt: j.prompt, prompt_title: j.promptTitle, graph }, null, 1) + '\n');
  log(`${status === 'ok' ? 'ok   ' : status.toUpperCase().padEnd(5)} ${j.exp}/${j.id} ${rec.wall_s} s${ctx.cold ? ' (cold)' : ''}, ComfyUI footprint ${round(peak.fp, 1)} GB, pressure ≤ ${peak.pressure}, swap ${round(start.swap, 1)}→${round(end.swap, 1)} GB${error ? ' · ' + error : ''}`);
  return status;
}

/** Seconds per image for planning: this run's own median for the experiment, else the spec estimate. */
function estFor(j: Job) {
  const w = runRecords().filter(r => r.status === 'ok' && r.exp === j.exp && r.family === j.family && !r.cold).map(r => r.wall_s as number).sort((a, b) => a - b);
  return w.length ? w[Math.floor(w.length / 2)] : j.estS;
}

async function run() {
  if (existsSync(F.done) && !opt.force) { log(`DONE.json exists (${readJson<{ status: string }>(F.done)?.status}): nothing to do. Use --force to run again.`); return; }
  const lockPid = Number(existsSync(F.lock) ? readFileSync(F.lock, 'utf8') : 0);
  if (lockPid && lockPid !== process.pid && alive(lockPid)) { log(`another runner is active (pid ${lockPid}); exiting`); process.exitCode = 1; return; }
  const win = nightWindow();
  if (opt.scheduled && !win.inside) { log(`launchd fired at ${hhmm(new Date())}, outside the ${opt.start}–${opt.deadline} window: not running (no marker written)`); return; }
  const c = comfyConfig();
  if (!c.cfg) { log(`missing in .env: ${c.missing.join(', ')}; not running`); process.exitCode = 1; return; }
  cfg = c.cfg; api = client(cfg);
  writeFileSync(F.lock, String(process.pid));
  state = { pid: process.pid, started: iso(), updated: iso(), phase: 'starting', window: { start: iso(win.start), deadline: iso(win.deadline) }, families: {} };
  saveState();
  log(`${LAB_ID} batch runner started (pid ${process.pid}); window ${win.start.toLocaleString('sv-SE').slice(0, 16)} → ${hhmm(win.deadline)}; ${JOBS.filter(j => !isDone(j)).length} of ${JOBS.length} images to make`);

  // Keep the Mac awake while this process lives (idle sleep only; the lid must stay open on AC).
  spawn('/usr/bin/caffeinate', ['-i', '-w', String(process.pid)], { stdio: 'ignore', detached: true }).unref();

  // Pre-flight: files the families need; the batch's cheap inputs (scaffolds, HTML renders) if missing.
  const skip = new Set<FamilyId>();
  for (const f of FAMILY_ORDER) {
    if (!JOBS.some(j => j.family === f)) continue;
    const miss = missingFiles(cfg, familyFiles(FAMILIES[f]));
    if (miss.length) { skip.add(f); famState(f, { status: 'missing', note: `missing model files: ${miss.join(', ')}` }); log(`${f}: missing ${miss.join(', ')}; dropping its experiments`); }
  }
  if (hooks.prepare) { log('preparing the batch inputs (scaffolds) if missing'); await hooks.prepare(); }

  if (Date.now() < win.start.getTime()) {
    log(`waiting for the start time ${hhmm(win.start)}`);
    saveState({ phase: 'waiting-start' });
    while (!aborted && Date.now() < win.start.getTime()) await nap(Math.min(10 * 60_000, win.start.getTime() - Date.now()));
  }

  let status = 'complete';
  const deferredReason = new Map<string, string>();
  const defer = (js: Job[], why: string) => js.forEach(j => deferredReason.set(`${j.exp}/${j.id}`, why));
  const pendingOf = (f: FamilyId) => JOBS.filter(j => j.family === f && !isDone(j));
  for (const f of FAMILY_ORDER) if (JOBS.some(j => j.family === f) && !skip.has(f) && !pendingOf(f).length) famState(f, { status: 'done', note: 'already made' });
  const remaining = FAMILY_ORDER.filter(f => !skip.has(f) && pendingOf(f).length);
  while (remaining.length && !aborted) {
    // Spec order; LAST_FAMILIES (AI1: Qwen, optional, needs an E4 shelf) only once everything else has had its turn.
    const cands = remaining.filter(f => !LAST.includes(f) || remaining.every(x => LAST.includes(x))).map(f => {
      // An optional family must be able to finish before the deadline.
      const est = pendingOf(f).reduce((s, j) => s + estFor(j), 0) + 120;
      return { f, giveUpAt: LAST.includes(f) ? new Date(win.deadline.getTime() - est * 1000) : win.deadline };
    });
    const blocked = await hooks.familyBlocked?.(cands[0].f, ctx);
    if (blocked) {
      const f0 = cands[0].f;
      famState(f0, { status: 'skipped', note: blocked }); log(`${f0}: ${blocked}; skipping it`);
      defer(pendingOf(f0), blocked); remaining.splice(remaining.indexOf(f0), 1); continue;
    }
    for (const c of cands) famState(c.f, { status: 'waiting-calm' });
    const w = await waitCalm(cands);
    for (const x of w.expired.filter(x => x !== w.f)) {
      famState(x, { status: 'deferred', note: w.reason ?? `not calm before ${hhmm(cands.find(c => c.f === x)!.giveUpAt)}` });
      defer(pendingOf(x), w.reason ?? 'not calm'); remaining.splice(remaining.indexOf(x), 1); status = 'partial';
    }
    if (!w.f || !w.gate) { if (w.reason === 'aborted' || w.reason?.startsWith('disk')) { for (const x of remaining) defer(pendingOf(x), w.reason); break; } continue; }
    const f = w.f, gate = w.gate;
    remaining.splice(remaining.indexOf(f), 1);
    const pending = pendingOf(f);
    if (!(await ensureComfy())) { famState(f, { status: 'deferred', note: 'ComfyUI did not start' }); defer(pending, 'ComfyUI did not start'); status = 'partial'; continue; }
    famState(f, { status: 'running', started: iso(), gate, note: undefined });
    const swapStart = swapUsedGb() ?? 0;
    let cold = true, errorsInRow = 0, ok = 0;
    for (const j of pending) {
      if (aborted) break;
      const key = `${j.exp}/${j.id}`;
      if (Date.now() >= win.deadline.getTime()) { deferredReason.set(key, `deadline ${opt.deadline}`); continue; }
      if (!j.core) {
        const coreLeft = JOBS.filter(x => x.core && x !== j && !isDone(x) && !deferredReason.has(`${x.exp}/${x.id}`) && (x.family === f || remaining.includes(x.family)))
          .reduce((s, x) => s + estFor(x), 0);
        if (Date.now() + (estFor(j) + coreLeft) * 1000 > win.deadline.getTime() - 10 * 60_000) { deferredReason.set(key, 'time budget: core experiments first'); continue; }
      }
      const out = await runJob(j, gate, { swapStart, cold });
      cold = false;
      if (out === 'ok') { ok++; errorsInRow = 0; continue; }
      if (out === 'skipped') { deferredReason.set(key, 'no reference'); continue; }
      if (out === 'deferred') {
        deferredReason.set(key, 'watchdog');
        defer(pending.slice(pending.indexOf(j) + 1), 'watchdog tripped earlier in the family');
        log(`watchdog: deferring the rest of ${f}`);
        break;
      }
      if (out === 'error' && ++errorsInRow >= 3) {
        if (comfy.pid && !alive(comfy.pid)) { log('ComfyUI died; restarting it once'); comfy = { ours: false }; if (await ensureComfy()) { errorsInRow = 0; continue; } }
        defer(pending.slice(pending.indexOf(j) + 1), '3 errors in a row');
        log(`3 errors in a row: deferring the rest of ${f}`);
        break;
      }
    }
    try { await api.free(); } catch { /* down */ }
    await sleep(5000);
    // If /free did not give the memory back, restart ComfyUI for the next family rather than gate on its leftovers.
    const fp = comfy.pid ? sampleProc(comfy.pid).footprint_gb ?? 0 : 0;
    if (comfy.ours && fp > 2) { log(`ComfyUI still holds ${fp.toFixed(1)} GB after /free: stopping it (restarted for the next family)`); await stopOurComfy(); }
    const left = pending.filter(j => !isDone(j)).length;
    const fams = runRecords().filter(r => r.family === f && r.status === 'ok');
    famState(f, { status: left ? 'partial' : 'done', ended: iso(), images_ok: ok, peak_footprint_gb: Math.max(0, ...fams.map(r => r.proc_peak_footprint_gb ?? 0)) });
    if (left) status = 'partial';
    log(`${f} finished: ${ok} new images, ${left} left`);
    await finalize(deferredReason).catch(e => log(`gallery update failed: ${(e as Error).message}`));
  }
  if (aborted) status = 'aborted';
  await stopOurComfy();
  const latest = latestByJob();
  const counts = { planned: JOBS.length, ok: JOBS.filter(isDone).length, failed: JOBS.filter(j => !isDone(j) && latest.get(`${j.exp}/${j.id}`)?.status === 'error').length, deferred: deferredReason.size };
  if (counts.ok < counts.planned && status === 'complete') status = 'partial';
  writeFileSync(F.done, JSON.stringify({ at: iso(), status, ...counts, deferred_jobs: Object.fromEntries(deferredReason) }, null, 1) + '\n');
  saveState({ phase: 'finished', job: undefined, family: undefined });
  await finalize(deferredReason).catch(e => log(`gallery update failed: ${(e as Error).message}`));
  rmSync(F.lock, { force: true });
  log(`${LAB_ID} batch ${status}: ${counts.ok}/${counts.planned} images, ${counts.failed} failed, ${counts.deferred} deferred. Summary: ${REL}/SUMMARY.md`);
}

// ------------------------------------------------------------------ gallery, checks, summary

async function checksFor(j: Job, slots?: Slot[]): Promise<CheckResult> {
  const side = readJson<Record<string, any>>(sidecarOf(j));
  if (side?.checks && side.checks_png_mtime === statSync(pngOf(j)).mtimeMs) return side.checks;
  const res = await runChecks(j, pngOf(j), slots);
  if (side) writeFileSync(sidecarOf(j), JSON.stringify({ ...side, checks: res, checks_png_mtime: statSync(pngOf(j)).mtimeMs }, null, 1) + '\n');
  return res;
}

async function jpg(png: string, out = png.replace(/\.png$/, '.jpg')) {
  if (!existsSync(out) || statSync(out).mtimeMs < statSync(png).mtimeMs) await sharp(png).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(out);
  return '/' + out.slice(ROOT.length + 1);
}

/** Offset tile: the image's edges meet in the middle, so a seam shows as a cross. */
async function tile(png: string) {
  const out = png.replace(/\.png$/, '.tile.jpg');
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(png).mtimeMs) return '/' + out.slice(ROOT.length + 1);
  const m = await sharp(png).metadata();
  const w = m.width!, h = m.height!, hw = Math.floor(w / 2), hh = Math.floor(h / 2);
  const part = (left: number, top: number, width: number, height: number) => sharp(png).extract({ left, top, width, height }).toBuffer();
  await sharp({ create: { width: w, height: h, channels: 3, background: '#000' } }).composite([
    { input: await part(hw, hh, w - hw, h - hh), left: 0, top: 0 }, { input: await part(0, hh, hw, h - hh), left: w - hw, top: 0 },
    { input: await part(hw, 0, w - hw, hh), left: 0, top: h - hh }, { input: await part(0, 0, hw, hh), left: w - hw, top: h - hh },
  ]).jpeg({ quality: 90 }).toFile(out);
  return '/' + out.slice(ROOT.length + 1);
}

async function finalize(deferred = new Map<string, string>()) {
  const { readManifest } = await import('../lab/dl1/run.ts');
  const { buildGallery, POST_LABEL } = await import('../lab/dl1/gallery.ts');
  const all = allJobs();
  for (const expId of EXP_IDS) {
    const exps = EXPERIMENTS.filter(e => e.id === expId);
    const groups = new Map<string, Job[]>();
    // Core rows first (a control model's rows after the core model's), otherwise job order.
    for (const j of all.filter(x => x.exp === expId).sort((a, b) => +b.core - +a.core)) groups.set(`${j.variant ? j.variant + '-' : ''}${j.promptId}`, [...(groups.get(`${j.variant ? j.variant + '-' : ''}${j.promptId}`) ?? []), j]);
    const posts = [];
    for (const [key, js] of groups) {
      const made = js.filter(j => existsSync(pngOf(j)));
      if (!made.length) continue;
      const slides: Array<{ id: string; jpg: string; preview: string; frame: string; errors: string[]; warnings: string[]; ms: number }> = [];
      // The row's input (code scaffold or source image) goes first, once.
      for (const j of made) {
        const input = hooks.inputSlide?.(j, readJson<Record<string, any>>(sidecarOf(j)) ?? {});
        if (!input || !existsSync(input.file)) continue;
        const u = await jpg(input.file);
        slides.push({ id: input.id, jpg: u, preview: u, frame: 'feed', errors: [], warnings: [`info: ${input.note}`], ms: 0 });
        break;
      }
      for (const j of made) {
        const side = readJson<Record<string, any>>(sidecarOf(j)) ?? {};
        const c = await checksFor(j, hooks.slotsFor?.(j));
        const u = await jpg(pngOf(j));
        const meta = `info: ${j.modelFile} (${j.licence}) · seed ${j.seed} · ${j.steps} steps · ${side.wall_s ?? '?'} s · ComfyUI ≤ ${side.proc_peak_footprint_gb ?? '?'} GB`;
        slides.push({ id: `s${j.seed}`, jpg: u, preview: u, frame: 'feed', errors: [], warnings: [...c.warnings, meta], ms: Math.round((side.wall_s ?? 0) * 1000) });
        if (j.checks.includes('seam')) { const t = await tile(pngOf(j)); slides.push({ id: `s${j.seed}-tile`, jpg: t, preview: t, frame: 'feed', errors: [], warnings: ['info: offset tile of the slide before (a seam shows as a cross)'], ms: 0 }); }
      }
      const missing = js.filter(j => !existsSync(pngOf(j))).map(j => `s${j.seed}${deferred.get(`${j.exp}/${j.id}`) ? ` (${deferred.get(`${j.exp}/${j.id}`)})` : ''}`);
      const v = js[0].variant;
      const vLabel = v ? exps.find(e => e.variant === v)?.variantLabel ?? v : '';
      const label = `${js[0].promptTitle}${v ? ` · ${vLabel}` : ''} · ${js[0].use}${missing.length ? ` · not made: ${missing.join(', ')}` : ''}`;
      POST_LABEL[`${expId}-${key}`] = label; // buildGallery only fills labels it hasn't seen (??=), and they change during the night
      posts.push({ key: `${expId}-${key}`, label, slides });
    }
    const dir = join(OUT_DIR, expId);
    if (!posts.length) { rmSync(join(dir, 'manifest.json'), { force: true }); continue; }
    const e = exps[0];
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ id: expId, name: e.name, idea: `${e.idea} Pass: ${e.pass}`, renderedAt: iso(), posts }, null, 1) + '\n');
  }
  buildGallery(readManifest(), LAB_ID);
  writeSummary(deferred);
}

function median(xs: number[]) { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; }
const dur = (s: number) => s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : `${Math.round(s / 60)} min`;

function writeSummary(deferred: Map<string, string>) {
  const recs = runRecords();
  const latest = latestByJob();
  const st = readJson<State>(F.state);
  const done = readJson<{ at: string; status: string; ok: number; planned: number; failed: number; deferred: number }>(F.done);
  const L: string[] = [`# ${LAB_ID} batch: morning summary`, '', `Updated ${new Date().toLocaleString('sv-SE').slice(0, 16)}. Gallery: http://127.0.0.1:4173/${REL}/ (start it with \`node tools/review.ts\`).`, ''];
  if (st) L.push(`Runner: started ${new Date(st.started).toLocaleString('sv-SE').slice(0, 16)}, phase **${st.phase}**, window until ${hhmm(new Date(st.window.deadline))}.`);
  if (done) L.push(`Result: **${done.status}**, ${done.ok}/${done.planned} images, ${done.failed} failed, ${done.deferred} deferred (finished ${new Date(done.at).toLocaleString('sv-SE').slice(0, 16)}).`);
  L.push('');
  L.push('## Per model family', '', '| Family | Licence | Images ok | Errors | Wall total | Median / image | Cold first image | ComfyUI peak footprint | Peak RSS | Max pressure | Swap start → end | Gate |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const f of FAMILY_ORDER) {
    const rs = recs.filter(r => r.family === f);
    const ok = rs.filter(r => r.status === 'ok');
    const fs = st?.families?.[f];
    if (!rs.length && !fs) continue;
    const warm = ok.filter(r => !r.cold).map(r => r.wall_s);
    const cold = ok.find(r => r.cold)?.wall_s;
    const sw = rs.filter(r => r.swap_used_gb_start !== undefined);
    const gate = fs?.gate ? `${fs.gate.calm ? 'calm' : 'not calm'} at ${new Date(fs.gate.at).toLocaleTimeString('en-GB').slice(0, 5)} (need ${fs.gate.need_gb} GB, free ${fs.gate.values['free memory']})` : (fs?.note ?? fs?.status ?? '');
    L.push(`| ${FAMILIES[f].name} | ${FAMILIES[f].licence} | ${ok.length} / ${JOBS.filter(j => j.family === f).length} | ${rs.filter(r => r.status === 'error').length} | ${dur(ok.reduce((s, r) => s + (r.wall_s ?? 0), 0))} | ${median(warm) ?? '–'} s | ${cold ?? '–'} s | ${Math.max(0, ...ok.map(r => r.proc_peak_footprint_gb ?? 0)).toFixed(1)} GB | ${Math.max(0, ...ok.map(r => r.proc_peak_rss_gb ?? 0)).toFixed(1)} GB | ${Math.max(0, ...rs.map(r => r.pressure_max ?? 0)) || '–'} | ${sw.length ? `${sw[0].swap_used_gb_start} → ${sw[sw.length - 1].swap_used_gb_end} GB` : '–'} | ${gate} |`);
  }
  L.push('', '## Per experiment', '', '| Exp. | Made / planned | Auto-checks all pass | Not made |', '|---|---|---|---|');
  for (const e of EXP_IDS) {
    const js = JOBS.filter(j => j.exp === e);
    if (!js.length) continue;
    const made = js.filter(j => existsSync(pngOf(j)));
    const pass = made.filter(j => readJson<{ checks?: CheckResult }>(sidecarOf(j))?.checks?.pass === true).length;
    const notMade = js.filter(j => !existsSync(pngOf(j))).map(j => `${j.id}${deferred.get(`${j.exp}/${j.id}`) ? ` (${deferred.get(`${j.exp}/${j.id}`)})` : latest.get(`${j.exp}/${j.id}`)?.status === 'error' ? ' (error)' : ''}`);
    L.push(`| ${e} ${EXPERIMENTS.find(x => x.id === e)!.name} | ${made.length} / ${js.length} | ${pass} / ${made.length} | ${notMade.length ? notMade.slice(0, 6).join(', ') + (notMade.length > 6 ? `, … (${notMade.length})` : '') : '–'} |`);
  }
  const errs = [...latest.values()].filter(r => r.status === 'error');
  if (errs.length) { L.push('', '## Errors', ''); for (const r of errs.slice(0, 20)) L.push(`- ${r.exp}/${r.job}: ${r.error}`); }
  const notes = hooks.summaryNotes?.(ctx) ?? [];
  if (notes.length) L.push('', ...notes);
  const used = (k: CheckKind) => EXPERIMENTS.filter(e => e.checks.includes(k)).map(e => e.id).filter((x, i, a) => a.indexOf(x) === i).join('/');
  const CHECK_TEXT: Record<CheckKind, string> = {
    zone: 'Type zone flat: luma σ ≤ 10 after a 9 px blur inside the zone where code sets the type',
    palette: 'Brand palette: mean ΔE2000 ≤ 10 to the nearest brand colour after a 50 % OKLab pull (the brand-LUT snap)',
    slots: 'Slots kept: every scaffold box edge found within ±4 px, IoU ≥ 0.98. Composite-back makes the final boxes exact anyway',
    spot: 'Spot art: clean white border for the flood-fill cutout, coral 30–40 % of the filled area',
    seam: 'Seamless: offset-tile seam ratio and even light (the tile slide shows a seam as a cross)',
  };
  L.push('', '## What the auto-checks mean', '', ...(Object.keys(CHECK_TEXT) as CheckKind[]).filter(k => used(k)).map(k => `- ${CHECK_TEXT[k]} (${used(k)}).`),
    '- Not checked by code: glyphs, anything that reads as a puzzle/person/landmark, banding after Instagram, "would post". That is the owner\'s pass.', '',
    `Records: \`${REL}/runs.jsonl\` (one line per image), sidecar JSON next to every PNG, runner log \`batch.log\`, ComfyUI log \`comfyui.log\`.`);
  writeFileSync(F.summary, L.join('\n') + '\n');
}

// ------------------------------------------------------------------ dry run, validation, status, schedule

function planLines() {
  const out: string[] = [];
  let total = 0;
  for (const f of FAMILY_ORDER) {
    const js = JOBS.filter(j => j.family === f);
    if (!js.length) continue;
    const left = js.filter(j => !isDone(j));
    const est = left.reduce((s, j) => s + j.estS, 0) + (left.length ? 90 : 0);
    total += est;
    const exps = [...new Set(js.map(j => j.exp + (j.variant ? `/${j.variant}` : '')))].map(e => `${e} ${js.filter(j => j.exp + (j.variant ? `/${j.variant}` : '') === e).length}`).join(', ');
    out.push(`  ${FAMILIES[f].name.padEnd(48)} ${String(left.length).padStart(3)}/${String(js.length).padEnd(3)} images  ≈ ${dur(est).padEnd(10)} need ${FAMILIES[f].needGb} GB  [${exps}]  ${FAMILIES[f].licence}`);
  }
  const optional = EXPERIMENTS.filter(e => !e.core).map(e => e.id + (e.variant ? `/${e.variant}` : ''));
  const win = nightWindow();
  const winS = (win.deadline.getTime() - (win.inside ? Date.now() : win.start.getTime())) / 1000;
  out.push(`  total ≈ ${dur(total)} of GPU time if calm all night${optional.length ? ` (${optional.join(', ')} drop first when time runs short)` : ''}`);
  out.push(`  window ${opt.start}–${opt.deadline} = ${dur(winS)}: the plan uses ${Math.round((100 * total) / winS)} %, margin ${Math.round(100 - (100 * total) / winS)} %`);
  return out;
}

function launchdLoaded() {
  const out = sh('launchctl', ['print', `gui/${process.getuid!()}/${LABEL}`]);
  if (!out) return undefined;
  return { state: out.match(/\bstate = ([^\n]+)/)?.[1]?.trim(), lastExit: out.match(/last exit code = ([^\n]+)/)?.[1]?.trim(), runs: out.match(/\bruns = (\d+)/)?.[1] };
}

const usedFamilies = () => FAMILY_ORDER.filter(f => JOBS.some(j => j.family === f));
const usedWorkflows = () => [...new Set(allJobs().map(j => j.workflow))];

async function dryRun() {
  const win = nightWindow();
  console.log(`${LAB_ID} batch plan from ${BATCH_REL}${B.TITLE ? `: ${B.TITLE}` : ''} (${JOBS.length} images; dry run, nothing started)\n`);
  for (const l of planLines()) console.log(l);
  console.log('\nper experiment (core first within a family; est. = planning seconds per image):');
  for (const e of EXPERIMENTS) {
    const js = JOBS.filter(j => j.exp === e.id && j.variant === e.variant);
    if (!js.length) continue;
    console.log(`  ${(e.id + (e.variant ? '/' + e.variant : '')).padEnd(8)} ${e.name.slice(0, 44).padEnd(44)} ${FAMILIES[e.family].name.split(' Q')[0].padEnd(20)} ${e.core ? 'core    ' : 'optional'} ${String(js.length).padStart(3)} images × ${e.estS} s ≈ ${dur(js.length * e.estS)}`);
  }
  console.log(`\nwindow: start ${win.start.toLocaleString('sv-SE').slice(0, 16)}, give up / no new jobs after ${win.deadline.toLocaleString('sv-SE').slice(0, 16)}${win.inside ? ' (inside now)' : ''}`);
  const c = comfyConfig();
  if (!c.cfg) { console.log(`\n.env: MISSING ${c.missing.join(', ')}`); process.exitCode = 1; return; }
  const k = c.cfg;
  console.log(`\nComfyUI: ${existsSync(join(k.dir, 'main.py')) ? 'main.py ok' : 'main.py MISSING'}, python ${existsSync(k.python) ? 'ok' : 'MISSING'}, base dir ${k.baseDir}, port ${k.port}`);
  console.log(`launch: ${k.python.split('/').slice(-3).join('/')} ${comfyArgs(k).map(a => a.startsWith('/') ? a.split('/').pop() : a).join(' ')}`);
  for (const f of usedFamilies()) { const miss = missingFiles(k, familyFiles(FAMILIES[f])); console.log(`models ${f.padEnd(8)} ${miss.length ? 'MISSING ' + miss.join(', ') : 'ok (' + familyFiles(FAMILIES[f]).map(x => x.split('/').pop()).join(', ') + ')'}`); }
  for (const name of usedWorkflows()) console.log(`workflow ${name.padEnd(30)} ${existsSync(join(WORKFLOW_DIR, WORKFLOWS[name].file)) ? 'ok' : 'MISSING'}`);
  for (const l of hooks.dryRunNotes?.() ?? []) console.log(l);
  const v = readJson<{ at: string; ok: boolean }>(F.validation);
  console.log(`last --validate: ${v ? `${v.ok ? 'all workflows accepted' : 'PROBLEMS'} (${v.at.slice(0, 16)})` : 'never'}`);
  console.log(`DONE marker: ${existsSync(F.done) ? 'present (the scheduled run will exit; use --force)' : 'none'}`);
  const l = launchdLoaded();
  console.log(`launchd ${LABEL}: ${l ? `loaded (${l.state})` : 'not loaded'}`);
  console.log('\ncalm check now:');
  for (const f of FAMILY_ORDER) {
    if (!JOBS.some(j => j.family === f)) continue;
    const r = calmNow(f);
    console.log(`  ${f.padEnd(8)} need ${r.need_gb} GB: ${r.calm ? 'CALM' : 'not calm: ' + r.failed.join('; ')}`);
  }
  const r = calmNow('zimage');
  console.log(`  (free ${r.values['free memory']}, swap ${r.values['swap used']}, pressure ${r.values['memory pressure']}, disk ${r.disk_gb} GB, top RSS: ${r.top_rss.join(', ')})`);
}

async function validate() {
  const c = comfyConfig();
  if (!c.cfg) { console.log(`.env missing ${c.missing.join(', ')}`); process.exitCode = 1; return; }
  cfg = c.cfg; api = client(cfg);
  const result: { at: string; batch: string; ok: boolean; engine?: string; files: Record<string, string[]>; workflows: Record<string, string[]>; graphs_checked?: number; idle_footprint_gb?: number | null; startup_s?: number; self_test?: string } = { at: iso(), batch: BATCH_REL, ok: true, files: {}, workflows: {} };
  for (const f of FAMILY_ORDER.filter(x => allJobs().some(j => j.family === x))) { result.files[f] = missingFiles(cfg, familyFiles(FAMILIES[f])); if (result.files[f].length) result.ok = false; }
  await hooks.prepare?.();
  const t0 = Date.now();
  const wasUp = await api.up();
  let pid: number | undefined;
  if (!wasUp) {
    console.log(`starting ComfyUI headless on 127.0.0.1:${cfg.port} (no jobs) …`);
    pid = startComfy(cfg, F.comfyLog);
    if (!(await waitUp(api, pid))) { console.log(`ComfyUI did not come up; see ${REL}/comfyui.log`); await stopComfy(pid); process.exitCode = 1; return; }
    result.startup_s = Math.round((Date.now() - t0) / 1000);
  } else pid = listenerPid(cfg.port);
  try {
    const ss = await api.systemStats();
    result.engine = `comfyui-${ss?.system?.comfyui_version}/torch-${ss?.system?.pytorch_version}/python-${String(ss?.system?.python_version).split(' ')[0]}`;
    // Every reference input the batch uses, uploaded once (uploads are inputs, not jobs: nothing is queued).
    const refs: Record<string, string> = {};
    for (const j of allJobs().filter(x => x.reference)) {
      const file = hooks.validationReference?.(j);
      if (!file || !existsSync(file)) { (result.workflows[`reference ${j.reference}`] ??= []).push(`no stand-in input for ${j.exp}/${j.id}`); result.ok = false; continue; }
      refs[file] ??= await api.upload(file, `msp-${lab}-validate-${file.split('/').slice(-2).join('-')}`);
    }
    const oi = await api.objectInfo();
    // Self-test: the validator must reject a wrong model name, a wrong node class and a bad link.
    const probe = fillWorkflow(allJobs().find(j => !j.reference)!).graph;
    const bad = JSON.parse(JSON.stringify(probe));
    bad['1'].inputs.unet_name = 'no-such-model.gguf'; bad['9'].class_type = 'NoSuchNode'; bad['8'].inputs.model = ['3', 0];
    result.self_test = validateGraph(bad, oi).length >= 3 ? 'ok: wrong model, class and link type all rejected' : 'FAILED';
    // Every distinct graph the batch will queue (one per workflow × experiment × reference), not just one per workflow.
    const seen = new Set<string>();
    for (const j of allJobs()) {
      const key = `${j.workflow} ${j.exp}${j.variant ? '/' + j.variant : ''}${j.reference ? ' ' + j.reference : ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const file = j.reference ? hooks.validationReference?.(j) : undefined;
      if (j.reference && !(file && refs[file])) continue;
      const { graph } = fillWorkflow(j, file ? refs[file] : undefined);
      const errs = validateGraph(graph, oi);
      result.workflows[j.workflow] = [...(result.workflows[j.workflow] ?? []), ...errs.map(e => `${key}: ${e}`)];
      if (errs.length) result.ok = false;
    }
    result.graphs_checked = seen.size;
    if (pid) result.idle_footprint_gb = round(sampleProc(pid).footprint_gb);
  } finally {
    if (!wasUp && pid) { await stopComfy(pid); console.log('ComfyUI stopped'); }
  }
  writeFileSync(F.validation, JSON.stringify(result, null, 1) + '\n');
  console.log(`\nengine ${result.engine}${result.startup_s ? `, started in ${result.startup_s} s` : ''}, idle footprint ${result.idle_footprint_gb ?? '?'} GB`);
  for (const [f, miss] of Object.entries(result.files)) console.log(`models   ${f.padEnd(30)} ${miss.length ? 'MISSING ' + miss.join(', ') : 'ok'}`);
  for (const [w, errs] of Object.entries(result.workflows)) console.log(`workflow ${w.padEnd(30)} ${errs.length ? 'REJECTED\n    ' + errs.join('\n    ') : 'accepted (node classes, inputs, link types, model names, ranges)'}`);
  console.log(`validator self-test: ${result.self_test}; ${result.graphs_checked ?? 0} distinct job graphs checked`);
  console.log(result.ok ? '\nall workflows valid' : '\nPROBLEMS found');
  if (!result.ok) process.exitCode = 1;
}

function status() {
  const st = readJson<State>(F.state);
  const done = readJson<{ at: string; status: string; ok: number; planned: number; failed: number; deferred: number }>(F.done);
  const lockPid = Number(existsSync(F.lock) ? readFileSync(F.lock, 'utf8') : 0);
  const running = !!lockPid && alive(lockPid);
  const latest = latestByJob();
  console.log(`${LAB_ID} batch: ${running ? `RUNNING (pid ${lockPid})` : done ? `finished ${done.status} at ${new Date(done.at).toLocaleString('sv-SE').slice(0, 16)}` : st ? `not running (last phase: ${st.phase})` : 'not started yet'}`);
  if (st) {
    console.log(`window ${new Date(st.window.start).toLocaleString('sv-SE').slice(0, 16)} → ${hhmm(new Date(st.window.deadline))}; phase ${st.phase}${st.job ? `, job ${st.job} since ${hhmm(new Date(st.job_started!))}` : ''}${running ? '' : ''}`);
    if (st.last_calm && st.phase === 'waiting-calm') console.log(`waiting for calm (${st.last_calm.family}, need ${st.last_calm.need_gb} GB): ${st.last_calm.failed.join('; ')}`);
  }
  const c = comfyConfig().cfg;
  const pid = c ? listenerPid(c.port) : undefined;
  console.log(`ComfyUI: ${pid ? `up on 127.0.0.1:${c!.port} (pid ${pid}, footprint ${round(sampleProc(pid).footprint_gb, 1)} GB)` : 'not running'}`);
  const byExp = EXP_IDS.map(e => {
    const js = JOBS.filter(j => j.exp === e);
    const ok = js.filter(isDone).length, err = js.filter(j => !isDone(j) && latest.get(`${e}/${j.id}`)?.status === 'error').length;
    return js.length ? `${e} ${ok}/${js.length}${err ? ` (${err} err)` : ''}` : '';
  }).filter(Boolean);
  console.log(`images: ${JOBS.filter(isDone).length}/${JOBS.length} · ${byExp.join(' · ')}`);
  if (st) for (const f of FAMILY_ORDER) {
    const fs = st.families[f];
    if (!fs) continue;
    const t = fs.started ? ` ${hhmm(new Date(fs.started))}–${fs.ended ? hhmm(new Date(fs.ended)) : 'now'}` : '';
    console.log(`  ${f.padEnd(8)} ${fs.status}${t}${fs.peak_footprint_gb ? `, peak ${fs.peak_footprint_gb.toFixed(1)} GB` : ''}${fs.note ? ` · ${fs.note}` : ''}`);
  }
  const l = launchdLoaded();
  console.log(`launchd ${LABEL}: ${l ? `loaded, ${l.state}${l.runs ? `, runs ${l.runs}` : ''}${l.lastExit ? `, last exit ${l.lastExit}` : ''}` : 'not loaded'}`);
  if (existsSync(F.log)) { console.log('\nlog (last 10):'); for (const line of readFileSync(F.log, 'utf8').trim().split('\n').slice(-10)) console.log('  ' + line); }
  if (existsSync(F.summary)) console.log(`\nsummary: ${REL}/SUMMARY.md · gallery: node tools/review.ts → http://127.0.0.1:4173/${REL}/`);
}

function schedule() {
  const t = opt.at ?? opt.start!;
  const [h, m] = t.split(':').map(Number);
  const now = new Date();
  const day = opt.date ? new Date(`${opt.date}T00:00:00`) : (at(now, t) > now ? now : at(now, t, 1));
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // The stable Homebrew symlink survives a node upgrade; the resolved Cellar path would not.
  const node = ['/opt/homebrew/bin/node', '/usr/local/bin/node'].find(p => { try { return realpathSync(p) === realpathSync(process.execPath); } catch { return false; } }) ?? process.execPath;
  const args = [node, join(ROOT, 'tools/ai-batch.ts'), '--scheduled', ...(BATCH_REL !== 'lab/ai1/batch.ts' ? ['--batch', BATCH_REL] : []), ...(t !== '22:30' ? ['--start', t] : []), ...(opt.deadline !== '06:00' ? ['--deadline', opt.deadline!] : [])];
  const path = [...new Set([dirname(node), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'])].join(':');
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <!-- ${LAB_ID} overnight image batch (msp-instagram, ${BATCH_REL}). One night: the runner writes ${REL}/DONE.json and later
       firings exit; outside the ${t}–${opt.deadline} window it exits without running. Remove: node tools/ai-batch.ts --batch ${BATCH_REL} --unschedule -->
  <key>ProgramArguments</key>
  <array>
${args.map(a => `    <string>${esc(a)}</string>`).join('\n')}
  </array>
  <key>WorkingDirectory</key><string>${esc(ROOT)}</string>
  <key>StartCalendarInterval</key>
  <dict><key>Month</key><integer>${day.getMonth() + 1}</integer><key>Day</key><integer>${day.getDate()}</integer><key>Hour</key><integer>${h}</integer><key>Minute</key><integer>${m}</integer></dict>
  <key>RunAtLoad</key><false/>
  <key>ProcessType</key><string>Interactive</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${esc(path)}</string>
    <key>HOME</key><string>${esc(homedir())}</string>
    <key>LANG</key><string>en_US.UTF-8</string>
  </dict>
  <key>StandardOutPath</key><string>${esc(F.launchdLog)}</string>
  <key>StandardErrorPath</key><string>${esc(F.launchdLog)}</string>
</dict>
</plist>
`;
  mkdirSync(dirname(PLIST), { recursive: true });
  writeFileSync(PLIST, plist);
  execFileSync('plutil', ['-lint', PLIST], { stdio: 'inherit' });
  const domain = `gui/${process.getuid!()}`;
  if (launchdLoaded()) execFileSync('launchctl', ['bootout', `${domain}/${LABEL}`], { stdio: 'ignore' });
  execFileSync('launchctl', ['bootstrap', domain, PLIST], { stdio: 'inherit' });
  const l = launchdLoaded();
  console.log(`scheduled ${LABEL}: ${day.toDateString()} ${t} → ${l ? `loaded (${l.state})` : 'NOT loaded'}; logs ${REL}/batch.log`);
  if (existsSync(F.done)) console.log('note: DONE.json exists, so the run will exit at once; delete it or run with --force to run again');
}

function unschedule() {
  if (launchdLoaded()) execFileSync('launchctl', ['bootout', `gui/${process.getuid!()}/${LABEL}`], { stdio: 'inherit' });
  rmSync(PLIST, { force: true });
  console.log(`${LABEL} removed`);
}

// ------------------------------------------------------------------ main

async function shutdown(sig: string) {
  if (aborted) { if (comfy.ours && comfy.pid) try { process.kill(comfy.pid, 'SIGKILL'); } catch { /* gone */ } process.exit(1); }
  aborted = true;
  log(`${sig}: stopping after the current step`);
  for (const w of [...wake]) w();
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

if (opt.help) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('\n').filter(l => l.startsWith('//')).slice(0, 22).map(l => l.slice(3)).join('\n'));
} else if (opt.status) status();
else if (opt['dry-run']) await dryRun();
else if (opt.validate) await validate();
else if (opt.schedule) schedule();
else if (opt.unschedule) unschedule();
else if (opt.gallery) { await finalize(new Map(Object.entries(readJson<{ deferred_jobs?: Record<string, string> }>(F.done)?.deferred_jobs ?? {}))); console.log(`gallery: ${REL}/index.html · summary: ${REL}/SUMMARY.md`); }
else {
  try {
    await run();
  } catch (e) {
    log(`runner crashed: ${(e as Error).stack ?? e}`);
    try { await stopOurComfy(); } catch { /* best effort */ }
    try { await finalize(); } catch { /* best effort */ }
    rmSync(F.lock, { force: true });
    process.exitCode = 1;
  }
}
