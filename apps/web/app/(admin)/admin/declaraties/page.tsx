import { eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import {
  ExpenseQueue,
  type ExpenseQueueItem,
} from "@/features/expenses/admin/expense-queue";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminDeclaratiesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const claims = await db
    .select({
      id: schema.expenseClaims.id,
      category: schema.expenseClaims.category,
      isInternal: schema.expenseClaims.isInternal,
      amountCents: schema.expenseClaims.amountCents,
      date: schema.expenseClaims.date,
      description: schema.expenseClaims.description,
      receiptStoragePath: schema.expenseClaims.receiptStoragePath,
      projectId: schema.expenseClaims.projectId,
      submittedAt: schema.expenseClaims.submittedAt,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      displayName: schema.users.displayName,
    })
    .from(schema.expenseClaims)
    .innerJoin(schema.employees, eq(schema.expenseClaims.employeeId, schema.employees.id))
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.expenseClaims.status, "submitted"))
    .orderBy(schema.expenseClaims.submittedAt);

  // Fetch project names
  const projectIds = [...new Set(claims.filter((c) => c.projectId).map((c) => c.projectId!))] ;
  const projectMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const projects = await db
      .select({ id: schema.projects.id, name: schema.projects.name })
      .from(schema.projects);
    for (const p of projects) projectMap.set(p.id, p.name);
  }

  const items: ExpenseQueueItem[] = claims.map((c) => ({
    id: c.id,
    employeeName:
      c.displayName ??
      (c.firstName ? `${c.firstName} ${c.lastName ?? ""}`.trim() : "Onbekend"),
    category: c.category,
    amountCents: c.amountCents,
    date: c.date,
    description: c.description,
    receiptStoragePath: c.receiptStoragePath,
    projectName: c.projectId ? (projectMap.get(c.projectId) ?? null) : null,
    isInternal: c.isInternal,
    submittedAt: c.submittedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Declaraties goedkeuren
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {items.length} openstaande declaratie{items.length !== 1 ? "s" : ""}.
        </p>
      </header>

      <ExpenseQueue items={items} />
    </div>
  );
}
