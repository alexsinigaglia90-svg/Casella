import { eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import {
  WinstdelingSummary,
  type CarePackageData,
  type CarePackageRow,
} from "@/features/care-package/employee/winstdeling-summary";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function WinstdelingPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.carePackageLedger)
    .where(eq(schema.carePackageLedger.employeeId, employee.id))
    .orderBy(schema.carePackageLedger.year);

  const data: CarePackageData = {
    ascentra: { annualDistributions: [], exitPayouts: [] },
    operis: { annualDistributions: [], exitPayouts: [] },
    astra: { annualDistributions: [], exitPayouts: [] },
  };

  for (const row of rows) {
    const item: CarePackageRow = {
      id: row.id,
      type: row.type,
      year: row.year,
      amountCents: row.amountCents,
      transactionRef: row.transactionRef,
    };
    const bucket = data[row.company];
    if (!bucket) continue;
    if (row.type === "annual_distribution") bucket.annualDistributions.push(item);
    else if (row.type === "exit_payout") bucket.exitPayouts.push(item);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Winstdeling (Care Package)
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Per vennootschap je jaarlijkse verdeling en exit-payouts.
        </p>
      </header>

      <WinstdelingSummary data={data} />
    </div>
  );
}
