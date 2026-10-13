// Resource metering for every prototype and lab run (owner rule: record what each run used).
// Sudo-free: process-tree RSS via ps, memory pressure and swap via sysctl.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const sh = (cmd: string, args: string[]) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8' }); } catch { return ''; }
};

/** Total RSS (GB) of this process and all its descendants (e.g. Chromium). */
export function treeRssGb(rootPid = process.pid): number {
  const rows = sh('ps', ['-A', '-o', 'pid=,ppid=,rss=']).trim().split('\n').map(l => l.trim().split(/\s+/).map(Number));
  const children = new Map<number, number[]>();
  const rss = new Map<number, number>();
  for (const [pid, ppid, kb] of rows) {
    rss.set(pid, kb);
    children.set(ppid, [...(children.get(ppid) ?? []), pid]);
  }
  let total = 0;
  const stack = [rootPid];
  while (stack.length) {
    const pid = stack.pop()!;
    total += rss.get(pid) ?? 0;
    stack.push(...(children.get(pid) ?? []));
  }
  return +(total / 1024 / 1024).toFixed(2);
}

export function systemSnapshot() {
  const pressure = Number(sh('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level']).trim()) || null; // 1 normal, 2 warn, 4 critical
  const swap = sh('sysctl', ['-n', 'vm.swapusage']).match(/used = ([\d.,]+)M/);
  const freePct = sh('memory_pressure', ['-Q']).match(/free percentage: (\d+)%/);
  // com.docker.vmnetd is a privileged helper that stays running when Docker is quit; only the VM/backend count.
  const docker = /com\.docker\.(backend|virtualization|hyperkit)|Docker Desktop\.app\/Contents\/MacOS/.test(sh('ps', ['-A', '-o', 'comm=']));
  return {
    pressure,
    swap_used_gb: swap ? +(Number(swap[1].replace(',', '.')) / 1024).toFixed(2) : null,
    free_pct: freePct ? Number(freePct[1]) : null,
    docker_running: docker,
  };
}

/** Wraps a run: samples peak tree RSS every 500 ms and appends one JSON line to the run log. */
export async function metered<T>(log: string, fields: Record<string, unknown>, fn: () => Promise<T>): Promise<T> {
  const start = systemSnapshot();
  const t0 = performance.now();
  let peak = treeRssGb();
  const timer = setInterval(() => { peak = Math.max(peak, treeRssGb()); }, 500);
  let status = 'ok';
  try {
    return await fn();
  } catch (e) {
    status = `error: ${(e as Error).message}`;
    throw e;
  } finally {
    clearInterval(timer);
    peak = Math.max(peak, treeRssGb());
    const end = systemSnapshot();
    mkdirSync(dirname(log), { recursive: true });
    appendFileSync(log, JSON.stringify({
      at: new Date().toISOString(),
      ...fields,
      wall_s: +((performance.now() - t0) / 1000).toFixed(2),
      proc_tree_peak_rss_gb: peak,
      pressure_start: start.pressure, pressure_end: end.pressure,
      swap_used_gb_start: start.swap_used_gb, swap_used_gb_end: end.swap_used_gb,
      free_pct_start: start.free_pct, docker_running: start.docker_running,
      status,
    }) + '\n');
  }
}
