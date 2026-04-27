import { and, eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // Own-notification guard
  const rows = await db
    .select({ id: schema.notifications.id, readAt: schema.notifications.readAt })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, user.id),
      ),
    )
    .limit(1);

  if (!rows[0]) {
    return NextResponse.json(apiError("not_found", "Melding niet gevonden"), { status: 404 });
  }

  if (!rows[0].readAt) {
    await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(eq(schema.notifications.id, id));
  }

  return NextResponse.json({ ok: true });
}
