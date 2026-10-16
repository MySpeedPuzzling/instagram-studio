// J1 · funny-fact drawing approaches. The four jokes whose DL2 cartoons read as AI clip art (minute 58, the unboxed
// cat, the 1000 balance, Halloween), each drawn three code-native ways so the owner can pick per approach:
//   a  built from real things: generator pieces (src/pieces/jigsaw.ts) and real box images with their credit
//   b  bold flat poster geometry: flat brand colours, hard shapes, no outlines, washes, glints or blush
//   c  type-led: the number or the word does the joke
// All on one fixed frame (H1, the navy house variant) so only the drawing changes. The art and the layout are the
// ones lab/dl4/posts/fun.ts uses (it picks one approach per joke for the feed posts).
//   node lab/dl4/run.ts --extra J1
import { VARIANTS } from '../../../src/design/house.ts';
import { fmtInt } from '../../../src/design/page.ts';
import type { Direction, Post } from '../../dl1/types.ts';
import { FUN_CSS, art1000, artHalloween, artMinute58, artUnboxed, funFacts, panel, times, type Approach } from '../posts/fun.ts';

const APPROACH: Record<Approach, string> = { a: 'A · built from pieces and box images', b: 'B · flat poster geometry', c: 'C · type-led' };
const KICKER = 'Meanwhile, at the puzzle table';

const direction: Direction = {
  id: 'J1',
  name: 'Funny facts: three drawing approaches',
  idea: 'The four jokes that read as AI clip art in DL2 (minute 58, the unboxed cat, the 1000 balance, Halloween), each drawn three code-native ways on the H1 frame: A built from real generator pieces and real box images, B bold flat poster geometry (Swiss/constructivist: hard shapes, flat brand colours, no outlines, washes or glints), C type-led (the number or word is the joke). Rate each approach per joke; the winner per joke goes into the feed posts.',
  css: FUN_CSS,
  posts: () => {
    const F = funFacts();
    const v = VARIANTS.H1;
    const s = F.sizes, m = F.minute, hw = F.halloween;
    const jokes: Array<{ key: string; name: string; src: string; art: (k: Approach) => string; punch: string; wink: string; winkFirst?: boolean; kicker?: string }> = [
      {
        key: 'minute-58', name: 'Minute 58', src: F.source, art: k => artMinute58(F, k),
        punch: `Nothing focuses the mind like <span class="hot">minute ${m.mode}.</span>`, wink: `More solo 500s on MSP finish in minute ${m.mode} than in any other: <b>${fmtInt(m.results)}</b> of them.`,
      },
      {
        key: 'unboxed', name: 'Unboxed (the cat)', src: 'myspeedpuzzling.com', art: k => artUnboxed(F, k),
        punch: `Unboxed. <span class="hot">Not by choice.</span>`, wink: 'Still claiming the unboxed XP bonus.',
      },
      {
        key: '1000', name: 'Twice the pieces (the balance)', src: F.source, art: k => art1000(F, k),
        punch: `${times(s.pieceRatio)} the pieces. <span class="hot">${times(s.timeRatio)} the evening.</span>`, wink: `Median solo time on MSP: <b>${s.medSmall}</b> for a ${s.small}, <b>${s.medBig}</b> for a ${s.big}.`,
      },
      {
        key: 'halloween', name: 'Halloween', src: hw.source, art: k => artHalloween(F, k), kicker: 'Halloween special',
        punch: `The other eleven months, <span class="hot">they haunt the shelf.</span>`, wink: `<b>${hw.octPct}%</b> of all solves of puzzles with “Halloween” in the name happen in October.`, winkFirst: true,
      },
    ];
    const posts: Post[] = [];
    for (const j of jokes) for (const k of ['a', 'b', 'c'] as Approach[]) {
      const key = `j1-${j.key}-${k}`;
      posts.push({
        key, label: `${j.name} · ${APPROACH[k]}`,
        slides: [{ id: key, body: panel({ v, post: key, slide: 1, of: 1 }, 'cover', { kicker: j.kicker ?? KICKER, src: j.src, art: j.art(k), punch: j.punch, wink: j.wink, winkFirst: j.winkFirst }) }],
      });
    }
    return posts;
  },
};
export default direction;
