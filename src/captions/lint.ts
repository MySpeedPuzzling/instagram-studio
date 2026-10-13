// Caption lint: the automatable half of the MSP voice & caption playbook (v0.1, research note
// "captions_voice_hashtags.md" §9). The owner check (human touch, facts snapshot, tag eligibility) stays manual.
//
//   node src/captions/lint.ts caption.txt --pillar carousel
//   echo "…" | node src/captions/lint.ts - --pillar single

export type Pillar = 'carousel' | 'single' | 'reel' | 'report' | 'story';

const LENGTH: Record<Pillar, [number, number]> = {
  carousel: [300, 800], single: [150, 500], reel: [125, 500], report: [300, 1000], story: [0, 300],
};

// AI-writing tells (Wikipedia "Signs of AI writing", 2026) plus social clichés from the playbook.
const BANNED_WORDS = [
  'additionally', 'align with', 'boasts', 'bolstered', 'crucial', 'deep dive', 'delve', 'emphasizing', 'enduring',
  'enhance', 'fostering', 'garner', 'interplay', 'intricate', 'landscape', 'meticulous', 'pivotal', 'robust',
  'showcase', 'showcasing', 'tapestry', 'testament', 'underscore', 'vibrant', 'leverage', 'multifaceted',
  'game-changer', 'game changer', "let's dive in", 'dive in', 'thrilled to announce', 'excited to announce',
  'exciting news', 'hey puzzlers', "don't miss out", 'in the world of', 'elevate', 'unlock', 'embark', 'journey',
  'piece of mind', 'falling into place', 'piece by piece', 'fam',
];
const BANNED_CTA = [/comment\s+["“]?\p{Extended_Pictographic}/u, /type\s+(yes|no)\b/i, /like if\b/i, /tag \d+ friends?/i, /tag (a|three|3) friends?/i, /double[- ]tap/i];
const BANNED_HASHTAGS = ['#puzzle', '#puzzles', '#instagood', '#explore', '#fyp', '#reels', '#explorepage'];
const BANNED_EMOJI = ['✨', '🚀', '💡', '✅', '👉', '🔥', '💯', '🙌', '🎯'];

export interface LintResult { errors: string[]; warnings: string[]; stats: Record<string, number> }

export function lintCaption(text: string, pillar: Pillar = 'carousel'): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const caption = text.replace(/\r/g, '').trim();
  const chars = [...caption].length; // code points, like Instagram's counter
  const lines = caption.split('\n');
  const hook = [...caption].slice(0, 125).join('');

  const [min, max] = LENGTH[pillar];
  if (chars > 2200) errors.push(`caption is ${chars} characters; Instagram's limit is 2,200`);
  if (chars > 1000 && pillar !== 'report') errors.push(`caption is ${chars} characters; never over 1,000`);
  if (chars < min || chars > max) warnings.push(`length ${chars} outside the ${pillar} target ${min}–${max}`);

  if (!/\d/.test(hook)) warnings.push('the first 125 characters carry no number');
  if (/#\w/.test(hook)) errors.push('hashtag inside the hook (first 125 characters)');

  if (/[—–]/.test(caption.replace(/\d–\d/g, ''))) errors.push('em/en dash used as punctuation (house rule: zero dashes)');
  const lower = caption.toLowerCase();
  for (const w of BANNED_WORDS) if (new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(lower)) errors.push(`banned phrase: "${w}"`);
  if (/\bnot (just |only |merely )?[\p{L}' -]{1,40}, but\b/iu.test(caption) || /\brather than\b/i.test(caption)) warnings.push('"not X but Y" / "rather than" construction');
  for (const r of BANNED_CTA) if (r.test(caption)) errors.push(`engagement-bait CTA: ${r}`);

  const emoji = caption.match(/\p{Extended_Pictographic}/gu) ?? [];
  if (emoji.length > 3) errors.push(`${emoji.length} emoji; budget is 0–3`);
  for (const e of emoji) if (BANNED_EMOJI.includes(e)) errors.push(`banned emoji ${e}`);
  for (const l of lines) if (/^\s*\p{Extended_Pictographic}/u.test(l)) errors.push(`emoji at a line start: "${l.slice(0, 30)}"`);
  if ((hook.match(/\p{Extended_Pictographic}/gu) ?? []).length > 1) warnings.push('more than one emoji in the hook');

  const bangs = (caption.match(/!/g) ?? []).length;
  if (bangs > 1) errors.push(`${bangs} exclamation marks; at most one`);
  if (/!!/.test(caption)) errors.push('"!!"');
  if (/\b[A-Z]{4,}\b/.test(caption.replace(/#\w+|@\w+|\b(WJPC|EJPC|USAJPA|WJPF|MSP|PB|PPM|XP)\b/g, ''))) warnings.push('ALL CAPS word');
  if (/[\u{1D400}-\u{1D7FF}]/u.test(caption)) errors.push('Unicode bold/italic letters');

  const hashtags = caption.match(/#[\p{L}\d_]+/gu) ?? [];
  if (pillar !== 'story') {
    if (hashtags.length > 5) errors.push(`${hashtags.length} hashtags; hard max 5`);
    else if (hashtags.length > 4) warnings.push(`${hashtags.length} hashtags; target 2–4`);
    else if (hashtags.length < 2) warnings.push(`${hashtags.length} hashtags; target 2–4`);
    const last = lines[lines.length - 1];
    if (hashtags.length && hashtags.some(t => !last.includes(t))) warnings.push('hashtags belong on the last line only');
  } else if (hashtags.length) errors.push('no hashtags in Stories');
  for (const t of hashtags) if (BANNED_HASHTAGS.includes(t.toLowerCase())) errors.push(`banned hashtag ${t}`);

  const mentions = caption.match(/@[\w.]+/g) ?? [];
  if (mentions.length > 15) errors.push(`${mentions.length} mentions; 15 max (API allows 20)`);

  // Strings of short fragments are a 2026 AI tell: flag 3+ consecutive sentences under 6 words.
  const sentences = caption.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  let run = 0, maxRun = 0;
  for (const s of sentences) { run = s.split(/\s+/).length < 6 ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
  if (maxRun >= 3) warnings.push(`${maxRun} short fragments in a row`);

  return { errors, warnings, stats: { chars, hashtags: hashtags.length, mentions: mentions.length, emoji: emoji.length, sentences: sentences.length } };
}

if (import.meta.main) {
  const { readFileSync } = await import('node:fs');
  const args = process.argv.slice(2);
  const src = args[0];
  const pillar = (args[args.indexOf('--pillar') + 1] ?? 'carousel') as Pillar;
  if (!src) { console.error('usage: node src/captions/lint.ts <file|-> [--pillar carousel|single|reel|report|story]'); process.exit(2); }
  const text = src === '-' ? readFileSync(0, 'utf8') : readFileSync(src, 'utf8');
  const r = lintCaption(text, args.includes('--pillar') ? pillar : 'carousel');
  console.log(JSON.stringify(r, null, 1));
  process.exitCode = r.errors.length ? 1 : 0;
}
