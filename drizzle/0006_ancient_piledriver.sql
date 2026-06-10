CREATE TYPE "public"."measurement_status" AS ENUM('requested', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('standard', 'instant', 'quote');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'captured', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."purchase_mode" AS ENUM('instant', 'quote');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'pending_payment';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'paid';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'enquiry';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'quoted';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'approved';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'ready';--> statement-breakpoint
CREATE TABLE "measurement_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"pincode" text NOT NULL,
	"area" text,
	"preferred_slot" text,
	"note" text,
	"status" "measurement_status" DEFAULT 'requested' NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_link_id" text,
	"razorpay_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payments_razorpay_payment_link_id_unique" UNIQUE("razorpay_payment_link_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "type" "order_type" DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_in_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_in_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "place_of_supply_state" text DEFAULT 'Kerala' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quoted_total_in_paise" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchase_mode" "purchase_mode" DEFAULT 'instant' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_is_indicative" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hsn_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gst_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "measurement_requests" ADD CONSTRAINT "measurement_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_requests" ADD CONSTRAINT "measurement_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "measurement_requests_status_idx" ON "measurement_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "measurement_requests_phone_idx" ON "measurement_requests" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status","created_at");