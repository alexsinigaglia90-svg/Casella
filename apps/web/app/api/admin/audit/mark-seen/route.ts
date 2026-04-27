import { eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  const db = getDb();
  await db
    .update(schema.users)
    .set({ lastSeenAuditAt: new Date() })
    .where(eq(schema.users.id, admin.id));
  return NextResponse.json({ ok: true });
}
