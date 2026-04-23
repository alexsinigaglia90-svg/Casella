-- packages/db/sql/scheduler.sql
-- Casella pending-closures scheduler
-- Apply via: docker exec -i supabase_db_Casella psql -U postgres -d postgres < packages/db/sql/scheduler.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: execute pending employee terminations
CREATE OR REPLACE FUNCTION execute_pending_employee_terminations()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, pending_termination_at
    FROM employees
    WHERE pending_termination_at IS NOT NULL
      AND pending_termination_at <= CURRENT_DATE
      AND employment_status <> 'terminated'
  LOOP
    UPDATE employees
    SET employment_status = 'terminated',
        end_date = pending_termination_at,
        pending_termination_at = NULL,
        termination_undo_until = NOW() + INTERVAL '72 hours',
        updated_at = NOW()
    WHERE id = rec.id;

    INSERT INTO audit_log (action, resource_type, resource_id, changes_json)
    VALUES (
      'employees.terminate.auto_executed',
      'employees',
      rec.id::text,
      jsonb_build_object('by', 'scheduler', 'scheduledAt', rec.pending_termination_at)
    );
  END LOOP;
END;
$$;

-- Schedule: every day at 00:05 UTC
SELECT cron.schedule(
  'casella-employee-terminations',
  '5 0 * * *',
  $$ SELECT execute_pending_employee_terminations(); $$
);
