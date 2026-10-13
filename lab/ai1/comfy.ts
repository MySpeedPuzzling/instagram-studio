// Minimal ComfyUI client for unattended lab batches: plain HTTP to a headless ComfyUI on 127.0.0.1 (no MCP, no
// custom-node installs), process start/stop, graph validation against GET /object_info, and sudo-free memory
// sampling of the ComfyUI process (ps RSS, footprint phys_footprint, IOAccelerator "In use system memory").
//
// Local paths come from .env (gitignored): COMFYUI_DIR (core, holds main.py), COMFYUI_MODELS_DIR (its parent is
// passed as --base-directory, as Comfy Desktop does), COMFYUI_PYTHON (the venv python), optional COMFYUI_PORT.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, openSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { loadEnv } from '../../src/data/db.ts';
import { ROOT } from '../../src/render/server.ts';

export interface ComfyConfig { dir: string; modelsDir: string; baseDir: string; python: string; port: number }

export function comfyConfig(): { cfg?: ComfyConfig; missing: string[] } {
  const file = existsSync(join(ROOT, '.env')) ? loadEnv() : {};
  const get = (k: string) => process.env[k] || file[k] || '';
  const missing = ['COMFYUI_DIR', 'COMFYUI_MODELS_DIR', 'COMFYUI_PYTHON'].filter(k => !get(k));
  if (missing.length) return { missing };
  const modelsDir = get('COMFYUI_MODELS_DIR').replace(/\/$/, '');
  return { cfg: { dir: get('COMFYUI_DIR'), modelsDir, baseDir: dirname(modelsDir), python: get('COMFYUI_PYTHON'), port: Number(get('COMFYUI_PORT') || 8189) }, missing };
}

/** Headless MPS launch: --cache-none for unattended batches (lower RAM; research notes §4), only ComfyUI-GGUF loaded,
 * no API nodes, no manager. --lowvram/--novram do nothing on MPS and fp16/pytorch-attention flags were rejected in the
 * badge-lab A/B, so the attention and precision defaults stay. */
export const comfyArgs = (c: ComfyConfig) => [
  join(c.dir, 'main.py'), '--listen', '127.0.0.1', '--port', String(c.port), '--base-directory', c.baseDir,
  '--cache-none', '--disable-auto-launch', '--disable-all-custom-nodes', '--whitelist-custom-nodes', 'ComfyUI-GGUF', '--disable-api-nodes',
  '--database-url', 'sqlite:///:memory:', // the default file DB fails to open in the core folder (harmless, but noisy)
];
export const COMFY_FLAGS_LOGGED = ['--cache-none', '--disable-all-custom-nodes', '--whitelist-custom-nodes ComfyUI-GGUF', '--disable-api-nodes', 'PYTORCH_ENABLE_MPS_FALLBACK=1'];

const sh = (cmd: string, args: string[]) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export type Graph = Record<string, { class_type: string; inputs: Record<string, unknown>; _meta?: unknown }>;
export interface ImageRef { filename: string; subfolder: string; type: string }

export function client(c: ComfyConfig) {
  const url = `http://127.0.0.1:${c.port}`;
  async function req(path: string, init?: RequestInit, timeoutMs = 30_000) {
    const r = await fetch(url + path, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const text = await r.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : {}; } catch { /* plain text */ }
    if (!r.ok) throw Object.assign(new Error(`${init?.method ?? 'GET'} ${path} → ${r.status}: ${text.slice(0, 600)}`), { status: r.status, body });
    return body as any;
  }
  const post = (path: string, body: unknown, timeoutMs?: number) => req(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, timeoutMs);
  return {
    url,
    get: (path: string, timeoutMs?: number) => req(path, undefined, timeoutMs),
    post,
    async up() { try { await req('/system_stats', undefined, 3000); return true; } catch { return false; } },
    systemStats: () => req('/system_stats'),
    objectInfo: () => req('/object_info', undefined, 120_000) as Promise<Record<string, NodeInfo>>,
    free: () => post('/free', { unload_models: true, free_memory: true }),
    interrupt: () => post('/interrupt', {}),
    async upload(file: string, name: string): Promise<string> {
      const form = new FormData();
      form.append('image', new Blob([readFileSync(file)], { type: 'image/png' }), name);
      form.append('overwrite', 'true');
      const res = await req('/upload/image', { method: 'POST', body: form }, 60_000);
      return (res.subfolder ? res.subfolder + '/' : '') + res.name;
    },
    async view(img: ImageRef): Promise<Buffer> {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? '', type: img.type ?? 'output' });
      const r = await fetch(`${url}/view?${q}`, { signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`view ${img.filename} → ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    },
  };
}
export type Client = ReturnType<typeof client>;

/** Starts ComfyUI detached from the terminal, output appended to logFile. Returns the python PID. */
export function startComfy(c: ComfyConfig, logFile: string): number {
  const fd = openSync(logFile, 'a');
  const child = spawn(c.python, comfyArgs(c), {
    cwd: c.dir, stdio: ['ignore', fd, fd], detached: false,
    env: { ...process.env, PYTORCH_ENABLE_MPS_FALLBACK: '1', DO_NOT_TRACK: '1', PYTHONUNBUFFERED: '1' },
  });
  child.unref();
  return child.pid!;
}

export async function waitUp(api: Client, pid: number | undefined, timeoutMs = 240_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await api.up()) return true;
    if (pid && !alive(pid)) return false;
    await sleep(2000);
  }
  return false;
}

export async function stopComfy(pid: number) {
  if (!alive(pid)) return;
  try { process.kill(pid, 'SIGTERM'); } catch { /* gone */ }
  for (let i = 0; i < 30 && alive(pid); i++) await sleep(1000);
  if (alive(pid)) try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ }
}

export function alive(pid: number) { try { process.kill(pid, 0); return true; } catch { return false; } }

/** PID listening on the port (ours or someone else's ComfyUI). */
export function listenerPid(port: number): number | undefined {
  const out = sh('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']).trim().split('\n')[0];
  return out ? Number(out) : undefined;
}

/** Other ComfyUI servers (Comfy Desktop, a second headless one): a co-tenant for the calm check. */
export function otherComfy(exceptPid?: number): string[] {
  return sh('ps', ['-A', '-o', 'pid=,command=']).split('\n').map(l => l.trim()).filter(l => /main\.py|Comfy(UI)? Desktop/.test(l) && /comfy/i.test(l))
    .filter(l => Number(l.split(/\s+/)[0]) !== exceptPid && !/ai-batch|grep/.test(l)).map(l => l.split(/\s+/)[0]);
}

const GB = 1024 ** 3;
function sizeGb(s?: string) {
  const m = s?.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/);
  if (!m) return null;
  return Number(m[1]) * ({ B: 1, KB: 1024, MB: 1024 ** 2, GB, TB: 1024 ** 4 } as Record<string, number>)[m[2]] / GB;
}

export function sampleProc(pid: number) {
  const rssKb = Number(sh('ps', ['-o', 'rss=', '-p', String(pid)]).trim()) || 0;
  const fp = sh('footprint', ['-p', String(pid)]);
  return {
    rss_gb: rssKb / 1024 / 1024,
    footprint_gb: sizeGb(fp.match(/phys_footprint:\s*([\d.]+\s*\w+)/)?.[1]),
    footprint_peak_gb: sizeGb(fp.match(/phys_footprint_peak:\s*([\d.]+\s*\w+)/)?.[1]),
  };
}

export function gpuStats() {
  const io = sh('ioreg', ['-r', '-d', '1', '-c', 'IOAccelerator']);
  const inuse = Number(io.match(/"In use system memory"=(\d+)/)?.[1] ?? NaN);
  const util = Number(io.match(/"Device Utilization %"=(\d+)/)?.[1] ?? NaN);
  return { inuse_gb: Number.isNaN(inuse) ? null : inuse / GB, util: Number.isNaN(util) ? null : util };
}

export function pressureLevel(): number | null { return Number(sh('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level']).trim()) || null; }
export function swapUsedGb(): number | null {
  const m = sh('sysctl', ['-n', 'vm.swapusage']).match(/used = ([\d.,]+)M/);
  return m ? Number(m[1].replace(',', '.')) / 1024 : null;
}
export function freePct(): number | null { return Number(sh('memory_pressure', ['-Q']).match(/free percentage: (\d+)%/)?.[1] ?? NaN) || null; }

// ------------------------------------------------------------------ validation against GET /object_info

export interface NodeInfo {
  input: { required?: Record<string, unknown[]>; optional?: Record<string, unknown[]>; hidden?: Record<string, unknown> };
  output: string[];
  output_name?: string[];
}

function specOf(info: NodeInfo, name: string) { return info.input.required?.[name] ?? info.input.optional?.[name]; }
const isLink = (v: unknown): v is [string, number] => Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'number';

/** Node classes, required inputs, link types, combo values (model file names included) and number ranges. */
export function validateGraph(graph: Graph, info: Record<string, NodeInfo>): string[] {
  const errors: string[] = [];
  for (const [id, node] of Object.entries(graph)) {
    const ni = info[node.class_type];
    if (!ni) { errors.push(`${id}: unknown node class ${node.class_type} (custom node not loaded?)`); continue; }
    for (const name of Object.keys(ni.input.required ?? {})) if (!(name in node.inputs)) errors.push(`${id} ${node.class_type}: missing required input ${name}`);
    for (const [name, value] of Object.entries(node.inputs)) {
      const spec = specOf(ni, name);
      if (!spec) { errors.push(`${id} ${node.class_type}: unknown input ${name}`); continue; }
      const [type, opts = {}] = spec as [unknown, Record<string, any>];
      const options = Array.isArray(type) ? type as unknown[] : type === 'COMBO' ? (opts.options as unknown[] | undefined) : undefined;
      if (isLink(value)) {
        const src = graph[value[0]];
        if (!src) { errors.push(`${id}.${name}: link to missing node ${value[0]}`); continue; }
        const out = info[src.class_type]?.output?.[value[1]];
        if (out === undefined) { errors.push(`${id}.${name}: ${src.class_type} has no output ${value[1]}`); continue; }
        const want = options ? 'COMBO' : String(type);
        const ok = want === '*' || out === '*' || want.split(',').includes(out) || (options && out === 'COMBO');
        if (!ok) errors.push(`${id}.${name}: type ${out} from ${src.class_type}[${value[1]}], expected ${want}`);
        continue;
      }
      if (options) {
        if (!options.includes(value)) errors.push(`${id} ${node.class_type}.${name}: "${value}" not offered (${options.length} options${options.length < 12 ? ': ' + options.join(', ') : ''})`);
      } else if (type === 'INT' || type === 'FLOAT') {
        if (typeof value !== 'number' || (type === 'INT' && !Number.isInteger(value))) errors.push(`${id}.${name}: ${JSON.stringify(value)} is not ${type}`);
        else if ((opts.min !== undefined && value < opts.min) || (opts.max !== undefined && value > opts.max)) errors.push(`${id}.${name}: ${value} outside ${opts.min}..${opts.max}`);
      } else if (type === 'STRING' && typeof value !== 'string') errors.push(`${id}.${name}: expected a string`);
      else if (type === 'BOOLEAN' && typeof value !== 'boolean') errors.push(`${id}.${name}: expected a boolean`);
    }
  }
  return errors;
}

/** Model file names of a family must sit in the folder ComfyUI reads them from. */
export function missingFiles(c: ComfyConfig, rel: string[]) { return rel.filter(r => !existsSync(join(c.modelsDir, r))).map(r => `${basename(dirname(r))}/${basename(r)}`); }
