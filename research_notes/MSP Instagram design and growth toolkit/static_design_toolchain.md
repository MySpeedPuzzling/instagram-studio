# Static data-driven social design toolchain for an LLM agent (state as of 2026-10-13)

Scope: the tools that turn MSP's data into premium, consistent 1080×1350 feed slides and 1080×1920 Stories, rendered locally and headlessly, driven by Claude Code. Versions, licences and prices below are dated 2026-10-13 unless stated otherwise.

**About the evidence.**
- The shared web-search budget of the research session ran out partway through. Later facts were therefore checked by fetching primary pages directly: GitHub, npm, PyPI and Docker Hub, official docs and terms, plus Context7.
- Practitioner comparisons from 2025–26 and any benchmark of how well LLMs write chart code are thin; see the Gaps sections.
- "Local check" marks evidence produced on the pipeline Mac on 2026-10-13: version queries, font-table parsing, ImageMagick encode simulations. Nothing was installed.

## 1. Chart engines: which give the most premium editorial results with the least effort, annotate well, render headlessly, and are reliably authored by an LLM, including unusual forms?

### Takeaway
Keep **Observable Plot rendered inside the Playwright template page** as the everyday engine. Its specs are the shortest, it ships beeswarm (`dodgeY`), waffle, facets, arrow, text and tip marks, takes CSS theming, and measures text with the real Rubik font. Use **hand-written D3 v7 modules** for hero graphics, ridgelines and force-packed beeswarms. Add **ggplot2 4.x (R)** only as a specialist engine for statistical forms such as ridgelines, dot/interval plots and beeswarms. It should output SVG that is placed into the HTML template, so typography stays in one system.

Avoid these:
- d3-annotation: unmaintained since 2019.
- Recharts, Chart.js and Nivo: they look like dashboards, and Recharts and Chart.js have SSR or raster limits.
- Plotly with Kaleido: heavy, with a scientific look.
- Datawrapper free plan and Flourish: forced attribution, can't be made on-brand, and Flourish has no free image export.

### Cited Findings
**Observable Plot**
- Latest npm release is **0.6.17 (2025-02-14)**, ISC licence. The main branch has unreleased commits up to 2026-05 and a push on 2026-09-01, so it is active but has not shipped a release in about 20 months — [npm](https://www.npmjs.com/package/@observablehq/plot); [commits](https://github.com/observablehq/plot/commits/main)
- Server-side rendering: `Plot.plot({document: new JSDOM("").window.document, …})`, then serialise `outerHTML` with the `xmlns` attributes set — [Plot getting-started](https://github.com/observablehq/plot/blob/main/docs/getting-started.md)
- Annotation marks:
  - `arrow` with `bend` and `sweep` — [arrow docs](https://github.com/observablehq/plot/blob/main/docs/marks/arrow.md)
  - `text` with `lineWidth` wrapping, `lineAnchor` and `dy` — [text docs](https://github.com/observablehq/plot/blob/main/docs/marks/text.md)
  - `tip` with `preferredAnchor`, plot-level `title`/`subtitle`/`caption`, and a `marker` option — [Plot releases](https://github.com/observablehq/plot/releases)
- Unusual forms:
  - `dodgeY` beeswarm — [dodge docs](https://github.com/observablehq/plot/blob/main/docs/transforms/dodge.md)
  - `waffleX`/`waffleY` (since 0.6.16) — [waffle docs](https://github.com/observablehq/plot/blob/main/docs/marks/waffle.md)
  - `fx`/`fy` facets for small multiples — [facets docs](https://github.com/observablehq/plot/blob/main/docs/features/facets.md)
  - There is no ridgeline mark. One has to be built from facets plus `areaY`, which is unverified.
- Background has been transparent by default since 0.6.12, and it can be themed via `--plot-background` and `className` — [Plot releases](https://github.com/observablehq/plot/releases)
- Context7 lists 1,874 snippets with a benchmark score of 81.6, the highest of the JS chart libraries checked — Context7 `/observablehq/plot`
- Unpacked sizes: Plot about 1.5 MB, d3 about 0.87 MB, jsdom about 5.5 MB — [npm registry](https://registry.npmjs.org/@observablehq/plot)

**D3 and the annotation add-ons**
- D3 **7.9.0 (2024-03-12)**, ISC. The repo was pushed in 2026-05 — [npm](https://www.npmjs.com/package/d3); [repo](https://github.com/d3/d3)
- **d3-annotation (`d3-svg-annotation`)** is effectively unmaintained — [npm](https://www.npmjs.com/package/d3-svg-annotation); [repo](https://github.com/susielu/d3-annotation)
  - last release 2.5.1 on 2019-10-28; last commit 2020-05-07
  - 40 open issues and PRs
  - the README says "made for d3-v4"
- `@visx/annotation` 4.0.0 (2026-06-11) is a React alternative — [npm](https://www.npmjs.com/package/@visx/annotation)

**Vega-Lite / Vega + vl-convert**
- Vega-Lite **6.5.0 (2026-10-08)** and Vega 6.4.0 (2026-08-14), BSD-3 — [vega-lite releases](https://github.com/vega/vega-lite/releases)
- vl-convert stable is **1.9.0 (2026-01-20)** and bundles Vega-Lite 6.4.1. Version **2.0.0-rc7 (2026-09-14)** is a pre-release that adds `vl-convert serve` — [vl-convert releases](https://github.com/vega/vl-convert/releases)
- The macOS arm64 Python wheel is about 39–41 MB — [PyPI](https://pypi.org/project/vl-convert-python/)
- CLI: `vl-convert vl2svg|vl2png|vl2jpeg|vl2pdf --input c.vl.json --output c.png --scale 2` — [vl-convert 2.0 docs](https://vega.github.io/vl-convert/2.0.0-rc7/)
- Font options (2.0-rc docs): `--font-dir`, `--missing-fonts error`, `--google-font`, `--auto-google-fonts`. The bundled fallback is Liberation Sans — [fonts doc](https://github.com/vega/vl-convert/blob/main/docs/source/_topics/output-and-appearance/fonts.md)
- Python: `vlc.vegalite_to_png(spec, scale=2)` — [vl-convert-python README](https://raw.githubusercontent.com/vega/vl-convert/main/vl-convert-python/README.md)
- Annotation: there is no arrow mark. Annotations are layered `text`/`rule` marks; an arrowhead is a workaround using a point mark with `shape: wedge/triangle` plus `angle` — [point docs](https://vega.github.io/vega-lite/docs/point.html)
- Unusual forms:
  - The gallery has a Wilkinson dot plot, an isotype grid (waffle-like) and trellis histograms, but no ridgeline (`ridgeline.vl.json` returns 404) — [examples](https://vega.github.io/vega-lite/examples/)
  - A beeswarm needs full Vega's force transform — [Elastic forum, 2020](https://discuss.elastic.co/t/vega-beeswarm/256280.md)
- Altair **6.1.0 (2026-04-21)**, BSD-3 — [PyPI](https://pypi.org/pypi/altair/json)

**Apache ECharts**
- **6.1.0 (2026-05-19)**; 6.0.0 came out 2025-07-30 with a new token-based default theme. `echarts/theme/v5.js` restores the old look. Apache-2.0 — [6.0.0 release](https://github.com/apache/echarts/releases/tag/6.0.0); [v6 features](https://echarts.apache.org/handbook/en/basics/release-note/v6-feature)
- Server-side render: `echarts.init(null, null, {renderer:'svg', ssr:true, width, height})`, then `renderToSVGString()` — [SSR handbook](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/)
- v6 adds a native beeswarm (`jitter` with `jitterOverlap:false`), plus violin, chord, matrix and broken axes — [v6 features](https://echarts.apache.org/handbook/en/basics/release-note/v6-feature)
- Rich-text labels changed inheritance in v6 — [v6 upgrade guide](https://github.com/apache/echarts-handbook/blob/master/contents/en/basics/release-note/v6-upgrade-guide.md)
- 60 MB unpacked — [npm registry](https://registry.npmjs.org/echarts)

**Nivo, visx, LayerChart, Recharts**
- **Nivo 0.99.0 (2025-05-23)**, MIT, no release in about 17 months. `@nivo/static` renders SVG via `renderToStaticMarkup` — [npm](https://www.npmjs.com/package/@nivo/core); [renderer.ts](https://github.com/plouc/nivo/blob/master/packages/static/src/renderer.ts)
- **visx 4.0.0 (2026-06-11)**, MIT — [releases](https://github.com/airbnb/visx/releases)
- **LayerChart 2.7.0 (2026-10-12)**, MIT, needs Svelte 5 — [npm](https://www.npmjs.com/package/layerchart)
  - Has `AnnotationPoint/Line/Range`, `Dodge`, `Waffle` and `ForceSimulation`, and ships an `llms.txt` — [layerchart llms.txt](https://layerchart.com/llms.txt)
  - Server-side images go through `layerchart/server` `renderChart(...)` with `@napi-rs/canvas`. The output is a raster canvas, not SVG — [SSR guide](https://www.layerchart.com/docs/guides/ssr-images/llms.txt)
  - The v1→v2 rewrite to Svelte 5 runes means older examples in training data are stale — [migration guide](https://next.layerchart.com/docs/guides/migrations/v1-to-v2)
- **Recharts 3.10.1 (2026-07-25):** in v3, `renderToString` produces no SVG, because width and height start at 0 and are only set in `useEffect` — [layoutSlice.ts](https://github.com/recharts/recharts/blob/main/src/state/layoutSlice.ts); [RootSurface.tsx](https://github.com/recharts/recharts/blob/main/src/container/RootSurface.tsx)

**Plotly and Chart.js**
- **Plotly.js 4.1.2 (2026-10-05)**; v4.0.0 (2026-08-24) needs Node 22+ and adds a "Share chart" button that is on by default — [v4 guide](https://plotly.com/javascript/guides/whats-new-in-v4/)
- Kaleido: "As of version 1.0.0, Kaleido requires Chrome to be installed". Kaleido 1.5.0 came out 2026-10-06 — [PyPI kaleido](https://pypi.org/project/kaleido/)
- **Chart.js 4.5.1 (2025-10-13)** with chartjs-node-canvas 5.0.0, which needs native `canvas`, gives raster output only. chartjs-plugin-annotation 3.1.0 has labels with callouts and Bézier arrow lines — [plugin guide](https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/)

**R and Python**
- **ggplot2 4.0.0 (2025-09-11)**: S7 rewrite, theme-level `ink`/`paper`/`accent`, theme palettes, `element_geom()`, `margin_auto()` and fixed panel sizes — [tidyverse blog](https://tidyverse.org/blog/2025/09/ggplot2-4-0-0/). Current version is **4.0.3 (2026-04-22)**, MIT — [CRAN](https://cran.r-project.org/web/packages/ggplot2/index.html)
- Extensions on CRAN, as of 2026-10-13 — [crandb](https://crandb.r-pkg.org/-/versions?keys=["ggtext","ggrepel","patchwork","ggbeeswarm","ggdist","ggridges","waffle","geomtextpath","systemfonts","ragg","svglite","hrbrthemes","ggthemes","marquee","ggforce"]):
  - ggtext 0.2.0 (2026-08-28)
  - ggrepel 0.9.8 (2026-03-17)
  - patchwork 1.3.2 (2025-08-25)
  - ggbeeswarm 0.7.3 (2025-11-29)
  - ggdist 3.3.3 (2025-04-23)
  - ggridges 0.5.7 (2025-08-27)
  - geomtextpath 0.2.0
  - ggthemes 7.0.0 (2026-10-03)
  - hrbrthemes 0.9.3
  - waffle 1.0.2 is stale (2023-09-30, GPL≥2)
- Fonts in R: systemfonts 1.2+ can fetch Google Fonts (`require_font()`), and 1.2.3 added `fonts_as_import()`. ragg (PNG) and svglite (SVG, `web_fonts=`) use systemfonts — [systemfonts NEWS](https://systemfonts.r-lib.org/news/index.html); [vignette](https://cloud.r-project.org/web/packages/systemfonts/vignettes/systemfonts.html)
- BBC **bbplot** is GitHub-only, 13 commits, no releases, no licence shown. `finalise_plot()` defaults to 640×450 px — [bbc/bbplot](https://github.com/bbc/bbplot)
- Install footprint:
  - rig, the R installation manager, installs R on macOS — [rig install](https://rig.r-lib.org/install.html)
  - the `rocker/r-ver:4.6.1` arm64 Docker image is 353.7 MB, updated 2026-09-11 — [Docker Hub](https://hub.docker.com/v2/repositories/rocker/r-ver/tags?page_size=5)
- **plotnine 0.15.8 (2026-08-14)** — [plotnine changelog](https://plotnine.org/changelog.html)
  - 0.15.0 added `(p1 | p2) / p3` composition, plot tags and title/caption positioning
  - 0.15.4 added "bundled agent skills"
- **matplotlib 3.11.2** — [PyPI](https://pypi.org/pypi/matplotlib/json)
  - pyfonts 1.4.2 (2026-10-12, MIT) loads Google/Bunny fonts — [PyPI](https://pypi.org/pypi/pyfonts/json)
  - highlight-text was last released 2021 — [PyPI](https://pypi.org/pypi/highlight-text/json)

**Special-purpose and SaaS**
- **RAWGraphs:** the app is Apache-2.0 with 9.0k stars. It runs locally with `npm start`; there is no CLI — [rawgraphs-app](https://github.com/rawgraphs/rawgraphs-app)
  - `@rawgraphs/rawgraphs-core` **1.0.0** and `@rawgraphs/rawgraphs-charts` **1.1.0** were published to npm on **2026-10-08**, the first stable releases after betas from 2021–23 — [core](https://registry.npmjs.org/@rawgraphs/rawgraphs-core); [charts](https://registry.npmjs.org/@rawgraphs/rawgraphs-charts)
  - Scripting: `chart(model,{data,dataTypes,mapping,visualOptions}).renderToDOM(node)`, which needs a DOM, so it would run inside the Playwright page — [rawgraphs-core rendering](https://rawgraphs.github.io/rawgraphs-core/docs/rendering)
  - Beeswarm was added in 1.3.0 — [RAWGraphs blog](https://rawgraphs.io/post/rawgraphs-updates-with-version-1-3-0)
- **Datawrapper**, verified 2026-10-13 on [datawrapper.de/pricing](https://www.datawrapper.de/pricing):
  - Plans: Free; **Pro $21/user/month**; **Business $39/user/month**; Enterprise by quote
  - Exports: Free gives **PNG only**; PDF and SVG need Pro or above
  - Custom themes (fonts, palettes) are a **$499/month add-on**, plus $299/month for each extra theme
  - FAQ: "you have full copyright over charts and maps you create with Datawrapper … publish them freely in academic or commercial contexts". Free users must keep the "Created with Datawrapper" attribution "at the bottom of your chart or in your citations"; removing it needs Pro, Business or Enterprise
  - The Terms (last updated 2022-03-07) have no social-media clause — [Terms](https://www.datawrapper.de/terms)
  - The Pro/Business plans were announced 2026-07-23 — [Datawrapper blog](https://www.datawrapper.de/blog/pro-and-business-plans)
  - **API billing became effective 2026-10-01**. Each month includes 500 creates, 1,000 publishes and 3,000 exports. Beyond that, roughly $0.04 per create, $0.02 per publish and $0.01 per export at low volume — [pricing](https://www.datawrapper.de/pricing)
  - Export call: `GET /v3/charts/<id>/export/png?unit=px&zoom=2&plain=false` with a bearer token. PDF and SVG exports need Pro or above — [Datawrapper developer docs](https://www.datawrapper.de/developer/exporting-as-pdf-svg)
- **Flourish (Canva):** no public prices
  - The Presenter plan is "Available with a Canva Business or Enterprise plan" and includes "Image and SVG export". The Enterprise plan has a "Live rendering API" — [Flourish pricing](https://flourish.studio/pricing/)
  - The free plan has no image export, per a help-centre snippet; the page returned 403 — [Flourish help](https://helpcenter.flourish.studio/hc/en-us/articles/8761536676111-Free-accounts-vs-paid-accounts)
  - Terms (updated 2026-06-15, §7(c)): for any images, videos or gifs, "it is strictly required to credit Flourish … visible text ('Created with flourish.studio' or equivalent)". "In the case of the content being shared on any website or social media platform, the credit must also include a hyperlink" — [Flourish terms](https://flourish.studio/terms)

**Newsroom practice**
- The Pudding: "We often rely heavily on the D3.js JavaScript library and Svelte" (page undated) — [Pudding resources](https://pudding.cool/resources). Its starter ships LayerCake templates — [svelte-starter](https://github.com/the-pudding/svelte-starter)
- Reuters maintains a Svelte 5 component library (`@reuters-graphics/graphics-components` v4.15.0, pushed 2026-10-11) — [repo](https://github.com/reuters-graphics/graphics-components)

### Inferences
- **Premium look for the least effort.** Rendering Plot or D3 inside the same Chromium page as the template gives one typography and colour system: CSS variables, Rubik with `tabular-nums`, and real font metrics for label fitting. Every other engine renders text through a second font stack, and that drift is a common source of a "cheap" look.
- **LLM authoring reliability (opinion).** Ranked roughly:
  1. Vega-Lite JSON: most validatable.
  2. Plot: shortest, but option names are sometimes invented.
  3. ggplot2: huge training corpus, but 4.0 internals changed.
  4. D3: most familiar, but long imperative code with collision and margin bugs.
  5. ECharts: huge option surface, and v5 and v6 defaults are easily confused.

  A visual QA loop (render → look → fix) matters more than the engine choice.
- **Recommended engine per unusual chart form:**

| Form | Primary | Alternate |
|---|---|---|
| Beeswarm | Plot `dodgeY` | `d3-force` collide, for exact packing |
| Ridgeline | D3 (`d3.area` + KDE) | ggridges |
| Waffle / unit chart | Plot `waffleY` | CSS grid of squares or puzzle pieces, which is on-brand |
| Dot plot | Plot `dot` + `ruleY` | — |
| Histogram with highlighted bin | Plot `rectY(binX)` with a conditional fill | — |
| Small multiples | Plot `fx`/`fy` | — |
| Interval / uncertainty | ggdist | — |
| Alluvial / circle packing | D3 (`d3-sankey`, `d3.pack`) | RAWGraphs core, then restyle |

- **Datawrapper is legally usable on Instagram but not on-brand.** The free plan allows commercial publishing if the credit stays (in the chart or "in your citations", so arguably the caption). But it is PNG-only and has no custom fonts or themes without the $499/month add-on. Flourish's hyperlinked-credit rule can't be met inside an Instagram image, and the free plan has no image export anyway. Neither should be in the pipeline.
- **R is worth it only if a beeswarm, ridgeline or interval form recurs** (for example in "distribution of solve times" posts). Run it through the rocker Docker image to avoid a native R install, emit SVG with svglite, and inline it into the HTML template.

### Gaps
- No verified 2025–26 practitioner comparison of chart libraries (Nightingale, Datawrapper, FT or Economist teams). The web-search budget ran out. The FT's only located source is from 2016; the Economist is not verified.
- No benchmark of LLM chart-authoring accuracy per library was found. The authoring rankings above are opinion.
- Missing details:
  - whether Plot has an `llms.txt` (blocked by a bot checkpoint)
  - Plot's ridgeline technique
  - how ECharts measures text and loads fonts in Node SSR
  - vl-convert 1.9 font flags (only the 2.0-rc docs were read)
  - plotnine's licence and whether it has a beeswarm or ridgeline
  - the full RAWGraphs chart list
- Flourish prices and whether a Presenter-plan export can skip the credit are unknown.
- Datawrapper's own wording on social-media posting is absent. Confirm with their support whether a caption credit satisfies "in your citations".

## 2. Maps for country comparisons: what suits 84 countries (Europe-heavy) on a phone screen?

### Takeaway
Use a **hand-tuned CSS-grid tile map** (one equal tile per country, with a circle flag, ISO code and value). Pair it with **ranked bar or dot charts with flags** for "fastest country" style rankings. Use a true geographic map only for "global reach" visuals: **visionscarto-world-atlas 50m + d3-geo Equal Earth + Dorling-style proportional circles + a Europe inset**. Avoid world choropleths, the archived world-atlas package (Crimea inside Russia, Kosovo without an id), Bertin.js (stale since 2023) and MapLibre basemaps.

### Cited Findings
- Versions and licences as of 2026-10-13 — [npm registry](https://registry.npmjs.org/):
  - d3-geo 3.1.1 (2024-03-12, ISC)
  - d3-geo-projection 4.0.0 (2021, ISC)
  - topojson-client 3.1.0 (ISC)
  - world-atlas 2.0.2 (2019, ISC)
  - visionscarto-world-atlas 1.0.0 (2024-04-01, BSD-3-Clause per npm only; the GitHub repo has no LICENSE file) — [visionscarto/world-atlas](https://github.com/visionscarto/world-atlas)
- **world-atlas** has been archived since 2023-03-03. It is built from Natural Earth 4.1.0 and ships 110m/50m/10m TopoJSON — [topojson/world-atlas](https://github.com/topojson/world-atlas)
- **Researcher's in-memory test of the jsDelivr copies:**
  - **110m has 177 features and lacks Malta, Singapore, Andorra, Liechtenstein, Monaco, San Marino, Bahrain and Mauritius.** 50m has 241 features.
  - In world-atlas 2.0.2, a point in Simferopol falls inside **Russia** and Laayoune inside **Morocco**. Kosovo, N. Cyprus and Somaliland have **no id**.
  - In visionscarto-world-atlas, Crimea falls in Ukraine and Laayoune in W. Sahara, and `properties.a3` is added (Kosovo = `XKX`). Its README says it "better reflects the UN views (Ukraine; Western Sahara)" — [visionscarto/world-atlas](https://github.com/visionscarto/world-atlas)
- **Natural Earth** is public domain, and credit is optional — [NE terms](https://www.naturalearthdata.com/about/terms-of-use/)
  - It draws borders by de facto control. Point-of-view editions exist for 31 countries, but only at 1:10m (v5.1.1, Shapefile/geoDB) — [NE POV editions](https://www.naturalearthdata.com/blog/admin-0-countries-point-of-views/)
- **Projections:** `d3.geoEqualEarth()` and `projection.fitExtent()` are in d3-geo core — [d3-geo docs](https://d3js.org/d3-geo/projection). `geoRobinson` and `geoWinkel3` are in d3-geo-projection — [README](https://github.com/d3/d3-geo-projection)
- **Observable Plot geo:** `Plot.geo` and `Plot.geoCentroid()` place dots with an `r` channel, but Plot has no Dorling or collision layout — [Plot geo docs](https://github.com/observablehq/plot/blob/main/docs/marks/geo.md)
- **Researcher's pixel arithmetic** (visionscarto 50m, map 1,000 px wide):

| Country | World, Equal Earth | Europe-only, equal-area |
|---|---|---|
| Czechia | ~8×8 px | ~45×45 px |
| Slovenia | ~4×4 px | ~23 px |
| Luxembourg | ~1.5 px | ~8 px |
| Malta | ~0.5 px | ~2.6 px |

  This agrees with Lisa Charlotte Muth's point that Malta is "five pixels" on a choropleth and that a ranked bar chart is often better — [Datawrapper, 2017-12-21](https://www.datawrapper.de/blog/weekly-chart-turnout)
- **Bertin.js 1.8.5** (2023-10-23, MIT) has had no commits since 2023-10-23, although its README still says "under active development" — [npm](https://registry.npmjs.org/bertin); [GitHub](https://github.com/neocarto/bertin)
- **geoviz 1.0.7** (2026-07-07, MIT) is by the same author (Nicolas Lambert, RIATE) — [npm](https://registry.npmjs.org/geoviz); [docs](https://riatelab.github.io/geoviz/); [GitHub](https://github.com/riatelab/geoviz)
  - Functions: `prop`, `choro`, `spike`, `halfcircle`, `gridprop`, `dotdensity`, `tile`, full legends, `tool.dodge` (force-based separation) and `exportSVG`/`exportPNG`
  - Neither README says geoviz succeeds Bertin
- **MapLibre:**
  - maplibre-gl 6.14.0 (2026-10-11, BSD-3) and @maplibre/maplibre-gl-native 6.4.1 (2026-03-29, BSD-2) — [npm registry](https://registry.npmjs.org/)
  - The native Node renderer has macOS arm64 binaries and `map.render({zoom,center,width,height})` returns RGBA — [maplibre-native node README](https://github.com/maplibre/maplibre-native/tree/main/platform/node)
  - OpenFreeMap is free with no key and needs attribution, including OpenMapTiles/OSM credit on print and video — [openfreemap.org](https://openfreemap.org/)
  - Protomaps is an "ODbL Produced Work (OpenStreetMap attribution required)" — [Protomaps docs](https://docs.protomaps.com/basemaps/downloads)
  - OSMF guidance: "Static images must be generally attributed the same way as interactive maps", and the credit must be legible — [OSMF attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- **Tile grids:**
  - Schwabish's World Tile Grid Map (2017-10-12) is **CC BY-SA 4.0** — [PolicyViz](https://policyviz.com/2017/10/12/the-world-tile-grid-map/). A JSON version carries the same licence — [Tile-Grid-Map](https://github.com/mustafasaifee42/Tile-Grid-Map)
  - Maarten Lambrechts: "Big countries become smaller, small countries become bigger" — [tutorial, 2017-10-22](http://www.maartenlambrechts.com/2017/10/22/tutorial-a-worldtilegrid-with-ggplot2.html)
  - geofacet 0.2.5 (MIT) grids include `world_countries_grid1` (192 countries, 23×28, includes LUX, MLT, SVN, XKX), `world_86countries_grid`, `europe_countries_grid1/2` and `eu_grid1`. The grid-designer repo has no LICENSE file — [geofacet](https://github.com/hafen/geofacet); [grid-designer](https://github.com/hafen/grid-designer)
  - PitchInteractive tilegrams (ISC) has only US, France and Germany data — [tilegrams](https://github.com/PitchInteractiveInc/tilegrams)
- **Flags:**
  - circle-flags 2.8.3 (2026-04-19, MIT, 400+ flags) — [HatScripts/circle-flags](https://github.com/HatScripts/circle-flags)
  - flag-icons 7.5.0 (2025-05-29, MIT; 4x3 and 1x1) — [lipis/flag-icons](https://github.com/lipis/flag-icons)
  - Both include cz, xk, tw, eh, ps, lu, mt, si, gb-sct and eu (researcher's fetch check)
  - Twemoji graphics are CC-BY 4.0 — [jdecked/twemoji](https://github.com/jdecked/twemoji)

### Inferences
- **Tile size.** A 28-column world grid at 1080 px gives about 36 px tiles, too small for a flag, code and value. Lay out only MSP's actual ~84 countries, with a dense Europe block of 9–10 columns (roughly 90–100 px tiles) and compact clusters for the Americas, Asia-Pacific and Africa. Keep it inside the central ~1012 px so it survives the 3:4 grid crop.
- **How Claude drives the tile map.**
  - Claude maintains `tilegrid.json` (`{"iso2":"CZ","col":7,"row":5}`), starting from geofacet's MIT grid rather than the CC BY-SA Schwabish layout.
  - It renders a CSS grid (`grid-column`/`grid-row`) coloured with a d3-scale sequential or quantile scale (log or quantile for heavy-tailed solve counts).
  - Playwright screenshots it.
- **How Claude drives the geographic alternate.**
  - Pin `visionscarto-world-atlas@1.0.0/world/50m.json` in the repo.
  - Convert and project: `topojson.feature` → `d3.geoEqualEarth().fitExtent(...)`.
  - Place circles at the centroids and separate them with `d3.forceSimulation` (`forceX`/`forceY`/`forceCollide`, about 300 ticks).
  - Add a Europe inset in `geoAzimuthalEqualArea().rotate([-10,-52])`.
  - Label only the top ~10 countries.
  - geoviz `prop` + `tool.dodge` inside Playwright is a shortcut.
- **Borders.** A tile grid sidesteps them: there are no lines, only a decision on whether Kosovo and Taiwan get tiles. Geographic maps should use visionscarto rather than world-atlas.
- **Flags.** Use circle-flags (MIT) vendored locally, not emoji flags. In Chromium on macOS, emoji flags would render with Apple Color Emoji; see §3.

### Gaps
- FT, Economist and Datawrapper world hex or tile layouts were not verified.
- MapLibre GL JS in headless Chromium on the M3 was not tested.
- The Natural Earth version used by visionscarto is not stated, and visionscarto's licence comes only from npm metadata.
- The licence of individual geofacet grids is unclear.
- Whether a social image is an "adaptation" of the CC BY-SA Schwabish layout is a legal grey area.
- geoviz's Node-only rendering is unverified.
- The final tile layout needs MSP's actual country list.

## 3. Composition and rendering engines: which give pixel-exact 1080×1350 output with font fidelity, safe emoji, sRGB and good speed?

### Takeaway
**Playwright 1.64 + Chromium remains the primary composition engine.** It has the most complete CSS and the best font and OpenType fidelity, it already forces sRGB, and Claude drives it with a few lines of code. Two changes to the round-1 recipe:
1. **Capture PNG and encode the JPEG separately** (see §8), because Chromium's JPEG path only exposes a quality setting.
2. **Pin an open emoji font**, so Chromium never falls back to Apple Color Emoji.

Gotenberg 8.37 offers the same Chromium as an HTTP service in Docker. On one Mac it adds about 0.5–0.7 GB of image and an older Chromium, and you can't inject data into the page, so it is an alternate, not an upgrade. Satori has improved: it now uses Taffy layout and supports z-index, which corrects round 1. Takumi and Typst 0.15 are credible browser-free alternates. resvg is the best standalone SVG rasteriser.

### Cited Findings
**Playwright**
- **v1.64.0 (07 Oct 2026)** bundles Chromium 156; v1.63.0 came out 04 Sep 2026. Licence Apache-2.0. The year is inferred from the release sequence — [Playwright releases](https://github.com/microsoft/playwright/releases)
- Since 1.57 Playwright uses Chrome for Testing builds, and headless runs on `chrome-headless-shell`. `channel: 'chromium'` opts into new headless — [release notes](https://playwright.dev/docs/release-notes); [Chrome headless docs](https://developer.chrome.com/docs/chromium/headless)
- Screenshot options — [types.d.ts](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/types/types.d.ts):
  - `type: png|jpeg|webp` (WebP since 1.62)
  - `quality` (JPEG default 80)
  - `scale: css|device`, `clip`, `animations:'disabled'`, `omitBackground`, `style`, `mask`
- **Playwright's default Chromium switches include `--force-color-profile=srgb`** — [chromiumSwitches.ts](https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright-core/src/server/chromium/chromiumSwitches.ts)
- Chromium's DevTools screenshot code passes the bitmap straight to the PNG, JPEG or WebP encoder, with no colour-profile step and only a quality parameter for JPEG (`gfx::JPEGCodec::Encode(bitmap, quality)`). Screenshots are therefore untagged and chroma subsampling can't be controlled — [page_handler.cc](https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/protocol/page_handler.cc)
- Playwright keeps screenshot baselines per OS, so rendering differs across operating systems but is stable on one pinned Mac — [playwright index.ts](https://github.com/microsoft/playwright/blob/main/packages/playwright/src/index.ts)
- Puppeteer 25.13.0 (2026-10-08) also forces sRGB and adds nothing for this job — [Puppeteer releases](https://api.github.com/repos/puppeteer/puppeteer/releases?per_page=4); [ChromeLauncher.ts](https://raw.githubusercontent.com/puppeteer/puppeteer/main/packages/puppeteer-core/src/node/ChromeLauncher.ts)

**Gotenberg**
- **8.37.0 (2026-09-11)**, MIT, bundles Chromium 152, with ARM64 images — [releases](https://github.com/gotenberg/gotenberg/releases); [licence](https://api.github.com/repos/gotenberg/gotenberg/license)
- Docker Hub sizes are about 704 MB (full, amd64) and 698 MB (arm64), and about 505 MB for the Chromium-only variants. These are probably compressed sizes — [Docker Hub tags](https://hub.docker.com/v2/repositories/gotenberg/gotenberg/tags?page_size=8&name=8.3)
- Screenshot routes `/forms/chromium/screenshot/{html,url,markdown}`, verified 2026-10-13 — [Gotenberg screenshot docs](https://gotenberg.dev/docs/convert-with-chromium/screenshot-html)
  - Fields: `width` (default 800), `height` (600), `clip`, `selector`, `deviceScaleFactor` (1), `format` png|jpeg|webp, `quality` (JPEG, default 100), `omitBackground`, `optimizeForSpeed`, `emulatedMediaFeatures`
  - Wait conditions: `waitDelay`, `waitForExpression`, `waitForSelector`
  - Failure checks: `failOnConsoleExceptions`, `failOnResourceLoadingFailed`, `failOnHttpStatusCodes`
  - Uploaded assets land in **one flat directory**, referenced by filename only. `localhost` URLs don't resolve from inside the container.
- Fonts: build a custom image (`COPY fonts/* /usr/local/share/fonts/`) or mount a volume — [Gotenberg configuration](https://gotenberg.dev/docs/configuration)
- Gotenberg launches Chromium with `font-render-hinting=none` and no `force-color-profile` flag — [browser.go](https://raw.githubusercontent.com/gotenberg/gotenberg/main/pkg/modules/chromium/browser.go)

**Satori and Takumi**
- **Satori 0.55.1 (2026-10-13)**, MPL-2.0. Three releases came out on the same day, so pin the version — [Satori releases](https://api.github.com/repos/vercel/satori/releases?per_page=3)
  - README verified 2026-10-13: "Satori uses Taffy to lay out Flexbox, Grid and block layouts". `zIndex` is "Supported". Percentages inside `calc()`/`min()`/`max()`/`clamp()` "only work in sizes, margins, paddings, insets, gaps"
  - Fonts: TTF, OTF, WOFF and WOFF2; variable fonts are not mentioned. Output is SVG only, rasterised with sharp/librsvg — [Satori README](https://raw.githubusercontent.com/vercel/satori/main/README.md)
- **Takumi 2.15.2 (2026-10-13)**, MIT/Apache-2.0 — [Takumi releases](https://api.github.com/repos/kane50613/takumi/releases?per_page=3); [README](https://github.com/kane50613/takumi); [docs](https://takumi.kane.tw/docs)
  - Supports stacking contexts and z-index, `var()`, `calc()`, media queries and Tailwind v4
  - Variable fonts via `font-variation-settings`
  - "Takumi never reads system fonts"
  - Outputs PNG, JPEG, WebP, SVG and PDF

**Typst**
- **0.15.1 (2026-07-17)**, Apache-2.0 — [Typst releases](https://github.com/typst/typst/releases)
  - 0.15 added variable fonts: `wght`/`wdth`/`opsz`/`ital`/`slnt` follow text properties, and a new `variations` parameter sets custom axes
  - `number-type: "lining"` and `number-width: "tabular"` are supported, and font fallback can be set by Unicode range (`covers`) — [text docs](https://typst.app/docs/reference/text/text)
- PNG export takes `--ppi` and a `{p}` page template — [PNG docs](https://typst.app/docs/reference/png)
- Chart packages:
  - lilaq 0.6.0 (2026-03-14, MIT) — [Typst Universe](https://typst.app/universe/package/lilaq)
  - cetz-plot 0.1.4 (2026-05-26, LGPL-3.0+) — [Typst Universe](https://typst.app/universe/package/cetz-plot)

**SVG rasterisers and canvases**
- **resvg 0.48.1 (2026-08-02)**, Apache-2.0 OR MIT — [resvg CHANGELOG](https://raw.githubusercontent.com/linebender/resvg/main/CHANGELOG.md); [main.rs](https://github.com/linebender/resvg/blob/main/crates/resvg/src/main.rs)
  - 0.47 added variable fonts via `font-variation-settings`; 0.48 switched text shaping to harfrust and skrifa; colour (emoji) fonts since 0.42
  - Static SVG only, minimal CSS; the docs claim "100% reproducible output across platforms"
  - CLI: `resvg -w 1080 in.svg out.png`
  - `@resvg/resvg-js` is still at 2.7.0-alpha.2 (2026-01-28) — [resvg-js releases](https://api.github.com/repos/thx/resvg-js/releases?per_page=2)
- **librsvg / rsvg-convert:** latest 2.63.2 — [librsvg NEWS](https://gitlab.gnome.org/GNOME/librsvg/-/raw/main/NEWS)
  - Text goes through Pango and fontconfig (system fonts), and `var()` works only for colours
  - This is the engine inside sharp and Satori's recommended PNG path
- **Inkscape 1.4.4** (about May 2026; third-party source, inkscape.org returned 403) — [Red Hat bug](https://bugzilla.redhat.com/show_bug.cgi?id=2466482)
  - `inkscape --export-type=png --export-width=1080 -o out.png in.svg` — [man page](https://man.archlinux.org/man/inkscape.1.en)
- **skia-python v144.0.post2 (2026-03-18)** — [skia-python releases](https://api.github.com/repos/kyamagu/skia-python/releases?per_page=2)
- **Pillow 12.3.0 (2026-07-01)** — [PyPI](https://pypi.org/project/pillow/)
- **WeasyPrint** has been PDF-only since v53 — [changelog](https://doc.courtbouillon.org/weasyprint/stable/changelog.html)
- **wkhtmltopdf** is archived — [GitHub API](https://api.github.com/repos/wkhtmltopdf/wkhtmltopdf)
- **Lightpanda** has "No graphical rendering engine" — [README](https://raw.githubusercontent.com/lightpanda-io/browser/main/README.md)
- Local check, 2026-10-13:
  - already on the Mac: rsvg-convert 2.62.3 (cairo 1.18.4, pango 1.58, harfbuzz 14.2.1), ImageMagick 7.1.2-8, Pillow 12.2.0, several cached Playwright Chromium and headless-shell builds
  - not installed: typst, resvg, inkscape and vips
  - Homebrew's catalogue lists typst 0.15.1, resvg 0.48.1, vips 8.18.7 and the inkscape cask 1.4.4 — [formulae.brew.sh](https://formulae.brew.sh/)

**Emoji licensing**
- **Twemoji** (jdecked fork, v17.0.3): the graphics are **CC-BY 4.0** and need attribution, which can sit in a README, About page or site footer — [jdecked/twemoji](https://github.com/jdecked/twemoji)
- **Noto Color Emoji** (2026-09-24, Unicode 18): the font is OFL-1.1 and the image assets are Apache-2.0 — [googlefonts/noto-emoji](https://github.com/googlefonts/noto-emoji)
- **OpenMoji** is CC BY-SA 4.0 — [openmoji](https://github.com/hfg-gmuend/openmoji)
- **Fluent Emoji** is MIT — [fluentui-emoji](https://github.com/microsoft/fluentui-emoji)
- **Apple Color Emoji:** the macOS Tahoe 26 licence lets fonts be used "to display and print content while running the Apple Software" and grants no right to distribute rendered emoji — [macOS Tahoe SLA](https://www.apple.com/legal/sla/docs/macOSTahoe.pdf). Apple has rejected apps that showed its emoji in marketing — [Apple dev forum, 2018](https://developer.apple.com/forums/thread/96853)

### Inferences
- **Playwright recipe for this pipeline (updated from round 1):**
  - One persistent browser. Viewport 1080×1350 or 1080×1920, `deviceScaleFactor: 1`.
  - Load local fonts with `@font-face` and await `document.fonts.ready`. Set a `window.__ready` flag after charts render.
  - `screenshot({type:'png', animations:'disabled', scale:'css'})`, then hand the PNG to sharp (§8).
  - Pin the Playwright version and choose either headless-shell or `channel:'chromium'` once, so output stays stable.
- **Emoji.** Put an explicit emoji font in every `font-family` stack. Noto Color Emoji is OFL, so no credit is needed. This stops Chromium from silently falling back to Apple Color Emoji or system fonts.
- **When Gotenberg is worth it.** Only if rendering must be an HTTP service or reproducible on Linux, for example if the review app later runs on a server. Its value is isolation, a pinned Linux Chromium and built-in quality checks (`failOnConsoleExceptions`, `failOnResourceLoadingFailed`). On a single Mac it costs a Docker daemon, about 0.5–0.7 GB, Chromium 152 against Playwright's 156, a flat asset folder and no `page.evaluate` data injection.
  - Claude would drive it with: `docker run --rm -p 3000:3000 gotenberg/gotenberg:8`, then `curl -F files=@index.html -F files=@Rubik.woff2 -F width=1080 -F height=1350 -F clip=true -F format=png -F waitForExpression=window.__ready===true …/forms/chromium/screenshot/html -o s1.png`.
- **Satori/Takumi.** No longer disqualified on z-index. They remain second choice because CSS coverage is still partial and any gap shows up as a silent rendering difference that an LLM author can't predict. Takumi's "never reads system fonts" is attractive for determinism if volume ever grows.
- **Typst.** A good alternate for dense typographic slides such as leaderboards and tables: excellent typesetting, tabular figures, variable fonts and deterministic multi-page carousels.
  - Exact size: `#set page(width:1080pt, height:1350pt, margin:0pt)` + `typst compile --ppi 72 in.typ 'out-{p}.png'`. This arithmetic is untested.
  - Its chart ecosystem (lilaq, cetz-plot 0.1.x) is too young for hero charts.
- **SVG rasterisation.** Inline SVG in the Chromium page gives the best fidelity. For standalone SVG files (e.g. badge art), resvg is deterministic and has variable-font and colour-font support. Avoid librsvg/sharp for SVG with much text; keep Inkscape as a fallback.
- **Pillow and Skia** belong in post-processing (contact sheets, overlays), not layout.

### Gaps
- Whether Chromium's encoders embed any colour chunk on their own (check with `exiftool -icc_profile:all`).
- How Chromium gamut-maps OKLCH or P3 colours that fall outside sRGB in screenshots (see §7 for one source).
- No speed benchmarks for any engine on the M3 Max.
- Not verified:
  - Satori's variable-font support
  - Takumi's `font-feature-settings`/COLR emoji support
  - whether Typst HTML export is still experimental
  - resvg's font-directory CLI flags (`--use-fonts-dir`, `--skip-system-fonts` are from memory)
  - Gotenberg's uncompressed image size
- Not researched: Browserless, html2image, Vivliostyle, CanvasKit, pycairo.
- Playwright and Inkscape release years and dates are partly inferred.

## 4. Design tools with programmatic or agent access (Penpot, Figma, pen.dev, Canva): is any worth adopting as an editable template source of truth?

### Takeaway
**No. Keep code templates, with design tokens in git, as the source of truth.**
- Every design tool checked needs a running GUI or browser tab, a cloud account, or both, to fill and export a template. Their files are binary, cloud-hosted or (for pen.dev) possibly encrypted, so they don't diff in git.
- **Figma** is worth keeping as a moodboard and sign-off surface. The owner draws reference frames; Claude reads them via the Figma MCP and rebuilds them as HTML.
- **pen.dev** is the most interesting experiment: it has a headless CLI with a deterministic `Update`, then `export_nodes` to JPEG. But it is 0.x, closed source and unpriced. Revisit in about six months.
- **Penpot** (open source) can't fill and export templates without a live editor tab.
- **Canva** (cloud) and **Affinity** (GUI-only) fail the local-only requirement.

### Cited Findings
**Penpot**
- The official MCP server now lives in the main repo; the standalone repo was archived on 2026-02-03. It is published on npm as `@penpot/mcp` — [glama summary](https://glama.ai/mcp/servers/penpot/penpot-mcp)
- It has five tools: `execute_code`, `high_level_overview`, `penpot_api_info`, `export_shape` and `import_image`. It needs "the Penpot plugin running in an active browser tab" and Node 22 — [help.penpot.app/mcp](https://help.penpot.app/mcp/)
- `execute_code` runs the full Plugins API, so it has write access — [ExecuteCodeTool.md](https://github.com/penpot/penpot-mcp/blob/develop/_autodocs/api-reference/ExecuteCodeTool.md)
- Export paths:
  - `export_shape` outputs PNG or SVG — [ExportShapeTool.md](https://github.com/penpot/penpot-mcp/blob/develop/_autodocs/api-reference/ExportShapeTool.md)
  - the Plugin API `shape.export()` outputs png, jpeg, webp, svg or pdf, with `scale` — [Penpot plugin docs](https://doc.plugins.penpot.app/interfaces/Export)
  - the exporter service has `/api/export` and job endpoints, uses puppeteer, and has no documented contract for outside callers — [exporter README](https://github.com/penpot/penpot/blob/develop/exporter/README.md); [architecture doc](https://github.com/penpot/penpot/blob/develop/docs/technical-guide/developer/architecture/exporter.md)
- Design tokens arrived in 2.6, and plugin access to them in 2.14 — [Penpot 2.14 notes](https://penpot.app/release-notes/2-14-come-together)
- 2.17 was out around July 2026 — [AlternativeTo](https://alternativeto.net/news/2026/7/design-tool-penpot-brings-background-blur-better-webgl-rendering-and-design-token-upgrades/)
- Custom fonts can be uploaded per team — [Penpot help](https://help.penpot.app/user-guide/custom-fonts/)
- A comparison article says Penpot's local MCP depends on the open editor — [DEV.to, 2026-08-04](https://dev.to/creeta/penpots-mcp-server-runs-on-five-tools-figmas-uses-dozens-354e)

**Figma**
- The MCP write tool `use_figma` runs Plugin-API JavaScript to create and edit frames, components and variables — [Figma write-to-canvas docs](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas)
  - Needs a Full seat; Dev seats are read-only.
  - Free during the beta, but will "eventually be a usage-based paid feature".
  - Limits: "Custom fonts aren't supported yet" and "No assets (image) support yet" — [Figma MCP guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- A community answer (2026-08-21) calls it "agent-in-a-client, not server-to-server… not a headless backend path today" — [Figma forum](https://forum.figma.com/ask-the-community-7/can-figma-mcp-be-used-for-programmatic-design-generation-seems-like-read-only-only-57148)
- MCP read limits: Starter plan and View/Collab seats get 20 tool calls a month. Dev/Full seats on Professional get 200 a day and 10 a minute — [Figma MCP rate limits](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/)
- REST `GET /v1/images/:key`: jpg, png, svg or pdf; scale 0.01–4; image URLs expire after 30 days — [file endpoints](https://developers.figma.com/docs/rest-api/file-endpoints/)
  - Tier-1 rate limits (effective 2025-11-17) are low on Starter files — [rate limits](https://developers.figma.com/docs/rest-api/rate-limits)
  - Professional users report multi-day `Retry-After` values — [forum](https://forum.figma.com/report-a-problem-6/rest-api-rate-limits-pro-plan-with-full-seat-still-getting-x-figma-rate-limit-type-low-and-multi-day-retry-after-51333)
- Professional plan pricing, from third-party sources: about $16 per Full seat and $12 per Dev seat a month, billed annually — [Banani](https://www.banani.co/blog/figma-pricing-and-credits)

**pen.dev (formerly Pencil)**
- An agent-oriented design canvas: VS Code/Cursor extension or desktop app, with MCP, WebMCP and a CLI. Exports PNG, JPEG, WebP or PDF at 1x/2x/3x, plus HTML. The company is High Agency Inc. — [pen.dev](https://www.pen.dev/)
- Pricing page, 2026-10-13 — [pen.dev/pricing](https://www.pen.dev/pricing):
  - "Coming soon… stays free until plans launch"
  - planned Free tier includes the CLI and headless editor
  - Pro $16 and Ultra $48 per user per month
- Local check, 2026-10-13:
  - installed `pen` CLI is 0.3.0; npm latest is 0.3.11 (2026-10-08), licence **UNLICENSED**
  - `pen interactive --out x.pen [--in tpl.pen]` calls tools without an AI step: `batch_design` (`Update(node,{content:…})`), `get_variables`, and `export_nodes({format: png|jpeg|webp|pdf, scale, quality})`, with default scale 2
  - the MCP server needs the desktop app running
  - the installed pen-design skill says the CLI needs a pen.dev login, or `PEN_CLI_KEY` in CI
- **Conflict on the file format:** the website calls `.pen` "a JSON file with a fully open schema" — [pen.dev](https://www.pen.dev/). The MCP server's own instructions say ".pen files are encrypted".

**Canva and Affinity**
- **Autofill API:** canva.dev now lists "Canva Pro, Teams or Enterprise", with MFA required and 60 requests a minute; "usage limits will be introduced in the future" — [Canva autofill guide](https://canva.dev/docs/connect/autofill-guide)
  - Older reference-app and connector pages still say Enterprise only, so this is unresolved — [Nourish reference app](https://www.canva.dev/docs/connect/reference-apps/nourish/); [Workato](https://docs.workato.com/en/connectors/canva-connect/create-design-autofill-action)
- **Export API:** PNG or JPG at 40–25,000 px; 75 exports per 5 minutes and 500 a day — [Canva export API](https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/)
- **Affinity** is free — [heise](https://heise.de/-10964820)
  - Its Claude connector (April 2026) has `execute_script`, `render_spread` and `render_selection`, and works only while the desktop apps run — [Affinity connector](https://claude.com/connectors/affinity-106b90)

**Hosted template-render APIs and Polotno**
- Entry prices from a vendor comparison blog (unverified): Templated $29/month, Placid $19/month, Bannerbear $49/month — [Templated blog](https://templated.io/blog/best-bannerbear-alternatives/)
- Polotno is free only for non-commercial use; commercial tiers are listed at $199–$899 a month. `polotno-node` renders its JSON templates server-side — [Polotno licence](https://polotno.com/license); [server-side docs](https://polotno.com/docs/server-side)

### Inferences
- **Why code templates win for an LLM agent:**
  - diffable and reviewable in git
  - byte-stable renders
  - exact fonts via local `@font-face`
  - no seats, rate limits or cloud dependency
  - Claude writes HTML/CSS more fluently than any design-tool scripting API
- **Why design-tool round-trips are lossy:** Figma's writer doesn't support custom fonts, which rules out Rubik in agent-written frames. Penpot needs a browser tab. pen.dev files may be encrypted.
- **Recommended pattern:**
  1. Keep design tokens in DTCG-style JSON in git, compiled to CSS variables. This is the true source of truth.
  2. Hold templates to the owner-approved look with Playwright screenshot regression tests.
  3. Optionally use Figma for the owner's sketches and sign-off. Claude reads them via the Figma MCP (`get_design_context`/variables) and rebuilds them in HTML.
- **When to revisit pen.dev:** if the owner wants to nudge layouts visually, pen.dev's headless `Update` → `export_nodes` loop is the closest fit to "editable template + deterministic export". Revisit once pricing, licence and file format are settled.

### Gaps
- Not checked:
  - Penpot's exporter request schema and auth for outside callers
  - whether `shape.export` gives exact pixels at scale 1
  - Penpot's SaaS pricing
- Figma: REST text-node editing, how server-side export handles custom fonts, the date `use_figma` becomes paid, and official seat prices.
- pen.dev: whether files are JSON or encrypted, whether headless mode needs a network connection, and the commercial EULA.
- Canva: Pro vs Enterprise for Autofill is unresolved.
- Practitioner evidence on Figma-template vs code-template pipelines is thin, because the search budget was exhausted.

## 5. 3D in the browser (three.js / react-three-fiber) as a Blender alternative for puzzle-piece visuals: headless GPU on macOS, and quality against Cycles/EEVEE

### Takeaway
Build **one procedural jigsaw generator**: a TypeScript port of Draradech's CC0 edge maths that emits closed per-piece Bézier outlines. Feed the same outline to three renderers:
- **SVG** for flat, on-brand pieces. This is the default, it is crisp and deterministic, and it works anywhere.
- **Blender Cycles** for photoreal hero stills, as in round 1.
- **three.js** rasterised in host Chromium on Metal for quick 3D stills and frame-by-frame Reels.

Browser path tracing (three-gpu-pathtracer) became WebGPU-only two weeks ago, so treat it as an experiment. Never run WebGL/WebGPU in Docker on macOS: there is no GPU there.

### Cited Findings
**three.js and react-three-fiber**
- **three.js r186** (released "24 Sep"; r183–r185 came in Feb, Apr and Jul; years inferred as 2026), MIT — [three.js releases](https://github.com/mrdoob/three.js/releases); [LICENSE](https://raw.githubusercontent.com/mrdoob/three.js/dev/LICENSE)
  - r186 removed the remaining `PCFSoftShadowMap` code; using it now only triggers a warning
- WebGPURenderer in early 2026: a user reported r182 WebGPU slower than WebGL with harder shadows. A forum regular said WebGPU is "still under active development" and that WebGLRenderer is fine without WebGPU-specific needs — [three.js forum](https://discourse.threejs.org/t/webgpu-significant-performance-drop-and-shadow-quality-regression-in-r182-vs-webgl-r170/89322)
- react-three-fiber: npm latest is **9.8.1**; v10 is alpha only. `<Canvas gl={{preserveDrawingBuffer:true}}>` and `frameloop="demand"` with `invalidate()` are supported — [npm](https://registry.npmjs.org/@react-three/fiber); [r3f canvas docs](https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/canvas.mdx)
- drei:
  - `AccumulativeShadows` with `RandomizedLight` is a soft-shadow catcher that accumulates over frames — [drei docs](https://github.com/pmndrs/drei/blob/master/docs/staging/accumulative-shadows.mdx)
  - `Environment` presets "rely on CDNs" and are "not meant for production", so a local pipeline should ship its own HDRI files — [drei Environment](https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx)
- `ExtrudeGeometry` takes `depth`, `bevelThickness`, `bevelSize`, `bevelSegments`, `curveSegments` (default 12) and a custom `UVGenerator`, and shapes accept `bezierCurveTo` — [three.js ExtrudeGeometry](https://github.com/mrdoob/three.js/blob/dev/docs/pages/ExtrudeGeometry.html)
- Post-processing:
  - N8AO is CC0 and WebGL2-only ("not yet compatible with WebGPU") — [N8AO](https://github.com/N8python/n8ao)
  - pmndrs/postprocessing is Zlib-licensed — [postprocessing](https://github.com/pmndrs/postprocessing)
- **three-gpu-pathtracer** — [CHANGELOG](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/CHANGELOG.md); [README](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/README.md); [WebGPU API](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/src/webgpu/API.md):
  - 0.0.25 (2026-09-28) added `WebGPUPathTracer`, deprecated `WebGLPathTracer` and requires three r185+. The current version is 0.0.27 (2026-10-08).
  - The README now says "The project requires WebGPU" and "Only MeshStandardMaterial and MeshPhysicalMaterial are supported".
  - Offline stills: call `renderSample()` until `getSampleCountsAsync().min >= maxSamples`, then wait for the optional OIDN denoiser.

**Headless GPU on macOS**
- Playwright adds no GPU, ANGLE or SwiftShader flags of its own — [chromiumSwitches.ts](https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright-core/src/server/chromium/chromiumSwitches.ts)
- A Chromium developer (2023-03): "headless mode uses SwiftShader by default", "swiftshader's support for WebGL is currently disabled on Arm", and `--enable-gpu` works from Chrome 112. This is dated — [chromium-dev](https://groups.google.com/a/chromium.org/g/chromium-dev/c/8eR2GctzGuw)
- Third-party evidence (2026-10-10): Playwright's headless shell with `--use-angle=metal --ignore-gpu-blocklist` reported `ANGLE Metal Renderer: Apple M2 Max`, at 2.7 ms per frame against 49–58 ms per frame with SwiftShader at 512×512 — [game-harness PR #34](https://github.com/jbcom/game-harness/pull/34)
- A guide (2026-09-30) warns that `--enable-gpu` does not guarantee GPU use, so verify at runtime — [screenshotneo](https://screenshotneo.com/blog/enable-headless-chromium-gpu-playwright/)
- WebGL2 stalls on GitHub's virtualised macOS runners, but the same app passes on a physical M1 Max — [runner-images #14840](https://github.com/actions/runner-images/issues/14840)
- Headless WebGPU needs `--enable-unsafe-webgpu`, and a cold browser may return a null adapter, so retry. This is vendor documentation — [agent-browser WebGPU notes](https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/references/webgpu.md)
- The automatic SwiftShader fallback for WebGL is deprecated, and from M139 context creation fails instead. Opting in requires `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader` — [Chromium SwiftShader doc](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md); [Intent to Remove](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM/m/oLrB5up_BwAJ)
- Docker Desktop's GPU passthrough is "only available on Windows with the WSL 2 backend" — [Docker docs](https://docs.docker.com/desktop/features/gpu/)

**Procedural jigsaw generators**
- **Draradech/jigsaw** is CC0, except its save function, which the author calls "probably cc-by-sa" — [repo](https://github.com/Draradech/jigsaw); [jigsaw.html](https://raw.githubusercontent.com/Draradech/jigsaw/master/jigsaw.html)
  - Each edge is three cubic Béziers with tab size `t` and seeded jitter
  - Each cut line is generated once and shared by both neighbouring pieces, so pieces interlock by construction
  - The output is cut lines, not closed pieces
- **headbreaker 3.0.0** is ISC: Tab/Slot/flat sides, rendered via Konva, with no documented SVG export — [npm](https://registry.npmjs.org/headbreaker/latest); [docs](https://flbulgarelli.github.io/headbreaker/)
- Others, from search results only:
  - [pyjigsaw](https://pypi.org/project/pyjigsaw/0.0.3) (MIT, SVG)
  - [piecemaker](https://awesome.ecosyste.ms/projects/github.com%2Fjkenlooper%2Fpiecemaker) (LGPL-3.0)
  - [samchristywork/jigsaw-puzzle-generator](https://github.com/samchristywork/jigsaw-puzzle-generator) (GPLv3)
  - [Puzzle.SVG](https://github.com/JLChnToZ/Puzzle.SVG) (MIT)
- Round 1 noted that MSP's badge toolkit already has a `jigsaw_piece()` helper (shapely/SVG) — [tools/badge-art/README.md](https://github.com/MySpeedPuzzling/myspeedpuzzling.com/blob/main/tools/badge-art/README.md)

### Inferences
- **Geometric correctness comes from the generator, not the renderer.** One generator gives one source of truth for piece shapes. Its outputs are:
  - SVG `d` strings for 2D
  - `THREE.Shape` + `bezierCurveTo` for extrusion (`curveSegments` ≥ 48 to avoid faceted tabs)
  - JSON control points for Blender (`bpy` curve, extrude, bevel)

  First reconcile it with the existing badge-toolkit `jigsaw_piece()` so there is only one piece shape across MSP.
- **Crispness** fixes the "blurry pieces" rejection. SVG pieces in Chromium are vectors. For 3D, render at 2× (2160×2700) and downscale with Lanczos.
- **Quality ranking for photoreal cardboard pieces (opinion, no practitioner source found):**
  1. Blender Cycles: best materials, depth of field and caustics.
  2. three-gpu-pathtracer WebGPU: young, materials limited to Standard/Physical.
  3. three.js rasterised (MeshPhysicalMaterial + local HDRI + non-temporal AccumulativeShadows + N8AO): clean "product render lite", seconds per frame.

  For MSP's flat, outlined house style, 2D SVG pieces, or Blender toon/Freestyle as tested in the badge lab, are likely more on-brand than photoreal.
- **How Claude drives three.js headlessly on the host Mac:**
  - Launch: `chromium.launch({args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu','--enable-unsafe-webgpu']})`.
  - Probe the `UNMASKED_RENDERER_WEBGL` string and abort if it isn't Metal.
  - Wait on `window.__RENDER_DONE__`, set after textures, HDRI and shadow accumulation (or path-tracer samples) finish.
  - Screenshot to PNG.
  - Use plain three.js in a single HTML file rather than r3f, so there is no React build.

### Gaps
- No practitioner comparison of three.js against Cycles or EEVEE was found.
- The headless-Metal evidence comes from someone else's M2 Max with unstated versions. It needs a ten-line probe on the M3 Max with Playwright 1.64.
- Not verified: headless-shell vs `channel:'chromium'` behaviour on Metal/WebGPU; whether drei AccumulativeShadows works under WebGPURenderer; the r3f v10 timeline; the Poly Haven HDRI licence (believed CC0).
- Spline, Babylon.js, Godot and Blender Grease Pencil/Freestyle were not researched in this round.

## 6. Decorative and generative layers: what adds warmth without looking like slop?

### Takeaway
Use **restrained, code-native texture**:
- luminance-only SVG `feTurbulence` grain on large flat colour fields
- pure-CSS halftone on hero shapes
- a riso look made from 2–3 brand "inks" with `mix-blend-mode: multiply` and a small misregistration offset

Keep a fixed seed so a series stays consistent. Never put texture under text or chart marks, because faint fine grain turns to JPEG mush after Instagram re-encodes it. Generative libraries (p5.js 2.x, canvas-sketch) are for occasional one-off backgrounds, not templates.

### Cited Findings
- Libraries — [npm registry](https://registry.npmjs.org/):
  - **p5.js 2.3.4** (2026-09-25), LGPL-2.1. The 1.x line has been "feature-frozen for over a year" — [p5.js releases](https://github.com/processing/p5.js/releases)
  - **canvas-sketch 0.7.8** (2026-05-26), MIT, still marked "[beta]" — [repo](https://github.com/mattdesl/canvas-sketch)
  - **Paper.js 0.12.18** (2024-07-17), MIT
  - **roughjs 4.6.6** (2023-11-20), MIT
  - **grained 0.0.2** (2017), abandoned
  - **p5.riso** has Riso ink layers, `halftoneImage()`, `ditherImage()` and `exportRiso()`; p5 2.x support is unconfirmed — [p5.riso](https://antiboredom.github.io/p5.riso/)
- **Grainy gradients:** `feTurbulence type=fractalNoise baseFrequency=0.65 numOctaves=3 stitchTiles=stitch` under a gradient, with `filter: contrast(170%) brightness(1000%)`. Blink and WebKit differ — [CSS-Tricks, 2021-09-13](https://css-tricks.com/grainy-gradients/)
- **Pure-CSS halftone:** `radial-gradient(closest-side,#777,#fff) 0/1em 1em space` + `linear-gradient` + `background-blend-mode: multiply` + `filter: contrast(16)`. Large dots blur at the edges — [Ana Tudor, 2024-12-03](https://blog.master.dev/pure-css-halftone-effect-in-3-declarations/)
- **Gradients:** RGB interpolation passes through a "gray dead zone". Use `linear-gradient(in oklch, …)` — [Josh Comeau, updated 2025-10-28](https://www.joshwcomeau.com/css/make-beautiful-gradients/)
- **Tyler Hobbs:** probability-weighted palettes (e.g. 70/20/10) with small single-channel jitter — [Working with color, 2016](https://www.tylerxhobbs.com/words/working-with-color-in-generative-art). Watercolour from many low-opacity deformed layers — [2017](https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art)
- **Local check, ImageMagick 7.1.2-8:** a 1080×1350 coral→indigo gradient with text, plus Gaussian grain. "IG-sim" is a second encode at q75 4:2:0, a stand-in for Instagram, not its real encoder.

| Grain (attenuate) | q92 4:4:4 | after IG-sim |
|---|---|---|
| 0 | 65 KB | 24 KB |
| 0.05 | 95 KB | 25 KB |
| 0.15 | 262 KB | 49 KB |
| 0.30 | 593 KB | 104 KB |

  - At 0.15–0.3, 40–47% of the grain energy was lost after IG-sim.
  - At 0.05, the second-pass error exceeded the grain itself.

### Inferences
- **Grain recipe:**
  - luminance-only (`feColorMatrix` to desaturate)
  - coarse (`baseFrequency` about 0.5–0.8 at 1×)
  - 6–12% opacity, `multiply` or `soft-light`
  - large flat fields only, fixed seed
  - prefer flat fields or `in oklch` gradients over long smooth gradients, which band after re-encoding
- **rough.js** only for hand-drawn annotation circles and arrows, never for data marks. It may suit "highlight this record" callouts if the owner likes it.
- **Generative backgrounds** (p5 2.x, canvas-sketch) should be rendered once to PNG, curated by the owner, and reused as a small texture library. That matches round 1's "made once and reused" approach and avoids per-post randomness, which reads as slop.
- **On-brand riso and halftone** use only brand inks (coral, indigo, sky on an off-white "paper" field). This adds warmth without new hues.

### Gaps
- No 2025–26 practitioner source on texture surviving Instagram's encoder. The local IG-sim is a proxy.
- "svg-noise" was not researched.
- No owner-validated reference for which texture style fits MSP; needs a bake-off.

## 7. Colour and typography tooling: OKLCH, palette generators, contrast, data scales, variable fonts and numerals, font pairings with Rubik

### Takeaway
Generate every tint, shade and data ramp **once, at build time, in OKLCH with culori**. Gamut-map explicitly, because Chromium clips rather than maps. Validate with WCAG 2 contrast (APCA only as advice), and freeze the results as hex CSS tokens.

Two brand facts constrain design:
- **Coral (2.92:1) and sky (2.22:1) fail as text on white.** Coral on navy only passes for large text.
- **Rubik's default digits are proportional**, so `font-variant-numeric: tabular-nums` is mandatory on axes, tables, times and counters. Rubik has lining figures only.

### Cited Findings
**Colour**
- CSS Color 4 asks for gamut mapping by reducing chroma in OKLCH, but "Chrome and Safari use the fast, but inaccurate, clipping method" — [Evil Martians, 2025-09-17](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- `color-mix()` defaults to `in oklab` and has been Baseline widely available since May 2023 — [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- **culori 4.0.2** (2025-06-27, MIT): `toGamut('rgb','oklch')`, `clampChroma`, `interpolate(...,'oklch')`, `wcagContrast`, `differenceEuclidean('oklab')` — [culori API](https://culorijs.org/api/)
- **chroma.js 3.2.0** (2025-11-28; npm licence "(BSD-3-Clause AND Apache-2.0)") — [chroma.js](https://github.com/gka/chroma.js)
- **colorjs.io 0.7.1** (2026-07-24, MIT) — [npm registry](https://registry.npmjs.org/colorjs.io)
- **Adobe Leonardo** (`@adobe/leonardo-contrast-colors` 1.1.0, 2026-02-18, Apache-2.0) supports `OKLCH`/`OKLAB`/`CAM02` colour spaces. `formula: 'wcag3'` switches to APCA; this comes from its source code, not the README — [adobe/leonardo](https://github.com/adobe/leonardo)
- **APCA** (`apca-w3` 0.1.9, 2022) is under a "Limited W3 License", beta, and "being evaluated" — [apca-w3](https://github.com/Myndex/apca-w3)
- Data-viz palette guidance from Lisa Charlotte Muth — [Datawrapper, 2022-03-30](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides):
  - vary lightness between categorical colours
  - use darker or desaturated brand colours for big areas and saturated ones for lines and dots
  - grey for "other" and context
  - sequential scales need a wide lightness range plus a slight hue shift
  - test with colour-blindness simulators
- d3-scale-chromatic 3.1.0 includes viridis and cividis. Observable Plot ships Observable10, Tableau10, Viridis and Cividis — [Plot scales docs](https://github.com/observablehq/plot/blob/main/docs/features/scales.md)
- **Brand colour analysis (researcher's calculation, sRGB/WCAG 2):**

| Colour | OKLCH | On white | On navy |
|---|---|---|---|
| coral #EC726F | 69.5% 0.152 23° | **2.92** | 4.29 |
| indigo #4e54c8 | 50.8% 0.177 276° | 6.13 | 2.04 |
| sky #69b3fe | 75.0% 0.132 250° | **2.22** | 5.64 |
| navy #2b3445 | 32.4% 0.033 263° | 12.5 | n/a |

  The weakest pair under a deuteranopia simulation is coral vs sky (Oklab distance about 0.204), because their lightness is close. WCAG thresholds are 4.5:1 for normal text and 3:1 for large text — [W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

**Typography**
- **Rubik** — [google/fonts METADATA.pb](https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/METADATA.pb):
  - `Rubik[wght].ttf` is v2.300 with a `wght` axis of 300–900, plus an italic variable font; OFL
  - the source repo googlefonts/rubik was archived on 2024-08-26 — [googlefonts/rubik](https://github.com/googlefonts/rubik)
  - `@fontsource-variable/rubik` 5.3.0 (2026-07-19, OFL) is available for offline installs — [npm registry](https://registry.npmjs.org/@fontsource-variable/rubik)
- **Rubik's OpenType features (local check with fontTools, Rubik v2.300 static TTF and the Google Fonts latin woff2):**
  - GSUB includes `tnum`, `pnum`, `case`, `frac`, `zero`, `sups`, `sinf`, `numr`, `dnom`, `ordn`, `dlig`, `liga`, `locl`
  - **no `lnum` or `onum`**, so figures are lining only
  - **default digit advance widths vary** (proportional figures)
  - the Google Fonts latin woff2 subset keeps `tnum` but drops `case`, `zero` and `sups`, so self-host the full font if those are needed
  - the parallel research recorded the same: digit widths 39.8–61.8 units by default, all 60.0 with `tnum`
- Numerals in charts: use lining, tabular figures. Avoid condensed fonts for labels, and text under about 12 px is likely too small — [Datawrapper, 2022-09-12](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- Pairing candidates (all OFL per google/fonts METADATA; `tnum` support in these was not checked) — [google/fonts](https://github.com/google/fonts):

| Role | Fonts |
|---|---|
| Serif | Fraunces (SOFT, WONK, opsz, wght); Newsreader (opsz 6–72, wght 200–800); Source Serif 4 (opsz 8–60); Literata (opsz 7–72) |
| Mono | JetBrains Mono; IBM Plex Mono; Roboto Mono |
| Condensed / narrow | Roboto Condensed; Barlow Condensed; Inter Tight |

### Inferences
- **Palette build script (Node, culori):**
  1. Define brand hues and their tints and shades in OKLCH.
  2. Map them into sRGB with `toGamut('rgb','oklch')` and freeze them into `tokens.css`.
  3. Gate every text/background pair at 4.5:1 (3:1 for ≥24 px or bold ≥18.7 px), with Leonardo `wcag3` as an advisory check.
  4. Categorical order: indigo → coral → navy-grey → sky, never coral next to sky.
  5. Neutral grey (about #8a93a6, untested) for "other" and context.
  6. Sequential ramp: light sky → indigo → navy. Diverging: coral → near-white → indigo.
  7. Fall back to cividis or viridis when more steps are needed.
- **Coral as an accent.** Coral works as an accent fill, a highlight bar or large display text on navy. It should never be small text on white. For a coral-coloured number on white, use a darker coral shade from the OKLCH ramp that passes 4.5:1.
- **Type system:**
  - Rubik for everything, with `tabular-nums` on numbers and `"case"` on all-caps labels.
  - Optionally one serif (Newsreader or Source Serif 4) for editorial headlines, to separate "story" slides from "data" slides. Fraunces is warmer and riskier.
  - No condensed face.
  - JetBrains Mono only if big race-time numerals need a stopwatch look.

### Gaps
- `tnum` in the pairing fonts was not checked.
- The Okabe-Ito hex values were not verified from the primary page, which shows only an image.
- The colour-blindness distances use approximate simulation matrices.
- No owner preference on adding a serif is recorded.

## 8. Image post-processing for Instagram: libvips/sharp, ImageMagick, mozjpeg/jpegli, sharpening and sizing to survive recompression

### Takeaway
1. Capture **PNG** from Chromium.
2. Encode once with **sharp 0.35** (or the ImageMagick already installed) to **JPEG q92–95, 4:4:4 chroma, sRGB ICC attached, exactly 1080 px wide**.

4:4:4 matters for coral and indigo text. In a local simulation it stayed better even after a 4:2:0 re-encode standing in for Instagram's. Encoder efficiency (mozjpeg, jpegli) is irrelevant: files are 50–600 KB against an 8 MB limit, and Instagram re-encodes anyway. jpegli is not available on this Mac. Instagram's real recompression settings remain unverified.

### Cited Findings
- **Instagram API image rules:** JPEG only; ≤8 MB; aspect ratio **4:5 to 1.91:1**; width 320–1440, with wider images scaled down; sRGB, with other colour spaces converted — [IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
  - A 3:4 image (1080×1440) is therefore outside the API's feed range, even though the app gained 3:4 posting in 2025 per a secondary source — [inro.social](https://www.inro.social/blog/instagram-post-size)
- **What Instagram does to uploads:** no primary Meta source was found. Vendor blogs (unverified) claim it resizes to 1080 wide, re-encodes at about q70–85, strips EXIF and converts to sRGB — [sammapix](https://www.sammapix.com/blog/instagram-image-quality-loss-fix); [igcompressor](https://www.igcompressor.com/blog/why-does-instagram-compress-photos)
  - One vendor claims 4:2:0 or 4:2:2 without testing — [socialrails](https://socialrails.com/blog/instagram-photo-quality-optimization-guide)
  - Meta's Spectrum library (2019) wraps MozJpeg for client-side transcoding in its apps, without naming Instagram — [engineering.fb.com](https://engineering.fb.com/2019/01/17/developer-tools/spectrum/)
- **Local simulation (ImageMagick):** coral, indigo and navy text at 18–28 px, PSNR against the source:

| Upload | No re-encode | After a second q75 4:2:0 pass |
|---|---|---|
| q92 4:4:4 | 45.3 dB | **35.4 dB** |
| q92 4:2:0 | 38.6 dB | 33.8 dB |

- **sharp 0.35.5** (2026-09-27), Apache-2.0 — [sharp changelog](https://sharp.pixelplumbing.com/changelog/v0.35.5/); [sharp output docs](https://sharp.pixelplumbing.com/api-output)
  - JPEG defaults are **quality 80 and 4:2:0**, so set `chromaSubsampling:'4:4:4'`
  - `mozjpeg:true` is available, the default resize kernel is `lanczos3` (`mks2021` also exists), and `withIccProfile('srgb')` converts and attaches the profile
  - The prebuilt libvips for darwin-arm64 (`@img/sharp-libvips-darwin-arm64` 1.3.4) is LGPL-3.0-or-later, and the sharp-libvips main branch pins vips 8.18.7 and mozjpeg — [sharp-libvips versions](https://raw.githubusercontent.com/lovell/sharp-libvips/main/versions.properties)
- **libvips**
  - 8.18 (2025-12-04) added UltraHDR, camera RAW and Oklab/Oklch — [libvips blog](https://www.libvips.org/2025/12/04/What's-new-in-8.18.html)
  - 8.17 added the mks2021 kernel — [libvips blog](https://www.libvips.org/2025/06/05/What's-new-in-8.17.html)
  - `jpegsave` defaults to Q 75, and "chroma subsampling is normally automatically disabled for Q >= 90" — [jpegsave API](https://www.libvips.org/API/current/method.Image.jpegsave.html)
- **ImageMagick 7.1.2-8 (local check):** q ≤ 89 gives 4:2:0 by default, q ≥ 90 gives 4:4:4, and `-sampling-factor 4:4:4` forces it. libjpeg-turbo `cjpeg` 3.1.4 rejects PNG input, so pipe it through PPM.
- **mozjpeg:** GitHub's latest tagged release is v4.1.1; Homebrew stable is 4.1.5. Development activity is low — [mozjpeg releases](https://github.com/mozilla/mozjpeg/releases)
- **jpegli**
  - Google claims about 35% better compression at high quality — [Google open-source blog, 2024-04-03](https://opensourceblog.googleblog.com/2024/04/introducing-jpegli-new-jpeg-coding-library.html)
  - libjxl 0.12.0 removed it; it is "now maintained as a separate project at google/jpegli", which is BSD-3 with no tagged releases — [libjxl releases](https://github.com/libjxl/libjxl/releases); [google/jpegli](https://github.com/google/jpegli)
  - Local check: the installed Homebrew jpeg-xl (0.11.1) ships no `cjpegli` binary, and there is no jpegli formula
- **Chromium `--force-color-profile=srgb`** treats all monitors as having that profile — [Chromium switches list](https://peter.sh/experiments/chromium-command-line-switches/). It is already a Playwright default (§3).

### Inferences
- **Primary encode (sharp):** `sharp('s.png').withIccProfile('srgb').jpeg({quality:93, chromaSubsampling:'4:4:4', optimiseCoding:true}).toFile('s.jpg')`
  - If rendering at 2×, add `.resize(1080,1350,{kernel:'lanczos3'})` before encoding. Add `.sharpen({sigma:0.5})` only if a phone A/B test shows softness.
- **Fallback, zero install:** `magick s.png -strip -colorspace sRGB -sampling-factor 4:4:4 -quality 93 -define jpeg:optimize-coding=true s.jpg`
  - The untagged output is read as sRGB.
  - Optionally add `-profile sRGB.icc` to tag it explicitly.
- **vips CLI equivalent:** `vips copy s.png 's.jpg[Q=93,subsample_mode=off,optimize_coding,keep=none]'`
- **Preflight per file:** `magick identify -format "%wx%h %[jpeg:sampling-factor] Q=%Q %b\n" s.jpg`. Expect `1080x1350 1x1,1x1,1x1 Q=93`, under 8 MB. Run it as part of the QA gate.
- **Upload rules:**
  - exactly 1080 wide; 1440 only after an A/B test (round 1 left this open)
  - q92–95, 4:4:4
  - no faint fine grain
  - no small coral or sky text

### Gaps
- Instagram's actual re-encode settings are unverified: quality, subsampling, whether 1440 px uploads are kept, and how untagged or P3 JPEGs are handled. The fix is a private test account: upload 1080 and 1440 variants, download them, and inspect with `identify`.
- No independent 2025–26 jpegli vs mozjpeg benchmark was found. This is moot for this use case.
- Inferred dates: the vips version inside the sharp-libvips 1.3.4 binary; the libjxl 0.12.0 year; sharp 0.35's Node requirement (search snippet only).

## 9. Recommended coherent toolchain: primary and alternates per job, how Claude Code drives each, footprint, licence and maturity

### Takeaway
One Chromium page is the **single composition surface**: HTML/CSS layout, inline Plot or D3 SVG, CSS-grid tile maps, SVG puzzle pieces and SVG/CSS texture. Build-time tooling around it:
- **culori** for tokens
- a **jigsaw generator** for piece geometry
- **sharp** for the final JPEG

Specialists are called only when a job needs them:
- R/ggplot2 (in Docker) for statistical forms
- Blender for hero 3D
- three.js on host Metal for quick 3D or Reels
- Typst for dense typeset tables

Design tools stay outside the render path. Several round-1 assumptions changed this round; they are listed under Cited Findings.

### Cited Findings
- **Corrections to round 1, all sourced in §1–§8:**
  - Satori now uses Taffy and supports z-index — [Satori README](https://raw.githubusercontent.com/vercel/satori/main/README.md)
  - Observable Plot hasn't released since 0.6.17 (2025-02-14) — [npm](https://www.npmjs.com/package/@observablehq/plot)
  - Chromium screenshots are untagged and JPEG subsampling can't be controlled, so capture PNG — [page_handler.cc](https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/protocol/page_handler.cc)
  - Playwright already forces sRGB — [chromiumSwitches.ts](https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright-core/src/server/chromium/chromiumSwitches.ts)
  - three-gpu-pathtracer is now WebGPU-only — [CHANGELOG](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/CHANGELOG.md)
  - Datawrapper changed its plans and introduced API billing on 2026-10-01 — [Datawrapper pricing](https://www.datawrapper.de/pricing)
  - jpegli left libjxl — [libjxl releases](https://github.com/libjxl/libjxl/releases)
- **Footprints:**
  - Playwright's Chromium builds are already cached on the Mac (local check)
  - Gotenberg image: about 0.5–0.7 GB — [Docker Hub](https://hub.docker.com/v2/repositories/gotenberg/gotenberg/tags?page_size=8&name=8.3)
  - `rocker/r-ver` arm64: 353.7 MB — [Docker Hub](https://hub.docker.com/v2/repositories/rocker/r-ver/tags?page_size=5)
  - vl-convert wheel: about 40 MB — [PyPI](https://pypi.org/project/vl-convert-python/)
  - ECharts: 60 MB unpacked; Plot 1.5 MB; d3 0.87 MB — [npm registry](https://registry.npmjs.org/)

### Inferences
**Recommended toolchain** (versions and licences as of 2026-10-13, sourced in the sections above):

| Job | Primary | Alternates | How Claude Code drives it | Footprint / licence / maturity |
|---|---|---|---|---|
| Layout and composition | **Playwright 1.64 + Chromium 156**: HTML/CSS templates, 1080×1350 / 1080×1920, `deviceScaleFactor:1`, PNG capture | Gotenberg 8.37 (HTTP, Docker) if a service is needed; Takumi 2.15 (browser-free); Typst 0.15 for leaderboards and tables | Node script: `chromium.launch()` → `newPage({viewport})` → `goto(file://…?data=…)` → `document.fonts.ready` + `window.__ready` → `screenshot({type:'png'})` | Already cached; Apache-2.0; very mature |
| Everyday charts | **Observable Plot 0.6.17** inline in the page | Vega-Lite 6 + vl-convert 1.9 CLI (JSON specs) | `Plot.plot({...})` appended into the template; CSS vars for theme | ~1.5 MB; ISC; stable, slow releases |
| Hero and bespoke charts, ridgelines | **D3 v7 modules** writing SVG | LayerChart 2.7 (Svelte 5 build); ggplot2 4.0.3 + ggridges/ggbeeswarm/ggdist → svglite SVG | Hand-written D3 in the template; R via `docker run rocker/r-ver Rscript render.R` | d3 ~0.9 MB, ISC; R image ~354 MB, MIT/GPL packages |
| Annotations | **Plot `arrow`/`text`/`tip`** + hand-built SVG callouts | rough.js for hand-drawn circles only | Template components (callout, label-with-leader) in the design system | Avoid d3-annotation (unmaintained since 2019) |
| Unusual forms | Plot `dodgeY` (beeswarm), `waffleY`, facets, highlighted `rectY(binX)` | D3 force / KDE; ECharts 6 jitter; RAWGraphs core 1.0 inside the page | As above | RAWGraphs Apache-2.0, stable 1.0 only since 2026-10-08 |
| Country comparisons | **CSS-grid tile map** from a hand-tuned `tilegrid.json` (seeded from geofacet, MIT) + **circle-flags** (MIT) + ranked bar or dot charts | visionscarto-world-atlas 50m + d3-geo Equal Earth + d3-force Dorling + Europe inset; geoviz 1.0.7 | JSON layout → CSS grid → Playwright | Avoid world-atlas, Bertin, MapLibre basemaps |
| Puzzle pieces | **Shared TS jigsaw generator** (Draradech CC0 maths) → SVG pieces | Blender 5.x Cycles hero stills from the same JSON; three.js r186 on host Metal | `node gen-pieces.ts --seed` → SVG / `THREE.Shape` / bpy JSON; Chromium with `--use-angle=metal` | Generator ~150 LOC; MIT three.js; run 3D on the host, not in Docker |
| Texture and warmth | **SVG `feTurbulence` grain** (luminance, coarse, fixed seed), CSS halftone, riso multiply/offset | p5.js 2.3 / canvas-sketch one-off backgrounds, curated into a texture library | CSS/SVG snippets in the design system | No install; p5 LGPL-2.1 |
| Colour tokens | **culori 4.0** build script → gamut-mapped hex `tokens.css` + WCAG 2 gate | Leonardo 1.1 (contrast ramps, APCA advisory); chroma.js 3.2; cividis/viridis fallback | `node build-tokens.mjs` | MIT/Apache-2.0 |
| Typography | **Rubik variable** (self-hosted full font) with `tabular-nums` and `case` | Newsreader or Source Serif 4 for editorial headlines; JetBrains Mono for time displays | `@font-face` from local files; no system fonts | OFL |
| Emoji | **Noto Color Emoji** pinned in every font stack | Twemoji (CC-BY, credit on site/About) | `@font-face` | OFL; never Apple Color Emoji |
| SVG rasterisation (standalone) | **resvg 0.48** CLI | Inkscape 1.4.4; avoid librsvg for text-heavy SVG | `resvg -w 1080 in.svg out.png` | Apache/MIT; Homebrew install |
| JPEG encode and preflight | **sharp 0.35.5**: q93, 4:4:4, sRGB ICC | ImageMagick 7 (installed); vips CLI | Node one-liner; `magick identify` preflight | Apache-2.0 (+ LGPL libvips binary) |
| Design source of truth | **DTCG token JSON + HTML templates in git**, Playwright screenshot regression | Figma (moodboard and sign-off via MCP read); pen.dev (revisit) | Claude edits tokens and templates; owner reviews renders | No seats; Figma/pen.dev paid or unpriced |

**Order of adoption:**
1. Tokens build (culori) and Rubik `tabular-nums` fix.
2. PNG→sharp encode with 4:4:4.
3. Emoji font pin.
4. Tile map and circle-flags.
5. Jigsaw generator → SVG pieces.
6. Optional R container for distribution posts.
7. three.js-on-Metal probe.
8. Texture library bake-off with the owner.

**Install delta from what is already on the Mac** (all free):
- npm: `sharp`, `culori`, `@observablehq/plot`, `d3`, `circle-flags`, `visionscarto-world-atlas`
- optionally `brew install resvg typst vips`
- optionally the `rocker/r-ver` Docker image

### Gaps
- Nothing in this toolchain has been benchmarked on the M3 Max. Render times are unmeasured.
- The premium-look rankings are expert opinion. No rendered bake-off was done in this research. A small lab would settle it: the same post via Plot, Vega-Lite, ggplot2 and Datawrapper, judged by the owner.
- Still open:
  - Instagram's recompression behaviour, which needs a private-account test
  - the owner's taste on serif pairing, texture and 2D vs 3D pieces
