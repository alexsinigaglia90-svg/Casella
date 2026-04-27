import { eq, getDb, listRecentAuditEvents, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  const events = await listRecentAuditEvents({ userId: admin.id, limit: 20 });

  const db = getDb();
  const [u] = await db
    .select({ lastSeenAuditAt: schema.users.lastSeenAuditAt })
    .from(schema.users)
    .where(eq(schema.users.id, admin.id))
    .limit(1);

  return NextResponse.json({
    events: events.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    lastSeenAt: u?.lastSeenAuditAt?.toISOString() ?? null,
  });
}
