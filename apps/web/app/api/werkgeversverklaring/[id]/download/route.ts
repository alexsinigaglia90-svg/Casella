import { eq, getDb, schema } from "@casella/db";
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
    .from(schema.employerStatements)
    .where(eq(schema.employerStatements.id, id))
    .limit(1);
  const stmt = rows[0];
  if (!stmt) {
    return NextResponse.json(
      apiError("not_found", "Werkgeversverklaring niet gevonden"),
      { status: 404 },
    );
  }

  if (user.role !== "admin") {
    const employee = await getCurrentEmployee();
    if (!employee || employee.id !== stmt.employeeId) {
      return NextResponse.json(
        apiError("forbidden", "Geen toegang"),
        { status: 403 },
      );
    }
  }

  if (!stmt.generatedPdfPath) {
    return NextResponse.json(
      apiError("not_found", "PDF niet beschikbaar"),
      { status: 404 },
    );
  }

  // STATEMENTS-STORAGE-MIGRATION: generatedPdfPath stores base64 (stub) in Fase 1.6.
  // Real Supabase Storage path comes in Fase 2. Heuristic: base64 strings have no '/'.
  if (stmt.generatedPdfPath.includes("/")) {
    return NextResponse.redirect(stmt.generatedPdfPath);
  }

  const buffer = Buffer.from(stmt.generatedPdfPath, "base64");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="werkgeversverklaring-${id}.pdf"`,
    },
  });
}
