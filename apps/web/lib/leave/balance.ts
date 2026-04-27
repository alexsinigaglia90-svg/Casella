import "server-only";
import { and, eq, getDb, schema } from "@casella/db";

import { LEAVE_TYPES, type LeaveTypeKey } from "./types";

export interface LeaveBalance {
  type: LeaveTypeKey;
  hoursTotal: number;
  hoursRemaining: number;
  syncedAt: Date | null;
}

export async function getLeaveBalances(
  employeeId: string,
  year: number = new Date().getUTCFullYear(),
): Promise<Partial<Record<LeaveTypeKey, LeaveBalance>>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.leaveBalanceSnapshots)
    .where(
      and(
        eq(schema.leaveBalanceSnapshots.employeeId, employeeId),
        eq(schema.leaveBalanceSnapshots.year, year),
      ),
    );

  const out: Partial<Record<LeaveTypeKey, LeaveBalance>> = {};
  for (const r of rows) {
    const key = r.leaveType as LeaveTypeKey;
    if (!(key in LEAVE_TYPES)) continue;
    out[key] = {
      type: key,
      hoursTotal: Number(r.hoursTotal),
      hoursRemaining: Number(r.hoursRemaining),
      syncedAt: r.syncedAt ?? null,
    };
  }
  return out;
}

/**
 * Heuristic fallback when no Nmbrs snapshot is available yet.
 * Returns null for event-based types (pregnancy, maternity, calamity, etc.).
 */
export function fallbackBalance(
  type: LeaveTypeKey,
  weeklyHours: number,
): { hoursTotal: number; hoursRemaining: number } | null {
  switch (type) {
    case "vacation_legal":
      return { hoursTotal: 25 * 8, hoursRemaining: 25 * 8 };
    case "vacation_extra":
      return { hoursTotal: 25 * 8, hoursRemaining: 25 * 8 };
    case "short_care":
      return { hoursTotal: weeklyHours * 2, hoursRemaining: weeklyHours * 2 };
    case "long_care":
      return { hoursTotal: weeklyHours * 6, hoursRemaining: weeklyHours * 6 };
    case "parental_paid":
      return { hoursTotal: weeklyHours * 9, hoursRemaining: weeklyHours * 9 };
    case "parental_unpaid":
      return { hoursTotal: weeklyHours * 17, hoursRemaining: weeklyHours * 17 };
    default:
      return null;
  }
}
