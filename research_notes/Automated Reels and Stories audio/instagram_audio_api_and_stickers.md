# Music and stickers on Reels and Stories via Meta's official Instagram APIs (state as of 16 Nov 2026)

Scope: @myspeedpuzzling, one Instagram professional account, publishing through the Instagram API with Instagram Login
(graph.instagram.com, no Facebook Page), media on Cloudflare R2. Research only; no API was called. All Meta doc pages were
fetched on 16 Nov 2026. Meta's pages carry no "last updated" dates, so "current" means "what the page said on 16 Nov 2026".

Main correction to the October research: Meta now runs a **third** setup, the **Instagram API with Unified Login**
(graph.facebook.com, no Facebook Page needed, business portfolio required). The Audio API page lists it as supported. So
"move to Facebook Login and link a Page" is no longer the only way to get music via the API.

## 1. Is the Instagram Audio API available to Instagram-Login apps (graph.instagram.com)? Changelog, permissions, review, rate limits

### Takeaway
No. As of Nov 2026 the Audio API works only with Facebook Login and the new Unified Login, both on graph.facebook.com. No
changelog entry from Jun to Nov 2026 extends it to Instagram Login. A Sep 2026 change makes graph.instagram.com reject
Facebook-Login-only parameters with a 400 error, so sending `audio_configuration` from our current app won't work.

### Cited Findings
- Audio API doc (requirements): an Instagram Business or Creator account; "a Facebook Page connected to that account"; a Facebook App with `instagram_basic` and `instagram_content_publish` granted through Facebook Login; a User access token. Login types: "Supported on the Instagram API with Facebook Login and the Instagram API with Unified Login. Not supported on the Instagram API with Instagram Login." — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- Endpoints, per the same doc:
  - `GET /ig_audio`: `audio_type` (required: `music` | `original_sound`), `user_id` (required), `search_query` (optional), `access_token`.
  - `GET /{ig-audio-id}`: `user_id`, `access_token`.
  - `POST /{ig-user-id}/media` with `media_type=REELS`, `video_url`, `audio_configuration`.
  - `audio_configuration` fields: `audio_id` (required); `audio_volume` and `video_volume`, each 1–100, default 100.
  - Ads replacement discovery `GET /ig_audio?product=ADS&purpose=AUDIO_COPYRIGHT_REPLACEMENT…` needs `ads_management` and is in limited release.
  - — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- Response fields:
  - All audio: `audio_id`, `duration_in_ms`, `audio_type`, `title`, `on_platform_audio_preview_link` (nullable), `is_ads_eligible`.
  - Music: `display_artist`, `cover_artwork_thumbnail_url` or `cover_artwork_thumbnail_uri`.
  - Original sound: `ig_username`, `profile_picture_url`.
  - `download_url` is a temporary preview URL that "expires after approximately 1.5 days".
  - — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- The Audio API doc names no access level (Standard or Advanced) and no Audio-specific rate limit. — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- Official changelog, 1 Jun 2026: "Instagram Audio API (Facebook Login apps)". Apps can search and retrieve original sounds and royalty-free Sound Collection music and attach audio to Reels at creation. It also adds the `media_audio_type` field (`MUSIC` | `ORIGINAL_SOUND`). — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- Other official changelog entries from Jun to Jul 2026, none of which touches Audio for Instagram Login:
  - 22 Jun: `is_ai_generated`, available in both login types.
  - 22 Jun: `link_clicks` Story metric, Facebook Login only.
  - 30 Jul: `media_url` is omitted for videos with licensed or library audio, "even for the app user's own media".
  - — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- **Conflict about Aug–Nov entries:**
  - On 16 Nov the official `changelog.md` showed no entries after 30 Jul 2026. — [Meta changelog.md](https://developers.facebook.com/documentation/instagram-platform/changelog.md)
  - Releasebot, a third-party tracker, lists entries from Sep to Oct 2026. — [Releasebot](https://releasebot.io/updates/meta/instagram-platform)
  - The Sep–Oct entries below come only from Releasebot and are unverified against Meta's own page.
- Releasebot, 28 Sep 2026: "400 responses for Facebook-Login-only parameters sent to graph.instagram.com" and a new `config_issue` field on publish responses (`CAPTION_NOT_ATTACHED`, `USER_TAGGING_FAILURE`). None of the Releasebot entries extends Audio to Instagram Login. — [Releasebot](https://releasebot.io/updates/meta/instagram-platform)
- Third-party integrators confirm that Audio doesn't work with Instagram Login:
  - bundle.social: "require the Instagram account to be connected through Facebook Login". Audio search returns 400 for Instagram-Login connections. — [bundle.social docs](https://info.bundle.social/api-reference/platforms/instagram-music)
  - post-for-me PR: for Instagram-Login accounts the config is ignored with a warning, and the code falls back to `audio_name`. — [GitHub post-for-me #273](https://github.com/DayMoonDevelopment/post-for-me/pull/273)
- General publishing limits:
  - 100 API-published posts per 24 h. The carousel section says 50, and Meta's page doesn't reconcile the two. — [Meta: Content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
  - 400 containers per rolling 24 h. — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
  - Current API version per the reference page: v27.0. — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)

### Inferences
- With the current app, music cannot be automated. A login change is required (see section 4).
- `audio_configuration` comes out of an ordinary publishing call. That suggests no extra permission beyond `instagram_content_publish` / `instagram_basic` (Advanced Access for those, as for any live publishing app). Meta doesn't state this explicitly.
- Library audio also removes `media_url` from our own Reels. Any tool that downloads our own Reel videos (insights, archives) must fall back to `permalink` or `thumbnail_url`.

### Gaps
- No Audio-specific rate limit or App Review note was found.
- The Sep–Oct 2026 changelog entries could not be confirmed on Meta's official changelog page; only the third-party mirror shows them.

## 2. Stories, Trial Reels, carousels: which media types take audio?

### Takeaway
Reels only. The Audio API documents `audio_configuration` only for `media_type=REELS`. Stories, carousels and image posts
aren't supported. Trial Reels aren't mentioned, so combining `trial_params` with `audio_configuration` is undocumented and
untested.

### Cited Findings
- The Audio API doc shows publishing with audio only for `media_type=REELS`. Stories, trial Reels and carousels aren't mentioned. — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- bundle.social: audio "Does not work for feed posts, carousels, or Stories". Passing music on a non-Reel post fails validation. — [bundle.social docs](https://info.bundle.social/api-reference/platforms/instagram-music)
- `trial_params`: requires `media_type=REELS`, with `graduation_strategy` `MANUAL` | `SS_PERFORMANCE`. The reference doesn't mention audio together with trial Reels. — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Reels limitations on the reference page:
  - "Music tagging is only available for original audio."
  - `audio_name` is "For Reels only" and can be renamed only once. It renames our own original audio; it doesn't attach a library track.
  - — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)

### Inferences
- A Trial Reel with API music should work in principle, because both are parameters on the same REELS container. This is unverified. It would need a single test once we're on Facebook or Unified Login.
- Stories keep needing music added in the app, or music baked into the video file (with all the copyright implications of that).

### Gaps
- Meta says nothing about `audio_configuration` combined with `trial_params`, and we found no developer report on it.

## 3. Which music: Business vs Creator catalogue, EU/Czech availability, trending, start offset, song name on the Reel

### Takeaway
- The API offers tracks "authorized for third party use": royalty-free Meta Sound Collection music plus original sounds from
  other Reels. Meta says the selection "may differ from the native app".
- Trending is available by omitting `search_query`.
- No start-offset or clip-selection parameter exists, and there is no preview before publishing.
- Region rules and how the song label looks on the published Reel are not documented.

### Cited Findings
- "Audio is limited to tracks authorized for third party use"; the selection may differ from the native app. "Previewing a Reel with attached audio is not supported." The Reel publishes as configured. — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- Calling `GET /ig_audio` without `search_query` returns trending audio by default, for both music and original sound. — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- The changelog describes the music as "royalty-free Sound Collection music". — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- `audio_configuration` documents only `audio_id`, `audio_volume` and `video_volume`. No start offset or start time is documented. — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api)
- `should_loop_audio` appears in Meta's example workflow but not in the parameter table. The post-for-me author calls it "informally supported". — [GitHub post-for-me #273](https://github.com/DayMoonDevelopment/post-for-me/pull/273)
- A Czech developer's PR (pavelprokes/g-gallery #104, 28 Oct 2026) first noted that a track starts at 0 s because "no start parameter exists". The PR then cut the audio into the MP4 itself and removed API publishing. It was tested only against a mock, not live. — [GitHub g-gallery #104](https://github.com/pavelprokes/g-gallery/pull/104)
- In-app context (secondary sources, not Meta):
  - Business accounts are mostly limited to the Meta Sound Collection, described as "over 14,000 royalty-free songs and sounds" usable commercially on FB/IG.
  - Creator accounts get the wider licensed library, but those sources say it is for non-commercial use.
  - Reels with licensed music can't be boosted.
  - — [Lilach Bullock](https://www.lilachbullock.com/instagram-music-library-business-accounts/); [Soundstripe](https://www.soundstripe.com/blogs/instagram-music-library); [foximusic](https://www.foximusic.com/blog/instagram-reels-music-copyright-legal-guide/)

### Inferences
- Through the API, a Business account gets roughly what it already gets in-app: Sound Collection plus original sounds. Real chart hits are unlikely to be offered, since they're not "authorized for third party use".
- Trending original sounds are searchable, so using a trending sound may be automatable.
- Without a start offset, the track presumably plays from its beginning (`audio_id` → full track from 0 s). If the hook of a song matters, it still has to be chosen in the app, or the cut has to be baked into the video file (but then it's no longer an attached library track and gets no song label).
- Because a library track sets `media_audio_type=MUSIC`, the Reel very likely shows the song name like in-app. That label rendering is not confirmed by any source.

### Gaps
- EU / Czech regional availability of the API catalogue: no source found.
- Whether a Creator-account token unlocks a larger catalogue through the API: not documented.
- How the song name, artist and "Original audio" label render on API-published Reels: no source found.
- Exact catalogue size via the API: not documented.

## 4. What migrating from Instagram Login costs; Unified Login vs Facebook Login; one app, several login types?

### Takeaway
- **Recommended path:** Unified Login rather than classic Facebook Login. Unified Login needs no Facebook Page, but it
  needs a Meta business portfolio owning the app. Meta also says it's where new features ship.
- Classic Facebook Login needs a linked Facebook Page.
- Both use graph.facebook.com and the `instagram_*` permissions instead of `instagram_business_*`. Advanced Access needs
  App Review and Business Verification; for our single own account, Standard Access may be enough (see Inferences).
- No retirement date for Instagram Login has been announced.

### Cited Findings
- Meta's overview compares three setups (quoted):

  | | Unified Login | Instagram Login | Facebook Login |
  |---|---|---|---|
  | Recommended use | "New integrations" | "Existing Instagram Login integrations" | "Existing Page-linked integrations" |
  | Token | "Business Integration System User Access Token" | "Instagram User access token" | "Facebook User or Page access token" |
  | Host | graph.facebook.com | graph.instagram.com | graph.facebook.com |
  | Facebook Page | "Not required" | "Not required" | "Required" |
  | Business portfolio | "Required" | "Not required by the login flow" | "Depends on the Facebook Login for Business configuration" |
  | Hashtag search, product tagging, partnership ads | Supported | Not supported | Supported |

  Publishing, comments, insights, mentions and messaging are supported in all three. Advanced Access requires "App Review and Business Verification". — [Meta: Platform overview](https://developers.facebook.com/documentation/instagram-platform/overview)
- Unified Login get-started:
  - "The app must be owned by a business portfolio".
  - It uses Facebook Login for Business and the "Manage messaging & content on Instagram" use case.
  - "Standard Access is enough to test with people who have a role on your app". Connecting other clients needs Advanced Access and Live mode.
  - The page gives no migration steps for Instagram-Login apps; it links to a separate guide.
  - — [Meta: Unified Login get started](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login/get-started)
- Unified Login migration page:
  - "Complete the required App Review before moving production clients."
  - "This documentation does not announce a retirement date for existing Instagram API setups."
  - Permissions move from `instagram_business_*` to `instagram_*`.
  - — [Meta: Unified Login migration](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login/migration)
- Secondary claims, not seen on Meta's pages fetched here:
  - "new API features ship only there" (Unified Login).
  - The Unified Login token belongs to the business portfolio and survives the connecting person leaving.
  - "An app can use Facebook Login or Instagram Login, but not both."
  - — [CRPRO Hub (Meta docs checked 8 Nov 2026)](https://crprohub.com/en/blog/instagram-api-instagram-login-facebook-login-unified-login)
- Developer implementations of Unified Login:
  - Newer apps see "API setup with Instagram login is not available for newer apps. Your app uses API setup with Unified login instead."
  - The default config issues tokens with `expires_at: 0` (never expire).
  - Accounts are found via `/me/assigned_instagram_accounts`.
  - These are secondary sources that summarize Meta's dashboard; the quotes weren't verified first-hand. — [postiz PR #2404](https://github.com/gitroomhq/postiz-app/pull/2404); [genfeed issue #9582](https://github.com/genfeedai/genfeed.ai/issues/9582)
- Contradiction inside Meta's Audio API page: its requirements list "a Facebook Page connected to that account" and a User access token. The same page lists Unified Login as supported, and Unified Login needs no Page and uses a System User token. — [Meta: Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api); [Meta: Platform overview](https://developers.facebook.com/documentation/instagram-platform/overview)
- A Czech developer's PR notes that "Meta's docs disagree on which token Instagram accepts" (Page vs user token) for audio. Their code tries both. — [GitHub g-gallery #104](https://github.com/pavelprokes/g-gallery/pull/104)
- Features by login type:
  - `is_ai_generated` is available in both Instagram Login and Facebook Login (changelog 22 Jun 2026). — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
  - Facebook Login only: `poll_attachment`, `is_comment_prompt_used` and `is_paid_partnership`. — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
  - Facebook Login only: the Story `link_clicks` metric and media `reposts_count` / `saved_count` / `shares_count` (22 Apr 2026). — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
  - Facebook Login only: resumable uploads via rupload.facebook.com. — [Meta: Content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
  - Trial Reels (`trial_params`) has no login-type restriction on the reference page. — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
- Releasebot, 28 Sep 2026 (unverified): caption add-ons (polls with 2–4 options, `is_poll_duration_extended`, comment prompts) for feed posts and Reels, Facebook Login only, not Stories. — [Releasebot](https://releasebot.io/updates/meta/instagram-platform)

### Inferences
- **For MSP, a switch gains:**
  - API music on Reels.
  - Story `link_clicks`.
  - Saves, shares and reposts counts.
  - Caption polls and comment prompts.
  - Hashtag search.
  - Resumable upload.
  - Probably non-expiring system-user tokens with Unified Login (no 60-day refresh).
- **It loses:** nothing documented. Trial Reels, `is_ai_generated`, insights and comments exist in all setups.
- **Cost:**
  - A Meta business portfolio owning the app (Unified Login), or a Facebook Page linked to @myspeedpuzzling (classic Facebook Login).
  - Code changes: host, token type, permission names, `me/assigned_instagram_accounts` discovery, and the IDs used in insight queries.
  - For our own single account, the owner holds an app role. Standard Access "is enough to test with people who have a role on your app", so App Review and Business Verification may not be needed. This is an inference to verify, not a documented guarantee for production publishing.
- **One app or two:** keeping the current Instagram-Login app untouched and creating a second, Unified-Login app for audio-enabled Reels is the lowest-risk path. A single app reportedly cannot serve both login types, so two apps side by side avoid that question.

### Gaps
- Meta's own guide for moving an Instagram-Login app to Unified Login wasn't retrieved; get-started only links it.
- Business Verification for a single-owner, own-account app: not stated explicitly.
- Whether the Unified Login token expiry is configurable was confirmed only by secondary sources.

## 5. Story stickers via API in 2026 (link, mention, music, poll, question, countdown); user_tags and collaborators on Stories

### Takeaway
Still impossible. The reference says sticker publishing (link, poll, location) is not supported on Stories. User mentions
work through `user_tags` (since Jul 2025, x/y optional), but not as a visible sticker. Collaborators aren't supported on
Stories. Caption polls and comment prompts (Sep 2026) explicitly exclude Stories. The API can measure link-sticker taps
(`link_clicks`, Facebook Login only) but can't add a link sticker.

### Cited Findings
- On the reference page:
  - "Publishing stickers (i.e., link, poll, location) is not supported; however mentioning users without a sticker is supported."
  - "On July 9, 2025, we added support for the existing `user_tags` field for image and video stories". Mention coordinates x/y are "optional for stories".
  - `collaborators`: "For Feed image, Reels and Carousels only… Not supported for Stories."
  - `location_id` is not listed for Stories.
  - `poll_attachment` and `is_comment_prompt_used`: "Not supported on stories".
  - — [Meta: IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
- `link_clicks` (1 / 22 Jun 2026) counts "taps on links in your story (such as link stickers)" and is Facebook Login only. — [Meta changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- Schedulers confirm that no official-API tool can add link stickers, Meta Business Suite included. Storrito offers sticker Stories via a non-official route, which carries account risk. The iOS/Android "Sharing to Stories" deep link can pass a link-sticker URL, but only by opening the app on a phone. — [Socioverse](https://www.socioverse.io/blog/schedule-instagram-story-link-sticker); [Storrito](https://storrito.com/resources/instagram-story-api/)
- Releasebot, 20 Oct 2026 (unverified on Meta's page): "Stories created with a caption through the Content Publishing API now show that caption as coming from the app user's account." — [Releasebot](https://releasebot.io/updates/meta/instagram-platform)

### Inferences
- These still need the app, by hand:
  - Link, music, poll, question, countdown and location stickers.
  - A visible @mention sticker. The API mention via `user_tags` notifies and tags the account, but doesn't draw a sticker.
- The 20 Oct Story-caption entry possibly bears on our 13 Nov observation that the Story text field didn't show. It's unverified and the semantics are unclear, so keep the rule "all Story text goes in the frame".

### Gaps
- No primary-source statement on question, countdown or music stickers specifically. They fall under the general "stickers not supported" line.
- How `user_tags` mentions render on an API Story (whether visibly, or only as a tag in the viewers' mention list) wasn't documented in the pages fetched.

## 6. Known issues and bugs with audio_configuration

### Takeaway
Meta-community and Stack Overflow reports are almost absent. The integrations found are mostly untested or mock-tested.
The documented caveats are no preview, the `download_url` expiring after about 1.5 days, `media_url` being omitted on
audio-bearing Reels, and docs that contradict each other on Page and token requirements.

### Cited Findings
- post-for-me PR #273 (Jul–Oct 2026):
  - Implemented `audio_configuration` but was "not been tested live against Meta's Graph API".
  - It suggests `JSON.stringify` if the Graph API rejects the nested object.
  - A "missing scope" Meta error passes through.
  - The PR was closed unmerged on 6 Oct 2026 in favour of a newer audio endpoint.
  - — [GitHub post-for-me #273](https://github.com/DayMoonDevelopment/post-for-me/pull/273)
- g-gallery PR #104 (28 Oct 2026):
  - Tested only against a mock, then dropped API publishing and bakes audio into the MP4.
  - Notes the Page vs user token contradiction.
  - Search is capped at 100 characters.
  - — [GitHub g-gallery #104](https://github.com/pavelprokes/g-gallery/pull/104)
- bundle.social and Postiz ship audio search and attachment in production docs. Postiz uses `id`, `audio_volume` and `video_volume`. bundle.social caps `searchQuery` at 100 characters. — [bundle.social](https://info.bundle.social/api-reference/platforms/instagram-music); [Postiz docs](https://docs.postiz.com/public-api/providers/instagram)
- A search for `audio_configuration` errors found no Meta developer-community or Stack Overflow threads; the results were only consumer "Audio unavailable" pages. — [search result example: inspiretothrive](https://inspiretothrive.com/audio-unavailable-on-instagram-reels/)

### Inferences
- Production use exists through commercial schedulers (bundle.social, Postiz). The feature likely works, but with sparse public debugging knowledge.
- Expect to do our own one-Reel test, on a Trial Reel first if the combination is accepted.

### Gaps
- No first-hand, live-tested developer report on the following:
  - How the song label renders.
  - Behaviour of `should_loop_audio`.
  - Error codes for region-blocked or withdrawn tracks.
  - Whether audio can still be removed or changed in-app after an API publish.

## Summary: automate vs manual (for MSP, as of Nov 2026)

| Item | Current Instagram-Login app | After moving to Unified (or Facebook) Login |
|---|---|---|
| Library music on Reels | Manual (in app) | Automatable: `audio_configuration`, Sound Collection plus original sounds, no start offset, no preview |
| Trending sound on Reels | Manual | Searchable (`/ig_audio` without query); attaching is automatable |
| Music on Stories / carousels | Manual | Manual (not supported) |
| Link, poll, question, countdown, location, music stickers on Stories | Manual | Manual (not supported) |
| @mention on Story | `user_tags` (no visible sticker) | Same |
| Collaborators on Story | Not supported | Not supported |
| Caption poll or comment prompt (feed and Reels) | Not available | Available (Facebook Login; Sep 2026, unverified on Meta's page) |
| Trial Reels, `is_ai_generated` | Available | Available |
| Story link-click insights | Not available | Available |
