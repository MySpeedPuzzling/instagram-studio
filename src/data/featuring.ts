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

const INVALID_HANDLES = join(ROOT, 'content/ig-invalid-handles.json');

/** Instagram handles (from MSP profiles) that Instagram rejected as photo tags; never tag them again. Local file. */
export function invalidHandles(): Set<string> {
  if (!existsSync(INVALID_HANDLES)) return new Set();
  return new Set(((JSON.parse(readFileSync(INVALID_HANDLES, 'utf8')).handles ?? []) as string[]).map(h => h.toLowerCase()));
}
