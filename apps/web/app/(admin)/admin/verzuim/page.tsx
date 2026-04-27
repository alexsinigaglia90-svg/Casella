import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import {
  SickOverview,
  type SickOverviewItem,
} from "@/features/sick/admin/sick-overview";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminVerzuimPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const rows = await db
    .select({
      id: schema.leaveRequests.id,
      startDate: schema.leaveRequests.startDate,
      endDate: schema.leaveRequests.endDate,
      customPayload: schema.leaveRequests.customPayload,
      availabilityStatus: schema.leaveRequests.availabilityStatus,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      displayName: schema.users.displayName,
    })
    .from(schema.leaveRequests)
    .leftJoin(
      schema.employees,
      eq(schema.employees.id, schema.leaveRequests.employeeId),
    )
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(eq(schema.leaveRequests.type, "sick"))
    .orderBy(desc(schema.leaveRequests.startDate))
    .limit(200);

  const items: SickOverviewItem[] = rows.map((r) => {
    const fullName = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
    const payload = (r.customPayload as Record<string, unknown> | null) ?? {};
    return {
      id: r.id,
      employeeName: fullName || r.displayName || "Medewerker",
      startDate: r.startDate,
      endDate: r.endDate,
      expectedDurationDays:
        typeof payload["expectedDurationDays"] === "number"
          ? (payload["expectedDurationDays"] as number)
          : null,
      availabilityStatus: r.availabilityStatus,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Verzuim overzicht
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Read-only overzicht. Conform AVG bevat dit geen medische details.
        </p>
      </header>

      <SickOverview items={items} />
    </div>
  );
}
