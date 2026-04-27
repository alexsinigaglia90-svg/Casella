import { getDb, schema, auditMutation } from "@casella/db";
import { apiError, createClientSchema } from "@casella/types";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { upsertAddress } from "@/lib/employees/upsert-address";

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
    input = createClientSchema.parse(body);
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
    const addressId = await upsertAddress(tx, input.address);
    const [created] = await tx
      .insert(schema.clients)
      .values({
        name: input.name,
        kvk: input.kvk ?? null,
        contactName: input.contactName ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        addressId,
      })
      .returning({ id: schema.clients.id });

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "clients.create",
      resourceType: "clients",
      resourceId: created!.id,
      changesJson: {
        input: {
          ...input,
          address: { fullDisplay: input.address.fullDisplay },
        },
      },
    });

    return created!.id;
  });

  revalidatePath("/admin/klanten");
  return NextResponse.json({ id: result }, { status: 201 });
}
