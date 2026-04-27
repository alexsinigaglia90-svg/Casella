ALTER TABLE "leave_requests" ALTER COLUMN "leave_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "end_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "hours" numeric(7, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "submitted_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "custom_payload" jsonb;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "attachment_storage_path" text;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "availability_status" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
