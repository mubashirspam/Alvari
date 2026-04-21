import type {
  BlogPostRow,
  ProductImageRow,
  ProductRow,
  ProductVariantRow,
  VariantAttributes,
} from "@/lib/db/schema";

export type ProductCategory = ProductRow["category"];
export type ProductBadge = NonNullable<ProductRow["badge"]>;

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  attributes: VariantAttributes;
  priceNow: number;
  priceWas: number;
  discountPercent: number;
  stock: number;
  isDefault: boolean;
  sortOrder: number;
};

export type ProductImage = {
  id: string;
  variantId: string | null;
  imageKey: string;
  alt: string | null;
  sortOrder: number;
};

export type ProductBlogSection = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageKey: string | null;
  contentMarkdown: string;
  authorName: string;
  readingMinutes: number;
  sortOrder: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  meta: string;
  description: string;
  longDescription: string | null;
  brand: string;
  material: string | null;
  warrantyMonths: number;
  careInstructions: string | null;
  dimensions: string | null;
  weightKg: number | null;
  priceNow: number;
  priceWas: number;
  discountPercent: number;
  badge: ProductBadge | null;
  illustrationKey: string;
  imageUrl: string | null;
  gradientFrom: string;
  gradientTo: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  variants: ProductVariant[];
  images: ProductImage[];
  blogSections: ProductBlogSection[];
};

function rupees(paise: number): number {
  return paise / 100;
}

function percentOff(now: number, was: number): number {
  if (!was || was <= now) return 0;
  return Math.round(((was - now) / was) * 100);
}

export function mapVariantRow(row: ProductVariantRow): ProductVariant {
  const priceNow = rupees(row.priceNowInPaise);
  const priceWas = rupees(row.priceWasInPaise);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    attributes: row.attributes ?? {},
    priceNow,
    priceWas,
    discountPercent: percentOff(priceNow, priceWas),
    stock: row.stock,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
  };
}

export function mapImageRow(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    variantId: row.variantId,
    imageKey: row.imageKey,
    alt: row.alt,
    sortOrder: row.sortOrder,
  };
}

export type BlogSectionInput = {
  blog: BlogPostRow;
  sortOrder: number;
};

export function mapBlogSection(input: BlogSectionInput): ProductBlogSection {
  return {
    id: input.blog.id,
    slug: input.blog.slug,
    title: input.blog.title,
    excerpt: input.blog.excerpt,
    coverImageKey: input.blog.coverImageKey,
    contentMarkdown: input.blog.contentMarkdown,
    authorName: input.blog.authorName,
    readingMinutes: input.blog.readingMinutes,
    sortOrder: input.sortOrder,
  };
}

export type ProductAggregate = {
  product: ProductRow;
  variants: ProductVariantRow[];
  images: ProductImageRow[];
  blogSections: BlogSectionInput[];
};

export function mapProductAggregate(agg: ProductAggregate): Product {
  const row = agg.product;
  const variants = agg.variants
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(mapVariantRow);
  const images = agg.images
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(mapImageRow);
  const blogSections = agg.blogSections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(mapBlogSection);

  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const priceNow = defaultVariant?.priceNow ?? rupees(row.priceNowInPaise);
  const priceWas = defaultVariant?.priceWas ?? rupees(row.priceWasInPaise);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    meta: row.meta,
    description: row.description,
    longDescription: row.longDescription,
    brand: row.brand,
    material: row.material,
    warrantyMonths: row.warrantyMonths,
    careInstructions: row.careInstructions,
    dimensions: row.dimensions,
    weightKg: row.weightKg ? Number(row.weightKg) : null,
    priceNow,
    priceWas,
    discountPercent: percentOff(priceNow, priceWas),
    badge: row.badge,
    illustrationKey: row.illustrationKey,
    imageUrl: row.imageUrl,
    gradientFrom: row.gradientFrom,
    gradientTo: row.gradientTo,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    variants,
    images,
    blogSections,
  };
}

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  almirah: "Almirah / Wardrobe",
  bed: "Bed",
  sofa: "Sofa Setti",
  dining: "Dining Set",
  dressing: "Dressing Table",
  coffee_table: "Coffee Table",
  mattress: "Mattress",
  room_set: "Complete Room Set",
  custom: "Custom / Other",
};

export const BADGE_LABEL: Record<ProductBadge, string> = {
  bestseller: "Bestseller",
  new: "New",
  trending: "Trending",
  value_pick: "Value Pick",
  best_value: "Best Value",
};

export const HOT_BADGES: ReadonlySet<ProductBadge> = new Set([
  "bestseller",
  "trending",
  "best_value",
]);
