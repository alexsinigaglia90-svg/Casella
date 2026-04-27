CREATE TYPE "public"."language_preference" AS ENUM('nl', 'en');--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "language_preference" "language_preference" DEFAULT 'nl' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "avatar_storage_path" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "email_notification_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hourly_rate_excl_btw" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "nhg_indicator" boolean;--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "lender_name" text;--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "loan_amount_indicative_cents" integer;--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "landlord_name" text;--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "landlord_address" text;--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "monthly_rent_cents" integer;--> statement-breakpoint
ALTER TABLE "employer_statements" ADD COLUMN "purpose_other_reason" text;--> statement-breakpoint
ALTER TABLE "bonus_ledger" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "bonus_ledger" ADD COLUMN "bonus_period_start" date;--> statement-breakpoint
ALTER TABLE "bonus_ledger" ADD COLUMN "bonus_period_end" date;--> statement-breakpoint
ALTER TABLE "bonus_ledger" ADD COLUMN "pct_applied" numeric(5, 2);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bonus_ledger" ADD CONSTRAINT "bonus_ledger_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
