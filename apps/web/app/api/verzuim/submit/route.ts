import { auditMutation, eq, getDb, schema } from "@casella/db";
import { sickSubmittedAdminEmail } from "@casella/email";
import { apiError, dateIsoSchema } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const sickSubmitSchema = z.object({
  startDate: dateIsoSchema,
  expectedDurationDays: z.number().int().min(1).max(365).optional().nullable(),
  availabilityStatus: z
    .enum(["home", "unavailable", "unknown"])
    .optional()
    .nullable(),
});

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
    input = sickSubmitSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const db = getDb();
  const now = new Date();
  let sickId = "";

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.leaveRequests)
      .values({
        employeeId: employee.id,
        type: "sick",
        hours: "0",
        startDate: input.startDate,
        endDate: null,
        status: "approved",
        submittedAt: now,
        approvedAt: now,
        approvedBy: user.id,
        availabilityStatus: input.availabilityStatus ?? null,
        customPayload: {
          availabilityStatus: input.availabilityStatus ?? null,
          expectedDurationDays: input.expectedDurationDays ?? null,
        },
      })
      .returning({ id: schema.leaveRequests.id });
    sickId = inserted[0]?.id ?? "";

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "sick.submitted",
      resourceType: "leave_requests",
      resourceId: sickId,
      changesJson: {
        startDate: input.startDate,
        expectedDurationDays: input.expectedDurationDays ?? null,
      },
    });
  });

  const admins = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));
  const employeeName = employee.firstName
    ? `${employee.firstName} ${employee.lastName ?? ""}`.trim()
    : "Een medewerker";
  for (const admin of admins) {
    try {
      await enqueueNotification({
        userId: admin.id,
        type: "sick.submitted",
        payload: {
          sickId,
          employeeId: employee.id,
          startDate: input.startDate,
          expectedDurationDays: input.expectedDurationDays ?? null,
        },
        emailRender: () =>
          sickSubmittedAdminEmail({
            to: admin.email,
            recipientName: admin.displayName,
            appUrl: APP_URL,
            employeeName,
            startDate: input.startDate,
            expectedDays: input.expectedDurationDays ?? null,
          }),
      });
    } catch (e) {
      console.error("sick.submitted notify failed", { adminId: admin.id, error: e });
    }
  }

  return NextResponse.json({ ok: true, id: sickId });
}
