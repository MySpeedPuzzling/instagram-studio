// Lists the comments (and replies) under the latest posts, read-only: for proposing replies to the owner.
// Other people's usernames are not returned by the API; match comments by their text.
//
//   node tools/comments.ts [n=6]     # the latest n posts
import { igClient } from '../src/ig/api.ts';

const ig = igClient(), n = Number(process.argv[2] ?? 6);
try {
  const media = (await ig.get('me/media', { fields: 'id,permalink,timestamp,comments_count,caption', limit: n })).data;
  for (const m of media) {
    console.log(`\n## ${m.timestamp} ${m.permalink} (${m.comments_count} comments) ${String(m.caption ?? '').slice(0, 50).replace(/\n/g, ' ')}`);
    if (!m.comments_count) continue;
    const cs = await ig.all(`${m.id}/comments`, { fields: 'id,text,username,timestamp,like_count,replies{text,username,timestamp}', limit: 50 });
    for (const c of cs) {
      console.log(`- [${c.timestamp.slice(5, 16)}] ${c.username ? '@' + c.username : 'someone'} (likes ${c.like_count}): ${c.text}`);
      for (const r of c.replies?.data ?? []) console.log(`    reply ${r.username ? '@' + r.username : 'someone'}: ${r.text}`);
    }
  }
} catch (e) { console.error(String((e as Error).message)); process.exit(1); }
