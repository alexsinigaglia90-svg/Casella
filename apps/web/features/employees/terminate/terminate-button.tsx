"use client";

import { useState } from "react";
import { CriticalConfirmDialog } from "@/components/critical-confirm/critical-confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  employeeId: string;
  displayName: string;
  openAssignmentsCount: number;
  pendingHoursCount: number;
}

export function TerminateButton({
  employeeId,
  displayName,
  openAssignmentsCount,
  pendingHoursCount,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Dienstverband beëindigen
      </Button>
      <CriticalConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Dienstverband beëindigen: ${displayName}`}
        emphasisWord="beëindigen"
        confirmPhrase={displayName}
        confirmLabel="Plan beëindiging"
        reasonLabel="Reden (optioneel — intern)"
        impactSummary={
          <ul className="space-y-1">
            <li><strong>{openAssignmentsCount}</strong> open toewijzingen worden op de beëindigingsdatum mee-afgesloten (met bevestiging)</li>
            <li><strong>{pendingHoursCount}</strong> niet-goedgekeurde uren blijven staan voor admin-afhandeling</li>
            <li>Historische data + audit trail blijft behouden</li>
            <li>User wordt NIET automatisch uit Entra group verwijderd (handmatige admin-actie)</li>
          </ul>
        }
        onConfirm={async ({ scheduledAt, reason }) => {
          try {
            const res = await fetch(`/api/admin/employees/${employeeId}/initiate-terminate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: employeeId, pendingTerminationAt: scheduledAt, reason, confirmText: displayName }),
            });
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { message?: string };
              throw new Error(body.message ?? `HTTP ${res.status}`);
            }
            toast.success(`Beëindiging ingepland voor ${scheduledAt}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Mislukt");
            throw e;
          }
        }}
      />
    </>
  );
}
