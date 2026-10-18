# @myspeedpuzzling profile check (2026-10-18)

One-off check against the 12-part profile rubric from the instagram-agent-skill review
(`external_instagram_agent_skill_review.md`), adapted to a community brand (the "offer" is the free MSP app/site).
Sources: Instagram API (read-only: `me`, `me/media`, comments, `me/stories`, 28-day account insights) and the first
9 grid tiles. Highlights, pinned posts and the account category aren't readable via the API: pending the owner.

## Snapshot

- Name field "MySpeedPuzzling", handle myspeedpuzzling, BUSINESS account, 2,430 followers, 91 posts, link
  https://myspeedpuzzling.com (no UTM).
- Bio (unchanged since the 13 Oct audit): "Every solve counts 🧩 Your pieceful corner for tracking times, sharing progress &
  loving the puzzle. MySpeedPuzzling.com ⏱️"
- Last 28 days: reach 2,464, profile views 283, website clicks 49, accounts engaged 207.
- Posting: 17 Oct (first pipeline post), then a 4-week gap back to 14–17 Sep, then a 6-month gap back to March.
- Comments vs replies, last 9 posts: 103+ comments, 7 replies of any kind (the API hides who wrote replies). The
  newest post's 3 comments are unanswered.
- One Story live (17 Oct poll).

## Score: 47/100 (category/contact still unchecked, up to 6 more)

| Item | Score | Why |
|---|---|---|
| Name field | 4/12 | Brand name only. The name field is what Instagram search matches, and "MySpeedPuzzling" as one word may not match a search for "speed puzzling" or "puzzle timer". |
| Bio line one | 4/12 | A slogan plus a pun ("pieceful") instead of who it's for and what they get; puns are on our banned list. |
| Bio body | 2/8 | No proof (we have strong numbers: thousands of puzzlers, half a million solves, 84 countries); repeats the link that's already shown. |
| Pinned three | 0/10 | Nothing pinned (owner). |
| Link | 6/8 | One clear door that matches the bio. Missing UTM tags, so sign-ups from Instagram can't be measured (13 Oct audit). |
| Highlights | 0/8 | None (owner). |
| Grid legibility | 2/8 | Only 1 of the first 9 tiles reads as "speed-puzzling numbers"; the rest are app screenshots, feature launches and team photos. Fixes itself as pipeline posts land; pinning speeds it up. |
| Photo | 5/6 | Logo, right for a brand. |
| Handle | 6/6 | Sayable, same as the domain. |
| Category / contact | ?/6 | BUSINESS account (insights work); category and contact buttons pending. |
| Recent activity | 4/10 | Posted yesterday, but long gaps before and almost no replies to comments. |
| Story presence | 4/6 | A Story is up now; history is sparse. |

## Proposed fixes, biggest first

1. **Bio, decided (owner, B1, 141 chars):** "Every solve counts ⏱️ The speed puzzling community: times, stats and
   competitions from 11,000+ puzzlers in 86 countries. Join us, it's free 🧩". Counted 2026-10-18 (read-only): 11,789
   registered players, 11,780 without a private profile, 7,917 of them with a result, 86 countries. Friendly
   community, not selling; "speed puzzling" is in the text as search words.
2. **Name field: stays "MySpeedPuzzling"** (owner: we're a community with times, stats and competitions, not a
   timer). Proposals with "Puzzle times" were rejected.
3. **Reply to comments within the first hour or two** of every post, starting with the 3 on the postcard quiz. Replies
   are drafted by Claude and sent by the owner (standing rule: replies need approval).
4. **Pinned three**, three jobs: best data post (now the postcard quiz; later the best Weekly Numbers), an explainer
   "what MSP is / how to log a time" (doesn't exist yet: a candidate post), and the community/event post (the WJPC
   "spot us" post, by far the most comments).
5. **Highlights** named for what a new puzzler asks: Start here, Events, Quizzes, New features (Advent in December).
6. **Link with UTM tags** (`?utm_source=instagram&utm_medium=bio`), so sign-ups from the bio can be counted.

## Owner steps (in the Instagram app)

1. **Bio.** Profile → Edit profile → Bio → replace the text with the B1 bio above (copy it exactly) → Done (✓).
   Leave Name and Username as they are. Check that the link still shows myspeedpuzzling.com.
2. **Pin two posts now.** Open the postcard quiz post (17 Oct) → ⋯ (top right) → Pin to your profile. Then the WJPC
   "spot us" post (14 Sep) → ⋯ → Pin to your profile. The third pin waits for an explainer post ("what MSP is / how to
   log a time"), to be drafted. Swap the quiz for the best Weekly Numbers post later.
3. **First highlight** (after today's answer Story is up). Profile → New (+ under the bio) → pick the two postcard
   quiz Stories (the 17 Oct poll and today's answer; they come from the Story archive) → name it
   "Quizzes" → choose a cover (the quiz frame) → Done. Later highlights as Stories exist: Start here, Events, New features.
4. **Link with UTM (optional):** Edit profile → Links → change it to
   `https://myspeedpuzzling.com/?utm_source=instagram&utm_medium=bio`, so sign-ups from the bio can be counted
   (needs analytics on the site that reads UTM tags).

## Outcome (2026-10-18, owner)

Bio B1 live; category "community", contact e-mail added; Quizzes highlight being set up. The UTM link was tried with a
Title, but the profile still showed the tracking string, so it was reverted to the plain https://myspeedpuzzling.com.
Instagram visits still arrive in GA4 as referral traffic from l.instagram.com; an exact bio count would need a short
redirect on the site (e.g. /ig → /?utm_source=instagram&utm_medium=bio), an owner decision for the website repo.

## Re-check the same evening: 75/100 (from 47)

Fresh API pull ~18:00 + the visitor grid (pins: Start here, postcard quiz, WJPC).

| Item | Morning | Evening | Why |
|---|---|---|---|
| Name field | 4/12 | 4/12 | Unchanged by choice (owner: keep MySpeedPuzzling) |
| Bio line one | 4/12 | 10/12 | Says what it is and for whom; the slogan still takes the opening words |
| Bio body | 2/8 | 7/8 | Proof (11,000+ puzzlers, 86 countries) and "free" |
| Pinned three | 0/10 | 10/10 | Three jobs: intro (Start here), best data post (quiz), community/event (WJPC) |
| Link | 6/8 | 6/8 | One clear door; still no way to count bio clicks (UTM reverted) |
| Highlights | 0/8 | 3/8 | One highlight (Quizzes) with a house-style cover; a newcomer's questions need 3–5 |
| Grid legibility | 2/8 | 5/8 | Top row reads as MSP in the house style; rows 2–3 are still old screenshots |
| Photo | 5/6 | 5/6 | Logo |
| Handle | 6/6 | 6/6 | |
| Category / contact | ?/6 | 6/6 | Community category, contact e-mail |
| Recent activity | 4/10 | 8/10 | Posts on 17 and 18 Oct, every quiz comment answered; older posts' comments mostly unanswered |
| Story presence | 4/6 | 5/6 | Answer Story live today |

Biggest remaining gaps: highlights (+5: "Start here" with monthly numbers, then Events), the grid's rows 2–3 (+3: fills
naturally after about two weeks at four posts a week), the name field (+8, declined), a countable link (+2: optional
/ig redirect on the site).
