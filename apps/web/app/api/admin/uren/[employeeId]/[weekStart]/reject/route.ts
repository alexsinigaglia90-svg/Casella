import { getDb, schema, auditMutation, and, eq, gte, lte } from "@casella/db";
import { apiError, rejectEntrySchema } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

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

export async function POST(
  req: NextRequest,
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
    input = rejectEntrySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
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
        status: "rejected",
        rejectionReason: input.reason,
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
      action: "hours.reject_week",
      resourceType: "hour_entries",
      resourceId: employeeId,
      changesJson: { weekStart, reason: input.reason },
    });
  });

  return NextResponse.json({ ok: true });
}
