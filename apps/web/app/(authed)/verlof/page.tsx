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
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <header>
        <div
          className="mb-2 font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "var(--fg-tertiary)",
          }}
        >
          Mijn account · Verlof
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
            fontWeight: 500,
            lineHeight: 1,
            color: "var(--fg-primary)",
          }}
        >
          <span>Mijn </span>
          <em>verlof</em>
        </h1>
        <p
          className="mt-2"
          style={{ fontSize: 14, color: "var(--fg-secondary)" }}
        >
          Vraag verlof aan, bekijk je saldo en je geschiedenis.
        </p>
      </header>

      <section>
        <div className="mb-4">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--fg-tertiary)",
            }}
          >
            Mijn saldo
          </div>
          <h2
            className="mt-1.5 font-display"
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "var(--fg-primary)",
            }}
          >
            Per type — uren over
          </h2>
        </div>
        <LeaveBalanceCards
          balances={balances}
          weeklyHours={employee.contractedHoursPerWeek ?? 40}
        />
      </section>

      <LeaveForm />

      <section>
        <div className="mb-4">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--fg-tertiary)",
            }}
          >
            Geschiedenis
          </div>
          <h2
            className="mt-1.5 font-display"
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "var(--fg-primary)",
            }}
          >
            Mijn aanvragen
          </h2>
        </div>
        <LeaveList items={items} />
      </section>
    </div>
  );
}
