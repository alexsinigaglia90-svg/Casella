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

  // Fetch project names for non-internal claims
  const projectIds = [...new Set(claims.filter((c) => c.projectId).map((c) => c.projectId!))] ;
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
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--fg-primary)" }}
          >
            Declaraties
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
            Overzicht van jouw kostendeclaraties.
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
