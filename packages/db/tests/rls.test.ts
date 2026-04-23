import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL must be set for RLS tests");

const sql = postgres(DB_URL, { prepare: false });

describe("RLS policies", () => {
  let adminUserId: string;
  let employeeUserId: string;
  let employeeEmployeeId: string;
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
    const otherEmp = await sql<{ id: string }[]>`
      INSERT INTO employees (user_id, employment_status)
      VALUES (${other[0].id}, 'active')
      RETURNING id
    `;
    otherEmployeeId = otherEmp[0].id;

    await sql`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date)
      VALUES
        (${employeeEmployeeId}, 'vacation', '2026-05-01', '2026-05-05'),
        (${otherEmployeeId}, 'vacation', '2026-05-01', '2026-05-05')
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM leave_requests WHERE employee_id IN (${employeeEmployeeId}, ${otherEmployeeId})`;
    await sql`DELETE FROM employees WHERE user_id IN (
      SELECT id FROM users WHERE entra_oid LIKE 'test-%'
    )`;
    await sql`DELETE FROM users WHERE entra_oid LIKE 'test-%'`;
    await sql.end();
  });

  it("employee sees only their own leave_requests", async () => {
    const result = await sql.begin(async (tx) => {
      await tx`SET LOCAL row_security = on`;
      await tx`SET LOCAL ROLE authenticated`;
      await tx`SELECT set_config('app.current_user_id', ${employeeUserId}, true)`;
      return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
    });

    expect(result.length).toBe(1);
    expect(result[0].employee_id).toBe(employeeEmployeeId);
  });

  it("admin sees all leave_requests", async () => {
    const result = await sql.begin(async (tx) => {
      await tx`SET LOCAL row_security = on`;
      await tx`SET LOCAL ROLE authenticated`;
      await tx`SELECT set_config('app.current_user_id', ${adminUserId}, true)`;
      return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("anonymous (no user_id set) sees nothing from HR tables", async () => {
    const result = await sql.begin(async (tx) => {
      await tx`SET LOCAL row_security = on`;
      await tx`SET LOCAL ROLE authenticated`;
      return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
    });

    expect(result.length).toBe(0);
  });
});
