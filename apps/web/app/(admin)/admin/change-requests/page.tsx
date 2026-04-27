import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { ChangeRequestQueue } from "@/features/profile/change-request-queue";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminChangeRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const rows = await db
    .select({
      id: schema.employeeChangeRequests.id,
      type: schema.employeeChangeRequests.type,
      proposedValue: schema.employeeChangeRequests.proposedValue,
      status: schema.employeeChangeRequests.status,
      createdAt: schema.employeeChangeRequests.createdAt,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      displayName: schema.users.displayName,
    })
    .from(schema.employeeChangeRequests)
    .leftJoin(schema.employees, eq(schema.employees.id, schema.employeeChangeRequests.employeeId))
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(eq(schema.employeeChangeRequests.status, "pending"))
    .orderBy(desc(schema.employeeChangeRequests.createdAt));

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type as "address" | "iban",
    proposedValue: r.proposedValue as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    employeeName:
      [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.displayName || "Medewerker",
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--fg-primary)" }}>
          Wijzigingsverzoeken
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {items.length} openstaand{items.length === 1 ? "" : "e"} verzoek{items.length === 1 ? "" : "en"}.
        </p>
      </header>

      <ChangeRequestQueue items={items} />
    </div>
  );
}
