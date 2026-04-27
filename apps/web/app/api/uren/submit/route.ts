import { getDb, schema, auditMutation, and, eq, gte, lte } from "@casella/db";
import { apiError, submitWeekSchema } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

async function requireEmployee() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "Niet ingelogd"),
        { status: 401 },
      ),
    } as const;
  }
  const employee = await getCurrentEmployee();
  if (!employee) {
    return {
      error: NextResponse.json(
        apiError("forbidden", "Geen medewerkersprofiel"),
        { status: 403 },
      ),
    } as const;
  }
  return { user, employee } as const;
}

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const auth = await requireEmployee();
  if ("error" in auth) return auth.error;

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
    input = submitWeekSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const weekStart = input.weekStart;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = asIso(weekEnd);

  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(schema.hourEntries)
      .set({ status: "submitted", submittedAt: now, updatedAt: now })
      .where(
        and(
          eq(schema.hourEntries.employeeId, auth.employee.id),
          gte(schema.hourEntries.workDate, weekStart),
          lte(schema.hourEntries.workDate, weekEndIso),
          eq(schema.hourEntries.status, "draft"),
        ),
      );

    await auditMutation(tx, {
      actorUserId: auth.user.id,
      action: "hours.submit_week",
      resourceType: "hour_entries",
      resourceId: auth.employee.id,
      changesJson: { weekStart },
    });
  });

  return NextResponse.json({ ok: true });
}
