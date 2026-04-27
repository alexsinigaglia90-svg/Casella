CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('dutch',
      coalesce("first_name", '') || ' ' ||
      coalesce("last_name", '') || ' ' ||
      coalesce("job_title", '') || ' ' ||
      coalesce("invite_email", '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employees_search_idx" ON "employees" USING GIN("search_vector");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employees_trgm_idx" ON "employees" USING GIN(
  (coalesce("first_name", '') || ' ' || coalesce("last_name", '')) gin_trgm_ops
);
