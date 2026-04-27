import { and, auditMutation, eq, getDb, isNull, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";

import { pushLeaveToNmbrs } from "@/lib/nmbrs/leave-sync";
import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const recoverSchema = z.object({ id: z.string().uuid() });

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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
    input = recoverSchema.parse(body);
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
        eq(schema.leaveRequests.type, "sick"),
        isNull(schema.leaveRequests.endDate),
      ),
    )
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    return NextResponse.json(
      apiError("not_found", "Geen actieve ziekmelding gevonden"),
      { status: 404 },
    );
  }

  const today = asIso(new Date());
  await db.transaction(async (tx) => {
    await tx
      .update(schema.leaveRequests)
      .set({ endDate: today, updatedAt: new Date() })
      .where(eq(schema.leaveRequests.id, existing.id));
    await auditMutation(tx, {
      actorUserId: user.id,
      action: "sick.recovered",
      resourceType: "leave_requests",
      resourceId: existing.id,
      changesJson: { endDate: today },
    });
  });

  // Best-effort Nmbrs push (idempotent helper, log-skip on no-mapping/no-creds)
  try {
    const res = await pushLeaveToNmbrs(existing.id);
    if (res && "skipped" in res) {
      console.log("nmbrs sick-recover push skipped", {
        id: existing.id,
        reason: res.skipped,
      });
    }
  } catch (e) {
    console.error("nmbrs sick-recover push failed (best-effort)", {
      id: existing.id,
      error: e,
    });
  }

  return NextResponse.json({ ok: true });
}
