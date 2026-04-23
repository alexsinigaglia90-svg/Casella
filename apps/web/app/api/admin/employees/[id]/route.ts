import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getDb, schema, auditMutation, eq } from "@casella/db";
import { updateEmployeeSchema } from "@casella/types";
import { upsertAddress } from "@/lib/employees/upsert-address";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  let input;
  try {
    // Force the URL id to override any body.id; merge then parse.
    input = updateEmployeeSchema.parse({ ...(typeof body === "object" && body !== null ? body : {}), id });
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: "validation_error", issues: err.flatten() }, { status: 400 });
    throw err;
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.employees).where(eq(schema.employees.id, input.id));
    if (!before) return { notFound: true } as const;

    let homeAddressId = before.homeAddressId;
    if (input.homeAddress) homeAddressId = await upsertAddress(tx, input.homeAddress);

    // Merge: undefined = leave as-is; explicit null = clear. Use `in` operator on the input object to detect "field was sent".
    const patch = {
      inviteEmail: "inviteEmail" in input ? input.inviteEmail ?? before.inviteEmail : before.inviteEmail,
      nmbrsEmployeeId: "nmbrsEmployeeId" in input ? input.nmbrsEmployeeId ?? null : before.nmbrsEmployeeId,
      jobTitle: "jobTitle" in input ? input.jobTitle ?? null : before.jobTitle,
      startDate: "startDate" in input ? input.startDate ?? null : before.startDate,
      managerId: "managerId" in input ? input.managerId ?? null : before.managerId,
      contractedHoursPerWeek: input.contractedHoursPerWeek ?? before.contractedHoursPerWeek,
      defaultKmRateCents: input.defaultKmRateCents ?? before.defaultKmRateCents,
      compensationType: input.compensationType ?? before.compensationType,
      homeAddressId,
      phone: "phone" in input ? input.phone ?? null : before.phone,
      emergencyContactName: "emergencyContactName" in input ? input.emergencyContactName ?? null : before.emergencyContactName,
      emergencyContactPhone: "emergencyContactPhone" in input ? input.emergencyContactPhone ?? null : before.emergencyContactPhone,
      notes: "notes" in input ? input.notes ?? null : before.notes,
      updatedAt: new Date(),
    };

    await tx.update(schema.employees).set(patch).where(eq(schema.employees.id, input.id));

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.update",
      resourceType: "employees",
      resourceId: input.id,
      changesJson: { before, patch },
    });

    return { ok: true } as const;
  });

  if ("notFound" in result) return NextResponse.json({ error: "not_found" }, { status: 404 });

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ ok: true });
}
