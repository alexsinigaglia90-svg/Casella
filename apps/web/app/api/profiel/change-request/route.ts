import { auditMutation, eq, getDb, schema } from "@casella/db";
import { changeRequestSubmittedAdminEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const addressProposedSchema = z.object({
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  houseNumberSuffix: z.string().optional(),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default("NL"),
});

const ibanProposedSchema = z.object({
  iban: z.string().min(1),
});

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("address"), proposedValue: addressProposedSchema }),
  z.object({ type: z.literal("iban"), proposedValue: ibanProposedSchema }),
]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(apiError("forbidden", "Geen medewerker-profiel"), { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError("invalid_params", parsed.error.issues[0]?.message ?? "Ongeldige invoer"),
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(apiError("invalid_params", "Ongeldige JSON"), { status: 400 });
  }

  const db = getDb();
  let crId: string;

  await db.transaction(async (tx) => {
    const [crRow] = await tx
      .insert(schema.employeeChangeRequests)
      .values({
        employeeId: employee.id,
        type: body.type,
        proposedValue: body.proposedValue as Record<string, unknown>,
        status: "pending",
      })
      .returning();

    crId = crRow!.id;

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "change_request.submitted",
      resourceType: "employee_change_requests",
      resourceId: crRow!.id,
      changesJson: { type: body.type },
    });
  });

  // Email all admins (outside tx — best-effort)
  const admins = await db
    .select({ userId: schema.users.id, email: schema.users.email, displayName: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));

  const employeeName =
    [employee.firstName, employee.lastName].filter(Boolean).join(" ") || user.displayName;

  for (const admin of admins) {
    if (!admin.email) continue;
    try {
      const notifType =
        body.type === "address" ? "address.change.requested" : "iban.change.requested";
      await enqueueNotification({
        userId: admin.userId,
        type: notifType,
        payload: { changeRequestId: crId!, employeeId: employee.id, changeType: body.type },
        emailRender: () =>
          changeRequestSubmittedAdminEmail({
            to: admin.email,
            recipientName: admin.displayName ?? "Admin",
            appUrl: APP_URL,
            ctaPath: "/admin/change-requests",
            employeeName,
            type: body.type,
          }),
      });
    } catch (e) {
      console.error("change_request.submitted admin notify failed", { error: e });
    }
  }

  return NextResponse.json({ ok: true, id: crId! });
}
