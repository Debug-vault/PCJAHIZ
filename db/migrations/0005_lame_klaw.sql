DO $$ BEGIN ALTER TABLE "jhz_campaigns" ADD COLUMN "brandBadge" text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jhz_campaigns" ADD COLUMN "products" jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
