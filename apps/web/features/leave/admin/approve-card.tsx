"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";

export interface LeaveQueueItem {
  id: string;
  type: string;
  employeeName: string;
  startDate: string;
  endDate: string | null;
  hours: string;
  reason: string | null;
  submittedAt: string;
}

function fmtSubmitted(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMin = Math.floor((now - d.getTime()) / 60_000);
  if (diffMin < 60) return `${diffMin} min geleden`;
  const hrs = Math.floor(diffMin / 60);
  if (hrs < 24) return `${hrs} uur geleden`;
  return `${Math.floor(hrs / 24)} dagen geleden`;
}

export function ApproveCard({ item }: { item: LeaveQueueItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const config = LEAVE_TYPES[item.type as LeaveTypeKey];
  const range = item.endDate
    ? `${item.startDate} t/m ${item.endDate}`
    : item.startDate;

  async function handleApprove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/verlof/${item.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Goedkeuren mislukt");
        return;
      }
      toast.success(`${item.employeeName}: verlof goedgekeurd`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (reason.trim().length < 1) {
      toast.error("Geef een reden voor afwijzing");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/verlof/${item.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Afwijzen mislukt");
        return;
      }
      toast.success(`${item.employeeName}: verlof afgewezen`);
      setRejectOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="rounded-xl border p-5 glass-card"
        style={{
          borderColor: "var(--border-subtle)",
          backgroundColor: "var(--surface-card)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div
              className="mb-1 font-mono text-[11px] uppercase tracking-wider"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {config?.label ?? item.type}
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--fg-primary)" }}
            >
              {item.employeeName}
            </h3>
            <div
              className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"
              style={{ color: "var(--fg-secondary)" }}
            >
              <span>{range}</span>
              <span style={{ color: "var(--fg-tertiary)" }}>·</span>
              <span className="tabular-nums">
                {Number(item.hours).toString().replace(".", ",")} uur
              </span>
              <span style={{ color: "var(--fg-tertiary)" }}>·</span>
              <span style={{ color: "var(--fg-tertiary)" }}>
                {fmtSubmitted(item.submittedAt)}
              </span>
            </div>
            {item.reason && (
              <p
                className="mt-2 text-sm italic"
                style={{ color: "var(--fg-secondary)" }}
              >
                &ldquo;{item.reason}&rdquo;
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
            >
              <X className="size-3.5" />
              Afwijzen
            </Button>
            <Button size="sm" disabled={busy} onClick={() => void handleApprove()}>
              <Check className="size-3.5" />
              {busy ? "…" : "Goedkeuren"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verlof afwijzen</DialogTitle>
            <DialogDescription>
              Geef de medewerker uitleg waarom de aanvraag is afgewezen.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Reden voor afwijzing"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={busy}
            >
              Annuleer
            </Button>
            <Button onClick={() => void handleReject()} disabled={busy}>
              Afwijzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
