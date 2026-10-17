import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintCaption } from './lint.ts';

test('a playbook-style caption passes', () => {
  const caption = [
    '58 minutes is the most common finish time for a solo 500 on MySpeedPuzzling. Then the counts drop by 7.4% at the hour.',
    '',
    'We looked at every solo 500-piece result logged up to 13 Oct 2026. There is no such step at 45 or 50 minutes, so our guess is that the hour is the line people race for. 45% of 500-piece puzzlers already have a personal best under one hour.',
    '',
    'Which side of the wall is your PB, and was it a first attempt?',
    '',
    '#speedpuzzling #jigsawpuzzle #myspeedpuzzling',
  ].join('\n');
  const r = lintCaption(caption, 'carousel');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('AI tells and bait are caught', () => {
  const r = lintCaption('Exciting news!! Let’s dive in — we delve into a vibrant tapestry of puzzles ✨ Tag 3 friends! #puzzle #a #b #c #d #e', 'single');
  const joined = r.errors.join('\n');
  for (const needle of ['dash', 'delve', 'vibrant', 'tapestry', 'exciting news', 'banned emoji', 'exclamation', 'bait', 'hashtags; hard max 5', '#puzzle']) {
    assert.ok(joined.toLowerCase().includes(needle.toLowerCase()), `expected an error about ${needle}:\n${joined}`);
  }
});

test('score ranges with an en dash between digits are fine', () => {
  const r = lintCaption('The middle half of solo 500s finish in 52–83 minutes, based on 355,234 results logged on MySpeedPuzzling. What is yours? #speedpuzzling #jigsawpuzzle', 'single');
  assert.ok(!r.errors.some(e => e.includes('dash')));
});

test('hashtags: 3–5 topic labels on the last line, never in the hook (owner decision 2026-10-17)', () => {
  const ok = lintCaption('58 minutes is the most common finish for a solo 500 on MySpeedPuzzling, based on every result logged so far. Which side of the hour is yours?\n\n#speedpuzzling #jigsawpuzzle #500pieces', 'single');
  assert.deepEqual(ok.errors, []);
  assert.ok(!ok.warnings.some(w => w.includes('hashtag')));
  const few = lintCaption('58 minutes is the most common finish for a solo 500 on MySpeedPuzzling, based on every result logged so far. Which side of the hour is yours?\n\n#speedpuzzling', 'single');
  assert.ok(few.warnings.some(w => w.includes('target 3–5')));
});
