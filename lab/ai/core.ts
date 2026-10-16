// Shared layer for the overnight AI image batches (AI1, IL1, …): model families, the GGUF ComfyUI workflows, the job
// list and graph filling, plus the surface a batch file exports for the runner (`node tools/ai-batch.ts --batch
// lab/<lab>/batch.ts`). A batch file defines its experiments and prompts, imports the rest from here, and may add hooks
// for lab-specific steps (scaffold inputs, picking a source image, extra gallery slides).
//
// Z-Image runs at guidance 0 (CFG 1) and klein (distilled) at guidance 1, so negative prompts do nothing: prompts
// describe emptiness and avoidance positively ("nothing written anywhere", "one flat unbroken colour").
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../src/render/server.ts';
import type { CheckResult } from '../ai1/checks.ts';

/** The workflows were built for AI1 and are shared by every batch. */
export const WORKFLOW_DIR = join(ROOT, 'lab/ai1/workflows');

export type FamilyId = 'zimage' | 'klein4b' | 'klein9b' | 'qwen';

export interface Family {
  id: FamilyId;
  name: string;
  /** calmCheck(needGb) must pass before the family starts (calm.ts adds its own 4 GB margin). */
  needGb: number;
  /** Files relative to the ComfyUI models folder. */
  files: { model: string; textEncoder: string; vae: string; lora?: string; extra?: string[] };
  licence: string;
  licenceNote?: string;
  /** Badge lab (research_notes/…/local_pipeline_learnings_and_inventory.md) and the AI1 night (same runner, --cache-none). */
  measured: string;
}

export const FAMILIES: Record<FamilyId, Family> = {
  zimage: {
    id: 'zimage', name: 'Z-Image Turbo Q8_0 GGUF', needGb: 24,
    files: { model: 'unet/z_image_turbo-Q8_0.gguf', textEncoder: 'text_encoders/qwen_3_4b.safetensors', vae: 'vae/z_image_ae.safetensors' },
    licence: 'Apache-2.0',
    measured: 'badge lab: Q8 median 80 s at ≤ 1024² (n = 27), peak 23–25 GB. AI1 runner: 1024² 8 steps 100 s (n = 16), 1088×1360 150 s (n = 20), footprint 16 GB',
  },
  klein4b: {
    id: 'klein4b', name: 'FLUX.2 klein 4B Q8_0 GGUF', needGb: 20,
    files: { model: 'unet/flux-2-klein-4b-Q8_0.gguf', textEncoder: 'text_encoders/qwen_3_4b.safetensors', vae: 'vae/flux2-vae.safetensors' },
    licence: 'Apache-2.0',
    measured: 'badge lab: t2i median 60 s (n = 178), 1-ref edit 80–125 s at 768 px, peak 17–21 GB. AI1 runner: t2i 1024² 4 steps 36 s (n = 16); 1-ref edit 1024×1280 8 steps 184 s (n = 18); footprint 17 GB',
  },
  klein9b: {
    id: 'klein9b', name: 'FLUX.2 klein 9B Q8_0 GGUF', needGb: 24,
    files: { model: 'unet/flux-2-klein-9b-Q8_0.gguf', textEncoder: 'text_encoders/Qwen3-8B-Q8_0.gguf', vae: 'vae/flux2-vae.safetensors' },
    licence: 'FLUX Non-Commercial License v2.1',
    licenceNote: 'allowed by the owner for posts (docs/decisions.md, 2026-10-13); record it per asset; not cleared for the website',
    measured: 'badge lab: t2i median 179 s (n = 13). AI1 runner: t2i 1024² 4 steps 80 s (n = 24), footprint 20 GB',
  },
  qwen: {
    id: 'qwen', name: 'Qwen-Image-Edit-2511 Q6_K GGUF + Lightning 4-step', needGb: 28,
    files: {
      model: 'unet/qwen-image-edit-2511-Q6_K.gguf', textEncoder: 'text_encoders/Qwen2.5-VL-7B-Instruct-Q8_0.gguf',
      vae: 'vae/qwen_image_vae.safetensors', lora: 'loras/Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors',
      extra: ['text_encoders/Qwen2.5-VL-7B-Instruct-mmproj-F16.gguf'],
    },
    licence: 'Apache-2.0', measured: '345–380 s (n = 2); ≈ 28 GB with one image, two images went critical',
  },
};

/** Default: one model family at a time, in this order. A batch may export its own FAMILY_ORDER. */
export const FAMILY_ORDER: FamilyId[] = ['zimage', 'klein4b', 'klein9b', 'qwen'];

export interface Workflow {
  file: string;
  /** Where each job parameter goes: [node id, input name]. width/height absent = taken from the reference image. */
  bind: Partial<Record<'prompt' | 'seed' | 'steps' | 'cfg' | 'sampler' | 'scheduler' | 'width' | 'height' | 'reference' | 'megapixels' | 'prefix', [string, string][]>>;
  template: string;
}

// Built from ComfyUI's own templates (comfyui_workflow_templates 0.11.9 in the ComfyUI venv), with the loaders
// swapped for the GGUF files on disk (fp8 does not run on MPS).
export const WORKFLOWS: Record<string, Workflow> = {
  'zimage-turbo-gguf-t2i': {
    file: 'zimage-turbo-gguf-t2i.json', template: 'image_z_image_turbo.json (Text to Image (Z-Image-Turbo))',
    bind: { prompt: [['5', 'text']], seed: [['8', 'seed']], steps: [['8', 'steps']], cfg: [['8', 'cfg']], sampler: [['8', 'sampler_name']], scheduler: [['8', 'scheduler']], width: [['7', 'width']], height: [['7', 'height']], prefix: [['10', 'filename_prefix']] },
  },
  'klein4b-gguf-t2i': {
    file: 'klein4b-gguf-t2i.json', template: 'image_flux2_klein_text_to_image.json (Flux.2 Klein 4B Distilled)',
    bind: { prompt: [['4', 'text']], seed: [['9', 'noise_seed']], steps: [['8', 'steps']], cfg: [['6', 'cfg']], sampler: [['7', 'sampler_name']], width: [['8', 'width'], ['10', 'width']], height: [['8', 'height'], ['10', 'height']], prefix: [['13', 'filename_prefix']] },
  },
  'klein9b-gguf-t2i': {
    file: 'klein9b-gguf-t2i.json', template: 'image_flux2_text_to_image_9b.json, distilled settings (cfg 1, 4 steps)',
    bind: { prompt: [['4', 'text']], seed: [['9', 'noise_seed']], steps: [['8', 'steps']], cfg: [['6', 'cfg']], sampler: [['7', 'sampler_name']], width: [['8', 'width'], ['10', 'width']], height: [['8', 'height'], ['10', 'height']], prefix: [['13', 'filename_prefix']] },
  },
  'klein4b-gguf-edit1': {
    file: 'klein4b-gguf-edit1.json', template: 'image_flux2_klein_image_edit_4b_distilled.json (Image Edit, 1 reference)',
    bind: { prompt: [['4', 'text']], seed: [['9', 'noise_seed']], steps: [['8', 'steps']], cfg: [['6', 'cfg']], sampler: [['7', 'sampler_name']], reference: [['20', 'image']], megapixels: [['21', 'megapixels']], prefix: [['13', 'filename_prefix']] },
  },
  'qwen-edit-2511-gguf-lightning': {
    file: 'qwen-edit-2511-gguf-lightning.json', template: 'image_qwen_image_edit_2511.json (Lightning branch; FluxKontextImageScale dropped so the 1024×1280 slots stay put)',
    bind: { prompt: [['8', 'prompt']], seed: [['13', 'seed']], steps: [['13', 'steps']], cfg: [['13', 'cfg']], sampler: [['13', 'sampler_name']], scheduler: [['13', 'scheduler']], reference: [['7', 'image']], prefix: [['15', 'filename_prefix']] },
  },
};

/** Fractions of the image: where code will set the type, so it must stay flat. */
export interface Zone { x0: number; y0: number; x1: number; y1: number }

export interface PromptDef { id: string; title: string; use: string; text: string; zone?: Zone; reference?: string }

export type CheckKind = 'zone' | 'palette' | 'seam' | 'spot' | 'slots';

export interface Experiment {
  /** A capital letter and a number (the gallery reads content/labs/<LAB>/<id>/manifest.json for ids like E1, I3). */
  id: string;
  /** Several runs of one experiment on different models (e.g. E3 on klein 9B and the 4B control). */
  variant?: string;
  /** How the gallery names the variant ("klein 9B"); defaults to the variant id. */
  variantLabel?: string;
  name: string;
  idea: string;
  family: FamilyId;
  workflow: keyof typeof WORKFLOWS;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  sampler: string;
  scheduler: string;
  seeds: number[];
  prompts: PromptDef[];
  /** Core experiments run first; non-core ones are the first to drop when time runs short. */
  core: boolean;
  /** Seconds per image, the planning estimate until this run measures its own. */
  estS: number;
  checks: CheckKind[];
  pass: string;
}

export interface Job {
  /** Unique within the experiment, e.g. "museum-wall-s101", "9b-owl-s301". */
  id: string;
  exp: string;
  variant?: string;
  family: FamilyId;
  workflow: string;
  modelFile: string;
  textEncoder: string;
  vae: string;
  lora?: string;
  licence: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  sampler: string;
  scheduler: string;
  seed: number;
  promptId: string;
  promptTitle: string;
  use: string;
  prompt: string;
  promptSha: string;
  /** A name the batch's hooks resolve to an input image (a scaffold, or "auto:…" picked during the night). */
  reference?: string;
  zone?: Zone;
  core: boolean;
  estS: number;
  checks: CheckKind[];
}

export const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const base = (p: string) => p.split('/').pop()!;

/** Jobs grouped by model family (in `familyOrder`), then experiments (in `expOrder` if given, else spec order),
 * then prompts × seeds. */
export function buildJobs(experiments: Experiment[], familyOrder: FamilyId[], expOrder?: string[]): Job[] {
  const out: Job[] = [];
  const rank = (e: Experiment) => (expOrder ? expOrder.indexOf(e.id) : 0);
  for (const fam of familyOrder) {
    for (const e of experiments.filter(x => x.family === fam).sort((a, b) => rank(a) - rank(b))) {
      const f = FAMILIES[e.family];
      for (const p of e.prompts) for (const seed of e.seeds) {
        out.push({
          id: `${e.variant ? e.variant + '-' : ''}${p.id}-s${seed}`, exp: e.id, variant: e.variant, family: e.family,
          workflow: e.workflow, modelFile: base(f.files.model), textEncoder: base(f.files.textEncoder), vae: base(f.files.vae),
          lora: f.files.lora ? base(f.files.lora) : undefined, licence: f.licence,
          width: e.width, height: e.height, steps: e.steps, cfg: e.cfg, sampler: e.sampler, scheduler: e.scheduler, seed,
          promptId: p.id, promptTitle: p.title, use: p.use, prompt: p.text, promptSha: sha256(p.text),
          reference: p.reference, zone: p.zone, core: e.core, estS: e.estS, checks: e.checks,
        });
      }
    }
  }
  return out;
}

export function loadWorkflow(name: string): { graph: Record<string, { class_type: string; inputs: Record<string, unknown>; _meta?: unknown }>; sha: string } {
  const raw = readFileSync(join(WORKFLOW_DIR, WORKFLOWS[name].file), 'utf8');
  return { graph: JSON.parse(raw), sha: sha256(raw) };
}

/** The workflow with this job's parameters filled in. `referenceName` is the uploaded input file name; ComfyUI saves
 * its own copy under output/<prefixRoot>/<exp>/<job>. */
export function fillWorkflow(job: Job, referenceName: string | undefined, prefixRoot: string) {
  const wf = WORKFLOWS[job.workflow];
  const { graph, sha } = loadWorkflow(job.workflow);
  const values: Record<string, unknown> = {
    prompt: job.prompt, seed: job.seed, steps: job.steps, cfg: job.cfg, sampler: job.sampler, width: job.width, height: job.height,
    scheduler: job.scheduler, reference: referenceName, megapixels: +(job.width * job.height / 1048576).toFixed(4),
    prefix: `${prefixRoot}/${job.exp}/${job.id}`,
  };
  for (const [key, targets] of Object.entries(wf.bind)) {
    for (const [node, input] of targets!) {
      if (!graph[node] || !(input in graph[node].inputs)) throw new Error(`${job.workflow}: binding ${key} → ${node}.${input} not in the graph`);
      if (values[key] === undefined) throw new Error(`${job.id}: no value for ${key}`);
      graph[node].inputs[input] = values[key];
    }
  }
  return { graph, workflowSha: sha, graphSha: sha256(JSON.stringify(graph)) };
}

/** Files each family needs, relative to the models folder. */
export const familyFiles = (f: Family) => [f.files.model, f.files.textEncoder, f.files.vae, ...(f.files.lora ? [f.files.lora] : []), ...(f.files.extra ?? [])];

// ------------------------------------------------------------------ what tools/ai-batch.ts needs from a batch file

export type Slot = { id: string; kind: string; gen: { x: number; y: number; w: number; h: number } };

/** What the runner lends the hooks. */
export interface RunnerCtx {
  isDone(j: Job): boolean;
  pngOf(j: Job): string;
  checksFor(j: Job, slots?: Slot[]): Promise<CheckResult>;
  /** A value kept in the run's state.json (e.g. the source image a later experiment was given). */
  pick(key: string, value?: string): string | undefined;
  log(msg: string): void;
}

export interface BatchHooks {
  /** Render cheap inputs (scaffolds) if they are missing. Called before a run and before --validate. */
  prepare?(): Promise<void>;
  /** The input image for a job's `reference`; undefined skips the job. */
  referenceFile?(j: Job, ctx: RunnerCtx): Promise<string | undefined> | string | undefined;
  /** --validate: a file that stands in for the reference (nothing has been generated yet). */
  validationReference?(j: Job): string | undefined;
  /** Asked before a family starts; a reason skips the family (e.g. its source images do not exist). */
  familyBlocked?(f: FamilyId, ctx: RunnerCtx): Promise<string | undefined>;
  /** Rectangles the 'slots' check measures. */
  slotsFor?(j: Job): Slot[] | undefined;
  /** The first slide of a gallery row: the job's input (scaffold or source image). */
  inputSlide?(j: Job, sidecar: Record<string, any>): { id: string; file: string; note: string } | undefined;
  /** Extra lines for SUMMARY.md and --dry-run. */
  summaryNotes?(ctx: RunnerCtx): string[];
  dryRunNotes?(): string[];
}

export interface BatchModule {
  LAB_ID: string;
  OUT_DIR: string;
  FAMILIES: Record<FamilyId, Family>;
  FAMILY_ORDER: FamilyId[];
  WORKFLOWS: Record<string, Workflow>;
  EXPERIMENTS: Experiment[];
  jobs(): Job[];
  fillWorkflow(job: Job, referenceName?: string): ReturnType<typeof fillWorkflow>;
  familyFiles(f: Family): string[];
  sha256(s: string | Buffer): string;
  /** One line for the dry run and the plist comment. */
  TITLE?: string;
  /** launchd label; default cz.myspeedpuzzling.instagram.<lab id in lower case>. */
  LABEL?: string;
  /** Families that run only after every other family had its turn, and only if they can finish before the deadline. */
  LAST_FAMILIES?: FamilyId[];
  hooks?: BatchHooks;
}
