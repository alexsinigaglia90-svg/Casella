// apps/web/features/employees/drawer/employee-drawer.tsx
"use client";

import type { EmployeeWithAddress } from "@casella/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LivePreviewCard } from "./wizard/components/live-preview-card";
import { EmployeeWizard } from "./wizard/employee-wizard";
import { emptyForm } from "./wizard/types";
import type { CreateEmployeeFormValues } from "./wizard/types";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function EmployeeDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";
  const editId = searchParams.get("id");
  const open = isCreateMode || !!editId;

  // Lift create-mode form + step so LivePreviewCard and Wizard share state
  const [form, setForm] = useState<CreateEmployeeFormValues>(emptyForm);
  const [step, setStep] = useState(0);

  // Edit-mode: client-fetched employee. T12 will swap this for a server prefetch.
  const [employee, setEmployee] = useState<EmployeeWithAddress | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) {
      setEmployee(null);
      setEmployeeError(null);
      return;
    }
    let cancelled = false;
    setLoadingEmployee(true);
    setEmployeeError(null);
    setEmployee(null);
    fetch(`/api/admin/employees/${editId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          setEmployeeError(body.message ?? `HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as EmployeeWithAddress;
        if (!cancelled) setEmployee(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setEmployeeError(e instanceof Error ? e.message : "Laden mislukt");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployee(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    params.delete("id");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function handleOpenChange(o: boolean) {
    if (!o) handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed right-0 top-0 left-auto translate-x-0 translate-y-0 h-screen rounded-none p-0 gap-0 max-w-none flex flex-col data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
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
        )}

        {editId && !isCreateMode && (
          <div className="h-full w-full">
            {loadingEmployee ? (
              <div
                className="p-8 text-sm"
                style={{ color: "var(--fg-secondary)" }}
              >
                Medewerker laden…
              </div>
            ) : employeeError ? (
              <div
                className="p-8 text-sm"
                style={{ color: "var(--accent-coral, #d9534f)" }}
              >
                {employeeError}
              </div>
            ) : employee ? (
              <EmployeeWizard
                mode="edit"
                employee={employee}
                onClose={handleClose}
                onSaved={() => router.refresh()}
              />
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
