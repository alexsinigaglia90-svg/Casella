import { and, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ExpenseForm } from "@/features/expenses/employee/expense-form";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function NieuweDeclaratiePage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const assignedProjects = await db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
    })
    .from(schema.projectAssignments)
    .innerJoin(
      schema.projects,
      and(
        eq(schema.projectAssignments.projectId, schema.projects.id),
        eq(schema.projects.status, "active"),
      ),
    )
    .where(eq(schema.projectAssignments.employeeId, employee.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <div className="mb-1 flex items-center gap-2">
          <Link
            href="/declaraties"
            className="text-sm"
            style={{ color: "var(--fg-tertiary)" }}
          >
            ← Declaraties
          </Link>
        </div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Nieuwe declaratie
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Dien een kostendeclaratie in ter goedkeuring.
        </p>
      </header>

      <ExpenseForm projects={assignedProjects} />
    </div>
  );
}
