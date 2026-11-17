// Finishes a rendered motion video with its sound: an approved music bed fitted to the video's cues (drop on the key
// moment / natural ending on the last frame), reactive sound effects, the MSP signature, −14 LUFS, QA.
// Design: docs/ideas/sound-pipeline.md. Light job (CPU, ~10–20 s); no model runs here (beds are made in labs).
//
//   node tools/sound.ts <video.mp4> --series weekly [--sfx recap|comic|none] [--hold 2] [--bed <file.flac>] [--signature <id>]
//
// Library: content/sound/library.json (gitignored; approved beds per series, filled from the MU labs):
//   { "series": { "weekly": { "beds": ["content/labs/MU2/…flac", …], "sfx": "recap", "hold": 2, "signature": "S1-fall-5321" } },
//     "used": { "weekly": ["…last bed…"] } }
// Picks the next bed in rotation (never the one used last for that series), writes <video>-sound.mp4 + .fit.json
// (bed, prompt provenance via the lab's clips.json, QA) and records the pick.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT } from '../src/render/server.ts';

const { values: o, positionals } = parseArgs({ allowPositionals: true, options: {
  series: { type: 'string' }, sfx: { type: 'string' }, hold: { type: 'string' }, bed: { type: 'string' }, signature: { type: 'string' },
} });
const video = positionals[0];
if (!video || !existsSync(video)) { console.error('usage: node tools/sound.ts <video.mp4> --series <name> [--sfx recap|comic|none] [--hold s] [--bed f] [--signature id]'); process.exit(2); }
const cues = video.replace(/\.mp4$/, '.cues.json');
if (!existsSync(cues)) { console.error(`no ${cues}: render (or --qa-only) the motion first, it writes the cues`); process.exit(2); }

const LIB = join(ROOT, 'content/sound/library.json');
type Series = { beds: string[]; sfx?: string; hold?: number; signature?: string };
const lib: { series: Record<string, Series>; used?: Record<string, string[]> } = existsSync(LIB) ? JSON.parse(readFileSync(LIB, 'utf8')) : { series: {} };
const ser = o.series ? lib.series[o.series] : undefined;
if (!o.bed && !ser?.beds?.length) { console.error(`no approved beds for series "${o.series}" in ${LIB} (or pass --bed)`); process.exit(2); }

// bed: explicit, or the next in rotation (skip the last used)
let bed = o.bed;
if (!bed) {
  const used = lib.used?.[o.series!] ?? [];
  const order = ser!.beds.filter(b => b !== used.at(-1));
  bed = order.find(b => !used.includes(b)) ?? order[0];
}
const sfx = o.sfx ?? ser?.sfx ?? 'recap', hold = Number(o.hold ?? ser?.hold ?? 0);
const out = video.replace(/\.mp4$/, '-sound.mp4');
const py = ['uvx', '-q', '--with', 'librosa', '--with', 'soundfile', 'python'];
const args = [join(ROOT, 'lab/music/fit.py'), join(ROOT, bed!), video, out, '--cues', cues, '--hold', String(hold)];
const sig = o.signature ?? ser?.signature;
if (sig) args.push('--signature', sig);
if (sfx !== 'none') {
  const plan = out.replace(/\.mp4$/, '.sfx.json');
  execFileSync('python3', [join(ROOT, 'lab/sfx/plan.py'), cues, join(ROOT, 'content/labs/FX1/kit'), plan, '--style', sfx], { stdio: 'inherit' });
  args.push('--sfx', plan);
}
const res = JSON.parse(execFileSync(py[0], [...py.slice(1), ...args], { encoding: 'utf8' }).trim().split('\n').at(-1)!);
if (o.series) {
  lib.used = lib.used ?? {};
  lib.used[o.series] = [...(lib.used[o.series] ?? []), bed!].slice(-12);
  writeFileSync(LIB, JSON.stringify(lib, null, 1));
}
console.log(`${out}\n  bed ${bed} · ${res.mode} · ${res.lufs} LUFS · TP ${res.true_peak_db} · QA ${Array.isArray(res.qa) ? res.qa.join('; ') : res.qa}`);
if (Array.isArray(res.qa)) process.exit(1);
