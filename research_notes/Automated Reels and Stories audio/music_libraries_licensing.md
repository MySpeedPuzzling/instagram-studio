# Music libraries for automated Reels/Stories audio: licensing, automation, cost, claim risk (as of 16 Nov 2026)

Scope: libraries whose tracks a small EU company (@myspeedpuzzling, ~2700 followers, one Instagram professional account) can bake into locally rendered 8–30 s Reels and Stories published through the API, chosen automatically by mood, tags, BPM and duration.

Source quality: most price figures come from third-party review and affiliate sites, which often disagree with each other. Official pages are marked "(official)". The Uppbeat pricing page returned HTTP 429, so its prices are taken from search snippets of the official page and third-party copies. Re-check every price on the vendor's own page before buying.

## Comparison table

| Library | Company Instagram use | Attribution | Price 2026 (approx.) | API / bulk / metadata | Short edits / stems | Licence after cancelling | Claim risk on Instagram |
|---|---|---|---|---|---|---|---|
| Epidemic Sound | Yes, on the **Business** plan (brands under $10M revenue). Personal plans are for creators. | No | Business $30/mo billed yearly ($360/yr), or $75 month to month. Business Plus from $100/mo. | **Yes.** Partner API ("Epidemic Sound Connect") and an MCP server. Keys may now be self-serve (third-party claim). Search by mood, genre and BPM. | **Best of all.** "Edit versions" API cuts or extends to any length from 1 s to 5 min. Adapt has 15/30/60 s presets. Most tracks have 4 stems. | Content published while subscribed is cleared forever, if the channel was safelisted | Low if the Instagram account is safelisted, since Epidemic itself registers its tracks. High if it isn't safelisted, or for anything posted after cancelling. |
| Uppbeat | Yes, but since 2 Sep 2026 a company (more than one person) needs the **Business** plan. The Free, Essentials and Creator plans cover solo creators only. | Free tier needs a credit. Paid plans don't (not verified on the live page). | Business $34.99/mo billed yearly (about $420/yr). One snippet also lists $59.99 monthly; sources conflict. | No public API found. Downloads are manual. | Not verified | Perpetual for content published while subscribed | Uses safelisting/clearance codes (details not verified in this pass) |
| Artlist | Yes. Social, Pro, Teams and Business plans; Business has custom terms. | No | Not verified in this pass | No public API found | Artlist offers stems (not verified in this pass) | Content published during the subscription stays licensed. Anything uploaded after cancelling is not covered. | Clearlist allowlist: 1 channel per platform (Social), 3 (Pro), 5+ (Teams), custom (Business). Users may not register Artlist tracks with Facebook Rights Manager. |
| Soundstripe | Yes, on Business plans | No | Business about $299/quarter or $999/yr (third-party). API price is quote-only. | **Yes.** REST API with 60k+ tracks, search, metadata, previews and downloads. Free 30-day trial key with watermarked files. Production use goes through sales. | Not verified | Not verified | Not verified |
| Musicbed | Yes, on Business plans (social media up to 1M followers) | No | Business from about $99.99/mo. Sources disagree widely. | No public API found | Not verified | Not verified | Claims are cleared with SyncID, which comes only with subscriptions |
| Pixabay Music | Yes, commercial use is allowed as part of a larger work | No (credit is welcome) | Free | **No.** The API has no music or audio endpoint, only images and video. | No | n/a (free licence) | **Real risk.** Some tracks are registered with Content ID (marked with a shield icon). On Instagram the remedy is to dispute and point the platform to Pixabay. |
| Mixkit | Yes, the Free License covers commercial and social use (third-party summaries) | No | Free | No API. Small catalogue, manual downloads. | No | n/a | Low. The licence forbids registering tracks with Content ID. A claim goes to team@mixkit.co. |
| Jamendo Licensing | Yes, with a paid commercial licence (the free licence is non-commercial) | No (with a paid licence) | Online licence €29 per track + VAT (official). Subscriptions about €149/yr Professional or €249/yr Agency (third-party). | **Yes, for discovery.** API v3 filters by tags, speed (5 levels), duration range and vocal/instrumental. The free API key is for non-commercial apps only. | No | A per-track licence is perpetual (inferred) | Not verified |
| Free Music Archive | Varies per track (CC licences) | Usually required | Free | **API is gone** | No | n/a | Not verified |
| YouTube Audio Library | **Mostly no.** Standard-licence tracks are cleared for YouTube only. CC tracks can be used with exact credit. | Required for CC tracks | Free | No | No | n/a | Not verified |
| Bensound | Free tier: only online video with credit and a licence code. Business use needs a paid plan. | Free tier yes, paid no | Single track from about €34. Subscriptions about €10–40/mo (third-party). | No | No | Not verified | Free licence forbids registering tracks with Rights Manager |
| Incompetech (Kevin MacLeod) | Yes, under CC BY 4.0 with credit, or a paid Standard Licence without credit | Yes, unless you buy the Standard Licence | Free with credit. Without credit: $30 for 1 track, $50 for 2, $20 each for 3–18. | No API | No | Perpetual | Low (the tracks are very widely used) |
| ccMixter | Only tracks marked commercial-OK (the dig.ccmixter.org section) | Yes (CC BY) | Free | Not verified | Some stems and remix parts | n/a | Not verified |
| Freesound (loops) | Yes, but only CC0 or CC BY sounds. CC BY-NC is excluded. | CC BY needs a credit, CC0 doesn't | Free | **Yes.** Freesound has an API, and a loop-generator tool filters by licence. | Loops (good for clean endings) | n/a | Low. Uploads are mostly amateur and rarely registered (inferred). |
| Meta Sound Collection | Yes, commercial use allowed (ads too, with some per-track caveats), but **only on Meta platforms** | No | Free | No API. Manual MP3 download from facebook.com/sound/collection. | No | n/a | Lowest on Instagram (it is Meta's own library) |

## Q1: Licence fit, price, automation and cancellation per library

### Takeaway
For a company account, only paid business plans (Epidemic Business, Uppbeat Business, Soundstripe, Musicbed, Artlist) or a few free permissive catalogues fit: Pixabay, Mixkit, Freesound CC0, Incompetech with credit, and Meta Sound Collection on Instagram only. Epidemic Sound is the only one that pairs a business licence with a usable API that searches tracks and cuts them to an exact duration. Soundstripe has an API, but it is priced for platforms and quote-only.

### Cited Findings
**Epidemic Sound**
- Business costs $30/mo billed yearly ($360/yr) or $75 month to month. It is open to brands under $10M annual revenue and to agencies under $5M, and includes "Protect 1 channel per platform". Business Plus starts at $100/mo and is annual only. Enterprise is quote-only. — [Activepieces 2026 guide](https://www.activepieces.com/blog/epidemic-sound-pricing-plans-and-costs-2026-guide); [Epidemic blog (official)](https://www.epidemicsound.com/blog/soundstripe-vs-epidemic-sound/); [Photutorial](https://photutorial.com/epidemic-sound-pricing/)
- Partner API ("Epidemic Sound Connect"): the full catalogue plus AI soundtracking. Auth by API key, partner token or OAuth 2.0. Docs are at developers.epidemicsound.com. — [APIs.io](https://apis.io/providers/epidemic-sound/)
- MCP server (beta) with track adaptation and stem downloads. A third-party directory says API keys have been self-serve from the account's API Keys page since Oct 2026 (unconfirmed by Epidemic). — [Epidemic MCP docs (official)](https://developers.epidemicsound.com/docs/mcp/); [mcp.film](https://mcp.film/mcps/epidemic-sound/)
- Cancelling: "any content you publish while your subscription is active will be cleared forever". New content published after the period ends is not cleared. — [Epidemic help: Cancellation (official)](https://www.epidemicsoundhelp.com/hc/en-us/articles/25890380656402-Cancellation); [Epidemic licensing guide (official)](https://www.epidemicsound.com/how-it-works/license-music-legally/)
- The forever-clearance depends on the channel being safelisted, and safelisting needs an active subscription. — [Epidemic licensing guide](https://www.epidemicsound.com/how-it-works/license-music-legally/); [recurdash](https://recurdash.com/guides/how-to-cancel-epidemic-sound)

**Uppbeat**
- Licences changed on 2 Sep 2026: Free, Essentials and Creator now cover solo creators on their own channels only, with no client work or paid ads. A business or organisation with more than one person needs Business. Plans are perpetual for content published while subscribed. Every download, free ones included, is cleared for Instagram. — [Uppbeat pricing (official, snippet; live page returned 429)](https://uppbeat.io/pricing); [Uppbeat blog](https://uppbeat.io/blog/royalty-free-and-copyright-free-music/how-to-license-stock-media-for-client-ads)
- Business is $34.99/mo billed yearly (about $419.88/yr). One snippet of the official page says monthly billing at $59.99 exists; Toolsurf and Thematic say Business is yearly only. — [Toolsurf](https://www.toolsurf.com/uppbeat-pricing-plans-2026/); [Thematic](https://hellothematic.com/thematic-vs-uppbeat/)

**Artlist**
- A project is covered after cancelling only if it was completed and published during the subscription. A claim can follow if the video is uploaded after the licence period, or if the channel isn't on the Clearlist. — [Artlist help (official)](https://help.artlist.io/hc/en-us/articles/29648852943901-Understanding-copyright-and-Content-ID-claims); [Artlist licence (official)](https://artlist.io/help-center/privacy-terms/artlist-license/)
- Clearlist channel limits: Social 1 per platform, Pro 3, Teams 5+, Business custom. — [Activepieces Artlist 2026](https://www.activepieces.com/blog/artlist-pricing-2026-what-every-plan-costs)
- The licence forbids registering assets in Content ID or Facebook Rights Manager. — [Artlist licence (official)](https://artlist.io/help-center/privacy-terms/artlist-license/)

**Soundstripe**
- REST API with 60k+ tracks: search, metadata, previews and downloads. A free 30-day trial key returns watermarked files. High-resolution files need a production key, which goes through sales. — [Soundstripe API (official)](https://www.soundstripe.com/api)
- API access is an Enterprise feature, priced on request. Business plans cost about $299/quarter or $999/yr (third-party). — [OMR](https://omr.com/en/reviews/product/soundstripe/pricing); [Photutorial](https://photutorial.com/soundstripe-pricing/)
- The API is built for platforms licensing their own end users (every end user accepts Soundstripe's terms), which is overkill for one account (inferred from the official description). — [Soundstripe API](https://www.soundstripe.com/api)

**Musicbed**
- Business runs from about $99.99/mo to $219.98/mo (up to 250 employees) and covers social media up to 1M followers. SyncID claim clearing comes only with subscriptions. Prices differ a lot across sources, including a June 2026 review listing Solo $16.99, Plus $49 and Pro $99. — [Makerstack](https://makerstack.co/reviews/musicbed-review/); [Bityclips](https://bityclips.com/tool/musicbed/pricing); [CreatorStackClub](https://www.creatorstackclub.com/software/musicbed)

**Pixabay Music**
- Commercial use is allowed as part of a larger work, but not as a standalone file. No attribution is needed. — [Pixabay FAQ (official)](https://pixabay.com/service/faq/)
- The public API covers images (/api/) and videos (/api/videos/) only, with no music endpoint. Pixabay tells users to download music only from its site. — [Pixabay API docs (official)](https://pixabay.com/api/docs/); [Shotstack](https://shotstack.io/learn/best-stock-image-video-apis/)

**Mixkit**
- The Free License covers commercial use, ads and social media, with no credit and no account. Tracks may not be registered with Content ID. Claims go to team@mixkit.co. These are third-party summaries; the official mixkit.co/license page was not fetched. — [noncopyrighted.com](https://noncopyrighted.com/creator/mixkit/); [Thematic vs Mixkit](https://hellothematic.com/thematic-vs-mixkit/)

**Jamendo Licensing**
- Online licence (web, YouTube, social media, online ads) costs €29 per track + VAT. National is €89, International €289. — [Jamendo pricing (official)](https://licensing.jamendo.com/en/pricing)
- Subscriptions: Professional €149/yr, Agency €249/yr, with unlimited online-use certificates (third-party). — [FitGap](https://us.fitgap.com/products/009099/jamendo-licensing)
- API v3 `/tracks` filters by `tags`/`fuzzytags`, `speed` (verylow to veryhigh), `durationbetween`, `vocalinstrumental` and licence flags, and returns `audiodownload`. The API terms are non-commercial: a commercial app needs a Jamendo licence. — [Jamendo API docs (official)](https://developer.jamendo.com/v3.0/tracks); [freeapihub](https://freeapihub.com/apis/jamendo-api)

**Free Music Archive**
- The public API is gone (desk research dated 2026-10-06). — [GitHub issue (sobafm)](https://github.com/slackysoba/sobafm/issues/116)

**YouTube Audio Library**
- Standard-licence tracks are cleared for YouTube only. CC-licensed tracks can be used elsewhere with the exact credit. — [Audiodrome](https://audiodrome.net/for-creators/youtube-royalty-free-music-audio-library/); [The Music Case](https://www.themusicase.com/blog/is-free-music-from-youtube-audio-library-usable-if-you-are-publishing-the-video-in-other-platforms-or-facebook)

**Bensound**
- The free tier needs a credit plus a licence code, covers one video per download, and forbids Content ID or Rights Manager registration. Paid single tracks start around €34. Subscriptions run about €9.99–39.99/mo. All third-party figures. — [Foximusic](https://www.foximusic.com/blog/royalty-free-music-for-commercial-use-guide/); [UMW resource page](https://dkc.umw.edu/tools/free-media-resources/)

**Incompetech**
- Free under CC BY 4.0. The no-credit Standard Licence costs $30 for 1 track, $50 for 2, and $20 each for 3–18. Old filmmusic.io licence links now go to a different composer's site. — [tryslicemedia](https://tryslicemedia.com/podcast-tools/incompetech)

**ccMixter and Freesound**
- Freesound uploads are under CC0, CC BY or CC BY-NC (plus the retired Sampling+). Only CC0 and CC BY are safe for commercial use. A loop generator tool has an "Only CC0" filter. — [licenseorg Freesound guide](https://www.licenseorg.com/guide/music-audio/freesound); [freesound-loop-generator](https://github.com/ffont/freesound-loop-generator)
- ccMixter licences vary per track. The dig.ccmixter.org section curates commercially cleared music, mostly under CC BY. — [moonb.io](https://www.moonb.io/blog/non-copyright-music-sites)

### Inferences
- MSP has more than one person, posts as a company, and makes about 0.1% of the $10M cap, so the realistic paid options are Epidemic Business (about $360/yr) and Uppbeat Business (about $420/yr). Epidemic is cheaper and is the only one with an API that fits automation (search plus exact-length edits).
- The cheapest legally clean free route is a hand-curated local folder of tagged tracks from Pixabay (non-shield tracks only), Mixkit and Freesound CC0. None of these has a usable music API, so the "automatic" part would be choosing from a local catalogue tagged by the pipeline (mood, BPM, duration, e.g. analysed with librosa/essentia), not live API search.
- Jamendo's API is excellent for discovery, but its terms forbid commercial use, and each track costs €29 to license (or a subscription). Fine for picking a few tracks by hand; a poor fit for full automation.
- After cancelling a subscription, already-published posts stay licensed with Epidemic, Uppbeat and Artlist, but only for posts made while subscribed and safelisted. The pipeline should log, for each post, the track ID, the licence or plan, the date and a certificate, so claims can be disputed.

### Gaps
- Artlist's 2026 business pricing, and whether it has any API: not found in this pass.
- Uppbeat: whether it has an API, its paid attribution rules, and its clearance-code mechanics on Instagram (the live pricing page returned 429).
- Soundstripe: what happens after cancelling, and whether it has edits or stems.
- Musicbed: authoritative 2026 prices (third-party sources conflict).
- Bensound's and Mixkit's official licence pages were not fetched; their findings come from third-party summaries.
- Whether Epidemic's API or MCP key comes with the $30 Business plan, or needs a partner deal: one third-party says self-serve since Oct 2026, unconfirmed.

## Q2: Content ID / Meta Rights Manager risk on Instagram

### Takeaway
Paid subscription libraries (Epidemic, Artlist, Musicbed) register their own catalogues with fingerprinting systems and avoid claims through an account allowlist ("safelisting", "Clearlist", "SyncID"). So an un-allowlisted account, or a post made after cancelling, can be claimed or muted. "Free" catalogues carry the opposite risk: third-party contributors registering tracks they also give away (Pixabay openly flags these with a shield icon).

### Cited Findings
- Epidemic: you safelist a channel by connecting it to your account, and every connected channel is cleared. The developer docs list Instagram as a supported platform, identified by its profile URL. Changing a channel keeps earlier posts protected. — [Epidemic safelisting (official)](https://www.epidemicsound.com/how-it-works/music-licensing/what-is-safelisting/); [Epidemic developer safelisting docs](https://developers.epidemicsound.com/docs/safelisting/); [Edit Channels help](https://www.epidemicsoundhelp.com/hc/en-us/articles/25863827355026-Edit-Channels)
- Epidemic's own process for a Facebook/Instagram claim by another rights holder: appeal it, then contact Epidemic with the account email, the profile URL, the track, and screenshots. — [Epidemic help: Facebook and Instagram copyright (official)](https://www.epidemicsoundhelp.com/hc/en-us/articles/26255841507090-Facebook-and-Instagram-Copyright-information)
- Content published with Epidemic music after cancelling will be claimed and monetised by Epidemic. — [Lilach Bullock](https://www.lilachbullock.com/epidemic-sound-free-trial/)
- Artlist: the Clearlist allowlist notifies its automated Content ID system. A claim can follow if the channel isn't on the Clearlist. — [Artlist help (official)](https://help.artlist.io/hc/en-us/articles/29648852943901-Understanding-copyright-and-Content-ID-claims)
- Musicbed clears claims with SyncID, which comes with subscriptions only. — [Makerstack](https://makerstack.co/reviews/musicbed-review/)
- Pixabay: some contributors or their distributors register their tracks with Content ID, so a legally used track may still be flagged. Shield-icon tracks are the registered ones. On Instagram and Facebook, automated detection may mute or block content; dispute with the track link and licence summary and point the platform to Pixabay. — [Pixabay FAQ (official)](https://pixabay.com/service/faq/)
- Meta Rights Manager: rights holders upload reference files, every upload is scanned, and that is why a Reel can be muted seconds after posting. The poster gets options to dispute. — [Thematic](https://hellothematic.com/music-rules-tiktok-instagram-youtube/) (a competitor with an interest in stressing risk)
- Mixkit, Bensound and Artlist licences forbid users from registering tracks in Content ID or Rights Manager. — [noncopyrighted.com](https://noncopyrighted.com/creator/mixkit/); [Foximusic](https://www.foximusic.com/blog/royalty-free-music-for-commercial-use-guide/); [Artlist licence](https://artlist.io/help-center/privacy-terms/artlist-license/)

### Inferences
- For an API-published Reel, a mute or claim shows up after publishing. Captions can't be edited after publishing, and audio can't be swapped either. The pipeline should therefore avoid shield-marked Pixabay tracks, and safelist the IG account before the first post if using Epidemic.
- The scheduled +24 h check could look for muted audio or a copyright notice (the Graph API exposure of that wasn't checked; this is an inference).

### Gaps
- No first-hand Reddit or forum reports were collected of specific "royalty-free" tracks being muted on Instagram (no searches were run for them in this pass). Most claim-risk content found comes from vendors with a commercial interest.
- Whether Pixabay's shield marking also means Meta Rights Manager registration, or only YouTube Content ID, is not stated.
- Whether the Graph API exposes a copyright mute on a published Reel: not researched.

## Q3: Libraries with short edits, loops or stems for clean endings

### Takeaway
Epidemic Sound is the clear leader. An API endpoint returns a musically edited version of any track at an exact duration (1 s–5 min), the web Adapt tool has 15/30/60 s presets, and most tracks have 4 stems. Free sources offer at best loops (Freesound) or remix stems (ccMixter). Everything else would need the pipeline's own fade or loop-point editing.

### Cited Findings
- Epidemic "Edit versions" API (beta): `POST /v0/tracks/versions` with `durationMs` (1000–300000), polled with `GET /v0/tracks/versions/{jobId}`. It returns preview and high-quality URLs that expire after 24 h, and it can shorten or extend. It only changes length, not mood. — [Epidemic developer docs: Create versions (official)](https://developers.epidemicsound.com/docs/create-versions/)
- The Soundtracking API (beta) scores an uploaded video in a single job. — [Epidemic soundtracking docs (official)](https://developers.epidemicsound.com/docs/soundtracking-with-llm/)
- Adapt: 15/30/60 s presets or any length up to 5 min. Almost every track has 4 stems (melody, instruments, bass, drums), and stems were added to Adapt in Nov 2025. — [Epidemic Adapt (official)](https://www.epidemicsound.com/tools/adapt/); [Epidemic product updates (official)](https://www.epidemicsound.com/blog/product-release-updates/)
- The MCP server can pin a section at a time offset (`requiredRegionsAtOffsets`), e.g. putting the chorus at 0:15. — [Epidemic MCP docs (official)](https://developers.epidemicsound.com/docs/mcp/)
- Freesound has many CC0 music loops (browse tag cc0), and a loop generator assembles loops with licence filtering. — [freesound-loop-generator](https://github.com/ffont/freesound-loop-generator); [licenseorg](https://www.licenseorg.com/guide/music-audio/freesound)

### Inferences
- The MCP server fits this project directly: Claude could pick a track by mood and cut it to the exact Reel length, with the beat or chorus timed to the slide changes.
- Without Epidemic, clean endings need local processing: a fade-out, or a cut on a downbeat found by beat tracking.

### Gaps
- Whether Uppbeat, Soundstripe, Artlist or Musicbed offer stems or 15/30 s cut-downs in 2026 was not verified.

## Q4: Any library licensed through Meta's Sound Collection / Instagram's business-allowed music

### Takeaway
The only Meta-native business-safe source is Meta Sound Collection: free, more than 14,000 tracks and effects, commercial use allowed, downloadable as MP3, but only for content on Meta platforms. It suits a pipeline that renders locally and publishes only to Instagram, but it has no API and no rich metadata. Instagram's in-app music library is licensed for personal, non-commercial use only, and business accounts get a restricted set.

### Cited Findings
- Meta Sound Collection: more than 14,000 royalty-free tracks and sound effects, downloadable as MP3 from facebook.com/sound/collection. The licence allows "commercial or non-commercial purposes" only in content made and shared on Meta products. Its terms were last updated March 2022. — [Lilach Bullock](https://www.lilachbullock.com/meta-sound-collection/); [Audiodrome](https://audiodrome.net/for-creators/meta-sound-collection/)
- Not for TikTok, YouTube, LinkedIn or any non-Meta use. — [Audiodrome: Facebook music library vs Sound Collection](https://audiodrome.net/for-creators/blog-facebook-music-library-vs-sound-collection/)
- Business accounts can't use the full Instagram music library, even for organic posts. The main library is for personal, non-commercial use. — [Audiodrome Instagram music library](https://audiodrome.net/for-creators/instagram-music-library/); [Uppbeat blog](https://uppbeat.io/blog/royalty-free-and-copyright-free-music/how-to-license-stock-media-for-client-ads)
- Sources conflict on ads: Instagram help says it can be used for ads, while Audiodrome says not every track is cleared for ads, and Foximusic advises avoiding it in paid content. — [Audiodrome](https://audiodrome.net/for-creators/royalty-free-music-for-facebook/); [Foximusic](https://www.foximusic.com/blog/instagram-reels-music-copyright-legal-guide/)

### Inferences
- MSP publishes only to Instagram, so Sound Collection downloads baked into the render are within the licence. A cross-post of the same video to YouTube or TikTok would need a different track.
- No third-party library was found that is "licensed via" Meta's business music. The paid libraries clear Instagram through their own allowlisting, not through Meta.

### Gaps
- Meta's own Sound Collection terms page was not fetched; the findings rely on third-party guides.
- Whether Sound Collection files carry usable metadata (genre/mood tags, BPM, duration) for automatic selection: the site shows genre and mood filters (not verified here). There is no API.
