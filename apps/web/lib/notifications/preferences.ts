import "server-only";
import { getDb, schema, eq } from "@casella/db";
import type { EmployeeNotificationType } from "./types";

export async function shouldSendEmail(
  employeeId: string,
  type: EmployeeNotificationType,
): Promise<boolean> {
  const db = getDb();
  const [emp] = await db
    .select({ prefs: schema.employees.emailNotificationPreferences })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId));
  if (!emp) return false;
  const prefs = (emp.prefs ?? {}) as Record<string, boolean>;
  return prefs[type] !== false;
}

export const DEFAULT_EMAIL_PREFS: Record<EmployeeNotificationType, boolean> = {
  "leave.approved": true,
  "leave.rejected": true,
  "expense.approved": true,
  "expense.rejected": true,
  "hours.rejected": true,
  "hours.approved": false,
  "statement.ready": true,
  "payslip.available": true,
  "contract.uploaded": true,
  "bonus.paid": true,
  "address.change.approved": true,
  "iban.change.approved": true,
  "vacation.balance.low": true,
  "hours.missing.reminder": true,
  "vacation.unused.year-end": true,
  "broadcast.general": true,
};
