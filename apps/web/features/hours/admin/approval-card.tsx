"use client";

import { Check, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const NL_DAY_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const NL_MONTH_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function fmtWeekRange(weekStartIso: string): string {
  const start = new Date(weekStartIso);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 4);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startPart = sameMonth
    ? `${NL_DAY_SHORT[start.getUTCDay()]} ${start.getUTCDate()}`
    : `${NL_DAY_SHORT[start.getUTCDay()]} ${start.getUTCDate()} ${NL_MONTH_SHORT[start.getUTCMonth()]}`;
  const endPart = `${NL_DAY_SHORT[end.getUTCDay()]} ${end.getUTCDate()} ${NL_MONTH_SHORT[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
  return `${startPart} — ${endPart}`;
}

function fmtTimeAgo(iso: string): string {
  const submittedAt = new Date(iso).getTime();
  const diffMs = Date.now() - submittedAt;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} uur geleden`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} dag${days === 1 ? "" : "en"} geleden`;
  const weeks = Math.floor(days / 7);
  return `${weeks} wk geleden`;
}

export interface ApprovalCardProps {
  employeeId: string;
  employeeName: string;
  weekStart: string;
  totalHours: number;
  entryCount: number;
  submittedAt: string;
  onReject: () => void;
}

export function ApprovalCard({
  employeeId,
  employeeName,
  weekStart,
  totalHours,
  entryCount,
  submittedAt,
  onReject,
}: ApprovalCardProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(
        `/api/admin/uren/${employeeId}/${weekStart}/approve`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Goedkeuren mislukt");
        return;
      }
      toast.success(`Week van ${employeeName} goedgekeurd`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-5 glass-card transition-colors"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="mb-1 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Week {fmtWeekRange(weekStart)}
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--fg-primary)" }}
          >
            {employeeName}
          </h3>
          <div
            className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            style={{ color: "var(--fg-secondary)" }}
          >
            <span className="tabular-nums">
              <span style={{ color: "var(--fg-primary)", fontWeight: 600 }}>
                {totalHours.toFixed(2).replace(".", ",")}
              </span>{" "}
              uur totaal
            </span>
            <span style={{ color: "var(--fg-tertiary)" }}>·</span>
            <span>
              {entryCount} {entryCount === 1 ? "regel" : "regels"}
            </span>
            <span style={{ color: "var(--fg-tertiary)" }}>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} style={{ color: "var(--fg-tertiary)" }} />
              {fmtTimeAgo(submittedAt)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={approving}
          >
            <X className="size-3.5" />
            Afwijzen
          </Button>
          <Button size="sm" onClick={() => void handleApprove()} disabled={approving}>
            <Check className="size-3.5" />
            {approving ? "Goedkeuren…" : "Goedkeuren"}
          </Button>
        </div>
      </div>
    </div>
  );
}
