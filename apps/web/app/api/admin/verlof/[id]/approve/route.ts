import { auditMutation, eq, getDb, schema } from "@casella/db";
import { leaveDecidedEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";
import { pushLeaveToNmbrs } from "@/lib/nmbrs/leave-sync";
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      apiError("invalid_params", "id vereist"),
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date();

  let leaveRow: typeof schema.leaveRequests.$inferSelect | null = null;

  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(schema.leaveRequests)
        .where(eq(schema.leaveRequests.id, id))
        .limit(1);
      const existing = rows[0];
      if (!existing) {
        throw new Error("not_found");
      }
      if (existing.status !== "pending") {
        throw new Error("invalid_state");
      }

      await tx
        .update(schema.leaveRequests)
        .set({
          status: "approved",
          approvedAt: now,
          approvedBy: auth.admin.id,
          updatedAt: now,
        })
        .where(eq(schema.leaveRequests.id, id));

      await auditMutation(tx, {
        actorUserId: auth.admin.id,
        action: "leave.approved",
        resourceType: "leave_requests",
        resourceId: id,
        changesJson: { previousStatus: existing.status },
      });

      leaveRow = { ...existing, status: "approved", approvedAt: now, approvedBy: auth.admin.id };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") {
      return NextResponse.json(
        apiError("not_found", "Verlofaanvraag niet gevonden"),
        { status: 404 },
      );
    }
    if (msg === "invalid_state") {
      return NextResponse.json(
        apiError("invalid_state", "Aanvraag is niet 'pending'"),
        { status: 409 },
      );
    }
    throw e;
  }

  if (leaveRow) {
    const lr = leaveRow as typeof schema.leaveRequests.$inferSelect;
    const empRows = await db
      .select({
        employeeId: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        userId: schema.employees.userId,
        email: schema.users.email,
        displayName: schema.users.displayName,
      })
      .from(schema.employees)
      .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
      .where(eq(schema.employees.id, lr.employeeId))
      .limit(1);
    const emp = empRows[0];
    if (emp?.userId && emp.email) {
      const config = LEAVE_TYPES[lr.type as LeaveTypeKey];
      try {
        await enqueueNotification({
          userId: emp.userId,
          employeeId: emp.employeeId,
          type: "leave.approved",
          payload: { leaveId: id, type: lr.type },
          emailRender: () =>
            leaveDecidedEmployeeEmail({
              to: emp.email!,
              recipientName: emp.displayName ?? "",
              appUrl: APP_URL,
              decision: "goedgekeurd",
              leaveTypeLabel: config?.label ?? lr.type,
              startDate: lr.startDate,
              endDate: lr.endDate,
              hours: Number(lr.hours),
            }),
        });
      } catch (e) {
        console.error("leave.approved notify failed", { id, error: e });
      }
    }

    try {
      const res = await pushLeaveToNmbrs(id);
      if (res && "skipped" in res) {
        console.log("nmbrs leave-push skipped", { id, reason: res.skipped });
      }
    } catch (e) {
      console.error("nmbrs leave-push failed (best-effort)", { id, error: e });
    }
  }

  return NextResponse.json({ ok: true });
}
