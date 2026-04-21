import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  blogPosts,
  productBlogSections,
  productImages,
  productVariants,
  products,
  type NewProductImageRow,
  type NewProductRow,
  type NewProductVariantRow,
  type ProductBlogSectionRow,
  type ProductImageRow,
  type ProductRow,
  type ProductVariantRow,
} from "@/lib/db/schema";
import type { BlogSectionInput, ProductAggregate } from "@/features/products/types";

export async function adminFindAllProducts(): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
}

export async function adminFindProductById(
  id: string,
): Promise<ProductAggregate | null> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const [variantRows, imageRows, sectionRows] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.sortOrder)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select({
        productId: productBlogSections.productId,
        sortOrder: productBlogSections.sortOrder,
        blog: blogPosts,
      })
      .from(productBlogSections)
      .innerJoin(blogPosts, eq(blogPosts.id, productBlogSections.blogPostId))
      .where(eq(productBlogSections.productId, id)),
  ]);

  return {
    product: row,
    variants: variantRows,
    images: imageRows,
    blogSections: sectionRows.map((s) => ({
      blog: s.blog,
      sortOrder: s.sortOrder,
    })) as BlogSectionInput[],
  };
}

export async function adminCreateProduct(
  data: NewProductRow,
): Promise<ProductRow> {
  const [row] = await db.insert(products).values(data).returning();
  return row;
}

export async function adminUpdateProduct(
  id: string,
  data: Partial<NewProductRow>,
): Promise<ProductRow | null> {
  const [row] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

export async function adminFindVariantsByProduct(
  productId: string,
): Promise<ProductVariantRow[]> {
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder));
}

export async function adminCreateVariant(
  data: NewProductVariantRow,
): Promise<ProductVariantRow> {
  const [row] = await db.insert(productVariants).values(data).returning();
  return row;
}

export async function adminUpdateVariant(
  variantId: string,
  data: Partial<NewProductVariantRow>,
): Promise<ProductVariantRow | null> {
  const [row] = await db
    .update(productVariants)
    .set(data)
    .where(eq(productVariants.id, variantId))
    .returning();
  return row ?? null;
}

export async function adminDeleteVariant(variantId: string): Promise<void> {
  await db
    .delete(productVariants)
    .where(eq(productVariants.id, variantId));
}

export async function adminFindImagesByProduct(
  productId: string,
): Promise<ProductImageRow[]> {
  return db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder));
}

export async function adminCreateImage(
  data: NewProductImageRow,
): Promise<ProductImageRow> {
  const [row] = await db.insert(productImages).values(data).returning();
  return row;
}

export async function adminUpdateImage(
  imageId: string,
  data: Partial<NewProductImageRow>,
): Promise<ProductImageRow | null> {
  const [row] = await db
    .update(productImages)
    .set(data)
    .where(eq(productImages.id, imageId))
    .returning();
  return row ?? null;
}

export async function adminDeleteImage(imageId: string): Promise<void> {
  await db.delete(productImages).where(eq(productImages.id, imageId));
}

export async function adminGetProductBlogLinks(
  productId: string,
): Promise<ProductBlogSectionRow[]> {
  return db
    .select()
    .from(productBlogSections)
    .where(eq(productBlogSections.productId, productId));
}

export async function adminSetProductBlogLinks(
  productId: string,
  blogPostIds: string[],
): Promise<void> {
  await db
    .delete(productBlogSections)
    .where(eq(productBlogSections.productId, productId));
  if (blogPostIds.length === 0) return;
  await db.insert(productBlogSections).values(
    blogPostIds.map((blogPostId, idx) => ({
      productId,
      blogPostId,
      sortOrder: idx,
    })),
  );
}
