import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { ContractPassport } from "@/features/contracts/employee/contract-passport";
import { ContractSections } from "@/features/contracts/employee/contract-sections";
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

  const activeContract = contracts.find((c) => c.endDate == null) ?? contracts[0] ?? null;

  // Manager naam ophalen (best-effort, niet kritisch voor weergave)
  let managerName: string | null = null;
  if (employee.managerId) {
    const managerRows = await db
      .select({ displayName: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.id, employee.managerId))
      .limit(1);
    managerName = managerRows[0]?.displayName ?? null;
  }

  const employeeStartDate =
    employee.startDate ?? activeContract?.startDate ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-12 p-6">
      <div>
        <div
          className="mb-3 font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "var(--fg-tertiary)",
          }}
        >
          Mijn account · Contract
        </div>

        {activeContract ? (
          <ContractPassport
            firstName={employee.firstName ?? "Medewerker"}
            lastName={employee.lastName ?? ""}
            jobTitle={activeContract.jobTitle}
            team={null}
            startDate={activeContract.startDate}
            endDate={activeContract.endDate}
            hoursPerWeek={employee.contractedHoursPerWeek ?? 40}
            managerName={managerName}
            contractStartDate={employeeStartDate ?? activeContract.startDate}
          />
        ) : (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--fg-tertiary)",
            }}
          >
            Nog geen contract beschikbaar.
          </div>
        )}
      </div>

      {activeContract && (
        <ContractSections
          contract={{
            startDate: activeContract.startDate,
            endDate: activeContract.endDate,
            hoursPerWeek: employee.contractedHoursPerWeek ?? 40,
            brutoSalarisMaandCents: activeContract.brutoSalarisMaandCents,
            vakantietoeslagPct: activeContract.vakantietoeslagPct,
            baselineTariefPerUur: activeContract.baselineTariefPerUur,
            bonusPctBelowBaseline: activeContract.bonusPctBelowBaseline,
            bonusPctAboveBaseline: activeContract.bonusPctAboveBaseline,
            maxOverperformancePct: activeContract.maxOverperformancePct,
            autoStelpostActief: activeContract.autoStelpostActief,
            autoStelpostBedragMaand: activeContract.autoStelpostBedragMaand,
          }}
          defaultKmRateCents={employee.defaultKmRateCents}
        />
      )}

      <ContractTimeline items={items} />
    </div>
  );
}
