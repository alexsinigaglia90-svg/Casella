import { getDb, schema, auditMutation } from "@casella/db";
import { apiError, createAssignmentSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }
  if (admin.role !== "admin") {
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
    input = createAssignmentSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.projectAssignments)
      .values({
        projectId: input.projectId,
        employeeId: input.employeeId,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        kmRateCents: input.kmRateCents ?? null,
        compensationType: input.compensationType ?? null,
      })
      .returning({ id: schema.projectAssignments.id });

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "assignments.create",
      resourceType: "project_assignments",
      resourceId: created!.id,
      changesJson: { input },
    });

    return created!.id;
  });

  revalidatePath("/admin/toewijzingen");
  return NextResponse.json({ id: result }, { status: 201 });
}
