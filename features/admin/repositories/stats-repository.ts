import { count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  blogPosts,
  enquiries,
  productVariants,
  products,
} from "@/lib/db/schema";

export type AdminCounts = {
  products: number;
  activeProducts: number;
  variants: number;
  blogPosts: number;
  publishedPosts: number;
  enquiriesOpen: number;
  enquiriesTotal: number;
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const [
    [productTotal],
    [productActive],
    [variantTotal],
    [blogTotal],
    [blogPublished],
    [enquiryOpen],
    [enquiryTotal],
  ] = await Promise.all([
    db.select({ c: count() }).from(products),
    db.select({ c: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ c: count() }).from(productVariants),
    db.select({ c: count() }).from(blogPosts),
    db
      .select({ c: count() })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true)),
    db
      .select({ c: count() })
      .from(enquiries)
      .where(sql`${enquiries.status} in ('new','contacted','quoted')`),
    db.select({ c: count() }).from(enquiries),
  ]);

  return {
    products: Number(productTotal?.c ?? 0),
    activeProducts: Number(productActive?.c ?? 0),
    variants: Number(variantTotal?.c ?? 0),
    blogPosts: Number(blogTotal?.c ?? 0),
    publishedPosts: Number(blogPublished?.c ?? 0),
    enquiriesOpen: Number(enquiryOpen?.c ?? 0),
    enquiriesTotal: Number(enquiryTotal?.c ?? 0),
  };
}

export async function getRecentEnquiries(limit = 5) {
  return db
    .select()
    .from(enquiries)
    .orderBy(sql`${enquiries.createdAt} desc`)
    .limit(limit);
}
