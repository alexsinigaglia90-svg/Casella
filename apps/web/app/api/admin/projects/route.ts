import { getDb, schema, auditMutation } from "@casella/db";
import { apiError, createProjectSchema } from "@casella/types";
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
    input = createProjectSchema.parse(body);
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
      .insert(schema.projects)
      .values({
        clientId: input.clientId,
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        status: input.status,
        createdBy: admin.id,
      })
      .returning({ id: schema.projects.id });

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "projects.create",
      resourceType: "projects",
      resourceId: created!.id,
      changesJson: { input },
    });

    return created!.id;
  });

  revalidatePath("/admin/projecten");
  return NextResponse.json({ id: result }, { status: 201 });
}
