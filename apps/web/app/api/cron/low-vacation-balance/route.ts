import { and, eq, getDb, gt, schema, sql } from "@casella/db";
import { vacationBalanceLowEmployeeEmail } from "@casella/email";
import { NextResponse, type NextRequest } from "next/server";

import { checkCronSecret } from "@/lib/cron/guard";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const VACATION_LEAVE_TYPES = ["vacation_legal", "vacation_extra"];

export async function POST(req: NextRequest) {
  const guard = checkCronSecret(req);
  if (guard) return guard;

  const db = getDb();
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const employees = await db
    .select({
      id: schema.employees.id,
      userId: schema.employees.userId,
      contractedHoursPerWeek: schema.employees.contractedHoursPerWeek,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(
      and(
        eq(schema.employees.employmentStatus, "active"),
        gt(schema.employees.contractedHoursPerWeek, 0),
      ),
    );

  let employeesNotified = 0;

  for (const emp of employees) {
    if (!emp.userId || !emp.email) continue;

    // Sum hoursRemaining across vacation leave types for current year
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
    if (!Number.isFinite(hoursRemaining)) continue;

    const threshold = emp.contractedHoursPerWeek / 2;
    if (hoursRemaining > threshold) continue;

    // Check 30-day dedup: no vacation.balance.low notification in last 30 days
    const recentRows = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, emp.userId),
          eq(schema.notifications.type, "vacation.balance.low"),
          gt(schema.notifications.createdAt, thirtyDaysAgo),
        ),
      )
      .limit(1);
    if (recentRows.length > 0) continue;

    try {
      await enqueueNotification({
        userId: emp.userId,
        employeeId: emp.id,
        type: "vacation.balance.low",
        payload: { hoursRemaining, year: currentYear },
        emailRender: () =>
          vacationBalanceLowEmployeeEmail({
            to: emp.email!,
            recipientName: emp.displayName ?? "",
            appUrl: APP_URL,
            ctaPath: "/verlof",
            hoursRemaining,
          }),
      });
      employeesNotified++;
    } catch (e) {
      console.error("low-vacation-balance notify failed", {
        employeeId: emp.id,
        error: e,
      });
    }
  }

  return NextResponse.json({ ok: true, employeesNotified });
}
