import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { listPendingApprovals } from "@/lib/hours/queries";

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

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const rows = await listPendingApprovals();
  return NextResponse.json(rows);
}
