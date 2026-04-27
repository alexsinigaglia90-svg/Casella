import { and, auditMutation, eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const cancelSchema = z.object({ id: z.string().uuid() });

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
    input = cancelSchema.parse(body);
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
  const rows = await db
    .select()
    .from(schema.leaveRequests)
    .where(
      and(
        eq(schema.leaveRequests.id, input.id),
        eq(schema.leaveRequests.employeeId, employee.id),
      ),
    )
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    return NextResponse.json(
      apiError("not_found", "Verlofaanvraag niet gevonden"),
      { status: 404 },
    );
  }
  if (existing.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.leaveRequests)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(schema.leaveRequests.id, existing.id));
    await auditMutation(tx, {
      actorUserId: user.id,
      action: "leave.cancelled",
      resourceType: "leave_requests",
      resourceId: existing.id,
      changesJson: { previousStatus: existing.status },
    });
  });

  // TODO Nmbrs-revert wanneer 'approved' state was — Task 10 hook
  return NextResponse.json({ ok: true });
}
