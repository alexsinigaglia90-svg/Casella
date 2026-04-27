import { auditMutation, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const overperfSchema = z.object({
  employeeId: z.string().uuid(),
  amountCents: z.number().int(),
  description: z.string().min(1).max(500),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      apiError("forbidden", "Geen toegang"),
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
    input = overperfSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const now = new Date();
  const period =
    input.period ??
    `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, "0")}`;

  const db = getDb();
  let id = "";
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.bonusLedger)
      .values({
        employeeId: input.employeeId,
        period,
        amountCents: input.amountCents,
        type: "adjustment",
        description: input.description,
        createdBy: user.id,
      })
      .returning({ id: schema.bonusLedger.id });
    id = inserted[0]?.id ?? "";

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "bonus.adjustment.created",
      resourceType: "bonus_ledger",
      resourceId: id,
      changesJson: {
        employeeId: input.employeeId,
        amountCents: input.amountCents,
        description: input.description,
      },
    });
  });

  return NextResponse.json({ id });
}
