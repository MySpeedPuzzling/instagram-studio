// Design lab DL3: prototypes of the brainstorm's top ideas (docs/ideas/brainstorm-2026-10.md).
// Each format loads its own data from cached queries (queries/bs-*.sql etc.) with query(); this module only
// carries what all formats share. Re-query with --fresh before any of these becomes a real post.
export function loadContent() {
  return {
    asOf: '13 Oct 2026',
    source: 'Data: myspeedpuzzling.com · 13 Oct 2026',
  };
}

export type Content = ReturnType<typeof loadContent>;
