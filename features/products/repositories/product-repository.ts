import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  blogPosts,
  productBlogSections,
  productImages,
  productVariants,
  products,
  type BlogPostRow,
  type ProductImageRow,
  type ProductRow,
  type ProductVariantRow,
} from "@/lib/db/schema";
import type { BlogSectionInput, ProductAggregate } from "../types";

export async function findFeaturedRows(limit: number): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.isFeatured, true))
    .orderBy(asc(products.sortOrder), desc(products.createdAt))
    .limit(limit);
}

export async function findAllRows(): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
}

export async function findRowBySlug(slug: string): Promise<ProductRow | null> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

async function loadAggregates(
  rows: ProductRow[],
): Promise<ProductAggregate[]> {
  if (rows.length === 0) return [];
  const productIds = rows.map((r) => r.id);

  const [variantRows, imageRows, sectionRows] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds)),
    db
      .select({
        productId: productBlogSections.productId,
        sortOrder: productBlogSections.sortOrder,
        blog: blogPosts,
      })
      .from(productBlogSections)
      .innerJoin(blogPosts, eq(blogPosts.id, productBlogSections.blogPostId))
      .where(
        inArray(productBlogSections.productId, productIds),
      ),
  ]);

  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  for (const v of variantRows) {
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push(v);
    variantsByProduct.set(v.productId, list);
  }

  const imagesByProduct = new Map<string, ProductImageRow[]>();
  for (const img of imageRows) {
    const list = imagesByProduct.get(img.productId) ?? [];
    list.push(img);
    imagesByProduct.set(img.productId, list);
  }

  const sectionsByProduct = new Map<string, BlogSectionInput[]>();
  for (const s of sectionRows) {
    const list = sectionsByProduct.get(s.productId) ?? [];
    list.push({ blog: s.blog as BlogPostRow, sortOrder: s.sortOrder });
    sectionsByProduct.set(s.productId, list);
  }

  return rows.map((product) => ({
    product,
    variants: variantsByProduct.get(product.id) ?? [],
    images: imagesByProduct.get(product.id) ?? [],
    blogSections: sectionsByProduct.get(product.id) ?? [],
  }));
}

export async function findFeaturedAggregates(
  limit: number,
): Promise<ProductAggregate[]> {
  const rows = await findFeaturedRows(limit);
  return loadAggregates(rows);
}

export async function findAllAggregates(): Promise<ProductAggregate[]> {
  const rows = await findAllRows();
  return loadAggregates(rows);
}

export async function findAggregateBySlug(
  slug: string,
): Promise<ProductAggregate | null> {
  const row = await findRowBySlug(slug);
  if (!row) return null;
  const [agg] = await loadAggregates([row]);
  return agg ?? null;
}
