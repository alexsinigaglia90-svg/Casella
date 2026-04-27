import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL must be set for RLS tests");

const sql = postgres(DB_URL, { prepare: false });

// NOTE: the test connection runs as superuser `postgres`, which bypasses RLS.
// Every test therefore does three things inside a transaction:
//   1. SET LOCAL ROLE authenticated  -- switch to a non-superuser role (created by rls.sql)
//   2. SET LOCAL row_security = on   -- force RLS even for table owners
//   3. set_config('app.current_user_id', ...) -- the session var policies read
// Without (1) the superuser bypass makes every policy "pass", so tests would be vacuous.

describe("RLS policies", () => {
  let adminUserId: string;
  let employeeUserId: string;
  let employeeEmployeeId: string;
  let otherUserId: string;
  let otherEmployeeId: string;

  beforeAll(async () => {
    const admin = await sql<{ id: string }[]>`
      INSERT INTO users (entra_oid, email, display_name, role)
      VALUES ('test-admin-oid', 'admin@test.local', 'Test Admin', 'admin')
      RETURNING id
    `;
    adminUserId = admin[0].id;

    const emp = await sql<{ id: string }[]>`
      INSERT INTO users (entra_oid, email, display_name, role)
      VALUES ('test-emp-oid', 'emp@test.local', 'Test Employee', 'employee')
      RETURNING id
    `;
    employeeUserId = emp[0].id;

    const empRec = await sql<{ id: string }[]>`
      INSERT INTO employees (user_id, employment_status)
      VALUES (${employeeUserId}, 'active')
      RETURNING id
    `;
    employeeEmployeeId = empRec[0].id;

    const other = await sql<{ id: string }[]>`
      INSERT INTO users (entra_oid, email, display_name, role)
      VALUES ('test-other-oid', 'other@test.local', 'Other', 'employee')
      RETURNING id
    `;
    otherUserId = other[0].id;
    const otherEmp = await sql<{ id: string }[]>`
      INSERT INTO employees (user_id, employment_status)
      VALUES (${otherUserId}, 'active')
      RETURNING id
    `;
    otherEmployeeId = otherEmp[0].id;

    await sql`
      INSERT INTO leave_requests (employee_id, leave_type, type, hours, start_date, end_date)
      VALUES
        (${employeeEmployeeId}, 'vacation', 'vacation_legal', 40, '2026-05-01', '2026-05-05'),
        (${otherEmployeeId}, 'vacation', 'vacation_legal', 40, '2026-05-01', '2026-05-05')
    `;

    await sql`
      INSERT INTO notifications (user_id, type, payload_json)
      VALUES
        (${employeeUserId}, 'test.note', '{"k":"v"}'::jsonb),
        (${otherUserId}, 'test.note', '{"k":"v"}'::jsonb)
    `;

    await sql`
      INSERT INTO documents (employee_id, document_type, source, storage_path, file_name, mime_type)
      VALUES
        (${employeeEmployeeId}, 'contract', 'upload', 'test/emp.pdf', 'emp.pdf', 'application/pdf'),
        (NULL, 'other', 'upload', 'test/company.pdf', 'company.pdf', 'application/pdf')
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM documents WHERE storage_path LIKE 'test/%'`;
    await sql`DELETE FROM notifications WHERE type = 'test.note'`;
    await sql`DELETE FROM leave_requests WHERE employee_id IN (${employeeEmployeeId}, ${otherEmployeeId})`;
    await sql`DELETE FROM employees WHERE user_id IN (
      SELECT id FROM users WHERE entra_oid LIKE 'test-%'
    )`;
    await sql`DELETE FROM users WHERE entra_oid LIKE 'test-%'`;
    await sql.end();
  });

  describe("leave_requests", () => {
    it("employee sees only their own rows", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        await tx`SELECT set_config('app.current_user_id', ${employeeUserId}, true)`;
        return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
      });

      expect(result.length).toBe(1);
      expect(result[0].employee_id).toBe(employeeEmployeeId);
    });

    it("admin sees all rows", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        await tx`SELECT set_config('app.current_user_id', ${adminUserId}, true)`;
        return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
      });

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("anonymous (no user_id set) sees nothing", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
      });

      expect(result.length).toBe(0);
    });
  });

  describe("notifications (user_id scoping, different pattern from employee_id)", () => {
    it("user sees only their own notifications", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        await tx`SELECT set_config('app.current_user_id', ${employeeUserId}, true)`;
        return tx<{ user_id: string }[]>`SELECT user_id FROM notifications WHERE type = 'test.note'`;
      });

      expect(result.length).toBe(1);
      expect(result[0].user_id).toBe(employeeUserId);
    });

    it("admin sees all notifications", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        await tx`SELECT set_config('app.current_user_id', ${adminUserId}, true)`;
        return tx<{ user_id: string }[]>`SELECT user_id FROM notifications WHERE type = 'test.note'`;
      });

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("documents (special carve-out for company-wide docs with NULL employee_id)", () => {
    it("employee sees their own doc + company-wide docs, not other employees' docs", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        await tx`SELECT set_config('app.current_user_id', ${employeeUserId}, true)`;
        return tx<{ employee_id: string | null; file_name: string }[]>`
          SELECT employee_id, file_name FROM documents WHERE storage_path LIKE 'test/%'
        `;
      });

      const names = result.map((r) => r.file_name).sort();
      expect(names).toEqual(["company.pdf", "emp.pdf"]);
    });

    it("anonymous cannot read company-wide documents (NULL employee_id)", async () => {
      const result = await sql.begin(async (tx) => {
        await tx`SET LOCAL row_security = on`;
        await tx`SET LOCAL ROLE authenticated`;
        return tx<{ employee_id: string | null }[]>`
          SELECT employee_id FROM documents WHERE storage_path LIKE 'test/%'
        `;
      });

      expect(result.length).toBe(0);
    });
  });
});
