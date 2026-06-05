ALTER TABLE "orders" ADD COLUMN "is_custom_order" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_dimensions" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_wood_type" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_finish" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_timeline" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_reference_images" text[] DEFAULT '{}' NOT NULL;