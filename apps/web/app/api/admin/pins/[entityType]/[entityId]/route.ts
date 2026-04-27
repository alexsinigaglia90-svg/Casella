import { deletePin } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const VALID_ENTITY_TYPES = new Set(["employee"]);

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  const { entityType, entityId } = await params;
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    return NextResponse.json(apiError("not_found", "Onbekend entity-type"), {
      status: 404,
    });
  }

  await deletePin({ userId: admin.id, entityType, entityId });
  return NextResponse.json({ ok: true });
}
