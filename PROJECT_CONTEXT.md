# Alvari — Project Context (AI Reference)

> Single-file reference for any AI assistant working on this codebase. Read this first.
> Repo dir is `directfurn`, but the **brand/product name is "Alvari"** — a Wayanad (Kalpetta, Kerala) furniture workshop selling **direct-from-factory** furniture to customers across Kerala.

---

## ⚠️ Critical: this is NOT the Next.js you know

This project runs **Next.js 16.2.4** (App Router). APIs, conventions, and file structure differ from older Next.js. Before writing code, **read the relevant guide in `node_modules/next/dist/docs/`** and heed deprecation notices. Notable changes already in use:

- **`middleware.ts` is renamed to `proxy.ts`** (root-level `proxy.ts`).
- Async Request APIs (`params`, `searchParams`, `cookies()` are awaited/Promises).
- React 19.2, ISR via `export const revalidate = …`.

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16.2.4 (App Router), React 19.2, TypeScript (strict) |
| Styling | Tailwind CSS v4 (design tokens in `app/globals.css`), shadcn-style UI primitives |
| DB | Neon Postgres via Drizzle ORM (`drizzle-orm` 0.45) |
| Cache | Upstash Redis (`cached()` wrapper — falls through to DB if env unset) |
| Images | ImageKit (delivery + admin upload) |
| Email | Resend (order confirmation to customer) |
| Auth | Neon Auth (`@neondatabase/auth`) for users **+** legacy DB-backed admin sessions |
| AI content | Anthropic SDK (`@anthropic-ai/sdk`) — auto blog generator via Vercel Cron |
| Validation | Zod 4 |
| Client state | Zustand 5 (cart) |
| Hosting | Vercel |
| Package manager | **pnpm only** (`preinstall` enforces via `only-allow`) |

**Neon project:** `orange-butterfly-18442773`
**ImageKit endpoint:** `https://ik.imagekit.io/8i3ek2gje`

---

## Architecture — strict layering

```
API route / Server Action  →  Service  →  Repository  →  DB
                              (business    (Drizzle
                               logic +      queries
                               caching)     only)
Components are UI-only.
```

Each domain lives under `features/<domain>/` with `repositories/`, `services/`, and optionally `components/`, `schema.ts`, `types.ts`.

**Domains:** `products`, `orders`, `enquiries`, `blog`, `categories`, `category-tree`, `collections`, `banners`, `cart`, `landing`, `admin`.

```
app/                      # routes (see "Routes" below)
components/               # ui/ (shadcn primitives), layout/, analytics/, seo/
features/<domain>/        # repositories / services / components
lib/
  db/{index,schema}.ts    # Drizzle client + schema (single source of truth)
  auth/                   # session.ts, password.ts (scrypt), neon-auth.ts, constants.ts
  cache/{redis,keys}.ts   # cached(key, ttl, loader)
  content/                # blog-generator.ts, prompts.ts, topics.ts (Anthropic engine)
  email/send-order-email.ts
  imagekit.ts / imagekit-admin.ts
  admin/                  # slugify, compress-image, upload-image
  seo/jsonld.ts
  env.ts                  # typed env + siteConfig + envMode
  utils.ts                # cn() + formatINR()
scripts/seed.ts           # pnpm db:seed
proxy.ts                  # Next 16 "middleware" — auth gate + staging basic-auth
drizzle.config.ts
```

---

## Database schema (`lib/db/schema.ts`)

**Catalog:** `products`, `product_variants` (JSONB attributes, SKU, price in paise, stock), `product_images` (nullable `variantId` FK → shared vs per-variant), `collections`, `collection_products`, `categories`, `category_nodes` (tree), `banners`.

**Content:** `blog_posts` (markdown, `isPublished`), `product_blog_sections` (m2m product↔post).

**Commerce:** `orders`, `order_items`, `promo_codes` (percent/flat), `referral_sources`.

**Auth/users:** `users` (Neon Auth), `admins` (scrypt hash, role owner/admin/editor), `admin_sessions` (SHA-256 token, 7-day TTL).

**Other:** `enquiries` (status enum), `page_views` (analytics).

**Enums:** `product_category`, `banner_slot`, `product_badge`, `admin_role`, `enquiry_status`, `order_status` (pending → confirmed → in_production → shipped → delivered / cancelled), `promo_discount_type`.

> Money is stored in **paise** (integer). Use `rupeesToPaise` / `paiseToRupees` (`lib/admin/slugify.ts`) and `formatINR()` (`lib/utils.ts`).

---

## Routes

**Public:** `/` (landing, ISR), `/products`, `/products/[slug]`, `/blog`, `/blog/[slug]`, `/quotation`, `/checkout`, `/orders/lookup`, `/orders/[shortCode]` (public tracking), `/account/orders`.

**Admin** (`/admin`, group `(dashboard)`): dashboard, `products` (+ `new`, `[id]`, and nested `variants` / `images` / `blogs`), `orders` (+ `[id]`), `blog`, `categories`, `category-tree`, `collections`, `banners`, `promos`, `enquiries`, `analytics`. Login at `/admin/login` (outside auth layout).

**API:** `api/products`, `api/orders` (+ `lookup`, `[shortCode]`), `api/enquiries`, `api/promo/validate`, `api/track` (page views), `api/upload-auth` (ImageKit), `api/auth/[...path]` (Neon Auth), `api/user/orders`, full `api/admin/*` CRUD (products+variants+images+blogs, orders, blog, promos, category-nodes, session), `api/cron/generate-blog-post`.

**SEO/OG:** `app/robots.ts`, `app/sitemap.ts`, `app/og/product/[slug]`, `app/og/blog/[slug]`, `lib/seo/jsonld.ts`.

---

## Key flows

**Order flow (WhatsApp-first, no payment gateway):**
- Guest checkout at `/checkout` — name, WhatsApp, optional email, address with **pincode auto-fill** (api.postalpincode.in), notes.
- `POST /api/orders` **verifies price server-side against the DB** (anti-tamper), inserts `orders` + `order_items`, fires Resend confirmation email (fire-and-forget, never blocks).
- shortCode format: `ALV-{year}-{5char-base36}`; `placedVia: "website"`.
- Confirmation opens `wa.me` with a pre-filled message. Admin manages status in `/admin/orders`.

**Auth (two systems):**
- **Users:** Neon Auth (`lib/auth/neon-auth.ts`, `get-current-user.ts`, client in `user-auth-client.ts`).
- **Admins:** legacy DB sessions — cookie `kaasth_admin_session` (HTTP-only, 7-day), scrypt passwords (`lib/auth/password.ts`, no bcrypt). `requireAdmin()` / `getCurrentAdmin()` in `lib/auth/session.ts`.
- `proxy.ts` is only the **first gate**; every protected page/action/route also calls `requireAdmin()`. Admin bootstraps from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env on first login if `admins` table is empty.

**AI content engine:** Vercel Cron (`vercel.json`, schedule `30 3 * * 2,5`) hits `/api/cron/generate-blog-post` (protected by `CRON_SECRET`), which uses `lib/content/*` + Anthropic SDK to draft a blog post.

**Caching:** Listing/detail pages use `export const revalidate = 60` (ISR). Product queries wrapped in `cached(key, ttl, loader)` (Upstash, ~10 min TTL). Enquiry/order POSTs never cached.

---

## Environments

Three env files (all gitignored): `.env.local` (dev, staging-equivalent), `.env.production`, plus `.env.staging`. `NEXT_PUBLIC_ENV_MODE` selects mode locally; on Vercel it derives from `VERCEL_ENV`. ImageKit uses one account with `IMAGEKIT_FOLDER_PREFIX` (`staging`/`prod`) to isolate uploads. Staging can be gated by `STAGING_PASSWORD` (basic auth via `proxy.ts`). See `STAGING_PRODUCTION.md`.

**Public env vars:** `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_ENV_MODE`. Everything else is server-only (`DATABASE_URL`, Upstash, ImageKit private, Neon Auth, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, `CRON_SECRET`, `SENTRY_DSN`). Template: `.env.example`.

---

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / run |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Drizzle migration from schema |
| `pnpm db:push` / `db:push:prod` | Push schema (staging / prod) |
| `pnpm db:migrate` / `db:migrate:prod` | Run migrations |
| `pnpm db:studio` / `db:studio:prod` | Drizzle Studio |
| `pnpm db:seed` | Seed showcase products/blog/admin |

> DB scripts are env-scoped via `DRIZZLE_ENV` (`staging` default, `prod` for the `:prod` variants).

---

## Conventions & expectations

- **Production-level code only** — no placeholders, no stubs, no mock data. Implement full CRUD and real integrations.
- Respect the **layering rule** — never query the DB from a route/component; go through service → repository.
- pnpm only. Money in paise. Markdown rendered by `lib/markdown.ts` (no extra npm dep).
- Further docs in repo: `README.md`, `FEATURES.md` (detailed feature log), `STAGING_PRODUCTION.md`, `AGENTS.md`.
