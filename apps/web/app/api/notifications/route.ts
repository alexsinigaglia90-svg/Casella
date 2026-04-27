import { desc, eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const db = getDb();
  const notifications = await db
    .select({
      id: schema.notifications.id,
      type: schema.notifications.type,
      payloadJson: schema.notifications.payloadJson,
      readAt: schema.notifications.readAt,
      createdAt: schema.notifications.createdAt,
    })
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, user.id))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(50);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      payloadJson: n.payloadJson,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
