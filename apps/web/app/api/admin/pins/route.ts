import { createPin, listUserPins } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const PinBodySchema = z.object({
  entityType: z.literal("employee"),
  entityId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const pins = await listUserPins({
    userId: admin.id,
    entityType: entityType ?? undefined,
  });
  return NextResponse.json(
    pins.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  );
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError("invalid_json", "Ongeldig JSON-formaat"),
      { status: 400 },
    );
  }

  let input: z.infer<typeof PinBodySchema>;
  try {
    input = PinBodySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    throw err;
  }

  await createPin({
    userId: admin.id,
    entityType: input.entityType,
    entityId: input.entityId,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
