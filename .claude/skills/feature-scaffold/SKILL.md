---
name: feature-scaffold
description: Scaffold a new domain feature (e.g. "orders", "reviews") following the layered architecture — repository → service → route handler → UI component. Use when the user asks to add a new feature, entity, or resource that needs its own DB table, API, and UI.
---

# Scaffold a new feature

Alvari features live under `features/<domain>/` and follow a strict layering
rule. Use this skill when adding a brand-new domain (not when extending an
existing one).

## Layering (non-negotiable)

```
app/api/<domain>/route.ts  →  service  →  repository  →  db
                              ↑ owns Zod parsing + Redis caching
```

Components never touch `db` or `cached()` directly. Routes never touch `db`.

## Steps

1. **Pick a domain name** — kebab-case plural if it maps to a table
   (`orders`, `reviews`), singular if it's a value object. Confirm with the user
   before scaffolding if the name is ambiguous.

2. **Add the Drizzle table** in `lib/db/schema.ts`:
   - Use `uuid("id").defaultRandom().primaryKey()`.
   - Timestamps as `timestamp(..., { withTimezone: true })`.
   - Money as `integer("price_..._in_paise")` — never floats.
   - Add `pgEnum` for status/category fields (keep strings in sync with Zod).
   - Add an `index()` for every column used in a `WHERE` or `ORDER BY`.
   - Export `type XRow = typeof x.$inferSelect` and
     `type NewXRow = typeof x.$inferInsert`.

3. **Generate + apply the migration**:
   ```bash
   npm run db:generate   # writes SQL into ./drizzle/
   npm run db:push       # applies to Neon (prototyping)
   ```
   Do NOT hand-edit generated SQL.

4. **Create the folder layout**:
   ```
   features/<domain>/
     schema.ts                        # Zod input schema + inferred types
     types.ts                         # (if you need a mapped domain type)
     repositories/<domain>-repository.ts
     services/<domain>-service.ts
     components/<domain>-x.tsx        # UI, as needed
   ```

5. **Write the repository** (Drizzle queries only — no business logic):
   ```ts
   // features/<domain>/repositories/<domain>-repository.ts
   import { eq } from "drizzle-orm";
   import { db } from "@/lib/db";
   import { <table>, type <Row> } from "@/lib/db/schema";

   export async function findById(id: string): Promise<<Row> | null> {
     const rows = await db.select().from(<table>).where(eq(<table>.id, id)).limit(1);
     return rows[0] ?? null;
   }
   ```

6. **Write the Zod schema** in `features/<domain>/schema.ts`. Mirror the DB
   enums exactly. Use `.optional().nullable()` for columns you allow `null`.

7. **Write the service** — owns validation + caching:
   ```ts
   // features/<domain>/services/<domain>-service.ts
   import { cached, invalidate } from "@/lib/cache/redis";
   import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
   import { <schema>, type <Input> } from "../schema";
   import * as repo from "../repositories/<domain>-repository";

   export async function getById(id: string) {
     return cached(cacheKeys.<domain>ById(id), cacheTtl.<domain>, () => repo.findById(id));
   }

   export async function create(raw: unknown) {
     const input: <Input> = <schema>.parse(raw);
     const row = await repo.insert(input);
     await invalidate(cacheKeys.<domain>ById(row.id));
     return row;
   }
   ```

8. **Register cache keys** in `lib/cache/keys.ts`:
   ```ts
   export const cacheKeys = {
     ...,
     <domain>ById: (id: string) => `<domain>:id:v1:${id}`,
   } as const;
   export const cacheTtl = { ..., <domain>: 60 * 10 } as const;
   ```
   Bump the `:v1` suffix whenever the cached shape changes.

9. **Add the route handler** (`app/api/<domain>/route.ts`):
   ```ts
   import { NextResponse } from "next/server";
   import * as service from "@/features/<domain>/services/<domain>-service";

   export async function POST(req: Request) {
     try {
       const row = await service.create(await req.json());
       return NextResponse.json({ ok: true, data: row });
     } catch (err) {
       const msg = err instanceof Error ? err.message : "Unknown error";
       return NextResponse.json({ ok: false, error: msg }, { status: 400 });
     }
   }
   ```

10. **UI** — Server Components by default. Only add `"use client"` for forms
    or interactive state. Server components call the service directly:
    ```tsx
    import { getAll } from "@/features/<domain>/services/<domain>-service";
    export default async function Page() {
      const rows = await getAll();
      return ...;
    }
    ```

11. **Verify**:
    ```bash
    npm run typecheck
    npm run lint
    ```

## Checks before reporting done

- [ ] No component imports `db` or `cached`.
- [ ] No route handler imports `db`.
- [ ] Cache key is declared in `lib/cache/keys.ts`, not inlined.
- [ ] Zod validation lives in the service (not duplicated in the route).
- [ ] Money columns are integer paise.
- [ ] Every filtered/sorted column has an index.
- [ ] `npm run typecheck` passes.
