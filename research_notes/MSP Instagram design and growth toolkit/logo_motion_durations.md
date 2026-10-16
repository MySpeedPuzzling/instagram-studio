# Logo motion: durations and use cases for splash, loader, Reel intro/outro (2026-10-16)

We are building an animated logo system (intro/splash, idle/loading loop, outro) as connectable modules (LM1 in
`lab/logo/`). This note answers: how long each piece should be, where platform rules constrain it, whether Reels
should have a logo intro or outro at all, and where the animations earn their place. Context:
`rive_and_logo_motion.md` (tooling) and `motion_video_collage_audio.md` §2 and §5 (Reel retention and safe zones).

Sources are official platform docs first, then UX research, then Meta/Instagram guidance, then third-party data.
**[E]** marks evidence (with a source). **[O]** marks our opinion or inference. Checked 2026-10-16.

## Summary: recommended durations

| Use | Recommended | Hard limits / rationale |
|---|---|---|
| **Android system splash (AVD icon)** | **600–900 ms** one-shot, start delay 0 (max 166 ms), then hold the last frame until the first page renders | Google: animation "not exceeding 1,000 ms on phones", delayed start "can't be longer than 166 ms"; "if app startup time is longer than 1,000 ms, consider a looping animation" [E] |
| **iOS launch screen** | **Static**, 0 ms. Optional in-app overlay that continues it: ≤ 1 s, only while the app is still loading | Apple: launch screen "isn't a branding opportunity", must be "nearly identical to the first screen" [E] |
| **Splash exit** (hand-off to content) | **200–300 ms** | Android sample exit animation: 200 ms [E]; M3 "medium" tokens 250–400 ms [E] |
| **Loader: delay before showing** | **500 ms** (show nothing for faster loads) | AndroidX `ContentLoadingProgressBar` MIN_DELAY 500 ms; Turbo progress bar appears after 500 ms [E] |
| **Loader: minimum time on screen** | **500 ms** once shown | `ContentLoadingProgressBar` MIN_SHOW_TIME 500 ms "to avoid flashes" [E] |
| **Loader loop cycle** | **1.0–1.5 s** per lap (hand sweep, linear); 1.6–2.0 s for a "breathing" piece | [O] fits M3's ≤ 1,000 ms duration scale and a calm loop; must be seamless (last frame = first) |
| **Loader: switch to determinate / message** | after **~5–10 s** | M3: loading indicator for 200 ms–5 s, progress indicator beyond 5 s; NN/g: percent-done beyond ~10 s [E] |
| **Reel logo intro** | **0 s: none.** Brand the first frame instead (static masthead logo) | Instagram: "compelling hook in the first 3 seconds"; skip rate is measured on the first 3 s [E] |
| **Reel outro** | **Default: none.** Optionally a **0.4–0.8 s** sting merged into the last content beat, ending on a frame that loops into frame 0. A full **1.5–2.0 s** lockup only for long Reels (> 30 s), the pinned brand Reel and ads | Loops add watch time, an end card breaks the loop, and viewers swipe at visible endings (see §3) [E + O] |

## 1. Mobile app splash

### What Apple says (HIG "Launching", updated June 2024) [E]

Source: [HIG Launching](https://developer.apple.com/design/human-interface-guidelines/launching).

- "Launch instantly… sometimes they don't want to wait more than a couple of seconds."
- "Downplay the launch experience. A launch screen isn't part of an onboarding experience or a splash screen, and it
  isn't an opportunity for artistic expression."
- "Design a launch screen that's nearly identical to the first screen of your app… If your app or game displays a
  solid color before transitioning to the first screen, create a launch screen that displays only that solid color."
- "Avoid including text on your launch screen."
- "Don't advertise. The launch screen isn't a branding opportunity… don't include logos or other branding elements
  unless they're a fixed part of your app's first screen."
- New in June 2024: "If you need a splash screen, consider displaying it at the beginning of your onboarding flow…
  If you don't provide an onboarding experience, you might display your splash screen as soon as launching completes."
- The launch screen itself is static (storyboard or `UILaunchScreen`). It cannot animate. Apps that "animate the
  launch" draw an identical view after launch and animate that ([Viget](https://www.viget.com/articles/animated-ios-launch-screen),
  [React Native blog on Twitter's bird mask](https://reactnative.dev/blog/2018/01/18/implementing-twitters-app-loading-animation-in-react-native)).
- Performance target: "render our first frame within 400 milliseconds" ([WWDC19 Optimizing App Launch](https://developer.apple.com/videos/play/wwdc2019/423/?time=305)).
  The watchdog terminates apps that take too long ([Reducing your app's launch time](https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time)).

**What it means for an animated logo [O].**
- The strict reading: the iOS launch screen is a solid colour, or the first screen's chrome, with no logo.
- The pragmatic reading, used by many apps: the launch screen shows the **static final frame** of the logo on the
  brand colour. An overlay view takes it over and plays a **≤ 1 s** settle-and-exit while the web view loads. It
  disappears the moment content is ready.
- This bends Apple's "no logo" rule but follows its intent: no added wait, no flash.
- Apple's 2024 text allows a splash "as soon as launching completes" for apps without onboarding. That covers the
  overlay, provided it never delays the user.

### What Google says (Android 12+ SplashScreen API) [E]

Source: [Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen) and the
[androidx SplashScreen reference](https://developer.android.com/reference/androidx/core/splashscreen/SplashScreen).

| Item | Spec |
|---|---|
| Icon type | "must be a vector drawable"; animated = **AnimatedVectorDrawable (AVD) XML** |
| Animated icon canvas | **432 dp**; visible inner area **288 dp** (4× the adaptive icon's 108/72 dp); "one-third of the foreground is masked" |
| Static icon | with icon background: 240×240 dp inside a **160 dp** circle; without: 288×288 dp inside a **192 dp** circle |
| Duration | "we recommend not exceeding **1,000 ms** on phones"; delayed start "can't be longer than **166 ms**"; if startup > 1,000 ms "consider a looping animation" |
| Background | "a single opaque color", with day and night variants |
| Branding image | 200×80 dp, but "the design guidelines recommend against using a branding image" |
| When shown | cold and warm starts; "never… during a hot start"; dismissed when the first frame draws, or kept with `setKeepOnScreenCondition` / an `OnPreDrawListener` |
| Exit | `setOnExitAnimationListener`; sample slide-up **200 ms**; "make sure the motion can be comfortably skipped" |
| Android < 12 | the compat library (API 23+) shows the icon **static**; put a static vector in `drawable/` and the AVD in `drawable-v31/` |
| Custom splash activities | migration to the SplashScreen API "is required" from Android 12 ([launch-time](https://developer.android.com/topic/performance/vitals/launch-time)) |

**Startup budgets.**
- Android vitals flags **cold ≥ 5 s, warm ≥ 2 s, hot ≥ 1.5 s** as excessive ([Infinum QA handbook](https://infinum.com/handbook/qa/tools/using-android-vitals),
  quoting Google's wording).
- Practitioners aim for a cold start under 2 s on mid-range phones ([Luciq](https://www.luciq.ai/blog/what-is-a-cold-start)).

### MSP specifics: Hotwire Native

The MSP apps are Hotwire Native shells around web views.
- Hotwire shows a spinner while the first page and its assets load. That creates a visible "loading gap" after the
  native launch ([Katalyst](https://katalyst.com.au/articles/seamless-loading-hotwire-native-ios)).
- A reference shell keeps the AndroidX splash up until the first Hotwire visit renders or fails, with an **8 s**
  timeout. On iOS it uses a static storyboard ([hotwire-native-shell PR #6](https://github.com/eserna27/hotwire-native-shell/pull/6)).

### Recommendation for MSP [O, built on the evidence above]

| Platform | Cold start | Warm/hot start | Max |
|---|---|---|---|
| **Android 12+** | AVD **600–900 ms** (a cut of LM1 "E · Start" or "C · Tick" ending on the settled logo), then hold until the first page renders, then a 200–300 ms exit | System: warm may show it, hot never. Don't add our own | If not ready by ~1 s, switch to the loader loop (§2). At ~8 s, dismiss and show an error/retry |
| **Android < 12** | Static icon (final frame), same hold and exit | — | same |
| **iOS** | Static launch screen = brand colour + static final-frame logo. Overlay continues it: a ≤ 1 s settle, then the loop if still loading, then a 200–300 ms exit | Resume shows nothing. Never replay the intro on resume | same |

- **Show it on every cold start, never on resume. Never add a minimum display time** to "let the animation finish".
  If content is ready at 400 ms, cut to the exit.
- LM1's full splash clips (2.2–2.4 s, settling at 1.60 s and 1.92 s) are **too long for the system splash**. They
  need a ≤ 1 s AVD edit: hand tick plus piece snap, with the speed lines dropped or overlapped.
- The longer versions can play in the overlay, but only while loading genuinely takes that long.

## 2. Loading animation

### Thresholds [E]

| Wait | What to show | Source |
|---|---|---|
| < 0.1 s | nothing (feels instant) | [NN/g response-time limits](https://www.nngroup.com/articles/response-times-3-important-limits/) |
| < 200 ms | "display the content immediately" | [M3 loading indicator](https://m3.material.io/components/loading-indicator/guidelines) |
| < 1 s | no looped animation ("distracting") | [NN/g progress indicators](https://www.nngroup.com/articles/progress-indicators/) |
| 200 ms–5 s (M3) / 2–10 s (NN/g) | looping indicator | M3, NN/g |
| > 5 s (M3) / > 10 s (NN/g) | determinate progress or an estimate, plus a way to leave | M3, NN/g |
| Full-page load < 10 s | skeleton screen; a spinner for a single module | [NN/g skeleton screens](https://www.nngroup.com/articles/skeleton-screens/) |

**Avoiding flicker.**
- AndroidX `ContentLoadingProgressBar` waits **500 ms** before showing, then stays at least **500 ms** "to avoid
  'flashes' in the UI" ([source](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/core/core/src/main/java/androidx/core/widget/ContentLoadingProgressBar.java)).
- Turbo's progress bar appears only for pages slower than **500 ms** ([Turbo handbook](https://turbo.hotwired.dev/handbook/drive)).

**Why bother.** In a study cited by NN/g, people shown a looping progress indicator were willing to wait about
**3× longer** than people shown nothing ([NN/g](https://www.nngroup.com/articles/progress-indicators/)).

### How a branded loop should behave [O unless cited]

- **Seamless:** frame N = frame 0, with no settle or overshoot inside the loop.
- **Hand sweep:**
  - one lap in **1.0–1.5 s**, constant speed (linear easing; M3 reserves linear for indeterminate progress);
  - trail ghosts fade in a fixed phase;
  - tie the minute hand to real time only if progress becomes known.
- **Piece "breathing":** a scale of 1.00 → 1.03 → 1.00 over **1.6–2.0 s**, ease-in-out. Keep it subtle: a big pulse
  reads as an alert.
- **Entry and exit:** enter from the settled splash frame, so splash → loop is one continuous module. Exit by
  finishing the current lap only if that takes ≤ 300 ms; otherwise cross-fade out.
- **Long waits:** after ~5 s, add text ("Still loading…"). At the 8 s timeout, show retry.
- **Flashing:** stay well under 3 flashes per second ([WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).
- **Skeleton vs loader:** Hotwire pages are server-rendered, so between pages use the Turbo progress bar (skeletons
  don't fit). Keep the branded loop for the cold-start gap and long native waits.

### Reduced motion [E]

- **iOS Reduce Motion:** "reduce automatic and repetitive animations, including zooming, scaling, and peripheral
  motion"; replace movement with fades ([HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
  "Make motion optional" ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).
- **Web:** `prefers-reduced-motion: reduce` maps to iOS Settings > Accessibility > Motion and Android 9+
  "Remove animations" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).
- **WCAG 2.2.2:** auto-moving content that lasts more than 5 s alongside other content needs pause/stop/hide. A
  preloader shown *alone* counts as "essential" and is exempt ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)).
- **MSP rule [O]:**
  - With reduced motion, the splash shows the static final frame.
  - The loader becomes a static logo with a slow opacity pulse (≥ 2 s cycle, no scale) or a plain text indicator.
  - An *inline* loader next to content stops after 5 s.

## 3. Reels: intro and outro

### Evidence

- **Hook in 3 s:** "Start with a compelling hook in the first 3 seconds" (Instagram for Creators, 26 Feb 2025)
  ([source](https://creators.instagram.com/blog/helping-creators-of-all-sizes-break-through)).
- **Skip rate:** Insights and the API now report **skip rate**, the share of views skipped in the first 3 s
  (`reels_skip_rate`, added 3 Dec 2025, "in development") ([changelog](https://developers.facebook.com/docs/instagram-platform/changelog)).
- **Ranking signals:** Mosseri (Jan 2025): the top ranking signals are watch time, likes per reach and sends per
  reach. Watch time counts both percentage and seconds ([summary](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance)).
- **Replays count.** Instagram Help defines:
  - **Views** as "the number of times your reel starts to play or replay";
  - **Watch time** as including "any time spent replaying the reel";
  - **Average watch time** = watch time ÷ **initial views** ([Help Center](https://help.instagram.com/202865988324236);
    the page is JS-rendered, so the wording was confirmed via search snippets and
    [Sprout Social](https://sproutsocial.com/insights/instagram-reels-analytics/)).
  - So a replay raises average watch time without adding an initial view. **A seamless loop directly lifts the
    metric Mosseri names first.** No Meta source says "replay rate" is itself a ranking signal.
- **Brand early, but inside the content.**
  - Facebook/Nielsen: "up to 47% of the value in a video campaign was delivered in the first three seconds"
    ([Meta](https://www.facebook.com/business/news/updated-features-for-video-ads)).
  - Google ABCDs: "brand early, often, and richly". For Shorts: "brand differently, being organic to the story"
    ([Google Ads Help](https://support.google.com/google-ads/answer/14783551?hl=en)).
  - Both are about ads, and both point to the brand *in the content* from the start, not to a logo intro before it.
- **Where people swipe.** In a user study of short-video swiping, 29% of swipes came in the first 20% of a video and
  **42% in the last 20%** (which includes auto-advance) ([Dashlet, arXiv 2204.12954](https://arxiv.org/pdf/2204.12954)).
  - Practitioner retention guides describe an "end drop-off" when a video is visibly wrapping up, and a small end
    bump when viewers replay ([Retensis](https://retensis.com/blog/how-to-read-retention-curves)).
  - Neither is a controlled test of end cards.
- **Brand intros in practice (anecdotal).** One A/B report gave a branded intro a 22% 3-second view rate, against
  41–46% for pattern-interrupt hooks ([Stackmatix](https://www.stackmatix.com/blog/tiktok-hook-first-3-seconds)).
- **CTA end cards.** TikTok-attributed figures say CTA end cards lift recall 45%, but also that branding only at the
  end costs 17 points of brand linkage. These figures are for ads and are reported second-hand
  ([Coinis](https://coinis.com/how-to/best-way-to-design-tiktok-ad)).
- **Own logo is fine.** Instagram is "less likely to recommend… content with noticeable watermarks" (meaning other
  apps' marks) ([Instagram for Creators](https://creators.instagram.com/blog/tips-for-improving-your-reach)).
  Mosseri reportedly said your own logo doesn't hurt reach ([secondary](https://frameos.studio/blog/how-to-cross-post-without-watermarks)).
- **Safe zone.** Meta's Ads Guide says to keep text and logos out of the top **14%**, bottom **35%** and **6%** each
  side. On 1080×1920 the safe area is ≈ 950×979 px, y 269–1248 ([Biddyco](https://www.biddyco.com/blog-posts/meta-ad-specs),
  quoting Meta). Our outro text at y 990–1144 sits inside it.
- **Context.** Average Reel watch time is **8.5 s** ([Metricool via NetInfluencer](https://www.netinfluencer.com/instagram-views-up-27-percent-in-ear)).
  Socialinsider's 2026 brand study found the most views at 45–60 s. Small tests show completion falling with length
  (7 s ≈ 94%, 15 s ≈ 78%, 30 s ≈ 56%) ([summary](https://creatorhouse.app/blog/instagram-reel-length-2026-test)).

### Does a branded outro help or hurt?

| Option | Watch time / loop | Brand recall | Verdict [O] |
|---|---|---|---|
| **A. Separate 2 s logo outro (LM1 O1–O3) on every Reel** | Breaks the loop. Signals "the end", so viewers swipe. On a 10 s Reel it is 20% of the runtime with no new info, which lowers the % watched | + recall for the few who stay | **No as default** |
| **B. No outro, seamless loop** (last frame cuts back to frame 0) | Best for replays and average watch time | Relies on the first frame and the masthead | **Default** |
| **C. 0.4–0.8 s sting merged into the last content beat** (the masthead logo's hand ticks to 12 as the payoff lands, then cuts to frame 0) | Keeps the loop, since nothing reads as an ending | Adds a branded "click" moment | **Default upgrade, test it** |
| **D. Persistent small static brand mark** (masthead) plus the handle in the caption | Neutral | Steady presence, as ABCD's "often" | **Yes, already house style** |
| **E. Full 1.5–2 s lockup outro with domain and CTA** | Hurts the loop | Best for "visit myspeedpuzzling.com" | **Only:** Reels > 30 s with a natural end (recaps, explainers), the pinned brand Reel, paid ads, YouTube/long-form |

**Verdict.**
- **No logo intro, ever.** Frame 0 is the hook, with the static masthead logo already on it.
- **No standalone outro by default.** End on a loop-friendly frame, optionally with a ≤ 0.8 s sting woven into the
  final beat.
- The owner's instinct is right. The LM1 outros fit formats where the viewer has already committed and an ending
  is natural.
- **Test it once** with Trial Reels: one data Reel in variants B, C and E, compared on skip rate, average watch
  time ÷ length (> 100% means replays), sends and follows.

## 4. Where the logo animations earn their place

Ranked by value for MSP relative to effort.

| # | Use case | Duration and format | Why / evidence |
|---|---|---|---|
| 1 | **App cold-start splash** (Android AVD; iOS static launch screen plus overlay) | ≤ 1 s AVD; overlay ≤ 1 s; exit 200–300 ms | Seen on every cold start; platforms define it exactly (§1) [E] |
| 2 | **Loader loop** (app overlay during the Hotwire cold-start gap; web for slow actions such as uploads and stats) | 1.0–1.5 s seamless cycle, shown after 500 ms, min 500 ms | Fills the documented Hotwire gap; looping feedback makes people wait ~3× longer [E] |
| 3 | **Website moments:** hero logo, empty states, 404, "PB beaten!" or XP level-up | Hero one-shot ≤ 1.5 s that never delays content (LCP "good" ≤ 2.5 s, [web.dev](https://web.dev/articles/lcp)); empty states 1–2 s then idle; celebrations 1.5–2.5 s | Rive's sweet spot (`rive_and_logo_motion.md`) [O] |
| 4 | **Competition and event screens:** livestream start, countdown end, "results in", stream overlays | Stream opener 3–5 s; transition stinger 0.5–1.0 s; countdown loop 1 s per tick | A captive audience waiting anyway, so branding costs no retention [O] |
| 5 | **Pinned brand Reel** ("What is MSP?") and **longer recap Reels** | Full lockup outro 1.5–2 s with domain and CTA; segment transition sting **0.4–0.6 s** | The viewer chose to watch the brand story; a sting doubles as a pattern interrupt between segments [O]. Up to 3 posts can be pinned ([guide](https://www.view-ig-story.com/blog/instagram-pinned-stories-and-posts)) |
| 6 | **Story series opener** (the first frame of a weekly recap or event day) | 1.5–2.5 s animation inside the frame, with the headline readable from 0 s; later frames use the static mark | Story viewers tap forward fast, so the brand must not delay the content [O; no hard Stories data found] |
| 7 | **GIPHY sticker** (the logo with the hand ticking) | 1–2 s seamless loop; transparent GIF, ≥ 20% transparent first frame; needs a GIPHY brand channel (working website, domain email, ≥ 5 GIFs) | Lets players put MSP into their *own* Stories, a cheap UGC reach channel ([GIPHY requirements](https://support.giphy.com/hc/en-us/articles/360029960931-Requirements-for-Sticker-Approval), [CSU guide](https://social.colostate.edu/best-practices/how-to-giphy-creating-a-brand-account-gifs-and-stickers/)) [E + O] |
| 8 | **Newsletter header GIF** | 1.5–2.5 s, then hold on the final logo (no endless loop); ≤ 1 MB, ideally < 500 KB; 600 px wide; **frame 1 = the final logo** | Classic Outlook shows only frame 1; Outlook 365 plays loops 3 times ([Litmus](https://www.litmus.com/blog/a-guide-to-animated-gifs-in-email), [Litmus O365](https://www.litmus.com/blog/microsoft-expands-animated-gif-support-with-outlook-365)) [E] |
| 9 | **YouTube / long-form intros** | 2–3 s sting **after** a cold-open hook, never before; outro 1.5–2 s, or under YouTube end screens | YouTube's "Intro" metric is retention at 30 s ([YouTube Help](https://support.google.com/youtube/answer/9314415)); guides say ≤ 5–10 s for the branded part ([vidIQ](https://vidiq.com/blog/post/youtube-video-intros/)) [E + O] |
| 10 | **Watermark** | **Static**, not animated | Motion in the corner competes with the content; our own static mark is fine [O] |
| — | **Highlight covers** | Not possible: static images only | Use the settled final frames as covers ([PicCollage](https://piccollage.com/blog/step-by-step-guide-to-instagram-highlight-covers/)) [E] |

## 5. Formats and what the app team needs

**Delivery options.**

| Target | Format | Why |
|---|---|---|
| Android 12+ system splash | **AVD XML** (only option) | The system renders only (animated) vector drawables [E] |
| Android < 12 splash | static vector drawable in `drawable/` | The compat library cannot animate [E] |
| iOS launch screen | static: storyboard or `UILaunchScreen` + PDF/SVG asset + named colours (light/dark) | Launch screens can't animate [E] |
| iOS/Android post-launch overlay and native loader | **Rive** (state machine with an `appReady` input: intro → loop → exit) or **Lottie / dotLottie** (fixed clips) | Rive handles "hold or loop until ready" natively; Lottie needs app code to switch segments [O] |
| Loader inside Hotwire web pages and the website | **inline SVG + CSS keyframes** (no runtime, a few KB, `prefers-reduced-motion` built in); Rive for interactive moments | Avoids shipping the Rive web runtime (≈ 200 KB gz incl. WASM) or lottie-web (≈ 60 KB gz) for a spinner ([Unicorn Icons](https://unicornicons.com/blog/lottie-vs-rive-performance)) [E for sizes, secondary] |

**AVD constraints that hit our logo** ([AOSP AnimatedVectorDrawable](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/graphics/java/android/graphics/drawable/AnimatedVectorDrawable.java)) [E]:
- Animatable properties:
  - `vector`: alpha
  - `group`: rotation, pivot, scale, translate
  - `path`: pathData (morphs need compatible paths), fill/stroke colour and alpha, strokeWidth, `trimPathStart/End/Offset`
  - `clip-path`: pathData
- Gradients (linear, radial, sweep) are supported. **There are no opacity masks and no filters.**
  - LM1's 10 gradient-mask trail ghosts must be rebuilt as gradient fills with alpha stops.
  - The white outline halo (a filter) must become a real path.
- AVDs run on the RenderThread from API 25, so they stay smooth while the app starts.

**What we hand over [O].**
1. `splash_logo_avd.xml`:
   - a 432×432 dp viewport with all parts inside the central 288 dp, and the logo itself inside a 192 dp circle
     (so it survives the mask);
   - duration ≤ 1,000 ms (target 600–900 ms), no start delay, last frame = the static icon.
   - It can be scripted from `assets/brand/speedpuzzling-logo-rig.svg` (named parts map to AVD `group`/`path`
     names). Preview it in Android Studio or [Shape Shifter](https://shapeshifter.design/).
2. `splash_logo.xml` (static vector, final frame) for `drawable/`, plus the background colour hex for day and night.
3. iOS: the final-frame logo as PDF/SVG, background colours, exact position and size, so the overlay matches the
   launch screen pixel for pixel.
4. Overlay/loader: one `.riv` (Cadet plan to remove the splash, see `rive_and_logo_motion.md`) or a `.lottie`
   pair (intro ≤ 1 s, loop 1.0–1.5 s), plus a reduced-motion spec.
5. Web: an SVG + CSS loader snippet with a `prefers-reduced-motion` fallback.

**Size budgets [O].**

| Asset | Budget |
|---|---|
| AVD | ≤ 50 KB XML; paths simplified to ≤ ~40 |
| `.riv` | ≤ 30 KB |
| `.lottie` | ≤ 50 KB |
| Web SVG loader | ≤ 10 KB |
| Newsletter GIF | < 500 KB |

## Gaps

- No controlled study of end cards vs loops on organic Reels was found. The verdict rests on Instagram's metric
  definitions plus swipe data, so validate it with one Trial Reel test.
- The Instagram Help Center text was confirmed only via search snippets (the page renders client-side).
- Durations of well-known apps' splashes are known only from open-source recreations (Twitter-style mask
  0.5–1.3 s). No official figures exist.
- There is no hard evidence on Story-opener drop-off, or on stream/event overlays.
- The Android vitals thresholds come from a secondary source quoting Google (the Play Console page wasn't
  reachable).
- Whether the MSP apps' cold start is under 1 s is unmeasured. It decides whether the loader loop is ever seen.
  Ask the app team for TTID/TTFD numbers (Play Console, Xcode Organizer).
