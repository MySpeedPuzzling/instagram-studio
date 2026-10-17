import { test } from 'node:test';
import assert from 'node:assert/strict';
import { datesIn, editDistance, matchAnswer, mentions, normalize, validateKey, type ChoiceKey, type DateKey, type NumberKey, type OrderKey, type TextKey, type TimeKey } from './match.ts';

const choice: ChoiceKey = { type: 'choice', options: { A: 'Paris', B: 'London', C: 'New York' }, correct: 'B', aliases: { B: ['london postcard'] } };
const read = (t: string, k: Parameters<typeof matchAnswer>[1] = choice) => matchAnswer(t, k);

test('normalize strips case, accents, emoji and punctuation', () => {
  assert.equal(normalize('  Londýn!! 🎄🎅 '), 'londyn');
  assert.equal(normalize('B)'), 'b');
  assert.equal(normalize('Ñandú — ÉCLAIR'), 'nandu eclair');
});

test('edit distance counts a transposition as one edit', () => {
  assert.equal(editDistance('london', 'lodnon'), 1);
  assert.equal(editDistance('paris', 'pairs'), 1);
  assert.equal(editDistance('', 'abc'), 3);
});

test('choice: lone letters and marked letters', () => {
  for (const t of ['B', 'b', 'B!', 'b.', 'B 🎄', '(b)', 'b)', 'Answer: B', 'answer b', 'my answer is B', 'I think B', 'I think it is B', 'Definitely B!!', '🅱️ B']) {
    assert.equal(read(t).parsed, 'B', t);
    assert.equal(read(t).verdict, 'correct', t);
  }
  assert.equal(read('A').verdict, 'wrong');
  assert.equal(read('a').parsed, 'A');
  assert.equal(read('a)').parsed, 'A');
  assert.equal(read('C').reason, 'option C, correct is B');
});

test('choice: option names with typos and accents', () => {
  for (const t of ['London', 'london 🎄', 'Londýn', 'LONDON!!!', 'b) London', 'B London', 'it has to be london', 'Lodnon', 'the london postcard']) assert.equal(read(t).parsed, 'B', t);
  assert.equal(read('new york').parsed, 'C');
  assert.equal(read('NewYork').parsed, 'C');
  assert.equal(read('Paris').parsed, 'A');
});

test('choice: the article "a" and sentence-initial capitals are not choices', () => {
  assert.equal(read('I think it is a London one').parsed, 'B');
  assert.equal(read('A London one for sure').parsed, 'B');
  assert.equal(read('what a hard one').verdict, 'unparsed');
});

test('choice: naming two options, or none, is unparsed', () => {
  assert.equal(read('B or C?').verdict, 'unparsed');
  assert.match(read('London or Paris').reason, /several options/);
  assert.equal(read('A, no wait, B').verdict, 'unparsed');
  assert.equal(read('good luck everyone!').verdict, 'unparsed');
  assert.equal(read('🎄🎄🎄').verdict, 'unparsed');
  // Short names must be exact: "pairs" is not Paris.
  assert.equal(read('in pairs it was fast').verdict, 'unparsed');
});

test('number: minutes with tolerance, many spellings', () => {
  const k: NumberKey = { type: 'number', correct: 64.9, unit: 'min', tolerance: { abs: 1 } };
  for (const t of ['65', '65 min', 'about 64', '~65 minutes', '64,5', '1:05', '1h 5m', '1 h 4 min', 'Day 9: 65', '#9 → 64']) assert.equal(read(t, k).verdict, 'correct', t);
  assert.equal(read('70', k).verdict, 'wrong');
  assert.equal(read('between 60 and 70', k).verdict, 'unparsed');
  assert.equal(read('no idea', k).verdict, 'unparsed');
});

test('number: counts with thousands separators and k', () => {
  const k: NumberKey = { type: 'number', correct: 3275, unit: 'count', tolerance: { rel: 0.1 } };
  for (const t of ['3,275', '3 275', '3275', '3.3k', 'around 3000']) assert.equal(read(t, k).verdict, 'correct', t);
  assert.equal(read('2500', k).verdict, 'wrong');
  const big: NumberKey = { type: 'number', correct: 300_000_000, tolerance: { rel: 0.02 } };
  assert.equal(read('300 million', big).verdict, 'correct');
});

test('time: h:mm:ss, h:mm, mm:ss and words, ±60 s by default', () => {
  const k: TimeKey = { type: 'time', correct: '1:04:54' };
  for (const t of ['1:04:54', '1:05', '1:04', '65 min', '64m 54s', '1h 5m', '3894 s', '65']) assert.equal(read(t, k).verdict, 'correct', t);
  assert.equal(read('1:10', k).verdict, 'wrong');
  const short: TimeKey = { type: 'time', correct: '22:30', tolerance: { abs: 30 } };
  assert.equal(read('22:45', short).verdict, 'correct');
  assert.equal(read('23:30', short).verdict, 'wrong');
});

test('text: puzzle names with typos', () => {
  const k: TextKey = { type: 'text', accept: ['Curious Capers of the Capybaras', 'capybaras'] };
  for (const t of ['Curious Capers of the Capybaras', 'the capybara one!', 'Capybaras 🦫', 'Capibaras', 'curious capers of the capybaraz']) assert.equal(read(t, k).verdict, 'correct', t);
  assert.equal(read('Cats in the garden', k).verdict, 'wrong');
  assert.ok(mentions('newyork postcard', 'New York'));
});

test('order: letters in sequence', () => {
  const k: OrderKey = { type: 'order', options: { A: 'Paris', B: 'London', C: 'New York' }, correct: 'BCA' };
  for (const t of ['bca', 'BCA', 'B > C > A', 'b, c, a', 'B-C-A', 'answer: b c a']) assert.equal(read(t, k).verdict, 'correct', t);
  assert.equal(read('ABC', k).verdict, 'wrong');
  assert.equal(read('BB', k).verdict, 'unparsed');
  assert.equal(read('BCAD', k).verdict, 'unparsed');
});

test('date: many spellings, day-first unless the second number is over 12', () => {
  const ds = (t: string) => datesIn(t, 2026);
  for (const t of ['25 Nov', 'Nov 25', '25th November', 'Wednesday 25 Nov', '25.11.', '25/11', '11/25', '2026-11-25', '25. listopadu', 'November 25th 2026', 'the 25th of November']) assert.deepEqual(ds(t), ['2026-11-25'], t);
  assert.deepEqual(ds('3/12'), ['2026-12-03']);
  assert.deepEqual(ds('31 Feb'), []);
  const k: DateKey = { type: 'date', correct: null, mode: 'closest', year: 2026 };
  assert.equal(read('25 Nov', k).verdict, 'pending');
  assert.equal(read('25 Nov or 26 Nov?', k).verdict, 'unparsed');
  assert.equal(read('25 Nov', { ...k, correct: '2026-11-27' }).verdict, 'answered');
});

test('validateKey rejects malformed keys', () => {
  assert.throws(() => validateKey({ type: 'choice', options: { A: 'x' }, correct: 'A' }));
  assert.throws(() => validateKey({ type: 'choice', options: { A: 'x', B: 'y' }, correct: 'C' }));
  assert.throws(() => validateKey({ type: 'order', options: { A: 'x', B: 'y' }, correct: 'AA' }));
  assert.throws(() => validateKey({ type: 'date', correct: '25 Nov' }));
  assert.equal(validateKey(choice).type, 'choice');
});
