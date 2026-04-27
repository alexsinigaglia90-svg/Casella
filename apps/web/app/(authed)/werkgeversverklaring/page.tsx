import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { StatementForm } from "@/features/statements/employee/statement-form";
import {
  StatementList,
  type StatementListItem,
} from "@/features/statements/employee/statement-list";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function WerkgeversverklaringPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const rows = await db
    .select({
      id: schema.employerStatements.id,
      purpose: schema.employerStatements.purpose,
      status: schema.employerStatements.status,
      requestedAt: schema.employerStatements.requestedAt,
    })
    .from(schema.employerStatements)
    .where(eq(schema.employerStatements.employeeId, employee.id))
    .orderBy(desc(schema.employerStatements.requestedAt))
    .limit(50);

  const items: StatementListItem[] = rows.map((r) => ({
    id: r.id,
    purpose: r.purpose,
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Werkgeversverklaring
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Vraag een werkgeversverklaring aan voor hypotheek, huur of een ander doel. De verklaring wordt direct gegenereerd en ondertekend.
        </p>
      </header>

      <StatementForm />

      <section className="space-y-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Mijn verklaringen
        </h2>
        <StatementList items={items} />
      </section>
    </div>
  );
}
