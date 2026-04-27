"use client";

import type { EmployeeWithAddress } from "@casella/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { EmployeeWizard } from "./wizard/employee-wizard";

/**
 * Full-page fallback for direct-link / share / refresh of
 * `/admin/medewerkers/[id]` when the intercepting `@modal/(.)[id]` slot did
 * not catch the navigation (i.e. there is no list mounted underneath).
 *
 * Renders the same `<EmployeeWizard mode="edit">` as the drawer overlay so
 * functional parity is preserved — only the chrome differs.
 */
export function EmployeeDetailFallback({
  employee,
}: {
  employee: EmployeeWithAddress;
}) {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-[820px] py-12 px-6">
      <Link
        href="/admin/medewerkers"
        className="text-sm hover:underline"
        style={{ color: "var(--fg-tertiary)" }}
      >
        ← Terug naar overzicht
      </Link>
      <h1 className="font-display mt-4 mb-8" style={{ fontSize: "1.6rem" }}>
        {employee.firstName ?? ""} {employee.lastName ?? ""}
      </h1>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-lift)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <EmployeeWizard
          mode="edit"
          employee={employee}
          onClose={() => router.push("/admin/medewerkers")}
          onSaved={() => router.refresh()}
        />
      </div>
    </div>
  );
}
