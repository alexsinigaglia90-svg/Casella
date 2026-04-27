import { auditMutation, eq, getDb, schema } from "@casella/db";
import { changeRequestDecidedEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const bodySchema = z.object({
  reason: z.string().min(1),
});

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) {
    return {
      error: NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 }),
    } as const;
  }
  if (u.role !== "admin") {
    return {
      error: NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 }),
    } as const;
  }
  return { admin: u } as const;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  let reason: string;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError("invalid_params", parsed.error.issues[0]?.message ?? "Reden vereist"),
        { status: 400 },
      );
    }
    reason = parsed.data.reason;
  } catch {
    return NextResponse.json(apiError("invalid_params", "Ongeldige JSON"), { status: 400 });
  }

  const db = getDb();
  const now = new Date();

  const rows = await db
    .select()
    .from(schema.employeeChangeRequests)
    .where(eq(schema.employeeChangeRequests.id, id))
    .limit(1);

  const cr = rows[0];
  if (!cr) {
    return NextResponse.json(
      apiError("not_found", "Wijzigingsverzoek niet gevonden"),
      { status: 404 },
    );
  }
  if (cr.status !== "pending") {
    return NextResponse.json(
      apiError("invalid_state", "Verzoek is niet meer pending"),
      { status: 409 },
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.employeeChangeRequests)
      .set({ status: "rejected", decidedAt: now, decidedBy: auth.admin.id, rejectionReason: reason })
      .where(eq(schema.employeeChangeRequests.id, id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "change_request.rejected",
      resourceType: "employee_change_requests",
      resourceId: id,
      changesJson: { type: cr.type, reason },
    });
  });

  // Notify employee (best-effort)
  const empRows = await db
    .select({
      userId: schema.employees.userId,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(eq(schema.employees.id, cr.employeeId))
    .limit(1);

  const emp = empRows[0];
  if (emp?.userId && emp.email) {
    try {
      const notifType =
        cr.type === "address" ? "address.change.approved" : "iban.change.approved";
      await enqueueNotification({
        userId: emp.userId,
        employeeId: cr.employeeId,
        type: notifType,
        payload: { changeRequestId: id, changeType: cr.type, reason },
        emailRender: () =>
          changeRequestDecidedEmployeeEmail({
            to: emp.email!,
            recipientName: emp.displayName ?? "",
            appUrl: APP_URL,
            ctaPath: "/profiel",
            decision: "afgewezen",
            type: cr.type as "address" | "iban",
            reason,
          }),
      });
    } catch (e) {
      console.error("change_request.rejected notify failed", { id, error: e });
    }
  }

  return NextResponse.json({ ok: true });
}
