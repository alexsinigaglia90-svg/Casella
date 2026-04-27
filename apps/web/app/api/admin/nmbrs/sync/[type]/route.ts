import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import {
  pullEmployees,
  pushApprovedHours,
  pushApprovedLeave,
  type SyncRunResult,
} from "@/lib/nmbrs/sync";

export const dynamic = "force-dynamic";

const VALID = new Set(["employees", "hours", "leave"]);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }
  if (admin.role !== "admin") {
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });
  }

  const { type } = await params;
  if (!VALID.has(type)) {
    return NextResponse.json(
      apiError("invalid_type", "Ongeldig sync-type"),
      { status: 400 },
    );
  }

  let result: SyncRunResult;
  if (type === "employees") {
    result = await pullEmployees(admin.id);
  } else if (type === "hours") {
    result = await pushApprovedHours(admin.id);
  } else {
    result = await pushApprovedLeave(admin.id);
  }

  return NextResponse.json(result);
}
