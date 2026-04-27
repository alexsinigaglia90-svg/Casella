import { getDb, schema, auditMutation, and, eq, gte, lte } from "@casella/db";
import { hoursDecidedEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "Niet ingelogd"),
        { status: 401 },
      ),
    } as const;
  }
  if (u.role !== "admin") {
    return {
      error: NextResponse.json(
        apiError("forbidden", "Geen toegang"),
        { status: 403 },
      ),
    } as const;
  }
  return { admin: u } as const;
}

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Format weekStart (YYYY-MM-DD) as e.g. "2026-W17" */
function toWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - startOfYear.getTime()) / 86_400_000 + startOfYear.getUTCDay() + 1) / 7,
  );
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ employeeId: string; weekStart: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { employeeId, weekStart } = await params;
  if (!employeeId || !weekStart) {
    return NextResponse.json(
      apiError("invalid_params", "employeeId en weekStart vereist"),
      { status: 400 },
    );
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = asIso(weekEnd);

  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(schema.hourEntries)
      .set({
        status: "approved",
        approvedAt: now,
        approvedBy: auth.admin.id,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.hourEntries.employeeId, employeeId),
          gte(schema.hourEntries.workDate, weekStart),
          lte(schema.hourEntries.workDate, weekEndIso),
          eq(schema.hourEntries.status, "submitted"),
        ),
      );

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "hours.approve_week",
      resourceType: "hour_entries",
      resourceId: employeeId,
      changesJson: { weekStart, approvedBy: auth.admin.id },
    });
  });

  // Notify employee
  const empRows = await db
    .select({
      employeeId: schema.employees.id,
      userId: schema.employees.userId,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  const emp = empRows[0];
  if (emp?.userId && emp.email) {
    const weekLabel = toWeekLabel(weekStart);
    try {
      await enqueueNotification({
        userId: emp.userId,
        employeeId: emp.employeeId,
        type: "hours.approved",
        payload: { weekStart, weekLabel },
        emailRender: () =>
          hoursDecidedEmployeeEmail({
            to: emp.email!,
            recipientName: emp.displayName ?? "",
            appUrl: APP_URL,
            ctaPath: "/uren",
            decision: "goedgekeurd",
            weekLabel,
          }),
      });
    } catch (e) {
      console.error("hours.approved notify failed", { employeeId, error: e });
    }
  }

  return NextResponse.json({ ok: true });
}
