import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { sendRemindersForWeek } from "@/lib/reminders/send-week";

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

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart") ?? undefined;
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  const result = await sendRemindersForWeek(weekStart, appUrl);
  return NextResponse.json(result);
}
