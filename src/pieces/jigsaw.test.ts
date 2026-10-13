import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateJigsaw, polygonArea, sampleOutline } from './jigsaw.ts';

test('pieces tessellate the puzzle area exactly', () => {
  for (const seed of [1, 42, 2026]) {
    const jig = generateJigsaw({ cols: 10, rows: 10, width: 900, height: 900, seed });
    assert.equal(jig.pieces.length, 100);
    const areas = jig.pieces.map(p => polygonArea(sampleOutline(p.outline, 64)));
    for (const a of areas) assert.ok(a > 0, 'every outline is clockwise with positive area');
    const total = areas.reduce((s, a) => s + a, 0);
    assert.ok(Math.abs(total - 900 * 900) / (900 * 900) < 1e-4, `area sum ${total} equals the grid area`);
  }
});

test('neighbouring pieces share their edge exactly', () => {
  const jig = generateJigsaw({ cols: 4, rows: 3, width: 400, height: 300, seed: 7 });
  const at = (c: number, r: number) => jig.pieces.find(p => p.col === c && p.row === r)!;
  // Outline = top(0..9) right(9..18) bottom(18..27) left(27..36).
  const right = at(1, 1).outline.slice(9, 19);
  const leftOfNext = at(2, 1).outline.slice(27, 37);
  assert.deepEqual(right, [...leftOfNext].reverse());
  const bottom = at(1, 1).outline.slice(18, 28);
  const topOfBelow = at(1, 2).outline.slice(0, 10);
  assert.deepEqual(bottom, [...topOfBelow].reverse());
});

test('same seed, same puzzle', () => {
  const a = generateJigsaw({ cols: 5, rows: 5, width: 500, height: 500, seed: 99 });
  const b = generateJigsaw({ cols: 5, rows: 5, width: 500, height: 500, seed: 99 });
  assert.deepEqual(a.pieces.map(p => p.d), b.pieces.map(p => p.d));
});
