import "server-only";

import { eq, getDb, schema } from "@casella/db";
import {
  NmbrsError,
  getCredentialsFromEnv,
  pushLeaveRequest,
  type NmbrsLeaveType,
} from "@casella/nmbrs";

import type { LeaveTypeKey } from "@/lib/leave/types";

export type LeaveSyncResult =
  | { ok: true }
  | { skipped: "not_approved" | "no_nmbrs_id" | "missing_credentials" | "no_nmbrs_mapping" };

const leaveTypeMap: Partial<Record<LeaveTypeKey, NmbrsLeaveType>> = {
  vacation_legal: "vacation",
  vacation_extra: "vacation",
  parental_paid: "vacation",
  parental_unpaid: "vacation",
  short_care: "special",
  long_care: "special",
  calamity: "special",
  pregnancy: "special",
  maternity: "special",
  birth_partner: "special",
  additional_birth: "special",
  adoption: "special",
  special: "special",
  // 'unpaid' has no Nmbrs mapping by default
};

export async function pushLeaveToNmbrs(
  leaveRequestId: string,
): Promise<LeaveSyncResult> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.leaveRequests.id,
      status: schema.leaveRequests.status,
      type: schema.leaveRequests.type,
      startDate: schema.leaveRequests.startDate,
      endDate: schema.leaveRequests.endDate,
      hours: schema.leaveRequests.hours,
      employeeId: schema.leaveRequests.employeeId,
      nmbrsEmployeeId: schema.employees.nmbrsEmployeeId,
    })
    .from(schema.leaveRequests)
    .leftJoin(
      schema.employees,
      eq(schema.employees.id, schema.leaveRequests.employeeId),
    )
    .where(eq(schema.leaveRequests.id, leaveRequestId))
    .limit(1);

  const row = rows[0];
  if (!row) return { skipped: "not_approved" };
  if (row.status !== "approved") return { skipped: "not_approved" };
  if (!row.nmbrsEmployeeId) return { skipped: "no_nmbrs_id" };

  const mapped = leaveTypeMap[row.type as LeaveTypeKey];
  if (!mapped) return { skipped: "no_nmbrs_mapping" };

  try {
    getCredentialsFromEnv();
  } catch (e) {
    if (e instanceof NmbrsError && e.code === "missing_credentials") {
      return { skipped: "missing_credentials" };
    }
    throw e;
  }

  await pushLeaveRequest({
    nmbrsEmployeeId: row.nmbrsEmployeeId,
    startDate: row.startDate,
    endDate: row.endDate ?? row.startDate,
    hours: Number(row.hours),
    leaveType: mapped,
  });

  await db
    .update(schema.leaveRequests)
    .set({ nmbrsSyncedAt: new Date() })
    .where(eq(schema.leaveRequests.id, leaveRequestId));

  return { ok: true };
}
