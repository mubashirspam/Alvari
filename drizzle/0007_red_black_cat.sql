CREATE TYPE "public"."variant_attribute_input" AS ENUM('select', 'color', 'text');--> statement-breakpoint
CREATE TABLE "category_variant_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "product_category" NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"input_type" "variant_attribute_input" DEFAULT 'select' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cva_category_key_idx" ON "category_variant_attributes" USING btree ("category","key");