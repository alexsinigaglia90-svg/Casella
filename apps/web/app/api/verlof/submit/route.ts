import { auditMutation, eq, getDb, schema } from "@casella/db";
import { leaveSubmittedAdminEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";
import { leaveSubmitSchema } from "@/lib/leave/validation";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("forbidden", "Geen medewerkersprofiel"),
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError("invalid_json", "Ongeldig JSON-formaat"),
      { status: 400 },
    );
  }

  let input;
  try {
    input = leaveSubmitSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const typeKey = input.type as LeaveTypeKey;
  const config = LEAVE_TYPES[typeKey];
  const isSelfApprove = config.approvalMode === "self";
  const now = new Date();

  const db = getDb();
  let leaveId = "";
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.leaveRequests)
      .values({
        employeeId: employee.id,
        type: typeKey,
        hours: String(input.hours),
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        reason: input.notes ?? null,
        status: isSelfApprove ? "approved" : "pending",
        submittedAt: now,
        approvedAt: isSelfApprove ? now : null,
        approvedBy: isSelfApprove ? user.id : null,
        customPayload: input.customPayload ?? null,
      })
      .returning({ id: schema.leaveRequests.id });
    leaveId = inserted[0]?.id ?? "";

    await auditMutation(tx, {
      actorUserId: user.id,
      action: isSelfApprove ? "leave.self_approved" : "leave.submitted",
      resourceType: "leave_requests",
      resourceId: leaveId,
      changesJson: {
        type: typeKey,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        hours: input.hours,
      },
    });
  });

  if (!isSelfApprove) {
    const admins = await db
      .select({ id: schema.users.id, email: schema.users.email, displayName: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.role, "admin"));
    for (const admin of admins) {
      try {
        await enqueueNotification({
          userId: admin.id,
          type: "leave.submitted",
          payload: {
            leaveId,
            employeeId: employee.id,
            type: typeKey,
            startDate: input.startDate,
            endDate: input.endDate ?? null,
            hours: input.hours,
          },
          emailRender: () =>
            leaveSubmittedAdminEmail({
              to: admin.email,
              recipientName: admin.displayName,
              appUrl: APP_URL,
              employeeName: employee.firstName
                ? `${employee.firstName} ${employee.lastName ?? ""}`.trim()
                : "Een medewerker",
              leaveTypeLabel: config.label,
              startDate: input.startDate,
              endDate: input.endDate ?? null,
              hours: input.hours,
            }),
        });
      } catch (e) {
        console.error("leave.submitted notify failed", { adminId: admin.id, error: e });
      }
    }
  }

  return NextResponse.json({ ok: true, id: leaveId, status: isSelfApprove ? "approved" : "pending" });
}
