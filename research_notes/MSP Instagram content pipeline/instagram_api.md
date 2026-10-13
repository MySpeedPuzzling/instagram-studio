# Instagram API (Meta Instagram Platform): capabilities and constraints for automated publishing and insights (state as of 2026-10-13)

Scope note: research done 2026-10-13. Primary sources are Meta's developer docs (they moved from `developers.facebook.com/docs/instagram-platform/...` to `developers.facebook.com/documentation/instagram-platform/...`; both paths currently resolve), the Instagram Platform changelog, the Graph API changelog, and Meta's newsroom and Help Center. Third-party sources are marked as such. The live API was not called. No secrets or personal data appear in these notes.

Version context: Graph API v26.0 was released July 29, 2026. v25.0 (used by the prototype) was released February 18, 2026 and stays available until July 29, 2028. v24.0 runs until February 18, 2028 and v23.0 until October 8, 2027 — [Graph API changelog](https://developers.facebook.com/docs/graph-api/changelog). Staying on v25.0 is safe for about 21 months.

---

## 1. Instagram Login vs Facebook Login, permissions, App Review, tokens

### Takeaway
For one own professional account, keep the existing **Instagram API with Instagram Login** (graph.instagram.com). It needs no Facebook Page and supports publishing, insights, comment moderation, the `is_ai_generated` flag and Trial Reels. Standard Access works for accounts you own and have added to the app, so no App Review is needed. Facebook Login is needed for only a few features, and some of them matter to us: resumable/local video upload, media DELETE (per the reference page), licensed music via the Audio API, product tags, partnership labels, hashtag search, and some richer insight and engagement fields.

### Cited Findings
- **Two configurations:**
  - Instagram Login (Business Login for Instagram): Instagram User token, host `graph.instagram.com`, no Facebook Page required.
  - Facebook Login for Business: Facebook User or Page token, host `graph.facebook.com`, requires a linked Facebook Page.
  - — [Instagram Platform overview](https://developers.facebook.com/docs/instagram-platform/overview)
- **Feature matrix (overview page):**
  - Both logins: content publishing, insights, comment moderation, messaging, mentions.
  - Facebook Login only: hashtag search, product tagging, Partnership Ads.
  - — [Overview](https://developers.facebook.com/docs/instagram-platform/overview)
- Instagram API with Instagram Login launched July 23, 2024 (graph.instagram.com, no Facebook Page required) — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **Publishing permissions:**
  - Instagram Login: `instagram_business_basic` + `instagram_business_content_publish`.
  - Facebook Login: `instagram_basic` + `instagram_content_publish` + `pages_read_engagement`, plus `ads_management`/`ads_read` if the user has a Business Manager role on the Page.
  - — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- **Insights permissions:** `instagram_business_basic` + `instagram_business_manage_insights` (Instagram Login) — [Media insights reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights), [User insights reference](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- **Comment permissions:** `instagram_business_basic` + `instagram_business_manage_comments` (Instagram Login) — [Comment moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- **Scope names:** the new `instagram_business_*` scope values were introduced September 17, 2024. The old `business_*` values were deprecated January 27, 2025 — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **Access levels:**
  - Standard Access is the default for all apps and is meant for people with roles on the app.
  - Advanced Access (App Review + Business Verification) is needed only to serve professional accounts you don't own or manage, or users without a role on the app.
  - — [Overview](https://developers.facebook.com/docs/instagram-platform/overview)
- "Standard Access if your app serves Instagram professional accounts you own or manage and have added to your app in the App Dashboard" — [Instagram Login User Profile API docs, via Context7 index of developers.facebook.com](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api/user-profile); same rule stated on [Comment moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- Content publishing "requires Advanced or Standard Access" (both login types) — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- "If your app serves only your Instagram professional accounts, or accounts you manage, you do not need to implement a login flow." You still configure business login settings to get an Instagram app ID/secret and long-lived tokens — [Overview (via Context7)](https://developers.facebook.com/documentation/instagram-platform/overview)
- **Dashboard token path:** App Dashboard > Instagram > "API setup with Instagram business login" > "Generate token" next to the account. Tokens generated there are long-lived (60 days). Business-login-flow tokens are short-lived (1 h) — [Get started (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started)
- **Token lifetimes:** authorization code 1 h, single use. Short-lived token 1 h. Long-lived token 60 days, refreshable before expiry — [Overview](https://developers.facebook.com/docs/instagram-platform/overview); [Business Login docs (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login)
- **Exchange:** `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=...&access_token=<short-lived>`. Server-side only, because it uses the app secret. Returns `expires_in` ≈ 5,184,000 s — [Business Login (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login)
- **Refresh:** `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<long-lived>`. The token must be **at least 24 h old and still valid (not expired)**, and the user must have granted `instagram_business_basic`. Refresh extends it by another 60 days — [Business Login (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login)
- OAuth extras: `force_reauth` was added June 14, 2025. `enable_fb_login` is supported again since February 6, 2026 (default `true`) — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- Private apps (no UI, or no Facebook Login for Business) can only request approval for `instagram_basic` and `instagram_manage_comments`. This applies to the Advanced Access path only — [Overview](https://developers.facebook.com/docs/instagram-platform/overview)

### Inferences
- Development mode plus Standard Access is enough for @myspeedpuzzling, as long as the IG account is added to the app (the role/tester assignment in the App Dashboard) and the token is generated for it. App Review and Business Verification are not needed.
- Token hygiene for a local pipeline:
  - Refresh on every run (or daily) once the token is more than 24 h old, and persist the new token and expiry in the local secret store (Keychain).
  - An expired token cannot be refreshed. If the Mac is off for more than 60 days, someone must re-generate the token in the App Dashboard. Alert well before expiry, for example when fewer than 7 days remain.
- Switching to Facebook Login would require linking a Facebook Page and handling Page roles, PPA and 2FA requirements. Only consider it if local video upload without hosting, licensed library music, or API deletion become must-haves.

### Gaps
- The Instagram Login setup page ([create-a-meta-app-with-instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/create-a-meta-app-with-instagram)) returned only a stub, so I could not quote the exact current role name ("Instagram Tester" vs "Tester") or whether dev-mode apps need the account to accept an invite. The existing prototype already works, so this is likely moot.
- No official statement found on whether a development-mode app has any extra limits (e.g. reduced rate limits) compared with a live-mode app for own-account publishing.

---

## 2. Content publishing: media types, fields, specs

### Takeaway
Via the API you can publish:
- single images (**JPEG only**)
- videos and Reels
- carousels (**2–10 items**, images and/or videos mixed; **not 20** as in the app)
- image and video Stories
- Trial Reels

Feed images must be **4:5 to 1.91:1**. **3:4 is rejected** (error 2207009), even though the app and grid support 3:4. Use 1080×1350 (4:5) for portrait feed posts and carousels.

Optional fields: `caption`, `alt_text` (images only), `user_tags`, `collaborators` (up to 3), `location_id`, `is_ai_generated`, Reel-specific `cover_url`/`thumb_offset`/`share_to_feed`/`audio_name`/`trial_params`. Shopping/product tags and partnership labels need Facebook Login.

### Cited Findings

**Media types**
- **Images:** "JPEG is the only image format supported". MPO and JPS are not supported — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- **Carousels:**
  - Up to 10 images, videos, or a mix.
  - "All images are cropped to the first image's aspect ratio, which defaults to 1:1".
  - — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
  - Error `2207028` when a carousel has too few or too many items: "Use 2–10 photos/videos" — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)
  - Reels cannot appear in carousels — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- **20-item carousels** exist only in the Instagram app. The Graph API remains capped at 10 — [Sprout Social help (third-party)](https://support.sproutsocial.com/hc/en-us/articles/42017616974349-Instagram-Mixed-Media-Posts); consistent with the official 10-item limit above.
- **Reels:**
  - Create with `media_type=REELS` + `video_url`.
  - Published Reels return `media_type=VIDEO`, so check `media_product_type`.
  - Stories also return `IMAGE`/`VIDEO`, so check `media_product_type` there too.
  - — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- **Trial Reels:**
  - `trial_params` with `graduation_strategy` = `MANUAL` (graduated manually in the app) or `SS_PERFORMANCE` (auto-graduates if it performs well). Reels only.
  - Added December 3, 2025 for **both** Instagram Login and Facebook Login.
  - — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media), [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **Stories** (`media_type=STORIES`):
  - Stories expire after 24 h.
  - Link, poll and location stickers are not supported. Mentioning users without a sticker is supported.
  - — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)

**Container parameters** (`POST /<IG_ID>/media`) — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media):
- `image_url` / `video_url`: must be on a public server.
- `caption`: max **2,200 chars, 30 hashtags, 20 @mentions**. Not allowed on carousel children (see section 11 for the newer in-app 5-hashtag cap).
- `alt_text`: up to **1,000 chars**, images only (single image or carousel image). Not for Reels or Stories. Added **March 24, 2025** ([Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)).
- `location_id`: a Facebook **Page ID** that has location data. Otherwise the request fails with `INSTAGRAM_PLATFORM_API__INVALID_LOCATION_ID`. Not on carousel children.
- `collaborators`: array of **up to 3 usernames**, for feed image, Reels and carousel. Not for Stories.
- `user_tags`: array of `{username, x, y}`. For images, `x`/`y` (0.0–1.0) are required. For Stories they are optional (Stories support added **July 9, 2025**).
- `product_tags`: max 5, needs product-tagging permissions. Product tagging is Facebook Login only per the [Overview](https://developers.facebook.com/docs/instagram-platform/overview).
- `share_to_feed` (Reels): `true` = Feed + Reels tab, `false` = Reels tab only. "Display is not guaranteed".
- `audio_name` (Reels): renames original audio. Can be renamed only once.
- `cover_url` (Reels): public JPEG. Overrides `thumb_offset`.
- `thumb_offset` (ms, default 0). Error `2207057` if it is out of range ([Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)).
- `upload_type=resumable`: Reels, carousel video items, video Stories (see section 3).
- `is_ai_generated`: boolean AI self-disclosure (see section 9). Not allowed on carousel children.
- `branded_content_sponsor_ids` (max 2) / `is_paid_partnership`: **Facebook Login only** (added April 22, 2026, [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)).

**Other limitations** — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/):
- Shopping tags are not supported.
- Filters are not supported.
- Accounts whose Page requires Page Publishing Authorization (PPA) can't publish until PPA is complete (Facebook Login context).

**Image spec** — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media):
- JPEG, **max 8 MB**
- Aspect ratio **4:5 to 1.91:1**
- Width min 320 px (upscaled), max 1440 px (downscaled)
- sRGB (other color spaces are converted)
- Errors: `36000/2207004` image > 8 MiB; `36001/2207005` unsupported format; **`36003/2207009` aspect ratio outside 4:5–1.91:1** — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)

**3:4 support:**
- Third-party guidance says 1080×1440 (3:4) works only when posting in the app, because the publishing API accepts 4:5–1.91:1. Another third-party source says the app added native 3:4 in May 2025 — [Postnitro blog (third-party)](https://postnitro.ai/blog/post/post-multiple-photos-instagram-2026).
- Official docs (above) still list 4:5–1.91:1, and 3:4 (0.75) is narrower than 4:5 (0.8).

**Reels spec** — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media):
- Container: MOV/MP4, moov atom at the front, no edit lists
- Video: H.264 or HEVC, progressive, closed GOP, 4:2:0
- Frame rate 23–60 fps; max 1920 px columns
- Aspect ratio 0.01:1–10:1 (9:16 recommended)
- VBR max 25 Mbps
- Audio: AAC, ≤48 kHz, mono/stereo, 128 kbps
- Duration **3 s–15 min**; max size **300 MB**
- Cover image: JPEG ≤8 MB, sRGB. Center-cropped to 9:16, and center-cropped to 1:1 for feed display.

**Story spec** — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media):
- Image: JPEG ≤8 MB, 9:16 recommended
- Video: 3–60 s, ≤100 MB, aspect ratio 0.1:1–10:1, other specs as for Reels

**Container quota and URLs** — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media):
- Max **400 containers** per account per rolling 24 h.
- URLs should be US-ASCII only, "or the request will fail".

### Inferences
- Standard formats for the pipeline:
  - Feed and carousel: **1080×1350 JPEG, sRGB, <8 MB**. All carousel slides use the same 4:5 ratio, because the API crops every slide to the first one.
  - Reels and Stories: 1080×1920 (9:16).
- Never export PNG; convert to JPEG before upload. Never export 3:4 (1080×1440) for API posts.
- Add a pre-flight validator for ratio, format, size, caption length, hashtag/mention counts and carousel count (2–10) to avoid wasting containers.
- Keep Reel covers centred and safe for both 9:16 and 1:1 crops, plus a 3:4 grid crop (see Gaps).
- `alt_text` is a cheap accessibility win for data-viz images. Generate it from the underlying stats.

### Gaps
- No official Meta doc found confirming or denying 3:4 acceptance in 2026. Docs and error text still say 4:5–1.91:1. Verify with one test container before relying on anything other than 4:5.
- The cover docs mention 1:1 feed cropping. How Reel covers are cropped in the 3:4 profile grid is not documented.
- Whether `collaborators` and `location_id` behave identically under Instagram Login is not separately documented. The reference lists permissions in a combined, Facebook-Login-oriented block. Also, finding a location Page ID normally needs Facebook Pages search, which is unavailable under Instagram Login.
- One fetch of the IG User Media reference noted that its carousel resumable example uses `media_type=VIDEO` with `is_carousel_item=true`. Documentation inconsistency; untested.

---

## 3. Media hosting: public URL vs direct upload; local-only options

### Takeaway
For **images**, the API still has **no upload endpoint**: Meta must fetch a **publicly reachable HTTPS URL**, and the media must still be reachable "when publishing is attempted". Resumable/direct upload (`rupload.facebook.com`) exists only for **video** and is officially documented only for **Facebook Login**. Under Instagram Login, plan on hosting every asset at a public URL (e.g. Cloudflare R2 public bucket or custom domain). Keep the URL alive at least until `media_publish` succeeds, and make sure no WAF or bot protection blocks Meta's fetcher.

### Cited Findings
- "Media must be on a publicly accessible server when publishing is attempted" — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- `image_url` / `video_url`: "Must be on a public server" — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- **Resumable upload — official position:** "Only for apps using Facebook Login for Business". Use `upload_type=resumable` when creating the container, then `POST https://rupload.facebook.com/ig-api-upload/<version>/<IG_MEDIA_CONTAINER_ID>`.
  - Local file: headers `Authorization: OAuth <token>`, `offset` (usually 0), `file_size`, and the binary body.
  - Hosted file: header `file_url`.
  - Success response: `{"success": true, "message": "Upload successful."}`.
  - — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/); [Resumable uploads (via Context7)](https://developers.facebook.com/documentation/instagram-platform/content-publishing/resumable-uploads)
- `upload_type=resumable` applies to Reels, carousel video items and video Stories only, not images — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- **Conflicting third-party claims on Instagram Login:**
  - An Upload-Post guide shows a resumable REELS container created on `graph.instagram.com` and then uploaded to rupload — [Upload-Post Instagram API guide (third-party)](https://www.upload-post.com/instagram-api/).
  - Another project concluded resumable upload works only for video and only via Facebook Login, and that "a picture is published by handing Instagram a public https address" — [GitHub PR in caleblschulte0-ux/Aletheia (third-party)](https://github.com/caleblschulte0-ux/Aletheia/pull/210).
  - Open-source tools using resumable uploads with no hosting exist for the Facebook Login route — [deegitech/ig-publish](https://github.com/deegitech/ig-publish), [n8n-instagram-reels-publisher](https://github.com/bugraskl/n8n-instagram-reels-publisher).
- **Fetch failures:** error `9004/2207052` "media could not be fetched from the URI" means the URI is invalid or not public. `-2/2207003` means the download timed out — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)
- Common causes of 2207052 per third parties:
  - non-200 response, wrong `Content-Type`, zero-byte file, redirects, signed-URL expiry, bot protection
  - — [Revive Social docs](https://docs.revive.social/general-guides/fix-instagram-error-the-media-could-not-be-fetched-from-this-uri), [PostPeer error reference](https://www.postpeer.dev/errors/instagram)
  - A Meta developer-community thread reports intermittent failures with signed S3 URLs — [Meta developer community thread](https://developers.secure.facebook.com/community/threads/269924622604896/)
- **Meta's crawler** (`facebookexternalhit`) gets blocked by Cloudflare Bot Fight Mode, AWS WAF managed bot rules and similar, even when robots.txt allows it. The fix is a WAF exception for `facebookexternalhit`. Meta caches robots.txt for up to 24 h. Presigned URLs must outlive the fetch — [Ayrshare help: Meta media crawler blocked (third-party)](https://www.ayrshare.com/docs/help-center/technical-support/meta_media_crawler_blocked)
- A real-world case: Fastly bot protection on a custom domain returned 403 to Meta's crawler, causing 9004/2207052 — [Railway community thread](https://station.railway.com/questions/fastly-bot-protection-blocking-facebook-a2b85d7c)

### Inferences
- **Recommended setup for a local-only Mac pipeline:**
  - Upload the approved JPEG or MP4 to a dedicated **Cloudflare R2 bucket** with a public custom domain (or r2.dev for low volume). Use random, unguessable, ASCII-only object keys and the correct `Content-Type` (`image/jpeg`, `video/mp4`).
  - Disable Bot Fight Mode and hotlink protection on that hostname, or add a WAF skip rule for the `facebookexternalhit` user agent.
  - Keep each object until `media_publish` returns a media ID and the published media's status is confirmed. Then delete it with a lifecycle rule (e.g. 7 days).
- **Presigned URLs** work in principle, but their expiry must cover container creation, processing (video) and publish. With the 24 h container lifetime, a 24 h+ expiry is the safe choice. Public custom-domain objects avoid expiry and query-string issues.
- **Temporary tunnels** (cloudflared / ngrok quick tunnels) to the Mac are the most fragile option. Meta must fetch the file while the tunnel is up, ngrok's free interstitial page breaks automated fetchers, and the Mac must be online. Not recommended.
- **Test reachability before calling the API:** a HEAD/GET from outside the network, plus the [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) as a crawler-reachability check (third-party suggestion via Ayrshare).
- Moving to Facebook Login would remove hosting for video only. Images would still need a public URL, so R2 hosting is needed either way.

### Gaps
- Not verified whether `upload_type=resumable` plus `rupload.facebook.com` works with an Instagram-Login token on `graph.instagram.com` in October 2026. The official docs say no; one third party says yes. Test it on the real account before depending on it.
- No official list of the IP ranges or user agents Meta uses to fetch `image_url`/`video_url`. The `facebookexternalhit` claim comes from third parties.

---

## 4. Container lifecycle, status polling and common errors

### Takeaway
The flow is: create container(s) → for video, poll `status_code` until `FINISHED` → (carousel: create the parent container from the child IDs) → `POST /<IG_ID>/media_publish?creation_id=...` → store the returned media ID. Containers **expire after 24 h**. Poll about **once per minute, for at most 5 minutes**. Map known error subcodes to retry, regenerate or abort actions.

### Cited Findings
- **Endpoints:** `POST /<IG_ID>/media` (create), `POST /<IG_ID>/media_publish` with `creation_id` (returns the media `id`), `GET /<IG_CONTAINER_ID>?fields=status_code`, `GET /<IG_ID>/content_publishing_limit` — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- **`status_code` values:**
  - `EXPIRED`: not published within 24 h
  - `ERROR`: publishing failed
  - `FINISHED`: ready
  - `IN_PROGRESS`: still processing
  - `PUBLISHED`
  - "Query status once per minute, for no more than 5 minutes."
  - — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- Containers expire after 24 hours, with a cap of 400 container creations per rolling 24 h — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- **Selected error codes** (code/subcode → meaning → action) — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes):

  | Code / subcode | Meaning | Action |
  |---|---|---|
  | `-1/2207001` | server error | retry |
  | `-1/2207032` | media creation failed | retry |
  | `-1/2207053` | unknown upload error (mostly video) | new container |
  | `-2/2207003` | download timeout | retry |
  | `-2/2207020` | media expired | new container |
  | `24/2207008` | creation ID missing/expired | retry 1–2× over 30 s–2 min, then new container |
  | `24/2207006` | media not found | check permissions and token, then new container |
  | `9007/2207027` | not ready | wait for `FINISHED` |
  | `9/2207042` | daily publishing limit reached | retry next day |
  | `4/2207051` | flagged as spam | wait |
  | `25/2207050` | account inactive, checkpointed or restricted | user must open the app and resolve |
  | `100/2207028` | carousel count outside 2–10 | fix item count |
  | `100/2207040` | more than 20 @tags | reduce @tags |
  | `352/2207026` | unsupported video format | use MOV/MP4 |
  | `9004/2207052` | fetch failed | fix URL/hosting |
  | `36000/2207004` | image > 8 MiB | shrink image |
  | `36001/2207005` | unsupported image format | use JPEG |
  | `36003/2207009` | aspect ratio outside range | use 4:5–1.91:1 |
  | `36004/2207010` | caption too long, or more than 30 hashtags / 20 @tags | shorten caption |
  | `1/2207057` | `thumb_offset` out of range | fix offset |

- The error-codes page itself appears to have a copy-paste error: the recommended action for 2207005 duplicates 2207006 (permissions or expired token) — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)
- Business Use Case rate-limit violations on Instagram Platform endpoints reportedly return error **80002** (third-party summary in search results; not confirmed on a Meta page) — search-result snippet via [Smash Balloon error reference (third-party)](https://smashballoon.com/doc/instagram-api-error-message-reference/)

### Inferences
- **Persist pipeline state per post** (container IDs, status, attempts, media ID) so that a crash between `media_publish` and recording the result doesn't cause a double post.
- **Before retrying a publish**, check `content_publishing_limit.quota_usage` and/or the latest media on `/me/media`. Third-party tools explicitly guard against double-posting this way ([deegitech/ig-publish](https://github.com/deegitech/ig-publish)).
- **Images** are usually `FINISHED` almost immediately. **Videos and Reels** can take minutes. Use a 60 s poll and a 5–10 min ceiling, then treat the post as failed and create a new container.
- **Carousels:** create children first, then the parent with `media_type=CAROUSEL&children=id1,id2,...`. Caption, location, collaborators and `is_ai_generated` go on the parent only.

### Gaps
- The official docs give no exact processing-time SLA. Whether polling more often than once a minute triggers throttling is not specified.
- Code 190 (OAuthException, invalid or expired token) is not on the Instagram error-codes page. It is standard Graph API behaviour, not verified here.

---

## 5. Rate limits

### Takeaway
Publishing is capped per account per rolling 24 h; carousels count as 1. Current docs **conflict on the number (100 vs 50; older third-party docs say 25)**, so read `quota_total` from `content_publishing_limit` at runtime. For MSP's 1–3 posts a day this never binds. General calls fall under Business Use Case limits (4800 × impressions per 24 h). Container creation is capped at 400 per 24 h.

### Cited Findings
- "Instagram accounts are limited to **100** API-published posts within a 24-hour moving period. Carousels count as a single post." The limit is enforced at `media_publish`, and apps that schedule posts should enforce it themselves — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/) (the same page's carousel section says "50 published posts within a 24-hour period", so the page contradicts itself)
- The `content_publishing_limit` reference page says `quota_total` is "currently `50`" and `quota_duration` is 86400 s. The guide's example shows `quota_total: 100` and `quota_duration: "24h"`.
  - Fields: `quota_usage` (default), `config{quota_total,quota_duration}`, and a deprecated-looking `rate_limit_settings`.
  - The `since` parameter must be a Unix timestamp no older than 24 h.
  - — [content_publishing_limit reference (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit), [Content publishing guide (via Context7)](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
- A third-party vendor still describes a **25 posts / 24 h** limit (error 9) — [Ayrshare (third-party)](https://www.ayrshare.com/solutions/instagram-graph-api-error-9-the-25-post-daily-limit-how-to-fix-it.md)
- Daily-limit error: code 9, subcode 2207042 — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)
- Container creation: max 400 per rolling 24 h — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- **Business Use Case rate limit:** "Calls within 24 hours = 4800 × Number of Impressions", where impressions are the times the account's content appeared on screens in the last 24 h. Messaging is excluded — [Overview](https://developers.facebook.com/docs/instagram-platform/overview)
- Comment moderation docs: "We strongly recommend using webhooks to prevent rate limiting" — [Comment moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)

### Inferences
- Rate limits are a non-issue for MSP's volume.
- Because the BUC budget scales with impressions, a very quiet account has a smaller call budget. Avoid aggressive insights polling loops: batch metrics per call, and collect insights once or twice a day.

### Gaps
- Could not determine authoritatively whether the live `quota_total` is 25, 50 or 100 in October 2026 (official pages disagree). Query the endpoint once and record the value.

---

## 6. Scheduling

### Takeaway
There is **no native scheduled-publish parameter** in the Instagram content publishing API. Scheduling is the app's job: something must call `media_publish` at the desired time. The 24 h container lifetime allows pre-creating (and pre-validating) a container up to about 24 h ahead.

### Cited Findings
- The full container parameter list (`POST /<IG_ID>/media`) has no `scheduled_publish_time` or similar field — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Meta's own guidance assumes app-side scheduling: "We recommend that your app also enforce the publishing rate limit, especially if your app allows app users to schedule posts to be published in the future." — [Content publishing guide (via Context7)](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
- Containers expire after 24 h (`EXPIRED` status) — [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- Historic note: 2018 coverage of "scheduling via Graph API" referred to partner tools doing their own scheduling — [MarTech, 2018](https://martech.org/instagram-adds-option-schedule-posts-thru-new-graph-api-old-platform-api-nears-shutdown)

### Inferences
- **Local-only implications:**
  - The Mac must be **awake, online, and running the scheduler** at publish time. Use launchd (`StartCalendarInterval`) plus `pmset` wake schedules, or `caffeinate` during the window.
  - The media URL (R2) must be live at publish time.
  - The token must be valid.
- **Robust pattern:**
  1. At approval time, upload to R2, create the container(s), and wait for `FINISHED` (this catches spec errors early).
  2. At the scheduled time, call `media_publish`.
  3. If the scheduled time is more than about 23 h away, create the containers closer to the time.
  4. If a publish window is missed (Mac asleep), run a catch-up policy: publish late, or ask for re-approval.
- A cloud cron (e.g. a Cloudflare Worker cron calling `media_publish`) would remove the "Mac must be awake" constraint. That breaks the local-only requirement and would require storing the token in the cloud, so it is a design decision.
- Native in-app scheduling (Meta Business Suite) is not reachable via this API.

### Gaps
- I found no official 2025–2026 statement explicitly saying "scheduling is not supported via API". The conclusion rests on the absence of any scheduling parameter in the reference and on the guide's wording above.

---

## 7. Post-publish operations

### Takeaway
Under Instagram Login you **can**:
- post comments (including a "first comment") on your own media
- reply to comments
- hide or unhide comments
- delete comments
- enable or disable comments on a post

You **cannot edit the caption** of a published post via the API.

**Deleting media** (`DELETE /{ig_media_id}`, added December 3, 2025) requires the new `instagram_manage_contents` permission and is documented as **Facebook Login only** on the IG Media reference. The changelog does not restrict the login type, so test before relying on it.

### Cited Findings
- **Updating media:** `POST /<IG_MEDIA_ID>` documents only `comment_enabled` (true/false). No caption editing is documented. Live video is not supported — [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media)
- **Deleting media:**
  - The IG Media reference lists delete permissions as "Not supported" for Instagram Login, and `instagram_basic` + `instagram_manage_contents` for Facebook Login.
  - Supports non-ad posts, Stories, Reels and whole carousels (delete via the parent ID; individual carousel children cannot be deleted).
  - Error `2207073` is returned for unsupported media types.
  - — [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media)
  - The changelog (December 3, 2025) says `DELETE /{ig_media_id}` deletes posts, carousels, Reels and Stories and needs "a new required permission `instagram_manage_contents`", without restricting the login type — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **First comment / own comment:** `POST /<IG_MEDIA_ID>/comments?message=...` returns the comment `id` — [IG Media comments reference (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-media/comments)
- **Reply:** `POST /<IG_COMMENT_ID>/replies` with `message` — [Comment moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- **Hide/unhide:** `POST /<IG_COMMENT_ID>?hide=true|false` with the media owner's token. Comments made by the media owner on their own media are always displayed even if hidden. Live video is not supported — [IG Comment reference (via Context7)](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-comment)
- **Delete comment:** `DELETE /<IG_COMMENT_ID>` — [Comment moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- **Comment permissions (Instagram Login):** `instagram_business_basic` + `instagram_business_manage_comments` — [Comment moderation](https://developers.facebook.com/docs/instagram-platform/comment-moderation)
- **Readable media fields include:**
  - `id`, `media_type`, `media_product_type`, `media_url`, `permalink`, `shortcode`, `thumbnail_url`, `timestamp`
  - `caption`, `alt_text`, `like_count`, `comments_count`
  - `is_comment_enabled`, `is_ai_generated`, `is_shared_to_feed`, `media_audio_type`, `copyright_check_information`
  - `reposts_count`, `saved_count`, `shares_count` and the `total_*` counts are **Facebook Login only** (added April 22, 2026)
  - — [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media), [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- Captions read via the API omit the `@` symbol unless the app user has admin-equivalent tasks on the app — [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media)
- A Like Media and Comments API (`/likes`, needs `instagram_manage_engagement`) and a Collaborative Media API were added April 22, 2026 — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)

### Inferences
- **Proofread captions in the human-approval step.** A typo can only be fixed by editing in the Instagram app manually, or by deleting and reposting (and API delete may need Facebook Login).
- **"First comment" automation:** after `media_publish` succeeds, `POST /{media-id}/comments`. This needs `instagram_business_manage_comments` added to the token's scopes. If the prototype token lacks it, re-generate the token.
- **Hiding:** MSP's own first comment cannot be hidden (owner comments always display).

### Gaps
- Whether `DELETE /{ig_media_id}` works with an Instagram Login token on graph.instagram.com, and whether an `instagram_business_manage_contents` scope exists, was not found. The sources conflict (see above).
- The field-level login restrictions on the IG Media reference (e.g. `caption` and `media_product_type` marked "Facebook Login only" in one fetch summary) look inconsistent with the content-publishing guide, which tells Instagram Login apps to check `media_product_type`. Verify with a GET on our own media.

---

## 8. Insights API

### Takeaway
Since **January 21, 2025**, insights are available to Instagram Login apps (`instagram_business_manage_insights`). The 2025 model is **`views`** (replacing impressions and plays).

- **Media level:** `views`, `reach`, `likes`, `comments`, `saved`, `shares`, `total_interactions`, `follows`, `profile_visits`, `profile_activity`, `reposts`, plus Reels `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time` and `reels_skip_rate`.
- **Deprecated:** `impressions`, `plays`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` (all versions from April 21, 2025) and `video_views` (from January 8, 2025).
- **Account level:** totals and demographics need **≥100 followers**. `online_followers` is still referenced in the docs (last 30 days, ≥100 followers) but has dropped out of the metrics table, so treat it as unreliable.
- **Data:** may lag up to **48 h**. Media metrics are stored up to **2 years**.

### Cited Findings

**Media insights** — `GET /<IG_MEDIA_ID>/insights?metric=...` — [Media insights reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)

| Metric | Media types | Notes |
|---|---|---|
| `comments` | FEED, REELS | |
| `follows` | FEED, STORY | |
| `ig_reels_avg_watch_time` | REELS | |
| `ig_reels_video_view_total_time` | REELS | "in development" |
| `likes` | FEED, REELS | |
| `link_clicks` | STORY | |
| `navigation` | STORY | breakdown `story_navigation_action_type`: SWIPE_FORWARD, TAP_BACK, TAP_EXIT, TAP_FORWARD |
| `profile_activity` | FEED, STORY | breakdown `action_type`: BIO_LINK_CLICKED, CALL, DIRECTION, EMAIL, OTHER, TEXT |
| `profile_visits` | FEED, STORY | |
| `reach` | FEED, REELS, STORY | |
| `reels_skip_rate` | REELS | "in development" |
| `replies` | STORY | 0 for EU/Japan users |
| `reposts` | FEED, REELS, STORY | |
| `saved` | FEED, REELS | |
| `shares` | FEED, REELS, STORY | |
| `total_interactions` | FEED, REELS, STORY | |
| `views` | FEED, REELS, STORY | "in development" label still on the page |
| `crossposted_views`, `facebook_views` | various | require Facebook sharing |
| `total_likes`, `total_comments`, `total_views` | various | Facebook Login only |

- **Deprecations:**
  - `video_views`: deprecated v21.0+, all versions January 8, 2025 — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
  - `clips_replays_count`, `ig_reels_aggregated_all_plays_count`, `impressions` (media and user), `plays`: deprecated v22.0+, **all versions April 21, 2025**. `views` was introduced the same day (January 21, 2025) — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
  - `impressions` still returns data only for media created before July 2, 2024 — [Media insights reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- **Recent additions:** `reels_skip_rate`, `reposts`, `crossposted_views`, `facebook_views` (December 3, 2025). `link_clicks` Story metric (June 22, 2026, listed as Facebook Login) — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **Media limitations** — [Media insights reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights):
  - No insights for media **inside** an album (carousel children). Query the carousel parent.
  - Story metrics are available for only 24 h (longer if added to a highlight). Fewer than 5 viewers returns error `(#10) Not enough viewers`.
  - Organic only, except the `total_*` metrics.
  - Unavailable data returns an empty set, not 0.
  - Delay up to 48 h; data stored up to 2 years.
  - **Insights webhooks are not supported for Instagram Login.**
  - Requesting an unsupported breakdown returns "An unknown error has occurred".
- **Account insights** — `GET /<IG_ID>/insights` — [User insights reference](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights):
  - Metrics (all `period=day` unless noted):
    - `accounts_engaged`, `comments`, `follows_and_unfollows` (breakdown `follow_type`), `likes`, `profile_links_taps` (breakdown `contact_button_type`), `replies`, `reposts`, `saves`, `shares`, `total_interactions`
    - `reach` (the only one supporting `time_series`; breakdowns `media_product_type`, `follow_type`)
    - `views` (breakdowns `follower_type`, `media_product_type`)
    - `follower_demographics` and `engaged_audience_demographics` (`period=lifetime`, required `timeframe` = `this_week` | `this_month`, breakdowns age/city/country/gender)
  - Breakdowns are returned only with `metric_type=total_value`.
  - Account `impressions` was deprecated for all versions April 21, 2025.
  - `last_14_days`/`last_30_days`/`last_90_days`/`prev_month` timeframes are unsupported from v20.0.
  - `follower_demographics` needs ≥100 followers; `engaged_audience_demographics` needs ≥100 engagements in the timeframe. Only the top 45 values are returned. `since`/`until` don't apply to demographics.
  - Without `since`/`until` the API looks back 24 h. Delay up to 48 h. Unavailable data returns an empty set.
- **Time-series deprecations:** `profile_views`, `website_clicks`, `email_contacts`, `get_direction_clicks`, `text_message_clicks`, `phone_call_clicks` (v21.0+, all versions January 8, 2025) — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **`online_followers`:** the limitations section still says "`follower_count` and `online_followers` metrics are not available on … accounts with fewer than 100 followers" and "online_followers … only available for the last 30 days". The current metrics table no longer lists them — [User insights reference (via Context7)](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights). Third-party integration notes (January 2025, v21 upgrade) describe the same limits, not removal — [Rivery](https://docs.rivery.io/docs/2025-01-instagram-upgrade-v21), [Boomi](https://help.boomi.com/docs/Atomsphere/Data_Integration/APIUpgradesChangelog/2025/2025-01-instagram-upgrade-v21)
- **Doc inconsistencies:** a Context7-indexed example still uses `timeframe=last_90_days` for `engaged_audience_demographics`, which contradicts the "unsupported since v20" note. The page mixes `breakdown`/`breakdowns` and `total_value`/`total_values` — [User insights reference](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)

### Inferences
- **Feedback-loop design:**
  - Pull media insights at about T+24 h, T+72 h and T+7 d (data lags up to 48 h). Store them locally, because it's the basis for learning which post types work.
  - Use `views`, `reach`, `saved`, `shares`, `total_interactions`, `follows` and `profile_visits` for feed posts and carousels, plus the Reels watch-time and skip-rate metrics.
  - Never use `impressions`/`plays`.
- **Best posting time:**
  - Try `online_followers` once. If it returns an empty set or an error, fall back to our own historical reach/views per hour-of-day from our posts.
  - The `reach` `time_series` at account level is another proxy.
- **Carousels:** request insights on the carousel parent ID only.
- **Polling vs webhooks:** under Instagram Login there are no insights webhooks. Story metrics must be fetched within 24 h (the local scheduler must run then).

### Gaps
- Could not confirm whether `online_followers` still returns data in v25/v26. It is not in the metrics table but still in the limitations. Needs a live test.
- Exact metric sets valid for `media_product_type=CAROUSEL_ALBUM` parents are not tabulated separately (the page lists FEED/REELS/STORY). Carousels are presumably FEED.
- Metrics labelled "in development" (`views`, `total_interactions`, `reels_skip_rate`) may change. No stability guarantee was found.

---

## 9. AI-generated content: labeling policy and API support

### Takeaway
- **Policy:** Meta **requires** self-disclosure for **photorealistic video or realistic-sounding audio** that was digitally generated or altered. It does **not require** labeling AI images, but will label them anyway if its systems detect AI signals.
- **API:** since **June 22, 2026**, a post can be self-labeled through the API with **`is_ai_generated=true`** on container creation, for both login types (carousel parent only).
- **Detection:** relies on embedded industry metadata. A March 2026 IPTC review found Instagram reads **IPTC `DigitalSourceType`** but apparently **not C2PA**. No source confirms SynthID detection.
- **Reach:** no official statement found that a per-post "AI info" label reduces reach. The 2026 reach penalty applies to unlabeled **AI-persona accounts** ("AI-generated profile"), not to brand accounts using AI graphics.

### Cited Findings
- **API parameter:** "Set the new `is_ai_generated` parameter to `true` when creating a media container to apply the AI info label." For carousels, set it on the container only (setting it on children errors). "Available in both Instagram API with Facebook Login and Instagram API with Instagram Login." Also readable on IG Media — [Changelog, June 22, 2026](https://developers.facebook.com/docs/instagram-platform/changelog); [Content publishing guide](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- **Help Center policy:** Meta requires labels on content with "photorealistic video or realistic-sounding audio that has been digitally generated or altered, including with AI". It does not require labels on AI-created or altered images, but "these images will still receive a label if our systems detect that they were AI-generated"; "there may be penalties if you do not label content as required" — [Instagram Help Center: AI labels](https://help.instagram.com/761121959519495) (direct fetch returned an empty shell; wording taken from search-indexed text of that page and corroborated by [Sirency (third-party)](https://www.sirency.com/blog/instagram-ai-label-rules), [Minter.io (third-party)](https://minter.io/blog/everything-you-need-to-know-about-ai-labels-on-instagram/))
- **Label history:**
  - April 5, 2024: "Made with AI" labels based on "industry-shared signals" or self-disclosure.
  - July 1, 2024: renamed to **"AI info"**.
  - September 12, 2024: for content only modified or edited by AI tools, "AI info" moved into the post's menu. Fully AI-generated content keeps the visible label.
  - "Imagined with AI" is used for photorealistic images from Meta AI.
  - Fact-checked False/Altered content is shown lower in Feed. This is the only reach reduction stated in the post.
  - — [Meta Newsroom: Our approach to labeling AI-generated content (with updates)](https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/)
- **Detection plan (February 6, 2024):** read C2PA and IPTC "AI generated" metadata from Google, OpenAI, Microsoft, Adobe, Midjourney and Shutterstock. Meta AI images carry IPTC metadata plus invisible watermarks. Audio and video detection from other vendors was not yet possible at scale — [SiliconANGLE coverage of Meta's announcement](https://siliconangle.com/2024/02/06/meta-will-label-ai-generated-images-across-facebook-instagram-threads/), [The Decoder](https://the-decoder.com/meta-introduces-imagined-with-ai-labels-for-ai-generated-content-on-its-social-media-platforms/)
- **IPTC review, March 18, 2026:** "it seems that Instagram examines the IPTC DigitalSourceType property but not C2PA". Some Meta AI images were recognized by Instagram. OpenAI content (C2PA with IPTC vocabulary) was labeled by LinkedIn, Pinterest and YouTube. No SynthID, Adobe or Midjourney results are reported — [IPTC: AI disclosure on social media, a work in progress](https://iptc.org/news/ai-disclosure-on-social-media-a-work-in-progress/)
- **Account-level label:** an "AI creator" profile label (May 2026) was renamed "AI-generated profile" and scoped to accounts that "feature an AI-generated person" (announced around August 31, 2026).
  - Unlabeled accounts detected by Instagram lose recommendation eligibility (Reels/Explore to non-followers). Accounts that self-label see "no impact on their reach".
  - Using AI for editing, captions or graphics does not require the profile label.
  - — [Khaleej Times](https://www.khaleejtimes.com/business/tech/instagram-ai-generated-profile-label-reach-restrictions), [Implicator.ai](https://www.implicator.ai/instagram-will-cut-the-reach-of-ai-personas-that-skip-its-new-label/), [TechRepublic](https://techrepublic.com/article/news-instagram-ai-generated-profile-label-recommendations/) (secondary press; TechRepublic returned 403 to direct fetch, so the details come from search summaries)

### Inferences
- **Charts, stat cards and typographic graphics** (MSP's core content) are not photorealistic, so no disclosure is required. Leave `is_ai_generated` off for them.
- **Photorealistic AI imagery** (e.g. a generated "puzzler at a table" scene): set `is_ai_generated=true`. It is not strictly required for images, but auto-detection would label it anyway, and transparency is cheap.
- **Mandatory cases:** any AI-generated photorealistic **video** or realistic **voice/audio** in Reels must be labeled, via `is_ai_generated=true`.
- **Avoiding surprise auto-labels on non-AI content:** strip or keep embedded metadata deliberately. Re-encoding through the pipeline's JPEG export may drop IPTC/C2PA. Conversely, AI images exported with IPTC `DigitalSourceType=trainedAlgorithmicMedia` will likely be auto-labeled.
- **Account-level label:** not applicable. @myspeedpuzzling does not present an AI persona.

### Gaps
- No official Meta statement found on whether a per-post "AI info" label (self-applied or detected) changes distribution or recommendations.
- No official 2026 Meta document detailing the current detection stack (C2PA vs IPTC vs invisible watermarks such as OpenAI's C2PA manifests or Google SynthID). The IPTC finding is an external test, not a Meta statement.
- Whether `is_ai_generated` set on Reels covers audio disclosure as well as visual is not separately documented.

---

## 10. Music and audio for API-published Reels

### Takeaway
Under **Instagram Login**, API-published Reels **cannot use Instagram's music library**. Only the video's own embedded (original) audio is published, and `audio_name` just renames that original audio. On **June 1, 2026** Meta launched the **Instagram Audio API**, which lets you search for "music authorized for third party use" and trending original sounds and attach them at Reel creation via `audio_configuration`. It is **Facebook Login only**. For our Instagram Login setup, the plan stays the same: embed our own licensed or royalty-free audio in the MP4.

### Cited Findings
- **Instagram Audio API:**
  - Requires Facebook Login, a Page-linked Business/Creator account, and `instagram_basic` + `instagram_content_publish`. "Not supported with Instagram API with Instagram Login."
  - Search: `GET /ig_audio?audio_type=music|original_sound&user_id=...&search_query=...` (trending audio is returned if no query is given). Metadata: `GET /{ig-audio-id}`.
  - Attach: on `POST /{ig-user-id}/media` with `media_type=REELS`, pass `audio_configuration` with `audio_id` (required), `audio_volume` and `video_volume` (0–100, default 100).
  - Music is "authorized for third party use", and the selection may differ from the native app.
  - Previews are not supported. `download_url` expires after about 1.5 days.
  - — [Instagram Audio API docs](https://developers.facebook.com/documentation/instagram-platform/content-publishing/audio-api)
  - Launch date: June 1, 2026 ("Instagram Audio API for Facebook Login apps"). The `media_audio_type` field (`MUSIC` | `ORIGINAL_SOUND`) was added at the same time — [Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- "Music tagging is available only for original audio." `audio_name` can be renamed only once — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- IG Media exposes `copyright_check_information.status` and `copyright_matches`. `media_url` is omitted for copyrighted content such as Reels audio — [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media)
- A separate ads-only flow swaps copyrighted Reel-ad audio for Sound Collection tracks (limited release) — [Instagram Audio API docs](https://developers.facebook.com/documentation/instagram-platform/content-publishing/audio-api)

### Inferences
- **Our Reels:** render with our own licensed or royalty-free track (or no music), and set `audio_name` to something brandable, e.g. "MySpeedPuzzling – Original audio". Uploading commercial music without a licence risks copyright muting or blocking, visible via `copyright_check_information`.
- **Alternative route:** library music could be added by finishing the Reel in the Instagram app manually, or by migrating to Facebook Login.

### Gaps
- Not verified whether the Audio API's "music authorized for third party use" set is further restricted for **Business** accounts (in-app, business accounts historically get a limited music library). The docs don't say.
- No regional availability info for the Audio API.

---

## 11. Other gotchas: caption, hashtags, mentions, formatting

### Takeaway
Respect both sets of rules:
- **API documented limits:** 2,200 characters, **30 hashtags**, 20 @mentions.
- **In-app rule:** since December 2025, Instagram is rolling out a cap of **5 hashtags per post or Reel caption**.

Design for **≤5 hashtags**, ≤20 mentions and well under 2,200 characters. URLs must be ASCII, and remember the 2–10 carousel bounds.

### Cited Findings
- **Caption limits:** max 2,200 characters, 30 hashtags, 20 @mentions. Captions are not allowed on carousel children — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
  - Violations: `36004/2207010` caption too long (2,200 chars, 30 hashtags, 20 @tags); `100/2207040` too many @tags (max 20) — [Error codes](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes)
- **Five-hashtag cap:**
  - December 18, 2025: "Instagram will gradually update the number of hashtags that you can include in a caption for a reel or post to five". This "will become the new universal restriction in the app".
  - Earlier tests limited some users to 3.
  - — [Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/); also [Blog du Modérateur](https://www.blogdumoderateur.com/instagram-limite-hashtags-5-par-publication/)
- Instagram's @creators account recommends "fewer (up to 5) more targeted hashtags". Mosseri says hashtags help search but don't increase reach — [Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/), [MyMobileIndia](https://www.mymobileindia.com/instagram-limits-hashtags-to-five-per-post-and-reel-heres-key-changes-creators-should-know/)
- Media and request URLs should contain only US-ASCII characters, "or the request will fail" — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- When read back via the API, captions omit the `@` unless the app user has admin-equivalent tasks — [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media)

### Inferences
- Enforce **max 5 hashtags** in the caption generator, even though the API docs still say 30. Exceeding 5 risks a publish error or silent truncation once the in-app rule reaches the API. Put any extra keywords into natural caption text (Instagram search also indexes captions).
- Send captions as URL-encoded form or JSON body parameters (not hand-built query strings), so that emoji and newlines survive. Count length in characters, not bytes.

### Gaps
- **5-hashtag cap via the API:** not verified whether the cap is enforced on API publishing (no 2026 developer report or Meta doc found). The API docs and error codes still say 30. Test once with 6 hashtags on a throwaway post, or simply stay at 5 or fewer.
- **Formatting behaviour:** no official source checked in this research for how line breaks, emoji, URLs in captions, or the Unicode character-counting method behave. Widely reported practice (not verified here): newlines are preserved when sent as `\n` in the parameter; emoji work; URLs in captions are **not clickable** (only bio links and Story link stickers, the latter not available via the API).
- **Mention behaviour:** no source on whether @mentions in API captions notify the mentioned accounts the same way as in-app posts.
