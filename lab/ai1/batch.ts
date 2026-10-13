// AI image lab, batch AI1: the spec of docs/ideas/brainstorm-2026-10.md §5 (E1–E5) as data.
// Prompts follow §3 (AI-1 … AI-6): AI paints only the stage (rooms, skies, water, materials, stylised animals);
// no text, no puzzle art, no people or hands, and a flat empty zone where code sets the type.
// Z-Image runs at guidance 0 (CFG 1) and klein at guidance 1, so negative prompts do nothing: the prompts
// describe emptiness positively instead.
//
//   node lab/ai1/batch.ts            # print the job list (no ComfyUI needed)
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../src/render/server.ts';

export const LAB_ID = 'AI1';
export const OUT_DIR = join(ROOT, 'content/labs', LAB_ID);
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
  /** Measured on this Mac in the badge lab (research_notes/…/local_pipeline_learnings_and_inventory.md). */
  measured: string;
}

export const FAMILIES: Record<FamilyId, Family> = {
  zimage: {
    id: 'zimage', name: 'Z-Image Turbo Q8_0 GGUF', needGb: 24,
    files: { model: 'unet/z_image_turbo-Q8_0.gguf', textEncoder: 'text_encoders/qwen_3_4b.safetensors', vae: 'vae/z_image_ae.safetensors' },
    licence: 'Apache-2.0', measured: 'Q8 1024² median 80 s (n = 27); peak 23–25 GB',
  },
  klein4b: {
    id: 'klein4b', name: 'FLUX.2 klein 4B Q8_0 GGUF', needGb: 20,
    files: { model: 'unet/flux-2-klein-4b-Q8_0.gguf', textEncoder: 'text_encoders/qwen_3_4b.safetensors', vae: 'vae/flux2-vae.safetensors' },
    licence: 'Apache-2.0', measured: 't2i median 60 s (n = 178); 1-ref edit 80–125 s at 768 px; peak 17–21 GB',
  },
  klein9b: {
    id: 'klein9b', name: 'FLUX.2 klein 9B Q8_0 GGUF', needGb: 24,
    files: { model: 'unet/flux-2-klein-9b-Q8_0.gguf', textEncoder: 'text_encoders/Qwen3-8B-Q8_0.gguf', vae: 'vae/flux2-vae.safetensors' },
    licence: 'FLUX Non-Commercial License v2.1',
    licenceNote: 'allowed by the owner for posts (docs/decisions.md, 2026-10-13); record it per asset',
    measured: 't2i median 179 s (n = 13); peak unmeasured, plan for ≈ 24 GB',
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

/** One model family at a time, in this order. */
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

export interface Experiment {
  id: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
  /** Several runs of one experiment on different models (E3: klein 9B and the 4B control). */
  variant?: string;
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
  /** Core experiments run first; E2 and E5 are the first to drop when time runs short (§5). */
  core: boolean;
  /** Seconds per image, the planning estimate until this run measures its own. */
  estS: number;
  checks: Array<'zone' | 'palette' | 'seam' | 'spot' | 'slots'>;
  pass: string;
}

const NOTHING = 'nothing written anywhere';

// AI-3: the app's "semi-flat outlined" prefix, minus the speed-dash sentence and the puzzle paragraph.
const HOUSE = 'Semi-flat line illustration with soft colour fills, the style of a modern app onboarding illustration. ' +
  'Every shape has the same dark navy outline (#2b3445, about 2 px, rounded caps). Soft pastel fills with a very gentle ' +
  'watercolour-like gradient inside the outlines. Coral (#EC726F) on about a third of the shapes, sky blue (#69b3fe) ' +
  'secondary, lavender (#4e54c8) on shadow sides. Rounded, friendly geometry. Subject: ';
const HOUSE_END = ', centred, full body, plenty of empty white space around it, nothing else in the picture. Pure white background, no ground, no frame.';

const ANIMALS: Array<[string, string, string]> = [
  ['owl', 'Owl', 'a round, friendly owl sitting upright and facing the viewer, wings folded, big calm eyes, coral belly, sky-blue wings'],
  ['lark', 'Lark', 'a small, round, friendly skylark perched upright and facing the viewer, wings folded, a little crest on its head, coral breast, sky-blue wings'],
  ['hare', 'Hare', 'a friendly hare sitting upright and facing the viewer, long ears raised, calm eyes, coral inner ears and belly, sky-blue back'],
  ['tortoise', 'Tortoise', 'a round, friendly tortoise standing and facing the viewer, head slightly raised, calm eyes, coral shell plates with a sky-blue rim'],
  ['magpie', 'Magpie', 'a friendly magpie perched upright and facing the viewer, wings folded, long tail, lavender wings and head, white chest, a coral patch on its breast'],
  ['parrot', 'Parrot', 'a friendly parrot perched upright and facing the viewer, wings folded, coral head and body, sky-blue wings, calm eyes'],
  ['bat', 'Bat', 'a small, round, friendly bat sitting upright and facing the viewer, wings folded around its body, lavender wings, coral belly, big calm eyes'],
  ['swallow', 'Swallow', 'a small, friendly swallow perched upright and facing the viewer, wings folded, forked tail, sky-blue back, coral throat, white belly'],
];
const animals: PromptDef[] = ANIMALS.map(([id, title, subject]) => ({ id, title, use: 'H1 spirit animals; A1, C1 spot art', text: HOUSE + subject + HOUSE_END }));

const SHELF = 'Turn this layout into a tall, dark wooden bookshelf in a cosy room at night. Keep every shelf board and every ' +
  'empty grey slot exactly where it is, the slots stay as plain dark empty spaces. ';
const SHELF_END = ' The wall above the shelf stays plain and dark, nobody in the room, ' + NOTHING + ', painterly but simple, matte, fine grain.';
const ROOM = 'Turn this layout into a quiet, empty modern museum gallery room seen straight on. The light grey area becomes a ' +
  'warm off-white plaster wall and the bottom band becomes a pale oak floor. Keep the large dark rectangle exactly where it is ' +
  'as a plain, dark, empty recessed frame space, and the small dark rectangle below it as a blank dark plaque. ';
const ROOM_END = ' The wall stays bare, no furniture, nobody in the room, ' + NOTHING + ', calm editorial architecture photograph, matte, low contrast.';

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'E1', name: 'Series plates', idea: 'Reusable stage plates for the Museum (A3), the 300M ocean (D3/I6), Advent/Wrapped (D8/D9) and the Weather joke (G4). The dashed type zone must stay flat.',
    family: 'zimage', workflow: 'zimage-turbo-gguf-t2i', width: 1088, height: 1360, steps: 8, cfg: 1, sampler: 'res_multistep', scheduler: 'simple',
    seeds: [101, 102, 103, 104, 105], core: true, estS: 200, checks: ['zone', 'palette'],
    pass: 'no glyphs; type zone luma σ ≤ 10 after a 9 px blur; mean ΔE2000 ≤ 10 after the brand-LUT snap; nothing reads as a puzzle, person or landmark; ≥ 2 of 5 per prompt the owner would post',
    prompts: [
      {
        id: 'museum-wall', title: 'Museum wall', use: 'A3 Museum of Most-Solved', zone: { x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.4 },
        text: 'Interior of a quiet, empty modern museum gallery, one long warm off-white plaster wall seen straight on at eye level, ' +
          'soft daylight falling from a skylight above and fading down the wall, a pale oak floor along the bottom fifth of the image, ' +
          `the wall completely bare, no furniture, nobody in the room, ${NOTHING}, calm editorial architecture photograph, matte, low contrast, 50 mm lens.`,
      },
      {
        id: 'night-ocean', title: 'Night ocean', use: 'D3 300M = London to New York; I6', zone: { x0: 0.1, y0: 0.62, x1: 0.9, y1: 0.92 },
        text: 'Seen from very high above the open North Atlantic at night, endless calm deep-navy water with a soft silver moonlight ' +
          'sheen across the middle, faint long swells, a thin warm band of dawn light along the very top edge, nothing but water and sky, ' +
          `no land, no ships, ${NOTHING}, matte, subtle film grain, quiet and vast.`,
      },
      {
        id: 'winter-window', title: 'Winter window', use: 'D8 Advent, D9 Wrapped', zone: { x0: 0.04, y0: 0.1, x1: 0.42, y1: 0.9 },
        text: 'A tall old wooden window seen from inside a dim cosy room at dusk, soft snow falling outside over a blurred deep-blue ' +
          'evening, the window sill bare and wide, warm faint lamplight from the lower right, large plain dark wall area on the left half, ' +
          `nobody in the room, ${NOTHING}, quiet and minimal, painterly matte finish, fine grain.`,
      },
      {
        id: 'spring-sky', title: 'Soft spring sky', use: 'G4 puzzle forecast (sunny)', zone: { x0: 0.08, y0: 0.06, x1: 0.92, y1: 0.5 },
        text: 'A soft, pale spring morning sky seen from a quiet meadow, the upper two thirds an empty, smooth gradient from light ' +
          'sky blue to soft white, a few thin wispy clouds low near the horizon, a low line of fresh green grass along the very bottom ' +
          `edge, gentle diffuse light, no trees, no buildings, no birds, no sun disc, ${NOTHING}, matte, fine film grain, calm and airy.`,
      },
    ],
  },
  {
    id: 'E2', name: 'Material plates', idea: 'Felt mat, kraft cardboard, cork and vellum paper for Puzzle Mat backgrounds (D6), the Atlas series (B1–B3) and Stories. Each candidate is followed by its offset tile.',
    family: 'zimage', workflow: 'zimage-turbo-gguf-t2i', width: 1024, height: 1024, steps: 8, cfg: 1, sampler: 'res_multistep', scheduler: 'simple',
    seeds: [201, 202, 203, 204], core: false, estS: 130, checks: ['seam', 'palette'],
    pass: 'seamless after the code offset-tile test; no objects or edges; wins a blind phone A/B against the seeded CPU grain for ≥ 2 materials',
    prompts: [
      {
        id: 'felt', title: 'Navy felt mat', use: 'D6 Puzzle Mat',
        text: 'Top-down macro photograph of a deep navy-blue felt puzzle mat filling the entire frame, even soft light, fine visible fibres, completely bare surface, no edges or seams visible.',
      },
      {
        id: 'kraft', title: 'Kraft cardboard', use: 'D6, Stories',
        text: 'Top-down macro photograph of plain brown kraft cardboard filling the entire frame, even soft light, fine visible paper fibres and subtle flecks, completely bare surface, no folds, no print, no edges or seams visible.',
      },
      {
        id: 'cork', title: 'Cork board', use: 'D6, Stories',
        text: 'Top-down macro photograph of a plain natural cork board filling the entire frame, even soft light, fine granular cork texture in warm tan tones, completely bare surface, no pins, no frame, no edges or seams visible.',
      },
      {
        id: 'vellum', title: 'Vellum paper', use: 'Atlas B1–B3 base',
        text: `Top-down macro photograph of a sheet of pale, slightly translucent vellum drafting paper filling the entire frame, even soft light, very fine fibres, a faint cool blue-grey tint, completely blank surface, ${NOTHING}, no folds, no edges visible.`,
      },
    ],
  },
  {
    id: 'E3', variant: '4b', name: 'Spirit animals', idea: 'House-style spot animals (H1, A1, C1): klein 4B (Apache-2.0) as the cheap control and klein 9B (non-commercial, allowed) as the candidate. Code adds the stats, the name and a generator piece.',
    family: 'klein4b', workflow: 'klein4b-gguf-t2i', width: 1024, height: 1024, steps: 4, cfg: 1, sampler: 'euler', scheduler: 'Flux2Scheduler',
    seeds: [301, 302], core: true, estS: 70, checks: ['spot'],
    pass: 'navy outline on every shape (line weight 2.5–3.3 % of width, measured in code); coral on 30–40 % of the filled area; no speed dashes, pieces, text or props; closed outline (clean flood-fill cutout); ≥ 6 of 8 animals from one model look like one set',
    prompts: animals,
  },
  {
    id: 'E4', name: 'Scaffold → scene', idea: 'Code renders a flat grey scaffold with the box slots at their final pixel positions; klein turns it into a lit scene; code then drops the real boxes into the known slots. First image of each row is the scaffold.',
    family: 'klein4b', workflow: 'klein4b-gguf-edit1', width: 1024, height: 1280, steps: 8, cfg: 1, sampler: 'euler', scheduler: 'Flux2Scheduler',
    seeds: [401, 402, 403], core: true, estS: 160, checks: ['slots', 'palette'],
    pass: 'slot rectangles within ±4 px of the scaffold (IoU ≥ 0.98); protected-pixel diff 0 after composite-back; reads as a lit room, not glossy AI; ≥ 1 shelf and 1 room the owner would post',
    prompts: [
      { id: 'shelf-moonlight', title: 'Shelf · moonlight', use: 'G1 Shelf of fear', reference: 'shelf', text: SHELF + 'Cold moonlight falling from a window on the left, deep navy and indigo shadows, a few cobwebs in the top corners.' + SHELF_END },
      { id: 'shelf-candle', title: 'Shelf · candle', use: 'G1 Shelf of fear', reference: 'shelf', text: SHELF + 'One warm candle glow at the bottom right as the only light, soft orange light fading into deep navy and indigo shadows, a few cobwebs in the top corners.' + SHELF_END },
      { id: 'shelf-dusk', title: 'Shelf · dusk', use: 'G1 Shelf of fear', reference: 'shelf', text: SHELF + 'Deep blue dusk light through a window on the left, a faint warm glow along the floor, indigo shadows, a few cobwebs in the top corners.' + SHELF_END },
      { id: 'room-moonlight', title: 'Room · moonlight', use: 'A3 Museum of Most-Solved', reference: 'room', text: ROOM + 'Cool moonlight falling from a skylight above at night, soft blue shadows.' + ROOM_END },
      { id: 'room-candle', title: 'Room · warm lamp', use: 'A3 Museum of Most-Solved', reference: 'room', text: ROOM + 'A warm, low, candle-like glow from a small picture light above the frame, the rest of the room in soft shadow.' + ROOM_END },
      { id: 'room-dusk', title: 'Room · dusk', use: 'A3 Museum of Most-Solved', reference: 'room', text: ROOM + 'Blue dusk daylight from a skylight above, fading softly down the wall.' + ROOM_END },
    ],
  },
  {
    id: 'E3', variant: '9b', name: 'Spirit animals', idea: '',
    family: 'klein9b', workflow: 'klein9b-gguf-t2i', width: 1024, height: 1024, steps: 4, cfg: 1, sampler: 'euler', scheduler: 'Flux2Scheduler',
    seeds: [301, 302, 303], core: true, estS: 190, checks: ['spot'], pass: '', prompts: animals,
  },
  {
    id: 'E5', name: 'Relight (optional)', idea: 'Hero polish for the best E4 shelf with Qwen-Image-Edit-2511. Runs only if the calm check passes at 28 GB. The source shelf is picked by code (best slot fit), not by taste. First image is the source.',
    family: 'qwen', workflow: 'qwen-edit-2511-gguf-lightning', width: 1024, height: 1280, steps: 4, cfg: 1, sampler: 'euler', scheduler: 'simple',
    seeds: [501], core: false, estS: 380, checks: ['slots', 'palette'],
    pass: 'slot IoU ≥ 0.98 kept; clearly better light than E4 in an owner A/B, otherwise Qwen stays out of the toolkit',
    prompts: [
      { id: 'relight-candle', title: 'Relight · candle', use: 'G1 hero', reference: 'auto:E4-shelf', text: `Relight this scene with one warm candle glow from the bottom right as the main light, soft orange light falling off into deep navy shadows. Keep every shelf board and every dark empty slot exactly where it is and as plain dark empty spaces. Add nothing, ${NOTHING}, matte, fine grain.` },
      { id: 'relight-moonlight', title: 'Relight · moonlight', use: 'G1 hero', reference: 'auto:E4-shelf', text: `Relight this scene with cold silver moonlight falling from a window on the left, crisp soft-edged shadows, deep indigo darkness. Keep every shelf board and every dark empty slot exactly where it is and as plain dark empty spaces. Add nothing, ${NOTHING}, matte, fine grain.` },
      { id: 'relight-dusk', title: 'Relight · dusk', use: 'G1 hero', reference: 'auto:E4-shelf', text: `Relight this scene with deep blue dusk light from the left and a faint warm glow along the floor. Keep every shelf board and every dark empty slot exactly where it is and as plain dark empty spaces. Add nothing, ${NOTHING}, matte, fine grain.` },
    ],
  },
];

export interface Job {
  /** Unique within the experiment, e.g. "museum-wall-s101", "9b-owl-s301". */
  id: string;
  exp: Experiment['id'];
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
  /** Scaffold name ("shelf", "room") or "auto:E4-shelf" (picked after E4 by slot fit). */
  reference?: string;
  zone?: Zone;
  core: boolean;
  estS: number;
  checks: Experiment['checks'];
}

export const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const base = (p: string) => p.split('/').pop()!;

export function jobs(): Job[] {
  const out: Job[] = [];
  // Within klein 4B, E4 (needed for G1 on 31 Oct) goes before the E3 control.
  const order = ['E1', 'E2', 'E4', 'E3', 'E5'];
  for (const fam of FAMILY_ORDER) {
    for (const e of EXPERIMENTS.filter(x => x.family === fam).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))) {
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

/** The workflow with this job's parameters filled in. `referenceName` is the uploaded input file name. */
export function fillWorkflow(job: Job, referenceName?: string) {
  const wf = WORKFLOWS[job.workflow];
  const { graph, sha } = loadWorkflow(job.workflow);
  const values: Record<string, unknown> = {
    prompt: job.prompt, seed: job.seed, steps: job.steps, cfg: job.cfg, sampler: job.sampler, width: job.width, height: job.height,
    scheduler: job.scheduler, reference: referenceName, megapixels: +(job.width * job.height / 1048576).toFixed(4),
    prefix: `msp-ai1/${job.exp}/${job.id}`,
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

if (import.meta.main) {
  const all = jobs();
  for (const fam of FAMILY_ORDER) {
    const js = all.filter(j => j.family === fam);
    const est = js.reduce((s, j) => s + j.estS, 0);
    console.log(`${FAMILIES[fam].name} (${FAMILIES[fam].licence}, need ${FAMILIES[fam].needGb} GB): ${js.length} images, ≈ ${Math.round(est / 60)} min`);
    for (const e of [...new Set(js.map(j => j.exp + (j.variant ? '/' + j.variant : '')))]) console.log(`  ${e}: ${js.filter(j => j.exp + (j.variant ? '/' + j.variant : '') === e).length}`);
  }
  console.log(`total ${all.length} images`);
}
