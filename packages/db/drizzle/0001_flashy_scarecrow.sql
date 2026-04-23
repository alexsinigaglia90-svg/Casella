CREATE TYPE "public"."theme_preference" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "pdok_id" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "municipality" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "province" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "full_address_display" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "rd_x" double precision;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "rd_y" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_preference" "theme_preference" DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_pdok_id_unique" UNIQUE("pdok_id");