import { getDb, schema, auditMutation, eq } from "@casella/db";
import { initiateTerminateSchema } from "@casella/types";
import { apiError } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  if (admin.role !== "admin") return NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json(apiError("invalid_id", "Ongeldig medewerker-ID"), { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json(apiError("invalid_json", "Ongeldig JSON-formaat"), { status: 400 }); }

  let input;
  try {
    input = initiateTerminateSchema.parse({ ...(typeof body === "object" && body !== null ? body : {}), id });
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json(apiError("validation_error", "Ongeldige invoer", err.issues), { status: 400 });
    throw err;
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.employees).where(eq(schema.employees.id, input.id));
    if (!before) return { notFound: true } as const;
    if (before.employmentStatus === "terminated") return { alreadyTerminated: true } as const;

    await tx.update(schema.employees).set({
      pendingTerminationAt: input.pendingTerminationAt,
      pendingTerminationReason: input.reason ?? null,
      updatedAt: new Date(),
    }).where(eq(schema.employees.id, input.id));

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.terminate.initiate",
      resourceType: "employees",
      resourceId: input.id,
      changesJson: { scheduledAt: input.pendingTerminationAt, reason: input.reason, confirmText: input.confirmText },
    });

    return { ok: true } as const;
  });

  if ("notFound" in result) return NextResponse.json(apiError("not_found", "Medewerker niet gevonden"), { status: 404 });
  if ("alreadyTerminated" in result) return NextResponse.json(apiError("already_terminated", "Medewerker is al uitgedienst"), { status: 409 });

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ ok: true });
}
