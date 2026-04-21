---
name: cached-query
description: Add a new cached read query, or wire up cache invalidation for an existing write path. Use when the user asks to cache a DB query, speed up a page, or invalidate stale data after a mutation.
---

# Cached query

The cache layer is Upstash Redis, accessed through `cached()` in
`lib/cache/redis.ts`. Caching lives at the **service** layer only.

## Invariants

- Cache keys are declared in `lib/cache/keys.ts` — never inline a key string at
  the call site.
- TTLs are declared in `cacheTtl` in the same file.
- `cached()` is a no-op fallthrough when Upstash env vars are missing. Your
  code must keep working without Redis.
- Only services call `cached()`. Repos stay pure DB; routes/components don't
  touch the cache.
- Writes that would make a cached read stale must call `invalidate(...keys)`.

## Adding a new cached read

1. **Write the loader as a pure repo call** first, no caching:
   ```ts
   // features/products/repositories/product-repository.ts
   export async function findByCategory(category: Category): Promise<ProductRow[]> {
     return db.select().from(products).where(eq(products.category, category));
   }
   ```

2. **Register the key + TTL** in `lib/cache/keys.ts`:
   ```ts
   export const cacheKeys = {
     ...,
     productsByCategory: (c: string) => `products:category:v1:${c}`,
   } as const;

   export const cacheTtl = {
     products: 60 * 10,   // reuse existing TTL if same domain
   } as const;
   ```

   Rules for key strings:
   - Format: `<domain>:<index>:v<n>:<args>` — colon-delimited, lowercase.
   - `v1` is a shape version. If you ever change what's stored (add/remove a
     field on the cached value), bump to `v2` so stale entries age out.
   - Don't `JSON.stringify` complex args — flatten them into the string so
     similar inputs collide cleanly.

3. **Wrap in the service**:
   ```ts
   // features/products/services/product-service.ts
   export async function getProductsByCategory(category: Category) {
     return cached(
       cacheKeys.productsByCategory(category),
       cacheTtl.products,
       async () => {
         const rows = await findByCategory(category);
         return rows.map(mapProductRow);
       },
     );
   }
   ```

4. **Call from the route handler or server component** — never from the
   client. For pages, pair with `export const revalidate = 60` for ISR.

## Adding invalidation to a write path

When a mutation changes data that some cached read returns, invalidate the
affected keys in the service method that performs the mutation:

```ts
// features/products/services/product-service.ts
export async function publishProduct(id: string) {
  const row = await repo.markPublished(id);
  await invalidate(
    cacheKeys.productsAll,
    cacheKeys.productsFeatured(6),
    cacheKeys.productBySlug(row.slug),
  );
  return row;
}
```

Principles:

- **Invalidate keys, don't flush the cache.** Never call `redis.flushdb()` or
  anything similar.
- **Prefer bumping the `v<n>` suffix** when a schema change alters the cached
  shape — much simpler than invalidating every possible key.
- **Collection caches** (`productsAll`, `productsFeatured(limit)`) are stale
  after any product insert/update/delete. If you write a new mutation,
  invalidate both the collection keys and the per-entity key.
- **Don't cache writes.** Enquiries are a write endpoint and are never cached.

## Gotchas

- `cached()` swallows Redis errors and falls through to the loader — by design.
  Don't add your own try/catch around it.
- If you see duplicate work (Redis `GET` + loader firing together), it's
  usually because the key includes a value that varies per request (e.g. a
  timestamp). Keep keys deterministic for a given input.
- Serialization is via `Redis.set(..., value)` — Upstash handles JSON. Don't
  pass non-JSON-safe values (Dates, Maps, Drizzle row prototypes). Map to
  plain objects first (see `mapProductRow` in `features/products/types.ts`).
- `:v1` cache entries live for the TTL — bumping the version leaves the old
  keys in Redis until they expire. That's fine; don't try to clean them up.

## Verify

```bash
npm run typecheck
# Manually: hit the page with and without UPSTASH_REDIS_REST_URL unset
```
