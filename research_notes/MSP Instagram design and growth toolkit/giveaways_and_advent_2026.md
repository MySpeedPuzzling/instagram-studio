# Giveaways and Advent of Puzzle 2026: API, answer channel, rules and law, what works

Researched 2026-10-17 by four parallel research agents plus read-only calls on our own account. Labels: **[E]** evidence
(official doc, law, dated report, or our own verified call), **[V]** vendor/community claim without a method,
**[I]** our inference or opinion. Design built on it: `docs/ideas/advent-of-puzzle.md`, ideas:
`docs/ideas/giveaways-2026.md`. Not legal advice: items for a lawyer or accountant are listed in §3.5.

## Takeaway

1. **Answer by replying to the Story (a DM); collect by polling from the Mac.** Story replies reach the API with the
   sender, time, text and the Story's id; they are private (no copying) and "reply to a story" is an action Instagram's
   Stories ranking predicts [E]. **No API can read poll, quiz, question or slider sticker answers** [E], so doors carry
   no sticker. Verified on our inbox today: 42 historical Story replies with `story.reply_to {id, link}` [E own].
2. **No App Review, no webhooks.** An app used only on our own account needs Standard Access [E]; webhooks would need
   Advanced Access, Business Verification, a Live app and a public HTTPS server [E]. Polling is far inside the limits
   (conversations: 2 calls/s) [E].
3. **Collect every day.** Meta documents that only the 20 newest messages per conversation return details, and inactive
   message-request threads drop out after 30 days [E] (we read older history today, undocumented). DMs can be edited
   (15 min) or unsent; GIF and sticker replies aren't delivered [E/V]. Keep the first-seen text.
4. **A sticker-free Story can be published by the API** (`media_type=STORIES`, JPEG ≤ 8 MB, no stickers, no Close
   Friends, counts toward the 50–100/24 h quota) [E], so doors can go out on a schedule after the owner's approval.
5. **The rules must not require** following, liking, sharing without tagging us, tagging friends, or sticker answers:
   none can be verified for every entrant [E], and Instagram forbids encouraging inaccurate tagging [E].
6. **It's a free consumer contest, not gambling.** Czech Act 186/2016 needs a stake *and* chance; a free quiz with a draw
   has no stake, so no licence or notification [E]. Consumer law applies (ČOI): award the prizes exactly as described,
   claiming costs nothing, and the rules must say "random draw among correct answers" (the Civil Code otherwise gives
   a public reward to whoever performs first) [E].
7. **Eligibility 18+ (recommended), worldwide except Italy, Brazil and EU-sanctioned countries, "void where
   prohibited".** Prizes in CZ are tax-free up to **CZK 50,000 per prize** since 2024 (not 10,000 as many sites say)
   [E]. A partner-supplied prize needs Instagram's paid-partnership label [E].
8. **GDPR:** run the contest on the rules (Art. 6(1)(b)); publish the winner and a pseudonymous audit on legitimate
   interest (6(1)(f)); store only id, username, answer, time, verdict; delete non-winners 60 days after the last
   draw [E/I].
9. **Expect a steep first week.** Advent of Code keeps 66–83 % of day 1 on day 2, 28–39 % on day 7, 5–9 % on day 25;
   a light quiz should do better (>76 % of mid-point participants finished a 24-door school calendar) [E]. Our scale:
   ~70–250 Story viewers per door, perhaps 10–60 answers a day in week 1 [I]: no benchmark exists for prize Story
   replies, so the November dry run calibrates it.
10. **Trust:** publish the method, the entry count and a verifiable draw; announce the winner publicly and let the
    winner DM us (so any "you won" DM from another account is fake); one fixed anti-scam line everywhere [E cases].

## 1. Instagram API (Instagram Login, graph.instagram.com v25.0)

### 1.1 What our token can do (read-only probe, 2026-10-17) [E own]

| Call | Result |
|---|---|
| `me`, `me/media`, `/{media}/comments` (id, text, timestamp, from{id,username}, like_count, hidden, replies) | OK |
| `me/stories` (live Stories only, with ids) and Story insights (reach, replies, navigation, total_interactions, views) | OK; the live poll Story: reach 223, views 307, replies 0 (EU accounts always get 0, see below) |
| `me/conversations?platform=instagram` (50 per page, newest first) and messages (id, created_time, from, to, message, story, attachments, reactions, shares, is_unsupported) | OK; 1,026 messages read in 40 threads back to 2023-11; 443 carry `story` (401 `mention`, 42 `reply_to`) |
| `content_publishing_limit`, `me/tags` | OK |

`story.reply_to` also appears on replies **we** sent to other accounts' Stories, so the collector keeps only messages
`from` someone else whose `reply_to.id` is one of our door ids. Some `reply_to` lack an id (expired Stories) [E own].

### 1.2 Capabilities, permissions, limits

| Capability | Endpoint | Permission | Limits | Source |
|---|---|---|---|---|
| Read comments / replies | `GET /{media}/comments`, `/{comment}/replies` | basic + manage_comments | 50 per page, newest first, **no time filter**; restricted users' and age-gated comments not returned | [E] IG Media comments, IG Comment |
| Hide / delete / public reply | `POST /{comment}?hide=`, `DELETE`, `POST /{comment}/replies` | same | own media; no replies to hidden comments | [E] comment moderation |
| Private reply to a commenter | `POST /me/messages` `recipient{comment_id}` | basic + manage_comments | one DM per comment, **within 7 days** | [E] private replies |
| List conversations / read messages | `GET /me/conversations`, `/{conv}?fields=messages{…}` | basic + manage_messages | 2 calls/s; **20 newest messages** per thread in detail; requests inactive 30 days not returned; reading doesn't mark Seen | [E] conversations API, messaging API |
| Sender profile, follows us? | `GET /{IGSID}?fields=…,follower_count,is_user_follow_business` | same | only for people who messaged us | [E] user profile API |
| Send a DM | `POST /me/messages` | same | only within 24 h of their last message; HUMAN_AGENT (7 days) needs App Review | [E] messaging API, overview |
| Live Stories, Story insights | `GET /me/stories`, `/{story}/insights` | basic / insights | 24 h only; values < 5 error; **`replies` = 0 for Stories created in Europe**; no sticker metric | [E] IG User stories, media insights |
| Publish a Story | `POST /me/media media_type=STORIES` → `media_publish` | content_publish | JPEG ≤ 8 MB, 9:16; no stickers; no Close Friends; quota (docs say 100 and 50 per 24 h: plan for 50) | [E] content publishing, IG User media |
| Webhooks | `POST /me/subscribed_apps` | per field | Live app, Advanced Access, Business Verification, valid HTTPS | [E] webhooks |

### 1.3 What can't be verified (so the rules must not require it) [E]

- **Following:** no follower list; `is_user_follow_business` works only for people who DMed us.
- **Likes:** only `like_count`, never who.
- **Shares to Story:** invisible unless the Story @mentions us (arrives as a `story_mention` DM; private accounts may
  not arrive).
- **Sticker answers:** not in any API, on either login type; voter lists are in-app only (≤ ~48 h) [E/V].

## 2. The Story answer channel

### 2.1 Routes compared

| Route | Fairness | Friction | Reach | Automatable | Effort | Verdict |
|---|---|---|---|---|---|---|
| **(a) Reply to the Story (DM)** | private, no copying; multi-accounts possible (winner checked by hand); A/B/C guessing 1/3 | low (2–3 taps) | positive: Story replies are a predicted action [E] | **fully**: publish by API, poll, match, store, draw | S–M (built) | **Build on this** |
| (b) Link sticker → feed post → comment | public, copying easy; hiding is a write | high (5+ taps) | mixed | reading yes; sticker by hand | M | rejected (copying, bait look) |
| (c) Answer form on myspeedpuzzling.com | best (one MSP account per puzzler, server time) | highest (browser, login) | takes people off Instagram, but visits MSP | reading yes (read-only DB); MSP feature needed | M–L (other repo) | **fallback** if non-follower replies can't be read |
| (d) Question sticker | private but app-only | low | neutral | no (manual transcription) | L | rejected |
| (e) Quiz sticker | reveals the answer on tap; 25–50 % guessing | lowest | neutral | no | L | rejected |
| (f) Comments on a daily feed post | public; 24 extra feed posts | medium | feed fatigue | reading yes | S | rejected |

### 2.2 Practical details for route (a)

- Turn **off public Story comments** on door Stories (Stories got public comments in Sept 2024; a player could post the
  answer publicly by tapping the wrong icon) and keep **Story replies open to everyone** [E TechCrunch 2024-09-03, V].
- Rules say **"answer in text"** (GIF/sticker replies aren't delivered [E]); **"your first reply counts as we receive
  it"** (edits within 15 min and unsends are possible [V]).
- Don't delete or decline chats in the app until the week's draw is done (may remove them from the API [I]).
- Non-follower replies arrive as message requests, which the API returns [E]; **Hidden Requests** (spam filter) are
  undocumented: test item.
- Winner check before announcing: the User Profile API gives follower count and whether they follow us (they've
  messaged us, so it's allowed) [E]; the owner reviews obviously fresh accounts.

### 2.3 What the Close Friends test Story must settle (morning step)

Frames T1 poll, T2 quiz, T3 "reply with a word"; the owner + 1–2 friends vote, answer, reply, send an emoji-only reply,
a quick reaction, a GIF, unsend one reply, edit one. Probe at +5 min, +1 h, +23 h, +26 h
(`node tools/campaign.ts probe --since <time>`). Checks: (1) Close Friends Stories listed in `me/stories`; (2)
`reply_to.id` = that id; (3) no sticker answers anywhere in the API; (4) emoji-only / reaction / GIF shapes; (5) unsend
and edit as seen by polling; (6) still readable after expiry; (7) no "Seen" side effect; (8) the 20-message cap on a
long thread; (9) our own replies to others' Stories filtered out. **Non-followers can't be on Close Friends**, so
message requests and Hidden Requests are tested on the first public reply Story (the recommended 300M-pieces guess in
early November).

## 3. Rules and law (research, not legal advice)

### 3.1 Requirements

| Requirement | Source | What it means for us |
|---|---|---|
| Official rules, eligibility terms, compliance with prize law | Instagram Promotion Guidelines, read 2026-10-17 [E] | Rules page on myspeedpuzzling.com before the launch; linked in bio, captions, the first Story |
| A complete release of Instagram by each entrant; "not sponsored, endorsed or administered by, or associated with, Instagram" | same [E] | Clause in the rules + a short line in captions |
| No inaccurate tagging or encouraging it | same [E] | Never "tag yourself / tag 3 friends" |
| Brazil: SPA prize-promotion rules | same, top paragraph [E] | Exclude Brazil |
| No giveaways of "cash or cash equivalents in exchange for engagement" | Meta Community Standards, Spam [E] | Entry = the quiz answer only; never follow/like/share as a condition |
| Paid-partnership label when a partner gives value | Meta Branded Content Policies [E] | Only if a partner supplies the prize |
| Gambling = stake + chance | Act 186/2016 § 3(1) [E] | Free entry: outside the act (the brief's "187/2016" is the gambling *tax* act) |
| Consumer contest ("spotřebitelská soutěž"): prizes as described, no cost to claim | Act 634/1992 § 2(1)(u), Annexes; UCPD Annex I pts 19, 31 [E] | Digital code, no fees, a back-up prize of equal value |
| Public promise: first performer wins unless stated otherwise; organiser judges if none named | Civil Code 89/2012 §§ 2884–2889 [E] | Rules state the draw, MSP as judge and the matching rules |
| Prizes tax-exempt up to CZK 50,000 each; above that 15 % withheld on the whole prize | Income Tax Act § 10(3)(a), § 36(2)(i); EY 2025, KPMG 2025 [E] | Keep each prize far below; nothing to withhold |
| Italy: "concorsi a premio" need a ministry notice and deposit, foreign organisers included | Italian agency FAQ [V] | Exclude Italy |
| US: NY/FL registration only above USD 5,000 total; Québec regime repealed 2023 | law-firm guides [V], Canadian Lawyer [E] | No action beyond "No purchase necessary" |

### 3.2 Meta's recommendation rules: conflicting sources

The current Recommendations Guidelines text (help.instagram.com/313829416281232, read 2026-10-17) names
safety-sensitive, low-quality and misleading content, **not contests or giveaways** [E]. Older versions and a Buffer
quote (~Jul 2026) say content that "promotes a contest or giveaway" isn't recommended to non-followers [E/V], and
Mosseri reportedly said "too many giveaways" can make an account unrecommendable (paraphrase, Feb 2025) [V]. Either way
the safe design is the same: quizzes in Stories (followers only anyway), at most one campaign feed post a week written
as a data story, no comment-to-win or tag-a-friend mechanics.

### 3.3 Data protection (GDPR)

- Controller: the MSP operator. Running the contest: **Art. 6(1)(b)** (the rules). Publishing the winner's handle and
  the audit: **Art. 6(1)(f)** (transparency of a public draw; the winner can ask to be masked). Avoid consent as the
  basis (withdrawable; brings in the age-15 digital-consent rule) [E EDPB 2/2019, V dpopro, I].
- Store only: Instagram-scoped id, username, answer (raw + normalised), time, verdict, rule version. Delete
  non-winners **60 days after the last draw**; winners' prize records as long as accounting requires (5 years if part
  of the accounting record) [E Act 563/1991 § 31, I]. Local on the Mac (EU), outside the repo.
- **Public audit:** the seed commitment and reveal, the rule, the counts, the winner, and the list of ticket scores
  only. Each entrant recomputes their own score from the revealed seed and their handle; this also lets anyone test
  whether a *known* handle took part (low harm; say so in the notice) [I]. Stricter alternative: salted hashes of the
  numeric id, with the salt shown only to an entrant who asks (then entrants can't self-check) [I]. Lawyer item.
- Art. 13 notice inside the rules: controller, purposes and bases, recipients (Meta as the platform; the prize partner
  only for the winner), retention, rights, ÚOOÚ complaint, no marketing use.

### 3.4 Prize and voucher

- **MSP membership voucher** (own service): digital, worldwide, no shipping; for VAT probably a multi-purpose voucher
  if MSP is VAT-registered; giving away our own service for marketing is generally not a deemed supply
  (VAT Act § 14(3)(a)) [E text, I]. **Shop voucher bought by MSP**: a marketing expense, usually multi-purpose (no VAT
  on purchase) [I]. **Partner-supplied**: branded content (label + agreement on who organises and delivers) [E].
- Claim **within 7 days**; up to two redraws (next back-up), then the prize rolls over [I]. Week 4 runs over Christmas:
  someone must be on duty for the 27 Dec draw, and the claim window runs into the New Year [I].

### 3.5 Confirm with a lawyer / accountant

Lawyer: free quiz + draw outside 186/2016 and a consumer contest under 634/1992 (any ČOI practice?); whether the Czech
version of the rules must prevail; 18+ vs 15+; country exclusions (Italy, Brazil enough?); the 6(1)(b)/(f) split, the
public score list and the 60-day retention; a partner agreement. Accountant: the CZK 50,000 exemption for
non-resident winners; MSP's VAT status and SPV/MPV for a membership voucher; booking a bought voucher; which winner
records are accounting records.

### 3.6 Draft official rules

The draft (English, ~900 words, placeholders in [BRACKETS]) is in `docs/ideas/advent-of-puzzle.md` §7 (adapted to the
19:00 doors, Story replies, the commit–reveal draw and the score-only audit). It needs the legal name, address, IČO,
contact, prize and value, and a Czech version.

## 4. What works

### 4.1 Cases

| Who | Format | Numbers | Label |
|---|---|---|---|
| Advent of Code 2022–24 | 25 daily puzzles | day 1 ≈ 290–344k; day 2 66–83 %, day 7 28–39 %, day 14 14–18 %, day 25 5–9 % of day 1; a hard day 1 (2023) lost 34 % overnight and stayed lower all month | [E] adventofcode.com/20xx/stats |
| Advent of Code 2025 | cut to 12 days (organiser workload) | day 1 219k; day 7 35 %, day 12 11 % | [E] |
| KI-Adventskalender (DFKI/RPTU) | 24 doors, a week per door, sponsored prizes | steepest drop day 1→2; > 76 % of day-12 participants finished | [E] arXiv 2603.26906 |
| Advent of Chess (Offerspill) | 24 doors, 24 h each, **one raffle ticket per correct answer** | 2,232 on the leaderboard; no curve published | [E] adventofchess.com |
| Ravensburger DE | web advent, daily draw among that day's entrants | runs every year since ≥ 2020; no numbers | [E format] |
| BGG advent challenge (no prize) | play a game daily 1–24 Dec | 31 → 128 participants over 5 years | [E] |
| Strava Days Active · Wordle · Duolingo | daily habits | 79 % completion · ~15 % break a streak on a normal day (60 % on a hard word) · streak wager +14 % day-7 retention | [E/V] |
| Sponsored "loop" giveaways (52 accounts) | follow all sponsors | **61 % of new followers gone in 2 weeks** | [E] SME 2020-09-08 |
| Our WJPC giveaway, Sep 2026 | event-tied feed carousel | reach 4,357 (4.8×), ~70 % non-followers, 359 comments, 60 follows | [E own] |
| Justin Sun Tesla draw, 2019 | screen-recorded "random" draw | 88 draws in the log before the winner; backlash | [E] CoinDesk |

### 4.2 Findings

- **Participation:** halves in ~4–6 days, then levels off; the first half decides it. Day 1 must be easy, each Monday is
  a fresh start, weekly resets let late joiners in [E/I].
- **Stories vs feed:** Stories reach followers only (Mosseri, Apr 2026) [E]; 1K–5K accounts reach ~3–10 % of followers
  per Story (Socialinsider 2025; its two tables disagree) [E]; exits ~13–14 % on single-frame Stories, falling with more
  frames (Rival IQ 2024) [E]. Story replies that weren't asked for: ~0.3–0.5 per 1,000 impressions [E]. Daily posting
  more doesn't lower reach per post (Buffer, 2.1M posts) [E]. So: doors in Stories, one feed post a week.
- **Follower quality:** giveaway followers churn (61 % in 2 weeks in the one measured case) [E]; a puzzling-knowledge
  quiz with a niche prize filters out "compers" [I]. We can't measure per-follower retention via the API (only daily
  follows/unfollows), so compare December's net follows with Oct–Nov [I].
- **Trust:** the most common accusation is "there was no draw" [V]; publish the entry count, the time and the method.
  RANDOM.ORG's third-party draw ($4.95 per draw up to 500 entries, an uneditable record, an entrant-accessible mode) is
  the off-the-shelf alternative to our commit–reveal seed [E].
- **Scams:** social-media scams cost $2.1B in 2025 (FTC, Apr 2026), Instagram third [E]. Announce winners publicly and
  let the winner DM us; never ask for payment, logins or links; check for look-alike accounts daily [E cases].
- **Other formats with evidence:** event predictions (our own WJPC spike), Collab posts (the smaller partner gains:
  Schöttl 2026), play-and-win draws among people who actually played (Stonemaier: "fantastic return"), streak bonuses
  (Duolingo) [E/V]. Brainstorm: `docs/ideas/giveaways-2026.md`.

### 4.3 Gaps

No per-day curve for any Instagram advent; no benchmark for prize Story replies; follower retention after giveaways
rests on one small case; Mosseri's "too many giveaways" is a paraphrase; our own Story baseline (views, exits per
Story) still has to be pulled from insights before setting targets.

## Sources (accessed 2026-10-17)

Meta developer docs (all under https://developers.facebook.com/documentation/instagram-platform/): overview, app-review,
instagram-api-with-instagram-login/business-login, comment-moderation, instagram-graph-api/reference/ig-media/comments,
…/ig-comment, …/ig-comment/replies, private-replies, …/messaging-api, …/conversations-api, …/messaging-api/user-profile,
webhooks, webhooks/examples, …/mentions, …/ig-user/stories, reference/instagram-media/insights, content-publishing,
…/ig-user/media, …/ig-user/content_publishing_limit, changelog (2025-09-10 message_edit, 2025-12-12 link_sticker_url,
2026-06-22 link_clicks).
- Mosseri, "Instagram ranking explained" (Stories: "reply to a story"), 2023-05-31: https://about.instagram.com/blog/announcements/instagram-ranking-explained
- TechCrunch, public comments on Stories, 2024-09-03: https://techcrunch.com/2024/09/03/instagram-stories-public-comments-feature
- Meta messaging docs (GIF/sticker Story replies not delivered; Requests): https://developers.facebook.com/documentation/business-messaging/instagram-messaging/webhooks.md , …/instagram-messaging/overview.md
- Meta newsroom, Reveal sticker, May 2024: https://about.fb.com/news/2024/05/new-stickers-in-instagram-stories/
- [V] PiunikaWeb, poll results bug, 2026-03-27: https://piunikaweb.com/2026/03/27/instagram-story-poll-results-not-showing/
- [V] Cloud Campaign, Stories publishing via API, 2023-05-17: https://www.cloudcampaign.com/blog/meta-announces-stories-publishing-with-instagram-content-publishing-api
- [V] Iconosquare, features not in the API (stickers, poll results): https://support.iconosquare.com/features-not-yet-available-through-the-instagram-api
- [V] Viewer list ~48 h: https://linktr.ee/blog/can-i-see-who-viewed-my-instagram-story ; unsend/edit: https://socialrails.com/blog/can-you-unsend-instagram-messages
Rules and law: Instagram Promotion Guidelines https://help.instagram.com/179379842258600 ; Recommendations
https://help.instagram.com/313829416281232 ; Meta Spam policy https://transparency.meta.com/policies/community-standards/spam/ ;
Branded content https://help.instagram.com/1695974997209192 ; Act 186/2016 https://www.zakonyprolidi.cz/cs/2016-186 ; Act
634/1992 https://www.zakonyprolidi.cz/cs/1992-634 ; Civil Code https://www.zakonyprolidi.cz/cs/2012-89 ; Income Tax Act
https://www.zakonyprolidi.cz/cs/1992-586 ; VAT Act https://www.zakonyprolidi.cz/cs/2004-235 ; Act 563/1991
https://www.zakonyprolidi.cz/cs/1991-563 ; UCPD https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02005L0029-20220528 ;
Directive 2016/1065 https://eur-lex.europa.eu/eli/dir/2016/1065/oj ; EDPB 2/2019
https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines-art_6-1-b-adopted_after_public_consultation_en.pdf ;
epravo.cz 2017-02-15 https://www.epravo.cz/top/clanky/nova-uprava-spotrebitelskych-soutezi-105164.html ; EY 2025-04-23
https://www.ey.com/cs_cz/technical/tax/tax-alerts/2025/04/financni-sprava-pripomina-zmeny-ve-zdaneni-prijmu-z-vyher ; KPMG
2025-03-31 https://danovky.cz/cs/marketingove-souteze-a-dan-z-prijmu-na-co-si-dat-pozor ; Brazil SPA
https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/promocao-comercial ; Québec repeal
https://www.canadianlawyermag.com/news/general/quebec-scraps-its-unique-regulatory-system-for-promotional-contests/381227 ; [V] Italy
https://agenzia-concorsi-a-premio.it/blog/concorsi-e-operazioni-a-premio-le-100-domande-piu-frequenti-faq/ ; [V] US bonding
https://fasthofflawfirm.com/blog/sweepstakes-state-registration-bonding ; [V] dpopro https://dpopro.cz/zpracovani-osobnich-udaju-pri-spotrebitelskych-soutezich/ ;
discarded (contradicted by the law text): ARROWS 2026-04-28 https://arws.cz/novinky-v-arrows/pravni-posouzeni-kvizovych-a-souteznich-aplikaci

What works: Advent of Code stats https://adventofcode.com/2024/stats (and 2022, 2023, 2025); KI-Adventskalender
https://arxiv.org/abs/2603.26906 ; Advent of Chess https://www.adventofchess.com/about ; BGG geeklist 217177
https://boardgamegeek.com/geeklist/217177 ; Social Media Examiner 2020-09-08
https://www.socialmediaexaminer.com/do-sponsored-instagram-contests-really-work-case-study/ ; Strava
https://business.strava.com/resources/new-days-active-challenges ; PC Gamer (Wordle)
https://www.pcgamer.com/wordles-hardest-word-caused-60-of-players-to-break-their-streaks/ ; Duolingo
https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/ ; Socialinsider 2025-06-26
https://www.socialinsider.io/social-media-benchmarks/instagram-stories-benchmarks ; Rival IQ 2024-01-09
https://www.rivaliq.com/blog/instagram-stories-benchmark-report/ ; Buffer 2025-08-13 https://buffer.com/resources/how-often-to-post-on-instagram/ ;
Social Media Today 2026-04-06 https://www.socialmediatoday.com/news/instagram-chief-debunks-popular-engagement-hack/816781/ ; RANDOM.ORG draws
https://www.random.org/draws/description/ ; CoinDesk 2019-03-29
https://www.coindesk.com/business/2019/03/29/justin-sun-draws-heat-from-tron-fans-for-waffling-on-promised-prizes ; FTC 2026-04
https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2026/04/reported-losses-scams-social-media-eight-times-higher-2020 ;
Schöttl 2026 https://www.researchgate.net/publication/402526684_The_impact_of_collaborative_posts_on_digital_reach_A_win-win_situation ;
[V] Digital Information World 2025-02-08 (Mosseri paraphrase) https://www.digitalinformationworld.com/2025/02/instagram-engagement-declines-mosseri.html ;
[V] Inro (hidden requests) https://www.inro.social/blog/blog-instagram-dm-deliverability-hidden-requests

- Unofficial private-API poll-voter feeds exist (reverse-engineered) and **must not be used** (against Meta's platform terms) [V].
