// Guard for the data rules in CLAUDE.md: every query that reads results (puzzle_solving_time) or stopwatch
// sessions must exclude suspicious results, and every query that reads players must exclude private profiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '../../queries');
const queries = readdirSync(DIR).filter(f => f.endsWith('.sql')).map(f => ({ f, sql: readFileSync(join(DIR, f), 'utf8').replace(/--[^\n]*/g, '') }));
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

test('every read of puzzle_solving_time excludes suspicious results', () => {
  for (const { f, sql } of queries) {
    const reads = count(sql, /\bpuzzle_solving_time\b/g);
    const filters = count(sql, /NOT\s+\w+\.suspicious\b|\b\w+\.suspicious\s*=\s*false|\bAND\s+\w+\.suspicious\)/gi);
    assert.ok(filters >= reads, `${f}: ${reads} read(s) of puzzle_solving_time but ${filters} suspicious filter(s)`);
  }
});

test('every stopwatch scan drops sessions with a suspicious result', () => {
  for (const { f, sql } of queries) {
    const scans = count(sql, /\bFROM\s+stopwatch\b/gi);
    const guards = count(sql, /NOT EXISTS\s*\(\s*SELECT 1 FROM puzzle_solving_time \w+ WHERE[^)]*\.suspicious\)/gi)
      + count(sql, /JOIN puzzle_solving_time \w+ ON[^\n]*NOT \w+\.suspicious/gi);
    assert.ok(guards >= scans, `${f}: ${scans} stopwatch scan(s) but ${guards} suspicious guard(s)`);
  }
});

test('every query reading players excludes private profiles', () => {
  for (const { f, sql } of queries) {
    if (!/\bJOIN\s+player\b|\bFROM\s+player\b/i.test(sql)) continue;
    assert.match(sql, /NOT\s+(coalesce\(\s*)?(\w+\.)?is_private\b/i, `${f}: reads player without excluding private profiles`);
  }
});
