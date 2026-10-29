// Follow-up Story of the "5 new achievements" Reel (owner 2026-10-29: holder numbers go only into the Story, queried
// fresh on the day: queries/achievements-new-holders.sql, private profiles excluded). A sticker Story: the link sticker
// to myspeedpuzzling.com/en/achievements is placed by hand in the zone under "Reveal yours".
import { STICKER_STORY_ROWS, frame, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtInt } from '../design/page.ts';
import type { QueryResult } from '../data/db.ts';

const art = (key: string, tier: number) => `/content/assets/achievements/webp480/${key}-t${tier}.webp`;

export interface HolderFacts { queriedAt: string; active: number; holders: (type: string, tier: number) => number }

export function holderFacts(q: QueryResult): HolderFacts {
  const active = Number(q.rows[0]?.active_players ?? 0);
  if (!active) throw new Error('achievements-new-holders: no rows');
  return { queriedAt: q.queried_at, active, holders: (type, tier) => Number(q.rows.find(r => r.type === type && Number(r.tier) === tier)?.holders ?? 0) };
}

/** "almost 1 in 3" / "over 1 in 4" / "1 in 5": the share as a puzzler would say it. */
export function oneIn(part: number, whole: number) {
  const r = whole / part, n = Math.round(r);
  return `${Math.abs(r - n) < 0.05 ? '' : r > n ? 'almost ' : 'over '}1 in ${n}`;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function achievementsStory(v: Variant, f: HolderFacts): string {
  const mm = f.holders('muscle_memory', 1), compD = f.holders('competitor', 5), owlD = f.holders('night_owl', 5);
  const row = (top: number, img: string, locked: boolean, html: string) => `<img src="${img}" alt="" style="position:absolute; left:88px; top:${top}px; width:190px; height:190px${locked ? '; filter:grayscale(1); opacity:.45' : ''}">
    <p class="h-abs h-lead" style="top:${top + 30}px; left:310px; width:680px">${html}</p>`;
  const hot = (s: string) => `<b style="color:var(--g-hot-text)">${h(s)}</b>`;
  return frame({
    ground: 'navy', kind: 'story', kicker: 'New · achievements', device: v.device, src: '', rows: STICKER_STORY_ROWS, masthead: true,
    body: `<h1 class="h-title" style="top:380px; font-size:80px; line-height:1.06">Already earned?</h1>
      ${row(560, art('muscle_memory', 1), false, `${hot(cap(oneIn(mm, f.active)))} puzzlers already have <b>Muscle Memory</b>`)}
      ${row(800, art('competitor', 5), compD === 0, compD === 0 ? `${hot('Nobody')} has <b>Diamond Competitor</b> yet: 25 in-person competitions` : `Only ${hot(fmtInt(compD))} have <b>Diamond Competitor</b>: 25 in-person competitions`)}
      ${row(1040, art('night_owl', 5), false, `${hot(fmtInt(owlD))} <b>Night Owls</b> made Diamond: 250 late-night results`)}
      <p class="h-abs h-lab" style="top:1290px">Your past solves count. Reveal yours ↓</p>
      <p class="h-abs h-lab" style="top:1560px; font-size:30px">Data ${h(f.queriedAt.slice(0, 10))} · public profiles</p>`,
  });
}
