// "Calm machine" check before heavy jobs (ComfyUI, big Blender or video renders). Sudo-free.
//
//   node tools/calm.ts                 # report, exit 0 if calm enough for a job needing 24 GB free
//   node tools/calm.ts --need-gb 30    # e.g. Z-Image + ControlNet, Qwen-Image-Edit
//
// Thresholds from the AI-design research (research_notes/.../ai_design_augmentation.md): memory pressure
// normal, free memory ≥ need + 4 GB, swap < 2 GB and not growing, no Docker VM / Blender / LLM server /
// second ComfyUI, on AC power, no thermal warning, GPU idle, ≥ 10 GB disk.
import { execFileSync } from 'node:child_process';
import { statfsSync } from 'node:fs';
import { homedir, totalmem } from 'node:os';

const sh = (cmd: string, args: string[]) => { try { return execFileSync(cmd, args, { encoding: 'utf8' }); } catch { return ''; } };
const needIdx = process.argv.indexOf('--need-gb');
const needGb = needIdx > 0 ? Number(process.argv[needIdx + 1]) : 24;

const swapGb = () => {
  const m = sh('sysctl', ['-n', 'vm.swapusage']).match(/used = ([\d.,]+)M/);
  return m ? Number(m[1].replace(',', '.')) / 1024 : NaN;
};

export function calmCheck(need = needGb) {
  const checks: Array<{ name: string; ok: boolean; value: string; want: string }> = [];
  const add = (name: string, ok: boolean, value: string, want: string) => checks.push({ name, ok, value, want });

  const pressure = Number(sh('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level']).trim());
  add('memory pressure', pressure === 1, ({ 1: 'normal', 2: 'warn', 4: 'critical' } as Record<number, string>)[pressure] ?? String(pressure), 'normal');

  const freePct = Number(sh('memory_pressure', ['-Q']).match(/free percentage: (\d+)%/)?.[1] ?? NaN);
  const freeGb = (freePct / 100) * (totalmem() / 1024 ** 3);
  add('free memory', freeGb >= need + 4, `${freeGb.toFixed(1)} GB`, `≥ ${need + 4} GB`);

  const s1 = swapGb();
  add('swap used', s1 < 2, `${s1.toFixed(1)} GB`, '< 2 GB');

  const procs = sh('ps', ['-A', '-o', 'comm=']);
  const tenants = [
    ['Docker VM', /com\.docker\.(virtualization|hyperkit)|Docker Desktop|com\.docker\.backend/],
    ['Blender', /\/Blender\b|\bblender$/m],
    ['LM Studio / llama server', /LM Studio|llama-server|ollama/],
  ] as const;
  const running = tenants.filter(([, re]) => re.test(procs)).map(([n]) => n);
  add('co-tenants', running.length === 0, running.join(', ') || 'none', 'none of Docker, Blender, LLM servers');

  const batt = sh('pmset', ['-g', 'batt']);
  add('power', /AC Power/.test(batt), /AC Power/.test(batt) ? 'AC' : 'battery', 'AC');

  const therm = sh('pmset', ['-g', 'therm']);
  const hot = /CPU_Speed_Limit\s*=\s*(?!100)\d+|warning level\s*=?\s*[1-9]/i.test(therm);
  add('thermal', !hot, hot ? 'throttling' : 'no warning', 'no warning');

  const gpu = Number(sh('ioreg', ['-r', '-d', '1', '-c', 'IOAccelerator']).match(/"Device Utilization %"=(\d+)/)?.[1] ?? NaN);
  add('GPU utilisation', !(gpu >= 10), Number.isNaN(gpu) ? 'n/a' : `${gpu}%`, '< 10%');

  const idleS = Number(sh('ioreg', ['-c', 'IOHIDSystem']).match(/"HIDIdleTime" = (\d+)/)?.[1] ?? 0) / 1e9;
  add('user idle', true, `${Math.round(idleS / 60)} min`, 'informational');

  const fs = statfsSync(homedir());
  const diskGb = (fs.bavail * fs.bsize) / 1024 ** 3;
  add('free disk', diskGb >= 10, `${diskGb.toFixed(0)} GB`, '≥ 10 GB (owner alert under 30 GB)');

  return { calm: checks.filter(c => c.want !== 'informational').every(c => c.ok), checks, diskGb };
}

if (import.meta.main) {
  const r = calmCheck();
  for (const c of r.checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(18)} ${c.value.padEnd(24)} (${c.want})`);
  if (r.diskGb < 30) console.log('\nDISK: under 30 GB free; tell the owner before downloading anything.');
  console.log(r.calm ? `\ncalm: ready for a job needing ${needGb} GB` : `\nnot calm: hold heavy jobs needing ${needGb} GB`);
  process.exitCode = r.calm ? 0 : 1;
}
