import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getDb, schema, auditMutation, eq } from "@casella/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.employees).where(eq(schema.employees.id, id));
    if (!before) return { notFound: true } as const;
    if (!before.pendingTerminationAt) return { noPending: true } as const;

    await tx.update(schema.employees).set({
      pendingTerminationAt: null,
      pendingTerminationReason: null,
      updatedAt: new Date(),
    }).where(eq(schema.employees.id, id));

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.terminate.cancel_pending",
      resourceType: "employees",
      resourceId: id,
      changesJson: { cancelledScheduledAt: before.pendingTerminationAt },
    });

    return { ok: true } as const;
  });

  if ("notFound" in result) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if ("noPending" in result) return NextResponse.json({ error: "no_pending_termination" }, { status: 409 });

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ ok: true });
}
