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

  const hasActive = items.some((i) => i.endDate === null);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <div
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--fg-tertiary)",
          }}
        >
          Mijn verzuim · vertrouwelijk
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
          {hasActive ? (
            <>
              <span>Hoe gaat het </span>
              <em>met je</em>?
            </>
          ) : (
            <>
              <span>Beterschap, </span>
              <em>als het even moet</em>
            </>
          )}
        </h1>
        <p
          className="mt-3 max-w-2xl"
          style={{ fontSize: 13, color: "var(--fg-secondary)" }}
        >
          Meld je ziek of beter. We registreren alleen wat nodig is — geen
          medische details (AVG-compliant).
        </p>
      </header>

      <SickList items={items} />

      {!hasActive && <SickForm />}
    </div>
  );
}
