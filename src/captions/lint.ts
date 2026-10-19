// Caption lint: the automatable half of the MSP voice & caption playbook (v0.1, research note
// "captions_voice_hashtags.md" §9). The owner check (human touch, facts snapshot, tag eligibility) stays manual.
//
//   node src/captions/lint.ts caption.txt --pillar carousel
//   echo "…" | node src/captions/lint.ts - --pillar single
//   node src/captions/lint.ts caption.txt --search "speed puzzling,500 piece puzzle"

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
  // Stock and creator-bait phrases from the instagram-agent-skill lexicon (review 2026-10-18), only those that never
  // fit our voice; puzzle words like "iconic", "stunning", "level up" stay allowed.
  "here's the thing", 'let that sink in', 'read that again', 'buckle up', 'without further ado', 'spoiler alert',
  'stop scrolling', "don't scroll", "you won't believe", 'nobody is talking about', 'no one is talking about',
  'this changed everything', 'this is your sign', 'follow for more', 'tag someone who', 'drop a comment below',
  'the algorithm', 'go viral', 'seamless', 'groundbreaking', 'unleash', 'supercharge', 'skyrocket', 'plethora',
  'myriad', 'realm', 'moreover', 'furthermore', 'in conclusion', 'as an ai',
];
// Sentence shapes that read as generated: warnings, because rewriting them needs judgement.
const STRUCTURES: Array<[RegExp, string]> = [
  [/\bit'?s not (?:just|only) [^.!?\n]{2,60}[,.;] it'?s\b/i, '"it\'s not just X, it\'s Y"'],
  [/\b(?:this|it) is(?:n'?t| not) about [^.!?\n]{2,60}[.!] it'?s about\b/i, '"it isn\'t about X. It\'s about Y."'],
  [/(?:^|[.!?]\s+)(?:the (?:result|best part|kicker|catch|answer|twist))\?/im, 'staged reveal ("The result?"): say it inline'],
  [/\bhere'?s what (?:i|we) (?:learned|found)\b/i, '"here\'s what we found": state the finding'],
  [/\b(?:in (?:this|today'?s) (?:video|reel|post)|we'?re going to show you)\b/i, 'preamble ("in this post…"): start at the payoff'],
  [/(?:^|\n)\s*(?:in summary|to summarize|to sum up)\b/i, 'essay closer ("in summary")'],
  [/\b(?:thoughts\?|agree\?|who else\b[^?]*\?|am i wrong\?|let me know in the comments)/i, 'generic question; ask one only we could ask, about this post'],
];
// Zero-width and other invisible format characters that ride along in copy-paste. ZWJ inside emoji sequences is fine.
const INVISIBLE = /[\u00AD\u061C\u180E\u200B\u200C\u200E\u200F\u2060-\u2064\uFEFF\u{E0000}-\u{E007F}]|(?<!\p{Extended_Pictographic}\uFE0F?)\u200D|\u200D(?!\p{Extended_Pictographic})/u;
const BANNED_CTA = [/comment\s+["“]?\p{Extended_Pictographic}/u, /type\s+(yes|no)\b/i, /like if\b/i, /tag \d+ friends?/i, /tag (a|three|3) friends?/i, /double[- ]tap/i];
const BANNED_HASHTAGS = ['#puzzle', '#puzzles', '#instagood', '#explore', '#fyp', '#reels', '#explorepage'];
const BANNED_EMOJI = ['✨', '🚀', '💡', '✅', '👉', '🔥', '💯', '🙌', '🎯'];

export interface LintResult { errors: string[]; warnings: string[]; stats: Record<string, number> }

export interface LintOptions {
  /** Phrases a puzzler would type into Instagram search ("speed puzzling", "500 piece puzzle"). Search reads the
   *  caption text, so each must appear as plain words; hashtags and "MySpeedPuzzling" don't count. */
  searchPhrases?: string[];
  /** Names the caption quotes verbatim (puzzles, brands, players): skipped by the banned-word check ("Vibrant Vases"). */
  properNouns?: string[];
}

export function lintCaption(text: string, pillar: Pillar = 'carousel', opts: LintOptions = {}): LintResult {
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

  if (/[—–]/.test(caption.replace(/\d–\d/g, ''))) errors.push('em/en dash used as punctuation (house rule: zero dashes)');
  const lower = caption.toLowerCase();
  const unnamed = (opts.properNouns ?? []).filter(Boolean).reduce((t, n) => t.split(n.toLowerCase()).join(' '), lower);
  for (const w of BANNED_WORDS) if (new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(unnamed)) errors.push(`banned phrase: "${w}"`);
  if (/\bnot (just |only |merely )?[\p{L}' -]{1,40}, but\b/iu.test(caption) || /\brather than\b/i.test(caption)) warnings.push('"not X but Y" / "rather than" construction');
  for (const r of BANNED_CTA) if (r.test(caption)) errors.push(`engagement-bait CTA: ${r}`);
  for (const [r, name] of STRUCTURES) if (r.test(caption)) warnings.push(name);
  // Owner 2026-10-18: no US comma groups ("8,103"); write 8103, and 12 450 with a narrow space from 10 000 (fmtInt).
  if (/\d,\d{3}(?!\d)/.test(caption)) errors.push('comma as thousands separator ("8,103"): write 8103, or 12 450 from 10 000 up (fmtInt)');
  if (INVISIBLE.test(caption)) errors.push('invisible character (zero-width, soft hyphen or similar); retype the text');

  // Plain words only: drop hashtags and mentions, treat hyphens as spaces ("500-piece" = "500 piece").
  const plain = (s: string) => s.toLowerCase().replace(/[#@][\p{L}\d_.]+/gu, ' ').replace(/[-‐]/g, ' ').replace(/\s+/g, ' ');
  const phrases = (opts.searchPhrases ?? []).map(s => s.trim()).filter(Boolean);
  const has = (s: string, p: string) => new RegExp(`(^|[^\\p{L}\\d])${plain(p).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\d]|$)`, 'u').test(plain(s));
  const missing = phrases.filter(p => !has(caption, p));
  if (missing.length) warnings.push(`search phrase not in the caption text: ${missing.map(p => `"${p}"`).join(', ')}`);
  if (phrases.length && !phrases.some(p => has(hook, p))) warnings.push('no search phrase in the hook (first 125 characters)');

  const emoji = caption.replace(/[\u00A9\u00AE\u2122]/g, '').match(/\p{Extended_Pictographic}/gu) ?? []; // © ® ™ are not emoji
  if (emoji.length > 3) errors.push(`${emoji.length} emoji; budget is 0–3`);
  for (const e of emoji) if (BANNED_EMOJI.includes(e)) errors.push(`banned emoji ${e}`);
  for (const l of lines) if (/^\s*\p{Extended_Pictographic}/u.test(l)) errors.push(`emoji at a line start: "${l.slice(0, 30)}"`);
  if ((hook.match(/\p{Extended_Pictographic}/gu) ?? []).length > 1) warnings.push('more than one emoji in the hook');

  const bangs = (caption.match(/!/g) ?? []).length;
  if (bangs > 1) errors.push(`${bangs} exclamation marks; at most one`);
  if (/!!/.test(caption)) errors.push('"!!"');
  if (/\b[A-Z]{4,}\b/.test(caption.replace(/#\w+|@\w+|\b(WJPC|EJPC|USAJPA|WJPF|MSP|PB|PPM|XP)\b/g, ''))) warnings.push('ALL CAPS word');
  if (/[\u{1D400}-\u{1D7FF}]/u.test(caption)) errors.push('Unicode bold/italic letters');

  // Hashtags are topic labels, not a reach lever (owner decision 2026-10-17 after research_notes/MSP Instagram design and
  // growth toolkit/hashtags_2026.md): 3–5 specific tags on the last line; none in the hook; none in Stories.
  const hashtags = caption.match(/#[\p{L}\d_]+/gu) ?? [];
  if (/#\w/.test(hook)) errors.push('hashtag inside the hook (first 125 characters)');
  if (pillar !== 'story') {
    if (hashtags.length > 5) errors.push(`${hashtags.length} hashtags; hard max 5`);
    else if (hashtags.length < 3) warnings.push(`${hashtags.length} hashtags; target 3–5 specific topic labels`);
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
  const search = args.includes('--search') ? args[args.indexOf('--search') + 1].split(',') : undefined;
  const r = lintCaption(text, args.includes('--pillar') ? pillar : 'carousel', { searchPhrases: search });
  console.log(JSON.stringify(r, null, 1));
  process.exitCode = r.errors.length ? 1 : 0;
}
