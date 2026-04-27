"use client";

import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ApprovalCard } from "./approval-card";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PendingItem {
  employeeId: string;
  employeeName: string;
  weekStart: string;
  totalHours: number;
  entryCount: number;
  submittedAt: string;
}

interface ApprovalListProps {
  rows: PendingItem[];
}

export function ApprovalList({ rows }: ApprovalListProps) {
  const router = useRouter();
  const [rejectTarget, setRejectTarget] = useState<PendingItem | null>(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  async function confirmReject() {
    if (!rejectTarget) return;
    if (reason.trim().length === 0) {
      toast.error("Geef een reden voor de afwijzing");
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(
        `/api/admin/uren/${rejectTarget.employeeId}/${rejectTarget.weekStart}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Afwijzen mislukt");
        return;
      }
      toast.success(`Week van ${rejectTarget.employeeName} afgewezen`);
      setRejectTarget(null);
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setRejecting(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border p-12 text-center glass-card"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Inbox size={28} style={{ color: "var(--fg-tertiary)" }} />
        <p className="font-display" style={{ fontSize: "var(--text-title)" }}>
          Geen <em>openstaande uren</em>
        </p>
        <p className="max-w-md text-sm" style={{ color: "var(--fg-secondary)" }}>
          Alle ingediende weken zijn afgehandeld. Nieuwe inzendingen
          verschijnen hier zodra medewerkers ze versturen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((row) => (
          <ApprovalCard
            key={`${row.employeeId}__${row.weekStart}`}
            employeeId={row.employeeId}
            employeeName={row.employeeName}
            weekStart={row.weekStart}
            totalHours={row.totalHours}
            entryCount={row.entryCount}
            submittedAt={row.submittedAt}
            onReject={() => {
              setRejectTarget(row);
              setReason("");
            }}
          />
        ))}
      </div>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Week afwijzen</DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>
                  Geef aan waarom je de week van{" "}
                  <strong>{rejectTarget.employeeName}</strong> afwijst. De
                  medewerker ziet deze reden en kan de uren aanpassen en
                  opnieuw versturen.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label
              htmlFor="reject-reason"
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Reden voor afwijzing
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Bijv. uren niet conform afspraak — controleer dinsdag"
              className="w-full rounded border bg-transparent p-2 text-sm outline-none focus:border-fg-primary"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--fg-primary)",
              }}
            />
            <div
              className="mt-1 text-right text-[10px]"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {reason.length}/500
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setReason("");
              }}
              disabled={rejecting}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmReject()}
              disabled={rejecting || reason.trim().length === 0}
            >
              {rejecting ? "Afwijzen…" : "Bevestig afwijzen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
