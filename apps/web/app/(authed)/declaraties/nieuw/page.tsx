import { and, eq, getDb, schema } from "@casella/db";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <Link
          href="/declaraties"
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "var(--fg-tertiary)",
          }}
        >
          ← Declaraties
        </Link>
        <h1
          className="mt-3 font-display"
          style={{
            fontSize: "clamp(2.25rem, 3.5vw, 3rem)",
            fontWeight: 500,
            lineHeight: 1,
            color: "var(--fg-primary)",
          }}
        >
          <span>Een nieuw </span>
          <em>bonnetje</em>
        </h1>
        <p
          className="mt-2"
          style={{ fontSize: 14, color: "var(--fg-secondary)" }}
        >
          Sleep een foto van je bonnetje op de drop-zone of vul het formulier
          handmatig in.
        </p>
      </header>

      <ExpenseForm projects={assignedProjects} />
    </div>
  );
}
