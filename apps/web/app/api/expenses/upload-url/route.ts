// TODO: DEFERRED — EXPENSES-RECEIPT-UPLOAD (Fase 2)
// Replace stub with real Supabase Storage signed-URL when @supabase/supabase-js is installed
// and SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL are available in prod-env.
// See docs/casella-deferred-work.md section EXPENSES-RECEIPT-UPLOAD.
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  let filename = "file";
  try {
    const body = (await req.json()) as { filename?: string; contentType?: string };
    filename = body.filename ?? "file";
  } catch {
    // filename is optional
  }

  const path = `stub/${employee.id}/${crypto.randomUUID()}-${filename}`;

  return NextResponse.json({
    skipped: "supabase_storage_not_configured",
    path,
  });
}
