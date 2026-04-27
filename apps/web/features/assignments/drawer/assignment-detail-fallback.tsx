"use client";

import type { AssignmentEnriched } from "@casella/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AssignmentWizard } from "./wizard/assignment-wizard";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";

/**
 * Full-page fallback for direct-link / share / refresh of
 * `/admin/toewijzingen/[id]` when the intercepting `@modal/(.)[id]` slot did
 * not catch the navigation (i.e. there is no list mounted underneath).
 *
 * Renders the same `<AssignmentWizard mode="edit">` as the drawer overlay so
 * functional parity is preserved — only the chrome differs.
 */
export function AssignmentDetailFallback({
  assignment,
  projects,
  employees,
}: {
  assignment: AssignmentEnriched;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
}) {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-[820px] py-12 px-6">
      <Link
        href="/admin/toewijzingen"
        className="text-sm hover:underline"
        style={{ color: "var(--fg-tertiary)" }}
      >
        ← Terug naar overzicht
      </Link>
      <h1 className="font-display mt-4 mb-8" style={{ fontSize: "1.6rem" }}>
        {assignment.employeeName} → {assignment.projectName}
      </h1>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-lift)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <AssignmentWizard
          mode="edit"
          assignment={assignment}
          projects={projects}
          employees={employees}
          onClose={() => router.push("/admin/toewijzingen")}
          onSaved={() => router.refresh()}
        />
      </div>
    </div>
  );
}
