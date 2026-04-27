"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AssignmentWizard } from "./wizard/assignment-wizard";
import { emptyAssignmentForm } from "./wizard/types";
import type { CreateAssignmentFormValues } from "./wizard/types";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Create-only drawer for `/admin/toewijzingen?new=1`.
 *
 * Edit-mode lives in the parallel + intercepting routes:
 *   - `app/(admin)/admin/toewijzingen/[id]/page.tsx` (full-page fallback)
 *   - `app/(admin)/admin/toewijzingen/@modal/(.)[id]/page.tsx` (drawer overlay)
 */
export function AssignmentDrawer({
  projects,
  employees,
}: {
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";

  const [form, setForm] = useState<CreateAssignmentFormValues>(
    emptyAssignmentForm(),
  );
  const [step, setStep] = useState(0);

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function handleOpenChange(o: boolean) {
    if (!o) handleClose();
  }

  return (
    <Dialog open={isCreateMode} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed right-0 top-0 left-auto translate-x-0 translate-y-0 h-screen rounded-none p-0 gap-0 max-w-none flex flex-col data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        style={{
          width: "min(820px, 92vw)",
          boxShadow: "-40px 0 80px -20px rgba(14, 22, 33, 0.28)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <DialogTitle className="sr-only">Nieuwe toewijzing</DialogTitle>

        <div className="flex-1 min-w-0 overflow-hidden h-full">
          <AssignmentWizard
            mode="create"
            onClose={handleClose}
            form={form}
            setForm={setForm}
            step={step}
            setStep={setStep}
            projects={projects}
            employees={employees}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
