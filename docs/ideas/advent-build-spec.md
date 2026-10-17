# Advent of Puzzle: shared build spec (session 2026-10-17, for the forks)

## Calendar (Prague time; CET = UTC+1 in December)
Day N, date, week:
- W1: D1 Mon 30 Nov, D2 Tue 1 Dec, D3 Wed 2 Dec, D4 Thu 3 Dec, D5 Fri 4 Dec, D6 Sat 5 Dec; draw Sun 6 Dec
- W2: D7 Mon 7, D8 Tue 8, D9 Wed 9, D10 Thu 10, D11 Fri 11, D12 Sat 12; draw Sun 13 Dec
- W3: D13 Mon 14, D14 Tue 15, D15 Wed 16, D16 Thu 17, D17 Fri 18, D18 Sat 19; draw Sun 20 Dec
- W4: D19 Mon 21, D20 Tue 22, D21 Wed 23, D22 Thu 24, D23 Fri 25, D24 Sat 26; draw Sun 27 Dec
- Announcement: Sun 29 Nov 2026 (1st Advent) feed carousel + Story (countdown sticker to Mon 30 Nov 19:00).
- Daily quiz Story ("door") at **19:00 Prague** (18:00 UTC). Answer window = story timestamp → +24 h.
  Each evening Story set: frame 1 yesterday's answer (from D2), frame 2 today's quiz. Sunday: Sat's answer + winner + seed reveal.
- Sunday feed carousel "Advent week N: the six answers + the winner + how the draw works" (19:30 after the draw).
- Normal posts continue: Mon 19:00 Weekly Numbers (feed), Wed/Thu data story, Fri rotating; the Sat community slot
  is replaced by the Sunday Advent recap. Never two carousels the same day. Last Dec: 24 Dec −30 %, 25 Dec −17 % vs Dec avg.

## Answer route (primary, to verify on the test Story)
- People **reply to the quiz Story** (Story reply = Instagram DM). The quiz frame has NO sticker (a poll/quiz sticker's
  voters can't be read via the API). Text cue near the bottom: "Reply to this Story: A, B or C" with a down arrow towards
  Instagram's reply field (which sits below the card on tall phones; keep cue text inside y ≤ 1720).
- Verified 2026-10-17 on our inbox: replies arrive as messages with `story.reply_to {id, link}` + `message` + `from{id,username}`
  + `created_time`; also appears on replies WE send to others' stories → filter: `from.id !== our id` AND
  `story.reply_to.id ∈ ids of our own stories for that day`. `me/stories` lists only live stories → snapshot ids while live.
  Some reply_to lack `id` → attribute by time window only if exactly one campaign story was live; mark `inferred`.
- Fallback source: comments on a feed media (`/{media}/comments` fields id,text,timestamp,from{id,username} + replies), window-filtered.

## Answer keys (gitignored; repo is public): `content/campaign/advent-2026/keys/day-NN.json`
```json
{ "day": 7, "type": "choice", "question": "…", "options": { "A": "Paris", "B": "London", "C": "New York" },
  "correct": "B", "aliases": { "B": ["london postcard"] } }
{ "day": 9, "type": "number", "question": "…", "correct": 64.9, "unit": "min", "tolerance": { "abs": 1 } }
{ "day": 11, "type": "time", "correct": "1:04:54", "tolerance": { "abs": 60 } }        // seconds
{ "day": 13, "type": "text", "accept": ["Curious Capers of the Capybaras", "capybaras"], "maxEditRatio": 0.2 }
{ "day": 15, "type": "order", "options": { "A": "…", "B": "…", "C": "…" }, "correct": "BCA" }
```
Matching rules (published in the rules): case/diacritics/emoji/punctuation-insensitive; choice = a lone letter, "B)",
"(b)", "answer b", or the option text (fuzzy); a message naming two different options is invalid; number/time within the
tolerance; text: normalised Damerau-Levenshtein ≤ max(1, floor(len×ratio)) or the accepted token contained; order = the
letters in sequence ("BCA", "b, c, a", "B > C > A").
**One answer per person per day: the first parseable answer counts** (unparseable chatter like "good luck" is ignored and
listed for review); later answers = duplicate; after the 24 h = late; excluded accounts (our own, team) = excluded.

## Store (gitignored): `content/campaign/advent-2026/`
- `stories.jsonl` snapshots of our live stories (id, timestamp, seen_at); `story-map.json` day → story ids (auto by window
  date, or set manually with `--story <id>`).
- `day-NN/raw.json` (union of relevant messages keyed by message id, minimal fields), `entries.json` (one row per message:
  verdict correct|wrong|unparsed|duplicate|late|excluded), `correct.json` (sorted users), `audit.md`, `runs.jsonl`.
  Idempotent: entries are a pure function of (raw union, key); no run timestamps inside entries/correct.
- `week-N/pool.json`, `week-N/seed.json` (commitment), `week-N/seed.secret.json`, `week-N/draw.json` (full, local),
  `week-N/draw-public.md` (publishable, no other usernames), `week-N/winner/` (draft Story frame + caption, for approval).
- `excluded.json` { user_ids, usernames } (our account + team). `alerts.log` failures.

## Weekly eligibility (owner decides; CLI `--rule`): `all6` | `any` | `tickets` (one ticket per correct answer; Claude's recommendation)
Option: previous winners excluded from later weeks (recommended: yes, so 4 different people win).

## Draw (commit–reveal, reproducible)
- `seed <week>` (before the week's D1 story): 32 random bytes → secret; commitment = sha256(secret) published (Monday's
  quiz Story frame small print + the announcement/week post caption).
- `draw <week>` (after D6 + 24 h): verify sha256(secret) = commitment; tickets per rule: `username#k` (lowercased username
  at entry; k = 1..tickets); score = sha256(`${secret}|advent-2026|week-${n}|${ticket}`); lowest wins; next 3 = back-ups.
- Public audit: seed revealed, commitment, rule, ticket count, winner username + score, and every ticket as
  (score, sha256("advent-2026|" + username) first 10 hex) so each entrant can find and check their own ticket.
- Never auto-publish, never DM. Drafts the winner Story/caption for approval.

## Scheduling (launchd LaunchAgent, NOT installed; print plist + exact commands)
Label `cz.myspeedpuzzling.instagram.advent`; `node tools/campaign.ts tick` at 09:00, 13:00, 17:00, 19:30, 23:30 Prague:
snapshot live story ids; collect provisional for the live day; final-collect every day whose window closed and isn't final;
on Sunday 19:30 run week + draw → winner draft; 3 retries (2/5/10 min); failure → `alerts.log` + macOS notification
(osascript) + status shows "needs attention". DMs persist, so a later tick catches up (but story ids must be snapshotted live).

## Visual (lab AD1, H4 house style)
Campaign poster colour: **coral** (events/timely) by default; ocean as the alternative to compare.
Day-N-of-24 device options: (a) 6×4 generator jigsaw calendar (rows = weeks, columns = Mon–Sat; past filled ink, today coral,
future outlined, day numbers), (b) 6×4 jigsaw that reveals a box image piece by piece (day 24 asks "which puzzle is it?"),
(c) a big door number on the poster top ("7" + "of 24").
Quiz types to prototype (cached data, real box images): which-is-faster (A/B/C boxes), guess-the-puzzle (box crop zoom,
A/B/C), higher-or-lower (two themes/puzzles, A/B), guess-the-number (tolerance), missing piece (generator pieces: which of
3 shapes fits the gap; answer by construction), match-the-country/brand (A/B/C).
