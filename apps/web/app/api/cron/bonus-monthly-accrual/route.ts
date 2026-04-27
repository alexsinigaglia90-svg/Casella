import { and, asc, desc, eq, getDb, gte, lte, schema, sql } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { computeMonthlyBonus, determineApplicablePct } from "@/lib/bonus/formula";
import { workingHoursInMonth } from "@/lib/bonus/working-hours-calendar";

export const dynamic = "force-dynamic";

const MAX_BACKFILL_MONTHS = 12;

interface MonthRef {
  year: number;
  month: number; // 1..12
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function periodKey(m: MonthRef): string {
  return `${m.year}-${pad2(m.month)}`;
}

function monthStart(m: MonthRef): string {
  return `${m.year}-${pad2(m.month)}-01`;
}

function monthEnd(m: MonthRef): string {
  const last = new Date(Date.UTC(m.year, m.month, 0)).getUTCDate();
  return `${m.year}-${pad2(m.month)}-${pad2(last)}`;
}

function nextMonth(m: MonthRef): MonthRef {
  return m.month === 12
    ? { year: m.year + 1, month: 1 }
    : { year: m.year, month: m.month + 1 };
}

function previousMonth(m: MonthRef): MonthRef {
  return m.month === 1
    ? { year: m.year - 1, month: 12 }
    : { year: m.year, month: m.month - 1 };
}

function compareMonth(a: MonthRef, b: MonthRef): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const expected = cronSecret ? `Bearer ${cronSecret}` : null;
  if (!expected || authHeader !== expected) {
    return NextResponse.json(
      apiError("unauthenticated", "Ongeldige cron-secret"),
      { status: 401 },
    );
  }

  const db = getDb();
  const now = new Date();
  const currentRef: MonthRef = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
  // Process up to (and including) previous month — never accrue current month.
  const upperBound = previousMonth(currentRef);

  // Fetch active employees with active contract.
  const employees = await db
    .select({
      employeeId: schema.employees.id,
      contractedHoursPerWeek: schema.employees.contractedHoursPerWeek,
    })
    .from(schema.employees)
    .where(eq(schema.employees.employmentStatus, "active"));

  let processedEmployees = 0;
  let recordsInserted = 0;

  for (const emp of employees) {
    // Find latest active contract (no endDate, or endDate >= today).
    const todayIso = `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`;
    const contractRows = await db
      .select()
      .from(schema.contracts)
      .where(eq(schema.contracts.employeeId, emp.employeeId))
      .orderBy(desc(schema.contracts.startDate))
      .limit(1);
    const contract = contractRows[0];
    if (!contract) continue;
    if (contract.endDate && contract.endDate < todayIso) continue;
    if (!contract.brutoSalarisMaandCents) continue;

    processedEmployees++;

    // Find latest accrual record to determine starting month.
    const lastAccrual = await db
      .select({
        bonusPeriodEnd: schema.bonusLedger.bonusPeriodEnd,
        period: schema.bonusLedger.period,
      })
      .from(schema.bonusLedger)
      .where(
        and(
          eq(schema.bonusLedger.employeeId, emp.employeeId),
          eq(schema.bonusLedger.type, "accrual"),
        ),
      )
      .orderBy(desc(schema.bonusLedger.bonusPeriodEnd))
      .limit(1);

    let startMonth: MonthRef;
    if (lastAccrual[0]?.bonusPeriodEnd) {
      const last = lastAccrual[0].bonusPeriodEnd;
      const parts = last.split("-");
      const lastMonth: MonthRef = {
        year: parseInt(parts[0] ?? "0", 10),
        month: parseInt(parts[1] ?? "0", 10),
      };
      startMonth = nextMonth(lastMonth);
    } else {
      // Backfill at most MAX_BACKFILL_MONTHS prior to upperBound.
      let candidate = upperBound;
      for (let i = 0; i < MAX_BACKFILL_MONTHS - 1; i++) {
        candidate = previousMonth(candidate);
      }
      startMonth = candidate;
    }

    // Walk months from startMonth through upperBound (max 12 iterations).
    let cursor = startMonth;
    let iter = 0;
    while (compareMonth(cursor, upperBound) <= 0 && iter < MAX_BACKFILL_MONTHS) {
      iter++;
      const periodStart = monthStart(cursor);
      const periodEnd = monthEnd(cursor);
      const period = periodKey(cursor);

      // Approved hours per project in this month.
      const hourRows = await db
        .select({
          projectId: schema.hourEntries.projectId,
          totalHours: sql<string>`SUM(${schema.hourEntries.hours})`,
        })
        .from(schema.hourEntries)
        .where(
          and(
            eq(schema.hourEntries.employeeId, emp.employeeId),
            eq(schema.hourEntries.status, "approved"),
            gte(schema.hourEntries.workDate, periodStart),
            lte(schema.hourEntries.workDate, periodEnd),
          ),
        )
        .groupBy(schema.hourEntries.projectId);

      const approvedHoursPerProject = new Map<string, number>();
      const projectIds: string[] = [];
      for (const row of hourRows) {
        const hours = parseFloat(row.totalHours);
        if (!Number.isFinite(hours) || hours <= 0) continue;
        approvedHoursPerProject.set(row.projectId, hours);
        projectIds.push(row.projectId);
      }

      // Project rates.
      const projectRates = new Map<string, number>();
      if (projectIds.length > 0) {
        const projects = await db
          .select({
            id: schema.projects.id,
            hourlyRateExclBtw: schema.projects.hourlyRateExclBtw,
          })
          .from(schema.projects);
        for (const p of projects) {
          if (!p.hourlyRateExclBtw) {
            if (approvedHoursPerProject.has(p.id)) {
              console.log("bonus accrual: skipping project without rate", {
                projectId: p.id,
                period,
              });
              approvedHoursPerProject.delete(p.id);
            }
            continue;
          }
          projectRates.set(p.id, parseFloat(p.hourlyRateExclBtw));
        }
      }

      // bonus_config voor jaar (default als ontbreekt).
      const cfgRows = await db
        .select()
        .from(schema.bonusConfig)
        .where(eq(schema.bonusConfig.year, cursor.year))
        .limit(1);
      const cfg = cfgRows[0];
      const werkgeverslastenPct = cfg ? parseFloat(cfg.werkgeverslastenPct) : 30;
      const indirecteKostenEur = cfg
        ? parseFloat(cfg.indirecteKostenPerMaand)
        : 500;
      const indirecteKostenPerMaandCents = Math.round(indirecteKostenEur * 100);

      const brutoSalarisEur = parseFloat(contract.brutoSalarisMaandCents);
      const brutoSalarisMaandCents = Math.round(brutoSalarisEur);
      const vakantietoeslagPctYearly = contract.vakantietoeslagPct
        ? parseFloat(contract.vakantietoeslagPct)
        : 8;
      const baselineTariefPerUur = contract.baselineTariefPerUur
        ? parseFloat(contract.baselineTariefPerUur)
        : 75;
      const bonusPctBelowBaseline = contract.bonusPctBelowBaseline
        ? parseFloat(contract.bonusPctBelowBaseline)
        : 10;
      const bonusPctAboveBaseline = contract.bonusPctAboveBaseline
        ? parseFloat(contract.bonusPctAboveBaseline)
        : 15;
      const autoStelpostMaandCents =
        contract.autoStelpostActief && contract.autoStelpostBedragMaand
          ? Math.round(parseFloat(contract.autoStelpostBedragMaand) * 100)
          : 0;

      const workingHoursThisMonth = workingHoursInMonth(
        cursor.year,
        cursor.month,
        emp.contractedHoursPerWeek,
      );

      const result = computeMonthlyBonus({
        approvedHoursPerProject,
        projectRates,
        brutoSalarisMaandCents,
        vakantietoeslagPctYearly,
        werkgeverslastenPct,
        indirecteKostenPerMaandCents,
        autoStelpostMaandCents,
        baselineTariefPerUur,
        workingHoursThisMonth,
      });

      // Count qualified accruals in last 12 months prior to this period.
      const twelveBack: MonthRef = (() => {
        let m = cursor;
        for (let i = 0; i < 12; i++) m = previousMonth(m);
        return m;
      })();
      const priorAccruals = await db
        .select({
          period: schema.bonusLedger.period,
          pctApplied: schema.bonusLedger.pctApplied,
          amountCents: schema.bonusLedger.amountCents,
        })
        .from(schema.bonusLedger)
        .where(
          and(
            eq(schema.bonusLedger.employeeId, emp.employeeId),
            eq(schema.bonusLedger.type, "accrual"),
            gte(schema.bonusLedger.bonusPeriodStart, monthStart(twelveBack)),
            lte(schema.bonusLedger.bonusPeriodEnd, monthEnd(previousMonth(cursor))),
          ),
        )
        .orderBy(asc(schema.bonusLedger.bonusPeriodStart));

      // A qualified month = an accrual with amount > 0 (i.e. baseline hit).
      const qualifiedMonthsLast12 = priorAccruals.filter(
        (r) => r.amountCents > 0,
      ).length;

      const applicablePct = determineApplicablePct(
        qualifiedMonthsLast12,
        bonusPctBelowBaseline,
        bonusPctAboveBaseline,
      );

      let amountCents = 0;
      if (result.qualifiesForBaseline) {
        amountCents = Math.max(
          0,
          Math.round((result.nettowinstCents * applicablePct) / 100),
        );
      }

      await db.insert(schema.bonusLedger).values({
        employeeId: emp.employeeId,
        period,
        amountCents,
        type: "accrual",
        description: `Auto-accrual ${period}`,
        bonusPeriodStart: periodStart,
        bonusPeriodEnd: periodEnd,
        pctApplied: String(applicablePct),
      });
      recordsInserted++;

      cursor = nextMonth(cursor);
    }
  }

  return NextResponse.json({ ok: true, processedEmployees, recordsInserted });
}
