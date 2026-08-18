CREATE TYPE "public"."order_status" AS ENUM('preparing', 'in_transit', 'landed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod', 'cmi');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."promo_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TABLE "jhz_addresses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"label" text NOT NULL,
	"fullName" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jhz_brands" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"description" text,
	"descriptionAr" text,
	"seoTitle" text,
	"seoTitleAr" text,
	"seoDescription" text,
	"seoDescriptionAr" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"showInMarquee" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jhz_categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nameFr" text NOT NULL,
	"nameAr" text NOT NULL,
	"description" text,
	"descriptionAr" text,
	"seoTitleFr" text,
	"seoTitleAr" text,
	"seoDescriptionFr" text,
	"seoDescriptionAr" text,
	"parentSlug" text,
	"image" text,
	"deck" integer DEFAULT 1 NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jhz_order_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderId" text NOT NULL,
	"productId" text,
	"sku" text,
	"nameFr" text NOT NULL,
	"nameAr" text NOT NULL,
	"unitPrice" integer NOT NULL,
	"quantity" integer NOT NULL,
	"total" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jhz_orders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"userId" text,
	"customerName" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"region" text,
	"address" text,
	"notes" text,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"shippingFee" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"payment" "payment_method" DEFAULT 'cod' NOT NULL,
	"paymentStatus" "payment_status" DEFAULT 'pending' NOT NULL,
	"status" "order_status" DEFAULT 'preparing' NOT NULL,
	"promoCode" text,
	"cmiReference" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_orders_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "jhz_products" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"nameFr" text NOT NULL,
	"nameAr" text NOT NULL,
	"summaryFr" text,
	"summaryAr" text,
	"descriptionFr" text,
	"descriptionAr" text,
	"seoTitleFr" text,
	"seoTitleAr" text,
	"seoDescriptionFr" text,
	"seoDescriptionAr" text,
	"faqFr" jsonb,
	"faqAr" jsonb,
	"aiGeneratedAt" timestamp,
	"aiPrompt" text,
	"brandSlug" text,
	"categorySlug" text,
	"price" integer NOT NULL,
	"oldPrice" integer,
	"discount" integer,
	"cost" integer,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"img" text,
	"images" jsonb,
	"specs" jsonb,
	"stock" integer DEFAULT 0 NOT NULL,
	"lowStockThreshold" integer DEFAULT 3 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"isNew" boolean DEFAULT false NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"warrantyMonths" integer DEFAULT 12 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "jhz_products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "jhz_promo_codes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "promo_type" DEFAULT 'percent' NOT NULL,
	"value" integer NOT NULL,
	"minOrder" integer,
	"maxDiscount" integer,
	"startsAt" timestamp,
	"endsAt" timestamp,
	"usageLimit" integer,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "jhz_reviews" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" text NOT NULL,
	"userId" text,
	"author" text NOT NULL,
	"city" text,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jhz_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	CONSTRAINT "jhz_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "jhz_shipping_zones" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cities" jsonb,
	"fee" integer DEFAULT 0 NOT NULL,
	"freeThreshold" integer,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jhz_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"phone" text,
	"avatar" text,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignInAt" timestamp,
	CONSTRAINT "jhz_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "jhz_wishlist" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"productId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "jhz_addr_user_idx" ON "jhz_addresses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "jhz_cat_parent_idx" ON "jhz_categories" USING btree ("parentSlug");--> statement-breakpoint
CREATE INDEX "jhz_item_order_idx" ON "jhz_order_items" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "jhz_order_user_idx" ON "jhz_orders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "jhz_order_status_idx" ON "jhz_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jhz_order_created_idx" ON "jhz_orders" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "jhz_prod_cat_idx" ON "jhz_products" USING btree ("categorySlug");--> statement-breakpoint
CREATE INDEX "jhz_prod_brand_idx" ON "jhz_products" USING btree ("brandSlug");--> statement-breakpoint
CREATE INDEX "jhz_prod_active_idx" ON "jhz_products" USING btree ("active");--> statement-breakpoint
CREATE INDEX "jhz_review_prod_idx" ON "jhz_reviews" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "jhz_wish_user_idx" ON "jhz_wishlist" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "jhz_wish_user_prod" ON "jhz_wishlist" USING btree ("userId","productId");