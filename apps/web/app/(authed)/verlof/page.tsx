import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { LeaveBalanceCards } from "@/features/leave/employee/balance-cards";
import { LeaveForm } from "@/features/leave/employee/leave-form";
import {
  LeaveList,
  type LeaveListItem,
} from "@/features/leave/employee/leave-list";
import { getCurrentEmployee } from "@/lib/current-employee";
import { getLeaveBalances } from "@/lib/leave/balance";

export const dynamic = "force-dynamic";

export default async function VerlofPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const [requests, balances] = await Promise.all([
    db
      .select()
      .from(schema.leaveRequests)
      .where(eq(schema.leaveRequests.employeeId, employee.id))
      .orderBy(desc(schema.leaveRequests.submittedAt))
      .limit(50),
    getLeaveBalances(employee.id),
  ]);

  const items: LeaveListItem[] = requests
    .filter((r) => r.type !== "sick")
    .map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
      hours: r.hours,
      reason: r.reason,
      submittedAt: (r.submittedAt ?? r.createdAt).toISOString(),
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Verlof
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Vraag verlof aan, bekijk je saldo en je geschiedenis.
        </p>
      </header>

      <LeaveBalanceCards
        balances={balances}
        weeklyHours={employee.contractedHoursPerWeek ?? 40}
      />

      <LeaveForm />

      <section>
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Mijn aanvragen
        </h2>
        <LeaveList items={items} />
      </section>
    </div>
  );
}
