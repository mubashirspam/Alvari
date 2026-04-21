---
name: drizzle-migration
description: Make a schema change against the Drizzle/Neon database — adding, altering, or dropping a column, table, enum value, or index. Use when the user asks to change DB shape, add a field, or rename a column.
---

# Drizzle schema change

Schema is authored in `lib/db/schema.ts`; migrations are generated from it.
Do **not** hand-author SQL in `drizzle/`.

## Decision tree

| Change | Safe path |
|---|---|
| Add a nullable column | Edit schema → generate → push |
| Add a non-null column with default | Edit schema (include `.default(...)`) → generate → push |
| Add a non-null column with no default | Two migrations: add nullable → backfill → set NOT NULL |
| Rename a column | Drizzle cannot always infer renames. Review the generated SQL — if it produced DROP+ADD, edit the migration to `RENAME COLUMN` before pushing to prod |
| Drop a column | Confirm with user — data loss is irreversible |
| Add an enum value | Edit `pgEnum` list → generate. Check the SQL uses `ALTER TYPE ... ADD VALUE` |
| Remove an enum value | Postgres doesn't support this. Create a new enum, migrate data, drop the old one — ask user before attempting |
| Add an index | Edit schema's `(table) => [index(...)...]` block → generate → push |

## Steps

1. **Read the current schema** at `lib/db/schema.ts` so you understand the
   table's existing columns, enums, and indexes before editing.

2. **Edit `lib/db/schema.ts`**. For money use `integer("x_in_paise")`, not
   numeric/float. For enums use `pgEnum` and keep the Zod schema in sync.
   Always add an `index()` for any column you'll filter or sort by.

3. **Generate the migration**:
   ```bash
   npm run db:generate
   ```
   This writes a new SQL file into `drizzle/`. **Read the generated SQL** —
   Drizzle infers column renames as drop+add when it can't tell. If you see a
   `DROP COLUMN ... ADD COLUMN` pair for what should be a rename, manually
   change it to `ALTER TABLE ... RENAME COLUMN old TO new;` before pushing.

4. **Apply to the dev database**:
   ```bash
   npm run db:push        # prototyping — prompts for confirmation
   ```
   For production, commit the SQL file; deploy flow runs it.

5. **Update TypeScript consumers**. `$inferSelect`/`$inferInsert` will update
   automatically — `npm run typecheck` will flag any repos/services that no
   longer type-check.

6. **Update the Zod schema** if the shape changed
   (`features/<domain>/schema.ts`). The Zod enum values must match the pg enum
   exactly.

7. **Update the seed** at `scripts/seed.ts` if the new column is non-null
   without a default.

8. **Bump the cache key version** if cached rows from this table have changed
   shape. In `lib/cache/keys.ts`, change `:v1` → `:v2` for the affected keys so
   stale entries age out.

9. **Verify**:
   ```bash
   npm run typecheck
   npm run db:studio    # optional — inspect the applied schema
   ```

## Gotchas

- `@neondatabase/serverless` uses HTTP — no transactions across statements,
  so prefer one-shot migrations. Multi-step data migrations should be idempotent.
- Don't `db:push` against the production database. Use generated migrations.
- `db:push --force` is never justified here without explicit user approval.
- If a migration fails halfway, Neon may be in a partial state — inspect with
  `db:studio` and roll forward; don't guess.
