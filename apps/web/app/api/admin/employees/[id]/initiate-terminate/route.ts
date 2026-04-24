import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getDb, schema, auditMutation, eq } from "@casella/db";
import { initiateTerminateSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  let input;
  try {
    input = initiateTerminateSchema.parse({ ...(typeof body === "object" && body !== null ? body : {}), id });
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: "validation_error", issues: err.flatten() }, { status: 400 });
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

  if ("notFound" in result) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if ("alreadyTerminated" in result) return NextResponse.json({ error: "already_terminated" }, { status: 409 });

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ ok: true });
}
