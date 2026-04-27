// apps/web/features/employees/drawer/employee-drawer.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { LivePreviewCard } from "./wizard/components/live-preview-card";
import { EmployeeWizard } from "./wizard/employee-wizard";
import { emptyForm } from "./wizard/types";
import type { CreateEmployeeFormValues } from "./wizard/types";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Create-only drawer for `/admin/medewerkers?new=1`.
 *
 * Edit-mode lives in the parallel + intercepting routes (T12 / B-2):
 *   - `app/(admin)/admin/medewerkers/[id]/page.tsx` (full-page fallback)
 *   - `app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx` (drawer overlay)
 */
export function EmployeeDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";

  // Lift create-mode form + step so LivePreviewCard and Wizard share state
  const [form, setForm] = useState<CreateEmployeeFormValues>(emptyForm);
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
          width: "min(1080px, 92vw)",
          boxShadow: "-40px 0 80px -20px rgba(14, 22, 33, 0.28)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <DialogTitle className="sr-only">Nieuwe medewerker</DialogTitle>

        <div className="flex h-full w-full flex-row">
          {/* Left: live preview — hidden on small screens */}
          <div
            className="hidden md:block shrink-0 overflow-y-auto"
            style={{ width: 400, borderRight: "1px solid var(--border-subtle)" }}
          >
            <LivePreviewCard form={form} step={step} />
          </div>
          {/* Right: wizard. min-w-0 lets the flex child constrain itself
              so the inner wizard's flex-col can size its scrollable region
              correctly (otherwise inner overflow-y-auto won't activate). */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <EmployeeWizard
              mode="create"
              onClose={handleClose}
              form={form}
              setForm={setForm}
              step={step}
              setStep={setStep}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
