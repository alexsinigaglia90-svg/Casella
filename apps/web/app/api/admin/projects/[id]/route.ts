import { getDb, schema, auditMutation, eq, sql } from "@casella/db";
import { apiError, updateProjectSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { getProjectById } from "@/lib/projects/get-by-id";

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
      apiError("invalid_id", "Ongeldig project-ID"),
      { status: 400 },
    );
  }

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json(
      apiError("not_found", "Project niet gevonden"),
      { status: 404 },
    );
  }
  return NextResponse.json(project);
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
      apiError("invalid_id", "Ongeldig project-ID"),
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
    input = updateProjectSchema.parse({
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
      .from(schema.projects)
      .where(eq(schema.projects.id, input.id));
    if (!before) return { kind: "not-found" } as const;

    // Optimistic concurrency: same pattern as clients.
    if (ifMatchHeader) {
      const clientVersion = new Date(ifMatchHeader).getTime();
      const serverVersion = before.updatedAt.getTime();
      if (Number.isNaN(clientVersion) || clientVersion !== serverVersion) {
        await auditMutation(tx, {
          actorUserId: auth.admin.id,
          action: "projects.update_conflict",
          resourceType: "projects",
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
      clientId: "clientId" in input && input.clientId ? input.clientId : before.clientId,
      name: "name" in input && input.name ? input.name : before.name,
      description:
        "description" in input ? input.description ?? null : before.description,
      startDate:
        "startDate" in input ? input.startDate ?? null : before.startDate,
      endDate: "endDate" in input ? input.endDate ?? null : before.endDate,
      status: "status" in input && input.status ? input.status : before.status,
      updatedAt: new Date(),
    };

    await tx
      .update(schema.projects)
      .set(patch)
      .where(eq(schema.projects.id, input.id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "projects.update",
      resourceType: "projects",
      resourceId: input.id,
      changesJson: { before, patch },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return NextResponse.json(
      apiError("not_found", "Project niet gevonden"),
      { status: 404 },
    );
  }
  if (result.kind === "conflict") {
    return NextResponse.json(
      apiError(
        "version_conflict",
        "Een andere sessie heeft dit project aangepast — herlaad om verder te bewerken",
      ),
      { status: 409 },
    );
  }

  revalidatePath("/admin/projecten");
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
      apiError("invalid_id", "Ongeldig project-ID"),
      { status: 400 },
    );
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id));
    if (!before) return { kind: "not-found" } as const;

    // hour_entries.project_id ON DELETE RESTRICT — refuse hard-delete if any
    // hours reference this project. Admins should set status='cancelled'
    // instead. Project_assignments cascade automatically.
    const hoursCount = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.hourEntries)
      .where(eq(schema.hourEntries.projectId, id));
    const total = Number(hoursCount[0]?.count ?? 0);
    if (total > 0) return { kind: "has-hours", total } as const;

    await tx.delete(schema.projects).where(eq(schema.projects.id, id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "projects.delete",
      resourceType: "projects",
      resourceId: id,
      changesJson: { before },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return NextResponse.json(
      apiError("not_found", "Project niet gevonden"),
      { status: 404 },
    );
  }
  if (result.kind === "has-hours") {
    return NextResponse.json(
      apiError(
        "project_has_hours",
        "Project heeft geregistreerde uren — annuleer in plaats van verwijderen",
      ),
      { status: 409 },
    );
  }

  revalidatePath("/admin/projecten");
  return NextResponse.json({ ok: true });
}
