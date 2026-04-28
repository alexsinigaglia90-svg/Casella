"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LEAVE_TYPE_HUES } from "@/lib/leave/type-hues";
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

interface StatusMeta {
  label: string;
  fg: string;
  bg: string;
  icon: string;
}

const STATUS_META: Record<LeaveListItem["status"], StatusMeta> = {
  pending: {
    label: "In behandeling",
    fg: "oklch(0.40 0.18 50)",
    bg: "oklch(0.96 0.06 50)",
    icon: "·",
  },
  approved: {
    label: "Goedgekeurd",
    fg: "oklch(0.40 0.18 145)",
    bg: "oklch(0.95 0.06 145)",
    icon: "✓",
  },
  rejected: {
    label: "Afgewezen",
    fg: "oklch(0.45 0.20 25)",
    bg: "oklch(0.96 0.06 25)",
    icon: "✕",
  },
  cancelled: {
    label: "Geannuleerd",
    fg: "var(--fg-tertiary)",
    bg: "var(--surface-lift)",
    icon: "○",
  },
};

function ReqStatusPill({ status }: { status: LeaveListItem["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono uppercase"
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.1em",
        background: meta.bg,
        color: meta.fg,
      }}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

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
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
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
        className="rounded-2xl border p-8 text-center text-sm"
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
        const hue =
          LEAVE_TYPE_HUES[item.type as LeaveTypeKey] ?? 240;
        const canCancel =
          item.status === "pending" || item.status === "approved";
        const range = item.endDate
          ? `${item.startDate} → ${item.endDate}`
          : item.startDate;
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-card)",
            }}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg"
              style={{
                background: `oklch(0.92 0.06 ${hue})`,
                color: `oklch(0.35 0.18 ${hue})`,
                fontSize: 12,
              }}
              aria-hidden
            >
              ◇
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-sm font-medium"
                style={{ color: "var(--fg-primary)" }}
              >
                {config?.label ?? item.type}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 11, color: "var(--fg-tertiary)" }}
              >
                {range} ·{" "}
                <span className="tabular-nums">
                  {Number(item.hours).toString().replace(".", ",")}u
                </span>
              </div>
              {item.reason && (
                <div
                  className="mt-1 italic"
                  style={{ fontSize: 12, color: "var(--fg-tertiary)" }}
                >
                  {item.reason}
                </div>
              )}
            </div>
            <ReqStatusPill status={item.status} />
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
