# Alvari — Industrial-Grade SEO & AI-Search (GEO/AEO) Implementation Plan

> Audience: AI coding agent working in the `directfurn` repo (Next.js 16.2.4, App Router).
> Read `CLAUDE.md` / `FEATURES.md` first. Respect layering (route → service → repository), pnpm only, money in paise.
>
> **Goal:** Make Alvari products rank in Google for Kerala furniture searches AND get cited by AI assistants
> (ChatGPT, Claude, Gemini, Perplexity) when users ask for furniture recommendations.
>
> **Honest framing:** You will not outrank IKEA/Nilkamal on generic terms like "sofa" in months. You WILL win on:
> 1. Local + intent terms — "teak bed Kerala", "furniture factory Wayanad", "sofa direct from factory Kerala"
> 2. Malayalam-language searches (IKEA/Nilkamal barely serve these)
> 3. AI-assistant answers — they favour well-structured, crawlable, entity-rich sites, where a small site can beat a big one
>
> Dominance on those compounds into broader rankings over 6–12 months.

---

## Phase 0 — Crawlability & AI-bot access (do first, 1 day)

### 0.1 robots.ts — explicitly allow AI crawlers
File: `app/robots.ts`

- Allow all of: `Googlebot`, `Bingbot`, `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-User`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `meta-externalagent`.
- Disallow: `/admin`, `/api`, `/checkout`, `/account`, `/orders/lookup` result pages.
- Keep the existing non-production `X-Robots-Tag: noindex` in `proxy.ts` — verify it NEVER fires in production (add a test).
- Sitemap line pointing to `https://alvari.in/sitemap.xml`.

### 0.2 llms.txt
New route: `app/llms.txt/route.ts` (a plain-text route handler, ISR `revalidate = 3600`).

Content: brand summary (Alvari — direct-from-factory furniture workshop, Kalpetta, Wayanad, Kerala; ships across Kerala; teak/rosewood specialities; WhatsApp ordering; 50% advance model), then a generated list of top category and product URLs with one-line descriptions, pulled via the products service. Also `app/llms-full.txt/route.ts` with longer per-product blurbs (name, material, price range, dimensions, URL). AI crawlers increasingly use these.

### 0.3 Verify rendering
Product/blog pages must render full content in initial HTML (they're server components with ISR — verify no critical content is client-only). Run `curl https://alvari.in/products/<slug>` and confirm name, price, description, specs are in raw HTML.

**Acceptance:** `curl -A "GPTBot" <prod-url>` returns 200 with full HTML; `/llms.txt` returns brand+catalog text; robots.txt allows the listed bots.

---

## Phase 1 — Structured data (the backbone of both Google and AI answers, 2–3 days)

Extend `lib/seo/jsonld.ts`. Every builder takes typed inputs, returns a JSON-LD object; pages embed via `<script type="application/ld+json">`. Validate everything with Google Rich Results Test after deploy.

### 1.1 Organization + Brand (site-wide, in root layout)
- `@type: Organization` — name "Alvari", `url`, `logo`, `sameAs` (Instagram, Facebook, YouTube, Google Business Profile URL — read from `siteConfig`), `contactPoint` with WhatsApp number, `foundingLocation` Kalpetta.

### 1.2 LocalBusiness (already exists — upgrade)
- `@type: ["FurnitureStore", "LocalBusiness"]`, full postal address (Kalpetta, Wayanad, Kerala, PIN), `geo` lat/long, `openingHoursSpecification`, `areaServed: "Kerala"`, `priceRange: "₹₹"`, `hasMap` (Google Maps link).

### 1.3 Product schema (the most important one) — `/products/[slug]`
Build from product + default variant + variants:
- `name`, `image` (array of ImageKit URLs, ≥3, includes 1:1, 4:3, 16:9 transforms), `description`, `sku` (default variant SKU), `brand: { @type: Brand, name: "Alvari" }`, `material`, `category`.
- `offers`: if multiple variants → `AggregateOffer` (lowPrice/highPrice from variants, `priceCurrency: "INR"`, `offerCount`); single variant → `Offer`. Always include `availability` (InStock / MadeToOrder mapped from stock), `priceValidUntil` (+30 days), `url`.
- `hasMerchantReturnPolicy` and `shippingDetails` (`OfferShippingDetails` with `shippingDestination: Kerala`, handling time from product timeline) — these unlock richer Google Shopping treatment.
- `aggregateRating` / `review` — ONLY after Phase 4 reviews ship. **Never emit synthetic ratings; that earns a manual penalty.**

### 1.4 BreadcrumbList — products, categories, blog (exists per docs; verify all three).

### 1.5 ItemList on `/products` and category-filtered listings
`ItemList` of visible products with position + URL. Helps both Google and AI crawlers map the catalog.

### 1.6 Article schema on blog posts
`@type: Article` with `inLanguage` ("en" / "ml"), author as Organization, `datePublished/dateModified`, image (OG image URL).

### 1.7 FAQPage schema
See Phase 3.2 — emit `FAQPage` JSON-LD wherever FAQ content renders (product pages + dedicated FAQ page).

**Acceptance:** Rich Results Test passes for Product, Breadcrumb, FAQ, Article, LocalBusiness on representative URLs; zero errors, warnings reviewed.

---

## Phase 2 — Technical SEO hardening (2–3 days)

### 2.1 Metadata audit (`generateMetadata` everywhere)
- Product: title pattern `"{Product Name} – {Material} {Category} | Alvari Kerala"` (≤60 chars; truncate gracefully). Description: 150–160 chars, includes price ("from ₹X"), material, "direct from factory, Kerala delivery".
- Canonicals on every page (absolute, from `NEXT_PUBLIC_SITE_URL`). Filtered/sorted listing URLs canonicalise to the clean listing URL.
- `alternates.languages` (hreflang) for blog posts that exist in both English and Malayalam (`en-IN`, `ml-IN`); add `x-default`.

### 2.2 Sitemaps (`app/sitemap.ts`)
- Split into index + children if >1k URLs later; for now ensure: products (with `lastModified` from `updatedAt`), categories, collections, blog (both languages), static pages.
- Add **image entries** for product sitemaps (Next sitemap supports `images` array) — product image SEO drives furniture discovery (Google Images is a big furniture channel).

### 2.3 IndexNow + Google ping
New util `lib/seo/indexnow.ts`: on product create/update/publish and blog publish (in the respective services), fire-and-forget POST to IndexNow (Bing/others) with the changed URL. Generate key file route `app/{INDEXNOW_KEY}.txt/route.ts`. Env: `INDEXNOW_KEY`.

### 2.4 Core Web Vitals
- Hero/first product image: `priority` + correct `sizes`; everything else lazy.
- All ImageKit URLs via `buildImageKitUrl` with `format: "auto"`, width-appropriate transforms, quality 75–80.
- `next/font` for fonts (no layout shift), preconnect to `ik.imagekit.io`.
- Target: LCP < 2.5s on mid-range mobile, CLS < 0.1. Verify with PageSpeed Insights after deploy.

### 2.5 Internal linking
- Product page: "More in {category}" (4–8 linked products), "From the same collection", existing related-blog sections.
- Blog posts: ensure product mentions are real `<a>` links (they are, per docs — verify markdown renderer outputs crawlable hrefs).
- Footer: link top categories + top 6 location pages (Phase 3.1).

**Acceptance:** PSI mobile ≥ 85 on home + a product page; sitemap validates; IndexNow returns 200 in logs on a product edit.

---

## Phase 3 — Content engine for Google + AI answers (ongoing; build scaffolding in 3–4 days)

This is where you beat Nilkamal/IKEA. AI assistants recommend brands they can *describe confidently* — give them dense, factual, structured pages.

### 3.1 Programmatic local landing pages
New route `app/furniture/[location]/page.tsx` + data in `lib/seo/locations.ts` (start with: Kochi, Kozhikode, Thrissur, Kannur, Malappuram, Kottayam, Trivandrum, Palakkad, Wayanad).

Each page (ISR, revalidate 3600): unique intro (delivery time to that city, transport notes), featured products, testimonials/FAQ specific to delivery there, LocalBusiness `areaServed` schema, breadcrumb. **No doorway-page spam:** every page must have genuinely distinct content (delivery logistics, city-specific FAQ) — write real copy per city, don't template-swap only the city name.

Target queries: "furniture shop Kochi factory price", "teak furniture Kozhikode", "wooden bed Thrissur".

### 3.2 FAQ system
- New table `product_faqs` (productId nullable for global FAQs, question, answer, sortOrder, isActive) + repository/service under `features/products/` + admin CRUD at `/admin/faqs`.
- Render on product pages (accordion) + a global `/faq` page. Emit `FAQPage` JSON-LD.
- Seed 20–30 global FAQs: delivery areas/times, 50% advance, wood types (teak vs rubber vs plywood), warranty, custom orders, how WhatsApp ordering works, care instructions. These exact Q&As are what AI assistants quote.

### 3.3 Buying guides & comparison content (via existing AI blog engine)
Update `lib/content/topics.ts` with a topic backlog:
- "Teak vs rubber wood beds: which lasts longer in Kerala's humidity"
- "Factory-direct vs showroom furniture prices in Kerala (real numbers)"
- "Solid wood vs engineered wood: honest comparison"
- "How to verify real teak", "Sofa size guide for Kerala apartments"
- Malayalam versions of each top guide.
Each post must link 3–5 products and end with an FAQ block. Update `lib/content/prompts.ts` to enforce: factual claims, internal links, FAQ section, no fluff, include brand name + Kalpetta/Wayanad provenance naturally (entity reinforcement).

### 3.4 Entity building (off-site, manual checklist — put in plan output for the owner)
- Google Business Profile for the Kalpetta workshop (photos, products, posts, reviews) — single biggest local ranking factor.
- Consistent NAP (name/address/phone) on: Justdial, IndiaMART, Sulekha, Facebook, Instagram.
- `sameAs` links in Organization schema must match these profiles.
- Encourage WhatsApp customers to leave Google reviews post-delivery (add review link to the delivered-status email/WhatsApp template).

### 3.5 About / Workshop page
`app/about/page.tsx`: the factory story, photos, process (wood sourcing → seasoning → build → finish), team, location map. AI assistants weight "who is this brand" pages heavily when deciding whether to recommend.

**Acceptance:** 9 location pages live with unique copy; FAQ admin works end-to-end; topic backlog committed; About page live.

---

## Phase 4 — Reviews & ratings (1 week; unlocks star rich results)

- New tables: `product_reviews` (productId, orderId nullable, name, rating 1–5, body, isApproved, createdAt). Repository/service in `features/products/`.
- Public submit: on product page + a post-delivery email/WhatsApp link with a signed token tied to the order (verified-buyer flag).
- Admin moderation at `/admin/reviews` (approve/reject).
- Render approved reviews on product page; once a product has ≥1 approved review, include `aggregateRating` + `review` in Product JSON-LD.
- Rate-limit submissions (Upstash, 3/IP/hour) + honeypot field.

**Acceptance:** review submitted → moderated → appears on page → Rich Results Test shows valid review snippet.

---

## Phase 5 — Google Merchant Center feed (free product listings, 2 days)

- New route `app/product-feed.xml/route.ts` (or `/api/feed/google`): RSS 2.0 Google Shopping feed — id (SKU), title, description, link, image_link + additional_image_link, availability, price in INR, brand "Alvari", condition new, product category mapped to Google taxonomy ("Furniture > Beds & Accessories > Beds" etc. — add mapping table in `lib/seo/google-taxonomy.ts`), shipping (IN, Kerala).
- ISR/cached 1h via `cached()`.
- Owner action: create Merchant Center account, verify alvari.in, submit feed URL, enable free listings. Free product listings put products directly in the Google Shopping tab — Nilkamal competes here; you can too at zero ad spend.

**Acceptance:** feed validates in Merchant Center with 0 disapprovals on a sample.

---

## Phase 6 — Measurement (half a day)

- Google Search Console: verify domain, submit sitemap. Bing Webmaster Tools: import from GSC.
- Add a weekly habit (or admin dashboard card later): GSC queries with impressions but position > 10 → feed those into the blog topic backlog.
- Track in existing first-party analytics: referrers containing `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai` — add a "AI referrals" row to `/admin/analytics` top-referrers list (data already captured; just surface it).

---

## Build order summary for the AI agent

1. Phase 0 (robots, llms.txt) → 2. Phase 1 (JSON-LD) → 3. Phase 2 (metadata, sitemap, IndexNow, CWV) → 4. Phase 3.2 FAQ system → 5. Phase 3.1 location pages → 6. Phase 4 reviews → 7. Phase 5 Merchant feed → Phase 3.3/3.4/3.5 content ongoing.

Run `pnpm typecheck && pnpm lint && pnpm build` after each phase. No mock data. Follow service → repository layering for all new tables.
