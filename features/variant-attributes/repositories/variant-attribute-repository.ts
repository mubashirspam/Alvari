import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categoryVariantAttributes,
  type CategoryVariantAttributeRow,
  type ProductRow,
} from "@/lib/db/schema";
import type {
  VariantAttributeCreateInput,
  VariantAttributeUpdateInput,
} from "@/features/variant-attributes/schema";

export async function findAllAttributeDefs(): Promise<CategoryVariantAttributeRow[]> {
  return db
    .select()
    .from(categoryVariantAttributes)
    .orderBy(
      asc(categoryVariantAttributes.category),
      asc(categoryVariantAttributes.sortOrder),
    );
}

export async function findAttributeDefsByCategory(
  category: ProductRow["category"],
): Promise<CategoryVariantAttributeRow[]> {
  return db
    .select()
    .from(categoryVariantAttributes)
    .where(eq(categoryVariantAttributes.category, category))
    .orderBy(asc(categoryVariantAttributes.sortOrder));
}

export async function createAttributeDef(
  input: VariantAttributeCreateInput,
): Promise<CategoryVariantAttributeRow> {
  const [row] = await db
    .insert(categoryVariantAttributes)
    .values(input)
    .returning();
  return row;
}

export async function updateAttributeDef(
  id: string,
  input: VariantAttributeUpdateInput,
): Promise<CategoryVariantAttributeRow | null> {
  const [row] = await db
    .update(categoryVariantAttributes)
    .set(input)
    .where(eq(categoryVariantAttributes.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAttributeDef(id: string): Promise<boolean> {
  const rows = await db
    .delete(categoryVariantAttributes)
    .where(eq(categoryVariantAttributes.id, id))
    .returning({ id: categoryVariantAttributes.id });
  return rows.length > 0;
}
