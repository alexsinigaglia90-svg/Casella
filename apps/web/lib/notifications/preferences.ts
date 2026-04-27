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

// Re-export for convenience — import from defaults.ts for client components
export { DEFAULT_EMAIL_PREFS } from "./defaults";
