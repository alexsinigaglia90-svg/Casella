import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

/** Returns a 401 response if CRON_SECRET header mismatch, null otherwise. */
export function checkCronSecret(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json(
      apiError("forbidden", "Cron secret mismatch"),
      { status: 401 },
    );
  }
  return null;
}
