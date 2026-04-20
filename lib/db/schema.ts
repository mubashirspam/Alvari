import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
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
    priceNowInPaise: integer("price_now_in_paise").notNull(),
    priceWasInPaise: integer("price_was_in_paise").notNull(),
    badge: productBadgeEnum("badge"),
    illustrationKey: text("illustration_key").notNull(),
    imageUrl: text("image_url"),
    gradientFrom: text("gradient_from").notNull(),
    gradientTo: text("gradient_to").notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_featured_idx").on(table.isFeatured, table.sortOrder),
    index("products_category_idx").on(table.category),
  ],
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

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type EnquiryRow = typeof enquiries.$inferSelect;
export type NewEnquiryRow = typeof enquiries.$inferInsert;
