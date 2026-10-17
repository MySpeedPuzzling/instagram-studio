// Tolerant answer matching for the campaign quizzes. The rules are published with the official rules, so they stay
// simple to explain: case, accents, emoji and punctuation don't matter; a choice is a lone letter ("B", "b)", "(b)",
// "answer b") or the option's name with small typos; a message naming two different options doesn't count; numbers and
// times count within the quiz's tolerance; names count with small typos; an order is the letters in sequence.
//
// Every function here is pure: the same text and key always give the same verdict.

/** `pending` / `answered`: a valid guess in a closest-wins quiz (date), before / after the true answer is known. */
export type Verdict = 'correct' | 'wrong' | 'unparsed' | 'pending' | 'answered';

export interface ChoiceKey { type: 'choice'; day?: number; question?: string; options: Record<string, string>; correct: string; aliases?: Record<string, string[]> }
export interface NumberKey { type: 'number'; day?: number; question?: string; correct: number; unit?: 'min' | 's' | 'count' | string; tolerance?: { abs?: number; rel?: number } }
export interface TimeKey { type: 'time'; day?: number; question?: string; correct: string | number; tolerance?: { abs?: number } }
export interface TextKey { type: 'text'; day?: number; question?: string; accept: string[]; maxEditRatio?: number }
export interface OrderKey { type: 'order'; day?: number; question?: string; options: Record<string, string>; correct: string }
/** Closest guess wins (e.g. "the day we pass 300 million pieces"); `correct` stays null until the day is known. */
export interface DateKey { type: 'date'; day?: number; question?: string; correct: string | null; mode?: 'closest'; year?: number }
export type AnswerKey = ChoiceKey | NumberKey | TimeKey | TextKey | OrderKey | DateKey;

export interface MatchResult {
  /** What we read from the message: an option letter, a number (in the key's unit), seconds, a name, a letter order. */
  parsed: string | number | null;
  verdict: Verdict;
  reason: string;
}

// ------------------------------------------------------------------ normalisation

/** Lowercase, accents and emoji removed, punctuation to spaces (keeps digits and the separators : . , >), spaces collapsed. */
export function normalize(s: string): string {
  return s.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^\p{L}\p{N}:.,>' ]+/gu, ' ')
    .replace(/(^|\s)'+|'+(\s|$)/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/** Word tokens (letters and digits only). */
export const words = (s: string) => normalize(s).split(/[^\p{L}\p{N}']+/u).map(w => w.replace(/'/g, '')).filter(Boolean);

/** Optimal-string-alignment (restricted Damerau-Levenshtein) distance. */
export function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}

/** Allowed typos for a name of `len` letters: names under 6 letters must be exact (so "pairs" never reads as "Paris"),
 *  longer ones may have max(1, floor(len × ratio)) typos ("Londýn" → London, "capybaras" → Capybaras). */
export const allowedEdits = (len: number, ratio = 0.2) => (len < 6 ? 0 : Math.max(1, Math.floor(len * ratio)));

/**
 * Does `text` mention `name`? Exact word sequence, or a window of the same number of words within the allowed typos
 * (spaces ignored inside the window, so "newyork" matches "New York").
 */
export function mentions(text: string, name: string, ratio = 0.2): boolean {
  const t = words(text), n = words(name);
  if (!n.length || !t.length) return false;
  const target = n.join('');
  const max = allowedEdits(target.length, ratio);
  for (let size = Math.max(1, n.length - 1); size <= n.length + 1; size++) {
    for (let i = 0; i + size <= t.length; i++) {
      const win = t.slice(i, i + size).join('');
      if (win === target) return true;
      if (max && Math.abs(win.length - target.length) <= max && editDistance(win, target) <= max) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------ choice

const LEAD_INS = /^(?:my\s+)?(?:answer|guess|vote|choice|tip|odpoved|odpoveď|antwort|reponse|respuesta|risposta)\s*(?:is|:)?\s*/;

/** Option letters the message names: "B", "b!", "b)", "(b)", "answer b", "I think B". A lowercase "a" counts only when
 *  it is the whole answer or marked like "a)" / "(a)" / "answer a" (otherwise it's the English article). */
function lettersIn(raw: string, letters: string[]): Set<string> {
  const found = new Set<string>();
  const L = letters.map(l => l.toUpperCase());
  const stripped = raw.normalize('NFKD').replace(/\p{M}+/gu, '').trim();
  // The whole message is one letter (plus punctuation/emoji).
  const only = stripped.replace(/[^\p{L}\p{N}]+/gu, '');
  if (only.length === 1 && L.includes(only.toUpperCase())) return new Set([only.toUpperCase()]);
  const lead = normalize(stripped).replace(LEAD_INS, '');
  const first = lead.match(/^([a-z])(?:\s|$|[).:,])/);
  if (first && L.includes(first[1].toUpperCase()) && lead !== normalize(stripped)) found.add(first[1].toUpperCase());
  for (const m of stripped.matchAll(/(?<![\p{L}\p{N}])([A-Za-z])(?![\p{L}\p{N}])/gu)) {
    const ch = m[1], up = ch.toUpperCase();
    if (!L.includes(up)) continue;
    const before = stripped[(m.index ?? 0) - 1] ?? '', after = stripped[(m.index ?? 0) + 1] ?? '';
    const marked = after === ')' || before === '(' || after === '.' && /\s|$/.test(stripped[(m.index ?? 0) + 2] ?? '');
    if (ch === up) {
      // A capital "I" or "A" opening an English sentence ("I think B", "A London one") is not a choice.
      if (up === 'A' && !marked && /^\s*$/.test(stripped.slice(0, m.index)) && /^\s+\p{L}{2,}/u.test(stripped.slice((m.index ?? 0) + 1)) ) continue;
      found.add(up);
    } else if (ch !== 'a' || marked) found.add(up);
  }
  return found;
}

export function matchChoice(text: string, key: ChoiceKey): MatchResult {
  const letters = Object.keys(key.options);
  const named = lettersIn(text, letters);
  for (const [k, v] of Object.entries(key.options)) {
    for (const name of [v, ...(key.aliases?.[k] ?? [])]) if (mentions(text, name)) named.add(k.toUpperCase());
  }
  if (named.size === 0) return { parsed: null, verdict: 'unparsed', reason: 'no option letter or name found' };
  if (named.size > 1) return { parsed: null, verdict: 'unparsed', reason: `names several options (${[...named].sort().join(', ')})` };
  const [p] = named;
  return { parsed: p, verdict: p === key.correct.toUpperCase() ? 'correct' : 'wrong', reason: p === key.correct.toUpperCase() ? 'right option' : `option ${p}, correct is ${key.correct.toUpperCase()}` };
}

// ------------------------------------------------------------------ numbers and times

/** Strips "day 7" / "door 7" / "#7" prefixes, which name the quiz, not the answer. */
const stripDayRefs = (n: string) => n.replace(/\b(?:day|door|den|tag|dia|jour|quiz)\s*#?\s*\d+\b/g, ' ').replace(/#\s*\d+\b/g, ' ');

/** Numbers in a normalised string: "3,275" / "3 275" → 3275, "12,5" → 12.5, "12k" → 12000, "1.2 million" → 1200000. */
export function numbersIn(n: string): number[] {
  const out: number[] = [];
  const re = /(\d{1,3}(?:[ ,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|thousand|tisic|m|mil|million|milionu|milion)?(?![\p{L}])/gu;
  for (const m of n.matchAll(re)) {
    let s = m[1];
    if (/^\d{1,3}(?:[ ,]\d{3})+$/.test(s)) s = s.replace(/[ ,]/g, '');
    else s = s.replace(',', '.');
    let v = Number(s);
    const mult = m[2];
    if (mult === 'k' || mult === 'thousand' || mult === 'tisic') v *= 1e3;
    else if (mult && mult !== 'm') v *= 1e6; // "m" alone is minutes, not million
    else if (mult === 'm' && /million/.test(n)) v *= 1e6;
    if (Number.isFinite(v)) out.push(v);
  }
  return out;
}

/**
 * Durations in seconds: "1:04:54", "1:05" (h:mm or m:ss, both returned), "1h 5m", "65 min", "64m 54s", "3894 s",
 * "1 hour 5 minutes". Returns every reading of the first duration found.
 */
export function durationsIn(n: string): number[] {
  const hms = n.match(/\b(\d{1,2}):(\d{2}):(\d{2})\b/);
  if (hms) return [Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3])];
  const two = n.match(/\b(\d{1,3}):(\d{2})\b/);
  if (two) {
    const a = Number(two[1]), b = Number(two[2]);
    return [...new Set([a * 3600 + b * 60, a * 60 + b])];
  }
  const parts = [...n.matchAll(/(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hod|hodin|hours?|m|min|mins|minut[ae]?|minutes?|s|sec|secs|seconds?|sekund)\b/g)];
  if (parts.length) {
    let t = 0;
    for (const [, v, u] of parts) {
      const x = Number(v.replace(',', '.'));
      t += /^h/.test(u) ? x * 3600 : /^m/.test(u) ? x * 60 : x;
    }
    return [Math.round(t)];
  }
  return [];
}

const unitFactor = (unit?: string) => (unit === 'min' ? 60 : 1);

export function matchNumber(text: string, key: NumberKey): MatchResult {
  const n = normalize(stripDayRefs(text.toLowerCase()));
  let values: number[];
  if (key.unit === 'min' || key.unit === 's') {
    const durs = durationsIn(n);
    // A bare number is read in the key's unit ("about 64" → 64 min).
    values = durs.length ? durs.map(s => s / unitFactor(key.unit)) : numbersIn(n);
  } else values = numbersIn(n);
  const distinct = [...new Set(values.map(v => Math.round(v * 1000) / 1000))];
  if (!distinct.length) return { parsed: null, verdict: 'unparsed', reason: 'no number found' };
  // Two readings of one "1:05" are fine (we take the closer one); two different numbers in the message are not.
  const fromColon = /\b\d{1,3}:\d{2}\b/.test(n) && !/\b\d{1,2}:\d{2}:\d{2}\b/.test(n);
  if (distinct.length > 1 && !fromColon) return { parsed: null, verdict: 'unparsed', reason: `several numbers (${distinct.join(', ')})` };
  const tol = Math.max(key.tolerance?.abs ?? 0, (key.tolerance?.rel ?? 0) * Math.abs(key.correct));
  const best = distinct.reduce((a, b) => (Math.abs(b - key.correct) < Math.abs(a - key.correct) ? b : a));
  const ok = Math.abs(best - key.correct) <= tol + 1e-9;
  return { parsed: best, verdict: ok ? 'correct' : 'wrong', reason: ok ? `within ±${tol}` : `${best} is ${Math.round(Math.abs(best - key.correct) * 100) / 100} off (±${tol} allowed)` };
}

export function matchTime(text: string, key: TimeKey): MatchResult {
  const correct = typeof key.correct === 'number' ? key.correct : (() => { const p = String(key.correct).split(':').map(Number); return p.reduce((s, x) => s * 60 + x, 0); })();
  const n = normalize(stripDayRefs(text.toLowerCase()));
  let readings = durationsIn(n);
  if (!readings.length) {
    // A bare number: minutes ("65") — the way most people write a puzzle time.
    const nums = numbersIn(n);
    if (nums.length === 1) readings = [Math.round(nums[0] * 60)];
    else if (nums.length > 1) return { parsed: null, verdict: 'unparsed', reason: 'several numbers' };
  }
  if (!readings.length) return { parsed: null, verdict: 'unparsed', reason: 'no time found' };
  const tol = key.tolerance?.abs ?? 60;
  const best = readings.reduce((a, b) => (Math.abs(b - correct) < Math.abs(a - correct) ? b : a));
  const ok = Math.abs(best - correct) <= tol;
  return { parsed: best, verdict: ok ? 'correct' : 'wrong', reason: ok ? `within ±${tol} s` : `${Math.abs(best - correct)} s off (±${tol} s allowed)` };
}

// ------------------------------------------------------------------ names and orders

export function matchText(text: string, key: TextKey): MatchResult {
  const n = normalize(text);
  if (!n) return { parsed: null, verdict: 'unparsed', reason: 'empty after normalisation' };
  const hit = key.accept.find(a => mentions(text, a, key.maxEditRatio ?? 0.2));
  return hit ? { parsed: n, verdict: 'correct', reason: `matches "${hit}"` } : { parsed: n, verdict: 'wrong', reason: 'no accepted name found' };
}

export function matchOrder(text: string, key: OrderKey): MatchResult {
  const letters = Object.keys(key.options).map(l => l.toUpperCase());
  const n = normalize(text).replace(LEAD_INS, '');
  const seq = n.replace(/[\s,.:>\-]+/g, '').toUpperCase();
  const valid = seq.length === letters.length && [...seq].every(c => letters.includes(c)) && new Set(seq).size === letters.length;
  if (!valid) return { parsed: null, verdict: 'unparsed', reason: `not an order of ${letters.join('')}` };
  const ok = seq === key.correct.toUpperCase();
  return { parsed: seq, verdict: ok ? 'correct' : 'wrong', reason: ok ? 'right order' : `order ${seq}, correct is ${key.correct.toUpperCase()}` };
}

// ------------------------------------------------------------------ dates (closest wins)

const MONTHS: Array<[RegExp, number]> = [
  [/^(jan|january|januar|leden|ledna|enero|janvier|gennaio)$/, 1], [/^(feb|february|februar|unor|unora|febrero|fevrier|febbraio)$/, 2],
  [/^(mar|march|marz|brezen|brezna|marzo|mars)$/, 3], [/^(apr|april|duben|dubna|abril|avril|aprile)$/, 4],
  [/^(may|mai|kveten|kvetna|mayo|maggio)$/, 5], [/^(jun|june|juni|cerven|cervna|junio|juin|giugno)$/, 6],
  [/^(jul|july|juli|cervenec|cervence|julio|juillet|luglio)$/, 7], [/^(aug|august|srpen|srpna|agosto|aout)$/, 8],
  [/^(sep|sept|september|zari|septiembre|septembre|settembre)$/, 9], [/^(oct|october|oktober|rijen|rijna|octubre|octobre|ottobre)$/, 10],
  [/^(nov|november|listopad|listopadu|noviembre|novembre)$/, 11], [/^(dec|december|dezember|prosinec|prosince|diciembre|decembre|dicembre)$/, 12],
];
const monthOf = (w: string) => MONTHS.find(([re]) => re.test(w))?.[1] ?? null;
const iso = (y: number, m: number, d: number) => {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? t.toISOString().slice(0, 10) : null;
};

/**
 * Dates written many ways: "25 Nov", "Nov 25", "25th November", "Wednesday 25 Nov", "25.11.", "25/11", "2026-11-25",
 * "25. listopadu". Numeric d/m is read day-first unless the second number is over 12 ("11/25" → 25 Nov). The year
 * defaults to the key's year. Returns every distinct date found.
 */
export function datesIn(text: string, year = 2026): string[] {
  const t = text.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase();
  const out = new Set<string>();
  for (const m of t.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) { const d = iso(+m[1], +m[2], +m[3]); if (d) out.add(d); }
  const rest = t.replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, ' ');
  for (const m of rest.matchAll(/\b(\d{1,2})\s*[./]\s*(\d{1,2})(?:\s*[./]\s*(\d{2,4}))?\.?/g)) {
    const a = +m[1], b = +m[2];
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : year;
    const [d, mo] = b > 12 && a <= 12 ? [b, a] : [a, b];
    const v = iso(y, mo, d);
    if (v) out.add(v);
  }
  const toks = rest.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ');
  for (let i = 0; i < toks.length; i++) {
    const mo = monthOf(toks[i]);
    if (!mo) continue;
    const num = (w?: string) => (w && /^\d{1,2}(st|nd|rd|th)?$/.test(w) ? parseInt(w, 10) : null);
    const yearAfter = (j: number) => (toks[j] && /^\d{4}$/.test(toks[j]) ? +toks[j] : year);
    const before = num(toks[i - 1]) ?? (toks[i - 1] === 'of' ? num(toks[i - 2]) : null);
    const after = num(toks[i + 1]);
    if (before) { const v = iso(yearAfter(i + 1), mo, before); if (v) out.add(v); }
    else if (after) { const v = iso(yearAfter(i + 2), mo, after); if (v) out.add(v); }
  }
  return [...out].sort();
}

export function matchDate(text: string, key: DateKey): MatchResult {
  const ds = datesIn(text, key.year ?? 2026);
  if (!ds.length) return { parsed: null, verdict: 'unparsed', reason: 'no date found' };
  if (ds.length > 1) return { parsed: null, verdict: 'unparsed', reason: `several dates (${ds.join(', ')})` };
  if (!key.correct) return { parsed: ds[0], verdict: 'pending', reason: 'guess recorded; the true date is not known yet' };
  const diff = Math.round(Math.abs(Date.parse(ds[0]) - Date.parse(key.correct)) / 86_400_000);
  return { parsed: ds[0], verdict: 'answered', reason: `${diff} day(s) from ${key.correct}` };
}

export function matchAnswer(text: string, key: AnswerKey): MatchResult {
  switch (key.type) {
    case 'date': return matchDate(text, key);
    case 'choice': return matchChoice(text, key);
    case 'number': return matchNumber(text, key);
    case 'time': return matchTime(text, key);
    case 'text': return matchText(text, key);
    case 'order': return matchOrder(text, key);
  }
}

/** Throws on a malformed key file (checked before every collect). */
export function validateKey(k: unknown): AnswerKey {
  const key = k as AnswerKey;
  if (!key || typeof key !== 'object') throw new Error('key: not an object');
  if (key.type === 'choice' || key.type === 'order') {
    if (!key.options || Object.keys(key.options).length < 2) throw new Error('key: options need at least 2 entries');
    const letters = Object.keys(key.options).map(x => x.toUpperCase());
    if (!letters.every(l => /^[A-D]$/.test(l))) throw new Error('key: option letters must be A–D');
    if (key.type === 'choice' && !letters.includes(String(key.correct).toUpperCase())) throw new Error('key: correct must be one of the option letters');
    if (key.type === 'order' && [...String(key.correct).toUpperCase()].sort().join('') !== [...letters].sort().join('')) throw new Error('key: correct must be an order of all option letters');
  } else if (key.type === 'number') {
    if (typeof key.correct !== 'number') throw new Error('key: correct must be a number');
  } else if (key.type === 'time') {
    if (!/^\d+(:\d{2}){0,2}$/.test(String(key.correct))) throw new Error('key: correct must be seconds or h:mm:ss');
  } else if (key.type === 'date') {
    if (key.correct !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(key.correct))) throw new Error('key: correct must be YYYY-MM-DD or null');
  } else if (key.type === 'text') {
    if (!Array.isArray(key.accept) || !key.accept.length) throw new Error('key: accept needs at least one name');
  } else throw new Error(`key: unknown type ${(key as { type?: string }).type}`);
  return key;
}
