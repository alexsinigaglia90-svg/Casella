DO $$ BEGIN
 CREATE TYPE "public"."nmbrs_sync_status" AS ENUM('running', 'success', 'failure');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."nmbrs_sync_type" AS ENUM('employees', 'hours', 'leave');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nmbrs_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_type" "nmbrs_sync_type" NOT NULL,
	"status" "nmbrs_sync_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"records_succeeded" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"error_details" jsonb,
	"triggered_by" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nmbrs_sync_runs" ADD CONSTRAINT "nmbrs_sync_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
