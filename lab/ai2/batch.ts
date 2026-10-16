// Illustration lab IL1 (docs/design/house-brief.md, "Illustration lab"; plan in lab/ai2/README.md): one night of
// local AI illustrations to find ONE refined, distinctive MSP illustration style for Instagram and maybe the website,
// replacing the semi-flat outlined, pastel-washed house style that reads as AI-generated (AI1 E3 is that look).
//
// Five strongly art-directed text-to-image directions (I1–I5), each with a written style spec, are applied to the same
// seven subjects: four funny-fact jokes from F3 that need no jigsaw pieces (minute 58, unboxed, the balance, Halloween)
// and three site-like spots (achievement badge, empty state, XP and levels). The jokes that are made of pieces (edges
// first / last, sorting the sky) go only to I6, where klein 4B restyles a code scaffold whose pieces come from the
// generator, so no piece is ever drawn by the model. Each direction runs on the model that suits it (core) and, if
// time allows, on a second model as a control (optional, 2 seeds).
//
// Z-Image runs at guidance 0 and klein at guidance 1, so negative prompts do nothing: every prompt describes what IS
// there (flat ground, plain surfaces, "nothing written anywhere") instead of listing what to avoid.
//
//   node lab/ai2/batch.ts                                  # print the job list (no ComfyUI needed)
//   node tools/ai-batch.ts --batch lab/ai2/batch.ts --dry-run
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../src/render/server.ts';
import {
  FAMILIES, WORKFLOWS, buildJobs, familyFiles, fillWorkflow as fillCore, sha256,
  type BatchHooks, type Experiment, type FamilyId, type Job, type PromptDef,
} from '../ai/core.ts';

export { FAMILIES, WORKFLOWS, familyFiles, sha256 };

/** AI_LAB_ID only for the runner's dry tests against a mock ComfyUI (e.g. IL1TEST). */
export const LAB_ID = process.env.AI_LAB_ID ?? 'IL1';
export const OUT_DIR = join(ROOT, 'content/labs', LAB_ID);
export const TITLE = 'IL1 illustration lab (6 style directions × funny-fact jokes + site spots)';
/** klein 4B first: the cheapest family, so most directions exist even if the night is cut short. */
export const FAMILY_ORDER: FamilyId[] = ['klein4b', 'zimage', 'klein9b'];

// ------------------------------------------------------------------ the brand and the shared rules

/** Brand colours as the prompts name them. Grounds rotate per direction (navy, coral, indigo, sky; white only with depth). */
const NAVY = 'deep navy (#2b3445)', CORAL = 'coral (#ec726f)', INDIGO = 'indigo (#4e54c8)', SKY = 'sky blue (#69b3fe)';
const NOTHING = 'Nothing written anywhere, no letters, no numbers, no logo';

/** What every direction must avoid, as the owner said it (decisions 2026-10-14) and the badge lab measured it. */
export const AVOID_ALL = [
  'text, letters or numbers made by the model (code sets all type)',
  'puzzle-box art and AI-drawn jigsaw pieces (pieces only from the generator, via I6 scaffolds)',
  'people, hands and faces on people; objects with faces; animals with cute blush or big shiny eyes',
  'pastel washes, two-stop gradients, glossy highlights, sparkles',
  'the "cute outlined icon" look: one even navy outline around soft rounded shapes (the current site style)',
];

export interface StyleSpec {
  /** Short name for the gallery and the style guide. */
  name: string;
  why: string;
  palette: string;
  line: string;
  shading: string;
  texture: string;
  composition: string;
  avoid: string;
  /** Prompt = lead + subject + body. */
  lead: string;
  body: string;
}

export const STYLES: Record<'I1' | 'I2' | 'I3' | 'I4' | 'I5', StyleSpec> = {
  I1: {
    name: 'Swiss poster',
    why: 'The furthest from the current outlined style: no lines at all, flat geometry, poster energy that matches D2 Poster Numbers.',
    palette: `solid ${CORAL} ground; shapes in ${NAVY}, white and ${SKY}; a small ${INDIGO} accent`,
    line: 'none: shapes meet edge to edge, razor sharp',
    shading: 'none; one hard-edged flat shadow shape at most',
    texture: 'none (print-flat)',
    composition: 'one large subject built from circles, half circles, rectangles and thick bars on an asymmetric grid; big flat ground',
    avoid: 'outlines, gradients, rounded "friendly" blobs, texture',
    lead: 'A bold flat geometric illustration in the style of a 1960s Swiss International Style poster, showing ',
    body: 'Everything is built from simple geometric shapes, circles, half circles, rectangles and thick bars, with razor-sharp edges and no outlines. ' +
      'Strictly flat solid colour, no gradients, no texture; depth comes only from overlapping shapes and one hard-edged flat shadow shape. ' +
      `Limited palette: the whole background is one flat solid ${CORAL}; the shapes are ${NAVY}, pure white and ${SKY}, with a small ${INDIGO} accent. ` +
      `The subject is large and confident, placed on a clear grid with generous flat background around it. ${NOTHING}.`,
  },
  I2: {
    name: 'Paper-cut collage',
    why: 'Hand-made and tactile with real depth (the owner: "white or flat is OK with depth"); a craft that matches a puzzle hobby.',
    palette: `${INDIGO} background card; shapes in ${CORAL}, ${NAVY}, ${SKY} and white card`,
    line: 'no drawn lines; hand-cut edges, slightly irregular',
    shading: 'real soft shadows between 3–5 stacked paper layers, light from the top left',
    texture: 'matte card with visible fibre',
    composition: 'frontal, shallow layered diorama, subject centred with a wide margin of background card',
    avoid: 'printed gradients, gloss, plastic 3D, photo-real objects',
    lead: 'A handmade cut-paper collage photographed straight on, showing ',
    body: 'Every shape is cut by hand from matte coloured card and stacked in three to five shallow layers, with soft real shadows between the layers from one light at the top left. ' +
      'Visible paper fibre and slightly irregular hand-cut edges, no drawn lines, no printed gradients. ' +
      `Card colours only: an ${INDIGO} background sheet, with shapes in ${CORAL}, ${NAVY}, ${SKY} and white. ` +
      `Simple, bold shapes, the subject centred with a wide empty margin of background card. Matte, no gloss. ${NOTHING}.`,
  },
  I3: {
    name: 'Linocut, three inks',
    why: 'Deliberate, human texture on the navy ground the owner likes (D5); carving forces simple, sturdy shapes.',
    palette: `white, ${CORAL} and ${SKY} inks on ${NAVY} paper`,
    line: 'carved: chunky, slightly irregular edges; tone from parallel gouge lines',
    shading: 'no gradients: carved hatching and solid areas only',
    texture: 'uneven ink coverage, speckle, slight misregistration',
    composition: 'centred, simplified sturdy forms, calm plain navy around the subject',
    avoid: 'smooth vector curves, uniform outlines, gradients',
    lead: 'A linocut block print, three inks on deep navy paper, showing ',
    body: 'Bold carved shapes with chunky, slightly irregular edges; tone and form come only from carved parallel gouge lines and solid areas, never from gradients. ' +
      `Inks: white, ${CORAL} and ${SKY}, printed on ${NAVY} paper, with the uneven ink coverage, speckle and slight colour misregistration of a hand-pulled print. ` +
      `Simplified, sturdy forms, the subject centred with a calm area of plain navy paper around it, no border. ${NOTHING}.`,
  },
  I4: {
    name: 'Clay studio',
    why: 'A 3D look without gloss: matte plasticine reads hand-made, photographs well and sits naturally next to real puzzle photos.',
    palette: `clay in ${CORAL}, ${NAVY}, white and ${INDIGO}; seamless ${SKY} paper sweep`,
    line: 'none (sculpted forms)',
    shading: 'one large soft light from the top left, soft contact shadows',
    texture: 'matte plasticine, fingerprints and tool marks',
    composition: 'seen slightly from above, centred, generous empty sweep around the subject',
    avoid: 'shine, plastic toys, cute faces, blush',
    lead: 'A handmade modelling-clay miniature photographed in a small studio, showing ',
    body: 'Every object is sculpted from matte plasticine with softly rounded edges, visible fingerprints and small tool marks, simplified chunky forms. ' +
      `Clay colours: ${CORAL}, ${NAVY}, white and ${INDIGO}. The scene stands on a seamless ${SKY} paper sweep that curves up into the background, ` +
      `one large soft light from the top left, soft contact shadows, matte surfaces without any shine. Seen from slightly above, centred, with generous empty background around the subject. ${NOTHING}.`,
  },
  I5: {
    name: 'Risograph, two inks',
    why: 'Indie-print character with a tiny palette (two brand inks and their overprint); the one white-paper direction, with depth from grain.',
    palette: `two inks only, fluorescent ${CORAL} and ${INDIGO}, overprinting to deep violet; bright white paper`,
    line: 'soft grainy crayon-like line',
    shading: 'coarse halftone dots and grain, no smooth gradients',
    texture: 'riso grain, slight misregistration, speckle',
    composition: 'simple, slightly naive but confident shapes, centred, plenty of paper around',
    avoid: 'smooth digital gradients, a third colour, navy outlines',
    lead: 'A two-colour risograph print on bright white paper, showing ',
    body: `Only two inks: fluorescent ${CORAL} and ${INDIGO}, overprinting into a deep violet where they overlap. ` +
      'Shapes are drawn with a soft, grainy crayon-like line and filled with flat ink; tone is made with coarse halftone dots and grain, never smooth gradients. ' +
      'Visible riso texture: grainy ink, slight misregistration between the two colours, a few speckles. ' +
      `Simple, slightly naive but confident shapes, the subject centred with plenty of white paper around it. ${NOTHING}.`,
  },
};

// ------------------------------------------------------------------ subjects

/** The F3 jokes without pieces and three site-like spots. Style-neutral: the direction's lead and body add the look. */
const SUBJECTS: Array<{ id: string; title: string; use: string; text: string }> = [
  {
    id: 'minute58', title: 'Minute 58', use: 'F3 joke: "Nothing focuses the mind like minute 58."',
    text: 'a classic mechanical stopwatch racing forward at full speed, tilted forward as if sprinting, a few drops of sweat flying off its top and short straight speed streaks trailing behind it. ' +
      'Its single hand points just before the top of the dial, two ticks short of a full turn; the dial is plain and marked only with short tick marks.',
  },
  {
    id: 'unboxed', title: 'Unboxed', use: 'F3 joke: "Unboxed. Not by choice."',
    text: 'a cat fast asleep, stretched out across the lid of a flat rectangular box lying on a tabletop, its body covering almost the whole lid, its head resting on its front paws and turned away from the viewer, ' +
      'its tail hanging over the edge of the box. The lid is plain, one solid colour.',
  },
  {
    id: 'balance', title: 'The balance', use: 'F3 joke: "Twice the pieces. Three times the evening."',
    text: 'an old-fashioned two-pan balance scale, perfectly level. On the left pan lies one large flat rectangular box; on the right pan a neat stack of three small flat rectangular boxes. ' +
      'All boxes are plain, each one solid colour.',
  },
  {
    id: 'halloween', title: 'Halloween', use: 'F3 seasonal: "The other eleven months, they haunt the shelf."',
    text: 'a small ghost made of a plain sheet rising out of an open flat box on a shelf, with two dark oval eye holes and no mouth; two round uncarved pumpkins sit beside the box, and a full moon shows in a small window behind.',
  },
  {
    id: 'badge', title: 'Achievement badge', use: 'Site spot: badge / achievement unlocked',
    text: 'an achievement medal: a round medal with one raised five-pointed star in its centre, hanging from a short folded ribbon, seen straight on and centred.',
  },
  {
    id: 'empty', title: 'Empty state', use: 'Site spot: "No puzzles logged yet"',
    text: 'a quiet empty state: a bare tabletop seen from slightly above with one empty shallow tray, one closed flat plain box and a cup of tea beside them, lots of empty space around.',
  },
  {
    id: 'levels', title: 'XP and levels', use: 'Site spot: feature hero "XP and levels"',
    text: 'levelling up: a staircase of five square blocks rising from left to right, each block one step higher than the last, a small pennant flag planted on the top block and a single curved arrow sweeping upward over the steps.',
  },
];

const promptsFor = (s: StyleSpec): PromptDef[] => SUBJECTS.map(x => ({ id: x.id, title: x.title, use: x.use, text: s.lead + x.text + ' ' + s.body }));

// ------------------------------------------------------------------ I6: style lock over code scaffolds

const KEEP = 'Keep every shape exactly where it is, at its exact size and outline: every jigsaw piece keeps its exact shape, knobs and holes; nothing added, nothing removed, nothing moved.';
const SCAFFOLD_SUBJECTS: Array<{ id: string; title: string; use: string; note: string }> = [
  { id: 'edges-first', title: 'Edges first', use: 'F3 joke: "Edges first: the correct way."', note: 'The finished frame of pieces at the top and the loose middle pieces below lie on a mat on a table.' },
  { id: 'edges-last', title: 'Edges last', use: 'F3 joke: "Edges last: also the correct way."', note: 'The finished middle at the top and the border pieces waiting in neat rows below lie on a mat on a table.' },
  { id: 'sky', title: 'Sorting the sky', use: 'F3 joke: "Sorting the sky section."', note: 'Four round sorting trays seen from above; the four small white tape strips stay completely blank.' },
  { id: 'empty', title: 'Empty state', use: 'Site spot: "No puzzles logged yet"', note: 'The dashed outline of an empty puzzle on a mat and one lonely corner piece.' },
  { id: 'badge', title: 'Achievement badge', use: 'Site spot: badge / achievement unlocked', note: 'A round medal on two ribbon straps with one big jigsaw piece in its centre.' },
  { id: 'levels', title: 'XP and levels', use: 'Site spot: feature hero "XP and levels"', note: 'A staircase of interlocking jigsaw pieces rising to the right with a small pennant on the top step.' },
];
const TREATMENTS = {
  print: {
    label: 'screen print',
    text: (note: string) => `Turn this flat layout into a hand-pulled screen print. ${KEEP} ${note} ` +
      `Print it with four flat inks, white, ${CORAL}, ${SKY} and ${INDIGO}, on ${NAVY} paper: solid ink areas with the slightly uneven coverage, fine speckle and a hint of misregistration of a real print, ` +
      `no gradients, no outlines added. Matte paper. ${NOTHING}.`,
  },
  paper: {
    label: 'cut paper',
    text: (note: string) => `Turn this flat layout into a handmade cut-paper collage photographed straight on. ${KEEP} ${note} ` +
      `Each shape becomes a piece of matte coloured card in its own colour, cut by hand and layered slightly above the ${NAVY} background card, casting a soft real shadow from one light at the top left. ` +
      `Visible paper fibre, crisp cut edges, no drawn lines, no gradients, matte. ${NOTHING}.`,
  },
} as const;

// ------------------------------------------------------------------ experiments

// Planning seconds per image at 1024², from the AI1 night on this Mac with this runner (medians + ~10 %):
// Z-Image 8 steps 100 s, klein 4B t2i 4 steps 36 s, klein 9B 4 steps 80 s. The 1-reference edit was measured only at
// 1024×1280 with 8 steps (184 s); at 1024² and 4 steps it should take about half, planned at 100 s until measured.
const EST = { zimage: 110, klein4b: 40, klein9b: 88, edit: 100 };
const SQUARE = { width: 1024, height: 1024 };
const ZIMAGE = { family: 'zimage' as const, workflow: 'zimage-turbo-gguf-t2i', ...SQUARE, steps: 8, cfg: 1, sampler: 'res_multistep', scheduler: 'simple', estS: EST.zimage, variant: 'zi', variantLabel: 'Z-Image Turbo' };
const K4B = { family: 'klein4b' as const, workflow: 'klein4b-gguf-t2i', ...SQUARE, steps: 4, cfg: 1, sampler: 'euler', scheduler: 'Flux2Scheduler', estS: EST.klein4b, variant: '4b', variantLabel: 'klein 4B' };
const K9B = { family: 'klein9b' as const, workflow: 'klein9b-gguf-t2i', ...SQUARE, steps: 4, cfg: 1, sampler: 'euler', scheduler: 'Flux2Scheduler', estS: EST.klein9b, variant: '9b', variantLabel: 'klein 9B' };

const PASS = 'one seed set where ≥ 5 of the 7 subjects read as ONE consistent style; no glyphs, no faces on people, no blush, no gloss; ' +
  'palette ΔE2000 ≤ 10 after the brand snap; reads hand-made / art-directed rather than generic AI clip art; the owner would post it';

/** One direction on its core model (3 seeds) and, if time allows, on a control model (the first 2 seeds). */
function direction(id: keyof typeof STYLES, seeds: number[], core: typeof ZIMAGE | typeof K4B | typeof K9B, control: typeof ZIMAGE | typeof K4B | typeof K9B): Experiment[] {
  const s = STYLES[id];
  const idea = `${s.why} Palette: ${s.palette}. Line: ${s.line}. Shading: ${s.shading}. Texture: ${s.texture}. Composition: ${s.composition}. Avoid: ${s.avoid}. ` +
    `Core model ${core.variantLabel}, control ${control.variantLabel} (optional, 2 seeds).`;
  const base = { id, name: s.name, idea, prompts: promptsFor(s), checks: ['palette' as const], pass: PASS };
  return [
    { ...base, ...core, seeds, core: true },
    { ...base, ...control, seeds: seeds.slice(0, 2), core: false, idea: '' },
  ];
}

const I6 = (key: keyof typeof TREATMENTS, seeds: number[]): Experiment => ({
  id: 'I6', variant: key, variantLabel: `klein 4B edit · ${TREATMENTS[key].label}`,
  name: 'Style lock over code scaffolds',
  idea: 'Code draws the composition with generator pieces in flat brand colours (first slide of each row); klein 4B (Apache-2.0) restyles it as a screen print or as cut paper. ' +
    'This is the route for every joke that needs pieces, and the test of whether the I2/I3 looks survive a fixed layout. Pass also: every piece keeps its generator outline.',
  family: 'klein4b', workflow: 'klein4b-gguf-edit1', ...SQUARE, steps: 4, cfg: 1, sampler: 'euler', scheduler: 'Flux2Scheduler',
  seeds, core: true, estS: EST.edit, checks: ['palette'], pass: PASS,
  prompts: SCAFFOLD_SUBJECTS.map(x => ({ id: x.id, title: x.title, use: x.use, reference: x.id, text: TREATMENTS[key].text(x.note) })),
});

export const EXPERIMENTS: Experiment[] = [
  ...direction('I1', [111, 112, 113], ZIMAGE, K9B),
  ...direction('I2', [121, 122, 123], ZIMAGE, K4B),
  ...direction('I3', [131, 132, 133], K4B, K9B),
  ...direction('I4', [141, 142, 143], ZIMAGE, K4B),
  ...direction('I5', [151, 152, 153], K9B, K4B),
  I6('print', [161, 162]),
  I6('paper', [161, 162]),
];

/** Core experiments first within each family, then the optional controls. */
export const jobs = (): Job[] => buildJobs([...EXPERIMENTS.filter(e => e.core), ...EXPERIMENTS.filter(e => !e.core)], FAMILY_ORDER);
export const fillWorkflow = (job: Job, referenceName?: string) => fillCore(job, referenceName, 'msp-il1');

// ------------------------------------------------------------------ hooks: the I6 scaffolds

const SCAFFOLD_DIR = join(OUT_DIR, 'scaffolds'); // = lab/ai2/scaffolds.ts SCAFFOLD_DIR (imported lazily: it imports this file)
const scaffoldPng = (name: string) => join(SCAFFOLD_DIR, `${name}.png`);
const SCAFFOLD_NAMES = SCAFFOLD_SUBJECTS.map(x => x.id);

export const hooks: BatchHooks = {
  async prepare() {
    if (!SCAFFOLD_NAMES.every(n => existsSync(scaffoldPng(n)))) {
      const { renderScaffolds } = await import('./scaffolds.ts');
      await renderScaffolds();
    }
  },
  referenceFile: j => (j.reference && existsSync(scaffoldPng(j.reference)) ? scaffoldPng(j.reference) : undefined),
  validationReference: j => (j.reference ? scaffoldPng(j.reference) : undefined),
  inputSlide: j => (j.reference ? { id: 'scaffold', file: scaffoldPng(j.reference), note: 'the code scaffold (input; pieces from the generator)' } : undefined),
  dryRunNotes: () => [`scaffolds: ${SCAFFOLD_NAMES.map(n => `${n} ${existsSync(scaffoldPng(n)) ? 'ok' : 'missing'}`).join(', ')} (rendered at start if missing)`],
};

if (import.meta.main) {
  const all = jobs();
  for (const fam of FAMILY_ORDER) {
    const js = all.filter(j => j.family === fam);
    console.log(`${FAMILIES[fam].name} (${FAMILIES[fam].licence}, need ${FAMILIES[fam].needGb} GB): ${js.length} images, ≈ ${Math.round(js.reduce((s, j) => s + j.estS, 0) / 60)} min`);
    for (const e of EXPERIMENTS.filter(x => x.family === fam)) console.log(`  ${e.id}/${e.variant} ${e.name}${e.core ? '' : ' (optional)'}: ${js.filter(j => j.exp === e.id && j.variant === e.variant).length}`);
  }
  console.log(`total ${all.length} images`);
}
