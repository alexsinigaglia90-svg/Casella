"use client";

import type { AssignmentEnriched } from "@casella/types";
import { useRouter } from "next/navigation";

import { AssignmentWizard } from "./wizard/assignment-wizard";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Intercepted-route overlay rendered by `@modal/(.)[id]/page.tsx`.
 *
 * Mirrors `<AssignmentDrawer>` chrome (right-aligned full-height dialog) so the
 * visual transition between create-drawer and edit-drawer is seamless. Closing
 * routes via `router.back()` so the URL drops the `[id]` segment and the list
 * stays mounted underneath.
 */
export function InterceptedAssignmentEditDrawer({
  assignment,
  projects,
  employees,
}: {
  assignment: AssignmentEnriched;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
}) {
  const router = useRouter();

  function handleClose() {
    router.back();
  }

  function handleOpenChange(open: boolean) {
    if (!open) handleClose();
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed right-0 top-0 left-auto translate-x-0 translate-y-0 h-screen rounded-none p-0 gap-0 max-w-none flex flex-col data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        style={{
          width: "min(820px, 92vw)",
          boxShadow: "-40px 0 80px -20px rgba(14, 22, 33, 0.28)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <DialogTitle className="sr-only">
          {assignment.employeeName} → {assignment.projectName} bewerken
        </DialogTitle>
        <div className="flex-1 min-w-0 overflow-hidden h-full">
          <AssignmentWizard
            mode="edit"
            assignment={assignment}
            projects={projects}
            employees={employees}
            onClose={handleClose}
            onSaved={() => router.refresh()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
