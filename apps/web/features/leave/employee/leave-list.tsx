"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";

export interface LeaveListItem {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  startDate: string;
  endDate: string | null;
  hours: string;
  reason: string | null;
  submittedAt: string;
}

const STATUS_COLORS: Record<LeaveListItem["status"], { bg: string; fg: string; label: string }> = {
  pending: {
    bg: "rgba(234, 179, 8, 0.15)",
    fg: "rgb(234, 179, 8)",
    label: "In behandeling",
  },
  approved: {
    bg: "rgba(34, 197, 94, 0.15)",
    fg: "rgb(34, 197, 94)",
    label: "Goedgekeurd",
  },
  rejected: {
    bg: "rgba(239, 68, 68, 0.15)",
    fg: "rgb(239, 68, 68)",
    label: "Afgewezen",
  },
  cancelled: {
    bg: "rgba(148, 163, 184, 0.15)",
    fg: "rgb(148, 163, 184)",
    label: "Geannuleerd",
  },
};

export function LeaveList({ items }: { items: LeaveListItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/verlof/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Annuleren mislukt");
        return;
      }
      toast.success("Aanvraag geannuleerd");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Nog geen verlofaanvragen.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const config = LEAVE_TYPES[item.type as LeaveTypeKey];
        const status = STATUS_COLORS[item.status];
        const canCancel = item.status === "pending" || item.status === "approved";
        const range = item.endDate
          ? `${item.startDate} → ${item.endDate}`
          : item.startDate;
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="text-sm font-medium"
                style={{ color: "var(--fg-primary)" }}
              >
                {config?.label ?? item.type}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {range} · {Number(item.hours).toString().replace(".", ",")} uur
              </div>
              {item.reason && (
                <div
                  className="mt-1 text-xs italic"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  {item.reason}
                </div>
              )}
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: status.bg, color: status.fg }}
            >
              {status.label}
            </span>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === item.id}
                onClick={() => void handleCancel(item.id)}
              >
                {busyId === item.id ? "…" : "Annuleer"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
