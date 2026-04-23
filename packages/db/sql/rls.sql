-- Casella RLS policies (handmade; not managed by drizzle-kit)
-- Apply via: docker exec -i supabase_db_Casella psql -U postgres -d postgres < packages/db/sql/rls.sql
-- Requires: all domain tables from 0000_thick_jackal.sql already exist

-- Helper function: get current user ID from session var
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION app_current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = app_current_user_id() AND role = 'admin'
  );
$$;

-- Helper: employee_id of current user (NULL if not an employee)
CREATE OR REPLACE FUNCTION app_current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM employees WHERE user_id = app_current_user_id();
$$;

-- Enable RLS on HR tables
ALTER TABLE hour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sick_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-applying (idempotent)
DROP POLICY IF EXISTS hour_entries_access ON hour_entries;
DROP POLICY IF EXISTS leave_requests_access ON leave_requests;
DROP POLICY IF EXISTS sick_reports_access ON sick_reports;
DROP POLICY IF EXISTS employer_statements_access ON employer_statements;
DROP POLICY IF EXISTS bonus_ledger_access ON bonus_ledger;
DROP POLICY IF EXISTS documents_access ON documents;
DROP POLICY IF EXISTS notifications_access ON notifications;

-- Policies: employees see only their own, admins see all

CREATE POLICY hour_entries_access ON hour_entries
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY leave_requests_access ON leave_requests
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY sick_reports_access ON sick_reports
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY employer_statements_access ON employer_statements
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY bonus_ledger_access ON bonus_ledger
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY documents_access ON documents
  USING (
    app_current_user_is_admin()
    OR employee_id = app_current_employee_id()
    OR employee_id IS NULL
  )
  WITH CHECK (app_current_user_is_admin());

CREATE POLICY notifications_access ON notifications
  USING (app_current_user_is_admin() OR user_id = app_current_user_id())
  WITH CHECK (app_current_user_is_admin() OR user_id = app_current_user_id());
