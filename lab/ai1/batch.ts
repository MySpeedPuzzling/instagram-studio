// AI image lab, batch AI1: the spec of docs/ideas/brainstorm-2026-10.md §5 (E1–E5) as data.
// Prompts follow §3 (AI-1 … AI-6): AI paints only the stage (rooms, skies, water, materials, stylised animals);
// no text, no puzzle art, no people or hands, and a flat empty zone where code sets the type.
// Z-Image runs at guidance 0 (CFG 1) and klein at guidance 1, so negative prompts do nothing: the prompts
// describe emptiness positively instead. Families, workflows and job building live in lab/ai/core.ts.
//
//   node lab/ai1/batch.ts            # print the job list (no ComfyUI needed)
//   node tools/ai-batch.ts [--batch lab/ai1/batch.ts] --dry-run   # the runner (AI1 is its default batch)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../src/render/server.ts';
import {
  FAMILIES, FAMILY_ORDER, WORKFLOWS, buildJobs, familyFiles, fillWorkflow as fillCore, sha256,
  type BatchHooks, type Experiment, type Job, type PromptDef, type RunnerCtx, type Slot,
} from '../ai/core.ts';

export { FAMILIES, FAMILY_ORDER, WORKFLOWS, familyFiles, sha256 };
export type { Experiment, FamilyId, Family, Job, PromptDef, Workflow, Zone } from '../ai/core.ts';
export { WORKFLOW_DIR, loadWorkflow } from '../ai/core.ts';

/** AI_LAB_ID only for the runner's dry tests against a mock ComfyUI (keeps them out of content/labs/AI1). */
export const LAB_ID = process.env.AI_LAB_ID ?? 'AI1';
export const OUT_DIR = join(ROOT, 'content/labs', LAB_ID);
export const TITLE = 'AI1 overnight image batch (series plates, materials, spirit animals, scaffold → scene, relight)';
export const LABEL = 'cz.myspeedpuzzling.instagram.ai1';
/** Qwen (E5, optional) runs only after everything else and only if it can finish before the deadline. */
export const LAST_FAMILIES = ['qwen' as const];

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
    id: 'E3', variant: '4b', variantLabel: 'klein 4B', name: 'Spirit animals', idea: 'House-style spot animals (H1, A1, C1): klein 4B (Apache-2.0) as the cheap control and klein 9B (non-commercial, allowed) as the candidate. Code adds the stats, the name and a generator piece.',
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
    id: 'E3', variant: '9b', variantLabel: 'klein 9B', name: 'Spirit animals', idea: '',
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

/** Within klein 4B, E4 (needed for G1 on 31 Oct) goes before the E3 control. */
export const jobs = (): Job[] => buildJobs(EXPERIMENTS, FAMILY_ORDER, ['E1', 'E2', 'E4', 'E3', 'E5']);

/** The workflow with this job's parameters filled in. `referenceName` is the uploaded input file name. */
export const fillWorkflow = (job: Job, referenceName?: string) => fillCore(job, referenceName, 'msp-ai1');

// ------------------------------------------------------------------ hooks: E4 scaffolds and the E5 source pick

/** lab/ai1/scaffolds.ts writes here (imported lazily: it imports OUT_DIR from this file). */
export const SCAFFOLD_DIR = join(OUT_DIR, 'scaffolds');
const STATIC_REFS = ['shelf', 'room'];
const scaffoldPng = (name: string) => join(SCAFFOLD_DIR, `${name}.png`);
const scaffoldSlots = (name: string): Slot[] | undefined => {
  try { return JSON.parse(readFileSync(join(SCAFFOLD_DIR, `${name}.json`), 'utf8')).slots; } catch { return undefined; }
};

export const hooks: BatchHooks = {
  async prepare() {
    if (!STATIC_REFS.every(n => existsSync(scaffoldPng(n)))) {
      const { renderScaffolds } = await import('./scaffolds.ts');
      await renderScaffolds();
    }
  },
  referenceFile(j, ctx) {
    if (!j.reference) return undefined;
    if (j.reference.startsWith('auto:')) return pickE4Shelf(ctx);
    return existsSync(scaffoldPng(j.reference)) ? scaffoldPng(j.reference) : undefined;
  },
  validationReference: j => scaffoldPng(j.reference?.startsWith('auto:') ? 'shelf' : j.reference!),
  async familyBlocked(f, ctx) {
    if (f === 'qwen' && !(await pickE4Shelf(ctx))) return 'no E4 shelf to relight';
    return undefined;
  },
  slotsFor: j => (j.reference?.startsWith('auto:') || j.reference === 'shelf' ? scaffoldSlots('shelf') : j.reference === 'room' ? scaffoldSlots('room') : undefined),
  inputSlide(j, side) {
    if (j.reference && STATIC_REFS.includes(j.reference)) return { id: 'scaffold', file: scaffoldPng(j.reference), note: 'the code scaffold (input)' };
    if (j.reference?.startsWith('auto:') && side.reference) return { id: 'source', file: join(ROOT, side.reference), note: `source ${String(side.reference).split('/').slice(-2).join('/')} (best E4 slot fit)` };
    return undefined;
  },
  summaryNotes(ctx) {
    const src = ctx.pick('e5_source');
    return src ? [`E5 relit ${src.split('/').slice(-2).join('/')} (the E4 shelf with the best slot fit).`] : [];
  },
  dryRunNotes: () => [`scaffolds: ${STATIC_REFS.map(n => `${n} ${existsSync(scaffoldPng(n)) ? 'ok' : 'missing (rendered at start)'}`).join(', ')}`],
};

/** E5 relights the E4 shelf whose slots stayed closest to the code rectangles (picked by code, not taste). */
async function pickE4Shelf(ctx: RunnerCtx): Promise<string | undefined> {
  const kept = ctx.pick('e5_source');
  if (kept && existsSync(kept)) return kept;
  const shelf = scaffoldSlots('shelf');
  let best: { file: string; key: number[] } | undefined;
  for (const j of jobs().filter(x => x.exp === 'E4' && x.reference === 'shelf' && ctx.isDone(x))) {
    const c = await ctx.checksFor(j, shelf);
    const m = c.metrics as { slot_min_iou?: number; slot_max_offset_px?: number; palette_de2000_snapped?: number };
    // Best = highest min IoU, then smallest offset, then closest to the brand palette.
    const key = [-(m.slot_min_iou ?? 0), m.slot_max_offset_px ?? 99, m.palette_de2000_snapped ?? 99];
    const better = (a: number[], b: number[]) => { const i = a.findIndex((v, k) => v !== b[k]); return i >= 0 && a[i] < b[i]; };
    if (!best || better(key, best.key)) best = { file: ctx.pngOf(j), key };
  }
  if (best) ctx.pick('e5_source', best.file);
  return best?.file;
}

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
