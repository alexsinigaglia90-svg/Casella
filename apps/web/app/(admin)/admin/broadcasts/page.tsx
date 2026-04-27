import { desc, eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { BroadcastForm } from "@/features/broadcasts/admin/broadcast-form";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (diffMin < 1) return "zojuist";
  if (diffMin < 60) return `${Math.floor(diffMin)}m geleden`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}u geleden`;
  return `${Math.floor(diffMin / (60 * 24))}d geleden`;
}

export default async function AdminBroadcastsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();

  const [broadcasts, employeeRows] = await Promise.all([
    db
      .select({
        id: schema.broadcasts.id,
        message: schema.broadcasts.message,
        targetEmployeeIds: schema.broadcasts.targetEmployeeIds,
        createdAt: schema.broadcasts.createdAt,
        creatorName: schema.users.displayName,
      })
      .from(schema.broadcasts)
      .leftJoin(schema.users, eq(schema.users.id, schema.broadcasts.createdBy))
      .orderBy(desc(schema.broadcasts.createdAt))
      .limit(20),
    db
      .select({
        id: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        displayName: schema.users.displayName,
      })
      .from(schema.employees)
      .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
      .where(eq(schema.employees.employmentStatus, "active")),
  ]);

  const employees = employeeRows.map((e) => ({
    id: e.id,
    name:
      [e.firstName, e.lastName].filter(Boolean).join(" ").trim() || e.displayName || "Medewerker",
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--fg-primary)" }}>
          Berichten
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Stuur een bericht naar alle of specifieke medewerkers.
        </p>
      </header>

      <BroadcastForm employees={employees} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: "var(--fg-primary)" }}>
          Recente berichten
        </h2>
        {broadcasts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Nog geen berichten verstuurd.
          </p>
        ) : (
          <ul className="space-y-3">
            {broadcasts.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border p-4"
                style={{
                  background: "var(--surface-base)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--fg-primary)" }}>
                  {b.message}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--fg-tertiary)" }}>
                  {b.creatorName ?? "Admin"} ·{" "}
                  {b.targetEmployeeIds
                    ? `${b.targetEmployeeIds.length} medewerker(s)`
                    : "Iedereen"}{" "}
                  · {timeAgo(b.createdAt.toISOString())}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
