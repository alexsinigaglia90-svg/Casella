import { and, desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { SickForm } from "@/features/sick/employee/sick-form";
import { SickList, type SickListItem } from "@/features/sick/employee/sick-list";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function VerzuimPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const rows = await db
    .select({
      id: schema.leaveRequests.id,
      startDate: schema.leaveRequests.startDate,
      endDate: schema.leaveRequests.endDate,
      customPayload: schema.leaveRequests.customPayload,
    })
    .from(schema.leaveRequests)
    .where(
      and(
        eq(schema.leaveRequests.employeeId, employee.id),
        eq(schema.leaveRequests.type, "sick"),
      ),
    )
    .orderBy(desc(schema.leaveRequests.startDate))
    .limit(50);

  const items: SickListItem[] = rows.map((r) => ({
    id: r.id,
    startDate: r.startDate,
    endDate: r.endDate,
    customPayload: (r.customPayload as Record<string, unknown> | null) ?? null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Verzuim
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Meld je ziek of beter. We registreren alleen wat nodig is — geen
          medische details (AVG).
        </p>
      </header>

      <SickForm />

      <section>
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Mijn ziekmeldingen
        </h2>
        <SickList items={items} />
      </section>
    </div>
  );
}
