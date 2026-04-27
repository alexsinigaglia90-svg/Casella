import { and, desc, eq, getDb, gt, schema, sql } from "@casella/db";
import { redirect } from "next/navigation";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getLeaveBalances } from "@/lib/leave/balance";
import { HeroCard } from "@/features/dashboard/hero-card";
import { BalanceStrip } from "@/features/dashboard/balance-strip";
import { ActionStrip } from "@/features/dashboard/action-strip";
import { DocumentsSection } from "@/features/dashboard/documents-section";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/onboarding-pending");

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const currentYear = new Date().getUTCFullYear();

  const [activeAssignments, balances, bonusRows, leaveRejectedRows, expenseRejectedRows, hoursRejectedRows, latestStatementRows] =
    await Promise.all([
      // Active assignments
      db
        .select({
          id: schema.projectAssignments.id,
          projectName: schema.projects.name,
        })
        .from(schema.projectAssignments)
        .leftJoin(schema.projects, eq(schema.projects.id, schema.projectAssignments.projectId))
        .where(
          and(
            eq(schema.projectAssignments.employeeId, employee.id),
            sql`(${schema.projectAssignments.startDate} IS NULL OR ${schema.projectAssignments.startDate} <= ${today})`,
            sql`(${schema.projectAssignments.endDate} IS NULL OR ${schema.projectAssignments.endDate} >= ${today})`,
          ),
        )
        .limit(3),

      // Leave balances
      getLeaveBalances(employee.id),

      // Bonus YTD
      db
        .select({ amountCents: schema.bonusLedger.amountCents })
        .from(schema.bonusLedger)
        .where(
          and(
            eq(schema.bonusLedger.employeeId, employee.id),
            eq(schema.bonusLedger.type, "accrual"),
            sql`EXTRACT(YEAR FROM ${schema.bonusLedger.createdAt}) = ${currentYear}`,
          ),
        ),

      // Leave rejected last 30d
      db
        .select({ id: schema.leaveRequests.id })
        .from(schema.leaveRequests)
        .where(
          and(
            eq(schema.leaveRequests.employeeId, employee.id),
            eq(schema.leaveRequests.status, "rejected"),
            gt(schema.leaveRequests.createdAt, thirtyDaysAgo),
          ),
        ),

      // Expenses rejected last 30d
      db
        .select({ id: schema.expenseClaims.id })
        .from(schema.expenseClaims)
        .where(
          and(
            eq(schema.expenseClaims.employeeId, employee.id),
            eq(schema.expenseClaims.status, "rejected"),
            gt(schema.expenseClaims.submittedAt, thirtyDaysAgo),
          ),
        ),

      // Hours rejected last 30d
      db
        .select({ id: schema.hourEntries.id })
        .from(schema.hourEntries)
        .where(
          and(
            eq(schema.hourEntries.employeeId, employee.id),
            eq(schema.hourEntries.status, "rejected"),
            gt(schema.hourEntries.submittedAt, thirtyDaysAgo),
          ),
        ),

      // Latest delivered employer statement
      db
        .select({
          id: schema.employerStatements.id,
          purpose: schema.employerStatements.purpose,
          createdAt: schema.employerStatements.requestedAt,
        })
        .from(schema.employerStatements)
        .where(
          and(
            eq(schema.employerStatements.employeeId, employee.id),
            eq(schema.employerStatements.status, "delivered"),
          ),
        )
        .orderBy(desc(schema.employerStatements.requestedAt))
        .limit(1),
    ]);

  const assignments = activeAssignments.map((a) => ({
    id: a.id,
    projectName: a.projectName ?? "Onbekend project",
  }));

  const vacationBalance = balances["vacation_legal"];
  const vacationHoursRemaining = vacationBalance?.hoursRemaining ?? null;

  const bonusYtdCents = bonusRows.reduce((sum, r) => sum + r.amountCents, 0);

  const openItems: { label: string; href: string }[] = [];
  if (leaveRejectedRows.length > 0) {
    openItems.push({
      label: `${leaveRejectedRows.length} verlofverzoek${leaveRejectedRows.length === 1 ? "" : "en"} afgewezen`,
      href: "/verlof",
    });
  }
  if (expenseRejectedRows.length > 0) {
    openItems.push({
      label: `${expenseRejectedRows.length} declaratie${expenseRejectedRows.length === 1 ? "" : "s"} afgewezen`,
      href: "/declaraties",
    });
  }
  if (hoursRejectedRows.length > 0) {
    openItems.push({
      label: `${hoursRejectedRows.length} uren-${hoursRejectedRows.length === 1 ? "entry" : "entries"} afgewezen`,
      href: "/uren",
    });
  }

  const latestStatement = latestStatementRows[0]
    ? {
        id: latestStatementRows[0].id,
        purpose: latestStatementRows[0].purpose,
        createdAt:
          latestStatementRows[0].createdAt?.toISOString() ?? new Date().toISOString(),
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <HeroCard firstName={employee.firstName} assignments={assignments} />
      <BalanceStrip vacationHoursRemaining={vacationHoursRemaining} bonusYtdCents={bonusYtdCents} />
      <ActionStrip items={openItems.slice(0, 5)} />
      <DocumentsSection latestStatement={latestStatement} />
    </div>
  );
}
