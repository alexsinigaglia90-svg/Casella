import { and, desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { LeaveQueue } from "@/features/leave/admin/leave-queue";
import type { LeaveQueueItem } from "@/features/leave/admin/approve-card";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminVerlofPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const rows = await db
    .select({
      id: schema.leaveRequests.id,
      type: schema.leaveRequests.type,
      startDate: schema.leaveRequests.startDate,
      endDate: schema.leaveRequests.endDate,
      hours: schema.leaveRequests.hours,
      reason: schema.leaveRequests.reason,
      submittedAt: schema.leaveRequests.submittedAt,
      createdAt: schema.leaveRequests.createdAt,
      employeeFirstName: schema.employees.firstName,
      employeeLastName: schema.employees.lastName,
      userDisplayName: schema.users.displayName,
    })
    .from(schema.leaveRequests)
    .leftJoin(
      schema.employees,
      eq(schema.employees.id, schema.leaveRequests.employeeId),
    )
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(
      and(
        eq(schema.leaveRequests.status, "pending"),
      ),
    )
    .orderBy(desc(schema.leaveRequests.submittedAt));

  const items: LeaveQueueItem[] = rows.map((r) => {
    const fullName = [r.employeeFirstName, r.employeeLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return {
      id: r.id,
      type: r.type,
      employeeName: fullName || r.userDisplayName || "Medewerker",
      startDate: r.startDate,
      endDate: r.endDate,
      hours: r.hours,
      reason: r.reason,
      submittedAt: (r.submittedAt ?? r.createdAt).toISOString(),
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Verlof goedkeuren
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {items.length} openstaande aanvraag{items.length === 1 ? "" : "en"}.
        </p>
      </header>

      <LeaveQueue items={items} />
    </div>
  );
}
