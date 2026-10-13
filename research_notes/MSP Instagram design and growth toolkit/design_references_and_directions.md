# Design references and visual directions for MSP data posts (as of 2026-10-13)

Scope: what makes data-storytelling and community-brand accounts look premium and recognisable, turned into concrete, testable visual directions for MySpeedPuzzling (MSP) feed posts (1080×1350, key content inside the central 3:4 grid-safe area) and Stories/Reels (1080×1920). Everything is rendered in code (HTML/CSS/SVG → JPEG). Research was done on 2026-10-13.

Method notes and caveats:
- Instagram profiles could not be browsed while logged out. Account-level claims therefore come from articles, case studies, the teams' own pages and search excerpts. Where a claim rests on my own observation or prior knowledge and could not be re-checked this session, it is marked **unverified** and kept out of "Cited Findings".
- Several primary pages could not be fetched: The Economist's chart style-guide PDF (`design-system.economist.com`, blocked), the Economist's Medium post "Mistakes, we've drawn a few" (blocked), the Trafford Data Lab Medium post (403), the full Kontinentalist article (paywalled) and DesignRush (403). These appear only as search excerpts, flagged as such.
- MSP's own brand facts come from the MSP repository: [design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md) and [badge-art README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md). Both were read locally. The GitHub URLs follow the round-1 report; the badge-art README says its work is committed "on the badges branch", so the main-branch link may not resolve yet.
- I computed contrast ratios and colour-blind separations for MSP's palette for this brief, using the WCAG relative-luminance formula and Machado-2009 colour-vision-deficiency (CVD) matrices with CIE76 ΔE. I also inspected Rubik's OpenType tables in the MSP repo. These are my own measurements, labelled "computed".

---

## 1. Reference study: what makes each account recognisable and premium

### Takeaway
The premium data brands share a small, repeatable kit rather than a "look":
- a **takeaway headline** (the title says the finding, not the topic);
- **one highlight colour against muted context**;
- **direct labels and editorial annotation** instead of legends;
- **one fixed brand device** in a fixed position (The Economist's red rectangle is the archetype);
- **one chart per idea**.

The consumer "recap" brands (Spotify Wrapped, Strava) add a **chaptered narrative arc** and, since 2025, a deliberate **analog/human texture** as a reaction against "AI slop". MSP should copy the rules, not the surfaces.

### Cited Findings

**The Economist**
- Its recognisable house look is described as: a typeface requirement, a neutral grey-and-blue palette, a **red rectangle standing in for the logo**, short left-aligned titles with subtitles, and thick white gridlines. (This comes from a search excerpt of a third-party analysis; the page returned 403.) — [Trafford Data Lab, "Developing a data visualisation style"](https://medium.com/@traffordDataLab/developing-a-data-visualisation-style-cd24f88fa59)
- Economist charts take a "minimalist approach" that "directs the viewer's attention to what truly matters". Titles and annotations "often function as headlines and highlight the central insight". Neutral, muted tones are used, with bold colour reserved for the most critical data. Fonts, chart types and layouts are applied consistently, so a graphic is recognisable as an Economist chart. Classic bars and lines dominate. Graphics are built to be understood at a glance on small screens. (Outside observer, not an official guide.) — [The Data School, "5 lessons from the Economist"](https://www.thedataschool.co.uk/johann-shin/visual-storytelling-done-right-5-lessons-from-the-economist)
- Economist Impact built a data design system so that charts follow the same clarity principles as the magazine's writing style guide. Its palette is mostly reds and blues, and the team flagged accessibility problems with subtle colour differences. — [Nightingale, data journalism topic page](https://nightingaledvs.com/topics-in-dv/data-journalism)
- In 2019 the Economist ran "data-driven IG stories" to "bring #datajournalism on the platform", e.g. "Why is lager more popular than beer lovers would admit?". — [Charman-Anderson, 2019](https://charman-anderson.com/2019/06/12/how-the-economist-is-using-data-driven-interactive-stories-to-grow-its-instagram-following/)
- A non-affiliated slide-template site lists Economist-style hex values (blue #006ba2, gridlines #b7c6cf). These are **unverified**. — [SlideSpeak](https://slidespeak.co/slide-design-prompts/prompts/economist-style)

**Financial Times**
- On Instagram the FT's growth was driven by what Econsultancy calls "chart porn":
  - a Microsoft share-price chart was the day's most-liked image (1,400 likes);
  - a busiest-airports graphic got 1,300+ likes;
  - an animated household-income chart got 15,000+ views in 24 h.

  Followers went from ~40k to 286k+ in a year. Social-specific graphics used "a different colour scheme" and "a black background". The social journalist Jake Grovum: "we post things that are not necessarily Instagram-friendly, like a chart on how US and UK bonds have performed", and the FT aims for a "distinct voice and identity". (Dated: 2016.) — [Econsultancy](https://econsultancy.com/the-financial-times-finds-unexpected-social-success-on-instagram/)
- Digiday reported a later rise from ~286k to ~515k. The FT data-vis team used D3 to make one graphic in several versions for print, web and social. — [Digiday](https://digiday.com/?p=257686); [Digiday, FT guide to data visualization](https://digiday.com/uk/financial-times-guide-data-visualization/)
- The FT Visual Vocabulary sorts charts into nine relationships: deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial and flow. Its rules include:
  - columns "Must always start at 0";
  - isotype pictograms use whole numbers only;
  - choropleths show rates, not totals;
  - annotate patterns where points overplot.

  The content is © FT, all rights reserved, so use it as a reference, not a template to copy. — [FT chart-doctor / visual-vocabulary (GitHub)](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary)

**Our World in Data (OWID)**
- OWID learned from X and Instagram that "a clear chart and takeaway is one of the most successful ways our work is shared". This led to **Data Insights**, each with a title carrying the key takeaway, one chart, a short explanatory text, and links to explore further. Each focuses on a single indicator over time or between countries. — [OWID on the EA Forum](https://forum.effectivealtruism.org/posts/JD5jXiq3MedpMxTzi/data-insights-by-our-world-in-data)
- Data Insights launched in March 2024 (search excerpt). OWID's output is Creative Commons and it built its own charting tool (Grapher). — [Datawrapper weekly chart on OWID](https://datawrapper.de/blog/weekly-chart-ourworldindata)

**Datawrapper (Data Vis Dispatch publisher; text rules)**
- Datawrapper's text rules for charts:
  - The title leads with the main message in everyday words; no "median" in titles.
  - Precision moves to the description or notes.
  - "Small, thin, and gray text" is for less important information.
  - Remove the colour key and label categories directly.
  - Use compact numbers (20k, 20m) and drop trailing zeros.
  - Annotate design elements that need explaining, outliers and surprising values.
  - Use only "two levels of hierarchy that are clearly different" for labels and annotations.
  - Left-align text, avoid rotated axis labels, and outline text in the background colour where it crosses gridlines.
  - Default readable text is sans-serif, regular weight, sentence case, larger than 12 px and nearly black.

  — [Datawrapper, "Text in data visualizations"](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper went mobile-first because smartphone readership outgrew desktop for most media outlets. — [Datawrapper blog](https://www.datawrapper.de/blog/datawrapper-becomes-mobile-first-charting-tool)

**Chartr (now part of Sherwood Media / Robinhood)**
- Chartr, a UK data-driven newsletter, was acquired by Sherwood Media, a Robinhood subsidiary. One reader noticed a Sherwood chart that looked familiar in format but carried a different logo, i.e. the format survived the rebrand. — [FlowingData](https://flowingdata.com/2024/04/16/chartr-was-acquired-by-sherwood-media/)
- Chartr's "bite-sized visuals have outsized value in a world of boring stock images". It ties issues to themed occasions, makes ads mirror the editorial look, and turns content into games (trivia). — [Newsletter Examples](https://www.newsletterexamples.co/p/how-chartr-reimagined-visual-storytelling)

**Visual Capitalist / Voronoi**
- Voronoi presents itself as "the world's first mobile media platform focused on facts, not opinions", with every visual tied to its data and sources. Visual Capitalist reported 1M in-app views within weeks of launch. — [App Store listing](https://apps.apple.com/ph/app/id6447905904); [Visual Capitalist](https://www.visualcapitalist.com/visual-capitalist-new-app-voronoi/)
- Its creator programme pays US$500 per published visual, plus US$500 for Editor's Choice. Whether this applies to Voronoi is unclear. — [Visual Capitalist creator program](https://www.visualcapitalist.com/creator-program-gathering-visual-talent-world/)

**The Pudding**
- The Pudding makes "visual essays" that emphasise data visualisation with fewer words than conventional journalism. It is a small collective of journalist-engineers. — [Wikipedia](https://en.wikipedia.org/wiki/The_Pudding); [Pudding FAQ](https://pudding.cool/faq/)
- Kontinentalist moved its Instagram feed from illustrations to repackaged data visualisations after studying The Pudding and Gabrielle Mérite. Before that it had believed data visualisations were "too unattractive for the platform". (The rest of the article is paywalled.) — [Kontinentalist / Kawan](https://kawan.kontinentalist.com/designing-data-visualisations-for-social-media/)

**Bloomberg, Reuters**
- Bloomberg grew its Instagram following ~391% in a year (dated), and its senior social editor attributed much of it to visuals that quickly capture key business shifts. — [Social Media Today](https://www.socialmediatoday.com/news/5-instagram-strategy-tips-from-bloomberg/548175/)
- Bloomberg Graphics has ~20 people across four cities. Reuters Graphics focuses on stories "where the visual aspects are essential to the understanding". — [Digiday](https://digiday.com/media/bloomberg-graphics-team/); [Design Week](https://www.designweek.co.uk/issues/27-january-2-february-2020/in-house-teams-how-reuters-graphics-visualises-catastrophic-world-events/)

**Information is Beautiful**
- McCandless frames his work as "information design" with statistical rigour. Reviewers note his fresh combinations of datasets, minimal words, and refined use of colour and shape. These are secondary descriptions only. — [TED](https://www.ted.com/talks/david_mccandless_the_beauty_of_data_visualization); [Ulster University review](https://blogs.ulster.ac.uk/emmg/2021/04/23/ixd104-literature-review-knowledge-is-beautiful-david-mccandless/)

**Spotify Wrapped (2025)**
- 2024's "techy, glitchy" Wrapped was criticised as "AI slop". 2025 drew on mixtapes, burned CDs and scrapbooks, with cutouts, doodles and textures for a handmade DIY feel. The palette was **mostly black and white, with colour reserved for artist images and album covers**. Payman Kassaie: while other brands look to AI, "we did the opposite". — [Fast Company (mirror)](https://fastcompanyme.com/?p=46098)
- Spotify calls it a "visual mixtape" for 700M+ fans. The creative director (Jeremy Wirth) describes a tension between "chaos and clarity", a stripped-down look, a restrained palette and bold images (search excerpt). — [Spotify Newsroom](https://newsroom.spotify.com/tag/jeremy-wirth/); [Marketech APAC](https://marketech-apac.com/spotify-turns-2025-wrapped-into-a-worldwide-visual-mixtape/)
- Wrapped 2025 had 200M+ engaged users in its first 24 h. — [TechCrunch](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day)
- Marc Hazan: "This year, we focused on Wrapped feeling more human than ever, and that started with the design" (search excerpt). — [DesignRush](https://news.designrush.com/spotify-wrapped-2025-first-tv-ad-after-ai-backlash)

**Strava Year in Sport (Manual's system)**
- Manual built a deliberately simple system:
  - **Vocabulary:** lines, dots, colour strips, circles and typography, simple enough to animate.
  - **Colour:** taken from athletes' apparel and race-bib strips, then toned down with navy and olive.
  - **Data as the hero:** design "organically growing from the facts and figures".
  - **Narrative chapters:** an opening (days active, top sports, total time); a middle of "hard-won efforts" (distance, longest activity, pace); a climax of "mountains conquered" (elevation); and a finale (achievements and photos).
  - **Format:** a Stories-like carousel lasting about 3 minutes, in 11 languages, animated in Lottie.
  - **Range:** it had to work for users with 3 activities and with 366.

  The It's Nice That fetch labels this the 2020 edition; a search summary called it 2021. — [It's Nice That](https://www.itsnicethat.com/articles/manual-strava-year-in-sport-graphic-design-150321)
- Strava's 2025 Year in Sport launched 4 Dec 2025 behind the subscription paywall (search excerpt). — [Ars Technica via Harvard TagTeam](https://tagteam.harvard.edu/hub_feeds/3415/feed_items/17132945/content)

**Letterboxd, NYT Games, Duolingo, Chess.com**
- Letterboxd's Year in Review, built with Cactuslab, used a scrolling format with inline video and large imagery (search excerpt). A 2023 recap describes a "cute layout" using the app's signature orange, green and blue circles (search excerpt; attribution not confirmed). — [Cactuslab](https://cactuslab.com/work/letterboxd-year-in-review); [The Bubble](https://www.thebubble.org.uk/?p=52347)
- NYT Connections' shareable colour-coded results were modelled on Wordle's. One review said it lacks the instant recognition of Wordle's grid, i.e. the coloured-square grid became a brand asset. — [KRDO/AP](https://krdo.com/news/2023/08/28/move-over-wordle-the-new-york-times-might-have-found-its-next-hit-game/)
- Duolingo's brand-guidelines site now redirects to a blog hub with no extractable rules. — [Duolingo design hub](https://blog.duolingo.com/hub/design/)
- No source was found for Chess.com.

### Inferences

**Cross-cutting kit** (what to steal; each item maps to a cited pattern above):
1. **Takeaway title, topic in the subtitle.** OWID's Data Insights and Datawrapper's text rules: "Most 500-piece solves stop just short of an hour", not "500-piece solve-time distribution".
2. **One highlight hue against grey or neutral context.** Economist, Spotify 2025 (colour reserved for the album art), Strava (bib colours toned down). For MSP the highlight is coral, the context is light grey or navy.
3. **A fixed brand device in a fixed place.** The Economist's red rectangle; the Chartr format surviving its rebrand. MSP needs one device that appears on every slide at the same coordinates. Candidates: a small coral "tab" (a puzzle-piece knob shape) at top-left; or a stopwatch-ring progress mark; or a piece-count corner badge.
4. **One chart per slide, one idea per post.** OWID; Chartr's "bite-sized" visuals.
5. **Chaptered arc for multi-slide posts.** Strava: opening → effort → climax → celebration. Mapped to a carousel: cover hook → reveal → context → takeaway/CTA.
6. **Editorial annotation over legends.** Datawrapper; the FT's "annotate patterns".
7. **Social-specific variants, not shrunken print.** The FT's black-background social versions; Kontinentalist's repackaging. Charts must be redesigned for the phone, not exported from the website.
8. **Human, analog warmth is a 2025–26 counter-trend to AI gloss.** Spotify 2025. This matters for an AI-wary hobby, and it supports MSP's code-drawn and tactile directions.

**Reference matrix** ("Unverified" marks visual traits I recall but could not re-check this session):

| Reference | Recognition device | Transferable rule for MSP | Evidence |
|---|---|---|---|
| The Economist | Red rectangle top-left; left-aligned title and subtitle; muted palette | Fixed brand mark; takeaway titles; grey context plus one hue | Secondary sources. Exact fonts, hexes and right-side y-axis labels **unverified** |
| FT | Social variants on a dark ground; "chart porn" works even on dry topics | Don't avoid "unsexy" charts; make social-specific versions | Econsultancy and Digiday (2016–18, dated) |
| OWID | Title = takeaway; one indicator; huge chart library | The "Data Insight" template as MSP's default single-image post | OWID's own post |
| Chartr / Sherwood | Bite-sized, colourful, logo'd charts; games | Quiz and "guess the number" posts; themed days | Thin. Visual specifics **unverified** |
| Visual Capitalist / Voronoi | Every visual tied to sources | A source line on every chart | App Store and VC posts. Visual specifics **unverified** |
| Spotify Wrapped 2025 | B/W base, colour only on content, analog collage | Restraint; texture as warmth; colour reserved for meaning | Fast Company, Spotify |
| Strava YIS | Lines, dots, strips, circles; chapters | Small mark vocabulary; chapter pacing for Stories and Reels | It's Nice That |
| Datawrapper | Text hierarchy rules | Lint rules (two label levels, direct labels) | Primary |
| NYT Wordle / Connections | Coloured unit-grid share image | A unit grid as an ownable, shareable format | AP via KRDO |

### Gaps
- The official Economist chart style guide (PDF), Economist and FT typefaces, exact hex palettes, and the Economist's Instagram cover pattern could not be fetched or verified.
- No primary source was found describing the Instagram-specific design systems of Chartr, Visual Capitalist/Voronoi, Statista, Bloomberg, Reuters, Information is Beautiful, Duolingo, Letterboxd or Chess.com (type scale, margins, cover template). Their visual traits are not asserted here.
- Datawrapper's Data Vis Dispatch was not reviewed this session.
- No 2025–26 follower or engagement data for these accounts was found; the FT and Bloomberg Instagram figures are from 2016–2019.
- The 2025 Strava design system was not found; only the Manual-era system is documented.

---

## 2. Puzzle-specific visual language (pieces, counts, boxes, mats, timers, textures)

### Takeaway
The puzzle brands that feel premium treat **the box as an art object and a collection item**, and use bold, confident type and colour. They do not decorate everything with jigsaw shapes. For data, Isotype's rules turn the jigsaw piece into a legitimate **unit mark**, and MSP already owns correct, code-generated piece geometry. A piece should therefore appear only when it carries meaning: a unit, the "last piece", or a piece-count badge. It should never be filler.

### Cited Findings
- **Piecework Puzzles.** Its identity was made by the founders' own agency, Major Studio, and its boxes use Canela Thin (Commercial Type). Packaging was designed to look like an art book, with titles running down the spine so the puzzles display "like a growing collection on a shelf". Co-founder Jena Wolfe: "We knew right away we wanted this to be super bold, colorful, and maximalist, with competing, cool colors." — [Fonts In Use](https://fontsinuse.com/uses/32347/piecework-puzzles); [Shopify](https://www.shopify.com/uk/blog/piecework-puzzles-build-an-empire-with-a-day-job)
- **The pandemic-era "design-y puzzle"** (Jiggy, Whiled, Piecework, Ordinary Habit, Puzz):
  - storybook-style packaging that doubles as decor;
  - warm yellows, reds and greens replacing beige DTC minimalism;
  - Ordinary Habit's "branding is as considered as the puzzle art", with bold geometric illustration;
  - Jiggy's 20+ artist collaborations, sold as "frame-able".

  — [AIGA Eye on Design](https://eyeondesign.aiga.org/how-the-design-y-puzzle-came-to-rule-the-pandemic/)
- **Le Puzz** (branding by Little Troop): "Bold typography, punchy illustrations, witty copy, glowing yellow, and photography". It draws on vintage jigsaw tropes (pet portraits, food spreads) and Walter Wick's *I Spy*-style books. — [PRINT](https://www.printmag.com/branding-identity-design/le-puzz-injects-vintage-jigsaw-tropes-into-their-thoroughly-modern-brand-and-weve-got-the-puzzle-bug-bad/)
- Fuzzco's "Different Puzzles" brand case study exists but was not reviewed. — [Fuzzco](https://fuzzco.com/work/different-puzzles)
- **Isotype rules that apply to piece-unit charts:**
  - "The symbol may not denote more than is necessary".
  - Layered reading: "At the first look you see the most important points; at the second, the less important points".
  - A fixed unit value per icon, with icons grouped (e.g. in fours) for counting.
  - Raise the unit value when there are too many icons (Neurath went from 10,000 to 25,000 per icon).

  Caveats: Trogu found that counting pictogram rows is less effective than reading an arabic numeral, and an axis with numeric labels improves such charts. A 2015 study (Haroz, Kosara, Franconeri) found Isotype-style charts effective. — [Eagereyes](https://eagereyes.org/papers/isotype-visualization); [SFSU, Trogu](https://design.sfsu.edu/archive/node/1041.html); [Harvard TagTeam summary of the ISOTYPE paper](https://tagteam.harvard.edu/hub_feeds/1977/feed_items/2100768/content)
- **Choosing icons** (Gregor Aisch, Datawrapper co-founder):
  - choose an icon that depicts the actual thing ("why not … a drunk student instead of a meaningless circle?");
  - group icons in clear blocks; squarified arrangements read better than long rows;
  - "if authors must write out the values, the pictograph is likely poor";
  - pictographs suit explanation, while bars suit precise comparison.

  — [vis4.net](http://www.vis4.net/blog/choose-your-icons-wisely/)
- The FT Visual Vocabulary: isotype charts should use whole numbers only. — [FT visual-vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary)
- **MSP's own assets and lessons:**
  - The logo is a stopwatch merged with a jigsaw piece, with ~2 px navy (#2b3445) outlines, soft washes and speed lines. — [MSP design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md)
  - The badge generator draws all art in Python and shapely and rasterises with `rsvg-convert` ("no AI, no GPU and no network"). It has a QA gate and a 48 px contact sheet, and also builds the "last-piece reveal" geometry. — [MSP badge-art README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md)
  - The badge lab's verdict: "Wrong pieces are worse than no piece". AI models could not draw correct jigsaw pieces. — [Round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md) (local, in this repo)

### Inferences
**Tasteful (do):**
- **Piece as a unit mark.** 1 piece = 1 unit (e.g. 1 piece = 1% of solves, or = 1,000 solves). Pieces are cut from **one tessellating grid**, so a filled area is literally a partly-assembled puzzle. Always print the total as a number, and use whole units only (FT, Trogu, Aisch).
- **The grid of pieces as the chart frame.** A 10×10 cut grid (100 pieces) as a waffle chart where *n* pieces are "placed" (coloured, navy-outlined) and the rest are blank outlines. This is ownable, like Wordle's grid, and generated by the existing `jigsaw_piece()` helper.
- **The "last piece" as a narrative device.** A cover where one piece is missing, and the reveal slide drops it in (a static pair, or animated in Reels). It reuses the badge-art last-piece reveal geometry.
- **Piece count as typography.** A box-corner badge "500" / "1000" in Rubik Bold inside a rounded rectangle. It mirrors real box conventions and the site's piece-count filter chips. It is a series marker, not decoration.
- **Box spine and shelf.** Borrowed from Piecework: a vertical spine strip with series name and issue number, so the profile grid reads as a shelf of boxes.
- **Stopwatch ring as a progress or time encoding.** A 60-minute dial for solve times, so "the 59-minute wall" is shown on a clock face where the needle stops just short of 12. Use it only when the data is time.
- **Mat and sorting-tray layouts as small-multiple containers.** Rounded tray cells hold a mini-chart or number each (edge pieces / colours / sky…). The metaphor organises content and does not add ornament.

**Kitsch (don't):**
- Clip-art piece icons used as bullets.
- "Teamwork" hands joining pieces (stock metaphor).
- 3D glossy or bevelled pieces.
- Jigsaw-cut overlay filters on photos.
- Pieces with wrong anatomy: knobs that don't interlock, or irregular counts that can't tessellate.
- AI-drawn puzzle art or finished-puzzle scenes.
- Faux-wood or cork photo backgrounds.
- More than one piece motif per slide.

**Texture:** tactile paper or cardboard should be code-generated (SVG noise or grain at very low opacity) or a single owned, scanned texture. Never AI or stock photos. Spotify 2025 shows texture reads as "human" when the palette stays restrained.

**Box art is licensed IP.** For "puzzle of the month" posts, prefer typographic treatments (title, brand, piece count, palette swatches extracted from the box image) over reproducing the box art. This is a legal inference; MSP's rights over manufacturer images were not checked.

### Gaps
- No design-critique source was found that compares tasteful and kitsch jigsaw motifs in data graphics specifically. The do/don't list is inference from Isotype principles, the puzzle-brand articles and MSP's own lab results.
- No references were found for puzzle-mat or sorting-tray aesthetics in brand design.
- Speed-puzzling competition graphics (e.g. WJPC broadcast overlays) were not researched.
- Ordinary Habit's and Jiggy's own sites and Instagram grids were not reviewed directly.

---

## 3. Anti-slop rules: what reads as cheap vs premium

### Takeaway
"Slop" is recognised by **default-looking surfaces**:
- purple/indigo gradients, glassmorphism, blurred blobs and generic icons;
- glossy, glitchy AI aesthetics;
- uneven spacing, centre-everything layouts and clutter;
- emoji overload.

Premium is recognised by **restraint plus specificity**: real data with a source, one idea per slide, a strict hierarchy of 2–3 text levels, a single highlight colour, consistent margins, and a distinctive device the brand owns. MSP's own owner decisions already encode several anti-slop rules (no gloss arcs, no sparkle stars, same-hue washes).

### Cited Findings
- "AI slop" spread as a pejorative from 2024 for content made with default settings. Part of the backlash is nostalgia for amateur, vernacular design, which reads as more authentic. — [NSS Magazine](https://www.nssmag.com/en/lifestyle/47059/slop-ai-visual-design)
- Recurring tells listed by a design-tool vendor (biased source): inconsistent spacing, over-polished typography, cluttered visuals, and the same banner and boxed-layout treatments reused across unrelated designs. — [Venngage](https://venngage.com/blog/ai-slop-in-design/)
- A practitioner "no-slop" checklist flags the "AI-startup look": purple/indigo/violet gradients, gradient-filled headlines, glassmorphism, blurred colour blobs, isometric blob-people illustrations, and centred-everything layouts (practitioner advice, not research). — [Claude Marketers, no-slop-design skill](https://www.claudemarketers.com/skills/no-slop-design)
- Spotify's 2024 "techy, glitchy" Wrapped was criticised as AI slop. The 2025 fix was a mostly black-and-white palette, colour only on real content, and handmade textures. — [Fast Company (mirror)](https://fastcompanyme.com/?p=46098)
- Restraint rules from data journalism:
  - one highlight against muted tones (Economist, per [The Data School](https://www.thedataschool.co.uk/johann-shin/visual-storytelling-done-right-5-lessons-from-the-economist));
  - "start by making all text small, thin, and gray. Then emphasize only what readers must not miss", with only two clearly different label levels ([Datawrapper](https://www.datawrapper.de/blog/text-in-data-visualizations));
  - one chart, one takeaway ([OWID](https://forum.effectivealtruism.org/posts/JD5jXiq3MedpMxTzi/data-insights-by-our-world-in-data)).
- MSP owner decisions already on record:
  - "**No white gloss arcs** on any base, tier or one-off";
  - the top tier "has **no sparkle stars**";
  - bases keep "only the soft same-hue wash".

  — [MSP badge-art README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md)
- MSP's brand definition: "Not gradient-heavy or neon (colors are soft and muted)", "Not childish despite the playful subject", "Light and airy … never dark or heavy". — [MSP design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md)
- The owner rejected the XP share card ("I do not like it"). It was a pre-made background image with Rubik text drawn on top, and its puzzle pieces were blurry and wrong. — [Round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md); task brief

### Inferences
**Anti-slop rules for MSP** (each one is testable; see §5 for the lint versions):
1. **No gradients** except a same-hue wash with ≤ ~8 L* difference (inherited from the badges). Never a multi-hue gradient, never gradient text. Note that MSP's indigo #4e54c8 sits right in the "indigo gradient" slop zone, so indigo is used **flat only**.
2. **No glass, blur, glow or drop-shadow stacks.** No `backdrop-filter`, no outer glows, at most one hairline shadow token. The site's frosted navbar does not transfer to social.
3. **No generic icon sets.** Use MSP badge icons, the code-drawn piece or stopwatch, or nothing.
4. **No emoji in rendered graphics.** Country flags are drawn as SVG (emoji flags render differently per platform and look templated). Captions get at most one or two emoji.
5. **One idea per slide**, at most one highlight hue per chart, and at most three brand hues per slide.
6. **Real numbers with real precision.** Every chart slide carries a source line ("MySpeedPuzzling data, 545,000 solves, Jan 2020–Sep 2026"). Visual Capitalist and Voronoi make "every visual tied to its data and sources" part of their positioning.
7. **The rhythm is the brand.** Identical margins, title position and brand-device coordinates on every slide. Inconsistency is the top-cited slop tell.
8. **Puzzle pieces only from the approved geometry function.** Never raster, never AI.
9. **Human copy.** Specific, witty, puzzler vocabulary ("edge-first", "the sky section") rather than generic hype words. (Inferred from Le Puzz's "witty copy" and Chartr's themed days.)

### Gaps
- No peer-reviewed study defines "AI slop" visual traits. The sources are trade press, vendor and practitioner material.
- No data was found on whether Instagram audiences engage less with gradient or glassmorphic graphics. The anti-slop rules rest on brand and taste evidence, not on engagement A/B data.

---

## 4. Grid-level consistency and the 3:4 crop

### Takeaway
Instagram has shown profile-grid thumbnails at **3:4 since January 2025**, so 1080×1350 (4:5) posts lose about **34 px on each side** in the grid. Keep all key content within x = 34–1046, and in practice inside a ~88 px margin. Cohesion comes from **fixed structure** (margins, title slot, brand device, series markers) while **ground colour and chart form rotate**. Variety lives in content and form, sameness in structure.

### Cited Findings
- The profile grid moved from square to **3:4 (1080×1440)** in January 2025. — [Neal Schaffer](https://nealschaffer.com/instagram-post-size/)
- The grid preview of a 1080×1350 post is about **1012.5×1350**, so the trim is on the sides. — [Stellar Digital](https://stellardigital.com.au/instagram-size-guide-2025/); contradicted by [Inro](https://www.inro.social/blog/instagram-post-size), which says the trim is top and bottom (see the inference below)
- Instagram lets users adjust a post's grid preview by zooming, cropping or adding borders; a 3:4 upload avoids the crop but takes less feed space. — [Planoly](https://planoly.com/blog/guide-to-instagrams-new-vertical-grid)
- Piecework's spine typography turns products into "a growing collection on a shelf", a physical precedent for a series-marker system. — [Shopify](https://www.shopify.com/uk/blog/piecework-puzzles-build-an-empire-with-a-day-job)
- A fixed brand mark (the Economist's red rectangle) and consistent fonts and layouts make a graphic "recognisable as an Economist chart". — [Trafford Data Lab excerpt](https://medium.com/@traffordDataLab/developing-a-data-visualisation-style-cd24f88fa59); [The Data School](https://www.thedataschool.co.uk/johann-shin/visual-storytelling-done-right-5-lessons-from-the-economist)
- **Story and Reel safe zones** (third-party, and they disagree):
  - Stories: ~250 px top and bottom plus 65 px sides, per one guide; 270 px top / 380 px bottom with 35 px sides, per another.
  - Meta ads guidance is cited as ~14% (250 px) top and 20% (340 px) bottom kept free of text.
  - Reels bottom "danger zone": 450 px (23.4%) in one source, up to 35% (670 px) in another. A third gives 108 px top, 320 px bottom, 60 px left and 120 px right.

  — [House of Marketers](https://houseofmarketers.com/guide-to-safe-zones-tiktok-facebook-instagram-stories-reels/); [MakeTechEasier](https://maketecheasier.com/instagram-story-reel-safe-zone); [First Pier](https://www.firstpier.com/resources/instagram-ad-safe-zones); [AdKit](https://adkit.so/tools/safe-zones/instagram)

### Inferences
- **Geometry check.** A 4:5 image (aspect 0.80) is wider than a 3:4 cell (0.75), so a centre-crop fit keeps 1350 × 0.75 = 1012.5 px of the width and trims ~33.75 px per side. This agrees with Stellar Digital and contradicts Inro's "top/bottom".
- **Feed rule.** Treat x < 34 and x > 1046 as bleed only (background, texture). Put text and data within x = 88–992, which leaves an extra 54 px of breathing room inside the grid-safe band and gives a content width of 904 px.
- **Story/Reel rule** (the conservative union of the sources):
  - Stories: key content in y = 270–1540 and x = 65–1015.
  - Reels covers and frames: key content in y = 220–1250 and x = 60–960, keeping clear of the right-hand action rail.
- **Cohesion system:**
  - **Fixed every post:** the outer margin, title baseline, brand-device position (e.g. top-left coral tab at x = 88, y = 88), source-line position, and Rubik as the only family (unless a direction explicitly tests a second face).
  - **Rotates by pillar:** the ground colour. For example, white for data posts, navy for records and competitions, warm paper for community and quiz, and coral as an accent ground only for milestones (coral is not a text ground; see §6).
  - **Series marker:** a spine or corner tag with the series name and issue number ("WALLS #3", "COUNTRY CUP #12"). It makes the grid read as a shelf of collected boxes.
  - **Anti-sameness:** alternate chart form across adjacent posts (hero number → histogram → unit grid → ranked list). Never place two posts with the same ground colour and the same chart type side by side.
- **QA.** The renderer should output a **3×4 grid mock** (the new post plus the last 11 posts, each center-cropped to 3:4 and downscaled to ~360 px wide) for approval. This catches grid-level sameness and clashes that single-post review misses.

### Gaps
- I found no authoritative source (Instagram documentation) confirming the crop behaviour or the default anchor of the 3:4 thumbnail, nor official Meta numbers for organic Story or Reel safe zones. The figures above are third-party and should be verified on device.
- No source was found documenting how specific data accounts (Chartr, Visual Capitalist, OWID) structure their grid colour rotation.

---

## 5. Design-system-as-code for social (tokens, grid, type, chart theme, components, LLM codification)

### Takeaway
Treat the social look like MSP treated badges:
- a **token file**;
- a small **component library** (HTML/SVG partials taking JSON props);
- an automated **QA gate** that measures the rendered DOM and pixels;
- **golden reference renders** the owner has approved, used both as regression tests and as few-shot examples for Claude.

The LLM chooses *data, copy and component*; it should never author free-form layout.

### Cited Findings
- **MSP's badge art is the in-house precedent.** Everything is generated from code, gated by `qa.py` ("must say PASS"), and reviewed as a 48 px contact sheet. Owner decisions are written down as numbered rules. In the lab's cold-start test, a fresh session added two badges that passed the gate on the first draft. — [MSP badge-art README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md); [Round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md)
- **The round-1 pipeline:**
  - Playwright Chromium renders HTML/CSS/SVG templates to exact-size JPEGs.
  - Charts are built with Observable Plot or D3 as inline SVG.
  - Rubik with `tabular-nums lining-nums`.
  - Remotion for motion.
  - Satori was rejected as "not a complete CSS implementation".

  — [Round-1 report](../../reports/MSP%20Instagram%20content%20pipeline.md)
- The FT reused one D3 graphic across print, web and social versions, and the social team reuses Visual Vocabulary templates. — [Digiday](https://digiday.com/uk/financial-times-guide-data-visualization/); [Zoomata](https://zoomata.com/archive/data-visualization-workflows-financial-times/)
- **Rubik's OpenType tables** (computed from `assets/fonts/Rubik/Rubik-Bold.ttf` in the MSP repo):
  - default digits are **proportional**: advance widths vary from 497 (the "1") to 683 units;
  - the font has `tnum`, `pnum`, `zero`, `frac`, `case`, `sups`/`sinf` and `ordn`;
  - it has U+2212 (minus) and U+00D7 (×) but **no U+2009 thin space**.

  — local inspection
- MSP's site type scale is H1 40 px down to 12 px, with Rubik weights 300/400/500/700 (the repo also contains Light to Black TTFs). — [MSP design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md)

### Inferences

**Token set (proposal, v0):**
```
canvas.feed     = 1080×1350; gridSafe.x = [34, 1046]; margin = 88; contentWidth = 904
canvas.story    = 1080×1920; safe = {top: 270, bottom: 380, side: 65}
canvas.reel     = 1080×1920; safe = {top: 220, bottom: 670, left: 60, right: 120}
grid.columns    = 6; gutter = 32; column = 124        // 6×124 + 5×32 = 904
space.unit      = 8; steps = 8,16,24,32,48,64,88,128
type.family     = Rubik; numerals = "tnum" on all data; "case" on all-caps tags
type.scale (canvas px, ~1.25 ratio):
  source 30 · label 36 · body 44 · lead 56 · title 72–92 · display 144–180 · hero 240–360
type.weights    = 400 body/labels, 500 titles, 700 numbers, 800–900 hero only
colour.ink      = #2b3445 (navy; text and outlines)   colour.ink2 = #4b566b (secondary text)
colour.mute     = #7d879c (source line on white only; 3.61:1)
colour.highlight= #EC726F (coral; marks/fills only, never text on light grounds)
colour.accent   = #4e54c8 (indigo; text-safe 6.13:1, flat only)
colour.cool     = #69b3fe (sky; fills on light, or text on navy only)
colour.context  = #dae1e7 / #e3e9ef (grey context marks; L* ≈ 88–92)
colour.ground   = #ffffff | #f6f9fc | #2b3445 | paper (to be tested)
stroke.ink      = 3 px navy at 1080 width (≈ the logo's ~2 px at the site scale; to be tuned in the lab)
radius          = 12 (cards) · 6 (chips) · 0–4 (bars)
```
The scale's arithmetic: 0.364 is the canvas-to-screen factor (§6). Labels at 36 px canvas ≈ 13 CSS px on a 393-pt-wide phone; the 30 px source line ≈ 11 CSS px.

**Chart theme spec:**
- **Axes:** horizontal gridlines only, 2 px #e3e9ef. A baseline of 3 px navy. No y-axis line. Axis labels 36 px #4b566b, horizontal only (Datawrapper).
- **Marks:** context in light grey, one highlight in coral or indigo. Every highlighted mark is directly labelled with a 36–44 px value in **tabular numerals**. No legends unless there are more than 2 series.
- **Bars:** start at zero (FT). Ranked lists run horizontally, so labels never rotate.
- **Annotation:** at most 2 per chart, 36 px, navy, joined to the mark by a 2 px navy leader line. Text gets a background-colour halo where it crosses gridlines (Datawrapper).
- **Numbers:** compact formats (545k, 275M; Datawrapper). Thousands separated with commas, because Rubik lacks a thin space. Minus signs use U+2212.
- **Maps:** prefer a ranked list or a tile grid for 84 countries. A choropleth only for rates (per-capita solvers), never totals (FT).

**Component library** (each component is an HTML partial plus a JSON schema plus a golden render):
1. `cover`: a takeaway headline, a teaser visual, the series marker and the brand device.
2. `hero-number`: one number (display or hero size) with a context line and a source.
3. `histogram`: binned distribution with one annotated threshold (the "59-minute wall").
4. `ranked-list` / leaderboard: up to 10 rows, flag chip, name or country, tabular time, a bar.
5. `unit-grid`: a piece waffle on a 10×10 tessellating grid, with *n* placed.
6. `versus`: two big numbers with a shared baseline bar.
7. `timeline` / `line`: one series, highlighted end-point label.
8. `calendar-heat`: day-of-week × hour, for "Sunday is puzzle day".
9. `dial`: a 60-minute stopwatch ring for single times or medians.
10. `quote-card`: a community quote, used only with consent.
11. `quiz-card`: a question slide plus a reveal slide (Chartr-style games).
12. `badge-card`: badge SVG with its tier and the share of players holding it.
13. `cta`: "Find your stats → myspeedpuzzling.com" with the logo.

**Codifying it for an LLM:**
- (a) **Style bible**, `STYLE.md`: the numbered owner decisions, as in the badge README, with do/don't pairs and reasons.
- (b) **Claude may only pick** `{component, props, copy}` and output JSON validated against a schema. CSS lives in the library, never in generated output.
- (c) **The QA gate** runs in Playwright on the rendered DOM and image:
  - every text node ≥ 30 px; chart labels ≥ 36 px;
  - every text bounding box inside its safe area;
  - WCAG contrast computed per text node against the actual ground (§6 thresholds);
  - ≤ 1 highlight hue per chart and ≤ 3 brand hues per slide;
  - word count ≤ 20 on covers and ≤ 45 on chart slides (starting values to tune);
  - `font-variant-numeric: tabular-nums` set on every numeric node;
  - `document.fonts.check('700 40px Rubik')` true and no fallback-font glyphs;
  - no emoji code points;
  - no `backdrop-filter`, `filter: blur`, multi-stop gradients or text gradients in the computed styles;
  - the brand device at its exact coordinates;
  - a source line present on chart slides;
  - bars start at zero.
- (d) **Golden renders:** an owner-approved JPEG per component and direction. Visual-regression diffs catch drift; the same goldens go into the skill prompt as reference images.
- (e) **Grid mock and contact sheet** at thumbnail size, mirroring the 48 px badge sheet.

### Gaps
- No public design system for social data accounts was found to benchmark the token values. The values above are reasoned from MSP's tokens, Datawrapper's text rules and phone-scale arithmetic, and need the lab to tune them.
- I did not verify which OpenType features Chromium applies by default to Rubik in Playwright renders; this should be tested.

---

## 6. Mobile legibility and accessibility

### Takeaway
A 1080-px canvas is shown at roughly 375–430 CSS px wide on phones (×0.35–0.40), so canvas text needs to be about **2.75× the size you would use on the web**:
- **≥ 36 px** for labels;
- **≥ 30 px** only for source lines;
- **≥ 44 px** for body text.

MSP's coral fails WCAG text contrast on white (**2.92:1**) and white-on-coral fails too. Coral is therefore a **fill and highlight colour, not a text colour**, and navy outlines (the house ink) give coral marks the edge contrast they lack. For colour-blind safety, **coral vs green collapses** under deuteranopia, while **coral vs indigo stays robust** under every CVD type.

### Cited Findings
- **WCAG 2.2 contrast:** text needs 4.5:1, and large text 3:1 (large = 18 pt, or 14 pt bold). Non-text graphics needed to understand content need 3:1 against adjacent colours. — [W3C, Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [W3C, Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Datawrapper's readable default:** text larger than 12 px and nearly black. On mobile, hide the least important annotations or move them below the chart rather than shrink text. — [Datawrapper](https://www.datawrapper.de/blog/text-in-data-visualizations)
- **Datawrapper's colour-blind guidance:** the main fix is to **vary brightness**. Typical trouble pairs are equally bright red/green, orange/green, yellow/pink and blue/green. Also use non-colour cues (labels, symbols, patterns). — [Datawrapper colour-blind check](https://www.datawrapper.de/blog/colorblind-check); [Datawrapper colour-blindness part 2](https://www.datawrapper.de/blog/colorblindness-part2)
- The Economist Impact team flagged accessibility problems from subtle colour differences in its own palette. — [Nightingale](https://nightingaledvs.com/topics-in-dv/data-journalism)
- Test charts on a phone, not a laptop (practitioner advice). — [Stephanie Evergreen](https://stephanieevergreen.com/data-viz-for-social-media/)
- **MSP palette contrast ratios** (computed, WCAG formula):

| Colour | on white | on #f6f9fc | on navy #2b3445 |
|---|---|---|---|
| coral #EC726F | **2.92** | 2.76 | 4.29 |
| coral #fe696a | 2.82 | 2.67 | 4.43 |
| indigo #4e54c8 | **6.13** | 5.80 | 2.04 |
| sky #69b3fe | 2.22 | 2.10 | **5.64** |
| navy #2b3445 | **12.50** | 11.83 | — |
| gray-700 #4b566b | 7.39 | 6.99 | 1.69 |
| gray-600 #7d879c | 3.61 | 3.42 | 3.46 |
| green #42d697 | 1.86 | 1.76 | 6.73 |

  White text on coral: 2.92. Navy text on coral: 4.29.
- **Colour-vision-deficiency separation** (computed, CIE76 ΔE, Machado 2009 at full severity; normal / protan / deutan / tritan):
  - coral–green: 101 / **27** / **16** / 113 (collapses for red-green CVD);
  - coral–indigo: 89 / 76 / 96 / 93 (robust);
  - coral–sky: 84 / 58 / 76 / 107 (robust);
  - indigo–sky: 48 / 36 / 33 / 35 (moderate);
  - sky–green: 83 / 68 / 64 / **16** (collapses for tritan);
  - coral–gray-600: 59 / **27** / 43 / 74, because the two have similar lightness (L* 63 vs 56).

### Inferences
- **Scale arithmetic** (assumes common phone widths of 375–430 CSS px, iPhone 15/16 ≈ 393; device widths not sourced this session):
  - 1 canvas px ≈ 0.35–0.40 CSS px.
  - Datawrapper's 12 px floor → ~31–34 canvas px.
  - WCAG "large text" (24 CSS px regular / 18.67 CSS px bold) → **≈ 66 px regular / ≈ 51 px bold** on the canvas.
- **Floors** for the QA gate:
  - source/credit lines 30 px;
  - axis and data labels 36 px;
  - body 44 px;
  - anything meant to be read from the grid thumbnail (the cover headline) **≥ 88 px**, because the grid shows the post at about 1/3 of feed width.
- **Coral rules:**
  - Coral is never text on white, grey or paper (it fails even the 3:1 large-text bar).
  - Coral marks on light grounds get either a navy outline (house ink) or an adjacent navy label, so the graphic meets the 3:1 non-text bar through the outline.
  - On a navy ground coral can be **large** text (≥ 51 px bold): 4.29 ≥ 3:1.
  - Highlighted text on light grounds uses **indigo** (6.13) or navy.
- **Context grey must differ in lightness from the highlight.** Use light greys (L* ≈ 88–92, e.g. #e3e9ef/#dae1e7) for context marks, not gray-600. This keeps the "one hue vs grey" device working for protanopes.
- **Categorical palette** for at most 3 series: coral, indigo, sky, separated by lightness as well (L* 63 / 41 / 71). Never pair coral and green as opposites (e.g. better/worse, up/down); use coral vs indigo, or add glyphs (▲▼) and labels.
- **Sky** is a fill on light grounds or a text colour on navy only.
- **Alt text:** every chart slide gets alt text stating the takeaway and the key numbers (the round-1 pipeline already drafts alt text).

### Gaps
- No official Instagram statement of the rendered feed width per device was found; the scale factor is an estimate.
- No study was found on minimum legible text size specifically for Instagram images.
- The CVD figures are simulations (Machado 2009 at full severity). They should be spot-checked with a tool such as Datawrapper's checker or Chrome DevTools' vision-deficiency emulation on actual renders.

---

## 7. Visual directions for MSP to test in the design lab (9 directions)

### Takeaway
I propose nine distinct directions, listed below. Each keeps MSP's non-negotiables: Rubik, navy ink, coral as the highlight, code-drawn pieces only, a source line, and the 3:4-safe layout. Each differs in **ground, density, brand device and texture**, so a lab can render the *same* posts in all nine and the owner can choose by feeling, not by description.

1. Scorecard Editorial
2. Poster Numbers
3. Piece Units
4. Box Lid & Shelf
5. Race Clock
6. Puzzle Mat (warm craft)
7. House Illustrated
8. Two-Ink Zine
9. Chapter Recap (Stories/Reels)

### Cited Findings
- The evidence behind each direction is cited in §1–§6. Key anchors:
  - Economist and OWID restraint ([The Data School](https://www.thedataschool.co.uk/johann-shin/visual-storytelling-done-right-5-lessons-from-the-economist); [OWID](https://forum.effectivealtruism.org/posts/JD5jXiq3MedpMxTzi/data-insights-by-our-world-in-data));
  - FT dark social variants ([Econsultancy](https://econsultancy.com/the-financial-times-finds-unexpected-social-success-on-instagram/));
  - Spotify 2025 analog restraint ([Fast Company](https://fastcompanyme.com/?p=46098));
  - Strava chapters and simple mark vocabulary ([It's Nice That](https://www.itsnicethat.com/articles/manual-strava-year-in-sport-graphic-design-150321));
  - Isotype unit rules ([Eagereyes](https://eagereyes.org/papers/isotype-visualization); [vis4](http://www.vis4.net/blog/choose-your-icons-wisely/));
  - Piecework box-as-collection ([Shopify](https://www.shopify.com/uk/blog/piecework-puzzles-build-an-empire-with-a-day-job)) and Le Puzz bold type and yellow ([PRINT](https://www.printmag.com/branding-identity-design/le-puzz-injects-vintage-jigsaw-tropes-into-their-thoroughly-modern-brand-and-weve-got-the-puzzle-bug-bad/));
  - MSP house style and badge tooling ([design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md); [badge-art README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md)).
- MSP's brand principles explicitly say "Light and airy … never dark or heavy" and "no heavy backgrounds". This is in tension with dark-ground directions, which must be tested deliberately, not assumed. — [MSP design-system README](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/docs/design-system/README.md)

### Inferences

**Shared constants for all directions:**
- Rubik; navy #2b3445 as the ink.
- Coral as the single highlight (never text on light grounds), with indigo as the text-safe accent.
- Code-drawn pieces only (badge-art geometry).
- Brand device at x = 88, y = 88.
- Source line bottom-left at 30 px.
- MSP wordmark bottom-right, small.
- Feed content inside x = 88–992.
- **Default stack:** Playwright Chromium → JPEG; Observable Plot or D3 for SVG charts; Python + shapely (badge-art) for piece geometry; Remotion for motion.

---

#### D1. "Scorecard Editorial" (Economist / OWID / Datawrapper lineage)
- **Mood references:** Economist charts (red-tab device, muted context); OWID Data Insights (takeaway title, one chart); Datawrapper text hierarchy.
- **Rules:**
  - **Ground:** white or #f6f9fc.
  - **Brand device:** a 24×64 px coral **knob-tab** (the edge of a puzzle-piece knob) at top-left, the MSP analogue of the red rectangle.
  - **Type:** title 72–84 px, Rubik Medium, navy, left-aligned, max 2 lines, phrased as the takeaway; subtitle 40–44 px, gray-700, with the unit and scope; labels 36 px.
  - **Chart:** context marks light grey, one coral highlight with a navy value label. Horizontal gridlines only; 1–2 annotations with leader lines.
  - **Density:** 1 chart per slide, ≤ 45 words.
- **Post types:** distributions (the 59-minute wall), country comparisons, trends, "Sunday is puzzle day", records context.
- **Risks:** can feel corporate or newspapery and "not a community"; low thumb-stop power on the grid unless the headline is ≥ 88 px. Needs strong copy.
- **Tools:** Playwright plus Observable Plot or D3; easiest to lint.

#### D2. "Poster Numbers" (Chartr-ish boldness × Wrapped 2025 restraint)
- **Mood references:** Spotify Wrapped 2025's restrained palette with colour reserved for content; Chartr's bite-sized bold charts; Le Puzz's bold type and glowing yellow.
- **Rules:**
  - One hero number at 240–360 px, Rubik Bold or Black with tabular numerals, filling about 60% of the width.
  - One context line at 44–56 px and a source line.
  - **Grounds rotate:** navy (coral number OK at 4.29 as large text), white (navy or indigo number), and a coral ground used only behind navy numerals ≥ 51 px bold.
  - At most one small supporting mark: a thin bar, a dial arc or a piece.
  - No chart on the cover; the reveal slide carries the chart.
- **Post types:** carousel covers, milestones (275M pieces, 545k solves), records, "did you know" singles, Story frames, Reel count-ups.
- **Risks:** monotony if every post is a big number; "big number" templates are a common Canva trope. It needs exquisite kerning, tabular numerals and real specificity ("275,412,000", not "275M+").
- **Tools:** Playwright; Remotion for count-up Reels.

#### D3. "Piece Units" (Isotype × jigsaw; the most ownable)
- **Mood references:** Neurath's Isotype rules; Aisch's "choose your icons wisely"; the Wordle/Connections share-grid as a recognisable unit grid; MSP's badge-art geometry and last-piece reveal.
- **Rules:**
  - Units are pieces cut from **one tessellating grid** (10×10 = 100, or 20×25 = 500 to mirror a real 500-piece puzzle).
  - **Filled pieces:** coral or indigo wash with a 3 px navy outline. **Empty pieces:** a 2 px #dae1e7 outline.
  - A fixed unit value stated in a key ("1 piece = 1% of 500-piece solves"); whole units only.
  - The total is always also printed as a number (Trogu, Aisch). Group in blocks of 10 or 25.
  - At most one unit grid per slide; the piece grid is the *only* decoration.
- **Post types:** proportions ("1 in 4 solves is a 1000-piece"), completion or first-try rates, badge-holder shares, a "the last piece" CTA, quizzes ("how many of these 100 pieces are sky?").
- **Risks:**
  - geometry errors are fatal ("wrong pieces are worse than no piece");
  - unit charts are imprecise, so they only suit explanation;
  - it can tip into kitsch if pieces appear elsewhere on the slide too.
- **Tools:** Python + shapely (`jigsaw_piece()`) → SVG paths, cached as JSON; D3 for fills; Playwright. Add a QA check that pieces tessellate (union area = grid area, no overlaps).

#### D4. "Box Lid & Shelf" (puzzle-packaging identity)
- **Mood references:** Piecework's art-book boxes with titles down the spine for a collection; Le Puzz's bold type and witty copy; the AIGA puzzle-brand wave (storybook packaging, warm colour).
- **Rules:**
  - **Every feed post is a "box lid":**
    - a piece-count corner badge ("500" / "1000" in a rounded rectangle, Rubik Bold, navy on white);
    - a vertical **spine strip** on the left inside the safe area (series name plus issue number, in all caps with the `case` feature);
    - the lid "artwork" is the chart or number itself.
  - Lid grounds rotate through 4–5 muted brand tints.
  - Box-style hairline frame at 16 px inset.
  - A second display face (e.g. a high-contrast serif à la Canela, using an OFL alternative) could be tested for titles only. Availability and licence are **unverified**.
- **Post types:** recurring series (Walls, Country Cup, Puzzle of the Month), puzzle-specific stats (most-solved puzzles, fastest per puzzle), brand or manufacturer spotlights.
- **Risks:**
  - frames and spines eat space at 1080 px;
  - pastiche risk if too literal (fake cardboard edges);
  - reproducing manufacturer box art raises rights issues (§2), so use typography and extracted swatches instead.
  - The profile grid should look like a shelf; if it looks like ads, the direction fails.
- **Tools:** Playwright; colour extraction from box images (e.g. k-means in Python) for swatches only.

#### D5. "Race Clock" (scoreboard / sports broadcast)
- **Mood references:** the FT's dark social chart variants; sports-broadcast lower thirds and timing boards (no specific source reviewed); Strava's sport framing.
- **Rules:**
  - **Ground:** navy #2b3445, the only dark direction.
  - **Type:** numerals in Rubik Bold with `tnum` and `zero` (slashed zero), times as `mm:ss` with an aligned colon.
  - **Leaderboard rows:** rank, an SVG flag chip, a name (only with consent; otherwise country or puzzle), the time, and a split bar.
  - **Highlight:** coral for #1 and the record line; sky for secondary labels on navy (5.64:1).
  - **Brand device:** a stopwatch ring segment at top-left.
  - Motion in Reels: ticking timers, lane bars racing.
- **Post types:** competitions (WJPC, nationals), record breaks, country rankings, PPM leaderboards, "race the clock" quizzes in Stories.
- **Risks:**
  - contradicts the site principle "never dark or heavy", so limit it to the competition pillar if it wins;
  - "esports" clichés (neon, glows, italics) creep in easily, so ban glow;
  - personal names need consent.
- **Tools:** Playwright; Remotion for timer and lane-race Reels; flag SVGs from an MIT-licensed flag set (licence to confirm).

#### D6. "Puzzle Mat" (warm craft / tactile)
- **Mood references:** Spotify Wrapped 2025's analog textures with a restrained palette; the AIGA puzzle-brand warmth (warm yellows, reds and greens); felt puzzle mats and sorting trays as a layout metaphor (no external reference found).
- **Rules:**
  - **Ground:** a warm off-white "board" (test #f7f1e8-ish; contrast for navy is 11.1:1) with code-generated grain at ≤ 3–4% opacity. No photos.
  - **Layout:** content sits in **sorting-tray cells**, i.e. rounded 24 px rectangles with a 2 px navy outline, a soft same-hue inner wash and no drop shadow. Each cell holds one number or mini-chart (small multiples).
  - Optional single "paper cutout" accent (a piece silhouette in kraft tone).
  - Coral marks with a navy outline.
- **Post types:** community and habit stats ("edge-first?" polls), behind-the-data posts, quiz and reveal, "Sunday puzzle day", tips, Stories.
- **Risks:**
  - texture can read as "Canva craft template" or muddy on compressed JPEGs;
  - the warm ground lowers coral contrast (2.60:1), so coral needs the outline;
  - grain plus JPEG compression can band, so test at Instagram's recompression.
- **Tools:** Playwright with SVG `feTurbulence` grain (or one owned scanned texture); render at 1080 and inspect after a re-encode to JPEG quality ~80.

#### D7. "House Illustrated" (MSP semi-flat outlined)
- **Mood references:** the MSP logo (stopwatch and piece, navy ~2 px ink, soft washes, speed lines); the badge-art system (one navy ink, fixed stroke, same-hue washes, no gloss, no faces); Strava's "lines, dots, strips, circles" vocabulary.
- **Rules:**
  - **Ground:** white, airy.
  - **One spot illustration per post**, drawn by Claude as SVG through the badge QA gate: fixed stroke as a % of canvas, navy ink, same-hue wash lit from the top-left, no gloss, no faces. It sits next to (never behind) the chart or number.
  - Charts share the illustration's ink: navy 3 px baseline, coral fills with navy outline.
  - Badges appear as themselves.
- **Post types:** badges and XP, feature announcements, explainers ("what is PPM?"), milestone thank-yous, Story stickers and frames, CTA slides.
- **Risks:**
  - illustration quality is the bottleneck (the lab history shows models fail without the gate);
  - it can feel "app marketing" rather than "data journalism";
  - illustration and chart may compete for attention.
- **Tools:** badge-art toolchain (Python, shapely, `rsvg-convert`) or Claude-authored SVG plus the QA gate; Playwright for composition.

#### D8. "Two-Ink Zine" (risograph / data-zine)
- **Mood references:** risograph data zines and indie print (no specific source reviewed); Spotify 2025's scrapbook and DIY turn.
- **Rules:**
  - **Exactly two spot inks:** coral and indigo. This pair is robust for colour-blind readers (ΔE 76–96 under all CVD types).
  - Inks overprint via `mix-blend-mode: multiply` on an off-white paper ground.
  - Halftone-dot fills for areas, 2–4 px deliberate misregistration on *decorative* layers only (never on numbers or labels).
  - Bold condensed headlines are tested in Rubik Bold with tight tracking.
  - Hand-set feel, but on the same strict grid.
- **Post types:** "weird stats" or fun-facts series, a monthly zine-style recap carousel, quiz posts, a seasonal "Puzzle Almanac".
- **Risks:**
  - misregistration can read as a rendering bug;
  - halftones alias at 1080 px and under JPEG compression;
  - riso is a well-worn indie trend and may date quickly;
  - it is the furthest from the site's look.
- **Tools:** Playwright (CSS blend modes and SVG patterns); a halftone generator in D3 or Python; test the compression artefacts.

#### D9. "Chapter Recap" (Stories/Reels narrative; Wrapped / Strava-style)
- **Mood references:** Strava Year in Sport's chapters (opening → effort → climax → finale) and simple animatable marks; Spotify Wrapped 2025's restraint plus bold imagery; the Letterboxd Year in Review's large-format scroll.
- **Rules:**
  - 9:16 frames, one stat per frame, each chapter with its own ground colour from the brand set (the colour change marks the chapter).
  - Hero numbers ≥ 240 px; content inside the Story/Reel safe zones (§4).
  - The arc: **hook** (question) → **reveal** (number) → **context** (chart) → **you** (a personal-stats CTA) → **sticker prompt** (the owner adds poll or quiz stickers by hand, since the API can't).
  - Reuses components from whichever feed direction wins.
- **Post types:** monthly and yearly recaps ("MSP Wrapped"), competition-weekend Stories, Trial Reels with count-ups or histogram builds, and the future personalised share cards on the site.
- **Risks:**
  - "Wrapped" copycats are everywhere in December, so the chapters must use MSP-specific metrics (PPM, pieces, walls);
  - motion polish is time-consuming;
  - Stories need hand-added stickers.
- **Tools:** Remotion (shares the HTML/CSS); ffmpeg slideshow fallback; Playwright for static Story frames.

---

**Recommended lab protocol** (so "best feeling" is decided on evidence, not description):
1. **Fixed test set.** Render the same 4 contents in all 9 directions:
   - (a) the 59-minute-wall histogram carousel (cover + 3 slides);
   - (b) a record hero number;
   - (c) a country top-10 leaderboard;
   - (d) a proportion such as "share of solves that are 500-piece".

   That is 9 × 6 = 54 renders, plus 9 Story frames for D9.
2. **Show them in context.** Use the feed mock and a 3×4 grid mock (each direction's 4 posts plus the existing grid), not as isolated JPEGs. Review on a phone at arm's length.
3. **Score.** Rate 1–5 on: thumb-stop on the grid; legible in 1 s; feels MSP (warm, competitive, not childish); premium vs template; series potential over 12 posts; and lint pass rate (automated). Owner veto overrides.
4. **Converge.** Expect 1 primary and 1 secondary direction (e.g. D1 or D3 for data, D2 for covers and records, D5 limited to competitions) sharing one token file. The other directions supply single devices (e.g. D4's spine as the series marker, D6's tray cells as the small-multiple container).
5. **Lock the winner.** Freeze it as golden renders plus numbered owner decisions in STYLE.md, the same way the badge decisions were locked.

**Hypotheses worth testing:**
- D3 (Piece Units) is the most *ownable*: no other data account can credibly use a tessellating jigsaw unit grid, and MSP already has correct geometry.
- D1 is the most *robust* for a weekly cadence.
- D2 is the most *thumb-stopping* on the grid.
- D5 conflicts with the site's "light and airy" principle, but the FT's dark social variants suggest dark data grounds can work on Instagram.
- D6 and D8 carry the most risk of looking templated or slop-adjacent if the texture is overdone.

### Gaps
- None of the nine directions has been rendered or tested with MSP's audience. All the performance hypotheses above are untested.
- No sources were found for risograph or data-zine practice, sports-broadcast graphics systems, or puzzle-mat aesthetics. D5, D6 and D8 rest on general design knowledge plus the cited restraint and colour evidence.
- Second-typeface candidates for D4 and D8 (OFL serif or condensed faces) were not researched or licence-checked this session.
- The owner's reasons for rejecting the share card are not recorded (round-1 report). Knowing whether the problem was composition, style or execution would sharpen which directions to prioritise.
