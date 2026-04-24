import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getDb, schema, auditMutation } from "@casella/db";
import { createEmployeeSchema } from "@casella/types";
import { upsertAddress } from "@/lib/employees/upsert-address";
import { sendEmail, welcomeEmail } from "@casella/email";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  let input;
  try { input = createEmployeeSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: "validation_error", issues: err.flatten() }, { status: 400 });
    throw err;
  }

  const db = getDb();
  const employeeId = await db.transaction(async (tx) => {
    let homeAddressId: string | null = null;
    if (input.homeAddress) homeAddressId = await upsertAddress(tx, input.homeAddress);

    const [created] = await tx.insert(schema.employees).values({
      inviteEmail: input.inviteEmail,
      nmbrsEmployeeId: input.nmbrsEmployeeId ?? null,
      jobTitle: input.jobTitle ?? null,
      startDate: input.startDate ?? null,
      managerId: input.managerId ?? null,
      contractedHoursPerWeek: input.contractedHoursPerWeek,
      defaultKmRateCents: input.defaultKmRateCents,
      compensationType: input.compensationType,
      homeAddressId,
      phone: input.phone ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      notes: input.notes ?? null,
    }).returning({ id: schema.employees.id });

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.create",
      resourceType: "employees",
      resourceId: created!.id,
      changesJson: { after: input },
    });

    return created!.id;
  });

  try {
    const portalUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const email = welcomeEmail({
      displayName: input.inviteEmail.split("@")[0]!,
      portalUrl,
    });
    await sendEmail({ to: input.inviteEmail, ...email });
  } catch (err) {
    console.error("Welcome email failed:", err);
    // Do not fail the create — admin can resend later
  }

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ id: employeeId }, { status: 201 });
}
