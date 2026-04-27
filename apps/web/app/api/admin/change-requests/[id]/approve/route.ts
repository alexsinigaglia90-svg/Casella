import { auditMutation, eq, getDb, schema } from "@casella/db";
import { changeRequestDecidedEmployeeEmail } from "@casella/email";
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
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
    if (cr.type === "address") {
      const proposed = cr.proposedValue as {
        street: string;
        houseNumber: string;
        houseNumberSuffix?: string;
        postalCode: string;
        city: string;
        country?: string;
      };

      const [newAddress] = await tx
        .insert(schema.addresses)
        .values({
          street: proposed.street,
          houseNumber: proposed.houseNumber,
          houseNumberAddition: proposed.houseNumberSuffix ?? null,
          postalCode: proposed.postalCode,
          city: proposed.city,
          country: proposed.country ?? "NL",
          fullAddressDisplay: `${proposed.street} ${proposed.houseNumber}${proposed.houseNumberSuffix ? ` ${proposed.houseNumberSuffix}` : ""}, ${proposed.postalCode} ${proposed.city}`,
        })
        .returning();

      await tx
        .update(schema.employees)
        .set({ homeAddressId: newAddress!.id })
        .where(eq(schema.employees.id, cr.employeeId));
    }

    // For iban type: TODO IBAN-STORAGE-AND-NMBRS-PUSH — deferred (Fase 2)
    // Casella has no iban column on employees; Nmbrs IBAN push comes in Fase 2.

    await tx
      .update(schema.employeeChangeRequests)
      .set({ status: "approved", decidedAt: now, decidedBy: auth.admin.id })
      .where(eq(schema.employeeChangeRequests.id, id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "change_request.approved",
      resourceType: "employee_change_requests",
      resourceId: id,
      changesJson: { type: cr.type },
    });
  });

  // Notify employee (best-effort, outside tx)
  const empRows = await db
    .select({
      userId: schema.employees.userId,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
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
        payload: { changeRequestId: id, changeType: cr.type },
        emailRender: () =>
          changeRequestDecidedEmployeeEmail({
            to: emp.email!,
            recipientName: emp.displayName ?? "",
            appUrl: APP_URL,
            ctaPath: "/profiel",
            decision: "goedgekeurd",
            type: cr.type as "address" | "iban",
          }),
      });
    } catch (e) {
      console.error("change_request.approved notify failed", { id, error: e });
    }
  }

  return NextResponse.json({ ok: true });
}
