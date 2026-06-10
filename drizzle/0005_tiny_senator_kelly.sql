CREATE TYPE "public"."review_status" AS ENUM('approved', 'hidden');--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"highlights" text[] DEFAULT '{}' NOT NULL,
	"comment" text NOT NULL,
	"status" "review_status" DEFAULT 'approved' NOT NULL,
	"admin_reply" text,
	"admin_replied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_reviews_product_idx" ON "product_reviews" USING btree ("product_id","status","created_at");--> statement-breakpoint
CREATE INDEX "product_reviews_status_idx" ON "product_reviews" USING btree ("status","created_at");