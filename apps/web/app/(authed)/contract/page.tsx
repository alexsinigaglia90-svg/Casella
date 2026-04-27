import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import {
  ContractTimeline,
  type ContractTimelineItem,
} from "@/features/contracts/employee/contract-timeline";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function ContractPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const contracts = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.employeeId, employee.id))
    .orderBy(desc(schema.contracts.startDate));

  const items: ContractTimelineItem[] = contracts.map((c) => ({
    id: c.id,
    startDate: c.startDate,
    endDate: c.endDate,
    jobTitle: c.jobTitle,
    brutoSalarisMaandCents: c.brutoSalarisMaandCents,
    pdfStoragePath: c.pdfStoragePath,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Mijn contract
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Overzicht van je contracten. Klik op &ldquo;Download PDF&rdquo; om een contract te bekijken.
        </p>
      </header>

      <ContractTimeline items={items} />
    </div>
  );
}
