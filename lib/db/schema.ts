import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
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
  "chair",
  "sideboard",
  "table",
]);

export const bannerSlotEnum = pgEnum("banner_slot", [
  "hero",
  "secondary",
  "promo_strip",
  "mid_page",
  "collection_tile",
  "category_tile",
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
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    tags: text("tags").array().notNull().default([]),
    language: text("language").notNull().default("en"),
    category: text("category"),
    topicSlug: text("topic_slug"),
    generationModel: text("generation_model"),
    generationInputTokens: integer("generation_input_tokens"),
    generationOutputTokens: integer("generation_output_tokens"),
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
    index("blog_posts_lang_published_idx").on(
      table.language,
      table.isPublished,
      table.publishedAt,
    ),
    index("blog_posts_topic_idx").on(table.topicSlug),
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

export const categories = pgTable(
  "categories",
  {
    category: productCategoryEnum("category").primaryKey(),
    label: text("label").notNull(),
    slug: text("slug").notNull().unique(),
    subtitle: text("subtitle"),
    imageKey: text("image_key"),
    heroImageKey: text("hero_image_key"),
    accentColor: text("accent_color"),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("categories_visible_idx").on(table.isVisible, table.sortOrder)],
);

/**
 * Hierarchical navigation taxonomy (Furniture → Solid Wood → Almirah, …).
 * Self-referencing tree, decoupled from `productCategoryEnum`. Leaf/any node may
 * link to a filtered product listing via `linkCategory` (+ `material`) or an
 * explicit `linkHref`. Deleting a node cascades to its whole subtree.
 */
export const categoryNodes = pgTable(
  "category_nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => categoryNodes.id,
      { onDelete: "cascade" },
    ),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    imageKey: text("image_key"),
    accentColor: text("accent_color"),
    linkCategory: productCategoryEnum("link_category"),
    material: text("material"),
    linkHref: text("link_href"),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("category_nodes_parent_idx").on(table.parentId),
    index("category_nodes_visible_idx").on(table.isVisible, table.sortOrder),
  ],
);

export const banners = pgTable(
  "banners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    slot: bannerSlotEnum("slot").notNull(),
    title: text("title"),
    subtitle: text("subtitle"),
    overline: text("overline"),
    ctaLabel: text("cta_label"),
    ctaUrl: text("cta_url"),
    imageKey: text("image_key").notNull(),
    mobileImageKey: text("mobile_image_key"),
    bgColor: text("bg_color"),
    textColor: text("text_color"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("banners_slot_active_idx").on(
      table.slot,
      table.isActive,
      table.sortOrder,
    ),
    index("banners_schedule_idx").on(table.startsAt, table.endsAt),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    heroImageKey: text("hero_image_key"),
    accentColor: text("accent_color"),
    sortOrder: integer("sort_order").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("collections_featured_idx").on(
      table.isFeatured,
      table.isActive,
      table.sortOrder,
    ),
  ],
);

export const collectionProducts = pgTable(
  "collection_products",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.productId] }),
    index("collection_products_collection_idx").on(
      table.collectionId,
      table.sortOrder,
    ),
  ],
);

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(collectionProducts),
}));

export const collectionProductsRelations = relations(
  collectionProducts,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionProducts.collectionId],
      references: [collections.id],
    }),
    product: one(products, {
      fields: [collectionProducts.productId],
      references: [products.id],
    }),
  }),
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type CategoryNodeRow = typeof categoryNodes.$inferSelect;
export type NewCategoryNodeRow = typeof categoryNodes.$inferInsert;
export type BannerRow = typeof banners.$inferSelect;
export type NewBannerRow = typeof banners.$inferInsert;
export type CollectionRow = typeof collections.$inferSelect;
export type NewCollectionRow = typeof collections.$inferInsert;
export type CollectionProductRow = typeof collectionProducts.$inferSelect;
export type NewCollectionProductRow =
  typeof collectionProducts.$inferInsert;

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

// ────────────────────────────────────────────────────────────────────────────
// Conversational commerce: users + orders + order_items
// ────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique(),
    name: text("name"),
    phone: text("phone"),
    googleId: text("google_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_phone_idx").on(table.phone)],
);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortCode: text("short_code").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    shippingAddress: text("shipping_address").notNull(),
    notes: text("notes"),
    subtotalInPaise: integer("subtotal_in_paise").notNull(),
    totalInPaise: integer("total_in_paise").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    placedVia: text("placed_via").notNull().default("whatsapp"),
    referralCode: text("referral_code"),
    promoCode: text("promo_code"),
    discountInPaise: integer("discount_in_paise").notNull().default(0),
    isCustomOrder: boolean("is_custom_order").notNull().default(false),
    customDimensions: text("custom_dimensions"),
    customWoodType: text("custom_wood_type"),
    customFinish: text("custom_finish"),
    customTimeline: text("custom_timeline"),
    customReferenceImages: text("custom_reference_images").array().notNull().default([]),
    whatsappOpenedAt: timestamp("whatsapp_opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_user_idx").on(table.userId, table.createdAt),
    index("orders_phone_idx").on(table.customerPhone, table.createdAt),
    index("orders_status_idx").on(table.status, table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    variantSku: text("variant_sku"),
    variantName: text("variant_name"),
    unitPriceInPaise: integer("unit_price_in_paise").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalInPaise: integer("line_total_in_paise").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
export type OrderStatus = OrderRow["status"];

// ────────────────────────────────────────────────────────────────────────────
// Referrals + Promo codes
// ────────────────────────────────────────────────────────────────────────────

export const referralSources = pgTable(
  "referral_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    discountPercent: integer("discount_percent").notNull().default(0),
    createdBy: text("created_by"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("referral_sources_code_idx").on(table.code)],
);

export const promoDiscountTypeEnum = pgEnum("promo_discount_type", ["percent", "flat"]);

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    discountType: promoDiscountTypeEnum("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    minOrderInPaise: integer("min_order_in_paise").notNull().default(0),
    maxUsages: integer("max_usages"),
    usageCount: integer("usage_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("promo_codes_code_idx").on(table.code)],
);

export type ReferralSourceRow = typeof referralSources.$inferSelect;
export type NewReferralSourceRow = typeof referralSources.$inferInsert;
export type PromoCodeRow = typeof promoCodes.$inferSelect;

// ────────────────────────────────────────────────────────────────────────────
// Visitor analytics
// ────────────────────────────────────────────────────────────────────────────

export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fingerprint: text("fingerprint").notNull(),
    page: text("page").notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    deviceType: text("device_type"),
    city: text("city"),
    country: text("country"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("page_views_fingerprint_idx").on(table.fingerprint),
    index("page_views_page_idx").on(table.page, table.createdAt),
    index("page_views_created_idx").on(table.createdAt),
  ],
);

export type PageViewRow = typeof pageViews.$inferSelect;
export type NewPageViewRow = typeof pageViews.$inferInsert;
export type NewPromoCodeRow = typeof promoCodes.$inferInsert;
