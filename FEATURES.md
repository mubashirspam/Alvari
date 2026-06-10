# Alvari — Complete Feature Reference

> **Stack:** Next.js 16.2.4 · App Router · TypeScript · Tailwind v4 · Drizzle ORM · Neon Postgres · ImageKit · Upstash Redis · Resend · Vercel

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Database Schema](#2-database-schema)
3. [Customer-Facing Pages](#3-customer-facing-pages)
4. [Order Flow](#4-order-flow)
5. [Account & Order Tracking](#5-account--order-tracking)
6. [Custom Orders](#6-custom-orders)
7. [Referrals & Promo Codes](#7-referrals--promo-codes)
8. [Visitor Analytics](#8-visitor-analytics)
9. [Admin Panel](#9-admin-panel)
10. [Email Notifications](#10-email-notifications)
11. [API Reference](#11-api-reference)
12. [Auth](#12-auth)
13. [Media & Images](#13-media--images)
14. [SEO](#14-seo)
15. [Environment Variables](#15-environment-variables)
16. [Scripts & Commands](#16-scripts--commands)

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (App Router, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS variables design tokens) |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM + drizzle-kit |
| Cache | Upstash Redis (graceful fallthrough) |
| Auth (admin) | Custom scrypt session + Neon Auth (dual) |
| Auth (users) | Neon Auth — Google Sign-In |
| Images | ImageKit (upload + CDN + transforms) |
| Email | Resend (order confirmation + admin alerts) |
| AI | Anthropic Claude (blog post auto-generation) |
| Hosting | Vercel (Fluid Compute, ISR, Edge geo headers) |
| State | Zustand (cart, persisted to localStorage) |
| Validation | Zod |

---

## 2. Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `products` | Product catalogue (25 columns, ISR cached) |
| `product_variants` | Variants per product — SKU, price, stock, attributes (JSONB) |
| `product_images` | Images per product/variant, sorted, ImageKit keys |
| `blog_posts` | Markdown blog, multi-language, AI-generated |
| `product_blog_sections` | M2M join — blog posts shown on product pages |
| `categories` | Category metadata (label, image, accent colour) |
| `category_nodes` | Hierarchical nav tree (self-referencing, cascading delete) |
| `banners` | Scheduled banners per slot (hero, promo strip, etc.) |
| `collections` | Curated product collections |
| `collection_products` | M2M join — products in a collection |
| `admins` | Admin accounts (scrypt password hash, role) |
| `admin_sessions` | SHA-256 session tokens, 7-day TTL |
| `enquiries` | Legacy enquiry leads (name, phone, product, status) |
| `users` | Customer accounts (email, phone, Google ID) |
| `orders` | Orders — guest or authenticated, full address, custom fields |
| `order_items` | Line items per order (snapshot of product/price at time of order) |
| `referral_sources` | Referral codes (discount %, active flag) |
| `promo_codes` | Discount codes (% or flat, min order, max usages, expiry) |
| `page_views` | Anonymous visitor analytics (fingerprint, UTM, city, device) |

### Key Enums

| Enum | Values |
|------|--------|
| `order_status` | pending · confirmed · in_production · shipped · delivered · cancelled |
| `product_category` | almirah · bed · sofa · dining · dressing · coffee_table · mattress · room_set · custom · chair · sideboard · table |
| `product_badge` | bestseller · new · trending · value_pick · best_value |
| `promo_discount_type` | percent · flat |
| `banner_slot` | hero · secondary · promo_strip · mid_page · collection_tile · category_tile |
| `admin_role` | owner · admin · editor |
| `enquiry_status` | new · contacted · quoted · closed |

---

## 3. Customer-Facing Pages

### Home — `/`
- Hero section with featured products
- Trust-signal strip
- Promo/offer announcement bar
- Featured collections
- Category browser tabs
- WhatsApp float button

### Products — `/products`
- Client-side search + filter (no page reload)
- Tabbed category browser with sub-category pills
- Filter by category, material, price
- Sort: newest, price low/high, featured
- Product cards with badge, price, discount %, "Add to cart"

### Product Detail — `/products/[slug]`
- Full image gallery (variant-aware — switching variant changes images)
- Thumbnail strip (up to 5)
- Variant selector (size, colour, material) with live price update
- Stock status (in stock / only N left / made to order)
- Attribute grid from JSONB variant data
- "Add to quotation" (cart) button
- "Ask on WhatsApp" — pre-filled message with product + variant
- **Share button** — native share sheet on mobile, copy-link on desktop with "Copied!" feedback
- Long description (markdown rendered)
- Product specs table
- Related blog posts (editorial content)
- Enquiry form (legacy, below fold)
- OG image auto-generated per product

### Blog — `/blog`
- Blog listing, sorted by publish date
- Language tabs (English / Malayalam)
- Reading time, author, category

### Blog Post — `/blog/[slug]`
- Markdown content
- OG image auto-generated per post
- Related products linked inline

### Quotation Generator — `/quotation`
- Print-to-PDF quotation builder
- Rooms / sections support
- Editable items table (description, qty, rate → auto-calculates total)
- Editable terms & conditions
- Grand total
- Company name / customer info fields

---

## 4. Order Flow

### Checkout — `/checkout`

**Fields:**
- Full name (required)
- WhatsApp number with +91 prefix (required)
- Email (optional — used for confirmation email)
- House / Building / Street (required)
- Pincode — auto-fills city, district, state via postalpincode.in API
- City, District, State (required)
- Order notes (optional, up to 2000 chars)
- **Custom order section** (collapsible — see §6)
- **Promo code field** with live validation
- Cart items (editable quantity, remove)

**Submit flow:**
1. Client validates form
2. `POST /api/orders` — server re-verifies all prices from DB (prevents tampered cart)
3. Order + line items inserted into Postgres
4. Promo usage count incremented (if code used)
5. Confirmation email sent to customer (if email provided)
6. Admin alert email sent to `ADMIN_EMAIL`
7. Cart cleared
8. Redirect to `/orders/[shortCode]`

**Order short code format:** `ALV-{year}-{5-char base-36}` e.g. `ALV-2026-X4F9K`

### Order Confirmation — `/orders/[shortCode]`

- Status badge + animated progress timeline (pending → confirmed → in production → shipped → delivered)
- Items list with images and prices
- Total
- Delivery address
- **"Message on WhatsApp" button** — opens WhatsApp with full order details pre-filled in the message box
- Customer saves order number and sends to you on WhatsApp
- You contact them to confirm payment (50% advance)
- Notes section (if any)

**Pre-filled WhatsApp message includes:**
- Order number
- All items with quantities and prices
- Customer name, phone, address
- Total amount

---

## 5. Account & Order Tracking

### Guest Order Lookup — `/orders/lookup`
- No login required
- Enter WhatsApp number (with country code handling)
- Shows all orders for that number (max 20)
- Rate-limited: 5 lookups per IP per minute
- Click any order → goes to full tracking page
- Prompt to sign in for saved history

### Account Orders (Google Sign-In) — `/account/orders`
- Sign in with Google (Neon Auth)
- Shows all orders where `customerEmail` matches signed-in email
- Each order card shows: short code, status badge, items summary, total, date, location
- Click → full order tracking page
- Sign out button
- "Track by phone instead" fallback link

### User Auth
- Powered by Neon Auth (Better Auth under the hood)
- Google OAuth only (no password)
- Session managed via cookie
- `userAuthClient` singleton from `@neondatabase/auth/next`
- No forced auth — guest checkout always available

---

## 6. Custom Orders

Accessible via the **"This is a custom order"** checkbox on the checkout page.

### Fields
| Field | Type | Options |
|-------|------|---------|
| Dimensions / Size | Free text | e.g. "6ft × 3ft × 7ft" |
| Wood / Material | Dropdown | Teak, Rosewood, Rubber wood, Plywood+Veneer, MDF+Veneer, Other |
| Finish / Colour | Dropdown | Natural/Matte, Glossy, Semi-gloss, Painted, Walnut stain, Dark Ebony, Other |
| Timeline | Pill select | No rush (4–6 wks), Standard (2–4 wks), Urgent (1–2 wks) |
| Reference images | Upload (max 3) | JPEG/PNG/WebP, uploaded directly to ImageKit |

### How it works
- Images upload to ImageKit folder `/kaasth/custom-orders` using existing upload auth
- Stored as `customReferenceImages` (array of ImageKit URLs) on the order
- `isCustomOrder: true` flag set on order
- **Admin sees custom orders highlighted in amber** with "Custom" badge in the orders list
- Admin order detail shows full spec + clickable reference image thumbnails

---

## 7. Referrals & Promo Codes

### Referral Links
- Any URL with `?ref=CODE` (e.g. `alvari.in/?ref=RAJAN2026`)
- Code captured in a **30-day cookie** (`alvari_ref`) via the proxy middleware
- Stored on every order placed during the cookie window as `referralCode`
- Admin can see which referral source each order came from in order details
- Cookie is case-insensitive, max 64 chars, alphanumeric + underscore + hyphen

### Promo Codes

**How customers use them:**
1. Enter code in checkout → live validation against API
2. If valid: shows discount label (e.g. "15% off"), deducted from total
3. Code attached to order, usage count incremented on submit

**Discount types:**
| Type | Example | Stored as |
|------|---------|-----------|
| Percent | 15% off | integer (15) |
| Flat | ₹500 off | integer in paise (50000) |

**Constraints:**
- Minimum order amount (optional)
- Maximum number of usages (optional — blank = unlimited)
- Expiry date/time (optional)
- Active/inactive toggle

**Admin `/admin/promos`:**
- Create new codes with all fields
- Table showing: code, discount, min order, used/max, expiry, status
- Deactivate (soft-delete) any code

---

## 8. Visitor Analytics

First-party, no Google Analytics, no cookies requiring consent banner.

### How it works
1. On every page load (except `/admin` and `/api`), `PageTracker` fires `navigator.sendBeacon` to `/api/track`
2. **Fingerprint**: UUID stored in `localStorage` — same visitor recognised across pages
3. **Session ID**: Short UUID in `sessionStorage` — resets on tab close
4. **City / Country**: Read from Vercel geo headers (`x-vercel-ip-city`) — zero extra API calls
5. **Device type**: Derived from `window.innerWidth` (mobile / tablet / desktop)
6. **UTM params**: Captured from URL (`utm_source`, `utm_medium`, `utm_campaign`)

### Admin `/admin/analytics`

| Card | Description |
|------|-------------|
| Unique visitors (30d) | Distinct fingerprints in last 30 days |
| Unique visitors (7d) | Last 7 days |
| Page views (30d) | Total rows in `page_views` table |
| Orders (30d) · conv. X% | Orders placed / unique visitors |

**Charts & lists:**
- **Daily sparkline** — bar chart of unique visitors per day (14 days)
- **Top pages** — ranked list with progress bars
- **Top referrers** — external domains sending traffic
- **Top cities** — where visitors are from (Vercel geo)
- **Device breakdown** — mobile / tablet / desktop with percentage bars

### Data retention
All data lives in your own Neon Postgres database. No third-party services receive visitor data.

---

## 9. Admin Panel

All pages at `/admin/**` — protected by dual auth (Neon Auth or legacy cookie session).

### Dashboard — `/admin`
- Summary cards: Pending orders, Active products, Published blog posts, Open enquiries
- Recent enquiries table

### Orders — `/admin/orders`
- Orders list (newest first, up to 300)
- Status summary cards (pending / confirmed / in production / shipped / delivered / cancelled)
- Pending total (₹ value of unconfirmed orders)
- **Inline status dropdown** — change status with one click, saves instantly
- **WhatsApp button** per row — opens pre-filled message to customer
- Custom orders highlighted in amber with "Custom" badge
- Click order code → full detail page

### Order Detail — `/admin/orders/[id]`
- Full items table with images, SKU, unit price, line total
- Custom order specifications panel (amber, only if custom)
- Reference image thumbnails (clickable)
- Customer panel: name, phone, email, Call + WhatsApp buttons
- Delivery address
- Order metadata: short code, status, placed via, WhatsApp opened timestamp
- Status dropdown
- Customer tracking link (opens `/orders/[shortCode]`)

### Products — `/admin/products`
- List all products with Create/Edit/Variants/Images/Blogs actions

### Product Edit — `/admin/products/[id]`
- All fields: name, slug, category, meta, description, long description (markdown), brand, material, warranty, care instructions, dimensions, weight, price now/was, badge, illustration key, gradient, featured flag, active flag, sort order

### Variants — `/admin/products/[id]/variants`
- Add / edit / delete variants
- Key-value attribute editor (maps to JSONB)
- Price, stock, SKU, default flag

### Images — `/admin/products/[id]/images`
- Upload directly to ImageKit
- Attach image to a specific variant or leave shared
- Reorder, delete

### Blog Linker — `/admin/products/[id]/blogs`
- Multi-select blog posts to show as editorial sections on the product page

### Blog — `/admin/blog`
- List, create, edit blog posts
- Markdown editor with live preview
- Language, category, topic slug, reading time, meta title/description, tags
- Publish / unpublish
- Auto-generation via Anthropic Claude (cron job)

### Categories — `/admin/categories`
- Edit category labels, images, hero images, accent colours, visibility

### Category Tree — `/admin/category-tree`
- Hierarchical navigation tree editor
- Drag-and-drop parent/child relationships
- Link nodes to product category enum + material filter or custom href

### Banners — `/admin/banners`
- Create/edit scheduled banners
- Slot selection (hero, secondary, promo strip, mid-page, collection tile, category tile)
- Start/end date scheduling
- Image upload to ImageKit
- Mobile image variant

### Collections — `/admin/collections`
- Create/edit featured collections
- Add/remove products from collection
- Hero image, accent colour, featured flag

### Enquiries — `/admin/enquiries`
- Read-only list of legacy enquiry leads
- Call / WhatsApp links per row
- Status: new → contacted → quoted → closed

### Promo Codes — `/admin/promos`
- Create discount codes (% or flat, min order, max uses, expiry)
- Table with usage counter
- Deactivate codes

### Analytics — `/admin/analytics`
- All visitor stats (see §8)

---

## 10. Email Notifications

Powered by **Resend**. All emails are fire-and-forget (never block the order flow).

### Order Confirmation (to customer)
- Sent when: order placed + customer provided email at checkout
- From: `orders@alvari.in`
- To: customer's email
- Contains: order number, items table, total, delivery address, next steps, tracking link button

### New Order Alert (to admin)
- Sent when: any order placed
- From: `orders@alvari.in`
- To: `ADMIN_EMAIL` env var (`ceo@skillage.in`)
- Contains: customer name, phone, email, total, items list, address, **WhatsApp deep link button**

### Setup
1. Verify domain `alvari.in` in Resend dashboard (DNS records added via GoDaddy)
2. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.local` and Vercel env vars
3. Emails are skipped gracefully if `RESEND_API_KEY` is not set

---

## 11. API Reference

### Public APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List products with filters |
| `GET` | `/api/products/[slug]` | Single product by slug |
| `POST` | `/api/orders` | Place new order (validates prices server-side) |
| `GET` | `/api/orders/[shortCode]` | Get order by short code (public, safe fields only) |
| `GET` | `/api/orders/lookup?phone=` | Find orders by phone (rate-limited 5/min/IP) |
| `GET` | `/api/promo/validate?code=&total=` | Validate promo code against order total |
| `POST` | `/api/track` | Record page view (used by PageTracker beacon) |
| `GET` | `/api/upload-auth` | ImageKit upload auth token |
| `GET/POST` | `/api/auth/[...path]` | Neon Auth handler |
| `POST` | `/api/enquiries` | Submit enquiry form |

### Authenticated User APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/user/orders` | Orders for signed-in user's email |

### Admin APIs (require admin session)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/orders` | List all orders with optional `?status=` filter |
| `PATCH` | `/api/admin/orders/[id]` | Update order status |
| `GET/POST` | `/api/admin/products` | List / create products |
| `GET/PATCH/DELETE` | `/api/admin/products/[id]` | Read / update / delete product |
| `GET/POST` | `/api/admin/products/[id]/variants` | List / create variants |
| `PATCH/DELETE` | `/api/admin/products/[id]/variants/[variantId]` | Update / delete variant |
| `GET/POST` | `/api/admin/products/[id]/images` | List / upload images |
| `DELETE` | `/api/admin/products/[id]/images/[imageId]` | Delete image |
| `GET/PUT` | `/api/admin/products/[id]/blogs` | Get / set linked blog posts |
| `GET/POST` | `/api/admin/blog` | List / create blog posts |
| `GET/PATCH/DELETE` | `/api/admin/blog/[id]` | Read / update / delete post |
| `GET/POST` | `/api/admin/category-nodes` | List / create category tree nodes |
| `PATCH/DELETE` | `/api/admin/category-nodes/[id]` | Update / delete node |
| `GET/POST` | `/api/admin/promos` | List / create promo codes |
| `DELETE` | `/api/admin/promos/[id]` | Deactivate promo code |
| `GET/POST` | `/api/admin/session` | Admin session management |
| `POST` | `/api/cron/generate-blog-post` | AI blog post generation (cron, requires `CRON_SECRET`) |

---

## 12. Auth

### Admin Auth (dual)
Two methods accepted side-by-side — whichever is present wins:

**Legacy (DB-backed cookie):**
- Cookie: `alvari_admin_session` (HTTP-only, 7-day TTL)
- Password: scrypt hash in `admins` table
- Login at `/admin/login`

**Neon Auth:**
- Google OAuth via Neon Auth server
- Session cookie managed by Neon Auth SDK
- User must have `role: "admin"` in Neon Auth user metadata

### User Auth (Neon Auth)
- Google Sign-In only
- Used for `/account/orders` page
- `userAuthClient` from `@neondatabase/auth/next` — no URL argument needed, auto-routes to `/api/auth`
- `getCurrentUser()` server helper returns `{ id, email, name, image } | null`
- No forced auth — all customer-facing pages work without sign-in

### Proxy / Middleware (`proxy.ts`)
- Staging basic-auth wall (controlled by `STAGING_PASSWORD` env var)
- Admin route protection (Neon Auth middleware + session cookie check)
- **Referral cookie capture**: `?ref=CODE` → 30-day cookie `alvari_ref`
- Non-production `X-Robots-Tag: noindex` header

---

## 13. Media & Images

All images served via **ImageKit CDN** at `https://ik.imagekit.io/alvari`.

### Upload Flow
1. Client requests signed upload token from `GET /api/upload-auth`
2. Client POSTs FormData directly to `https://upload.imagekit.io/api/v1/files/upload`
3. ImageKit stores file, returns `url` and `filePath`
4. DB stores the `filePath` (e.g. `/kaasth/products/image.jpg`)

### Image Transforms
`buildImageKitUrl(key, { width, quality, format })` generates optimised URLs:
- `format: "auto"` → WebP on supported browsers, JPEG fallback
- `quality: 75–80` for product images
- `width` for responsive sizing

### Folders
| Folder | Contents |
|--------|----------|
| `/kaasth/products` | Product images |
| `/kaasth/blogs` | Blog cover images |
| `/kaasth/banners` | Banner/hero images |
| `/kaasth/custom-orders` | Customer-uploaded reference images |

---

## 14. SEO

- **Metadata** auto-generated per page (`generateMetadata`)
- **OpenGraph images** auto-generated per product and blog post (Next.js Route Handler at `/og/product/[slug]` and `/og/blog/[slug]`)
- **JSON-LD**: Organisation, LocalBusiness, Product, BreadcrumbList schemas
- **Sitemap** at `/sitemap.xml` (auto-generated)
- **Robots.txt** at `/robots.txt`
- **Canonical URLs** on all pages
- **ISR**: Product pages revalidate every 60 seconds

---

## 15. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Yes | Neon Auth server URL |
| `NEON_AUTH_COOKIE_SECRET` | Yes | Min 32 chars, signs session cookies |
| `IMAGEKIT_PUBLIC_KEY` | Yes | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | Yes | ImageKit private key |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | Yes | `https://ik.imagekit.io/alvari` |
| `IMAGEKIT_FOLDER_PREFIX` | Yes | `staging` or `production` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | `9400306614` (no +91 prefix) |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://alvari.in` in production |
| `ADMIN_EMAIL` | Yes | Admin alert emails sent here |
| `ADMIN_PASSWORD` | Yes | Password for legacy admin login |
| `RESEND_API_KEY` | Email | `re_...` from resend.com dashboard |
| `RESEND_FROM_EMAIL` | Email | `orders@alvari.in` |
| `UPSTASH_REDIS_REST_URL` | Cache | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Cache | Upstash Redis token |
| `ANTHROPIC_API_KEY` | AI Blog | Claude API key for blog generation |
| `ANTHROPIC_MODEL` | AI Blog | Defaults to `claude-3-5-haiku-20241022` |
| `CRON_SECRET` | Cron | Secures `/api/cron/generate-blog-post` |
| `STAGING_PASSWORD` | Staging | Basic-auth wall for staging environment |
| `NEXT_PUBLIC_ENV_MODE` | Dev | `staging` / `production` / `development` |

---

## 16. Scripts & Commands

```bash
# Development
pnpm dev                    # Start dev server on localhost:3000

# Build
pnpm build                  # Production build
pnpm start                  # Start production server

# Database (staging DB by default)
pnpm db:generate            # Generate new migration from schema changes
pnpm db:push                # Push schema changes to staging DB (interactive)
pnpm db:push:prod           # Push schema changes to production DB
pnpm db:migrate             # Run pending migrations on staging
pnpm db:migrate:prod        # Run pending migrations on production
pnpm db:studio              # Open Drizzle Studio for staging DB
pnpm db:studio:prod         # Open Drizzle Studio for production DB
pnpm db:seed                # Seed staging DB with sample products + admin

# Deploy
vercel                      # Preview deployment
vercel --prod               # Production deployment
vercel env add KEY          # Add environment variable to Vercel
```

### DB migration workflow
```bash
# 1. Edit lib/db/schema.ts
# 2. Generate migration
pnpm db:generate
# 3. Apply to staging (run in terminal for interactive prompt)
pnpm db:push
# 4. After testing, apply to production
pnpm db:push:prod
```

---

## Feature Status Summary

| Feature | Status |
|---------|--------|
| Product catalogue (list, detail, variants, gallery) | Live |
| Cart (Zustand, persisted) | Live |
| Checkout (guest, no auth required) | Live |
| Order confirmation + WhatsApp CTA | Live |
| Order tracking by short code | Live |
| Order lookup by phone (no auth) | Live |
| Account orders (Google Sign-In) | Live |
| Custom order (upload reference images) | Live |
| Admin orders panel (list, detail, status update) | Live |
| Email notifications (Resend) | Live (needs API key) |
| Referral links (?ref= cookie capture) | Live |
| Promo codes (% or flat, admin CRUD) | Live |
| Visitor analytics (fingerprint, no GA) | Live |
| Share button on product page | Live |
| Product share (native + clipboard fallback) | Live |
| Admin products CRUD (full) | Live |
| Admin blog CRUD + AI generation | Live |
| Admin banners (scheduled) | Live |
| Admin collections | Live |
| Admin categories + tree editor | Live |
| Admin enquiries | Live |
| Admin promo codes | Live |
| Admin analytics dashboard | Live |
| Quotation PDF generator | Live |
| SEO (OG images, JSON-LD, sitemap) | Live |
| ImageKit CDN + upload | Live |
| Neon Auth (admin + user) | Live |
| Upstash Redis caching | Live |

---

*Last updated: June 2026*
