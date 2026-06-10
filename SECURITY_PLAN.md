# Alvari — Security Hardening Implementation Plan (Admin-First)

> Audience: AI coding agent working in the `directfurn` repo (Next.js 16.2.4, App Router, `proxy.ts` instead of middleware).
> Read `CLAUDE.md` first. Two auth systems exist: Neon Auth (users + admin via role metadata) and legacy DB sessions
> (`admins` + `admin_sessions`, scrypt, cookie). Every protected route already calls `requireAdmin()` — keep that invariant.
>
> Priority order: (A) make the admin panel invisible & unbruteforcable, (B) harden sessions/auth,
> (C) platform-wide headers + abuse protection on public APIs, (D) auditability.

---

## Phase A — Hide and lock down the admin surface (1–2 days)

### A.1 Stealth admin path (no visible /admin, no login redirect leak)
Goal stated by owner: visiting admin URLs must not reveal that an admin panel exists.

Implementation in `proxy.ts`:
1. Add env `ADMIN_PATH_SECRET` (e.g. a random slug like `ws-mgmt-7k2f`). The real login page moves to `/{ADMIN_PATH_SECRET}/login` via a **rewrite** (URL bar shows the secret path; filesystem route stays `app/admin/login`).
2. For any request to `/admin/*` **without a valid admin session**: respond with the site's standard **404 page** (rewrite to `/not-found`), NOT a redirect to login. An attacker probing `/admin` sees exactly what `/zzz-random` returns — same status, same body, same headers (no `Set-Cookie`, no cache differences). With a valid session, `/admin/*` works normally.
3. `/admin/login` itself (the unsuffixed path) also returns 404. Only the secret path serves the login form.
4. Keep `requireAdmin()` in every page/action/API as the second gate — the proxy is gate #1 only. Admin **API** routes (`/api/admin/*`) without a valid session must return 404 (not 401/403) for the same non-disclosure reason.
5. Exclude `/admin` from sitemap (already), and confirm robots.txt disallow doesn't list the secret path (listing it would leak it — disallow `/admin` only; the secret path stays unlisted and is protected by auth anyway).

**Acceptance:** `curl -i https://alvari.in/admin` → 404 identical to a random 404; `curl -i https://alvari.in/admin/login` → 404; secret path serves login; logged-in admin browses `/admin/**` normally; all `/api/admin/*` unauthenticated → 404.

### A.2 Login brute-force protection
In the admin login action/route:
- Upstash rate limit: **5 attempts / 15 min per IP** and **10 / hour per email** (use `@upstash/ratelimit` sliding window; key prefix `rl:adminlogin:`). On limit: generic "Too many attempts, try later" — never reveal whether the email exists.
- Constant-time comparison everywhere (scrypt verify already is; ensure any token/secret comparisons use `crypto.timingSafeEqual`).
- Add **Cloudflare Turnstile** (free, invisible) on the login form. Env: `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`. Verify server-side before checking the password.
- Uniform failure message and uniform response time (run scrypt against a dummy hash even when the email doesn't exist — prevents user enumeration via timing).

### A.3 Optional IP allowlist
Env `ADMIN_ALLOWED_IPS` (comma-separated CIDRs/IPs). If set, `proxy.ts` rejects (404) admin requests from other IPs. Leave unset by default since the owner is mobile; document it as a switch they can flip if the workshop has a static IP/VPN.

### A.4 Two-factor auth (TOTP) for legacy admin accounts (second pass, ~2 days)
- Schema: add `totpSecret` (encrypted at rest with `AUTH_ENCRYPTION_KEY` env, AES-256-GCM) and `totpEnabled` to `admins`.
- Use `otplib`. Enrolment page inside the admin panel (QR via `qrcode` package, data-URL only, never stored). Login becomes two steps when enabled: password → 6-digit code (rate-limited 5/15min). Generate 8 one-time recovery codes (store scrypt-hashed).
- Enforce `totpEnabled` for `owner` role.

---

## Phase B — Session & auth hardening (1 day)

### B.1 Cookie + session hygiene
File: `lib/auth/session.ts`, `lib/auth/constants.ts`
- Cookie flags: `HttpOnly`, `Secure` (prod), `SameSite=Strict` for the admin cookie, `Path=/` (needed for both `/admin` and `/api/admin`). Rename consistently (docs show both `kaasth_admin_session` and `alvari_admin_session` — pick one, migrate, prefix with `__Host-` in production for binding to host + secure + path=/).
- **Rotate session token on login** (new token, delete old) and on privilege-sensitive actions (password change).
- Sliding expiry: 7-day absolute max, but also a 24h inactivity timeout (add `lastSeenAt` to `admin_sessions`, update at most once per 5 min to avoid write amplification).
- Logout deletes the DB row, not just the cookie. Add "log out all sessions" button (delete all rows for that admin).
- On password change: invalidate all other sessions for that admin.

### B.2 CSRF
- Server Actions in Next 16 enforce Origin/Host checks — verify all admin mutations go through Server Actions **or**:
- For `/api/admin/*` route handlers accepting POST/PATCH/DELETE: reject requests whose `Origin` header is present and ≠ `NEXT_PUBLIC_SITE_URL` (and reject missing Origin for non-GET). `SameSite=Strict` cookie is the primary defence; the Origin check is belt-and-braces.

### B.3 RBAC enforcement
Roles exist (`owner` / `admin` / `editor`) but verify enforcement:
- `requireAdmin(minRole?)` — extend to accept a minimum role. Map: promo codes, admin management, destructive deletes → `owner`/`admin`; blog/banners/collections/categories → `editor`+.
- Admin management UI (`/admin/admins`, owner-only): create/disable admins, force password reset. Currently admins bootstrap from env only — build this small CRUD so the env bootstrap can be retired after first login.

### B.4 Secrets hygiene (owner checklist + code)
- Rotate `ADMIN_PASSWORD` after A/B ship; remove the env-bootstrap path once B.3 admin management exists.
- `CRON_SECRET` check must use `timingSafeEqual`; also verify the Vercel cron header `x-vercel-cron` as a second signal.
- Audit that no server-only secret is referenced in client components (grep for `process.env.` in `components/` and `features/**/components/`).
- ImageKit upload auth (`/api/upload-auth`): scope tokens to the expected folder (`/kaasth/custom-orders` for public use), short expiry, and rate-limit the endpoint (10/min/IP) — currently it can mint upload tokens for anyone.

---

## Phase C — Platform headers & public-API abuse protection (1 day)

### C.1 Security headers (in `next.config.ts` headers() or `proxy.ts`)
Apply globally:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY` (and CSP `frame-ancestors 'none'`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Content-Security-Policy** — start in `Content-Security-Policy-Report-Only`, iterate, then enforce. Baseline: `default-src 'self'; img-src 'self' https://ik.imagekit.io data: blob:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://upload.imagekit.io https://api.postalpincode.in https://*.upstash.io; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Tighten `unsafe-inline` later with nonces if feasible under streaming.

### C.2 Rate limiting public write endpoints (Upstash + `lib/security/rate-limit.ts` helper)
| Endpoint | Limit | Notes |
| --- | --- | --- |
| `POST /api/orders` | 5 / hour / IP | + honeypot field in checkout form; reject if filled |
| `POST /api/enquiries` | 5 / hour / IP | + honeypot |
| `GET /api/promo/validate` | 20 / min / IP | prevents code brute-forcing |
| `GET /api/orders/lookup` | already 5/min/IP — keep | |
| `POST /api/track` | 60 / min / IP | cheap, but cap abuse |
| `GET /api/upload-auth` | 10 / min / IP | see B.4 |

Graceful: if Upstash env unset (dev), limiter passes through (match `cached()` pattern).

### C.3 Input/upload validation
- All public POST bodies already Zod-validated — audit each schema for max lengths (notes ≤2000 exists; add caps on every free-text field), strict `.strip()` of unknown keys.
- Custom-order reference images: server cannot intercept the direct-to-ImageKit upload, so validate on read: when rendering admin order detail, only render URLs matching your ImageKit endpoint + expected folder prefix. In the order schema, validate `customReferenceImages` entries against `^https://ik\.imagekit\.io/<id>/(staging|production)?/?kaasth/custom-orders/` and max 3 entries.
- Markdown rendering (`lib/markdown.ts`): confirm it escapes/sanitises HTML (no raw HTML passthrough) — blog content is admin/AI-authored today, but defence in depth; sanitise output (allowlist tags) so a compromised AI generation can't inject scripts.

### C.4 Order integrity (verify existing, add tests)
Server-side price re-verification exists — add tests covering: tampered unit price, tampered promo discount, expired promo, exceeded promo `maxUsages` race (increment usage atomically with a conditional `UPDATE ... WHERE used < max` and check affected rows).

---

## Phase D — Audit logging & monitoring (1 day)

### D.1 Admin audit log
- New table `admin_audit_log`: id, adminId, action (enum-ish text: `login.success`, `login.failed`, `order.status_changed`, `product.updated`, `promo.created`, `admin.created`, …), entityType, entityId, metadata JSONB (old/new status etc.), ip, userAgent, createdAt. Index on (adminId, createdAt).
- Write via a small `lib/security/audit.ts` helper called from services (fire-and-forget, never blocks).
- Read-only viewer at `/admin/audit` (owner role), filterable by admin/action/date.

### D.2 Alerting
- Sentry already present: ensure server-side exceptions in auth paths are captured with admin email scrubbed.
- Email alert (Resend, reuse `lib/email`) to `ADMIN_EMAIL` on: 5+ failed logins in 15 min, new admin created, login from a previously unseen IP for an admin (store last N IPs per admin in the audit log and compare).

### D.3 Dependency & platform hygiene (owner checklist)
- Enable GitHub Dependabot/`pnpm audit` in CI; pin Node version.
- Vercel: turn on "Attack Challenge Mode" awareness (manual toggle during attacks), enable Vercel WAF managed rules if on a plan that includes it.
- Neon: confirm the app's DB role is least-privilege (no superuser), connection string only in server env.
- Quarterly: rotate `IMAGEKIT_PRIVATE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `NEON_AUTH_COOKIE_SECRET` (with session-invalidations communicated).

---

## Build order summary for the AI agent

1. A.1 stealth path + 404 behaviour → 2. A.2 login rate limit + Turnstile → 3. B.1 cookie/session hygiene → 4. C.1 headers (CSP report-only) → 5. C.2 public API rate limits → 6. C.3 validation audit → 7. D.1 audit log → 8. B.3 RBAC + admin management → 9. A.4 TOTP 2FA → 10. enforce CSP.

Rules: run `pnpm typecheck && pnpm lint && pnpm build` after each step; never weaken the existing `requireAdmin()` second gate; all new tables go through repository → service layering; no mock implementations.

## New env vars introduced
`ADMIN_PATH_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `ADMIN_ALLOWED_IPS` (optional), `AUTH_ENCRYPTION_KEY`, `INDEXNOW_KEY` (from SEO plan). Add all to `.env.example` and `lib/env.ts` typed schema.
