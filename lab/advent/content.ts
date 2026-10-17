// AD1 · Advent of Puzzle lab content: six sample quizzes (week 2, days 7–12) built from the cached production queries
// (content/cache, aggregate only; private profiles and suspicious results excluded in the SQL). Lab numbers only: every
// real door re-queries --fresh on the day it is finalised (owner rule), and the answer keys of real doors live in the
// gitignored campaign store, never in this public repo.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { boxPaths } from '../../src/data/boxes.ts';
import { fmtInt } from '../../src/design/page.ts';
import { ROOT } from '../../src/render/server.ts';

type Row = Record<string, string>;
const rows = (q: string): Row[] => JSON.parse(readFileSync(join(ROOT, 'content/cache', `${q}.json`), 'utf8')).rows;
const asOf = (q: string) => JSON.parse(readFileSync(join(ROOT, 'content/cache', `${q}.json`), 'utf8')).queried_at.slice(0, 10) as string;

export interface Box { puzzle: string; brand: string; pieces: number; img: string; ratio: number }
const box = (r: Row, ratio = Number(r.image_ratio) || 1.3617): Box => {
  const p = boxPaths(r.image);
  if (!existsSync(p.file)) throw new Error(`box image missing in cache: ${r.puzzle} (run src/data/boxes.ts)`);
  return { puzzle: r.puzzle, brand: r.brand, pieces: Number(r.pieces ?? 500), img: p.url, ratio };
};
const find = (q: string, name: string, extra: (r: Row) => boolean = () => true) => {
  const r = rows(q).find(x => x.puzzle === name && extra(x));
  if (!r) throw new Error(`${q}: ${name} not found`);
  return r;
};

export type Letter = 'A' | 'B' | 'C';
export interface Option { letter: Letter; label: string; sub?: string; box?: Box; flag?: string; value?: string }

interface QuizBase { day: number; week: number; key: string; type: string; kicker: string; question: string; reply: string; src: string; /** Source line of the answer frame (names the puzzle). */ answerSrc?: string }
export interface ChoiceQuiz extends QuizBase { kind: 'choice'; options: Option[]; correct: Letter; reveal: { title: string; lines: string[]; box?: Box } }
export interface NumberQuiz extends QuizBase { kind: 'number'; unit: string; bars: Array<{ label: string; value: number }>; hidden: { label: string; value: number }; tolerance: string; reveal: { title: string; lines: string[] } }
export interface PieceQuiz extends QuizBase { kind: 'piece'; box: Box; correct: Letter; reveal: { title: string; lines: string[] } }
export type Quiz = ChoiceQuiz | NumberQuiz | PieceQuiz;

const min = (s: number) => { const t = Math.round(s); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

export function loadContent() {
  const top = rows('boxes-alltime-top');
  const topBox = (name: string) => box(top.find(r => r.puzzle === name)!);
  const topMed = (name: string) => Number(top.find(r => r.puzzle === name)!.median_solo_s);
  const subj = (name: string) => find('boxes-subject-speed', name);
  const sign = (cc: string) => rows('boxes-country-signatures').find(r => r.cc === cc && r.rk === '1')!;
  const yearly = rows('bs-yearly-speed');

  // Day 7 · Which is faster? Three 500s from the all-time top 60 whose medians sit within 27 seconds.
  const fasterNames = ['Hello Vinyl', 'Circle of Colors: Animals', 'Boathouses in Smogen, Sweden'];
  const fasterSorted = [...fasterNames].sort((a, b) => topMed(a) - topMed(b));
  const faster: ChoiceQuiz = {
    day: 7, week: 2, key: 'faster', kind: 'choice', type: 'Which is faster?', kicker: 'Which is faster?',
    question: 'Three 500s. Which one do puzzlers finish fastest?', reply: 'A, B or C',
    options: fasterNames.map((n, i) => ({ letter: 'ABC'[i] as Letter, label: n === 'Boathouses in Smogen, Sweden' ? 'Boathouses' : n === 'Circle of Colors: Animals' ? 'Circle of Colors' : n, sub: 'Mystery puzzle · Ravensburger', box: topBox(n), value: min(topMed(n)) })),
    correct: 'ABC'[fasterNames.indexOf(fasterSorted[0])] as Letter,
    reveal: {
      title: `${fasterSorted[0]}, by ${topMed(fasterSorted[1]) - topMed(fasterSorted[0])} seconds.`,
      lines: fasterSorted.map(n => `${n} · ${min(topMed(n))}`), box: topBox(fasterSorted[0]),
    },
    src: `Median solo time · ${asOf('boxes-alltime-top')}`, answerSrc: `Median solo time, Ravensburger · ${asOf('boxes-alltime-top')}`,
  };

  // Day 8 · Guess the puzzle from a crop of the box.
  const kawaii = topBox('Cute Kawaii Chaos');
  const guess: ChoiceQuiz = {
    day: 8, week: 2, key: 'guess', kind: 'choice', type: 'Guess the puzzle', kicker: 'Guess the puzzle',
    question: 'One of the 10 most-solved puzzles on MySpeedPuzzling. Which one?', reply: 'A, B or C',
    options: [
      { letter: 'A', label: 'Jazzy!', sub: 'Ravensburger · 500' },
      { letter: 'B', label: 'Cute Kawaii Chaos', sub: 'Ravensburger · 500' },
      { letter: 'C', label: 'Inside Out 2', sub: 'Ravensburger · 500' },
    ],
    correct: 'B',
    reveal: { title: 'Cute Kawaii Chaos.', lines: [`${fmtInt(Number(top.find(r => r.puzzle === 'Cute Kawaii Chaos')!.solvers))} puzzlers`, `Median solo ${min(topMed('Cute Kawaii Chaos'))}`, 'No. 8 of all time'], box: kawaii },
    src: `Mystery puzzle · Ravensburger · ${asOf('boxes-alltime-top')}`, answerSrc: `Cute Kawaii Chaos · Ravensburger · ${asOf('boxes-alltime-top')}`,
  };

  // Day 9 · Higher or lower: two mushroom puzzles (subject speed, 500 pieces).
  const m1 = subj('Circle of Colors: Mushrooms'), m2 = subj('Moonlight Mushrooms');
  const higher: ChoiceQuiz = {
    day: 9, week: 2, key: 'higher', kind: 'choice', type: 'Higher or lower', kicker: 'Higher or lower',
    question: 'Two mushroom puzzles, 500 pieces each. Which one takes longer?', reply: 'A or B',
    options: [
      { letter: 'A', label: 'Circle of Colors', sub: 'Mystery puzzle · Ravensburger', box: box(m1, 1), value: `${m1.median_min} min` },
      { letter: 'B', label: 'Moonlight', sub: 'Mystery puzzle · Ravensburger', box: box(m2, Number(m2.image_ratio)), value: `${m2.median_min} min` },
    ],
    correct: Number(m1.median_min) > Number(m2.median_min) ? 'A' : 'B',
    reveal: { title: `Circle of Colors: Mushrooms, by ${(Number(m1.median_min) - Number(m2.median_min)).toFixed(1)} minutes.`, lines: [`Circle of Colors: Mushrooms · ${m1.median_min} min`, `Moonlight Mushrooms · ${m2.median_min} min`], box: box(m1, 1) },
    src: `Median solo time · ${asOf('boxes-subject-speed')}`, answerSrc: `Median solo time, Ravensburger · ${asOf('boxes-subject-speed')}`,
  };

  // Day 10 · Guess the number: the 2026 median 500-piece solo time.
  const yr = (y: string) => Number(yearly.find(r => r.year === y)!.median_min);
  const number: NumberQuiz = {
    day: 10, week: 2, key: 'number', kind: 'number', type: 'Guess the number', kicker: 'Guess the number',
    question: 'The median 500-piece solo time keeps falling. What is it in 2026?', reply: 'minutes', unit: 'min',
    bars: ['2022', '2023', '2024', '2025'].map(y => ({ label: y, value: yr(y) })), hidden: { label: '2026', value: yr('2026') }, tolerance: 'e.g. 70.5 · within ±1 minute counts',
    reveal: { title: `${yr('2026')} minutes, the fastest year yet.`, lines: [`2025 · ${yr('2025')} min`, `2026 · ${yr('2026')} min`, `${yearly.find(r => r.year === '2026')!.pct_sub_hour}% of 2026 solo 500s are under an hour`] },
    src: `Solo 500-piece times, 2026 to date · ${asOf('bs-yearly-speed')}`,
  };

  // Day 11 · The missing piece: one hole in a generator cut of a box, three candidate shapes.
  const balloon = topBox('Air Balloon Valley');
  const piece: PieceQuiz = {
    day: 11, week: 2, key: 'piece', kind: 'piece', type: 'The missing piece', kicker: 'The missing piece',
    question: 'One piece is missing. Which one fits the gap?', reply: 'A, B or C', box: balloon, correct: 'C',
    reveal: { title: 'C fits: its two knobs and two holes match the gap.', lines: ['Air Balloon Valley · Ravensburger', `${fmtInt(Number(top.find(r => r.puzzle === 'Air Balloon Valley')!.solvers))} puzzlers`, 'No. 3 of all time'] },
    src: 'Mystery puzzle · Ravensburger · pieces cut by our generator', answerSrc: `Air Balloon Valley · Ravensburger · ${asOf('boxes-alltime-top')}`,
  };

  // Day 12 · Match the country: the puzzle a country solves far more than the rest of the world.
  const fi = sign('FI');
  const country: ChoiceQuiz = {
    day: 12, week: 2, key: 'country', kind: 'choice', type: 'Match the country', kicker: 'Match the country',
    question: `One country solves this puzzle ${Math.round(Number(fi.lift))}× more often than the rest of the world. Which?`, reply: 'A, B or C',
    options: [
      { letter: 'A', label: 'Sweden', flag: 'se' }, { letter: 'B', label: 'Finland', flag: 'fi' }, { letter: 'C', label: 'Denmark', flag: 'dk' },
    ],
    correct: 'B',
    reveal: { title: 'Finland. Moomins, of course.', lines: [`${fi.pct_local}% of puzzlers in Finland solved it`, `${fi.pct_world}% of puzzlers worldwide`, `${fi.puzzle} · ${fi.brand}`], box: box(fi) },
    src: `Mystery puzzle · ${fi.brand} · ${asOf('boxes-country-signatures')}`, answerSrc: `${fi.puzzle} · ${fi.brand} · ${asOf('boxes-country-signatures')}`,
  };

  // The picture-reveal mystery (V3): a Christmas puzzle that day 24 asks about.
  const mystery = box(subj('Enchanted Christmas'));
  return { quizzes: [faster, guess, higher, number, piece, country] as Quiz[], mystery, asOf: asOf('boxes-alltime-top') };
}

export type Content = ReturnType<typeof loadContent>;

/** Calendar: day N → date label (week 1 starts Mon 30 Nov 2026). */
export function dayDate(day: number): string {
  const d = new Date(Date.UTC(2026, 10, 30 + (day - 1) + Math.floor((day - 1) / 6)));
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
export const weekOf = (day: number) => Math.ceil(day / 6);
/** Placeholder draw-seed fingerprint (lab only: the real one is sha256 of the week's secret seed). */
export const FAKE_SEED = (week: number) => ['5c1e 9a07 d3b2 4f68', '3f9a 71c0 b84e 2d15', 'a612 0e9d 47cb 8f30', '9d4b 2a71 e05c 63f8'][week - 1];
