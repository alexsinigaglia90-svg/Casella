import { getDb, schema, auditMutation, eq } from "@casella/db";
import { updateEmployeeSchema } from "@casella/types";
import { apiError } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { upsertAddress } from "@/lib/employees/upsert-address";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  if (admin.role !== "admin") return NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json(apiError("invalid_id", "Ongeldig medewerker-ID"), { status: 400 });

  const db = getDb();
  const [emp] = await db.select().from(schema.employees).where(eq(schema.employees.id, id));
  if (!emp) return NextResponse.json(apiError("not_found", "Medewerker niet gevonden"), { status: 404 });

  let address: import("@casella/types").AddressInput | null = null;
  if (emp.homeAddressId) {
    const [addr] = await db.select().from(schema.addresses).where(eq(schema.addresses.id, emp.homeAddressId));
    if (addr) {
      address = {
        pdokId: addr.pdokId ?? "",
        street: addr.street,
        houseNumber: addr.houseNumber,
        houseNumberAddition: addr.houseNumberAddition,
        postalCode: addr.postalCode,
        city: addr.city,
        municipality: addr.municipality,
        province: addr.province,
        country: (addr.country as "NL"),
        lat: addr.lat ?? 0,
        lng: addr.lng ?? 0,
        rdX: addr.rdX,
        rdY: addr.rdY,
        fullDisplay: addr.fullAddressDisplay ?? "",
      };
    }
  }

  return NextResponse.json({
    id: emp.id,
    userId: emp.userId,
    inviteEmail: emp.inviteEmail,
    nmbrsEmployeeId: emp.nmbrsEmployeeId,
    homeAddressId: emp.homeAddressId,
    employmentStatus: emp.employmentStatus,
    startDate: emp.startDate ?? null,
    endDate: emp.endDate ?? null,
    defaultKmRateCents: emp.defaultKmRateCents,
    compensationType: emp.compensationType,
    contractedHoursPerWeek: emp.contractedHoursPerWeek,
    managerId: emp.managerId,
    phone: emp.phone,
    emergencyContactName: emp.emergencyContactName,
    emergencyContactPhone: emp.emergencyContactPhone,
    firstName: emp.firstName,
    lastName: emp.lastName,
    avatarUrl: emp.avatarUrl,
    jobTitle: emp.jobTitle,
    notes: emp.notes,
    pendingTerminationAt: emp.pendingTerminationAt ?? null,
    pendingTerminationReason: emp.pendingTerminationReason,
    terminationUndoUntil: emp.terminationUndoUntil?.toISOString() ?? null,
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
    address,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  if (admin.role !== "admin") return NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json(apiError("invalid_id", "Ongeldig medewerker-ID"), { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json(apiError("invalid_json", "Ongeldig JSON-formaat"), { status: 400 }); }

  let input;
  try {
    // Force the URL id to override any body.id; merge then parse.
    input = updateEmployeeSchema.parse({ ...(typeof body === "object" && body !== null ? body : {}), id });
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json(apiError("validation_error", "Ongeldige invoer", err.issues), { status: 400 });
    throw err;
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.employees).where(eq(schema.employees.id, input.id));
    if (!before) return { notFound: true } as const;

    const homeAddressId = "homeAddress" in input
      ? input.homeAddress
        ? await upsertAddress(tx, input.homeAddress)
        : null
      : before.homeAddressId;

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
      firstName: "firstName" in input ? input.firstName ?? null : before.firstName,
      lastName: "lastName" in input ? input.lastName ?? null : before.lastName,
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

  if ("notFound" in result) return NextResponse.json(apiError("not_found", "Medewerker niet gevonden"), { status: 404 });

  revalidatePath("/admin/medewerkers");
  return NextResponse.json({ ok: true });
}
