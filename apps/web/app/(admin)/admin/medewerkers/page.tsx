import { listEmployees } from "./queries";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import type { EmploymentStatus } from "@casella/types";
import type { Route } from "next";
import { EmployeeDrawer } from "@/features/employees/drawer/employee-drawer";

const VALID_STATUS = new Set(["active", "on_leave", "sick", "terminated", "all"]);

export default async function MedewerkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status && VALID_STATUS.has(params.status)
      ? (params.status as EmploymentStatus | "all")
      : undefined;

  const { rows, nextCursor } = await listEmployees({
    search: params.q,
    status,
    cursor: params.cursor,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-display">
          <span>Mede</span>
          <em>werkers</em>
        </h1>
        <Button asChild>
          <Link href={"/admin/medewerkers?new=1" as Route}>+ Nieuwe medewerker</Link>
        </Button>
      </header>

      <div className="rounded-lg border border-border glass-card">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="font-display text-title">
              Nog geen <em>medewerkers</em>
            </p>
            <p className="text-sm text-text-secondary">
              Begin door iemand uit te nodigen voor Casella — ze krijgen toegang
              zodra ze voor &apos;t eerst inloggen.
            </p>
            <Button asChild>
              <Link href={"/admin/medewerkers?new=1" as Route}>+ Nieuwe medewerker</Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="p-3 text-left">Naam</th>
                <th className="p-3 text-left">E-mail</th>
                <th className="p-3 text-left">Functie</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Startdatum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-surface-deep transition-colors duration-quick ease-standard"
                >
                  <td className="p-3">
                    <Link
                      href={`/admin/medewerkers?id=${r.id}` as Route}
                      className="hover:underline"
                    >
                      {r.displayName}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs text-text-secondary">{r.email}</td>
                  <td className="p-3 text-text-secondary">{r.jobTitle ?? "—"}</td>
                  <td className="p-3">
                    <EmploymentBadge status={r.employmentStatus} />
                  </td>
                  <td className="p-3 font-mono text-xs tabular-nums">{r.startDate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={`/admin/medewerkers?cursor=${nextCursor}` as Route}>
              Laad meer
            </Link>
          </Button>
        </div>
      )}

      <Suspense fallback={null}>
        <EmployeeDrawer />
      </Suspense>
    </div>
  );
}

function EmploymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Actief", cls: "bg-status-success/15 text-status-success" },
    on_leave: { label: "Afwezig", cls: "bg-status-pending/15 text-status-pending" },
    sick: { label: "Ziek", cls: "bg-status-attention/15 text-status-attention" },
    terminated: { label: "Uit dienst", cls: "bg-status-danger/15 text-status-danger" },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
