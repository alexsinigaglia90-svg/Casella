// apps/web/features/employees/drawer/employee-drawer.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NewEmployeeWizard } from "./wizard/new-employee-wizard";
import { LivePreviewCard } from "./wizard/components/live-preview-card";
import { useState } from "react";
import { emptyForm } from "./wizard/types";
import type { CreateEmployeeFormValues } from "./wizard/types";

export function EmployeeDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";
  const editId = searchParams.get("id");
  const open = isCreateMode || !!editId;

  // Lift form + step to this level so LivePreviewCard and Wizard share state
  const [form, setForm] = useState<CreateEmployeeFormValues>(emptyForm);
  const [step, setStep] = useState(0);

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    params.delete("id");
    router.push(`?${params.toString()}`);
  }

  function handleOpenChange(o: boolean) {
    if (!o) handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed right-0 top-0 h-screen rounded-none p-0 gap-0 max-w-none data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        style={{
          width: "min(1080px, 92vw)",
          boxShadow: "-40px 0 80px -20px rgba(14, 22, 33, 0.28)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <DialogTitle className="sr-only">
          {isCreateMode ? "Nieuwe medewerker" : "Medewerker bewerken"}
        </DialogTitle>

        {isCreateMode && (
          <div className="flex h-full w-full flex-row">
            {/* Left: live preview — hidden on small screens */}
            <div
              className="hidden md:block shrink-0 overflow-y-auto"
              style={{ width: 400, borderRight: "1px solid var(--border-subtle)" }}
            >
              <LivePreviewCard form={form} step={step} />
            </div>
            {/* Right: wizard */}
            <div className="flex-1 overflow-hidden">
              <NewEmployeeWizard
                onClose={handleClose}
                form={form}
                setForm={setForm}
                step={step}
                setStep={setStep}
              />
            </div>
          </div>
        )}

        {editId && (
          <p className="p-6">Edit-modus is WIP (volgt in volgende taak).</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
