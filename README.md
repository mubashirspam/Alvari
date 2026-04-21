# Alvari — Direct-from-Factory Furniture

Production Next.js 16 app for Alvari, a Wayanad-based furniture workshop selling direct to customers across Kerala.

## Stack

- **Next.js 16** (App Router, async Request APIs, ISR)
- **TypeScript** (strict)
- **Tailwind CSS v4** with design tokens in `app/globals.css`
- **shadcn-style UI primitives** (Button, Input, Textarea, Select, Label)
- **Drizzle ORM** over **Neon Postgres**
- **Upstash Redis** for product query caching
- **ImageKit** for image delivery
- **Vercel**-ready

## Folder structure

```
app/
  layout.tsx, globals.css            # shell + design tokens
  page.tsx                           # landing page (ISR, composes sections)
  products/
    page.tsx                         # listing with category filter
    [slug]/page.tsx                  # detail page
    [slug]/not-found.tsx
  api/
    products/route.ts
    products/[slug]/route.ts
    enquiries/route.ts
components/
  ui/                                # shadcn primitives
  layout/                            # nav, footer, marquee, announcement, WA float, ScrollReveal
features/
  landing/                           # hero, why, preview, process, testimonial, enquiry CTA
  products/
    components/                      # ProductCard, ProductIllustration
    repositories/product-repository  # DB queries only
    services/product-service         # business logic + Redis cache
    types.ts
  enquiries/
    components/enquiry-form          # client form
    repositories/enquiry-repository
    services/enquiry-service
    schema.ts                        # zod validation
lib/
  db/index.ts, db/schema.ts
  cache/redis.ts, cache/keys.ts      # cached() wrapper
  imagekit.ts                        # URL transformer
  env.ts                             # typed env + siteConfig
  utils.ts                           # cn + formatINR
scripts/
  seed.ts                            # tsx scripts/seed.ts
drizzle.config.ts
```

**Layering rule:** API routes call services. Services own business logic and caching. Repositories own DB queries. Components are UI-only.

## Setup

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env.local
# …and fill in Neon, Upstash, ImageKit credentials

# 3. Push the Drizzle schema to Neon
npm run db:push

# 4. Seed the products
npm run db:seed

# 5. Start dev
npm run dev
```

## Environment variables

See `.env.example`. All secrets are server-only except:

- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate a new Drizzle migration from `lib/db/schema.ts` |
| `npm run db:push` | Push schema to Neon (prototyping) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed the six showcase products |

## Caching strategy

- **Listing + detail pages**: `export const revalidate = 60` (ISR).
- **Product queries**: wrapped in `cached(key, ttl, loader)` (Upstash). Falls through to the DB transparently if Redis env vars are missing. TTL is 10 minutes.
- **Enquiry POSTs** are never cached.

## Deploying to Vercel

1. Push the repo.
2. Import into Vercel — it will auto-detect Next.js.
3. Paste the values from `.env.local` into Vercel's Project → Settings → Environment Variables.
4. Deploy.
