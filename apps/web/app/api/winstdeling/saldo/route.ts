import { eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export async function GET() {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.carePackageLedger)
    .where(eq(schema.carePackageLedger.employeeId, employee.id))
    .orderBy(schema.carePackageLedger.year);

  const companies: Record<
    "ascentra" | "operis" | "astra",
    {
      annualDistributions: typeof rows;
      exitPayouts: typeof rows;
    }
  > = {
    ascentra: { annualDistributions: [], exitPayouts: [] },
    operis: { annualDistributions: [], exitPayouts: [] },
    astra: { annualDistributions: [], exitPayouts: [] },
  };

  for (const row of rows) {
    const bucket = companies[row.company];
    if (!bucket) continue;
    if (row.type === "annual_distribution") bucket.annualDistributions.push(row);
    else if (row.type === "exit_payout") bucket.exitPayouts.push(row);
  }

  return NextResponse.json({ companies });
}
