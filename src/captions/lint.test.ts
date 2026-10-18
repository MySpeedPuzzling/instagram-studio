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

// Ideas taken from the instagram-agent-skill review (research_notes/MSP Instagram content pipeline/
// external_instagram_agent_skill_review.md, 2026-10-18).
const POSTCARDS = [
  'Paris, London or New York: which 500-piece postcard do puzzlers finish fastest? Guess before you swipe.',
  '',
  'All three are @ravensburgerglobal postcards and among the most-solved puzzles on MySpeedPuzzling.',
  '',
  'Which postcard have you done, and what was your time? ⏱️',
  '',
  '#speedpuzzling #jigsawpuzzle #ravensburger #500pieces',
].join('\n');

test('search phrases must be in the caption text, not only in hashtags or the brand name', () => {
  const r = lintCaption(POSTCARDS, 'carousel', { searchPhrases: ['speed puzzling', '500 piece'] });
  assert.ok(r.warnings.some(w => w.includes('"speed puzzling"')), r.warnings.join('\n'));
  assert.ok(!r.warnings.some(w => w.includes('"500 piece"')), '"500-piece" counts as "500 piece"');
  assert.ok(!r.warnings.some(w => w.includes('in the hook')));
  const fixed = lintCaption(POSTCARDS.replace('on MySpeedPuzzling', 'in speed puzzling'), 'carousel', { searchPhrases: ['speed puzzling', '500 piece'] });
  assert.ok(!fixed.warnings.some(w => w.includes('search phrase')), fixed.warnings.join('\n'));
  const notInHook = lintCaption(POSTCARDS, 'carousel', { searchPhrases: ['most-solved puzzles'] });
  assert.ok(notInHook.warnings.some(w => w.includes('in the hook')));
  assert.ok(!lintCaption(POSTCARDS).warnings.some(w => w.includes('search')), 'no phrases declared, no check');
});

test('invisible characters are an error, emoji joiners are not', () => {
  for (const ch of ['\u200B', '\u00AD', '\uFEFF', '\u2060', '\u{E0041}', '\u200D']) {
    const r = lintCaption(POSTCARDS.replace('fastest', `fast${ch}est`));
    assert.ok(r.errors.some(e => e.includes('invisible')), `U+${ch.codePointAt(0)!.toString(16)}`);
  }
  const zwjEmoji = lintCaption(POSTCARDS.replace('⏱️', '👩\u200D💻'));
  assert.ok(!zwjEmoji.errors.some(e => e.includes('invisible')), zwjEmoji.errors.join('\n'));
  assert.ok(!lintCaption(POSTCARDS).errors.some(e => e.includes('invisible')), '⏱️ with its variation selector is fine');
});

test('stock phrases are errors and generated sentence shapes are warnings', () => {
  const r = lintCaption("Here's the thing. It's not just speed, it's patience. The result? A new record. Thoughts?", 'single');
  assert.ok(r.errors.some(e => e.includes("here's the thing")), r.errors.join('\n'));
  for (const needle of ["it's not just", 'staged reveal', 'generic question']) {
    assert.ok(r.warnings.some(w => w.toLowerCase().includes(needle)), `expected a warning about ${needle}:\n${r.warnings.join('\n')}`);
  }
  // A list of three cities is how puzzlers talk, not a tell: no triad rule.
  assert.deepEqual(lintCaption(POSTCARDS).errors, []);
});
