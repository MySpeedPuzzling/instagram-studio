# Track 1: Instagram API (Instagram Login, graph.instagram.com, v25.0) for a giveaway

Accessed 2026-10-17. Labels: **[E]** official Meta doc or our own verified call, **[V]** vendor or community claim, **[I]** inference or opinion.
Official pages are cited by short name. Full URLs are in "Sources" (all on `developers.facebook.com/documentation/instagram-platform/...`, fetched as `.md`).

## Takeaway

- **Our setup is enough. No App Review is needed.** Meta's App Review page says an app "only for a business I own or manage" with Instagram Login needs Standard Access and App Review "Not required" [E app-review]. Advanced Access, App Review and Business Verification only matter for serving accounts we don't own, and for webhooks (see the next point).
- **Use polling, not webhooks.** The webhooks doc lists Advanced Access and Business Verification as required for Business Login for Instagram, plus an app set to Live and a public HTTPS endpoint with a valid, non-self-signed certificate [E webhooks]. A Mac with no server can't receive them. Polling fits our volume: comments come 50 per call with no documented total cap, and the Conversations API allows 2 calls per second [E overview, ig-media/comments].
- **Comments on posts are the most reliable entry channel.** They give `id, text, timestamp, from{id,username}, like_count, hidden, parent_id`, replies via expansion, newest first [E ig-comment, ig-media/comments]. Comments from restricted users and on age-gated media are not returned [E ig-comment].
- **Story replies and story mentions arrive as DMs.** Story replies have `reply_to.story{url,id}`, plus `link_sticker_url` since 2025-12-12. Mentions arrive as attachments of type `story_mention` [E webhooks/examples, changelog]. The API supports no Story mentions outside DMs [E mentions]. Poll, quiz and question sticker answers are not in the API at all.
- **Following can be checked, but only for people who have DMed us.** The User Profile API returns `is_user_follow_business` for an IGSID, but only after that person has sent a message or tapped an ice breaker or menu item [E user-profile]. Someone who only commented gives an error: "User consent is required to access user profile". There is no follower list and no list of who liked a post.
- **The documented DM detail limit doesn't match what we saw.** The docs say only the 20 most recent messages of a conversation can be read in detail [E conversations-api]. Our account read history back to 2023-11 through field expansion on the messages edge [E own call]. This is undocumented behaviour that could change, so collect entries daily and don't rely on reading back later.
- **The EU `replies` metric is zero.** For Stories created in Europe, the `replies` story-insight metric returns 0 [E ig-media insights]. To count Story answers, count `reply_to` DMs, not the insight.
- **A Story can be published by script, but with no stickers.** `media_type=STORIES` works with `instagram_business_content_publish`, and it counts toward the 100-per-24-hour publishing quota [E content-publishing, ig-user/media]. Link, poll and location stickers can't be published; user tags without a sticker can. So a "reply to this Story with A/B/C" quiz Story can be published after approval.

## Capability table

| capability | endpoint | permission | limits | label + source |
|---|---|---|---|---|
| List comments on own media | `GET /{media-id}/comments` | `instagram_business_basic` + `instagram_business_manage_comments` | 50 per query, cursor paging, reverse chronological (v3.2+), top-level only, no timestamp filter | [E] ig-media/comments |
| Replies to a comment | `GET /{comment-id}/replies` or `fields=replies{...}` | same | no replies for deleted comments; order not documented | [E] ig-comment/replies |
| Comment fields | `GET /{comment-id}?fields=...` | same | `username` needs the manage_comments permission (since 2024-08-27); restricted and age-gated comments are hidden from the API | [E] ig-comment |
| Hide or unhide a comment | `POST /{comment-id}?hide=true/false` | same | the owner's own comments always show; not for Live | [E] ig-comment |
| Delete a comment | `DELETE /{comment-id}` | same | only on our own media; not for Live | [E] ig-comment |
| Public reply to a comment | `POST /{comment-id}/replies?message=` | same | top-level comments only; not on hidden comments; not on Live | [E] ig-comment/replies |
| Private reply (DM) to a commenter | `POST /me/messages` with `recipient{comment_id}` | doc lists `instagram_business_basic` + `instagram_business_manage_comments` | 1 message per comment; within 7 days; 750 calls per hour on posts and reels | [E] private-replies, overview |
| List conversations | `GET /me/conversations?platform=instagram` (`&user_id=<IGSID>`) | `instagram_business_basic` + `instagram_business_manage_messages` | 2 calls per second per account; Requests inactive for 30 days are not returned | [E] conversations-api, overview |
| Read messages | `GET /{conv-id}?fields=messages{...}` / `GET /{msg-id}` | same | docs: details for only the 20 newest messages; we saw much more via field expansion | [E] doc + [E] own call |
| Who messaged us: profile and follow status | `GET /{IGSID}?fields=name,username,profile_pic,follower_count,is_user_follow_business,is_business_follow_user,is_verified_user` | same | needs consent (the user sent a DM or tapped an ice breaker or menu item); not available if they blocked us | [E] user-profile |
| Send a DM | `POST /me/messages` | same | only within 24 hours of the user's last message; 100 per second for text, 10 per second for audio or video; text up to 1000 bytes | [E] messaging-api, overview |
| Send outside the 24-hour window | `tag: HUMAN_AGENT` | "Human Agent" feature | 7 days; human support only | [E] overview; needs App Review [I] |
| Quick replies, generic and button templates | `POST /me/messages` | same | 13 quick replies of up to 20 characters; up to 10 cards with 3 buttons each; mobile only | [E] quick-replies, generic-template |
| Ice breakers, persistent menu | `POST /me/messenger_profile` | same | up to 4 ice breakers; menu not personalised per user; mobile only | [E] ice-breakers, persistent-menu |
| Active stories | `GET /me/stories` | basic | 24 hours only; no Live; reshares not returned | [E] ig-user/stories |
| Story insights | `GET /{story-id}/insights` | `instagram_business_manage_insights` | 24 hours only; values under 5 give an error; `replies` = 0 in the EU; `link_clicks` is Facebook Login only | [E] ig-media insights, changelog |
| Publish a Story | `POST /me/media` with `media_type=STORIES`, then `POST /me/media_publish` | `instagram_business_content_publish` | JPEG, 8 MB, 9:16 recommended; no stickers; 100 published posts per 24 hours; 400 containers per 24 hours | [E] content-publishing, ig-user/media |
| Tagged media | `GET /me/tags` | basic + manage_comments | no Story mentions | [E] mentions |
| Webhooks | `POST /me/subscribed_apps` | per field | Live app, Advanced Access, Business Verification, valid HTTPS | [E] webhooks |

## 1. Reading comments and replies

- **Endpoints.** `GET /{media-id}/comments` and `GET /{comment-id}/replies`. Replies can also be fetched inline with `fields=replies{id,text,timestamp,from,...}` [E ig-media/comments].
- **Fields** [E ig-comment]:
  - `from{id,username}`, `hidden`, `id`, `legacy_instagram_comment_id`, `like_count`, `media{id,media_product_type}`, `parent_id`, `replies`, `text`, `timestamp`, `user` (only for our own comments), `username`.
  - `comment_type` and `mentioned_instagram_users` are not supported.
- **Ordering.** "Requests made using version 3.2+ will have results returned in reverse chronological order" [E].
- **Per page.** "Returns a maximum of 50 comments per query" [E]. Paging is standard Graph cursors (`paging.next`). That is [E] from the general Graph API paging docs, and our own calls already paginate.
- **No documented total cap** on how many comments can be retrieved [E: none stated]. [V] community reports suggest paging through thousands works; check the count against `comments_count` on the media.
- **"Comments cannot be filtered by timestamp"** [E]. To apply a deadline, page from newest back to the cutoff and filter on our side.
- **Not returned:**
  - comments on age-gated media;
  - comments by restricted users, until they are unrestricted and the comment is approved;
  - comments on ads (a different object type);
  - Live comments, which can only be read during the broadcast [E ig-comment, ig-media/comments].
- **Hidden comments.** The docs don't say whether they are listed [Gap]. The `hidden` field exists, and our call accepted it.
  - [I] Hidden comments probably come back to the media owner with `hidden=true`.
  - Test it once by hiding a test comment.
  - The rules should say that hidden or deleted spam is not eligible.
- **Rate limit.** All non-messaging endpoints use the Business Use Case limit: "Calls within 24 hours = 4800 * Number of Impressions", per app and user pair, over a rolling 24 hours. "Impressions" means how many times our content entered someone's screen in the last 24 hours [E overview].
  - [I] For an active account this is tens of thousands of calls or more. A giveaway with up to a few thousand comments takes fewer than 100 calls.

## 2. Moderation and private replies

- **Hide or unhide:** `POST /{comment-id}?hide=true|false` returns `{"success":true}`. Comments by the media owner always stay visible. Not supported for Live [E ig-comment].
- **Delete:** `DELETE /{comment-id}`, only on media we own [E ig-comment].
- **Public reply:** `POST /{comment-id}/replies?message=...`. You can only reply to top-level comments; "You cannot reply to hidden comments"; no replies on Live [E ig-comment/replies].
- **All three** use `instagram_business_basic` + `instagram_business_manage_comments` [E comment-moderation].
- **Private reply:** `POST /me/messages` with body `{"recipient":{"comment_id":"..."},"message":{"text":"..."}}` [E private-replies]. The rules:
  - "Only one message can be sent to the commenter".
  - It must be sent within 7 days of the comment.
  - "Follow-up messages can only be sent if the recipient responds, and must be sent within 24 hours of the response".
  - It lands in the person's Inbox if they follow us, otherwise in Requests.
  - It includes a link to the post.
  - Rate limit: 750 per hour for comments on posts and reels [E overview].
  - Permissions: the doc lists only `instagram_business_basic` + `instagram_business_manage_comments` for Instagram Login. [I] Our token has both scopes anyway; if the call fails, `manage_messages` is the likely missing piece.
- **Winner use [I]:** a private reply is the cleanest way to contact a winner who entered by comment. It is one message, within 7 days of their comment. So the draw must happen within 7 days of the entry, or we contact the winner publicly or by asking them to DM us.

## 3. Messaging (DMs)

- **Listing:**
  - `GET /me/conversations?platform=instagram` returns `id, updated_time`.
  - `GET /me/conversations?user_id=<IGSID>` finds one person's thread [E conversations-api].
  - Order and page size aren't documented. We observed 50 per page, newest updated first [E own call].
- **Messages:** `GET /{conversation-id}?fields=messages` returns IDs. Then `GET /{message-id}?fields=...`; the default fields are `id, created_time` [E].
  - The doc says: "you can only get details about the 20 most recent messages in the conversation. If you query a message that is older than the last 20, you will see an error that the message has been deleted." [E conversations-api]
  - We read history back to 2023-11 by expanding `messages{...}` fields on the conversation [E own call]. So the 20-message limit seems to apply to `GET /{message-id}`, or isn't enforced. It is undocumented either way. [I] Treat it as fragile and collect entries daily.
- **Message fields:**
  - [E] in webhook terms (webhooks/examples): `mid`, `text`, `attachments[]`, `reply_to{mid}` (an inline reply), `reply_to{story{url,id}}`, `is_deleted`, `is_unsupported`, and `link_sticker_url` in `reply_to.story` (since 2025-12-12, [E changelog]).
  - Attachment types: `image`, `video`, `audio`, `file`, `ig_post`, `ig_reel`, `reel`, `story`, `ig_story`, `story_mention`. The legacy `share` type is "deprecated after Feb 2026".
  - Edits arrive via the `message_edit` webhook (since 2025-09-10) [E changelog].
  - In the Graph read API we verified: `id, created_time, from, to, message, story{mention{link,id}, reply_to{link,id}}, attachments, reactions, shares, is_unsupported` [E own call].
- **Story replies can be read.** We found 42 messages with `story.reply_to`, some without an `id`. They include replies we sent to other people's stories [E own call], so filter where `from` is not us.
  - [I] The ID is missing when the story has expired or was deleted. Match on `id` when it is present, and otherwise on `created_time` falling inside the Story's 24 hours.
- **Requests folder:**
  - New threads from non-followers start in Requests. "Conversations that are within the Requests folder that have not been active for 30 days will not be returned in API calls" [E].
  - [I] So active Requests threads *are* returned. The API has no folder field.
  - Messages read through the API are not marked as Read in the app [E messaging-api].
- **"Allow access to messages" (Instagram app, Connected tools) has to be on** for API messaging [V vistasocial, creatorflow]. It must already be on for us, because our conversation calls work [E own call]. [I] If anyone switches it off, DM reads stop with no warning, so check it before a campaign.
- **Sending:**
  - Allowed only after the user messages us. The window is "24 hours to respond to any message sent from an Instagram user" [E messaging-api].
  - `HUMAN_AGENT` tag: 7 days, for human support only ("business is closed for the weekend") [E overview]. It is a "feature" listed for App Review [E app-review]. [I] Assume it isn't available without review, and don't plan on it.
  - Other options:
    - Quick replies: 13 maximum, 20 characters each, mobile only [E].
    - Generic template: 10 cards, 3 buttons each, 80-character title and subtitle [E].
    - Button template: 640 characters of text and 3 buttons [E].
    - Ice breakers: up to 4 [E].
    - Persistent menu: not personalised per user, not updated live [E].
- **Message rate limits** [E overview]:
  - Send API: 100 calls per second for text, links, reactions and stickers; 10 per second for audio and video.
  - Conversations API: 2 calls per second.
  - Private replies: 750 per hour on posts and reels, 100 per second on Live.
  - There is no "200 per hour per conversation" figure in the current docs [E: not found].
- **Bot disclosure** is required for automated experiences [E messaging-api]. [I] It's irrelevant if we only read and a human replies.

## 4. Webhooks

- **Fields for Business Login for Instagram** [E webhooks]:
  - `comments`, `live_comments`, `message_echoes`, `message_reactions`, `messages`, `messaging_handover`, `messaging_optins`, `messaging_postbacks`, `messaging_referral`, `messaging_seen`, `standby`, and `message_edit` [E changelog].
  - Mentions are included in `comments`. **`story_insights` is Facebook Login only.**
  - The names are `message_reactions` and `messaging_referral`; there is no `messaging_referrals` field.
- **Story reply payload:** `message{mid,text,reply_to{story{url,id}}}`. Story mention: `attachments[{type:"story_mention",payload{url}}]` [E webhooks/examples].
- **Requirements:**
  - app set to **Live**;
  - **Advanced Access** (the table lists it for Instagram Login overall, and explicitly for comments and Live comments);
  - **Business Verification**;
  - an HTTPS endpoint with a valid, non-self-signed certificate;
  - verification via `hub.challenge`;
  - validation of the `X-Hub-Signature-256` header;
  - subscription via `POST /me/subscribed_apps`;
  - a **public** account for comment and mention events;
  - retries over 36 hours, and the server must deduplicate [E webhooks].
- **Polling or webhooks [I]:** polling is the right choice for us.
  - It needs no server, tunnel, App Review or Business Verification.
  - Polling every 15 to 60 minutes is far under the limits. Webhooks would mainly protect us against the 20-message limit and Requests expiring.
  - If we ever want webhooks, a Cloudflare Worker could receive them and store them in a queue, but the Advanced Access and Business Verification requirement makes it a bigger project.

## 5. Permissions and access

- **Instagram Login scopes:** `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, `instagram_business_content_publish`, and `instagram_business_manage_insights` (used for insights) [E business-login, insights].
- **Standard Access** is "intended for apps that will only be used by people who have roles on them … If your app only serves your Instagram professional account or an account you manage, Standard Access is all your app needs" [E overview].
  - App Review "Not required" for that case [E app-review].
  - Caveat: "some features might not work properly until your app has been granted Advanced Access" [E overview]. Webhooks are the known example.
- **Advanced Access** unlocks app users who have no role on the app (other accounts), webhooks, and features like Human Agent.
  - It needs App Review: a screencast, test instructions, and at least one successful call.
  - It also needs Business Verification [E overview, app-review].
- **Token:** long-lived for 60 days. It can be refreshed once it is at least 24 hours old; if not refreshed within 60 days, it can't be refreshed any more [E business-login].

## 6. What can't be verified via the API

- **Followers:**
  - There is no follower list and no "does X follow us" lookup for arbitrary users [E: none exists in the IG User reference].
  - **Exception:** the User Profile API `is_user_follow_business` works for an IGSID who has DMed us, or tapped an ice breaker or menu item [E user-profile].
  - [I] We *could* check "follows us" for DM entrants, but not for comment-only entrants. A follow check at draw time would only work for winners who messaged us. Keep follow as "appreciated, not required".
- **Likes:** only `like_count` is available, not who liked [E: IG Media has no likers edge].
- **Shares to Story:** no list of who shared [E: none]. Only Stories that **@mention** us show up, as `story_mention` DMs [E webhooks/examples, own call].
  - "Mentions on Stories are not supported" by the Mentions API [E mentions].
  - [I] Mention DMs from accounts we don't follow land in Requests, and mentions from private accounts are only visible if they arrive at all.
- **Story sticker taps:** there are no voter lists for polls, quizzes, sliders or questions [E: no endpoint; publishing stickers is not supported either].
  - Story insights have only aggregates: reach, replies (0 in the EU), navigation, follows, profile_visits, shares, total_interactions, views. `link_clicks` is Facebook Login only [E].
- **Business Discovery** (public data about other business accounts) is Facebook Login only [E business_discovery]. It doesn't apply to us.

## 7. Stories (reading, insights, publishing)

- **Reading:** `GET /me/stories` returns only active stories, for 24 hours. No Live, no reshares, one caption per Story [E ig-user/stories].
  - Insights are available only for 24 hours, and story metrics under 5 return error `(#10)` [E ig-media insights].
  - [I] Save story insights before the Story expires, for example with a job at about 23 hours.
- **Insight metrics for STORY in v25:** `reach`, `replies` (**0 for Stories created in Europe**: "If the Story was created by a user in one of these regions, returns a value of 0"), `navigation` (broken down by `story_navigation_action_type`: tap_forward, tap_back, tap_exit, swipe_forward), `follows`, `profile_visits`, `profile_activity`, `shares`, `reposts`, `total_interactions`, `views` [E ig-media insights].
  - `link_clicks` (added 2026-06-22) is Facebook Login only [E changelog].
  - There is no sticker-tap metric [E].
- **Publishing (the coordinator's question):**
  - Flow: `POST /me/media` with `image_url=<public JPEG>&media_type=STORIES` returns a container ID. Then `POST /me/media_publish?creation_id=...` [E content-publishing].
  - Permissions: `instagram_business_basic` + `instagram_business_content_publish` [E].
  - Stories publishing via the API dates from May 2023 [V cloudcampaign, 2023-05-17]. Instagram Login (with content publishing) launched 2024-07-23 [E changelog].
  - Older docs restricted Story publishing to *business* (not creator) accounts [V mirrored docs]. The current page no longer states this. [I] We are a business account, so it doesn't matter.
  - Image spec: JPEG, 8 MB maximum, 9:16 recommended (otherwise cropped) [E ig-user/media].
  - **No stickers:** "Publishing stickers (i.e., link, poll, location) is not supported; however mentioning users without a sticker is supported" (`user_tags` on Stories since 2025-07-09) [E ig-user/media].
  - No `alt_text`, no collaborators, no filters on Stories [E].
  - Close Friends audience: no parameter exists [E: absent from the parameter table]. [I] Not possible.
- **Quota:**
  - "Instagram accounts are limited to 100 API-published posts within a 24-hour moving period". It is enforced on `media_publish`; check it with `content_publishing_limit` [E content-publishing].
  - The same page's carousel section and the limit reference sample still say 50 [E, inconsistent]. Plan for 50.
  - [I] Stories count toward it, since they go through the same endpoint.
  - Containers expire after 24 hours, with at most 400 per 24 hours [E ig-user/media].
- **Matching:**
  - A published story's `media_product_type` is `STORY`, and it appears in `me/stories` like any other active story [E, I].
  - [I] The `id` from `media_publish` should equal the ID in `me/stories` and the `story.reply_to.id` in DMs (all are IG Media IDs), but no doc says so outright.
  - **Check on the test Story:** publish it, note the ID, have a team member reply, then compare.
- **Quiz Story [I]:** a "reply A/B/C" Story needs no sticker. It can be rendered as a 1080×1920 JPEG, hosted at a public URL, and published by a scheduled job after approval. Answers arrive as `reply_to` DMs that we poll.
  - Caveats:
    - Story replies in the EU still arrive as DMs (we have 42), even though the EU insight metric is 0.
    - Replies from non-followers land in Requests.
    - If someone replies twice, count their first or last answer as the rules state.

## What the giveaway rules must not require

- Following us: it can't be checked for comment entrants [E]. "Appreciated, not required" is fine. A follow check only works for people who DMed us, and the rules shouldn't depend on it.
- Liking the post: there is no list of likers [E].
- Sharing the post to their Story without @mentioning us: it is invisible to the API [E]. If sharing counts, it must be "share **and tag @myspeedpuzzling**", and only the mention DM counts. Private accounts' mentions may not be visible [I].
- Tapping a poll, quiz or question sticker: those answers can't be read [E]. Use "reply to the Story" or "comment" instead.
- Tagging friends: [I] it can be parsed from the comment `text` (an @handle), but we can't verify that the tagged account exists or isn't a fake without extra lookups. It's better not to require it. (Instagram's Promotion Guidelines forbid encouraging inaccurate tagging. [I] Track 2 should verify this.)
- Entries older than our collection window: comments can't be filtered by time, but they stay readable. DM details beyond the newest 20 per thread are only reliable while the documented limit isn't enforced. So collect daily [I].
- Contacting the winner later than 7 days after their comment by private reply, which the API refuses [E]. Announce publicly or ask the winner to DM us.

## Gaps (verify on our own account, read-only or with a test Story)

1. Whether hidden comments are listed by `/comments` (expected: yes, with `hidden=true`).
2. Whether the `media_publish` ID equals the `me/stories` ID equals `story.reply_to.id`.
3. Whether a private reply works with our current scopes. It's a write: do it only with owner approval, on a team member's test comment.
4. Whether `fields=messages{...}` on a conversation keeps returning old messages. The documented limit is 20.
5. Whether Story replies from non-followers in Requests appear in `me/conversations`. Expected: yes while active within 30 days.
6. Whether `HUMAN_AGENT` works under Standard Access. Probably not; don't plan on it.
7. Whether the publishing quota is 100 or 50: read `content_publishing_limit?fields=config,quota_usage`.

## Sources (all accessed 2026-10-17 unless dated otherwise)

- Overview (access levels, rate limits, Human Agent): https://developers.facebook.com/documentation/instagram-platform/overview
- App Review: https://developers.facebook.com/documentation/instagram-platform/app-review
- Business Login (scopes, tokens): https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
- Comment moderation: https://developers.facebook.com/documentation/instagram-platform/comment-moderation
- IG Media comments: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-media/comments
- IG Comment: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-comment
- IG Comment replies: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-comment/replies
- Private replies: https://developers.facebook.com/documentation/instagram-platform/private-replies
- Messaging API: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api
- Conversations API: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/conversations-api
- User Profile API: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api/user-profile
- Quick replies, generic template, button template, ice breakers, persistent menu: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api/{quick-replies,generic-template,button-template,ice-breakers,persistent-menu}
- Webhooks: https://developers.facebook.com/documentation/instagram-platform/webhooks
- Webhook examples: https://developers.facebook.com/documentation/instagram-platform/webhooks/examples
- Mentions (Instagram Login): https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/mentions
- IG User stories: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/stories
- IG Media insights: https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights
- Insights overview: https://developers.facebook.com/documentation/instagram-platform/insights
- Content publishing: https://developers.facebook.com/documentation/instagram-platform/content-publishing
- IG User media (Story limits and spec): https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media
- Content publishing limit: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit
- Business Discovery: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery
- Changelog (2026-06-22 link_clicks; 2025-12-12 link_sticker_url; 2025-09-10 message_edit; 2024-07-23 Instagram Login launch): https://developers.facebook.com/documentation/instagram-platform/changelog
- [V] Cloud Campaign, "Meta Announces Stories Publishing…", 2023-05-17: https://www.cloudcampaign.com/blog/meta-announces-stories-publishing-with-instagram-content-publishing-api
- [V] Vista Social help, "How to allow access to messages in Instagram" (undated): https://support.vistasocial.com/hc/en-us/articles/4444967221019-How-to-allow-access-to-messages-in-Instagram
- [V] Creatorflow, DM automation permissions checklist (2026): https://creatorflow.so/blog/instagram-dm-automation-permissions-checklist/
- [E own] Read-only calls on our account, 2026-10-17 (as listed in the brief).
