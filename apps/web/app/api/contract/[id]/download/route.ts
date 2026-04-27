import { and, eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  const { id } = await params;
  const db = getDb();

  const rows = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.id, id))
    .limit(1);
  const contract = rows[0];

  if (!contract) {
    return NextResponse.json(
      apiError("not_found", "Contract niet gevonden"),
      { status: 404 },
    );
  }

  // Admin can download any; employee can only download own contracts
  if (user.role !== "admin") {
    const employee = await getCurrentEmployee();
    if (!employee || employee.id !== contract.employeeId) {
      return NextResponse.json(
        apiError("forbidden", "Geen toegang tot dit contract"),
        { status: 403 },
      );
    }
  }

  // Stub: redirect to storage path. In Fase 2 this will be a signed URL from Supabase Storage.
  return NextResponse.redirect(contract.pdfStoragePath);
}
