import { and, desc, eq, getDb, gte, lte, schema, sql } from "@casella/db";
import { redirect } from "next/navigation";

import { BonusHero } from "@/features/bonus/employee/bonus-hero";
import type { BonusHistoryRow } from "@/features/bonus/employee/bonus-history";
import { BonusProjects } from "@/features/bonus/employee/bonus-projects";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function BonusPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const year = new Date().getUTCFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year}-12-31T23:59:59Z`);

  const aggRows = await db
    .select({
      type: schema.bonusLedger.type,
      total: sql<string>`SUM(${schema.bonusLedger.amountCents})`,
    })
    .from(schema.bonusLedger)
    .where(
      and(
        eq(schema.bonusLedger.employeeId, employee.id),
        gte(schema.bonusLedger.createdAt, yearStart),
        lte(schema.bonusLedger.createdAt, yearEnd),
      ),
    )
    .groupBy(schema.bonusLedger.type);

  let ytdAccrualCents = 0;
  let ytdAdjustmentCents = 0;
  let ytdPaidCents = 0;
  for (const row of aggRows) {
    const total = parseInt(row.total ?? "0", 10);
    if (row.type === "accrual") ytdAccrualCents = total;
    else if (row.type === "adjustment") ytdAdjustmentCents = total;
    else if (row.type === "payout") ytdPaidCents = Math.abs(total);
  }
  const totalEarned = ytdAccrualCents + ytdAdjustmentCents;
  const outstandingCents = totalEarned - ytdPaidCents;

  // Placeholder target. Echte target volgt uit BONUS-TARGET-AND-HISTORICAL-COMPARE
  // (zie deferred-work). Wordt nu afgeleid uit (paid + outstanding + 5000 EUR buffer)
  // als minimale rationale, valt terug op 500000 (€5k) als alles 0 is.
  const targetCents = Math.max(500_000, totalEarned + 500_000);

  const history = await db
    .select({
      id: schema.bonusLedger.id,
      period: schema.bonusLedger.period,
      type: schema.bonusLedger.type,
      amountCents: schema.bonusLedger.amountCents,
      description: schema.bonusLedger.description,
      projectId: schema.bonusLedger.projectId,
      createdAt: schema.bonusLedger.createdAt,
    })
    .from(schema.bonusLedger)
    .where(eq(schema.bonusLedger.employeeId, employee.id))
    .orderBy(desc(schema.bonusLedger.createdAt))
    .limit(100);

  const projectIds = [
    ...new Set(history.filter((r) => r.projectId).map((r) => r.projectId!)),
  ];
  const projectMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const projects = await db
      .select({ id: schema.projects.id, name: schema.projects.name })
      .from(schema.projects);
    for (const p of projects) projectMap.set(p.id, p.name);
  }

  const rows: BonusHistoryRow[] = history.map((r) => ({
    id: r.id,
    period: r.period,
    type: r.type,
    amountCents: r.amountCents,
    description: r.description,
    projectName: r.projectId ? (projectMap.get(r.projectId) ?? null) : null,
    createdAt: r.createdAt.toISOString(),
  }));

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
          Mijn account · Bonus
        </div>
        <BonusHero
          year={year}
          totalEarnedCents={totalEarned}
          ytdPaidCents={ytdPaidCents}
          outstandingCents={outstandingCents}
          targetCents={targetCents}
        />
      </div>

      <BonusProjects rows={rows} />
    </div>
  );
}
