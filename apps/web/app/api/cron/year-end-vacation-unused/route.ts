import { and, eq, getDb, schema, sql } from "@casella/db";
import { vacationUnusedYearEndEmployeeEmail } from "@casella/email";
import { NextResponse, type NextRequest } from "next/server";

import { checkCronSecret } from "@/lib/cron/guard";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const MIN_HOURS_THRESHOLD = 40; // 5 working days

const VACATION_LEAVE_TYPES = ["vacation_legal", "vacation_extra"];

export async function POST(req: NextRequest) {
  const guard = checkCronSecret(req);
  if (guard) return guard;

  const now = new Date();
  const month = now.getUTCMonth() + 1; // 1..12
  const currentYear = now.getUTCFullYear();

  // Only run in December or January
  if (month !== 12 && month !== 1) {
    return NextResponse.json({ skipped: "wrong_month" });
  }

  const db = getDb();

  const employees = await db
    .select({
      id: schema.employees.id,
      userId: schema.employees.userId,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(eq(schema.employees.employmentStatus, "active"));

  let employeesNotified = 0;

  for (const emp of employees) {
    if (!emp.userId || !emp.email) continue;

    const balanceRows = await db
      .select({
        totalRemaining: sql<string>`SUM(${schema.leaveBalanceSnapshots.hoursRemaining})`,
      })
      .from(schema.leaveBalanceSnapshots)
      .where(
        and(
          eq(schema.leaveBalanceSnapshots.employeeId, emp.id),
          eq(schema.leaveBalanceSnapshots.year, currentYear),
          sql`${schema.leaveBalanceSnapshots.leaveType} = ANY(${sql.raw(`ARRAY['${VACATION_LEAVE_TYPES.join("','")}']}`)})`,
        ),
      );

    const hoursRemaining = parseFloat(balanceRows[0]?.totalRemaining ?? "0");
    if (!Number.isFinite(hoursRemaining) || hoursRemaining <= MIN_HOURS_THRESHOLD)
      continue;

    try {
      await enqueueNotification({
        userId: emp.userId,
        employeeId: emp.id,
        type: "vacation.unused.year-end",
        payload: { hoursRemaining, year: currentYear },
        emailRender: () =>
          vacationUnusedYearEndEmployeeEmail({
            to: emp.email!,
            recipientName: emp.displayName ?? "",
            appUrl: APP_URL,
            ctaPath: "/verlof",
            hoursRemaining,
            year: currentYear,
          }),
      });
      employeesNotified++;
    } catch (e) {
      console.error("year-end-vacation-unused notify failed", {
        employeeId: emp.id,
        error: e,
      });
    }
  }

  return NextResponse.json({ ok: true, employeesNotified });
}
