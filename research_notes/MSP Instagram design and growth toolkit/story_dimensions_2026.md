# Story dimensions 2026: what Instagram covers on real phones, and the most compatible 1080×1920 template

Researched 2026-10-17. Labels: **[E]** evidence (official doc, a dated report, or our own measurement), **[V]** vendor or
community figure with no stated method, **[I]** our inference from device geometry. All y/x values are **canvas px on a
1080×1920 Story** unless marked pt (iOS points) or dp (Android density-independent px).

## Takeaway

- Nobody publishes a measured organic Story safe zone. Meta's only official numbers are for **ads** (14 % top, 35 % bottom,
  6 % sides), and third-party "safe zones" range from 155 to 270 px at the top and 155 to 380 px at the bottom, with no
  devices named. Our previous 270/380 came from the ad end of that range. It cost about 230 px of usable height.
- On today's tall phones (19.5:9 and 20:9: every iPhone since the X, almost every Android since about 2019), the 9:16 Story is
  shown **full width, not cropped, as a rounded card under the status bar**. The reply bar sits **below** the card. Only
  the top ~150–170 px are covered, by the progress bar and the account row. [I, consistent with the owner's screenshot]
- The bottom of the canvas is covered only on **16:9 phones** (iPhone SE/8, about 185 px under the reply bar). It may also be
  covered by Instagram's **bottom progress-bar test**, which iOS users have reported since May 2026. [E/I]
- **Most compatible band:** key text and stickers in **y 200–1720, x 65–1015** (text column x 88–992). Header from y 200. Footer
  ends by y 1714. Below 1720 goes decoration only. This gives about 1520 px of usable height, against the 1270 px we used before.
- Verify on device with the rendered ruler frame (below) before freezing the constants.

## 1. How a 1080×1920 Story is displayed

| Screen | Example (logical size) | Card scale | How the 9:16 canvas fits | Bottom UI |
|---|---|---|---|---|
| 16:9 phone | iPhone SE 2/3, 8: 375×667 pt | 2.88 px/pt | Fills the screen exactly. | Reply bar **over** the canvas, about 64 pt ≈ 185 px [I] |
| 19.5:9 iPhone | 13/14/16e 390×844; 15/16/Pro 393×852; 17/17 Pro 402×874; Pro Max 440×956 pt | 2.75–2.45 px/pt | Full width, card 693–782 pt tall, top at the status-bar inset (47–62 pt). | **Below** the card: 94–112 pt spare (incl. 34 pt home bar) [I] |
| 20:9 Android | Pixel/Galaxy S, 412×915 dp | 2.62 px/dp | Full width, card ≈ 732 dp. | **Below** the card, ≈ 140 dp spare before system bars [I] |
| 21:9 Android | Xperia-type, 411×960 dp | 2.63 px/dp | Full width, more black below. | Below [I] |
| 18:9 (older Android) | 360×720 dp | 3.0 px/dp | Barely fits with status bar and nav bar. | Behaves like 16:9: reply bar over the canvas [I] |
| iPad app (since 2025-09-03), foldable inner screens, desktop web | wider than 9:16 | height-limited | 9:16 card with bars at the sides (pillarboxed), no crop. | Separate [I, weak: no source describes Stories on iPad] |

- **The owner's screenshot is consistent with the full-width card.** [E + I] The canvas spanned about 1635 screenshot px.
  A full-width card on a 1179×2556 (or 1170×2532) iPhone is 2096 (2080) px tall. The screenshot was most likely downscaled
  to 2000 px tall when it was shared: 2096 × 2000/2556 = 1640 px. A full-width card is therefore the simplest explanation.
- **Cropping:** a correctly sized 9:16 Story is not cropped on current phones. [I] Cropping or "zoom to fill" affects non-9:16
  uploads [V: argil.ai, photo-extender.com]. Meta's ads text only says content outside the safe zone "could be cropped"
  [E: Meta ads guide]. Back in 2018, Instagram zoomed Stories to fill iPhone X screens. [I, memory, unsourced] That cut about
  96 px from each side. Our text column x 88–992 survives even that worst case.
- **Rounded corners:** the card's corners are about 12–16 pt ≈ 35–45 px radius. Never put text in the corners. [I]

## 2. Viewer overlays (2026)

| Overlay | Where | Height in canvas px | Source |
|---|---|---|---|
| Progress bar | top of the card, ~8 pt down | ~2–3 pt bar; ends ≈ 30 px | [V thumbcrafted ~30 px; I] |
| Account row (avatar, name, time, ⋯, ×), plus a light dark gradient | top of the card | ends at **≈ 130–170 px** | [V overvisual 155 px; thumbcrafted ~50+80 = 130 px; I: ~56–60 pt × 2.75] |
| ⋯ and × buttons | top-right | inside the band above | [E Instagram Help: × top right] |
| Reply bar ("Send message", ♥, ✈) | below the card on tall phones; over the bottom on 16:9 | 0 px on tall phones; **≈ 185 px** on 16:9 | [I] (vendors say 250–340 px because they assume an overlay) |
| Bottom progress bar (test) | bottom of the card, song info next to ♥ | thin bar, plus song info if music is used | [E piunikaweb 2026-05-13, iOS only, A/B test, not confirmed rolled out] |
| Ads only: "Sponsored" label and CTA | top label; CTA at the bottom | Meta: keep 14 % / 35 % / 6 % free | [E Meta ads guide, fetched 2026-10-17] |
| Tap zones | left side = back, right side = next; hold = pause; swipe = next account | the whole card | [E Instagram Help] |

The tap zones are why stickers belong in the middle. A tap on a sticker goes to the sticker, but a near-miss beside it
skips the Story. Keep stickers at least 60 px from the sides, centred where possible.

## 3. Sticker sizes at default scale

No official numbers exist. Every sticker can be pinch-resized, and no documented limit was found [E Social Media
Examiner, Later]. Poll heights below are scaled from the owner's measured 3-option poll; the rest are estimates to measure
with the test frame.

| Sticker | Default size (w × h canvas px) | Basis |
|---|---|---|
| Poll, 3 options | **≈ 630 × 600** (header ≈ 135, rows ≈ 112 high, 23 apart) | [E owner's iPhone, 2026-10-17; geometry from the life-size guide] |
| Poll, 2 options | ≈ 630 × 465 | [I from the row pitch] |
| Poll, 4 options | ≈ 630 × 735 | [I] |
| Poll with a two-line question | add ≈ 60 | [I] |
| Quiz (2–4 options) | ≈ same as a poll | [I, measure] |
| Question box | ≈ 650 × 350 | [I, measure] |
| Countdown | ≈ 650 × 330 | [I, measure] |
| Emoji slider | ≈ 650 × 260 | [I, measure] |
| Link | ≈ 120 tall pill; width follows the text, ≈ 350–650 | [V postlia "~200 px room"; I] |

- **Scaling:** pinch to about 50–200 % in practice [V]. For legible votes, plan on 100–130 %. A 3-option poll at 130 % is
  ≈ 820 × 780.
- **Edge rule:** none is official. Keep stickers out of 0–190 (behind the account row; Ads Manager also restricts sticker
  placement there [V]) and out of 1720–1920 (under the reply bar on 16:9 phones, so voters there can't reach it).

## 4. Recommendation: the most compatible MSP Story template

```
 y    0 ┌──────────────────────────────────────────────┐ ← rounded card corners ≈ 40 px
        │▓▓ progress bar + avatar/name/time/⋯/×  ▓▓▓▓▓│  0–190  never anything that matters
  190   │- - - - - - - - - - - - - - - - - - - - - - - │
  200   │  ■ KICKER · header (200–272)        logo/idx │  header / masthead (+ domain line ≈ 292)
  284   │  ───────────────── rule ──────────────────── │
  312   │  Title / key text                             │
        │                                               │  KEY BAND  x 65–1015 (text column 88–992)
        │        ┌───────────────────────┐              │            y 200–1720
        │        │  sticker zone          │              │  poll: ≥ 700 free (100 %), ≥ 860 (130 %)
        │        │  (poll / quiz / link)  │              │  stickers ≥ 60 px from the sides
        │        └───────────────────────┘              │
 1586   │  content bottom                               │
 1606   │  ───────────────── rule ──────────────────── │
 1622   │  myspeedpuzzling.com · source          LOGO  │  footer box 1602–1714
 1720   │- - - - - - - - - - - - - - - - - - - - - - - │
        │░░ reply bar on 16:9 phones / iOS test bar ░░░│  1720–1920  bleed/decoration only
 1920   └──────────────────────────────────────────────┘
          (tall phones: reply bar sits BELOW the card)
```

| Band | y (canvas px) | x | What goes there |
|---|---|---|---|
| Top overlay | 0–190 | all | Background and bleed only |
| Header / masthead | 200–272 (masthead + domain to ≈ 330) | 88–992 | Brand device, kicker, index/logo |
| **Key text** | **200–1720** | **65–1015** (column 88–992) | Titles, numbers, charts, source line |
| Sticker-safe | 220–1700, ≥ 60 px from the sides | 120–960 ideal | Poll, quiz, link, question |
| Footer | rule 1606, box 1602–1714 | 88–992 | Source line + logo (or masthead, no footer) |
| Bottom bleed | 1720–1920 | all | Decoration only (hidden on 16:9 phones) |

- **Minimum free zone for a poll:** 700 × 700 for a 3-option poll at 100 %, 860 × 860 to allow ~130 %. With the
  masthead layout (no footer), y 860–1720 leaves 860 px free. With the standard rows, a title to ~520 leaves y 540–1590,
  about 1050 px, enough for a 4-option poll at 130 %.
- **Branding:** top-left device + kicker at y 200, and the logo top-right in the masthead row. The top-right ⋯/× buttons
  end above 190, so a logo at y 200+ is not covered. Never put branding below 1720.
- **Cost of the trade-off:** on a 16:9 phone the footer (1602–1714) sits just above the reply bar (from ≈ 1735).
  This is tight but clear. If the test shows the reply bar higher, lower `y1` and the footer together.

## Proposed constants (not applied; verify on device first)

```ts
// src/design/house.ts
export const STORY = { headTop: 200, ruleTop: 284, contentTop: 312, contentBottom: 1586, footRule: 1606, footTop: 1622 } as const;
// was { headTop: 286, ruleTop: 370, contentTop: 400, contentBottom: 1420, footRule: 1436, footTop: 1452 } → content 1020 → 1274 px (+25 %)
export const STICKER_STORY_ROWS = { headTop: 200, ruleTop: 284, footRule: 1606, footTop: 1622 } as const;
// now equal to STORY's rows (only ruleTop changes, 334 → 284); the sticker-specific option is `masthead: true`.
// Could become an alias of STORY.
export const STICKER_STORY_SAFE = { x0: 65, y0: 190, x1: 1015, y1: 1720 } as const;   // unchanged

// src/render/render.ts
story: { width: 1080, height: 1920, safe: { x0: 65, y0: 190, x1: 1015, y1: 1720 } },   // was 65/270/1015/1540
```

Header box = headTop … headTop+72 (ends 272). Footer box = footTop−20 … footTop+92 (1602–1714), inside y1 1720.
Once every Story uses the new safe area, `STICKER_STORY_SAFE` is redundant. The Reel safe area (220–1250) is unaffected:
Reels have a real right-hand action rail and a caption overlay.

## How to verify on device

Test frame: `content/labs/STORY-TEST/story-test-v1.jpg` (1440×2560 upload, rendered with the repo harness by
`content/labs/STORY-TEST/story-test.ts`; both gitignored). It has:
- a 50 px grid, with y labels every 50 px on both edges;
- 10 px ticks in 0–320 and 1560–1920, x labels every 100 px;
- the proposed bands (red top 0–190, amber bottom 1720–1920 and side margins, green key band, blue column);
- the proposed header and footer rows;
- a dashed default-size 3-option poll (630×600) and its 130 % outline;
- card-corner arcs.

1. Post it to **Close Friends** (a list holding only the owner), or upload it and screenshot before sharing. Open it in the
   viewer from a second account if possible. Screenshot it on the iPhone, and on one Android (20:9) if available.
2. In the editor, add a **3-option poll at default size** over the dashed box, then 2- and 4-option polls, a quiz, a
   question box and a link sticker. Screenshot each.
3. Read off: the y where the account row and its gradient end; whether anything overlaps the canvas bottom; where the
   poll's top and bottom fall. Per-device scale is (canvas bottom − canvas top in the screenshot) / 1920.
4. If any number differs by more than 20 px from this note, update the table and the constants, and record the device and
   app version.

## Sources

- Meta, Instagram Stories image ad specs (14 % top, 35 % bottom, 6 % sides; 1440×2560), fetched 2026-10-17:
  https://www.facebook.com/business/ads-guide/update/image/instagram-story [E]
- Meta Business Help, "About text overlays and the Safe Zone for ads in Stories and Reels" (page body did not load):
  https://www.facebook.com/business/help/980593475366490/ [E, title only]
- Instagram Help, Stories navigation (tap left = back, right = next, × top right): https://help.instagram.com/1662869217365427 [E]
- PiunikaWeb, "Instagram testing Stories progress bar at the bottom of the screen", 2026-05-13 (iOS A/B test):
  https://piunikaweb.com/2026/05/13/instagram-testing-stories-progress-bottom/ [E, report]
- Overvisual safe-zone checker (155 px top/bottom, no method), updated Aug 2026: https://www.overvisual.com/tools/instagram-story-safe-zone [V]
- Thumbcrafted (progress bar ~30 px, account row ~50–130 px, reply box ~80 px, home bar ~30 px; no device):
  https://thumbcrafted.com/instagram-story-safe-zone [V]
- Argil, 2026-08-14 (250/340 px, citing Sprout and Hootsuite): https://www.argil.ai/blog/instagram-story-dimensions [V]
- AdMakeAI, 2026-05-25 (claims "20:9 crops horizontally"; contradicted by the owner's full-width screenshot):
  https://admakeai.com/blog/instagram-story-dimensions-2026 [V]
- 1ClickReport (270/380/65 px, the source of our old numbers): https://www.1clickreport.com/blog/meta-ads-creative-safe-zones-2026-guide [V]
- Postlia (link sticker ~200 px room, poll ~300 px): https://postlia.com/blog/story-dimensions [V, outdated for the stacked poll]
- Social Media Examiner, poll stickers can be pinch-resized: https://www.socialmediaexaminer.com/instagram-stories-polls-how-to-use/ [E]
- iPad app launch, 2025-09-03: https://www.macrumors.com/2025/09/03/instagram-finally-comes-to-ipad/ [E]
- Device logical sizes and safe-area insets: Apple Human Interface Guidelines (layout), Android display metrics. [E, general knowledge]

## Gaps

- No official Meta numbers exist for organic Stories, and no vendor names the device it measured. The overlay heights here
  are geometry plus vendor figures until the test frame is screenshotted.
- Android behaviour is inferred, not observed. iPad Story display is undocumented.
- Whether the bottom progress bar has rolled out beyond the test is unknown. If it has, re-check the bottom 60 px of the canvas.
- Sticker sizes other than the 3-option poll are estimates.
