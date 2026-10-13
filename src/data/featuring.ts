// Who may be named or tagged in a post. The SQL side applies MSP's visibility rules (public profile, not
// ranking-opted-out, per-post-type opt-outs); this applies the owner's local do-not-feature list on top.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

const FILE = join(ROOT, 'content/do-not-feature.json');

export function doNotFeature(): Set<string> {
  if (!existsSync(FILE)) return new Set();
  return new Set((JSON.parse(readFileSync(FILE, 'utf8')).player_ids ?? []) as string[]);
}

/** Drops rows whose player_id is on the do-not-feature list. */
export function featurable<T extends { player_id: string }>(rows: T[]): T[] {
  const blocked = doNotFeature();
  return rows.filter(r => !blocked.has(r.player_id));
}
