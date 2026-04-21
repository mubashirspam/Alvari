import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const productCategoryEnum = pgEnum("product_category", [
  "almirah",
  "bed",
  "sofa",
  "dining",
  "dressing",
  "coffee_table",
  "mattress",
  "room_set",
  "custom",
]);

export const productBadgeEnum = pgEnum("product_badge", [
  "bestseller",
  "new",
  "trending",
  "value_pick",
  "best_value",
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    category: productCategoryEnum("category").notNull(),
    meta: text("meta").notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    brand: text("brand").notNull().default("Alvari"),
    material: text("material"),
    warrantyMonths: integer("warranty_months").notNull().default(12),
    careInstructions: text("care_instructions"),
    dimensions: text("dimensions"),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    priceNowInPaise: integer("price_now_in_paise").notNull(),
    priceWasInPaise: integer("price_was_in_paise").notNull(),
    badge: productBadgeEnum("badge"),
    illustrationKey: text("illustration_key").notNull(),
    imageUrl: text("image_url"),
    gradientFrom: text("gradient_from").notNull(),
    gradientTo: text("gradient_to").notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_featured_idx").on(table.isFeatured, table.sortOrder),
    index("products_category_idx").on(table.category),
    index("products_active_idx").on(table.isActive),
  ],
);

export type VariantAttributes = Record<string, string | number | boolean>;

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    attributes: jsonb("attributes")
      .$type<VariantAttributes>()
      .notNull()
      .default({}),
    priceNowInPaise: integer("price_now_in_paise").notNull(),
    priceWasInPaise: integer("price_was_in_paise").notNull(),
    stock: integer("stock").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_variants_product_idx").on(table.productId, table.sortOrder),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    imageKey: text("image_key").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_images_product_idx").on(table.productId, table.sortOrder),
    index("product_images_variant_idx").on(table.variantId, table.sortOrder),
  ],
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    coverImageKey: text("cover_image_key"),
    contentMarkdown: text("content_markdown").notNull(),
    authorName: text("author_name").notNull().default("Alvari"),
    readingMinutes: integer("reading_minutes").notNull().default(3),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_posts_published_idx").on(
      table.isPublished,
      table.publishedAt,
    ),
  ],
);

export const productBlogSections = pgTable(
  "product_blog_sections",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    blogPostId: uuid("blog_post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.blogPostId] }),
    index("product_blog_sections_product_idx").on(
      table.productId,
      table.sortOrder,
    ),
  ],
);

export const adminRoleEnum = pgEnum("admin_role", [
  "owner",
  "admin",
  "editor",
]);

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: adminRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("admin_sessions_admin_idx").on(table.adminId)],
);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "contacted",
  "quoted",
  "closed",
]);

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    location: text("location"),
    productCategory: productCategoryEnum("product_category").notNull(),
    productSlug: text("product_slug"),
    productVariantSku: text("product_variant_sku"),
    notes: text("notes"),
    status: enquiryStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("enquiries_status_idx").on(table.status, table.createdAt),
  ],
);

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  images: many(productImages),
  blogSections: many(productBlogSections),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    images: many(productImages),
  }),
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  productSections: many(productBlogSections),
}));

export const productBlogSectionsRelations = relations(
  productBlogSections,
  ({ one }) => ({
    product: one(products, {
      fields: [productBlogSections.productId],
      references: [products.id],
    }),
    blogPost: one(blogPosts, {
      fields: [productBlogSections.blogPostId],
      references: [blogPosts.id],
    }),
  }),
);

export const adminsRelations = relations(admins, ({ many }) => ({
  sessions: many(adminSessions),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(admins, {
    fields: [adminSessions.adminId],
    references: [admins.id],
  }),
}));

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductVariantRow = typeof productVariants.$inferSelect;
export type NewProductVariantRow = typeof productVariants.$inferInsert;
export type ProductImageRow = typeof productImages.$inferSelect;
export type NewProductImageRow = typeof productImages.$inferInsert;
export type BlogPostRow = typeof blogPosts.$inferSelect;
export type NewBlogPostRow = typeof blogPosts.$inferInsert;
export type ProductBlogSectionRow = typeof productBlogSections.$inferSelect;
export type NewProductBlogSectionRow =
  typeof productBlogSections.$inferInsert;
export type AdminRow = typeof admins.$inferSelect;
export type NewAdminRow = typeof admins.$inferInsert;
export type AdminSessionRow = typeof adminSessions.$inferSelect;
export type NewAdminSessionRow = typeof adminSessions.$inferInsert;
export type EnquiryRow = typeof enquiries.$inferSelect;
export type NewEnquiryRow = typeof enquiries.$inferInsert;
