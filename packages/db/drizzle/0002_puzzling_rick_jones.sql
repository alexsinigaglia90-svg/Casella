ALTER TABLE "employees" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "invite_email" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "contracted_hours_per_week" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "pending_termination_at" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "pending_termination_reason" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "termination_undo_until" timestamp with time zone;

-- Partial case-insensitive unique index on invite_email (manual; drizzle-kit cannot express this)
CREATE UNIQUE INDEX employees_invite_email_unique_ci
  ON employees (LOWER(invite_email)) WHERE invite_email IS NOT NULL;