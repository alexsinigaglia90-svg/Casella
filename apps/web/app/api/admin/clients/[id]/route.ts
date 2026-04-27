import { getDb, schema, auditMutation, eq } from "@casella/db";
import { apiError, updateClientSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getClientById } from "@/lib/clients/get-by-id";
import { getCurrentUser } from "@/lib/current-user";
import { upsertAddress } from "@/lib/employees/upsert-address";

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
      apiError("invalid_id", "Ongeldig klant-ID"),
      { status: 400 },
    );
  }

  const client = await getClientById(id);
  if (!client) {
    return NextResponse.json(
      apiError("not_found", "Klant niet gevonden"),
      { status: 404 },
    );
  }
  return NextResponse.json(client);
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
      apiError("invalid_id", "Ongeldig klant-ID"),
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
    input = updateClientSchema.parse({
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
      .from(schema.clients)
      .where(eq(schema.clients.id, input.id));
    if (!before) return { kind: "not-found" } as const;

    // Optimistic concurrency: same pattern as employees.
    if (ifMatchHeader) {
      const clientVersion = new Date(ifMatchHeader).getTime();
      const serverVersion = before.updatedAt.getTime();
      if (Number.isNaN(clientVersion) || clientVersion !== serverVersion) {
        await auditMutation(tx, {
          actorUserId: auth.admin.id,
          action: "clients.update_conflict",
          resourceType: "clients",
          resourceId: input.id,
          changesJson: {
            ifMatch: ifMatchHeader,
            currentUpdatedAt: before.updatedAt.toISOString(),
          },
        });
        return { kind: "conflict" } as const;
      }
    }

    const addressId =
      "address" in input && input.address
        ? await upsertAddress(tx, input.address)
        : before.addressId;

    const patch = {
      name: "name" in input && input.name ? input.name : before.name,
      kvk: "kvk" in input ? input.kvk ?? null : before.kvk,
      contactName:
        "contactName" in input ? input.contactName ?? null : before.contactName,
      contactEmail:
        "contactEmail" in input ? input.contactEmail ?? null : before.contactEmail,
      contactPhone:
        "contactPhone" in input ? input.contactPhone ?? null : before.contactPhone,
      addressId,
      updatedAt: new Date(),
    };

    await tx
      .update(schema.clients)
      .set(patch)
      .where(eq(schema.clients.id, input.id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "clients.update",
      resourceType: "clients",
      resourceId: input.id,
      changesJson: { before, patch },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return NextResponse.json(
      apiError("not_found", "Klant niet gevonden"),
      { status: 404 },
    );
  }
  if (result.kind === "conflict") {
    return NextResponse.json(
      apiError(
        "version_conflict",
        "Een andere sessie heeft deze klant aangepast — herlaad om verder te bewerken",
      ),
      { status: 409 },
    );
  }

  revalidatePath("/admin/klanten");
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
      apiError("invalid_id", "Ongeldig klant-ID"),
      { status: 400 },
    );
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id));
    if (!before) return { kind: "not-found" } as const;
    if (before.archivedAt) return { kind: "already-archived" } as const;

    await tx
      .update(schema.clients)
      .set({ archivedAt: new Date() })
      .where(eq(schema.clients.id, id));

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "clients.archive",
      resourceType: "clients",
      resourceId: id,
      changesJson: { before },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return NextResponse.json(
      apiError("not_found", "Klant niet gevonden"),
      { status: 404 },
    );
  }
  if (result.kind === "already-archived") {
    return NextResponse.json(
      apiError("already_archived", "Klant is al gearchiveerd"),
      { status: 409 },
    );
  }

  revalidatePath("/admin/klanten");
  return NextResponse.json({ ok: true });
}
