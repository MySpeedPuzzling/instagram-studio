// Design lab DL4: the house system. All approved content from DL1–DL3 in one object; only the design changes.
// Every number comes from the cached production queries (content/cache); re-query with --fresh before any of this
// becomes a real post (owner rule: fresh data on the day a post is finalised).
import { loadContent as dl1 } from '../dl1/content.ts';
import { loadContent as dl2 } from '../dl2/content.ts';
import { loadContent as dl3 } from '../dl3/content.ts';

export function loadContent() {
  const a = dl1();
  return { ...dl3(), dl1: a, dl2: dl2(), asOf: a.asOf, source: a.source };
}

export type Content = ReturnType<typeof loadContent>;
