import { getDb, schema, auditMutation, eq } from "@casella/db";
import { apiError, updateAssignmentSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getAssignmentById } from "@/lib/assignments/get-by-id";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "Niet ingelogd"),
        { status: 401 },
      ),
    } as const;
  }
  if (u.role !== "admin") {
    return {
      error: NextResponse.json(
        apiError("forbidden", "Geen toegang"),
        { status: 403 },
      ),
    } as const;
  }
  return { admin: u } as const;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      apiError("invalid_id", "Ongeldig toewijzings-ID"),
      { status: 400 },
    );
  }

  const assignment = await getAssignmentById(id);
  if (!assignment) {
    return NextResponse.json(
      apiError("not_found", "Toewijzing niet gevonden"),
      { status: 404 },
    );
  }
  return NextResponse.json(assignment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      apiError("invalid_id", "Ongeldig toewijzings-ID"),
      { status: 400 },
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
    input = updateAssignmentSchema.parse({
      ...(typeof body === "object" && body !== null ? body : {}),
      id,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const ifMatchHeader = req.headers.get("If-Match");

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(schema.projectAssignments)
      .where(eq(schema.projectAssignments.id, input.id));
    if (!before) return { kind: "not-found" } as const;

    if (ifMatchHeader) {
      const clientVersion = new Date(ifMatchHeader).getTime();
      const serverVersion = before.updatedAt.getTime();
      if (Number.isNaN(clientVersion) || clientVersion !== serverVersion) {
        await auditMutation(tx, {
          actorUserId: auth.admin.id,
          action: "assignments.update_conflict",
          resourceType: "project_assignments",
          resourceId: input.id,
          changesJson: {
            ifMatch: ifMatchHeader,
            currentUpdatedAt: before.updatedAt.toISOString(),
          },
        });
        return { kind: "conflict" } as const;
      }
    }

    const patch = {
      projectId:
        "projectId" in input && input.projectId
          ? input.projectId
          : before.projectId,
      employeeId:
        "employeeId" in input && input.employeeId
          ? input.employeeId
          : before.employeeId,
      startDate:
        "startDate" in input ? input.startDate ?? null : before.startDate,
      endDate: "endDate" in input ? input.endDate ?? null : before.endDate,
      kmRateCents:
        "kmRateCents" in input ? input.kmRateCents ?? null : before.kmRateCents,
      compensationType:
        "compensationType" in input
          ? input.compensationType ?? null
          : before.compensationType,
      updatedAt: new Date(),
    };

    await tx
      .update(schema.projectAssignments)
      .set(patch)
      .where(eq(schema.projectAssignments.id, input.id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "assignments.update",
      resourceType: "project_assignments",
      resourceId: input.id,
      changesJson: { before, patch },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return NextResponse.json(
      apiError("not_found", "Toewijzing niet gevonden"),
      { status: 404 },
    );
  }
  if (result.kind === "conflict") {
    return NextResponse.json(
      apiError(
        "version_conflict",
        "Een andere sessie heeft deze toewijzing aangepast — herlaad om verder te bewerken",
      ),
      { status: 409 },
    );
  }

  revalidatePath("/admin/toewijzingen");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      apiError("invalid_id", "Ongeldig toewijzings-ID"),
      { status: 400 },
    );
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(schema.projectAssignments)
      .where(eq(schema.projectAssignments.id, id));
    if (!before) return { kind: "not-found" } as const;

    // Hard-delete: project_assignments has no inbound FK (verified — no
    // other table references project_assignments.id). hour_entries link
    // to project + employee directly, not through assignments.
    await tx
      .delete(schema.projectAssignments)
      .where(eq(schema.projectAssignments.id, id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "assignments.delete",
      resourceType: "project_assignments",
      resourceId: id,
      changesJson: { before },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return NextResponse.json(
      apiError("not_found", "Toewijzing niet gevonden"),
      { status: 404 },
    );
  }

  revalidatePath("/admin/toewijzingen");
  return NextResponse.json({ ok: true });
}
