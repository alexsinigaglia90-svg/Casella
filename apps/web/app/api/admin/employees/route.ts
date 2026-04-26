import { getDb, schema, auditMutation } from "@casella/db";
import { sendEmail, welcomeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { createEmployeeSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { upsertAddress } from "@/lib/employees/upsert-address";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  if (admin.role !== "admin") return NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json(apiError("invalid_json", "Ongeldig JSON-formaat"), { status: 400 }); }

  let input;
  try { input = createEmployeeSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json(apiError("validation_error", "Ongeldige invoer", err.issues), { status: 400 });
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
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
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
      displayName: input.firstName?.trim() || input.inviteEmail.split("@")[0]!,
      portalUrl,
      firstName: input.firstName ?? null,
    });
    await sendEmail({ to: input.inviteEmail, ...email });
  } catch (err) {
    console.error("Welcome email failed:", err);
    // Do not fail the create — admin can resend later
  }

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ id: employeeId }, { status: 201 });
}
