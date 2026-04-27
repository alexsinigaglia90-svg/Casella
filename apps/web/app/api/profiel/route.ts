import { auditMutation, eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  phone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  themePreference: z.enum(["light", "dark", "system"]).optional(),
  languagePreference: z.enum(["nl", "en"]).optional(),
  bio: z.string().max(500).optional(),
  avatarStoragePath: z.string().optional(),
  emailNotificationPreferences: z.record(z.boolean()).optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(apiError("forbidden", "Geen medewerker-profiel"), { status: 403 });
  }

  let body: z.infer<typeof patchBodySchema>;
  try {
    const raw = await req.json();
    const parsed = patchBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError("invalid_params", parsed.error.issues[0]?.message ?? "Ongeldige invoer"),
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(apiError("invalid_params", "Ongeldige JSON"), { status: 400 });
  }

  const db = getDb();
  const { themePreference, ...employeeFields } = body;

  await db.transaction(async (tx) => {
    if (themePreference) {
      await tx.update(schema.users).set({ themePreference }).where(eq(schema.users.id, user.id));
    }

    const employeeUpdate: Record<string, unknown> = {};
    if (employeeFields.phone !== undefined) employeeUpdate.phone = employeeFields.phone;
    if (employeeFields.emergencyContactName !== undefined)
      employeeUpdate.emergencyContactName = employeeFields.emergencyContactName;
    if (employeeFields.emergencyContactPhone !== undefined)
      employeeUpdate.emergencyContactPhone = employeeFields.emergencyContactPhone;
    if (employeeFields.languagePreference !== undefined)
      employeeUpdate.languagePreference = employeeFields.languagePreference;
    if (employeeFields.bio !== undefined) employeeUpdate.bio = employeeFields.bio;
    if (employeeFields.avatarStoragePath !== undefined)
      employeeUpdate.avatarStoragePath = employeeFields.avatarStoragePath;
    if (employeeFields.emailNotificationPreferences !== undefined)
      employeeUpdate.emailNotificationPreferences = employeeFields.emailNotificationPreferences;

    if (Object.keys(employeeUpdate).length > 0) {
      await tx
        .update(schema.employees)
        .set(employeeUpdate)
        .where(eq(schema.employees.id, employee.id));
    }

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "profile.updated",
      resourceType: "employees",
      resourceId: employee.id,
      changesJson: body,
    });
  });

  const [updatedEmployee] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employee.id))
    .limit(1);

  return NextResponse.json({ ok: true, employee: updatedEmployee });
}
