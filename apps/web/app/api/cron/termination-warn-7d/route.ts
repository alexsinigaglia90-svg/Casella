import { eq, getDb, schema } from "@casella/db";
import { terminationUpcomingAdminEmail } from "@casella/email";
import { NextResponse, type NextRequest } from "next/server";

import { checkCronSecret } from "@/lib/cron/guard";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function asIso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export async function POST(req: NextRequest) {
  const guard = checkCronSecret(req);
  if (guard) return guard;

  const db = getDb();
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const targetDate = asIso(sevenDaysOut);

  // Find employees with pending termination in exactly 7 days
  const terminating = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      pendingTerminationAt: schema.employees.pendingTerminationAt,
    })
    .from(schema.employees)
    .where(eq(schema.employees.pendingTerminationAt, targetDate));

  if (terminating.length === 0) {
    return NextResponse.json({ ok: true, employeesFlagged: 0 });
  }

  // Fetch all admins
  const admins = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));

  let employeesFlagged = 0;

  for (const emp of terminating) {
    const employeeName = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "Medewerker";
    const effectiveDate = emp.pendingTerminationAt ?? targetDate;

    for (const admin of admins) {
      try {
        await enqueueNotification({
          userId: admin.id,
          type: "termination.upcoming",
          payload: {
            employeeId: emp.id,
            employeeName,
            effectiveDate,
          },
          emailRender: () =>
            terminationUpcomingAdminEmail({
              to: admin.email,
              recipientName: admin.displayName,
              appUrl: APP_URL,
              ctaPath: `/admin/medewerkers/${emp.id}`,
              employeeName,
              effectiveDate,
            }),
        });
      } catch (e) {
        console.error("termination-warn-7d notify failed", {
          employeeId: emp.id,
          adminId: admin.id,
          error: e,
        });
      }
    }

    employeesFlagged++;
  }

  return NextResponse.json({ ok: true, employeesFlagged });
}
