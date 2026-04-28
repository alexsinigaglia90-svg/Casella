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

  const activeCount = items.filter((i) => !i.endDate).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header>
        <div
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--fg-tertiary)",
          }}
        >
          Admin · verzuim · Wet Poortwachter
        </div>
        <h1
          className="mt-3 font-display"
          style={{
            fontSize: "clamp(2.4rem, 3vw, 3.5rem)",
            fontWeight: 500,
            lineHeight: 0.95,
            color: "var(--fg-primary)",
          }}
        >
          <span>Lopende </span>
          <em>case-files</em>
        </h1>
        <p
          className="mt-3 max-w-3xl text-sm"
          style={{ color: "var(--fg-secondary)" }}
        >
          {activeCount === 0
            ? "Geen lopende ziekmeldingen — fijn om te zien."
            : `${activeCount} ${activeCount === 1 ? "case" : "cases"} actief.`}{" "}
          Read-only overzicht. AVG-compliant: geen medische details, alleen
          mijlpaal-tracking volgens Wet Poortwachter.
        </p>
      </header>

      <SickOverview items={items} />
    </div>
  );
}
