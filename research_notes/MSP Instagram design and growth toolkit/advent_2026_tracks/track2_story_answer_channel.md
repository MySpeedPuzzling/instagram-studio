# Track 2: the Story answer channel for Advent of Puzzle

Research date 2026-10-17. Labels: **[E]** evidence (official Meta doc or a dated report, URL in Sources), **[V]**
vendor/community claim, **[I]** inference. Meta doc pages carry no publication date; they were read today and
show v25.0 examples, so "accessed 2026-10-17" is the date for every Meta doc. No Instagram API calls were made for
this track. The findings that come from the owner's own test today are marked **[own test]**.

## Takeaway

**Build on route (a): answer by replying to the Story (DM). Collect with a polling script on the Mac and keep
the MSP web form (route c) as a documented fallback, not a parallel channel.** Confidence: **high** that the
route works (story replies reach the API with sender, time, text and the story id [E][own test]). **Medium** on
the edge cases that decide how often to poll and how strict the rules can be: replies from non-followers in the
Requests folder or in Hidden Requests, Close Friends visibility, the 20-messages-per-conversation cap, and
unsend/edit behaviour. The test Story below settles these.

Why this route and not a sticker:
- **No Instagram API, on either login type, exposes who answered a poll, quiz, question or slider sticker, or
  what they answered.** No webhook does either. Story insights have no sticker metric; the only related metric is
  `link_clicks` [E]. Sticker answers are visible only in the app's viewer list while the story is live, and up to
  about 48 h after posting [V]. You can't automate them.
- **The API can't publish stickers on a Story** ("Publishing stickers (i.e., link, poll, location) is not
  supported") [E]. A "reply with your answer" door is plain image + text, so the publish script can post it
  after owner approval and gets the story media id straight back. Any sticker route forces manual posting in the app.
- A DM reply is private, so other players can't copy it. Instagram's Stories ranking explicitly predicts
  whether you will "reply to a story" [E], so replies are the interaction it is built to reward.
- It is the route the owner already prefers, and the owner's test today confirmed the core mechanism.

Biggest caveats: the **20 most recent messages** cap (only the last 20 messages in a conversation return full
details) [E]; Requests conversations inactive for 30 days drop out of the API [E]; GIF and sticker replies
trigger no webhook [E]. The day's Story set includes an answer frame that publishes the correct answer, so
**the collector must snapshot before the next frame goes up**. Also, guessing is easy on multiple-choice doors:
1/3 of random A/B/C guesses are right (see Q4).

## Route comparison

| Route | Fairness (multi-account / guessing / copying) | Player friction | Reach effect | Automatable | Must collect within 24 h? | Build effort | Main risks |
|---|---|---|---|---|---|---|---|
| **(a) Reply to Story by DM** (recommended) | Multiple accounts possible, partly flaggable via User Profile API. Guessing depends on format: free text ≈ 0, A/B/C = 33 %. Private, so no copying on IG (screens can still be shared off-platform) | Low: tap the reply bar, type, send (2–3 taps) | Positive: "reply to a story" is a predicted action in Stories ranking [E]; DMs count toward engagement history [E] | **Fully**: publish via API, poll `me/conversations`, parse, store, draw | No for the messages, which persist in DMs. **Yes in practice**: snapshot before the answer frame is published, and before 20 newer messages push an answer out of a long thread | **S–M** | Requests/Hidden Requests delivery (verify); 20-message cap; emoji-only, GIF or sticker replies not delivered; owner deleting a chat in the app [I] |
| (b) Link sticker → feed post, answer in comments | Comments are public, so copying is easy. Hiding via API is a write action with a polling delay, so there is always a visible window | High: tap sticker → post opens → comment (5+ taps, context switch) | Mixed: comments on the post help it; no official statement on link-sticker Story reach [gap] | Reading yes; the sticker must be added by hand in the app | No: comments persist | M | Copying; auto-hide needs owner approval; spammy look on the post |
| (c) Answer form on myspeedpuzzling.com (link sticker) | **Best**: one MSP account per real puzzler (solve history), answers private, server-side timestamp, guessing equal to the format | **Highest**: tap sticker → browser → log in → answer | Takes viewers off Instagram, though a link tap is a measurable interaction (`link_clicks`) [E]. Real benefit for MSP (visits, sign-ups) [I] | Reading yes (read-only DB); the link sticker must be added by hand | No | **M–L**: needs a new feature in the MSP web app (outside this repo) | Lower participation; needs a link between IG handle and MSP profile to announce winners; dev time in December |
| (d) Question sticker | Private, but only in the app | Low | Neutral to positive [V] | **No**: answers are in-app only, not DMs, not in the API [V] | Yes, and manual: the owner must transcribe within ~48 h | L (manual work every day) | Not automatable; transcription errors |
| (e) Quiz sticker (+ DM for "proof") | Voter sees right/wrong instantly, so the answer leaks via screenshots; one tap = high guessing (1/2–1/4) | Lowest (1 tap) | Neutral to positive [V] | **No** for the sticker; a DM add-on would double the work for players | Yes, and manual | L | Not readable by the API; reveals the answer; the in-app poll-results bug of March 2026 [V] |
| (f) Comments on a daily feed post | Public, so copying (unless auto-hidden, as in b) | Medium (open post, comment) | Comments help that post; but 24 daily feed posts would hurt the feed rhythm (see the Advent doc) | Fully for reading | No | S (reading) / M (with hiding) | Copying; feed fatigue; looks like "comment to win" engagement bait [V] |

## Q1. Sticker answers (poll, quiz, question, slider)

- **The API can't read sticker responses.** The IG Media insights metrics for stories are `reach`, `views`,
  `replies`, `shares`, `reposts`, `follows`, `profile_visits`, `profile_activity`, `navigation`,
  `total_interactions`, `link_clicks` (and `total_views` / `facebook_views` on Facebook Login). None of them is a
  sticker metric. The page doesn't mention poll votes, quizzes, questions or sticker taps [E]. The webhooks
  page lists no field for sticker responses. `story_insights` "will only show metrics for the first 24 hours"
  [E], and it is **not supported** on Instagram Login [V, citing the insights doc]. The IG User Stories
  reference returns story media objects with no sticker fields [E]. Iconosquare's list of features "not yet
  available through the Instagram API" includes Stories stickers and poll/slider results [V, undated]. The only
  programmatic voter lists come from the reverse-engineered `instagram-private-api` (a poll-voters feed with
  each vote) [V]. That is unofficial, against Meta's rule that "Platform APIs are the only allowable means to
  access data programmatically" [V quoting Meta], and **must not be used**.
- **The belief is correct:** the API gives neither aggregates nor voter lists for stickers. Even the
  sticker-level aggregate counts are app-only. Insights give only `total_interactions`, which per the Help
  Center "includes … sticker taps" [V via search snippet of help.instagram.com/383939598845756].
- **In-app visibility:** voters and their choices show in the story's viewer list ("swipe up … who voted and
  what option they chose"; "your poll and its results will disappear after 24 hours", Instagram's 2017 launch
  post) [E, dated 2017, possibly outdated]. Recent guides say the named viewer list lasts up to 48 h from
  posting, archive and highlights keep only totals, and highlights don't extend the window [V, conflicting].
  Treat it as **in-app only, ≤ 48 h, not reliable**. PiunikaWeb (27 Mar 2026) reported a widespread bug that
  removed poll breakdowns and voter names on active stories, with no Meta acknowledgement [V, dated].
- **Question-sticker answers are not DMs.** They collect in a separate responses tab in the viewer list. The
  owner can share one to a Story or reply to it, and that reply then becomes a normal DM thread [V]. That would
  bring only the replies the owner chooses into the API, which doesn't work as a contest entry.
- **The quiz sticker reveals the answer at once.** A correct voter gets confetti; a wrong voter sees their
  choice in red with the correct option highlighted, and voters also see the leading choice [V, multiple
  guides]. It accepts one answer per viewer. **It's unsuitable for a contest:** one screenshot spreads the
  answer, and guessing is 25–50 %.
- Side note, the **Reveal sticker** (May 2024): the story stays blurred until the viewer sends a DM [E, Meta
  newsroom]. It's interesting because it forces a DM, but the API can't publish it, and an "unlock" message is
  not an answer. Optional test item only.

## Q2. Story replies through the Messaging / Conversations API

- **Payload:** a story reply is a `messages` event whose `message` carries
  `reply_to: { story: { url: <CDN_URL_FOR_THE_STORY>, id: <STORY_ID> } }`, "included when a customer replies to a
  story" [E]. When polling, `GET <MESSAGE_ID>?fields=story,from,message,created_time` returns the same data. The
  owner's test today confirmed `story.reply_to {id, link}`, `from {id, username}`, `message` and
  `created_time` [own test].
- **Does `reply_to.id` equal the media id from `me/stories` or from the publish response?** No doc says
  so explicitly. The docs call it "the story ID" [E]. It most likely is the IG media id [I]. The owner saw the
  id missing on some historical replies [own test]. **Verify on the test Story.** If the id is missing, the
  fallback is time matching: replies created between door N opening and door N+1 opening belong to door N [I].
  That works because only one door is live at a time, provided no other Story receives replies in that window.
- **Polling vs webhook:** webhooks need a public HTTPS endpoint, a Live app and (for third-party use)
  Business Verification [E/V]. We have no server, so we poll. Polling loses nothing compared with webhooks
  except the **edit history** (`message_edit` events) and **`is_deleted` notices**, which arrive only as
  webhooks [E] [I].
- **How long replies stay readable:** DM text persists after the story expires. Only the story media and the
  CDN link expire [E]. Two documented limits apply:
  1. **"You can only get details about the 20 most recent messages in the conversation"**. Older message ids
     are still listed but return a "deleted" error [E, Conversations API]. The owner saw replies back to 2023
     [own test], which is consistent if those threads are short. For a daily door, a player sends 1–3
     messages a day, so a few polls a day is enough. One edge case: a player who chats a lot with the owner
     can push their answer out of the last 20.
  2. **Requests-folder conversations inactive for 30 days are not returned** [E]. Daily collection makes this
     irrelevant, but it rules out "collect everything on Sunday from scratch" as the only safety net.
- **Message requests (non-followers):** "All new conversations from Instagram users who aren't followers …
  will appear in the Requests folder" and they are returned by the API (except after 30 days inactive) [E]. The API
  has no folder information ("Inbox folders aren't supported") [E]. **Hidden Requests / Spam** is a subfolder for
  requests flagged by classifiers or Hidden Words [V]. **No source says whether the API returns hidden
  requests.** This is the top item to test.
- **Seen status:** "Messages delivered via webhooks or the API don't count as read. Only after a reply is sent
  will a message be considered Read" [E]. Request messages aren't marked Seen until accepted [E]. **Polling has no
  visible side effect for players** [E].
- **The owner using the app at the same time:** reading, accepting or answering in the app doesn't remove
  messages from the API [I]. Owner replies do count toward the 20-message cap [I]. **Deleting a chat or
  declining a request in the app may remove it from the API** [I, unverified]. Rule for December: don't delete
  or decline chats until the week's draw is done.
- **Unsend / edit:** unsend removes the message "for everyone", with no time limit [V, quoting Help Center].
  The webhook flags `is_deleted: true` [E]. With polling, an unsent message most likely just disappears [I].
  Edits are allowed for 15 minutes after sending (TechCrunch, dated); the webhook has `message_edit` with
  `num_edit` [E]; polling sees only the current text [I]. **Rule design:** "Your first message replying to the
  door counts, as we receive it. Unsent messages don't count." Store the first-seen text and time and never
  overwrite them [I].
- **Emoji-only replies / quick reactions:** the six quick-reaction emoji on a story are sent to the owner's DMs
  [V]. Third-party tools treat emoji-only replies as messages containing just the emoji, with `reply_to.story`
  [V]. `message_reactions` is documented for reactions *to messages* [E], and no doc says it covers story
  reactions. Private story **likes** (the heart, since Feb 2023) are not DMs [V, dated]. "If a person sends a
  message with a gif or sticker a webhook will not be triggered" and "Story Replies webhook currently doesn't
  support GIF or sticker" [E]. Polling may show such a message as `is_unsupported` or not at all [I]. Rules
  must say "answer in text".
- **Rate limits:** Conversations API "2 calls per second per Instagram professional account" [E]. A daily sweep
  of a few hundred conversations plus message lookups takes minutes at 1 call/s [I].
- **EU detail:** for Stories created in Europe (since Dec 2020) the insights `replies` metric **returns 0** [E].
  Our own collector is the only reply count we will have. No doc limits story-reply *messaging* in the EU, and
  the owner's test shows replies arrive [E][own test].
- **E2EE:** encrypted Instagram chats are out of reach of the API. One 2026 source cites the Help Center saying
  E2EE on Instagram "is no longer supported as of May 8, 2026" [V]. That's a non-issue either way, because
  story replies to a professional account go through the normal inbox [I].
- **Messaging policy:** apps must have a human escalation path and should disclose automation if they send
  automated messages [E]. **We send nothing automatically**, so the read-only collector needs neither [I].
  Replying to a winner by API works only within 24 h of their last message [E]. The owner can always DM
  the winner by hand in the app, and that's the recommended path.

## Q3. Other routes in detail

**(a) "Reply with your answer" Story.** See Q2. Set up the door with the answer format in big type ("Reply: A, B
or C"). The reply bar must be on ("Allow message replies: Everyone", in Settings → Messages and story replies)
[V]. **Turn off public Story comments** for door stories, either globally or per story (Options → Turn off
commenting). Since Sept 2024, Story comments are public to other viewers and players can post one by mistake by
tapping the comment icon instead of the reply bar [E, TechCrunch 3 Sep 2024][V]. The API doesn't read them
[V/gap]. A public correct answer would also leak the door.

**(b) Link sticker → feed post, comment the answer.** `GET /<media>/comments` returns `from`, `username`,
`text`, `timestamp` and `hidden` (username needs the manage-comments permission) [E]. Hiding is
`POST /<comment-id>?hide=true` [E], a write action that needs owner approval under the repo's rules. Hidden
comments stay visible to the commenter, are hidden from other visitors, and the commenter isn't notified
[V, conflicting on whether the commenter's followers see them]. Without webhooks the hide lags the comment by the
polling interval, so answers are visible for minutes [I]. The link sticker can't be added through the API [E].
Verdict: workable, but it fails the copying test and makes the post look like engagement bait.

**(c) MSP web answer form.** A logged-in member answers on myspeedpuzzling.com. The app stores
`(player, door, answer, created_at)`; we read it with the read-only role, apply the usual exclusions, and draw.
It's the strongest against multiple accounts and copying, timestamps are trustworthy, and there is no 24 h or
20-message pressure. Downsides: the most friction, off-Instagram, a link sticker added by hand every day, a
feature in the MSP web app (outside this repo; effort M–L), and a mapping from the winner to an IG handle (MSP
profiles carry the IG handle; tag only that handle, per CLAUDE.md). **Best as a fallback** if the test shows
that replies from non-followers land in Hidden Requests the API can't read, or as a "website door" for a
Sunday bonus [I].

**(d) Question sticker.** Responses are in-app only and not DMs [V]. Can't be automated. Rejected.

**(e) Quiz sticker (+ DM).** Not readable, reveals the answer, guessable. Asking for a DM in addition only adds
friction. Rejected.

**(f) Daily feed post with comments.** Same reading/hiding mechanics as (b). 24 extra feed posts conflict with
the planned rhythm (Advent doc §2). Rejected.

## Q4. Fairness, friction, reach, automation, risks

**Fairness**
- *Multiple accounts:* no Instagram route can prevent them. Mitigation for (a): "one person, one account; we
  may disqualify duplicates". On the drawn winner only, run the **User Profile API** (consent exists because they
  messaged us). It returns `follower_count`, `is_user_follow_business`, `is_business_follow_user` and
  `is_verified_user` [E], so the owner can review a fresh, zero-follower account before announcing. Do **not**
  make following a condition of entry: the Advent doc keeps "no following required", and Meta's spam policy
  frowns on prize-for-engagement [V]. Route (c) is the only strong defence.
- *Guessing:* with A/B/C doors, a random guesser is right 1/3 of the time. Over a 6-door week, a pure guesser
  averages 2 correct answers, so 2 tickets [I]. If each correct door is one ticket in the draw, skill is
  still rewarded (a 6/6 player has 3× the tickets). If the rule is "all six correct to enter", guessing is
  nearly useless (1/729) but most players drop out after one miss [I]. Free-text and number doors get rid of guessing.
- *Copying:* DM answers are private on Instagram. Screenshots and group chats can't be stopped. Keep the answer
  frame out of the Story until the door closes (it already comes with the next door) [I].

**Friction (taps from seeing the door):** (e) 1 < (a)/(d) 2–3 < (f) 3–4 < (b) 5+ < (c) 6+ with login [I].

**Reach:** official: the Stories ranking uses viewing history, engagement history ("likes or DMs") and closeness,
and predicts whether you will "tap into a story, reply to a story or move on" (Mosseri, 31 May 2023) [E]. For
feed and Reels, the top signals are watch time, likes per reach and sends per reach (Mosseri, Jan 2025, via
Social Media Today) [E/V]. **Comments are not among them.** No official statement says link stickers lower
Story reach or completion [gap]. Claims that interactive stickers "boost reach" are vendor claims [V].
Inference: a daily reply habit should raise our Stories in repliers' trays during December [I].

**Automation per route:** (a) publish (after approval) + collect + score + draw are all scripts. (b)/(f) read
automatically; hiding is approval-gated. (c) read automatically; the link sticker is placed by hand. (d)/(e) manual.

**Platform risks:** Meta's promotion guidelines require official rules, a complete release of Instagram, and
a statement that Instagram doesn't sponsor the promotion [V quoting the guidelines]. Automation is fine through
official APIs only [V quoting Meta]. Message-request filtering: "Hide unwanted message requests" is off by
default for standard accounts, but spam classifiers still route some requests to Hidden Requests [V]. Personal
data: the collector stores IGSID, username, answer text and time for at most 4 weeks. Store it gitignored in
`var/`, say so in the rules, and delete it after the campaign [I, matches the repo rules].

## Q5. Close Friends and the test Story

- **No source says whether a Close Friends story is returned by `me/stories`** or whether its replies carry
  `reply_to.story`. The IG User Stories reference lists only these exclusions: live video stories, reshared
  stories, and the 24 h lifetime [E]. The API can't post to Close Friends (no audience parameter) [E]. A
  CF test story must therefore be posted by hand. A CF reply is still a normal DM [I], and probably has the same
  payload [I].
- So the test checks both. If CF stories are hidden from `me/stories`, a short, unobtrusive **public** test
  Story (e.g. late evening, deleted after 1 h) is the fallback. A CF result won't fully transfer to public
  stories anyway: a public story also gets replies from non-followers [I].

## Assumptions to verify on the test Story

Setup: the owner posts by hand 3 Close Friends frames: **T1** poll sticker (2 options), **T2** quiz sticker
(3 options), **T3** a plain image "Reply with a word: PUZZLE". Then 2–3 helpers act: one follower, one
**non-follower**, and if possible one brand-new account. Each does the following: vote in T1, answer T2, reply to T3
with text; reply to T3 a second time with an emoji only; send one quick reaction; send one GIF; unsend one reply;
edit one reply within 15 min. A read-only script snapshots at +5 min, +1 h, +23 h and +26 h (after expiry).

1. **CF stories are listed:** `GET me/stories` during the live window returns T1–T3 ids. *Confirm:* 3 ids.
   *Deny:* missing, so rerun on a public test story.
2. **The story id matches:** each T3 reply has `story.reply_to.id` equal to the T3 id from step 1. *Deny:* a
   different id format or missing, so use time-window matching.
3. **Sticker answers are absent from every API surface:** no message, no `reply_to`, and no field on T1/T2
   media (`GET <id>?fields=…`, `/insights`) names a voter or a choice. Expected: only aggregates (or error
   `10` "not enough viewers" below 5) [E]. *Confirm:* nothing per user.
4. **Non-follower replies are readable:** the non-follower's T3 reply appears in `me/conversations` (Requests).
   *Deny:* missing, so route (a) loses reach for non-followers, and (c) becomes the fallback.
5. **Hidden Requests:** if the brand-new account's reply is filed under Hidden Requests in the app (owner
   checks), does the API return it? *Confirm/deny* decides whether the owner must check that folder daily.
6. **Emoji-only reply and quick reaction:** do they come as `message` text with `reply_to.story`, as a
   `reaction`, or not at all? Record the exact shape.
7. **GIF/sticker reply:** absent, or present with `is_unsupported` / attachment only [E: no webhook].
8. **Unsend:** after unsending, is the message gone from the conversation's message list, or listed with an error
   on lookup? Is `is_deleted` exposed when polling?
9. **Edit:** does polling return the edited text, and is there any edit flag or count?
10. **After expiry (+26 h):** the reply text, `from` and `created_time` are still readable. `reply_to.id` is still present
    and `link` is dead or expired. `me/stories` no longer lists T1–T3.
11. **No seen side effect:** helpers confirm their reply shows no "Seen" after our polling (the owner must not open
    the chats in the app before this check) [E says API reads don't mark read].
12. **20-message cap:** pick an existing long thread (> 20 messages) and confirm that message #21 returns the
    documented "deleted" error. This sets the polling interval (several times a day vs once).
13. **Owner's own replies to others' stories** carry `reply_to` too [own test]. Confirm the filter (`from.id` ≠
    our id and `reply_to.id` ∈ our story ids) gives exactly the helpers' replies.
14. Optional: a **Reveal sticker** frame. Does the unlock DM arrive with `reply_to.story`?

Record wall time, number of API calls and the snapshot timings in the test log, as the repo rules require for
comparable runs.

## Collector design implied (for the build track)

- Every door is published through the API after approval, so its media id is stored at publish time. The
  collector doesn't depend on `me/stories`.
- Poll every 30–60 min from 19:00 to the next 19:00 while the Mac is on. A **final sweep at 18:55** before the
  next door posts its answer frame. A **24 h tolerance sweep** next morning catches late-listed requests.
- Per message: keep the **first** reply per player per door (IGSID), with text and time as first seen, plus the
  scored result. Never overwrite. Unsent before the first snapshot = not received.
- Sunday: deterministic draw (published seed, as in the Advent doc). Run the User Profile API check on the winner
  only, owner review, manual DM by the owner, announcement after approval.

## Gaps

- No official source on: hidden requests via the API; Close Friends in `me/stories`; whether `reply_to.id` ==
  media id; the exact payload of story quick reactions; whether polling exposes `is_deleted` or edits; whether
  deleting a chat in the app removes it from the API.
- The Help Center pages (help.instagram.com) are rendered with JavaScript and couldn't be fetched. Sticker and
  viewer-list behaviour is therefore from search snippets and dated guides, and the 48 h viewer window is [V] only.
- No Mosseri statement on link stickers, or on Story comments versus replies, as ranking inputs.
- The 20-message cap conflicts on its face with the owner's finding that history is readable back to 2023.
  Most likely it applies per conversation and those threads are short (test 12).

## Sources (all accessed 2026-10-17 unless dated otherwise)

- Meta, Webhooks (Instagram Platform): https://developers.facebook.com/docs/instagram-platform/webhooks
- Meta, Webhook payload examples (messages, `reply_to.story`, `is_deleted`, `message_edit`, `message_reactions`): https://developers.facebook.com/docs/instagram-platform/webhooks/examples
- Meta, Instagram Messaging webhooks ("Story Replies webhook currently doesn't support GIF or sticker"): https://developers.facebook.com/documentation/business-messaging/instagram-messaging/webhooks.md
- Meta, Instagram Messaging overview (Requests folder, folders not supported, human escalation): https://developers.facebook.com/documentation/business-messaging/instagram-messaging/overview.md
- Meta, Messaging API, Instagram Login (Requests 30 days, read status): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
- Meta, Conversations API ("20 most recent messages"): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/conversations-api
- Meta, Messenger Conversations API (same cap, example with `reply_to`): https://developers.facebook.com/docs/messenger-platform/conversations/
- Meta, Story mentions (CDN URL expiry, don't store media): https://developers.facebook.com/docs/messenger-platform/instagram/features/story-mention
- Meta, User Profile API (follower_count, is_user_follow_business, consent): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/user-profile
- Meta, Rate limiting (Conversations API 2 calls/s): https://developers.facebook.com/docs/graph-api/overview/rate-limiting
- Meta, IG Media insights (story metrics; EU/Japan `replies` = 0; 24 h): https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights
- Meta, IG User Stories (exclusions): https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/stories
- Meta, IG User Media (stickers not publishable; STORIES media type): https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
- Meta, IG Comment (fields, `hide=true`): https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-comment
- Meta, Comment moderation (Instagram Login permissions): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/comment-moderation
- Mosseri, "Instagram Ranking Explained", 31 May 2023: https://about.instagram.com/blog/announcements/instagram-ranking-explained
- Instagram, "Introducing Polls in Instagram Stories", 2017: https://about.instagram.com/blog/announcements/introducing-polls-in-instagram-stories
- Meta newsroom, "New Stickers in Instagram Stories" (Reveal), May 2024: https://about.fb.com/news/2024/05/new-stickers-in-instagram-stories/
- TechCrunch, public Story comments, 3 Sep 2024: https://techcrunch.com/2024/09/03/instagram-stories-public-comments-feature
- PiunikaWeb, Story poll results not showing, 27 Mar 2026: https://piunikaweb.com/2026/03/27/instagram-story-poll-results-not-showing/
- Help Center, Story insights (via search snippet): https://help.instagram.com/383939598845756/
- Social Media Today via secondary sources, Mosseri top signals, 22 Jan 2025: https://alxo.ae/whats-on/instagram-ranking-2026-signals-on-the-record/
- [V] Iconosquare, features not available via API (undated): https://support.iconosquare.com/features-not-yet-available-through-the-instagram-api
- [V] dilame/instagram-private-api poll voters feed (unofficial; do not use): https://github.com/dilame/instagram-private-api/blob/master/src/responses/story-poll-voters.feed.response.ts
- [V] Quiz sticker behaviour: https://skedsocial.com/blog/instagram-story-quiz-stickers , https://typito.com/blog/instagram-quiz/
- [V] Question sticker responses not DMs; story reply settings: https://instantdm.com/blog/instagram-story-replies-private-who-can-see-how-they-work-2026 , https://screenrant.com/limit-turn-off-instagram-story-replies-how/
- [V] Viewer list 48 h: https://linktr.ee/blog/can-i-see-who-viewed-my-instagram-story , https://pallyy.com/blog/how-does-instagram-organize-story-views
- [V] Hidden Requests: https://dmfast.app/glossary/message-requests-folder
- [V] Unsend/edit: https://socialrails.com/blog/can-you-unsend-instagram-messages ; TechCrunch on DM edits (2024): https://techcrunch.com/?p=2673991
- [V] Story reply automation (emoji-only replies as DMs; dated 14 Oct 2026): https://fridai.fansnetwork.ai/en/blog/instagram-story-reply-automation , https://creatorflow.so/blog/instagram-story-reply-automation/
- [V] Promotion guidelines quoted: https://sweepwidget.com/blog/instagram-contest-rules , https://kickofflabs.com/blog/instagram-giveaway-rules-2026/
- [V] Hidden comments visibility: https://napoleoncat.com/blog/hide-comments-on-instagram/
