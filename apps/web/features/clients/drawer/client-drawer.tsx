"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ClientWizard } from "./wizard/client-wizard";
import { emptyClientForm } from "./wizard/types";
import type { CreateClientFormValues } from "./wizard/types";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Create-only drawer for `/admin/klanten?new=1`.
 *
 * Edit-mode lives in the parallel + intercepting routes:
 *   - `app/(admin)/admin/klanten/[id]/page.tsx` (full-page fallback)
 *   - `app/(admin)/admin/klanten/@modal/(.)[id]/page.tsx` (drawer overlay)
 */
export function ClientDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";

  const [form, setForm] = useState<CreateClientFormValues>(emptyClientForm());
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
        <DialogTitle className="sr-only">Nieuwe klant</DialogTitle>

        <div className="flex-1 min-w-0 overflow-hidden h-full">
          <ClientWizard
            mode="create"
            onClose={handleClose}
            form={form}
            setForm={setForm}
            step={step}
            setStep={setStep}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
