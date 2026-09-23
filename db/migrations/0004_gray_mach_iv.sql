DO $$ BEGIN
  CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jhz_blog_categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "jhz_blog_categories" ADD CONSTRAINT "jhz_blog_categories_slug_unique" UNIQUE("slug");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jhz_blog_posts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text,
	"coverImage" text,
	"categorySlug" text,
	"tags" jsonb,
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"seoTitle" text,
	"seoDescription" text,
	"authorName" text DEFAULT 'PC Jahiz',
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "jhz_blog_posts" ADD CONSTRAINT "jhz_blog_posts_slug_unique" UNIQUE("slug");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "jhz_blog_cat_idx" ON "jhz_blog_posts" USING btree ("categorySlug"); EXCEPTION WHEN duplicate_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "jhz_blog_status_idx" ON "jhz_blog_posts" USING btree ("status"); EXCEPTION WHEN duplicate_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jhz_store_locations" ADD CONSTRAINT "jhz_store_locations_name_unique" UNIQUE("name"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
