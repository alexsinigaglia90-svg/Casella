CREATE TYPE "public"."care_package_company" AS ENUM('ascentra', 'operis', 'astra');--> statement-breakpoint
CREATE TYPE "public"."care_package_ledger_type" AS ENUM('annual_distribution', 'exit_payout');--> statement-breakpoint
CREATE TYPE "public"."change_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."change_request_type" AS ENUM('address', 'iban');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('travel', 'client_meal', 'conference', 'materials', 'software', 'telecom', 'client_gift', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('submitted', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"job_title" text NOT NULL,
	"pdf_storage_path" text NOT NULL,
	"bruto_salaris_maand_cents" numeric(12, 2),
	"vakantietoeslag_pct" numeric(5, 2) DEFAULT '8.00',
	"baseline_tarief_per_uur" numeric(8, 2) DEFAULT '75.00',
	"bonus_pct_below_baseline" numeric(5, 2) DEFAULT '10.00',
	"bonus_pct_above_baseline" numeric(5, 2) DEFAULT '15.00',
	"max_overperformance_pct" numeric(5, 2) DEFAULT '20.00',
	"auto_stelpost_actief" boolean DEFAULT false NOT NULL,
	"auto_stelpost_bedrag_maand" numeric(10, 2) DEFAULT '1000.00',
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expense_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"category" "expense_category" NOT NULL,
	"project_id" uuid,
	"is_internal" boolean DEFAULT false NOT NULL,
	"amount_cents" integer NOT NULL,
	"vat_amount_cents" integer,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"receipt_storage_path" text NOT NULL,
	"category_payload" jsonb,
	"status" "expense_status" DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"rejection_reason" text,
	"paid_at" timestamp with time zone,
	"nmbrs_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" "change_request_type" NOT NULL,
	"proposed_value" jsonb NOT NULL,
	"status" "change_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"target_employee_ids" text[],
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_balance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"leave_type" text NOT NULL,
	"hours_remaining" numeric(7, 2) NOT NULL,
	"hours_total" numeric(7, 2) NOT NULL,
	"expires_at" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bonus_config" (
	"year" integer PRIMARY KEY NOT NULL,
	"werkgeverslasten_pct" numeric(5, 2) DEFAULT '30.00' NOT NULL,
	"indirecte_kosten_per_maand" numeric(10, 2) DEFAULT '500.00' NOT NULL,
	"werkbare_uren_per_maand" integer DEFAULT 168 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "care_package_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" "care_package_ledger_type" NOT NULL,
	"company" "care_package_company" NOT NULL,
	"amount_cents" integer NOT NULL,
	"year" integer NOT NULL,
	"transaction_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_change_requests" ADD CONSTRAINT "employee_change_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_change_requests" ADD CONSTRAINT "employee_change_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leave_balance_snapshots" ADD CONSTRAINT "leave_balance_snapshots_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "care_package_ledger" ADD CONSTRAINT "care_package_ledger_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
