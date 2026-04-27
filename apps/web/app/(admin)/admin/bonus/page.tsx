import { and, eq, getDb, gte, lte, schema, sql } from "@casella/db";
import { redirect } from "next/navigation";

import {
  EmployeeBonusOverview,
  type EmployeeBonusRow,
} from "@/features/bonus/admin/employee-bonus-overview";
import { BonusConfigForm } from "@/features/bonus/admin/bonus-config-form";
import { OverperformanceForm } from "@/features/bonus/admin/overperformance-form";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminBonusPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const year = new Date().getUTCFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Per-employee aggregates for current year.
  const employees = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.employees.employmentStatus, "active"))
    .orderBy(schema.employees.firstName);

  const aggregates = await db
    .select({
      employeeId: schema.bonusLedger.employeeId,
      type: schema.bonusLedger.type,
      total: sql<string>`SUM(${schema.bonusLedger.amountCents})`,
    })
    .from(schema.bonusLedger)
    .where(
      and(
        gte(schema.bonusLedger.createdAt, new Date(yearStart)),
        lte(schema.bonusLedger.createdAt, new Date(`${yearEnd}T23:59:59Z`)),
      ),
    )
    .groupBy(schema.bonusLedger.employeeId, schema.bonusLedger.type);

  const accrualMap = new Map<string, number>();
  const paidMap = new Map<string, number>();
  const adjMap = new Map<string, number>();
  for (const row of aggregates) {
    const total = parseInt(row.total ?? "0", 10);
    if (row.type === "accrual") accrualMap.set(row.employeeId, total);
    else if (row.type === "payout") paidMap.set(row.employeeId, total);
    else if (row.type === "adjustment") adjMap.set(row.employeeId, total);
  }

  const rows: EmployeeBonusRow[] = employees.map((e) => {
    const accrual = accrualMap.get(e.id) ?? 0;
    const adjustment = adjMap.get(e.id) ?? 0;
    const paid = paidMap.get(e.id) ?? 0;
    const totalEarned = accrual + adjustment;
    return {
      employeeId: e.id,
      fullName:
        e.displayName ??
        (e.firstName ? `${e.firstName} ${e.lastName ?? ""}`.trim() : e.id),
      ytdAccrualCents: totalEarned,
      ytdPaidCents: Math.abs(paid),
      outstandingCents: totalEarned - Math.abs(paid),
    };
  });

  const employeeOpts = employees.map((e) => ({
    id: e.id,
    fullName:
      e.displayName ??
      (e.firstName ? `${e.firstName} ${e.lastName ?? ""}`.trim() : e.id),
  }));

  // Existing bonus_config for this year.
  const cfgRows = await db
    .select()
    .from(schema.bonusConfig)
    .where(eq(schema.bonusConfig.year, year))
    .limit(1);
  const cfg = cfgRows[0];
  const initialWerkgeverslastenPct = cfg
    ? parseFloat(cfg.werkgeverslastenPct)
    : 30;
  const initialIndirecteKostenPerMaand = cfg
    ? parseFloat(cfg.indirecteKostenPerMaand)
    : 500;
  const initialWerkbareUrenPerMaand = cfg ? cfg.werkbareUrenPerMaand : 168;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Bonus-beheer
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Overzicht per medewerker, formule-config en handmatige adjustments.
        </p>
      </header>

      <section className="space-y-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Per medewerker — {year}
        </h2>
        <EmployeeBonusOverview rows={rows} />
      </section>

      <section className="space-y-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Bonus-config
        </h2>
        <BonusConfigForm
          initialYear={year}
          initialWerkgeverslastenPct={initialWerkgeverslastenPct}
          initialIndirecteKostenPerMaand={initialIndirecteKostenPerMaand}
          initialWerkbareUrenPerMaand={initialWerkbareUrenPerMaand}
        />
      </section>

      <section className="space-y-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Over-performance addendum
        </h2>
        <OverperformanceForm employees={employeeOpts} />
      </section>
    </div>
  );
}
