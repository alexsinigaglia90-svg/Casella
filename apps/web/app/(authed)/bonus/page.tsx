import { and, desc, eq, getDb, gte, lte, schema, sql } from "@casella/db";
import { redirect } from "next/navigation";

import {
  BonusHistory,
  type BonusHistoryRow,
} from "@/features/bonus/employee/bonus-history";
import { BonusSummary } from "@/features/bonus/employee/bonus-summary";
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
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Mijn bonus
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Overzicht van je opgebouwde en uitbetaalde bonus dit jaar.
        </p>
      </header>

      <BonusSummary
        year={year}
        ytdAccrualCents={totalEarned}
        ytdPaidCents={ytdPaidCents}
        outstandingCents={outstandingCents}
      />

      <section className="space-y-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Historie
        </h2>
        <BonusHistory rows={rows} />
      </section>
    </div>
  );
}
