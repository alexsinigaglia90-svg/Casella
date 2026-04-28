import { desc, eq, getDb, schema } from "@casella/db";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  ExpenseList,
  type ExpenseListItem,
} from "@/features/expenses/employee/expense-list";
import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export default async function DeclaratiesPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();
  const claims = await db
    .select({
      id: schema.expenseClaims.id,
      category: schema.expenseClaims.category,
      isInternal: schema.expenseClaims.isInternal,
      amountCents: schema.expenseClaims.amountCents,
      date: schema.expenseClaims.date,
      description: schema.expenseClaims.description,
      status: schema.expenseClaims.status,
      receiptStoragePath: schema.expenseClaims.receiptStoragePath,
      rejectionReason: schema.expenseClaims.rejectionReason,
      submittedAt: schema.expenseClaims.submittedAt,
      projectId: schema.expenseClaims.projectId,
    })
    .from(schema.expenseClaims)
    .where(eq(schema.expenseClaims.employeeId, employee.id))
    .orderBy(desc(schema.expenseClaims.submittedAt))
    .limit(100);

  const projectIds = [
    ...new Set(claims.filter((c) => c.projectId).map((c) => c.projectId!)),
  ];
  const projectMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const projects = await db
      .select({ id: schema.projects.id, name: schema.projects.name })
      .from(schema.projects);
    for (const p of projects) projectMap.set(p.id, p.name);
  }

  const items: ExpenseListItem[] = claims.map((c) => ({
    id: c.id,
    category: c.category,
    projectName: c.projectId ? (projectMap.get(c.projectId) ?? null) : null,
    isInternal: c.isInternal,
    amountCents: c.amountCents,
    date: c.date,
    status: c.status,
    description: c.description,
    receiptStoragePath: c.receiptStoragePath,
    rejectionReason: c.rejectionReason,
    submittedAt: c.submittedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            className="mb-2 font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "var(--fg-tertiary)",
            }}
          >
            Mijn account · Declaraties
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
            <span>De </span>
            <em>stapel</em>
          </h1>
          <p
            className="mt-2"
            style={{ fontSize: 14, color: "var(--fg-secondary)" }}
          >
            Bonnetjes als objecten — sleep nieuwe op de drop-zone of bekijk de
            geschiedenis.
          </p>
        </div>
        <Link href="/declaraties/nieuw">
          <Button>Nieuwe declaratie</Button>
        </Link>
      </header>

      <ExpenseList items={items} />
    </div>
  );
}
