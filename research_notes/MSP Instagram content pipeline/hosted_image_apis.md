# Hosted image-generation APIs and anti-"AI slop" art direction for the MySpeedPuzzling Instagram pipeline (state as of 2026-10-13)

All pages were retrieved on **2026-10-13** unless a different date is noted. Prices are in **USD** as published. Image-model prices and names change month to month, so check each one again before committing budget. "(unverified)" means the figure comes only from a third-party or reseller page.

Volume assumption used throughout: 15–30 final images/week × 3–4 candidates = **45–120 generations/week ≈ 200–520/month**. Allowing for re-rolls and edits, the working range is **~200 / ~400 / ~650 generations per month**.

---

## 1. Provider-by-provider comparison: price at ~4:5, edit price, free tier, aspect ratios, text accuracy, brand-consistency features, editing, latency, terms, automation, provenance

### Takeaway
In October 2026 the price/quality frontier is led by **Google's Gemini Nano Banana 2.1** (released 2026-10-06, $0.0336/1K image, $0.0168 in batch). It ranks #4 for text-to-image and #4 for editing on Artificial Analysis. **OpenAI GPT Image 2.5 (Flare/Sunburst)** has the top quality but costs about $0.21/image at max settings. **Recraft** is the only mainstream API with native SVG/vector output and reusable custom "styles". **Meta Muse Image** costs $0.01/image and ranks in the top 10, but its terms and EU availability are unverified. **Midjourney still has no official API, and its rules forbid automation**, so it doesn't fit an automated pipeline. Every OpenAI and Google output carries invisible SynthID watermarks plus C2PA metadata. That metadata is exactly what Meta's "AI info" labelling reads.

### Cited Findings

#### OpenAI GPT Image (direct API)
- **Current lineup and token prices (standard, per 1M tokens):**

  | Model | Image input | Image output |
  |---|---|---|
  | gpt-image-2.5-sunburst | $8 | $30 |
  | gpt-image-2.5-flare | $8 | $30 |
  | gpt-image-2 | $8 | $30 |
  | gpt-image-1.5 | $8 | $32 |
  | gpt-image-1-mini | $2.50 | $8 |
  | gpt-image-1 | $10 | $40 |

  Batch rates are exactly half. — [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- **Per-image cost table** (OpenAI's "legacy" table, which doesn't cover 2.5):

  | Model | Size | Low | Medium | High |
  |---|---|---|---|---|
  | GPT Image 2 | 1024×1024 | $0.006 | $0.053 | $0.211 |
  | GPT Image 2 | 1024×1536 (portrait) | $0.005 | $0.041 | $0.165 |
  | GPT Image 1 Mini | 1024×1536 | $0.006 | $0.015 | $0.052 |
  | GPT Image 1.5 | 1024×1536 | $0.013 | $0.05 | $0.20 |

  — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **GPT Image 2.5:** Flare and Sunburst "use the same token rates," but "equal token rates don't mean equal cost per image." OpenAI recommends the 2.5 models for new integrations. — [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Launch and positioning:** GPT Image 2.5 launched 2026-09-08. OpenAI's announcement: "sharper detail, stronger style adherence, and more control over edits." — [OpenAI Developers on X](https://x.com/OpenAIDevs/status/2097399255975813387)
  - Flare is the fast everyday model, with about 50% lower latency than GPT Image 2 (secondary coverage). — [OrcaRouter](https://www.orcarouter.ai/blog/gpt-image-2-5-flare-sunburst), [aicatchup](https://aicatchup.com/news/openai-chatgpt-images-2-5-gpt-image-2-5)
  - Sunburst is for cases "where editing precision matters most." — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)
  - Both add `xhigh` and `max` quality levels. — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Sizes:**
  - Recommended sizes are 1024×1024, 1536×1024 and 1024×1536.
  - The 2.5 models accept custom W×H sizes if: both edges are multiples of 16, the ratio is between 1:3 and 3:1, no edge exceeds 3840 px, and the total is 655,360–8,294,400 px.
  - — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Editing:**
  - Supports edits, generation from multiple reference images, and masks. Masking is prompt-guided: the model "may not follow its exact shape with complete precision."
  - Responses API supports multi-turn editing.
  - — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)
  - Up to 16 reference images per request. — [OpenRouter comparison, measured 2026-09-11](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Latency:**
  - "Complex prompts may take up to 2 minutes." JPEG is faster than PNG. Streaming of partial images is available. — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)
  - Measured on gpt-image-2: `high` took 123 s and billed $0.2108, while `low` took 12 s and billed $0.006. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Deprecations:**
  - `gpt-image-1` shuts down **2026-10-23**.
  - `gpt-image-1-mini`, `gpt-image-1.5` and `chatgpt-image-latest` shut down **2026-12-01**.
  - The replacement is gpt-image-2.5-sunburst or gpt-image-2.5-flare.
  - — [OpenAI deprecations](https://developers.openai.com/api/docs/deprecations)
- **Provenance:** OpenAI's help center says images from ChatGPT, Codex and the API carry **both C2PA metadata and SynthID watermarks**. SynthID survives some metadata-stripping edits. — [OpenAI Help 8912793](https://help.openai.com/en/articles/8912793) (the page returned 403 on direct fetch; the wording comes from search snippets of that page, so re-check it).
- **Moderation:** The API returns `moderation_blocked` with categories and stage (input or output). — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)

#### Google Gemini / Nano Banana (Gemini API)
- **Official per-image prices** (pricing page last updated 2026-10-09):

  | Model | ID | Standard | Batch |
  |---|---|---|---|
  | Nano Banana 2.1 | `gemini-nano-banana-2.1` | $0.0336 (1K), $0.0504 (2K), $0.113 (4K) | $0.0168 / $0.0252 / $0.0567 |
  | Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | $0.0336 (1K) | — |
  | Nano Banana 2 | `gemini-3.1-flash-image` | $0.067 (1K), $0.101 (2K) | — |
  | Nano Banana Pro | `gemini-3-pro-image` | $0.134 (1K/2K), $0.24 (4K) | $0.067 (1K/2K) |
  | Nano Banana (original) | `gemini-2.5-flash-image` | $0.039 | — |

  - `gemini-2.5-flash-image` is deprecated, with shutdown on 2026-10-02.
  - **No free API tier for any image model.** Use inside the Google AI Studio UI is free.
  - — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **Nano Banana 2.1 features (official docs):**
  - Improved quality, prompt adherence, multi-turn character consistency and text rendering.
  - Up to **14 reference images** (4 characters, 10 objects).
  - Google Search grounding.
  - Thinking levels: minimal, medium (default), high.
  - 1K/2K/4K output.
  - — [Gemini docs: Nano Banana 2.1](https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1) (via Context7 `/websites/ai_google_dev_gemini-api`)
- **Aspect ratios:** The Flash Lite docs list 1:1, 3:2, 2:3, 3:4, 4:3, **4:5**, 5:4, 9:16, 16:9 and 21:9. The Flash 3.1 line adds 1:4, 4:1, 1:8 and 8:1. — [Gemini docs: 3.1 Flash Lite image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image), [3.1 Flash image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image)
- **Flash Lite:** Targets sub-2-second end-to-end latency, and its docs state "**SynthID watermarking (Always On) + C2PA**." — [Gemini docs: Flash Lite image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image)
- **General limitations:**
  - "All generated images include a SynthID watermark."
  - "When generating text for an image, Gemini works best if you first generate the text and then ask for an image with the text."
  - — [Gemini docs: image generation limitations](https://ai.google.dev/gemini-api/docs/image-generation)
- **Nano Banana 2.1 release:** 2026-10-06. Third-party coverage says it was a quiet launch, with no Google benchmark charts, and that Nano Banana 2 is turned off on 2026-10-29 (unverified). — [Artlist](https://artlist.io/blog/nano-banana-2-1-what-changed/), [OrcaRouter](https://www.orcarouter.ai/vi/blog/nano-banana-2-1-release-date)
- **Imagen 4:** No longer on the Gemini pricing page. A third-party summary says Imagen 4 Fast shut down 2026-08-17 and lists Standard/Ultra at $0.04/$0.06. Treat Imagen 4 as legacy. — [invideo, 2026-08-06](https://invideo.io/blog/ai-image-model-pricing/), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

#### Black Forest Labs (FLUX) API
- **Official prices:**

  | Model | Price |
  |---|---|
  | FLUX 3 Image | $0.041 (768²), **$0.048 (1K)**, $0.100 (2K), $0.607 (4K) |
  | FLUX.2 [klein] 4B / 9B | from $0.014 / $0.015 |
  | FLUX.2 [pro] | from $0.03 generate, from $0.045 edit |
  | FLUX.2 [flex] | from $0.05 |
  | FLUX.2 [max] | from $0.07 |
  | FLUX.1 Kontext [pro] / [max] | $0.04 / $0.08 |
  | FLUX1.1 [pro] / Ultra | $0.04 / $0.06 |

  - The page lists no free credits and makes no C2PA statement.
  - — [BFL docs pricing](https://docs.bfl.ai/quick_start/pricing)
- **FLUX 3 Image on OpenRouter:** up to 10 reference images, with aspect ratios including **4:5**, 3:4 and 2:3. The slug suggests a 2026-10-01 release. — [OpenRouter FLUX 3 Image](https://openrouter.ai/black-forest-labs/flux-3-image)
- **fal pricing:** FLUX 3 edit is $0.024/MP on fal. — [fal pricing](https://fal.ai/pricing)
- **Seeds and text:**
  - FLUX.2 Klein was the only model tested where a fixed seed gave byte-identical results. OpenAI, Gemini, Recraft and others don't support seeds.
  - Klein misspelled label text ("SINGLE ORISION"). FLUX.2 flex rendered it correctly.
  - — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Licensing:** BFL's pricing page says "No subscriptions, no seat fees." It links separate API terms, which I did not read, so commercial-use terms for API outputs are **unverified**. — [bfl.ai/pricing](https://bfl.ai/pricing)

#### Recraft (raster + native SVG, custom styles)
- **API prices** (1 unit ≈ $0.001):
  - Generation:

    | Model | Price |
    |---|---|
    | V4.1 | $0.035 |
    | V4.1 Pro | $0.21 |
    | V4.1 Flash | $0.007 |
    | V4.1 Vector | $0.08 |
    | V4 Styles | $0.035 |
    | V4 Styles Vector | $0.05 |
    | V4 Styles Pro | $0.10 |

  - Edits and utilities: image-to-image and inpainting $0.04 (vector $0.08), style creation $0.04, vectorization $0.01, background removal $0.01, crisp upscale $0.004.
  - — [Recraft pricing (API tab)](https://www.recraft.ai/pricing?tab=api)
- **Rights:** Free-plan images are **owned by Recraft, public, and not licensed for commercial use**. Paid plans grant ownership and commercial rights. — [Recraft pricing](https://www.recraft.ai/pricing?tab=api)
- **Custom styles via API:** `POST /styles` takes up to **5 reference images** (5 MB total) and returns a `style_id` to reuse in generation. It supports weights, mixing existing styles, and `mix_policy` (`PaletteMatch` / `MaxWeight`). Generation also accepts `negative_prompt`, `text_layout` and `controls`. — [Recraft API docs](https://www.recraft.ai/docs/api-reference/endpoints) (via Context7 `/websites/recraft_ai`)
- **Style support is limited to V2/V3:** Recraft's docs say "style parameters are exclusively supported on V2 and V3 models and do not apply to V4 or V4.1." — [Recraft MCP/API docs](https://www.recraft.ai/docs/mcp-reference/tools). **Conflict:** the pricing page now lists "V4 Styles" SKUs, so V4 style support may have been added recently. Verify.
- **Measured vector cost:** Recraft V4.1 vector returned SVG at $0.08. OpenRouter recommends it for "editable vector output." Recraft accepts only 1 reference image via OpenRouter. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)

#### Ideogram
- **API per-image prices** (the same rate applies to Generate/Remix/Edit/Reframe/Replace Background):

  | Model | Tiers |
  |---|---|
  | Ideogram 4.0 | Turbo $0.03 / Default $0.06 / Quality $0.10 |
  | Ideogram 3.0 | Flash/Turbo $0.03 / Default $0.06 / Quality $0.09 |

  - 3.0 Character Reference costs $0.10–$0.20.
  - — official page as summarised by search ([ideogram.ai/api-pricing](https://ideogram.ai/api-pricing/)); the live page now loads prices by JavaScript and returned "Loading current prices" on direct fetch, so this is **unverified against the live page**.
- **Pricing page details:** Lists Ideogram **4.5**, 4.0, 3.0 and custom models, with a default rate limit of 10 in-flight requests. — [Ideogram pricing](https://ideogram.ai/pricing/?pricing_tab=api)
- **No 4.5 detail found:** I found no source detailing Ideogram 4.5 capabilities. — [search result summary](https://invideo.io/blog/ideogram-ai-image-generator/)
- **Ideogram 4.0:**
  - Released 2026-06-03 as open weights, with a text-rendering focus (0.97 OCR accuracy cited). — [invideo](https://invideo.io/blog/ideogram-ai-image-generator/)
  - Style references (up to 3 images) are documented for 3.0. Their presence in 4.0 is disputed between sources. — [invideo](https://invideo.io/blog/ideogram-ai-image-generator/), [apiframe guide](https://apiframe.ai/guides/ideogram-api-guide)

#### ByteDance Seedream (BytePlus ModelArk)
- **Seedream 5.0 Pro** (`seedream-5-0-pro-260628`, launched ~2026-07-08):
  - $0.045/image at ≤2.36 MP, $0.09 above that.
  - The first reference image is free; each extra one costs $0.003 (reseller citing ModelArk, unverified).
  - — [Atlas Cloud](https://www.atlascloud.ai/blog/ai-updates/seedream-5-0-pro-price), [heyuan110](https://www.heyuan110.com/posts/ai/2026-07-09-seedream-5-pro/)
- **Seedream 5.0 Lite:** $0.035/image. — [mer.vin](https://mer.vin/2026/07/seedream-5-0-pro-api-on-byteplus-precision-image-generation-and-multi-reference-editing/)
- **Limits:** Pro takes up to 10 reference images and Lite up to 14. Pro outputs 1K/2K and Lite 2K–4K. — [mer.vin](https://mer.vin/2026/07/seedream-5-0-pro-api-on-byteplus-precision-image-generation-and-multi-reference-editing/)
- **Visible watermark:** A `watermark` parameter can be set to `false` to omit a **visible "AI generated" badge**, which implies the badge is on by default. — [mer.vin](https://mer.vin/2026/07/seedream-5-0-pro-api-on-byteplus-precision-image-generation-and-multi-reference-editing/)
- **Default resolution:** Seedream returned 2048×2048 by default on OpenRouter, so 5.0 Pro billed its $0.09 high-resolution rate. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)

#### Midjourney
- **No API, automation forbidden:**
  - No official public API as of mid/late 2026. Official access is only the web app and Discord, under subscription. — [Unifically](https://unifically.com/blogs/midjourney-api), [Legnext](https://legnext.ai/blog/how-to-get-midjourney-api-key)
  - Community Guidelines: Midjourney provides no API, and automating interactions is barred under the ToS. Accounts may be blocked. — [Midjourney Community Guidelines](https://docs.midjourney.com/community-guidelines)
  - The ToS reportedly says "You may not use automated tools to access, interact with, or generate Assets through the Services." This quote comes from a third-party archive, because Midjourney's site returned 403. — [ConductAtlas](https://conductatlas.com/platform/midjourney/midjourney-terms-of-service/provision/CA-P-023499/prohibition-on-automated-tools-for-access/)
- **V8 timeline:** V8 alpha came on 2026-03-17. The dates for V8.1/V8.2 becoming default conflict between sources. — [Wikipedia: Midjourney](https://en.wikipedia.org/wiki/Midjourney), [tech-insider](https://tech-insider.org/how-to-use-midjourney-v8-1-2026/)

#### Adobe Firefly API
- **No official price found:** I found no official self-serve per-generation API price. One estimate gives $0.05 per Firefly Image 5 image (1K/2K), last verified June 2026, and it is unclear whether that is API or subscription pricing. — [Scopeful](https://www.scopeful.org/tools/adobe-firefly)
- **Enterprise access:** API access runs through Firefly Services / enterprise contracts. Indemnification is the main differentiator, but its scope must be confirmed in the contract (consultancy sources that disagree with each other). — [Redress Compliance](https://redresscompliance.com/adobe-firefly-enterprise-pricing-2026), [Redress Compliance 2](https://redresscompliance.com/adobe-firefly-generative-ai-enterprise-licensing)
- **Third-party models in Firefly:** Adobe is integrating GPT Image 2.5 Flare/Sunburst into Firefly (secondary coverage). — [aicatchup](https://aicatchup.com/news/openai-chatgpt-images-2-5-gpt-image-2-5)
- **C2PA:** Firefly output carries C2PA manifests that open tools can read. — [C2PA Viewer](https://c2paviewer.com/articles/verify-ai-generated-image-c2pa-synthid)

#### Meta Muse Image (new, notable)
- **Price:** $0.01 per image, flat, on the Meta Model API (announced around 2026-08-26/28). It's also available on fal and OpenRouter. Failed or safety-filtered images aren't billed. — [RuntimeWire](https://runtimewire.com/article/meta-ships-muse-image-api-at-one-cent-per-image), [Let's Data Science](https://letsdatascience.com/news/fal-opens-access-to-meta-muse-image-0fef298a), [BibiGPT](https://growth.bibigpt.co/en/features/meta-muse-image-explained)
- **Rankings:** #9 for text-to-image (Elo 1115) and #7 for editing (Elo 1123) on Artificial Analysis at $10/1k images. — [AA T2I](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text), [AA Editing](https://artificialanalysis.ai/text-to-image/arena/leaderboard-image)
- **Unknowns:** Commercial terms, EU availability, aspect ratios and provenance marking were not covered by the sources I could read.

#### Microsoft MAI-Image-2.6 / 2.6-Flash (new, notable)
- **Availability:** Released 2026-09-04 on Microsoft Foundry and on OpenRouter. Up to 5 reference images for editing. — [OpenRouter MAI-Image-2.6](https://openrouter.ai/microsoft/mai-image-2.6), [RuntimeWire](https://runtimewire.com/article/microsoft-mai-image-2-6-foundry-four-cents-image)
- **Price:** On OpenRouter, image output is $38/M tokens ($19 for Flash). Artificial Analysis lists $38.9/1k (2.6) and $19.5/1k (Flash). I found no official Microsoft price page. — [OpenRouter](https://openrouter.ai/microsoft/mai-image-2.6), [AA T2I](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)

#### Reve, Leonardo, Krea, xAI Grok, Qwen
- **Reve:**
  - Credit-based API with a $10 minimum purchase. One review gives about $0.024 per text-to-image and $0.04 per edit (May 2026). — [eesel](https://www.eesel.ai/blog/reve-2-1-pricing)
  - "Reve Edit Fast" costs $0.01/edit. — [invideo](https://invideo.io/blog/ai-image-model-pricing/)
  - Sources conflict on whether a direct API exists. — [Scopeful](https://www.scopeful.org/tools/reve)
  - No official rate card found.
- **Leonardo:**
  - No flat per-image API rate card; it uses a dashboard calculator. Pay-as-you-go API starts with a $5 credit. — [apiframe](https://apiframe.ai/guides/leonardo-ai-api-guide), [usagepricing](https://usagepricing.com/blueprint/leonardo-ai)
  - Leonardo Phoenix 1.0 and Lucid Origin are hosted on Cloudflare Workers AI. — [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- **Krea:**
  - No official API rate card found. — [costbench](https://www.costbench.com/software/ai-image-generators/krea/)
  - Krea 2 Medium billed $0.03 on OpenRouter. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
  - Krea 2 Large is #25 on AA text-to-image at $60/1k. — [AA T2I](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)
- **xAI Grok Imagine Image 2.0:**
  - #5 on AA text-to-image, $60/1k. — [AA T2I](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)
  - Only 3 reference images; OpenRouter rules it out for large brand kits. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Qwen-Image-3.0:** $0.03/image on OpenRouter, #18 on AA text-to-image. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/), [AA T2I](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)

#### Aggregators
- **OpenRouter:**
  - Dedicated images API at `POST /api/v1/images`. Every response returns `usage.cost`, and failed generations aren't billed. — [OpenRouter FLUX 3 page](https://openrouter.ai/black-forest-labs/flux-3-image)
  - Discovery endpoints: `GET /api/v1/images/models` and `/models/{model}/endpoints`.
  - Billing units differ by family: per megapixel (FLUX.2), per token (Gemini, OpenAI, MAI), per image (Grok, Recraft, Qwen, Seedream).
  - — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **OpenRouter measured costs** (20 models, default image, 2026-09-11):

  | Model | Cost per image |
  |---|---|
  | gpt-image-2 | $0.006 (default/low) |
  | flux.2-klein-4b | $0.014 |
  | flux.2-pro | $0.03 |
  | qwen-image-3 | $0.03 |
  | krea-2-medium | $0.03 |
  | gemini-3.1-flash-lite-image | $0.0336 |
  | recraft-v4.1 | $0.035 |
  | mai-image-2.5 | $0.048 |
  | flux.2-flex | $0.05 |
  | gemini-3.1-flash-image | $0.067 |
  | flux.2-max | $0.07 |
  | seedream-5-0-pro | $0.09 (2048²) |
  | gemini-3-pro-image | $0.134 |

  - Edit costs: gpt-image-2 $0.0142, flux.2-pro $0.045, gemini-3-pro-image $0.1356.
  - Five of six models tested got two lines of label text right.
  - — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **fal.ai:** Nano Banana 2 costs $0.08 there (vs Google's direct $0.067), Nano Banana Pro $0.15, Nano Banana $0.0398 and FLUX 3 edit $0.024/MP. Many other models link out to their own pages, and no free credits are mentioned. — [fal pricing](https://fal.ai/pricing)
- **Replicate:** Pay-as-you-go with no free tier. FLUX 1.1 Pro is about $0.04 and Ideogram v3 about $0.09/image (third-party, mid-2026). — [usagepricing](https://usagepricing.com/blueprint/replicate), [aireiter](https://aireiter.com/blog/replicate-ai-review-2026-pricing-alternatives)
- **Cloudflare Workers AI (genuinely free tier):**
  - 10,000 neurons/day free.
  - Hosted models include FLUX.2 klein 4B/9B, FLUX.2 dev, FLUX.1 schnell and Leonardo Phoenix/Lucid Origin.
  - Klein 4B costs 26.05 neurons per 512² output tile, which works out to roughly 100 free 1024² images/day. This is my tile-math estimate; step charges may apply to other models.
  - — [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

#### Provenance and Instagram's "AI info" label
- **What Meta says:** It labels AI images using "industry standard indicators" such as **C2PA and IPTC** metadata, and renamed "Made with AI" to "AI info" in July 2024 after photographers complained that small AI retouches triggered the label. — [TechCrunch 2024-07-01](https://techcrunch.com/2024/07/01/meta-changes-its-label-from-made-with-ai-to-ai-info-to-indicate-use-of-ai-in-photos), [SiliconANGLE 2024-02-06](https://siliconangle.com/2024/02/06/meta-will-label-ai-generated-images-across-facebook-instagram-threads/)
- **Meta's own images:** Meta's photorealistic AI images carry a visible "Imagined with AI" label plus an invisible watermark. — [The Decoder](https://the-decoder.com/meta-introduces-imagined-with-ai-labels-for-ai-generated-content-on-its-social-media-platforms/)
- **2026 claims (unverified, mostly sellers of metadata-removal tools):**
  - That Meta also uses invisible watermarks or an internal classifier, that the label is now called "AI content," and that it can't be removed after posting. — [Junibloom](https://www.junibloom.com/blog/instagram-ai-labels-what-triggers-them), [kompozy](https://kompozy.io/guides/instagram-ai-content-detection-and-labeling), [mintface](https://mintface.ai/blog/instagram-ai-content-policy-2026)
  - **No official 2026 Meta document found.**

### Inferences
- **4:5 at 1080×1350 isn't a native size anywhere I checked.**
  - Gemini, FLUX 3 (via OpenRouter) and Flash Lite offer a 4:5 *ratio* at about 1K. Downscale or upscale to 1080×1350 in the renderer.
  - For GPT Image 2.5 custom sizes, **1088×1360** is exactly 4:5 and meets the multiple-of-16 rule. 1080×1350 itself does not.
- **Per-image cost at ~4:5:**
  - Per-image providers (Nano Banana 2.1 1K, Recraft, Ideogram, Muse) cost the same as square.
  - OpenAI GPT Image 2 portrait (1024×1536) is slightly cheaper than square at medium and high.
  - Per-megapixel models (FLUX.2) cost a little more for 1.3–1.5 MP.
- **Expect the "AI info" label:** Images from OpenAI and Google come with C2PA metadata and SynthID. Uploaded as-is, they will very likely get the label. Re-rendering through a compositor (for example, adding typography with Pillow or Satori) usually drops C2PA metadata, but SynthID stays in the pixels. Whether Meta detects SynthID is unverified.
  - For a community that is sensitive to AI, **voluntary disclosure (self-labelling / caption note) is safer than relying on metadata loss**, because being "caught" undisclosed is the bigger reputational risk.
- **Muse Image is the price/quality outlier on paper:** $0.01, top 10 on both AA boards. But it is a Meta model posting to a Meta platform, so its outputs may carry Meta's own invisible watermark and trigger labelling more reliably. Its terms and EU availability are also unverified.
- **For a Claude-Code-orchestrated pipeline, OpenRouter is the lowest-friction automation layer:** one key, one images endpoint, and per-call `usage.cost` for budget tracking. Going direct to Google/OpenAI saves a small markup and unlocks the batch API (−50%). Batch only fits if drafts can wait (Gemini batch is asynchronous).
- **Don't build anything new on gpt-image-1, 1-mini or 1.5.** They shut down in October and December 2026.

### Gaps
- **Unverified prices:**
  - Exact per-image cost of GPT Image 2.5 Flare/Sunburst at medium or high quality for 1024×1536. OpenAI publishes only token rates. AA's $210.7/1k is for "max" at 1024².
  - Ideogram's live API price table (JavaScript-loaded, unverified against the live page).
  - Official prices for Firefly, Krea, Leonardo and Reve.
- **Unread terms:** Commercial-use and automation terms for the BFL API, Ideogram API, Meta Model API (Muse), Seedream/BytePlus and MAI/Foundry. I didn't read these ToS pages directly. OpenAI and Google API terms weren't re-read either. Both are generally understood to permit automated API use, but that's not re-verified here.
- **Provenance unknown:** Whether BFL, Recraft, Ideogram, Seedream (beyond the visible badge), Muse or MAI embed C2PA or invisible watermarks.
- **Instagram's 2026 mechanics:** No official Meta 2026 documentation on current "AI info" detection, including whether SynthID or classifiers are used.
- **Midjourney V8 quality vs the API models:** Midjourney isn't on the Artificial Analysis boards because it has no API.
- **Latency:** I found no measured latency figures for Nano Banana 2.1, FLUX 3, Recraft or Ideogram.

---

## 2. Independent quality rankings (late 2026)

### Takeaway
On Artificial Analysis (v2.0 arenas, snapshot including October 2026 releases), **OpenAI GPT Image 2.5 Sunburst/Flare lead both text-to-image and editing**, at about 6× the price of the next tier. **Nano Banana 2.1 ($33.6/1k) is #4 on both boards** and is the best quality-per-dollar among the top five. MAI-Image-2.6, Muse Image and FLUX 3 sit just behind it. I couldn't retrieve the LMArena (now arena.ai) board.

### Cited Findings
- **AA text-to-image leaderboard (AA-Image-T2I v2.0)**, Elo and price per 1k images at 1024²:

  | Rank | Model | Elo | $/1k | Released |
  |---|---|---|---|---|
  | 1 | GPT Image 2.5 Sunburst (max) | 1199 | $210.7 | Sep 2026 |
  | 2 | GPT Image 2.5 Flare (max) | 1192 | $210.7 | Sep 2026 |
  | 3 | GPT Image 2 (high) | 1172 | $211 | — |
  | 4 | Nano Banana 2.1 | 1159 | $33.6 | Oct 2026 |
  | 5 | Grok Imagine Image 2.0 | 1155 | $60 | — |
  | 6 | MAI-Image-2.6 | 1152 | $38.9 | — |
  | 7 | Nano Banana 2 | 1125 | $67 | — |
  | 8 | FLUX 3 Image | 1116 | $48 | Oct 2026 |
  | 9 | Muse Image | 1115 | $10 | — |
  | 10 | GPT Image 1.5 (high) | 1108 | $133 | — |
  | 11 | MAI-Image-2.6-Flash | 1107 | $19.5 | — |
  | 12 | Nano Banana Pro | 1104 | $134 | — |
  | 15 | Nano Banana 2 Lite | 1096 | $33.6 | — |
  | 16 | Qwen-Image-3.0-Pro | 1089 | $40 | — |
  | 17 | Seedream 5.0 Pro | 1082 | $90 | — |
  | 22 | Seedream 4.0 | 1031 | $30 | — |
  | 24 | FLUX.2 [flex] | 1029 | $60 | — |
  | 25 | Krea 2 Large | 1027 | $60 | — |

  — [Artificial Analysis T2I leaderboard](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)
- **AA image-editing leaderboard (AA-Image-Editing v2.0):**

  | Rank | Model | Elo | $/1k |
  |---|---|---|---|
  | 1 | GPT Image 2.5 Sunburst (max) | 1185 | — |
  | 2 | GPT Image 2.5 Flare (max) | 1167 | — |
  | 3 | MAI-Image-2.6 | 1142 | $38.9 |
  | 4 | Nano Banana 2.1 | 1140 | $33.6 |
  | 5 | MAI-Image-2.6-Flash | 1130 | $19.5 |
  | 6 | GPT Image 2 (high) | 1129 | — |
  | 7 | Muse Image | 1123 | $10 |
  | 10 | Nano Banana 2 | 1113 | — |
  | 12 | Seedream 5.0 Pro | 1112 | — |
  | 13 | GPT Image 1.5 | 1106 | — |
  | 14 | Nano Banana Pro | 1104 | — |
  | 17 | HunyuanImage 3.5 Preview | 1088 | $24 |

  — [Artificial Analysis editing leaderboard](https://artificialanalysis.ai/text-to-image/arena/leaderboard-image)
- **Earlier 2026 editing leaders, for context:** In March 2026, GPT Image 1.5 led editing (1270, old Elo scale). An August 2026 snapshot had MAI-Image-2.5-Pro at #1. **Elo scales changed with v2.0, so don't compare numbers across versions.** — [Magic Hour snapshot 2026-03-22](https://magichour.ai/model-leaderboard/image-editing), [OrcaRouter](https://www.orcarouter.ai/blog/mai-image-2-5-pro-tops-image-editing-leaderboard)
- **Design Arena:** Sourceful **Riverflow 2.5 Pro** ($0.064) topped both the image and image-editing boards as of 2026-09-11, and FLUX.2 Klein ranked lowest of the models tested. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Vendor claims for Nano Banana 2.1:** Google claims better text and infographic rendering, but there were no third-party benchmarks at launch (artlist, 2026-10). AA now ranks it #4/#4. — [Artlist](https://artlist.io/blog/nano-banana-2-1-what-changed/), [AA](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)

### Inferences
- **Quality per dollar:**
  - Nano Banana 2.1 is about 6× cheaper than GPT Image 2.5 for roughly 40 Elo less.
  - Muse Image is about 21× cheaper for about 85 Elo less.
  - For drafts with 3–4 candidates each, which a human then curates, the cheaper top-10 models are the rational default. The expensive models make sense only for hero images or hard edits.
- **Arena Elo doesn't measure brand fit.** Arenas reward generic aesthetic preference, which tends to correlate with the polished "AI look." For a brand that wants to avoid slop, test candidate models on MSP's own prompts and references rather than relying on rank alone.

### Gaps
- **LMArena / arena.ai:** The text-to-image and edit leaderboards returned HTTP 403, so there are no LMArena numbers here.
- **Style-specific rankings:** No independent ranking specifically for *illustration / flat vector / stylized* output (as opposed to general preference).
- **Text-in-image accuracy:** No benchmark comparing the October 2026 models head to head. The only data point is OpenRouter's two-line label test.

---

## 3. Art direction that avoids "AI slop" (2025–2026 practitioner guidance, examples)

### Takeaway
Practitioners converge on these rules:
- Write explicit constraints: a hex palette, a single named illustration idiom, a banned-traits list, and 1–5 fixed reference images.
- Use one idea or metaphor per image.
- Keep typography and numbers out of the generator and render them in templates.
- Generate several candidates and have a human pick.
- Optionally add a VLM critic, from a different model family, that rejects known artifact types.

The puzzle hobby has a documented sensitivity to AI art, centred on malformed details and on AI work passed off as human-made. Mass-market brands that shipped "AI slop" (McDonald's NL 2025, Coca-Cola 2024/2025) were publicly criticised.

### Cited Findings

**What reads as slop (specific traits)**
- **Wildsite's list of slop tells:**
  - "cheesy stock-style AI people" with excessive glow and shine, overly perfect subjects and "no distinct photographic or art style"
  - single-colour "glow gradients" with white bursts
  - filler decor
  - "too much stuff" with no hierarchy
  - sameness: rounded containers, cream-orange palettes
  - default font pairings
  - overused eyebrow text
  - swooshes, whiskers, stars and hearts with heavy effects
  - "01, 02, 03" numbering

  Its fix: feed the AI a brand guide, hand-made artwork, photos of your space and colours, and store those rules in project files. — [Erin-Marie Driscoll, Wildsite, 2026-10-02](https://wildsite.substack.com/p/what-looks-like-ai-slop)
- **Puzzle hobbyists:** They complain that AI images in mass-market puzzles show "visual inconsistencies, malformed features, and low-resolution artifacts." Specialty brands such as Ravensburger and Oakland Puzzle Company stress human-created designs and labelling (Vox via Let's Data Science, 2026-03-04). — [Let's Data Science](https://letsdatascience.com/news/ai-generates-low-quality-art-for-jigsaw-puzzles-460bfcd5)
- **r/Jigsawpuzzles:**
  - Threads complain about AI artwork in puzzles ("OMG enough with the AI," Oct 2024), argue puzzle companies should pay artists, and note that AI art sometimes carries an artist's name, so buyers are misled. — [r/Jigsawpuzzles thread (mirror)](https://reddit.birdcat.cafe/r/Jigsawpuzzles/comments/1gfpyui/omg_enough_with_the_ai)
  - The subreddit wiki keeps an "AI puzzles" list, which some users say is overzealous. — [r/Jigsawpuzzles thread 2 (mirror)](https://reddit.birdcat.cafe/r/Jigsawpuzzles/comments/1iit1fz/new_to_the_hobby_and_ai)
- **Retailer and customer signals:**
  - Puzzle retailer Puzzledly offers a "no AI art" filter.
  - A long-time White Mountain customer publicly complained after the brand started using AI images.
  - Both are anecdotal. — [Homeschool Superfreak](https://homeschoolsuperfreak.com/puzzles-with-no-ai/), [PuzzleTalk](https://puzzletalk.substack.com/p/ai-in-puzzles)
  - PuzzleTalk also stresses that honesty about the process maintains trust, because AI art labelled as artist-made upset puzzlers. — [PuzzleTalk](https://puzzletalk.substack.com/p/ai-in-puzzles)

**Constraint-based art direction**
- **Encode constraints in a written file:** gather real reference work, lock the palette with defined roles, set a type scale, and put the rules in a file every tool reads. — [Forgehouse](https://forgehouse.ai/guides/avoid-ai-slop-design/)
- **Front-load brand context in every prompt** and **build fixed templates for high-volume formats** (grid, type, colour and logo locked; only headline and imagery vary). Treat AI output as a first draft. — [Venngage brand consistency](https://venngage.com/blog/ai-brand-consistency-guide/), [Venngage AI slop](https://venngage.com/blog/ai-slop-in-design/)
- **Spell out what to avoid:** a style system that is silent on a trait (for example, shadows) gets that trait by default, so state anti-examples explicitly. — [MindStudio](https://www.mindstudio.ai/blog/claude-design-avoid-ai-slop-design-system)
- **Practitioner guides on locking parameters:**
  - Lock core parameters (hex palette, style descriptors, negative constraints) into a reusable template.
  - Use 1–3 clean reference images.
  - Give hex values rather than "neutral and sophisticated."
  - Use **one metaphor per editorial image**, since overloaded prompts produce competing literal symbols.
  - Limited palettes suit editorial spots.
  - Flat vector is easy to art-direct and recolour, but generated curves and joins need cleanup.
  - Models have house styles, so the same prompt drifts across tools.

  These points are aggregated from a search over several practitioner guides; I didn't verify which guide makes which claim. — [StyleRef: AI art direction](https://styleref.io/blog/ai-art-direction), [Stensyl: reference images](https://stensyl.ai/blog/reference-images-ai-style-consistency), [aimagicx style guides](https://www.aimagicx.com/blog/ai-brand-image-consistency-style-guide), [MindStudio brand guidelines](https://www.mindstudio.ai/blog/ai-image-generation-brand-guidelines-design-systems)
- **Tooling for references:**
  - Recraft custom style: up to 5 references, with `PaletteMatch` mixing. — [Recraft API docs](https://www.recraft.ai/docs/api-reference/endpoints)
  - Gemini 2.1: up to 14 references. — [Gemini docs](https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1)
  - OpenAI: up to 16 references. FLUX.2: up to 8. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)

**Keep typography and numbers out of the model**
- **Google's own guidance:** generate the text first, then the image. — [Gemini docs limitations](https://ai.google.dev/gemini-api/docs/image-generation)
- **Text errors still happen:** even in October 2026 some models misspell short labels (FLUX.2 Klein produced "SINGLE ORISION"). — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Template rendering:** Template-based tools fill dynamic text into fixed layouts from data. — [Bannerbear](https://www.bannerbear.com/blog/how-ai-is-changing-content-creation-and-why-you-should-care-as-a-developer/)
- **Legibility over generated images:** type over a generated image is a contrast and complexity problem, so leave clear zones. — [imgix typesetting tutorial](https://docs.imgix.com/tutorials/multiline-text-overlays-typesetting-endpoint)

**Automated critic / QA gate**
- **SynArtifact:** a reference-free taxonomy of **13 artifact types** in synthetic images, plus a VLM-based classifier to flag them. — [SynArtifact (arXiv 2402.18068)](https://arxiv.org/pdf/2402.18068)
- **SalArt-VQA:** VLMs can give the right pass/fail verdict while pointing at the wrong region. Ask the critic to *localise and describe* the defect. — [SalArt-VQA](https://www.alphaxiv.org/abs/2606.12671)
- **Multi-agent evaluation:** a 2026 paper splits evaluation into Binary QA, Likert, Aesthetics and a separate **Artifact Detection** agent. — [arXiv 2605.13223](https://arxiv.org/pdf/2605.13223)
- **Off-the-shelf judges:** LangWatch supports LLM-as-judge on images (boolean, score or category). — [LangWatch](https://langwatch.ai/docs/evaluations/experiments/multimodal-evaluation)
- **Judge independence:** I found no verified primary source for "use a judge from a different model family than the generator". It appeared in a search summary of an unnamed practitioner guide about synthetic QA data, so treat it as a heuristic only (see Inferences and Gaps).

**Brand examples**
- **McDonald's Netherlands:** pulled its AI-generated Christmas ad (aired 2025-12-06) within days after it was called "AI slop." It first disabled comments, then delisted the video. — [Washington Times](https://www.washingtontimes.com/news/2025/dec/11/mcdonalds-netherlands-pulls-ai-ad-parodied-christmas-song/), [eWeek](https://www.eweek.com/fr/news/mcdonalds-pulls-ai-christmas-ad/)
- **Coca-Cola:** its 2024 AI holiday ad drew backlash. The 2025 follow-up avoided human close-ups and favoured cute animals, but YouTube comments still called it "soulless AI." A BBC-cited report put sentiment at 61% positive, so reaction was mixed. — [Creative Bloq](https://creativebloq.com/design/advertising/why-are-brands-no-longer-afraid-of-producing-ai-slop), [Asianet](https://newsable.asianetnews.com/markets/coca-cola-and-mcdonald-s-learn-the-hard-way-that-ai-slop-ads-just-won-t-cut-it-emotionally-with-consumers-articleshow-t7qc7uq)
- **Svedka (Super Bowl 2026):** "Shake Your Bots Off" was openly AI-made and leaned into the artificial look. One review called it playful and self-aware, which makes it a "doing it knowingly" example. — [Artlist Super Bowl 2026](https://artlist.io/blog/super-bowl-2026-ai-ads/)
- **IAB "AI Ad Gap":** executives guessed 82% of consumers feel positive about AI ad creative. The actual figure was 45%. — [Artlist Super Bowl 2026](https://artlist.io/blog/super-bowl-2026-ai-ads/) (secondary citation of IAB)
- **Consumer sentiment:** a Tracksuit survey found US sentiment toward AI ads skewed negative (39%). — [Asianet citing Business Insider](https://newsable.asianetnews.com/markets/coca-cola-and-mcdonald-s-learn-the-hard-way-that-ai-slop-ads-just-won-t-cut-it-emotionally-with-consumers-articleshow-t7qc7uq)

### Inferences
- **For MSP specifically, the biggest slop risk is photoreal puzzle imagery.**
  - Generated jigsaw pieces, interlocking tabs, box art and hands are exactly the "malformed features" puzzlers scrutinise.
  - Prefer real photos (community or own) for anything that depicts actual puzzles.
  - Use AI for clearly stylised illustration, backgrounds, textures and conceptual spot art, where nobody mistakes it for a photo of a real puzzle.
- **A workable house-style spec**, for example "MSP risograph":
  - 3–5 hex colours plus paper/cream, 2-colour riso grain, a slight misregistration, no gradients, no glow.
  - Flat shapes, chunky outlines, one focal object, generous negative space, no people's faces or hands unless essential.
  - Store it as a prompt prefix plus 3–5 reference images.
  - Feed it to Recraft `style_id` or as Gemini/OpenAI reference images.
  - Keep a banned list in every prompt: "no text, no lettering, no glossy 3D, no lens flare, no bokeh, no fantasy detail, no extra puzzle pieces floating."
- **Numbers and facts must never be generated.** MSP's posts are data-driven (times, records, stats), so a single garbled digit is both slop and misinformation. Render all text, numbers, logos and charts programmatically, and use the model only for the art layer, with an empty text zone requested in the prompt.
- **Candidate funnel:** generate 3–4 → a VLM critic rejects anything with the listed artifacts (malformed pieces, extra fingers, stray glyphs, off-palette colours, glossy "AI sheen") → the human approves 1. The critic should be a different model family from the generator; for example, Claude as critic for Gemini/OpenAI images. Calibrate it on 50–100 human-labelled MSP candidates before trusting it.
- **Disclose AI use** in a consistent, light-touch way, for example a caption tag like "illustration: AI-assisted, art-directed by MSP." Never attribute AI art to a human artist. That misattribution is the specific trust violation puzzlers call out.

### Gaps
- **Well-documented positive cases:** I found no case study of a brand whose *static social illustrations* made with AI were well received in a craft or hobby community. Svedka is a video ad.
- **Craft vs. engagement:** No controlled study showing that a given illustration idiom (riso, paper-cut, clay) is perceived as less "AI" than others. Practitioner advice favours constrained flat or graphic idioms, but that's opinion.
- **Critic accuracy:** No published accuracy figures for general-purpose VLM critics (Claude, GPT, Gemini) at catching artifacts in *stylised* illustration. The academic work mostly covers photoreal artifacts.

---

## 4. Practical recommendation: best quality per euro by use case and budget tier

### Takeaway
- **Default workhorse:** Gemini Nano Banana 2.1 via the Gemini API at ~$0.034/image (1K), or ~$0.017 with batch. It is top-5 on both arenas, supports 4:5, takes 14 references, and is strong at edits.
- **Illustration style-locking:** Recraft, for custom styles and SVG.
- **Hero images and hard edits only:** GPT Image 2.5 Flare/Sunburst.
- **Avoid:** Midjourney (no automation allowed) and Recraft's free plan (non-commercial, public).
- **Budget fit:** At 200–650 generations/month, €10 comfortably covers a Nano Banana 2.1 batch workflow, and €50 covers a mixed stack with premium hero images.

### Cited Findings
- **Price inputs:**
  - Nano Banana 2.1: $0.0336 (1K), $0.0504 (2K), batch half. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
  - GPT Image 2 portrait: $0.005 / $0.041 / $0.165 (low / medium / high). — [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation)
  - Recraft V4.1: $0.035; vector $0.08; style creation $0.04. — [Recraft](https://www.recraft.ai/pricing?tab=api)
  - FLUX 3 Image 1K: $0.048. FLUX.2 pro: $0.03 / $0.045 edit. Kontext pro: $0.04. — [BFL docs](https://docs.bfl.ai/quick_start/pricing)
  - Ideogram 4.0: $0.03 / $0.06 / $0.10. — [Ideogram](https://ideogram.ai/api-pricing/) (unverified live)
  - Muse Image: $0.01. — [RuntimeWire](https://runtimewire.com/article/meta-ships-muse-image-api-at-one-cent-per-image)
  - Nano Banana Pro: $0.134. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
  - GPT Image 2.5 (max): ~$0.21 at 1024². — [AA](https://artificialanalysis.ai/text-to-image/arena/leaderboard-text)
- **Free options:**
  - Cloudflare Workers AI: 10k neurons/day (FLUX.2 klein, FLUX.1 schnell, Leonardo Phoenix/Lucid). — [Cloudflare](https://developers.cloudflare.com/workers-ai/platform/pricing/)
  - Gemini API: no free tier for image models; the AI Studio UI is free. — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
  - Recraft: free-plan outputs are non-commercial and public. — [Recraft](https://www.recraft.ai/pricing?tab=api)
- **Editing rankings:** Nano Banana 2.1 (#4, $33.6/1k), MAI-Image-2.6-Flash (#5, $19.5/1k), Muse Image (#7, $10/1k), GPT Image 2.5 Sunburst (#1, ~$210/1k). — [AA editing](https://artificialanalysis.ai/text-to-image/arena/leaderboard-image)

### Inferences

**Monthly cost at our volume** (USD, standard pricing, ~1K 4:5. USD and EUR are close enough for budgeting at this scale, but check the current rate):

| Model / setting | $/image | 200/mo | 400/mo | 650/mo |
|---|---|---|---|---|
| GPT Image 2 low (portrait) | 0.005 | $1 | $2 | $3 |
| Muse Image (Meta) | 0.01 | $2 | $4 | $7 |
| FLUX.2 klein 4B (BFL) | 0.014 | $3 | $6 | $9 |
| Nano Banana 2.1 1K **batch** | 0.0168 | $3 | $7 | $11 |
| Nano Banana 2.1 1K standard | 0.0336 | $7 | $13 | $22 |
| Recraft V4.1 raster | 0.035 | $7 | $14 | $23 |
| GPT Image 2 medium (portrait) | 0.041 | $8 | $16 | $27 |
| FLUX 3 Image 1K | 0.048 | $10 | $19 | $31 |
| Nano Banana 2.1 2K standard | 0.0504 | $10 | $20 | $33 |
| Ideogram 4.0 Default | 0.06 | $12 | $24 | $39 |
| Recraft V4.1 Vector (SVG) | 0.08 | $16 | $32 | $52 |
| Nano Banana Pro 1K/2K | 0.134 | $27 | $54 | $87 |
| GPT Image 2 high (portrait) | 0.165 | $33 | $66 | $107 |
| GPT Image 2.5 (max, 1024²) | ~0.21 | $42 | $84 | $137 |

Notes on the table:
- **OpenAI extra charges:** Longer prompts and reference images add input-token cost on OpenAI. gpt-image-2 went from $0.006 to $0.0135 with a longer prompt. — [OpenRouter comparison](https://openrouter.ai/blog/insights/image-generation-models-compared/)
- **Edits:** Edits generally cost about the same as a generation, or up to 1.5× (FLUX.2 pro).

**(a) Editorial illustrations / playful concept art about puzzles**
1. **Recraft.** Build an MSP custom style from 3–5 hand-picked reference illustrations (`style_id`, V3 per docs; V4 "Styles" SKUs may now exist, so verify). Alternatively use V4.1 Vector for flat SVG you can recolour and typeset programmatically. Cost is $0.035–$0.08/image. This is the strongest "brand-lock" mechanism and the only native-SVG route.
2. **Nano Banana 2.1 with 3–6 fixed reference images** plus a strict style prefix, at $0.034 (or $0.017 batch). It's best for varied scenes in a consistent look.
3. **Escalation:** GPT Image 2.5 Flare, only when the cheaper models fail on a complex composition.

**(b) Photoreal-ish puzzle scenes**
1. **Nano Banana 2.1** at 2K ($0.05). It has the best rank-per-dollar among the photoreal-capable leaders.
2. **GPT Image 2 medium** ($0.041 portrait) or **FLUX 3 Image** ($0.048) as a second opinion.
3. **Caveats:**
   - Puzzlers scrutinise malformed pieces, so keep photoreal *puzzle* depictions rare and heavily curated.
   - Prefer real photos plus AI backgrounds or composites.
   - Never present a generated puzzle as a real product.

**(c) Editing existing photos (e.g., stylising a puzzle box photo)**
1. **Nano Banana 2.1** for edits: #4 on AA editing, $0.034, multi-turn, 14 references.
2. **GPT Image 2.5 Sunburst** for precision edits, but only a handful per month given about $0.21/image at max.
3. **Cheap alternatives:** MAI-Image-2.6-Flash (~$0.02, via OpenRouter/Foundry) or FLUX.1 Kontext pro ($0.04).
4. **Rights caveat:** Puzzle box art is usually a third-party artist's copyrighted work. Restyling it with AI is a rights and community-trust risk, so get the publisher or artist's OK or restyle only MSP-owned photos. This is an inference; I didn't research the legal side.

**Budget scenarios**
- **€0 / month:**
  - Use local ComfyUI (covered by another researcher), plus **Cloudflare Workers AI's free daily allowance** (FLUX.2 klein 4B, roughly 100 images/day by my estimate) for automated drafts.
  - Klein's weak text rendering doesn't matter if all text is rendered programmatically.
  - The Google AI Studio UI is free for manual one-offs, but it isn't an automatable API.
  - Avoid Recraft's free plan because its output is non-commercial and public.
  - Expect visibly lower quality than the paid options.
- **~€10 / month:**
  - **Nano Banana 2.1 via Gemini Batch API** (~$0.017/image): about 400–600 generations for roughly $7–10.
  - Alternatively, standard (synchronous) Nano Banana 2.1 at around 300 generations.
  - Add a few Recraft V4.1 images ($0.035) for illustration.
  - **Muse Image ($0.01)** would stretch further, but check its commercial terms, EU availability and Meta watermarking first.
- **~€50 / month:**
  - Nano Banana 2.1 2K as the workhorse (~$20–33 for 400–650).
  - Recraft custom-style or vector illustration (~$5–15).
  - 20–40 premium generations or edits on GPT Image 2.5 Flare/Sunburst or Nano Banana Pro (~$5–10).
  - Route everything through OpenRouter, or go direct to the providers, with per-call cost logging.

**Pipeline details**
- **Size and text:** Request 4:5 and leave an empty text zone. Upscale or crop to 1080×1350 in the renderer, and render all numbers, text and the logo with code.
- **Provenance:** Assume OpenAI and Google outputs will carry SynthID and C2PA and likely trigger Instagram's "AI info". Plan to disclose AI use rather than hide it.

### Gaps
- **Real cost on MSP's own prompts:** Actual per-image cost of GPT Image 2.5 at the quality MSP would use, and actual Nano Banana 2.1 quality on stylised, art-directed prompts, need a small paid test (out of scope: no paid API calls were made).
- **Unconfirmed terms:** Muse Image's commercial terms and EU availability. Recraft V4 custom-style support (the docs and pricing page conflict). Ideogram's live API prices.
- **Free-tier behaviour:** Whether Cloudflare's free-tier image counts hold in practice; the neuron maths for step-based models is unclear.
