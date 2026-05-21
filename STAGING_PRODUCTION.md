# Alvari — Staging & Production

Two environments. `staging` branch = active dev. `main` branch = production. One Neon project, two branches. One ImageKit, env-prefixed folders. Everything else: see the "Pending" list.

---

## Branch map

| | Staging | Production |
|---|---|---|
| Git branch | `staging` | `main` |
| URL (when live) | `staging.alvari.com` | `alvari.com` |
| Neon branch | `main` (id `br-bitter-lab-aj4zu36r`) | `production` (id `br-dark-block-ajksurrk`) |
| DB host | `ep-rapid-mud-aj0qn10h-pooler.c-3.us-east-2.aws.neon.tech` | `ep-still-cell-aj0mqxfq-pooler.c-3.us-east-2.aws.neon.tech` |
| Image folder | `/staging/kaasth/products` | `/prod/kaasth/products` |
| Cron | skipped | runs Tue+Fri 9am IST |
| Redis | (TBD: `alvari-staging`) | (TBD: `alvari-prod`) |
| Neon Auth | (TBD: separate instance) | (TBD: separate instance) |

Both Neon branches currently hold identical data (29 products, 12 categories, 9 banners, 3 collections, 5 blog posts) — they diverge from now on.

---

## What's done ✅

- Production Neon branch created, identical to staging
- Code knows which env it's in (`envMode()`, `isProd()`, `isStaging()` in `lib/env.ts`)
- Cron auto-skips on non-prod (`app/api/cron/generate-blog-post/route.ts`)
- Image uploads go to env-specific ImageKit folders (`/api/upload-auth` returns the folder)
- Non-prod gets `X-Robots-Tag: noindex`, optional basic-auth via `STAGING_PASSWORD` (in `proxy.ts`)
- Drizzle scripts split: `pnpm db:push:staging`, `pnpm db:push:prod`, `pnpm db:migrate:prod`
- Local `staging` git branch exists
- `.env.example` documents the full env-var set

---

## What's pending — your to-do ⏳

In order. Each is 5–15 min.

1. **Create env files locally**
   ```bash
   cp .env.example .env.staging
   cp .env.example .env.production
   ```
   Paste the connection strings below into each. Set `NEXT_PUBLIC_ENV_MODE=staging` or `production`. Set `IMAGEKIT_FOLDER_PREFIX` to `staging` or `prod`.
2. **Upstash Redis** — create 2 free DBs (`alvari-staging`, `alvari-prod`), Mumbai region. Paste REST URL + token into `.env.staging` / `.env.production` and (later) Vercel.
3. **Neon Auth** — create 2 instances (`alvari-staging`, `alvari-prod`). Different `NEON_AUTH_COOKIE_SECRET` (`openssl rand -hex 32`).
4. **Vercel project** — import the repo. Production branch = `main`. Add env vars per scope (Production scope = prod values, Preview scope = staging values). The env-var table is at the bottom of this doc.
5. **Domains** — point `alvari.com` → Vercel (Production scope), `staging.alvari.com` → assign to the `staging` branch.
6. **Push the code** (see "Daily workflow" below).
7. **Later**: WhatsApp test phone number, Resend, Sentry.

---

## Daily workflow — what to do on each push

```bash
# 1. Make your changes on the staging branch
git checkout staging
# ...edit code...

# 2. If you changed the DB schema, push to staging DB
pnpm db:push:staging

# 3. Commit + push to GitHub → auto-deploys to staging.alvari.com
git add .
git commit -m "feat: <what you did>"
git push origin staging
```

That's it. Vercel deploys staging on every push to the `staging` branch. Feature branches off staging (`feat/*`) get their own preview URL and also use the staging DB.

---

## Promotion — staging → production (the release ritual)

When staging has been tested and is ready to go live:

```bash
# 1. If you changed the DB schema, generate + apply the migration to prod first
pnpm db:generate                              # writes SQL into drizzle/
git add drizzle/ && git commit -m "chore: migration"
pnpm db:migrate:prod                          # applies to production DB

# 2. Open the release PR
gh pr create --base main --head staging --title "Release v0.X.0"

# 3. Merge it. Vercel auto-deploys to alvari.com.

# 4. Tag the release for easy rollback
git checkout main && git pull
git tag v0.X.0 && git push --tags
```

**Hotfix** (skip staging): branch off `main`, PR back to `main`, merge into `staging` after.

---

## Refresh staging from production (monthly)

Neon Console → branches → `main` → "Reset from parent" (parent = `production`). Resets staging to look like prod in seconds. All staging-only test data is wiped.

---

## Connection strings

**Staging** (Neon `main` branch):
```
postgresql://neondb_owner:npg_o2RMGc0vbeWl@ep-rapid-mud-aj0qn10h-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

**Production** (Neon `production` branch):
```
postgresql://neondb_owner:npg_o2RMGc0vbeWl@ep-still-cell-aj0mqxfq-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

---

## Vercel env-var scope map

When adding a var in Vercel → check **Production** for prod values, **Preview** for staging values. Skip Development.

| Var | Production scope | Preview scope |
|---|---|---|
| `DATABASE_URL` | prod Neon URL | staging Neon URL |
| `NEXT_PUBLIC_ENV_MODE` | `production` | `staging` |
| `IMAGEKIT_FOLDER_PREFIX` | `prod` | `staging` |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | prod Upstash | staging Upstash |
| `NEON_AUTH_BASE_URL` / `COOKIE_SECRET` | prod auth | staging auth |
| `NEXT_PUBLIC_SITE_URL` | `https://alvari.com` | `https://staging.alvari.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | real | test number |
| `ANTHROPIC_API_KEY` | shared | shared |
| `CRON_SECRET` | unique secret | unique secret |
| `STAGING_PASSWORD` | unset | (optional) lock staging behind basic auth |
| `IMAGEKIT_PUBLIC_KEY` / `PRIVATE_KEY` | shared | shared |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | shared | shared |

That's the full set. Anything else you add later: same pattern — different value per scope when it should isolate, same value when it can be shared.
