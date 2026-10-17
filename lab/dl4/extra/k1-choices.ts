// K1 · open choices on H4 (owner feedback 2026-10-17), shown side by side so each can be decided from examples:
//   navy   the same slides on brand navy #2b3445 vs deep navy #222a38 ("think about brand but contrast is important");
//   seam   the poster's puzzle cut in five shapes (grid4 = H2 today, bold3, classic4, drip4, tilt4);
//   fun    the funny-facts poster colour: green (trial) vs coral vs sky.
// Every slide is built by the real families with an H4 clone, so it is exactly what H4 would publish.
import { VARIANTS, activateVariant, type GroundKey, type SeamStyle, type Variant } from '../../../src/design/house.ts';
import data from '../posts/data.ts';
import formats from '../posts/formats.ts';
import fun from '../posts/fun.ts';
import ideas from '../posts/ideas.ts';
import type { Content } from '../content.ts';
import type { Direction, Post } from '../../dl1/types.ts';
import type { Family } from '../types.ts';

const H4 = VARIANTS.H4;
const deepNavy = { bg: '#222a38', depth: 'linear-gradient(170deg, #273041 0%, #222a38 50%, #1d2431 100%)', rule: '#3d475b', band: '#2e3747' };

/** Builds `family` for `v` and returns the named slides (post key → slide indices, 1-based). */
function pick(c: Content, v: Variant, fam: Family, want: Array<[string, number]>) {
  activateVariant(v);
  const posts = fam.posts(c, v);
  return want.map(([key, i]) => {
    const s = posts.find(p => p.key === key)?.slides[i - 1];
    if (!s) throw new Error(`K1: ${fam.id} has no ${key} slide ${i}`);
    return s;
  });
}

function k1(c: Content): Post[] {
  const out: Post[] = [];

  // 1 · navy
  const navyDeepH4: Variant = { ...H4, tokens: { ...H4.tokens, navy: { ...H4.tokens!.navy, ...deepNavy } } };
  for (const [key, v, label] of [['k1-navy-brand', H4, 'Navy A · brand navy #2b3445 (white text 12.5:1, coral 4.3:1)'], ['k1-navy-deep', navyDeepH4, 'Navy B · deep navy #222a38 (white text 14.4:1, coral 5.0:1)']] as const) {
    const slides = [
      ...pick(c, v, data, [['weekly', 3], ['wall', 2], ['record', 1]]),
      ...pick(c, v, formats, [['sep-mosaic', 1]]),
    ];
    out.push({ key, label, slides: slides.map((s, i) => ({ ...s, id: `${key}-${i + 1}` })) });
  }

  // 2 · seam shapes
  const SEAMS: Array<[SeamStyle, string]> = [
    ['grid4', 'Seam 1 · grid4: as in H2 (4 pieces, knobs as they fall)'],
    ['bold3', 'Seam 2 · bold3: 3 pieces, fewer bigger knobs, down-up-down'],
    ['classic4', 'Seam 3 · classic4: 4 pieces, textbook cut, strictly alternating'],
    ['drip4', 'Seam 4 · drip4: 4 pieces, every knob hangs down into the navy'],
    ['tilt4', 'Seam 5 · tilt4: grid4 on a gentle slope'],
  ];
  for (const [seam, label] of SEAMS) {
    const v: Variant = { ...H4, seam };
    const slides = [
      ...pick(c, v, data, [['wall', 1], ['weekly', 1]]),
      ...pick(c, v, ideas, [['atlas', 1]]),
    ];
    out.push({ key: `k1-seam-${seam}`, label, slides: slides.map((s, i) => ({ ...s, id: `k1-seam-${seam}-${i + 1}` })) });
  }

  // 3 · funny-facts poster colour
  const FUN: Array<[GroundKey, string]> = [['green', 'Fun A · brand green (trial)'], ['coral', 'Fun B · coral (shared with milestones)'], ['sky', 'Fun C · sky (shared with data desk and atlas)']];
  for (const [g, label] of FUN) {
    const v: Variant = { ...H4, ground: s => (s.series === 'fun' && (s.role === 'cover' || s.role === 'fact') ? g : H4.ground(s)) };
    const slides = pick(c, v, fun, [['fun-edges', 1], ['clocks-back', 1]]);
    out.push({ key: `k1-fun-${g}`, label, slides: slides.map((s, i) => ({ ...s, id: `k1-fun-${g}-${i + 1}` })) });
  }
  activateVariant(undefined);
  return out;
}

const direction: Direction = {
  id: 'K1',
  name: 'Choices for H4: navy, seam shape, funny-facts colour',
  idea: 'The open questions from the owner\'s H1+H2 decision (2026-10-17), each as the same real slides side by side: brand navy vs deep navy; five shapes of the poster\'s puzzle cut; the funny-facts poster colour. Mark the one you want with Works.',
  css: '',
  posts: (c: Content) => k1(c),
};
export default direction;
