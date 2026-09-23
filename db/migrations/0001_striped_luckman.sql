CREATE TYPE "public"."campaign_type" AS ENUM('hero', 'campaign');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('new', 'contacted', 'done');--> statement-breakpoint
CREATE TABLE "jhz_campaigns" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"type" "campaign_type" DEFAULT 'hero' NOT NULL,
	"eyebrow" text,
	"heading" text,
	"description" text,
	"ctaLabel" text,
	"ctaUrl" text,
	"image" text,
	"bgColor" text,
	"badge" text,
	"discountRibbon" text,
	"oldPrice" integer,
	"price" integer,
	"brandSlug" text,
	"brandLabel" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"endsAt" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jhz_loyalty_members" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tier" text DEFAULT 'classic' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jhz_newsletter_subscribers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jhz_newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "jhz_quote_requests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"details" text,
	"status" "quote_status" DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jhz_store_locations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"hours" jsonb,
	"image" text,
	"mapsUrl" text,
	"isPickupPoint" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jhz_orders" ALTER COLUMN "payment" SET DATA TYPE text;--> statement-breakpoint
UPDATE "jhz_orders" SET "payment" = 'cod' WHERE "payment" = 'cmi';--> statement-breakpoint
ALTER TABLE "jhz_orders" ALTER COLUMN "payment" SET DEFAULT 'cod'::text;--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod');--> statement-breakpoint
ALTER TABLE "jhz_orders" ALTER COLUMN "payment" SET DEFAULT 'cod'::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "jhz_orders" ALTER COLUMN "payment" SET DATA TYPE "public"."payment_method" USING "payment"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "jhz_brands" DROP COLUMN "descriptionAr";--> statement-breakpoint
ALTER TABLE "jhz_brands" DROP COLUMN "seoTitleAr";--> statement-breakpoint
ALTER TABLE "jhz_brands" DROP COLUMN "seoDescriptionAr";--> statement-breakpoint
ALTER TABLE "jhz_categories" DROP COLUMN "nameAr";--> statement-breakpoint
ALTER TABLE "jhz_categories" DROP COLUMN "descriptionAr";--> statement-breakpoint
ALTER TABLE "jhz_categories" DROP COLUMN "seoTitleAr";--> statement-breakpoint
ALTER TABLE "jhz_categories" DROP COLUMN "seoDescriptionAr";--> statement-breakpoint
ALTER TABLE "jhz_order_items" DROP COLUMN "nameAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "nameAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "summaryAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "descriptionAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "seoTitleAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "seoDescriptionAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "faqAr";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "aiGeneratedAt";--> statement-breakpoint
ALTER TABLE "jhz_products" DROP COLUMN "aiPrompt";